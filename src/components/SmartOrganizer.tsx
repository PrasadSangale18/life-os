import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { fuzzyFindDuplicates, cleanupText } from '../utils/smartOrganizerLogic';
import type { Item } from '../types';

export const SmartOrganizer = () => {
  const items = useStore(s => s.items);
  const mergeStoreItems = useStore(s => s.mergeItems);
  const applyStoreCleanup = useStore(s => s.applyCleanup);
  const revertStoreCleanup = useStore(s => s.revertCleanup);
  const splitStoreItem = useStore(s => s.splitItem);
  
  const [activeTab, setActiveTab] = useState<'duplicates' | 'cleanup' | 'split'>('duplicates');

  // Duplicates
  const duplicatePairs = useMemo(() => fuzzyFindDuplicates(items), [items]);

  const mergeItems = async (keep: Item, trash: Item) => {
    const combinedRaw = (keep.rawText || keep.title) + '\n\n--- Merged from ---\n' + (trash.rawText || trash.title);
    await mergeStoreItems(keep.id, trash.id, { rawText: combinedRaw });
  };

  // Cleanup
  const cleanupCandidates = useMemo(() => {
    return items.filter(i => !i.deletedAt && !i.isArchived).map(i => ({
      item: i,
      suggestedTitle: cleanupText(i.title),
      suggestedBody: i.body ? cleanupText(i.body) : undefined
    })).filter(c => c.suggestedTitle !== c.item.title || c.suggestedBody !== c.item.body);
  }, [items]);

  const applyCleanup = async (id: string, cTitle: string, cBody?: string) => {
    await applyStoreCleanup(id, cTitle, cBody);
  };
  const revertCleanup = async (id: string) => {
    await revertStoreCleanup(id);
  };

  // Split Tool
  const [splitSourceId, setSplitSourceId] = useState<string>('');
  const [splitText, setSplitText] = useState<string>('');
  
  const executeSplit = async () => {
    const source = items.find(i => i.id === splitSourceId);
    if (!source || !splitText.trim()) return;
    
    const parts = splitText.split('\n').map(p => p.trim()).filter(Boolean);
    await splitStoreItem(source.id, parts);
    setSplitSourceId('');
    setSplitText('');
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, background: "rgba(0,0,0,0.2)", borderRadius: 16, height: "100%", overflowY: "auto" }}>
      <h2>Smart Organizer</h2>
      
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button onClick={() => setActiveTab('duplicates')} style={{ background: activeTab === 'duplicates' ? "#4d9eff" : "rgba(255,255,255,0.1)", color: activeTab === 'duplicates' ? "#000" : "#fff", padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: "bold" }}>Find Duplicates</button>
        <button onClick={() => setActiveTab('cleanup')} style={{ background: activeTab === 'cleanup' ? "#00d97e" : "rgba(255,255,255,0.1)", color: activeTab === 'cleanup' ? "#000" : "#fff", padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: "bold" }}>Cleanup Assistant</button>
        <button onClick={() => setActiveTab('split')} style={{ background: activeTab === 'split' ? "#b57bff" : "rgba(255,255,255,0.1)", color: activeTab === 'split' ? "#000" : "#fff", padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: "bold" }}>Split Tool</button>
      </div>

      {activeTab === 'duplicates' && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {duplicatePairs.length === 0 && <p style={{ color: "#a0a0c0" }}>No fuzzy duplicates found.</p>}
          {duplicatePairs.map(([a, b], idx) => (
            <div key={idx} style={{ display: "flex", gap: 16, background: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 8 }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: "0 0 8px 0" }}>{a.title}</h4>
                <p style={{ color: "#a0a0c0", fontSize: 13 }}>{a.body}</p>
                <button onClick={() => mergeItems(a, b)} style={{ background: "#4d9eff", border: "none", padding: "6px 12px", borderRadius: 6, color: "#000", cursor: "pointer", marginTop: 12 }}>Keep Left & Merge Right</button>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: "0 0 8px 0" }}>{b.title}</h4>
                <p style={{ color: "#a0a0c0", fontSize: 13 }}>{b.body}</p>
                <button onClick={() => mergeItems(b, a)} style={{ background: "#b57bff", border: "none", padding: "6px 12px", borderRadius: 6, color: "#000", cursor: "pointer", marginTop: 12 }}>Keep Right & Merge Left</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'cleanup' && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {cleanupCandidates.length === 0 && <p style={{ color: "#a0a0c0" }}>Everything looks clean!</p>}
          {cleanupCandidates.slice(0, 50).map(({ item, suggestedTitle, suggestedBody }) => (
            <div key={item.id} style={{ display: "flex", gap: 16, background: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 8 }}>
              <div style={{ flex: 1, opacity: 0.7 }}>
                <div style={{ fontSize: 11, color: "#ff4d7e", marginBottom: 4 }}>ORIGINAL RAW</div>
                <h4 style={{ margin: "0 0 8px 0" }}>{item.title}</h4>
                <p style={{ fontSize: 13 }}>{item.body}</p>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#00d97e", marginBottom: 4 }}>SUGGESTED CLEANUP</div>
                <h4 style={{ margin: "0 0 8px 0" }}>{suggestedTitle}</h4>
                <p style={{ fontSize: 13 }}>{suggestedBody}</p>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={() => applyCleanup(item.id, suggestedTitle, suggestedBody)} style={{ background: "#00d97e", border: "none", padding: "6px 12px", borderRadius: 6, color: "#000", cursor: "pointer" }}>Apply Cleanup</button>
                  {item.cleanedTitle && (
                    <button onClick={() => revertCleanup(item.id)} style={{ background: "transparent", border: "1px solid #ff4d7e", padding: "6px 12px", borderRadius: 6, color: "#ff4d7e", cursor: "pointer" }}>Revert to Original</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'split' && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ color: "#a0a0c0" }}>Select an item to split it into multiple new items. The original item will be preserved and linked.</p>
          <select value={splitSourceId} onChange={e => {
            setSplitSourceId(e.target.value);
            const t = items.find(i => i.id === e.target.value);
            if (t) setSplitText(t.title + (t.body ? '\n' + t.body : ''));
          }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: 12, borderRadius: 8, color: "#fff", fontSize: 16 }}>
            <option value="" disabled>Select an item...</option>
            {items.filter(i => !i.deletedAt && !i.isArchived).map(i => (
              <option key={i.id} value={i.id}>{i.title}</option>
            ))}
          </select>

          {splitSourceId && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 12, color: "#a0a0c0" }}>Edit the text below. Each new line will become a separate item.</p>
              <textarea 
                value={splitText} 
                onChange={e => setSplitText(e.target.value)} 
                style={{ background: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 12, minHeight: 150, fontFamily: "inherit" }}
              />
              <button onClick={executeSplit} style={{ background: "#b57bff", color: "#000", border: "none", padding: "12px", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Split into {splitText.split('\n').filter(p => p.trim()).length} Items</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
