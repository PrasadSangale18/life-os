import React from 'react';
import { Menu } from 'lucide-react';

interface SidebarToggleButtonProps {
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isOpen?: boolean;
  isPinned?: boolean;
  className?: string;
  tooltipSide?: 'bottom' | 'right';
  ariaLabel?: string;
  variant?: 'auto' | 'menu' | 'panel';
}

export const SidebarToggleButton: React.FC<SidebarToggleButtonProps> = ({
  onClick,
  onMouseEnter,
  onMouseLeave,
  className = '',
  ariaLabel = 'Toggle navigation',
  variant = 'auto'
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={ariaLabel}
      className={`p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161D27] border border-transparent hover:border-slate-200 dark:hover:border-[#1E293B] transition-all active:scale-95 flex items-center justify-center cursor-pointer ${className}`}
    >
      {/* Mobile: 3 horizontal lines (Classic Hamburger Menu) */}
      {(variant === 'auto' || variant === 'menu') && (
        <Menu 
          className={`w-5 h-5 ${variant === 'auto' ? 'block lg:hidden' : ''}`} 
          strokeWidth={2.2} 
        />
      )}

      {/* Desktop: Slide / Split-Panel Toggle Icon */}
      {(variant === 'auto' || variant === 'panel') && (
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={`${variant === 'auto' ? 'hidden lg:block' : ''} transition-transform duration-200`}
        >
          <rect width="18" height="18" x="3" y="3" rx="4" />
          <path d="M9 3v18" />
        </svg>
      )}
    </button>
  );
};
