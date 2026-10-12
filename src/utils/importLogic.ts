import type { Item, ItemType, PillarId, QuadrantId, TaskStatus, PriorityLevel } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { detectPriority, detectExplicitDeadline } from './aiIntake';

export interface ImportItem {
  id: string; // temp uuid
  rawText: string;
  normalizedHash: string;
  suggestedTitle: string;
  suggestedBody?: string;
  suggestedType: ItemType;
  suggestedPillar?: PillarId;
  suggestedQuadrant?: QuadrantId;
  suggestedStatus?: TaskStatus;
  suggestedPriority?: PriorityLevel;
  suggestedDeadline?: number;
  suggestedPrivate: boolean;
  confidence: number;
  hasDashChain: boolean;
  isDuplicate: boolean;
  isNearDuplicate: boolean;
  status: 'pending' | 'approved' | 'skipped';
}

export interface BlockedItem {
  line: number;
  reason: string;
  masked: string;
}

export interface ImportResult {
  items: ImportItem[];
  blockedCount: number;
  blockedItems: BlockedItem[];
}

export const SENSITIVE_REGEXES: { rx: RegExp, reason: string }[] = [
  { rx: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, reason: '12-digit ID' },
  { rx: /\b[A-Z]{5}\d{4}[A-Z]\b/i, reason: 'PAN-like' },
  { rx: /(?:(?:password|passwd|pwd)\s*[:=]\s*\S+)|(?:\b(?:otp|one-time\s+password)\b(?:\s*[:=]|\s+is)?\s*\d{4,8})/i, reason: 'Password/OTP' },
  { rx: /\b(?:\d[ -]*?){13,16}\b/, reason: '13-16 digit Card' },
  { rx: /\b\d{10,}\b/, reason: 'Long numeric ID' }
];

export function checkSensitiveData(text: string): boolean {
  return SENSITIVE_REGEXES.some(r => r.rx.test(text));
}

export function splitDashChain(item: ImportItem, newIdGenerator: () => string): ImportItem[] {
  const parts = item.suggestedTitle.split(' - ').map(p => p.trim()).filter(Boolean);
  if (parts.length < 2) return [item];
  
  return parts.map(part => ({
    ...item,
    id: newIdGenerator(),
    suggestedTitle: part,
    hasDashChain: false,
    status: 'pending'
  }));
}

export function hashContent(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, '');
}

