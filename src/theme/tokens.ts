export const FONT_URL = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@300;400;500;600&family=Outfit:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";

export const PILLARS = [
  { id: "physical",   name: "Physical",   subtitle: "The Foundation",       icon: "Flame",      color: "#00d97e", glow: "rgba(0,217,126,0.22)",  bg: "rgba(0,217,126,0.07)",  border: "rgba(0,217,126,0.22)"  },
  { id: "mental",     name: "Mental",     subtitle: "The Operating System", icon: "Brain",      color: "#4d9eff", glow: "rgba(77,158,255,0.22)",  bg: "rgba(77,158,255,0.07)", border: "rgba(77,158,255,0.22)" },
  { id: "relational", name: "Relational", subtitle: "The Support Structure", icon: "Heart",      color: "#ff4d7e", glow: "rgba(255,77,126,0.22)",  bg: "rgba(255,77,126,0.07)", border: "rgba(255,77,126,0.22)" },
  { id: "spiritual",  name: "Spiritual",  subtitle: "The Compass",           icon: "Star",       color: "#b57bff", glow: "rgba(181,123,255,0.22)", bg: "rgba(181,123,255,0.07)", border: "rgba(181,123,255,0.22)" },
  { id: "financial",  name: "Financial",  subtitle: "The Amplifier",         icon: "TrendingUp", color: "#fbbf24", glow: "rgba(251,191,36,0.22)",  bg: "rgba(251,191,36,0.07)",  border: "rgba(251,191,36,0.22)"  },
] as const;

export const QUADRANTS = [
  { id: "do",       name: "DO",       label: "Urgent & Important",         hint: "Tackle immediately", color: "#34D399", bg: "rgba(52,211,153,0.06)",  border: "rgba(52,211,153,0.22)"  },
  { id: "decide",   name: "DECIDE",   label: "Important, Not Urgent",      hint: "Schedule for later",  color: "#38BDF8", bg: "rgba(56,189,248,0.06)", border: "rgba(56,189,248,0.22)" },
  { id: "delegate", name: "DELEGATE", label: "Urgent, Not Important",      hint: "Assign to others",    color: "#FBBF24", bg: "rgba(251,191,36,0.06)", border: "rgba(251,191,36,0.22)" },
  { id: "delete",   name: "DELETE",   label: "Not Urgent & Not Important", hint: "Eliminate entirely",  color: "#FB7185", bg: "rgba(251,113,133,0.06)", border: "rgba(251,113,133,0.22)" },
] as const;

export const NOTE_COLORS = [
  { id: "default", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)", label: "Default" },
  { id: "green",   bg: "rgba(0,217,126,0.08)",  border: "rgba(0,217,126,0.25)",  label: "Emerald" },
  { id: "blue",    bg: "rgba(77,158,255,0.08)",  border: "rgba(77,158,255,0.25)",  label: "Sapphire" },
  { id: "purple",  bg: "rgba(181,123,255,0.08)", border: "rgba(181,123,255,0.25)", label: "Amethyst" },
  { id: "yellow",  bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.25)",  label: "Amber"   },
  { id: "red",     bg: "rgba(255,77,126,0.08)",  border: "rgba(255,77,126,0.25)",  label: "Rose"    },
] as const;

export const NOTE_CATEGORIES = ["All", "Study", "Career", "Health", "Ideas", "Personal", "Finance", "Other"] as const;

export const TYPOGRAPHY = {
  fontSans: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSerif: "'DM Serif Display', Georgia, serif",
  fontMono: "'IBM Plex Mono', 'JetBrains Mono', 'Geist Mono', ui-monospace, SFMono-Regular, monospace",
  scale: {
    pageTitle: { fontSize: '28px', fontWeight: 650, letterSpacing: '-0.025em', lineHeight: 1.2 },
    sectionHeading: { fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.3 },
    cardHeading: { fontSize: '15px', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.4 },
    body: { fontSize: '14px', fontWeight: 400, letterSpacing: '-0.005em', lineHeight: 1.5 },
    secondary: { fontSize: '13px', fontWeight: 400, letterSpacing: '0em', lineHeight: 1.45 },
    label: { fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' as const },
    button: { fontSize: '13px', fontWeight: 550, letterSpacing: '-0.005em' },
    meta: { fontSize: '12px', fontWeight: 450, letterSpacing: '0em', fontFeatureSettings: "'tnum'" },
  }
} as const;

export const THEME = {
  colors: {
    bgBase: '#f4f5f7',
    bgSubtle: '#ffffff',
    bgSurface: '#ffffff',
    bgSurfaceElevated: '#eceef2',
    bgSurfaceHover: '#f0f1f5',
    borderSubtle: 'rgba(0, 0, 0, 0.04)',
    borderDefault: 'rgba(0, 0, 0, 0.08)',
    borderStrong: 'rgba(0, 0, 0, 0.14)',
    borderFocus: '#181a20',
    textPrimary: '#181a20',
    textSecondary: '#717682',
    textTertiary: '#9ca0ac',
    textMuted: '#b8bac2',
    accentPrimary: '#181a20',
    accentHover: '#2e323d',
    accentBg: '#eceef2',
    accentBorder: 'rgba(0, 0, 0, 0.12)',
  }
} as const;

export type PillarId = typeof PILLARS[number]["id"];
export type QuadrantId = typeof QUADRANTS[number]["id"];
export type NoteColorId = typeof NOTE_COLORS[number]["id"];
