import { useEffect, useState } from 'react';
import { useStore } from './store';
import { Dashboard } from './components/Dashboard';
import { TaskModal } from './components/TaskModal';
import { lazy, Suspense } from 'react';
import { ListView, TrashView, InboxView } from './components/Views';
import { NotesView } from './components/NotesView';
import { ImportView } from './components/ImportView';
import { SettingsView } from './components/SettingsView';
import { SmartOrganizer } from './components/SmartOrganizer';
import { WeeklyReview } from './components/WeeklyReview';

const MindMap = lazy(() => import('./components/MindMap').then(m => ({ default: m.MindMap })));
import { PILLARS, FONT_URL } from './theme/tokens';
import type { PillarId } from './theme/tokens';
import type { Item } from './types';
import { Plus, LayoutDashboard, FileText, GitBranch, ChevronLeft, User, LogOut, List as ListIcon, Trash2, Inbox, Download, Settings, Wand2, CalendarCheck } from 'lucide-react';

const SECTIONS = [
  { id: "inbox",      label: "Inbox",          Icon: Inbox,           color: "#fff" },
  { id: "tasks",      label: "Dashboard",      Icon: LayoutDashboard, color: "#4d9eff" },
  { id: "notes",      label: "Notes",          Icon: FileText,        color: "#00d97e" },
  { id: "mindmap",    label: "Mind Map",       Icon: GitBranch,       color: "#b57bff" },
  { id: "organizer",  label: "Smart Organizer",Icon: Wand2,           color: "#00d97e" },
  { id: "review",     label: "Weekly Review",  Icon: CalendarCheck,   color: "#b57bff" },
  { id: "import",     label: "Import",         Icon: Download,        color: "#fbbf24" },
  { id: "settings",   label: "Settings",       Icon: Settings,        color: "#a0a0c0" },
  { id: "trash",      label: "Trash / Archive",Icon: Trash2,          color: "#ff4d7e" },
] as const;

