import React, { useState, useEffect } from 'react';
import { 
  Swords, 
  X, 
  Trophy, 
  Clock, 
  ArrowRight, 
  Radio, 
  Flame, 
  RotateCcw
} from 'lucide-react';
import type { Item } from '../../types';
import { useStore } from '../../store';

interface DecisionDuelModalProps {
  tasks: Item[];
  isOpen: boolean;
  onClose: () => void;
  onStartFocus?: (task: Item) => void;
  onBustResistance?: (task: Item) => void;
}

export const DecisionDuelModal: React.FC<DecisionDuelModalProps> = ({
  tasks,
  isOpen,
  onClose,
  onStartFocus,
  onBustResistance
}) => {
  const { updateItem } = useStore();

  // Active pool of eligible candidate tasks for comparison (limit to top 8 to prevent fatigue)
  const [candidates, setCandidates] = useState<Item[]>([]);
  const [currentLeft, setCurrentLeft] = useState<Item | null>(null);
  const [currentRight, setCurrentRight] = useState<Item | null>(null);
  const [nextPool, setNextPool] = useState<Item[]>([]);
  const [remainingInRound, setRemainingInRound] = useState<Item[]>([]);
  const [champion, setChampion] = useState<Item | null>(null);
  const [totalDecisions, setTotalDecisions] = useState(0);
  const [decisionsMade, setDecisionsMade] = useState(0);

  // Initialize or reset tournament bracket
  useEffect(() => {
    if (isOpen) {
      const activePending = tasks.filter(t => t.status !== 'done' && t.status !== 'dropped');
      // Sort to seed the tournament logically (Q1 first, high priority first)
      const sorted = [...activePending].sort((a, b) => {
        if (a.quadrant === 'do' && b.quadrant !== 'do') return -1;
        if (a.quadrant !== 'do' && b.quadrant === 'do') return 1;
        if (a.isPriority && !b.isPriority) return -1;
        return 0;
      }).slice(0, 8); // max 8 for a clean 3-round bracket

      if (sorted.length <= 1) {
        setChampion(sorted[0] || null);
        setCandidates(sorted);
      } else {
        setCandidates(sorted);
        setCurrentLeft(sorted[0]);
        setCurrentRight(sorted[1]);
        setRemainingInRound(sorted.slice(2));
        setNextPool([]);
        setChampion(null);
        setTotalDecisions(sorted.length - 1);
        setDecisionsMade(0);
      }
    }
  }, [isOpen, tasks]);

  const advanceToNextRound = (pool: Item[]) => {
    if (pool.length === 1) {
      // Tournament Winner Found!
      setChampion(pool[0]);
      // Elevate to Q1 priority automatically
      updateItem(pool[0].id, { isPriority: true, quadrant: 'do' });
    } else {
      setCurrentLeft(pool[0]);
      setCurrentRight(pool[1]);
      setRemainingInRound(pool.slice(2));
      setNextPool([]);
    }
  };

  const handleChoose = (winner: Item) => {
    const updatedNextPool = [...nextPool, winner];
    setDecisionsMade(prev => prev + 1);

    if (remainingInRound.length >= 2) {
      // Advance to next pair in current round
      setCurrentLeft(remainingInRound[0]);
      setCurrentRight(remainingInRound[1]);
      setRemainingInRound(remainingInRound.slice(2));
      setNextPool(updatedNextPool);
    } else if (remainingInRound.length === 1) {
      // Odd task carries forward automatically
      const advancedPool = [...updatedNextPool, remainingInRound[0]];
      advanceToNextRound(advancedPool);
    } else {
      // Round completed
      advanceToNextRound(updatedNextPool);
    }
  };

  // Keyboard navigation for lightning-fast keyboard warriors
  useEffect(() => {
    if (!isOpen || champion || !currentLeft || !currentRight) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === '1') {
        e.preventDefault();
        handleChoose(currentLeft);
      } else if (e.key === 'ArrowRight' || e.key === '2') {
        e.preventDefault();
        handleChoose(currentRight);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, champion, currentLeft, currentRight, onClose]);

  const handleRestart = () => {
    if (candidates.length > 1) {
      setCurrentLeft(candidates[0]);
      setCurrentRight(candidates[1]);
      setRemainingInRound(candidates.slice(2));
      setNextPool([]);
      setChampion(null);
      setDecisionsMade(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#0D1117] border border-white/[0.12] rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col gap-6"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-80 h-32 bg-[#FF5A1F]/10 blur-3xl pointer-events-none rounded-full" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5A1F]/20 text-[#FF5A1F] border border-[#FF5A1F]/30 flex items-center justify-center shadow-lg shadow-[#FF5A1F]/20">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>The Decision Duel</span>
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400">
                  Choice Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {champion 
                  ? 'Your highest leverage focus has been determined'
                  : 'Break analysis paralysis: which task matters more before going to sleep?'}
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

        {/* Content Body */}
        {!champion && currentLeft && currentRight ? (
          <div className="flex flex-col gap-5 relative z-10">
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Decision {decisionsMade + 1} of {Math.max(1, totalDecisions)}</span>
              <span>Use keys <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white">← 1</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white">→ 2</kbd></span>
            </div>

            {/* Side-by-side Duel Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option Left */}
              <button
                onClick={() => handleChoose(currentLeft)}
                className="group p-5 rounded-2xl bg-white/[0.02] hover:bg-[#FF5A1F]/10 border border-white/[0.08] hover:border-[#FF5A1F]/50 text-left transition-all duration-200 flex flex-col justify-between gap-4 cursor-pointer relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-300">
                    Key: [ 1 ] or [ ← ]
                  </span>
                  {currentLeft.pillar && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5A1F]">
                      {currentLeft.pillar}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-[#FF5A1F] transition-colors leading-snug">
                    {currentLeft.title}
                  </h4>
                  {currentLeft.body && (
                    <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                      {currentLeft.body}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3 h-3" /> {currentLeft.estMinutes || 25}m
                  </span>
                  <span className="text-xs font-semibold text-white group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Pick This <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>

              {/* Option Right */}
              <button
                onClick={() => handleChoose(currentRight)}
                className="group p-5 rounded-2xl bg-white/[0.02] hover:bg-blue-500/10 border border-white/[0.08] hover:border-blue-500/50 text-left transition-all duration-200 flex flex-col justify-between gap-4 cursor-pointer relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-300">
                    Key: [ 2 ] or [ → ]
                  </span>
                  {currentRight.pillar && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                      {currentRight.pillar}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-blue-400 transition-colors leading-snug">
                    {currentRight.title}
                  </h4>
                  {currentRight.body && (
                    <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                      {currentRight.body}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3 h-3" /> {currentRight.estMinutes || 25}m
                  </span>
                  <span className="text-xs font-semibold text-white group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Pick This <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            </div>
          </div>
        ) : champion ? (
          /* Champion Showcase Podium */
          <div className="flex flex-col items-center text-center gap-5 py-4 relative z-10 animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#FF5A1F] to-amber-400 text-slate-950 flex items-center justify-center shadow-xl shadow-[#FF5A1F]/30 animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-mono font-bold text-[#FF5A1F] uppercase tracking-widest">
                Tournament Winner • True North
              </span>
              <h3 className="text-lg sm:text-2xl font-black text-white mt-1 max-w-lg leading-tight">
                {champion.title}
              </h3>
              <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
                All competing options eliminated. Your cognitive energy should now be 100% focused on shipping this single deliverable.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {onStartFocus && (
                <button
                  onClick={() => {
                    onClose();
                    onStartFocus(champion);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF5A1F] to-amber-500 text-white font-bold text-sm shadow-xl shadow-[#FF5A1F]/30 hover:opacity-95 transition-all flex items-center gap-2"
                >
                  <Radio className="w-4 h-4" />
                  <span>Launch Deep Work Cockpit</span>
                </button>
              )}

              {onBustResistance && (
                <button
                  onClick={() => {
                    onClose();
                    onBustResistance(champion);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-200 text-xs font-semibold transition-all flex items-center gap-2"
                >
                  <Flame className="w-4 h-4 text-[#FF5A1F]" />
                  <span>Bust Resistance</span>
                </button>
              )}

              <button
                onClick={handleRestart}
                className="px-4 py-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Duel Again</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-sm">
            No active pending tasks available for the decision duel.
          </div>
        )}
      </div>
    </div>
  );
};
