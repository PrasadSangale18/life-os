import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './store';
import { Dashboard } from './components/Dashboard';
import { TaskModal } from './components/TaskModal';
import { lazy, Suspense } from 'react';
import { ListView, TrashView, InboxView } from './components/Views';
import { NotesView } from './components/NotesView';
import { ImportView } from './components/ImportView';
import { SettingsView } from './components/SettingsView';
import { TodayView } from './components/TodayView';
import { ProjectsView } from './components/ProjectsView';
import { CommandPalette } from './components/CommandPalette';
import { SmartOrganizer } from './components/SmartOrganizer';
import { WeeklyReview } from './components/WeeklyReview';
import { LoginScreen } from './components/LoginScreen';
import { LifeOSLogo } from './components/LifeOSLogo';
import { ThemeToggle } from './components/ThemeToggle';
import { ExportModal } from './components/ExportModal';
import { PromptWiseModal } from './components/PromptWiseModal';
import { UserProfileMenu } from './components/UserProfileMenu';

const MindMap = lazy(() => import('./components/MindMap').then(m => ({ default: m.MindMap })));
import { PILLARS, FONT_URL } from './theme/tokens';
import type { PillarId } from './theme/tokens';
import type { Item, ItemType } from './types';
import { 
  Plus, 
  LayoutDashboard, 
  GitBranch, 
  LogOut, 
  List as ListIcon, 
  Trash2, 
  Inbox, 
  Download, 
  Settings, 
  Wand2, 
  CalendarCheck,
  Search,
  Brain,
  Activity,
  HeartHandshake,
  Coins,
  Lock,
  Sparkles,
  Target,
  X,
  CheckSquare,
  BookOpen,
  Menu
} from 'lucide-react';
import './App.css';

const PILLAR_STYLES: Record<string, {
  name: string;
  Icon: any;
  activeClass: string;
}> = {
  physical: {
    name: "Physical",
    Icon: Activity,
    activeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
  },
  mental: {
    name: "Mental",
    Icon: Brain,
    activeClass: "bg-sky-500/15 text-sky-300 border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.2)]",
  },
  relational: {
    name: "Relational",
    Icon: HeartHandshake,
    activeClass: "bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.2)]",
  },
  spiritual: {
    name: "Spiritual",
    Icon: Sparkles,
    activeClass: "bg-purple-500/15 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]",
  },
  financial: {
    name: "Financial",
    Icon: Coins,
    activeClass: "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]",
  },
};

// THE 4 CORE WORKSPACES (User explicit requirement)
const CORE_SECTIONS = [
  { id: "tasks",      label: "To-do list",        subtitle: "Tasks, matrix & execution", Icon: CheckSquare, badgeColor: "#4d9eff" },
  { id: "notes",      label: "My Notes",          subtitle: "Rich thoughts & ideas",     Icon: BookOpen,    badgeColor: "#00d97e" },
  { id: "mindmap",    label: "Mind Map & Graph",  subtitle: "Visual second brain",       Icon: GitBranch,   badgeColor: "#b57bff" },
  { id: "organizer",  label: "Smart AI Organizer",subtitle: "Bulk input & auto-sorting",  Icon: Wand2,       badgeColor: "#fbbf24" },
] as const;

