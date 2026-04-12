import {
  buildParrPrivateRedRocksUrl,
  buildParrSharedRedRocksUrl,
} from "@/lib/dcc/contracts/dccParrBridge";
import { resolveIntentPath } from "@/lib/dcc/routing/resolve";
import {
  EdgeSignalMapSchema,
  type CanonicalLiveSignal,
  type CanonicalIntentRoute,
  type CanonicalOperator,
  type CanonicalProduct,
  type EdgeSignalMap,
} from "@/lib/dcc/routing/schema";
import { WTA_SITE_ORIGIN } from "@/lib/wta/embed";

type SearchParamInput = URLSearchParams | Record<string, string | undefined>;

export type EdgeRedirectResolution = {
  destinationUrl: string;
  handoffId: string;
  routeId: string | null;
  status: "available" | "warning" | "fallback" | "unavailable";
  ctaText: string;
  reasons: string[];
  activeSignals: CanonicalLiveSignal[];
};

type SearchParamValue = string | string[] | undefined;

export const RED_ROCKS_SHARED_GO_PATH = "/go/red-rocks/shared";
export const RED_ROCKS_SHARED_SIGNAL_SUBJECT_IDS = [
  "product_parr_shared_red_rocks",
  "operator_parr",
] as const;
export const RED_ROCKS_FASTPASS_GO_PATH = "/go/red-rocks/fastpass";
export const RED_ROCKS_FASTPASS_SIGNAL_SUBJECT_IDS = [
  "product_parr_shared_red_rocks",
  "operator_parr",
] as const;
export const VEGAS_DEALS_GO_PATH = "/go/vegas/deals";
export const VEGAS_DEALS_SIGNAL_SUBJECT_IDS = [
  "product_sots_vegas_deals",
  "operator_saveonthestrip",
] as const;
export const DENVER_420_AIRPORT_PICKUP_GO_PATH = "/go/denver/420-airport-pickup";
export const JUNEAU_HELICOPTER_GO_PATH = "/go/juneau/helicopter-tours";
export const JUNEAU_HELICOPTER_SIGNAL_SUBJECT_IDS = [
  "product_wta_juneau_helicopter_fast_pass",
  "operator_wta",
] as const;
export const NEW_ORLEANS_SWAMP_GO_PATH = "/go/new-orleans/swamp-tours";
export const NEW_ORLEANS_SWAMP_SIGNAL_SUBJECT_IDS = [
  "operator_wts",
] as const;

const DCC_PUBLIC_BASE_URL = "https://destinationcommandcenter.com";
const WTA_PUBLIC_BASE_URL = WTA_SITE_ORIGIN;
const SOTS_PUBLIC_BASE_URL = "https://www.saveonthestrip.com";
const WTS_PUBLIC_BASE_URL = "https://welcometotheswamp.com";
const RRFP_PUBLIC_BASE_URL = "https://redrocksfastpass.com";
const AIRPORT_420_PUBLIC_BASE_URL = "https://420friendlyairportpickup.com";

const PARR_OPERATOR: CanonicalOperator = {
  id: "operator_parr",
  slug: "party-at-red-rocks",
  name: "Party at Red Rocks",
  kind: "internal_brand",
  domains: ["www.partyatredrocks.com"],
  fulfillmentTypes: ["shared_shuttle", "private_transfer"],
  status: "active",
};

const RED_ROCKS_SHARED_PRODUCT: CanonicalProduct = {
  id: "product_parr_shared_red_rocks",
  slug: "shared-red-rocks-shuttle-seat",
  name: "Shared Red Rocks Shuttle Seat",
  kind: "shared_shuttle",
  operatorId: "operator_parr",
  originPlaceId: "place_sheraton_pickup",
  destinationPlaceId: "place_red_rocks",
  venuePlaceId: "place_red_rocks",
  eventIds: [],
  pricing: {
    currency: "USD",
    fromAmount: 59,
    pricingModel: "per_person",
  },
  bookingMode: "internal",
  bookUrl: "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared",
  tags: ["round_trip", "shared", "concert_transport"],
};

const RED_ROCKS_SHARED_PRIMARY_ROUTE: CanonicalIntentRoute = {
  id: "intent_parr_rr_shared_primary",
  slug: "go-red-rocks-shared-primary",
  intent: "red_rocks_transport_decided_shared",
  sourceSurface: "dcc",
  sourcePageType: "edge_redirect",
  destinationType: "operator_page",
  destinationRef: {
    type: "product",
    idOrUrl: "product_parr_shared_red_rocks",
  },
  handoffPolicy: "act",
  routeRole: "primary",
  requiredContext: ["handoffId"],
};

