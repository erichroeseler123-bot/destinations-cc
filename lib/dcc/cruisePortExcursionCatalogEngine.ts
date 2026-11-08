import { getViatorClient } from "@/lib/viator/client";
import { appendViatorAttribution } from "@/lib/viator/links";
import {
  EARTHOS_DESTINATION_NODES,
  getDurableTourByIdOrAlias,
  queryDurableTourCatalog,
  resolveEarthOSDestinationNode,
  type DurableCatalogSortBy,
  type DurableTourRecord,
  type TourProductOptionRecord,
} from "@/lib/dcc/catalog/durableCatalogStore";
import { HREYFILL_REYKJAVIK_SHORE_EXCURSION_QUALIFICATION } from "@/lib/dcc/corridors/internationalCorridorQualifications";
import { JUNEAU_PRODUCT_SUPPLIER_RECONCILIATION } from "@/lib/dcc/machine/v03/operatorDirectCheckout";
import { fetchAvailabilitiesForItem } from "@/lib/dcc/liveSlots/fareharbor";

export type PortDayExcursionViewMode = "browse_all" | "fits_sailing";

export type PortDayExcursionCategoryFilter =
  | "all"
  | "sightseeing"
  | "wildlife"
  | "food"
  | "culture"
  | "adventure"
  | "family";

export type PortDayTimeFitStatus =
  | "fits"
  | "runs_too_late"
  | "needs_verification"
  | "missing_operator_info";

export type PortDaySeatAvailabilityStatus =
  | "live_verified"
  | "check_availability"
  | "sold_out";

export interface CruisePortExcursionProfile {
  portSlug: string;
  portName: string;
  country: string;
  batch:
    | "batch_1_reykjavik_maui"
    | "batch_2_alaska"
    | "batch_3_us_mainland_gulf"
    | "batch_4_caribbean";
  batchLabel: string;
  destinationSlug: string;
  viatorDestinationId: number;
  viatorDestinationName: string;
  defaultPierName: string;
  defaultPierAddress: string;
  defaultSailingDate: string;
  defaultShipArrivalTime: string;
  defaultShipAllAboardTime: string;
  defaultShipDepartureTime: string;
  defaultOneWayPierTransferMinutes: number;
  defaultCheckInCutoffMinutes: number;
  requiredReturnBufferMinutes: number;
}

export interface PortDayTimeFitEvaluation {
  status: PortDayTimeFitStatus;
  statusLabel: string;
  fitsSailing: boolean;
  selectedOptionCode: string | null;
  selectedOptionTitle: string | null;
  shipArrivalTime: string;
  shipAllAboardTime: string;
  earliestDisembarkationTime: string;
  selectedDepartureTime: string | null;
  availableDepartureTimes: string[];
  fittingDepartureTimes: string[];
  tooLateDepartureTimes: string[];
  hasVerifiedDeparture: boolean;
  departureEvidenceSource: string | null;
  checkInCutoffMinutes: number | null;
  latestCheckInTime: string | null;
  hasVerifiedCheckIn: boolean;
  checkInEvidenceSource: string | null;
  leavePierByTime: string | null;
  meetingPointName: string | null;
  meetingPointAddress: string | null;
  hasVerifiedMeetingPoint: boolean;
  meetingPointEvidenceSource: string | null;
  oneWayTransferMinutes: number | null;
  pierToMeetingMinutes: number | null;
  meetingToPierMinutes: number | null;
  roundTripTransferMinutes: number | null;
  hasVerifiedTransfer: boolean;
  transferEvidenceSource: string | null;
  durationMinutes: number | null;
  tourEndTime: string | null;
  estimatedBackAtPierTime: string | null;
  requiredReturnBufferMinutes: number;
  bufferBeforeAllAboardMinutes: number | null;
  hasVerifiedReturnBuffer: boolean;
  missingFields: string[];
  reasonSummary: string;
}

export interface PortDaySeatAvailabilityEvaluation {
  status: PortDaySeatAvailabilityStatus;
  statusLabel: string;
  supportsLiveCheck: boolean;
  liveCheckedAt: string | null;
  checkedDate: string | null;
  checkedPartySize: number;
  selectedOptionCode: string | null;
  selectedDepartureTime: string | null;
  available: boolean | null;
  remainingSeats: number | null;
  fromPriceUsd: number | null;
  totalPriceUsd: number | null;
  currency: string;
  exactProductUrl?: string;
  dccTrackedHref?: string;
  pastDepartureRejected?: boolean;
  rejectionReason?: string | null;
  providerStatus?:
    | "confirmed"
    | "live_confirmed"
    | "past_departure_rejected"
    | "past_departure"
    | "timeout"
    | "missing_data"
    | "option_or_departure_unconfirmed"
    | "provider_unconfirmed"
    | "unconfigured"
    | "error"
    | "unverified";
  options: Array<{
    optionCode: string;
    title: string;
    startTime: string;
    available: boolean;
    remainingSeats: number | null;
    priceUsd: number | null;
  }>;
  detailNote: string;
}

export interface PortDayExcursionHandoffLinks {
  exactProductUrl: string;
  dccTrackedHref: string;
  cruisePromenadeTrackedHref: string;
  provider: "viator" | "operator_direct" | "bokun";
  productCode: string | null;
  optionCode: string | null;
  handoffTrackingTag: string;
  bookingConfirmationStatus: "tracked_handoff_only" | "provider_confirmed_booking";
  referralCreditStatus: "active" | "pending_operator_match_confirmation";
}

export interface PortDayExcursionCard {
  tourId: string;
  productCode: string | null;
  optionCode: string | null;
  title: string;
  shortDescription: string;
  provider: "viator" | "operator_direct" | "bokun";
  operatorName: string;
  categories: string[];
  primaryCategory: string;
  rating: number | null;
  reviewCount: number;
  fromPriceUsd: number | null;
  currency: string;
  durationMinutes: number | null;
  imageUrl: string | null;
  pickupType: string;
  timeFit: PortDayTimeFitEvaluation;
  seatAvailability: PortDaySeatAvailabilityEvaluation;
  handoff: PortDayExcursionHandoffLinks;
}

export interface PortDayExcursionCatalogResponse {
  ok: true;
  generatedAt: string;
  port: CruisePortExcursionProfile;
  sailingWindow: {
    shipArrivalTime: string;
    shipAllAboardTime: string;
    sailingDate: string;
    partySize: number;
  };
  viewMode: PortDayExcursionViewMode;
  category: PortDayExcursionCategoryFilter;
  pagination: {
    limit: number;
    offset: number;
    page: number;
    totalMatchedInSql: number;
    rowsLoadedIntoApp: number;
    fullCatalogLoadedIntoApp: boolean;
    executedInSql: boolean;
    sqlQueryMs: number;
    hasMore: boolean;
    nextOffset: number | null;
    storageSource: string;
  };
  providerCounts: {
    viator: number;
    operator_direct: number;
    bokun_pending: number;
    total: number;
    reconciledWithAuthorizedSource: boolean;
    authorizedSourceTotal: number;
    coveragePercent?: number;
    coverageStatus?: "complete" | "sampled_provider_catalog";
    pendingOperatorNotes?: string[];
  };
  summary: {
    totalEvaluatedOnPage: number;
    fitsSailingCountOnPage: number;
    runsTooLateCountOnPage: number;
    needsVerificationCountOnPage: number;
    missingOperatorInfoCountOnPage: number;
    liveAvailabilitySupportedCountOnPage: number;
  };
  tours: PortDayExcursionCard[];
}

