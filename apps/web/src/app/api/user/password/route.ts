import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateSalt, hashPassword } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, currentPassword, newPassword } = data;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Current password and new password are required.' }, { status: 400 });
    }

    if (newPassword.trim().length < 6) {
      return NextResponse.json({ success: false, error: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    const parsedId = parseInt(userId, 10);
    if (isNaN(parsedId)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID.' }, { status: 400 });
    }

    // 1. Fetch user from DB
    const userRes = await pool.query(
      'SELECT id, password_hash, salt FROM users WHERE id = $1',
      [parsedId]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    const user = userRes.rows[0];

    // 2. Verify current password
    const computedCurrentHash = hashPassword(currentPassword, user.salt);
    if (computedCurrentHash !== user.password_hash) {
      return NextResponse.json({ success: false, error: 'Incorrect current password.' }, { status: 401 });
    }

    // 3. Prevent setting the same password
    const computedNewHashWithOldSalt = hashPassword(newPassword, user.salt);
    if (computedNewHashWithOldSalt === user.password_hash) {
      return NextResponse.json({ success: false, error: 'New password cannot be the same as your current password.' }, { status: 400 });
    }

    // 4. Hash new password with fresh salt
    const newSalt = generateSalt();
    const newPasswordHash = hashPassword(newPassword, newSalt);

    await pool.query(
      'UPDATE users SET password_hash = $1, salt = $2 WHERE id = $3',
      [newPasswordHash, newSalt, parsedId]
    );

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ success: false, error: 'Failed to change password.' }, { status: 500 });
  }
}
