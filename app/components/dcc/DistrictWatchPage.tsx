"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type District = {
  slug: string;
  name: string;
  district_type?: string;
  vibe_tags?: string[];
};

type Signal = {
  id: string;
  title: string;
  description?: string;
  impact_level?: string;
  provenance?: string;
  affected_district_slugs?: string[];
  starts_at?: string;
  expires_at?: string;
  pro_tip?: string;
};

type Event = {
  id: string;
  title: string;
  status?: string;
  impact_level?: string;
  start_time?: string;
  end_time?: string;
  venue_slug?: string;
  description?: string;
};

type Venue = {
  slug: string;
  name: string;
  category?: string;
  district_slugs?: string[];
};

type Place = {
  slug: string;
  name: string;
  category?: string;
  tags?: string[];
  district_slugs?: string[];
};

type Payload = {
  ok?: boolean;
  freshness?: {
    signals?: { stale_after?: string };
    events?: { stale_after?: string };
  };
  bundle?: {
    districts?: { districts?: District[] };
    signals?: { signals?: Signal[] };
    events?: { events?: Event[] };
    venues?: { venues?: Venue[] };
    places?: { places?: Place[] };
  };
};

function freshUntil(value?: string) {
  if (!value) return false;
  const t = new Date(value).getTime();
  return Number.isFinite(t) && t > Date.now();
}

function notExpired(value?: string) {
  if (!value) return true;
  const t = new Date(value).getTime();
  return !Number.isFinite(t) || t > Date.now();
}

