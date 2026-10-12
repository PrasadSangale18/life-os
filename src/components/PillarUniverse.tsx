import { useState } from 'react';
import { Flame, Brain, Heart, Star, TrendingUp } from 'lucide-react';

interface PillarNode {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  x: number;
  y: number;
  floatClass: string;
  Icon: any;
}

const NODES: PillarNode[] = [
  {
    id: 'physical',
    name: 'Physical',
    subtitle: 'The Foundation',
    color: '#10B981',
    x: 240,
    y: 65,
    floatClass: 'node-float-1',
    Icon: Flame
  },
  {
    id: 'mental',
    name: 'Mental',
    subtitle: 'The Operating System',
    color: '#3B82F6',
    x: 380,
    y: 155,
    floatClass: 'node-float-2',
    Icon: Brain
  },
  {
    id: 'financial',
    name: 'Financial',
    subtitle: 'The Amplifier',
    color: '#F59E0B',
    x: 330,
    y: 310,
    floatClass: 'node-float-3',
    Icon: TrendingUp
  },
  {
    id: 'spiritual',
    name: 'Spiritual',
    subtitle: 'The Compass',
    color: '#A855F7',
    x: 150,
    y: 310,
    floatClass: 'node-float-4',
    Icon: Star
  },
  {
    id: 'relational',
    name: 'Relational',
    subtitle: 'The Support Structure',
    color: '#F43F5E',
    x: 100,
    y: 155,
    floatClass: 'node-float-5',
    Icon: Heart
  }
];

// Center core coordinate
const CORE_X = 240;
const CORE_Y = 200;

interface PillarUniverseProps {
  onSelectPillar?: (id: string) => void;
  hoveredPillar?: string | null;
  onHoverPillar?: (id: string | null) => void;
}

