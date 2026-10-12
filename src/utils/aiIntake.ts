import { checkSensitiveData } from './importLogic';
import type { Item, QuadrantId, PillarId, PriorityLevel, ItemType } from '../types';

export interface BreakdownSubtask {
  id: string;
  title: string;
  estMinutes: number;
  quadrant: QuadrantId;
  priority: PriorityLevel;
  selected: boolean;
}

export interface TaskBreakdownResult {
  taskTitle: string;
  desiredOutcome: string;
  definitionOfDone: string;
  firstPrinciples: {
    coreRequirements: string[];
    assumptions: string[];
    blockers: string[];
    dependencies: string[];
  };
  smallestNextAction: string;
  subtasks: BreakdownSubtask[];
  risksAndQuestions: string[];
  fastestResponsiblePath: string;
  source: 'local_engine' | 'ai_assistant';
}

export interface IntakeParsedItem {
  id: string;
  rawText: string;
  suggestedTitle: string;
  suggestedBody?: string;
  suggestedType: ItemType;
  suggestedPillar: PillarId;
  suggestedQuadrant?: QuadrantId;
  suggestedPriority: PriorityLevel;
  suggestedDeadline?: number;
  suggestedTags: string[];
  isDuplicate?: boolean;
  duplicateWarning?: string;
  status: 'pending' | 'approved' | 'skipped';
}

export interface IntakeResult {
  items: IntakeParsedItem[];
  blockedSensitiveCount: number;
  blockedSnippets: string[];
  source: 'local_engine' | 'ai_assistant';
}

/**
 * Heuristic detector for Life OS Pillars
 */
export function detectPillar(text: string, fallback: PillarId = 'physical'): PillarId {
  const lower = text.toLowerCase();
  
  if (/\b(workout|gym|run|fitness|diet|sleep|water|health|meal|doctor|cardio|walk|stretch|protein|body|physique|medicine)\b/.test(lower)) {
    return 'physical';
  }
  if (/\b(read|book|study|learn|code|course|exam|deep work|focus|write|research|logic|thought|idea|skill|algorithm)\b/.test(lower)) {
    return 'mental';
  }
  if (/\b(mom|dad|family|friend|partner|call|meet|dinner|date|team|colleague|chat|network|coffee with|birthday|gift)\b/.test(lower)) {
    return 'relational';
  }
  if (/\b(meditat|journal|reflect|mindful|peace|prayer|gratitude|stoic|breathe|silence|values|purpose|soul)\b/.test(lower)) {
    return 'spiritual';
  }
  if (/\b(money|budget|pay|tax|invoice|salary|invest|bank|bill|crypto|stock|expense|save|fund|wealth|price|cost)\b/.test(lower)) {
    return 'financial';
  }
  
  return fallback;
}

/**
 * Heuristic detector for Priority Level
 */
export function detectPriority(text: string): PriorityLevel {
  const lower = text.toLowerCase();
  if (/\b(urgent|critical|emergency|asap|crucial|blocker|immediately|p0|deadline today)\b/.test(lower)) {
    return 'critical';
  }
  if (/\b(high|important|vital|must|priority|p1|key)\b/.test(lower)) {
    return 'high';
  }
  if (/\b(low|someday|maybe|later|minor|trivial|p3|optional)\b/.test(lower)) {
    return 'low';
  }
  return 'normal';
}

/**
 * Heuristic detector for Eisenhower Quadrant
 */
export function detectQuadrant(text: string): QuadrantId {
  const lower = text.toLowerCase();
  if (/\b(urgent|today|asap|now|critical|broken|fix immediately|crisis)\b/.test(lower)) {
    return 'do';
  }
  if (/\b(plan|build|design|study|research|create|develop|goal|strategy|exercise)\b/.test(lower)) {
    return 'decide';
  }
  if (/\b(delegate|assign|ask|request|outsource|forward to|coordinate)\b/.test(lower)) {
    return 'delegate';
  }
  if (/\b(delete|drop|stop|ignore|unnecessary|archive)\b/.test(lower)) {
    return 'delete';
  }
  return 'do';
}

/**
 * Detect explicit deadline ONLY if explicitly present in text.
 * Never invents a deadline.
 */
