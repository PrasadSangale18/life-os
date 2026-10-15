import React, { useMemo, useState } from 'react';
import { 
  BatteryCharging, 
  AlertTriangle, 
  RotateCcw, 
  Swords, 
  BookOpen, 
  Clock,
  ShieldCheck,
  Zap
} from 'lucide-react';
import type { Item } from '../../types';
import { useStore } from '../../store';

interface CognitiveLoadBalancerProps {
  tasks: Item[];
  onOpenDecisionDuel: () => void;
  onOpenEveningChronicle: () => void;
  onOpenDecayRadar: () => void;
}

export const CognitiveLoadBalancer: React.FC<CognitiveLoadBalancerProps> = ({
  tasks,
  onOpenDecisionDuel,
  onOpenEveningChronicle,
  onOpenDecayRadar
}) => {
  const { items, updateItem } = useStore();
  const [balancedNotification, setBalancedNotification] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Retrieve today's pulse item if logged
  const todayPulse = useMemo(() => {
    return items.find(i => 
      i.type === 'journal' && 
      !i.deletedAt && 
      i.title === `Pulse-${todayStr}`
    );
  }, [items, todayStr]);

  const energyRating = todayPulse?.energyRating || 3;

  // Calibrate daily capacity based on human circadian energy levels
  const capacityMinutes = useMemo(() => {
    const energyMap: Record<number, number> = {
      1: 90,   // Low/Recovery: 1.5 hrs
      2: 150,  // Gentle Focus: 2.5 hrs
      3: 240,  // Baseline: 4.0 hrs
      4: 330,  // High Readiness: 5.5 hrs
      5: 420   // Peak Flow: 7.0 hrs
    };
    return energyMap[energyRating] || 240;
  }, [energyRating]);

  // Velocity & Time-Blindness Calibrator: Compare historical actual focus minutes vs estimates
  const velocityTelemetry = useMemo(() => {
    const calibratedTasks = items.filter(i => 
      !i.deletedAt && 
      i.type === 'task' && 
      i.status === 'done' && 
      i.actualMinutes && 
      i.actualMinutes > 0
    );

    if (calibratedTasks.length === 0) {
      return { ratio: 1.0, count: 0, hasData: false };
    }

    let sumActual = 0;
    let sumEst = 0;
    calibratedTasks.forEach(t => {
      sumActual += t.actualMinutes || 25;
      sumEst += t.estMinutes || 25;
    });

    const ratio = sumEst > 0 ? Math.round((sumActual / sumEst) * 100) / 100 : 1.0;
    return { 
      ratio: Math.max(0.5, Math.min(3.0, ratio)), 
      count: calibratedTasks.length, 
      hasData: true 
    };
  }, [items]);

  const [applyVelocityCalibration, setApplyVelocityCalibration] = useState<boolean>(true);

  // Active pending tasks assigned or scheduled for today
  const pendingTasks = useMemo(() => {
    return tasks.filter(t => t.status !== 'done' && t.status !== 'dropped');
  }, [tasks]);

  const rawPlannedMinutes = useMemo(() => {
    return pendingTasks.reduce((acc, t) => acc + (t.estMinutes || 25), 0);
  }, [pendingTasks]);

  const totalPlannedMinutes = useMemo(() => {
    if (applyVelocityCalibration && velocityTelemetry.hasData && velocityTelemetry.ratio !== 1.0) {
      return Math.round(rawPlannedMinutes * velocityTelemetry.ratio);
    }
    return rawPlannedMinutes;
  }, [rawPlannedMinutes, applyVelocityCalibration, velocityTelemetry]);

  const loadPercent = Math.round((totalPlannedMinutes / (capacityMinutes || 1)) * 100);
  const isOverloaded = loadPercent > 100;

  // Stale tasks detected in backlog (>14 days or postponed >= 3 times)
  const staleCount = useMemo(() => {
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    return items.filter(i => 
      (i.type === 'task' || !i.type) && 
      !i.deletedAt && 
      !i.isArchived && 
      i.status !== 'done' && 
      i.status !== 'dropped' && 
      ((i.createdAt && i.createdAt < fourteenDaysAgo) || (i.postponedCount && i.postponedCount >= 3))
    ).length;
  }, [items]);

  // 1-Click Auto-Balance Engine: Sheds non-urgent tasks to tomorrow until within capacity
  const handleAutoBalance = async () => {
    if (!isOverloaded) return;

    // Sort pending tasks by sacrifice order: Q4, Q3, lowest priority, longest duration
    const sacrificeCandidates = [...pendingTasks].sort((a, b) => {
      // Prioritize preserving Q1 ("do") and critical priority
      if (a.quadrant === 'do' && b.quadrant !== 'do') return 1;
      if (a.quadrant !== 'do' && b.quadrant === 'do') return -1;
      if (a.isPriority && !b.isPriority) return 1;
      if (!a.isPriority && b.isPriority) return -1;
      return (b.estMinutes || 25) - (a.estMinutes || 25);
    });

    let currentLoad = totalPlannedMinutes;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    const deferredTitles: string[] = [];

    for (const t of sacrificeCandidates) {
      if (currentLoad <= capacityMinutes) break;
      await updateItem(t.id, {
        deadline: tomorrow.getTime(),
        scheduledStart: undefined,
        postponedCount: (t.postponedCount || 0) + 1
      });
      currentLoad -= (t.estMinutes || 25);
      deferredTitles.push(t.title);
    }

    setBalancedNotification(`Balanced! Rescheduled ${deferredTitles.length} tasks to protect your energy.`);
    setTimeout(() => setBalancedNotification(null), 4000);
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
      {/* Header Row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ 
            width: 36, 
            height: 36, 
            borderRadius: 10, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            flexShrink: 0,
            background: isOverloaded ? "rgba(239, 68, 68, 0.12)" : loadPercent >= 80 ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
            color: isOverloaded ? "#ef4444" : loadPercent >= 80 ? "#f59e0b" : "#10b981",
            border: `1px solid ${isOverloaded ? "rgba(239, 68, 68, 0.28)" : loadPercent >= 80 ? "rgba(245, 158, 11, 0.28)" : "rgba(16, 185, 129, 0.28)"}`
          }}>
            {isOverloaded ? <AlertTriangle size={18} /> : <BatteryCharging size={18} />}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", color: "var(--text-primary)" }}>
                Cognitive Capacity Balancer
              </h3>
              <span style={{ 
                fontSize: 10.5, 
                fontWeight: 700, 
                fontFamily: "var(--font-mono)", 
                padding: "2px 8px", 
                borderRadius: 9999,
                background: isOverloaded ? "rgba(239, 68, 68, 0.12)" : loadPercent >= 80 ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
                color: isOverloaded ? "#ef4444" : loadPercent >= 80 ? "#f59e0b" : "#10b981",
                border: `1px solid ${isOverloaded ? "rgba(239, 68, 68, 0.25)" : loadPercent >= 80 ? "rgba(245, 158, 11, 0.25)" : "rgba(16, 185, 129, 0.25)"}`
              }}>
                {loadPercent}% Capacity ({Math.round(totalPlannedMinutes / 60 * 10) / 10}h / {Math.round(capacityMinutes / 60 * 10) / 10}h)
              </span>

              {velocityTelemetry.hasData && velocityTelemetry.ratio !== 1.0 && (
                <button
                  type="button"
                  onClick={() => setApplyVelocityCalibration(!applyVelocityCalibration)}
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                    padding: "2px 8px",
                    borderRadius: 9999,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    cursor: "pointer",
                    background: applyVelocityCalibration ? "rgba(245, 158, 11, 0.15)" : "var(--bg-surface-elevated)",
                    color: applyVelocityCalibration ? "#f59e0b" : "var(--text-tertiary)",
                    border: `1px solid ${applyVelocityCalibration ? "rgba(245, 158, 11, 0.35)" : "var(--border-subtle)"}`,
                    transition: "all 0.15s ease"
                  }}
                  title="Toggle velocity-calibrated workload estimate"
                >
                  <Zap size={11} color="#f59e0b" />
                  <span>{applyVelocityCalibration ? `Calibrated (${velocityTelemetry.ratio}×)` : 'Raw Estimate'}</span>
                </button>
              )}
            </div>
            <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "var(--text-secondary)", lineHeight: 1.35 }}>
              {isOverloaded 
                ? (velocityTelemetry.hasData && velocityTelemetry.ratio > 1.0 && applyVelocityCalibration
                    ? `Planning Fallacy Alert: Historical focus multiplier shows tasks take ~${velocityTelemetry.ratio}× longer. Calibrated load is ${totalPlannedMinutes}m vs ${capacityMinutes}m budget.`
                    : `Energy pulse ${energyRating}/5: Workload exceeds cognitive budget by ${totalPlannedMinutes - capacityMinutes} mins. Risk of burnout.`)
                : loadPercent >= 80 
                ? `Energy pulse ${energyRating}/5: Near optimal daily throughput. Avoid adding more tasks.`
                : `Energy pulse ${energyRating}/5: Ample cognitive capacity available for deep focus blocks.`}
            </p>
          </div>
        </div>

        {/* Quick Action Triggers */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {isOverloaded && (
            <button
              type="button"
              onClick={handleAutoBalance}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                background: "rgba(239, 68, 68, 0.12)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.35)",
                fontSize: 12,
                fontWeight: 650,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.22)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)"}
              title="Shed lower-priority tasks to tomorrow"
            >
              <ShieldCheck size={14} color="#ef4444" />
              <span>Auto-Balance Day</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenDecisionDuel}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 8,
              background: "var(--bg-surface-elevated)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            title="When stuck or overwhelmed, let pairwise choice find your #1 task"
          >
            <Swords size={13} color="#FF5A1F" />
            <span>Decide For Me</span>
          </button>

          <button
            type="button"
            onClick={onOpenEveningChronicle}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 8,
              background: "var(--bg-surface-elevated)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            title="Synthesize today's accomplishments and reflections"
          >
            <BookOpen size={13} color="#3b82f6" />
            <span>Daily Chronicle</span>
          </button>

          {staleCount > 0 && (
            <button
              type="button"
              onClick={onOpenDecayRadar}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                background: "rgba(245, 158, 11, 0.1)",
                color: "#f59e0b",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              title="Guilt-free triage for tasks neglected > 14 days"
            >
              <RotateCcw size={13} color="#f59e0b" />
              <span>Backlog Decay ({staleCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Capacity Bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ 
          width: "100%", 
          height: 8, 
          background: "var(--bg-surface-elevated)", 
          borderRadius: 9999, 
          overflow: "hidden", 
          border: "1px solid var(--border-subtle)", 
          position: "relative" 
        }}>
          <div 
            style={{ 
              height: "100%", 
              borderRadius: 9999,
              transition: "all 0.4s ease",
              width: `${Math.min(100, loadPercent)}%`,
              background: isOverloaded 
                ? "linear-gradient(90deg, #f59e0b, #ef4444)" 
                : loadPercent >= 80 
                ? "linear-gradient(90deg, #FF5A1F, #f59e0b)" 
                : "linear-gradient(90deg, #10b981, #06b6d4)",
              boxShadow: isOverloaded ? "0 0 10px rgba(239, 68, 68, 0.35)" : "none"
            }}
          />
          {/* 100% capacity threshold marker */}
          <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 2, background: "rgba(255,255,255,0.4)" }} title="Max Daily Capacity" />
        </div>

        {/* Legend / Metrics */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
          <span>0h (Start)</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-secondary)" }}>
            <Clock size={12} />
            <span>{pendingTasks.length} pending tasks • ~{totalPlannedMinutes} mins</span>
          </span>
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{Math.round(capacityMinutes / 60 * 10) / 10}h Max Limit</span>
        </div>
      </div>

      {balancedNotification && (
        <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#10b981", fontSize: 12, fontWeight: 600 }}>
          {balancedNotification}
        </div>
      )}
    </div>
  );
};
