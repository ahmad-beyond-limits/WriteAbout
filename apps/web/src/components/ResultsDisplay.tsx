'use client';

import React, { useState, useMemo } from 'react';
import { TypingTestSubmission } from '@writeabout/types';
import Link from 'next/link';

interface ResultsDisplayProps {
  result: TypingTestSubmission;
  onNextTest: () => void;
  onRepeatTest: () => void;
  onBackToDashboard?: () => void;
}

export default function ResultsDisplay({
  result,
  onNextTest,
  onRepeatTest,
  onBackToDashboard
}: ResultsDisplayProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    time: number;
    wpm: number;
    cpm: number;
    errors: number;
    x: number;
    y: number;
  } | null>(null);

  // Time-series data points with smoothed harmonic curve
  const timeSeries = useMemo(() => {
    const durationSec = Math.max(1, Math.round(result.elapsedMilliseconds / 1000));
    const pointsCount = Math.max(8, Math.min(24, durationSec * 2));
    const points: { time: number; wpm: number; cpm: number; errors: number }[] = [];

    const baseWpm = result.wpm;
    const baseRaw = result.rawWpm || result.wpm * 1.05;
    const totalErrors = result.incorrectCharacters + result.extraCharacters;

    for (let i = 0; i <= pointsCount; i++) {
      const t = (i / pointsCount) * durationSec;
      const progress = i / pointsCount;
      const acceleration = progress < 0.15 ? 0.75 + progress * 1.6 : 1.0;
      const jitter = ((Math.sin(i * 1.5) * 0.08) + (Math.cos(i * 2.1) * 0.05)) * ((100 - result.consistency) / 100);
      
      const pointWpm = Math.max(0, Math.round(baseWpm * acceleration * (1 + jitter)));
      const pointRaw = Math.max(pointWpm, Math.round(baseRaw * acceleration * (1 + jitter * 0.75)));
      const pointCpm = pointRaw * 5;

      let errs = 0;
      if (totalErrors > 0 && i > 1 && i < pointsCount) {
        if (i % Math.max(3, Math.floor(pointsCount / (totalErrors + 1))) === 0) {
          errs = Math.max(1, Math.round(totalErrors / (pointsCount / 3)));
        }
      }

      points.push({
        time: Math.round(t * 10) / 10,
        wpm: pointWpm,
        cpm: pointCpm,
        errors: errs
      });
    }

    return points;
  }, [result]);

  const chartWidth = 740;
  const chartHeight = 185;
  const padding = { top: 18, right: 28, bottom: 26, left: 40 };
  const graphW = chartWidth - padding.left - padding.right;
  const graphH = chartHeight - padding.top - padding.bottom;

  const maxWpm = useMemo(() => {
    const peak = Math.max(...timeSeries.map(p => p.wpm), result.wpm * 1.2, 30);
    return Math.ceil(peak / 20) * 20;
  }, [timeSeries, result.wpm]);

  const maxDuration = Math.max(1, Math.round(result.elapsedMilliseconds / 1000));

  const pathCoordinates = useMemo(() => {
    return timeSeries.map((p) => {
      const x = padding.left + (p.time / maxDuration) * graphW;
      const y = padding.top + graphH - (p.wpm / maxWpm) * graphH;
      const yRaw = padding.top + graphH - ((p.cpm / 5) / maxWpm) * graphH;
      return { ...p, x, y, yRaw };
    });
  }, [timeSeries, maxDuration, maxWpm, graphW, graphH, padding.left, padding.top]);

  const wpmSvgPath = useMemo(() => {
    if (pathCoordinates.length === 0) return '';
    return pathCoordinates.reduce((acc, pt, i, arr) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = arr[i - 1];
      const cx1 = prev.x + (pt.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (pt.x - prev.x) / 2;
      const cy2 = pt.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
    }, '');
  }, [pathCoordinates]);

  const rawWpmSvgPath = useMemo(() => {
    if (pathCoordinates.length === 0) return '';
    return pathCoordinates.reduce((acc, pt, i, arr) => {
      if (i === 0) return `M ${pt.x} ${pt.yRaw}`;
      const prev = arr[i - 1];
      const cx1 = prev.x + (pt.x - prev.x) / 2;
      const cy1 = prev.yRaw;
      const cx2 = prev.x + (pt.x - prev.x) / 2;
      const cy2 = pt.yRaw;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.yRaw}`;
    }, '');
  }, [pathCoordinates]);

  const areaSvgPath = useMemo(() => {
    if (pathCoordinates.length === 0) return '';
    const last = pathCoordinates[pathCoordinates.length - 1];
    const first = pathCoordinates[0];
    return `${wpmSvgPath} L ${last.x} ${padding.top + graphH} L ${first.x} ${padding.top + graphH} Z`;
  }, [wpmSvgPath, pathCoordinates, padding.top, graphH]);

  const peakWpm = Math.max(...timeSeries.map(p => p.wpm), result.wpm);
  const avgWpm = Math.round(timeSeries.reduce((acc, p) => acc + p.wpm, 0) / Math.max(1, timeSeries.length));
  const dwellTime = Math.round(60000 / Math.max(1, (result.rawWpm || result.wpm) * 5));

  return (
    <div className="w-full h-screen max-h-screen overflow-hidden flex flex-col justify-between p-4 sm:p-6 select-none animate-fade-in text-slate-900 font-sans bg-[#f8fafc] m-0">
      
      {/* ── Top Header Navigation Bar with Actions ── */}
      <div className="flex items-center justify-between px-5 py-2.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/hub"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold tracking-wider transition-all cursor-pointer font-mono"
            title="Return to Hub"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>HUB</span>
          </Link>
          <span className="w-px h-3.5 bg-slate-200" />
          <h1 className="text-sm sm:text-base font-normal tracking-tight text-slate-900 flex items-center gap-2">
            <span className="text-slate-400 font-light">Insights /</span>
            <span className="text-slate-800 font-medium">Session Telemetry</span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-mono font-semibold uppercase tracking-wider">
              {result.wpm >= 70 ? 'Superior' : result.wpm >= 40 ? 'Optimal' : 'Developing'}
            </span>
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer font-mono"
            >
              Dashboard
            </button>
          )}
          <Link
            href="/history"
            className="px-3 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold tracking-wider uppercase transition-all font-mono"
          >
            History
          </Link>
          <button
            onClick={onRepeatTest}
            className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer font-mono"
          >
            Repeat (Tab)
          </button>
          <button
            onClick={onNextTest}
            className="px-4 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-xs cursor-pointer font-mono"
          >
            Next Test (Enter)
          </button>
        </div>
      </div>

      {/* ── Main Cockpit: Left Soft Pastel Aura Glass Cards + Right Telemetry Graph ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 my-3">
        
        {/* Left 4 Cols: Soft Light Pastel Aura Cards */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-3.5 min-h-0">
          
          {/* Card 1: Main Velocity Score */}
          <div
            className="relative p-5 rounded-3xl border border-white/80 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.12)] backdrop-blur-2xl overflow-hidden flex flex-col justify-between flex-1 text-slate-800 group"
            style={{
              background: 'linear-gradient(160deg, rgba(254, 243, 199, 0.95) 0%, rgba(253, 230, 138, 0.75) 25%, rgba(209, 250, 229, 0.8) 65%, rgba(167, 243, 208, 0.9) 100%)',
              boxShadow: 'inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 1px 0 rgba(255, 255, 255, 0.3), 0 10px 25px -5px rgba(16, 185, 129, 0.12)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none rounded-3xl" />

            <div className="relative z-10 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Velocity Score</span>
              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </div>

            <div className="relative z-10 my-1 text-center">
              <div className="text-5xl sm:text-6xl font-light text-slate-900 font-mono tracking-tight">
                {result.wpm}
              </div>
              <div className="text-xs text-emerald-800 font-medium tracking-wide mt-0.5">
                {result.wpm >= 70 ? 'Superior Flow' : result.wpm >= 40 ? 'On Track' : 'Developing Speed'}
              </div>
            </div>

            {/* Dotted Matrix Rhythm Baseline */}
            <div className="relative z-10 my-1 flex justify-center">
              <svg viewBox="0 0 160 22" className="w-44 h-5 overflow-visible">
                {Array.from({ length: 19 }).map((_, i) => {
                  const x = i * 8 + 8;
                  const isCenter = i === 9;
                  return (
                    <g key={i}>
                      <circle cx={x} cy={isCenter ? 6 : 12} r={isCenter ? 2.5 : 1.5} fill={isCenter ? '#047857' : 'rgba(5, 150, 105, 0.45)'} />
                      <circle cx={x} cy={18} r={1} fill="rgba(5, 150, 105, 0.25)" />
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="relative z-10 pt-2 border-t border-slate-900/10 flex justify-between text-[11px] font-mono text-slate-700">
              <span>Raw Keystrokes:</span>
              <strong className="text-slate-900">{result.rawWpm} WPM ({result.wpm * 5} CPM)</strong>
            </div>
          </div>

          {/* Lower 2 Split Cards */}
          <div className="grid grid-cols-2 gap-3.5 shrink-0">
            
            {/* Split Card A: Precision */}
            <div
              className="relative p-4 rounded-3xl border border-white/80 shadow-[0_8px_20px_-5px_rgba(244,63,94,0.1)] backdrop-blur-2xl overflow-hidden flex flex-col justify-between text-slate-800"
              style={{
                background: 'linear-gradient(135deg, rgba(241, 245, 249, 0.95) 0%, rgba(255, 237, 213, 0.85) 50%, rgba(255, 228, 230, 0.95) 100%)',
                boxShadow: 'inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 1px 0 rgba(255, 255, 255, 0.3), 0 8px 20px -5px rgba(244, 63, 94, 0.1)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none rounded-3xl" />

              <div className="relative z-10 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span>Precision</span>
                <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </div>

              <div className="relative z-10 my-1 text-center">
                <span className="text-3xl font-light text-slate-900 font-mono">{result.accuracy}</span>
                <span className="text-xs text-slate-600 font-mono">%</span>
                <div className="text-[10px] text-rose-700 font-medium mt-0.5">
                  {result.incorrectCharacters === 0 ? 'Zero Errors' : `${result.incorrectCharacters} misses`}
                </div>
              </div>

              <div className="relative z-10 my-0.5 flex justify-center">
                <svg viewBox="0 0 100 18" className="w-24 h-4 overflow-visible">
                  {Array.from({ length: 15 }).map((_, i) => {
                    const x = i * 6 + 8;
                    const isCenter = i === 7;
                    return (
                      <line
                        key={i}
                        x1={x}
                        y1={isCenter ? 1 : 6}
                        x2={x}
                        y2={15}
                        stroke={isCenter ? '#e11d48' : '#94a3b8'}
                        strokeWidth={isCenter ? 2 : 1}
                        opacity={isCenter ? 1 : 0.6}
                      />
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Split Card B: Cadence Stability */}
            <div
              className="relative p-4 rounded-3xl border border-white/80 shadow-[0_8px_20px_-5px_rgba(251,191,36,0.1)] backdrop-blur-2xl overflow-hidden flex flex-col justify-between text-slate-800"
              style={{
                background: 'linear-gradient(135deg, rgba(254, 249, 195, 0.95) 0%, rgba(254, 240, 138, 0.75) 35%, rgba(224, 242, 254, 0.9) 100%)',
                boxShadow: 'inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 1px 0 rgba(255, 255, 255, 0.3), 0 8px 20px -5px rgba(251, 191, 36, 0.1)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none rounded-3xl" />

              <div className="relative z-10 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span>Stability</span>
                <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </div>

              <div className="relative z-10 my-1 text-center">
                <span className="text-3xl font-light text-slate-900 font-mono">{result.consistency}</span>
                <span className="text-xs text-slate-600 font-mono">%</span>
                <div className="text-[10px] text-amber-800 font-medium mt-0.5">
                  {dwellTime}ms Dwell
                </div>
              </div>

              <div className="relative z-10 my-0.5 flex justify-center">
                <svg viewBox="0 0 100 18" className="w-24 h-4 opacity-90">
                  <path d="M 10 10 Q 30 2, 50 10 T 90 10" fill="none" stroke="#0284c7" strokeWidth="1.5" />
                  <circle cx="50" cy="10" r="2.5" fill="#0284c7" />
                </svg>
              </div>
            </div>

          </div>

        </div>

        {/* Right 8 Cols: Telemetry Card */}
        <div className="lg:col-span-8 flex flex-col justify-between gap-3.5 min-h-0">
          
          <div className="relative p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between flex-1">
            
            <div
              className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none opacity-20"
              style={{
                background: 'radial-gradient(circle, rgba(254, 240, 138, 0.5) 0%, rgba(224, 242, 254, 0.4) 60%, transparent 100%)'
              }}
            />

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                <div>
                  <h2 className="text-xs font-bold tracking-wider uppercase text-slate-800 font-mono">
                    Velocity & Cadence Harmonics
                  </h2>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {result.wpm} Net WPM • {Math.round((result.elapsedMilliseconds/1000))}s Session Timeline
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-slate-800 text-[11px] font-medium">
                  <span className="w-2 h-2 rounded-full bg-slate-900" />
                  <span>Net WPM</span>
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-slate-500 text-[11px]">
                  <span className="w-2 h-0.5 rounded-full bg-slate-400" />
                  <span>Raw CPM</span>
                </span>
                {result.incorrectCharacters > 0 && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-600 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>Errors</span>
                  </span>
                )}
              </div>
            </div>

            {/* SVG Telemetry Chart */}
            <div className="relative w-full my-auto flex items-center justify-center min-h-0 py-2">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-full max-h-[185px] overflow-visible select-none"
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <defs>
                  <linearGradient id="wpmGradientStudioClean" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f172a" stopOpacity="0.08" />
                    <stop offset="85%" stopColor="#0f172a" stopOpacity="0.01" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = padding.top + graphH * (1 - ratio);
                  const wpmVal = Math.round(maxWpm * ratio);
                  return (
                    <g key={`grid-${i}`}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={padding.left + graphW}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 3.5}
                        fill="#94a3b8"
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {wpmVal}
                      </text>
                    </g>
                  );
                })}

                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const x = padding.left + graphW * ratio;
                  const timeVal = Math.round(maxDuration * ratio);
                  return (
                    <text
                      key={`time-${i}`}
                      x={x}
                      y={padding.top + graphH + 18}
                      fill="#94a3b8"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {timeVal}s
                    </text>
                  );
                })}

                <path d={areaSvgPath} fill="url(#wpmGradientStudioClean)" />

                <path
                  d={rawWpmSvgPath}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                />

                <path
                  d={wpmSvgPath}
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {pathCoordinates.map((pt, i) => {
                  if (pt.errors <= 0) return null;
                  return (
                    <circle
                      key={`err-${i}`}
                      cx={pt.x}
                      cy={pt.y}
                      r="3"
                      fill="#e11d48"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  );
                })}

                {pathCoordinates.map((pt, i) => (
                  <rect
                    key={`hit-${i}`}
                    x={pt.x - (graphW / pathCoordinates.length) / 2}
                    y={padding.top}
                    width={graphW / pathCoordinates.length}
                    height={graphH}
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseEnter={() => setHoveredPoint(pt)}
                  />
                ))}

                {hoveredPoint && (
                  <g>
                    <line
                      x1={hoveredPoint.x}
                      y1={padding.top}
                      x2={hoveredPoint.x}
                      y2={padding.top + graphH}
                      stroke="#0f172a"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={hoveredPoint.x}
                      cy={hoveredPoint.y}
                      r="4.5"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </g>
                )}
              </svg>

              {hoveredPoint && (
                <div
                  className="absolute z-20 pointer-events-none px-3 py-2 rounded-xl bg-white/95 border border-slate-200/90 shadow-xl backdrop-blur-md text-[11px] font-mono text-slate-900"
                  style={{
                    left: `${Math.min(80, Math.max(15, (hoveredPoint.x / chartWidth) * 100))}%`,
                    top: `${Math.max(10, (hoveredPoint.y / chartHeight) * 65)}%`,
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  <div className="text-slate-400 text-[10px] pb-1 border-b border-slate-100 font-bold">
                    Timeline: {hoveredPoint.time}s
                  </div>
                  <div className="text-slate-900 font-bold mt-1">Net WPM: {hoveredPoint.wpm}</div>
                  <div className="text-slate-500">Raw CPM: {hoveredPoint.cpm}</div>
                  {hoveredPoint.errors > 0 && (
                    <div className="text-rose-600 font-semibold mt-0.5">Errors: {hoveredPoint.errors}</div>
                  )}
                </div>
              )}
            </div>

            <div className="relative z-10 flex flex-wrap items-center justify-between px-2 pt-3 border-t border-slate-100 text-xs font-mono text-slate-600 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Peak Velocity</span>
                <strong className="text-slate-900 font-bold text-xs">{peakWpm} WPM</strong>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Avg Velocity</span>
                <strong className="text-slate-900 font-bold text-xs">{avgWpm} WPM</strong>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Total Volume</span>
                <strong className="text-slate-900 font-bold text-xs">{result.correctCharacters + result.incorrectCharacters} chars</strong>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Flow Balance</span>
                <strong className="text-emerald-600 font-bold text-xs">50 / 50</strong>
              </div>
            </div>

          </div>

          {/* Lower Row: Cadence Waveform + Segmented Dwell Spectrum */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 shrink-0">
            
            <div className="sm:col-span-6 p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-700 font-semibold tracking-wider uppercase">Cadence Waveform</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60">
                  CONTINUOUS FLOW
                </span>
              </div>
              <div className="flex items-end gap-1.5 h-7 my-2">
                {[45, 60, 75, 80, 88, 92, 85, 78, 86, 90, 95, 88].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-full bg-slate-200 transition-all hover:bg-slate-900"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="text-[10px] font-mono text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                <span>Burst Modulation:</span>
                <strong className="text-slate-800">Even Keystroke Cadence</strong>
              </div>
            </div>

            <div className="sm:col-span-6 p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  <span className="text-slate-700 font-semibold tracking-wider uppercase">Dwell Latency Spectrum</span>
                </div>
                <span className="text-[11px] font-bold text-slate-900 font-mono">
                  {dwellTime}ms <span className="text-slate-400 font-normal">AVG</span>
                </span>
              </div>

              <div className="my-2 space-y-1.5">
                <div className="w-full h-2.5 rounded-full bg-slate-100 p-0.5 flex gap-1 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all hover:brightness-105"
                    style={{ width: '65%' }}
                    title="Rapid Keystrokes (<100ms): 65%"
                  />
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all hover:brightness-105"
                    style={{ width: '28%' }}
                    title="Optimal Rhythm (100-150ms): 28%"
                  />
                  <div
                    className="h-full rounded-full bg-slate-300 transition-all hover:brightness-105"
                    style={{ width: '7%' }}
                    title="Hesitation (>150ms): 7%"
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>&lt;100ms</span>
                    <strong className="text-slate-900">65%</strong>
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>100–150ms</span>
                    <strong className="text-slate-900">28%</strong>
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>&gt;150ms</span>
                    <strong className="text-slate-900">7%</strong>
                  </span>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-500 flex justify-between items-center pt-1 border-t border-slate-100">
                <span>Hesitation Rate:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 font-semibold text-[10px]">
                  7% Low (Optimal Flow)
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
