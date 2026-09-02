import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters').max(50),
  password: z.string().min(4, 'Password must be at least 4 characters')
});

export const registerSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters').max(50),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  email: z.string().email('Invalid email address').optional().nullable(),
  displayName: z.string().max(100).optional().nullable()
});

export const saveApiKeySchema = z.object({
  userId: z.number().int().positive('Invalid user ID'),
  apiKey: z.string().min(5, 'Invalid API Key')
});

export const typingTestSubmissionSchema = z.object({
  userId: z.number().int().optional().nullable(),
  wordSetId: z.number().int().optional().nullable(),
  mode: z.enum(['time', 'words', 'custom']),
  duration: z.number().int().nonnegative().optional().default(0),
  wordCount: z.number().int().nonnegative().optional().default(0),
  punctuation: z.boolean().default(false),
  numbers: z.boolean().default(false),
  targetText: z.string().min(1, 'Target text is required'),
  typedText: z.string().default(''),
  wpm: z.number().nonnegative(),
  rawWpm: z.number().nonnegative(),
  accuracy: z.number().min(0).max(100),
  consistency: z.number().min(0).max(100).default(100),
  correctCharacters: z.number().int().nonnegative(),
  incorrectCharacters: z.number().int().nonnegative(),
  extraCharacters: z.number().int().nonnegative().default(0),
  missedCharacters: z.number().int().nonnegative().default(0),
  elapsedMilliseconds: z.number().int().positive('Elapsed time must be greater than 0')
});

export const userSettingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'nord', 'serika', 'matrix']).default('dark'),
  font: z.string().default('Inter'),
  fontSize: z.number().int().min(12).max(32).default(18),
  caretStyle: z.enum(['line', 'block', 'underline', 'off']).default('line'),
  smoothCaret: z.union([z.boolean(), z.enum(['off', 'fast', 'medium', 'slow'])]).default('slow'),
  soundEnabled: z.boolean().default(false),
  soundVolume: z.number().min(0).max(1).default(0.5),
  punctuation: z.boolean().default(false),
  numbers: z.boolean().default(false),
  language: z.string().default('english'),
  defaultTestMode: z.enum(['time', 'words', 'custom']).default('time'),
  defaultTestDuration: z.number().int().default(30)
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type SaveApiKeyInput = z.infer<typeof saveApiKeySchema>;
export type TypingTestSubmissionInput = z.infer<typeof typingTestSubmissionSchema>;
export type UserSettingsInput = z.infer<typeof userSettingsSchema>;
