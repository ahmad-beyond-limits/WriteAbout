import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, decryptApiKey } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { username, password } = data;

    if (!username || !password || !username.trim() || !password.trim()) {
      return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
    }

    const trimmedUsername = username.trim().toLowerCase();

    // Fetch user from DB
    const userResult = await pool.query(
      'SELECT id, username, password_hash, salt, api_key FROM users WHERE username = $1',
      [trimmedUsername]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
    }

    const user = userResult.rows[0];

    // Verify password hash
    const computedHash = hashPassword(password, user.salt);
    if (computedHash !== user.password_hash) {
      return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
    }

    // Decrypt the stored API key if it exists
    let decryptedKey = null;
    if (user.api_key) {
      decryptedKey = decryptApiKey(user.api_key);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username
      },
      apiKey: decryptedKey
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error during login' }, { status: 500 });
  }
}
