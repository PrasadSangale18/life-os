import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Plus, 
  Sparkles, 
  Trash2, 
  X,
  Shield,
  Zap,
  Check,
  ChevronDown,
  ChevronUp,
  Calendar,
  Anchor
} from 'lucide-react';
import { useStore } from '../../store';
import type { Item, PillarId } from '../../types';
import { PILLARS } from '../../theme/tokens';

const PILLAR_DEFAULTS: Record<string, string> = {
  physical: '2-min stretch or 5 pushups',
  mental: 'Read 1 paragraph or jot 1 thought',
  relational: 'Send a 10s check-in text',
  spiritual: 'Take 3 deep conscious breaths',
  financial: 'Review balances for 30s'
};

const STARTER_HABITS: Array<{
  title: string;
  pillar: PillarId;
  habitAnchor: string;
  elasticMinimum: string;
}> = [
  {
    title: 'Morning Hydration & 5-Min Stretch',
    pillar: 'physical',
    habitAnchor: 'Immediately after getting out of bed',
    elasticMinimum: 'Drink 1 glass of water and 1 stretch'
  },
  {
    title: 'Read 10 Pages or Deep Reflection',
    pillar: 'mental',
    habitAnchor: 'During morning coffee or tea transition',
    elasticMinimum: 'Read 1 paragraph or capture 1 insight'
  },
  {
    title: 'Thoughtful Check-in Note',
    pillar: 'relational',
    habitAnchor: 'Midday lunch transition',
    elasticMinimum: 'Send 1 appreciative 10-second message'
  },
  {
    title: '3-Minute Mindful Stillness & Breath',
    pillar: 'spiritual',
    habitAnchor: 'Before opening laptop for work',
    elasticMinimum: 'Take 3 slow conscious deep breaths'
  },
  {
    title: 'Review Daily Expenses & Account Balance',
    pillar: 'financial',
    habitAnchor: 'Evening wind-down routine',
    elasticMinimum: 'Glance at bank balance & log 1 expense'
  }
];

