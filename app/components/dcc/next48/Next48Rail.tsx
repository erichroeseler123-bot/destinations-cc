"use client";

import type { Next48BucketKey } from "@/lib/dcc/next48/types";

type Props = {
  value: Next48BucketKey;
  counts: Record<Next48BucketKey, number>;
  onChange: (value: Next48BucketKey) => void;
};

const ORDER: Next48BucketKey[] = ["now", "tonight", "tomorrow", "later-48h"];

const LABELS: Record<Next48BucketKey, string> = {
  now: "Now",
  tonight: "Tonight",
  tomorrow: "Tomorrow",
  "later-48h": "Later 48h",
};

export default function Next48Rail({ value, counts, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {ORDER.map((bucket) => (
        <button
          key={bucket}
          type="button"
          onClick={() => onChange(bucket)}
          className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold ${
            value === bucket
              ? "border-cyan-300 bg-cyan-400/20 text-cyan-100"
              : "border-white/15 bg-white/5 text-zinc-300"
          }`}
        >
          {LABELS[bucket]} ({counts[bucket] || 0})
        </button>
      ))}
    </div>
  );
}
