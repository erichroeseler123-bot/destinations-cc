import {
  matchToursForTrip,
  type MatchedTourOption,
  type TripMatchResponse,
} from "./catalog/matcher";
import {
  getFunnelMetricsReport,
  issueOpaqueClickAttribution,
  reconcilePartnerWebhookByClickId,
  recordOutboundClickFollow,
  recordPlanOpenEvent,
  type FunnelMetricsReport,
  type OpaqueClickReconciledOutcome,
} from "./commerce/opaqueAttributionLedger";
import { HOTEL_CONCIERGE_CONFIGS } from "./catalog/hotelConfigs";
import { readDurableLedgerState } from "./storage/durableTransactionalStore";

export const WINTER_EXCURSION_PORT_SLUGS = [
  "nassau",
  "st-thomas",
  "cozumel",
  "roatan",
  "grand-cayman",
] as const;

export type WinterExcursionPortSlug = (typeof WINTER_EXCURSION_PORT_SLUGS)[number];

export interface WinterPortLogisticsSpec {
  portSlug: WinterExcursionPortSlug;
  portName: string;
  countryOrTerritory: string;
  dockOrTender: "dock" | "tender";
  isTenderPort: boolean;
  defaultClearanceMinutes: number;
  terminalOrBerthName: string;
  dccPortGuidePath: string;
  dccPortGuideUrl: string;
  cruisePromenadePortUrl: string;
  defaultFeaturedTourId: string;
  defaultFeaturedProductCode: string;
  defaultArrivalTime: string;
  defaultDepartureTime: string;
  defaultAllAboardTime: string;
  logisticsSummary: string;
}

export const WINTER_PORT_LOGISTICS_SPECS: Record<
  WinterExcursionPortSlug,
  WinterPortLogisticsSpec
> = {
  nassau: {
    portSlug: "nassau",
    portName: "Nassau, Bahamas",
    countryOrTerritory: "Bahamas",
    dockOrTender: "dock",
    isTenderPort: false,
    defaultClearanceMinutes: 30,
    terminalOrBerthName: "Nassau Cruise Port (Prince George Wharf Terminal Gate)",
    dccPortGuidePath: "/ports/nassau",
    dccPortGuideUrl: "https://www.destinationcommandcenter.com/ports/nassau",
    cruisePromenadePortUrl: "https://cruisepromenade.com/ports/nassau-bahamas",
    defaultFeaturedTourId: "dcc:tour:viator:254526P1",
    defaultFeaturedProductCode: "254526P1",
    defaultArrivalTime: "07:00",
    defaultDepartureTime: "16:00",
    defaultAllAboardTime: "15:15",
    logisticsSummary:
      "Docked at Prince George Wharf. Requires 30m ship debark clearance + 15m verified terminal shuttle to Montague Foreshore Marina on Option TG4.",
  },
  "st-thomas": {
    portSlug: "st-thomas",
    portName: "Charlotte Amalie, St. Thomas",
    countryOrTerritory: "U.S. Virgin Islands",
    dockOrTender: "dock",
    isTenderPort: false,
    defaultClearanceMinutes: 30,
    terminalOrBerthName: "Havensight (WICO) Dock / Crown Bay Cruise Center",
    dccPortGuidePath: "/ports/st-thomas",
    dccPortGuideUrl: "https://www.destinationcommandcenter.com/ports/st-thomas",
    cruisePromenadePortUrl: "https://cruisepromenade.com/ports/st-thomas-usvi",
    defaultFeaturedTourId: "dcc:tour:viator:7452P2",
    defaultFeaturedProductCode: "7452P2",
    defaultArrivalTime: "08:00",
    defaultDepartureTime: "18:00",
    defaultAllAboardTime: "17:15",
    logisticsSummary:
      "Docked at Havensight (WICO) or Crown Bay. Requires 30m debark clearance + 20m verified open-air safari shuttle transfer each way.",
  },
  cozumel: {
    portSlug: "cozumel",
    portName: "Cozumel, Mexico",
    countryOrTerritory: "Mexico",
    dockOrTender: "dock",
    isTenderPort: false,
    defaultClearanceMinutes: 30,
    terminalOrBerthName: "Puerta Maya / SSA International Pier / Punta Langosta",
    dccPortGuidePath: "/ports/cozumel",
    dccPortGuideUrl: "https://www.destinationcommandcenter.com/ports/cozumel",
    cruisePromenadePortUrl: "https://cruisepromenade.com/ports/cozumel-mexico",
    defaultFeaturedTourId: "dcc:tour:viator:5553274P1",
    defaultFeaturedProductCode: "5553274P1",
    defaultArrivalTime: "07:00",
    defaultDepartureTime: "17:00",
    defaultAllAboardTime: "16:15",
    logisticsSummary:
      "Docked at International Pier / Puerta Maya. Requires 30m debark clearance + 15m verified excursion staging transfer each way.",
  },
  roatan: {
    portSlug: "roatan",
    portName: "Roatán (Coxen Hole / Mahogany Bay), Honduras",
    countryOrTerritory: "Honduras",
    dockOrTender: "dock",
    isTenderPort: false,
    defaultClearanceMinutes: 30,
    terminalOrBerthName: "Port of Roatán (Coxen Hole) / Mahogany Bay Cruise Center",
    dccPortGuidePath: "/ports/roatan",
    dccPortGuideUrl: "https://www.destinationcommandcenter.com/ports/roatan",
    cruisePromenadePortUrl: "https://cruisepromenade.com/ports/roatan-honduras",
    defaultFeaturedTourId: "dcc:tour:viator:62963P76",
    defaultFeaturedProductCode: "62963P76",
    defaultArrivalTime: "08:00",
    defaultDepartureTime: "17:00",
    defaultAllAboardTime: "16:15",
    logisticsSummary:
      "Docked at Coxen Hole or Mahogany Bay. Requires 30m debark clearance + 15m verified excursion gate transfer each way.",
  },
  "grand-cayman": {
    portSlug: "grand-cayman",
    portName: "George Town, Grand Cayman",
    countryOrTerritory: "Cayman Islands",
    dockOrTender: "tender",
    isTenderPort: true,
    defaultClearanceMinutes: 45,
    terminalOrBerthName: "George Town Royal Watler Tender Terminal",
    dccPortGuidePath: "/ports/grand-cayman",
    dccPortGuideUrl: "https://www.destinationcommandcenter.com/ports/grand-cayman",
    cruisePromenadePortUrl: "https://cruisepromenade.com/ports/grand-cayman-cayman-islands",
    defaultFeaturedTourId: "dcc:tour:viator:10309P3",
    defaultFeaturedProductCode: "10309P3",
    defaultArrivalTime: "07:30",
    defaultDepartureTime: "16:00",
    defaultAllAboardTime: "15:00",
    logisticsSummary:
      "TENDER PORT at George Town Harbour. Requires 45m ship-to-shore tender clearance + 20m North Sound marina shuttle each way before last tender.",
  },
};

