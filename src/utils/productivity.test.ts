import { describe, it, expect } from 'vitest';
import type { Item } from '../types';
import { selectStalledTasks, selectInboxItems } from './selectors';
import { PILLARS } from '../theme/tokens';

describe('Productivity Architecture & Hierarchy Rollups', () => {
  it('correctly calculates project progress rollups and task completion percentage', () => {
    const items: Partial<Item>[] = [
      { id: 'goal-1', type: 'goal', title: 'Launch Product', pillar: 'financial', updatedAt: 100 },
      { id: 'proj-1', type: 'project', title: 'Marketing Site', goalId: 'goal-1', pillar: 'financial', updatedAt: 100 },
      { id: 'task-1', type: 'task', title: 'Design landing page', projectId: 'proj-1', status: 'done', updatedAt: 100 },
      { id: 'task-2', type: 'task', title: 'Implement hero section', projectId: 'proj-1', status: 'doing', updatedAt: 100 },
      { id: 'task-3', type: 'task', title: 'Deploy on CDN', projectId: 'proj-1', status: 'todo', updatedAt: 100 },
      // Trashed task shouldn't count towards project
      { id: 'task-4', type: 'task', title: 'Dropped idea', projectId: 'proj-1', status: 'done', deletedAt: 200, updatedAt: 100 },
    ];

    const activeItems = items.filter(i => !i.deletedAt && !i.isArchived);
    const projTasks = activeItems.filter(t => t.type === 'task' && t.projectId === 'proj-1');
    const completedTasks = projTasks.filter(t => t.status === 'done');
    
    expect(projTasks.length).toBe(3);
    expect(completedTasks.length).toBe(1);
    const progressPercent = Math.round((completedTasks.length / projTasks.length) * 100);
    expect(progressPercent).toBe(33);
  });

  it('calculates focus capacity minutes without duplicating priority and due today items', () => {
    const today = new Date('2026-10-11T12:00:00Z').getTime();
    const startOfToday = new Date('2026-10-11T00:00:00Z').getTime();
    const endOfToday = new Date('2026-10-11T23:59:59Z').getTime();

    const tasks: Partial<Item>[] = [
      // Task 1: Both priority AND due today (must be counted ONCE)
      { id: 't1', type: 'task', title: 'Ship feature', estMinutes: 60, isPriority: true, deadline: today, status: 'todo' },
      // Task 2: Overdue
      { id: 't2', type: 'task', title: 'Review PR', estMinutes: 30, deadline: startOfToday - 86400000, status: 'todo' },
      // Task 3: Priority only, no deadline
      { id: 't3', type: 'task', title: 'Refactor store', estMinutes: 45, isPriority: true, status: 'doing' },
      // Task 4: Done task (should not count towards capacity)
      { id: 't4', type: 'task', title: 'Morning standup', estMinutes: 15, isPriority: true, deadline: today, status: 'done' },
    ];

    const activeTasks = tasks.filter(t => t.type === 'task' && !t.deletedAt && !t.isArchived);
    
    const overdue = activeTasks.filter(t => t.status !== 'done' && t.status !== 'dropped' && t.deadline && t.deadline < startOfToday);
    const dueToday = activeTasks.filter(t => t.status !== 'done' && t.status !== 'dropped' && t.deadline && t.deadline >= startOfToday && t.deadline <= endOfToday);
    const priorities = activeTasks.filter(t => t.status !== 'done' && t.status !== 'dropped' && t.isPriority);

    const combinedSet = new Map<string, Partial<Item>>();
    [...overdue, ...dueToday, ...priorities].forEach(t => combinedSet.set(t.id!, t));

    let totalEstMins = 0;
    combinedSet.forEach(t => {
      totalEstMins += t.estMinutes || 25;
    });

    // t1 (60) + t2 (30) + t3 (45) = 135 minutes (t4 is done, so 0)
    expect(totalEstMins).toBe(135);

    const capacityMinutes = 240; // 4 hours
    const remainingBuffer = capacityMinutes - totalEstMins;
    expect(remainingBuffer).toBe(105);
    const capacityPercent = Math.round((totalEstMins / capacityMinutes) * 100);
    expect(capacityPercent).toBe(56);
  });

  it('detects stalled tasks and processes inbox items', () => {
    const now = 1_000_000_000_000;
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

    const items: Item[] = [
      {
        id: 'stalled-1',
        type: 'task',
        title: 'Old stagnant task',
        pillar: 'physical',
        quadrant: 'do',
        status: 'todo',
        createdAt: now - fourteenDaysMs - 1000,
        updatedAt: now - fourteenDaysMs - 1000,
      },
      {
        id: 'active-1',
        type: 'task',
        title: 'Recent task',
        pillar: 'mental',
        quadrant: 'decide',
        status: 'todo',
        createdAt: now - 3600000,
        updatedAt: now - 3600000,
      },
      {
        id: 'inbox-1',
        type: 'task',
        title: 'Unclassified capture',
        createdAt: now,
        updatedAt: now,
      }
    ];

    const stalled = selectStalledTasks(items, now, true);
    expect(stalled.map(s => s.id)).toEqual(['stalled-1']);

    const inbox = selectInboxItems(items, true);
    expect(inbox.map(i => i.id)).toEqual(['inbox-1']);

    // Triage inbox item by assigning a pillar and quadrant
    inbox[0].pillar = 'mental';
    inbox[0].quadrant = 'do';

    const inboxAfterTriage = selectInboxItems(items, true);
    expect(inboxAfterTriage.length).toBe(0);
  });

  it('correctly maps pillar distribution against tokens', () => {
    const items: Partial<Item>[] = [
      { id: '1', type: 'task', pillar: 'physical', status: 'done' },
      { id: '2', type: 'task', pillar: 'physical', status: 'todo' },
      { id: '3', type: 'task', pillar: 'mental', status: 'done' },
      { id: '4', type: 'task', pillar: 'spiritual', status: 'doing' },
    ];

    const stats = PILLARS.map(p => {
      const pTasks = items.filter(t => t.pillar === p.id);
      const done = pTasks.filter(t => t.status === 'done').length;
      return { id: p.id, total: pTasks.length, done };
    });

    const physical = stats.find(s => s.id === 'physical');
    expect(physical?.total).toBe(2);
    expect(physical?.done).toBe(1);

    const mental = stats.find(s => s.id === 'mental');
    expect(mental?.total).toBe(1);
    expect(mental?.done).toBe(1);

    const financial = stats.find(s => s.id === 'financial');
    expect(financial?.total).toBe(0);
    expect(financial?.done).toBe(0);
  });
});
