import fs from "node:fs";
import path from "node:path";
import seasonalProfiles from "@/data/seasonal-operator-pages.json";

const ROOT = process.cwd();
const OPERATORS_DIR = path.join(ROOT, "data", "operators");
const PRESERVED_VIATOR_SNAPSHOT_PATH = path.join(
  ROOT,
  "data",
  "viator-operator-snapshots",
  "preserved-operator-products-v2.json",
);
const VIATOR_DESTINATIONS_PATH = path.join(ROOT, "data", "viator-destinations.json");
const PRESERVED_GOSNO_PILOT_PROBE_PATH = path.join(
  ROOT,
  "data",
  "viator-operator-snapshots",
  "preserved-gosno-pilot-probe.json",
);

export const DCC_HOMEPAGE_OPERATOR_MESSAGE =
  "It’s time tour operators kept more of every booking. Connect your existing booking system to DCC through an authorized API. Our commission is 10% on completed direct bookings we generate.";

export const DCC_OPERATOR_PAGE_DIRECT_OFFER_MESSAGE =
  "Your tours are featured here through Viator. If you’d like bookings to go directly to your company, we can connect your booking API. Our proposed commission is 10% on completed direct bookings.";

export type TourOperatorRef = {
  slug: string;
  name?: string;
  city?: string;
  website?: string;
  phone?: string;
};

export type VerifiedViatorDestination = {
  destinationId: number;
  name: string;
  parentDestinationId: number | null;
  parentRegionName: string | null;
  type: string;
  timeZone: string | null;
  defaultCurrencyCode: string;
};

export type VerifiedOperatorViatorProduct = {
  productCode: string;
  title: string;
  status: "ACTIVE";
  supplierName: string;
  supplierReference: string;
  coverImageUrl: string;
  imageSourceType: "SUPPLIER_PROVIDED";
  /**
   * Exact, unmodified productUrl returned by Viator Partner API v2 (`GET /partner/products/{code}`),
   * including Viator's affiliate query parameters (`mcid=42383&pid=P00306962&medium=api&api_version=2.0`).
   * Per Viator Partner API specification, this URL must not be rebuilt or modified.
   */
  productUrl: string;
  canonicalViatorUrl: string;
  trackedViatorUrl: string;
  primaryDestinationId: number;
  verifiedDestination: VerifiedViatorDestination;
  cancellationType: "STANDARD" | "CUSTOM";
  summary: string;
  verifiedAt: string;
};

export type PreservedGosnoProbeRecord = {
  id: string;
  request: {
    method: string;
    url: string;
  };
  response: {
    status: number;
    ok: boolean;
    contentType: string | null;
    body: Record<string, any>;
  };
  capturedAt: string;
};

export type GosnoStorefrontIntegrationEvidence = {
  capturedAt: string;
  wellKnownUrl: string;
  wellKnownStatus: number;
  legalName: string;
  operatingAuthority: string;
  serviceStatus: string;
  routesCatalogUrl: string;
  routesCatalogStatus: number;
  publishedPrivateSuvRouteCount: number;
  sampleRouteMapping: {
    routeId: string;
    origin: string;
    destination: string;
    vehicleClass: string;
    priceFormatted: string;
    rezdyProductCode: string;
  };
  availabilityProbeUrl: string;
  availabilityProbeStatus: number;
  availabilityProbeResult: {
    date: string;
    time: string;
    origin: string;
    destination: string;
    suvAvailable: boolean;
    vanAvailable: boolean;
    vanQuoteOnly: boolean;
  };
};

export type DirectChannelPilotInfo = {
  pilotStatus: "first_direct_channel_pilot";
  pilotLabel: string;
  bookingSystem: "Rezdy Native REST API v1";
  workingCheckoutStatus: string;
  workingCheckoutUrl: string;
  wellKnownEndpointUrl: string;
  pilotScopeSummary: string;
  storefrontIntegration: GosnoStorefrontIntegrationEvidence;
  verificationChecklist: {
    operatorAuthorization: "pending";
    providerApprovedApiAccess: "pending";
    agreedCommercialTerms: "pending";
    productMapping: "pending";
    livePricesAndAvailability: "pending";
    bookingAttributionAndOutcomeReporting: "pending";
    cancellationAndReturnPolicyVerifiedSeparately: "pending";
  };
  verificationNotes: {
    operatorAuthorization: string;
    providerApprovedApiAccess: string;
    agreedCommercialTerms: string;
    productMapping: string;
    livePricesAndAvailability: string;
    bookingAttributionAndOutcomeReporting: string;
    cancellationAndReturnPolicyVerifiedSeparately: string;
  };
};

export type OperatorManifest = {
  slug: string;
  name: string;
  city: string;
  stateOrRegion?: string;
  country?: string;
  founded?: string;
  specialties?: string[];
  website: string;
  phone?: string;
  verifiedBusinessEmail?: string;
  overview: string;
  areasServed?: string[];
  currentBookingChannel: "viator" | "official" | "direct_pilot";
  directPartnershipStatus: "not_enrolled_viator_channel" | "not_enrolled" | "first_direct_channel_pilot";
  supplierReference?: string;
  detectedBookingSystem?: string;
  outreachStatus?: "pilot_candidate_ready_for_review" | "flagged_prior_15_percent_offer" | "direct_pilot";
  doNotAutoSendOutreach?: boolean;
  outreachNotes?: string;
  verifiedViatorProducts: VerifiedOperatorViatorProduct[];
  directPilot?: DirectChannelPilotInfo;
  isSeasonal?: boolean;
  publicListings?: Array<{
    code: string;
    title: string;
    supplierName: string;
    canonicalUrl: string;
    durationText: string | null;
    checkedAt: string;
  }>;
  planningNotes?: Array<{ title: string; text: string }>;
  sources?: Array<{ label: string; url: string; checkedAt: string }>;
  fareharborShortname?: string;
};

