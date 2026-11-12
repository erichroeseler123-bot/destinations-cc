/**
 * Isolated Read-Only Rezgo Inspection & 6-Gate Safe Connection Guard
 * (Serene — Juneau Tours & Whale Watch)
 *
 * Strict Governance & Promise Invariants:
 * 1. Credentials (`REZGO_SERENE_CID` / `REZGO_SERENE_API_KEY`) are read ONLY from server
 *    environment variables — never embedded in source code, client bundles, or public forms.
 * 2. Inspection (`inspectSereneRezgoInventoryReadOnly`) uses strictly read-only Rezgo XML
 *    `i=company` and `i=search` instructions (`GET` only). Zero booking (`i=commit`), hold,
 *    payment, cancellation, or customer-message instructions exist in this module.
 * 3. Property isolation (`isolatedSecondaryProperty: true`, `influencesPrimaryDccRanking: false`)
 *    is hard-pinned in code so Serene's inventory remains isolated and secondary as promised.
 * 4. Live customer booking remains hard-locked (`liveBookingAllowed: false`) until ALL five
 *    upstream gates are explicitly confirmed (`credentials_stored_securely`,
 *    `readonly_inventory_inspected`, `dcc_product_mapping_verified`,
 *    `written_commission_ownership_confirmed`, `non_customer_booking_flow_tested`) AND
 *    `REZGO_SERENE_LIVE_BOOKING_ENABLED=true`.
 */

import { appendViatorAttribution } from "@/lib/viator/links";

export type SereneRezgoGateStage =
  | "awaiting_credentials"
  | "ready_for_readonly_inspection"
  | "readonly_inspected_awaiting_mapping_and_written_commission"
  | "awaiting_non_customer_booking_test"
  | "ready_for_isolated_live_enablement"
  | "live_isolated_secondary";

export interface SereneRezgoReadinessStatus {
  operatorId: "juneau-tours-whale-watch";
  operatorName: "Juneau Tours & Whale Watch";
  contactReference: "Serene";
  isolatedSecondaryProperty: true;
  influencesPrimaryDccRanking: false;
  stage: SereneRezgoGateStage;
  liveBookingAllowed: boolean;
  gates: {
    credentialsStoredSecurelyInEnv: boolean;
    readOnlyInventoryInspected: boolean;
    dccProductMappingVerified: boolean;
    writtenCommissionOwnershipConfirmed: boolean;
    nonCustomerTestBookingVerified: boolean;
    liveBookingToggleEnabled: boolean;
  };
  knownViatorSupplierPrefix: "5857";
  candidateSkusToReconcile: readonly string[];
  nextActionLabel: string;
}

export interface RezgoDateAvailabilitySlot {
  date: string;
  departureTime: string | null;
  availableSpots: number | null;
  maxAvailability: number | null;
  adultPrice: string | null;
  childPrice: string | null;
  seniorPrice: string | null;
  active: boolean | null;
}

export interface RezgoInspectedItemSummary {
  uid: string;
  com: string | null;
  itemName: string;
  optionName: string | null;
  duration: string | null;
  durationMinutes?: number | null;
  departureTime?: string | null;
  departureTimes?: string[];
  adultPrice: string | null;
  childPrice?: string | null;
  seniorPrice?: string | null;
  priceTiers?: Array<{ label: string; amount: string }>;
  currency: string | null;
  startingLocation: string | null;
  availabilityOverall?: number | null;
  availableSpotsOnSearchDate?: number | null;
  maxAvailability?: number | null;
  searchDateChecked?: string | null;
  cutoffWindow?: string | null;
  supplierBookingCutoffHours?: number | null;
  supplierBookingCutoffSemantics?: "supplier_booking_cutoff_only_never_cruise_return_buffer";
  cancellationSummary?: string | null;
  dateSlots?: RezgoDateAvailabilitySlot[];
}

export interface RezgoProductCrossSurfaceReconciliation {
  rezgoUid: string;
  rezgoCom: string | null;
  rezgoItemName: string;
  rezgoOptionName: string | null;
  duration: string | null;
  durationMinutes: number | null;
  adultPriceUsd: number | null;
  childPriceUsd: number | null;
  departureTimes: string[];
  availableSpotsOnDate: number | null;
  dateChecked: string | null;
  matchConfidence: "high_exact_code" | "medium_title_and_operator" | "unmatched_rezgo_only";
  matchedDccCatalogProductCode: string | null;
  matchedDccCatalogTitle: string | null;
  matchedLastFrontierCatalogProductId: string | null;
  matchedCruisePromenadeSeedProductCode: string | null;
  supplierConflictStatus:
    | "none_same_operator_5857"
    | "conflicts_with_466119P3_dolphin_jet_boat"
    | "unmapped_needs_owner_confirmation";
  supplierConflictNote: string;
  activeSafeBookingFallbackProductCode: string | null;
  activeSafeBookingFallbackUrl: string | null;
  liveDirectRezgoCheckoutEnabled: false;
}

export interface SupplierIdentityConflictReport {
  conflictId: string;
  severity: "high" | "info";
  productCode: string;
  surfaceImpact: Array<"destinations-cc" | "last-frontier-shore-excursions" | "cruisepromenade">;
  listedViatorSupplier: string;
  rezgoVerifiedCompanyName: string | null;
  summary: string;
  safeFallbackBehavior: string;
}

export interface RezgoReadOnlyInspectionResult {
  ok: boolean;
  readOnly: true;
  mutatedRemoteState: false;
  isolatedSecondaryProperty: true;
  checkedAt: string;
  searchDate?: string | null;
  status:
    | "credentials_missing"
    | "inspected_ok"
    | "rezgo_http_error"
    | "rezgo_api_error"
    | "network_error";
  companyName: string | null;
  domain: string | null;
  currency: string | null;
  itemsCount: number;
  items: RezgoInspectedItemSummary[];
  reconciliation?: RezgoProductCrossSurfaceReconciliation[];
  supplierConflicts?: SupplierIdentityConflictReport[];
  writeCapabilitiesDisabled?: {
    commitBookingDisabled: true;
    paymentCaptureDisabled: true;
    cancellationDisabled: true;
    customerMessagingDisabled: true;
    liveDirectCheckoutEnabled: false;
  };
  errorMessage: string | null;
}

export type JuneauTourDurationScope = "dock_to_dock" | "activity_only_unverified";

export interface JuneauTourDurationProvenance {
  scope: JuneauTourDurationScope;
  operatorId: string;
  verifiedOperatorOnly: boolean;
  includesOutboundTransportation: boolean;
  includesActivity: boolean;
  includesReturnTransportationToDock: boolean;
  advertisedPickupReturnArea: string | null;
  additionalOperatorTransferMinutesAdded: 0;
  generalizedToOtherOperators: false;
  provenanceNote: string;
}

export const CONFIRMED_JUNEAU_TOURS_DOCK_TO_DOCK_COM_CODES = [
  "31703",
  "32329",
  "342080",
  "395337",
] as const;

export const CONFIRMED_JUNEAU_TOURS_DOCK_TO_DOCK_VIATOR_CODES = [
  "5857P22",
  "5857P23",
  "5857P31",
  "5857SHUTTLE",
] as const;

const CONFIRMED_JUNEAU_TOURS_COM_SET = new Set<string>(
  CONFIRMED_JUNEAU_TOURS_DOCK_TO_DOCK_COM_CODES,
);
const CONFIRMED_JUNEAU_TOURS_VIATOR_SET = new Set<string>(
  CONFIRMED_JUNEAU_TOURS_DOCK_TO_DOCK_VIATOR_CODES,
);
const DISALLOWED_NON_JUNEAU_TOURS_VIATOR_CODES = new Set<string>([
  "466119P3",
  "331813P1",
]);

/**
 * Resolves dock-to-dock duration provenance strictly for confirmed Juneau Tours & Whale Watch
 * Rezgo products. Never generalizes to Dolphin Jet Boat Tours (`466119P3`), Alaska Galore
 * (`331813P1`), aviation operators, or any non-`juneau-tours-whale-watch` operator.
 */
export function resolveJuneauToursDockToDockProvenance(params: {
  operatorId?: string | null;
  rezgoCom?: string | null;
  matchedViatorProductCode?: string | null;
  verifiedRezgoDomain?: string | null;
  verifiedRezgoCompanyName?: string | null;
  title?: string | null;
}): {
  durationScope: JuneauTourDurationScope;
  includedOperatorTransportationInPublishedDuration: boolean;
  durationProvenance: JuneauTourDurationProvenance;
} {
  const opId = (params.operatorId || "").trim();
  const com = (params.rezgoCom || "").trim();
  const viatorCode = (params.matchedViatorProductCode || "").trim().toUpperCase();
  const domain = (params.verifiedRezgoDomain || "").trim().toLowerCase();
  const company = (params.verifiedRezgoCompanyName || "").trim().toLowerCase();
  const title = (params.title || "").trim().toLowerCase();

  const isDisallowedViatorCode =
    Boolean(viatorCode) && DISALLOWED_NON_JUNEAU_TOURS_VIATOR_CODES.has(viatorCode);

  const isConfirmedOperator = opId === "juneau-tours-whale-watch" && !isDisallowedViatorCode;
  const isConfirmedCom = Boolean(com) && CONFIRMED_JUNEAU_TOURS_COM_SET.has(com);
  const isConfirmedViator = Boolean(viatorCode) && CONFIRMED_JUNEAU_TOURS_VIATOR_SET.has(viatorCode);
  const isVerifiedJuneauToursCompany =
    (domain.includes("juneautours") ||
      domain.includes("juneauwhalewatch") ||
      company.includes("juneau tours")) &&
    /(whale|mendenhall|glacier|trolley|wildlife|charter)/i.test(title);

  if (isConfirmedOperator && (isConfirmedCom || isConfirmedViator || isVerifiedJuneauToursCompany)) {
    return {
      durationScope: "dock_to_dock",
      includedOperatorTransportationInPublishedDuration: true,
      durationProvenance: {
        scope: "dock_to_dock",
        operatorId: "juneau-tours-whale-watch",
        verifiedOperatorOnly: true,
        includesOutboundTransportation: true,
        includesActivity: true,
        includesReturnTransportationToDock: true,
        advertisedPickupReturnArea:
          "Downtown Juneau Cruise Docks / Advertised Cruise Pickup Area",
        additionalOperatorTransferMinutesAdded: 0,
        generalizedToOtherOperators: false,
        provenanceNote:
          "Confirmed Juneau Tours Rezgo published durations are dock-to-dock and already include outbound operator transportation, the activity, and return transportation to the dock/advertised cruise pickup area.",
      },
    };
  }

  return {
    durationScope: "activity_only_unverified",
    includedOperatorTransportationInPublishedDuration: false,
    durationProvenance: {
      scope: "activity_only_unverified",
      operatorId: opId || "unverified-operator",
      verifiedOperatorOnly: false,
      includesOutboundTransportation: false,
      includesActivity: true,
      includesReturnTransportationToDock: false,
      advertisedPickupReturnArea: null,
      additionalOperatorTransferMinutesAdded: 0,
      generalizedToOtherOperators: false,
      provenanceNote:
        "Published duration is treated as activity-only until operator dock-to-dock pickup and return transportation provenance is explicitly confirmed.",
    },
  };
}

export interface RezgoOptionSailingWindowAssessment {
  departureTime: string;
  shipArrivalTime: string | null;
  shipAllAboardTime: string | null;
  allAboardConfirmed: boolean;
  meetingPointAndReturnConfirmed: boolean;
  durationScope?: JuneauTourDurationScope;
  estimatedDockReturnTime?: string | null;
  documentedBerthPickupMinutesApplied?: number;
  documentedBerthReturnMinutesApplied?: number;
  estimatedTourEndWithoutTransferTime: string | null;
  upperBoundRemainingSecondsBeforeTransfer: number | null;
  upperBoundRemainingBufferHmsLabel: string | null;
  status:
    | "recommended"
    | "outside_sailing_window_blocked"
    | "reduced_buffer_not_recommended"
    | "unverified_cruise_timing_pending_transfer_and_pickup";
  blockedForSailingWindow: boolean;
  displayLabel: string;
}

export interface NormalizedJuneauDepartureOption {
  uid: string;
  rezgoCom: string | null;
  optionName: string | null;
  departureTime: string | null;
  availableSpots: number | null;
  availabilitySemantics:
    | "rezgo_date_search_spots"
    | "rezgo_catalog_overall"
    | "unconfirmed_check_provider";
  adultPriceUsd: number | null;
  childPriceUsd: number | null;
  serviceDate: string | null;
  checkedAt: string;
  dccCommerceWrapperHref: string | null;
  windowAssessment: RezgoOptionSailingWindowAssessment | null;
}

export interface JuneauBookingProviderIdentity {
  operatorId: "juneau-tours-whale-watch";
  operatorName: string;
  verifiedRezgoCompanyName: string | null;
  verifiedRezgoDomain: string | null;
  rezgoCom: string | null;
  activeCheckoutProvider: "viator_approved_fallback" | "none_held_pending_mapping";
  fallbackProductCode: string | null;
  liveDirectRezgoCheckoutEnabled: false;
  checkoutDisclosure: string;
}

export interface NormalizedJuneauSupplierTour {
  normalizedTourId: string;
  rezgoUid: string;
  rezgoCom: string | null;
  optionUids: string[];
  departureOptions: NormalizedJuneauDepartureOption[];
  serviceDate: string | null;
  checkedAt: string;
  bookingProviderIdentity: JuneauBookingProviderIdentity;
  dccCommerceWrapperHref: string | null;
  operatorId: "juneau-tours-whale-watch";
  operatorName: string;
  verifiedRezgoCompanyName: string | null;
  title: string;
  optionName: string | null;
  activityCategory: "whale-watching" | "mendenhall-glacier-tours" | "combo-whale-glacier" | "juneau-sightseeing";
  durationLabel: string | null;
  durationMinutes: number | null;
  durationScope: JuneauTourDurationScope;
  includedOperatorTransportationInPublishedDuration: boolean;
  durationProvenance: JuneauTourDurationProvenance;
  adultPriceUsd: number | null;
  childPriceUsd: number | null;
  currency: string;
  departureTimes: string[];
  blockedOutsideWindowDepartures: string[];
  startingLocation: string | null;
  dateChecked: string | null;
  availableSpots: number | null;
  availabilitySemantics: "rezgo_date_search_spots" | "rezgo_catalog_overall" | "unconfirmed_check_provider";
  supplierBookingCutoffHours: number | null;
  supplierBookingCutoffSemantics: "supplier_booking_cutoff_only_never_cruise_return_buffer";
  cruiseTimingVerificationStatus:
    | "dock_to_dock_confirmed_window_evaluated"
    | "live_operator_availability_dock_to_dock_pending_ship_all_aboard"
    | "live_operator_availability_only_unverified_cruise_timing";
  cruiseTimingStatusLabel: string;
  cruiseTimingDisclosure: string;
  dccRequiredRecommendedReturnBufferSeconds: 7199;
  dccRequiredRecommendedReturnBufferLabel: "1:59:59+ before confirmed all-aboard";
  optionWindowAssessments: RezgoOptionSailingWindowAssessment[];
  cacheKey: string;
  matchConfidence: "high_exact_code" | "medium_title_and_operator" | "unmatched_rezgo_only";
  matchedViatorProductCode: string | null;
  approvedFallbackViatorUrl: string | null;
  liveDirectRezgoCheckoutEnabled: false;
  isolatedSecondaryProperty: true;
  influencesPrimaryDccRanking: false;
}

