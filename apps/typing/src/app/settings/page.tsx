'use client';

import React from 'react';
import { useSettings } from '@/lib/SettingsContext';
import { ThemeMode, CaretStyle, TestMode } from '@writeabout/types';
import { soundEngine } from '@/lib/typing-engine';

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();

  const themes: { id: ThemeMode; name: string; bg: string; main: string }[] = [
    { id: 'light', name: 'Editorial', bg: '#f8f9fa', main: '#18181b' },
    { id: 'dark', name: 'Obsidian', bg: '#121316', main: '#f4f4f5' },
    { id: 'nord', name: 'Nordic Frost', bg: '#2e3440', main: '#88c0d0' },
    { id: 'serika', name: 'Amber Glow', bg: '#eaeaea', main: '#d97706' },
    { id: 'matrix', name: 'Phosphor', bg: '#090c09', main: '#22c55e' },
  ];

  const fonts = ['Inter', 'Roboto Mono', 'JetBrains Mono', 'Fira Code', 'Courier New'];
  const carets: CaretStyle[] = ['line', 'block', 'underline', 'off'];

  return (
    <div className="w-full max-w-3xl flex flex-col gap-6 my-6 select-none">
      <div>
        <h1 className="text-2xl font-light tracking-tight text-[var(--text-primary)]">Preferences & Ergonomics</h1>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Fine-tune the visual spectrum, caret physics, and acoustic feedback.
        </p>
      </div>

      {/* Theme Palette Card */}
      <div className="p-8 rounded-[28px] bg-[var(--surface-primary)] border border-[var(--surface-border)] shadow-[0_16px_36px_-10px_rgba(0,0,0,0.03)] backdrop-blur-md flex flex-col gap-5">
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--surface-border)]">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
          <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
            Atmospheric Theme
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => updateSettings({ theme: t.id })}
              className={`p-4 rounded-[20px] flex flex-col items-center gap-3 border transition-all cursor-pointer shadow-sm ${
                settings.theme === t.id
                  ? 'border-[var(--text-primary)] scale-102 ring-2 ring-[var(--text-primary)]/20'
                  : 'border-[var(--surface-border)] opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: t.bg }}
            >
              <div className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: t.main }} />
              <span className="text-xs font-semibold" style={{ color: t.main }}>
                {t.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Caret & Typography Section */}
      <div className="p-8 rounded-[28px] bg-[var(--surface-primary)] border border-[var(--surface-border)] shadow-[0_16px_36px_-10px_rgba(0,0,0,0.03)] backdrop-blur-md flex flex-col gap-6">
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--surface-border)]">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
          <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
            Optics & Typography
          </h2>
        </div>

        {/* Caret Style */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs uppercase tracking-wider text-[var(--text-primary)] font-medium">Caret Profile</span>
          <div className="inline-flex p-1 bg-[var(--surface-secondary)] border border-[var(--surface-border)] rounded-full">
            {carets.map((c) => (
              <button
                key={c}
                onClick={() => updateSettings({ caretStyle: c })}
                className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                  settings.caretStyle === c
                    ? 'text-[var(--text-primary)] bg-[var(--surface-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Smooth Caret Animation */}
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-[var(--text-primary)] font-medium">Luminescent Beam Physics</span>
          <button
            onClick={() => updateSettings({ smoothCaret: !settings.smoothCaret })}
            className={`px-4 py-1 rounded-full text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${
              settings.smoothCaret
                ? 'bg-[var(--accent-primary)] text-[var(--bg-canvas)]'
                : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--surface-border)]'
            }`}
          >
            {settings.smoothCaret ? 'Active' : 'Static'}
          </button>
        </div>

        {/* Font Family */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs uppercase tracking-wider text-[var(--text-primary)] font-medium">Typeface</span>
          <select
            value={settings.font}
            onChange={(e) => updateSettings({ font: e.target.value })}
            className="px-4 py-1.5 rounded-full bg-[var(--surface-secondary)] text-[var(--text-primary)] text-xs font-medium outline-none border border-[var(--surface-border)] cursor-pointer"
          >
            {fonts.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs uppercase tracking-wider text-[var(--text-primary)] font-medium">
            Scale ({settings.fontSize}px)
          </span>
          <input
            type="range"
            min="16"
            max="34"
            value={settings.fontSize}
            onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value, 10) })}
            className="w-36 accent-[var(--accent-primary)] cursor-pointer"
          />
        </div>
      </div>

      {/* Acoustic Feedback Section */}
      <div className="p-8 rounded-[28px] bg-[var(--surface-primary)] border border-[var(--surface-border)] shadow-[0_16px_36px_-10px_rgba(0,0,0,0.03)] backdrop-blur-md flex flex-col gap-6">
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--surface-border)]">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
          <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
            Acoustics
          </h2>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-[var(--text-primary)] font-medium">
            Mechanical Key Click Synthesis
          </span>
          <button
            onClick={() => {
              const nextVal = !settings.soundEnabled;
              updateSettings({ soundEnabled: nextVal });
              if (nextVal) soundEngine.playClick(settings.soundVolume);
            }}
            className={`px-4 py-1 rounded-full text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${
              settings.soundEnabled
                ? 'bg-[var(--accent-primary)] text-[var(--bg-canvas)]'
                : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--surface-border)]'
            }`}
          >
            {settings.soundEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {settings.soundEnabled && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs uppercase tracking-wider text-[var(--text-primary)] font-medium">
              Output Level ({Math.round(settings.soundVolume * 100)}%)
            </span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={settings.soundVolume}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                updateSettings({ soundVolume: vol });
                soundEngine.playClick(vol);
              }}
              className="w-36 accent-[var(--accent-primary)] cursor-pointer"
            />
          </div>
        )}
      </div>

    </div>
  );
}
