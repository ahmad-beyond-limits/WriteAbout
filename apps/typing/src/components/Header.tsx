'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navLinks = [
    { name: 'Typing', href: '/' },
    { name: 'Leaderboard', href: '/leaderboard' },
    { name: 'History', href: '/history' },
    { name: 'Profile', href: '/profile' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <header className="w-full flex items-center justify-center px-4 py-3 relative select-none z-10">
      {/* Single Unified Centered Pill */}
      <nav className="flex items-center gap-1 p-1 bg-white/[0.12] border border-white/20 backdrop-blur-xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
        
        {/* Hub Link */}
        <a
          href="http://localhost:3000"
          className="px-3.5 py-1.5 rounded-full text-xs tracking-wider uppercase font-semibold text-white bg-white/15 hover:bg-white/25 transition-all mr-0.5"
          title="Return to Main Suite Hub"
        >
          ← Hub
        </a>

        <span className="w-px h-3.5 bg-white/15 mx-0.5" />

        {/* Links */}
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`px-3.5 py-1.5 rounded-full text-xs tracking-wider uppercase transition-all ${
                isActive
                  ? 'text-white bg-white/20 font-semibold shadow-xs'
                  : 'text-[#94a3b8] hover:text-white hover:bg-white/10 font-medium'
              }`}
            >
              {link.name}
            </Link>
          );
        })}

        <span className="w-px h-3.5 bg-white/15 mx-0.5" />

        {/* User Status / Login */}
        {user ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            <span className="text-xs font-semibold text-white tracking-wider">
              {user.displayName || user.username}
            </span>
            <button
              onClick={logout}
              className="text-[10px] text-[#94a3b8] hover:text-red-400 transition-colors cursor-pointer ml-1 uppercase tracking-wider"
            >
              exit
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider font-semibold bg-white text-[#0f172a] hover:bg-white/90 transition-all shadow-xs"
          >
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}
