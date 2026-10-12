import { describe, it, expect } from 'vitest';
import { 
  detectPillar, 
  detectPriority, 
  detectQuadrant, 
  detectExplicitDeadline, 
  generateLocalTaskBreakdown, 
  processLocalIntake 
} from './aiIntake';
import type { Item } from '../types';

describe('AI Intake & First-Principles Decomposition', () => {
  it('detects all 5 Life OS pillars from context keywords', () => {
    expect(detectPillar('Morning gym workout and protein shake')).toBe('physical');
    expect(detectPillar('Read algorithms book and study code')).toBe('mental');
    expect(detectPillar('Dinner date with wife and call mom')).toBe('relational');
    expect(detectPillar('Morning meditation, journaling and gratitude prayer')).toBe('spiritual');
    expect(detectPillar('Pay monthly taxes and review stock portfolio')).toBe('financial');
    expect(detectPillar('Generic unclassified item', 'mental')).toBe('mental');
  });

  it('detects priority levels accurately', () => {
    expect(detectPriority('Urgent critical bug in billing')).toBe('critical');
    expect(detectPriority('Important client deliverable')).toBe('high');
    expect(detectPriority('Optional someday idea')).toBe('low');
    expect(detectPriority('Review team notes')).toBe('normal');
  });

  it('detects quadrants based on urgency and importance', () => {
    expect(detectQuadrant('Fix production crisis immediately')).toBe('do');
    expect(detectQuadrant('Design system architecture and strategy')).toBe('decide');
    expect(detectQuadrant('Coordinate and forward report to team')).toBe('delegate');
    expect(detectQuadrant('Delete obsolete draft')).toBe('delete');
  });

  it('detects explicit deadlines and NEVER invents deadlines', () => {
    const fixedNow = new Date('2026-10-15T10:00:00Z').getTime();

    // Explicit due dates
    const dueToday = detectExplicitDeadline('Submit report due today', fixedNow);
    expect(dueToday).toBeDefined();

    const dueTomorrow = detectExplicitDeadline('Call accountant by tomorrow', fixedNow);
    expect(dueTomorrow).toBeDefined();

    const inDays = detectExplicitDeadline('Deliver pitch deck in 5 days', fixedNow);
    expect(inDays).toBeDefined();

    const isoDate = detectExplicitDeadline('Review contract by 2026-11-01', fixedNow);
    expect(isoDate).toBeDefined();

    // No deadline in text -> MUST be undefined
    const noDeadline = detectExplicitDeadline('Refactor CSS modules and clean layout', fixedNow);
    expect(noDeadline).toBeUndefined();
  });

  it('generates grounded first-principles task breakdown without shortcuts', () => {
    const breakdown = generateLocalTaskBreakdown({
      title: 'Prepare for job interview',
      pillar: 'mental',
      estMinutes: 90
    });

    expect(breakdown.taskTitle).toBe('Prepare for job interview');
    expect(breakdown.desiredOutcome).toContain('Prepare for job interview');
    expect(breakdown.definitionOfDone).toBeDefined();
    expect(breakdown.firstPrinciples.coreRequirements.length).toBeGreaterThanOrEqual(2);
    expect(breakdown.firstPrinciples.assumptions.length).toBeGreaterThan(0);
    expect(breakdown.smallestNextAction.length).toBeGreaterThan(0);
    expect(breakdown.subtasks.length).toBeGreaterThanOrEqual(4);
    expect(breakdown.fastestResponsiblePath).toBeDefined();

    // All subtasks have quadrant, time, and priority
    breakdown.subtasks.forEach(st => {
      expect(st.estMinutes).toBeGreaterThan(0);
      expect(['do', 'decide', 'delegate', 'delete']).toContain(st.quadrant);
      expect(['critical', 'high', 'normal', 'low']).toContain(st.priority);
      expect(st.selected).toBe(true);
    });
  });

  it('processes bulk intake, blocks sensitive data, and detects duplicates', () => {
    const existingItems: Partial<Item>[] = [
      { id: '1', title: 'Existing Note', deletedAt: undefined }
    ];

    const bulkText = `
- [ ] Buy groceries for week due tomorrow #health
- note: Great quote on stoicism and inner peace #mind
- project: Launch marketing redesign
- Existing Note
- User credentials password: mySecretPassword123!
`;

    const result = processLocalIntake(bulkText, existingItems as Item[]);

    // Sensitive item was screened and blocked
    expect(result.blockedSensitiveCount).toBe(1);
    expect(result.blockedSnippets.length).toBe(1);

    // Parsed items
    expect(result.items.length).toBe(4);

    const groceryTask = result.items.find(i => i.suggestedTitle.includes('Buy groceries'));
    expect(groceryTask?.suggestedType).toBe('task');
    expect(groceryTask?.suggestedPillar).toBe('physical');
    expect(groceryTask?.suggestedTags).toContain('health');
    expect(groceryTask?.suggestedDeadline).toBeDefined();

    const stoicNote = result.items.find(i => i.suggestedTitle.includes('Great quote'));
    expect(stoicNote?.suggestedType).toBe('note');
    expect(stoicNote?.suggestedPillar).toBe('spiritual');

    const projectItem = result.items.find(i => i.suggestedTitle.includes('Launch marketing'));
    expect(projectItem?.suggestedType).toBe('project');

    const duplicateItem = result.items.find(i => i.suggestedTitle === 'Existing Note');
    expect(duplicateItem?.isDuplicate).toBe(true);
    expect(duplicateItem?.duplicateWarning).toBeDefined();
  });
});
