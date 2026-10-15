import type { Item } from '../types';

/**
 * Calculates the total number of words in text
 */
export function calculateWordCount(text: string = ''): number {
  if (!text || !text.trim()) return 0;
  // Strip markdown formatting symbols for accurate word count
  const cleanText = text
    .replace(/\[\[(.*?)\]\]/g, '$1')
    .replace(/[#*`_~>()[\]\-]/g, ' ')
    .trim();
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  return words.length;
}

/**
 * Calculates total character count excluding excess whitespace
 */
export function calculateCharacterCount(text: string = ''): number {
  return text.length;
}

/**
 * Calculates estimated reading time based on standard 200 words per minute
 */
export function calculateReadingTimeMinutes(text: string = ''): number {
  const words = calculateWordCount(text);
  if (words === 0) return 1;
  const minutes = Math.ceil(words / 200);
  return Math.max(1, minutes);
}

/**
 * Formats a timestamp into a clean, human-readable relative time
 */
export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return 'Recently';
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 45) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Generates clean Markdown content from an Item note
 */
export function generateMarkdownContent(note: Item): string {
  const frontmatter = [
    '---',
    `title: "${note.title.replace(/"/g, '\\"')}"`,
    `date: "${new Date(note.createdAt || Date.now()).toISOString()}"`,
    `updated: "${new Date(note.updatedAt || Date.now()).toISOString()}"`,
    note.category ? `notebook: "${note.category}"` : null,
    note.tags && note.tags.length > 0 ? `tags: [${note.tags.map(t => `"${t}"`).join(', ')}]` : null,
    note.pinned ? 'pinned: true' : null,
    note.isFavorite ? 'favorite: true' : null,
    '---',
    '',
    `# ${note.title}`,
    ''
  ].filter(line => line !== null).join('\n');

  let bodyContent = note.body || '';

  // Append checklists if present
  if (note.checklists && note.checklists.length > 0) {
    const checklistMd = '\n\n## Tasks\n' + note.checklists.map(c => `- [${c.done ? 'x' : ' '}] ${c.text}`).join('\n');
    bodyContent += checklistMd;
  }

  return `${frontmatter}\n${bodyContent}`;
}

/**
 * Downloads a file to the user's browser
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  if (typeof window === 'undefined') return;
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

/**
 * Exports a note as a .md file
 */
export function exportNoteAsMarkdown(note: Item): void {
  const sanitizedTitle = (note.title || 'untitled-note')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
  const filename = `${sanitizedTitle}.md`;
  const content = generateMarkdownContent(note);
  downloadFile(content, filename, 'text/markdown;charset=utf-8');
}

/**
 * Exports a note as a plain .txt file
 */
export function exportNoteAsPlainText(note: Item): void {
  const sanitizedTitle = (note.title || 'untitled-note')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
  const filename = `${sanitizedTitle}.txt`;
  let content = `${note.title}\n${'='.repeat(note.title.length)}\n\n${note.body || ''}`;
  if (note.checklists && note.checklists.length > 0) {
    content += '\n\nChecklist:\n' + note.checklists.map(c => `[${c.done ? 'X' : ' '}] ${c.text}`).join('\n');
  }
  downloadFile(content, filename, 'text/plain;charset=utf-8');
}

/**
 * Copies note markdown to clipboard
 */
export async function copyNoteToClipboard(note: Item): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
  try {
    const md = generateMarkdownContent(note);
    await navigator.clipboard.writeText(md);
    return true;
  } catch {
    return false;
  }
}
