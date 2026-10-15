import { describe, it, expect } from 'vitest';
import { 
  calculateWordCount, 
  calculateCharacterCount, 
  calculateReadingTimeMinutes, 
  formatRelativeTime, 
  generateMarkdownContent 
} from './noteUtils';
import type { Item } from '../types';

describe('noteUtils', () => {
  describe('calculateWordCount', () => {
    it('returns 0 for empty string or whitespace', () => {
      expect(calculateWordCount('')).toBe(0);
      expect(calculateWordCount('   \n\t  ')).toBe(0);
    });

    it('counts words accurately and strips markdown markup', () => {
      const text = '# Hello World\nThis is a **bold** and *italic* note with [[Linked Note]].';
      expect(calculateWordCount(text)).toBe(12);
    });
  });

  describe('calculateCharacterCount', () => {
    it('returns length of string', () => {
      expect(calculateCharacterCount('Hello world')).toBe(11);
      expect(calculateCharacterCount('')).toBe(0);
    });
  });

  describe('calculateReadingTimeMinutes', () => {
    it('returns 1 minute minimum for short texts', () => {
      expect(calculateReadingTimeMinutes('Short note')).toBe(1);
    });

    it('calculates minutes accurately for longer texts', () => {
      const longText = new Array(450).fill('word').join(' ');
      expect(calculateReadingTimeMinutes(longText)).toBe(3);
    });
  });

  describe('formatRelativeTime', () => {
    it('returns Just now for recent timestamps', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 10000)).toBe('Just now');
    });

    it('returns minutes ago for timestamps within the hour', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 15 * 60 * 1000)).toBe('15m ago');
    });
  });

  describe('generateMarkdownContent', () => {
    it('formats note with frontmatter and checklist items', () => {
      const testNote: Item = {
        id: 'note-1',
        type: 'note',
        title: 'Meeting Strategy',
        body: 'Discuss quarterly deliverables and timeline.',
        category: 'Work',
        tags: ['strategy', 'q4'],
        pinned: true,
        isFavorite: true,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        checklists: [
          { id: 'c1', text: 'Prepare slides', done: true },
          { id: 'c2', text: 'Send recap email', done: false }
        ]
      };

      const md = generateMarkdownContent(testNote);
      expect(md).toContain('# Meeting Strategy');
      expect(md).toContain('title: "Meeting Strategy"');
      expect(md).toContain('notebook: "Work"');
      expect(md).toContain('- [x] Prepare slides');
      expect(md).toContain('- [ ] Send recap email');
    });
  });
});
