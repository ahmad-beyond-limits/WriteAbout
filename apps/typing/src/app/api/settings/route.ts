import { NextRequest, NextResponse } from 'next/server';
import { db, userSettings } from '@writeabout/db';
import { userSettingsSchema } from '@writeabout/validation';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    if (!userIdParam) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userId = parseInt(userIdParam, 10);
    const rows = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

    if (rows.length === 0) {
      return NextResponse.json({
        settings: {
          theme: 'dark',
          font: 'Inter',
          fontSize: 18,
          caretStyle: 'line',
          smoothCaret: true,
          soundEnabled: false,
          soundVolume: 0.5,
          punctuation: false,
          numbers: false,
          language: 'english',
          defaultTestMode: 'time',
          defaultTestDuration: 60
        }
      });
    }

    return NextResponse.json({ settings: rows[0] });

  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to retrieve settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const parsed = userSettingsSchema.safeParse(body.settings || body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid settings data', details: parsed.error.format() }, { status: 400 });
    }

    const data = parsed.data;

    const existing = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

    if (existing.length === 0) {
      await db.insert(userSettings).values({
        userId,
        ...data,
        updatedAt: new Date()
      });
    } else {
      await db.update(userSettings).set({
        ...data,
        updatedAt: new Date()
      }).where(eq(userSettings.userId, userId));
    }

    return NextResponse.json({ success: true, settings: data });

  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
