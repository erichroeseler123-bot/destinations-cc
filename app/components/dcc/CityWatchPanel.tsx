"use client";

import { useEffect, useMemo, useState } from "react";

type District = {
  slug: string;
  name: string;
  vibe_tags?: string[];
};

type Signal = {
  id: string;
  title: string;
  description?: string;
  impact_level?: string;
  provenance?: string;
  affected_district_slugs?: string[];
  expires_at?: string;
};

type LiveCityPayload = {
  ok?: boolean;
  freshness?: {
    signals?: { as_of?: string; stale_after?: string; ttl_seconds?: number };
  };
  bundle?: {
    districts?: { districts?: District[] };
    signals?: { signals?: Signal[] };
  };
};

type LiveView = { label: string; href: string; source: string };

const LIVE_VIEWS: Record<string, LiveView[]> = {
  denver: [
    {
      label: "Downtown Denver live image",
      href: "https://www.colorado.gov/airquality/live_image.aspx",
      source: "Colorado Department of Public Health & Environment",
    },
  ],
  "las-vegas": [
    {
      label: "Las Vegas live city stream",
      href: "https://www.lasvegasnevada.gov/News/Watch-City-of-Las-Vegas-TV/Live/live",
      source: "City of Las Vegas",
    },
  ],
};

function stillFresh(staleAfter?: string) {
  if (!staleAfter) return false;
  const value = new Date(staleAfter).getTime();
  return Number.isFinite(value) && value > Date.now();
}

function signalIsCurrent(signal: Signal) {
  if (!signal.expires_at) return true;
  const expires = new Date(signal.expires_at).getTime();
  return !Number.isFinite(expires) || expires > Date.now();
}

export default function CityWatchPanel({ citySlug, cityName }: { citySlug: string; cityName: string }) {
  const [payload, setPayload] = useState<LiveCityPayload | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [status, setStatus] = useState<"loading" | "live" | "quiet">("loading");

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const response = await fetch(`/api/internal/live-city/${encodeURIComponent(citySlug)}`, {
          cache: "no-store",
          headers: { "x-dcc-surface": "city-watch" },
        });
        if (!response.ok) throw new Error(String(response.status));
        const next = (await response.json()) as LiveCityPayload;
        if (cancelled) return;
        setPayload(next);
        setCheckedAt(new Date());
        setStatus("live");
      } catch {
        if (!cancelled) {
          setPayload(null);
          setCheckedAt(new Date());
          setStatus("quiet");
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

  const freshSignals = useMemo(() => {
    const freshDataset = stillFresh(payload?.freshness?.signals?.stale_after);
    if (!freshDataset) return [];
    return (payload?.bundle?.signals?.signals || []).filter(signalIsCurrent);
  }, [payload]);

  const districtReads = useMemo(() => {
    const districts = payload?.bundle?.districts?.districts || [];
    return districts.slice(0, 8).map((district) => ({
      district,
      signals: freshSignals.filter((signal) => signal.affected_district_slugs?.includes(district.slug)).slice(0, 3),
    }));
  }, [payload, freshSignals]);

  const liveViews = LIVE_VIEWS[citySlug] || [];
  const fresh = stillFresh(payload?.freshness?.signals?.stale_after);

  if (!districtReads.length && !liveViews.length) return null;

  return (
    <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,12,25,0.97),rgba(4,8,17,0.98))] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200">City Watch</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">
            Peek into {cityName} right now
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/68">
            Think of this as privacy-safe city stalking: public activity signals, districts, events and official live views — never individual tracking. Static neighborhood identity can persist; anything presented as current must still be fresh when you open the page.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/64">
          {status === "loading" ? "checking" : fresh ? "fresh public signals" : "no fresh signals"}
        </span>
      </div>

      {districtReads.length ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {districtReads.map(({ district, signals }) => (
            <article key={district.slug} className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-black uppercase tracking-[-0.02em] text-white">{district.name}</h3>
                <span className={`h-2.5 w-2.5 rounded-full ${signals.length ? "bg-emerald-300" : "bg-white/20"}`} />
              </div>
              {district.vibe_tags?.length ? (
                <p className="mt-2 text-xs leading-5 text-white/48">{district.vibe_tags.slice(0, 3).join(" • ")}</p>
              ) : null}
              {signals.length ? (
                <div className="mt-4 space-y-2">
                  {signals.map((signal) => (
                    <div key={signal.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      <p className="text-sm font-semibold text-white/88">{signal.title}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-cyan-200/70">
                        {signal.impact_level || "current"} • {signal.provenance || "public signal"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-5 text-white/42">No verified fresh signal for this district right now.</p>
              )}
            </article>
          ))}
        </div>
      ) : null}

      {liveViews.length ? (
        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/52">Official live views</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {liveViews.map((view) => (
              <a
                key={view.href}
                href={view.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100 transition hover:bg-cyan-300/15"
              >
                <span className="font-semibold">{view.label}</span>
                <span className="mt-1 block text-xs text-white/46">Source: {view.source}</span>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/38">
        {payload?.freshness?.signals?.as_of ? <span>Signal source timestamp: {new Date(payload.freshness.signals.as_of).toLocaleString()}</span> : null}
        {checkedAt ? <span>Checked: {checkedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span> : null}
        <span>Dynamic request: no-store</span>
      </div>
    </section>
  );
}
