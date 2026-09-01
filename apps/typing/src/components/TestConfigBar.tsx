'use client';

import React from 'react';
import { TestMode } from '@writeabout/types';

interface TestConfigBarProps {
  mode: TestMode;
  setMode: (mode: TestMode) => void;
  timeLimit: number;
  setTimeLimit: (time: number) => void;
  wordCountLimit: number;
  setWordCountLimit: (count: number) => void;
  punctuation: boolean;
  setPunctuation: (val: boolean) => void;
  numbers: boolean;
  setNumbers: (val: boolean) => void;
  wordSet: string;
  setWordSet: (set: string) => void;
  disabled?: boolean;
}

export default function TestConfigBar({
  mode,
  setMode,
  timeLimit,
  setTimeLimit,
  wordCountLimit,
  setWordCountLimit,
  punctuation,
  setPunctuation,
  numbers,
  setNumbers,
  wordSet,
  setWordSet,
  disabled = false
}: TestConfigBarProps) {
  const timeOptions = [15, 30, 60, 120];
  const wordOptions = [10, 25, 50, 100];
  const wordSets = ['English Standard', 'English 1k', 'Tech & Code'];

  return (
    <div
      className={`inline-flex flex-wrap items-center justify-center gap-3 py-2 px-5 rounded-full bg-[var(--surface-glass)] border border-[var(--surface-border)] shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl text-xs font-medium text-[var(--text-secondary)] transition-all duration-300 ${
        disabled ? 'opacity-20 pointer-events-none scale-98' : 'opacity-100 scale-100'
      }`}
    >
      {/* Punctuation & Numbers Toggles */}
      <div className="flex items-center gap-1 border-r border-[var(--surface-border-subtle)] pr-2.5">
        <button
          onClick={() => setPunctuation(!punctuation)}
          className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer ${
            punctuation
              ? 'text-[var(--text-primary)] bg-white/80 shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          @ punct
        </button>
        <button
          onClick={() => setNumbers(!numbers)}
          className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer ${
            numbers
              ? 'text-[var(--text-primary)] bg-white/80 shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          # num
        </button>
      </div>

      {/* Mode Selectors */}
      <div className="flex items-center gap-1 border-r border-[var(--surface-border-subtle)] pr-2.5">
        <button
          onClick={() => setMode('time')}
          className={`px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer ${
            mode === 'time'
              ? 'text-[var(--text-primary)] bg-white/80 shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          time
        </button>
        <button
          onClick={() => setMode('words')}
          className={`px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer ${
            mode === 'words'
              ? 'text-[var(--text-primary)] bg-white/80 shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          words
        </button>
        <button
          onClick={() => setMode('custom')}
          className={`px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer ${
            mode === 'custom'
              ? 'text-[var(--text-primary)] bg-white/80 shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          custom
        </button>
      </div>

      {/* Dynamic Sub-options */}
      <div className="flex items-center gap-1 border-r border-[var(--surface-border-subtle)] pr-2.5">
        {mode === 'time' && (
          <>
            {timeOptions.map((t) => (
              <button
                key={t}
                onClick={() => setTimeLimit(t)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  timeLimit === t
                    ? 'text-[var(--text-primary)] font-bold bg-white/80 shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t}
              </button>
            ))}
          </>
        )}

        {mode === 'words' && (
          <>
            {wordOptions.map((w) => (
              <button
                key={w}
                onClick={() => setWordCountLimit(w)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  wordCountLimit === w
                    ? 'text-[var(--text-primary)] font-bold bg-white/80 shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {w}
              </button>
            ))}
          </>
        )}

        {mode === 'custom' && (
          <div className="flex items-center gap-1.5 px-2">
            <span className="text-[11px] text-[var(--text-secondary)]">limit:</span>
            <input
              type="number"
              min="5"
              max="200"
              value={wordCountLimit}
              onChange={(e) => setWordCountLimit(Math.max(5, parseInt(e.target.value) || 5))}
              className="w-12 px-1.5 py-0.5 rounded-lg bg-white/60 text-[var(--text-primary)] text-center text-xs outline-none border border-[var(--surface-border)]"
            />
          </div>
        )}
      </div>

      {/* Wordset dropdown */}
      <div className="flex items-center gap-1">
        <select
          value={wordSet}
          onChange={(e) => setWordSet(e.target.value)}
          className="bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium py-1 px-2.5 rounded-full cursor-pointer outline-none transition-colors border border-[var(--surface-border)]"
        >
          {wordSets.map((s) => (
            <option key={s} value={s} className="bg-white text-[var(--text-primary)]">
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
