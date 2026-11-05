import {
  queryDurableTourCatalog,
  resolveEarthOSDestinationNode,
  type ChannelOffer,
  type DurableTourRecord,
  type PickupFulfillmentType,
  type PriceBasis,
  type TourCapabilityTier,
  type TourProductOptionRecord,
  type TransferTimeSource,
} from "./durableCatalogStore";
import { recordObservedWidgetOrigin } from "./widgetPlacements";
import { buildViatorPaxMix, checkDccLiveAvailability } from "@/lib/dcc/internal/dccViatorAdapter";
import { fetchAvailabilitiesForItem } from "@/lib/dcc/liveSlots/fareharbor";
import { appendViatorAttribution } from "@/lib/viator/links";
import {
  generateOpaqueClickId,
  isDemoOrAutomatedVerificationTraffic,
  issueOpaqueClickAttribution,
} from "@/lib/dcc/commerce/opaqueAttributionLedger";
import {
  buildSharedGoSnoHandoffUrlAndDetails,
  issueSharedGoSnoHandoffAttribution,
} from "@/lib/dcc/applicability/gosnoHandoffBuilder";

export type TripMatchRequest = {
  destination: string;
  portSlug?: string;
  date?: string;
  adults?: number;
  childAges?: number[];
  seniors?: number;
  infants?: number;
  youths?: number;
  requiresHotelPickup?: boolean;
  requiresPierPickup?: boolean;
  pickupMode?:
    | "any"
    | "pier_pickup"
    | "hotel_pickup"
    | "downtown_shuttle_departure"
    | "self_drive";
  hotelName?: string;
  hotelLat?: number;
  hotelLng?: number;
  approvedTourIds?: string[];
  category?: string;
  maxPassengerWeightLbs?: number;
  requiresWheelchair?: boolean;
  shipArrival?: string;
  shipDeparture?: string;
  allAboardTime?: string;
  flightArrivalTime?: string;
  surface?:
    | "dcc"
    | "hotel_concierge"
    | "cruisepromenade"
    | "welcometoneworleanstours"
    | "welcometotheswamp"
    | "juneau-flight-deck";
  propertySlug?: string;
  enableShortlistLiveCheck?: boolean;
  shortlistMaxCount?: number;
  includeDiscoveryOnly?: boolean;
  limit?: number;
  isTest?: boolean;
  userAgent?: string;
  referer?: string;
  parentOrigin?: string;
};

export type ShortlistLiveStatus = {
  checked: boolean;
  status: "verified_available" | "verified_unavailable" | "unknown_unchecked" | "unknown_error";
  provider: string;
  available: boolean | null;
  bookableSlotsCount: number | null;
  earliestStartTime: string | null;
  startTimes: string[];
  liveFromPriceCents: number | null;
  latencyMs: number;
  note: string;
};

export type CruiseScheduleFitEvaluation = {
  evaluated: boolean;
  fitStatus: "recommended" | "needs_confirmation" | "ineligible" | "not_applicable";
  arrivalMinutesOfDay: number | null;
  returnDeadlineMinutesOfDay: number | null;
  debarkClearanceMinutes: number;
  transferBeforeMinutes: number | null;
  transferAfterMinutes: number | null;
  transferTimeSource: TransferTimeSource;
  transferEvidenceSource?: string | null;
  applicableBerthOrMeetingPoint?: string | null;
  planningEstimateTransferMinutes: number | null;
  durationMinutes: number | null;
  verifiedDepartureTimes: string[];
  fittingDepartureTimes: string[];
  reason: string;
};

export type OptionTitleTimeSemantics = {
  optionTitleContainsTime: boolean;
  extractedTitleTime: string | null;
  semantics:
    | "verified_provider_departure_time"
    | "pickup_or_checkin_unverified_as_departure"
    | "none";
  explanation: string | null;
};

export type BoundTourOfferTuple = {
  provider: string;
  tourId: string;
  providerProductCode: string;
  optionCode: string | null;
  optionTitle: string | null;
  pickupFulfillmentType: PickupFulfillmentType;
  pickupBadgeLabel: string;
  includesPickup: boolean | null;
  date: string | null;
  departureTime: string | null;
  availableDepartureTimes: string[];
  fittingDepartureTimes: string[];
  optionTitleTimeSemantics?: OptionTitleTimeSemantics;
  adults: number;
  childAges: number[];
  totalGuests: number;
  paxMix: Array<{ ageBand: string; numberOfTravelers: number }>;
  durationMinutes: number | null;
  durationRawText: string | null;
  unitPriceCents: number | null;
  totalPartyPriceCents: number | null;
  priceBasis: PriceBasis;
  currency: string;
  priceVerifiedLive: boolean;
  transferBeforeMinutes: number | null;
  transferAfterMinutes: number | null;
  transferTimeSource: TransferTimeSource;
  transferEvidenceSource?: string | null;
  applicableBerthOrMeetingPoint?: string | null;
  planningEstimateTransferMinutes: number | null;
};

export type AlternativeOptionTradeoff = {
  optionCode: string;
  title: string;
  fromPriceCents: number | null;
  totalPartyPriceCents: number | null;
  savingsCentsPerPerson: number | null;
  savingsTotalPartyCents: number | null;
  pickupFulfillmentType: PickupFulfillmentType;
  pickupBadgeLabel: string;
  durationMinutes: number | null;
  transferTimeSource: TransferTimeSource;
  tradeoffSummary: string;
};

export type CheckoutPreselectionMetadata = {
  provider: string;
  preselectionSupport:
    | "full_provider_preselection"
    | "partial_provider_preselection"
    | "affiliate_landing_manual_selection_required";
  preselectedFields: string[];
  manualSelectionFieldsAtCheckout: string[];
  providerDefaultDateBehavior: string;
  travelerActionSummary: string;
  requiredSelectionsAtCheckout: {
    date: string | null;
    partySummary: string;
    optionTitle: string | null;
    optionCode: string | null;
    departureTime: string | null;
    pickupModeLabel: string;
  };
};

export type MatchedTourOption = {
  tourId: string;
  compatibilityAliases: string[];
  title: string;
  summary: string | null;
  category: string;
  destinationSlug: string;
  portSlug: string | null;
  earthosDestinationNodeId: string;
  timeZone: string;
  primaryProvider: string;
  providerProductCode: string;
  operatorName: string | null;
  capabilityTier: TourCapabilityTier;
  commissionAuthorized: boolean;
  suitability: "recommended" | "needs_confirmation" | "ineligible";
  matchScore: number;
  explanations: string[];
  missingInformation: string[];
  partyCompositionApplied: {
    totalGuests: number;
    paxMix: Array<{ ageBand: string; numberOfTravelers: number }>;
  };
  pricing: {
    fromPriceCents: number | null;
    totalPartyPriceCents: number | null;
    priceBasis: PriceBasis;
    lowestPriceIncludesPickup: boolean | null;
    currency: string;
    selectedChannelId: string;
    selectedOptionCode: string | null;
    selectedOptionTitle: string | null;
    selectedOptionIncludesPickup: boolean | null;
    selectedOptionPickupFulfillmentType: PickupFulfillmentType;
    selectedOptionPickupBadgeLabel: string;
  };
  boundOffer: BoundTourOfferTuple;
  selectedProductOption: TourProductOptionRecord | null;
  productOptions: TourProductOptionRecord[];
  alternativeOptionTradeoffs: AlternativeOptionTradeoff[];
  serviceDetails: Record<string, unknown>;
  duration: {
    durationMinutes: number | null;
    durationRawText: string | null;
    status: "known" | "unknown";
  };
  cancellation: {
    freeCancellation: boolean | null;
    policyType: string | null;
    cutoffHours: number | null;
    summary: string | null;
    status: "known" | "unknown";
  };
  pickupAndLocation: {
    hasHotelPickup: boolean | null;
    lowestPriceIncludesPickup: boolean | null;
    pickupType: string | null;
    pickupFulfillmentType: PickupFulfillmentType;
    pickupBadgeLabel: string;
    pickupSummary: string | null;
    meetingPointName: string | null;
    meetingPointAddress: string | null;
    meetingPointLat: number | null;
    meetingPointLng: number | null;
    locationPrecision: "exact" | "approximate" | "unknown";
    distanceFromGuestKm: number | null;
    nearestPickupPointName: string | null;
    transferEvidenceSource?: string | null;
    applicableBerthOrMeetingPoint?: string | null;
  };
  cruiseScheduleFit?: CruiseScheduleFitEvaluation;
  channelOffers: ChannelOffer[];
  shortlistLiveCheck: ShortlistLiveStatus;
  bookingPath: {
    clickId: string | null;
    handoffUrl: string;
    trackedClickUrl: string;
    sellerIdentity: string;
    operatorIdentity: string;
    capabilityTier: TourCapabilityTier;
    outcomeReportingMode:
      | "tracked_viator_checkout_referral"
      | "authorized_fareharbor_direct"
      | "internal_satellite_webhook_reconciled"
      | "attributable_operator_referral"
      | "untracked_discovery_link";
    checkoutPreselection: CheckoutPreselectionMetadata;
  };
  primaryImageUrl: string | null;
  ratingAverage: number | null;
  reviewCount: number | null;
};

export type TripMatchResponse = {
  ok: true;
  destination: {
    destinationSlug: string;
    portSlug: string | null;
    displayName: string;
    earthosDestinationNodeId: string;
    timeZone: string;
  };
  requestSummary: {
    date: string | null;
    adults: number;
    childAges: number[];
    requiresHotelPickup: boolean;
    requiresPierPickup: boolean;
    pickupMode: string;
    surface: string;
    propertySlug: string | null;
    portWindowMinutes: number | null;
  };
  metrics: {
    storageSource: string;
    totalCatalogCandidates: number;
    eligibleCount: number;
    needsConfirmationCount: number;
    ineligibleCount: number;
    shortlistCheckedCount: number;
    supportedVerifiedTransferCount: number;
    liveDepartureVerifiedCount: number;
    fullySupportedCruiseFitCount: number;
    upstreamRequestsMade: number;
    cachedCatalogSearchMs: number;
    shortlistLiveCheckMs: number;
    totalResponseMs: number;
  };
  options: MatchedTourOption[];
  ineligibleOptions: MatchedTourOption[];
};

export function getTodayIsoDateInTimeZone(timeZone = "America/Chicago"): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {
    // fallback
  }
  return new Date().toISOString().slice(0, 10);
}

export function validateTravelDateNotPast(
  dateStr?: string | null,
  timeZone = "America/Chicago",
): {
  valid: boolean;
  normalizedDate: string | null;
  todayInDestinationTz: string;
  errorCode?: "INVALID_DATE_FORMAT" | "INVALID_PAST_DATE";
  message?: string;
} {
  const todayInDestinationTz = getTodayIsoDateInTimeZone(timeZone);
  if (!dateStr || !dateStr.trim()) {
    return { valid: true, normalizedDate: null, todayInDestinationTz };
  }
  const trimmed = dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return {
      valid: false,
      normalizedDate: trimmed,
      todayInDestinationTz,
      errorCode: "INVALID_DATE_FORMAT",
      message: `Invalid travel date format "${trimmed}". Expected YYYY-MM-DD.`,
    };
  }
  if (trimmed < todayInDestinationTz) {
    return {
      valid: false,
      normalizedDate: trimmed,
      todayInDestinationTz,
      errorCode: "INVALID_PAST_DATE",
      message: `Selected travel date (${trimmed}) is in the past (current date in ${timeZone}: ${todayInDestinationTz}). Please select today or a future travel date.`,
    };
  }
  return { valid: true, normalizedDate: trimmed, todayInDestinationTz };
}

export function detectOptionTitleTimeSemantics(
  optionTitle: string | null,
  verifiedStartTimes: string[],
): OptionTitleTimeSemantics {
  if (!optionTitle) {
    return {
      optionTitleContainsTime: false,
      extractedTitleTime: null,
      semantics: "none",
      explanation: null,
    };
  }
  const amPmMatch = optionTitle.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  const twentyFourMatch = !amPmMatch
    ? optionTitle.match(/\b([01]\d|2[0-3]):([0-5]\d)\b/)
    : null;

  let normalizedHm: string | null = null;
  let rawToken: string | null = null;
  if (amPmMatch) {
    rawToken = amPmMatch[0];
    let h = Number(amPmMatch[1]);
    const m = amPmMatch[2] ? Number(amPmMatch[2]) : 0;
    const mer = amPmMatch[3].toLowerCase();
    if (mer === "pm" && h < 12) h += 12;
    if (mer === "am" && h === 12) h = 0;
    normalizedHm = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  } else if (twentyFourMatch) {
    rawToken = twentyFourMatch[0];
    normalizedHm = `${twentyFourMatch[1]}:${twentyFourMatch[2]}`;
  }

  if (!normalizedHm) {
    return {
      optionTitleContainsTime: false,
      extractedTitleTime: null,
      semantics: "none",
      explanation: null,
    };
  }

  const normalizedVerified = new Set(
    verifiedStartTimes
      .map((st) => {
        const min = parseClockMinutesOfDay(st);
        return min !== null ? formatMinutesOfDay(min) : st.trim();
      })
      .filter(Boolean),
  );

  if (normalizedVerified.has(normalizedHm)) {
    return {
      optionTitleContainsTime: true,
      extractedTitleTime: normalizedHm,
      semantics: "verified_provider_departure_time",
      explanation: `Option title time (${rawToken} / ${normalizedHm}) is corroborated by provider schedule startTimes.`,
    };
  }

  return {
    optionTitleContainsTime: true,
    extractedTitleTime: normalizedHm,
    semantics: "pickup_or_checkin_unverified_as_departure",
    explanation: `Time in option title ("${rawToken}") may describe hotel pickup or check-in rather than tour departure; not used as a verified departure time without provider schedule evidence.`,
  };
}

