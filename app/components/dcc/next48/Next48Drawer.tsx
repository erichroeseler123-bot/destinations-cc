"use client";

import { useEffect, useMemo, useState } from "react";
import Next48Card from "@/app/components/dcc/next48/Next48Card";
import Next48Filters from "@/app/components/dcc/next48/Next48Filters";
import Next48Rail from "@/app/components/dcc/next48/Next48Rail";
import Next48ShareCard from "@/app/components/dcc/next48/Next48ShareCard";
import { trackShareArtifact } from "@/lib/dcc/share/analytics";
import type {
  Next48BucketKey,
  Next48EntityType,
  Next48Feed,
  Next48Filter,
  Next48Item,
} from "@/lib/dcc/next48/types";

type Props = {
  open: boolean;
  onClose: () => void;
  entityType: Next48EntityType;
  slug: string;
};

type ApiPayload = {
  ok: boolean;
  feed?: Next48Feed;
  error?: string;
};

export default function Next48Drawer({ open, onClose, entityType, slug }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feed, setFeed] = useState<Next48Feed | null>(null);
  const [activeBucket, setActiveBucket] = useState<Next48BucketKey>("now");
  const [activeFilter, setActiveFilter] = useState<Next48Filter>("all");
  const [showShareCard, setShowShareCard] = useState(false);

  useEffect(() => {
    if (!open) return;

    let aborted = false;

    fetch(`/api/internal/next48?entityType=${entityType}&slug=${slug}`)
      .then(async (response) => {
        const payload = (await response.json()) as ApiPayload;
        if (!response.ok || !payload.ok || !payload.feed) {
          throw new Error(payload.error || "Failed to load Next 48 feed");
        }
        if (!aborted) {
          setFeed(payload.feed);
          const firstNonEmpty =
            (Object.keys(payload.feed.counts) as Next48BucketKey[]).find(
              (bucket) => payload.feed?.counts[bucket]
            ) || "now";
          setActiveBucket(firstNonEmpty);
        }
      })
      .catch((err: unknown) => {
        if (!aborted) setError(String(err));
      })
      .finally(() => {
        if (!aborted) setLoading(false);
      });

    return () => {
      aborted = true;
    };
  }, [open, entityType, slug]);

  const filteredItems = useMemo(() => {
    if (!feed) return [] as Next48Item[];
    const base = feed.buckets[activeBucket] || [];
    if (activeFilter === "all") return base;
    return base.filter((item) => item.category === activeFilter);
  }, [feed, activeBucket, activeFilter]);

  const failedSources = useMemo(
    () => feed?.sourceDiagnostics.filter((item) => item.status === "error") || [],
    [feed]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close Next 48 drawer"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      <section className="absolute bottom-0 left-0 right-0 max-h-[88vh] rounded-t-3xl border-t border-white/10 bg-zinc-950 p-4 text-white shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
        <header className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300">Live Discovery</p>
            <h3 className="text-lg font-bold">Next 48 Hours in {slug.replace(/-/g, " ")}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-zinc-200"
          >
            Close
          </button>
        </header>

        {loading ? <p className="py-10 text-center text-sm text-zinc-300">Loading live discovery feed...</p> : null}

        {!loading && error ? (
          <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100">
            Could not load Next 48 feed. {error}
          </div>
        ) : null}

        {!loading && !error && feed ? (
          <div className="space-y-3">
            {failedSources.length ? (
              <div className="rounded-xl border border-amber-300/30 bg-amber-500/10 p-3 text-xs text-amber-100">
                Some sources are temporarily unavailable ({failedSources.map((s) => s.source).join(", ")}).
                Showing partial live discovery.
              </div>
            ) : null}

            <Next48Rail value={activeBucket} counts={feed.counts} onChange={setActiveBucket} />
            <Next48Filters value={activeFilter} onChange={setActiveFilter} />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowShareCard((value) => !value);
                  trackShareArtifact({
                    artifactType: "next48",
                    action: "toggle",
                    context: `${entityType}:${slug}`,
                  });
                }}
                className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-200"
              >
                {showShareCard ? "Hide share card" : "Show share card"}
              </button>
            </div>

            {showShareCard ? <Next48ShareCard feed={feed} /> : null}

            <div className="max-h-[58vh] space-y-3 overflow-y-auto pb-6">
              {filteredItems.length ? (
                filteredItems.map((item) => <Next48Card key={item.id} item={item} />)
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
                  No strong matches in this bucket and filter yet. Try another time bucket or category.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
