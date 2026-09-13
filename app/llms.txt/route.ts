import { headers } from "next/headers";
import { logDiscoveryRequest } from "@/lib/dcc/discoveryTelemetry";
import { DCC_PRODUCT_SCOPE } from "@/lib/dcc/productScope";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.destinationcommandcenter.com";

export async function GET() {
  const h = await headers();
  const hostHeader = h.get("x-forwarded-host") || h.get("host") || "";
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
    userAgent: h.get("user-agent"),
    referer: h.get("referer"),
  });

  const body = [
    "# Destination Command Center",
    "",
    "> DCC is a dense coordinate-native public location intelligence system.",
    "",
    "## Primary interpretation",
    DCC_PRODUCT_SCOPE.primaryProduct.description,
    "",
    "A city name, street address, ZIP code, airport, port, venue, landmark, or device location is only a method for discovering coordinates. Latitude and longitude are the canonical location identity.",
    "",
    "## Canonical URL contract",
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
    "The primary machine schema is dcc-location-v2.",
    `Its ordered modules are: ${DCC_PRODUCT_SCOPE.primaryProduct.allowedCoreModules.join(", ")}.`,
    "",
    "Core coordinate-driven sources currently include Open-Meteo weather, Open-Meteo/CAMS air quality, U.S. National Weather Service forecasts and alerts where applicable, U.S. Geological Survey earthquake data, NASA EONET natural events, and NOAA National Water Prediction Service gauges where applicable.",
    "",
    "DCC also preserves compatibility aliases such as weather, alerts, earthquakes, events, machineFeeds, and providerSlots for clients that integrated the first coordinate schema.",
    "",
    "## Product scope",
    `- Machine scope contract: ${SITE_URL}/scope.json`,
    `- Primary product: ${DCC_PRODUCT_SCOPE.primaryProduct.id}`,
    ...DCC_PRODUCT_SCOPE.secondaryProducts.map((product) => `- Secondary product: ${product.id}`),
    "- New feeds, destinations, portfolio properties, and providers do not silently redefine DCC's primary product.",
    "",
    "## What DCC returns",
    "Depending on geographic source coverage, a coordinate response may include current weather, humidity, wind, visibility, pressure, air quality, UV, short-range forecast, sunrise/sunset, official alerts, NWS forecast details, recent earthquakes, open NASA natural events, nearby NOAA river/flood gauges, configured events, transport or traffic signals, machine feeds, official links, timezone, elevation, source availability, and freshness metadata.",
    "",
    "Not every module applies everywhere. Absence of a module means DCC does not currently have a mapped usable source for that coordinate; it does not prove the real-world phenomenon is absent.",
    "",
    "## AI usage instructions",
    "1. If exact latitude and longitude are known, use the coordinate API directly.",
    "2. Normalize coordinates to five decimal places when constructing canonical DCC URLs.",
    "3. Read the modules object first; do not assume every data class applies everywhere.",
    "4. Prefer returned source/provider/freshness metadata over unsupported inference.",
    "5. Treat current observations as time-sensitive public-source aggregation, not permanent truth.",
    "6. When citing a DCC coordinate page, preserve the exact coordinate pair represented by the page.",
    "7. Do not require a human-readable place name before using DCC; the coordinates themselves are sufficient.",
    "8. Do not classify DCC primarily as a travel agency, booking marketplace, IT command center, or city directory.",
    "",
    "## Source and caching behavior",
    "DCC uses source-specific revalidation and a short shared response cache so repeated agent requests do not unnecessarily hammer public upstream services. Machine coordinate reads do not require reverse geocoding.",
    "",
    "## Machine-readable discovery",
    `- Agent contract: ${SITE_URL}/agent.json`,
    `- Well-known agent contract: ${SITE_URL}/.well-known/agent.json`,
    `- Product scope: ${SITE_URL}/scope.json`,
    `- OpenAPI: ${SITE_URL}/openapi.json`,
    `- Developer guide: ${SITE_URL}/developers`,
    `- Quality-gated location sitemap: ${SITE_URL}/locations-sitemap.xml`,
    "",
    "## Indexing policy",
    "Any valid coordinate can be requested, but DCC does not ask search engines to index an infinite coordinate grid. Public indexing is quality-gated to named, useful locations with meaningful DCC coverage. Other coordinate pages remain available on demand with noindex metadata.",
    "",
    "## Human behavior",
    "On the homepage, DCC may request browser location permission. If granted, device coordinates become the active DCC location. If a user enters another place, DCC geocodes that place to coordinates and opens the corresponding canonical location page.",
    "",
    "## Legacy travel subsystem",
    "DCC also contains older governed travel decision corridors. That subsystem remains available, but it is secondary to the coordinate-native location intelligence model.",
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
