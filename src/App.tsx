import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
import { ExportModal } from './components/ExportModal';
import { PromptWiseModal } from './components/PromptWiseModal';
import { UserProfileMenu } from './components/UserProfileMenu';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { DimensionFilter } from './components/DimensionFilter';
import { HabitsView } from './components/habits/HabitsView';
import { PrahariCopilotChat } from './components/chat/PrahariCopilotChat';
import { DayTimeline } from './components/productivity/DayTimeline';
import { FlowCockpitModal } from './components/focus/FlowCockpitModal';
import { EveningChronicleModal } from './components/productivity/EveningChronicleModal';

const MindMap = lazy(() => import('./components/MindMap').then(m => ({ default: m.MindMap })));
import { FONT_URL } from './theme/tokens';
import type { PillarId } from './theme/tokens';
import type { Item, ItemType } from './types';
import { 
  Plus, 
  Sparkles,
  CheckSquare,
  BookOpen,
  GitBranch,
  Wand2,
  Settings,
  X,
  CalendarCheck,
  Download,
  Trash2,
  Lock,
  Clock
} from 'lucide-react';
import './App.css';

const PATH_TO_SECTION: Record<string, string> = {
  '/': 'tasks',
  '/dashboard': 'tasks',
  '/today': 'tasks',
  '/tasks': 'tasks',
  '/matrix': 'tasks',
  '/todo': 'tasks',
  '/calendar': 'calendar',
  '/focus': 'focus',
  '/habits': 'habits',
  '/notes': 'notes',
  '/projects': 'projects',
  '/goals': 'projects',
  '/organizer': 'organizer',
  '/canvas': 'mindmap',
  '/mindmap': 'mindmap',
  '/journal': 'journal',
  '/analytics': 'analytics',
  '/import': 'import',
  '/review': 'review',
  '/settings': 'settings',
  '/trash': 'trash',
};

const SECTION_TO_PATH: Record<string, string> = {
  tasks: '/',
  dashboard: '/',
  today: '/today',
  calendar: '/calendar',
  focus: '/focus',
  habits: '/habits',
  notes: '/notes',
  projects: '/projects',
  goals: '/projects',
  organizer: '/organizer',
  mindmap: '/canvas',
  journal: '/journal',
  analytics: '/analytics',
  import: '/import',
  review: '/review',
  settings: '/settings',
  trash: '/trash',
};

const SECTION_TITLES: Record<string, string> = {
  tasks: 'Tasks & Matrix',
  dashboard: 'Tasks & Matrix',
  today: 'Executive Daily Briefing',
  calendar: 'Calendar & Schedule',
  focus: 'Flow Cockpit',
  habits: 'Habits & Routines',
  notes: 'My Notes',
  projects: 'Projects & Goals',
  goals: 'Projects & Goals',
  organizer: 'Smart AI Organizer',
  mindmap: 'Mind Map',
  journal: 'Daily Journal',
  analytics: 'Productivity Analytics',
  import: 'CSV Bulk Import',
  review: 'Weekly Operating Review',
  settings: 'Settings & Storage',
  trash: 'Trash & Archive'
};

const getInitialSection = (): string => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    if (PATH_TO_SECTION[path]) {
      return PATH_TO_SECTION[path];
    }
  }
  return 'tasks';
};

