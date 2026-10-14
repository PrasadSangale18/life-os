import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, 
  Sparkles, 
  Play, 
  RotateCcw
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

  // Time boundaries: 07:00 to 22:00 (15 hours)
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

  // Laser indicator position
  const nowPercent = useMemo(() => {
    const startMins = START_HOUR * 60;
    const endMins = END_HOUR * 60;
    if (currentMinutesFromMidnight < startMins) return 0;
    if (currentMinutesFromMidnight > endMins) return 100;
    return ((currentMinutesFromMidnight - startMins) / (endMins - startMins)) * 100;
  }, [currentMinutesFromMidnight]);

  // Tasks that have a scheduledStart (format "HH:mm")
  const scheduledTasks = useMemo(() => {
    return tasks.filter(t => t.scheduledStart && t.status !== 'dropped');
  }, [tasks]);

  // Unscheduled tasks due today or in top priorities
  const unscheduledTasks = useMemo(() => {
    return tasks.filter(t => !t.scheduledStart && t.status !== 'done' && t.status !== 'dropped');
  }, [tasks]);

  // Auto-Schedule Day Engine (Circadian cognitive matching)
  const handleAutoSchedule = async () => {
    const circadianSlots = [
      '09:00', // Morning peak 1
      '10:15', // Morning peak 2
      '11:30', // Pre-lunch
      '14:00', // Afternoon admin / low friction
      '15:15', // Afternoon flow
      '16:30', // Late sprint
      '18:00'  // Wrap-up
    ];

    // Sort unscheduled: Q1 first, highest priority, shortest duration first
    const sorted = [...unscheduledTasks].sort((a, b) => {
      if (a.quadrant === 'do' && b.quadrant !== 'do') return -1;
      if (a.quadrant !== 'do' && b.quadrant === 'do') return 1;
      if (a.isPriority && !b.isPriority) return -1;
      return (a.estMinutes || 25) - (b.estMinutes || 25);
    });

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
    <div className="w-full bg-[#0D1117] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
      {/* Header with Title and Auto-Schedule Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FF5A1F]/20 text-[#FF5A1F] border border-[#FF5A1F]/30 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              Circadian Day Timeline
              <span className="text-[10px] text-slate-400 font-normal lowercase">
                ({scheduledTasks.length} scheduled)
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive 24h schedule calibrated to human energy rhythms
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {scheduledTasks.length > 0 && (
            <button
              onClick={handleClearSchedule}
              className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white text-[11px] font-mono transition-all flex items-center gap-1"
              title="Clear scheduled slots"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}

          <button
            onClick={handleAutoSchedule}
            disabled={unscheduledTasks.length === 0}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF5A1F] to-[#EA580C] hover:opacity-90 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_2px_12px_rgba(255,90,31,0.3)] transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            Auto-Schedule Day
          </button>
        </div>
      </div>

      {/* Horizontal / Grid Timeline Track */}
      <div className="relative w-full overflow-x-auto pb-2">
        <div className="min-w-[700px] flex flex-col gap-2">
          
          {/* Time markers bar */}
          <div 
            className="text-[10px] font-mono text-slate-500 border-b border-white/[0.06] pb-1"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}
          >
            {hours.map(h => (
              <span key={h.hour} className="text-left pl-1">
                {h.label}
              </span>
            ))}
          </div>

          {/* Real-time laser line */}
          <div className="relative h-20 bg-white/[0.015] border border-white/[0.05] rounded-xl overflow-hidden flex items-center p-2">
            
            {/* Hour grid lines */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}
            >
              {hours.map(h => (
                <div key={h.hour} className="border-r border-white" />
              ))}
            </div>

            {/* Now line indicator */}
            {nowPercent > 0 && nowPercent < 100 && (
              <div 
                className="absolute top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center"
                style={{ left: `${nowPercent}%` }}
              >
                <div className="w-2 h-2 rounded-full bg-[#FF5A1F] shadow-[0_0_8px_#FF5A1F]" />
                <div className="w-[1.5px] h-full bg-[#FF5A1F]/70 shadow-[0_0_8px_#FF5A1F]" />
              </div>
            )}

            {/* Scheduled task chips on track */}
            <div className="relative w-full flex items-center gap-2 overflow-x-auto z-10">
              {scheduledTasks.length === 0 ? (
                <div className="w-full text-center text-xs text-slate-500 italic py-2">
                  No tasks placed on the timeline yet. Click "Auto-Schedule Day" to align your daily tasks.
                </div>
              ) : (
                scheduledTasks.map(t => {
                  const pillarColor = PILLARS.find(p => p.id === t.pillar)?.color || '#3b82f6';
                  return (
                    <div
                      key={t.id}
                      className="group shrink-0 p-2.5 rounded-xl border border-white/[0.12] bg-[#161B22]/90 hover:border-[#FF5A1F] transition-all flex items-center gap-2.5 cursor-pointer shadow-md"
                      onClick={() => onEditTask(t)}
                    >
                      <div 
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: pillarColor }}
                      />
                      <div className="flex flex-col max-w-[140px]">
                        <span className="text-[10px] font-mono text-[#FF5A1F] font-bold">
                          {t.scheduledStart} ({t.estMinutes || 25}m)
                        </span>
                        <span className="text-xs text-slate-200 truncate font-medium">
                          {t.title}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartFocus(t);
                        }}
                        className="w-6 h-6 rounded-lg bg-[#FF5A1F]/20 text-[#FF5A1F] hover:bg-[#FF5A1F] hover:text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100"
                        title="Start Focus"
                      >
                        <Play className="w-3 h-3 fill-current ml-0.5" />
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
