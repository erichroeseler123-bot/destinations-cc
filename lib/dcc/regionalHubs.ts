import {
  PUBLICATION_MANIFEST,
  getPublicationManifestEntry,
  type PublicationManifestRecord,
} from "@/src/data/publication-manifest";
import {
  DISCOVERABLE_LOCATIONS,
  canonicalCoordinate,
} from "@/lib/dcc/locationDiscovery";
import {
  getAllTravelReferenceNodes,
  type TravelReferenceNode,
} from "@/lib/dcc/travelReferenceCore";
import { SPORTS_VENUES_CONFIG } from "@/src/data/sports-venues-config";
import { getEffectivePorts } from "@/lib/dcc/ports";
import { PUBLISHED_DECISION_GUIDES } from "@/src/data/published-decision-guides";

export type RegionalHubSlug =
  | "colorado"
  | "alaska"
  | "louisiana"
  | "nevada"
  | "florida"
  | "montana"
  | "wisconsin"
  | "us-virgin-islands";

export interface RegionalCoordinateEntry {
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  elevationFt?: number;
  locationPath: string;
  apiPath: string;
  roleOrCategory: string;
  summary: string;
  manifestRecord: PublicationManifestRecord | null;
}

export interface RegionalVenueEntry {
  slug: string;
  name: string;
  cityName: string;
  href: string;
  description: string;
  manifestRecord: PublicationManifestRecord | null;
}

export interface RegionalPortEntry {
  slug: string;
  name: string;
  area: string;
  href: string;
  lat?: number;
  lng?: number;
  summary: string;
  manifestRecord: PublicationManifestRecord | null;
}

export interface RegionalDecisionGuideEntry {
  slug: string;
  title: string;
  href: string;
  summary: string;
  manifestRecord: PublicationManifestRecord | null;
}

export interface RegionalAiSubManifestEntry {
  label: string;
  href: string;
  scope: string;
}

export interface RegionalHubModel {
  slug: RegionalHubSlug;
  name: string;
  stateCode: string;
  countryCode: string;
  canonicalPath: string;
  regionAliasPath: string;
  llmsTxtPath: string;
  centroid: { lat: number; lng: number };
  heroHeadline: string;
  heroSummary: string;
  manifestRecord: PublicationManifestRecord | null;
  referenceNodes: TravelReferenceNode[];
  coordinates: RegionalCoordinateEntry[];
  venues: RegionalVenueEntry[];
  ports: RegionalPortEntry[];
  decisionGuides: RegionalDecisionGuideEntry[];
  aiSubManifests: RegionalAiSubManifestEntry[];
  manifestRoutesForState: PublicationManifestRecord[];
}

interface RegionalHubConfig {
  slug: RegionalHubSlug;
  name: string;
  stateCode: string;
  countryCode: string;
  centroid: { lat: number; lng: number };
  heroHeadline: string;
  heroSummary: string;
  referenceNodeIds: Array<TravelReferenceNode["id"]>;
  citySlugsForVenues: string[];
  portSlugs: string[];
  guideCategoryOrSlugs: string[];
  routePrefixesOrKeywords: string[];
}

