'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BarChart, Bar, AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type AnalysisResult = {
  wordCount: number;
  rate: string;
  feedback: string;
  totalSentences?: number;
  levels?: {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
  };
} | null;

const RATE_COLORS = {
  low: '#f87171',
  medium: '#fbbf24',
  good: '#60a5fa',
  high: '#a78bfa',
  excellent: '#34d399'
};

const RATE_WEIGHTS: Record<string, number> = {
  excellent: 5.0,
  high: 4.2,
  good: 3.5,
  medium: 2.7,
  low: 1.5
};

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=80'
];

function InsightsScreen({
  onPractice,
  onLogout,
  onConfigureKey,
  userId
}: {
  onPractice: () => void;
  onLogout: () => void;
  onConfigureKey?: () => void;
  userId: number;
}) {
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState<'week' | 'month'>('week');
  const [reviewItem, setReviewItem] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/insights?filter=${filter}&userId=${userId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d);
      })
      .catch((err) => console.error('Failed to load insights:', err));
  }, [filter, userId]);

  if (!data) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center', color: '#666' }}>
          Loading your insights...
        </div>
      </div>
    );
  }

  const totalPractices = data.history?.length || 0;
  const totalWords = data.history?.reduce((acc: number, item: any) => acc + (item.text ? item.text.trim().split(/\s+/).filter(Boolean).length : 0), 0) || 0;
  const avgWords = totalPractices > 0 ? Math.round(totalWords / totalPractices) : 0;
  const totalCalls = (data.apiUsage || []).reduce((acc: number, c: any) => acc + (parseInt(c.calls) || 0), 0);

  const avgLevelScores = (() => {
    if (!data.history || data.history.length === 0) {
      return [
        { name: 'L1: Basic', label: 'Basic Writing', score: 0 },
        { name: 'L2: Context', label: 'Image Context', score: 0 },
        { name: 'L3: Adjectives', label: 'Adjectives', score: 0 },
        { name: 'L4: Syntax', label: 'Syntax & Flow', score: 0 },
      ];
    }
    const count = data.history.length;
    let l1Sum = 0, l2Sum = 0, l3Sum = 0, l4Sum = 0;
    data.history.forEach((h: any) => {
      const words = h.text ? h.text.trim().split(/\s+/).filter(Boolean).length : 0;
      const sents = h.text ? Math.max(1, (h.text.match(/[^.!?]+[.!?]+/g) || [h.text]).length) : 1;
      l1Sum += Math.min(5, Math.max(1, Math.ceil(words / 10)));
      l2Sum += RATE_WEIGHTS[h.rate?.toLowerCase()] || 3;
      l3Sum += Math.min(5, Math.max(1, Math.round(words / 12) + 1));
      l4Sum += Math.min(5, Math.max(1, Math.round((words / sents) / 3)));
    });
    return [
      { name: 'L1: Basic', label: 'Basic Writing', score: Number((l1Sum / count).toFixed(1)) },
      { name: 'L2: Context', label: 'Image Context', score: Number((l2Sum / count).toFixed(1)) },
      { name: 'L3: Adjectives', label: 'Adjectives', score: Number((l3Sum / count).toFixed(1)) },
      { name: 'L4: Syntax', label: 'Syntax & Flow', score: Number((l4Sum / count).toFixed(1)) },
    ];
  })();

  return (
    <div className="insights-wrapper">
      {/* Top Bar Navigation */}
      <nav className="insights-nav">
        <div className="insights-nav-left">
          <Link
            href="/hub"
            className="btn-modern-outline"
            style={{
              padding: '7px 16px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Workspace Hub
          </Link>
          <div className="insights-nav-title">
            <span className="insights-pulse-dot" />
            WriteAbout
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
          {onConfigureKey && (
            <button
              className="btn-modern-outline"
              onClick={onConfigureKey}
              style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
              title="Configure Groq API Key"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
              API Key
            </button>
          )}
          <button className="btn-modern-outline" onClick={onLogout} style={{ padding: '8px 20px', fontSize: '13px' }}>
            Logout
          </button>
          <button className="btn-modern-primary" onClick={onPractice} style={{ padding: '8px 22px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Start Practicing
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </nav>

      <div className="insights-content">
        {/* Master Asymmetric Editorial Grid: Writing Velocity on Left, 3 Analytics Instruments on Right */}
        <div className="insights-dashboard-grid">
          {/* Left Column: Feature Hero Velocity Card (Full Height) */}
          <div className="insights-hero-card">
            <div>
              <div className="insights-card-header">
                <span className="insights-card-label">Writing Velocity</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a24', background: '#e8f3ea', padding: '2px 8px', borderRadius: '100px' }}>
                  60s SPRINT
                </span>
              </div>
              <div className="insights-hero-metrics">
                <span className="insights-hero-bigval">{avgWords > 0 ? avgWords : '—'}</span>
                <span className="insights-hero-unit">avg words / session</span>
              </div>
              <p style={{ fontSize: '13px', color: '#2b4733', lineHeight: 1.55, margin: '0 0 1.25rem 0' }}>
                Measures descriptive flow, lexical precision, and response density under timed visual stimulus.
              </p>

              {/* Extra Insight Telemetry inside Hero */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.7)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(167, 243, 208, 0.5)' }}>
                  <span style={{ fontSize: '12px', color: '#1b2b20', fontWeight: 500 }}>Target Pace</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#064e3b' }}>≥ 40 wpm (Optimal)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.7)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(167, 243, 208, 0.5)' }}>
                  <span style={{ fontSize: '12px', color: '#1b2b20', fontWeight: 500 }}>Cadence Index</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#064e3b' }}>{avgWords > 0 ? (avgWords / 60).toFixed(2) : '0.00'} words/sec</span>
                </div>
              </div>
            </div>

            <div className="insights-hero-tags">
              <span className="insights-hero-tag">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                {totalPractices} Sessions Logged
              </span>
              <span className="insights-hero-tag">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
                {totalWords} Words Crafted
              </span>
            </div>
          </div>

          {/* Right Column: 3 Instruments Suite */}
          <div className="insights-right-column">
            {/* Top Row: Rating Spread + Competency by Level */}
            <div className="insights-right-top-row">
              {/* Card 1: Rating Spread Breakdown */}
              <div className="insights-instrument-card" style={{ padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column' }}>
                <div className="insights-card-header" style={{ marginBottom: '0.25rem' }}>
                  <h4 className="instrument-title">Rating Spread</h4>
                  <div className="filter-segmented-control">
                    <button className={`filter-segmented-btn ${filter === 'week' ? 'active' : ''}`} onClick={() => setFilter('week')}>
                      Week
                    </button>
                    <button className={`filter-segmented-btn ${filter === 'month' ? 'active' : ''}`} onClick={() => setFilter('month')}>
                      Month
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, minHeight: '190px', width: '100%', marginTop: '0.25rem' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.performance || []} margin={{ top: 10, right: 6, left: 6, bottom: 4 }}>
                      <XAxis
                        dataKey="name"
                        interval={0}
                        tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Switzer, sans-serif' }}
                        tickFormatter={(val) => (typeof val === 'string' ? val.charAt(0).toUpperCase() + val.slice(1) : val)}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                        contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: '12px' }}
                      />
                      <Bar dataKey="value" minPointSize={4} barSize={42} radius={[6, 6, 0, 0]}>
                        {(data.performance || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={RATE_COLORS[entry.name as keyof typeof RATE_COLORS] || '#34d399'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Card 2: Competency by Level Diagnostic Benchmarks */}
              <div className="insights-instrument-card" style={{ padding: '1.25rem 1.4rem' }}>
                <div className="insights-card-header" style={{ marginBottom: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 className="instrument-title">Competency by Level</h4>
                  </div>
                </div>

                <div className="level-diagnostic-list">
                  {avgLevelScores.map((item, idx) => {
                    const totalBars = 5;
                    const activeBars = Math.min(5, Math.max(1, Math.round(item.score)));
                    
                    // 5 distinct progressive color steps across bars 1 to 5 from our main green design palette
                    const palette5Bars = ['#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669'];
                    const statusColor = item.score >= 4.2 ? '#059669' : item.score >= 3.5 ? '#10b981' : item.score >= 2.8 ? '#d97706' : '#dc2626';
                    const statusLabel = item.score >= 4.2 ? 'EXCELLENT' : item.score >= 3.5 ? 'PROFICIENT' : item.score >= 2.8 ? 'DEVELOPING' : 'EMERGING';

                    return (
                      <div key={idx} className="level-diagnostic-item">
                        <div className="level-diagnostic-header">
                          <div className="level-diagnostic-title-group">
                            <span className="level-diagnostic-title">{item.label}</span>
                            <span className="level-diagnostic-sub">{item.name.split(':')[0]}</span>
                          </div>
                          <div className="level-diagnostic-score-group">
                            <div className="level-score-val-wrap">
                              <span className="level-diagnostic-score">{item.score.toFixed(1)}</span>
                              <span className="level-score-scale">/ 5.0</span>
                            </div>
                            <span
                              className="level-diagnostic-status"
                              style={{ color: statusColor }}
                            >
                              {statusLabel}
                            </span>
                          </div>
                        </div>

                        {/* 5-Bar Pill Segmented Meter with 5 Distinct Progression Colors */}
                        <div className="segmented-track" style={{ marginTop: '4px' }}>
                          {Array.from({ length: totalBars }).map((_, barIdx) => {
                            const isActive = barIdx < activeBars;
                            return (
                              <div
                                key={barIdx}
                                style={{
                                  flex: 1,
                                  height: '6px',
                                  borderRadius: '3px',
                                  background: isActive ? palette5Bars[barIdx] : '#f1f5f9',
                                  transition: 'all 0.25s ease'
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Row: 7-Day Activity Stream (Spans full right width) */}
            <div className="insights-instrument-card" style={{ padding: '1.25rem 1.75rem' }}>
              <div className="insights-card-header" style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h4 className="instrument-title">Activity Density</h4>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>Last 7 Days Activity Stream</span>
                </div>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#1e3a24', background: '#e8f3ea', padding: '2px 10px', borderRadius: '100px', border: '1px solid #dcfce7' }}>
                  {totalCalls} Total Requests
                </span>
              </div>

              <ResponsiveContainer width="100%" height={110}>
                <AreaChart data={data.apiUsage || []} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="activityGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a24" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1e3a24" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                    contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="calls" stroke="#1e3a24" strokeWidth={2.5} fillOpacity={1} fill="url(#activityGlow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Practices Telemetry Feed */}
        <div className="history-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 className="dash-title" style={{ margin: 0, fontSize: '16px', fontFamily: 'Sora, sans-serif' }}>
                Recent Practices Telemetry
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Complete chronological evaluation history and qualitative diagnostics
              </span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', background: '#f1f5f9', padding: '3px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {data.history?.length || 0} Records
            </span>
          </div>

          <div className="history-list">
            {!data.history || data.history.length === 0 ? (
              <div className="empty-state">No practices recorded yet. Start practicing to view detailed telemetry!</div>
            ) : (
              data.history.map((item: any) => {
                const words = item.text ? item.text.trim().split(/\s+/).filter(Boolean).length : 0;
                const sentences = item.text ? Math.max(1, (item.text.match(/[^.!?]+[.!?]+/g) || [item.text]).length) : 1;
                const rateColor = RATE_COLORS[item.rate as keyof typeof RATE_COLORS] || '#1b2b20';

                return (
                  <div key={item.id} className="history-card">
                    {/* Challenge Image Preview */}
                    <div className="history-thumb-wrapper">
                      <img
                        src={item.image_url || SAMPLE_IMAGES[0]}
                        alt={`Practice #${item.id}`}
                        className="history-thumb-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = SAMPLE_IMAGES[0];
                        }}
                      />
                    </div>

                    {/* Complete Practice Telemetry & Content */}
                    <div className="history-main-content">
                      <div className="history-header">
                        <div className="history-id-group">
                          <span className="history-id">Practice #{item.id}</span>
                          <span className="history-pill-tag">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                            </svg>
                            {words} words
                          </span>
                          <span className="history-pill-tag">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                              <line x1="8" y1="6" x2="21" y2="6" />
                              <line x1="8" y1="12" x2="21" y2="12" />
                              <line x1="8" y1="18" x2="21" y2="18" />
                            </svg>
                            {sentences} sentences
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            className="history-rate"
                            style={{
                              backgroundColor: rateColor + '15',
                              color: rateColor,
                              border: `1px solid ${rateColor}35`
                            }}
                          >
                            {item.rate}
                          </span>
                          <span className="history-date">{item.date}</span>
                        </div>
                      </div>

                      {/* Submitted Text Snippet */}
                      {item.text && (
                        <div className="history-text-quote" title={item.text}>
                          "{item.text}"
                        </div>
                      )}

                      {/* Feedback Excerpt */}
                      <p className="history-feedback">{item.feedback}</p>
                    </div>

                    {/* Action Button */}
                    <div className="history-actions">
                      <button
                        className="btn-modern-outline"
                        style={{ padding: '8px 18px', fontSize: '12px', whiteSpace: 'nowrap', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '5px' }}
                        onClick={() => setReviewItem(item)}
                      >
                        Review
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Review Full Analysis Modal */}
      <div className={`analysis-overlay ${reviewItem !== null ? 'active' : ''}`}>
        {reviewItem && (() => {
          const revWords = reviewItem.text ? reviewItem.text.trim().split(/\s+/).filter(Boolean).length : 0;
          const revSentences = reviewItem.text ? Math.max(1, (reviewItem.text.match(/[^.!?]+[.!?]+/g) || [reviewItem.text]).length) : 1;
          const l1 = Math.min(5, Math.max(1, Math.ceil(revWords / 8)));
          const l2 = reviewItem.rate === 'excellent' ? 5 : reviewItem.rate === 'high' ? 4 : reviewItem.rate === 'good' ? 3 : 2;
          const l3 = reviewItem.rate === 'excellent' ? 5 : reviewItem.rate === 'high' ? 4 : reviewItem.rate === 'good' ? 3 : 2;
          const l4 = reviewItem.rate === 'excellent' ? 5 : reviewItem.rate === 'high' ? 4 : reviewItem.rate === 'good' ? 3 : 2;
          const rateColor = RATE_COLORS[reviewItem.rate as keyof typeof RATE_COLORS] || '#1b2b20';

          return (
            <div className="analysis-card slide-up">
              {/* Top Header Row */}
              <div className="analysis-top-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="insights-pulse-dot" />
                  <h2 className="analysis-main-title">Practice #{reviewItem.id} Diagnostic</h2>
                </div>
                <div className="metrics-grid">
                  <div className="metric">
                    <div className="metric-val">{revWords}</div>
                    <div className="metric-lbl">Words</div>
                  </div>
                  <div className="metric">
                    <div className="metric-val">{revSentences}</div>
                    <div className="metric-lbl">Sentences</div>
                  </div>
                  <div className="metric">
                    <div className="metric-val" style={{ color: rateColor }}>
                      {reviewItem.rate.toUpperCase()}
                    </div>
                    <div className="metric-lbl">Rating</div>
                  </div>
                </div>
              </div>

              {/* Middle 2 Columns */}
              <div className="analysis-columns">
                {/* Left: 5-Bar Segmented Spectrum */}
                <div className="segmented-viz-container">
                  {[
                    { label: 'Level 1: Basic Writing', score: l1 },
                    { label: 'Level 2: Image Context', score: l2 },
                    { label: 'Level 3: Descriptive Adjectives', score: l3 },
                    { label: 'Level 4: Syntax & Flow', score: l4 },
                  ].map((item, rowIdx) => {
                    const totalPills = 5;
                    const activePills = Math.min(5, Math.max(1, item.score));

                    return (
                      <div key={rowIdx} className="segmented-row">
                        <div className="segmented-header">
                          <span className="segmented-title">{item.label}</span>
                          <span className="segmented-score">{item.score} / 5</span>
                        </div>
                        <div className="segmented-track">
                          {Array.from({ length: totalPills }).map((_, pillIdx) => (
                            <div
                              key={pillIdx}
                              className={`segmented-pill ${pillIdx < activePills ? 'active' : 'inactive'}`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Submitted Text & Detailed Feedback */}
                <div className="analysis-feedback-col">
                  {reviewItem.text && (
                    <div style={{ marginBottom: '0.75rem', padding: '0.75rem 1rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '3px solid #1e3a24', fontSize: '12.5px', color: '#1e293b', lineHeight: 1.5 }}>
                      "{reviewItem.text}"
                    </div>
                  )}
                  <p className="analysis-feedback-body">{reviewItem.feedback}</p>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="analysis-actions-right">
                <button className="btn-modern-outline" onClick={() => setReviewItem(null)}>
                  Dismiss
                </button>
                <button
                  className="btn-modern-primary"
                  onClick={() => {
                    setReviewItem(null);
                    onPractice();
                  }}
                >
                  Start New Practice
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default function WriteAboutApp() {
  const TOTAL_TIME = 60;
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [currentView, setCurrentView] = useState<'apikey' | 'insights' | 'practice'>('apikey');
  const [apiKey, setApiKey] = useState('');
  const [authStatus, setAuthStatus] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [text, setText] = useState('');
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult>(null);
  const [showLimitsInfo, setShowLimitsInfo] = useState(false);
  const [showMobileNotice, setShowMobileNotice] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('writeabout_user');
    const savedKey = localStorage.getItem('writeabout_apikey');
    if (!saved) {
      window.location.href = '/login';
      return;
    }
    try {
      setUser(JSON.parse(saved));
      if (savedKey && savedKey.trim().length > 0) {
        setApiKey(savedKey.trim());
        setCurrentView('insights');
      } else {
        setApiKey('');
        setCurrentView('apikey');
      }
    } catch (e) {
      window.location.href = '/login';
    }
  }, []);

  const handleApiKeyVerify = async () => {
    setAuthStatus('');
    if (!apiKey.trim()) {
      setAuthStatus('Please enter a Groq API key.');
      return;
    }
    setIsLoadingAuth(true);
    try {
      const verifyRes = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${apiKey.trim()}` }
      });
      if (!verifyRes.ok) {
        setAuthStatus('Invalid Groq API Key. Please verify key on groq.com.');
        setIsLoadingAuth(false);
        return;
      }

      const saveRes = await fetch('/api/auth/save-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, apiKey: apiKey.trim() })
      });
      const saveData = await saveRes.json();
      if (saveRes.ok && saveData.success) {
        localStorage.setItem('writeabout_apikey', apiKey.trim());
        setCurrentView('insights');
      } else {
        setAuthStatus(saveData.error || 'Failed to save API key.');
      }
    } catch (e) {
      setAuthStatus('Error verifying API Key. Check your connection.');
    }
    setIsLoadingAuth(false);
  };

  const getRandomImage = useCallback(() => {
    const nextIdx = Math.floor(Math.random() * SAMPLE_IMAGES.length);
    setImageUrl(SAMPLE_IMAGES[nextIdx]);
  }, []);

  // Timer Effect (Starts ONLY when image is fully loaded)
  useEffect(() => {
    let timer: any;
    if (isRunning && isImageLoaded && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      submitLog();
    }
    return () => clearInterval(timer);
  }, [isRunning, isImageLoaded, timeLeft]);

  const executeStartPractice = () => {
    setIsImageLoaded(false);
    setIsRunning(false);
    getRandomImage();
    setTimeLeft(TOTAL_TIME);
    setText('');
    setAnalysis(null);
    setCurrentView('practice');
  };

  const handleStartPractice = () => {
    if (!apiKey || apiKey.trim().length === 0) {
      setCurrentView('apikey');
      return;
    }
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowMobileNotice(true);
      return;
    }
    executeStartPractice();
  };

  const submitLog = async () => {
    if (text.trim().length === 0) {
      alert('Please write something to evaluate.');
      setIsRunning(false);
      setCurrentView('insights');
      return;
    }

    setIsSubmitting(true);
    setIsRunning(false);

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          image_url: imageUrl,
          userId: user?.id || 1,
          apiKey: apiKey || undefined
        })
      });
      const data = await res.json();
      const resAnalysis = data.data || data.analysis;
      if (data.success && resAnalysis) {
        setAnalysis({
          wordCount: resAnalysis.wordCount,
          rate: resAnalysis.rate,
          feedback: resAnalysis.feedback,
          totalSentences: resAnalysis.totalSentences,
          levels: resAnalysis.levels
        });
      } else {
        setAnalysis({
          wordCount: text.split(' ').filter(Boolean).length,
          rate: 'good',
          feedback: 'Session recorded successfully.'
        });
      }
    } catch (err) {
      setAnalysis({
        wordCount: text.split(' ').filter(Boolean).length,
        rate: 'good',
        feedback: 'Practice completed.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('writeabout_user');
    localStorage.removeItem('writeabout_apikey');
    setUser(null);
    setApiKey('');
    window.location.href = '/login';
  };

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center', color: '#666' }}>
          Checking session...
        </div>
      </div>
    );
  }

  if (currentView === 'apikey') {
    return (
      <div
        className="w-full min-h-screen flex flex-col justify-between items-center p-6 sm:p-8 relative overflow-hidden text-[#1b2b20]"
        style={{
          background: '#f6f8f5',
          fontFamily: "'Switzer', -apple-system, BlinkMacSystemFont, sans-serif"
        }}
      >
        {/* ── Ambient Glows ── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-35 blur-[140px]"
            style={{ background: 'radial-gradient(circle, rgba(216, 235, 218, 0.6) 0%, rgba(240, 246, 238, 0.4) 50%, transparent 100%)' }}
          />
          <div
            className="absolute top-1/3 -right-40 w-[550px] h-[550px] rounded-full opacity-30 blur-[140px]"
            style={{ background: 'radial-gradient(circle, rgba(218, 234, 245, 0.6) 0%, rgba(246, 248, 245, 0.5) 60%, transparent 100%)' }}
          />
        </div>

        {/* ── Top Header ── */}
        <header className="relative z-10 flex items-center justify-between px-6 py-3.5 rounded-2xl bg-white/85 border border-[#e1e9df] shadow-[0_4px_24px_rgba(27,43,32,0.03)] backdrop-blur-xl shrink-0 max-w-lg w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1e3a24] flex items-center justify-center text-[#e8f2e9] font-bold text-sm shadow-xs">
              <svg className="w-4 h-4 text-[#a3d9ad]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-[#1b2b20]">
              WriteAbout
            </span>
          </div>

          <Link
            href="/hub"
            className="text-xs font-semibold text-[#556b5a] hover:text-[#1b2b20] uppercase tracking-wider transition-colors"
          >
            ← Back to Hub
          </Link>
        </header>

        {/* ── Main Modal Card ── */}
        <div className="relative z-10 w-full max-w-lg my-auto py-6">
          <div className="p-7 sm:p-9 rounded-3xl bg-white/95 border border-[#dbe6d9] shadow-[0_16px_45px_-10px_rgba(30,58,36,0.08)] backdrop-blur-xl space-y-6">
            
            {/* Title Section */}
            <div className="space-y-1 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] font-['Sora',sans-serif]">
                Connect Groq AI Engine
              </h2>
              <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed">
                Welcome, <strong className="text-[#1e293b]">{user.username}</strong>! Add your free API key for instant diagnostic feedback.
              </p>
            </div>

            {/* ── 100% Free & Unlimited Callout Banner ── */}
            <div className="p-4 sm:p-4.5 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
                <span className="text-xs font-bold text-[#065f46] uppercase tracking-wider font-['Sora',sans-serif]">
                  No Pricing · 100% Free & Unlimited
                </span>
              </div>
              <p className="text-xs text-[#047857] leading-relaxed">
                Groq provides fast, free API keys with generous rate limits at zero cost. No credit card or subscription needed.
              </p>
              <div className="pt-1">
                <a
                  href="https://groq.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                >
                  <span>Get Free API Key on Groq.com</span>
                  <span className="text-sm">↗</span>
                </a>
              </div>
            </div>

            {/* ── 3-Step Micro Guide ── */}
            <div className="space-y-2 text-xs text-[#475569] bg-[#f8fafc] p-3.5 rounded-2xl border border-[#e2e8f0]">
              <div className="font-semibold text-[#0f172a] text-[11.5px] uppercase tracking-wider">
                How to get your key in 30 seconds:
              </div>
              <div className="space-y-1 text-[11.5px] text-[#64748b]">
                <div>1. Open <a href="https://groq.com/" target="_blank" rel="noopener noreferrer" className="text-[#059669] font-bold underline">groq.com</a> and sign in with Google or GitHub (Free).</div>
                <div>2. Go to <strong>API Keys</strong> and click <strong>Create API Key</strong>.</div>
                <div>3. Paste your key (<code className="text-[#0f172a] bg-white px-1 py-0.5 rounded border border-[#e2e8f0]">gsk_...</code>) below.</div>
              </div>
            </div>

            {/* ── API Key Input ── */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#334155] block">
                Your Groq API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="gsk_..."
                autoFocus
                className="w-full px-4 py-3.5 rounded-2xl bg-[#fafbfc] border border-[#dbe6d9] focus:bg-white focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none text-xs font-mono text-[#0f172a] transition-all placeholder:text-[#94a3b8]"
              />
              {apiKey.startsWith('gsk_') && (
                <div className="flex items-center gap-1.5 text-xs text-[#059669] font-medium pt-0.5">
                  <span>✓</span>
                  <span>Valid Groq API key format</span>
                </div>
              )}
            </div>

            {authStatus && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {authStatus}
              </div>
            )}

            {/* ── Actions ── */}
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/hub"
                className="flex-1 py-3.5 px-4 rounded-2xl bg-[#edf4ed] hover:bg-[#e1ede1] text-[#2c4731] text-xs font-bold uppercase tracking-wider text-center transition-all"
              >
                Cancel
              </Link>
              <button
                onClick={handleApiKeyVerify}
                disabled={isLoadingAuth}
                className="flex-[2] py-3.5 px-5 rounded-2xl bg-[#1e3a24] hover:bg-[#162d1c] disabled:opacity-50 text-[#f2f7f2] text-xs font-bold uppercase tracking-wider transition-all text-center shadow-[0_4px_14px_rgba(30,58,36,0.18)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isLoadingAuth ? 'Verifying Key...' : 'Verify & Start Practice'}</span>
                <span className="text-sm">→</span>
              </button>
            </div>

          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="relative z-10 w-full text-center text-xs text-[#6c8574] py-2">
          duoprep • WriteAbout
        </footer>
      </div>
    );
  }

  if (currentView === 'insights') {
    return (
      <>
        <InsightsScreen
          onPractice={handleStartPractice}
          onLogout={handleLogout}
          onConfigureKey={() => setCurrentView('apikey')}
          userId={user.id}
        />

        {showMobileNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl p-6 bg-white/95 border border-[#dbe6d9] shadow-2xl space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#e8f2e9] text-[#1e3a24] flex items-center justify-center mx-auto shadow-xs">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[#0f172a] font-['Sora',sans-serif]">
                  Best on Desktop & Laptop
                </h3>
                <p className="text-xs text-[#556b5a] leading-relaxed">
                  WriteAbout is a timed visual typing sprint designed for physical keyboards. It works best on a desktop or laptop screen.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/hub"
                  className="w-full py-2.5 px-4 rounded-2xl bg-[#1e3a24] hover:bg-[#162d1c] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer text-center"
                >
                  ← Back to Hub
                </Link>
                <button
                  onClick={() => {
                    setShowMobileNotice(false);
                    executeStartPractice();
                  }}
                  className="w-full py-2 px-4 rounded-2xl text-[11px] text-[#556b5a] hover:text-[#1e3a24] font-medium transition-colors text-center cursor-pointer"
                >
                  Continue on Mobile Anyway →
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  const isUrgent = timeLeft <= 10;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div
      className="writeabout-app-wrapper"
      style={{
        minHeight: '100vh',
        height: '100vh',
        background: 'linear-gradient(135deg, #f6f7fa 0%, #e7e5fc 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }}
    >
      <nav className="top-nav">
        <div className={`timer-pill ${isUrgent ? 'urgent' : ''}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {formattedTime}
        </div>
        <div className="nav-title">WriteAbout</div>
      </nav>

      <div className="main-wrapper">
        <main className="app-container">
          <div className="col-left">
            <div className="image-wrapper" style={{ position: 'relative', overflow: 'hidden' }}>
              {!isImageLoaded && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(241, 245, 249, 0.95)', borderRadius: '20px', gap: '10px', zIndex: 3 }}>
                  <div style={{ width: '30px', height: '30px', border: '3px solid #cbd5e1', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, fontFamily: 'monospace' }}>Loading image challenge...</span>
                </div>
              )}
              <img
                src={imageUrl || SAMPLE_IMAGES[0]}
                alt="Visual Challenge"
                onLoad={() => {
                  setIsImageLoaded(true);
                  setIsRunning(true);
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = SAMPLE_IMAGES[0];
                  setIsImageLoaded(true);
                  setIsRunning(true);
                }}
                style={{
                  opacity: isImageLoaded ? 1 : 0,
                  transition: 'opacity 0.3s ease'
                }}
              />
            </div>
          </div>
          <div className="col-right">
            <textarea
              className="writing-box"
              placeholder={!isImageLoaded ? 'Waiting for challenge image to load...' : isRunning ? 'Write your beautiful description here...' : 'Click start to begin the 60-second challenge.'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!isRunning || !isImageLoaded || isSubmitting}
              autoFocus
            />
          </div>
        </main>
      </div>

      <footer className="bottom-nav">
        <div className="footer-content">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn-outline" onClick={() => setCurrentView('insights')} style={{ padding: '10px 24px', fontSize: '14px' }}>
              Back to Insights
            </button>
            {isRunning && analysis === null && (
              <button
                className="btn-icon"
                onClick={getRandomImage}
                title="Refresh Image"
                style={{
                  background: 'transparent',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#f9f9f9';
                  e.currentTarget.style.borderColor = '#ccc';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = '#ddd';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
            )}
          </div>

          {!isRunning && analysis === null ? (
            <button className="btn-black" onClick={handleStartPractice}>
              Start Challenge
            </button>
          ) : (
            <button
              className="btn-black"
              onClick={submitLog}
              disabled={!isRunning || isSubmitting || text.trim().length === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </div>
      </footer>

      {/* Analysis Slide-Up Modal Overlay */}
      <div className={`analysis-overlay ${analysis !== null ? 'active' : ''}`}>
        <div className="analysis-card slide-up">
          {/* Top Header Row: Main Title on Left + 3 Metric Cards on Right */}
          <div className="analysis-top-row">
            <h2 className="analysis-main-title">Performance Analysis</h2>
            <div className="metrics-grid">
              <div className="metric">
                <div className="metric-val">{analysis?.wordCount || 0}</div>
                <div className="metric-lbl">Words</div>
              </div>
              <div className="metric">
                <div className="metric-val">{analysis?.totalSentences ?? Math.max(1, (analysis?.wordCount ? Math.ceil(analysis.wordCount / 12) : 1))}</div>
                <div className="metric-lbl">Sentences</div>
              </div>
              <div className="metric">
                <div className="metric-val" style={{ color: analysis ? RATE_COLORS[analysis.rate as keyof typeof RATE_COLORS] : '#1b2b20' }}>
                  {analysis?.rate?.toUpperCase() || 'GOOD'}
                </div>
                <div className="metric-lbl">Rating</div>
              </div>
            </div>
          </div>

          {/* Middle 2 Columns: Left Segmented Skill Spectrum + Right Heading & Feedback */}
          <div className="analysis-columns">
            {/* Left: Clean Segmented Skill Spectrum */}
            <div className="segmented-viz-container">
              {[
                { label: 'Level 1: Basic Writing', score: analysis?.levels?.level1 ?? 3 },
                { label: 'Level 2: Image Context', score: analysis?.levels?.level2 ?? 3 },
                { label: 'Level 3: Descriptive Adjectives', score: analysis?.levels?.level3 ?? 3 },
                { label: 'Level 4: Syntax & Flow', score: analysis?.levels?.level4 ?? 3 },
              ].map((item, rowIdx) => {
                const totalPills = 5;
                const activePills = Math.min(5, Math.max(1, Math.round(item.score)));

                return (
                  <div key={rowIdx} className="segmented-row">
                    <div className="segmented-header">
                      <span className="segmented-title">{item.label}</span>
                      <span className="segmented-score">{item.score} / 5</span>
                    </div>

                    <div className="segmented-track">
                      {Array.from({ length: totalPills }).map((_, pillIdx) => (
                        <div
                          key={pillIdx}
                          className={`segmented-pill ${pillIdx < activePills ? 'active' : 'inactive'}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Detailed Paragraph Feedback */}
            <div className="analysis-feedback-col">
              <p className="analysis-feedback-body">
                {analysis?.feedback || 'Your description has been evaluated and recorded.'}
              </p>
            </div>
          </div>

          {/* Bottom Right Aligned Action Buttons */}
          <div className="analysis-actions-right">
            <button
              className="btn-modern-outline"
              onClick={() => setCurrentView('insights')}
            >
              Insights
            </button>
            <button
              className="btn-modern-primary"
              onClick={handleStartPractice}
            >
              Next Image →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
