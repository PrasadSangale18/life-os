import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { selectInboxItems, selectStalledTasks } from '../utils/selectors';
import { PILLARS, QUADRANTS } from '../theme/tokens';
import type { PillarId, QuadrantId } from '../types';
import { 
  CalendarCheck, 
  Inbox, 
  AlertTriangle, 
  Star, 
  Archive, 
  Check, 
  Trash2, 
  FastForward, 
  Users, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';

export const WeeklyReview = () => {
  const items = useStore(s => s.items);
  const showPrivate = useStore(s => s.showPrivate);
  const updateItem = useStore(s => s.updateItem);
  const trashItem = useStore(s => s.trashItem);
  const archiveItem = useStore(s => s.archiveItem);

  const [step, setStep] = useState<number>(1);
  const [now] = useState(() => Date.now());

  const inboxItems = useMemo(() => selectInboxItems(items, showPrivate), [items, showPrivate]);
  
  const stalledTasks = useMemo(() => selectStalledTasks(items, now, showPrivate), [items, now, showPrivate]);

  const allActiveTasks = useMemo(() => {
    return items.filter(i => 
      i.type === 'task' && 
      !i.deletedAt && 
      !i.isArchived && 
      i.status !== 'done' && 
      i.status !== 'dropped' &&
      (showPrivate || !i.isPrivate)
    );
  }, [items, showPrivate]);

  const priorityItems = useMemo(() => {
    return allActiveTasks.filter(t => t.isPriority);
  }, [allActiveTasks]);

  const finishedItems = useMemo(() => {
    return items.filter(i => 
      i.type === 'task' && 
      !i.deletedAt && 
      !i.isArchived && 
      i.status === 'done' && 
      (showPrivate || !i.isPrivate)
    );
  }, [items, showPrivate]);

  // Pillar reflection stats
  const pillarStats = useMemo(() => {
    return PILLARS.map(p => {
      const pActive = allActiveTasks.filter(t => t.pillar === p.id).length;
      const pFinished = items.filter(t => 
        t.type === 'task' && 
        !t.deletedAt && 
        t.pillar === p.id && 
        t.status === 'done' && 
        (showPrivate || !t.isPrivate)
      ).length;
      return {
        pillar: p,
        active: pActive,
        finished: pFinished,
        total: pActive + pFinished
      };
    });
  }, [allActiveTasks, items, showPrivate]);

  const archiveAllFinished = async () => {
    for (const item of finishedItems) {
      await archiveItem(item.id);
    }
  };

  const STEPS = [
    { num: 1, title: 'Inbox Zero', icon: Inbox },
    { num: 2, title: 'Stalled Tasks', icon: AlertTriangle },
    { num: 3, title: 'Top Priorities', icon: Star },
    { num: 4, title: 'Pillars & Archive', icon: Archive },
    { num: 5, title: 'Summary', icon: CalendarCheck }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Wizard Header & Steps */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: "16px 20px", 
          display: "flex", 
          flexDirection: "column", 
          gap: 16,
          background: "var(--bg-surface)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(168,85,247,0.12)", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CalendarCheck size={16} />
            </div>
            <div>
              <div className="card-title" style={{ fontSize: 16 }}>Weekly Operating Review</div>
              <div className="text-secondary" style={{ fontSize: 12 }}>Close the loop on your week: clear inbox, resolve stalled tasks, calibrate pillar balance.</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button 
              onClick={() => setStep(1)} 
              className="btn-ghost" 
              style={{ fontSize: 12, padding: "5px 10px", gap: 4 }}
              title="Restart Review Process"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Step Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
          {STEPS.map(s => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            return (
              <button 
                key={s.num} 
                onClick={() => setStep(s.num)}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8, 
                  padding: "10px 12px", 
                  borderRadius: 8, 
                  background: isActive ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)", 
                  border: `1px solid ${isActive ? "var(--border-strong)" : "var(--border-subtle)"}`, 
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)", 
                  cursor: "pointer", 
                  textAlign: "left",
                  transition: "all 0.15s ease"
                }}
              >
                <div 
                  style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: "50%", 
                    background: isActive ? "var(--accent-primary)" : (isCompleted ? "#10b981" : "rgba(255,255,255,0.06)"), 
                    color: (isActive || isCompleted) ? "#000" : "var(--text-tertiary)", 
                    fontSize: 10, 
                    fontWeight: 700, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  {isCompleted ? <Check size={11} strokeWidth={3} /> : s.num}
                </div>
                <div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <div style={{ fontSize: 12, fontWeight: isActive ? 600 : 450 }}>{s.title}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 1: Inbox Zero */}
      {step === 1 && (
        <div className="glass-panel" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div className="card-title" style={{ fontSize: 15 }}>1. Process Inbox to Zero</div>
            <div className="text-secondary" style={{ fontSize: 13, marginTop: 2 }}>
              You have <strong style={{ color: "var(--text-primary)" }}>{inboxItems.length}</strong> unclassified items. Assign a pillar and quadrant to empty the inbox queue.
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {inboxItems.map(i => (
              <div 
                key={i.id} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  padding: "10px 14px", 
                  borderRadius: 8, 
                  background: "rgba(255,255,255,0.03)", 
                  border: "1px solid var(--border-subtle)",
                  flexWrap: "wrap",
                  gap: 10
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 200 }}>
                  <span style={{ fontSize: 13.5, color: "var(--text-primary)", fontWeight: 500 }}>{i.title}</span>
                  <span className="ui-pill" style={{ alignSelf: "flex-start", fontSize: 10, color: "#f59e0b" }}>Needs Classification</span>
                </div>

                {/* 1-Click Triage Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {/* Pillar Selector */}
                  <select
                    value={i.pillar || ''}
                    onChange={e => updateItem(i.id, { pillar: (e.target.value as PillarId) || undefined })}
                    className="ui-select"
                    style={{ padding: "4px 8px", fontSize: 11.5, height: 28 }}
                  >
                    <option value="">Select Pillar...</option>
                    {PILLARS.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  {/* Quadrant Selector */}
                  <select
                    value={i.quadrant || ''}
                    onChange={e => updateItem(i.id, { quadrant: (e.target.value as QuadrantId) || undefined })}
                    className="ui-select"
                    style={{ padding: "4px 8px", fontSize: 11.5, height: 28 }}
                  >
                    <option value="">Assign Quadrant...</option>
                    {QUADRANTS.map(q => (
                      <option key={q.id} value={q.id}>{q.name} ({q.label})</option>
                    ))}
                  </select>

                  {/* Trash button */}
                  <button
                    onClick={() => trashItem(i.id)}
                    className="btn-ghost"
                    style={{ padding: "5px 8px", color: "var(--text-tertiary)" }}
                    title="Move to Trash"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {inboxItems.length === 0 && (
              <div style={{ color: "#10b981", fontSize: 13, padding: "20px 0", display: "flex", alignItems: "center", gap: 8 }}>
                <Check size={16} strokeWidth={2.5} />
                <span>Inbox is zero! You have processed all unclassified capture items.</span>
              </div>
            )}
          </div>

          <button onClick={() => setStep(2)} className="btn-primary" style={{ alignSelf: "flex-start", marginTop: 8, gap: 6 }}>
            <span>Continue to Stalled Tasks</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Step 2: Overdue & Stalled */}
      {step === 2 && (
        <div className="glass-panel" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div className="card-title" style={{ fontSize: 15 }}>2. Review Overdue & Stalled Tasks</div>
            <div className="text-secondary" style={{ fontSize: 13, marginTop: 2 }}>
              These <strong style={{ color: "var(--text-primary)" }}>{stalledTasks.length}</strong> tasks have seen zero updates in 14+ days. Make a conscious choice: reschedule, delegate, drop, or archive.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stalledTasks.map(t => (
              <div 
                key={t.id} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  padding: "12px 14px", 
                  borderRadius: 8, 
                  background: "rgba(255,255,255,0.03)", 
                  border: "1px solid var(--border-subtle)",
                  flexWrap: "wrap",
                  gap: 10
                }}
              >
                <div>
                  <div style={{ fontSize: 13.5, color: "var(--text-primary)", fontWeight: 500 }}>{t.title}</div>
                  <div className="text-meta" style={{ fontSize: 11, color: "#f43f5e", marginTop: 2 }}>
                    Stalled since {new Date(t.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Stalled Choice Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={() => updateItem(t.id, { deadline: now + 7 * 86400000 })}
                    className="btn-secondary"
                    style={{ fontSize: 11.5, padding: "5px 9px", gap: 4 }}
                    title="Reschedule deadline by 7 days"
                  >
                    <FastForward size={11} />
                    <span>+7d</span>
                  </button>
                  <button
                    onClick={() => updateItem(t.id, { quadrant: 'delegate' })}
                    className="btn-secondary"
                    style={{ fontSize: 11.5, padding: "5px 9px", gap: 4 }}
                    title="Move to Delegate quadrant"
                  >
                    <Users size={11} />
                    <span>Delegate</span>
                  </button>
                  <button 
                    onClick={() => updateItem(t.id, { status: 'dropped' })} 
                    className="btn-danger"
                    style={{ fontSize: 11.5, padding: "5px 9px" }}
                    title="Drop task"
                  >
                    Drop
                  </button>
                  <button 
                    onClick={() => archiveItem(t.id)} 
                    className="btn-ghost"
                    style={{ fontSize: 11.5, padding: "5px 9px" }}
                    title="Archive task"
                  >
                    Archive
                  </button>
                </div>
              </div>
            ))}

            {stalledTasks.length === 0 && (
              <div style={{ color: "#10b981", fontSize: 13, padding: "20px 0", display: "flex", alignItems: "center", gap: 8 }}>
                <Check size={16} strokeWidth={2.5} />
                <span>Zero stalled tasks. Your workflow velocity is healthy!</span>
              </div>
            )}
          </div>

          <button onClick={() => setStep(3)} className="btn-primary" style={{ alignSelf: "flex-start", marginTop: 8, gap: 6 }}>
            <span>Continue to Top Priorities</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Step 3: Top 3 Priorities */}
      {step === 3 && (
        <div className="glass-panel" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div className="card-title" style={{ fontSize: 15 }}>3. Pick Top 3 Weekly Priorities</div>
            <div className="text-secondary" style={{ fontSize: 13, marginTop: 2 }}>
              Focus beats volume. Select up to 3 needle-moving objectives ({priorityItems.length}/3 chosen).
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }}>
            {allActiveTasks.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, background: t.isPriority ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${t.isPriority ? "rgba(245,158,11,0.3)" : "var(--border-subtle)"}` }}>
                <span style={{ fontSize: 13.5, color: "var(--text-primary)", fontWeight: t.isPriority ? 600 : 450 }}>{t.title}</span>
                <button 
                  onClick={() => updateItem(t.id, { isPriority: !t.isPriority })} 
                  disabled={!t.isPriority && priorityItems.length >= 3}
                  className={t.isPriority ? "btn-secondary" : "btn-ghost"}
                  style={{ 
                    fontSize: 12, 
                    padding: "5px 12px", 
                    color: t.isPriority ? "#f59e0b" : "var(--text-secondary)",
                    borderColor: t.isPriority ? "rgba(245,158,11,0.4)" : "transparent",
                    gap: 4
                  }}
                >
                  <Star size={12} fill={t.isPriority ? "#f59e0b" : "none"} />
                  <span>{t.isPriority ? 'Top Priority' : 'Select'}</span>
                </button>
              </div>
            ))}
          </div>

          <button onClick={() => setStep(4)} className="btn-primary" style={{ alignSelf: "flex-start", marginTop: 8, gap: 6 }}>
            <span>Continue to Pillar Balance & Archive</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Step 4: Pillar Balance Reflection & Archive Finished */}
      {step === 4 && (
        <div className="glass-panel" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div className="card-title" style={{ fontSize: 15 }}>4. Pillar Balance & Complete Work Archive</div>
            <div className="text-secondary" style={{ fontSize: 13, marginTop: 2 }}>
              Inspect distribution across all 5 life pillars and archive completed tasks ({finishedItems.length} items) for clean weekly momentum.
            </div>
          </div>

          {/* Pillar Distribution Visualizer */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            {pillarStats.map(({ pillar, active, finished, total }) => (
              <div 
                key={pillar.id}
                style={{ 
                  padding: "12px 14px", 
                  borderRadius: 8, 
                  background: "rgba(255,255,255,0.02)", 
                  border: `1px solid ${pillar.border}`,
                  display: "flex", 
                  flexDirection: "column", 
                  gap: 6 
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: pillar.color }}>{pillar.name}</span>
                  <span className="text-meta" style={{ fontSize: 11 }}>{total} total</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-secondary)" }}>
                  <span>{active} active</span>
                  <span>{finished} done</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 9999, overflow: "hidden" }}>
                  <div 
                    style={{ 
                      height: "100%", 
                      width: total > 0 ? `${Math.round((finished / total) * 100)}%` : '0%', 
                      background: pillar.color, 
                      borderRadius: 9999 
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Archive Action */}
          {finishedItems.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 6 }}>
              <button 
                onClick={archiveAllFinished} 
                className="btn-primary"
                style={{ alignSelf: "flex-start", padding: "10px 18px", gap: 6 }}
              >
                <Archive size={14} />
                <span>Archive All {finishedItems.length} Finished Items</span>
              </button>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                {finishedItems.map(t => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 6, background: "rgba(16,185,129,0.06)", color: "#10b981", fontSize: 13 }}>
                    <Check size={14} strokeWidth={2.5} />
                    <span>{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {finishedItems.length === 0 && (
            <div style={{ color: "var(--text-tertiary)", fontSize: 13, padding: "12px 0" }}>
              No completed tasks currently pending archive.
            </div>
          )}

          <button onClick={() => setStep(5)} className="btn-primary" style={{ alignSelf: "flex-start", marginTop: 8, gap: 6 }}>
            <span>Complete Review & View Summary</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Step 5: Grounded Summary */}
      {step === 5 && (
        <div className="glass-panel" style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(16,185,129,0.14)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div className="card-title" style={{ fontSize: 16 }}>Weekly Operating Review Completed</div>
              <div className="text-secondary" style={{ fontSize: 12.5 }}>All loop closures recorded in local persistence.</div>
            </div>
          </div>

          {/* Summary Checklist Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, color: inboxItems.length === 0 ? "#10b981" : "#f59e0b", fontSize: 13, fontWeight: 600 }}>
                <Inbox size={15} />
                <span>Inbox Status</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {inboxItems.length === 0 ? "Inbox is zero. All captured items sorted." : `${inboxItems.length} items remain in inbox.`}
              </div>
            </div>

            <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, color: stalledTasks.length === 0 ? "#10b981" : "#f43f5e", fontSize: 13, fontWeight: 600 }}>
                <AlertTriangle size={15} />
                <span>Stalled Backlog</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {stalledTasks.length === 0 ? "Zero stagnant tasks older than 14 days." : `${stalledTasks.length} tasks still need decision.`}
              </div>
            </div>

            <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#f59e0b", fontSize: 13, fontWeight: 600 }}>
                <Star size={15} fill="#f59e0b" />
                <span>Weekly Priorities ({priorityItems.length}/3)</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                {priorityItems.length > 0 ? (
                  priorityItems.map(p => (
                    <div key={p.id} style={{ fontSize: 12, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 5 }}>
                      <span>•</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>No priorities locked yet.</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 6 }}>
            <button 
              onClick={() => setStep(1)} 
              className="btn-secondary" 
              style={{ padding: "8px 16px", fontSize: 13 }}
            >
              Start New Review Cycle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