export const MAPPED_CRUISE_PORT_EXCURSION_PROFILES: CruisePortExcursionProfile[] = [
  {
    portSlug: "reykjavik",
    portName: "Reykjavík",
    country: "Iceland",
    batch: "batch_1_reykjavik_maui",
    batchLabel: "Batch 1 — Reykjavík & Maui Flagship Rollout",
    destinationSlug: "reykjavik",
    viatorDestinationId: 905,
    viatorDestinationName: "Reykjavik",
    defaultPierName: "Skarfabakki Cruise Terminal (Berths 312/313) & Miðbakki Downtown Berth",
    defaultPierAddress: "Skarfabakki 312–313, Sundahöfn, 104 Reykjavík, Iceland",
    defaultSailingDate: "2027-07-15",
    defaultShipArrivalTime: "08:00",
    defaultShipAllAboardTime: "17:30",
    defaultShipDepartureTime: "18:00",
    defaultOneWayPierTransferMinutes: 15,
    defaultCheckInCutoffMinutes: 15,
    requiredReturnBufferMinutes: 60,
  },
  {
    portSlug: "kahului",
    portName: "Kahului Harbor (Maui)",
    country: "United States",
    batch: "batch_1_reykjavik_maui",
    batchLabel: "Batch 1 — Reykjavík & Maui Flagship Rollout",
    destinationSlug: "kahului",
    viatorDestinationId: 671,
    viatorDestinationName: "Maui",
    defaultPierName: "Kahului Harbor Cruise Terminal (Pier 1 / Pier 2)",
    defaultPierAddress: "103 Ala Luina St, Kahului, HI 96732",
    defaultSailingDate: "2027-06-22",
    defaultShipArrivalTime: "08:00",
    defaultShipAllAboardTime: "17:00",
    defaultShipDepartureTime: "18:00",
    defaultOneWayPierTransferMinutes: 25,
    defaultCheckInCutoffMinutes: 30,
    requiredReturnBufferMinutes: 60,
  },
  {
    portSlug: "juneau",
    portName: "Juneau",
    country: "United States",
    batch: "batch_2_alaska",
    batchLabel: "Batch 2 — Alaska Cruise Corridor",
    destinationSlug: "juneau",
    viatorDestinationId: 941,
    viatorDestinationName: "Juneau",
    defaultPierName: "Juneau Cruise Ship Docks (CT / AS / FKL / AJ Dock)",
    defaultPierAddress: "490 S Franklin St, Juneau, AK 99801",
    defaultSailingDate: "2027-07-15",
    defaultShipArrivalTime: "08:00",
    defaultShipAllAboardTime: "16:30",
    defaultShipDepartureTime: "17:00",
    defaultOneWayPierTransferMinutes: 20,
    defaultCheckInCutoffMinutes: 15,
    requiredReturnBufferMinutes: 60,
  },
  {
    portSlug: "skagway",
    portName: "Skagway",
    country: "United States",
    batch: "batch_2_alaska",
    batchLabel: "Batch 2 — Alaska Cruise Corridor",
    destinationSlug: "skagway",
    viatorDestinationId: 943,
    viatorDestinationName: "Skagway",
    defaultPierName: "Skagway Cruise Docks (Ore / Broadway / Railroad Dock)",
    defaultPierAddress: "Broadway St, Skagway, AK 99840",
    defaultSailingDate: "2027-07-15",
    defaultShipArrivalTime: "07:00",
    defaultShipAllAboardTime: "19:30",
    defaultShipDepartureTime: "20:00",
    defaultOneWayPierTransferMinutes: 10,
    defaultCheckInCutoffMinutes: 15,
    requiredReturnBufferMinutes: 45,
  },
  {
    portSlug: "ketchikan",
    portName: "Ketchikan",
    country: "United States",
    batch: "batch_2_alaska",
    batchLabel: "Batch 2 — Alaska Cruise Corridor",
    destinationSlug: "ketchikan",
    viatorDestinationId: 942,
    viatorDestinationName: "Ketchikan",
    defaultPierName: "Ketchikan Downtown Berths 1–4 & Ward Cove",
    defaultPierAddress: "131 Front St, Ketchikan, AK 99901",
    defaultSailingDate: "2027-07-15",
    defaultShipArrivalTime: "07:00",
    defaultShipAllAboardTime: "15:30",
    defaultShipDepartureTime: "16:00",
    defaultOneWayPierTransferMinutes: 15,
    defaultCheckInCutoffMinutes: 15,
    requiredReturnBufferMinutes: 60,
  },
  {
    portSlug: "seward",
    portName: "Seward",
    country: "United States",
    batch: "batch_2_alaska",
    batchLabel: "Batch 2 — Alaska Cruise Corridor",
    destinationSlug: "seward",
    viatorDestinationId: 4368,
    viatorDestinationName: "Seward",
    defaultPierName: "Seward Cruise Ship Terminal",
    defaultPierAddress: "913 Port Ave, Seward, AK 99664",
    defaultSailingDate: "2027-07-15",
    defaultShipArrivalTime: "06:00",
    defaultShipAllAboardTime: "19:30",
    defaultShipDepartureTime: "20:00",
    defaultOneWayPierTransferMinutes: 10,
    defaultCheckInCutoffMinutes: 30,
    requiredReturnBufferMinutes: 60,
  },
  {
    portSlug: "new-orleans",
    portName: "New Orleans",
    country: "United States",
    batch: "batch_3_us_mainland_gulf",
    batchLabel: "Batch 3 — US Mainland & Gulf Embarkation Ports",
    destinationSlug: "new-orleans",
    viatorDestinationId: 675,
    viatorDestinationName: "New Orleans",
    defaultPierName: "Erato Street & Julia Street Cruise Terminals (Port NOLA)",
    defaultPierAddress: "1100 Port of New Orleans Pl, New Orleans, LA 70130",
    defaultSailingDate: "2027-05-15",
    defaultShipArrivalTime: "07:00",
    defaultShipAllAboardTime: "15:30",
    defaultShipDepartureTime: "16:00",
    defaultOneWayPierTransferMinutes: 30,
    defaultCheckInCutoffMinutes: 15,
    requiredReturnBufferMinutes: 60,
  },
  {
    portSlug: "miami",
    portName: "Miami",
    country: "United States",
    batch: "batch_3_us_mainland_gulf",
    batchLabel: "Batch 3 — US Mainland & Gulf Embarkation Ports",
    destinationSlug: "miami",
    viatorDestinationId: 662,
    viatorDestinationName: "Miami",
    defaultPierName: "PortMiami Cruise Terminals (Dodge Island)",
    defaultPierAddress: "1015 N America Way, Miami, FL 33132",
    defaultSailingDate: "2027-05-15",
    defaultShipArrivalTime: "07:00",
    defaultShipAllAboardTime: "15:30",
    defaultShipDepartureTime: "16:00",
    defaultOneWayPierTransferMinutes: 20,
    defaultCheckInCutoffMinutes: 15,
    requiredReturnBufferMinutes: 60,
  },
  {
    portSlug: "tampa",
    portName: "Tampa",
    country: "United States",
    batch: "batch_3_us_mainland_gulf",
    batchLabel: "Batch 3 — US Mainland & Gulf Embarkation Ports",
    destinationSlug: "tampa",
    viatorDestinationId: 666,
    viatorDestinationName: "Tampa",
    defaultPierName: "Port Tampa Bay Cruise Terminals 2, 3 & 6",
    defaultPierAddress: "815 Channelside Dr, Tampa, FL 33602",
    defaultSailingDate: "2027-05-15",
    defaultShipArrivalTime: "07:00",
    defaultShipAllAboardTime: "15:30",
    defaultShipDepartureTime: "16:00",
    defaultOneWayPierTransferMinutes: 15,
    defaultCheckInCutoffMinutes: 15,
    requiredReturnBufferMinutes: 60,
  },
  {
    portSlug: "seattle",
    portName: "Seattle",
    country: "United States",
    batch: "batch_3_us_mainland_gulf",
    batchLabel: "Batch 3 — US Mainland & Gulf Embarkation Ports",
    destinationSlug: "seattle",
    viatorDestinationId: 704,
    viatorDestinationName: "Seattle",
    defaultPierName: "Pier 66 (Bell Street) & Pier 91 (Smith Cove)",
    defaultPierAddress: "2225 Alaskan Way / 2001 W Garfield St, Seattle, WA",
    defaultSailingDate: "2027-07-15",
    defaultShipArrivalTime: "07:00",
    defaultShipAllAboardTime: "15:30",
    defaultShipDepartureTime: "16:00",
    defaultOneWayPierTransferMinutes: 20,
    defaultCheckInCutoffMinutes: 15,
    requiredReturnBufferMinutes: 60,
  },
  {
    portSlug: "cozumel",
    portName: "Cozumel",
    country: "Mexico",
    batch: "batch_4_caribbean",
    batchLabel: "Batch 4 — Major Caribbean Cruise Ports",
    destinationSlug: "cozumel",
    viatorDestinationId: 632,
    viatorDestinationName: "Cozumel",
    defaultPierName: "Puerta Maya, International Pier & Punta Langosta",
    defaultPierAddress: "Costera Sur, Cozumel, Quintana Roo, Mexico",
    defaultSailingDate: "2027-05-15",
    defaultShipArrivalTime: "08:00",
    defaultShipAllAboardTime: "17:00",
    defaultShipDepartureTime: "18:00",
    defaultOneWayPierTransferMinutes: 15,
    defaultCheckInCutoffMinutes: 15,
    requiredReturnBufferMinutes: 60,
  },
  {
    portSlug: "roatan",
    portName: "Roatán",
    country: "Honduras",
    batch: "batch_4_caribbean",
    batchLabel: "Batch 4 — Major Caribbean Cruise Ports",
    destinationSlug: "roatan",
    viatorDestinationId: 4132,
    viatorDestinationName: "Roatan",
    defaultPierName: "Port of Roatán (Coxen Hole) & Mahogany Bay",
    defaultPierAddress: "Carretera Principal, Coxen Hole, Roatán, Honduras",
    defaultSailingDate: "2027-05-15",
    defaultShipArrivalTime: "08:00",
    defaultShipAllAboardTime: "16:30",
    defaultShipDepartureTime: "17:00",
    defaultOneWayPierTransferMinutes: 20,
    defaultCheckInCutoffMinutes: 15,
    requiredReturnBufferMinutes: 60,
  },
  {
    portSlug: "nassau",
    portName: "Nassau",
    country: "Bahamas",
    batch: "batch_4_caribbean",
    batchLabel: "Batch 4 — Major Caribbean Cruise Ports",
    destinationSlug: "nassau",
    viatorDestinationId: 420,
    viatorDestinationName: "Nassau",
    defaultPierName: "Nassau Cruise Port (Prince George Wharf)",
    defaultPierAddress: "Woodes Rodgers Walk, Nassau, Bahamas",
    defaultSailingDate: "2027-05-15",
    defaultShipArrivalTime: "08:00",
    defaultShipAllAboardTime: "16:30",
    defaultShipDepartureTime: "17:00",
    defaultOneWayPierTransferMinutes: 15,
    defaultCheckInCutoffMinutes: 15,
    requiredReturnBufferMinutes: 60,
  },
  {
    portSlug: "st-thomas",
    portName: "St. Thomas (Charlotte Amalie)",
    country: "U.S. Virgin Islands",
    batch: "batch_4_caribbean",
    batchLabel: "Batch 4 — Major Caribbean Cruise Ports",
    destinationSlug: "st-thomas",
    viatorDestinationId: 965,
    viatorDestinationName: "St. Thomas",
    defaultPierName: "West Indian Company Dock (Havensight) & Crown Bay",
    defaultPierAddress: "Havensight / Crown Bay, Charlotte Amalie, St. Thomas, USVI",
    defaultSailingDate: "2027-05-15",
    defaultShipArrivalTime: "08:00",
    defaultShipAllAboardTime: "16:30",
    defaultShipDepartureTime: "17:00",
    defaultOneWayPierTransferMinutes: 15,
    defaultCheckInCutoffMinutes: 15,
    requiredReturnBufferMinutes: 60,
  },
  {
    portSlug: "grand-cayman",
    portName: "Grand Cayman (George Town)",
    country: "Cayman Islands",
    batch: "batch_4_caribbean",
    batchLabel: "Batch 4 — Major Caribbean Cruise Ports",
    destinationSlug: "grand-cayman",
    viatorDestinationId: 31,
    viatorDestinationName: "Grand Cayman",
    defaultPierName: "George Town Cruise Tender Terminals (Royal Watler / North / South)",
    defaultPierAddress: "Harbour Drive, George Town, Grand Cayman",
    defaultSailingDate: "2027-05-15",
    defaultShipArrivalTime: "08:00",
    defaultShipAllAboardTime: "15:30",
    defaultShipDepartureTime: "16:30",
    defaultOneWayPierTransferMinutes: 25,
    defaultCheckInCutoffMinutes: 20,
    requiredReturnBufferMinutes: 75,
  },
];

