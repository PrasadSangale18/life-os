import { db } from '../db';
import { supabase, hasSupabase } from '../utils/supabaseClient';
import type { Item } from '../types';

export type SyncStatus = 'offline' | 'syncing' | 'synced' | 'error';

// This acts as a background manager, calling back to Zustand or updating DB directly.

const getInitialSyncPrivate = () => {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('lifeos_sync_private') === 'true';
  }
  return false;
};

export const syncState = {
  status: 'offline' as SyncStatus,
  lastSyncTime: 0,
  lastSyncId: '',
  syncPrivate: getInitialSyncPrivate(),
  errorMsg: '',
  pendingConflictResolution: false,
  conflictCounts: { local: 0, remote: 0 }
};

type NotifyCb = (status: SyncStatus, msg?: string) => void;
let listeners: NotifyCb[] = [];

export function subscribeSync(cb: NotifyCb) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter(l => l !== cb);
  };
}

export function setSyncPrivate(val: boolean) {
  syncState.syncPrivate = val;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('lifeos_sync_private', String(val));
  }
  if (val) {
    // Queue all private items
    db.items.filter(i => !!i.isPrivate).toArray().then(privates => {
      privates.forEach(p => pushToOutbox('put', p));
      triggerSync();
    });
  }
}

export function notify(status: SyncStatus, msg?: string) {
  syncState.status = status;
  if (msg) syncState.errorMsg = msg;
  listeners.forEach(cb => cb(status, msg));
}

// Intercept DB writes to populate outbox
export async function pushToOutbox(action: 'put' | 'delete', payload: any) {
  if (!hasSupabase) return; // No outbox if completely local-only

  // If private sync is off, don't outbox private items
  if (!syncState.syncPrivate && payload.isPrivate) return;

  await db.outbox.add({
    action,
    payload,
    createdAt: Date.now()
  });

  // Attempt sync asynchronously
  triggerSync();
}

let syncInProgress = false;

export async function resolveConflict(decision: 'merge' | 'upload' | 'use_cloud') {
  syncState.pendingConflictResolution = false;
  
  if (decision === 'use_cloud') {
    // Snapshot local first
    const currentItems = await db.items.toArray();
    await db.snapshots.put({
      id: `pre-sync-wipe-${Date.now()}`,
      timestamp: Date.now(),
      items: currentItems
    });
    // Clear local db completely
    await db.items.clear();
    await db.outbox.clear();
  } else if (decision === 'upload') {
    // Push everything to outbox
    const all = await db.items.toArray();
    for (const item of all) {
      if (!item.isPrivate || syncState.syncPrivate) {
        await pushToOutbox('put', item);
      }
    }
  } else if (decision === 'merge') {
    // Merge: push everything, but last-write-wins will naturally handle it
    const all = await db.items.toArray();
    for (const item of all) {
      if (!item.isPrivate || syncState.syncPrivate) {
        await pushToOutbox('put', item);
      }
    }
  }

  notify('synced');
  triggerSync();
}

