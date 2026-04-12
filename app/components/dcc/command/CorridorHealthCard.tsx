"use client";

import { commandTone } from "@/app/components/dcc/command/commandTone";
import type { CorridorHealthCardModel } from "@/lib/dcc/command/types";

export function CorridorHealthCard({
  corridor,
  elementId,
  highlighted = false,
}: {
  corridor: CorridorHealthCardModel;
  elementId?: string;
  highlighted?: boolean;
}) {
  return (
    <article
      id={elementId}
      className={`rounded-[1.5rem] border bg-[linear-gradient(180deg,rgba(24,21,18,0.84),rgba(12,11,10,0.92))] p-5 transition-all duration-200 ${
        highlighted
          ? "border-[#f5c66c]/55 shadow-[0_0_0_1px_rgba(245,198,108,0.4),0_18px_50px_rgba(245,198,108,0.18)]"
          : "border-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f5c66c]">Corridor health</div>
          <h3 className="mt-2 text-lg font-black uppercase text-white">{corridor.name}</h3>
          <p className="mt-1 text-sm text-[#f8f4ed]/56">{corridor.from} to {corridor.to}</p>
        </div>
        <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${commandTone(corridor.status)}`}>
          {corridor.status}
        </span>
      </div>
      <p className="mt-4 text-sm text-[#f8f4ed]/72">{corridor.pressureLabel}</p>
      <p className="mt-3 text-sm text-white">{corridor.bestMove}</p>
    </article>
  );
}
