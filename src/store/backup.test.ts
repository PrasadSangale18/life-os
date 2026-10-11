import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './index';
import { db } from '../db';
import type { Item } from '../types';

describe('Backup Phase 5 (Condition 0.c)', () => {
  beforeEach(async () => {
    await db.items.clear();
    await db.snapshots.clear();
    await db.store.clear();
    useStore.setState({ items: [], isLoaded: false, user: null });
  });

  it('export then wipe then restore gives identical data', async () => {
    const store = useStore.getState();

    // Setup dummy data
    await store.addItem({ title: 'Task 1', type: 'task', tags: ['work'] } as any);
    await store.commitImport('batch-1', [{ id: 'i1', title: 'Import 1', type: 'note', importBatchId: 'batch-1' } as Item]);

    expect(useStore.getState().items.length).toBe(2);

    // 1. Export
    const jsonStr = await store.exportData();

    // 2. Wipe
    await db.items.clear();
    await db.snapshots.clear();
    useStore.setState({ items: [] });
    expect(useStore.getState().items.length).toBe(0);

    // 3. Restore
    await store.importData(jsonStr);

    // Assert identical data
    const finalItems = useStore.getState().items;
    expect(finalItems.length).toBe(2);
    expect(finalItems.some(i => i.title === 'Task 1')).toBe(true);
    expect(finalItems.some(i => i.title === 'Import 1')).toBe(true);
    
    // Assert snapshot restored
    const snap = await db.snapshots.get('batch-1');
    expect(snap).toBeDefined();
    expect(snap?.id).toBe('batch-1');
  });

  it('automatically creates a pre-restore snapshot BEFORE wiping', async () => {
    const store = useStore.getState();
    await store.addItem({ title: 'Old Data', type: 'note' } as any);

    const backupJson = JSON.stringify({
      items: [{ id: 'new', title: 'New Data', type: 'note', createdAt: 0, updatedAt: 0 }]
    });

    await store.importData(backupJson);

    // It should have wiped and loaded 'New Data'
    const items = useStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].title).toBe('New Data');

    // BUT there should be a snapshot 'pre-restore-<timestamp>' with 'Old Data'
    const snaps = await db.snapshots.toArray();
    const preRestore = snaps.find(s => s.id.startsWith('pre-restore-'));
    expect(preRestore).toBeDefined();
    expect(preRestore?.items.length).toBe(1);
    expect(preRestore?.items[0].title).toBe('Old Data');
  });
});