export default function App() {
  const { isLoaded, init, user, setUser, addItem, updateItem, showPrivate } = useStore();

  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("tasks");
  const [activePillar, setActivePillar] = useState<PillarId>("physical");
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Item | undefined>(undefined);
  const [newTaskQuadrant, setNewTaskQuadrant] = useState<any>("do");
  
  const [today] = useState(() => new Date().toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" }));

  useEffect(() => {
    init();
    
    const handleSyncPull = () => {
      init();
    };
    window.addEventListener('lifeos-sync-pull', handleSyncPull);

    const link = document.createElement("link");
    link.href = FONT_URL; link.rel = "stylesheet";
    document.head.appendChild(link);
    
    const check = () => {
      const m = window.innerWidth < 700;
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
      if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' || (document.activeElement as HTMLElement)?.isContentEditable;
        if (isInput) return; // Ignore if user is typing
        
        e.preventDefault();
        setEditingTask(undefined);
        setNewTaskQuadrant('do');
        // Setting state uses a callback to ensure we get the latest state without missing deps
        setShowTaskModal(prev => {
          if (prev) return prev; // Ignore if modal already open
          return true;
        });
      }
    };
    window.addEventListener('keydown', handleGlobalKey);

    return () => { 
      window.removeEventListener('keydown', handleGlobalKey);
    };
  }, []);

  if (!isLoaded) return <div style={{ background: "#07070f", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#4d9eff", fontFamily: "monospace", fontSize: 12, letterSpacing: 3 }}>LOADING...</div>;

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#07070f", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <button onClick={() => setUser({ name: "User", email: "user@example.com" })} style={{ padding: "12px 24px", background: "#4d9eff", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
          Quick Login (Phase 1/2)
        </button>
      </div>
    );
  }

  const handleSaveTask = (data: Partial<Item>) => {
    if (editingTask) {
      updateItem(editingTask.id, data);
    } else {
      addItem(data as Omit<Item, 'id' | 'createdAt' | 'updatedAt'>);
    }
    setShowTaskModal(false);
  };

  const pillar = PILLARS.find(p => p.id === activePillar)!;
  const items = useStore.getState().items;
  const pt = items.filter(t => t.type === 'task' && !t.deletedAt);
  const doneTasks = pt.filter(t => t.status === 'done').length;
  const pct = pt.length ? Math.round((doneTasks / pt.length) * 100) : 0;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#07070f", color: "#dde0f0", fontFamily: "'Outfit', sans-serif", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${activeSection === "tasks" ? pillar.glow : "rgba(181,123,255,0.15)"} 0%, transparent 65%)`, transition: "background 0.7s" }} />
      </div>

      {isMobile && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 19, backdropFilter: "blur(4px)" }} />}

      <aside style={{ width: isMobile ? (sidebarOpen ? "82vw" : 0) : (sidebarOpen ? 240 : 0), flexShrink: 0, background: "rgba(9,9,19,0.98)", borderRight: sidebarOpen ? "1px solid rgba(255,255,255,0.06)" : "none", display: "flex", flexDirection: "column", zIndex: isMobile ? 20 : 10, backdropFilter: "blur(24px)", overflow: "hidden", transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)", position: isMobile ? "fixed" : "relative", top: 0, left: 0, height: "100vh" }}>
        <div style={{ width: isMobile ? "82vw" : 240, height: "100%", display: "flex", flexDirection: "column", padding: sidebarOpen ? "16px 0" : 0, opacity: sidebarOpen ? 1 : 0, transition: "opacity 0.15s", pointerEvents: sidebarOpen ? "auto" : "none" }}>
          
          <div style={{ padding: "0 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: "#fff", letterSpacing: 3 }}>{user.name.toUpperCase()}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: "#252548", letterSpacing: 3, marginTop: 2 }}>LIFE OPERATING SYSTEM</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: "#303055", marginTop: 5 }}>{today}</div>
            </div>
            {isMobile && (
              <button aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#8080a0", cursor: "pointer", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronLeft size={14} />
              </button>
            )}
          </div>

          <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: "#404060", marginBottom: 6 }}>
              <span>TASK PROGRESS</span><span style={{ color: "#4d9eff" }}>{pct}%</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#4d9eff,#b57bff)", borderRadius: 4, transition: "width 0.6s" }} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#8080a0", fontSize: 11, cursor: "pointer", userSelect: "none" }}>
              <input type="checkbox" checked={showPrivate} onChange={e => useStore.getState().setShowPrivate(e.target.checked)} />
              Show Private Items
            </label>
          </div>

          <div style={{ padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => { setActiveSection(s.id); if(isMobile) setSidebarOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: activeSection === s.id ? "rgba(255,255,255,0.04)" : "transparent", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}>
                <s.Icon size={16} color={activeSection === s.id ? s.color : "#505070"} strokeWidth={activeSection === s.id ? 2 : 1.5} />
                <span style={{ fontSize: 12, fontWeight: 600, color: activeSection === s.id ? s.color : "#7070a0" }}>{s.label}</span>
              </button>
            ))}
          </div>

          {activeSection === "tasks" && (
            <nav style={{ flex: 1, padding: "8px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: "#252545", letterSpacing: 2, marginBottom: 4, paddingLeft: 4 }}>LIFE PILLARS</div>
              {PILLARS.map((p: any) => {
                const isA = activePillar === p.id;
                return (
                  <button key={p.id} onClick={() => { setActivePillar(p.id as PillarId); if(isMobile) setSidebarOpen(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 9, border: `1px solid ${isA ? p.color + "35" : "transparent"}`, background: isA ? p.bg : "transparent", cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.2s" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: isA ? p.color : "#7070a0" }}>{p.name}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          )}

          {activeSection !== "tasks" && <div style={{ flex: 1 }} />}

          <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#4d9eff,#b57bff)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <User size={13} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#c0c0d8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
            </div>
            <button aria-label="Sign out" onClick={() => setUser(null)} style={{ background: "transparent", border: "none", color: "#303055", cursor: "pointer", padding: 4, borderRadius: 6, transition: "color 0.15s" }}>
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", position: "relative", zIndex: 1, overflow: "hidden" }}>
        
        <header style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.04)", backdropFilter: "blur(12px)", background: "rgba(7,7,15,0.7)", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {(!sidebarOpen || isMobile) && (
              <button aria-label="Open menu" onClick={() => setSidebarOpen(true)} style={{ background: "transparent", border: "none", color: "#a0a0c0", cursor: "pointer", padding: 4 }}>
                <LayoutDashboard size={18} />
              </button>
            )}
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: activeSection === "tasks" ? pillar.color : "#fff" }}>
              {activeSection === "tasks" ? pillar.name : activeSection === "notes" ? "Notes" : activeSection === "mindmap" ? "Mind Map" : activeSection === "inbox" ? "Inbox" : "Trash"}
            </div>
          </div>
          
          {(activeSection === "tasks" || activeSection === "inbox") && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {activeSection === "tasks" && (
                <div style={{ display: "flex", background: "rgba(0,0,0,0.5)", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <button onClick={() => setViewMode('matrix')} style={{ background: viewMode === 'matrix' ? "rgba(255,255,255,0.1)" : "transparent", color: viewMode === 'matrix' ? "#fff" : "#606080", border: "none", padding: "6px 10px", cursor: "pointer" }}><LayoutDashboard size={14} /></button>
                  <button onClick={() => setViewMode('list')} style={{ background: viewMode === 'list' ? "rgba(255,255,255,0.1)" : "transparent", color: viewMode === 'list' ? "#fff" : "#606080", border: "none", padding: "6px 10px", cursor: "pointer" }}><ListIcon size={14} /></button>
                </div>
              )}
              <button onClick={() => { setEditingTask(undefined); setNewTaskQuadrant('do'); setShowTaskModal(true); }} style={{ background: activeSection === "inbox" ? "#fff" : pillar.color, border: "none", borderRadius: 10, padding: "8px 16px", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Plus size={14} strokeWidth={2.5} /> <span style={{ display: isMobile ? "none" : "inline" }}>Capture (C)</span>
              </button>
            </div>
          )}
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 24, paddingBottom: 100 }}>
          {activeSection === "inbox" && <InboxView onEditTask={(task) => { setEditingTask(task); setShowTaskModal(true); }} />}
          {activeSection === "tasks" && viewMode === 'matrix' && (
            <Dashboard 
              activePillar={activePillar} 
              isMobile={isMobile} 
              onAddTaskClick={(q) => { setEditingTask(undefined); setNewTaskQuadrant(q); setShowTaskModal(true); }}
              onEditTask={(task) => { setEditingTask(task); setShowTaskModal(true); }}
            />
          )}
          {activeSection === "tasks" && viewMode === 'list' && (
            <ListView 
              onEditTask={(task) => { setEditingTask(task); setShowTaskModal(true); }}
            />
          )}
          {activeSection === "notes" && <NotesView onEditTask={(task) => { setEditingTask(task); setShowTaskModal(true); }} />}
          {activeSection === "mindmap" && (
            <Suspense fallback={<div style={{ color: "#a0a0c0", padding: 20 }}>Loading Mind Map...</div>}>
              <MindMap onEditTask={(task) => { setEditingTask(task); setShowTaskModal(true); }} />
            </Suspense>
          )}
          {activeSection === "import" && <ImportView />}
          {activeSection === "settings" && <SettingsView />}
          {activeSection === "organizer" && <SmartOrganizer />}
          {activeSection === "review" && <WeeklyReview />}
          {activeSection === "trash" && <TrashView />}
        </div>
        
        {/* Mobile floating button */}
        {isMobile && !showTaskModal && (
          <button 
            onClick={() => { setEditingTask(undefined); setNewTaskQuadrant('do'); setShowTaskModal(true); }}
            style={{ position: "fixed", bottom: 20, right: 20, width: 56, height: 56, borderRadius: "50%", background: activeSection === 'tasks' ? pillar.color : "#4d9eff", color: "#000", border: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 20px rgba(0,0,0,0.5)", zIndex: 50 }}
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        )}
      </main>

      {showTaskModal && (
        <TaskModal 
          initialTask={editingTask}
          defaultPillar={activePillar}
          defaultQuadrant={newTaskQuadrant}
          onSave={handleSaveTask}
          onClose={() => setShowTaskModal(false)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
