'use client';

import React from 'react';
import { useSettings } from '@/lib/SettingsContext';

export default function Footer() {
  const { settings } = useSettings();

  return (
    <footer className="w-full max-w-6xl mx-auto px-6 py-3 flex items-center justify-between text-[11px] text-white/30 hover:text-white/60 transition-opacity select-none">
      <div className="flex items-center gap-3">
        <span>tab + enter to restart</span>
        <span>•</span>
        <span>esc to focus</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="capitalize">{settings.theme} theme</span>
        <span>•</span>
        <span>Neon PostgreSQL</span>
      </div>
    </footer>
  );
}
