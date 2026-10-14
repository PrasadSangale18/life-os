import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Item, NoteColorId } from '../../types';
import { useStore } from '../../store';
import { 
  ChevronLeft, 
  Check, 
  MoreHorizontal, 
  PenTool, 
  CheckSquare, 
  CreditCard, 
  Type, 
  SlidersHorizontal,
  Plus, 
  Pin, 
  Palette, 
  FileText, 
  Link2, 
  Heading1, 
  Heading2, 
  List, 
  Quote, 
  Code, 
  Minus, 
  X 
} from 'lucide-react';
import { AudioMemoPlayer } from './AudioMemoPlayer';
import { FormattingTraySheet } from './FormattingTraySheet';
import { NoteOptionsSheet } from './NoteOptionsSheet';
import { NOTE_COLOR_PALETTES } from './noteTheme';
import { calculateBacklinks, findItemByTitle } from '../../utils/wikiLinks';

interface NoteDetailViewProps {
  note: Item;
  onBack: () => void;
  onUpdateNote: (updates: Partial<Item>) => void;
  onDeleteNote: () => void;
  onDuplicateNote: () => void;
  onOpenDraw: () => void;
  onOpenNoteById?: (id: string) => void;
}

export const NoteDetailView: React.FC<NoteDetailViewProps> = ({
  note,
  onBack,
  onUpdateNote,
  onDeleteNote,
  onDuplicateNote,
  onOpenDraw,
  onOpenNoteById
}) => {
  const items = useStore(state => state.items);

  const [title, setTitle] = useState(note.title);
  const [bodyText, setBodyText] = useState(note.body || '');
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [showFormattingSheet, setShowFormattingSheet] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeHighlightColor, setActiveHighlightColor] = useState('#ede9fe');
  const [newChecklistText, setNewChecklistText] = useState('');

  // Notion Slash Command Menu State
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);

  // Notion Wiki Links ([[]) Autocomplete State
  const [showWikiMenu, setShowWikiMenu] = useState(false);
  const [wikiQuery, setWikiQuery] = useState('');
  const [wikiMenuIndex, setWikiMenuIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state if active note changes
  const [prevNoteId, setPrevNoteId] = useState(note.id);
  if (note.id !== prevNoteId) {
    setPrevNoteId(note.id);
    setTitle(note.title);
    setBodyText(note.body || '');
  }

  // Realtime dark mode detection
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
    }
    return true;
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
      setIsDark(dark);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Checklists state
  const [checklists, setChecklists] = useState<Array<{ id: string; text: string; done: boolean; section?: string }>>(() => {
    if (note.checklists && note.checklists.length > 0) return note.checklists;
    if (note.title.toLowerCase().includes('to-do') || note.title.toLowerCase().includes('preparations')) {
      return [
        { id: '1', text: 'Book and confirm the event location', done: true, section: '1. Venue and Decor' },
        { id: '2', text: "Arrange decorations in line with the app's theme", done: false, section: '1. Venue and Decor' },
        { id: '3', text: 'Ensure the stage area, backdrop, and presentation screens are set up', done: false, section: '1. Venue and Decor' },
        { id: '4', text: 'Place directional signage throughout the venue', done: false, section: '1. Venue and Decor' },
        { id: '5', text: 'Provide a projector or LED screen for the app presentation', done: false, section: '2. Technology and AV Equipment' },
        { id: '6', text: 'Check microphones, sound system, and lighting', done: false, section: '2. Technology and AV Equipment' }
      ];
    }
    return [];
  });

  // Calculate incoming backlinks (Notion bidirectional links)
  const incomingBacklinks = useMemo(() => {
    return calculateBacklinks(items, note.title);
  }, [items, note.title]);

  // All other notes/tasks for [[ autocomplete
  const candidateWikiItems = useMemo(() => {
    return items.filter(i => 
      !i.deletedAt && 
      !i.isArchived && 
      i.id !== note.id && 
      i.title.toLowerCase().includes(wikiQuery.toLowerCase())
    ).slice(0, 6);
  }, [items, note.id, wikiQuery]);

  // Palette styling based on Google Keep theme
  const palette = NOTE_COLOR_PALETTES[note.color || 'default'] || NOTE_COLOR_PALETTES.default;
  const noteBg = isDark ? palette.bgDark : palette.bgLight;
  const noteBorder = isDark ? palette.borderDark : palette.borderLight;

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onUpdateNote({ title: newTitle });
  };

  const handleBodyChange = (newBody: string) => {
    setBodyText(newBody);
    onUpdateNote({ body: newBody });

    // Detect Slash Command trigger: "/" at end or after whitespace
    const cursorPos = textareaRef.current?.selectionStart || newBody.length;
    const textUpToCursor = newBody.slice(0, cursorPos);
    const slashMatch = textUpToCursor.match(/(?:^|\n|\s)\/([a-zA-Z0-9]*)$/);

    if (slashMatch) {
      setShowSlashMenu(true);
      setSlashQuery(slashMatch[1].toLowerCase());
      setSlashMenuIndex(0);
    } else {
      setShowSlashMenu(false);
    }

    // Detect Notion Wiki Link trigger: "[[" at end or after whitespace
    const wikiMatch = textUpToCursor.match(/\[\[([^\]\n]*)$/);
    if (wikiMatch) {
      setShowWikiMenu(true);
      setWikiQuery(wikiMatch[1]);
      setWikiMenuIndex(0);
    } else {
      setShowWikiMenu(false);
    }
  };

  // Notion Slash Command Actions
  const slashCommands = [
    { id: 'h1', label: 'Heading 1', icon: Heading1, desc: 'Large section heading', insert: '\n# ' },
    { id: 'h2', label: 'Heading 2', icon: Heading2, desc: 'Medium section heading', insert: '\n## ' },
    { id: 'todo', label: 'To-do List', icon: CheckSquare, desc: 'Track tasks with interactive checkboxes', insert: '\n- [ ] ' },
    { id: 'bullet', label: 'Bulleted List', icon: List, desc: 'Create a simple bulleted list', insert: '\n- ' },
    { id: 'quote', label: 'Visionary Quote', icon: Quote, desc: 'Capture a memorable quotation', insert: '\n> ' },
    { id: 'callout', label: 'Callout Box', icon: CreditCard, desc: 'Highlighted notice or insight box', insert: '\n> 💡 **Notice**: ' },
    { id: 'code', label: 'Code Block', icon: Code, desc: 'Monospace syntax snippet', insert: '\n```\n\n```' },
    { id: 'divider', label: 'Divider', icon: Minus, desc: 'Visually divide sections', insert: '\n---\n' },
  ].filter(cmd => cmd.label.toLowerCase().includes(slashQuery) || cmd.id.includes(slashQuery));

  const applySlashCommand = (cmd: typeof slashCommands[0]) => {
    const cursorPos = textareaRef.current?.selectionStart || bodyText.length;
    const textBeforeCursor = bodyText.slice(0, cursorPos);
    const textAfterCursor = bodyText.slice(cursorPos);
    
    // Replace the trailing "/..." with the command insertion
    const updatedBefore = textBeforeCursor.replace(/(?:^|\n|\s)\/[a-zA-Z0-9]*$/, cmd.insert);
    const newText = updatedBefore + textAfterCursor;
    
    setBodyText(newText);
    onUpdateNote({ body: newText });
    setShowSlashMenu(false);

    // If to-do chosen, also add to structured checklists
    if (cmd.id === 'todo') {
      addChecklistItem('New task from command');
    }

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const applyWikiLink = (targetItem: Item) => {
    const cursorPos = textareaRef.current?.selectionStart || bodyText.length;
    const textBeforeCursor = bodyText.slice(0, cursorPos);
    const textAfterCursor = bodyText.slice(cursorPos);

    // Replace the trailing "[[..." with "[[Target Title]] "
    const updatedBefore = textBeforeCursor.replace(/\[\[[^\]\n]*$/, `[[${targetItem.title}]] `);
    const newText = updatedBefore + textAfterCursor;

    setBodyText(newText);
    onUpdateNote({ body: newText });
    setShowWikiMenu(false);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const toggleChecklist = (id: string) => {
    const updated = checklists.map(c => c.id === id ? { ...c, done: !c.done } : c);
    setChecklists(updated);
    onUpdateNote({ checklists: updated });
  };

  const addChecklistItem = (customText?: string, section?: string) => {
    const textToAdd = customText || newChecklistText.trim() || 'New checklist task';
    const newItem = {
      id: `${note.id}-task-${checklists.length + 1}`,
      text: textToAdd,
      done: false,
      section: section || (checklists[checklists.length - 1]?.section)
    };
    const updated = [...checklists, newItem];
    setChecklists(updated);
    setNewChecklistText('');
    onUpdateNote({ checklists: updated });
  };

  const removeChecklistItem = (id: string) => {
    const updated = checklists.filter(c => c.id !== id);
    setChecklists(updated);
    onUpdateNote({ checklists: updated });
  };

  const formattedDate = new Date(note.createdAt || 0).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const isQuoteNote = note.quoteAuthor || note.title.toLowerCase().includes('steve jobs') || note.title.toLowerCase().includes('inspiration');

  // Render wiki link pills inside text
  const renderInteractiveText = (text: string) => {
    const parts = text.split(/(\[\[.*?\]\])/g);
    return parts.map((part, idx) => {
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const linkTitle = part.slice(2, -2);
        const resolvedItem = findItemByTitle(items, linkTitle);

        return (
          <button
            key={idx}
            type="button"
            onClick={() => {
              if (resolvedItem && onOpenNoteById) {
                onOpenNoteById(resolvedItem.id);
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '1px 8px',
              borderRadius: 6,
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--accent-primary)',
              fontSize: '0.92em',
              fontWeight: 600,
              cursor: resolvedItem ? 'pointer' : 'default',
              margin: '0 2px',
              verticalAlign: 'baseline',
              transition: 'background 0.1s ease'
            }}
            title={resolvedItem ? `Jump to note: ${linkTitle}` : `Page: ${linkTitle}`}
          >
            <FileText size={12} color="var(--accent-primary)" />
            <span>{linkTitle}</span>
          </button>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div 
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100%',
        background: noteBg,
        border: `1.5px solid ${noteBorder}`,
        borderRadius: 20,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-md)',
        color: 'var(--text-primary)',
        transition: 'background 0.2s ease, border-color 0.2s ease'
      }}
    >
      {/* Top Header with Back, Keep Color Swatch, Category & Done Button */}
      <div 
        style={{
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 20
        }}
      >
        {/* Back Button */}
        <button
          type="button"
          onClick={onBack}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-sm)'
          }}
          title="Back to Notes"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Center: Category, Keep Color Swatch & Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Keep Color Picker Flyout */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowColorPicker(prev => !prev)}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: palette.dotColor,
                border: '2px solid var(--bg-surface)',
                boxShadow: '0 0 0 1px var(--border-default)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={`Note Color: ${palette.label}`}
            />
            {showColorPicker && (
              <div 
                style={{
                  position: 'absolute',
                  top: 32,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 12,
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: 'var(--shadow-modal)',
                  zIndex: 40
                }}
              >
                {Object.values(NOTE_COLOR_PALETTES).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onUpdateNote({ color: p.id === 'default' ? undefined : (p.id as NoteColorId) });
                      setShowColorPicker(false);
                    }}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: p.dotColor,
                      border: (note.color || 'default') === p.id ? '2px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer'
                    }}
                    title={p.label}
                  />
                ))}
              </div>
            )}
          </div>

          {note.category && (
            <span 
              style={{ 
                fontSize: 11, 
                padding: '3px 9px', 
                fontWeight: 650, 
                background: 'var(--bg-surface-elevated)',
                borderRadius: 9999,
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {note.category}
            </span>
          )}

          <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
            {formattedDate}
          </span>
        </div>

        {/* Right side: Pin, Done & More */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => onUpdateNote({ pinned: !note.pinned })}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: note.pinned ? '#f59e0b' : 'var(--text-tertiary)'
            }}
            title={note.pinned ? 'Unpin Note' : 'Pin Note'}
          >
            <Pin size={16} fill={note.pinned ? '#f59e0b' : 'none'} />
          </button>

          <button
            type="button"
            onClick={onBack}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--bg-base)',
              boxShadow: 'var(--shadow-sm)'
            }}
            title="Save & Close"
          >
            <Check size={17} strokeWidth={2.5} />
          </button>

          <button
            type="button"
            onClick={() => setShowOptionsSheet(true)}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
            title="More Options"
          >
            <MoreHorizontal size={17} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ padding: '22px 24px 100px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1, overflowY: 'auto' }}>
        
        {/* Cover Photo / Thumbnail if present (Xiaomi Notes style) */}
        {note.thumbnailUrl && (
          <div style={{ width: '100%', maxHeight: 220, borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <img 
              src={note.thumbnailUrl} 
              alt={note.title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
            />
          </div>
        )}

        {/* Note Title Input */}
        <input
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          style={{
            fontSize: 24,
            fontWeight: 750,
            letterSpacing: '-0.025em',
            color: 'var(--text-primary)',
            border: 'none',
            outline: 'none',
            width: '100%',
            lineHeight: 1.25,
            padding: 0,
            background: 'transparent'
          }}
          placeholder="Note Title..."
        />

        {/* Audio Memo Player (Xiaomi Notes audio memo integration) */}
        {(note.hasAudio || note.title.toLowerCase().includes('preparations') || note.title.toLowerCase().includes('launch')) && (
          <AudioMemoPlayer initialDuration={note.audioDuration || '05:47'} />
        )}

        {/* Notion Block Editing Area */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Hint toolbar for Notion commands */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-tertiary)' }}>
            <span>Type <kbd style={{ padding: '1px 5px', borderRadius: 4, background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontWeight: 650 }}>/</kbd> for Notion blocks or <kbd style={{ padding: '1px 5px', borderRadius: 4, background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontWeight: 650 }}>[[</kbd> to link pages</span>
            <button
              type="button"
              onClick={() => setShowSlashMenu(prev => !prev)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}
            >
              <Plus size={12} />
              <span>Insert Block</span>
            </button>
          </div>

          {/* Interactive Textarea for Note Body */}
          <textarea
            ref={textareaRef}
            value={bodyText}
            onChange={e => handleBodyChange(e.target.value)}
            placeholder="Type anything... Use / for Notion slash commands or [[ to link another note or task."
            style={{
              width: '100%',
              minHeight: 140,
              fontSize: 14.5,
              lineHeight: 1.65,
              color: 'var(--text-primary)',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />

          {/* Rendered Preview with Clickable Wiki Backlink Chips */}
          {bodyText.includes('[[') && (
            <div 
              style={{ 
                padding: '12px 14px', 
                borderRadius: 12, 
                background: 'var(--bg-surface-elevated)', 
                border: '1px solid var(--border-subtle)',
                fontSize: 13.5,
                lineHeight: 1.6
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                WIKI BACKLINKS PREVIEW:
              </div>
              <div>{renderInteractiveText(bodyText)}</div>
            </div>
          )}

          {/* NOTION SLASH COMMANDS MENU DROPDOWN */}
          {showSlashMenu && (
            <div
              style={{
                position: 'absolute',
                top: 40,
                left: 10,
                width: 280,
                maxHeight: 280,
                overflowY: 'auto',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 14,
                boxShadow: 'var(--shadow-modal)',
                zIndex: 60,
                padding: '6px'
              }}
            >
              <div style={{ padding: '6px 8px', fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                Notion Blocks
              </div>
              {slashCommands.map((cmd, idx) => (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={() => applySlashCommand(cmd)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: idx === slashMenuIndex ? 'var(--bg-surface-elevated)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={() => setSlashMenuIndex(idx)}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', flexShrink: 0 }}>
                    <cmd.icon size={15} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{cmd.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{cmd.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* NOTION WIKI LINK ([]) AUTOCOMPLETE DROPDOWN */}
          {showWikiMenu && (
            <div
              style={{
                position: 'absolute',
                top: 70,
                left: 10,
                width: 300,
                maxHeight: 240,
                overflowY: 'auto',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 14,
                boxShadow: 'var(--shadow-modal)',
                zIndex: 60,
                padding: '6px'
              }}
            >
              <div style={{ padding: '6px 8px', fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                Link Page or Note
              </div>
              {candidateWikiItems.length === 0 ? (
                <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-tertiary)' }}>
                  No matching notes found.
                </div>
              ) : (
                candidateWikiItems.map((cand, idx) => (
                  <button
                    key={cand.id}
                    type="button"
                    onClick={() => applyWikiLink(cand)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: idx === wikiMenuIndex ? 'var(--bg-surface-elevated)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={() => setWikiMenuIndex(idx)}
                  >
                    <FileText size={15} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {cand.title}
                      </span>
                      <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                        {cand.category || 'General'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Steve Jobs Quote Card if applicable */}
        {isQuoteNote && (
          <div 
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 18,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}
          >
            <div style={{ fontSize: 14.5, fontStyle: 'italic', lineHeight: 1.6, color: 'var(--text-primary)' }}>
              <span style={{ fontSize: 24, color: 'var(--text-tertiary)', verticalAlign: 'middle', marginRight: 4 }}>“</span>
              I'm convinced that about half of what separates the successful entrepreneurs from the non-successful ones is pure perseverance.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80" 
                alt="Steve Jobs" 
                style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} 
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Steve Jobs</span>
                <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>Founder, Apple Inc.</span>
              </div>
            </div>
          </div>
        )}

        {/* Structured Checklists Section (Xiaomi Notes style) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>Checklist Tasks</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              {checklists.filter(c => c.done).length}/{checklists.length} done
            </span>
          </div>

          {/* New Checklist Item Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              value={newChecklistText}
              onChange={e => setNewChecklistText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addChecklistItem();
                }
              }}
              placeholder="Add a checklist item (press Enter)..."
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none'
              }}
            />
            <button
              type="button"
              onClick={() => addChecklistItem()}
              className="btn-primary"
              style={{ padding: '8px 12px', fontSize: 12, gap: 4 }}
            >
              <Plus size={13} />
              <span>Add</span>
            </button>
          </div>

          {/* Checklist Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {checklists.map(item => (
              <div 
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: 8,
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  transition: 'background 0.1s ease'
                }}
              >
                <div 
                  onClick={() => toggleChecklist(item.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}
                >
                  <div 
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      background: item.done ? 'var(--accent-primary)' : 'transparent',
                      border: `1.5px solid ${item.done ? 'var(--accent-primary)' : 'var(--border-strong)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {item.done && <Check size={11} color="var(--bg-base)" strokeWidth={3} />}
                  </div>
                  <span 
                    style={{
                      fontSize: 13,
                      color: item.done ? 'var(--text-tertiary)' : 'var(--text-primary)',
                      textDecoration: item.done ? 'line-through' : 'none'
                    }}
                  >
                    {item.text}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeChecklistItem(item.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 3 }}
                  title="Remove Item"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Hand-Drawn Sketch preview if note has drawingData */}
        {note.drawingData && (
          <div 
            onClick={onOpenDraw}
            style={{ 
              borderRadius: 16, 
              border: '1.5px dashed var(--border-default)', 
              padding: 14, 
              cursor: 'pointer',
              background: 'var(--bg-surface-elevated)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}
          >
            <img src={note.drawingData} alt="Sketch" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }} />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>✏️ Click to edit hand-drawn sketch</span>
          </div>
        )}

        {/* NOTION INCOMING BACKLINKS SECTION */}
        {incomingBacklinks.length > 0 && (
          <div 
            style={{
              marginTop: 10,
              padding: '14px 18px',
              borderRadius: 14,
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              <Link2 size={13} color="var(--accent-primary)" />
              <span>{incomingBacklinks.length} Linked Mention{incomingBacklinks.length === 1 ? '' : 's'} (Notion Backlinks)</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {incomingBacklinks.map(backlinkItem => (
                <button
                  key={backlinkItem.id}
                  type="button"
                  onClick={() => onOpenNoteById && onOpenNoteById(backlinkItem.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    borderRadius: 8,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  title={`Open: ${backlinkItem.title}`}
                >
                  <FileText size={12} color="var(--accent-primary)" />
                  <span>{backlinkItem.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Tool Dock (Xiaomi & Notion controls) */}
      <div 
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '8px 20px',
          borderRadius: 9999,
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--border-default)',
          zIndex: 50
        }}
      >
        {/* 1. Draw */}
        <button
          type="button"
          onClick={onOpenDraw}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', padding: 4 }}
          title="Draw Your Note"
        >
          <PenTool size={18} />
        </button>

        {/* 2. Checklist */}
        <button
          type="button"
          onClick={() => addChecklistItem()}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', padding: 4 }}
          title="Add Checklist"
        >
          <CheckSquare size={18} />
        </button>

        {/* 3. Notion Blocks Menu */}
        <button
          type="button"
          onClick={() => setShowSlashMenu(prev => !prev)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', padding: 4 }}
          title="Insert Notion Block"
        >
          <Plus size={18} />
        </button>

        {/* 4. Formatting */}
        <button
          type="button"
          onClick={() => setShowFormattingSheet(true)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', padding: 4 }}
          title="Rich Text Formatting"
        >
          <Type size={18} />
        </button>

        {/* 5. Keep Color */}
        <button
          type="button"
          onClick={() => setShowColorPicker(prev => !prev)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', padding: 4 }}
          title="Note Color"
        >
          <Palette size={18} />
        </button>

        {/* 6. Settings */}
        <button
          type="button"
          onClick={() => setShowOptionsSheet(true)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', padding: 4 }}
          title="Note Settings & Options"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Formatting Tray Bottom Sheet */}
      <FormattingTraySheet
        isOpen={showFormattingSheet}
        onClose={() => setShowFormattingSheet(false)}
        activeColor={activeHighlightColor}
        onSelectColor={setActiveHighlightColor}
        onApplyFormat={(fmt, val) => {
          if (fmt === 'highlight') {
            setActiveHighlightColor(val || '#ede9fe');
          } else if (fmt === 'bold') {
            handleBodyChange(bodyText + ' **Bold text**');
          } else if (fmt === 'italic') {
            handleBodyChange(bodyText + ' *Italic text*');
          } else if (fmt === 'h1') {
            handleBodyChange(bodyText + '\n# Heading 1');
          } else if (fmt === 'h2') {
            handleBodyChange(bodyText + '\n## Heading 2');
          } else if (fmt === 'bulletList') {
            handleBodyChange(bodyText + '\n- Bullet point');
          } else if (fmt === 'numberedList') {
            handleBodyChange(bodyText + '\n1. First step');
          } else if (fmt === 'quote') {
            handleBodyChange(bodyText + '\n> Visionary quote');
          } else if (fmt === 'callout') {
            handleBodyChange(bodyText + '\n> 💡 **Notice**: Important takeaway');
          }
        }}
      />

      {/* Note Options Sheet */}
      <NoteOptionsSheet
        isOpen={showOptionsSheet}
        onClose={() => setShowOptionsSheet(false)}
        note={note}
        onUpdateNote={onUpdateNote}
        onDeleteNote={onDeleteNote}
        onDuplicateNote={onDuplicateNote}
      />
    </div>
  );
};
