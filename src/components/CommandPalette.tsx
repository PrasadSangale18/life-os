import { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../store';
import type { Item } from '../types';
import { 
  Search, 
  LayoutDashboard, 
  Inbox, 
  FileText, 
  GitBranch, 
  Wand2, 
  CalendarCheck, 
  Settings, 
  Trash2, 
  Plus, 
  Lock, 
  Globe, 
  ArrowRight,
  CheckCircle2,
  Target,
  X,
  Sparkles,
  Flame
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
  onOpenCapture: () => void;
  onEditItem: (item: Item) => void;
}

export const CommandPalette = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenCapture,
  onEditItem
}: CommandPaletteProps) => {
  const items = useStore(state => state.items);
  const showPrivate = useStore(state => state.showPrivate);
  const setShowPrivate = useStore(state => state.setShowPrivate);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevQuery, setPrevQuery] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }

  if (query !== prevQuery) {
    setPrevQuery(query);
    setSelectedIndex(0);
  }

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Static commands
  const commands = useMemo(() => [
    { id: 'nav-dashboard', label: 'Dashboard (Command Center)', category: 'Core Workspaces', icon: LayoutDashboard, action: () => onNavigate('dashboard') },
    { id: 'nav-tasks', label: 'To-do list (Eisenhower Matrix)', category: 'Core Workspaces', icon: LayoutDashboard, action: () => onNavigate('tasks') },
    { id: 'nav-list', label: 'Task List View', category: 'Task Views', icon: LayoutDashboard, action: () => onNavigate('list') },
    { id: 'nav-projects', label: 'Projects & Goals', category: 'Task Views', icon: Target, action: () => onNavigate('projects') },
    { id: 'nav-habits', label: 'Habits & Routines (Atomic Momentum)', category: 'Core Workspaces', icon: Flame, action: () => onNavigate('habits') },
    { id: 'nav-inbox', label: 'Inbox Queue', category: 'Task Views', icon: Inbox, action: () => onNavigate('inbox') },
    { id: 'nav-notes', label: 'My Notes (Rich Ideas & Notes)', category: 'Core Workspaces', icon: FileText, action: () => onNavigate('notes') },
    { id: 'nav-mindmap', label: 'Canvas & Graph (Visual Second Brain)', category: 'Core Workspaces', icon: GitBranch, action: () => onNavigate('mindmap') },
    { id: 'nav-organizer', label: 'Smart AI Organizer (Bulk Intake)', category: 'Core Workspaces', icon: Wand2, action: () => onNavigate('organizer') },
    { id: 'nav-review', label: 'Weekly Review', category: 'Utilities & Review', icon: CalendarCheck, action: () => onNavigate('review') },
    { id: 'nav-settings', label: 'Settings & Storage', category: 'Utilities & Review', icon: Settings, action: () => onNavigate('settings') },
    { id: 'nav-trash', label: 'Trash & Archive', category: 'Utilities & Review', icon: Trash2, action: () => onNavigate('trash') },
    { id: 'act-capture', label: 'Quick Capture Item', category: 'Actions', icon: Plus, action: () => onOpenCapture() },
    { id: 'act-private', label: showPrivate ? 'Hide Private Items' : 'Show Private Items', category: 'Actions', icon: showPrivate ? Globe : Lock, action: () => setShowPrivate(!showPrivate) }
  ], [onNavigate, onOpenCapture, showPrivate, setShowPrivate]);

  // Search results
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(c => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
  }, [commands, query]);

  const searchedItems = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return items
      .filter(i => !i.deletedAt && !i.isArchived && (showPrivate || !i.isPrivate))
      .filter(i => 
        i.title.toLowerCase().includes(q) || 
        (i.body && i.body.toLowerCase().includes(q)) ||
        (i.tags && i.tags.some(t => t.toLowerCase().includes(q))) ||
        i.type.toLowerCase().includes(q) ||
        (i.category && i.category.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [items, query, showPrivate]);

  // Conversational Personal RAG synthesis
  const aiSynthesis = useMemo(() => {
    if (!query.trim() || query.length < 3) return null;
    const qLower = query.toLowerCase();

    const matched = items.filter(i => 
      !i.deletedAt && !i.isArchived && (showPrivate || !i.isPrivate) &&
      (i.title.toLowerCase().includes(qLower) || (i.body && i.body.toLowerCase().includes(qLower)) || (i.tags && i.tags.some(t => t.toLowerCase().includes(qLower))))
    );

    if (matched.length === 0) return null;

    const taskCount = matched.filter(m => m.type === 'task').length;
    const noteCount = matched.filter(m => m.type === 'note').length;
    const topItems = matched.slice(0, 3);

    let summaryText = `Found ${matched.length} related records across your SANKALP workspace (${taskCount} tasks, ${noteCount} notes).`;
    if (qLower.includes('workout') || qLower.includes('fitness') || qLower.includes('gym')) {
      summaryText = `Physical Dimension: You have ${matched.length} active records tracking workouts, health, and fitness goals.`;
    } else if (qLower.includes('finance') || qLower.includes('money') || qLower.includes('tax')) {
      summaryText = `Financial Dimension: Found ${matched.length} items covering financial milestones, budgets, and tax actions.`;
    } else if (qLower.includes('habit') || qLower.includes('routine')) {
      summaryText = `Habits Engine: Tracking your daily recurring momentum loops and streaks.`;
    } else if (topItems[0]?.body) {
      const excerpt = topItems[0].body.slice(0, 140).replace(/[\n\r]+/g, ' ');
      summaryText = `Direct Knowledge Match from "${topItems[0].title}": "${excerpt}..."`;
    }

    return {
      summary: summaryText,
      sources: topItems
    };
  }, [items, query, showPrivate]);

  const totalResults = filteredCommands.length + searchedItems.length;


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (totalResults || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalResults) % (totalResults || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex < filteredCommands.length) {
          filteredCommands[selectedIndex].action();
          onClose();
        } else {
          const itemIdx = selectedIndex - filteredCommands.length;
          if (searchedItems[itemIdx]) {
            onEditItem(searchedItems[itemIdx]);
            onClose();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, totalResults, filteredCommands, searchedItems, onClose, onEditItem]);

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      style={{ 
        position: "fixed", 
        inset: 0, 
        background: "rgba(5, 6, 9, 0.75)", 
        backdropFilter: "blur(8px)", 
        zIndex: 200, 
        display: "flex", 
        alignItems: "flex-start", 
        justifyContent: "center", 
        paddingTop: "14vh",
        paddingLeft: 16,
        paddingRight: 16
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="glass-panel-elevated"
        style={{ 
          width: "100%", 
          maxWidth: 580, 
          borderRadius: 14, 
          border: "1px solid var(--border-strong)", 
          background: "var(--bg-surface)",
          boxShadow: "var(--shadow-modal)", 
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Search header */}
        <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", gap: 10, borderBottom: "1px solid var(--border-subtle)" }}>
          <Search size={16} color="var(--accent-hover)" />
          <input 
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search your workspace..."
            style={{ 
              flex: 1, 
              background: "transparent", 
              border: "none", 
              color: "var(--text-primary)", 
              fontSize: 15, 
              fontWeight: 450,
              outline: "none" 
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="btn-ghost" style={{ padding: 4 }}>
              <X size={14} />
            </button>
          )}
          <kbd style={{ fontSize: 10 }}>ESC</kbd>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: 380, overflowY: "auto", padding: "8px 6px" }}>
          {/* Ask Life OS Copilot Synthesis */}
          {aiSynthesis && (
            <div 
              style={{
                margin: "4px 6px 12px 6px",
                padding: "10px 12px",
                borderRadius: 10,
                background: "linear-gradient(135deg, rgba(255, 90, 31, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)",
                border: "1px solid rgba(255, 90, 31, 0.25)",
                display: "flex",
                flexDirection: "column",
                gap: 8
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--accent-hover)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <Sparkles size={13} />
                <span>Ask SANKALP Copilot</span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, color: "var(--text-primary)" }}>
                {aiSynthesis.summary}
              </p>
              {aiSynthesis.sources.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, paddingTop: 2 }}>
                  <span style={{ fontSize: 10, color: "var(--text-tertiary)", fontWeight: 500 }}>Linked context:</span>
                  {aiSynthesis.sources.map(src => (
                    <button
                      key={src.id}
                      onClick={() => { onEditItem(src); onClose(); }}
                      className="btn-ghost"
                      style={{
                        padding: "2px 7px",
                        borderRadius: 6,
                        fontSize: 10.5,
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {src.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Commands */}
          {filteredCommands.length > 0 && (
            <div style={{ marginBottom: searchedItems.length > 0 ? 8 : 0 }}>
              <div className="text-label" style={{ fontSize: 10, padding: "6px 12px", color: "var(--text-tertiary)" }}>
                Commands & Navigation
              </div>
              {filteredCommands.map((c, idx) => {
                const isSelected = selectedIndex === idx;
                const Icon = c.icon;
                return (
                  <div 
                    key={c.id}
                    onClick={() => { c.action(); onClose(); }}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between",
                      padding: "9px 12px", 
                      borderRadius: 8, 
                      background: isSelected ? "var(--bg-surface-elevated)" : "transparent",
                      color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                      cursor: "pointer",
                      transition: "all 0.12s ease"
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Icon size={14} color={isSelected ? "var(--accent-hover)" : "var(--text-tertiary)"} />
                      <span style={{ fontSize: 13.5, fontWeight: isSelected ? 600 : 450 }}>{c.label}</span>
                    </div>
                    <span className="text-meta" style={{ fontSize: 11, opacity: 0.6 }}>{c.category}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Items */}
          {searchedItems.length > 0 && (
            <div>
              <div className="text-label" style={{ fontSize: 10, padding: "6px 12px", color: "var(--text-tertiary)" }}>
                Matching Items ({searchedItems.length})
              </div>
              {searchedItems.map((item, idx) => {
                const actualIndex = filteredCommands.length + idx;
                const isSelected = selectedIndex === actualIndex;
                return (
                  <div 
                    key={item.id}
                    onClick={() => { onEditItem(item); onClose(); }}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between",
                      padding: "9px 12px", 
                      borderRadius: 8, 
                      background: isSelected ? "var(--bg-surface-elevated)" : "transparent",
                      color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                      cursor: "pointer",
                      transition: "all 0.12s ease"
                    }}
                    onMouseEnter={() => setSelectedIndex(actualIndex)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                      {item.type === 'task' ? (
                        <CheckCircle2 size={14} color="#3b82f6" />
                      ) : (item.type === 'project' || item.type === 'goal') ? (
                        <Target size={14} color="#f59e0b" />
                      ) : (
                        <FileText size={14} color="#10b981" />
                      )}
                      <span style={{ fontSize: 13.5, fontWeight: isSelected ? 600 : 450, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.title}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span className="ui-pill" style={{ fontSize: 9.5, textTransform: "capitalize" }}>
                        {item.type}
                      </span>
                      <ArrowRight size={12} color="var(--text-tertiary)" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalResults === 0 && (
            <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
              No commands or items matching &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--text-secondary)", background: "var(--bg-surface-elevated)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span>
            <span><kbd>↵</kbd> select</span>
          </div>
          <span><kbd>⌘K</kbd> to toggle</span>
        </div>
      </div>
    </div>
  );
};
