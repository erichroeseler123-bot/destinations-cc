"use client";

import type { Next48Filter } from "@/lib/dcc/next48/types";

type Props = {
  value: Next48Filter;
  onChange: (value: Next48Filter) => void;
};

const LABELS: Record<Next48Filter, string> = {
  all: "All",
  concerts: "Concerts",
  sports: "Sports",
  festivals: "Festivals",
  tours: "Tours",
  nightlife: "Nightlife",
};

const FILTERS: Next48Filter[] = ["all", "concerts", "sports", "festivals", "tours", "nightlife"];

export default function Next48Filters({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          onClick={() => onChange(filter)}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
            value === filter
              ? "border-cyan-300 bg-cyan-400/20 text-cyan-100"
              : "border-white/15 bg-white/5 text-zinc-300"
          }`}
        >
          {LABELS[filter]}
        </button>
      ))}
    </div>
  );
}
