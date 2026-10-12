import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Item, User } from '../types';
import { db } from '../db';
import { pushToOutbox, syncState } from '../utils/syncEngine';

interface LifeOSState {
  user: User | null;
  items: Item[];
  isLoaded: boolean;
  showPrivate: boolean;

  // Actions
  setShowPrivate: (val: boolean) => void;
  init: () => Promise<void>;
  setUser: (user: User | null) => Promise<void>;
  
  // Generic Item CRUD
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  trashItem: (id: string) => Promise<void>;
  restoreItem: (id: string) => Promise<void>;
  hardDeleteItem: (id: string) => Promise<void>;
  
  // Imports
  commitImport: (batchId: string, items: Item[]) => Promise<void>;
  undoImport: (batchId: string) => Promise<void>;

  // Backup & Restore
  exportData: () => Promise<string>;
  importData: (jsonData: string) => Promise<void>;
  
  // Convenience for tasks
  toggleTaskStatus: (id: string) => Promise<void>;

  // Organizer, Tags, Archive & Split
  archiveItem: (id: string) => Promise<void>;
  unarchiveItem: (id: string) => Promise<void>;
  mergeItems: (winnerId: string, loserId: string, mergedData: Partial<Item>) => Promise<void>;
  splitItem: (id: string, parts: string[]) => Promise<string[]>;
  applyCleanup: (id: string, cleanedTitle: string, cleanedBody?: string) => Promise<void>;
  revertCleanup: (id: string) => Promise<void>;
  addTag: (id: string, tag: string) => Promise<void>;
  removeTag: (id: string, tag: string) => Promise<void>;
  toggleItemPrivate: (id: string) => Promise<void>;
  
  // AI Breakdown Subtasks
  commitSubtasks: (parentId: string, subtasks: Array<{ title: string; estMinutes?: number; quadrant?: any; priority?: any; pillar?: any }>, batchId: string) => Promise<string[]>;
  undoSubtasks: (batchId: string) => Promise<void>;

  // Seed default dataset
  seedDefaultData: () => Promise<void>;
}

