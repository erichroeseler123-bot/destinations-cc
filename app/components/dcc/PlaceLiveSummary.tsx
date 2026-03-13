 "use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import type { PlaceLiveSummary } from "@/lib/dcc/graph/placeLiveSummary";
import StaleWarning from "@/app/components/StaleWarning";
import {
  DCC_LANE_LABELS,
  DCC_LANE_ORDER,
  DCC_LANE_SECTION_TARGETS,
  type DccLane,
  serializeAliveFilter,
} from "@/lib/dcc/taxonomy/lanes";

export default function PlaceLiveSummaryRail({
  summary: initialSummary,
  placeSlug,
  aliveFilter,
  expanded,
}: {
  summary: PlaceLiveSummary | null;
  placeSlug: string;
  aliveFilter: DccLane[];
  expanded: boolean;
}) {
  const [summary, setSummary] = useState<PlaceLiveSummary | null>(initialSummary);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/internal/${encodeURIComponent(placeSlug)}/live-summary`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as PlaceLiveSummary;
        if (!cancelled) setSummary(json);
      } catch {
        // keep prior summary
      }
    };

    poll();
    const timer = setInterval(poll, 60000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [placeSlug]);

  const staleCount = summary
    ? Number(summary.freshness.graph_stale) + Number(summary.freshness.action_sources_stale)
    : 0;
  const lanes = useMemo(
    () => {
      if (!summary) return [];
      return (
      DCC_LANE_ORDER.map((key) => ({
        key,
        label: DCC_LANE_LABELS[key],
        value: summary.action_counts[key],
        freshness: summary.lane_freshness[key],
        preview: summary.preview_actions[key],
      }))
        .filter((lane) => (aliveFilter.length ? aliveFilter.includes(lane.key) : true))
        .filter((x) => {
          const explicitlyRequested = aliveFilter.includes(x.key);
          // Hide empty+stale lanes unless explicitly requested.
          if (x.value === 0 && x.freshness.stale && !explicitlyRequested) return false;
          if (expanded) return true;
          return x.value > 0 || explicitlyRequested;
        })
      );
    },
    [summary, aliveFilter, expanded]
  );

  const canonicalAlive = useMemo(
    () => serializeAliveFilter(aliveFilter),
    [aliveFilter]
  );

  const jumpTargets = useMemo(() => {
    const targets: Array<{ label: string; id: string }> = [];
    for (const lane of aliveFilter) {
      targets.push(DCC_LANE_SECTION_TARGETS[lane]);
    }
    if (targets.length === 0) {
      targets.push({ label: "Action inventory", id: "section-action-inventory" });
    }
    return targets;
  }, [aliveFilter]);

  function hrefWith(next: { alive?: string; alive_expand?: string }) {
    const p = new URLSearchParams(searchParams?.toString() || "");
    if (typeof next.alive === "string") {
      if (next.alive) p.set("alive", next.alive);
      else p.delete("alive");
    }
    if (typeof next.alive_expand === "string") {
      if (next.alive_expand) p.set("alive_expand", next.alive_expand);
      else p.delete("alive_expand");
    }
    const qs = p.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  useEffect(() => {
    const p = new URLSearchParams(searchParams?.toString() || "");
    const currentAlive = p.get("alive") || "";
    const currentExpand = p.get("alive_expand") || "";
    const canonicalExpand = expanded ? "1" : "";

    let changed = false;
    if (currentAlive !== canonicalAlive) {
      if (canonicalAlive) p.set("alive", canonicalAlive);
      else p.delete("alive");
      changed = true;
    }
    if (currentExpand !== canonicalExpand) {
      if (canonicalExpand) p.set("alive_expand", canonicalExpand);
      else p.delete("alive_expand");
      changed = true;
    }
    if (changed) {
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [canonicalAlive, expanded, pathname, router, searchParams]);

  if (!summary) return null;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-7 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-lg">What&apos;s Alive Here Now</h3>
        <span className="text-xs uppercase tracking-wider text-zinc-500">Graph Pulse</span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
        {lanes.map((lane) => (
          <div
            key={lane.key}
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-2"
            title={`source=${lane.freshness.source}; cache_status=${lane.freshness.cache_status}`}
          >
            {lane.label}: {lane.value}
            <span className={`ml-2 text-xs ${lane.freshness.stale ? "text-amber-300" : "text-zinc-500"}`}>
              [{lane.freshness.cache_status}]
            </span>
            {expanded && lane.preview.length > 0 ? (
              <div className="text-xs text-zinc-400 mt-1">{lane.preview.join(" • ")}</div>
            ) : null}
          </div>
        ))}
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          Trend: {summary.trend || "n/a"}
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          Latest event: {summary.latest_event_type || "n/a"}
        </div>
      </div>
      <div className="text-sm text-zinc-400">
        Top providers: {summary.providers.length ? summary.providers.slice(0, 4).join(", ") : "n/a"}
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <Link href={hrefWith({ alive: "" })} className="rounded-full border border-white/10 px-3 py-1 text-zinc-300 hover:bg-white/10">
          All lanes
        </Link>
        <Link href={hrefWith({ alive: serializeAliveFilter(["tours", "cruises"]) })} className="rounded-full border border-white/10 px-3 py-1 text-zinc-300 hover:bg-white/10">
          Tours + Cruises
        </Link>
        <Link href={hrefWith({ alive: serializeAliveFilter(["events", "transport"]) })} className="rounded-full border border-white/10 px-3 py-1 text-zinc-300 hover:bg-white/10">
          Events + Transport
        </Link>
        <Link
          href={hrefWith({ alive_expand: expanded ? "" : "1" })}
          className="rounded-full border border-white/10 px-3 py-1 text-zinc-300 hover:bg-white/10"
        >
          {expanded ? "Collapse" : "Expand"}
        </Link>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {jumpTargets.map((t) => (
          <a
            key={t.id}
            href={`${hrefWith({})}#${t.id}`}
            className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-200 hover:bg-cyan-500/20"
          >
            Jump: {t.label}
          </a>
        ))}
      </div>
      <StaleWarning
        stale={staleCount > 0}
        message={`${staleCount} source lane(s) currently stale.`}
      />
      <div className="flex flex-wrap gap-2 text-sm">
        {(expanded ? summary.related_places : summary.related_places.slice(0, 4)).map((r) => (
          <Link
            key={`${r.place_id}:${r.slug}`}
            href={`/nodes/${r.slug}${canonicalAlive ? `?alive=${encodeURIComponent(canonicalAlive)}${expanded ? "&alive_expand=1" : ""}` : expanded ? "?alive_expand=1" : ""}`}
            className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-zinc-200 hover:bg-white/10"
          >
            {r.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
