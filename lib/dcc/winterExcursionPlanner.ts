import {
  matchToursForTrip,
  type MatchedTourOption,
  type TripMatchResponse,
} from "./catalog/matcher";
import { PILOT_VERIFIED_TOUR_RECORDS } from "./catalog/durableCatalogStore";
import {
  deriveServerReferralIdForOffer,
  getFunnelMetricsReport,
  issueOpaqueClickAttribution,
  reconcilePartnerWebhookByClickId,
  recordOutboundClickFollow,
  recordPlanOpenEvent,
  type FunnelMetricsReport,
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

export const ALL_WINTER_SAILING_PORT_SLUGS = [
  "nassau",
  "san-juan",
  "st-thomas",
  "cozumel",
  "roatan",
  "grand-cayman",
] as const;

export type WinterSailingPortSlug = (typeof ALL_WINTER_SAILING_PORT_SLUGS)[number];

export interface WinterPortLogisticsSpec {
  portSlug: WinterSailingPortSlug;
  portName: string;
  countryOrTerritory: string;
  dockOrTender: "dock" | "tender";
  isTenderPort: boolean;
  defaultClearanceMinutes: number;
  terminalOrBerthName: string;
  dccPortGuidePath: string;
  dccPortGuideUrl: string;
  cruisePromenadePortUrl: string;
  defaultFeaturedTourId: string | null;
  defaultFeaturedProductCode: string | null;
  defaultArrivalTime: string;
  defaultDepartureTime: string;
  defaultAllAboardTime: string;
  defaultLastTenderTime: string | null;
  logisticsSummary: string;
}

export const ALL_WINTER_PORT_LOGISTICS_SPECS: Record<
  WinterSailingPortSlug,
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
    defaultLastTenderTime: null,
    logisticsSummary:
      "Docked at Prince George Wharf. Requires 30m ship debark clearance + 15m verified terminal shuttle to Montague Foreshore Marina on Option TG4.",
  },
  "san-juan": {
    portSlug: "san-juan",
    portName: "San Juan, Puerto Rico",
    countryOrTerritory: "Puerto Rico (U.S.)",
    dockOrTender: "dock",
    isTenderPort: false,
    defaultClearanceMinutes: 30,
    terminalOrBerthName: "Old San Juan Pier 3 (Step-Off Walkable into Historic District)",
    dccPortGuidePath: "/ports/san-juan",
    dccPortGuideUrl: "https://www.destinationcommandcenter.com/ports/san-juan",
    cruisePromenadePortUrl: "https://cruisepromenade.com/ports/san-juan-puerto-rico",
    defaultFeaturedTourId: null,
    defaultFeaturedProductCode: null,
    defaultArrivalTime: "11:30",
    defaultDepartureTime: "19:00",
    defaultAllAboardTime: "18:15",
    defaultLastTenderTime: null,
    logisticsSummary:
      "Docked at Old San Juan Pier 3 (11:30 AM – 7:00 PM; All-Aboard 6:15 PM). Step-off walkable into Old San Juan; 0 matched commercial catalog tours currently configured for this call.",
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
    defaultLastTenderTime: null,
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
    defaultLastTenderTime: null,
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
    defaultLastTenderTime: null,
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
    defaultLastTenderTime: "14:45",
    logisticsSummary:
      "TENDER PORT at George Town Harbour. Requires 45m ship-to-shore tender clearance + 20m North Sound marina shuttle each way before last tender.",
  },
};

export const WINTER_PORT_LOGISTICS_SPECS: Record<
  WinterExcursionPortSlug,
  WinterPortLogisticsSpec
> = {
  nassau: ALL_WINTER_PORT_LOGISTICS_SPECS.nassau,
  "st-thomas": ALL_WINTER_PORT_LOGISTICS_SPECS["st-thomas"],
  cozumel: ALL_WINTER_PORT_LOGISTICS_SPECS.cozumel,
  roatan: ALL_WINTER_PORT_LOGISTICS_SPECS.roatan,
  "grand-cayman": ALL_WINTER_PORT_LOGISTICS_SPECS["grand-cayman"],
};

