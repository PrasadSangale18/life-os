import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { PILLARS } from '../theme/tokens';
import type { Item, TaskStatus, PriorityLevel } from '../types';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Star, 
  Check, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Inbox, 
  Sparkles,
  ArrowRight,
  Play,
  FastForward,
  Users,
  Zap,
  Download,
  Radio,
  Flame
} from 'lucide-react';
import { PromptWiseModal } from './PromptWiseModal';
import { exportToMarkdown, triggerFileDownload } from '../utils/exportPrompt';
import { FlowCockpitModal } from './focus/FlowCockpitModal';
import { ResistanceBusterModal } from './productivity/ResistanceBusterModal';
import { EnergyPulseWidget } from './productivity/EnergyPulseWidget';
import { DayTimeline } from './productivity/DayTimeline';

interface TodayViewProps {
  onEditTask: (task: Item) => void;
  onAddTask: () => void;
  onGoToInbox: () => void;
  onGoToMatrix: () => void;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: 'To Do', color: '#94a3b8' },
  doing: { label: 'Doing', color: '#3b82f6' },
  waiting: { label: 'Waiting', color: '#f59e0b' },
  done: { label: 'Done', color: '#10b981' },
  dropped: { label: 'Dropped', color: '#ef4444' },
  archived: { label: 'Archived', color: '#64748b' }
};

const PRIORITY_CONFIG: Record<PriorityLevel, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#f43f5e' },
  high: { label: 'High', color: '#f59e0b' },
  normal: { label: 'Normal', color: '#3b82f6' },
  low: { label: 'Low', color: '#64748b' }
};

