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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryKey = searchParams.get('apiKey');
    const userId = searchParams.get('userId');

    // 1. Resolve API key from header, query, DB, or env
    let apiKey = '';
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7).trim();
    } else if (queryKey && queryKey.trim()) {
      apiKey = queryKey.trim();
    } else if (userId) {
      try {
        const userRes = await pool.query('SELECT api_key FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length > 0 && userRes.rows[0].api_key) {
          const decrypted = decryptApiKey(userRes.rows[0].api_key);
          if (decrypted) apiKey = decrypted;
        }
      } catch (dbErr) {
        console.error('Error fetching user api_key for models:', dbErr);
      }
    }

    if (!apiKey) {
      apiKey = process.env.GROQ_API_KEY || '';
    }

    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json({
        success: false,
        error: 'No Groq API Key found. Please provide an API key to fetch available models.'
      }, { status: 400 });
    }

    // 2. Fetch live models list directly from Groq API
    const groqRes = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`
      },
      next: { revalidate: 60 } // Cache for 60s
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      let msg = 'Failed to fetch models from Groq API';
      try {
        const json = JSON.parse(errText);
        if (json.error?.message) msg = json.error.message;
      } catch {}
      return NextResponse.json({
        success: false,
        error: groqRes.status === 401 ? 'Invalid Groq API Key. Please verify your key on groq.com' : msg
      }, { status: groqRes.status });
    }

    const data = await groqRes.json();
    const rawList: any[] = Array.isArray(data.data) ? data.data : [];

    // Filter out audio/whisper/guard models that cannot be used for text evaluation
    const chatModels = rawList.filter((m: any) => {
      const id = (m.id || '').toLowerCase();
      if (id.includes('whisper') || id.includes('tts') || id.includes('guard') || id.includes('embedding') || id.includes('distil-whisper')) {
        return false;
      }
      if (m.active === false) return false;
      return true;
    });

    // Categorize and sort: Prioritize Qwen models first, then Llama, DeepSeek, Gemma, others
    const sortedModels = chatModels.sort((a: any, b: any) => {
      const aId = (a.id || '').toLowerCase();
      const bId = (b.id || '').toLowerCase();

      const getPriority = (id: string) => {
        if (id.includes('qwen-2.5-72b') || id.includes('qwen/qwen-2.5-72b')) return 1;
        if (id.includes('qwen')) return 2;
        if (id.includes('llama-3.3')) return 3;
        if (id.includes('llama-3.1')) return 4;
        if (id.includes('deepseek')) return 5;
        if (id.includes('gemma')) return 6;
        return 10;
      };

      const pA = getPriority(aId);
      const pB = getPriority(bId);

      if (pA !== pB) return pA - pB;
      return aId.localeCompare(bId);
    });

    const formattedModels = sortedModels.map((m: any) => ({
      id: m.id,
      name: m.id,
      owned_by: m.owned_by || 'groq',
      context_window: m.context_window || null,
      active: m.active ?? true
    }));

    // Detect best default model (first Qwen model, or first model in sorted list)
    const defaultModel =
      formattedModels.find(m => m.id.toLowerCase().includes('qwen'))?.id ||
      formattedModels[0]?.id ||
      '';

    return NextResponse.json({
      success: true,
      models: formattedModels,
      defaultModel,
      count: formattedModels.length
    });
  } catch (err: any) {
    console.error('Error in /api/models route:', err);
    return NextResponse.json({
      success: false,
      error: `Server error retrieving models: ${err?.message || 'Unknown error'}`
    }, { status: 500 });
  }
}