const RED_ROCKS_FASTPASS_PRODUCT: CanonicalProduct = {
  id: "product_rrfp_day_pass",
  slug: "red-rocks-fast-pass-day-trip",
  name: "Red Rocks Fast Pass Day Trip",
  kind: "shared_shuttle",
  operatorId: "operator_parr",
  originPlaceId: "place_union_station",
  destinationPlaceId: "place_red_rocks",
  venuePlaceId: "place_red_rocks",
  eventIds: [],
  pricing: {
    currency: "USD",
    fromAmount: 25,
    pricingModel: "per_person",
  },
  bookingMode: "external_partner",
  bookUrl: "https://redrocksfastpass.com",
  tags: ["red-rocks", "day-trip", "fast-pass", "mobile-first"],
};

const RED_ROCKS_FASTPASS_PRIMARY_ROUTE: CanonicalIntentRoute = {
  id: "intent_rrfp_day_trip_primary",
  slug: "go-red-rocks-fastpass-primary",
  intent: "red_rocks_fastpass_primary",
  sourceSurface: "dcc",
  sourcePageType: "edge_redirect",
  destinationType: "external_checkout",
  destinationRef: {
    type: "product",
    idOrUrl: "product_rrfp_day_pass",
  },
  handoffPolicy: "act",
  routeRole: "primary",
  requiredContext: ["handoffId"],
};

const RED_ROCKS_FASTPASS_FALLBACK_ROUTE: CanonicalIntentRoute = {
  id: "intent_dcc_red_rocks_status_fallback",
  slug: "go-red-rocks-status-fallback",
  intent: "red_rocks_fastpass_fallback",
  sourceSurface: "dcc",
  sourcePageType: "edge_redirect",
  destinationType: "dcc_page",
  destinationRef: {
    type: "url",
    idOrUrl: "https://destinationcommandcenter.com/red-rocks/status",
  },
  handoffPolicy: "decision_support",
  routeRole: "fallback",
  requiredContext: ["handoffId"],
};

const RED_ROCKS_PRIVATE_FALLBACK_ROUTE: CanonicalIntentRoute = {
  id: "intent_parr_rr_private_fallback",
  slug: "go-red-rocks-private-fallback",
  intent: "red_rocks_transport_private_fallback",
  sourceSurface: "dcc",
  sourcePageType: "edge_redirect",
  destinationType: "operator_page",
  destinationRef: {
    type: "url",
    idOrUrl: "/book/red-rocks-amphitheatre/private",
  },
  handoffPolicy: "act",
  routeRole: "fallback",
  requiredContext: ["handoffId"],
};

const WTA_OPERATOR: CanonicalOperator = {
  id: "operator_wta",
  slug: "welcome-to-alaska",
  name: "Welcome to Alaska Tours",
  kind: "internal_brand",
  domains: ["www.welcometoalaskatours.com", "welcometoalaskatours.com"],
  fulfillmentTypes: ["tour", "handoff"],
  status: "active",
};

const WTS_OPERATOR: CanonicalOperator = {
  id: "operator_wts",
  slug: "welcome-to-the-swamp",
  name: "Welcome to the Swamp",
  kind: "internal_brand",
  domains: ["welcometotheswamp.com", "www.welcometotheswamp.com"],
  fulfillmentTypes: ["tour", "handoff"],
  bookingSystems: ["custom"],
  status: "active",
};

const SOTS_OPERATOR: CanonicalOperator = {
  id: "operator_saveonthestrip",
  slug: "save-on-the-strip",
  name: "Save On The Strip",
  kind: "internal_brand",
  domains: ["www.saveonthestrip.com", "saveonthestrip.com"],
  fulfillmentTypes: ["ticketed_experience", "lodging", "tour"],
  status: "active",
};

const AIRPORT_420_OPERATOR: CanonicalOperator = {
  id: "operator_420_airport_pickup",
  slug: "420-airport-pickup",
  name: "420 Friendly Airport Pickup",
  kind: "internal_brand",
  domains: ["420friendlyairportpickup.com", "www.420friendlyairportpickup.com"],
  fulfillmentTypes: ["private_transfer"],
  bookingSystems: ["square"],
  status: "active",
};