// Public listing checks remain separate from preserved Partner API evidence.
// Never infer API ACTIVE status, supplier references, prices or available seats.
export const SEASONAL_DCC_OPERATORS: OperatorManifest[] = seasonalProfiles.map((profile) => ({
  ...profile,
  isSeasonal: true,
  currentBookingChannel: profile.publicListings.length ? "viator" : "official",
  directPartnershipStatus: "not_enrolled",
  detectedBookingSystem: "FareHarbor",
  outreachStatus: "pilot_candidate_ready_for_review",
  doNotAutoSendOutreach: true,
  verifiedViatorProducts: [],
}));

export type PreservedViatorProductItem = {
  code: string;
  statusCode: number;
  ok: boolean;
  data: {
    productCode: string;
    status: "ACTIVE" | "INACTIVE";
    title: string;
    productUrl: string;
    supplier: {
      name: string;
      reference: string;
    };
    destinations: Array<{
      ref: string;
      primary?: boolean;
    }>;
    cancellationPolicy?: {
      type: "STANDARD" | "CUSTOM";
      description?: string;
    };
    coverImage: {
      imageSource: "SUPPLIER_PROVIDED" | string;
      caption?: string;
      isCover?: boolean;
      variants: Array<{
        height: number;
        width: number;
        url: string;
      }>;
    };
  };
};

export type PreservedViatorSnapshotBundle = {
  fetchedAt: string;
  sourceEndpoint: string;
  products: PreservedViatorProductItem[];
};

let cachedSnapshotBundle: PreservedViatorSnapshotBundle | null = null;
let cachedDestinationsMap: Map<number, {
  destinationId: number;
  parentDestinationId: number | null;
  name: string;
  type: string;
  timeZone: string | null;
  defaultCurrencyCode: string;
}> | null = null;

export function loadPreservedViatorOperatorSnapshots(): PreservedViatorSnapshotBundle {
  if (cachedSnapshotBundle) return cachedSnapshotBundle;
  const raw = fs.readFileSync(PRESERVED_VIATOR_SNAPSHOT_PATH, "utf8");
  cachedSnapshotBundle = JSON.parse(raw) as PreservedViatorSnapshotBundle;
  return cachedSnapshotBundle;
}

export function loadViatorDestinationsMap() {
  if (cachedDestinationsMap) return cachedDestinationsMap;
  const raw = fs.readFileSync(VIATOR_DESTINATIONS_PATH, "utf8");
  const parsed = JSON.parse(raw);
  const rows: Array<any> = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.destinations)
      ? parsed.destinations
      : [];
  const map = new Map<number, {
    destinationId: number;
    parentDestinationId: number | null;
    name: string;
    type: string;
    timeZone: string | null;
    defaultCurrencyCode: string;
  }>();
  for (const row of rows) {
    const id = Number(row.destinationId);
    if (Number.isFinite(id)) {
      map.set(id, {
        destinationId: id,
        parentDestinationId:
          typeof row.parentDestinationId === "number" ? row.parentDestinationId : null,
        name: String(row.name || ""),
        type: String(row.type || "CITY"),
        timeZone: row.timeZone ? String(row.timeZone) : null,
        defaultCurrencyCode: String(row.defaultCurrencyCode || "USD"),
      });
    }
  }
  cachedDestinationsMap = map;
  return map;
}

export function resolveVerifiedViatorDestination(destRef: string | number): VerifiedViatorDestination {
  const id = Number(destRef);
  const map = loadViatorDestinationsMap();
  const row = map.get(id);
  if (!row) {
    throw new Error(`Unverified Viator destination reference: ${destRef}`);
  }
  const parent = row.parentDestinationId ? map.get(row.parentDestinationId) : null;
  return {
    destinationId: row.destinationId,
    name: row.name,
    parentDestinationId: row.parentDestinationId,
    parentRegionName: parent ? parent.name : null,
    type: row.type,
    timeZone: row.timeZone,
    defaultCurrencyCode: row.defaultCurrencyCode,
  };
}

