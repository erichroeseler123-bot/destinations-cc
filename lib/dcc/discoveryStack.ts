import { getPublicCorridorContracts, getPublicMachineReadablePaths } from "@/lib/dcc/publicCorridorContract";
import { resolveViatorAction, type ViatorActionInput } from "@/lib/dcc/action/viator";
import { normalizeViatorResolverProduct, normalizedProductSupportsIntent } from "@/lib/viator/normalize";
import { inferViatorIntent, rankViatorActionProducts } from "@/lib/viator/resolver";
import { SITE_IDENTITY } from "@/src/data/site-identity";
import { SYSTEM_INVENTORY, type SystemInventorySatellite } from "@/src/data/system-inventory";

export type DiscoverySurfaceRole = "dcc" | "satellite" | "operator";

export type DiscoverySurfacePublication = {
  id: string;
  role: DiscoverySurfaceRole;
  domain: string;
  siteName: string;
  sitemap: {
    path: string;
    body: string;
  };
  llms: {
    path: string;
    body: string;
  };
  agent: {
    path: string;
    payload: Record<string, unknown>;
  };
};

type DiscoverySurfaceRecord = {
  id: string;
  role: DiscoverySurfaceRole;
  siteName: string;
  domain: string;
  governedBy: string | null;
  capabilities: string[];
  routes: string[];
  intents: Record<
    string,
    {
      path: string;
      resolver?: string;
      execution_surface?: string;
      provider_mode?: string;
      fallback_policy?: string;
      top_product_code?: string;
      winner_confidence?: string;
      fit_reason?: string;
      resolution_path?: string;
      winner_title?: string;
      winner_url?: string;
      winner_source?: string;
    }
  >;
};

const VERSION = "1.0.0";
const GOVERNED_BY = "https://destinationcommandcenter.com";

const EXTERNAL_GOVERNED_SURFACES: DiscoverySurfaceRecord[] = [
  {
    id: "welcometoalaskatours",
    role: "satellite",
    siteName: "Welcome to Alaska Tours",
    domain: "https://welcometoalaskatours.com",
    governedBy: GOVERNED_BY,
    capabilities: ["intent-narrowing", "decision-continuation"],
    routes: ["/", "/plan"],
    intents: {
      "whale-watching": {
        path: "/juneau/whale-watching",
        resolver: "fareharbor",
        execution_surface: "https://welcometoalaskatours.com/plan",
        provider_mode: "vendor_api_execution",
        fallback_policy: "marketplace_inventory_only_when_explicit",
      },
      "helicopter-tours": {
        path: "/juneau/helicopter-tours",
        resolver: "fareharbor",
        execution_surface: "https://welcometoalaskatours.com/plan",
        provider_mode: "vendor_api_execution",
        fallback_policy: "marketplace_inventory_only_when_explicit",
      },
    },
  },
  {
    id: "welcometoneworleanstours",
    role: "satellite",
    siteName: "Welcome to New Orleans Tours",
    domain: "https://welcometoneworleanstours.com",
    governedBy: GOVERNED_BY,
    capabilities: ["intent-narrowing", "viator-resolution"],
    routes: ["/"],
    intents: {
      "city-tours": {
        path: "/",
        resolver: "viator",
      },
    },
  },
  {
    id: "partyatredrocks",
    role: "operator",
    siteName: "Party at Red Rocks",
    domain: "https://www.partyatredrocks.com",
    governedBy: GOVERNED_BY,
    capabilities: ["checkout", "booking-confirmation", "reservation-fulfillment"],
    routes: ["/", "/book/red-rocks-amphitheatre/custom/shared", "/book/red-rocks-amphitheatre/private"],
    intents: {},
  },
];

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toAbsoluteUrl(domain: string, path: string): string {
  return `${domain.replace(/\/$/, "")}${path === "/" ? "" : path}`;
}

