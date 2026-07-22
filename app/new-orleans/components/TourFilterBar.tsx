import React from 'react';
import { FilterOption } from '../data/types';

export default function TourFilterBar({ filters }: { filters: {id: string, label: string, options: FilterOption[]}[] }) {
  if (!filters || filters.length === 0) return null;
  return (
    <div className="flex gap-4 overflow-x-auto p-6 bg-[#F9F8F6] border-y border-[#EBE8E0]">
      {filters.map(f => (
        <select key={f.id} className="border border-[#EBE8E0] p-3 pr-10 bg-white text-[#2C2C2A] text-sm uppercase tracking-widest outline-none focus:border-[#B59A65] shadow-sm cursor-pointer appearance-none">
          <option value="">{f.label}</option>
          {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}
    </div>
  );
}