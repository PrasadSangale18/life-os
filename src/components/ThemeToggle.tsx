import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
  className?: string;
}

export const ThemeToggle = ({ theme, onToggle, className = '' }: ThemeToggleProps) => {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`group w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#131924] border border-slate-200 dark:border-dark-border text-slate-500 hover:text-amber-400 dark:text-slate-400 dark:hover:text-amber-400 hover:border-amber-400/40 dark:hover:border-amber-400/40 hover:bg-amber-400/10 dark:hover:bg-amber-400/10 hover:shadow-[0_0_14px_rgba(245,158,11,0.22)] transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0 ${className}`}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      title="Toggle Theme"
    >
      {isDark ? (
        <Sun 
          className="w-4 h-4 text-slate-400 dark:text-slate-400 transition-all duration-200 group-hover:text-amber-400 group-hover:scale-110 group-hover:rotate-12 group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" 
          strokeWidth={2}
        />
      ) : (
        <Moon 
          className="w-4 h-4 text-slate-500 transition-all duration-200 group-hover:text-indigo-600 group-hover:scale-110 group-hover:drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]" 
          strokeWidth={2}
        />
      )}
    </button>
  );
};