export function detectExplicitDeadline(text: string, referenceTime: number = Date.now()): number | undefined {
  const lower = text.toLowerCase();
  const dayMs = 86400000;
  
  if (/\b(due today|by today|tonight)\b/.test(lower)) {
    const d = new Date(referenceTime);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }
  if (/\b(due tomorrow|by tomorrow)\b/.test(lower)) {
    const d = new Date(referenceTime + dayMs);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }
  
  // Specific match: by monday/friday or in X days
  const inDaysMatch = lower.match(/\bin (\d+) days?\b/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1], 10);
    if (!isNaN(days) && days > 0 && days < 365) {
      const d = new Date(referenceTime + days * dayMs);
      d.setHours(23, 59, 59, 999);
      return d.getTime();
    }
  }

  // Format: YYYY-MM-DD
  const isoMatch = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    const parsed = Date.parse(isoMatch[1]);
    if (!isNaN(parsed)) return parsed;
  }

  return undefined;
}

/**
 * First-Principles Task Decomposition Engine
 */
export function generateLocalTaskBreakdown(
  task: { title: string; body?: string; pillar?: PillarId; quadrant?: QuadrantId; estMinutes?: number }
): TaskBreakdownResult {
  const title = task.title.trim();
  const quadrant = task.quadrant || detectQuadrant(title);
  const baseMinutes = task.estMinutes || 60;
  
  // High quality first-principles decomposition
  const desiredOutcome = `Complete "${title}" with verified quality, zero technical debt, and loop closed.`;
  const definitionOfDone = `All essential acceptance criteria met, deliverables tested or verified, and next actions logged.`;
  
  const coreRequirements = [
    `Clarify exact target criteria and non-negotiables for "${title}".`,
    `Identify the single highest-leverage deliverable.`,
    `Perform execution in timed, uninterrupted deep work blocks.`
  ];

  const assumptions = [
    `Necessary workspace resources, tools, and prerequisites are accessible.`,
    `Execution can be modularized into discrete 15-45m sub-actions.`
  ];

  const blockers = [
    `Ambiguous scope or lack of clear acceptance threshold.`,
    `Context-switching and interruptions during focus window.`
  ];

  const dependencies = [
    `Initial clarification phase completed before deep production.`
  ];

  const smallestNextAction = `Define the explicit first sentence, test, or checklist item for "${title}".`;

  // Generate 4-5 focused, ordered sub-tasks
  const stepTime = Math.max(15, Math.round(baseMinutes / 4));
  const subtasks: BreakdownSubtask[] = [
    {
      id: `step-1`,
      title: `Define exact scope, constraints, and inputs for ${title}`,
      estMinutes: Math.min(20, stepTime),
      quadrant: 'decide',
      priority: 'high',
      selected: true
    },
    {
      id: `step-2`,
      title: `Assemble materials, references, and core foundation`,
      estMinutes: stepTime,
      quadrant: quadrant,
      priority: 'high',
      selected: true
    },
    {
      id: `step-3`,
      title: `Execute primary draft / implementation for ${title}`,
      estMinutes: stepTime * 2,
      quadrant: quadrant,
      priority: 'critical',
      selected: true
    },
    {
      id: `step-4`,
      title: `Verify against definition of done & review quality`,
      estMinutes: Math.min(20, stepTime),
      quadrant: 'decide',
      priority: 'normal',
      selected: true
    },
    {
      id: `step-5`,
      title: `Document findings, cleanup workspace & close loop`,
      estMinutes: 15,
      quadrant: 'decide',
      priority: 'low',
      selected: true
    }
  ];

  const risksAndQuestions = [
    `What is the cost of delay versus the cost of premature completion?`,
    `Can any secondary requirements be trimmed without impacting the core outcome?`
  ];

  const fastestResponsiblePath = `Execute the core implementation directly (Step 3) after a brief 5-minute scope lock, bypassing unnecessary overhead.`;

  return {
    taskTitle: title,
    desiredOutcome,
    definitionOfDone,
    firstPrinciples: {
      coreRequirements,
      assumptions,
      blockers,
      dependencies
    },
    smallestNextAction,
    subtasks,
    risksAndQuestions,
    fastestResponsiblePath,
    source: 'local_engine'
  };
}

/**
 * Local Rule-Based Intake Processor
 */