export interface WinterSailingItineraryDay {
  dayNumber: number;
  date: string;
  stopType: "embarkation" | "port" | "sea" | "debarkation";
  portSlug: WinterExcursionPortSlug | null;
  portLabel: string;
  dockOrTender: "dock" | "tender" | "n/a";
  arrivalTime: string | null;
  departureTime: string | null;
  allAboardTime: string | null;
  savedTourId: string | null;
  savedOptionCode: string | null;
  notes: string;
}

export interface ShareableWinterSailingDefinition {
  planCode: string;
  sailingId: string;
  cruiseLine: string;
  shipName: string;
  shipSlug: string;
  itineraryTitle: string;
  sailDate: string;
  returnDate: string;
  durationNights: number;
  embarkationPort: string;
  officialCruiseLineItineraryUrl: string;
  cruisePromenadeShareUrl: string;
  dccShareUrl: string;
  defaultAdults: number;
  defaultChildAges: number[];
  placementId: string;
  itineraryDays: WinterSailingItineraryDay[];
  savedExcursionsByPort: Partial<
    Record<
      WinterExcursionPortSlug,
      {
        tourId: string;
        providerProductCode: string;
        optionCode: string | null;
        date: string;
        arrivalTime: string;
        departureTime: string;
        allAboardTime: string;
      }
    >
  >;
}

