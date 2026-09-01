'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { MetricDisplay } from '@writeabout/ui';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface UserStats {
  totalTests: number;
  totalCharacters: number;
  totalCorrectCharacters: number;
  totalIncorrectCharacters: number;
  averageWpm: number;
  bestWpm: number;
  averageAccuracy: number;
  bestAccuracy: number;
  totalTypingTime: number;
}

interface ChartPoint {
  id: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  createdAt: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/stats?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setChartData(data.chartData || []);
      }
    } catch (err) {
      console.error('Failed to load profile statistics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (!user) {
    return (
      <div className="w-full max-w-xl mx-auto my-16 p-10 rounded-[28px] bg-[var(--surface-primary)] border border-[var(--surface-border)] shadow-sm text-center flex flex-col items-center gap-4 backdrop-blur-md">
        <span className="w-10 h-10 rounded-full bg-[var(--surface-secondary)] border border-[var(--surface-border)] flex items-center justify-center text-lg">
          📊
        </span>
        <h2 className="text-xl font-light text-[var(--text-primary)]">Authenticate to View Analytics</h2>
        <p className="text-xs text-[var(--text-secondary)] max-w-sm leading-relaxed">
          Access high-precision velocity curves, accuracy progression, and verified personal records.
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m ${seconds % 60}s`;
  };

  return (
    <div className="w-full max-w-4xl flex flex-col gap-8 my-6 select-none">
      
      {/* Identity Acrylic Card */}
      <div className="p-8 rounded-[28px] bg-[var(--surface-primary)] border border-[var(--surface-border)] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.03)] backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-secondary)] border border-[var(--surface-border)] text-[var(--text-primary)] flex items-center justify-center text-2xl font-light shadow-sm">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-light tracking-tight text-[var(--text-primary)]">
                {user.displayName || user.username}
              </h1>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            </div>
            <span className="text-xs text-[var(--text-secondary)]">@{user.username}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">Total Practice</span>
          <div className="text-xl font-light text-[var(--text-primary)] mt-0.5">
            {formatTime(stats?.totalTypingTime || 0)}
          </div>
        </div>
      </div>

      {/* Metric Objects Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-8 rounded-[28px] bg-[var(--surface-primary)] border border-[var(--surface-border)] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.03)] backdrop-blur-md">
        <MetricDisplay
          value={stats?.bestWpm || 0}
          unit="wpm"
          label="Peak Velocity"
          status="optimal"
          size="lg"
        />

        <MetricDisplay
          value={stats?.averageWpm || 0}
          unit="wpm"
          label="Mean Velocity"
          size="lg"
        />

        <MetricDisplay
          value={`${stats?.bestAccuracy || 0}%`}
          label="Peak Precision"
          status="optimal"
          size="lg"
        />

        <MetricDisplay
          value={stats?.totalTests || 0}
          unit="sessions"
          label="Recorded Runs"
          size="lg"
        />
      </div>

      {/* Velocity Progression Fine-Line Chart */}
      <div className="p-8 rounded-[28px] bg-[var(--surface-primary)] border border-[var(--surface-border)] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.03)] backdrop-blur-md flex flex-col gap-6">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--surface-border)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
            <h2 className="text-xs uppercase tracking-widest font-semibold text-[var(--text-secondary)]">
              Velocity Trajectory (Last 20 Tests)
            </h2>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--text-primary)" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="var(--text-primary)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
                <XAxis
                  dataKey="id"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                  stroke="var(--surface-border)"
                />
                <YAxis
                  tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                  stroke="var(--surface-border)"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-primary)',
                    borderColor: 'var(--surface-border)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    color: 'var(--text-primary)',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="wpm"
                  stroke="var(--text-primary)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#wpmGradient)"
                  name="WPM"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-[var(--text-secondary)] uppercase tracking-wider">
            Execute typing sessions to establish velocity trajectories.
          </div>
        )}
      </div>

    </div>
  );
}
