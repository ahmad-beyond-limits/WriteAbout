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
  onSetCustomWords?: (words: string[]) => void;
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

const getCaretTransition = (smoothness: string | boolean | undefined) => {
  if (smoothness === 'off' || smoothness === false) {
    return 'none';
  }
  if (smoothness === 'fast') {
    return 'transform 0.05s cubic-bezier(0.2, 0.9, 0.3, 1)';
  }
  if (smoothness === 'medium') {
    return 'transform 0.09s cubic-bezier(0.25, 1, 0.5, 1)';
  }
  // Default: 'slow' (Pronounced Cinematic Slide Effect)
  return 'transform 0.15s cubic-bezier(0.12, 0.98, 0.24, 1)';
};

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
  onSetCustomWords,
}: TypingAreaProps) {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();

  const [typedWords, setTypedWords] = useState<string[]>(['']);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [capsLock, setCapsLock] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customInputText, setCustomInputText] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('swifttype_custom_text') || '';
    }
    return '';
  });

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

    caretRef.current.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
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

    if (e.key === ' ' || (e.key === 'Enter' && (mode === 'custom' || mode === 'words') && currentWordIndex + 1 >= (mode === 'custom' ? words.length : wordCountLimit))) {
      e.preventDefault();
      if (!typed.length) return;
      if (mode === 'words' && currentWordIndex + 1 >= wordCountLimit) { finishTest(startTime ? Date.now() - startTime : 1000); return; }
      if (mode === 'custom' && currentWordIndex + 1 >= words.length) { finishTest(startTime ? Date.now() - startTime : 1000); return; }
      if (e.key === 'Enter') return; // Enter mid-test (not last word) — do nothing
      if (currentWordIndex + 1 >= words.length) { finishTest(startTime ? Date.now() - startTime : 1000); return; }

      setTypedWords(p => {
        const n = [...p];
        if (currentWordIndex + 1 >= n.length) {
          n.push('');
        }
        return n;
      });
      setCurrentWordIndex(p => p + 1);
      setCurrentCharIndex(0);
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (e.ctrlKey) {
        if (typed.length > 0) {
          // Clear entire current word
          setTypedWords(p => { const n = [...p]; n[currentWordIndex] = ''; return n; });
          setCurrentCharIndex(0);
        } else if (currentWordIndex > 0) {
          // Step back and clear previous word
          const prevWord = typedWords[currentWordIndex - 1] || '';
          setTypedWords(p => p.slice(0, -1));
          setCurrentWordIndex(p => p - 1);
          setCurrentCharIndex(prevWord.length);
        }
        return;
      }

      if (typed.length > 0) {
        const u = typed.slice(0, -1);
        setTypedWords(p => { const n = [...p]; n[currentWordIndex] = u; return n; });
        setCurrentCharIndex(u.length);
      } else if (currentWordIndex > 0) {
        // Step back to the end of the previous word to fix it
        const prevWord = typedWords[currentWordIndex - 1] || '';
        setTypedWords(p => p.slice(0, -1));
        setCurrentWordIndex(p => p - 1);
        setCurrentCharIndex(prevWord.length);
      }
      return;
    }

    if (e.key === 'length' || (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey)) {
      e.preventDefault();
      const u = typed + e.key;
      setTypedWords(p => { const n = [...p]; n[currentWordIndex] = u; return n; });
      setCurrentCharIndex(u.length);
      if ((mode === 'words' || mode === 'custom') &&
          currentWordIndex + 1 >= (mode === 'custom' ? words.length : Math.min(words.length, wordCountLimit)) &&
          u === word) finishTest(startTime ? Date.now() - startTime : 1000);
    }
  };

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center ${showCustomModal ? 'select-auto' : 'cursor-text select-none'} m-0 p-0`}
      onClick={() => {
        if (!showCustomModal) {
          inputRef.current?.focus();
        }
      }}
    >
      <input
        ref={inputRef}
        type="text"
        className="absolute opacity-0 pointer-events-none w-0 h-0"
        disabled={showCustomModal}
        tabIndex={showCustomModal ? -1 : 0}
        onKeyDown={handleKeyDown}
        onKeyUp={(e) => {
          if (typeof e.getModifierState === 'function') {
            setCapsLock(e.getModifierState('CapsLock'));
          }
        }}
        autoFocus={!showCustomModal}
      />

      {/* ── Full Screen Frosted Glass Sheet with Square Corners ── */}
      <div className="w-full h-full rounded-none bg-white/[0.14] backdrop-blur-2xl overflow-hidden flex flex-col justify-between m-0 p-0">

        {/* ── Top Bar: Back Button + Controls + 100% Bright Timer ── */}
        <div className="flex items-center justify-between px-3.5 sm:px-12 py-3 sm:py-3.5 border-b border-white/[0.1] overflow-hidden">

          {/* Left Controls with Minimal Back Button */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-hidden no-scrollbar shrink">
            {/* Minimal Back Button */}
            <a
              href="http://localhost:3000"
              className="shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-[#cbd5e1] hover:text-white hover:bg-white/10 transition-all cursor-pointer"
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
              <Cfg
                key={m}
                active={mode === m}
                onClick={() => {
                  setMode(m);
                  if (m === 'custom') {
                    setCustomInputText(words.join(' '));
                    setShowCustomModal(true);
                  }
                }}
              >
                {m}
              </Cfg>
            ))}
            <Div />

            {/* Options */}
            {mode === 'time' && TIME_OPTIONS.map(t => <Cfg key={t} active={timeLimit === t} onClick={() => setTimeLimit(t)}>{t}</Cfg>)}
            {mode === 'words' && WORD_OPTIONS.map(w => <Cfg key={w} active={wordCountLimit === w} onClick={() => setWordCountLimit(w)}>{w}</Cfg>)}
            {mode === 'custom' && (
              <button
                type="button"
                onClick={() => setShowCustomModal(true)}
                className="shrink-0 px-3 py-1 rounded text-xs font-semibold tracking-wider uppercase cursor-pointer transition-all text-[#e2e8f0] hover:text-white hover:bg-white/10"
              >
                {words.length > 0 ? `edit text (${words.length}w)` : 'add text'}
              </button>
            )}
            <Div />

            {/* Word Set */}
            <select value={wordSet} onChange={e => setWordSet(e.target.value)}
              className="bg-transparent text-[#cbd5e1] hover:text-white text-xs cursor-pointer outline-none transition-colors font-medium shrink-0">
              {WORD_SETS.map(s => <option key={s} value={s} className="bg-[#0f172a] text-white">{s}</option>)}
            </select>
            <Div />

            {/* Caret Smoothness Dropdown (Clean matching style) */}
            <select
              value={typeof settings?.smoothCaret === 'string' ? settings.smoothCaret : (settings?.smoothCaret ? 'slow' : 'off')}
              onChange={e => updateSettings({ smoothCaret: e.target.value as any })}
              className="bg-transparent text-[#cbd5e1] hover:text-white text-xs cursor-pointer outline-none transition-colors font-medium shrink-0"
            >
              <option value="slow" className="bg-[#0f172a] text-white">smooth: slow</option>
              <option value="medium" className="bg-[#0f172a] text-white">smooth: medium</option>
              <option value="fast" className="bg-[#0f172a] text-white">smooth: fast</option>
              <option value="off" className="bg-[#0f172a] text-white">smooth: off</option>
            </select>
          </div>

          {/* Solid 100% Bright Timer (Never Fades) */}
          <div className="flex items-baseline gap-1 sm:gap-1.5 shrink-0 pl-3 sm:pl-6">
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
            {/* Real Dynamic Caret (MonkeyType-style GPU translate3d hardware accelerated) */}
            <div
              ref={caretRef}
              className="caret-line"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                display: isFinished ? 'none' : 'block',
                animation: 'none',
                opacity: 1,
                boxShadow: 'none',
                borderRadius: '50px',
                willChange: 'transform',
                transition: getCaretTransition(settings?.smoothCaret ?? 'slow'),
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

        {/* ── Custom Text Modal (Light Slate Theme) ── */}
        {showCustomModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-150 select-auto"
            onClick={(e) => {
              e.stopPropagation();
              if (e.target === e.currentTarget) {
                setShowCustomModal(false);
                setTimeout(() => inputRef.current?.focus(), 50);
              }
            }}
          >
            <div
              className="w-full max-w-xl rounded-3xl p-6 sm:p-7 bg-white border border-slate-200 shadow-2xl space-y-4 text-slate-900 select-auto"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-sans">
                      Practice Custom Text
                    </h3>
                    <p className="text-xs text-slate-500">
                      Paste or type any custom paragraphs, code snippets, or study texts
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomModal(false);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center text-sm cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Presets:</span>
                {[
                  { label: 'Pangram', text: 'The quick brown fox jumps over the lazy dog while five boxing wizards jump quickly.' },
                  { label: 'Philosophy', text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit. The secret of getting ahead is getting started.' },
                  { label: 'Programming', text: 'function calculateTypingSpeed(words, timeInSeconds) { return Math.round((words.length / timeInSeconds) * 60); }' },
                  { label: 'Science', text: 'The universe is under no obligation to make sense to you. Everything we call real is made of things that cannot be regarded as real.' },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCustomInputText(preset.text)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60 transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={customInputText}
                  onChange={(e) => setCustomInputText(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Paste or type your custom text here. Add as much text as you want..."
                  rows={6}
                  autoFocus
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none resize-y font-sans leading-relaxed select-text shadow-xs"
                />
                <div className="flex items-center justify-between mt-1 px-1 text-[11px] text-slate-500">
                  <span>
                    Words: <strong className="text-slate-700 font-mono">{customInputText.trim() ? customInputText.trim().split(/\s+/).length : 0}</strong> | Characters: <strong className="text-slate-700 font-mono">{customInputText.length}</strong>
                  </span>
                  {customInputText.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCustomInputText('')}
                      className="text-rose-600 hover:text-rose-700 font-medium hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomModal(false);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!customInputText.trim()}
                  onClick={() => {
                    const parsedWords = customInputText.trim().split(/\s+/).filter(w => w.length > 0);
                    if (parsedWords.length === 0) return;
                    try { localStorage.setItem('swifttype_custom_text', customInputText); } catch {}
                    if (onSetCustomWords) onSetCustomWords(parsedWords);
                    setShowCustomModal(false);
                    setTypedWords(['']);
                    setCurrentWordIndex(0);
                    setCurrentCharIndex(0);
                    setIsStarted(false);
                    setIsFinished(false);
                    setStartTime(null);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <span>Start Practice</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        )}

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
