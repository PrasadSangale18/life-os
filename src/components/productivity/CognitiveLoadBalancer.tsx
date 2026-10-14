import React, { useMemo, useState } from 'react';
import { 
  BatteryCharging, 
  AlertTriangle, 
  CheckCircle2, 
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
    <div className="w-full bg-[#0D1117] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm transition-all">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
            isOverloaded 
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              : loadPercent >= 80 
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          }`}>
            {isOverloaded ? <AlertTriangle className="w-4 h-4" /> : <BatteryCharging className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Cognitive Capacity Balancer
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                isOverloaded 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : loadPercent >= 80 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {loadPercent}% Capacity ({Math.round(totalPlannedMinutes / 60 * 10) / 10}h / {Math.round(capacityMinutes / 60 * 10) / 10}h)
              </span>

              {velocityTelemetry.hasData && velocityTelemetry.ratio !== 1.0 && (
                <button
                  onClick={() => setApplyVelocityCalibration(!applyVelocityCalibration)}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold flex items-center gap-1 transition-all ${
                    applyVelocityCalibration
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-white/[0.04] text-slate-400 border border-white/[0.08] hover:text-slate-200'
                  }`}
                  title="Click to toggle whether capacity accounts for your historical flow focus multiplier"
                >
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                  <span>{applyVelocityCalibration ? `Calibrated (${velocityTelemetry.ratio}×)` : 'Raw Estimate'}</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isOverloaded 
                ? (velocityTelemetry.hasData && velocityTelemetry.ratio > 1.0 && applyVelocityCalibration
                    ? `Planning Fallacy Alert: Flow telemetry shows tasks take ~${velocityTelemetry.ratio}× longer. Calibrated load is ${totalPlannedMinutes}m vs ${capacityMinutes}m budget.`
                    : `Energy pulse ${energyRating}/5: Workload exceeds cognitive budget by ${totalPlannedMinutes - capacityMinutes} mins. Risk of burnout.`)
                : loadPercent >= 80 
                ? `Energy pulse ${energyRating}/5: Near optimal daily throughput. Avoid adding more tasks.`
                : `Energy pulse ${energyRating}/5: Ample cognitive capacity available for deep focus blocks.`}
            </p>
          </div>
        </div>

        {/* Quick Action Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          {isOverloaded && (
            <button
              onClick={handleAutoBalance}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 hover:opacity-95 transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Auto-Balance Day</span>
            </button>
          )}

          <button
            onClick={onOpenDecisionDuel}
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5"
            title="When stuck or overwhelmed, let pairwise choice find your #1 task"
          >
            <Swords className="w-3.5 h-3.5 text-[#FF5A1F]" />
            <span>Decide For Me</span>
          </button>

          <button
            onClick={onOpenEveningChronicle}
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5"
            title="Synthesize today's accomplishments and reflections"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Daily Chronicle</span>
          </button>

          {staleCount > 0 && (
            <button
              onClick={onOpenDecayRadar}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all flex items-center gap-1.5"
              title="Guilt-free triage for tasks neglected > 14 days"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Backlog Decay ({staleCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Capacity Bar */}
      <div className="flex flex-col gap-1.5">
        <div className="w-full h-2.5 bg-white/[0.04] rounded-full overflow-hidden p-0.5 border border-white/[0.06] relative">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isOverloaded 
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                : loadPercent >= 80 
                ? 'bg-gradient-to-r from-[#FF5A1F] to-amber-500 shadow-[0_0_10px_rgba(255,90,31,0.5)]'
                : 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
            }`}
            style={{ width: `${Math.min(100, loadPercent)}%` }}
          />
          {/* 100% capacity threshold marker */}
          <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-white/40" title="Max Daily Capacity" />
        </div>

        {/* Legend / Metrics */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>0h (Start)</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3 h-3" />
            {pendingTasks.length} pending tasks • ~{totalPlannedMinutes} mins
          </span>
          <span className="text-slate-300 font-bold">{Math.round(capacityMinutes / 60 * 10) / 10}h Max Limit</span>
        </div>
      </div>

      {balancedNotification && (
        <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{balancedNotification}</span>
        </div>
      )}
    </div>
  );
};
