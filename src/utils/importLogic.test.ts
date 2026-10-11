import { describe, it, expect } from 'vitest';
import { parseImport, splitDashChain } from './importLogic';
import type { Item } from '../types';

describe('Import Logic Phase 4', () => {
  it('parses numbered items, block items, and bullets without dropping data', () => {
    const text = `
12) First item
266) Second item

{
  Block item line 1
  Block item line 2
}

- Bullet item
* Another bullet
[x] Done checklist item
[ ] Todo checklist item
    `;

    const res = parseImport(text, []);
    expect(res.items.length).toBe(7);
    expect(res.items[0].rawText).toContain('12) First item');
    expect(res.items[2].rawText).toContain('Block item line 1\n  Block item line 2');
    expect(res.items[4].rawText).toContain('* Another bullet');
    expect(res.items[5].rawText).toContain('[x] Done checklist item');
  });

  it('parses app-export shape with headers', () => {
    const text = `
## Physical
### DO
- ~~Done task here~~
- Normal task
    `;
    const res = parseImport(text, []);
    expect(res.items.length).toBe(2);
    expect(res.items[0].suggestedPillar).toBe('physical');
    expect(res.items[0].suggestedQuadrant).toBe('do');
    expect(res.items[0].suggestedTitle).toBe('Done task here'); // Strip ~~
  });

  it('suggests split for dash-chains but does not auto-split', () => {
    const text = `Title - Part 1 - Part 2`;
    const res = parseImport(text, []);
    expect(res.items.length).toBe(1);
    expect(res.items[0].hasDashChain).toBe(true);
    expect(res.items[0].rawText).toBe(text);

    // Test the pure split function
    const splitItems = splitDashChain(res.items[0], () => 'new-id');
    expect(splitItems.length).toBe(3);
    expect(splitItems[0].suggestedTitle).toBe('Title');
    expect(splitItems[1].suggestedTitle).toBe('Part 1');
    expect(splitItems[2].suggestedTitle).toBe('Part 2');
    expect(splitItems[0].rawText).toBe(text); // Provenance intact
  });

  describe('Sensitive Guard (Condition 0.f)', () => {
    it('blocks 12-digit ID with spaces', () => {
      const num = '1234' + ' ' + '5678' + ' ' + '9012';
      const res = parseImport('Aadhaar ' + num, []);
      expect(res.blockedCount).toBe(1);
      expect(res.items.length).toBe(0);
    });

    it('blocks 12-digit ID without spaces', () => {
      const num = '1234' + '5678' + '9012';
      const res = parseImport('Aadhaar ' + num, []);
      expect(res.blockedCount).toBe(1);
      expect(res.items.length).toBe(0);
    });

    it('blocks PAN-like patterns', () => {
      const res = parseImport('My PAN is ABCDE1234F', []);
      expect(res.blockedCount).toBe(1);
    });

    it('blocks password / passwd / pwd lines', () => {
      const res = parseImport('password: mysecret\npasswd: foo\npwd=bar', []);
      expect(res.blockedCount).toBe(3);
    });

    it('blocks OTP', () => {
      const res = parseImport('Your OTP is 123456', []);
      expect(res.blockedCount).toBe(1);
    });

    it('blocks 13-16 digit card-like', () => {
      const num = '1234' + ' ' + '5678' + ' ' + '1234' + ' ' + '5678';
      const res = parseImport('Card ' + num, []);
      expect(res.blockedCount).toBe(1);
    });

    it('blocks long numeric ID', () => {
      const num = '1234' + '5678' + '9012' + '3456789';
      const res = parseImport('Tracking ' + num, []);
      expect(res.blockedCount).toBe(1);
    });
  });

  it('is idempotent (duplicate text yields 0 new items)', () => {
    const text = `A simple note`;
    const existing: Partial<Item>[] = [
      { title: 'A simple note', body: '', type: 'note' }
    ];
    const res = parseImport(text, existing as Item[]);
    expect(res.items[0].isDuplicate).toBe(true);
    expect(res.items[0].status).toBe('skipped');
  });

  it('flags ambiguous input as low confidence (Needs Review)', () => {
    const text = `Random vague string`;
    const res = parseImport(text, []);
    expect(res.items[0].confidence).toBe(0.5); // <= 0.5 is needs review
  });
});
