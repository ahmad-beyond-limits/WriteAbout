import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateSalt, hashPassword } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { username, password } = data;

    if (!username || !password || !username.trim() || !password.trim()) {
      return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
    }

    const trimmedUsername = username.trim().toLowerCase();

    // Check if user already exists
    const userCheck = await pool.query('SELECT id FROM users WHERE username = $1', [trimmedUsername]);
    if (userCheck.rows.length > 0) {
      return NextResponse.json({ success: false, error: 'Username is already taken' }, { status: 400 });
    }

    // Hash the password with a new salt
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    // Insert user into DB
    const insertResult = await pool.query(
      'INSERT INTO users (username, password_hash, salt) VALUES ($1, $2, $3) RETURNING id, username',
      [trimmedUsername, passwordHash, salt]
    );

    const newUser = insertResult.rows[0];

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error during registration' }, { status: 500 });
  }
}
