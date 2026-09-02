import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/crypto';

export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    const { userId, password, confirmationText } = data;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ success: false, error: 'Password confirmation is required to delete account.' }, { status: 400 });
    }

    if (confirmationText !== 'DELETE') {
      return NextResponse.json({ success: false, error: 'Please type DELETE in capital letters to confirm.' }, { status: 400 });
    }

    const parsedId = parseInt(userId, 10);
    if (isNaN(parsedId)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID.' }, { status: 400 });
    }

    // 1. Fetch user to verify credentials
    const userRes = await pool.query(
      'SELECT id, password_hash, salt, username, role FROM users WHERE id = $1',
      [parsedId]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    const user = userRes.rows[0];

    // 2. Verify password
    const computedHash = hashPassword(password, user.salt);
    if (computedHash !== user.password_hash) {
      return NextResponse.json({ success: false, error: 'Incorrect password. Account deletion cancelled.' }, { status: 401 });
    }

    // 3. Admin safety check
    if (user.role === 'admin' || user.username?.toLowerCase() === 'muhammad ahmad') {
      const adminCountRes = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
      const adminCount = parseInt(adminCountRes.rows[0].count, 10);
      if (adminCount <= 1) {
        return NextResponse.json({
          success: false,
          error: 'Cannot delete the primary administrator account as it is the only admin on this system.'
        }, { status: 400 });
      }
    }

    // 4. Cascade delete child records
    await pool.query('DELETE FROM tests WHERE user_id = $1', [parsedId]);
    await pool.query('DELETE FROM practices WHERE user_id = $1', [parsedId]);
    await pool.query('DELETE FROM api_calls WHERE user_id = $1', [parsedId]);

    try {
      await pool.query('DELETE FROM user_statistics WHERE user_id = $1', [parsedId]);
    } catch {
      // ignore
    }

    try {
      await pool.query('DELETE FROM user_settings WHERE user_id = $1', [parsedId]);
    } catch {
      // ignore
    }

    // 5. Delete user from users table
    const deleteRes = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, username', [parsedId]);

    if (deleteRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User could not be deleted.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Account ${deleteRes.rows[0].username} has been permanently deleted.`
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete account.' }, { status: 500 });
  }
}
