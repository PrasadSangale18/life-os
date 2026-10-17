import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  X, 
  Share2, 
  Columns, 
  Maximize2, 
  Move, 
  Type, 
  Link2, 
  FileText, 
  Sparkles, 
  Send, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Edit3, 
  Compass, 
  FolderKanban, 
  CheckSquare, 
  Trash2, 
  Database, 
  RefreshCw, 
  FolderPlus, 
  BookOpen, 
  Target, 
  Sliders,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../../store';
import { PILLARS } from '../../theme/tokens';
import type { Item } from '../../types';
import { ForceGraphView } from './ForceGraphView';
import { HierarchyTreeView } from './HierarchyTreeView';

export interface CanvasNode {
  id: string;
  type: 'note' | 'record' | 'link' | 'task' | 'project' | 'goal';
  title: string;
  subtitle: string;
  body?: string;
  url?: string;
  x: number;
  y: number;
  width?: number;
  color?: string;
  tags?: string[];
  pillar?: string;
  priority?: string;
  status?: string;
  itemId?: string;
}

export interface CanvasEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface CanvasBoard {
  id: string;
  title: string;
  nodesCount: number;
  updatedAt: string;
  diagramType: 'wireframe' | 'curve' | 'branching' | 'tree';
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  docTitle: string;
  docContent: {
    summary: string;
    quote: string;
    bullets: string[];
    tableRows: { day: string; route: string; walking: string }[];
  };
}

export interface CanvasWorkspaceProps {
  onEditTask?: (task: Item) => void;
  onNewItem?: () => void;
  currentView?: 'canvas' | 'tree' | 'graph';
  onViewChange?: (view: 'canvas' | 'tree' | 'graph') => void;
}

const PILLAR_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  physical: { bg: 'rgba(255, 90, 31, 0.12)', text: '#FF7A45', border: 'rgba(255, 90, 31, 0.35)', accent: '#FF5A1F' },
  mental: { bg: 'rgba(56, 189, 248, 0.12)', text: '#38BDF8', border: 'rgba(56, 189, 248, 0.35)', accent: '#38BDF8' },
  relational: { bg: 'rgba(236, 72, 153, 0.12)', text: '#F472B6', border: 'rgba(236, 72, 153, 0.35)', accent: '#EC4899' },
  spiritual: { bg: 'rgba(168, 85, 247, 0.12)', text: '#C084FC', border: 'rgba(168, 85, 247, 0.35)', accent: '#A855F7' },
  financial: { bg: 'rgba(16, 185, 129, 0.12)', text: '#34D399', border: 'rgba(16, 185, 129, 0.35)', accent: '#10B981' },
};

const STORAGE_KEY = 'lifeos_canvas_boards_v3';

/**
 * Builds dynamic Life OS canvases grounded strictly in the user's real database items
 */
