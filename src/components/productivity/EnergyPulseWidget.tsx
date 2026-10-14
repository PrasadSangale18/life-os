import React, { useState, useMemo } from 'react';
import { 
  Check, 
  BatteryCharging
} from 'lucide-react';
import { useStore } from '../../store';

export const EnergyPulseWidget: React.FC = () => {
  const { items, addItem, updateItem } = useStore();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Find today's pulse item if logged
  const todayPulse = useMemo(() => {
    return items.find(i => 
      i.type === 'journal' && 
      !i.deletedAt && 
      i.title === `Pulse-${todayStr}`
    );
  }, [items, todayStr]);

  const [currentEnergy, setCurrentEnergy] = useState<number>(todayPulse?.energyRating || 0);
  const [currentMood, setCurrentMood] = useState<string>(todayPulse?.moodSentiment || '');
  const [justSaved, setJustSaved] = useState(false);

  const handleSelectEnergy = async (rating: number) => {
    setCurrentEnergy(rating);
    if (todayPulse) {
      await updateItem(todayPulse.id, {
        energyRating: rating,
        moodSentiment: (currentMood as any) || 'good'
      });
    } else {
      await addItem({
        title: `Pulse-${todayStr}`,
        type: 'journal',
        energyRating: rating,
        moodSentiment: (currentMood as any) || 'good',
        pillar: 'physical',
        body: `Daily Circadian Energy & Sentiment Log for ${todayStr}`
      });
    }
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  const handleSelectMood = async (mood: string) => {
    setCurrentMood(mood);
    if (todayPulse) {
      await updateItem(todayPulse.id, {
        moodSentiment: mood as any
      });
    } else {
      await addItem({
        title: `Pulse-${todayStr}`,
        type: 'journal',
        energyRating: currentEnergy || 3,
        moodSentiment: mood as any,
        pillar: 'mental',
        body: `Daily Circadian Energy & Sentiment Log for ${todayStr}`
      });
    }
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  return (
    <div className="w-full bg-[#131924] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-4 transition-all flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Left: Indicator & Guidance */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
          currentEnergy >= 4
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            : currentEnergy === 3
            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
            : currentEnergy > 0
            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            : 'bg-white/[0.05] text-slate-400 border border-white/[0.08]'
        }`}>
          <BatteryCharging className="w-4 h-4" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-wide">
              Daily Energy & Sentiment Pulse
            </span>
            {justSaved && (
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <Check className="w-3 h-3" /> Logged
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
            {currentEnergy === 0
              ? 'Rate your morning energy to calibrate today\'s workload capacity'
              : currentEnergy <= 2
              ? 'Low energy detected: protect non-urgent tasks & focus strictly on Q1'
              : currentEnergy >= 4
              ? 'High cognitive readiness: optimal day for deep architectural work'
              : 'Steady balanced energy: stick to your scheduled 4h capacity'}
          </p>
        </div>
      </div>

      {/* Right: Interactive 1-Click Energy Selector (1 to 5) & Mood Pills */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
          {[1, 2, 3, 4, 5].map(lvl => (
            <button
              key={lvl}
              onClick={() => handleSelectEnergy(lvl)}
              className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center ${
                currentEnergy === lvl
                  ? lvl <= 2
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                    : lvl === 3
                    ? 'bg-blue-500/25 text-blue-300 border border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.25)]'
                    : 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
              }`}
              title={`Energy Level ${lvl}/5`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Mood Emoji Pills */}
        <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
          {[
            { id: 'great', icon: '⚡', label: 'Flow' },
            { id: 'good', icon: '✨', label: 'Good' },
            { id: 'neutral', icon: '⚖️', label: 'Neutral' },
            { id: 'tired', icon: '☕', label: 'Tired' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => handleSelectMood(m.id)}
              className={`px-2 py-1 rounded-lg text-xs transition-all flex items-center gap-1 ${
                currentMood === m.id
                  ? 'bg-white/[0.15] text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
              title={m.label}
            >
              <span>{m.icon}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
