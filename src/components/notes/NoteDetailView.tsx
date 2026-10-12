import React, { useState } from 'react';
import type { Item } from '../../types';
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
  Sparkles,
  MessageSquare,
  Bold,
  RotateCcw,
  Crop,
  Trash2
} from 'lucide-react';
import { AudioMemoPlayer } from './AudioMemoPlayer';
import { FormattingTraySheet } from './FormattingTraySheet';
import { NoteOptionsSheet } from './NoteOptionsSheet';

interface NoteDetailViewProps {
  note: Item;
  onBack: () => void;
  onUpdateNote: (updates: Partial<Item>) => void;
  onDeleteNote: () => void;
  onDuplicateNote: () => void;
  onOpenDraw: () => void;
}

export const NoteDetailView: React.FC<NoteDetailViewProps> = ({
  note,
  onBack,
  onUpdateNote,
  onDeleteNote,
  onDuplicateNote,
  onOpenDraw
}) => {
  const [title, setTitle] = useState(note.title);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [showFormattingSheet, setShowFormattingSheet] = useState(false);
  const [activeHighlightColor, setActiveHighlightColor] = useState('#ede9fe'); // Soft purple
  const [showContextPill, setShowContextPill] = useState(false);
  const [contextPillPos, setContextPillPos] = useState({ top: 0, left: 0 });

  // Initial checklists if not set
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
    return [
      { id: '1', text: 'Review key objectives and goals for the day', done: true },
      { id: '2', text: 'Coordinate with team on release milestones', done: false },
      { id: '3', text: 'Synthesize user feedback and design impressions', done: false }
    ];
  });

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onUpdateNote({ title: newTitle });
  };

  const toggleChecklist = (id: string) => {
    const updated = checklists.map(c => c.id === id ? { ...c, done: !c.done } : c);
    setChecklists(updated);
    onUpdateNote({ checklists: updated });
  };

  const addChecklistItem = (section?: string) => {
    const newItem = {
      id: String(Date.now()),
      text: 'New checklist task',
      done: false,
      section: section || (checklists[checklists.length - 1]?.section)
    };
    const updated = [...checklists, newItem];
    setChecklists(updated);
    onUpdateNote({ checklists: updated });
  };

  const formattedDate = new Date(note.createdAt || 0).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Check if note is Steve Jobs Inspiration Quote note
  const isQuoteNote = note.quoteAuthor || note.title.toLowerCase().includes('steve jobs') || note.title.toLowerCase().includes('inspiration');

  // Text selection listener for Floating Context Pill (media_1791719352272.png)
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setContextPillPos({
        top: Math.max(10, rect.top - 52),
        left: rect.left + rect.width / 2
      });
      setShowContextPill(true);
    } else {
      setShowContextPill(false);
    }
  };

  return (
    <div 
      onMouseUp={handleMouseUp}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100%',
        background: 'var(--bg-surface)',
        borderRadius: 24,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-md)',
        color: 'var(--text-primary)'
      }}
    >
      {/* Top Header matching media_1791719347257.png & media_1791719363063.png */}
      <div 
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 20
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
          title="Back to My Notes"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Center: Note Category & Timestamp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {note.category && (
            <span 
              className="ui-pill"
              style={{ fontSize: 11, padding: '2px 8px', fontWeight: 600, background: 'var(--bg-surface-elevated)' }}
            >
              {note.category}
            </span>
          )}
          <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
            {formattedDate}
          </span>
        </div>

        {/* Right side: Done Checkmark Button + More Options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--bg-base)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
            }}
            title="Save & Done"
          >
            <Check size={18} strokeWidth={2.5} />
          </button>

          <button
            type="button"
            onClick={() => setShowOptionsSheet(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
            title="Note Options"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ padding: '22px 24px 100px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1, overflowY: 'auto' }}>
        
        {/* Cover Photo / Thumbnail if present */}
        {note.thumbnailUrl && (
          <div style={{ width: '100%', maxHeight: 220, borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}>
            <img 
              src={note.thumbnailUrl} 
              alt={note.title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
            />
          </div>
        )}

        {/* Note Title & Metadata Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{note.category || 'Work'}</span>
            <span>|</span>
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Audio Memo Player (if note has audio or to-do launch note) */}
        {(note.hasAudio || note.title.toLowerCase().includes('preparations') || note.title.toLowerCase().includes('launch')) && (
          <AudioMemoPlayer initialDuration={note.audioDuration || '05:47'} />
        )}

        {/* Introductory Rich Text with Inline Highlighter Pills */}
        <div style={{ fontSize: 14.5, lineHeight: 1.65, color: '#334155' }}>
          {note.body ? (
            <p style={{ margin: 0 }}>{note.body}</p>
          ) : (
            <p style={{ margin: 0 }}>
              In this exploration, I delve into the concept and design of a user-friendly, functional, and intuitive notes and reminder app. The app is designed to help users organize their{' '}
              <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '1px 6px', borderRadius: 4, fontWeight: 550 }}>daily activities</span>, jot down important ideas, and manage reminders efficiently.
            </p>
          )}

          <p style={{ marginTop: 12 }}>
            The main focus is to create a{' '}
            <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>simple yet engaging</span>{' '}
            interface, making it easy for users to stay productive and organized.
          </p>
        </div>

        {/* Steve Jobs Quote Block & Image Widget (media_1791719356647.png) */}
        {isQuoteNote && (
          <div 
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 20,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            {/* Quote text */}
            <div style={{ fontSize: 15, fontStyle: 'italic', lineHeight: 1.6, color: '#1e293b', position: 'relative' }}>
              <span style={{ fontSize: 28, color: '#94a3b8', lineHeight: 0, verticalAlign: 'middle', marginRight: 4 }}>“</span>
              I'm convinced that about half of what separates the successful entrepreneurs from the non-successful ones is pure{' '}
              <span style={{ border: '2px solid #f59e0b', borderRadius: 9999, padding: '1px 8px', fontStyle: 'normal', fontWeight: 600, color: '#b45309' }}>
                perseverance
              </span>
            </div>

            {/* Author Portrait with Doodle Sticker Annotation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80" 
                  alt="Steve Jobs" 
                  style={{ width: 100, height: 100, borderRadius: 16, objectFit: 'cover', filter: 'grayscale(100%)', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                />
                
                {/* Lightbulb Doodle with Bounding Box handles */}
                <div 
                  style={{
                    position: 'absolute',
                    top: -16,
                    right: -16,
                    padding: '4px 6px',
                    borderRadius: 8,
                    background: '#ffffff',
                    border: '1.5px dashed #2563eb',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Sparkles size={16} color="#eab308" />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 9999, background: '#ede9fe', color: '#7c3aed', width: 'fit-content' }}>
                  Steve Jobs
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>Founder & Visionary, Apple</span>
              </div>
            </div>

            {/* Image Toolbar matching media_1791719356647.png */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', paddingTop: 10, borderTop: '1px solid #e2e8f0', color: '#64748b' }}>
              <button type="button" className="btn-ghost" style={{ padding: 6 }} title="Adjust Color"><PenTool size={16} /></button>
              <button type="button" className="btn-ghost" style={{ padding: 6 }} title="Crop"><Crop size={16} /></button>
              <button type="button" className="btn-ghost" style={{ padding: 6 }} title="Rotate"><RotateCcw size={16} /></button>
              <button type="button" className="btn-ghost" style={{ padding: 6, color: '#ef4444' }} title="Delete Photo"><Trash2 size={16} /></button>
            </div>
          </div>
        )}

        {/* Callout Card (media_1791719352272.png) */}
        <div 
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #8b5cf6',
            borderRadius: 14,
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Simple yet Engaging</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#64748b' }}>
            The design philosophy of creating an interface that is both straightforward and easy to use, while also visually appealing and interactive, ensuring a positive user experience without overwhelming the user.
          </div>
        </div>

        {/* Interactive Checklist Sections (media_1791719363063.png) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {['1. Venue and Decor', '2. Technology and AV Equipment'].map(secName => {
            const secItems = checklists.filter(c => c.section === secName || (!c.section && secName === '1. Venue and Decor'));
            if (secItems.length === 0) return null;

            return (
              <div key={secName} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{secName}</span>
                  <button
                    type="button"
                    onClick={() => addChecklistItem(secName)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ea580c', display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600 }}
                  >
                    <Plus size={13} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {secItems.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => toggleChecklist(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '6px 8px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'background 0.12s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Circular Custom Checkbox matching media_1791719363063.png */}
                      <div 
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: item.done ? '#0f172a' : '#ffffff',
                          border: item.done ? '2px solid #0f172a' : '2px solid #cbd5e1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.12s ease'
                        }}
                      >
                        {item.done && <Check size={12} color="#ffffff" strokeWidth={3} />}
                      </div>

                      <span 
                        style={{
                          fontSize: 13.5,
                          color: item.done ? '#94a3b8' : '#334155',
                          textDecoration: item.done ? 'line-through' : 'none',
                          lineHeight: 1.4
                        }}
                      >
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hand-Drawn Sketch preview if note has drawingData */}
        {note.drawingData && (
          <div 
            onClick={onOpenDraw}
            style={{ 
              borderRadius: 16, 
              border: '1.5px dashed #cbd5e1', 
              padding: 12, 
              cursor: 'pointer',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}
          >
            <img src={note.drawingData} alt="Sketch" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>✏️ Tap to edit drawing</span>
          </div>
        )}
      </div>

      {/* Floating Context Highlight Selection Pill (media_1791719352272.png) */}
      {showContextPill && (
        <div
          style={{
            position: 'fixed',
            top: contextPillPos.top,
            left: contextPillPos.left,
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '6px 14px',
            borderRadius: 9999,
            background: '#191d28',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            zIndex: 90,
            animation: 'fadeIn 0.12s ease'
          }}
        >
          <PenTool size={14} color="#ffffff" />
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#8b5cf6' }} />
          <MessageSquare size={14} color="#ffffff" />
          <Bold size={14} color="#ffffff" />
        </div>
      )}

      {/* Floating Bottom Tool Dock matching media_1791719347257.png */}
      <div 
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '10px 22px',
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
          <PenTool size={20} />
        </button>

        {/* 2. Checklist */}
        <button
          type="button"
          onClick={() => addChecklistItem()}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', padding: 4 }}
          title="Add Checklist"
        >
          <CheckSquare size={20} />
        </button>

        {/* 3. Callout / Card */}
        <button
          type="button"
          onClick={() => setShowFormattingSheet(true)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', padding: 4 }}
          title="Insert Callout Card"
        >
          <CreditCard size={20} />
        </button>

        {/* 4. Typography / Formatting */}
        <button
          type="button"
          onClick={() => setShowFormattingSheet(true)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', padding: 4 }}
          title="Rich Text Formatting"
        >
          <Type size={20} />
        </button>

        {/* 5. More Options */}
        <button
          type="button"
          onClick={() => setShowOptionsSheet(true)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', padding: 4 }}
          title="Note Settings & Options"
        >
          <SlidersHorizontal size={20} />
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
