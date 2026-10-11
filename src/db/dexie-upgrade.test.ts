import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import Dexie from 'dexie';

describe('Dexie Upgrade Safety', () => {
  it('safely upgrades from v2 to v3 retaining items and injecting defaults', async () => {
    const dbName = 'TestUpgradeDB';
    
    // Simulate v2
    const db2 = new Dexie(dbName);
    db2.version(2).stores({
      items: 'id, type, pillar, quadrant, status, deletedAt, createdAt, updatedAt',
      store: 'key'
    });
    
    await db2.table('items').add({
      id: 'old-item-1',
      title: 'Legacy Note',
      type: 'note',
      createdAt: 1000
    });
    await db2.close();

    // Now open as v3
    const db3 = new Dexie(dbName);
    db3.version(2).stores({
      items: 'id, type, pillar, quadrant, status, deletedAt, createdAt, updatedAt',
      store: 'key'
    });
    db3.version(3).stores({
      items: 'id, type, pillar, quadrant, status, deletedAt, createdAt, updatedAt, *tags'
    }).upgrade(tx => {
      return tx.table('items').toCollection().modify(item => {
        if (!item.tags) item.tags = [];
        if (item.isPrivate === undefined) item.isPrivate = false;
      });
    });

    await db3.open();
    const item = await db3.table('items').get('old-item-1');
    
    expect(item).toBeDefined();
    expect(item.title).toBe('Legacy Note');
    expect(item.tags).toEqual([]);
    expect(item.isPrivate).toBe(false);

    await db3.close();
  });
});