const VEGAS_DEALS_PRODUCT: CanonicalProduct = {
  id: "product_sots_vegas_deals",
  slug: "vegas-deals",
  name: "Las Vegas Deals",
  kind: "ticketed_experience",
  operatorId: "operator_saveonthestrip",
  destinationPlaceId: "place_las_vegas",
  venuePlaceId: "place_las_vegas",
  eventIds: [],
  pricing: {
    currency: "USD",
    pricingModel: "dynamic",
  },
  bookingMode: "handoff",
  bookUrl: "https://www.saveonthestrip.com/deals",
  tags: ["vegas", "deals", "offers", "affiliate"],
};

const DENVER_420_AIRPORT_PICKUP_PRODUCT: CanonicalProduct = {
  id: "product_420_airport_pickup_premium",
  slug: "denver-airport-420-pickup",
  name: "Denver 420 Airport Pickup",
  kind: "private_transfer",
  operatorId: "operator_420_airport_pickup",
  originPlaceId: "place_denver_international_airport",
  destinationPlaceId: "place_denver",
  venuePlaceId: "place_denver",
  eventIds: [],
  pricing: {
    currency: "USD",
    fromAmount: 99,
    pricingModel: "per_group",
  },
  bookingMode: "internal",
  bookUrl: "https://420friendlyairportpickup.com",
  tags: ["denver", "airport", "420", "dispensary-stop", "private-transfer"],
};

const VEGAS_DEALS_PRIMARY_ROUTE: CanonicalIntentRoute = {
  id: "intent_sots_vegas_deals_primary",
  slug: "go-vegas-deals-primary",
  intent: "vegas_deals_primary",
  sourceSurface: "dcc",
  sourcePageType: "edge_redirect",
  destinationType: "satellite_page",
  destinationRef: {
    type: "product",
    idOrUrl: "product_sots_vegas_deals",
  },
  handoffPolicy: "act",
  routeRole: "primary",
  requiredContext: ["handoffId"],
};

const DENVER_420_AIRPORT_PICKUP_PRIMARY_ROUTE: CanonicalIntentRoute = {
  id: "intent_420_airport_pickup_primary",
  slug: "go-denver-420-airport-pickup-primary",
  intent: "denver_420_airport_pickup_primary",
  sourceSurface: "dcc",
  sourcePageType: "edge_redirect",
  destinationType: "operator_page",
  destinationRef: {
    type: "product",
    idOrUrl: "product_420_airport_pickup_premium",
  },
  handoffPolicy: "act",
  routeRole: "primary",
  requiredContext: ["handoffId"],
};

const VEGAS_DEALS_FALLBACK_ROUTE: CanonicalIntentRoute = {
  id: "intent_dcc_vegas_hub_fallback",
  slug: "go-vegas-hub-fallback",
  intent: "vegas_deals_fallback",
  sourceSurface: "dcc",
  sourcePageType: "edge_redirect",
  destinationType: "dcc_page",
  destinationRef: {
    type: "url",
    idOrUrl: "https://destinationcommandcenter.com/vegas/hub",
  },
  handoffPolicy: "decision_support",
  routeRole: "fallback",
  requiredContext: ["handoffId"],
};

const JUNEAU_HELICOPTER_FAST_PASS_PRODUCT: CanonicalProduct = {
  id: "product_wta_juneau_helicopter_fast_pass",
  slug: "juneau-helicopter-fast-pass",
  name: "Juneau Helicopter Fast Pass",
  kind: "tour",
  operatorId: "operator_wta",
  originPlaceId: "place_juneau_port",
  destinationPlaceId: "place_juneau_glacier_corridor",
  venuePlaceId: "place_juneau",
  eventIds: [],
  pricing: {
    currency: "USD",
    pricingModel: "dynamic",
  },
  bookingMode: "handoff",
  bookUrl: `${WTA_SITE_ORIGIN}/handoff/dcc`,
  tags: ["alaska", "helicopter", "juneau", "date_first"],
};

const JUNEAU_HELICOPTER_PRIMARY_ROUTE: CanonicalIntentRoute = {
  id: "intent_wta_juneau_heli_primary",
  slug: "go-juneau-helicopter-primary",
  intent: "juneau_helicopter_decided_primary",
  sourceSurface: "dcc",
  sourcePageType: "edge_redirect",
  destinationType: "operator_page",
  destinationRef: {
    type: "product",
    idOrUrl: "product_wta_juneau_helicopter_fast_pass",
  },
  handoffPolicy: "act",
  routeRole: "primary",
  requiredContext: ["handoffId", "date"],
};

