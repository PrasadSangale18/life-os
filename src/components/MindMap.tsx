import { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { PILLARS } from '../theme/tokens';
import type { Item } from '../types';
import { select } from 'd3-selection';
import { zoom as d3zoom } from 'd3-zoom';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import { drag } from 'd3-drag';
import { generateMindMapData } from '../utils/mindMapLogic';

interface MindMapProps {
  onEditTask: (item: Item) => void;
}

export const MindMap = ({ onEditTask }: MindMapProps) => {
  const items = useStore(state => state.items);
  const [view, setView] = useState<'tree' | 'graph'>('tree');
  const showPrivate = useStore(state => state.showPrivate);

  // Filter out trashed and handle privacy
  const validItems = useMemo(() => {
    return items.filter(i => !i.deletedAt && (showPrivate || !i.isPrivate));
  }, [items, showPrivate]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "12px 16px", borderRadius: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setView('tree')} style={{ padding: "6px 12px", background: view === 'tree' ? "rgba(255,255,255,0.1)" : "transparent", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>Tree View</button>
          <button onClick={() => setView('graph')} style={{ padding: "6px 12px", background: view === 'graph' ? "rgba(255,255,255,0.1)" : "transparent", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>Graph View</button>
        </div>
      </div>

      <div style={{ flex: 1, background: "rgba(0,0,0,0.3)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden", position: "relative" }}>
        {view === 'tree' ? <TreeView items={validItems} onEditTask={onEditTask} /> : <GraphView items={validItems} onEditTask={onEditTask} />}
      </div>
    </div>
  );
};

const TreeView = ({ items, onEditTask }: { items: Item[], onEditTask: (i: Item) => void }) => {
  const [expandedPillars, setExpandedPillars] = useState<Record<string, boolean>>({});

  const toggle = (p: string) => setExpandedPillars(prev => ({ ...prev, [p]: !prev[p] }));

  return (
    <div style={{ padding: 20, overflowY: "auto", height: "100%" }}>
      {PILLARS.map(pillar => {
        const pillarItems = items.filter(i => i.pillar === pillar.id);
        if (pillarItems.length === 0) return null;
        
        return (
          <div key={pillar.id} style={{ marginBottom: 12 }}>
            <div onClick={() => toggle(pillar.id)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: pillar.color, fontSize: 16, fontWeight: "bold" }}>
              <span>{expandedPillars[pillar.id] ? "▼" : "▶"}</span> {pillar.name} ({pillarItems.length})
            </div>
            {expandedPillars[pillar.id] && (
              <div style={{ marginLeft: 24, marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                {pillarItems.map(item => (
                  <div key={item.id} onClick={() => onEditTask(item)} style={{ cursor: "pointer", color: "#e0e0f0", fontSize: 14, padding: "4px 8px", borderRadius: 4, display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.02)" }}>
                    <span style={{ color: "#606080", fontSize: 10, border: "1px solid rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: 4 }}>{new Date(item.createdAt).toLocaleDateString()}</span>
                    {item.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};


const GraphView = ({ items, onEditTask }: { items: Item[], onEditTask: (i: Item) => void }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // MindMap logic extracted
    const { nodes, links } = generateMindMapData(items, true); // true because items are pre-filtered by validItems in parent

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    const zoom = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (e) => {
        g.attr("transform", e.transform);
      });

    svg.call(zoom);

    const simulation = forceSimulation(nodes)
      .force("link", forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", forceManyBody().strength(-300))
      .force("center", forceCenter(width / 2, height / 2))
      .force("collide", forceCollide().radius(40));

    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", (d: any) => d.type === 'reference' ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)")
      .attr("stroke-width", (d: any) => d.type === 'hierarchy' ? 2 : 1)
      .attr("stroke-dasharray", (d: any) => d.type === 'reference' ? "4,4" : "none");

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
      });

    node.append("circle")
      .attr("r", (d: any) => d.isRoot ? 24 : d.isPillar ? 16 : 8)
      .attr("fill", (d: any) => d.isRoot ? "#fff" : d.color || "#444")
      .attr("stroke", "rgba(255,255,255,0.2)")
      .attr("stroke-width", 2);

    node.append("text")
      .text((d: any) => d.title)
      .attr("x", 12)
      .attr("y", 4)
      .attr("fill", "#fff")
      .attr("font-size", (d: any) => d.isRoot ? 16 : d.isPillar ? 14 : 10)
      .attr("font-family", "sans-serif");

    // Add Date
    node.filter((d: any) => !d.isRoot && !d.isPillar)
      .append("text")
      .text((d: any) => d.date)
      .attr("x", 12)
      .attr("y", 16)
      .attr("fill", "#606080")
      .attr("font-size", 8);

    // Add Pillar Pill
    node.filter((d: any) => !d.isRoot && !d.isPillar)
      .append("rect")
      .attr("x", 12)
      .attr("y", -20)
      .attr("rx", 4)
      .attr("width", (d: any) => d.pillarName.length * 6)
      .attr("height", 12)
      .attr("fill", (d: any) => d.color);

    node.filter((d: any) => !d.isRoot && !d.isPillar)
      .append("text")
      .text((d: any) => d.pillarName)
      .attr("x", 14)
      .attr("y", -11)
      .attr("fill", "#000")
      .attr("font-size", 8)
      .attr("font-weight", "bold");


    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

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
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [items, onEditTask]);

  return (
    <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />
  );
};