export interface NormalizedJuneauSupplierFeed {
  ok: boolean;
  source: "dcc_rezgo_readonly_xml" | "dcc_approved_fallback";
  generatedAt: string;
  checkedAt: string;
  dateChecked: string | null;
  cachePolicy: {
    scope: "operator_product_service_date";
    operatorKey: "juneau-tours-whale-watch";
    productKey: string;
    serviceDateKey: string;
    cacheKey: string;
    maxEntriesBound: number;
    cacheStatus: "hit" | "miss_fresh" | "bypassed";
    cachedAt: string;
    expiresAt: string;
    ttlSeconds: number;
  };
  timingSafetyPolicy: {
    feedClassification: "live_operator_availability_only";
    verifiedCruiseSafeTiming: false;
    supplierCutoffIsNeverCruiseReturnBuffer: true;
    dccRecommendedReturnBufferMinimumSeconds: 7199;
    dccRecommendedReturnBufferLabel: "At least 1:59:59 before ship's confirmed all-aboard time";
    unconfirmedInputs: readonly [
      "exact_meeting_points",
      "berth_transfer_durations",
      "operator_return_times",
      "dock_pickup_rules",
    ];
  };
  readOnly: true;
  liveDirectRezgoCheckoutEnabled: false;
  isolatedSecondaryProperty: true;
  influencesPrimaryDccRanking: false;
  rezgoStatus: RezgoReadOnlyInspectionResult["status"];
  verifiedCompanyName: string | null;
  verifiedRezgoDomain: string | null;
  currency: string;
  toursCount: number;
  tours: NormalizedJuneauSupplierTour[];
  supplierConflicts: SupplierIdentityConflictReport[];
}

const REZGO_XML_ENDPOINT = "https://xml.rezgo.com/xml";

const APPROVED_JUNEAU_5857_VIATOR_CATALOG: Record<
  string,
  {
    productCode: string;
    title: string;
    canonicalViatorUrl: string;
    inLastFrontierStaticCatalog: boolean;
    durationMinutes: number;
  }
> = {
  "5857P22": {
    productCode: "5857P22",
    title: "Mendenhall Glacier Park and Ultimate Whale Watch Combo",
    canonicalViatorUrl:
      "https://www.viator.com/tours/Juneau/Whale-Watch-and-Mendenhall-Glacier-Combo-Tour/d941-5857P22",
    inLastFrontierStaticCatalog: false,
    durationMinutes: 300,
  },
  "5857P23": {
    productCode: "5857P23",
    title: "Ultimate Juneau Whale Watch",
    canonicalViatorUrl:
      "https://www.viator.com/tours/Juneau/Juneau-Whale-Watching-Tour/d941-5857P23",
    inLastFrontierStaticCatalog: false,
    durationMinutes: 180,
  },
  "5857SHUTTLE": {
    productCode: "5857SHUTTLE",
    title: "Mendenhall Glacier Express Round-Trip Shuttle",
    canonicalViatorUrl:
      "https://www.viator.com/tours/Juneau/Round-Trip-Mendenhall-Glacier-Shuttle-Service/d941-5857SHUTTLE",
    inLastFrontierStaticCatalog: true,
    durationMinutes: 180,
  },
  "5857P31": {
    productCode: "5857P31",
    title: "Ultimate Whale Watch and Tracy's Crab Shack Meal",
    canonicalViatorUrl:
      "https://www.viator.com/tours/Juneau/Whale-Watching-and-Tracys-King-Crab-Shack-Combo/d941-5857P31",
    inLastFrontierStaticCatalog: false,
    durationMinutes: 270,
  },
};

function isTruthyFlag(value: string | undefined): boolean {
  const norm = (value || "").trim().toLowerCase();
  return norm === "1" || norm === "true" || norm === "yes";
}

/**
 * Scrubs any Rezgo credential values or query parameters from error messages or strings.
 * Ensures CID (`transcode`) and API key (`key`) can NEVER appear in responses or logs.
 */
export function sanitizeRezgoDiagnosticMessage(
  rawMessage: string | null | undefined,
  secretsToScrub: Array<string | undefined> = [],
): string | null {
  if (!rawMessage) return null;
  let cleaned = String(rawMessage)
    .replace(/([?&](?:transcode|key|cid|api_key|apikey)=)[^&\s"']+/gi, "$1[REDACTED]")
    .replace(/(<(?:transcode|key|api_key)>)\s*[\s\S]*?\s*(<\/(?:transcode|key|api_key)>)/gi, "$1[REDACTED]$2");

  for (const sec of secretsToScrub) {
    const trimmed = (sec || "").trim();
    if (trimmed.length >= 3) {
      cleaned = cleaned.split(trimmed).join("[REDACTED]");
    }
  }
  return cleaned;
}

function decodeBasicXmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function stripHtmlTags(input: string): string {
  return decodeBasicXmlEntities(input)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractXmlTag(xmlBlock: string, tag: string): string | null {
  const cdataRe = new RegExp(
    `<${tag}\\b[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`,
    "i",
  );
  const cdataMatch = xmlBlock.match(cdataRe);
  if (cdataMatch && cdataMatch[1] !== undefined) {
    const val = decodeBasicXmlEntities(cdataMatch[1].trim());
    return val || null;
  }
  const plainRe = new RegExp(`<${tag}\\b[^>]*>([^<]*)</${tag}>`, "i");
  const plainMatch = xmlBlock.match(plainRe);
  if (plainMatch && plainMatch[1] !== undefined) {
    const val = decodeBasicXmlEntities(plainMatch[1].trim());
    return val || null;
  }
  return null;
}

export function parseDurationToMinutes(rawDuration: string | null | undefined): number | null {
  if (!rawDuration) return null;
  const text = rawDuration.trim().toLowerCase();
  if (!text) return null;

  // Match e.g. "3.5 hours", "3 hours", "3 hrs 30 mins", "2.5 - 3 hours"
  const rangeHoursMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h\b)/);
  if (rangeHoursMatch) {
    const high = Number(rangeHoursMatch[2]);
    if (Number.isFinite(high) && high > 0) return Math.round(high * 60);
  }

  const hoursAndMinsMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h\b)(?:\s*(\d+)\s*(?:minutes?|mins?|m\b))?/);
  if (hoursAndMinsMatch) {
    const hrs = Number(hoursAndMinsMatch[1]);
    const mins = hoursAndMinsMatch[2] ? Number(hoursAndMinsMatch[2]) : 0;
    if (Number.isFinite(hrs)) {
      const total = Math.round(hrs * 60 + (Number.isFinite(mins) ? mins : 0));
      return total > 0 ? total : null;
    }
  }

  const minsOnlyMatch = text.match(/(\d+)\s*(?:minutes?|mins?|m\b)/);
  if (minsOnlyMatch) {
    const mins = Number(minsOnlyMatch[1]);
    return Number.isFinite(mins) && mins > 0 ? mins : null;
  }

  const daysMatch = text.match(/(\d+(?:\.\d+)?)\s*days?/);
  if (daysMatch) {
    const days = Number(daysMatch[1]);
    return Number.isFinite(days) && days > 0 ? Math.round(days * 1440) : null;
  }

  return null;
}

function normalizeRezgoClockTime(rawTime: string | null | undefined): string | null {
  if (!rawTime) return null;
  const cleaned = rawTime.trim();
  if (!cleaned) return null;

  // Handle "9:00 AM", "09:30 am", "1:15 PM", "13:30", "09:00:00", "08:30:01"
  const ampmMatch = cleaned.match(/^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(am|pm)$/i);
  if (ampmMatch) {
    let hour = Number(ampmMatch[1]);
    const min = Number(ampmMatch[2] || "0");
    const sec = ampmMatch[3] ? Number(ampmMatch[3]) : 0;
    const mer = ampmMatch[4].toLowerCase();
    if (hour < 1 || hour > 12 || min < 0 || min > 59 || sec < 0 || sec > 59) return cleaned;
    if (mer === "pm" && hour !== 12) hour += 12;
    if (mer === "am" && hour === 12) hour = 0;
    const base = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    return sec > 0 ? `${base}:${String(sec).padStart(2, "0")}` : base;
  }

  const hhmmMatch = cleaned.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (hhmmMatch) {
    const hour = Number(hhmmMatch[1]);
    const min = Number(hhmmMatch[2]);
    const sec = hhmmMatch[3] ? Number(hhmmMatch[3]) : 0;
    if (hour >= 0 && hour <= 23 && min >= 0 && min <= 59 && sec >= 0 && sec <= 59) {
      const base = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      return sec > 0 ? `${base}:${String(sec).padStart(2, "0")}` : base;
    }
  }

  return cleaned;
}

function parseNonNegativeInt(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = String(raw).trim();
  if (!trimmed || !/^-?\d+$/.test(trimmed)) return null;
  const num = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

function parsePositivePrice(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = String(raw).replace(/[^0-9.]/g, "").trim();
  if (!cleaned) return null;
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) && num > 0 ? Number(num.toFixed(2)) : null;
}

function splitOuterRezgoItemBlocks(xml: string): string[] {
  const blocks: string[] = [];
  // Use stack-based balanced <item>...</item> extraction so inner <item><![CDATA[Title]]></item>
  // or arbitrary child tag ordering (<id>, <uid>, <com>, etc.) is parsed cleanly without regex backtracking bugs.
  const tokenRe = /<item\b[^>]*>|<\/item>/gi;
  let depth = 0;
  let outerStartContentIdx = -1;
  let match: RegExpExecArray | null;

  while ((match = tokenRe.exec(xml)) !== null) {
    const token = match[0].toLowerCase();
    if (token.startsWith("</item")) {
      if (depth === 1 && outerStartContentIdx >= 0) {
        const innerContent = xml.slice(outerStartContentIdx, match.index);
        blocks.push(innerContent);
        outerStartContentIdx = -1;
      }
      if (depth > 0) depth -= 1;
    } else {
      if (depth === 0) {
        outerStartContentIdx = match.index + match[0].length;
      }
      depth += 1;
    }
  }

  return blocks;
}

