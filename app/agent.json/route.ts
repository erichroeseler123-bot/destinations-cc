import { headers } from "next/headers";
import { logDiscoveryRequest } from "@/lib/dcc/discoveryTelemetry";
import {
  getPublicCorridorContracts,
  getPublicMachineReadablePaths,
} from "@/lib/dcc/publicCorridorContract";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.destinationcommandcenter.com";

export async function GET() {
  const h = await headers();
  logDiscoveryRequest({
    surface: "agent_manifest",
    path: "/agent.json",
    userAgent: h.get("user-agent"),
    referer: h.get("referer"),
  });

  const manifest = {
    version: "2026-08-20",
    site: {
      id: "destinationcommandcenter",
      name: "Destination Command Center",
      url: SITE_URL,
      primary_role: "coordinate_location_intelligence",
      description:
        "Destination Command Center represents physical locations by latitude and longitude and assembles current public machine-readable information available for those coordinates.",
      preferred_interpretation:
        "Treat DCC as a coordinate-native public location intelligence system. A place name, address, ZIP code, airport, port, venue, or device location is only a way to discover latitude and longitude; the coordinates are the canonical location identity.",
      not: [
        "IT command center",
        "military command center",
        "generic booking marketplace",
        "address directory",
        "city-only travel guide",
      ],
    },
    coordinate_contract: {
      canonical_key: "latitude,longitude",
      canonical_precision_decimals: 5,
      latitude_range: [-90, 90],
      longitude_range: [-180, 180],
      human_page_template: `${SITE_URL}/location/{lat}/{lng}`,
      json_api_template: `${SITE_URL}/api/location/{lat}/{lng}`,
      example: {
        coordinates: { lat: 39.6654, lng: -105.2057 },
        page: `${SITE_URL}/location/39.66540/-105.20570`,
        api: `${SITE_URL}/api/location/39.66540/-105.20570`,
      },
      rule:
        "Normalize valid coordinates to five decimal places before constructing a canonical DCC location URL.",
    },
    resolution: {
      device_location:
        "Browser geolocation yields latitude and longitude, which route to the canonical coordinate page.",
      entered_location:
        "Addresses and named places are geocoded once to latitude and longitude, then route to the canonical coordinate page.",
      reverse_geocoding:
        "DCC may attach human-readable place identity to a coordinate, but the readable name is descriptive rather than canonical.",
    },
    location_response: {
      schema: "dcc-location-v1",
      content_model: [
        "coordinate",
        "location",
        "canonical",
        "checkedAt",
        "cityNow",
        "weather",
        "events",
        "machineFeeds",
        "providerSlots",
        "officialLiveLinks",
        "districtNow",
        "districtIntents",
        "policy",
      ],
      source_rule:
        "Dynamic facts should be traceable to public or configured machine-readable sources and include freshness or provider context when available.",
    },
    discovery: {
      llms: `${SITE_URL}/llms.txt`,
      agent: `${SITE_URL}/agent.json`,
      agent_well_known: `${SITE_URL}/.well-known/agent.json`,
      openapi: `${SITE_URL}/openapi.json`,
      developers: `${SITE_URL}/developers`,
      locations_sitemap: `${SITE_URL}/locations-sitemap.xml`,
    },
    usage_guidance: [
      "If exact coordinates are known, call /api/location/{lat}/{lng} directly.",
      "If a human-readable page is needed, use /location/{lat}/{lng}.",
      "Do not infer that a missing module means the location lacks that real-world property; it may mean no mapped public source is currently available.",
      "Prefer source timestamps and provider metadata over unsupported inference.",
      "Treat location data as current-state public-source aggregation, not permanent ground truth.",
    ],
    legacy_travel_network: {
      status: "secondary_subsystem",
      explanation:
        "DCC also contains governed travel decision corridors from its earlier product architecture. These remain available, but they are not the primary definition of DCC.",
      canonicalPaths: getPublicMachineReadablePaths(),
      corridors: getPublicCorridorContracts(),
    },
    canonicalPaths: getPublicMachineReadablePaths(),
    corridors: getPublicCorridorContracts(),
  };

  return Response.json(manifest, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
