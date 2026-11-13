"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  label?: string;
  timezone?: string; // e.g. "America/Los_Angeles"
  lat?: number;
  lng?: number;
};

type WeatherState =
  | { status: "idle" | "loading" }
  | {
      status: "ok";
      dataMode: "live_noaa" | "live_open_meteo_commercial" | "cached_snapshot" | "seasonal_climatology";
      isCurrentConditions: boolean;
      freshnessLabel: string;
      provider: string;
      tempF?: number | null;
      windMph?: number | null;
      condition: string;
      climatology?: {
        monthName: string;
        typicalLowF: number;
        typicalHighF: number;
        typicalRainRiskLabel: string;
      } | null;
      observedAt?: string | null;
    }
  | { status: "error"; message: string };

export default function LocalTimeWeather({ label, timezone, lat, lng }: Props) {
  const tz = timezone || "UTC";

  const fmtTime = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [tz]);

  const fmtDate = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }, [tz]);

  const [now, setNow] = useState<Date>(() => new Date());
  const [wx, setWx] = useState<WeatherState>({ status: "idle" });

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (typeof lat !== "number" || typeof lng !== "number") return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWx({ status: "loading" });

    // Centralized DCC server gateway: ZERO browser-direct weather-provider requests.
    const url =
      "/api/internal/weather" +
      `?lat=${encodeURIComponent(lat)}` +
      `&lng=${encodeURIComponent(lng)}` +
      `&tz=${encodeURIComponent(tz)}` +
      (label ? `&label=${encodeURIComponent(label)}` : "");

    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`Weather request failed (${r.status})`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;

        setWx({
          status: "ok",
          dataMode: data?.dataMode || "seasonal_climatology",
          isCurrentConditions: data?.isCurrentConditions === true,
          freshnessLabel: String(data?.freshnessLabel || ""),
          provider: String(data?.provider || "DCC Weather Gateway"),
          tempF: typeof data?.temperatureF === "number" ? data.temperatureF : null,
          windMph: typeof data?.windMph === "number" ? data.windMph : null,
          condition: String(data?.condition || "Weather guidance"),
          climatology: data?.climatology || null,
          observedAt: typeof data?.observedAt === "string" ? data.observedAt : null,
        });
      })
      .catch((e) => {
        if (cancelled) return;
        setWx({ status: "error", message: e?.message || "Weather error" });
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng, tz, label]);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h3 className="text-lg font-semibold">{label || "Local Time & Weather"}</h3>
        <span className="text-xs uppercase tracking-wider text-zinc-400">{tz}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wider text-zinc-400">Local Time</div>
          <div className="mt-1 text-2xl font-black">{fmtTime.format(now)}</div>
          <div className="text-sm text-zinc-400">{fmtDate.format(now)}</div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs uppercase tracking-wider text-zinc-400">
              {wx.status === "ok" && !wx.isCurrentConditions
                ? wx.dataMode === "cached_snapshot"
                  ? "Cached Snapshot (Not Live)"
                  : "Seasonal Climatology (Not Live)"
                : "Current Weather"}
            </div>
            {wx.status === "ok" && !wx.isCurrentConditions ? (
              <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                Not Current Conditions
              </span>
            ) : null}
          </div>

          {typeof lat !== "number" || typeof lng !== "number" ? (
            <div className="mt-2 text-sm text-zinc-400">Missing lat/lng for this location.</div>
          ) : wx.status === "loading" ? (
            <div className="mt-2 text-sm text-zinc-400">Loading…</div>
          ) : wx.status === "error" ? (
            <div className="mt-2 text-sm text-zinc-400">{wx.message}</div>
          ) : wx.status === "ok" && wx.isCurrentConditions ? (
            <div className="mt-1 space-y-1">
              <div className="text-2xl font-black">{wx.tempF != null ? `${wx.tempF}°F` : "—"}</div>
              <div className="text-sm text-zinc-400">
                {wx.condition}
                {wx.windMph != null ? ` • Wind ${wx.windMph} mph` : ""}
              </div>
              <div className="text-[11px] text-zinc-500">{wx.provider}</div>
            </div>
          ) : wx.status === "ok" && wx.dataMode === "cached_snapshot" ? (
            <div className="mt-1 space-y-1">
              <div className="text-xl font-bold text-amber-200">
                {wx.tempF != null ? `${wx.tempF}°F (cached)` : "Cached snapshot"}
              </div>
              <div className="text-xs text-zinc-400">{wx.freshnessLabel}</div>
            </div>
          ) : wx.status === "ok" && wx.climatology ? (
            <div className="mt-1 space-y-1">
              <div className="text-lg font-bold text-zinc-100">
                Typical {wx.climatology.monthName}: {wx.climatology.typicalLowF}–{wx.climatology.typicalHighF}°F
              </div>
              <div className="text-xs text-zinc-400">
                {wx.climatology.typicalRainRiskLabel} · Historical average, not live conditions.
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-zinc-400">—</div>
          )}
        </div>
      </div>
    </section>
  );
}