export function getPickupBadgeLabel(mode: PickupFulfillmentType): string {
  switch (mode) {
    case "pier_pickup":
      return "Cruise Pier Pickup Included";
    case "hotel_pickup":
      return "Hotel Pickup Included";
    case "downtown_shuttle_departure":
      return "Downtown Shuttle Departure";
    case "self_drive":
      return "Self-Drive / Meet on Site";
    case "walkable_from_pier":
      return "Walkable from Cruise Pier";
    case "unknown":
    default:
      return "Pickup / Meeting Point Unverified";
  }
}

export function inferOptionPickupFulfillmentType(
  opt: TourProductOptionRecord | null,
  record: DurableTourRecord,
): PickupFulfillmentType {
  if (opt?.pickupFulfillmentType && opt.pickupFulfillmentType !== "unknown") {
    return opt.pickupFulfillmentType;
  }
  const combined = `${opt?.title || ""} ${opt?.description || ""}`;
  if (
    /\b(cruise\s+(ship|port|pier|dock|terminal)\s+(pick\s*-?\s*up|shuttle|transfer)|dockside\s+shuttle|pier\s+pick\s*-?\s*up)\b/i.test(
      combined,
    ) ||
    record.pickupType === "CRUISE_PIER_PICKUP"
  ) {
    return "pier_pickup";
  }
  if (
    /\b(departing\s+from\s+gray\s+line|downtown\s+shuttle|departing\s+from\s+downtown|400\s+toulouse|500\s+toulouse|lighthouse\s+ticket\s+office)\b/i.test(
      combined,
    )
  ) {
    return "downtown_shuttle_departure";
  }
  if (
    /\b(drive\s*yourself|self\s*-?\s*drive|no\s*(hotel\s*)?(pick\s*-?\s*up|transport(ation)?|shuttle|transfer)|without\s*(hotel\s*)?(pick\s*-?\s*up|transport(ation)?|shuttle|transfer)|meet\s*(on\s*site|at\s*(location|marina|dock|pier|launch|site|starting\s*point))|transport(ation)?\s*not\s*included)\b/i.test(
      combined,
    )
  ) {
    return "self_drive";
  }
  if (opt?.includesPickup === true) {
    return "hotel_pickup";
  }
  if (opt?.includesPickup === false) {
    return "self_drive";
  }
  if (record.pickupFulfillmentType) {
    return record.pickupFulfillmentType;
  }
  if (record.hasHotelPickup === true) {
    return "hotel_pickup";
  }
  if (record.hasHotelPickup === false) {
    return "self_drive";
  }
  return "unknown";
}

function computeTotalPartyPriceCents(
  unitPriceCents: number | null,
  priceBasis: PriceBasis,
  totalGuests: number,
): number | null {
  if (unitPriceCents === null || !Number.isFinite(unitPriceCents)) return null;
  if (priceBasis === "flat_rate_per_vehicle" || priceBasis === "per_group") {
    return unitPriceCents;
  }
  return unitPriceCents * Math.max(1, totalGuests);
}

function appendBoundOfferQueryParams(
  rawUrl: string,
  bound: BoundTourOfferTuple,
): string {
  if (!rawUrl) return rawUrl;
  try {
    const isRelative = rawUrl.startsWith("/");
    const urlObj = new URL(rawUrl, isRelative ? "https://www.destinationcommandcenter.com" : undefined);
    if (bound.optionCode) urlObj.searchParams.set("dcc_option_code", bound.optionCode);
    if (bound.date) urlObj.searchParams.set("dcc_date", bound.date);
    if (bound.departureTime) urlObj.searchParams.set("dcc_departure_time", bound.departureTime);
    urlObj.searchParams.set("dcc_adults", String(bound.adults));
    if (bound.childAges.length > 0) {
      urlObj.searchParams.set("dcc_child_ages", bound.childAges.join(","));
    }
    urlObj.searchParams.set("dcc_pickup_mode", bound.pickupFulfillmentType);
    if (bound.unitPriceCents !== null) {
      urlObj.searchParams.set("dcc_unit_price_cents", String(bound.unitPriceCents));
    }
    if (bound.totalPartyPriceCents !== null) {
      urlObj.searchParams.set("dcc_total_price_cents", String(bound.totalPartyPriceCents));
    }
    return isRelative ? `${urlObj.pathname}${urlObj.search}${urlObj.hash}` : urlObj.toString();
  } catch {
    return rawUrl;
  }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
}