export const INDEPENDENCE_JAN_24_2027_SHAREABLE_PLAN: ShareableWinterSailingDefinition = {
  planCode: "INDY-2027-01-24",
  sailingId: "ID07MIA-1982128855",
  cruiseLine: "Royal Caribbean International",
  shipName: "Independence of the Seas",
  shipSlug: "independence-of-the-seas",
  itineraryTitle: "7-Night Eastern Caribbean from Miami",
  sailDate: "2027-01-24",
  returnDate: "2027-01-31",
  durationNights: 7,
  embarkationPort: "Miami, Florida",
  officialCruiseLineItineraryUrl:
    "https://www.royalcaribbean.com/itinerary/7-night-eastern-caribbean-from-miami-on-independence-ID07MIA-1982128855?country=USA&currencyCode=USD&sailDate=2027-01-24",
  cruisePromenadeShareUrl: "https://cruisepromenade.com/p/INDY-2027-01-24",
  dccShareUrl:
    "https://www.destinationcommandcenter.com/cruises/winter-excursion-planner?plan=INDY-2027-01-24",
  defaultAdults: 2,
  defaultChildAges: [],
  placementId: "fp-cp-winter-excursion-planner",
  itineraryDays: [
    {
      dayNumber: 1,
      date: "2027-01-24",
      stopType: "embarkation",
      portSlug: null,
      portLabel: "Miami, Florida (PortMiami)",
      dockOrTender: "dock",
      arrivalTime: null,
      departureTime: "16:00",
      allAboardTime: "15:00",
      savedTourId: null,
      savedOptionCode: null,
      notes: "Embarkation at PortMiami Terminal A; ship departs 4:00 PM.",
    },
    {
      dayNumber: 2,
      date: "2027-01-25",
      stopType: "port",
      portSlug: "nassau",
      portLabel: "Nassau, Bahamas",
      dockOrTender: "dock",
      arrivalTime: "07:00",
      departureTime: "16:00",
      allAboardTime: "15:15",
      savedTourId: "dcc:tour:viator:254526P1",
      savedOptionCode: "TG4",
      notes:
        "Docked at Prince George Wharf (7:00 AM – 4:00 PM; All-Aboard 3:15 PM). Saved excursion: Nassau Swimming Pigs and Private Beach Club Escape (254526P1 · Option TG4 with Cruise Pier Pickup).",
    },
    {
      dayNumber: 3,
      date: "2027-01-26",
      stopType: "sea",
      portSlug: null,
      portLabel: "Cruising (Day at Sea)",
      dockOrTender: "n/a",
      arrivalTime: null,
      departureTime: null,
      allAboardTime: null,
      savedTourId: null,
      savedOptionCode: null,
      notes: "At sea transiting the Old Bahama Channel toward Puerto Rico.",
    },
    {
      dayNumber: 4,
      date: "2027-01-27",
      stopType: "port",
      portSlug: null,
      portLabel: "San Juan, Puerto Rico",
      dockOrTender: "dock",
      arrivalTime: "11:30",
      departureTime: "19:00",
      allAboardTime: "18:15",
      savedTourId: null,
      savedOptionCode: null,
      notes: "Docked at Old San Juan Pier 3 (11:30 AM – 7:00 PM; All-Aboard 6:15 PM).",
    },
    {
      dayNumber: 5,
      date: "2027-01-28",
      stopType: "port",
      portSlug: "st-thomas",
      portLabel: "Charlotte Amalie, St. Thomas, U.S. Virgin Islands",
      dockOrTender: "dock",
      arrivalTime: "08:00",
      departureTime: "18:00",
      allAboardTime: "17:15",
      savedTourId: "dcc:tour:viator:7452P2",
      savedOptionCode: "DEFAULT",
      notes:
        "Docked at Havensight (WICO) / Crown Bay (8:00 AM – 6:00 PM; All-Aboard 5:15 PM). Saved excursion: Turtle Cove Catamaran Snorkel and Sail at Little Buck Island STT (7452P2 · Cruise Pier Pickup).",
    },
    {
      dayNumber: 6,
      date: "2027-01-29",
      stopType: "sea",
      portSlug: null,
      portLabel: "Cruising (Day at Sea)",
      dockOrTender: "n/a",
      arrivalTime: null,
      departureTime: null,
      allAboardTime: null,
      savedTourId: null,
      savedOptionCode: null,
      notes: "At sea returning north across the Atlantic.",
    },
    {
      dayNumber: 7,
      date: "2027-01-30",
      stopType: "sea",
      portSlug: null,
      portLabel: "Cruising (Day at Sea)",
      dockOrTender: "n/a",
      arrivalTime: null,
      departureTime: null,
      allAboardTime: null,
      savedTourId: null,
      savedOptionCode: null,
      notes: "Final sea day en route to Miami.",
    },
    {
      dayNumber: 8,
      date: "2027-01-31",
      stopType: "debarkation",
      portSlug: null,
      portLabel: "Miami, Florida (PortMiami)",
      dockOrTender: "dock",
      arrivalTime: "06:00",
      departureTime: null,
      allAboardTime: null,
      savedTourId: null,
      savedOptionCode: null,
      notes: "Debarkation at PortMiami starting 6:30 AM.",
    },
  ],
  savedExcursionsByPort: {
    nassau: {
      tourId: "dcc:tour:viator:254526P1",
      providerProductCode: "254526P1",
      optionCode: "TG4",
      date: "2027-01-25",
      arrivalTime: "07:00",
      departureTime: "16:00",
      allAboardTime: "15:15",
    },
    "st-thomas": {
      tourId: "dcc:tour:viator:7452P2",
      providerProductCode: "7452P2",
      optionCode: "DEFAULT",
      date: "2027-01-28",
      arrivalTime: "08:00",
      departureTime: "18:00",
      allAboardTime: "17:15",
    },
  },
};