const generateLifeOSCanvases = (items: Item[]): CanvasBoard[] => {
  const tasks = items.filter(i => i.type === 'task' && !i.deletedAt && !i.isArchived);
  const notes = items.filter(i => (i.type === 'note' || i.type === 'knowledge' || i.type === 'idea') && !i.deletedAt && !i.isArchived);
  const goals = items.filter(i => (i.type === 'goal' || i.type === 'project') && !i.deletedAt && !i.isArchived);

  // 1. Board: Daily Focus & Execution Matrix
  const focusTasks = tasks.slice(0, 3);
  const taskNodes: CanvasNode[] = focusTasks.map((t, idx) => ({
    id: `node-task-${t.id || idx}`,
    type: 'task',
    title: t.title,
    subtitle: t.body ? (t.body.length > 90 ? t.body.substring(0, 90) + '...' : t.body) : `Pillar: ${t.pillar || 'General'} • Priority: ${t.priority || 'Normal'}`,
    body: t.body,
    x: idx === 0 ? 80 : idx === 1 ? 440 : 260,
    y: idx === 0 ? 80 : idx === 1 ? 110 : 340,
    width: 290,
    tags: t.tags && t.tags.length > 0 ? t.tags : ['task', t.pillar || 'focus'],
    pillar: t.pillar || 'physical',
    priority: t.priority || 'normal',
    status: t.status || 'todo',
    itemId: t.id
  }));

  const boardExecution: CanvasBoard = {
    id: 'execution-matrix',
    title: 'Daily Focus & Tasks',
    nodesCount: taskNodes.length,
    updatedAt: 'Live',
    diagramType: 'wireframe',
    nodes: taskNodes.length > 0 ? taskNodes : [
      {
        id: 'sample-task-1',
        type: 'task',
        title: 'Complete Primary Focus Priority',
        subtitle: 'Break down deliverable into clear execution checkpoints',
        x: 100,
        y: 100,
        width: 290,
        tags: ['focus', 'priority'],
        pillar: 'physical',
        priority: 'high'
      }
    ],
    edges: taskNodes.length >= 2 ? [
      { id: 'edge-t1', from: taskNodes[0].id, to: taskNodes[1].id, label: 'Execution sequence' }
    ] : [],
    docTitle: 'Daily Execution & Focus Matrix',
    docContent: {
      summary: `Active execution stream connecting ${taskNodes.length} key tasks across your AISANKALP quadrants.`,
      quote: 'Action produces clarity. Focus on the single highest-leverage deliverable.',
      bullets: taskNodes.map(t => `${t.title} (${t.priority || 'Normal'})`),
      tableRows: taskNodes.map((t, i) => ({
        day: `Step ${i + 1}`,
        route: t.title,
        walking: t.pillar || 'Core'
      }))
    }
  };

  // 2. Board: Second Brain & Knowledge Lattice
  const brainNotes = notes.slice(0, 4);
  const noteNodes: CanvasNode[] = brainNotes.map((n, idx) => ({
    id: `node-note-${n.id || idx}`,
    type: (n.type === 'knowledge' || n.type === 'idea') ? (n.type as any) : 'note',
    title: n.title,
    subtitle: n.body ? (n.body.length > 90 ? n.body.substring(0, 90) + '...' : n.body) : 'Persistent knowledge card in your second brain',
    body: n.body,
    x: idx === 0 ? 80 : idx === 1 ? 440 : idx === 2 ? 260 : 620,
    y: idx === 0 ? 90 : idx === 1 ? 140 : idx === 2 ? 370 : 380,
    width: 285,
    tags: n.tags && n.tags.length > 0 ? n.tags : ['notes', n.pillar || 'mind'],
    pillar: n.pillar || 'mental',
    itemId: n.id
  }));

  const boardSecondBrain: CanvasBoard = {
    id: 'second-brain',
    title: 'Second Brain Knowledge',
    nodesCount: noteNodes.length,
    updatedAt: 'Live',
    diagramType: 'branching',
    nodes: noteNodes.length > 0 ? noteNodes : [
      {
        id: 'sample-note-1',
        type: 'note',
        title: 'Core Mental Models & First Principles',
        subtitle: 'Deconstruct complex goals into fundamental axioms',
        x: 120,
        y: 120,
        width: 290,
        tags: ['axioms', 'mental-models'],
        pillar: 'mental'
      }
    ],
    edges: noteNodes.length >= 2 ? [
      { id: 'edge-b1', from: noteNodes[0].id, to: noteNodes[1].id, label: 'Associative link' },
      ...(noteNodes.length >= 3 ? [{ id: 'edge-b2', from: noteNodes[0].id, to: noteNodes[2].id, label: 'Synthesis' }] : [])
    ] : [],
    docTitle: 'Second Brain Knowledge Lattice',
    docContent: {
      summary: `Spatial knowledge web linking ${noteNodes.length} notes, ideas, and mental models.`,
      quote: 'Knowledge is not an isolated list of facts, but a lattice of interrelated mental models.',
      bullets: noteNodes.map(n => n.title),
      tableRows: noteNodes.map((n, i) => ({
        day: `Concept ${i + 1}`,
        route: n.title,
        walking: n.pillar || 'Mental'
      }))
    }
  };

  // 3. Board: Goals & Strategic Horizons
  const strategicItems = goals.length > 0 ? goals.slice(0, 3) : tasks.slice(0, 2);
  const goalNodes: CanvasNode[] = strategicItems.map((g, idx) => ({
    id: `node-goal-${g.id || idx}`,
    type: g.type === 'goal' ? 'goal' : g.type === 'project' ? 'project' : 'task',
    title: g.title,
    subtitle: g.body ? (g.body.length > 90 ? g.body.substring(0, 90) + '...' : g.body) : 'High-level strategic pillar deliverable',
    body: g.body,
    x: idx === 0 ? 90 : idx === 1 ? 450 : 270,
    y: idx === 0 ? 80 : idx === 1 ? 130 : 360,
    width: 290,
    tags: g.tags || ['strategic', 'horizon'],
    pillar: g.pillar || 'spiritual',
    itemId: g.id
  }));

  const boardGoals: CanvasBoard = {
    id: 'strategic-horizons',
    title: 'Goals & Strategic Horizons',
    nodesCount: goalNodes.length,
    updatedAt: 'Active',
    diagramType: 'tree',
    nodes: goalNodes,
    edges: goalNodes.length >= 2 ? [
      { id: 'edge-g1', from: goalNodes[0].id, to: goalNodes[1].id, label: 'Milestone dependency' }
    ] : [],
    docTitle: 'Strategic Horizons & Goal Alignment',
    docContent: {
      summary: `High-leverage milestone alignment across key strategic initiatives.`,
      quote: 'A goal without an execution timeline is merely a wish.',
      bullets: goalNodes.map(g => g.title),
      tableRows: goalNodes.map((g, i) => ({
        day: `Milestone ${i + 1}`,
        route: g.title,
        walking: g.pillar || 'Strategy'
      }))
    }
  };

  // 4. Board: Visual Ideation Scratchpad
  const boardScratchpad: CanvasBoard = {
    id: 'visual-scratchpad',
    title: 'Visual Scratchpad',
    nodesCount: 2,
    updatedAt: 'Active',
    diagramType: 'curve',
    nodes: [
      {
        id: 'scratch-hub',
        type: 'note',
        title: 'Central Ideation Hub',
        subtitle: 'Double click canvas to drop cards. Use Link tool to connect ideas.',
        body: 'Drag cards to rearrange freely. Click [+ Add Item] to pull real tasks and notes into this canvas.',
        x: 100,
        y: 110,
        width: 290,
        tags: ['brainstorm', 'spatial']
      },
      {
        id: 'scratch-action',
        type: 'record',
        title: 'Actionable Synthesis',
        subtitle: 'Connect thoughts with glowing bezier edges and export to My Notes.',
        x: 460,
        y: 180,
        width: 280,
        tags: ['action', 'execution']
      }
    ],
    edges: [
      { id: 'scratch-e1', from: 'scratch-hub', to: 'scratch-action', label: 'Sparks action' }
    ],
    docTitle: 'Open Spatial Brainstorming',
    docContent: {
      summary: 'A clean 2D spatial canvas for non-linear thinking, system deconstruction, and visual planning.',
      quote: 'The mind is for having ideas, not for holding them.',
      bullets: [
        'Double-click anywhere to place a new note',
        'Use the Link tool to draw bezier connections',
        'Organize thoughts visually with zero friction'
      ],
      tableRows: [
        { day: 'Phase 1', route: 'Capture divergent thoughts', walking: 'Exploration' },
        { day: 'Phase 2', route: 'Synthesize convergent plan', walking: 'Execution' }
      ]
    }
  };

  return [boardExecution, boardSecondBrain, boardGoals, boardScratchpad];
};

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({ 
  onEditTask, 
  onNewItem: _onNewItem,
  currentView: _currentView = 'canvas',
  onViewChange
}) => {
  const items = useStore(state => state.items);
  const addItemToStore = useStore(state => state.addItem);

  // Load from localStorage or initialize from items
  const [canvases, setCanvases] = useState<CanvasBoard[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not read saved canvases:', e);
    }
    return generateLifeOSCanvases(items);
  });

  const [activeCanvasId, setActiveCanvasId] = useState<string>(() => {
    return canvases[0]?.id || 'execution-matrix';
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(canvases));
    } catch (e) {
      console.warn('Could not save canvases:', e);
    }
  }, [canvases]);

  // Layout Controls
  const [showDrawer, setShowDrawer] = useState<boolean>(true);
  const [showDocPanel, setShowDocPanel] = useState<boolean>(true);
  const [activeTool, setActiveTool] = useState<'pointer' | 'text' | 'link'>('pointer');
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Interactive Linking Mode
  const [linkSourceNodeId, setLinkSourceNodeId] = useState<string | null>(null);
  const [linkNotification, setLinkNotification] = useState<string | null>(null);

  // Viewport Pan & Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 30, y: 30 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging Nodes
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Drawer Search & Board Modal
  const [searchDrawer, setSearchDrawer] = useState<string>('');
  const [showNewBoardModal, setShowNewBoardModal] = useState<boolean>(false);
  const [newBoardName, setNewBoardName] = useState<string>('');

  // Add Item from Life OS Library Modal
  const [showLibraryModal, setShowLibraryModal] = useState<boolean>(false);
  const [librarySearch, setLibrarySearch] = useState<string>('');
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'task' | 'note' | 'project'>('all');

  // AI Copilot state
  const [chatPrompt, setChatPrompt] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Canvas Copilot active. I can synthesize your cards, identify execution paths, or auto-organize this board.'
    }
  ]);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // Unified Multi-Mode Workspace State (Canvas | Force Graph | Hierarchy Tree)
  const [internalView, setInternalView] = useState<'canvas' | 'tree' | 'graph'>(() => {
    try {
      const saved = localStorage.getItem('sankalp_active_canvas_view');
      if (saved === 'canvas' || saved === 'graph' || saved === 'tree') return saved;
    } catch (e) {
      // ignore
    }
    return _currentView || 'canvas';
  });

  const activeView = _currentView && _currentView !== 'canvas' && _currentView !== internalView ? _currentView : internalView;

  const handleViewChange = (newView: 'canvas' | 'tree' | 'graph') => {
    setInternalView(newView);
    try {
      localStorage.setItem('sankalp_active_canvas_view', newView);
    } catch (e) {
      // ignore
    }
    onViewChange?.(newView);
  };

  // Graph & Tree Interactive Controls
  const [graphSearch, setGraphSearch] = useState<string>('');
  const [graphTypeFilter, setGraphTypeFilter] = useState<'all' | 'task' | 'note' | 'project'>('all');
  const [treeSearch, setTreeSearch] = useState<string>('');
  const [treeTypeFilter, setTreeTypeFilter] = useState<'all' | 'task' | 'note' | 'project'>('all');
  const [selectedPillarFilter, setSelectedPillarFilter] = useState<string | null>(null);
  const [expandAllSignal, setExpandAllSignal] = useState<number>(0);
  const [collapseAllSignal, setCollapseAllSignal] = useState<number>(0);

  const activeCanvas = useMemo(() => {
    return canvases.find(c => c.id === activeCanvasId) || canvases[0] || {
      id: 'default',
      title: 'Canvas',
      nodesCount: 0,
      updatedAt: 'Now',
      diagramType: 'wireframe',
      nodes: [],
      edges: [],
      docTitle: 'Canvas Overview',
      docContent: { summary: '', quote: '', bullets: [], tableRows: [] }
    };
  }, [canvases, activeCanvasId]);

  const filteredCanvases = useMemo(() => {
    if (!searchDrawer.trim()) return canvases;
    const q = searchDrawer.toLowerCase();
    return canvases.filter(c => c.title.toLowerCase().includes(q));
  }, [canvases, searchDrawer]);

  // Dynamic summary derived from active canvas nodes
  const canvasSummary = useMemo(() => {
    const total = activeCanvas.nodes.length;
    const tasks = activeCanvas.nodes.filter(n => n.type === 'task');
    const notes = activeCanvas.nodes.filter(n => n.type === 'note' || n.type === 'record');
    const edges = activeCanvas.edges.length;
    return { total, tasks: tasks.length, notes: notes.length, edges };
  }, [activeCanvas]);

  // Fit view calculation to center all nodes
  const handleFitCanvas = useCallback(() => {
    if (!activeCanvas?.nodes || activeCanvas.nodes.length === 0) {
      setPan({ x: 50, y: 50 });
      setZoom(1);
      return;
    }
    const minX = Math.min(...activeCanvas.nodes.map(n => n.x));
    const maxX = Math.max(...activeCanvas.nodes.map(n => n.x + (n.width || 280)));
    const minY = Math.min(...activeCanvas.nodes.map(n => n.y));
    const maxY = Math.max(...activeCanvas.nodes.map(n => n.y + 160));

    const containerRect = canvasRef.current?.getBoundingClientRect();
    const availableWidth = containerRect ? containerRect.width : 780;
    const availableHeight = containerRect ? containerRect.height : 560;

    const contentWidth = Math.max(maxX - minX + 100, 420);
    const contentHeight = Math.max(maxY - minY + 100, 320);

    const fitZoom = Math.min(
      Math.max(Math.min(availableWidth / contentWidth, availableHeight / contentHeight, 1.0), 0.55),
      1.15
    );

    const fitPanX = Math.round((availableWidth - (maxX - minX) * fitZoom) / 2 - minX * fitZoom);
    const fitPanY = Math.round((availableHeight - (maxY - minY) * fitZoom) / 2 - minY * fitZoom);

    setZoom(Number(fitZoom.toFixed(2)));
    setPan({ x: Math.max(fitPanX, 20), y: Math.max(fitPanY, 20) });
  }, [activeCanvas]);

  // Auto-fit on initial render or canvas change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitCanvas();
    }, 120);
    return () => clearTimeout(timer);
  }, [activeCanvasId, handleFitCanvas]);

  // Reset canvases to fresh store items
  const handleResetToDefaults = () => {
    if (window.confirm('Reset canvases to match current SANKALP items? Custom nodes will be re-seeded.')) {
      const fresh = generateLifeOSCanvases(items);
      setCanvases(fresh);
      setActiveCanvasId(fresh[0].id);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Canvas Pan Handlers
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (activeTool !== 'pointer' || draggingNodeId) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (draggingNodeId) {
      const containerRect = canvasRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      const mouseCanvasX = (e.clientX - containerRect.left - pan.x) / zoom;
      const mouseCanvasY = (e.clientY - containerRect.top - pan.y) / zoom;

      setCanvases(prev => prev.map(c => {
        if (c.id !== activeCanvasId) return c;
        return {
          ...c,
          nodes: c.nodes.map(n => {
            if (n.id !== draggingNodeId) return n;
            return {
              ...n,
              x: Math.round(mouseCanvasX - dragOffset.x),
              y: Math.round(mouseCanvasY - dragOffset.y)
            };
          })
        };
      }));
    }
  };

  const handleMouseUpCanvas = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Node Drag Start
  const handleNodeMouseDown = (e: React.MouseEvent, node: CanvasNode) => {
    e.stopPropagation();

    // If linking mode is active, handle link creation
    if (activeTool === 'link') {
      handleLinkNodeClick(node.id);
      return;
    }

    const containerRect = canvasRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    const mouseCanvasX = (e.clientX - containerRect.left - pan.x) / zoom;
    const mouseCanvasY = (e.clientY - containerRect.top - pan.y) / zoom;

    setDraggingNodeId(node.id);
    setDragOffset({
      x: mouseCanvasX - node.x,
      y: mouseCanvasY - node.y
    });
  };

  // Handle Link Tool Selection on Node
  const handleLinkNodeClick = (nodeId: string) => {
    if (!linkSourceNodeId) {
      setLinkSourceNodeId(nodeId);
      const sourceNode = activeCanvas.nodes.find(n => n.id === nodeId);
      setLinkNotification(`Selected "${sourceNode?.title || 'Card'}". Now click a second card to connect.`);
    } else if (linkSourceNodeId === nodeId) {
      setLinkSourceNodeId(null);
      setLinkNotification(null);
    } else {
      // Connect source to target
      const fromId = linkSourceNodeId;
      const toId = nodeId;
      const exists = activeCanvas.edges.some(e => (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId));
      
      if (!exists) {
        const newEdge: CanvasEdge = {
          id: `edge-${Date.now()}`,
          from: fromId,
          to: toId,
          label: 'Connected'
        };
        setCanvases(prev => prev.map(c => {
          if (c.id !== activeCanvasId) return c;
          return {
            ...c,
            edges: [...c.edges, newEdge]
          };
        }));
      }

      setLinkSourceNodeId(null);
      setLinkNotification('Cards connected! Switch to Move tool or link more cards.');
      setTimeout(() => setLinkNotification(null), 3000);
    }
  };

  // Delete Edge
  const handleDeleteEdge = (edgeId: string) => {
    setCanvases(prev => prev.map(c => {
      if (c.id !== activeCanvasId) return c;
      return {
        ...c,
        edges: c.edges.filter(e => e.id !== edgeId)
      };
    }));
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY * -0.0015;
      setZoom(prev => Math.min(Math.max(prev + zoomDelta, 0.4), 2.2));
    }
  };

  // Double-Click canvas to create note
  const handleDoubleClickCanvas = (e: React.MouseEvent) => {
    const containerRect = canvasRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    const mouseCanvasX = (e.clientX - containerRect.left - pan.x) / zoom;
    const mouseCanvasY = (e.clientY - containerRect.top - pan.y) / zoom;

    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      type: 'note',
      title: 'New Thought Card',
      subtitle: 'Double click to edit or link to other cards',
      x: Math.round(mouseCanvasX - 140),
      y: Math.round(mouseCanvasY - 40),
      width: 280,
      tags: ['thought', 'brainstorm'],
      pillar: 'mental'
    };

    setCanvases(prev => prev.map(c => {
      if (c.id !== activeCanvasId) return c;
      return {
        ...c,
        nodesCount: c.nodes.length + 1,
        nodes: [...c.nodes, newNode]
      };
    }));
  };

  // Create new node with Text tool click
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (activeTool === 'text') {
      const containerRect = canvasRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      const mouseCanvasX = (e.clientX - containerRect.left - pan.x) / zoom;
      const mouseCanvasY = (e.clientY - containerRect.top - pan.y) / zoom;

      const newNode: CanvasNode = {
        id: `node-${Date.now()}`,
        type: 'note',
        title: 'New Canvas Note',
        subtitle: 'Click to edit thought or action item',
        x: Math.round(mouseCanvasX - 140),
        y: Math.round(mouseCanvasY - 40),
        width: 280,
        tags: ['canvas', 'note'],
        pillar: 'mental'
      };

      setCanvases(prev => prev.map(c => {
        if (c.id !== activeCanvasId) return c;
        return {
          ...c,
          nodesCount: c.nodes.length + 1,
          nodes: [...c.nodes, newNode]
        };
      }));
      setActiveTool('pointer');
    }
  };

  // Delete node
  const handleDeleteNode = (nodeId: string) => {
    setCanvases(prev => prev.map(c => {
      if (c.id !== activeCanvasId) return c;
      return {
        ...c,
        nodesCount: Math.max(c.nodes.length - 1, 0),
        nodes: c.nodes.filter(n => n.id !== nodeId),
        edges: c.edges.filter(e => e.from !== nodeId && e.to !== nodeId)
      };
    }));
  };

  // Add Item from Life OS Library
  const handleAddItemToCanvas = (item: Item) => {
    const containerRect = canvasRef.current?.getBoundingClientRect();
    const centerX = containerRect ? (containerRect.width / 2 - pan.x) / zoom : 200;
    const centerY = containerRect ? (containerRect.height / 2 - pan.y) / zoom : 150;

    const newNode: CanvasNode = {
      id: `canvas-item-${item.id}-${Date.now()}`,
      type: (item.type === 'task' || item.type === 'note' || item.type === 'knowledge' || item.type === 'project' || item.type === 'goal') 
        ? (item.type as any) 
        : 'note',
      title: item.title,
      subtitle: item.body ? (item.body.length > 90 ? item.body.substring(0, 90) + '...' : item.body) : `Pillar: ${item.pillar || 'General'}`,
      body: item.body,
      x: Math.round(centerX - 140 + (Math.random() * 40 - 20)),
      y: Math.round(centerY - 50 + (Math.random() * 40 - 20)),
      width: 285,
      tags: item.tags || [item.type],
      pillar: item.pillar,
      priority: item.priority,
      status: item.status,
      itemId: item.id
    };

    setCanvases(prev => prev.map(c => {
      if (c.id !== activeCanvasId) return c;
      return {
        ...c,
        nodesCount: c.nodes.length + 1,
        nodes: [...c.nodes, newNode]
      };
    }));

    setShowLibraryModal(false);
  };

  // Auto-Tidy Layout algorithm (arranges cards in neat grid)
  const handleAutoTidyLayout = () => {
    const cols = Math.min(Math.max(Math.ceil(Math.sqrt(activeCanvas.nodes.length)), 2), 3);
    const spacingX = 330;
    const spacingY = 170;
    const startX = 60;
    const startY = 70;

    setCanvases(prev => prev.map(c => {
      if (c.id !== activeCanvasId) return c;
      return {
        ...c,
        nodes: c.nodes.map((n, idx) => ({
          ...n,
          x: startX + (idx % cols) * spacingX,
          y: startY + Math.floor(idx / cols) * spacingY
        }))
      };
    }));

    handleFitCanvas();
  };

  // Auto-Link Related cards (connects cards sharing pillar or tags)
  const handleAutoLinkRelated = () => {
    const nodes = activeCanvas.nodes;
    const newEdges: CanvasEdge[] = [...activeCanvas.edges];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const samePillar = a.pillar && b.pillar && a.pillar === b.pillar;
        const matchingTag = a.tags && b.tags && a.tags.some(t => b.tags?.includes(t));

        if (samePillar || matchingTag) {
          const exists = newEdges.some(e => (e.from === a.id && e.to === b.id) || (e.from === b.id && e.to === a.id));
          if (!exists) {
            newEdges.push({
              id: `edge-auto-${Date.now()}-${i}-${j}`,
              from: a.id,
              to: b.id,
              label: matchingTag ? 'Shared Tag' : 'Pillar'
            });
          }
        }
      }
    }

    setCanvases(prev => prev.map(c => {
      if (c.id !== activeCanvasId) return c;
      return { ...c, edges: newEdges };
    }));
  };

  // Export Canvas Synthesis as a Real Life OS Note
  const handleExportAsNote = async () => {
    const markdownContent = `# ${activeCanvas.title}\n\n` +
      `*Exported from AISANKALP Canvas & Graph on ${new Date().toLocaleDateString()}*\n\n` +
      `## Overview\n${activeCanvas.docContent.summary || 'Spatial canvas breakdown'}\n\n` +
      `> "${activeCanvas.docContent.quote}"\n\n` +
      `## Cards on this Board (${activeCanvas.nodes.length})\n` +
      activeCanvas.nodes.map(n => `- **[${n.type.toUpperCase()}]** ${n.title}\n  *${n.subtitle}*`).join('\n') +
      `\n\n## Connections (${activeCanvas.edges.length})\n` +
      activeCanvas.edges.map(e => {
        const from = activeCanvas.nodes.find(n => n.id === e.from)?.title || e.from;
        const to = activeCanvas.nodes.find(n => n.id === e.to)?.title || e.to;
        return `- ${from} → ${to} (${e.label || 'Linked'})`;
      }).join('\n');

    await addItemToStore({
      title: `${activeCanvas.title} (Canvas Synthesis)`,
      body: markdownContent,
      type: 'note',
      pillar: 'mental',
      tags: ['canvas-export', 'synthesis', 'review']
    });

    alert(`Saved "${activeCanvas.title}" synthesis into your AISANKALP Notes!`);
  };

  // Create New Canvas Board
  const handleCreateNewCanvas = () => {
    if (!newBoardName.trim()) return;
    const newId = `board-${Date.now()}`;
    const newBoard: CanvasBoard = {
      id: newId,
      title: newBoardName.trim(),
      nodesCount: 0,
      updatedAt: 'Just now',
      diagramType: 'wireframe',
      nodes: [
        {
          id: `starter-${Date.now()}`,
          type: 'note',
          title: `${newBoardName.trim()} Hub`,
          subtitle: 'Double click canvas to add cards or click [+ Add Item]',
          x: 100,
          y: 100,
          width: 280,
          tags: ['hub', 'starter'],
          pillar: 'mental'
        }
      ],
      edges: [],
      docTitle: `${newBoardName.trim()} Plan`,
      docContent: {
        summary: `Canvas workspace for ${newBoardName.trim()}.`,
        quote: 'Start with what you know, build connections as clarity develops.',
        bullets: ['Place note cards', 'Link dependencies', 'Synthesize with Copilot'],
        tableRows: [{ day: 'Step 1', route: 'Brainstorm elements', walking: 'Active' }]
      }
    };

    setCanvases(prev => [...prev, newBoard]);
    setActiveCanvasId(newId);
    setNewBoardName('');
    setShowNewBoardModal(false);
  };

  // Send Copilot Query
  const handleSendCopilot = () => {
    if (!chatPrompt.trim()) return;
    const userMsg = chatPrompt;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatPrompt('');
    setIsAiThinking(true);

    setTimeout(() => {
      setIsAiThinking(false);
      const q = userMsg.toLowerCase();
      let reply = '';

      if (q.includes('priority') || q.includes('first') || q.includes('do')) {
        const tasks = activeCanvas.nodes.filter(n => n.type === 'task');
        if (tasks.length > 0) {
          reply = `Top priority execution order: 1) "${tasks[0].title}" (Urgent). Tackle this item first to unblock dependent streams.`;
        } else {
          reply = `This board has no tasks yet. Add high-leverage tasks using the [+ Add Item] button.`;
        }
      } else if (q.includes('summar') || q.includes('overview') || q.includes('plan')) {
        reply = `Board contains ${activeCanvas.nodes.length} cards across ${activeCanvas.edges.length} connections. Core focus: ${activeCanvas.nodes.slice(0, 3).map(n => n.title).join(', ')}.`;
      } else if (q.includes('link') || q.includes('connect')) {
        reply = `Use the Link tool from the left toolbar, click your first card, then click your target card to establish a relationship.`;
      } else {
        reply = `Synthesized "${userMsg}" across your ${activeCanvas.nodes.length} cards. Recommended next action: verify key milestone deliverables and maintain momentum.`;
      }

      setChatMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    }, 600);
  };

  // Connector Bezier line renderer
  const renderEdge = (edge: CanvasEdge) => {
    const fromNode = activeCanvas.nodes.find(n => n.id === edge.from);
    const toNode = activeCanvas.nodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode) return null;

    const fromWidth = fromNode.width || 280;
    const toWidth = toNode.width || 280;
    const fromHeight = 90;

    const x1 = fromNode.x + fromWidth / 2;
    const y1 = fromNode.y + fromHeight;
    const x2 = toNode.x + toWidth / 2;
    const y2 = toNode.y + fromHeight;

    const dx = Math.abs(x2 - x1) * 0.45;
    const dy = Math.abs(y2 - y1) * 0.45;

    const cx1 = x1 + Math.max(dx, 40);
    const cy1 = y1 + Math.min(dy, 50);
    const cx2 = x2 - Math.max(dx, 40);
    const cy2 = y2 - Math.min(dy, 50);

    const pathData = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

    return (
      <g key={edge.id} className="group/edge cursor-pointer" onClick={() => handleDeleteEdge(edge.id)}>
        <path
          d={pathData}
          fill="none"
          stroke="rgba(56, 189, 248, 0.45)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="5 5"
          className="group-hover/edge:stroke-[#38BDF8] group-hover/edge:stroke-[3.5] transition-all"
        />
        <circle cx={x1} cy={y1} r="4" fill="#38BDF8" className="shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
        <circle cx={x2} cy={y2} r="4" fill="#38BDF8" className="shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
      </g>
    );
  };

  // Available library items for modal
  const availableLibraryItems = useMemo(() => {
    let result = items.filter(i => !i.deletedAt && !i.isArchived);
    if (libraryFilter !== 'all') {
      if (libraryFilter === 'task') result = result.filter(i => i.type === 'task');
      else if (libraryFilter === 'note') result = result.filter(i => i.type === 'note' || i.type === 'knowledge' || i.type === 'idea');
      else if (libraryFilter === 'project') result = result.filter(i => i.type === 'project' || i.type === 'goal');
    }
    if (librarySearch.trim()) {
      const q = librarySearch.toLowerCase();
      result = result.filter(i => i.title.toLowerCase().includes(q) || (i.body && i.body.toLowerCase().includes(q)));
    }
    return result;
  }, [items, libraryFilter, librarySearch]);

  return (
    <div className="flex flex-col h-full w-full bg-[#05080C] text-slate-100 select-none overflow-hidden relative font-sans">
      
      {/* 1. TOP COMMAND BAR & FIRST-CLASS VIEW SWITCHER */}
      <div className="h-13 border-b border-[#1E293B] bg-[#080C14]/95 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-30 gap-3">
        
        {/* Left: View Switcher (Canvas / Force Graph / Tree) & Drawer Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center bg-black/60 border border-white/[0.1] rounded-xl p-0.5 shadow-inner">
            <button 
              type="button"
              onClick={() => handleViewChange('canvas')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeView === 'canvas'
                  ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
              title="Infinite 2D Spatial Canvas"
            >
              <Compass size={13} />
              <span>Canvas</span>
            </button>
            <button 
              type="button"
              onClick={() => handleViewChange('graph')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeView === 'graph'
                  ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
              title="Interactive D3 Force Graph"
            >
              <Share2 size={13} />
              <span>Force Graph</span>
            </button>
            <button 
              type="button"
              onClick={() => handleViewChange('tree')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeView === 'tree'
                  ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
              title="Pillar Hierarchy Tree"
            >
              <Layers size={13} />
              <span>Hierarchy Tree</span>
            </button>
          </div>

          <button 
            type="button" 
            onClick={() => setShowDrawer(prev => !prev)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showDrawer ? 'bg-white/[0.08] border-white/[0.15] text-white' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title={activeView === 'canvas' ? "Toggle Boards Drawer" : "Toggle Pillars Navigator"}
          >
            <FolderKanban size={14} />
          </button>
        </div>

        {/* Center: Contextual Tools depending on activeView */}
        <div className="flex-1 flex items-center justify-center gap-2 overflow-x-auto [scrollbar-width:none] px-2 min-w-0">
          {activeView === 'canvas' && (
            <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] max-w-2xl px-2">
              {canvases.map(c => {
                const isActive = c.id === activeCanvasId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setActiveCanvasId(c.id);
                      setLinkSourceNodeId(null);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                      isActive
                        ? 'bg-white/[0.12] text-white font-semibold border-[#38BDF8]/60 shadow-xs'
                        : 'bg-white/[0.02] border-white/[0.05] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                    }`}
                  >
                    <FileText size={12} className={isActive ? 'text-[#38BDF8]' : 'text-slate-400'} />
                    <span className="max-w-[140px] truncate">{c.title}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-slate-400 font-mono">
                      {c.nodes.length}
                    </span>
                  </button>
                );
              })}

              <button 
                type="button"
                onClick={() => setShowNewBoardModal(true)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg border border-dashed border-white/10 shrink-0 cursor-pointer"
                title="Create New Canvas Board"
              >
                <Plus size={13} />
              </button>
            </div>
          )}

          {activeView === 'graph' && (
            <div className="flex items-center gap-2.5 max-w-xl w-full">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs w-full max-w-xs">
                <Search size={13} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Filter graph nodes..."
                  value={graphSearch}
                  onChange={(e) => setGraphSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-white text-xs w-full placeholder:text-slate-500"
                />
                {graphSearch && (
                  <button onClick={() => setGraphSearch('')} className="text-slate-400 hover:text-white cursor-pointer">
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-1 bg-black/40 border border-white/[0.08] rounded-xl p-0.5">
                {(['all', 'task', 'note', 'project'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setGraphTypeFilter(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      graphTypeFilter === t
                        ? 'bg-white/[0.12] text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t === 'all' ? 'All' : `${t}s`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeView === 'tree' && (
            <div className="flex items-center gap-2.5 max-w-xl w-full">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs w-full max-w-xs">
                <Search size={13} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search hierarchy items..."
                  value={treeSearch}
                  onChange={(e) => setTreeSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-white text-xs w-full placeholder:text-slate-500"
                />
                {treeSearch && (
                  <button onClick={() => setTreeSearch('')} className="text-slate-400 hover:text-white cursor-pointer">
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-1 bg-black/40 border border-white/[0.08] rounded-xl p-0.5">
                {(['all', 'task', 'note', 'project'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTreeTypeFilter(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      treeTypeFilter === t
                        ? 'bg-white/[0.12] text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t === 'all' ? 'All' : `${t}s`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          {activeView === 'canvas' && (
            <>
              <button
                type="button"
                onClick={() => setShowLibraryModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/40 text-[#38BDF8] text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                title="Add existing task or note to this canvas"
              >
                <Plus size={13} />
                <span>Add Card</span>
              </button>

              <button
                type="button"
                onClick={handleAutoTidyLayout}
                className="p-1.5 rounded-lg border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Auto-Tidy Layout (Clean non-overlapping grid)"
              >
                <Sliders size={13} />
              </button>

              <button
                type="button"
                onClick={handleFitCanvas}
                className="p-1.5 rounded-lg border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Fit to View"
              >
                <Maximize2 size={13} />
              </button>
            </>
          )}

          {activeView === 'graph' && (
            <>
              {_onNewItem && (
                <button
                  type="button"
                  onClick={() => _onNewItem()}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/40 text-[#38BDF8] text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                  title="Capture New Item"
                >
                  <Plus size={13} />
                  <span>Capture</span>
                </button>
              )}
            </>
          )}

          {activeView === 'tree' && (
            <>
              {_onNewItem && (
                <button
                  type="button"
                  onClick={() => _onNewItem()}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/40 text-[#38BDF8] text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                  title="Capture New Item"
                >
                  <Plus size={13} />
                  <span>Capture</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setExpandAllSignal(prev => prev + 1)}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.06] text-xs cursor-pointer"
                title="Expand All Pillars"
              >
                <ChevronDown size={13} />
                <span>Expand</span>
              </button>

              <button
                type="button"
                onClick={() => setCollapseAllSignal(prev => prev + 1)}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.06] text-xs cursor-pointer"
                title="Collapse All Pillars"
              >
                <ChevronRight size={13} />
                <span>Collapse</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowDocPanel(prev => !prev)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showDocPanel ? 'bg-[#38BDF8]/15 border-[#38BDF8]/40 text-[#38BDF8]' : 'border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Toggle AI Synthesis & Copilot"
          >
            <Columns size={13} />
          </button>
        </div>
      </div>

      {/* 2. THREE-PANEL EXPANDABLE WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* PANEL A: LEFT CANVASES / PILLARS LIBRARY DRAWER */}
        {showDrawer && (
          <aside className="w-64 border-r border-white/[0.08] bg-[#0C101A] flex flex-col shrink-0 z-20 overflow-hidden">
            {activeView === 'canvas' ? (
              <>
                <div className="p-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                    <Search size={13} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search canvases..."
                      value={searchDrawer}
                      onChange={(e) => setSearchDrawer(e.target.value)}
                      className="bg-transparent border-none outline-none text-white text-xs w-full placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Canvases Cards List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {filteredCanvases.map(c => {
                    const isActive = c.id === activeCanvasId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setActiveCanvasId(c.id);
                          setLinkSourceNodeId(null);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer group ${
                          isActive
                            ? 'bg-white/[0.08] border-[#38BDF8]/60 shadow-[0_4px_20px_rgba(56,189,248,0.15)] ring-1 ring-[#38BDF8]/40'
                            : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-[#38BDF8] transition-colors truncate">
                            {c.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {c.nodes.length} cards
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[10.5px] text-slate-400">
                          <span className="capitalize">{c.diagramType || 'board'}</span>
                          <span>•</span>
                          <span>{c.updatedAt}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Drawer Actions */}
                <div className="p-3 border-t border-[#1E293B] bg-[#080C14] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowNewBoardModal(true)}
                    className="flex items-center gap-1.5 text-xs text-[#38BDF8] hover:underline font-semibold cursor-pointer"
                  >
                    <FolderPlus size={13} />
                    <span>New Board</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetToDefaults}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer"
                    title="Reset to default store layout"
                  >
                    <RefreshCw size={11} />
                    <span>Reset</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    5 Life Pillars
                  </span>
                  {selectedPillarFilter && (
                    <button
                      type="button"
                      onClick={() => setSelectedPillarFilter(null)}
                      className="text-[10px] text-[#38BDF8] hover:underline cursor-pointer"
                    >
                      Reset filter
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPillarFilter(null)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedPillarFilter === null
                        ? 'bg-white/[0.08] border-[#38BDF8]/60 text-white font-bold shadow-xs'
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
                      <span className="text-xs">All Pillars</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.06] text-slate-300">
                      {items.filter(i => !i.deletedAt && !i.isArchived).length}
                    </span>
                  </button>

                  {PILLARS.map(p => {
                    const count = items.filter(i => i.pillar === p.id && !i.deletedAt && !i.isArchived).length;
                    const isSelected = selectedPillarFilter === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPillarFilter(isSelected ? null : p.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-white/[0.08] text-white font-bold shadow-xs'
                            : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                        style={{ borderColor: isSelected ? p.color : undefined }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="text-xs font-semibold text-white">{p.name}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.06] text-slate-300">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 border-t border-[#1E293B] bg-[#080C14]">
                  <div className="text-[10.5px] text-slate-400 leading-snug">
                    Filter nodes or tree sections by tapping any core pillar above.
                  </div>
                </div>
              </>
            )}
          </aside>
        )}

        {/* PANEL B: CENTER INFINITE 2D CANVAS */}
        {activeView === 'canvas' && (
        <main 
          ref={canvasRef}
          onMouseDown={handleMouseDownCanvas}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          onDoubleClick={handleDoubleClickCanvas}
          onClick={handleCanvasClick}
          onWheel={handleWheel}
          className={`flex-1 relative overflow-hidden select-none bg-[#05080C] ${
            activeTool === 'pointer' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') :
            activeTool === 'link' ? 'cursor-crosshair' : 'cursor-crosshair'
          }`}
        >
          {/* Subtle Grid Dots */}
          {showGrid && (
            <div 
              className="absolute inset-0 pointer-events-none opacity-25"
              style={{
                backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)',
                backgroundSize: `${32 * zoom}px ${32 * zoom}px`,
                backgroundPosition: `${pan.x}px ${pan.y}px`
              }}
            />
          )}

          {/* Linking Mode Banner */}
          {activeTool === 'link' && (
            <div className="absolute top-4 inset-x-0 mx-auto w-fit z-30 px-4 py-2 rounded-xl bg-[#080C14]/90 border border-[#38BDF8]/50 text-white text-xs shadow-2xl flex items-center gap-2 backdrop-blur-md animate-fade-in">
              <Link2 size={14} className="text-[#38BDF8] animate-pulse" />
              <span>{linkNotification || 'Connecting Mode: Click first card, then click second card.'}</span>
              {linkSourceNodeId && (
                <button 
                  type="button" 
                  onClick={() => setLinkSourceNodeId(null)}
                  className="ml-2 text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          )}

          {/* Floating Left Tools Palette */}
          <div className="absolute left-4 top-4 z-20 flex flex-col gap-1.5 p-1.5 rounded-2xl bg-[#131924]/90 border border-white/[0.1] backdrop-blur-md shadow-2xl">
            {[
              { id: 'pointer', icon: Move, label: 'Move & Pan' },
              { id: 'text', icon: Type, label: 'Drop Note Card (Click canvas)' },
              { id: 'link', icon: Link2, label: 'Connect Cards with Bezier Line' }
            ].map(tool => (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  setActiveTool(tool.id as any);
                  if (tool.id !== 'link') setLinkSourceNodeId(null);
                }}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  activeTool === tool.id
                    ? 'bg-[#38BDF8] text-black shadow-lg font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
                }`}
                title={tool.label}
              >
                <tool.icon size={15} />
              </button>
            ))}

            <div className="w-full h-[1px] bg-white/[0.08] my-0.5" />

            <button
              type="button"
              onClick={() => setShowLibraryModal(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Add SANKALP Item"
            >
              <Plus size={15} />
            </button>
          </div>

          {/* Transformable Canvas Layer */}
          <div
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
              transformOrigin: '0 0',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
          >
            {/* SVG Connector Lines Layer */}
            <svg 
              className="absolute overflow-visible w-full h-full pointer-events-auto" 
              style={{ zIndex: 1 }}
            >
              {activeCanvas.edges.map(edge => renderEdge(edge))}
            </svg>

            {/* Canvas Nodes Layer */}
            <div className="relative w-full h-full" style={{ zIndex: 2 }}>
              {activeCanvas.nodes.map(node => {
                const isDragging = draggingNodeId === node.id;
                const isLinkSource = linkSourceNodeId === node.id;
                const pillarStyle = PILLAR_COLORS[node.pillar || 'mental'] || PILLAR_COLORS.mental;

                return (
                  <div
                    key={node.id}
                    onMouseDown={(e) => handleNodeMouseDown(e, node)}
                    style={{
                      transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
                      width: node.width || 285,
                      position: 'absolute',
                      pointerEvents: 'auto'
                    }}
                    className={`rounded-2xl transition-shadow select-none group/node ${
                      isDragging ? 'cursor-grabbing shadow-[0_16px_40px_rgba(0,0,0,0.8)] ring-2 ring-[#38BDF8]' :
                      isLinkSource ? 'ring-2 ring-[#38BDF8] shadow-[0_0_20px_rgba(56,189,248,0.5)] animate-pulse' :
                      'cursor-grab hover:shadow-2xl'
                    }`}
                  >
                    {/* Glassmorphic Acrylic Card */}
                    <div 
                      className="p-3.5 rounded-xl bg-[#121826]/95 border backdrop-blur-xl shadow-xl transition-all relative overflow-hidden"
                      style={{
                        borderColor: isLinkSource ? '#38BDF8' : 'rgba(255, 255, 255, 0.12)'
                      }}
                    >
                      {/* Left Pillar Accent Bar */}
                      <div 
                        className="absolute left-0 inset-y-0 w-1"
                        style={{ backgroundColor: pillarStyle.accent }}
                      />

                      {/* Card Header & Badges */}
                      <div className="flex items-center justify-between mb-2 pl-1.5">
                        <div className="flex items-center gap-1.5">
                          {node.type === 'task' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-300 border border-orange-500/30">
                              <CheckSquare size={10} />
                              <span>Task</span>
                            </span>
                          ) : node.type === 'goal' || node.type === 'project' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              <Target size={10} />
                              <span>{node.type}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              <FileText size={10} />
                              <span>Note</span>
                            </span>
                          )}

                          {node.pillar && (
                            <span 
                              className="text-[9.5px] px-1.5 py-0.5 rounded font-semibold capitalize"
                              style={{ color: pillarStyle.text, backgroundColor: pillarStyle.bg }}
                            >
                              {node.pillar}
                            </span>
                          )}
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover/node:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTool('link');
                              handleLinkNodeClick(node.id);
                            }}
                            className="p-1 text-slate-400 hover:text-[#38BDF8] rounded cursor-pointer"
                            title="Connect to another card"
                          >
                            <Link2 size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onEditTask) {
                                const realItem = items.find(i => i.id === node.itemId || i.title === node.title);
                                if (realItem) {
                                  onEditTask(realItem);
                                } else {
                                  onEditTask({
                                    id: node.id,
                                    title: node.title,
                                    body: node.body || node.subtitle,
                                    type: node.type as any,
                                    createdAt: Date.now(),
                                    updatedAt: Date.now()
                                  });
                                }
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                            title="Edit Card Details"
                          >
                            <Edit3 size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNode(node.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded cursor-pointer"
                            title="Remove from Canvas"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Card Title */}
                      <h4 className="text-[13px] font-bold text-white tracking-tight leading-snug pl-1.5">
                        {node.title}
                      </h4>

                      {/* Subtitle / Excerpt */}
                      {node.subtitle && (
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed line-clamp-3 pl-1.5">
                          {node.subtitle}
                        </p>
                      )}

                      {/* Tags */}
                      {node.tags && node.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-white/[0.06] pl-1.5">
                          {node.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[9.5px] px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 font-mono">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Floating Status Bar */}
          <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131924]/90 border border-white/[0.08] backdrop-blur-md text-xs text-slate-400 pointer-events-auto shadow-xl">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="font-semibold text-white">{activeCanvas.title}</span>
              <span>•</span>
              <span>{canvasSummary.total} cards</span>
              <span>•</span>
              <span>{canvasSummary.edges} connections</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131924]/90 border border-white/[0.08] backdrop-blur-md text-xs pointer-events-auto shadow-xl">
              <button 
                type="button" 
                onClick={() => setShowGrid(prev => !prev)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                  showGrid ? 'bg-white/[0.1] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                # Grid
              </button>

              <div className="w-[1px] h-3 bg-white/[0.1] mx-1" />

              <button 
                type="button" 
                onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.4))}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>
              <span className="text-[11px] font-mono text-slate-300 min-w-[36px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button 
                type="button" 
                onClick={() => setZoom(prev => Math.min(prev + 0.1, 2.2))}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
            </div>
          </div>
        </main>
        )}

        {/* PANEL B: FORCE GRAPH VIEW */}
        {activeView === 'graph' && (
          <div className="flex-1 relative overflow-hidden bg-[#05080C]">
            <ForceGraphView 
              items={items}
              searchQuery={graphSearch}
              typeFilter={graphTypeFilter}
              selectedPillarFilter={selectedPillarFilter}
              onEditTask={onEditTask}
              showGrid={showGrid}
            />
          </div>
        )}

        {/* PANEL B: HIERARCHY TREE VIEW */}
        {activeView === 'tree' && (
          <div className="flex-1 relative overflow-hidden bg-[#05080C]">
            <HierarchyTreeView 
              items={items}
              searchQuery={treeSearch}
              typeFilter={treeTypeFilter}
              selectedPillarFilter={selectedPillarFilter}
              onEditTask={onEditTask}
              onNewItem={_onNewItem ? () => _onNewItem() : undefined}
              expandAllSignal={expandAllSignal}
              collapseAllSignal={collapseAllSignal}
            />
          </div>
        )}

        {/* PANEL C: RIGHT DOCUMENT & AI COPILOT SYNTHESIS */}
        {showDocPanel && (
          <aside className="w-80 md:w-96 border-l border-[#1E293B] bg-[#080C14] flex flex-col shrink-0 z-20 overflow-hidden">
            
            {/* Header */}
            <div className="p-3.5 border-b border-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-[#38BDF8]" />
                <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                  Canvas Copilot & Synthesis
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowDocPanel(false)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                title="Collapse panel"
              >
                <X size={14} />
              </button>
            </div>

            {/* Smart 1-Click Action Pills */}
            <div className="p-3 border-b border-[#1E293B] bg-[#05080C]/80 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleAutoTidyLayout}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-slate-200 cursor-pointer transition-colors"
                title="Arrange cards neatly"
              >
                <Sliders size={12} className="text-[#38BDF8]" />
                <span>Auto-Tidy</span>
              </button>

              <button
                type="button"
                onClick={handleAutoLinkRelated}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-slate-200 cursor-pointer transition-colors"
                title="Connect related cards"
              >
                <Link2 size={12} className="text-pink-400" />
                <span>Auto-Link</span>
              </button>

              <button
                type="button"
                onClick={handleExportAsNote}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/30 text-xs text-[#38BDF8] font-semibold cursor-pointer transition-colors"
                title="Save as note in My Notes"
              >
                <BookOpen size={12} />
                <span>Save as Note</span>
              </button>
            </div>

            {/* Content & Copilot Chat */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Board Real Summary */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs">{activeCanvas.title}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">{canvasSummary.total} cards</span>
                </div>
                <p className="text-[11.5px] text-slate-300 leading-relaxed">
                  {activeCanvas.docContent.summary || `Active canvas with ${canvasSummary.tasks} tasks and ${canvasSummary.notes} notes.`}
                </p>
                <div className="p-2.5 rounded-lg bg-[#38BDF8]/10 border-l-2 border-[#38BDF8] text-[11px] text-slate-200 italic">
                  &ldquo;{activeCanvas.docContent.quote}&rdquo;
                </div>
              </div>

              {/* Active Cards Breakdown */}
              <div>
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Active Cards ({activeCanvas.nodes.length})
                </h5>
                <div className="space-y-1.5">
                  {activeCanvas.nodes.map(n => (
                    <div 
                      key={n.id}
                      onClick={() => {
                        const realItem = items.find(i => i.id === n.itemId || i.title === n.title);
                        if (realItem && onEditTask) onEditTask(realItem);
                      }}
                      className="p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] flex items-center justify-between cursor-pointer group"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-white font-medium truncate block">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{n.subtitle}</span>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 shrink-0">
                        {n.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="pt-2 border-t border-white/[0.06]">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Copilot Assistance
                </h5>
                <div className="space-y-2">
                  {chatMessages.map((m, idx) => (
                    <div 
                      key={idx}
                      className={`p-2.5 rounded-xl text-[11.5px] leading-relaxed ${
                        m.role === 'user' 
                          ? 'bg-[#38BDF8]/20 border border-[#38BDF8]/30 text-white ml-4' 
                          : 'bg-white/[0.04] border border-white/[0.06] text-slate-200 mr-4'
                      }`}
                    >
                      {m.text}
                    </div>
                  ))}
                  {isAiThinking && (
                    <div className="text-[11px] text-[#38BDF8] animate-pulse flex items-center gap-1.5 p-2">
                      <Sparkles size={12} />
                      <span>Analyzing canvas topology...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Copilot Input */}
            <div className="p-3 border-t border-[#1E293B] bg-[#05080C]">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] focus-within:border-[#38BDF8]/50">
                <input
                  type="text"
                  placeholder="Ask copilot or synthesize..."
                  value={chatPrompt}
                  onChange={(e) => setChatPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendCopilot();
                  }}
                  className="bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-500 w-full"
                />
                
                <button 
                  type="button" 
                  onClick={handleSendCopilot}
                  className="p-1.5 rounded-lg bg-[#38BDF8] text-black hover:bg-[#38BDF8]/90 font-bold cursor-pointer"
                  title="Send"
                >
                  <Send size={11} />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* 3. MODAL: ADD ITEM FROM LIFE OS LIBRARY */}
      {showLibraryModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#131924] border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-[#38BDF8]" />
                <h3 className="text-sm font-bold text-white">Add Item from AISANKALP to Canvas</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLibraryModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Filter pills & search */}
            <div className="p-3 border-b border-white/[0.06] space-y-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                <Search size={14} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter tasks, notes, goals..."
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-500 w-full"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-1.5">
                {(['all', 'task', 'note', 'project'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setLibraryFilter(tab)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-colors ${
                      libraryFilter === tab
                        ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    {tab === 'all' ? 'All Items' : `${tab}s`}
                  </button>
                ))}
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {availableLibraryItems.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No matching items found.
                </div>
              ) : (
                availableLibraryItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleAddItemToCanvas(item)}
                    className="w-full text-left p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.07] border border-white/[0.06] hover:border-[#38BDF8]/40 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          item.type === 'task' ? 'bg-orange-500/20 text-orange-300' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {item.type}
                        </span>
                        <h4 className="text-xs font-bold text-white group-hover:text-[#38BDF8] transition-colors truncate">
                          {item.title}
                        </h4>
                      </div>
                      {item.body && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {item.body}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-[#38BDF8] font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      + Place
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: CREATE NEW BOARD */}
      {showNewBoardModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#131924] border border-white/[0.12] shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Create New Canvas Board</h3>
              <button 
                type="button" 
                onClick={() => setShowNewBoardModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <input
              type="text"
              placeholder="e.g. Q4 Growth Strategy, Health Optimization..."
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateNewCanvas();
              }}
              className="w-full p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#38BDF8]"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewBoardModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewCanvas}
                className="px-4 py-1.5 rounded-lg bg-[#38BDF8] text-black font-bold text-xs hover:bg-[#38BDF8]/90 cursor-pointer shadow-md"
              >
                Create Board
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
