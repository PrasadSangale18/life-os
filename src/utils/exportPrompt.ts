import type { Item } from '../types';
import { PILLARS, QUADRANTS } from '../theme/tokens';

export type PromptTemplate = 
  | 'task_management'
  | 'goal_setting'
  | 'time_management'
  | 'brainstorming'
  | 'decision_making'
  | 'breakdown'
  | 'schedule'
  | 'first_principles'
  | 'blockers';

export interface PromptOptions {
  scope: 'today' | 'open' | 'pillar' | 'all' | 'single';
  template: PromptTemplate;
  task?: Item;
  customInstructions?: string;
}

/**
 * Generates an executive-grade prompt for external AI models (ChatGPT, Claude, Gemini, DeepSeek)
 * tailored to Task Management, Goal Setting, Time Management, Brainstorming, and Decision Making.
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

  // 1. TASK MANAGEMENT
  if (template === 'task_management' || template === 'breakdown') {
    return `# AI TASK MANAGEMENT & DECOMPOSITION ARCHITECTURE PROMPT

Act as an Elite Chief of Staff, Agile Project Manager, and First-Principles Task Decomposition Specialist.

I am providing you with active tasks exported from **Life OS v2**.
Your mission is to resolve task ambiguity, eliminate cognitive friction, and produce an ultra-clear, sequenced atomic execution plan.

## TARGET TASKS & WORKLOAD:
${itemsFormatted || 'No tasks provided.'}

${customInstructions ? `## USER CONSTRAINTS & PREFERENCES:\n${customInstructions}\n` : ''}

## REQUIRED OUTPUT FRAMEWORK:
1. **Desired Outcome & Definition of Done:** What exact measurable criteria declare each task 100% finished?
2. **80/20 High-Leverage Focus:** Identify the single 20% deliverable that unlocks 80% of tangible progress.
3. **Atomic Sub-tasks (15–45 minutes each):**
   - Provide an ordered checklist of sub-tasks.
   - For each sub-task specify: [Estimated Duration], [Eisenhower Action: DO / DECIDE / DELEGATE], and [Immediate Physical Action].
4. **Pre-Mortem & Potential Blockers:** What could cause procrastination or execution delays, and how should I mitigate it immediately?
5. **Immediate 2-Minute Momentum Starter:** The exact micro-action I should do right now in 120 seconds to enter flow state.

Format the response in clean, executive-ready Markdown with checkboxes.`;
  }

  // 2. GOAL SETTING
  if (template === 'goal_setting') {
    return `# EXECUTIVE GOAL SETTING & OKR ROADMAP PROMPT

Act as a Principal Strategy Advisor and Executive Performance Coach specializing in OKRs (Objectives and Key Results) and High-Leverage Strategic Planning.

Here is my active workload, goals, and knowledge base from **Life OS v2**:

## WORKLOAD & ASPIRATIONS:
${itemsFormatted || 'No items provided.'}

${customInstructions ? `## STRATEGIC GOALS & AMBITIONS:\n${customInstructions}\n` : ''}

## REQUIRED GOAL ARCHITECTURE:
1. **Objective Synthesis (Inspiring & Qualitative):** Define 1–3 clear, high-impact Objectives across relevant life/work pillars.
2. **Key Results (Quantitative & Measurable):** For each Objective, articulate 3 Key Results with baseline, target metrics, and verification methods.
3. **Goal-to-Task Pipeline:** Bridge high-level goals into 14-day execution sprints with concrete project milestones.
4. **Inversion Analysis (Charlie Munger Principle):** What specific habits, behaviors, or distractions would guarantee failure? How will I prevent them?
5. **Weekly Cadence & Review Scorecard:** How should I score progress every Sunday evening to maintain momentum?

Format the output with clear headers, tables, and milestone timelines.`;
  }

  // 3. TIME MANAGEMENT
  if (template === 'time_management' || template === 'schedule') {
    return `# EXECUTIVE TIME-BLOCKED DAILY SCHEDULE & CIRCADIAN ALIGNMENT PROMPT

Act as an Elite Productivity Coach and Circadian Chronobiology Specialist.

Here is my active workload exported from **Life OS v2**:

## TODAY'S ACTIVE WORKLOAD:
${itemsFormatted || 'No tasks provided.'}

${customInstructions ? `## DAILY CONSTRAINTS & ROUTINE:\n${customInstructions}\n` : ''}

## TIME MANAGEMENT ARCHITECTURE:
1. **Circadian Energy Calibration:**
   - Morning (Peak Alertness): Allocate to high-cognitive-load, critical deep work (Eisenhower Q1 / Q2).
   - Midday (Downturn): Tactical breaks, movement, hydration.
   - Afternoon (Secondary Window): Collaborative tasks, administrative processing, review.
2. **Deep Work Ultra-Blocks (90 min max):**
   - Strictly cap deep work to 4 hours per day to prevent cognitive burnout.
   - Insert mandatory 15-minute buffers between blocks.
3. **Parkinson's Law Time Boxing:** Set tight, realistic time limits to prevent task expansion.
4. **Executive Schedule Table:**
   - Time Slot | Task Title | Energy Level | Quadrant | Focus Mode (Deep / Shallow)

Format the schedule in an organized markdown table ready to paste into my daily planner.`;
  }

  // 4. BRAINSTORMING
  if (template === 'brainstorming') {
    return `# FIRST-PRINCIPLES BRAINSTORMING & LATERAL IDEATION PROMPT

Act as a World-Class Innovation Architect, Design Thinking Facilitator, and Lateral Ideation Expert.

Here are the concepts, ideas, and challenges from **Life OS v2**:

## CURRENT CONCEPTS & CONTEXT:
${itemsFormatted || 'No context provided.'}

${customInstructions ? `## BRAINSTORMING PROMPT / PROBLEM STATEMENT:\n${customInstructions}\n` : ''}

## DIVERGENT-TO-CONVERGENT IDEATION PROTOCOL:
1. **First-Principles Deconstruction:** Strip the problem down to fundamental truths and physics. What assumptions are we falsely accepting?
2. **SCAMPER Exploration:**
   - **S**ubstitute: What components or steps can be swapped?
   - **C**ombine: What unrelated disciplines or features can be merged?
   - **A**dapt: What works in another industry that we can borrow?
   - **M**odify/Magnify: What happens if we scale this 10x or reduce it 10x?
   - **P**ut to another use: How can this solve an adjacent problem?
   - **E**liminate: What happens if we remove the most complex element?
   - **R**everse: How would our competitor or opposite approach this?
3. **Mind Map Architecture:** Organize the resulting ideas into 3 core conceptual branches (Immediate Bets, High-Risk Moonshots, Counter-Intuitive Hacks).
4. **Top 3 Actionable Prototypes:** Which 3 ideas should be tested within the next 48 hours with minimal effort?

Deliver creative, non-obvious, high-conviction ideas formatted in clean Markdown.`;
  }

  // 5. DECISION MAKING
  if (template === 'decision_making' || template === 'first_principles' || template === 'blockers') {
    return `# HIGH-STAKES DECISION MATRIX & PRE-MORTEM AUDIT PROMPT

Act as a Strategic Decision Scientist and Principal Risk Evaluator.

Here are the conflicting options, tasks, or choices from **Life OS v2**:

## DECISION CONTEXT & ITEMS:
${itemsFormatted || 'No items provided.'}

${customInstructions ? `## THE DILEMMA / CHOICE AT HAND:\n${customInstructions}\n` : ''}

## EXECUTIVE DECISION FRAMEWORK:
1. **Decision Duel (Pairwise Trade-off):** Compare competing options directly. What is the fundamental trade-off (Speed vs. Quality, Risk vs. Reward, Focus vs. Breadth)?
2. **Regret Minimization Framework (Jeff Bezos 80-Year-Old Lens):** Projecting forward decades from now, which path minimizes future regret?
3. **The 10/10/10 Rule:**
   - How will I feel about this choice in 10 minutes?
   - In 10 months?
   - In 10 years?
4. **Cost of Inaction Pre-Mortem:** If I do nothing and default to procrastination for 6 months, what is the exact compounded damage?
5. **Final Recommendation & Clear First Step:** Provide an unambiguous choice and the immediate irreversible action to commit.

Provide a decisive, structured analysis in clean Markdown.`;
  }

  return `# LIFE OS GENERAL PRODUCTIVITY PROMPT
${itemsFormatted}`;
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
