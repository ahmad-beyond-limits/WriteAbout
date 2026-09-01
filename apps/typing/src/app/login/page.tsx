'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Authentication failed');
      } else {
        login(data.user);
        router.push('/');
      }
    } catch {
      setError('Network connection error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto my-auto flex flex-col gap-6 select-none">
      <div className="text-center">
        <h1 className="text-2xl font-light tracking-tight text-[var(--text-primary)]">Authenticate</h1>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Access your personal telemetry profile and records.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 rounded-[28px] bg-[var(--surface-primary)] border border-[var(--surface-border)] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.03)] backdrop-blur-md flex flex-col gap-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-wider font-semibold text-[var(--text-secondary)]">Operator Handle</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2.5 rounded-full bg-[var(--surface-secondary)] text-[var(--text-primary)] text-xs outline-none border border-[var(--surface-border)] focus:border-[var(--text-primary)]"
            placeholder="e.g. swiftmaster"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-wider font-semibold text-[var(--text-secondary)]">Passphrase</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-full bg-[var(--surface-secondary)] text-[var(--text-primary)] text-xs outline-none border border-[var(--surface-border)] focus:border-[var(--text-primary)]"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-full bg-[var(--accent-primary)] text-[var(--bg-canvas)] font-semibold text-xs tracking-wider uppercase shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:opacity-90 transition-all cursor-pointer mt-2 disabled:opacity-50"
        >
          {isLoading ? 'Verifying...' : 'Sign In'}
        </button>
      </form>

      <p className="text-xs text-center text-[var(--text-secondary)]">
        Need an operator profile?{' '}
        <Link href="/register" className="text-[var(--text-primary)] font-semibold hover:underline">
          Create Account
        </Link>
      </p>
    </div>
  );
}