export default function App() {
  const { isLoaded, init, user, setUser, addItem, updateItem, showPrivate, setShowPrivate } = useStore();

  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile drawer state
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sankalp_sidebar_pinned');
      if (saved !== null) return saved === 'true';
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 250);
  };

  const togglePin = () => {
    setIsPinned(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sankalp_sidebar_pinned', String(next));
      } catch (e) {}
      return next;
    });
  };

  // Desktop visibility is active if pinned OR hovered
  const isDesktopVisible = isPinned || isHovered;

  const [activeSection, setActiveSectionState] = useState<string>(getInitialSection);

  const setActiveSection = useCallback((sec: string) => {
    setActiveSectionState(sec);
    if (typeof window !== 'undefined') {
      const targetPath = SECTION_TO_PATH[sec] || '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ section: sec }, '', targetPath);
      }
    }
  }, []);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const path = window.location.pathname.replace(/\/+$/, '') || '/';
      const sec = PATH_TO_SECTION[path] || e.state?.section || 'tasks';
      setActiveSectionState(sec);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    const pageTitle = SECTION_TITLES[activeSection] || 'Intelligent Workspace';
    document.title = `${pageTitle} — SANKALP`;
  }, [activeSection]);
  const [taskViewMode, setTaskViewMode] = useState<'matrix' | 'list' | 'projects' | 'inbox'>('matrix');
  const [activePillar, setActivePillar] = useState<PillarId>("physical");
  const [showUtilitiesModal, setShowUtilitiesModal] = useState(false);
  
  // Prahari Copilot, Flow, and Journal state
  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotDocked, setCopilotDocked] = useState(false);
  const [copilotPrompt, setCopilotPrompt] = useState<string | undefined>(undefined);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [flowFocusTask, setFlowFocusTask] = useState<Item | null>(null);
  const [showJournalModal, setShowJournalModal] = useState(false);
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lifeos_theme_mode');
      if (stored === 'light' || stored === 'dark') return stored;
    }
    return 'light'; // Clean light UI mode by default
  });

  const [showExportModal, setShowExportModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('lifeos_theme_mode', theme);
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
    
    // Safety fallback: ensure isLoaded never hangs indefinitely
    const safetyTimer = setTimeout(() => {
      if (!useStore.getState().isLoaded) {
        useStore.setState({ isLoaded: true });
      }
    }, 1500);

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
      clearTimeout(safetyTimer);
      try { document.head.removeChild(link); } catch {}
      window.removeEventListener("resize", check);
      window.removeEventListener('lifeos-sync-pull', handleSyncPull);
    };
  }, [init]);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        togglePin();
        return;
      }

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
  
  const inboxCount = useMemo(() => {
    return items.filter(i => (!i.pillar || (i.type === 'task' && !i.quadrant)) && !i.deletedAt && !i.isArchived && (showPrivate || !i.isPrivate)).length;
  }, [items, showPrivate]);

  const totalNotesCount = useMemo(() => {
    return items.filter(t => (t.type === 'note' || t.type === 'idea' || t.type === 'knowledge' || t.type === 'journal') && !t.deletedAt && !t.isArchived && (showPrivate || !t.isPrivate)).length;
  }, [items, showPrivate]);

  if (!isLoaded) {
    return (
      <div style={{ background: "var(--bg-base)", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", gap: 10, fontFamily: "var(--font-sans)", fontSize: 13, letterSpacing: "0.02em" }}>
        <Sparkles size={16} color="var(--accent-primary)" style={{ animation: "spin 2s linear infinite" }} />
        <span>Initializing aisankalp...</span>
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
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#05080C] text-slate-900 dark:text-slate-100 font-sans overflow-hidden relative">
      {/* Futuristic Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Cyber Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        {/* Subtle Ambient Peripheral Glows (Matching Prahari - zero center color bleeding) */}
        <div className="absolute top-0 left-[-10%] w-[40rem] h-[40rem] bg-orange-500/5 dark:bg-orange-500/5 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35rem] h-[35rem] bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '12s', animationDelay: '2s' }} />
      </div>

      {/* Left Edge Hover Trigger (Claude-style hover zone when unpinned) */}
      {!isPinned && (
        <div 
          onMouseEnter={handleMouseEnter}
          className="hidden lg:block fixed left-0 top-0 bottom-0 w-4 z-40 cursor-e-resize"
          title="Hover to peek sidebar"
        />
      )}

      {/* SANKALP Sliding Sidebar */}
      <Sidebar 
        currentTab={activeSection}
        onTabChange={(tab) => {
          if (tab === 'assistant') {
            setCopilotPrompt(undefined);
            setShowCopilot(true);
          } else {
            setActiveSection(tab);
          }
          if (isMobile) setSidebarOpen(false);
        }}
        isMobile={isMobile}
        isOpen={sidebarOpen}
        isDesktopOpen={isDesktopVisible}
        isPinned={isPinned}
        onDesktopToggle={togglePin}
        onClose={() => setSidebarOpen(false)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        notesCount={totalNotesCount}
        completedCount={doneTasks}
        totalCount={pt.length}
        user={user}
        onSignOut={() => setUser(null)}
      />

      {/* Main Content Area with Dynamic Offset */}
      <main 
        className={`flex-1 flex flex-col h-screen relative z-1 overflow-hidden transition-all duration-300 ease-in-out ${
          isPinned ? 'lg:pl-64' : 'lg:pl-0'
        }`}
      >
        {/* Prahari Top Command Bar */}
        <TopBar
          currentView={taskViewMode}
          onViewChange={(view) => setTaskViewMode(view)}
          showViewSwitcher={activeSection === 'tasks'}
          inboxCount={inboxCount}
          isDarkMode={theme === 'dark'}
          onToggleDarkMode={toggleTheme}
          onOpenPromptWise={() => setShowPromptModal(true)}
          onOpenCopilot={() => {
            setCopilotPrompt(undefined);
            setShowCopilot(true);
          }}
          onQuickCapture={() => {
            setEditingTask(undefined);
            setCaptureTarget('inbox');
            setNewTaskQuadrant('do');
            setShowTaskModal(true);
          }}
          pageTitle={
            activeSection === "tasks" ? "Tasks & Matrix" :
            activeSection === "calendar" ? "Calendar & Schedule" :
            activeSection === "focus" ? "Flow Cockpit" :
            activeSection === "habits" ? "Habits & Routines" :
            activeSection === "notes" ? "My Notes" :
            activeSection === "projects" || activeSection === "goals" ? "Projects & Goals" :
            activeSection === "organizer" ? "Smart AI Organizer" :
            activeSection === "mindmap" ? "Mind Map" :
            activeSection === "journal" ? "Daily Journal" :
            activeSection === "analytics" ? "Productivity Analytics" :
            activeSection === "import" ? "CSV Bulk Import" :
            activeSection === "review" ? "Weekly Review" :
            activeSection === "settings" ? "Settings" :
            activeSection === "today" ? "Executive Daily Briefing" :
            "Tasks & Matrix"
          }
          onSearchClick={() => setShowCommandPalette(true)}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onDesktopMenuToggle={togglePin}
          onDesktopMouseEnter={handleMouseEnter}
          onDesktopMouseLeave={handleMouseLeave}
          isDesktopOpen={isDesktopVisible}
          isPinned={isPinned}
          isMobile={isMobile}
          onLogoClick={() => setActiveSection('tasks')}
          user={user}
        >
          <UserProfileMenu
            user={user}
            onSignOut={() => setUser(null)}
            onOpenSettings={() => setActiveSection('settings')}
            onOpenExport={() => setShowExportModal(true)}
            onOpenPrompt={() => setShowPromptModal(true)}
            onOpenUtilities={() => setShowUtilitiesModal(true)}
          />
        </TopBar>

        {/* Content Body */}
        <div style={{ 
          flex: 1, 
          overflowY: activeSection === 'mindmap' ? 'hidden' : 'auto', 
          padding: isMobile ? 14 : (activeSection === 'mindmap' ? 0 : 24), 
          paddingBottom: isMobile ? (activeSection === 'mindmap' ? 50 : 100) : (activeSection === 'mindmap' ? 0 : 80),
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
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
                  {/* Prahari Life Dimension Filter Pills */}
                  <DimensionFilter 
                    activeDimension={activePillar} 
                    onSelectDimension={(dim) => setActivePillar(dim)} 
                  />

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

          {/* 5. ATOMIC HABITS & ROUTINES WORKSPACE */}
          {activeSection === "habits" && (
            <HabitsView />
          )}

          {/* 6. CALENDAR & CIRCADIAN TIME BLOCKING */}
          {activeSection === "calendar" && (
            <div className="max-w-6xl mx-auto w-full space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Calendar & Circadian Time Blocking</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Interactive 24h schedule calibrated to human energy rhythms</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(undefined);
                    setCaptureTarget('quadrant');
                    setShowTaskModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-linear-to-r from-[#FF5A1F] to-[#EA580C] text-white text-xs font-bold shadow-xs cursor-pointer hover:opacity-90"
                >
                  + Schedule Task
                </button>
              </div>
              <DayTimeline 
                tasks={pt}
                onStartFocus={(task) => {
                  setFlowFocusTask(task);
                  setShowFlowModal(true);
                }}
                onEditTask={(task) => {
                  setEditingTask(task);
                  setShowTaskModal(true);
                }}
              />
            </div>
          )}

          {/* 7. FOCUS TIMER & DEEP WORK FLOW COCKPIT */}
          {activeSection === "focus" && (
            <div className="max-w-3xl mx-auto w-full py-6">
              <div className="rounded-3xl p-8 bg-white dark:bg-[#111622] border border-slate-200 dark:border-white/[0.08] shadow-lg text-center space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-[#FF5A1F] flex items-center justify-center mx-auto shadow-inner">
                  <Clock size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Deep Work Flow Cockpit</h2>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                    Binaural audio synthesis (40Hz gamma / 10Hz alpha), 25-minute Pomodoro focus blocks, and distraction parking.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.06] max-w-md mx-auto text-left space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold">
                    <span>Active Focus Candidate:</span>
                    <span className="font-mono text-[#FF5A1F]">{pt[0]?.title || 'Operational Briefing'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Estimated Duration:</span>
                    <span className="font-mono">{pt[0]?.estMinutes || 25} minutes</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFlowFocusTask(pt[0] || null);
                    setShowFlowModal(true);
                  }}
                  className="px-8 py-3.5 rounded-2xl bg-linear-to-r from-[#FF5A1F] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-black text-sm shadow-[0_4px_20px_rgba(255,90,31,0.35)] cursor-pointer active:scale-95 transition-all"
                >
                  Launch Flow Session Now
                </button>
              </div>
            </div>
          )}

          {/* 8. DAILY JOURNAL & EVENING CHRONICLE */}
          {activeSection === "journal" && (
            <div className="max-w-4xl mx-auto w-full py-4 space-y-4">
              <div className="rounded-2xl p-6 bg-white dark:bg-[#111622] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Daily Journal & Evening Chronicle</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Daily win reflection, energy pulse calibration, and closing ritual</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowJournalModal(true)}
                    className="px-4 py-2 rounded-xl bg-linear-to-r from-[#FF5A1F] to-[#EA580C] text-white text-xs font-bold cursor-pointer shadow-xs hover:opacity-90 active:scale-95 transition-all"
                  >
                    Open Evening Chronicle
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.06]">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Completed Today</span>
                    <span className="text-2xl font-black text-emerald-500 font-mono mt-1 block">{doneTasks}</span>
                    <span className="text-[11px] text-slate-500">Tasks closed</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.06]">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Active Notes</span>
                    <span className="text-2xl font-black text-purple-500 font-mono mt-1 block">{totalNotesCount}</span>
                    <span className="text-[11px] text-slate-500">Captured insights</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.06]">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Focus Momentum</span>
                    <span className="text-2xl font-black text-[#FF5A1F] font-mono mt-1 block">94%</span>
                    <span className="text-[11px] text-slate-500">Cognitive clarity</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRAHARI DASHBOARD: Unified Command Center & Daily Focus */}
          {(activeSection === "dashboard" || activeSection === "today") && (
            <TodayView 
              onEditTask={(task) => { setEditingTask(task); setShowTaskModal(true); }}
              onAddTask={() => { setEditingTask(undefined); setCaptureTarget('inbox'); setNewTaskQuadrant('do'); setShowTaskModal(true); }}
              onGoToInbox={() => { setActiveSection('tasks'); setTaskViewMode('inbox'); }}
              onGoToMatrix={() => { setActiveSection('tasks'); setTaskViewMode('matrix'); }}
              onNavigateSection={(sec) => setActiveSection(sec)}
              onOpenCopilot={(prompt) => {
                setCopilotPrompt(prompt);
                setShowCopilot(true);
              }}
            />
          )}
          {activeSection === "inbox" && <InboxView onEditTask={(task) => { setEditingTask(task); setShowTaskModal(true); }} />}
          {(activeSection === "projects" || activeSection === "goals") && (
            <ProjectsView 
              onEditTask={(task) => { setEditingTask(task); setShowTaskModal(true); }}
              onNewGoal={() => { setEditingTask(undefined); setTaskModalType('goal'); setShowTaskModal(true); }}
              onNewProject={() => { setEditingTask(undefined); setTaskModalType('project'); setShowTaskModal(true); }}
              onNewTaskInProject={() => { setEditingTask(undefined); setTaskModalType('task'); setShowTaskModal(true); }}
            />
          )}
          {activeSection === "import" && <ImportView />}
          {activeSection === "settings" && <SettingsView />}
          {(activeSection === "analytics" || activeSection === "review") && <WeeklyReview />}
          {activeSection === "trash" && <TrashView />}
        </div>
        
        {/* Mobile Fixed Bottom Navigation Bar - Exactly 4 Core Workspaces + Central Capture */}
        {isMobile && (
          <nav 
            className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-[#05080C] border-t border-slate-200 dark:border-[#1E293B] flex items-center justify-around z-35 px-2 pb-[env(safe-area-inset-bottom,0px)] shadow-lg"
          >
            {/* 1. To-do list */}
            <button
              type="button"
              onClick={() => setActiveSection("tasks")}
              className={`flex flex-col items-center gap-1 bg-transparent border-0 cursor-pointer p-1.5 min-w-[52px] transition-colors ${
                activeSection === "tasks" 
                  ? "text-orange-500 dark:text-orange-400 font-bold" 
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
              }`}
            >
              <CheckSquare size={19} strokeWidth={activeSection === "tasks" ? 2.5 : 1.8} />
              <span className="text-[10px] tracking-tight">To-do</span>
            </button>

            {/* 2. My Notes */}
            <button
              type="button"
              onClick={() => setActiveSection("notes")}
              className={`flex flex-col items-center gap-1 bg-transparent border-0 cursor-pointer p-1.5 min-w-[52px] transition-colors ${
                activeSection === "notes" 
                  ? "text-orange-500 dark:text-orange-400 font-bold" 
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
              }`}
            >
              <BookOpen size={19} strokeWidth={activeSection === "notes" ? 2.5 : 1.8} />
              <span className="text-[10px] tracking-tight">My Notes</span>
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
              className="w-12 h-12 rounded-full -translate-y-3 bg-linear-to-r from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/35 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-[#05080C] shrink-0"
            >
              <Plus size={22} strokeWidth={2.8} />
            </button>

            {/* 4. Mind Map & Graph */}
            <button
              type="button"
              onClick={() => setActiveSection("mindmap")}
              className={`flex flex-col items-center gap-1 bg-transparent border-0 cursor-pointer p-1.5 min-w-[52px] transition-colors ${
                activeSection === "mindmap" 
                  ? "text-orange-500 dark:text-orange-400 font-bold" 
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
              }`}
            >
              <GitBranch size={19} strokeWidth={activeSection === "mindmap" ? 2.5 : 1.8} />
              <span className="text-[10px] tracking-tight">Mind Map</span>
            </button>

            {/* 5. Smart AI Organizer */}
            <button
              type="button"
              onClick={() => setActiveSection("organizer")}
              className={`flex flex-col items-center gap-1 bg-transparent border-0 cursor-pointer p-1.5 min-w-[52px] transition-colors ${
                activeSection === "organizer" 
                  ? "text-orange-500 dark:text-orange-400 font-bold" 
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
              }`}
            >
              <Wand2 size={19} strokeWidth={activeSection === "organizer" ? 2.5 : 1.8} />
              <span className="text-[10px] tracking-tight">Organizer</span>
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

      {/* Floating SANKALP AI Copilot Toggle Pill */}
      <button
        type="button"
        onClick={() => {
          setCopilotPrompt(undefined);
          setShowCopilot(prev => !prev);
        }}
        className="fixed bottom-[74px] sm:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-linear-to-r from-orange-500 to-amber-500 text-white text-xs font-black shadow-[0_4px_20px_rgba(249,115,22,0.4)] hover:shadow-[0_6px_28px_rgba(249,115,22,0.55)] active:scale-95 transition-all cursor-pointer border border-white/20 select-none"
        title="Toggle SANKALP AI Copilot"
      >
        <Sparkles size={15} />
        <span className="hidden sm:inline font-mono">SANKALP AI</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </button>

      {/* Prahari Antigravity AI Copilot Dock / Slide-out Chat */}
      <PrahariCopilotChat
        isOpen={showCopilot}
        onClose={() => setShowCopilot(false)}
        initialPrompt={copilotPrompt}
        isDocked={copilotDocked}
        onToggleDock={() => setCopilotDocked(prev => !prev)}
      />

      {/* Global Focus Flow Cockpit Modal */}
      {showFlowModal && (
        <FlowCockpitModal
          task={flowFocusTask}
          isOpen={showFlowModal}
          onClose={() => setShowFlowModal(false)}
        />
      )}

      {/* Global Evening Chronicle Modal */}
      {showJournalModal && (
        <EveningChronicleModal
          isOpen={showJournalModal}
          onClose={() => setShowJournalModal(false)}
        />
      )}
    </div>
  );
}
