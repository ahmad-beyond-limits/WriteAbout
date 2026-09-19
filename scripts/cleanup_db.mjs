import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/typing/.env') });

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  '';

console.log('Connecting to Supabase to clean progress and non-admin users...');

const pool = new Pool({
  connectionString,
  ssl: connectionString ? { rejectUnauthorized: false } : undefined
});

async function cleanDatabase() {
  try {
    // 1. Delete all test progress and history
    console.log('Clearing typing tests...');
    await pool.query('DELETE FROM tests;');

    console.log('Clearing leaderboard entries...');
    await pool.query('DELETE FROM leaderboard_entries;');

    console.log('Clearing user statistics...');
    await pool.query('DELETE FROM user_statistics;');

    console.log('Clearing writing practices...');
    await pool.query('DELETE FROM practices;');

    console.log('Clearing API call logs...');
    await pool.query('DELETE FROM api_calls;');

    // 2. Remove all users except admin
    console.log('Removing all users except admin (muhammad ahmad)...');
    const deleteUsersRes = await pool.query(`
      DELETE FROM users 
      WHERE LOWER(username) != 'muhammad ahmad' AND (role IS NULL OR role != 'admin');
    `);
    console.log(`Deleted ${deleteUsersRes.rowCount || 0} non-admin user(s).`);

    // 3. Ensure admin user exists and reset admin stats
    const adminRes = await pool.query("SELECT id, username, role FROM users WHERE LOWER(username) = 'muhammad ahmad' OR role = 'admin' LIMIT 1;");
    if (adminRes.rows.length > 0) {
      const adminId = adminRes.rows[0].id;
      console.log(`Admin user preserved: ID ${adminId} (${adminRes.rows[0].username})`);

      // Initialize clean user_statistics for admin
      await pool.query(`
        INSERT INTO user_statistics (user_id, total_tests, total_characters, total_correct_characters, total_incorrect_characters, average_wpm, best_wpm, average_accuracy, best_accuracy, total_typing_time)
        VALUES ($1, 0, 0, 0, 0, 0, 0, 0, 0, 0)
        ON CONFLICT (user_id) DO UPDATE SET
          total_tests = 0,
          total_characters = 0,
          total_correct_characters = 0,
          total_incorrect_characters = 0,
          average_wpm = 0,
          best_wpm = 0,
          average_accuracy = 0,
          best_accuracy = 0,
          total_typing_time = 0;
      `, [adminId]);
    } else {
      console.log('Warning: Admin user not found. Re-run seed_admin.mjs if needed.');
    }

    // 4. Verify counts
    const usersCount = await pool.query('SELECT COUNT(*) FROM users;');
    const testsCount = await pool.query('SELECT COUNT(*) FROM tests;');
    const practicesCount = await pool.query('SELECT COUNT(*) FROM practices;');
    const lbCount = await pool.query('SELECT COUNT(*) FROM leaderboard_entries;');
    const wordsCount = await pool.query('SELECT COUNT(*) FROM words;');

    console.log('\n==============================================');
    console.log('🧹 DATABASE CLEANUP COMPLETE:');
    console.log(`- Remaining Users: ${usersCount.rows[0].count} (Admin only)`);
    console.log(`- Tests: ${testsCount.rows[0].count}`);
    console.log(`- Practices: ${practicesCount.rows[0].count}`);
    console.log(`- Leaderboard Entries: ${lbCount.rows[0].count}`);
    console.log(`- Vocabulary Words: ${wordsCount.rows[0].count} (Preserved)`);
    console.log('==============================================\n');

  } catch (err) {
    console.error('Error cleaning database:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanDatabase();
