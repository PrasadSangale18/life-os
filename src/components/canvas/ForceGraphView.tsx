import React, { useRef, useState, useEffect, useMemo } from 'react';
import { select } from 'd3-selection';
import { zoom as d3zoom, zoomIdentity } from 'd3-zoom';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import { drag } from 'd3-drag';
import { generateMindMapData } from '../../utils/mindMapLogic';
import type { Item } from '../../types';
import { ZoomIn, ZoomOut, RotateCcw, ExternalLink } from 'lucide-react';

interface ForceGraphViewProps {
  items: Item[];
  searchQuery: string;
  typeFilter: 'all' | 'task' | 'note' | 'project';
  selectedPillarFilter?: string | null;
  onEditTask?: (item: Item) => void;
  showGrid?: boolean;
}

export const ForceGraphView: React.FC<ForceGraphViewProps> = ({
  items,
  searchQuery,
  typeFilter,
  selectedPillarFilter,
  onEditTask,
  showGrid = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomBehaviorRef = useRef<any>(null);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 700 });
  const [zoomLevel, setZoomLevel] = useState(1);

  // Filter items based on props
  const filteredItems = useMemo(() => {
    let result = items.filter(i => !i.deletedAt && !i.isArchived);
    if (selectedPillarFilter) {
      result = result.filter(i => i.pillar === selectedPillarFilter);
    }
    if (typeFilter !== 'all') {
      if (typeFilter === 'task') {
        result = result.filter(i => i.type === 'task');
      } else if (typeFilter === 'note') {
        result = result.filter(i => i.type === 'note' || i.type === 'knowledge' || i.type === 'idea');
      } else if (typeFilter === 'project') {
        result = result.filter(i => i.type === 'project' || i.type === 'goal');
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
  }, [items, selectedPillarFilter, typeFilter, searchQuery]);

  // Keep dimensions synced with parent container
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
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Initialize and run D3 force simulation
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const { nodes, links } = generateMindMapData(filteredItems, true);

    const width = dimensions.width;
    const height = dimensions.height;

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    // Grid background pattern
    const pattern = defs.append('pattern')
      .attr('id', 'force-grid-dots')
      .attr('width', 32)
      .attr('height', 32)
      .attr('patternUnits', 'userSpaceOnUse');

    pattern.append('circle')
      .attr('cx', 16)
      .attr('cy', 16)
      .attr('r', 1)
      .attr('fill', 'rgba(255, 255, 255, 0.12)');

    // Background rect
    svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', showGrid ? 'url(#force-grid-dots)' : '#05080C')
      .style('pointer-events', 'all');

    const g = svg.append('g');

    // Zoom setup
    const zoom = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3.5])
      .on('zoom', (e) => {
        g.attr('transform', e.transform);
        setZoomLevel(e.transform.k);
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
      .force('link', forceLink(links).id((d: any) => d.id).distance((d: any) => d.type === 'reference' ? 130 : 95))
      .force('charge', forceManyBody().strength(-360).distanceMax(600))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide().radius((d: any) => d.isRoot ? 46 : d.isPillar ? 34 : 22));

    // Links Rendering
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', (d: any) => d.type === 'reference' ? 'rgba(56, 189, 248, 0.45)' : 'rgba(255, 255, 255, 0.15)')
      .attr('stroke-width', (d: any) => d.type === 'hierarchy' ? 1.5 : 1.2)
      .attr('stroke-dasharray', (d: any) => d.type === 'reference' ? '4 3' : 'none');

    // Nodes Rendering
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('cursor', 'pointer')
      .call(drag<SVGGElement, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (_event, d: any) => {
        if (d.original && onEditTask) {
          onEditTask(d.original);
        }
      })
      .on('mouseenter', (event, d: any) => {
        setHoveredNode(d);
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setTooltipPos({
            x: Math.min(Math.max(event.clientX - rect.left + 14, 20), rect.width - 240),
            y: Math.min(Math.max(event.clientY - rect.top - 20, 20), rect.height - 120)
          });
        }
        link.attr('stroke-opacity', (l: any) => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.2)
            .attr('stroke', (l: any) => (l.source.id === d.id || l.target.id === d.id) ? '#38BDF8' : 'rgba(255,255,255,0.12)')
            .attr('stroke-width', (l: any) => (l.source.id === d.id || l.target.id === d.id) ? 2.2 : 1.2);
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
        setTooltipPos(null);
        link.attr('stroke-opacity', 0.8)
            .attr('stroke', (d: any) => d.type === 'reference' ? 'rgba(56, 189, 248, 0.45)' : 'rgba(255, 255, 255, 0.15)')
            .attr('stroke-width', (d: any) => d.type === 'hierarchy' ? 1.5 : 1.2);
      });

    // Outer glow ring
    node.filter((d: any) => d.isRoot || d.isPillar)
      .append('circle')
      .attr('r', (d: any) => d.isRoot ? 28 : 20)
      .attr('fill', (d: any) => d.color || '#3b82f6')
      .attr('opacity', 0.2);

    // Node main circle
    node.append('circle')
      .attr('r', (d: any) => d.isRoot ? 18 : d.isPillar ? 13 : 7)
      .attr('fill', (d: any) => d.isRoot ? '#FF5A1F' : d.color || '#38BDF8')
      .attr('stroke', '#05080C')
      .attr('stroke-width', 2);

    // Node Title Text
    node.append('text')
      .text((d: any) => {
        if (d.isRoot) return 'SANKALP';
        if (d.isPillar) return d.title;
        return d.title.length > 20 ? d.title.slice(0, 18) + '…' : d.title;
      })
      .attr('x', (d: any) => d.isRoot ? 24 : d.isPillar ? 18 : 11)
      .attr('y', 4)
      .attr('font-size', (d: any) => d.isRoot ? 13 : d.isPillar ? 11.5 : 10.5)
      .attr('font-weight', (d: any) => (d.isRoot || d.isPillar) ? 700 : 500)
      .attr('fill', (d: any) => (d.isRoot || d.isPillar) ? '#FFFFFF' : '#CBD5E1')
      .attr('pointer-events', 'none');

    // Subtext for Pillar count
    node.filter((d: any) => d.isPillar)
      .append('text')
      .text((d: any) => `${d.count || 0} items`)
      .attr('x', 18)
      .attr('y', 17)
      .attr('font-size', 9)
      .attr('fill', '#94A3B8')
      .attr('pointer-events', 'none');

    // Tick update loop
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
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
  }, [filteredItems, dimensions, showGrid, onEditTask]);

  // Zoom controls
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    select(svgRef.current).call(zoomBehaviorRef.current.scaleBy, 1.25);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    select(svgRef.current).call(zoomBehaviorRef.current.scaleBy, 0.8);
  };

  const handleResetCenter = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    select(svgRef.current).call(zoomBehaviorRef.current.transform, zoomIdentity);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden select-none bg-[#05080C]">
      {/* SVG Container */}
      <svg ref={svgRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Floating Node Tooltip */}
      {hoveredNode && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none p-3 rounded-xl bg-[#0C121D]/95 border border-[#38BDF8]/40 shadow-2xl backdrop-blur-md text-white max-w-xs animate-fade-in"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: hoveredNode.color || '#38BDF8' }}
            />
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
              {hoveredNode.isRoot ? 'System Core' : hoveredNode.isPillar ? 'Life Pillar' : (hoveredNode.itemType || 'Item')}
            </span>
            {hoveredNode.pillarName && !hoveredNode.isPillar && !hoveredNode.isRoot && (
              <span className="text-[10px] text-slate-400">
                • {hoveredNode.pillarName}
              </span>
            )}
          </div>
          <div className="text-xs font-bold text-slate-100 leading-snug">
            {hoveredNode.title}
          </div>
          {hoveredNode.original && (
            <div className="mt-1.5 flex items-center gap-1 text-[10.5px] text-[#38BDF8] font-medium">
              <ExternalLink size={11} />
              <span>Click to view & edit details</span>
            </div>
          )}
        </div>
      )}

      {/* Floating Mini-Legend Bar (Bottom Left) */}
      <div className="absolute bottom-3 left-4 z-20 flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#11161D]/90 border border-white/[0.08] backdrop-blur-md text-[11px] text-slate-400 shadow-xl pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#FF5A1F]" />
          <span className="text-slate-300 font-medium">SANKALP Core</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
          <span className="text-slate-300 font-medium">5 Pillars</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span className="text-slate-300 font-medium">Tasks &amp; Notes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t border-dashed border-[#38BDF8]" />
          <span className="text-slate-300 font-medium">Wiki-Links</span>
        </div>
      </div>

      {/* Floating Bottom-Right Zoom Dock */}
      <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#11161D]/90 border border-white/[0.08] backdrop-blur-md text-xs shadow-xl pointer-events-auto">
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/[0.08] transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={13} />
        </button>
        <span className="text-[11px] font-mono text-slate-300 min-w-[34px] text-center">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/[0.08] transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={13} />
        </button>
        <div className="w-[1px] h-3 bg-white/[0.1] mx-1" />
        <button
          type="button"
          onClick={handleResetCenter}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/[0.08] transition-colors cursor-pointer"
          title="Reset View & Center"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
};
