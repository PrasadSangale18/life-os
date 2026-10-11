import { useMemo, useState } from 'react';
import { useStore } from '../store';
import type { Item } from '../types';
import ReactMarkdown from 'react-markdown';
import { Edit3, Trash2, Pin } from 'lucide-react';
import { calculateBacklinks } from '../utils/wikiLinks';
import { selectNotes } from '../utils/selectors';

interface NotesViewProps {
  onEditTask: (item: Item) => void;
}

const validTypes = ['note', 'idea', 'knowledge', 'reference', 'principle', 'journal'];

export const NotesView = ({ onEditTask }: NotesViewProps) => {
  const items = useStore(state => state.items);
  const trashItem = useStore(state => state.trashItem);
  const updateItem = useStore(state => state.updateItem);
  const removeTag = useStore(state => state.removeTag);
  const toggleItemPrivate = useStore(state => state.toggleItemPrivate);
  const showPrivate = useStore(state => state.showPrivate);
  const [activeTag, setActiveTag] = useState<string>('all');

  const notes = useMemo(() => {
    return selectNotes(items, validTypes, showPrivate);
  }, [items, showPrivate]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(n => n.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [notes]);

  const displayNotes = useMemo(() => {
    let filtered = notes;
    if (activeTag !== 'all') {
      filtered = filtered.filter(n => n.tags?.includes(activeTag));
    }
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.createdAt - a.createdAt;
    });
  }, [notes, activeTag]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          <button 
            onClick={() => setActiveTag('all')}
            style={{ padding: "4px 12px", borderRadius: 16, background: activeTag === 'all' ? "#fff" : "rgba(255,255,255,0.1)", color: activeTag === 'all' ? "#000" : "#fff", border: "none", cursor: "pointer", fontSize: 13 }}
          >
            All
          </button>
          {allTags.map(tag => (
            <button 
              key={tag}
              onClick={() => setActiveTag(tag)}
              style={{ padding: "4px 12px", borderRadius: 16, background: activeTag === tag ? "#00d97e" : "rgba(255,255,255,0.05)", color: activeTag === tag ? "#000" : "#a0a0c0", border: "none", cursor: "pointer", fontSize: 13 }}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {displayNotes.map(note => {
          const backlinks = calculateBacklinks(items.filter(i => showPrivate || !i.isPrivate), note.title);
          
          return (
            <div key={note.id} style={{ background: note.color || "rgba(0,0,0,0.4)", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 16, fontWeight: "bold", color: "#fff" }}>{note.title}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => updateItem(note.id, { pinned: !note.pinned })} style={{ background: "transparent", border: "none", color: note.pinned ? "#fbbf24" : "#606080", cursor: "pointer", padding: 4 }}><Pin size={14} fill={note.pinned ? "#fbbf24" : "none"} /></button>
                  <button onClick={() => onEditTask(note)} style={{ background: "transparent", border: "none", color: "#606080", cursor: "pointer", padding: 4 }}><Edit3 size={14} /></button>
                  <button onClick={() => trashItem(note.id)} style={{ background: "transparent", border: "none", color: "#606080", cursor: "pointer", padding: 4 }}><Trash2 size={14} /></button>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4, color: "#e0e0f0" }}>{note.type}</span>
                {note.tags?.map(t => (
                  <span key={t} style={{ fontSize: 10, background: "rgba(0,217,126,0.1)", color: "#00d97e", padding: "2px 6px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 3 }}>
                    #{t}
                    <button onClick={() => removeTag(note.id, t)} style={{ background: "transparent", border: "none", color: "#00d97e", cursor: "pointer", padding: 0, fontSize: 10, lineHeight: 1 }} title="Remove tag">×</button>
                  </span>
                ))}
                <button onClick={() => toggleItemPrivate(note.id)} style={{ fontSize: 10, background: note.isPrivate ? "rgba(255,77,126,0.1)" : "rgba(255,255,255,0.05)", color: note.isPrivate ? "#ff4d7e" : "#8080a0", border: "none", padding: "2px 6px", borderRadius: 4, cursor: "pointer" }} title="Toggle private">
                  {note.isPrivate ? '🔒 Private' : '🌐 Public'}
                </button>
              </div>

              <div className="markdown-body" style={{ color: "#a0a0c0", fontSize: 13, lineHeight: 1.5, maxHeight: 150, overflowY: "auto" }}>
                {note.body ? (
                  <ReactMarkdown 
                    allowedElements={['p', 'strong', 'em', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote']}
                  >
                    {note.body}
                  </ReactMarkdown>
                ) : <span style={{ fontStyle: "italic", opacity: 0.5 }}>Empty</span>}
              </div>

              {backlinks.length > 0 && (
                <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
                  <div style={{ fontSize: 11, color: "#606080", marginBottom: 4 }}>Linked references ({backlinks.length})</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {backlinks.slice(0, 3).map(bl => (
                      <div key={bl.id} onClick={() => onEditTask(bl)} style={{ fontSize: 12, color: "#00d97e", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ opacity: 0.5 }}>↗</span> {bl.title}
                      </div>
                    ))}
                    {backlinks.length > 3 && <div style={{ fontSize: 11, color: "#606080" }}>+ {backlinks.length - 3} more</div>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
