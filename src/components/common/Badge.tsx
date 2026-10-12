import React from 'react';

export type BadgeType = 'priority' | 'quadrant' | 'pillar' | 'type' | 'status' | 'neutral';

interface BadgeProps {
  type?: BadgeType;
  value: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({ 
  type = 'neutral', 
  value, 
  size = 'md', 
  pulse = false,
  className = '',
  style 
}) => {
  const sizeStyles: Record<'sm' | 'md' | 'lg', React.CSSProperties> = {
    sm: { padding: '2px 6px', fontSize: 10, fontWeight: 600, borderRadius: 5, letterSpacing: '0.04em' },
    md: { padding: '3px 8px', fontSize: 11, fontWeight: 650, borderRadius: 6, letterSpacing: '0.03em' },
    lg: { padding: '5px 12px', fontSize: 12, fontWeight: 700, borderRadius: 8, letterSpacing: '0.03em' }
  };

  const getStyleTheme = (): { bg: string; text: string; border: string; dot?: string } => {
    const v = value.toLowerCase().trim();

    // Priority Styling (inspired by Prahari SIF/Risk badges)
    if (type === 'priority' || ['critical', 'high', 'normal', 'medium', 'low'].includes(v)) {
      if (v === 'critical') {
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          text: '#ef4444',
          border: 'rgba(239, 68, 68, 0.28)',
          dot: '#ef4444'
        };
      }
      if (v === 'high') {
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          text: '#f59e0b',
          border: 'rgba(245, 158, 11, 0.28)',
          dot: '#f59e0b'
        };
      }
      if (v === 'normal' || v === 'medium') {
        return {
          bg: 'rgba(59, 130, 246, 0.12)',
          text: '#3b82f6',
          border: 'rgba(59, 130, 246, 0.25)',
          dot: '#3b82f6'
        };
      }
      return {
        bg: 'rgba(16, 185, 129, 0.12)',
        text: '#10b981',
        border: 'rgba(16, 185, 129, 0.25)',
        dot: '#10b981'
      };
    }

    // Quadrant Styling
    if (type === 'quadrant' || ['do', 'decide', 'delegate', 'delete'].includes(v)) {
      if (v === 'do') {
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          text: '#ef4444',
          border: 'rgba(239, 68, 68, 0.3)',
          dot: '#ef4444'
        };
      }
      if (v === 'decide') {
        return {
          bg: 'rgba(59, 130, 246, 0.12)',
          text: '#3b82f6',
          border: 'rgba(59, 130, 246, 0.3)',
          dot: '#3b82f6'
        };
      }
      if (v === 'delegate') {
        return {
          bg: 'rgba(168, 85, 247, 0.12)',
          text: '#a855f7',
          border: 'rgba(168, 85, 247, 0.3)',
          dot: '#a855f7'
        };
      }
      return {
        bg: 'rgba(245, 158, 11, 0.12)',
        text: '#f59e0b',
        border: 'rgba(245, 158, 11, 0.3)',
        dot: '#f59e0b'
      };
    }

    // Pillar Styling
    if (type === 'pillar' || ['physical', 'mental', 'relational', 'spiritual', 'financial'].includes(v)) {
      if (v === 'physical') {
        return { bg: 'rgba(249, 115, 22, 0.12)', text: '#f97316', border: 'rgba(249, 115, 22, 0.28)', dot: '#f97316' };
      }
      if (v === 'mental') {
        return { bg: 'rgba(139, 92, 246, 0.12)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.28)', dot: '#8b5cf6' };
      }
      if (v === 'relational') {
        return { bg: 'rgba(244, 63, 94, 0.12)', text: '#f43f5e', border: 'rgba(244, 63, 94, 0.28)', dot: '#f43f5e' };
      }
      if (v === 'spiritual') {
        return { bg: 'rgba(234, 179, 8, 0.12)', text: '#eab308', border: 'rgba(234, 179, 8, 0.28)', dot: '#eab308' };
      }
      return { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.28)', dot: '#10b981' };
    }

    // Type Styling
    if (type === 'type' || ['task', 'note', 'idea', 'goal', 'project', 'journal'].includes(v)) {
      if (v === 'task') return { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.25)', dot: '#3b82f6' };
      if (v === 'idea') return { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)', dot: '#f59e0b' };
      if (v === 'note') return { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.25)', dot: '#10b981' };
      if (v === 'goal') return { bg: 'rgba(236, 72, 153, 0.12)', text: '#ec4899', border: 'rgba(236, 72, 153, 0.25)', dot: '#ec4899' };
      if (v === 'project') return { bg: 'rgba(139, 92, 246, 0.12)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.25)', dot: '#8b5cf6' };
    }

    return {
      bg: 'var(--bg-surface-elevated, #f1f2f6)',
      text: 'var(--text-secondary, #717682)',
      border: 'var(--border-default, #e4e6eb)'
    };
  };

  const themeStyle = getStyleTheme();
  const shouldPulse = pulse || (value.toLowerCase() === 'critical' || value.toLowerCase() === 'do');

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        backgroundColor: themeStyle.bg,
        color: themeStyle.text,
        border: `1px solid ${themeStyle.border}`,
        textTransform: 'uppercase',
        fontFamily: 'var(--font-mono, monospace)',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...sizeStyles[size],
        ...style
      }}
    >
      {themeStyle.dot && (
        <span 
          style={{
            width: size === 'sm' ? 5 : 6,
            height: size === 'sm' ? 5 : 6,
            borderRadius: '50%',
            backgroundColor: themeStyle.dot,
            flexShrink: 0,
            animation: shouldPulse ? 'softPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
          }} 
        />
      )}
      <span>{value}</span>
    </span>
  );
};