function hydrateVerifiedProductFromPreservedSnapshot(
  productCode: string,
  expectedSupplierReference: string,
  summary: string,
): VerifiedOperatorViatorProduct {
  const bundle = loadPreservedViatorOperatorSnapshots();
  const entry = bundle.products.find((p) => p.code === productCode);
  if (!entry || !entry.ok || entry.statusCode !== 200 || !entry.data) {
    throw new Error(`Missing preserved Viator API response for product ${productCode}`);
  }
  const data = entry.data;
  if (data.status !== "ACTIVE") {
    throw new Error(`Viator product ${productCode} is not ACTIVE (status: ${data.status})`);
  }
  if (data.supplier.reference !== expectedSupplierReference) {
    throw new Error(
      `Supplier reference mismatch for ${productCode}: expected ${expectedSupplierReference}, got ${data.supplier.reference}`,
    );
  }
  if (data.coverImage.imageSource !== "SUPPLIER_PROVIDED") {
    throw new Error(
      `Cover image for ${productCode} is not SUPPLIER_PROVIDED (got ${data.coverImage.imageSource})`,
    );
  }
  const variant674 =
    data.coverImage.variants.find((v) => v.width === 674 && v.height === 446) ||
    data.coverImage.variants[0];
  if (!variant674?.url) {
    throw new Error(`Missing cover image variant URL for ${productCode}`);
  }

  const primaryDest =
    data.destinations.find((d) => d.primary) || data.destinations[0];
  if (!primaryDest?.ref) {
    throw new Error(`Missing primary destination reference for ${productCode}`);
  }
  const verifiedDestination = resolveVerifiedViatorDestination(primaryDest.ref);

  // Verify the preserved API productUrl is complete, uses https://www.viator.com,
  // contains the verified destination ID path segment (/d{destinationId}-{productCode}),
  // and preserves Viator's API attribution parameters unmodified.
  const parsedUrl = new URL(data.productUrl);
  if (parsedUrl.hostname !== "www.viator.com") {
    throw new Error(`Unexpected productUrl hostname for ${productCode}: ${parsedUrl.hostname}`);
  }
  const expectedPathToken = `/d${verifiedDestination.destinationId}-${productCode}`;
  if (!parsedUrl.pathname.endsWith(expectedPathToken)) {
    throw new Error(
      `productUrl path ${parsedUrl.pathname} does not end with verified destination token ${expectedPathToken}`,
    );
  }

  return {
    productCode: data.productCode,
    title: data.title,
    status: data.status,
    supplierName: data.supplier.name,
    supplierReference: data.supplier.reference,
    coverImageUrl: variant674.url,
    imageSourceType: "SUPPLIER_PROVIDED",
    productUrl: data.productUrl,
    canonicalViatorUrl: data.productUrl,
    trackedViatorUrl: data.productUrl,
    primaryDestinationId: verifiedDestination.destinationId,
    verifiedDestination,
    cancellationType: data.cancellationPolicy?.type === "CUSTOM" ? "CUSTOM" : "STANDARD",
    summary,
    verifiedAt: bundle.fetchedAt.slice(0, 10),
  };
}

export function loadPreservedGosnoPilotProbes(): {
  capturedAt: string;
  probes: PreservedGosnoProbeRecord[];
} {
  const raw = fs.readFileSync(PRESERVED_GOSNO_PILOT_PROBE_PATH, "utf8");
  return JSON.parse(raw) as { capturedAt: string; probes: PreservedGosnoProbeRecord[] };
}

export function evaluateGosnoPilotEvidence(): GosnoStorefrontIntegrationEvidence {
  const bundle = loadPreservedGosnoPilotProbes();
  const wellKnown = bundle.probes.find((p) => p.id === "well_known_dcc");
  const routesCatalog = bundle.probes.find((p) => p.id === "dcc_routes_catalog");
  const availProbe = bundle.probes.find((p) => p.id === "gosno_availability_probe");

  if (!wellKnown || !routesCatalog || !availProbe) {
    throw new Error("Incomplete GoSno pilot probe evidence bundle.");
  }

  const wkBody = wellKnown.response.body;
  const legalNameClaim = (wkBody.claims || []).find((c: any) => c.predicate === "legal_name");
  const authorityClaim = (wkBody.claims || []).find((c: any) => c.predicate === "operating_authority");
  const serviceState = (wkBody.state || []).find((s: any) => s.predicate === "service_status");

  const rcBody = routesCatalog.response.body;
  const routeClaims = (rcBody.claims || []).filter((c: any) => c.predicate === "route_offering");
  const breckRoute =
    routeClaims.find((c: any) => c.value?.route_id === "DEN-BRECKENRIDGE")?.value ||
    routeClaims[0]?.value;

  const avBody = availProbe.response.body;

  return {
    capturedAt: bundle.capturedAt,
    wellKnownUrl: wellKnown.request.url,
    wellKnownStatus: wellKnown.response.status,
    legalName: String(legalNameClaim?.value || "GoSno LLC"),
    operatingAuthority: String(authorityClaim?.value || "CO PUC LL-03577"),
    serviceStatus: String(serviceState?.value || "unknown"),
    routesCatalogUrl: routesCatalog.request.url,
    routesCatalogStatus: routesCatalog.response.status,
    publishedPrivateSuvRouteCount: routeClaims.length,
    sampleRouteMapping: {
      routeId: String(breckRoute?.route_id || "DEN-BRECKENRIDGE"),
      origin: String(breckRoute?.origin || "DEN"),
      destination: String(breckRoute?.destination || "Breckenridge"),
      vehicleClass: String(breckRoute?.vehicle_class || "suv"),
      priceFormatted: String(breckRoute?.price_formatted || "$399.00"),
      rezdyProductCode: String(breckRoute?.rezdy_product_code || "P7477S"),
    },
    availabilityProbeUrl: availProbe.request.url,
    availabilityProbeStatus: availProbe.response.status,
    availabilityProbeResult: {
      date: String(avBody.date || "2026-12-15"),
      time: String(avBody.time || "10:00"),
      origin: String(avBody.origin || "DEN"),
      destination: String(avBody.destination || "Breckenridge"),
      suvAvailable: Boolean(avBody.availability?.suv?.available),
      vanAvailable: Boolean(avBody.availability?.van?.available),
      vanQuoteOnly: Boolean(avBody.availability?.van?.quoteOnly),
    },
  };
}

