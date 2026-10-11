import type { Item } from '../types';

export const filterAndSortTasks = (
  tasks: Item[],
  filters: {
    search: string;
    pillar: string;
    status: string;
    difficulty: string;
    deadline: string;
    showPrivate?: boolean;
  },
  sortOption: 'easy-short' | 'hard-long' | 'deadline' | 'newest'
): Item[] => {
  const now = Date.now();
  const filtered = tasks.filter(t => {
    // Privacy
    if (!filters.showPrivate && t.isPrivate) return false;

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !(t.body && t.body.toLowerCase().includes(q))) return false;
    }
    // Pillar
    if (filters.pillar !== 'all' && t.pillar !== filters.pillar) return false;
    // Status
    if (filters.status === 'todo' && t.status === 'done') return false;
    if (filters.status === 'done' && t.status !== 'done') return false;
    if (filters.status === 'doing' && t.status !== 'doing') return false;
    // Difficulty
    if (filters.difficulty !== 'all' && t.difficulty !== filters.difficulty) return false;
    // Deadline
    if (filters.deadline !== 'all') {
      if (!t.deadline) {
        if (filters.deadline !== 'none') return false;
      } else {
        if (filters.deadline === 'none') return false;
        const todayObj = new Date(now);
        todayObj.setHours(23, 59, 59, 999);
        const endOfToday = todayObj.getTime();
        
        if (filters.deadline === 'overdue' && t.deadline >= now) return false;
        if (filters.deadline === 'today' && (t.deadline < now || t.deadline > endOfToday)) return false;
        
        todayObj.setDate(todayObj.getDate() + (7 - todayObj.getDay()));
        const endOfWeek = todayObj.getTime();
        if (filters.deadline === 'this-week' && (t.deadline < now || t.deadline > endOfWeek)) return false;
      }
    }
    return true;
  });

  return filtered.sort((a, b) => {
    if (sortOption === 'newest') return b.createdAt - a.createdAt;
    if (sortOption === 'deadline') {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline - b.deadline;
    }
    
    const diffMap: Record<string, number> = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
    const aDiff = diffMap[a.difficulty || 'Medium'] || 2;
    const bDiff = diffMap[b.difficulty || 'Medium'] || 2;
    const aMin = a.estMinutes || 30;
    const bMin = b.estMinutes || 30;
    
    if (sortOption === 'easy-short') {
      if (aDiff !== bDiff) return aDiff - bDiff;
      return aMin - bMin;
    }
    if (sortOption === 'hard-long') {
      if (aDiff !== bDiff) return bDiff - aDiff;
      return bMin - aMin;
    }
    return 0;
  });
};
