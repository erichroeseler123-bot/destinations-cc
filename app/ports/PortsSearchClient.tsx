"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Port = {
  slug: string;
  name: string;
  area?: string;
  region?: string;
  city?: string;
  country?: string;
  tags?: string[];
};

function tokenizePort(port: Port): string {
  return [
    port.name,
    port.slug,
    port.area,
    port.region,
    port.city,
    port.country,
    ...(port.tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function PortsSearchClient({ ports }: { ports: Port[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return ports;
    return ports.filter((p) => tokenizePort(p).includes(q));
  }, [ports, q]);

  const byArea = useMemo(() => {
    const map = new Map<string, Port[]>();
    for (const p of filtered) {
      const key = p.area || "Other";
      map.set(key, [...(map.get(key) || []), p]);
    }
    return map;
  }, [filtered]);

  const areas = useMemo(
    () => [...byArea.keys()].sort((a, b) => a.localeCompare(b)),
    [byArea]
  );
  const visibleAreas = areas.length;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Browse ports</p>
          <h3 className="text-2xl font-bold text-white">Search embarkation and call ports</h3>
          <p className="max-w-3xl text-sm text-zinc-400">
            Filter ports by name, region, area, or country, then move into the right embarkation or shore-day guide.
          </p>
        </div>

        <input
          id="ports-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by port, region, country, or code"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-600/40"
        />

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Visible ports</div>
            <div className="mt-2 text-sm font-medium text-zinc-100">
              Showing {filtered.length} of {ports.length} ports.
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Areas in view</div>
            <div className="mt-2 text-sm font-medium text-zinc-100">{visibleAreas} embarkation regions are visible in the current filter.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Best next move</div>
            <div className="mt-2 text-sm font-medium text-zinc-100">Open the port guide first, then move into cruises, transfers, or shore excursions from there.</div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <section className="rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-zinc-400">No ports matched that query.</p>
        </section>
      ) : (
        areas.map((area) => {
          const list = (byArea.get(area) || []).sort((a, b) => a.name.localeCompare(b.name));
          return (
            <section key={area} className="space-y-3">
              <div className="text-xs tracking-[0.35em] uppercase text-zinc-500">{area}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {list.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/ports/${p.slug}`}
                    className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 hover:bg-white/[0.08] transition"
                  >
                    <div className="text-lg font-bold text-white">{p.name}</div>
                    <div className="mt-2 text-sm text-zinc-400">
                      {[p.city, p.area, p.country].filter(Boolean).join(" • ") || "Port guide"}
                    </div>
                    <div className="mt-3 inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                      /ports/{p.slug}
                    </div>
                    <div className="mt-4 text-sm text-cyan-300">Open guide →</div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })
      )}
    </section>
  );
}
