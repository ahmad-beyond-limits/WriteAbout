import { NextRequest, NextResponse } from 'next/server';
import { db, userStatistics, tests } from '@writeabout/db';
import { eq, desc, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    if (!userIdParam) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userId = parseInt(userIdParam, 10);

    // 1. Get Aggregate Statistics
    const statsResult = await db.select().from(userStatistics).where(eq(userStatistics.userId, userId)).limit(1);
    const stats = statsResult.length > 0 ? statsResult[0] : {
      totalTests: 0,
      totalCharacters: 0,
      totalCorrectCharacters: 0,
      totalIncorrectCharacters: 0,
      averageWpm: 0,
      bestWpm: 0,
      averageAccuracy: 0,
      bestAccuracy: 0,
      totalTypingTime: 0
    };

    // 2. Get Last 20 Tests for performance trend graphs
    const recentTests = await db.select({
      id: tests.id,
      wpm: tests.wpm,
      rawWpm: tests.rawWpm,
      accuracy: tests.accuracy,
      mode: tests.mode,
      duration: tests.duration,
      createdAt: tests.createdAt
    })
    .from(tests)
    .where(eq(tests.userId, userId))
    .orderBy(desc(tests.createdAt))
    .limit(20);

    return NextResponse.json({
      stats,
      chartData: recentTests.reverse()
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({ error: 'Failed to retrieve stats' }, { status: 500 });
  }
}
