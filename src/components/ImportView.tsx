import { useState, useRef } from 'react';
import { useStore } from '../store';
import { parseImport, splitDashChain } from '../utils/importLogic';
import type { ImportItem, BlockedItem } from '../utils/importLogic';
import { PILLARS } from '../theme/tokens';
import { v4 as uuidv4 } from 'uuid';
import type { Item, ItemType, PillarId } from '../types';

export const ImportView = () => {
  const [text, setText] = useState('');
  const [stage, setStage] = useState<'input' | 'preview' | 'review' | 'summary'>('input');
  
  const [parsedItems, setParsedItems] = useState<ImportItem[]>([]);
  const [blockedCount, setBlockedCount] = useState(0);
  const [batchId, setBatchId] = useState('');
  
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

  const [blockedItems, setBlockedItems] = useState<BlockedItem[]>([]);

  const handleParse = () => {
    if (!text.trim()) return;
    const result = parseImport(text, items);
    setParsedItems(result.items);
    setBlockedCount(result.blockedCount);
    setBlockedItems(result.blockedItems || []);
    setText(''); // clear instantly so it leaves memory
    setStage('preview');
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
      isPrivate: i.suggestedPrivate,
      createdAt: now,
      updatedAt: now,
      importBatchId: id,
      rawText: i.rawText,
      importSource: 'manual'
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
      <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", padding: 16, background: "rgba(0,0,0,0.2)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
        <h2>Import Data</h2>
        <p style={{ color: "#a0a0c0" }}>Paste text, notes, app exports, or upload a file (.txt, .md, .json, .csv).</p>
        <textarea 
          value={text} 
          onChange={e => setText(e.target.value)} 
          placeholder="Paste content here..." 
          style={{ flex: 1, minHeight: 200, background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 16, fontFamily: "inherit" }}
        />
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input type="file" ref={fileInputRef} accept=".txt,.md,.json,.csv" style={{ display: "none" }} onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Upload File</button>
          <button onClick={handleParse} style={{ padding: "8px 16px", background: "#4d9eff", color: "#000", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>Next: Parse & Preview</button>
        </div>
      </div>
    );
  }

  if (stage === 'preview') {
    const tasks = parsedItems.filter(i => i.suggestedType === 'task').length;
    const duplicates = parsedItems.filter(i => i.isDuplicate).length;
    const uncertain = parsedItems.filter(i => i.confidence <= 0.5 && !i.isDuplicate).length;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", padding: 16, background: "rgba(0,0,0,0.2)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
        <h2>Preview</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 8 }}>Total Items: <strong>{parsedItems.length}</strong></div>
          <div style={{ background: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 8 }}>Tasks Detected: <strong>{tasks}</strong></div>
          <div style={{ background: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 8 }}>Duplicates Skipped: <strong style={{ color: "#a0a0c0" }}>{duplicates}</strong></div>
          <div style={{ background: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 8 }}>Needs Review: <strong style={{ color: "#fbbf24" }}>{uncertain}</strong></div>
          {blockedCount > 0 && (
            <div style={{ background: "rgba(255,77,126,0.1)", padding: 16, borderRadius: 8, gridColumn: "span 2", color: "#ff4d7e", display: "flex", flexDirection: "column", gap: 8 }}>
              <strong>⚠️ Blocked {blockedCount} sensitive items.</strong> Please use a secure password manager for ID numbers and passwords. These have been permanently deleted from memory.
              <div style={{ marginTop: 8, background: "rgba(0,0,0,0.2)", borderRadius: 6, padding: 8 }}>
                <table style={{ width: "100%", fontSize: 13, textAlign: "left" }}>
                  <thead>
                    <tr style={{ color: "#ff8da1" }}><th>Line</th><th>Reason</th><th>Preview</th></tr>
                  </thead>
                  <tbody>
                    {blockedItems.map((b, idx) => (
                      <tr key={idx}>
                        <td>{b.line}</td>
                        <td>{b.reason}</td>
                        <td style={{ fontFamily: "monospace" }}>{b.masked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: "auto" }}>
          <button onClick={() => setStage('input')} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Back</button>
          <button onClick={() => setStage('review')} style={{ padding: "8px 16px", background: "#4d9eff", color: "#000", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>Review Queue</button>
        </div>
      </div>
    );
  }

  if (stage === 'review') {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", padding: 16, background: "rgba(0,0,0,0.2)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Review Queue</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={bulkApprove} style={{ padding: "6px 12px", background: "rgba(0,217,126,0.2)", color: "#00d97e", border: "1px solid #00d97e", borderRadius: 6, cursor: "pointer" }}>Approve All Pending</button>
            <button onClick={commit} style={{ padding: "6px 16px", background: "#4d9eff", color: "#000", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>Commit to DB</button>
          </div>
        </div>

        {parsedItems.map(item => (
          <div key={item.id} style={{ background: item.status === 'skipped' ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)", padding: 12, borderRadius: 8, opacity: item.status === 'skipped' ? 0.5 : 1, borderLeft: item.confidence <= 0.5 && item.status === 'pending' ? "4px solid #fbbf24" : "4px solid transparent" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <input value={item.suggestedTitle} onChange={e => updateItem(item.id, { suggestedTitle: e.target.value })} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 16, fontWeight: "bold", width: "100%" }} />
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => updateItem(item.id, { status: 'approved' })} style={{ background: item.status === 'approved' ? "#00d97e" : "transparent", color: item.status === 'approved' ? "#000" : "#fff", border: "1px solid #00d97e", borderRadius: 4, cursor: "pointer" }}>✓</button>
                <button onClick={() => updateItem(item.id, { status: 'skipped' })} style={{ background: item.status === 'skipped' ? "#ff4d7e" : "transparent", color: item.status === 'skipped' ? "#000" : "#fff", border: "1px solid #ff4d7e", borderRadius: 4, cursor: "pointer" }}>✕</button>
              </div>
            </div>
            
            {item.hasDashChain && (
              <div style={{ color: "#fbbf24", fontSize: 11, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>💡 Suggestion: Contains dash chain. Splitting not automatic, edit above if needed.</span>
                <button onClick={() => handleSplitDashChain(item.id)} style={{ padding: "4px 8px", background: "rgba(251,191,36,0.2)", color: "#fbbf24", border: "1px solid #fbbf24", borderRadius: 4, cursor: "pointer" }}>Split Now</button>
              </div>
            )}
            
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12 }}>
              <select value={item.suggestedType} onChange={e => updateItem(item.id, { suggestedType: e.target.value as ItemType })} style={{ background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", padding: 4, borderRadius: 4 }}>
                <option value="task">Task</option><option value="note">Note</option><option value="project">Project</option><option value="goal">Goal</option>
              </select>
              <select value={item.suggestedPillar || ''} onChange={e => updateItem(item.id, { suggestedPillar: e.target.value as PillarId })} style={{ background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", padding: 4, borderRadius: 4 }}>
                <option value="" disabled>No Pillar</option>
                {PILLARS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.5)", padding: "0 6px", borderRadius: 4 }}>
                <input type="checkbox" checked={item.suggestedPrivate} onChange={e => updateItem(item.id, { suggestedPrivate: e.target.checked })} /> Private
              </label>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (stage === 'summary') {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", padding: 16, background: "rgba(0,0,0,0.2)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" }}>
        <h2 style={{ color: "#00d97e" }}>Import Complete!</h2>
        <p>Successfully committed items.</p>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button onClick={() => { setText(''); setStage('input'); }} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Start New Import</button>
          <button onClick={async () => { 
            const imported = items.filter(i => i.importBatchId === batchId);
            const editedCount = imported.filter(i => i.updatedAt > i.createdAt).length;
            if (editedCount > 0) {
              if (!window.confirm(`Warning: ${editedCount} items have been edited since import. Undoing will move them to Trash and keep those edits, but remove them from the active views. Proceed?`)) return;
            }
            await undoImport(batchId); 
            setStage('input'); 
            setText(''); 
          }} style={{ padding: "8px 16px", background: "rgba(255,77,126,0.2)", color: "#ff4d7e", border: "1px solid #ff4d7e", borderRadius: 8, cursor: "pointer" }}>Undo Entire Batch</button>
        </div>
      </div>
    );
  }

  return null;
};