export const HabitsView: React.FC = () => {
  const { items, addItem, updateItem, trashItem } = useStore();

  const [filterPillar, setFilterPillar] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHeatmaps, setShowHeatmaps] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newAnchor, setNewAnchor] = useState('');
  const [newElasticMin, setNewElasticMin] = useState('');
  const [newPillar, setNewPillar] = useState<PillarId>('physical');

  // Dates helpers
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

  // Last 7 days for the interactive week strip
  const last7Days = useMemo(() => {
    const days: { dateStr: string; dayName: string; dayNum: number; isToday: boolean }[] = [];
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayName: i === 0 ? 'Today' : dayNames[d.getDay()],
        dayNum: d.getDate(),
        isToday: i === 0
      });
    }
    return days;
  }, []);

  // Last 60 days for the consistency heatmap
  const dateRange60 = useMemo(() => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 59; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
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

  // All active habits count
  const allHabitsCount = useMemo(() => {
    return items.filter(i => i.type === 'habit' && !i.deletedAt && !i.isArchived).length;
  }, [items]);

  // Count habits per pillar
  const habitCountsByPillar = useMemo(() => {
    const counts: Record<string, number> = { all: allHabitsCount };
    PILLARS.forEach(p => {
      counts[p.id] = items.filter(i => i.type === 'habit' && !i.deletedAt && !i.isArchived && i.pillar === p.id).length;
    });
    return counts;
  }, [items, allHabitsCount]);

  // Adaptive Habit Elasticity Governor: Detect 2 consecutive missed days
  const isTwoDayLapse = (h: Item) => {
    return !h.habitHistory?.[yesterdayStr] && !h.habitHistory?.[dayBeforeStr] && (h.habitStreak || 0) > 0;
  };

  const lapsedHabitsCount = useMemo(() => {
    return habits.filter(h => isTwoDayLapse(h)).length;
  }, [habits, yesterdayStr, dayBeforeStr]);

  // Recalculate streak backwards from today
  const calculateStreak = (history: Record<string, boolean>) => {
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
    return streak;
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

    const streak = calculateStreak(history);

    await updateItem(habit.id, {
      habitHistory: history,
      elasticDays: elasticMap,
      habitStreak: streak
    });
  };

  // Handle toggling emergency minimum completion for a date
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

    const streak = calculateStreak(history);

    await updateItem(habit.id, {
      habitHistory: history,
      elasticDays: elasticMap,
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

  // Adopt 5-Pillar Routine Stack
  const handleAdoptStarterRoutine = async () => {
    for (const habit of STARTER_HABITS) {
      const exists = items.some(
        i => i.type === 'habit' && !i.deletedAt && i.title.toLowerCase() === habit.title.toLowerCase()
      );
      if (!exists) {
        await addItem({
          title: habit.title,
          type: 'habit',
          pillar: habit.pillar,
          habitAnchor: habit.habitAnchor,
          elasticMinimum: habit.elasticMinimum,
          habitStreak: 0,
          habitHistory: {},
          elasticDays: {}
        });
      }
    }
  };

  // Overall Habit Telemetry Stats
  const totalCompletedToday = useMemo(() => {
    return habits.filter(h => h.habitHistory?.[todayStr]).length;
  }, [habits, todayStr]);

  const maxStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map(h => h.habitStreak || 0), 0);
  }, [habits]);

  const completionPercent = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.round((totalCompletedToday / habits.length) * 100);
  }, [habits.length, totalCompletedToday]);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-500/20">
              Identity-Based Habit Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5 flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500 fill-orange-500/20" />
            Habits & Routines
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Stack micro-habits onto daily anchors with 7-day interactive strips and 2-minute emergency streak shields.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleAdoptStarterRoutine}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#161D27] hover:bg-slate-200 dark:hover:bg-[#1E2736] text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Install 5 recommended atomic habits across all life pillars"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            Adopt Starter Stack
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Habit
          </button>
        </div>
      </div>

      {/* Daily Momentum & Progress Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-white/[0.08] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                {todayFormatted}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-500/20">
                {totalCompletedToday} of {habits.length} Complete
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
              {completionPercent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2.5 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            "Never miss twice. If life gets hectic, complete your 2-minute emergency minimum to keep the streak unbroken."
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
          {/* Flame streak */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400">
            <Flame className="w-5 h-5 fill-current" />
            <div>
              <span className="text-[10px] font-mono block uppercase font-bold text-orange-600/70 dark:text-orange-400/70">Top Streak</span>
              <span className="text-base font-black font-mono leading-none">{maxStreak}d</span>
            </div>
          </div>

          {/* Heatmap toggle */}
          <button
            type="button"
            onClick={() => setShowHeatmaps(!showHeatmaps)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-600 dark:text-slate-400 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title={showHeatmaps ? "Hide 60-day visual heatmaps" : "Show 60-day visual heatmaps"}
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Heatmap</span>
            {showHeatmaps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Elastic Mode Alert Banner */}
      {isLowEnergy && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <span className="font-bold">Elastic Habit Mode Active</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                Energy pulse is {todayPulse?.energyRating || 2}/5. Emergency 2-minute baselines are highlighted to prevent burnout!
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
            Shield Engaged
          </span>
        </div>
      )}

      {/* Adaptive Habit Elasticity Governor Banner */}
      {lapsedHabitsCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-900 dark:text-cyan-300 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-cyan-500 shrink-0" />
            <div>
              <span className="font-bold">Anti-Lapse Governor Engaged ({lapsedHabitsCount} habit{lapsedHabitsCount > 1 ? 's' : ''} at risk)</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                2-day lapses detected. Don't let guilt break your identity loop — complete the 2-minute baseline today to save the chain!
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 shrink-0">
            Circuit Breaker
          </span>
        </div>
      )}

      {/* Pillar Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <button
          type="button"
          onClick={() => setFilterPillar('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            filterPillar === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
              : 'bg-white dark:bg-[#11161D] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08]'
          }`}
        >
          <span>All Pillars</span>
          <span className="text-[10px] opacity-75">({habitCountsByPillar.all})</span>
        </button>
        {PILLARS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => setFilterPillar(p.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              filterPillar === p.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
                : 'bg-white dark:bg-[#11161D] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08]'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span>{p.name}</span>
            <span className="text-[10px] opacity-75">({habitCountsByPillar[p.id] || 0})</span>
          </button>
        ))}
      </div>

      {/* Habits List or Empty Showcase */}
      {habits.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-white/[0.08] flex flex-col items-center justify-center text-center gap-5 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center shadow-inner">
            <Flame className="w-7 h-7 fill-current" />
          </div>

          <div className="max-w-md space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Build Your 5-Pillar Daily Routine
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              In Atomic Habits, James Clear emphasizes identity-based micro-actions anchored to existing rituals. 
              Install the starter stack or create your own custom micro-habit.
            </p>
          </div>

          {/* 5 Starter Cards Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-3xl text-left my-2">
            {STARTER_HABITS.map(h => {
              const p = PILLARS.find(pill => pill.id === h.pillar);
              return (
                <div 
                  key={h.title}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161D27] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase"
                        style={{ color: p?.color, backgroundColor: `${p?.color}15` }}
                      >
                        {p?.name}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">
                      {h.title}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Anchor:</span> {h.habitAnchor}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center pt-2">
            <button
              type="button"
              onClick={handleAdoptStarterRoutine}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-orange-500/25 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Adopt 5-Pillar Routine Stack
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer border border-slate-200 dark:border-white/[0.08]"
            >
              Add Custom Habit
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {habits.map(habit => {
            const isDoneToday = Boolean(habit.habitHistory?.[todayStr]);
            const isElasticToday = Boolean(habit.elasticDays?.[todayStr]);
            const pillarObj = PILLARS.find(p => p.id === habit.pillar);

            return (
              <div
                key={habit.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] shadow-xs hover:shadow-sm transition-all flex flex-col gap-4"
              >
                {/* Top Row: Checkbox, Habit Title, Pillar Badge, Streak, Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Primary Today Checkoff Circle */}
                    <button
                      type="button"
                      onClick={() => handleToggleHabit(habit, todayStr)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 mt-0.5 sm:mt-0 cursor-pointer ${
                        isDoneToday
                          ? isElasticToday
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                            : 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                          : 'border-2 border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-transparent'
                      }`}
                      title={isDoneToday ? (isElasticToday ? 'Saved with 2-min minimum today' : 'Completed today! Click to undo') : 'Check off for today'}
                    >
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-sm sm:text-base font-bold transition-all ${isDoneToday ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                          {habit.title}
                        </h3>
                        {pillarObj && (
                          <span 
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border"
                            style={{ 
                              color: pillarObj.color, 
                              backgroundColor: `${pillarObj.color}15`,
                              borderColor: `${pillarObj.color}30`
                            }}
                          >
                            {pillarObj.name}
                          </span>
                        )}
                        {isElasticToday && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
                            <Shield className="w-3 h-3 text-amber-500" /> 2-Min Save
                          </span>
                        )}
                        {isTwoDayLapse(habit) && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 flex items-center gap-1 font-semibold animate-pulse">
                            <Shield className="w-3 h-3 text-cyan-500" /> 2d Lapse Alert
                          </span>
                        )}
                      </div>

                      {/* Anchor Routine Cue */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
                          <Anchor className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>Anchor:</span>
                        </span>
                        <span className="italic text-slate-700 dark:text-slate-300 font-medium">
                          "{habit.habitAnchor || 'Daily routine'}"
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Streak Badge */}
                  <div className="flex items-center gap-2 sm:gap-2.5 self-end sm:self-auto flex-wrap">
                    {/* Emergency Minimum Action Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleElastic(habit, todayStr)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        habit.elasticDays?.[todayStr]
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                          : isTwoDayLapse(habit)
                          ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/40 font-bold'
                          : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 border border-slate-200 dark:border-white/[0.08]'
                      }`}
                      title={isTwoDayLapse(habit) ? "2-day lapse detected! Complete 2-min baseline to shield streak" : "Mark 2-minute Emergency Minimum to protect streak"}
                    >
                      <Zap className={`w-3.5 h-3.5 ${isTwoDayLapse(habit) ? 'text-cyan-500' : 'text-amber-500'}`} />
                      <span className="truncate max-w-[130px] sm:max-w-none">
                        {habit.elasticMinimum || PILLAR_DEFAULTS[habit.pillar || 'mental'] || '2-min Baseline'}
                      </span>
                    </button>

                    {/* Streak pill */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 font-mono text-xs font-bold">
                      <Flame className="w-4 h-4 fill-current" />
                      <span>{habit.habitStreak || 0}d</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => trashItem(habit.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
                      title="Delete Habit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Middle Row: Interactive 7-Day Day-Strip */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/[0.04] flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span className="font-bold uppercase tracking-wider text-[10px]">Last 7 Days (Click any day to toggle)</span>
                    <span>
                      {isDoneToday 
                        ? (isElasticToday ? '🛡️ Saved with 2-Min Minimum' : '✓ Completed Full Habit') 
                        : '○ Pending Today'}
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {last7Days.map(day => {
                      const done = Boolean(habit.habitHistory?.[day.dateStr]);
                      const isElastic = Boolean(habit.elasticDays?.[day.dateStr]);

                      return (
                        <button
                          key={day.dateStr}
                          type="button"
                          onClick={() => handleToggleHabit(habit, day.dateStr)}
                          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all border cursor-pointer ${
                            done && isElastic
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs'
                              : done
                              ? 'bg-emerald-500 text-white border-emerald-400 font-bold shadow-xs'
                              : day.isToday
                              ? 'bg-slate-50 dark:bg-white/[0.06] border-orange-500/80 text-orange-600 dark:text-orange-400 font-bold'
                              : 'bg-slate-50/70 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06] text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                          }`}
                          title={`${day.dateStr}: ${done ? (isElastic ? 'Saved via 2-min minimum' : 'Completed') : 'Not completed'}`}
                        >
                          <span className="text-[10px] font-mono uppercase tracking-tight">
                            {day.dayName}
                          </span>
                          <span className="text-xs font-mono font-bold mt-0.5">
                            {day.dayNum}
                          </span>
                          <div className="mt-1">
                            {done ? (
                              isElastic ? (
                                <Zap className="w-3 h-3 fill-current" />
                              ) : (
                                <Check className="w-3 h-3 stroke-[3]" />
                              )
                            ) : (
                              <div className={`w-1.5 h-1.5 rounded-full ${day.isToday ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Row: 60-Day Visual Consistency Grid (Collapsible) */}
                {showHeatmaps && (
                  <div className="pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 mb-1.5">
                      <span>60-Day Momentum Grid</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-xs bg-emerald-500 inline-block" /> Full
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-xs bg-amber-500 inline-block" /> 2-Min
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-xs bg-slate-200 dark:bg-white/[0.08] inline-block" /> Missed
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                      {dateRange60.map(dStr => {
                        const done = Boolean(habit.habitHistory?.[dStr]);
                        const isElastic = Boolean(habit.elasticDays?.[dStr]);
                        const isToday = dStr === todayStr;

                        return (
                          <div
                            key={dStr}
                            onClick={() => handleToggleHabit(habit, dStr)}
                            className={`w-3.5 h-3.5 rounded-xs transition-all cursor-pointer shrink-0 ${
                              done && isElastic
                                ? 'bg-amber-500 hover:bg-amber-400 border border-amber-400'
                                : done
                                ? 'bg-emerald-500 hover:bg-emerald-400 shadow-xs'
                                : isToday
                                ? 'bg-slate-200 dark:bg-white/[0.15] border border-orange-500 hover:bg-slate-300'
                                : 'bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.1]'
                            }`}
                            title={`${dStr}: ${done ? (isElastic ? `Saved with 2-min minimum (${habit.elasticMinimum || 'baseline'})` : 'Completed') : 'Missed'}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-white/[0.12] rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-slate-900 dark:text-white animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                New Atomic Habit
              </h3>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="flex flex-col gap-3.5">
              <div>
                <label className="text-[11px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">
                  Habit Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. 20-Minute Core Workout"
                  className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold flex items-center gap-1">
                  <Anchor className="w-3.5 h-3.5 text-slate-400" />
                  Anchor Routine (Trigger)
                </label>
                <input
                  type="text"
                  value={newAnchor}
                  onChange={e => setNewAnchor(e.target.value)}
                  placeholder="e.g. After I pour morning coffee..."
                  className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-amber-600 dark:text-amber-400 uppercase font-semibold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Emergency Minimum (2-Min Fallback)
                </label>
                <input
                  type="text"
                  value={newElasticMin}
                  onChange={e => setNewElasticMin(e.target.value)}
                  placeholder="e.g. 5 pushups or 1 page reading"
                  className="w-full bg-slate-50 dark:bg-white/[0.04] border border-amber-200 dark:border-amber-500/30 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">
                  Life Pillar
                </label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {PILLARS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNewPillar(p.id)}
                      className={`p-2 rounded-xl text-xs font-mono transition-all text-center border cursor-pointer ${
                        newPillar === p.id
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
                          : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full inline-block mr-1.5" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-xs font-bold text-white transition-all shadow-md shadow-orange-500/25 cursor-pointer"
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
