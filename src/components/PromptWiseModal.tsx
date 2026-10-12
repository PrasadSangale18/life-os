import { useState, useMemo } from 'react';
import { useStore } from '../store';
import type { Item } from '../types';
import { generateExternalAIPrompt, triggerFileDownload } from '../utils/exportPrompt';
import { useToast } from './common/toastContext';
import { 
  Sparkles, 
  X, 
  Copy, 
  Check, 
  Download, 
  FileCode2
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
  const [template, setTemplate] = useState<'breakdown' | 'schedule' | 'first_principles' | 'blockers'>('breakdown');
  const [customInstructions, setCustomInstructions] = useState('');
  const [copied, setCopied] = useState(false);

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
      addToast('Prompt Copied', 'Prompt copied to clipboard. Ready for ChatGPT, Claude, or Gemini.', 'success');
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

  return (
    <div 
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.72)",
        backdropFilter: "blur(12px)",
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
          maxWidth: 680,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: 16,
          boxShadow: "var(--shadow-modal)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "88vh",
          overflow: "hidden"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div 
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(234, 88, 12, 0.12)",
                color: "#ea580c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(234, 88, 12, 0.25)"
              }}
            >
              <Sparkles size={17} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 650, margin: 0, color: "var(--text-primary)" }}>
                Prompt-Wise AI Task Breakdown
              </h2>
              <p style={{ fontSize: 12, margin: 0, color: "var(--text-secondary)", marginTop: 2 }}>
                Export structured prompts ready for ChatGPT, Claude, Gemini, or DeepSeek
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: 6, borderRadius: 6, color: "var(--text-tertiary)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", flex: 1 }}>
          
          {/* Controls Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            
            {/* Scope Selection */}
            <div>
              <label className="text-label" style={{ display: "block", marginBottom: 6, fontSize: 10 }}>
                Data Scope
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {initialTask && (
                  <button
                    type="button"
                    onClick={() => setScope('single')}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: scope === 'single' ? 600 : 450,
                      background: scope === 'single' ? "var(--accent-bg)" : "var(--bg-surface-elevated)",
                      color: scope === 'single' ? "var(--accent-primary)" : "var(--text-secondary)",
                      border: `1px solid ${scope === 'single' ? "var(--accent-border)" : "var(--border-default)"}`,
                      cursor: "pointer"
                    }}
                  >
                    This Task
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setScope('today')}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: scope === 'today' ? 600 : 450,
                    background: scope === 'today' ? "var(--accent-bg)" : "var(--bg-surface-elevated)",
                    color: scope === 'today' ? "var(--accent-primary)" : "var(--text-secondary)",
                    border: `1px solid ${scope === 'today' ? "var(--accent-border)" : "var(--border-default)"}`,
                    cursor: "pointer"
                  }}
                >
                  Today's Tasks
                </button>
                <button
                  type="button"
                  onClick={() => setScope('open')}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: scope === 'open' ? 600 : 450,
                    background: scope === 'open' ? "var(--accent-bg)" : "var(--bg-surface-elevated)",
                    color: scope === 'open' ? "var(--accent-primary)" : "var(--text-secondary)",
                    border: `1px solid ${scope === 'open' ? "var(--accent-border)" : "var(--border-default)"}`,
                    cursor: "pointer"
                  }}
                >
                  All Open Tasks
                </button>
              </div>
            </div>

            {/* Template Selection */}
            <div>
              <label className="text-label" style={{ display: "block", marginBottom: 6, fontSize: 10 }}>
                Decomposition Objective
              </label>
              <select
                value={template}
                onChange={e => setTemplate(e.target.value as any)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: 12.5,
                  background: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)"
                }}
              >
                <option value="breakdown">🎯 First-Principles Atomic Breakdown (15m Steps)</option>
                <option value="schedule">⏱️ Executive Daily Time-Blocking (90m Blocks)</option>
                <option value="first_principles">⚡ 80/20 Leverage & Ruthless Audit</option>
                <option value="blockers">🛡️ Pre-Mortem & Dependency Analysis</option>
              </select>
            </div>

          </div>

          {/* Optional Custom Constraints */}
          <div>
            <label className="text-label" style={{ display: "block", marginBottom: 4, fontSize: 10 }}>
              Optional Custom Context (e.g. "I have 3 hours", "Only focus on code")
            </label>
            <input 
              type="text"
              value={customInstructions}
              onChange={e => setCustomInstructions(e.target.value)}
              placeholder="e.g. Focus on smallest physical actions first, no extra meetings..."
              style={{
                width: "100%",
                padding: "7px 10px",
                borderRadius: 7,
                fontSize: 12.5,
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)"
              }}
            />
          </div>

          {/* Prompt Preview Codebox */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minHeight: 180 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="text-label" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
                <FileCode2 size={12} />
                Generated Master AI Prompt Preview
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {generatedPrompt.length} characters
              </span>
            </div>

            <div 
              style={{
                padding: "12px 14px",
                borderRadius: 8,
                background: "var(--bg-base)",
                border: "1px solid var(--border-default)",
                fontFamily: "var(--font-mono)",
                fontSize: 11.5,
                lineHeight: 1.5,
                color: "var(--text-secondary)",
                maxHeight: 220,
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
            padding: "14px 20px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-surface)"
          }}
        >
          <button 
            type="button"
            onClick={handleDownload}
            className="btn-ghost"
            style={{ fontSize: 12.5, padding: "7px 12px", gap: 6, border: "1px solid var(--border-default)" }}
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
                padding: "7px 16px", 
                gap: 6,
                background: copied ? "#10b981" : undefined,
                borderColor: copied ? "#10b981" : undefined
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? "Copied to Clipboard!" : "Copy AI Prompt"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
