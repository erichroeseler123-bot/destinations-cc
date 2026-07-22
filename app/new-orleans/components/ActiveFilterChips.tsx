import React from 'react';
import { ActiveFilter } from '../data/types';

export default function ActiveFilterChips({ activeFilters, onClear }: { activeFilters: ActiveFilter[], onClear: () => void }) { 
  if (!activeFilters.length) return null; 
  return (
    <div className="flex gap-2 items-center">
      <div className="flex gap-2 flex-wrap">
        {activeFilters.map(f => <span key={f.id} className="bg-[#e6e2d8] text-[#1a1a1a] px-3 py-1 rounded-full text-sm font-medium">{f.label}: {f.value}</span>)}
      </div>
      <button onClick={onClear} className="text-sm text-gray-500 hover:underline ml-2">Clear All</button>
    </div>
  ); 
}