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
    <div className="w-full max-w-3xl">
      <div className="mb-3 text-[11px] font-black uppercase tracking-[0.24em] text-[#efe5d3]/76">
        Search the command network
      </div>
      <div className="relative">
        <div className="flex gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Search cities: "denver", "miami", "new-orleans", "CA", "tokyo"...'
            className="flex-1 rounded-full border border-[#f5c66c]/20 bg-white/[0.06] px-5 py-4 text-white outline-none placeholder:text-[#f8f4ed]/38 focus:ring-2 focus:ring-[#f5c66c]/60"
            onKeyDown={(e) => {
              if (e.key === "Enter") go();
              if (e.key === "Escape") setQ("");
            }}
          />

          <button
            type="button"
            onClick={go}
            className="rounded-full border border-[#f5c66c]/20 bg-[linear-gradient(180deg,#f5c66c,#21c6da)] px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-[#120f0b] shadow-[0_18px_38px_rgba(245,198,108,0.12)] transition hover:scale-[1.02]"
          >
            Search
          </button>
        </div>

        {query && results.length > 0 && (
          <div className="absolute z-50 mt-3 w-full rounded-[1.6rem] border border-[#f5c66c]/14 bg-[#100d0b]/95 p-2 shadow-2xl backdrop-blur">
            {results.map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="flex items-center justify-between gap-3 rounded-[1rem] px-3 py-3 transition hover:bg-white/5"
                onClick={() => setQ("")}
              >
                <div className="min-w-0">
                  <div className="truncate font-black uppercase">{c.name}</div>
                  <div className="truncate text-xs text-[#f8f4ed]/46">
                    {c.admin?.country || "—"}
                    {c.admin?.region_code ? ` • ${c.admin.region_code}` : ""} • /{c.slug}
                  </div>
                </div>
                <div className="shrink-0 text-xs font-black uppercase tracking-[0.16em] text-[#f5c66c]">Open</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 text-xs uppercase tracking-[0.12em] text-[#f8f4ed]/40">
        Enter opens the top match • Search button opens best match (or All Cities results)
      </div>
    </div>
  );
}