const JUNEAU_HELICOPTER_FALLBACK_ROUTE: CanonicalIntentRoute = {
  id: "intent_dcc_juneau_whale_fallback",
  slug: "go-juneau-whale-fallback",
  intent: "juneau_helicopter_fallback_whale",
  sourceSurface: "dcc",
  sourcePageType: "edge_redirect",
  destinationType: "dcc_page",
  destinationRef: {
    type: "url",
    idOrUrl: "https://destinationcommandcenter.com/juneau/whale-watching-tours",
  },
  handoffPolicy: "decision_support",
  routeRole: "fallback",
  requiredContext: ["handoffId"],
};

const NEW_ORLEANS_SWAMP_PRODUCT: CanonicalProduct = {
  id: "product_wts_swamp_plan",
  slug: "new-orleans-swamp-plan",
  name: "Welcome to the Swamp Plan",
  kind: "tour",
  operatorId: "operator_wts",
  destinationPlaceId: "place_new_orleans_swamp",
  venuePlaceId: "place_new_orleans",
  eventIds: [],
  pricing: {
    currency: "USD",
    pricingModel: "dynamic",
  },
  bookingMode: "handoff",
  bookUrl: "https://welcometotheswamp.com/plan",
  tags: ["new-orleans", "swamp-tours", "warm-transfer"],
};

const NEW_ORLEANS_SWAMP_PRIMARY_ROUTE: CanonicalIntentRoute = {
  id: "intent_wts_swamp_plan_primary",
  slug: "go-new-orleans-swamp-plan-primary",
  intent: "nola_swamp",
  sourceSurface: "dcc",
  sourcePageType: "edge_redirect",
  destinationType: "satellite_page",
  destinationRef: {
    type: "product",
    idOrUrl: "product_wts_swamp_plan",
  },
  handoffPolicy: "act",
  routeRole: "primary",
  requiredContext: ["handoffId"],
};

const NEW_ORLEANS_SWAMP_FALLBACK_ROUTE: CanonicalIntentRoute = {
  id: "intent_dcc_swamp_hub_fallback",
  slug: "go-new-orleans-swamp-hub-fallback",
  intent: "nola_swamp_fallback",
  sourceSurface: "dcc",
  sourcePageType: "edge_redirect",
  destinationType: "dcc_page",
  destinationRef: {
    type: "url",
    idOrUrl: "https://destinationcommandcenter.com/new-orleans/swamp-tours",
  },
  handoffPolicy: "decision_support",
  routeRole: "fallback",
  requiredContext: ["handoffId"],
};

function readSearchParam(params: SearchParamInput, key: string): string | undefined {
  if (params instanceof URLSearchParams) {
    return params.get(key) || undefined;
  }
  return params[key];
}

function extractSearchParams(params: SearchParamInput): Record<string, string | undefined> {
  return {
    qty: readSearchParam(params, "qty"),
    partySize: readSearchParam(params, "partySize"),
    date: readSearchParam(params, "date"),
    port: readSearchParam(params, "port"),
    event: readSearchParam(params, "event"),
    artist: readSearchParam(params, "artist"),
    venue: readSearchParam(params, "venue") || "red-rocks-amphitheatre",
    sourcePage: readSearchParam(params, "sourcePage") || readSearchParam(params, "source_page"),
    intent: readSearchParam(params, "intent"),
    topic: readSearchParam(params, "topic"),
    subtype: readSearchParam(params, "subtype"),
    context: readSearchParam(params, "context"),
    lane: readSearchParam(params, "lane"),
    recommendationSlug:
      readSearchParam(params, "recommendationSlug") || readSearchParam(params, "recommendation_slug"),
    source: readSearchParam(params, "source"),
    dcc_handoff_id: readSearchParam(params, "dcc_handoff_id"),
  };
}

function ensureHandoffId(params: Record<string, string | undefined>) {
  return params.dcc_handoff_id || crypto.randomUUID();
}

