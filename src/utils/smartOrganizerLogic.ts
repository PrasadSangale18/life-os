import { distance } from 'fastest-levenshtein';
import type { Item } from '../types';

export function fuzzyFindDuplicates(items: Item[]): [Item, Item][] {
  const active = items.filter(i => !i.deletedAt && !i.isArchived);
  const pairs: [Item, Item][] = [];
  const handled = new Set<string>();

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      
      const key = [a.id, b.id].sort().join('-');
      if (handled.has(key)) continue;

      const aText = (a.title + (a.body || '')).toLowerCase();
      const bText = (b.title + (b.body || '')).toLowerCase();

      const lenDiff = Math.abs(aText.length - bText.length);
      if (lenDiff > 20) continue;

      const dist = distance(aText, bText);
      const threshold = Math.max(5, aText.length * 0.2);

      if (dist <= threshold) {
        pairs.push([a, b]);
        handled.add(key);
      }
    }
  }

  return pairs;
}

export function cleanupText(text: string): string {
  return text
    .replace(/\b(um|uh|ah|like|basically|literally|actually|just)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[a-z]/, (c) => c.toUpperCase());
}