export default function DistrictWatchPage({ citySlug, districtSlug }: { citySlug: string; districtSlug: string }) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await fetch(`/api/internal/live-city/${encodeURIComponent(citySlug)}`, {
          cache: "no-store",
          headers: { "x-dcc-surface": "district-watch" },
        });
        if (!res.ok) throw new Error(String(res.status));
        const next = (await res.json()) as Payload;
        if (!cancelled) {
          setPayload(next);
          setCheckedAt(new Date());
        }
      } catch {
        if (!cancelled) {
          setPayload(null);
          setCheckedAt(new Date());
        }
      }
    };

    refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [citySlug]);

  const district = useMemo(
    () => payload?.bundle?.districts?.districts?.find((item) => item.slug === districtSlug) || null,
    [payload, districtSlug]
  );

  const signalsFresh = freshUntil(payload?.freshness?.signals?.stale_after);
  const eventsFresh = freshUntil(payload?.freshness?.events?.stale_after);

  const signals = useMemo(() => {
    if (!signalsFresh) return [];
    return (payload?.bundle?.signals?.signals || [])
      .filter((signal) => signal.affected_district_slugs?.includes(districtSlug))
      .filter((signal) => notExpired(signal.expires_at))
      .slice(0, 12);
  }, [payload, districtSlug, signalsFresh]);

  const venues = useMemo(
    () => (payload?.bundle?.venues?.venues || []).filter((venue) => venue.district_slugs?.includes(districtSlug)).slice(0, 12),
    [payload, districtSlug]
  );

  const places = useMemo(
    () => (payload?.bundle?.places?.places || []).filter((place) => place.district_slugs?.includes(districtSlug)).slice(0, 12),
    [payload, districtSlug]
  );

  const venueSet = useMemo(() => new Set(venues.map((venue) => venue.slug)), [venues]);
  const events = useMemo(() => {
    if (!eventsFresh) return [];
    return (payload?.bundle?.events?.events || [])
      .filter((event) => (event.venue_slug ? venueSet.has(event.venue_slug) : false))
      .filter((event) => notExpired(event.end_time || event.start_time))
      .slice(0, 12);
  }, [payload, venueSet, eventsFresh]);

  if (!payload) {
    return (
      <main className="min-h-screen bg-[#050816] px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Link href={`/${citySlug}`} className="text-sm text-cyan-200">← Back to city watch</Link>
          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">District watch</p>
            <h1 className="mt-3 text-3xl font-black uppercase">Checking this part of the city…</h1>
            <p className="mt-3 text-white/60">Live signals are fetched at request time and are not treated as permanent facts.</p>
          </div>
        </div>
      </main>
    );
  }

  if (!district) {
    return (
      <main className="min-h-screen bg-[#050816] px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Link href={`/${citySlug}`} className="text-sm text-cyan-200">← Back to city watch</Link>
          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-8">
            <h1 className="text-3xl font-black uppercase">District unavailable</h1>
            <p className="mt-3 text-white/60">DCC does not have a current district record for this route.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <Link href={`/${citySlug}`} className="text-sm font-semibold text-cyan-200">← Back to city watch</Link>

        <section className="rounded-[32px] border border-cyan-300/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),linear-gradient(180deg,rgba(9,16,31,0.98),rgba(4,8,17,0.99))] p-7 sm:p-9">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200">DCC District Watch</p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] sm:text-5xl">{district.name}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">
            This is the city-stalking view for one part of town: permanent neighborhood identity underneath, current public activity layered on top only while it is still fresh.
          </p>
          {district.vibe_tags?.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {district.vibe_tags.slice(0, 6).map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">{tag}</span>
              ))}
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Current public signals</p>
            <div className="mt-2 text-3xl font-black">{signals.length}</div>
            <p className="mt-2 text-sm text-white/50">{signalsFresh ? "Fresh signal window open" : "No fresh signal window"}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Current events</p>
            <div className="mt-2 text-3xl font-black">{events.length}</div>
            <p className="mt-2 text-sm text-white/50">{eventsFresh ? "Fresh event window open" : "No fresh event window"}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Static anchors</p>
            <div className="mt-2 text-3xl font-black">{venues.length + places.length}</div>
            <p className="mt-2 text-sm text-white/50">Venues and places that define the district</p>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6 sm:p-7">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">What is happening here now</p>
          {signals.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {signals.map((signal) => (
                <article key={signal.id} className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
                    <span>{signal.impact_level || "current"}</span>
                    <span>•</span>
                    <span>{signal.provenance || "public signal"}</span>
                  </div>
                  <h2 className="mt-2 text-lg font-bold">{signal.title}</h2>
                  {signal.description ? <p className="mt-2 text-sm leading-6 text-white/60">{signal.description}</p> : null}
                  {signal.pro_tip ? <p className="mt-3 text-sm text-cyan-100/75">{signal.pro_tip}</p> : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-white/50">Nothing is being presented as live here unless DCC can verify that the source window is still fresh.</p>
          )}
        </section>

        {events.length ? (
          <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6 sm:p-7">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Events shaping this district</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {events.map((event) => (
                <article key={event.id} className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <h2 className="text-lg font-bold">{event.title}</h2>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-white/45">
                    {[event.status, event.impact_level, event.start_time ? new Date(event.start_time).toLocaleString() : null].filter(Boolean).join(" • ")}
                  </p>
                  {event.description ? <p className="mt-2 text-sm leading-6 text-white/60">{event.description}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">Places that define the area</p>
            <div className="mt-4 space-y-2">
              {places.length ? places.map((place) => (
                <div key={place.slug} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="font-semibold">{place.name}</p>
                  <p className="mt-1 text-xs text-white/45">{[place.category, ...(place.tags || []).slice(0, 2)].filter(Boolean).join(" • ")}</p>
                </div>
              )) : <p className="text-sm text-white/45">No place anchors loaded for this district.</p>}
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">Venues that move the area</p>
            <div className="mt-4 space-y-2">
              {venues.length ? venues.map((venue) => (
                <div key={venue.slug} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="font-semibold">{venue.name}</p>
                  <p className="mt-1 text-xs text-white/45">{venue.category || "district venue"}</p>
                </div>
              )) : <p className="text-sm text-white/45">No venue anchors loaded for this district.</p>}
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/35">
          {checkedAt ? <span>Live sources checked {checkedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span> : null}
          <span>Dynamic request: no-store</span>
          <span>No individual tracking</span>
        </div>
      </div>
    </main>
  );
}