export function buildDccRedRocksSharedGoUrl(params?: Record<string, SearchParamValue>) {
  const url = new URL(RED_ROCKS_SHARED_GO_PATH, "https://www.destinationcommandcenter.com");

  for (const [key, value] of Object.entries(params ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.length > 0) {
          url.searchParams.append(key, item);
        }
      }
      continue;
    }

    if (typeof value === "string" && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }

  return `${url.pathname}${url.search}`;
}

export function buildDccJuneauHelicopterGoUrl(params?: Record<string, SearchParamValue>) {
  const url = new URL(JUNEAU_HELICOPTER_GO_PATH, "https://www.destinationcommandcenter.com");

  for (const [key, value] of Object.entries(params ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.length > 0) {
          url.searchParams.append(key, item);
        }
      }
      continue;
    }

    if (typeof value === "string" && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }

  return `${url.pathname}${url.search}`;
}

export function buildDccRedRocksFastPassGoUrl(params?: Record<string, SearchParamValue>) {
  const url = new URL(RED_ROCKS_FASTPASS_GO_PATH, "https://www.destinationcommandcenter.com");

  for (const [key, value] of Object.entries(params ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.length > 0) {
          url.searchParams.append(key, item);
        }
      }
      continue;
    }

    if (typeof value === "string" && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }

  return `${url.pathname}${url.search}`;
}

export function buildDccVegasDealsGoUrl(params?: Record<string, SearchParamValue>) {
  const url = new URL(VEGAS_DEALS_GO_PATH, "https://www.destinationcommandcenter.com");

  for (const [key, value] of Object.entries(params ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.length > 0) {
          url.searchParams.append(key, item);
        }
      }
      continue;
    }

    if (typeof value === "string" && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }

  return `${url.pathname}${url.search}`;
}

export function buildDccDenver420AirportPickupGoUrl(params?: Record<string, SearchParamValue>) {
  const url = new URL(DENVER_420_AIRPORT_PICKUP_GO_PATH, "https://www.destinationcommandcenter.com");

  for (const [key, value] of Object.entries(params ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.length > 0) {
          url.searchParams.append(key, item);
        }
      }
      continue;
    }

    if (typeof value === "string" && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }

  return `${url.pathname}${url.search}`;
}

export function buildDccNewOrleansSwampGoUrl(params?: Record<string, SearchParamValue>) {
  const url = new URL(NEW_ORLEANS_SWAMP_GO_PATH, "https://www.destinationcommandcenter.com");

  for (const [key, value] of Object.entries(params ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.length > 0) {
          url.searchParams.append(key, item);
        }
      }
      continue;
    }

    if (typeof value === "string" && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }

  return `${url.pathname}${url.search}`;
}

function buildEdgeSafeSotsDealsUrl(input: {
  handoffId: string;
  returnPath?: string;
  sourcePage?: string;
}) {
  const url = new URL("/deals", SOTS_PUBLIC_BASE_URL);
  url.searchParams.set("dcc_handoff_id", input.handoffId);
  url.searchParams.set("source", "dcc");
  url.searchParams.set("satellite", "saveonthestrip");
  if (input.sourcePage) {
    url.searchParams.set("source_page", input.sourcePage);
  }
  url.searchParams.set("dcc_return", buildDccReturnUrl(input.returnPath, input.handoffId));
  return url.toString();
}

function buildEdgeSafe420AirportPickupUrl(input: {
  handoffId: string;
  sourcePage?: string;
  intent?: string;
  topic?: string;
  subtype?: string;
  context?: string;
  date?: string;
  returnPath?: string;
}) {
  const url = new URL("/", AIRPORT_420_PUBLIC_BASE_URL);
  url.searchParams.set("dcc_handoff_id", input.handoffId);
  url.searchParams.set("source", "dcc");
  if (input.sourcePage) {
    url.searchParams.set("source_page", input.sourcePage);
  }
  if (input.intent) {
    url.searchParams.set("intent", input.intent);
  }
  if (input.topic) {
    url.searchParams.set("topic", input.topic);
  }
  if (input.subtype) {
    url.searchParams.set("subtype", input.subtype);
  }
  if (input.context) {
    url.searchParams.set("context", input.context);
  }
  if (input.date) {
    url.searchParams.set("date", input.date);
  }
  url.searchParams.set("dcc_return", buildDccReturnUrl(input.returnPath, input.handoffId));
  return url.toString();
}