export interface WinterPortEvaluatedPlanSlot {
  portSlug: WinterExcursionPortSlug;
  portSpec: WinterPortLogisticsSpec;
  date: string;
  onActiveSailingItinerary: boolean;
  savedInShareablePlan: boolean;
  shipArrival: string;
  shipDeparture: string;
  allAboardTime: string | null;
  allAboardStatus: "confirmed" | "missing_needs_confirmation";
  selectedOption: MatchedTourOption | null;
  needsConfirmationSampleOption: MatchedTourOption | null;
  allMatchedOptions: MatchedTourOption[];
  matchMetrics: TripMatchResponse["metrics"];
}

export interface EvaluatedWinterSailingPlanResponse {
  ok: true;
  generatedAt: string;
  plan: ShareableWinterSailingDefinition;
  shipName: string;
  sailDate: string;
  party: {
    adults: number;
    childAges: number[];
    totalGuests: number;
  };
  surface: "cruisepromenade" | "dcc";
  savedPortsSummary: {
    savedPortSlugs: WinterExcursionPortSlug[];
    savedToursCount: number;
    combinedPartyTotalCents: number;
    combinedPartyTotalFormatted: string;
    currency: "USD";
    savedSelections: Array<{
      portSlug: WinterExcursionPortSlug;
      portName: string;
      date: string;
      tourId: string;
      providerProductCode: string;
      title: string;
      optionCode: string | null;
      optionTitle: string | null;
      suitability: "recommended" | "needs_confirmation" | "ineligible";
      suitabilityLabel: "Recommended" | "Needs confirmation" | "Ineligible";
      verifiedDepartureTime: string | null;
      availableDepartureTimes: string[];
      pickupFulfillmentType: string;
      pickupBadgeLabel: string;
      applicableBerthOrMeetingPoint: string | null;
      isTenderPort: boolean;
      debarkOrTenderClearanceMinutes: number;
      transferBeforeMinutes: number | null;
      transferAfterMinutes: number | null;
      shipArrival: string;
      shipDeparture: string;
      allAboardTime: string | null;
      unitPriceCents: number | null;
      totalPartyPriceCents: number | null;
      totalPartyPriceFormatted: string;
      priceVerifiedLive: boolean;
      checkoutProvider: "viator";
      trackedViatorCheckoutUrl: string;
      clickId: string | null;
    }>;
  };
  fivePortsBySlug: Record<WinterExcursionPortSlug, WinterPortEvaluatedPlanSlot>;
}

const DEFAULT_FIVE_PORT_DATES_FOR_JAN_24_WEEK: Record<WinterExcursionPortSlug, string> = {
  nassau: "2027-01-25",
  cozumel: "2027-01-26",
  roatan: "2027-01-27",
  "st-thomas": "2027-01-28",
  "grand-cayman": "2027-01-29",
};

