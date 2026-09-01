import { NextRequest, NextResponse } from 'next/server';
import { db, tests, userStatistics, leaderboardEntries } from '@writeabout/db';
import { typingTestSubmissionSchema } from '@writeabout/validation';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate payload
    const parsed = typingTestSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid test data', details: parsed.error.format() }, { status: 400 });
    }

    const data = parsed.data;

    // 2. Server-side validation: sanity check on WPM vs time and characters
    const serverElapsedMinutes = data.elapsedMilliseconds / 60000;
    const maxPossibleWpm = ((data.correctCharacters + data.incorrectCharacters + data.extraCharacters) / 5) / serverElapsedMinutes;
    if (data.wpm > maxPossibleWpm + 10) {
      return NextResponse.json({ error: 'Validation failed: impossible typing speed detected.' }, { status: 422 });
    }

    // 3. Persist test into Neon PostgreSQL
    const insertedTests = await db.insert(tests).values({
      userId: data.userId || null,
      wordSetId: data.wordSetId || null,
      mode: data.mode,
      duration: data.duration,
      wordCount: data.wordCount,
      punctuation: data.punctuation,
      numbers: data.numbers,
      targetText: data.targetText,
      typedText: data.typedText,
      wpm: data.wpm,
      rawWpm: data.rawWpm,
      accuracy: data.accuracy,
      consistency: data.consistency,
      correctCharacters: data.correctCharacters,
      incorrectCharacters: data.incorrectCharacters,
      extraCharacters: data.extraCharacters,
      missedCharacters: data.missedCharacters,
      elapsedMilliseconds: data.elapsedMilliseconds
    }).returning({ id: tests.id, createdAt: tests.createdAt });

    const savedTest = insertedTests[0];

    // 4. Update user aggregate statistics if authenticated
    if (data.userId) {
      const existingStats = await db.select().from(userStatistics).where(eq(userStatistics.userId, data.userId)).limit(1);

      if (existingStats.length === 0) {
        await db.insert(userStatistics).values({
          userId: data.userId,
          totalTests: 1,
          totalCharacters: data.correctCharacters + data.incorrectCharacters + data.extraCharacters,
          totalCorrectCharacters: data.correctCharacters,
          totalIncorrectCharacters: data.incorrectCharacters,
          averageWpm: data.wpm,
          bestWpm: data.wpm,
          averageAccuracy: data.accuracy,
          bestAccuracy: data.accuracy,
          totalTypingTime: Math.round(data.elapsedMilliseconds / 1000)
        });
      } else {
        const current = existingStats[0];
        const newTotalTests = current.totalTests + 1;
        const newAvgWpm = Math.round(((current.averageWpm * current.totalTests + data.wpm) / newTotalTests) * 10) / 10;
        const newAvgAcc = Math.round(((current.averageAccuracy * current.totalTests + data.accuracy) / newTotalTests) * 10) / 10;
        const newBestWpm = Math.max(current.bestWpm, data.wpm);
        const newBestAcc = Math.max(current.bestAccuracy, data.accuracy);

        await db.update(userStatistics).set({
          totalTests: newTotalTests,
          totalCharacters: current.totalCharacters + data.correctCharacters + data.incorrectCharacters + data.extraCharacters,
          totalCorrectCharacters: current.totalCorrectCharacters + data.correctCharacters,
          totalIncorrectCharacters: current.totalIncorrectCharacters + data.incorrectCharacters,
          averageWpm: newAvgWpm,
          bestWpm: newBestWpm,
          averageAccuracy: newAvgAcc,
          bestAccuracy: newBestAcc,
          totalTypingTime: current.totalTypingTime + Math.round(data.elapsedMilliseconds / 1000),
          updatedAt: new Date()
        }).where(eq(userStatistics.userId, data.userId));
      }

      // 5. Add to leaderboard if valid completed test (e.g. 15s, 30s, 60s, 120s test or >= 10 words)
      if (data.accuracy >= 75 && (data.duration >= 15 || data.wordCount >= 10)) {
        await db.insert(leaderboardEntries).values({
          userId: data.userId,
          testId: savedTest.id,
          wordSetId: data.wordSetId || null,
          wpm: data.wpm,
          accuracy: data.accuracy,
          duration: data.duration,
          mode: data.mode
        });
      }
    }

    return NextResponse.json({
      success: true,
      testId: savedTest.id,
      createdAt: savedTest.createdAt
    });

  } catch (error) {
    console.error('Error saving typing test:', error);
    return NextResponse.json({ error: 'Failed to record test submission' }, { status: 500 });
  }
}