export function parseImport(text: string, existingItems: Item[]): ImportResult {
  const result: ImportResult = {
    items: [],
    blockedCount: 0,
    blockedItems: []
  };

  const existingHashes = new Set(existingItems.map(i => hashContent(i.title + (i.body || ''))));
  const existingTitles = new Set(existingItems.map(i => i.title.toLowerCase().trim()));

  // 1. App Export shape (## Pillar, ### DO, etc) - simple state machine
  // 2. Generic dump

  // Split lines
  const lines = text.split('\n');
  let currentPillar: PillarId | undefined = undefined;
  let currentQuadrant: QuadrantId | undefined = undefined;
  
  let currentBlock: string[] = [];
  let inBlock = false;

  const processRawItem = (raw: string, lineNum: number, p?: PillarId, q?: QuadrantId, done?: boolean) => {
    if (!raw.trim()) return;

    // Sensitive Guard
    const sensitiveRegexes: { rx: RegExp, reason: string }[] = [
      { rx: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, reason: '12-digit ID' },
      { rx: /\b[A-Z]{5}\d{4}[A-Z]\b/i, reason: 'PAN-like' },
      { rx: /(?:(?:password|passwd|pwd)\s*[:=]\s*\S+)|(?:\b(?:otp|one-time\s+password)\b(?:\s*[:=]|\s+is)?\s*\d{4,8})/i, reason: 'Password/OTP' },
      { rx: /\b(?:\d[ -]*?){13,16}\b/, reason: '13-16 digit Card' },
      { rx: /\b\d{10,}\b/, reason: 'Long numeric ID' }
    ];

    for (const rule of sensitiveRegexes) {
      if (rule.rx.test(raw)) {
        result.blockedCount++;
        result.blockedItems.push({
          line: lineNum,
          reason: rule.reason,
          masked: '****'
        });
        return;
      }
    }

    const normHash = hashContent(raw);
    const isDup = existingHashes.has(normHash);
    
    // Near dup check (fuzzy)
    const titleOnly = raw.split('\n')[0].trim().toLowerCase();
    const isNear = !isDup && existingTitles.has(titleOnly);

    // Rule-based Classification
    let sType: ItemType = 'note';
    let conf = 0.5;
    let sPillar = p;
    let sQuad = q;
    let sPrivate = false;

    const lower = raw.toLowerCase();
    
    if (!sPillar) {
      if (lower.includes('health') || lower.includes('workout') || lower.includes('sleep') || lower.includes('diet')) sPillar = 'physical';
      else if (lower.includes('meditate') || lower.includes('therapy') || lower.includes('journal')) sPillar = 'mental';
      else if (lower.includes('wife') || lower.includes('husband') || lower.includes('friend') || lower.includes('date')) sPillar = 'relational';
      else if (lower.includes('pray') || lower.includes('god') || lower.includes('church')) sPillar = 'spiritual';
      else if (lower.includes('buy') || lower.includes('sell') || lower.includes('invest') || lower.includes('money')) sPillar = 'financial';
    }

    if (lower.includes('todo') || lower.includes('task') || lower.match(/\bdo\b/) || done !== undefined) {
      sType = 'task';
      conf += 0.3;
      if (!sQuad) sQuad = 'do';
    } else if (lower.includes('project')) {
      sType = 'project';
    } else if (lower.includes('goal')) {
      sType = 'goal';
    }

    if (lower.includes('health') || lower.includes('body') || lower.includes('sexual') || lower.includes('relationship')) {
      sPrivate = true;
    }

    if (conf > 1) conf = 1;

    let hasDashChain = false;
    if (raw.includes(' - ') && raw.split(' - ').length > 2) {
      hasDashChain = true;
    }

    // Determine Title and Body
    let t = raw;
    // but KEEP rawText intact as requested!
    let suggestedT = t.split('\n')[0].replace(/^[\d]+\)[\s]+|^[-*][\s]+|^\[[ xX]\][\s]+/i, '').replace(/^~~(.*)~~$/, '$1').trim();

    let sStatus: TaskStatus | undefined = done === true ? 'done' : done === false ? 'todo' : undefined;
    if (sStatus === undefined && raw.includes('~~') && /^~~.+~~$/.test(raw.trim().replace(/^[-*]\s+/, ''))) {
      sStatus = 'done';
    }

    const sPriority = detectPriority(raw);
    const sDeadline = detectExplicitDeadline(raw);

    result.items.push({
      id: uuidv4(),
      rawText: raw,
      normalizedHash: normHash,
      suggestedTitle: suggestedT,
      suggestedType: sType,
      suggestedPillar: sPillar,
      suggestedQuadrant: sQuad,
      suggestedStatus: sStatus,
      suggestedPriority: sPriority,
      suggestedDeadline: sDeadline,
      suggestedPrivate: sPrivate,
      confidence: conf,
      hasDashChain,
      isDuplicate: isDup,
      isNearDuplicate: isNear,
      status: isDup ? 'skipped' : 'pending'
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const tline = line.trim();

    // App Export parsing
    if (tline.startsWith('## ')) {
      const p = tline.substring(3).toLowerCase();
      if (p.includes('physical')) currentPillar = 'physical';
      else if (p.includes('mental')) currentPillar = 'mental';
      else if (p.includes('relational')) currentPillar = 'relational';
      else if (p.includes('spiritual')) currentPillar = 'spiritual';
      else if (p.includes('financial')) currentPillar = 'financial';
      continue;
    }
    if (tline.startsWith('### ')) {
      const q = tline.substring(4).toLowerCase();
      if (q.includes('do')) currentQuadrant = 'do';
      else if (q.includes('decide')) currentQuadrant = 'decide';
      else if (q.includes('delegate')) currentQuadrant = 'delegate';
      else if (q.includes('delete')) currentQuadrant = 'delete';
      continue;
    }

    // Block parsing {...}
    if (tline === '{') {
      inBlock = true;
      currentBlock = [];
      continue;
    }
    if (tline === '}' && inBlock) {
      inBlock = false;
      processRawItem(currentBlock.join('\n'), i + 1, currentPillar, currentQuadrant);
      currentBlock = [];
      continue;
    }
    if (inBlock) {
      currentBlock.push(line);
      continue;
    }

    // Numbered: "12) " or "266) "
    if (/^\d+\)\s+/.test(tline)) {
      processRawItem(line, i + 1, currentPillar, currentQuadrant);
      continue;
    }

    // Checklists: "[ ] " or "[x] "
    if (/^\[[ xX]\]\s+/.test(tline)) {
      const isDone = /^\[[xX]\]\s+/.test(tline);
      processRawItem(line, i + 1, currentPillar, currentQuadrant, isDone);
      continue;
    }

    // Bullets: "- " or "* "
    if (/^[-*]\s+/.test(tline)) {
      const rest = tline.replace(/^[-*]\s+/, '');
      let isDone: boolean | undefined = undefined;
      if (/^\[[xX]\]\s+/.test(rest)) isDone = true;
      else if (/^\[\s?\]\s+/.test(rest)) isDone = false;
      else if (/^~~.+~~$/.test(rest)) isDone = true;
      processRawItem(line, i + 1, currentPillar, currentQuadrant, isDone);
      continue;
    }

    // Empty lines skipped if not in block
    if (tline === '') continue;

    // Otherwise, standalone line
    processRawItem(line, i + 1, currentPillar, currentQuadrant);
  }

  // Flash out remaining block
  if (currentBlock.length > 0) {
    processRawItem(currentBlock.join('\n'), lines.length, currentPillar, currentQuadrant);
  }

  return result;
}
