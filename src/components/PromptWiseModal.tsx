import { useState, useMemo } from 'react';
import { useStore } from '../store';
import type { Item } from '../types';
import { generateExternalAIPrompt, triggerFileDownload, type PromptTemplate } from '../utils/exportPrompt';
import { useToast } from './common/toastContext';
import { 
  Sparkles, 
  X, 
  Copy, 
  Check, 
  Download, 
  FileCode2,
  CheckSquare,
  Target,
  Clock,
  Lightbulb,
  Scale
} from 'lucide-react';

interface PromptWiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: Item;
}

export const PromptWiseModal = ({ isOpen, onClose, initialTask }: PromptWiseModalProps) => {
  const { addToast } = useToast();
  const items = useStore(s => s.items);

  const [scope, setScope] = useState<'today' | 'open' | 'all' | 'single'>(initialTask ? 'single' : 'today');
  const [template, setTemplate] = useState<PromptTemplate>('task_management');
  const [customInstructions, setCustomInstructions] = useState('');
  const [copied, setCopied] = useState(false);

  const categories: Array<{
    id: PromptTemplate;
    label: string;
    sublabel: string;
    icon: any;
    color: string;
    bg: string;
    border: string;
  }> = [
    {
      id: 'task_management',
      label: 'Task Management',
      sublabel: 'Atomic Breakdown & 80/20',
      icon: CheckSquare,
      color: '#f97316',
      bg: 'rgba(249, 115, 22, 0.1)',
      border: 'rgba(249, 115, 22, 0.3)'
    },
    {
      id: 'goal_setting',
      label: 'Goal Setting',
      sublabel: 'OKR Roadmap & Milestones',
      icon: Target,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.3)'
    },
    {
      id: 'time_management',
      label: 'Time Management',
      sublabel: 'Circadian Blocks & Buffers',
      icon: Clock,
      color: '#0ea5e9',
      bg: 'rgba(14, 165, 233, 0.1)',
      border: 'rgba(14, 165, 233, 0.3)'
    },
    {
      id: 'brainstorming',
      label: 'Brainstorming',
      sublabel: 'First-Principles & SCAMPER',
      icon: Lightbulb,
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.1)',
      border: 'rgba(168, 85, 247, 0.3)'
    },
    {
      id: 'decision_making',
      label: 'Decision Making',
      sublabel: 'Pairwise Matrix & Pre-Mortem',
      icon: Scale,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)'
    }
  ];

  const generatedPrompt = useMemo(() => {
    return generateExternalAIPrompt(items, {
      scope: initialTask && scope === 'single' ? 'single' : scope,
      template,
      task: initialTask,
      customInstructions: customInstructions.trim() || undefined
    });
  }, [items, scope, template, initialTask, customInstructions]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      addToast('Prompt Copied', 'Prompt copied to clipboard. Ready for ChatGPT, Claude, Gemini, or DeepSeek.', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      addToast('Copy Failed', 'Unable to copy to clipboard.', 'error');
    }
  };

  const handleDownload = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    triggerFileDownload(generatedPrompt, `ai-prompt-${template}-${dateStr}.md`, 'text/markdown');
    addToast('Prompt Saved', `ai-prompt-${template}-${dateStr}.md downloaded.`, 'info');
  };

  const activeCategory = categories.find(c => c.id === template) || categories[0];

  return (
    <div 
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: "100%",
          maxWidth: 760,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: 18,
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          style={{
            padding: "16px 22px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-surface-elevated)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div 
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(249, 115, 22, 0.2) 100%)",
                border: "1px solid rgba(168, 85, 247, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c084fc"
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: 16, fontWeight: 750, margin: 0, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                  Productivity Intelligence AI Hub
                </h2>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 9999, background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.3)" }}>
                  PROMPT-WISE V2
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
                Solve Task, Goal, Time, Brainstorming & Decision bottlenecks with executive-grade AI frameworks
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: 6, borderRadius: 6, color: "var(--text-tertiary)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", flex: 1 }}>
          
          {/* 5 Core Productivity Category Cards */}
          <div>
            <label className="text-label" style={{ display: "block", marginBottom: 8, fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Select Productivity Framework
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
              {categories.map(cat => {
                const Icon = cat.icon;
                const isSelected = template === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setTemplate(cat.id)}
                    style={{
                      padding: "10px 10px",
                      borderRadius: 10,
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      transition: "all 0.15s ease",
                      background: isSelected ? cat.bg : "var(--bg-surface-elevated)",
                      border: `1.5px solid ${isSelected ? cat.border : "var(--border-subtle)"}`,
                      boxShadow: isSelected ? `0 4px 14px ${cat.bg}` : "none"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon size={14} color={cat.color} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? "var(--text-primary)" : "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {cat.label}
                      </span>
                    </div>
                    <span style={{ fontSize: 10.5, color: isSelected ? cat.color : "var(--text-tertiary)", lineHeight: 1.25 }}>
                      {cat.sublabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scope Selection */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <label className="text-label" style={{ display: "block", marginBottom: 6, fontSize: 10.5 }}>
                Context Scope (Data from your Life OS)
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {initialTask && (
                  <button
                    type="button"
                    onClick={() => setScope('single')}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 7,
                      fontSize: 12,
                      fontWeight: scope === 'single' ? 600 : 450,
                      background: scope === 'single' ? activeCategory.bg : "var(--bg-surface-elevated)",
                      color: scope === 'single' ? activeCategory.color : "var(--text-secondary)",
                      border: `1px solid ${scope === 'single' ? activeCategory.border : "var(--border-subtle)"}`,
                      cursor: "pointer"
                    }}
                  >
                    Selected Task
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setScope('today')}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: scope === 'today' ? 600 : 450,
                    background: scope === 'today' ? activeCategory.bg : "var(--bg-surface-elevated)",
                    color: scope === 'today' ? activeCategory.color : "var(--text-secondary)",
                    border: `1px solid ${scope === 'today' ? activeCategory.border : "var(--border-subtle)"}`,
                    cursor: "pointer"
                  }}
                >
                  Today&apos;s Active Workload
                </button>
                <button
                  type="button"
                  onClick={() => setScope('open')}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: scope === 'open' ? 600 : 450,
                    background: scope === 'open' ? activeCategory.bg : "var(--bg-surface-elevated)",
                    color: scope === 'open' ? activeCategory.color : "var(--text-secondary)",
                    border: `1px solid ${scope === 'open' ? activeCategory.border : "var(--border-subtle)"}`,
                    cursor: "pointer"
                  }}
                >
                  All Open Tasks & Backlog
                </button>
              </div>
            </div>
          </div>

          {/* Optional Custom Constraints */}
          <div>
            <label className="text-label" style={{ display: "block", marginBottom: 4, fontSize: 10.5 }}>
              Custom Directives & Constraints (Optional)
            </label>
            <input 
              type="text"
              value={customInstructions}
              onChange={e => setCustomInstructions(e.target.value)}
              placeholder="e.g. 'I have a 3-hour focus window', 'Prioritize high-revenue deliverables', 'Include 10-minute buffers'..."
              className="ui-input"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 12.5,
                background: "var(--bg-surface-elevated)"
              }}
            />
          </div>

          {/* Prompt Preview Codebox */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minHeight: 200 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="text-label" style={{ fontSize: 10.5, display: "flex", alignItems: "center", gap: 5 }}>
                <FileCode2 size={13} color={activeCategory.color} />
                <span>Generated Executive AI Prompt Preview</span>
              </span>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                {generatedPrompt.length} characters
              </span>
            </div>

            <div 
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-subtle)",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                lineHeight: 1.55,
                color: "var(--text-primary)",
                maxHeight: 240,
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word"
              }}
            >
              {generatedPrompt}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div 
          style={{
            padding: "14px 22px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-surface-elevated)"
          }}
        >
          <button 
            type="button"
            onClick={handleDownload}
            className="btn-ghost"
            style={{ fontSize: 12.5, padding: "7px 14px", gap: 6, border: "1px solid var(--border-subtle)" }}
          >
            <Download size={13} />
            <span>Download Prompt (.md)</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button 
              type="button"
              onClick={onClose}
              className="btn-ghost"
              style={{ fontSize: 12.5, padding: "7px 14px" }}
            >
              Close
            </button>
            <button 
              type="button"
              onClick={handleCopy}
              className="btn-primary"
              style={{ 
                fontSize: 12.5, 
                padding: "8px 18px", 
                gap: 7,
                background: copied ? "#10b981" : activeCategory.color,
                borderColor: copied ? "#10b981" : activeCategory.color
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? "Copied to Clipboard!" : `Copy ${activeCategory.label} Prompt`}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
