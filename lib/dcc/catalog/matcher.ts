import {
  queryDurableTourCatalog,
  resolveEarthOSDestinationNode,
  type ChannelOffer,
  type DurableTourRecord,
  type PriceBasis,
  type TourCapabilityTier,
  type TourProductOptionRecord,
} from "./durableCatalogStore";
import { buildViatorPaxMix, checkDccLiveAvailability } from "@/lib/dcc/internal/dccViatorAdapter";
import { fetchAvailabilitiesForItem } from "@/lib/dcc/liveSlots/fareharbor";
import { appendViatorAttribution } from "@/lib/viator/links";
import { issueOpaqueClickAttribution } from "@/lib/dcc/commerce/opaqueAttributionLedger";
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
  durationMinutes: number | null;
  verifiedDepartureTimes: string[];
  fittingDepartureTimes: string[];
  reason: string;
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
    priceBasis: PriceBasis;
    lowestPriceIncludesPickup: boolean | null;
    currency: string;
    selectedChannelId: string;
    selectedOptionCode: string | null;
    selectedOptionTitle: string | null;
    selectedOptionIncludesPickup: boolean | null;
  };
  selectedProductOption: TourProductOptionRecord | null;
  productOptions: TourProductOptionRecord[];
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
    pickupSummary: string | null;
    meetingPointName: string | null;
    meetingPointAddress: string | null;
    meetingPointLat: number | null;
    meetingPointLng: number | null;
    locationPrecision: "exact" | "approximate" | "unknown";
    distanceFromGuestKm: number | null;
    nearestPickupPointName: string | null;
  };
  cruiseScheduleFit?: CruiseScheduleFitEvaluation;
  channelOffers: ChannelOffer[];
  shortlistLiveCheck: ShortlistLiveStatus;
  bookingPath: {
    clickId: string | null;
    handoffUrl: string;
    sellerIdentity: string;
    operatorIdentity: string;
    capabilityTier: TourCapabilityTier;
    outcomeReportingMode:
      | "tracked_viator_checkout_referral"
      | "authorized_fareharbor_direct"
      | "internal_satellite_webhook_reconciled"
      | "attributable_operator_referral"
      | "untracked_discovery_link";
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
    upstreamRequestsMade: number;
    cachedCatalogSearchMs: number;
    shortlistLiveCheckMs: number;
    totalResponseMs: number;
  };
  options: MatchedTourOption[];
  ineligibleOptions: MatchedTourOption[];
};

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
  verifiedDepartureTimes: string[];
}): CruiseScheduleFitEvaluation {
  const arrivalMin = parseClockMinutesOfDay(params.shipArrival);
  const explicitAllAboardMin = parseClockMinutesOfDay(params.allAboardTime);
  const shipDepartureMin = parseClockMinutesOfDay(params.shipDeparture);
  const returnDeadlineMin =
    explicitAllAboardMin ?? (shipDepartureMin !== null ? shipDepartureMin - 45 : null);
  const debarkClearanceMinutes = 30;

  if (arrivalMin === null && returnDeadlineMin === null) {
    return {
      evaluated: false,
      fitStatus: "not_applicable",
      arrivalMinutesOfDay: null,
      returnDeadlineMinutesOfDay: null,
      debarkClearanceMinutes,
      transferBeforeMinutes: params.transferBeforeMinutes,
      transferAfterMinutes: params.transferAfterMinutes,
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
      durationMinutes: null,
      verifiedDepartureTimes: params.verifiedDepartureTimes,
      fittingDepartureTimes: [],
      reason:
        "Tour duration is unknown in catalog; cannot establish cruise return fit without confirmed duration.",
    };
  }

  if (params.transferBeforeMinutes === null || params.transferAfterMinutes === null) {
    return {
      evaluated: true,
      fitStatus: "needs_confirmation",
      arrivalMinutesOfDay: arrivalMin,
      returnDeadlineMinutesOfDay: returnDeadlineMin,
      debarkClearanceMinutes,
      transferBeforeMinutes: params.transferBeforeMinutes,
      transferAfterMinutes: params.transferAfterMinutes,
      durationMinutes: params.durationMinutes,
      verifiedDepartureTimes: params.verifiedDepartureTimes,
      fittingDepartureTimes: [],
      reason:
        "Port-to-meeting-point transfer buffers are unconfirmed; cruise schedule fit requires confirmation.",
    };
  }

  const availablePortMinutes = returnDeadlineMin - arrivalMin;
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
      durationMinutes: params.durationMinutes,
      verifiedDepartureTimes: params.verifiedDepartureTimes,
      fittingDepartureTimes: [],
      reason: `Exceeds cruise port safety window: requires ${totalMinimumRequired}m (${debarkClearanceMinutes}m debark + ${params.transferBeforeMinutes}m transfer + ${params.durationMinutes}m tour + ${params.transferAfterMinutes}m return transfer) vs ${availablePortMinutes}m available before ${formatMinutesOfDay(returnDeadlineMin)} all-aboard.`,
    };
  }

  // Even when theoretical duration fits the window, actual departure times must be verified to mark as recommended
  const validStartTimes = params.verifiedDepartureTimes.filter(
    (t) => parseClockMinutesOfDay(t) !== null,
  );
  if (validStartTimes.length === 0) {
    return {
      evaluated: true,
      fitStatus: "needs_confirmation",
      arrivalMinutesOfDay: arrivalMin,
      returnDeadlineMinutesOfDay: returnDeadlineMin,
      debarkClearanceMinutes,
      transferBeforeMinutes: params.transferBeforeMinutes,
      transferAfterMinutes: params.transferAfterMinutes,
      durationMinutes: params.durationMinutes,
      verifiedDepartureTimes: [],
      fittingDepartureTimes: [],
      reason: `Duration (${params.durationMinutes}m) and transfers fit within the ${availablePortMinutes}m port window, but actual date-specific departure times have not been verified yet; needs confirmation.`,
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
    durationMinutes: params.durationMinutes,
    verifiedDepartureTimes: validStartTimes,
    fittingDepartureTimes,
    reason: `Verified cruise schedule fit: departure(s) [${fittingDepartureTimes.join(", ")}] + ${params.durationMinutes}m duration + ${params.transferAfterMinutes}m return transfer return to pier by ${formatMinutesOfDay(backAtPierMin)} (before ${formatMinutesOfDay(returnDeadlineMin)} all-aboard deadline).`,
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

export async function matchToursForTrip(input: TripMatchRequest): Promise<TripMatchResponse> {
  const tStart = Date.now();
  const node =
    resolveEarthOSDestinationNode(input.destination || input.portSlug || "new-orleans") ||
    resolveEarthOSDestinationNode("new-orleans")!;

  const adults = typeof input.adults === "number" && input.adults >= 1 ? Math.floor(input.adults) : 2;
  const childAges = Array.isArray(input.childAges)
    ? input.childAges.filter((a) => typeof a === "number" && a >= 0 && a <= 17)
    : [];
  const seniors = typeof input.seniors === "number" && input.seniors >= 0 ? Math.floor(input.seniors) : 0;
  const infants = typeof input.infants === "number" && input.infants >= 0 ? Math.floor(input.infants) : 0;
  const youths = typeof input.youths === "number" && input.youths >= 0 ? Math.floor(input.youths) : 0;
  const totalGuests = adults + childAges.length + seniors + infants + youths;

  const surface = input.surface || "dcc";
  const requiresHotelPickup = Boolean(input.requiresHotelPickup);
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
        missingInformation.push("age_band_policy_unknown");
        explanations.push(
          "Provider age-band breakdown is not specified in catalog; child pricing/eligibility requires operator confirmation.",
        );
      }
    } else {
      explanations.push(`Configured for ${totalGuests} adult traveler${totalGuests === 1 ? "" : "s"}.`);
    }

    // 2. Pickup & Option-Level Price Matching (never present optional transportation as included in the lowest-priced option)
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
    const productOptions = Array.isArray(rec.productOptions) ? rec.productOptions : [];
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

    if (requiresHotelPickup) {
      if (rec.hasHotelPickup === true) {
        const pickupOptions = productOptions.filter((o) => o.includesPickup === true);
        if (pickupOptions.length > 0) {
          const sortedPickupOpts = [...pickupOptions].sort((a, b) => {
            if (a.fromPriceCents === null && b.fromPriceCents === null) return 0;
            if (a.fromPriceCents === null) return 1;
            if (b.fromPriceCents === null) return -1;
            return a.fromPriceCents - b.fromPriceCents;
          });
          selectedProductOption = sortedPickupOpts[0];
          allowedOptionCodesForLiveCheck = pickupOptions.map((o) => o.optionCode);
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
            // Do NOT fall back to a lower self-drive base price when pickup option price is unknown
            if (suitability === "recommended") suitability = "needs_confirmation";
            missingInformation.push("pickup_option_price_unverified");
            explanations.push(
              `Matched hotel pickup option "${selectedProductOption.title}" (${selectedProductOption.optionCode}), but option-specific price requires live date confirmation.`,
            );
          }
        } else if (lowestPriceIncludesPickup === false) {
          // Product offers optional transportation, and no pickup option price is loaded
          quotedFromPriceCents = null;
          if (suitability === "recommended") suitability = "needs_confirmation";
          missingInformation.push("pickup_option_price_unverified");
          explanations.push(
            "Hotel pickup is an optional upgrade on this tour; the lowest-priced option is self-drive and pickup option pricing requires confirmation.",
          );
        } else if (lowestPriceIncludesPickup === true) {
          score += 15;
          explanations.push(
            rec.pickupSummary || "Includes hotel or designated shuttle pickup service in base price.",
          );
        } else {
          // lowestPriceIncludesPickup === null on a search-only record
          if (suitability === "recommended") suitability = "needs_confirmation";
          missingInformation.push("pickup_option_price_unverified");
          explanations.push(
            "Hotel pickup is offered, but whether the lowest price includes pickup has not been verified at the option level.",
          );
        }

        if (distanceFromGuestKm !== null && nearestPickupPointName) {
          explanations.push(
            `Nearest verified pickup/hub: ${nearestPickupPointName} (${distanceFromGuestKm} km away).`,
          );
        }
      } else if (rec.hasHotelPickup === false) {
        if (suitability === "recommended") suitability = "needs_confirmation";
        score -= 18;
        missingInformation.push("hotel_pickup_not_offered");
        if (distanceFromGuestKm !== null && rec.meetingPointName) {
          explanations.push(
            `Meeting-point only (no hotel pickup). Guest must travel ${distanceFromGuestKm} km to ${rec.meetingPointName}.`,
          );
        } else {
          explanations.push(
            "Meeting-point only (no hotel pickup); requires independent transport to departure point.",
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
    } else {
      // Guest did not require hotel pickup; select the lowest-priced option overall
      if (productOptions.length > 0) {
        const sortedAll = [...productOptions].sort((a, b) => {
          if (a.fromPriceCents === null && b.fromPriceCents === null) return 0;
          if (a.fromPriceCents === null) return 1;
          if (b.fromPriceCents === null) return -1;
          return a.fromPriceCents - b.fromPriceCents;
        });
        selectedProductOption = sortedAll[0];
        if (selectedProductOption.fromPriceCents !== null) {
          quotedFromPriceCents = selectedProductOption.fromPriceCents;
        }
        if (selectedProductOption.durationMinutes !== null) {
          quotedDurationMinutes = selectedProductOption.durationMinutes;
        }
        if (selectedProductOption.includesPickup === false && rec.hasHotelPickup === true) {
          explanations.push(
            `Lowest-priced option "${selectedProductOption.title}" (${selectedProductOption.optionCode}) is meeting-point / self-drive only (does not include optional hotel transportation).`,
          );
        }
      } else if (rec.hasHotelPickup === null) {
        missingInformation.push("unknown_pickup_coverage");
      }
    }

    if (rec.meetingPointLat === null || rec.meetingPointLng === null) {
      missingInformation.push("unknown_meeting_point_coordinates");
    }

    // 3. Duration & Preliminary Cruise Schedule Fit (before live check startTimes are populated)
    let cruiseFit: CruiseScheduleFitEvaluation | undefined = undefined;
    if (hasCruiseWindowInput) {
      cruiseFit = evaluateCruiseScheduleFit({
        shipArrival: input.shipArrival,
        shipDeparture: input.shipDeparture,
        allAboardTime: input.allAboardTime,
        durationMinutes: quotedDurationMinutes,
        transferBeforeMinutes: rec.constraints?.cruiseBufferBeforeMinutes ?? null,
        transferAfterMinutes: rec.constraints?.cruiseBufferAfterMinutes ?? null,
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
          rec.constraints?.cruiseBufferBeforeMinutes === null ||
          rec.constraints?.cruiseBufferAfterMinutes === null
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

    if (rec.capabilityTier === "live_check_direct") score += 8;
    if (rec.capabilityTier === "live_check_referral") score += 6;
    if (typeof rec.ratingAverage === "number" && rec.ratingAverage >= 4.7) score += 4;

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
        priceBasis,
        lowestPriceIncludesPickup,
        currency: selectedOffer.currency || rec.currency,
        selectedChannelId: selectedOffer.channelId,
        selectedOptionCode: selectedProductOption?.optionCode || null,
        selectedOptionTitle: selectedProductOption?.title || null,
        selectedOptionIncludesPickup: selectedProductOption?.includesPickup ?? null,
      },
      selectedProductOption,
      productOptions,
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
        pickupSummary: rec.pickupSummary,
        meetingPointName: rec.meetingPointName,
        meetingPointAddress: rec.meetingPointAddress,
        meetingPointLat: rec.meetingPointLat,
        meetingPointLng: rec.meetingPointLng,
        locationPrecision: rec.locationPrecision,
        distanceFromGuestKm,
        nearestPickupPointName,
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
        handoffUrl: selectedOffer.bookingUrl || rec.bookingUrl,
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
      },
      primaryImageUrl: rec.primaryImageUrl,
      ratingAverage: rec.ratingAverage,
      reviewCount: rec.reviewCount,
    };

    evaluated.push({ record: rec, option, allowedOptionCodesForLiveCheck });
  }

  // Sort by suitability first, then matchScore descending
  const suitabilityOrder = { recommended: 0, needs_confirmation: 1, ineligible: 2 };
  evaluated.sort((a, b) => {
    const sa = suitabilityOrder[a.option.suitability];
    const sb = suitabilityOrder[b.option.suitability];
    if (sa !== sb) return sa - sb;
    return b.option.matchScore - a.option.matchScore;
  });

  // 6. Authorized Shortlist-only Live Availability Check (when date is provided)
  // Never fabricate availability for GoSno, PARR, or unchecked candidates.
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
        const openOpts = Array.isArray(liveRes.bookableOptions)
          ? liveRes.bookableOptions.filter((o) => o.available)
          : [];
        const openStartTimes = Array.from(
          new Set(
            openOpts
              .map((o) => (typeof o.startTime === "string" ? o.startTime.trim() : ""))
              .filter(Boolean),
          ),
        ).sort();

        if (liveRes.success && liveRes.available !== null) {
          const livePriceCents =
            typeof liveRes.retailPrice === "number" && Number.isFinite(liveRes.retailPrice)
              ? Math.round(liveRes.retailPrice * 100)
              : null;

          option.shortlistLiveCheck = {
            checked: true,
            status: liveRes.available ? "verified_available" : "verified_unavailable",
            provider: "viator",
            available: liveRes.available,
            bookableSlotsCount: openOpts.length,
            earliestStartTime: openStartTimes[0] || null,
            startTimes: openStartTimes,
            liveFromPriceCents: livePriceCents,
            latencyMs: itemLatency,
            note: liveRes.available
              ? `Verified ${openOpts.length} bookable slot(s) via Viator /availability/check for ${input.date}.`
              : `No bookable slots returned by Viator /availability/check for ${input.date}.`,
          };

          if (liveRes.available) {
            if (option.pricing.fromPriceCents === null && livePriceCents !== null) {
              option.pricing.fromPriceCents = livePriceCents;
              option.missingInformation = option.missingInformation.filter(
                (m) => m !== "pickup_option_price_unverified",
              );
            }
            option.explanations.push(
              `Live availability confirmed (${openOpts.length} slot${openOpts.length === 1 ? "" : "s"} open on ${input.date}${openStartTimes.length > 0 ? ` at ${openStartTimes.join(", ")}` : ""}).`,
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
            if (openSlots.length === 0) {
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
        const updatedCruiseFit = evaluateCruiseScheduleFit({
          shipArrival: input.shipArrival,
          shipDeparture: input.shipDeparture,
          allAboardTime: input.allAboardTime,
          durationMinutes: option.duration.durationMinutes,
          transferBeforeMinutes: record.constraints?.cruiseBufferBeforeMinutes ?? null,
          transferAfterMinutes: record.constraints?.cruiseBufferAfterMinutes ?? null,
          verifiedDepartureTimes: option.shortlistLiveCheck.startTimes,
        });
        option.cruiseScheduleFit = updatedCruiseFit;
        option.explanations.push(updatedCruiseFit.reason);

        if (updatedCruiseFit.fitStatus === "ineligible") {
          option.suitability = "ineligible";
        } else if (
          updatedCruiseFit.fitStatus === "recommended" &&
          option.missingInformation.length === 0
        ) {
          option.suitability = "recommended";
          option.matchScore = Math.min(100, option.matchScore + 15);
        }
      }
    }
  }

  // Re-sort after live check updates
  evaluated.sort((a, b) => {
    const sa = suitabilityOrder[a.option.suitability];
    const sb = suitabilityOrder[b.option.suitability];
    if (sa !== sb) return sa - sb;
    return b.option.matchScore - a.option.matchScore;
  });

  const shortlistLiveCheckMs = shouldLiveCheck ? Date.now() - tLiveStart : 0;

  // 7. Issue traceable booking/referral handoff URLs for eligible options
  const limit = typeof input.limit === "number" && input.limit > 0 ? input.limit : 20;
  const eligibleOptions: MatchedTourOption[] = [];
  const ineligibleOptions: MatchedTourOption[] = [];

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
          originatingPage: `/${surface}/${input.propertySlug || node.destinationSlug}`,
        });
        const issued = issueSharedGoSnoHandoffAttribution({
          handoffBuild,
          recommendedOperatorId: "op:gosno",
          originatingPage: `/${surface}/${input.propertySlug || node.destinationSlug}`,
          originatingSite: surface,
          decisionReceiptId: `match:${record.tourId}`,
          evidenceVersion: "dcc_catalog_v2",
          isTest: Boolean(input.isTest),
        });
        option.bookingPath.clickId = issued.clickId;
        option.bookingPath.handoffUrl = issued.outboundPartnerUrl;
      } else {
        const issued = issueOpaqueClickAttribution({
          decisionReceiptId: `match:${record.tourId}`,
          recommendedOperatorId: record.operatorCode || record.primaryProvider,
          recommendedOperatorName: record.operatorName || record.primaryProvider,
          evidenceVersion: "dcc_catalog_v2",
          originatingSite: surface,
          originatingPage: `/${surface}/${input.propertySlug || node.destinationSlug}`,
          provider:
            record.primaryProvider === "fareharbor"
              ? "fareharbor"
              : record.primaryProvider === "viator"
                ? "viator"
                : "direct",
          productCode: record.providerProductCode,
          productDestinationUrl: option.bookingPath.handoffUrl,
          tripDetails: {
            direction: "outbound",
            pickupTime: null,
            pickupLocation: input.hotelName || record.meetingPointName || null,
            dropoffLocation: record.destinationSlug,
            serviceDate: input.date || null,
            passengers: totalGuests,
            baggage: null,
            OriginatingPage: `/${surface}/${input.propertySlug || node.destinationSlug}`,
          } as any,
          isTest: Boolean(input.isTest),
        });
        option.bookingPath.clickId = issued.clickId;

        if (record.primaryProvider === "viator") {
          const campaignTag = `${surface}-${input.propertySlug || node.destinationSlug}-${issued.clickId}`.slice(
            0,
            120,
          );
          option.bookingPath.handoffUrl = appendViatorAttribution(option.bookingPath.handoffUrl, {
            preserveExistingCampaign: false,
            campaign: campaignTag,
          });
        } else {
          option.bookingPath.handoffUrl = issued.outboundPartnerUrl;
        }
      }
    }

    eligibleOptions.push(option);
  }

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
      upstreamRequestsMade,
      cachedCatalogSearchMs,
      shortlistLiveCheckMs,
      totalResponseMs: Date.now() - tStart,
    },
    options: eligibleOptions,
    ineligibleOptions,
  };
}
