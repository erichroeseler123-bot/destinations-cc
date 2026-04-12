"use client";

import { DestinationStatusCard } from "@/app/components/dcc/command/DestinationStatusCard";
import type { DestinationStatusCardModel } from "@/lib/dcc/command/types";

export function DestinationStatusStack({
  destinations,
  highlightedDestinationSlug,
}: {
  destinations: DestinationStatusCardModel[];
  highlightedDestinationSlug?: string | null;
}) {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f5c66c]">Flagship destinations</div>
        <h2 className="text-2xl font-black uppercase text-white">Destination status</h2>
      </header>
      <div className="space-y-4">
        {destinations.map((destination) => (
          <DestinationStatusCard
            key={destination.slug}
            destination={destination}
            elementId={`destination-card-${destination.slug}`}
            highlighted={highlightedDestinationSlug === destination.slug}
          />
        ))}
      </div>
    </section>
  );
}
