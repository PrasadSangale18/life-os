import React, { useState, useMemo } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useStore } from '../store';
import { QUADRANTS } from '../theme/tokens';
import type { PillarId } from '../theme/tokens';
import { QuadrantCard } from './QuadrantCard';
import { MetricCard } from './common/MetricCard';
import { selectDashboardTasks } from '../utils/selectors';
import type { Item } from '../types';
import { CheckSquare, Flame, TrendingUp, Target } from 'lucide-react';

interface DashboardProps {
  activePillar: PillarId;
  isMobile: boolean;
  onAddTaskClick: (quadrantId: string) => void;
  onEditTask: (task: Item) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  activePillar, 
  isMobile, 
  onAddTaskClick, 
  onEditTask 
}) => {
  const items = useStore(state => state.items);
  const updateItem = useStore(state => state.updateItem);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const showPrivate = useStore(state => state.showPrivate);
  const qTasks = selectDashboardTasks(items, activePillar, showPrivate);
  const activeTask = useMemo(() => items.find(i => i.id === activeId), [activeId, items]);

  const [currentTimestamp] = useState(() => Date.now());

  // Real-time productivity telemetry
  const stats = useMemo(() => {
    const activeTasks = items.filter(i => (i.type === 'task' || !i.type) && !i.deletedAt && !i.isArchived);
    const totalActive = activeTasks.filter(i => i.status !== 'done' && i.status !== 'dropped').length;
    const q1DoTasks = activeTasks.filter(i => i.quadrant === 'do' && i.status !== 'done' && i.status !== 'dropped').length;
    
    // Items completed in last 7 days
    const weekAgo = currentTimestamp - 7 * 24 * 60 * 60 * 1000;
    const doneThisWeek = items.filter(i => 
      (i.type === 'task' || !i.type) && 
      !i.deletedAt && 
      i.status === 'done' && 
      (i.updatedAt || 0) >= weekAgo
    ).length;
    
    // Pillar tasks count
    const pillarActive = activeTasks.filter(i => 
      i.pillar === activePillar && 
      i.status !== 'done' && 
      i.status !== 'dropped'
    ).length;
    
    const completionRate = totalActive + doneThisWeek > 0 
      ? Math.round((doneThisWeek / (totalActive + doneThisWeek)) * 100) 
      : 0;

    return {
      totalActive,
      q1DoTasks,
      doneThisWeek,
      pillarActive,
      completionRate: `${completionRate}%`
    };
  }, [items, activePillar, currentTimestamp]);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (_event: any) => {};

  const handleDragEnd = (event: any) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeItem = items.find(i => i.id === active.id);
    if (!activeItem) return;

    let targetQuadrant: any = undefined;
    if (QUADRANTS.some(q => q.id === over.id)) {
      targetQuadrant = over.id;
    } else if (over.data?.current?.type === 'Quadrant') {
      targetQuadrant = over.data.current.quadrantId;
    } else {
      const overItem = items.find(i => i.id === over.id);
      if (overItem) {
        targetQuadrant = overItem.quadrant;
      }
    }

    if (targetQuadrant && activeItem.quadrant !== targetQuadrant) {
      updateItem(activeItem.id, { quadrant: targetQuadrant });
    }
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4 w-full">
        {/* Productivity Telemetry Strip */}
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
          <MetricCard 
            title="Active Queue" 
            value={stats.totalActive} 
            trend={stats.completionRate} 
            trendLabel="done"
            icon={CheckSquare} 
            colorScheme="blue" 
            subtitle="Pending execution"
          />
          <MetricCard 
            title="Q1 Do First" 
            value={stats.q1DoTasks} 
            trend={stats.q1DoTasks > 0 ? 'Urgent' : 'Clear'} 
            icon={Flame} 
            colorScheme="red" 
            subtitle="Urgent & High Impact"
          />
          <MetricCard 
            title="7D Velocity" 
            value={stats.doneThisWeek} 
            trend={stats.doneThisWeek > 0 ? `+${stats.doneThisWeek}` : '0'} 
            trendLabel="done"
            icon={TrendingUp} 
            colorScheme="green" 
            subtitle="Completed this week"
          />
          <MetricCard 
            title={`${activePillar} Pillar`} 
            value={stats.pillarActive} 
            icon={Target} 
            colorScheme="purple" 
            subtitle={`Active in ${activePillar}`}
          />
        </div>

        {/* Symmetrical Eisenhower Matrix Quadrants */}
        <div 
          className={`grid gap-4 w-full ${
            isMobile 
              ? 'grid-cols-1 auto-rows-auto' 
              : 'grid-cols-1 md:grid-cols-2 h-[calc(100vh-270px)] min-h-[520px]'
          }`}
        >
          {QUADRANTS.map(q => (
            <SortableContext key={q.id} items={qTasks.filter(t => t.quadrant === q.id).map(t => t.id)}>
              <QuadrantCard 
                quadrantId={q.id} 
                activePillar={activePillar} 
                isMobile={isMobile} 
                onAddTaskClick={() => onAddTaskClick(q.id)} 
                onEditTask={onEditTask} 
              />
            </SortableContext>
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="p-3 rounded-xl bg-[#161B22] border border-white/[0.18] shadow-[0_12px_36px_rgba(0,0,0,0.6)] text-[#F8FAFC] text-[13px] font-medium max-w-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{activeTask.title}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
