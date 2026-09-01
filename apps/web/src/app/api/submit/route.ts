import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { text, image, image_url, timeLeft, apiKey, userId } = data;
    const resolvedImage = image || image_url || '';

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Use provided apiKey or fallback to env
    const groqKey = apiKey || process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ success: false, error: 'No API Key provided' }, { status: 400 });
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

    const modelName = process.env.GROQ_MODEL_NAME || 'qwen/qwen3.6-27b';

    // ── 1. Primary Request to Groq using User's API Key (Original Logic) ──
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please evaluate this description of the image:\n\n"${text}"` }
        ],
        temperature: 0.2,
        max_completion_tokens: 2048
      })
    });

    if (!groqRes.ok) {
      const errorText = await groqRes.text();
      console.error('Groq API Error:', errorText);
      return NextResponse.json({ success: false, error: 'Groq API Error' }, { status: 500 });
    }

    const groqData = await groqRes.json();
    let rawResponse = groqData.choices[0].message.content;

    // Parse JSON from LLM
    let parsedData = { rating: 'low', feedback: 'Failed to parse AI response.' };
    try {
      rawResponse = rawResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      rawResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(rawResponse);
    } catch (e) {
      console.error('Failed to parse LLM JSON:', rawResponse);
      const ratingMatch = rawResponse.match(/"rating"\s*:\s*"([^"]+)"/i);
      const feedbackMatch = rawResponse.match(/"feedback"\s*:\s*"([\s\S]*?)(?:"|$)/i);
      if (ratingMatch) parsedData.rating = ratingMatch[1];
      if (feedbackMatch) {
        let fb = feedbackMatch[1].trim().replace(/"\s*}\s*$/, '').replace(/"$/, '').trim();
        parsedData.feedback = fb || 'Failed to parse AI response.';
      }
    }

    // Ensure valid rating
    const validRatings = ['low', 'medium', 'good', 'high', 'excellent'];
    const rate = validRatings.includes(parsedData.rating?.toLowerCase()) ? parsedData.rating.toLowerCase() : 'medium';
    const feedback = parsedData.feedback || 'No feedback provided.';
    const wordCount = text.trim().split(/\s+/).filter((w: string) => w.length > 0).length;

    // Insert into Postgres (Original Logic)
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
        const envPrompt = `You are a strict DET scoring evaluator.
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

        const secondaryRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${envGroqKey}`,
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

  } catch (error) {
    console.error('Submit API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process submission' }, { status: 500 });
  }
}
