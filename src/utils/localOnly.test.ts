import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../db';

vi.mock('./supabaseClient', () => ({
  __esModule: true,
  hasSupabase: false,
  supabase: null
}));

import { pushToOutbox, triggerSync, syncState } from './syncEngine';

describe('Local-only Mode (No Env Vars)', () => {
  beforeEach(async () => {
    await db.items.clear();
    await db.outbox.clear();
  });

  it('local-only mode works with no env vars: outbox remains empty and triggerSync is no-op', async () => {
    await pushToOutbox('put', { id: 'local-only-1', title: 'Local Only Task', type: 'task' });
    const count = await db.outbox.count();
    expect(count).toBe(0);

    // triggerSync should not throw and should remain offline
    await triggerSync();
    expect(syncState.status).toBe('offline');
  });
});
