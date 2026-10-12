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

  it('links real hierarchy: Pillar -> Goal -> Project -> Task', () => {
    const goal: Item = {
      ...baseItem,
      id: 'g1',
      type: 'goal',
      title: 'Run Marathon',
      pillar: 'physical',
      createdAt: 1000,
      updatedAt: 1000
    } as Item;

    const project: Item = {
      ...baseItem,
      id: 'p1',
      type: 'project',
      title: '12-Week Training Block',
      goalId: 'g1',
      pillar: 'physical',
      createdAt: 1010,
      updatedAt: 1010
    } as Item;

    const task: Item = {
      ...baseItem,
      id: 't1',
      type: 'task',
      title: 'Buy running shoes',
      projectId: 'p1',
      pillar: 'physical',
      createdAt: 1020,
      updatedAt: 1020
    } as Item;

    const { links } = generateMindMapData([goal, project, task], true);

    // Goal links to Pillar
    const goalLink = links.find(l => l.target === 'g1' && l.type === 'hierarchy');
    expect(goalLink?.source).toBe('pillar-physical');

    // Project links to Goal
    const projectLink = links.find(l => l.target === 'p1' && l.type === 'hierarchy');
    expect(projectLink?.source).toBe('g1');

    // Task links to Project
    const taskLink = links.find(l => l.target === 't1' && l.type === 'hierarchy');
    expect(taskLink?.source).toBe('p1');
  });
});
