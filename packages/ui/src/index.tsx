import React, { ButtonHTMLAttributes, InputHTMLAttributes, HTMLAttributes } from 'react';

// =========================================================================
// 1. Lush Gradient Aura Cards (Directly matching Reference 1 & 2)
// =========================================================================
export type AuraVariant = 'emerald-amber' | 'sunset-sky' | 'rose-pulse' | 'sage-gold' | 'glass-subtle';

export interface AuraCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AuraVariant;
  glow?: boolean;
}

export const AuraCard: React.FC<AuraCardProps> = ({
  children,
  variant = 'emerald-amber',
  glow = true,
  style,
  className = '',
  ...props
}) => {
  const gradientMap: Record<AuraVariant, { bg: string; color: string; border: string; shadow: string }> = {
    'emerald-amber': {
      bg: 'linear-gradient(145deg, #15803d 0%, #22c55e 35%, #eab308 80%, #ca8a04 100%)',
      color: '#ffffff',
      border: 'rgba(255, 255, 255, 0.25)',
      shadow: '0 24px 48px -12px rgba(34, 197, 94, 0.28)'
    },
    'sunset-sky': {
      bg: 'linear-gradient(145deg, #ea580c 0%, #f97316 35%, #facc15 65%, #60a5fa 95%, #3b82f6 100%)',
      color: '#ffffff',
      border: 'rgba(255, 255, 255, 0.3)',
      shadow: '0 24px 48px -12px rgba(249, 115, 22, 0.28)'
    },
    'rose-pulse': {
      bg: 'linear-gradient(145deg, #e11d48 0%, #f43f5e 40%, #fb7185 75%, #fda4af 100%)',
      color: '#ffffff',
      border: 'rgba(255, 255, 255, 0.35)',
      shadow: '0 24px 48px -12px rgba(244, 63, 94, 0.3)'
    },
    'sage-gold': {
      bg: 'linear-gradient(145deg, #365314 0%, #65a30d 40%, #84cc16 70%, #d97706 100%)',
      color: '#ffffff',
      border: 'rgba(255, 255, 255, 0.25)',
      shadow: '0 24px 48px -12px rgba(101, 163, 13, 0.25)'
    },
    'glass-subtle': {
      bg: 'rgba(255, 255, 255, 0.92)',
      color: '#18181b',
      border: 'rgba(0, 0, 0, 0.06)',
      shadow: '0 20px 40px -12px rgba(0, 0, 0, 0.04)'
    }
  };

  const selected = gradientMap[variant];

  return (
    <div
      style={{
        background: selected.bg,
        color: selected.color,
        borderRadius: '26px',
        border: `1px solid ${selected.border}`,
        boxShadow: glow ? selected.shadow : '0 10px 24px rgba(0,0,0,0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.25s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.25s ease',
        ...style
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
};

// =========================================================================
// 2. Harmonic Wireframe & Lissajous Vector Art
// =========================================================================
export const HarmonicWireframe: React.FC<{ type?: 'loop' | 'wave' | 'radar' | 'ruler' | 'cone'; color?: string }> = ({
  type = 'loop',
  color = 'rgba(255, 255, 255, 0.7)'
}) => {
  if (type === 'loop') {
    return (
      <svg viewBox="0 0 200 120" className="w-full h-28 my-1 opacity-90 overflow-visible" fill="none">
        {[8, 16, 24, 32, 40, 48, 56].map((r, i) => (
          <ellipse
            key={`top-${i}`}
            cx="100"
            cy="38"
            rx={r * 1.3}
            ry={r * 0.45}
            stroke={color}
            strokeWidth="0.75"
            opacity={0.3 + (i * 0.1)}
          />
        ))}
        {[8, 16, 24, 32, 40, 48, 56].map((r, i) => (
          <ellipse
            key={`bot-${i}`}
            cx="100"
            cy="82"
            rx={r * 1.3}
            ry={r * 0.45}
            stroke={color}
            strokeWidth="0.75"
            opacity={0.3 + (i * 0.1)}
          />
        ))}
        <circle cx="100" cy="60" r="3.5" fill="#facc15" />
      </svg>
    );
  }

  if (type === 'cone') {
    return (
      <svg viewBox="0 0 100 100" className="w-24 h-24 mx-auto opacity-85" fill="none">
        {[10, 20, 30, 40, 50].map((r, i) => (
          <ellipse
            key={i}
            cx="50"
            cy={20 + i * 15}
            rx={r * 0.8}
            ry={r * 0.25}
            stroke={color}
            strokeWidth="0.8"
            opacity={0.4 + (i * 0.12)}
          />
        ))}
        <circle cx="50" cy="85" r="3" fill="#facc15" />
      </svg>
    );
  }

  if (type === 'wave') {
    return (
      <svg viewBox="0 0 200 80" className="w-full h-16 my-2 opacity-85" fill="none">
        <path
          d="M 10 40 Q 55 5, 100 40 T 190 40"
          stroke={color}
          strokeWidth="1.2"
        />
        <path
          d="M 10 40 Q 55 75, 100 40 T 190 40"
          stroke={color}
          strokeWidth="1.2"
        />
        <circle cx="170" cy="40" r="3.5" fill="#facc15" />
      </svg>
    );
  }

  if (type === 'radar') {
    return (
      <svg viewBox="0 0 100 100" className="w-20 h-20 opacity-85 mx-auto" fill="none">
        {[14, 26, 38].map((r, i) => (
          <circle key={i} cx="50" cy="50" r={r} stroke={color} strokeWidth="1" strokeDasharray={i === 2 ? '3 3' : 'none'} />
        ))}
        <circle cx="50" cy="50" r="4.5" fill="#facc15" />
      </svg>
    );
  }

  return (
    <div className="flex items-end justify-between w-full h-8 px-2 my-2 opacity-75">
      {Array.from({ length: 24 }).map((_, i) => {
        const isMajor = i % 4 === 0;
        return (
          <div
            key={i}
            style={{
              width: '1px',
              height: isMajor ? '20px' : '8px',
              backgroundColor: isMajor ? color : 'rgba(255,255,255,0.45)'
            }}
          />
        );
      })}
    </div>
  );
};

// =========================================================================
// 3. Precision Biomarker / Metric Card (Reference 2 Lower Grid)
// =========================================================================
export interface BiomarkerCardProps {
  title: string;
  category?: string;
  value: string | number;
  unit?: string;
  status?: string;
  statusColor?: 'emerald' | 'amber' | 'coral' | 'blue' | 'neutral';
  sparkline?: 'ruler' | 'dots' | 'wave';
}

export const BiomarkerCard: React.FC<BiomarkerCardProps> = ({
  title,
  category,
  value,
  unit,
  status,
  statusColor = 'emerald',
  sparkline = 'ruler'
}) => {
  const dotColorMap = {
    emerald: '#10b981',
    amber: '#f59e0b',
    coral: '#f43f5e',
    blue: '#3b82f6',
    neutral: '#9ca3af'
  };

  return (
    <div className="p-5 rounded-[22px] bg-[rgba(255,255,255,0.92)] border border-[rgba(0,0,0,0.06)] shadow-[0_12px_28px_-8px_rgba(0,0,0,0.03)] backdrop-blur-md flex flex-col justify-between transition-all hover:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.06)] hover:-translate-y-0.5">
      <div>
        <div className="flex items-center justify-between text-[11px] text-[#71717a] font-medium tracking-wider uppercase">
          <span className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: dotColorMap[statusColor] }}
            />
            {category || title}
          </span>
          {status && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{
                backgroundColor: `${dotColorMap[statusColor]}15`,
                color: dotColorMap[statusColor]
              }}
            >
              {status}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-1.5 mt-3">
          <span className="text-3xl font-light tracking-tight text-[#18181b]">{value}</span>
          {unit && <span className="text-xs text-[#a1a1aa] font-medium">{unit}</span>}
        </div>
      </div>

      {sparkline === 'ruler' && (
        <div className="flex items-end justify-between w-full h-5 mt-3 opacity-60">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '1.5px',
                height: i % 4 === 0 ? '14px' : '6px',
                backgroundColor: i === 9 ? dotColorMap[statusColor] : '#d4d4d8'
              }}
            />
          ))}
        </div>
      )}

      {sparkline === 'wave' && (
        <svg viewBox="0 0 100 24" className="w-full h-6 mt-3 opacity-70" fill="none">
          <path d="M 0 16 Q 25 2, 50 16 T 100 16" stroke={dotColorMap[statusColor]} strokeWidth="1.5" />
          <circle cx="80" cy="16" r="2.5" fill={dotColorMap[statusColor]} />
        </svg>
      )}

      {sparkline === 'dots' && (
        <div className="flex items-center gap-1.5 mt-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: i < 8 ? dotColorMap[statusColor] : '#e4e4e7' }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 4. Metric Display Object
// =========================================================================
export interface MetricDisplayProps {
  value: string | number;
  unit?: string;
  label: string;
  context?: string;
  status?: 'optimal' | 'moderate' | 'elevated' | 'neutral';
  trend?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
}

export const MetricDisplay: React.FC<MetricDisplayProps> = ({
  value,
  unit,
  label,
  context,
  status = 'neutral',
  trend,
  size = 'md'
}) => {
  const fontSizes = {
    sm: { val: '26px', unit: '11px', label: '10px' },
    md: { val: '38px', unit: '12px', label: '11px' },
    lg: { val: '54px', unit: '13px', label: '12px' },
    hero: { val: '72px', unit: '15px', label: '13px' }
  };

  const statusColors = {
    optimal: '#10b981',
    moderate: '#f59e0b',
    elevated: '#ef4444',
    neutral: '#71717a'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            fontSize: fontSizes[size].label,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 600,
            color: '#71717a'
          }}
        >
          {label}
        </span>
        {status !== 'neutral' && (
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: statusColors[status],
              boxShadow: `0 0 6px ${statusColors[status]}`
            }}
          />
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span
          style={{
            fontSize: fontSizes[size].val,
            fontWeight: 300,
            lineHeight: 1,
            color: 'inherit',
            letterSpacing: '-0.03em',
            fontFamily: 'inherit'
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            style={{
              fontSize: fontSizes[size].unit,
              fontWeight: 500,
              opacity: 0.75,
              letterSpacing: '0.04em'
            }}
          >
            {unit}
          </span>
        )}
      </div>

      {(context || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
          {trend && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: statusColors[status],
                backgroundColor: `${statusColors[status]}15`,
                padding: '2px 6px',
                borderRadius: '6px'
              }}
            >
              {trend}
            </span>
          )}
          {context && (
            <span style={{ fontSize: '11px', opacity: 0.8, fontWeight: 400 }}>
              {context}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 5. General Layout & Interactive Primitives
// =========================================================================
export const Card = AuraCard;
export const GlassPanel = AuraCard;

export interface TactileButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'subtle' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const TactileButton: React.FC<TactileButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 14px', fontSize: '12px', borderRadius: '9999px' },
    md: { padding: '10px 22px', fontSize: '13px', borderRadius: '9999px' },
    lg: { padding: '12px 28px', fontSize: '14px', borderRadius: '9999px' }
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#18181b',
      color: '#ffffff',
      boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
      border: 'none'
    },
    subtle: {
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      color: '#18181b',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      border: '1px solid rgba(0, 0, 0, 0.08)'
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#71717a',
      border: 'none'
    },
    danger: {
      backgroundColor: '#fee2e2',
      color: '#dc2626',
      border: '1px solid #fecaca'
    }
  };

  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.5 : 1,
        transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
        outline: 'none',
        fontFamily: 'inherit',
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style
      }}
      disabled={disabled || isLoading}
      className={className}
      {...props}
    >
      {isLoading ? 'Processing...' : children}
    </button>
  );
};

