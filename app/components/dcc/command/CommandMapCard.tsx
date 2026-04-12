"use client";

import dynamic from "next/dynamic";
import { commandTone } from "@/app/components/dcc/command/commandTone";
import type { CommandMapDestination, CorridorMapFeature } from "@/lib/dcc/command/types";

const LeafletCommandMap = dynamic(
  () => import("@/app/components/dcc/command/LeafletCommandMap").then((mod) => mod.LeafletCommandMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[26rem] items-center justify-center rounded-[1.4rem] border border-white/10 bg-black/25 text-sm font-semibold uppercase tracking-[0.18em] text-[#f8f4ed]/56">
        Loading live map
      </div>
    ),
  },
);

export function CommandMapCard({
  data,
  selectedCorridorId,
  selectedDestinationSlug,
  onSelectCorridor,
  onSelectDestination,
}: {
  data: {
    destinations: CommandMapDestination[];
    corridors: { id: string; name: string; from: string; to: string; status: string }[];
    features: CorridorMapFeature[];
  };
  selectedCorridorId?: string | null;
  selectedDestinationSlug?: string | null;
  onSelectCorridor?: (corridorId: string) => void;
  onSelectDestination?: (destinationSlug: string) => void;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,21,18,0.86),rgba(15,13,12,0.92))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <header className="space-y-1">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f5c66c]">Command map</div>
        <h2 className="text-2xl font-black uppercase text-white">Network overview</h2>
        <p className="text-sm text-[#f8f4ed]/66">
          Live corridor geometry is now rendering from the same scored network model that drives
          command status, best moves, and destination pressure.
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[1.5rem] border border-white/12 bg-black/20">
          <div className="h-[28rem]">
            <LeafletCommandMap
              destinations={data.destinations}
              features={data.features}
              selectedCorridorId={selectedCorridorId}
              selectedDestinationSlug={selectedDestinationSlug}
              onSelectCorridor={onSelectCorridor}
              onSelectDestination={onSelectDestination}
            />
          </div>
        </div>

        <div className="space-y-3">
          {data.features.map((feature) => (
            <div
              key={feature.id}
              className={`rounded-2xl border bg-white/[0.04] p-4 transition-all duration-200 ${
                selectedCorridorId === feature.id
                  ? "border-[#f5c66c]/55 shadow-[0_0_0_1px_rgba(245,198,108,0.4),0_18px_50px_rgba(245,198,108,0.18)]"
                  : "border-white/8"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-bold text-white">{feature.name}</div>
                    {feature.tier === "gold" ? (
                      <span className="inline-flex rounded-full border border-[#f5c66c]/30 bg-[#f5c66c]/12 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#f7d99a]">
                        Gold
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[#f8f4ed]/44">
                    {feature.trend} pressure pattern
                  </div>
                </div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${commandTone(feature.status)}`}>
                  {feature.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#f8f4ed]/76">{feature.pressureLabel}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-white">{feature.bestMove}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f8f4ed]/46">Flagship destinations</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.destinations.map((destination) => (
              <div
                key={destination.slug}
                className={`rounded-2xl border bg-white/[0.04] p-4 transition-all duration-200 ${
                  selectedDestinationSlug === destination.slug
                    ? "border-[#f5c66c]/55 shadow-[0_0_0_1px_rgba(245,198,108,0.4),0_18px_50px_rgba(245,198,108,0.18)]"
                    : "border-white/8"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-bold text-white">{destination.name}</div>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${commandTone(destination.status)}`}>
                    {destination.status}
                  </span>
                </div>
                <div className="mt-2 text-xs uppercase tracking-[0.16em] text-[#f8f4ed]/44">
                  {destination.lat.toFixed(2)}, {destination.lon.toFixed(2)}
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
