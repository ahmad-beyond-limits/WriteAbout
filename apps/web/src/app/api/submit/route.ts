import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { text, image, image_url, timeLeft, apiKey, userId, model } = data;
    const resolvedImage = image || image_url || '';

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Use provided apiKey or fallback to env
    const groqKey = apiKey || process.env.GROQ_API_KEY;
    if (!groqKey || !groqKey.trim()) {
      return NextResponse.json({
        success: false,
        error: 'No Groq API Key found. Please add your Groq API key in the API Key settings.'
      }, { status: 400 });
    }

    // Read the system prompt (with multi-path discovery and built-in fallback)
    let systemPrompt = '';
    const potentialPaths = [
      path.join(process.cwd(), 'write-about-md'),
      path.join(process.cwd(), 'apps/web/write-about-md'),
      path.join(__dirname, '../../../../write-about-md'),
      path.join(__dirname, '../../write-about-md')
    ];

    for (const p of potentialPaths) {
      if (fs.existsSync(p)) {
        try {
          systemPrompt = fs.readFileSync(p, 'utf-8');
          if (systemPrompt) break;
        } catch (e) {}
      }
    }

    if (!systemPrompt) {
      systemPrompt = `You are an expert evaluator for the Duolingo English Test (DET) "Write About the Photo" task.
Assess the candidate's written response and return a JSON object with:
1. "rating": one of ["low", "medium", "good", "high", "excellent"]
2. "feedback": concise diagnostic feedback (2-3 sentences max).
Return ONLY JSON: { "rating": "...", "feedback": "..." }`;
    }

    // Default to Qwen model if not specified
    const modelName = model || process.env.GROQ_MODEL_NAME || 'qwen/qwen-2.5-72b-instruct';

    // Determine if the selected model is vision-capable
    const isLikelyVisionModel = (
      modelName.toLowerCase().includes('vision') ||
      modelName.toLowerCase().includes('vl') ||
      modelName.toLowerCase().includes('qwen3.8') ||
      modelName.toLowerCase().includes('llava')
    );

    let directImageUrl = '';
    if (resolvedImage && isLikelyVisionModel && resolvedImage.startsWith('http')) {
      try {
        const headRes = await fetch(resolvedImage, { method: 'HEAD', redirect: 'follow' });
        directImageUrl = headRes.url || resolvedImage;
      } catch {
        directImageUrl = resolvedImage;
      }
    }

    const buildMessages = (useVision: boolean) => {
      if (useVision && directImageUrl) {
        return [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please evaluate this candidate's description according to the image and DET scoring rubric:\n\n"${text}"`
              },
              {
                type: 'image_url',
                image_url: {
                  url: directImageUrl
                }
              }
            ]
          }
        ];
      }
      return [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please evaluate this description of the image:\n\n"${text}"` }
      ];
    };

    // ── 1. Primary Request to Groq using User's API Key ──
    let groqRes: Response;
    try {
      groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          messages: buildMessages(isLikelyVisionModel),
          temperature: 0.2,
          max_completion_tokens: 2048
        })
      });

      // If vision request failed due to media/modality error (e.g. 400), gracefully retry with text fallback
      if (!groqRes.ok && isLikelyVisionModel && groqRes.status === 400) {
        const errCloned = await groqRes.clone().text();
        if (errCloned.includes('media') || errCloned.includes('image') || errCloned.includes('modality') || errCloned.includes('vision')) {
          console.warn('Vision payload rejected by Groq, retrying with language-only payload...');
          groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey.trim()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: modelName,
              messages: buildMessages(false),
              temperature: 0.2,
              max_completion_tokens: 2048
            })
          });
        }
      }
    } catch (networkErr: any) {
      console.error('Groq fetch network error:', networkErr);
      return NextResponse.json({
        success: false,
        error: `Network error connecting to Groq AI (${networkErr?.message || 'Connection refused'}). Check your internet connection.`
      }, { status: 502 });
    }

    if (!groqRes.ok) {
      const errorText = await groqRes.text();
      console.error('Groq API Error Status:', groqRes.status, 'Body:', errorText);

      let parsedErrorMessage = `Groq API Error (${groqRes.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          parsedErrorMessage = errorJson.error.message;
        }
      } catch {}

      if (groqRes.status === 401) {
        parsedErrorMessage = 'Invalid Groq API Key. Please verify your API key in Settings or API Key section.';
      } else if (groqRes.status === 429) {
        parsedErrorMessage = `Rate limit exceeded for model "${modelName}". Please wait a moment or choose another model.`;
      } else if (groqRes.status === 404) {
        parsedErrorMessage = `Model "${modelName}" was not found or is currently unavailable on Groq.`;
      }

      return NextResponse.json({
        success: false,
        error: parsedErrorMessage,
        details: errorText
      }, { status: groqRes.status || 500 });
    }

    const groqData = await groqRes.json();
    let rawResponse = groqData.choices?.[0]?.message?.content;

    if (!rawResponse || !rawResponse.trim()) {
      return NextResponse.json({
        success: false,
        error: `The AI model (${modelName}) returned an empty response. Please retry.`
      }, { status: 502 });
    }

    // Parse JSON from LLM
    let parsedData: { rating?: string; feedback?: string } | null = null;
    try {
      let cleanContent = rawResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      cleanContent = cleanContent.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanContent);
    } catch (e) {
      console.warn('Direct JSON parse failed, attempting regex extraction from:', rawResponse);
      const ratingMatch = rawResponse.match(/"rating"\s*:\s*"([^"]+)"/i);
      const feedbackMatch = rawResponse.match(/"feedback"\s*:\s*"([\s\S]*?)(?:"|$)/i);
      if (ratingMatch || feedbackMatch) {
        parsedData = {
          rating: ratingMatch ? ratingMatch[1] : undefined,
          feedback: feedbackMatch ? feedbackMatch[1].trim().replace(/"\s*}\s*$/, '').replace(/"$/, '').trim() : undefined
        };
      }
    }

    if (!parsedData || (!parsedData.rating && !parsedData.feedback)) {
      return NextResponse.json({
        success: false,
        error: `Failed to extract evaluation rating from model (${modelName}). Response format was unrecognized.`
      }, { status: 422 });
    }

    // Ensure valid rating
    const validRatings = ['low', 'medium', 'good', 'high', 'excellent'];
    const rate = parsedData.rating && validRatings.includes(parsedData.rating.toLowerCase())
      ? parsedData.rating.toLowerCase()
      : 'medium';
    const feedback = parsedData.feedback || 'Evaluation completed without specific feedback comments.';
    const wordCount = text.trim().split(/\s+/).filter((w: string) => w.length > 0).length;

    // Insert into Postgres only when evaluation genuinely succeeded
    try {
      await pool.query(
        'INSERT INTO practices (image_url, text, rate, feedback, user_id) VALUES ($1, $2, $3, $4, $5)',
        [resolvedImage, text, rate, feedback, userId]
      );

      await pool.query(
        'INSERT INTO api_calls (endpoint, user_id) VALUES ($1, $2)',
        ['/api/submit', userId]
      );
    } catch (dbError) {
      console.error('Database insertion error:', dbError);
    }

    // ── 2. Independent Secondary Analysis using Environment Groq Key ──
    const envGroqKey = process.env.GROQ_API_KEY || groqKey;
    const sentenceMatches = text.match(/[^.!?]+[.!?]+/g) || (text.trim().length > 0 ? [text] : []);
    const calculatedSentences = Math.max(1, sentenceMatches.length);

    let levelAnalysis = {
      totalWords: wordCount,
      totalSentences: calculatedSentences,
      level1: Math.min(5, Math.max(1, Math.ceil(wordCount / 10))), // Basic wording output (1-5)
      level2: 3, // Little understanding of image + level 1 (1-5)
      level3: 3, // Descriptive adjectives + level 2 + level 1 (1-5)
      level4: 3  // Punctuation & syntax + level 1 + level 2 + level 3 (1-5)
    };

    if (envGroqKey) {
      try {
        // Read competence prompt template from competence-levels.md
        let competenceTemplate = '';
        const competencePaths = [
          path.join(process.cwd(), 'competence-levels.md'),
          path.join(process.cwd(), 'apps/web/competence-levels.md'),
          path.join(__dirname, '../../../../competence-levels.md'),
          path.join(__dirname, '../../competence-levels.md')
        ];

        for (const cp of competencePaths) {
          if (fs.existsSync(cp)) {
            try {
              competenceTemplate = fs.readFileSync(cp, 'utf-8');
              if (competenceTemplate) break;
            } catch (e) {}
          }
        }

        let envPrompt = '';
        if (competenceTemplate) {
          envPrompt = competenceTemplate
            .replace(/\{\{TEXT\}\}/g, text)
            .replace(/\{\{TOTAL_WORDS\}\}/g, String(wordCount))
            .replace(/\{\{TOTAL_SENTENCES\}\}/g, String(calculatedSentences));
        } else {
          envPrompt = `You are a strict DET scoring evaluator.
Analyze the following student writing about the image:
"${text}"

Evaluate and score across these 4 cumulative levels on a scale of 1 to 5:
- level1 (1 to 5): Basic writing volume and raw word production (even ignoring spelling/grammar).
- level2 (1 to 5): Basic scene comprehension & image subject understanding (includes level 1).
- level3 (1 to 5): Use of descriptive adjectives, sensory vocabulary, and colorful words (includes level 1 & 2).
- level4 (1 to 5): Proper punctuation (commas, periods, capitalization) and grammatical sentence structure (includes levels 1, 2, & 3).

Return ONLY valid JSON:
{
  "totalWords": ${wordCount},
  "totalSentences": ${calculatedSentences},
  "level1": 1-5,
  "level2": 1-5,
  "level3": 1-5,
  "level4": 1-5
}`;
        }

        const secondaryRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${envGroqKey.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: envPrompt }],
            temperature: 0.1,
            max_completion_tokens: 500
          })
        });

        if (secondaryRes.ok) {
          const secData = await secondaryRes.json();
          let secContent = secData.choices[0]?.message?.content || '';
          secContent = secContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
          secContent = secContent.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsedSec = JSON.parse(secContent);
          levelAnalysis = {
            totalWords: parsedSec.totalWords || wordCount,
            totalSentences: parsedSec.totalSentences || calculatedSentences,
            level1: Math.min(5, Math.max(1, Number(parsedSec.level1) || 3)),
            level2: Math.min(5, Math.max(1, Number(parsedSec.level2) || 3)),
            level3: Math.min(5, Math.max(1, Number(parsedSec.level3) || 3)),
            level4: Math.min(5, Math.max(1, Number(parsedSec.level4) || 3))
          };
        }
      } catch (secErr) {
        console.error('Secondary environmental analysis skipped:', secErr);
      }
    }

    const responsePayload = {
      wordCount,
      rate,
      feedback,
      totalSentences: levelAnalysis.totalSentences,
      levels: {
        level1: levelAnalysis.level1,
        level2: levelAnalysis.level2,
        level3: levelAnalysis.level3,
        level4: levelAnalysis.level4
      }
    };

    return NextResponse.json({
      success: true,
      analysis: responsePayload,
      data: responsePayload
    }, { status: 200 });

  } catch (error: any) {
    console.error('Submit API Error:', error);
    return NextResponse.json({
      success: false,
      error: `Internal server error during evaluation: ${error?.message || 'Unknown error'}`
    }, { status: 500 });
  }
}
