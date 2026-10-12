import React from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  Quote, 
  Indent, 
  Outdent, 
  Table, 
  MessageSquare, 
  CreditCard,
  PenTool,
  X
} from 'lucide-react';

interface FormattingTraySheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeColor: string;
  onSelectColor: (color: string) => void;
  onApplyFormat: (format: string, value?: string) => void;
}

export const FormattingTraySheet: React.FC<FormattingTraySheetProps> = ({
  isOpen,
  onClose,
  activeColor,
  onSelectColor,
  onApplyFormat
}) => {
  if (!isOpen) return null;

  const HIGHLIGHT_COLORS = [
    { id: 'yellow', hex: '#fef08a', border: '#eab308', label: 'Yellow' },
    { id: 'purple', hex: '#ede9fe', border: '#8b5cf6', label: 'Purple' },
    { id: 'green', hex: '#bbf7d0', border: '#22c55e', label: 'Green' },
    { id: 'orange', hex: '#fed7aa', border: '#f97316', label: 'Orange' },
  ];

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
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

      {/* Bottom Sheet Modal */}
      <div
        style={{
          position: 'relative',
          background: '#ffffff',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: '16px 20px 28px',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.16)',
          zIndex: 101,
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
        {/* Top Drag Handle Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
          <div style={{ width: 44, height: 4.5, borderRadius: 9999, background: '#e2e8f0' }} />
        </div>

        {/* Row 1: Highlighter & Color Swatches */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '4px 6px',
            background: '#f8fafc',
            borderRadius: 14,
            border: '1px solid #eef2f6'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 8, background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <PenTool size={14} color="#64748b" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Highlighter</span>
            </div>

            {/* Color Swatch Dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4 }}>
              {HIGHLIGHT_COLORS.map(c => {
                const isSelected = activeColor === c.hex;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelectColor(c.hex);
                      onApplyFormat('highlight', c.hex);
                    }}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: c.hex,
                      border: isSelected ? `2.5px solid ${c.border}` : '1px solid rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                      boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                      transition: 'transform 0.12s ease'
                    }}
                    title={c.label}
                  />
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={() => onApplyFormat('comment')}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
              title="Add Comment"
            >
              <MessageSquare size={14} />
            </button>
            <button
              type="button"
              onClick={() => onApplyFormat('callout')}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
              title="Insert Callout Card"
            >
              <CreditCard size={14} />
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#f1f5f9',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
              title="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Row 2: Basic Formatting [B, I, T, U, Bullet List, Numbered List] */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          {[
            { id: 'bold', label: 'B', Icon: Bold, isText: true },
            { id: 'italic', label: 'I', Icon: Italic, isText: true },
            { id: 'strikethrough', label: 'T', Icon: Strikethrough, isText: true },
            { id: 'underline', label: 'U', Icon: Underline, isText: true },
            { id: 'bulletList', Icon: List },
            { id: 'numberedList', Icon: ListOrdered },
          ].map(btn => (
            <button
              key={btn.id}
              type="button"
              onClick={() => onApplyFormat(btn.id)}
              style={{
                height: 42,
                borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
            >
              {btn.isText ? (
                <span style={{ 
                  fontFamily: btn.id === 'italic' ? 'serif' : 'var(--font-sans)',
                  fontStyle: btn.id === 'italic' ? 'italic' : 'normal',
                  textDecoration: btn.id === 'strikethrough' ? 'line-through' : btn.id === 'underline' ? 'underline' : 'none'
                }}>
                  {btn.label}
                </span>
              ) : (
                <btn.Icon size={16} />
              )}
            </button>
          ))}
        </div>

        {/* Row 3: Headings [H1, H2, H3, Outdent, Indent, Quote] */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          {[
            { id: 'h1', label: 'H1' },
            { id: 'h2', label: 'H2' },
            { id: 'h3', label: 'H3' },
            { id: 'outdent', Icon: Outdent },
            { id: 'indent', Icon: Indent },
            { id: 'quote', Icon: Quote },
          ].map(btn => (
            <button
              key={btn.id}
              type="button"
              onClick={() => onApplyFormat(btn.id)}
              style={{
                height: 42,
                borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
            >
              {btn.label ? (
                <span>{btn.label}</span>
              ) : btn.Icon ? (
                <btn.Icon size={16} />
              ) : null}
            </button>
          ))}
        </div>

        {/* Row 4: Alignment & Extra [Left, Center, Right, Justify, Table, Quote “ ”] */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          {[
            { id: 'alignLeft', Icon: AlignLeft },
            { id: 'alignCenter', Icon: AlignCenter },
            { id: 'alignRight', Icon: AlignRight },
            { id: 'alignJustify', Icon: AlignJustify },
            { id: 'table', Icon: Table },
            { id: 'quotes', label: '“ ”' },
          ].map(btn => (
            <button
              key={btn.id}
              type="button"
              onClick={() => onApplyFormat(btn.id)}
              style={{
                height: 42,
                borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
            >
              {btn.label ? (
                <span>{btn.label}</span>
              ) : btn.Icon ? (
                <btn.Icon size={16} />
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
