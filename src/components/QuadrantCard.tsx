import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Edit3, 
  Trash2, 
  GripVertical, 
  Plus, 
  Clock, 
  Calendar, 
  Lock,
  Radio,
  Flame
} from 'lucide-react';
import { useStore } from '../store';
import { QUADRANTS } from '../theme/tokens';
import type { QuadrantId, PillarId } from '../theme/tokens';
import type { Item } from '../types';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface QuadrantCardProps {
  quadrantId: QuadrantId;
  activePillar: PillarId;
  isMobile: boolean;
  onAddTaskClick: () => void;
  onEditTask: (task: Item) => void;
  onStartFocus?: (task: Item) => void;
  onBustResistance?: (task: Item) => void;
}

interface SortableTaskItemProps {
  task: Item;
  qColor: string;
  now: number;
  onToggle: () => void;
  onTrash: () => void;
  onEdit: () => void;
  onStartFocus?: (task: Item) => void;
  onBustResistance?: (task: Item) => void;
}

const QUADRANT_STYLES: Record<QuadrantId, {
  accent: string;
  topBorder: string;
  surfaceClass: string;
  glowClass: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}> = {
  do: {
    accent: '#34D399', // Emerald-400
    topBorder: 'border-t-2 border-t-emerald-500/80 shadow-[0_-4px_12px_rgba(16,185,129,0.15)]',
    surfaceClass: 'bg-emerald-500/[0.02]',
    glowClass: 'bg-emerald-500/10 group-hover/quadrant:bg-emerald-500/20',
    badgeBg: 'rgba(52, 211, 153, 0.1)',
    badgeText: '#34D399',
    badgeBorder: 'rgba(52, 211, 153, 0.3)'
  },
  decide: {
    accent: '#38BDF8', // Sky-400
    topBorder: 'border-t-2 border-t-sky-500/80 shadow-[0_-4px_12px_rgba(56,189,248,0.15)]',
    surfaceClass: 'bg-sky-500/[0.02]',
    glowClass: 'bg-sky-500/10 group-hover/quadrant:bg-sky-500/20',
    badgeBg: 'rgba(56, 189, 248, 0.1)',
    badgeText: '#38BDF8',
    badgeBorder: 'rgba(56, 189, 248, 0.3)'
  },
  delegate: {
    accent: '#FBBF24', // Amber-400
    topBorder: 'border-t-2 border-t-amber-500/80 shadow-[0_-4px_12px_rgba(251,191,36,0.15)]',
    surfaceClass: 'bg-amber-500/[0.02]',
    glowClass: 'bg-amber-500/10 group-hover/quadrant:bg-amber-500/20',
    badgeBg: 'rgba(251, 191, 36, 0.1)',
    badgeText: '#FBBF24',
    badgeBorder: 'rgba(251, 191, 36, 0.3)'
  },
  delete: {
    accent: '#FB7185', // Rose-400
    topBorder: 'border-t-2 border-t-rose-500/80 shadow-[0_-4px_12px_rgba(251,113,133,0.15)]',
    surfaceClass: 'bg-rose-500/[0.02]',
    glowClass: 'bg-rose-500/10 group-hover/quadrant:bg-rose-500/20',
    badgeBg: 'rgba(251, 113, 133, 0.1)',
    badgeText: '#FB7185',
    badgeBorder: 'rgba(251, 113, 133, 0.3)'
  }
};

