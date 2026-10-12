import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  icon: LucideIcon;
  colorScheme: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  subtitle?: string;
  trendLabel?: string;
  onClick?: () => void;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  icon: Icon,
  colorScheme,
  subtitle,
  trendLabel,
  onClick,
  loading = false,
  className = '',
  style
}) => {
  const isUp = trend?.startsWith('+');
  const isDown = trend?.startsWith('-');

  const themeColors = {
    red: {
      border: 'rgba(244, 63, 94, 0.25)',
      hoverBorder: 'rgba(244, 63, 94, 0.5)',
      iconBg: 'rgba(244, 63, 94, 0.12)',
      iconColor: '#FB7185',
      glow: '0 0 24px rgba(244, 63, 94, 0.15)',
      valueColor: '#FB7185',
    },
    amber: {
      border: 'rgba(251, 191, 36, 0.25)',
      hoverBorder: 'rgba(251, 191, 36, 0.5)',
      iconBg: 'rgba(251, 191, 36, 0.12)',
      iconColor: '#FBBF24',
      glow: '0 0 24px rgba(251, 191, 36, 0.15)',
      valueColor: '#FBBF24',
    },
    green: {
      border: 'rgba(52, 211, 153, 0.25)',
      hoverBorder: 'rgba(52, 211, 153, 0.5)',
      iconBg: 'rgba(52, 211, 153, 0.12)',
      iconColor: '#34D399',
      glow: '0 0 24px rgba(52, 211, 153, 0.15)',
      valueColor: '#34D399',
    },
    blue: {
      border: 'rgba(56, 189, 248, 0.25)',
      hoverBorder: 'rgba(56, 189, 248, 0.5)',
      iconBg: 'rgba(56, 189, 248, 0.12)',
      iconColor: '#38BDF8',
      glow: '0 0 24px rgba(56, 189, 248, 0.15)',
      valueColor: '#38BDF8',
    },
    purple: {
      border: 'rgba(168, 85, 247, 0.25)',
      hoverBorder: 'rgba(168, 85, 247, 0.5)',
      iconBg: 'rgba(168, 85, 247, 0.12)',
      iconColor: '#C084FC',
      glow: '0 0 24px rgba(168, 85, 247, 0.15)',
      valueColor: '#C084FC',
    }
  }[colorScheme];

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`group relative flex flex-col justify-between p-4 rounded-xl text-left transition-all duration-200 outline-none overflow-hidden bg-white dark:bg-[#0D1117]/85 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-slate-300 dark:hover:border-white/[0.18] hover:-translate-y-[1px] hover:shadow-xl ${className}`}
      style={{
        ...style
      }}
    >
      {/* Inner surface elevation top highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-slate-200/60 dark:via-white/[0.08] to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
          {title}
        </span>
        <div 
          className="w-7 h-7 rounded-lg flex items-center justify-center border transition-transform duration-200 group-hover:scale-105"
          style={{
            backgroundColor: themeColors.iconBg,
            color: themeColors.iconColor,
            borderColor: themeColors.border
          }}
        >
          <Icon size={14} strokeWidth={1.75} />
        </div>
      </div>

      {/* Main Stat & Trend */}
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-[#F8FAFC] leading-none tabular-nums">
          {loading ? '...' : value}
        </div>

        {trend && (
          <div 
            className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded border tabular-nums ${
              isUp ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' :
              isDown ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30' :
              'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.06]'
            }`}
          >
            {isUp && <TrendingUp size={11} strokeWidth={1.75} />}
            {isDown && <TrendingDown size={11} strokeWidth={1.75} />}
            <span>{trend}</span>
            {trendLabel && <span className="text-[9.5px] opacity-75 font-normal">{trendLabel}</span>}
          </div>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div className="text-[11px] text-slate-500 dark:text-slate-400 tracking-tight mt-1.5">
          {subtitle}
        </div>
      )}
    </Component>
  );
};