function toAgentId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function titleFromId(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function intentFromPath(path: string): string | null {
  const normalized = path.replace(/^\/+|\/+$/g, "");
  if (!normalized) return null;
  const parts = normalized.split("/");
  const last = parts[parts.length - 1];
  if (["about", "privacy", "terms", "contact", "book", "track", "plan", "tours"].includes(last)) {
    return null;
  }
  return last;
}

function mapSatelliteRole(role: SystemInventorySatellite["role"]): DiscoverySurfaceRole {
  return role === "operator" ? "operator" : "satellite";
}

function buildSurfaceDescription(record: DiscoverySurfaceRecord): string {
  if (record.role === "dcc") {
    return "Canonical planning and decision authority for the DCC network.";
  }
  if (record.role === "operator") {
    return `${record.siteName} is an execution surface in the governed DCC network.`;
  }
  return `${record.siteName} is a narrowing surface in the governed DCC network.`;
}

function slugFromDomain(domain: string): string {
  return domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split(".")[0]
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase();
}

function titleFromSlug(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferIntentPlace(record: DiscoverySurfaceRecord, intent: string, intentPath: string): ViatorActionInput | null {
  const normalizedPath = intentPath.replace(/^\/+|\/+$/g, "");
  const parts = normalizedPath ? normalizedPath.split("/") : [];
  const firstSegment = parts[0] || "";
  const citySlug =
    firstSegment && firstSegment !== intent
      ? firstSegment
      : record.id === "welcometoalaskatours"
        ? "juneau"
        : record.id === "welcometoneworleanstours"
          ? "new-orleans"
          : slugFromDomain(record.domain);

  const hub = citySlug || slugFromDomain(record.domain);
  const cityName = titleFromSlug(citySlug || slugFromDomain(record.domain) || record.siteName);

  if (!hub) return null;

  return {
    slug: `${hub}-${intent}`,
    name: `${cityName} ${titleFromSlug(intent)}`.trim(),
    hub,
    citySlug: hub,
  };
}

function injectViatorIntentWinners(record: DiscoverySurfaceRecord): DiscoverySurfaceRecord {
  const intents = Object.fromEntries(
    Object.entries(record.intents).map(([intent, config]) => {
      if (config.resolver !== "viator") {
        return [intent, config];
      }

      const place = inferIntentPlace(record, intent, config.path);
      if (!place) {
        return [intent, config];
      }

      const action = resolveViatorAction(place);
      if (!action.enabled || action.products.length === 0) {
        return [intent, config];
      }

      const { recommendation } = rankViatorActionProducts(action.products, {
        destinationId: null,
        canonicalGeoId: place.citySlug || place.slug,
        intent: inferViatorIntent(intent, place.slug, place.name, place.hub, place.citySlug),
        cruiseCompatible: /cruise|port|shore/.test(
          [intent, place.slug, place.name, place.hub, place.citySlug].join(" ").toLowerCase(),
        ),
        resolutionPathHint: action.source === "cache" ? "tier1_exact" : "tier2_filtered",
      });

      const resolvedIntent = inferViatorIntent(intent, place.slug, place.name, place.hub, place.citySlug);
      const relaxedWinner =
        recommendation.winner ||
        action.products
          .map((product) => normalizeViatorResolverProduct(product))
          .find(
            (product) =>
              normalizedProductSupportsIntent(product, resolvedIntent) &&
              (product.rating ?? 0) >= 4.5 &&
              (product.reviewCount ?? 0) >= 25,
          ) ||
        null;

      if (!relaxedWinner) {
        return [intent, config];
      }

      return [
        intent,
        {
          ...config,
          top_product_code: relaxedWinner.productCode,
          winner_confidence: recommendation.winner ? recommendation.confidence : "low",
          fit_reason:
            recommendation.winner ? recommendation.fitReason : "catalog_fallback_match",
          resolution_path:
            recommendation.winner ? recommendation.resolutionPath : "tier2_filtered",
          winner_title: relaxedWinner.title,
          winner_url: relaxedWinner.bookUrl,
          winner_source: action.source,
        },
      ];
    }),
  ) as DiscoverySurfaceRecord["intents"];

  return {
    ...record,
    intents,
  };
}

function buildInventorySatelliteRecord(surface: SystemInventorySatellite): DiscoverySurfaceRecord {
  const domain = `https://${surface.domain.replace(/^https?:\/\//, "")}`;
  const routes = Array.from(
    new Set(["/", ...surface.promotedRoutes, ...surface.indexableRoutes, ...surface.liveUnpromotedRoutes]),
  );
  const intents: DiscoverySurfaceRecord["intents"] = {};

  for (const path of routes) {
    const intent = intentFromPath(path);
    if (!intent) continue;
    intents[intent] = {
      path,
    };
  }

  return {
    id: surface.id,
    role: mapSatelliteRole(surface.role),
    siteName: surface.label,
    domain,
    governedBy: GOVERNED_BY,
    capabilities:
      surface.role === "operator"
        ? ["checkout", "execution-truth"]
        : surface.role === "hybrid"
          ? ["intent-narrowing", "guided-action"]
          : ["intent-narrowing", "decision-continuation"],
    routes,
    intents,
  };
}

function getDccRootRecord(): DiscoverySurfaceRecord {
  const corridorContracts = getPublicCorridorContracts();
  const intents: DiscoverySurfaceRecord["intents"] = {};

  for (const corridor of corridorContracts) {
    intents[corridor.id] = {
      path: corridor.planningPath,
      execution_surface: corridor.executionSurface,
    };
  }

  return {
    id: "destinationcommandcenter",
    role: "dcc",
    siteName: SITE_IDENTITY.name,
    domain: SITE_IDENTITY.siteUrl,
    governedBy: null,
    capabilities: ["travel-routing", "decision-governance", "handoff-contracts"],
    routes: getPublicMachineReadablePaths(),
    intents,
  };
}

function getGovernedSurfaceRecords(): DiscoverySurfaceRecord[] {
  const root = getDccRootRecord();
  const local = SYSTEM_INVENTORY.satellites.map(buildInventorySatelliteRecord);
  const deduped = new Map<string, DiscoverySurfaceRecord>();

  for (const record of [root, ...local, ...EXTERNAL_GOVERNED_SURFACES]) {
    deduped.set(record.id, injectViatorIntentWinners(record));
  }

  return Array.from(deduped.values());
}

function buildSurfaceSitemapXml(record: DiscoverySurfaceRecord): string {
  const urls = Array.from(new Set(record.routes))
    .map((path) => toAbsoluteUrl(record.domain, path))
    .sort();
  const lastmod = new Date().toISOString();

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
      (url) =>
        `  <url><loc>${xmlEscape(url)}</loc><lastmod>${xmlEscape(lastmod)}</lastmod></url>`,
    ),
    "</urlset>",
  ].join("\n");
}