export const VERIFIED_DCC_OPERATORS: OperatorManifest[] = [
  {
    slug: "coastal-helicopters",
    name: "Coastal Helicopters",
    city: "Juneau, Alaska",
    stateOrRegion: "Alaska",
    country: "United States",
    website: "https://coastalhelicopters.com/",
    phone: "+1 (907) 789-5600",
    verifiedBusinessEmail: "info@coastalhelicopters.com",
    overview:
      "Juneau helicopter flightseeing and guided Herbert Glacier / icefield landing operator operating from Juneau International Airport.",
    specialties: ["Glacier helicopter landings", "Guided icefield walks", "Juneau shore excursions"],
    areasServed: ["Juneau", "Juneau Icefield", "Herbert Glacier"],
    currentBookingChannel: "viator",
    directPartnershipStatus: "not_enrolled_viator_channel",
    supplierReference: "SUPPLIER-XZgZhAmmclREedANtzgvJw==",
    detectedBookingSystem: "Direct Operator Reservation System",
    outreachStatus: "flagged_prior_15_percent_offer",
    doNotAutoSendOutreach: true,
    outreachNotes:
      "Flagged for review: Coastal Helicopters previously received a separate email proposing 15%. Do not send duplicate automated outreach.",
    verifiedViatorProducts: [
      hydrateVerifiedProductFromPreservedSnapshot(
        "6251SHOREXICEWALK",
        "SUPPLIER-XZgZhAmmclREedANtzgvJw==",
        "Helicopter flight over the Juneau Icefield with a guided glacier walk and round-trip port transportation. Confirm current departure times, passenger weight rules, and live price on Viator.",
      ),
    ],
  },
  {
    slug: "cajun-encounters",
    name: "Cajun Encounters Tour Co.",
    city: "New Orleans, Louisiana",
    stateOrRegion: "Louisiana",
    country: "United States",
    website: "https://www.cajunencounters.com/",
    phone: "+1 (504) 834-1770",
    verifiedBusinessEmail: "info@cajunencounters.com",
    overview:
      "Operates guided flat-bottom boat tours through the Honey Island Swamp in Slidell, Louisiana, with self-drive and New Orleans shuttle options.",
    specialties: ["Honey Island Swamp boat tours", "Round-trip New Orleans hotel shuttle options"],
    areasServed: ["New Orleans", "Slidell", "Honey Island Swamp"],
    currentBookingChannel: "viator",
    directPartnershipStatus: "not_enrolled_viator_channel",
    supplierReference: "SUPPLIER-Ls68Tv9wCH9YKPX1YdQD0g==",
    detectedBookingSystem: "Custom / Enterprise Booking System",
    outreachStatus: "pilot_candidate_ready_for_review",
    doNotAutoSendOutreach: true,
    verifiedViatorProducts: [
      hydrateVerifiedProductFromPreservedSnapshot(
        "6953SWAMP",
        "SUPPLIER-Ls68Tv9wCH9YKPX1YdQD0g==",
        "Guided boat excursion in the Honey Island Swamp for travelers driving themselves to the Slidell dock. Confirm current schedule, availability, and live price on Viator.",
      ),
      hydrateVerifiedProductFromPreservedSnapshot(
        "6953SWAMPTRANS",
        "SUPPLIER-Ls68Tv9wCH9YKPX1YdQD0g==",
        "Honey Island Swamp boat tour including round-trip pickup from designated New Orleans locations. Confirm pickup points, departure windows, and live price on Viator.",
      ),
    ],
  },
  {
    slug: "cajun-pride-swamp-tours",
    name: "Cajun Pride Swamp Tours",
    city: "LaPlace & New Orleans, Louisiana",
    stateOrRegion: "Louisiana",
    country: "United States",
    website: "https://www.cajunprideswamptours.com/",
    phone: "+1 (504) 467-0758",
    verifiedBusinessEmail: "res@cajunprideswamp.com",
    overview:
      "Operates covered swamp boat tours on a private wildlife refuge along the Manchac Bayou in LaPlace, with self-drive and New Orleans shuttle departures.",
    specialties: ["Manchac Bayou covered boat tours", "Swamp & plantation combinations"],
    areasServed: ["LaPlace", "Manchac Swamp", "New Orleans"],
    currentBookingChannel: "viator",
    directPartnershipStatus: "not_enrolled_viator_channel",
    supplierReference: "SUPPLIER-ah695t/3pUZ5JxgMe0brVQ==",
    detectedBookingSystem: "FareHarbor",
    outreachStatus: "pilot_candidate_ready_for_review",
    doNotAutoSendOutreach: true,
    verifiedViatorProducts: [
      hydrateVerifiedProductFromPreservedSnapshot(
        "141126P1",
        "SUPPLIER-ah695t/3pUZ5JxgMe0brVQ==",
        "Covered pontoon swamp boat tour departing from Frenier Road in LaPlace for self-drive visitors. Confirm departure times, availability, and live price on Viator.",
      ),
      hydrateVerifiedProductFromPreservedSnapshot(
        "141126P2",
        "SUPPLIER-ah695t/3pUZ5JxgMe0brVQ==",
        "Covered pontoon swamp boat tour on Manchac Bayou with round-trip shuttle service from New Orleans hotels. Confirm pickup locations, schedule, and live price on Viator.",
      ),
    ],
  },
  {
    slug: "haunted-history-tours",
    name: "Haunted History Tours",
    city: "New Orleans, Louisiana",
    stateOrRegion: "Louisiana",
    country: "United States",
    website: "https://hauntedhistorytours.com/",
    phone: "+1 (504) 861-2727",
    verifiedBusinessEmail: "info@hauntedhistorytours.com",
    overview:
      "Operates guided evening walking and bus tours in the French Quarter and historic New Orleans neighborhoods focusing on documented history, legends, and architecture.",
    specialties: ["French Quarter ghost & history walking tours", "Vampire history walking tours", "Evening bus tours"],
    areasServed: ["French Quarter", "New Orleans"],
    currentBookingChannel: "viator",
    directPartnershipStatus: "not_enrolled_viator_channel",
    supplierReference: "SUPPLIER-xe2YbZ42ogLOrNtIzC5ybg==",
    detectedBookingSystem: "FareHarbor",
    outreachStatus: "pilot_candidate_ready_for_review",
    doNotAutoSendOutreach: true,
    verifiedViatorProducts: [
      hydrateVerifiedProductFromPreservedSnapshot(
        "3252_1",
        "SUPPLIER-xe2YbZ42ogLOrNtIzC5ybg==",
        "2-hour guided walking tour through the French Quarter exploring historic sites and documented local lore. Confirm departure times and live price on Viator.",
      ),
      hydrateVerifiedProductFromPreservedSnapshot(
        "3252_5",
        "SUPPLIER-xe2YbZ42ogLOrNtIzC5ybg==",
        "Evening French Quarter walking tour covering New Orleans folklore and historic landmarks. Confirm departure times and live price on Viator.",
      ),
      hydrateVerifiedProductFromPreservedSnapshot(
        "3252P9",
        "SUPPLIER-xe2YbZ42ogLOrNtIzC5ybg==",
        "Guided evening bus excursion visiting historic New Orleans neighborhoods and cemetery perimeters. Confirm departure schedule and live price on Viator.",
      ),
    ],
  },
  {
    slug: "doctor-gumbo-tours",
    name: "Doctor Gumbo Tours",
    city: "New Orleans, Louisiana",
    stateOrRegion: "Louisiana",
    country: "United States",
    website: "https://www.doctorgumbo.com/",
    phone: "+1 (504) 451-5469",
    verifiedBusinessEmail: "info@doctorgumbo.com",
    overview:
      "Operates small-group culinary and craft cocktail history walking tours across the French Quarter and Treme in New Orleans.",
    specialties: ["New Orleans culinary tasting walks", "Cocktail history tours"],
    areasServed: ["French Quarter", "New Orleans"],
    currentBookingChannel: "viator",
    directPartnershipStatus: "not_enrolled_viator_channel",
    supplierReference: "SUPPLIER-uhTuEGs0R00a22vvRVDMHg==",
    detectedBookingSystem: "FareHarbor",
    outreachStatus: "pilot_candidate_ready_for_review",
    doNotAutoSendOutreach: true,
    verifiedViatorProducts: [
      hydrateVerifiedProductFromPreservedSnapshot(
        "6484NOLAFOOD",
        "SUPPLIER-uhTuEGs0R00a22vvRVDMHg==",
        "Guided French Quarter food history walking tour with tastings at local restaurants and specialty shops. Confirm current schedule, dietary rules, and live price on Viator.",
      ),
      hydrateVerifiedProductFromPreservedSnapshot(
        "6484P3",
        "SUPPLIER-uhTuEGs0R00a22vvRVDMHg==",
        "Combined New Orleans culinary tasting and historic cocktail walking tour in the French Quarter. Confirm age requirements, departure times, and live price on Viator.",
      ),
      hydrateVerifiedProductFromPreservedSnapshot(
        "6484FRQCK",
        "SUPPLIER-uhTuEGs0R00a22vvRVDMHg==",
        "Guided walking tour of classic New Orleans bars and cocktail history in the French Quarter. Confirm 21+ ID requirements, schedule, and live price on Viator.",
      ),
    ],
  },
  {
    slug: "airboat-adventures",
    name: "Airboat Adventures",
    city: "Lafitte & New Orleans, Louisiana",
    stateOrRegion: "Louisiana",
    country: "United States",
    website: "https://airboatadventures.com/",
    phone: "+1 (504) 689-2005",
    verifiedBusinessEmail: "info@airboatadventures.com",
    overview:
      "Operates small and large airboat swamp tours departing from Jean Lafitte, Louisiana, with optional New Orleans hotel pickup.",
    specialties: ["Jean Lafitte airboat swamp tours", "Small-group airboat excursions"],
    areasServed: ["Jean Lafitte", "Barataria Basin", "New Orleans"],
    currentBookingChannel: "viator",
    directPartnershipStatus: "not_enrolled_viator_channel",
    supplierReference: "SUPPLIER-7eNlteakiwgCVdiaT3VQkg==",
    detectedBookingSystem: "FareHarbor",
    outreachStatus: "pilot_candidate_ready_for_review",
    doNotAutoSendOutreach: true,
    verifiedViatorProducts: [
      hydrateVerifiedProductFromPreservedSnapshot(
        "6455NOLAAIR",
        "SUPPLIER-7eNlteakiwgCVdiaT3VQkg==",
        "Airboat ride through the Jean Lafitte marshes and bayous with self-drive or New Orleans pickup options. Confirm vessel size options, schedule, and live price on Viator.",
      ),
    ],
  },
  {
    slug: "new-orleans-kayak-swamp-tours",
    name: "New Orleans Kayak Swamp Tours",
    city: "New Orleans & Manchac, Louisiana",
    stateOrRegion: "Louisiana",
    country: "United States",
    website: "https://neworleanskayakswamptours.com/",
    phone: "+1 (504) 229-2083",
    verifiedBusinessEmail: "info@neworleanskayakswamptours.com",
    overview:
      "Operates guided eco-kayak swamp tours in the Manchac wetlands and combination trips with historic river road plantations.",
    specialties: ["Guided Manchac swamp kayak tours", "Swamp kayak & plantation combo tours"],
    areasServed: ["Manchac Swamp", "New Orleans"],
    currentBookingChannel: "viator",
    directPartnershipStatus: "not_enrolled_viator_channel",
    supplierReference: "SUPPLIER-CN3etwHlngDFw8ce4fY4dQ==",
    detectedBookingSystem: "Peek Pro",
    outreachStatus: "pilot_candidate_ready_for_review",
    doNotAutoSendOutreach: true,
    verifiedViatorProducts: [
      hydrateVerifiedProductFromPreservedSnapshot(
        "22050P2",
        "SUPPLIER-CN3etwHlngDFw8ce4fY4dQ==",
        "Guided small-group paddle tour through cypress wetlands in Manchac. Confirm transportation options, physical requirements, and live price on Viator.",
      ),
      hydrateVerifiedProductFromPreservedSnapshot(
        "22050P3",
        "SUPPLIER-CN3etwHlngDFw8ce4fY4dQ==",
        "Full-day combination tour pairing a guided Manchac swamp kayak excursion with admission to Whitney Plantation. Confirm departure schedule and live price on Viator.",
      ),
    ],
  },
];

