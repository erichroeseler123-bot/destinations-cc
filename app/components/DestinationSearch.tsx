"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DestinationSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Slugify the input: lowercase, replace spaces and special characters with hyphens
    const slug = query
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric/spaces/hyphens
      .replace(/\s+/g, "-")         // replace spaces with hyphens
      .replace(/-+/g, "-");         // collapse multiple hyphens

    router.push(`/cruise-ports/${slug}`);
  };

  return (
    <div className="w-full max-w-xl px-4">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative rounded-2xl border-4 border-[#4C1D95] bg-white p-2 shadow-[8px_8px_0px_#4C1D95] transition-all hover:shadow-[12px_12px_0px_#4C1D95]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Where are you heading?"
            className="w-full bg-transparent px-4 py-4 text-xl font-bold text-[#1F2937] placeholder-gray-400 outline-none"
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
    </div>
  );
}