const REGIONAL_HUB_CONFIGS: readonly RegionalHubConfig[] = [
  {
    slug: "colorado",
    name: "Colorado",
    stateCode: "US-CO",
    countryCode: "US",
    centroid: { lat: 39.5501, lng: -105.7821 },
    heroHeadline:
      "Colorado Destination Hub — Red Rocks Park & Amphitheatre, I-70 Mountain Corridor & High-Elevation Coordinates",
    heroSummary:
      "Manifest-driven regional guidebook uniting Colorado's verified travel reference nodes (/red-rocks, /routes/denver-breckenridge), statutory CDOT Code 15/16 traction rules, concert shuttle logistics, and high-altitude coordinate telemetry.",
    referenceNodeIds: ["red-rocks", "denver-breckenridge"],
    citySlugsForVenues: ["denver", "morrison", "boulder", "colorado-springs"],
    portSlugs: [],
    guideCategoryOrSlugs: ["colorado", "red-rocks", "breckenridge", "vail", "denver"],
    routePrefixesOrKeywords: [
      "/red-rocks",
      "/routes/denver-breckenridge",
      "/transportation/colorado",
      "/regions/colorado",
      "/destinations/colorado",
      "/cities/denver",
      "/venues/red-rocks-amphitheatre",
      "colorado",
      "argo-cable-car",
    ],
  },
  {
    slug: "alaska",
    name: "Alaska",
    stateCode: "US-AK",
    countryCode: "US",
    centroid: { lat: 58.3019, lng: -134.4197 },
    heroHeadline:
      "Alaska Destination Hub — Juneau Capital & Cruise Port, Mendenhall Glacier, Inside Passage Ports & Marine Telemetry",
    heroSummary:
      "Manifest-driven regional guidebook uniting Alaska's verified Juneau travel reference node (/juneau), cruise berth & tender buffer math, USFS Mendenhall Glacier capacity rules, and Southeast Alaska port & coordinate telemetry.",
    referenceNodeIds: ["juneau"],
    citySlugsForVenues: ["juneau", "anchorage", "fairbanks"],
    portSlugs: ["juneau", "ketchikan", "skagway", "sitka", "icystraitpoint"],
    guideCategoryOrSlugs: ["juneau", "alaska"],
    routePrefixesOrKeywords: [
      "/juneau",
      "/ports/juneau",
      "/destinations/alaska",
      "/regions/alaska",
      "juneau",
      "alaska",
    ],
  },
  {
    slug: "louisiana",
    name: "Louisiana",
    stateCode: "US-LA",
    countryCode: "US",
    centroid: { lat: 29.9511, lng: -90.0715 },
    heroHeadline:
      "Louisiana Destination Hub — New Orleans Cultural Reference, Port NOLA Cruise Terminals & Barataria Swamp Decision Guides",
    heroSummary:
      "Manifest-driven regional guidebook uniting New Orleans (/new-orleans), Port of New Orleans Erato/Julia cruise terminals, MSY statutory $36 flat-rate taxi rules, French Quarter coach restrictions, and Barataria swamp tour decision guides.",
    referenceNodeIds: ["new-orleans"],
    citySlugsForVenues: ["new-orleans"],
    portSlugs: ["new-orleans"],
    guideCategoryOrSlugs: ["new-orleans"],
    routePrefixesOrKeywords: [
      "/new-orleans",
      "/ports/new-orleans",
      "/destinations/louisiana",
      "/regions/louisiana",
      "/french-quarter-orientation",
      "new-orleans",
    ],
  },
  {
    slug: "nevada",
    name: "Nevada",
    stateCode: "US-NV",
    countryCode: "US",
    centroid: { lat: 36.1147, lng: -115.1728 },
    heroHeadline:
      "Nevada Destination Hub — Las Vegas Resort Corridor, Red Rock Canyon Timed-Entry & Mojave Desert Coordinate Telemetry",
    heroSummary:
      "Manifest-driven regional guidebook uniting Las Vegas (/vegas), Harry Reid Airport (LAS) Nevada Taxicab Authority zone fares, Strip Monorail/Deuce transit, BLM Red Rock Canyon timed-entry rules, and Hoover Dam access.",
    referenceNodeIds: ["las-vegas"],
    citySlugsForVenues: ["las-vegas"],
    portSlugs: [],
    guideCategoryOrSlugs: ["las-vegas", "vegas"],
    routePrefixesOrKeywords: [
      "/vegas",
      "/destinations/nevada",
      "/regions/nevada",
      "las-vegas",
      "vegas",
    ],
  },
  {
    slug: "florida",
    name: "Florida",
    stateCode: "US-FL",
    countryCode: "US",
    centroid: { lat: 27.6648, lng: -81.5158 },
    heroHeadline:
      "Florida Destination Hub — Coastal Ports, Stadium Venues & Subtropical Coordinate Telemetry",
    heroSummary:
      "Manifest-governed Florida regional directory indexing registered coordinate telemetry nodes (Miami, Orlando, Tampa, Key West, Destin, Panama City Beach, Daytona Beach, Fort Myers) and major sports venues.",
    referenceNodeIds: [],
    citySlugsForVenues: ["miami", "tampa", "orlando", "jacksonville"],
    portSlugs: ["miami", "port-canaveral", "tampa", "key-west", "fort-lauderdale"],
    guideCategoryOrSlugs: ["florida", "miami"],
    routePrefixesOrKeywords: ["/destinations/florida", "/regions/florida"],
  },
  {
    slug: "montana",
    name: "Montana",
    stateCode: "US-MT",
    countryCode: "US",
    centroid: { lat: 48.4111, lng: -114.3376 },
    heroHeadline:
      "Montana Destination Hub — Whitefish & Northern Rockies Coordinate Telemetry",
    heroSummary:
      "Manifest-governed Montana regional directory indexing registered Northern Rockies coordinate telemetry (Whitefish, MT) and seasonal mountain operator coverage.",
    referenceNodeIds: [],
    citySlugsForVenues: [],
    portSlugs: [],
    guideCategoryOrSlugs: ["montana", "whitefish"],
    routePrefixesOrKeywords: ["/destinations/montana", "/regions/montana", "whitefish"],
  },
  {
    slug: "wisconsin",
    name: "Wisconsin",
    stateCode: "US-WI",
    countryCode: "US",
    centroid: { lat: 43.6275, lng: -89.771 },
    heroHeadline:
      "Wisconsin Destination Hub — Wisconsin Dells & Upper Midwest Coordinate Telemetry",
    heroSummary:
      "Manifest-governed Wisconsin regional directory indexing registered coordinate telemetry (Wisconsin Dells, WI) and Green Bay / Milwaukee venue nodes.",
    referenceNodeIds: [],
    citySlugsForVenues: ["green-bay", "milwaukee"],
    portSlugs: [],
    guideCategoryOrSlugs: ["wisconsin"],
    routePrefixesOrKeywords: ["/destinations/wisconsin", "/regions/wisconsin", "dells"],
  },
  {
    slug: "us-virgin-islands",
    name: "U.S. Virgin Islands",
    stateCode: "US-VI",
    countryCode: "VI",
    centroid: { lat: 18.3381, lng: -64.8941 },
    heroHeadline:
      "U.S. Virgin Islands Destination Hub — St. Thomas Cruise & Eco-Tour Coordinate Telemetry",
    heroSummary:
      "Manifest-governed U.S. Virgin Islands regional directory indexing St. Thomas coordinate telemetry and seasonal marine excursion coverage.",
    referenceNodeIds: [],
    citySlugsForVenues: [],
    portSlugs: ["st-thomas"],
    guideCategoryOrSlugs: ["us-virgin-islands", "st-thomas"],
    routePrefixesOrKeywords: [
      "/destinations/us-virgin-islands",
      "/regions/us-virgin-islands",
      "virgin-islands",
    ],
  },
] as const;

