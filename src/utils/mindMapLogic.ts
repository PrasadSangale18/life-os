import { PILLARS } from '../theme/tokens';
import type { Item } from '../types';
import { extractWikiLinks } from './wikiLinks';

export function generateMindMapData(items: Item[], showPrivate: boolean) {
  const nodes: any[] = [];
  const links: any[] = [];

  const validItems = items.filter(i => !i.deletedAt && (showPrivate || !i.isPrivate));

  nodes.push({ id: 'ROOT', title: 'Life OS', isRoot: true, group: 'root' });

  PILLARS.forEach(p => {
    nodes.push({ id: `pillar-${p.id}`, title: p.name, color: p.color, isPillar: true, group: p.id });
    links.push({ source: 'ROOT', target: `pillar-${p.id}`, type: 'hierarchy' });
  });

  const itemMap = new Map<string, Item>();
  validItems.forEach(i => itemMap.set(i.title, i));

  validItems.forEach(item => {
    const pColor = PILLARS.find(p => p.id === item.pillar)?.color || "#606080";
    nodes.push({ 
      id: item.id, 
      title: item.title, 
      color: pColor,
      pillarName: item.pillar ? PILLARS.find(p => p.id === item.pillar)?.name : 'Inbox',
      date: new Date(item.createdAt).toLocaleDateString(),
      original: item,
      group: item.pillar || 'inbox'
    });
    
    if (item.pillar) {
      links.push({ source: `pillar-${item.pillar}`, target: item.id, type: 'hierarchy' });
    } else {
      links.push({ source: 'ROOT', target: item.id, type: 'hierarchy' });
    }

    const wLinks = extractWikiLinks(item.body || '');
    wLinks.forEach(targetTitle => {
      const targetItem = itemMap.get(targetTitle);
      if (targetItem) {
        links.push({ source: item.id, target: targetItem.id, type: 'reference' });
      }
    });
  });

  return { nodes, links };
}