export async function evaluateWinterSailingPlan(params?: {
  planCode?: string | null;
  shipName?: string | null;
  sailDate?: string | null;
  adults?: number;
  childAges?: number[];
  surface?: "cruisepromenade" | "dcc";
  enableShortlistLiveCheck?: boolean;
  savedPortOverrides?: Partial<Record<WinterExcursionPortSlug, string | null>>;
  missingAllAboardPorts?: WinterExcursionPortSlug[];
  recordOpen?: boolean;
  visitorId?: string | null;
  isTest?: boolean;
}): Promise<EvaluatedWinterSailingPlanResponse> {
  const plan = INDEPENDENCE_JAN_24_2027_SHAREABLE_PLAN;
  const shipName = params?.shipName?.trim() || plan.shipName;
  const sailDate = params?.sailDate?.trim() || plan.sailDate;
  const adults =
    typeof params?.adults === "number" && params.adults >= 1
      ? Math.floor(params.adults)
      : plan.defaultAdults;
  const childAges = Array.isArray(params?.childAges) ? params.childAges : plan.defaultChildAges;
  const totalGuests = adults + childAges.length;
  const surface = params?.surface || "cruisepromenade";
  const enableLiveCheck = params?.enableShortlistLiveCheck !== false;
  const missingAllAboardSet = new Set<WinterExcursionPortSlug>(
    params?.missingAllAboardPorts || [],
  );

  if (params?.recordOpen) {
    recordPlanOpenEvent({
      visitorId: params.visitorId,
      planCode: params.planCode || plan.planCode,
      sourcePage:
        surface === "cruisepromenade"
          ? `/p/${plan.planCode}`
          : `/cruises/winter-excursion-planner?plan=${plan.planCode}`,
      placementId: plan.placementId,
      propertySlug: plan.shipSlug,
      surface,
      isTest: params.isTest,
    });
  }

  const fivePortsBySlug = {} as Record<WinterExcursionPortSlug, WinterPortEvaluatedPlanSlot>;

  for (const portSlug of WINTER_EXCURSION_PORT_SLUGS) {
    const spec = WINTER_PORT_LOGISTICS_SPECS[portSlug];
    const savedPreset = plan.savedExcursionsByPort[portSlug];
    const overrideTourId =
      params?.savedPortOverrides && portSlug in params.savedPortOverrides
        ? params.savedPortOverrides[portSlug]
        : undefined;
    const effectiveSavedTourId =
      overrideTourId !== undefined ? overrideTourId : savedPreset?.tourId || null;

    const date = savedPreset?.date || DEFAULT_FIVE_PORT_DATES_FOR_JAN_24_WEEK[portSlug];
    const shipArrival = savedPreset?.arrivalTime || spec.defaultArrivalTime;
    const shipDeparture = savedPreset?.departureTime || spec.defaultDepartureTime;
    const omitAllAboard = missingAllAboardSet.has(portSlug);
    const allAboardTime = omitAllAboard
      ? undefined
      : savedPreset?.allAboardTime || spec.defaultAllAboardTime;

    const matchRes = await matchToursForTrip({
      destination: portSlug,
      portSlug,
      date,
      adults,
      childAges,
      requiresPierPickup: true,
      pickupMode: "pier_pickup",
      shipArrival,
      shipDeparture,
      allAboardTime,
      isTenderPort: spec.isTenderPort,
      tenderClearanceMinutes: spec.defaultClearanceMinutes,
      surface,
      propertySlug: portSlug,
      placementId: plan.placementId,
      enableShortlistLiveCheck: enableLiveCheck,
      shortlistMaxCount: 3,
      limit: 8,
      isTest: params?.isTest ?? true,
    });

    const selectedOption =
      (effectiveSavedTourId
        ? matchRes.options.find(
            (o) =>
              o.tourId === effectiveSavedTourId ||
              o.providerProductCode === effectiveSavedTourId,
          )
        : null) ||
      matchRes.options.find(
        (o) =>
          o.tourId === spec.defaultFeaturedTourId ||
          o.providerProductCode === spec.defaultFeaturedProductCode,
      ) ||
      matchRes.options[0] ||
      null;

    // Also compute a deterministic "Needs confirmation" comparison when allAboardTime is missing
    const needsConfirmationSampleOption =
      matchRes.options.find((o) => o.suitability === "needs_confirmation") || null;

    fivePortsBySlug[portSlug] = {
      portSlug,
      portSpec: spec,
      date,
      onActiveSailingItinerary: Boolean(savedPreset),
      savedInShareablePlan: Boolean(effectiveSavedTourId),
      shipArrival,
      shipDeparture,
      allAboardTime: allAboardTime || null,
      allAboardStatus: allAboardTime ? "confirmed" : "missing_needs_confirmation",
      selectedOption,
      needsConfirmationSampleOption,
      allMatchedOptions: matchRes.options.slice(0, 5),
      matchMetrics: matchRes.metrics,
    };
  }

  const savedSelections: EvaluatedWinterSailingPlanResponse["savedPortsSummary"]["savedSelections"] =
    [];
  let combinedPartyTotalCents = 0;

  for (const portSlug of WINTER_EXCURSION_PORT_SLUGS) {
    const slot = fivePortsBySlug[portSlug];
    if (!slot.savedInShareablePlan || !slot.selectedOption) continue;
    const opt = slot.selectedOption;
    const partyCents = opt.boundOffer.totalPartyPriceCents ?? 0;
    combinedPartyTotalCents += partyCents;
    const suitabilityLabel =
      opt.suitability === "recommended"
        ? "Recommended"
        : opt.suitability === "needs_confirmation"
          ? "Needs confirmation"
          : "Ineligible";

    savedSelections.push({
      portSlug,
      portName: slot.portSpec.portName,
      date: slot.date,
      tourId: opt.tourId,
      providerProductCode: opt.providerProductCode,
      title: opt.title,
      optionCode: opt.boundOffer.optionCode,
      optionTitle: opt.boundOffer.optionTitle,
      suitability: opt.suitability,
      suitabilityLabel,
      verifiedDepartureTime:
        opt.boundOffer.departureTime ||
        opt.boundOffer.fittingDepartureTimes[0] ||
        opt.boundOffer.availableDepartureTimes[0] ||
        null,
      availableDepartureTimes: opt.boundOffer.availableDepartureTimes,
      pickupFulfillmentType: opt.boundOffer.pickupFulfillmentType,
      pickupBadgeLabel: opt.boundOffer.pickupBadgeLabel,
      applicableBerthOrMeetingPoint: opt.boundOffer.applicableBerthOrMeetingPoint ?? null,
      isTenderPort: slot.portSpec.isTenderPort,
      debarkOrTenderClearanceMinutes:
        opt.cruiseScheduleFit?.debarkClearanceMinutes ?? slot.portSpec.defaultClearanceMinutes,
      transferBeforeMinutes: opt.boundOffer.transferBeforeMinutes,
      transferAfterMinutes: opt.boundOffer.transferAfterMinutes,
      shipArrival: slot.shipArrival,
      shipDeparture: slot.shipDeparture,
      allAboardTime: slot.allAboardTime,
      unitPriceCents: opt.boundOffer.unitPriceCents,
      totalPartyPriceCents: opt.boundOffer.totalPartyPriceCents,
      totalPartyPriceFormatted:
        opt.boundOffer.totalPartyPriceCents !== null
          ? `$${(opt.boundOffer.totalPartyPriceCents / 100).toFixed(2)}`
          : "Check at Viator",
      priceVerifiedLive: opt.boundOffer.priceVerifiedLive,
      checkoutProvider: "viator",
      trackedViatorCheckoutUrl:
        opt.bookingPath.trackedClickUrl || opt.bookingPath.handoffUrl || "",
      clickId: opt.bookingPath.clickId,
    });
  }

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    plan,
    shipName,
    sailDate,
    party: {
      adults,
      childAges,
      totalGuests,
    },
    surface,
    savedPortsSummary: {
      savedPortSlugs: savedSelections.map((s) => s.portSlug),
      savedToursCount: savedSelections.length,
      combinedPartyTotalCents,
      combinedPartyTotalFormatted: `$${(combinedPartyTotalCents / 100).toFixed(2)}`,
      currency: "USD",
      savedSelections,
    },
    fivePortsBySlug,
  };
}

