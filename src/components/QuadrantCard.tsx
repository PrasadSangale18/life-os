import { Check, X, Edit3, GripVertical } from 'lucide-react';
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
}

interface SortableTaskItemProps {
  task: Item;
  qColor: string;
  onToggle: () => void;
  onTrash: () => void;
  onEdit: () => void;
}

const SortableTaskItem = ({ task, qColor, onToggle, onTrash, onEdit }: SortableTaskItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { type: 'Task', task } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : (task.status === 'done' ? 0.42 : 1) };

  return (
    <div ref={setNodeRef} style={{ ...style, display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", position: "relative" }}>
      <div {...attributes} {...listeners} style={{ cursor: "grab", color: "#404060", marginTop: 2, touchAction: "none" }}>
        <GripVertical size={14} />
      </div>
      <button 
        onClick={onToggle} 
        aria-label="Toggle task"
        style={{ width: 19, height: 19, borderRadius: 5, border: `1.5px solid ${qColor}`, background: task.status === 'done' ? qColor : "transparent", flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, transition: "all 0.2s" }}
      >
        {task.status === 'done' && <Check size={10} color="#000" strokeWidth={3} />}
      </button>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 13, lineHeight: 1.55, color: "#c0c0d8", textDecoration: task.status === 'done' ? "line-through" : "none", fontFamily: "'Outfit', sans-serif", wordBreak: "break-word" }}>{task.title}</span>
        
        {/* Meta badges */}
        {(task.difficulty || task.estMinutes || task.deadline) && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", color: "#606080" }}>
            {task.difficulty && <span style={{ background: "rgba(255,255,255,0.05)", padding: "1px 4px", borderRadius: 3 }}>{task.difficulty}</span>}
            {task.estMinutes && <span style={{ background: "rgba(255,255,255,0.05)", padding: "1px 4px", borderRadius: 3 }}>{task.estMinutes}m</span>}
            {task.deadline && <span style={{ background: "rgba(255,77,126,0.1)", color: "#ff4d7e", padding: "1px 4px", borderRadius: 3 }}>Due: {new Date(task.deadline).toLocaleDateString()}</span>}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <button 
          onClick={onEdit} 
          aria-label="Edit task"
          style={{ background: "transparent", border: "none", color: "#1e1e35", cursor: "pointer", padding: 2, borderRadius: 4, flexShrink: 0, transition: "color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.color = qColor} 
          onMouseLeave={e => e.currentTarget.style.color = "#1e1e35"}
        >
          <Edit3 size={12} />
        </button>
        <button 
          onClick={onTrash} 
          aria-label="Delete task"
          style={{ background: "transparent", border: "none", color: "#1e1e35", cursor: "pointer", padding: 2, borderRadius: 4, flexShrink: 0, transition: "color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#ff4d7e"} 
          onMouseLeave={e => e.currentTarget.style.color = "#1e1e35"}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
};

export const QuadrantCard = ({ quadrantId, activePillar, isMobile, onAddTaskClick, onEditTask }: QuadrantCardProps) => {
  const q = QUADRANTS.find(x => x.id === quadrantId)!;
  const items = useStore(state => state.items);
  const toggleTaskStatus = useStore(state => state.toggleTaskStatus);
  const trashItem = useStore(state => state.trashItem);

  const { setNodeRef } = useDroppable({ id: quadrantId, data: { type: 'Quadrant', quadrantId } });

  const qTasks = items.filter(t => t.type === 'task' && !t.deletedAt && t.pillar === activePillar && t.quadrant === quadrantId);
  
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
    <div ref={setNodeRef} style={{ background: q.bg, border: `1px solid ${q.border}`, borderRadius: 14, display: "flex", flexDirection: "column", overflow: isMobile ? "visible" : "hidden", height: isMobile ? "auto" : "100%" }}>
      <div style={{ padding: "11px 13px 8px", borderBottom: `1px solid ${q.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: q.color }}>{q.name}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: "#383860", marginTop: 1 }}>{q.label}</div>
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, padding: "2px 8px", borderRadius: 20, border: `1px solid ${q.color}40`, color: q.color, fontWeight: 700 }}>{qDone}/{qTasks.length}</div>
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: "#252545", marginTop: 3 }}>{q.hint}</div>
      </div>
      <div style={{ flex: isMobile ? "none" : 1, overflowY: isMobile ? "visible" : "auto", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
        {qTasks.length === 0 && (
          <div 
            onClick={onAddTaskClick}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 0", gap: 4, color: "#1e1e35", fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, textAlign: "center", cursor: "pointer" }}
          >
            <span style={{ fontSize: 14 }}>✦</span><span>Tap + to add a task</span>
          </div>
        )}
        {qTasks.map((task: Item) => (
          <SortableTaskItem 
            key={task.id} 
            task={task} 
            qColor={q.color}
            onToggle={() => toggleTaskStatus(task.id)}
            onTrash={() => trashItem(task.id)}
            onEdit={() => onEditTask(task)}
          />
        ))}
      </div>
    </div>
  );
};
