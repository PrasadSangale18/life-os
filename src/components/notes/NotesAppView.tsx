import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../store';
import type { Item } from '../../types';
import { 
  Plus, 
  Pin, 
  Lock, 
  MoreHorizontal, 
  Check, 
  Mic
} from 'lucide-react';
import { NoteDetailView } from './NoteDetailView';
import { DrawCanvas } from './DrawCanvas';

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

  // Filter notes from items
  const notes = useMemo(() => {
    return items.filter(i => (i.type === 'note' || i.type === 'idea' || i.type === 'knowledge' || i.type === 'journal') && !i.deletedAt && !i.isArchived);
  }, [items]);

  // Seed showcase notes if user has fewer than 2 notes
  useEffect(() => {
    if (notes.length === 0) {
      // 1. Wishlist Buku Yang Harus Dibaca (Top left with books cover)
      addItem({
        type: 'note',
        title: 'Wishlist Buku Yang Harus Dibaca Untuk...',
        body: 'Mencapai perkembangan diri adalah perjalanan seumur hidup. Kumpulan buku ini membahas strategi produktivitas, ketenangan batin, dan kebiasaan positif.',
        category: 'Personal',
        pinned: true,
        thumbnailUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
        tags: ['personal', 'reading', 'books']
      });

      // 2. Locked Note (Top right)
      addItem({
        type: 'note',
        title: 'Secret Ideas & Financial Strategy',
        body: 'Rencana alokasi investasi dan ide proyek rahasia untuk kuartal depan.',
        category: 'Personal',
        isLocked: true,
        isPrivate: true,
        tags: ['private', 'finance']
      });

      // 3. To-Do List And Event Preparations (Middle right with audio memo & checklist)
      addItem({
        type: 'note',
        title: 'To-Do List And Event Preparations For Mobile App Launch',
        body: 'Preparing for our mobile app launch requires thorough setup and attention to detail to ensure a successful event. Here is a checklist to help make a strong impact on launch day.',
        category: 'Work',
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

      // 4. Tadzkirotussami' Wal Mutakallim (Middle left)
      addItem({
        type: 'note',
        title: "Tadzkirotussami' Wal Mutakallim Fi' Adabil 'Alim Wal Muta'allim",
        body: 'Pertemuan pertama yang merupakan sesi muqoddimah dari kajian kitab adab penuntut ilmu oleh Ibnu Jamaah.',
        category: 'Kajian Rutin',
        tags: ['kajian', 'rutin', 'adab']
      });

      // 5. Steve Jobs Visionary Thoughts (Quote Note with photo)
      addItem({
        type: 'note',
        title: 'Find Inspiration From The Visionary Thoughts Of Steve Jobs',
        body: "Kutipan-kutipannya mengingatkan kita untuk terus berinovasi, percaya pada intuisi, dan memiliki keberanian untuk mengikuti apa yang benar-benar kita inginkan dalam hidup.",
        category: 'Quotes',
        quoteAuthor: 'Steve Jobs',
        quoteDoodle: true,
        tags: ['quotes', 'stevejobs', 'inspiration']
      });

      // 6. Draw Your Note
      addItem({
        type: 'note',
        title: 'Draw Your Note & Visual Doodles',
        body: 'Sketching ideas and flowcharts visually helps accelerate creativity and clear thinking.',
        category: 'Ideas',
        tags: ['drawing', 'doodle', 'ideas']
      });
    }
  }, [notes.length, addItem]);

  // Active note object
  const currentNote = useMemo(() => {
    return notes.find(n => n.id === activeNoteId) || notes[0] || null;
  }, [notes, activeNoteId]);

  // Filtered notes based on external search & category
  const filteredNotes = useMemo(() => {
    let result = notes;
    if (selectedCategory !== 'All') {
      result = result.filter(n => n.category?.toLowerCase() === selectedCategory.toLowerCase());
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
  }, [notes, selectedCategory, externalSearchQuery]);

  const CATEGORIES = ['All', 'Personal', 'Work', 'Kajian Rutin', 'Quotes', 'Ideas'];

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
      thumbnailUrl: note.thumbnailUrl,
      hasAudio: note.hasAudio,
      audioDuration: note.audioDuration,
      drawingData: note.drawingData,
      checklists: note.checklists
    });
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
      {/* Main Responsive Container */}
      <div 
        style={{
          width: '100%',
          background: 'var(--bg-surface)',
          borderRadius: 14,
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
            
            {/* Top Toolbar: Category Filter Chips & Note Count */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 20,
                paddingBottom: 14,
                borderBottom: '1px solid var(--border-subtle)'
              }}
            >
              {/* Category Filter Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
                {CATEGORIES.map(cat => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '5px 14px',
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

              {/* Note Count Badge & Quick New Note */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span 
                  className="tabular-nums" 
                  style={{ 
                    fontSize: 11.5, 
                    fontWeight: 550, 
                    color: 'var(--text-secondary)',
                    padding: '3px 9px',
                    borderRadius: 12,
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
                </span>

                <button
                  type="button"
                  onClick={handleCreateNewNote}
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: 12, gap: 5 }}
                >
                  <Plus size={14} />
                  <span>New Note</span>
                </button>
              </div>
            </div>

            {/* Responsive Desktop & Mobile Card Grid */}
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: 16,
                alignItems: 'start'
              }}
            >
              {filteredNotes.map(note => {
                const isPinned = !!note.pinned;
                const isLocked = !!note.isLocked;

                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      setActiveNoteId(note.id);
                      setActiveView('detail');
                    }}
                    style={{
                      background: isLocked ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                      borderRadius: 14,
                      border: '1px solid var(--border-default)',
                      boxShadow: 'var(--shadow-sm)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      e.currentTarget.style.borderColor = 'var(--border-strong)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      e.currentTarget.style.borderColor = 'var(--border-default)';
                    }}
                  >
                    {/* Thumbnail Image Cover (if present) */}
                    {note.thumbnailUrl && (
                      <div style={{ width: '100%', height: 130, overflow: 'hidden' }}>
                        <img 
                          src={note.thumbnailUrl} 
                          alt={note.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>
                    )}

                    {/* Card Inner Content */}
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      
                      {/* Top Header: Pin / Audio indicator / 3-dots */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {isPinned ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-warm)' }}>
                            <Pin size={13} fill="currentColor" />
                            <span style={{ fontSize: 10, fontWeight: 600 }}>PINNED</span>
                          </div>
                        ) : note.hasAudio ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 12, background: 'rgba(59,130,246,0.12)', color: '#3b82f6', fontSize: 10, fontWeight: 600 }}>
                            <Mic size={10} />
                            <span>{note.audioDuration || '05:47'}</span>
                          </div>
                        ) : (
                          <div />
                        )}
                        <MoreHorizontal size={14} color="var(--text-tertiary)" />
                      </div>

                      {/* Locked State Card */}
                      {isLocked ? (
                        <div style={{ padding: '24px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Lock size={18} color="var(--text-primary)" />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Locked Note</span>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Click to authenticate &amp; view</span>
                        </div>
                      ) : (
                        <>
                          {/* Note Title */}
                          <div 
                            style={{ 
                              fontSize: 14.5, 
                              fontWeight: 650, 
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

                          {/* Excerpt */}
                          {note.body && (
                            <div 
                              style={{ 
                                fontSize: 12.5, 
                                color: 'var(--text-secondary)', 
                                lineHeight: 1.45,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}
                            >
                              {note.body}
                            </div>
                          )}

                          {/* Checklist preview if present */}
                          {note.checklists && note.checklists.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 2, background: 'var(--bg-base)', padding: '8px 10px', borderRadius: 8 }}>
                              {note.checklists.slice(0, 2).map(c => (
                                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: c.done ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: c.done ? 'var(--accent-primary)' : 'transparent', border: '1.5px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {c.done && <Check size={8} color="var(--bg-base)" strokeWidth={3} />}
                                  </div>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: c.done ? 'line-through' : 'none' }}>
                                    {c.text}
                                  </span>
                                </div>
                              ))}
                              {note.checklists.length > 2 && (
                                <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginLeft: 18 }}>
                                  +{note.checklists.length - 2} more items
                                </span>
                              )}
                            </div>
                          )}

                          {/* Drawing preview if present */}
                          {note.drawingData && (
                            <div style={{ borderRadius: 8, overflow: 'hidden', maxHeight: 70, border: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}>
                              <img src={note.drawingData} alt="Sketch preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                          )}

                          {/* Tag & Date Footer */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {note.category && (
                                <span 
                                  style={{ 
                                    fontSize: 10.5, 
                                    fontWeight: 600, 
                                    padding: '2px 8px', 
                                    borderRadius: 9999, 
                                    background: note.category === 'Personal' ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)', 
                                    color: note.category === 'Personal' ? 'var(--bg-base)' : 'var(--text-primary)',
                                    border: '1px solid var(--border-subtle)'
                                  }}
                                >
                                  {note.category}
                                </span>
                              )}
                              {note.tags && note.tags.length > 0 && (
                                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                                  #{note.tags[0]}
                                </span>
                              )}
                            </div>

                            <span className="tabular-nums" style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                              {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty state if no notes found */}
            {filteredNotes.length === 0 && (
              <div 
                style={{ 
                  padding: '48px 24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 12,
                  color: 'var(--text-secondary)'
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 550, color: 'var(--text-primary)' }}>
                  No notes match your filter.
                </div>
                <button
                  type="button"
                  onClick={handleCreateNewNote}
                  className="btn-primary"
                  style={{ gap: 6 }}
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
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
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

        {/* VIEW 2: NOTE DETAIL READER / EDITOR */}
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
