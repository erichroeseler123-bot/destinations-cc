"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EntrySurface } from "@/src/data/entry-surfaces-types";
import { isVisibleSurfacePath } from "@/src/data/visible-surface";

export default function SiteHeaderSearch({ cities }: { cities: EntrySurface[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function isSearchableEntry(city: EntrySurface) {
    return (
      city.availabilityStatus === "expansion_candidate" ||
      isVisibleSurfacePath(city.canonicalPath)
    );
  }

  function isLiveEntry(city: EntrySurface) {
    return city.availabilityStatus !== "expansion_candidate";
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return cities
      .filter(isSearchableEntry)
      .map((city) => {
        const haystack = city.searchText.toLowerCase();
        let score = 0;
        if (city.path.replace(/^\/+/, "") === q) score += 100;
        if (city.label.toLowerCase() === q) score += 90;
        if (city.label.toLowerCase().startsWith(q)) score += 40;
        if (city.searchText.startsWith(q)) score += 35;
        if (haystack.includes(q)) score += 10;
        score += Math.round(city.rankScore / 10);
        return { city, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [cities, query]);

  function submit() {
    const q = query.trim();
    if (!q) return;
    const top = results[0]?.city;
    if (top && isLiveEntry(top)) {
      router.push(top.canonicalPath);
      setQuery("");
      return;
    }
    router.push("/command");
    setQuery("");
  }

  return (
    <div className="dcc-site-search">
      <label htmlFor="dcc-global-search" className="sr-only">
        Search corridors, ports, and DCC lanes
      </label>
      <input
        id="dcc-global-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();
          if (event.key === "Escape") setQuery("");
        }}
        placeholder="Search corridors, ports, and DCC lanes"
        className="dcc-site-search__input"
      />
      <button type="button" onClick={submit} className="dcc-site-search__button">
        Search
      </button>
      {query.trim() && results.length > 0 ? (
        <div className="dcc-site-search__results">
          {results.map(({ city }) => {
            const meta = city.statusLabel ?? `${city.state ? `${city.state} • ` : ""}${city.canonicalPath}`;

            if (!isLiveEntry(city)) {
              return (
                <div key={city.id} className="dcc-site-search__result" aria-disabled="true">
                  <span>{city.label}</span>
                  <span className="dcc-site-search__meta">{meta}</span>
                </div>
              );
            }

            return (
              <Link
                key={city.id}
                href={city.canonicalPath}
                className="dcc-site-search__result"
                onClick={() => setQuery("")}
              >
                <span>{city.label}</span>
                <span className="dcc-site-search__meta">{meta}</span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