export default function App() {
  const { isLoaded, init, user, setUser, addItem, updateItem, showPrivate, setShowPrivate } = useStore();

  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("tasks");
  const [taskViewMode, setTaskViewMode] = useState<'matrix' | 'list' | 'projects' | 'inbox'>('matrix');
  const [activePillar, setActivePillar] = useState<PillarId>("physical");
  const [showUtilitiesModal, setShowUtilitiesModal] = useState(false);
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lifeos_theme');
      if (stored === 'light' || stored === 'dark') return stored;
    }
    return 'dark';
  });

  const [showExportModal, setShowExportModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lifeos_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [editingTask, setEditingTask] = useState<Item | undefined>(undefined);
  const [taskModalType, setTaskModalType] = useState<ItemType | undefined>(undefined);
  const [taskModalProjectId, setTaskModalProjectId] = useState<string | undefined>(undefined);
  const [taskModalGoalId, setTaskModalGoalId] = useState<string | undefined>(undefined);
  const [newTaskQuadrant, setNewTaskQuadrant] = useState<any>("do");
  const [captureTarget, setCaptureTarget] = useState<'inbox' | 'quadrant'>('inbox');

  useEffect(() => {
    init();
    
    const handleSyncPull = () => {
      init();
    };
    window.addEventListener('lifeos-sync-pull', handleSyncPull);

    const link = document.createElement("link");
    link.href = FONT_URL; 
    link.rel = "stylesheet";
    document.head.appendChild(link);
    
    const check = () => {
      const m = window.innerWidth < 768;
      setIsMobile(m);
      if (m) setSidebarOpen(false);
    };
    check();
    window.addEventListener("resize", check);

    return () => {
      try { document.head.removeChild(link); } catch {}
      window.removeEventListener("resize", check);
      window.removeEventListener('lifeos-sync-pull', handleSyncPull);
    };
  }, [init]);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        return;
      }

      if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' || (document.activeElement as HTMLElement)?.isContentEditable;
        if (isInput) return;
        
        e.preventDefault();
        setEditingTask(undefined);
        setCaptureTarget('inbox');
        setNewTaskQuadrant('do');
        setShowTaskModal(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);

    return () => { 
      window.removeEventListener('keydown', handleGlobalKey);
    };
  }, []);

  const items = useStore(s => s.items);

  // Metrics
  const pt = useMemo(() => items.filter(t => t.type === 'task' && !t.deletedAt && (showPrivate || !t.isPrivate)), [items, showPrivate]);
  const doneTasks = useMemo(() => pt.filter(t => t.status === 'done').length, [pt]);
  const pct = pt.length ? Math.round((doneTasks / pt.length) * 100) : 0;
  
  const inboxCount = useMemo(() => {
    return items.filter(i => (!i.pillar || (i.type === 'task' && !i.quadrant)) && !i.deletedAt && !i.isArchived && (showPrivate || !i.isPrivate)).length;
  }, [items, showPrivate]);

  const pendingTasksCount = useMemo(() => {
    return pt.filter(t => t.status !== 'done').length;
  }, [pt]);

  const totalNotesCount = useMemo(() => {
    return items.filter(t => (t.type === 'note' || t.type === 'idea' || t.type === 'knowledge' || t.type === 'journal') && !t.deletedAt && !t.isArchived && (showPrivate || !t.isPrivate)).length;
  }, [items, showPrivate]);

  if (!isLoaded) {
    return (
      <div style={{ background: "var(--bg-base)", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", gap: 10, fontFamily: "var(--font-sans)", fontSize: 13, letterSpacing: "0.02em" }}>
        <Sparkles size={16} color="var(--accent-primary)" style={{ animation: "spin 2s linear infinite" }} />
        <span>Initializing Life OS...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onSuccess={setUser} />;
  }

  const handleSaveTask = (data: Partial<Item>) => {
    if (editingTask) {
      updateItem(editingTask.id, data);
    } else {
      addItem(data as Omit<Item, 'id' | 'createdAt' | 'updatedAt'>);
    }
    setShowTaskModal(false);
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-base)", color: "var(--text-primary)", fontFamily: "var(--font-sans)", overflow: "hidden", position: "relative" }}>
      {/* Background Ambient Radial Spotlight (Linear / Raycast aesthetic) */}
      <div 
        style={{ 
          position: "fixed", 
          inset: 0, 
          pointerEvents: "none", 
          zIndex: 0, 
          background: theme === 'dark' 
            ? "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.12), transparent)" 
            : "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.08), transparent)"
        }} 
      />

      {/* Subtle Engineering Grid Line Overlay */}
      <div 
        style={{ 
          position: "fixed", 
          inset: 0, 
          pointerEvents: "none", 
          zIndex: 0, 
          backgroundImage: "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)", 
          backgroundSize: "28px 28px",
          opacity: 0.25
        }} 
      />

      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 40, backdropFilter: "blur(6px)" }} />
      )}

      {/* Sidebar */}
      <aside 
        style={{ 
          width: isMobile ? (sidebarOpen ? "84vw" : 0) : 250, 
          maxWidth: isMobile ? 320 : 250,
          flexShrink: 0, 
          background: "var(--bg-sidebar)", 
          borderRight: "1px solid var(--border-default)", 
          display: "flex", 
          flexDirection: "column", 
          zIndex: isMobile ? 50 : 10, 
          backdropFilter: "blur(24px)", 
          overflow: "hidden", 
          transition: isMobile ? "width 0.22s cubic-bezier(0.16, 1, 0.3, 1)" : "none", 
          position: isMobile ? "fixed" : "relative", 
          top: 0, 
          left: 0, 
          height: "100vh" 
        }}
      >
        <div style={{ width: isMobile ? "84vw" : 250, maxWidth: isMobile ? 320 : 250, height: "100%", display: "flex", flexDirection: "column", opacity: isMobile ? (sidebarOpen ? 1 : 0) : 1, transition: "opacity 0.15s ease", pointerEvents: isMobile ? (sidebarOpen ? "auto" : "none") : "auto" }}>
          
          {/* Brand Header */}
          <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <LifeOSLogo variant="full" size={28} />
            {isMobile && (
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="btn-ghost"
                style={{ padding: 4, borderRadius: 6, color: "var(--text-tertiary)" }}
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* THE 4 CORE WORKSPACES */}
          <div style={{ padding: "14px 10px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
            {CORE_SECTIONS.map(s => {
              const isActive = activeSection === s.id;
              const count = s.id === "tasks" ? pendingTasksCount : s.id === "notes" ? totalNotesCount : undefined;

              return (
                <button 
                  key={s.id} 
                  onClick={() => { setActiveSection(s.id); if (isMobile) setSidebarOpen(false); }}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 12, 
                    padding: "11px 14px", 
                    borderRadius: 12, 
                    background: isActive ? "var(--accent-bg)" : "transparent", 
                    border: isActive ? "1px solid var(--border-default)" : "1px solid transparent", 
                    cursor: "pointer", 
                    textAlign: "left", 
                    width: "100%",
                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                    boxShadow: isActive ? "var(--shadow-sm)" : "none",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-surface-hover)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <s.Icon size={18} color={isActive ? "var(--text-primary)" : "var(--text-tertiary)"} strokeWidth={isActive ? 2.2 : 1.7} />
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 13.5, fontWeight: isActive ? 650 : 500, letterSpacing: "-0.01em", color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}>
                      {s.label}
                    </span>
                    <span style={{ fontSize: 10.5, color: "var(--text-tertiary)", marginTop: 1 }}>
                      {s.subtitle}
                    </span>
                  </div>
                  {s.id === 'organizer' && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 9999, background: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6", letterSpacing: "0.04em" }}>
                      BULK AI
                    </span>
                  )}
                  {count !== undefined && count > 0 && (
                    <span className="tabular-nums" style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, background: isActive ? "var(--accent-primary)" : "var(--bg-surface-elevated)", color: isActive ? (theme === 'light' ? "#ffffff" : "#0e1015") : "var(--text-tertiary)", border: "1px solid var(--border-subtle)" }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Progress Bar & Utility Dock at Bottom */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Minimalist Task Completion Progress */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span className="text-label" style={{ fontSize: 10 }}>Task Completion</span>
                <span className="text-meta" style={{ color: "var(--text-primary)", fontWeight: 600 }}>{doneTasks}/{pt.length} ({pct}%)</span>
              </div>
              <div style={{ height: 4, background: "var(--border-default)", borderRadius: 9999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: theme === 'light' ? "linear-gradient(90deg, #181a20, #10b981)" : "linear-gradient(90deg, #a78bfa, #10b981)", borderRadius: 9999, transition: "width 0.4s ease" }} />
              </div>
            </div>

            {/* Quick Utilities Button */}
            <button
              type="button"
              onClick={() => setShowUtilitiesModal(true)}
              className="btn-ghost"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-surface)",
                fontSize: 12,
                color: "var(--text-secondary)",
                cursor: "pointer",
                width: "100%"
              }}
            >
              <Settings size={14} color="var(--text-tertiary)" />
              <span style={{ flex: 1, textAlign: "left" }}>Utilities & Settings</span>
            </button>

            {/* User Row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 2 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", flexShrink: 0 }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
              </div>
              <button 
                aria-label="Sign out" 
                onClick={() => setUser(null)} 
                className="btn-ghost"
                style={{ padding: 4, borderRadius: 5, color: "var(--text-tertiary)" }}
                title="Sign out"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", position: "relative", zIndex: 1, overflow: "hidden" }}>
        
        {/* Top Header */}
        <header style={{ padding: isMobile ? "10px 14px" : "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-default)", backdropFilter: "blur(20px)", background: "var(--bg-sidebar)", flexWrap: "wrap", gap: 10, zIndex: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Mobile Menu Toggle Button */}
            {isMobile && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="btn-ghost"
                style={{
                  width: 32,
                  height: 32,
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-surface)",
                  color: "var(--text-secondary)"
                }}
                aria-label="Open navigation"
              >
                <Menu size={18} />
              </button>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="page-title" style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, letterSpacing: "-0.02em" }}>
                {activeSection === "tasks" ? "To-do list" :
                 activeSection === "notes" ? "My Notes" :
                 activeSection === "mindmap" ? "Mind Map & Graph" :
                 activeSection === "organizer" ? "Smart AI Organizer" :
                 activeSection === "review" ? "Weekly Review" :
                 activeSection === "settings" ? "Settings" :
                 activeSection === "import" ? "Import" :
                 "Trash & Archive"}
              </span>

              {/* If in tasks workspace: show clean segmented switcher [ Matrix | List | Projects | Inbox ] */}
              {activeSection === "tasks" && (
                <div className="bg-white/[0.04] p-1 rounded-xl border border-white/[0.06] flex items-center gap-1 backdrop-blur-md ml-2">
                  {[
                    { id: 'matrix', label: 'Matrix', icon: LayoutDashboard },
                    { id: 'list', label: 'List', icon: ListIcon },
                    { id: 'projects', label: 'Projects', icon: Target },
                    { id: 'inbox', label: 'Inbox', icon: Inbox, badge: inboxCount }
                  ].map(tab => {
                    const isCurrent = taskViewMode === tab.id;
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setTaskViewMode(tab.id as any)}
                        className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 outline-none ${
                          isCurrent ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isCurrent && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-white/10 text-white rounded-lg shadow-sm border border-white/[0.08]"
                            transition={{ type: "spring", stiffness: 450, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                          <TabIcon size={13} strokeWidth={1.75} />
                          {!isMobile && <span>{tab.label}</span>}
                          {tab.badge && tab.badge > 0 ? (
                            <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 text-[10px] font-mono rounded-full leading-tight tabular-nums">
                              {tab.badge}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Search */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] text-slate-400 hover:text-slate-200 rounded-lg text-xs py-1.5 px-3 transition-colors flex items-center gap-2 group outline-none cursor-pointer"
              title="Open Command & Search Palette (Cmd+K)"
            >
              <Search size={13} strokeWidth={1.75} className="group-hover:text-white transition-colors" />
              {!isMobile && <span className="text-slate-400 group-hover:text-slate-200">Search</span>}
              {!isMobile && (
                <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400 border border-white/[0.06]">
                  ⌘K
                </kbd>
              )}
            </button>

            {/* Theme Toggle (Sun/Moon) */}
            <ThemeToggle theme={theme} onToggle={toggleTheme} />

            {/* Quick Capture Button (Linear/Raycast Gradient CTA) */}
            <button 
              onClick={() => { setEditingTask(undefined); setCaptureTarget('inbox'); setNewTaskQuadrant('do'); setShowTaskModal(true); }} 
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-medium px-3.5 py-1.5 rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 text-xs outline-none cursor-pointer"
              title="Capture new item (C)"
            >
              <Plus size={14} strokeWidth={1.75} />
              <span>Capture</span>
              {!isMobile && (
                <kbd className="bg-black/30 text-white/80 px-1.5 py-0.5 rounded text-[10px] font-mono ml-2">
                  C
                </kbd>
              )}
            </button>

            {/* User Profile Menu with Settings, Export, Prompt, Sign Out */}
            <UserProfileMenu
              user={user}
              onSignOut={() => setUser(null)}
              onOpenSettings={() => setActiveSection('settings')}
              onOpenExport={() => setShowExportModal(true)}
              onOpenPrompt={() => setShowPromptModal(true)}
            />
          </div>
        </header>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 14 : 24, paddingBottom: isMobile ? 100 : 80 }}>
          {/* 1. NOTES FOR TASK WORKSPACE */}
          {activeSection === "tasks" && (
            <AnimatePresence mode="wait">
              {taskViewMode === 'matrix' && (
                <motion.div 
                  key="matrix"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  {/* Dimension Category Filters (Linear / Raycast Tinted Glow Pills) */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                    {PILLARS.map(p => {
                      const isSelected = activePillar === p.id;
                      const style = PILLAR_STYLES[p.id];
                      const Icon = style?.Icon || Activity;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setActivePillar(p.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all border cursor-pointer whitespace-nowrap ${
                            isSelected
                              ? `${style?.activeClass || "bg-white/10 text-white border-white/20"} font-semibold scale-[1.02]`
                              : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border-transparent font-medium hover:scale-[1.01]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                          <span>{style?.name || p.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  <Dashboard 
                    activePillar={activePillar} 
                    isMobile={isMobile} 
                    onAddTaskClick={(q) => { setEditingTask(undefined); setCaptureTarget('quadrant'); setNewTaskQuadrant(q); setShowTaskModal(true); }}
                    onEditTask={(task) => { setEditingTask(task); setShowTaskModal(true); }}
                  />
                </motion.div>
              )}

              {taskViewMode === 'list' && (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <ListView 
                    onEditTask={(task) => { setEditingTask(task); setShowTaskModal(true); }}
                  />
                </motion.div>
              )}

              {taskViewMode === 'projects' && (
                <motion.div
                  key="projects"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <ProjectsView 
                    onEditTask={(task) => { 
                      setEditingTask(task); 
                      setTaskModalType(task.type);
                      setTaskModalProjectId(task.projectId);
                      setTaskModalGoalId(task.goalId);
                      setShowTaskModal(true); 
                    }}
                    onNewGoal={() => {
                      setEditingTask(undefined);
                      setTaskModalType('goal');
                      setTaskModalProjectId(undefined);
                      setTaskModalGoalId(undefined);
                      setCaptureTarget('quadrant');
                      setShowTaskModal(true);
                    }}
                    onNewProject={(goalId) => {
                      setEditingTask(undefined);
                      setTaskModalType('project');
                      setTaskModalProjectId(undefined);
                      setTaskModalGoalId(goalId);
                      setCaptureTarget('quadrant');
                      setShowTaskModal(true);
                    }}
                    onNewTaskInProject={(projId, pil) => {
                      setEditingTask(undefined);
                      setTaskModalType('task');
                      setTaskModalProjectId(projId);
                      setTaskModalGoalId(undefined);
                      if (pil) setActivePillar(pil as PillarId);
                      setCaptureTarget('quadrant');
                      setShowTaskModal(true);
                    }}
                  />
                </motion.div>
              )}

              {taskViewMode === 'inbox' && (
                <motion.div
                  key="inbox"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <InboxView onEditTask={(task) => { setEditingTask(task); setShowTaskModal(true); }} />
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* 2. NOTES FOR THOUGHT WORKSPACE */}
          {activeSection === "notes" && (
            <NotesView onEditTask={(task) => { setEditingTask(task); setShowTaskModal(true); }} />
          )}

          {/* 3. MIND MAP & GRAPH WORKSPACE */}
          {activeSection === "mindmap" && (
            <Suspense fallback={<div style={{ color: "var(--text-tertiary)", padding: 24, fontSize: 13 }}>Loading Mind Map visualizer...</div>}>
              <MindMap 
                onEditTask={(task) => { setEditingTask(task); setShowTaskModal(true); }} 
                onNewItem={(pillar) => {
                  setEditingTask(undefined);
                  if (pillar) setActivePillar(pillar);
                  setCaptureTarget('quadrant');
                  setShowTaskModal(true);
                }}
              />
            </Suspense>
          )}

          {/* 4. SMART AI ORGANIZER WORKSPACE */}
          {activeSection === "organizer" && (
            <SmartOrganizer />
          )}

          {/* UTILITY VIEWS (accessible from Utilities dialog or User Menu) */}
          {activeSection === "today" && (
            <TodayView 
              onEditTask={(task) => { setEditingTask(task); setShowTaskModal(true); }}
              onAddTask={() => { setEditingTask(undefined); setCaptureTarget('inbox'); setNewTaskQuadrant('do'); setShowTaskModal(true); }}
              onGoToInbox={() => { setActiveSection('tasks'); setTaskViewMode('inbox'); }}
              onGoToMatrix={() => { setActiveSection('tasks'); setTaskViewMode('matrix'); }}
            />
          )}
          {activeSection === "inbox" && <InboxView onEditTask={(task) => { setEditingTask(task); setShowTaskModal(true); }} />}
          {activeSection === "projects" && (
            <ProjectsView 
              onEditTask={(task) => { setEditingTask(task); setShowTaskModal(true); }}
              onNewGoal={() => { setEditingTask(undefined); setTaskModalType('goal'); setShowTaskModal(true); }}
              onNewProject={() => { setEditingTask(undefined); setTaskModalType('project'); setShowTaskModal(true); }}
              onNewTaskInProject={() => { setEditingTask(undefined); setTaskModalType('task'); setShowTaskModal(true); }}
            />
          )}
          {activeSection === "import" && <ImportView />}
          {activeSection === "settings" && <SettingsView />}
          {activeSection === "review" && <WeeklyReview />}
          {activeSection === "trash" && <TrashView />}
        </div>
        
        {/* Mobile Fixed Bottom Navigation Bar - Exactly 4 Core Workspaces + Central Capture */}
        {isMobile && (
          <nav 
            style={{ 
              position: "fixed", 
              bottom: 0, 
              left: 0, 
              right: 0, 
              height: 60, 
              background: "rgba(10, 12, 18, 0.95)", 
              backdropFilter: "blur(20px)", 
              borderTop: "1px solid var(--border-default)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-around", 
              zIndex: 35,
              padding: "0 8px"
            }}
          >
            {/* 1. To-do list */}
            <button
              type="button"
              onClick={() => setActiveSection("tasks")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                background: "transparent",
                border: "none",
                color: activeSection === "tasks" ? "var(--text-primary)" : "var(--text-tertiary)",
                cursor: "pointer",
                padding: "6px 8px",
                minWidth: 48
              }}
            >
              <CheckSquare size={18} strokeWidth={activeSection === "tasks" ? 2.4 : 1.7} />
              <span style={{ fontSize: 10, fontWeight: activeSection === "tasks" ? 700 : 500 }}>To-do</span>
            </button>

            {/* 2. My Notes */}
            <button
              type="button"
              onClick={() => setActiveSection("notes")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                background: "transparent",
                border: "none",
                color: activeSection === "notes" ? "var(--text-primary)" : "var(--text-tertiary)",
                cursor: "pointer",
                padding: "6px 8px",
                minWidth: 48
              }}
            >
              <BookOpen size={18} strokeWidth={activeSection === "notes" ? 2.4 : 1.7} />
              <span style={{ fontSize: 10, fontWeight: activeSection === "notes" ? 700 : 500 }}>My Notes</span>
            </button>

            {/* 3. Central Elevated Quick Capture */}
            <button
              type="button"
              onClick={() => { 
                setEditingTask(undefined); 
                setCaptureTarget('inbox'); 
                setNewTaskQuadrant('do'); 
                setShowTaskModal(true); 
              }}
              aria-label="Quick Capture"
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                background: theme === 'light' ? "#181a20" : "#ffffff",
                color: theme === 'light' ? "#ffffff" : "#0e1015",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: theme === 'light' ? "0 6px 20px rgba(24,26,32,0.3)" : "0 6px 20px rgba(0,0,0,0.5)",
                cursor: "pointer",
                transform: "translateY(-8px)",
                flexShrink: 0
              }}
            >
              <Plus size={22} strokeWidth={2.6} />
            </button>

            {/* 4. Mind Map & Graph */}
            <button
              type="button"
              onClick={() => setActiveSection("mindmap")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                background: "transparent",
                border: "none",
                color: activeSection === "mindmap" ? "var(--text-primary)" : "var(--text-tertiary)",
                cursor: "pointer",
                padding: "6px 8px",
                minWidth: 48
              }}
            >
              <GitBranch size={18} strokeWidth={activeSection === "mindmap" ? 2.4 : 1.7} />
              <span style={{ fontSize: 10, fontWeight: activeSection === "mindmap" ? 700 : 500 }}>Mind Map</span>
            </button>

            {/* 5. Smart AI Organizer */}
            <button
              type="button"
              onClick={() => setActiveSection("organizer")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                background: "transparent",
                border: "none",
                color: activeSection === "organizer" ? "var(--text-primary)" : "var(--text-tertiary)",
                cursor: "pointer",
                padding: "6px 8px",
                minWidth: 48
              }}
            >
              <Wand2 size={18} strokeWidth={activeSection === "organizer" ? 2.4 : 1.7} />
              <span style={{ fontSize: 10, fontWeight: activeSection === "organizer" ? 700 : 500 }}>Organizer</span>
            </button>
          </nav>
        )}
      </main>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal 
          initialTask={editingTask}
          initialType={taskModalType}
          initialProjectId={taskModalProjectId}
          initialGoalId={taskModalGoalId}
          defaultPillar={activePillar}
          defaultQuadrant={newTaskQuadrant}
          defaultToInbox={!editingTask && captureTarget === 'inbox'}
          onSave={handleSaveTask}
          onClose={() => {
            setShowTaskModal(false);
            setTaskModalType(undefined);
            setTaskModalProjectId(undefined);
            setTaskModalGoalId(undefined);
          }}
          isMobile={isMobile}
        />
      )}

      {/* Global Command Palette */}
      <CommandPalette 
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={(sec) => { 
          if (sec === 'tasks') {
            setActiveSection('tasks');
            setTaskViewMode('matrix');
          } else if (sec === 'list') {
            setActiveSection('tasks');
            setTaskViewMode('list');
          } else if (sec === 'projects') {
            setActiveSection('tasks');
            setTaskViewMode('projects');
          } else if (sec === 'inbox') {
            setActiveSection('tasks');
            setTaskViewMode('inbox');
          } else {
            setActiveSection(sec);
          }
          setShowCommandPalette(false); 
        }}
        onOpenCapture={() => {
          setShowCommandPalette(false);
          setEditingTask(undefined);
          setCaptureTarget('inbox');
          setNewTaskQuadrant('do');
          setShowTaskModal(true);
        }}
        onEditItem={(item) => {
          setShowCommandPalette(false);
          setEditingTask(item);
          setShowTaskModal(true);
        }}
      />

      {/* Export & Backup Modal */}
      <ExportModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* Prompt-Wise External AI Decomposition Modal */}
      <PromptWiseModal 
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
      />

      {/* Utilities & Settings Modal */}
      {showUtilitiesModal && (
        <div 
          onClick={() => setShowUtilitiesModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(8px)",
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="glass-panel-elevated modal-content"
            style={{
              width: "100%",
              maxWidth: 480,
              padding: 24,
              borderRadius: 16,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-strong)",
              display: "flex",
              flexDirection: "column",
              gap: 16
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(234,88,12,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ea580c" }}>
                  <Settings size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Utilities & Preferences</h3>
                  <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>System settings, reviews, backups & archive</p>
                </div>
              </div>
              <button onClick={() => setShowUtilitiesModal(false)} className="btn-ghost" style={{ padding: 6, borderRadius: 8 }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
              <button
                onClick={() => { setActiveSection('review'); setShowUtilitiesModal(false); }}
                className="btn-ghost"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-surface-elevated)",
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                <CalendarCheck size={18} color="#a855f7" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Weekly Review</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Reflect on habits & tasks</div>
                </div>
              </button>

              <button
                onClick={() => { setActiveSection('settings'); setShowUtilitiesModal(false); }}
                className="btn-ghost"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-surface-elevated)",
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                <Settings size={18} color="#3b82f6" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Settings & Sync</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Supabase, keys & themes</div>
                </div>
              </button>

              <button
                onClick={() => { setShowExportModal(true); setShowUtilitiesModal(false); }}
                className="btn-ghost"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-surface-elevated)",
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                <Download size={18} color="#10b981" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Backup & Export</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>JSON, Markdown, CSV</div>
                </div>
              </button>

              <button
                onClick={() => { setShowPromptModal(true); setShowUtilitiesModal(false); }}
                className="btn-ghost"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-surface-elevated)",
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                <Sparkles size={18} color="#ea580c" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>AI Prompt Engine</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Format tasks for external AI</div>
                </div>
              </button>

              <button
                onClick={() => { setActiveSection('trash'); setShowUtilitiesModal(false); }}
                className="btn-ghost"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-surface-elevated)",
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                <Trash2 size={18} color="#f43f5e" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Trash & Archive</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Restore deleted items</div>
                </div>
              </button>

              <button
                onClick={() => setShowPrivate(!showPrivate)}
                className="btn-ghost"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-surface-elevated)",
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                <Lock size={18} color={showPrivate ? "#10b981" : "var(--text-tertiary)"} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Private Items</div>
                  <div style={{ fontSize: 11, color: showPrivate ? "#10b981" : "var(--text-tertiary)" }}>{showPrivate ? "Visible" : "Hidden"}</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
