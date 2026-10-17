import React from 'react';
import { 
  CheckSquare, 
  BookOpen, 
  Sparkles, 
  Layers, 
  ChevronLeft, 
  LayoutDashboard, 
  Compass,
  Flame,
  Calendar,
  Clock,
  FolderKanban,
  Target,
  BarChart3,
  Zap
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;            // Mobile open state
  isDesktopOpen: boolean;     // Desktop (pinned || hovered) state
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  notesCount?: number;
  completedCount?: number;
  totalCount?: number;
  isMobile?: boolean;
}

interface NavItem {
  id: string;
  name: string;
  icon: any;
  subtitle: string;
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
  onClose,
  onMouseEnter,
  onMouseLeave,
  notesCount = 0,
  completedCount = 0,
  totalCount = 0,
  isMobile = false
}) => {
  const pendingCount = Math.max(totalCount - completedCount, 0);

  const navGroups: NavGroup[] = [
    {
      category: 'CORE EXECUTION',
      items: [
        { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, subtitle: 'Executive command center' },
        { id: 'tasks', name: 'Tasks & Matrix', icon: CheckSquare, subtitle: 'Eisenhower priority execution', count: pendingCount > 0 ? pendingCount : undefined },
        { id: 'calendar', name: 'Calendar & Schedule', icon: Calendar, subtitle: 'Time blocking & day flow' },
        { id: 'focus', name: 'Focus Timer', icon: Clock, subtitle: 'Pomodoro flow cockpit' }
      ]
    },
    {
      category: 'KNOWLEDGE & PROJECTS',
      items: [
        { id: 'notes', name: 'Notes & Knowledge', icon: BookOpen, subtitle: 'Apple Notes + Notion + Obsidian', count: notesCount > 0 ? notesCount : undefined },
        { id: 'projects', name: 'Projects & Kanban', icon: FolderKanban, subtitle: 'Boards & milestones' },
        { id: 'goals', name: 'Goals & Milestones', icon: Target, subtitle: 'Strategic horizons & OKRs' },
        { id: 'mindmap', name: 'Canvas & Graph', icon: Compass, subtitle: 'Visual second brain' }
      ]
    },
    {
      category: 'HABITS & REFLECTION',
      items: [
        { id: 'habits', name: 'Habits & Routines', icon: Flame, subtitle: 'Atomic streaks & heatmaps' },
        { id: 'journal', name: 'Daily Journal', icon: Sparkles, subtitle: 'Evening chronicle & wins' },
        { id: 'analytics', name: 'Productivity Analytics', icon: BarChart3, subtitle: 'Reports & performance metrics' }
      ]
    },
    {
      category: 'INTELLIGENCE',
      items: [
        { id: 'assistant', name: 'AI Copilot', icon: Sparkles, subtitle: 'Antigravity real-time chat', badge: 'PRO' },
        { id: 'organizer', name: 'Smart AI Organizer', icon: Zap, subtitle: 'Bulk input & auto-sorting', badge: 'AI' }
      ]
    }
  ];

  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200/80 dark:border-dark-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF5A1F] to-[#EA580C] flex items-center justify-center shadow-[0_2px_10px_rgba(255,90,31,0.3)] shrink-0">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase font-mono">
                    SANKALP
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                    V2.5
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight block">
                  Autonomous Life OS
                </span>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                title="Close Navigation"
              >
                <ChevronLeft size={16} />
              </button>
            )}
          </div>

        {/* Categorized Navigation Groups */}
        <div className="px-3 py-3 space-y-4 flex-1">
          {navGroups.map((group) => (
            <div key={group.category} className="space-y-1">
              <div className="px-3 py-1">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                  {group.category}
                </span>
              </div>

              <div className="space-y-0.5">
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
                      className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#FFF4EC] dark:bg-[#FF5A1F]/15 border border-[#FFD8BF] dark:border-[#FF5A1F]/30 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-card border border-transparent'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 transition-colors ${
                        isActive ? 'text-[#FF5A1F]' : 'text-slate-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold truncate ${
                            isActive ? 'text-[#E04F16] dark:text-[#FF5A1F]' : 'text-slate-800 dark:text-slate-200'
                          }`}>
                            {item.name}
                          </span>
                          {item.count !== undefined && (
                            <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 tabular-nums">
                              {item.count}
                            </span>
                          )}
                          {item.badge && (
                            <span className="text-[9px] font-bold tracking-tight px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Metrics (Prahari Task Completion) */}
      <div className="p-4 border-t border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card/30 shrink-0">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-mono">
          <span className="text-[10px] uppercase text-slate-400">Task Completion</span>
          <span>{completedCount}/{totalCount} ({pct}%)</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-linear-to-r from-[#FF5A1F] to-[#10B981] h-full transition-all duration-300 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </aside>
  </>
);
};