export interface WinterSailingItineraryDay {
  dayNumber: number;
  date: string;
  stopType: "embarkation" | "port" | "sea" | "debarkation";
  portSlug: WinterSailingPortSlug | null;
  portLabel: string;
  dockOrTender: "dock" | "tender" | "n/a";
  arrivalTime: string | null;
  departureTime: string | null;
  allAboardTime: string | null;
  lastTenderTime?: string | null;
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
      WinterSailingPortSlug,
      {
        tourId: string;
        providerProductCode: string;
        optionCode: string | null;
        date: string;
        arrivalTime: string;
        departureTime: string;
        allAboardTime: string;
        lastTenderTime?: string | null;
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
      portSlug: "san-juan",
      portLabel: "San Juan, Puerto Rico",
      dockOrTender: "dock",
      arrivalTime: "11:30",
      departureTime: "19:00",
      allAboardTime: "18:15",
      savedTourId: null,
      savedOptionCode: null,
      notes:
        "Docked at Old San Juan Pier 3 (11:30 AM – 7:00 PM; All-Aboard 6:15 PM). Shown on itinerary; 0 matched commercial catalog tours configured (step-off walkable into Old San Juan).",
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

export const WESTERN_CARIBBEAN_JAN_24_2027_SHAREABLE_PLAN: ShareableWinterSailingDefinition = {
  planCode: "WESTERN-2027-01-24",
  sailingId: "WC07MIA-20270124",
  cruiseLine: "Royal Caribbean International",
  shipName: "Symphony of the Seas",
  shipSlug: "symphony-of-the-seas",
  itineraryTitle: "7-Night Western Caribbean (Cozumel · Roatán · Grand Cayman)",
  sailDate: "2027-01-24",
  returnDate: "2027-01-31",
  durationNights: 7,
  embarkationPort: "Miami, Florida",
  officialCruiseLineItineraryUrl: "https://www.royalcaribbean.com/cruises",
  cruisePromenadeShareUrl: "https://cruisepromenade.com/p/WESTERN-2027-01-24",
  dccShareUrl:
    "https://www.destinationcommandcenter.com/cruises/winter-excursion-planner?plan=WESTERN-2027-01-24",
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
      departureTime: "16:30",
      allAboardTime: "15:30",
      savedTourId: null,
      savedOptionCode: null,
      notes: "Embarkation at PortMiami.",
    },
    {
      dayNumber: 2,
      date: "2027-01-25",
      stopType: "sea",
      portSlug: null,
      portLabel: "Cruising (Day at Sea)",
      dockOrTender: "n/a",
      arrivalTime: null,
      departureTime: null,
      allAboardTime: null,
      savedTourId: null,
      savedOptionCode: null,
      notes: "At sea.",
    },
    {
      dayNumber: 3,
      date: "2027-01-26",
      stopType: "port",
      portSlug: "cozumel",
      portLabel: "Cozumel, Mexico",
      dockOrTender: "dock",
      arrivalTime: "07:00",
      departureTime: "17:00",
      allAboardTime: "16:15",
      savedTourId: "dcc:tour:viator:5553274P1",
      savedOptionCode: "TG2",
      notes: "Docked at International Pier / Puerta Maya (7:00 AM – 5:00 PM; All-Aboard 4:15 PM).",
    },
    {
      dayNumber: 4,
      date: "2027-01-27",
      stopType: "port",
      portSlug: "roatan",
      portLabel: "Roatán, Honduras",
      dockOrTender: "dock",
      arrivalTime: "08:00",
      departureTime: "17:00",
      allAboardTime: "16:15",
      savedTourId: "dcc:tour:viator:62963P76",
      savedOptionCode: "DEFAULT",
      notes: "Docked at Coxen Hole / Mahogany Bay (8:00 AM – 5:00 PM; All-Aboard 4:15 PM).",
    },
    {
      dayNumber: 5,
      date: "2027-01-28",
      stopType: "port",
      portSlug: "grand-cayman",
      portLabel: "George Town, Grand Cayman",
      dockOrTender: "tender",
      arrivalTime: "07:30",
      departureTime: "16:00",
      allAboardTime: "15:00",
      lastTenderTime: "14:45",
      savedTourId: "dcc:tour:viator:10309P3",
      savedOptionCode: "TG1",
      notes: "Tender port at George Town Harbour (7:30 AM – 4:00 PM; Last Tender 2:45 PM).",
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
      notes: "At sea.",
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
      notes: "At sea.",
    },
    {
      dayNumber: 8,
      date: "2027-01-31",
      stopType: "debarkation",
      portSlug: null,
      portLabel: "Miami, Florida (PortMiami)",
      dockOrTender: "dock",
      arrivalTime: "06:30",
      departureTime: null,
      allAboardTime: null,
      savedTourId: null,
      savedOptionCode: null,
      notes: "Debarkation at PortMiami.",
    },
  ],
  savedExcursionsByPort: {
    cozumel: {
      tourId: "dcc:tour:viator:5553274P1",
      providerProductCode: "5553274P1",
      optionCode: "TG2",
      date: "2027-01-26",
      arrivalTime: "07:00",
      departureTime: "17:00",
      allAboardTime: "16:15",
    },
    roatan: {
      tourId: "dcc:tour:viator:62963P76",
      providerProductCode: "62963P76",
      optionCode: "DEFAULT",
      date: "2027-01-27",
      arrivalTime: "08:00",
      departureTime: "17:00",
      allAboardTime: "16:15",
    },
    "grand-cayman": {
      tourId: "dcc:tour:viator:10309P3",
      providerProductCode: "10309P3",
      optionCode: "TG1",
      date: "2027-01-28",
      arrivalTime: "07:30",
      departureTime: "16:00",
      allAboardTime: "15:00",
      lastTenderTime: "14:45",
    },
  },
};