function encodeBase64Url(input: string) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "utf8").toString("base64url");
  }

  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function buildDccReturnUrl(returnPath?: string, handoffId?: string) {
  const url = new URL(returnPath?.startsWith("/") ? returnPath : "/", DCC_PUBLIC_BASE_URL);
  if (handoffId) {
    url.searchParams.set("dcc_handoff_id", handoffId);
  }
  return url.toString();
}

function buildEdgeSafeWtaHandoffUrl(input: {
  portSlug: string;
  topicSlug: string;
  date?: string;
  handoffId: string;
  sourceSlug?: string;
  sourcePage?: string;
  lane?: string;
  recommendationSlug?: string;
  returnPath?: string;
}) {
  const payload = {
    source: "dcc",
    version: "1",
    handoffId: input.handoffId,
    createdAt: new Date().toISOString(),
    destination: {
      portSlug: input.portSlug,
      date: input.date,
    },
    attribution: {
      sourceSlug: input.sourceSlug || "dcc",
      sourcePage: input.sourcePage,
      topicSlug: input.topicSlug,
    },
    context: {
      sourceSlug: input.sourceSlug || "dcc",
      sourcePage: input.sourcePage,
      authorityTopic: input.topicSlug,
      lane: input.lane,
      recommendationSlug: input.recommendationSlug,
    },
    booking: {
      portSlug: input.portSlug,
      date: input.date,
      lane: input.lane,
      recommendationSlug: input.recommendationSlug,
    },
  };

  const url = new URL("/handoff/dcc", WTA_PUBLIC_BASE_URL);
  url.searchParams.set("payload", encodeBase64Url(JSON.stringify(payload)));
  url.searchParams.set("dcc_handoff_id", input.handoffId);
  url.searchParams.set("source", "dcc");
  if (input.sourceSlug) url.searchParams.set("source_slug", input.sourceSlug);
  if (input.sourcePage) url.searchParams.set("source_page", input.sourcePage);
  url.searchParams.set("topic", input.topicSlug);
  url.searchParams.set("port", input.portSlug);
  if (input.date) url.searchParams.set("date", input.date);
  if (input.lane) url.searchParams.set("lane", input.lane);
  if (input.recommendationSlug) url.searchParams.set("recommendation_slug", input.recommendationSlug);
  url.searchParams.set("dcc_return", buildDccReturnUrl(input.returnPath, input.handoffId));
  return url.toString();
}

function buildEdgeSafeRedRocksFastPassUrl(input: {
  handoffId: string;
  sourcePage?: string;
  returnPath?: string;
}) {
  const configuredCheckout = process.env.DCC_REDROCKSFASTPASS_CHECKOUT_URL?.trim();
  const baseUrl = configuredCheckout || RRFP_PUBLIC_BASE_URL;
  const url = new URL(baseUrl);

  url.searchParams.set("dcc_handoff_id", input.handoffId);
  url.searchParams.set("source", "dcc");
  url.searchParams.set("source_page", input.sourcePage || "/red-rocks");
  url.searchParams.set("dcc_return", buildDccReturnUrl(input.returnPath, input.handoffId));

  if (/square\.site|squareup\.com/i.test(baseUrl)) {
    url.searchParams.set("reference_id", input.handoffId);
    url.searchParams.set("note", `dcc_handoff_id:${input.handoffId}`);
  }

  return url.toString();
}

function buildEdgeSafeWtsPlanUrl(input: {
  handoffId: string;
  sourcePage?: string;
  intent?: string;
  topic?: string;
  subtype?: string;
  context?: string;
  returnPath?: string;
}) {
  const url = new URL("/plan", WTS_PUBLIC_BASE_URL);
  url.searchParams.set("intent", input.intent || "compare");
  url.searchParams.set("topic", input.topic || "swamp-tours");
  url.searchParams.set("source", "dcc");
  url.searchParams.set("sourcePage", input.sourcePage || "/new-orleans/swamp-tours");
  if (input.subtype) url.searchParams.set("subtype", input.subtype);
  if (input.context) url.searchParams.set("context", input.context);
  url.searchParams.set("dcc_handoff_id", input.handoffId);
  url.searchParams.set("dcc_return", buildDccReturnUrl(input.returnPath, input.handoffId));
  return url.toString();
}

export function readEdgeSignalMapFromEnv(envValue = process.env.DCC_EDGE_SIGNAL_MAP): EdgeSignalMap {
  if (!envValue || !envValue.trim()) return {};
  try {
    const parsed = JSON.parse(envValue);
    return EdgeSignalMapSchema.parse(parsed);
  } catch {
    return {};
  }
}

