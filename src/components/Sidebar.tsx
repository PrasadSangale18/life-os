import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckSquare, 
  BookOpen, 
  Sparkles, 
  LayoutDashboard, 
  Compass,
  Flame,
  Calendar,
  Clock,
  FolderKanban,
  Target,
  BarChart3,
  Zap,
  Cpu,
  X,
  ChevronDown,
  Settings as SettingsIcon,
  LogOut,
  Building2
} from 'lucide-react';
import { SidebarToggleButton } from './SidebarToggleButton';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;            // Mobile open state
  isDesktopOpen: boolean;     // Desktop (pinned || hovered) state
  isPinned?: boolean;
  onDesktopToggle?: () => void;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  notesCount?: number;
  completedCount?: number;
  totalCount?: number;
  isMobile?: boolean;
  user?: { name: string; email: string; role?: string } | null;
  onSignOut?: () => void;
}

interface NavItem {
  id: string;
  name: string;
  icon: any;
  count?: number;
  badge?: string;
}

interface NavGroup {
  category: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isOpen,
  isDesktopOpen,
  isPinned = false,
  onDesktopToggle,
  onClose,
  onMouseEnter,
  onMouseLeave,
  notesCount = 0,
  completedCount = 0,
  totalCount = 0,
  isMobile = false,
  user,
  onSignOut
}) => {
  const pendingCount = Math.max(totalCount - completedCount, 0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navGroups: NavGroup[] = [
    {
      category: 'CONTROL ROOM',
      items: [
        { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { id: 'tasks', name: 'Tasks & Matrix', icon: CheckSquare, count: pendingCount > 0 ? pendingCount : undefined },
        { id: 'calendar', name: 'Calendar & Schedule', icon: Calendar },
        { id: 'focus', name: 'Focus Timer', icon: Clock }
      ]
    },
    {
      category: 'KNOWLEDGE & WORKSPACE',
      items: [
        { id: 'notes', name: 'Notes & Knowledge', icon: BookOpen, count: notesCount > 0 ? notesCount : undefined },
        { id: 'projects', name: 'Projects & Kanban', icon: FolderKanban },
        { id: 'goals', name: 'Goals & Milestones', icon: Target },
        { id: 'mindmap', name: 'Canvas & Graph', icon: Compass }
      ]
    },
    {
      category: 'MOMENTUM & REFLECTION',
      items: [
        { id: 'habits', name: 'Habits & Routines', icon: Flame },
        { id: 'journal', name: 'Daily Journal', icon: Sparkles },
        { id: 'analytics', name: 'Productivity Analytics', icon: BarChart3 }
      ]
    },
    {
      category: 'INTELLIGENCE',
      items: [
        { id: 'assistant', name: 'AI Copilot', icon: Zap, badge: 'PRO' },
        { id: 'organizer', name: 'Smart AI Organizer', icon: Cpu, badge: 'AI' }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sliding Navigation Container */}
      <aside
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white/95 lg:bg-white/90 dark:bg-[#0A0E14]/95 lg:dark:bg-[#0A0E14]/90 backdrop-blur-xl border-r border-slate-200 dark:border-[#1E293B] flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDesktopOpen ? 'lg:translate-x-0 shadow-2xl' : 'lg:-translate-x-full'}`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar">
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200/80 dark:border-[#1E293B] bg-transparent shrink-0">
            <button 
              type="button"
              onClick={() => {
                onTabChange('today');
                if (onClose) onClose();
              }}
              className="flex items-center gap-3 group text-left cursor-pointer transition-transform"
            >
              <div className="relative flex items-center justify-center">
                <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform group-hover:scale-105 transition-transform duration-300 drop-shadow-md group-hover:drop-shadow-[0_0_12px_rgba(249,115,22,0.6)] shrink-0">
                  <defs>
                    <linearGradient id="sankalpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF5A1F" />
                      <stop offset="100%" stopColor="#EA580C" />
                    </linearGradient>
                  </defs>
                  {/* Outer Shield / Emblem */}
                  <path d="M20 3L35 9.5V22C35 29.5 28.5 35 20 37C11.5 35 5 29.5 5 22V9.5L20 3Z" fill="url(#sankalpGrad)" />
                  {/* Inner Cutout (adaptive to sidebar) */}
                  <path d="M20 7L31 11.5V21.5C31 27.5 26 31.5 20 33C14 31.5 9 27.5 9 21.5V11.5L20 7Z" className="fill-white dark:fill-[#080C14] transition-colors" />
                  {/* Central Core Shield */}
                  <path d="M20 11L26 13.5V20.5C26 24.5 23.5 27.5 20 29C16.5 27.5 14 24.5 14 20.5V13.5L20 11Z" fill="url(#sankalpGrad)" />
                  {/* Inner detail (White / Dark mode adaptive) */}
                  <circle cx="20" cy="18" r="2.5" className="fill-white dark:fill-slate-900 transition-colors" />
                  <path d="M20 23V25" className="stroke-white dark:stroke-slate-900 transition-colors" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-extrabold tracking-wider text-slate-900 dark:text-white font-mono block leading-tight uppercase group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
                  SANKALP
                </span>
                <span className="text-[10px] text-orange-500 dark:text-orange-400 font-medium tracking-tight block uppercase">
                  Autonomous Life OS
                </span>
              </div>
            </button>

            <div className="flex items-center gap-1">
              {onDesktopToggle && (
                <div className="hidden lg:flex">
                  <SidebarToggleButton 
                    onClick={onDesktopToggle} 
                    isOpen={isDesktopOpen} 
                    isPinned={isPinned}
                    variant="panel"
                    ariaLabel={isPinned ? "Collapse sidebar (Ctrl+Shift+S)" : "Pin sidebar (Ctrl+Shift+S)"}
                  />
                </div>
              )}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="lg:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close Mobile Navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Categorized Navigation Groups - Clean, spacious single-line SaaS standard */}
          <nav className="px-3 py-3 space-y-4 flex-1">
            {navGroups.map((group) => (
              <div key={group.category} className="space-y-1">
                <div className="px-3 py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                    {group.category}
                  </span>
                </div>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onTabChange(item.id);
                          if (isMobile && onClose) onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                          isActive
                            ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                        }`}
                      >
                        <Icon className={`w-4 h-4 transition-colors shrink-0 ${
                          isActive ? 'text-orange-500 dark:text-orange-400' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                        }`} />
                        <span className="flex-1 text-left truncate">{item.name}</span>
                        {item.count !== undefined && (
                          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 tabular-nums">
                            {item.count}
                          </span>
                        )}
                        {item.badge && (
                          <span className="text-[9px] font-bold tracking-tight px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User Profile Footer (Exact Prahari / Linear Standard) */}
        <div className="p-3 border-t border-slate-200 dark:border-[#1E293B] bg-slate-50/60 dark:bg-[#0c1017]/80 relative shrink-0" ref={userMenuRef}>
          {/* Popover Menu (Upward) */}
          {showUserMenu && (
            <div className="absolute bottom-full left-3 right-3 mb-2 rounded-2xl bg-white dark:bg-[#11161D] border border-slate-200 dark:border-[#1E293B] shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              {/* User Bio Header */}
              <div className="p-2.5 flex items-center gap-2.5 border-b border-slate-200 dark:border-[#1E293B]">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-inner shrink-0">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'PR'}
                </div>
                <div className="text-left overflow-hidden min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight mb-0.5 truncate">
                    {user?.name || 'Prasad Sangale'}
                  </p>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1 truncate">
                    {user?.email || 'prasad@aisankalp.app'}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                    <Building2 className="w-2.5 h-2.5 text-blue-500/70" /> LIFE OS PRO
                  </span>
                </div>
              </div>

              {/* Menu Actions */}
              <div className="p-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    onTabChange('settings');
                    setShowUserMenu(false);
                    if (isMobile && onClose) onClose();
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2.5 group cursor-pointer"
                >
                  <SettingsIcon className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
                  <span>Settings & Preferences</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onTabChange('analytics');
                    setShowUserMenu(false);
                    if (isMobile && onClose) onClose();
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2.5 group cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
                  <span>Productivity Analytics</span>
                </button>

                <div className="h-px bg-slate-200 dark:bg-[#1E293B] my-1 mx-1" />

                <button
                  type="button"
                  onClick={() => {
                    if (onSignOut) onSignOut();
                    setShowUserMenu(false);
                    if (isMobile && onClose) onClose();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex items-center gap-2.5 group cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-500/70 group-hover:text-red-500 transition-colors" />
                  <span>Reset / Clear Session</span>
                </button>
              </div>
            </div>
          )}

          {/* Trigger Profile Pill */}
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all group cursor-pointer ${
              showUserMenu 
                ? 'bg-slate-200/70 dark:bg-[#1E293B] shadow-xs' 
                : 'hover:bg-slate-200/50 dark:hover:bg-[#1E293B]/70'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-600/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/40 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'PR'}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight truncate group-hover:text-slate-900 dark:group-hover:text-white">
                {user?.name || 'Prasad Sangale'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-none truncate mt-0.5 font-medium">
                {user?.role || 'Executive & Knowledge Lead'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0 transition-colors" />
          </button>
        </div>
      </aside>
    </>
  );
};
