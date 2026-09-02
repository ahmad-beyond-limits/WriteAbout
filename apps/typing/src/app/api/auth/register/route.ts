import { NextRequest, NextResponse } from 'next/server';
import { db, users, userSettings, userStatistics } from '@writeabout/db';
import { hashPassword, generateSalt } from '@writeabout/auth';
import { registerSchema } from '@writeabout/validation';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please check your registration details', details: parsed.error.format() }, { status: 400 });
    }

    const { username, password, email, displayName } = parsed.data;

    // Check existing
    const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    const inserted = await db.insert(users).values({
      username,
      passwordHash,
      salt,
      email: email || null,
      displayName: displayName || username
    }).returning({ id: users.id, username: users.username });

    const newUser = inserted[0];

    // Initialize default settings and stats
    await db.insert(userSettings).values({
      userId: newUser.id,
      theme: 'dark',
      font: 'Inter',
      fontSize: 18,
      caretStyle: 'line',
      smoothCaret: 'slow',
      soundEnabled: false,
      soundVolume: 0.5,
      punctuation: false,
      numbers: false,
      language: 'english',
      defaultTestMode: 'time',
      defaultTestDuration: 30
    });

    await db.insert(userStatistics).values({
      userId: newUser.id,
      totalTests: 0,
      totalCharacters: 0,
      totalCorrectCharacters: 0,
      totalIncorrectCharacters: 0,
      averageWpm: 0,
      bestWpm: 0,
      averageAccuracy: 0,
      bestAccuracy: 0,
      totalTypingTime: 0
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: email || null,
        displayName: displayName || username
      }
    });

  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
