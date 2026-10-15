import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  X, 
  Check, 
  Share2, 
  Columns, 
  Maximize2, 
  Move, 
  Type, 
  PenTool, 
  Link2, 
  Paperclip, 
  Mic, 
  FileText, 
  Sparkles, 
  Send, 
  Smartphone, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Edit3, 
  Compass, 
  FolderKanban, 
  CheckSquare, 
  Trash2, 
  Database 
} from 'lucide-react';
import { useStore } from '../../store';
import type { Item } from '../../types';

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

/**
 * Builds dynamic Life OS canvases grounded in the user's real database items
 */
const generateLifeOSCanvases = (items: Item[]): CanvasBoard[] => {
  const tasks = items.filter(i => i.type === 'task' && !i.deletedAt && !i.isArchived);
  const notes = items.filter(i => (i.type === 'note' || i.type === 'knowledge' || i.type === 'idea') && !i.deletedAt && !i.isArchived);

  // 1. Board: Strategy & HSE Operations
  const task1 = tasks.find(t => t.priority === 'critical' || t.title.toLowerCase().includes('safety') || t.title.toLowerCase().includes('audit')) || tasks[0] || {
    id: 'strat-node-1',
    type: 'task',
    title: 'Complete HSE Safety Audit Report',
    body: 'Verify all safety equipment, compliance protocols, and site certifications across operations.',
    pillar: 'physical',
    priority: 'critical'
  };

  const task2 = tasks.find(t => t.id !== task1.id && (t.title.toLowerCase().includes('architecture') || t.priority === 'high')) || tasks[1] || {
    id: 'strat-node-2',
    type: 'task',
    title: 'Review System Architecture Draft',
    body: 'Evaluate data ingestion pipeline, resilience layers, and offline Dexie PWA store.',
    pillar: 'mental',
    priority: 'high'
  };

  const note1 = notes[0] || {
    id: 'strat-node-3',
    type: 'knowledge',
    title: 'First Principles of Autonomous Systems',
    body: 'Deconstruct every complex goal into physics and root assumptions. Avoid analogy-based thinking.',
    pillar: 'mental'
  };

  const boardStrategy: CanvasBoard = {
    id: 'strategy-ops',
    title: 'Strategy & Operations',
    nodesCount: 3,
    updatedAt: 'Just now',
    diagramType: 'wireframe',
    nodes: [
      {
        id: 'node-strat-1',
        type: 'task',
        title: task1.title,
        subtitle: task1.body || 'High-leverage critical deliverable',
        body: task1.body,
        x: 60,
        y: 70,
        width: 280,
        tags: (task1.tags && task1.tags.length > 0) ? task1.tags : ['safety', 'operations', 'critical'],
        pillar: task1.pillar || 'physical',
        priority: task1.priority || 'critical',
        itemId: task1.id
      },
      {
        id: 'node-strat-2',
        type: 'task',
        title: task2.title,
        subtitle: task2.body || 'Core technical architecture review',
        body: task2.body,
        x: 400,
        y: 110,
        width: 280,
        tags: (task2.tags && task2.tags.length > 0) ? task2.tags : ['engineering', 'pwa', 'architecture'],
        pillar: task2.pillar || 'mental',
        priority: task2.priority || 'high',
        itemId: task2.id
      },
      {
        id: 'node-strat-3',
        type: 'note',
        title: note1.title,
        subtitle: note1.body || 'Mental model for systems engineering',
        body: note1.body,
        x: 210,
        y: 350,
        width: 290,
        tags: (note1.tags && note1.tags.length > 0) ? note1.tags : ['first-principles', 'strategy'],
        pillar: note1.pillar || 'mental',
        itemId: note1.id
      }
    ],
    edges: [
      { id: 'edge-s1', from: 'node-strat-1', to: 'node-strat-2', label: 'Dependency review' },
      { id: 'edge-s2', from: 'node-strat-2', to: 'node-strat-3', label: 'Root mental axioms' }
    ],
    docTitle: 'Executive Strategy & Operations Plan',
    docContent: {
      summary: 'High-leverage operational alignment linking HSE site audit compliance with system architecture principles and root mental models.',
      quote: 'Simplicity is prerequisite for reliability. Eliminate unnecessary moving parts.',
      bullets: [
        'Phase 1: Complete and sign off on site safety inspection checklist',
        'Phase 2: Review state machine synchronization and offline Dexie database',
        'Phase 3: Synthesize root architectural axioms into company SOP'
      ],
      tableRows: [
        { day: 'Block 1', route: 'HSE Safety Audit Checklist', walking: '45 min' },
        { day: 'Block 2', route: 'System Architecture Review', walking: '60 min' },
        { day: 'Block 3', route: 'First Principles Alignment', walking: '30 min' }
      ]
    }
  };

  // 2. Board: Second Brain & Knowledge Web
  const brainNotes = notes.length > 0 ? notes.slice(0, 4) : [
    { id: 'kb-1', type: 'knowledge', title: 'First Principles Thinking', body: 'Break systems down to fundamental truths.', pillar: 'mental', tags: ['axiom', 'logic'] },
    { id: 'kb-2', type: 'note', title: 'Circadian Energy Architecture', body: 'Match cognitive load to biological chronotype.', pillar: 'physical', tags: ['habits', 'bio'] },
    { id: 'kb-3', type: 'idea', title: 'Local-First Synchronizer', body: 'Client database with background sync outbox.', pillar: 'mental', tags: ['code', 'pwa'] }
  ];

  const boardSecondBrain: CanvasBoard = {
    id: 'second-brain',
    title: 'Second Brain Knowledge Web',
    nodesCount: brainNotes.length,
    updatedAt: 'Today',
    diagramType: 'branching',
    nodes: brainNotes.map((n, idx) => ({
      id: `brain-node-${idx}`,
      type: (n.type === 'knowledge' || n.type === 'note' || n.type === 'idea') ? (n.type as any) : 'note',
      title: n.title,
      subtitle: n.body || 'Knowledge card and associative concepts',
      body: n.body,
      x: idx === 0 ? 80 : idx === 1 ? 420 : 250,
      y: idx === 0 ? 80 : idx === 1 ? 140 : 360,
      width: 275,
      tags: n.tags || ['knowledge', 'notes'],
      pillar: n.pillar || 'mental',
      itemId: n.id
    })),
    edges: brainNotes.length >= 2 ? [
      { id: 'edge-b1', from: 'brain-node-0', to: 'brain-node-1', label: 'Associative link' },
      ...(brainNotes.length >= 3 ? [{ id: 'edge-b2', from: 'brain-node-0', to: 'brain-node-2', label: 'Applied synthesis' }] : [])
    ] : [],
    docTitle: 'Associative Knowledge Synthesis',
    docContent: {
      summary: 'Interconnected mental models and research notes forming your persistent digital second brain.',
      quote: 'Knowledge is not a collection of isolated facts, but a lattice of interrelated mental models.',
      bullets: [
        'Connect first-principles thinking with biological work limits',
        'Cross-reference offline data architecture with privacy principles'
      ],
      tableRows: [
        { day: 'Concept 1', route: 'Root First Principles', walking: 'Foundation' },
        { day: 'Concept 2', route: 'Ultradian Deep Work', walking: 'Execution' }
      ]
    }
  };

  // 3. Board: Sprint & Tactical Execution
  const sprintTasks = tasks.slice(0, 3);
  const boardSprint: CanvasBoard = {
    id: 'sprint-delivery',
    title: 'Sprint & Tactical Roadmap',
    nodesCount: Math.max(sprintTasks.length, 2),
    updatedAt: 'Yesterday',
    diagramType: 'curve',
    nodes: (sprintTasks.length > 0 ? sprintTasks : [task1, task2]).map((t, idx) => ({
      id: `sprint-node-${idx}`,
      type: 'task',
      title: t.title,
      subtitle: t.body || `Pillar: ${t.pillar || 'Core'} | Priority: ${t.priority || 'Normal'}`,
      body: t.body,
      x: idx === 0 ? 70 : idx === 1 ? 410 : 240,
      y: idx === 0 ? 90 : idx === 1 ? 160 : 370,
      width: 280,
      tags: t.tags || ['sprint', 'task'],
      pillar: t.pillar,
      priority: t.priority,
      itemId: t.id
    })),
    edges: [
      { id: 'edge-sp1', from: 'sprint-node-0', to: 'sprint-node-1', label: 'Execution sequence' }
    ],
    docTitle: '14-Day Sprint Execution Brief',
    docContent: {
      summary: 'Active execution pipeline focused on unblocking immediate deliverables and finishing high-impact tasks.',
      quote: 'Action produces information. Momentum solves 80% of perceived obstacles.',
      bullets: [
        'Close out critical audit reports before weekly sprint sign-off',
        'Refine state machine logic and verify full test coverage'
      ],
      tableRows: [
        { day: 'Sprint Day 1', route: 'Safety Audit Protocol', walking: 'High Priority' },
        { day: 'Sprint Day 2', route: 'Architecture Verification', walking: 'Review' }
      ]
    }
  };

  // 4. Board: Freeform Visual Scratchpad
  const boardScratchpad: CanvasBoard = {
    id: 'visual-scratchpad',
    title: 'Visual Scratchpad',
    nodesCount: 2,
    updatedAt: 'Active',
    diagramType: 'tree',
    nodes: [
      {
        id: 'scratch-1',
        type: 'note',
        title: 'Central Ideation Node',
        subtitle: 'Double click or use (T) to place connected thoughts around this hub.',
        body: 'Drag cards to rearrange. Click [+] in the toolbar to pull any real note or task into this workspace.',
        x: 100,
        y: 120,
        width: 280,
        tags: ['brainstorm', 'canvas']
      },
      {
        id: 'scratch-2',
        type: 'record',
        title: 'Voice & Action Notes',
        subtitle: 'Connect thoughts with glowing bezier edges and export prompt.',
        x: 430,
        y: 200,
        width: 270,
        tags: ['audio', 'memo']
      }
    ],
    edges: [
      { id: 'scratch-e1', from: 'scratch-1', to: 'scratch-2', label: 'Sparks idea' }
    ],
    docTitle: 'Open Canvas Ideation & Brainstorming',
    docContent: {
      summary: 'A clean 2D spatial canvas for deconstructing complex systems and mapping non-linear thoughts.',
      quote: 'The mind is for having ideas, not holding them.',
      bullets: [
        'Drop note cards anywhere on the grid',
        'Connect ideas using the Link tool',
        'Import any Life OS task with 1 click'
      ],
      tableRows: [
        { day: 'Step 1', route: 'Capture raw thoughts', walking: 'Divergent' },
        { day: 'Step 2', route: 'Link and cluster cards', walking: 'Convergent' }
      ]
    }
  };

  return [boardStrategy, boardSecondBrain, boardSprint, boardScratchpad];
};

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({ 
  onEditTask, 
  onNewItem: _onNewItem,
  currentView: _currentView = 'canvas',
  onViewChange
}) => {
  const items = useStore(state => state.items);

  // Generate real initial canvases from the user's real store
  const initialCanvases = useMemo(() => generateLifeOSCanvases(items), [items]);

  const [canvases, setCanvases] = useState<CanvasBoard[]>(initialCanvases);
  const [activeCanvasId, setActiveCanvasId] = useState<string>('strategy-ops');
  
  // Layout and Split View Controls
  const [showDrawer, setShowDrawer] = useState<boolean>(true);
  const [showDocPanel, setShowDocPanel] = useState<boolean>(true);
  const [showCompanionPhone, setShowCompanionPhone] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<'pointer' | 'text' | 'draw' | 'link' | 'attachment'>('pointer');
  
  // Canvas Viewport Pan & Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 30, y: 30 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState<boolean>(true);
  
  // Dragging Nodes
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Drawer Search
  const [searchDrawer, setSearchDrawer] = useState<string>('');
  
  // Add item from Life OS library modal
  const [showLibraryModal, setShowLibraryModal] = useState<boolean>(false);
  const [librarySearch, setLibrarySearch] = useState<string>('');
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'task' | 'note' | 'project'>('all');

  // AI Copilot state
  const [copilotOpen, setCopilotOpen] = useState<boolean>(true);
  const [aiActionsExpanded, setAiActionsExpanded] = useState<boolean>(true);
  const [chatPrompt, setChatPrompt] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; time?: string }>>([
    {
      role: 'user',
      text: 'Analyze active canvas cards and synthesize execution roadmap.'
    },
    {
      role: 'assistant',
      text: 'Analyzed cards on this canvas. Identified operational dependencies between safety audit requirements and architectural axioms. All items are synchronized.'
    }
  ]);

  const activeCanvas = useMemo(() => {
    return canvases.find(c => c.id === activeCanvasId) || canvases[0];
  }, [canvases, activeCanvasId]);

  const filteredCanvases = useMemo(() => {
    if (!searchDrawer.trim()) return canvases;
    const q = searchDrawer.toLowerCase();
    return canvases.filter(c => c.title.toLowerCase().includes(q));
  }, [canvases, searchDrawer]);

  // Fit canvas calculation to ensure zero clipping
  const handleFitCanvas = useCallback(() => {
    if (!activeCanvas?.nodes || activeCanvas.nodes.length === 0) {
      setPan({ x: 40, y: 40 });
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

    const contentWidth = Math.max(maxX - minX + 80, 400);
    const contentHeight = Math.max(maxY - minY + 80, 300);

    const fitZoom = Math.min(
      Math.max(Math.min(availableWidth / contentWidth, availableHeight / contentHeight, 1.0), 0.55),
      1.15
    );

    const fitPanX = Math.round((availableWidth - (maxX - minX) * fitZoom) / 2 - minX * fitZoom);
    const fitPanY = Math.round((availableHeight - (maxY - minY) * fitZoom) / 2 - minY * fitZoom);

    setZoom(Number(fitZoom.toFixed(2)));
    setPan({ x: Math.max(fitPanX, 20), y: Math.max(fitPanY, 20) });
  }, [activeCanvas]);

  // Auto-fit on initial render or active canvas switch
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitCanvas();
    }, 100);
    return () => clearTimeout(timer);
  }, [activeCanvasId, handleFitCanvas]);

  // Handle Pan
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

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY * -0.0015;
      setZoom(prev => Math.min(Math.max(prev + zoomDelta, 0.4), 2.5));
    }
  };

  // Create new node on canvas
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
        x: Math.round(mouseCanvasX - 120),
        y: Math.round(mouseCanvasY - 40),
        width: 270,
        tags: ['canvas', 'note']
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

  // Delete node from active canvas
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

  // Add Item from Life OS library to active canvas
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
      subtitle: item.body || (item.pillar ? `Pillar: ${item.pillar}` : 'Life OS Item'),
      body: item.body,
      x: Math.round(centerX - 130 + (Math.random() * 40 - 20)),
      y: Math.round(centerY - 50 + (Math.random() * 40 - 20)),
      width: 280,
      tags: item.tags || [item.type || 'item'],
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

  // Create new canvas board
  const handleCreateNewCanvas = () => {
    const newBoardId = `board-${Date.now()}`;
    const newBoardTitle = `Canvas ${canvases.length + 1}`;
    const newBoard: CanvasBoard = {
      id: newBoardId,
      title: newBoardTitle,
      nodesCount: 1,
      updatedAt: 'Just now',
      diagramType: 'wireframe',
      nodes: [
        {
          id: `node-${Date.now()}`,
          type: 'note',
          title: 'Central Hub',
          subtitle: 'Double click to start brainstorming or drop items from store.',
          x: 100,
          y: 100,
          width: 270,
          tags: ['hub', 'starter']
        }
      ],
      edges: [],
      docTitle: `${newBoardTitle} Notes`,
      docContent: {
        summary: 'New canvas board ready for spatial mapping and second-brain decomposition.',
        quote: 'Start with what you know, branch out to what you want to achieve.',
        bullets: ['Add note cards', 'Link tasks', 'Synthesize with Copilot'],
        tableRows: [{ day: 'Phase 1', route: 'Initial Mapping', walking: 'Active' }]
      }
    };

    setCanvases(prev => [...prev, newBoard]);
    setActiveCanvasId(newBoardId);
  };

  // Send Copilot message
  const handleSendCopilot = () => {
    if (!chatPrompt.trim()) return;
    const userMsg = chatPrompt;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatPrompt('');

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `Analyzed "${userMsg}" against ${activeCanvas.nodes.length} canvas cards. Key insight: Prioritize items on the critical execution path to maintain 80/20 momentum.`
        }
      ]);
    }, 700);
  };

  // Bezier path generator for smooth connector lines
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

    const dx = Math.abs(x2 - x1) * 0.5;
    const dy = Math.abs(y2 - y1) * 0.5;

    const cx1 = x1 + Math.max(dx, 40);
    const cy1 = y1 + Math.min(dy, 60);
    const cx2 = x2 - Math.max(dx, 40);
    const cy2 = y2 - Math.min(dy, 60);

    const pathData = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

    return (
      <g key={edge.id} className="transition-all duration-150">
        <path
          d={pathData}
          fill="none"
          stroke="rgba(56, 189, 248, 0.45)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 4"
        />
        <circle cx={x1} cy={y1} r="4" fill="#38BDF8" className="shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
        <circle cx={x2} cy={y2} r="4" fill="#38BDF8" className="shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
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
    <div className="flex flex-col h-full w-full bg-[#0A0D14] text-slate-100 select-none overflow-hidden relative font-sans">
      
      {/* 1. TOP macOS COMMAND BAR & FIRST-CLASS VIEW SWITCHER */}
      <div className="h-12 border-b border-white/[0.08] bg-[#0E131F]/90 backdrop-blur-md px-3 flex items-center justify-between shrink-0 z-30">
        
        {/* Left: macOS Traffic Lights & Segmented Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 mr-1">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/20" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/20" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/20" />
          </div>

          {/* FIRST-CLASS PROMINENT VIEW SWITCHER: Canvas vs Force Graph vs Hierarchy Tree */}
          <div className="flex items-center bg-black/50 border border-white/[0.1] rounded-xl p-0.5 shadow-inner">
            <button 
              type="button"
              onClick={() => onViewChange?.('canvas')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40 shadow-xs cursor-pointer"
              title="Infinite 2D Spatial Canvas"
            >
              <Compass size={13} />
              <span>Canvas</span>
            </button>
            <button 
              type="button"
              onClick={() => onViewChange?.('graph')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Interactive D3 Force Graph"
            >
              <Share2 size={13} />
              <span>Force Graph</span>
            </button>
            <button 
              type="button"
              onClick={() => onViewChange?.('tree')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Pillar Hierarchy Tree"
            >
              <Layers size={13} />
              <span>Hierarchy Tree</span>
            </button>
          </div>

          {/* History undo/redo & drawer toggle */}
          <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-white/[0.06]">
            <button 
              type="button" 
              onClick={() => setShowDrawer(prev => !prev)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                showDrawer ? 'bg-white/[0.08] border-white/[0.12] text-white' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
              title="Toggle Canvases Library"
            >
              <FolderKanban size={13} />
            </button>
          </div>
        </div>

        {/* Center: Dynamic Tabs for Canvases */}
        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {canvases.slice(0, 4).map(c => {
            const isActive = c.id === activeCanvasId;
            return (
              <div
                key={c.id}
                onClick={() => {
                  setActiveCanvasId(c.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white/[0.1] text-white font-semibold border-b-2 border-[#38BDF8] shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <FileText size={12} className={isActive ? 'text-[#38BDF8]' : 'text-slate-400'} />
                <span>{c.title}</span>
                <span className="text-[10px] px-1 rounded-full bg-black/40 text-slate-400 font-mono">
                  {c.nodes.length}
                </span>
              </div>
            );
          })}

          <button 
            type="button"
            onClick={handleCreateNewCanvas}
            className="p-1 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded cursor-pointer"
            title="Create New Canvas Board"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Right Controls: Add Item, Split View, Phone */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowLibraryModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/40 text-[#38BDF8] text-xs font-semibold cursor-pointer shadow-xs"
            title="Add existing Life OS task or note to canvas"
          >
            <Database size={12} />
            <span className="hidden md:inline">+ Add Life OS Item</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDocPanel(prev => !prev)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showDocPanel ? 'bg-[#38BDF8]/15 border-[#38BDF8]/40 text-[#38BDF8]' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Toggle Document & AI Split View"
          >
            <Columns size={13} />
          </button>

          <button
            type="button"
            onClick={() => setShowCompanionPhone(prev => !prev)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showCompanionPhone ? 'bg-[#FF5A1F]/15 border-[#FF5A1F]/40 text-[#FF5A1F]' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Toggle Mobile Companion Preview"
          >
            <Smartphone size={13} />
          </button>
        </div>
      </div>

      {/* 2. THREE-PANEL EXPANDABLE WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* PANEL A: LEFT CANVASES LIBRARY DRAWER (COLLAPSIBLE) */}
        {showDrawer && (
          <aside className="w-64 border-r border-white/[0.08] bg-[#0C101A] flex flex-col shrink-0 z-20 overflow-hidden">
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

            {/* Canvases Cards Grid */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {filteredCanvases.map(c => {
                const isActive = c.id === activeCanvasId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setActiveCanvasId(c.id);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-white/[0.08] border-[#38BDF8]/60 shadow-[0_4px_20px_rgba(56,189,248,0.15)] ring-1 ring-[#38BDF8]/40'
                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Wireframe Diagram Thumbnail */}
                    <div className="h-14 w-full rounded-lg bg-black/40 border border-white/[0.06] mb-2 flex items-center justify-center p-2 relative overflow-hidden group-hover:border-white/[0.15]">
                      {c.diagramType === 'wireframe' && (
                        <svg className="w-full h-full opacity-60 text-slate-400" viewBox="0 0 100 50">
                          <rect x="5" y="8" width="26" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <rect x="68" y="8" width="26" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <rect x="36" y="28" width="28" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M 31 16 L 36 28 M 68 16 L 64 28" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                        </svg>
                      )}
                      {c.diagramType === 'curve' && (
                        <svg className="w-full h-full opacity-60 text-[#38BDF8]" viewBox="0 0 100 50">
                          <path d="M 10 38 Q 30 10 50 25 T 90 12" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                          <circle cx="10" cy="38" r="3.5" fill="white" />
                          <circle cx="50" cy="25" r="3.5" fill="white" />
                          <circle cx="90" cy="12" r="3.5" fill="white" />
                        </svg>
                      )}
                      {c.diagramType === 'branching' && (
                        <svg className="w-full h-full opacity-60 text-emerald-400" viewBox="0 0 100 50">
                          <circle cx="50" cy="15" r="3" fill="currentColor" />
                          <path d="M 50 15 L 20 35 M 50 15 L 80 35 M 50 15 L 50 40" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <rect x="10" y="32" width="20" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1" />
                          <rect x="40" y="36" width="20" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1" />
                          <rect x="70" y="32" width="20" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1" />
                        </svg>
                      )}
                      {c.diagramType === 'tree' && (
                        <svg className="w-full h-full opacity-60 text-purple-400" viewBox="0 0 100 50">
                          <rect x="35" y="6" width="30" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M 50 18 L 50 28 M 25 28 L 75 28 M 25 28 L 25 36 M 75 28 L 75 36" fill="none" stroke="currentColor" strokeWidth="1" />
                          <rect x="12" y="36" width="26" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
                          <rect x="62" y="36" width="26" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
                        </svg>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-[#38BDF8] transition-colors truncate">
                        {c.title}
                      </span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shadow-[0_0_6px_#38BDF8]" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 text-[10.5px] text-slate-400">
                      <span>{c.nodes.length} nodes</span>
                      <span>•</span>
                      <span>{c.updatedAt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* PANEL B: INFINITE 2D CANVAS VIEWPORT */}
        <main
          ref={canvasRef}
          onMouseDown={handleMouseDownCanvas}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          onWheel={handleWheel}
          onClick={handleCanvasClick}
          className={`flex-1 relative overflow-hidden bg-[#07090E] cursor-${
            activeTool === 'text' ? 'crosshair' : isPanning ? 'grabbing' : 'grab'
          }`}
        >
          {/* Subtle Technical Dotted Grid Background */}
          {showGrid && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
              <defs>
                <pattern id="canvas-dots" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                  <circle cx="2" cy="2" r="1.1" fill="rgba(255, 255, 255, 0.25)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#canvas-dots)" />
            </svg>
          )}

          {/* Floating Vertical Canvas Toolbar (Left of Canvas) */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 p-1 rounded-xl bg-[#131924]/90 border border-white/[0.1] shadow-2xl backdrop-blur-md">
            {[
              { id: 'pointer', icon: Move, label: 'Select & Move' },
              { id: 'text', icon: Type, label: 'Drop Note Card (Click canvas)' },
              { id: 'link', icon: Link2, label: 'Connect Cards' },
              { id: 'draw', icon: PenTool, label: 'Drawing Mode' },
              { id: 'attachment', icon: Paperclip, label: 'Attach Asset' }
            ].map(tool => {
              const Icon = tool.icon;
              const isSelected = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setActiveTool(tool.id as any)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40 shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                  title={tool.label}
                >
                  <Icon size={15} strokeWidth={1.8} />
                </button>
              );
            })}
            <div className="h-[1px] bg-white/[0.08] my-0.5" />
            <button
              type="button"
              onClick={() => setShowLibraryModal(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#38BDF8] hover:bg-[#38BDF8]/20 transition-all cursor-pointer"
              title="Add Item from Life OS"
            >
              <Plus size={15} strokeWidth={2.5} />
            </button>
          </div>

          {/* TRANSFORMED CANVAS VIEWPORT CONTAINER */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none'
            }}
          >
            {/* SVG Connecting Bezier Curves Layer */}
            <svg 
              className="absolute overflow-visible w-full h-full pointer-events-none" 
              style={{ zIndex: 1 }}
            >
              {activeCanvas.edges.map(edge => renderEdge(edge))}
            </svg>

            {/* Canvas Nodes Layer */}
            <div className="relative w-full h-full" style={{ zIndex: 2 }}>
              {activeCanvas.nodes.map(node => {
                const isDragging = draggingNodeId === node.id;
                return (
                  <div
                    key={node.id}
                    onMouseDown={(e) => handleNodeMouseDown(e, node)}
                    style={{
                      transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
                      width: node.width || 280,
                      position: 'absolute',
                      pointerEvents: 'auto'
                    }}
                    className={`rounded-2xl transition-shadow select-none group/node ${
                      isDragging ? 'cursor-grabbing shadow-[0_16px_40px_rgba(0,0,0,0.8)] ring-2 ring-[#38BDF8]' : 'cursor-grab hover:shadow-2xl'
                    }`}
                  >
                    {/* Glassmorphic Acrylic Card Surface */}
                    <div className="p-4 rounded-xl bg-[#141A26]/90 border border-white/[0.12] hover:border-white/[0.25] backdrop-blur-xl shadow-xl transition-all relative overflow-hidden">
                      
                      {/* Top Highlight border */}
                      <div className="absolute inset-x-0 top-0 h-[1px] bg-linear-to-r from-transparent via-white/20 to-transparent" />

                      {/* Card Header & Badge */}
                      <div className="flex items-center justify-between mb-2">
                        {node.type === 'task' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-300 border border-orange-500/30">
                            <CheckSquare size={11} className="text-orange-400" />
                            <span>Task</span>
                          </span>
                        ) : node.type === 'record' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            <Mic size={11} className="text-rose-400 animate-pulse" />
                            <span>Audio Memo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                            <FileText size={11} className="text-slate-400" />
                            <span>Note</span>
                          </span>
                        )}

                        <div className="flex items-center gap-1 opacity-0 group-hover/node:opacity-100 transition-opacity">
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
                            className="p-1 text-slate-400 hover:text-white rounded"
                            title="Edit Card"
                          >
                            <Edit3 size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNode(node.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded"
                            title="Remove from Canvas"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Card Title */}
                      <h4 className="text-[13px] font-bold text-white tracking-tight leading-snug">
                        {node.title}
                      </h4>

                      {/* Subtitle / Descriptive Body */}
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-3">
                        {node.subtitle}
                      </p>

                      {/* Tags */}
                      {node.tags && node.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-white/[0.06]">
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

          {/* Bottom Status Bar Controls - Fully visible above edge */}
          <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            {/* Left Status Indicators */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131924]/90 border border-white/[0.08] backdrop-blur-md text-xs text-slate-400 pointer-events-auto shadow-xl">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                <span>Life OS Canvas</span>
              </span>
              <span className="text-white/20">•</span>
              <button 
                type="button" 
                onClick={() => setShowGrid(prev => !prev)}
                className={`hover:text-white cursor-pointer ${showGrid ? 'text-[#38BDF8]' : ''}`}
              >
                # Grid
              </button>
              <button 
                type="button" 
                onClick={() => setShowLibraryModal(true)}
                className="hover:text-white cursor-pointer text-[#38BDF8]"
              >
                + Add Card
              </button>
            </div>

            {/* Right Zoom & View Controls */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131924]/90 border border-white/[0.08] backdrop-blur-md text-xs text-slate-400 pointer-events-auto shadow-xl">
              <button 
                type="button" 
                onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.4))}
                className="hover:text-white p-0.5 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>
              <span className="font-mono text-[11px] text-slate-300 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button 
                type="button" 
                onClick={() => setZoom(prev => Math.min(prev + 0.1, 2.5))}
                className="hover:text-white p-0.5 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
              <span className="text-white/20">•</span>
              <button 
                type="button" 
                onClick={handleFitCanvas}
                className="hover:text-white cursor-pointer flex items-center gap-1 text-[11.5px] font-semibold text-[#38BDF8]"
                title="Auto-center all nodes without clipping"
              >
                <Maximize2 size={11} />
                <span>Fit canvas</span>
              </button>
            </div>
          </div>
        </main>

        {/* PANEL C: RIGHT AI COPILOT & SPLIT DOCUMENT (COLLAPSIBLE) */}
        {showDocPanel && (
          <aside className="w-96 border-l border-white/[0.08] bg-[#0C101A] flex flex-col shrink-0 z-20 overflow-hidden">
            
            {/* Header: Document Title & Controls */}
            <div className="h-12 border-b border-white/[0.06] px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-xs font-bold text-white tracking-tight truncate max-w-[220px]">
                  {activeCanvas.docTitle} ({activeCanvas.nodes.length})
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  type="button"
                  onClick={() => setCopilotOpen(prev => !prev)}
                  className={`p-1.5 rounded-md text-xs ${copilotOpen ? 'text-[#38BDF8] bg-[#38BDF8]/10' : 'text-slate-400 hover:text-white'}`}
                  title="Toggle AI Actions"
                >
                  <Sparkles size={13} />
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowDocPanel(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded"
                  title="Close Panel"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Main Scrollable Content: AI Copilot Box + Document */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* AI COPILOT CHAT / ACTION LOGS BOX */}
              {copilotOpen && (
                <div className="rounded-xl bg-[#141A26]/80 border border-white/[0.08] p-3.5 space-y-3">
                  
                  {/* User Request Pill */}
                  <div className="flex justify-end">
                    <div className="max-w-[88%] px-3 py-2 rounded-xl bg-white/[0.08] border border-white/[0.06] text-xs text-white leading-relaxed">
                      {chatMessages[0]?.text || "Analyze active canvas cards and synthesize execution roadmap."}
                    </div>
                  </div>

                  {/* System Telemetry Accordion */}
                  <div className="border border-white/[0.06] rounded-lg overflow-hidden bg-black/20">
                    <button
                      type="button"
                      onClick={() => setAiActionsExpanded(prev => !prev)}
                      className="w-full flex items-center justify-between px-3 py-2 text-left text-[11px] text-slate-300 hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-1.5">
                        <Check size={12} className="text-emerald-400" />
                        <span className="font-semibold text-white">Processed</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        1.2s · 4 actions
                      </span>
                    </button>

                    {aiActionsExpanded && (
                      <div className="px-3 pb-2.5 pt-1 border-t border-white/[0.04] space-y-1.5 text-[10.5px] text-slate-400 font-mono">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Check size={10} className="text-emerald-400" />
                          <span>Analyzed {activeCanvas.nodes.length} canvas cards</span>
                        </div>
                        <div className="pl-3.5 text-slate-400">• Store · Verified Life OS dependency chain</div>
                        <div className="pl-3.5 text-slate-400">• Graph · Connected associative edges</div>
                        <div className="pl-3.5 text-slate-400">• Synthesis · Generated executive brief</div>
                      </div>
                    )}
                  </div>

                  {/* Copilot Response Summary */}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {chatMessages[1]?.text}
                  </p>
                </div>
              )}

              {/* DOCUMENT CONTENT PREVIEW */}
              <div className="space-y-4 pt-1">
                <h3 className="text-sm font-extrabold text-white tracking-tight">
                  {activeCanvas.title}
                </h3>
                
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeCanvas.docContent.summary}
                </p>

                {/* Callout Quote */}
                <div className="p-3 rounded-lg bg-[#38BDF8]/10 border-l-2 border-[#38BDF8] text-xs text-slate-200 italic leading-relaxed">
                  "{activeCanvas.docContent.quote}"
                </div>

                {/* Bullet Points */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Execution Milestones
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {activeCanvas.docContent.bullets.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] mt-1.5 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Execution Table */}
                <div className="rounded-lg border border-white/[0.06] overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-white/[0.04] text-slate-400 font-mono uppercase text-[9.5px]">
                      <tr>
                        <th className="py-2 px-2.5 border-b border-white/[0.06]">Block</th>
                        <th className="py-2 px-2.5 border-b border-white/[0.06]">Deliverable</th>
                        <th className="py-2 px-2.5 border-b border-white/[0.06]">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-slate-300">
                      {activeCanvas.docContent.tableRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="py-2 px-2.5 font-bold text-white">{row.day}</td>
                          <td className="py-2 px-2.5 text-slate-300">{row.route}</td>
                          <td className="py-2 px-2.5 font-mono text-slate-400">{row.walking}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Copilot Input Bar */}
            <div className="p-3 border-t border-white/[0.06] bg-[#0E131F]">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] focus-within:border-[#38BDF8]/50">
                <input
                  type="text"
                  placeholder="Ask a question or synthesize cards..."
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#131924] border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-[#38BDF8]" />
                <h3 className="text-sm font-bold text-white">Add Item from Life OS to Canvas</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLibraryModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
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
    </div>
  );
};