export const GOSNO_DIRECT_PILOT_MANIFEST: OperatorManifest = {
  slug: "gosno",
  name: "GoSno",
  city: "Denver to Breckenridge & I-70 Mountain Corridor, Colorado",
  stateOrRegion: "Colorado",
  country: "United States",
  website: "https://gosno.co/",
  overview:
    "Private airport-to-mountain ground transportation operator connecting Denver International Airport (DEN) and Colorado ski resorts in private SUVs (up to 6 passengers) and private passenger vans (up to 10 passengers). GoSno sells 100% private transfers—never shared shuttles.",
  specialties: [
    "100% private DEN to Breckenridge, Vail, Beaver Creek, Keystone & Aspen transfers",
    "Private SUV transfers (up to 6 passengers) & private passenger vans (up to 10 passengers)",
    "Existing gosno.co Rezdy storefront & /.well-known/dcc endpoint (evaluated separately from DCC 10% direct pilot)",
  ],
  areasServed: ["Denver International Airport (DEN)", "Breckenridge", "Vail", "Beaver Creek", "Keystone", "Copper Mountain", "Aspen", "Snowmass", "Steamboat Springs", "Big Sky"],
  currentBookingChannel: "direct_pilot",
  directPartnershipStatus: "first_direct_channel_pilot",
  detectedBookingSystem: "Rezdy Native REST API v1",
  outreachStatus: "direct_pilot",
  doNotAutoSendOutreach: true,
  verifiedViatorProducts: [],
  directPilot: {
    pilotStatus: "first_direct_channel_pilot",
    pilotLabel: "First Direct-Channel Pilot Candidate (Rezdy API) — Distinct from GoSno's Existing Storefront",
    bookingSystem: "Rezdy Native REST API v1",
    workingCheckoutStatus:
      "Operational on gosno.co: GoSno's own storefront checkout (gosno.co/denver-to-breckenridge), /.well-known/dcc manifest, and /api/dcc/routes catalog are active in production for private transfers.",
    workingCheckoutUrl: "https://gosno.co/denver-to-breckenridge",
    wellKnownEndpointUrl: "https://gosno.co/.well-known/dcc",
    pilotScopeSummary:
      "GoSno operates its own Rezdy-backed private transfer checkout on gosno.co and publishes a live /.well-known/dcc manifest. Separately, GoSno is the first candidate for DCC's 10% direct-channel API pilot. While gosno.co's own storefront endpoints respond in production, DCC-side Rezdy API credential provisioning, DCC-side live bookable slot verification, and the 10% commercial addendum remain pending.",
    storefrontIntegration: evaluateGosnoPilotEvidence(),
    verificationChecklist: {
      operatorAuthorization: "pending",
      providerApprovedApiAccess: "pending",
      agreedCommercialTerms: "pending",
      productMapping: "pending",
      livePricesAndAvailability: "pending",
      bookingAttributionAndOutcomeReporting: "pending",
      cancellationAndReturnPolicyVerifiedSeparately: "pending",
    },
    verificationNotes: {
      operatorAuthorization:
        "GoSno operates its own gosno.co storefront and /.well-known/dcc manifest (CO PUC LL-03577); formal authorization for the new DCC 10% direct-booking pilot is pending.",
      providerApprovedApiAccess:
        "Rezdy API access is active inside GoSno's own gosno.co deployment, but DCC-side REZDY_API_KEY credentials for api.rezdy.com/v1 have not yet been provisioned in DCC.",
      agreedCommercialTerms:
        "Proposed 10% direct commission addendum and settlement terms are not yet signed.",
      productMapping:
        "GET https://gosno.co/api/dcc/routes returns HTTP 200 with 9 private SUV route offerings mapped to Rezdy product codes (e.g., DEN-BRECKENRIDGE -> P7477S at $399.00), while private vans are quoteOnly; DCC-side Rezdy GET /v1/products verification is pending DCC API credentials.",
      livePricesAndAvailability:
        "Live probe GET https://gosno.co/api/availability?origin=DEN&dest=Breckenridge&date=2026-12-15&time=10:00&vehicleClass=suv&tripType=one_way&direction=to_mountain returned HTTP 200 with suv.available=false and van.quoteOnly=true; DCC-side live bookable slot verification against Rezdy is pending.",
      bookingAttributionAndOutcomeReporting:
        "End-to-end DCC booking hold, confirmation, cancellation, and commission outcome reporting are pending.",
      cancellationAndReturnPolicyVerifiedSeparately:
        "Direct-channel cancellation terms and winter I-70 operational policies are pending separate verification for the DCC direct pilot.",
    },
  },
};

