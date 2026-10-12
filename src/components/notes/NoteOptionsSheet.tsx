import React, { useState } from 'react';
import type { Item } from '../../types';
import { 
  Image as ImageIcon, 
  Mic, 
  Share2, 
  Pin, 
  Tag, 
  Send, 
  Copy, 
  Lock, 
  Unlock,
  Trash2, 
  Check,
  ChevronRight
} from 'lucide-react';

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
    // Books shelf sample photo from media_1791719347257.png
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
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          pointerEvents: 'auto',
          animation: 'fadeIn 0.2s ease'
        }}
      />

      {/* Action Sheet Modal */}
      <div
        style={{
          position: 'relative',
          background: '#ffffff',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: '16px 20px 24px',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.18)',
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
          <div style={{ width: 44, height: 4.5, borderRadius: 9999, background: '#e2e8f0' }} />
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
              padding: '16px 10px',
              borderRadius: 16,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              color: '#0f172a',
              transition: 'all 0.12s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
          >
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.06)' }}>
              <ImageIcon size={18} color="#0f172a" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{note.thumbnailUrl ? 'Remove Img' : 'Image'}</span>
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
              padding: '16px 10px',
              borderRadius: 16,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              color: '#0f172a',
              transition: 'all 0.12s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
          >
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.06)' }}>
              <Mic size={18} color={note.hasAudio ? '#ea580c' : '#0f172a'} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{note.hasAudio ? 'Remove Voice' : 'Voice'}</span>
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
              padding: '16px 10px',
              borderRadius: 16,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              color: '#0f172a',
              transition: 'all 0.12s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
          >
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.06)' }}>
              {copiedLink ? <Check size={18} color="#16a34a" /> : <Share2 size={18} color="#0f172a" />}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>
        </div>

        {/* Action List */}
        <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #f1f5f9', borderRadius: 16, overflow: 'hidden' }}>
          {/* Pin */}
          <button
            type="button"
            onClick={handleTogglePin}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: '#ffffff',
              border: 'none',
              borderBottom: '1px solid #f1f5f9',
              cursor: 'pointer',
              color: '#0f172a'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Pin size={16} color={note.pinned ? '#ea580c' : '#64748b'} fill={note.pinned ? '#ea580c' : 'none'} />
              <span style={{ fontSize: 14, fontWeight: 550 }}>{note.pinned ? 'Unpin Note' : 'Pin Note'}</span>
            </div>
          </button>

          {/* Add Thumbnail */}
          <button
            type="button"
            onClick={handleAddSampleImage}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: '#ffffff',
              border: 'none',
              borderBottom: '1px solid #f1f5f9',
              cursor: 'pointer',
              color: '#0f172a'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ImageIcon size={16} color="#64748b" />
              <span style={{ fontSize: 14, fontWeight: 550 }}>Add Thumbnail</span>
            </div>
            {note.thumbnailUrl && <Check size={14} color="#16a34a" />}
          </button>

          {/* Label */}
          <div style={{ borderBottom: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={() => setShowLabelPicker(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: '#ffffff',
                border: 'none',
                width: '100%',
                cursor: 'pointer',
                color: '#0f172a'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Tag size={16} color="#64748b" />
                <span style={{ fontSize: 14, fontWeight: 550 }}>Label</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13 }}>
                <span>{note.category || 'Work'}</span>
                <ChevronRight size={14} />
              </div>
            </button>
            {showLabelPicker && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '6px 14px 12px', background: '#f8fafc' }}>
                {LABELS.map(lbl => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => {
                      onUpdateNote({ category: lbl });
                      setShowLabelPicker(false);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 9999,
                      background: note.category === lbl ? '#0f172a' : '#ffffff',
                      color: note.category === lbl ? '#ffffff' : '#334155',
                      border: '1px solid #cbd5e1',
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

          {/* Send */}
          <button
            type="button"
            onClick={handleShare}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: '#ffffff',
              border: 'none',
              borderBottom: '1px solid #f1f5f9',
              cursor: 'pointer',
              color: '#0f172a'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Send size={16} color="#64748b" />
              <span style={{ fontSize: 14, fontWeight: 550 }}>Send</span>
            </div>
            <ChevronRight size={14} color="#64748b" />
          </button>

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
              background: '#ffffff',
              border: 'none',
              borderBottom: '1px solid #f1f5f9',
              cursor: 'pointer',
              color: '#0f172a'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Copy size={16} color="#64748b" />
              <span style={{ fontSize: 14, fontWeight: 550 }}>Make a Copy</span>
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
              background: '#ffffff',
              border: 'none',
              borderBottom: '1px solid #f1f5f9',
              cursor: 'pointer',
              color: '#0f172a'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {note.isLocked ? <Unlock size={16} color="#64748b" /> : <Lock size={16} color="#64748b" />}
              <span style={{ fontSize: 14, fontWeight: 550 }}>{note.isLocked ? 'Unlock Note' : 'Lock Note'}</span>
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
              background: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              color: '#ef4444'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Trash2 size={16} color="#ef4444" />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Delete Note</span>
            </div>
          </button>
        </div>

        {/* Footer: Last edited info */}
        <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', letterSpacing: '-0.01em', marginTop: -4 }}>
          Last Edited {lastEditedFormatted} By Harrison..
        </div>
      </div>
    </div>
  );
};
