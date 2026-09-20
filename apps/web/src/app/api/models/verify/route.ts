import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

function decryptApiKey(encryptedText: string): string | null {
  try {
    const textParts = encryptedText.split(':');
    if (textParts.length < 2) return null;
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedData = Buffer.from(textParts.join(':'), 'hex');
    const key = crypto.scryptSync(
      process.env.ENCRYPTION_KEY || 'a_very_secure_secret_key_32_bytes_long!!',
      'salt',
      32
    );
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { model, apiKey: bodyKey, userId } = body;

    if (!model || !model.trim()) {
      return NextResponse.json({ success: false, valid: false, error: 'Model ID is required' }, { status: 400 });
    }

    // Resolve API key
    let apiKey = '';
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7).trim();
    } else if (bodyKey && bodyKey.trim()) {
      apiKey = bodyKey.trim();
    } else if (userId) {
      try {
        const userRes = await pool.query('SELECT api_key FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length > 0 && userRes.rows[0].api_key) {
          const decrypted = decryptApiKey(userRes.rows[0].api_key);
          if (decrypted) apiKey = decrypted;
        }
      } catch {}
    }

    if (!apiKey) {
      apiKey = process.env.GROQ_API_KEY || '';
    }

    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'No Groq API Key found to test model.'
      }, { status: 400 });
    }

    const start = Date.now();
    const probeRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model.trim(),
        messages: [{ role: 'user', content: 'test' }],
        max_completion_tokens: 1
      })
    });

    const latencyMs = Date.now() - start;

    if (!probeRes.ok) {
      const errText = await probeRes.text();
      let errorMsg = `Model ${model} returned status ${probeRes.status}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) {
          errorMsg = errJson.error.message;
        }
      } catch {}

      if (probeRes.status === 429) {
        errorMsg = `Rate limit exceeded on Groq for "${model}". Please select another model (e.g. Llama 3.3 70B or Llama 3.1 8B).`;
      } else if (probeRes.status === 404) {
        errorMsg = `Model "${model}" is deprecated or not available on Groq.`;
      }

      return NextResponse.json({
        success: true,
        valid: false,
        model: model.trim(),
        error: errorMsg,
        status: probeRes.status
      });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      model: model.trim(),
      latencyMs
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      valid: false,
      error: `Network error verifying model: ${err?.message || 'Unknown error'}`
    }, { status: 500 });
  }
}
