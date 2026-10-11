import { useState, useMemo } from 'react';
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
import { selectDashboardTasks } from '../utils/selectors';
import type { Item } from '../types';

interface DashboardProps {
  activePillar: PillarId;
  isMobile: boolean;
  onAddTaskClick: (quadrantId: string) => void;
  onEditTask: (task: Item) => void;
}

export const Dashboard = ({ activePillar, isMobile, onAddTaskClick, onEditTask }: DashboardProps) => {
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

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: any) => {
    // Handling moving between quadrants if we want to drop into an empty quadrant or over another item
    const { over } = event;
    if (!over) return;
    
    // Complex quadrant switching logic could go here
    // For now, simpler DragEnd handles the final move if dropped into a QuadrantCard area
  };

  const handleDragEnd = (event: any) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    // Check if over a specific quadrant (would need to make QuadrantCard a droppable area)
    // Or if dropped over another item in a different quadrant
    const activeItem = items.find(i => i.id === active.id);
    const overItem = items.find(i => i.id === over.id);

    if (activeItem && overItem && activeItem.quadrant !== overItem.quadrant) {
      updateItem(activeItem.id, { quadrant: overItem.quadrant });
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
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gridTemplateRows: isMobile ? "auto" : "1fr 1fr", gap: 16, height: isMobile ? "auto" : "calc(100vh - 120px)", minHeight: isMobile ? "auto" : 500 }}>
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
      <DragOverlay>
        {activeTask ? (
          <div style={{ padding: "8px 10px", borderRadius: 8, background: "#1a1a2e", border: "1px solid #4d9eff", color: "#fff", opacity: 0.9 }}>
            {activeTask.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
