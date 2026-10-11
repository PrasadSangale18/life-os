import { describe, it, expect } from 'vitest';
import { generateMindMapData } from './mindMapLogic';
import type { Item } from '../types';

describe('Mind Map Logic', () => {
  const baseItem: Partial<Item> = { type: 'note', createdAt: 1000, updatedAt: 1000, status: 'todo' };

  it('excludes trashed items from the graph', () => {
    const items: Item[] = [
      { ...baseItem, id: '1', title: 'Active', pillar: 'physical', deletedAt: undefined } as Item,
      { ...baseItem, id: '2', title: 'Trashed', pillar: 'mental', deletedAt: 2000 } as Item,
    ];

    const data = generateMindMapData(items, true);
    
    expect(data.nodes.find(n => n.id === '1')).toBeDefined();
    expect(data.nodes.find(n => n.id === '2')).toBeUndefined();
  });

  it('hides private items unless showPrivate is true', () => {
    const items: Item[] = [
      { ...baseItem, id: '1', title: 'Public', pillar: 'physical', isPrivate: false } as Item,
      { ...baseItem, id: '2', title: 'Secret', pillar: 'mental', isPrivate: true } as Item,
    ];

    const dataHidden = generateMindMapData(items, false);
    expect(dataHidden.nodes.find(n => n.id === '1')).toBeDefined();
    expect(dataHidden.nodes.find(n => n.id === '2')).toBeUndefined();

    const dataShown = generateMindMapData(items, true);
    expect(dataShown.nodes.find(n => n.id === '1')).toBeDefined();
    expect(dataShown.nodes.find(n => n.id === '2')).toBeDefined();
  });
});
