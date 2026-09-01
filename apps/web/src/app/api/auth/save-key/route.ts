import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { encryptApiKey } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, apiKey } = data;

    if (!userId || !apiKey || !apiKey.trim()) {
      return NextResponse.json({ success: false, error: 'User ID and API key are required' }, { status: 400 });
    }

    const encryptedKey = encryptApiKey(apiKey.trim());

    // Update user's api_key in DB
    const updateResult = await pool.query(
      'UPDATE users SET api_key = $1 WHERE id = $2 RETURNING id',
      [encryptedKey, userId]
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Save API key error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error while saving API key' }, { status: 500 });
  }
}
