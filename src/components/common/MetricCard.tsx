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

const COLOR_CLASSES: Record<MetricCardProps['colorScheme'], { iconBadge: string }> = {
  red: {
    iconBadge: 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20',
  },
  amber: {
    iconBadge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  green: {
    iconBadge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  blue: {
    iconBadge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  purple: {
    iconBadge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
};

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

  const colors = COLOR_CLASSES[colorScheme] || COLOR_CLASSES.blue;
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`group relative flex flex-col justify-between p-5 rounded-2xl text-left transition-all duration-200 outline-none overflow-hidden bg-white dark:bg-[#11161D] border border-slate-200 dark:border-[#1E293B] hover:bg-slate-50 dark:hover:bg-[#161D27] hover:border-slate-300 dark:hover:border-slate-700/80 hover:shadow-[0_0_24px_rgba(249,115,22,0.15)] hover:-translate-y-0.5 shadow-xs ${className}`}
      style={style}
    >
      {/* Top micro-highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-white/[0.08] to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
          {title}
        </span>
        <div 
          className={`p-2.5 rounded-xl border flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${colors.iconBadge}`}
        >
          <Icon size={16} strokeWidth={2} />
        </div>
      </div>

      {/* Main Stat & Trend */}
      <div className="flex items-baseline justify-between gap-2 flex-wrap mt-1">
        <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white leading-none tabular-nums">
          {loading ? '...' : value}
        </div>

        {trend && (
          <div 
            className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border tabular-nums ${
              isUp ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
              isDown ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
              'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
            }`}
          >
            {isUp && <TrendingUp size={12} strokeWidth={2.2} />}
            {isDown && <TrendingDown size={12} strokeWidth={2.2} />}
            <span>{trend}</span>
            {trendLabel && <span className="text-[10px] opacity-75 font-normal ml-0.5">{trendLabel}</span>}
          </div>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div className="text-xs text-slate-500 dark:text-slate-400 tracking-tight mt-2.5">
          {subtitle}
        </div>
      )}
    </Component>
  );
};

