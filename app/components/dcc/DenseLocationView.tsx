"use client";

import { useEffect, useMemo, useState } from "react";

type Props = { lat: number; lng: number; knownName?: string | null };

type LocationLabel = {
  name?: string;
  displayName?: string;
  city?: string | null;
  region?: string | null;
  country?: string | null;
};

type DccPayload = {
  ok?: boolean;
  schema?: string;
  checkedAt?: string;
  coordinate?: { lat: number; lng: number };
  location?: { timezone?: string | null; elevationM?: number | null };
  modules?: {
    now?: { weather?: any; airQuality?: any };
    conditions?: { next12Hours?: any[]; next3Days?: any[]; airQualityNext12Hours?: any[] };
    hazards?: { alerts?: any[]; earthquakes?: any[]; naturalEvents?: any[] };
    water?: { nearbyGauges?: any[] };
    official?: { nws?: any };
    events?: any;
    machineFeeds?: any[];
    providerSlots?: Record<string, any>;
    officialLiveLinks?: any[];
  };
  sources?: Array<{ provider: string; attribution: string; available: boolean; checkedAt?: string; error?: string }>;
};

function canonical(value: number) {
  return Number(value).toFixed(5);
}

function cToF(value: number | null | undefined) {
  return typeof value === "number" ? Math.round((value * 9) / 5 + 32) : null;
}

function kmToMiles(value: number | null | undefined) {
  return typeof value === "number" ? Math.round(value * 0.621371) : null;
}

function metersToMiles(value: number | null | undefined) {
  return typeof value === "number" ? Math.round((value / 1609.344) * 10) / 10 : null;
}

function metersToFeet(value: number | null | undefined) {
  return typeof value === "number" ? Math.round(value * 3.28084) : null;
}

function formatTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function checked(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
}

function aqLabel(value: number | null | undefined) {
  if (typeof value !== "number") return "Unknown";
  if (value <= 50) return "Good";
  if (value <= 100) return "Moderate";
  if (value <= 150) return "Unhealthy for sensitive groups";
  if (value <= 200) return "Unhealthy";
  if (value <= 300) return "Very unhealthy";
  return "Hazardous";
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/65">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: React.ReactNode; detail?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">{label}</p>
      <div className="mt-2 text-xl font-black text-white">{value ?? "—"}</div>
      {detail ? <div className="mt-1 text-xs leading-5 text-white/42">{detail}</div> : null}
    </div>
  );
}