export const Button = TactileButton;

export interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const Pill: React.FC<PillProps> = ({ children, active = false, style, className = '', ...props }) => {
  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: active ? 600 : 500,
        backgroundColor: active ? '#ffffff' : 'transparent',
        color: active ? '#18181b' : '#71717a',
        border: 'none',
        boxShadow: active ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        outline: 'none',
        fontFamily: 'inherit',
        ...style
      }}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
};

export interface PillGroupProps extends HTMLAttributes<HTMLDivElement> {}

export const PillGroup: React.FC<PillGroupProps> = ({ children, style, className = '', ...props }) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px',
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
        borderRadius: '9999px',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        ...style
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
};

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, style, className = '', ...props }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '11px', fontWeight: 600, color: '#71717a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: '100%',
          padding: '12px 18px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: error ? '1px solid #ef4444' : '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '9999px',
          color: '#18181b',
          fontSize: '13px',
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
          ...style
        }}
        className={className}
        {...props}
      />
      {error && <span style={{ fontSize: '11px', color: '#ef4444' }}>{error}</span>}
    </div>
  );
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'amber' | 'coral' | 'blue' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', style, className = '', ...props }) => {
  const variantStyles = {
    emerald: { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669', border: 'rgba(16, 185, 129, 0.2)' },
    amber: { bg: 'rgba(245, 158, 11, 0.1)', text: '#d97706', border: 'rgba(245, 158, 11, 0.2)' },
    coral: { bg: 'rgba(244, 63, 94, 0.1)', text: '#e11d48', border: 'rgba(244, 63, 94, 0.2)' },
    blue: { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb', border: 'rgba(59, 130, 246, 0.2)' },
    neutral: { bg: 'rgba(0, 0, 0, 0.05)', text: '#71717a', border: 'rgba(0, 0, 0, 0.08)' }
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: variantStyles[variant].bg,
        color: variantStyles[variant].text,
        border: `1px solid ${variantStyles[variant].border}`,
        ...style
      }}
      className={className}
      {...props}
    >
      {children}
    </span>
  );
};
