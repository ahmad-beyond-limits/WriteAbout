import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateSalt, hashPassword } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { username, password, firstName, lastName } = data;

    if (!firstName || !firstName.trim() || !lastName || !lastName.trim()) {
      return NextResponse.json({ success: false, error: 'First name and last name are both required.' }, { status: 400 });
    }

    if (!username || !password || !username.trim() || !password.trim()) {
      return NextResponse.json({ success: false, error: 'Username and password are required.' }, { status: 400 });
    }

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedUsername = username.trim().toLowerCase();

    // Check if user already exists
    const userCheck = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [trimmedUsername]);
    if (userCheck.rows.length > 0) {
      return NextResponse.json({ success: false, error: 'Username is already taken.' }, { status: 400 });
    }

    // Hash the password with a new salt
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    // Insert user into DB
    const insertResult = await pool.query(
      'INSERT INTO users (username, password_hash, salt, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, role, first_name, last_name',
      [trimmedUsername, passwordHash, salt, 'user', trimmedFirstName, trimmedLastName]
    );

    const newUser = insertResult.rows[0];

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role || 'user'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error during registration' }, { status: 500 });
  }
}
