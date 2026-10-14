import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Lock, Inbox, Sparkles, Star, Brain, Download } from 'lucide-react';
import { QUADRANTS, PILLARS } from '../theme/tokens';
import { useStore } from '../store';
import type { Item, QuadrantId, PillarId, Difficulty, ItemType, TaskStatus, PriorityLevel } from '../types';
import { TaskBreakdownModal } from './TaskBreakdownModal';
import { PromptWiseModal } from './PromptWiseModal';
import { triggerFileDownload } from '../utils/exportPrompt';

interface TaskModalProps {
  initialTask?: Item;
  initialType?: ItemType;
  initialProjectId?: string;
  initialGoalId?: string;
  defaultPillar: PillarId;
  defaultQuadrant: QuadrantId;
  defaultToInbox?: boolean;
  onSave: (data: Partial<Item>) => void;
  onClose: () => void;
  isMobile: boolean;
}

const ITEM_TYPES: { id: ItemType; label: string }[] = [
  { id: 'task', label: 'Task' },
  { id: 'project', label: 'Project' },
  { id: 'goal', label: 'Goal' },
  { id: 'idea', label: 'Idea' },
  { id: 'note', label: 'Note' },
  { id: 'habit', label: 'Habit' },
  { id: 'knowledge', label: 'Knowledge' },
  { id: 'reference', label: 'Reference' },
  { id: 'journal', label: 'Journal' },
];

const STATUS_OPTIONS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: '#94a3b8' },
  { id: 'doing', label: 'Doing', color: '#3b82f6' },
  { id: 'waiting', label: 'Waiting', color: '#f59e0b' },
  { id: 'done', label: 'Done', color: '#10b981' },
  { id: 'dropped', label: 'Dropped', color: '#ef4444' },
];

const PRIORITY_OPTIONS: { id: PriorityLevel; label: string; color: string }[] = [
  { id: 'critical', label: 'Critical', color: '#ef4444' },
  { id: 'high', label: 'High', color: '#f59e0b' },
  { id: 'normal', label: 'Normal', color: '#3b82f6' },
  { id: 'low', label: 'Low', color: '#64748b' },
];

