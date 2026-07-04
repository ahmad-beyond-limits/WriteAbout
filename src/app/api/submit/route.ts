import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { text, image, timeLeft, apiKey } = data;

    // Use provided apiKey or fallback to env
    const cerebrasKey = apiKey || process.env.CEREBRAS_API_KEY;
    if (!cerebrasKey) {
      return NextResponse.json({ success: false, error: 'No API Key provided' }, { status: 400 });
    }

    // Read the system prompt
    let systemPrompt = '';
    try {
      systemPrompt = fs.readFileSync(path.join(process.cwd(), 'write-about-md'), 'utf-8');
    } catch (e) {
      console.error('Failed to read write-about-md', e);
      return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }

    const modelName = process.env.CEREBRAS_MODEL_NAME || 'llama3.1-70b';

    // Make request to Cerebras
    const cerebrasRes = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cerebrasKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please evaluate this description of the image:\n\n"${text}"` }
        ],
        temperature: 0.2
      })
    });

    if (!cerebrasRes.ok) {
      const errorText = await cerebrasRes.text();
      console.error('Cerebras API Error:', errorText);
      return NextResponse.json({ success: false, error: 'Cerebras API Error' }, { status: 500 });
    }

    const cerebrasData = await cerebrasRes.json();
    let rawResponse = cerebrasData.choices[0].message.content;

    // Parse JSON from LLM
    let parsedData = { rating: 'low', feedback: 'Failed to parse AI response.' };
    try {
      // Clean up markdown block if present
      rawResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(rawResponse);
    } catch (e) {
      console.error('Failed to parse LLM JSON:', rawResponse);
      // Fallback fallback
    }

    // Ensure valid rating
    const validRatings = ['low', 'medium', 'good', 'high', 'excellent'];
    const rate = validRatings.includes(parsedData.rating?.toLowerCase()) ? parsedData.rating.toLowerCase() : 'medium';
    const feedback = parsedData.feedback || 'No feedback provided.';
    const wordCount = text.trim().split(/\s+/).filter((w: string) => w.length > 0).length;

    // Insert into Postgres
    try {
      await pool.query(
        'INSERT INTO practices (image_url, text, rate, feedback) VALUES ($1, $2, $3, $4)',
        [image, text, rate, feedback]
      );

      // Log the API call
      await pool.query(
        'INSERT INTO api_calls (endpoint) VALUES ($1)',
        ['/api/submit']
      );
    } catch (dbError) {
      console.error('Database insertion error:', dbError);
    }

    return NextResponse.json({
      success: true,
      analysis: {
        wordCount,
        rate,
        feedback
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Submit API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process submission' }, { status: 500 });
  }
}