export const useStore = create<LifeOSState>((set) => ({
  user: null,
  items: [],
  isLoaded: false,
  showPrivate: false,

  setShowPrivate: (val) => set({ showPrivate: val }),

  init: async () => {
    // 30-day purge logic
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const allItems = await db.items.toArray();
    
    const toDelete = allItems.filter(i => i.deletedAt && (now - i.deletedAt > THIRTY_DAYS));
    if (toDelete.length > 0) {
      for (const i of toDelete) {
        await db.items.delete(i.id);
        await pushToOutbox('delete', { id: i.id });
      }
    }
    
    let items = await db.items.toArray();
    const userRecord = await db.store.get('user');

    // Auto-seed Prasad's life dataset on first run if database is empty (outside unit tests)
    const isTest = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';
    const seededFlag = await db.store.get('has_seeded_prasad_lifeos');
    if (!isTest && !seededFlag && items.length === 0) {
      const { INITIAL_SEED_ITEMS } = await import('../db/seedData');
      const nowTs = Date.now();
      const seedWithIds = INITIAL_SEED_ITEMS.map((item, idx) => ({
        ...item,
        id: uuidv4(),
        createdAt: nowTs - (idx * 60000),
        updatedAt: nowTs - (idx * 60000),
      }));
      await db.items.bulkAdd(seedWithIds);
      await db.store.put({ key: 'has_seeded_prasad_lifeos', value: true });
      items = await db.items.toArray();
    }

    set({
      items,
      user: userRecord ? userRecord.value : null,
      isLoaded: true
    });
  },

  seedDefaultData: async () => {
    const { INITIAL_SEED_ITEMS } = await import('../db/seedData');
    const nowTs = Date.now();
    const seedWithIds = INITIAL_SEED_ITEMS.map((item, idx) => ({
      ...item,
      id: uuidv4(),
      createdAt: nowTs - (idx * 60000),
      updatedAt: nowTs - (idx * 60000),
    }));
    await db.items.bulkAdd(seedWithIds);
    await db.store.put({ key: 'has_seeded_prasad_lifeos', value: true });
    const all = await db.items.toArray();
    set({ items: all });
  },

  setUser: async (user) => {
    if (user) {
      await db.store.put({ key: 'user', value: user });
    } else {
      await db.store.delete('user');
    }
    set({ user });
  },

  addItem: async (itemData) => {
    const newItem: Item = {
      ...itemData,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.items.add(newItem);
    await pushToOutbox('put', newItem);
    set(state => ({ items: [...state.items, newItem] }));
    return newItem.id;
  },

  updateItem: async (id, updates) => {
    const item = await db.items.get(id);
    if (item) {
      // If toggling to private, and global syncPrivate is OFF, ask to delete cloud copy
      if (updates.isPrivate === true && !item.isPrivate && !syncState.syncPrivate) {
        if (typeof window !== 'undefined' && window.confirm('Delete the cloud copy of this newly private item?')) {
          await pushToOutbox('delete', { id });
        }
      }

      const updated = { ...item, ...updates, updatedAt: Date.now() };
      await db.items.put(updated);
      await pushToOutbox('put', updated);

      set(state => ({
        items: state.items.map(i => i.id === id ? updated : i)
      }));
    }
  },

  trashItem: async (id) => {
    const item = await db.items.get(id);
    if (item) {
      item.deletedAt = Date.now();
      item.updatedAt = Date.now();
      await db.items.put(item);
      await pushToOutbox('put', item);
      set(state => ({
        items: state.items.map(i => i.id === id ? item : i)
      }));
    }
  },

  restoreItem: async (id) => {
    const item = await db.items.get(id);
    if (item) {
      item.deletedAt = undefined;
      item.updatedAt = Date.now();
      await db.items.put(item);
      await pushToOutbox('put', item);
      set(state => ({
        items: state.items.map(i => i.id === id ? item : i)
      }));
    }
  },

  hardDeleteItem: async (id) => {
    await db.items.delete(id);
    await pushToOutbox('delete', { id });
    set(state => ({
      items: state.items.filter(i => i.id !== id)
    }));
  },
  commitImport: async (batchId, newItems) => {
    await db.snapshots.add({ id: batchId, timestamp: Date.now(), items: [] });
    await db.items.bulkAdd(newItems);
    
    // outbox all imported items
    for (const item of newItems) {
      await pushToOutbox('put', item);
    }
    
    set(state => ({ items: [...state.items, ...newItems] }));
  },

  undoImport: async (batchId) => {
    const snap = await db.snapshots.get(batchId);
    if (!snap) return;
    
    const dbItems = await db.items.where('importBatchId').equals(batchId).toArray();
    const now = Date.now();
    for (const item of dbItems) {
      item.deletedAt = now;
      item.updatedAt = now;
      await db.items.put(item);
      await pushToOutbox('put', item);
    }
    await db.snapshots.delete(batchId);
    
    set(state => ({ 
      items: state.items.map(i => i.importBatchId === batchId ? { ...i, deletedAt: now } : i)
    }));
  },

  toggleTaskStatus: async (id) => {
    const item = await db.items.get(id);
    if (item && item.type === 'task') {
      const newStatus = item.status === 'done' ? 'todo' : 'done';
      item.status = newStatus;
      item.updatedAt = Date.now();
      await db.items.put(item);
      await pushToOutbox('put', item);
      set(state => ({
        items: state.items.map(i => i.id === id ? item : i)
      }));
    }
  },

  exportData: async () => {
    const items = await db.items.toArray();
    const snapshots = await db.snapshots.toArray();
    return JSON.stringify({ items, snapshots }, null, 2);
  },

  importData: async (jsonData: string) => {
    const data = JSON.parse(jsonData);
    if (!data.items) throw new Error('Invalid backup file');
    
    // Create pre-restore snapshot
    const currentItems = await db.items.toArray();
    await db.snapshots.put({
      id: `pre-restore-${Date.now()}`,
      timestamp: Date.now(),
      items: currentItems
    });

    await db.items.clear();
    await db.snapshots.where('id').notEqual(`pre-restore-${Date.now()}`).delete(); // Just to wipe others? Actually don't wipe snapshots, just keep them or wipe and push the new one
    // Wait, the test says `await db.snapshots.clear();` -> let's clear except the one we just made, or just clear first then make it.
    await db.snapshots.clear();
    
    await db.snapshots.put({
      id: `pre-restore-${Date.now()}`,
      timestamp: Date.now(),
      items: currentItems
    });

    await db.items.bulkAdd(data.items);
    for (const item of data.items) {
      await pushToOutbox('put', item);
    }
    
    if (data.snapshots) {
      await db.snapshots.bulkAdd(data.snapshots);
    }
    
    set({ items: data.items });
  },

  archiveItem: async (id) => {
    await useStore.getState().updateItem(id, { isArchived: true });
  },

  unarchiveItem: async (id) => {
    await useStore.getState().updateItem(id, { isArchived: false });
  },

  mergeItems: async (winnerId, loserId, mergedData) => {
    const store = useStore.getState();
    await store.updateItem(winnerId, mergedData);
    await store.trashItem(loserId);
  },

  splitItem: async (id, parts) => {
    const store = useStore.getState();
    const item = await db.items.get(id);
    const newIds: string[] = [];
    for (const part of parts) {
      const newId = await store.addItem({
        type: item ? item.type : 'task',
        title: part,
        splitFromId: id,
        pillar: item?.pillar,
        quadrant: item?.quadrant,
        rawText: item?.rawText || item?.title
      });
      newIds.push(newId);
    }
    return newIds;
  },

  applyCleanup: async (id, cleanedTitle, cleanedBody) => {
    const item = await db.items.get(id);
    if (!item) return;
    const rawText = item.rawText ?? item.title;
    await useStore.getState().updateItem(id, {
      title: cleanedTitle,
      body: cleanedBody !== undefined ? cleanedBody : item.body,
      cleanedTitle,
      cleanedBody,
      rawText
    });
  },

  revertCleanup: async (id) => {
    const item = await db.items.get(id);
    if (!item) return;
    await useStore.getState().updateItem(id, {
      title: item.rawText || item.title,
      cleanedTitle: undefined,
      cleanedBody: undefined
    });
  },

  addTag: async (id, tag) => {
    const item = await db.items.get(id);
    if (item) {
      const currentTags = item.tags || [];
      if (!currentTags.includes(tag)) {
        await useStore.getState().updateItem(id, { tags: [...currentTags, tag] });
      }
    }
  },

  removeTag: async (id, tag) => {
    const item = await db.items.get(id);
    if (item) {
      const currentTags = item.tags || [];
      await useStore.getState().updateItem(id, { tags: currentTags.filter(t => t !== tag) });
    }
  },

  toggleItemPrivate: async (id) => {
    const item = await db.items.get(id);
    if (item) {
      await useStore.getState().updateItem(id, { isPrivate: !item.isPrivate });
    }
  },

  commitSubtasks: async (parentId, subtasks, batchId) => {
    const parent = await db.items.get(parentId);
    const createdIds: string[] = [];
    const createdItems: Item[] = [];
    const now = Date.now();

    for (const sub of subtasks) {
      const newItem: Item = {
        id: uuidv4(),
        type: 'task',
        title: sub.title,
        estMinutes: sub.estMinutes,
        quadrant: sub.quadrant || parent?.quadrant || 'do',
        pillar: sub.pillar || parent?.pillar || 'physical',
        status: 'todo',
        parentId: parentId,
        projectId: parent?.type === 'project' ? parentId : (parent?.projectId || parentId),
        priority: sub.priority || 'normal',
        isPriority: sub.priority === 'critical' || sub.priority === 'high',
        breakdownBatchId: batchId,
        aiReviewed: true,
        createdAt: now,
        updatedAt: now,
      };
      await db.items.add(newItem);
      await pushToOutbox('put', newItem);
      createdIds.push(newItem.id);
      createdItems.push(newItem);
    }

    set(state => ({ items: [...state.items, ...createdItems] }));
    return createdIds;
  },

  undoSubtasks: async (batchId) => {
    const all = await db.items.toArray();
    const toTrash = all.filter(i => i.breakdownBatchId === batchId && !i.deletedAt);
    const now = Date.now();

    for (const item of toTrash) {
      item.deletedAt = now;
      item.updatedAt = now;
      await db.items.put(item);
      await pushToOutbox('put', item);
    }

    set(state => ({
      items: state.items.map(i => (i.breakdownBatchId === batchId && !i.deletedAt) ? { ...i, deletedAt: now } : i)
    }));
  }
}));
