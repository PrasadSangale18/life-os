import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Item, Snapshot, OutboxEntry } from '../types';

export class LifeOSDatabase extends Dexie {
  items!: Table<Item, string>;
  store!: Table<{ key: string; value: any }, string>;
  snapshots!: Table<Snapshot, string>;
  outbox!: Table<OutboxEntry, number>;
  syncMeta!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('LifeOSDatabase');
    this.version(2).stores({
      items: 'id, type, pillar, quadrant, status, deletedAt, createdAt, updatedAt',
      store: 'key'
    });
    this.version(3).stores({
      items: 'id, type, pillar, quadrant, status, deletedAt, createdAt, updatedAt, *tags'
    }).upgrade(tx => {
      return tx.table('items').toCollection().modify(item => {
        if (!item.tags) item.tags = [];
        if (item.isPrivate === undefined) item.isPrivate = false;
      });
    });
    this.version(4).stores({
      items: 'id, type, pillar, quadrant, status, deletedAt, createdAt, updatedAt, importBatchId, *tags',
      snapshots: 'id'
    });
    this.version(5).stores({
      outbox: '++id, action, createdAt',
      syncMeta: 'key'
    });
  }
}

export const db = new LifeOSDatabase();
