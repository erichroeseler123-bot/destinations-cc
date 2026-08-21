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
    version: "2026-08-21.2",
    site: {
      id: "destinationcommandcenter",
      name: "Destination Command Center",
      url: SITE_URL,
      primary_role: "dense_coordinate_location_intelligence",
      description:
        "Destination Command Center represents physical locations by latitude and longitude and assembles dense current public machine-readable context for those coordinates.",
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
      machine_coordinate_reads:
        "The machine coordinate API does not require reverse geocoding. Human-readable names are descriptive and optional; latitude and longitude remain the identity.",
    },
    location_response: {
      schema: "dcc-location-v2",
      schemaVersion: 2,
      ordered_modules: [
        "identity",
        "now",
        "conditions",
        "hazards",
        "water",
        "official",
        "events",
        "machineFeeds",
        "providerSlots",
        "officialLiveLinks",
      ],
      discovery_fields: [
        "agent",
        "llms",
        "openapi",
        "developers",
        "directory",
        "sitemap",
        "sitemapIndex",
        "locationsSitemap",
        "sectionSitemap",
      ],
      indexing_fields: [
        "eligible",
        "policy",
        "threshold",
        "qualityScore",
        "locationType",
        "sitemapSection",
        "reason",
      ],
      core_public_sources: [
        "Open-Meteo weather",
        "Open-Meteo / CAMS air quality",
        "U.S. National Weather Service forecasts and alerts when geographically applicable",
        "U.S. Geological Survey earthquakes",
        "NASA EONET natural events",
        "NOAA National Water Prediction Service gauges when geographically applicable",
      ],
      compatibility_aliases: ["weather", "alerts", "earthquakes", "events", "machineFeeds", "providerSlots"],
      source_rule:
        "Dynamic facts should be traceable to public or configured machine-readable sources and include source availability and freshness metadata. Missing modules mean unavailable mapped coverage, not proof that the real-world phenomenon is absent.",
    },
    indexing_policy: {
      coordinate_pages_exist_independently_of_indexing: true,
      sitemap_membership_requires_curated_location: true,
      quality_score_threshold: 90,
      rule:
        "An arbitrary coordinate may be read by humans or machines but is not promoted into search discovery. DCC sitemap membership requires a curated discoverable location with qualityScore >= 90.",
      promoted_location_types: ["city", "venue", "resort", "port", "island"],
      section_sitemap_template: `${SITE_URL}/sitemaps/{section}.xml`,
    },
    caching: {
      response_shared_cache_seconds: 60,
      stale_while_revalidate_seconds: 240,
      source_specific_revalidation: true,
      reason:
        "DCC deduplicates common coordinate reads and respects upstream public-service capacity instead of refetching every provider on every agent request.",
    },
    discovery: {
      llms: `${SITE_URL}/llms.txt`,
      agent: `${SITE_URL}/agent.json`,
      agent_well_known: `${SITE_URL}/.well-known/agent.json`,
      openapi: `${SITE_URL}/openapi.json`,
      developers: `${SITE_URL}/developers`,
      directory: `${SITE_URL}/directory`,
      sitemap: `${SITE_URL}/sitemap.xml`,
      sitemap_index: `${SITE_URL}/sitemap-index.xml`,
      locations_sitemap: `${SITE_URL}/locations-sitemap.xml`,
      section_sitemaps: {
        core: `${SITE_URL}/sitemaps/core.xml`,
        cities: `${SITE_URL}/sitemaps/cities.xml`,
        venues: `${SITE_URL}/sitemaps/venues.xml`,
        resorts: `${SITE_URL}/sitemaps/resorts.xml`,
        ports: `${SITE_URL}/sitemaps/ports.xml`,
        islands: `${SITE_URL}/sitemaps/islands.xml`,
      },
    },
    usage_guidance: [
      "If exact coordinates are known, call /api/location/{lat}/{lng} directly.",
      "If a human-readable page is needed, use /location/{lat}/{lng}.",
      "Read the response indexing object before assuming a coordinate is promoted into search discovery.",
      "Use discovery.sectionSitemap when non-null to find the curated sitemap collection containing a promoted location.",
      "Read modules rather than assuming every data class applies everywhere.",
      "Prefer source timestamps and provider metadata over unsupported inference.",
      "Treat current observations as time-sensitive public-source aggregation, not permanent ground truth.",
      "Preserve the exact coordinate pair when citing a DCC location page or API response.",
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
