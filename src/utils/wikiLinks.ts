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