export const TaskModal = ({ 
  initialTask, 
  initialType,
  initialProjectId,
  initialGoalId,
  defaultPillar, 
  defaultQuadrant, 
  defaultToInbox = false, 
  onSave, 
  onClose, 
  isMobile 
}: TaskModalProps) => {
  const items = useStore(state => state.items);
  const availableProjects = useMemo(() => {
    return items.filter(i => i.type === 'project' && !i.deletedAt && !i.isArchived);
  }, [items]);
  const availableGoals = useMemo(() => {
    return items.filter(i => i.type === 'goal' && !i.deletedAt && !i.isArchived);
  }, [items]);

  const isEdit = !!initialTask;
  const [destination, setDestination] = useState<'inbox' | 'direct'>(() => {
    if (isEdit) {
      return (initialTask.pillar || initialTask.quadrant) ? 'direct' : 'inbox';
    }
    return defaultToInbox ? 'inbox' : 'direct';
  });
  const [title, setTitle] = useState(initialTask?.title || '');
  const [type, setType] = useState<ItemType>(initialTask?.type || initialType || 'task');
  const [quadrant, setQuadrant] = useState<QuadrantId>(initialTask?.quadrant || defaultQuadrant);
  const [pillar, setPillar] = useState<PillarId>(initialTask?.pillar || defaultPillar);
  const [status, setStatus] = useState<TaskStatus>(initialTask?.status || 'todo');
  const [priority, setPriority] = useState<PriorityLevel>(initialTask?.priority || (initialTask?.isPriority ? 'high' : 'normal'));
  const [isPriority, setIsPriority] = useState<boolean>(initialTask?.isPriority || false);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialTask?.difficulty || 'Medium');
  const [estMinutes, setEstMinutes] = useState<string>(initialTask?.estMinutes?.toString() || '');
  const [deadline, setDeadline] = useState<string>(initialTask?.deadline ? new Date(initialTask.deadline).toISOString().split('T')[0] : '');
  const [projectId, setProjectId] = useState(initialTask?.projectId || initialProjectId || '');
  const [goalId, setGoalId] = useState(initialTask?.goalId || initialGoalId || '');
  
  const [body, setBody] = useState(initialTask?.body || '');
  const [tags, setTags] = useState<string[]>(initialTask?.tags || []);
  const [isPrivate, setIsPrivate] = useState(initialTask?.isPrivate || false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [showTaskPromptModal, setShowTaskPromptModal] = useState(false);

  const handleExportCurrentTask = () => {
    const mdContent = `# Task: ${title || 'Untitled'}\n- Type: ${type}\n- Pillar: ${pillar}\n- Quadrant: ${quadrant}\n- Priority: ${priority}\n- Estimated: ${estMinutes ? `${estMinutes}m` : 'None'}\n- Due: ${deadline || 'None'}\n\n## Description\n${body || 'No description provided.'}\n`;
    const dateStr = new Date().toISOString().split('T')[0];
    const slug = (title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'task').slice(0, 30);
    triggerFileDownload(mdContent, `${slug}-${dateStr}.md`, 'text/markdown');
  };

  const commitSubtasks = useStore(state => state.commitSubtasks);
  const undoSubtasks = useStore(state => state.undoSubtasks);

  const activePillarObj = PILLARS.find(p => p.id === pillar)! || PILLARS[0];

  const setQuickDeadline = (days: number | null) => {
    if (days === null) {
      setDeadline('');
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDeadline(d.toISOString().split('T')[0]);
  };

  const stateRef = useRef({ destination, title, type, quadrant, pillar, status, priority, isPriority, difficulty, estMinutes, deadline, projectId, goalId, body, tags, isPrivate });
  useEffect(() => {
    stateRef.current = { destination, title, type, quadrant, pillar, status, priority, isPriority, difficulty, estMinutes, deadline, projectId, goalId, body, tags, isPrivate };
  });

  const handleSave = useCallback(() => {
    const s = stateRef.current;
    if (!s.title.trim()) return;
    const isInbox = s.destination === 'inbox';
    const computedIsPriority = s.isPriority || s.priority === 'critical' || s.priority === 'high';
    onSave({
      title: s.title.trim(),
      type: s.type,
      quadrant: (s.type === 'task' && !isInbox) ? s.quadrant : undefined,
      pillar: !isInbox ? s.pillar : undefined,
      status: s.status,
      priority: s.priority,
      isPriority: computedIsPriority,
      difficulty: s.type === 'task' ? s.difficulty : undefined,
      estMinutes: s.estMinutes ? parseInt(s.estMinutes, 10) : undefined,
      deadline: s.deadline ? new Date(s.deadline).getTime() : undefined,
      projectId: s.projectId.trim() || undefined,
      goalId: s.goalId.trim() || undefined,
      body: s.body.trim() || undefined,
      tags: s.tags,
      isPrivate: s.isPrivate
    });
  }, [onSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleSave]);

  return (
    <div 
      onClick={onClose} 
      style={{ 
        position: "fixed", 
        inset: 0, 
        background: "var(--bg-overlay)", 
        backdropFilter: "blur(12px)", 
        display: "flex", 
        alignItems: isMobile ? "flex-end" : "center", 
        justifyContent: "center", 
        zIndex: 100, 
        padding: isMobile ? 0 : 20 
      }}
    >
      <div 
        onClick={e => e.stopPropagation()} 
        className="glass-panel-elevated"
        style={{ 
          background: "#131622",
          border: "1px solid var(--border-strong)",
          borderRadius: isMobile ? "16px 16px 0 0" : 14, 
          width: "100%", 
          maxWidth: 480, 
          padding: 20, 
          boxShadow: "var(--shadow-modal)",
          maxHeight: isMobile ? "92vh" : "88vh",
          overflowY: "auto"
        }}
      >
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="card-title" style={{ fontSize: 16 }}>{isEdit ? 'Edit Item' : 'Quick Capture'}</span>
            <span 
              className="ui-pill" 
              style={{ 
                color: destination === 'inbox' ? "#9aa2b4" : activePillarObj.color, 
                borderColor: destination === 'inbox' ? "var(--border-subtle)" : activePillarObj.border, 
                background: destination === 'inbox' ? "rgba(255,255,255,0.05)" : activePillarObj.bg,
                fontSize: 10
              }}
            >
              {destination === 'inbox' ? 'Inbox • Unclassified' : activePillarObj.name}
            </span>
          </div>
          <button 
            aria-label="Close modal" 
            onClick={onClose} 
            className="btn-ghost" 
            style={{ padding: 4, borderRadius: 6 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Destination Switcher */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, background: "var(--bg-surface-elevated)", padding: 4, borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
          <button 
            type="button"
            onClick={() => setDestination('inbox')}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "7px 10px",
              borderRadius: 7,
              border: destination === 'inbox' ? "1px solid var(--border-default)" : "1px solid transparent",
              background: destination === 'inbox' ? "var(--bg-surface)" : "transparent",
              boxShadow: destination === 'inbox' ? "var(--shadow-sm)" : "none",
              color: destination === 'inbox' ? "var(--text-primary)" : "var(--text-secondary)",
              fontWeight: destination === 'inbox' ? 600 : 450,
              fontSize: 12.5,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            <Inbox size={13} color={destination === 'inbox' ? "var(--accent-hover)" : "var(--text-tertiary)"} />
            <span>Save to Inbox</span>
          </button>
          <button 
            type="button"
            onClick={() => setDestination('direct')}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "7px 10px",
              borderRadius: 7,
              border: destination === 'direct' ? "1px solid var(--border-default)" : "1px solid transparent",
              background: destination === 'direct' ? "var(--bg-surface)" : "transparent",
              boxShadow: destination === 'direct' ? "var(--shadow-sm)" : "none",
              color: destination === 'direct' ? "var(--text-primary)" : "var(--text-secondary)",
              fontWeight: destination === 'direct' ? 600 : 450,
              fontSize: 12.5,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            <Sparkles size={13} color={destination === 'direct' ? activePillarObj.color : "var(--text-tertiary)"} />
            <span>Assign Pillar & Quadrant</span>
          </button>
        </div>
        
        {/* Title input */}
        <input 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSave()} 
          placeholder="What's on your mind? (Task, idea, goal...)" 
          autoFocus 
          className="ui-input"
          style={{ 
            width: "100%", 
            fontSize: 15, 
            fontWeight: 500,
            padding: "11px 13px", 
            marginBottom: 14,
            border: "1px solid var(--border-strong)"
          }} 
        />
        
        {/* Type Selector (horizontal chips) */}
        <div style={{ marginBottom: 14 }}>
          <div className="text-label" style={{ fontSize: 10, marginBottom: 6 }}>Item Type</div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {ITEM_TYPES.map(t => {
              const isSelected = type === t.id;
              return (
                <button 
                  key={t.id}
                  onClick={() => setType(t.id)}
                  style={{ 
                    padding: "4px 10px", 
                    borderRadius: 9999, 
                    background: isSelected ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)", 
                    color: isSelected ? "#fff" : "var(--text-secondary)", 
                    border: `1px solid ${isSelected ? "rgba(255,255,255,0.3)" : "var(--border-subtle)"}`, 
                    fontSize: 11.5, 
                    fontWeight: isSelected ? 600 : 450,
                    cursor: "pointer", 
                    whiteSpace: "nowrap",
                    transition: "all 0.12s ease"
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {destination === 'inbox' ? (
          <div style={{ marginBottom: 14, padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px dashed var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Captures to your <strong>Inbox</strong>. Triage pillar and quadrant later.
            </div>
            <button 
              type="button" 
              onClick={() => setDestination('direct')}
              className="btn-ghost"
              style={{ fontSize: 11.5, color: "var(--accent-hover)", padding: "2px 8px" }}
            >
              Classify now
            </button>
          </div>
        ) : (
          /* Pillar Selection */
          <div style={{ marginBottom: 14 }}>
            <div className="text-label" style={{ fontSize: 10, marginBottom: 6 }}>Pillar</div>
            <select 
              value={pillar} 
              onChange={e => { setPillar(e.target.value as PillarId); setDestination('direct'); }} 
              className="ui-select"
              style={{ width: "100%", padding: "8px 12px", fontSize: 13 }}
            >
              {PILLARS.map(p => <option key={p.id} value={p.id}>{p.name} — {p.subtitle}</option>)}
            </select>
          </div>
        )}

        {/* Task Specific Controls */}
        {type === 'task' && (
          <>
            {/* Status & Priority Controls */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span className="text-label" style={{ fontSize: 10 }}>Task Status</span>
                <button
                  type="button"
                  onClick={() => setIsPriority(!isPriority)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "3px 8px",
                    borderRadius: 6,
                    border: `1px solid ${isPriority ? "#f59e0b" : "var(--border-subtle)"}`,
                    background: isPriority ? "rgba(245,158,11,0.12)" : "transparent",
                    color: isPriority ? "#f59e0b" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: isPriority ? 600 : 450
                  }}
                >
                  <Star size={11} fill={isPriority ? "#f59e0b" : "none"} />
                  <span>{isPriority ? 'Top Priority' : 'Mark as Priority'}</span>
                </button>
              </div>
              <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
                {STATUS_OPTIONS.map(st => {
                  const isSel = status === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStatus(st.id)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: `1px solid ${isSel ? st.color : "var(--border-subtle)"}`,
                        background: isSel ? `${st.color}22` : "var(--bg-surface-elevated)",
                        color: isSel ? st.color : "var(--text-secondary)",
                        fontSize: 11.5,
                        fontWeight: isSel ? 600 : 450,
                        cursor: "pointer",
                        transition: "all 0.12s ease"
                      }}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Level Selector */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span className="text-label" style={{ fontSize: 10 }}>Priority Level</span>
                <span className="text-meta" style={{ fontSize: 10 }}>
                  {priority === 'critical' ? 'Urgent blocker' : priority === 'high' ? 'High focus' : priority === 'low' ? 'Low / Backlog' : 'Normal execution'}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {PRIORITY_OPTIONS.map(po => {
                  const isSel = priority === po.id;
                  return (
                    <button
                      key={po.id}
                      type="button"
                      onClick={() => {
                        setPriority(po.id);
                        if (po.id === 'critical' || po.id === 'high') {
                           setIsPriority(true);
                        }
                      }}
                      style={{
                        padding: "5px 6px",
                        borderRadius: 6,
                        border: `1px solid ${isSel ? po.color : "var(--border-subtle)"}`,
                        background: isSel ? `${po.color}22` : "var(--bg-surface-elevated)",
                        color: isSel ? po.color : "var(--text-secondary)",
                        fontSize: 11,
                        fontWeight: isSel ? 650 : 450,
                        cursor: "pointer",
                        transition: "all 0.12s ease",
                        textAlign: "center"
                      }}
                    >
                      {po.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1st-Principles Breakdown & Export Trigger Buttons */}
            {title.trim().length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                <button
                  type="button"
                  onClick={() => setShowBreakdownModal(true)}
                  className="btn-secondary"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    gap: 7,
                    padding: "8px 12px",
                    background: "rgba(168,85,247,0.08)",
                    borderColor: "rgba(168,85,247,0.3)",
                    color: "#c084fc",
                    fontSize: 12.5,
                    fontWeight: 550
                  }}
                >
                  <Brain size={14} />
                  <span>Break Down Task with 1st-Principles</span>
                  <Sparkles size={12} />
                </button>

                {/* Two Action Buttons: 1 for Export & 1 for Prompt-Wise */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleExportCurrentTask}
                    className="btn-secondary"
                    style={{
                      justifyContent: "center",
                      gap: 6,
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      borderRadius: 7
                    }}
                    title="Export task to Markdown / Backup"
                  >
                    <Download size={13} color="#3b82f6" />
                    <span>Export Task</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTaskPromptModal(true)}
                    className="btn-secondary"
                    style={{
                      justifyContent: "center",
                      gap: 6,
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#ea580c",
                      borderColor: "rgba(234, 88, 12, 0.25)",
                      background: "rgba(234, 88, 12, 0.08)",
                      borderRadius: 7
                    }}
                    title="Export structured prompt for ChatGPT / Claude / Gemini"
                  >
                    <Sparkles size={13} color="#ea580c" />
                    <span>Prompt-Wise</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quadrant Selector (when in direct assignment mode) */}
            {destination === 'direct' && (
              <div style={{ marginBottom: 14 }}>
                <div className="text-label" style={{ fontSize: 10, marginBottom: 6 }}>Eisenhower Quadrant</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                  {QUADRANTS.map(q => {
                    const isSelected = quadrant === q.id;
                    return (
                      <button 
                        key={q.id} 
                        type="button"
                        onClick={() => { setQuadrant(q.id); setDestination('direct'); }} 
                        style={{ 
                          padding: "7px 4px", 
                          borderRadius: 6, 
                          background: isSelected ? q.bg : "rgba(255,255,255,0.03)", 
                          border: `1px solid ${isSelected ? q.color : "var(--border-subtle)"}`, 
                          color: isSelected ? q.color : "var(--text-secondary)", 
                          fontSize: 11, 
                          fontWeight: 650, 
                          cursor: "pointer", 
                          transition: "all 0.12s ease",
                          textAlign: "center"
                        }}
                      >
                        {q.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Difficulty, Minutes, Deadline */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: 8, marginBottom: 14 }}>
              <div>
                <div className="text-label" style={{ fontSize: 10, marginBottom: 4 }}>Difficulty</div>
                <select 
                  value={difficulty} 
                  onChange={e => setDifficulty(e.target.value as Difficulty)} 
                  className="ui-select"
                  style={{ width: "100%", padding: "7px 8px" }}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <div className="text-label" style={{ fontSize: 10, marginBottom: 4 }}>Est. Mins</div>
                <input 
                  type="number" 
                  placeholder="30" 
                  value={estMinutes} 
                  onChange={e => setEstMinutes(e.target.value)} 
                  className="ui-input"
                  style={{ width: "100%", padding: "7px 8px", textAlign: "center" }}
                />
              </div>

              <div>
                <div className="text-label" style={{ fontSize: 10, marginBottom: 4 }}>Deadline</div>
                <input 
                  type="date" 
                  value={deadline} 
                  onChange={e => setDeadline(e.target.value)} 
                  className="ui-input"
                  style={{ width: "100%", padding: "7px 8px" }}
                />
              </div>
            </div>

            {/* Quick Scheduling Presets */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14, alignItems: "center" }}>
              <span className="text-meta" style={{ fontSize: 10, color: "var(--text-tertiary)" }}>Quick set:</span>
              <button 
                type="button" 
                onClick={() => setQuickDeadline(0)} 
                className="btn-ghost" 
                style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.03)" }}
              >
                Today
              </button>
              <button 
                type="button" 
                onClick={() => setQuickDeadline(1)} 
                className="btn-ghost" 
                style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.03)" }}
              >
                Tomorrow
              </button>
              <button 
                type="button" 
                onClick={() => setQuickDeadline(7)} 
                className="btn-ghost" 
                style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.03)" }}
              >
                +7d Next Week
              </button>
              {deadline && (
                <button 
                  type="button" 
                  onClick={() => setQuickDeadline(null)} 
                  className="btn-ghost" 
                  style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, color: "#f43f5e" }}
                >
                  Clear
                </button>
              )}
            </div>
            
            {/* Functional Project & Goal Links */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div>
                <div className="text-label" style={{ fontSize: 10, marginBottom: 4 }}>Project</div>
                <select 
                  value={projectId} 
                  onChange={e => setProjectId(e.target.value)} 
                  className="ui-select"
                  style={{ width: "100%", padding: "7px 8px" }}
                >
                  <option value="">None (Independent)</option>
                  {availableProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-label" style={{ fontSize: 10, marginBottom: 4 }}>Goal</div>
                <select 
                  value={goalId} 
                  onChange={e => setGoalId(e.target.value)} 
                  className="ui-select"
                  style={{ width: "100%", padding: "7px 8px" }}
                >
                  <option value="">None</option>
                  {availableGoals.map(g => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {/* Parent Goal Link for Project type */}
        {type === 'project' && (
          <div style={{ marginBottom: 14 }}>
            <div className="text-label" style={{ fontSize: 10, marginBottom: 4 }}>Parent Goal Link</div>
            <select 
              value={goalId} 
              onChange={e => setGoalId(e.target.value)} 
              className="ui-select"
              style={{ width: "100%", padding: "8px 12px" }}
            >
              <option value="">None (Stand-alone Project)</option>
              {availableGoals.map(g => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* Markdown Details / Body */}
        <div style={{ marginBottom: 14 }}>
          <div className="text-label" style={{ fontSize: 10, marginBottom: 4 }}>Notes & Details (Markdown / [[Wiki Link]])</div>
          <textarea 
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Add context, checklists, or link other notes with [[Note Title]]..."
            className="ui-input"
            style={{ 
              width: "100%", 
              height: type === 'task' ? 70 : 120, 
              padding: "10px 12px", 
              resize: "vertical", 
              lineHeight: 1.5,
              fontSize: 13
            }}
          />
        </div>

        {/* Tags & Privacy */}
        <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <input 
              value={tags.join(', ')} 
              onChange={e => setTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))} 
              placeholder="Tags (comma separated, e.g. habit, deepwork)" 
              className="ui-input"
              style={{ width: "100%", padding: "8px 12px" }}
            />
          </div>
          <label 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 6, 
              color: isPrivate ? "#f43f5e" : "var(--text-secondary)", 
              fontSize: 12, 
              cursor: "pointer", 
              background: isPrivate ? "rgba(244,63,94,0.1)" : "rgba(255,255,255,0.04)", 
              padding: "8px 12px", 
              borderRadius: 8, 
              border: `1px solid ${isPrivate ? "rgba(244,63,94,0.3)" : "var(--border-default)"}`,
              userSelect: "none"
            }}
          >
            <input 
              type="checkbox" 
              checked={isPrivate} 
              onChange={e => setIsPrivate(e.target.checked)} 
              style={{ accentColor: "#f43f5e" }}
            />
            <Lock size={12} />
            <span>Private</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button 
            onClick={onClose}
            className="btn-secondary"
            style={{ flex: 1, padding: "10px" }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="btn-primary"
            style={{ 
              flex: 2, 
              padding: "10px", 
              gap: 6
            }}
          >
            <span>{isEdit ? 'Save Changes' : 'Create Item'}</span>
            <kbd style={{ background: "rgba(0,0,0,0.15)", color: "#000", border: "none" }}>⌘↵</kbd>
          </button>
        </div>
      </div>

      {showBreakdownModal && (
        <TaskBreakdownModal 
          task={{
            id: initialTask?.id,
            type: 'task',
            title: title.trim(),
            body: body.trim(),
            pillar,
            quadrant,
            estMinutes: estMinutes ? parseInt(estMinutes, 10) : undefined,
          }}
          isOpen={showBreakdownModal}
          onClose={() => setShowBreakdownModal(false)}
          onCommitSubtasks={async (subtasksToCommit, batchId) => {
            if (initialTask?.id) {
              await commitSubtasks(initialTask.id, subtasksToCommit, batchId);
            } else {
              const parentId = await useStore.getState().addItem({
                title: title.trim(),
                type: 'task',
                quadrant: destination === 'direct' ? quadrant : undefined,
                pillar: destination === 'direct' ? pillar : undefined,
                status,
                priority,
                isPriority: isPriority || priority === 'critical' || priority === 'high',
                difficulty,
                estMinutes: estMinutes ? parseInt(estMinutes, 10) : undefined,
                deadline: deadline ? new Date(deadline).getTime() : undefined,
                projectId: projectId.trim() || undefined,
                goalId: goalId.trim() || undefined,
                body: body.trim() || undefined,
                tags,
                isPrivate
              });
              await commitSubtasks(parentId, subtasksToCommit, batchId);
              onClose();
            }
          }}
          onUndoBatch={undoSubtasks}
        />
      )}

      {showTaskPromptModal && (
        <PromptWiseModal 
          isOpen={showTaskPromptModal}
          onClose={() => setShowTaskPromptModal(false)}
          initialTask={{
            id: initialTask?.id || 'temp-task',
            type,
            title: title.trim(),
            body: body.trim(),
            pillar,
            quadrant,
            priority,
            status,
            createdAt: initialTask?.createdAt || 0,
            updatedAt: initialTask?.updatedAt || 0
          } as Item}
        />
      )}
    </div>
  );
};