export function auditPublishedOperatorsAgainstPreservedApi(): {
  ok: boolean;
  operatorCount: number;
  productCount: number;
  verifiedProducts: Array<{
    operatorSlug: string;
    productCode: string;
    supplierName: string;
    supplierReference: string;
    primaryDestinationId: number;
    destinationName: string;
    productUrl: string;
    status: "ACTIVE";
    imageSourceType: "SUPPLIER_PROVIDED";
  }>;
} {
  const bundle = loadPreservedViatorOperatorSnapshots();
  const verifiedProducts: Array<{
    operatorSlug: string;
    productCode: string;
    supplierName: string;
    supplierReference: string;
    primaryDestinationId: number;
    destinationName: string;
    productUrl: string;
    status: "ACTIVE";
    imageSourceType: "SUPPLIER_PROVIDED";
  }> = [];

  for (const op of VERIFIED_DCC_OPERATORS) {
    if (!op.supplierReference) {
      throw new Error(`Operator ${op.slug} is missing supplierReference`);
    }
    for (const prod of op.verifiedViatorProducts) {
      const snap = bundle.products.find((p) => p.code === prod.productCode);
      if (!snap || !snap.ok || snap.statusCode !== 200) {
        throw new Error(`Product ${prod.productCode} missing from preserved Viator API snapshot`);
      }
      if (op.supplierReference !== snap.data.supplier.reference) {
        throw new Error(
          `Operator ${op.slug} supplierReference (${op.supplierReference}) !== preserved API supplier.reference (${snap.data.supplier.reference})`,
        );
      }
      if (prod.supplierReference !== snap.data.supplier.reference) {
        throw new Error(
          `Product ${prod.productCode} supplierReference (${prod.supplierReference}) !== preserved API supplier.reference (${snap.data.supplier.reference})`,
        );
      }
      if (prod.productUrl !== snap.data.productUrl || prod.trackedViatorUrl !== snap.data.productUrl) {
        throw new Error(
          `Product ${prod.productCode} URL was modified from preserved Viator API productUrl`,
        );
      }
      const primaryRef = (snap.data.destinations.find((d) => d.primary) || snap.data.destinations[0])?.ref;
      const dest = resolveVerifiedViatorDestination(primaryRef!);
      if (prod.primaryDestinationId !== dest.destinationId) {
        throw new Error(
          `Product ${prod.productCode} primaryDestinationId (${prod.primaryDestinationId}) !== verified destination (${dest.destinationId})`,
        );
      }
      verifiedProducts.push({
        operatorSlug: op.slug,
        productCode: prod.productCode,
        supplierName: prod.supplierName,
        supplierReference: prod.supplierReference,
        primaryDestinationId: prod.primaryDestinationId,
        destinationName: `${dest.name}${dest.parentRegionName ? `, ${dest.parentRegionName}` : ""}`,
        productUrl: prod.productUrl,
        status: prod.status,
        imageSourceType: prod.imageSourceType,
      });
    }
  }

  return {
    ok: true,
    operatorCount: VERIFIED_DCC_OPERATORS.length,
    productCount: verifiedProducts.length,
    verifiedProducts,
  };
}

