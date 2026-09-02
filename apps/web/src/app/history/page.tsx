'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface HistoryItem {
  id: number;
  mode: string;
  duration: number;
  wordCount: number;
  punctuation: boolean;
  numbers: boolean;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correctCharacters: number;
  incorrectCharacters: number;
  createdAt: string;
  wordSetName: string | null;
}

export default function HistoryPage() {
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [modeFilter, setModeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('writeabout_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
      } catch (e) {
        localStorage.removeItem('writeabout_user');
        window.location.href = '/login';
      }
    } else {
      window.location.href = '/login';
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/history?userId=${user.id}&mode=${modeFilter}&page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, modeFilter, page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f6f8f5] flex items-center justify-center text-[#556b5a] font-mono text-xs">
        Loading history...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#f6f8f5] text-[#1b2b20] flex flex-col justify-between p-6 select-none relative"
      style={{ fontFamily: "'Switzer', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      <div className="w-full max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 rounded-2xl bg-white/85 border border-[#e1e9df] shadow-[0_4px_24px_rgba(27,43,32,0.03)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Link
              href="/hub"
              className="px-3.5 py-1.5 rounded-full bg-[#edf4ed] hover:bg-[#e1ede1] text-[#2c4731] text-xs font-mono font-semibold uppercase tracking-wider transition-colors"
            >
              ← Workspace Hub
            </Link>
            <span className="w-px h-3.5 bg-[#dbe5da]" />
            <h1 className="text-base font-bold text-[#1b2b20] font-mono tracking-tight">Session History</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono text-[#5f7a65]">
              {total} Sessions Logged
            </div>
            <Link
              href="/settings"
              title="Settings"
              className="w-8 h-8 rounded-xl bg-white border border-[#d8e3d6] hover:bg-[#f0f4ee] text-[#556b5a] hover:text-[#1b2b20] flex items-center justify-center transition-all cursor-pointer shadow-xs group"
            >
              <svg className="w-4 h-4 transition-transform group-hover:rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2">
          {['all', 'time', 'words', 'custom'].map((m) => (
            <button
              key={m}
              onClick={() => { setModeFilter(m); setPage(1); }}
              className={`px-3.5 py-1 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                modeFilter === m
                  ? 'bg-[#28442c] text-[#f2f7f2] font-bold shadow-xs'
                  : 'bg-white border border-[#dce6da] text-[#4d6353] hover:bg-[#f2f7f1]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-3xl bg-white/90 border border-[#dbe6d9] shadow-[0_10px_30px_-5px_rgba(40,68,44,0.06)] overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs font-mono text-[#7a9582]">Loading session telemetry...</div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-[#7a9582]">No test records found for this filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#eaf0e8] bg-[#f8faf7] text-[#6c8574] uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-5">Timestamp</th>
                    <th className="py-3 px-5">Mode</th>
                    <th className="py-3 px-5">Net WPM</th>
                    <th className="py-3 px-5">Raw WPM</th>
                    <th className="py-3 px-5">Accuracy</th>
                    <th className="py-3 px-5">Consistency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf3eb]">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f4f8f3] transition-colors">
                      <td className="py-3 px-5 text-[#6c8574]">
                        {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-5 uppercase font-semibold text-[#2c4731]">{item.mode}</td>
                      <td className="py-3 px-5 text-sm font-bold text-[#1b2b20]">{item.wpm}</td>
                      <td className="py-3 px-5 text-[#5f7a65]">{item.rawWpm}</td>
                      <td className="py-3 px-5 font-semibold text-[#2d6e38]">{item.accuracy}%</td>
                      <td className="py-3 px-5 text-[#4d6353]">{item.consistency}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
