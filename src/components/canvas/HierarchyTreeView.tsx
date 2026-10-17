import React, { useState, useMemo } from 'react';
import { useStore } from '../../store';
import { PILLARS } from '../../theme/tokens';
import type { Item, PillarId } from '../../types';
import { 
  ChevronRight, 
  ChevronDown, 
  Flame, 
  Brain, 
  Heart, 
  Star, 
  TrendingUp, 
  Inbox, 
  FileText, 
  Target, 
  Folder, 
  Sparkles,
  Plus,
  Calendar,
  CheckCircle2,
  Circle
} from 'lucide-react';

interface HierarchyTreeViewProps {
  items: Item[];
  searchQuery: string;
  typeFilter: 'all' | 'task' | 'note' | 'project';
  selectedPillarFilter?: string | null;
  onEditTask?: (item: Item) => void;
  onNewItem?: (pillarId?: PillarId) => void;
  expandAllSignal?: number;
  collapseAllSignal?: number;
}

const PILLAR_ICON_MAP: Record<string, React.ElementType> = {
  physical: Flame,
  mental: Brain,
  relational: Heart,
  spiritual: Star,
  financial: TrendingUp,
};

export const HierarchyTreeView: React.FC<HierarchyTreeViewProps> = ({
  items,
  searchQuery,
  typeFilter,
  selectedPillarFilter,
  onEditTask,
  onNewItem,
  expandAllSignal,
  collapseAllSignal
}) => {
  const updateItem = useStore(state => state.updateItem);

  const [expandedPillars, setExpandedPillars] = useState<Record<string, boolean>>({
    physical: true,
    mental: true,
    relational: true,
    spiritual: true,
    financial: true,
    unassigned: true,
  });

  // Handle external expand/collapse signals
  React.useEffect(() => {
    if (expandAllSignal && expandAllSignal > 0) {
      setExpandedPillars({
        physical: true,
        mental: true,
        relational: true,
        spiritual: true,
        financial: true,
        unassigned: true,
      });
    }
  }, [expandAllSignal]);

  React.useEffect(() => {
    if (collapseAllSignal && collapseAllSignal > 0) {
      setExpandedPillars({
        physical: false,
        mental: false,
        relational: false,
        spiritual: false,
        financial: false,
        unassigned: false,
      });
    }
  }, [collapseAllSignal]);

  const togglePillar = (id: string) => {
    setExpandedPillars(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter items based on active criteria
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

  const unassignedItems = useMemo(() => {
    const pillarSet = new Set(PILLARS.map(p => p.id));
    return filteredItems.filter(i => !i.pillar || !pillarSet.has(i.pillar));
  }, [filteredItems]);

  const handleToggleTaskStatus = (e: React.MouseEvent, item: Item) => {
    e.stopPropagation();
    const newStatus = item.status === 'done' ? 'todo' : 'done';
    updateItem(item.id, { 
      status: newStatus,
      completedAt: newStatus === 'done' ? Date.now() : undefined 
    });
  };

  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-6 bg-[#05080C] select-none font-sans">
      <div className="max-w-5xl mx-auto space-y-4">
        
        {/* 5 Strategic Pillars Cards */}
        {PILLARS.map(pillar => {
          if (selectedPillarFilter && selectedPillarFilter !== pillar.id) return null;

          const pillarItems = filteredItems.filter(i => i.pillar === pillar.id);
          const isExpanded = !!expandedPillars[pillar.id];
          const IconComponent = PILLAR_ICON_MAP[pillar.id] || Flame;
          
          const tasks = pillarItems.filter(i => i.type === 'task');
          const completedTasks = tasks.filter(t => t.status === 'done');
          const taskProgress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 100;

          return (
            <div 
              key={pillar.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isExpanded 
                  ? 'bg-[#11161D] border-[#1E293B] shadow-lg' 
                  : 'bg-[#0D1219] border-white/[0.06] hover:border-white/[0.12]'
              }`}
            >
              {/* Pillar Header Accordion Toggle */}
              <div 
                onClick={() => togglePillar(pillar.id)}
                className="p-3.5 md:p-4 flex items-center justify-between cursor-pointer select-none transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-slate-400">
                    {isExpanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                  </div>

                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{ 
                      backgroundColor: pillar.bg,
                      borderColor: pillar.border,
                      color: pillar.color 
                    }}
                  >
                    <IconComponent size={16} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold tracking-tight" style={{ color: pillar.color }}>
                        {pillar.name}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 font-semibold border border-white/[0.08]">
                        {pillarItems.length}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 hidden sm:block truncate">
                      {pillar.subtitle}
                    </div>
                  </div>
                </div>

                {/* Right Progress & Quick Add */}
                <div className="flex items-center gap-3 shrink-0">
                  {tasks.length > 0 && (
                    <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-16 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${taskProgress}%`,
                            backgroundColor: pillar.color 
                          }}
                        />
                      </div>
                      <span className="font-mono text-[11px]">
                        {completedTasks.length}/{tasks.length}
                      </span>
                    </div>
                  )}

                  {onNewItem && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNewItem(pillar.id as PillarId);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center gap-1 cursor-pointer transition-colors"
                      title={`Add item to ${pillar.name}`}
                    >
                      <Plus size={12} />
                      <span className="hidden sm:inline">Add</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Pillar Expanded Items List */}
              {isExpanded && (
                <div className="border-t border-[#1E293B] bg-[#0A0E15] p-2.5 sm:p-3 space-y-1.5">
                  {pillarItems.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No matching items in {pillar.name}. Click "Add" above to create one.
                    </div>
                  ) : (
                    pillarItems.map(item => {
                      const isTask = item.type === 'task';
                      const isDone = item.status === 'done';

                      return (
                        <div
                          key={item.id}
                          onClick={() => onEditTask?.(item)}
                          className="group flex items-center justify-between p-2.5 rounded-xl border border-white/[0.04] hover:border-white/[0.14] bg-white/[0.015] hover:bg-white/[0.04] transition-all cursor-pointer gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {isTask ? (
                              <button
                                type="button"
                                onClick={(e) => handleToggleTaskStatus(e, item)}
                                className="text-slate-400 hover:text-[#10B981] transition-colors shrink-0 cursor-pointer"
                                title={isDone ? 'Mark as to-do' : 'Mark as completed'}
                              >
                                {isDone ? (
                                  <CheckCircle2 size={16} className="text-[#10B981]" />
                                ) : (
                                  <Circle size={16} className="text-slate-500 hover:text-[#10B981]" />
                                )}
                              </button>
                            ) : (
                              <div className="text-slate-500 shrink-0">
                                {item.type === 'project' ? <Folder size={15} className="text-amber-400" /> :
                                 item.type === 'goal' ? <Target size={15} className="text-purple-400" /> :
                                 item.type === 'idea' ? <Sparkles size={15} className="text-cyan-400" /> :
                                 <FileText size={15} className="text-blue-400" />}
                              </div>
                            )}

                            <span className={`text-xs font-medium truncate ${
                              isDone ? 'line-through text-slate-500' : 'text-slate-200 group-hover:text-white'
                            }`}>
                              {item.title || 'Untitled'}
                            </span>
                          </div>

                          {/* Right Badges & Metadata */}
                          <div className="flex items-center gap-2 shrink-0">
                            {item.priority && item.priority !== 'normal' && (
                              <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider font-mono ${
                                item.priority === 'critical' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                                item.priority === 'high' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' :
                                'bg-slate-500/15 text-slate-400'
                              }`}>
                                {item.priority}
                              </span>
                            )}

                            {item.deadline && (
                              <span className="hidden md:flex items-center gap-1 text-[10.5px] text-slate-400 font-mono">
                                <Calendar size={11} />
                                <span>{new Date(item.deadline).toISOString().split('T')[0]}</span>
                              </span>
                            )}

                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.06] uppercase">
                              {item.type || 'note'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Unassigned / General Thoughts Section */}
        {unassignedItems.length > 0 && !selectedPillarFilter && (
          <div className="rounded-2xl border border-white/[0.06] bg-[#0D1219] overflow-hidden">
            <div 
              onClick={() => togglePillar('unassigned')}
              className="p-3.5 md:p-4 flex items-center justify-between cursor-pointer select-none hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <div className="text-slate-400">
                  {expandedPillars.unassigned ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-400 flex items-center justify-center">
                  <Inbox size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-300">
                      Inbox &amp; Unassigned Thoughts
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 font-semibold border border-white/[0.08]">
                      {unassignedItems.length}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Quickly captured ideas not yet classified into a core pillar
                  </div>
                </div>
              </div>
            </div>

            {expandedPillars.unassigned && (
              <div className="border-t border-[#1E293B] bg-[#0A0E15] p-2.5 sm:p-3 space-y-1.5">
                {unassignedItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onEditTask?.(item)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-white/[0.04] hover:border-white/[0.14] bg-white/[0.015] hover:bg-white/[0.04] transition-all cursor-pointer gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText size={15} className="text-slate-400 shrink-0" />
                      <span className="text-xs font-medium text-slate-200 hover:text-white truncate">
                        {item.title || 'Untitled'}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.06] uppercase">
                      {item.type || 'note'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
