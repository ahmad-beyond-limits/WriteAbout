'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface LeaderboardItem {
  rank: number;
  id: number;
  wpm: number;
  accuracy: number;
  duration: number;
  mode: string;
  createdAt: string;
  username: string;
  displayName: string | null;
  wordSetName: string | null;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [durationFilter, setDurationFilter] = useState<number | null>(60);
  const [timeframeFilter, setTimeframeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const durParam = durationFilter ? `&duration=${durationFilter}` : '';
      const res = await fetch(`/api/leaderboard?timeframe=${timeframeFilter}${durParam}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [durationFilter, timeframeFilter]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="w-full max-w-4xl flex flex-col gap-6 my-6 select-none">
      
      {/* Editorial Header & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-[var(--text-primary)]">Global Benchmarks</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Verified community velocity rankings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Duration Filters */}
          <div className="inline-flex p-1 bg-[var(--surface-primary)] border border-[var(--surface-border)] rounded-full shadow-sm">
            {[15, 30, 60, 120].map((d) => (
              <button
                key={d}
                onClick={() => setDurationFilter(d)}
                className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                  durationFilter === d
                    ? 'text-[var(--text-primary)] bg-[var(--surface-secondary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {d}s
              </button>
            ))}
          </div>

          {/* Timeframe Filters */}
          <div className="inline-flex p-1 bg-[var(--surface-primary)] border border-[var(--surface-border)] rounded-full shadow-sm">
            {[
              { id: 'today', name: 'Today' },
              { id: 'week', name: 'Week' },
              { id: 'all', name: 'All' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeframeFilter(t.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                  timeframeFilter === t.id
                    ? 'text-[var(--text-primary)] bg-[var(--surface-secondary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Physical Table Glass Surface */}
      <div className="w-full overflow-hidden rounded-[24px] bg-[var(--surface-primary)] border border-[var(--surface-border)] shadow-[0_16px_36px_-10px_rgba(0,0,0,0.03)] backdrop-blur-md">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[var(--surface-border)] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-4 px-6 w-16 text-center">Rank</th>
              <th className="py-4 px-6">Operator</th>
              <th className="py-4 px-6">Velocity</th>
              <th className="py-4 px-6">Precision</th>
              <th className="py-4 px-6">Interval</th>
              <th className="py-4 px-6">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--surface-border)]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[var(--text-secondary)]">
                  Synchronizing global records...
                </td>
              </tr>
            ) : leaderboard.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[var(--text-secondary)]">
                  No records found for this timeframe. Complete a test session to establish a benchmark!
                </td>
              </tr>
            ) : (
              leaderboard.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--surface-secondary)] transition-colors">
                  <td className="py-3.5 px-6 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      item.rank === 1
                        ? 'bg-amber-400/20 text-amber-600 border border-amber-400/30'
                        : item.rank === 2
                        ? 'bg-slate-300/30 text-slate-700 border border-slate-300/40'
                        : item.rank === 3
                        ? 'bg-amber-700/20 text-amber-800 border border-amber-700/30'
                        : 'text-[var(--text-secondary)]'
                    }`}>
                      {item.rank}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-[var(--text-primary)]">
                    {item.displayName || item.username}
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-sm text-[var(--text-primary)]">
                    {item.wpm} <span className="text-[10px] text-[var(--text-secondary)] font-normal">wpm</span>
                  </td>
                  <td className="py-3.5 px-6 text-[var(--text-primary)] font-medium">
                    {item.accuracy}%
                  </td>
                  <td className="py-3.5 px-6 text-[var(--text-secondary)]">
                    {item.duration}s
                  </td>
                  <td className="py-3.5 px-6 text-[var(--text-secondary)]">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