export function resolveGoRedirect(input: {
  pathname: string;
  searchParams: SearchParamInput;
  signalMap?: EdgeSignalMap;
  nowIso?: string;
}): EdgeRedirectResolution | null {
  const params = extractSearchParams(input.searchParams);
  const handoffId = ensureHandoffId(params);
  const redirectParams = {
    ...params,
    dcc_handoff_id: handoffId,
  };
  const signalMap = input.signalMap || readEdgeSignalMapFromEnv();

  if (input.pathname === RED_ROCKS_SHARED_GO_PATH) {
    const resolved = resolveIntentPath({
      product: RED_ROCKS_SHARED_PRODUCT,
      operator: PARR_OPERATOR,
      intentRoutes: [RED_ROCKS_SHARED_PRIMARY_ROUTE, RED_ROCKS_PRIVATE_FALLBACK_ROUTE],
      signalMap,
      nowIso: input.nowIso,
    });

    const destinationUrl =
      resolved.targetRoute?.id === RED_ROCKS_PRIVATE_FALLBACK_ROUTE.id
        ? buildParrPrivateRedRocksUrl(redirectParams)
        : buildParrSharedRedRocksUrl(redirectParams);

    return {
      destinationUrl,
      handoffId,
      routeId: resolved.targetRoute?.id || null,
      status: resolved.status,
      ctaText: resolved.ctaText,
      reasons: resolved.reasons,
      activeSignals: resolved.activeSignals,
    };
  }

  if (input.pathname === RED_ROCKS_FASTPASS_GO_PATH) {
    const resolved = resolveIntentPath({
      product: RED_ROCKS_FASTPASS_PRODUCT,
      operator: PARR_OPERATOR,
      intentRoutes: [RED_ROCKS_FASTPASS_PRIMARY_ROUTE, RED_ROCKS_FASTPASS_FALLBACK_ROUTE],
      signalMap,
      nowIso: input.nowIso,
    });

    const destinationUrl =
      resolved.targetRoute?.id === RED_ROCKS_FASTPASS_FALLBACK_ROUTE.id
        ? `https://destinationcommandcenter.com/red-rocks/status?dcc_handoff_id=${encodeURIComponent(handoffId)}`
        : buildEdgeSafeRedRocksFastPassUrl({
            handoffId,
            sourcePage: params.sourcePage,
            returnPath: "/red-rocks/status",
          });

    return {
      destinationUrl,
      handoffId,
      routeId: resolved.targetRoute?.id || null,
      status: resolved.status,
      ctaText:
        resolved.targetRoute?.id === RED_ROCKS_FASTPASS_FALLBACK_ROUTE.id
          ? "See live Red Rocks status"
          : "Open Red Rocks Fast Pass checkout",
      reasons: resolved.reasons,
      activeSignals: resolved.activeSignals,
    };
  }

  if (input.pathname === JUNEAU_HELICOPTER_GO_PATH) {
    const redirectDate = params.date;
    const resolved = resolveIntentPath({
      product: JUNEAU_HELICOPTER_FAST_PASS_PRODUCT,
      operator: WTA_OPERATOR,
      intentRoutes: [JUNEAU_HELICOPTER_PRIMARY_ROUTE, JUNEAU_HELICOPTER_FALLBACK_ROUTE],
      signalMap,
      nowIso: input.nowIso,
    });

    const destinationUrl =
      resolved.targetRoute?.id === JUNEAU_HELICOPTER_FALLBACK_ROUTE.id
        ? `https://destinationcommandcenter.com/juneau/whale-watching-tours?dcc_handoff_id=${encodeURIComponent(
            handoffId
          )}${redirectDate ? `&date=${encodeURIComponent(redirectDate)}` : ""}`
        : buildEdgeSafeWtaHandoffUrl({
            topicSlug: "helicopter-tours",
            portSlug: params.port || "juneau",
            date: redirectDate,
            handoffId,
            sourceSlug: "dcc-juneau-heli-go",
            sourcePage: params.sourcePage || "/juneau/helicopter-tours",
            lane: params.lane || "premium-helicopter",
            recommendationSlug: params.recommendationSlug || "date-first-primary",
            returnPath: params.sourcePage || "/juneau/helicopter-tours",
          });

    return {
      destinationUrl,
      handoffId,
      routeId: resolved.targetRoute?.id || null,
      status: resolved.status,
      ctaText:
        resolved.targetRoute?.id === JUNEAU_HELICOPTER_FALLBACK_ROUTE.id
          ? "See the cleaner Juneau backup lane"
          : "Check Juneau helicopter availability",
      reasons: resolved.reasons,
      activeSignals: resolved.activeSignals,
    };
  }

  if (input.pathname === NEW_ORLEANS_SWAMP_GO_PATH) {
    const resolved = resolveIntentPath({
      product: NEW_ORLEANS_SWAMP_PRODUCT,
      operator: WTS_OPERATOR,
      intentRoutes: [NEW_ORLEANS_SWAMP_PRIMARY_ROUTE, NEW_ORLEANS_SWAMP_FALLBACK_ROUTE],
      signalMap,
      nowIso: input.nowIso,
    });

    const destinationUrl =
      resolved.targetRoute?.id === NEW_ORLEANS_SWAMP_FALLBACK_ROUTE.id
        ? `https://destinationcommandcenter.com/new-orleans/swamp-tours?dcc_handoff_id=${encodeURIComponent(handoffId)}`
        : buildEdgeSafeWtsPlanUrl({
            handoffId,
            sourcePage: params.sourcePage,
            intent: params.intent,
            topic: params.topic,
            subtype: params.subtype,
            context: params.context,
            returnPath: params.sourcePage || "/new-orleans/swamp-tours",
          });

    return {
      destinationUrl,
      handoffId,
      routeId: resolved.targetRoute?.id || null,
      status: resolved.status,
      ctaText:
        resolved.targetRoute?.id === NEW_ORLEANS_SWAMP_FALLBACK_ROUTE.id
          ? "Stay in the DCC swamp hub"
          : "Open Welcome to the Swamp",
      reasons: resolved.reasons,
      activeSignals: resolved.activeSignals,
    };
  }

  if (input.pathname === DENVER_420_AIRPORT_PICKUP_GO_PATH) {
    const resolved = resolveIntentPath({
      product: DENVER_420_AIRPORT_PICKUP_PRODUCT,
      operator: AIRPORT_420_OPERATOR,
      intentRoutes: [DENVER_420_AIRPORT_PICKUP_PRIMARY_ROUTE],
      signalMap,
      nowIso: input.nowIso,
    });

    const destinationUrl = buildEdgeSafe420AirportPickupUrl({
      handoffId,
      sourcePage: params.sourcePage || "/denver/weed-airport-pickup",
      intent: params.intent || "act",
      topic: params.topic || "denver-airport-pickup",
      subtype: params.subtype,
      context: params.context,
      date: params.date,
      returnPath: params.sourcePage || "/denver/weed-airport-pickup",
    });

    return {
      destinationUrl,
      handoffId,
      routeId: resolved.targetRoute?.id || DENVER_420_AIRPORT_PICKUP_PRIMARY_ROUTE.id,
      status: resolved.status,
      ctaText: "Book airport pickup with dispensary stop",
      reasons: resolved.reasons,
      activeSignals: resolved.activeSignals,
    };
  }

  if (input.pathname === VEGAS_DEALS_GO_PATH) {
    const resolved = resolveIntentPath({
      product: VEGAS_DEALS_PRODUCT,
      operator: SOTS_OPERATOR,
      intentRoutes: [VEGAS_DEALS_PRIMARY_ROUTE, VEGAS_DEALS_FALLBACK_ROUTE],
      signalMap,
      nowIso: input.nowIso,
    });

    const destinationUrl =
      resolved.targetRoute?.id === VEGAS_DEALS_FALLBACK_ROUTE.id
        ? `https://destinationcommandcenter.com/vegas/hub?dcc_handoff_id=${encodeURIComponent(handoffId)}`
        : buildEdgeSafeSotsDealsUrl({
            handoffId,
            returnPath: "/vegas/hub",
            sourcePage: params.sourcePage,
          });

    return {
      destinationUrl,
      handoffId,
      routeId: resolved.targetRoute?.id || null,
      status: resolved.status,
      ctaText:
        resolved.targetRoute?.id === VEGAS_DEALS_FALLBACK_ROUTE.id
          ? "See stable Vegas options"
          : "See live Vegas deals",
      reasons: resolved.reasons,
      activeSignals: resolved.activeSignals,
    };
  }

  return null;
}
