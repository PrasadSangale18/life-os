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
  pageTitle = "Shift Radar",
  onSearchClick,
  onToggleSidebar,
  isMobile = false,
  user,
  children
}) => {
  const initials = user?.name
    ? user.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase()
    : 'PO';

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

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl bg-slate-100 dark:bg-[#131924] border border-slate-200 dark:border-dark-border text-slate-500 hover:text-orange-500 transition-colors cursor-pointer"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>


        {/* Quick Capture Button (Prahari Vivid Orange) */}
        {onQuickCapture && (
          <button
            type="button"
            onClick={onQuickCapture}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FF5A1F] hover:bg-[#EA580C] text-white text-xs font-bold shadow-[0_2px_12px_rgba(255,90,31,0.35)] transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Capture</span>
            <kbd className="hidden sm:inline-block bg-black/20 text-white/90 text-[10px] font-mono px-1 rounded ml-1">C</kbd>
          </button>
        )}

        {/* User Profile Menu */}
        {children ? (
          children
        ) : (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-dark-border">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 flex items-center justify-center font-bold text-xs shadow-xs">
              {initials}
            </div>
            <div className="hidden xl:block text-left">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white block leading-tight">
                {user?.name || "Personal OS"}
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
                Chief HSE Superintendent
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
