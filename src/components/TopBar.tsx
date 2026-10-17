import React from 'react';
import { 
  Sun, 
  Moon, 
  LayoutGrid, 
  List, 
  FolderKanban, 
  Inbox,
  PanelLeft,
  PanelLeftClose,
  Menu
} from 'lucide-react';

interface TopBarProps {
  currentView: 'matrix' | 'list' | 'projects' | 'inbox';
  onViewChange: (view: 'matrix' | 'list' | 'projects' | 'inbox') => void;
  showViewSwitcher?: boolean;
  inboxCount?: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onQuickCapture?: () => void;
  onOpenPromptWise?: () => void;
  onOpenCopilot?: () => void;
  pageTitle?: string;
  onSearchClick?: () => void;
  onToggleSidebar?: () => void;
  onMenuToggle?: () => void;
  onDesktopMenuToggle?: () => void;
  onDesktopMouseEnter?: () => void;
  onDesktopMouseLeave?: () => void;
  isDesktopOpen?: boolean;
  isPinned?: boolean;
  isMobile?: boolean;
  user?: { name: string; email: string } | null;
  children?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onViewChange,
  showViewSwitcher = true,
  inboxCount = 0,
  isDarkMode,
  onToggleDarkMode,
  pageTitle = "Shift Radar",
  onToggleSidebar,
  onMenuToggle,
  onDesktopMenuToggle,
  onDesktopMouseEnter,
  onDesktopMouseLeave,
  isDesktopOpen,
  isPinned,
  user,
  children
}) => {
  const getInitials = (name?: string) => {
    if (!name) return 'PR';
    const trimmed = name.trim();
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase() || 'PR';
  };
  const initials = getInitials(user?.name);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/70 dark:bg-[#05080C]/70 backdrop-blur-xl border-b border-slate-200 dark:border-[#1E293B] px-3 sm:px-4 md:px-8 flex items-center justify-between transition-colors">
      {/* Left: Sidebar Toggle + Page Title & View Selector */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Toggle Button (Clean 3 horizontal lines, borderless matching Prahari) */}
        {(onMenuToggle || onToggleSidebar) && (
          <button
            type="button"
            onClick={onMenuToggle || onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161D27] border border-transparent transition-all active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Toggle navigation drawer"
            title="Toggle Navigation"
          >
            <Menu size={20} strokeWidth={2.2} />
          </button>
        )}

        {/* Desktop Toggle Button (Peek-on-hover & Pin) */}
        {(onDesktopMenuToggle || onToggleSidebar) && (
          <button
            type="button"
            onClick={onDesktopMenuToggle || onToggleSidebar}
            onMouseEnter={onDesktopMouseEnter}
            onMouseLeave={onDesktopMouseLeave}
            className={`hidden lg:flex w-9 h-9 rounded-xl border transition-all items-center justify-center shrink-0 group relative cursor-pointer ${
              isDesktopOpen
                ? 'bg-slate-100 dark:bg-[#161D27] border-orange-500/30 text-orange-500'
                : 'border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#11161D] hover:bg-slate-100 dark:hover:bg-[#161D27]'
            }`}
            title={isPinned ? 'Collapse sidebar (Ctrl+Shift+S)' : 'Pin sidebar open (Ctrl+Shift+S)'}
          >
            {isPinned ? (
              <PanelLeftClose size={17} strokeWidth={2.2} className="text-[#FF5A1F]" />
            ) : (
              <PanelLeft size={17} strokeWidth={2.2} className={isDesktopOpen ? 'text-[#FF5A1F]' : 'group-hover:text-[#FF5A1F] transition-colors'} />
            )}
          </button>
        )}

        {/* Page Title - Hidden on mobile to prevent collision with centered brand wordmark */}
        <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight hidden md:flex items-center gap-2 whitespace-nowrap">
          {pageTitle}
        </h1>

        {/* Segmented View Switcher (when tasks view) */}
        {showViewSwitcher && (
          <div className="hidden xl:flex items-center bg-slate-100 dark:bg-[#11161D] p-1 rounded-xl border border-slate-200/80 dark:border-[#1E293B]">
            {[
              { id: 'matrix', label: 'Matrix', icon: LayoutGrid },
              { id: 'list', label: 'List', icon: List },
              { id: 'projects', label: 'Projects', icon: FolderKanban },
              { id: 'inbox', label: 'Inbox', icon: Inbox, badge: inboxCount }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = currentView === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onViewChange(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-[#161D27] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive 
                        ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Center: Absolute Centered Brand Title (Exact PRAHARI Spacing) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none text-center">
        <span className="text-base sm:text-lg md:text-xl font-black tracking-[0.35em] text-slate-900 dark:text-white uppercase font-mono">
          SANKALP
        </span>
      </div>

      {/* Right Controls: Exact PRAHARI 3-item layout (Theme toggle, Bell badge, Profile pill) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-[#11161D] border border-slate-200 dark:border-[#1E293B] text-slate-400 hover:text-orange-400 dark:hover:text-orange-400 hover:border-orange-500/30 transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0"
          title="Toggle Theme"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-amber-400 transition-all duration-200 hover:scale-110" />
          ) : (
            <Moon className="w-4 h-4 text-slate-500 transition-all duration-200 hover:scale-110" />
          )}
        </button>

        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            type="button"
            className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-[#11161D] border border-slate-200 dark:border-[#1E293B] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center shrink-0"
            title="12 Active Notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
          </button>
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#EF4444] text-white shadow-xs font-mono">
            12
          </span>
        </div>

        {/* Organization / Profile Badge - Hidden on mobile so right controls don't crowd center title */}
        <div className="hidden sm:flex items-center">
          {children ? (
            children
          ) : (
            <div className="flex items-center gap-2 pl-1">
              <span className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-[#11161D] border border-slate-200 dark:border-[#1E293B] text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono shadow-xs">
                SANKALP WORKSPACE
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs font-mono">
                {initials}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