function nodeLlmsPath(node: TravelReferenceNode): string {
  if (node.id === "denver-breckenridge") {
    return "/routes/denver-breckenridge/llms.txt";
  }
  return `${node.canonicalPath}/llms.txt`;
}

function inferStateCodeForLocationName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("colorado") || lower.includes("red rocks")) return "US-CO";
  if (lower.includes("alaska") || lower.includes("juneau")) return "US-AK";
  if (lower.includes("louisiana") || lower.includes("new orleans")) return "US-LA";
  if (lower.includes("nevada") || lower.includes("las vegas") || lower.includes("hoover dam")) return "US-NV";
  if (lower.includes("montana") || lower.includes("big sky")) return "US-MT";
  if (lower.includes("wisconsin")) return "US-WI";
  if (lower.includes("st. thomas") || lower.includes("st. croix") || lower.includes("st. john")) return "US-VI";
  if (lower.includes("florida") || lower.includes("miami")) return "US-FL";
  return "";
}

function buildRegionalHubModel(config: RegionalHubConfig): RegionalHubModel {
  const allNodes = getAllTravelReferenceNodes();
  const referenceNodes = config.referenceNodeIds
    .map((id) => allNodes.find((n) => n.id === id))
    .filter((n): n is TravelReferenceNode => Boolean(n));

  // 1. Collect & deduplicate all coordinates for this state
  const coordMap = new Map<string, RegionalCoordinateEntry>();

  for (const loc of DISCOVERABLE_LOCATIONS) {
    if (inferStateCodeForLocationName(loc.name) === config.stateCode) {
      const latStr = canonicalCoordinate(loc.lat);
      const lngStr = canonicalCoordinate(loc.lng);
      const locationPath = `/location/${latStr}/${lngStr}`;
      coordMap.set(locationPath, {
        id: `${config.slug}-${latStr}-${lngStr}`,
        title: loc.name,
        subtitle: config.name,
        lat: loc.lat,
        lng: loc.lng,
        locationPath,
        apiPath: `/api/location/${latStr}/${lngStr}`,
        roleOrCategory: loc.type,
        summary: `${loc.name} (${loc.type}) coordinate telemetry node (${latStr}, ${lngStr}).`,
        manifestRecord: getPublicationManifestEntry(locationPath),
      });
    }
  }

  for (const node of referenceNodes) {
    const pLatStr = canonicalCoordinate(node.primaryCoordinate.lat);
    const pLngStr = canonicalCoordinate(node.primaryCoordinate.lng);
    const pPath = `/location/${pLatStr}/${pLngStr}`;
    if (!coordMap.has(pPath)) {
      coordMap.set(pPath, {
        id: `${node.id}-primary`,
        title: node.primaryCoordinate.label,
        subtitle: config.name,
        lat: node.primaryCoordinate.lat,
        lng: node.primaryCoordinate.lng,
        locationPath: pPath,
        apiPath: `/api/location/${pLatStr}/${pLngStr}`,
        roleOrCategory: "Primary Reference Coordinate",
        summary: node.heroSummary,
        manifestRecord: getPublicationManifestEntry(pPath),
      });
    }

    for (const sec of node.secondaryCoordinates) {
      const sLatStr = canonicalCoordinate(sec.lat);
      const sLngStr = canonicalCoordinate(sec.lng);
      const sPath = `/location/${sLatStr}/${sLngStr}`;
      const existing = coordMap.get(sPath);
      if (existing) {
        existing.elevationFt = existing.elevationFt ?? sec.elevationFt;
      } else {
        coordMap.set(sPath, {
          id: `${node.id}-${sLatStr}-${sLngStr}`,
          title: sec.label,
          subtitle: `${config.name} (${sec.elevationFt.toLocaleString()} ft)`,
          lat: sec.lat,
          lng: sec.lng,
          elevationFt: sec.elevationFt,
          locationPath: sPath,
          apiPath: `/api/location/${sLatStr}/${sLngStr}`,
          roleOrCategory: sec.roleInPlace,
          summary: `${sec.label} (${sec.elevationFt.toLocaleString()} ft) — ${sec.roleInPlace}.`,
          manifestRecord: getPublicationManifestEntry(sPath),
        });
      }
    }
  }

  // 2. Collect venues for this state
  const venues: RegionalVenueEntry[] = [];
  if (config.slug === "colorado") {
    venues.push({
      slug: "red-rocks-amphitheatre",
      name: "Red Rocks Park & Amphitheatre",
      cityName: "Morrison, CO",
      href: "/venues/red-rocks-amphitheatre",
      description:
        "Iconic 9,525-capacity open-air monolith amphitheatre at 6,450 ft with dedicated shuttle and parking logistics.",
      manifestRecord: getPublicationManifestEntry("/venues/red-rocks-amphitheatre"),
    });
  }

  for (const v of SPORTS_VENUES_CONFIG) {
    if (
      config.citySlugsForVenues.includes(v.citySlug) &&
      !venues.some((existing) => existing.slug === v.slug)
    ) {
      const href = `/venues/${v.slug}`;
      venues.push({
        slug: v.slug,
        name: v.name,
        cityName: v.cityName,
        href,
        description: v.description,
        manifestRecord: getPublicationManifestEntry(href),
      });
    }
  }

  // 3. Collect ports for this state
  const allPorts = getEffectivePorts();
  const ports: RegionalPortEntry[] = [];
  for (const port of allPorts) {
    if (config.portSlugs.includes(port.slug)) {
      const href = `/ports/${port.slug}`;
      ports.push({
        slug: port.slug,
        name: port.name,
        area: port.area || config.name,
        href,
        lat: port.lat,
        lng: port.lng ?? port.lon,
        summary: `${port.name} (${port.area || config.name}) cruise and marine terminal logistics.`,
        manifestRecord: getPublicationManifestEntry(href),
      });
    }
  }

  // 4. Collect published decision guides for this state
  const decisionGuides: RegionalDecisionGuideEntry[] = [];
  for (const guide of PUBLISHED_DECISION_GUIDES) {
    const matchesState = config.guideCategoryOrSlugs.some(
      (kw) =>
        guide.slug.includes(kw) ||
        guide.category.includes(kw) ||
        guide.eyebrow.toLowerCase().includes(kw),
    );
    if (matchesState) {
      const href = `/guides/${guide.slug}`;
      decisionGuides.push({
        slug: guide.slug,
        title: guide.title,
        href,
        summary: guide.answer || guide.description || guide.title,
        manifestRecord: getPublicationManifestEntry(href),
      });
    }
  }

  // 5. Build AI Sub-Manifest links (/llms.txt)
  const aiSubManifests: RegionalAiSubManifestEntry[] = [
    {
      label: `${config.name} Regional AI Sub-Manifest`,
      href: `/destinations/${config.slug}/llms.txt`,
      scope: `All manifest-registered nodes, transit matrices, and coordinates in ${config.name}`,
    },
  ];
  for (const node of referenceNodes) {
    aiSubManifests.push({
      label: `${node.title.split("—")[0].trim()} AI Readme`,
      href: nodeLlmsPath(node),
      scope: `Rule-based math, transit comparison, 6-factor entry rules, and citations for ${node.canonicalPath}`,
    });
  }

  // 6. Collect all PUBLICATION_MANIFEST records belonging to this state
  const coordPaths = new Set([...coordMap.keys()]);
  const manifestRoutesForState = PUBLICATION_MANIFEST.filter((rec) => {
    if (coordPaths.has(rec.route)) return true;
    return config.routePrefixesOrKeywords.some(
      (kw) => rec.route === kw || rec.route.startsWith(`${kw}/`) || rec.route.includes(kw),
    );
  });

  const canonicalPath = `/destinations/${config.slug}`;
  return {
    slug: config.slug,
    name: config.name,
    stateCode: config.stateCode,
    countryCode: config.countryCode,
    canonicalPath,
    regionAliasPath: `/regions/${config.slug}`,
    llmsTxtPath: `/destinations/${config.slug}/llms.txt`,
    centroid: config.centroid,
    heroHeadline: config.heroHeadline,
    heroSummary: config.heroSummary,
    manifestRecord: getPublicationManifestEntry(canonicalPath),
    referenceNodes,
    coordinates: [...coordMap.values()],
    venues,
    ports,
    decisionGuides,
    aiSubManifests,
    manifestRoutesForState,
  };
}

