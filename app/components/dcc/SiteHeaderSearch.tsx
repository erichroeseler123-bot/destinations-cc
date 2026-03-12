"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SearchCity = {
  slug: string;
  name: string;
  canonicalPath?: string;
  state?: string;
};

export default function SiteHeaderSearch({ cities }: { cities: SearchCity[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return cities
      .map((city) => {
        const haystack = `${city.name} ${city.slug} ${city.state ?? ""}`.toLowerCase();
        let score = 0;
        if (city.slug === q) score += 100;
        if (city.name.toLowerCase() === q) score += 90;
        if (city.name.toLowerCase().startsWith(q)) score += 40;
        if (city.slug.startsWith(q)) score += 35;
        if (haystack.includes(q)) score += 10;
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
    if (top) {
      router.push(top.canonicalPath ?? `/${top.slug}`);
      setQuery("");
      return;
    }
    router.push(`/cities?q=${encodeURIComponent(q)}`);
    setQuery("");
  }

  return (
    <div className="dcc-site-search">
      <label htmlFor="dcc-global-search" className="sr-only">
        Search cities, ports, and hubs
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
        placeholder="Search cities, ports, and hubs"
        className="dcc-site-search__input"
      />
      <button type="button" onClick={submit} className="dcc-site-search__button">
        Search
      </button>
      {query.trim() && results.length > 0 ? (
        <div className="dcc-site-search__results">
          {results.map(({ city }) => (
            <Link
              key={city.slug}
              href={city.canonicalPath ?? `/${city.slug}`}
              className="dcc-site-search__result"
              onClick={() => setQuery("")}
            >
              <span>{city.name}</span>
              <span className="dcc-site-search__meta">
                {city.state ? `${city.state} • ` : ""}
                /{city.slug}
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
