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
    <div 
      className="glass-panel"
      style={{ 
        padding: "14px 18px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        flexWrap: "wrap", 
        gap: 14 
      }}
    >
      {/* Left: Indicator & Guidance */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 260 }}>
        <div style={{ 
          width: 36, 
          height: 36, 
          borderRadius: 10, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          flexShrink: 0,
          background: currentEnergy >= 4 ? "rgba(16, 185, 129, 0.12)" : currentEnergy === 3 ? "rgba(59, 130, 246, 0.12)" : currentEnergy > 0 ? "rgba(245, 158, 11, 0.12)" : "var(--bg-surface-elevated)",
          color: currentEnergy >= 4 ? "#10b981" : currentEnergy === 3 ? "#3b82f6" : currentEnergy > 0 ? "#f59e0b" : "var(--text-tertiary)",
          border: `1px solid ${currentEnergy >= 4 ? "rgba(16, 185, 129, 0.25)" : currentEnergy === 3 ? "rgba(59, 130, 246, 0.25)" : currentEnergy > 0 ? "rgba(245, 158, 11, 0.25)" : "var(--border-subtle)"}`,
          transition: "all 0.2s ease"
        }}>
          <BatteryCharging size={18} />
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 650, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
              Daily Energy & Sentiment Pulse
            </span>
            {justSaved && (
              <span style={{ fontSize: 10, color: "#10b981", fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}>
                <Check size={11} strokeWidth={2.5} /> Logged
              </span>
            )}
          </div>
          <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--text-secondary)", lineHeight: 1.35 }}>
            {currentEnergy === 0
              ? "Rate your morning energy to calibrate today's workload capacity"
              : currentEnergy <= 2
              ? "Low energy detected: protect non-urgent tasks & focus strictly on Q1"
              : currentEnergy >= 4
              ? "High cognitive readiness: optimal day for deep architectural work"
              : "Steady balanced energy: stick to your scheduled 4h capacity"}
          </p>
        </div>
      </div>

      {/* Right: Interactive 1-Click Energy Selector (1 to 5) & Mood Pills */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3, background: "var(--bg-surface-elevated)", padding: 3, borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
          {[1, 2, 3, 4, 5].map(lvl => {
            const isSelected = currentEnergy === lvl;
            const activeColor = lvl <= 2 ? "#f59e0b" : lvl === 3 ? "#3b82f6" : "#10b981";
            const activeBg = lvl <= 2 ? "rgba(245, 158, 11, 0.18)" : lvl === 3 ? "rgba(59, 130, 246, 0.18)" : "rgba(16, 185, 129, 0.18)";
            const activeBorder = lvl <= 2 ? "rgba(245, 158, 11, 0.4)" : lvl === 3 ? "rgba(59, 130, 246, 0.4)" : "rgba(16, 185, 129, 0.4)";
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => handleSelectEnergy(lvl)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: isSelected ? `1px solid ${activeBorder}` : "1px solid transparent",
                  background: isSelected ? activeBg : "transparent",
                  color: isSelected ? activeColor : "var(--text-tertiary)"
                }}
                title={`Energy Level ${lvl}/5`}
              >
                {lvl}
              </button>
            );
          })}
        </div>

        {/* Mood Emoji Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, background: "var(--bg-surface-elevated)", padding: 3, borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
          {[
            { id: 'great', icon: '⚡', label: 'Flow' },
            { id: 'good', icon: '✨', label: 'Good' },
            { id: 'neutral', icon: '⚖️', label: 'Neutral' },
            { id: 'tired', icon: '☕', label: 'Tired' },
          ].map(m => {
            const isSelected = currentMood === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectMood(m.id)}
                style={{
                  padding: "4px 8px",
                  borderRadius: 7,
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: isSelected ? "1px solid var(--border-default)" : "1px solid transparent",
                  background: isSelected ? "var(--bg-surface)" : "transparent",
                  color: isSelected ? "var(--text-primary)" : "var(--text-tertiary)"
                }}
                title={m.label}
              >
                <span>{m.icon}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
