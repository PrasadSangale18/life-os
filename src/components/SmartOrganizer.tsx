import { useState, useMemo, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { fuzzyFindDuplicates, cleanupText } from '../utils/smartOrganizerLogic';
import { parseImport } from '../utils/importLogic';
import type { ImportItem } from '../utils/importLogic';
import type { Item, ItemType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { 
  Wand2, 
  Copy, 
  Scissors, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Undo2, 
  FileText, 
  CheckSquare, 
  RotateCcw, 
  Plus, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  Loader2 
} from 'lucide-react';
import { MetricCard } from './common/MetricCard';
import { Badge } from './common/Badge';
import { useToast } from './common/toastContext';

export const SmartOrganizer = () => {
  const { addToast } = useToast();
  const items = useStore(s => s.items);
  const mergeStoreItems = useStore(s => s.mergeItems);
  const applyStoreCleanup = useStore(s => s.applyCleanup);
  const revertStoreCleanup = useStore(s => s.revertCleanup);
  const splitStoreItem = useStore(s => s.splitItem);
  const commitImport = useStore(s => s.commitImport);
  const undoImport = useStore(s => s.undoImport);
  
  const [activeTab, setActiveTab] = useState<'bulk' | 'duplicates' | 'cleanup' | 'split'>('bulk');

  // Bulk Intake State (Enhanced with Prahari Bulk Intake Patterns)
  const [bulkText, setBulkText] = useState('');
  const [bulkStage, setBulkStage] = useState<'input' | 'processing' | 'preview' | 'committed'>('input');
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [parsedBulkItems, setParsedBulkItems] = useState<ImportItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [lastBatchId, setLastBatchId] = useState<string | null>(null);
  const [committedStats, setCommittedStats] = useState<{ tasks: number; notes: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Duplicates
  const duplicatePairs = useMemo(() => fuzzyFindDuplicates(items), [items]);

  const mergeItems = async (keep: Item, trash: Item) => {
    const combinedRaw = (keep.rawText || keep.title) + '\n\n--- Merged from ---\n' + (trash.rawText || trash.title);
    await mergeStoreItems(keep.id, trash.id, { rawText: combinedRaw });
  };

  // Cleanup
  const cleanupCandidates = useMemo(() => {
    return items.filter(i => !i.deletedAt && !i.isArchived).map(i => ({
      item: i,
      suggestedTitle: cleanupText(i.title),
      suggestedBody: i.body ? cleanupText(i.body) : undefined
    })).filter(c => c.suggestedTitle !== c.item.title || c.suggestedBody !== c.item.body);
  }, [items]);

  const cleanedItems = useMemo(() => {
    return items.filter(i => !i.deletedAt && !i.isArchived && !!i.cleanedTitle);
  }, [items]);

  const applyCleanup = async (id: string, cTitle: string, cBody?: string) => {
    await applyStoreCleanup(id, cTitle, cBody);
  };
  const revertCleanup = async (id: string) => {
    await revertStoreCleanup(id);
  };

  // Split Tool
  const [splitSourceId, setSplitSourceId] = useState<string>('');
  const [splitText, setSplitText] = useState<string>('');
  
  const executeSplit = async () => {
    const source = items.find(i => i.id === splitSourceId);
    if (!source || !splitText.trim()) return;
    
    const parts = splitText.split('\n').map(p => p.trim()).filter(Boolean);
    await splitStoreItem(source.id, parts);
    setSplitSourceId('');
    setSplitText('');
  };

  // Sample Presets for Bulk Input
  const handleLoadSample = (type: 'daily' | 'project' | 'ideas') => {
    if (type === 'daily') {
      setBulkText(`- Finalize Q3 quarterly revenue report [high priority] [financial]\n- Daily workout: 5km tempo run and stretching [physical]\n- Concept for modular SANKALP dark mode interface [idea]\n- Pick up fresh groceries: apples, oat milk, spinach, matcha\n- Book dentist checkup for next Thursday afternoon [do]\n- Reading reflection: 1% compounding habits lead to 37x annual growth [journal]`);
    } else if (type === 'project') {
      setBulkText(`- Setup automated CI/CD pipeline with GitHub Actions [do]\n- Research vector embeddings and semantic graph search algorithms [idea]\n- Coordinate architecture review with team on Monday 10am [delegate]\n- Optimize database index on items table for sub-10ms queries\n- Draft user release notes and changelog documentation [decide]`);
    } else {
      setBulkText(`- Principle: Focus precedes success, eliminate low-value obligations [principle]\n- Idea: Interactive dot grid canvas for freeform sketching on notes [idea]\n- Note on systems thinking: feedback loops govern long-term behavior [knowledge]\n- Call parents this weekend to catch up [relational]\n- Plan monthly financial budget and savings targets [financial]`);
    }
    addToast('Preset Loaded', 'Sample bulk input ready for AI atomization.', 'info');
  };

  const handleDownloadTemplate = () => {
    const headers = 'title,type,pillar,priority,quadrant,body\n';
    const sample1 = 'Quarterly financial review,task,financial,high,do,Review revenue breakdown and cloud expenses\n';
    const sample2 = 'Weekly 5km tempo run and stretch,task,physical,normal,decide,Morning endurance session in park\n';
    const sample3 = '1% daily compounding mental model,note,mental,normal,,Reading reflection on James Clear Atomic Habits\n';
    const sample4 = 'Family dinner this Sunday 7pm,task,relational,high,do,Call sister to coordinate restaurant reservation\n';
    const csv = headers + sample1 + sample2 + sample3 + sample4;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sankalp_bulk_intake_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    addToast('Template Downloaded', 'Fill with your tasks or thoughts and upload.', 'info');
  };

  const processFile = useCallback((file: File) => {
    const validExts = ['.txt', '.md', '.csv', '.json'];
    const hasValidExt = validExts.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      addToast('Invalid File', 'Please upload a text, markdown, CSV, or JSON file.', 'warning');
      return;
    }

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        const content = ev.target.result as string;
        setBulkText(content);
        addToast('File Ingested', `${file.name} loaded into intake queue.`, 'success');
      }
    };
    reader.readAsText(file);
  }, [addToast]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleParseBulk = () => {
    if (!bulkText.trim()) return;
    
    // Smooth progress simulation (inspired by Prahari batch NLP engine)
    setBulkStage('processing');
    setProgress(15);
    
    setTimeout(() => {
      setProgress(60);
    }, 150);

    setTimeout(() => {
      setProgress(100);
      const result = parseImport(bulkText, items);
      setParsedBulkItems(result.items);
      setSelectedItemIds(new Set(result.items.map(i => i.id)));
      setBulkStage('preview');
      addToast('AI Atomization Complete', `${result.items.length} items parsed & categorized.`, 'success');
    }, 350);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleType = (id: string) => {
    setParsedBulkItems(prev => prev.map(item => {
      if (item.id === id) {
        const newType: ItemType = item.suggestedType === 'task' ? 'note' : 'task';
        return { ...item, suggestedType: newType };
      }
      return item;
    }));
  };

  const handleUpdateItemTitle = (id: string, newTitle: string) => {
    setParsedBulkItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, suggestedTitle: newTitle };
      }
      return item;
    }));
  };

  const handleCommitBulk = async () => {
    const batchId = uuidv4();
    setLastBatchId(batchId);
    const now = Date.now();

    const approvedItems = parsedBulkItems.filter(i => selectedItemIds.has(i.id));
    let taskCount = 0;
    let noteCount = 0;

    const finalItems: Item[] = approvedItems.map(i => {
      const isTask = i.suggestedType === 'task';
      if (isTask) taskCount++;
      else noteCount++;

      const finalStatus = isTask ? (i.suggestedStatus || 'todo') : undefined;

      return {
        id: uuidv4(),
        type: i.suggestedType,
        title: i.suggestedTitle,
        body: i.rawText !== i.suggestedTitle ? i.rawText : undefined,
        pillar: i.suggestedPillar || 'mental',
        quadrant: isTask ? (i.suggestedQuadrant || 'do') : undefined,
        status: finalStatus,
        completedAt: finalStatus === 'done' ? now : undefined,
        priority: i.suggestedPriority || 'normal',
        isPriority: i.suggestedPriority === 'critical' || i.suggestedPriority === 'high',
        deadline: i.suggestedDeadline,
        isPrivate: i.suggestedPrivate,
        aiReviewed: true,
        createdAt: now,
        updatedAt: now,
        importBatchId: batchId,
        rawText: i.rawText,
        importSource: 'ai_organizer'
      };
    });

    await commitImport(batchId, finalItems);
    setCommittedStats({ tasks: taskCount, notes: noteCount });
    setBulkStage('committed');
    addToast('Committed to SANKALP', `Saved ${taskCount} tasks and ${noteCount} notes.`, 'success');
  };

  const handleUndoBulk = async () => {
    if (lastBatchId) {
      await undoImport(lastBatchId);
      setBulkStage('input');
      setLastBatchId(null);
      setCommittedStats(null);
      addToast('Batch Reverted', 'Imported items have been safely removed.', 'info');
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header & Tabs */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: "16px 20px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          background: "var(--bg-surface)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(245,158,11,0.12)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wand2 size={16} />
          </div>
          <div>
            <div className="card-title" style={{ fontSize: 16 }}>Smart AI Organizer</div>
            <div className="text-secondary" style={{ fontSize: 12 }}>Bulk intake, automated task/thought categorization, and formatting hygiene.</div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="segmented-nav">
          <button 
            onClick={() => setActiveTab('bulk')} 
            className={`segmented-nav-btn ${activeTab === 'bulk' ? 'active' : ''}`}
          >
            <Sparkles size={13} color={activeTab === 'bulk' ? 'var(--text-primary)' : 'inherit'} />
            <span>⚡ Bulk Input</span>
          </button>
          <button 
            onClick={() => setActiveTab('duplicates')} 
            className={`segmented-nav-btn ${activeTab === 'duplicates' ? 'active' : ''}`}
          >
            <Copy size={13} />
            <span>Fuzzy Duplicates</span>
            {duplicatePairs.length > 0 && <span className="tabular-nums" style={{ fontSize: 10, opacity: 0.8 }}>({duplicatePairs.length})</span>}
          </button>
          <button 
            onClick={() => setActiveTab('cleanup')} 
            className={`segmented-nav-btn ${activeTab === 'cleanup' ? 'active' : ''}`}
          >
            <Sparkles size={13} />
            <span>Cleanup Assistant</span>
            {cleanupCandidates.length > 0 && <span className="tabular-nums" style={{ fontSize: 10, opacity: 0.8 }}>({cleanupCandidates.length})</span>}
          </button>
          <button 
            onClick={() => setActiveTab('split')} 
            className={`segmented-nav-btn ${activeTab === 'split' ? 'active' : ''}`}
          >
            <Scissors size={13} />
            <span>Split Tool</span>
          </button>
        </div>
      </div>

      {/* TAB 0: Bulk Intake & Brain Dump */}
      {activeTab === 'bulk' && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Bulk Stage 1: Input & Dropzone */}
          {bulkStage === 'input' && (
            <div className="glass-panel" style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18, background: "var(--bg-surface)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                    <Sparkles size={18} color="#f59e0b" />
                    <span>CSV & Text Bulk Intake</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.5 }}>
                    Upload or paste unorganized notes, CSV files, meeting dumps, or mixed task lists. SANKALP will batch-parse and organize them into <strong>To-do list</strong> and <strong>My Notes</strong>.
                  </div>
                </div>

                {/* Template & Preset Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="btn-ghost"
                    style={{ fontSize: 12, padding: "6px 12px", border: "1px solid var(--border-default)", gap: 6 }}
                  >
                    <Download size={13} />
                    <span>CSV Template</span>
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600 }}>Presets:</span>
                    <button 
                      type="button" 
                      onClick={() => handleLoadSample('daily')}
                      className="btn-ghost"
                      style={{ fontSize: 11.5, padding: "3px 8px", borderRadius: 6, border: "1px solid var(--border-default)" }}
                    >
                      📝 Daily Dump
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleLoadSample('project')}
                      className="btn-ghost"
                      style={{ fontSize: 11.5, padding: "3px 8px", borderRadius: 6, border: "1px solid var(--border-default)" }}
                    >
                      🚀 Projects
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleLoadSample('ideas')}
                      className="btn-ghost"
                      style={{ fontSize: 11.5, padding: "3px 8px", borderRadius: 6, border: "1px solid var(--border-default)" }}
                    >
                      💡 Ideas
                    </button>
                  </div>
                </div>
              </div>

              {/* Prahari-style Drag & Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  border: `2px dashed ${dragOver ? '#f59e0b' : 'var(--border-strong, #cbd0d8)'}`,
                  backgroundColor: dragOver ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-surface-elevated, #f8f9fa)',
                  borderRadius: 16,
                  padding: '24px 20px',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  transform: dragOver ? 'scale(1.01)' : 'none'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.md,.json"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div 
                    style={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: 14, 
                      backgroundColor: dragOver ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-surface)', 
                      color: dragOver ? '#f59e0b' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-default)'
                    }}
                  >
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {dragOver ? 'Drop file here to import' : 'Drag & drop CSV, TXT, or MD file here'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      or <span style={{ color: '#f59e0b', fontWeight: 600 }}>click to browse</span> from your computer
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span className="ui-pill" style={{ fontSize: 10, padding: '2px 8px', gap: 4 }}>
                      <FileSpreadsheet size={11} /> .csv
                    </span>
                    <span className="ui-pill" style={{ fontSize: 10, padding: '2px 8px' }}>.md</span>
                    <span className="ui-pill" style={{ fontSize: 10, padding: '2px 8px' }}>.txt</span>
                    <span className="ui-pill" style={{ fontSize: 10, padding: '2px 8px' }}>.json</span>
                  </div>
                </div>
              </div>

              {/* Textarea */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <textarea 
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  placeholder={`Or type/paste anything here directly (one item per line or bullet point)... Examples:\n- Ship database migration for life os v2\n- Buy groceries: oat milk, apples, coffee beans\n- Concept: building a second-brain visual mind map with bidirectional links\n- Reading notes on atomic habits: 1% daily compounding results\n- Call accountant about Q3 taxes tomorrow [high priority] [financial]`}
                  className="ui-input"
                  style={{
                    minHeight: 180,
                    padding: "16px 18px",
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    fontFamily: "var(--font-mono)",
                    resize: "vertical"
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--text-tertiary)", padding: "0 4px" }}>
                  <span>{bulkText.split('\n').filter(l => l.trim()).length} item lines ready to parse</span>
                  <span>{uploadedFileName ? `Loaded: ${uploadedFileName}` : 'Supports markdown bullets, tags like [urgent], and dates'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, paddingTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {bulkText && (
                    <button 
                      type="button" 
                      onClick={() => { setBulkText(''); setUploadedFileName(''); }}
                      className="btn-ghost"
                      style={{ fontSize: 12.5, padding: "8px 12px", color: "var(--text-tertiary)" }}
                    >
                      Clear Input
                    </button>
                  )}
                </div>

                <button 
                  type="button" 
                  onClick={handleParseBulk}
                  disabled={!bulkText.trim()}
                  className="btn-primary"
                  style={{ gap: 8, padding: "10px 22px", fontSize: 13.5, fontWeight: 650, opacity: bulkText.trim() ? 1 : 0.5 }}
                >
                  <Wand2 size={15} />
                  <span>⚡ AI Parse & Atomize Bulk Input</span>
                </button>
              </div>
            </div>
          )}

          {/* Bulk Stage 2: Processing Progress (Prahari style) */}
          {bulkStage === 'processing' && (
            <div className="glass-panel" style={{ padding: "36px 28px", display: "flex", flexDirection: "column", gap: 20, background: "var(--bg-surface)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Loader2 size={24} className="animate-spin" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                    Processing: {uploadedFileName || 'Bulk Input Queue'}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>
                    SANKALP AI engine is analyzing items, classifying pillars, and determining execution quadrants...
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>AI Atomization Pipeline</span>
                  <span style={{ color: "#f59e0b" }}>{progress}%</span>
                </div>
                <div style={{ width: "100%", backgroundColor: "var(--bg-surface-elevated)", borderRadius: 9999, height: 8, overflow: "hidden" }}>
                  <div 
                    style={{ 
                      height: 8, 
                      borderRadius: 9999, 
                      background: "linear-gradient(90deg, #f59e0b, #ef4444)", 
                      boxShadow: "0 0 12px rgba(245, 158, 11, 0.4)",
                      width: `${progress}%`,
                      transition: "width 0.3s ease"
                    }} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bulk Stage 3: Preview & Review (Prahari-grade Metric Cards & Badges) */}
          {bulkStage === 'preview' && (
            <div className="glass-panel" style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckSquare size={17} color="#10b981" />
                    <span>{parsedBulkItems.length} Items Atomized & Categorized</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 4 }}>
                    Review, adjust classification, and confirm adding to your SANKALP workspace.
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button 
                    type="button" 
                    onClick={() => setBulkStage('input')}
                    className="btn-ghost"
                    style={{ fontSize: 12.5, padding: "6px 12px", border: "1px solid var(--border-default)" }}
                  >
                    &lt; Back to Edit Input
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCommitBulk}
                    disabled={selectedItemIds.size === 0}
                    className="btn-primary"
                    style={{ gap: 6, fontSize: 13, padding: "8px 18px", fontWeight: 650 }}
                  >
                    <Check size={14} />
                    <span>✓ Add {selectedItemIds.size} Items to SANKALP</span>
                  </button>
                </div>
              </div>

              {/* Summary Metric Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                <MetricCard 
                  title="Total Parsed" 
                  value={parsedBulkItems.length} 
                  icon={FileSpreadsheet} 
                  colorScheme="blue" 
                  subtitle="Atomized from input"
                />
                <MetricCard 
                  title="Actionable Tasks" 
                  value={parsedBulkItems.filter(i => i.suggestedType === 'task').length} 
                  trend={`${parsedBulkItems.filter(i => i.suggestedType === 'task' && i.suggestedQuadrant === 'do').length} Q1`}
                  trendLabel="urgent"
                  icon={CheckSquare} 
                  colorScheme="amber" 
                  subtitle="Bound to Eisenhower Matrix"
                />
                <MetricCard 
                  title="Thoughts & Notes" 
                  value={parsedBulkItems.filter(i => i.suggestedType !== 'task').length} 
                  icon={FileText} 
                  colorScheme="green" 
                  subtitle="Saved to Knowledge Base"
                />
              </div>

              {/* Two Column Grid: Tasks vs Thoughts */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Column 1: To-do list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <CheckSquare size={15} color="#3b82f6" />
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>
                        To-do list ({parsedBulkItems.filter(i => i.suggestedType === 'task').length})
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Actionable items</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 460, overflowY: "auto" }}>
                    {parsedBulkItems.filter(i => i.suggestedType === 'task').map(item => {
                      const isSelected = selectedItemIds.has(item.id);
                      return (
                        <div 
                          key={item.id}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 12,
                            background: isSelected ? "rgba(59,130,246,0.06)" : "var(--bg-surface)",
                            border: `1px solid ${isSelected ? "rgba(59,130,246,0.3)" : "var(--border-subtle)"}`,
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            transition: "all 0.12s ease"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => handleToggleSelect(item.id)}
                              style={{ accentColor: "var(--accent-primary)", cursor: "pointer" }}
                            />
                            <input 
                              value={item.suggestedTitle}
                              onChange={e => handleUpdateItemTitle(item.id, e.target.value)}
                              className="ui-input"
                              style={{ flex: 1, padding: "4px 8px", fontSize: 12.5, height: 30 }}
                            />
                            <button
                              type="button"
                              onClick={() => handleToggleType(item.id)}
                              className="btn-ghost"
                              style={{ fontSize: 10.5, padding: "3px 6px", borderRadius: 4, color: "var(--text-tertiary)" }}
                              title="Convert to Thought / Note"
                            >
                              To Thought
                            </button>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", paddingLeft: 24 }}>
                            {item.suggestedPillar && (
                              <Badge type="pillar" value={item.suggestedPillar} size="sm" />
                            )}
                            {item.suggestedQuadrant && (
                              <Badge type="quadrant" value={item.suggestedQuadrant} size="sm" />
                            )}
                            {item.suggestedPriority && item.suggestedPriority !== 'normal' && (
                              <Badge type="priority" value={item.suggestedPriority} size="sm" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {parsedBulkItems.filter(i => i.suggestedType === 'task').length === 0 && (
                      <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-tertiary)", fontSize: 12 }}>
                        No actionable tasks detected.
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: My Notes */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <FileText size={15} color="#10b981" />
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>
                        My Notes ({parsedBulkItems.filter(i => i.suggestedType !== 'task').length})
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Reflections, ideas, notes</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 460, overflowY: "auto" }}>
                    {parsedBulkItems.filter(i => i.suggestedType !== 'task').map(item => {
                      const isSelected = selectedItemIds.has(item.id);
                      return (
                        <div 
                          key={item.id}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 12,
                            background: isSelected ? "rgba(16,185,129,0.06)" : "var(--bg-surface)",
                            border: `1px solid ${isSelected ? "rgba(16,185,129,0.3)" : "var(--border-subtle)"}`,
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            transition: "all 0.12s ease"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => handleToggleSelect(item.id)}
                              style={{ accentColor: "#10b981", cursor: "pointer" }}
                            />
                            <input 
                              value={item.suggestedTitle}
                              onChange={e => handleUpdateItemTitle(item.id, e.target.value)}
                              className="ui-input"
                              style={{ flex: 1, padding: "4px 8px", fontSize: 12.5, height: 30 }}
                            />
                            <button
                              type="button"
                              onClick={() => handleToggleType(item.id)}
                              className="btn-ghost"
                              style={{ fontSize: 10.5, padding: "3px 6px", borderRadius: 4, color: "var(--text-tertiary)" }}
                              title="Convert to Task"
                            >
                              To Task
                            </button>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", paddingLeft: 24 }}>
                            <Badge type="type" value={item.suggestedType} size="sm" />
                            {item.suggestedPillar && (
                              <Badge type="pillar" value={item.suggestedPillar} size="sm" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {parsedBulkItems.filter(i => i.suggestedType !== 'task').length === 0 && (
                      <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-tertiary)", fontSize: 12 }}>
                        No thought notes detected.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Stage: Committed Confirmation */}
          {bulkStage === 'committed' && committedStats && (
            <div className="glass-panel" style={{ padding: "36px 28px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(16,185,129,0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={24} strokeWidth={2.5} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                Bulk Input Successfully Organized & Added!
              </div>
              <div style={{ fontSize: 13.5, color: "var(--text-secondary)", maxWidth: 440, lineHeight: 1.5 }}>
                Added <strong>{committedStats.tasks}</strong> actionable tasks to <em>To-do list</em> and <strong>{committedStats.notes}</strong> thoughts & notes to <em>My Notes</em>.
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button 
                  type="button" 
                  onClick={() => { setBulkStage('input'); setBulkText(''); }}
                  className="btn-primary"
                  style={{ fontSize: 13, padding: "8px 18px" }}
                >
                  <Plus size={14} />
                  <span>Organize More Input</span>
                </button>
                {lastBatchId && (
                  <button 
                    type="button" 
                    onClick={handleUndoBulk}
                    className="btn-ghost"
                    style={{ fontSize: 13, padding: "8px 16px", border: "1px solid var(--border-default)" }}
                  >
                    <RotateCcw size={14} />
                    <span>Undo Import</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Duplicates */}
      {activeTab === 'duplicates' && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {duplicatePairs.length === 0 && (
            <div className="glass-panel" style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "48px 24px", fontSize: 13 }}>
              No fuzzy duplicates detected in your workspace.
            </div>
          )}
          {duplicatePairs.map(([a, b], idx) => (
            <div key={idx} className="glass-panel" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="ui-pill" style={{ color: "#f59e0b", borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)", fontSize: 11 }}>
                  Potential Match #{idx + 1}
                </span>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Left Item */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{a.title}</div>
                  {a.body && <div className="text-secondary" style={{ fontSize: 12, marginBottom: 12 }}>{a.body}</div>}
                  <button 
                    onClick={() => mergeItems(a, b)} 
                    className="btn-secondary"
                    style={{ marginTop: "auto", fontSize: 12, padding: "6px 12px", color: "var(--accent-hover)", borderColor: "var(--accent-border)" }}
                  >
                    Keep This & Merge Right
                  </button>
                </div>

                {/* Right Item */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{b.title}</div>
                  {b.body && <div className="text-secondary" style={{ fontSize: 12, marginBottom: 12 }}>{b.body}</div>}
                  <button 
                    onClick={() => mergeItems(b, a)} 
                    className="btn-secondary"
                    style={{ marginTop: "auto", fontSize: 12, padding: "6px 12px", color: "var(--accent-hover)", borderColor: "var(--accent-border)" }}
                  >
                    Keep This & Merge Left
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Cleanup */}
      {activeTab === 'cleanup' && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {cleanupCandidates.length === 0 && cleanedItems.length === 0 && (
            <div className="glass-panel" style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "48px 24px", fontSize: 13 }}>
              All items are cleanly formatted and punctuated.
            </div>
          )}

          {cleanupCandidates.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Suggestions Ready to Apply ({cleanupCandidates.length})
              </div>
              {cleanupCandidates.slice(0, 50).map(({ item, suggestedTitle, suggestedBody }) => (
                <div key={item.id} className="glass-panel" style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "center" }}>
                  {/* Original */}
                  <div style={{ opacity: 0.65 }}>
                    <span className="text-label" style={{ fontSize: 10, color: "#f43f5e" }}>Original Raw</span>
                    <div style={{ fontSize: 14, color: "var(--text-primary)", marginTop: 4, fontWeight: 500 }}>{item.rawText || item.title}</div>
                    {item.body && <div className="text-secondary" style={{ fontSize: 12, marginTop: 4 }}>{item.body}</div>}
                  </div>

                  <div style={{ color: "var(--text-muted)" }}>
                    <ArrowRight size={16} />
                  </div>

                  {/* Cleaned */}
                  <div>
                    <span className="text-label" style={{ fontSize: 10, color: "#10b981" }}>Cleaned Output</span>
                    <div style={{ fontSize: 14, color: "var(--text-primary)", marginTop: 4, fontWeight: 600 }}>{suggestedTitle}</div>
                    {suggestedBody && <div className="text-secondary" style={{ fontSize: 12, marginTop: 4 }}>{suggestedBody}</div>}
                    
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button 
                        onClick={() => applyCleanup(item.id, suggestedTitle, suggestedBody)} 
                        className="btn-secondary"
                        style={{ fontSize: 12, padding: "5px 12px", color: "#10b981", borderColor: "rgba(16,185,129,0.3)" }}
                      >
                        <Check size={12} />
                        <span>Apply Cleanup</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cleanedItems.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Cleaned Items ({cleanedItems.length})
                </div>
                <span className="text-meta" style={{ fontSize: 11 }}>Original text is safely preserved</span>
              </div>
              {cleanedItems.map(item => (
                <div key={item.id} className="glass-panel" style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="ui-pill" style={{ fontSize: 10, color: "#10b981", borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)" }}>Cleaned</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{item.title}</span>
                    </div>
                    {item.rawText && item.rawText !== item.title && (
                      <div className="text-secondary" style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>
                        Original: {item.rawText}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => revertCleanup(item.id)} 
                    className="btn-ghost"
                    style={{ fontSize: 12, padding: "5px 12px", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.25)" }}
                    title="Restore original uncleaned content"
                  >
                    <Undo2 size={12} />
                    <span>Revert to Original</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Split */}
      {activeTab === 'split' && (
        <div className="glass-panel" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div className="card-title" style={{ fontSize: 15 }}>Atomize / Split Composite Task</div>
            <div className="text-secondary" style={{ fontSize: 12, marginTop: 2 }}>
              Break long multi-action items into separate atomic tasks while preserving links to the original.
            </div>
          </div>

          <div>
            <div className="text-label" style={{ fontSize: 10, marginBottom: 6 }}>Select Item to Split</div>
            <select 
              value={splitSourceId} 
              onChange={e => {
                setSplitSourceId(e.target.value);
                const t = items.find(i => i.id === e.target.value);
                if (t) setSplitText(t.title + (t.body ? '\n' + t.body : ''));
              }} 
              className="ui-select"
              style={{ width: "100%", padding: "10px 12px", fontSize: 13 }}
            >
              <option value="" disabled>Choose an item from your operating system...</option>
              {items.filter(i => !i.deletedAt && !i.isArchived).map(i => (
                <option key={i.id} value={i.id}>{i.title}</option>
              ))}
            </select>
          </div>

          {splitSourceId && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="text-label" style={{ fontSize: 10 }}>Proposed Sub-tasks (Each line becomes one item)</div>
              <textarea 
                value={splitText} 
                onChange={e => setSplitText(e.target.value)} 
                className="ui-input"
                style={{ minHeight: 140, padding: "10px 12px", fontSize: 13, lineHeight: 1.55 }}
              />
              <button 
                onClick={executeSplit} 
                className="btn-primary"
                style={{ padding: "10px 18px", alignSelf: "flex-start", gap: 6 }}
              >
                <Scissors size={14} />
                <span>Confirm Split ({splitText.split('\n').filter(p => p.trim()).length} Items)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
