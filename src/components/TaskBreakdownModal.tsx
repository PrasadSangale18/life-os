import { useState } from 'react';
import type { Item, QuadrantId, PriorityLevel } from '../types';
import { generateLocalTaskBreakdown, requestAIBreakdown } from '../utils/aiIntake';
import type { TaskBreakdownResult, BreakdownSubtask } from '../utils/aiIntake';
import { v4 as uuidv4 } from 'uuid';
import { 
  Sparkles, 
  X, 
  Check, 
  Clock, 
  ArrowRight, 
  RotateCcw, 
  Key, 
  Brain
} from 'lucide-react';

interface TaskBreakdownModalProps {
  task: Partial<Item> & { title: string };
  isOpen: boolean;
  onClose: () => void;
  onCommitSubtasks: (
    subtasks: Array<{ title: string; estMinutes?: number; quadrant?: QuadrantId; priority?: PriorityLevel }>,
    batchId: string
  ) => Promise<void>;
  onUndoBatch?: (batchId: string) => Promise<void>;
}

export const TaskBreakdownModal = ({
  task,
  isOpen,
  onClose,
  onCommitSubtasks,
  onUndoBatch
}: TaskBreakdownModalProps) => {
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<TaskBreakdownResult>(() => generateLocalTaskBreakdown(task));
  const [subtasks, setSubtasks] = useState<BreakdownSubtask[]>(() => generateLocalTaskBreakdown(task).subtasks);
  const [lastBatchId, setLastBatchId] = useState<string | null>(task.breakdownBatchId || null);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    return (typeof window !== 'undefined' ? localStorage.getItem('lifeos_user_ai_key') : null) || '';
  });

  if (!isOpen) return null;

  const handleRunAI = async () => {
    if (!apiKey.trim()) {
      setShowKeyInput(true);
      return;
    }
    setLoading(true);
    try {
      const result = await requestAIBreakdown(task, apiKey.trim());
      setBreakdown(result);
      setSubtasks(result.subtasks);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    if (typeof window !== 'undefined') {
      if (key.trim()) {
        localStorage.setItem('lifeos_user_ai_key', key.trim());
      } else {
        localStorage.removeItem('lifeos_user_ai_key');
      }
    }
    setShowKeyInput(false);
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };

  const updateSubtask = (id: string, updates: Partial<BreakdownSubtask>) => {
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const selectedCount = subtasks.filter(s => s.selected).length;

  const handleCommit = async () => {
    const toCommit = subtasks.filter(s => s.selected).map(s => ({
      title: s.title,
      estMinutes: s.estMinutes,
      quadrant: s.quadrant,
      priority: s.priority
    }));

    if (toCommit.length === 0) return;

    const batchId = uuidv4();
    setLastBatchId(batchId);
    await onCommitSubtasks(toCommit, batchId);
    onClose();
  };

  const handleUndo = async () => {
    if (!lastBatchId || !onUndoBatch) return;
    await onUndoBatch(lastBatchId);
    setLastBatchId(null);
  };

  return (
    <div 
      onClick={onClose}
      style={{ 
        position: "fixed", 
        inset: 0, 
        background: "rgba(5, 6, 10, 0.78)", 
        backdropFilter: "blur(8px)", 
        zIndex: 250, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        padding: 16 
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="glass-panel-elevated"
        style={{ 
          width: "100%", 
          maxWidth: 680, 
          maxHeight: "90vh", 
          display: "flex", 
          flexDirection: "column", 
          borderRadius: 14, 
          border: "1px solid var(--border-strong)", 
          background: "#0e111a", 
          overflow: "hidden" 
        }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(168,85,247,0.15)", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Brain size={18} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 650, color: "var(--text-primary)" }}>First-Principles Breakdown</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{task.title}</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="ui-pill" style={{ fontSize: 10, color: breakdown.source === 'ai_assistant' ? '#3b82f6' : '#10b981', borderColor: 'rgba(255,255,255,0.1)' }}>
              {breakdown.source === 'ai_assistant' ? 'AI Assisted' : 'Local 1st-Principles'}
            </span>
            <button onClick={onClose} className="btn-ghost" style={{ padding: 4 }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Outcome & Smallest Next Action */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
            <div style={{ padding: "12px 14px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
              <div className="text-label" style={{ fontSize: 10, color: "var(--accent-hover)", marginBottom: 4 }}>Target Outcome</div>
              <div style={{ fontSize: 12.5, color: "var(--text-primary)", lineHeight: 1.45 }}>{breakdown.desiredOutcome}</div>
            </div>

            <div style={{ padding: "12px 14px", borderRadius: 8, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <div className="text-label" style={{ fontSize: 10, color: "#10b981", marginBottom: 4 }}>Smallest Next Action</div>
              <div style={{ fontSize: 12.5, color: "var(--text-primary)", lineHeight: 1.45 }}>{breakdown.smallestNextAction}</div>
            </div>
          </div>

          {/* Fastest Responsible Path */}
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)", fontSize: 12, color: "var(--text-secondary)" }}>
            <strong style={{ color: "#3b82f6" }}>Fastest Responsible Path: </strong>
            {breakdown.fastestResponsiblePath}
          </div>

          {/* Subtasks Queue */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="text-label" style={{ fontSize: 11 }}>Suggested Sub-Tasks ({selectedCount}/{subtasks.length} selected)</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button 
                  onClick={() => setSubtasks(prev => prev.map(s => ({ ...s, selected: true })))} 
                  className="btn-ghost" 
                  style={{ fontSize: 11, padding: "2px 6px" }}
                >
                  Select All
                </button>
                <button 
                  onClick={() => setSubtasks(prev => prev.map(s => ({ ...s, selected: false })))} 
                  className="btn-ghost" 
                  style={{ fontSize: 11, padding: "2px 6px" }}
                >
                  Deselect
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {subtasks.map((st) => (
                <div 
                  key={st.id}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 10, 
                    padding: "10px 12px", 
                    borderRadius: 8, 
                    background: st.selected ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)", 
                    border: `1px solid ${st.selected ? "var(--border-strong)" : "var(--border-subtle)"}`,
                    opacity: st.selected ? 1 : 0.6
                  }}
                >
                  <button 
                    onClick={() => toggleSubtask(st.id)}
                    style={{ 
                      width: 18, 
                      height: 18, 
                      borderRadius: 4, 
                      border: `1.5px solid ${st.selected ? "var(--accent-primary)" : "rgba(255,255,255,0.2)"}`,
                      background: st.selected ? "var(--accent-primary)" : "transparent",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: 0
                    }}
                  >
                    {st.selected && <Check size={11} strokeWidth={3} />}
                  </button>

                  <input 
                    value={st.title}
                    onChange={e => updateSubtask(st.id, { title: e.target.value })}
                    className="ui-input"
                    style={{ flex: 1, padding: "4px 8px", fontSize: 12.5, height: 30 }}
                  />

                  {/* Quadrant & Priority Selectors */}
                  <select 
                    value={st.quadrant}
                    onChange={e => updateSubtask(st.id, { quadrant: e.target.value as QuadrantId })}
                    className="ui-select"
                    style={{ padding: "3px 6px", fontSize: 11, height: 28 }}
                  >
                    <option value="do">DO</option>
                    <option value="decide">DECIDE</option>
                    <option value="delegate">DELEGATE</option>
                    <option value="delete">DELETE</option>
                  </select>

                  <select 
                    value={st.priority}
                    onChange={e => updateSubtask(st.id, { priority: e.target.value as PriorityLevel })}
                    className="ui-select"
                    style={{ padding: "3px 6px", fontSize: 11, height: 28 }}
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>

                  <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--text-tertiary)" }}>
                    <Clock size={11} />
                    <span>{st.estMinutes}m</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional AI Key Config */}
          {showKeyInput && (
            <div style={{ padding: "12px 14px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>Personal AI Key (Optional)</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                Stored locally in your browser session only. Never exposed in production bundle.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input 
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="ui-input"
                  style={{ flex: 1, padding: "5px 10px", fontSize: 12 }}
                />
                <button onClick={() => handleSaveApiKey(apiKey)} className="btn-secondary" style={{ fontSize: 12 }}>
                  Save Key
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button 
              onClick={handleRunAI} 
              disabled={loading}
              className="btn-ghost" 
              style={{ fontSize: 12, gap: 5, padding: "6px 10px" }}
              title="Enhance with AI model (uses personal key)"
            >
              <Sparkles size={13} color="#a855f7" />
              <span>{loading ? 'Analyzing...' : 'Enhance with AI'}</span>
            </button>

            <button 
              onClick={() => setShowKeyInput(!showKeyInput)} 
              className="btn-ghost" 
              style={{ padding: "6px", color: "var(--text-tertiary)" }}
              title="Configure personal API key"
            >
              <Key size={13} />
            </button>

            {lastBatchId && onUndoBatch && (
              <button 
                onClick={handleUndo} 
                className="btn-ghost" 
                style={{ fontSize: 12, gap: 5, padding: "6px 10px", color: "#f43f5e" }}
                title="Undo previously committed sub-tasks"
              >
                <RotateCcw size={12} />
                <span>Undo Batch</span>
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={onClose} className="btn-secondary" style={{ fontSize: 13, padding: "7px 14px" }}>
              Cancel
            </button>
            <button 
              onClick={handleCommit} 
              disabled={selectedCount === 0}
              className="btn-primary" 
              style={{ fontSize: 13, padding: "7px 16px", gap: 6 }}
            >
              <span>Commit {selectedCount} Sub-tasks</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
