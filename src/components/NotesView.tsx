import { useMemo, useState } from 'react';
import { useStore } from '../store';
import type { Item, NoteColorId } from '../types';
import ReactMarkdown from 'react-markdown';
import { 
  Edit3, 
  Trash2, 
  Pin, 
  Tag, 
  Lock, 
  ArrowUpRight, 
  Search, 
  Plus, 
  FileText, 
  LayoutGrid, 
  Layers
} from 'lucide-react';
import { findItemByTitle } from '../utils/wikiLinks';
import { selectNotes } from '../utils/selectors';
import { PILLARS, NOTE_COLORS } from '../theme/tokens';
import { NotesAppView } from './notes/NotesAppView';
import { NotesWorkspace } from './notes/NotesWorkspace';

interface NotesViewProps {
  onEditTask: (item: Item) => void;
  onNewNote?: () => void;
}

const validTypes = ['note', 'idea', 'knowledge', 'reference', 'principle', 'journal'];

type NoteViewMode = 'workspace' | 'app' | 'board' | 'quick';

export const NotesView = ({ onEditTask, onNewNote }: NotesViewProps) => {
  const items = useStore(state => state.items);
  const trashItem = useStore(state => state.trashItem);
  const updateItem = useStore(state => state.updateItem);
  const showPrivate = useStore(state => state.showPrivate);

  const [viewMode, setViewMode] = useState<NoteViewMode>('workspace');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string>('all');
  const [activePillar, setActivePillar] = useState<string>('all');

  const notes = useMemo(() => {
    return selectNotes(items, validTypes, showPrivate);
  }, [items, showPrivate]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(n => n.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [notes]);

  const activeVisibleItems = useMemo(() => {
    return items.filter(i => !i.deletedAt && !i.isArchived && (showPrivate || !i.isPrivate));
  }, [items, showPrivate]);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    let result = notes;
    if (activeTag !== 'all') {
      result = result.filter(n => n.tags?.includes(activeTag));
    }
    if (activePillar !== 'all') {
      result = result.filter(n => n.pillar === activePillar);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.title.toLowerCase().includes(q) || 
        (n.body && n.body.toLowerCase().includes(q)) ||
        (n.tags && n.tags.some(t => t.toLowerCase().includes(q))) ||
        (n.category && n.category.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, activeTag, activePillar, searchQuery]);

  const handleTogglePin = (note: Item) => {
    updateItem(note.id, { pinned: !note.pinned });
  };

  const handleSetColor = (note: Item, colorId: NoteColorId) => {
    updateItem(note.id, { color: colorId });
  };

  const getColorStyles = (colorId?: string) => {
    const c = NOTE_COLORS.find(col => col.id === colorId);
    return c ? { background: c.bg, border: `1px solid ${c.border}` } : { background: "var(--bg-surface)", border: "1px solid var(--border-default)" };
  };

  const renderWikiLinksMarkdown = (content: string) => {
    return (
      <ReactMarkdown
        components={{
          a: ({ href, children }) => {
            if (href && href.startsWith('#wiki:')) {
              const targetTitle = decodeURIComponent(href.replace('#wiki:', ''));
              const targetItem = findItemByTitle(activeVisibleItems, targetTitle);
              const isResolved = !!targetItem;
              return (
                <button
                  type="button"
                  onClick={() => {
                    if (targetItem) onEditTask(targetItem);
                  }}
                  className={`ui-pill ${!isResolved ? 'unresolved' : ''}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    verticalAlign: 'baseline',
                    margin: '0 2px',
                    padding: '2px 7px',
                    fontSize: '11px',
                    fontWeight: 550,
                    cursor: isResolved ? 'pointer' : 'default',
                    background: isResolved ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                    borderColor: isResolved ? 'rgba(59,130,246,0.3)' : 'var(--border-subtle)',
                    color: isResolved ? 'var(--accent-hover)' : 'var(--text-tertiary)'
                  }}
                  title={isResolved ? `Open note: ${targetTitle}` : `Unresolved reference to [[${targetTitle}]]`}
                >
                  <span>[[{children}]]</span>
                  {isResolved && <ArrowUpRight size={10} />}
                </button>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-hover)", textDecoration: "underline" }}>
                {children}
              </a>
            );
          }
        }}
      >
        {content.replace(/\[\[(.*?)\]\]/g, '[$1](#wiki:$1)')}
      </ReactMarkdown>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Top Header: View Mode Switcher */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: "10px 18px", 
          display: "flex", 
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          background: "var(--bg-surface)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="segmented-nav">
            <button 
              onClick={() => setViewMode('workspace')}
              className={`segmented-nav-btn ${viewMode === 'workspace' ? 'active' : ''}`}
              title="Modern 3-Panel Workspace (Apple Notes + Notion + Obsidian)"
            >
              <FileText size={13} />
              <span>Workspace</span>
            </button>
            <button 
              onClick={() => setViewMode('app')}
              className={`segmented-nav-btn ${viewMode === 'app' ? 'active' : ''}`}
              title="Notes Card Grid"
            >
              <LayoutGrid size={13} color={viewMode === 'app' ? 'var(--text-primary)' : 'inherit'} />
              <span>Cards</span>
            </button>
            <button 
              onClick={() => setViewMode('board')}
              className={`segmented-nav-btn ${viewMode === 'board' ? 'active' : ''}`}
              title="Kanban Board"
            >
              <Layers size={13} />
              <span>Board</span>
            </button>
            <button 
              onClick={() => setViewMode('quick')}
              className={`segmented-nav-btn ${viewMode === 'quick' ? 'active' : ''}`}
              title="Compact List"
            >
              <Layers size={13} />
              <span>List</span>
            </button>
          </div>
        </div>

        {/* Search & Actions for secondary views (Cards/Board/List) */}
        {viewMode !== 'workspace' && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, justifyContent: "flex-end", maxWidth: 440 }}>
            <div style={{ position: "relative", width: "100%" }}>
              <Search size={14} color="var(--text-tertiary)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search notes, tags..."
                className="ui-input"
                style={{ width: "100%", paddingLeft: 32, paddingRight: 10, height: 32, fontSize: 12.5 }}
              />
            </div>

            {onNewNote && (
              <button 
                onClick={onNewNote}
                className="btn-primary"
                style={{ gap: 6, padding: "6px 12px", fontSize: 12.5, whiteSpace: "nowrap" }}
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>New Note</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Pills Bar: Pillars & Tags (only shown in Board/Quick modes) */}
      {(viewMode === 'board' || viewMode === 'quick') && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
            {/* Pillar selector chips */}
            <button 
              onClick={() => setActivePillar('all')}
              style={{ 
                padding: "4px 10px", 
                borderRadius: 9999, 
                background: activePillar === 'all' ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)", 
                color: activePillar === 'all' ? "#fff" : "var(--text-secondary)", 
                border: `1px solid ${activePillar === 'all' ? "rgba(255,255,255,0.25)" : "var(--border-subtle)"}`, 
                fontSize: 11.5,
                fontWeight: activePillar === 'all' ? 600 : 450,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              All Pillars
            </button>
            {PILLARS.map(p => {
              const isSel = activePillar === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePillar(isSel ? 'all' : p.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 9999,
                    background: isSel ? p.bg : "rgba(255,255,255,0.03)",
                    color: isSel ? p.color : "var(--text-secondary)",
                    border: `1px solid ${isSel ? p.border : "var(--border-subtle)"}`,
                    fontSize: 11.5,
                    fontWeight: isSel ? 600 : 450,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color }} />
                  <span>{p.name}</span>
                </button>
              );
            })}

            <div style={{ width: 1, height: 16, background: "var(--border-subtle)", margin: "0 4px" }} />

            {/* Tag filter chips */}
            <button 
              onClick={() => setActiveTag('all')}
              style={{ 
                padding: "4px 10px", 
                borderRadius: 9999, 
                background: activeTag === 'all' ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)", 
                color: activeTag === 'all' ? "#fff" : "var(--text-secondary)", 
                border: `1px solid ${activeTag === 'all' ? "rgba(255,255,255,0.25)" : "var(--border-subtle)"}`, 
                fontSize: 11.5,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              All Tags
            </button>
            {allTags.map(tag => {
              const isSel = activeTag === tag;
              return (
                <button 
                  key={tag} 
                  onClick={() => setActiveTag(isSel ? 'all' : tag)}
                  style={{ 
                    padding: "4px 10px", 
                    borderRadius: 9999, 
                    background: isSel ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.03)", 
                    color: isSel ? "#10b981" : "var(--text-secondary)", 
                    border: `1px solid ${isSel ? "rgba(16,185,129,0.4)" : "var(--border-subtle)"}`, 
                    fontSize: 11.5,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  <Tag size={10} />
                  <span>#{tag}</span>
                </button>
              );
            })}
          </div>
        )}

      {/* MODE 1: Notes Card Grid */}
      {viewMode === 'app' && (
        <NotesAppView searchQuery={searchQuery} onNewNote={onNewNote} />
      )}

      {/* MODE 1: Quick Notes (Xiaomi style clean readable mobile-first list) */}
      {viewMode === 'quick' && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredNotes.map(note => {
            const pObj = PILLARS.find(p => p.id === note.pillar);
            const isPinned = !!note.pinned;

            return (
              <div 
                key={note.id}
                onClick={() => onEditTask(note)}
                className="glass-panel"
                style={{ 
                  padding: "14px 18px", 
                  display: "flex", 
                  alignItems: "flex-start", 
                  justifyContent: "space-between", 
                  gap: 14, 
                  cursor: "pointer",
                  borderLeft: pObj ? `3px solid ${pObj.color}` : "3px solid var(--border-strong)",
                  background: isPinned ? "rgba(245,158,11,0.06)" : "var(--bg-surface)",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {isPinned && <Pin size={12} color="#f59e0b" fill="#f59e0b" />}
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)" }}>{note.title}</span>
                    {note.isPrivate && <Lock size={12} color="#f43f5e" />}
                  </div>

                  {note.body && (
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.45, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {note.body.slice(0, 140)}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                    {pObj && (
                      <span className="ui-pill" style={{ color: pObj.color, borderColor: pObj.border, background: pObj.bg, fontSize: 10 }}>
                        {pObj.name}
                      </span>
                    )}
                    <span className="text-meta" style={{ fontSize: 11 }}>
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                    {note.tags?.map(t => (
                      <span key={t} className="text-meta" style={{ fontSize: 11, color: "var(--accent-hover)" }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => handleTogglePin(note)} 
                    className="btn-ghost" 
                    style={{ padding: 6, color: isPinned ? "#f59e0b" : "var(--text-tertiary)" }}
                    title={isPinned ? "Unpin note" : "Pin note to top"}
                  >
                    <Pin size={13} fill={isPinned ? "#f59e0b" : "none"} />
                  </button>
                  <button 
                    onClick={() => onEditTask(note)} 
                    className="btn-ghost" 
                    style={{ padding: 6, color: "var(--text-secondary)" }}
                    title="Edit Note"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button 
                    onClick={() => trashItem(note.id)} 
                    className="btn-ghost" 
                    style={{ padding: 6, color: "var(--text-tertiary)" }}
                    title="Move to Trash"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredNotes.length === 0 && (
            <div className="glass-panel" style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
              No notes found. Capture a quick thought or idea with &ldquo;New Note&rdquo;.
            </div>
          )}
        </div>
      )}

      {/* MODE 1: Modern 3-Panel Notes Workspace */}
      {viewMode === 'workspace' && (
        <NotesWorkspace onOpenGlobalCapture={onNewNote} />
      )}

      {/* MODE 3: Visual Note Board (Google Keep style pinned multi-column cards & color accents) */}
      {viewMode === 'board' && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
          {filteredNotes.map(note => {
            const isPinned = !!note.pinned;
            const colorStyles = getColorStyles(note.color);

            return (
              <div 
                key={note.id}
                className="glass-panel"
                style={{ 
                  ...colorStyles,
                  borderRadius: 12, 
                  padding: 16, 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: 10,
                  boxShadow: isPinned ? "0 4px 16px rgba(245,158,11,0.12)" : "var(--shadow-sm)"
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{note.title}</span>
                  </div>
                  <button 
                    onClick={() => handleTogglePin(note)} 
                    className="btn-ghost" 
                    style={{ padding: 4, color: isPinned ? "#f59e0b" : "var(--text-tertiary)" }}
                    title={isPinned ? "Unpin" : "Pin note"}
                  >
                    <Pin size={13} fill={isPinned ? "#f59e0b" : "none"} />
                  </button>
                </div>

                {/* Content snippet */}
                {note.body && (
                  <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-secondary)", maxHeight: 120, overflowY: "auto" }}>
                    {renderWikiLinksMarkdown(note.body)}
                  </div>
                )}

                {/* Footer Controls: Colors & Actions */}
                <div style={{ marginTop: "auto", paddingTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)" }}>
                  {/* Note color picker dots */}
                  <div style={{ display: "flex", gap: 4 }}>
                    {NOTE_COLORS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleSetColor(note, c.id as NoteColorId)}
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: c.id === 'default' ? 'rgba(255,255,255,0.2)' : c.bg,
                          border: `1px solid ${note.color === c.id ? '#fff' : c.border}`,
                          cursor: "pointer",
                          padding: 0
                        }}
                        title={c.label}
                      />
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <button onClick={() => onEditTask(note)} className="btn-ghost" style={{ padding: 4 }} title="Edit">
                      <Edit3 size={13} />
                    </button>
                    <button onClick={() => trashItem(note.id)} className="btn-ghost" style={{ padding: 4 }} title="Move to Trash">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
