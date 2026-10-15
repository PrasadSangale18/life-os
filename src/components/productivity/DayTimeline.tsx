import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, 
  Clock, 
  RotateCcw,
  Play
} from 'lucide-react';
import type { Item } from '../../types';
import { useStore } from '../../store';
import { PILLARS } from '../../theme/tokens';

interface DayTimelineProps {
  tasks: Item[];
  onStartFocus: (task: Item) => void;
  onEditTask: (task: Item) => void;
}

export const DayTimeline: React.FC<DayTimelineProps> = ({
  tasks,
  onStartFocus,
  onEditTask
}) => {
  const { updateItem } = useStore();

  // Current real-world time tracker
  const [currentMinutesFromMidnight, setCurrentMinutesFromMidnight] = useState<number>(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentMinutesFromMidnight(now.getHours() * 60 + now.getMinutes());
    }, 30000); // Check every 30s
    return () => clearInterval(timer);
  }, []);

  // Time boundaries: 07:00 to 22:00 (16 markers)
  const START_HOUR = 7;
  const END_HOUR = 22;

  const hours = useMemo(() => {
    const arr = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      const label = `${h.toString().padStart(2, '0')}:00`;
      arr.push({ hour: h, label });
    }
    return arr;
  }, []);

  // Filter tasks that have scheduled slots or are active today
  const scheduledTasks = useMemo(() => {
    return tasks
      .filter(t => t.scheduledStart)
      .sort((a, b) => (a.scheduledStart || '').localeCompare(b.scheduledStart || ''));
  }, [tasks]);

  const unscheduledTasks = useMemo(() => {
    return tasks.filter(t => !t.scheduledStart && t.status !== 'done' && t.status !== 'dropped');
  }, [tasks]);

  // Laser line position relative to 07:00 -> 22:00
  const startMin = START_HOUR * 60;
  const totalMinSpan = (END_HOUR - START_HOUR) * 60;
  const nowPercent = Math.max(0, Math.min(100, ((currentMinutesFromMidnight - startMin) / totalMinSpan) * 100));

  // 1-Click Circadian Auto-Scheduler: Slots unscheduled tasks by priority & energy peak
  const handleAutoSchedule = async () => {
    const sorted = [...unscheduledTasks].sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      if (a.quadrant === 'do' && b.quadrant !== 'do') return -1;
      if (a.quadrant !== 'do' && b.quadrant === 'do') return 1;
      return (a.estMinutes || 30) - (b.estMinutes || 30);
    });

    const circadianSlots = [
      '09:00', // Morning peak focus slot 1
      '10:30', // Morning peak focus slot 2
      '11:45', // Quick win before lunch
      '14:00', // Early afternoon administrative/execution
      '15:30', // Afternoon second wind
      '17:00', // Late afternoon wrap-up
      '19:00'  // Evening low-friction / reflection
    ];

    for (let i = 0; i < sorted.length && i < circadianSlots.length; i++) {
      const t = sorted[i];
      const slot = circadianSlots[i];
      await updateItem(t.id, { scheduledStart: slot });
    }
  };

  const handleClearSchedule = async () => {
    for (const t of scheduledTasks) {
      await updateItem(t.id, { scheduledStart: undefined });
    }
  };

  return (
    <div 
      className="glass-panel"
      style={{ 
        padding: "16px 20px", 
        display: "flex", 
        flexDirection: "column", 
        gap: 14 
      }}
    >
      {/* Header with Title and Auto-Schedule Button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ 
            width: 32, 
            height: 32, 
            borderRadius: 8, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            background: "rgba(56, 189, 248, 0.12)",
            color: "#38bdf8",
            border: "1px solid rgba(56, 189, 248, 0.25)"
          }}>
            <Clock size={16} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              Circadian Day Timeline
              <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-tertiary)", textTransform: "none" }}>
                ({scheduledTasks.length} scheduled)
              </span>
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--text-secondary)" }}>
              Interactive 24h schedule calibrated to human energy rhythms
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {scheduledTasks.length > 0 && (
            <button
              type="button"
              onClick={handleClearSchedule}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 10px",
                borderRadius: 8,
                background: "var(--bg-surface-elevated)",
                color: "var(--text-tertiary)",
                border: "1px solid var(--border-subtle)",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                cursor: "pointer"
              }}
              title="Clear scheduled slots"
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleAutoSchedule}
            disabled={unscheduledTasks.length === 0}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              background: "rgba(56, 189, 248, 0.12)",
              color: "#38bdf8",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              fontSize: 12,
              fontWeight: 650,
              cursor: unscheduledTasks.length === 0 ? "not-allowed" : "pointer",
              opacity: unscheduledTasks.length === 0 ? 0.45 : 1,
              transition: "all 0.15s ease"
            }}
            title="Auto-slot tasks according to natural circadian peaks"
          >
            <Sparkles size={13} fill="currentColor" />
            <span>Auto-Schedule Day</span>
          </button>
        </div>
      </div>

      {/* Horizontal / Grid Timeline Track */}
      <div style={{ position: "relative", width: "100%", overflowX: "auto", paddingBottom: 4 }}>
        <div style={{ minWidth: 680, display: "flex", flexDirection: "column", gap: 8 }}>
          
          {/* Time markers bar */}
          <div 
            style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(16, minmax(0, 1fr))",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              color: "var(--text-tertiary)",
              borderBottom: "1px solid var(--border-subtle)",
              paddingBottom: 4
            }}
          >
            {hours.map(h => (
              <span key={h.hour} style={{ textAlign: "left", paddingLeft: 4 }}>
                {h.label}
              </span>
            ))}
          </div>

          {/* Real-time laser line */}
          <div style={{ 
            position: "relative", 
            height: 72, 
            background: "var(--bg-surface-elevated)", 
            border: "1px solid var(--border-subtle)", 
            borderRadius: 10, 
            overflow: "hidden", 
            display: "flex", 
            alignItems: "center", 
            padding: 8 
          }}>
            
            {/* Hour grid lines */}
            <div 
              style={{ 
                position: "absolute", 
                inset: 0, 
                display: "grid", 
                gridTemplateColumns: "repeat(16, minmax(0, 1fr))", 
                pointerEvents: "none", 
                opacity: 0.15 
              }}
            >
              {hours.map(h => (
                <div key={h.hour} style={{ borderRight: "1px solid var(--text-primary)" }} />
              ))}
            </div>

            {/* Now line indicator */}
            {nowPercent > 0 && nowPercent < 100 && (
              <div 
                style={{ 
                  position: "absolute", 
                  top: 0, 
                  bottom: 0, 
                  left: `${nowPercent}%`, 
                  zIndex: 20, 
                  pointerEvents: "none", 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center" 
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5A1F", boxShadow: "0 0 8px #FF5A1F" }} />
                <div style={{ width: 1.5, height: "100%", background: "#FF5A1F", opacity: 0.75, boxShadow: "0 0 6px #FF5A1F" }} />
              </div>
            )}

            {/* Scheduled task chips on track */}
            <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center", gap: 8, overflowX: "auto", zIndex: 10 }}>
              {scheduledTasks.length === 0 ? (
                <div style={{ width: "100%", textAlign: "center", fontSize: 12, color: "var(--text-tertiary)", fontStyle: "italic", padding: "8px 0" }}>
                  No tasks placed on the timeline yet. Click "Auto-Schedule Day" to align your daily tasks.
                </div>
              ) : (
                scheduledTasks.map(t => {
                  const pillarColor = PILLARS.find(p => p.id === t.pillar)?.color || '#3b82f6';
                  return (
                    <div
                      key={t.id}
                      style={{ 
                        flexShrink: 0, 
                        padding: "8px 12px", 
                        borderRadius: 10, 
                        border: "1px solid var(--border-default)", 
                        background: "var(--bg-surface)", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 10, 
                        cursor: "pointer", 
                        boxShadow: "var(--shadow-sm)",
                        transition: "all 0.15s ease"
                      }}
                      onClick={() => onEditTask(t)}
                    >
                      <div 
                        style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: pillarColor }}
                      />
                      <div style={{ display: "flex", flexDirection: "column", maxWidth: 140 }}>
                        <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#FF5A1F", fontWeight: 700 }}>
                          {t.scheduledStart} ({t.estMinutes || 25}m)
                        </span>
                        <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 550, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.title}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartFocus(t);
                        }}
                        style={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: 6, 
                          background: "rgba(255, 90, 31, 0.15)", 
                          color: "#FF5A1F", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          cursor: "pointer",
                          border: "none"
                        }}
                        title="Start Focus"
                      >
                        <Play size={11} fill="currentColor" style={{ marginLeft: 1 }} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
