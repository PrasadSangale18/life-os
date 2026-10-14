import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Plus, 
  CheckCircle2, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Trash2, 
  X,
  Shield,
  Zap
} from 'lucide-react';
import { useStore } from '../../store';
import type { Item, PillarId } from '../../types';
import { PILLARS } from '../../theme/tokens';

const PILLAR_DEFAULTS: Record<string, string> = {
  physical: '2-min stretch / 5 pushups',
  mental: 'Read 1 paragraph or jot 1 thought',
  relational: 'Send a 10s check-in text',
  spiritual: 'Take 3 deep conscious breaths',
  financial: 'Review balances for 60s'
};

export const HabitsView: React.FC = () => {
  const { items, addItem, updateItem, trashItem } = useStore();

  const [filterPillar, setFilterPillar] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAnchor, setNewAnchor] = useState('');
  const [newElasticMin, setNewElasticMin] = useState('');
  const [newPillar, setNewPillar] = useState<PillarId>('physical');

  // Generate last 60 days list for the heatmap
  const dateRange = useMemo(() => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 59; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const dayBeforeStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return d.toISOString().split('T')[0];
  }, []);

  // Today's Pulse for Elastic Mode detection
  const todayPulse = useMemo(() => {
    return items.find(i => 
      i.type === 'journal' && 
      !i.deletedAt && 
      i.title === `Pulse-${todayStr}`
    );
  }, [items, todayStr]);

  const isLowEnergy = (todayPulse?.energyRating || 3) <= 2;

  // Filter habit items from Dexie
  const habits = useMemo(() => {
    return items.filter(i => 
      i.type === 'habit' && 
      !i.deletedAt && 
      !i.isArchived &&
      (filterPillar === 'all' || i.pillar === filterPillar)
    );
  }, [items, filterPillar]);

  // Adaptive Habit Elasticity Governor: Detect 2 consecutive missed days
  const isTwoDayLapse = (h: Item) => {
    return !h.habitHistory?.[yesterdayStr] && !h.habitHistory?.[dayBeforeStr] && (h.habitStreak || 0) > 0;
  };

  const lapsedHabitsCount = useMemo(() => {
    return habits.filter(h => isTwoDayLapse(h)).length;
  }, [habits, yesterdayStr, dayBeforeStr]);

  // Handle toggling emergency minimum completion
  const handleToggleElastic = async (habit: Item, date: string) => {
    const history = { ...(habit.habitHistory || {}) };
    const elasticMap = { ...(habit.elasticDays || {}) };
    const currentlyDone = Boolean(history[date]);

    if (currentlyDone && elasticMap[date]) {
      delete history[date];
      delete elasticMap[date];
    } else {
      history[date] = true;
      elasticMap[date] = true;
    }

    let streak = 0;
    const checkDate = new Date();
    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (history[dStr]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (dStr === todayStr) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }

    await updateItem(habit.id, {
      habitHistory: history,
      elasticDays: elasticMap,
      habitStreak: streak
    });
  };

  // Handle toggling habit completion for a specific date
  const handleToggleHabit = async (habit: Item, date: string) => {
    const history = { ...(habit.habitHistory || {}) };
    const elasticMap = { ...(habit.elasticDays || {}) };
    const currentlyDone = Boolean(history[date]);
    if (currentlyDone) {
      delete history[date];
      delete elasticMap[date];
    } else {
      history[date] = true;
      delete elasticMap[date]; // Normal full completion
    }

    // Calculate current streak backwards from today
    let streak = 0;
    const checkDate = new Date();
    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (history[dStr]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If today isn't checked yet, don't break streak if yesterday was done
        if (dStr === todayStr) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }

    await updateItem(habit.id, {
      habitHistory: history,
      habitStreak: streak
    });
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await addItem({
      title: newTitle.trim(),
      type: 'habit',
      pillar: newPillar,
      habitAnchor: newAnchor.trim() || 'Daily Routine',
      elasticMinimum: newElasticMin.trim() || undefined,
      habitStreak: 0,
      habitHistory: {},
      elasticDays: {}
    });

    setNewTitle('');
    setNewAnchor('');
    setNewElasticMin('');
    setShowAddModal(false);
  };

  // Overall Habit Telemetry Stats
  const totalCompletedToday = useMemo(() => {
    return habits.filter(h => h.habitHistory?.[todayStr]).length;
  }, [habits, todayStr]);

  const maxStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map(h => h.habitStreak || 0), 0);
  }, [habits]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* Top Banner & Telemetry Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#FF5A1F]">
              Behavioral Science Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Atomic Habits & Routines
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Stack micro-habits onto daily anchors with 60-day visual momentum heatmaps
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A1F] to-[#EA580C] hover:opacity-90 text-white font-bold text-xs flex items-center gap-2 shadow-[0_4px_16px_rgba(255,90,31,0.3)] transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Habit
        </button>
      </div>

      {/* Metric Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#0D1117] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase">Active Habits</span>
            <div className="text-2xl font-bold text-white mt-1">{habits.length}</div>
          </div>
          <Target className="w-6 h-6 text-purple-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-[#0D1117] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase">Today's Checkoffs</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {totalCompletedToday}/{habits.length}
            </div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-[#0D1117] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase">Longest Streak</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{maxStreak}d</div>
          </div>
          <Flame className="w-6 h-6 text-amber-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-[#0D1117] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase">Habit Health</span>
            <div className="text-2xl font-bold text-[#FF5A1F] mt-1">
              {habits.length > 0 ? `${Math.round((totalCompletedToday / habits.length) * 100)}%` : '100%'}
            </div>
          </div>
          <TrendingUp className="w-6 h-6 text-[#FF5A1F] opacity-80" />
        </div>
      </div>

      {/* Elastic Mode Alert Banner */}
      {isLowEnergy && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">Elastic Habit Mode Active</span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Your energy rating is {todayPulse?.energyRating || 2}/5. 2-minute emergency minimums are unlocked to protect your streaks without burning out!
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
            Shield Engaged
          </span>
        </div>
      )}

      {/* Adaptive Habit Elasticity Governor Banner */}
      {lapsedHabitsCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <span className="font-bold">Habit Elasticity Governor Engaged ({lapsedHabitsCount} at risk)</span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                2-day lapses detected. Don't let guilt break your identity loop — emergency 2-minute baselines are activated to shield your streaks today!
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
            Anti-Failure Circuit Breaker
          </span>
        </div>
      )}

      {/* Pillar Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterPillar('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
            filterPillar === 'all'
              ? 'bg-white text-slate-950 font-bold'
              : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.08]'
          }`}
        >
          All Pillars
        </button>
        {PILLARS.map(p => (
          <button
            key={p.id}
            onClick={() => setFilterPillar(p.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
              filterPillar === p.id
                ? 'bg-white text-slate-950 font-bold'
                : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.08]'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
          </button>
        ))}
      </div>

      {/* Habits List & Interactive Heatmaps */}
      {habits.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#0D1117] border border-white/[0.08] flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No habits created yet</h3>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            James Clear's Atomic Habits: build habits by anchoring them onto existing routines (e.g. "After I pour my morning water, I will do 20 pushups").
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 px-4 py-2 rounded-xl bg-[#FF5A1F] text-white text-xs font-bold hover:bg-[#EA580C] transition-all"
          >
            Add First Habit
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {habits.map(habit => {
            const isDoneToday = Boolean(habit.habitHistory?.[todayStr]);
            const pillarObj = PILLARS.find(p => p.id === habit.pillar);

            return (
              <div
                key={habit.id}
                className="p-5 rounded-2xl bg-[#0D1117] border border-white/[0.08] hover:border-white/[0.16] transition-all flex flex-col gap-4"
              >
                {/* Top Line: Title, Anchor, Today Toggle, Streak */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <button
                      onClick={() => handleToggleHabit(habit, todayStr)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all shrink-0 mt-0.5 sm:mt-0 ${
                        isDoneToday
                          ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                          : 'border border-white/[0.2] text-transparent hover:border-emerald-400'
                      }`}
                      title={isDoneToday ? 'Completed Today!' : 'Check off for today'}
                    >
                      <CheckCircle2 className="w-4 h-4 fill-current" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-bold transition-all ${isDoneToday ? 'text-emerald-400' : 'text-white'}`}>
                          {habit.title}
                        </h3>
                        {pillarObj && (
                          <span 
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/[0.08]"
                            style={{ color: pillarObj.color, backgroundColor: `${pillarObj.color}15` }}
                          >
                            {pillarObj.name}
                          </span>
                        )}
                        {habit.elasticDays?.[todayStr] && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Shield className="w-3 h-3 text-amber-400" /> Elastic Save
                          </span>
                        )}
                        {isTwoDayLapse(habit) && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 animate-pulse">
                            <Shield className="w-3 h-3 text-cyan-400" /> Circuit Breaker (2d lapse)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="text-slate-500">Anchor:</span>
                        <span className="text-slate-300 italic">"{habit.habitAnchor || 'Daily routine'}"</span>
                        <span className="text-amber-400/90 text-[11px] font-mono">
                          • Fallback: {habit.elasticMinimum || PILLAR_DEFAULTS[habit.pillar || 'mental'] || '2-min Baseline'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto flex-wrap">
                    {/* Emergency Minimum Action Button */}
                    <button
                      onClick={() => handleToggleElastic(habit, todayStr)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                        habit.elasticDays?.[todayStr]
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                          : isTwoDayLapse(habit)
                          ? 'bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/40 font-bold shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                          : 'bg-white/[0.03] text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 border border-white/[0.08]'
                      }`}
                      title={isTwoDayLapse(habit) ? "2-day lapse detected! Complete 2-min baseline to shield streak" : "Mark 2-minute Emergency Minimum to protect streak"}
                    >
                      <Zap className={`w-3.5 h-3.5 ${isTwoDayLapse(habit) ? 'text-cyan-400' : 'text-amber-400'}`} />
                      <span>{habit.elasticMinimum || PILLAR_DEFAULTS[habit.pillar || 'mental'] || '2-min Baseline'}</span>
                    </button>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <Flame className="w-4 h-4 fill-current" />
                      <span className="text-xs font-mono font-bold">{habit.habitStreak || 0}d streak</span>
                    </div>

                    <button
                      onClick={() => trashItem(habit.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-white/[0.05] transition-all"
                      title="Delete Habit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bottom Line: 60-Day Visual Contribution Heatmap */}
                <div className="pt-2 border-t border-white/[0.04]">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1.5">
                    <span>60-Day Momentum Heatmap</span>
                    <span>{isDoneToday ? (habit.elasticDays?.[todayStr] ? 'Saved with Minimum 🛡️' : 'Completed Today ✓') : 'Pending Today'}</span>
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {dateRange.map(dStr => {
                      const done = Boolean(habit.habitHistory?.[dStr]);
                      const isElastic = Boolean(habit.elasticDays?.[dStr]);
                      const isToday = dStr === todayStr;

                      return (
                        <div
                          key={dStr}
                          onClick={() => handleToggleHabit(habit, dStr)}
                          className={`w-3.5 h-3.5 rounded-sm transition-all cursor-pointer ${
                            done && isElastic
                              ? 'bg-amber-400 hover:bg-amber-300 border border-amber-300 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                              : done
                              ? 'bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.5)]'
                              : isToday
                              ? 'bg-white/[0.12] border border-amber-400 hover:bg-white/[0.2]'
                              : 'bg-white/[0.04] hover:bg-white/[0.1]'
                          }`}
                          title={`${dStr}: ${done ? (isElastic ? `Saved via Emergency Minimum (${habit.elasticMinimum || '2-min baseline'})` : 'Completed Full Habit') : 'Missed'}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0D1117] border border-white/[0.12] rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF5A1F]" />
                New Atomic Habit
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-mono text-slate-400 uppercase">Habit Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. 20-Minute Core Workout"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF5A1F] mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 uppercase">Anchor Routine (Trigger)</label>
                <input
                  type="text"
                  value={newAnchor}
                  onChange={e => setNewAnchor(e.target.value)}
                  placeholder="e.g. After I pour morning coffee..."
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF5A1F] mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-amber-400 uppercase flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Emergency Minimum (2-min Fallback)
                </label>
                <input
                  type="text"
                  value={newElasticMin}
                  onChange={e => setNewElasticMin(e.target.value)}
                  placeholder="e.g. 5 pushups or 1 page reading"
                  className="w-full bg-white/[0.04] border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 uppercase">Life Pillar</label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {PILLARS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNewPillar(p.id)}
                      className={`p-2 rounded-xl text-xs font-mono transition-all text-center border ${
                        newPillar === p.id
                          ? 'bg-white/[0.15] border-white text-white font-bold'
                          : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#FF5A1F] hover:bg-[#EA580C] text-xs font-bold text-white transition-all shadow-[0_2px_12px_rgba(255,90,31,0.3)]"
                >
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
