import type { Item } from '../types';

export function extractWikiLinks(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/\[\[(.*?)\]\]/g) || [];
  return matches.map(m => m.slice(2, -2).trim()).filter(Boolean);
}

export function calculateBacklinks(items: Item[], targetTitle: string): Item[] {
  if (!targetTitle) return [];
  return items.filter(item => {
    if (item.deletedAt) return false;
    const links = extractWikiLinks(item.body || '');
    return links.includes(targetTitle);
  });
}
export function findItemByTitle(items: Item[], title: string): Item | undefined {
  if (!title) return undefined;
  const normalized = title.trim().toLowerCase();
  if (!normalized) return undefined;

  const matches = items.filter(item => 
    !item.deletedAt && 
    item.title.trim().toLowerCase() === normalized
  );

  if (matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0];

  // Duplicate title safety: prefer the most recently updated item
  return [...matches].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))[0];
}

export function calculateForwardLinks(items: Item[], noteBody: string): { title: string; item?: Item; isAmbiguous: boolean }[] {
  if (!noteBody) return [];
  const rawLinks = extractWikiLinks(noteBody);
  const uniqueTitles = Array.from(new Set(rawLinks));

  return uniqueTitles.map(title => {
    const normalized = title.trim().toLowerCase();
    const matches = items.filter(item => !item.deletedAt && item.title.trim().toLowerCase() === normalized);
    const item = findItemByTitle(items, title);
    return {
      title,
      item,
      isAmbiguous: matches.length > 1
    };
  });
}
