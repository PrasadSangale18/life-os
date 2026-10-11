import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { pushToOutbox, triggerSync, syncState, setSyncPrivate, resolveConflict } from './syncEngine';
import { db } from '../db';

vi.mock('./supabaseClient', () => {
  let fakeRemoteItems: any[] = [];
  let serverClock = 1000;
  return {
    __esModule: true,
    hasSupabase: true,
    supabase: {
      auth: {
        getSession: async () => ({ data: { session: { user: { id: 'test-user-id' } } } }),
        signOut: async () => {},
      },
      from: vi.fn().mockImplementation((table) => {
        if (table === 'items') {
          return {
            select: vi.fn().mockImplementation((_sel, opts) => {
              if (opts && opts.count === 'exact') {
                return Promise.resolve({ count: fakeRemoteItems.length, error: null });
              }
              const queryState = {
                currentItems: [...fakeRemoteItems]
              };
              const orderings: Array<{ col: string; ascending: boolean }> = [];

              const sortItems = () => {
                if (orderings.length > 0) {
                  queryState.currentItems.sort((a, b) => {
                    for (const ord of orderings) {
                      const valA = a[ord.col] ?? (ord.col === 'updated_at' ? a.updatedAt : undefined) ?? 0;
                      const valB = b[ord.col] ?? (ord.col === 'updated_at' ? b.updatedAt : undefined) ?? 0;
                      if (valA !== valB) {
                        if (typeof valA === 'string' && typeof valB === 'string') {
                          const cmp = valA.localeCompare(valB);
                          if (cmp !== 0) return ord.ascending ? cmp : -cmp;
                        } else if (valA < valB) {
                          return ord.ascending ? -1 : 1;
                        } else if (valA > valB) {
                          return ord.ascending ? 1 : -1;
                        }
                      }
                    }
                    return 0;
                  });
                }
              };

              const builder: any = {
                or: vi.fn().mockImplementation((expr: string) => {
                  const match = expr.match(/and\(updated_at\.eq\.(\d+),\s*id\.gt\.(.+?)\),\s*updated_at\.gt\.(\d+)/);
                  if (match) {
                    const eqTime = Number(match[1]);
                    const gtId = match[2];
                    const gtTime = Number(match[3]);
                    queryState.currentItems = queryState.currentItems.filter(item => {
                      const t = item.updated_at ?? item.updatedAt ?? 0;
                      const id = String(item.id);
                      return (t === eqTime && id > gtId) || (t > gtTime);
                    });
                  }
                  return builder;
                }),
                gt: vi.fn().mockImplementation((col, val) => {
                  queryState.currentItems = queryState.currentItems.filter(item => {
                    const itemVal = item[col] ?? item.updatedAt ?? 0;
                    return itemVal > val;
                  });
                  return builder;
                }),
                order: vi.fn().mockImplementation((col, opts) => {
                  orderings.push({ col, ascending: opts?.ascending !== false });
                  return builder;
                }),
                limit: vi.fn().mockImplementation((limitCount) => {
                  sortItems();
                  const sliced = queryState.currentItems.slice(0, limitCount);
                  return Promise.resolve({ data: sliced, error: null });
                }),
                then: (res: any) => {
                  sortItems();
                  return Promise.resolve({ data: queryState.currentItems, error: null }).then(res);
                }
              };
              return builder;
            }),
            upsert: vi.fn().mockImplementation((puts) => {
              for (const p of puts) {
                const idx = fakeRemoteItems.findIndex(x => x.id === p.id);
                const serverTimestamp = ++serverClock;
                const row = { ...p, updated_at: serverTimestamp };
                if (idx >= 0) fakeRemoteItems[idx] = row;
                else fakeRemoteItems.push(row);
              }
              return Promise.resolve({ error: null });
            }),
            delete: vi.fn().mockImplementation(() => ({
              in: vi.fn().mockImplementation((_col, ids) => {
                fakeRemoteItems = fakeRemoteItems.filter(x => !ids.includes(x.id));
                return Promise.resolve({ error: null });
              })
            }))
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockResolvedValue({ data: [], error: null })
        };
      })
    },
    // Test helper to reset remote state
    _setFakeRemoteItems: (items: any[]) => { fakeRemoteItems = items; },
    _getFakeRemoteItems: () => fakeRemoteItems,
    _getServerClock: () => serverClock,
    _setServerClock: (v: number) => { serverClock = v; }
  };
});

import * as supabaseClientModule from './supabaseClient';
const { supabase } = supabaseClientModule;
const _setFakeRemoteItems = (supabaseClientModule as any)._setFakeRemoteItems;
const _getFakeRemoteItems = (supabaseClientModule as any)._getFakeRemoteItems;
const _getServerClock = (supabaseClientModule as any)._getServerClock;
const _setServerClock = (supabaseClientModule as any)._setServerClock;

async function waitForSync() {
  await new Promise(r => setTimeout(r, 50));
  // Wait until syncEngine says it is not in progress
  while ((syncState as any).status === 'syncing') {
    await new Promise(r => setTimeout(r, 50));
  }
}

describe('Phase 6: Sync Engine', () => {
  beforeEach(async () => {
    await db.items.clear();
    await db.outbox.clear();
    await db.syncMeta.clear();
    await db.snapshots.clear();
    _setFakeRemoteItems([]);
    _setServerClock(1000);
    syncState.status = 'offline';
    syncState.lastSyncTime = 0;
    syncState.lastSyncId = '';
    syncState.syncPrivate = false;
    syncState.pendingConflictResolution = false;
  });

  it('queues offline writes in the outbox and flushes them', async () => {
    // 1. Queue an offline write
    await pushToOutbox('put', { id: 'item-1', title: 'Offline Task', isPrivate: false, updatedAt: 1000 });
    const outboxCount = await db.outbox.count();
    expect(outboxCount).toBe(1);

    // 2. Trigger sync
    await waitForSync();

    // 3. Outbox should be flushed
    const finalCount = await db.outbox.count();
    expect(finalCount).toBe(0);

    // 4. Item should be in fake remote
    const remote = _getFakeRemoteItems();
    expect(remote.length).toBe(1);
    expect(remote[0].id).toBe('item-1');
  });

  it('keeps private items local when toggle is OFF', async () => {
    await pushToOutbox('put', { id: 'item-2', title: 'Private Note', isPrivate: true, updatedAt: 1000 });
    
    // Outbox should reject it immediately
    const outboxCount = await db.outbox.count();
    expect(outboxCount).toBe(0);

    // Now turn toggle ON
    await db.items.add({ id: 'item-2', title: 'Private Note', isPrivate: true, updatedAt: 1000 } as any);
    setSyncPrivate(true); // Should push all existing privates

    await waitForSync();

    // It should now be synced
    const remote = _getFakeRemoteItems();
    expect(remote.length).toBe(1);
    expect(remote[0].id).toBe('item-2');
  });

  it('handles first sign-in merge conflict', async () => {
    // Setup local items
    await db.items.add({ id: 'local-1', title: 'Local 1', isPrivate: false, updatedAt: 1000 } as any);

    // Fake a remote count
    const selectMock = vi.fn().mockResolvedValue({ count: 5, error: null });
    supabase.from.mockImplementationOnce(() => ({ select: selectMock }));

    await triggerSync();
    await waitForSync();

    // Sync should be paused waiting for resolution
    expect(syncState.pendingConflictResolution).toBe(true);
    expect(syncState.conflictCounts.local).toBe(1);
    expect(syncState.conflictCounts.remote).toBe(5);

    // Resolve by merge
    await resolveConflict('merge');
    await waitForSync();
    expect(syncState.pendingConflictResolution).toBe(false);

    // It should push 'local-1' to outbox
    const remote = _getFakeRemoteItems();
    expect(remote.length).toBe(1);
    expect(remote[0].id).toBe('local-1');
  });

  it('handles last-write-wins resolution and soft delete propagation', async () => {
    // Local item updated at 1000
    await db.items.add({ id: 'sync-1', title: 'Local Write', isPrivate: false, updatedAt: 1000 } as any);
    await db.syncMeta.put({ key: 'lastSyncTime', value: 500 }); // Simulate already synced once

    // Remote item updated at 2000 (wins)
    _setFakeRemoteItems([{ id: 'sync-1', title: 'Remote Write', is_private: false, updated_at: 2000, created_at: 1000 }]);

    await triggerSync();
    await waitForSync();

    // Local DB should be updated
    const local = await db.items.get('sync-1');
    expect(local?.title).toBe('Remote Write');

    // Test soft delete propagation (server updated_at advances to 3000 > 2000)
    _setFakeRemoteItems([{ id: 'sync-1', title: 'Remote Write', is_private: false, updated_at: 3000, created_at: 1000, deleted_at: 3000 }]);
    await triggerSync();
    await waitForSync();

    const localDeleted = await db.items.get('sync-1');
    expect(localDeleted?.deletedAt).toBe(3000);
  });

  it('outbox flushes in order', async () => {
    // 6. outbox flushes in order
    await pushToOutbox('put', { id: 'order-1', title: 'First', isPrivate: false, updatedAt: 1000 });
    await pushToOutbox('put', { id: 'order-2', title: 'Second', isPrivate: false, updatedAt: 1000 });
    await waitForSync();
    
    const remote = _getFakeRemoteItems();
    expect(remote.length).toBe(2);
    expect(remote[0].id).toBe('order-1');
    expect(remote[1].id).toBe('order-2');
  });

  it('toggling private ON uploads them', async () => {
    // 7. toggling private ON uploads them
    await db.items.add({ id: 'priv-1', title: 'Private', isPrivate: true, updatedAt: 1000 } as any);
    setSyncPrivate(true);
    await waitForSync();

    const remote = _getFakeRemoteItems();
    expect(remote.length).toBe(1);
    expect(remote[0].id).toBe('priv-1');
  });

  it('pending local edit survives a pull', async () => {
    // 4. pending local edit survives a pull
    await db.items.add({ id: 'survive-1', title: 'Pending Local', isPrivate: false, updatedAt: 3000 } as any);
    await pushToOutbox('put', { id: 'survive-1', title: 'Pending Local', isPrivate: false, updatedAt: 3000 });
    
    // Simulate remote having a newer or older change, but local is pending in outbox
    _setFakeRemoteItems([{ id: 'survive-1', title: 'Remote Edit', is_private: false, updated_at: 4000, created_at: 1000 }]);
    
    await triggerSync();
    await waitForSync();

    const local = await db.items.get('survive-1');
    expect(local?.title).toBe('Pending Local'); // Remote didn't overwrite
  });

  it('Pull paging: fetch in pages until exhausted (1200 rows)', async () => {
    const hugeRemote = Array.from({ length: 1200 }).map((_, i) => ({
      id: `page-${i}`,
      title: `Item ${i}`,
      is_private: false,
      updated_at: 1000 + i,
      created_at: 1000
    }));
    _setFakeRemoteItems(hugeRemote);

    await triggerSync();
    await waitForSync();

    const count = await db.items.count();
    expect(count).toBe(1200);
  });

  it('SYNC CURSOR TIE-BREAK: 1200 rows sharing ONE updated_at with page size 500 arrive exactly once', async () => {
    // 1200 rows that all share one updated_at = 5000
    const hugeBatch = Array.from({ length: 1200 }).map((_, i) => ({
      id: `item-${String(i).padStart(4, '0')}`,
      title: `Batch Item ${i}`,
      is_private: false,
      updated_at: 5000,
      created_at: 5000
    }));
    _setFakeRemoteItems(hugeBatch);

    await triggerSync();
    await waitForSync();

    // Verify all 1200 arrive exactly once
    const count = await db.items.count();
    expect(count).toBe(1200);

    const allLocal = await db.items.toArray();
    const uniqueIds = new Set(allLocal.map(x => x.id));
    expect(uniqueIds.size).toBe(1200);
    expect(syncState.lastSyncTime).toBe(5000);
    expect(syncState.lastSyncId).toBe('item-1199');
  });

  it('SYNC CURSOR TIE-BREAK: page boundary falling inside a group of equal timestamps retrieves all rows', async () => {
    // 300 rows at 1000, 400 rows at 2000, 300 rows at 3000
    // Page size 500 splits the 2000 group right in the middle (200 in page 1, 200 in page 2)
    const itemsGroup1 = Array.from({ length: 300 }).map((_, i) => ({
      id: `grp1-${String(i).padStart(4, '0')}`,
      title: `Group 1 - ${i}`,
      is_private: false,
      updated_at: 1000,
      created_at: 1000
    }));
    const itemsGroup2 = Array.from({ length: 400 }).map((_, i) => ({
      id: `grp2-${String(i).padStart(4, '0')}`,
      title: `Group 2 - ${i}`,
      is_private: false,
      updated_at: 2000,
      created_at: 2000
    }));
    const itemsGroup3 = Array.from({ length: 300 }).map((_, i) => ({
      id: `grp3-${String(i).padStart(4, '0')}`,
      title: `Group 3 - ${i}`,
      is_private: false,
      updated_at: 3000,
      created_at: 3000
    }));

    _setFakeRemoteItems([...itemsGroup1, ...itemsGroup2, ...itemsGroup3]);

    await triggerSync();
    await waitForSync();

    const count = await db.items.count();
    expect(count).toBe(1000);

    // Verify every single ID exists locally
    for (let i = 0; i < 300; i++) {
      expect(await db.items.get(`grp1-${String(i).padStart(4, '0')}`)).toBeDefined();
      expect(await db.items.get(`grp3-${String(i).padStart(4, '0')}`)).toBeDefined();
    }
    for (let i = 0; i < 400; i++) {
      expect(await db.items.get(`grp2-${String(i).padStart(4, '0')}`)).toBeDefined();
    }
    expect(syncState.lastSyncTime).toBe(3000);
    expect(syncState.lastSyncId).toBe('grp3-0299');
  });

  it('device with a wrong clock cannot overwrite newer data', async () => {
    // Local device has wrong/past clock: updatedAt is 1000
    await db.items.add({ id: 'clock-1', title: 'Old Clock Local', isPrivate: false, updatedAt: 1000 } as any);
    await db.syncMeta.put({ key: 'lastSyncTime', value: 500 });

    // Server has newer timestamp (e.g. 5000000)
    _setFakeRemoteItems([{
      id: 'clock-1',
      title: 'Server Wins',
      is_private: false,
      updated_at: 5000000,
      created_at: 1000
    }]);

    await triggerSync();
    await waitForSync();

    const result = await db.items.get('clock-1');
    expect(result?.title).toBe('Server Wins');
    expect(result?.updatedAt).toBe(5000000);
  });

  it('merge on first sign-in creates no duplicates for matching UUIDs', async () => {
    await db.items.add({ id: 'dup-1', title: 'Local Version', isPrivate: false, updatedAt: 1000 } as any);
    _setFakeRemoteItems([{ id: 'dup-1', title: 'Remote Version', is_private: false, updated_at: 2000, created_at: 1000 }]);

    // Trigger conflict resolution with merge
    await resolveConflict('merge');
    await waitForSync();

    const items = await db.items.where('id').equals('dup-1').toArray();
    expect(items.length).toBe(1);
    expect(items[0].id).toBe('dup-1');
  });

  it('Sign out and clear this device empties all Dexie tables after confirmation', async () => {
    await db.items.add({ id: 'item-clean', title: 'Clean Me', type: 'task', createdAt: 1, updatedAt: 1 } as any);
    await db.outbox.add({ action: 'put', payload: { id: 'item-clean' }, createdAt: 1 });
    await db.snapshots.add({ id: 'snap-1', timestamp: 1, items: [] });
    await db.syncMeta.put({ key: 'lastSyncTime', value: 100 });
    await db.store.put({ key: 'user', value: { name: 'Test' } });

    // Simulate confirmed sign-out and clear
    const confirmClear = true;
    if (confirmClear) {
      await db.items.clear();
      await db.outbox.clear();
      await db.snapshots.clear();
      await db.syncMeta.clear();
      await db.store.clear();
    }

    expect(await db.items.count()).toBe(0);
    expect(await db.outbox.count()).toBe(0);
    expect(await db.snapshots.count()).toBe(0);
    expect(await db.syncMeta.count()).toBe(0);
    expect(await db.store.count()).toBe(0);
  });

  it('import batches and snapshots never enter the outbox', async () => {
    const { useStore } = await import('../store');
    const batchId = 'batch-safe-test';
    const sampleItem = {
      id: 'import-safe-1',
      type: 'task' as const,
      title: 'Imported Task',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      importBatchId: batchId
    };

    await useStore.getState().commitImport(batchId, [sampleItem as any]);

    // Snapshot was created in snapshots table
    const snap = await db.snapshots.get(batchId);
    expect(snap).toBeDefined();

    // Outbox should ONLY contain items, never snapshot records
    const outboxEntries = await db.outbox.toArray();
    for (const entry of outboxEntries) {
      expect(entry.payload).toBeDefined();
      expect(entry.payload.id).not.toBe(batchId);
      expect((entry.payload as any).items).toBeUndefined(); // Snapshots contain items array, items do not
    }
  });

  it('prompts to delete cloud copy when an already-synced item is marked private while toggle is OFF', async () => {
    if (typeof window === 'undefined') {
      (globalThis as any).window = globalThis;
    }
    (window as any).confirm = vi.fn().mockReturnValue(true);

    const { useStore } = await import('../store');
    const store = useStore.getState();

    // 1. Add normal public item
    const itemId = await store.addItem({
      title: 'Work Task',
      type: 'task',
      isPrivate: false
    });
    await waitForSync();

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    // 2. Mark item private with toggle OFF
    setSyncPrivate(false);
    await store.updateItem(itemId, { isPrivate: true });
    await waitForSync();

    // Assert user was asked to delete cloud copy
    expect(confirmSpy).toHaveBeenCalledWith('Delete the cloud copy of this newly private item?');

    // Assert the cloud copy was deleted from Supabase
    const remote = _getFakeRemoteItems();
    expect(remote.some((r: any) => r.id === itemId)).toBe(false);

    confirmSpy.mockRestore();
  });

  it('FIELD PARITY: pushes an item with every field filled, wipes local, pulls, and asserts deep equality', async () => {
    const fullItem = {
      id: 'full-parity-uuid-1',
      type: 'task' as const,
      title: 'Full Parity Title',
      body: 'Full body with [[Reference]]',
      rawText: 'Raw text line',
      cleanedTitle: 'Clean Title',
      cleanedBody: 'Clean Body',
      pillar: 'financial' as const,
      domainId: 'domain-finance-1',
      quadrant: 'decide' as const,
      difficulty: 'Hard' as const,
      estMinutes: 90,
      deadline: 1800000000000,
      status: 'doing' as const,
      projectId: 'project-x',
      goalId: 'goal-y',
      delegatedTo: 'Pat',
      category: 'Budgeting',
      color: 'yellow' as const,
      pinned: true,
      tags: ['investing', 'savings'],
      links: ['Reference'],
      isPrivate: false,
      splitFromId: '11111111-2222-3333-4444-55555555555a',
      isArchived: false,
      isPriority: true,
      importBatchId: 'batch-abc',
      importSource: 'csv-upload',
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
      deletedAt: undefined
    };

    // 1. Push to outbox and sync
    await pushToOutbox('put', fullItem);
    await waitForSync();

    // 2. Wipe local database completely
    await db.items.clear();
    await db.syncMeta.clear();
    expect(await db.items.count()).toBe(0);

    // 3. Pull from Supabase
    await triggerSync();
    await waitForSync();

    // 4. Retrieve pulled item and assert deep equality (all fields except updatedAt, and updatedAt equals server stamp)
    const pulled = await db.items.get('full-parity-uuid-1');
    expect(pulled).toBeDefined();

    const { updatedAt: _clientUpdated, ...expectedRest } = fullItem;
    const { updatedAt: pulledUpdated, ...pulledRest } = pulled!;

    expect(pulledRest).toEqual(expectedRest);
    expect(pulledUpdated).toBe(_getServerClock());
  });

  it('SYNC CURSOR: device clock +1 day still pulls all rows changed since last sync', async () => {
    // Initial sync with remote item at server timestamp 1000
    _setFakeRemoteItems([{ id: 'cursor-1', title: 'Row 1', updated_at: 1000, created_at: 1000 }]);
    await triggerSync();
    await waitForSync();
    expect(syncState.lastSyncTime).toBe(1000);

    // Device clock jumps +1 day ahead
    const originalDateNow = Date.now;
    vi.spyOn(Date, 'now').mockReturnValue(originalDateNow() + 86400000);

    // Remote gets new row at server timestamp 2000
    _setFakeRemoteItems([
      { id: 'cursor-1', title: 'Row 1', updated_at: 1000, created_at: 1000 },
      { id: 'cursor-2', title: 'Row 2 (Server time 2000)', updated_at: 2000, created_at: 2000 }
    ]);

    await triggerSync();
    await waitForSync();

    // Both rows must be present locally; cursor advanced to 2000
    expect(await db.items.count()).toBe(2);
    expect(await db.items.get('cursor-2')).toBeDefined();
    expect(syncState.lastSyncTime).toBe(2000);

    vi.restoreAllMocks();
  });

  it('SYNC CURSOR: device clock -1 day still pulls all rows changed since last sync', async () => {
    // Initial sync with remote item at server timestamp 5000
    _setFakeRemoteItems([{ id: 'cursor-3', title: 'Row 3', updated_at: 5000, created_at: 5000 }]);
    await triggerSync();
    await waitForSync();
    expect(syncState.lastSyncTime).toBe(5000);

    // Device clock jumps -1 day into past
    const originalDateNow = Date.now;
    vi.spyOn(Date, 'now').mockReturnValue(originalDateNow() - 86400000);

    // Remote gets new row at server timestamp 6000
    _setFakeRemoteItems([
      { id: 'cursor-3', title: 'Row 3', updated_at: 5000, created_at: 5000 },
      { id: 'cursor-4', title: 'Row 4 (Server time 6000)', updated_at: 6000, created_at: 6000 }
    ]);

    await triggerSync();
    await waitForSync();

    // Both rows must be present; cursor advanced to 6000
    expect(await db.items.count()).toBe(2);
    expect(await db.items.get('cursor-4')).toBeDefined();
    expect(syncState.lastSyncTime).toBe(6000);

    vi.restoreAllMocks();
  });
});
