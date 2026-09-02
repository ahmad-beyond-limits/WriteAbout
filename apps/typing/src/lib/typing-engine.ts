import { TypingTestSubmission } from '@writeabout/types';

export interface DetailedChar {
  char: string;
  state: 'correct' | 'incorrect' | 'extra' | 'untyped';
}

export interface DetailedWord {
  targetWord: string;
  typedWord: string;
  chars: DetailedChar[];
  isCurrent: boolean;
  isComplete: boolean;
  hasError: boolean;
}

/**
 * Calculates typing test statistics based on target words vs typed inputs
 */
export function calculateTypingMetrics(
  targetWords: string[],
  typedWords: string[],
  elapsedMs: number,
  mode: 'time' | 'words' | 'custom' = 'time',
  punctuation: boolean = false,
  numbers: boolean = false,
  userId: number | null = null,
  wordSetId: number | null = null
): TypingTestSubmission {
  const elapsedMinutes = Math.max(elapsedMs / 60000, 0.001);

  let correctCharacters = 0;
  let incorrectCharacters = 0;
  let extraCharacters = 0;
  let missedCharacters = 0;

  for (let i = 0; i < typedWords.length; i++) {
    const target = targetWords[i] || '';
    const typed = typedWords[i] || '';
    const isCompletedWord = i < typedWords.length - 1;

    for (let j = 0; j < typed.length; j++) {
      if (j >= target.length) {
        extraCharacters++;
      } else if (typed[j] === target[j]) {
        correctCharacters++;
      } else {
        incorrectCharacters++;
      }
    }

    if (isCompletedWord) {
      if (typed === target) {
        // Space counts as +1 correct character ONLY if the word was 100% accurate
        correctCharacters++;
      } else {
        incorrectCharacters++;
      }

      if (typed.length < target.length) {
        missedCharacters += (target.length - typed.length);
      }
    } else {
      if (typed.length < target.length) {
        missedCharacters += (target.length - typed.length);
      }
    }
  }

  const totalTypedCharacters = correctCharacters + incorrectCharacters + extraCharacters;
  const rawWpm = Math.max(0, Math.round(((totalTypedCharacters / 5) / elapsedMinutes) * 10) / 10);
  const wpm = Math.max(0, Math.round(((correctCharacters / 5) / elapsedMinutes) * 10) / 10);
  const accuracy = totalTypedCharacters > 0
    ? Math.min(100, Math.max(0, Math.round((correctCharacters / totalTypedCharacters) * 1000) / 10))
    : 0;

  // Consistency estimation based on accuracy and speed stability
  const consistency = Math.min(100, Math.max(0, Math.round(accuracy * 0.92 + (wpm > 0 ? 8 : 0))));

  return {
    userId,
    wordSetId,
    mode,
    duration: Math.round(elapsedMs / 1000),
    wordCount: typedWords.filter(w => w.length > 0).length,
    punctuation,
    numbers,
    targetText: targetWords.slice(0, typedWords.length).join(' '),
    typedText: typedWords.join(' '),
    wpm,
    rawWpm,
    accuracy,
    consistency,
    correctCharacters,
    incorrectCharacters,
    extraCharacters,
    missedCharacters,
    elapsedMilliseconds: Math.round(elapsedMs)
  };
}

/**
 * Low-latency Web Audio sound synthesizer for typing clicks and errors
 */
class SoundEngine {
  private audioCtx: AudioContext | null = null;

  private initCtx() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public playClick(volume: number = 0.5) {
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440 + Math.random() * 80, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.audioCtx.currentTime + 0.04);

      gain.gain.setValueAtTime(volume * 0.25, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.04);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public playError(volume: number = 0.5) {
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(120, this.audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(volume * 0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.08);
    } catch {
      // Audio autoplay policy fallback
    }
  }
}

export const soundEngine = new SoundEngine();
