'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('writeabout_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  return (
    <div
      className="min-h-screen bg-[#f6f8f5] text-[#1b2b20] selection:bg-[#d8e6db] selection:text-[#1b2b20] flex flex-col justify-between overflow-x-hidden relative"
      style={{ fontFamily: "'Switzer', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      
      {/* ── Soft Ambient Glow ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-40 blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(216, 235, 218, 0.6) 0%, rgba(240, 246, 238, 0.4) 50%, transparent 100%)' }}
        />
        <div
          className="absolute top-1/4 -right-40 w-[550px] h-[550px] rounded-full opacity-35 blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(218, 234, 245, 0.6) 0%, rgba(246, 248, 245, 0.5) 60%, transparent 100%)' }}
        />
      </div>

      {/* ── Top Navigation Bar ── */}
      <header className="relative z-20 w-full max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between px-6 py-3.5 rounded-2xl bg-white/85 border border-[#e1e9df] shadow-[0_4px_24px_rgba(27,43,32,0.03)] backdrop-blur-xl">
          
          <Link href="/" className="flex items-center gap-2.5 group">
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

          <nav className="flex items-center gap-6 text-sm font-medium text-[#4d6353]">
            <Link
              href="/write-about"
              className="hidden sm:inline-block hover:text-[#1b2b20] transition-colors"
            >
              WriteAbout
            </Link>
            <Link
              href="/swifttype"
              className="hidden sm:inline-block hover:text-[#1b2b20] transition-colors"
            >
              SwiftType
            </Link>
            <span className="hidden sm:block w-px h-3.5 bg-[#dbe5da]" />
            {user ? (
              <Link
                href="/hub"
                className="px-4 py-2 rounded-full bg-[#28442c] hover:bg-[#1f3723] text-[#f2f7f2] font-mono font-semibold text-xs uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(40,68,44,0.18)] flex items-center gap-1.5"
              >
                <span>Workspace Hub</span>
                <span className="text-sm">→</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-mono font-semibold uppercase tracking-wider text-[#4d6353] hover:text-[#1b2b20] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-full bg-[#28442c] hover:bg-[#1f3723] text-[#f2f7f2] font-mono font-semibold text-xs uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(40,68,44,0.18)]"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>

        </div>
      </header>

      {/* ── Direct, Premium Hero ── */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12 sm:py-20 flex flex-col items-center text-center flex-1 justify-center">
        
        {/* Simple Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 border border-[#dce6da] text-[11px] font-mono text-[#38593e] mb-6 shadow-xs backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4a8a53]" />
          <span className="font-semibold uppercase tracking-wider">Practice & Speed</span>
        </div>

        {/* Crisp Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-[#16231a] max-w-3xl leading-[1.1] mb-5">
          Write better. <br />
          <span className="font-semibold text-[#28442c]">
            Type faster.
          </span>
        </h1>

        <p className="text-base text-[#4d6353] max-w-lg font-normal leading-relaxed mb-12">
          Two dedicated tools for visual writing challenges and clean typing speed tests.
        </p>

        {/* ── Direct Product Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
          
          {/* Card 1: WriteAbout */}
          <Link
            href="/write-about"
            className="group relative p-8 rounded-3xl bg-white/90 border border-[#dbe6d9] shadow-[0_10px_30px_-5px_rgba(40,68,44,0.06)] hover:shadow-[0_15px_35px_-5px_rgba(40,68,44,0.12)] hover:border-[#c5d8c3] transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="px-3 py-1 rounded-full bg-[#e8f2e9] text-[#2c4731] text-[11px] font-mono font-bold uppercase tracking-wider border border-[#d0e3cf]">
                  60s Sprints
                </span>
                <span className="text-[#5f7a65] group-hover:text-[#2c4731] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </span>
              </div>

              <h2 className="text-2xl font-bold text-[#1b2b20] mb-2 tracking-tight">
                WriteAbout
              </h2>
              <p className="text-sm text-[#4d6353] font-normal leading-relaxed mb-8">
                Describe random image prompts under a 60-second timer. Get immediate scores on word count and quality.
              </p>
            </div>

            <div className="pt-4 border-t border-[#eaf0e8] flex items-center justify-between text-xs font-mono">
              <span className="text-[#5f7a65]">Writing Practice</span>
              <strong className="text-[#2c4731] group-hover:underline transition-colors flex items-center gap-1">
                <span>Start Writing</span>
                <span>→</span>
              </strong>
            </div>
          </Link>

          {/* Card 2: SwiftType */}
          <Link
            href="/swifttype"
            className="group relative p-8 rounded-3xl bg-white/90 border border-[#d8e3eb] shadow-[0_10px_30px_-5px_rgba(44,79,100,0.06)] hover:shadow-[0_15px_35px_-5px_rgba(44,79,100,0.12)] hover:border-[#c2d5e2] transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="px-3 py-1 rounded-full bg-[#e8f1f7] text-[#24485f] text-[11px] font-mono font-bold uppercase tracking-wider border border-[#cfdfeb]">
                  Typing Test
                </span>
                <span className="text-[#5b7587] group-hover:text-[#24485f] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </span>
              </div>

              <h2 className="text-2xl font-bold text-[#172b38] mb-2 tracking-tight">
                SwiftType
              </h2>
              <p className="text-sm text-[#455f70] font-normal leading-relaxed mb-8">
                Test your typing speed and accuracy with clean live metrics, solid non-blinking caret, and timing reports.
              </p>
            </div>

            <div className="pt-4 border-t border-[#e8f0f5] flex items-center justify-between text-xs font-mono">
              <span className="text-[#5b7587]">Speed Test</span>
              <strong className="text-[#24485f] group-hover:underline transition-colors flex items-center gap-1">
                <span>Start Typing</span>
                <span>→</span>
              </strong>
            </div>
          </Link>

        </div>

      </main>

      {/* ── Clean Footer ── */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto border-t border-[#e1e9df] py-6 px-6 text-xs font-mono text-[#6c8574]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>duoprep</span>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-[#1b2b20] transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-[#1b2b20] transition-colors">Register</Link>
            <Link href="/write-about" className="hover:text-[#1b2b20] transition-colors">WriteAbout</Link>
            <Link href="/swifttype" className="hover:text-[#1b2b20] transition-colors">SwiftType</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