export const MAPPED_CRUISE_PORT_BATCH_SUMMARY = {
  batch_1_reykjavik_maui: {
    batchId: "batch_1_reykjavik_maui",
    label: "Batch 1 — Reykjavík & Maui Flagship Rollout",
    ports: ["reykjavik", "kahului"],
  },
  batch_2_alaska: {
    batchId: "batch_2_alaska",
    label: "Batch 2 — Alaska Cruise Corridor",
    ports: ["juneau", "skagway", "ketchikan", "seward"],
  },
  batch_3_us_mainland_gulf: {
    batchId: "batch_3_us_mainland_gulf",
    label: "Batch 3 — US Mainland & Gulf Embarkation Ports",
    ports: ["new-orleans", "miami", "tampa", "seattle"],
  },
  batch_4_caribbean: {
    batchId: "batch_4_caribbean",
    label: "Batch 4 — Major Caribbean Cruise Ports",
    ports: ["cozumel", "roatan", "nassau", "st-thomas", "grand-cayman"],
  },
} as const;

export const AUTHORITATIVE_PORT_PROVIDER_COUNTS: Record<
  string,
  {
    viator: number;
    operator_direct: number;
    bokun_pending: number;
    authorizedSourceTotal: number;
    reconciledWithAuthorizedSource: boolean;
  }
> = {
  reykjavik: {
    viator: 1576,
    operator_direct: 0,
    bokun_pending: HREYFILL_REYKJAVIK_SHORE_EXCURSION_QUALIFICATION.candidateTours.length,
    authorizedSourceTotal: 1576,
    reconciledWithAuthorizedSource: true,
  },
  kahului: {
    viator: 652,
    operator_direct: 1,
    bokun_pending: 0,
    authorizedSourceTotal: 653,
    reconciledWithAuthorizedSource: true,
  },
  juneau: {
    viator: 104,
    operator_direct: 19,
    bokun_pending: 0,
    authorizedSourceTotal: 123,
    reconciledWithAuthorizedSource: true,
  },
  skagway: {
    viator: 65,
    operator_direct: 2,
    bokun_pending: 0,
    authorizedSourceTotal: 67,
    reconciledWithAuthorizedSource: true,
  },
  ketchikan: {
    viator: 147,
    operator_direct: 0,
    bokun_pending: 0,
    authorizedSourceTotal: 147,
    reconciledWithAuthorizedSource: true,
  },
  seward: {
    viator: 57,
    operator_direct: 0,
    bokun_pending: 0,
    authorizedSourceTotal: 57,
    reconciledWithAuthorizedSource: true,
  },
  "new-orleans": {
    viator: 100,
    operator_direct: 11,
    bokun_pending: 0,
    authorizedSourceTotal: 728,
    reconciledWithAuthorizedSource: false,
  },
  miami: {
    viator: 100,
    operator_direct: 0,
    bokun_pending: 0,
    authorizedSourceTotal: 1176,
    reconciledWithAuthorizedSource: false,
  },
  tampa: {
    viator: 175,
    operator_direct: 0,
    bokun_pending: 0,
    authorizedSourceTotal: 175,
    reconciledWithAuthorizedSource: true,
  },
  seattle: {
    viator: 100,
    operator_direct: 0,
    bokun_pending: 0,
    authorizedSourceTotal: 504,
    reconciledWithAuthorizedSource: false,
  },
  cozumel: {
    viator: 100,
    operator_direct: 0,
    bokun_pending: 0,
    authorizedSourceTotal: 632,
    reconciledWithAuthorizedSource: false,
  },
  roatan: {
    viator: 100,
    operator_direct: 0,
    bokun_pending: 0,
    authorizedSourceTotal: 616,
    reconciledWithAuthorizedSource: false,
  },
  nassau: {
    viator: 208,
    operator_direct: 0,
    bokun_pending: 0,
    authorizedSourceTotal: 208,
    reconciledWithAuthorizedSource: true,
  },
  "st-thomas": {
    viator: 100,
    operator_direct: 0,
    bokun_pending: 0,
    authorizedSourceTotal: 355,
    reconciledWithAuthorizedSource: false,
  },
  "grand-cayman": {
    viator: 230,
    operator_direct: 0,
    bokun_pending: 0,
    authorizedSourceTotal: 230,
    reconciledWithAuthorizedSource: true,
  },
};

