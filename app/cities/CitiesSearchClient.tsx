"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildViatorDestinationLink, hasViatorAffiliateConfig } from "@/utils/affiliateLinks";

type City = {
  id: string;
  slug: string;
  name: string;
  admin?: { country?: string; region_code?: string | null };
  metrics?: { population?: number | null };
};

export default function CitiesSearchClient({
  cities,
  initialQuery = "",
}: {
  cities?: City[];
  initialQuery?: string;
}) {
  const safeCities = Array.isArray(cities) ? cities : [];
  const viatorEnabled = hasViatorAffiliateConfig();

  const [q, setQ] = useState(initialQuery);
  const [usOnly, setUsOnly] = useState(false);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = safeCities;

    if (usOnly) list = list.filter((c) => c.admin?.country === "US");
    if (!query) return list;

    return list.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const slug = (c.slug || "").toLowerCase();
      const country = (c.admin?.country || "").toLowerCase();
      const region = (c.admin?.region_code || "").toLowerCase();

      return (
        name.includes(query) ||
        slug.includes(query) ||
        country === query ||
        region === query ||
        `${country} ${region}`.includes(query) ||
        `${region} ${country}`.includes(query)
      );
    });
  }, [safeCities, q, usOnly]);

  const shown = filtered.slice(0, 300);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Search: "denver", "new-orleans-la", "US", "CA", "US CA"...'
            className="w-full md:flex-1 rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-cyan-500/60"
          />

          <label className="flex items-center gap-2 text-sm text-zinc-300 select-none">
            <input
              type="checkbox"
              checked={usOnly}
              onChange={(e) => setUsOnly(e.target.checked)}
              className="h-4 w-4"
            />
            US only
          </label>

          <div className="text-sm text-zinc-400 md:text-right">
            Showing <span className="text-white">{shown.length}</span>
            <span className="text-zinc-500"> / {filtered.length} matches</span>
          </div>
        </div>

        {filtered.length > shown.length && (
          <p className="mt-3 text-xs text-zinc-500">
            Showing first {shown.length} results. Refine your search to narrow it
            down.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shown.map((c) => (
          <article
            key={c.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
          >
            <Link href={`/${c.slug}`} className="block">
              <div className="font-bold text-lg">{c.name}</div>
              <div className="text-sm text-zinc-400">
                {(c.admin?.country || "—")}
                {c.admin?.region_code ? ` • ${c.admin.region_code}` : ""}
                {typeof c.metrics?.population === "number"
                  ? ` • Pop ${c.metrics.population.toLocaleString()}`
                  : ""}
              </div>
              <div className="mt-1 text-xs text-zinc-500">/{c.slug}</div>
            </Link>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/${c.slug}/tours?utm_source=dcc&utm_medium=internal&utm_campaign=cities-dcc-tours`}
                className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
              >
                DCC Tours
              </Link>
              {viatorEnabled ? (
                <a
                  href={buildViatorDestinationLink(c.name)}
                  target="_blank"
                  rel="noopener noreferrer sponsored nofollow"
                  className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20"
                >
                  Book with Viator
                </a>
              ) : (
                <Link
                  href={`/tours?city=${encodeURIComponent(c.slug)}&utm_source=dcc&utm_medium=internal&utm_campaign=cities-fallback`}
                  className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20"
                >
                  View Activities
                </Link>
              )}
            </div>
            {viatorEnabled ? (
              <p className="mt-2 text-[11px] text-zinc-500">
                Powered by Viator. DCC may earn a commission if you book through partner links, at no extra cost to you.
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
