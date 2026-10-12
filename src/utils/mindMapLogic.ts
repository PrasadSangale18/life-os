import { PILLARS } from '../theme/tokens';
import type { Item } from '../types';
import { extractWikiLinks, findItemByTitle } from './wikiLinks';

export function generateMindMapData(items: Item[], showPrivate: boolean) {
  const nodes: any[] = [];
  const links: any[] = [];

  const validItems = items.filter(i => !i.deletedAt && !i.isArchived && (showPrivate || !i.isPrivate));
  const validById = new Map<string, Item>(validItems.map(i => [i.id, i]));
  const pillarIdSet = new Set<string>(PILLARS.map(p => p.id));

  // Central Root Node
  nodes.push({ 
    id: 'ROOT', 
    title: 'Life OS', 
    isRoot: true, 
    group: 'root',
    type: 'root',
    color: '#3b82f6'
  });

  // 5 Strategic Pillars
  PILLARS.forEach(p => {
    const pillarCount = validItems.filter(i => i.pillar === p.id).length;
    nodes.push({ 
      id: `pillar-${p.id}`, 
      title: p.name, 
      subtitle: p.subtitle,
      color: p.color, 
      isPillar: true, 
      group: p.id,
      count: pillarCount
    });
    links.push({ source: 'ROOT', target: `pillar-${p.id}`, type: 'hierarchy' });
  });

  validItems.forEach(item => {
    const isKnownPillar = item.pillar && pillarIdSet.has(item.pillar);
    const pillarObj = isKnownPillar ? PILLARS.find(p => p.id === item.pillar) : undefined;
    const pColor = pillarObj?.color || (item.type === 'task' ? '#10b981' : '#8b5cf6');

    nodes.push({ 
      id: item.id, 
      title: item.title || 'Untitled', 
      color: pColor,
      pillar: item.pillar,
      pillarName: pillarObj ? pillarObj.name : 'Inbox / General',
      itemType: item.type || 'note',
      status: item.status,
      date: new Date(item.createdAt).toLocaleDateString(),
      original: item,
      group: isKnownPillar ? item.pillar : 'inbox'
    });
    
    // Real hierarchy: Task/Note -> Project -> Goal -> Pillar -> ROOT
    if (item.projectId && validById.has(item.projectId)) {
      links.push({ source: item.projectId, target: item.id, type: 'hierarchy' });
    } else if (item.goalId && validById.has(item.goalId)) {
      links.push({ source: item.goalId, target: item.id, type: 'hierarchy' });
    } else if (isKnownPillar) {
      links.push({ source: `pillar-${item.pillar}`, target: item.id, type: 'hierarchy' });
    } else {
      links.push({ source: 'ROOT', target: item.id, type: 'hierarchy' });
    }

    const wLinks = extractWikiLinks(item.body || '');
    wLinks.forEach(targetTitle => {
      const targetItem = findItemByTitle(validItems, targetTitle);
      if (targetItem && targetItem.id !== item.id) {
        const alreadyLinked = links.some(
          l => (l.source === item.id && l.target === targetItem.id) ||
               (l.source === targetItem.id && l.target === item.id)
        );
        if (!alreadyLinked) {
          links.push({ source: item.id, target: targetItem.id, type: 'reference' });
        }
      }
    });
  });

  // Strict link safety: Guarantee both source and target exist in nodes to prevent D3 crashes
  const nodeIds = new Set(nodes.map(n => n.id));
  const safeLinks = links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));

  return { nodes, links: safeLinks };
}
