import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { selectInboxItems, selectStalledTasks } from '../utils/selectors';

export const WeeklyReview = () => {
  const items = useStore(s => s.items);
  const showPrivate = useStore(s => s.showPrivate);
  const updateItem = useStore(s => s.updateItem);

  const [step, setStep] = useState<number>(1);
  const [now] = useState(() => Date.now());

  const inboxItems = useMemo(() => selectInboxItems(items, showPrivate), [items, showPrivate]);
  
  const stalledTasks = useMemo(() => selectStalledTasks(items, now, showPrivate), [items, now, showPrivate]);

  const allActiveTasks = useMemo(() => {
    return items.filter(i => i.type === 'task' && !i.deletedAt && !i.isArchived && i.status !== 'done' && (showPrivate || !i.isPrivate));
  }, [items, showPrivate]);

  const priorityCount = allActiveTasks.filter(t => t.isPriority).length;

  const finishedItems = useMemo(() => {
    return items.filter(i => i.type === 'task' && !i.deletedAt && !i.isArchived && i.status === 'done' && (showPrivate || !i.isPrivate));
  }, [items, showPrivate]);

  const archiveItem = useStore(s => s.archiveItem);

  const archiveAllFinished = async () => {
    for (const item of finishedItems) {
      await archiveItem(item.id);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, background: "rgba(0,0,0,0.2)", borderRadius: 16, height: "100%", overflowY: "auto" }}>
      <h2>Weekly Review</h2>
      
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[1, 2, 3, 4].map(s => (
          <button key={s} onClick={() => setStep(s)} style={{ flex: 1, padding: "12px", background: step === s ? "#b57bff" : "rgba(255,255,255,0.05)", color: step === s ? "#000" : "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>
            Step {s}: {s === 1 ? 'Inbox Zero' : s === 2 ? 'Stalled Tasks' : s === 3 ? 'Priorities' : 'Archive'}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div>
          <h3>1. Process Inbox to Zero</h3>
          <p style={{ color: "#a0a0c0" }}>You have {inboxItems.length} unclassified items in your Inbox. Assign them a pillar and quadrant, or convert them to notes.</p>
          {/* We just direct them to the Inbox tab conceptually, or list them here. Let's list a mini summary */}
          <ul style={{ background: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 8, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {inboxItems.map(i => <li key={i.id} style={{ color: "#fbbf24" }}>• {i.title}</li>)}
          </ul>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3>2. Review Overdue & Stalled</h3>
          <p style={{ color: "#a0a0c0" }}>These {stalledTasks.length} tasks haven't seen an update in 14 days. Do them, delegate them, or drop them.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
            {stalledTasks.map(t => (
              <div key={t.id} style={{ background: "rgba(255,255,255,0.05)", padding: 12, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ margin: 0 }}>{t.title}</h4>
                  <span style={{ fontSize: 11, color: "#ff4d7e" }}>Stalled since {new Date(t.updatedAt).toLocaleDateString()}</span>
                </div>
                <button onClick={() => updateItem(t.id, { status: 'dropped' })} style={{ background: "transparent", border: "1px solid #ff4d7e", color: "#ff4d7e", borderRadius: 4, padding: "4px 8px", cursor: "pointer" }}>Drop Task</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3>3. Pick Next Week's Priorities (Max 3)</h3>
          <p style={{ color: "#a0a0c0" }}>You have chosen {priorityCount}/3 priorities.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
            {allActiveTasks.map(t => (
              <div key={t.id} style={{ background: "rgba(255,255,255,0.05)", padding: 12, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{t.title}</span>
                <button 
                  onClick={() => updateItem(t.id, { isPriority: !t.isPriority })} 
                  disabled={!t.isPriority && priorityCount >= 3}
                  style={{ background: t.isPriority ? "#00d97e" : "transparent", border: t.isPriority ? "none" : "1px solid #a0a0c0", color: t.isPriority ? "#000" : "#a0a0c0", borderRadius: 4, padding: "4px 8px", cursor: "pointer" }}>
                  {t.isPriority ? '★ Priority' : 'Mark Priority'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h3>4. Archive Finished Items</h3>
          <p style={{ color: "#a0a0c0" }}>You have {finishedItems.length} completed tasks ready to be archived.</p>
          {finishedItems.length > 0 && (
            <button onClick={archiveAllFinished} style={{ background: "#4d9eff", color: "#000", border: "none", padding: "12px 24px", borderRadius: 8, cursor: "pointer", fontWeight: "bold", marginTop: 16 }}>
              Archive All Finished
            </button>
          )}
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
             {finishedItems.map(t => (
                <div key={t.id} style={{ background: "rgba(0,217,126,0.1)", color: "#00d97e", padding: "8px 12px", borderRadius: 6 }}>
                  ✓ {t.title}
                </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};
