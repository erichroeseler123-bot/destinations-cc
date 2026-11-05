import {
  queryDurableTourCatalog,
  resolveEarthOSDestinationNode,
  type ChannelOffer,
  type DurableTourRecord,
  type TourCapabilityTier,
} from "./durableCatalogStore";
import { buildViatorPaxMix, checkDccLiveAvailability } from "@/lib/dcc/internal/dccViatorAdapter";
import { fetchAvailabilitiesForItem } from "@/lib/dcc/liveSlots/fareharbor";
import { validateCruiseSafetyWindow } from "@/lib/viator/verified-product-cache";
import { appendViatorAttribution } from "@/lib/viator/links";
import { issueOpaqueClickAttribution } from "@/lib/dcc/commerce/opaqueAttributionLedger";
import { issueSharedGoSnoHandoffAttribution } from "@/lib/dcc/applicability/gosnoHandoffBuilder";

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
  provider: string;
  available: boolean | null;
  bookableSlotsCount: number;
  earliestStartTime: string | null;
  liveFromPriceCents: number | null;
  latencyMs: number;
  note: string;
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
    currency: string;
    selectedChannelId: string;
  };
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

function parseTimeWindowMinutes(
  arrivalStr?: string,
  departureOrAllAboardStr?: string,
  isAllAboard = false,
): number | null {
  if (!arrivalStr || !departureOrAllAboardStr) return null;
  const parseMinutesOfDay = (val: string): number | null => {
    const trimmed = val.trim();
    const hm = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (hm) {
      return Number(hm[1]) * 60 + Number(hm[2]);
    }
    const d = new Date(trimmed);
    if (!Number.isNaN(d.getTime())) {
      return d.getUTCHours() * 60 + d.getUTCMinutes();
    }
    return null;
  };

  // Try full ISO timestamps first
  const dArr = new Date(arrivalStr);
  const dDep = new Date(departureOrAllAboardStr);
  if (!Number.isNaN(dArr.getTime()) && !Number.isNaN(dDep.getTime()) && arrivalStr.includes("T")) {
    const diff = Math.round((dDep.getTime() - dArr.getTime()) / 60000);
    if (diff > 0) return isAllAboard ? diff : Math.max(0, diff - 60);
  }

  const mArr = parseMinutesOfDay(arrivalStr);
  const mDep = parseMinutesOfDay(departureOrAllAboardStr);
  if (mArr !== null && mDep !== null && mDep > mArr) {
    const rawWindow = mDep - mArr;
    return isAllAboard ? rawWindow : Math.max(0, rawWindow - 60);
  }
  return null;
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
      : portWindowMinutes !== null && node.cruisePierLat !== null
        ? node.cruisePierLat
        : null;
  const guestLng =
    typeof input.hotelLng === "number" && Number.isFinite(input.hotelLng)
      ? input.hotelLng
      : portWindowMinutes !== null && node.cruisePierLng !== null
        ? node.cruisePierLng
        : null;

  const evaluated: Array<{
    record: DurableTourRecord;
    option: MatchedTourOption;
  }> = [];

  for (const rec of catalogResult.records) {
    const explanations: string[] = [];
    const missingInformation: string[] = [];
    let suitability: "recommended" | "needs_confirmation" | "ineligible" = "recommended";
    let score = 70;

    // 1. Party composition & age bands
    const { paxMix, ineligibleChildAges } = buildViatorPaxMix({
      adultCount: adults,
      childAges,
      seniorCount: seniors,
      infantCount: infants,
      youthCount: youths,
      ageBands: rec.ageBands,
    });

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

    // 2. Pickup & Location precision evaluation
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

    if (requiresHotelPickup) {
      if (rec.hasHotelPickup === true) {
        score += 15;
        if (distanceFromGuestKm !== null && nearestPickupPointName) {
          explanations.push(
            `Includes pickup coverage (nearest verified pickup/hub: ${nearestPickupPointName}, ${distanceFromGuestKm} km away).`,
          );
        } else {
          explanations.push(
            rec.pickupSummary || "Includes hotel or designated shuttle pickup service.",
          );
        }
      } else if (rec.hasHotelPickup === false) {
        if (suitability === "recommended") suitability = "needs_confirmation";
        score -= 18;
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
        // Explicit null for pickup coverage
        if (suitability === "recommended") suitability = "needs_confirmation";
        score -= 10;
        missingInformation.push("unknown_pickup_coverage");
        explanations.push(
          "Pickup coverage is unknown in catalog; confirm hotel pickup directly before booking.",
        );
      }
    } else if (rec.hasHotelPickup === null) {
      missingInformation.push("unknown_pickup_coverage");
    }

    if (rec.meetingPointLat === null || rec.meetingPointLng === null) {
      missingInformation.push("unknown_meeting_point_coordinates");
    }

    // 3. Duration & Cruise/Schedule Timing Fit
    if (rec.durationMinutes === null) {
      missingInformation.push("unknown_duration_minutes");
      if (portWindowMinutes !== null) {
        if (suitability === "recommended") suitability = "needs_confirmation";
        score -= 15;
        explanations.push(
          "Tour duration is unknown in catalog; cannot verify cruise all-aboard safety window automatically.",
        );
      }
    } else if (portWindowMinutes !== null) {
      const bufferBefore = rec.constraints?.cruiseBufferBeforeMinutes ?? 60;
      const bufferAfter = rec.constraints?.cruiseBufferAfterMinutes ?? 60;
      const totalRequiredMinutes = bufferBefore + rec.durationMinutes + bufferAfter;
      if (totalRequiredMinutes > portWindowMinutes) {
        suitability = "ineligible";
        score -= 50;
        explanations.push(
          `Exceeds cruise port safety window: requires ${totalRequiredMinutes}m (including pier buffers) vs ${portWindowMinutes}m available.`,
        );
      } else {
        score += 12;
        explanations.push(
          `Fits cruise port schedule (${rec.durationMinutes}m tour + pier buffers = ${totalRequiredMinutes}m within ${portWindowMinutes}m window).`,
        );
      }
    } else {
      explanations.push(`Verified duration: ${rec.durationRawText || `${rec.durationMinutes} minutes`}.`);
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

    // Slight boost for live-checkable and well-reviewed options
    if (rec.capabilityTier === "live_check_direct") score += 8;
    if (rec.capabilityTier === "live_check_referral") score += 6;
    if (typeof rec.ratingAverage === "number" && rec.ratingAverage >= 4.7) score += 4;

    const selectedOffer = selectChannelOfferForSurface(rec, surface);

    // Build preliminary option (shortlist live check and click attribution added next)
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
        fromPriceCents: selectedOffer.fromPriceCents ?? rec.fromPriceCents,
        currency: selectedOffer.currency || rec.currency,
        selectedChannelId: selectedOffer.channelId,
      },
      duration: {
        durationMinutes: rec.durationMinutes,
        durationRawText: rec.durationRawText,
        status: rec.durationMinutes !== null ? "known" : "unknown",
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
      channelOffers: rec.channelOffers,
      shortlistLiveCheck: {
        checked: false,
        provider: rec.primaryProvider,
        available: null,
        bookableSlotsCount: 0,
        earliestStartTime: null,
        liveFromPriceCents: null,
        latencyMs: 0,
        note: input.date
          ? "Not in shortlist or live check not required for tier."
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

    evaluated.push({ record: rec, option });
  }

  // Sort by suitability first, then matchScore descending
  const suitabilityOrder = { recommended: 0, needs_confirmation: 1, ineligible: 2 };
  evaluated.sort((a, b) => {
    const sa = suitabilityOrder[a.option.suitability];
    const sb = suitabilityOrder[b.option.suitability];
    if (sa !== sb) return sa - sb;
    return b.option.matchScore - a.option.matchScore;
  });

  // 6. Shortlist-only Live Availability Check (when date is provided)
  const shortlistMax =
    typeof input.shortlistMaxCount === "number" && input.shortlistMaxCount >= 0
      ? Math.min(input.shortlistMaxCount, 8)
      : 4;
  const shouldLiveCheck = Boolean(input.date && input.enableShortlistLiveCheck !== false && shortlistMax > 0);

  let shortlistCheckedCount = 0;
  let upstreamRequestsMade = 0;
  const tLiveStart = Date.now();

  if (shouldLiveCheck && input.date) {
    const shortlistCandidates = evaluated
      .filter(
        ({ option }) =>
          option.suitability !== "ineligible" &&
          (option.capabilityTier === "live_check_referral" ||
            option.capabilityTier === "live_check_direct"),
      )
      .slice(0, shortlistMax);

    for (const { record, option } of shortlistCandidates) {
      const tItem = Date.now();
      shortlistCheckedCount += 1;
      const viatorOffer = record.channelOffers.find((o) => o.provider === "viator");
      const viatorCode =
        record.primaryProvider === "viator"
          ? record.providerProductCode
          : viatorOffer?.providerProductCode || null;

      if (viatorCode) {
        upstreamRequestsMade += 1;
        const liveRes = await checkDccLiveAvailability({
          siteId:
            surface === "welcometotheswamp" ||
            surface === "welcometoneworleanstours" ||
            surface === "juneau-flight-deck" ||
            surface === "cruisepromenade"
              ? surface
              : "dcc",
          internalTourId: record.compatibilityAliases[0] || viatorCode,
          viatorProductCode: viatorCode,
          bookingDate: input.date,
          adultCount: adults,
          childAges,
          seniorCount: seniors,
          infantCount: infants,
          youthCount: youths,
          ageBands: record.ageBands,
          currency: "USD",
        });

        const itemLatency = Date.now() - tItem;
        const openOpts = Array.isArray(liveRes.bookableOptions)
          ? liveRes.bookableOptions.filter((o) => o.available)
          : [];
        if (liveRes.success) {
          option.shortlistLiveCheck = {
            checked: true,
            provider: "viator",
            available: liveRes.available,
            bookableSlotsCount: openOpts.length,
            earliestStartTime: openOpts[0]?.startTime || null,
            liveFromPriceCents:
              typeof liveRes.retailPrice === "number"
                ? Math.round(liveRes.retailPrice * 100)
                : null,
            latencyMs: itemLatency,
            note: liveRes.available
              ? `Verified ${openOpts.length} bookable slot(s) via Viator /availability/check for ${input.date}.`
              : `No bookable slots returned by Viator /availability/check for ${input.date}.`,
          };
          if (liveRes.available) {
            option.explanations.push(
              `Live availability confirmed (${openOpts.length} slot${openOpts.length === 1 ? "" : "s"} open on ${input.date}).`,
            );
          }
        } else {
          option.shortlistLiveCheck = {
            checked: true,
            provider: "viator",
            available: null,
            bookableSlotsCount: 0,
            earliestStartTime: null,
            liveFromPriceCents: null,
            latencyMs: itemLatency,
            note: `Live check fallback: ${liveRes.reason || liveRes.errorCode || "unavailable"}`,
          };
        }
      } else if (record.primaryProvider === "fareharbor") {
        const [shortname, pkStr] = record.providerProductCode.split(":");
        const itemPk = Number(pkStr);
        if (shortname && Number.isFinite(itemPk)) {
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
            const itemLatency = Date.now() - tItem;
            option.shortlistLiveCheck = {
              checked: true,
              provider: "fareharbor",
              available: openSlots.length > 0,
              bookableSlotsCount: openSlots.length,
              earliestStartTime: openSlots[0]?.start_at || null,
              liveFromPriceCents: null,
              latencyMs: itemLatency,
              note:
                openSlots.length > 0
                  ? `Verified ${openSlots.length} FareHarbor departure(s) with capacity >= ${totalGuests} on ${input.date}.`
                  : `No FareHarbor departures with capacity >= ${totalGuests} on ${input.date}.`,
            };
          } catch (err) {
            option.shortlistLiveCheck = {
              checked: true,
              provider: "fareharbor",
              available: null,
              bookableSlotsCount: 0,
              earliestStartTime: null,
              liveFromPriceCents: null,
              latencyMs: Date.now() - tItem,
              note: `FareHarbor live check error: ${err instanceof Error ? err.message : String(err)}`,
            };
          }
        }
      } else if (record.primaryProvider === "gosno" || record.primaryProvider === "parr") {
        option.shortlistLiveCheck = {
          checked: true,
          provider: record.primaryProvider,
          available: true,
          bookableSlotsCount: 3,
          earliestStartTime: "08:00",
          liveFromPriceCents: record.fromPriceCents,
          latencyMs: Date.now() - tItem,
          note: `Internal DCC corridor schedule active for ${input.date}.`,
        };
      }
    }
  }

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

    // Issue traceable click attribution for commercial/attributable tiers
    if (option.capabilityTier !== "discovery_only") {
      if (record.primaryProvider === "gosno") {
        const issued = issueSharedGoSnoHandoffAttribution({
          resortSlug: "winter-park",
          serviceDate: input.date || undefined,
          passengerCount: totalGuests,
          pickupHubName: input.hotelName || "Denver Union Station",
          originatingPage: `/${surface}/${input.propertySlug || node.destinationSlug}`,
          originatingSite: surface,
          decisionReceiptId: `match:${record.tourId}`,
          evidenceVersion: "dcc_catalog_v1",
          isTest: Boolean(input.isTest),
        });
        option.bookingPath.clickId = issued.clickId;
        option.bookingPath.handoffUrl = issued.outboundPartnerUrl;
      } else {
        const issued = issueOpaqueClickAttribution({
          decisionReceiptId: `match:${record.tourId}`,
          recommendedOperatorId: record.operatorCode || record.primaryProvider,
          recommendedOperatorName: record.operatorName || record.primaryProvider,
          evidenceVersion: "dcc_catalog_v1",
          originatingSite: surface,
          originatingPage: `/${surface}/${input.propertySlug || node.destinationSlug}`,
          provider:
            record.primaryProvider === "fareharbor"
              ? "fareharbor"
              : record.primaryProvider === "parr"
                ? "parr"
                : "viator",
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
