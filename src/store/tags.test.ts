import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './index';
import { db } from '../db';

describe('Store: Tags and Private Features', () => {
  beforeEach(async () => {
    await db.items.clear();
    await db.store.clear();
    useStore.setState({ items: [], isLoaded: false, user: null });
  });

  it('can add and remove tags, and toggle private flag', async () => {
    const store = useStore.getState();

    const id = await store.addItem({
      title: 'A Note',
      type: 'note',
      tags: ['react', 'learning'],
      isPrivate: false
    });

    expect(useStore.getState().items[0].tags).toEqual(['react', 'learning']);
    expect(useStore.getState().items[0].isPrivate).toBe(false);

    // Update tags and private
    await store.updateItem(id, {
      tags: ['react'], // removed learning
      isPrivate: true
    });

    expect(useStore.getState().items[0].tags).toEqual(['react']);
    expect(useStore.getState().items[0].isPrivate).toBe(true);
  });
});
