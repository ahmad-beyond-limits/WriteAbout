'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { TestMode, TypingTestSubmission } from '@writeabout/types';
import { SettingsProvider, useSettings } from '@/lib/SettingsContext';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import TypingArea from '@/components/TypingArea';
import ResultsDisplay from '@/components/ResultsDisplay';

interface TestHistoryItem {
  id: number;
  mode: string;
  duration: number | null;
  wordCount: number | null;
  punctuation: boolean;
  numbers: boolean;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correctCharacters: number;
  incorrectCharacters: number;
  createdAt: string;
  wordSetName?: string;
}

function SwiftTypeDashboard({
  onStartTest,
  onStartCustomText,
  userId,
  userLastName
}: {
  onStartTest: () => void;
  onStartCustomText: (text: string) => void;
  userId: number;
  userLastName?: string;
}) {
  const [history, setHistory] = useState<TestHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customText, setCustomText] = useState('');

  const fetchHistory = useCallback(async () => {
    if (!userId || userId <= 0) {
      setHistory([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/history?userId=${userId}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.items || []);
      }
    } catch (e) {
      console.error('Failed to load typing history:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const stats = useMemo(() => {
    if (!history || history.length === 0) {
      return {
        totalTests: 0,
        peakWpm: 0,
        avgWpm: 0,
        avgAccuracy: 0,
        avgConsistency: 0,
        totalChars: 0,
        modeCounts: { time: 0, words: 0, custom: 0 },
        chartData: []
      };
    }

    const peak = Math.max(...history.map((h) => h.wpm || 0));
    const totalWpm = history.reduce((sum, h) => sum + (h.wpm || 0), 0);
    const avgWpm = Math.round(totalWpm / history.length);
    const avgAcc = Math.round(history.reduce((sum, h) => sum + (h.accuracy || 0), 0) / history.length);
    const avgCons = Math.round(history.reduce((sum, h) => sum + (h.consistency || 0), 0) / history.length);
    const totalChars = history.reduce((sum, h) => sum + ((h.correctCharacters || 0) + (h.incorrectCharacters || 0)), 0);

    const modeCounts = { time: 0, words: 0, custom: 0 };
    history.forEach((h) => {
      if (h.mode === 'time') modeCounts.time++;
      else if (h.mode === 'words') modeCounts.words++;
      else modeCounts.custom++;
    });

    const chartData = [...history]
      .reverse()
      .slice(-14)
      .map((h) => ({
        index: `#${h.id}`,
        wpm: h.wpm,
        rawWpm: h.rawWpm,
        accuracy: h.accuracy,
        date: new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      }));

    return {
      totalTests: history.length,
      peakWpm: peak,
      avgWpm,
      avgAccuracy: avgAcc,
      avgConsistency: avgCons,
      totalChars,
      modeCounts,
      chartData
    };
  }, [history]);

  return (
    <div
      className="w-full min-h-screen flex flex-col justify-between p-6 sm:p-8 select-none text-[#1b2b20] relative overflow-hidden"
      style={{
        background: '#f6f8f5',
        fontFamily: "'Switzer', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* ── Ambient Radial Glows ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-40 blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(216, 235, 218, 0.6) 0%, rgba(240, 246, 238, 0.4) 50%, transparent 100%)' }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[550px] h-[550px] rounded-full opacity-35 blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(218, 234, 245, 0.6) 0%, rgba(246, 248, 245, 0.5) 60%, transparent 100%)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto space-y-6 flex-1 flex flex-col justify-between">
        
        {/* ── Top Header ── */}
        <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-white/85 border border-[#e1e9df] shadow-[0_4px_24px_rgba(27,43,32,0.03)] backdrop-blur-xl shrink-0 w-full">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <Link
              href="/hub"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#edf4ed] hover:bg-[#e1ede1] text-[#2c4731] text-xs font-semibold tracking-wider uppercase transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Workspace Hub</span>
            </Link>
            <span className="hidden sm:inline-block w-px h-4 bg-[#dbe6d9]" />
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-semibold tracking-tight text-[#0f172a] font-['Sora',sans-serif]">
                SwiftType
              </h1>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Link
              href="/settings"
              title="Settings"
              className="w-9 h-9 rounded-xl bg-white border border-[#d8e3d6] hover:bg-[#f0f4ee] text-[#556b5a] hover:text-[#1b2b20] flex items-center justify-center transition-all cursor-pointer shadow-xs group"
            >
              <svg className="w-4 h-4 transition-transform group-hover:rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>

            <button
              onClick={() => setShowCustomModal(true)}
              className="px-4 py-2.5 sm:py-2 rounded-2xl bg-white hover:bg-[#edf4ed] border border-[#d8e3d6] hover:border-[#1e3a24] text-[#1e3a24] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Custom Text</span>
            </button>

            <button
              onClick={onStartTest}
              className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-2xl bg-[#1e3a24] hover:bg-[#162d1c] text-[#f2f7f2] text-xs font-bold uppercase tracking-wider transition-all shadow-[0_4px_14px_rgba(30,58,36,0.18)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start Speed Test</span>
              <span className="text-sm">→</span>
            </button>
          </div>
        </header>

        {/* ── User Greeting Just After Nav Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1 -mt-1 sm:-mt-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0f172a] font-['Sora',sans-serif]">
              Welcome, {(() => {
                if (userLastName && userLastName.trim()) {
                  const parts = userLastName.trim().split(/\s+/);
                  const last = parts[parts.length - 1];
                  return last.charAt(0).toUpperCase() + last.slice(1);
                }
                return 'Typist';
              })()}
            </h1>
            <p className="text-xs text-[#64748b] mt-0.5">
              Typing speed and accuracy overview
            </p>
          </div>
        </div>

        {/* ── Key Performance Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          
          {/* Card 1: Peak WPM */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white/95 border border-[#dbe6d9] shadow-[0_4px_20px_rgba(27,43,32,0.03)] hover:border-[#c5d8c3] transition-all flex flex-col justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#64748b]">
              Peak Speed
            </span>
            <div className="my-2.5 flex items-baseline gap-1">
              <span className="text-4xl sm:text-[40px] font-light text-[#1e3a24] font-['Sora',sans-serif] tracking-tight leading-none">
                {stats.peakWpm}
              </span>
              <span className="text-xs font-normal text-[#94a3b8]">WPM</span>
            </div>
            <span className="text-[10.5px] text-[#059669] font-medium">Best Record</span>
          </div>

          {/* Card 2: Avg WPM */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white/95 border border-[#dbe6d9] shadow-[0_4px_20px_rgba(27,43,32,0.03)] hover:border-[#c5d8c3] transition-all flex flex-col justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#64748b]">
              Average Speed
            </span>
            <div className="my-2.5 flex items-baseline gap-1">
              <span className="text-4xl sm:text-[40px] font-light text-[#1e293b] font-['Sora',sans-serif] tracking-tight leading-none">
                {stats.avgWpm}
              </span>
              <span className="text-xs font-normal text-[#94a3b8]">WPM</span>
            </div>
            <span className="text-[10.5px] text-[#64748b] font-normal">Overall Average</span>
          </div>

          {/* Card 3: Accuracy */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white/95 border border-[#dbe6d9] shadow-[0_4px_20px_rgba(27,43,32,0.03)] hover:border-[#c5d8c3] transition-all flex flex-col justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#64748b]">
              Accuracy
            </span>
            <div className="my-2.5 flex items-baseline gap-1">
              <span className="text-4xl sm:text-[40px] font-light text-[#0f172a] font-['Sora',sans-serif] tracking-tight leading-none">
                {stats.totalTests > 0 ? stats.avgAccuracy : 0}
              </span>
              <span className="text-xs font-normal text-[#94a3b8]">%</span>
            </div>
            <span className="text-[10.5px] text-[#059669] font-medium">Correct Keystrokes</span>
          </div>

          {/* Card 4: Consistency */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white/95 border border-[#dbe6d9] shadow-[0_4px_20px_rgba(27,43,32,0.03)] hover:border-[#c5d8c3] transition-all flex flex-col justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#64748b]">
              Consistency
            </span>
            <div className="my-2.5 flex items-baseline gap-1">
              <span className="text-4xl sm:text-[40px] font-light text-[#0f172a] font-['Sora',sans-serif] tracking-tight leading-none">
                {stats.totalTests > 0 ? stats.avgConsistency : 0}
              </span>
              <span className="text-xs font-normal text-[#94a3b8]">%</span>
            </div>
            <span className="text-[10.5px] text-[#0284c7] font-medium">Typing Rhythm</span>
          </div>

          {/* Card 5: Total Volume */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white/95 border border-[#dbe6d9] shadow-[0_4px_20px_rgba(27,43,32,0.03)] hover:border-[#c5d8c3] transition-all flex flex-col justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#64748b]">
              Total Characters
            </span>
            <div className="my-2.5 flex items-baseline gap-1">
              <span className="text-4xl sm:text-[40px] font-light text-[#1e293b] font-['Sora',sans-serif] tracking-tight leading-none">
                {stats.totalChars}
              </span>
              <span className="text-xs font-normal text-[#94a3b8]">chars</span>
            </div>
            <span className="text-[10.5px] text-[#64748b] font-normal">Characters Typed</span>
          </div>

          {/* Card 6: Total Sessions */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white/95 border border-[#dbe6d9] shadow-[0_4px_20px_rgba(27,43,32,0.03)] hover:border-[#c5d8c3] transition-all flex flex-col justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#64748b]">
              Completed
            </span>
            <div className="my-2.5 flex items-baseline gap-1">
              <span className="text-4xl sm:text-[40px] font-light text-[#1e3a24] font-['Sora',sans-serif] tracking-tight leading-none">
                {stats.totalTests}
              </span>
              <span className="text-xs font-normal text-[#94a3b8]">runs</span>
            </div>
            <span className="text-[10.5px] text-[#059669] font-medium">Total Tests</span>
          </div>

        </div>

        {/* ── Mid Section: Velocity Progression Graph & Keystroke Biometrics ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Velocity Progression Chart (8 cols) */}
          <div className="lg:col-span-8 p-6 sm:p-7 rounded-3xl bg-white/95 border border-[#dbe6d9] shadow-[0_8px_30px_-6px_rgba(30,58,36,0.05)] backdrop-blur-md flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#edf3ec] mb-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0f172a] font-['Sora',sans-serif]">
                  Speed & Accuracy History
                </h3>
                <span className="text-[11px] text-[#94a3b8]">
                  Your recent test scores over time (Net WPM vs Raw WPM)
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-[#1e3a24] font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1e3a24]" />
                  <span>Net WPM</span>
                </span>
                <span className="flex items-center gap-1.5 text-[#64748b]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#a7f3d0]" />
                  <span>Raw WPM</span>
                </span>
              </div>
            </div>

            {stats.chartData.length === 0 ? (
              <div className="py-20 text-center text-[#94a3b8] text-xs">
                No typing tests recorded yet. Click &quot;Start Speed Test&quot; above to record your first run.
              </div>
            ) : (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="index" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                    <Tooltip
                      cursor={{ fill: 'rgba(30, 58, 36, 0.04)' }}
                      contentStyle={{
                        borderRadius: '16px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #dbe6d9',
                        boxShadow: '0 10px 25px -5px rgba(30,58,36,0.08)',
                        fontSize: '12px',
                        color: '#0f172a'
                      }}
                    />
                    <Bar dataKey="wpm" name="Net WPM" fill="#1e3a24" radius={[6, 6, 0, 0]} barSize={22} />
                    <Bar dataKey="rawWpm" name="Raw WPM" fill="#a7f3d0" radius={[6, 6, 0, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Characteristics & Biometrics Spectrum (4 cols) */}
          <div className="lg:col-span-4 p-6 sm:p-7 rounded-3xl bg-white/95 border border-[#dbe6d9] shadow-[0_8px_30px_-6px_rgba(30,58,36,0.05)] backdrop-blur-md flex flex-col justify-between">
            <div className="space-y-4">
              <div className="pb-3 border-b border-[#edf3ec]">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0f172a] font-['Sora',sans-serif]">
                  Typing Speed Breakdown
                </h3>
                <span className="text-[11px] text-[#94a3b8]">
                  Key press speed distribution
                </span>
              </div>

              {/* Dwell Distribution */}
              <div>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-[#475569] font-medium">Key Press Speed</span>
                  <strong className="text-[#0f172a] font-['Sora',sans-serif]">
                    {stats.avgWpm > 0 ? Math.round(60000 / (stats.avgWpm * 5)) : 120}ms AVG
                  </strong>
                </div>

                <div className="w-full h-3 rounded-full bg-[#f1f5f9] p-0.5 flex gap-1 overflow-hidden">
                  <div className="h-full rounded-full bg-[#10b981]" style={{ width: '65%' }} title="Fast (<100ms): 65%" />
                  <div className="h-full rounded-full bg-[#f59e0b]" style={{ width: '25%' }} title="Normal (100-150ms): 25%" />
                  <div className="h-full rounded-full bg-[#f87171]" style={{ width: '10%' }} title="Slow (>150ms): 10%" />
                </div>

                <div className="flex justify-between items-center text-[10.5px] mt-2 text-[#64748b]">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                    <span>Fast (&lt;100ms)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                    <span>Normal (100-150ms)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f87171]" />
                    <span>Slow (&gt;150ms)</span>
                  </span>
                </div>
              </div>

              {/* Test Modes Distribution */}
              <div className="pt-3 border-t border-[#edf3ec]">
                <span className="text-xs font-medium text-[#475569] mb-2 block">
                  Test Modes Breakdown
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-2xl bg-[#f6f8f5] border border-[#e1ece0]">
                    <div className="text-[#64748b] text-[10px] uppercase font-semibold">Timed</div>
                    <div className="text-sm font-bold text-[#0f172a] font-['Sora',sans-serif] mt-0.5">{stats.modeCounts.time}</div>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#f6f8f5] border border-[#e1ece0]">
                    <div className="text-[#64748b] text-[10px] uppercase font-semibold">Words</div>
                    <div className="text-sm font-bold text-[#0f172a] font-['Sora',sans-serif] mt-0.5">{stats.modeCounts.words}</div>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#f6f8f5] border border-[#e1ece0]">
                    <div className="text-[#64748b] text-[10px] uppercase font-semibold">Custom</div>
                    <div className="text-sm font-bold text-[#0f172a] font-['Sora',sans-serif] mt-0.5">{stats.modeCounts.custom}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#edf3ec] text-[10.5px] text-[#64748b] flex justify-between">
              <span>Keystroke Sound: Active</span>
              <span className="text-[#059669] font-semibold">Low Jitter Cadence</span>
            </div>
          </div>

        </div>

        {/* ── Recent Practices History Table ── */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white/95 border border-[#dbe6d9] shadow-[0_8px_30px_-6px_rgba(30,58,36,0.05)] backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-[#edf3ec] mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0f172a] font-['Sora',sans-serif]">
              Recent Diagnostic Sessions
            </h3>
            <span className="text-xs text-[#94a3b8]">
              Showing last {Math.min(history.length, 10)} recorded tests
            </span>
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center text-[#94a3b8] text-xs">
              No sessions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#edf3ec] text-[#64748b] uppercase text-[10px] font-semibold tracking-wider">
                    <th className="pb-3">Test ID</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Mode</th>
                    <th className="pb-3">Net WPM</th>
                    <th className="pb-3">Raw WPM</th>
                    <th className="pb-3">Accuracy</th>
                    <th className="pb-3">Stability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {history.slice(0, 10).map((item) => (
                    <tr key={item.id} className="hover:bg-[#f6f8f5]/80 transition-colors">
                      <td className="py-3 font-semibold text-[#1e293b]">#{item.id}</td>
                      <td className="py-3 text-[#64748b]">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#edf4ed] text-[#2c4731] text-[10.5px] uppercase font-bold border border-[#d0e3cf]">
                          {item.mode} {item.duration ? `(${item.duration}s)` : item.wordCount ? `(${item.wordCount}w)` : ''}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-[#0f172a] font-['Sora',sans-serif]">{item.wpm}</td>
                      <td className="py-3 text-[#64748b]">{item.rawWpm}</td>
                      <td className="py-3">
                        <span className={item.accuracy >= 95 ? 'text-[#059669] font-bold' : 'text-[#1e293b] font-medium'}>
                          {item.accuracy}%
                        </span>
                      </td>
                      <td className="py-3 text-[#475569]">{item.consistency}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <footer className="w-full text-center text-xs text-[#6c8574] py-1">
          duoprep • SwiftType Telemetry
        </footer>

        {/* ── Custom Text Modal ── */}
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-xl rounded-3xl p-6 sm:p-7 bg-white/95 border border-[#dbe6d9] shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#e1e9df]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#edf4ed] text-[#1e3a24] flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0f172a] font-['Sora',sans-serif]">
                      Practice Custom Text
                    </h3>
                    <p className="text-xs text-[#556b5a]">
                      Paste or write custom paragraphs, code snippets, or study texts
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-black/5 text-[#556b5a] flex items-center justify-center text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Sample Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#556b5a] mr-1">Presets:</span>
                {[
                  { label: 'Pangram', text: 'The quick brown fox jumps over the lazy dog while five boxing wizards jump quickly.' },
                  { label: 'Philosophy', text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.' },
                  { label: 'Programming', text: 'function calculateTypingSpeed(words, timeInSeconds) { return Math.round((words.length / timeInSeconds) * 60); }' }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCustomText(preset.text)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#f0f4ee] hover:bg-[#e1ede1] text-[#2c4731] transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Paste or type your custom text here..."
                  rows={5}
                  className="w-full p-4 rounded-2xl bg-[#f8faf7] border border-[#d8e3d6] focus:border-[#1e3a24] focus:bg-white text-sm text-[#1b2b20] transition-all outline-none resize-none font-sans leading-relaxed"
                  autoFocus
                />
                <div className="flex items-center justify-between mt-1 px-1 text-[11px] text-[#718b76]">
                  <span>
                    Words: <strong>{customText.trim() ? customText.trim().split(/\s+/).length : 0}</strong> | Characters: <strong>{customText.length}</strong>
                  </span>
                  {customText.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCustomText('')}
                      className="text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#556b5a] hover:bg-black/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!customText.trim()}
                  onClick={() => {
                    setShowCustomModal(false);
                    onStartCustomText(customText);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#1e3a24] hover:bg-[#162d1c] disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-1.5"
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

function SwiftTypeContent() {
  const router = useRouter();
  const { settings } = useSettings();
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; firstName?: string; lastName?: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('writeabout_user') || localStorage.getItem('swifttype_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const [currentView, setCurrentView] = useState<'dashboard' | 'test'>('dashboard');
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

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const handleComplete = async (submission: TypingTestSubmission) => {
    setLastResult(submission);
    if (!currentUser?.id) {
      alert('Your session has expired. Please log in again.');
      router.push('/login');
      return;
    }
    try {
      await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...submission, userId: currentUser.id, wordSetId })
      });
    } catch (err) {
      console.error('Failed to save result:', err);
    }
  };

  const handleNextTest = () => {
    setLastResult(null);
    // In custom mode, keep the same custom words — don't fetch random words
    if (mode !== 'custom') {
      fetchWords();
    }
  };
  const handleRepeatTest = () => {
    setLastResult(null);
    // Never fetch new words on repeat — always replay same set
  };

  const [showMobileNotice, setShowMobileNotice] = useState(false);

  const executeStartTest = () => {
    setLastResult(null);
    if (mode === 'custom') {
      loadCustomWords();
    } else {
      fetchWords();
    }
    setCurrentView('test');
  };

  const handleStartTest = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowMobileNotice(true);
    } else {
      executeStartTest();
    }
  };

  const handleStartCustomText = (text: string) => {
    const customWords = text.trim().split(/\s+/).filter(w => w.length > 0);
    if (customWords.length === 0) return;
    try { localStorage.setItem('swifttype_custom_text', text); } catch {}
    setWords(customWords);
    setMode('custom');
    setWordCountLimit(customWords.length);
    setIsLoadingWords(false);
    setLastResult(null);
    setCurrentView('test');
  };

  const handleSetCustomWords = (customWords: string[]) => {
    try { localStorage.setItem('swifttype_custom_text', customWords.join(' ')); } catch {}
    setWords(customWords);
    setMode('custom');
    setWordCountLimit(customWords.length);
    setIsLoadingWords(false);
  };

  if (currentView === 'dashboard') {
    return (
      <>
        <SwiftTypeDashboard
          onStartTest={handleStartTest}
          onStartCustomText={handleStartCustomText}
          userId={currentUser?.id || 0}
          userLastName={currentUser?.lastName || currentUser?.username}
        />

        {showMobileNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl p-6 bg-white/95 border border-[#dbe6d9] shadow-2xl space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#edf4ed] text-[#1e3a24] flex items-center justify-center mx-auto shadow-xs">
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
                  SwiftType is a high-speed typing sprint designed for physical keyboards. It works best on a desktop or laptop screen.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/hub"
                  className="w-full py-2.5 px-4 rounded-2xl bg-[#1e3a24] hover:bg-[#162d1c] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer text-center"
                >
                  ← Back to Hub
                </Link>
                <button
                  onClick={() => {
                    setShowMobileNotice(false);
                    executeStartTest();
                  }}
                  className="w-full py-2 px-4 rounded-2xl text-[11px] text-[#556b5a] hover:text-[#1e3a24] font-medium transition-colors text-center cursor-pointer"
                >
                  Continue on Mobile Anyway →
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className="w-full h-screen max-h-screen overflow-hidden flex flex-col items-center justify-center select-none m-0 p-0"
      style={{
        backgroundImage: "linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.65) 100%), url('/mountains.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        color: '#ffffff',
        fontFamily: "'Onest', -apple-system, BlinkMacSystemFont, 'Inter', Roboto, sans-serif"
      }}
    >
      {lastResult ? (
        <ResultsDisplay
          result={lastResult}
          onNextTest={handleNextTest}
          onRepeatTest={handleRepeatTest}
          onBackToDashboard={() => setCurrentView('dashboard')}
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
          onBackToDashboard={() => setCurrentView('dashboard')}
          isLoadingWords={isLoadingWords}
          onSetCustomWords={handleSetCustomWords}
        />
      )}
    </div>
  );
}

export default function SwiftTypePage() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <SwiftTypeContent />
      </SettingsProvider>
    </AuthProvider>
  );
}
