import React from 'react';
import { 
  Sun, 
  Moon, 
  Search, 
  Plus, 
  LayoutGrid, 
  List, 
  FolderKanban, 
  Inbox,
  Menu,
  Sparkles
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
  onQuickCapture,
  onOpenPromptWise,
  onOpenCopilot,
  pageTitle = "Shift Radar",
  onSearchClick,
  onToggleSidebar,
  isMobile = false,
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
    <header className="h-16 border-b border-slate-200/80 dark:border-dark-border bg-white/80 dark:bg-dark-sidebar/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors">
      {/* Left: Breadcrumb / Title & View Selector */}
      <div className="flex items-center gap-3 md:gap-5">
        {isMobile && onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 bg-white dark:bg-dark-card cursor-pointer"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
        )}

        <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 whitespace-nowrap">
          {pageTitle}
        </h1>

        {/* Segmented View Switcher */}
        {showViewSwitcher && (
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-[#131924] p-1 rounded-xl border border-slate-200/60 dark:border-dark-border">
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
                      ? 'bg-white dark:bg-[#1E2638] text-slate-900 dark:text-white shadow-xs'
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

      {/* Center: Tracked L I F E   O S Wordmark (Inspired by Prahari high-tech minimalism) */}
      <div className="hidden lg:flex items-center justify-center pointer-events-none select-none">
        <span className="font-mono font-black text-xs md:text-sm tracking-[0.42em] text-slate-800 dark:text-white uppercase pl-2">
          L I F E &nbsp; O S
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Quick Search */}
        <button 
          type="button"
          onClick={onSearchClick}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#131924] border border-slate-200 dark:border-dark-border text-xs text-slate-500 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
          <kbd className="text-[10px] font-mono bg-white dark:bg-slate-800 px-1 rounded border border-slate-200 dark:border-slate-700">⌘K</kbd>
        </button>

        {/* AI Productivity Studio / Copilot */}
        {(onOpenCopilot || onOpenPromptWise) && (
          <button
            type="button"
            onClick={onOpenCopilot || onOpenPromptWise}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 dark:border-orange-500/40 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 shadow-xs"
            title="Prahari AI Copilot"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
            <span className="hidden sm:inline">AI Studio</span>
          </button>
        )}

        {/* Theme Toggle Circle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="group w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#131924] border border-slate-200 dark:border-dark-border text-slate-500 hover:text-amber-400 dark:text-slate-400 dark:hover:text-amber-400 hover:border-amber-400/40 dark:hover:border-amber-400/40 hover:bg-amber-400/10 dark:hover:bg-amber-400/10 transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0"
          title="Toggle Theme"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-slate-400 transition-all duration-200 group-hover:text-amber-400 group-hover:scale-110" />
          ) : (
            <Moon className="w-4 h-4 text-slate-500 transition-all duration-200 group-hover:text-indigo-600 group-hover:scale-110" />
          )}
        </button>

        {/* Notification Bell with Badge (Matching Prahari Reference) */}
        <div className="relative">
          <button
            type="button"
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#131924] border border-slate-200 dark:border-dark-border text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center shrink-0"
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

        {/* Quick Capture Button (Prahari Vivid Orange) */}
        {onQuickCapture && (
          <button
            type="button"
            onClick={onQuickCapture}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF5A1F] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white text-xs font-bold shadow-[0_2px_12px_rgba(255,90,31,0.35)] transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Capture</span>
            <kbd className="hidden md:inline-block bg-black/20 text-white/90 text-[10px] font-mono px-1 rounded ml-1">C</kbd>
          </button>
        )}

        {/* Organization / Profile Badge (OIL INDIA LIMITED matching Prahari) */}
        {children ? (
          children
        ) : (
          <div className="hidden sm:flex items-center gap-2 pl-1">
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#131924] border border-slate-200 dark:border-white/[0.1] text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono shadow-xs">
              EXECUTIVE WORKSPACE
            </span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF5A1F] to-[#EA580C] text-white flex items-center justify-center font-bold text-xs shadow-xs font-mono">
              {initials}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
