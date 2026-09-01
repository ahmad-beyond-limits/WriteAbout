import { pool, db, users, wordSets, words, tests, userStatistics, userSettings, leaderboardEntries } from '../packages/db/src';
import { hashPassword, generateSalt, verifyPassword } from '../packages/auth/src';
import { typingTestSubmissionSchema, loginSchema, registerSchema } from '../packages/validation/src';
import { calculateTypingMetrics } from '../apps/typing/src/lib/typing-engine';
import { eq, desc } from 'drizzle-orm';

async function runTests() {
  console.log('==============================================');
  console.log('🧪 RUNNING COMPREHENSIVE END-TO-END MONOREPO TESTS');
  console.log('==============================================\n');

  try {
    // 1. Test Database Connectivity
    console.log('1. Testing Neon PostgreSQL connectivity...');
    const nowResult = await pool.query('SELECT NOW() as current_time;');
    console.log('   ✅ Neon Connected! Server time:', nowResult.rows[0].current_time);

    // 2. Test Word Sets & Vocabulary
    console.log('\n2. Testing Word Sets & Vocabulary seeding...');
    const setList = await db.select().from(wordSets);
    console.log(`   ✅ Found ${setList.length} word sets:`, setList.map(s => s.name).join(', '));

    const wordCountRes = await pool.query('SELECT COUNT(*) as count FROM words;');
    console.log(`   ✅ Found ${wordCountRes.rows[0].count} words seeded in Neon DB.`);

    // 3. Test Registration & Authentication
    console.log('\n3. Testing User Registration & Password Hashing...');
    const testUsername = `tester_${Date.now()}`;
    const testPassword = 'SecurePassword123!';
    const salt = generateSalt();
    const passwordHash = hashPassword(testPassword, salt);

    const regParsed = registerSchema.safeParse({
      username: testUsername,
      password: testPassword,
      displayName: 'Master Typist',
      email: `${testUsername}@example.com`
    });
    if (!regParsed.success) throw new Error('Registration schema validation failed');

    const insertedUser = await db.insert(users).values({
      username: testUsername,
      passwordHash,
      salt,
      email: `${testUsername}@example.com`,
      displayName: 'Master Typist'
    }).returning();
    const testUser = insertedUser[0];
    console.log(`   ✅ User registered successfully! ID: ${testUser.id}, Username: ${testUser.username}`);

    // Verify Password Check
    const loginValid = verifyPassword(testPassword, testUser.salt, testUser.passwordHash);
    const loginInvalid = verifyPassword('WrongPassword', testUser.salt, testUser.passwordHash);
    if (!loginValid || loginInvalid) throw new Error('Password verification logic failed');
    console.log('   ✅ Password hash & salt verification verified successfully!');

    // 4. Test Typing Engine Calculation Formula
    console.log('\n4. Testing Typing Engine metrics calculation...');
    const targetWords = ['the', 'quick', 'brown', 'fox', 'jumps'];
    const typedWords = ['the', 'quick', 'brown', 'fox', 'jumps'];
    const elapsedMs = 5000; // 5 seconds

    const calculated = calculateTypingMetrics(
      targetWords,
      typedWords,
      elapsedMs,
      'words',
      false,
      false,
      testUser.id,
      setList[0]?.id || null
    );

    console.log(`   Calculated: WPM=${calculated.wpm}, RawWPM=${calculated.rawWpm}, Acc=${calculated.accuracy}%`);
    if (calculated.wpm <= 0 || calculated.accuracy !== 100) {
      throw new Error('Typing calculation formula error');
    }
    console.log('   ✅ Typing Engine formulas verified!');

    // 5. Test Schema Validation & Database Persistence
    console.log('\n5. Testing Test Result persistence in Neon DB...');
    const subValidation = typingTestSubmissionSchema.safeParse(calculated);
    if (!subValidation.success) throw new Error('Submission validation failed');

    const savedTest = await db.insert(tests).values({
      userId: calculated.userId,
      wordSetId: calculated.wordSetId,
      mode: calculated.mode,
      duration: calculated.duration,
      wordCount: calculated.wordCount,
      punctuation: calculated.punctuation,
      numbers: calculated.numbers,
      targetText: calculated.targetText,
      typedText: calculated.typedText,
      wpm: calculated.wpm,
      rawWpm: calculated.rawWpm,
      accuracy: calculated.accuracy,
      consistency: calculated.consistency,
      correctCharacters: calculated.correctCharacters,
      incorrectCharacters: calculated.incorrectCharacters,
      extraCharacters: calculated.extraCharacters,
      missedCharacters: calculated.missedCharacters,
      elapsedMilliseconds: calculated.elapsedMilliseconds
    }).returning();
    console.log(`   ✅ Test recorded in database! Test ID: ${savedTest[0].id}, WPM: ${savedTest[0].wpm}`);

    // 6. Test User Statistics Aggregate Updates
    console.log('\n6. Testing User Statistics aggregate updates...');
    await db.insert(userStatistics).values({
      userId: testUser.id,
      totalTests: 1,
      totalCharacters: calculated.correctCharacters,
      totalCorrectCharacters: calculated.correctCharacters,
      totalIncorrectCharacters: 0,
      averageWpm: calculated.wpm,
      bestWpm: calculated.wpm,
      averageAccuracy: calculated.accuracy,
      bestAccuracy: calculated.accuracy,
      totalTypingTime: Math.round(calculated.elapsedMilliseconds / 1000)
    });
    const fetchedStats = await db.select().from(userStatistics).where(eq(userStatistics.userId, testUser.id));
    console.log(`   ✅ User statistics created! Best WPM: ${fetchedStats[0].bestWpm}, Avg Acc: ${fetchedStats[0].averageAccuracy}%`);

    // 7. Test User Settings Persistence
    console.log('\n7. Testing User Settings update & persistence...');
    await db.insert(userSettings).values({
      userId: testUser.id,
      theme: 'matrix',
      font: 'JetBrains Mono',
      fontSize: 20,
      caretStyle: 'block',
      smoothCaret: true,
      soundEnabled: true,
      soundVolume: 0.7,
      punctuation: true,
      numbers: true,
      language: 'english',
      defaultTestMode: 'words',
      defaultTestDuration: 30
    });
    const fetchedSettings = await db.select().from(userSettings).where(eq(userSettings.userId, testUser.id));
    console.log(`   ✅ User settings saved! Theme: ${fetchedSettings[0].theme}, Font: ${fetchedSettings[0].font}`);

    // 8. Test Leaderboard Ranking
    console.log('\n8. Testing Leaderboard recording & retrieval...');
    await db.insert(leaderboardEntries).values({
      userId: testUser.id,
      testId: savedTest[0].id,
      wordSetId: calculated.wordSetId,
      wpm: calculated.wpm,
      accuracy: calculated.accuracy,
      duration: calculated.duration || 5,
      mode: 'words'
    });
    const topLeaderboard = await db.select()
      .from(leaderboardEntries)
      .orderBy(desc(leaderboardEntries.wpm))
      .limit(5);
    console.log(`   ✅ Leaderboard query returned ${topLeaderboard.length} entries. Top score: ${topLeaderboard[0].wpm} WPM`);

    console.log('\n==============================================');
    console.log('🎉 ALL INTEGRATION & DATABASE TESTS PASSED 100%');
    console.log('==============================================\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();
