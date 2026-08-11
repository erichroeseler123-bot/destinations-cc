"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type LensKey = "all" | "tonight" | "events" | "food" | "local" | "movement";

type Signal = {
  id: string;
  title: string;
  description?: string;
  starts_at?: string;
  expires_at?: string;
  impact_level?: string;
  provenance?: string;
  signal_type?: string;
  linked_place_slug?: string;
  linked_venue_slug?: string;
  affected_district_slugs?: string[];
};

type Event = {
  id: string;
  title: string;
  category?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  venue_slug?: string;
};

type Payload = {
  freshness?: {
    signals?: { stale_after?: string };
    events?: { stale_after?: string };
  };
  bundle?: {
    signals?: { signals?: Signal[] };
    events?: { events?: Event[] };
  };
};

type FeedItem = {
  id: string;
  kind: "signal" | "event";
  title: string;
  description?: string;
  timestamp: string;
  expiresAt?: string;
  meta?: string;
  district?: string;
  tags: string[];
};

const LENSES: Array<{ key: LensKey; label: string; hint: string }> = [
  { key: "all", label: "Everything", hint: "The whole city" },
  { key: "tonight", label: "Tonight", hint: "What is building now" },
  { key: "events", label: "Events", hint: "Games, shows and gatherings" },
  { key: "food", label: "Food", hint: "Eating and drinking signals" },
  { key: "local", label: "Local pulse", hint: "District and community signals" },
  { key: "movement", label: "Movement", hint: "Transit, traffic and arrivals" },
];

function isFresh(staleAfter?: string) {
  if (!staleAfter) return false;
  const ts = new Date(staleAfter).getTime();
  return Number.isFinite(ts) && ts > Date.now();
}

function isCurrentOrUpcoming(expiresAt?: string) {
  if (!expiresAt) return true;
  const ts = new Date(expiresAt).getTime();
  return !Number.isFinite(ts) || ts > Date.now();
}

function pretty(value?: string) {
  return (value || "").replace(/[-_]/g, " ");
}

function normalizedText(item: FeedItem) {
  return [item.title, item.description, item.meta, item.district, ...item.tags].filter(Boolean).join(" ").toLowerCase();
}

function isTonight(timestamp: string) {
  const when = new Date(timestamp);
  const now = new Date();
  return when.getFullYear() === now.getFullYear() && when.getMonth() === now.getMonth() && when.getDate() === now.getDate();
}

function matchesLens(item: FeedItem, lens: LensKey) {
  if (lens === "all") return true;
  if (lens === "tonight") return isTonight(item.timestamp);

  const text = normalizedText(item);
  if (lens === "events") {
    return item.kind === "event" || /(concert|show|game|festival|event|sports|music|theater|theatre|arena|stadium)/.test(text);
  }
  if (lens === "food") {
    return /(food|restaurant|bar|dining|cocktail|coffee|brewery|brunch|dinner|lunch|market)/.test(text);
  }
  if (lens === "local") {
    return item.kind === "signal" && /(district|micro post|community|neighborhood|local|street|corridor|activity)/.test(text);
  }
  return /(transport|traffic|transit|arrival|airport|cruise|ship|train|bus|mobility|movement|road)/.test(text);
}

