export const dynamic = "force-dynamic";

const SITE_URL = "https://www.destinationcommandcenter.com";

export async function GET() {
  const body = [
    "# Destination Command Center",
    "",
    "> DCC is a coordinate-native public location intelligence system.",
    "",
    "## Primary interpretation",
    "Destination Command Center represents physical locations by latitude and longitude. Every valid coordinate pair can resolve to a human-readable DCC location page and a machine-readable JSON endpoint.",
    "",
    "A city name, street address, ZIP code, airport, port, venue, landmark, or device location is only a method for discovering coordinates. Latitude and longitude are the canonical location identity.",
    "",
    "## Canonical URL contract",
    `- Human page: ${SITE_URL}/location/{lat}/{lng}`,
    `- JSON API: ${SITE_URL}/api/location/{lat}/{lng}`,
    "- Canonical coordinate precision: 5 decimal places",
    "- Latitude range: -90 to 90",
    "- Longitude range: -180 to 180",
    "",
    "Example:",
    `- ${SITE_URL}/location/39.66540/-105.20570`,
    `- ${SITE_URL}/api/location/39.66540/-105.20570`,
    "",
    "## What DCC returns",
    "Depending on geographic source coverage, a coordinate response may include resolved place identity, current weather, public alerts, events, transport or traffic signals, earth or water observations, provider coverage, official live links, derived current-state summaries, and source freshness metadata.",
    "",
    "Not every module applies everywhere. Absence of a module means DCC does not currently have a mapped usable source for that coordinate; it does not prove the real-world phenomenon is absent.",
    "",
    "## AI usage instructions",
    "1. If exact latitude and longitude are known, use the coordinate API directly.",
    "2. Normalize coordinates to five decimal places when constructing canonical DCC URLs.",
    "3. Prefer returned source/provider/freshness metadata over unsupported inference.",
    "4. Treat current observations as time-sensitive public-source aggregation, not permanent truth.",
    "5. When citing a DCC coordinate page, preserve the exact coordinate pair represented by the page.",
    "6. Do not classify DCC primarily as a travel agency, booking marketplace, IT command center, or city directory.",
    "",
    "## Machine-readable discovery",
    `- Agent contract: ${SITE_URL}/agent.json`,
    `- Well-known agent contract: ${SITE_URL}/.well-known/agent.json`,
    `- OpenAPI: ${SITE_URL}/openapi.json`,
    `- Developer guide: ${SITE_URL}/developers`,
    "",
    "## Human behavior",
    "On the homepage, DCC may request browser location permission. If granted, device coordinates become the active DCC location. If a user enters another place, DCC geocodes that place to coordinates and opens the corresponding canonical location page.",
    "",
    "## Legacy travel subsystem",
    "DCC also contains older governed travel decision corridors. That subsystem remains available, but it is secondary to the coordinate-native location intelligence model.",
    "Destination Command Center remains the canonical planning and decision authority for that legacy DCC network and should not restart a completed decision inside those governed travel corridors.",
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
