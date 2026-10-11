export const FONT_URL = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@300;400;500;600&family=Outfit:wght@300;400;500;600;700&display=swap";

export const PILLARS = [
  { id: "physical",   name: "Physical",   subtitle: "The Foundation",       icon: "Flame",      color: "#00d97e", glow: "rgba(0,217,126,0.22)",  bg: "rgba(0,217,126,0.07)"  },
  { id: "mental",     name: "Mental",     subtitle: "The Operating System", icon: "Brain",      color: "#4d9eff", glow: "rgba(77,158,255,0.22)",  bg: "rgba(77,158,255,0.07)" },
  { id: "relational", name: "Relational", subtitle: "The Support Structure", icon: "Heart",      color: "#ff4d7e", glow: "rgba(255,77,126,0.22)",  bg: "rgba(255,77,126,0.07)" },
  { id: "spiritual",  name: "Spiritual",  subtitle: "The Compass",           icon: "Star",       color: "#b57bff", glow: "rgba(181,123,255,0.22)", bg: "rgba(181,123,255,0.07)"},
  { id: "financial",  name: "Financial",  subtitle: "The Amplifier",         icon: "TrendingUp", color: "#fbbf24", glow: "rgba(251,191,36,0.22)",  bg: "rgba(251,191,36,0.07)" },
] as const;

export const QUADRANTS = [
  { id: "do",       name: "DO",       label: "Urgent & Important",         hint: "Tackle immediately ⚡", color: "#00d97e", bg: "rgba(0,217,126,0.07)",  border: "rgba(0,217,126,0.22)"  },
  { id: "decide",   name: "DECIDE",   label: "Important, Not Urgent",      hint: "Schedule for later 📅", color: "#4d9eff", bg: "rgba(77,158,255,0.07)", border: "rgba(77,158,255,0.22)" },
  { id: "delegate", name: "DELEGATE", label: "Urgent, Not Important",      hint: "Assign to others 👥",   color: "#fbbf24", bg: "rgba(251,191,36,0.07)", border: "rgba(251,191,36,0.22)" },
  { id: "delete",   name: "DELETE",   label: "Not Urgent & Not Important", hint: "Eliminate entirely 🗑️", color: "#ff4d7e", bg: "rgba(255,77,126,0.07)", border: "rgba(255,77,126,0.22)" },
] as const;

export const NOTE_COLORS = [
  { id: "default", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)", label: "Default" },
  { id: "green",   bg: "rgba(0,217,126,0.08)",   border: "rgba(0,217,126,0.25)",   label: "Green"   },
  { id: "blue",    bg: "rgba(77,158,255,0.08)",  border: "rgba(77,158,255,0.25)",  label: "Blue"    },
  { id: "purple",  bg: "rgba(181,123,255,0.08)", border: "rgba(181,123,255,0.25)", label: "Purple"  },
  { id: "yellow",  bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.25)",  label: "Yellow"  },
  { id: "red",     bg: "rgba(255,77,126,0.08)",  border: "rgba(255,77,126,0.25)",  label: "Red"     },
] as const;

export const NOTE_CATEGORIES = ["All", "Study", "Career", "Health", "Ideas", "Personal", "Finance", "Other"] as const;

export type PillarId = typeof PILLARS[number]["id"];
export type QuadrantId = typeof QUADRANTS[number]["id"];
export type NoteColorId = typeof NOTE_COLORS[number]["id"];
