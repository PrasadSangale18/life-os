import { describe, it, expect } from 'vitest';
import { selectDashboardTasks, selectInboxItems, selectNotes, selectStalledTasks } from './selectors';
import type { Item } from '../types';

describe('Data Selectors Phase 5 (Condition 0.a)', () => {
  const items: Partial<Item>[] = [
    { id: '1', type: 'task', pillar: 'physical', quadrant: 'do', isPrivate: false },
    { id: '2', type: 'task', pillar: 'physical', quadrant: 'do', isPrivate: true },
    { id: '3', type: 'task', pillar: 'mental', quadrant: 'do', isPrivate: false },
    
    { id: '4', type: 'idea', isPrivate: false }, // Inbox item (no pillar)
    { id: '5', type: 'idea', isPrivate: true },  // Inbox item
    
    { id: '6', type: 'note', isPrivate: false }, // Note
    { id: '7', type: 'note', isPrivate: true },  // Note
  ];

  it('Dashboard hides private tasks unless showPrivate is true', () => {
    const publicDash = selectDashboardTasks(items as Item[], 'physical', false);
    expect(publicDash.length).toBe(1);
    expect(publicDash[0].id).toBe('1');

    const privateDash = selectDashboardTasks(items as Item[], 'physical', true);
    expect(privateDash.length).toBe(2);
    expect(privateDash.map(i => i.id)).toEqual(['1', '2']);
  });

  it('Inbox hides private items unless showPrivate is true', () => {
    const publicInbox = selectInboxItems(items as Item[], false);
    // Task 3 has pillar but no quadrant? Wait, task 3 has quadrant 'do' and pillar 'mental' -> not inbox.
    // 4 and 6 are public, have no pillar. (Notes without pillars are in Inbox until organized)
    expect(publicInbox.length).toBe(2);
    expect(publicInbox.map(i => i.id)).toEqual(['4', '6']);

    const privateInbox = selectInboxItems(items as Item[], true);
    expect(privateInbox.length).toBe(4);
    expect(privateInbox.map(i => i.id)).toEqual(['4', '5', '6', '7']);
  });

  it('Notes hides private items unless showPrivate is true', () => {
    const valid = ['note'];
    const publicNotes = selectNotes(items as Item[], valid, false);
    expect(publicNotes.length).toBe(1);
    expect(publicNotes[0].id).toBe('6');

    const privateNotes = selectNotes(items as Item[], valid, true);
    expect(privateNotes.length).toBe(2);
    expect(privateNotes.map(i => i.id)).toEqual(['6', '7']);
  });

  it('detects stalled tasks properly with a fake clock parameter', () => {
    const now = 1000000000000;
    const thirteenDays = 13 * 24 * 60 * 60 * 1000;
    const fifteenDays = 15 * 24 * 60 * 60 * 1000;

    const taskList: Partial<Item>[] = [
      { id: '1', type: 'task', status: 'todo', updatedAt: now, isPrivate: false }, // Updated now
      { id: '2', type: 'task', status: 'todo', updatedAt: now - thirteenDays, isPrivate: false }, // 13 days - NOT stalled
      { id: '3', type: 'task', status: 'todo', updatedAt: now - fifteenDays, isPrivate: false }, // 15 days - stalled
      { id: '4', type: 'task', status: 'done', updatedAt: now - fifteenDays, isPrivate: false }  // Stalled but done -> exclude
    ];

    const stalled = selectStalledTasks(taskList as Item[], now, true);
    expect(stalled.length).toBe(1);
    expect(stalled[0].id).toBe('3');
  });

  it('excludes archived items from Dashboard and Inbox selectors', () => {
    const list: Partial<Item>[] = [
      { id: '1', type: 'task', pillar: 'physical', quadrant: 'do', isArchived: true, isPrivate: false },
      { id: '2', type: 'task', pillar: 'physical', quadrant: 'do', isArchived: false, isPrivate: false },
      { id: '3', type: 'task', isArchived: true, isPrivate: false }, // Archived inbox task
      { id: '4', type: 'task', isArchived: false, isPrivate: false }, // Active inbox task (quick capture)
    ];

    const dash = selectDashboardTasks(list as Item[], 'physical', true);
    expect(dash.length).toBe(1);
    expect(dash[0].id).toBe('2');

    const inbox = selectInboxItems(list as Item[], true);
    expect(inbox.length).toBe(1);
    expect(inbox[0].id).toBe('4');
  });
});
