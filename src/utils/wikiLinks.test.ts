import { describe, it, expect } from 'vitest';
import { extractWikiLinks, calculateBacklinks, calculateForwardLinks, findItemByTitle } from './wikiLinks';
import type { Item } from '../types';

describe('Wiki Links', () => {
  it('extracts wiki links from text', () => {
    const text = 'Check out [[React]] and [[ TypeScript ]] for more. [[  ]] is empty.';
    const links = extractWikiLinks(text);
    expect(links).toEqual(['React', 'TypeScript']);
  });

  it('calculates backlinks correctly filtering trashed items', () => {
    const items: Partial<Item>[] = [
      { id: '1', title: 'A', body: 'Refers to [[Target]]', deletedAt: undefined },
      { id: '2', title: 'B', body: 'No refs', deletedAt: undefined },
      { id: '3', title: 'C', body: 'Also [[Target]]', deletedAt: 1000 }, // Trashed
    ];

    const backlinks = calculateBacklinks(items as Item[], 'Target');
    expect(backlinks.length).toBe(1);
    expect(backlinks[0].id).toBe('1');
    
    // When restored:
    items[2].deletedAt = undefined;
    const backlinksRestored = calculateBacklinks(items as Item[], 'Target');
    expect(backlinksRestored.length).toBe(2);
  });

  it('excludes private items from backlinks if pre-filtered by caller', () => {
    const items: Partial<Item>[] = [
      { id: '1', title: 'Public', body: 'Refers to [[Target]]', isPrivate: false },
      { id: '2', title: 'Secret', body: 'Refers to [[Target]]', isPrivate: true },
    ];

    const publicOnly = items.filter(i => !i.isPrivate);
    const backlinks = calculateBacklinks(publicOnly as Item[], 'Target');
    expect(backlinks.length).toBe(1);
    expect(backlinks[0].id).toBe('1');
  });

  it('calculates forward links distinguishing resolved and unresolved targets', () => {
    const items: Partial<Item>[] = [
      { id: 'note-1', title: 'Existing Note', body: '', deletedAt: undefined, updatedAt: 100 },
      { id: 'note-2', title: 'Trashed Note', body: '', deletedAt: 500, updatedAt: 200 }
    ];

    const text = 'Mentions [[Existing Note]] and [[Missing Note]] and [[Trashed Note]]';
    const forwardLinks = calculateForwardLinks(items as Item[], text);

    expect(forwardLinks).toHaveLength(3);

    const existing = forwardLinks.find(f => f.title === 'Existing Note');
    expect(existing?.item?.id).toBe('note-1');
    expect(existing?.isAmbiguous).toBe(false);

    const missing = forwardLinks.find(f => f.title === 'Missing Note');
    expect(missing?.item).toBeUndefined();

    const trashed = forwardLinks.find(f => f.title === 'Trashed Note');
    expect(trashed?.item).toBeUndefined(); // trashed is not matched
  });

  it('handles duplicate note titles safely by picking the most recent item', () => {
    const items: Partial<Item>[] = [
      { id: 'old-1', title: 'Architecture', updatedAt: 1000, createdAt: 1000 },
      { id: 'new-2', title: 'Architecture', updatedAt: 2000, createdAt: 1500 }
    ];

    const match = findItemByTitle(items as Item[], 'Architecture');
    expect(match?.id).toBe('new-2');

    const forwardLinks = calculateForwardLinks(items as Item[], 'Read [[Architecture]]');
    expect(forwardLinks[0].item?.id).toBe('new-2');
    expect(forwardLinks[0].isAmbiguous).toBe(true);
  });
});
