'use client';

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { TestMode, TypingTestSubmission } from '@writeabout/types';
import { useSettings } from '@/lib/SettingsContext';
import { useAuth } from '@/lib/AuthContext';
import { calculateTypingMetrics, soundEngine } from '@/lib/typing-engine';

interface TypingAreaProps {
  words: string[];
  wordSetId: number | null;
  mode: TestMode;
  setMode: (m: TestMode) => void;
  timeLimit: number;
  setTimeLimit: (t: number) => void;
  wordCountLimit: number;
  setWordCountLimit: (c: number) => void;
  punctuation: boolean;
  setPunctuation: (v: boolean) => void;
  numbers: boolean;
  setNumbers: (v: boolean) => void;
  wordSet: string;
  setWordSet: (s: string) => void;
  onComplete: (submission: TypingTestSubmission) => void;
  onRestart: () => void;
  onBackToDashboard?: () => void;
  isLoadingWords: boolean;
}

const TIME_OPTIONS = [15, 30, 60, 120];
const WORD_OPTIONS = [10, 25, 50, 100];
const WORD_SETS = ['English Standard', 'English 1k', 'Tech & Code'];

/* ------------------------------------------------------------------
   ONEST 4-LINE COMPACT LINE SPACING
   40px font × 1.65 lineHeight = 66px per line → 4 lines = 264px
------------------------------------------------------------------ */
const FONT_SIZE = 48;
const LINE_HEIGHT = 1.5;
const STAGE_HEIGHT = 144; // Exact 2-line standard viewport (72px * 2)

