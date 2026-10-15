import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { PILLARS } from '../theme/tokens';
import type { Item, PillarId } from '../types';
import { select } from 'd3-selection';
import { zoom as d3zoom, zoomIdentity } from 'd3-zoom';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import { drag } from 'd3-drag';
import { generateMindMapData } from '../utils/mindMapLogic';
import { 
  GitBranch, 
  ChevronRight, 
  ChevronDown, 
  Calendar, 
  Flame, 
  Brain, 
  Heart, 
  Star, 
  TrendingUp, 
  Inbox, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Plus, 
  Search, 
  CheckSquare, 
  FileText, 
  Target, 
  Folder, 
  Sparkles
} from 'lucide-react';

import { CanvasWorkspace } from './canvas/CanvasWorkspace';

interface MindMapProps {
  onEditTask: (item: Item) => void;
  onNewItem?: (pillarId?: PillarId) => void;
}

const PILLAR_ICON_MAP: Record<string, React.ElementType> = {
  physical: Flame,
  mental: Brain,
  relational: Heart,
  spiritual: Star,
  financial: TrendingUp,
};

export const MindMap: React.FC<MindMapProps> = ({ onEditTask, onNewItem }) => {
  const items = useStore(state => state.items);
  const showPrivate = useStore(state => state.showPrivate);

  const [view, setView] = useState<'canvas' | 'tree' | 'graph'>('canvas');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'task' | 'note' | 'project' | 'goal'>('all');

  const validItems = useMemo(() => {
    return items.filter(i => !i.deletedAt && !i.isArchived && (showPrivate || !i.isPrivate));
  }, [items, showPrivate]);

  const filteredItems = useMemo(() => {
    let result = validItems;
    if (typeFilter !== 'all') {
      if (typeFilter === 'task') {
        result = result.filter(i => i.type === 'task');
      } else if (typeFilter === 'note') {
        result = result.filter(i => i.type === 'note' || i.type === 'idea' || i.type === 'knowledge' || i.type === 'journal');
      } else if (typeFilter === 'project') {
        result = result.filter(i => i.type === 'project');
      } else if (typeFilter === 'goal') {
        result = result.filter(i => i.type === 'goal');
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.title?.toLowerCase().includes(q) || 
        i.body?.toLowerCase().includes(q) ||
        i.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [validItems, typeFilter, searchQuery]);

  if (view === 'canvas') {
    return (
      <CanvasWorkspace 
        onEditTask={onEditTask} 
        onNewItem={onNewItem ? () => onNewItem() : undefined}
        currentView={view}
        onViewChange={setView}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%", minHeight: 650, padding: 16 }}>
      {/* Top Header & Toolbar Bar */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: "14px 18px", 
          display: "flex", 
          flexWrap: "wrap",
          alignItems: "center", 
          justifyContent: "space-between",
          gap: 12,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: 12
        }}
      >
        {/* Title & Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div 
            style={{ 
              width: 34, 
              height: 34, 
              borderRadius: 8, 
              background: "rgba(59, 130, 246, 0.12)", 
              border: "1px solid rgba(59, 130, 246, 0.25)",
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center" 
            }}
          >
            <GitBranch size={18} color="#3b82f6" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="card-title" style={{ fontSize: 16, fontWeight: 650 }}>Mind Map Topology</span>
              <span 
                className="tabular-nums" 
                style={{ 
                  fontSize: 11, 
                  fontWeight: 600, 
                  padding: "2px 8px", 
                  borderRadius: 12, 
                  background: "var(--bg-surface-elevated)", 
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)"
                }}
              >
                {validItems.length} Nodes • 5 Pillars
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
              Visual second brain, associative wiki-links &amp; hierarchical life structure
            </div>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Quick Search */}
          <div 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 6, 
              background: "var(--bg-base)", 
              border: "1px solid var(--border-default)", 
              borderRadius: 8, 
              padding: "5px 10px" 
            }}
          >
            <Search size={14} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Filter nodes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 12.5,
                color: "var(--text-primary)",
                width: 120
              }}
            />
          </div>

          {/* Type Filter Pills */}
          <div className="segmented-nav" style={{ padding: 2 }}>
            {(['all', 'task', 'note', 'project'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`segmented-nav-btn ${typeFilter === t ? 'active' : ''}`}
                style={{ fontSize: 11.5, padding: "4px 9px", textTransform: "capitalize" }}
              >
                {t === 'all' ? 'All' : `${t}s`}
              </button>
            ))}
          </div>

          {/* Canvas vs Tree vs Graph Toggle */}
          <div className="segmented-nav" style={{ padding: 2 }}>
            <button 
              onClick={() => setView('canvas')} 
              className={`segmented-nav-btn ${(view as string) === 'canvas' ? 'active' : ''}`}
              style={{ fontSize: 12, padding: "5px 12px" }}
            >
              Canvas
            </button>
            <button 
              onClick={() => setView('tree')} 
              className={`segmented-nav-btn ${view === 'tree' ? 'active' : ''}`}
              style={{ fontSize: 12, padding: "5px 12px" }}
            >
              Tree View
            </button>
            <button 
              onClick={() => setView('graph')} 
              className={`segmented-nav-btn ${view === 'graph' ? 'active' : ''}`}
              style={{ fontSize: 12, padding: "5px 12px" }}
            >
              Graph View
            </button>
          </div>

          {/* Quick Add Button */}
          {onNewItem && (
            <button 
              onClick={() => onNewItem()}
              className="btn-primary"
              style={{ padding: "6px 12px", fontSize: 12, gap: 5 }}
            >
              <Plus size={14} />
              <span>Capture</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div 
        className="glass-panel" 
        style={{ 
          flex: 1, 
          background: "var(--bg-surface)", 
          border: "1px solid var(--border-default)",
          borderRadius: 14,
          overflow: "hidden", 
          position: "relative",
          minHeight: 560,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
        }}
      >
        {view === 'tree' ? (
          <TreeView 
            items={filteredItems} 
            totalCount={validItems.length}
            onEditTask={onEditTask} 
            onNewItem={onNewItem}
          />
        ) : (
          <GraphView 
            items={filteredItems} 
            onEditTask={onEditTask} 
          />
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 TREE VIEW                                  */
/* -------------------------------------------------------------------------- */

interface TreeViewProps {
  items: Item[];
  totalCount: number;
  onEditTask: (i: Item) => void;
  onNewItem?: (pillarId?: PillarId) => void;
}

const TreeView: React.FC<TreeViewProps> = ({ items, totalCount, onEditTask, onNewItem }) => {
  const [expandedPillars, setExpandedPillars] = useState<Record<string, boolean>>({
    physical: true,
    mental: true,
    relational: true,
    spiritual: true,
    financial: true,
    unassigned: true,
  });

  const toggle = (id: string) => {
    setExpandedPillars(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    setExpandedPillars({
      physical: true,
      mental: true,
      relational: true,
      spiritual: true,
      financial: true,
      unassigned: true,
    });
  };

  const collapseAll = () => {
    setExpandedPillars({
      physical: false,
      mental: false,
      relational: false,
      spiritual: false,
      financial: false,
      unassigned: false,
    });
  };

  const unassignedItems = useMemo(() => {
    const pillarSet = new Set(PILLARS.map(p => p.id));
    return items.filter(i => !i.pillar || !pillarSet.has(i.pillar));
  }, [items]);

  return (
    <div style={{ padding: "18px 22px", overflowY: "auto", height: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Root Node Bar */}
      <div 
        style={{ 
          padding: "12px 16px", 
          borderRadius: 10, 
          background: "var(--bg-surface-elevated)", 
          border: "1px solid var(--border-default)",
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between" 
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div 
            style={{ 
              width: 26, 
              height: 26, 
              borderRadius: 6, 
              background: "rgba(59, 130, 246, 0.15)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center" 
            }}
          >
            <Sparkles size={14} color="#3b82f6" />
          </div>
          <div>
            <span style={{ fontSize: 13.5, fontWeight: 650, color: "var(--text-primary)" }}>Life OS Core Topology</span>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 8 }}>
              Hierarchy &amp; Pillar Architecture ({totalCount} total items)
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button 
            onClick={expandAll}
            className="btn-ghost" 
            style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, border: "1px solid var(--border-subtle)" }}
          >
            Expand All
          </button>
          <button 
            onClick={collapseAll}
            className="btn-ghost" 
            style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, border: "1px solid var(--border-subtle)" }}
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Pillars Tree Nodes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PILLARS.map(pillar => {
          const pillarItems = items.filter(i => i.pillar === pillar.id);
          const isExpanded = !!expandedPillars[pillar.id];
          const IconComponent = PILLAR_ICON_MAP[pillar.id] || Flame;

          return (
            <div 
              key={pillar.id} 
              style={{ 
                borderRadius: 10,
                border: `1px solid ${isExpanded ? pillar.border : "var(--border-subtle)"}`,
                background: isExpanded ? "var(--bg-surface-elevated)" : "var(--bg-surface)",
                transition: "all 0.18s ease",
                overflow: "hidden"
              }}
            >
              {/* Pillar Header Row */}
              <div 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  cursor: "pointer",
                  userSelect: "none",
                  background: isExpanded ? pillar.bg : "transparent"
                }}
                onClick={() => toggle(pillar.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>

                  <div 
                    style={{ 
                      width: 26, 
                      height: 26, 
                      borderRadius: 6, 
                      background: pillar.bg, 
                      border: `1px solid ${pillar.border}`,
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      color: pillar.color
                    }}
                  >
                    <IconComponent size={14} color={pillar.color} />
                  </div>

                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: pillar.color }}>
                      {pillar.name}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 8, fontWeight: 400 }}>
                      — {pillar.subtitle}
                    </span>
                  </div>

                  <span 
                    className="tabular-nums" 
                    style={{ 
                      fontSize: 11, 
                      padding: "1px 7px", 
                      borderRadius: 10, 
                      background: isExpanded ? "rgba(0,0,0,0.12)" : "var(--bg-surface-elevated)", 
                      color: "var(--text-secondary)",
                      fontWeight: 600
                    }}
                  >
                    {pillarItems.length}
                  </span>
                </div>

                {onNewItem && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewItem(pillar.id as PillarId);
                    }}
                    className="btn-ghost"
                    style={{ 
                      padding: "3px 8px", 
                      fontSize: 11, 
                      borderRadius: 6, 
                      gap: 4, 
                      color: pillar.color,
                      border: `1px solid ${pillar.border}` 
                    }}
                    title={`Add item to ${pillar.name}`}
                  >
                    <Plus size={12} />
                    <span>Add</span>
                  </button>
                )}
              </div>

              {/* Items in Pillar */}
              {isExpanded && (
                <div 
                  style={{ 
                    padding: "8px 14px 14px 44px", 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: 6,
                    borderTop: `1px solid ${pillar.border}`
                  }}
                >
                  {pillarItems.length > 0 ? (
                    pillarItems.map(item => (
                      <TreeItemRow 
                        key={item.id} 
                        item={item} 
                        pillarColor={pillar.color}
                        onClick={() => onEditTask(item)} 
                      />
                    ))
                  ) : (
                    <div 
                      style={{ 
                        padding: "12px 14px", 
                        borderRadius: 8, 
                        border: "1px dashed var(--border-default)", 
                        background: "var(--bg-base)",
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "space-between",
                        color: "var(--text-secondary)",
                        fontSize: 12.5
                      }}
                    >
                      <span>No active items assigned to {pillar.name}.</span>
                      {onNewItem && (
                        <button
                          onClick={() => onNewItem(pillar.id as PillarId)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: pillar.color,
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 4
                          }}
                        >
                          <Plus size={12} />
                          <span>Link new item</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Unassigned / Inbox Section (For general thoughts & notes without explicit pillar) */}
        {unassignedItems.length > 0 && (
          <div 
            style={{ 
              borderRadius: 10,
              border: `1px solid ${expandedPillars.unassigned ? "rgba(148, 163, 184, 0.3)" : "var(--border-subtle)"}`,
              background: expandedPillars.unassigned ? "var(--bg-surface-elevated)" : "var(--bg-surface)",
              transition: "all 0.18s ease",
              overflow: "hidden"
            }}
          >
            <div 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                padding: "10px 14px",
                cursor: "pointer",
                userSelect: "none"
              }}
              onClick={() => toggle('unassigned')}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
                  {expandedPillars.unassigned ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>

                <div 
                  style={{ 
                    width: 26, 
                    height: 26, 
                    borderRadius: 6, 
                    background: "rgba(148, 163, 184, 0.12)", 
                    border: "1px solid rgba(148, 163, 184, 0.25)",
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    color: "var(--text-secondary)"
                  }}
                >
                  <Inbox size={14} />
                </div>

                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                    Inbox &amp; Unassigned Thoughts
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 8 }}>
                    — General notes and captured ideas
                  </span>
                </div>

                <span 
                  className="tabular-nums" 
                  style={{ 
                    fontSize: 11, 
                    padding: "1px 7px", 
                    borderRadius: 10, 
                    background: "var(--bg-surface-elevated)", 
                    color: "var(--text-secondary)",
                    fontWeight: 600
                  }}
                >
                  {unassignedItems.length}
                </span>
              </div>
            </div>

            {expandedPillars.unassigned && (
              <div 
                style={{ 
                  padding: "8px 14px 14px 44px", 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: 6,
                  borderTop: "1px solid var(--border-subtle)"
                }}
              >
                {unassignedItems.map(item => (
                  <TreeItemRow 
                    key={item.id} 
                    item={item} 
                    pillarColor="#94a3b8"
                    onClick={() => onEditTask(item)} 
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* Item row inside Tree view */
const TreeItemRow = ({ item, pillarColor, onClick }: { item: Item; pillarColor: string; onClick: () => void }) => {
  const getItemIcon = () => {
    switch (item.type) {
      case 'task':
        return <CheckSquare size={13} color={item.status === 'done' ? '#10b981' : pillarColor} />;
      case 'project':
        return <Folder size={13} color="#f59e0b" />;
      case 'goal':
        return <Target size={13} color="#ec4899" />;
      case 'idea':
        return <Sparkles size={13} color="#a855f7" />;
      default:
        return <FileText size={13} color="#60a5fa" />;
    }
  };

  return (
    <div 
      onClick={onClick} 
      style={{ 
        cursor: "pointer", 
        fontSize: 13, 
        padding: "7px 12px", 
        borderRadius: 8, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        transition: "all 0.12s ease"
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "var(--border-strong)";
        e.currentTarget.style.background = "var(--bg-surface-hover)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.background = "var(--bg-surface)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {getItemIcon()}
        </div>

        <span 
          style={{ 
            fontWeight: 500, 
            color: "var(--text-primary)",
            textDecoration: item.status === 'done' ? 'line-through' : 'none',
            opacity: item.status === 'done' ? 0.65 : 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {item.title || "Untitled"}
        </span>

        {item.type && item.type !== 'note' && (
          <span 
            className="ui-pill" 
            style={{ 
              fontSize: 9.5, 
              padding: "1px 6px", 
              textTransform: "uppercase",
              background: "var(--bg-surface-elevated)",
              color: "var(--text-secondary)",
              fontWeight: 600
            }}
          >
            {item.type}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {item.tags && item.tags.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {item.tags.slice(0, 2).map(tag => (
              <span 
                key={tag}
                style={{ 
                  fontSize: 10, 
                  padding: "1px 6px", 
                  borderRadius: 4, 
                  background: "var(--bg-base)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)" 
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <span 
          className="tabular-nums" 
          style={{ 
            fontSize: 10.5, 
            color: "var(--text-tertiary)", 
            display: "flex", 
            alignItems: "center", 
            gap: 4 
          }}
        >
          <Calendar size={10} />
          <span>{new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </span>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                GRAPH VIEW                                  */
/* -------------------------------------------------------------------------- */

interface GraphViewProps {
  items: Item[];
  onEditTask: (i: Item) => void;
}

const GraphView: React.FC<GraphViewProps> = ({ items, onEditTask }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomBehaviorRef = useRef<any>(null);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });

  // Update container dimensions on resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 50 && rect.height > 50) {
          setDimensions({ width: Math.round(rect.width), height: Math.round(rect.height) });
        }
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Initialize and run D3 force simulation
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const { nodes, links } = generateMindMapData(items, true);

    const width = dimensions.width;
    const height = dimensions.height;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    // Define SVG patterns and markers
    const defs = svg.append("defs");

    // Grid background pattern
    const pattern = defs.append("pattern")
      .attr("id", "mindmap-grid")
      .attr("width", 32)
      .attr("height", 32)
      .attr("patternUnits", "userSpaceOnUse");

    pattern.append("path")
      .attr("d", "M 32 0 L 0 0 0 32")
      .attr("fill", "none")
      .attr("stroke", "var(--grid-line)")
      .attr("stroke-width", 1);

    // Background rect with grid
    svg.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "url(#mindmap-grid)")
      .style("pointer-events", "all");

    const g = svg.append("g");

    // Zoom setup
    const zoom = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3.5])
      .on("zoom", (e) => {
        g.attr("transform", e.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Center root initially
    const rootNode = nodes.find(n => n.isRoot);
    if (rootNode) {
      rootNode.fx = width / 2;
      rootNode.fy = height / 2;
    }

    // Force Simulation
    const simulation = forceSimulation(nodes)
      .force("link", forceLink(links).id((d: any) => d.id).distance((d: any) => d.type === 'reference' ? 120 : 85))
      .force("charge", forceManyBody().strength(-280).distanceMax(500))
      .force("center", forceCenter(width / 2, height / 2))
      .force("collide", forceCollide().radius((d: any) => d.isRoot ? 40 : d.isPillar ? 30 : 22));

    // Links Rendering
    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("class", (d: any) => d.type === 'reference' ? "mindmap-link-reference" : "mindmap-link-hierarchy")
      .attr("stroke-width", (d: any) => d.type === 'hierarchy' ? 1.5 : 1.2);

    // Nodes Rendering
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .attr("cursor", "pointer")
      .call(drag<SVGGElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on("click", (_event, d: any) => {
        if (d.original) onEditTask(d.original);
      })
      .on("mouseenter", (_event, d: any) => {
        setHoveredNode(d);
        // Highlight connected links
        link.classed("mindmap-link-highlighted", (l: any) => l.source.id === d.id || l.target.id === d.id);
      })
      .on("mouseleave", () => {
        setHoveredNode(null);
        link.classed("mindmap-link-highlighted", false);
      });

    // Node outer circle (glow for root & pillars)
    node.filter((d: any) => d.isRoot || d.isPillar)
      .append("circle")
      .attr("r", (d: any) => d.isRoot ? 28 : 20)
      .attr("fill", (d: any) => d.color || "#3b82f6")
      .attr("opacity", 0.16);

    // Node main circle
    node.append("circle")
      .attr("r", (d: any) => d.isRoot ? 20 : d.isPillar ? 14 : 7)
      .attr("fill", (d: any) => d.isRoot ? "var(--accent-primary)" : d.color || "#60a5fa")
      .attr("stroke", "var(--bg-surface)")
      .attr("stroke-width", 2);

    // Node Title Text
    node.append("text")
      .text((d: any) => {
        if (d.isRoot) return "Life OS";
        if (d.isPillar) return d.title;
        return d.title.length > 22 ? d.title.slice(0, 20) + '…' : d.title;
      })
      .attr("class", "mindmap-node-text")
      .attr("x", (d: any) => d.isRoot ? 26 : d.isPillar ? 18 : 11)
      .attr("y", 4)
      .attr("font-size", (d: any) => d.isRoot ? 14 : d.isPillar ? 12 : 11)
      .attr("font-weight", (d: any) => (d.isRoot || d.isPillar) ? 650 : 450);

    // Subtext for Pillar (Count) or Items (Pillar badge)
    node.filter((d: any) => d.isPillar)
      .append("text")
      .text((d: any) => `${d.count || 0} items`)
      .attr("class", "mindmap-node-subtext")
      .attr("x", 18)
      .attr("y", 18)
      .attr("font-size", 9.5);

    // Subtext for item date/status
    node.filter((d: any) => !d.isRoot && !d.isPillar)
      .append("text")
      .text((d: any) => `${d.pillarName || 'General'} • ${d.date || ''}`)
      .attr("class", "mindmap-node-subtext")
      .attr("x", 11)
      .attr("y", 16)
      .attr("font-size", 8.5);

    // Tick update loop
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag handlers
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      if (!d.isRoot) {
        d.fx = null;
        d.fy = null;
      }
    }

    return () => {
      simulation.stop();
    };
  }, [items, dimensions, onEditTask]);

  // Zoom control helpers
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    select(svgRef.current).call(zoomBehaviorRef.current.scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    select(svgRef.current).call(zoomBehaviorRef.current.scaleBy, 0.7);
  };

  const handleResetCenter = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    select(svgRef.current).call(zoomBehaviorRef.current.transform, zoomIdentity);
  };

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative", minHeight: 560 }}>
      {/* SVG Canvas */}
      <svg 
        ref={svgRef} 
        style={{ width: "100%", height: "100%", display: "block" }} 
      />

      {/* Floating Canvas Controls Toolbar */}
      <div 
        style={{ 
          position: "absolute", 
          bottom: 16, 
          right: 16, 
          display: "flex", 
          alignItems: "center", 
          gap: 6,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: 8,
          padding: 4,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          zIndex: 10
        }}
      >
        <button 
          onClick={handleZoomIn}
          className="btn-ghost"
          style={{ width: 30, height: 30, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>
        <button 
          onClick={handleZoomOut}
          className="btn-ghost"
          style={{ width: 30, height: 30, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>
        <button 
          onClick={handleResetCenter}
          className="btn-ghost"
          style={{ width: 30, height: 30, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}
          title="Reset View & Center"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {/* Floating Legend / Guide */}
      <div 
        style={{ 
          position: "absolute", 
          top: 14, 
          left: 16, 
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: 8,
          padding: "6px 12px",
          display: "flex", 
          alignItems: "center", 
          gap: 12,
          fontSize: 11.5,
          color: "var(--text-secondary)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          pointerEvents: "none"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-primary)" }} />
          <span>Life OS Core</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6" }} />
          <span>Pillars</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
          <span>Tasks &amp; Notes</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 14, height: 1.5, background: "#3b82f6", borderBottom: "1px dashed #3b82f6" }} />
          <span>Wiki Links</span>
        </div>
      </div>

      {/* Hover Node Tooltip Card */}
      {hoveredNode && (
        <div 
          style={{ 
            position: "absolute", 
            bottom: 16, 
            left: 16, 
            background: "var(--bg-surface)",
            border: "1px solid var(--border-strong)",
            borderRadius: 8,
            padding: "8px 12px",
            boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
            maxWidth: 280,
            pointerEvents: "none",
            zIndex: 10
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span 
              style={{ 
                width: 7, 
                height: 7, 
                borderRadius: "50%", 
                background: hoveredNode.color || "#3b82f6" 
              }} 
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {hoveredNode.title}
            </span>
          </div>

          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 3 }}>
            {hoveredNode.isRoot ? "Central Root Operating System" : 
             hoveredNode.isPillar ? `Pillar (${hoveredNode.count || 0} associated items)` : 
             `${hoveredNode.pillarName || 'General'} • Click to view / edit`}
          </div>
        </div>
      )}
    </div>
  );
};
