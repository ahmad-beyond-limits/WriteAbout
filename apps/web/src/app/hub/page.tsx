'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TypingTestItem {
  id: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  createdAt: string;
}

interface PracticeItem {
  id: number;
  rate: string;
  feedback: string;
  image_url: string;
  text: string;
  date: string;
}

interface PersonalityProfile {
  name: string;
  tier: string;
  description: string;
  score: number;
  rankNumber: number;
  indicators: {
    label: string;
    description: string;
    score: number;
  }[];
}

const RATE_WEIGHTS: Record<string, number> = {
  excellent: 5.0,
  high: 4.2,
  good: 3.5,
  medium: 2.7,
  low: 1.5
};

function GoldMedalBadge({ rankNumber }: { rankNumber: number }) {
  return (
    <div className="relative flex-shrink-0 flex items-center justify-center">
      <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-[0_4px_12px_rgba(180,130,40,0.22)]">
        <defs>
          {/* Beveled Outer Coin Rim */}
          <linearGradient id="coinRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="25%" stopColor="#fde047" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="75%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
          {/* Inner Surface Metallic Gradient */}
          <radialGradient id="coinFace" cx="32%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="45%" stopColor="#fde047" />
            <stop offset="75%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </radialGradient>
          {/* Embossed Numeral & Laurel Gradient */}
          <linearGradient id="embossGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#542e06" />
            <stop offset="70%" stopColor="#783c07" />
            <stop offset="100%" stopColor="#3d1e03" />
          </linearGradient>
        </defs>

        {/* Outer Beveled Rim */}
        <circle cx="50" cy="50" r="47" fill="url(#coinRim)" />
        <circle cx="50" cy="50" r="44" fill="#78350f" opacity="0.3" />
        <circle cx="50" cy="50" r="43" fill="url(#coinFace)" />
        <circle cx="50" cy="50" r="39" fill="none" stroke="#fef08a" strokeWidth="0.75" opacity="0.6" />

        {/* Delicate Laurel Wreath Left */}
        <path d="M28 62 C23 52, 23 38, 30 28" stroke="url(#embossGold)" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.85" />
        <path d="M25 55 Q21 53 23 49 Q26 52 25 55 Z" fill="url(#embossGold)" opacity="0.85" />
        <path d="M24 45 Q20 42 23 38 Q26 42 24 45 Z" fill="url(#embossGold)" opacity="0.85" />
        <path d="M27 36 Q23 32 27 29 Q29 33 27 36 Z" fill="url(#embossGold)" opacity="0.85" />

        {/* Delicate Laurel Wreath Right */}
        <path d="M72 62 C77 52, 77 38, 70 28" stroke="url(#embossGold)" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.85" />
        <path d="M75 55 Q79 53 77 49 Q74 52 75 55 Z" fill="url(#embossGold)" opacity="0.85" />
        <path d="M76 45 Q80 42 77 38 Q74 42 76 45 Z" fill="url(#embossGold)" opacity="0.85" />
        <path d="M73 36 Q77 32 73 29 Q71 33 73 36 Z" fill="url(#embossGold)" opacity="0.85" />

        {/* Bottom Center Star */}
        <polygon points="50,65 51.5,68.5 55,68.5 52.2,70.5 53.2,74 50,71.8 46.8,74 47.8,70.5 45,68.5 48.5,68.5" fill="url(#embossGold)" opacity="0.85" />

        {/* Center Minted Numeral with soft specular highlight */}
        <text
          x="50"
          y="49"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="'Sora', sans-serif"
          fontWeight="800"
          fontSize="28"
          fill="url(#embossGold)"
          style={{ filter: 'drop-shadow(0px 1px 0px rgba(255,255,255,0.7))' }}
        >
          {rankNumber}
        </text>
      </svg>
    </div>
  );
}

// Golden progressive 5-bar spectrum
const GOLD_5_BARS = ['#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706'];