export default function CityActivityFeed({ citySlug, cityName }: { citySlug: string; cityName: string }) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [lastSeen, setLastSeen] = useState<number | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [lens, setLens] = useState<LensKey>("all");

  useEffect(() => {
    const key = `dcc:last-seen:${citySlug}`;
    try {
      const stored = window.localStorage.getItem(key);
      const parsed = stored ? Number(stored) : NaN;
      if (Number.isFinite(parsed)) setLastSeen(parsed);
    } catch {
      // local timestamp is optional only
    }
  }, [citySlug]);

  useEffect(() => {
    let cancelled = false;
    const key = `dcc:last-seen:${citySlug}`;

    const refresh = async () => {
      try {
        const response = await fetch(`/api/internal/live-city/${encodeURIComponent(citySlug)}`, {
          cache: "no-store",
          headers: { "x-dcc-surface": "city-activity-feed" },
        });
        if (!response.ok) throw new Error(String(response.status));
        const next = (await response.json()) as Payload;
        if (cancelled) return;
        setPayload(next);
        setCheckedAt(new Date());
      } catch {
        if (!cancelled) setPayload(null);
      }
    };

    refresh();
    const timer = window.setInterval(refresh, 60_000);

    const markSeen = () => {
      try {
        window.localStorage.setItem(key, String(Date.now()));
      } catch {
        // no-op
      }
    };
    const seenTimer = window.setTimeout(markSeen, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearTimeout(seenTimer);
    };
  }, [citySlug]);

  const items = useMemo<FeedItem[]>(() => {
    const next: FeedItem[] = [];
    if (isFresh(payload?.freshness?.signals?.stale_after)) {
      for (const signal of payload?.bundle?.signals?.signals || []) {
        if (!signal.starts_at || !isCurrentOrUpcoming(signal.expires_at)) continue;
        next.push({
          id: `signal:${signal.id}`,
          kind: "signal",
          title: signal.title,
          description: signal.description,
          timestamp: signal.starts_at,
          expiresAt: signal.expires_at,
          meta: [signal.impact_level, signal.provenance, signal.signal_type].filter(Boolean).map(pretty).join(" • "),
          district: signal.affected_district_slugs?.[0],
          tags: [signal.signal_type, signal.provenance, signal.linked_place_slug, signal.linked_venue_slug].filter(Boolean) as string[],
        });
      }
    }

    if (isFresh(payload?.freshness?.events?.stale_after)) {
      for (const event of payload?.bundle?.events?.events || []) {
        if (!event.start_time || event.status === "cancelled" || !isCurrentOrUpcoming(event.end_time)) continue;
        next.push({
          id: `event:${event.id}`,
          kind: "event",
          title: event.title,
          timestamp: event.start_time,
          expiresAt: event.end_time,
          meta: ["event", event.status, event.category].filter(Boolean).map(pretty).join(" • "),
          tags: [event.category, event.venue_slug, event.status].filter(Boolean) as string[],
        });
      }
    }

    return next
      .filter((item) => new Date(item.timestamp).getTime() <= Date.now() + 48 * 60 * 60 * 1000)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 16);
  }, [payload]);

  const filteredItems = useMemo(() => items.filter((item) => matchesLens(item, lens)).slice(0, 8), [items, lens]);

  if (!items.length) return null;

  const newCount = lastSeen === null ? 0 : items.filter((item) => new Date(item.timestamp).getTime() > lastSeen).length;
  const activeLens = LENSES.find((candidate) => candidate.key === lens) ?? LENSES[0];

  return (
    <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,12,25,0.97),rgba(4,8,17,0.98))] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-200">City Feed</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">
            What changed around {cityName}
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/66">
            Pick a lens and DCC re-reads the same fresh city signals from that point of view. Nothing dynamic is turned into permanent destination content.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {lastSeen !== null ? (
            <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-amber-100">
              {newCount} since last look
            </span>
          ) : null}
          <Link
            href={`/${citySlug}/now`}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/72 hover:bg-white/10"
          >
            Open full now view →
          </Link>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/38">Look through a lens</p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {LENSES.map((candidate) => {
            const selected = candidate.key === lens;
            const count = items.filter((item) => matchesLens(item, candidate.key)).length;
            return (
              <button
                key={candidate.key}
                type="button"
                onClick={() => setLens(candidate.key)}
                className={
                  selected
                    ? "min-w-max rounded-2xl border border-cyan-300/35 bg-cyan-300/12 px-4 py-3 text-left text-cyan-50"
                    : "min-w-max rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-left text-white/68 hover:bg-white/[0.06]"
                }
              >
                <span className="block text-xs font-black uppercase tracking-[0.13em]">{candidate.label}</span>
                <span className="mt-1 block text-[10px] text-white/38">{candidate.hint} • {count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/70">Current lens</p>
          <p className="mt-1 text-sm font-semibold text-white">{activeLens.label}</p>
        </div>
        <span className="text-xs text-white/36">{filteredItems.length} visible</span>
      </div>

      {filteredItems.length ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {filteredItems.map((item) => {
            const ts = new Date(item.timestamp).getTime();
            const isNew = lastSeen !== null && ts > lastSeen;
            return (
              <article key={item.id} className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-white/46">
                      <span>{item.kind === "event" ? "Event" : "Signal"}</span>
                      {item.meta ? <span>• {item.meta}</span> : null}
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-white">{item.title}</h3>
                  </div>
                  {isNew ? (
                    <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-100">new</span>
                  ) : null}
                </div>
                {item.description ? <p className="mt-2 text-sm leading-5 text-white/56">{item.description}</p> : null}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/38">
                  <span>{new Date(item.timestamp).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}</span>
                  {item.district ? (
                    <Link href={`/${citySlug}/watch/${item.district}`} className="text-cyan-200/75 hover:text-cyan-100">
                      {pretty(item.district)} →
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.035] p-5 text-sm text-white/48">
          No fresh signals match this lens right now. DCC leaves it quiet instead of filling the space with stale or invented activity.
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/36">
        {checkedAt ? <span>Checked {checkedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span> : null}
        <span>Refreshes every minute</span>
        <span>Dynamic request: no-store</span>
      </div>
    </section>
  );
}
