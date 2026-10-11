import { describe, it, expect } from 'vitest';
import { extractWikiLinks, calculateBacklinks } from './wikiLinks';
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
});
