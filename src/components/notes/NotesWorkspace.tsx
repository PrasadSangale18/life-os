import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../store';
import type { Item, NoteColorId } from '../../types';
import { 
  Plus, 
  Search, 
  Pin, 
  Star, 
  Archive, 
  Trash2, 
  Folder, 
  Tag, 
  FileText, 
  ChevronLeft, 
  Maximize2, 
  Minimize2, 
  Download, 
  Copy, 
  MoreVertical, 
  Palette, 
  RotateCcw, 
  X, 
  CheckSquare, 
  Heading1, 
  Heading2, 
  Bold, 
  Italic, 
  List, 
  Quote, 
  Code, 
  Minus, 
  LayoutList, 
  LayoutGrid, 
  Layers, 
  Lock,
  ArrowUpRight
} from 'lucide-react';
import { NOTE_COLOR_PALETTES } from './noteTheme';
import { 
  calculateWordCount, 
  calculateCharacterCount, 
  calculateReadingTimeMinutes, 
  formatRelativeTime, 
  exportNoteAsMarkdown, 
  exportNoteAsPlainText, 
  copyNoteToClipboard 
} from '../../utils/noteUtils';
import { calculateBacklinks } from '../../utils/wikiLinks';

interface NotesWorkspaceProps {
  onOpenGlobalCapture?: () => void;
}

type MainViewType = 'all' | 'pinned' | 'favorites' | 'archived' | 'trash';
type SortOption = 'updated' | 'created' | 'title';

