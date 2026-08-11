"use client";

import { useEffect, useMemo, useState } from "react";

type LivePayload = {
  checkedAt?: string;
  weather?: {
    available?: boolean;
    provider?: string;
    observedAt?: string | null;
    current?: {
      temperatureF?: number | null;
      description?: string | null;
      windMph?: number | null;
      humidityPercent?: number | null;
    };
    alerts?: Array<{ id?: string; event?: string; severity?: string; headline?: string; expires?: string }>;
  };
  ticketmaster?: {
    available?: boolean;
    configured?: boolean;
    provider?: string;
    events?: Array<{ id: string; name: string; url?: string; start?: string | null; venue?: string | null; category?: string | null }>;
  };
  traffic?: {
    available?: boolean;
    configured?: boolean;
    provider?: string;
    events?: Array<{ id?: string | number; roadway?: string; description?: string; severity?: string; fullClosure?: boolean; updatedAt?: string | null }>;
  };
  officialLiveLinks?: Array<{ label: string; provider: string; href: string; kind: string }>;
};

function when(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" });
}

export default function NewOrleansLiveReality() {
  const [payload, setPayload] = useState<LivePayload | null>(null);
  const [state, setState] = useState<"loading" | "live" | "offline">("loading");

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const response = await fetch("/api/public/new-orleans/live", { cache: "no-store" });
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
  }, []);

  const weather = payload?.weather;
  const events = payload?.ticketmaster?.available ? payload.ticketmaster.events || [] : [];
  const traffic = payload?.traffic?.available ? payload.traffic.events || [] : [];
  const alerts = weather?.available ? weather.alerts || [] : [];

  const liveCount = useMemo(() => {
    let count = 0;
    if (weather?.available) count += 1;
    if (events.length) count += events.length;
    if (traffic.length) count += traffic.length;
    count += alerts.length;
    return count;
  }, [weather?.available, events.length, traffic.length, alerts.length]);

  return (
    <section className="rounded-[30px] border border-emerald-300/15 bg-[linear-gradient(180deg,rgba(4,18,15,0.96),rgba(4,9,15,0.98))] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-200">New Orleans • Live Reality</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">What the city is actually doing now</h2>
          <p className="mt-3 text-sm leading-6 text-white/66">
            This surface is assembled from live public providers at request time. Dynamic results are not saved as permanent destination content; if a source is unavailable or unconfigured, it stays absent instead of falling back to fake-live data.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/66">
          {state === "loading" ? "checking sources" : state === "live" ? `${liveCount} live observations` : "live sources unavailable"}
        </span>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        <article className="rounded-[22px] border border-white/10 bg-white/[0.045] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Weather now</p>
          {weather?.available ? (
            <>
              <div className="mt-2 flex items-end gap-3">
                <strong className="text-4xl font-black text-white">{weather.current?.temperatureF ?? "—"}°</strong>
                <span className="pb-1 text-sm text-white/65">{weather.current?.description || "Current NWS observation"}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/42">
                {weather.current?.humidityPercent != null ? <span>{weather.current.humidityPercent}% humidity</span> : null}
                {weather.current?.windMph != null ? <span>{weather.current.windMph} mph wind</span> : null}
                {weather.observedAt ? <span>Observed {when(weather.observedAt)}</span> : null}
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-white/42">NWS is not responding right now.</p>
          )}
        </article>

        <article className="rounded-[22px] border border-white/10 bg-white/[0.045] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Events next 48 hours</p>
          {payload?.ticketmaster?.configured ? (
            events.length ? (
              <div className="mt-3 space-y-3">
                {events.slice(0, 4).map((event) => (
                  <a key={event.id} href={event.url || "#"} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-white/10 bg-black/20 px-3 py-3 hover:bg-white/[0.05]">
                    <p className="text-sm font-semibold text-white">{event.name}</p>
                    <p className="mt-1 text-xs text-white/42">{[event.venue, when(event.start)].filter(Boolean).join(" • ")}</p>
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-white/42">No Ticketmaster events returned for the live window.</p>
            )
          ) : (
            <p className="mt-3 text-sm text-white/42">Ticketmaster live feed is ready but not configured with an API key.</p>
          )}
        </article>

        <article className="rounded-[22px] border border-white/10 bg-white/[0.045] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Road pulse</p>
          {payload?.traffic?.configured ? (
            traffic.length ? (
              <div className="mt-3 space-y-3">
                {traffic.slice(0, 4).map((event) => (
                  <div key={String(event.id)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                    <p className="text-sm font-semibold text-white">{event.roadway || "Traffic event"}</p>
                    <p className="mt-1 text-xs leading-5 text-white/48">{event.description}</p>
                    {event.fullClosure ? <span className="mt-2 inline-flex rounded-full border border-rose-300/20 bg-rose-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.13em] text-rose-100">full closure</span> : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-white/42">No nearby Louisiana 511 events returned.</p>
            )
          ) : (
            <p className="mt-3 text-sm text-white/42">Louisiana 511 live incidents are ready but require a developer key.</p>
          )}
        </article>
      </div>

      {alerts.length ? (
        <div className="mt-4 rounded-[22px] border border-amber-300/20 bg-amber-300/[0.08] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-100">Active NWS alerts</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {alerts.map((alert) => (
              <div key={alert.id || alert.headline} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                <p className="text-sm font-semibold text-white">{alert.event || "Weather alert"}</p>
                <p className="mt-1 text-xs leading-5 text-white/50">{alert.headline}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {payload?.officialLiveLinks?.length ? (
        <div className="mt-5 border-t border-white/10 pt-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Official live portals</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {payload.officialLiveLinks.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.07] px-4 py-3 text-sm text-cyan-100 hover:bg-cyan-300/[0.12]">
                <span className="font-semibold">{link.label}</span>
                <span className="mt-1 block text-xs text-white/42">{link.provider}</span>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/35">
        {payload?.checkedAt ? <span>Checked {new Date(payload.checkedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span> : null}
        <span>Refreshes every minute</span>
        <span>No-store</span>
        <span>No dynamic city-content persistence</span>
      </div>
    </section>
  );
}
