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
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border ${
              isActive
                ? 'bg-[#FFF4EC] border-[#FFD8BF] text-[#E04F16] dark:bg-[#FF5A1F]/15 dark:border-[#FF5A1F]/40 dark:text-[#FF5A1F] shadow-xs dark:shadow-[0_0_12px_rgba(255,90,31,0.25)] scale-102 font-bold'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:bg-dark-card dark:text-slate-400 dark:border-dark-border dark:hover:border-slate-700 dark:hover:bg-dark-cardHover'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF5A1F]' : dim.color}`} strokeWidth={1.8} />
            <span>{dim.label}</span>
          </button>
        );
      })}
    </div>
  );
};
