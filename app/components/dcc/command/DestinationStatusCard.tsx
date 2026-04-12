"use client";

import Link from "next/link";
import { commandTone } from "@/app/components/dcc/command/commandTone";
import type { DestinationStatusCardModel } from "@/lib/dcc/command/types";
import { isVisibleSurfacePath } from "@/src/data/visible-surface";

export function DestinationStatusCard({
  destination,
  elementId,
  highlighted = false,
}: {
  destination: DestinationStatusCardModel;
  elementId?: string;
  highlighted?: boolean;
}) {
  const destinationPath = `/${destination.slug}`;
  const canLink = isVisibleSurfacePath(destinationPath);

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
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f5c66c]">Destination status</div>
          <h3 className="mt-2 text-lg font-black uppercase text-white">{destination.name}</h3>
        </div>
        <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${commandTone(destination.status)}`}>
          {destination.status}
        </span>
      </div>
      <div className="mt-4 space-y-3 text-sm text-[#f8f4ed]/74">
        <p>{destination.liveSignal}</p>
        <p>{destination.transportStatus}</p>
        <p className="text-white">{destination.recommendation}</p>
      </div>
      {canLink ? (
        <Link
          href={destinationPath}
          className="mt-4 inline-flex text-xs font-black uppercase tracking-[0.16em] text-[#efe5d3]"
        >
          Open destination
        </Link>
      ) : null}
    </article>
  );
}
