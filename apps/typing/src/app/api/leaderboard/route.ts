import { NextRequest, NextResponse } from 'next/server';
import { db, leaderboardEntries, users, wordSets } from '@writeabout/db';
import { eq, desc, and, gte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const duration = searchParams.get('duration') ? parseInt(searchParams.get('duration')!, 10) : null;
    const timeframe = searchParams.get('timeframe') || 'all'; // 'today', 'week', 'all'

    const conditions = [];

    if (duration) {
      conditions.push(eq(leaderboardEntries.duration, duration));
    }

    if (timeframe === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      conditions.push(gte(leaderboardEntries.createdAt, today));
    } else if (timeframe === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      conditions.push(gte(leaderboardEntries.createdAt, oneWeekAgo));
    }

    const rows = await db.select({
      id: leaderboardEntries.id,
      wpm: leaderboardEntries.wpm,
      accuracy: leaderboardEntries.accuracy,
      duration: leaderboardEntries.duration,
      mode: leaderboardEntries.mode,
      createdAt: leaderboardEntries.createdAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      wordSetName: wordSets.name
    })
    .from(leaderboardEntries)
    .innerJoin(users, eq(leaderboardEntries.userId, users.id))
    .leftJoin(wordSets, eq(leaderboardEntries.wordSetId, wordSets.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(leaderboardEntries.wpm), desc(leaderboardEntries.accuracy))
    .limit(50);

    return NextResponse.json({
      leaderboard: rows.map((r, index) => ({
        rank: index + 1,
        ...r
      }))
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to retrieve leaderboard' }, { status: 500 });
  }
}
