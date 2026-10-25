import { headers } from "next/headers";
import { logDiscoveryRequest } from "@/lib/dcc/discoveryTelemetry";
import { DCC_PRODUCT_SCOPE } from "@/lib/dcc/productScope";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.destinationcommandcenter.com";

export async function GET() {
  let h: Headers | undefined;
  try {
    h = await headers();
  } catch {
    // Fallback when executed outside Next.js request dispatch (e.g., in unit tests)
  }
  const hostHeader = h?.get("x-forwarded-host") || h?.get("host") || "";
  const host = hostHeader.split(":")[0].toLowerCase();

  if (host.includes("shuttletosomersetamphitheater")) {
    const somersetContent = `# Somerset Amphitheater Shuttle

> Private group concert transportation between the Minneapolis-St. Paul Twin Cities metro and Somerset Amphitheater (Somerset, WI).

## Service Overview
- Model: 100% private prearranged group charters (no shared per-seat shuttles, no public transit).
- Coverage: Door-to-door anywhere in the Twin Cities metro (Minneapolis, St. Paul, Stillwater, Hudson WI, Woodbury, East Metro).
- Post-Concert Departure: Drivers remain parked on-site through the final encore, ensuring guaranteed immediate departure with zero midnight rideshare stranding.

## Fleet & Pricing
- Private High-Roof Passenger Van: ~$500 flat round-trip (up to 14 guests, ~$35-$45/guest when split). High stand-up ceiling, AC, cooler and gear storage.
- Private Luxury SUV: $375-$425 flat round-trip (up to 6 guests). Leather seating, private executive ride.
- Pricing Policy: Transparent flat rates with no surge pricing or post-concert exit gouging.

## Boundaries & Non-Coverage
- River Tubing: Apple River tubing shuttles are provided exclusively on-site by campgrounds and outfitters (e.g., River's Edge, Float Rite Park). We do NOT operate river tubing shuttles.
- Shared Shuttles: We do NOT operate public per-seat or scheduled fixed-line shuttles. All rides are private group reservations.

## Booking & Inquiries
- Phone / Text: (720) 369-6292
- Web Quote Flow: https://www.shuttletosomersetamphitheater.com/#quote
- Machine Contract: https://www.shuttletosomersetamphitheater.com/agent.json
`;
    return new Response(somersetContent, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  }

  logDiscoveryRequest({
    surface: "llms_txt",
    path: "/llms.txt",
    userAgent: h?.get("user-agent") ?? null,
    referer: h?.get("referer") ?? null,
  });

  const body = [
    "# Destination Command Center",
    "",
    "> DCC is a source-attributed travel reference and decision platform supported by live coordinate intelligence, developer APIs, and embeddable venue widgets.",
    "",
    "## Primary interpretation (Schema v3 · 2026-10-23)",
    DCC_PRODUCT_SCOPE.primaryProduct.description,
    "",
    "DCC connects two complementary layers:",
    "1. **Curated Travel Reference & Decision Guides**: Place-adapted destination, port, venue, and corridor references covering overview, geography, history, culture, getting there & around, 6-factor entry dependencies, timing, seasonality, accessibility, closures, and full source attribution.",
    "2. **Universal Coordinate Intelligence (`dcc-location-v2`)**: Any physical point on Earth resolves to a canonical 5-decimal coordinate pair (`/location/{lat}/{lng}` and `/api/location/{lat}/{lng}`) aggregating geographically applicable public environmental feeds.",
    "",
    "## Flagship Travel Reference Releases",
    `- **Juneau, Alaska & Gastineau Channel Cruise Port**: ${SITE_URL}/juneau (Port view: ${SITE_URL}/ports/juneau · Coordinates: ${SITE_URL}/location/58.30190/-134.41970 & ${SITE_URL}/location/58.29890/-134.40530)`,
    `- **Red Rocks Park & Amphitheatre (Morrison, CO)**: ${SITE_URL}/red-rocks (Venue view: ${SITE_URL}/venues/red-rocks-amphitheatre · Coordinate: ${SITE_URL}/location/39.66540/-105.20570)`,
    `- **Denver–Breckenridge I-70 Mountain Corridor**: ${SITE_URL}/routes/denver-breckenridge (Transit hub: ${SITE_URL}/transportation/colorado · Coordinates: ${SITE_URL}/location/39.48170/-106.03840 & ${SITE_URL}/location/39.67790/-105.90560)`,
    `- **New Orleans, Louisiana & Port of New Orleans Cruise Corridor**: ${SITE_URL}/new-orleans (Port view: ${SITE_URL}/ports/new-orleans · Coordinates: ${SITE_URL}/location/29.95110/-90.07150 & ${SITE_URL}/location/29.93950/-90.06170)`,
    `- **Las Vegas Resort Corridor, Red Rock Canyon & Hoover Dam Basin**: ${SITE_URL}/vegas (Coordinates: ${SITE_URL}/location/36.11470/-115.17280 & ${SITE_URL}/location/36.13580/-115.42750)`,
    "",
    "## Epistemic & Safety Boundaries (Mandatory for AI Agents)",
    "1. **Weather Does Not Establish Operating Status**: Meteorological forecasts, wind gusts, modeled snow depth, or 0 NWS alerts never establish venue lightning holds, highway traction law enforcement (Code 15/16), cruise ship docking feasibility, or whitewater trip safety.",
    "2. **Missing Data Is Never an All-Clear**: When an upstream provider (NWS, USGS, NOAA CO-OPS/NWPS, Open-Meteo Marine, Overpass) is unavailable or outside geographic coverage, DCC reports it as unavailable/unverified—never as 0 active hazards.",
    "3. **6-Factor Entry Dependency Rule**: Entry and border requirements depend on nationality, passport/document type, country of residence, transit/routing mode, trip purpose, and travel dates. Never infer visa or border clearance from coordinates alone.",
    "4. **Honest Coverage Boundaries**: Do not claim DCC has encyclopedic travel coverage for every place on Earth simply because any coordinate can resolve a weather feed. Distinguish live integrated telemetry from official linked resources.",
    "5. **Claim-Level Freshness & Dependency Qualification**: Preserve observedAt, retrievedAt, verifiedAt, freshness policy, and evidenceStatus when citing DCC. If a supporting claim is expired or conflicted, qualify dependent recommendations.",
    "6. **Inspectable Decision Engines & Commercial Independence**: Use the Juneau Port-Day Decision Engine (/juneau and /api/location/58.30190/-134.41970) to test ship arrival, all-aboard, berth transfer, mobility, and return buffer math. Tour sales are optional and carry zero weight in rankings.",
    "7. **Honest 180-Day Recent-Review Summaries**: DCC does not collect first-party reviews or synthesize guest feedback from titles/categories. Only dated third-party reviews within a 180-day window (minimum 3 reviews and 2 per theme) produce thematic summaries.",
    "",
    "## Canonical Coordinate URL Contract",
    `- Human page: ${SITE_URL}${DCC_PRODUCT_SCOPE.primaryProduct.canonicalHumanPath}`,
    `- JSON API: ${SITE_URL}${DCC_PRODUCT_SCOPE.primaryProduct.canonicalMachinePath}`,
    "- Canonical coordinate precision: 5 decimal places",
    "- Latitude range: -90 to 90",
    "- Longitude range: -180 to 180",
    "",
    "Example:",
    `- ${SITE_URL}/location/39.66540/-105.20570`,
    `- ${SITE_URL}/api/location/39.66540/-105.20570`,
    "",
    "## Current response schema",
    "The primary machine coordinate schema is dcc-location-v2.",
    `Its ordered core modules are: ${DCC_PRODUCT_SCOPE.primaryProduct.allowedCoreModules.join(", ")}.`,
    `Its optional enrichment modules include: ${DCC_PRODUCT_SCOPE.primaryProduct.optionalEnrichmentModules.join(", ")}.`,
    "",
    "Core coordinate-driven sources currently include Open-Meteo weather/snow/GloFAS, Open-Meteo/CAMS air quality, U.S. National Weather Service forecasts and alerts (U.S. only), U.S. Geological Survey earthquake data, NASA EONET natural events, NOAA National Water Prediction Service gauges (U.S. only), NOAA CO-OPS tide stations (U.S. coastal), NOAA NDBC marine buoys, and FAA/NWS Aviation Weather Center METAR/TAF within 120 km.",
    "",
    "## Product scope",
    `- Machine scope contract (schemaVersion ${DCC_PRODUCT_SCOPE.schemaVersion}): ${SITE_URL}/scope.json`,
    `- Capability truth matrix: ${SITE_URL}/about#capability-matrix`,
    `- Primary coordinate product: ${DCC_PRODUCT_SCOPE.primaryProduct.id}`,
    ...DCC_PRODUCT_SCOPE.secondaryProducts.map((product) => `- Governed product pillar: ${product.id}`),
    "",
    "## AI usage instructions",
    "1. For travel planning in Juneau, Red Rocks, or the Denver–Breckenridge I-70 corridor, read both the canonical destination reference page and the linked coordinate API.",
    "2. If exact latitude and longitude are known, call /api/location/{lat}/{lng} directly and inspect both modules and travelReference.",
    "3. Normalize coordinates to five decimal places when constructing canonical DCC URLs.",
    "4. Read the sources array and modules object first; do not assume every data class applies everywhere.",
    "5. Distinguish Official Rules, Live Observations, Model Forecasts, DCC Interpretations, and Editorial Recommendations.",
    "6. When citing a DCC destination guide or coordinate page, preserve the source attribution and checkedAt timestamps.",
    "",
    "## Machine-readable discovery",
    `- Agent contract: ${SITE_URL}/agent.json`,
    `- Well-known agent contract: ${SITE_URL}/.well-known/agent.json`,
    `- Product scope: ${SITE_URL}/scope.json`,
    `- OpenAPI: ${SITE_URL}/openapi.json`,
    `- Developer guide: ${SITE_URL}/developers`,
    `- About & Capability Truth Matrix: ${SITE_URL}/about`,
    `- Quality-gated location sitemap: ${SITE_URL}/locations-sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