export function resolveCruisePortExcursionProfile(
  rawPortSlugOrAlias: string | undefined | null
): CruisePortExcursionProfile | null {
  const s = String(rawPortSlugOrAlias || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  if (!s) return null;

  const direct = MAPPED_CRUISE_PORT_EXCURSION_PROFILES.find((p) => p.portSlug === s);
  if (direct) return direct;

  if (s.includes("reykjavik")) {
    return MAPPED_CRUISE_PORT_EXCURSION_PROFILES.find((p) => p.portSlug === "reykjavik")!;
  }
  if (s.includes("kahului") || s.includes("maui")) {
    return MAPPED_CRUISE_PORT_EXCURSION_PROFILES.find((p) => p.portSlug === "kahului")!;
  }
  if (s.includes("juneau")) {
    return MAPPED_CRUISE_PORT_EXCURSION_PROFILES.find((p) => p.portSlug === "juneau")!;
  }
  if (s.includes("skagway")) {
    return MAPPED_CRUISE_PORT_EXCURSION_PROFILES.find((p) => p.portSlug === "skagway")!;
  }
  if (s.includes("ketchikan")) {
    return MAPPED_CRUISE_PORT_EXCURSION_PROFILES.find((p) => p.portSlug === "ketchikan")!;
  }
  if (s.includes("seward")) {
    return MAPPED_CRUISE_PORT_EXCURSION_PROFILES.find((p) => p.portSlug === "seward")!;
  }
  if (s.includes("new-orleans") || s.includes("new orleans") || s === "nola") {
    return MAPPED_CRUISE_PORT_EXCURSION_PROFILES.find((p) => p.portSlug === "new-orleans")!;
  }
  if (s.includes("miami")) {
    return MAPPED_CRUISE_PORT_EXCURSION_PROFILES.find((p) => p.portSlug === "miami")!;
  }
  if (s.includes("tampa")) {
    return MAPPED_CRUISE_PORT_EXCURSION_PROFILES.find((p) => p.portSlug === "tampa")!;
  }
  if (s.includes("seattle")) {
    return MAPPED_CRUISE_PORT_EXCURSION_PROFILES.find((p) => p.portSlug === "seattle")!;
  }
  if (s.includes("cozumel")) {
    return MAPPED_CRUISE_PORT_EXCURSION_PROFILES.find((p) => p.portSlug === "cozumel")!;
  }
  if (s.includes("roatan")) {
    return MAPPED_CRUISE_PORT_EXCURSION_PROFILES.find((p) => p.portSlug === "roatan")!;
  }
  if (s.includes("nassau")) {
    return MAPPED_CRUISE_PORT_EXCURSION_PROFILES.find((p) => p.portSlug === "nassau")!;
  }
  if (s.includes("st-thomas") || s.includes("st thomas") || s.includes("charlotte amalie")) {
    return MAPPED_CRUISE_PORT_EXCURSION_PROFILES.find((p) => p.portSlug === "st-thomas")!;
  }
  if (s.includes("grand-cayman") || s.includes("grand cayman") || s.includes("george town")) {
    return MAPPED_CRUISE_PORT_EXCURSION_PROFILES.find((p) => p.portSlug === "grand-cayman")!;
  }

  const node = resolveEarthOSDestinationNode(s);
  if (node) {
    return (
      MAPPED_CRUISE_PORT_EXCURSION_PROFILES.find(
        (p) => p.destinationSlug === node.destinationSlug
      ) || null
    );
  }
  return null;
}

function parseHhMm(hhmm: string | undefined | null): number | null {
  const m = String(hhmm || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function formatHhMm(totalMinutes: number): string {
  const clamped = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function extractVerifiedCheckInCutoff(
  rec: DurableTourRecord,
  option: TourProductOptionRecord | null
): {
  checkInCutoffMinutes: number | null;
  checkInEvidenceSource: string | null;
} {
  const optCutoff = (option as any)?.checkInCutoffMinutes;
  if (typeof optCutoff === "number" && optCutoff >= 0) {
    return {
      checkInCutoffMinutes: optCutoff,
      checkInEvidenceSource:
        (option as any)?.checkInEvidenceSource ||
        `option_${option?.optionCode || "default"}_check_in_cutoff`,
    };
  }
  const sd = (rec.serviceDetails || {}) as Record<string, any>;
  if (typeof sd.checkInCutoffMinutes === "number" && sd.checkInCutoffMinutes >= 0) {
    return {
      checkInCutoffMinutes: sd.checkInCutoffMinutes,
      checkInEvidenceSource:
        typeof sd.checkInEvidenceSource === "string" && sd.checkInEvidenceSource.trim()
          ? sd.checkInEvidenceSource
          : `service_details_check_in_cutoff:${rec.providerProductCode || rec.tourId}`,
    };
  }
  if (
    typeof sd.checkInBeforeDepartureMinutes === "number" &&
    sd.checkInBeforeDepartureMinutes >= 0
  ) {
    return {
      checkInCutoffMinutes: sd.checkInBeforeDepartureMinutes,
      checkInEvidenceSource:
        typeof sd.checkInEvidenceSource === "string" && sd.checkInEvidenceSource.trim()
          ? sd.checkInEvidenceSource
          : `service_details_check_in_before_departure:${rec.providerProductCode || rec.tourId}`,
    };
  }

  const text = `${rec.pickupSummary || ""} ${option?.description || ""} ${
    typeof sd.checkInInstructions === "string" ? sd.checkInInstructions : ""
  }`;
  const match =
    text.match(/\b(10|15|20|30|45|60)\s*min(?:ute)?s?\s*(?:prior|before|early|in advance|ahead)/i) ||
    text.match(/arrive\s+at\s+least\s+(\d{1,2})\s*min/i);
  if (match) {
    return {
      checkInCutoffMinutes: Number(match[1]),
      checkInEvidenceSource: `parsed_operator_check_in_text:${rec.providerProductCode || rec.tourId}`,
    };
  }

  return {
    checkInCutoffMinutes: null,
    checkInEvidenceSource: null,
  };
}

function extractVerifiedCandidateDepartures(
  rec: DurableTourRecord,
  option: TourProductOptionRecord | null
): {
  departures: string[];
  departureEvidenceSource: string | null;
} {
  const times = new Set<string>();
  let evidenceSource: string | null = null;

  if (option && Array.isArray(option.scheduledStartTimes)) {
    for (const raw of option.scheduledStartTimes) {
      const trimmed = String(raw || "").trim();
      if (trimmed && trimmed !== "00:00" && parseHhMm(trimmed) !== null) {
        times.add(trimmed);
        evidenceSource =
          evidenceSource ||
          `product_option_${option.optionCode || "default"}_scheduled_start_times`;
      }
    }
  }

  if (times.size === 0 && Array.isArray(rec.productOptions)) {
    for (const opt of rec.productOptions) {
      if (Array.isArray(opt.scheduledStartTimes)) {
        for (const raw of opt.scheduledStartTimes) {
          const trimmed = String(raw || "").trim();
          if (trimmed && trimmed !== "00:00" && parseHhMm(trimmed) !== null) {
            times.add(trimmed);
            evidenceSource =
              evidenceSource ||
              `product_option_${opt.optionCode || "default"}_scheduled_start_times`;
          }
        }
      }
    }
  }

  const sd = (rec.serviceDetails || {}) as Record<string, any>;
  if (Array.isArray(sd.verifiedDepartureTimesLocal)) {
    for (const raw of sd.verifiedDepartureTimesLocal) {
      const trimmed = String(raw || "").trim();
      if (trimmed && trimmed !== "00:00" && parseHhMm(trimmed) !== null) {
        times.add(trimmed);
        evidenceSource =
          evidenceSource ||
          `service_details_verified_departure_times:${rec.providerProductCode || rec.tourId}`;
      }
    }
  }

  return {
    departures: Array.from(times).sort((a, b) => (parseHhMm(a) ?? 0) - (parseHhMm(b) ?? 0)),
    departureEvidenceSource: evidenceSource,
  };
}

export function evaluateTourPortDayTimeFit(params: {
  rec: DurableTourRecord;
  profile: CruisePortExcursionProfile;
  shipArrivalTime?: string;
  shipAllAboardTime?: string;
  optionCode?: string | null;
}): PortDayTimeFitEvaluation {
  const { rec, profile } = params;
  const arrivalTime = params.shipArrivalTime || profile.defaultShipArrivalTime;
  const allAboardTime = params.shipAllAboardTime || profile.defaultShipAllAboardTime;
  const arrivalMin = parseHhMm(arrivalTime) ?? 480;
  const allAboardMin = parseHhMm(allAboardTime) ?? 1050;
  const earliestDisembarkMin = arrivalMin + 25;

  const chosenOption: TourProductOptionRecord | null =
    (params.optionCode &&
      rec.productOptions?.find(
        (o) => o.optionCode.toUpperCase() === params.optionCode!.toUpperCase()
      )) ||
    rec.productOptions?.find(
      (o) =>
        Array.isArray(o.scheduledStartTimes) &&
        o.scheduledStartTimes.some((t) => t && t !== "00:00")
    ) ||
    rec.productOptions?.[0] ||
    null;

  const selectedOptionCode =
    chosenOption?.optionCode ||
    (typeof (rec.serviceDetails as any)?.optionCode === "string"
      ? (rec.serviceDetails as any).optionCode
      : null);
  const selectedOptionTitle = chosenOption?.title || null;

  // 1. Exact departure schedule evidence (never fabricate defaults)
  const { departures, departureEvidenceSource } = extractVerifiedCandidateDepartures(
    rec,
    chosenOption
  );
  const hasVerifiedDeparture = departures.length > 0;

  // 2. Exact check-in cutoff evidence (never fall back to port profile default)
  const { checkInCutoffMinutes, checkInEvidenceSource } = extractVerifiedCheckInCutoff(
    rec,
    chosenOption
  );
  const hasVerifiedCheckIn =
    typeof checkInCutoffMinutes === "number" &&
    Number.isFinite(checkInCutoffMinutes) &&
    Boolean(checkInEvidenceSource);

  // 3. Exact meeting point evidence (never fall back to port profile default pier)
  const rawMeetingPointName =
    chosenOption?.meetingPointName ||
    rec.meetingPointName ||
    rec.constraints?.applicableBerthOrMeetingPoint ||
    null;
  const meetingPointName =
    typeof rawMeetingPointName === "string" && rawMeetingPointName.trim()
      ? rawMeetingPointName.trim()
      : null;
  const meetingPointAddress =
    typeof rec.meetingPointAddress === "string" && rec.meetingPointAddress.trim()
      ? rec.meetingPointAddress.trim()
      : null;
  const hasVerifiedMeetingPoint =
    Boolean(meetingPointName) &&
    Boolean(
      (chosenOption?.applicableBerthOrMeetingPoint &&
        chosenOption.applicableBerthOrMeetingPoint.trim()) ||
        (rec.constraints?.applicableBerthOrMeetingPoint &&
          rec.constraints.applicableBerthOrMeetingPoint.trim())
    ) &&
    rec.pickupFulfillmentType !== "unknown" &&
    rec.pickupType !== "UNKNOWN" &&
    rec.provenance?.rawFieldsVerified?.pickupKnown === true;
  const meetingPointEvidenceSource = hasVerifiedMeetingPoint
    ? `product_logistics_meeting_point:${rec.providerProductCode || rec.tourId}`
    : null;

  // 4. Exact pier <-> meeting point transfer evidence (never fall back to planningEstimate or port default)
  const sd = (rec.serviceDetails || {}) as Record<string, any>;
  const transferSource =
    chosenOption?.transferTimeSource || rec.constraints?.transferTimeSource || "unknown";
  const rawTransferBefore =
    chosenOption?.transferBeforeMinutes ??
    sd.transferBeforeMinutes ??
    rec.constraints?.cruiseBufferBeforeMinutes ??
    null;
  const rawTransferAfter =
    chosenOption?.transferAfterMinutes ??
    sd.transferAfterMinutes ??
    rec.constraints?.cruiseBufferAfterMinutes ??
    rawTransferBefore;
  const rawTransferEvidence =
    chosenOption?.transferEvidenceSource ||
    sd.transferEvidenceSource ||
    rec.constraints?.transferEvidenceSource ||
    null;

  const hasVerifiedTransfer =
    (transferSource === "verified_pier_pickup" ||
      transferSource === "verified_meeting_point") &&
    typeof rawTransferBefore === "number" &&
    Number.isFinite(rawTransferBefore) &&
    typeof rawTransferAfter === "number" &&
    Number.isFinite(rawTransferAfter) &&
    Boolean(rawTransferEvidence);

  const pierToMeetingMinutes = hasVerifiedTransfer ? rawTransferBefore : null;
  const meetingToPierMinutes = hasVerifiedTransfer ? rawTransferAfter : null;
  const oneWayTransferMinutes = pierToMeetingMinutes;
  const roundTripTransferMinutes =
    pierToMeetingMinutes !== null && meetingToPierMinutes !== null
      ? pierToMeetingMinutes + meetingToPierMinutes
      : null;
  const transferEvidenceSource = hasVerifiedTransfer ? String(rawTransferEvidence) : null;

  // 5. Duration & return buffer evidence
  const durationMinutes =
    typeof chosenOption?.durationMinutes === "number" && chosenOption.durationMinutes > 0
      ? chosenOption.durationMinutes
      : typeof rec.durationMinutes === "number" && rec.durationMinutes > 0
        ? rec.durationMinutes
        : null;

  const missingFields: string[] = [];
  if (!hasVerifiedDeparture) {
    missingFields.push("departure");
  }
  if (!hasVerifiedCheckIn) {
    missingFields.push("checkIn");
  }
  if (!hasVerifiedMeetingPoint) {
    missingFields.push("meetingPoint");
  }
  if (!hasVerifiedTransfer) {
    missingFields.push("transfers");
  }
  if (!durationMinutes) {
    missingFields.push("duration");
  }

  const hasVerifiedReturnBuffer =
    hasVerifiedDeparture &&
    hasVerifiedCheckIn &&
    hasVerifiedMeetingPoint &&
    hasVerifiedTransfer &&
    Boolean(durationMinutes);

  if (!hasVerifiedReturnBuffer) {
    missingFields.push("returnBuffer");
  }

  if (
    missingFields.length > 0 ||
    !durationMinutes ||
    checkInCutoffMinutes === null ||
    pierToMeetingMinutes === null ||
    meetingToPierMinutes === null
  ) {
    const meetingContext = meetingPointName
      ? `Listed meeting point: ${meetingPointName}.`
      : "No verified operator meeting point on record.";
    return {
      status: "needs_verification",
      statusLabel: "Needs verification",
      fitsSailing: false,
      selectedOptionCode,
      selectedOptionTitle,
      shipArrivalTime: arrivalTime,
      shipAllAboardTime: allAboardTime,
      earliestDisembarkationTime: formatHhMm(earliestDisembarkMin),
      selectedDepartureTime: departures[0] || null,
      availableDepartureTimes: departures,
      fittingDepartureTimes: [],
      tooLateDepartureTimes: [],
      hasVerifiedDeparture,
      departureEvidenceSource,
      checkInCutoffMinutes: hasVerifiedCheckIn ? checkInCutoffMinutes : null,
      latestCheckInTime: null,
      hasVerifiedCheckIn,
      checkInEvidenceSource,
      leavePierByTime: null,
      meetingPointName,
      meetingPointAddress,
      hasVerifiedMeetingPoint,
      meetingPointEvidenceSource,
      oneWayTransferMinutes,
      pierToMeetingMinutes,
      meetingToPierMinutes,
      roundTripTransferMinutes,
      hasVerifiedTransfer,
      transferEvidenceSource,
      durationMinutes,
      tourEndTime: null,
      estimatedBackAtPierTime: null,
      requiredReturnBufferMinutes: profile.requiredReturnBufferMinutes,
      bufferBeforeAllAboardMinutes: null,
      hasVerifiedReturnBuffer: false,
      missingFields,
      reasonSummary: `Needs verification: missing verified ${missingFields.join(
        ", "
      )}. ${meetingContext} Confirm exact product/option departure, check-in, pier transfers, and return buffer before booking for your sailing.`,
    };
  }

  const fittingDepartures: string[] = [];
  const tooLateDepartures: string[] = [];

  for (const dep of departures) {
    const depMin = parseHhMm(dep);
    if (depMin === null) continue;
    const leavePierMin = depMin - checkInCutoffMinutes - pierToMeetingMinutes;
    const backAtPierMin = depMin + durationMinutes + meetingToPierMinutes;
    const bufferMin = allAboardMin - backAtPierMin;

    if (
      leavePierMin >= earliestDisembarkMin &&
      bufferMin >= profile.requiredReturnBufferMinutes
    ) {
      fittingDepartures.push(dep);
    } else {
      tooLateDepartures.push(dep);
    }
  }

  const selectedDep = fittingDepartures[0] || departures[0];
  const selectedDepMin = parseHhMm(selectedDep) ?? 540;
  const checkInMin = selectedDepMin - checkInCutoffMinutes;
  const leavePierMin = checkInMin - pierToMeetingMinutes;
  const tourEndMin = selectedDepMin + durationMinutes;
  const backAtPierMin = tourEndMin + meetingToPierMinutes;
  const bufferBeforeAllAboard = allAboardMin - backAtPierMin;
  const fits = fittingDepartures.includes(selectedDep);

  return {
    status: fits ? "fits" : "runs_too_late",
    statusLabel: fits ? "Fits my sailing" : "Runs too late",
    fitsSailing: fits,
    selectedOptionCode,
    selectedOptionTitle,
    shipArrivalTime: arrivalTime,
    shipAllAboardTime: allAboardTime,
    earliestDisembarkationTime: formatHhMm(earliestDisembarkMin),
    selectedDepartureTime: selectedDep,
    availableDepartureTimes: departures,
    fittingDepartureTimes: fittingDepartures,
    tooLateDepartureTimes: tooLateDepartures,
    hasVerifiedDeparture: true,
    departureEvidenceSource,
    checkInCutoffMinutes,
    latestCheckInTime: formatHhMm(checkInMin),
    hasVerifiedCheckIn: true,
    checkInEvidenceSource,
    leavePierByTime: formatHhMm(leavePierMin),
    meetingPointName,
    meetingPointAddress,
    hasVerifiedMeetingPoint: true,
    meetingPointEvidenceSource,
    oneWayTransferMinutes,
    pierToMeetingMinutes,
    meetingToPierMinutes,
    roundTripTransferMinutes,
    hasVerifiedTransfer: true,
    transferEvidenceSource,
    durationMinutes,
    tourEndTime: formatHhMm(tourEndMin),
    estimatedBackAtPierTime: formatHhMm(backAtPierMin),
    requiredReturnBufferMinutes: profile.requiredReturnBufferMinutes,
    bufferBeforeAllAboardMinutes: bufferBeforeAllAboard,
    hasVerifiedReturnBuffer: true,
    missingFields: [],
    reasonSummary: fits
      ? `Departs ${selectedDep} (option ${selectedOptionCode || "default"}, check in by ${formatHhMm(
          checkInMin
        )} at ${meetingPointName}), ${roundTripTransferMinutes}m round-trip transfer, returns to pier at ${formatHhMm(
          backAtPierMin
        )} with +${bufferBeforeAllAboard}m buffer before ${allAboardTime} all-aboard.`
      : `Departure ${selectedDep} returns to pier at ${formatHhMm(
          backAtPierMin
        )} (${bufferBeforeAllAboard}m vs ${allAboardTime} all-aboard; requires +${
          profile.requiredReturnBufferMinutes
        }m buffer).`,
  };
}

export function buildExactExcursionHandoffLinks(params: {
  rec: DurableTourRecord;
  profile: CruisePortExcursionProfile;
  optionCode: string | null;
  sailingDate: string;
  shipArrivalTime: string;
  shipAllAboardTime: string;
}): PortDayExcursionHandoffLinks {
  const { rec, profile, optionCode, sailingDate, shipArrivalTime, shipAllAboardTime } = params;
  const code = rec.providerProductCode || rec.tourId;
  const isJuneau466119P3 = code.toUpperCase() === "466119P3";

  const rawUrl =
    rec.bookingUrl ||
    `https://www.viator.com/searchResults/all?text=${encodeURIComponent(
      `${profile.portName} ${rec.title}`
    )}`;
  const attributedUrl =
    rec.primaryProvider === "viator"
      ? appendViatorAttribution(rawUrl, {
          campaign: `dcc_port_day_${profile.portSlug}_${code}`,
        })
      : rawUrl;

  const handoffTag = `dcc_port_day_${profile.portSlug}_${code}${
    optionCode ? `_${optionCode}` : ""
  }`;

  const dccTrackedHref = `/go/out?u=${encodeURIComponent(
    attributedUrl
  )}&surface=dcc_port_day_catalog&port=${encodeURIComponent(
    profile.portSlug
  )}&product=${encodeURIComponent(code)}${
    optionCode ? `&option=${encodeURIComponent(optionCode)}` : ""
  }&trackingTag=${encodeURIComponent(handoffTag)}`;

  const cruisePromenadeTrackedHref = `https://cruisepromenade.com/ports/${
    profile.portSlug
  }?date=${encodeURIComponent(sailingDate)}&shipArrival=${encodeURIComponent(
    shipArrivalTime
  )}&allAboard=${encodeURIComponent(shipAllAboardTime)}`;

  return {
    exactProductUrl: attributedUrl,
    dccTrackedHref,
    cruisePromenadeTrackedHref,
    provider: rec.primaryProvider === "operator_direct" ? "operator_direct" : "viator",
    productCode: rec.providerProductCode || null,
    optionCode,
    handoffTrackingTag: handoffTag,
    bookingConfirmationStatus: "tracked_handoff_only",
    referralCreditStatus: isJuneau466119P3
      ? "pending_operator_match_confirmation"
      : "active",
  };
}

function deriveTourCategories(rec: DurableTourRecord): {
  categories: string[];
  primaryCategory: string;
} {
  const allowed = ["sightseeing", "wildlife", "food", "culture", "adventure", "family"];
  const matched = new Set<string>();
  for (const tag of rec.tags || []) {
    const lower = tag.toLowerCase();
    if (allowed.includes(lower)) matched.add(lower);
  }
  const text = `${rec.title} ${rec.summary || ""} ${rec.category || ""}`.toLowerCase();
  if (/whale|puffin|dolphin|wildlife|turtle|seal|bear|eagle|bird|safari|reef|stingray/.test(text)) {
    matched.add("wildlife");
  }
  if (/food|culinary|tasting|beer|brewery|wine|distillery|dinner|lunch|bakery|cooking/.test(text)) {
    matched.add("food");
  }
  if (/museum|history|historic|culture|cultural|heritage|viking|architecture|lagoon|spa|walking/.test(text)) {
    matched.add("culture");
  }
  if (/glacier|ice cave|atv|buggy|zipline|snorkel|dive|kayak|rafting|helicopter|hike|hiking|jeep|4x4|lava|volcano|adventure/.test(text)) {
    matched.add("adventure");
  }
  if (/family|kid|easy|classic|hop-on|sightseeing|bus|panoramic|scenic/.test(text)) {
    matched.add("family");
  }
  if (matched.size === 0 || /sightseeing|circle|city|coast|highlight|tour|cruise|excursion/.test(text)) {
    matched.add("sightseeing");
  }
  const arr = Array.from(matched);
  return {
    categories: arr,
    primaryCategory: arr[0] || "sightseeing",
  };
}

export function evaluateDeparturePastStatus(params: {
  date: string;
  departureTime?: string | null;
  timeZone?: string;
}): { isPast: boolean; reason: string | null } {
  const rawDate = String(params.date || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return {
      isPast: true,
      reason: `Invalid departure date "${rawDate}". Expected YYYY-MM-DD in the future.`,
    };
  }
  const tz = params.timeZone || "UTC";
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const getPart = (t: string) => parts.find((p) => p.type === t)?.value || "00";
  const todayStr = `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
  const nowHour = Number(getPart("hour")) % 24;
  const nowMin = nowHour * 60 + Number(getPart("minute"));

  if (rawDate < todayStr) {
    return {
      isPast: true,
      reason: `Departure date ${rawDate} is in the past (current date in ${tz} is ${todayStr}). Past departures are rejected.`,
    };
  }
  if (rawDate === todayStr && params.departureTime) {
    const depMin = parseHhMm(params.departureTime);
    if (depMin !== null && depMin <= nowMin) {
      return {
        isPast: true,
        reason: `Departure time ${params.departureTime} on ${rawDate} has already passed in ${tz} (${formatHhMm(nowMin)}). Past departures are rejected.`,
      };
    }
  }
  return { isPast: false, reason: null };
}

export async function verifyLiveExcursionAvailability(params: {
  portSlug: string;
  tourId: string;
  productCode?: string | null;
  optionCode?: string | null;
  date: string;
  partySize: number;
  departureTime?: string | null;
  timeoutMs?: number;
  simulateTimeout?: boolean;
}): Promise<PortDaySeatAvailabilityEvaluation> {
  const profile =
    resolveCruisePortExcursionProfile(params.portSlug) ||
    MAPPED_CRUISE_PORT_EXCURSION_PROFILES[0];

  const rec =
    (params.tourId ? await getDurableTourByIdOrAlias(params.tourId) : null) ||
    (params.productCode ? await getDurableTourByIdOrAlias(params.productCode) : null);

  const node = resolveEarthOSDestinationNode(params.portSlug);
  const timeZone = rec?.timeZone || node?.timeZone || "UTC";

  const code = (params.productCode || rec?.providerProductCode || params.tourId || "").trim();
  const partySize = Math.max(1, Number(params.partySize) || 2);
  const checkedDate = String(params.date || "").trim();

  const chosenOption =
    (params.optionCode &&
      rec?.productOptions?.find(
        (o) => o.optionCode.toUpperCase() === params.optionCode!.toUpperCase()
      )) ||
    rec?.productOptions?.find(
      (o) =>
        Array.isArray(o.scheduledStartTimes) &&
        o.scheduledStartTimes.some((t) => t && t !== "00:00")
    ) ||
    rec?.productOptions?.[0] ||
    null;

  const requestedOptionCode =
    (
      params.optionCode ||
      chosenOption?.optionCode ||
      (typeof (rec?.serviceDetails as any)?.optionCode === "string"
        ? (rec?.serviceDetails as any).optionCode
        : null) ||
      null
    )?.trim() || null;

  const requestedDepartureTime =
    (
      params.departureTime ||
      chosenOption?.scheduledStartTimes?.find((t) => t && t !== "00:00") ||
      null
    )?.trim() || null;

  const fallbackRecord: DurableTourRecord =
    rec ||
    ({
      tourId: params.tourId || code,
      providerProductCode: code,
      primaryProvider: "viator",
      title: code,
      bookingUrl: `https://www.viator.com/searchResults/all?text=${encodeURIComponent(
        `${profile.portName} ${code}`
      )}`,
    } as DurableTourRecord);

  const handoff = buildExactExcursionHandoffLinks({
    rec: fallbackRecord,
    profile,
    optionCode: requestedOptionCode,
    sailingDate: checkedDate || profile.defaultSailingDate,
    shipArrivalTime: profile.defaultShipArrivalTime,
    shipAllAboardTime: profile.defaultShipAllAboardTime,
  });

  const pastCheck = evaluateDeparturePastStatus({
    date: checkedDate,
    departureTime: requestedDepartureTime,
    timeZone,
  });

  if (pastCheck.isPast) {
    return {
      status: "check_availability",
      statusLabel: "Check availability",
      supportsLiveCheck: true,
      liveCheckedAt: new Date().toISOString(),
      checkedDate: checkedDate || null,
      checkedPartySize: partySize,
      selectedOptionCode: requestedOptionCode,
      selectedDepartureTime: requestedDepartureTime,
      available: null,
      remainingSeats: null,
      fromPriceUsd: null,
      totalPriceUsd: null,
      currency: rec?.currency || "USD",
      exactProductUrl: handoff.exactProductUrl,
      dccTrackedHref: handoff.dccTrackedHref,
      pastDepartureRejected: true,
      rejectionReason: pastCheck.reason,
      providerStatus: "past_departure_rejected",
      options: [],
      detailNote:
        pastCheck.reason ||
        "Past departure rejected. Select a future sailing date and departure time.",
    };
  }

  const buildCheckAvailabilityFallback = (
    providerStatus:
      | "timeout"
      | "missing_data"
      | "option_or_departure_unconfirmed"
      | "provider_unconfirmed"
      | "unconfigured"
      | "error",
    detailNote: string
  ): PortDaySeatAvailabilityEvaluation => ({
    status: "check_availability",
    statusLabel: "Check availability",
    supportsLiveCheck: true,
    liveCheckedAt: new Date().toISOString(),
    checkedDate: checkedDate || null,
    checkedPartySize: partySize,
    selectedOptionCode: requestedOptionCode,
    selectedDepartureTime: requestedDepartureTime,
    available: null,
    remainingSeats: null,
    fromPriceUsd: null,
    totalPriceUsd: null,
    currency: rec?.currency || "USD",
    exactProductUrl: handoff.exactProductUrl,
    dccTrackedHref: handoff.dccTrackedHref,
    pastDepartureRejected: false,
    rejectionReason: null,
    providerStatus,
    options: [],
    detailNote,
  });

  const timeoutMs =
    typeof params.timeoutMs === "number" && Number.isFinite(params.timeoutMs)
      ? Math.max(1, Math.min(15000, params.timeoutMs))
      : 6000;

  if (params.simulateTimeout) {
    return buildCheckAvailabilityFallback(
      "timeout",
      `Provider availability check timed out after ${timeoutMs}ms for ${code || "tour"}. Showing Check availability with unknown seat count.`
    );
  }

  if (!code || !checkedDate || !requestedDepartureTime || !requestedOptionCode || partySize < 1) {
    return buildCheckAvailabilityFallback(
      "option_or_departure_unconfirmed",
      `Provider could not confirm exact option, departure time, date, and party size. Showing Check availability.`
    );
  }

  // Direct FareHarbor live slot verification when operator credentials and item ID are configured
  const sd = (rec?.serviceDetails || {}) as Record<string, any>;
  if (
    rec?.primaryProvider === "operator_direct" &&
    typeof sd.fareharborCompanyShortname === "string" &&
    typeof sd.fareharborItemId === "number"
  ) {
    try {
      const fhPromise = fetchAvailabilitiesForItem(
        sd.fareharborCompanyShortname,
        sd.fareharborItemId,
        checkedDate,
        checkedDate
      );
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("PROVIDER_TIMEOUT")), timeoutMs)
      );
      const slots = await Promise.race([fhPromise, timeoutPromise]);
      const matchingSlot = (Array.isArray(slots) ? slots : []).find((s: any) => {
        const startAt = String(s?.start_at || "");
        const hhmm = startAt.includes("T") ? startAt.split("T")[1]?.slice(0, 5) : "";
        return hhmm === requestedDepartureTime.slice(0, 5);
      });
      if (matchingSlot) {
        const cap =
          typeof matchingSlot.capacity === "number" ? matchingSlot.capacity : null;
        if (cap !== null && cap < partySize) {
          return {
            status: "sold_out",
            statusLabel: "Sold out",
            supportsLiveCheck: true,
            liveCheckedAt: new Date().toISOString(),
            checkedDate,
            checkedPartySize: partySize,
            selectedOptionCode: requestedOptionCode,
            selectedDepartureTime: requestedDepartureTime,
            available: false,
            remainingSeats: cap,
            fromPriceUsd: null,
            totalPriceUsd: null,
            currency: rec.currency || "USD",
            exactProductUrl: handoff.exactProductUrl,
            dccTrackedHref: handoff.dccTrackedHref,
            pastDepartureRejected: false,
            rejectionReason: null,
            providerStatus: "live_confirmed",
            options: [],
            detailNote: `Provider confirmed ${cap} remaining seats for ${requestedDepartureTime} on ${checkedDate} (party size ${partySize}).`,
          };
        }
        if (cap !== null && cap >= partySize) {
          return {
            status: "live_verified",
            statusLabel: "Live verified",
            supportsLiveCheck: true,
            liveCheckedAt: new Date().toISOString(),
            checkedDate,
            checkedPartySize: partySize,
            selectedOptionCode: requestedOptionCode,
            selectedDepartureTime: requestedDepartureTime,
            available: true,
            remainingSeats: cap,
            fromPriceUsd: null,
            totalPriceUsd: null,
            currency: rec.currency || "USD",
            exactProductUrl: handoff.exactProductUrl,
            dccTrackedHref: handoff.dccTrackedHref,
            pastDepartureRejected: false,
            rejectionReason: null,
            providerStatus: "live_confirmed",
            options: [
              {
                optionCode: requestedOptionCode,
                title: chosenOption?.title || rec.title,
                startTime: requestedDepartureTime,
                available: true,
                remainingSeats: cap,
                priceUsd: null,
              },
            ],
            detailNote: `Live FareHarbor API confirmed availability for option ${requestedOptionCode} at ${requestedDepartureTime} on ${checkedDate} for ${partySize} guests.`,
          };
        }
      }
      return buildCheckAvailabilityFallback(
        "option_or_departure_unconfirmed",
        `Provider did not return an exact slot match for option ${requestedOptionCode} (${requestedDepartureTime}) on ${checkedDate}. Check availability on the exact product link.`
      );
    } catch (err: any) {
      const isTimeout = String(err?.message || "").includes("PROVIDER_TIMEOUT");
      return buildCheckAvailabilityFallback(
        isTimeout ? "timeout" : "provider_unconfirmed",
        isTimeout
          ? `Provider availability check timed out after ${timeoutMs}ms. Check availability on the exact product link.`
          : `Provider availability check unavailable. Check availability on the exact product link.`
      );
    }
  }

  // Live Viator Partner API v2 /availability/check
  if (process.env.VIATOR_API_KEY && code && !code.startsWith("PACWHALE-")) {
    try {
      const client = getViatorClient();
      const checkPromise = client.checkAvailability({
        productCode: code,
        travelDate: checkedDate,
        currency: "USD",
        paxMix: [{ ageBand: "ADULT", numberOfTravelers: partySize }],
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("PROVIDER_TIMEOUT")), timeoutMs)
      );
      const checkRes: any = await Promise.race([checkPromise, timeoutPromise]);
      const items = Array.isArray(checkRes?.bookableItems) ? checkRes.bookableItems : [];

      const exactItem = items.find((it: any) => {
        const itemOpt = String(it?.productOptionCode || "DEFAULT").trim().toUpperCase();
        const itemTime = String(it?.startTime || "").trim().slice(0, 5);
        const itemDate = it?.travelDate ? String(it.travelDate).trim() : checkedDate;
        const lineItemTravelers = Array.isArray(it?.lineItems)
          ? it.lineItems.reduce(
              (acc: number, li: any) => acc + (Number(li?.numberOfTravelers) || 0),
              0
            )
          : partySize;
        return (
          itemOpt === requestedOptionCode.trim().toUpperCase() &&
          itemTime === requestedDepartureTime.trim().slice(0, 5) &&
          itemDate === checkedDate &&
          lineItemTravelers === partySize
        );
      });

      if (!exactItem) {
        return buildCheckAvailabilityFallback(
          "option_or_departure_unconfirmed",
          `Viator /availability/check did not confirm exact option ${requestedOptionCode} at ${requestedDepartureTime} on ${checkedDate} for ${partySize} guests. Check availability on the exact product link.`
        );
      }

      if (exactItem.available === false) {
        return {
          status: "sold_out",
          statusLabel: "Sold out",
          supportsLiveCheck: true,
          liveCheckedAt: new Date().toISOString(),
          checkedDate,
          checkedPartySize: partySize,
          selectedOptionCode: String(exactItem.productOptionCode || requestedOptionCode),
          selectedDepartureTime: String(exactItem.startTime || requestedDepartureTime).slice(
            0,
            5
          ),
          available: false,
          remainingSeats: 0,
          fromPriceUsd: null,
          totalPriceUsd: null,
          currency: String(checkRes?.currency || "USD"),
          exactProductUrl: handoff.exactProductUrl,
          dccTrackedHref: handoff.dccTrackedHref,
          pastDepartureRejected: false,
          rejectionReason: null,
          providerStatus: "live_confirmed",
          options: [
            {
              optionCode: String(exactItem.productOptionCode || requestedOptionCode),
              title: chosenOption?.title || `Option ${requestedOptionCode}`,
              startTime: String(exactItem.startTime || requestedDepartureTime).slice(0, 5),
              available: false,
              remainingSeats: 0,
              priceUsd: null,
            },
          ],
          detailNote: `Live Viator Partner API confirmed option ${requestedOptionCode} at ${requestedDepartureTime} on ${checkedDate} is sold out for ${partySize} guests.`,
        };
      }

      if (exactItem.available === true) {
        const rawTotalRetail =
          exactItem?.totalPrice?.price?.recommendedRetailPrice ??
          exactItem?.totalPrice?.price?.partnerTotalPrice ??
          null;
        const totalPriceUsd =
          typeof rawTotalRetail === "number" && Number.isFinite(rawTotalRetail)
            ? Number(rawTotalRetail.toFixed(2))
            : null;
        const perPersonPriceUsd =
          totalPriceUsd !== null ? Number((totalPriceUsd / partySize).toFixed(2)) : null;
        const providerRemainingSeats =
          typeof exactItem?.remainingSeats === "number" &&
          Number.isFinite(exactItem.remainingSeats)
            ? exactItem.remainingSeats
            : typeof exactItem?.availableSeats === "number" &&
                Number.isFinite(exactItem.availableSeats)
              ? exactItem.availableSeats
              : null;

        const matchedOptionCode = String(exactItem.productOptionCode || requestedOptionCode);
        const matchedStartTime = String(exactItem.startTime || requestedDepartureTime).slice(0, 5);

        return {
          status: "live_verified",
          statusLabel:
            providerRemainingSeats !== null
              ? `Live Verified — ${providerRemainingSeats} seats for ${partySize} guests (${matchedOptionCode} · ${matchedStartTime} on ${checkedDate})`
              : `Live Verified — Available for ${partySize} ${
                  partySize === 1 ? "guest" : "guests"
                } (${matchedOptionCode} · ${matchedStartTime} on ${checkedDate})`,
          supportsLiveCheck: true,
          liveCheckedAt: new Date().toISOString(),
          checkedDate,
          checkedPartySize: partySize,
          selectedOptionCode: matchedOptionCode,
          selectedDepartureTime: matchedStartTime,
          available: true,
          remainingSeats: providerRemainingSeats,
          fromPriceUsd: perPersonPriceUsd,
          totalPriceUsd,
          currency: String(checkRes?.currency || "USD"),
          exactProductUrl: handoff.exactProductUrl,
          dccTrackedHref: handoff.dccTrackedHref,
          pastDepartureRejected: false,
          rejectionReason: null,
          providerStatus: "live_confirmed",
          options: [
            {
              optionCode: matchedOptionCode,
              title: chosenOption?.title || `Option ${requestedOptionCode}`,
              startTime: matchedStartTime,
              available: true,
              remainingSeats: providerRemainingSeats,
              priceUsd: perPersonPriceUsd,
            },
          ],
          detailNote: `Provider-confirmed via Viator Partner API /availability/check for ${code} (option ${matchedOptionCode}, departure ${matchedStartTime}, date ${checkedDate}, party size ${partySize}${
            totalPriceUsd !== null ? `, $${totalPriceUsd.toFixed(2)} total` : ""
          }). Seat count is ${
            providerRemainingSeats !== null
              ? providerRemainingSeats
              : "unknown (not returned by provider)"
          }.`,
        };
      }
    } catch (err: any) {
      const isTimeout =
        String(err?.message || "").includes("PROVIDER_TIMEOUT") ||
        String(err?.name || "") === "AbortError";
      return buildCheckAvailabilityFallback(
        isTimeout ? "timeout" : "provider_unconfirmed",
        isTimeout
          ? `Provider availability check timed out after ${timeoutMs}ms for ${code}. Showing Check availability with unknown seat count.`
          : `Provider could not confirm exact option (${requestedOptionCode}), departure (${requestedDepartureTime}), date (${checkedDate}), and party size (${partySize}). Showing Check availability.`
      );
    }
  }

  return buildCheckAvailabilityFallback(
    "option_or_departure_unconfirmed",
    `Provider could not confirm exact option (${requestedOptionCode}), departure (${requestedDepartureTime}), date (${checkedDate}), and party size (${partySize}). Showing Check availability.`
  );
}

export async function queryPortDayExcursionCatalog(params: {
  portSlug: string;
  viewMode?: PortDayExcursionViewMode;
  category?: PortDayExcursionCategoryFilter;
  shipArrivalTime?: string;
  shipAllAboardTime?: string;
  sailingDate?: string;
  partySize?: number;
  limit?: number;
  offset?: number;
  sortBy?: "recommended" | "rating_desc" | "price_asc" | "duration_asc";
  search?: string;
}): Promise<PortDayExcursionCatalogResponse | null> {
  const profile = resolveCruisePortExcursionProfile(params.portSlug);
  if (!profile) return null;

  const viewMode: PortDayExcursionViewMode = params.viewMode || "browse_all";
  const category: PortDayExcursionCategoryFilter = params.category || "all";
  const shipArrivalTime = params.shipArrivalTime || profile.defaultShipArrivalTime;
  const shipAllAboardTime = params.shipAllAboardTime || profile.defaultShipAllAboardTime;
  const sailingDate =
    params.sailingDate || profile.defaultSailingDate || "2027-07-15";
  const partySize = Math.max(1, params.partySize || 2);
  const limit = Math.max(1, Math.min(100, params.limit || 12));
  const offset = Math.max(0, params.offset || 0);
  const sortBy: DurableCatalogSortBy = params.sortBy || "recommended";

  const sqlRes = await queryDurableTourCatalog({
    destinationSlug: profile.destinationSlug,
    category: category === "all" ? undefined : category,
    searchQuery: params.search,
    requireVerifiedCruiseLogistics: viewMode === "fits_sailing",
    verifiedTimingOnly: viewMode === "fits_sailing" ? true : undefined,
    sortBy,
    limit,
    offset,
  });

  const evaluatedCards: PortDayExcursionCard[] = sqlRes.records.map((rec) => {
    const timeFit = evaluateTourPortDayTimeFit({
      rec,
      profile,
      shipArrivalTime,
      shipAllAboardTime,
    });

    const chosenOptionCode = timeFit.selectedOptionCode;

    const handoff = buildExactExcursionHandoffLinks({
      rec,
      profile,
      optionCode: chosenOptionCode,
      sailingDate,
      shipArrivalTime,
      shipAllAboardTime,
    });

    const { categories, primaryCategory } = deriveTourCategories(rec);
    const fromPriceUsd =
      rec.fromPriceCents !== null && rec.fromPriceCents !== undefined
        ? Number((rec.fromPriceCents / 100).toFixed(2))
        : null;

    const codeUpper = (rec.providerProductCode || "").toUpperCase();
    const juneauRec = JUNEAU_PRODUCT_SUPPLIER_RECONCILIATION[codeUpper];
    const operatorName = juneauRec
      ? `${juneauRec.verifiedViatorSupplierName} (Viator supplier; Juneau Tours & Whale Watch relationship ${juneauRec.juneauToursOperatorConfirmationStatus})`
      : rec.operatorName ||
        (rec.primaryProvider === "viator"
          ? `${profile.portName} Authorized Viator Supplier`
          : `${profile.portName} Direct Operator`);

    const supportsLiveCheck =
      (rec.primaryProvider === "viator" || rec.primaryProvider === "operator_direct") &&
      rec.capabilityTier !== "discovery_only";

    const pastDepCheck = evaluateDeparturePastStatus({
      date: sailingDate,
      departureTime: timeFit.selectedDepartureTime,
      timeZone: rec.timeZone,
    });

    return {
      tourId: rec.tourId,
      productCode: rec.providerProductCode || null,
      optionCode: chosenOptionCode,
      title: rec.title,
      shortDescription:
        rec.summary ||
        `${rec.title} — shore excursion in ${profile.portName} evaluated against ${shipArrivalTime}–${shipAllAboardTime} port window.`,
      provider:
        rec.primaryProvider === "operator_direct" ? "operator_direct" : "viator",
      operatorName,
      categories,
      primaryCategory,
      rating: rec.ratingAverage,
      reviewCount: rec.reviewCount || 0,
      fromPriceUsd,
      currency: rec.currency || "USD",
      durationMinutes: rec.durationMinutes,
      imageUrl: rec.primaryImageUrl,
      pickupType: rec.pickupFulfillmentType || "unknown",
      timeFit,
      seatAvailability: {
        status: "check_availability",
        statusLabel: "Check availability",
        supportsLiveCheck,
        liveCheckedAt: null,
        checkedDate: sailingDate,
        checkedPartySize: partySize,
        selectedOptionCode: chosenOptionCode,
        selectedDepartureTime: timeFit.selectedDepartureTime,
        available: null,
        remainingSeats: null,
        fromPriceUsd: null,
        totalPriceUsd: null,
        currency: rec.currency || "USD",
        exactProductUrl: handoff.exactProductUrl,
        dccTrackedHref: handoff.dccTrackedHref,
        pastDepartureRejected: pastDepCheck.isPast,
        rejectionReason: pastDepCheck.reason,
        providerStatus: pastDepCheck.isPast ? "past_departure_rejected" : "unverified",
        options: [],
        detailNote: pastDepCheck.isPast
          ? pastDepCheck.reason || "Past departure rejected."
          : supportsLiveCheck
            ? `Check live availability for option ${
                chosenOptionCode || "default"
              } (${timeFit.selectedDepartureTime || "select time"}) on ${sailingDate} for ${partySize} guests, or open the exact product link. Time fit and seat availability are tracked separately.`
            : "Check availability on the exact product link for your date and group size.",
      },
      handoff,
    };
  });

  const visibleTours =
    viewMode === "fits_sailing"
      ? evaluatedCards.filter((c) => c.timeFit.status === "fits" && c.timeFit.fitsSailing)
      : evaluatedCards;

  const portCounts = AUTHORITATIVE_PORT_PROVIDER_COUNTS[profile.portSlug] || {
    viator: sqlRes.totalMatched,
    operator_direct: evaluatedCards.filter((c) => c.provider === "operator_direct").length,
    bokun_pending: 0,
    authorizedSourceTotal: sqlRes.totalMatched,
    reconciledWithAuthorizedSource: true,
  };
  const totalImportedForPort = portCounts.viator + portCounts.operator_direct;
  const coveragePercent =
    portCounts.authorizedSourceTotal > 0
      ? Math.min(
          100,
          Math.round((totalImportedForPort / portCounts.authorizedSourceTotal) * 1000) / 10
        )
      : 100;

  const needsVerificationCount = evaluatedCards.filter(
    (c) =>
      c.timeFit.status === "needs_verification" ||
      c.timeFit.status === "missing_operator_info"
  ).length;

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    port: profile,
    sailingWindow: {
      shipArrivalTime,
      shipAllAboardTime,
      sailingDate,
      partySize,
    },
    viewMode,
    category,
    pagination: {
      limit,
      offset,
      page: Math.floor(offset / limit) + 1,
      totalMatchedInSql: sqlRes.totalMatched,
      rowsLoadedIntoApp: sqlRes.rowsLoadedIntoApp,
      fullCatalogLoadedIntoApp: sqlRes.fullCatalogLoadedIntoApp,
      executedInSql: sqlRes.executedInSql,
      sqlQueryMs: sqlRes.sqlQueryMs ?? 0,
      hasMore: sqlRes.hasMore,
      nextOffset: sqlRes.nextOffset,
      storageSource: sqlRes.storageSource,
    },
    providerCounts: {
      viator: portCounts.viator,
      operator_direct: portCounts.operator_direct,
      bokun_pending: portCounts.bokun_pending,
      total: totalImportedForPort,
      reconciledWithAuthorizedSource: portCounts.reconciledWithAuthorizedSource,
      authorizedSourceTotal: portCounts.authorizedSourceTotal,
      coveragePercent,
      coverageStatus: portCounts.reconciledWithAuthorizedSource
        ? "complete"
        : "sampled_provider_catalog",
      pendingOperatorNotes:
        profile.portSlug === "reykjavik"
          ? [
              `Hreyfill (${HREYFILL_REYKJAVIK_SHORE_EXCURSION_QUALIFICATION.candidateTours.length} candidate Golden Circle & South Coast tours): ${HREYFILL_REYKJAVIK_SHORE_EXCURSION_QUALIFICATION.bookingLinkVerificationGate.publicDisplayValue}`,
            ]
          : profile.portSlug === "juneau"
            ? [
                JUNEAU_PRODUCT_SUPPLIER_RECONCILIATION["466119P3"].reconciliationNote,
              ]
            : undefined,
    },
    summary: {
      totalEvaluatedOnPage: evaluatedCards.length,
      fitsSailingCountOnPage: evaluatedCards.filter((c) => c.timeFit.status === "fits")
        .length,
      runsTooLateCountOnPage: evaluatedCards.filter(
        (c) => c.timeFit.status === "runs_too_late"
      ).length,
      needsVerificationCountOnPage: needsVerificationCount,
      missingOperatorInfoCountOnPage: needsVerificationCount,
      liveAvailabilitySupportedCountOnPage: evaluatedCards.filter(
        (c) => c.seatAvailability.supportsLiveCheck
      ).length,
    },
    tours: visibleTours,
  };
}
