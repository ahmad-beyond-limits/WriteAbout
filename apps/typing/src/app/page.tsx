'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TestMode, TypingTestSubmission } from '@writeabout/types';
import { useSettings } from '@/lib/SettingsContext';
import { useAuth } from '@/lib/AuthContext';
import TypingArea from '@/components/TypingArea';
import ResultsDisplay from '@/components/ResultsDisplay';

export default function TypingPage() {
  const { settings } = useSettings();
  const { user } = useAuth();

  const [mode, setMode] = useState<TestMode>('time');
  const [timeLimit, setTimeLimit] = useState(30);
  const [wordCountLimit, setWordCountLimit] = useState(50);
  const [punctuation, setPunctuation] = useState(false);
  const [numbers, setNumbers] = useState(false);
  const [wordSet, setWordSet] = useState('English Standard');
  const [words, setWords] = useState<string[]>([]);
  const [wordSetId, setWordSetId] = useState<number | null>(null);
  const [isLoadingWords, setIsLoadingWords] = useState(true);
  const [lastResult, setLastResult] = useState<TypingTestSubmission | null>(null);

  const loadCustomWords = useCallback(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('swifttype_custom_text') || '';
      if (saved.trim()) {
        const parsed = saved.trim().split(/\s+/).filter(w => w.length > 0);
        if (parsed.length > 0) {
          setWords(parsed);
          setWordCountLimit(parsed.length);
          setIsLoadingWords(false);
          return true;
        }
      }
    }
    return false;
  }, []);

  useEffect(() => {
    if (settings) {
      const defaultMode = settings.defaultTestMode || 'time';
      setMode(defaultMode);
      setTimeLimit(settings.defaultTestDuration || 30);
      setPunctuation(settings.punctuation || false);
      setNumbers(settings.numbers || false);
      if (defaultMode === 'custom') {
        loadCustomWords();
      }
    }
  }, [settings, loadCustomWords]);

  const fetchWords = useCallback(async () => {
    // Custom words are set manually via the modal — never overwrite them with random words
    if (mode === 'custom') return;
    setIsLoadingWords(true);
    try {
      const count = mode === 'words' ? wordCountLimit + 10 : 120;
      const res = await fetch(
        `/api/words?count=${count}&punctuation=${punctuation}&numbers=${numbers}&wordSet=${encodeURIComponent(wordSet)}`
      );
      if (res.ok) {
        const data = await res.json();
        setWords(data.words || []);
        setWordSetId(data.wordSetId || null);
      }
    } catch (err) {
      console.error('Failed to load words:', err);
    } finally {
      setIsLoadingWords(false);
    }
  }, [mode, wordCountLimit, punctuation, numbers, wordSet]);

  useEffect(() => { fetchWords(); }, [fetchWords]);

  const handleComplete = async (submission: TypingTestSubmission) => {
    setLastResult(submission);
    try {
      await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...submission, userId: user?.id || null, wordSetId })
      });
    } catch (err) {
      console.error('Failed to save result:', err);
    }
  };

  const handleNextTest = () => {
    setLastResult(null);
    // In custom mode, keep the same custom words — don't fetch random words
    if (mode !== 'custom') fetchWords();
  };
  const handleRepeatTest = () => { setLastResult(null); };

  return (
    <div className="w-full h-screen max-h-screen overflow-hidden flex flex-col items-center justify-center select-none m-0 p-0">
      {lastResult ? (
        <ResultsDisplay
          result={lastResult}
          onNextTest={handleNextTest}
          onRepeatTest={handleRepeatTest}
        />
      ) : (
        <TypingArea
          words={words}
          wordSetId={wordSetId}
          mode={mode}
          setMode={setMode}
          timeLimit={timeLimit}
          setTimeLimit={setTimeLimit}
          wordCountLimit={wordCountLimit}
          setWordCountLimit={setWordCountLimit}
          punctuation={punctuation}
          setPunctuation={setPunctuation}
          numbers={numbers}
          setNumbers={setNumbers}
          wordSet={wordSet}
          setWordSet={setWordSet}
          onComplete={handleComplete}
          onRestart={handleNextTest}
          onSetCustomWords={(customWords) => {
            try { localStorage.setItem('swifttype_custom_text', customWords.join(' ')); } catch {}
            setWords(customWords);
            setMode('custom');
            setWordCountLimit(customWords.length);
            setIsLoadingWords(false);
          }}
          isLoadingWords={isLoadingWords}
        />
      )}
    </div>
  );
}
