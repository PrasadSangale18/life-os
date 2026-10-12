import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';

vi.mock('../utils/supabaseClient', () => ({
  __esModule: true,
  hasSupabase: true,
  supabase: {
    auth: {
      getSession: async () => ({ data: null }),
      signOut: async () => {}
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnValue({ in: vi.fn().mockResolvedValue({ error: null }) })
    })
  }
}));

import { useStore } from './index';
import { db } from '../db';
import type { Item } from '../types';

describe('Store Outbox Coverage (Table-Driven)', () => {
  beforeEach(async () => {
    await db.items.clear();
    await db.outbox.clear();
    await db.snapshots.clear();
    await db.store.clear();
    useStore.setState({ items: [], isLoaded: false, user: null, showPrivate: true });
  });

  const testCases: Array<{
    name: string;
    setup?: () => Promise<string>;
    action: (targetId: string) => Promise<void>;
    expectedAction: 'put' | 'delete';
    assertPayload?: (payload: any, targetId: string) => boolean;
  }> = [
    {
      name: 'addItem',
      action: async () => {
        await useStore.getState().addItem({
          title: 'New Item',
          type: 'task',
          isPrivate: false
        });
      },
      expectedAction: 'put',
      assertPayload: (p) => p.title === 'New Item'
    },
    {
      name: 'updateItem',
      setup: async () => {
        return await useStore.getState().addItem({ title: 'Before Update', type: 'task' });
      },
      action: async (id) => {
        await useStore.getState().updateItem(id, { title: 'After Update' });
      },
      expectedAction: 'put',
      assertPayload: (p) => p.title === 'After Update'
    },
    {
      name: 'trashItem',
      setup: async () => {
        return await useStore.getState().addItem({ title: 'To Trash', type: 'task' });
      },
      action: async (id) => {
        await useStore.getState().trashItem(id);
      },
      expectedAction: 'put',
      assertPayload: (p) => typeof p.deletedAt === 'number'
    },
    {
      name: 'restoreItem',
      setup: async () => {
        const id = await useStore.getState().addItem({ title: 'To Restore', type: 'task' });
        await useStore.getState().trashItem(id);
        return id;
      },
      action: async (id) => {
        await useStore.getState().restoreItem(id);
      },
      expectedAction: 'put',
      assertPayload: (p) => p.deletedAt === undefined
    },
    {
      name: 'hardDeleteItem',
      setup: async () => {
        return await useStore.getState().addItem({ title: 'To Hard Delete', type: 'task' });
      },
      action: async (id) => {
        await useStore.getState().hardDeleteItem(id);
      },
      expectedAction: 'delete',
      assertPayload: (p, id) => p.id === id
    },
    {
      name: 'trash purge in init',
      setup: async () => {
        // Add an item trashed 35 days ago
        const oldDeletedAt = Date.now() - (35 * 24 * 60 * 60 * 1000);
        const oldItem: Item = {
          id: 'old-purged-item',
          type: 'task',
          title: 'Old Trashed',
          createdAt: oldDeletedAt,
          updatedAt: oldDeletedAt,
          deletedAt: oldDeletedAt
        };
        await db.items.add(oldItem);
        return oldItem.id;
      },
      action: async () => {
        await useStore.getState().init();
      },
      expectedAction: 'delete',
      assertPayload: (p) => p.id === 'old-purged-item'
    },
    {
      name: 'archive',
      setup: async () => {
        return await useStore.getState().addItem({ title: 'To Archive', type: 'task' });
      },
      action: async (id) => {
        await useStore.getState().archiveItem(id);
      },
      expectedAction: 'put',
      assertPayload: (p) => p.isArchived === true
    },
    {
      name: 'unarchive',
      setup: async () => {
        const id = await useStore.getState().addItem({ title: 'Archived', type: 'task' });
        await useStore.getState().archiveItem(id);
        return id;
      },
      action: async (id) => {
        await useStore.getState().unarchiveItem(id);
      },
      expectedAction: 'put',
      assertPayload: (p) => p.isArchived === false
    },
    {
      name: 'merge',
      setup: async () => {
        const winner = await useStore.getState().addItem({ title: 'Winner Item', type: 'task' });
        const loser = await useStore.getState().addItem({ title: 'Loser Item', type: 'task' });
        return `${winner},${loser}`;
      },
      action: async (bothIds) => {
        const [wId, lId] = bothIds.split(',');
        await useStore.getState().mergeItems(wId, lId, { title: 'Merged Item' });
      },
      expectedAction: 'put',
      assertPayload: (p) => p.title === 'Merged Item'
    },
    {
      name: 'split',
      setup: async () => {
        return await useStore.getState().addItem({ title: 'Part 1 - Part 2', type: 'task' });
      },
      action: async (id) => {
        await useStore.getState().splitItem(id, ['Part 1', 'Part 2']);
      },
      expectedAction: 'put',
      assertPayload: (p) => p.title === 'Part 1' || p.title === 'Part 2'
    },
    {
      name: 'cleanup apply',
      setup: async () => {
        return await useStore.getState().addItem({ title: 'Messy Title um like', type: 'task' });
      },
      action: async (id) => {
        await useStore.getState().applyCleanup(id, 'Clean Title');
      },
      expectedAction: 'put',
      assertPayload: (p) => p.cleanedTitle === 'Clean Title'
    },
    {
      name: 'cleanup revert',
      setup: async () => {
        const id = await useStore.getState().addItem({ title: 'Raw Item', type: 'task' });
        await useStore.getState().applyCleanup(id, 'Clean Item');
        return id;
      },
      action: async (id) => {
        await useStore.getState().revertCleanup(id);
      },
      expectedAction: 'put',
      assertPayload: (p) => p.cleanedTitle === undefined
    },
    {
      name: 'tag add',
      setup: async () => {
        return await useStore.getState().addItem({ title: 'Tag Item', type: 'task', tags: ['alpha'] });
      },
      action: async (id) => {
        await useStore.getState().addTag(id, 'beta');
      },
      expectedAction: 'put',
      assertPayload: (p) => Array.isArray(p.tags) && p.tags.includes('beta')
    },
    {
      name: 'tag remove',
      setup: async () => {
        return await useStore.getState().addItem({ title: 'Tag Item', type: 'task', tags: ['alpha', 'beta'] });
      },
      action: async (id) => {
        await useStore.getState().removeTag(id, 'alpha');
      },
      expectedAction: 'put',
      assertPayload: (p) => Array.isArray(p.tags) && !p.tags.includes('alpha')
    },
    {
      name: 'private toggle',
      setup: async () => {
        const { setSyncPrivate } = await import('../utils/syncEngine');
        setSyncPrivate(true);
        return await useStore.getState().addItem({ title: 'Privacy Test', type: 'task', isPrivate: false });
      },
      action: async (id) => {
        await useStore.getState().toggleItemPrivate(id);
      },
      expectedAction: 'put',
      assertPayload: (p) => p.isPrivate === true
    },
    {
      name: 'commitImport',
      action: async () => {
        const importItem: Item = {
          id: 'imported-1',
          type: 'task',
          title: 'Imported Entry',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await useStore.getState().commitImport('batch-test', [importItem]);
      },
      expectedAction: 'put',
      assertPayload: (p) => p.id === 'imported-1'
    },
    {
      name: 'undoImport',
      setup: async () => {
        const importItem: Item = {
          id: 'imported-undo-1',
          type: 'task',
          title: 'Imported To Undo',
          importBatchId: 'batch-undo',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await useStore.getState().commitImport('batch-undo', [importItem]);
        return 'batch-undo';
      },
      action: async (batchId) => {
        await useStore.getState().undoImport(batchId);
      },
      expectedAction: 'put',
      assertPayload: (p) => p.id === 'imported-undo-1' && typeof p.deletedAt === 'number'
    },
    {
      name: 'backup restore',
      action: async () => {
        const backupJson = JSON.stringify({
          items: [
            {
              id: 'restored-backup-1',
              type: 'note',
              title: 'Restored Note',
              createdAt: Date.now(),
              updatedAt: Date.now()
            }
          ],
          snapshots: []
        });
        await useStore.getState().importData(backupJson);
      },
      expectedAction: 'put',
      assertPayload: (p) => p.id === 'restored-backup-1'
    },
    {
      name: 'commitSubtasks',
      setup: async () => {
        const id = await useStore.getState().addItem({ title: 'Parent Task', type: 'task' });
        return id;
      },
      action: async (parentId) => {
        await useStore.getState().commitSubtasks(parentId, [
          { title: 'Subtask 1', estMinutes: 20, quadrant: 'do', priority: 'high' }
        ], 'batch-123');
      },
      expectedAction: 'put',
      assertPayload: (p) => p.title === 'Subtask 1' && p.breakdownBatchId === 'batch-123'
    },
    {
      name: 'undoSubtasks',
      setup: async () => {
        const id = await useStore.getState().addItem({ title: 'Parent Task', type: 'task' });
        await useStore.getState().commitSubtasks(id, [
          { title: 'Subtask 1', estMinutes: 20, quadrant: 'do', priority: 'high' }
        ], 'batch-456');
        return 'batch-456';
      },
      action: async (batchId) => {
        await useStore.getState().undoSubtasks(batchId);
      },
      expectedAction: 'put',
      assertPayload: (p) => p.breakdownBatchId === 'batch-456' && !!p.deletedAt
    }
  ];

  for (const tc of testCases) {
    it(`store function "${tc.name}" writes Dexie and queues outbox operation`, async () => {
      let targetId = '';
      if (tc.setup) {
        targetId = await tc.setup();
      }

      // Clear outbox before testing the action under test
      await db.outbox.clear();

      // Execute the store action
      await tc.action(targetId);

      // Verify that outbox recorded the operation
      const outboxEntries = await db.outbox.toArray();
      expect(outboxEntries.length).toBeGreaterThan(0);

      const matching = outboxEntries.find(o => o.action === tc.expectedAction);
      expect(matching).toBeDefined();

      if (tc.assertPayload) {
        const passes = outboxEntries.some(o => tc.assertPayload!(o.payload, targetId));
        expect(passes).toBe(true);
      }
    });
  }
});