export const PillarUniverse = ({ hoveredPillar, onHoverPillar, onSelectPillar }: PillarUniverseProps) => {
  const [activeRipple, setActiveRipple] = useState<string | null>(null);

  const handleNodeClick = (id: string) => {
    setActiveRipple(id);
    setTimeout(() => setActiveRipple(null), 1200);
    if (onSelectPillar) onSelectPillar(id);
  };

  return (
    <div className="universe-stage">
      <svg
        viewBox="0 0 480 400"
        className="universe-svg"
        aria-label="The Life OS Universe constellation"
        role="img"
      >
        <defs>
          {/* Subtle Glow Filters */}
          <filter id="core-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradients */}
          <radialGradient id="center-radial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B9CFF" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#8B9CFF" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#8B9CFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient background aura */}
        <circle cx={CORE_X} cy={CORE_Y} r="140" fill="url(#center-radial)" />

        {/* Outer Constellation Polygon Web (Connecting adjacent pillars) */}
        <path
          d={`M ${NODES[0].x} ${NODES[0].y} L ${NODES[1].x} ${NODES[1].y} L ${NODES[2].x} ${NODES[2].y} L ${NODES[3].x} ${NODES[3].y} L ${NODES[4].x} ${NODES[4].y} Z`}
          fill="rgba(139, 156, 255, 0.015)"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1"
        />

        {/* Internal Harmonic Chord Bridges */}
        <line x1={NODES[0].x} y1={NODES[0].y} x2={NODES[3].x} y2={NODES[3].y} stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.75" strokeDasharray="3 3" />
        <line x1={NODES[0].x} y1={NODES[0].y} x2={NODES[2].x} y2={NODES[2].y} stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.75" strokeDasharray="3 3" />
        <line x1={NODES[1].x} y1={NODES[1].y} x2={NODES[4].x} y2={NODES[4].y} stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.75" strokeDasharray="3 3" />

        {/* Spoke Lines connecting Core to each Node */}
        {NODES.map((node) => {
          const isNodeActive = hoveredPillar === node.id;
          return (
            <g key={`spoke-${node.id}`}>
              {/* Base line */}
              <line
                x1={CORE_X}
                y1={CORE_Y}
                x2={node.x}
                y2={node.y}
                stroke={isNodeActive ? node.color : "rgba(139, 156, 255, 0.16)"}
                strokeWidth={isNodeActive ? 1.8 : 1}
                strokeOpacity={isNodeActive ? 0.9 : 0.5}
                style={{ transition: 'all 0.25s ease' }}
              />

              {/* Animated Light Pulse traveling from Core to Node */}
              <line
                x1={CORE_X}
                y1={CORE_Y}
                x2={node.x}
                y2={node.y}
                stroke={node.color}
                strokeWidth="2"
                strokeLinecap="round"
                className={node.id === 'physical' || node.id === 'financial' ? 'pulse-line' : 'pulse-line-alt'}
                opacity={isNodeActive ? 0.95 : 0.45}
              />
            </g>
          );
        })}

        {/* Central Core Structure */}
        <g className="core-pulse">
          {/* Outer rotating dashed orbit */}
          <circle
            cx={CORE_X}
            cy={CORE_Y}
            r="38"
            fill="none"
            stroke="rgba(139, 156, 255, 0.22)"
            strokeWidth="1"
            strokeDasharray="4 4"
            className="core-ring-spin"
          />

          {/* Core aura circle */}
          <circle
            cx={CORE_X}
            cy={CORE_Y}
            r="24"
            fill="rgba(139, 156, 255, 0.08)"
            stroke="rgba(139, 156, 255, 0.4)"
            strokeWidth="1"
          />

          {/* Central Beacon Point */}
          <circle
            cx={CORE_X}
            cy={CORE_Y}
            r="7"
            fill="#8B9CFF"
            filter="url(#core-glow)"
          />

          {/* Center pinpoint */}
          <circle cx={CORE_X} cy={CORE_Y} r="2.5" fill="#FFFFFF" />

          {/* Ripple effect on click */}
          {activeRipple && (
            <circle
              cx={CORE_X}
              cy={CORE_Y}
              r="48"
              fill="none"
              stroke="#8B9CFF"
              strokeWidth="1.5"
              opacity="0.8"
              style={{ animation: 'core-breathe 0.8s ease-out forwards' }}
            />
          )}
        </g>

        {/* Pillar Nodes */}
        {NODES.map((node) => {
          const isHovered = hoveredPillar === node.id;
          const NodeIcon = node.Icon;

          return (
            <g
              key={node.id}
              className={node.floatClass}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => onHoverPillar && onHoverPillar(node.id)}
              onMouseLeave={() => onHoverPillar && onHoverPillar(null)}
              onClick={() => handleNodeClick(node.id)}
            >
              {/* Outer Glow Halo on hover/active */}
              <circle
                cx={node.x}
                cy={node.y}
                r={isHovered ? 28 : 20}
                fill={node.color}
                opacity={isHovered ? 0.35 : 0.08}
                filter="url(#node-glow)"
                style={{ transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />

              {/* Node Base Disc */}
              <circle
                cx={node.x}
                cy={node.y}
                r={isHovered ? 18 : 15}
                fill="#151A24"
                stroke={node.color}
                strokeWidth={isHovered ? 2 : 1.4}
                style={{ transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />

              {/* Node Center Icon Render */}
              <foreignObject
                x={node.x - 9}
                y={node.y - 9}
                width={18}
                height={18}
                style={{ pointerEvents: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: node.color }}>
                  <NodeIcon size={isHovered ? 13 : 11} strokeWidth={2.2} />
                </div>
              </foreignObject>

              {/* Node Label Pill */}
              <g transform={`translate(${node.x}, ${node.y + (node.y > CORE_Y ? 24 : -24)})`}>
                <rect
                  x="-36"
                  y="-10"
                  width="72"
                  height="18"
                  rx="9"
                  fill="rgba(14, 17, 24, 0.9)"
                  stroke={isHovered ? node.color : "rgba(255, 255, 255, 0.12)"}
                  strokeWidth={isHovered ? 1.2 : 0.8}
                  style={{ transition: 'all 0.2s ease' }}
                />
                <text
                  x="0"
                  y="2.5"
                  textAnchor="middle"
                  fill={isHovered ? "#F4F5F8" : "#A3ACBA"}
                  fontSize="9.5"
                  fontFamily="'Inter', sans-serif"
                  fontWeight={isHovered ? 600 : 500}
                  letterSpacing="-0.01em"
                  style={{ pointerEvents: 'none', transition: 'fill 0.2s ease' }}
                >
                  {node.name}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