export async function triggerSync() {
  if (!hasSupabase || syncInProgress || syncState.pendingConflictResolution) return;
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (isOnline === false) {
    notify('offline');
    return;
  }

  syncInProgress = true;
  notify('syncing');

  try {
    const sessionRes = await supabase.auth.getSession();
    const session = sessionRes?.data?.session;
    if (!session) {
      notify('offline');
      syncInProgress = false;
      return;
    }

    // 0. First Sign-In Conflict Check
    // 0. First Sign-In Conflict Check
    const metaTime = await db.syncMeta.get('lastSyncTime');
    const lastSyncTime = metaTime ? Number(metaTime.value) : 0;
    const metaId = await db.syncMeta.get('lastSyncId');
    const lastSyncId = metaId ? String(metaId.value) : '';

    if (lastSyncTime === 0 && !lastSyncId) {
      const localCount = await db.items.count();
      if (localCount > 0) {
        // Check if cloud has data
        const { count, error: countError } = await supabase.from('items').select('*', { count: 'exact', head: true });
        if (countError) throw countError;
        
        if (count && count > 0) {
          syncState.pendingConflictResolution = true;
          syncState.conflictCounts = { local: localCount, remote: count };
          notify('synced'); // UI needs to redraw to show the modal
          syncInProgress = false;
          return;
        }
      }
    }

    // 1. Push Outbox
    const outboxItems = await db.outbox.orderBy('createdAt').toArray();
    if (outboxItems.length > 0) {
      const puts = outboxItems.filter(i => i.action === 'put').map(i => i.payload);
      
      if (puts.length > 0) {
        // Upsert to Supabase
        const { error } = await supabase.from('items').upsert(
          puts.map(p => ({
            id: p.id,
            user_id: session.user.id,
            type: p.type,
            title: p.title,
            body: p.body,
            raw_text: p.rawText,
            cleaned_title: p.cleanedTitle,
            cleaned_body: p.cleanedBody,
            pillar: p.pillar,
            domain_id: p.domainId,
            quadrant: p.quadrant,
            difficulty: p.difficulty,
            est_minutes: p.estMinutes,
            deadline: p.deadline,
            status: p.status,
            project_id: p.projectId,
            goal_id: p.goalId,
            delegated_to: p.delegatedTo,
            category: p.category,
            color: p.color,
            pinned: p.pinned ?? false,
            tags: p.tags ?? [],
            links: p.links ?? [],
            is_private: p.isPrivate ?? false,
            split_from_id: p.splitFromId,
            is_archived: p.isArchived ?? false,
            is_priority: p.isPriority ?? false,
            import_batch_id: p.importBatchId,
            import_source: p.importSource,
            created_at: p.createdAt,
            updated_at: p.updatedAt,
            deleted_at: p.deletedAt
          }))
        );
        if (error) throw error;
      }

      const deletes = outboxItems.filter(i => i.action === 'delete').map(i => i.payload.id);
      if (deletes.length > 0) {
        const { error: delError } = await supabase.from('items').delete().in('id', deletes);
        if (delError) throw delError;
      }

      // Cleanup outbox
      await db.outbox.bulkDelete(outboxItems.map(i => i.id!));
    }

    // 2. Pull Changes in Pages with Composite Cursor (updated_at, id)
    let hasMore = true;
    let currentLastSyncTime = lastSyncTime;
    let currentLastSyncId = lastSyncId;
    const PAGE_SIZE = 500;
    
    // Get current outbox to never overwrite pending local edits
    const currentOutbox = await db.outbox.toArray();
    const pendingIds = new Set(currentOutbox.map(o => o.payload.id));

    while (hasMore) {
      let query = supabase.from('items').select('*');

      if (currentLastSyncTime === 0 && !currentLastSyncId) {
        // Initial sync from beginning
      } else if (currentLastSyncId) {
        query = query.or(`and(updated_at.eq.${currentLastSyncTime},id.gt.${currentLastSyncId}),updated_at.gt.${currentLastSyncTime}`);
      } else {
        query = query.gt('updated_at', currentLastSyncTime);
      }

      const { data: remoteItems, error: pullError } = await query
        .order('updated_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(PAGE_SIZE);

      if (pullError) throw pullError;

      if (!remoteItems || remoteItems.length === 0) {
        hasMore = false;
        break;
      }

      const localItems = await db.items.bulkGet(remoteItems.map((r: any) => r.id));
      const toPut: Item[] = [];

      for (let i = 0; i < remoteItems.length; i++) {
        const remote = remoteItems[i];
        const local = localItems[i];

        // 4. Conflict rules: local edits waiting in the outbox must NEVER be overwritten by a pull.
        if (pendingIds.has(remote.id)) continue;

        // Use the server's updated_at as the only clock for conflict decisions
        if (local && local.updatedAt >= remote.updated_at) {
          continue; // local is newer or same
        }

        const parsed: Item = {
          id: remote.id,
          type: remote.type as any,
          title: remote.title,
          body: remote.body || undefined,
          rawText: remote.raw_text || undefined,
          cleanedTitle: remote.cleaned_title || undefined,
          cleanedBody: remote.cleaned_body || undefined,
          pillar: remote.pillar || undefined,
          domainId: remote.domain_id || undefined,
          quadrant: remote.quadrant || undefined,
          difficulty: remote.difficulty || undefined,
          estMinutes: remote.est_minutes ?? undefined,
          deadline: remote.deadline ?? undefined,
          status: remote.status || undefined,
          projectId: remote.project_id || undefined,
          goalId: remote.goal_id || undefined,
          delegatedTo: remote.delegated_to || undefined,
          category: remote.category || undefined,
          color: remote.color || undefined,
          pinned: remote.pinned ?? false,
          tags: remote.tags ?? [],
          links: remote.links ?? [],
          isPrivate: remote.is_private ?? false,
          splitFromId: remote.split_from_id || undefined,
          isArchived: remote.is_archived ?? false,
          isPriority: remote.is_priority ?? false,
          importBatchId: remote.import_batch_id || undefined,
          importSource: remote.import_source || undefined,
          createdAt: remote.created_at,
          updatedAt: remote.updated_at,
          deletedAt: remote.deleted_at || undefined
        };

        toPut.push(parsed);
      }

      if (toPut.length > 0) {
        await db.items.bulkPut(toPut);
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new CustomEvent('lifeos-sync-pull'));
        }
      }

      const lastRemote = remoteItems[remoteItems.length - 1];
      currentLastSyncTime = lastRemote.updated_at;
      currentLastSyncId = lastRemote.id;

      if (remoteItems.length < PAGE_SIZE) {
        hasMore = false;
      }
    }

    if (currentLastSyncTime > lastSyncTime || currentLastSyncId !== lastSyncId) {
      await db.syncMeta.put({ key: 'lastSyncTime', value: currentLastSyncTime });
      await db.syncMeta.put({ key: 'lastSyncId', value: currentLastSyncId });
      syncState.lastSyncTime = currentLastSyncTime;
      syncState.lastSyncId = currentLastSyncId;
    }
    notify('synced');
  } catch (err: any) {
    console.error('Sync error:', err);
    notify('error', err.message);
  } finally {
    syncInProgress = false;
  }
}

// Automatically sync on online
if (typeof window !== 'undefined') {
  window.addEventListener('online', triggerSync);
  window.setInterval(triggerSync, 30000); // sync every 30s
}
