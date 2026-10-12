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
  ArrowDownRight, 
  Search, 
  Plus, 
  FileText, 
  LayoutGrid, 
  Layers
} from 'lucide-react';
import { calculateBacklinks, calculateForwardLinks, findItemByTitle } from '../utils/wikiLinks';
import { selectNotes } from '../utils/selectors';
import { PILLARS, NOTE_COLORS } from '../theme/tokens';
import { NotesAppView } from './notes/NotesAppView';

interface NotesViewProps {
  onEditTask: (item: Item) => void;
  onNewNote?: () => void;
}

const validTypes = ['note', 'idea', 'knowledge', 'reference', 'principle', 'journal'];

type NoteViewMode = 'app' | 'workspace' | 'board' | 'quick';

export const NotesView = ({ onEditTask, onNewNote }: NotesViewProps) => {
  const items = useStore(state => state.items);
  const trashItem = useStore(state => state.trashItem);
  const updateItem = useStore(state => state.updateItem);
  const showPrivate = useStore(state => state.showPrivate);

  const [viewMode, setViewMode] = useState<NoteViewMode>('app');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string>('all');
  const [activePillar, setActivePillar] = useState<string>('all');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

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

  // Selected note for Workspace view
  const currentWorkspaceNote = useMemo(() => {
    if (!selectedNoteId && filteredNotes.length > 0) {
      return filteredNotes[0];
    }
    return filteredNotes.find(n => n.id === selectedNoteId) || filteredNotes[0] || null;
  }, [selectedNoteId, filteredNotes]);

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
      {/* Top Header: Search & View Mode Switcher */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: "16px 20px", 
          display: "flex", 
          flexDirection: "column", 
          gap: 14,
          background: "var(--bg-surface)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          {/* Search bar */}
          <div style={{ position: "relative", flex: 1, minWidth: 240, maxWidth: 440 }}>
            <Search size={15} color="var(--text-tertiary)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search all notes, ideas, knowledge, tags..."
              className="ui-input"
              style={{ width: "100%", paddingLeft: 36, paddingRight: 12, height: 38, fontSize: 13 }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* View Mode Switcher: Cards Grid / Workspace / Board / List */}
            <div className="segmented-nav">
              <button 
                onClick={() => setViewMode('app')}
                className={`segmented-nav-btn ${viewMode === 'app' ? 'active' : ''}`}
                title="Notes Card Grid"
              >
                <LayoutGrid size={13} color={viewMode === 'app' ? 'var(--text-primary)' : 'inherit'} />
                <span>Cards</span>
              </button>
              <button 
                onClick={() => setViewMode('workspace')}
                className={`segmented-nav-btn ${viewMode === 'workspace' ? 'active' : ''}`}
                title="Knowledge Workspace"
              >
                <FileText size={13} />
                <span>Workspace</span>
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

            {onNewNote && (
              <button 
                onClick={onNewNote}
                className="btn-primary"
                style={{ gap: 6, padding: "8px 14px", fontSize: 13 }}
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>New Note</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills Bar: Pillars & Tags (shown in Workspace / Board / Quick modes) */}
        {viewMode !== 'app' && (
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
      </div>

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
                  background: isPinned ? "rgba(245,158,11,0.03)" : "rgba(16, 19, 28, 0.75)",
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

      {/* MODE 2: Knowledge Workspace (Notion style structured hierarchy & rich reader) */}
      {viewMode === 'workspace' && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {/* Left Column: Outline Tree */}
          <div className="glass-panel" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10, maxHeight: "72vh", overflowY: "auto" }}>
            <span className="text-label" style={{ fontSize: 10 }}>Knowledge Hierarchy</span>

            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {filteredNotes.map(note => {
                const isSelected = currentWorkspaceNote?.id === note.id;
                const pObj = PILLARS.find(p => p.id === note.pillar);

                return (
                  <button 
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      padding: "8px 10px", 
                      borderRadius: 7, 
                      background: isSelected ? "rgba(255,255,255,0.08)" : "transparent", 
                      border: "none", 
                      cursor: "pointer", 
                      textAlign: "left",
                      color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                      transition: "all 0.12s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                      <FileText size={13} color={pObj ? pObj.color : "var(--text-tertiary)"} />
                      <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 450, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {note.title}
                      </span>
                    </div>
                    {pObj && (
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: pObj.color, flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Full Markdown Reader / Editor Preview */}
          <div className="glass-panel" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, minHeight: 400 }}>
            {currentWorkspaceNote ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 14 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.015em" }}>
                      {currentWorkspaceNote.title}
                    </h2>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                      {PILLARS.find(p => p.id === currentWorkspaceNote.pillar) && (
                        <span className="ui-pill" style={{ fontSize: 10 }}>
                          {PILLARS.find(p => p.id === currentWorkspaceNote.pillar)?.name}
                        </span>
                      )}
                      <span className="text-meta" style={{ fontSize: 11 }}>
                        Updated {new Date(currentWorkspaceNote.updatedAt).toLocaleDateString()}
                      </span>
                      {currentWorkspaceNote.tags?.map(t => (
                        <span key={t} className="text-meta" style={{ fontSize: 11, color: "var(--accent-hover)" }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => onEditTask(currentWorkspaceNote)} 
                    className="btn-secondary" 
                    style={{ fontSize: 12, gap: 5, padding: "6px 12px" }}
                  >
                    <Edit3 size={13} />
                    <span>Edit Page</span>
                  </button>
                </div>

                {/* Markdown Rendered Body */}
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)", minHeight: 160 }}>
                  {currentWorkspaceNote.body ? (
                    renderWikiLinksMarkdown(currentWorkspaceNote.body)
                  ) : (
                    <span style={{ color: "var(--text-tertiary)", fontStyle: "italic" }}>
                      No content in this document. Click &ldquo;Edit Page&rdquo; to write Markdown or link notes with [[Note Title]].
                    </span>
                  )}
                </div>

                {/* Bi-directional Backlinks & Outbound Links */}
                <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Backlinks */}
                  {(() => {
                    const backlinks = calculateBacklinks(activeVisibleItems, currentWorkspaceNote.title);
                    const forwardLinks = calculateForwardLinks(activeVisibleItems, currentWorkspaceNote.body || '');

                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                        <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
                          <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                            <ArrowDownRight size={12} color="#10b981" />
                            <span>Referenced By ({backlinks.length})</span>
                          </div>
                          {backlinks.length > 0 ? (
                            backlinks.map(b => (
                              <button key={b.id} onClick={() => onEditTask(b)} className="btn-ghost" style={{ fontSize: 11.5, padding: "2px 4px", color: "var(--accent-hover)" }}>
                                • {b.title}
                              </button>
                            ))
                          ) : (
                            <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>No inbound backlinks</span>
                          )}
                        </div>

                        <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
                          <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                            <ArrowUpRight size={12} color="#3b82f6" />
                            <span>Outbound Links ({forwardLinks.length})</span>
                          </div>
                          {forwardLinks.length > 0 ? (
                            forwardLinks.map(f => (
                              <button key={f.title} onClick={() => f.item && onEditTask(f.item)} className="btn-ghost" style={{ fontSize: 11.5, padding: "2px 4px", color: f.item ? "var(--accent-hover)" : "var(--text-tertiary)" }}>
                                • [[{f.title}]]
                              </button>
                            ))
                          ) : (
                            <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>No outbound links</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)" }}>
                Select a document from the hierarchy to read and navigate.
              </div>
            )}
          </div>
        </div>
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