export const SHAREABLE_WINTER_SAILING_PLANS_BY_CODE: Record<
  string,
  ShareableWinterSailingDefinition
> = {
  "INDY-2027-01-24": INDEPENDENCE_JAN_24_2027_SHAREABLE_PLAN,
  "WESTERN-2027-01-24": WESTERN_CARIBBEAN_JAN_24_2027_SHAREABLE_PLAN,
};

export function resolveShareableWinterSailingPlan(
  planCode?: string | null,
): ShareableWinterSailingDefinition {
  const normalized = (planCode || "INDY-2027-01-24").trim().toUpperCase();
  return (
    SHAREABLE_WINTER_SAILING_PLANS_BY_CODE[normalized] ||
    INDEPENDENCE_JAN_24_2027_SHAREABLE_PLAN
  );
}

export interface RejectedOffItineraryTourRequest {
  requestedPortSlug: string;
  requestedTourId: string;
  actualTourPortSlug: string | null;
  activePlanCode: string;
  activeSailingPortSlugs: WinterSailingPortSlug[];
  reason: string;
  applicablePortGuideUrl: string | null;
  applicableSailingPlanUrl: string | null;
}

export interface WinterPortEvaluatedPlanSlot {
  portSlug: WinterSailingPortSlug;
  portSpec: WinterPortLogisticsSpec;
  dayNumber: number | null;
  date: string;
  onActiveSailingItinerary: boolean;
  savedInShareablePlan: boolean;
  shipArrival: string;
  shipDeparture: string;
  allAboardTime: string | null;
  lastTenderTime: string | null;
  allAboardStatus: "confirmed" | "missing_needs_confirmation";
  lastTenderStatus: "confirmed" | "missing_needs_confirmation" | "not_applicable";
  cruiseFitRecommendationWithheld: boolean;
  checkoutEligible: boolean;
  matchedToursCount: number;
  noMatchedToursReason: string | null;
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
  organizerShareLinks: {
    cruisePromenadeOrganizerUrl: string;
    dccOrganizerUrl: string;
    placementId: string;
    tracksSeparately: readonly [
      "planOpens",
      "outboundClicks",
      "providerConfirmedBookings",
      "paidCommissions",
    ];
  };
  party: {
    adults: number;
    childAges: number[];
    totalGuests: number;
  };
  surface: "cruisepromenade" | "dcc";
  sailingPortCallSlugs: WinterSailingPortSlug[];
  sailingPortCalls: WinterPortEvaluatedPlanSlot[];
  otherWinterPortGuides: Array<{
    portSlug: WinterExcursionPortSlug;
    portName: string;
    dockOrTender: "dock" | "tender";
    dccPortGuidePath: string;
    dccPortGuideUrl: string;
    cruisePromenadePortUrl: string;
    applicableSailingPlanCode: string;
    applicableSailingPlanUrl: string;
  }>;
  offItineraryBlocked: boolean;
  rejectedOffItineraryRequests: RejectedOffItineraryTourRequest[];
  savedPortsSummary: {
    savedPortSlugs: WinterSailingPortSlug[];
    savedToursCount: number;
    bookableSavedToursCount: number;
    combinedPartyTotalCents: number;
    combinedPartyTotalFormatted: string;
    currency: "USD";
    savedSelections: Array<{
      portSlug: WinterSailingPortSlug;
      portName: string;
      date: string;
      tourId: string;
      providerProductCode: string;
      title: string;
      optionCode: string | null;
      optionTitle: string | null;
      suitability: "recommended" | "needs_confirmation" | "ineligible";
      suitabilityLabel: "Recommended" | "Needs confirmation" | "Ineligible";
      cruiseFitRecommendationWithheld: boolean;
      checkoutEligible: boolean;
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
      lastTenderTime: string | null;
      unitPriceCents: number | null;
      totalPartyPriceCents: number | null;
      totalPartyPriceFormatted: string;
      priceVerifiedLive: boolean;
      checkoutProvider: "viator";
      placementId: string;
      trackedViatorCheckoutUrl: string | null;
      clickId: string | null;
    }>;
  };
  fivePortsBySlug: Record<WinterExcursionPortSlug, WinterPortEvaluatedPlanSlot>;
}

const DEFAULT_FIVE_PORT_DATES_FOR_JAN_24_WEEK: Record<WinterSailingPortSlug, string> = {
  nassau: "2027-01-25",
  cozumel: "2027-01-26",
  "san-juan": "2027-01-27",
  roatan: "2027-01-27",
  "st-thomas": "2027-01-28",
  "grand-cayman": "2027-01-29",
};

function findCatalogTourRecord(tourIdOrProductCode: string) {
  const needle = tourIdOrProductCode.trim();
  if (!needle) return null;
  return (
    PILOT_VERIFIED_TOUR_RECORDS.find(
      (r) =>
        r.tourId.toLowerCase() === needle.toLowerCase() ||
        r.providerProductCode.toLowerCase() === needle.toLowerCase() ||
        r.compatibilityAliases.some((a) => a.toLowerCase() === needle.toLowerCase()),
    ) || null
  );
}

