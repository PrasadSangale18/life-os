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
      className={`btn-ghost ${className}`}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      style={{
        width: 32,
        height: 32,
        padding: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        border: isDark 
          ? "1px solid rgba(245, 158, 11, 0.25)" 
          : "1px solid var(--border-default)",
        background: isDark 
          ? "rgba(245, 158, 11, 0.08)" 
          : "var(--bg-surface)",
        color: isDark ? "#f59e0b" : "var(--text-secondary)",
        cursor: "pointer",
        transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: isDark 
          ? "0 0 12px rgba(245, 158, 11, 0.15)" 
          : "none",
        flexShrink: 0
      }}
      onMouseEnter={e => {
        if (isDark) {
          e.currentTarget.style.background = "rgba(245, 158, 11, 0.15)";
          e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.4)";
        } else {
          e.currentTarget.style.borderColor = "var(--border-strong)";
          e.currentTarget.style.color = "var(--text-primary)";
        }
      }}
      onMouseLeave={e => {
        if (isDark) {
          e.currentTarget.style.background = "rgba(245, 158, 11, 0.08)";
          e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.25)";
        } else {
          e.currentTarget.style.borderColor = "var(--border-default)";
          e.currentTarget.style.color = "var(--text-secondary)";
        }
      }}
    >
      {isDark ? (
        // Precision Sun icon matching media_1791716803328.png
        <Sun 
          size={16} 
          color="#f59e0b" 
          strokeWidth={2.2} 
        />
      ) : (
        // Clean Moon icon matching Prahari dashboard
        <Moon 
          size={16} 
          color="var(--text-secondary)" 
          strokeWidth={1.8} 
        />
      )}
    </button>
  );
};
