"use client";

import { useEffect, useMemo, useState } from "react";

type EarthSignalsPayload = {
  place: {
    slug: string;
    name: string;
    lat: number;
    lon: number;
  };
  noaa: {
    available: boolean;
    source: string;
    fallback_reason: string | null;
    forecast: Array<{
      start: string;
      end: string;
      temperature: number | null;
      temperatureUnit: string | null;
      windSpeed: string | null;
      windDirection: string | null;
      shortForecast: string | null;
    }>;
  };
  nasa: {
    source: string;
    days: number;
    radius_km: number;
    total_open_events: number;
    nearby_events: Array<{
      id: string;
      title: string;
      categories: string[];
      distance_km: number;
      latest_at: string | null;
      source_urls: string[];
      geometry_type: string | null;
    }>;
  };
  diagnostics: {
    generated_at: string;
  };
};

export default function EarthSignalsPanel({ placeSlug }: { placeSlug: string }) {
  const [days, setDays] = useState(7);
  const [radiusKm, setRadiusKm] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EarthSignalsPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const q = new URLSearchParams({
          days: String(days),
          radius_km: String(radiusKm),
        });
        const res = await fetch(
          `/api/internal/${encodeURIComponent(placeSlug)}/earth-signals?${q.toString()}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          throw new Error(`earth_signals_http_${res.status}`);
        }
        const json = (await res.json()) as EarthSignalsPayload;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("Could not load NOAA/NASA signals right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [days, placeSlug, radiusKm]);

  const noaaHeadline = useMemo(() => {
    if (!data?.noaa.forecast?.length) return "No forecast periods available";
    const p = data.noaa.forecast[0];
    return [
      p.shortForecast || "Forecast",
      p.temperature != null && p.temperatureUnit ? `${p.temperature}${p.temperatureUnit}` : null,
      p.windSpeed ? `Wind ${p.windSpeed} ${p.windDirection || ""}`.trim() : null,
    ]
      .filter(Boolean)
      .join(" • ");
  }, [data]);

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-7 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-lg">Earth Signals (NOAA + NASA)</h3>
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Live forecast + active natural event proximity
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <label className="text-zinc-400">Days</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-200"
          >
            <option value={3}>3</option>
            <option value={7}>7</option>
            <option value={14}>14</option>
            <option value={30}>30</option>
          </select>
          <label className="text-zinc-400">Radius</label>
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-200"
          >
            <option value={250}>250km</option>
            <option value={500}>500km</option>
            <option value={1000}>1000km</option>
            <option value={2000}>2000km</option>
          </select>
        </div>
      </div>

      {loading ? <p className="text-sm text-zinc-400">Loading earth signals…</p> : null}
      {error ? <p className="text-sm text-amber-300">{error}</p> : null}

      {data ? (
        <div className="grid lg:grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg border border-white/10 bg-black/20 p-4 space-y-2">
            <div className="text-zinc-100 font-medium">NOAA Forecast</div>
            <div className="text-zinc-400">
              {data.noaa.available ? noaaHeadline : "NOAA not available for this coordinate"}
            </div>
            {!data.noaa.available && data.noaa.fallback_reason ? (
              <div className="text-xs text-zinc-500">reason={data.noaa.fallback_reason}</div>
            ) : null}
            {data.noaa.forecast.length > 0 ? (
              <ul className="space-y-1 text-zinc-300">
                {data.noaa.forecast.slice(0, 4).map((f, idx) => (
                  <li key={`${f.start}-${idx}`}>
                    {new Date(f.start).toLocaleString()} • {f.shortForecast || "Forecast"}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/20 p-4 space-y-2">
            <div className="text-zinc-100 font-medium">NASA EONET Nearby Events</div>
            <div className="text-zinc-400">
              open events scanned: {data.nasa.total_open_events} • nearby:{" "}
              {data.nasa.nearby_events.length}
            </div>
            {data.nasa.nearby_events.length > 0 ? (
              <ul className="space-y-1 text-zinc-300">
                {data.nasa.nearby_events.slice(0, 6).map((ev) => (
                  <li key={ev.id}>
                    {ev.title} • {ev.distance_km}km
                    {ev.categories.length ? ` • ${ev.categories.join(", ")}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-500">No nearby active natural events in current radius.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
