import React, { useState, useRef, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  RotateCcw, 
  RotateCw, 
  X, 
  ChevronDown, 
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
  ExternalLink,
  Edit3,
  Compass,
  FolderKanban
} from 'lucide-react';
import type { Item } from '../../types';

export interface CanvasNode {
  id: string;
  type: 'note' | 'record' | 'link' | 'task';
  title: string;
  subtitle: string;
  body?: string;
  url?: string;
  x: number;
  y: number;
  width?: number;
  color?: string;
  tags?: string[];
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

const INITIAL_CANVASES: CanvasBoard[] = [
  {
    id: 'paris-route',
    title: 'Paris Route',
    nodesCount: 3,
    updatedAt: 'Just now',
    diagramType: 'wireframe',
    nodes: [
      {
        id: 'node-1',
        type: 'note',
        title: 'Seine walking route',
        subtitle: 'Île Saint-Louis → Louvre → Tuileries',
        body: 'Morning walk starting from Île Saint-Louis, passing through Pont Neuf, the Louvre courtyard, and concluding at the Tuileries Garden.',
        x: 260,
        y: 140,
        width: 270,
        tags: ['paris', 'walking', 'morning']
      },
      {
        id: 'node-2',
        type: 'record',
        title: 'Take it slow along the Seine',
        subtitle: 'Keep Saturday morning open for walking and unplanned stops.',
        body: 'Audio memo: "Do not rush the schedule. Sit at a bench near Pont des Arts, watch the river barges, and stop for hot espresso."',
        x: 580,
        y: 300,
        width: 280,
        tags: ['audio', 'memo', 'mindfulness']
      },
      {
        id: 'node-3',
        type: 'link',
        title: "Musée d'Orsay reservation",
        subtitle: 'example.com/paris-orsay',
        url: 'https://musee-orsay.fr/tickets',
        body: 'Reserved for Sunday 10:30 AM. Impressionist galleries on 5th floor first before crowd builds up.',
        x: 320,
        y: 520,
        width: 270,
        tags: ['tickets', 'art', 'reservation']
      }
    ],
    edges: [
      { id: 'edge-1-2', from: 'node-1', to: 'node-2' },
      { id: 'edge-2-3', from: 'node-2', to: 'node-3' }
    ],
    docTitle: 'Weekend in Paris',
    docContent: {
      summary: 'Focus the two days on the Seine, Le Marais, and Montmartre, leaving more time for walks, meals, and spontaneous stops. Full addresses are saved in the route notes.',
      quote: 'Choose one main route each day. If a place feels right, stay a little longer.',
      bullets: [
        'Saturday: the Seine, the Louvre courtyard, Le Marais, and a Paris bistro',
        'Sunday: Montmartre, Musée d\'Orsay, and gifts before departure'
      ],
      tableRows: [
        { day: 'Sat', route: 'Île Saint-Louis → Le Marais', walking: 'About 8 km' },
        { day: 'Sun', route: 'Montmartre → Musée d\'Orsay', walking: 'About 7 km' }
      ]
    }
  },
  {
    id: 'seine-walk',
    title: 'Seine Walk',
    nodesCount: 4,
    updatedAt: 'Today',
    diagramType: 'curve',
    nodes: [
      {
        id: 'sw-1',
        type: 'note',
        title: 'Pont de Sully to Pont Neuf',
        subtitle: 'Historic bridges & architecture line',
        x: 200,
        y: 180,
        width: 260
      },
      {
        id: 'sw-2',
        type: 'record',
        title: 'Bouquinistes riverside stalls',
        subtitle: 'Vintage prints, books, and antique maps.',
        x: 520,
        y: 220,
        width: 270
      },
      {
        id: 'sw-3',
        type: 'note',
        title: 'Sunset viewpoint at Pont des Arts',
        subtitle: 'Arrive by 7:15 PM for golden hour lighting.',
        x: 440,
        y: 440,
        width: 280
      }
    ],
    edges: [
      { id: 'sw-e1', from: 'sw-1', to: 'sw-2' },
      { id: 'sw-e2', from: 'sw-2', to: 'sw-3' }
    ],
    docTitle: 'Seine Riverside Guide',
    docContent: {
      summary: 'An uninterrupted walking tour along the Left and Right banks of the River Seine.',
      quote: 'Paris is best understood on foot, matching the slow speed of the water.',
      bullets: [
        'Inspect antique illustrations at the riverside stalls',
        'Cross Pont Neuf at twilight for reflective water views'
      ],
      tableRows: [
        { day: 'Morning', route: 'Pont de Sully → Île de la Cité', walking: '3.5 km' },
        { day: 'Evening', route: 'Pont des Arts → Tuileries', walking: '2.8 km' }
      ]
    }
  },
  {
    id: 'restaurants-coffee',
    title: 'Restaurants and Coffee',
    nodesCount: 5,
    updatedAt: 'Yesterday',
    diagramType: 'branching',
    nodes: [
      {
        id: 'rc-1',
        type: 'note',
        title: 'Boot Café (Le Marais)',
        subtitle: 'Tiny former shoe repair shop serving Belleville roast.',
        x: 240,
        y: 160,
        width: 280
      },
      {
        id: 'rc-2',
        type: 'link',
        title: 'Bistrot Paul Bert',
        subtitle: 'Classic steak frites & grand Marnier soufflé.',
        url: 'https://bistrotpaulbert.fr',
        x: 560,
        y: 240,
        width: 280
      },
      {
        id: 'rc-3',
        type: 'record',
        title: 'Télescope Espresso bar',
        subtitle: 'Clean pour-overs near Palais-Royal.',
        x: 360,
        y: 450,
        width: 270
      }
    ],
    edges: [
      { id: 'rc-e1', from: 'rc-1', to: 'rc-2' },
      { id: 'rc-e2', from: 'rc-1', to: 'rc-3' }
    ],
    docTitle: 'Gastronomy & Specialty Coffee',
    docContent: {
      summary: 'Hand-picked cafes, patisseries, and neighborhood bistros with authentic local character.',
      quote: 'Never eat in a hurry; dining is half of the Parisian cultural compass.',
      bullets: [
        'Book Paul Bert at least 1 week in advance',
        'Order filter origin roast at Boot Café'
      ],
      tableRows: [
        { day: 'Coffee', route: 'Télescope & Boot Café', walking: '1.2 km' },
        { day: 'Dinner', route: 'Bistrot Paul Bert (11th arr.)', walking: 'Metro 8' }
      ]
    }
  },
  {
    id: 'rainy-day',
    title: 'Rainy-day Alternative',
    nodesCount: 4,
    updatedAt: 'Yesterday',
    diagramType: 'tree',
    nodes: [
      {
        id: 'rd-1',
        type: 'note',
        title: 'Covered Passages (Passages Couverts)',
        subtitle: 'Passage des Panoramas & Galerie Vivienne',
        x: 280,
        y: 160,
        width: 290
      },
      {
        id: 'rd-2',
        type: 'note',
        title: 'Musée de l\'Orangerie Water Lilies',
        subtitle: 'Claude Monet oval galleries under natural skylight',
        x: 580,
        y: 260,
        width: 290
      },
      {
        id: 'rd-3',
        type: 'link',
        title: 'Shakespeare and Company Bookstore',
        subtitle: 'Browse upstairs reading library while it rains outside',
        x: 340,
        y: 470,
        width: 290
      }
    ],
    edges: [
      { id: 'rd-e1', from: 'rd-1', to: 'rd-2' },
      { id: 'rd-e2', from: 'rd-1', to: 'rd-3' }
    ],
    docTitle: 'Rainy Day Exploration',
    docContent: {
      summary: 'Architectural covered arcades, glass-roofed libraries, and quiet museum galleries for rainy afternoons.',
      quote: 'Rain in Paris is an invitation to explore the secret interior labyrinths.',
      bullets: [
        'Wander Galerie Vivienne with its tiled mosaic floors',
        'Spend two hours with Monet\'s Nymphéas murals'
      ],
      tableRows: [
        { day: 'Morning', route: 'Passage des Panoramas', walking: 'Covered' },
        { day: 'Afternoon', route: 'Orangerie & Shakespeare and Co.', walking: 'Metro 1' }
      ]
    }
  }
];

export interface CanvasWorkspaceProps {
  onEditTask?: (task: Item) => void;
  onNewItem?: () => void;
  currentView?: 'canvas' | 'tree' | 'graph';
  onViewChange?: (view: 'canvas' | 'tree' | 'graph') => void;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({ 
  onEditTask, 
  onNewItem: _onNewItem,
  currentView: _currentView = 'canvas',
  onViewChange
}) => {
  const [canvases, setCanvases] = useState<CanvasBoard[]>(INITIAL_CANVASES);
  const [activeCanvasId, setActiveCanvasId] = useState<string>('paris-route');
  const [activeTab, setActiveTab] = useState<string>('Paris Route');
  const [showModeDropdown, setShowModeDropdown] = useState<boolean>(false);
  
  // Layout and Split View Controls
  const [showDrawer, setShowDrawer] = useState<boolean>(true);
  const [showDocPanel, setShowDocPanel] = useState<boolean>(true);
  const [showCompanionPhone, setShowCompanionPhone] = useState<boolean>(true);
  const [activeTool, setActiveTool] = useState<'pointer' | 'text' | 'draw' | 'link' | 'attachment'>('pointer');
  
  // Canvas Viewport Pan & Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState<boolean>(true);
  
  // Dragging Nodes
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Drawer Search
  const [searchDrawer, setSearchDrawer] = useState<string>('');
  
  // AI Copilot state
  const [copilotOpen, setCopilotOpen] = useState<boolean>(true);
  const [aiActionsExpanded, setAiActionsExpanded] = useState<boolean>(true);
  const [chatPrompt, setChatPrompt] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; time?: string }>>([
    {
      role: 'user',
      text: 'Use this material to organize and save a weekend Paris itinerary.'
    },
    {
      role: 'assistant',
      text: 'I read 3 related travel records and reorganized the two-day itinerary. All items are connected and saved.'
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
        width: 260
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
          text: `Processed: "${userMsg}". Linked relevant knowledge cards to your current itinerary canvas.`
        }
      ]);
    }, 800);
  };

  // Fit Canvas
  const handleFitCanvas = () => {
    setPan({ x: 60, y: 40 });
    setZoom(1);
  };

  // Bezier path generator for smooth connector lines
  const renderEdge = (edge: CanvasEdge) => {
    const fromNode = activeCanvas.nodes.find(n => n.id === edge.from);
    const toNode = activeCanvas.nodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode) return null;

    const fromWidth = fromNode.width || 270;
    const toWidth = toNode.width || 270;
    const fromHeight = 90;

    // Anchor points: right edge of fromNode to left edge of toNode (or center)
    const x1 = fromNode.x + fromWidth / 2;
    const y1 = fromNode.y + fromHeight;
    const x2 = toNode.x + toWidth / 2;
    const y2 = toNode.y;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const cx1 = x1 + dx * 0.1;
    const cy1 = y1 + dy * 0.5;
    const cx2 = x2 - dx * 0.1;
    const cy2 = y2 - dy * 0.5;

    const pathData = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

    return (
      <g key={edge.id} className="transition-all duration-150">
        <path
          d={pathData}
          fill="none"
          stroke="rgba(255, 255, 255, 0.28)"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        {/* Source and target connection circular handles */}
        <circle cx={x1} cy={y1} r="3.5" fill="#38BDF8" className="shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
        <circle cx={x2} cy={y2} r="3.5" fill="#38BDF8" className="shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
      </g>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-[#0A0D14] text-slate-100 select-none overflow-hidden relative font-sans">
      
      {/* 1. TOP macOS WINDOW BAR & TABS */}
      <div className="h-11 border-b border-white/[0.08] bg-[#0E131F]/90 backdrop-blur-md px-3 flex items-center justify-between shrink-0 z-30">
        
        {/* Left: macOS Traffic Lights & Canvas Mode Selector */}
        <div className="flex items-center gap-3">
          {/* Traffic light dots */}
          <div className="flex items-center gap-1.5 mr-1">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/20" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/20" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/20" />
          </div>

          {/* Canvas Mode Pill with Dropdown */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowModeDropdown(prev => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              title="Switch Visualizer View"
            >
              <Compass size={13} className="text-[#38BDF8]" />
              <span>Canvas</span>
              <ChevronDown size={11} className="text-slate-400" />
            </button>

            {showModeDropdown && (
              <div className="absolute top-full left-0 mt-1.5 w-44 rounded-xl bg-[#131924] border border-white/[0.12] shadow-2xl p-1 z-50">
                <button
                  type="button"
                  onClick={() => { setShowModeDropdown(false); onViewChange?.('canvas'); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.08] text-[#38BDF8]"
                >
                  <Compass size={13} />
                  <span>Infinite Canvas</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModeDropdown(false); onViewChange?.('graph'); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-white/[0.05]"
                >
                  <Share2 size={13} />
                  <span>Force Graph</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModeDropdown(false); onViewChange?.('tree'); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-white/[0.05]"
                >
                  <Layers size={13} />
                  <span>Hierarchy Tree</span>
                </button>
              </div>
            )}
          </div>

          {/* History undo/redo */}
          <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-white/[0.06]">
            <button type="button" className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.05]" title="Undo">
              <RotateCcw size={12} />
            </button>
            <button type="button" className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.05]" title="Redo">
              <RotateCw size={12} />
            </button>
            <button 
              type="button" 
              onClick={() => setShowDrawer(prev => !prev)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.05]" 
              title="Toggle Canvases Library"
            >
              <FolderKanban size={12} />
            </button>
          </div>
        </div>

        {/* Center: Tabs matching Obsidian / Heptabase */}
        <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none]">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs text-slate-400 hover:text-slate-200 cursor-pointer">
            <FileText size={12} />
            <span>Weekend Itinerary.md</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs text-slate-400 hover:text-slate-200 cursor-pointer">
            <Mic size={12} className="text-rose-400" />
            <span>Seine walk</span>
          </div>

          {/* Active Tab */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs bg-white/[0.08] text-white font-medium border-b-2 border-[#38BDF8] cursor-pointer shadow-xs">
            <Compass size={12} className="text-[#38BDF8]" />
            <span>{activeTab || activeCanvas.title}</span>
            <button 
              type="button" 
              className="ml-1 text-slate-400 hover:text-white"
              onClick={(e) => { e.stopPropagation(); }}
            >
              <X size={10} />
            </button>
          </div>

          <button 
            type="button"
            className="p-1 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded"
            title="New Canvas Tab"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Right: Window controls & Toggle panels */}
        <div className="flex items-center gap-1.5">
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

      {/* 2. MAIN 3-PANEL WORKSPACE CONTAINER */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ================================================================= */}
        {/* PANEL A: LEFT CANVASES DRAWER / LIBRARY                           */}
        {/* ================================================================= */}
        {showDrawer && (
          <aside className="w-64 border-r border-white/[0.08] bg-[#0C101A] flex flex-col shrink-0 z-20">
            {/* Search Input */}
            <div className="p-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-400">
                <Search size={13} />
                <input
                  type="text"
                  placeholder="Search canvases"
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
                      setActiveTab(c.title);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-white/[0.08] border-[#38BDF8]/60 shadow-[0_4px_20px_rgba(56,189,248,0.15)] ring-1 ring-[#38BDF8]/40'
                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Wireframe Diagram Thumbnail */}
                    <div className="h-16 w-full rounded-lg bg-black/40 border border-white/[0.06] mb-2.5 flex items-center justify-center p-2 relative overflow-hidden group-hover:border-white/[0.15]">
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

                    {/* Card Title & Meta */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white tracking-tight truncate">
                        {c.title}
                      </span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      {c.nodesCount} nodes · {c.updatedAt}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Drawer Actions */}
            <div className="p-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
              <button 
                type="button" 
                onClick={() => {
                  const newBoard: CanvasBoard = {
                    id: `canvas-${Date.now()}`,
                    title: `Untitled Canvas ${canvases.length + 1}`,
                    nodesCount: 1,
                    updatedAt: 'Just now',
                    diagramType: 'wireframe',
                    nodes: [
                      {
                        id: `n-${Date.now()}`,
                        type: 'note',
                        title: 'Central Idea',
                        subtitle: 'Primary anchor for this canvas',
                        x: 300,
                        y: 200,
                        width: 260
                      }
                    ],
                    edges: [],
                    docTitle: 'New Canvas Document',
                    docContent: {
                      summary: 'A clean slate for infinite ideation.',
                      quote: 'Map thoughts as they emerge without rigid structure.',
                      bullets: ['First milestone or observation'],
                      tableRows: [{ day: 'Phase 1', route: 'Initial brainstorming', walking: '-' }]
                    }
                  };
                  setCanvases(prev => [newBoard, ...prev]);
                  setActiveCanvasId(newBoard.id);
                }}
                className="flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer"
              >
                <Plus size={13} />
                <span>New Canvas</span>
              </button>
            </div>
          </aside>
        )}

        {/* ================================================================= */}
        {/* PANEL B: INFINITE CANVAS WORKSPACE                                */}
        {/* ================================================================= */}
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
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none opacity-40" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="canvas-dots" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                  <circle cx="2" cy="2" r="1.1" fill="rgba(255, 255, 255, 0.2)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#canvas-dots)" />
            </svg>
          )}

          {/* Floating Vertical Canvas Toolbar (Left of Canvas) */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 p-1 rounded-xl bg-[#131924]/90 border border-white/[0.1] shadow-2xl backdrop-blur-md">
            {[
              { id: 'pointer', icon: Move, label: 'Select & Move' },
              { id: 'text', icon: Type, label: 'Drop Note Card (T)' },
              { id: 'draw', icon: PenTool, label: 'Pen / Draw' },
              { id: 'link', icon: Link2, label: 'Connect Cards' },
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

            {/* Interactive Draggable Canvas Cards Layer */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              {activeCanvas.nodes.map(node => {
                const isDragging = draggingNodeId === node.id;
                return (
                  <div
                    key={node.id}
                    onMouseDown={(e) => handleNodeMouseDown(e, node)}
                    style={{
                      transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
                      width: node.width || 270,
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
                      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                      {/* Card Header & Badge */}
                      <div className="flex items-center justify-between mb-2">
                        {node.type === 'note' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                            <FileText size={11} className="text-slate-400" />
                            <span>Note</span>
                          </span>
                        )}
                        {node.type === 'record' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            <Mic size={11} className="text-rose-400 animate-pulse" />
                            <span>Record</span>
                          </span>
                        )}
                        {node.type === 'link' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30">
                            <Link2 size={11} className="text-sky-400" />
                            <span>Link</span>
                          </span>
                        )}

                        <div className="flex items-center gap-1 opacity-0 group-hover/node:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onEditTask) {
                                onEditTask({
                                  id: node.id,
                                  title: node.title,
                                  body: node.body || node.subtitle,
                                  type: node.type as any,
                                  createdAt: Date.now(),
                                  updatedAt: Date.now()
                                });
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-white rounded"
                            title="Edit Card"
                          >
                            <Edit3 size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Card Title */}
                      <h4 className="text-[13.5px] font-bold text-white tracking-tight leading-snug">
                        {node.title}
                      </h4>

                      {/* Subtitle / Descriptive Body */}
                      <p className="text-[11.5px] text-slate-400 mt-1 leading-relaxed line-clamp-3">
                        {node.subtitle}
                      </p>

                      {/* Optional URL badge */}
                      {node.url && (
                        <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10.5px] text-[#38BDF8]">
                          <span className="truncate">{node.url}</span>
                          <ExternalLink size={10} className="shrink-0 ml-1" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Status Bar Controls matching screenshot */}
          <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            {/* Left Status Indicators */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131924]/90 border border-white/[0.08] backdrop-blur-md text-xs text-slate-400 pointer-events-auto">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                <span>Local workspace</span>
              </span>
              <span className="text-white/20">•</span>
              <button 
                type="button" 
                onClick={() => setShowGrid(prev => !prev)}
                className={`hover:text-white cursor-pointer ${showGrid ? 'text-[#38BDF8]' : ''}`}
              >
                # Grid
              </button>
              <button type="button" className="hover:text-white cursor-pointer">
                Snap
              </button>
              <button type="button" className="hover:text-white cursor-pointer">
                Layout
              </button>
              <button type="button" className="hover:text-white cursor-pointer">
                &lt;/&gt; Import
              </button>
            </div>

            {/* Right Zoom & View Controls */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131924]/90 border border-white/[0.08] backdrop-blur-md text-xs text-slate-400 pointer-events-auto">
              <button 
                type="button" 
                onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.4))}
                className="hover:text-white p-0.5 cursor-pointer"
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
              >
                <ZoomIn size={13} />
              </button>
              <span className="text-white/20">•</span>
              <button 
                type="button" 
                onClick={handleFitCanvas}
                className="hover:text-white cursor-pointer flex items-center gap-1 text-[11.5px]"
              >
                <Maximize2 size={11} />
                <span>Fit canvas</span>
              </button>
            </div>
          </div>
        </main>

        {/* ================================================================= */}
        {/* PANEL C: RIGHT AI COPILOT & SPLIT DOCUMENT (COLLAPSIBLE)          */}
        {/* ================================================================= */}
        {showDocPanel && (
          <aside className="w-96 border-l border-white/[0.08] bg-[#0C101A] flex flex-col shrink-0 z-20 overflow-hidden">
            
            {/* Header: Document Title & Controls */}
            <div className="h-12 border-b border-white/[0.06] px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-xs font-bold text-white tracking-tight">
                  {activeCanvas.docTitle} ({activeCanvas.nodes.length})
                </span>
                <ChevronDown size={12} className="text-slate-400" />
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

            {/* Main Scrollable Content: AI Copilot Box + Markdown Document */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* AI COPILOT CHAT / ACTION LOGS BOX */}
              {copilotOpen && (
                <div className="rounded-xl bg-[#141A26]/80 border border-white/[0.08] p-3.5 space-y-3">
                  
                  {/* User Request Pill */}
                  <div className="flex justify-end">
                    <div className="max-w-[88%] px-3 py-2 rounded-xl bg-white/[0.08] border border-white/[0.06] text-xs text-white leading-relaxed">
                      {chatMessages[0]?.text || "Use this material to organize and save a weekend Paris itinerary."}
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
                        3.7s · 4 actions
                      </span>
                    </button>

                    {aiActionsExpanded && (
                      <div className="px-3 pb-2.5 pt-1 border-t border-white/[0.04] space-y-1.5 text-[10.5px] text-slate-400 font-mono">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Check size={10} className="text-emerald-400" />
                          <span>Found 2 knowledge sources</span>
                        </div>
                        <div className="pl-3.5 text-slate-400">• Records · Read 3 Paris info cards</div>
                        <div className="pl-3.5 text-slate-400">• Canvas · Read weekend itinerary nodes</div>
                        <div className="pl-3.5 text-slate-400">• Notes · Search Paris travel principles</div>
                        <div className="pl-3.5 text-slate-400">• Notes · Write Weekend summary</div>
                      </div>
                    )}
                  </div>

                  {/* Copilot Response Summary */}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {chatMessages[1]?.text}
                  </p>
                </div>
              )}

              {/* INTEGRATED MARKDOWN DOCUMENT PREVIEW */}
              <div className="space-y-3 pt-1">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {activeCanvas.docTitle}
                </h2>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Focus the two days on <strong className="text-white font-semibold">the Seine, Le Marais, and Montmartre</strong>, leaving more time for walks, meals, and spontaneous stops. Full addresses are saved in the <span className="text-[#38BDF8] underline underline-offset-2 cursor-pointer">route notes</span>.
                </p>

                {/* Callout quote box */}
                <blockquote className="p-3 rounded-lg bg-white/[0.03] border-l-2 border-slate-500 text-xs italic text-slate-300 leading-relaxed">
                  &ldquo;{activeCanvas.docContent.quote}&rdquo;
                </blockquote>

                {/* Bullet Points */}
                <div className="space-y-1.5 pt-1">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Itinerary overview
                  </h5>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {activeCanvas.docContent.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-slate-500 mt-1">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Structured Markdown Table */}
                <div className="pt-2">
                  <table className="w-full text-left text-xs border border-white/[0.08] rounded-lg overflow-hidden">
                    <thead className="bg-white/[0.04] text-[10.5px] uppercase font-bold text-slate-400 font-mono">
                      <tr>
                        <th className="py-2 px-2.5 border-b border-white/[0.06]">Day</th>
                        <th className="py-2 px-2.5 border-b border-white/[0.06]">Main route</th>
                        <th className="py-2 px-2.5 border-b border-white/[0.06]">Walking</th>
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
                  placeholder="Ask a question or organize..."
                  value={chatPrompt}
                  onChange={(e) => setChatPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendCopilot();
                  }}
                  className="bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-500 w-full"
                />
                
                <div className="flex items-center gap-1 shrink-0 text-slate-400">
                  <button type="button" className="p-1 hover:text-white" title="Add source">
                    <Plus size={13} />
                  </button>
                  <button type="button" className="p-1 hover:text-white" title="AI Prompts">
                    <Sparkles size={13} />
                  </button>
                  <button type="button" className="p-1 hover:text-white" title="Voice memo">
                    <Mic size={13} />
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSendCopilot}
                    className="p-1.5 rounded-lg bg-[#38BDF8] text-black hover:bg-[#38BDF8]/90 font-bold"
                    title="Send"
                  >
                    <Send size={11} />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* ================================================================= */}
        {/* COMPANION MOBILE PREVIEW (FLOATING OVERLAY MATCHING SCREENSHOT)    */}
        {/* ================================================================= */}
        {showCompanionPhone && (
          <div className="absolute right-6 bottom-6 z-30 hidden xl:flex flex-col w-[300px] h-[520px] rounded-[38px] bg-black border-[5px] border-slate-700/80 shadow-[0_24px_60px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Phone Dynamic Island / Notch */}
            <div className="h-6 w-full flex items-center justify-between px-6 pt-1 text-[10px] text-slate-400 font-mono">
              <span>10:42</span>
              <div className="w-16 h-3 rounded-full bg-black border border-white/10 mx-auto" />
              <div className="flex items-center gap-1">
                <span>5G</span>
                <span className="w-2.5 h-1.5 rounded-xs border border-slate-400 bg-slate-400" />
              </div>
            </div>

            {/* Mobile Header Toolbar */}
            <div className="h-10 px-4 flex items-center justify-between border-b border-white/[0.06] text-slate-400 text-xs">
              <div className="flex items-center gap-3">
                <RotateCcw size={12} />
                <RotateCw size={12} />
              </div>
              <div className="flex items-center gap-2.5">
                <Search size={12} />
                <Layers size={12} />
                <button type="button" onClick={() => setShowCompanionPhone(false)}>
                  <X size={12} className="text-slate-400 hover:text-white" />
                </button>
              </div>
            </div>

            {/* Mobile Document Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 text-left text-white text-xs">
              <h3 className="text-base font-bold text-white tracking-tight">
                {activeCanvas.docTitle}
              </h3>
              
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Focus the two days on <strong className="text-white">the Seine, Le Marais, and Montmartre</strong>, leaving more time for walks, meals, and spontaneous stops. Full addresses are saved in the <span className="text-[#38BDF8] underline">route notes</span>.
              </p>

              <blockquote className="p-2.5 rounded-lg bg-white/[0.04] border-l-2 border-slate-500 text-[10.5px] italic text-slate-300">
                &ldquo;{activeCanvas.docContent.quote}&rdquo;
              </blockquote>

              <div className="pt-1">
                <h6 className="text-[10px] font-bold uppercase text-slate-400">Itinerary overview</h6>
                <ul className="text-[10.5px] text-slate-300 space-y-1 mt-1">
                  {activeCanvas.docContent.bullets.map((b, i) => (
                    <li key={i}>• {b}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-2">
                <table className="w-full text-left text-[10px] border border-white/[0.08] rounded overflow-hidden">
                  <thead className="bg-white/[0.04] text-[9px] uppercase font-bold text-slate-400">
                    <tr>
                      <th className="p-1.5 border-b border-white/[0.06]">Day</th>
                      <th className="p-1.5 border-b border-white/[0.06]">Main route</th>
                      <th className="p-1.5 border-b border-white/[0.06]">Walking</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {activeCanvas.docContent.tableRows.map((r, i) => (
                      <tr key={i}>
                        <td className="p-1.5 font-bold">{r.day}</td>
                        <td className="p-1.5 text-slate-300">{r.route}</td>
                        <td className="p-1.5 font-mono text-slate-400">{r.walking}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Bottom Floating Action Bar */}
            <div className="p-3 border-t border-white/[0.06] bg-[#111622] flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] text-white font-semibold text-[11px]">
                <Edit3 size={11} />
                <span>Write</span>
              </div>
              <Plus size={14} className="hover:text-white cursor-pointer" />
              <PenTool size={13} className="hover:text-white cursor-pointer" />
              <Compass size={14} className="text-[#38BDF8] hover:text-white cursor-pointer" />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
