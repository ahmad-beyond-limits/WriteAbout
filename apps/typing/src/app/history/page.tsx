'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
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
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [modeFilter, setModeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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
      <div className="w-full max-w-xl mx-auto my-16 p-10 rounded-[28px] bg-[var(--surface-primary)] border border-[var(--surface-border)] shadow-sm text-center flex flex-col items-center gap-4 backdrop-blur-md">
        <span className="w-10 h-10 rounded-full bg-[var(--surface-secondary)] border border-[var(--surface-border)] flex items-center justify-center text-lg">
          📜
        </span>
        <h2 className="text-xl font-light text-[var(--text-primary)]">Authenticate to View History</h2>
        <p className="text-xs text-[var(--text-secondary)] max-w-sm leading-relaxed">
          Maintain precision telemetry and review historical typing trends across test sessions.
        </p>
        <Link
          href="/login"
          className="mt-2 px-6 py-2.5 rounded-full bg-[var(--accent-primary)] text-[var(--bg-canvas)] text-xs uppercase tracking-wider font-semibold shadow-sm hover:opacity-90 transition-opacity"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl flex flex-col gap-6 my-6 select-none">
      {/* Editorial Header & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-[var(--text-primary)]">Telemetry Log</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Total recorded sessions: {total}</p>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex p-1 bg-[var(--surface-primary)] border border-[var(--surface-border)] rounded-full shadow-sm">
          {['all', 'time', 'words', 'custom'].map((m) => (
            <button
              key={m}
              onClick={() => {
                setModeFilter(m);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                modeFilter === m
                  ? 'text-[var(--text-primary)] bg-[var(--surface-secondary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Physical Table Container */}
      <div className="w-full overflow-hidden rounded-[24px] bg-[var(--surface-primary)] border border-[var(--surface-border)] shadow-[0_16px_36px_-10px_rgba(0,0,0,0.03)] backdrop-blur-md">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[var(--surface-border)] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-4 px-6">Velocity</th>
              <th className="py-4 px-6">Precision</th>
              <th className="py-4 px-6">Raw</th>
              <th className="py-4 px-6">Mode</th>
              <th className="py-4 px-6">Lexicon</th>
              <th className="py-4 px-6">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--surface-border)]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[var(--text-secondary)]">
                  Retrieving session data...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[var(--text-secondary)]">
                  No sessions found for this filter. Complete a test to record your data.
                </td>
              </tr>
            ) : (
              history.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--surface-secondary)] transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-sm text-[var(--text-primary)]">
                    {item.wpm} <span className="text-[10px] text-[var(--text-secondary)] font-normal">wpm</span>
                  </td>
                  <td className="py-3.5 px-6 font-medium text-[var(--text-primary)]">
                    {item.accuracy}%
                  </td>
                  <td className="py-3.5 px-6 text-[var(--text-secondary)]">
                    {item.rawWpm}
                  </td>
                  <td className="py-3.5 px-6 text-[var(--text-primary)] capitalize">
                    {item.mode} {item.duration ? `${item.duration}s` : `${item.wordCount}w`}
                  </td>
                  <td className="py-3.5 px-6 text-[var(--text-secondary)]">
                    {item.wordSetName || 'Standard'}
                  </td>
                  <td className="py-3.5 px-6 text-[var(--text-secondary)]">
                    {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] px-2">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-1.5 rounded-full bg-[var(--surface-primary)] border border-[var(--surface-border)] text-[var(--text-primary)] disabled:opacity-30 cursor-pointer shadow-sm"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-1.5 rounded-full bg-[var(--surface-primary)] border border-[var(--surface-border)] text-[var(--text-primary)] disabled:opacity-30 cursor-pointer shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
