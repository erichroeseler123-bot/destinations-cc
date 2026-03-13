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

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <label htmlFor="ports-search" className="text-xs uppercase tracking-wider text-zinc-500">
          Search Cruise Ports
        </label>
        <input
          id="ports-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by port, region, country, or code"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-600/40"
        />
        <p className="text-xs text-zinc-500">
          showing {filtered.length} of {ports.length} ports
        </p>
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
                    className="rounded-3xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
                  >
                    <div className="text-lg font-bold">{p.name}</div>
                    <div className="mt-2 text-sm text-zinc-500">
                      {p.country || "Unknown"} {p.country ? "•" : ""} /ports/{p.slug}
                    </div>
                    <div className="mt-4 text-sm text-cyan-300">Open →</div>
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
