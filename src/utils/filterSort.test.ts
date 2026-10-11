import { describe, it, expect } from 'vitest';
import { filterAndSortTasks } from './filterSort';
import type { Item } from '../types';

describe('filterAndSortTasks', () => {
  const baseTask: Partial<Item> = { type: 'task', createdAt: 1000, updatedAt: 1000, status: 'todo' };
  
  const tasks: Item[] = [
    { ...baseTask, id: '1', title: 'Buy milk', pillar: 'physical', difficulty: 'Easy', estMinutes: 10, deadline: Date.now() - 10000, createdAt: 100 } as Item, // Overdue
    { ...baseTask, id: '2', title: 'Read book', pillar: 'mental', difficulty: 'Medium', estMinutes: 30, status: 'done', createdAt: 200 } as Item, // Done, no deadline
    { ...baseTask, id: '3', title: 'Code project', pillar: 'financial', difficulty: 'Hard', estMinutes: 120, deadline: Date.now() + 86400000 * 2, createdAt: 300 } as Item, // This week
    { ...baseTask, id: '4', title: 'Call mom', pillar: 'relational', difficulty: 'Easy', estMinutes: 5, deadline: Date.now() + 1000, createdAt: 400 } as Item, // Today
  ];

  it('filters by search', () => {
    const res = filterAndSortTasks(tasks, { search: 'milk', pillar: 'all', status: 'all', difficulty: 'all', deadline: 'all' }, 'newest');
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('1');
  });

  it('filters by pillar', () => {
    const res = filterAndSortTasks(tasks, { search: '', pillar: 'mental', status: 'all', difficulty: 'all', deadline: 'all' }, 'newest');
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('2');
  });

  it('filters by status', () => {
    const res = filterAndSortTasks(tasks, { search: '', pillar: 'all', status: 'done', difficulty: 'all', deadline: 'all' }, 'newest');
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('2');
  });

  it('filters by difficulty', () => {
    const res = filterAndSortTasks(tasks, { search: '', pillar: 'all', status: 'all', difficulty: 'Hard', deadline: 'all' }, 'newest');
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('3');
  });

  it('filters by deadline (overdue)', () => {
    const res = filterAndSortTasks(tasks, { search: '', pillar: 'all', status: 'all', difficulty: 'all', deadline: 'overdue' }, 'newest');
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('1');
  });

  it('filters by deadline (today)', () => {
    const res = filterAndSortTasks(tasks, { search: '', pillar: 'all', status: 'all', difficulty: 'all', deadline: 'today' }, 'newest');
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('4');
  });

  it('filters by deadline (none)', () => {
    const res = filterAndSortTasks(tasks, { search: '', pillar: 'all', status: 'all', difficulty: 'all', deadline: 'none' }, 'newest');
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('2');
  });

  it('sorts by easy-short', () => {
    const res = filterAndSortTasks(tasks, { search: '', pillar: 'all', status: 'all', difficulty: 'all', deadline: 'all' }, 'easy-short');
    expect(res[0].id).toBe('4'); // Easy, 5m
    expect(res[1].id).toBe('1'); // Easy, 10m
    expect(res[2].id).toBe('2'); // Medium, 30m
    expect(res[3].id).toBe('3'); // Hard, 120m
  });

  it('sorts by hard-long', () => {
    const res = filterAndSortTasks(tasks, { search: '', pillar: 'all', status: 'all', difficulty: 'all', deadline: 'all' }, 'hard-long');
    expect(res[0].id).toBe('3'); // Hard, 120m
    expect(res[1].id).toBe('2'); // Medium, 30m
    expect(res[2].id).toBe('1'); // Easy, 10m
    expect(res[3].id).toBe('4'); // Easy, 5m
  });
  it('filters based on privacy flag for list/inbox/search views', () => {
    const mixedTasks: Partial<Item>[] = [
      { id: '1', title: 'Task 1', isPrivate: false, type: 'task' },
      { id: '2', title: 'Task 2', isPrivate: true, type: 'task' }
    ];

    const resultWithoutPrivate = filterAndSortTasks(mixedTasks as Item[], {
      search: '', pillar: 'all', status: 'all', difficulty: 'all', deadline: 'all', showPrivate: false
    }, 'newest');
    
    expect(resultWithoutPrivate.length).toBe(1);
    expect(resultWithoutPrivate[0].id).toBe('1');

    const resultWithPrivate = filterAndSortTasks(mixedTasks as Item[], {
      search: '', pillar: 'all', status: 'all', difficulty: 'all', deadline: 'all', showPrivate: true
    }, 'newest');

    expect(resultWithPrivate.length).toBe(2);
  });
});
