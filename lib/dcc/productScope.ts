export const DCC_PRODUCT_SCOPE = {
  schemaVersion: 2,
  primaryProduct: {
    id: "coordinate-location-intelligence",
    description:
      "Resolve a latitude/longitude pair into current, source-attributed public location context.",
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
  },
  secondaryProducts: [
    {
      id: "portfolio-relationship-graph",
      description:
        "Publish canonical machine-readable relationships between DCC and affiliated portfolio properties.",
      canonicalPath: "/api/public/portfolio-feed",
    },
    {
      id: "octo-tourism-directory-and-booking-layer",
      description:
        "Authorized open connectivity (OCTO) tourism directory, operator registry, and two-phase booking distribution layer under negotiated operator commercial terms with direct operator authority.",
      canonicalPath: "/octo",
      machinePath: "/api/octo/participants",
    },
    {
      id: "legacy-travel-corridors",
      description:
        "Preserve governed travel decision corridors for compatibility without allowing them to redefine DCC's primary product.",
      status: "secondary_compatibility_subsystem",
    },
  ],
  outOfScopeAsPrimaryIdentity: [
    "closed proprietary booking gatekeeper",
    "arbitrary reseller markup agency",
    "city-only travel guide",
    "address directory",
    "IT command center",
    "military command center",
  ],
  expansionRules: [
    "New live feeds must attach to an existing location-response module or be explicitly approved as a new core module.",
    "A new destination, portfolio property, or commercial provider does not create a new DCC primary product.",
    "Commercial provider data must remain distinguishable from public-source observations.",
    "Legacy travel corridors remain secondary unless the scope contract is intentionally versioned.",
    "Coordinates remain the canonical location identity even when a place name, address, airport, port, venue, or device location is used for discovery.",
    "OCTO booking operations connect directly to authorized operators under negotiated commercial terms with zero proprietary lock-in.",
  ],
} as const;

export type DccProductScope = typeof DCC_PRODUCT_SCOPE;
