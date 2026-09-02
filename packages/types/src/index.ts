// Unified User Types
export interface User {
  id: number;
  username: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  apiKey?: string | null;
  createdAt: Date;
  updatedAt?: Date;
}

// Auth Types
export interface AuthUser {
  id: number;
  username: string;
  email?: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role?: string | null;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  apiKey?: string | null;
  error?: string;
}

// Typing Test Core Types
export type TestMode = 'time' | 'words' | 'custom';
export type CaretStyle = 'line' | 'block' | 'underline' | 'off';
export type ThemeMode = 'dark' | 'light' | 'nord' | 'serika' | 'matrix';

export interface WordSet {
  id: number;
  name: string;
  language: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface WordItem {
  id: number;
  wordSetId: number;
  word: string;
  difficulty?: number | null;
  frequency?: number | null;
  isActive: boolean;
}

export interface TypingTestSubmission {
  userId?: number | null;
  wordSetId?: number | null;
  mode: TestMode;
  duration?: number;
  wordCount?: number;
  punctuation: boolean;
  numbers: boolean;
  targetText: string;
  typedText: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correctCharacters: number;
  incorrectCharacters: number;
  extraCharacters: number;
  missedCharacters: number;
  elapsedMilliseconds: number;
}

export interface TypingTestResult extends TypingTestSubmission {
  id: number;
  createdAt: Date;
}

export interface UserStatistics {
  id: number;
  userId: number;
  totalTests: number;
  totalCharacters: number;
  totalCorrectCharacters: number;
  totalIncorrectCharacters: number;
  averageWpm: number;
  bestWpm: number;
  averageAccuracy: number;
  bestAccuracy: number;
  totalTypingTime: number; // in seconds
  updatedAt: Date;
}

export type CaretSmoothness = 'off' | 'fast' | 'medium' | 'slow';

export interface UserSettings {
  id: number;
  userId: number;
  theme: ThemeMode;
  font: string;
  fontSize: number;
  caretStyle: CaretStyle;
  smoothCaret: CaretSmoothness | boolean | string;
  soundEnabled: boolean;
  soundVolume: number;
  punctuation: boolean;
  numbers: boolean;
  language: string;
  defaultTestMode: TestMode;
  defaultTestDuration: number;
  updatedAt: Date;
}

export interface LeaderboardEntry {
  id: number;
  userId: number;
  username: string;
  testId: number;
  wordSetId?: number | null;
  wpm: number;
  accuracy: number;
  duration: number;
  mode: string;
  createdAt: Date;
}

// WriteAbout App Types
export interface PracticeItem {
  id: number;
  imageUrl: string;
  text: string;
  rate: string;
  feedback: string;
  userId?: number | null;
  createdAt: Date;
}

export interface ApiCallLog {
  id: number;
  endpoint: string;
  userId?: number | null;
  createdAt: Date;
}
