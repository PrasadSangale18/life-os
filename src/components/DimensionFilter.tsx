import React from 'react';
import { Activity, Brain, HeartHandshake, Sparkles, DollarSign } from 'lucide-react';
import type { PillarId } from '../theme/tokens';

interface DimensionFilterProps {
  activeDimension: PillarId | string;
  onSelectDimension: (dim: PillarId) => void;
}

export const DimensionFilter: React.FC<DimensionFilterProps> = ({
  activeDimension,
  onSelectDimension
}) => {
  const dimensions: { id: PillarId; label: string; icon: any; color: string }[] = [
    { id: 'physical', label: 'Physical', icon: Activity, color: 'text-emerald-500' },
    { id: 'mental', label: 'Mental', icon: Brain, color: 'text-sky-500' },
    { id: 'relational', label: 'Relational', icon: HeartHandshake, color: 'text-rose-500' },
    { id: 'spiritual', label: 'Spiritual', icon: Sparkles, color: 'text-purple-500' },
    { id: 'financial', label: 'Financial', icon: DollarSign, color: 'text-amber-500' },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 [scrollbar-width:none]">
      {dimensions.map(dim => {
        const Icon = dim.icon;
        const isActive = activeDimension === dim.id;
        return (
          <button
            key={dim.id}
            type="button"
            onClick={() => onSelectDimension(dim.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              isActive
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs scale-102 font-bold'
                : 'bg-white dark:bg-dark-card text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-dark-border hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-orange-400 dark:text-orange-500' : dim.color}`} strokeWidth={1.8} />
            <span>{dim.label}</span>
          </button>
        );
      })}
    </div>
  );
};