export const NotesWorkspace: React.FC<NotesWorkspaceProps> = () => {
  const { 
    items, 
    addItem, 
    updateItem, 
    trashItem, 
    restoreItem, 
    hardDeleteItem, 
    archiveItem, 
    unarchiveItem,
    showPrivate 
  } = useStore();

  // Navigation & View State
  const [selectedView, setSelectedView] = useState<MainViewType>('all');
  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('updated');
  const [layoutMode, setLayoutMode] = useState<'list' | 'cards'>('list');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Editor states
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline'>('saved');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  // Mobile pane drill-down ('sidebar' | 'list' | 'editor')
  const [mobilePane, setMobilePane] = useState<'sidebar' | 'list' | 'editor'>('list');
  const [isMobile, setIsMobile] = useState(false);

  // Notebook creation modal
  const [showNewNotebookModal, setShowNewNotebookModal] = useState(false);
  const [newNotebookInput, setNewNotebookInput] = useState('');

  // Notion Slash Command Menu
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);

  // Wiki links [[ autocomplete
  const [showWikiMenu, setShowWikiMenu] = useState(false);
  const [wikiQuery, setWikiQuery] = useState('');
  const [wikiMenuIndex, setWikiMenuIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect mobile screen width
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter all note-like items
  const allNotes = useMemo(() => {
    return items.filter(i => 
      (i.type === 'note' || i.type === 'idea' || i.type === 'knowledge' || i.type === 'journal') &&
      (showPrivate || !i.isPrivate)
    );
  }, [items, showPrivate]);

  // Extract all unique notebooks / categories
  const notebooks = useMemo(() => {
    const map = new Map<string, number>();
    // Default system notebooks to ensure rich initial structure
    map.set('Personal', 0);
    map.set('Work', 0);
    map.set('Ideas', 0);
    map.set('Research', 0);
    map.set('Journal', 0);

    allNotes.forEach(n => {
      if (!n.deletedAt && !n.isArchived) {
        const cat = n.category || 'Personal';
        map.set(cat, (map.get(cat) || 0) + 1);
      }
    });

    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [allNotes]);

  // Extract all unique tags
  const tags = useMemo(() => {
    const map = new Map<string, number>();
    allNotes.forEach(n => {
      if (!n.deletedAt && !n.isArchived && n.tags) {
        n.tags.forEach(t => {
          map.set(t, (map.get(t) || 0) + 1);
        });
      }
    });
    return Array.from(map.entries()).map(([tag, count]) => ({ tag, count }));
  }, [allNotes]);

  // Counts for main sidebar views
  const viewCounts = useMemo(() => {
    return {
      all: allNotes.filter(n => !n.deletedAt && !n.isArchived).length,
      pinned: allNotes.filter(n => !n.deletedAt && !n.isArchived && n.pinned).length,
      favorites: allNotes.filter(n => !n.deletedAt && !n.isArchived && n.isFavorite).length,
      archived: allNotes.filter(n => !n.deletedAt && n.isArchived).length,
      trash: allNotes.filter(n => !!n.deletedAt).length,
    };
  }, [allNotes]);

  // Filter notes based on active sidebar selection, search, and sort
  const filteredNotes = useMemo(() => {
    let result = allNotes;

    // View filter
    if (selectedView === 'trash') {
      result = result.filter(n => !!n.deletedAt);
    } else {
      result = result.filter(n => !n.deletedAt);

      if (selectedView === 'archived') {
        result = result.filter(n => n.isArchived);
      } else {
        result = result.filter(n => !n.isArchived);

        if (selectedView === 'pinned') {
          result = result.filter(n => n.pinned);
        } else if (selectedView === 'favorites') {
          result = result.filter(n => n.isFavorite);
        }
      }
    }

    // Notebook filter
    if (selectedNotebook && selectedView !== 'trash' && selectedView !== 'archived') {
      result = result.filter(n => (n.category || 'Personal').toLowerCase() === selectedNotebook.toLowerCase());
    }

    // Tag filter
    if (selectedTag && selectedView !== 'trash') {
      result = result.filter(n => n.tags?.includes(selectedTag));
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.title.toLowerCase().includes(q) || 
        (n.body && n.body.toLowerCase().includes(q)) ||
        (n.tags && n.tags.some(t => t.toLowerCase().includes(q))) ||
        (n.category && n.category.toLowerCase().includes(q))
      );
    }

    // Sorting
    return result.sort((a, b) => {
      if (selectedView !== 'trash' && selectedView !== 'archived') {
        // Pinned notes always stay on top
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
      }

      if (sortOption === 'updated') {
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      }
      if (sortOption === 'created') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      return a.title.localeCompare(b.title);
    });
  }, [allNotes, selectedView, selectedNotebook, selectedTag, searchQuery, sortOption]);

  // Currently active note object
  const activeNote = useMemo(() => {
    if (!selectedNoteId) {
      return filteredNotes.length > 0 ? filteredNotes[0] : null;
    }
    return allNotes.find(n => n.id === selectedNoteId) || filteredNotes[0] || null;
  }, [allNotes, selectedNoteId, filteredNotes]);

  // Sync title & body when activeNote changes
  const lastActiveIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (activeNote) {
      if (lastActiveIdRef.current !== activeNote.id) {
        lastActiveIdRef.current = activeNote.id;
        setTitle(activeNote.title || '');
        setBodyText(activeNote.body || '');
        setSaveStatus('saved');
      }
    } else {
      lastActiveIdRef.current = null;
      setTitle('');
      setBodyText('');
    }
  }, [activeNote]);

  // Debounced Autosave (400ms)
  const triggerAutosave = useCallback((updates: Partial<Item>) => {
    if (!activeNote) return;
    setSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateItem(activeNote.id, {
          ...updates,
          updatedAt: Date.now()
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave failed:', err);
        setSaveStatus('offline');
      }
    }, 400);
  }, [activeNote, updateItem]);

  // Handle Title input
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    triggerAutosave({ title: newTitle });
  };

  // Handle Body textarea change + Slash & Wiki command detections
  const handleBodyChange = (newBody: string) => {
    setBodyText(newBody);
    triggerAutosave({ body: newBody });

    const cursorPos = textareaRef.current?.selectionStart || newBody.length;
    const textUpToCursor = newBody.slice(0, cursorPos);

    // Detect Slash Command trigger: "/"
    const slashMatch = textUpToCursor.match(/(?:^|\n|\s)\/([a-zA-Z0-9]*)$/);
    if (slashMatch) {
      setShowSlashMenu(true);
      setSlashQuery(slashMatch[1].toLowerCase());
      setSlashMenuIndex(0);
    } else {
      setShowSlashMenu(false);
    }

    // Detect Wiki Link trigger: "[["
    const wikiMatch = textUpToCursor.match(/\[\[([^\]\n]*)$/);
    if (wikiMatch) {
      setShowWikiMenu(true);
      setWikiQuery(wikiMatch[1]);
      setWikiMenuIndex(0);
    } else {
      setShowWikiMenu(false);
    }
  };

  // Create new note
  const handleCreateNewNote = async () => {
    const newCategory = selectedNotebook || (selectedView === 'archived' || selectedView === 'trash' ? 'Personal' : 'Personal');
    const newId = await addItem({
      type: 'note',
      title: 'Untitled Note',
      body: '',
      category: newCategory,
      tags: selectedTag ? [selectedTag] : ['notes'],
      pinned: selectedView === 'pinned',
      isFavorite: selectedView === 'favorites'
    });

    setSelectedNoteId(newId);
    if (isMobile) setMobilePane('editor');

    // Immediate focus to title
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 50);
  };

  // Keyboard Shortcuts (Cmd+N, Cmd+S, Cmd+Shift+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N: New Note
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n' && !e.shiftKey) {
        e.preventDefault();
        handleCreateNewNote();
        return;
      }

      // Cmd/Ctrl + S: Force Save
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (activeNote) {
          updateItem(activeNote.id, { title, body: bodyText, updatedAt: Date.now() });
          setSaveStatus('saved');
        }
        return;
      }

      // Cmd/Ctrl + Shift + F: Focus Mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFocusMode(prev => !prev);
        return;
      }

      // Escape: Exit focus mode, close popups
      if (e.key === 'Escape') {
        if (isFocusMode) setIsFocusMode(false);
        if (showSlashMenu) setShowSlashMenu(false);
        if (showWikiMenu) setShowWikiMenu(false);
        if (showExportMenu) setShowExportMenu(false);
        if (showColorPicker) setShowColorPicker(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNote, title, bodyText, isFocusMode, showSlashMenu, showWikiMenu, showExportMenu, showColorPicker, updateItem]);

  // Format Bar injection helper
  const insertFormatting = (prefix: string, suffix: string = '', defaultText: string = '') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = bodyText.slice(start, end) || defaultText;
    const newText = bodyText.slice(0, start) + prefix + selectedText + suffix + bodyText.slice(end);

    setBodyText(newText);
    triggerAutosave({ body: newText });

    setTimeout(() => {
      textareaRef.current?.focus();
      const newPos = start + prefix.length + selectedText.length;
      textareaRef.current?.setSelectionRange(newPos, newPos);
    }, 50);
  };

  // Slash commands list
  const slashCommands = useMemo(() => [
    { id: 'h1', label: 'Heading 1', icon: Heading1, desc: 'Large title', insert: '\n# ' },
    { id: 'h2', label: 'Heading 2', icon: Heading2, desc: 'Section header', insert: '\n## ' },
    { id: 'todo', label: 'To-do item', icon: CheckSquare, desc: 'Interactive checkbox', insert: '\n- [ ] ' },
    { id: 'bullet', label: 'Bulleted list', icon: List, desc: 'Simple bullet point', insert: '\n- ' },
    { id: 'quote', label: 'Quote block', icon: Quote, desc: 'Callout quotation', insert: '\n> ' },
    { id: 'code', label: 'Code snippet', icon: Code, desc: 'Monospace code block', insert: '\n```\n\n```' },
    { id: 'divider', label: 'Divider line', icon: Minus, desc: 'Horizontal line', insert: '\n---\n' }
  ].filter(cmd => cmd.label.toLowerCase().includes(slashQuery) || cmd.id.includes(slashQuery)), [slashQuery]);

  const applySlashCommand = (cmd: typeof slashCommands[0]) => {
    const cursorPos = textareaRef.current?.selectionStart || bodyText.length;
    const textBeforeCursor = bodyText.slice(0, cursorPos);
    const textAfterCursor = bodyText.slice(cursorPos);
    const updatedBefore = textBeforeCursor.replace(/(?:^|\n|\s)\/[a-zA-Z0-9]*$/, cmd.insert);
    const newText = updatedBefore + textAfterCursor;

    setBodyText(newText);
    triggerAutosave({ body: newText });
    setShowSlashMenu(false);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // Candidate items for [[ wiki autocomplete
  const candidateWikiItems = useMemo(() => {
    return allNotes
      .filter(n => !n.deletedAt && n.id !== activeNote?.id && n.title.toLowerCase().includes(wikiQuery.toLowerCase()))
      .slice(0, 5);
  }, [allNotes, activeNote, wikiQuery]);

  const applyWikiLink = (itemTitle: string) => {
    const cursorPos = textareaRef.current?.selectionStart || bodyText.length;
    const textBeforeCursor = bodyText.slice(0, cursorPos);
    const textAfterCursor = bodyText.slice(cursorPos);
    const updatedBefore = textBeforeCursor.replace(/\[\[[^\]\n]*$/, `[[${itemTitle}]] `);
    const newText = updatedBefore + textAfterCursor;

    setBodyText(newText);
    triggerAutosave({ body: newText });
    setShowWikiMenu(false);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // Checklists in active note
  const toggleChecklist = (checkId: string) => {
    if (!activeNote || !activeNote.checklists) return;
    const updated = activeNote.checklists.map(c => c.id === checkId ? { ...c, done: !c.done } : c);
    updateItem(activeNote.id, { checklists: updated });
  };

  // Incoming backlinks (Obsidian bidirectional links)
  const incomingBacklinks = useMemo(() => {
    if (!activeNote) return [];
    return calculateBacklinks(items, activeNote.title);
  }, [items, activeNote]);

  // Reading stats
  const wordCount = useMemo(() => calculateWordCount(bodyText), [bodyText]);
  const charCount = useMemo(() => calculateCharacterCount(bodyText), [bodyText]);
  const readingTime = useMemo(() => calculateReadingTimeMinutes(bodyText), [bodyText]);

  // Color palette for active note
  const colorId = activeNote?.color || 'default';
  const colorPalette = NOTE_COLOR_PALETTES[colorId] || NOTE_COLOR_PALETTES.default;

  return (
    <div 
      className={`notes-workspace-root ${isFocusMode ? 'focus-mode' : ''}`}
      style={{
        display: "grid",
        gridTemplateColumns: isFocusMode 
          ? "1fr" 
          : isMobile 
            ? "1fr" 
            : "240px 340px 1fr",
        height: "calc(100vh - 120px)",
        minHeight: 640,
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid var(--border-default)",
        background: "var(--bg-surface)",
        position: "relative"
      }}
    >
      {/* ========================================================
          PANEL 1: LEFT SIDEBAR NAVIGATION (Apple Notes / Obsidian)
          ======================================================== */}
      {(!isFocusMode && (!isMobile || mobilePane === 'sidebar')) && (
        <aside 
          style={{
            background: "var(--bg-surface-elevated)",
            borderRight: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflowY: "auto",
            padding: "16px 12px",
            gap: 16
          }}
        >
          {/* Header & Quick Capture Button */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={16} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>Notes</span>
              </div>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                {viewCounts.all} notes
              </span>
            </div>

            <button
              onClick={handleCreateNewNote}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: 13,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
              title="Create new note (Cmd/Ctrl + N)"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>New Note</span>
              <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.7, fontFamily: "var(--font-mono)" }}>⌘N</span>
            </button>
          </div>

          {/* Quick Search */}
          <div style={{ position: "relative" }}>
            <Search size={13} color="var(--text-tertiary)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="ui-input"
              style={{ width: "100%", height: 32, paddingLeft: 30, paddingRight: 8, fontSize: 12 }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer" }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Main System Views */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-tertiary)", padding: "4px 8px", textTransform: "uppercase" }}>
              Core
            </span>

            {[
              { id: 'all', label: 'All Notes', icon: FileText, count: viewCounts.all },
              { id: 'pinned', label: 'Pinned', icon: Pin, count: viewCounts.pinned, color: '#f59e0b' },
              { id: 'favorites', label: 'Favorites', icon: Star, count: viewCounts.favorites, color: '#eab308' },
              { id: 'archived', label: 'Archived', icon: Archive, count: viewCounts.archived },
              { id: 'trash', label: 'Trash', icon: Trash2, count: viewCounts.trash, color: '#ef4444' }
            ].map(v => {
              const Icon = v.icon;
              const isActive = selectedView === v.id && !selectedNotebook && !selectedTag;
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedView(v.id as MainViewType);
                    setSelectedNotebook(null);
                    setSelectedTag(null);
                    if (isMobile) setMobilePane('list');
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    borderRadius: 7,
                    fontSize: 12.5,
                    border: "none",
                    cursor: "pointer",
                    background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                    fontWeight: isActive ? 600 : 450,
                    transition: "all 0.12s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon size={14} color={v.color || "inherit"} />
                    <span>{v.label}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                    {v.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Notebooks / Folders */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px" }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-tertiary)", textTransform: "uppercase" }}>
                Notebooks
              </span>
              <button
                onClick={() => setShowNewNotebookModal(true)}
                style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: 2 }}
                title="Create Notebook Folder"
              >
                <Plus size={13} />
              </button>
            </div>

            {notebooks.map(nb => {
              const isActive = selectedNotebook?.toLowerCase() === nb.name.toLowerCase();
              return (
                <button
                  key={nb.name}
                  onClick={() => {
                    setSelectedNotebook(nb.name);
                    setSelectedTag(null);
                    if (selectedView === 'trash' || selectedView === 'archived') setSelectedView('all');
                    if (isMobile) setMobilePane('list');
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    borderRadius: 7,
                    fontSize: 12.5,
                    border: "none",
                    cursor: "pointer",
                    background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                    fontWeight: isActive ? 600 : 450,
                    transition: "all 0.12s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                    <Folder size={14} color={isActive ? "var(--accent-hover)" : "var(--text-tertiary)"} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nb.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                    {nb.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-tertiary)", padding: "4px 8px", textTransform: "uppercase" }}>
                Tags
              </span>
              {tags.slice(0, 10).map(t => {
                const isActive = selectedTag === t.tag;
                return (
                  <button
                    key={t.tag}
                    onClick={() => {
                      setSelectedTag(isActive ? null : t.tag);
                      if (isMobile) setMobilePane('list');
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "5px 10px",
                      borderRadius: 7,
                      fontSize: 12,
                      border: "none",
                      cursor: "pointer",
                      background: isActive ? "rgba(16, 185, 129, 0.12)" : "transparent",
                      color: isActive ? "#10b981" : "var(--text-secondary)",
                      transition: "all 0.12s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Tag size={12} color={isActive ? "#10b981" : "var(--text-tertiary)"} />
                      <span>#{t.tag}</span>
                    </div>
                    <span style={{ fontSize: 10.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer: Storage Status */}
          <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-tertiary)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
            <span>Local Dexie Storage • 100% Private</span>
          </div>
        </aside>
      )}

      {/* ========================================================
          PANEL 2: MIDDLE NOTE LIST & BROWSER (Fast Filter & Sort)
          ======================================================== */}
      {(!isFocusMode && (!isMobile || mobilePane === 'list')) && (
        <section
          style={{
            background: "var(--bg-surface)",
            borderRight: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden"
          }}
        >
          {/* Header Row */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isMobile && (
                <button
                  onClick={() => setMobilePane('sidebar')}
                  style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 2 }}
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                {selectedNotebook || (selectedTag ? `#${selectedTag}` : selectedView.toUpperCase())}
              </h2>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", background: "var(--bg-surface-elevated)", padding: "1px 6px", borderRadius: 9999 }}>
                {filteredNotes.length}
              </span>
            </div>

            {/* Layout & Sort controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <select
                value={sortOption}
                onChange={e => setSortOption(e.target.value as SortOption)}
                style={{
                  fontSize: 11.5,
                  padding: "3px 6px",
                  borderRadius: 6,
                  background: "var(--bg-surface-elevated)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer"
                }}
              >
                <option value="updated">Recent</option>
                <option value="created">Created</option>
                <option value="title">Title (A-Z)</option>
              </select>

              <button
                onClick={() => setLayoutMode(layoutMode === 'list' ? 'cards' : 'list')}
                className="btn-ghost"
                style={{ padding: 5, borderRadius: 6 }}
                title={`Switch to ${layoutMode === 'list' ? 'Card' : 'List'} view`}
              >
                {layoutMode === 'list' ? <LayoutGrid size={14} /> : <LayoutList size={14} />}
              </button>
            </div>
          </div>

          {/* Note List Scroll Area */}
          <div style={{ flex: 1, overflowY: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredNotes.map(note => {
              const isSelected = activeNote?.id === note.id;
              const palette = NOTE_COLOR_PALETTES[note.color || 'default'] || NOTE_COLOR_PALETTES.default;

              return (
                <div
                  key={note.id}
                  onClick={() => {
                    setSelectedNoteId(note.id);
                    if (isMobile) setMobilePane('editor');
                  }}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    background: isSelected 
                      ? "rgba(255,255,255,0.08)" 
                      : note.color && note.color !== 'default' 
                        ? palette.bgDark 
                        : "transparent",
                    border: isSelected 
                      ? "1px solid var(--border-default)" 
                      : "1px solid var(--border-subtle)",
                    borderLeft: note.color && note.color !== 'default' 
                      ? `3px solid ${palette.dotColor}` 
                      : isSelected 
                        ? "3px solid var(--accent-hover)" 
                        : "1px solid var(--border-subtle)",
                    transition: "all 0.15s ease"
                  }}
                >
                  {/* Title & Status Badges */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                      {note.pinned && <Pin size={11} color="#f59e0b" fill="#f59e0b" />}
                      {note.isFavorite && <Star size={11} color="#eab308" fill="#eab308" />}
                      <span style={{ 
                        fontSize: 13.5, 
                        fontWeight: 650, 
                        color: "var(--text-primary)", 
                        overflow: "hidden", 
                        textOverflow: "ellipsis", 
                        whiteSpace: "nowrap" 
                      }}>
                        {note.title || 'Untitled Note'}
                      </span>
                    </div>

                    {note.isPrivate && <Lock size={11} color="#f43f5e" />}
                  </div>

                  {/* Body Snippet (2 lines) */}
                  {note.body && (
                    <p style={{ 
                      margin: 0, 
                      fontSize: 12, 
                      color: "var(--text-secondary)", 
                      lineHeight: 1.4, 
                      overflow: "hidden", 
                      textOverflow: "ellipsis", 
                      display: "-webkit-box", 
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: "vertical" 
                    }}>
                      {note.body.slice(0, 120)}
                    </p>
                  )}

                  {/* Metadata Row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, flexWrap: "wrap", fontSize: 11, color: "var(--text-tertiary)" }}>
                    <span>{formatRelativeTime(note.updatedAt || note.createdAt)}</span>
                    {note.category && (
                      <span style={{ background: "var(--bg-surface-elevated)", padding: "1px 6px", borderRadius: 4, color: "var(--text-secondary)" }}>
                        {note.category}
                      </span>
                    )}
                    {note.tags && note.tags.slice(0, 2).map(t => (
                      <span key={t} style={{ color: "var(--accent-hover)" }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredNotes.length === 0 && (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
                No notes found in this view.
                <div style={{ marginTop: 10 }}>
                  <button 
                    onClick={handleCreateNewNote}
                    className="btn-primary"
                    style={{ padding: "6px 12px", fontSize: 12 }}
                  >
                    + Create First Note
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================
          PANEL 3: RIGHT EDITORIAL CANVAS (Full Featured Rich Writer)
          ======================================================== */}
      {(!isMobile || mobilePane === 'editor') && (
        <main
          style={{
            background: "var(--bg-surface)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {activeNote ? (
            <>
              {/* Editor Top Control Bar */}
              <div 
                style={{
                  padding: "10px 18px",
                  borderBottom: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--bg-surface-elevated)",
                  gap: 12,
                  flexWrap: "wrap"
                }}
              >
                {/* Left: Mobile Back + Save Status */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {isMobile && (
                    <button
                      onClick={() => setMobilePane('list')}
                      style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}
                    >
                      <ChevronLeft size={16} />
                      <span>Notes</span>
                    </button>
                  )}

                  {/* Autosave Status Pill */}
                  <div 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 6, 
                      fontSize: 11.5, 
                      fontFamily: "var(--font-mono)",
                      color: saveStatus === 'saving' ? "#f59e0b" : "#10b981",
                      background: saveStatus === 'saving' ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
                      padding: "3px 8px",
                      borderRadius: 6,
                      border: `1px solid ${saveStatus === 'saving' ? "rgba(245, 158, 11, 0.25)" : "rgba(16, 185, 129, 0.25)"}`
                    }}
                  >
                    <span 
                      style={{ 
                        width: 6, 
                        height: 6, 
                        borderRadius: "50%", 
                        background: saveStatus === 'saving' ? "#f59e0b" : "#10b981",
                        boxShadow: saveStatus === 'saving' ? "0 0 8px #f59e0b" : "none"
                      }} 
                    />
                    <span>{saveStatus === 'saving' ? 'Saving…' : 'Saved'}</span>
                  </div>

                  {/* Notebook Selector */}
                  <select
                    value={activeNote.category || 'Personal'}
                    onChange={e => {
                      updateItem(activeNote.id, { category: e.target.value });
                    }}
                    style={{
                      fontSize: 11.5,
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: "var(--bg-surface)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-subtle)",
                      cursor: "pointer"
                    }}
                  >
                    {notebooks.map(nb => (
                      <option key={nb.name} value={nb.name}>
                        📁 {nb.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Right: Color, Pin, Star, Focus, Export, More */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {/* Color Picker Toggle */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setShowColorPicker(prev => !prev)}
                      className="btn-ghost"
                      style={{ padding: 6, color: colorPalette.dotColor }}
                      title="Set Note Color Label (Google Keep)"
                    >
                      <Palette size={15} />
                    </button>

                    {showColorPicker && (
                      <div 
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "100%",
                          marginTop: 6,
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-default)",
                          borderRadius: 10,
                          padding: 8,
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: 6,
                          zIndex: 50,
                          boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
                        }}
                      >
                        {Object.values(NOTE_COLOR_PALETTES).map(pal => (
                          <button
                            key={pal.id}
                            onClick={() => {
                              updateItem(activeNote.id, { color: pal.id as NoteColorId });
                              setShowColorPicker(false);
                            }}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: pal.dotColor,
                              border: activeNote.color === pal.id ? "2px solid #fff" : "1px solid rgba(0,0,0,0.2)",
                              cursor: "pointer"
                            }}
                            title={pal.label}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pin Button */}
                  <button
                    onClick={() => updateItem(activeNote.id, { pinned: !activeNote.pinned })}
                    className="btn-ghost"
                    style={{ padding: 6, color: activeNote.pinned ? "#f59e0b" : "var(--text-tertiary)" }}
                    title={activeNote.pinned ? "Unpin note" : "Pin note to top"}
                  >
                    <Pin size={15} fill={activeNote.pinned ? "#f59e0b" : "none"} />
                  </button>

                  {/* Favorite Star Button */}
                  <button
                    onClick={() => updateItem(activeNote.id, { isFavorite: !activeNote.isFavorite })}
                    className="btn-ghost"
                    style={{ padding: 6, color: activeNote.isFavorite ? "#eab308" : "var(--text-tertiary)" }}
                    title={activeNote.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    <Star size={15} fill={activeNote.isFavorite ? "#eab308" : "none"} />
                  </button>

                  {/* Focus Mode Button */}
                  <button
                    onClick={() => setIsFocusMode(prev => !prev)}
                    className="btn-ghost"
                    style={{ padding: 6, color: isFocusMode ? "var(--accent-hover)" : "var(--text-tertiary)" }}
                    title={isFocusMode ? "Exit Focus Mode (Esc)" : "Distraction-Free Focus Mode (Cmd+Shift+F)"}
                  >
                    {isFocusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                  </button>

                  {/* Export Dropdown */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setShowExportMenu(prev => !prev)}
                      className="btn-ghost"
                      style={{ padding: 6, color: "var(--text-secondary)" }}
                      title="Export Note (.md / .txt / Copy)"
                    >
                      <Download size={15} />
                    </button>

                    {showExportMenu && (
                      <div
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "100%",
                          marginTop: 6,
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-default)",
                          borderRadius: 8,
                          padding: 4,
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                          minWidth: 160,
                          zIndex: 50,
                          boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
                        }}
                      >
                        <button
                          onClick={() => {
                            exportNoteAsMarkdown(activeNote);
                            setShowExportMenu(false);
                          }}
                          className="btn-ghost"
                          style={{ justifyContent: "flex-start", gap: 8, fontSize: 12, padding: "6px 10px" }}
                        >
                          <FileText size={13} />
                          <span>Export Markdown (.md)</span>
                        </button>
                        <button
                          onClick={() => {
                            exportNoteAsPlainText(activeNote);
                            setShowExportMenu(false);
                          }}
                          className="btn-ghost"
                          style={{ justifyContent: "flex-start", gap: 8, fontSize: 12, padding: "6px 10px" }}
                        >
                          <FileText size={13} />
                          <span>Export Plain Text (.txt)</span>
                        </button>
                        <button
                          onClick={async () => {
                            await copyNoteToClipboard(activeNote);
                            setCopiedFeedback(true);
                            setTimeout(() => setCopiedFeedback(false), 2000);
                            setShowExportMenu(false);
                          }}
                          className="btn-ghost"
                          style={{ justifyContent: "flex-start", gap: 8, fontSize: 12, padding: "6px 10px" }}
                        >
                          <Copy size={13} />
                          <span>{copiedFeedback ? 'Copied!' : 'Copy Markdown'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* More Actions (Archive / Trash) */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setShowMoreMenu(prev => !prev)}
                      className="btn-ghost"
                      style={{ padding: 6, color: "var(--text-secondary)" }}
                    >
                      <MoreVertical size={15} />
                    </button>

                    {showMoreMenu && (
                      <div
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "100%",
                          marginTop: 6,
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-default)",
                          borderRadius: 8,
                          padding: 4,
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                          minWidth: 150,
                          zIndex: 50,
                          boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
                        }}
                      >
                        {activeNote.deletedAt ? (
                          <>
                            <button
                              onClick={() => {
                                restoreItem(activeNote.id);
                                setShowMoreMenu(false);
                              }}
                              className="btn-ghost"
                              style={{ justifyContent: "flex-start", gap: 8, fontSize: 12, padding: "6px 10px" }}
                            >
                              <RotateCcw size={13} />
                              <span>Restore from Trash</span>
                            </button>
                            <button
                              onClick={() => {
                                hardDeleteItem(activeNote.id);
                                setShowMoreMenu(false);
                              }}
                              className="btn-ghost"
                              style={{ justifyContent: "flex-start", gap: 8, fontSize: 12, padding: "6px 10px", color: "#ef4444" }}
                            >
                              <Trash2 size={13} color="#ef4444" />
                              <span>Permanently Delete</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                if (activeNote.isArchived) {
                                  unarchiveItem(activeNote.id);
                                } else {
                                  archiveItem(activeNote.id);
                                }
                                setShowMoreMenu(false);
                              }}
                              className="btn-ghost"
                              style={{ justifyContent: "flex-start", gap: 8, fontSize: 12, padding: "6px 10px" }}
                            >
                              <Archive size={13} />
                              <span>{activeNote.isArchived ? 'Unarchive' : 'Archive Note'}</span>
                            </button>
                            <button
                              onClick={() => {
                                trashItem(activeNote.id);
                                setShowMoreMenu(false);
                              }}
                              className="btn-ghost"
                              style={{ justifyContent: "flex-start", gap: 8, fontSize: 12, padding: "6px 10px", color: "#ef4444" }}
                            >
                              <Trash2 size={13} color="#ef4444" />
                              <span>Move to Trash</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Formatting Quick Bar (Linear / Notion Style) */}
              <div
                style={{
                  padding: "6px 18px",
                  borderBottom: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  overflowX: "auto",
                  background: "var(--bg-surface)"
                }}
              >
                <button 
                  onClick={() => insertFormatting('# ', '', 'Heading 1')}
                  className="btn-ghost" 
                  style={{ padding: "4px 7px", fontSize: 11.5, fontWeight: 700 }}
                  title="Heading 1"
                >
                  H1
                </button>
                <button 
                  onClick={() => insertFormatting('## ', '', 'Heading 2')}
                  className="btn-ghost" 
                  style={{ padding: "4px 7px", fontSize: 11.5, fontWeight: 700 }}
                  title="Heading 2"
                >
                  H2
                </button>
                <div style={{ width: 1, height: 14, background: "var(--border-subtle)", margin: "0 2px" }} />
                <button 
                  onClick={() => insertFormatting('**', '**', 'bold text')}
                  className="btn-ghost" 
                  style={{ padding: "4px 6px" }}
                  title="Bold"
                >
                  <Bold size={13} />
                </button>
                <button 
                  onClick={() => insertFormatting('*', '*', 'italic text')}
                  className="btn-ghost" 
                  style={{ padding: "4px 6px" }}
                  title="Italic"
                >
                  <Italic size={13} />
                </button>
                <button 
                  onClick={() => insertFormatting('\n- [ ] ', '', 'Task item')}
                  className="btn-ghost" 
                  style={{ padding: "4px 6px" }}
                  title="Checklist"
                >
                  <CheckSquare size={13} />
                </button>
                <button 
                  onClick={() => insertFormatting('\n- ', '', 'List item')}
                  className="btn-ghost" 
                  style={{ padding: "4px 6px" }}
                  title="Bullet list"
                >
                  <List size={13} />
                </button>
                <button 
                  onClick={() => insertFormatting('\n> ', '', 'Quote')}
                  className="btn-ghost" 
                  style={{ padding: "4px 6px" }}
                  title="Quote"
                >
                  <Quote size={13} />
                </button>
                <button 
                  onClick={() => insertFormatting('\n```\n', '\n```', 'code')}
                  className="btn-ghost" 
                  style={{ padding: "4px 6px" }}
                  title="Code Block"
                >
                  <Code size={13} />
                </button>
                <button 
                  onClick={() => insertFormatting('\n---\n')}
                  className="btn-ghost" 
                  style={{ padding: "4px 6px" }}
                  title="Horizontal Divider"
                >
                  <Minus size={13} />
                </button>
                <button 
                  onClick={() => insertFormatting('[[', ']]', 'Page Title')}
                  className="btn-ghost" 
                  style={{ padding: "4px 7px", fontSize: 11, color: "var(--accent-hover)" }}
                  title="Wiki Backlink (Obsidian [[Note]])"
                >
                  [[ ]]
                </button>
              </div>

              {/* Scrollable Writing Body Area */}
              <div 
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "24px 32px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  maxWidth: isFocusMode ? 820 : "100%",
                  margin: isFocusMode ? "0 auto" : "0",
                  width: "100%"
                }}
              >
                {/* Clean Title Input */}
                <input
                  ref={titleInputRef}
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Note Title..."
                  style={{
                    fontSize: 24,
                    fontWeight: 750,
                    letterSpacing: "-0.02em",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "var(--text-primary)",
                    width: "100%",
                    padding: 0
                  }}
                />

                {/* Main Body Textarea */}
                <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column" }}>
                  <textarea
                    ref={textareaRef}
                    value={bodyText}
                    onChange={e => handleBodyChange(e.target.value)}
                    placeholder="Type anything... Use '/' for formatting blocks or '[[' to link notes..."
                    style={{
                      flex: 1,
                      minHeight: 280,
                      width: "100%",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: "var(--text-primary)",
                      fontSize: 14.5,
                      lineHeight: 1.68,
                      resize: "none",
                      fontFamily: "inherit"
                    }}
                  />

                  {/* Notion Slash Command Menu Overlay */}
                  {showSlashMenu && (
                    <div
                      style={{
                        position: "absolute",
                        left: 20,
                        bottom: 80,
                        background: "var(--bg-surface-elevated)",
                        border: "1px solid var(--border-default)",
                        borderRadius: 10,
                        boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
                        width: 260,
                        zIndex: 60,
                        padding: 6,
                        display: "flex",
                        flexDirection: "column",
                        gap: 3
                      }}
                    >
                      <div style={{ padding: "4px 8px", fontSize: 10.5, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>
                        Basic Blocks
                      </div>
                      {slashCommands.map((cmd, idx) => {
                        const Icon = cmd.icon;
                        const isSelected = idx === slashMenuIndex;
                        return (
                          <button
                            key={cmd.id}
                            type="button"
                            onClick={() => applySlashCommand(cmd)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "6px 8px",
                              borderRadius: 6,
                              background: isSelected ? "rgba(255,255,255,0.08)" : "transparent",
                              border: "none",
                              cursor: "pointer",
                              textAlign: "left",
                              color: "var(--text-primary)"
                            }}
                          >
                            <Icon size={14} color="var(--accent-hover)" />
                            <div>
                              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{cmd.label}</div>
                              <div style={{ fontSize: 10.5, color: "var(--text-tertiary)" }}>{cmd.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Obsidian [[ Wiki Link Autocomplete Menu Overlay */}
                  {showWikiMenu && (
                    <div
                      style={{
                        position: "absolute",
                        left: 20,
                        bottom: 80,
                        background: "var(--bg-surface-elevated)",
                        border: "1px solid var(--border-default)",
                        borderRadius: 10,
                        boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
                        width: 280,
                        zIndex: 60,
                        padding: 6,
                        display: "flex",
                        flexDirection: "column",
                        gap: 3
                      }}
                    >
                      <div style={{ padding: "4px 8px", fontSize: 10.5, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>
                        Link to Note
                      </div>
                      {candidateWikiItems.map((cand, idx) => (
                        <button
                          key={cand.id}
                          type="button"
                          onClick={() => applyWikiLink(cand.title)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "6px 8px",
                            borderRadius: 6,
                            background: idx === wikiMenuIndex ? "rgba(255,255,255,0.08)" : "transparent",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                            color: "var(--text-primary)"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <FileText size={13} color="var(--accent-hover)" />
                            <span style={{ fontSize: 12.5, fontWeight: 550 }}>{cand.title}</span>
                          </div>
                          <ArrowUpRight size={12} color="var(--text-tertiary)" />
                        </button>
                      ))}
                      {candidateWikiItems.length === 0 && (
                        <div style={{ padding: "8px", fontSize: 11.5, color: "var(--text-tertiary)" }}>
                          No matching notes found.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Structured Checklists Section */}
                {activeNote.checklists && activeNote.checklists.length > 0 && (
                  <div style={{ marginTop: 12, padding: "14px", borderRadius: 10, background: "var(--bg-surface-elevated)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>
                      Interactive Checklists
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {activeNote.checklists.map(c => (
                        <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: c.done ? "var(--text-tertiary)" : "var(--text-primary)" }}>
                          <input 
                            type="checkbox"
                            checked={c.done}
                            onChange={() => toggleChecklist(c.id)}
                            style={{ cursor: "pointer" }}
                          />
                          <span style={{ textDecoration: c.done ? "line-through" : "none" }}>{c.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bidirectional Backlinks (Obsidian Knowledge Graph Links) */}
                {incomingBacklinks.length > 0 && (
                  <div style={{ marginTop: 16, padding: "14px", borderRadius: 10, background: "var(--bg-surface-elevated)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>
                      <Layers size={13} color="var(--accent-hover)" />
                      <span>Referenced in {incomingBacklinks.length} other note{incomingBacklinks.length > 1 ? 's' : ''} (Backlinks)</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {incomingBacklinks.map(link => (
                        <button
                          key={link.id}
                          onClick={() => setSelectedNoteId(link.id)}
                          className="ui-pill"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "3px 8px",
                            fontSize: 11.5,
                            cursor: "pointer",
                            background: "rgba(59, 130, 246, 0.12)",
                            color: "var(--accent-hover)",
                            border: "1px solid rgba(59, 130, 246, 0.3)"
                          }}
                        >
                          <span>{link.title}</span>
                          <ArrowUpRight size={11} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Editorial Status Bar */}
              <div
                style={{
                  padding: "8px 20px",
                  borderTop: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--bg-surface-elevated)",
                  fontSize: 11,
                  color: "var(--text-tertiary)",
                  fontFamily: "var(--font-mono)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{charCount} characters</span>
                  <span>•</span>
                  <span>{readingTime} min read</span>
                </div>

                <div>
                  Updated {formatRelativeTime(activeNote.updatedAt || activeNote.createdAt)}
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div 
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                padding: 40,
                color: "var(--text-tertiary)"
              }}
            >
              <div 
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-secondary)"
                }}
              >
                <FileText size={26} />
              </div>
              <div style={{ textAlign: "center" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "var(--text-primary)" }}>
                  No Note Selected
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
                  Choose a note from the list, or create a fresh one to begin writing.
                </p>
              </div>

              <button
                onClick={handleCreateNewNote}
                className="btn-primary"
                style={{ gap: 6, padding: "8px 16px", fontSize: 13 }}
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Create New Note</span>
              </button>
            </div>
          )}
        </main>
      )}

      {/* New Notebook Modal */}
      {showNewNotebookModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100
          }}
          onClick={() => setShowNewNotebookModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 380,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: 14,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Folder size={18} color="var(--accent-hover)" />
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>New Notebook</h3>
              </div>
              <button 
                onClick={() => setShowNewNotebookModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                Notebook Name
              </label>
              <input
                autoFocus
                value={newNotebookInput}
                onChange={e => setNewNotebookInput(e.target.value)}
                placeholder="e.g. Architecture, Research, Book Summary"
                className="ui-input"
                style={{ width: "100%", height: 38, fontSize: 13 }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newNotebookInput.trim()) {
                    setSelectedNotebook(newNotebookInput.trim());
                    setNewNotebookInput('');
                    setShowNewNotebookModal(false);
                  }
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowNewNotebookModal(false)}
                className="btn-ghost"
                style={{ padding: "7px 12px", fontSize: 12.5 }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newNotebookInput.trim()}
                onClick={() => {
                  setSelectedNotebook(newNotebookInput.trim());
                  setNewNotebookInput('');
                  setShowNewNotebookModal(false);
                }}
                className="btn-primary"
                style={{ padding: "7px 14px", fontSize: 12.5 }}
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
