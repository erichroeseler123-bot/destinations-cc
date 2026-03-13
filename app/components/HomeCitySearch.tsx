"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CityLite = {
  slug: string;
  name: string;
  admin?: { country?: string; region_code?: string | null };
  metrics?: { population?: number | null };
};

export default function HomeCitySearch({ cities }: { cities: CityLite[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const query = q.trim();

  const results = useMemo(() => {
    const s = query.toLowerCase();
    if (!s) return [];
    const tokens = s.split(/\s+/).filter(Boolean);

    const score = (c: CityLite) => {
      const name = c.name?.toLowerCase() || "";
      const slug = c.slug?.toLowerCase() || "";
      const country = (c.admin?.country || "").toLowerCase();
      const region = (c.admin?.region_code || "").toLowerCase();

      const hay = `${name} ${slug} ${country} ${region}`.trim();

      let sc = 0;
      for (const t of tokens) {
        if (slug === t) sc += 100;
        if (name === t) sc += 80;
        if (name.startsWith(t)) sc += 35;
        if (slug.startsWith(t)) sc += 30;
        if (hay.includes(t)) sc += 10;
      }

      const pop = c.metrics?.population ?? 0;
      sc += Math.min(12, Math.log10(Math.max(1, pop)) || 0);

      return sc;
    };

    return cities
      .map((c) => ({ c, sc: score(c) }))
      .filter((x) => x.sc > 0)
      .sort((a, b) => b.sc - a.sc)
      .slice(0, 12)
      .map((x) => x.c);
  }, [cities, query]);

  const top = results[0];

  function go() {
    const s = query;
    if (!s) return;
    if (top) router.push(`/${top.slug}`);
    else router.push(`/cities?q=${encodeURIComponent(s)}`);
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative">
        <div className="flex gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Search cities: "denver", "miami", "new-orleans", "CA", "tokyo"...'
            className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-5 py-4 text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-cyan-500/60"
            onKeyDown={(e) => {
              if (e.key === "Enter") go();
              if (e.key === "Escape") setQ("");
            }}
          />

          <button
            type="button"
            onClick={go}
            className="rounded-2xl bg-cyan-600 px-6 py-4 font-semibold text-white hover:bg-cyan-500 transition shadow-lg shadow-cyan-600/25"
          >
            Search
          </button>
        </div>

        {query && results.length > 0 && (
          <div className="absolute z-50 mt-3 w-full rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur p-2 shadow-2xl">
            {results.map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-white/5 transition"
                onClick={() => setQ("")}
              >
                <div className="min-w-0">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-zinc-500 truncate">
                    {c.admin?.country || "—"}
                    {c.admin?.region_code ? ` • ${c.admin.region_code}` : ""} • /{c.slug}
                  </div>
                </div>
                <div className="text-xs text-cyan-300 shrink-0">Open →</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 text-xs text-zinc-600">
        Enter opens the top match • Search button opens best match (or All Cities results)
      </div>
    </div>
  );
}
