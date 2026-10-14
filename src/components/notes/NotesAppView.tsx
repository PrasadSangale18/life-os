import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import type { Item, NoteColorId } from '../../types';
import { 
  Plus, 
  Pin, 
  Lock, 
  Check, 
  Mic,
  Palette,
  CheckSquare,
  PenTool,
  Copy,
  Trash2,
  Volume2,
  Sparkles
} from 'lucide-react';
import { NoteDetailView } from './NoteDetailView';
import { DrawCanvas } from './DrawCanvas';
import { NOTE_COLOR_PALETTES } from './noteTheme';

interface NotesAppViewProps {
  searchQuery?: string;
  onNewNote?: () => void;
}

export const NotesAppView: React.FC<NotesAppViewProps> = ({ 
  searchQuery: externalSearchQuery = '', 
  onNewNote 
}) => {
  const { items, addItem, updateItem, trashItem } = useStore();
  const [activeView, setActiveView] = useState<'feed' | 'detail' | 'draw'>('feed');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [activeColorPickerNoteId, setActiveColorPickerNoteId] = useState<string | null>(null);

  // Quick capture input state (Xiaomi Notes style)
  const [quickTitle, setQuickTitle] = useState('');
  const [quickColor, setQuickColor] = useState<NoteColorId | 'default'>('default');
  const [showQuickColorMenu, setShowQuickColorMenu] = useState(false);
  const quickInputRef = useRef<HTMLInputElement>(null);

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

  // Filter notes from items
  const notes = useMemo(() => {
    return items.filter(i => (i.type === 'note' || i.type === 'idea' || i.type === 'knowledge' || i.type === 'journal') && !i.deletedAt && !i.isArchived);
  }, [items]);

  // Seed showcase notes if user has fewer than 2 notes
  useEffect(() => {
    if (notes.length === 0) {
      // 1. Wishlist Buku (Keep Amber card + Xiaomi cover)
      addItem({
        type: 'note',
        title: 'Wishlist Buku Yang Harus Dibaca Untuk Self-Improvement',
        body: 'Mencapai perkembangan diri adalah perjalanan seumur hidup. Kumpulan buku ini membahas strategi produktivitas, ketenangan batin, dan kebiasaan positif.',
        category: 'Personal',
        color: 'yellow',
        pinned: true,
        thumbnailUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
        tags: ['personal', 'reading', 'books']
      });

      // 2. Secret Ideas & Financial Strategy (Keep Lavender card + Lock)
      addItem({
        type: 'note',
        title: 'Secret Ideas & Financial Strategy',
        body: 'Rencana alokasi investasi dan ide proyek rahasia untuk kuartal depan. Diversifikasi portofolio dan cadangan kas darurat.',
        category: 'Personal',
        color: 'purple',
        isLocked: true,
        isPrivate: true,
        tags: ['private', 'finance']
      });

      // 3. To-Do List And Event Preparations (Keep Emerald card + Xiaomi audio & checklist)
      addItem({
        type: 'note',
        title: 'To-Do List And Event Preparations For Mobile App Launch',
        body: 'Preparing for our mobile app launch requires thorough setup and attention to detail to ensure a successful event. Here is a checklist to help make a strong impact on launch day.',
        category: 'Work',
        color: 'green',
        pinned: true,
        hasAudio: true,
        audioDuration: '05:47',
        checklists: [
          { id: '1', text: 'Book and confirm the event location', done: true, section: '1. Venue and Decor' },
          { id: '2', text: "Arrange decorations in line with the app's theme", done: false, section: '1. Venue and Decor' },
          { id: '3', text: 'Ensure the stage area, backdrop, and presentation screens are set up', done: false, section: '1. Venue and Decor' },
          { id: '4', text: 'Place directional signage throughout the venue', done: false, section: '1. Venue and Decor' },
          { id: '5', text: 'Provide a projector or LED screen for the app presentation', done: false, section: '2. Technology and AV Equipment' },
          { id: '6', text: 'Check microphones, sound system, and lighting', done: false, section: '2. Technology and AV Equipment' }
        ],
        tags: ['work', 'launch', 'checklist']
      });

      // 4. Steve Jobs Visionary Thoughts (Keep Coral card + Notion Quote)
      addItem({
        type: 'note',
        title: 'Find Inspiration From The Visionary Thoughts Of Steve Jobs',
        body: "Kutipan-kutipannya mengingatkan kita untuk terus berinovasi, percaya pada intuisi, dan memiliki keberanian untuk mengikuti apa yang benar-benar kita inginkan dalam hidup. [[Wishlist Buku Yang Harus Dibaca Untuk Self-Improvement]]",
        category: 'Quotes',
        color: 'red',
        quoteAuthor: 'Steve Jobs',
        quoteDoodle: true,
        tags: ['quotes', 'stevejobs', 'inspiration']
      });

      // 5. Visual Doodles & Architecture (Keep Sky Cyan card + Xiaomi Drawing)
      addItem({
        type: 'note',
        title: 'Draw Your Note & Visual Architecture Doodles',
        body: 'Sketching ideas and flowcharts visually helps accelerate creativity and clear thinking across all domains.',
        category: 'Ideas',
        color: 'blue',
        tags: ['drawing', 'doodle', 'ideas']
      });
    }
  }, [notes.length, addItem]);

  // Active note object
  const currentNote = useMemo(() => {
    return notes.find(n => n.id === activeNoteId) || notes[0] || null;
  }, [notes, activeNoteId]);

  // Filtered notes based on external search, category, and color
  const filteredNotes = useMemo(() => {
    let result = notes;
    if (selectedCategory !== 'All') {
      result = result.filter(n => n.category?.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (selectedColor !== 'all') {
      result = result.filter(n => (n.color || 'default') === selectedColor);
    }
    if (externalSearchQuery.trim()) {
      const q = externalSearchQuery.toLowerCase();
      result = result.filter(n => 
        n.title.toLowerCase().includes(q) || 
        (n.body && n.body.toLowerCase().includes(q)) ||
        (n.category && n.category.toLowerCase().includes(q)) ||
        (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, selectedCategory, selectedColor, externalSearchQuery]);

  // Split into Pinned and Others (Google Keep & Xiaomi architecture)
  const pinnedNotes = useMemo(() => filteredNotes.filter(n => n.pinned), [filteredNotes]);
  const otherNotes = useMemo(() => filteredNotes.filter(n => !n.pinned), [filteredNotes]);

  const CATEGORIES = ['All', 'Personal', 'Work', 'Kajian Rutin', 'Quotes', 'Ideas'];

  // Handle Quick Note Creation (Xiaomi Notes style)
  const handleQuickSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickTitle.trim()) return;

    addItem({
      type: 'note',
      title: quickTitle.trim(),
      body: '',
      category: selectedCategory === 'All' ? 'Personal' : selectedCategory,
      color: quickColor === 'default' ? undefined : quickColor,
      pinned: false
    }).then(newId => {
      setQuickTitle('');
      setActiveNoteId(newId);
      setActiveView('detail');
    });
  };

  // Quick Action: Create with Checklist
  const handleCreateChecklistNote = () => {
    addItem({
      type: 'note',
      title: quickTitle.trim() || 'New Checklist',
      body: '',
      category: selectedCategory === 'All' ? 'Personal' : selectedCategory,
      color: quickColor === 'default' ? 'green' : quickColor,
      checklists: [
        { id: '1', text: 'First task item', done: false },
        { id: '2', text: 'Second task item', done: false }
      ]
    }).then(newId => {
      setQuickTitle('');
      setActiveNoteId(newId);
      setActiveView('detail');
    });
  };

  // Quick Action: Create Voice Memo
  const handleCreateVoiceNote = () => {
    addItem({
      type: 'note',
      title: quickTitle.trim() || 'Voice Memo Note',
      body: 'Voice memo recorded on ' + new Date().toLocaleDateString(),
      category: selectedCategory === 'All' ? 'Personal' : selectedCategory,
      color: quickColor === 'default' ? 'blue' : quickColor,
      hasAudio: true,
      audioDuration: '02:30'
    }).then(newId => {
      setQuickTitle('');
      setActiveNoteId(newId);
      setActiveView('detail');
    });
  };

  // Quick Action: Draw New Sketch
  const handleCreateDrawNote = () => {
    addItem({
      type: 'note',
      title: quickTitle.trim() || 'Visual Sketch Note',
      body: 'Hand-drawn visual notes and conceptual doodles.',
      category: 'Ideas',
      color: quickColor === 'default' ? 'purple' : quickColor
    }).then(newId => {
      setQuickTitle('');
      setActiveNoteId(newId);
      setActiveView('draw');
    });
  };

  const handleCreateNewNote = () => {
    if (onNewNote) {
      onNewNote();
      return;
    }
    addItem({
      type: 'note',
      title: 'New Note',
      body: '',
      category: selectedCategory === 'All' ? 'Personal' : selectedCategory,
      pinned: false
    }).then(newId => {
      setActiveNoteId(newId);
      setActiveView('detail');
    });
  };

  const handleDuplicateNote = (note: Item) => {
    addItem({
      type: 'note',
      title: `${note.title} (Copy)`,
      body: note.body,
      category: note.category,
      color: note.color,
      thumbnailUrl: note.thumbnailUrl,
      hasAudio: note.hasAudio,
      audioDuration: note.audioDuration,
      drawingData: note.drawingData,
      checklists: note.checklists
    });
  };

  // Card checklist toggle directly from feed
  const handleToggleCardChecklist = (e: React.MouseEvent, note: Item, checklistId: string) => {
    e.stopPropagation();
    if (!note.checklists) return;
    const updated = note.checklists.map(c => c.id === checklistId ? { ...c, done: !c.done } : c);
    updateItem(note.id, { checklists: updated });
  };

  // Render a Single Note Card
  const renderNoteCard = (note: Item) => {
    const isPinned = !!note.pinned;
    const isLocked = !!note.isLocked;
    const palette = NOTE_COLOR_PALETTES[note.color || 'default'] || NOTE_COLOR_PALETTES.default;
    const cardBg = isDark ? palette.bgDark : palette.bgLight;
    const cardBorder = isDark ? palette.borderDark : palette.borderLight;
    const showColorPicker = activeColorPickerNoteId === note.id;

    // Task completion metrics for Xiaomi progress indicator
    const checklistTotal = note.checklists?.length || 0;
    const checklistDone = note.checklists?.filter(c => c.done).length || 0;

    return (
      <div
        key={note.id}
        onClick={() => {
          setActiveNoteId(note.id);
          setActiveView('detail');
        }}
        style={{
          background: cardBg,
          borderRadius: 16,
          border: `1.5px solid ${cardBorder}`,
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'all 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
        className="group hover:-translate-y-1 hover:shadow-md"
      >
        {/* Thumbnail Image Cover (Xiaomi Notes feature) */}
        {note.thumbnailUrl && (
          <div style={{ width: '100%', height: 135, overflow: 'hidden', position: 'relative' }}>
            <img 
              src={note.thumbnailUrl} 
              alt={note.title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            {isPinned && (
              <div 
                style={{ 
                  position: 'absolute', 
                  top: 10, 
                  right: 10, 
                  background: 'rgba(0,0,0,0.65)', 
                  backdropFilter: 'blur(4px)',
                  color: '#f59e0b',
                  padding: '4px 8px',
                  borderRadius: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10.5,
                  fontWeight: 700
                }}
              >
                <Pin size={11} fill="currentColor" />
                <span>PINNED</span>
              </div>
            )}
          </div>
        )}

        {/* Card Inner Content */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          
          {/* Top Header: Pin Status / Audio / Color Dot */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isPinned && !note.thumbnailUrl && (
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 4, 
                    color: '#f59e0b',
                    background: 'rgba(245, 158, 11, 0.14)',
                    padding: '2px 7px',
                    borderRadius: 9999,
                    fontSize: 10,
                    fontWeight: 700 
                  }}
                >
                  <Pin size={11} fill="currentColor" />
                  <span>PINNED</span>
                </div>
              )}

              {note.hasAudio && (
                <div 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 4, 
                    padding: '2px 8px', 
                    borderRadius: 12, 
                    background: 'rgba(14, 165, 233, 0.15)', 
                    color: '#0ea5e9', 
                    fontSize: 10.5, 
                    fontWeight: 650 
                  }}
                  title="Audio Memo Attached"
                >
                  <Volume2 size={11} />
                  <span>{note.audioDuration || '05:47'}</span>
                </div>
              )}

              {note.color && note.color !== 'default' && (
                <div 
                  style={{ 
                    width: 7, 
                    height: 7, 
                    borderRadius: '50%', 
                    background: palette.dotColor 
                  }} 
                  title={palette.label}
                />
              )}
            </div>

            {/* Quick Keep Pin Button on hover/always accessible */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                updateItem(note.id, { pinned: !note.pinned });
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: isPinned ? '#f59e0b' : 'var(--text-tertiary)',
                padding: 4,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.12s ease'
              }}
              title={isPinned ? 'Unpin note' : 'Pin note to top'}
            >
              <Pin size={15} fill={isPinned ? '#f59e0b' : 'none'} />
            </button>
          </div>

          {/* Locked State Card */}
          {isLocked ? (
            <div style={{ padding: '20px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={17} color="var(--text-primary)" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Locked Private Note</span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Click to authenticate &amp; view</span>
            </div>
          ) : (
            <>
              {/* Note Title */}
              <div 
                style={{ 
                  fontSize: 15, 
                  fontWeight: 680, 
                  color: 'var(--text-primary)',
                  lineHeight: 1.35,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {note.title}
              </div>

              {/* Excerpt Body */}
              {note.body && (
                <div 
                  style={{ 
                    fontSize: 12.5, 
                    color: 'var(--text-secondary)', 
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {note.body.replace(/\[\[(.*?)\]\]/g, '$1')}
                </div>
              )}

              {/* Interactive Checklist Preview (Google Keep & Xiaomi Notes feature) */}
              {note.checklists && note.checklists.length > 0 && (
                <div 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 6, 
                    marginTop: 4, 
                    background: isDark ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.6)', 
                    padding: '8px 10px', 
                    borderRadius: 10,
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {/* Progress Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 650, color: 'var(--text-secondary)' }}>
                    <span>TASKS ({checklistDone}/{checklistTotal})</span>
                    <span className="tabular-nums">{Math.round((checklistDone / checklistTotal) * 100)}%</span>
                  </div>

                  {/* Checklist items with instant ticking */}
                  {note.checklists.slice(0, 3).map(c => (
                    <div 
                      key={c.id} 
                      onClick={(e) => handleToggleCardChecklist(e, note, c.id)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8, 
                        fontSize: 12, 
                        color: c.done ? 'var(--text-tertiary)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        padding: '2px 0'
                      }}
                    >
                      <div 
                        style={{ 
                          width: 14, 
                          height: 14, 
                          borderRadius: 4, 
                          background: c.done ? 'var(--accent-primary)' : 'transparent', 
                          border: `1.5px solid ${c.done ? 'var(--accent-primary)' : 'var(--border-strong)'}`, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.12s ease'
                        }}
                      >
                        {c.done && <Check size={9} color="var(--bg-base)" strokeWidth={3} />}
                      </div>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: c.done ? 'line-through' : 'none' }}>
                        {c.text}
                      </span>
                    </div>
                  ))}
                  {note.checklists.length > 3 && (
                    <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginLeft: 22 }}>
                      +{note.checklists.length - 3} more items
                    </span>
                  )}
                </div>
              )}

              {/* Drawing Doodle preview if present */}
              {note.drawingData && (
                <div style={{ borderRadius: 10, overflow: 'hidden', maxHeight: 80, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-elevated)' }}>
                  <img src={note.drawingData} alt="Sketch preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              )}

              {/* Tag & Date Footer with Keep Quick Actions */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginTop: 'auto',
                  paddingTop: 8, 
                  borderTop: '1px solid var(--border-subtle)' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {note.category && (
                    <span 
                      style={{ 
                        fontSize: 10.5, 
                        fontWeight: 600, 
                        padding: '2px 8px', 
                        borderRadius: 9999, 
                        background: 'var(--bg-surface-elevated)', 
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      {note.category}
                    </span>
                  )}
                  {note.tags && note.tags.length > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                      #{note.tags[0]}
                    </span>
                  )}
                </div>

                {/* Card Quick Action Bar (Google Keep style) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {/* Keep Color Picker Button */}
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveColorPickerNoteId(prev => prev === note.id ? null : note.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-tertiary)',
                        padding: 3,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Change Note Color"
                    >
                      <Palette size={13} />
                    </button>

                    {/* Color Swatches Popover */}
                    {showColorPicker && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          bottom: 26,
                          right: 0,
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 12,
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: 'var(--shadow-modal)',
                          zIndex: 30
                        }}
                      >
                        {Object.values(NOTE_COLOR_PALETTES).map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateItem(note.id, { color: p.id === 'default' ? undefined : (p.id as NoteColorId) });
                              setActiveColorPickerNoteId(null);
                            }}
                            style={{
                              width: 18,
                              height: 18,
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

                  {/* Duplicate */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateNote(note);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-tertiary)',
                      padding: 3,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Duplicate Note"
                  >
                    <Copy size={13} />
                  </button>

                  {/* Trash */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      trashItem(note.id);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-tertiary)',
                      padding: 3,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Delete Note"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: '75vh',
        position: 'relative'
      }}
    >
      {/* Main Container */}
      <div 
        style={{
          width: '100%',
          background: 'var(--bg-surface)',
          borderRadius: 16,
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          minHeight: 600
        }}
      >
        {/* VIEW 1: MY NOTES FEED */}
        {activeView === 'feed' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px 24px 80px', position: 'relative' }}>
            
            {/* XIAOMI NOTES QUICK-CAPTURE STRIP */}
            <form 
              onSubmit={handleQuickSubmit}
              style={{
                width: '100%',
                maxWidth: 640,
                margin: '0 auto 24px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 14,
                boxShadow: 'var(--shadow-sm)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'border-color 0.15s ease'
              }}
            >
              <input
                ref={quickInputRef}
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
                placeholder="Take a quick note or jot down a thought... (Press Enter)"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: 13.5,
                  color: 'var(--text-primary)'
                }}
              />

              {/* Quick tool action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* 1. Checklist Button */}
                <button
                  type="button"
                  onClick={handleCreateChecklistNote}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '6px 8px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600
                  }}
                  title="Create Checklist Note"
                >
                  <CheckSquare size={13} color="var(--accent-primary)" />
                  <span className="hidden sm:inline">List</span>
                </button>

                {/* 2. Voice Memo Button */}
                <button
                  type="button"
                  onClick={handleCreateVoiceNote}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '6px 8px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600
                  }}
                  title="Create Voice Memo Note"
                >
                  <Mic size={13} color="#0ea5e9" />
                  <span className="hidden sm:inline">Voice</span>
                </button>

                {/* 3. Sketch Button */}
                <button
                  type="button"
                  onClick={handleCreateDrawNote}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '6px 8px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600
                  }}
                  title="Draw / Sketch Note"
                >
                  <PenTool size={13} color="#a855f7" />
                  <span className="hidden sm:inline">Draw</span>
                </button>

                {/* 4. Quick Color Preset Button */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowQuickColorMenu(prev => !prev)}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      padding: '6px 8px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 600
                    }}
                    title="Choose note color"
                  >
                    <Palette size={13} color={NOTE_COLOR_PALETTES[quickColor]?.dotColor || 'var(--text-secondary)'} />
                    <span className="hidden sm:inline">Color</span>
                  </button>
                  {showQuickColorMenu && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 36,
                        right: 0,
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 12,
                        padding: '6px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: 'var(--shadow-modal)',
                        zIndex: 50
                      }}
                    >
                      {Object.values(NOTE_COLOR_PALETTES).map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setQuickColor(p.id as NoteColorId | 'default');
                            setShowQuickColorMenu(false);
                          }}
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: p.dotColor,
                            border: quickColor === p.id ? '2px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                            cursor: 'pointer'
                          }}
                          title={p.label}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </form>

            {/* Filter Toolbar: Categories, Keep Color Swatches, and Count */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 24,
                paddingBottom: 14,
                borderBottom: '1px solid var(--border-subtle)'
              }}
            >
              {/* Category Filter Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
                {CATEGORIES.map(cat => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 9999,
                        background: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                        color: isSelected ? 'var(--bg-base)' : 'var(--text-secondary)',
                        border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        fontSize: 12,
                        fontWeight: isSelected ? 650 : 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Keep Color Filter Swatches + Note Count */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Keep Color Filter Dots */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedColor('all')}
                    style={{
                      fontSize: 11,
                      fontWeight: selectedColor === 'all' ? 700 : 500,
                      color: selectedColor === 'all' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    All Colors
                  </button>
                  {Object.values(NOTE_COLOR_PALETTES).filter(p => p.id !== 'default').map(p => {
                    const isSel = selectedColor === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedColor(isSel ? 'all' : p.id)}
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: p.dotColor,
                          border: isSel ? '2px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                          transform: isSel ? 'scale(1.2)' : 'scale(1)',
                          cursor: 'pointer',
                          transition: 'transform 0.1s ease'
                        }}
                        title={`Filter by ${p.label}`}
                      />
                    );
                  })}
                </div>

                <span 
                  className="tabular-nums" 
                  style={{ 
                    fontSize: 11.5, 
                    fontWeight: 600, 
                    color: 'var(--text-secondary)',
                    padding: '3px 9px',
                    borderRadius: 12,
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
                </span>
              </div>
            </div>

            {/* SECTIONS: GOOGLE KEEP & XIAOMI NOTES ARCHITECTURE */}
            {/* If pinned notes exist, render PINNED and OTHERS sections */}
            {pinnedNotes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                
                {/* 1. PINNED SECTION */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em' }}>
                    <Pin size={13} fill="#f59e0b" />
                    <span>PINNED ({pinnedNotes.length})</span>
                  </div>
                  
                  <div 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', 
                      gap: 16,
                      alignItems: 'start'
                    }}
                  >
                    {pinnedNotes.map(renderNoteCard)}
                  </div>
                </div>

                {/* 2. OTHERS SECTION */}
                {otherNotes.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-tertiary)', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em' }}>
                      <span>OTHERS ({otherNotes.length})</span>
                    </div>

                    <div 
                      style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', 
                        gap: 16,
                        alignItems: 'start'
                      }}
                    >
                      {otherNotes.map(renderNoteCard)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Single Grid if no pinned notes exist */
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', 
                  gap: 16,
                  alignItems: 'start'
                }}
              >
                {filteredNotes.map(renderNoteCard)}
              </div>
            )}

            {/* Empty state if no notes found */}
            {filteredNotes.length === 0 && (
              <div 
                style={{ 
                  padding: '56px 24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 14,
                  color: 'var(--text-secondary)'
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} color="var(--text-tertiary)" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  No notes match your filter.
                </div>
                <button
                  type="button"
                  onClick={handleCreateNewNote}
                  className="btn-primary"
                  style={{ gap: 6, fontSize: 13 }}
                >
                  <Plus size={14} />
                  <span>Create note in {selectedCategory}</span>
                </button>
              </div>
            )}

            {/* Bottom-Right Floating Action Button (+) */}
            <button
              type="button"
              onClick={handleCreateNewNote}
              style={{
                position: 'fixed',
                bottom: 24,
                right: 28,
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                color: 'var(--bg-base)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
                transition: 'transform 0.14s ease',
                zIndex: 40
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              title="Create New Note"
            >
              <Plus size={24} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* VIEW 2: NOTE DETAIL READER / NOTION EDITOR */}
        {activeView === 'detail' && currentNote && (
          <NoteDetailView
            note={currentNote}
            onBack={() => setActiveView('feed')}
            onUpdateNote={updates => updateItem(currentNote.id, updates)}
            onDeleteNote={() => {
              trashItem(currentNote.id);
              setActiveView('feed');
            }}
            onDuplicateNote={() => handleDuplicateNote(currentNote)}
            onOpenDraw={() => setActiveView('draw')}
            onOpenNoteById={id => setActiveNoteId(id)}
          />
        )}

        {/* VIEW 3: DRAW YOUR NOTE CANVAS */}
        {activeView === 'draw' && currentNote && (
          <DrawCanvas
            initialDrawing={currentNote.drawingData}
            onSave={data => updateItem(currentNote.id, { drawingData: data })}
            onBack={() => setActiveView('detail')}
          />
        )}
      </div>
    </div>
  );
};
