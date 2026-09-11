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
  dccEndpoints?: any[];
  modules?: {
    dccEndpoints?: any[];
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
  const dccEndpoints = (payload?.modules?.dccEndpoints || payload?.dccEndpoints || []) as Array<{
    id?: string;
    name?: string;
    url?: string;
    endpointUrl?: string;
    sourceUrl?: string;
    matchedRegion?: string;
    checkedAt?: string;
    fetchedAt?: string;
    available?: boolean;
    status?: "fresh" | "stale" | "unavailable" | string;
    isFresh?: boolean;
    asOf?: string | null;
    as_of?: string | null;
    freshUntil?: string | null;
    fresh_until?: string | null;
    error?: string;
    payload?: any;
  }>;

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
          <div className="mt-4 flex max-w-3xl items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.05] px-3.5 py-2 text-xs text-cyan-200">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
            <span>This page is a view. The current information comes from the public endpoints that serve this location.</span>
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
            <Section
              eyebrow="Direct Tourism Internet"
              title={
                dccEndpoints.length
                  ? `${dccEndpoints.length} verified operator endpoint${dccEndpoints.length === 1 ? "" : "s"} serving this location`
                  : "Direct operator endpoints"
              }
            >
              {dccEndpoints.length ? (
                <div className="space-y-6">
                  {dccEndpoints.map((ep, idx) => {
                    const data = ep.payload || {};
                    const operator = data.operator || {};
                    const isFresh = ep.status === "fresh" || ep.isFresh === true;
                    const isStale = ep.status === "stale";
                    const isError = ep.status === "unavailable" || !ep.available;

                    // Extract claims from array or object
                    const rawClaims: any[] = Array.isArray(data.claims)
                      ? data.claims
                      : Object.entries(data.claims || {}).map(([predicate, value]) => ({ predicate, value }));

                    const claimsMap: Record<string, any> = {};
                    for (const c of rawClaims) {
                      if (c && c.predicate) claimsMap[c.predicate] = c;
                    }

                    const legalName = claimsMap.legal_name?.value || operator.identity?.legal_name || ep.name || "Direct Operator";
                    const operatingAuth = claimsMap.operating_authority?.value || operator.identity?.operating_authority?.id;
                    const operatingAuthEvidence = claimsMap.operating_authority?.evidence?.[0]?.pointer || operator.identity?.operating_authority?.evidence_url;

                    // Extract state
                    const rawState: any[] = Array.isArray(data.state)
                      ? data.state
                      : Object.entries(data.state || {}).map(([predicate, value]) => ({ predicate, value }));

                    // Timestamps & URLs
                    const endpointUrl = ep.endpointUrl || ep.sourceUrl || data.self || "https://gosno.co/.well-known/dcc";
                    const asOf = ep.asOf || ep.as_of || rawState.find((s: any) => s.as_of)?.as_of || data.as_of;
                    const freshUntil = ep.freshUntil || ep.fresh_until || rawState.find((s: any) => s.fresh_until)?.fresh_until || data.fresh_until;

                    // Extract actions
                    const actionsList: Array<{ id: string; method: string; target: string; description?: string }> = Array.isArray(data.actions)
                      ? data.actions.map((a: any) => ({
                          id: a.action_id || a.id || "action",
                          method: a.method || "GET",
                          target: a.target || a.endpoint_url || a.href || "#",
                          description: a.description || (a.input?.schema ? `Schema: ${a.input.schema.split("/").pop()}` : undefined),
                        }))
                      : Object.entries(data.actions || {}).map(([key, a]: [string, any]) => ({
                          id: key,
                          method: a.method || "GET",
                          target: a.endpoint_url || a.href || a.target || "#",
                          description: a.description,
                        }));

                    // Extract links
                    const linksList: Array<{ rel: string; target: string }> = Array.isArray(data.links)
                      ? data.links.map((l: any) => ({
                          rel: l.rel || "link",
                          target: l.target || l.href || l.url || "#",
                        }))
                      : Object.entries(data.links || {}).map(([rel, target]: [string, any]) => ({
                          rel,
                          target: String(target),
                        }));

                    // Displayable claims (excluding legal_name / operating_authority which are in header)
                    const displayClaims = rawClaims.filter(
                      (c: any) => c && c.predicate && c.predicate !== "legal_name" && c.predicate !== "operating_authority",
                    );

                    return (
                      <div
                        key={endpointUrl || idx}
                        className="rounded-2xl border border-white/10 bg-black/25 p-5 sm:p-7 space-y-5"
                      >
                        {/* Top: Operator info & Freshness Badges */}
                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 pb-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xl font-black text-white sm:text-2xl">
                                {legalName}
                              </h3>
                              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-cyan-200">
                                {data.profile?.service_type || "Tourism Operator"}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-white/50">
                              Legal: <span className="font-semibold text-white/80">{legalName}</span>
                              {(data.id || operator.identity?.id) ? <> · ID: <code className="font-mono text-cyan-200/80">{data.id || operator.identity?.id}</code></> : null}
                              {operatingAuth ? (
                                <>
                                  {" "}· Authority:{" "}
                                  {operatingAuthEvidence ? (
                                    <a
                                      href={operatingAuthEvidence}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline hover:text-white"
                                    >
                                      {operatingAuth}
                                    </a>
                                  ) : (
                                    <span>{operatingAuth}</span>
                                  )}
                                </>
                              ) : null}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 text-right">
                            {isFresh && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                Operational · Verified Fresh
                              </span>
                            )}
                            {isStale && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">
                                ▲ Stale Endpoint Notice
                              </span>
                            )}
                            {isError && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-xs font-bold text-rose-300">
                                ✖ Endpoint Unavailable
                              </span>
                            )}
                            {ep.matchedRegion ? (
                              <span className="text-[10px] uppercase tracking-wider text-white/40">
                                Matched Region: {ep.matchedRegion}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Stale or Error Notice if applicable */}
                        {isStale && (
                          <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3.5 text-xs text-amber-200">
                            <strong>Freshness Expired:</strong> This operator endpoint has not updated since{" "}
                            <code>{freshUntil || "unknown"}</code>. Displaying original data with freshness disclaimer.
                          </div>
                        )}
                        {isError && (
                          <div className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-3.5 text-xs text-rose-200">
                            <strong>Endpoint Error:</strong> {ep.error || "Failed to validate schema with DCC Core v2."}
                          </div>
                        )}

                        {/* Provenance & Freshness metadata */}
                        <div className="grid gap-3 sm:grid-cols-3 rounded-xl border border-white/6 bg-white/[0.02] p-3 text-xs">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-white/40 block">Authoritative Endpoint</span>
                            <a
                              href={endpointUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-cyan-300 underline hover:text-cyan-100 break-all"
                            >
                              {endpointUrl}
                            </a>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-white/40 block">As Of</span>
                            <span className="font-mono text-white/70">{asOf || "—"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-white/40 block">Fresh Until</span>
                            <span className="font-mono text-white/70">{freshUntil || "—"}</span>
                          </div>
                        </div>

                        {/* Operator Claims */}
                        {displayClaims.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-white/45 mb-2.5">
                              Authoritative Operator Claims
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                              {displayClaims.map((claim: any) => (
                                <div key={claim.predicate} className="rounded-xl border border-white/6 bg-white/[0.02] p-3">
                                  <span className="font-bold text-white/80 block mb-1 uppercase tracking-wider text-[10px]">
                                    {claim.predicate.replace(/_/g, " ")}
                                  </span>
                                  <span className="text-white/60">
                                    {Array.isArray(claim.value) ? claim.value.join(", ") : String(claim.value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Direct Actions & Links */}
                        <div className="grid gap-4 sm:grid-cols-2 pt-2">
                          {/* Direct Actions */}
                          {actionsList.length > 0 && (
                            <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.03] p-4">
                              <p className="text-[10px] font-black uppercase tracking-wider text-cyan-200 mb-2.5">
                                Direct Machine Actions (No Middleman)
                              </p>
                              <div className="space-y-2">
                                {actionsList.map((action) => (
                                  <div key={action.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/8 bg-black/30 p-2.5 text-xs">
                                    <div>
                                      <span className="font-bold text-white">{action.id.replace(/_/g, " ")}</span>
                                      <span className="ml-2 font-mono text-[10px] text-cyan-300">[{action.method}]</span>
                                      {action.description ? <p className="text-[11px] text-white/50 mt-0.5">{action.description}</p> : null}
                                    </div>
                                    <a
                                      href={action.target}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="rounded bg-cyan-400/20 px-2.5 py-1 text-[11px] font-bold text-cyan-100 hover:bg-cyan-400/30"
                                    >
                                      Execute Endpoint →
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Direct Links */}
                          {linksList.length > 0 && (
                            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                              <p className="text-[10px] font-black uppercase tracking-wider text-white/45 mb-2.5">
                                Canonical Direct Links
                              </p>
                              <div className="space-y-2">
                                {linksList.map((link) => (
                                  <div key={link.rel} className="flex items-center justify-between gap-2 rounded-lg border border-white/6 bg-black/20 p-2.5 text-xs">
                                    <span className="font-medium text-white/80">{link.rel.replace(/_/g, " ")}</span>
                                    <a
                                      href={link.target}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-mono text-[11px] text-cyan-300 underline hover:text-cyan-100"
                                    >
                                      {link.target.replace(/^https?:\/\//, "")}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Explanatory note adhering to rules 8 & 9 */}
                        <div className="border-t border-white/6 pt-3 text-[11px] leading-relaxed text-white/40">
                          ℹ️ Direct endpoint data is fetched live from the operator&apos;s public URL. Destination Command Center acts as an open coordinate reader and does not store or duplicate schedules, pricing, or capacity in an intermediate database.
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/8 bg-black/20 p-6 text-sm leading-6 text-white/50 space-y-3">
                  <p>
                    No DCC-compliant operator endpoints currently publish machine-readable coverage for this coordinate.
                  </p>
                  <p className="text-xs text-white/35">
                    Any tourism operator serving this region can publish an endpoint at <code>/.well-known/dcc</code>. Once registered or discovered, live schedules, claims, and booking actions will be hydrated dynamically directly from their authoritative source without marketplace fees.
                  </p>
                </div>
              )}
            </Section>

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
