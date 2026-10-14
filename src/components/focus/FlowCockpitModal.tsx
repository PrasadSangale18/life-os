import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Circle, 
  Radio, 
  Headphones, 
  Send,
  Sparkles,
  Trash2,
  Clock,
  Check,
  ArrowRight
} from 'lucide-react';
import type { Item } from '../../types';
import { useStore } from '../../store';

interface FlowCockpitModalProps {
  task: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleteTask?: (taskId: string) => void;
}

type SoundType = 'none' | 'binaural' | 'rain' | 'whitenoise';

export const FlowCockpitModal: React.FC<FlowCockpitModalProps> = ({
  task,
  isOpen,
  onClose,
  onCompleteTask
}) => {
  const { addItem, updateItem, trashItem } = useStore();

  // Timer Configuration (Default 25 minutes)
  const [totalSeconds, setTotalSeconds] = useState<number>(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  
  // Ambient Sound Synth State
  const [selectedSound, setSelectedSound] = useState<SoundType>('none');
  const [volume, setVolume] = useState<number>(0.35);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // Quick Distraction Parking & Post-Session Debrief
  const [distractionText, setDistractionText] = useState<string>('');
  const [parkedFeedback, setParkedFeedback] = useState<string | null>(null);
  const [sessionParkedItems, setSessionParkedItems] = useState<Array<{ id: string; title: string }>>([]);
  const [showSessionDebrief, setShowSessionDebrief] = useState(false);

  // Subtasks list for active task
  const [subtasks, setSubtasks] = useState<Array<{ id: string; title: string; done: boolean }>>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const soundNodesRef = useRef<any[]>([]);

  // Initialize task subtasks if available
  useEffect(() => {
    if (task) {
      if (task.subtasksList && task.subtasksList.length > 0) {
        setSubtasks(task.subtasksList);
      } else if (task.checklists && task.checklists.length > 0) {
        setSubtasks(task.checklists.map(c => ({ id: c.id, title: c.text, done: c.done })));
      } else {
        // Fallback default checklist
        setSubtasks([
          { id: '1', title: 'Clarify core deliverable & outcome', done: false },
          { id: '2', title: 'Eliminate external tabs and friction', done: false },
          { id: '3', title: 'Complete main focus block without switching', done: false }
        ]);
      }
      
      const duration = (task.estMinutes && task.estMinutes > 0 ? task.estMinutes : 25) * 60;
      setTotalSeconds(duration);
      setRemainingSeconds(duration);
      setIsRunning(false);
      setIsCompleted(false);
    }
  }, [task]);

  // Timer Tick Engine
  useEffect(() => {
    let interval: any = null;
    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            stopAmbientAudio();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, remainingSeconds]);

  // Clean Web Audio Synthesizer implementation
  const initAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(isMuted ? 0 : volume, ctx.currentTime);
        masterGain.connect(ctx.destination);
        audioCtxRef.current = ctx;
        gainNodeRef.current = masterGain;
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const stopAmbientAudio = () => {
    soundNodesRef.current.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {}
    });
    soundNodesRef.current = [];
  };

  const startAmbientAudio = (type: SoundType) => {
    initAudioContext();
    const ctx = audioCtxRef.current;
    const masterGain = gainNodeRef.current;
    if (!ctx || !masterGain) return;

    stopAmbientAudio();

    if (type === 'binaural') {
      // 40Hz Gamma Focus Frequency: Left 200Hz, Right 240Hz
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      const merger = ctx.createChannelMerger(2);

      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(200, ctx.currentTime);
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(240, ctx.currentTime);

      const gainL = ctx.createGain();
      const gainR = ctx.createGain();
      gainL.gain.setValueAtTime(0.4, ctx.currentTime);
      gainR.gain.setValueAtTime(0.4, ctx.currentTime);

      oscL.connect(gainL);
      oscR.connect(gainR);
      gainL.connect(merger, 0, 0);
      gainR.connect(merger, 0, 1);
      merger.connect(masterGain);

      oscL.start();
      oscR.start();
      soundNodesRef.current = [oscL, oscR, gainL, gainR, merger];
    } else if (type === 'rain' || type === 'whitenoise') {
      // White noise buffer
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      if (type === 'rain') {
        // Low-pass filter to simulate rain drops/ambient rush
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);

        const filterGain = ctx.createGain();
        filterGain.gain.setValueAtTime(0.7, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(filterGain);
        filterGain.connect(masterGain);

        whiteNoise.start();
        soundNodesRef.current = [whiteNoise, filter, filterGain];
      } else {
        // Pure soft white noise
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3200, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(masterGain);

        whiteNoise.start();
        soundNodesRef.current = [whiteNoise, filter];
      }
    }
  };

  // Handle Sound Selection Change
  const handleSelectSound = (type: SoundType) => {
    setSelectedSound(type);
    if (type === 'none') {
      stopAmbientAudio();
    } else {
      startAmbientAudio(type);
    }
  };

  // Adjust volume
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      const v = isMuted ? 0 : volume;
      gainNodeRef.current.gain.setTargetAtTime(v, audioCtxRef.current.currentTime, 0.05);
    }
  }, [volume, isMuted]);

  // Clean up audio on unmount or close
  useEffect(() => {
    return () => {
      stopAmbientAudio();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // SVG circular progress calculation
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;
  const strokeDashoffset = circumference - progressPercent * circumference;

  const toggleSubtask = (id: string) => {
    const next = subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s);
    setSubtasks(next);
    if (task) {
      updateItem(task.id, { subtasksList: next });
    }
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    const newItem = { id: Date.now().toString(), title: newSubtaskText.trim(), done: false };
    const next = [...subtasks, newItem];
    setSubtasks(next);
    setNewSubtaskText('');
    if (task) {
      updateItem(task.id, { subtasksList: next });
    }
  };

  // Quick Distraction Parking Action
  const handleParkDistraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distractionText.trim()) return;
    const text = distractionText.trim();
    const createdId = await addItem({
      title: text,
      type: 'task',
      quadrant: 'decide',
      pillar: task?.pillar || 'mental',
      body: `Captured during deep work session on "${task?.title || 'Flow Focus'}"`
    });
    if (createdId) {
      setSessionParkedItems(prev => [...prev, { id: createdId, title: text }]);
    }
    setDistractionText('');
    setParkedFeedback(`Parked to inbox: "${text}"`);
    setTimeout(() => setParkedFeedback(null), 3000);
  };

  const handleCompleteActiveTask = () => {
    if (task) {
      updateItem(task.id, { status: 'done' });
      if (onCompleteTask) onCompleteTask(task.id);
    }
    if (sessionParkedItems.length > 0) {
      setShowSessionDebrief(true);
    } else {
      stopAmbientAudio();
      onClose();
    }
  };

  const handleRequestExit = () => {
    if (sessionParkedItems.length > 0) {
      setShowSessionDebrief(true);
    } else {
      stopAmbientAudio();
      onClose();
    }
  };

  const handleDiscardParked = (id: string) => {
    trashItem(id);
    setSessionParkedItems(prev => prev.filter(i => i.id !== id));
  };

  const handleScheduleParked = (id: string) => {
    updateItem(id, { scheduledStart: '15:30', deadline: Date.now() });
    setSessionParkedItems(prev => prev.filter(i => i.id !== id));
  };

  const handleKeepParked = (id: string) => {
    setSessionParkedItems(prev => prev.filter(i => i.id !== id));
  };

  const handleFinishDebrief = () => {
    setShowSessionDebrief(false);
    stopAmbientAudio();
    onClose();
  };

  if (!isOpen || !task) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#0A0D14] border border-white/[0.12] rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.85)] flex flex-col text-slate-100"
        >
          {/* Top Control Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF5A1F] to-[#EA580C] flex items-center justify-center shadow-[0_0_15px_rgba(255,90,31,0.4)]">
                <Radio className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div>
                <span className="text-[11px] font-mono tracking-widest text-[#FF5A1F] uppercase font-bold">
                  Deep Work Flow State
                </span>
                <h3 className="text-sm font-semibold text-slate-200 truncate max-w-md">
                  {task.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRequestExit}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
                title="Exit Cockpit"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {showSessionDebrief ? (
            /* Post-Flow Distraction Triage Debrief View */
            <div className="p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Post-Flow Distraction Triage
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                        {sessionParkedItems.length} Remaining
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Review thoughts captured during focus before returning to your day.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleFinishDebrief}
                  className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-semibold text-slate-200 transition-all flex items-center gap-2"
                >
                  <span>Skip Remaining</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {sessionParkedItems.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">All Distractions Processed!</h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Your focus buffer is clear. No loose ends left behind.
                  </p>
                  <button
                    onClick={handleFinishDebrief}
                    className="mt-2 px-6 py-2.5 rounded-xl bg-[#FF5A1F] hover:bg-[#EA580C] text-white font-medium text-xs shadow-lg shadow-[#FF5A1F]/20 transition-all"
                  >
                    Complete Deep Work Session
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
                  {sessionParkedItems.map(item => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/[0.15] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        <span className="text-sm font-medium text-slate-200">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleDiscardParked(item.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition-all"
                          title="Discard impulsive thought"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Brain Fog</span>
                        </button>
                        <button
                          onClick={() => handleScheduleParked(item.id)}
                          className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-medium flex items-center gap-1.5 transition-all"
                          title="Schedule for later today"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Do Today</span>
                        </button>
                        <button
                          onClick={() => handleKeepParked(item.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center gap-1.5 transition-all"
                          title="Keep safe in backlog"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Keep in Inbox</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {sessionParkedItems.length > 0 && (
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end">
                  <button
                    onClick={handleFinishDebrief}
                    className="px-6 py-2.5 rounded-xl bg-[#FF5A1F] hover:bg-[#EA580C] text-white font-semibold text-xs shadow-lg shadow-[#FF5A1F]/25 flex items-center gap-2 transition-all"
                  >
                    <span>Done Triaging</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Main Grid: Left Timer & Audio | Right Checklist & Distraction Parking */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8">
            
            {/* Left Column: Focus Dial & Ambient Sound Synth (7 cols) */}
            <div className="md:col-span-7 flex flex-col items-center justify-center gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              {/* Circular SVG Chronometer */}
              <div className="relative flex items-center justify-center">
                <svg className="w-56 h-56 transform -rotate-90">
                  <circle
                    cx="112"
                    cy="112"
                    r={radius}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="112"
                    cy="112"
                    r={radius}
                    stroke={isCompleted ? "#10B981" : "#FF5A1F"}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-linear"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(255,90,31,0.25)]">
                    {formatTime(remainingSeconds)}
                  </span>
                  <span className="text-xs uppercase tracking-wider font-mono text-slate-400 mt-1">
                    {isRunning ? 'Flow Active' : isCompleted ? 'Block Completed!' : 'Ready to Start'}
                  </span>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-lg transition-all ${
                    isRunning 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30' 
                      : 'bg-[#FF5A1F] text-white hover:bg-[#EA580C] shadow-[0_4px_16px_rgba(255,90,31,0.35)]'
                  }`}
                >
                  {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  {isRunning ? 'Pause' : 'Start Focus'}
                </button>

                <button
                  onClick={() => {
                    setIsRunning(false);
                    setRemainingSeconds(totalSeconds);
                    setIsCompleted(false);
                  }}
                  className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/[0.08] transition-all"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setRemainingSeconds(prev => prev + 5 * 60)}
                  className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-mono text-slate-300 border border-white/[0.08] transition-all"
                  title="Add 5 Minutes"
                >
                  +5m
                </button>
              </div>

              {/* Ambient Sound Synthesizer Controls */}
              <div className="w-full max-w-sm pt-4 border-t border-white/[0.08] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                    <Headphones className="w-3.5 h-3.5 text-[#FF5A1F]" />
                    <span>Focus Ambient Noise</span>
                  </div>
                  <button 
                    onClick={() => setIsMuted(!isMuted)} 
                    className="text-slate-400 hover:text-white"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {(['none', 'binaural', 'rain', 'whitenoise'] as SoundType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => handleSelectSound(type)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-mono capitalize transition-all ${
                        selectedSound === type 
                          ? 'bg-[#FF5A1F]/20 text-[#FF5A1F] border border-[#FF5A1F]/40 font-bold' 
                          : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] border border-white/[0.06]'
                      }`}
                    >
                      {type === 'whitenoise' ? 'White' : type}
                    </button>
                  ))}
                </div>

                {selectedSound !== 'none' && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-slate-500">Vol</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={e => setVolume(parseFloat(e.target.value))}
                      className="w-full accent-[#FF5A1F] h-1.5 bg-white/[0.1] rounded-lg cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Execution Subtasks & Distraction Parking (5 cols) */}
            <div className="md:col-span-5 flex flex-col justify-between gap-5">
              
              {/* Micro-Execution Checklist */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Subtask Checklist
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {subtasks.filter(s => s.done).length}/{subtasks.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                  {subtasks.map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleSubtask(item.id)}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        item.done
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-slate-400'
                          : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.18] text-slate-200'
                      }`}
                    >
                      {item.done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      )}
                      <span className={`text-xs leading-relaxed ${item.done ? 'line-through text-slate-500' : ''}`}>
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddSubtask} className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskText}
                    onChange={e => setNewSubtaskText(e.target.value)}
                    placeholder="Add step..."
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF5A1F]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-medium text-white transition-all shrink-0"
                  >
                    Add
                  </button>
                </form>
              </div>

              {/* Park Distraction (Anti-Context Switch Drawer) */}
              <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/[0.15] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-amber-400 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Park Distraction
                  </span>
                  <span className="text-[10px] text-slate-500">Jot & keep focus</span>
                </div>

                <form onSubmit={handleParkDistraction} className="relative flex items-center">
                  <input
                    type="text"
                    value={distractionText}
                    onChange={e => setDistractionText(e.target.value)}
                    placeholder="Stray thought that popped up..."
                    className="w-full bg-black/40 border border-white/[0.1] rounded-xl pl-3 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={!distractionText.trim()}
                    className="absolute right-2 text-amber-400 disabled:opacity-30 hover:scale-110 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                {parkedFeedback && (
                  <span className="text-[10px] text-emerald-400 font-mono transition-opacity">
                    ✓ {parkedFeedback}
                  </span>
                )}
              </div>

              {/* Finish & Mark Complete Button */}
              <div className="pt-2 border-t border-white/[0.08] flex items-center gap-3">
                <button
                  onClick={handleCompleteActiveTask}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(16,185,129,0.3)] transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 fill-current" />
                  Mark Task Complete
                </button>
              </div>
            </div>

          </div>
        )}
      </motion.div>
      </div>
    </AnimatePresence>
  );
};
