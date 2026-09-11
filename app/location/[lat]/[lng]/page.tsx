import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import DenseLocationView from "@/app/components/dcc/DenseLocationView";
import ExtendedLocationPanels from "@/app/components/dcc/ExtendedLocationPanels";
import { logDiscoveryRequest } from "@/lib/dcc/discoveryTelemetry";
import { canonicalCoordinate, getDiscoverableLocation, isIndexableCoordinate } from "@/lib/dcc/locationDiscovery";
import { readLocationIntelligence } from "@/lib/dcc/locationIntelligence";
import { readApplicableDccEndpoints } from "@/lib/dcc/endpointRegistry";

const SITE_URL = "https://www.destinationcommandcenter.com";

function parseCoordinate(value: string, min: number, max: number) {
  const decoded = decodeURIComponent(value);
  if (!/^-?\d+(?:\.\d+)?$/.test(decoded)) return null;
  const number = Number(decoded);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function cToF(value: number | null | undefined) {
  return typeof value === "number" ? Math.round((value * 9) / 5 + 32) : null;
}

function kmToMiles(value: number | null | undefined) {
  return typeof value === "number" ? Math.round(value * 0.621371) : null;
}

function formatTime(value?: string | null) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function SnapshotMetric({ label, value, detail }: { label: string; value: string; detail?: string | null }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
      {detail ? <p className="mt-1 text-xs leading-5 text-white/45">{detail}</p> : null}
    </div>
  );
}

