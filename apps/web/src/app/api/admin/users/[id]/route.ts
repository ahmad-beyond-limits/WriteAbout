import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateSalt, hashPassword } from '@/lib/crypto';

// Helper to verify admin permissions
async function verifyAdmin(request: Request): Promise<{ isAdmin: boolean; adminId: number | null }> {
  const adminIdHeader = request.headers.get('x-admin-id');
  const adminUsernameHeader = request.headers.get('x-admin-username');

  if (!adminIdHeader && !adminUsernameHeader) return { isAdmin: false, adminId: null };

  const parsedId = adminIdHeader ? parseInt(adminIdHeader, 10) : 0;
  const res = await pool.query(
    'SELECT id, role, username FROM users WHERE (id = $1 OR LOWER(username) = LOWER($2)) AND role = $3',
    [parsedId, adminUsernameHeader || '', 'admin']
  );

  if (res.rows.length > 0) {
    return { isAdmin: true, adminId: res.rows[0].id };
  }
  return { isAdmin: false, adminId: null };
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin, adminId } = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Administrator access required.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const targetUserId = parseInt(resolvedParams.id, 10);

    if (isNaN(targetUserId)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
    }

    // Safety: prevent admin from deleting their own account
    if (adminId === targetUserId) {
      return NextResponse.json({ success: false, error: 'You cannot delete your own administrator account.' }, { status: 400 });
    }

    // Clean up tests, practices, and user
    await pool.query('DELETE FROM tests WHERE user_id = $1', [targetUserId]);
    await pool.query('DELETE FROM practices WHERE user_id = $1', [targetUserId]);
    await pool.query('DELETE FROM api_calls WHERE user_id = $1', [targetUserId]);
    const deleteResult = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, username', [targetUserId]);

    if (deleteResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${deleteResult.rows[0].username} deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete user.' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin, adminId } = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Administrator access required.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const targetUserId = parseInt(resolvedParams.id, 10);

    if (isNaN(targetUserId)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
    }

    const data = await request.json();
    const { role, newPassword } = data;

    // 1. Role Update
    if (role && (role === 'user' || role === 'admin')) {
      // Safety: prevent demoting oneself if the only admin
      if (adminId === targetUserId && role === 'user') {
        const adminCount = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['admin']);
        if (parseInt(adminCount.rows[0].count, 10) <= 1) {
          return NextResponse.json({ success: false, error: 'Cannot demote the last administrator account.' }, { status: 400 });
        }
      }

      await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, targetUserId]);
    }

    // 2. Password Reset
    if (newPassword && newPassword.trim().length > 0) {
      const salt = generateSalt();
      const passwordHash = hashPassword(newPassword.trim(), salt);
      await pool.query('UPDATE users SET password_hash = $1, salt = $2 WHERE id = $3', [passwordHash, salt, targetUserId]);
    }

    const updatedUser = await pool.query('SELECT id, username, email, role, created_at FROM users WHERE id = $1', [targetUserId]);

    return NextResponse.json({
      success: true,
      user: updatedUser.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user.' }, { status: 500 });
  }
}
