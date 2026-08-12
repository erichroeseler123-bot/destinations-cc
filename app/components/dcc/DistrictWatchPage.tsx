"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import cityRegistryJson from "@/data/cities/index.json";

type District = { slug: string; name: string; district_type?: string; vibe_tags?: string[]; center?: { lat?: number; lng?: number } };
type Signal = { id: string; title: string; description?: string; impact_level?: string; provenance?: string; affected_district_slugs?: string[]; starts_at?: string; expires_at?: string; pro_tip?: string };
type Event = { id: string; title: string; status?: string; impact_level?: string; start_time?: string; end_time?: string; venue_slug?: string; description?: string };
type Venue = { slug: string; name: string; category?: string; district_slugs?: string[] };
type Place = { slug: string; name: string; category?: string; tags?: string[]; district_slugs?: string[] };
type Payload = {
  freshness?: { signals?: { stale_after?: string }; events?: { stale_after?: string } };
  bundle?: { districts?: { districts?: District[] }; signals?: { signals?: Signal[] }; events?: { events?: Event[] }; venues?: { venues?: Venue[] }; places?: { places?: Place[] } };
};
type DistrictNow = {
  slug: string; name: string; label: string; tone: string; signalCount: number; eventCount: number;
  center?: { lat: number; lng: number } | null; vibe_tags?: string[];
  signals?: Array<{ id: string; title: string; kind: string; provider: string; severity?: string | null; updatedAt?: string | null }>;
  events?: Array<{ id: string; name: string; venue?: string | null; category?: string | null; start?: string | null }>;
};
type PublicPayload = { districtNow?: DistrictNow[]; checkedAt?: string };
type CommercialExit = { label: string; description: string; href: string; eyebrow: string };