export type PriorOutreachFlaggedOperator = {
  name: string;
  city: string;
  website: string;
  priorProposal: "15% direct commission";
  doNotAutoSend: true;
  verifiedViatorPageSlug?: string;
  statusNote: string;
};

export const FLAGGED_PRIOR_OUTREACH_OPERATORS: PriorOutreachFlaggedOperator[] = [
  {
    name: "Coastal Helicopters",
    city: "Juneau, Alaska",
    website: "https://coastalhelicopters.com/",
    priorProposal: "15% direct commission",
    doNotAutoSend: true,
    verifiedViatorPageSlug: "coastal-helicopters",
    statusNote:
      "Already received a separate email proposing 15%. Has verified DCC page (/operators/coastal-helicopters) with active Viator product 6251SHOREXICEWALK (SUPPLIER-XZgZhAmmclREedANtzgvJw==). Flagged for manual review—do not auto-send.",
  },
  {
    name: "TEMSCO Helicopters",
    city: "Juneau, Alaska",
    website: "https://temscoair.com/",
    priorProposal: "15% direct commission",
    doNotAutoSend: true,
    statusNote:
      "Already received a separate email proposing 15%. No active Juneau Viator product verified through available API searches (retained as comparison search on JFD). Flagged for manual review—do not auto-send.",
  },
  {
    name: "NorthStar Trekking",
    city: "Juneau, Alaska",
    website: "https://northstartrekking.com/",
    priorProposal: "15% direct commission",
    doNotAutoSend: true,
    statusNote:
      "Already received a separate email proposing 15%. No active Juneau Viator product verified through available API searches (retained as comparison search on JFD). Flagged for manual review—do not auto-send.",
  },
];

export type NativeProviderApiSpec = {
  provider: string;
  protocolType: string;
  documentationUrl: string;
  authMechanism: string;
  catalogAndAvailabilityEndpoints: string;
  bookingAndAttributionNotes: string;
};

/**
 * Provider-specific API profiles based on actual provider documentation.
 * Do NOT assume FareHarbor, Bókun, Rezdy, and other native APIs all use OCTO endpoints.
 */
