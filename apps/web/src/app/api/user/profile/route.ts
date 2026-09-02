import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { userId, firstName, lastName } = data;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
    }

    if (!firstName || !firstName.trim() || !lastName || !lastName.trim()) {
      return NextResponse.json({ success: false, error: 'First name and last name are both required.' }, { status: 400 });
    }

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const parsedId = parseInt(userId, 10);

    if (isNaN(parsedId)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID.' }, { status: 400 });
    }

    const updateRes = await pool.query(
      'UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3 RETURNING id, username, first_name, last_name, role',
      [trimmedFirst, trimmedLast, parsedId]
    );

    if (updateRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    const updatedUser = updateRes.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Name updated successfully.',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        role: updatedUser.role || (updatedUser.username?.toLowerCase() === 'muhammad ahmad' ? 'admin' : 'user')
      }
    });
  } catch (error) {
    console.error('Error updating profile name:', error);
    return NextResponse.json({ success: false, error: 'Failed to update profile name.' }, { status: 500 });
  }
}
