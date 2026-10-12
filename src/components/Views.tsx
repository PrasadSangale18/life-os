import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { PILLARS, QUADRANTS } from '../theme/tokens';
import type { PillarId } from '../theme/tokens';
import { Check, Edit3, Trash2, ArrowUpCircle, Search, Clock, Calendar, Hash, Inbox, AlertCircle, X } from 'lucide-react';
import type { Item, QuadrantId, ItemType } from '../types';

import { filterAndSortTasks } from '../utils/filterSort';
import { selectInboxItems } from '../utils/selectors';

export const ListView = ({ onEditTask }: { onEditTask: (item: Item) => void }) => {
  const items = useStore(state => state.items);
  const toggleTaskStatus = useStore(state => state.toggleTaskStatus);
  const trashItem = useStore(state => state.trashItem);
  
  const [search, setSearch] = useState('');
  const [filterPillar, setFilterPillar] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterDeadline, setFilterDeadline] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'easy-short' | 'hard-long' | 'deadline' | 'newest'>('newest');
  const [now] = useState(() => Date.now());

  const showPrivate = useStore(state => state.showPrivate);
  const tasks = useMemo(() => items.filter(t => t.type === 'task' && !t.deletedAt && !t.isArchived && t.pillar && t.quadrant && (showPrivate || !t.isPrivate)), [items, showPrivate]);

  const displayTasks = useMemo(() => {
    return filterAndSortTasks(
      tasks, 
      { search, pillar: filterPillar, status: filterStatus, difficulty: filterDifficulty, deadline: filterDeadline, showPrivate },
      sortOption
    );
  }, [tasks, search, filterPillar, filterStatus, filterDifficulty, filterDeadline, sortOption, showPrivate]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Search & Filters Toolbar */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: "14px 16px", 
          display: "flex", 
          flexDirection: "column", 
          gap: 12,
          background: "var(--bg-surface)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-surface-elevated)", padding: "7px 12px", borderRadius: 8, border: "1px solid var(--border-default)" }}>
          <Search size={15} color="var(--text-tertiary)" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search tasks by title or body..." 
            style={{ flex: 1, background: "transparent", border: "none", color: "var(--text-primary)", outline: "none", fontSize: 13 }} 
          />
          {search && (
            <button onClick={() => setSearch('')} className="btn-ghost" style={{ padding: 2, color: "var(--text-tertiary)" }}>
              <X size={14} />
            </button>
          )}
        </div>
        
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select value={filterPillar} onChange={e => setFilterPillar(e.target.value)} className="ui-select">
            <option value="all">All Pillars</option>
            {PILLARS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="ui-select">
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="doing">Doing</option>
            <option value="waiting">Waiting</option>
            <option value="done">Done</option>
            <option value="dropped">Dropped</option>
          </select>
          <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} className="ui-select">
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <select value={filterDeadline} onChange={e => setFilterDeadline(e.target.value)} className="ui-select">
            <option value="all">All Deadlines</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due Today</option>
            <option value="this-week">Due This Week</option>
            <option value="none">No Deadline</option>
          </select>
          <select value={sortOption} onChange={e => setSortOption(e.target.value as any)} className="ui-select" style={{ marginLeft: "auto", border: "1px solid var(--border-strong)" }}>
            <option value="newest">Sort: Newest</option>
            <option value="easy-short">Sort: Easy/Short First</option>
            <option value="hard-long">Sort: Hard/Long First</option>
            <option value="deadline">Sort: Deadline</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {displayTasks.map(task => {
          const pObj = PILLARS.find(p => p.id === task.pillar);
          const pillarColor = pObj?.color || "var(--accent-primary)";
          const isDone = task.status === 'done';
          const isOverdue = task.deadline && task.deadline < now && !isDone;

          return (
            <div 
              key={task.id} 
              className="glass-panel" 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 12, 
                padding: "10px 14px", 
                borderRadius: 9, 
                background: isDone ? "rgba(12, 14, 22, 0.45)" : "rgba(16, 19, 28, 0.75)" 
              }}
            >
              {/* Checkbox */}
              <button 
                onClick={() => toggleTaskStatus(task.id)} 
                aria-label="Toggle task"
                style={{ 
                  width: 18, 
                  height: 18, 
                  borderRadius: 5, 
                  border: `1.5px solid ${isDone ? pillarColor : "rgba(255,255,255,0.2)"}`, 
                  background: isDone ? pillarColor : "transparent", 
                  flexShrink: 0, 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  transition: "all 0.15s ease",
                  padding: 0
                }}
              >
                {isDone && <Check size={11} color="#000" strokeWidth={3} />}
              </button>

              {/* Title & Metadata */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div 
                  style={{ 
                    fontSize: 14, 
                    fontWeight: isDone ? 400 : 450, 
                    color: isDone ? "var(--text-tertiary)" : "var(--text-primary)", 
                    textDecoration: isDone ? "line-through" : "none",
                    letterSpacing: "-0.01em"
                  }}
                >
                  {task.title}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 4 }}>
                  {task.pillar && (
                    <span className="ui-pill" style={{ color: pillarColor, borderColor: `${pillarColor}33`, fontSize: 10 }}>
                      {task.pillar.toUpperCase()}
                    </span>
                  )}
                  {task.quadrant && (
                    <span className="ui-pill" style={{ fontSize: 10 }}>
                      {task.quadrant.toUpperCase()}
                    </span>
                  )}
                  {task.difficulty && (
                    <span className="ui-pill" style={{ fontSize: 10 }}>
                      {task.difficulty}
                    </span>
                  )}
                  {task.estMinutes && (
                    <span className="ui-pill" style={{ fontSize: 10, gap: 3 }}>
                      <Clock size={10} />
                      <span className="tabular-nums">{task.estMinutes}m</span>
                    </span>
                  )}
                  {task.deadline && (
                    <span 
                      className="ui-pill" 
                      style={{ 
                        fontSize: 10, 
                        gap: 3, 
                        color: isOverdue ? "#f43f5e" : "var(--text-secondary)",
                        borderColor: isOverdue ? "rgba(244,63,94,0.3)" : "var(--border-subtle)"
                      }}
                    >
                      <Calendar size={10} />
                      <span className="tabular-nums">{new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </span>
                  )}
                  {task.projectId && (
                    <span className="ui-pill" style={{ fontSize: 10, gap: 2, color: "var(--accent-hover)" }}>
                      <Hash size={10} />
                      <span>{task.projectId}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button 
                  onClick={() => onEditTask(task)} 
                  className="btn-ghost" 
                  style={{ padding: 6, borderRadius: 6, color: "var(--text-secondary)" }}
                  title="Edit task"
                >
                  <Edit3 size={14} />
                </button>
                <button 
                  onClick={() => trashItem(task.id)} 
                  className="btn-ghost" 
                  style={{ padding: 6, borderRadius: 6, color: "var(--text-secondary)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#f43f5e"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}
                  title="Move to trash"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {displayTasks.length === 0 && (
          <div className="glass-panel" style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "48px 24px", fontSize: 13 }}>
            No tasks match the active filters or search query.
          </div>
        )}
      </div>
    </div>
  );
};

export const InboxView = ({ onEditTask }: { onEditTask: (item: Item) => void }) => {
  const items = useStore(state => state.items);
  const updateItem = useStore(state => state.updateItem);
  const trashItem = useStore(state => state.trashItem);

  const showPrivate = useStore(state => state.showPrivate);
  const inboxItems = selectInboxItems(items, showPrivate);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header bar */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: "16px 20px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          background: "var(--bg-surface)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Inbox size={15} color="var(--text-secondary)" />
          </div>
          <div>
            <div className="card-title" style={{ fontSize: 16 }}>Inbox ({inboxItems.length})</div>
            <div className="text-secondary" style={{ fontSize: 12 }}>Items awaiting triage and assignment to your operating system.</div>
          </div>
        </div>
      </div>

      {/* Items list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {inboxItems.map(item => (
          <div 
            key={item.id} 
            className="glass-panel" 
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: 10, 
              padding: "14px 16px", 
              background: "rgba(16, 19, 28, 0.75)" 
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ fontSize: 14.5, color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.4 }}>
                {item.title}
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button 
                  onClick={() => onEditTask(item)} 
                  className="btn-ghost" 
                  style={{ padding: 4, color: "var(--accent-hover)" }}
                  title="Edit item"
                >
                  <Edit3 size={14} />
                </button>
                <button 
                  onClick={() => trashItem(item.id)} 
                  className="btn-ghost" 
                  style={{ padding: 4, color: "#f43f5e" }}
                  title="Delete item"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            
            {/* Quick assignment controls */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: 10 }}>
              <span className="text-label" style={{ fontSize: 10, marginRight: 2 }}>Quick Set:</span>
              
              <select 
                value={item.type} 
                onChange={e => updateItem(item.id, { type: e.target.value as ItemType, quadrant: undefined })} 
                className="ui-select"
              >
                <option value="task">Task</option>
                <option value="project">Project</option>
                <option value="goal">Goal</option>
                <option value="idea">Idea</option>
                <option value="knowledge">Knowledge</option>
              </select>
              
              <select 
                value={item.pillar || ''} 
                onChange={e => updateItem(item.id, { pillar: e.target.value as PillarId })} 
                className="ui-select"
              >
                <option value="" disabled>Select Pillar</option>
                {PILLARS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>

              {item.type === 'task' && (
                <select 
                  value={item.quadrant || ''} 
                  onChange={e => updateItem(item.id, { quadrant: e.target.value as QuadrantId })} 
                  className="ui-select"
                >
                  <option value="" disabled>Select Quadrant</option>
                  {QUADRANTS.map(q => <option key={q.id} value={q.id}>{q.name} ({q.label})</option>)}
                </select>
              )}
            </div>
          </div>
        ))}

        {inboxItems.length === 0 && (
          <div className="glass-panel" style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "48px 24px", fontSize: 13 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(16,185,129,0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Check size={18} strokeWidth={2.5} />
            </div>
            <div style={{ color: "var(--text-primary)", fontWeight: 550, marginBottom: 4 }}>Inbox Zero</div>
            <div>All captured thoughts are organized into pillars. Press <kbd>C</kbd> to quick-capture anytime.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export const TrashView = () => {
  const items = useStore(state => state.items);
  const restoreItem = useStore(state => state.restoreItem);
  const unarchiveItem = useStore(state => state.unarchiveItem);
  const hardDeleteItem = useStore(state => state.hardDeleteItem);

  const [tab, setTab] = useState<'trash' | 'archive'>('trash');

  const trashed = items.filter(t => t.deletedAt);
  const archived = items.filter(t => t.isArchived && !t.deletedAt);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Tab Switcher & Banner */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: "14px 18px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          background: "var(--bg-surface)"
        }}
      >
        <div className="segmented-nav">
          <button 
            onClick={() => setTab('trash')} 
            className={`segmented-nav-btn ${tab === 'trash' ? 'active' : ''}`}
          >
            <span>Trash</span>
            <span className="tabular-nums" style={{ fontSize: 10, opacity: 0.7 }}>({trashed.length})</span>
          </button>
          <button 
            onClick={() => setTab('archive')} 
            className={`segmented-nav-btn ${tab === 'archive' ? 'active' : ''}`}
          >
            <span>Archive</span>
            <span className="tabular-nums" style={{ fontSize: 10, opacity: 0.7 }}>({archived.length})</span>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-tertiary)" }}>
          <AlertCircle size={14} />
          <span>Trash items older than 30 days are automatically purged on launch.</span>
        </div>
      </div>

      {/* Items list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tab === 'trash' && trashed.map(item => (
          <div 
            key={item.id} 
            className="glass-panel" 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 12, 
              padding: "12px 16px", 
              background: "rgba(16, 19, 28, 0.75)" 
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, color: "var(--text-tertiary)", textDecoration: "line-through" }}>{item.title}</div>
              <div className="text-meta" style={{ fontSize: 11, marginTop: 4 }}>
                Deleted: {new Date(item.deletedAt!).toLocaleString()}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                onClick={() => restoreItem(item.id)} 
                className="btn-secondary"
                style={{ fontSize: 12, padding: "5px 10px", gap: 4, color: "#10b981", borderColor: "rgba(16,185,129,0.3)" }}
              >
                <ArrowUpCircle size={13} />
                <span>Restore</span>
              </button>
              <button 
                onClick={() => hardDeleteItem(item.id)} 
                className="btn-danger"
                style={{ fontSize: 12, padding: "5px 10px", gap: 4 }}
              >
                <Trash2 size={13} />
                <span>Delete Forever</span>
              </button>
            </div>
          </div>
        ))}
        {tab === 'trash' && trashed.length === 0 && (
          <div className="glass-panel" style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "48px 24px", fontSize: 13 }}>
            Trash is empty.
          </div>
        )}

        {tab === 'archive' && archived.map(item => (
          <div 
            key={item.id} 
            className="glass-panel" 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 12, 
              padding: "12px 16px", 
              background: "rgba(16, 19, 28, 0.75)" 
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, color: "var(--text-primary)" }}>{item.title}</div>
              <div className="text-meta" style={{ fontSize: 11, marginTop: 4 }}>Type: {item.type.toUpperCase()}</div>
            </div>
            <button 
              onClick={() => unarchiveItem(item.id)} 
              className="btn-secondary"
              style={{ fontSize: 12, padding: "5px 10px", gap: 4, color: "var(--accent-hover)", borderColor: "var(--accent-border)" }}
            >
              <ArrowUpCircle size={13} />
              <span>Unarchive</span>
            </button>
          </div>
        ))}
        {tab === 'archive' && archived.length === 0 && (
          <div className="glass-panel" style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "48px 24px", fontSize: 13 }}>
            Archive is empty.
          </div>
        )}
      </div>
    </div>
  );
};
