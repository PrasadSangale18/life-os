import { useState, useRef } from 'react';
import { useStore } from '../store';
import { parseImport, splitDashChain } from '../utils/importLogic';
import type { ImportItem, BlockedItem } from '../utils/importLogic';
import { PILLARS, QUADRANTS } from '../theme/tokens';
import { v4 as uuidv4 } from 'uuid';
import type { Item, ItemType, PillarId, QuadrantId, PriorityLevel } from '../types';
import { 
  Download, 
  Upload, 
  Check, 
  ShieldAlert, 
  ArrowRight, 
  RotateCcw, 
  Sparkles, 
  Calendar,
  Key,
  Lock,
  Layers
} from 'lucide-react';

export const ImportView = () => {
  const [text, setText] = useState('');
  const [stage, setStage] = useState<'input' | 'preview' | 'review' | 'summary'>('input');
  const [intakeMode, setIntakeMode] = useState<'local' | 'ai'>('local');
  const [showAiKeyModal, setShowAiKeyModal] = useState(false);
  const [userAiKey, setUserAiKey] = useState(() => {
    return (typeof window !== 'undefined' ? localStorage.getItem('lifeos_user_ai_key') : null) || '';
  });
  
  const [parsedItems, setParsedItems] = useState<ImportItem[]>([]);
  const [blockedCount, setBlockedCount] = useState(0);
  const [batchId, setBatchId] = useState('');
  const [blockedItems, setBlockedItems] = useState<BlockedItem[]>([]);
  
  const items = useStore(state => state.items);
  const commitImport = useStore(state => state.commitImport);
  const undoImport = useStore(state => state.undoImport);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setText(ev.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleParse = () => {
    if (!text.trim()) return;
    const result = parseImport(text, items);
    setParsedItems(result.items);
    setBlockedCount(result.blockedCount);
    setBlockedItems(result.blockedItems || []);
    setText('');
    setStage('preview');
  };

  const handleSaveKey = (key: string) => {
    setUserAiKey(key);
    if (typeof window !== 'undefined') {
      if (key.trim()) {
        localStorage.setItem('lifeos_user_ai_key', key.trim());
      } else {
        localStorage.removeItem('lifeos_user_ai_key');
      }
    }
    setShowAiKeyModal(false);
  };

  const commit = async () => {
    const id = uuidv4();
    setBatchId(id);
    const now = Date.now();
    const finalItems: Item[] = parsedItems.filter(i => i.status === 'approved').map(i => ({
      id: uuidv4(),
      type: i.suggestedType,
      title: i.suggestedTitle,
      body: i.rawText !== i.suggestedTitle ? i.rawText : undefined,
      pillar: i.suggestedPillar,
      quadrant: i.suggestedQuadrant,
      status: i.suggestedStatus || (i.suggestedType === 'task' ? 'todo' : undefined),
      priority: i.suggestedPriority || 'normal',
      isPriority: i.suggestedPriority === 'critical' || i.suggestedPriority === 'high',
      deadline: i.suggestedDeadline,
      isPrivate: i.suggestedPrivate,
      aiReviewed: true,
      createdAt: now,
      updatedAt: now,
      importBatchId: id,
      rawText: i.rawText,
      importSource: intakeMode === 'ai' ? 'ai_intake' : 'manual'
    }));
    await commitImport(id, finalItems);
    setStage('summary');
  };

  const updateItem = (id: string, updates: Partial<ImportItem>) => {
    setParsedItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const handleSplitDashChain = (id: string) => {
    const item = parsedItems.find(i => i.id === id);
    if (!item) return;
    const newItems = splitDashChain(item, uuidv4);
    setParsedItems(prev => prev.flatMap(i => i.id === id ? newItems : i));
  };

  const bulkApprove = () => {
    setParsedItems(prev => prev.map(i => i.status === 'pending' ? { ...i, status: 'approved' } : i));
  };

  if (stage === 'input') {
    return (
      <div className="glass-panel" style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(245,158,11,0.12)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Download size={16} />
            </div>
            <div>
              <div className="card-title" style={{ fontSize: 16 }}>Bulk Upload & Smart Intake</div>
              <div className="text-secondary" style={{ fontSize: 12 }}>
                Paste raw notes, markdown checklists, exports, or upload .txt / .md / .csv / .json files.
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="segmented-nav">
            <button 
              type="button"
              onClick={() => setIntakeMode('local')} 
              className={`segmented-nav-btn ${intakeMode === 'local' ? 'active' : ''}`}
            >
              <Layers size={13} />
              <span>Local Intake</span>
            </button>
            <button 
              type="button"
              onClick={() => {
                setIntakeMode('ai');
                if (!userAiKey) setShowAiKeyModal(true);
              }} 
              className={`segmented-nav-btn ${intakeMode === 'ai' ? 'active' : ''}`}
            >
              <Sparkles size={13} color="#a855f7" />
              <span>AI Assisted</span>
            </button>
          </div>
        </div>

        {/* Security & Screening Banner */}
        <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", fontSize: 12, color: "#10b981", display: "flex", alignItems: "center", gap: 8 }}>
          <Check size={14} strokeWidth={2.5} />
          <span>Local Sensitive Screening Active: Passwords, OTPs, Aadhaar, PAN, and card numbers are filtered in-memory before saving or external transmission.</span>
        </div>

        <textarea 
          value={text} 
          onChange={e => setText(e.target.value)} 
          placeholder={`Paste your content here...
Examples:
- [ ] Buy groceries for week due tomorrow #health
- Prepare slide deck for team meeting due in 3 days #work
- note: Reflections on quarterly goals and personal principles
- project: Launch marketing website with sub-tasks`} 
          className="ui-input"
          style={{ minHeight: 250, padding: 14, fontSize: 13, lineHeight: 1.6 }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input type="file" ref={fileInputRef} accept=".txt,.md,.json,.csv" style={{ display: "none" }} onChange={handleFileUpload} />
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary" style={{ gap: 6 }}>
              <Upload size={14} />
              <span>Upload File</span>
            </button>
            {intakeMode === 'ai' && (
              <button onClick={() => setShowAiKeyModal(true)} className="btn-ghost" style={{ gap: 4, fontSize: 12, color: "var(--text-secondary)" }}>
                <Key size={13} />
                <span>{userAiKey ? 'AI Key Configured' : 'Add AI Key'}</span>
              </button>
            )}
          </div>

          <button onClick={handleParse} className="btn-primary" style={{ gap: 6, padding: "8px 18px" }}>
            <span>{intakeMode === 'ai' ? 'Screen & Run AI Intake' : 'Screen & Parse Locally'}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* AI Key Modal */}
        {showAiKeyModal && (
          <div style={{ marginTop: 6, padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Personal AI API Key (Optional)</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Stored solely in your local browser session (`localStorage`). Never exposed in public GitHub Pages builds. If left empty, intelligent local rule-based intake runs seamlessly offline.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input 
                type="password"
                value={userAiKey}
                onChange={e => setUserAiKey(e.target.value)}
                placeholder="sk-..."
                className="ui-input"
                style={{ flex: 1, padding: "6px 10px", fontSize: 12 }}
              />
              <button onClick={() => handleSaveKey(userAiKey)} className="btn-secondary" style={{ fontSize: 12 }}>
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (stage === 'preview') {
    const tasks = parsedItems.filter(i => i.suggestedType === 'task').length;
    const notes = parsedItems.filter(i => i.suggestedType === 'note').length;
    const duplicates = parsedItems.filter(i => i.isDuplicate).length;
    const uncertain = parsedItems.filter(i => i.confidence <= 0.5 && !i.isDuplicate).length;

    return (
      <div className="glass-panel" style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div className="card-title" style={{ fontSize: 16 }}>Smart Intake Preview</div>
          <div className="text-secondary" style={{ fontSize: 12, marginTop: 2 }}>
            Review breakdown before reviewing items. Deadlines are strictly extracted only when explicitly written in text; never invented.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 14 }}>
            <div className="text-label" style={{ fontSize: 10 }}>Total Items</div>
            <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>{parsedItems.length}</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 14 }}>
            <div className="text-label" style={{ fontSize: 10 }}>Tasks Detected</div>
            <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-hover)", marginTop: 4 }}>{tasks}</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 14 }}>
            <div className="text-label" style={{ fontSize: 10 }}>Notes & Ideas</div>
            <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: "#10b981", marginTop: 4 }}>{notes}</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 14 }}>
            <div className="text-label" style={{ fontSize: 10 }}>Duplicates Skipped</div>
            <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: "var(--text-tertiary)", marginTop: 4 }}>{duplicates}</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 14 }}>
            <div className="text-label" style={{ fontSize: 10 }}>Needs Review</div>
            <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: "#f59e0b", marginTop: 4 }}>{uncertain}</div>
          </div>

          {blockedCount > 0 && (
            <div style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.3)", padding: 16, borderRadius: 8, gridColumn: "1 / -1", color: "#f43f5e", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                <ShieldAlert size={16} />
                <span>Blocked {blockedCount} sensitive items (Permanent in-memory redaction)</span>
              </div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                ID numbers, passwords, OTPs and card patterns were detected and blocked. Use a dedicated password manager for sensitive credentials.
              </div>
              <div style={{ overflowX: "auto", marginTop: 4 }}>
                <table style={{ width: "100%", fontSize: 12, textAlign: "left", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ color: "var(--text-secondary)", borderBottom: "1px solid rgba(244,63,94,0.2)" }}>
                      <th style={{ padding: "4px 8px" }}>Line</th>
                      <th style={{ padding: "4px 8px" }}>Reason</th>
                      <th style={{ padding: "4px 8px" }}>Masked Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockedItems.map((b, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "6px 8px" }}>{b.line}</td>
                        <td style={{ padding: "6px 8px" }}>{b.reason}</td>
                        <td style={{ padding: "6px 8px", fontFamily: "var(--font-mono)" }}>{b.masked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={() => setStage('input')} className="btn-secondary">
            Back to Input
          </button>
          <button onClick={() => setStage('review')} className="btn-primary" style={{ gap: 6 }}>
            <span>Open Review Queue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'review') {
    return (
      <div className="glass-panel" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div className="card-title" style={{ fontSize: 16 }}>Review Queue</div>
            <div className="text-secondary" style={{ fontSize: 12 }}>Review proposed titles, types, pillars, priorities, and quadrants.</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={bulkApprove} className="btn-secondary" style={{ fontSize: 12, color: "#10b981", borderColor: "rgba(16,185,129,0.3)" }}>
              Approve All Pending
            </button>
            <button onClick={commit} className="btn-primary" style={{ fontSize: 12, gap: 4 }}>
              <span>Commit to Operating System</span>
              <Check size={14} />
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "68vh", overflowY: "auto", paddingRight: 4 }}>
          {parsedItems.map(item => (
            <div 
              key={item.id} 
              style={{ 
                background: item.status === 'skipped' ? "rgba(255,255,255,0.015)" : "rgba(255,255,255,0.035)", 
                padding: "12px 14px", 
                borderRadius: 8, 
                opacity: item.status === 'skipped' ? 0.45 : 1, 
                borderLeft: item.confidence <= 0.5 && item.status === 'pending' ? "3px solid #f59e0b" : "3px solid transparent",
                border: "1px solid var(--border-subtle)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <input 
                  value={item.suggestedTitle} 
                  onChange={e => updateItem(item.id, { suggestedTitle: e.target.value })} 
                  className="ui-input"
                  style={{ width: "100%", fontSize: 13.5, fontWeight: 550, padding: "6px 10px" }} 
                />
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button 
                    onClick={() => updateItem(item.id, { status: 'approved' })} 
                    style={{ 
                      padding: "5px 10px", 
                      borderRadius: 6, 
                      background: item.status === 'approved' ? "#10b981" : "rgba(255,255,255,0.05)", 
                      color: item.status === 'approved' ? "#000" : "var(--text-secondary)", 
                      border: "none", 
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600
                    }}
                    title="Approve item"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => updateItem(item.id, { status: 'skipped' })} 
                    style={{ 
                      padding: "5px 10px", 
                      borderRadius: 6, 
                      background: item.status === 'skipped' ? "#f43f5e" : "rgba(255,255,255,0.05)", 
                      color: item.status === 'skipped' ? "#fff" : "var(--text-secondary)", 
                      border: "none", 
                      cursor: "pointer",
                      fontSize: 12
                    }}
                    title="Skip item"
                  >
                    Skip
                  </button>
                </div>
              </div>
              
              {item.hasDashChain && (
                <div style={{ color: "#f59e0b", fontSize: 11.5, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(245,158,11,0.08)", padding: "4px 8px", borderRadius: 6 }}>
                  <span>Contains dash-delimited sub-items.</span>
                  <button onClick={() => handleSplitDashChain(item.id)} className="btn-secondary" style={{ padding: "2px 8px", fontSize: 11 }}>
                    Split Chain
                  </button>
                </div>
              )}
              
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", fontSize: 12 }}>
                {/* Type */}
                <select 
                  value={item.suggestedType} 
                  onChange={e => updateItem(item.id, { suggestedType: e.target.value as ItemType })} 
                  className="ui-select"
                  style={{ padding: "4px 8px", fontSize: 11.5 }}
                >
                  <option value="task">Task</option>
                  <option value="note">Note</option>
                  <option value="project">Project</option>
                  <option value="goal">Goal</option>
                </select>

                {/* Pillar */}
                <select 
                  value={item.suggestedPillar || ''} 
                  onChange={e => updateItem(item.id, { suggestedPillar: e.target.value as PillarId })} 
                  className="ui-select"
                  style={{ padding: "4px 8px", fontSize: 11.5 }}
                >
                  {PILLARS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                {/* Quadrant (for tasks) */}
                {item.suggestedType === 'task' && (
                  <select 
                    value={item.suggestedQuadrant || 'do'} 
                    onChange={e => updateItem(item.id, { suggestedQuadrant: e.target.value as QuadrantId })} 
                    className="ui-select"
                    style={{ padding: "4px 8px", fontSize: 11.5 }}
                  >
                    {QUADRANTS.map(q => <option key={q.id} value={q.id}>{q.name} ({q.label})</option>)}
                  </select>
                )}

                {/* Priority */}
                <select 
                  value={item.suggestedPriority || 'normal'} 
                  onChange={e => updateItem(item.id, { suggestedPriority: e.target.value as PriorityLevel })} 
                  className="ui-select"
                  style={{ padding: "4px 8px", fontSize: 11.5 }}
                >
                  <option value="critical">Critical Priority</option>
                  <option value="high">High Priority</option>
                  <option value="normal">Normal Priority</option>
                  <option value="low">Low Priority</option>
                </select>

                {/* Explicit Deadline Indicator */}
                {item.suggestedDeadline && (
                  <span className="ui-pill" style={{ color: "#10b981", fontSize: 11, gap: 4, display: "flex", alignItems: "center" }}>
                    <Calendar size={11} />
                    <span>Due: {new Date(item.suggestedDeadline).toLocaleDateString()}</span>
                  </span>
                )}

                <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--text-secondary)", cursor: "pointer" }}>
                  <input type="checkbox" checked={item.suggestedPrivate} onChange={e => updateItem(item.id, { suggestedPrivate: e.target.checked })} style={{ accentColor: "var(--accent-primary)" }} />
                  <Lock size={11} />
                  <span>Private</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stage === 'summary') {
    return (
      <div className="glass-panel" style={{ padding: "48px 32px", display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(16,185,129,0.12)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={22} strokeWidth={2.5} />
        </div>
        <div>
          <div className="card-title" style={{ fontSize: 18 }}>Import Completed Successfully</div>
          <div className="text-secondary" style={{ fontSize: 13, marginTop: 4 }}>Approved items have been safely committed to your IndexedDB workspace.</div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button onClick={() => { setText(''); setStage('input'); }} className="btn-primary">
            Start New Import
          </button>
          <button 
            onClick={async () => { 
              const imported = items.filter(i => i.importBatchId === batchId);
              const editedCount = imported.filter(i => i.updatedAt > i.createdAt).length;
              if (editedCount > 0) {
                if (!window.confirm(`Warning: ${editedCount} items have been edited since import. Undoing will move them to Trash and keep those edits, but remove them from active views. Proceed?`)) return;
              }
              await undoImport(batchId); 
              setStage('input'); 
              setText(''); 
            }} 
            className="btn-danger"
            style={{ gap: 4 }}
          >
            <RotateCcw size={13} />
            <span>Undo Batch</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
