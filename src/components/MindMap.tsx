import React from 'react';
import type { Item, PillarId } from '../types';
import { CanvasWorkspace } from './canvas/CanvasWorkspace';

export interface MindMapProps {
  onEditTask: (item: Item) => void;
  onNewItem?: (pillarId?: PillarId) => void;
}

/**
 * Unified Canvas & Graph Topology Workspace
 * Houses 2D Spatial Canvas, Interactive D3 Force Graph, and Pillar Hierarchy Tree
 * inside a single obsidian Obsidian-themed command center.
 */
export const MindMap: React.FC<MindMapProps> = ({ onEditTask, onNewItem }) => {
  return (
    <div className="w-full h-full relative overflow-hidden bg-[#05080C]">
      <CanvasWorkspace 
        onEditTask={onEditTask} 
        onNewItem={onNewItem ? () => onNewItem() : undefined} 
      />
    </div>
  );
};

export default MindMap;