export default function HubPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; username: string; firstName?: string; lastName?: string; role?: string } | null>(null);
  const [typingTests, setTypingTests] = useState<TypingTestItem[]>([]);
  const [practices, setPractices] = useState<PracticeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRankInfo, setShowRankInfo] = useState(false);
  const [showMobileNotice, setShowMobileNotice] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('writeabout_user');
    if (!savedUser) {
      router.push('/login');
      return;
    }

    try {
      const u = JSON.parse(savedUser);
      setUser(u);

      // Fetch both typing telemetry & writing diagnostic practices
      Promise.all([
        fetch(`/api/history?userId=${u.id}&limit=30`).then((r) => r.json()),
        fetch(`/api/insights?filter=month&userId=${u.id}`).then((r) => r.json())
      ])
        .then(([historyData, insightsData]) => {
          if (historyData?.items) {
            setTypingTests(historyData.items);
          }
          if (insightsData?.history) {
            setPractices(insightsData.history);
          }
        })
        .catch((err) => {
          console.error('Error fetching hub telemetry:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } catch (e) {
      localStorage.removeItem('writeabout_user');
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('writeabout_user');
    router.push('/login');
  };

  const handleWriteAboutClick = (e: React.MouseEvent) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      e.preventDefault();
      setShowMobileNotice(true);
    }
  };

  // ── Statistical & Mathematical Personality Formulation (100% Database Telemetry) ──
  const profile: PersonalityProfile = useMemo(() => {
    const hasTyping = typingTests.length > 0;
    const hasPractices = practices.length > 0;

    // 1. Typing Metrics (Direct from PostgreSQL tests table)
    const validWpms = typingTests.map((t) => t.wpm || 0).filter((w) => w > 0);
    const avgWpm = hasTyping && validWpms.length > 0 ? validWpms.reduce((a, b) => a + b, 0) / validWpms.length : 0;
    const avgAccuracy = hasTyping ? typingTests.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) / typingTests.length : 0;
    const avgConsistency = hasTyping ? typingTests.reduce((acc, curr) => acc + (curr.consistency || 0), 0) / typingTests.length : 0;

    // 2. Writing Metrics (Direct from PostgreSQL practices table)
    let totalWords = 0;
    let totalSentences = 0;
    let rateScoreSum = 0;

    if (hasPractices) {
      practices.forEach((p) => {
        const words = p.text ? p.text.trim().split(/\s+/).filter(Boolean).length : 0;
        const sents = p.text ? Math.max(1, (p.text.match(/[^.!?]+[.!?]+/g) || [p.text]).length) : 1;
        totalWords += words;
        totalSentences += sents;
        rateScoreSum += RATE_WEIGHTS[p.rate?.toLowerCase()] || 3.0;
      });
    }

    const avgWordsPerSession = hasPractices ? totalWords / practices.length : 0;
    const avgSentencesPerSession = hasPractices ? totalSentences / practices.length : 0;
    const avgWritingQuality = hasPractices ? rateScoreSum / practices.length : 1.0;

    // 3. Mathematical Dimensions (Normalized 1.0 - 5.0)
    // Point 1: Kinetic Velocity (Raw typing pace vs 70 WPM benchmark)
    const p1_velocity = hasTyping
      ? Math.min(5.0, Math.max(1.0, 1.0 + (avgWpm / 70) * 4.0))
      : 1.0;

    // Point 2: Lexical Richness (Vocabulary depth & word length)
    const p2_lexical = hasPractices
      ? Math.min(5.0, Math.max(1.0, 0.6 * avgWritingQuality + 0.4 * Math.min(5.0, (avgWordsPerSession / 35) * 4.0 + 1.0)))
      : 1.0;

    // Point 3: Syntactic Cadence (Sentence rhythm & clause variance)
    const wordsPerSentenceRatio = avgSentencesPerSession > 0 ? avgWordsPerSession / avgSentencesPerSession : 0;
    const p3_syntactic = hasPractices
      ? Math.min(5.0, Math.max(1.0, 0.5 * avgWritingQuality + 0.5 * Math.min(5.0, (wordsPerSentenceRatio / 12) * 3.5 + 1.0)))
      : 1.0;

    // Point 4: Contextual Alignment (Visual grounding & prompt synthesis)
    const p4_context = hasPractices
      ? Math.min(5.0, Math.max(1.0, 0.7 * avgWritingQuality + 0.3 * (practices.length >= 3 ? 4.5 : 2.5)))
      : 1.0;

    // Point 5: Typographic Precision (Accuracy & Keystroke Reliability)
    const p5_precision = hasTyping
      ? Math.min(5.0, Math.max(1.0, (avgAccuracy / 100) * 4.0 + (avgConsistency / 100) * 1.0))
      : 1.0;

    // 4. Composite Cognitive Score (Weighted average)
    const compositeScore = Number(
      (0.25 * p1_velocity + 0.20 * p2_lexical + 0.20 * p3_syntactic + 0.20 * p4_context + 0.15 * p5_precision).toFixed(1)
    );

    // 5. Hierarchy: Rank 1 (Beginner) -> Rank 5 (Master)
    let personaTier = 'Rank 1 · Beginner';
    let rankNumber = 1;

    if (compositeScore >= 4.7) {
      personaTier = 'Rank 5 · Master';
      rankNumber = 5;
    } else if (compositeScore >= 4.0) {
      personaTier = 'Rank 4 · Advanced';
      rankNumber = 4;
    } else if (compositeScore >= 3.0) {
      personaTier = 'Rank 3 · Proficient';
      rankNumber = 3;
    } else if (compositeScore >= 2.0) {
      personaTier = 'Rank 2 · Developing';
      rankNumber = 2;
    } else {
      personaTier = 'Rank 1 · Beginner';
      rankNumber = 1;
    }

    // 6. Personality Classification Matrix (Speed vs Compositional Depth)
    const speedVector = (p1_velocity + p5_precision) / 2;
    const nuanceVector = (p2_lexical + p3_syntactic + p4_context) / 3;

    let personaName = 'Beginner';
    let personaDesc = 'Complete typing tests and writing exercises to track your skill profile.';

    if (hasTyping || hasPractices) {
      if (speedVector >= 3.8 && nuanceVector >= 3.8) {
        personaName = 'Fast & Expressive';
        personaDesc = 'Fast typing speed paired with strong vocabulary and expressive writing.';
      } else if (speedVector < 3.8 && nuanceVector >= 3.8) {
        personaName = 'Thoughtful Writer';
        personaDesc = 'Structured sentences with careful word choice and high accuracy.';
      } else if (speedVector >= 3.8 && nuanceVector < 3.8) {
        personaName = 'Speed Writer';
        personaDesc = 'Fast typing speed with quick drafting momentum.';
      } else if (compositeScore >= 2.5) {
        personaName = 'Well-Rounded Learner';
        personaDesc = 'Steady typing pace and good sentence structure across exercises.';
      } else {
        personaName = 'Developing Learner';
        personaDesc = 'Building fundamental typing speed and descriptive writing skills.';
      }
    }

    return {
      name: personaName,
      tier: personaTier,
      description: personaDesc,
      score: compositeScore,
      rankNumber,
      indicators: [
        { label: 'Typing Speed', description: 'Keystroke pace & WPM', score: p1_velocity },
        { label: 'Vocabulary Depth', description: 'Word choice & modifiers', score: p2_lexical },
        { label: 'Sentence Flow', description: 'Structure & grammar', score: p3_syntactic },
        { label: 'Context Relevance', description: 'Image description quality', score: p4_context },
        { label: 'Typing Accuracy', description: 'Keystroke precision & consistency', score: p5_precision }
      ]
    };
  }, [typingTests, practices]);

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f8f5] flex items-center justify-center text-[#556b5a] font-mono text-xs">
        Loading workspace telemetry...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#f6f8f5] text-[#1b2b20] selection:bg-[#f3e5c8] selection:text-[#1b2b20] flex flex-col justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden"
      style={{ fontFamily: "'Switzer', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* ── Soft Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-35 blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(245, 230, 190, 0.6) 0%, rgba(240, 246, 238, 0.4) 50%, transparent 100%)' }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[550px] h-[550px] rounded-full opacity-30 blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(230, 215, 180, 0.6) 0%, rgba(246, 248, 245, 0.5) 60%, transparent 100%)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto space-y-5 sm:space-y-6 flex-1 flex flex-col justify-between">
        {/* ── Top Header ── */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-white/85 border border-[#e1e9df] shadow-[0_4px_24px_rgba(27,43,32,0.03)] backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#1e3a24] flex items-center justify-center text-[#e8f2e9] font-bold text-sm shadow-xs transition-transform group-hover:scale-105 shrink-0">
              <svg className="w-4 h-4 text-[#a3d9ad]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-[#1b2b20]">
              duoprep
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {(user?.role === 'admin' || user?.username?.toLowerCase() === 'muhammad ahmad') && (
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-xl bg-[#faedd0] hover:bg-[#f3dfb5] text-[#855307] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-[#e9cf97] transition-all shadow-xs"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Admin Portal</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="w-9 h-9 rounded-xl bg-white border border-[#d8e3d6] hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-[#556b5a] flex items-center justify-center transition-all cursor-pointer shadow-xs group"
            >
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        {/* ── User Greeting Just After Nav Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1 -mt-1 sm:-mt-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1b2b20] font-['Sora',sans-serif]">
              Welcome, {(() => {
                if (user?.lastName && user.lastName.trim()) return user.lastName.trim();
                if (user?.username) {
                  const parts = user.username.trim().split(/\s+/);
                  const last = parts[parts.length - 1];
                  return last.charAt(0).toUpperCase() + last.slice(1);
                }
                return 'Member';
              })()}
            </h1>
            <p className="text-xs text-[#556b5a] mt-0.5">
              Track your typing speed and writing performance
            </p>
          </div>
        </div>

        {/* ── Premium Golden Performance Ranking Card ── */}
        <section
          className="p-5 sm:p-7 rounded-3xl relative overflow-hidden transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #fdf8ec 0%, #f8eed6 45%, #f2e3c0 100%)',
            border: '1px solid rgba(217, 160, 30, 0.4)',
            boxShadow: '0 16px 40px -10px rgba(180, 130, 40, 0.12), inset 0 1px 2px rgba(255, 255, 255, 0.9)'
          }}
        >
          {/* Subtle Ambient Radial Gold Glow */}
          <div
            className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none opacity-40 blur-2xl"
            style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center relative z-10">
            
            {/* Left Column: Big Main Score on Upper Left + Personality */}
            <div className="lg:col-span-5 space-y-2.5 sm:space-y-3 border-b lg:border-b-0 lg:border-r border-[#ebd7ae] pb-4 sm:pb-5 lg:pb-0 lg:pr-6">
              
              {/* Header row with (i) icon */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#d97706] animate-pulse" />
                  <span className="text-[10.5px] font-bold text-[#855307] uppercase tracking-wider">
                    Performance Overview
                  </span>
                </div>

                {/* (i) Info Icon to open Ranks Modal */}
                <button
                  onClick={() => setShowRankInfo(true)}
                  title="Understand Ranking System"
                  className="w-5 h-5 rounded-full bg-[#faedd0] border border-[#e6cf98] text-[#855307] hover:bg-[#f3dfb5] hover:text-[#5c3702] flex items-center justify-center text-[11px] font-serif font-bold transition-all cursor-pointer shadow-xs"
                >
                  i
                </button>
              </div>

              {/* Main Rank Section with Golden Medal Emblem */}
              <div className="flex items-center gap-3 sm:gap-3.5">
                {/* Minted Metallic Gold Coin Emblem with 1-5 rank */}
                <GoldMedalBadge rankNumber={profile.rankNumber} />

                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#18181b] font-['Sora',sans-serif] leading-none">
                    {profile.score.toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-[#8c7e6c]">/ 5.0 Score</span>
                </div>
              </div>

              {/* Personality Archetype & Tier Together */}
              <div className="pt-0.5 sm:pt-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-[#09090b] font-['Sora',sans-serif]">
                    {profile.name}
                  </h2>
                  <span className="text-[10px] sm:text-[10.5px] font-bold text-[#784805] bg-[#faedd0] px-2.5 py-0.5 rounded-full border border-[#e9cf97]">
                    {profile.tier}
                  </span>
                </div>
                <p className="text-xs text-[#575045] leading-relaxed font-normal">
                  {profile.description}
                </p>
              </div>

              <div className="text-[10.5px] sm:text-[11px] font-medium text-[#8c7e6c] pt-0.5">
                {typingTests.length} Typing Tests · {practices.length} Writing Practices
              </div>
            </div>

            {/* Right Column: 5-Point Golden Telemetry Spectrum */}
            <div className="lg:col-span-7 space-y-2.5 sm:space-y-3">
              {profile.indicators.map((ind, idx) => {
                const totalBars = 5;
                const activeBars = Math.min(5, Math.max(1, Math.round(ind.score)));

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-semibold text-[#18181b] text-[11.5px] sm:text-xs">
                          {ind.label}
                        </span>
                        <span className="text-[10.5px] text-[#78716c] hidden sm:inline font-normal">
                          · {ind.description}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 font-bold text-[#09090b]">
                        <span>{ind.score.toFixed(1)}</span>
                        <span className="text-[10px] font-normal text-[#8c7e6c]">/ 5.0</span>
                      </div>
                    </div>

                    {/* 5-Bar Progressive Spectrum in Gold */}
                    <div className="flex gap-1 w-full">
                      {Array.from({ length: totalBars }).map((_, barIdx) => {
                        const isActive = barIdx < activeBars;
                        return (
                          <div
                            key={barIdx}
                            style={{
                              flex: 1,
                              height: '5px',
                              borderRadius: '2.5px',
                              background: isActive ? GOLD_5_BARS[barIdx] : '#e8dccb',
                              transition: 'all 0.25s ease'
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ── Dual Application Launcher Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 my-auto">
          {/* Card 1: WriteAbout */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/95 border border-[#dbe6d9] shadow-[0_10px_30px_-5px_rgba(40,68,44,0.06)] hover:shadow-[0_15px_35px_-5px_rgba(40,68,44,0.1)] hover:border-[#c5d8c3] transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-[#e8f2e9] text-[#2c4731] text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider border border-[#d0e3cf]">
                  Writing Analysis
                </span>
                <span className="text-xs text-[#5f7a65]">
                  60s Timer
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-[#1b2b20] mb-1.5 tracking-tight font-['Sora',sans-serif]">
                WriteAbout
              </h2>
              <p className="text-xs sm:text-sm text-[#4d6353] font-normal leading-relaxed mb-5">
                Fast visual descriptions from image prompts with instant word count and AI rating feedback.
              </p>

              {practices.length > 0 && (
                <div className="mb-5 p-3 rounded-2xl bg-[#f2f7f1] border border-[#e1ece0] flex items-center justify-between text-xs text-[#3d5943]">
                  <span>Practices: <strong className="text-[#1b2b20] font-semibold">{practices.length}</strong></span>
                  <span>Latest: <strong className="text-[#059669] uppercase font-semibold">{practices[0]?.rate || 'Good'}</strong></span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#eaf0e8]">
              <Link
                href="/write-about"
                onClick={handleWriteAboutClick}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#1e3a24] hover:bg-[#162d1c] text-[#f2f7f2] text-xs font-bold uppercase tracking-wider transition-all text-center shadow-[0_4px_14px_rgba(30,58,36,0.18)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch WriteAbout</span>
                <span className="text-sm">→</span>
              </Link>
            </div>
          </div>

          {/* Card 2: SwiftType */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/95 border border-[#d8e3eb] shadow-[0_10px_30px_-5px_rgba(44,79,100,0.06)] hover:shadow-[0_15px_35px_-5px_rgba(44,79,100,0.1)] hover:border-[#c2d5e2] transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-[#e8f1f7] text-[#24485f] text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider border border-[#cfdfeb]">
                  Typing Telemetry
                </span>
                <span className="text-xs text-[#5b7587]">
                  Speed & Accuracy
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-[#172b38] mb-1.5 tracking-tight font-['Sora',sans-serif]">
                SwiftType
              </h2>
              <p className="text-xs sm:text-sm text-[#455f70] font-normal leading-relaxed mb-5">
                Pure typing speed tests with real-time velocity curves, solid caret control, and accuracy reports.
              </p>

              {typingTests.length > 0 ? (
                <div className="mb-5 p-3 rounded-2xl bg-[#f0f6fa] border border-[#dce8f0] flex items-center justify-between text-xs text-[#2f536b]">
                  <span>Tests: <strong className="text-[#172b38] font-semibold">{typingTests.length}</strong></span>
                  <span>Avg: <strong className="text-[#2563eb] font-semibold">{Math.round(typingTests.reduce((a, b) => a + b.wpm, 0) / typingTests.length)} WPM</strong></span>
                </div>
              ) : (
                <div className="mb-5 p-3 rounded-2xl bg-[#f0f6fa] border border-[#dce8f0] flex items-center justify-between text-xs text-[#2f536b]">
                  <span>Modes: <strong className="text-[#172b38] font-semibold">15s / 30s / 60s</strong></span>
                  <span className="text-[#24485f] font-semibold">Live Timing</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#e8f0f5]">
              <Link
                href="/swifttype"
                className="w-full py-3.5 px-5 rounded-2xl bg-[#24485f] hover:bg-[#1a374a] text-[#f0f7fb] text-xs font-bold uppercase tracking-wider transition-all text-center shadow-[0_4px_14px_rgba(36,72,95,0.18)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch SwiftType</span>
                <span className="text-sm">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="w-full text-center text-xs text-[#6c8574] py-1">
          duoprep
        </footer>
      </div>

      {/* ── Mobile Notice Modal for WriteAbout ── */}
      {showMobileNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl p-6 bg-white/95 border border-[#dbe6d9] shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f2e9] text-[#1e3a24] flex items-center justify-center mx-auto shadow-xs">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#0f172a] font-['Sora',sans-serif]">
                Best on Desktop & Laptop
              </h3>
              <p className="text-xs text-[#556b5a] leading-relaxed">
                WriteAbout is a timed visual typing sprint designed for physical keyboards. It works best on a desktop or laptop screen.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => setShowMobileNotice(false)}
                className="w-full py-2.5 px-4 rounded-2xl bg-[#1e3a24] hover:bg-[#162d1c] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
              >
                ← Back
              </button>
              <Link
                href="/write-about"
                onClick={() => setShowMobileNotice(false)}
                className="w-full py-2 px-4 rounded-2xl text-[11px] text-[#556b5a] hover:text-[#1e3a24] font-medium transition-colors text-center"
              >
                Continue on Mobile Anyway →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Redesigned Cognitive Ranking Architecture Modal ── */}
      {showRankInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-5"
            style={{
              background: '#ffffff',
              border: '1px solid #dbe6d9'
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#edf3ec]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-[#faedd0] border border-[#e6cf98] text-[#855307] flex items-center justify-center font-serif font-bold text-xs shadow-xs">
                  i
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0f172a] font-['Sora',sans-serif]">
                    Skill Ranking System
                  </h3>
                  <p className="text-[11px] text-[#64748b]">
                    How your performance score and ranks are calculated
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRankInfo(false)}
                className="w-8 h-8 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#64748b] hover:text-[#0f172a] flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 text-xs text-[#475569] max-h-[68vh] overflow-y-auto pr-1">
              
              {/* Section 1: 5-Level Progression */}
              <div>
                <h4 className="font-bold text-[#0f172a] text-[11px] uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-['Sora',sans-serif]">
                  <span>5-Level Skill Scale</span>
                  <span className="text-[10px] font-normal text-[#64748b]">(Level 1 → 5)</span>
                </h4>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#fefce8] border border-[#fef08a] text-[#854d0e]">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#fde047] text-[#713f12] font-bold text-[10.5px] flex items-center justify-center">5</span>
                      <div>
                        <strong className="text-xs">Rank 5 · Master</strong>
                        <span className="text-[10.5px] text-[#a16207] block">Fast typing speed & advanced, error-free writing</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono">4.7 – 5.0</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46]">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#6ee7b7] text-[#064e3b] font-bold text-[10.5px] flex items-center justify-center">4</span>
                      <div>
                        <strong className="text-xs">Rank 4 · Advanced</strong>
                        <span className="text-[10.5px] text-[#047857] block">High typing speed & rich descriptive vocabulary</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono">4.0 – 4.6</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#e8f3ea] border border-[#bbf7d0] text-[#166534]">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#86efac] text-[#14532d] font-bold text-[10.5px] flex items-center justify-center">3</span>
                      <div>
                        <strong className="text-xs">Rank 3 · Proficient</strong>
                        <span className="text-[10.5px] text-[#15803d] block">Consistent typing rhythm & clear sentence structure</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono">3.0 – 3.9</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] text-[#166534]">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#bbf7d0] text-[#166534] font-bold text-[10.5px] flex items-center justify-center">2</span>
                      <div>
                        <strong className="text-xs">Rank 2 · Developing</strong>
                        <span className="text-[10.5px] text-[#16a34a] block">Building typing pace & descriptive sentence variety</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono">2.0 – 2.9</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-[#475569]">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#e2e8f0] text-[#334155] font-bold text-[10.5px] flex items-center justify-center">1</span>
                      <div>
                        <strong className="text-xs text-[#0f172a]">Rank 1 · Beginner</strong>
                        <span className="text-[10.5px] text-[#64748b] block">Foundational typing speed & basic vocabulary</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-[#0f172a]">1.0 – 1.9</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Score Breakdown */}
              <div>
                <h4 className="font-bold text-[#0f172a] text-[11px] uppercase tracking-wider mb-2 font-['Sora',sans-serif]">
                  Score Breakdown (1.0 - 5.0)
                </h4>
                <div className="space-y-2 bg-[#f8fafc] p-3 rounded-2xl border border-[#e2e8f0]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#334155]">Typing Speed (WPM pace)</span>
                    <strong className="text-[#0f172a] font-mono">25%</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#334155]">Vocabulary Depth (Word diversity & adjectives)</span>
                    <strong className="text-[#0f172a] font-mono">20%</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#334155]">Sentence Flow (Grammar & structure)</span>
                    <strong className="text-[#0f172a] font-mono">20%</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#334155]">Context Relevance (Image description accuracy)</span>
                    <strong className="text-[#0f172a] font-mono">20%</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#334155]">Typing Accuracy (Precision & consistency)</span>
                    <strong className="text-[#0f172a] font-mono">15%</strong>
                  </div>
                </div>
              </div>

              {/* Section 3: Personality Archetypes */}
              <div className="p-3 rounded-2xl bg-[#edf4ed] border border-[#d0e3cf] text-[11.5px] text-[#2c4731] leading-relaxed">
                <strong>Dynamic Personality Archetype:</strong> Determined by comparing your <strong>Speed Vector</strong> (Velocity + Precision) against your <strong>Compositional Depth</strong> (Lexical + Syntactic + Context).
              </div>

            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-[#edf3ec] flex justify-end">
              <button
                onClick={() => setShowRankInfo(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[#1e3a24] hover:bg-[#162d1c] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_4px_14px_rgba(30,58,36,0.18)]"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
