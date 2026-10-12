import type { PillarId, QuadrantId, NoteColorId } from '../theme/tokens';
export type { PillarId, QuadrantId, NoteColorId };

export type ItemType = 'task' | 'note' | 'project' | 'goal' | 'habit' | 'idea' | 'knowledge' | 'reference' | 'principle' | 'reminder' | 'question' | 'journal';
export type TaskStatus = 'todo' | 'doing' | 'done' | 'waiting' | 'dropped' | 'archived';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type PriorityLevel = 'critical' | 'high' | 'normal' | 'low';

export interface Item {
  id: string;
  type: ItemType;
  title: string;       // Used for text or title
  body?: string;       // For notes or details
  pillar?: PillarId;
  domainId?: string;
  tags?: string[];
  links?: string[];
  isPrivate?: boolean;
  color?: NoteColorId;
  pinned?: boolean;
  
  // Phase 5 specific
  cleanedTitle?: string;
  cleanedBody?: string;
  splitFromId?: string;
  isArchived?: boolean;
  isPriority?: boolean;
  priority?: PriorityLevel;

  // Task specific
  quadrant?: QuadrantId;
  difficulty?: Difficulty;
  estMinutes?: number;
  deadline?: number;
  status?: TaskStatus;
  delegatedTo?: string;
  goalId?: string;
  projectId?: string;
  parentId?: string;
  
  // Note specific
  category?: string;
  thumbnailUrl?: string;
  hasAudio?: boolean;
  audioDuration?: string;
  isLocked?: boolean;
  drawingData?: string;
  authorName?: string;
  authorAvatar?: string;
  checklists?: Array<{ id: string; text: string; done: boolean; section?: string }>;
  quoteAuthor?: string;
  quoteDoodle?: boolean;
  
  // System
  createdAt: number;
  updatedAt: number;
  deletedAt?: number; // For trash
  importBatchId?: string;
  breakdownBatchId?: string;
  aiReviewed?: boolean;
  rawText?: string;
  importSource?: string;
}

export interface Snapshot {
  id: string; // matches importBatchId
  timestamp: number;
  items: Item[]; // Phase 5 backup uses this
}

export interface OutboxEntry {
  id?: number;
  action: 'put' | 'delete';
  payload: any;
  createdAt: number;
}

// Keep legacy Task/Note types for compatibility during refactor, but transition to Item
export type Task = Item;
export type Note = Item;

export interface MindMapNode {
  id: string;
  text: string;
  expanded: boolean;
  children: MindMapNode[];
}

export interface User {
  name: string;
  email: string;
}