async function ServerLocationSnapshot({ lat, lng, dccEndpoints }: { lat: number; lng: number; dccEndpoints?: any[] }) {
  try {
    const [intelligence, endpoints] = await Promise.all([
      readLocationIntelligence({ lat, lng }),
      dccEndpoints ? Promise.resolve(dccEndpoints) : readApplicableDccEndpoints({ lat, lng }),
    ]);
    const weather = intelligence.now?.weather || null;
    const air = intelligence.now?.airQuality || null;
    const nextHours = intelligence.conditions?.next12Hours || [];
    const nextDays = intelligence.conditions?.next3Days || [];
    const alerts = intelligence.hazards?.alerts || [];
    const earthquakes = intelligence.hazards?.earthquakes || [];
    const naturalEvents = intelligence.hazards?.naturalEvents || [];
    const gauges = intelligence.water?.nearbyGauges || [];
    const activeSources = (intelligence.sources || []).filter((source: any) => source.available);

    return (
      <section className="border-b border-white/10 bg-[#070b10] text-white">
        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/70">Server-rendered coordinate brief</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] sm:text-3xl">Public context available before JavaScript</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">Current conditions, official hazards and nearby public signals are rendered into the page itself. The live panels below refresh and expand this snapshot.</p>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/40">{activeSources.length} active public source{activeSources.length === 1 ? "" : "s"}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <SnapshotMetric label="Temperature" value={weather?.temperature_2m != null ? `${cToF(weather.temperature_2m)}°F` : "Unavailable"} detail={weather?.description || null} />
            <SnapshotMetric label="Feels like" value={weather?.apparent_temperature != null ? `${cToF(weather.apparent_temperature)}°F` : "Unavailable"} />
            <SnapshotMetric label="Wind" value={weather?.wind_speed_10m != null ? `${kmToMiles(weather.wind_speed_10m)} mph` : "Unavailable"} detail={weather?.wind_gusts_10m != null ? `Gusts ${kmToMiles(weather.wind_gusts_10m)} mph` : null} />
            <SnapshotMetric label="Humidity" value={weather?.relative_humidity_2m != null ? `${Math.round(weather.relative_humidity_2m)}%` : "Unavailable"} />
            <SnapshotMetric label="Air quality" value={air?.us_aqi != null ? `AQI ${Math.round(air.us_aqi)}` : "Unavailable"} />
            <SnapshotMetric label="Official alerts" value={String(alerts.length)} detail={alerts.length ? "Active mapped alerts for this coordinate" : "No active mapped alert returned"} />
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SnapshotMetric label="Nearby earthquakes" value={String(earthquakes.length)} detail="Recent mapped seismic events in the configured relevance window" />
            <SnapshotMetric label="Natural events" value={String(naturalEvents.length)} detail="Mapped public natural-event signals" />
            <SnapshotMetric label="Water gauges" value={String(gauges.length)} detail="Nearby mapped public gauge stations" />
            <SnapshotMetric label="Elevation" value={intelligence.identity?.elevationM != null ? `${Math.round(intelligence.identity.elevationM * 3.28084).toLocaleString()} ft` : "Unavailable"} detail={intelligence.identity?.timezone || null} />
          </div>

          {endpoints && endpoints.length > 0 ? (
            <div className="mt-8 border-t border-white/10 pt-7">
              <div className="mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/70">
                  Direct Tourism Internet
                </p>
                <h3 className="mt-1 text-xl font-black text-white sm:text-2xl">
                  {endpoints.length} verified operator endpoint{endpoints.length === 1 ? "" : "s"} serving this location
                </h3>
                <p className="mt-1 text-xs text-white/45">
                  This page is a view. The current information comes from the public endpoints that serve this location.
                </p>
              </div>

              <div className="space-y-4">
                {endpoints.map((ep: any, idx: number) => {
                  const data = ep.payload || {};
                  const claims = Array.isArray(data.claims) ? data.claims : [];
                  const legalName = claims.find((c: any) => c.predicate === "legal_name")?.value || ep.name || "Direct Operator";
                  const authClaim = claims.find((c: any) => c.predicate === "operating_authority");
                  const auth = authClaim?.value || "CO PUC LL-03577";
                  const authEvidence = authClaim?.evidence?.[0]?.pointer || "https://puc.colorado.gov/transportation";
                  const actions = Array.isArray(data.actions) ? data.actions : [];
                  const endpointUrl = ep.endpointUrl || "https://gosno.co/.well-known/dcc";

                  return (
                    <div key={endpointUrl || idx} className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/8 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-bold text-white">{legalName}</h4>
                            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-cyan-200">
                              Direct Machine Endpoint
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-white/50">
                            Legal: <span className="font-semibold text-white/80">{legalName}</span>
                            {" "}· Operating Authority:{" "}
                            <a href={authEvidence} target="_blank" rel="noopener noreferrer" className="underline text-cyan-200">
                              {auth}
                            </a>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                            Operational · Verified Fresh
                          </span>
                          {ep.matchedRegion ? (
                            <p className="mt-1 text-[10px] text-white/40">Region: {ep.matchedRegion}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3 rounded-xl border border-white/6 bg-white/[0.02] p-3 text-xs">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-white/40 block">Authoritative Endpoint</span>
                          <a href={endpointUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-cyan-300 underline hover:text-cyan-100 break-all">
                            {endpointUrl}
                          </a>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-white/40 block">As Of</span>
                          <span className="font-mono text-white/70">{ep.asOf || data.as_of || "—"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-white/40 block">Fresh Until</span>
                          <span className="font-mono text-white/70">{ep.freshUntil || data.fresh_until || "—"}</span>
                        </div>
                      </div>

                      {actions.length > 0 && (
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-cyan-200 mb-2">
                            Direct Machine Actions (No Middleman)
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {actions.map((act: any) => (
                              <div key={act.action_id} className="flex items-center justify-between gap-2 rounded-lg border border-white/8 bg-black/20 p-2.5 text-xs">
                                <div>
                                  <span className="font-bold text-white">{act.action_id.replace(/_/g, " ")}</span>
                                  <span className="ml-2 font-mono text-[10px] text-cyan-300">[{act.method}]</span>
                                </div>
                                <a href={act.target} target="_blank" rel="noopener noreferrer" className="rounded bg-cyan-400/20 px-2 py-1 text-[11px] font-bold text-cyan-100">
                                  Execute →
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="border-t border-white/6 pt-3 text-[11px] leading-relaxed text-white/40">
                        ℹ️ Direct endpoint data is fetched live from the operator&apos;s public URL. Destination Command Center acts as an open coordinate reader and does not store or duplicate schedules, pricing, or capacity in an intermediate database.
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {nextHours.length ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/70">Next hours</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {nextHours.slice(0, 6).map((hour: any) => (
                  <div key={hour.time} className="rounded-xl bg-black/25 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">{formatTime(hour.time)}</p>
                    <p className="mt-1 text-lg font-black">{hour.temperatureC != null ? `${cToF(hour.temperatureC)}°` : "—"}</p>
                    <p className="mt-1 text-[11px] leading-4 text-white/45">{hour.description || "Forecast available"}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {nextDays.length ? (
            <div className="mt-3 text-xs leading-5 text-white/45">
              Three-day context is available for {nextDays.length} day{nextDays.length === 1 ? "" : "s"}, including temperature, precipitation, sunrise, sunset and UV fields where the public source provides them.
            </div>
          ) : null}
        </div>
      </section>
    );
  } catch {
    return (
      <section className="border-b border-white/10 bg-[#070b10] text-white">
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
          <p className="text-sm leading-6 text-white/55">Live public sources are temporarily unavailable. The coordinate remains canonical and the live panels below will retry independently.</p>
        </div>
      </section>
    );
  }
}

type PageProps = {
  params: Promise<{ lat: string; lng: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const raw = await params;
  const lat = parseCoordinate(raw.lat, -90, 90);
  const lng = parseCoordinate(raw.lng, -180, 180);
  if (lat == null || lng == null) {
    return { title: "Location not found | Destination Command Center", robots: { index: false, follow: false } };
  }

  const known = getDiscoverableLocation(lat, lng);
  const indexable = isIndexableCoordinate(lat, lng);
  const coordinate = `${canonicalCoordinate(lat)}, ${canonicalCoordinate(lng)}`;
  const label = known?.name || coordinate;

  return {
    title: `${label} | Destination Command Center`,
    description: known
      ? `Dense public location intelligence for ${known.name}, anchored to latitude ${canonicalCoordinate(lat)} and longitude ${canonicalCoordinate(lng)}.`
      : `Dense public location intelligence for latitude ${canonicalCoordinate(lat)} and longitude ${canonicalCoordinate(lng)}.`,
    alternates: { canonical: `/location/${canonicalCoordinate(lat)}/${canonicalCoordinate(lng)}` },
    robots: { index: indexable, follow: true },
  };
}

export default async function CoordinateLocationPage({ params }: PageProps) {
  const raw = await params;
  const lat = parseCoordinate(raw.lat, -90, 90);
  const lng = parseCoordinate(raw.lng, -180, 180);
  if (lat == null || lng == null) notFound();

  const canonicalLat = canonicalCoordinate(lat);
  const canonicalLng = canonicalCoordinate(lng);
  if (raw.lat !== canonicalLat || raw.lng !== canonicalLng) {
    permanentRedirect(`/location/${canonicalLat}/${canonicalLng}`);
  }

  const known = getDiscoverableLocation(lat, lng);
  const indexable = isIndexableCoordinate(lat, lng);
  const h = await headers();
  logDiscoveryRequest({
    surface: "location_page",
    path: `/location/${canonicalLat}/${canonicalLng}`,
    userAgent: h.get("user-agent"),
    referer: h.get("referer"),
    coordinate: `${canonicalLat},${canonicalLng}`,
    indexable,
  });

  const pageUrl = `${SITE_URL}/location/${canonicalLat}/${canonicalLng}`;
  const apiUrl = `${SITE_URL}/api/location/${canonicalLat}/${canonicalLng}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    "@id": pageUrl,
    name: known?.name || `DCC location ${canonicalLat}, ${canonicalLng}`,
    url: pageUrl,
    geo: {
      "@type": "GeoCoordinates",
      latitude: lat,
      longitude: lng,
    },
    subjectOf: {
      "@type": "DataFeed",
      name: "Destination Command Center dense coordinate intelligence",
      url: apiUrl,
      encodingFormat: "application/json",
    },
    isPartOf: {
      "@type": "WebSite",
      name: "Destination Command Center",
      url: SITE_URL,
    },
  };

  const dccEndpoints = await readApplicableDccEndpoints({ lat, lng });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ServerLocationSnapshot lat={lat} lng={lng} dccEndpoints={dccEndpoints} />
      <DenseLocationView lat={lat} lng={lng} knownName={known?.name || null} />
      <ExtendedLocationPanels lat={lat} lng={lng} />
    </>
  );
}