export interface WinterAttributionReplayTraceResult {
  ok: true;
  placementId: string;
  planCode: string;
  clickId: string;
  provider: "viator";
  productCode: string;
  providerBookingRef: string;
  trackingCampaignTag: string;
  firstDelivery: {
    matched: boolean;
    duplicateDelivery: boolean;
    eventType: string;
    grossRevenueUsd: number | null;
    estimatedCommissionUsd: number | null;
  };
  secondDeliveryReplay: {
    matched: boolean;
    duplicateDelivery: boolean;
    replayIgnored: boolean;
  };
  commissionSettlementDelivery: {
    matched: boolean;
    duplicateDelivery: boolean;
    paidCommissionUsd: number | null;
  };
  funnelSnapshotAfterReplay: {
    production: FunnelMetricsReport["production"];
    test: FunnelMetricsReport["test"];
  };
  newOrleansParallelStatus: {
    monteleonePlacementId: string;
    monteleoneApprovalStatus: string;
    monteleoneIsDemoPreset: boolean;
    jeanLafitteTourId: string;
    jeanLafitteOfferItemId: string;
    payableFallbackOfferTourId: string;
    specificApprovalsStillNeeded: Array<{
      approvalId: string;
      party: string;
      status: "pending_approval";
      requiredAction: string;
      unlocksCapability: string;
    }>;
  };
}

