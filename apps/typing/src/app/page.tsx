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
  const [timeLimit, setTimeLimit] = useState(60);
  const [wordCountLimit, setWordCountLimit] = useState(50);
  const [punctuation, setPunctuation] = useState(false);
  const [numbers, setNumbers] = useState(false);
  const [wordSet, setWordSet] = useState('English Standard');
  const [words, setWords] = useState<string[]>([]);
  const [wordSetId, setWordSetId] = useState<number | null>(null);
  const [isLoadingWords, setIsLoadingWords] = useState(true);
  const [lastResult, setLastResult] = useState<TypingTestSubmission | null>(null);

  useEffect(() => {
    if (settings) {
      setMode(settings.defaultTestMode || 'time');
      setTimeLimit(settings.defaultTestDuration || 60);
      setPunctuation(settings.punctuation || false);
      setNumbers(settings.numbers || false);
    }
  }, [settings]);

  const fetchWords = useCallback(async () => {
    setIsLoadingWords(true);
    try {
      const count = mode === 'words' || mode === 'custom' ? wordCountLimit + 10 : 120;
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

  const handleNextTest = () => { setLastResult(null); fetchWords(); };
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
          isLoadingWords={isLoadingWords}
        />
      )}
    </div>
  );
}