const REGIONAL_HUBS_CACHE: readonly RegionalHubModel[] = REGIONAL_HUB_CONFIGS.map(
  (cfg) => buildRegionalHubModel(cfg),
);

const REGIONAL_HUB_BY_SLUG = new Map<string, RegionalHubModel>(
  REGIONAL_HUBS_CACHE.map((hub) => [hub.slug, hub]),
);

const STATE_ALIAS_MAP: Record<string, RegionalHubSlug> = {
  co: "colorado",
  "us-co": "colorado",
  ak: "alaska",
  "us-ak": "alaska",
  la: "louisiana",
  "us-la": "louisiana",
  nv: "nevada",
  "us-nv": "nevada",
  fl: "florida",
  "us-fl": "florida",
  mt: "montana",
  "us-mt": "montana",
  wi: "wisconsin",
  "us-wi": "wisconsin",
  vi: "us-virgin-islands",
  "us-vi": "us-virgin-islands",
};

export function listRegionalHubs(): readonly RegionalHubModel[] {
  return REGIONAL_HUBS_CACHE;
}

export function listPromotedRegionalHubs(): readonly RegionalHubModel[] {
  return REGIONAL_HUBS_CACHE.filter((hub) => hub.referenceNodes.length > 0);
}

export function getRegionalHubByStateSlug(rawSlug: string): RegionalHubModel | null {
  const normalized = rawSlug.trim().toLowerCase();
  const mapped = STATE_ALIAS_MAP[normalized] || normalized;
  return REGIONAL_HUB_BY_SLUG.get(mapped) ?? null;
}
