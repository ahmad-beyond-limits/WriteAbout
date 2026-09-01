import { pgTable, serial, text, varchar, timestamp, integer, boolean, real, index } from 'drizzle-orm/pg-core';

// 1. Unified Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  salt: varchar('salt', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  displayName: varchar('display_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  apiKey: text('api_key'), // For WriteAbout Cerebras/Groq Key
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Word Sets Table
export const wordSets = pgTable('word_sets', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  language: varchar('language', { length: 50 }).notNull().default('english'),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Words Table
export const words = pgTable('words', {
  id: serial('id').primaryKey(),
  wordSetId: integer('word_set_id').references(() => wordSets.id, { onDelete: 'cascade' }).notNull(),
  word: varchar('word', { length: 100 }).notNull(),
  difficulty: integer('difficulty').default(1),
  frequency: integer('frequency').default(100),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('words_word_set_id_idx').on(table.wordSetId),
  index('words_is_active_idx').on(table.isActive)
]);

// 4. Tests Table (Completed typing tests)
export const tests = pgTable('tests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  wordSetId: integer('word_set_id').references(() => wordSets.id, { onDelete: 'set null' }),
  mode: varchar('mode', { length: 50 }).notNull().default('time'),
  duration: integer('duration').default(0),
  wordCount: integer('word_count').default(0),
  punctuation: boolean('punctuation').default(false).notNull(),
  numbers: boolean('numbers').default(false).notNull(),
  targetText: text('target_text').notNull(),
  typedText: text('typed_text').notNull(),
  wpm: real('wpm').notNull(),
  rawWpm: real('raw_wpm').notNull(),
  accuracy: real('accuracy').notNull(),
  consistency: real('consistency').notNull().default(100),
  correctCharacters: integer('correct_characters').notNull().default(0),
  incorrectCharacters: integer('incorrect_characters').notNull().default(0),
  extraCharacters: integer('extra_characters').notNull().default(0),
  missedCharacters: integer('missed_characters').notNull().default(0),
  elapsedMilliseconds: integer('elapsed_milliseconds').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('tests_user_id_idx').on(table.userId),
  index('tests_wpm_idx').on(table.wpm),
  index('tests_created_at_idx').on(table.createdAt)
]);

// 5. User Aggregate Statistics
export const userStatistics = pgTable('user_statistics', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  totalTests: integer('total_tests').notNull().default(0),
  totalCharacters: integer('total_characters').notNull().default(0),
  totalCorrectCharacters: integer('total_correct_characters').notNull().default(0),
  totalIncorrectCharacters: integer('total_incorrect_characters').notNull().default(0),
  averageWpm: real('average_wpm').notNull().default(0),
  bestWpm: real('best_wpm').notNull().default(0),
  averageAccuracy: real('average_accuracy').notNull().default(0),
  bestAccuracy: real('best_accuracy').notNull().default(0),
  totalTypingTime: integer('total_typing_time').notNull().default(0), // in seconds
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 6. User Settings
export const userSettings = pgTable('user_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  theme: varchar('theme', { length: 50 }).notNull().default('dark'),
  font: varchar('font', { length: 100 }).notNull().default('Inter'),
  fontSize: integer('font_size').notNull().default(18),
  caretStyle: varchar('caret_style', { length: 50 }).notNull().default('line'),
  smoothCaret: boolean('smooth_caret').notNull().default(true),
  soundEnabled: boolean('sound_enabled').notNull().default(false),
  soundVolume: real('sound_volume').notNull().default(0.5),
  punctuation: boolean('punctuation').notNull().default(false),
  numbers: boolean('numbers').notNull().default(false),
  language: varchar('language', { length: 50 }).notNull().default('english'),
  defaultTestMode: varchar('default_test_mode', { length: 50 }).notNull().default('time'),
  defaultTestDuration: integer('default_test_duration').notNull().default(60),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 7. Leaderboard Entries
export const leaderboardEntries = pgTable('leaderboard_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  testId: integer('test_id').notNull().references(() => tests.id, { onDelete: 'cascade' }),
  wordSetId: integer('word_set_id').references(() => wordSets.id, { onDelete: 'set null' }),
  wpm: real('wpm').notNull(),
  accuracy: real('accuracy').notNull(),
  duration: integer('duration').notNull(),
  mode: varchar('mode', { length: 50 }).notNull().default('time'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('leaderboard_wpm_idx').on(table.wpm),
  index('leaderboard_created_at_idx').on(table.createdAt)
]);

// 8. WriteAbout: Practices
export const practices = pgTable('practices', {
  id: serial('id').primaryKey(),
  imageUrl: text('image_url').notNull(),
  text: text('text').notNull(),
  rate: varchar('rate', { length: 50 }).notNull(),
  feedback: text('feedback').notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('practices_user_id_idx').on(table.userId),
  index('practices_created_at_idx').on(table.createdAt)
]);

// 9. WriteAbout: API Calls Log
export const apiCalls = pgTable('api_calls', {
  id: serial('id').primaryKey(),
  endpoint: varchar('endpoint', { length: 100 }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('api_calls_user_id_idx').on(table.userId),
  index('api_calls_created_at_idx').on(table.createdAt)
]);
