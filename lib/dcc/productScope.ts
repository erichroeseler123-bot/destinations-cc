import { DCC_CAPABILITY_TRUTH_MATRIX } from "@/lib/dcc/travelReference";

export const DCC_PRODUCT_SCOPE = {
  schemaVersion: 3,
  version: "2026-10-23",
  platformIdentity: {
    name: "Destination Command Center",
    summary:
      "Travel reference and decision platform supported by live, source-attributed coordinate intelligence, developer APIs, and venue widgets.",
    pillars: [
      "curated-destination-reference-and-decision-guides",
      "coordinate-location-intelligence-api-and-pages",
      "embeddable-venue-widgets",
      "context-preserving-specialist-handoffs-and-open-endpoints",
    ],
  },
  primaryProduct: {
    id: "coordinate-location-intelligence",
    description:
      "Resolve a latitude/longitude pair into current, source-attributed public location context and connected travel reference guidance.",
    canonicalIdentity: "latitude,longitude",
    canonicalHumanPath: "/location/{lat}/{lng}",
    canonicalMachinePath: "/api/location/{lat}/{lng}",
    allowedCoreModules: [
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
    optionalEnrichmentModules: [
      "travelReference",
      "dccEndpoints",
      "winter",
      "nearby",
      "aviation",
      "coastal",
    ],
  },
  travelReferenceArchitecture: {
    status: "first_class_travel_reference",
    version: "2026-10-23",
    description:
      "Place-adapted destination, port, venue, and corridor reference guides connecting stable travel knowledge (overview, geography, history, culture, getting there & around, 6-factor entry dependencies, timing, seasonality, accessibility, and closures) with live coordinate telemetry and source attribution.",
    flagshipReleases: [
      {
        id: "juneau",
        name: "Juneau, Alaska & Gastineau Channel Cruise Port",
        canonicalPath: "/juneau",
        aliases: ["/ports/juneau", "/alaska"],
        primaryCoordinate: "/location/58.30190/-134.41970",
        secondaryCoordinate: "/location/58.29890/-134.40530",
      },
      {
        id: "red-rocks",
        name: "Red Rocks Park & Amphitheatre (Morrison, CO)",
        canonicalPath: "/red-rocks",
        aliases: ["/venues/red-rocks-amphitheatre", "/routes/denver-red-rocks"],
        primaryCoordinate: "/location/39.66540/-105.20570",
        secondaryCoordinate: "/location/39.73920/-104.99030",
      },
      {
        id: "denver-breckenridge",
        name: "Denver–Breckenridge I-70 Mountain Corridor",
        canonicalPath: "/routes/denver-breckenridge",
        aliases: ["/transportation/colorado", "/regions/colorado"],
        primaryCoordinate: "/location/39.48170/-106.03840",
        secondaryCoordinate: "/location/39.67790/-105.90560",
      },
      {
        id: "new-orleans",
        name: "New Orleans, Louisiana & Port of New Orleans Cruise Corridor",
        canonicalPath: "/new-orleans",
        aliases: ["/ports/new-orleans", "/cities/new-orleans"],
        primaryCoordinate: "/location/29.95110/-90.07150",
        secondaryCoordinate: "/location/29.93950/-90.06170",
      },
      {
        id: "las-vegas",
        name: "Las Vegas Resort Corridor, Red Rock Canyon & Hoover Dam Basin",
        canonicalPath: "/vegas",
        aliases: ["/las-vegas-strip", "/red-rock-canyon", "/hoover-dam"],
        primaryCoordinate: "/location/36.11470/-115.17280",
        secondaryCoordinate: "/location/36.13580/-115.42750",
      },
    ],
    epistemicAndSafetyRules: [
      "Weather conditions alone never establish venue operating status, lightning holds, highway traction restrictions, cruise docking feasibility, or activity safety.",
      "Missing, out-of-scope, or expired upstream data must never appear as an all-clear (0 warnings).",
      "Entry requirements depend on 6 traveler factors (nationality, passport/document type, residence, transit routing, trip purpose, and dates) and cannot be answered by coordinates alone.",
      "Official rules, live observations, model forecasts, DCC interpretations, and editorial recommendations must remain explicitly labeled and distinguishable.",
    ],
  },
  secondaryProducts: [
    {
      id: "travel-reference-and-decision-guides",
      description:
        "Curated, source-attributed travel reference and decision guides for destinations, ports, venues, and transit corridors connected bidirectionally to coordinate pages.",
      canonicalPaths: [
        "/juneau",
        "/ports/juneau",
        "/red-rocks",
        "/venues/red-rocks-amphitheatre",
        "/routes/denver-breckenridge",
        "/new-orleans",
        "/ports/new-orleans",
        "/vegas",
      ],
      status: "first_class_promoted_surface",
    },
    {
      id: "portfolio-relationship-graph",
      description:
        "Publish canonical machine-readable relationships between DCC and affiliated specialist portfolio properties.",
      canonicalPath: "/api/public/portfolio-feed",
    },
    {
      id: "octo-tourism-directory-and-booking-layer",
      description:
        "Open connectivity (OCTO) tourism directory, operator registry, and two-phase booking distribution specification (currently in technical onboarding / pilot status; 0 external production operators live_authorized).",
      canonicalPath: "/octo",
      machinePath: "/api/octo/participants",
    },
    {
      id: "legacy-travel-corridors",
      description:
        "Preserve governed travel decision corridors for compatibility while upgraded flagship destination references (/juneau, /red-rocks, /routes/denver-breckenridge) operate as first-class reference experiences.",
      status: "versioned_to_travel_reference_v3",
    },
  ],
  capabilityTruthMatrix: DCC_CAPABILITY_TRUTH_MATRIX,
  outOfScopeAsPrimaryIdentity: [
    "closed proprietary booking gatekeeper",
    "arbitrary reseller markup agency",
    "unverified worldwide encyclopedia claiming complete knowledge for every coordinate",
    "address directory",
    "IT command center",
    "military command center",
  ],
  expansionRules: [
    "New live feeds must attach to an existing location-response module or be explicitly approved as a new core module.",
    "A new destination, portfolio property, or commercial provider does not create a new DCC primary product.",
    "Commercial provider data must remain distinguishable from public-source observations and official government rules.",
    "Curated travel reference guides are intentionally versioned in schemaVersion 3 as a first-class pillar alongside coordinate intelligence.",
    "Coordinates remain the canonical physical location identity even when a place name, address, airport, port, venue, or device location is used for discovery.",
    "OCTO booking operations connect only to explicitly authorized operators; unverified or onboarding operators remain strictly directory-only.",
  ],
} as const;

export type DccProductScope = typeof DCC_PRODUCT_SCOPE;
