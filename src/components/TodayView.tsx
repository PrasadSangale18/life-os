import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { PILLARS } from '../theme/tokens';
import type { Item } from '../types';
import { 
  AlertTriangle, 
  Check, 
  Edit3, 
  Sparkles,
  ArrowRight,
  FastForward, 
  Radio, 
  Flame, 
  ShieldCheck, 
  FileText, 
  BarChart2, 
  PieChart,
  Activity,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { PromptWiseModal } from './PromptWiseModal';
import { FlowCockpitModal } from './focus/FlowCockpitModal';
import { ResistanceBusterModal } from './productivity/ResistanceBusterModal';
import { EnergyPulseWidget } from './productivity/EnergyPulseWidget';
import { DecisionDuelModal } from './productivity/DecisionDuelModal';
import { EveningChronicleModal } from './productivity/EveningChronicleModal';
import { BacklogDecayModal } from './productivity/BacklogDecayModal';

interface TodayViewProps {
  onEditTask: (task: Item) => void;
  onAddTask?: () => void;
  onGoToInbox?: () => void;
  onGoToMatrix?: () => void;
  onNavigateSection?: (section: string) => void;
  onOpenCopilot?: (prompt?: string) => void;
}

export const TodayView = ({ 
  onEditTask, 
  onAddTask, 
  onGoToInbox, 
  onGoToMatrix,
  onNavigateSection,
  onOpenCopilot 
}: TodayViewProps) => {
  const items = useStore(state => state.items);
  const addItem = useStore(state => state.addItem);
  const updateItem = useStore(state => state.updateItem);
  const toggleTaskStatus = useStore(state => state.toggleTaskStatus);
  const showPrivate = useStore(state => state.showPrivate);
  const user = useStore(state => state.user);

  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [showTodayPromptModal, setShowTodayPromptModal] = useState(false);
  const [flowTask, setFlowTask] = useState<Item | null>(null);
  const [showFlowCockpit, setShowFlowCockpit] = useState(false);
  const [resistanceTask, setResistanceTask] = useState<Item | null>(null);
  const [showResistanceBuster, setShowResistanceBuster] = useState(false);
  const [showDecisionDuel, setShowDecisionDuel] = useState(false);
  const [showEveningChronicle, setShowEveningChronicle] = useState(false);
  const [showDecayRadar, setShowDecayRadar] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'overdue'>('today');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  // Time boundaries for today
  const [{ startOfToday, endOfToday }] = useState(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return {
      startOfToday: start.getTime(),
      endOfToday: end.getTime()
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

  // 3. User's Top Priorities
  const topPriorities = useMemo(() => {
    const priorityItems = activeTasks.filter(t => 
      t.status !== 'done' && 
      t.status !== 'dropped' && 
      t.isPriority
    );

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

  // Real metrics calculated from Life OS database
  const criticalTasksCount = useMemo(() => {
    return overdueTasks.length + activeTasks.filter(t => t.priority === 'critical' || t.quadrant === 'do').length;
  }, [overdueTasks, activeTasks]);

  const completedItemsCount = useMemo(() => {
    return items.filter(t => t.status === 'done' && !t.deletedAt).length;
  }, [items]);

  const totalAssetsCount = useMemo(() => {
    return items.filter(i => !i.deletedAt).length;
  }, [items]);

  // Pillar Execution Density across the 5 Life Pillars
  const pillarStats = useMemo(() => {
    const pCounts: Record<string, { pending: number; done: number }> = {
      physical: { pending: 0, done: 0 },
      mental: { pending: 0, done: 0 },
      financial: { pending: 0, done: 0 },
      relational: { pending: 0, done: 0 },
      spiritual: { pending: 0, done: 0 }
    };

    items.forEach(i => {
      if (i.deletedAt) return;
      const pil = i.pillar || 'mental';
      if (pCounts[pil]) {
        if (i.status === 'done') pCounts[pil].done += 1;
        else pCounts[pil].pending += 1;
      }
    });

    const maxPillarTotal = Math.max(...Object.values(pCounts).map(p => p.pending + p.done), 1);

    return [
      { id: 'physical', label: 'Physical', desc: 'Health, Vitality & Energy', pending: Math.round((pCounts.physical.pending / maxPillarTotal) * 100), done: Math.round((pCounts.physical.done / maxPillarTotal) * 100) },
      { id: 'mental', label: 'Mental', desc: 'Deep Work, Focus & Learning', pending: Math.round((pCounts.mental.pending / maxPillarTotal) * 100), done: Math.round((pCounts.mental.done / maxPillarTotal) * 100) },
      { id: 'financial', label: 'Financial', desc: 'Investments, Wealth & Assets', pending: Math.round((pCounts.financial.pending / maxPillarTotal) * 100), done: Math.round((pCounts.financial.done / maxPillarTotal) * 100) },
      { id: 'relational', label: 'Relational', desc: 'Family, Network & Community', pending: Math.round((pCounts.relational.pending / maxPillarTotal) * 100), done: Math.round((pCounts.relational.done / maxPillarTotal) * 100) },
      { id: 'spiritual', label: 'Spiritual', desc: 'Mindfulness, Purpose & Clarity', pending: Math.round((pCounts.spiritual.pending / maxPillarTotal) * 100), done: Math.round((pCounts.spiritual.done / maxPillarTotal) * 100) }
    ];
  }, [items]);

  const handleCreateQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    await addItem({
      title: quickTaskTitle.trim(),
      type: 'task',
      pillar: 'physical',
      quadrant: 'do',
      priority: 'high',
      status: 'todo',
      estMinutes: 25
    });
    setQuickTaskTitle('');
  };

  const handleStartTask = (task: Item) => {
    updateItem(task.id, { status: 'doing' });
  };

  const handleDeferTask = (task: Item) => {
    const nextDay = startOfToday + 86400000 + 12 * 3600000;
    updateItem(task.id, { deadline: nextDay });
  };

  const renderTaskCard = (task: Item, badge?: { label: string; color: string }) => {
    const isDone = task.status === 'done';
    const isHovered = hoveredTaskId === task.id;
    const pObj = PILLARS.find(p => p.id === task.pillar);

    return (
      <div 
        key={task.id}
        className="glass-panel"
        onMouseEnter={() => setHoveredTaskId(task.id)}
        onMouseLeave={() => setHoveredTaskId(null)}
        style={{ 
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          background: isDone ? "var(--bg-surface-elevated)" : "var(--bg-surface)",
          border: `1px solid ${isHovered ? "var(--border-strong)" : "var(--border-default)"}`,
          borderRadius: 12,
          transition: "all 0.15s ease"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
          <button 
            type="button"
            onClick={() => toggleTaskStatus(task.id)}
            aria-label="Toggle completed"
            style={{ 
              width: 20, 
              height: 20, 
              borderRadius: 6, 
              border: `1.5px solid ${isDone ? "var(--accent-primary)" : "var(--border-strong)"}`, 
              background: isDone ? "var(--accent-primary)" : "transparent", 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              flexShrink: 0,
              padding: 0
            }}
          >
            {isDone && <Check size={12} color="#fff" strokeWidth={3} />}
          </button>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span 
                style={{ 
                  fontSize: 13.5, 
                  fontWeight: 600, 
                  color: isDone ? "var(--text-tertiary)" : "var(--text-primary)", 
                  textDecoration: isDone ? "line-through" : "none",
                  lineHeight: 1.3
                }}
                className="truncate"
              >
                {task.title}
              </span>
              {badge && (
                <span className="ui-pill" style={{ color: badge.color, borderColor: `${badge.color}44`, background: `${badge.color}14`, fontSize: 10 }}>
                  {badge.label}
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
              {pObj && (
                <span className="text-[10px] font-semibold capitalize" style={{ color: pObj.color }}>
                  {pObj.name}
                </span>
              )}
              {task.estMinutes && (
                <span className="text-[10.5px] text-slate-400 font-mono">
                  • {task.estMinutes}m
                </span>
              )}
              {task.priority && (
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/[0.04] text-slate-400">
                  {task.priority}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 1-Click Execution Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          {!isDone && (
            <button 
              type="button"
              onClick={() => {
                setFlowTask(task);
                setShowFlowCockpit(true);
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#FF5A1F] bg-[#FF5A1F]/10 hover:bg-[#FF5A1F]/20 border border-[#FF5A1F]/30 flex items-center gap-1.5 cursor-pointer"
              title="Launch Flow Cockpit"
            >
              <Radio size={11} color="#FF5A1F" />
              <span>Flow</span>
            </button>
          )}

          {!isDone && (
            <button 
              type="button"
              onClick={() => {
                setResistanceTask(task);
                setShowResistanceBuster(true);
              }}
              className="p-1.5 rounded-lg text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 cursor-pointer"
              title="Resistance Buster"
            >
              <Flame size={12} />
            </button>
          )}

          {!isDone && task.status !== 'doing' && (
            <button 
              type="button"
              onClick={() => handleStartTask(task)}
              className="p-1.5 rounded-lg text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/30 cursor-pointer"
              title="Start task (Set to Doing)"
            >
              <Activity size={12} />
            </button>
          )}

          {!isDone && (
            <button 
              type="button"
              onClick={() => handleDeferTask(task)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] cursor-pointer"
              title="Defer +1 day"
            >
              <FastForward size={12} />
            </button>
          )}

          <button 
            type="button"
            onClick={() => onEditTask(task)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] cursor-pointer"
            title="Edit Task"
          >
            <Edit3 size={12} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-12 font-sans select-none">
      
      {/* 1. HERO GREETING (Exact Prahari Reference Layout) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pt-1">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hello, {user?.name || "Prasad Sangale"}.
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl">
            AISankalp Autonomous Intelligence is online. Continuously calibrating your 5 Life Pillars, Eisenhower priority execution, and personal knowledge workspace to maximize cognitive momentum.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          <button 
            type="button"
            onClick={() => {
              if (onOpenCopilot) {
                onOpenCopilot('Generate a comprehensive executive daily briefing and 80/20 prioritization plan for today across my 5 Life Pillars and active tasks.');
              } else {
                setShowTodayPromptModal(true);
              }
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer tracking-wide"
          >
            <Sparkles className="w-5 h-5" />
            <span>Generate AI Daily Briefing</span>
          </button>
        </div>
      </div>

      {/* 2. ROW OF 3 EXECUTIVE STAT CARDS (Prahari Executive Aesthetic) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        
        {/* Card 1: CRITICAL / P0 FOCUS */}
        <div className="rounded-2xl p-5 bg-white dark:bg-[#11161D] border border-slate-200/80 dark:border-[#1E293B] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-slate-300 dark:hover:border-slate-700/80 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              CRITICAL / P0 FOCUS
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" strokeWidth={2} />
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-3 mb-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight leading-none">
              {criticalTasksCount}
            </span>
            <div className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg border bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 font-mono shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12.5%</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-400 mt-2">
            High-leverage tasks requiring immediate focus
          </p>
        </div>

        {/* Card 2: HABIT MOMENTUM */}
        <div className="rounded-2xl p-5 bg-white dark:bg-[#11161D] border border-slate-200/80 dark:border-[#1E293B] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-slate-300 dark:hover:border-slate-700/80 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              HABIT MOMENTUM
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" strokeWidth={2} />
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-3 mb-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight leading-none">
              {completedItemsCount}
            </span>
            <div className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-mono shrink-0">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>-4.3%</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-400 mt-2">
            Atomic daily routines completed this cycle
          </p>
        </div>

        {/* Card 3: TOTAL KNOWLEDGE ASSETS */}
        <div className="rounded-2xl p-5 bg-white dark:bg-[#11161D] border border-slate-200/80 dark:border-[#1E293B] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-slate-300 dark:hover:border-slate-700/80 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              TOTAL KNOWLEDGE ASSETS
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" strokeWidth={2} />
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-3 mb-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight leading-none">
              {totalAssetsCount}
            </span>
            <div className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-mono shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+15.7%</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-400 mt-2">
            Synchronized across 5 Life Pillars
          </p>
        </div>
      </div>

      {/* 3. MIDDLE 2-COLUMN ANALYTICS GRID (Prahari Dual Bar Chart & Donut Chart Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Column 1: PILLAR EXECUTION DENSITY (Span 2) */}
        <div className="lg:col-span-2 rounded-2xl p-5 bg-white dark:bg-[#11161D] border border-slate-200/80 dark:border-[#1E293B] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all flex flex-col">
          <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart2 size={16} className="text-[#FF5A1F]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                  PILLAR EXECUTION DENSITY
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pending vs Completed execution per Life Pillar
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#EF4444]" />
                <span className="text-slate-600 dark:text-slate-400">Pending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#10B981]" />
                <span className="text-slate-600 dark:text-slate-400">Completed</span>
              </div>
            </div>
          </div>

          {/* Dual Bar Rows */}
          <div className="space-y-4 pt-1 flex-1">
            {pillarStats.map(row => (
              <div key={row.id} className="flex items-center text-xs">
                <span className="w-24 text-right pr-4 font-semibold text-slate-700 dark:text-slate-300 text-xs shrink-0 truncate">
                  {row.label}
                </span>

                <div className="flex-1 flex flex-col gap-1.5 relative">
                  {/* Pending Bar (Red) */}
                  <div className="h-2 bg-slate-100 dark:bg-slate-800/60 rounded-full overflow-hidden w-full">
                    <div 
                      className="h-full bg-[#EF4444] rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(row.pending, row.pending > 0 ? 4 : 0)}%` }}
                    />
                  </div>

                  {/* Completed Bar (Green) */}
                  <div className="h-2 bg-slate-100 dark:bg-slate-800/60 rounded-full overflow-hidden w-full">
                    <div 
                      className="h-full bg-[#10B981] rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(row.done, row.done > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* X-Axis Scale Grid (0, 25, 50, 75, 100) */}
            <div className="flex items-center text-[10px] text-slate-400 font-mono pt-3 pl-28 border-t border-slate-200/80 dark:border-slate-800 justify-between">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Column 2: COGNITIVE LOAD DISTRIBUTION (Circular Donut Chart) */}
        <div className="rounded-2xl p-5 bg-white dark:bg-[#11161D] border border-slate-200/80 dark:border-[#1E293B] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <PieChart size={16} className="text-purple-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                COGNITIVE LOAD DISTRIBUTION
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Multi-tier Eisenhower allocation across active items
            </p>
          </div>

          {/* SVG Donut Ring */}
          <div className="flex items-center justify-center py-6 relative">
            <svg width="170" height="170" viewBox="0 0 170 170" className="transform -rotate-90">
              <circle
                cx="85"
                cy="85"
                r="62"
                stroke="currentColor"
                strokeWidth="18"
                fill="transparent"
                className="text-slate-100 dark:text-slate-800/60"
              />
              {/* Green Arc (Completed) */}
              <circle
                cx="85"
                cy="85"
                r="62"
                stroke="#10B981"
                strokeWidth="18"
                fill="transparent"
                strokeDasharray="389"
                strokeDashoffset={totalAssetsCount > 0 ? Math.max(389 - (389 * (completedItemsCount / totalAssetsCount)), 0) : 389}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
              {/* Red Arc (Critical / Pending) */}
              <circle
                cx="85"
                cy="85"
                r="62"
                stroke="#EF4444"
                strokeWidth="18"
                fill="transparent"
                strokeDasharray="389"
                strokeDashoffset={totalAssetsCount > 0 ? Math.max(389 - (389 * (criticalTasksCount / totalAssetsCount)), 0) : 389}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>

            {/* Centered Donut Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                {totalAssetsCount}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
                ASSETS
              </span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="flex items-center justify-around pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
              <span className="text-slate-500 dark:text-slate-400">Critical / Focus</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white ml-1">{criticalTasksCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span className="text-slate-500 dark:text-slate-400">Done</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white ml-1">{completedItemsCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. FULL-WIDTH CARD: TOP PRODUCTIVITY BOTTLENECKS */}
      <div className="rounded-2xl p-5 bg-white dark:bg-[#11161D] border border-slate-200/80 dark:border-[#1E293B] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
              TOP PRODUCTIVITY BOTTLENECKS
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/20 font-mono">
              COGNITIVE FRICTION DEFECTS
            </span>
          </div>

          {onNavigateSection && (
            <button
              type="button"
              onClick={() => onNavigateSection('analytics')}
              className="text-xs font-bold text-amber-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Productivity Analytics Deep Dive</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-400 mb-4">
          Cognitive friction vectors with the highest delay and procrastination correlation across active projects
        </p>

        {/* 3 Horizontal Color Bars */}
        <div className="space-y-3">
          {[
            { label: 'Task Ambiguity (Missing Next Step)', color: '#EF4444', pct: 82 },
            { label: 'Context Switching & App Toggling', color: '#F59E0B', pct: 64 },
            { label: 'Unscheduled Large Backlog Items', color: '#8B5CF6', pct: 47 }
          ].map(b => (
            <div key={b.label} className="flex items-center text-xs">
              <span className="w-52 text-right pr-3 font-semibold text-slate-700 dark:text-slate-300 text-xs shrink-0 truncate">
                {b.label}
              </span>
              <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${b.pct}%`, backgroundColor: b.color }}
                />
              </div>
              <span className="w-12 text-right pl-2 font-mono text-[10.5px] text-slate-400">
                {b.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. INTERACTIVE OPERATIONAL DELIVERABLES & QUICK CAPTURE */}
      <div className="rounded-2xl p-5 bg-white dark:bg-[#11161D] border border-slate-200 dark:border-[#1E293B] shadow-xs space-y-4">
        
        {/* Header & Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[#FF5A1F]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                OPERATIONAL EXECUTION QUEUE
              </h3>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold text-slate-400">
              {onGoToMatrix && (
                <button
                  type="button"
                  onClick={onGoToMatrix}
                  className="hover:text-[#FF5A1F] transition-colors cursor-pointer"
                >
                  Matrix →
                </button>
              )}
              {onGoToInbox && (
                <button
                  type="button"
                  onClick={onGoToInbox}
                  className="hover:text-[#FF5A1F] transition-colors cursor-pointer"
                >
                  Inbox →
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onAddTask && (
              <button
                type="button"
                onClick={onAddTask}
                className="px-2.5 py-1 rounded-lg bg-[#FF5A1F]/10 hover:bg-[#FF5A1F]/20 text-[#FF5A1F] text-xs font-bold transition-colors cursor-pointer mr-1"
                title="Open detailed task modal"
              >
                + Modal
              </button>
            )}
            {[
              { id: 'today', label: `Today's Agenda (${dueTodayTasks.length})` },
              { id: 'week', label: `Top Priorities (${topPriorities.length})` },
              { id: 'overdue', label: `Overdue (${overdueTasks.length})`, alert: overdueTasks.length > 0 }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#FF5A1F]/15 text-[#FF5A1F] border border-[#FF5A1F]/40'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Task Capture Inline Form */}
        <form onSubmit={handleCreateQuickTask} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type task or deliverable and press Enter..."
            value={quickTaskTitle}
            onChange={(e) => setQuickTaskTitle(e.target.value)}
            className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#FF5A1F]"
          />
          <button
            type="submit"
            disabled={!quickTaskTitle.trim()}
            className="px-4 py-2.5 rounded-xl bg-[#FF5A1F] hover:bg-[#EA580C] text-white text-xs font-bold disabled:opacity-40 cursor-pointer shadow-xs"
          >
            Add Task
          </button>
        </form>

        {/* Active Task Items List */}
        <div className="space-y-2 pt-1">
          {activeTab === 'today' && (
            dueTodayTasks.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No scheduled tasks due today. All nominal!
              </div>
            ) : (
              dueTodayTasks.map(t => renderTaskCard(t, { label: 'Due Today', color: '#10B981' }))
            )
          )}

          {activeTab === 'week' && (
            topPriorities.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No active priorities marked.
              </div>
            ) : (
              topPriorities.map((t, idx) => renderTaskCard(t, { label: `#${idx + 1} Priority`, color: '#F59E0B' }))
            )
          )}

          {activeTab === 'overdue' && (
            overdueTasks.length === 0 ? (
              <div className="text-center py-6 text-xs text-emerald-500 font-semibold">
                Zero overdue tasks. Operational momentum is 100%!
              </div>
            ) : (
              overdueTasks.map(t => renderTaskCard(t, { label: 'Overdue', color: '#EF4444' }))
            )
          )}
        </div>
      </div>

      {/* Circadian Energy Pulse Tracker */}
      <EnergyPulseWidget />

      {/* Modals */}
      {showTodayPromptModal && (
        <PromptWiseModal 
          isOpen={showTodayPromptModal}
          onClose={() => setShowTodayPromptModal(false)}
        />
      )}

      {showFlowCockpit && flowTask && (
        <FlowCockpitModal
          task={flowTask}
          isOpen={showFlowCockpit}
          onClose={() => setShowFlowCockpit(false)}
        />
      )}

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

      {showDecisionDuel && (
        <DecisionDuelModal
          tasks={activeTasks}
          isOpen={showDecisionDuel}
          onClose={() => setShowDecisionDuel(false)}
          onStartFocus={(t) => {
            setFlowTask(t);
            setShowFlowCockpit(true);
          }}
          onBustResistance={(t) => {
            setResistanceTask(t);
            setShowResistanceBuster(true);
          }}
        />
      )}

      {showEveningChronicle && (
        <EveningChronicleModal
          isOpen={showEveningChronicle}
          onClose={() => setShowEveningChronicle(false)}
        />
      )}

      {showDecayRadar && (
        <BacklogDecayModal
          isOpen={showDecayRadar}
          onClose={() => setShowDecayRadar(false)}
          onBustResistance={(t) => {
            setResistanceTask(t);
            setShowResistanceBuster(true);
          }}
        />
      )}
    </div>
  );
};