export function processLocalIntake(rawText: string, existingItems: Item[] = []): IntakeResult {
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const blockedSnippets: string[] = [];
  const parsedItems: IntakeParsedItem[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    // 1. Sensitive data check
    if (checkSensitiveData(line)) {
      blockedSnippets.push(line.slice(0, 30) + '...');
      continue;
    }

    // 2. Clean bullet prefixes and markdown checklist indicators
    let cleanText = line
      .replace(/^[-*+]\s+/, '')
      .replace(/^\[[ xX~]\]\s+/, '')
      .replace(/^\d+\.\s+/, '')
      .trim();

    if (!cleanText) continue;

    // Detect type
    let itemType: ItemType = 'task';
    if (/^(note:|#|\bidea:\b|\bjournal:\b)/i.test(cleanText)) {
      itemType = 'note';
      cleanText = cleanText.replace(/^(note:|#|\bidea:\b|\bjournal:\b)\s*/i, '');
    } else if (/^(project:|\bgoal:\b)/i.test(cleanText)) {
      itemType = cleanText.toLowerCase().startsWith('goal') ? 'goal' : 'project';
      cleanText = cleanText.replace(/^(project:|\bgoal:\b)\s*/i, '');
    }

    const pillar = detectPillar(cleanText);
    const quadrant = itemType === 'task' ? detectQuadrant(cleanText) : undefined;
    const priority = detectPriority(cleanText);
    const deadline = detectExplicitDeadline(cleanText);

    // Extract tags: #work #health
    const tagMatches = cleanText.match(/#([\w-]+)/g);
    const tags = tagMatches ? tagMatches.map(t => t.replace('#', '').toLowerCase()) : [];
    const displayTitle = cleanText.replace(/#([\w-]+)/g, '').trim();

    // Check near-duplicate in existing workspace
    const isDup = existingItems.some(
      ex => !ex.deletedAt && ex.title.trim().toLowerCase() === displayTitle.toLowerCase()
    );

    parsedItems.push({
      id: `intake-${Date.now()}-${idx}`,
      rawText: line,
      suggestedTitle: displayTitle,
      suggestedType: itemType,
      suggestedPillar: pillar,
      suggestedQuadrant: quadrant,
      suggestedPriority: priority,
      suggestedDeadline: deadline,
      suggestedTags: tags,
      isDuplicate: isDup,
      duplicateWarning: isDup ? `Matches existing item "${displayTitle}"` : undefined,
      status: 'pending'
    });
  }

  return {
    items: parsedItems,
    blockedSensitiveCount: blockedSnippets.length,
    blockedSnippets,
    source: 'local_engine'
  };
}

/**
 * Optional AI caller (with user confirmation & stored API key)
 */
export async function requestAIBreakdown(
  task: { title: string; body?: string; pillar?: PillarId; quadrant?: QuadrantId; estMinutes?: number },
  userApiKey?: string
): Promise<TaskBreakdownResult> {
  // If no user API key is provided, or user is offline, safely fall back to the local first-principles engine
  if (!userApiKey || typeof window === 'undefined' || !navigator.onLine) {
    return generateLocalTaskBreakdown(task);
  }

  // If user provides a key, call the OpenAI-compatible or Anthropic endpoint
  try {
    const prompt = `You are a first-principles productivity coach.
Decompose this task: "${task.title}".
Context/Notes: "${task.body || ''}".

Respond ONLY with valid JSON in this exact schema:
{
  "desiredOutcome": "string",
  "definitionOfDone": "string",
  "coreRequirements": ["string"],
  "assumptions": ["string"],
  "blockers": ["string"],
  "dependencies": ["string"],
  "smallestNextAction": "string",
  "subtasks": [
    {
      "title": "string",
      "estMinutes": 25,
      "quadrant": "do",
      "priority": "high"
    }
  ],
  "risksAndQuestions": ["string"],
  "fastestResponsiblePath": "string"
}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      })
    });

    if (!res.ok) {
      throw new Error(`AI API error: ${res.statusText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      taskTitle: task.title,
      desiredOutcome: parsed.desiredOutcome || `Complete "${task.title}"`,
      definitionOfDone: parsed.definitionOfDone || `Deliverable tested and closed`,
      firstPrinciples: {
        coreRequirements: parsed.coreRequirements || [],
        assumptions: parsed.assumptions || [],
        blockers: parsed.blockers || [],
        dependencies: parsed.dependencies || []
      },
      smallestNextAction: parsed.smallestNextAction || `Begin first step of ${task.title}`,
      subtasks: (parsed.subtasks || []).map((s: any, idx: number) => ({
        id: `ai-step-${idx}`,
        title: s.title,
        estMinutes: s.estMinutes || 25,
        quadrant: (s.quadrant as QuadrantId) || 'do',
        priority: (s.priority as PriorityLevel) || 'normal',
        selected: true
      })),
      risksAndQuestions: parsed.risksAndQuestions || [],
      fastestResponsiblePath: parsed.fastestResponsiblePath || `Focus on core deliverable directly.`,
      source: 'ai_assistant'
    };
  } catch {
    // Graceful offline fallback
    return generateLocalTaskBreakdown(task);
  }
}
