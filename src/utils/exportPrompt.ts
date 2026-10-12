import type { Item } from '../types';
import { PILLARS, QUADRANTS } from '../theme/tokens';

export interface PromptOptions {
  scope: 'today' | 'open' | 'pillar' | 'all' | 'single';
  template: 'breakdown' | 'schedule' | 'first_principles' | 'blockers';
  task?: Item;
  customInstructions?: string;
}

/**
 * Generates an executive-grade prompt for external AI models (ChatGPT, Claude, Gemini, DeepSeek)
 * to break down tasks, plan schedules, or analyze risks from first principles.
 */
export function generateExternalAIPrompt(
  items: Item[],
  options: PromptOptions
): string {
  const { scope, template, task, customInstructions } = options;

  let targetItems: Item[] = [];

  if (scope === 'single' && task) {
    targetItems = [task];
  } else if (scope === 'today') {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const todayEnd = new Date().setHours(23, 59, 59, 999);
    targetItems = items.filter(i => 
      i.type === 'task' && 
      !i.deletedAt && 
      i.status !== 'done' && 
      (i.isPriority || i.priority === 'critical' || i.priority === 'high' || (i.deadline && i.deadline >= todayStart && i.deadline <= todayEnd) || i.quadrant === 'do')
    );
    if (targetItems.length === 0) {
      targetItems = items.filter(i => i.type === 'task' && !i.deletedAt && i.status !== 'done').slice(0, 5);
    }
  } else if (scope === 'open') {
    targetItems = items.filter(i => i.type === 'task' && !i.deletedAt && i.status !== 'done');
  } else {
    targetItems = items.filter(i => !i.deletedAt);
  }

  const itemsFormatted = targetItems.map((item, idx) => {
    const pillarName = PILLARS.find(p => p.id === item.pillar)?.name || 'General';
    const quadrantLabel = QUADRANTS.find(q => q.id === item.quadrant)?.name || 'Inbox';
    const priority = item.priority || (item.isPriority ? 'high' : 'normal');
    const est = item.estMinutes ? `${item.estMinutes}m` : 'unestimated';
    const due = item.deadline ? `due: ${new Date(item.deadline).toISOString().split('T')[0]}` : 'no deadline';

    let details = `${idx + 1}. [${item.type.toUpperCase()}] "${item.title}"\n   - Pillar: ${pillarName} | Quadrant: ${quadrantLabel} | Priority: ${priority.toUpperCase()} | Time: ${est} | ${due}`;
    if (item.body) {
      details += `\n   - Context / Notes: ${item.body.replace(/\n/g, ' ')}`;
    }
    return details;
  }).join('\n\n');

  if (template === 'breakdown') {
    return `# AI TASK BREAKDOWN & EXECUTION ARCHITECTURE PROMPT

Act as a world-class Executive Chief of Staff, Agile Project Manager, and First-Principles Task Decomposition Specialist.

I am providing you with my raw task data exported from **Life OS v2**.
Your mission is to rigorously decompose these items into actionable, atomic, sequenced execution steps so that I can execute them with zero cognitive friction.

## TARGET TASKS:
${itemsFormatted || 'No tasks provided.'}

${customInstructions ? `## USER SPECIFIC CONSTRAINTS:\n${customInstructions}\n` : ''}

## DECOMPOSITION REQUIREMENTS:
For each task above, provide:
1. **Desired Outcome & Definition of Done:** What exact state constitutes 100% completion?
2. **First-Principles Simplification:** What is the single highest-leverage deliverable? Can secondary elements be eliminated?
3. **Atomic Sub-tasks (15–45 minutes each):**
   - Provide an ordered checklist of sub-tasks.
   - For each sub-task specify: [Estimated Duration], [Eisenhower Quadrant: DO / DECIDE / DELEGATE], and [Immediate Next Action].
4. **Potential Blockers & Pre-mortems:** What could stall progress and how should I mitigate it immediately?
5. **Immediate 2-Minute Unblocker:** The exact physical or digital action to take right now to build momentum.

Please format the response in clean, organized Markdown.`;
  }

  if (template === 'schedule') {
    return `# EXECUTIVE TIME-BLOCKED DAILY SCHEDULE PROMPT

Act as an Elite Productivity Coach and Executive Operations Lead.

Here is my active workload for today exported from **Life OS v2**:

## TODAY'S ACTIVE WORKLOAD:
${itemsFormatted || 'No tasks provided.'}

${customInstructions ? `## USER CONSTRAINTS:\n${customInstructions}\n` : ''}

## INSTRUCTIONS:
1. Analyze cognitive load, priority tiers (Critical > High > Normal), and energy cycles.
2. Build a high-performance **Time-Blocked Daily Schedule** starting at 09:00 AM with:
   - Deep work blocks (90 min max) for Critical & DO items.
   - Strategic buffers and cognitive recharge breaks (10-15 min).
   - Low-energy administrative windows for low-priority tasks.
3. Recommend the Top 3 Non-Negotiables for the day.
4. Output the schedule in a clear table format with Time, Task, Quadrant, and Focus Mode.`;
  }

  if (template === 'first_principles') {
    return `# FIRST-PRINCIPLES VALUE & LEVERAGE AUDIT

Act as a Pragmatic Systems Strategist and Essentialist Thinker.

Evaluate the following tasks from my **Life OS v2**:

## WORKLOAD:
${itemsFormatted || 'No tasks provided.'}

${customInstructions ? `## ADDITIONAL CONTEXT:\n${customInstructions}\n` : ''}

## OBJECTIVE:
Challenge every assumption:
1. **Eliminate:** Which tasks create low leverage or false urgency and should be ruthlessly deleted?
2. **Automate / Delegate:** Which tasks can be streamlined or handed off?
3. **80/20 Core:** Identify the single 20% activity that will drive 80% of tangible progress.
4. Provide a rewritten, simplified task backlog.`;
  }

  // Blocker / Risk template
  return `# PRE-MORTEM RISK & DEPENDENCY ANALYSIS

Act as a Principal Risk & Operations Officer.

Analyze these tasks for hidden bottlenecks, technical debt, and execution risks:

## TASKS:
${itemsFormatted || 'No tasks provided.'}

1. Identify critical dependencies and bottlenecks.
2. Flag unrealistic time estimations.
3. Formulate contingency plans for each blocker.`;
}

/**
 * Exports data to human-readable Markdown format
 */
export function exportToMarkdown(items: Item[]): string {
  const activeTasks = items.filter(i => i.type === 'task' && !i.deletedAt);
  const notes = items.filter(i => i.type !== 'task' && !i.deletedAt);

  let md = `# Life OS Data Export\n`;
  md += `Exported on: ${new Date().toLocaleString()}\n`;
  md += `Total Items: ${items.length} (Active Tasks: ${activeTasks.length}, Notes & Knowledge: ${notes.length})\n\n`;

  md += `## 1. Active Tasks by Priority & Quadrant\n\n`;

  QUADRANTS.forEach(q => {
    const qTasks = activeTasks.filter(t => t.quadrant === q.id);
    md += `### ${q.name} (${q.label})\n`;
    if (qTasks.length === 0) {
      md += `*No tasks in this quadrant.*\n\n`;
      return;
    }
    qTasks.forEach(t => {
      const check = t.status === 'done' ? '[x]' : '[ ]';
      const prio = t.priority ? `[${t.priority.toUpperCase()}]` : '';
      const est = t.estMinutes ? `(${t.estMinutes}m)` : '';
      const due = t.deadline ? `Due: ${new Date(t.deadline).toISOString().split('T')[0]}` : '';
      md += `- ${check} ${prio} **${t.title}** ${est} ${due}\n`;
      if (t.body) {
        md += `  > ${t.body.replace(/\n/g, '\n  > ')}\n`;
      }
    });
    md += `\n`;
  });

  md += `## 2. Notes & Knowledge Base\n\n`;
  if (notes.length === 0) {
    md += `*No notes exported.*\n\n`;
  } else {
    notes.forEach(n => {
      const pillar = PILLARS.find(p => p.id === n.pillar)?.name || 'General';
      md += `### [${n.type.toUpperCase()}] ${n.title}\n`;
      md += `*Pillar: ${pillar}* | *Tags: ${n.tags ? n.tags.join(', ') : 'none'}*\n\n`;
      if (n.body) {
        md += `${n.body}\n\n`;
      }
      md += `---\n\n`;
    });
  }

  return md;
}

/**
 * Exports tasks to CSV format compatible with Excel and Google Sheets
 */
export function exportToCSV(items: Item[]): string {
  const headers = ['ID', 'Type', 'Title', 'Pillar', 'Quadrant', 'Priority', 'Status', 'EstMinutes', 'Deadline', 'Tags', 'CreatedAt'];
  
  const rows = items.map(i => {
    return [
      `"${i.id}"`,
      `"${i.type}"`,
      `"${(i.title || '').replace(/"/g, '""')}"`,
      `"${i.pillar || ''}"`,
      `"${i.quadrant || ''}"`,
      `"${i.priority || (i.isPriority ? 'high' : 'normal')}"`,
      `"${i.status || 'todo'}"`,
      `"${i.estMinutes || ''}"`,
      `"${i.deadline ? new Date(i.deadline).toISOString().split('T')[0] : ''}"`,
      `"${(i.tags || []).join(';')}"`,
      `"${new Date(i.createdAt).toISOString()}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Utility to trigger browser file download
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
