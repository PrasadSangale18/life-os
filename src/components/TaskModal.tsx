import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { QUADRANTS, PILLARS } from '../theme/tokens';
import type { Item, QuadrantId, PillarId, Difficulty, ItemType } from '../types';

interface TaskModalProps {
  initialTask?: Item;
  defaultPillar: PillarId;
  defaultQuadrant: QuadrantId;
  onSave: (data: Partial<Item>) => void;
  onClose: () => void;
  isMobile: boolean;
}

export const TaskModal = ({ initialTask, defaultPillar, defaultQuadrant, onSave, onClose, isMobile }: TaskModalProps) => {
  const isEdit = !!initialTask;
  const [title, setTitle] = useState(initialTask?.title || '');
  const [type, setType] = useState<ItemType>(initialTask?.type || 'task');
  const [quadrant, setQuadrant] = useState<QuadrantId>(initialTask?.quadrant || defaultQuadrant);
  const [pillar, setPillar] = useState<PillarId>(initialTask?.pillar || defaultPillar);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialTask?.difficulty || 'Medium');
  const [estMinutes, setEstMinutes] = useState<string>(initialTask?.estMinutes?.toString() || '');
  const [deadline, setDeadline] = useState<string>(initialTask?.deadline ? new Date(initialTask.deadline).toISOString().split('T')[0] : '');
  const [projectId, setProjectId] = useState(initialTask?.projectId || '');
  
  // Phase 3 preparations
  const [body, setBody] = useState(initialTask?.body || '');
  const [tags, setTags] = useState<string[]>(initialTask?.tags || []);
  const [isPrivate, setIsPrivate] = useState(initialTask?.isPrivate || false);

  const activePillarObj = PILLARS.find(p => p.id === pillar)! || PILLARS[0];

  const stateRef = useRef({ title, type, quadrant, pillar, difficulty, estMinutes, deadline, projectId, body, tags, isPrivate, status: initialTask?.status || 'todo' });
  useEffect(() => {
    stateRef.current = { title, type, quadrant, pillar, difficulty, estMinutes, deadline, projectId, body, tags, isPrivate, status: initialTask?.status || 'todo' };
  });

  const handleSave = useCallback(() => {
    const s = stateRef.current;
    if (!s.title.trim()) return;
    onSave({
      title: s.title.trim(),
      type: s.type,
      quadrant: s.type === 'task' ? s.quadrant : undefined,
      pillar: s.pillar,
      difficulty: s.type === 'task' ? s.difficulty : undefined,
      estMinutes: s.estMinutes ? parseInt(s.estMinutes, 10) : undefined,
      deadline: s.deadline ? new Date(s.deadline).getTime() : undefined,
      status: s.status,
      projectId: s.projectId.trim() || undefined,
      body: s.body.trim() || undefined,
      tags: s.tags,
      isPrivate: s.isPrivate
    });
  }, [onSave]);

  // Keyboard trap for saving (stale state fixed via stateRef)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSave();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleSave]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", zIndex: 3000, padding: isMobile ? 0 : 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#0c0c1c", border: `1px solid ${activePillarObj.color}40`, borderRadius: isMobile ? "20px 20px 0 0" : 16, width: "100%", maxWidth: 440, padding: 20, boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 40px ${activePillarObj.glow}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#fff" }}>{isEdit ? 'Edit Item' : 'New Item'}</div>
          <button aria-label="Close modal" onClick={onClose} style={{ background: "transparent", border: "none", color: "#505070", cursor: "pointer" }}><X size={16} /></button>
        </div>
        
        <input 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSave()} 
          placeholder={`What's on your mind?`} 
          autoFocus 
          style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", boxSizing: "border-box", marginBottom: 12 }} 
        />
        
        <div style={{ display: "flex", gap: 8, marginBottom: 12, overflowX: "auto", paddingBottom: 4 }}>
          {['task', 'project', 'goal', 'habit', 'idea', 'knowledge', 'reference', 'principle', 'reminder', 'question', 'journal'].map(t => (
            <button 
              key={t}
              onClick={() => setType(t as ItemType)}
              style={{ padding: "4px 10px", borderRadius: 20, background: type === t ? "#fff" : "rgba(255,255,255,0.05)", color: type === t ? "#000" : "#8080a0", border: "none", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <select value={pillar} onChange={e => setPillar(e.target.value as PillarId)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px", color: "#fff", outline: "none" }}>
            {PILLARS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {type === 'task' && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {QUADRANTS.map(q => (
                <button 
                  key={q.id} 
                  onClick={() => setQuadrant(q.id)} 
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8, background: quadrant === q.id ? q.bg : "transparent", border: `1px solid ${quadrant === q.id ? q.color : "rgba(255,255,255,0.1)"}`, color: quadrant === q.id ? q.color : "#7070a0", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}
                >
                  {q.name}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px", color: "#fff", outline: "none" }}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <input type="number" placeholder="Mins" value={estMinutes} onChange={e => setEstMinutes(e.target.value)} style={{ width: 80, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px", color: "#fff", outline: "none" }} />
              <div style={{ position: "relative", flex: 1 }}>
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px", color: "#fff", outline: "none" }} />
              </div>
            </div>
            
            <input 
              value={projectId} 
              onChange={e => setProjectId(e.target.value)} 
              placeholder="Link to Goal or Project (optional)" 
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 16 }} 
            />
          </>
        )}
        
        <textarea 
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Notes or details (Markdown supported, use [[wiki links]])"
          style={{ width: "100%", height: type === 'task' ? 60 : 120, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 16, resize: "vertical", fontFamily: "inherit" }}
        />
        <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
          <input 
            value={tags.join(', ')} 
            onChange={e => setTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))} 
            placeholder="Tags (comma separated)" 
            style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} 
          />
          <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#a0a0c0", fontSize: 13, cursor: "pointer", background: "rgba(255,255,255,0.05)", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}>
            <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} />
            Private
          </label>
        </div>

        <button 
          onClick={handleSave} 
          style={{ width: "100%", background: activePillarObj.color, border: "none", borderRadius: 10, padding: "12px", color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}
        >
          {isEdit ? 'Save Changes' : 'Save (Cmd+Enter)'}
        </button>
      </div>
    </div>
  );
};
