'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

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

  useEffect(() => {
    const savedUser = localStorage.getItem('writeabout_user');
    if (savedUser) {
      try {
        JSON.parse(savedUser);
        router.push('/hub');
      } catch (e) {
        localStorage.removeItem('writeabout_user');
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check credentials.');
      }

      localStorage.setItem('writeabout_user', JSON.stringify(data.user));
      localStorage.setItem('swifttype_user', JSON.stringify(data.user));
      if (data.apiKey) {
        localStorage.setItem('writeabout_apikey', data.apiKey);
      } else {
        localStorage.removeItem('writeabout_apikey');
      }
      router.push('/hub');
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f6f8f5] text-[#1b2b20] flex items-center justify-center p-4 selection:bg-[#d8e6db] selection:text-[#1b2b20] relative overflow-hidden"
      style={{ fontFamily: "'Switzer', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      
      {/* ── Soft Ambient Aura ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-45 blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(216, 235, 218, 0.6) 0%, rgba(240, 246, 238, 0.4) 50%, transparent 100%)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-40 blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(218, 234, 245, 0.6) 0%, rgba(246, 248, 245, 0.5) 60%, transparent 100%)' }}
        />
      </div>

      {/* ── Clean Ergonomic Card ── */}
      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white/90 border border-[#dbe6d9] shadow-[0_10px_30px_-5px_rgba(40,68,44,0.06)] backdrop-blur-xl">
        
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-8 h-8 rounded-xl bg-[#28442c] flex items-center justify-center text-[#e8f2e9] font-bold text-sm shadow-xs transition-transform group-hover:scale-105">
              <svg className="w-4 h-4 text-[#a3d9ad]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-[#1b2b20]">
              duoprep
            </span>
          </Link>
          <h1 className="text-xl font-semibold text-[#1b2b20] tracking-tight">Sign In</h1>
          <p className="text-xs text-[#556b5a] mt-1">Enter your credentials to continue</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#4a6350] uppercase tracking-wider mb-1.5 font-semibold">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-4 py-2.5 rounded-xl bg-[#f7faf6] border border-[#d6e3d4] text-[#1b2b20] placeholder-[#8a9f90] text-sm focus:outline-none focus:border-[#28442c] focus:bg-white transition-all font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-mono text-[#4a6350] uppercase tracking-wider font-semibold">
                Password
              </label>
              {capsLock && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-600 animate-pulse">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l7 7h-4v7H9v-7H5l7-7z" />
                    <path d="M5 21h14" />
                  </svg>
                  <span>Caps Lock ON</span>
                </span>
              )}
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (typeof e.getModifierState === 'function') {
                  setCapsLock(e.getModifierState('CapsLock'));
                }
              }}
              onKeyUp={(e) => {
                if (typeof e.getModifierState === 'function') {
                  setCapsLock(e.getModifierState('CapsLock'));
                }
              }}
              placeholder="Enter password"
              className="w-full px-4 py-2.5 rounded-xl bg-[#f7faf6] border border-[#d6e3d4] text-[#1b2b20] placeholder-[#8a9f90] text-sm focus:outline-none focus:border-[#28442c] focus:bg-white transition-all font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-[#28442c] hover:bg-[#1f3723] text-[#f2f7f2] font-mono font-semibold text-xs uppercase tracking-wider transition-all shadow-[0_4px_14px_rgba(40,68,44,0.18)] cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#eaf0e8] text-center text-xs text-[#556b5a] font-mono">
          New here?{' '}
          <Link href="/signup" className="text-[#28442c] hover:underline font-bold ml-1 transition-colors">
            Register
          </Link>
        </div>

      </div>
    </div>
  );
}
