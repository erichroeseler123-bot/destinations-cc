"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import portsData from "../../data/ports.seed.json";

type SearchItem = {
  name: string;
  slug: string;
  type: "port" | "ship" | "city";
  subtext?: string;
};

const EXTRA_SUGGESTIONS: SearchItem[] = [
  // Ships
  { name: "Carnival Jubilee", slug: "carnival-jubilee", type: "ship", subtext: "Cruise Ship • Carnival Cruise Line" },
  { name: "Icon of the Seas", slug: "icon-of-the-seas", type: "ship", subtext: "Cruise Ship • Royal Caribbean" },
  { name: "Viking Octantis", slug: "viking-octantis", type: "ship", subtext: "Cruise Ship • Viking Expeditions" },
  // Cities / Outposts
  { name: "Las Vegas", slug: "vegas", type: "city", subtext: "City Node • Nevada, USA" },
  { name: "New Orleans", slug: "new-orleans", type: "city", subtext: "City Node • Louisiana, USA" },
  { name: "Denver", slug: "denver", type: "city", subtext: "City Node • Colorado, USA" },
  { name: "Somerset", slug: "somerset-wi", type: "city", subtext: "City Node • Wisconsin, USA" },
  { name: "Wisconsin Dells", slug: "wisconsin-dells-large-group-dinner", type: "city", subtext: "Dining Outpost • Wisconsin, USA" }
];

export default function DestinationSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Combine static ports list with ships and cities
  const allItems = useMemo<SearchItem[]>(() => {
    const ports = (portsData as any[]).map((p) => ({
      name: p.name,
      slug: p.slug,
      type: "port" as const,
      subtext: p.area ? `Cruise Port • ${p.area}` : "Cruise Port"
    }));

    return [...ports, ...EXTRA_SUGGESTIONS];
  }, []);

  // Filter and score matches
  const suggestions = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    const tokens = cleanQuery.split(/\s+/).filter(Boolean);

    return allItems
      .map((item) => {
        const name = item.name.toLowerCase();
        const slug = item.slug.toLowerCase();
        const subtext = (item.subtext || "").toLowerCase();
        const hay = `${name} ${slug} ${subtext}`;

        let score = 0;
        for (const token of tokens) {
          if (name === token || slug === token) score += 100;
          else if (name.startsWith(token)) score += 50;
          else if (slug.startsWith(token)) score += 40;
          else if (hay.includes(token)) score += 10;
        }

        return { item, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.item);
  }, [allItems, query]);

  // Navigate to chosen item
  const handleNavigate = (item: SearchItem) => {
    setIsOpen(false);
    setQuery(item.name);
    
    if (item.type === "ship") {
      router.push(`/cruises/ship/${item.slug}`);
    } else if (item.type === "city") {
      router.push(`/${item.slug}`);
    } else {
      router.push(`/cruise-ports/${item.slug}`);
    }
  };

  // Handle standard form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && activeIndex < suggestions.length) {
      handleNavigate(suggestions[activeIndex]);
      return;
    }

    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    // Default fallback: slugify query and route as cruise port
    const slug = cleanQuery
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    router.push(`/cruise-ports/${slug}`);
  };

  // Keyboard navigation logic
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1 >= suggestions.length ? 0 : prev + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 < 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        handleNavigate(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className="w-full max-w-xl px-4 relative">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative rounded-2xl border-4 border-[#4C1D95] bg-[#0c0c0e] p-2 shadow-[8px_8px_0px_#4C1D95] transition-all hover:shadow-[12px_12px_0px_#4C1D95]">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Where are you heading?"
            className="w-full bg-transparent px-4 py-4 text-xl font-bold text-white placeholder-gray-500 outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl bg-[#4C1D95] px-6 py-3 font-bold text-white transition hover:bg-[#3b1673] active:translate-y-[-46%]"
          >
            Go
          </button>
        </div>
      </form>

      {/* Autocomplete Suggestions Overlay */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-4 right-4 z-50 mt-3 rounded-2xl border border-slate-800 bg-[#0c0c0e] p-2 shadow-[0_24px_50px_rgba(0,0,0,0.85)] overflow-hidden">
          {suggestions.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={`${item.type}-${item.slug}`}
                type="button"
                onClick={() => handleNavigate(item)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`w-full flex items-center justify-between text-left px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? "bg-[#1a233b] border-l-4 border-cyan-400 pl-3 text-white" 
                    : "text-zinc-200 hover:bg-slate-900 border-l-4 border-transparent"
                }`}
              >
                <div className="min-w-0">
                  <div className="font-bold text-sm uppercase tracking-wide">{item.name}</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{item.subtext}</div>
                </div>
                <div className={`text-[9px] font-black uppercase px-2 py-1 rounded ${
                  item.type === "ship" 
                    ? "bg-purple-950 text-purple-300 border border-purple-800" 
                    : item.type === "city" 
                      ? "bg-amber-950 text-amber-300 border border-amber-800" 
                      : "bg-cyan-950 text-cyan-300 border border-cyan-800"
                }`}>
                  {item.type}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
