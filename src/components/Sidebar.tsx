import { 
  CheckSquare, 
  BookOpen, 
  Sparkles, 
  Layers, 
  ChevronLeft, 
  LayoutDashboard, 
  Radar, 
  Compass 
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  notesCount?: number;
  completedCount?: number;
  totalCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isMobile = false,
  isOpen = true,
  onClose,
  notesCount = 0,
  completedCount = 0,
  totalCount = 0
}) => {
  const navItems = [
    { id: 'today', name: 'Shift Radar', icon: Radar, subtitle: 'Daily focus & routines' },
    { id: 'tasks', name: 'To-do list', icon: CheckSquare, subtitle: 'Tasks, matrix & execution' },
    { id: 'notes', name: 'My Notes', icon: BookOpen, subtitle: 'Rich thoughts & ideas', count: notesCount > 0 ? notesCount : undefined },
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, subtitle: 'Pillars & metric radar' },
    { id: 'mindmap', name: 'Canvas & Graph', icon: Compass, subtitle: 'Visual second brain' },
    { id: 'organizer', name: 'Smart AI Organizer', icon: Sparkles, subtitle: 'Bulk input & auto-sorting', badge: 'BULK AI' },
  ];

  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (isMobile && !isOpen) {
    return null;
  }

  return (
    <aside className={`w-64 bg-white dark:bg-dark-sidebar border-r border-slate-200 dark:border-dark-border flex flex-col justify-between transition-all duration-300 min-h-screen ${
      isMobile ? 'fixed inset-y-0 left-0 z-50 shadow-2xl' : 'relative shrink-0'
    }`}>
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
                  LIFE OS
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  V2.5
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight block">
                Autonomous Intelligence
              </span>
            </div>
          </div>

          {isMobile && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              title="Close Navigation"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Navigation Category Header */}
        <div className="px-5 pt-5 pb-2 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            CONTROL ROOM
          </span>
        </div>

        {/* Nav Links */}
        <nav className="px-3 space-y-1 flex-1">
          {navItems.map((item) => {
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
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
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
        </nav>
      </div>

      {/* Bottom Profile / Status */}
      <div className="p-4 border-t border-slate-200 dark:border-dark-border shrink-0 bg-slate-50/50 dark:bg-dark-sidebar">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Task Completion</span>
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tabular-nums">
            {totalCount > 0 ? `${completedCount}/${totalCount} (${pct}%)` : 'Active'}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#FF5A1F] to-[#10B981] rounded-full transition-all duration-500"
            style={{ width: `${totalCount > 0 ? pct : 100}%` }}
          />
        </div>
      </div>
    </aside>
  );
};