export async function evaluateWinterSailingPlan(params?: {
  planCode?: string | null;
  shipName?: string | null;
  sailDate?: string | null;
  adults?: number;
  childAges?: number[];
  surface?: "cruisepromenade" | "dcc";
  enableShortlistLiveCheck?: boolean;
  savedPortOverrides?: Record<string, string | null | undefined>;
  missingAllAboardPorts?: string[];
  missingLastTenderPorts?: string[];
  recordOpen?: boolean;
  visitorId?: string | null;
  isTest?: boolean;
}): Promise<EvaluatedWinterSailingPlanResponse> {
  const plan = resolveShareableWinterSailingPlan(params?.planCode);
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

  const missingAllAboardSet = new Set<string>(
    (params?.missingAllAboardPorts || []).map((p) => p.trim().toLowerCase()).filter(Boolean),
  );
  const missingLastTenderSet = new Set<string>(
    (params?.missingLastTenderPorts || []).map((p) => p.trim().toLowerCase()).filter(Boolean),
  );

  // Derive the active sailing's verified port calls strictly from the sailing's itineraryDays
  const itineraryPortDays = plan.itineraryDays.filter(
    (d): d is WinterSailingItineraryDay & { portSlug: WinterSailingPortSlug } =>
      d.stopType === "port" && d.portSlug !== null,
  );
  const sailingPortCallSlugs = itineraryPortDays.map((d) => d.portSlug);
  const sailingPortCallSet = new Set<string>(sailingPortCallSlugs);

  // Inspect any incoming savedPortOverrides and block off-itinerary ports or cross-port tour IDs
  const rejectedOffItineraryRequests: RejectedOffItineraryTourRequest[] = [];
  const validatedOverrides: Partial<Record<WinterSailingPortSlug, string | null>> = {};

  if (params?.savedPortOverrides && typeof params.savedPortOverrides === "object") {
    for (const [rawPortKey, rawTourVal] of Object.entries(params.savedPortOverrides)) {
      if (rawTourVal === undefined) continue;
      const normalizedPort = rawPortKey.trim().toLowerCase();
      if (rawTourVal === null || rawTourVal.trim() === "" || rawTourVal.trim() === "none") {
        if (sailingPortCallSet.has(normalizedPort)) {
          validatedOverrides[normalizedPort as WinterSailingPortSlug] = null;
        }
        continue;
      }

      const trimmedTour = rawTourVal.trim();
      const catalogRec = findCatalogTourRecord(trimmedTour);
      const actualTourPortSlug = catalogRec?.portSlug || catalogRec?.destinationSlug || null;

      // Case 1: Port itself is not on the active sailing's itinerary (e.g. cozumel on INDY-2027-01-24)
      if (!sailingPortCallSet.has(normalizedPort)) {
        const offPortSpec =
          ALL_WINTER_PORT_LOGISTICS_SPECS[normalizedPort as WinterSailingPortSlug] || null;
        rejectedOffItineraryRequests.push({
          requestedPortSlug: normalizedPort,
          requestedTourId: trimmedTour,
          actualTourPortSlug,
          activePlanCode: plan.planCode,
          activeSailingPortSlugs: sailingPortCallSlugs,
          reason: `Port "${normalizedPort}" is not on the verified ${plan.shipName} (${plan.planCode}) sailing itinerary (${sailingPortCallSlugs.join(", ")}). Off-itinerary tours cannot be saved or added to this sailing plan.`,
          applicablePortGuideUrl: offPortSpec?.dccPortGuideUrl || null,
          applicableSailingPlanUrl:
            normalizedPort === "cozumel" ||
            normalizedPort === "roatan" ||
            normalizedPort === "grand-cayman"
              ? WESTERN_CARIBBEAN_JAN_24_2027_SHAREABLE_PLAN.dccShareUrl
              : null,
        });
        continue;
      }

      // Case 2: Tour belongs to a different port (e.g. Cozumel tour 5553274P1 passed under tour_nassau)
      if (!catalogRec || (actualTourPortSlug && actualTourPortSlug !== normalizedPort)) {
        const offPortSpec =
          actualTourPortSlug && actualTourPortSlug in ALL_WINTER_PORT_LOGISTICS_SPECS
            ? ALL_WINTER_PORT_LOGISTICS_SPECS[actualTourPortSlug as WinterSailingPortSlug]
            : null;
        rejectedOffItineraryRequests.push({
          requestedPortSlug: normalizedPort,
          requestedTourId: trimmedTour,
          actualTourPortSlug,
          activePlanCode: plan.planCode,
          activeSailingPortSlugs: sailingPortCallSlugs,
          reason: catalogRec
            ? `Tour "${trimmedTour}" belongs to port "${actualTourPortSlug}", which does not match sailing port call "${normalizedPort}" on ${plan.planCode}.`
            : `Tour "${trimmedTour}" is not a verified catalog tour for port call "${normalizedPort}" on ${plan.planCode}.`,
          applicablePortGuideUrl: offPortSpec?.dccPortGuideUrl || null,
          applicableSailingPlanUrl:
            actualTourPortSlug === "cozumel" ||
            actualTourPortSlug === "roatan" ||
            actualTourPortSlug === "grand-cayman"
              ? WESTERN_CARIBBEAN_JAN_24_2027_SHAREABLE_PLAN.dccShareUrl
              : null,
        });
        continue;
      }

      validatedOverrides[normalizedPort as WinterSailingPortSlug] = catalogRec.tourId;
    }
  }

  if (params?.recordOpen) {
    recordPlanOpenEvent({
      visitorId: params.visitorId,
      planCode: plan.planCode,
      sourcePage:
        surface === "cruisepromenade"
          ? `/p/${plan.planCode}`
          : `/cruises/winter-excursion-planner?plan=${plan.planCode}`,
      placementId: plan.placementId,
      propertySlug: plan.shipSlug,
      surface,
      isTest: params.isTest === true,
    });
  }

  const evaluatedByPortSlug = {} as Record<WinterSailingPortSlug, WinterPortEvaluatedPlanSlot>;

  for (const portSlug of ALL_WINTER_SAILING_PORT_SLUGS) {
    const spec = ALL_WINTER_PORT_LOGISTICS_SPECS[portSlug];
    const itineraryDay = itineraryPortDays.find((d) => d.portSlug === portSlug) || null;
    const onActiveSailingItinerary = Boolean(itineraryDay);
    const savedPreset = onActiveSailingItinerary ? plan.savedExcursionsByPort[portSlug] : undefined;
    const overrideTourId =
      portSlug in validatedOverrides ? validatedOverrides[portSlug] : undefined;

    // Only allow saving a tour if the port is on the active sailing itinerary!
    const effectiveSavedTourId = onActiveSailingItinerary
      ? overrideTourId !== undefined
        ? overrideTourId
        : savedPreset?.tourId || null
      : null;

    const date =
      itineraryDay?.date ||
      savedPreset?.date ||
      DEFAULT_FIVE_PORT_DATES_FOR_JAN_24_WEEK[portSlug];
    const shipArrival =
      itineraryDay?.arrivalTime || savedPreset?.arrivalTime || spec.defaultArrivalTime;
    const shipDeparture =
      itineraryDay?.departureTime || savedPreset?.departureTime || spec.defaultDepartureTime;

    const omitAllAboard = missingAllAboardSet.has(portSlug);
    const omitLastTender = spec.isTenderPort && missingLastTenderSet.has(portSlug);
    const allAboardTime =
      omitAllAboard || omitLastTender
        ? undefined
        : itineraryDay?.allAboardTime ||
          savedPreset?.allAboardTime ||
          spec.defaultAllAboardTime;
    const lastTenderTime = spec.isTenderPort
      ? omitLastTender || omitAllAboard
        ? ""
        : itineraryDay?.lastTenderTime ||
          savedPreset?.lastTenderTime ||
          spec.defaultLastTenderTime ||
          allAboardTime ||
          null
      : null;

    if (portSlug === "san-juan") {
      // San Juan has 0 matched commercial catalog tours; show on itinerary with explicit 0 matched tours
      evaluatedByPortSlug[portSlug] = {
        portSlug,
        portSpec: spec,
        dayNumber: itineraryDay?.dayNumber ?? 4,
        date,
        onActiveSailingItinerary,
        savedInShareablePlan: false,
        shipArrival,
        shipDeparture,
        allAboardTime: allAboardTime || null,
        lastTenderTime: null,
        allAboardStatus: allAboardTime ? "confirmed" : "missing_needs_confirmation",
        lastTenderStatus: "not_applicable",
        cruiseFitRecommendationWithheld: !allAboardTime,
        checkoutEligible: false,
        matchedToursCount: 0,
        noMatchedToursReason:
          "No matched catalog tours for this port call window; Old San Juan Pier 3 is step-off walkable into the historic district.",
        selectedOption: null,
        needsConfirmationSampleOption: null,
        allMatchedOptions: [],
        matchMetrics: {
          storageSource: "memory_seed",
          totalCatalogCandidates: 0,
          eligibleCount: 0,
          needsConfirmationCount: 0,
          ineligibleCount: 0,
          shortlistCheckedCount: 0,
          supportedVerifiedTransferCount: 0,
          liveDepartureVerifiedCount: 0,
          fullySupportedCruiseFitCount: 0,
          upstreamRequestsMade: 0,
          cachedCatalogSearchMs: 0,
          shortlistLiveCheckMs: 0,
          totalResponseMs: 0,
        },
      };
      continue;
    }

    const matchRes = await matchToursForTrip({
      destination: portSlug,
      portSlug,
      sailingCode: plan.planCode,
      date,
      adults,
      childAges,
      requiresPierPickup: true,
      pickupMode: "pier_pickup",
      shipArrival,
      shipDeparture,
      allAboardTime,
      lastTenderTime: spec.isTenderPort ? (lastTenderTime ?? "") : undefined,
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

    const timingMissing = !allAboardTime || (spec.isTenderPort && !lastTenderTime);

    // Where the ship's all-aboard or last-tender time is missing, or the port is not on the active sailing itinerary,
    // withhold the cruise-fit booking recommendation on options.
    const processedOptions: MatchedTourOption[] = matchRes.options.map((opt) => {
      if (timingMissing || opt.suitability !== "recommended") {
        return {
          ...opt,
          suitability: opt.suitability === "ineligible" ? "ineligible" : "needs_confirmation",
          cruiseScheduleFit: opt.cruiseScheduleFit
            ? {
                ...opt.cruiseScheduleFit,
                fitStatus:
                  opt.cruiseScheduleFit.fitStatus === "ineligible"
                    ? "ineligible"
                    : "needs_confirmation",
                allAboardConfirmed: Boolean(allAboardTime),
                lastTenderConfirmed: spec.isTenderPort ? Boolean(lastTenderTime) : true,
                cruiseFitRecommendationWithheld: true,
              }
            : undefined,
          bookingPath: {
            ...opt.bookingPath,
            clickId: null,
            trackedClickUrl: "",
          },
        };
      }
      return opt;
    });

    const selectedOption = onActiveSailingItinerary
      ? (effectiveSavedTourId
          ? processedOptions.find(
              (o) =>
                o.tourId === effectiveSavedTourId ||
                o.providerProductCode === effectiveSavedTourId,
            )
          : null) ||
        processedOptions.find(
          (o) =>
            o.tourId === spec.defaultFeaturedTourId ||
            o.providerProductCode === spec.defaultFeaturedProductCode,
        ) ||
        processedOptions[0] ||
        null
      : processedOptions.find(
          (o) =>
            o.tourId === spec.defaultFeaturedTourId ||
            o.providerProductCode === spec.defaultFeaturedProductCode,
        ) ||
        processedOptions[0] ||
        null;

    const needsConfirmationSampleOption =
      processedOptions.find((o) => o.suitability === "needs_confirmation") || null;

    const slotCheckoutEligible = Boolean(
      onActiveSailingItinerary &&
        !timingMissing &&
        selectedOption &&
        selectedOption.suitability === "recommended" &&
        selectedOption.bookingPath.trackedClickUrl,
    );

    evaluatedByPortSlug[portSlug] = {
      portSlug,
      portSpec: spec,
      dayNumber: itineraryDay?.dayNumber ?? null,
      date,
      onActiveSailingItinerary,
      savedInShareablePlan: Boolean(onActiveSailingItinerary && effectiveSavedTourId && selectedOption),
      shipArrival,
      shipDeparture,
      allAboardTime: allAboardTime || null,
      lastTenderTime: spec.isTenderPort ? lastTenderTime : null,
      allAboardStatus: allAboardTime ? "confirmed" : "missing_needs_confirmation",
      lastTenderStatus: spec.isTenderPort
        ? lastTenderTime
          ? "confirmed"
          : "missing_needs_confirmation"
        : "not_applicable",
      cruiseFitRecommendationWithheld:
        timingMissing || selectedOption?.suitability !== "recommended",
      checkoutEligible: slotCheckoutEligible,
      matchedToursCount: processedOptions.length,
      noMatchedToursReason: null,
      selectedOption,
      needsConfirmationSampleOption,
      allMatchedOptions: processedOptions.slice(0, 5),
      matchMetrics: matchRes.metrics,
    };
  }

  const sailingPortCalls: WinterPortEvaluatedPlanSlot[] = sailingPortCallSlugs.map(
    (slug) => evaluatedByPortSlug[slug],
  );

  const fivePortsBySlug: Record<WinterExcursionPortSlug, WinterPortEvaluatedPlanSlot> = {
    nassau: evaluatedByPortSlug.nassau,
    "st-thomas": evaluatedByPortSlug["st-thomas"],
    cozumel: evaluatedByPortSlug.cozumel,
    roatan: evaluatedByPortSlug.roatan,
    "grand-cayman": evaluatedByPortSlug["grand-cayman"],
  };

  const otherWinterPortGuides = WINTER_EXCURSION_PORT_SLUGS.filter(
    (slug) => !sailingPortCallSet.has(slug),
  ).map((slug) => {
    const spec = WINTER_PORT_LOGISTICS_SPECS[slug];
    const applicablePlan =
      slug === "cozumel" || slug === "roatan" || slug === "grand-cayman"
        ? WESTERN_CARIBBEAN_JAN_24_2027_SHAREABLE_PLAN
        : INDEPENDENCE_JAN_24_2027_SHAREABLE_PLAN;
    return {
      portSlug: slug,
      portName: spec.portName,
      dockOrTender: spec.dockOrTender,
      dccPortGuidePath: spec.dccPortGuidePath,
      dccPortGuideUrl: spec.dccPortGuideUrl,
      cruisePromenadePortUrl: spec.cruisePromenadePortUrl,
      applicableSailingPlanCode: applicablePlan.planCode,
      applicableSailingPlanUrl: applicablePlan.dccShareUrl,
    };
  });

  const savedSelections: EvaluatedWinterSailingPlanResponse["savedPortsSummary"]["savedSelections"] =
    [];
  let combinedPartyTotalCents = 0;
  let bookableSavedToursCount = 0;

  // Drive saves, totals, and checkout eligibility strictly from the verified sailing's actual port calls
  for (const slot of sailingPortCalls) {
    if (!slot.onActiveSailingItinerary || !slot.savedInShareablePlan || !slot.selectedOption) {
      continue;
    }
    const opt = slot.selectedOption;
    const isCheckoutEligible =
      slot.checkoutEligible &&
      opt.suitability === "recommended" &&
      !slot.cruiseFitRecommendationWithheld &&
      Boolean(opt.bookingPath.trackedClickUrl);

    if (isCheckoutEligible) {
      const partyCents = opt.boundOffer.totalPartyPriceCents ?? 0;
      combinedPartyTotalCents += partyCents;
      bookableSavedToursCount += 1;
    }

    const suitabilityLabel =
      opt.suitability === "recommended"
        ? "Recommended"
        : opt.suitability === "needs_confirmation"
          ? "Needs confirmation"
          : "Ineligible";

    savedSelections.push({
      portSlug: slot.portSlug,
      portName: slot.portSpec.portName,
      date: slot.date,
      tourId: opt.tourId,
      providerProductCode: opt.providerProductCode,
      title: opt.title,
      optionCode: opt.boundOffer.optionCode,
      optionTitle: opt.boundOffer.optionTitle,
      suitability: opt.suitability,
      suitabilityLabel,
      cruiseFitRecommendationWithheld: !isCheckoutEligible,
      checkoutEligible: isCheckoutEligible,
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
      lastTenderTime: slot.lastTenderTime,
      unitPriceCents: opt.boundOffer.unitPriceCents,
      totalPartyPriceCents: opt.boundOffer.totalPartyPriceCents,
      totalPartyPriceFormatted:
        opt.boundOffer.totalPartyPriceCents !== null
          ? `$${(opt.boundOffer.totalPartyPriceCents / 100).toFixed(2)}`
          : "Check at Viator",
      priceVerifiedLive: opt.boundOffer.priceVerifiedLive,
      checkoutProvider: "viator",
      placementId: plan.placementId,
      trackedViatorCheckoutUrl: isCheckoutEligible
        ? opt.bookingPath.trackedClickUrl || opt.bookingPath.handoffUrl || null
        : null,
      clickId: isCheckoutEligible ? opt.bookingPath.clickId : null,
    });
  }

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    plan,
    shipName,
    sailDate,
    organizerShareLinks: {
      cruisePromenadeOrganizerUrl: `${plan.cruisePromenadeShareUrl}?utm_source=cruise_organizer_share&utm_medium=group_link&utm_campaign=indy_2027_01_24_organizers`,
      dccOrganizerUrl: `${plan.dccShareUrl}&utm_source=cruise_organizer_share&utm_medium=group_link&utm_campaign=indy_2027_01_24_organizers`,
      placementId: plan.placementId,
      tracksSeparately: [
        "planOpens",
        "outboundClicks",
        "providerConfirmedBookings",
        "paidCommissions",
      ],
    },
    party: {
      adults,
      childAges,
      totalGuests,
    },
    surface,
    sailingPortCallSlugs,
    sailingPortCalls,
    otherWinterPortGuides,
    offItineraryBlocked: rejectedOffItineraryRequests.length > 0,
    rejectedOffItineraryRequests,
    savedPortsSummary: {
      savedPortSlugs: savedSelections.map((s) => s.portSlug),
      savedToursCount: savedSelections.length,
      bookableSavedToursCount,
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
    alreadyApprovedFirstPartyPlacement: {
      placementId: string;
      liveGuestUrl: string;
      secondaryLiveGuestUrl: string;
      tourId: string;
      providerProductCode: string;
      title: string;
      operatorName: string;
      commissionStatus: "verified_active_8pct";
      placementApprovalStatus: "live_first_party";
      verifiedHotelMonteleonePickupStop: string;
      totalPartyPrice2AdultsUsd: number;
      expectedPartnerCommission2AdultsUsd: number;
    };
    jeanLafitte763318PickupAddressResolution: {
      hotelMonteleoneShuttleOptionAddress: string;
      selfDriveBaratariaDockOptionAddress: string;
      why810ToulouseAppearedInNotes: string;
      resolutionSummary: string;
    };
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
 * 3) Production counters remain untouched (`0` from test replay), and
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
  const serverReferralId = deriveServerReferralIdForOffer({
    sailingCode: planCode,
    productCode: "254526P1",
    optionCode: "TG4",
    placementId,
    propertySlug: "nassau",
    date: "2027-01-25",
    adults: 2,
  });

  const clickAttr = issueOpaqueClickAttribution({
    clickId: serverReferralId,
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
    productDestinationUrl: `https://www.viator.com/tours/Nassau/Pigs-cant-fly-but-they-do-swim/d420-254526P1?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=${serverReferralId}`,
    recordStage: "recommendation",
    isTest: true,
  });

  recordOutboundClickFollow(clickAttr.clickId, {
    userAgent: "Mozilla/5.0 (DCC-Winter-Planner-QA-Verification)",
    referer: "https://cruisepromenade.com/p/INDY-2027-01-24",
  });

  const trackingCampaignTag = clickAttr.clickId;
  const providerBookingRef = "TEST-VIATOR-INDY2027-NASSAU-254526P1-01";

  // 3. Deliver labeled provider test event #1 (BOOKING_CONFIRMED) carrying Viator campaignValue = referralId
  const firstRes = reconcilePartnerWebhookByClickId({
    campaignValue: trackingCampaignTag,
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
    campaignValue: trackingCampaignTag,
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
    campaignValue: trackingCampaignTag,
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
      alreadyApprovedFirstPartyPlacement: {
        placementId: "fp-wno-swamp-tours",
        liveGuestUrl: "https://www.welcometoneworleanstours.com/swamp-tours",
        secondaryLiveGuestUrl: "https://www.destinationcommandcenter.com/new-orleans/swamp-tours",
        tourId: "dcc:tour:viator:15200P6",
        providerProductCode: "15200P6",
        title: "New Orleans Swamp Tour Boat Adventure With Pickup",
        operatorName: "Louisiana Tour Company",
        commissionStatus: "verified_active_8pct",
        placementApprovalStatus: "live_first_party",
        verifiedHotelMonteleonePickupStop:
          "Hotel Monteleone (214 Royal St, New Orleans, LA 70130 — Viator pickup ref LOC-6eKJ+or5y8o99Qw0C8xWyGAjWJk3qp08H7OnT0MLhOs=)",
        totalPartyPrice2AdultsUsd: 120.0,
        expectedPartnerCommission2AdultsUsd: 9.6,
      },
      jeanLafitte763318PickupAddressResolution: {
        hotelMonteleoneShuttleOptionAddress:
          "214 Royal St, New Orleans, LA 70130 (Hotel Monteleone — FareHarbor Custom Field #12258400 Option #22056428 'Hotel Monteleone', +$30/person round-trip shuttle)",
        selfDriveBaratariaDockOptionAddress:
          "6601 Leo Kerner Lafitte Pkwy, Marrero, LA 70072 (Jean Lafitte Swamp Tour Dock at Barataria Preserve — Self-Drive Option #SELF_DRIVE_6601, $32/adult)",
        why810ToulouseAppearedInNotes:
          "FareHarbor's live API for item #763318 returns Option #22056428 with title 'Hotel Monteleone' and empty description/booking_notes, whereas 810 Toulouse St is a French Quarter motorcoach corner staging reference used when shuttles cannot curb on Royal Street pedestrian mall blocks.",
        resolutionSummary:
          "In durableCatalogStore.ts, WITH_HOTEL_PICKUP (214 Royal St, New Orleans, LA 70130) and SELF_DRIVE_6601 (6601 Leo Kerner Lafitte Pkwy, Marrero, LA 70072) are strictly separated by option rather than concatenated, and exact Royal St entrance vs corner curb boarding for Option #22056428 is explicitly included in the operator & hotel approval checklists.",
      },
      specificApprovalsStillNeeded: [
        {
          approvalId: "nola_approval_1_jean_lafitte_fareharbor_asn_terms",
          party: "Jean Lafitte Swamp Tours (jeanlafitteswamptour)",
          status: "pending_approval",
          requiredAction:
            "Confirm the authorized FareHarbor affiliate shortname ('aktourcenter' or 'welcometoneworleanstours') for item #763318, enable affiliate rules (is_affiliate_rules_applied: true), confirm commission rate & Net-30 ASN payout terms, confirm exact Hotel Monteleone pickup curb instructions for Option #22056428 (214 Royal St entrance vs adjacent French Quarter corner), and authorize booking report / webhook delivery carrying online_booking_references (<placementId>-clk_<24hex>).",
          unlocksCapability:
            "Transitions Jean Lafitte #763318 from 'Commission terms pending' to 'Commission terms confirmed' for direct FareHarbor checkout.",
        },
        {
          approvalId: "nola_approval_2_hotel_monteleone_concierge_placement",
          party: "Hotel Monteleone Concierge & Guest Services (214 Royal St, New Orleans)",
          status: "pending_approval",
          requiredAction:
            "Written confirmation from Hotel Monteleone approving pre-arrival email/concierge distribution of the guest link for placement 'nola-hotel-monteleone-demo-pilot' and confirming the approved guest shuttle waiting spot for 214 Royal St.",
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
