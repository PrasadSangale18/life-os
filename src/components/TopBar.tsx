import React, { useState } from 'react';
import { 
  Building2, 
  Sun, 
  Moon, 
  Bell, 
  Search, 
  Plus, 
  LayoutGrid, 
  List, 
  FolderKanban, 
  Inbox,
  X,
  Menu
} from 'lucide-react';

interface TopBarProps {
  currentView: 'matrix' | 'list' | 'projects' | 'inbox';
  onViewChange: (view: 'matrix' | 'list' | 'projects' | 'inbox') => void;
  inboxCount?: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onQuickCapture: () => void;
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
  inboxCount = 0,
  isDarkMode,
  onToggleDarkMode,
  onQuickCapture,
  pageTitle = "Notes for Task",
  onSearchClick,
  onToggleSidebar,
  isMobile = false,
  user,
  children
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState([
    { id: 1, title: 'Deep Work Block Scheduled', time: '10m ago', desc: 'Execution matrix: Focus on 2 Urgent tasks.', type: 'orange' },
    { id: 2, title: 'Weekly Review Pending', time: '2h ago', desc: '14 unorganized notes waiting in Inbox triage.', type: 'blue' }
  ]);

  const initials = user?.name
    ? user.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase()
    : 'PR';

  return (
    <header className="h-16 border-b border-slate-200/80 dark:border-dark-border bg-white/80 dark:bg-dark-sidebar/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors">
      {/* Left: Breadcrumb / Title & View Selector */}
      <div className="flex items-center gap-3 md:gap-5">
        {isMobile && onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 bg-white dark:bg-dark-card"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
        )}

        <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 whitespace-nowrap">
          {pageTitle}
        </h1>

        {/* Segmented View Switcher */}
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
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Quick Search */}
        <button 
          onClick={onSearchClick}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#131924] border border-slate-200 dark:border-dark-border text-xs text-slate-500 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
          <kbd className="text-[10px] font-mono bg-white dark:bg-slate-800 px-1 rounded border border-slate-200 dark:border-slate-700">⌘K</kbd>
        </button>

        {/* Prahari Enterprise Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-[#131924] border border-slate-200/90 dark:border-dark-border shadow-xs">
          <Building2 className="w-3.5 h-3.5 text-amber-500" />
          <div className="text-left leading-none">
            <span className="text-[10px] font-black tracking-wider text-slate-800 dark:text-slate-200 block uppercase">
              LIFE OS ENTERPRISE
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
              Autonomous Intelligence
            </span>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl bg-slate-100 dark:bg-[#131924] border border-slate-200 dark:border-dark-border text-slate-500 hover:text-orange-500 transition-colors cursor-pointer"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-[#131924] border border-slate-200 dark:border-dark-border text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors relative cursor-pointer"
            title="System Alerts"
          >
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {alerts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  System Alerts
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{alerts.length} Active</span>
              </div>
              <div className="mt-3 space-y-2">
                {alerts.map(a => (
                  <div key={a.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#161D2B] border border-slate-200/60 dark:border-slate-800 text-xs relative group">
                    <button
                      onClick={() => setAlerts(alerts.filter(x => x.id !== a.id))}
                      className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <p className="font-bold text-slate-800 dark:text-slate-200 pr-4">{a.title}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{a.desc}</p>
                    <span className="text-[9px] text-slate-400 font-mono mt-2 block">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Capture Button (Prahari Vivid Orange) */}
        <button
          onClick={onQuickCapture}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FF5A1F] hover:bg-[#EA580C] text-white text-xs font-bold shadow-[0_2px_12px_rgba(255,90,31,0.35)] transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Capture</span>
          <kbd className="hidden sm:inline-block bg-black/20 text-white/90 text-[10px] font-mono px-1 rounded ml-1">C</kbd>
        </button>

        {/* User Profile Pill */}
        {children ? (
          children
        ) : (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-dark-border">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 flex items-center justify-center font-bold text-xs shadow-xs">
              {initials}
            </div>
            <div className="hidden xl:block text-left">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white block leading-tight">
                {user?.name || "Prasad Sangale"}
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
                Life OS Executive
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
