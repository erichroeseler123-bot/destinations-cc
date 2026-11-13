import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  buildOpenMeteoCommercialUrl,
  clearWeatherGatewayMemoryCacheForTests,
  isUsNoaaEligibleCoordinate,
  resolveCentralizedWeatherSummary,
} from "../../lib/dcc/weatherGateway";
import {
  sanitizeTelemetryMetadataObject,
  sanitizeTelemetryPath,
} from "../../lib/dcc/telemetry/privacyTelemetryGuard";
import {
  buildLocalQrSvgDataUri,
  buildLocalTelemetryAvatarDataUri,
} from "../../lib/dcc/qrSvg";
import { PROVIDER_INDEX } from "../../lib/dcc/providers/provider-registry";
import { getOrganizationSchema, getWebsiteSchema } from "../../src/data/site-identity";
import { GET as getDccSiteManifest } from "../../app/.well-known/dcc-site/route";
import { GET as getAgentManifest } from "../../app/agent.json/route";

const ROOT = process.cwd();

function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectSourceFiles(full));
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

test("Stage 1 Weather: U.S. coordinates route to NOAA/NWS without calling Open-Meteo", async () => {
  clearWeatherGatewayMemoryCacheForTests();
  const calledUrls: string[] = [];
  const mockFetch: typeof fetch = async (input: any) => {
    const url = String(input);
    calledUrls.push(url);
    if (url.includes("api.weather.gov/points/")) {
      return new Response(
        JSON.stringify({
          properties: {
            forecastHourly: "https://api.weather.gov/gridpoints/AJK/190,155/forecast/hourly",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/geo+json" } },
      );
    }
    if (url.includes("api.weather.gov/gridpoints/")) {
      return new Response(
        JSON.stringify({
          properties: {
            updated: "2026-11-13T15:00:00Z",
            periods: [
              {
                startTime: "2026-11-13T15:00:00Z",
                temperature: 44,
                temperatureUnit: "F",
                windSpeed: "12 mph",
                shortForecast: "Light Rain",
                probabilityOfPrecipitation: { value: 70 },
                relativeHumidity: { value: 88 },
              },
            ],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/geo+json" } },
      );
    }
    if (url.includes("api.weather.gov/alerts/active")) {
      return new Response(JSON.stringify({ features: [] }), {
        status: 200,
        headers: { "Content-Type": "application/geo+json" },
      });
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  // Juneau, AK (58.3019, -134.4197)
  assert.equal(isUsNoaaEligibleCoordinate(58.3019, -134.4197), true);
  const summary = await resolveCentralizedWeatherSummary({
    lat: 58.3019,
    lng: -134.4197,
    label: "Juneau, AK",
    env: {},
    fetchImpl: mockFetch,
  });

  assert.equal(summary.dataMode, "live_noaa");
  assert.equal(summary.isCurrentConditions, true);
  assert.equal(summary.freshnessStatus, "fresh");
  assert.equal(summary.temperatureF, 44);
  assert.ok(calledUrls.every((u) => u.includes("api.weather.gov")));
  assert.equal(calledUrls.some((u) => u.includes("open-meteo.com")), false);
});

test("Stage 1 Weather: International coordinates without OPEN_METEO_API_KEY serve labeled seasonal climatology and make 0 Open-Meteo calls", async () => {
  clearWeatherGatewayMemoryCacheForTests();
  const calledUrls: string[] = [];
  const mockFetch: typeof fetch = async (input: any) => {
    calledUrls.push(String(input));
    throw new Error("Should not fetch upstream without OPEN_METEO_API_KEY");
  };

  // Cozumel, Mexico (20.4229, -86.9223)
  assert.equal(isUsNoaaEligibleCoordinate(20.4229, -86.9223), false);
  assert.equal(
    buildOpenMeteoCommercialUrl("forecast", { latitude: "20.4229", longitude: "-86.9223" }, {}),
    null,
  );

  const summary = await resolveCentralizedWeatherSummary({
    lat: 20.4229,
    lng: -86.9223,
    label: "Cozumel, Mexico",
    env: {},
    fetchImpl: mockFetch,
  });

  assert.equal(summary.dataMode, "seasonal_climatology");
  assert.equal(summary.isCurrentConditions, false, "Climatology must NEVER claim current conditions");
  assert.equal(summary.temperatureF, null, "Climatology must NOT invent a current temperature");
  assert.equal(summary.temperatureC, null);
  assert.ok(summary.climatology);
  assert.equal(calledUrls.length, 0, "Zero calls permitted to free Open-Meteo endpoint");
});

test("Stage 1 Weather: International coordinates WITH valid OPEN_METEO_API_KEY use customer-api.open-meteo.com and degrade to cached_snapshot (isCurrentConditions: false) when stale", async () => {
  clearWeatherGatewayMemoryCacheForTests();
  const calledUrls: string[] = [];
  let shouldFailUpstream = false;

  const mockFetch: typeof fetch = async (input: any) => {
    const url = String(input);
    calledUrls.push(url);
    if (shouldFailUpstream) {
      return new Response("upstream unavailable", { status: 503 });
    }
    return new Response(
      JSON.stringify({
        current: {
          time: "2026-11-13T15:00",
          temperature_2m: 27.5,
          apparent_temperature: 30.0,
          relative_humidity_2m: 75,
          weather_code: 1,
          wind_speed_10m: 18.0,
        },
        hourly: {
          time: ["2026-11-13T15:00"],
          temperature_2m: [27.5],
          precipitation_probability: [15],
          weather_code: [1],
          wind_speed_10m: [18.0],
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const t0 = new Date("2026-11-13T15:00:00Z");
  const live = await resolveCentralizedWeatherSummary({
    lat: 25.0772,
    lng: -77.345,
    label: "Nassau, Bahamas",
    now: t0,
    env: { OPEN_METEO_API_KEY: "om_comm_test_valid_key_12345" },
    fetchImpl: mockFetch,
  });

  assert.equal(live.dataMode, "live_open_meteo_commercial");
  assert.equal(live.isCurrentConditions, true);
  assert.equal(calledUrls.length, 1);
  assert.ok(calledUrls[0].startsWith("https://customer-api.open-meteo.com/v1/forecast?"));
  assert.equal(calledUrls[0].includes("https://api.open-meteo.com"), false);

  // Advance 30 minutes (>15m fresh TTL, <24h stale snapshot retention) and fail upstream
  shouldFailUpstream = true;
  const tStale = new Date(t0.getTime() + 30 * 60 * 1000);
  const stale = await resolveCentralizedWeatherSummary({
    lat: 25.0772,
    lng: -77.345,
    label: "Nassau, Bahamas",
    now: tStale,
    env: {}, // even if key is missing/expired later
    fetchImpl: mockFetch,
  });

  assert.equal(stale.dataMode, "cached_snapshot");
  assert.equal(stale.isCurrentConditions, false, "Stale cached snapshot must NEVER claim current conditions");
  assert.equal(stale.freshnessStatus, "stale_cached_snapshot");
  assert.equal(stale.temperatureF, live.temperatureF);
});

test("Stage 1 Compliance: Zero free open-meteo, browser Nominatim, qrserver, or dicebear URLs in runtime app/lib/components", () => {
  const dirs = ["app", "components", "lib", "apps"].map((d) => path.join(ROOT, d));
  const files = dirs.flatMap((d) => (fs.existsSync(d) ? collectSourceFiles(d) : []));

  const forbiddenHostSnippets = [
    "://api.open-meteo.com",
    "://marine-api.open-meteo.com",
    "://air-quality-api.open-meteo.com",
    "://flood-api.open-meteo.com",
    "api.qrserver.com",
    "api.dicebear.com",
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    for (const forbidden of forbiddenHostSnippets) {
      assert.equal(
        content.includes(forbidden),
        false,
        `Forbidden external host '${forbidden}' found in ${rel}`,
      );
    }
    // Client components must never call nominatim.openstreetmap.org directly
    if (content.includes('"use client"') || content.includes("'use client'")) {
      assert.equal(
        content.includes("nominatim.openstreetmap.org"),
        false,
        `Browser-direct Nominatim call found in client component ${rel}`,
      );
    }
  }

  // Local SVG generators produce self-contained data URIs
  const qr = buildLocalQrSvgDataUri("https://destinationcommandcenter.com/juneau", 220);
  const avatar = buildLocalTelemetryAvatarDataUri("port_monitor");
  assert.ok(qr.startsWith("data:image/svg+xml;utf8,"));
  assert.ok(avatar.startsWith("data:image/svg+xml;utf8,"));
});

test("Stage 1 Supplier Indexing Policy: Viator and GetYourGuide are attribution_non_indexable", () => {
  const viator = PROVIDER_INDEX.get("viator");
  const gyg = PROVIDER_INDEX.get("getyourguide");
  assert.ok(viator);
  assert.ok(gyg);
  assert.equal(viator.surfacePolicy, "attribution_non_indexable");
  assert.equal(gyg.surfacePolicy, "attribution_non_indexable");
  assert.equal(PROVIDER_INDEX.indexableAllowedKeys.includes("viator"), false);
  assert.equal(PROVIDER_INDEX.indexableAllowedKeys.includes("getyourguide"), false);
});

test("Stage 2 Telemetry Privacy: Strips shareCode, /p/<shareCode>, cabin numbers, booking refs, emails, and phones", () => {
  assert.equal(sanitizeTelemetryPath("/p/8f3a2b1c9d0e4f5a6b7c8d9e?token=secret"), "/p/[redacted]");
  assert.equal(sanitizeTelemetryPath("/organizer/abc123def456?cabin=9142"), "/organizer/[redacted]");
  assert.equal(sanitizeTelemetryPath("/book/return?booking_session_id=cpsess_0123456789abcdef0123456789abcdef"), "/book/return");

  const scrubbed = sanitizeTelemetryMetadataObject({
    shipSlug: "icon-of-the-seas",
    sailDate: "2027-01-16",
    shareCode: "8f3a2b1c9d0e4f5a6b7c8d9e",
    partner_booking_ref: "BK-998877",
    booking_session_id: "cpsess_0123456789abcdef0123456789abcdef",
    cabinNumber: "10244",
    noteWithCabin: "Meet at Cabin 10244",
    email: "alice@example.com",
    phone: "303-555-0199",
    passengerName: "Alice Rivera",
    partyCount: 4,
    fitVerdict: "fits_with_buffer",
  });

  assert.deepEqual(scrubbed, {
    shipSlug: "icon-of-the-seas",
    sailDate: "2027-01-16",
    hasShareContext: true,
    partyCount: 4,
    fitVerdict: "fits_with_buffer",
  });
});

test("Stage 2 Machine Relationships & Route Preservation: Truthful DCC/CP manifests without parentOrganization or unapproved partner claims; GoSno & PARR preserved", async () => {
  const org = getOrganizationSchema() as Record<string, unknown>;
  const site = getWebsiteSchema() as Record<string, unknown>;
  assert.equal("parentOrganization" in org, false);
  assert.equal("subOrganization" in org, false);
  assert.equal("additionalType" in org, false);
  assert.ok(Array.isArray(site.relatedLink));

  const dccSiteRes = await getDccSiteManifest(
    new Request("https://destinationcommandcenter.com/.well-known/dcc-site"),
  );
  assert.equal(dccSiteRes.status, 200);
  const dccSiteJson = await dccSiteRes.json();
  assert.equal("hasPart" in dccSiteJson.entity_graph, false);
  assert.equal(dccSiteJson.entity_graph.legal_and_commercial_truth.claims_legal_parent_organization, false);
  assert.equal(dccSiteJson.entity_graph.legal_and_commercial_truth.claims_active_cruise_booking_partner, false);

  const agentRes = await getAgentManifest();
  assert.equal(agentRes.status, 200);
  const agentJson = await agentRes.json();
  assert.equal("hasPart" in agentJson.network, false);
  assert.equal(agentJson.network.legal_and_commercial_truth.claims_legal_parent_organization, false);

  const serializedManifests = JSON.stringify({ dccSiteJson, agentJson }).toLowerCase();
  for (const unapprovedCruisePartner of ["boundless", "world travel holdings", "cruisedirect"]) {
    assert.equal(
      serializedManifests.includes(unapprovedCruisePartner),
      false,
      `Machine manifests must not claim unapproved cruise booking provider '${unapprovedCruisePartner}'`,
    );
  }

  // Standalone specialist route preservation check (GoSno & Party at Red Rocks corridors)
  const preservedRoutes = [
    "app/routes/[slug]/page.tsx",
    "app/red-rocks/page.tsx",
    "app/red-rocks-shuttle/page.tsx",
    "app/juneau/page.tsx",
    "app/ports/[slug]/page.tsx",
    "app/cruises/fit/page.tsx",
    "app/api/v1/cruise/journey-intelligence/route.ts",
    "app/api/v1/cruise/port-day-excursions/route.ts",
  ];
  for (const rel of preservedRoutes) {
    assert.equal(
      fs.existsSync(path.join(ROOT, rel)),
      true,
      `Critical DCC/specialist route missing: ${rel}`,
    );
  }
});
