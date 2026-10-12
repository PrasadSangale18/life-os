interface LifeOSLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: number;
  className?: string;
}

export const LifeOSLogo = ({ variant = 'full', size = 28, className }: LifeOSLogoProps) => {
  return (
    <div 
      className={className}
      style={{ 
        display: "inline-flex", 
        alignItems: "center", 
        gap: 10, 
        userSelect: "none" 
      }}
    >
      {/* Precision Vector Emblem (Nexus Shield of 5 Pillars) */}
      <div 
        style={{ 
          width: size, 
          height: size, 
          position: "relative", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          flexShrink: 0
        }}
      >
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 36 36" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="shieldGrad" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#b57bff" />
              <stop offset="0.5" stopColor="#4d9eff" />
              <stop offset="1" stopColor="#00d97e" />
            </linearGradient>
            <linearGradient id="innerCoreGrad" x1="10" y1="8" x2="26" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="1" stopColor="#f3e8ff" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glowGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#4d9eff" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Outer Protective Geometric Shield */}
          <path 
            d="M18 3L31 8.5V18.5C31 25.5 25.5 31.5 18 33.5C10.5 31.5 5 25.5 5 18.5V8.5L18 3Z" 
            fill="url(#shieldGrad)" 
            filter="url(#glowGlow)"
          />

          {/* Inner Precision Hexagonal Core (Adapts to Light & Dark theme) */}
          <path 
            d="M18 7.5L27 12V21L18 26.5L9 21V12L18 7.5Z" 
            fill="var(--bg-base, #07070f)" 
            stroke="var(--border-default, rgba(255,255,255,0.25))" 
            strokeWidth="1.2"
          />

          {/* 5-Pillar Orbital Convergence Nexus (Five authentic vibrant nodes) */}
          <circle cx="18" cy="11.5" r="1.6" fill="#00d97e" />
          <circle cx="23.5" cy="15.5" r="1.6" fill="#4d9eff" />
          <circle cx="21.5" cy="22" r="1.6" fill="#ff4d7e" />
          <circle cx="14.5" cy="22" r="1.6" fill="#b57bff" />
          <circle cx="12.5" cy="15.5" r="1.6" fill="#fbbf24" />

          {/* Radiant Core Star / Compass */}
          <path 
            d="M18 13.5L19.2 16.8L22.5 18L19.2 19.2L18 22.5L16.8 19.2L13.5 18L16.8 16.8L18 13.5Z" 
            fill="url(#innerCoreGrad)" 
          />
        </svg>
      </div>

      {variant !== 'icon' && (
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span 
              style={{ 
                fontFamily: "var(--font-serif)", 
                fontSize: 16, 
                fontWeight: 650, 
                letterSpacing: "0.02em", 
                color: "var(--text-primary)",
                lineHeight: 1.15
              }}
            >
              PRASAD
            </span>
            <span 
              style={{ 
                fontSize: 9, 
                fontWeight: 700, 
                padding: "1px 5px", 
                borderRadius: 4, 
                background: "rgba(77, 158, 255, 0.12)", 
                color: "#4d9eff", 
                border: "1px solid rgba(77, 158, 255, 0.25)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontFamily: "var(--font-mono)"
              }}
            >
              LIFE OS
            </span>
          </div>
          {variant === 'full' && (
            <span 
              className="text-label" 
              style={{ 
                fontFamily: "var(--font-mono)",
                fontSize: 7.5, 
                letterSpacing: "0.12em", 
                color: "var(--text-tertiary)", 
                marginTop: 2,
                fontWeight: 600
              }}
            >
              LIFE OPERATING SYSTEM
            </span>
          )}
        </div>
      )}
    </div>
  );
};
