import { NextRequest, NextResponse } from 'next/server';
import { db, tests, wordSets } from '@writeabout/db';
import { eq, desc, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    const mode = searchParams.get('mode');
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '15', 10), 5), 50);
    const offset = (page - 1) * limit;

    if (!userIdParam) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userId = parseInt(userIdParam, 10);
    const conditions = [eq(tests.userId, userId)];

    if (mode && mode !== 'all') {
      conditions.push(eq(tests.mode, mode));
    }

    const rows = await db.select({
      id: tests.id,
      mode: tests.mode,
      duration: tests.duration,
      wordCount: tests.wordCount,
      punctuation: tests.punctuation,
      numbers: tests.numbers,
      wpm: tests.wpm,
      rawWpm: tests.rawWpm,
      accuracy: tests.accuracy,
      consistency: tests.consistency,
      correctCharacters: tests.correctCharacters,
      incorrectCharacters: tests.incorrectCharacters,
      createdAt: tests.createdAt,
      wordSetName: wordSets.name
    })
    .from(tests)
    .leftJoin(wordSets, eq(tests.wordSetId, wordSets.id))
    .where(and(...conditions))
    .orderBy(desc(tests.createdAt))
    .limit(limit)
    .offset(offset);

    const totalCountResult = await db.select({ count: sql<number>`count(*)` })
      .from(tests)
      .where(and(...conditions));

    const total = Number(totalCountResult[0]?.count || 0);

    return NextResponse.json({
      items: rows,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching test history:', error);
    return NextResponse.json({ error: 'Failed to retrieve test history' }, { status: 500 });
  }
}
