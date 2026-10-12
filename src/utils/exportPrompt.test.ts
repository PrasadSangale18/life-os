import { describe, it, expect } from 'vitest';
import { exportToMarkdown, exportToCSV, generateExternalAIPrompt } from './exportPrompt';
import type { Item } from '../types';

describe('Export and Prompt-Wise AI Logic', () => {
  const sampleItems: Item[] = [
    {
      id: 'task-1',
      type: 'task',
      title: 'Complete HSE Safety Audit Report',
      body: 'Verify all safety equipment across operations',
      pillar: 'physical',
      quadrant: 'do',
      priority: 'critical',
      status: 'todo',
      estMinutes: 45,
      deadline: 1792000000000,
      tags: ['safety', 'audit'],
      createdAt: 1700000000000,
      updatedAt: 1700000000000
    },
    {
      id: 'task-2',
      type: 'task',
      title: 'Review System Architecture Draft',
      pillar: 'mental',
      quadrant: 'decide',
      priority: 'high',
      status: 'doing',
      estMinutes: 60,
      createdAt: 1700000000000,
      updatedAt: 1700000000000
    },
    {
      id: 'note-1',
      type: 'knowledge',
      title: 'First Principles of Autonomous Systems',
      body: 'Deconstruct every complex goal into physics and root assumptions.',
      pillar: 'mental',
      tags: ['philosophy', 'strategy'],
      createdAt: 1700000000000,
      updatedAt: 1700000000000
    }
  ];

  it('exports items to formatted Markdown correctly', () => {
    const md = exportToMarkdown(sampleItems);
    expect(md).toContain('# Life OS Data Export');
    expect(md).toContain('Complete HSE Safety Audit Report');
    expect(md).toContain('[CRITICAL]');
    expect(md).toContain('Verify all safety equipment');
    expect(md).toContain('First Principles of Autonomous Systems');
  });

  it('exports items to standard CSV correctly with escaped values', () => {
    const csv = exportToCSV(sampleItems);
    expect(csv).toContain('ID,Type,Title,Pillar,Quadrant,Priority,Status,EstMinutes,Deadline,Tags,CreatedAt');
    expect(csv).toContain('"task-1","task","Complete HSE Safety Audit Report"');
    expect(csv).toContain('"safety;audit"');
  });

  it('generates a first-principles breakdown prompt for external AI', () => {
    const prompt = generateExternalAIPrompt(sampleItems, {
      scope: 'today',
      template: 'breakdown',
      customInstructions: 'Keep steps under 20 minutes each'
    });

    expect(prompt).toContain('AI TASK BREAKDOWN & EXECUTION ARCHITECTURE PROMPT');
    expect(prompt).toContain('Complete HSE Safety Audit Report');
    expect(prompt).toContain('Keep steps under 20 minutes each');
    expect(prompt).toContain('Desired Outcome & Definition of Done');
    expect(prompt).toContain('Atomic Sub-tasks');
  });

  it('generates an executive time-blocked daily schedule prompt', () => {
    const prompt = generateExternalAIPrompt(sampleItems, {
      scope: 'open',
      template: 'schedule',
      customInstructions: 'Work day starts at 8:30 AM'
    });

    expect(prompt).toContain('EXECUTIVE TIME-BLOCKED DAILY SCHEDULE PROMPT');
    expect(prompt).toContain('Review System Architecture Draft');
    expect(prompt).toContain('Work day starts at 8:30 AM');
    expect(prompt).toContain('Deep work blocks');
  });

  it('generates an 80/20 leverage audit prompt', () => {
    const prompt = generateExternalAIPrompt(sampleItems, {
      scope: 'single',
      template: 'first_principles',
      task: sampleItems[0]
    });

    expect(prompt).toContain('FIRST-PRINCIPLES VALUE & LEVERAGE AUDIT');
    expect(prompt).toContain('Complete HSE Safety Audit Report');
    expect(prompt).toContain('Eliminate');
  });
});
