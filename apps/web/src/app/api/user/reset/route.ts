import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, password } = data;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ success: false, error: 'Password confirmation is required to reset account data.' }, { status: 400 });
    }

    const parsedId = parseInt(userId, 10);
    if (isNaN(parsedId)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID.' }, { status: 400 });
    }

    // 1. Fetch user to verify password
    const userRes = await pool.query(
      'SELECT id, password_hash, salt, username FROM users WHERE id = $1',
      [parsedId]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    const user = userRes.rows[0];

    // 2. Verify password
    const computedHash = hashPassword(password, user.salt);
    if (computedHash !== user.password_hash) {
      return NextResponse.json({ success: false, error: 'Incorrect password. Account reset aborted.' }, { status: 401 });
    }

    // 3. Clear typing tests, practices, and stats
    await pool.query('DELETE FROM tests WHERE user_id = $1', [parsedId]);
    await pool.query('DELETE FROM practices WHERE user_id = $1', [parsedId]);
    await pool.query('DELETE FROM api_calls WHERE user_id = $1', [parsedId]);

    // Reset or delete user_statistics
    try {
      await pool.query('DELETE FROM user_statistics WHERE user_id = $1', [parsedId]);
    } catch {
      // ignore if table doesn't exist
    }

    return NextResponse.json({
      success: true,
      message: 'All typing test history and image writing sessions have been reset.'
    });
  } catch (error) {
    console.error('Error resetting user account data:', error);
    return NextResponse.json({ success: false, error: 'Failed to reset account data.' }, { status: 500 });
  }
}
