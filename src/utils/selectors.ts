import type { Item, PillarId } from '../types';

export const selectDashboardTasks = (items: Item[], activePillar: PillarId, showPrivate: boolean): Item[] => {
  return items.filter(t => 
    t.type === 'task' && 
    !t.deletedAt && 
    !t.isArchived &&
    t.pillar === activePillar && 
    (showPrivate || !t.isPrivate)
  );
};

export const selectInboxItems = (items: Item[], showPrivate: boolean): Item[] => {
  return items.filter(t => 
    !t.deletedAt && 
    !t.isArchived &&
    (showPrivate || !t.isPrivate) && 
    (!t.pillar || (t.type === 'task' && !t.quadrant))
  );
};

export const selectNotes = (items: Item[], validTypes: string[], showPrivate: boolean): Item[] => {
  return items.filter(i => 
    validTypes.includes(i.type) && 
    !i.deletedAt && 
    !i.isArchived &&
    (showPrivate || !i.isPrivate)
  );
};

export const selectStalledTasks = (items: Item[], now: number, showPrivate: boolean): Item[] => {
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;
  return items.filter(i => 
    i.type === 'task' && 
    !i.deletedAt && 
    !i.isArchived && 
    i.status !== 'done' && 
    (now - i.updatedAt > fourteenDays) &&
    (showPrivate || !i.isPrivate)
  );
};
