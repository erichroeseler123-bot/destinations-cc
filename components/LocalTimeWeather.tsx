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
      tempF?: number;
      windMph?: number;
      code?: number;
      fetchedAtISO: string;
    }
  | { status: "error"; message: string };

function toF(c: number) {
  return (c * 9) / 5 + 32;
}

function mpsToMph(mps: number) {
  return mps * 2.236936;
}

function weatherLabel(code?: number) {
  if (code == null) return "Weather";
  if (code === 0) return "Clear";
  if (code === 1 || code === 2) return "Mostly clear";
  if (code === 3) return "Cloudy";
  if (code >= 45 && code <= 48) return "Fog";
  if (code >= 51 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 95) return "Thunder";
  return "Conditions";
}

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
    setWx({ status: "loading" });

    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${encodeURIComponent(lat)}` +
      `&longitude=${encodeURIComponent(lng)}` +
      `&current=temperature_2m,wind_speed_10m,weather_code` +
      `&temperature_unit=celsius` +
      `&wind_speed_unit=ms` +
      `&timezone=${encodeURIComponent(tz)}`;

    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`Weather request failed (${r.status})`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;

        const c = data?.current?.temperature_2m;
        const w = data?.current?.wind_speed_10m;
        const code = data?.current?.weather_code;

        setWx({
          status: "ok",
          tempF: typeof c === "number" ? Math.round(toF(c)) : undefined,
          windMph: typeof w === "number" ? Math.round(mpsToMph(w)) : undefined,
          code: typeof code === "number" ? code : undefined,
          fetchedAtISO: new Date().toISOString(),
        });
      })
      .catch((e) => {
        if (cancelled) return;
        setWx({ status: "error", message: e?.message || "Weather error" });
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng, tz]);

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
          <div className="text-xs uppercase tracking-wider text-zinc-400">Weather</div>

          {typeof lat !== "number" || typeof lng !== "number" ? (
            <div className="mt-2 text-sm text-zinc-400">Missing lat/lng for this location.</div>
          ) : wx.status === "loading" ? (
            <div className="mt-2 text-sm text-zinc-400">Loading…</div>
          ) : wx.status === "error" ? (
            <div className="mt-2 text-sm text-zinc-400">{wx.message}</div>
          ) : wx.status === "ok" ? (
            <div className="mt-1 space-y-1">
              <div className="text-2xl font-black">{wx.tempF != null ? `${wx.tempF}°F` : "—"}</div>
              <div className="text-sm text-zinc-400">
                {weatherLabel(wx.code)}
                {wx.windMph != null ? ` • Wind ${wx.windMph} mph` : ""}
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