function buildRootSitemapIndexXml(records: DiscoverySurfaceRecord[]): string {
  const dcc = records.find((record) => record.role === "dcc");
  const children = records.filter((record) => record.id !== dcc?.id);
  const urls = [
    dcc ? `${dcc.domain}/sitemap.xml` : null,
    ...children.map((record) => `${record.domain}/sitemap.xml`),
  ].filter((value): value is string => Boolean(value));

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <sitemap><loc>${xmlEscape(url)}</loc></sitemap>`),
    "</sitemapindex>",
  ].join("\n");
}

function buildSurfaceLlmsText(record: DiscoverySurfaceRecord): string {
  const roleLine =
    record.role === "dcc"
      ? "This domain is the governed decision authority for the DCC network."
      : record.role === "operator"
        ? "This domain is an execution surface in the DCC network."
        : "This domain is a narrowing surface in the DCC network.";

  const lines = [
    `# ${record.siteName}`,
    "",
    roleLine,
    "",
    "## Governance",
    `- Role: ${record.role}`,
    `- Governed by: ${record.governedBy || "self"}`,
    "",
    "## Capabilities",
    ...record.capabilities.map((capability) => `- ${capability}`),
    "",
    "## Public routes",
    ...record.routes.map((path) => `- ${toAbsoluteUrl(record.domain, path)}`),
  ];

  if (Object.keys(record.intents).length > 0) {
    lines.push("", "## Intents");
    for (const [intent, config] of Object.entries(record.intents)) {
      lines.push(`- ${intent}: ${toAbsoluteUrl(record.domain, config.path)}`);
    }
  }

  lines.push(
    "",
    "## Machine-readable entry points",
    `- ${record.domain}/agent.json`,
    `- ${record.domain}/llms.txt`,
    `- ${record.domain}/sitemap.xml`,
    "",
  );

  return lines.join("\n");
}

