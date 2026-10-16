interface LifeOSLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: number;
  className?: string;
}

export const LifeOSLogo = ({ variant = 'full', size = 32, className }: LifeOSLogoProps) => {
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
      {/* Precision Vector Emblem: PRAHARI Shield */}
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
            <linearGradient id="prahariOrangeGrad" x1="4" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF6B2B" />
              <stop offset="1" stopColor="#E04F16" />
            </linearGradient>
            <filter id="prahariGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#FF5A1F" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Outer Protective Geometric Shield */}
          <path 
            d="M18 3.5L31 8.5V18.5C31 25.5 25.5 31.8 18 33.5C10.5 31.8 5 25.5 5 18.5V8.5L18 3.5Z" 
            stroke="url(#prahariOrangeGrad)" 
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="rgba(255, 90, 31, 0.08)"
            filter="url(#prahariGlow)"
          />

          {/* Inner Hexagonal Core */}
          <path 
            d="M18 9.5L25 13.5V20.5L18 24.5L11 20.5V13.5L18 9.5Z" 
            fill="rgba(255, 90, 31, 0.15)"
            stroke="#FF5A1F" 
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Center Precision Pillar Beacon */}
          <circle cx="18" cy="17" r="2.2" fill="#FF5A1F" />
        </svg>
      </div>

      {variant !== 'icon' && (
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span 
            style={{ 
              fontFamily: "var(--font-sans)", 
              fontSize: 16, 
              fontWeight: 800, 
              letterSpacing: "0.06em", 
              color: "var(--text-primary)",
              lineHeight: 1.15
            }}
          >
            LIFE OS
          </span>
          {variant === 'full' && (
            <span 
              style={{ 
                fontFamily: "var(--font-sans)",
                fontSize: 8, 
                letterSpacing: "0.14em", 
                color: "#FF5A1F", 
                marginTop: 2,
                fontWeight: 700,
                textTransform: "uppercase"
              }}
            >
              AUTONOMOUS INTELLIGENCE
            </span>
          )}
        </div>
      )}
    </div>
  );
};
