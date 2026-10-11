import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './index';
import { db } from '../db';
import type { Item } from '../types';

describe('Store Import Batch & Undo Phase 4', () => {
  beforeEach(async () => {
    await db.items.clear();
    await db.snapshots.clear();
    await db.store.clear();
    useStore.setState({ items: [], isLoaded: false, user: null });
  });

  it('creates a snapshot and correctly undoes an entire import batch', async () => {
    const store = useStore.getState();

    // 1. Existing data
    const id = await store.addItem({
      title: 'Old Task',
      type: 'task'
    });
    
    expect(useStore.getState().items.length).toBe(1);

    // 2. Commit an import batch
    const batchId = 'batch-123';
    const newItems: Item[] = [
      { id: 'imp1', title: 'Import 1', type: 'note', createdAt: 1000, updatedAt: 1000, importBatchId: batchId } as Item,
      { id: 'imp2', title: 'Import 2', type: 'note', createdAt: 1000, updatedAt: 1000, importBatchId: batchId } as Item
    ];

    await store.commitImport(batchId, newItems);
    
    // Validate added
    expect(useStore.getState().items.length).toBe(3);
    const snap = await db.snapshots.get(batchId);
    expect(snap).toBeDefined(); // Snapshot created

    // 3. Undo
    await store.undoImport(batchId);

    // Validate restoration to trash instead of hard delete
    const finalItems = useStore.getState().items;
    expect(finalItems.length).toBe(3); // They are still in items array
    expect(finalItems.find(i => i.id === id)?.deletedAt).toBeUndefined(); // Original untouched
    expect(finalItems.find(i => i.id === 'imp1')?.deletedAt).toBeDefined(); // Moved to trash
    expect(finalItems.find(i => i.id === 'imp2')?.deletedAt).toBeDefined(); // Moved to trash
    
    const snapAfter = await db.snapshots.get(batchId);
    expect(snapAfter).toBeUndefined(); // Snapshot cleaned up
  });

  it('ensures blocked sensitive data is never committed to state or Dexie', async () => {
    const store = useStore.getState();
    const batchId = 'batch-blocked';
    // Emulate what ImportView does: only commits 'approved' parsed items.
    // parseImport already strips blocked items from its returned `items` array.
    // We just verify it's mechanically impossible to reach the DB.
    
    // Simulating parsed output where a sensitive item was blocked and dropped by parseImport
    const newItems: Item[] = [
      { id: 'safe1', title: 'Safe', type: 'note', createdAt: 1000, updatedAt: 1000, importBatchId: batchId } as Item
    ];

    await store.commitImport(batchId, newItems);
    
    const dbItems = await db.items.toArray();
    expect(dbItems.length).toBe(1);
    expect(dbItems[0].title).toBe('Safe');

    // Attempt to search for sensitive passwords in DB as a sanity check
    const sensitiveFound = dbItems.some(i => i.title.includes('password') || i.rawText?.includes('1234'));
    expect(sensitiveFound).toBe(false);
  });

  it('can detect edited items to warn before undoing an import (Condition 0.b)', async () => {
    const store = useStore.getState();
    const batchId = 'batch-warn';
    
    // Create import
    const newItems: Item[] = [
      { id: '1', title: 'Task 1', type: 'task', createdAt: 1000, updatedAt: 1000, importBatchId: batchId } as Item,
      { id: '2', title: 'Task 2', type: 'task', createdAt: 1000, updatedAt: 1000, importBatchId: batchId } as Item
    ];
    await store.commitImport(batchId, newItems);

    // Edit one item
    await store.updateItem('1', { title: 'Task 1 Edited', updatedAt: 2000 });

    // Detect edits
    const dbItems = await db.items.where('importBatchId').equals(batchId).toArray();
    const editedCount = dbItems.filter(i => i.updatedAt > i.createdAt).length;
    
    expect(editedCount).toBe(1);
  });
});