/**
 * Replays a labeled provider test event (`isTest: true`) for the Winter Excursion Planner placement
 * and proves that:
 * 1) Plan opens, outbound clicks, provider-confirmed bookings, and paid commissions are tracked separately,
 * 2) Replaying the same provider event credits the placement (`fp-cp-winter-excursion-planner`) exactly once
 *    (`duplicateDelivery: true` on the second replay, `duplicateDeliveriesIgnored: 1`),
 * 3) Production counters remain untouched (`0`), and
 * 4) The Hotel Monteleone New Orleans pilot remains pending until operator terms and hotel placement are approved.
 */
export function runWinterAttributionReplayAndNolaStatusTrace(): WinterAttributionReplayTraceResult {
  const placementId = "fp-cp-winter-excursion-planner";
  const planCode = "INDY-2027-01-24";

  // 1. Record a labeled test plan open
  recordPlanOpenEvent({
    visitorId: "test_vis_indy_2027_01_24_group_leader",
    planCode,
    sourcePage: "/p/INDY-2027-01-24",
    placementId,
    propertySlug: "independence-of-the-seas",
    surface: "cruisepromenade",
    isTest: true,
  });

  // 2. Issue recommendation & follow outbound click for Nassau Swimming Pigs (254526P1 Option TG4)
  const clickAttr = issueOpaqueClickAttribution({
    decisionReceiptId: "rcpt:cp:winter-plan:INDY-2027-01-24:nassau:254526P1:TG4",
    recommendedOperatorId: "viator:254526P1",
    recommendedOperatorName: "Pieces of 8 Tours Bahamas",
    evidenceVersion: "dcc_winter_excursion_planner_v1",
    originatingSite: "cruisepromenade.com",
    originatingPage: "/p/INDY-2027-01-24",
    placementId,
    propertySlug: "nassau",
    surface: "cruisepromenade",
    provider: "viator",
    productCode: "254526P1",
    productDestinationUrl:
      "https://www.viator.com/tours/Nassau/Pigs-cant-fly-but-they-do-swim/d420-254526P1?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=cp-nassau-254526p1",
    recordStage: "recommendation",
    isTest: true,
  });

  recordOutboundClickFollow(clickAttr.clickId, {
    userAgent: "Mozilla/5.0 (DCC-Winter-Planner-QA-Verification)",
    referer: "https://cruisepromenade.com/p/INDY-2027-01-24",
  });

  const trackingCampaignTag = `${placementId}-TG4-${clickAttr.clickId}`;
  const providerBookingRef = "TEST-VIATOR-INDY2027-NASSAU-254526P1-01";

  // 3. Deliver labeled provider test event #1 (BOOKING_CONFIRMED)
  const firstRes = reconcilePartnerWebhookByClickId({
    trackingParamValue: trackingCampaignTag,
    provider: "viator",
    providerBookingRef,
    eventType: "BOOKING_CONFIRMED",
    grossRevenueUsd: 338.0,
    estimatedCommissionUsd: 27.04,
    paidCommissionUsd: null,
    currency: "USD",
    isTest: true,
  });

  if (!firstRes.matched) {
    throw new Error("Expected first provider test event to match click attribution record.");
  }

  // 4. Replay the exact same labeled provider test event #2 -> must be ignored as duplicate
  const replayRes = reconcilePartnerWebhookByClickId({
    trackingParamValue: trackingCampaignTag,
    provider: "viator",
    providerBookingRef,
    eventType: "BOOKING_CONFIRMED",
    grossRevenueUsd: 338.0,
    estimatedCommissionUsd: 27.04,
    paidCommissionUsd: null,
    currency: "USD",
    isTest: true,
  });

  if (!replayRes.matched) {
    throw new Error("Expected replay provider test event to resolve click attribution record.");
  }

  // 5. Deliver commission settlement event (BOOKING_FULFILLED with paidCommissionUsd: 27.04)
  const settlementRes = reconcilePartnerWebhookByClickId({
    trackingParamValue: trackingCampaignTag,
    provider: "viator",
    providerBookingRef,
    eventType: "BOOKING_FULFILLED",
    grossRevenueUsd: 338.0,
    estimatedCommissionUsd: 27.04,
    paidCommissionUsd: 27.04,
    currency: "USD",
    isTest: true,
  });

  if (!settlementRes.matched) {
    throw new Error("Expected settlement test event to resolve click attribution record.");
  }

  const funnelSnapshot = getFunnelMetricsReport({ placementId });

  const ledgerState = readDurableLedgerState();
  const monteleonePlacementId = "nola-hotel-monteleone-demo-pilot";
  const monteleoneApproval = ledgerState.placementApprovalsById?.[monteleonePlacementId] || null;
  const monteleoneConfig = HOTEL_CONCIERGE_CONFIGS["hotel-monteleone-nola"];
  const isMonteleoneApprovedLive = monteleoneApproval?.status === "verified_partner_live";

  return {
    ok: true,
    placementId,
    planCode,
    clickId: clickAttr.clickId,
    provider: "viator",
    productCode: "254526P1",
    providerBookingRef,
    trackingCampaignTag,
    firstDelivery: {
      matched: firstRes.matched,
      duplicateDelivery: firstRes.outcome.duplicateDelivery,
      eventType: firstRes.outcome.eventType,
      grossRevenueUsd: firstRes.outcome.grossRevenueUsd,
      estimatedCommissionUsd: firstRes.outcome.estimatedCommissionUsd,
    },
    secondDeliveryReplay: {
      matched: replayRes.matched,
      duplicateDelivery: replayRes.outcome.duplicateDelivery,
      replayIgnored: replayRes.outcome.duplicateDelivery === true,
    },
    commissionSettlementDelivery: {
      matched: settlementRes.matched,
      duplicateDelivery: settlementRes.outcome.duplicateDelivery,
      paidCommissionUsd: settlementRes.outcome.paidCommissionUsd,
    },
    funnelSnapshotAfterReplay: {
      production: funnelSnapshot.production,
      test: funnelSnapshot.test,
    },
    newOrleansParallelStatus: {
      monteleonePlacementId,
      monteleoneApprovalStatus: isMonteleoneApprovedLive
        ? "verified_partner_live"
        : "unverified_demo_preset_pending_hotel_approval",
      monteleoneIsDemoPreset: !isMonteleoneApprovedLive && Boolean(monteleoneConfig?.isDemoPreset),
      jeanLafitteTourId: "dcc:tour:fh:jeanlafitteswamptour:763318",
      jeanLafitteOfferItemId: "763318",
      payableFallbackOfferTourId: "dcc:tour:viator:15200P6",
      specificApprovalsStillNeeded: [
        {
          approvalId: "nola_approval_1_jean_lafitte_fareharbor_asn_terms",
          party: "Jean Lafitte Swamp Tours (jeanlafitteswamptour)",
          status: "pending_approval",
          requiredAction:
            "Confirm the authorized FareHarbor affiliate shortname ('aktourcenter' or 'welcometoneworleanstours') for item #763318, enable affiliate rules (is_affiliate_rules_applied: true), confirm commission rate & Net-30 ASN payout terms, and authorize monthly booking report / webhook delivery carrying online_booking_references (<placementId>-clk_<24hex>).",
          unlocksCapability:
            "Transitions Jean Lafitte #763318 from 'Commission terms pending' to 'Commission terms confirmed' for direct FareHarbor checkout.",
        },
        {
          approvalId: "nola_approval_2_hotel_monteleone_concierge_placement",
          party: "Hotel Monteleone Concierge & Guest Services (214 Royal St, New Orleans)",
          status: "pending_approval",
          requiredAction:
            "Written confirmation from Hotel Monteleone approving pre-arrival email/concierge distribution of the guest link for placement 'nola-hotel-monteleone-demo-pilot' and confirming 214 Royal St Royal Street main entrance shuttle staging.",
          unlocksCapability:
            "Transitions placement 'nola-hotel-monteleone-demo-pilot' from 'unverified_demo_preset_pending_hotel_approval' to 'verified_partner_live' via POST /api/v1/concierge/telemetry (action: 'activate_placement').",
        },
        {
          approvalId: "nola_approval_3_fareharbor_external_api_capacity_and_booking",
          party: "Jean Lafitte Swamp Tours + FareHarbor Partner Support (Optional API Tier)",
          status: "pending_approval",
          requiredAction:
            "Provision FareHarbor External API user key permissions for 'jeanlafitteswamptour' item #763318 so numeric seat capacity and direct API booking writes are enabled.",
          unlocksCapability:
            "Transitions 'Check seats at FareHarbor' -> 'Live seat count verified' and 'API booking requires approval' -> 'API booking approved'.",
        },
      ],
    },
  };
}
