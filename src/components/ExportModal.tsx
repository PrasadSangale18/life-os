import { useState } from 'react';
import { useStore } from '../store';
import { exportToMarkdown, exportToCSV, triggerFileDownload } from '../utils/exportPrompt';
import { useToast } from './common/toastContext';
import { 
  Download, 
  X, 
  FileJson, 
  FileText, 
  Table, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal = ({ isOpen, onClose }: ExportModalProps) => {
  const { addToast } = useToast();
  const items = useStore(s => s.items);
  const exportData = useStore(s => s.exportData);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeTasks = items.filter(i => i.type === 'task' && !i.deletedAt);
  const activeNotes = items.filter(i => i.type !== 'task' && !i.deletedAt);

  const handleExportJSON = async () => {
    try {
      const jsonStr = await exportData();
      const dateStr = new Date().toISOString().split('T')[0];
      triggerFileDownload(jsonStr, `life-os-backup-${dateStr}.json`, 'application/json');
      setDownloadSuccess('JSON Backup downloaded successfully!');
      addToast('Backup Exported', 'Full JSON database snapshot downloaded.', 'success');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch {
      addToast('Export Failed', 'An error occurred while generating backup.', 'error');
    }
  };

  const handleExportMarkdown = () => {
    const md = exportToMarkdown(items);
    const dateStr = new Date().toISOString().split('T')[0];
    triggerFileDownload(md, `life-os-digest-${dateStr}.md`, 'text/markdown');
    setDownloadSuccess('Markdown Digest downloaded successfully!');
    addToast('Markdown Exported', 'Clean structured digest ready for Obsidian or Notion.', 'success');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(items);
    const dateStr = new Date().toISOString().split('T')[0];
    triggerFileDownload(csv, `life-os-tasks-${dateStr}.csv`, 'text/csv');
    setDownloadSuccess('CSV Table downloaded successfully!');
    addToast('CSV Exported', 'Spreadsheet table of active tasks downloaded.', 'success');
    setTimeout(() => setDownloadSuccess(null), 3500);
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
          maxWidth: 580,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: 16,
          boxShadow: "var(--shadow-modal)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          style={{
            padding: "18px 22px",
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
                background: "rgba(59, 130, 246, 0.12)",
                color: "#3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(59, 130, 246, 0.25)"
              }}
            >
              <Download size={17} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 650, margin: 0, color: "var(--text-primary)" }}>
                Export & Data Backup
              </h2>
              <p style={{ fontSize: 12, margin: 0, color: "var(--text-secondary)", marginTop: 2 }}>
                Safely backup your Life OS database or transfer data to other apps
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

        {/* Body */}
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16, maxHeight: "75vh", overflowY: "auto" }}>
          
          {/* Why We Added This Info Banner */}
          <div 
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              background: "rgba(16, 185, 129, 0.07)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              display: "flex",
              alignItems: "flex-start",
              gap: 10
            }}
          >
            <ShieldCheck size={18} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Zero Data Loss Guarantee: </span>
              Exporting allows you to store local backups on your hard drive, cloud storage, or migrate into tools like Notion, Obsidian, and Excel.
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "var(--bg-surface-elevated)", border: "1px solid var(--border-subtle)" }}>
              <div className="text-label" style={{ fontSize: 9.5 }}>Total Records</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>{items.length}</div>
            </div>
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "var(--bg-surface-elevated)", border: "1px solid var(--border-subtle)" }}>
              <div className="text-label" style={{ fontSize: 9.5 }}>Active Tasks</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#3b82f6", marginTop: 2 }}>{activeTasks.length}</div>
            </div>
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "var(--bg-surface-elevated)", border: "1px solid var(--border-subtle)" }}>
              <div className="text-label" style={{ fontSize: 9.5 }}>Notes & Knowledge</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#10b981", marginTop: 2 }}>{activeNotes.length}</div>
            </div>
          </div>

          {downloadSuccess && (
            <div 
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                color: "#10b981",
                fontSize: 12.5,
                fontWeight: 550,
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <CheckCircle2 size={16} />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Export Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            
            {/* Format 1: Full JSON Backup */}
            <div 
              style={{
                padding: 14,
                borderRadius: 10,
                border: "1px solid var(--border-default)",
                background: "var(--bg-surface-elevated)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileJson size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>Full JSON Database Backup</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Complete database snapshot. Can be restored anytime in Settings.</div>
                </div>
              </div>
              <button 
                onClick={handleExportJSON}
                className="btn-primary"
                style={{ fontSize: 12.5, padding: "7px 14px", gap: 6, flexShrink: 0 }}
              >
                <Download size={13} />
                <span>Export JSON</span>
              </button>
            </div>

            {/* Format 2: Markdown Digest */}
            <div 
              style={{
                padding: 14,
                borderRadius: 10,
                border: "1px solid var(--border-default)",
                background: "var(--bg-surface-elevated)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>Markdown Digest (.md)</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Formatted tasks, checklists & notes ready for Obsidian or Notion.</div>
                </div>
              </div>
              <button 
                onClick={handleExportMarkdown}
                className="btn-ghost"
                style={{ 
                  fontSize: 12.5, 
                  padding: "7px 14px", 
                  gap: 6, 
                  flexShrink: 0,
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-surface)" 
                }}
              >
                <Download size={13} />
                <span>Export Markdown</span>
              </button>
            </div>

            {/* Format 3: CSV Spreadsheet */}
            <div 
              style={{
                padding: 14,
                borderRadius: 10,
                border: "1px solid var(--border-default)",
                background: "var(--bg-surface-elevated)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Table size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>Spreadsheet CSV (.csv)</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Tabular dataset with dates, priorities, and pillars for Excel / Sheets.</div>
                </div>
              </div>
              <button 
                onClick={handleExportCSV}
                className="btn-ghost"
                style={{ 
                  fontSize: 12.5, 
                  padding: "7px 14px", 
                  gap: 6, 
                  flexShrink: 0,
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-surface)" 
                }}
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            </div>

          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 11.5 }}>
            <AlertCircle size={13} />
            <span>All exports are generated locally in your browser with 100% privacy.</span>
          </div>

        </div>

        {/* Footer */}
        <div 
          style={{
            padding: "14px 22px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "flex-end"
          }}
        >
          <button 
            onClick={onClose}
            className="btn-ghost"
            style={{ fontSize: 13, padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border-default)" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
