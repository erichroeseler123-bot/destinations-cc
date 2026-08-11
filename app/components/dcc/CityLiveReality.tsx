"use client";

import { useEffect, useMemo, useState } from "react";

type ProviderSlot = {
  available?: boolean;
  sourceCount?: number;
  realtime?: boolean;
  apiConfigured?: boolean;
  mode?: string;
};

type LiveSource = {
  kind: string;
  label: string;
  provider: string;
  href: string;
  realtime?: boolean;
};

type LivePayload = {
  checkedAt?: string;
  weather?: {
    available?: boolean;
    provider?: string;
    attribution?: string;
    observedAt?: string | null;
    current?: {
      temperatureF?: number | null;
      apparentTemperatureF?: number | null;
      description?: string | null;
      windMph?: number | null;
      humidityPercent?: number | null;
    };
  };
  ticketmaster?: {
    available?: boolean;
    configured?: boolean;
    provider?: string;
    events?: Array<{ id: string; name: string; url?: string; start?: string | null; venue?: string | null; category?: string | null }>;
  };
  providerSlots?: Record<string, ProviderSlot>;
  officialLiveLinks?: LiveSource[];
};

function when(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" });
}

function pretty(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ");
}

export default function CityLiveReality({
  citySlug,
  cityName,
  lat,
  lng,
  timezone,
}: {
  citySlug: string;
  cityName: string;
  lat: number;
  lng: number;
  timezone?: string;
}) {
  const [payload, setPayload] = useState<LivePayload | null>(null);
  const [state, setState] = useState<"loading" | "live" | "offline">("loading");

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const query = new URLSearchParams({ city: citySlug, lat: String(lat), lng: String(lng), timezone: timezone || "auto" });
        const response = await fetch(`/api/public/city-live?${query.toString()}`, { cache: "no-store" });
        if (!response.ok) throw new Error(String(response.status));
        const next = (await response.json()) as LivePayload;
        if (!cancelled) {
          setPayload(next);
          setState("live");
        }
      } catch {
        if (!cancelled) setState("offline");
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [citySlug, lat, lng, timezone]);

  const weather = payload?.weather;
  const events = payload?.ticketmaster?.available ? payload.ticketmaster.events || [] : [];
  const liveSources = payload?.officialLiveLinks || [];
  const connectedSlots = useMemo(() => Object.entries(payload?.providerSlots || {}).filter(([, value]) => value.available), [payload]);
  const liveCount = (weather?.available ? 1 : 0) + events.length + connectedSlots.length;

  return (
    <section className="rounded-[30px] border border-emerald-300/15 bg-[linear-gradient(180deg,rgba(4,18,15,0.96),rgba(4,9,15,0.98))] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-200">{cityName} • Live Reality</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">What the city is actually doing now</h2>
          <p className="mt-3 text-sm leading-6 text-white/66">
            The same live contract powers every city. Coordinates drive weather and event discovery; verified city adapters add official transit, traffic, cruise and live-view sources. Dynamic observations are not stored as permanent destination content.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/66">
          {state === "loading" ? "checking sources" : state === "live" ? `${liveCount} live signals/sources` : "live sources unavailable"}
        </span>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <article className="rounded-[22px] border border-white/10 bg-white/[0.045] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Weather now</p>
          {weather?.available ? (
            <>
              <div className="mt-2 flex items-end gap-3">
                <strong className="text-4xl font-black text-white">{weather.current?.temperatureF ?? "—"}°</strong>
                <span className="pb-1 text-sm text-white/65">{weather.current?.description || "Current conditions"}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/42">
                {weather.current?.apparentTemperatureF != null ? <span>Feels {weather.current.apparentTemperatureF}°</span> : null}
                {weather.current?.humidityPercent != null ? <span>{weather.current.humidityPercent}% humidity</span> : null}
                {weather.current?.windMph != null ? <span>{weather.current.windMph} mph wind</span> : null}
                {weather.observedAt ? <span>Observed {when(weather.observedAt)}</span> : null}
              </div>
              {weather.attribution ? <p className="mt-3 text-[10px] text-white/28">{weather.attribution}</p> : null}
            </>
          ) : (
            <p className="mt-3 text-sm text-white/42">Live weather is unavailable right now.</p>
          )}
        </article>

        <article className="rounded-[22px] border border-white/10 bg-white/[0.045] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Events next 48 hours</p>
          {payload?.ticketmaster?.configured ? (
            events.length ? (
              <div className="mt-3 space-y-3">
                {events.slice(0, 5).map((event) => (
                  <a key={event.id} href={event.url || "#"} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-white/10 bg-black/20 px-3 py-3 hover:bg-white/[0.05]">
                    <p className="text-sm font-semibold text-white">{event.name}</p>
                    <p className="mt-1 text-xs text-white/42">{[event.venue, when(event.start), event.category].filter(Boolean).join(" • ")}</p>
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-white/42">No current Ticketmaster events returned for this radius.</p>
            )
          ) : (
            <p className="mt-3 text-sm text-white/42">The event provider slot is not configured.</p>
          )}
        </article>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {Object.entries(payload?.providerSlots || {}).map(([name, slot]) => (
          <div key={name} className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">{pretty(name)}</p>
            <p className="mt-1 text-xs text-white/35">
              {slot.mode === "api" ? "API connected" : slot.available ? `${slot.sourceCount || 1} official source${(slot.sourceCount || 1) === 1 ? "" : "s"}` : "source not mapped"}
            </p>
          </div>
        ))}
      </div>

      {liveSources.length ? (
        <div className="mt-5 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Official live portals</p>
            <span className="text-[10px] uppercase tracking-[0.14em] text-white/30">verified city adapters</span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {liveSources.map((source) => (
              <a
                key={`${source.kind}:${source.href}`}
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] px-4 py-3 transition hover:bg-cyan-300/[0.11]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-200/65">{pretty(source.kind)}</span>
                  {source.realtime ? <span className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-200/65">real-time</span> : null}
                </div>
                <p className="mt-2 text-sm font-semibold text-white">{source.label}</p>
                <p className="mt-1 text-xs text-white/38">{source.provider}</p>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/35">
        {payload?.checkedAt ? <span>Checked {new Date(payload.checkedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span> : null}
        <span>Refreshes every minute</span>
        <span>No-store</span>
        <span>Coordinates drive the live layer</span>
      </div>
    </section>
  );
}
