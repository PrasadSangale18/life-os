import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  X, 
  Zap, 
  Clock, 
  Brain
} from 'lucide-react';
import type { Item } from '../../types';
import { useStore } from '../../store';

interface ResistanceBusterModalProps {
  task: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onStartFocus?: (task: Item) => void;
}

type FrictionType = 'ambiguity' | 'dread' | 'scale' | 'dependency';

export const ResistanceBusterModal: React.FC<ResistanceBusterModalProps> = ({
  task,
  isOpen,
  onClose,
  onStartFocus
}) => {
  const { updateItem } = useStore();
  const [selectedFriction, setSelectedFriction] = useState<FrictionType>('scale');
  const [customMicroAction, setCustomMicroAction] = useState<string>('');

  if (!isOpen || !task) return null;

  // Generate behavioral micro-starter proposals based on friction diagnosis
  const getProposals = (type: FrictionType, title: string) => {
    switch (type) {
      case 'ambiguity':
        return {
          diagnostic: 'The task lacks a clear physical starting point or definition of done.',
          starter: `Draft 3 bullet points defining what "${title}" looks like when done (2 mins)`,
          prescription: 'Cognitive clarity eliminates decision paralysis.'
        };
      case 'dread':
        return {
          diagnostic: 'Your brain perceives this task as emotionally taxing, boring, or anxiety-inducing.',
          starter: `Set a timer for 120 seconds, open the file for "${title}", then stop if you want`,
          prescription: 'Permission to quit after 2 minutes breaks the activation threshold.'
        };
      case 'scale':
        return {
          diagnostic: 'The task is an unmapped boulder rather than a discrete single step.',
          starter: `Step 1 of "${title}": Create empty folder or doc and title it (1 min)`,
          prescription: 'Momentum is physics. Tiny micro-movements induce flow.'
        };
      case 'dependency':
        return {
          diagnostic: 'You are blocked by an external party, missing credential, or question.',
          starter: `Send a 1-sentence Slack/email: "Hey, do you have the link for ${title}?"`,
          prescription: 'Convert internal guilt into external communication.'
        };
    }
  };

  const proposal = getProposals(selectedFriction, task.title);

  const handleApplyMicroStarter = (starterText: string) => {
    const finalStarter = customMicroAction.trim() || starterText;
    updateItem(task.id, {
      resistanceReason: selectedFriction,
      microStarter: finalStarter,
      title: `[2-MIN STEP] ${finalStarter}`,
      quadrant: 'do' // Move to Q1 immediate action
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-xl bg-[#0D1117] border border-amber-500/30 rounded-3xl shadow-[0_20px_50px_rgba(245,158,11,0.2)] flex flex-col text-slate-100 overflow-hidden"
        >
          {/* Header Banner */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Flame className="w-4 h-4 fill-current" />
              </div>
              <div>
                <span className="text-[11px] font-mono tracking-wider text-amber-400 font-bold uppercase">
                  Resistance & Anti-Procrastination Engine
                </span>
                <h3 className="text-sm font-semibold text-white truncate max-w-sm">
                  {task.title}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 flex flex-col gap-6">
            
            {/* Step 1: Diagnose the friction */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
                1. What is making you resist this task?
              </label>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { id: 'scale', label: 'Too Big', desc: 'Boulder / daunting' },
                  { id: 'ambiguity', label: 'Ambiguous', desc: 'Unclear start' },
                  { id: 'dread', label: 'Dread / Boredom', desc: 'Emotional friction' },
                  { id: 'dependency', label: 'Blocked', desc: 'Waiting on info' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSelectedFriction(opt.id as FrictionType);
                      setCustomMicroAction('');
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      selectedFriction === opt.id
                        ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                        : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:border-white/[0.18]'
                    }`}
                  >
                    <span className="text-xs font-bold">{opt.label}</span>
                    <span className="text-[10px] text-slate-500 mt-1">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Behavioral Diagnostic & Starter Prescription */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <Brain className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-slate-300">
                  <span className="font-semibold text-amber-400">Diagnostic: </span>
                  {proposal.diagnostic}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-1.5">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Irresistible 2-Minute Starter
                </span>
                <p className="text-xs font-medium text-white leading-normal">
                  "{proposal.starter}"
                </p>
                <span className="text-[10px] text-slate-400 italic">
                  💡 {proposal.prescription}
                </span>
              </div>

              {/* Optional Custom Rewrite */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500">Or customize your 2-minute starter:</span>
                <input
                  type="text"
                  value={customMicroAction}
                  onChange={e => setCustomMicroAction(e.target.value)}
                  placeholder="e.g. Open browser tab and log into account..."
                  className="w-full bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleApplyMicroStarter(proposal.starter)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-[#FF5A1F] hover:opacity-90 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(245,158,11,0.3)] transition-all"
              >
                <Zap className="w-4 h-4 fill-current" />
                Shrink Boulder to 2-Min Action
              </button>

              {onStartFocus && (
                <button
                  onClick={() => {
                    handleApplyMicroStarter(proposal.starter);
                    onStartFocus(task);
                  }}
                  className="px-4 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white font-medium text-xs flex items-center gap-2 transition-all border border-white/[0.1]"
                  title="Shrink and launch Focus Cockpit"
                >
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Focus Now (2m)
                </button>
              )}
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