export function parseClockMinutesOfDay(val?: string | null): number | null {
  if (!val || typeof val !== "string") return null;
  const trimmed = val.trim();
  if (!trimmed) return null;
  const hm = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (hm) {
    const h = Number(hm[1]);
    const m = Number(hm[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return h * 60 + m;
    }
  }
  const isoTime = trimmed.match(/T(\d{2}):(\d{2})/);
  if (isoTime) {
    const h = Number(isoTime[1]);
    const m = Number(isoTime[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return h * 60 + m;
    }
  }
  return null;
}

function formatMinutesOfDay(totalMin: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMin)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseTimeWindowMinutes(
  arrivalStr?: string,
  departureOrAllAboardStr?: string,
  isAllAboard = false,
): number | null {
  const mArr = parseClockMinutesOfDay(arrivalStr);
  const mDep = parseClockMinutesOfDay(departureOrAllAboardStr);
  if (mArr !== null && mDep !== null && mDep > mArr) {
    const rawWindow = mDep - mArr;
    return isAllAboard ? rawWindow : Math.max(0, rawWindow - 45);
  }
  return null;
}

export function evaluateCruiseScheduleFit(params: {
  shipArrival?: string;
  shipDeparture?: string;
  allAboardTime?: string;
  durationMinutes: number | null;
  transferBeforeMinutes: number | null;
  transferAfterMinutes: number | null;
  transferTimeSource?: TransferTimeSource;
  transferEvidenceSource?: string | null;
  applicableBerthOrMeetingPoint?: string | null;
  planningEstimateTransferMinutes?: number | null;
  verifiedDepartureTimes: string[];
}): CruiseScheduleFitEvaluation {
  const arrivalMin = parseClockMinutesOfDay(params.shipArrival);
  const explicitAllAboardMin = parseClockMinutesOfDay(params.allAboardTime);
  const shipDepartureMin = parseClockMinutesOfDay(params.shipDeparture);
  const returnDeadlineMin =
    explicitAllAboardMin ?? (shipDepartureMin !== null ? shipDepartureMin - 45 : null);
  const debarkClearanceMinutes = 30;
  const transferEvidenceSource = params.transferEvidenceSource ?? null;
  const applicableBerthOrMeetingPoint = params.applicableBerthOrMeetingPoint ?? null;
  const explicitlyMissingEvidence =
    "transferEvidenceSource" in params &&
    (params.transferEvidenceSource === null ||
      (typeof params.transferEvidenceSource === "string" && !params.transferEvidenceSource.trim()));
  const rawTransferSource: TransferTimeSource =
    params.transferTimeSource ||
    (params.transferBeforeMinutes !== null &&
    params.transferAfterMinutes !== null &&
    transferEvidenceSource !== null
      ? "verified_meeting_point"
      : params.planningEstimateTransferMinutes !== null &&
          params.planningEstimateTransferMinutes !== undefined
        ? "planning_estimate"
        : "unknown");
  const transferTimeSource: TransferTimeSource =
    explicitlyMissingEvidence &&
    (rawTransferSource === "verified_pier_pickup" || rawTransferSource === "verified_meeting_point")
      ? params.planningEstimateTransferMinutes !== null &&
        params.planningEstimateTransferMinutes !== undefined
        ? "planning_estimate"
        : "unknown"
      : rawTransferSource;
  const planningEst =
    typeof params.planningEstimateTransferMinutes === "number" &&
    Number.isFinite(params.planningEstimateTransferMinutes)
      ? params.planningEstimateTransferMinutes
      : null;

  if (arrivalMin === null && returnDeadlineMin === null) {
    return {
      evaluated: false,
      fitStatus: "not_applicable",
      arrivalMinutesOfDay: null,
      returnDeadlineMinutesOfDay: null,
      debarkClearanceMinutes,
      transferBeforeMinutes: params.transferBeforeMinutes,
      transferAfterMinutes: params.transferAfterMinutes,
      transferTimeSource,
      transferEvidenceSource,
      applicableBerthOrMeetingPoint,
      planningEstimateTransferMinutes: planningEst,
      durationMinutes: params.durationMinutes,
      verifiedDepartureTimes: params.verifiedDepartureTimes,
      fittingDepartureTimes: [],
      reason: "No cruise port schedule supplied.",
    };
  }

  if (arrivalMin === null || returnDeadlineMin === null || returnDeadlineMin <= arrivalMin) {
    return {
      evaluated: true,
      fitStatus: "needs_confirmation",
      arrivalMinutesOfDay: arrivalMin,
      returnDeadlineMinutesOfDay: returnDeadlineMin,
      debarkClearanceMinutes,
      transferBeforeMinutes: params.transferBeforeMinutes,
      transferAfterMinutes: params.transferAfterMinutes,
      transferTimeSource,
      transferEvidenceSource,
      applicableBerthOrMeetingPoint,
      planningEstimateTransferMinutes: planningEst,
      durationMinutes: params.durationMinutes,
      verifiedDepartureTimes: params.verifiedDepartureTimes,
      fittingDepartureTimes: [],
      reason:
        "Cruise fit requires both ship arrival time and return deadline (all-aboard or ship departure time); schedule needs confirmation.",
    };
  }

  if (params.durationMinutes === null || params.durationMinutes <= 0) {
    return {
      evaluated: true,
      fitStatus: "needs_confirmation",
      arrivalMinutesOfDay: arrivalMin,
      returnDeadlineMinutesOfDay: returnDeadlineMin,
      debarkClearanceMinutes,
      transferBeforeMinutes: params.transferBeforeMinutes,
      transferAfterMinutes: params.transferAfterMinutes,
      transferTimeSource,
      transferEvidenceSource,
      applicableBerthOrMeetingPoint,
      planningEstimateTransferMinutes: planningEst,
      durationMinutes: null,
      verifiedDepartureTimes: params.verifiedDepartureTimes,
      fittingDepartureTimes: [],
      reason:
        "Tour duration is unknown in catalog; cannot establish cruise return fit without confirmed duration.",
    };
  }

  const availablePortMinutes = returnDeadlineMin - arrivalMin;
  const zeroTransferRequired = debarkClearanceMinutes + params.durationMinutes;

  // Even without transfer buffers, if debark + tour duration exceeds the port window, it is strictly ineligible
  if (zeroTransferRequired > availablePortMinutes) {
    return {
      evaluated: true,
      fitStatus: "ineligible",
      arrivalMinutesOfDay: arrivalMin,
      returnDeadlineMinutesOfDay: returnDeadlineMin,
      debarkClearanceMinutes,
      transferBeforeMinutes: params.transferBeforeMinutes,
      transferAfterMinutes: params.transferAfterMinutes,
      transferTimeSource,
      transferEvidenceSource,
      applicableBerthOrMeetingPoint,
      planningEstimateTransferMinutes: planningEst,
      durationMinutes: params.durationMinutes,
      verifiedDepartureTimes: params.verifiedDepartureTimes,
      fittingDepartureTimes: [],
      reason: `Exceeds cruise port safety window even before transfer buffers: requires at least ${zeroTransferRequired}m (${debarkClearanceMinutes}m debark + ${params.durationMinutes}m tour) vs ${availablePortMinutes}m available before ${formatMinutesOfDay(returnDeadlineMin)} all-aboard.`,
    };
  }

  const durMinutes = params.durationMinutes;
  const validStartTimes = params.verifiedDepartureTimes.filter(
    (t) => parseClockMinutesOfDay(t) !== null,
  );

  // If transfer times are unknown or only a planning estimate, preserve unknown transfer times and never claim verified cruise fit
  if (
    params.transferBeforeMinutes === null ||
    params.transferAfterMinutes === null ||
    transferTimeSource === "unknown" ||
    transferTimeSource === "planning_estimate"
  ) {
    const estTransfer = planningEst ?? 0;
    const estEarliestStart = arrivalMin + debarkClearanceMinutes + estTransfer;
    const estLatestEnd = returnDeadlineMin - estTransfer;
    const fittingUnderEstimate: string[] = [];

    if (validStartTimes.length > 0) {
      // Check if NO departure time fits even with 0 transfer buffer
      const fitsZeroTransfer = validStartTimes.some((st) => {
        const stMin = parseClockMinutesOfDay(st);
        return (
          stMin !== null &&
          stMin >= arrivalMin + debarkClearanceMinutes &&
          stMin + durMinutes <= returnDeadlineMin
        );
      });
      if (!fitsZeroTransfer) {
        return {
          evaluated: true,
          fitStatus: "ineligible",
          arrivalMinutesOfDay: arrivalMin,
          returnDeadlineMinutesOfDay: returnDeadlineMin,
          debarkClearanceMinutes,
          transferBeforeMinutes: null,
          transferAfterMinutes: null,
          transferTimeSource,
          transferEvidenceSource,
          applicableBerthOrMeetingPoint,
          planningEstimateTransferMinutes: planningEst,
          durationMinutes: durMinutes,
          verifiedDepartureTimes: validStartTimes,
          fittingDepartureTimes: [],
          reason: `Verified departure time(s) [${validStartTimes.join(", ")}] conflict with ship port window (${formatMinutesOfDay(arrivalMin + debarkClearanceMinutes)} post-debark to ${formatMinutesOfDay(returnDeadlineMin)} all-aboard).`,
        };
      }

      for (const st of validStartTimes) {
        const stMin = parseClockMinutesOfDay(st);
        if (stMin === null) continue;
        if (stMin >= estEarliestStart && stMin + durMinutes <= estLatestEnd) {
          fittingUnderEstimate.push(formatMinutesOfDay(stMin));
        }
      }
    }

    if (planningEst !== null) {
      const estTotal = debarkClearanceMinutes + planningEst + params.durationMinutes + planningEst;
      const reason =
        validStartTimes.length > 0
          ? fittingUnderEstimate.length > 0
            ? `Planning estimate only: live departure(s) [${fittingUnderEstimate.join(", ")}] + ${params.durationMinutes}m duration fit the port window using an estimated ~${planningEst}m each-way transfer, but actual pier-to-meeting-point transfer time is unverified; needs confirmation.`
            : `Planning estimate warning: live departure(s) [${validStartTimes.join(", ")}] do not leave a full estimated ~${planningEst}m each-way transfer margin before ${formatMinutesOfDay(returnDeadlineMin)} all-aboard; actual transfer time is unverified and requires confirmation.`
          : estTotal <= availablePortMinutes
            ? `Planning estimate only: tour duration (${params.durationMinutes}m) fits the ${availablePortMinutes}m port window using an estimated ~${planningEst}m each-way transfer, but actual pier-to-meeting-point transfer time and date-specific departures are unverified.`
            : `Planning estimate warning: using an estimated ~${planningEst}m each-way transfer (${estTotal}m total vs ${availablePortMinutes}m available), port return margin is tight and actual transfer time is unverified; needs confirmation.`;

      return {
        evaluated: true,
        fitStatus: "needs_confirmation",
        arrivalMinutesOfDay: arrivalMin,
        returnDeadlineMinutesOfDay: returnDeadlineMin,
        debarkClearanceMinutes,
        transferBeforeMinutes: null,
        transferAfterMinutes: null,
        transferTimeSource: "planning_estimate",
        transferEvidenceSource,
        applicableBerthOrMeetingPoint,
        planningEstimateTransferMinutes: planningEst,
        durationMinutes: params.durationMinutes,
        verifiedDepartureTimes: validStartTimes,
        fittingDepartureTimes: fittingUnderEstimate,
        reason,
      };
    }

    return {
      evaluated: true,
      fitStatus: "needs_confirmation",
      arrivalMinutesOfDay: arrivalMin,
      returnDeadlineMinutesOfDay: returnDeadlineMin,
      debarkClearanceMinutes,
      transferBeforeMinutes: null,
      transferAfterMinutes: null,
      transferTimeSource: "unknown",
      transferEvidenceSource,
      applicableBerthOrMeetingPoint,
      planningEstimateTransferMinutes: null,
      durationMinutes: params.durationMinutes,
      verifiedDepartureTimes: validStartTimes,
      fittingDepartureTimes: fittingUnderEstimate,
      reason:
        "Port-to-meeting-point transfer buffers are unconfirmed; cruise schedule fit requires confirmation.",
    };
  }

  const totalMinimumRequired =
    debarkClearanceMinutes +
    params.transferBeforeMinutes +
    params.durationMinutes +
    params.transferAfterMinutes;

  if (totalMinimumRequired > availablePortMinutes) {
    return {
      evaluated: true,
      fitStatus: "ineligible",
      arrivalMinutesOfDay: arrivalMin,
      returnDeadlineMinutesOfDay: returnDeadlineMin,
      debarkClearanceMinutes,
      transferBeforeMinutes: params.transferBeforeMinutes,
      transferAfterMinutes: params.transferAfterMinutes,
      transferTimeSource,
      transferEvidenceSource,
      applicableBerthOrMeetingPoint,
      planningEstimateTransferMinutes: planningEst,
      durationMinutes: params.durationMinutes,
      verifiedDepartureTimes: params.verifiedDepartureTimes,
      fittingDepartureTimes: [],
      reason: `Exceeds cruise port safety window: requires ${totalMinimumRequired}m (${debarkClearanceMinutes}m debark + ${params.transferBeforeMinutes}m transfer + ${params.durationMinutes}m tour + ${params.transferAfterMinutes}m return transfer) vs ${availablePortMinutes}m available before ${formatMinutesOfDay(returnDeadlineMin)} all-aboard.`,
    };
  }

  // Even when theoretical duration + verified transfer fits the window, actual departure times must be verified to mark as recommended
  if (validStartTimes.length === 0) {
    return {
      evaluated: true,
      fitStatus: "needs_confirmation",
      arrivalMinutesOfDay: arrivalMin,
      returnDeadlineMinutesOfDay: returnDeadlineMin,
      debarkClearanceMinutes,
      transferBeforeMinutes: params.transferBeforeMinutes,
      transferAfterMinutes: params.transferAfterMinutes,
      transferTimeSource,
      transferEvidenceSource,
      applicableBerthOrMeetingPoint,
      planningEstimateTransferMinutes: planningEst,
      durationMinutes: params.durationMinutes,
      verifiedDepartureTimes: [],
      fittingDepartureTimes: [],
      reason: `Duration (${params.durationMinutes}m) and verified transfers (${params.transferBeforeMinutes}m each way) fit within the ${availablePortMinutes}m port window, but actual date-specific departure times have not been verified yet; needs confirmation.`,
    };
  }

  const earliestStartAllowed = arrivalMin + debarkClearanceMinutes + params.transferBeforeMinutes;
  const latestEndAllowed = returnDeadlineMin - params.transferAfterMinutes;
  const fittingDepartureTimes: string[] = [];

  for (const st of validStartTimes) {
    const stMin = parseClockMinutesOfDay(st);
    if (stMin === null) continue;
    if (stMin >= earliestStartAllowed && stMin + params.durationMinutes <= latestEndAllowed) {
      fittingDepartureTimes.push(formatMinutesOfDay(stMin));
    }
  }

  if (fittingDepartureTimes.length === 0) {
    return {
      evaluated: true,
      fitStatus: "ineligible",
      arrivalMinutesOfDay: arrivalMin,
      returnDeadlineMinutesOfDay: returnDeadlineMin,
      debarkClearanceMinutes,
      transferBeforeMinutes: params.transferBeforeMinutes,
      transferAfterMinutes: params.transferAfterMinutes,
      transferTimeSource,
      transferEvidenceSource,
      applicableBerthOrMeetingPoint,
      planningEstimateTransferMinutes: planningEst,
      durationMinutes: params.durationMinutes,
      verifiedDepartureTimes: validStartTimes,
      fittingDepartureTimes: [],
      reason: `Verified departure time(s) [${validStartTimes.join(", ")}] do not fit between earliest post-debark arrival (${formatMinutesOfDay(earliestStartAllowed)}) and latest completion before return transfer (${formatMinutesOfDay(latestEndAllowed - params.durationMinutes)} for ${formatMinutesOfDay(returnDeadlineMin)} all-aboard).`,
    };
  }

  const firstFitMin = parseClockMinutesOfDay(fittingDepartureTimes[0])!;
  const backAtPierMin = firstFitMin + params.durationMinutes + params.transferAfterMinutes;

  return {
    evaluated: true,
    fitStatus: "recommended",
    arrivalMinutesOfDay: arrivalMin,
    returnDeadlineMinutesOfDay: returnDeadlineMin,
    debarkClearanceMinutes,
    transferBeforeMinutes: params.transferBeforeMinutes,
    transferAfterMinutes: params.transferAfterMinutes,
    transferTimeSource,
    transferEvidenceSource,
    applicableBerthOrMeetingPoint,
    planningEstimateTransferMinutes: planningEst,
    durationMinutes: params.durationMinutes,
    verifiedDepartureTimes: validStartTimes,
    fittingDepartureTimes,
    reason: `Verified cruise schedule fit: departure(s) [${fittingDepartureTimes.join(", ")}] + ${params.durationMinutes}m duration + ${params.transferAfterMinutes}m verified return transfer${applicableBerthOrMeetingPoint ? ` (${applicableBerthOrMeetingPoint})` : ""} return to pier by ${formatMinutesOfDay(backAtPierMin)} (before ${formatMinutesOfDay(returnDeadlineMin)} all-aboard deadline).`,
  };
}

function buildAlternativeOptionTradeoffs(params: {
  productOptions: TourProductOptionRecord[];
  selectedOption: TourProductOptionRecord | null;
  record: DurableTourRecord;
  totalGuests: number;
  selectedPriceBasis: PriceBasis;
  selectedUnitPriceCents: number | null;
  selectedTotalPartyPriceCents: number | null;
  selectedFulfillmentType: PickupFulfillmentType;
}): AlternativeOptionTradeoff[] {
  if (!Array.isArray(params.productOptions) || params.productOptions.length <= 1) {
    return [];
  }
  const selectedCode = params.selectedOption?.optionCode || null;
  const selectedBadge = getPickupBadgeLabel(params.selectedFulfillmentType);
  const sorted = sortProductOptionsByPrice(params.productOptions);
  const tradeoffs: AlternativeOptionTradeoff[] = [];

  for (const opt of sorted) {
    if (selectedCode && opt.optionCode === selectedCode) continue;
    const altFulfillment = inferOptionPickupFulfillmentType(opt, params.record);
    const altBadge = getPickupBadgeLabel(altFulfillment);
    const altBasis = opt.priceBasis || params.selectedPriceBasis;
    const altTotal = computeTotalPartyPriceCents(
      opt.fromPriceCents,
      altBasis,
      params.totalGuests,
    );
    const savingsCentsPerPerson =
      params.selectedUnitPriceCents !== null &&
      opt.fromPriceCents !== null &&
      params.selectedUnitPriceCents > opt.fromPriceCents
        ? params.selectedUnitPriceCents - opt.fromPriceCents
        : null;
    const savingsTotalPartyCents =
      params.selectedTotalPartyPriceCents !== null &&
      altTotal !== null &&
      params.selectedTotalPartyPriceCents > altTotal
        ? params.selectedTotalPartyPriceCents - altTotal
        : null;

    let tradeoffSummary: string;
    if (savingsCentsPerPerson !== null && savingsCentsPerPerson > 0) {
      tradeoffSummary = `Saves $${(savingsCentsPerPerson / 100).toFixed(2)}/person${savingsTotalPartyCents !== null ? ` ($${(savingsTotalPartyCents / 100).toFixed(2)} total for ${params.totalGuests} guests)` : ""} via ${altBadge} instead of ${selectedBadge} — requires independent transfer to ${opt.meetingPointName || params.record.meetingPointName || "departure site"}.`;
    } else if (
      params.selectedUnitPriceCents !== null &&
      opt.fromPriceCents !== null &&
      opt.fromPriceCents > params.selectedUnitPriceCents
    ) {
      const diffPerPerson = opt.fromPriceCents - params.selectedUnitPriceCents;
      tradeoffSummary = `Adds ${altBadge} (+$${(diffPerPerson / 100).toFixed(2)}/person) so transportation via ${altBadge.toLowerCase()} is included (${opt.title}).`;
    } else {
      tradeoffSummary = `Alternative option "${opt.title}" (${altBadge}${opt.fromPriceCents !== null ? `, from $${(opt.fromPriceCents / 100).toFixed(2)}` : ""}).`;
    }

    tradeoffs.push({
      optionCode: opt.optionCode,
      title: opt.title,
      fromPriceCents: opt.fromPriceCents,
      totalPartyPriceCents: altTotal,
      savingsCentsPerPerson,
      savingsTotalPartyCents,
      pickupFulfillmentType: altFulfillment,
      pickupBadgeLabel: altBadge,
      durationMinutes: opt.durationMinutes,
      transferTimeSource: opt.transferTimeSource || "unknown",
      tradeoffSummary,
    });
  }

  return tradeoffs;
}

export function buildFareHarborDatePreselectedUrl(
  rawUrl: string,
  date: string | null,
): string {
  if (!rawUrl || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return rawUrl;
  const [yyyy, mm] = date.split("-");
  try {
    const u = new URL(rawUrl);
    if (
      /fareharbor\.com$/i.test(u.hostname) &&
      /\/embeds\/book\/[^/]+\/items\/\d+\/?$/i.test(u.pathname)
    ) {
      const cleanPath = u.pathname.replace(/\/+$/, "");
      u.pathname = `${cleanPath}/calendar/${yyyy}/${mm}/`;
    }
    u.searchParams.set("date", date);
    if (!u.searchParams.has("full-items")) {
      u.searchParams.set("full-items", "yes");
    }
    return u.toString();
  } catch {
    return rawUrl;
  }
}

export function buildCheckoutPreselectionMetadata(params: {
  provider: string;
  boundOffer: BoundTourOfferTuple;
}): CheckoutPreselectionMetadata {
  const { provider, boundOffer } = params;
  const partySummary = `${boundOffer.adults} adult${boundOffer.adults === 1 ? "" : "s"}${
    boundOffer.childAges.length > 0
      ? `, ${boundOffer.childAges.length} child${boundOffer.childAges.length === 1 ? "" : "ren"} (ages ${boundOffer.childAges.join(", ")})`
      : ""
  }`;
  const effectiveDeparture =
    boundOffer.departureTime || boundOffer.availableDepartureTimes[0] || null;
  const requiredSelectionsAtCheckout = {
    date: boundOffer.date,
    partySummary,
    optionTitle: boundOffer.optionTitle,
    optionCode: boundOffer.optionCode,
    departureTime: effectiveDeparture,
    pickupModeLabel: boundOffer.pickupBadgeLabel,
  };

  if (provider === "gosno" || provider === "parr") {
    return {
      provider,
      preselectionSupport: "full_provider_preselection",
      preselectedFields: ["date", "partyComposition", "optionOrVehicle", "pickupLocation"],
      manualSelectionFieldsAtCheckout: [],
      providerDefaultDateBehavior:
        "Direct checkout preselects your travel date, party composition, and vehicle/option via URL parameters.",
      travelerActionSummary: `Direct checkout preselects Date: ${boundOffer.date || "selected date"}, Party: ${partySummary}, and Option: "${boundOffer.optionTitle || "Standard"}".`,
      requiredSelectionsAtCheckout,
    };
  }

  if (provider === "fareharbor") {
    const ym = boundOffer.date ? boundOffer.date.slice(0, 7) : "current";
    return {
      provider,
      preselectionSupport: "partial_provider_preselection",
      preselectedFields: boundOffer.date
        ? ["productItem", "calendarMonth", "targetDateParam"]
        : ["productItem"],
      manualSelectionFieldsAtCheckout: [
        "dayOnCalendar",
        "departureTimeSlot",
        "ticketQuantities",
      ],
      providerDefaultDateBehavior:
        "FareHarbor embed opens directly to the tour item and selected calendar month; click your date and departure time slot on the calendar.",
      travelerActionSummary: `FareHarbor opens to the ${ym} calendar. Click Date: ${boundOffer.date || "your travel date"}, select Departure: ${effectiveDeparture || "your preferred time"}, and enter Guests: ${partySummary}.`,
      requiredSelectionsAtCheckout,
    };
  }

  return {
    provider,
    preselectionSupport: "affiliate_landing_manual_selection_required",
    preselectedFields: ["product", "affiliateAttribution"],
    manualSelectionFieldsAtCheckout: [
      "date",
      "partyComposition",
      "optionTitle",
      "departureTime",
    ],
    providerDefaultDateBehavior:
      "Viator product pages initialize their date selector to today's date by default (ignoring URL date parameters).",
    travelerActionSummary: `Viator opens showing today's date by default. In Viator's availability box, select Date: ${boundOffer.date || "your travel date"}, Travelers: ${partySummary}, Option: "${boundOffer.optionTitle || "Standard"}"${boundOffer.optionCode ? ` (${boundOffer.optionCode})` : ""}${effectiveDeparture ? `, and Departure: ${effectiveDeparture}` : ""}.`,
    requiredSelectionsAtCheckout,
  };
}

function selectChannelOfferForSurface(
  record: DurableTourRecord,
  surface: string,
): ChannelOffer {
  const offers = record.channelOffers || [];
  const exactSurfaceOffer = offers.find((o) => o.channelId === surface);
  if (exactSurfaceOffer) return exactSurfaceOffer;

  if (surface === "welcometotheswamp" || surface === "welcometoneworleanstours") {
    const viatorOffer = offers.find((o) => o.provider === "viator");
    if (viatorOffer) return viatorOffer;
  }

  if (offers.length > 0) return offers[0];

  return {
    channelId: "dcc",
    provider: record.primaryProvider,
    providerProductCode: record.providerProductCode,
    capabilityTier: record.capabilityTier,
    commissionAuthorized: record.commissionAuthorized,
    fromPriceCents: record.fromPriceCents,
    priceBasis: record.priceBasis || "per_person",
    currency: record.currency,
    freeCancellation: record.freeCancellation,
    cancellationCutoffHours: record.cancellationCutoffHours,
    cancellationSummary: record.cancellationSummary,
    inclusions: record.inclusions,
    exclusions: record.exclusions,
    bookingUrl: record.bookingUrl,
  };
}

function sortProductOptionsByPrice(opts: TourProductOptionRecord[]): TourProductOptionRecord[] {
  return [...opts].sort((a, b) => {
    if (a.fromPriceCents === null && b.fromPriceCents === null) return 0;
    if (a.fromPriceCents === null) return 1;
    if (b.fromPriceCents === null) return -1;
    return a.fromPriceCents - b.fromPriceCents;
  });
}

function directCheckoutPreferenceRank(tier: TourCapabilityTier): number {
  switch (tier) {
    case "live_check_direct":
      return 0;
    case "attributable_referral":
      return 1;
    case "live_check_referral":
      return 2;
    case "discovery_only":
    default:
      return 3;
  }
}

export async function matchToursForTrip(input: TripMatchRequest): Promise<TripMatchResponse> {
  const tStart = Date.now();
  const node =
    resolveEarthOSDestinationNode(input.destination || input.portSlug || "new-orleans") ||
    resolveEarthOSDestinationNode("new-orleans")!;

  const dateValidation = validateTravelDateNotPast(input.date, node.timeZone);
  if (!dateValidation.valid) {
    const err = new Error(dateValidation.message || "Invalid travel date.") as Error & {
      code?: string;
      statusCode?: number;
      todayInDestinationTz?: string;
    };
    err.code = dateValidation.errorCode || "INVALID_PAST_DATE";
    err.statusCode = 400;
    err.todayInDestinationTz = dateValidation.todayInDestinationTz;
    throw err;
  }

  recordObservedWidgetOrigin({
    referer: input.referer,
    parentOrigin: input.parentOrigin,
    propertySlug: input.propertySlug,
    surface: input.surface,
  });

  const adults = typeof input.adults === "number" && input.adults >= 1 ? Math.floor(input.adults) : 2;
  const childAges = Array.isArray(input.childAges)
    ? input.childAges.filter((a) => typeof a === "number" && a >= 0 && a <= 17)
    : [];
  const seniors = typeof input.seniors === "number" && input.seniors >= 0 ? Math.floor(input.seniors) : 0;
  const infants = typeof input.infants === "number" && input.infants >= 0 ? Math.floor(input.infants) : 0;
  const youths = typeof input.youths === "number" && input.youths >= 0 ? Math.floor(input.youths) : 0;
  const totalGuests = adults + childAges.length + seniors + infants + youths;

  const surface = input.surface || "dcc";
  const requiresHotelPickup = Boolean(
    input.requiresHotelPickup || input.pickupMode === "hotel_pickup",
  );
  const requiresPierPickup = Boolean(
    input.requiresPierPickup || input.pickupMode === "pier_pickup",
  );
  const effectivePickupMode =
    input.pickupMode ||
    (requiresPierPickup
      ? "pier_pickup"
      : requiresHotelPickup
        ? "hotel_pickup"
        : "any");

  const hasCruiseWindowInput = Boolean(input.shipArrival || input.shipDeparture || input.allAboardTime);
  const portWindowMinutes = input.allAboardTime
    ? parseTimeWindowMinutes(input.shipArrival, input.allAboardTime, true)
    : parseTimeWindowMinutes(input.shipArrival, input.shipDeparture, false);

  const catalogResult = await queryDurableTourCatalog({
    destinationSlug: node.destinationSlug,
    approvedTourIds: input.approvedTourIds,
    category: input.category,
    includeDiscoveryOnly: input.includeDiscoveryOnly !== false,
  });

  const cachedCatalogSearchMs = Date.now() - tStart;

  const guestLat =
    typeof input.hotelLat === "number" && Number.isFinite(input.hotelLat)
      ? input.hotelLat
      : hasCruiseWindowInput && node.cruisePierLat !== null
        ? node.cruisePierLat
        : null;
  const guestLng =
    typeof input.hotelLng === "number" && Number.isFinite(input.hotelLng)
      ? input.hotelLng
      : hasCruiseWindowInput && node.cruisePierLng !== null
        ? node.cruisePierLng
        : null;

  const evaluated: Array<{
    record: DurableTourRecord;
    option: MatchedTourOption;
    allowedOptionCodesForLiveCheck?: string[];
  }> = [];

  for (const rec of catalogResult.records) {
    const explanations: string[] = [];
    const missingInformation: string[] = [];
    let suitability: "recommended" | "needs_confirmation" | "ineligible" = "recommended";
    let score = 70;

    // 1. Party composition, age bands & vehicle seating capacity
    const { paxMix, ineligibleChildAges } = buildViatorPaxMix({
      adultCount: adults,
      childAges,
      seniorCount: seniors,
      infantCount: infants,
      youthCount: youths,
      ageBands: rec.ageBands,
    });

    if (
      typeof rec.constraints?.maxPassengers === "number" &&
      totalGuests > rec.constraints.maxPassengers
    ) {
      suitability = "ineligible";
      score -= 60;
      explanations.push(
        `Ineligible for party size: ${totalGuests} guests exceed maximum vehicle/tour capacity of ${rec.constraints.maxPassengers} passengers.`,
      );
    }

    if (childAges.length > 0) {
      const minAge = rec.constraints?.minAgeYears;
      const youngest = Math.min(...childAges);
      if (
        (typeof minAge === "number" && youngest < minAge) ||
        ineligibleChildAges.length > 0
      ) {
        suitability = "ineligible";
        score -= 60;
        explanations.push(
          `Ineligible for party: youngest child is ${youngest}, minimum required age is ${minAge ?? "restricted by age bands"}.`,
        );
      } else if (rec.ageBands.length > 0) {
        score += 8;
        explanations.push(
          `Party composition (${adults} adult${adults === 1 ? "" : "s"}, child ages [${childAges.join(", ")}]) mapped to verified provider age bands (${paxMix.map((p) => `${p.numberOfTravelers}x ${p.ageBand}`).join(", ")}).`,
        );
      } else {
        if (suitability === "recommended") suitability = "needs_confirmation";
        missingInformation.push("age_band_policy_unknown");
        explanations.push(
          "Provider age-band breakdown is not specified in catalog; child pricing/eligibility requires operator confirmation.",
        );
      }
    } else {
      explanations.push(`Configured for ${totalGuests} adult traveler${totalGuests === 1 ? "" : "s"}.`);
    }

    // 2. Pickup & Option-Level Fulfillment Matching (distinguishing pier_pickup, hotel_pickup, downtown_shuttle_departure, self_drive)
    let distanceFromGuestKm: number | null = null;
    let nearestPickupPointName: string | null = null;

    if (guestLat !== null && guestLng !== null) {
      if (rec.pickupLocations.length > 0) {
        let bestDist: number | null = null;
        for (const pl of rec.pickupLocations) {
          if (pl.lat !== null && pl.lng !== null && pl.precision !== "unknown") {
            const d = haversineKm(guestLat, guestLng, pl.lat, pl.lng);
            if (bestDist === null || d < bestDist) {
              bestDist = d;
              nearestPickupPointName = pl.name;
            }
          }
        }
        if (bestDist !== null) {
          distanceFromGuestKm = bestDist;
        }
      }
      if (
        distanceFromGuestKm === null &&
        rec.meetingPointLat !== null &&
        rec.meetingPointLng !== null &&
        rec.locationPrecision !== "unknown"
      ) {
        distanceFromGuestKm = haversineKm(
          guestLat,
          guestLng,
          rec.meetingPointLat,
          rec.meetingPointLng,
        );
        nearestPickupPointName = rec.meetingPointName;
      }
    }

    const selectedOffer = selectChannelOfferForSurface(rec, surface);
    const productOptions: TourProductOptionRecord[] = (
      Array.isArray(rec.productOptions) ? rec.productOptions : []
    ).map((opt) => ({
      ...opt,
      pickupFulfillmentType: inferOptionPickupFulfillmentType(opt, rec),
    }));

    const baseFromPriceCents = selectedOffer.fromPriceCents ?? rec.fromPriceCents;
    const priceBasis: PriceBasis =
      selectedOffer.priceBasis || rec.priceBasis || "per_person";

    let selectedProductOption: TourProductOptionRecord | null = null;
    let quotedFromPriceCents: number | null = baseFromPriceCents;
    let quotedDurationMinutes: number | null = rec.durationMinutes;
    let allowedOptionCodesForLiveCheck: string[] | undefined = undefined;
    const lowestPriceIncludesPickup =
      rec.lowestPriceIncludesPickup !== undefined
        ? rec.lowestPriceIncludesPickup
        : rec.hasHotelPickup === false
          ? false
          : null;

    if (effectivePickupMode === "pier_pickup") {
      const pierOpts = productOptions.filter(
        (o) => o.pickupFulfillmentType === "pier_pickup",
      );
      if (pierOpts.length > 0) {
        selectedProductOption = sortProductOptionsByPrice(pierOpts)[0];
        allowedOptionCodesForLiveCheck = pierOpts.map((o) => o.optionCode);
        quotedFromPriceCents = selectedProductOption.fromPriceCents ?? baseFromPriceCents;
        if (selectedProductOption.durationMinutes !== null) {
          quotedDurationMinutes = selectedProductOption.durationMinutes;
        }
        score += 15;
        explanations.push(
          `Matched cruise pier pickup requirement to option "${selectedProductOption.title}" (${selectedProductOption.optionCode}).`,
        );
      } else if (rec.pickupType === "CRUISE_PIER_PICKUP" || rec.pickupFulfillmentType === "pier_pickup") {
        score += 15;
        explanations.push(
          rec.pickupSummary || "Includes direct cruise pier shuttle pickup.",
        );
      } else {
        if (productOptions.length > 0) {
          selectedProductOption = sortProductOptionsByPrice(productOptions)[0];
          quotedFromPriceCents = selectedProductOption.fromPriceCents ?? baseFromPriceCents;
          if (selectedProductOption.durationMinutes !== null) {
            quotedDurationMinutes = selectedProductOption.durationMinutes;
          }
          allowedOptionCodesForLiveCheck = [selectedProductOption.optionCode];
        }
        if (suitability === "recommended") suitability = "needs_confirmation";
        score -= 15;
        missingInformation.push("pier_pickup_not_offered");
        explanations.push(
          "Direct cruise pier pickup is not confirmed for this tour; guest must arrange transfer to meeting or shuttle departure point.",
        );
      }
    } else if (effectivePickupMode === "hotel_pickup") {
      const doorToDoorHotelOpts = productOptions.filter(
        (o) => o.pickupFulfillmentType === "hotel_pickup",
      );
      const downtownShuttleOpts = productOptions.filter(
        (o) => o.pickupFulfillmentType === "downtown_shuttle_departure",
      );

      if (doorToDoorHotelOpts.length > 0) {
        selectedProductOption = sortProductOptionsByPrice(doorToDoorHotelOpts)[0];
        allowedOptionCodesForLiveCheck = doorToDoorHotelOpts.map((o) => o.optionCode);
        quotedFromPriceCents = selectedProductOption.fromPriceCents;
        if (selectedProductOption.durationMinutes !== null) {
          quotedDurationMinutes = selectedProductOption.durationMinutes;
        }
        if (quotedFromPriceCents !== null) {
          score += 15;
          explanations.push(
            `Matched hotel pickup requirement to option "${selectedProductOption.title}" (${selectedProductOption.optionCode}) at $${(quotedFromPriceCents / 100).toFixed(2)} (${selectedProductOption.priceBasis || priceBasis}).`,
          );
        } else {
          if (suitability === "recommended") suitability = "needs_confirmation";
          missingInformation.push("pickup_option_price_unverified");
          explanations.push(
            `Matched hotel pickup option "${selectedProductOption.title}" (${selectedProductOption.optionCode}), but option-specific price requires live date confirmation.`,
          );
        }
      } else if (downtownShuttleOpts.length > 0) {
        // Distinguish downtown shuttle departure (e.g. 3780AIRBOAT TG1 at 400 Toulouse St) from door-to-door hotel pickup!
        selectedProductOption = sortProductOptionsByPrice(downtownShuttleOpts)[0];
        allowedOptionCodesForLiveCheck = downtownShuttleOpts.map((o) => o.optionCode);
        quotedFromPriceCents = selectedProductOption.fromPriceCents;
        if (selectedProductOption.durationMinutes !== null) {
          quotedDurationMinutes = selectedProductOption.durationMinutes;
        }
        if (suitability === "recommended") suitability = "needs_confirmation";
        missingInformation.push("downtown_shuttle_departure_not_door_to_door_hotel_pickup");
        explanations.push(
          `Selected option "${selectedProductOption.title}" (${selectedProductOption.optionCode}${quotedFromPriceCents !== null ? ` at $${(quotedFromPriceCents / 100).toFixed(2)}` : ""}) departs from a central downtown shuttle hub (${selectedProductOption.meetingPointName || rec.meetingPointName || "400 Toulouse St"}), not door-to-door hotel pickup.`,
        );
      } else if (rec.hasHotelPickup === true) {
        if (lowestPriceIncludesPickup === false) {
          quotedFromPriceCents = null;
          if (suitability === "recommended") suitability = "needs_confirmation";
          missingInformation.push("pickup_option_price_unverified");
          explanations.push(
            "Hotel pickup is an optional upgrade on this tour; the lowest-priced option is self-drive and pickup option pricing requires confirmation.",
          );
        } else if (lowestPriceIncludesPickup === true) {
          score += 15;
          explanations.push(
            rec.pickupSummary || "Includes hotel pickup service in base price.",
          );
        } else {
          if (suitability === "recommended") suitability = "needs_confirmation";
          missingInformation.push("pickup_option_price_unverified");
          explanations.push(
            "Hotel pickup is offered, but whether the lowest price includes pickup has not been verified at the option level.",
          );
        }
      } else if (rec.hasHotelPickup === false) {
        if (productOptions.length > 0) {
          selectedProductOption = sortProductOptionsByPrice(productOptions)[0];
          quotedFromPriceCents = selectedProductOption.fromPriceCents ?? baseFromPriceCents;
          if (selectedProductOption.durationMinutes !== null) {
            quotedDurationMinutes = selectedProductOption.durationMinutes;
          }
          allowedOptionCodesForLiveCheck = [selectedProductOption.optionCode];
        }
        if (suitability === "recommended") suitability = "needs_confirmation";
        score -= 18;
        missingInformation.push("hotel_pickup_not_offered");
        if (distanceFromGuestKm !== null && rec.meetingPointName) {
          explanations.push(
            `Self-drive / meeting-point only (no hotel pickup). Guest must travel ${distanceFromGuestKm} km to ${rec.meetingPointName}.`,
          );
        } else {
          explanations.push(
            "Self-drive / meeting-point only (no hotel pickup); requires independent transport to departure point.",
          );
        }
      } else {
        if (suitability === "recommended") suitability = "needs_confirmation";
        score -= 10;
        missingInformation.push("unknown_pickup_coverage");
        explanations.push(
          "Pickup coverage is unknown in catalog; confirm hotel pickup directly before booking.",
        );
      }
    } else if (effectivePickupMode === "downtown_shuttle_departure") {
      const shuttleOpts = productOptions.filter(
        (o) => o.pickupFulfillmentType === "downtown_shuttle_departure",
      );
      if (shuttleOpts.length > 0) {
        selectedProductOption = sortProductOptionsByPrice(shuttleOpts)[0];
        allowedOptionCodesForLiveCheck = shuttleOpts.map((o) => o.optionCode);
        quotedFromPriceCents = selectedProductOption.fromPriceCents;
        if (selectedProductOption.durationMinutes !== null) {
          quotedDurationMinutes = selectedProductOption.durationMinutes;
        }
        score += 12;
        explanations.push(
          `Matched downtown shuttle departure option "${selectedProductOption.title}" (${selectedProductOption.optionCode}).`,
        );
      } else {
        if (productOptions.length > 0) {
          selectedProductOption = sortProductOptionsByPrice(productOptions)[0];
          quotedFromPriceCents = selectedProductOption.fromPriceCents ?? baseFromPriceCents;
          if (selectedProductOption.durationMinutes !== null) {
            quotedDurationMinutes = selectedProductOption.durationMinutes;
          }
          allowedOptionCodesForLiveCheck = [selectedProductOption.optionCode];
        }
        if (suitability === "recommended") suitability = "needs_confirmation";
        missingInformation.push("downtown_shuttle_option_not_offered");
      }
    } else if (effectivePickupMode === "self_drive") {
      const selfDriveOpts = productOptions.filter(
        (o) => o.pickupFulfillmentType === "self_drive",
      );
      if (selfDriveOpts.length > 0) {
        selectedProductOption = sortProductOptionsByPrice(selfDriveOpts)[0];
        allowedOptionCodesForLiveCheck = selfDriveOpts.map((o) => o.optionCode);
        quotedFromPriceCents = selectedProductOption.fromPriceCents ?? baseFromPriceCents;
        if (selectedProductOption.durationMinutes !== null) {
          quotedDurationMinutes = selectedProductOption.durationMinutes;
        }
        score += 10;
        explanations.push(
          `Selected self-drive / meet-on-site option "${selectedProductOption.title}" (${selectedProductOption.optionCode}).`,
        );
      } else if (productOptions.length > 0) {
        selectedProductOption = sortProductOptionsByPrice(productOptions)[0];
        quotedFromPriceCents = selectedProductOption.fromPriceCents ?? baseFromPriceCents;
        if (selectedProductOption.durationMinutes !== null) {
          quotedDurationMinutes = selectedProductOption.durationMinutes;
        }
        allowedOptionCodesForLiveCheck = [selectedProductOption.optionCode];
      }
    } else {
      // Guest did not specify a required pickup mode ("any"); select lowest-priced option and bind to it
      if (productOptions.length > 0) {
        selectedProductOption = sortProductOptionsByPrice(productOptions)[0];
        allowedOptionCodesForLiveCheck = [selectedProductOption.optionCode];
        if (selectedProductOption.fromPriceCents !== null) {
          quotedFromPriceCents = selectedProductOption.fromPriceCents;
        }
        if (selectedProductOption.durationMinutes !== null) {
          quotedDurationMinutes = selectedProductOption.durationMinutes;
        }
        if (selectedProductOption.pickupFulfillmentType === "self_drive" && rec.hasHotelPickup === true) {
          explanations.push(
            `Lowest-priced option "${selectedProductOption.title}" (${selectedProductOption.optionCode}) is self-drive / meet-on-site only (does not include optional hotel or downtown shuttle transportation).`,
          );
        }
      } else if (rec.hasHotelPickup === null) {
        missingInformation.push("unknown_pickup_coverage");
      }
    }

    if (distanceFromGuestKm !== null && nearestPickupPointName) {
      explanations.push(
        `Nearest verified pickup/hub: ${nearestPickupPointName} (${distanceFromGuestKm} km away).`,
      );
    }

    const effectivePickupFulfillmentType: PickupFulfillmentType = inferOptionPickupFulfillmentType(
      selectedProductOption,
      rec,
    );
    const effectivePickupBadgeLabel = getPickupBadgeLabel(effectivePickupFulfillmentType);

    const effectiveMeetingLat =
      selectedProductOption?.meetingPointLat ?? rec.meetingPointLat ?? null;
    const effectiveMeetingLng =
      selectedProductOption?.meetingPointLng ?? rec.meetingPointLng ?? null;
    const effectiveMeetingName =
      selectedProductOption?.meetingPointName ?? rec.meetingPointName ?? null;

    if (
      effectiveMeetingLat === null ||
      effectiveMeetingLng === null
    ) {
      missingInformation.push("unknown_meeting_point_coordinates");
    }

    // Resolve option-level or tour-level transfer buffers & provenance (never fabricate verified status or fallback minutes)
    const rawTransferTimeSource: TransferTimeSource =
      selectedProductOption?.transferTimeSource ||
      rec.constraints?.transferTimeSource ||
      "unknown";

    const rawTransferBefore: number | null =
      selectedProductOption?.transferBeforeMinutes !== undefined
        ? selectedProductOption.transferBeforeMinutes
        : rec.constraints?.cruiseBufferBeforeMinutes !== undefined
          ? rec.constraints.cruiseBufferBeforeMinutes
          : null;

    const rawTransferAfter: number | null =
      selectedProductOption?.transferAfterMinutes !== undefined
        ? selectedProductOption.transferAfterMinutes
        : rec.constraints?.cruiseBufferAfterMinutes !== undefined
          ? rec.constraints.cruiseBufferAfterMinutes
          : null;

    const effectivePlanningEstimateTransferMinutes: number | null =
      selectedProductOption?.planningEstimateTransferMinutes !== undefined
        ? selectedProductOption.planningEstimateTransferMinutes
        : rec.constraints?.planningEstimateTransferMinutes !== undefined
          ? rec.constraints.planningEstimateTransferMinutes
          : null;

    const explicitEvidenceSource: string | null =
      selectedProductOption?.transferEvidenceSource ??
      rec.constraints?.transferEvidenceSource ??
      null;

    const rawProductBerthOrHub = rec.constraints?.applicableBerthOrMeetingPoint ?? null;
    const effectiveApplicableBerthOrMeetingPoint: string | null =
      selectedProductOption?.applicableBerthOrMeetingPoint ??
      (effectivePickupFulfillmentType === "hotel_pickup" &&
      rawProductBerthOrHub &&
      /self-drive/i.test(rawProductBerthOrHub)
        ? "French Quarter / Downtown New Orleans Hotel Shuttle Pickup & Return Zone (round-trip shuttle included)"
        : rawProductBerthOrHub) ??
      (effectiveMeetingName && effectiveMeetingLat !== null ? effectiveMeetingName : null);

    const hasVerifiedTransferSupport =
      (rawTransferTimeSource === "verified_pier_pickup" ||
        rawTransferTimeSource === "verified_meeting_point") &&
      rawTransferBefore !== null &&
      rawTransferAfter !== null;

    const cruiseVerifiedEvidenceSource: string | null = hasVerifiedTransferSupport
      ? explicitEvidenceSource ||
        `catalog_verified_schedule:${rec.primaryProvider}:${rec.providerProductCode}`
      : null;

    const effectiveTransferEvidenceSource: string | null = hasVerifiedTransferSupport
      ? cruiseVerifiedEvidenceSource
      : !hasCruiseWindowInput
        ? explicitEvidenceSource
        : null;

    const effectiveTransferTimeSource: TransferTimeSource = hasVerifiedTransferSupport
      ? rawTransferTimeSource
      : effectivePlanningEstimateTransferMinutes !== null
        ? "planning_estimate"
        : "unknown";

    const effectiveTransferBeforeMinutes: number | null = hasVerifiedTransferSupport
      ? rawTransferBefore
      : null;

    const effectiveTransferAfterMinutes: number | null = hasVerifiedTransferSupport
      ? rawTransferAfter
      : null;

    const initialTitleTimeSemantics = detectOptionTitleTimeSemantics(
      selectedProductOption?.title || null,
      selectedProductOption?.scheduledStartTimes || [],
    );
    if (
      initialTitleTimeSemantics.semantics === "pickup_or_checkin_unverified_as_departure" &&
      initialTitleTimeSemantics.explanation
    ) {
      explanations.push(initialTitleTimeSemantics.explanation);
    }

    // 3. Duration & Preliminary Cruise Schedule Fit (before live check startTimes are populated)
    let cruiseFit: CruiseScheduleFitEvaluation | undefined = undefined;
    if (hasCruiseWindowInput) {
      cruiseFit = evaluateCruiseScheduleFit({
        shipArrival: input.shipArrival,
        shipDeparture: input.shipDeparture,
        allAboardTime: input.allAboardTime,
        durationMinutes: quotedDurationMinutes,
        transferBeforeMinutes: effectiveTransferBeforeMinutes,
        transferAfterMinutes: effectiveTransferAfterMinutes,
        transferTimeSource: effectiveTransferTimeSource,
        transferEvidenceSource: cruiseVerifiedEvidenceSource,
        applicableBerthOrMeetingPoint: effectiveApplicableBerthOrMeetingPoint,
        planningEstimateTransferMinutes: effectivePlanningEstimateTransferMinutes,
        verifiedDepartureTimes: [],
      });
      if (cruiseFit.fitStatus === "ineligible") {
        suitability = "ineligible";
        score -= 50;
        explanations.push(cruiseFit.reason);
      } else if (cruiseFit.fitStatus === "needs_confirmation") {
        if (quotedDurationMinutes === null) {
          missingInformation.push("unknown_duration_minutes");
        }
        if (
          effectiveTransferBeforeMinutes === null ||
          effectiveTransferAfterMinutes === null ||
          effectiveTransferTimeSource === "unknown" ||
          effectiveTransferTimeSource === "planning_estimate"
        ) {
          missingInformation.push("unknown_cruise_transfer_buffers");
        }
        if (!cruiseFit.verifiedDepartureTimes || cruiseFit.verifiedDepartureTimes.length === 0) {
          missingInformation.push("date_specific_departure_times_unverified");
        }
        if (suitability === "recommended") {
          suitability = "needs_confirmation";
        }
        explanations.push(cruiseFit.reason);
      }
    } else if (quotedDurationMinutes === null) {
      missingInformation.push("unknown_duration_minutes");
    } else {
      explanations.push(
        `Verified duration: ${rec.durationRawText || `${quotedDurationMinutes} minutes`}.`,
      );
    }

    // 4. Cancellation explicit unknown check
    if (rec.freeCancellation === null) {
      missingInformation.push("unknown_cancellation_policy");
    } else if (rec.freeCancellation === true) {
      score += 4;
    }

    // 5. Weight & Wheelchair constraints
    if (
      typeof input.maxPassengerWeightLbs === "number" &&
      typeof rec.constraints?.maxPassengerWeightLbs === "number" &&
      input.maxPassengerWeightLbs > rec.constraints.maxPassengerWeightLbs
    ) {
      if (suitability === "recommended") suitability = "needs_confirmation";
      score -= 12;
      missingInformation.push("weight_surcharge_or_limit_confirmation_required");
      explanations.push(
        `Operator specifies a ${rec.constraints.maxPassengerWeightLbs} lb per-passenger limit/surcharge threshold (traveler weight: ${input.maxPassengerWeightLbs} lbs).`,
      );
    }

    if (input.requiresWheelchair) {
      if (rec.constraints?.wheelchairAccessible === false) {
        suitability = "ineligible";
        score -= 50;
        explanations.push("Not wheelchair accessible per operator equipment specifications.");
      } else if (rec.constraints?.wheelchairAccessible === null) {
        if (suitability === "recommended") suitability = "needs_confirmation";
        missingInformation.push("unknown_wheelchair_accessibility");
        explanations.push("Wheelchair accessibility is unknown; verify with operator prior to booking.");
      } else {
        score += 10;
        explanations.push("Verified wheelchair-accessible experience.");
      }
    }

    // Tour-fit ranking is strictly independent of commission: score reflects data completeness, verified transfer evidence & guest rating only
    if (quotedDurationMinutes !== null) score += 4;
    if (effectiveMeetingLat !== null && effectiveMeetingLng !== null) score += 4;
    if (hasVerifiedTransferSupport && (hasCruiseWindowInput || requiresPierPickup)) score += 8;
    if (typeof rec.ratingAverage === "number" && rec.ratingAverage >= 4.7) score += 4;

    const effectivePriceBasis = selectedProductOption?.priceBasis || priceBasis;
    const initialTotalPartyPriceCents = computeTotalPartyPriceCents(
      quotedFromPriceCents,
      effectivePriceBasis,
      totalGuests,
    );
    const currency = selectedOffer.currency || rec.currency || "USD";

    const alternativeOptionTradeoffs = buildAlternativeOptionTradeoffs({
      productOptions,
      selectedOption: selectedProductOption,
      record: rec,
      totalGuests,
      selectedPriceBasis: effectivePriceBasis,
      selectedUnitPriceCents: quotedFromPriceCents,
      selectedTotalPartyPriceCents: initialTotalPartyPriceCents,
      selectedFulfillmentType: effectivePickupFulfillmentType,
    });
    const cheapestSavingAlt = alternativeOptionTradeoffs.find(
      (t) => t.savingsCentsPerPerson !== null && t.savingsCentsPerPerson > 0,
    );
    if (cheapestSavingAlt) {
      explanations.push(`Cheaper option tradeoff: ${cheapestSavingAlt.tradeoffSummary}`);
    }

    const boundOffer: BoundTourOfferTuple = {
      provider: rec.primaryProvider,
      tourId: rec.tourId,
      providerProductCode: rec.providerProductCode,
      optionCode: selectedProductOption?.optionCode || null,
      optionTitle: selectedProductOption?.title || rec.title,
      pickupFulfillmentType: effectivePickupFulfillmentType,
      pickupBadgeLabel: effectivePickupBadgeLabel,
      includesPickup: selectedProductOption?.includesPickup ?? rec.hasHotelPickup,
      date: input.date || null,
      departureTime: null,
      availableDepartureTimes: selectedProductOption?.scheduledStartTimes || [],
      fittingDepartureTimes: [],
      optionTitleTimeSemantics: initialTitleTimeSemantics,
      adults,
      childAges,
      totalGuests,
      paxMix,
      durationMinutes: quotedDurationMinutes,
      durationRawText:
        quotedDurationMinutes !== null ? `${quotedDurationMinutes}m` : rec.durationRawText,
      unitPriceCents: quotedFromPriceCents,
      totalPartyPriceCents: initialTotalPartyPriceCents,
      priceBasis: effectivePriceBasis,
      currency,
      priceVerifiedLive: false,
      transferBeforeMinutes: effectiveTransferBeforeMinutes,
      transferAfterMinutes: effectiveTransferAfterMinutes,
      transferTimeSource: effectiveTransferTimeSource,
      transferEvidenceSource: effectiveTransferEvidenceSource,
      applicableBerthOrMeetingPoint: effectiveApplicableBerthOrMeetingPoint,
      planningEstimateTransferMinutes: effectivePlanningEstimateTransferMinutes,
    };

    const initialHandoffUrl = selectedOffer.bookingUrl || rec.bookingUrl;
    const initialPreselection = buildCheckoutPreselectionMetadata({
      provider: rec.primaryProvider,
      boundOffer,
    });

    const option: MatchedTourOption = {
      tourId: rec.tourId,
      compatibilityAliases: rec.compatibilityAliases,
      title: rec.title,
      summary: rec.summary,
      category: rec.category,
      destinationSlug: rec.destinationSlug,
      portSlug: rec.portSlug,
      earthosDestinationNodeId: rec.earthosDestinationNodeId,
      timeZone: rec.timeZone,
      primaryProvider: rec.primaryProvider,
      providerProductCode: rec.providerProductCode,
      operatorName: rec.operatorName,
      capabilityTier: rec.capabilityTier,
      commissionAuthorized: rec.commissionAuthorized,
      suitability,
      matchScore: Math.max(0, Math.min(100, score)),
      explanations,
      missingInformation,
      partyCompositionApplied: {
        totalGuests,
        paxMix,
      },
      pricing: {
        fromPriceCents: quotedFromPriceCents,
        totalPartyPriceCents: initialTotalPartyPriceCents,
        priceBasis: effectivePriceBasis,
        lowestPriceIncludesPickup,
        currency,
        selectedChannelId: selectedOffer.channelId,
        selectedOptionCode: selectedProductOption?.optionCode || null,
        selectedOptionTitle: selectedProductOption?.title || null,
        selectedOptionIncludesPickup: selectedProductOption?.includesPickup ?? null,
        selectedOptionPickupFulfillmentType: effectivePickupFulfillmentType,
        selectedOptionPickupBadgeLabel: effectivePickupBadgeLabel,
      },
      boundOffer,
      selectedProductOption,
      productOptions,
      alternativeOptionTradeoffs,
      serviceDetails: rec.serviceDetails || {},
      duration: {
        durationMinutes: quotedDurationMinutes,
        durationRawText: rec.durationRawText,
        status: quotedDurationMinutes !== null ? "known" : "unknown",
      },
      cancellation: {
        freeCancellation: selectedOffer.freeCancellation ?? rec.freeCancellation,
        policyType: rec.cancellationPolicyType,
        cutoffHours: selectedOffer.cancellationCutoffHours ?? rec.cancellationCutoffHours,
        summary: selectedOffer.cancellationSummary ?? rec.cancellationSummary,
        status:
          (selectedOffer.freeCancellation ?? rec.freeCancellation) !== null ? "known" : "unknown",
      },
      pickupAndLocation: {
        hasHotelPickup: rec.hasHotelPickup,
        lowestPriceIncludesPickup,
        pickupType: rec.pickupType,
        pickupFulfillmentType: effectivePickupFulfillmentType,
        pickupBadgeLabel: effectivePickupBadgeLabel,
        pickupSummary: rec.pickupSummary,
        meetingPointName: effectiveMeetingName,
        meetingPointAddress: rec.meetingPointAddress,
        meetingPointLat: effectiveMeetingLat,
        meetingPointLng: effectiveMeetingLng,
        locationPrecision:
          effectiveMeetingLat !== null && effectiveMeetingLng !== null
            ? "exact"
            : rec.locationPrecision,
        distanceFromGuestKm,
        nearestPickupPointName,
        transferEvidenceSource: effectiveTransferEvidenceSource,
        applicableBerthOrMeetingPoint: effectiveApplicableBerthOrMeetingPoint,
      },
      cruiseScheduleFit: cruiseFit,
      channelOffers: rec.channelOffers,
      shortlistLiveCheck: {
        checked: false,
        status: "unknown_unchecked",
        provider: rec.primaryProvider,
        available: null,
        bookableSlotsCount: null,
        earliestStartTime: null,
        startTimes: [],
        liveFromPriceCents: null,
        latencyMs: 0,
        note: input.date
          ? "Date-specific availability check not performed for this candidate; availability is unknown."
          : "No travel date supplied; showing cached durable catalog.",
      },
      bookingPath: {
        clickId: null,
        handoffUrl: initialHandoffUrl,
        trackedClickUrl: initialHandoffUrl,
        sellerIdentity:
          selectedOffer.provider === "viator"
            ? "Viator (Tracked Affiliate Checkout)"
            : selectedOffer.provider === "fareharbor"
              ? "FareHarbor Authorized Direct Checkout"
              : rec.operatorName || "Operator Direct",
        operatorIdentity: rec.operatorName || rec.primaryProvider,
        capabilityTier: rec.capabilityTier,
        outcomeReportingMode:
          rec.capabilityTier === "live_check_referral"
            ? "tracked_viator_checkout_referral"
            : rec.primaryProvider === "fareharbor"
              ? "authorized_fareharbor_direct"
              : rec.primaryProvider === "gosno" || rec.primaryProvider === "parr"
                ? "internal_satellite_webhook_reconciled"
                : rec.capabilityTier === "attributable_referral"
                  ? "attributable_operator_referral"
                  : "untracked_discovery_link",
        checkoutPreselection: initialPreselection,
      },
      primaryImageUrl: rec.primaryImageUrl,
      ratingAverage: rec.ratingAverage,
      reviewCount: rec.reviewCount,
    };

    evaluated.push({ record: rec, option, allowedOptionCodesForLiveCheck });
  }

  // Sort by suitability first, then tour-fit matchScore descending (independent of commission),
  // using direct checkout preference as a tie-breaker when tour-fit is equivalent.
  const suitabilityOrder = { recommended: 0, needs_confirmation: 1, ineligible: 2 };
  const compareEvaluatedCandidates = (
    a: { record: DurableTourRecord; option: MatchedTourOption },
    b: { record: DurableTourRecord; option: MatchedTourOption },
  ) => {
    const sa = suitabilityOrder[a.option.suitability];
    const sb = suitabilityOrder[b.option.suitability];
    if (sa !== sb) return sa - sb;
    if (Math.abs(b.option.matchScore - a.option.matchScore) > 2) {
      return b.option.matchScore - a.option.matchScore;
    }
    const da = directCheckoutPreferenceRank(a.option.capabilityTier);
    const db = directCheckoutPreferenceRank(b.option.capabilityTier);
    if (da !== db) return da - db;
    return b.option.matchScore - a.option.matchScore;
  };

  evaluated.sort(compareEvaluatedCandidates);

  // 6. Authorized Shortlist-only Live Availability Check (when date is provided)
  // Prioritize suitable candidates with verified transfer arrangements for limited live-check calls.
  const shortlistMax =
    typeof input.shortlistMaxCount === "number" && input.shortlistMaxCount >= 0
      ? Math.min(input.shortlistMaxCount, 8)
      : 4;
  const shouldLiveCheck = Boolean(
    input.date && input.enableShortlistLiveCheck !== false && shortlistMax > 0,
  );

  let shortlistCheckedCount = 0;
  let upstreamRequestsMade = 0;
  const tLiveStart = Date.now();

  if (shouldLiveCheck && input.date) {
    const shortlistCandidates = evaluated
      .filter(({ record, option }) => {
        if (option.suitability === "ineligible") return false;
        const hasViator =
          record.primaryProvider === "viator" ||
          record.channelOffers.some((o) => o.provider === "viator");
        const hasFareHarbor = record.primaryProvider === "fareharbor";
        return (
          (option.capabilityTier === "live_check_referral" && hasViator) ||
          (option.capabilityTier === "live_check_direct" && hasFareHarbor)
        );
      })
      .sort((a, b) => {
        if (hasCruiseWindowInput || requiresPierPickup) {
          const aVerifiedTransfer =
            a.option.boundOffer.transferTimeSource === "verified_pier_pickup" ||
            a.option.boundOffer.transferTimeSource === "verified_meeting_point"
              ? 0
              : 1;
          const bVerifiedTransfer =
            b.option.boundOffer.transferTimeSource === "verified_pier_pickup" ||
            b.option.boundOffer.transferTimeSource === "verified_meeting_point"
              ? 0
              : 1;
          if (aVerifiedTransfer !== bVerifiedTransfer) {
            return aVerifiedTransfer - bVerifiedTransfer;
          }
        }
        return compareEvaluatedCandidates(a, b);
      })
      .slice(0, shortlistMax);

    for (const { record, option, allowedOptionCodesForLiveCheck } of shortlistCandidates) {
      const tItem = Date.now();
      const viatorOffer = record.channelOffers.find((o) => o.provider === "viator");
      const viatorCode =
        record.primaryProvider === "viator"
          ? record.providerProductCode
          : viatorOffer?.providerProductCode || null;

      if (viatorCode) {
        shortlistCheckedCount += 1;
        upstreamRequestsMade += 1;
        const liveRes = await checkDccLiveAvailability({
          siteId:
            surface === "welcometotheswamp" ||
            surface === "welcometoneworleanstours" ||
            surface === "juneau-flight-deck" ||
            surface === "cruisepromenade"
              ? surface
              : "dcc",
          internalProductId: record.compatibilityAliases[0] || viatorCode,
          viatorProductCode: viatorCode,
          bookingDate: input.date,
          adultCount: adults,
          childAges,
          seniorCount: seniors,
          infantCount: infants,
          youthCount: youths,
          ageBands: record.ageBands,
          allowedProductOptionCodes: allowedOptionCodesForLiveCheck,
          currency: "USD",
        });

        const itemLatency = Date.now() - tItem;
        const allOpenOpts = Array.isArray(liveRes.bookableOptions)
          ? liveRes.bookableOptions.filter((o) => o.available)
          : [];

        const selectedCodeUpper = option.selectedProductOption?.optionCode?.toUpperCase() || null;
        let boundOpenOpts = selectedCodeUpper
          ? allOpenOpts.filter((o) => String(o.optionCode || "").toUpperCase() === selectedCodeUpper)
          : allOpenOpts;

        if (boundOpenOpts.length === 0 && allOpenOpts.length > 0) {
          const fallbackCodeUpper = String(allOpenOpts[0].optionCode || "").toUpperCase();
          boundOpenOpts = allOpenOpts.filter(
            (o) => String(o.optionCode || "").toUpperCase() === fallbackCodeUpper,
          );
          const matchedCatalogOpt = option.productOptions.find(
            (po) => po.optionCode.toUpperCase() === fallbackCodeUpper,
          );
          if (matchedCatalogOpt) {
            option.selectedProductOption = matchedCatalogOpt;
            const newFulfillment = inferOptionPickupFulfillmentType(matchedCatalogOpt, record);
            const newBadge = getPickupBadgeLabel(newFulfillment);
            const newRawTransferSource = matchedCatalogOpt.transferTimeSource || "unknown";
            const newHasVerifiedTransfer =
              (newRawTransferSource === "verified_pier_pickup" ||
                newRawTransferSource === "verified_meeting_point") &&
              matchedCatalogOpt.transferBeforeMinutes !== null &&
              matchedCatalogOpt.transferAfterMinutes !== null;

            option.pricing.selectedOptionCode = matchedCatalogOpt.optionCode;
            option.pricing.selectedOptionTitle = matchedCatalogOpt.title;
            option.pricing.selectedOptionIncludesPickup = matchedCatalogOpt.includesPickup;
            option.pricing.selectedOptionPickupFulfillmentType = newFulfillment;
            option.pricing.selectedOptionPickupBadgeLabel = newBadge;
            option.pickupAndLocation.pickupFulfillmentType = newFulfillment;
            option.pickupAndLocation.pickupBadgeLabel = newBadge;
            option.pickupAndLocation.transferEvidenceSource = newHasVerifiedTransfer
              ? matchedCatalogOpt.transferEvidenceSource ??
                `catalog_verified_schedule:${record.primaryProvider}:${record.providerProductCode}`
              : null;
            option.pickupAndLocation.applicableBerthOrMeetingPoint =
              matchedCatalogOpt.applicableBerthOrMeetingPoint ??
              option.pickupAndLocation.applicableBerthOrMeetingPoint ??
              null;

            if (matchedCatalogOpt.durationMinutes !== null) {
              option.duration.durationMinutes = matchedCatalogOpt.durationMinutes;
              option.duration.status = "known";
              option.boundOffer.durationMinutes = matchedCatalogOpt.durationMinutes;
              option.boundOffer.durationRawText = `${matchedCatalogOpt.durationMinutes}m`;
            }
            if (matchedCatalogOpt.fromPriceCents !== null) {
              option.pricing.fromPriceCents = matchedCatalogOpt.fromPriceCents;
              option.boundOffer.unitPriceCents = matchedCatalogOpt.fromPriceCents;
            }
            option.boundOffer.optionCode = matchedCatalogOpt.optionCode;
            option.boundOffer.optionTitle = matchedCatalogOpt.title;
            option.boundOffer.pickupFulfillmentType = newFulfillment;
            option.boundOffer.pickupBadgeLabel = newBadge;
            option.boundOffer.includesPickup = matchedCatalogOpt.includesPickup;
            option.boundOffer.transferBeforeMinutes = newHasVerifiedTransfer
              ? matchedCatalogOpt.transferBeforeMinutes ?? null
              : null;
            option.boundOffer.transferAfterMinutes = newHasVerifiedTransfer
              ? matchedCatalogOpt.transferAfterMinutes ?? null
              : null;
            option.boundOffer.transferTimeSource = newHasVerifiedTransfer
              ? newRawTransferSource
              : matchedCatalogOpt.planningEstimateTransferMinutes !== null &&
                  matchedCatalogOpt.planningEstimateTransferMinutes !== undefined
                ? "planning_estimate"
                : "unknown";
            option.boundOffer.transferEvidenceSource =
              option.pickupAndLocation.transferEvidenceSource;
            option.boundOffer.applicableBerthOrMeetingPoint =
              option.pickupAndLocation.applicableBerthOrMeetingPoint;
            option.boundOffer.planningEstimateTransferMinutes =
              matchedCatalogOpt.planningEstimateTransferMinutes ?? null;
          }
        }

        const openStartTimes = Array.from(
          new Set(
            boundOpenOpts
              .map((o) => (typeof o.startTime === "string" ? o.startTime.trim() : ""))
              .filter(Boolean),
          ),
        ).sort();

        if (liveRes.success && liveRes.available !== null) {
          const isBoundOptionAvailable = boundOpenOpts.length > 0;
          const bestBoundSlot =
            boundOpenOpts
              .filter((o) => typeof o.retailPrice === "number" && Number.isFinite(o.retailPrice))
              .sort((a, b) => (a.retailPrice as number) - (b.retailPrice as number))[0] ||
            boundOpenOpts[0];

          const liveTotalPartyPriceCents =
            typeof bestBoundSlot?.retailPrice === "number" &&
            Number.isFinite(bestBoundSlot.retailPrice)
              ? Math.round(bestBoundSlot.retailPrice * 100)
              : typeof liveRes.retailPrice === "number" && Number.isFinite(liveRes.retailPrice)
                ? Math.round(liveRes.retailPrice * 100)
                : null;

          option.shortlistLiveCheck = {
            checked: true,
            status: isBoundOptionAvailable ? "verified_available" : "verified_unavailable",
            provider: "viator",
            available: isBoundOptionAvailable,
            bookableSlotsCount: boundOpenOpts.length,
            earliestStartTime: openStartTimes[0] || null,
            startTimes: openStartTimes,
            liveFromPriceCents: liveTotalPartyPriceCents,
            latencyMs: itemLatency,
            note: isBoundOptionAvailable
              ? `Verified ${boundOpenOpts.length} bookable slot(s) for option ${option.boundOffer.optionCode || viatorCode} via Viator /availability/check on ${input.date}.`
              : `No bookable slots returned by Viator /availability/check for ${input.date}.`,
          };

          if (isBoundOptionAvailable) {
            option.boundOffer.availableDepartureTimes = openStartTimes;
            option.boundOffer.departureTime = openStartTimes[0] || null;
            option.boundOffer.optionTitleTimeSemantics = detectOptionTitleTimeSemantics(
              option.boundOffer.optionTitle,
              openStartTimes,
            );
            if (liveTotalPartyPriceCents !== null) {
              option.boundOffer.totalPartyPriceCents = liveTotalPartyPriceCents;
              option.boundOffer.priceVerifiedLive = true;
              option.pricing.totalPartyPriceCents = liveTotalPartyPriceCents;
              if (option.pricing.fromPriceCents === null) {
                const derivedUnit =
                  option.pricing.priceBasis === "flat_rate_per_vehicle" ||
                  option.pricing.priceBasis === "per_group"
                    ? liveTotalPartyPriceCents
                    : Math.round(liveTotalPartyPriceCents / Math.max(1, totalGuests));
                option.pricing.fromPriceCents = derivedUnit;
                option.boundOffer.unitPriceCents = derivedUnit;
                option.missingInformation = option.missingInformation.filter(
                  (m) => m !== "pickup_option_price_unverified",
                );
              }
            }
            option.alternativeOptionTradeoffs = buildAlternativeOptionTradeoffs({
              productOptions: option.productOptions,
              selectedOption: option.selectedProductOption,
              record,
              totalGuests,
              selectedPriceBasis: option.pricing.priceBasis,
              selectedUnitPriceCents: option.boundOffer.unitPriceCents,
              selectedTotalPartyPriceCents: option.boundOffer.totalPartyPriceCents,
              selectedFulfillmentType: option.boundOffer.pickupFulfillmentType,
            });
            option.explanations.push(
              `Live availability confirmed for option "${option.boundOffer.optionTitle}" (${option.boundOffer.optionCode || viatorCode}): ${boundOpenOpts.length} slot${boundOpenOpts.length === 1 ? "" : "s"} open on ${input.date}${openStartTimes.length > 0 ? ` at ${openStartTimes.join(", ")}` : ""}.`,
            );
          } else {
            option.suitability = "ineligible";
            option.explanations.push(`Sold out / unavailable on ${input.date} per live Viator check.`);
          }
        } else {
          option.shortlistLiveCheck = {
            checked: true,
            status: "unknown_error",
            provider: "viator",
            available: null,
            bookableSlotsCount: null,
            earliestStartTime: null,
            startTimes: [],
            liveFromPriceCents: null,
            latencyMs: itemLatency,
            note: `Live check could not be verified: ${liveRes.reason || liveRes.errorCode || "unknown_error"}`,
          };
        }
      } else if (record.primaryProvider === "fareharbor") {
        const [shortname, pkStr] = record.providerProductCode.split(":");
        const itemPk = Number(pkStr);
        if (shortname && Number.isFinite(itemPk)) {
          shortlistCheckedCount += 1;
          upstreamRequestsMade += 1;
          try {
            const availabilities = await fetchAvailabilitiesForItem(
              shortname,
              itemPk,
              input.date,
              input.date,
            );
            const openSlots = availabilities.filter(
              (a) => typeof a.capacity === "number" && a.capacity >= totalGuests,
            );
            const openStartTimes = Array.from(
              new Set(
                openSlots
                  .map((a) => {
                    const m = parseClockMinutesOfDay(a.start_at);
                    return m !== null ? formatMinutesOfDay(m) : "";
                  })
                  .filter(Boolean),
              ),
            ).sort();
            const itemLatency = Date.now() - tItem;
            option.shortlistLiveCheck = {
              checked: true,
              status: openSlots.length > 0 ? "verified_available" : "verified_unavailable",
              provider: "fareharbor",
              available: openSlots.length > 0,
              bookableSlotsCount: openSlots.length,
              earliestStartTime: openStartTimes[0] || null,
              startTimes: openStartTimes,
              liveFromPriceCents: null,
              latencyMs: itemLatency,
              note:
                openSlots.length > 0
                  ? `Verified ${openSlots.length} FareHarbor departure(s) with capacity >= ${totalGuests} on ${input.date}.`
                  : `No FareHarbor departures with capacity >= ${totalGuests} on ${input.date}.`,
            };
            if (openSlots.length > 0) {
              option.boundOffer.availableDepartureTimes = openStartTimes;
              option.boundOffer.departureTime = openStartTimes[0] || null;
              option.boundOffer.optionTitleTimeSemantics = detectOptionTitleTimeSemantics(
                option.boundOffer.optionTitle,
                openStartTimes,
              );
            } else {
              option.suitability = "ineligible";
              option.explanations.push(
                `No FareHarbor departures with capacity >= ${totalGuests} on ${input.date}.`,
              );
            }
          } catch (err) {
            option.shortlistLiveCheck = {
              checked: true,
              status: "unknown_error",
              provider: "fareharbor",
              available: null,
              bookableSlotsCount: null,
              earliestStartTime: null,
              startTimes: [],
              liveFromPriceCents: null,
              latencyMs: Date.now() - tItem,
              note: `FareHarbor live check could not be verified: ${err instanceof Error ? err.message : String(err)}`,
            };
          }
        }
      }

      // Re-evaluate Cruise Schedule Fit if actual date-specific departure times were returned by the live check
      if (
        hasCruiseWindowInput &&
        option.shortlistLiveCheck.checked &&
        option.shortlistLiveCheck.available === true &&
        option.shortlistLiveCheck.startTimes.length > 0
      ) {
        option.missingInformation = option.missingInformation.filter(
          (m) => m !== "date_specific_departure_times_unverified",
        );
        const updatedCruiseFit = evaluateCruiseScheduleFit({
          shipArrival: input.shipArrival,
          shipDeparture: input.shipDeparture,
          allAboardTime: input.allAboardTime,
          durationMinutes: option.boundOffer.durationMinutes,
          transferBeforeMinutes: option.boundOffer.transferBeforeMinutes,
          transferAfterMinutes: option.boundOffer.transferAfterMinutes,
          transferTimeSource: option.boundOffer.transferTimeSource,
          transferEvidenceSource: option.boundOffer.transferEvidenceSource,
          applicableBerthOrMeetingPoint: option.boundOffer.applicableBerthOrMeetingPoint,
          planningEstimateTransferMinutes: option.boundOffer.planningEstimateTransferMinutes,
          verifiedDepartureTimes: option.shortlistLiveCheck.startTimes,
        });
        option.cruiseScheduleFit = updatedCruiseFit;
        option.boundOffer.fittingDepartureTimes = updatedCruiseFit.fittingDepartureTimes;
        if (updatedCruiseFit.fittingDepartureTimes.length > 0) {
          option.boundOffer.departureTime = updatedCruiseFit.fittingDepartureTimes[0];
        }
        option.explanations.push(updatedCruiseFit.reason);

        if (updatedCruiseFit.fitStatus === "ineligible") {
          option.suitability = "ineligible";
        } else if (
          updatedCruiseFit.fitStatus === "recommended" &&
          option.missingInformation.length === 0
        ) {
          option.suitability = "recommended";
          option.matchScore = Math.min(100, option.matchScore + 15);
        } else {
          if (option.suitability === "recommended") {
            option.suitability = "needs_confirmation";
          }
        }
      }
    }
  }

  // Re-sort after live check updates
  evaluated.sort(compareEvaluatedCandidates);

  const shortlistLiveCheckMs = shouldLiveCheck ? Date.now() - tLiveStart : 0;

  // 7. Issue traceable booking/referral handoff URLs for eligible options, binding the exact tuple
  const limit = typeof input.limit === "number" && input.limit > 0 ? input.limit : 20;
  const eligibleOptions: MatchedTourOption[] = [];
  const ineligibleOptions: MatchedTourOption[] = [];
  const originatingPagePath = `/${surface}/${input.propertySlug || node.destinationSlug}`;
  const isTestTraffic = isDemoOrAutomatedVerificationTraffic({
    isTest: input.isTest,
    originatingPage: originatingPagePath,
    userAgent: input.userAgent,
    referer: input.referer,
  });

  for (const { record, option } of evaluated) {
    if (option.suitability === "ineligible") {
      ineligibleOptions.push(option);
      continue;
    }
    if (eligibleOptions.length >= limit) continue;

    if (option.capabilityTier !== "discovery_only") {
      if (record.primaryProvider === "gosno") {
        const resortSlug =
          typeof record.serviceDetails?.resortSlug === "string"
            ? record.serviceDetails.resortSlug
            : "winter-park";
        const vehicleClass =
          record.serviceDetails?.vehicleClass === "van" ||
          record.serviceDetails?.vehicleClass === "suv"
            ? (record.serviceDetails.vehicleClass as "suv" | "van")
            : totalGuests > 6
              ? "van"
              : "suv";
        const handoffBuild = buildSharedGoSnoHandoffUrlAndDetails({
          destinationSlug: resortSlug,
          destination: resortSlug,
          origin: input.hotelName || "DEN",
          travelDate: input.date || null,
          passengerCount: totalGuests,
          vehicleClass,
          originatingPage: originatingPagePath,
        });
        const issued = issueSharedGoSnoHandoffAttribution({
          handoffBuild,
          recommendedOperatorId: "op:gosno",
          originatingPage: originatingPagePath,
          originatingSite: surface,
          decisionReceiptId: `rcpt:dcc:match:${record.tourId}:${option.boundOffer.optionCode || "default"}`,
          evidenceVersion: "dcc_catalog_v2",
          isTest: isTestTraffic,
        });
        option.bookingPath.clickId = issued.clickId;
        option.bookingPath.handoffUrl = appendBoundOfferQueryParams(
          issued.outboundPartnerUrl,
          option.boundOffer,
        );
        option.bookingPath.trackedClickUrl = `/api/v1/ads/click?clickId=${encodeURIComponent(issued.clickId)}${isTestTraffic ? "&isTest=true" : ""}&target=${encodeURIComponent(option.bookingPath.handoffUrl)}`;
      } else {
        const preClickId = generateOpaqueClickId();
        let preparedDestinationUrl = option.bookingPath.handoffUrl;

        if (record.primaryProvider === "viator") {
          const campaignTag = `${surface}-${input.propertySlug || node.destinationSlug}-${option.boundOffer.optionCode || "opt"}-${preClickId}`.slice(
            0,
            120,
          );
          const viatorUrl = appendViatorAttribution(preparedDestinationUrl, {
            preserveExistingCampaign: false,
            campaign: campaignTag,
          });
          preparedDestinationUrl = appendBoundOfferQueryParams(
            viatorUrl,
            option.boundOffer,
          );
        } else if (record.primaryProvider === "fareharbor") {
          const fhPreselected = buildFareHarborDatePreselectedUrl(
            preparedDestinationUrl,
            option.boundOffer.date,
          );
          preparedDestinationUrl = appendBoundOfferQueryParams(
            fhPreselected,
            option.boundOffer,
          );
        } else {
          preparedDestinationUrl = appendBoundOfferQueryParams(
            preparedDestinationUrl,
            option.boundOffer,
          );
        }

        const issued = issueOpaqueClickAttribution({
          clickId: preClickId,
          decisionReceiptId: `rcpt:dcc:match:${record.tourId}:${option.boundOffer.optionCode || "default"}`,
          recommendedOperatorId: record.operatorCode || record.primaryProvider,
          recommendedOperatorName: record.operatorName || record.primaryProvider,
          evidenceVersion: "dcc_catalog_v2",
          originatingSite: surface,
          originatingPage: originatingPagePath,
          provider:
            record.primaryProvider === "fareharbor"
              ? "fareharbor"
              : record.primaryProvider === "viator"
                ? "viator"
                : "direct",
          productCode: record.providerProductCode,
          productDestinationUrl: preparedDestinationUrl,
          tripDetails: {
            direction: "outbound",
            pickupTime: option.boundOffer.departureTime,
            pickupLocation:
              input.hotelName ||
              option.pickupAndLocation.meetingPointName ||
              record.meetingPointName ||
              null,
            dropoffLocation: record.destinationSlug,
            serviceDate: option.boundOffer.date,
            passengers: totalGuests,
            baggage: null,
            OriginatingPage: originatingPagePath,
            boundOptionCode: option.boundOffer.optionCode,
            boundOptionTitle: option.boundOffer.optionTitle,
            boundPickupFulfillmentType: option.boundOffer.pickupFulfillmentType,
            boundDurationMinutes: option.boundOffer.durationMinutes,
            boundUnitPriceCents: option.boundOffer.unitPriceCents,
            boundTotalPartyPriceCents: option.boundOffer.totalPartyPriceCents,
            boundChildAges: option.boundOffer.childAges,
          } as any,
          isTest: isTestTraffic,
          recordStage: "recommendation",
        });
        option.bookingPath.clickId = issued.clickId;
        option.bookingPath.handoffUrl = issued.outboundPartnerUrl;
        option.bookingPath.trackedClickUrl = `/api/v1/ads/click?clickId=${encodeURIComponent(issued.clickId)}${isTestTraffic ? "&isTest=true" : ""}&target=${encodeURIComponent(option.bookingPath.handoffUrl)}`;
      }
    }

    option.bookingPath.checkoutPreselection = buildCheckoutPreselectionMetadata({
      provider: record.primaryProvider,
      boundOffer: option.boundOffer,
    });

    eligibleOptions.push(option);
  }

  const supportedVerifiedTransferCount = eligibleOptions.filter(
    (o) =>
      (o.boundOffer.transferTimeSource === "verified_pier_pickup" ||
        o.boundOffer.transferTimeSource === "verified_meeting_point") &&
      Boolean(o.boundOffer.transferEvidenceSource),
  ).length;

  const liveDepartureVerifiedCount = eligibleOptions.filter(
    (o) =>
      o.shortlistLiveCheck.checked &&
      o.shortlistLiveCheck.available === true &&
      o.shortlistLiveCheck.startTimes.length > 0,
  ).length;

  const fullySupportedCruiseFitCount = eligibleOptions.filter(
    (o) => o.cruiseScheduleFit?.fitStatus === "recommended",
  ).length;

  return {
    ok: true,
    destination: {
      destinationSlug: node.destinationSlug,
      portSlug: node.portSlug,
      displayName: node.displayName,
      earthosDestinationNodeId: node.earthosDestinationNodeId,
      timeZone: node.timeZone,
    },
    requestSummary: {
      date: input.date || null,
      adults,
      childAges,
      requiresHotelPickup,
      requiresPierPickup,
      pickupMode: effectivePickupMode,
      surface,
      propertySlug: input.propertySlug || null,
      portWindowMinutes,
    },
    metrics: {
      storageSource: catalogResult.storageSource,
      totalCatalogCandidates: catalogResult.totalMatched,
      eligibleCount: eligibleOptions.filter((o) => o.suitability === "recommended").length,
      needsConfirmationCount: eligibleOptions.filter((o) => o.suitability === "needs_confirmation")
        .length,
      ineligibleCount: ineligibleOptions.length,
      shortlistCheckedCount,
      supportedVerifiedTransferCount,
      liveDepartureVerifiedCount,
      fullySupportedCruiseFitCount,
      upstreamRequestsMade,
      cachedCatalogSearchMs,
      shortlistLiveCheckMs,
      totalResponseMs: Date.now() - tStart,
    },
    options: eligibleOptions,
    ineligibleOptions,
  };
}