export default function DenseLocationView({ lat, lng, knownName = null }: Props) {
  const [payload, setPayload] = useState<DccPayload | null>(null);
  const [label, setLabel] = useState<LocationLabel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = `/api/location/${canonical(lat)}/${canonical(lng)}`;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(apiUrl, { cache: "no-store" });
        if (!response.ok) throw new Error(`DCC API ${response.status}`);
        const next = (await response.json()) as DccPayload;
        if (!cancelled) setPayload(next);
      } catch (nextError) {
        if (!cancelled) setError(nextError instanceof Error ? nextError.message : "Location data unavailable");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  useEffect(() => {
    if (knownName) return;
    let cancelled = false;
    void (async () => {
      try {
        const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
        const response = await fetch(`/api/public/location-resolve?${params.toString()}`, { cache: "force-cache" });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled && Array.isArray(data?.results) && data.results[0]) setLabel(data.results[0]);
      } catch {
        // A coordinate page remains useful without a reverse-geocoded label.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [knownName, lat, lng]);

  const locationName = useMemo(() => {
    if (knownName) return knownName;
    if (label?.displayName) return label.displayName;
    return `${canonical(lat)}, ${canonical(lng)}`;
  }, [knownName, label, lat, lng]);

  const weather = payload?.modules?.now?.weather || null;
  const air = payload?.modules?.now?.airQuality || null;
  const hours = payload?.modules?.conditions?.next12Hours || [];
  const days = payload?.modules?.conditions?.next3Days || [];
  const alerts = payload?.modules?.hazards?.alerts || [];
  const earthquakes = payload?.modules?.hazards?.earthquakes || [];
  const naturalEvents = payload?.modules?.hazards?.naturalEvents || [];
  const gauges = payload?.modules?.water?.nearbyGauges || [];
  const nws = payload?.modules?.official?.nws || null;
  const events = payload?.modules?.events?.available ? payload.modules.events.events || [] : [];
  const machineItems = (payload?.modules?.machineFeeds || []).flatMap((feed: any) =>
    feed?.available ? (feed.items || []).map((item: any) => ({ ...item, provider: feed.provider, kind: feed.kind })) : [],
  );
  const sources = payload?.sources || [];
  const activeSources = sources.filter((source) => source.available).length;

  return (
    <main className="min-h-screen bg-[#070b10] text-white">
      <header className="border-b border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.13),transparent_28%),radial-gradient(circle_at_92%_8%,rgba(16,185,129,0.08),transparent_25%),#070b10]">
        <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-4xl">
              <a href="/" className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Destination Command Center · coordinate intelligence</a>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">{locationName}</h1>
              <p className="mt-3 font-mono text-sm text-white/45">{canonical(lat)}, {canonical(lng)}</p>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-white/52 sm:text-base">
                DCC is assembling the public machine-readable context that applies to this exact coordinate. Only relevant modules appear; every source reports its own freshness and coverage.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={apiUrl} className="rounded-full border border-cyan-300/25 bg-cyan-300/[0.08] px-4 py-2 text-xs font-black uppercase tracking-[0.11em] text-cyan-100">JSON / API</a>
              <a href="/developers" className="rounded-full border border-white/12 px-4 py-2 text-xs font-black uppercase tracking-[0.11em] text-white/65">Developers</a>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/40">
            <span className="rounded-full border border-white/10 px-3 py-2">Schema {payload?.schema || "dcc-location-v2"}</span>
            <span className="rounded-full border border-white/10 px-3 py-2">{activeSources} live source{activeSources === 1 ? "" : "s"}</span>
            {payload?.location?.timezone ? <span className="rounded-full border border-white/10 px-3 py-2">{payload.location.timezone}</span> : null}
            {payload?.location?.elevationM != null ? <span className="rounded-full border border-white/10 px-3 py-2">Elevation {metersToFeet(payload.location.elevationM)?.toLocaleString()} ft</span> : null}
            {payload?.checkedAt ? <span className="rounded-full border border-white/10 px-3 py-2">Checked {checked(payload.checkedAt)}</span> : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-5 px-5 py-7 sm:px-8 sm:py-9">
        {error ? (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-5 text-sm text-amber-100">{error}</div>
        ) : null}

        {!payload && !error ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Reading public sources</p>
            <p className="mt-3 text-xl font-black">Building the coordinate intelligence file…</p>
          </div>
        ) : null}

        {payload ? (
          <>
            <Section eyebrow="Now" title="What conditions are like at this point">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                <Metric label="Temperature" value={weather?.temperature_2m != null ? `${cToF(weather.temperature_2m)}°F` : "—"} detail={weather?.description || null} />
                <Metric label="Feels like" value={weather?.apparent_temperature != null ? `${cToF(weather.apparent_temperature)}°F` : "—"} />
                <Metric label="Humidity" value={weather?.relative_humidity_2m != null ? `${Math.round(weather.relative_humidity_2m)}%` : "—"} />
                <Metric label="Wind" value={weather?.wind_speed_10m != null ? `${kmToMiles(weather.wind_speed_10m)} mph` : "—"} detail={weather?.wind_gusts_10m != null ? `Gusts ${kmToMiles(weather.wind_gusts_10m)} mph` : null} />
                <Metric label="Cloud cover" value={weather?.cloud_cover != null ? `${Math.round(weather.cloud_cover)}%` : "—"} />
                <Metric label="Pressure" value={weather?.surface_pressure != null ? `${Math.round(weather.surface_pressure)} hPa` : "—"} />
              </div>
            </Section>

            {air ? (
              <Section eyebrow="Air · UV · visibility" title="Atmospheric conditions">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                  <Metric label="US AQI" value={air?.us_aqi != null ? Math.round(air.us_aqi) : "—"} detail={aqLabel(air?.us_aqi)} />
                  <Metric label="PM2.5" value={air?.pm2_5 != null ? `${Math.round(air.pm2_5)} µg/m³` : "—"} />
                  <Metric label="PM10" value={air?.pm10 != null ? `${Math.round(air.pm10)} µg/m³` : "—"} />
                  <Metric label="Ozone" value={air?.ozone != null ? `${Math.round(air.ozone)} µg/m³` : "—"} />
                  <Metric label="UV index" value={air?.uv_index != null ? Math.round(air.uv_index * 10) / 10 : "—"} />
                  <Metric label="Visibility" value={hours?.[0]?.visibilityM != null ? `${metersToMiles(hours[0].visibilityM)} mi` : "—"} />
                </div>
              </Section>
            ) : null}

            {hours.length ? (
              <Section eyebrow="Next 12 hours" title="Short-range conditions">
                <div className="overflow-x-auto">
                  <div className="grid min-w-[900px] grid-cols-12 gap-2">
                    {hours.slice(0, 12).map((hour: any) => (
                      <div key={hour.time} className="rounded-2xl border border-white/8 bg-black/20 p-3 text-center">
                        <p className="text-[10px] font-black uppercase tracking-wider text-white/35">{formatTime(hour.time)}</p>
                        <p className="mt-2 text-lg font-black">{hour.temperatureC != null ? `${cToF(hour.temperatureC)}°` : "—"}</p>
                        <p className="mt-1 text-[11px] leading-4 text-white/45">{hour.description || ""}</p>
                        <p className="mt-2 text-[10px] text-cyan-100/65">{hour.precipitationProbability != null ? `${Math.round(hour.precipitationProbability)}% precip` : ""}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            ) : null}

            {days.length ? (
              <Section eyebrow="Three-day outlook" title="Daylight and forecast context">
                <div className="grid gap-3 md:grid-cols-3">
                  {days.slice(0, 3).map((day: any) => (
                    <div key={day.date} className="rounded-2xl border border-white/8 bg-black/20 p-5">
                      <p className="text-xs font-black uppercase tracking-[0.13em] text-white/45">{formatDate(day.date)}</p>
                      <p className="mt-3 text-2xl font-black">{day.maxTemperatureC != null ? `${cToF(day.maxTemperatureC)}°` : "—"} <span className="text-base text-white/35">/ {day.minTemperatureC != null ? `${cToF(day.minTemperatureC)}°` : "—"}</span></p>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/45">
                        <span>Precip {day.precipitationProbabilityMax != null ? `${Math.round(day.precipitationProbabilityMax)}%` : "—"}</span>
                        <span>UV max {day.uvIndexMax != null ? Math.round(day.uvIndexMax * 10) / 10 : "—"}</span>
                        <span>Sunrise {formatTime(day.sunrise)}</span>
                        <span>Sunset {formatTime(day.sunset)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}

            <Section eyebrow="Official alerts" title={alerts.length ? `${alerts.length} active public alert${alerts.length === 1 ? "" : "s"}` : "No mapped NWS alerts at this point"}>
              {alerts.length ? (
                <div className="space-y-3">
                  {alerts.map((alert: any) => (
                    <article key={alert.id || alert.headline} className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.055] p-5">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-amber-100/60">
                        <span>{alert.event || "Alert"}</span><span>·</span><span>{alert.severity || "Severity unknown"}</span>{alert.expires ? <><span>·</span><span>Expires {formatTime(alert.expires)}</span></> : null}
                      </div>
                      <h3 className="mt-2 font-black text-amber-50">{alert.headline || alert.event}</h3>
                      {alert.areaDesc ? <p className="mt-2 text-xs leading-5 text-amber-50/55">{alert.areaDesc}</p> : null}
                      {alert.instruction ? <p className="mt-3 text-sm leading-6 text-amber-50/70">{alert.instruction}</p> : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-white/42">For U.S. coordinates, DCC checks the National Weather Service point-alert service. Outside mapped coverage, this section will remain quiet rather than inventing a result.</p>
              )}
            </Section>

            {(naturalEvents.length || earthquakes.length) ? (
              <Section eyebrow="Earth · fire · severe events" title="Natural-hazard context around the coordinate">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.13em] text-white/55">NASA EONET open events</h3>
                    <div className="mt-3 space-y-2">
                      {naturalEvents.length ? naturalEvents.slice(0, 8).map((event: any) => (
                        <div key={event.id} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                          <p className="font-bold">{event.title}</p>
                          <p className="mt-1 text-xs text-white/42">{event.categories?.join(" · ") || "Natural event"}{event.distanceKm != null ? ` · ~${event.distanceKm} km away` : ""}</p>
                        </div>
                      )) : <p className="text-sm text-white/35">No open EONET events returned inside the current regional window.</p>}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.13em] text-white/55">USGS earthquakes · last 7 days</h3>
                    <div className="mt-3 space-y-2">
                      {earthquakes.length ? earthquakes.slice(0, 8).map((quake: any) => (
                        <a key={quake.id} href={quake.url || "#"} className="block rounded-2xl border border-white/8 bg-black/20 p-4 transition hover:border-white/18">
                          <p className="font-bold">M {quake.magnitude ?? "?"} · {quake.place || "Earthquake"}</p>
                          <p className="mt-1 text-xs text-white/42">{quake.distanceKm != null ? `~${quake.distanceKm} km away · ` : ""}{quake.time ? new Date(quake.time).toLocaleString() : ""}</p>
                        </a>
                      )) : <p className="text-sm text-white/35">No earthquakes returned inside 500 km for the last seven days.</p>}
                    </div>
                  </div>
                </div>
              </Section>
            ) : null}

            {gauges.length ? (
              <Section eyebrow="Water" title="Nearby NOAA river and flood gauges">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {gauges.slice(0, 9).map((gauge: any) => (
                    <a key={gauge.identifier || gauge.name} href={gauge.pageUrl || "#"} className="rounded-2xl border border-white/8 bg-black/20 p-4 transition hover:border-cyan-300/20">
                      <p className="font-bold">{gauge.name || gauge.identifier || "NWPS gauge"}</p>
                      <p className="mt-1 text-xs text-white/42">{gauge.identifier || ""}{gauge.distanceKm != null ? ` · ~${gauge.distanceKm} km away` : ""}</p>
                      {(gauge.statusObserved || gauge.statusForecast || gauge.floodCategory) ? <p className="mt-2 text-xs text-cyan-100/60">Observed {gauge.statusObserved || "—"} · Forecast {gauge.statusForecast || "—"}{gauge.floodCategory ? ` · ${gauge.floodCategory}` : ""}</p> : null}
                    </a>
                  ))}
                </div>
              </Section>
            ) : null}

            {nws?.forecastPeriods?.length ? (
              <Section eyebrow="Official forecast" title={`National Weather Service · ${nws.office || "local office"}`}>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {nws.forecastPeriods.slice(0, 8).map((period: any, index: number) => (
                    <div key={`${period.startTime}-${index}`} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-white/42">{period.name}</p>
                      <p className="mt-2 text-xl font-black">{period.temperature != null ? `${period.temperature}°${period.temperatureUnit || ""}` : "—"}</p>
                      <p className="mt-2 text-sm leading-5 text-white/58">{period.shortForecast}</p>
                      <p className="mt-2 text-xs text-white/35">{period.windSpeed} {period.windDirection}</p>
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}

            {(events.length || machineItems.length) ? (
              <Section eyebrow="Happening · live signals" title="Other machine-readable activity around this coordinate">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.13em] text-white/55">Events</h3>
                    <div className="mt-3 space-y-2">
                      {events.slice(0, 8).map((event: any) => (
                        <a key={event.id} href={event.url || "#"} className="block rounded-2xl border border-white/8 bg-black/20 p-4">
                          <p className="font-bold">{event.name}</p>
                          <p className="mt-1 text-xs text-white/42">{event.start ? new Date(event.start).toLocaleString() : ""}{event.venue ? ` · ${event.venue}` : ""}</p>
                        </a>
                      ))}
                      {!events.length ? <p className="text-sm text-white/35">No configured event provider returned results here.</p> : null}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.13em] text-white/55">Machine feeds</h3>
                    <div className="mt-3 space-y-2">
                      {machineItems.slice(0, 8).map((item: any, index: number) => (
                        <div key={item.id || `${item.title}-${index}`} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                          <p className="font-bold">{item.title}</p>
                          <p className="mt-1 text-xs text-white/42">{item.provider}{item.kind ? ` · ${item.kind}` : ""}</p>
                        </div>
                      ))}
                      {!machineItems.length ? <p className="text-sm text-white/35">No additional mapped machine-feed items returned here.</p> : null}
                    </div>
                  </div>
                </div>
              </Section>
            ) : null}

            <Section eyebrow="Sources" title="Where this location file came from">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {sources.map((source) => (
                  <div key={source.provider} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black">{source.provider}</p>
                      <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider ${source.available ? "bg-emerald-300/10 text-emerald-200" : "bg-white/[0.06] text-white/35"}`}>{source.available ? "live" : "not mapped"}</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-white/42">{source.attribution}</p>
                    {source.checkedAt ? <p className="mt-2 text-[10px] text-white/28">Checked {checked(source.checkedAt)}</p> : null}
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.045] p-5">
                <p className="text-xs font-black uppercase tracking-[0.13em] text-cyan-100/65">For developers and AI agents</p>
                <p className="mt-2 text-sm leading-6 text-white/55">The JSON endpoint returns the same coordinate identity with structured modules, source status, timestamps, compatibility aliases, and machine-discovery links.</p>
                <a href={apiUrl} className="mt-3 inline-block font-mono text-xs text-cyan-200 hover:text-cyan-100">{apiUrl} →</a>
              </div>
            </Section>
          </>
        ) : null}
      </div>
    </main>
  );
}
