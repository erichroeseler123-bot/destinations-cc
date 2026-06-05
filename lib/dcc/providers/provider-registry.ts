import {
  createProviderIndex,
  type BaseProviderEntry,
  type ProviderKind,
} from "@/lib/dcc/providers/provider-index";

export const PROVIDERS = [
  {
    key: "viator",
    label: "Viator",
    kind: "tours",
    tier: "primary",
    status: "active",
    volatility: "stable",
    surfacePolicy: "indexable_allowed",
    env: {
      required: ["VIATOR_API_KEY"],
      optional: ["VIATOR_ACCESS_TIER", "VIATOR_SOURCE_POLICY"],
    },
    capabilities: ["search", "detail", "deeplink", "booking_lab"],
    notes: "Durable discovery and outbound conversion backbone.",
  },
  {
    key: "ticketmaster",
    label: "Ticketmaster",
    kind: "events",
    tier: "primary",
    status: "active",
    volatility: "live",
    surfacePolicy: "live_lane_only",
    env: {
      required: ["TICKETMASTER_API_KEY"],
      optional: ["TICKETMASTER_AFFILIATE_DEEPLINK_BASE"],
    },
    capabilities: ["search", "detail", "deeplink"],
    notes: "Main live-events spine for city show lanes.",
  },
  {
    key: "fareharbor",
    label: "FareHarbor",
    kind: "tours",
    tier: "primary",
    status: "active",
    volatility: "live",
    surfacePolicy: "internal_only",
    env: {
      optional: ["FAREHARBOR_APP_KEY", "FAREHARBOR_USER_KEY", "DCC_FH_API"],
    },
    capabilities: ["live_slots", "operator_inventory"],
    notes: "Live slot and operator inventory source; not an indexable content spine.",
  },
  {
    key: "seatgeek",
    label: "SeatGeek",
    kind: "events",
    tier: "secondary",
    status: "optional",
    volatility: "live",
    surfacePolicy: "live_lane_only",
    env: {
      optional: ["SEATGEEK_CLIENT_ID", "SEATGEEK_AFFILIATE_DEEPLINK_BASE"],
    },
    capabilities: ["search", "detail", "pricing_context", "deeplink"],
    notes: "Selective enrichment for secondary-market and pricing context.",
  },
  {
    key: "getyourguide",
    label: "GetYourGuide",
    kind: "tours",
    tier: "secondary",
    status: "optional",
    volatility: "stable",
    surfacePolicy: "indexable_allowed",
    env: {
      optional: ["GETYOURGUIDE_PARTNER_ID", "GETYOURGUIDE_ACCESS_TOKEN"],
    },
    capabilities: ["deeplink", "shortlist"],
    notes: "Supplemental stable tour source when Viator is not the only fit.",
  },
  {
    key: "amadeus",
    label: "Amadeus",
    kind: "flights",
    tier: "experimental",
    status: "optional",
    volatility: "live",
    surfacePolicy: "internal_only",
    env: {
      required: ["AMADEUS_CLIENT_ID", "AMADEUS_CLIENT_SECRET"],
      optional: ["AMADEUS_API_BASE"],
    },
    capabilities: ["search", "price_context"],
  },
  {
    key: "opensky",
    label: "OpenSky",
    kind: "flights",
    tier: "experimental",
    status: "optional",
    volatility: "live",
    surfacePolicy: "internal_only",
    env: {
      optional: ["OPENSKY_USERNAME", "OPENSKY_PASSWORD"],
    },
    capabilities: ["live_status"],
  },
  {
    key: "foursquare",
    label: "Foursquare",
    kind: "other",
    tier: "experimental",
    status: "disabled",
    volatility: "live",
    surfacePolicy: "disabled",
    env: {
      optional: ["FOURSQUARE_API_KEY"],
    },
    capabilities: ["places", "reference_points"],
  },
  {
    key: "bandsintown",
    label: "Bandsintown",
    kind: "events",
    tier: "experimental",
    status: "disabled",
    volatility: "live",
    surfacePolicy: "disabled",
    env: {
      optional: ["BANDSINTOWN_APP_ID"],
    },
    capabilities: ["artist_lookup"],
  },
  {
    key: "travelpayouts",
    label: "Travelpayouts",
    kind: "affiliate_links",
    tier: "experimental",
    status: "disabled",
    volatility: "live",
    surfacePolicy: "disabled",
    env: {
      optional: ["TRAVELPAYOUTS_API_TOKEN", "TRAVELPAYOUTS_MARKER"],
    },
    capabilities: ["affiliate_links"],
  },
  {
    key: "noaa",
    label: "NOAA",
    kind: "weather",
    tier: "secondary",
    status: "active",
    volatility: "live",
    surfacePolicy: "internal_only",
    env: {},
    capabilities: ["forecast"],
  },
  {
    key: "nasa",
    label: "NASA EONET",
    kind: "other",
    tier: "secondary",
    status: "active",
    volatility: "live",
    surfacePolicy: "internal_only",
    env: {},
    capabilities: ["signals", "events"],
  },
] as const satisfies readonly BaseProviderEntry[];

export const PROVIDER_INDEX = createProviderIndex(PROVIDERS);

export function getProvider(key: string) {
  return PROVIDER_INDEX.get(key);
}

export function getProvidersForKind(kind: ProviderKind) {
  return PROVIDER_INDEX.getByKind(kind).filter((provider) => provider.status !== "disabled");
}