const COMMERCIAL_EXITS: Record<string, CommercialExit> = {
  "new-orleans": {
    label: "Explore New Orleans tours",
    description: "Move from neighborhood research into bookable city, swamp, plantation, river and combination experiences.",
    href: "https://welcometoneworleanstours.com/tours",
    eyebrow: "Relevant booking path",
  },
  juneau: {
    label: "Explore Juneau shore excursions",
    description: "Continue from live Juneau context into shore-excursion options built for cruise visitors.",
    href: "https://lastfrontiershoreexcursions.com/",
    eyebrow: "Relevant booking path",
  },
  "wisconsin-dells": {
    label: "Explore Wisconsin Dells",
    description: "Continue into the dedicated Dells destination site for attractions and trip planning.",
    href: "https://welcometothedells.com/",
    eyebrow: "Destination handoff",
  },
  "las-vegas": {
    label: "Explore Las Vegas options",
    description: "Continue into the Strip-focused destination property when you are ready to compare things to do.",
    href: "https://saveonthestrip.com/",
    eyebrow: "Destination handoff",
  },
  denver: {
    label: "Need private Colorado transportation?",
    description: "GoSno handles private airport and resort transportation when getting there is the next problem to solve.",
    href: "https://gosno.co/",
    eyebrow: "Transportation handoff",
  },
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
  const [publicPayload, setPublicPayload] = useState<PublicPayload | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const cityRecord = useMemo(() => cityRegistryJson.cities.find((city) => city.slug === citySlug) || null, [citySlug]);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const query = cityRecord?.centroid
        ? new URLSearchParams({ city: citySlug, lat: String(cityRecord.centroid.lat), lng: String(cityRecord.centroid.lng), timezone: cityRecord.timezone || "auto" })
        : null;
      const [internalResult, publicResult] = await Promise.allSettled([
        fetch(`/api/internal/live-city/${encodeURIComponent(citySlug)}`, { cache: "no-store", headers: { "x-dcc-surface": "district-watch" } }),
        query ? fetch(`/api/public/city-live?${query.toString()}`, { cache: "no-store" }) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      let internalPayload: Payload | null = null;
      let livePayload: PublicPayload | null = null;
      if (internalResult.status === "fulfilled" && internalResult.value?.ok) internalPayload = await internalResult.value.json();
      if (publicResult.status === "fulfilled" && publicResult.value?.ok) livePayload = await publicResult.value.json();
      setPayload(internalPayload);
      setPublicPayload(livePayload);
      setCheckedAt(new Date());
    };
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [citySlug, cityRecord]);

  const liveDistrict = useMemo(() => publicPayload?.districtNow?.find((item) => item.slug === districtSlug) || null, [publicPayload, districtSlug]);
  const internalDistrict = useMemo(() => payload?.bundle?.districts?.districts?.find((item) => item.slug === districtSlug) || null, [payload, districtSlug]);
  const district: District | null = internalDistrict || (liveDistrict ? { slug: liveDistrict.slug, name: liveDistrict.name, vibe_tags: liveDistrict.vibe_tags || [], center: liveDistrict.center || undefined } : null);

  const signalsFresh = freshUntil(payload?.freshness?.signals?.stale_after);
  const eventsFresh = freshUntil(payload?.freshness?.events?.stale_after);
  const signals = useMemo(() => signalsFresh ? (payload?.bundle?.signals?.signals || []).filter((signal) => signal.affected_district_slugs?.includes(districtSlug)).filter((signal) => notExpired(signal.expires_at)).slice(0, 12) : [], [payload, districtSlug, signalsFresh]);
  const venues = useMemo(() => (payload?.bundle?.venues?.venues || []).filter((venue) => venue.district_slugs?.includes(districtSlug)).slice(0, 12), [payload, districtSlug]);
  const places = useMemo(() => (payload?.bundle?.places?.places || []).filter((place) => place.district_slugs?.includes(districtSlug)).slice(0, 12), [payload, districtSlug]);
  const venueSet = useMemo(() => new Set(venues.map((venue) => venue.slug)), [venues]);
  const events = useMemo(() => eventsFresh ? (payload?.bundle?.events?.events || []).filter((event) => event.venue_slug ? venueSet.has(event.venue_slug) : false).filter((event) => notExpired(event.end_time || event.start_time)).slice(0, 12) : [], [payload, venueSet, eventsFresh]);

  if (!district && !checkedAt) {
    return <main className="min-h-screen bg-[#050816] px-4 py-10 text-white sm:px-6"><div className="mx-auto max-w-5xl"><Link href={`/${citySlug}`} className="text-sm text-cyan-200">← Back to city watch</Link><div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-8"><p className="text-xs uppercase tracking-[0.2em] text-white/50">District watch</p><h1 className="mt-3 text-3xl font-black uppercase">Checking this part of the city…</h1></div></div></main>;
  }

  if (!district) {
    return <main className="min-h-screen bg-[#050816] px-4 py-10 text-white sm:px-6"><div className="mx-auto max-w-5xl"><Link href={`/${citySlug}`} className="text-sm text-cyan-200">← Back to city watch</Link><div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-8"><h1 className="text-3xl font-black uppercase">District unavailable</h1><p className="mt-3 text-white/60">DCC does not have a durable district record for this route.</p></div></div></main>;
  }

  const streetViewHref = typeof district.center?.lat === "number" && typeof district.center?.lng === "number"
    ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${district.center.lat},${district.center.lng}`
    : null;
  const commercialExit = COMMERCIAL_EXITS[citySlug] || null;
  const liveEvents = liveDistrict?.events || [];
  const liveSignals = liveDistrict?.signals || [];
  const firstLiveEvent = liveEvents[0] || null;
  const character = (district.vibe_tags || []).slice(0, 4);

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <Link href={`/${citySlug}`} className="text-sm font-semibold text-cyan-200">← Back to city watch</Link>

        <section className="rounded-[32px] border border-cyan-300/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),linear-gradient(180deg,rgba(9,16,31,0.98),rgba(4,8,17,0.99))] p-7 sm:p-9">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200">DCC District Watch</p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] sm:text-5xl">{district.name}</h1>
          {liveDistrict ? <p className="mt-3 text-sm font-black uppercase tracking-[0.16em] text-emerald-200">{liveDistrict.label}</p> : null}
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">Permanent neighborhood identity underneath, current public activity layered on top only when DCC has a fresh geolocated source.</p>
          {character.length ? <div className="mt-5 flex flex-wrap gap-2">{character.map((tag) => <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">{tag}</span>)}</div> : null}
        </section>

        <section className="rounded-[30px] border border-emerald-300/15 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(34,211,238,0.035))] p-6 sm:p-7">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-200">What should I do from here?</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {firstLiveEvent ? (
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200/70">Happening nearby</p>
                <h2 className="mt-2 font-black text-white">{firstLiveEvent.name}</h2>
                <p className="mt-2 text-sm leading-5 text-white/52">{firstLiveEvent.venue || firstLiveEvent.category || "Current event mapped to this district."}</p>
                {firstLiveEvent.start ? <p className="mt-3 text-xs text-white/35">{new Date(firstLiveEvent.start).toLocaleString()}</p> : null}
              </div>
            ) : (
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">Live opportunity</p>
                <h2 className="mt-2 font-black text-white">No verified event is driving this district right now</h2>
                <p className="mt-2 text-sm leading-5 text-white/48">DCC will not invent one. Use the district character and look-around view instead.</p>
              </div>
            )}

            {streetViewHref ? (
              <a href={streetViewHref} target="_blank" rel="noopener noreferrer" className="group rounded-[22px] border border-cyan-300/15 bg-cyan-300/[0.055] p-4 transition hover:border-cyan-200/30 hover:bg-cyan-300/[0.09]">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200/70">See it yourself</p>
                <h2 className="mt-2 font-black text-white">Look around this district</h2>
                <p className="mt-2 text-sm leading-5 text-white/52">Open Google Street View at the durable district center and visually explore before you go.</p>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-cyan-100">Open Street View →</p>
              </a>
            ) : null}

            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">Best use of this area</p>
              <h2 className="mt-2 font-black text-white">{character.length ? character.join(" • ") : "Explore the district"}</h2>
              <p className="mt-2 text-sm leading-5 text-white/48">This is durable neighborhood character, not a claim about what every block or person is doing right now.</p>
            </div>

            {commercialExit ? (
              <a href={commercialExit.href} target="_blank" rel="noopener noreferrer" className="group rounded-[22px] border border-amber-300/15 bg-amber-300/[0.055] p-4 transition hover:border-amber-200/30 hover:bg-amber-300/[0.09]">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-200/70">{commercialExit.eyebrow}</p>
                <h2 className="mt-2 font-black text-white">{commercialExit.label}</h2>
                <p className="mt-2 text-sm leading-5 text-white/52">{commercialExit.description}</p>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-amber-100">Continue →</p>
              </a>
            ) : null}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Live district signals</p><div className="mt-2 text-3xl font-black">{liveDistrict?.signalCount ?? signals.length}</div><p className="mt-2 text-sm text-white/50">Only geolocated current signals count here</p></div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Live district events</p><div className="mt-2 text-3xl font-black">{liveDistrict?.eventCount ?? events.length}</div><p className="mt-2 text-sm text-white/50">Current event locations mapped to this district</p></div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Durable context</p><div className="mt-2 text-3xl font-black">{venues.length + places.length || character.length}</div><p className="mt-2 text-sm text-white/50">Static anchors and district identity</p></div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6 sm:p-7">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">What is happening here now</p>
          {(liveSignals.length || liveEvents.length) ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {liveEvents.map((event) => <article key={event.id} className="rounded-[20px] border border-white/10 bg-black/20 p-4"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">event {event.start ? `• ${new Date(event.start).toLocaleString()}` : ""}</p><h2 className="mt-2 text-lg font-bold">{event.name}</h2><p className="mt-2 text-sm text-white/55">{event.venue || event.category || "Current city event"}</p></article>)}
              {liveSignals.map((signal) => <article key={signal.id} className="rounded-[20px] border border-white/10 bg-black/20 p-4"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">{signal.kind} • {signal.provider}</p><h2 className="mt-2 text-lg font-bold">{signal.title}</h2></article>)}
            </div>
          ) : signals.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">{signals.map((signal) => <article key={signal.id} className="rounded-[20px] border border-white/10 bg-black/20 p-4"><h2 className="text-lg font-bold">{signal.title}</h2>{signal.description ? <p className="mt-2 text-sm leading-6 text-white/60">{signal.description}</p> : null}</article>)}</div>
          ) : <p className="mt-4 text-sm leading-6 text-white/50">No verified geolocated live activity is mapped to this district right now. That is different from saying the district is empty.</p>}
        </section>

        {(places.length || venues.length) ? <section className="grid gap-4 lg:grid-cols-2"><div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6"><p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">Places that define the area</p><div className="mt-4 space-y-2">{places.map((place) => <div key={place.slug} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"><p className="font-semibold">{place.name}</p><p className="mt-1 text-xs text-white/45">{[place.category, ...(place.tags || []).slice(0, 2)].filter(Boolean).join(" • ")}</p></div>)}</div></div><div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6"><p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">Venues that move the area</p><div className="mt-4 space-y-2">{venues.map((venue) => <div key={venue.slug} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"><p className="font-semibold">{venue.name}</p><p className="mt-1 text-xs text-white/45">{venue.category || "district venue"}</p></div>)}</div></div></section> : null}

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/35">{checkedAt ? <span>Live sources checked {checkedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span> : null}<span>Refreshes every minute</span><span>Dynamic request: no-store</span><span>No individual tracking</span></div>
      </div>
    </main>
  );
}
