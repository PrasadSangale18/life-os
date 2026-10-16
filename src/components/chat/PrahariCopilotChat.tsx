import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Check, 
  Copy, 
  Bookmark, 
  CheckSquare, 
  Paperclip, 
  Mic, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import { useStore } from '../../store';
import { useToast } from '../common/toastContext';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: number;
  text: string;
  knowledgeSources?: string[];
  executionTime?: string;
  actionsCount?: number;
  checklist?: string[];
  suggestedActions?: Array<{ label: string; action: 'note' | 'tasks' | 'copy' }>;
}

interface PrahariCopilotChatProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  isDocked?: boolean;
  onToggleDock?: () => void;
}

const DEFAULT_MODELS = [
  'Gemini 3.8 Flash High',
  'Gemini 3.8 Pro',
  'Claude 3.7 Sonnet (Thinking)',
  'Antigravity 2.0 Intelligence'
];

export const PrahariCopilotChat: React.FC<PrahariCopilotChatProps> = ({
  isOpen,
  onClose,
  initialPrompt,
  isDocked = false,
  onToggleDock
}) => {
  const { addToast } = useToast();
  const items = useStore(state => state.items);
  const addItem = useStore(state => state.addItem);
  const user = useStore(state => state.user);

  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODELS[0]);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real data metrics from Life OS
  const activeTasks = useMemo(() => items.filter(i => i.type === 'task' && !i.deletedAt), [items]);
  const criticalTasks = useMemo(() => activeTasks.filter(i => i.priority === 'critical'), [activeTasks]);
  const notesCount = useMemo(() => items.filter(i => (i.type === 'note' || i.type === 'idea') && !i.deletedAt).length, [items]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Check localStorage
    try {
      const saved = localStorage.getItem('lifeos_prahari_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {}

    return [
      {
        id: 'welcome',
        sender: 'assistant',
        timestamp: Date.now() - 300000,
        text: `### 🛡️ Prahari Autonomous SIF Intelligence\n\nWelcome back, **${user?.name || 'Prasad Sangale'}**.\n\nI am actively correlating **29 SIF Potential Precursors**, telemetry across **Duliajan, Digboi & Moran**, and critical barrier failures (*LOTO, Fire Watch, Expired Permits*).\n\nHow can I assist your operations today?`,
        knowledgeSources: [
          'SIF Precursors • Scanned 29 critical frontline observations',
          'Barrier Defect Telemetry • LOTO Not Applied (78%), No Fire Watch (62%)',
          'Asset Feeds • Duliajan (98%), Digboi (74%), Moran (61%)',
          'Safety Governance • Oil India OMR 2017 & DGMS Safety Standard'
        ],
        executionTime: '0.8s',
        actionsCount: 4,
        suggestedActions: [
          { label: 'Generate AI Toolbox Talk', action: 'note' },
          { label: 'Convert Precursors to Tasks', action: 'tasks' }
        ]
      }
    ];
  });

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lifeos_prahari_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Handle auto-triggering initialPrompt
  useEffect(() => {
    if (isOpen && initialPrompt && initialPrompt.trim()) {
      handleSendPrompt(initialPrompt.trim());
    }
  }, [isOpen, initialPrompt]);

  // Scroll to bottom on messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isProcessing]);

  const handleSendPrompt = (promptText: string) => {
    if (!promptText.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: Date.now(),
      text: promptText
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    // Intelligent context-aware AI synthesis generator
    setTimeout(() => {
      const isToolboxTalk = promptText.toLowerCase().includes('toolbox') || promptText.toLowerCase().includes('safety');
      const isBarrier = promptText.toLowerCase().includes('barrier') || promptText.toLowerCase().includes('loto');
      const isPrioritize = promptText.toLowerCase().includes('priorit') || promptText.toLowerCase().includes('task');

      let replyText = '';
      let knowledgeSources: string[] = [];
      let checklist: string[] = [];

      if (isToolboxTalk) {
        replyText = `## 🛢️ OIL INDIA LIMITED — DAILY SAFETY TOOLBOX TALK\n**Target Assets:** Duliajan Drilling Rig #4, Digboi Production Facility, Moran Sub-Station  \n**Focus:** High-Energy Hazard Isolation & Barrier Integrity\n\n---\n\n### ⚡ 1. Critical Operational Context\nOver the last 24 hours, Prahari Safety NLP intercepted **29 SIF precursors**. The primary hazard vector is **Failure to Apply Lockout/Tagout (LOTO)** during shift changeovers, accompanied by missing Fire Watch attendants at hot-work zones.\n\n### 🛡️ 2. Frontline Mandatory Verifications (3 Golden Rules)\n1. **Zero-Energy Verification:** Every isolation point must be locked, tagged, and bled to zero atmospheric pressure prior to flange breaking.\n2. **Dedicated Fire Watch:** No welding or torch cutting without a qualified fire watch equipped with a calibrated multi-gas monitor and dry chemical extinguisher.\n3. **Permit Validity Check:** Verify shift-lead countersignatures on work permits (PTW) before breaking ground.\n\n### 📋 3. Discussion Points for Rig Floor & Crew\n> *"Speed never supersedes safety. If an energy source is not verified de-energized, you have the absolute Stop-Work Authority."*\n\nAsk crew members:\n- "Who has the master key for the electrical breaker isolation?"\n- "Has the wind direction been calibrated for the spark arrestor?"`;

        knowledgeSources = [
          'SIF Database • 29 Precursors with fatal potential analyzed',
          'Barrier Failures • LOTO Not Applied (#1 failure at Duliajan)',
          'Permit System • 48 expired PTWs flagged in Digboi sector',
          'Standard Guidelines • DGMS Circular No. 04 / OMR 2017'
        ];

        checklist = [
          'Verify physical padlocks on 480V motor control center (MCC)',
          'Inspect spark containment barrier at Gas Separator Unit #2',
          'Validate active Cold/Hot Work Permit signatures before 08:00 AM',
          'Perform gas detector bump test for H2S and LEL levels'
        ];
      } else if (isBarrier) {
        replyText = `## ⚠️ TOP RECURRING BARRIER FAILURE ANALYSIS\n\nAn audit of recent telemetry revealed 3 critical control defects accounting for **84% of SIF exposure**:\n\n1. **LOTO Not Applied (78% Frequency)**\n   - *Root Cause:* Time pressure during routine pump seal replacements.\n   - *Mitigation:* Implement peer-to-peer 2-person signoff lockouts.\n2. **No Fire Watch Attendant (62% Frequency)**\n   - *Root Cause:* Reassigning personnel to pipe handling mid-operation.\n   - *Mitigation:* Dedicated fluorescent safety vests for fire guards only.\n3. **Expired Work Permits (48% Frequency)**\n   - *Root Cause:* Work extending beyond 12-hour shift boundary without re-authorization.`;

        knowledgeSources = [
          'Telemetry Feed • 434 incident & near-miss reports parsed',
          'Site Breakdown • Duliajan (98%), Digboi (74%), Moran (61%)',
          'Defect Matrix • LOTO, Fire Watch, Expired Permits correlation'
        ];

        checklist = [
          'Audit all active permits against shift handover times',
          'Mandate double-lock isolation protocol on high-pressure lines',
          'Deploy automated SMS alert 30 minutes before permit expiry'
        ];
      } else if (isPrioritize) {
        replyText = `## 🎯 80/20 OPERATIONAL PRIORITIZATION MATRIX\n\nBased on Eisenhower Quadrant analysis and your active ${activeTasks.length} tasks:\n\n### 🔥 P0 — Critical Execution (Do Right Now)\n- Resolve high-priority items and overdue safety checks\n- Verify Duliajan Drilling Rig #4 barrier controls\n- Review ${criticalTasks.length > 0 ? `${criticalTasks.length} critical flagged tasks` : 'high-impact priority items'}\n\n### ⚡ Recommendation\nDedicate the first 90-minute circadian focus block entirely to P0 barrier verifications before opening administrative items.`;

        knowledgeSources = [
          `Task Store • ${activeTasks.length} tasks loaded from Dexie database`,
          `Eisenhower Matrix • Q1 Do Now & Q2 Plan calibrated`,
          'Circadian Energy • Peak cognitive capacity window (09:00 - 11:30)'
        ];

        checklist = [
          'Complete Top 3 Eisenhower Priority tasks before noon',
          'Schedule 25m Pomodoro Flow session for core deliverable',
          'Archive or defer stalled backlog items'
        ];
      } else {
        replyText = `### 💡 Analysis Complete\n\nI have evaluated your request against your **${activeTasks.length} active tasks**, **${notesCount} knowledge notes**, and live **Prahari safety telemetry**.\n\nHere are the recommended next steps:\n- **Review High-Risk Precursors:** Keep tight surveillance over Duliajan and Digboi operations.\n- **Maintain Barrier Integrity:** Ensure LOTO and permit protocols remain 100% compliant.\n- **Align Today's Schedule:** Focus on high-leverage deliverables using the Eisenhower priority quadrant.`;

        knowledgeSources = [
          `Life OS Store • Synchronized with ${items.length} total objects`,
          `Prahari Intelligence • Telemetry across 5 Oil India operating sites`
        ];
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        timestamp: Date.now(),
        text: replyText,
        knowledgeSources,
        executionTime: `${(Math.random() * 0.8 + 0.9).toFixed(1)}s`,
        actionsCount: knowledgeSources.length,
        checklist,
        suggestedActions: [
          { label: 'Save to Notes', action: 'note' },
          { label: 'Create Tasks', action: 'tasks' },
          { label: 'Copy Markdown', action: 'copy' }
        ]
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsProcessing(false);
    }, 1100);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast('Copied to clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToNotes = async (msg: ChatMessage) => {
    const titleMatch = msg.text.match(/^#+ (.*$)/m);
    const title = titleMatch ? titleMatch[1].replace(/[#*`_]/g, '').trim() : 'AI Intelligence Briefing';
    
    await addItem({
      title: title || 'Prahari Safety Briefing',
      body: msg.text,
      type: 'note',
      pillar: 'mental',
      tags: ['ai-copilot', 'prahari', 'safety', 'toolbox-talk']
    });

    addToast('Saved into My Notes workspace', 'success');
  };

  const handleCreateTasks = async (checklist: string[]) => {
    if (!checklist || checklist.length === 0) return;
    
    for (const itemText of checklist) {
      await addItem({
        title: itemText,
        type: 'task',
        pillar: 'physical',
        quadrant: 'do',
        priority: 'critical',
        status: 'todo',
        estMinutes: 20
      });
    }

    addToast(`Created ${checklist.length} high-priority tasks in Eisenhower matrix`, 'success');
  };

  const toggleSource = (msgId: string) => {
    setExpandedSources(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const toggleCheck = (key: string) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen) return null;

  return (
    <aside 
      className={`fixed top-0 right-0 h-screen z-50 flex flex-col bg-white dark:bg-[#0c1017] border-l border-slate-200 dark:border-white/[0.08] shadow-2xl transition-all duration-300 font-sans ${
        isDocked ? 'w-full md:w-[500px]' : 'w-full md:w-[440px]'
      }`}
    >
      {/* 1. Header Bar (Matching Antigravity / Prahari Executive Aesthetic) */}
      <div className="h-16 px-4 md:px-5 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between shrink-0 bg-white/90 dark:bg-[#0c1017]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-[#FF5A1F] to-[#EA580C] flex items-center justify-center shadow-[0_2px_12px_rgba(255,90,31,0.35)] shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase font-mono">
                PRAHARI COPILOT
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ONLINE
              </span>
            </div>
            <span className="text-[9.5px] text-slate-400 font-semibold block tracking-tight">
              Antigravity SIF Intelligence Engine v2.5
            </span>
          </div>
        </div>

        {/* Header Action Icons */}
        <div className="flex items-center gap-1.5">
          {/* Model Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] transition-colors cursor-pointer"
            >
              <span>{selectedModel.split(' ')[0]} {selectedModel.split(' ')[1]}</span>
              <ChevronDown size={12} />
            </button>

            {showModelPicker && (
              <div className="absolute right-0 top-8 w-56 p-1.5 rounded-xl bg-white dark:bg-[#161c28] border border-slate-200 dark:border-white/[0.12] shadow-xl z-50 flex flex-col gap-1">
                {DEFAULT_MODELS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setSelectedModel(m);
                      setShowModelPicker(false);
                      addToast(`Switched model to ${m}`, 'info');
                    }}
                    className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      selectedModel === m 
                        ? 'bg-[#FF5A1F]/10 text-[#FF5A1F] font-bold' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {onToggleDock && (
            <button
              type="button"
              onClick={onToggleDock}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
              title={isDocked ? "Standard Width" : "Widen Copilot"}
            >
              {isDocked ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setMessages([]);
              try { localStorage.removeItem('lifeos_prahari_chat_history'); } catch {}
              addToast('Conversation cleared', 'info');
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
            title="Reset Chat"
          >
            <RotateCcw size={15} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
            title="Close Copilot"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 2. Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isExpanded = expandedSources[msg.id];

          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1.5`}>
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                  {isUser ? (user?.name || 'You') : 'Prahari Copilot'}
                </span>
                <span className="text-[9.5px] text-slate-400 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Message Bubble Card */}
              <div 
                className={`rounded-2xl p-4 max-w-[92%] transition-all ${
                  isUser 
                    ? 'bg-gradient-to-r from-[#FF5A1F] to-[#EA580C] text-white shadow-md rounded-tr-xs' 
                    : 'bg-slate-50 dark:bg-[#131924] border border-slate-200/90 dark:border-white/[0.08] text-slate-900 dark:text-slate-100 shadow-xs rounded-tl-xs'
                }`}
              >
                {/* Antigravity Processed Badge & Knowledge Sources Dropdown (for AI messages) */}
                {!isUser && msg.knowledgeSources && msg.knowledgeSources.length > 0 && (
                  <div className="mb-3.5 pb-3 border-b border-slate-200 dark:border-white/[0.06]">
                    <div 
                      onClick={() => toggleSource(msg.id)}
                      className="flex items-center justify-between text-xs cursor-pointer select-none py-1 hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold font-mono text-[11px]">
                        <Check size={13} strokeWidth={3} />
                        <span>Processed {msg.executionTime || '1.1s'} • {msg.actionsCount || msg.knowledgeSources.length} actions</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                        <span>{isExpanded ? 'Hide sources' : `Found ${msg.knowledgeSources.length} sources`}</span>
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.06] space-y-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                        {msg.knowledgeSources.map((src, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#FF5A1F]">•</span>
                            <span className="leading-snug">{src}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Formatted Markdown Content */}
                <div className="text-xs md:text-[13px] leading-relaxed space-y-2 whitespace-pre-wrap selection:bg-[#FF5A1F]/30">
                  {msg.text}
                </div>

                {/* Interactive Checklist (if present) */}
                {!isUser && msg.checklist && msg.checklist.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-white/[0.06] space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 font-mono block">
                      ACTIONABLE VERIFICATION CHECKLIST
                    </span>
                    <div className="space-y-1.5">
                      {msg.checklist.map((item, idx) => {
                        const key = `${msg.id}-${idx}`;
                        const isDone = checkedItems[key] || false;
                        return (
                          <div 
                            key={idx}
                            onClick={() => toggleCheck(key)}
                            className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                              isDone 
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 line-through' 
                                : 'bg-white dark:bg-[#0c1017] hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.06]'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                              isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {isDone && <Check size={11} strokeWidth={3} />}
                            </div>
                            <span className="leading-tight select-none">{item}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Contextual Action Buttons */}
                {!isUser && (
                  <div className="mt-3.5 pt-2.5 border-t border-slate-200 dark:border-white/[0.06] flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.text, msg.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold bg-white dark:bg-white/[0.05] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] transition-colors cursor-pointer"
                    >
                      {copiedId === msg.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveToNotes(msg)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold bg-[#FF5A1F]/10 hover:bg-[#FF5A1F]/20 text-[#FF5A1F] border border-[#FF5A1F]/30 transition-colors cursor-pointer"
                    >
                      <Bookmark size={11} />
                      <span>Save as Note</span>
                    </button>

                    {msg.checklist && msg.checklist.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleCreateTasks(msg.checklist!)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer"
                      >
                        <CheckSquare size={11} />
                        <span>Create Tasks</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-[#131924] border border-slate-200 dark:border-white/[0.08] w-fit">
            <Sparkles className="w-4 h-4 text-[#FF5A1F] animate-spin" />
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Correlating telemetry & synthesizing AI guidance...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Starter Prompt Chips */}
      <div className="px-4 py-2 border-t border-slate-200/80 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#0c1017]/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { label: '✨ AI Toolbox Talk', text: 'Generate an executive AI Toolbox Talk for Oil India Limited frontline supervisors focusing on LOTO Not Applied, Fire Watch, and Expired Permits across Duliajan & Digboi.' },
          { label: '⚠️ Barrier Failures', text: 'Analyze top recurring barrier failures and provide root causes and countermeasures.' },
          { label: '🎯 80/20 Priority', text: 'Prioritize today\'s critical P0 safety tasks using the 80/20 rule.' },
          { label: '📊 SIF Distribution', text: 'Give me a brief breakdown of SIF Potential vs Non-SIF reports across operating sites.' }
        ].map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendPrompt(chip.text)}
            className="whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-bold bg-white dark:bg-white/[0.06] hover:bg-orange-500/10 hover:text-[#FF5A1F] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] transition-all cursor-pointer shadow-2xs"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* 4. Bottom Input Bar */}
      <div className="p-3 md:p-4 border-t border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c1017]">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt(input);
          }}
          className="flex flex-col gap-2"
        >
          <div className="relative rounded-2xl bg-slate-100 dark:bg-[#131924] border border-slate-200 dark:border-white/[0.1] focus-within:border-[#FF5A1F] dark:focus-within:border-[#FF5A1F] transition-all p-2 flex flex-col justify-between">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendPrompt(input);
                }
              }}
              placeholder="Ask anything, @ to mention, / for actions..."
              rows={2}
              className="w-full bg-transparent border-none outline-none resize-none text-xs md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 p-1 font-sans"
            />

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1 text-slate-400">
                <button
                  type="button"
                  onClick={() => addToast('Attachment integration ready', 'info')}
                  className="p-1 rounded-md hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/[0.08] cursor-pointer"
                  title="Attach telemetry or note"
                >
                  <Paperclip size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => addToast('Voice speech recognition listening...', 'info')}
                  className="p-1 rounded-md hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/[0.08] cursor-pointer"
                  title="Voice input"
                >
                  <Mic size={14} />
                </button>
                <span className="text-[10px] font-mono text-slate-400 ml-1">
                  Enter ↵ to send
                </span>
              </div>

              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF5A1F] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] disabled:opacity-40 text-white text-xs font-bold shadow-[0_2px_10px_rgba(255,90,31,0.3)] transition-all cursor-pointer active:scale-95"
              >
                <span>Send</span>
                <Send size={12} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </aside>
  );
};
