import React, { useState } from 'react';
import type { Item, NoteColorId } from '../../types';
import { 
  Image as ImageIcon, 
  Mic, 
  Share2, 
  Pin, 
  Tag, 
  Copy, 
  Lock, 
  Unlock, 
  Trash2, 
  Check, 
  ChevronRight,
  Palette
} from 'lucide-react';
import { NOTE_COLOR_PALETTES } from './noteTheme';

interface NoteOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  note: Item;
  onUpdateNote: (updates: Partial<Item>) => void;
  onDeleteNote: () => void;
  onDuplicateNote: () => void;
}

export const NoteOptionsSheet: React.FC<NoteOptionsSheetProps> = ({
  isOpen,
  onClose,
  note,
  onUpdateNote,
  onDeleteNote,
  onDuplicateNote
}) => {
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const LABELS = ['Personal', 'Work', 'Kajian Rutin', 'Ideas', 'Quotes', 'Study'];

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${note.title}\n\n${note.body || ''}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleTogglePin = () => {
    onUpdateNote({ pinned: !note.pinned });
  };

  const handleToggleLock = () => {
    onUpdateNote({ isLocked: !note.isLocked, isPrivate: !note.isLocked });
  };

  const handleAddSampleImage = () => {
    onUpdateNote({ 
      thumbnailUrl: note.thumbnailUrl 
        ? undefined 
        : 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80' 
    });
    onClose();
  };

  const handleToggleVoice = () => {
    onUpdateNote({ hasAudio: !note.hasAudio, audioDuration: '05:47' });
    onClose();
  };

  const lastEditedFormatted = new Date(note.updatedAt || 0).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        pointerEvents: 'none'
      }}
    >
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          pointerEvents: 'auto',
          animation: 'fadeIn 0.2s ease'
        }}
      />

      {/* Action Sheet Modal */}
      <div
        style={{
          position: 'relative',
          background: 'var(--bg-surface)',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: '16px 20px 24px',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--border-default)',
          borderBottom: 'none',
          zIndex: 111,
          pointerEvents: 'auto',
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          animation: 'slideUp 0.24s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
          <div style={{ width: 44, height: 4.5, borderRadius: 9999, background: 'var(--border-strong)' }} />
        </div>

        {/* Top 3 Quick Action Tiles [Image, Voice, Share] */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {/* Tile 1: Image */}
          <button
            type="button"
            onClick={handleAddSampleImage}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '14px 10px',
              borderRadius: 16,
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'all 0.12s ease'
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <ImageIcon size={18} color="var(--text-primary)" />
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{note.thumbnailUrl ? 'Remove Img' : 'Image'}</span>
          </button>

          {/* Tile 2: Voice */}
          <button
            type="button"
            onClick={handleToggleVoice}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '14px 10px',
              borderRadius: 16,
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'all 0.12s ease'
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <Mic size={18} color={note.hasAudio ? 'var(--accent-warm)' : 'var(--text-primary)'} />
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{note.hasAudio ? 'Remove Voice' : 'Voice'}</span>
          </button>

          {/* Tile 3: Share */}
          <button
            type="button"
            onClick={handleShare}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '14px 10px',
              borderRadius: 16,
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'all 0.12s ease'
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
              {copiedLink ? <Check size={18} color="#10b981" /> : <Share2 size={18} color="var(--text-primary)" />}
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>
        </div>

        {/* Action List */}
        <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
          {/* Keep Color Picker Option */}
          <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setShowColorPicker(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'var(--bg-surface)',
                border: 'none',
                width: '100%',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Palette size={16} color="var(--accent-primary)" />
                <span style={{ fontSize: 13.5, fontWeight: 550 }}>Note Color (Google Keep)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 12.5 }}>
                <span>{NOTE_COLOR_PALETTES[note.color || 'default']?.label || 'Default'}</span>
                <ChevronRight size={14} />
              </div>
            </button>
            {showColorPicker && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px 12px', background: 'var(--bg-surface-elevated)', overflowX: 'auto' }}>
                {Object.values(NOTE_COLOR_PALETTES).map(p => {
                  const isSelected = (note.color || 'default') === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onUpdateNote({ color: p.id === 'default' ? undefined : (p.id as NoteColorId) });
                        setShowColorPicker(false);
                      }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: p.dotColor,
                        border: isSelected ? '2.5px solid var(--text-primary)' : '1px solid var(--border-default)',
                        cursor: 'pointer',
                        transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                        boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
                        transition: 'transform 0.12s ease',
                        flexShrink: 0
                      }}
                      title={p.label}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Pin */}
          <button
            type="button"
            onClick={handleTogglePin}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: 'var(--bg-surface)',
              border: 'none',
              borderBottom: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Pin size={16} color={note.pinned ? 'var(--accent-warm)' : 'var(--text-secondary)'} fill={note.pinned ? 'var(--accent-warm)' : 'none'} />
              <span style={{ fontSize: 13.5, fontWeight: 550 }}>{note.pinned ? 'Unpin Note' : 'Pin to Top'}</span>
            </div>
            {note.pinned && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-warm)' }}>PINNED</span>}
          </button>

          {/* Category / Label */}
          <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setShowLabelPicker(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'var(--bg-surface)',
                border: 'none',
                width: '100%',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Tag size={16} color="var(--text-secondary)" />
                <span style={{ fontSize: 13.5, fontWeight: 550 }}>Category Label</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 12.5 }}>
                <span>{note.category || 'Personal'}</span>
                <ChevronRight size={14} />
              </div>
            </button>
            {showLabelPicker && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 14px 12px', background: 'var(--bg-surface-elevated)' }}>
                {LABELS.map(lbl => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => {
                      onUpdateNote({ category: lbl });
                      setShowLabelPicker(false);
                    }}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 9999,
                      background: note.category === lbl ? 'var(--accent-primary)' : 'var(--bg-surface)',
                      color: note.category === lbl ? 'var(--bg-base)' : 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Make a Copy */}
          <button
            type="button"
            onClick={() => {
              onDuplicateNote();
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: 'var(--bg-surface)',
              border: 'none',
              borderBottom: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Copy size={16} color="var(--text-secondary)" />
              <span style={{ fontSize: 13.5, fontWeight: 550 }}>Make a Duplicate</span>
            </div>
          </button>

          {/* Lock Note */}
          <button
            type="button"
            onClick={handleToggleLock}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: 'var(--bg-surface)',
              border: 'none',
              borderBottom: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {note.isLocked ? <Unlock size={16} color="var(--text-secondary)" /> : <Lock size={16} color="var(--text-secondary)" />}
              <span style={{ fontSize: 13.5, fontWeight: 550 }}>{note.isLocked ? 'Unlock Note' : 'Lock Note (Private)'}</span>
            </div>
          </button>

          {/* Delete Note */}
          <button
            type="button"
            onClick={() => {
              onDeleteNote();
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: 'var(--bg-surface)',
              border: 'none',
              cursor: 'pointer',
              color: '#ef4444'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Trash2 size={16} color="#ef4444" />
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>Delete Note</span>
            </div>
          </button>
        </div>

        {/* Footer: Last edited info */}
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '-0.01em', marginTop: -4 }}>
          Last modified on {lastEditedFormatted}
        </div>
      </div>
    </div>
  );
};
