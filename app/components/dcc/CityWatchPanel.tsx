"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import LookAroundCityMap from "@/app/components/dcc/LookAroundCityMap";

type District = { slug: string; name: string; vibe_tags?: string[]; center?: { lat?: number; lng?: number } };
type Signal = { id: string; title: string; affected_district_slugs?: string[]; expires_at?: string };
type LiveCityPayload = {
  freshness?: { signals?: { as_of?: string; stale_after?: string } };
  bundle?: { districts?: { districts?: District[] }; signals?: { signals?: Signal[] } };
};
type DistrictNowState = {
  slug: string; name: string; label: string; tone: string; signalCount: number; eventCount: number;
  center?: { lat: number; lng: number } | null; vibe_tags?: string[];
  signals?: Array<{ id: string; title: string; kind: string; provider: string }>;
  events?: Array<{ id: string; name: string; venue?: string | null; start?: string | null }>;
};
type IntentMatch = { slug: string; name: string; liveLabel: string; reasons: string[]; eventCount: number; signalCount: number };
type IntentGroup = { intent: string; label: string; matches: IntentMatch[] };
type PublicLivePayload = { districtNow?: DistrictNowState[]; districtIntents?: { ephemeral?: boolean; method?: string; intents?: IntentGroup[] } };
type LiveView = { label: string; href: string; source: string };

const LIVE_VIEWS: Record<string, LiveView[]> = {
  denver: [{ label: "Downtown Denver live image", href: "https://www.colorado.gov/airquality/live_image.aspx", source: "Colorado Department of Public Health & Environment" }],
  "las-vegas": [{ label: "Las Vegas live city stream", href: "https://www.lasvegasnevada.gov/News/Watch-City-of-Las-Vegas-TV/Live/live", source: "City of Las Vegas" }],
};

function stillFresh(value?: string) {
  if (!value) return false;
  const t = new Date(value).getTime();
  return Number.isFinite(t) && t > Date.now();
}
function signalIsCurrent(signal: Signal) {
  if (!signal.expires_at) return true;
  const t = new Date(signal.expires_at).getTime();
  return !Number.isFinite(t) || t > Date.now();
}