export default function TypingArea({
  words, wordSetId,
  mode, setMode,
  timeLimit, setTimeLimit,
  wordCountLimit, setWordCountLimit,
  punctuation, setPunctuation,
  numbers, setNumbers,
  wordSet, setWordSet,
  onComplete, onRestart,
  onBackToDashboard,
  isLoadingWords,
}: TypingAreaProps) {
  const { settings } = useSettings();
  const { user } = useAuth();

  const [typedWords, setTypedWords] = useState<string[]>(['']);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [capsLock, setCapsLock] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Global Caps Lock listener
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (typeof e.getModifierState === 'function') {
        setCapsLock(e.getModifierState('CapsLock'));
      }
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
    };
  }, []);

  // Reset on word/config change
  useEffect(() => {
    setTypedWords(['']);
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    setIsStarted(false);
    setIsFinished(false);
    setTimeLeft(timeLimit);
    setStartTime(null);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (wordsRef.current) { wordsRef.current.scrollTop = 0; }
    inputRef.current?.focus();
  }, [words, timeLimit, mode, wordCountLimit]);

  // Smooth line-based scroll: runs ONLY when moving to a new word, NEVER on individual keypresses
  useEffect(() => {
    if (!wordsRef.current || isFinished) return;
    const wordEl = wordsRef.current.querySelector(`[data-word-idx="${currentWordIndex}"]`) as HTMLElement | null;
    if (!wordEl) return;

    const lineH = Math.round(FONT_SIZE * LINE_HEIGHT);
    const wordTop = wordEl.offsetTop;
    const currentLine = Math.round(wordTop / lineH);

    // When on Line 2 or beyond (currentLine >= 2), scroll so current line is on the bottom line (row 2)
    if (currentLine >= 2) {
      const targetScroll = (currentLine - 1) * lineH;
      if (Math.abs(wordsRef.current.scrollTop - targetScroll) > 4) {
        wordsRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    } else {
      if (wordsRef.current.scrollTop !== 0) {
        wordsRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentWordIndex, isFinished]);

  // Real, dynamic, pixel-accurate Caret Measurement
  const updateCaret = useCallback(() => {
    if (!wordsRef.current || !caretRef.current || isFinished) return;
    const wordEl = wordsRef.current.querySelector(`[data-word-idx="${currentWordIndex}"]`) as HTMLElement | null;
    if (!wordEl) return;

    const charEls = wordEl.querySelectorAll('.char');
    const wordsRect = wordsRef.current.getBoundingClientRect();
    let left = 0;
    let top = 0;

    if (currentCharIndex === 0) {
      // Beginning of the current word
      const firstChar = charEls[0] as HTMLElement | undefined;
      if (firstChar) {
        const charRect = firstChar.getBoundingClientRect();
        left = charRect.left - wordsRect.left + wordsRef.current.scrollLeft;
        top = charRect.top - wordsRect.top + wordsRef.current.scrollTop + 4;
      } else {
        const wordRect = wordEl.getBoundingClientRect();
        left = wordRect.left - wordsRect.left + wordsRef.current.scrollLeft;
        top = wordRect.top - wordsRect.top + wordsRef.current.scrollTop + 4;
      }
    } else if (currentCharIndex < charEls.length) {
      // In front of the character currently being typed
      const targetChar = charEls[currentCharIndex] as HTMLElement | undefined;
      if (targetChar) {
        const charRect = targetChar.getBoundingClientRect();
        left = charRect.left - wordsRect.left + wordsRef.current.scrollLeft;
        top = charRect.top - wordsRect.top + wordsRef.current.scrollTop + 4;
      }
    } else {
      // Right after the last character in the current word
      const lastChar = charEls[charEls.length - 1] as HTMLElement | undefined;
      if (lastChar) {
        const charRect = lastChar.getBoundingClientRect();
        left = charRect.right - wordsRect.left + wordsRef.current.scrollLeft;
        top = charRect.top - wordsRect.top + wordsRef.current.scrollTop + 4;
      } else {
        const wordRect = wordEl.getBoundingClientRect();
        left = wordRect.right - wordsRect.left + wordsRef.current.scrollLeft;
        top = wordRect.top - wordsRect.top + wordsRef.current.scrollTop + 4;
      }
    }

    caretRef.current.style.left = `${Math.round(left)}px`;
    caretRef.current.style.top = `${Math.round(top)}px`;
    caretRef.current.style.display = 'block';
  }, [currentWordIndex, currentCharIndex, isFinished]);

  useLayoutEffect(() => {
    updateCaret();
  }, [typedWords, currentWordIndex, currentCharIndex, updateCaret]);

  useEffect(() => {
    window.addEventListener('resize', updateCaret);
    return () => window.removeEventListener('resize', updateCaret);
  }, [updateCaret]);

  const finishTest = useCallback((elapsedMs: number) => {
    if (isFinished) return;
    setIsFinished(true);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const sub = calculateTypingMetrics(
      words.slice(0, typedWords.length), typedWords, elapsedMs,
      mode, punctuation, numbers, user?.id || null, wordSetId,
    );
    onComplete(sub);
  }, [isFinished, words, typedWords, mode, punctuation, numbers, user, wordSetId, onComplete]);

  // Timer
  useEffect(() => {
    if (isStarted && !isFinished && mode === 'time') {
      timerRef.current = setInterval(() => {
        setTimeLeft(p => { if (p <= 1) { clearInterval(timerRef.current!); return 0; } return p - 1; });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isStarted, isFinished, mode]);

  useEffect(() => {
    if (isStarted && !isFinished && mode === 'time' && timeLeft === 0) finishTest(timeLimit * 1000);
  }, [timeLeft, isStarted, isFinished, mode, timeLimit, finishTest]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLock(e.getModifierState('CapsLock'));
    }
    if (isFinished || isLoadingWords || !words.length) return;
    if (e.key === 'Tab') { e.preventDefault(); onRestart(); return; }
    if (e.key === 'Escape') { e.preventDefault(); inputRef.current?.focus(); return; }
    if (!isStarted) { setIsStarted(true); setStartTime(Date.now()); }

    const word = words[currentWordIndex] || '';
    const typed = typedWords[currentWordIndex] || '';

    if (settings.soundEnabled && e.key.length === 1 && e.key !== ' ') {
      const ok = typed.length < word.length && e.key === word[typed.length];
      ok ? soundEngine.playClick(settings.soundVolume) : soundEngine.playError(settings.soundVolume);
    }

    if (e.key === ' ') {
      e.preventDefault();
      if (!typed.length) return;
      if (mode === 'words' && currentWordIndex + 1 >= wordCountLimit) { finishTest(startTime ? Date.now() - startTime : 1000); return; }
      if (currentWordIndex + 1 >= words.length) { finishTest(startTime ? Date.now() - startTime : 1000); return; }
      setTypedWords(p => [...p, '']);
      setCurrentWordIndex(p => p + 1);
      setCurrentCharIndex(0);
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (typed.length > 0) {
        const u = typed.slice(0, -1);
        setTypedWords(p => { const n = [...p]; n[currentWordIndex] = u; return n; });
        setCurrentCharIndex(typed.length - 1);
      } else if (currentWordIndex > 0 && e.ctrlKey) {
        setTypedWords(p => p.slice(0, -1));
        setCurrentWordIndex(p => p - 1);
        setCurrentCharIndex(typedWords[currentWordIndex - 1]?.length || 0);
      }
      return;
    }

    if (e.key === 'length' || (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey)) {
      e.preventDefault();
      const u = typed + e.key;
      setTypedWords(p => { const n = [...p]; n[currentWordIndex] = u; return n; });
      setCurrentCharIndex(u.length);
      if ((mode === 'words' || mode === 'custom') &&
          currentWordIndex + 1 >= Math.min(words.length, wordCountLimit) &&
          u === word) finishTest(startTime ? Date.now() - startTime : 1000);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center cursor-text select-none m-0 p-0"
      onClick={() => inputRef.current?.focus()}
    >
      <input ref={inputRef} type="text"
        className="absolute opacity-0 pointer-events-none w-0 h-0"
        onKeyDown={handleKeyDown}
        onKeyUp={(e) => {
          if (typeof e.getModifierState === 'function') {
            setCapsLock(e.getModifierState('CapsLock'));
          }
        }}
        autoFocus />

      {/* ── Full Screen Frosted Glass Sheet with Square Corners ── */}
      <div className="w-full h-full rounded-none bg-white/[0.14] backdrop-blur-2xl overflow-hidden flex flex-col justify-between m-0 p-0">

        {/* ── Top Bar: Back Button + Controls + 100% Bright Timer ── */}
        <div className="flex items-center justify-between px-3.5 sm:px-16 py-3 sm:py-4 border-b border-white/[0.1]">

          {/* Left Controls with Minimal Back Button */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
            {/* Minimal Back Button */}
            <a
              href="http://localhost:3000"
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold text-[#cbd5e1] hover:text-white hover:bg-white/10 transition-all mr-1 cursor-pointer"
              title="Return to Hub"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Hub</span>
            </a>
            <Div />

            {/* Toggles */}
            <Cfg active={punctuation} onClick={() => setPunctuation(!punctuation)}>@ punct</Cfg>
            <Cfg active={numbers} onClick={() => setNumbers(!numbers)}># num</Cfg>
            <Div />

            {/* Mode */}
            {(['time', 'words', 'custom'] as TestMode[]).map(m => (
              <Cfg key={m} active={mode === m} onClick={() => setMode(m)}>{m}</Cfg>
            ))}
            <Div />

            {/* Options */}
            {mode === 'time' && TIME_OPTIONS.map(t => <Cfg key={t} active={timeLimit === t} onClick={() => setTimeLimit(t)}>{t}</Cfg>)}
            {mode === 'words' && WORD_OPTIONS.map(w => <Cfg key={w} active={wordCountLimit === w} onClick={() => setWordCountLimit(w)}>{w}</Cfg>)}
            {mode === 'custom' && (
              <input type="number" min="5" max="200" value={wordCountLimit}
                onChange={e => setWordCountLimit(Math.max(5, parseInt(e.target.value) || 5))}
                className="w-12 text-center text-xs bg-white text-[#0f172a] rounded px-2 py-0.5 outline-none font-bold" />
            )}
            <Div />

            {/* Word Set */}
            <select value={wordSet} onChange={e => setWordSet(e.target.value)}
              className="bg-transparent text-[#cbd5e1] hover:text-white text-xs cursor-pointer outline-none transition-colors font-medium">
              {WORD_SETS.map(s => <option key={s} value={s} className="bg-[#0f172a] text-white">{s}</option>)}
            </select>
          </div>

          {/* Solid 100% Bright Timer (Never Fades) */}
          <div className="flex items-baseline gap-1.5 sm:gap-2 shrink-0 pl-3 sm:pl-6">
            <span className="text-3xl sm:text-5xl font-light tabular-nums text-white drop-shadow-xs">
              {mode === 'time' ? timeLeft : currentWordIndex + 1}
            </span>
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-[#94a3b8]">
              {mode === 'time' ? 's' : `/ ${wordCountLimit}`}
            </span>
          </div>
        </div>

        {/* ── Caps Lock Alert Banner ── */}
        {capsLock && (
          <div className="flex items-center justify-center -mb-4 mt-3 px-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/25 border border-amber-400/50 text-amber-300 text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-md animate-pulse">
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7 7h-4v7H9v-7H5l7-7z" />
                <path d="M5 21h14" />
              </svg>
              <span>Caps Lock is ON</span>
            </div>
          </div>
        )}

        {/* ── Centered 2-Line Inset Word Stage ── */}
        <div className="px-4 sm:px-20 md:px-32 lg:px-44 py-6 sm:py-12 my-auto flex items-center justify-center">
          <div
            ref={wordsRef}
            className="relative w-full overflow-hidden scroll-smooth font-sans"
            style={{
              height: `${STAGE_HEIGHT}px`,
              display: 'flex',
              flexWrap: 'wrap',
              alignContent: 'flex-start',
              gap: `0 0.38em`,
              fontSize: `${FONT_SIZE}px`,
              lineHeight: LINE_HEIGHT,
              fontWeight: 400,
              letterSpacing: '0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {/* Real Dynamic Caret (Zero Blink, Zero Glow, 50px Rounded) */}
            <div
              ref={caretRef}
              className="caret-line"
              style={{
                display: isFinished ? 'none' : 'block',
                animation: 'none',
                opacity: 1,
                boxShadow: 'none',
                borderRadius: '50px',
                transition: settings.smoothCaret ? 'left 0.07s cubic-bezier(0.16,1,0.3,1), top 0.07s cubic-bezier(0.16,1,0.3,1)' : 'none',
              }}
            />

            {isLoadingWords ? (
              <div className="w-full py-16 flex items-center justify-center text-[#94a3b8] text-sm tracking-widest uppercase font-sans">
                loading…
              </div>
            ) : (
              words.map((word, wIdx) => {
                const typed = typedWords[wIdx] || '';
                const isCur = wIdx === currentWordIndex;
                const isPast = wIdx < currentWordIndex;
                return (
                  <span
                    key={wIdx}
                    data-word-idx={wIdx}
                    className="inline-flex word"
                    style={{ opacity: wIdx < currentWordIndex - 12 ? 0.2 : 1, transition: 'opacity 0.2s' }}
                  >
                    {word.split('').map((ch, cIdx) => {
                      let cls = 'char char-untyped';
                      if (isPast) {
                        cls = cIdx < typed.length
                          ? (typed[cIdx] === ch ? 'char char-correct' : 'char char-incorrect')
                          : 'char char-incorrect';
                      } else if (isCur && cIdx < typed.length) {
                        cls = typed[cIdx] === ch ? 'char char-correct' : 'char char-incorrect';
                      }
                      return <span key={cIdx} className={cls}>{ch}</span>;
                    })}
                    {typed.length > word.length &&
                      typed.slice(word.length).split('').map((ec, i) => (
                        <span key={`ex${i}`} className="char char-extra">{ec}</span>
                      ))}
                  </span>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom clean edge spacer */}
        <div className="h-6" />

      </div>
    </div>
  );
}

function Cfg({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1 rounded text-xs font-semibold tracking-wider uppercase cursor-pointer transition-all ${
        active
          ? 'text-[#0f172a] bg-white font-bold shadow-sm'
          : 'text-[#cbd5e1] hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

function Div() {
  return <span className="shrink-0 w-px h-3.5 bg-white/20 mx-0.5" />;
}
