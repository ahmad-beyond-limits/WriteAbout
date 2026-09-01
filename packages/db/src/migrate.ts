import { pool } from './index';

export async function migrate() {
  console.log('Running database migrations on Neon PostgreSQL...');

  const queries = [
    // 1. Users
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      salt VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE,
      display_name VARCHAR(100),
      avatar_url TEXT,
      api_key TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`,

    // 2. Word Sets
    `CREATE TABLE IF NOT EXISTS word_sets (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      language VARCHAR(50) NOT NULL DEFAULT 'english',
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // 3. Words
    `CREATE TABLE IF NOT EXISTS words (
      id SERIAL PRIMARY KEY,
      word_set_id INTEGER REFERENCES word_sets(id) ON DELETE CASCADE,
      word VARCHAR(100) NOT NULL,
      difficulty INTEGER DEFAULT 1,
      frequency INTEGER DEFAULT 100,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // 4. Tests
    `CREATE TABLE IF NOT EXISTS tests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      word_set_id INTEGER REFERENCES word_sets(id) ON DELETE SET NULL,
      mode VARCHAR(50) NOT NULL DEFAULT 'time',
      duration INTEGER DEFAULT 0,
      word_count INTEGER DEFAULT 0,
      punctuation BOOLEAN DEFAULT false,
      numbers BOOLEAN DEFAULT false,
      target_text TEXT NOT NULL,
      typed_text TEXT NOT NULL,
      wpm REAL NOT NULL,
      raw_wpm REAL NOT NULL,
      accuracy REAL NOT NULL,
      consistency REAL NOT NULL DEFAULT 100,
      correct_characters INTEGER NOT NULL DEFAULT 0,
      incorrect_characters INTEGER NOT NULL DEFAULT 0,
      extra_characters INTEGER NOT NULL DEFAULT 0,
      missed_characters INTEGER NOT NULL DEFAULT 0,
      elapsed_milliseconds INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // 5. User Statistics
    `CREATE TABLE IF NOT EXISTS user_statistics (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      total_tests INTEGER NOT NULL DEFAULT 0,
      total_characters INTEGER NOT NULL DEFAULT 0,
      total_correct_characters INTEGER NOT NULL DEFAULT 0,
      total_incorrect_characters INTEGER NOT NULL DEFAULT 0,
      average_wpm REAL NOT NULL DEFAULT 0,
      best_wpm REAL NOT NULL DEFAULT 0,
      average_accuracy REAL NOT NULL DEFAULT 0,
      best_accuracy REAL NOT NULL DEFAULT 0,
      total_typing_time INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // 6. User Settings
    `CREATE TABLE IF NOT EXISTS user_settings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      theme VARCHAR(50) NOT NULL DEFAULT 'dark',
      font VARCHAR(100) NOT NULL DEFAULT 'Inter',
      font_size INTEGER NOT NULL DEFAULT 18,
      caret_style VARCHAR(50) NOT NULL DEFAULT 'line',
      smooth_caret BOOLEAN NOT NULL DEFAULT true,
      sound_enabled BOOLEAN NOT NULL DEFAULT false,
      sound_volume REAL NOT NULL DEFAULT 0.5,
      punctuation BOOLEAN NOT NULL DEFAULT false,
      numbers BOOLEAN NOT NULL DEFAULT false,
      language VARCHAR(50) NOT NULL DEFAULT 'english',
      default_test_mode VARCHAR(50) NOT NULL DEFAULT 'time',
      default_test_duration INTEGER NOT NULL DEFAULT 60,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // 7. Leaderboard Entries
    `CREATE TABLE IF NOT EXISTS leaderboard_entries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
      word_set_id INTEGER REFERENCES word_sets(id) ON DELETE SET NULL,
      wpm REAL NOT NULL,
      accuracy REAL NOT NULL,
      duration INTEGER NOT NULL,
      mode VARCHAR(50) NOT NULL DEFAULT 'time',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // 8. WriteAbout Practices
    `CREATE TABLE IF NOT EXISTS practices (
      id SERIAL PRIMARY KEY,
      image_url TEXT NOT NULL,
      text TEXT NOT NULL,
      rate VARCHAR(50) NOT NULL,
      feedback TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // 9. WriteAbout API Calls
    `CREATE TABLE IF NOT EXISTS api_calls (
      id SERIAL PRIMARY KEY,
      endpoint VARCHAR(100) NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS words_word_set_id_idx ON words(word_set_id);`,
    `CREATE INDEX IF NOT EXISTS words_is_active_idx ON words(is_active);`,
    `CREATE INDEX IF NOT EXISTS tests_user_id_idx ON tests(user_id);`,
    `CREATE INDEX IF NOT EXISTS tests_created_at_idx ON tests(created_at);`,
    `CREATE INDEX IF NOT EXISTS leaderboard_wpm_idx ON leaderboard_entries(wpm);`,
    `CREATE INDEX IF NOT EXISTS practices_user_id_idx ON practices(user_id);`
  ];

  for (const q of queries) {
    await pool.query(q);
  }

  console.log('Database migrations completed successfully!');
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