export default function CityWatchPanel({ citySlug, cityName, suppressRepoSignals = false, lat, lng, timezone }: {
  citySlug: string; cityName: string; suppressRepoSignals?: boolean; lat?: number; lng?: number; timezone?: string;
}) {
  const [payload, setPayload] = useState<LiveCityPayload | null>(null);
  const [publicLive, setPublicLive] = useState<PublicLivePayload | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [status, setStatus] = useState<"loading" | "live" | "quiet">("loading");
  const [activeIntent, setActiveIntent] = useState("lively");

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const query = typeof lat === "number" && typeof lng === "number"
        ? new URLSearchParams({ city: citySlug, lat: String(lat), lng: String(lng), timezone: timezone || "auto" })
        : null;
      const [internalResult, publicResult] = await Promise.allSettled([
        fetch(`/api/internal/live-city/${encodeURIComponent(citySlug)}`, { cache: "no-store", headers: { "x-dcc-surface": "city-watch" } }),
        query ? fetch(`/api/public/city-live?${query.toString()}`, { cache: "no-store" }) : Promise.resolve(null),
      ]);
      if (cancelled) return;

      let internalPayload: LiveCityPayload | null = null;
      let publicPayload: PublicLivePayload | null = null;
      if (internalResult.status === "fulfilled" && internalResult.value?.ok) internalPayload = await internalResult.value.json();
      if (publicResult.status === "fulfilled" && publicResult.value?.ok) publicPayload = await publicResult.value.json();

      setPayload(internalPayload);
      setPublicLive(publicPayload);
      setCheckedAt(new Date());
      setStatus(internalPayload || publicPayload ? "live" : "quiet");
    };
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [citySlug, lat, lng, timezone]);

  const freshSignals = useMemo(() => {
    if (suppressRepoSignals || !stillFresh(payload?.freshness?.signals?.stale_after)) return [];
    return (payload?.bundle?.signals?.signals || []).filter(signalIsCurrent);
  }, [payload, suppressRepoSignals]);

  const internalDistricts = payload?.bundle?.districts?.districts || [];
  const publicDistricts = publicLive?.districtNow || [];
  const districtNowBySlug = useMemo(() => new Map(publicDistricts.map((item) => [item.slug, item])), [publicDistricts]);

  const districtReads = useMemo(() => {
    const source: District[] = internalDistricts.length
      ? internalDistricts
      : publicDistricts.map((item) => ({ slug: item.slug, name: item.name, vibe_tags: item.vibe_tags || [], center: item.center || undefined }));
    return source.slice(0, 12).map((district) => ({
      district,
      liveState: districtNowBySlug.get(district.slug),
      signals: freshSignals.filter((signal) => signal.affected_district_slugs?.includes(district.slug)).slice(0, 3),
    }));
  }, [internalDistricts, publicDistricts, districtNowBySlug, freshSignals]);

  const streetViewDistricts = useMemo(() => districtReads
    .filter(({ district }) => typeof district.center?.lat === "number" && typeof district.center?.lng === "number")
    .map(({ district }) => ({ slug: district.slug, name: district.name, lat: district.center!.lat as number, lng: district.center!.lng as number, vibeTags: district.vibe_tags })),
  [districtReads]);

  const intentGroups = publicLive?.districtIntents?.intents || [];
  const activeGroup = intentGroups.find((group) => group.intent === activeIntent) || intentGroups[0] || null;
  const bestMatch = activeGroup?.matches?.[0] || null;
  const liveViews = LIVE_VIEWS[citySlug] || [];
  if (!districtReads.length && !liveViews.length && !streetViewDistricts.length) return null;

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,12,25,0.97),rgba(4,8,17,0.98))] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200">City Watch</p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">Where should I go in {cityName} right now?</h2>
            <p className="mt-3 text-sm leading-6 text-white/68">Pick the kind of city experience you want. DCC combines permanent district character with current geolocated activity, then shows why each district fits instead of hiding the answer behind a made-up buzz score.</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/64">
            {status === "loading" ? "checking" : publicDistricts.length ? "district states live" : "district structure live"}
          </span>
        </div>

        {intentGroups.length ? (
          <div className="mt-6 rounded-[24px] border border-cyan-300/15 bg-cyan-300/[0.045] p-4 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/75">Pick your lens</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {intentGroups.map((group) => (
                <button key={group.intent} type="button" onClick={() => setActiveIntent(group.intent)} className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${activeGroup?.intent === group.intent ? "border-cyan-200/40 bg-cyan-200 text-slate-950" : "border-white/10 bg-black/20 text-white/65 hover:bg-white/10"}`}>
                  {group.label}
                </button>
              ))}
            </div>

            {bestMatch && activeGroup ? (
              <div className="mt-5 rounded-[22px] border border-emerald-300/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(34,211,238,0.06))] p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-2xl">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200/75">Best match now • {activeGroup.label}</p>
                    <h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white">{bestMatch.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/60">{bestMatch.reasons.length ? bestMatch.reasons.join(" • ") : "Best current fit from district context and live activity."}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.12em] text-white/36">{bestMatch.liveLabel} • {bestMatch.eventCount} events • {bestMatch.signalCount} live signals</p>
                  </div>
                  <Link href={`/${citySlug}/watch/${bestMatch.slug}`} className="rounded-full bg-emerald-300 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-emerald-200">
                    Open this district →
                  </Link>
                </div>
              </div>
            ) : null}

            {activeGroup ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {activeGroup.matches.length ? activeGroup.matches.slice(1, 4).map((match, index) => (
                  <Link key={`${activeGroup.intent}:${match.slug}`} href={`/${citySlug}/watch/${match.slug}`} className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-cyan-300/25 hover:bg-white/[0.06]">
                    <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200/65">Alternative #{index + 2}</span><span className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-200/65">{match.liveLabel}</span></div>
                    <h3 className="mt-2 text-lg font-black uppercase tracking-[-0.02em] text-white">{match.name}</h3>
                    <p className="mt-2 text-xs leading-5 text-white/50">{match.reasons.length ? match.reasons.join(" • ") : "Strong current fit from district context"}</p>
                  </Link>
                )) : <p className="text-sm text-white/45">No district has enough verified context for this lens right now.</p>}
              </div>
            ) : null}
            <p className="mt-4 text-[10px] text-white/30">{publicLive?.districtIntents?.method || "District recommendations use durable context plus current live activity."}</p>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {districtReads.map(({ district, liveState, signals }) => (
            <Link key={district.slug} href={`/${citySlug}/watch/${district.slug}`} className="group rounded-[22px] border border-white/10 bg-white/[0.045] p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.07]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black uppercase tracking-[-0.02em] text-white">{district.name}</h3>
                  {liveState ? <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200/80">{liveState.label}</p> : null}
                </div>
                {liveState ? <span className={`mt-1 h-2.5 w-2.5 rounded-full ${(liveState.signalCount + liveState.eventCount) > 0 ? "bg-emerald-300" : "bg-white/20"}`} /> : null}
              </div>
              {district.vibe_tags?.length ? <p className="mt-2 text-xs leading-5 text-white/48">{district.vibe_tags.slice(0, 3).join(" • ")}</p> : null}
              {liveState ? (
                <div className="mt-4 space-y-2">
                  {(liveState.events || []).slice(0, 2).map((event) => <div key={event.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"><p className="text-sm font-semibold text-white/88">{event.name}</p><p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-cyan-200/65">{event.venue || "live event"}</p></div>)}
                  {(liveState.signals || []).slice(0, 2).map((signal) => <div key={signal.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"><p className="text-sm font-semibold text-white/88">{signal.title}</p><p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-cyan-200/65">{signal.kind} • {signal.provider}</p></div>)}
                  {(liveState.signalCount + liveState.eventCount) === 0 ? <p className="text-sm leading-5 text-white/42">No geolocated live activity is mapped here right now.</p> : null}
                </div>
              ) : signals.length ? <p className="mt-4 text-sm leading-5 text-white/42">{signals.length} fresh district signal{signals.length === 1 ? "" : "s"}.</p> : <p className="mt-4 text-sm leading-5 text-white/42">Permanent district identity and Street View are available; no verified district-level live signal is mapped right now.</p>}
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200/70 group-hover:text-cyan-100">Stalk this district →</p>
            </Link>
          ))}
        </div>

        {liveViews.length ? <div className="mt-6 border-t border-white/10 pt-5"><p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/52">Official live views</p><div className="mt-3 flex flex-wrap gap-3">{liveViews.map((view) => <a key={view.href} href={view.href} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100 transition hover:bg-cyan-300/15"><span className="font-semibold">{view.label}</span><span className="mt-1 block text-xs text-white/46">Source: {view.source}</span></a>)}</div></div> : null}
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/38">{checkedAt ? <span>Checked: {checkedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span> : null}<span>Refreshes every minute</span><span>Dynamic request: no-store</span><span>Only geolocated signals are neighborhood-mapped</span></div>
      </section>
      <LookAroundCityMap citySlug={citySlug} cityName={cityName} districts={streetViewDistricts} />
    </div>
  );
}