function buildSurfaceAgentJson(record: DiscoverySurfaceRecord, allRecords: DiscoverySurfaceRecord[]) {
  return {
    agent_id: toAgentId(record.id),
    version: VERSION,
    role: record.role,
    governed_by: record.governedBy,
    site: {
      name: record.siteName,
      url: record.domain,
      description: buildSurfaceDescription(record),
    },
    capabilities: record.capabilities,
    machine_readable: {
      llms: `${record.domain}/llms.txt`,
      sitemap: `${record.domain}/sitemap.xml`,
    },
    intents: record.intents,
    handoff_protocol: {
      type: "decision_carriage",
      required_params: [
        "dcc_handoff_id",
        "decision_corridor",
        "decision_action",
        "decision_state",
      ],
    },
    ...(record.role === "dcc"
      ? {
          governed_surfaces: allRecords
            .filter((item) => item.id !== record.id)
            .map((item) => ({
              id: item.id,
              role: item.role,
              url: item.domain,
              sitemap: `${item.domain}/sitemap.xml`,
              llms: `${item.domain}/llms.txt`,
              agent: `${item.domain}/agent.json`,
            })),
          corridors: getPublicCorridorContracts(),
        }
      : {}),
  };
}

export function buildDiscoveryStackSnapshot() {
  const records = getGovernedSurfaceRecords();
  const publications: DiscoverySurfacePublication[] = records.map((record) => ({
    id: record.id,
    role: record.role,
    domain: record.domain,
    siteName: record.siteName,
    sitemap: {
      path: "/sitemap.xml",
      body:
        record.role === "dcc"
          ? buildRootSitemapIndexXml(records)
          : buildSurfaceSitemapXml(record),
    },
    llms: {
      path: "/llms.txt",
      body: buildSurfaceLlmsText(record),
    },
    agent: {
      path: "/agent.json",
      payload: buildSurfaceAgentJson(record, records),
    },
  }));

  return {
    generatedAt: new Date().toISOString(),
    version: VERSION,
    publications,
  };
}

export function buildDccRootAgentManifest() {
  return buildDiscoveryStackSnapshot().publications.find((item) => item.role === "dcc")?.agent.payload ?? {};
}

export function buildDccRootLlmsText() {
  return buildDiscoveryStackSnapshot().publications.find((item) => item.role === "dcc")?.llms.body ?? "";
}

export function buildDccRootSitemapIndex() {
  return buildDiscoveryStackSnapshot().publications.find((item) => item.role === "dcc")?.sitemap.body ?? "";
}

export function listGovernedDiscoverySurfaces() {
  return buildDiscoveryStackSnapshot().publications.map((item) => ({
    id: item.id,
    role: item.role,
    domain: item.domain,
    siteName: item.siteName,
  }));
}

export function getDiscoveryPublicationById(id: string) {
  return buildDiscoveryStackSnapshot().publications.find((item) => item.id === id) ?? null;
}
