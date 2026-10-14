import React, { useState, useMemo } from 'react';
import { 
  RotateCcw, 
  X, 
  Archive, 
  Bookmark, 
  Flame, 
  Check, 
  ShieldCheck
} from 'lucide-react';
import type { Item } from '../../types';
import { useStore } from '../../store';

interface BacklogDecayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBustResistance?: (task: Item) => void;
}

export const BacklogDecayModal: React.FC<BacklogDecayModalProps> = ({
  isOpen,
  onClose,
  onBustResistance
}) => {
  const { items, updateItem, archiveItem } = useStore();
  const [triagedFeedback, setTriagedFeedback] = useState<string | null>(null);

  const fourteenDaysAgo = useMemo(() => Date.now() - 14 * 24 * 60 * 60 * 1000, []);

  // Filter for stale or repeatedly postponed tasks
  const staleTasks = useMemo(() => {
    return items.filter(i => 
      (i.type === 'task' || !i.type) && 
      !i.deletedAt && 
      !i.isArchived && 
      i.status !== 'done' && 
      i.status !== 'dropped' && 
      ((i.createdAt && i.createdAt < fourteenDaysAgo) || (i.postponedCount && i.postponedCount >= 3))
    ).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }, [items, fourteenDaysAgo]);

  const handleArchive = (t: Item) => {
    archiveItem(t.id);
    showFeedback(`Archived without guilt: "${t.title}"`);
  };

  const handleDemoteToSomeday = (t: Item) => {
    updateItem(t.id, {
      quadrant: undefined,
      deadline: undefined,
      scheduledStart: undefined,
      isPriority: false,
      tags: [...(t.tags || []), 'someday-maybe']
    });
    showFeedback(`Demoted to Someday/Maybe reference: "${t.title}"`);
  };

  const handleRecommit = (t: Item) => {
    updateItem(t.id, {
      postponedCount: 0,
      createdAt: Date.now()
    });
    showFeedback(`Recommitted to active queue: "${t.title}"`);
  };

  const handleArchiveAll = () => {
    staleTasks.forEach(t => archiveItem(t.id));
    showFeedback(`Archived all ${staleTasks.length} stale tasks without guilt!`);
    setTimeout(() => onClose(), 1500);
  };

  const showFeedback = (msg: string) => {
    setTriagedFeedback(msg);
    setTimeout(() => setTriagedFeedback(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#0D1117] border border-white/[0.12] rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col gap-6 max-h-[88vh] overflow-y-auto"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-80 h-32 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>Cognitive Drift & Backlog Decay Radar</span>
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-white/[0.06] text-amber-300">
                  {staleTasks.length} Decaying Items
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Guilt-free closure for tasks neglected &gt; 14 days or repeatedly postponed
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Framing Banner */}
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3 relative z-10">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            Hanging onto stale tasks produces psychological debt and creates list blindness. If a task hasn&apos;t moved in two weeks, its context has changed. Choose guilt-free closure below.
          </p>
        </div>

        {/* Feedback Alert */}
        {triagedFeedback && (
          <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fade-in relative z-10">
            <Check className="w-4 h-4 shrink-0" />
            <span>{triagedFeedback}</span>
          </div>
        )}

        {/* Stale Tasks List */}
        <div className="flex flex-col gap-3 relative z-10">
          {staleTasks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              <span>Your backlog is pristine! Zero stale or decaying tasks detected.</span>
            </div>
          ) : (
            staleTasks.map(t => {
              const daysOld = Math.floor((Date.now() - (t.createdAt || Date.now())) / (1000 * 60 * 60 * 24));
              return (
                <div 
                  key={t.id}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white leading-snug">
                        {t.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-mono text-slate-400">
                        <span className="text-amber-400">Created {daysOld} days ago</span>
                        {t.postponedCount && t.postponedCount > 0 && (
                          <span className="text-rose-400">• Postponed {t.postponedCount}×</span>
                        )}
                        {t.pillar && (
                          <span className="text-slate-500 uppercase">• {t.pillar}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Action Bar */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.04]">
                    <button
                      onClick={() => handleArchive(t)}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 border border-white/[0.08] text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5"
                      title="Archive item and clear cognitive clutter"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive (No Guilt)</span>
                    </button>

                    <button
                      onClick={() => handleDemoteToSomeday(t)}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-300 border border-white/[0.08] text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5"
                      title="Keep as reference note but remove from daily focus"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Demote to Someday</span>
                    </button>

                    {onBustResistance && (
                      <button
                        onClick={() => {
                          onClose();
                          onBustResistance(t);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-[#FF5A1F]/10 hover:border-[#FF5A1F]/30 hover:text-[#FF5A1F] border border-white/[0.08] text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5"
                      >
                        <Flame className="w-3.5 h-3.5 text-[#FF5A1F]" />
                        <span>Bust Resistance</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleRecommit(t)}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-300 border border-white/[0.08] text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Keep Active</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Batch Footer */}
        {staleTasks.length > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] relative z-10">
            <span className="text-xs text-slate-400">
              Bulk actions for rapid clearing
            </span>
            <button
              onClick={handleArchiveAll}
              className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all flex items-center gap-2"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive All {staleTasks.length} Stale Items</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
