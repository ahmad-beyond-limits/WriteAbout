import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@writeabout/db';
import { verifyPassword } from '@writeabout/auth';
import { loginSchema } from '@writeabout/validation';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter a valid username and password' }, { status: 400 });
    }

    const { username, password } = parsed.data;

    const userList = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (userList.length === 0) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const user = userList[0];
    const isValid = verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName || user.username
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