export function parseRezgoItemsXml(
  xml: string,
  options?: { searchDate?: string | null },
): RezgoInspectedItemSummary[] {
  const items: RezgoInspectedItemSummary[] = [];
  const rawBlocks = splitOuterRezgoItemBlocks(xml);
  const searchDate =
    options?.searchDate && /^\d{4}-\d{2}-\d{2}$/.test(options.searchDate)
      ? options.searchDate
      : null;

  for (const block of rawBlocks) {
    const uid = extractXmlTag(block, "uid") || "";
    const com = extractXmlTag(block, "com");
    // Only treat <item> blocks that look like Rezgo inventory records (have <uid>, <com>, <option>, or <price_adult>)
    const itemName =
      extractXmlTag(block, "item") ||
      extractXmlTag(block, "name") ||
      extractXmlTag(block, "title") ||
      "";
    if (!uid && !com && !itemName) continue;

    const optionName = extractXmlTag(block, "option");
    const duration = extractXmlTag(block, "duration");
    const durationMinutes = parseDurationToMinutes(duration);

    const rawTime = extractXmlTag(block, "time");
    const normalizedItemTime = normalizeRezgoClockTime(rawTime);

    // Parse optional nested <date> availability blocks when `d=YYYY-MM-DD` is queried
    const dateSlots: RezgoDateAvailabilitySlot[] = [];
    const dateBlockRe = /<date\b([^>]*)>([\s\S]*?)<\/date>/gi;
    let dMatch: RegExpExecArray | null;
    while ((dMatch = dateBlockRe.exec(block)) !== null) {
      const attrs = dMatch[1] || "";
      const dBody = dMatch[2] || "";
      const attrDateMatch = attrs.match(/\b(?:val|value|date|day)=["'](\d{4}-\d{2}-\d{2})["']/i);
      const tagDate =
        attrDateMatch?.[1] ||
        extractXmlTag(dBody, "day") ||
        extractXmlTag(dBody, "date_iso") ||
        searchDate ||
        "";
      const slotTime = normalizeRezgoClockTime(extractXmlTag(dBody, "time")) || normalizedItemTime;
      const slotAvail =
        parseNonNegativeInt(extractXmlTag(dBody, "availability")) ??
        parseNonNegativeInt(extractXmlTag(dBody, "spots")) ??
        parseNonNegativeInt(extractXmlTag(dBody, "remaining"));
      const slotMax = parseNonNegativeInt(extractXmlTag(dBody, "max_availability"));
      const activeRaw = extractXmlTag(dBody, "active");
      dateSlots.push({
        date: tagDate,
        departureTime: slotTime,
        availableSpots: slotAvail,
        maxAvailability: slotMax,
        adultPrice: extractXmlTag(dBody, "price_adult") || extractXmlTag(dBody, "base_prices"),
        childPrice: extractXmlTag(dBody, "price_child"),
        seniorPrice: extractXmlTag(dBody, "price_senior"),
        active: activeRaw !== null ? activeRaw !== "0" && activeRaw.toLowerCase() !== "false" : null,
      });
    }

    const departureSet = new Set<string>();
    if (normalizedItemTime) {
      for (const part of normalizedItemTime.split(/[,;/]+/)) {
        const norm = normalizeRezgoClockTime(part);
        if (norm) departureSet.add(norm);
      }
    }
    for (const ds of dateSlots) {
      if (ds.departureTime) departureSet.add(ds.departureTime);
    }
    const departureTimes = Array.from(departureSet);

    const adultPrice =
      extractXmlTag(block, "price_adult") ||
      dateSlots.find((d) => d.adultPrice)?.adultPrice ||
      extractXmlTag(block, "base_prices");
    const childPrice =
      extractXmlTag(block, "price_child") ||
      dateSlots.find((d) => d.childPrice)?.childPrice ||
      null;
    const seniorPrice =
      extractXmlTag(block, "price_senior") ||
      dateSlots.find((d) => d.seniorPrice)?.seniorPrice ||
      null;

    const priceTiers: Array<{ label: string; amount: string }> = [];
    if (adultPrice) priceTiers.push({ label: "Adult", amount: adultPrice });
    if (childPrice) priceTiers.push({ label: "Child", amount: childPrice });
    if (seniorPrice) priceTiers.push({ label: "Senior", amount: seniorPrice });
    // Also inspect any custom <price_*> or <tier> tags
    for (const customTag of ["price_youth", "price_infant", "price_group", "price_private"]) {
      const val = extractXmlTag(block, customTag);
      if (val) {
        const label = customTag.replace(/^price_/, "");
        priceTiers.push({
          label: label.charAt(0).toUpperCase() + label.slice(1),
          amount: val,
        });
      }
    }

    const directAvail = parseNonNegativeInt(extractXmlTag(block, "availability"));
    const overallAvail = parseNonNegativeInt(extractXmlTag(block, "overall_availability"));
    const maxAvailability =
      parseNonNegativeInt(extractXmlTag(block, "max_availability")) ??
      dateSlots.find((d) => d.maxAvailability !== null)?.maxAvailability ??
      null;

    const availableSpotsOnSearchDate = searchDate
      ? (dateSlots.find((d) => !d.date || d.date === searchDate)?.availableSpots ?? directAvail)
      : null;

    const rawCancel =
      extractXmlTag(block, "cancellation") ||
      extractXmlTag(block, "cancellation_policy") ||
      null;
    const cancellationSummary = rawCancel ? stripHtmlTags(rawCancel).slice(0, 240) : null;
    const rawCutoff = extractXmlTag(block, "cutoff");
    const parsedCutoffHours =
      rawCutoff !== null && rawCutoff.trim() !== "" && Number.isFinite(Number(rawCutoff))
        ? Math.max(0, Number(rawCutoff))
        : null;

    items.push({
      uid: uid || "unindexed",
      com,
      itemName: itemName || `Rezgo Item ${uid}`,
      optionName,
      duration,
      durationMinutes,
      departureTime: normalizedItemTime || departureTimes[0] || null,
      departureTimes,
      adultPrice,
      childPrice,
      seniorPrice,
      priceTiers,
      currency: extractXmlTag(block, "currency_base") || extractXmlTag(block, "currency"),
      startingLocation:
        extractXmlTag(block, "starting_location") || extractXmlTag(block, "city"),
      availabilityOverall: overallAvail ?? directAvail,
      availableSpotsOnSearchDate,
      maxAvailability,
      searchDateChecked: searchDate,
      cutoffWindow: rawCutoff,
      supplierBookingCutoffHours: parsedCutoffHours,
      supplierBookingCutoffSemantics:
        "supplier_booking_cutoff_only_never_cruise_return_buffer",
      cancellationSummary,
      ...(dateSlots.length > 0 ? { dateSlots } : {}),
    });
  }
  return items;
}

export function reconcileRezgoItemsAcrossSurfaces(params: {
  items: RezgoInspectedItemSummary[];
  companyName: string | null;
  searchDate?: string | null;
}): {
  reconciliation: RezgoProductCrossSurfaceReconciliation[];
  supplierConflicts: SupplierIdentityConflictReport[];
} {
  const reconciliation: RezgoProductCrossSurfaceReconciliation[] = [];

  for (const item of params.items) {
    const comUpper = (item.com || "").trim().toUpperCase();
    const uidUpper = (item.uid || "").trim().toUpperCase();
    const combinedTitle = `${item.itemName} ${item.optionName || ""}`.toLowerCase();

    let matchConfidence: RezgoProductCrossSurfaceReconciliation["matchConfidence"] =
      "unmatched_rezgo_only";
    let matchedViatorCode: string | null = null;

    if (APPROVED_JUNEAU_5857_VIATOR_CATALOG[comUpper]) {
      matchConfidence = "high_exact_code";
      matchedViatorCode = comUpper;
    } else if (APPROVED_JUNEAU_5857_VIATOR_CATALOG[uidUpper]) {
      matchConfidence = "high_exact_code";
      matchedViatorCode = uidUpper;
    } else if (/six\s*passenger|private\s*charter|\bcharter\b/i.test(combinedTitle)) {
      // COM 395337 ("Six Passenger Whale Watch Charter") is a private 6-pax charter,
      // NOT the standard 40-passenger Ultimate Juneau Whale Watch (5857P23).
      matchConfidence = "unmatched_rezgo_only";
      matchedViatorCode = null;
    } else if (/city\s*trolley/i.test(combinedTitle) && !/mendenhall|glacier/i.test(combinedTitle)) {
      // COM 342080 ("City Trolley Tour", 1 hour, $50) is distinct from the 3-hour Mendenhall Glacier Shuttle/Trolley (5857SHUTTLE).
      matchConfidence = "unmatched_rezgo_only";
      matchedViatorCode = null;
    } else if (/crab|tracy/i.test(combinedTitle) && /whale/i.test(combinedTitle)) {
      matchConfidence = "medium_title_and_operator";
      matchedViatorCode = "5857P31";
    } else if (
      (/mendenhall|glacier/i.test(combinedTitle) && /whale/i.test(combinedTitle)) ||
      /combo/i.test(combinedTitle)
    ) {
      matchConfidence = "medium_title_and_operator";
      matchedViatorCode = "5857P22";
    } else if (
      (/shuttle|trolley|express|blue bus/i.test(combinedTitle) &&
        /mendenhall|glacier/i.test(combinedTitle) &&
        !/whale/i.test(combinedTitle))
    ) {
      matchConfidence = "medium_title_and_operator";
      matchedViatorCode = "5857SHUTTLE";
    } else if (/whale/i.test(combinedTitle) && !/mendenhall|glacier|crab|tracy/i.test(combinedTitle)) {
      matchConfidence = "medium_title_and_operator";
      matchedViatorCode = "5857P23";
    }

    const catalogSpec = matchedViatorCode
      ? APPROVED_JUNEAU_5857_VIATOR_CATALOG[matchedViatorCode]
      : null;

    const isComboCandidate = matchedViatorCode === "5857P22";

    reconciliation.push({
      rezgoUid: item.uid,
      rezgoCom: item.com,
      rezgoItemName: item.itemName,
      rezgoOptionName: item.optionName,
      duration: item.duration,
      durationMinutes: item.durationMinutes ?? catalogSpec?.durationMinutes ?? null,
      adultPriceUsd: parsePositivePrice(item.adultPrice),
      childPriceUsd: parsePositivePrice(item.childPrice),
      departureTimes: item.departureTimes || (item.departureTime ? [item.departureTime] : []),
      availableSpotsOnDate: item.availableSpotsOnSearchDate ?? null,
      dateChecked: params.searchDate ?? item.searchDateChecked ?? null,
      matchConfidence,
      matchedDccCatalogProductCode: catalogSpec?.productCode ?? null,
      matchedDccCatalogTitle: catalogSpec?.title ?? null,
      matchedLastFrontierCatalogProductId:
        catalogSpec?.inLastFrontierStaticCatalog ? catalogSpec.productCode : null,
      matchedCruisePromenadeSeedProductCode: null, // CP static fallback seed currently uses 466119P3 (Dolphin Jet Boat Tours); CP receives 5857* via DCC live API
      supplierConflictStatus: isComboCandidate
        ? "conflicts_with_466119P3_dolphin_jet_boat"
        : catalogSpec
          ? "none_same_operator_5857"
          : "unmapped_needs_owner_confirmation",
      supplierConflictNote: isComboCandidate
        ? "Matches Juneau Tours & Whale Watch Viator SKU 5857P22 in DCC SQL catalog, whereas Last Frontier's static combo card and Cruise Promenade's offline fallback seed currently reference Viator 466119P3 (verified supplier: Dolphin Jet Boat Tours). Must NOT merge Rezgo availability or direct referral credit onto 466119P3."
        : catalogSpec
          ? `Reconciles to Juneau Tours & Whale Watch Viator prefix 5857 (${catalogSpec.productCode})${
              matchConfidence === "medium_title_and_operator"
                ? " by operator + title/duration heuristic; requires owner SKU sign-off before enabling direct checkout."
                : " by exact Rezgo COM code."
            }`
          : "No exact 5857* Viator SKU match established yet; kept read-only until owner confirms mapping.",
      activeSafeBookingFallbackProductCode: catalogSpec?.productCode ?? null,
      activeSafeBookingFallbackUrl: catalogSpec?.canonicalViatorUrl ?? null,
      liveDirectRezgoCheckoutEnabled: false,
    });
  }

  const supplierConflicts: SupplierIdentityConflictReport[] = [
    {
      conflictId: "juneau-466119p3-vs-5857-supplier-mismatch",
      severity: "high",
      productCode: "466119P3",
      surfaceImpact: [
        "destinations-cc",
        "last-frontier-shore-excursions",
        "cruisepromenade",
      ],
      listedViatorSupplier: "Dolphin Jet Boat Tours",
      rezgoVerifiedCompanyName: params.companyName || "Juneau Tours & Whale Watch",
      summary:
        "Viator product d941-466119P3 (Mendenhall Glacier Waterfall and Whale Watching Tour) is supplied by Dolphin Jet Boat Tours, NOT Juneau Tours & Whale Watch. Juneau Tours & Whale Watch operates Viator prefix 5857 (5857P22, 5857P23, 5857SHUTTLE, 5857P31).",
      safeFallbackBehavior:
        "466119P3 remains attributed strictly to Dolphin Jet Boat Tours via Viator affiliate checkout; Rezgo inventory from Juneau Tours & Whale Watch is isolated to prefix-5857 / juneau-tours-whale-watch records with direct Rezgo checkout disabled.",
    },
  ];

  return { reconciliation, supplierConflicts };
}

export function getSereneRezgoReadinessStatus(
  env: Record<string, string | undefined> = process.env,
): SereneRezgoReadinessStatus {
  const cid = (env.REZGO_SERENE_CID || "").trim();
  const apiKey = (env.REZGO_SERENE_API_KEY || "").trim();
  const credentialsStoredSecurelyInEnv = Boolean(cid && apiKey.length >= 8);
  const readOnlyInventoryInspected =
    credentialsStoredSecurelyInEnv &&
    isTruthyFlag(env.REZGO_SERENE_READONLY_INSPECTED);
  const dccProductMappingVerified =
    readOnlyInventoryInspected &&
    isTruthyFlag(env.REZGO_SERENE_PRODUCT_MAPPING_VERIFIED);
  const writtenCommissionOwnershipConfirmed =
    readOnlyInventoryInspected &&
    isTruthyFlag(env.REZGO_SERENE_WRITTEN_COMMISSION_CONFIRMED);
  const nonCustomerTestBookingVerified =
    dccProductMappingVerified &&
    writtenCommissionOwnershipConfirmed &&
    isTruthyFlag(env.REZGO_SERENE_NON_CUSTOMER_TEST_VERIFIED);
  const liveBookingToggleEnabled =
    nonCustomerTestBookingVerified &&
    isTruthyFlag(env.REZGO_SERENE_LIVE_BOOKING_ENABLED);

  let stage: SereneRezgoGateStage = "awaiting_credentials";
  let nextActionLabel =
    "Awaiting Serene's active Rezgo CID + API key (store in REZGO_SERENE_CID & REZGO_SERENE_API_KEY; never in code/forms).";

  if (liveBookingToggleEnabled) {
    stage = "live_isolated_secondary";
    nextActionLabel =
      "Live isolated Rezgo connection active (secondary property boundary enforced).";
  } else if (nonCustomerTestBookingVerified) {
    stage = "ready_for_isolated_live_enablement";
    nextActionLabel =
      "All 5 safety gates passed — set REZGO_SERENE_LIVE_BOOKING_ENABLED=true when ready to open bookings.";
  } else if (dccProductMappingVerified && writtenCommissionOwnershipConfirmed) {
    stage = "awaiting_non_customer_booking_test";
    nextActionLabel =
      "Run non-customer Rezgo test booking flow and verify clean cancellation/void before live enablement.";
  } else if (readOnlyInventoryInspected) {
    stage = "readonly_inspected_awaiting_mapping_and_written_commission";
    nextActionLabel =
      "Map Rezgo UIDs to DCC Juneau whale/shuttle SKUs and confirm 10% direct commission ownership in writing.";
  } else if (credentialsStoredSecurelyInEnv) {
    stage = "ready_for_readonly_inspection";
    nextActionLabel =
      "Credentials stored — run read-only Rezgo inventory & availability inspection (zero mutations).";
  }

  return {
    operatorId: "juneau-tours-whale-watch",
    operatorName: "Juneau Tours & Whale Watch",
    contactReference: "Serene",
    isolatedSecondaryProperty: true,
    influencesPrimaryDccRanking: false,
    stage,
    liveBookingAllowed: liveBookingToggleEnabled,
    gates: {
      credentialsStoredSecurelyInEnv,
      readOnlyInventoryInspected,
      dccProductMappingVerified,
      writtenCommissionOwnershipConfirmed,
      nonCustomerTestBookingVerified,
      liveBookingToggleEnabled,
    },
    knownViatorSupplierPrefix: "5857",
    candidateSkusToReconcile: ["5857P22", "5857P23", "5857SHUTTLE"],
    nextActionLabel,
  };
}

/**
 * Strictly read-only Rezgo inspection (`i=company` and `i=search` via HTTP GET).
 * Never creates holds, bookings, payments, cancellations, customer messages, or mutations.
 */
export async function inspectSereneRezgoInventoryReadOnly(options?: {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  searchDate?: string;
}): Promise<RezgoReadOnlyInspectionResult> {
  const env = options?.env ?? process.env;
  const checkedAt = new Date().toISOString();
  const cid = (env.REZGO_SERENE_CID || "").trim();
  const apiKey = (env.REZGO_SERENE_API_KEY || "").trim();
  const searchDate =
    options?.searchDate && /^\d{4}-\d{2}-\d{2}$/.test(options.searchDate)
      ? options.searchDate
      : null;

  const writeCapabilitiesDisabled = {
    commitBookingDisabled: true as const,
    paymentCaptureDisabled: true as const,
    cancellationDisabled: true as const,
    customerMessagingDisabled: true as const,
    liveDirectCheckoutEnabled: false as const,
  };

  if (!cid || apiKey.length < 8) {
    const { supplierConflicts } = reconcileRezgoItemsAcrossSurfaces({
      items: [],
      companyName: null,
      searchDate,
    });
    return {
      ok: false,
      readOnly: true,
      mutatedRemoteState: false,
      isolatedSecondaryProperty: true,
      checkedAt,
      searchDate,
      status: "credentials_missing",
      companyName: null,
      domain: null,
      currency: null,
      itemsCount: 0,
      items: [],
      reconciliation: [],
      supplierConflicts,
      writeCapabilitiesDisabled,
      errorMessage:
        "Missing REZGO_SERENE_CID or REZGO_SERENE_API_KEY in server environment.",
    };
  }

  const fetchFn = options?.fetchImpl ?? fetch;
  const buildReadOnlyUrl = (instruction: "company" | "search") => {
    const u = new URL(REZGO_XML_ENDPOINT);
    u.searchParams.set("transcode", cid);
    u.searchParams.set("key", apiKey);
    u.searchParams.set("i", instruction);
    if (instruction === "search" && searchDate) {
      u.searchParams.set("d", searchDate);
    }
    return u.toString();
  };

  try {
    const requestHeaders = {
      Accept: "*/*",
      "User-Agent": "DestinationCommandCenter-ReadOnlyInspector/1.0",
    };
    const [companyRes, searchRes] = await Promise.all([
      fetchFn(buildReadOnlyUrl("company"), {
        method: "GET",
        headers: requestHeaders,
        cache: "no-store",
        signal: AbortSignal.timeout(6500),
      }),
      fetchFn(buildReadOnlyUrl("search"), {
        method: "GET",
        headers: requestHeaders,
        cache: "no-store",
        signal: AbortSignal.timeout(6500),
      }),
    ]);

    const [companyXml, searchXml] = await Promise.all([
      companyRes.text(),
      searchRes.text(),
    ]);

    if (!companyRes.ok || !searchRes.ok) {
      const responseNoteRaw =
        extractXmlTag(companyXml, "error") ||
        extractXmlTag(searchXml, "error") ||
        extractXmlTag(companyXml, "response") ||
        extractXmlTag(searchXml, "response") ||
        null;
      const safeNote = sanitizeRezgoDiagnosticMessage(responseNoteRaw, [cid, apiKey]);
      const { supplierConflicts } = reconcileRezgoItemsAcrossSurfaces({
        items: [],
        companyName: null,
        searchDate,
      });
      return {
        ok: false,
        readOnly: true,
        mutatedRemoteState: false,
        isolatedSecondaryProperty: true,
        checkedAt,
        searchDate,
        status: "rezgo_http_error",
        companyName: null,
        domain: null,
        currency: null,
        itemsCount: 0,
        items: [],
        reconciliation: [],
        supplierConflicts,
        writeCapabilitiesDisabled,
        errorMessage: `Rezgo read-only GET returned HTTP ${companyRes.status} / ${searchRes.status}${
          safeNote ? ` (${safeNote.slice(0, 140)})` : ""
        }.`,
      };
    }

    const xmlError =
      extractXmlTag(companyXml, "error") || extractXmlTag(searchXml, "error");
    if (xmlError) {
      const safeError = sanitizeRezgoDiagnosticMessage(xmlError, [cid, apiKey]);
      const { supplierConflicts } = reconcileRezgoItemsAcrossSurfaces({
        items: [],
        companyName: extractXmlTag(companyXml, "company_name"),
        searchDate,
      });
      return {
        ok: false,
        readOnly: true,
        mutatedRemoteState: false,
        isolatedSecondaryProperty: true,
        checkedAt,
        searchDate,
        status: "rezgo_api_error",
        companyName: extractXmlTag(companyXml, "company_name"),
        domain: extractXmlTag(companyXml, "domain"),
        currency: extractXmlTag(companyXml, "currency"),
        itemsCount: 0,
        items: [],
        reconciliation: [],
        supplierConflicts,
        writeCapabilitiesDisabled,
        errorMessage: `Rezgo XML error: ${safeError}`,
      };
    }

    const companyName = extractXmlTag(companyXml, "company_name");
    const domain = extractXmlTag(companyXml, "domain");
    const currency = extractXmlTag(companyXml, "currency");
    const items = parseRezgoItemsXml(searchXml, { searchDate });
    const { reconciliation, supplierConflicts } = reconcileRezgoItemsAcrossSurfaces({
      items,
      companyName,
      searchDate,
    });

    return {
      ok: true,
      readOnly: true,
      mutatedRemoteState: false,
      isolatedSecondaryProperty: true,
      checkedAt,
      searchDate,
      status: "inspected_ok",
      companyName,
      domain,
      currency,
      itemsCount: items.length,
      items,
      reconciliation,
      supplierConflicts,
      writeCapabilitiesDisabled,
      errorMessage: null,
    };
  } catch (err) {
    const rawErr =
      err instanceof Error ? err.message : "Read-only Rezgo request failed.";
    const safeError =
      sanitizeRezgoDiagnosticMessage(rawErr, [cid, apiKey]) ||
      "Read-only Rezgo request failed.";
    const { supplierConflicts } = reconcileRezgoItemsAcrossSurfaces({
      items: [],
      companyName: null,
      searchDate,
    });
    return {
      ok: false,
      readOnly: true,
      mutatedRemoteState: false,
      isolatedSecondaryProperty: true,
      checkedAt,
      searchDate,
      status: "network_error",
      companyName: null,
      domain: null,
      currency: null,
      itemsCount: 0,
      items: [],
      reconciliation: [],
      supplierConflicts,
      writeCapabilitiesDisabled,
      errorMessage: safeError,
    };
  }
}

interface CachedInspectionEntry {
  cachedAtIso: string;
  expiresAtMs: number;
  ttlSeconds: number;
  result: RezgoReadOnlyInspectionResult;
}

export const MAX_REZGO_CACHE_ENTRIES = 64;

const rezgoReadOnlyCache = new Map<string, CachedInspectionEntry>();
const rezgoInFlightRequests = new Map<string, Promise<RezgoReadOnlyInspectionResult>>();
const rezgoNormalizedProductCache = new Map<
  string,
  {
    cachedAtIso: string;
    expiresAtMs: number;
    ttlSeconds: number;
    tour: NormalizedJuneauSupplierTour;
  }
>();

function setBoundedMapEntry<V>(map: Map<string, V>, key: string, value: V, maxEntries: number): void {
  if (map.has(key)) {
    map.delete(key);
  }
  map.set(key, value);
  while (map.size > maxEntries) {
    const oldestKey = map.keys().next().value;
    if (oldestKey === undefined) break;
    map.delete(oldestKey);
  }
}

export function clearRezgoReadOnlyCacheForTesting(): void {
  rezgoReadOnlyCache.clear();
  rezgoInFlightRequests.clear();
  rezgoNormalizedProductCache.clear();
}

export function getRezgoReadOnlyCacheStatsForTesting(): {
  inspectionEntries: number;
  productEntries: number;
  maxEntries: number;
} {
  return {
    inspectionEntries: rezgoReadOnlyCache.size,
    productEntries: rezgoNormalizedProductCache.size,
    maxEntries: MAX_REZGO_CACHE_ENTRIES,
  };
}

export async function getCachedSereneRezgoInspectionWithMeta(options?: {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  operatorId?: "juneau-tours-whale-watch";
  productKey?: string | null;
  searchDate?: string;
  ttlMs?: number;
  bypassCache?: boolean;
}): Promise<{
  result: RezgoReadOnlyInspectionResult;
  cacheMeta: {
    operatorKey: "juneau-tours-whale-watch";
    productKey: string;
    serviceDateKey: string;
    cacheKey: string;
    maxEntriesBound: number;
    cacheStatus: "hit" | "miss_fresh" | "bypassed";
    cachedAt: string;
    expiresAt: string;
    ttlSeconds: number;
  };
}> {
  const operatorKey = options?.operatorId || "juneau-tours-whale-watch";
  const normalizedProductKey = (options?.productKey || "all").trim().toUpperCase() || "all";
  const serviceDateKey =
    options?.searchDate && /^\d{4}-\d{2}-\d{2}$/.test(options.searchDate.trim())
      ? options.searchDate.trim()
      : "catalog";
  // Upstream Rezgo i=search returns the operator's full day catalog in one XML payload,
  // so we key upstream XML fetches by operator + serviceDate (while also bounding per-product
  // normalized slices by operator + product + serviceDate) to prevent duplicate Rezgo hits.
  const upstreamCacheKey = `rezgo:${operatorKey}:service-date:${serviceDateKey}`;
  const logicalCacheKey = `rezgo:${operatorKey}:${normalizedProductKey}:${serviceDateKey}`;
  const useCache = !options?.bypassCache;
  const now = Date.now();

  if (useCache) {
    const existing = rezgoReadOnlyCache.get(upstreamCacheKey);
    if (existing && existing.expiresAtMs > now) {
      // Refresh LRU position
      setBoundedMapEntry(rezgoReadOnlyCache, upstreamCacheKey, existing, MAX_REZGO_CACHE_ENTRIES);
      return {
        result: existing.result,
        cacheMeta: {
          operatorKey,
          productKey: normalizedProductKey,
          serviceDateKey,
          cacheKey: logicalCacheKey,
          maxEntriesBound: MAX_REZGO_CACHE_ENTRIES,
          cacheStatus: "hit",
          cachedAt: existing.cachedAtIso,
          expiresAt: new Date(existing.expiresAtMs).toISOString(),
          ttlSeconds: existing.ttlSeconds,
        },
      };
    }

    const inFlight = rezgoInFlightRequests.get(upstreamCacheKey);
    if (inFlight) {
      const sharedResult = await inFlight;
      const populated = rezgoReadOnlyCache.get(upstreamCacheKey);
      const ttlSeconds = populated?.ttlSeconds ?? (sharedResult.ok ? 180 : 30);
      const cachedAt = populated?.cachedAtIso ?? sharedResult.checkedAt;
      const expiresAt = populated
        ? new Date(populated.expiresAtMs).toISOString()
        : new Date(Date.now() + ttlSeconds * 1000).toISOString();
      return {
        result: sharedResult,
        cacheMeta: {
          operatorKey,
          productKey: normalizedProductKey,
          serviceDateKey,
          cacheKey: logicalCacheKey,
          maxEntriesBound: MAX_REZGO_CACHE_ENTRIES,
          cacheStatus: "hit",
          cachedAt,
          expiresAt,
          ttlSeconds,
        },
      };
    }
  }

  const fetchPromise = inspectSereneRezgoInventoryReadOnly({
    env: options?.env,
    fetchImpl: options?.fetchImpl,
    searchDate: serviceDateKey === "catalog" ? undefined : serviceDateKey,
  });

  if (useCache) {
    rezgoInFlightRequests.set(upstreamCacheKey, fetchPromise);
  }

  let result: RezgoReadOnlyInspectionResult;
  try {
    result = await fetchPromise;
  } finally {
    if (useCache) {
      rezgoInFlightRequests.delete(upstreamCacheKey);
    }
  }

  const ttlMs =
    typeof options?.ttlMs === "number" && Number.isFinite(options.ttlMs)
      ? Math.max(5_000, options.ttlMs)
      : result.ok
        ? 180_000
        : 30_000;
  const ttlSeconds = Math.round(ttlMs / 1000);
  const cachedAtMs = Date.now();
  const cachedAtIso = new Date(cachedAtMs).toISOString();
  const expiresAtMs = cachedAtMs + ttlMs;

  if (useCache) {
    setBoundedMapEntry(
      rezgoReadOnlyCache,
      upstreamCacheKey,
      {
        cachedAtIso,
        expiresAtMs,
        ttlSeconds,
        result,
      },
      MAX_REZGO_CACHE_ENTRIES,
    );
  }

  return {
    result,
    cacheMeta: {
      operatorKey,
      productKey: normalizedProductKey,
      serviceDateKey,
      cacheKey: logicalCacheKey,
      maxEntriesBound: MAX_REZGO_CACHE_ENTRIES,
      cacheStatus: useCache ? "miss_fresh" : "bypassed",
      cachedAt: cachedAtIso,
      expiresAt: new Date(expiresAtMs).toISOString(),
      ttlSeconds,
    },
  };
}

export async function getCachedSereneRezgoInspection(options?: {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  searchDate?: string;
  ttlMs?: number;
  bypassCache?: boolean;
}): Promise<RezgoReadOnlyInspectionResult> {
  const { result } = await getCachedSereneRezgoInspectionWithMeta(options);
  return result;
}

function parseClockToSeconds(clock: string | null | undefined): number | null {
  if (!clock) return null;
  const normalized = normalizeRezgoClockTime(clock);
  if (!normalized) return null;
  const m = normalized.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  const ss = Number(m[3] || "0");
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59 || ss < 0 || ss > 59) return null;
  return hh * 3600 + mm * 60 + ss;
}

function formatSecondsAsClockHhMm(totalSeconds: number): string {
  const clamped = ((Math.floor(totalSeconds / 60) % 1440) + 1440) % 1440;
  const hh = Math.floor(clamped / 60);
  const mm = clamped % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function formatRemainingBufferHms(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Evaluates a Rezgo departure option against an optional ship arrival / all-aboard window.
 *
 * Architectural Safeguards:
 * - Rezgo's `<cutoff>` (e.g. `2.00` hours) is a SUPPLIER BOOKING CUTOFF and is NEVER used here.
 * - DCC's separate rule requires at least `1:59:59` (`7,199` seconds) before the ship's confirmed
 *   all-aboard time for a normally recommended excursion.
 * - Confirmed Juneau Tours Rezgo products (`durationScope: "dock_to_dock"`) already include
 *   outbound operator transportation, the activity, and return transportation to the dock /
 *   advertised cruise pickup area. Their estimated dock return is `departureTime + publishedDuration`
 *   with ZERO duplicate Auke Bay / Mendenhall transfer added, plus an additional berth-access
 *   adjustment ONLY when a documented specific-berth adjustment is explicitly passed.
 * - Options outside `[shipArrivalTime, shipAllAboardTime]` are blocked (`blockedForSailingWindow: true`).
 * - Options returning inside the window with `< 1:59:59` remaining display the exact `H:MM:SS`
 *   remaining buffer and are labeled reduced-buffer / not recommended.
 */
export function assessRezgoDepartureAgainstShipWindow(params: {
  departureTime: string;
  durationMinutes: number | null;
  shipArrivalTime?: string | null;
  shipAllAboardTime?: string | null;
  allAboardConfirmed?: boolean;
  durationScope?: JuneauTourDurationScope;
  documentedBerthPickupMinutes?: number | null;
  documentedBerthReturnMinutes?: number | null;
  confirmedReturnTransferMinutes?: number | null;
  hasConfirmedMeetingPoint?: boolean;
}): RezgoOptionSailingWindowAssessment {
  const depSec = parseClockToSeconds(params.departureTime);
  const arrSec = parseClockToSeconds(params.shipArrivalTime);
  const allAboardSec = parseClockToSeconds(params.shipAllAboardTime);
  const allAboardConfirmed = Boolean(params.allAboardConfirmed && allAboardSec !== null);
  const normArr = arrSec !== null ? formatSecondsAsClockHhMm(arrSec) : null;
  const normAllAboard = allAboardSec !== null ? formatSecondsAsClockHhMm(allAboardSec) : null;
  const isDockToDock = params.durationScope === "dock_to_dock";

  const documentedBerthPickupMinutes =
    typeof params.documentedBerthPickupMinutes === "number" &&
    Number.isFinite(params.documentedBerthPickupMinutes) &&
    params.documentedBerthPickupMinutes > 0
      ? Math.round(params.documentedBerthPickupMinutes)
      : 0;
  const documentedBerthReturnMinutes =
    typeof params.documentedBerthReturnMinutes === "number" &&
    Number.isFinite(params.documentedBerthReturnMinutes) &&
    params.documentedBerthReturnMinutes > 0
      ? Math.round(params.documentedBerthReturnMinutes)
      : 0;

  const hasConfirmedTransfer =
    typeof params.confirmedReturnTransferMinutes === "number" &&
    Number.isFinite(params.confirmedReturnTransferMinutes) &&
    params.confirmedReturnTransferMinutes >= 0;
  const meetingPointAndReturnConfirmed = Boolean(
    allAboardConfirmed &&
      (isDockToDock || (params.hasConfirmedMeetingPoint === true && hasConfirmedTransfer)),
  );

  if (depSec === null || params.durationMinutes === null || params.durationMinutes <= 0) {
    return {
      departureTime: params.departureTime,
      shipArrivalTime: normArr,
      shipAllAboardTime: normAllAboard,
      allAboardConfirmed,
      meetingPointAndReturnConfirmed: false,
      durationScope: params.durationScope ?? "activity_only_unverified",
      estimatedDockReturnTime: null,
      documentedBerthPickupMinutesApplied: documentedBerthPickupMinutes,
      documentedBerthReturnMinutesApplied: documentedBerthReturnMinutes,
      estimatedTourEndWithoutTransferTime: null,
      upperBoundRemainingSecondsBeforeTransfer: null,
      upperBoundRemainingBufferHmsLabel: null,
      status: "unverified_cruise_timing_pending_transfer_and_pickup",
      blockedForSailingWindow: false,
      displayLabel:
        "Needs verification — live operator availability · Cruise-safe timing unverified (duration, meeting point & return transfer pending)",
    };
  }

  const endWithoutTransferSec = depSec + params.durationMinutes * 60;
  const endClock = formatSecondsAsClockHhMm(endWithoutTransferSec);
  const earliestReachablePickupSec =
    arrSec !== null ? arrSec + documentedBerthPickupMinutes * 60 : null;

  if (earliestReachablePickupSec !== null && depSec < earliestReachablePickupSec) {
    const earliestClock = formatSecondsAsClockHhMm(earliestReachablePickupSec);
    return {
      departureTime: params.departureTime,
      shipArrivalTime: normArr,
      shipAllAboardTime: normAllAboard,
      allAboardConfirmed,
      meetingPointAndReturnConfirmed,
      durationScope: params.durationScope ?? "activity_only_unverified",
      estimatedDockReturnTime: isDockToDock ? endClock : null,
      documentedBerthPickupMinutesApplied: documentedBerthPickupMinutes,
      documentedBerthReturnMinutesApplied: documentedBerthReturnMinutes,
      estimatedTourEndWithoutTransferTime: endClock,
      upperBoundRemainingSecondsBeforeTransfer:
        allAboardSec !== null ? allAboardSec - endWithoutTransferSec : null,
      upperBoundRemainingBufferHmsLabel: null,
      status: "outside_sailing_window_blocked",
      blockedForSailingWindow: true,
      displayLabel:
        documentedBerthPickupMinutes > 0
          ? `Outside ship window — blocked (departs ${params.departureTime} before passenger pickup reachability ${earliestClock})`
          : `Outside ship window — blocked (departs ${params.departureTime} before ship arrival ${normArr})`,
    };
  }

  if (isDockToDock) {
    const berthReturnSec = documentedBerthReturnMinutes * 60;
    const effectiveDockReturnSec = endWithoutTransferSec + berthReturnSec;
    const effectiveDockReturnClock = formatSecondsAsClockHhMm(effectiveDockReturnSec);

    if (allAboardConfirmed && allAboardSec !== null) {
      const shipBufferSec = allAboardSec - effectiveDockReturnSec;
      if (shipBufferSec <= 0) {
        return {
          departureTime: params.departureTime,
          shipArrivalTime: normArr,
          shipAllAboardTime: normAllAboard,
          allAboardConfirmed: true,
          meetingPointAndReturnConfirmed: true,
          durationScope: "dock_to_dock",
          estimatedDockReturnTime: endClock,
          documentedBerthPickupMinutesApplied: documentedBerthPickupMinutes,
          documentedBerthReturnMinutesApplied: documentedBerthReturnMinutes,
          estimatedTourEndWithoutTransferTime: endClock,
          upperBoundRemainingSecondsBeforeTransfer: shipBufferSec,
          upperBoundRemainingBufferHmsLabel: "0:00:00",
          status: "outside_sailing_window_blocked",
          blockedForSailingWindow: true,
          displayLabel: `Outside ship window — blocked (returns ~${effectiveDockReturnClock} at/after ${normAllAboard} all-aboard)`,
        };
      }

      const exactHms = formatRemainingBufferHms(shipBufferSec);
      if (shipBufferSec < 7199) {
        return {
          departureTime: params.departureTime,
          shipArrivalTime: normArr,
          shipAllAboardTime: normAllAboard,
          allAboardConfirmed: true,
          meetingPointAndReturnConfirmed: true,
          durationScope: "dock_to_dock",
          estimatedDockReturnTime: endClock,
          documentedBerthPickupMinutesApplied: documentedBerthPickupMinutes,
          documentedBerthReturnMinutesApplied: documentedBerthReturnMinutes,
          estimatedTourEndWithoutTransferTime: endClock,
          upperBoundRemainingSecondsBeforeTransfer: shipBufferSec,
          upperBoundRemainingBufferHmsLabel: exactHms,
          status: "reduced_buffer_not_recommended",
          blockedForSailingWindow: false,
          displayLabel: `${exactHms} buffer · Not recommended`,
        };
      }

      return {
        departureTime: params.departureTime,
        shipArrivalTime: normArr,
        shipAllAboardTime: normAllAboard,
        allAboardConfirmed: true,
        meetingPointAndReturnConfirmed: true,
        durationScope: "dock_to_dock",
        estimatedDockReturnTime: endClock,
        documentedBerthPickupMinutesApplied: documentedBerthPickupMinutes,
        documentedBerthReturnMinutesApplied: documentedBerthReturnMinutes,
        estimatedTourEndWithoutTransferTime: endClock,
        upperBoundRemainingSecondsBeforeTransfer: shipBufferSec,
        upperBoundRemainingBufferHmsLabel: exactHms,
        status: "recommended",
        blockedForSailingWindow: false,
        displayLabel: "Estimated back 2+ hours before all aboard",
      };
    }

    if (allAboardSec !== null) {
      const unconfirmedRemainingSec = allAboardSec - effectiveDockReturnSec;
      if (unconfirmedRemainingSec <= 0) {
        return {
          departureTime: params.departureTime,
          shipArrivalTime: normArr,
          shipAllAboardTime: normAllAboard,
          allAboardConfirmed: false,
          meetingPointAndReturnConfirmed: false,
          durationScope: "dock_to_dock",
          estimatedDockReturnTime: endClock,
          documentedBerthPickupMinutesApplied: documentedBerthPickupMinutes,
          documentedBerthReturnMinutesApplied: documentedBerthReturnMinutes,
          estimatedTourEndWithoutTransferTime: endClock,
          upperBoundRemainingSecondsBeforeTransfer: unconfirmedRemainingSec,
          upperBoundRemainingBufferHmsLabel: "0:00:00",
          status: "outside_sailing_window_blocked",
          blockedForSailingWindow: true,
          displayLabel: `Outside ship window — blocked (returns ~${effectiveDockReturnClock} at/after ${normAllAboard} all-aboard)`,
        };
      }

      const exactHms = formatRemainingBufferHms(unconfirmedRemainingSec);
      if (unconfirmedRemainingSec < 7199) {
        return {
          departureTime: params.departureTime,
          shipArrivalTime: normArr,
          shipAllAboardTime: normAllAboard,
          allAboardConfirmed: false,
          meetingPointAndReturnConfirmed: false,
          durationScope: "dock_to_dock",
          estimatedDockReturnTime: endClock,
          documentedBerthPickupMinutesApplied: documentedBerthPickupMinutes,
          documentedBerthReturnMinutesApplied: documentedBerthReturnMinutes,
          estimatedTourEndWithoutTransferTime: endClock,
          upperBoundRemainingSecondsBeforeTransfer: unconfirmedRemainingSec,
          upperBoundRemainingBufferHmsLabel: exactHms,
          status: "reduced_buffer_not_recommended",
          blockedForSailingWindow: false,
          displayLabel: `${exactHms} buffer · Not recommended`,
        };
      }
    }

    return {
      departureTime: params.departureTime,
      shipArrivalTime: normArr,
      shipAllAboardTime: normAllAboard,
      allAboardConfirmed: false,
      meetingPointAndReturnConfirmed: false,
      durationScope: "dock_to_dock",
      estimatedDockReturnTime: endClock,
      documentedBerthPickupMinutesApplied: documentedBerthPickupMinutes,
      documentedBerthReturnMinutesApplied: documentedBerthReturnMinutes,
      estimatedTourEndWithoutTransferTime: endClock,
      upperBoundRemainingSecondsBeforeTransfer:
        allAboardSec !== null ? allAboardSec - effectiveDockReturnSec : null,
      upperBoundRemainingBufferHmsLabel:
        allAboardSec !== null
          ? formatRemainingBufferHms(allAboardSec - effectiveDockReturnSec)
          : null,
      status: "unverified_cruise_timing_pending_transfer_and_pickup",
      blockedForSailingWindow: false,
      displayLabel: "Confirm return timing",
    };
  }

  if (meetingPointAndReturnConfirmed && allAboardSec !== null) {
    const returnTransferSec = Math.round((params.confirmedReturnTransferMinutes || 0) * 60);
    const backAtPierSec = endWithoutTransferSec + returnTransferSec;
    const backAtPierClock = formatSecondsAsClockHhMm(backAtPierSec);
    const remainingAfterTransferSec = allAboardSec - backAtPierSec;
    if (remainingAfterTransferSec <= 0) {
      return {
        departureTime: params.departureTime,
        shipArrivalTime: normArr,
        shipAllAboardTime: normAllAboard,
        allAboardConfirmed: true,
        meetingPointAndReturnConfirmed: true,
        durationScope: "activity_only_unverified",
        estimatedDockReturnTime: backAtPierClock,
        documentedBerthPickupMinutesApplied: documentedBerthPickupMinutes,
        documentedBerthReturnMinutesApplied: documentedBerthReturnMinutes,
        estimatedTourEndWithoutTransferTime: endClock,
        upperBoundRemainingSecondsBeforeTransfer: remainingAfterTransferSec,
        upperBoundRemainingBufferHmsLabel: "0:00:00",
        status: "outside_sailing_window_blocked",
        blockedForSailingWindow: true,
        displayLabel: `Outside ship window — blocked (returns ~${backAtPierClock} at/after ${normAllAboard} all-aboard)`,
      };
    }

    const exactConfirmedHms = formatRemainingBufferHms(remainingAfterTransferSec);
    if (remainingAfterTransferSec < 7199) {
      return {
        departureTime: params.departureTime,
        shipArrivalTime: normArr,
        shipAllAboardTime: normAllAboard,
        allAboardConfirmed: true,
        meetingPointAndReturnConfirmed: true,
        durationScope: "activity_only_unverified",
        estimatedDockReturnTime: backAtPierClock,
        documentedBerthPickupMinutesApplied: documentedBerthPickupMinutes,
        documentedBerthReturnMinutesApplied: documentedBerthReturnMinutes,
        estimatedTourEndWithoutTransferTime: endClock,
        upperBoundRemainingSecondsBeforeTransfer: remainingAfterTransferSec,
        upperBoundRemainingBufferHmsLabel: exactConfirmedHms,
        status: "reduced_buffer_not_recommended",
        blockedForSailingWindow: false,
        displayLabel: `Reduced buffer (${exactConfirmedHms} remaining) — not recommended`,
      };
    }

    return {
      departureTime: params.departureTime,
      shipArrivalTime: normArr,
      shipAllAboardTime: normAllAboard,
      allAboardConfirmed: true,
      meetingPointAndReturnConfirmed: true,
      durationScope: "activity_only_unverified",
      estimatedDockReturnTime: backAtPierClock,
      documentedBerthPickupMinutesApplied: documentedBerthPickupMinutes,
      documentedBerthReturnMinutesApplied: documentedBerthReturnMinutes,
      estimatedTourEndWithoutTransferTime: endClock,
      upperBoundRemainingSecondsBeforeTransfer: remainingAfterTransferSec,
      upperBoundRemainingBufferHmsLabel: exactConfirmedHms,
      status: "recommended",
      blockedForSailingWindow: false,
      displayLabel: "Estimated back 2+ hours before all aboard",
    };
  }

  if (allAboardSec !== null) {
    const remainingSec = allAboardSec - endWithoutTransferSec;
    if (remainingSec <= 0) {
      return {
        departureTime: params.departureTime,
        shipArrivalTime: normArr,
        shipAllAboardTime: normAllAboard,
        allAboardConfirmed,
        meetingPointAndReturnConfirmed: false,
        durationScope: "activity_only_unverified",
        estimatedDockReturnTime: null,
        documentedBerthPickupMinutesApplied: documentedBerthPickupMinutes,
        documentedBerthReturnMinutesApplied: documentedBerthReturnMinutes,
        estimatedTourEndWithoutTransferTime: endClock,
        upperBoundRemainingSecondsBeforeTransfer: remainingSec,
        upperBoundRemainingBufferHmsLabel: "0:00:00",
        status: "outside_sailing_window_blocked",
        blockedForSailingWindow: true,
        displayLabel: `Outside ship window — blocked (activity ends ~${endClock} before pier transfer, at/after ${normAllAboard} all-aboard)`,
      };
    }

    const exactHms = formatRemainingBufferHms(remainingSec);
    if (remainingSec < 7199) {
      return {
        departureTime: params.departureTime,
        shipArrivalTime: normArr,
        shipAllAboardTime: normAllAboard,
        allAboardConfirmed,
        meetingPointAndReturnConfirmed: false,
        durationScope: "activity_only_unverified",
        estimatedDockReturnTime: null,
        documentedBerthPickupMinutesApplied: documentedBerthPickupMinutes,
        documentedBerthReturnMinutesApplied: documentedBerthReturnMinutes,
        estimatedTourEndWithoutTransferTime: endClock,
        upperBoundRemainingSecondsBeforeTransfer: remainingSec,
        upperBoundRemainingBufferHmsLabel: exactHms,
        status: "reduced_buffer_not_recommended",
        blockedForSailingWindow: false,
        displayLabel: `Reduced buffer (${exactHms} remaining before ${normAllAboard} all-aboard, excluding unconfirmed pier return transfer) — not recommended · Needs verification (Cruise-safe timing unverified)`,
      };
    }

    return {
      departureTime: params.departureTime,
      shipArrivalTime: normArr,
      shipAllAboardTime: normAllAboard,
      allAboardConfirmed,
      meetingPointAndReturnConfirmed: false,
      durationScope: "activity_only_unverified",
      estimatedDockReturnTime: null,
      documentedBerthPickupMinutesApplied: documentedBerthPickupMinutes,
      documentedBerthReturnMinutesApplied: documentedBerthReturnMinutes,
      estimatedTourEndWithoutTransferTime: endClock,
      upperBoundRemainingSecondsBeforeTransfer: remainingSec,
      upperBoundRemainingBufferHmsLabel: exactHms,
      status: "unverified_cruise_timing_pending_transfer_and_pickup",
      blockedForSailingWindow: false,
      displayLabel: `Needs verification — live operator availability (${exactHms} max clock margin before ${normAllAboard} all-aboard; missing confirmed meeting-point & return-transfer evidence; never treated as cruise-safe) · Cruise-safe timing unverified`,
    };
  }

  return {
    departureTime: params.departureTime,
    shipArrivalTime: normArr,
    shipAllAboardTime: null,
    allAboardConfirmed: false,
    meetingPointAndReturnConfirmed: false,
    durationScope: "activity_only_unverified",
    estimatedDockReturnTime: null,
    documentedBerthPickupMinutesApplied: documentedBerthPickupMinutes,
    documentedBerthReturnMinutesApplied: documentedBerthReturnMinutes,
    estimatedTourEndWithoutTransferTime: endClock,
    upperBoundRemainingSecondsBeforeTransfer: null,
    upperBoundRemainingBufferHmsLabel: null,
    status: "unverified_cruise_timing_pending_transfer_and_pickup",
    blockedForSailingWindow: false,
    displayLabel:
      "Needs verification — live operator availability (missing confirmed ship all-aboard, meeting-point & return-transfer evidence; never treated as cruise-safe) · Cruise-safe timing unverified",
  };
}

function buildJuneauRezgoDccCommerceWrapperHref(params: {
  canonicalViatorUrl: string;
  matchedCode: string;
  optionRef: string;
  serviceDate: string | null;
}): string {
  const attributedTargetUrl = appendViatorAttribution(params.canonicalViatorUrl, {
    pid: "P00306962",
    mcid: "42383",
    medium: "link",
    campaign: `dcc-juneau-rezgo-fallback-${params.matchedCode.toLowerCase()}`,
  });
  const wrapper = new URL("https://www.destinationcommandcenter.com/go/out");
  wrapper.searchParams.set("u", attributedTargetUrl);
  wrapper.searchParams.set("originatingSite", "destinationcommandcenter.com");
  wrapper.searchParams.set("surface", "dcc_juneau_rezgo_live_availability");
  wrapper.searchParams.set("port", "juneau");
  wrapper.searchParams.set("product", params.matchedCode);
  wrapper.searchParams.set("option", params.optionRef);
  if (params.serviceDate) {
    wrapper.searchParams.set("date", params.serviceDate);
  }
  wrapper.searchParams.set(
    "trackingTag",
    `dcc_juneau_rezgo_fallback_${params.matchedCode.toLowerCase()}_${params.optionRef.toLowerCase()}`,
  );
  return wrapper.toString();
}

function classifyJuneauTourActivity(
  title: string,
  optionName: string | null,
): NormalizedJuneauSupplierTour["activityCategory"] {
  const text = `${title} ${optionName || ""}`.toLowerCase();
  const hasWhale = /whale/i.test(text);
  const hasGlacier = /mendenhall|glacier/i.test(text);
  if (hasWhale && hasGlacier) return "combo-whale-glacier";
  if (hasWhale) return "whale-watching";
  if (hasGlacier || /shuttle|trolley|blue bus/i.test(text)) return "mendenhall-glacier-tours";
  return "juneau-sightseeing";
}

export async function buildNormalizedJuneauSupplierFeed(options?: {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  searchDate?: string;
  productFilter?: string | null;
  shipArrivalTime?: string | null;
  shipAllAboardTime?: string | null;
  allAboardConfirmed?: boolean;
  ttlMs?: number;
  bypassCache?: boolean;
}): Promise<NormalizedJuneauSupplierFeed> {
  const { result: inspection, cacheMeta } = await getCachedSereneRezgoInspectionWithMeta({
    env: options?.env,
    fetchImpl: options?.fetchImpl,
    operatorId: "juneau-tours-whale-watch",
    productKey: options?.productFilter ?? null,
    searchDate: options?.searchDate,
    ttlMs: options?.ttlMs,
    bypassCache: options?.bypassCache,
  });

  const reconciliations = inspection.reconciliation || [];
  const recByUidAndOption = new Map<string, RezgoProductCrossSurfaceReconciliation>();
  for (const r of reconciliations) {
    recByUidAndOption.set(`${r.rezgoUid}|${r.rezgoOptionName || ""}`, r);
  }

  // Consolidate per-departure option UIDs by parent Rezgo product (`com` + `itemName`)
  // so downstream consumers (Last Frontier Shore Excursions) receive one clean normalized
  // product per tour with all scheduled departure times, UIDs, and aggregate spot counts.
  const grouped = new Map<
    string,
    {
      primaryUid: string;
      com: string | null;
      optionUids: string[];
      rawItems: RezgoInspectedItemSummary[];
      title: string;
      optionLabels: string[];
      durationLabel: string | null;
      durationMinutes: number | null;
      adultPrices: number[];
      childPrices: number[];
      currency: string;
      departureSet: Set<string>;
      startingLocation: string | null;
      spotsList: number[];
      overallList: number[];
      cutoffHoursList: number[];
      rec: RezgoProductCrossSurfaceReconciliation | undefined;
    }
  >();

  for (let idx = 0; idx < inspection.items.length; idx++) {
    const item = inspection.items[idx];
    const rec = recByUidAndOption.get(`${item.uid}|${item.optionName || ""}`);
    const groupKey = `${item.com || item.uid}|${item.itemName}`;
    let entry = grouped.get(groupKey);
    if (!entry) {
      entry = {
        primaryUid: item.com || item.uid || String(idx + 1),
        com: item.com,
        optionUids: [],
        rawItems: [],
        title: item.itemName,
        optionLabels: [],
        durationLabel: item.duration,
        durationMinutes: item.durationMinutes ?? null,
        adultPrices: [],
        childPrices: [],
        currency: item.currency || inspection.currency || "USD",
        departureSet: new Set<string>(),
        startingLocation: item.startingLocation,
        spotsList: [],
        overallList: [],
        cutoffHoursList: [],
        rec,
      };
      grouped.set(groupKey, entry);
    }
    entry.rawItems.push(item);
    if (item.uid && !entry.optionUids.includes(item.uid)) {
      entry.optionUids.push(item.uid);
    }
    if (item.optionName && !entry.optionLabels.includes(item.optionName)) {
      entry.optionLabels.push(item.optionName);
    }
    const adultNum = parsePositivePrice(item.adultPrice);
    if (adultNum !== null) entry.adultPrices.push(adultNum);
    const childNum = parsePositivePrice(item.childPrice);
    if (childNum !== null) entry.childPrices.push(childNum);
    for (const dep of item.departureTimes || (item.departureTime ? [item.departureTime] : [])) {
      if (dep) entry.departureSet.add(dep);
    }
    if (!entry.startingLocation && item.startingLocation) {
      entry.startingLocation = item.startingLocation;
    }
    if (item.availableSpotsOnSearchDate !== undefined && item.availableSpotsOnSearchDate !== null) {
      entry.spotsList.push(item.availableSpotsOnSearchDate);
    }
    if (item.availabilityOverall !== undefined && item.availabilityOverall !== null) {
      entry.overallList.push(item.availabilityOverall);
    }
    if (typeof item.supplierBookingCutoffHours === "number" && Number.isFinite(item.supplierBookingCutoffHours)) {
      entry.cutoffHoursList.push(item.supplierBookingCutoffHours);
    }
  }

  const normalizedFilter = (options?.productFilter || "").trim().toUpperCase();
  const hasWindowInputs = Boolean(options?.shipArrivalTime || options?.shipAllAboardTime);
  const nowMs = Date.now();

  const allNormalizedTours: NormalizedJuneauSupplierTour[] = Array.from(grouped.values()).map(
    (entry) => {
      const matchedCode = entry.rec?.matchedDccCatalogProductCode ?? null;
      const productSliceKey = `rezgo:juneau-tours-whale-watch:${matchedCode || entry.com || entry.primaryUid}:${cacheMeta.serviceDateKey}`;

      if (!options?.bypassCache && !hasWindowInputs) {
        const cachedSlice = rezgoNormalizedProductCache.get(productSliceKey);
        if (cachedSlice && cachedSlice.expiresAtMs > nowMs) {
          setBoundedMapEntry(
            rezgoNormalizedProductCache,
            productSliceKey,
            cachedSlice,
            MAX_REZGO_CACHE_ENTRIES,
          );
          return cachedSlice.tour;
        }
      }

      const approvedSpec = matchedCode ? APPROVED_JUNEAU_5857_VIATOR_CATALOG[matchedCode] : null;
      const effectiveDurationMinutes = entry.durationMinutes ?? approvedSpec?.durationMinutes ?? null;
      const sortedDepartures = Array.from(entry.departureSet).sort();
      const resolvedServiceDate = inspection.searchDate ?? null;
      const provenance = resolveJuneauToursDockToDockProvenance({
        operatorId: "juneau-tours-whale-watch",
        rezgoCom: entry.com,
        matchedViatorProductCode: matchedCode,
        verifiedRezgoDomain: inspection.domain,
        verifiedRezgoCompanyName: inspection.companyName,
        title: entry.title,
      });

      const assessments = sortedDepartures.map((dep) =>
        assessRezgoDepartureAgainstShipWindow({
          departureTime: dep,
          durationMinutes: effectiveDurationMinutes,
          shipArrivalTime: options?.shipArrivalTime,
          shipAllAboardTime: options?.shipAllAboardTime,
          allAboardConfirmed: options?.allAboardConfirmed,
          durationScope: provenance.durationScope,
        }),
      );
      const assessmentByDep = new Map(assessments.map((a) => [a.departureTime, a]));

      const allowedDepartures = assessments
        .filter((a) => !a.blockedForSailingWindow)
        .map((a) => a.departureTime);
      const blockedOutsideWindowDepartures = assessments
        .filter((a) => a.blockedForSailingWindow)
        .map((a) => a.departureTime);

      const departureOptions: NormalizedJuneauDepartureOption[] = entry.rawItems.map((rawItem, rawIdx) => {
        const rawDeps =
          rawItem.departureTimes && rawItem.departureTimes.length > 0
            ? rawItem.departureTimes
            : rawItem.departureTime
              ? [rawItem.departureTime]
              : [];
        const normalizedDep =
          rawDeps.length > 0
            ? normalizeRezgoClockTime(rawDeps[0]) || rawDeps[0]
            : normalizeRezgoClockTime(rawItem.optionName);
        const itemDuration = rawItem.durationMinutes ?? effectiveDurationMinutes;
        const windowAssessment = normalizedDep
          ? assessmentByDep.get(normalizedDep) ??
            assessRezgoDepartureAgainstShipWindow({
              departureTime: normalizedDep,
              durationMinutes: itemDuration,
              shipArrivalTime: options?.shipArrivalTime,
              shipAllAboardTime: options?.shipAllAboardTime,
              allAboardConfirmed: options?.allAboardConfirmed,
              durationScope: provenance.durationScope,
            })
          : null;

        const hasDateSpots =
          rawItem.availableSpotsOnSearchDate !== undefined &&
          rawItem.availableSpotsOnSearchDate !== null;
        const hasOverallSpots =
          rawItem.availabilityOverall !== undefined &&
          rawItem.availabilityOverall !== null;
        const optAvailableSpots = hasDateSpots
          ? rawItem.availableSpotsOnSearchDate!
          : hasOverallSpots
            ? rawItem.availabilityOverall!
            : null;
        const optAvailabilitySemantics: NormalizedJuneauDepartureOption["availabilitySemantics"] =
          hasDateSpots
            ? "rezgo_date_search_spots"
            : hasOverallSpots
              ? "rezgo_catalog_overall"
              : "unconfirmed_check_provider";

        const optionUid = rawItem.uid || `${entry.primaryUid}-${rawIdx + 1}`;
        const optBlocked = Boolean(windowAssessment?.blockedForSailingWindow);
        const optCommerceHref =
          approvedSpec && matchedCode && !optBlocked
            ? buildJuneauRezgoDccCommerceWrapperHref({
                canonicalViatorUrl: approvedSpec.canonicalViatorUrl,
                matchedCode,
                optionRef: optionUid,
                serviceDate: resolvedServiceDate,
              })
            : null;

        return {
          uid: optionUid,
          rezgoCom: rawItem.com ?? entry.com,
          optionName: rawItem.optionName,
          departureTime: normalizedDep,
          availableSpots: optAvailableSpots,
          availabilitySemantics: optAvailabilitySemantics,
          adultPriceUsd: parsePositivePrice(rawItem.adultPrice),
          childPriceUsd: parsePositivePrice(rawItem.childPrice),
          serviceDate: resolvedServiceDate,
          checkedAt: inspection.checkedAt,
          dccCommerceWrapperHref: optCommerceHref,
          windowAssessment,
        };
      });

      departureOptions.sort((a, b) =>
        (a.departureTime || "99:99").localeCompare(b.departureTime || "99:99"),
      );

      const allDeparturesBlocked =
        hasWindowInputs &&
        assessments.length > 0 &&
        allowedDepartures.length === 0 &&
        blockedOutsideWindowDepartures.length > 0;

      const tourCommerceWrapperHref =
        approvedSpec && matchedCode && !allDeparturesBlocked
          ? buildJuneauRezgoDccCommerceWrapperHref({
              canonicalViatorUrl: approvedSpec.canonicalViatorUrl,
              matchedCode,
              optionRef: entry.com || entry.primaryUid,
              serviceDate: resolvedServiceDate,
            })
          : null;

      const resolvedOperatorName = inspection.companyName || "Juneau Tours & Whale Watch";
      const bookingProviderIdentity: JuneauBookingProviderIdentity = {
        operatorId: "juneau-tours-whale-watch",
        operatorName: resolvedOperatorName,
        verifiedRezgoCompanyName: inspection.companyName,
        verifiedRezgoDomain: inspection.domain,
        rezgoCom: entry.com,
        activeCheckoutProvider:
          approvedSpec && matchedCode ? "viator_approved_fallback" : "none_held_pending_mapping",
        fallbackProductCode: approvedSpec && matchedCode ? matchedCode : null,
        liveDirectRezgoCheckoutEnabled: false,
        checkoutDisclosure:
          approvedSpec && matchedCode
            ? `Checkout uses approved Viator/DCC partner fallback (#${matchedCode}) — direct Rezgo checkout is not yet enabled.`
            : "Read-only availability preview — direct Rezgo checkout disabled pending mapping verification.",
      };

      const minAdult =
        entry.adultPrices.length > 0 ? Math.min(...entry.adultPrices) : null;
      const minChild =
        entry.childPrices.length > 0 ? Math.min(...entry.childPrices) : null;
      const totalDateSpots =
        entry.spotsList.length > 0
          ? entry.spotsList.reduce((acc, v) => acc + v, 0)
          : null;
      const totalOverallSpots =
        entry.overallList.length > 0
          ? entry.overallList.reduce((acc, v) => acc + v, 0)
          : null;
      const maxSupplierCutoffHours =
        entry.cutoffHoursList.length > 0 ? Math.max(...entry.cutoffHoursList) : null;

      const optionSummary =
        entry.optionLabels.length === 1
          ? entry.optionLabels[0]
          : entry.optionLabels.length > 1
            ? `${entry.optionLabels.length} daily departure options`
            : null;

      const cutoffSentence =
        maxSupplierCutoffHours !== null
          ? `Operator booking cutoff is ${maxSupplierCutoffHours}h prior to departure (supplier ticket-purchase cutoff only — never DCC's 1:59:59+ cruise-return buffer). `
          : "Operator booking cutoffs apply only to ticket purchase — never DCC's 1:59:59+ cruise-return buffer. ";

      const hasRecommendedAssessment = assessments.some((a) => a.status === "recommended");
      const hasConfirmedWindowForDockToDock =
        provenance.durationScope === "dock_to_dock" &&
        Boolean(options?.allAboardConfirmed && options?.shipAllAboardTime);
      const cruiseTimingVerificationStatus: NormalizedJuneauSupplierTour["cruiseTimingVerificationStatus"] =
        hasConfirmedWindowForDockToDock
          ? "dock_to_dock_confirmed_window_evaluated"
          : provenance.durationScope === "dock_to_dock"
            ? "live_operator_availability_dock_to_dock_pending_ship_all_aboard"
            : "live_operator_availability_only_unverified_cruise_timing";
      const cruiseTimingStatusLabel = hasRecommendedAssessment
        ? "Estimated back 2+ hours before all aboard"
        : hasConfirmedWindowForDockToDock
          ? "Dock-to-dock timing evaluated against confirmed all-aboard"
          : provenance.durationScope === "dock_to_dock"
            ? "Confirm return timing"
            : "Needs verification · Live operator availability · Cruise-safe timing unverified";

      const builtTour: NormalizedJuneauSupplierTour = {
        normalizedTourId: `dcc:rezgo:juneau-tours:${entry.primaryUid}`,
        rezgoUid: entry.optionUids[0] || entry.primaryUid,
        rezgoCom: entry.com,
        optionUids: [...entry.optionUids],
        departureOptions,
        serviceDate: resolvedServiceDate,
        checkedAt: inspection.checkedAt,
        bookingProviderIdentity,
        dccCommerceWrapperHref: tourCommerceWrapperHref,
        operatorId: "juneau-tours-whale-watch",
        operatorName: resolvedOperatorName,
        verifiedRezgoCompanyName: inspection.companyName,
        title: entry.title,
        optionName: optionSummary,
        activityCategory: classifyJuneauTourActivity(entry.title, optionSummary),
        durationLabel: entry.durationLabel,
        durationMinutes: effectiveDurationMinutes,
        durationScope: provenance.durationScope,
        includedOperatorTransportationInPublishedDuration:
          provenance.includedOperatorTransportationInPublishedDuration,
        durationProvenance: provenance.durationProvenance,
        adultPriceUsd: minAdult,
        childPriceUsd: minChild,
        currency: entry.currency,
        departureTimes: allowedDepartures,
        blockedOutsideWindowDepartures,
        startingLocation:
          entry.startingLocation ||
          (provenance.durationScope === "dock_to_dock"
            ? "Downtown Juneau Cruise Docks"
            : null),
        dateChecked: resolvedServiceDate,
        availableSpots: totalDateSpots ?? totalOverallSpots,
        availabilitySemantics:
          totalDateSpots !== null
            ? "rezgo_date_search_spots"
            : totalOverallSpots !== null
              ? "rezgo_catalog_overall"
              : "unconfirmed_check_provider",
        supplierBookingCutoffHours: maxSupplierCutoffHours,
        supplierBookingCutoffSemantics: "supplier_booking_cutoff_only_never_cruise_return_buffer",
        cruiseTimingVerificationStatus,
        cruiseTimingStatusLabel,
        cruiseTimingDisclosure:
          provenance.durationScope === "dock_to_dock"
            ? `${cutoffSentence}${provenance.durationProvenance.provenanceNote}`
            : `${cutoffSentence}Exact meeting points, berth-transfer durations, operator return times, and dock pickup rules remain unconfirmed.`,
        dccRequiredRecommendedReturnBufferSeconds: 7199,
        dccRequiredRecommendedReturnBufferLabel: "1:59:59+ before confirmed all-aboard",
        optionWindowAssessments: assessments,
        cacheKey: productSliceKey,
        matchConfidence: entry.rec?.matchConfidence ?? "unmatched_rezgo_only",
        matchedViatorProductCode: matchedCode,
        approvedFallbackViatorUrl: approvedSpec?.canonicalViatorUrl ?? null,
        liveDirectRezgoCheckoutEnabled: false,
        isolatedSecondaryProperty: true,
        influencesPrimaryDccRanking: false,
      };

      if (!options?.bypassCache && !hasWindowInputs) {
        setBoundedMapEntry(
          rezgoNormalizedProductCache,
          productSliceKey,
          {
            cachedAtIso: cacheMeta.cachedAt,
            expiresAtMs: Date.parse(cacheMeta.expiresAt) || nowMs + cacheMeta.ttlSeconds * 1000,
            ttlSeconds: cacheMeta.ttlSeconds,
            tour: builtTour,
          },
          MAX_REZGO_CACHE_ENTRIES,
        );
      }

      return builtTour;
    },
  );

  const filteredTours = normalizedFilter
    ? allNormalizedTours.filter(
        (t) =>
          (t.rezgoCom && t.rezgoCom.toUpperCase() === normalizedFilter) ||
          t.rezgoUid.toUpperCase() === normalizedFilter ||
          (t.matchedViatorProductCode &&
            t.matchedViatorProductCode.toUpperCase() === normalizedFilter) ||
          t.title.toUpperCase().includes(normalizedFilter),
      )
    : allNormalizedTours;

  return {
    ok: inspection.ok,
    source: inspection.ok ? "dcc_rezgo_readonly_xml" : "dcc_approved_fallback",
    generatedAt: new Date().toISOString(),
    checkedAt: inspection.checkedAt,
    dateChecked: inspection.searchDate ?? null,
    cachePolicy: {
      scope: "operator_product_service_date",
      operatorKey: cacheMeta.operatorKey,
      productKey: cacheMeta.productKey,
      serviceDateKey: cacheMeta.serviceDateKey,
      cacheKey: cacheMeta.cacheKey,
      maxEntriesBound: cacheMeta.maxEntriesBound,
      cacheStatus: cacheMeta.cacheStatus,
      cachedAt: cacheMeta.cachedAt,
      expiresAt: cacheMeta.expiresAt,
      ttlSeconds: cacheMeta.ttlSeconds,
    },
    timingSafetyPolicy: {
      feedClassification: "live_operator_availability_only",
      verifiedCruiseSafeTiming: false,
      supplierCutoffIsNeverCruiseReturnBuffer: true,
      dccRecommendedReturnBufferMinimumSeconds: 7199,
      dccRecommendedReturnBufferLabel: "At least 1:59:59 before ship's confirmed all-aboard time",
      unconfirmedInputs: [
        "exact_meeting_points",
        "berth_transfer_durations",
        "operator_return_times",
        "dock_pickup_rules",
      ],
    },
    readOnly: true,
    liveDirectRezgoCheckoutEnabled: false,
    isolatedSecondaryProperty: true,
    influencesPrimaryDccRanking: false,
    rezgoStatus: inspection.status,
    verifiedCompanyName: inspection.companyName,
    verifiedRezgoDomain: inspection.domain,
    currency: inspection.currency || "USD",
    toursCount: filteredTours.length,
    tours: filteredTours,
    supplierConflicts: inspection.supplierConflicts || [],
  };
}

export type PublicJuneauTimingBucket =
  | "recommended"
  | "confirm_return_timing"
  | "other_available_times"
  | "does_not_fit_ship_day";

export interface PublicJuneauSyncSelection {
  operatorId: "juneau-tours-whale-watch";
  operatorName: string;
  rezgoCom: string | null;
  rezgoUid: string;
  optionCode: string;
  optionTitle: string;
  matchedViatorProductCode: string | null;
  fallbackProductCode: string | null;
  departureTime24: string;
  serviceDate: string | null;
  durationMinutes: number | null;
  startingLocation: string | null;
  adultPriceUsd: number | null;
  currency: string;
  fitStatus:
    | "recommended"
    | "outside_sailing_window_blocked"
    | "reduced_buffer_not_recommended"
    | "unverified_cruise_timing_pending_transfer_and_pickup";
}

export interface PublicJuneauDepartureButton {
  selectionKey: string;
  departureTime24: string;
  timeLabel: string;
  timingBucket: PublicJuneauTimingBucket;
  timingStatusLabel: string;
  reducedBufferHmsLabel: string | null;
  requiresReducedBufferConfirmation: boolean;
  checkoutHref: string | null;
  plannerAddHref: string;
  syncSelection: PublicJuneauSyncSelection;
}

export interface PublicJuneauOutsideWindowTime {
  departureTime24: string;
  timeLabel: string;
}

export interface PublicJuneauTourCardModel {
  cardId: string;
  title: string;
  operatorName: string;
  activityCategory: NormalizedJuneauSupplierTour["activityCategory"];
  durationLabel: string | null;
  durationMinutes: number | null;
  startingAdultPriceUsd: number | null;
  startingPriceLabel: string | null;
  currency: string;
  serviceDate: string | null;
  partySizePrompt: "How many people are going?";
  enteredPartySize: number | null;
  partyAvailabilityLabel: string | null;
  insufficientPartyMessage: string | null;
  hasPositiveAvailabilityBeforePartyFilter: boolean;
  recommendedDepartures: PublicJuneauDepartureButton[];
  confirmTimingDepartures: PublicJuneauDepartureButton[];
  otherAvailableTimes: PublicJuneauDepartureButton[];
  doesNotFitShipDayTimes: PublicJuneauOutsideWindowTime[];
  checkoutAvailable: boolean;
  checkoutCtaLabel: "Book this tour";
  secondaryCheckCtaLabel: "Check availability & book";
  checkoutProviderLabel: string | null;
  addToGroupPlanLabel: "Add to group plan";
}

export interface PublicJuneauLiveAvailabilityView {
  ok: boolean;
  operatorName: string;
  serviceDate: string | null;
  enteredPartySize: number | null;
  partySizePrompt: "How many people are going?";
  shipArrivalTime: string | null;
  shipAllAboardTime: string | null;
  cards: PublicJuneauTourCardModel[];
}

export function formatPublicClockTime12h(rawTime: string | null | undefined): string {
  const norm = normalizeRezgoClockTime(rawTime);
  if (!norm) return rawTime ? String(rawTime).trim() : "TBD";
  const m = norm.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return norm;
  const hour24 = Number(m[1]);
  const minute = m[2];
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute} ${period}`;
}

function buildCruisePromenadeGroupPlanHref(params: {
  title: string;
  operatorName: string;
  operatorId: "juneau-tours-whale-watch";
  serviceDate: string | null;
  departureTime24: string;
  timeLabel: string;
  durationMinutes: number | null;
  durationScope?: JuneauTourDurationScope;
  startingLocation: string | null;
  rezgoCom: string | null;
  rezgoUid: string;
  matchedViatorProductCode: string | null;
  checkoutHref: string | null;
  fitStatus: PublicJuneauSyncSelection["fitStatus"];
  originSurface: "dcc" | "lfse" | "cp";
  relativeForCruisePromenade?: boolean;
}): string {
  const qs = new URLSearchParams();
  qs.set("title", params.title);
  qs.set("optionTitle", `${params.timeLabel} Departure`);
  qs.set("port", "juneau");
  if (params.serviceDate) {
    qs.set("date", params.serviceDate);
    qs.set("serviceDate", params.serviceDate);
  }
  qs.set("startsAt", params.departureTime24);
  if (typeof params.durationMinutes === "number" && params.durationMinutes > 0) {
    qs.set("durationMinutes", String(params.durationMinutes));
  }
  if (params.durationScope === "dock_to_dock") {
    qs.set("durationScope", "dock_to_dock");
    qs.set("returnTransferMinutes", "0");
  }
  qs.set("operator", params.operatorName);
  qs.set("operatorId", params.operatorId);
  qs.set("fitStatus", params.fitStatus);
  qs.set(
    "sourceSite",
    params.originSurface === "lfse"
      ? "lastfrontiershoreexcursions.com"
      : params.originSurface === "cp"
        ? "cruisepromenade.com"
        : "destinationcommandcenter.com",
  );
  if (params.matchedViatorProductCode) {
    qs.set("productCode", params.matchedViatorProductCode);
    qs.set("matchedViatorProductCode", params.matchedViatorProductCode);
    qs.set("fallbackProductCode", params.matchedViatorProductCode);
    qs.set("bookingProviderIdentity", "Checkout via Viator");
  }
  if (params.rezgoCom) qs.set("rezgoCom", params.rezgoCom);
  if (params.rezgoUid) {
    qs.set("rezgoUid", params.rezgoUid);
    qs.set("optionCode", params.rezgoUid);
  }
  const effectiveLocation =
    params.startingLocation ||
    (params.durationScope === "dock_to_dock" ? "Downtown Juneau Cruise Docks" : null);
  if (effectiveLocation) {
    qs.set("location", effectiveLocation);
  }
  if (params.checkoutHref) {
    qs.set("bookingUrl", params.checkoutHref);
  }
  const pathWithQuery = `/planner/add?${qs.toString()}`;
  return params.relativeForCruisePromenade
    ? pathWithQuery
    : `https://cruisepromenade.com${pathWithQuery}`;
}

export function buildPublicJuneauLiveAvailabilityView(
  feed: NormalizedJuneauSupplierFeed,
  options?: {
    partySize?: number | null;
    shipArrivalTime?: string | null;
    shipAllAboardTime?: string | null;
    allAboardConfirmed?: boolean;
    originSurface?: "dcc" | "lfse" | "cp";
    activitySlug?: string | null;
    customCheckoutHrefBuilder?: (args: {
      tour: NormalizedJuneauSupplierTour;
      option: NormalizedJuneauDepartureOption;
      partySize: number | null;
    }) => string | null;
  },
): PublicJuneauLiveAvailabilityView {
  const rawParty = options?.partySize;
  const enteredPartySize =
    typeof rawParty === "number" && Number.isFinite(rawParty) && rawParty >= 1
      ? Math.min(99, Math.trunc(rawParty))
      : null;

  const originSurface = options?.originSurface ?? "dcc";
  const operatorDisplayName = "Juneau Tours & Whale Watch";

  const activityFilteredTours = options?.activitySlug
    ? feed.tours.filter((t) => {
        if (options.activitySlug === "whale-watching") {
          return (
            t.activityCategory === "whale-watching" ||
            t.activityCategory === "combo-whale-glacier"
          );
        }
        if (options.activitySlug === "mendenhall-glacier-tours") {
          return (
            t.activityCategory === "mendenhall-glacier-tours" ||
            t.activityCategory === "combo-whale-glacier"
          );
        }
        return true;
      })
    : feed.tours;

  const cards: PublicJuneauTourCardModel[] = [];

  for (const tour of activityFilteredTours) {
    const depOptions = Array.isArray(tour.departureOptions) ? tour.departureOptions : [];
    const tourServiceDate = tour.serviceDate ?? tour.dateChecked ?? feed.dateChecked ?? null;

    // Requirement 1 & 2 & 6: Sold-out or non-positive availability NEVER appears publicly anywhere.
    const positiveSpotsOptions = depOptions.filter(
      (opt) =>
        Boolean(opt.departureTime) &&
        typeof opt.availableSpots === "number" &&
        Number.isFinite(opt.availableSpots) &&
        opt.availableSpots > 0,
    );

    if (positiveSpotsOptions.length === 0) {
      // Tour has zero positive-availability departures -> hide completely from public view.
      continue;
    }

    const resolvedDurationScope: JuneauTourDurationScope =
      tour.durationScope ??
      resolveJuneauToursDockToDockProvenance({
        operatorId: tour.operatorId,
        rezgoCom: tour.rezgoCom,
        matchedViatorProductCode: tour.matchedViatorProductCode,
        verifiedRezgoDomain: tour.bookingProviderIdentity?.verifiedRezgoDomain ?? feed.verifiedRezgoDomain,
        verifiedRezgoCompanyName: tour.verifiedRezgoCompanyName ?? feed.verifiedCompanyName,
        title: tour.title,
      }).durationScope;

    const evaluateOptionAssessment = (opt: NormalizedJuneauDepartureOption) => {
      const depStr = opt.departureTime || "00:00";
      if (options?.shipArrivalTime || options?.shipAllAboardTime) {
        return assessRezgoDepartureAgainstShipWindow({
          departureTime: depStr,
          durationMinutes: tour.durationMinutes,
          shipArrivalTime: options.shipArrivalTime,
          shipAllAboardTime: options.shipAllAboardTime,
          allAboardConfirmed: options.allAboardConfirmed,
          durationScope: resolvedDurationScope,
        });
      }
      return (
        opt.windowAssessment ??
        assessRezgoDepartureAgainstShipWindow({
          departureTime: depStr,
          durationMinutes: tour.durationMinutes,
          shipArrivalTime: null,
          shipAllAboardTime: null,
          allAboardConfirmed: false,
          durationScope: resolvedDurationScope,
        })
      );
    };

    const inWindowPositive = positiveSpotsOptions.filter(
      (opt) => !evaluateOptionAssessment(opt).blockedForSailingWindow,
    );

    const qualifiedOptions =
      enteredPartySize !== null
        ? positiveSpotsOptions.filter(
            (opt) =>
              typeof opt.availableSpots === "number" &&
              opt.availableSpots >= enteredPartySize,
          )
        : positiveSpotsOptions;

    const recommendedDepartures: PublicJuneauDepartureButton[] = [];
    const confirmTimingDepartures: PublicJuneauDepartureButton[] = [];
    const otherAvailableTimes: PublicJuneauDepartureButton[] = [];
    const doesNotFitShipDayTimes: PublicJuneauOutsideWindowTime[] = [];

    for (const opt of qualifiedOptions) {
      const dep24 = normalizeRezgoClockTime(opt.departureTime) || String(opt.departureTime);
      const timeLabel = formatPublicClockTime12h(dep24);
      const assessment = evaluateOptionAssessment(opt);

      if (assessment.blockedForSailingWindow) {
        doesNotFitShipDayTimes.push({
          departureTime24: dep24,
          timeLabel,
        });
        continue;
      }

      const checkoutHref = options?.customCheckoutHrefBuilder
        ? options.customCheckoutHrefBuilder({
            tour,
            option: opt,
            partySize: enteredPartySize,
          })
        : opt.dccCommerceWrapperHref;

      let timingBucket: PublicJuneauTimingBucket = "confirm_return_timing";
      let timingStatusLabel = "Confirm return timing";
      let reducedBufferHmsLabel: string | null = null;
      let requiresReducedBufferConfirmation = false;

      if (assessment.status === "recommended") {
        timingBucket = "recommended";
        timingStatusLabel = "Estimated back 2+ hours before all aboard";
      } else if (assessment.status === "reduced_buffer_not_recommended") {
        timingBucket = "other_available_times";
        reducedBufferHmsLabel = assessment.upperBoundRemainingBufferHmsLabel || null;
        timingStatusLabel = reducedBufferHmsLabel
          ? `${reducedBufferHmsLabel} buffer · Not recommended`
          : "Reduced buffer · Not recommended";
        requiresReducedBufferConfirmation = true;
      } else {
        timingBucket = "confirm_return_timing";
        timingStatusLabel = "Confirm return timing";
      }

      const plannerAddHref = buildCruisePromenadeGroupPlanHref({
        title: tour.title,
        operatorName: operatorDisplayName,
        operatorId: "juneau-tours-whale-watch",
        serviceDate: opt.serviceDate || tourServiceDate,
        departureTime24: dep24,
        timeLabel,
        durationMinutes: tour.durationMinutes,
        durationScope: resolvedDurationScope,
        startingLocation: tour.startingLocation,
        rezgoCom: opt.rezgoCom ?? tour.rezgoCom,
        rezgoUid: opt.uid,
        matchedViatorProductCode: tour.matchedViatorProductCode,
        checkoutHref,
        fitStatus: assessment.status,
        originSurface,
        relativeForCruisePromenade: originSurface === "cp",
      });

      const button: PublicJuneauDepartureButton = {
        selectionKey: `${tour.normalizedTourId}::${dep24}::${opt.uid}`,
        departureTime24: dep24,
        timeLabel,
        timingBucket,
        timingStatusLabel,
        reducedBufferHmsLabel,
        requiresReducedBufferConfirmation,
        checkoutHref,
        plannerAddHref,
        syncSelection: {
          operatorId: "juneau-tours-whale-watch",
          operatorName: operatorDisplayName,
          rezgoCom: opt.rezgoCom ?? tour.rezgoCom,
          rezgoUid: opt.uid,
          optionCode: opt.uid,
          optionTitle: `${timeLabel} Departure`,
          matchedViatorProductCode: tour.matchedViatorProductCode,
          fallbackProductCode: tour.matchedViatorProductCode,
          departureTime24: dep24,
          serviceDate: opt.serviceDate || tourServiceDate,
          durationMinutes: tour.durationMinutes,
          startingLocation: tour.startingLocation,
          adultPriceUsd: opt.adultPriceUsd ?? tour.adultPriceUsd,
          currency: tour.currency || "USD",
          fitStatus: assessment.status,
        },
      };

      if (timingBucket === "recommended") {
        recommendedDepartures.push(button);
      } else if (timingBucket === "other_available_times") {
        otherAvailableTimes.push(button);
      } else {
        confirmTimingDepartures.push(button);
      }
    }

    const totalSelectableForParty =
      recommendedDepartures.length +
      confirmTimingDepartures.length +
      otherAvailableTimes.length;

    // If no party size was entered AND all positive options are outside the ship window with nothing selectable or collapsible, keep collapsible if outside-window exists
    if (
      enteredPartySize === null &&
      totalSelectableForParty === 0 &&
      doesNotFitShipDayTimes.length === 0
    ) {
      continue;
    }

    const partyNoun = enteredPartySize === 1 ? "person" : "people";
    const partyAvailabilityLabel =
      enteredPartySize !== null && totalSelectableForParty > 0
        ? `Available for your group of ${enteredPartySize}`
        : null;
    const insufficientPartyMessage =
      enteredPartySize !== null &&
      totalSelectableForParty === 0 &&
      inWindowPositive.length > 0
        ? `No departure currently has enough availability for ${enteredPartySize} ${partyNoun}.`
        : enteredPartySize !== null && totalSelectableForParty === 0
          ? `No departure currently has enough availability for ${enteredPartySize} ${partyNoun}.`
          : null;

    const startingPriceLabel =
      typeof tour.adultPriceUsd === "number" && tour.adultPriceUsd > 0
        ? `From $${Number.isInteger(tour.adultPriceUsd) ? tour.adultPriceUsd.toFixed(0) : tour.adultPriceUsd.toFixed(2)} adult`
        : null;

    const hasApprovedPartnerCheckout = Boolean(tour.matchedViatorProductCode);

    cards.push({
      cardId: tour.normalizedTourId,
      title: tour.title,
      operatorName: operatorDisplayName,
      activityCategory: tour.activityCategory,
      durationLabel:
        tour.durationLabel ||
        (tour.durationMinutes ? `${Math.round((tour.durationMinutes / 60) * 100) / 100} hours` : null),
      durationMinutes: tour.durationMinutes,
      startingAdultPriceUsd: tour.adultPriceUsd,
      startingPriceLabel,
      currency: tour.currency || "USD",
      serviceDate: tourServiceDate,
      partySizePrompt: "How many people are going?",
      enteredPartySize,
      partyAvailabilityLabel,
      insufficientPartyMessage,
      hasPositiveAvailabilityBeforePartyFilter: inWindowPositive.length > 0,
      recommendedDepartures,
      confirmTimingDepartures,
      otherAvailableTimes,
      doesNotFitShipDayTimes,
      checkoutAvailable: hasApprovedPartnerCheckout,
      checkoutCtaLabel: "Book this tour",
      secondaryCheckCtaLabel: "Check availability & book",
      checkoutProviderLabel: hasApprovedPartnerCheckout ? "Checkout via Viator" : null,
      addToGroupPlanLabel: "Add to group plan",
    });
  }

  return {
    ok: feed.ok,
    operatorName: operatorDisplayName,
    serviceDate: feed.dateChecked ?? null,
    enteredPartySize,
    partySizePrompt: "How many people are going?",
    shipArrivalTime: options?.shipArrivalTime ?? null,
    shipAllAboardTime: options?.shipAllAboardTime ?? null,
    cards,
  };
}

export interface RevalidatePublicJuneauCheckoutResult {
  ok: boolean;
  available: boolean;
  partySize: number;
  serviceDate: string | null;
  departureTime24: string | null;
  timeLabel: string | null;
  partyAvailabilityLabel: string | null;
  message: string;
  checkoutHref: string | null;
  checkoutProviderLabel: string | null;
  requiresReducedBufferConfirmation: boolean;
  reducedBufferWarningLabel: string | null;
}

export async function revalidatePublicJuneauDepartureBeforeCheckout(params: {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  serviceDate: string;
  partySize: number;
  cardId?: string | null;
  rezgoUid?: string | null;
  departureTime24?: string | null;
  shipArrivalTime?: string | null;
  shipAllAboardTime?: string | null;
  allAboardConfirmed?: boolean;
}): Promise<RevalidatePublicJuneauCheckoutResult> {
  const cleanPartySize = Math.max(1, Math.min(99, Math.trunc(Number(params.partySize) || 1)));
  const partyNoun = cleanPartySize === 1 ? "person" : "people";

  const freshFeed = await buildNormalizedJuneauSupplierFeed({
    env: params.env,
    fetchImpl: params.fetchImpl,
    searchDate: params.serviceDate,
    shipArrivalTime: params.shipArrivalTime || null,
    shipAllAboardTime: params.shipAllAboardTime || null,
    allAboardConfirmed: params.allAboardConfirmed ?? Boolean(params.shipAllAboardTime),
    bypassCache: true,
  });

  if (!freshFeed.ok || freshFeed.tours.length === 0) {
    return {
      ok: false,
      available: false,
      partySize: cleanPartySize,
      serviceDate: params.serviceDate,
      departureTime24: params.departureTime24 ?? null,
      timeLabel: params.departureTime24 ? formatPublicClockTime12h(params.departureTime24) : null,
      partyAvailabilityLabel: null,
      message: `No departure currently has enough availability for ${cleanPartySize} ${partyNoun}.`,
      checkoutHref: null,
      checkoutProviderLabel: null,
      requiresReducedBufferConfirmation: false,
      reducedBufferWarningLabel: null,
    };
  }

  let matchedTour: NormalizedJuneauSupplierTour | null = null;
  let matchedOpt: NormalizedJuneauDepartureOption | null = null;

  for (const tour of freshFeed.tours) {
    if (params.cardId && tour.normalizedTourId !== params.cardId) {
      continue;
    }
    for (const opt of tour.departureOptions || []) {
      const normDep = normalizeRezgoClockTime(opt.departureTime);
      const uidMatches = Boolean(params.rezgoUid && opt.uid === params.rezgoUid);
      const depMatches = Boolean(
        params.departureTime24 &&
          normDep &&
          normDep === normalizeRezgoClockTime(params.departureTime24),
      );
      if (uidMatches || (!params.rezgoUid && depMatches)) {
        matchedTour = tour;
        matchedOpt = opt;
        break;
      }
    }
    if (matchedOpt) break;
  }

  if (!matchedTour || !matchedOpt) {
    return {
      ok: true,
      available: false,
      partySize: cleanPartySize,
      serviceDate: params.serviceDate,
      departureTime24: params.departureTime24 ?? null,
      timeLabel: params.departureTime24 ? formatPublicClockTime12h(params.departureTime24) : null,
      partyAvailabilityLabel: null,
      message: `No departure currently has enough availability for ${cleanPartySize} ${partyNoun}.`,
      checkoutHref: null,
      checkoutProviderLabel: null,
      requiresReducedBufferConfirmation: false,
      reducedBufferWarningLabel: null,
    };
  }

  const assessment =
    matchedOpt.windowAssessment ??
    assessRezgoDepartureAgainstShipWindow({
      departureTime: matchedOpt.departureTime || "00:00",
      durationMinutes: matchedTour.durationMinutes,
      shipArrivalTime: params.shipArrivalTime,
      shipAllAboardTime: params.shipAllAboardTime,
      allAboardConfirmed: params.allAboardConfirmed,
      durationScope: matchedTour.durationScope,
    });

  const dep24 = normalizeRezgoClockTime(matchedOpt.departureTime) || matchedOpt.departureTime;
  const timeLabel = dep24 ? formatPublicClockTime12h(dep24) : null;

  if (assessment.blockedForSailingWindow) {
    return {
      ok: true,
      available: false,
      partySize: cleanPartySize,
      serviceDate: params.serviceDate,
      departureTime24: dep24,
      timeLabel,
      partyAvailabilityLabel: null,
      message: "Doesn’t fit this ship day.",
      checkoutHref: null,
      checkoutProviderLabel: null,
      requiresReducedBufferConfirmation: false,
      reducedBufferWarningLabel: null,
    };
  }

  const hasEnough =
    typeof matchedOpt.availableSpots === "number" &&
    Number.isFinite(matchedOpt.availableSpots) &&
    matchedOpt.availableSpots >= cleanPartySize;

  if (!hasEnough) {
    return {
      ok: true,
      available: false,
      partySize: cleanPartySize,
      serviceDate: params.serviceDate,
      departureTime24: dep24,
      timeLabel,
      partyAvailabilityLabel: null,
      message: `No departure currently has enough availability for ${cleanPartySize} ${partyNoun}.`,
      checkoutHref: null,
      checkoutProviderLabel: null,
      requiresReducedBufferConfirmation: false,
      reducedBufferWarningLabel: null,
    };
  }

  const isReduced = assessment.status === "reduced_buffer_not_recommended";
  const reducedLabel =
    isReduced && assessment.upperBoundRemainingBufferHmsLabel
      ? `${assessment.upperBoundRemainingBufferHmsLabel} buffer · Not recommended`
      : isReduced
        ? "Reduced buffer · Not recommended"
        : null;

  return {
    ok: true,
    available: true,
    partySize: cleanPartySize,
    serviceDate: matchedOpt.serviceDate || params.serviceDate,
    departureTime24: dep24,
    timeLabel,
    partyAvailabilityLabel: `Available for your group of ${cleanPartySize}`,
    message: `Available for your group of ${cleanPartySize}`,
    checkoutHref: matchedOpt.dccCommerceWrapperHref,
    checkoutProviderLabel: matchedTour.matchedViatorProductCode ? "Checkout via Viator" : null,
    requiresReducedBufferConfirmation: isReduced,
    reducedBufferWarningLabel: reducedLabel,
  };
}