export const TodayView = ({ onEditTask, onAddTask, onGoToInbox, onGoToMatrix }: TodayViewProps) => {
  const items = useStore(state => state.items);
  const updateItem = useStore(state => state.updateItem);
  const toggleTaskStatus = useStore(state => state.toggleTaskStatus);
  const trashItem = useStore(state => state.trashItem);
  const showPrivate = useStore(state => state.showPrivate);
  const user = useStore(state => state.user);

  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [showTodayPromptModal, setShowTodayPromptModal] = useState(false);
  const [flowTask, setFlowTask] = useState<Item | null>(null);
  const [showFlowCockpit, setShowFlowCockpit] = useState(false);
  const [resistanceTask, setResistanceTask] = useState<Item | null>(null);
  const [showResistanceBuster, setShowResistanceBuster] = useState(false);

  // Time boundaries for today
  const [{ startOfToday, endOfToday, todayFormatted }] = useState(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const formatted = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    return {
      startOfToday: start.getTime(),
      endOfToday: end.getTime(),
      todayFormatted: formatted
    };
  });

  const activeTasks = useMemo(() => {
    return items.filter(t => 
      t.type === 'task' && 
      !t.deletedAt && 
      !t.isArchived && 
      (showPrivate || !t.isPrivate)
    );
  }, [items, showPrivate]);

  // 1. Overdue tasks
  const overdueTasks = useMemo(() => {
    return activeTasks.filter(t => 
      t.status !== 'done' && 
      t.status !== 'dropped' && 
      t.deadline && 
      t.deadline < startOfToday
    ).sort((a, b) => (a.deadline || 0) - (b.deadline || 0));
  }, [activeTasks, startOfToday]);

  // 2. Due today tasks
  const dueTodayTasks = useMemo(() => {
    return activeTasks.filter(t => 
      t.status !== 'done' && 
      t.status !== 'dropped' && 
      t.deadline && 
      t.deadline >= startOfToday && 
      t.deadline <= endOfToday
    ).sort((a, b) => (a.deadline || 0) - (b.deadline || 0));
  }, [activeTasks, startOfToday, endOfToday]);

  // 3. User's Top 3 Priorities
  const topPriorities = useMemo(() => {
    const priorityItems = activeTasks.filter(t => 
      t.status !== 'done' && 
      t.status !== 'dropped' && 
      t.isPriority
    );

    // If fewer than 3 explicitly marked, fill with earliest due or do quadrant
    if (priorityItems.length >= 3) {
      return priorityItems.slice(0, 3);
    }
    const needed = 3 - priorityItems.length;
    const priorityIds = new Set(priorityItems.map(p => p.id));
    const fallback = activeTasks
      .filter(t => t.status !== 'done' && t.status !== 'dropped' && !priorityIds.has(t.id))
      .sort((a, b) => {
        if (a.quadrant === 'do' && b.quadrant !== 'do') return -1;
        if (a.quadrant !== 'do' && b.quadrant === 'do') return 1;
        if (a.deadline && b.deadline) return a.deadline - b.deadline;
        if (a.deadline) return -1;
        return 0;
      })
      .slice(0, needed);

    return [...priorityItems, ...fallback];
  }, [activeTasks]);

  // 4. Total estimated minutes for today
  const totalEstMinutes = useMemo(() => {
    const combinedSet = new Map<string, Item>();
    [...overdueTasks, ...dueTodayTasks, ...topPriorities].forEach(t => combinedSet.set(t.id, t));
    let mins = 0;
    combinedSet.forEach(t => {
      mins += t.estMinutes || 25; // default reasonable block
    });
    return mins;
  }, [overdueTasks, dueTodayTasks, topPriorities]);

  // 5. Pillar balance summary (grounded in existing database items)
  const pillarBalance = useMemo(() => {
    return PILLARS.map(p => {
      const pTasks = activeTasks.filter(t => t.pillar === p.id);
      const done = pTasks.filter(t => t.status === 'done').length;
      const total = pTasks.length;
      const todayCount = [...overdueTasks, ...dueTodayTasks].filter(t => t.pillar === p.id).length;
      return {
        pillar: p,
        total,
        done,
        todayCount,
        percent: total > 0 ? Math.round((done / total) * 100) : 0
      };
    });
  }, [activeTasks, overdueTasks, dueTodayTasks]);

  const inboxCount = useMemo(() => {
    return items.filter(i => 
      (!i.pillar || (i.type === 'task' && !i.quadrant)) && 
      !i.deletedAt && 
      !i.isArchived && 
      (showPrivate || !i.isPrivate)
    ).length;
  }, [items, showPrivate]);

  // In-progress / Doing tasks
  const inProgressTasks = useMemo(() => {
    return activeTasks.filter(t => t.status === 'doing');
  }, [activeTasks]);

  const capacityMinutes = 240; // 4 hours standard deep work capacity
  const capacityPercent = Math.min(100, Math.round((totalEstMinutes / capacityMinutes) * 100));

  const handleStatusChange = (id: string, newStatus: TaskStatus) => {
    updateItem(id, { status: newStatus });
  };

  const handlePriorityChange = (id: string, newPriority: PriorityLevel) => {
    updateItem(id, {
      priority: newPriority,
      isPriority: newPriority === 'critical' || newPriority === 'high'
    });
  };

  const handleTogglePriority = (task: Item) => {
    const nextPriority: PriorityLevel = task.priority === 'critical' ? 'normal' : task.priority === 'high' ? 'critical' : 'high';
    updateItem(task.id, { 
      isPriority: nextPriority === 'critical' || nextPriority === 'high',
      priority: nextPriority 
    });
  };

  const handleStartTask = (task: Item) => {
    updateItem(task.id, { status: 'doing' });
  };

  const handleDeferTask = (task: Item) => {
    const nextDay = startOfToday + 86400000 + 12 * 3600000;
    updateItem(task.id, { deadline: nextDay });
  };

  const handleDelegateTask = (task: Item) => {
    updateItem(task.id, { quadrant: 'delegate' });
  };

  const handleExportToday = () => {
    const combinedSet = new Map<string, Item>();
    [...overdueTasks, ...dueTodayTasks, ...topPriorities].forEach(t => combinedSet.set(t.id, t));
    const todayItems = Array.from(combinedSet.values());
    const md = exportToMarkdown(todayItems.length > 0 ? todayItems : activeTasks.slice(0, 10));
    const dateStr = new Date().toISOString().split('T')[0];
    triggerFileDownload(md, `today-agenda-${dateStr}.md`, 'text/markdown');
  };

  const renderTaskCard = (task: Item, badge?: { label: string; color: string }) => {
    const isDone = task.status === 'done';
    const isHovered = hoveredTaskId === task.id;
    const pObj = PILLARS.find(p => p.id === task.pillar);
    
    // Transparent why-prioritized reason
    const getReason = () => {
      if (task.priority === 'critical') return { text: 'Critical Priority', color: '#f43f5e' };
      if (task.deadline && task.deadline < startOfToday) {
        const days = Math.max(1, Math.round((startOfToday - task.deadline) / 86400000));
        return { text: `Overdue (${days}d)`, color: '#f43f5e' };
      }
      if (task.deadline && task.deadline >= startOfToday && task.deadline <= endOfToday) {
        return { text: 'Due Today', color: '#10b981' };
      }
      if (task.priority === 'high' || task.isPriority) return { text: 'Top Focus', color: '#f59e0b' };
      if (task.quadrant === 'do') return { text: 'DO Quadrant', color: '#10b981' };
      if (task.estMinutes && task.estMinutes <= 15) return { text: 'Quick Win (<15m)', color: '#3b82f6' };
      return null;
    };
    const priorityReason = getReason();

    return (
      <div 
        key={task.id}
        className="glass-panel"
        onMouseEnter={() => setHoveredTaskId(task.id)}
        onMouseLeave={() => setHoveredTaskId(null)}
        style={{ 
          padding: "12px 16px",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          background: isDone ? "var(--bg-surface-elevated)" : "var(--bg-surface)",
          border: `1px solid ${isHovered ? "var(--border-strong)" : "var(--border-default)"}`,
          borderRadius: 10,
          transition: "all 0.15s ease"
        }}
      >
        {/* Completion checkbox */}
        <button 
          onClick={() => toggleTaskStatus(task.id)}
          aria-label="Toggle completed"
          style={{ 
            width: 20, 
            height: 20, 
            borderRadius: 5, 
            border: `1.5px solid ${isDone ? "var(--accent-primary)" : "var(--border-strong)"}`, 
            background: isDone ? "var(--accent-primary)" : "transparent", 
            cursor: "pointer", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            marginTop: 2,
            flexShrink: 0,
            padding: 0
          }}
        >
          {isDone && <Check size={12} color="#fff" strokeWidth={3} />}
        </button>

        {/* Task Title & Details */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span 
              style={{ 
                fontSize: 14, 
                fontWeight: 500, 
                color: isDone ? "var(--text-tertiary)" : "var(--text-primary)", 
                textDecoration: isDone ? "line-through" : "none",
                lineHeight: 1.4,
                wordBreak: "break-word"
              }}
            >
              {task.title}
            </span>
            {badge && (
              <span className="ui-pill" style={{ color: badge.color, borderColor: `${badge.color}44`, background: `${badge.color}14`, fontSize: 10 }}>
                {badge.label}
              </span>
            )}
            {priorityReason && !badge && (
              <span className="ui-pill" style={{ color: priorityReason.color, borderColor: `${priorityReason.color}33`, background: `${priorityReason.color}10`, fontSize: 9.5 }}>
                {priorityReason.text}
              </span>
            )}
          </div>

          {/* Badges / Pillar / Est mins / Priority / Status */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            {pObj && (
              <span className="ui-pill" style={{ color: pObj.color, borderColor: pObj.border, background: pObj.bg, fontSize: 10.5 }}>
                {pObj.name}
              </span>
            )}

            {task.estMinutes && (
              <span className="text-meta" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
                <Clock size={11} />
                <span>{task.estMinutes}m</span>
              </span>
            )}

            {task.deadline && (
              <span className="text-meta" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 3, color: task.deadline < startOfToday ? "#f43f5e" : "var(--text-tertiary)" }}>
                <Calendar size={11} />
                <span>{new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </span>
            )}

            {/* Quick Priority Switcher */}
            <select 
              value={task.priority || (task.isPriority ? 'high' : 'normal')}
              onChange={e => handlePriorityChange(task.id, e.target.value as PriorityLevel)}
              className="ui-select"
              style={{ 
                padding: "2px 6px", 
                fontSize: 11, 
                height: 22, 
                minHeight: 22, 
                borderRadius: 5,
                color: PRIORITY_CONFIG[task.priority || (task.isPriority ? 'high' : 'normal')].color,
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-default)"
              }}
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>

            {/* Quick Status Pill Switcher */}
            <select 
              value={task.status || 'todo'}
              onChange={e => handleStatusChange(task.id, e.target.value as TaskStatus)}
              className="ui-select"
              style={{ 
                padding: "2px 6px", 
                fontSize: 11, 
                height: 22, 
                minHeight: 22, 
                borderRadius: 5,
                color: STATUS_CONFIG[task.status || 'todo'].color,
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-default)"
              }}
            >
              <option value="todo">To Do</option>
              <option value="doing">Doing</option>
              <option value="waiting">Waiting</option>
              <option value="done">Done</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>
        </div>

        {/* 1-Click Execution & Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
          {!isDone && (
            <button 
              onClick={() => {
                setFlowTask(task);
                setShowFlowCockpit(true);
              }}
              className="btn-ghost"
              style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, color: "#FF5A1F", background: "rgba(255,90,31,0.12)", gap: 4, fontWeight: 600 }}
              title="Launch Deep Work Flow State Cockpit"
            >
              <Radio size={11} color="#FF5A1F" />
              <span>Flow</span>
            </button>
          )}

          {!isDone && (
            <button 
              onClick={() => {
                setResistanceTask(task);
                setShowResistanceBuster(true);
              }}
              className="btn-ghost"
              style={{ padding: "4px 6px", borderRadius: 6, fontSize: 11, color: "#f59e0b", background: "rgba(245,158,11,0.1)", gap: 3 }}
              title="Bust Procrastination / Shrink to 2-Min Action"
            >
              <Flame size={12} color="#f59e0b" fill="#f59e0b" />
            </button>
          )}

          {task.status !== 'doing' && !isDone && (
            <button 
              onClick={() => handleStartTask(task)}
              className="btn-ghost"
              style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, color: "#3b82f6", background: "rgba(59,130,246,0.08)", gap: 4 }}
              title="Start task (mark In Progress)"
            >
              <Play size={10} fill="#3b82f6" />
              <span>Start</span>
            </button>
          )}

          {!isDone && (
            <button 
              onClick={() => handleDeferTask(task)}
              className="btn-ghost"
              style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, color: "var(--text-secondary)", gap: 4 }}
              title="Defer deadline to tomorrow"
            >
              <FastForward size={11} />
              <span>+1d</span>
            </button>
          )}

          {task.quadrant !== 'delegate' && !isDone && (
            <button 
              onClick={() => handleDelegateTask(task)}
              className="btn-ghost"
              style={{ padding: "6px", borderRadius: 6, color: "var(--text-tertiary)" }}
              title="Delegate task (move to Delegate quadrant)"
            >
              <Users size={12} />
            </button>
          )}

          <button 
            onClick={() => handleTogglePriority(task)}
            className="btn-ghost"
            style={{ padding: "6px", borderRadius: 6, color: task.isPriority ? "#f59e0b" : "var(--text-tertiary)" }}
            title={task.isPriority ? "Remove priority" : "Mark as Top Priority"}
          >
            <Star size={14} fill={task.isPriority ? "#f59e0b" : "none"} />
          </button>
          <button 
            onClick={() => onEditTask(task)}
            className="btn-ghost"
            style={{ padding: "6px", borderRadius: 6, color: "var(--text-secondary)" }}
            title="Edit Task"
          >
            <Edit3 size={14} />
          </button>
          <button 
            onClick={() => trashItem(task.id)}
            className="btn-ghost"
            style={{ padding: "6px", borderRadius: 6, color: "var(--text-secondary)" }}
            onMouseEnter={e => e.currentTarget.style.color = "#f43f5e"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}
            title="Move to Trash"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Executive Greeting Row (Matching Prahari media_1791718696966.png) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 750, letterSpacing: "-0.03em", margin: 0, color: "var(--text-primary)", lineHeight: 1.2 }}>
            Hello, {user?.name || "Prasad Sangale"}.
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 660 }}>
            Life OS Intelligence is online. Continuously organizing your 5 Life Pillars, Eisenhower Matrix, and knowledge workspace.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Prompt-Wise Action Button (Prahari Warm Orange Gradient) */}
          <button
            type="button"
            onClick={() => setShowTodayPromptModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 16px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
              color: "#ffffff",
              border: "none",
              fontSize: 13,
              fontWeight: 650,
              cursor: "pointer",
              boxShadow: "0 3px 12px rgba(234, 88, 12, 0.35)",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}
            title="Format today's workload into a structured prompt for external AI"
          >
            <Sparkles size={14} color="#ffffff" />
            <span>⚡ Prompt-Wise AI Breakdown</span>
          </button>
          
          <button 
            type="button"
            onClick={onAddTask}
            className="btn-primary"
            style={{ padding: "9px 16px", borderRadius: 10, fontSize: 13, gap: 6 }}
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* 10-Second Circadian Energy & Sentiment Pulse Tracker */}
      <EnergyPulseWidget />

      {/* Circadian 24-Hour Day Timeline & Auto-Scheduler */}
      <DayTimeline 
        tasks={activeTasks}
        onStartFocus={(t) => {
          setFlowTask(t);
          setShowFlowCockpit(true);
        }}
        onEditTask={onEditTask}
      />

      {/* 3 Executive Metric Stat Cards (Matching Prahari media_1791718696966.png) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {/* Card 1: Critical / Do Now */}
        <div className="glass-panel" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10, borderLeft: "3px solid #f43f5e" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-tertiary)", textTransform: "uppercase" }}>CRITICAL / DO NOW</span>
            <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 7px", borderRadius: 9999, background: "rgba(244, 63, 94, 0.1)", color: "#f43f5e", border: "1px solid rgba(244, 63, 94, 0.2)" }}>
              {overdueTasks.length > 0 ? `${overdueTasks.length} Overdue` : 'Nominal'}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 32, fontWeight: 750, color: "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1 }}>
              {overdueTasks.length + topPriorities.filter(t => t.priority === 'critical').length}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>tasks requiring immediate action</span>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 5 }}>
            <AlertTriangle size={12} color="#f43f5e" />
            <span>Urgent & Important (Eisenhower Q1)</span>
          </div>
        </div>

        {/* Card 2: Active Focus / Planned */}
        <div className="glass-panel" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10, borderLeft: "3px solid #10b981" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-tertiary)", textTransform: "uppercase" }}>ACTIVE FOCUS</span>
            <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 7px", borderRadius: 9999, background: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
              {capacityPercent}% Capacity
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 32, fontWeight: 750, color: "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1 }}>
              {inProgressTasks.length + dueTodayTasks.length}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>tasks in progress & due today</span>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 5 }}>
            <Clock size={12} color="#10b981" />
            <span>{totalEstMinutes}m planned focus time</span>
          </div>
        </div>

        {/* Card 3: Total System Records across Pillars */}
        <div className="glass-panel" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10, borderLeft: "3px solid #3b82f6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-tertiary)", textTransform: "uppercase" }}>SYSTEM KNOWLEDGE & TASKS</span>
            <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 7px", borderRadius: 9999, background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
              5 Pillars Active
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 32, fontWeight: 750, color: "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1 }}>
              {items.filter(i => !i.deletedAt).length}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>total organized records</span>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 5 }}>
            <CheckCircle2 size={12} color="#3b82f6" />
            <span>Synchronized across 5 Life Pillars</span>
          </div>
        </div>
      </div>

      {/* Date & Agenda Status bar */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: "14px 20px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          flexWrap: "wrap", 
          gap: 14,
          background: "var(--bg-surface)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #60a5fa)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(59,130,246,0.3)" }}>
            <Calendar size={18} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 650, color: "var(--text-primary)" }}>Today's Focus & Operational Agenda</div>
            <div className="text-secondary" style={{ fontSize: 12.5, marginTop: 2 }}>{todayFormatted}</div>
          </div>
        </div>

        {/* Quick summary badges & Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ padding: "6px 12px", borderRadius: 8, background: "var(--bg-surface-elevated)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={13} color="var(--accent-hover)" />
            <span className="text-meta" style={{ fontSize: 12, color: "var(--text-primary)" }}>{totalEstMinutes}m</span>
            <span className="text-secondary" style={{ fontSize: 11 }}>planned</span>
          </div>

          {/* Button 1: Export Today */}
          <button 
            type="button"
            onClick={handleExportToday}
            className="btn-ghost"
            style={{ 
              gap: 6, 
              padding: "7px 12px", 
              fontSize: 12.5, 
              borderRadius: 8, 
              border: "1px solid var(--border-default)", 
              background: "var(--bg-surface-elevated)",
              color: "var(--text-secondary)"
            }}
            title="Export Today's Agenda (Markdown / Backup)"
          >
            <Download size={13} color="#3b82f6" />
            <span>Export</span>
          </button>

          {/* Button 2: Prompt-Wise AI */}
          <button 
            type="button"
            onClick={() => setShowTodayPromptModal(true)}
            className="btn-ghost"
            style={{ 
              gap: 6, 
              padding: "7px 12px", 
              fontSize: 12.5, 
              borderRadius: 8, 
              border: "1px solid rgba(234, 88, 12, 0.25)", 
              background: "rgba(234, 88, 12, 0.08)",
              color: "#ea580c"
            }}
            title="Prompt-Wise: Format Today's Workload for External AI"
          >
            <Sparkles size={13} color="#ea580c" />
            <span>AI Prompt</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Priorities + Today's Agenda on Left, Pillar Balance on Right */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        {/* Column 1: Today Agenda */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          
          {/* Currently In Progress Section */}
          {inProgressTasks.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#3b82f6", fontWeight: 600, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <Zap size={14} fill="#3b82f6" />
                <span>Currently In Progress ({inProgressTasks.length})</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {inProgressTasks.map(t => renderTaskCard(t, { label: 'In Progress', color: '#3b82f6' }))}
              </div>
            </div>
          )}

          {/* Overdue Section */}
          {overdueTasks.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#f43f5e", fontWeight: 600, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <AlertTriangle size={14} />
                <span>Overdue ({overdueTasks.length})</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {overdueTasks.map(t => renderTaskCard(t, { label: 'Overdue', color: '#f43f5e' }))}
              </div>
            </div>
          )}

          {/* Top 3 Priorities */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#f59e0b", fontWeight: 600, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <Star size={14} fill="#f59e0b" />
                <span>Top 3 Priorities</span>
              </div>
              <span className="text-meta" style={{ fontSize: 11 }}>Deep work focus</span>
            </div>

            {topPriorities.length === 0 ? (
              <div className="glass-panel" style={{ padding: "24px 20px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
                No active priorities yet. Star a task or add one to focus your day.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {topPriorities.map((t, idx) => renderTaskCard(t, { label: `#${idx + 1} Priority`, color: '#f59e0b' }))}
              </div>
            )}
          </div>

          {/* Due Today Tasks */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--text-secondary)", fontWeight: 600, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              <CheckCircle2 size={14} color="#10b981" />
              <span>Due Today ({dueTodayTasks.length})</span>
            </div>

            {dueTodayTasks.length === 0 ? (
              <div className="glass-panel" style={{ padding: "24px 20px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 13, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <span>No specific tasks with a deadline for today.</span>
                {inboxCount > 0 && (
                  <button onClick={onGoToInbox} className="btn-secondary" style={{ gap: 6, fontSize: 12 }}>
                    <Inbox size={13} />
                    <span>Process Inbox ({inboxCount} items)</span>
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dueTodayTasks.map(t => renderTaskCard(t, { label: 'Today', color: '#10b981' }))}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Pillar Balance Summary & Workload Overview */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Focus Capacity Card */}
          <div className="glass-panel" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={15} color={capacityPercent > 100 ? "#f43f5e" : "#3b82f6"} />
                <span className="card-title" style={{ fontSize: 14 }}>Focus Capacity</span>
              </div>
              <span className="text-meta" style={{ fontSize: 11 }}>
                {totalEstMinutes}m / {capacityMinutes}m ({capacityPercent}%)
              </span>
            </div>

            {/* Capacity Progress Bar */}
            <div style={{ height: 6, background: "var(--bg-surface-elevated)", border: "1px solid var(--border-subtle)", borderRadius: 9999, overflow: "hidden" }}>
              <div 
                style={{ 
                  height: "100%", 
                  width: `${Math.min(100, capacityPercent)}%`, 
                  background: capacityPercent > 100 ? "linear-gradient(90deg, #f59e0b, #f43f5e)" : "linear-gradient(90deg, #3b82f6, #10b981)", 
                  borderRadius: 9999, 
                  transition: "width 0.3s ease" 
                }} 
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11.5 }}>
              <span className="text-secondary">
                {capacityPercent > 100 
                  ? `Over capacity by ${totalEstMinutes - capacityMinutes}m — defer or delegate`
                  : `${capacityMinutes - totalEstMinutes}m focused work buffer remaining`}
              </span>
              <span className="text-meta" style={{ fontSize: 10.5 }}>Target: 4h deep work</span>
            </div>
          </div>

          {/* Pillar Attention Balance */}
          <div className="glass-panel" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={15} color="#3b82f6" />
                <span className="card-title" style={{ fontSize: 14 }}>Pillar Balance</span>
              </div>
              <span className="text-meta" style={{ fontSize: 11 }}>Active distribution</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pillarBalance.map(({ pillar, total, done, todayCount, percent }) => (
                <div key={pillar.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: pillar.color }} />
                      <span style={{ fontWeight: 550, color: "var(--text-primary)" }}>{pillar.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {todayCount > 0 && (
                        <span className="ui-pill" style={{ fontSize: 9.5, padding: "1px 5px", color: pillar.color, borderColor: pillar.border, background: pillar.bg }}>
                          {todayCount} today
                        </span>
                      )}
                      <span className="text-meta" style={{ fontSize: 11 }}>{done}/{total} ({percent}%)</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 4, background: "var(--bg-surface-elevated)", border: "1px solid var(--border-subtle)", borderRadius: 9999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${percent}%`, background: pillar.color, borderRadius: 9999, transition: "width 0.3s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions & Next Steps */}
          <div className="glass-panel" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="card-title" style={{ fontSize: 14 }}>Next Steps</span>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button 
                onClick={onGoToMatrix}
                className="btn-secondary"
                style={{ justifyContent: "space-between", padding: "10px 14px", fontSize: 13 }}
              >
                <span>Review Eisenhower Matrix</span>
                <ArrowRight size={14} color="var(--text-tertiary)" />
              </button>

              <button 
                onClick={onGoToInbox}
                className="btn-secondary"
                style={{ justifyContent: "space-between", padding: "10px 14px", fontSize: 13 }}
              >
                <span>Triage Unprocessed Inbox</span>
                <span className="tabular-nums" style={{ fontSize: 11, background: "var(--bg-surface-elevated)", border: "1px solid var(--border-default)", color: "var(--text-secondary)", padding: "2px 7px", borderRadius: 9999 }}>{inboxCount}</span>
              </button>

              <button 
                onClick={onAddTask}
                className="btn-secondary"
                style={{ justifyContent: "space-between", padding: "10px 14px", fontSize: 13 }}
              >
                <span>Quick Capture New Task</span>
                <Plus size={14} color="var(--text-tertiary)" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showTodayPromptModal && (
        <PromptWiseModal 
          isOpen={showTodayPromptModal}
          onClose={() => setShowTodayPromptModal(false)}
        />
      )}

      {/* Deep Work Flow State Cockpit */}
      {showFlowCockpit && flowTask && (
        <FlowCockpitModal
          task={flowTask}
          isOpen={showFlowCockpit}
          onClose={() => setShowFlowCockpit(false)}
        />
      )}

      {/* Task Resistance & Procrastination Buster */}
      {showResistanceBuster && resistanceTask && (
        <ResistanceBusterModal
          task={resistanceTask}
          isOpen={showResistanceBuster}
          onClose={() => setShowResistanceBuster(false)}
          onStartFocus={(t) => {
            setFlowTask(t);
            setShowFlowCockpit(true);
          }}
        />
      )}
    </div>
  );
};
