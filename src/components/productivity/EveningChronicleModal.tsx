import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  Copy, 
  Check, 
  Send,
  Zap,
  Layers
} from 'lucide-react';
import type { PillarId } from '../../types';
import { useStore } from '../../store';

interface EveningChronicleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EveningChronicleModal: React.FC<EveningChronicleModalProps> = ({
  isOpen,
  onClose
}) => {
  const { items, addItem } = useStore();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  // Today's Pulse
  const todayPulse = useMemo(() => {
    return items.find(i => 
      i.type === 'journal' && 
      !i.deletedAt && 
      i.title === `Pulse-${todayStr}`
    );
  }, [items, todayStr]);

  // Tasks completed today
  const completedToday = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return items.filter(i => 
      (i.type === 'task' || !i.type) && 
      !i.deletedAt && 
      i.status === 'done' && 
      (i.updatedAt || 0) >= startOfToday.getTime()
    );
  }, [items]);

  // Habits completed today
  const habitsDoneToday = useMemo(() => {
    return items.filter(i => 
      i.habitAnchor !== undefined && 
      !i.deletedAt && 
      i.habitHistory && 
      i.habitHistory[todayStr] === true
    );
  }, [items, todayStr]);

  // Parked thoughts / distractions saved today
  const parkedThoughts = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return items.filter(i => 
      !i.deletedAt && 
      (i.createdAt || 0) >= startOfToday.getTime() && 
      (i.body && i.body.includes('Captured during deep work session'))
    );
  }, [items]);

  // Dimensional breakdown
  const pillarBreakdown = useMemo(() => {
    const counts: Record<PillarId, number> = {
      physical: 0,
      mental: 0,
      financial: 0,
      relational: 0,
      spiritual: 0
    };
    completedToday.forEach(t => {
      const p = (t.pillar as PillarId) || 'mental';
      counts[p] = (counts[p] || 0) + 1;
    });
    habitsDoneToday.forEach(h => {
      const p = (h.pillar as PillarId) || 'mental';
      counts[p] = (counts[p] || 0) + 1;
    });
    return counts;
  }, [completedToday, habitsDoneToday]);

  // Top dominant dimension
  const dominantPillar = useMemo<PillarId>(() => {
    let topPillar: PillarId = 'mental';
    let max = -1;
    for (const [p, val] of Object.entries(pillarBreakdown) as [PillarId, number][]) {
      if (val > max) {
        max = val;
        topPillar = p;
      }
    }
    return topPillar;
  }, [pillarBreakdown]);

  // Generate deterministic synthesis narrative
  const synthesizedNarrative = useMemo(() => {
    const energyLevel = todayPulse?.energyRating || 3;
    const mood = todayPulse?.moodSentiment || 'good';
    const taskCount = completedToday.length;
    const habitCount = habitsDoneToday.length;
    const parkedCount = parkedThoughts.length;

    const energyWord = energyLevel >= 4 ? 'high cognitive energy' : energyLevel <= 2 ? 'calibrated gentle pace' : 'steady sustained focus';
    
    let lead = `Today (${todayFormatted}) was characterized by a ${energyWord} (rating ${energyLevel}/5, mood: ${mood}). Across all workspaces, you brought ${taskCount} tasks to the finish line and reinforced ${habitCount} core behavioral habit anchors.`;
    
    let pillarNarrative = `Your primary operational velocity was centered in the **${dominantPillar.toUpperCase()}** dimension, which accounted for the largest share of shipped work.`;
    if (completedToday.length > 0) {
      const highlights = completedToday.slice(0, 3).map(t => `"${t.title}"`).join(', ');
      pillarNarrative += ` Key shipped milestones included: ${highlights}.`;
    }

    let focusNarrative = '';
    if (parkedCount > 0) {
      focusNarrative = `During your deep focus sessions, you successfully protected your attention by parking ${parkedCount} wandering thoughts into the inbox instead of succumbing to context-switching.`;
    } else {
      focusNarrative = `Focus hygiene was clean throughout the day with minimal distraction leakage into your active sprint blocks.`;
    }

    const reflectionQuestion = dominantPillar === 'financial' 
      ? `Tomorrow's Focus Lever: What is the single most important financial or strategic deliverable that will move the needle?`
      : dominantPillar === 'physical'
      ? `Tomorrow's Focus Lever: How will you pair physical vitality with your highest-priority creative sprint?`
      : dominantPillar === 'relational'
      ? `Tomorrow's Focus Lever: Who is one person you can connect with or support tomorrow?`
      : `Tomorrow's Focus Lever: What is the first 2-minute micro-action you will execute upon sitting at your desk?`;

    return `${lead}\n\n${pillarNarrative}\n\n${focusNarrative}\n\n> **Evening Reflection**: ${reflectionQuestion}`;
  }, [todayFormatted, todayPulse, completedToday, habitsDoneToday, parkedThoughts, dominantPillar]);

  const [chronicleText, setChronicleText] = useState(synthesizedNarrative);
  const [copied, setCopied] = useState(false);
  const [savedToJournal, setSavedToJournal] = useState(false);

  // Sync state if synthesized narrative updates
  const [prevNarrative, setPrevNarrative] = useState(synthesizedNarrative);
  if (synthesizedNarrative !== prevNarrative) {
    setPrevNarrative(synthesizedNarrative);
    setChronicleText(synthesizedNarrative);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(chronicleText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToJournal = async () => {
    await addItem({
      title: `Daily Chronicle — ${todayFormatted}`,
      type: 'journal',
      pillar: dominantPillar,
      body: chronicleText,
      tags: ['reflection', 'chronicle', 'daily-review'],
      isPriority: false
    });
    setSavedToJournal(true);
    setTimeout(() => {
      setSavedToJournal(false);
      onClose();
    }, 1800);
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#0D1117] border border-white/[0.12] rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 left-1/4 w-80 h-32 bg-blue-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>Autonomous Daily Chronicle</span>
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-white/[0.06] text-blue-300">
                  Evening Synthesis
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Auto-compiled debrief of your tasks, habits, energy curves, and cognitive focus
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

        {/* Telemetry Snapshot Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative z-10">
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Tasks Shipped</span>
            <span className="text-base font-bold text-emerald-400 font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> {completedToday.length}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Habits Maintained</span>
            <span className="text-base font-bold text-[#FF5A1F] font-mono flex items-center gap-1.5">
              <Flame className="w-4 h-4" /> {habitsDoneToday.length}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Energy Rating</span>
            <span className="text-base font-bold text-amber-400 font-mono flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> {todayPulse?.energyRating || 3}/5
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Top Dimension</span>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> {dominantPillar}
            </span>
          </div>
        </div>

        {/* Narrative Textarea / Editor */}
        <div className="flex flex-col gap-2 relative z-10">
          <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-white font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#FF5A1F]" /> Synthesized Chronicle
            </span>
            <span className="text-[11px] text-slate-500">You can edit or annotate before saving</span>
          </label>
          <textarea
            value={chronicleText}
            onChange={e => setChronicleText(e.target.value)}
            rows={8}
            className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-[#FF5A1F]/50 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed outline-none resize-none font-sans transition-all"
            placeholder="Synthesizing daily chronicle..."
          />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.08] relative z-10">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSaveToJournal}
              disabled={savedToJournal}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-blue-500/20 hover:opacity-95 transition-all flex items-center gap-2"
            >
              {savedToJournal ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
              <span>{savedToJournal ? 'Saved to Life Journal!' : 'Commit to Life Journal'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
