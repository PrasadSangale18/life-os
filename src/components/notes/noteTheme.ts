import type { NoteColorId } from '../../types';

export interface NoteColorConfig {
  id: NoteColorId | 'default';
  label: string;
  dotColor: string;
  // Light mode styles
  bgLight: string;
  borderLight: string;
  headerLight: string;
  // Dark mode styles
  bgDark: string;
  borderDark: string;
  headerDark: string;
  accent: string;
}

export const NOTE_COLOR_PALETTES: Record<string, NoteColorConfig> = {
  default: {
    id: 'default',
    label: 'Default',
    dotColor: '#64748b',
    bgLight: 'var(--bg-surface)',
    borderLight: 'var(--border-default)',
    headerLight: 'var(--bg-surface)',
    bgDark: 'var(--bg-surface)',
    borderDark: 'var(--border-default)',
    headerDark: 'var(--bg-surface)',
    accent: 'var(--accent-primary)',
  },
  yellow: {
    id: 'yellow',
    label: 'Amber Post-it',
    dotColor: '#f59e0b',
    bgLight: '#fffbeb',
    borderLight: '#fde68a',
    headerLight: '#fef3c7',
    bgDark: 'rgba(245, 158, 11, 0.08)',
    borderDark: 'rgba(245, 158, 11, 0.28)',
    headerDark: 'rgba(245, 158, 11, 0.14)',
    accent: '#f59e0b',
  },
  green: {
    id: 'green',
    label: 'Emerald Mint',
    dotColor: '#10b981',
    bgLight: '#f0fdf4',
    borderLight: '#bbf7d0',
    headerLight: '#dcfce7',
    bgDark: 'rgba(16, 185, 129, 0.08)',
    borderDark: 'rgba(16, 185, 129, 0.28)',
    headerDark: 'rgba(16, 185, 129, 0.14)',
    accent: '#10b981',
  },
  blue: {
    id: 'blue',
    label: 'Sky Cyan',
    dotColor: '#0ea5e9',
    bgLight: '#f0f9ff',
    borderLight: '#bae6fd',
    headerLight: '#e0f2fe',
    bgDark: 'rgba(14, 165, 233, 0.08)',
    borderDark: 'rgba(14, 165, 233, 0.28)',
    headerDark: 'rgba(14, 165, 233, 0.14)',
    accent: '#0ea5e9',
  },
  purple: {
    id: 'purple',
    label: 'Lavender Amethyst',
    dotColor: '#a855f7',
    bgLight: '#faf5ff',
    borderLight: '#e9d5ff',
    headerLight: '#f3e8ff',
    bgDark: 'rgba(168, 85, 247, 0.08)',
    borderDark: 'rgba(168, 85, 247, 0.28)',
    headerDark: 'rgba(168, 85, 247, 0.14)',
    accent: '#a855f7',
  },
  red: {
    id: 'red',
    label: 'Coral Rose',
    dotColor: '#f43f5e',
    bgLight: '#fff1f2',
    borderLight: '#fecdd3',
    headerLight: '#ffe4e6',
    bgDark: 'rgba(244, 63, 94, 0.08)',
    borderDark: 'rgba(244, 63, 94, 0.28)',
    headerDark: 'rgba(244, 63, 94, 0.14)',
    accent: '#f43f5e',
  },
};

export function getNoteCardStyle(colorId?: string) {
  const palette = NOTE_COLOR_PALETTES[colorId || 'default'] || NOTE_COLOR_PALETTES.default;
  return {
    palette,
    // CSS that dynamically adapts based on data-theme="dark" vs "light"
    light: {
      background: palette.bgLight,
      borderColor: palette.borderLight,
      headerBg: palette.headerLight,
    },
    dark: {
      background: palette.bgDark,
      borderColor: palette.borderDark,
      headerBg: palette.headerDark,
    }
  };
}
