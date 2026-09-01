import { NextRequest, NextResponse } from 'next/server';
import { db, words, wordSets } from '@writeabout/db';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const count = Math.min(Math.max(parseInt(searchParams.get('count') || '60', 10), 10), 300);
    const punctuation = searchParams.get('punctuation') === 'true';
    const numbers = searchParams.get('numbers') === 'true';
    const setName = searchParams.get('wordSet') || 'English Standard';

    // 1. Find Word Set
    const setList = await db.select().from(wordSets).where(eq(wordSets.name, setName)).limit(1);
    let setId: number | null = setList.length > 0 ? setList[0].id : null;

    let wordRows: { word: string }[] = [];
    if (setId) {
      wordRows = await db.select({ word: words.word })
        .from(words)
        .where(eq(words.wordSetId, setId));
    }

    // Fallback to all active words if set is empty
    if (wordRows.length === 0) {
      wordRows = await db.select({ word: words.word })
        .from(words)
        .where(eq(words.isActive, true))
        .limit(250);
    }

    if (wordRows.length === 0) {
      return NextResponse.json({
        words: ["the", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog", "swift", "typing", "practice"],
        wordSetId: null
      });
    }

    // 2. Sample words efficiently
    const wordPool = wordRows.map(r => r.word);
    const selected: string[] = [];

    const punctuationMarks = ['.', ',', '!', '?', ';', ':', '-', '"'];

    for (let i = 0; i < count; i++) {
      let w = wordPool[Math.floor(Math.random() * wordPool.length)];

      if (numbers && Math.random() < 0.15) {
        w = Math.floor(Math.random() * 1000).toString();
      } else if (punctuation && Math.random() < 0.2) {
        const mark = punctuationMarks[Math.floor(Math.random() * punctuationMarks.length)];
        if (Math.random() < 0.5) {
          w = w.charAt(0).toUpperCase() + w.slice(1);
        }
        w = mark === '"' ? `"${w}"` : `${w}${mark}`;
      }

      selected.push(w);
    }

    return NextResponse.json({
      words: selected,
      wordSetId: setId
    });
  } catch (error) {
    console.error('Error fetching words:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve words from database' },
      { status: 500 }
    );
  }
}