export const NATIVE_PROVIDER_API_PROFILES: NativeProviderApiSpec[] = [
  {
    provider: "Rezdy (Supplier / Agent REST API v1)",
    protocolType: "Native REST JSON (v1)",
    documentationUrl: "https://developers.rezdy.com/",
    authMechanism: "apiKey header / query parameter issued per authorized supplier/agent connection",
    catalogAndAvailabilityEndpoints:
      "GET /v1/products, GET /v1/availability?productCode=...&startTimeLocal=...&endTimeLocal=...",
    bookingAndAttributionNotes:
      "POST /v1/bookings with internal reference/reseller tracking; used by GoSno's gosno.co storefront and evaluated as DCC's first direct-channel pilot candidate.",
  },
  {
    provider: "FareHarbor (External API v1)",
    protocolType: "Native REST JSON (External API v1 — NOT OCTO by default)",
    documentationUrl: "https://developer.fareharbor.com/api/external/v1/",
    authMechanism: "X-FareHarbor-API-App and X-FareHarbor-API-User headers with operator-authorized company shortname",
    catalogAndAvailabilityEndpoints:
      "GET /api/external/v1/companies/{shortname}/items/, GET .../items/{pk}/availabilities/date/{date}/",
    bookingAndAttributionNotes:
      "POST .../availabilities/{pk}/bookings/ with partner/affiliate voucher & note fields; requires explicit operator permission for the company shortname.",
  },
  {
    provider: "Bókun (REST API / Channel Inventory API)",
    protocolType: "Native REST JSON with HMAC-SHA1 request signing (separate from optional OCTO adapter)",
    documentationUrl: "https://docs.bokun.io/",
    authMechanism: "X-Bokun-Date, X-Bokun-AccessKey, and X-Bokun-Signature (HMAC-SHA1)",
    catalogAndAvailabilityEndpoints:
      "GET /activity.json/{id}, GET /activity.json/{id}/availabilities?start=...&end=...",
    bookingAndAttributionNotes:
      "POST /booking.json/activity-booking/reserve-and-confirm with externalBookingReference for commission settlement.",
  },
  {
    provider: "Ventrata / OCTO Core v1.2.0",
    protocolType: "OCTO Core REST JSON (for providers that explicitly implement OCTO)",
    documentationUrl: "https://docs.octo.travel/",
    authMechanism: "Authorization: Bearer <token> with Octo-Capabilities header",
    catalogAndAvailabilityEndpoints:
      "GET /suppliers, GET /products, POST /availability",
    bookingAndAttributionNotes:
      "POST /bookings (hold) and POST /bookings/{uuid}/confirm with resellerReference for outcome reporting.",
  },
];

function readOperatorFile(slug: string): OperatorManifest | null {
  const filePath = path.join(OPERATORS_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as OperatorManifest;
  } catch {
    return null;
  }
}

export function listVerifiedOperators(): OperatorManifest[] {
  return VERIFIED_DCC_OPERATORS;
}

export function listOperatorSlugs(): string[] {
  const slugs = new Set<string>([
    ...VERIFIED_DCC_OPERATORS.map((op) => op.slug),
    ...SEASONAL_DCC_OPERATORS.map((op) => op.slug),
    GOSNO_DIRECT_PILOT_MANIFEST.slug,
  ]);
  return Array.from(slugs).sort();
}

export function getOperatorManifest(slug: string): OperatorManifest | null {
  if (slug === GOSNO_DIRECT_PILOT_MANIFEST.slug) {
    return GOSNO_DIRECT_PILOT_MANIFEST;
  }
  const verified = VERIFIED_DCC_OPERATORS.find((op) => op.slug === slug);
  if (verified) return verified;
  const seasonal = SEASONAL_DCC_OPERATORS.find((op) => op.slug === slug);
  if (seasonal) return seasonal;

  const fromDisk = readOperatorFile(slug);
  if (!fromDisk || !Array.isArray(fromDisk.verifiedViatorProducts)) return null;
  return { ...fromDisk, slug };
}

export function mergeOperatorRef(ref?: TourOperatorRef): TourOperatorRef | null {
  if (!ref?.slug) return null;
  const manifest = getOperatorManifest(ref.slug);
  if (!manifest) return ref;
  return {
    slug: ref.slug,
    name: ref.name || manifest.name,
    city: ref.city || manifest.city,
    website: ref.website || manifest.website,
    phone: ref.phone || manifest.phone,
  };
}

export function generatePilotOutreachDraft(operator: OperatorManifest): {
  canPrepareDraft: boolean;
  blockedReason?: string;
  recipientEmail?: string;
  pageUrl: string;
  subject: string;
  body: string;
} {
  const pageUrl = `https://www.destinationcommandcenter.com/operators/${operator.slug}`;
  if (operator.outreachStatus === "flagged_prior_15_percent_offer") {
    return {
      canPrepareDraft: false,
      blockedReason:
        "Flagged for review: operator previously received a separate email proposing 15% commission. Duplicate automated outreach is blocked.",
      recipientEmail: operator.verifiedBusinessEmail,
      pageUrl,
      subject: "",
      body: "",
    };
  }
  if (!operator.verifiedViatorProducts.length) {
    return {
      canPrepareDraft: false,
      blockedReason: "Operator does not have verified active Viator products on DCC.",
      recipientEmail: operator.verifiedBusinessEmail,
      pageUrl,
      subject: "",
      body: "",
    };
  }
  return {
    canPrepareDraft: true,
    recipientEmail: operator.verifiedBusinessEmail,
    pageUrl,
    subject: `${operator.name} tours on Destination Command Center`,
    body: `We’ve put together a page featuring your tours through Viator: ${pageUrl}. If you’d prefer bookings to go directly to your company, we can connect your booking API for a proposed 10% commission on completed direct bookings. Who handles API access and distribution partnerships?`,
  };
}
