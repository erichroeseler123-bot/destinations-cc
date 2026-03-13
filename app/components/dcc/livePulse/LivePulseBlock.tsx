"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { LivePulseEntityType, LivePulseFeed, LivePulseFeedItem } from "@/lib/dcc/livePulse/types";

type Props = {
  entityType: LivePulseEntityType;
  entitySlug: string;
  title: string;
  target?: "entity" | "city-feed" | "next48-overlay";
};

type ApiPayload = {
  ok: boolean;
  feed?: LivePulseFeed;
  error?: string;
};

function confidenceBadge(value: LivePulseFeedItem["confidence"]): string {
  if (value === "high") return "High confidence";
  if (value === "medium") return "Medium confidence";
  return "Low confidence";
}

function relativeExpiry(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  const mins = Math.max(0, Math.floor(ms / 60000));
  return `${mins}m left`;
}

function relativeUpdated(value: string): string {
  const ms = Date.now() - new Date(value).getTime();
  const mins = Math.max(0, Math.floor(ms / 60000));
  return `${mins}m ago`;
}

export default function LivePulseBlock({
  entityType,
  entitySlug,
  title,
  target = "entity",
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feed, setFeed] = useState<LivePulseFeed | null>(null);

  useEffect(() => {
    let canceled = false;

    fetch(
      `/api/internal/live-pulse?entityType=${entityType}&slug=${entitySlug}&target=${target}&limit=6`
    )
      .then(async (response) => {
        const payload = (await response.json()) as ApiPayload;
        if (!response.ok || !payload.ok || !payload.feed) {
          throw new Error(payload.error || "Failed to load live pulse");
        }
        if (!canceled) setFeed(payload.feed);
      })
      .catch((err: unknown) => {
        if (!canceled) setError(String(err));
      })
      .finally(() => {
        if (!canceled) setLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [entityType, entitySlug, target]);

  const items = useMemo(() => feed?.items || [], [feed]);

  return (
    <section className="rounded-3xl border border-cyan-300/20 bg-cyan-500/5 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Live Pulse</p>
          <h3 className="mt-1 text-2xl font-bold text-white">{title}</h3>
        </div>
        {feed ? <p className="text-xs text-zinc-400">{feed.totalSignals} active signals</p> : null}
      </div>

      {loading ? <p className="text-sm text-zinc-300">Loading live structured signals...</p> : null}

      {!loading && error ? (
        <p className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100">
          Live Pulse unavailable: {error}
        </p>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-300">
          No high-signal updates in the active 2-hour window.
        </p>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold text-white">{item.title}</h4>
                  <p className="text-sm text-zinc-300">{item.location}</p>
                </div>
                <span className="rounded-full border border-white/15 px-2 py-1 text-[11px] text-cyan-200">
                  {confidenceBadge(item.confidence)}
                </span>
              </div>

              <p className="mt-2 text-sm text-zinc-300">{item.description}</p>
              <p className="mt-2 text-sm text-zinc-200">
                <span className="font-semibold">Action:</span> {item.actionHint}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                <span>{item.corroborationCount} reports</span>
                <span>•</span>
                <span>Updated {relativeUpdated(item.lastUpdated)}</span>
                <span>•</span>
                <span>{relativeExpiry(item.expiresAt)}</span>
                <span>•</span>
                <span>{item.sourceName}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={
                    entityType === "city"
                      ? `/cities/${entitySlug}`
                      : entityType === "port"
                        ? `/ports/${entitySlug}`
                        : `/venues/${entitySlug}`
                  }
                  className="rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-black"
                >
                  Open authority view
                </Link>
                {item.linkUrl ? (
                  item.linkUrl.startsWith("/") ? (
                    <Link
                      href={item.linkUrl}
                      className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-zinc-100"
                    >
                      Open secondary action
                    </Link>
                  ) : (
                    <a
                      href={item.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-zinc-100"
                    >
                      Open secondary action
                    </a>
                  )
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
