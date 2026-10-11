import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useStore } from './index';
import { db } from '../db';


describe('LifeOS Store Persistence & Logic', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    await db.items.clear();
    await db.store.clear();
    useStore.setState({ items: [], isLoaded: false, user: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds, edits, moves, trashes, and undoes a task with Dexie persistence', async () => {
    const store = useStore.getState();

    // 1. Add task
    const id = await store.addItem({
      title: 'Buy Groceries',
      type: 'task',
      pillar: 'physical',
      quadrant: 'do',
      difficulty: 'Easy',
      estMinutes: 15,
      status: 'todo'
    });

    expect(useStore.getState().items.length).toBe(1);
    expect(useStore.getState().items[0].id).toBe(id);

    const dbItem = await db.items.get(id);
    expect(dbItem?.title).toBe('Buy Groceries');

    // 2. Edit & Move task
    await store.updateItem(id, {
      title: 'Buy Healthy Groceries',
      quadrant: 'decide'
    });

    expect(useStore.getState().items[0].title).toBe('Buy Healthy Groceries');
    expect(useStore.getState().items[0].quadrant).toBe('decide');

    // 3. Trash task
    await store.trashItem(id);
    expect(useStore.getState().items[0].deletedAt).toBeDefined();

    // 4. Undo trash
    await store.restoreItem(id);
    expect(useStore.getState().items[0].deletedAt).toBeUndefined();

    // 5. Reload Simulation
    useStore.setState({ items: [], isLoaded: false });
    await useStore.getState().init();
    
    const reloadedStore = useStore.getState();
    expect(reloadedStore.items.length).toBe(1);
    expect(reloadedStore.items[0].title).toBe('Buy Healthy Groceries');
    expect(reloadedStore.items[0].deletedAt).toBeUndefined();
  });

  it('purges trash items older than 30 days on init', async () => {
    const store = useStore.getState();
    const id = await store.addItem({ title: 'Old trash', type: 'task', pillar: 'physical', quadrant: 'do' });
    
    // Trash it now
    await store.trashItem(id);
    
    // Advance time by 31 days
    vi.advanceTimersByTime(31 * 24 * 60 * 60 * 1000);
    
    // Re-init (simulating app restart)
    useStore.setState({ items: [], isLoaded: false });
    await useStore.getState().init();
    
    // Item should be gone from both Zustand and Dexie
    expect(useStore.getState().items.length).toBe(0);
    const dbItem = await db.items.get(id);
    expect(dbItem).toBeUndefined();
  });

  it('keeps trash items newer than 30 days on init', async () => {
    const store = useStore.getState();
    const id = await store.addItem({ title: 'Recent trash', type: 'task', pillar: 'physical', quadrant: 'do' });
    
    await store.trashItem(id);
    vi.advanceTimersByTime(29 * 24 * 60 * 60 * 1000); // Only 29 days
    
    useStore.setState({ items: [], isLoaded: false });
    await useStore.getState().init();
    
    expect(useStore.getState().items.length).toBe(1);
    expect(useStore.getState().items[0].deletedAt).toBeDefined();
  });
});