const SortableTaskItem = ({ 
  task, 
  qColor, 
  now, 
  onToggle, 
  onTrash, 
  onEdit,
  onStartFocus,
  onBustResistance
}: SortableTaskItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: task.id, 
    data: { type: 'Task', task } 
  });
  
  const [hovered, setHovered] = useState(false);
  const isDone = task.status === 'done';

  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition, 
    opacity: isDragging ? 0.35 : (isDone ? 0.45 : 1) 
  };

  const isOverdue = task.deadline && task.deadline < now && !isDone;

  return (
    <motion.div 
      ref={setNodeRef} 
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{ ...style }}
      className={`group/task relative flex items-start gap-2.5 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
        isDone 
          ? 'bg-slate-100/60 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.04]' 
          : 'bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#1E293B] shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-[1px]'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onEdit}
    >
      {/* Drag grip */}
      <div 
        {...attributes} 
        {...listeners} 
        onClick={(e) => e.stopPropagation()}
        className="cursor-grab text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-0.5 touch-none transition-colors"
        title="Drag to rearrange"
      >
        <GripVertical size={13} strokeWidth={1.75} />
      </div>

      {/* Pill status circular checkbox */}
      <button 
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }} 
        aria-label="Toggle task status"
        className={`w-4 h-4 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 transition-all duration-200 ${
          isDone 
            ? 'border-transparent shadow-sm' 
            : 'border border-slate-300 dark:border-white/25 hover:border-slate-500 dark:hover:border-white/60 bg-white dark:bg-white/[0.03]'
        }`}
        style={{
          backgroundColor: isDone ? qColor : undefined,
          boxShadow: isDone ? `0 0 10px ${qColor}40` : undefined
        }}
      >
        {isDone && <Check size={10} color="#fff" strokeWidth={3} />}
      </button>

      {/* Title & Micro-Chips */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <span 
          className={`text-[13px] leading-snug tracking-tight transition-all ${
            isDone 
              ? 'text-slate-400 dark:text-slate-500 line-through font-normal' 
              : 'text-slate-900 dark:text-[#F8FAFC] font-medium'
          }`}
          style={{ wordBreak: 'break-word' }}
        >
          {task.title}
        </span>
        
        {/* Meta Chips */}
        {(task.difficulty || task.estMinutes || task.deadline || task.tags?.length || task.isPrivate) && (
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {task.isPrivate && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06]">
                <Lock size={10} strokeWidth={1.75} />
                <span>Private</span>
              </span>
            )}

            {task.difficulty && (
              <span 
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                  task.difficulty === 'Hard' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30' :
                  task.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' :
                  'bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.06]'
                }`}
              >
                {task.difficulty}
              </span>
            )}

            {task.estMinutes && (
              <span className="inline-flex items-center gap-1 text-[10.5px] font-mono text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] tabular-nums">
                <Clock size={10} strokeWidth={1.75} className="text-slate-400" />
                <span>{task.estMinutes}m</span>
              </span>
            )}

            {task.deadline && (
              <span 
                className={`inline-flex items-center gap-1 text-[10.5px] font-mono px-1.5 py-0.5 rounded border tabular-nums ${
                  isOverdue 
                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.25)]' 
                    : 'bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.06]'
                }`}
              >
                <Calendar size={10} strokeWidth={1.75} className={isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'} />
                <span>{new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </span>
            )}

            {task.tags && task.tags.length > 0 && (
              <span className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.03] px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/[0.05]">
                #{task.tags[0]}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons on Hover */}
      <div 
        className={`flex items-center gap-1 transition-opacity ${
          hovered ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {onStartFocus && !isDone && (
          <button
            type="button"
            onClick={() => onStartFocus(task)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-[#FF5A1F] hover:bg-[#FF5A1F]/20 transition-colors"
            title="Launch Flow Focus Cockpit"
          >
            <Radio size={12} strokeWidth={2} />
          </button>
        )}
        {onBustResistance && !isDone && (
          <button
            type="button"
            onClick={() => onBustResistance(task)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-amber-400 hover:bg-amber-400/20 transition-colors"
            title="Bust Procrastination / 2-Min Action"
          >
            <Flame size={12} fill="currentColor" strokeWidth={1.5} />
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors"
          title="Edit Task"
        >
          <Edit3 size={12} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onTrash}
          className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          title="Trash Task"
        >
          <Trash2 size={12} strokeWidth={1.75} />
        </button>
      </div>
    </motion.div>
  );
};

export const QuadrantCard = ({ 
  quadrantId, 
  activePillar, 
  isMobile, 
  onAddTaskClick, 
  onEditTask,
  onStartFocus,
  onBustResistance
}: QuadrantCardProps) => {
  const q = QUADRANTS.find(x => x.id === quadrantId)!;
  const items = useStore(state => state.items);
  const toggleTaskStatus = useStore(state => state.toggleTaskStatus);
  const trashItem = useStore(state => state.trashItem);
  const showPrivate = useStore(state => state.showPrivate);
  const [now] = useState(() => Date.now());

  const { setNodeRef } = useDroppable({ id: quadrantId, data: { type: 'Quadrant', quadrantId } });
  const themeStyle = QUADRANT_STYLES[quadrantId] || QUADRANT_STYLES.do;

  const qTasks = items.filter(t => 
    t.type === 'task' && 
    !t.deletedAt && 
    !t.isArchived && 
    t.pillar === activePillar && 
    t.quadrant === quadrantId && 
    (showPrivate || !t.isPrivate)
  );
  
  qTasks.sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;

    const diffMap: Record<string, number> = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
    const aDiff = diffMap[a.difficulty || 'Medium'] || 2;
    const bDiff = diffMap[b.difficulty || 'Medium'] || 2;
    if (aDiff !== bDiff) return aDiff - bDiff;

    const aMin = a.estMinutes || 30;
    const bMin = b.estMinutes || 30;
    if (aMin !== bMin) return aMin - bMin;

    if (a.deadline && b.deadline) return a.deadline - b.deadline;
    if (a.deadline) return -1;
    if (b.deadline) return 1;

    return 0;
  });

  const qDone = qTasks.filter(t => t.status === 'done').length;

  return (
    <div 
      ref={setNodeRef} 
      className={`group/quadrant relative flex flex-col rounded-2xl bg-white dark:bg-[#11161D] border border-slate-200 dark:border-[#1E293B] shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700 overflow-hidden ${themeStyle.topBorder} ${themeStyle.surfaceClass}`}
      style={{ 
        height: isMobile ? 'auto' : '100%',
        minHeight: isMobile ? 320 : 280,
      }}
    >
      {/* Ambient Corner Glow */}
      <div 
        className={`absolute -top-12 -left-12 w-40 h-40 rounded-full blur-2xl pointer-events-none transition-all duration-500 ${themeStyle.glowClass}`} 
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.01]">
        <div className="flex items-center gap-2.5">
          {/* Glowing dot indicator */}
          <div 
            className="w-2 h-2 rounded-full transition-shadow duration-300"
            style={{ 
              backgroundColor: themeStyle.accent,
              boxShadow: `0 0 10px ${themeStyle.accent}`
            }} 
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
                {q.name}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                {q.label}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 tracking-tight mt-0.5">
              {q.hint}
            </div>
          </div>
        </div>

        {/* Counter Badge & Add Button */}
        <div className="flex items-center gap-2">
          <span 
            className="font-mono text-xs px-2 py-0.5 rounded-md border tabular-nums transition-colors"
            style={{
              backgroundColor: themeStyle.badgeBg,
              color: themeStyle.badgeText,
              borderColor: themeStyle.badgeBorder
            }}
          >
            {qDone}/{qTasks.length}
          </span>
          <button 
            type="button"
            onClick={onAddTaskClick}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Add task to this quadrant"
          >
            <Plus size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Task List / Drop Zone */}
      <div className="relative z-10 flex-1 flex flex-col p-2.5 gap-2 overflow-y-auto">
        {qTasks.length === 0 ? (
          /* Interactive Tactile Dashed Drop Zone */
          <div 
            onClick={onAddTaskClick}
            className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.15] rounded-xl m-2 transition-all group cursor-pointer bg-slate-50/40 dark:bg-white/[0.01] hover:bg-slate-50 dark:hover:bg-white/[0.02]"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-white group-hover:scale-110 transition-all mb-2">
              <Plus className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200">No active tasks</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-600 group-hover:text-slate-500 mt-0.5">Click or drag items here</p>
          </div>
        ) : (
          <AnimatePresence>
            {qTasks.map((task: Item) => (
              <SortableTaskItem 
                key={task.id} 
                task={task} 
                qColor={themeStyle.accent}
                now={now}
                onToggle={() => toggleTaskStatus(task.id)}
                onTrash={() => trashItem(task.id)}
                onEdit={() => onEditTask(task)}
                onStartFocus={onStartFocus}
                onBustResistance={onBustResistance}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
