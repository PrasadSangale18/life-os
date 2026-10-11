import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { PILLARS, QUADRANTS } from '../theme/tokens';
import type { PillarId } from '../theme/tokens';
import { Check, X, Edit3, Trash2, ArrowUpCircle, Search } from 'lucide-react';
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

  const showPrivate = useStore(state => state.showPrivate);
  const tasks = useMemo(() => items.filter(t => t.type === 'task' && !t.deletedAt && t.pillar && t.quadrant && (showPrivate || !t.isPrivate)), [items, showPrivate]);

  const displayTasks = useMemo(() => {
    return filterAndSortTasks(
      tasks, 
      { search, pillar: filterPillar, status: filterStatus, difficulty: filterDifficulty, deadline: filterDeadline, showPrivate },
      sortOption
    );
  }, [tasks, search, filterPillar, filterStatus, filterDifficulty, filterDeadline, sortOption, showPrivate]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Controls */}
      <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.4)", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}>
          <Search size={16} color="#606080" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search tasks..." 
            style={{ flex: 1, background: "transparent", border: "none", color: "#fff", outline: "none", fontSize: 14 }} 
          />
        </div>
        
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={filterPillar} onChange={e => setFilterPillar(e.target.value)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px", color: "#fff", outline: "none", fontSize: 12 }}>
            <option value="all">All Pillars</option>
            {PILLARS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px", color: "#fff", outline: "none", fontSize: 12 }}>
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
          </select>
          <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px", color: "#fff", outline: "none", fontSize: 12 }}>
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <select value={filterDeadline} onChange={e => setFilterDeadline(e.target.value)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px", color: "#fff", outline: "none", fontSize: 12 }}>
            <option value="all">All Deadlines</option>
            <option value="overdue">Overdue</option>
            <option value="today">Today</option>
            <option value="this-week">This Week</option>
            <option value="none">No Deadline</option>
          </select>
          <select value={sortOption} onChange={e => setSortOption(e.target.value as any)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, padding: "6px", color: "#fff", outline: "none", fontSize: 12, marginLeft: "auto" }}>
            <option value="newest">Sort: Newest</option>
            <option value="easy-short">Sort: Easy/Short First</option>
            <option value="hard-long">Sort: Hard/Long First</option>
            <option value="deadline">Sort: Deadline</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {displayTasks.map(task => {
          const pillarColor = PILLARS.find(p => p.id === task.pillar)?.color || "#fff";
          return (
            <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", background: "rgba(0,0,0,0.2)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)" }}>
              <button 
                onClick={() => toggleTaskStatus(task.id)} 
                style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${pillarColor}`, background: task.status === 'done' ? pillarColor : "transparent", flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
              >
                {task.status === 'done' && <Check size={14} color="#000" strokeWidth={3} />}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, color: task.status === 'done' ? "#8080a0" : "#e0e0f0", textDecoration: task.status === 'done' ? "line-through" : "none" }}>{task.title}</div>
                <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#606080", marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {task.pillar && <span>{task.pillar.toUpperCase()}</span>}
                  {task.quadrant && <span>• {task.quadrant.toUpperCase()}</span>}
                  {task.difficulty && <span>• {task.difficulty}</span>}
                  {task.estMinutes && <span>• {task.estMinutes}m</span>}
                  {task.deadline && <span>• Due: {new Date(task.deadline).toLocaleDateString()}</span>}
                  {task.projectId && <span style={{ color: "#4d9eff" }}>• {task.projectId}</span>}
                </div>
              </div>
              <button onClick={() => onEditTask(task)} style={{ background: "transparent", border: "none", color: "#606080", cursor: "pointer", padding: 8 }}><Edit3 size={16} /></button>
              <button onClick={() => trashItem(task.id)} style={{ background: "transparent", border: "none", color: "#606080", cursor: "pointer", padding: 8 }}><Trash2 size={16} /></button>
            </div>
          );
        })}
        {displayTasks.length === 0 && <div style={{ color: "#606080", textAlign: "center", padding: 40 }}>No tasks found matching filters.</div>}
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
    <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px dashed rgba(255,255,255,0.1)" }}>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#fff", marginBottom: 16 }}>Inbox ({inboxItems.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {inboxItems.map(item => (
          <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px", background: "rgba(0,0,0,0.3)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: 15, color: "#fff", fontWeight: 500 }}>{item.title}</div>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => onEditTask(item)} style={{ background: "transparent", border: "none", color: "#4d9eff", cursor: "pointer", padding: 4 }}><Edit3 size={14} /></button>
                <button onClick={() => trashItem(item.id)} style={{ background: "transparent", border: "none", color: "#ff4d7e", cursor: "pointer", padding: 4 }}><X size={14} /></button>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 8 }}>
              <select 
                value={item.type} 
                onChange={e => updateItem(item.id, { type: e.target.value as ItemType, quadrant: undefined })} 
                style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 4, padding: "4px 8px", color: "#fff", fontSize: 11 }}
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
                style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 4, padding: "4px 8px", color: "#fff", fontSize: 11 }}
              >
                <option value="" disabled>Set Pillar</option>
                {PILLARS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>

              {item.type === 'task' && (
                <select 
                  value={item.quadrant || ''} 
                  onChange={e => updateItem(item.id, { quadrant: e.target.value as QuadrantId })} 
                  style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 4, padding: "4px 8px", color: "#fff", fontSize: 11 }}
                >
                  <option value="" disabled>Set Quadrant</option>
                  {QUADRANTS.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                </select>
              )}
            </div>
          </div>
        ))}
        {inboxItems.length === 0 && <div style={{ color: "#606080", textAlign: "center", padding: 40, fontSize: 13 }}>Inbox zero! Capture a thought anytime with 'C'.</div>}
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px", background: tab === 'trash' ? "rgba(255,77,126,0.05)" : "rgba(181,123,255,0.05)", borderRadius: 16, border: tab === 'trash' ? "1px solid rgba(255,77,126,0.1)" : "1px solid rgba(181,123,255,0.1)" }}>
      
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => setTab('trash')} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: tab === 'trash' ? "#ff4d7e" : "rgba(255,255,255,0.1)", color: tab === 'trash' ? "#000" : "#fff", fontWeight: "bold", cursor: "pointer" }}>Trash (30 Days)</button>
        <button onClick={() => setTab('archive')} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: tab === 'archive' ? "#b57bff" : "rgba(255,255,255,0.1)", color: tab === 'archive' ? "#000" : "#fff", fontWeight: "bold", cursor: "pointer" }}>Archive</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tab === 'trash' && trashed.map(item => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", background: "rgba(0,0,0,0.4)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, color: "#a0a0c0", textDecoration: "line-through" }}>{item.title}</div>
              <div style={{ fontSize: 11, color: "#606080", marginTop: 4 }}>Deleted: {new Date(item.deletedAt!).toLocaleString()}</div>
            </div>
            <button onClick={() => restoreItem(item.id)} style={{ background: "rgba(0,217,126,0.1)", border: "1px solid rgba(0,217,126,0.2)", color: "#00d97e", cursor: "pointer", padding: "6px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}><ArrowUpCircle size={14} /> Restore</button>
            <button onClick={() => hardDeleteItem(item.id)} style={{ background: "transparent", border: "1px solid #ff4d7e", color: "#ff4d7e", cursor: "pointer", padding: "6px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}><X size={14} /> Delete Forever</button>
          </div>
        ))}
        {tab === 'trash' && trashed.length === 0 && <div style={{ color: "#606080", textAlign: "center", padding: 40 }}>Trash is empty.</div>}

        {tab === 'archive' && archived.map(item => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", background: "rgba(0,0,0,0.4)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, color: "#b57bff" }}>{item.title}</div>
              <div style={{ fontSize: 11, color: "#606080", marginTop: 4 }}>Type: {item.type.toUpperCase()}</div>
            </div>
            <button onClick={() => unarchiveItem(item.id)} style={{ background: "rgba(181,123,255,0.1)", border: "1px solid rgba(181,123,255,0.2)", color: "#b57bff", cursor: "pointer", padding: "6px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}><ArrowUpCircle size={14} /> Unarchive</button>
          </div>
        ))}
        {tab === 'archive' && archived.length === 0 && <div style={{ color: "#606080", textAlign: "center", padding: 40 }}>Archive is empty.</div>}
      </div>
    </div>
  );
};
