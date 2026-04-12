"use client";

import { CorridorHealthCard } from "@/app/components/dcc/command/CorridorHealthCard";
import type { CorridorHealthCardModel } from "@/lib/dcc/command/types";

export function CorridorHealthGrid({
  corridors,
  highlightedCorridorId,
}: {
  corridors: CorridorHealthCardModel[];
  highlightedCorridorId?: string | null;
}) {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f5c66c]">High-priority corridors</div>
        <h2 className="text-2xl font-black uppercase text-white">Corridor health</h2>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {corridors.map((corridor) => (
          <CorridorHealthCard
            key={corridor.id}
            corridor={corridor}
            elementId={`corridor-card-${corridor.id}`}
            highlighted={highlightedCorridorId === corridor.id}
          />
        ))}
      </div>
    </section>
  );
}
