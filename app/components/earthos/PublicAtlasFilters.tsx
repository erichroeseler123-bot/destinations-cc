"use client";

import type { PublicAtlasStatusFilter } from "@/lib/earthos/publicAtlas";
import { PUBLIC_ATLAS_FILTERS } from "@/lib/earthos/publicAtlas";

export default function PublicAtlasFilters({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: PublicAtlasStatusFilter;
  onFilterChange: (filter: PublicAtlasStatusFilter) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Atlas filters">
      {PUBLIC_ATLAS_FILTERS.map((filter) => {
        const active = activeFilter === filter.value;
        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onFilterChange(filter.value)}
            className={`min-h-10 shrink-0 rounded-full border px-4 text-[11px] font-black uppercase tracking-[0.16em] transition sm:text-xs ${
              active
                ? "border-[#f5c66c]/60 bg-[#f5c66c] text-[#120f0b] shadow-[0_0_34px_rgba(245,198,108,0.2)]"
                : "border-white/10 bg-white/[0.05] text-white/72 hover:border-[#f5c66c]/35 hover:text-white"
            }`}
          >
            <span className="sm:hidden">{filter.shortLabel}</span>
            <span className="hidden sm:inline">{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
}
