import { createHash } from "node:crypto";
import { getViatorClient } from "@/lib/viator/client";
import { getViatorPublicConfig } from "@/lib/viator/config";
import { appendViatorAttribution } from "@/lib/viator/links";
import {
  EARTHOS_DESTINATION_NODES,
  getActiveDestinationProviderCounts,
  getDurableTourByIdOrAlias,
  queryDurableTourCatalog,
  resolveEarthOSDestinationNode,
  type DurableCatalogSortBy,
  type DurableTourRecord,
  type TourProductOptionRecord,
} from "@/lib/dcc/catalog/durableCatalogStore";
import {
  CommercialHandoffStorageError,
  createCommercialHandoff,
  getDurableCommercialHandoff,
  getSharedHandoffLedgerSummary,
  isCommercialQaTraffic,
  recordMachineFunnelEvent,
  type CommercialHandoffRecord,
  type SharedHandoffLedgerSummary,
} from "@/lib/dcc/commerce";
import { HREYFILL_REYKJAVIK_SHORE_EXCURSION_QUALIFICATION } from "@/lib/dcc/corridors/internationalCorridorQualifications";
import { JUNEAU_PRODUCT_SUPPLIER_RECONCILIATION } from "@/lib/dcc/machine/v03/operatorDirectCheckout";
import { fetchAvailabilitiesForItem } from "@/lib/dcc/liveSlots/fareharbor";

export type PortDayExcursionViewMode = "browse_all" | "fits_sailing" | "shortlist_2h";

export const TWO_HOUR_SHORTLIST_REQUIRED_BUFFER_MINUTES = 120;

export type PortDayDockOrTender = "dock" | "tender" | "unknown";

export type PortDayTwoHourShortlistStatus =
  | "estimated_back_2h_plus"
  | "other_tour_that_fits"
  | "runs_too_late"
  | "needs_verification";

export interface PortDayTwoHourShortlistEvaluation {
  qualifies: boolean;
  status: PortDayTwoHourShortlistStatus;
  statusLabel:
    | "Estimated back 2+ hours before all aboard"
    | "See other tours that fit"
    | "Runs too late"
    | "Needs verification";
  requiredBufferMinutes: number;
  evaluatedAfterDccFitChecks: true;
  exactOptionCode: string | null;
  exactDepartureTime: string | null;
  confirmedAllAboardTime: string | null;
  isConfirmedAllAboard: boolean;
  dockOrTender: PortDayDockOrTender;
  meetingToPierMinutes: number | null;
  tenderTravelMinutes: number | null;
  tenderCutoffMinutes: number | null;
  lastTenderCutoffTime: string | null;
  fullReturnTripMinutes: number | null;
  returnAtPierTime: string | null;
  returnEstimateTime: string | null;
  deadlineTime: string;
  effectiveDeadlineTime: string | null;
  bufferBeforeAllAboardMinutes: number | null;
  missingFields: string[];
  offerSeeOtherToursThatFit: boolean;
  seeOtherToursThatFitLabel: "See other tours that fit";
  summaryText: string;
}

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
  berthLat?: number;
  berthLng?: number;
  defaultSailingDate: string;
  defaultShipArrivalTime: string;
  defaultShipAllAboardTime: string;
  defaultShipDepartureTime: string;
  defaultOneWayPierTransferMinutes: number;
  defaultCheckInCutoffMinutes: number;
  requiredReturnBufferMinutes: number;
  dockOrTender?: PortDayDockOrTender;
  defaultTenderTravelMinutes?: number;
  defaultTenderCutoffMinutes?: number;
}

export interface PortDayEvidenceReviewPriority {
  withinOneMileOfBerth: boolean;
  distanceFromBerthMiles: number | null;
  berthCoordinates: { lat: number; lng: number };
  meetingPointCoordinates: { lat: number; lng: number } | null;
  priorityTier:
    | "priority_1_within_one_mile"
    | "priority_2_pier_or_pickup_signal"
    | "priority_3_beyond_one_mile"
    | "priority_4_missing_coordinates";
  priorityRank: 1 | 2 | 3 | 4;
  spatialMethod: "haversine_sql_and_js_no_postgis";
  automatedEvidenceNotes: string[];
}

export type PortDayDepartureTimeSource =
  | "scheduled_port_call"
  | "request_param"
  | "request"
  | "missing"
  | "ambiguous"
  | "invalid";

export type PortDayWindowTimeSource =
  | "request_param"
  | "scheduled_port_call"
  | "port_estimate";

export interface ScheduledCruisePortCall {
  sailingId: string;
  sailingAliases?: string[];
  shipSlug: string;
  shipName: string;
  portSlug: string;
  sailingDate: string;
  arrivalTime: string;
  allAboardTime: string;
  departureTime: string;
}

export interface PortDayTimeFitEvaluation {
  status: PortDayTimeFitStatus;
  statusLabel: string;
  fitsSailing: boolean;
  selectedOptionCode: string | null;
  selectedOptionTitle: string | null;
  shipArrivalTime: string;
  shipArrivalTimeLabel?: string;
  arrivalTimeSource?: PortDayWindowTimeSource;
  shipAllAboardTime: string;
  shipAllAboardTimeLabel?: string;
  allAboardTimeSource?: PortDayWindowTimeSource;
  shipDepartureTime: string | null;
  departureTimeSource?: PortDayDepartureTimeSource;
  allAboardToShipDepartureMinutes: number | null;
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
  dockOrTender?: PortDayDockOrTender;
  tenderTravelMinutes?: number | null;
  tenderCutoffMinutes?: number | null;
  lastTenderCutoffTime?: string | null;
  fullReturnTripMinutes?: number | null;
  returnAtPierTime?: string | null;
  returnEstimateTime?: string | null;
  durationMinutes: number | null;
  tourEndTime: string | null;
  estimatedBackAtPierTime: string | null;
  requiredReturnBufferMinutes: number;
  bufferBeforeAllAboardMinutes: number | null;
  bufferBeforeShipDepartureMinutes: number | null;
  returnBufferReconciliation?: {
    requiredAllAboardBufferMinutes: number;
    allAboardTimeSource?: PortDayWindowTimeSource;
    shipAllAboardTimeLabel?: string;
    shipDepartureTime: string | null;
    allAboardToShipDepartureMinutes: number | null;
    equivalentShipDepartureBufferMinutes: number | null;
    bufferBeforeAllAboardMinutes: number | null;
    bufferBeforeShipDepartureMinutes: number | null;
    reconciliationNote: string;
  };
  hasVerifiedReturnBuffer: boolean;
  missingFields: string[];
  reasonSummary: string;
  evidenceReviewPriority?: PortDayEvidenceReviewPriority;
  twoHourShortlist?: PortDayTwoHourShortlistEvaluation;
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
  providerRetailTotal?: number;
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
  originatingSite?: string;
  approvedAffiliateAccount?: string;
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
    shipArrivalTimeLabel?: string;
    arrivalTimeSource?: PortDayWindowTimeSource;
    shipAllAboardTime: string;
    shipAllAboardTimeLabel?: string;
    allAboardTimeSource?: PortDayWindowTimeSource;
    shipDepartureTime: string | null;
    allAboardToShipDepartureMinutes: number | null;
    departureTimeSource: PortDayDepartureTimeSource;
    sailingDate: string;
    partySize: number;
    shipSlug?: string | null;
    shipName?: string | null;
    sailingId?: string | null;
  };
  viewMode: PortDayExcursionViewMode;
  category: PortDayExcursionCategoryFilter;
  pagination: {
    limit: number;
    offset: number;
    page: number;
    totalMatchedInSql: number;
    totalFittingSailing?: number;
    verifiedTimingCandidatesInSql?: number;
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
    source?: "postgres_live_sql" | "snapshot_fallback" | "static_fallback";
    nextStartOffset?: number | null;
    checkpointUpdatedAt?: string | null;
    reconciliationBreakdown?: {
      activeSqlTotal: number;
      activeViatorInSql: number;
      activeOperatorDirectInSql: number;
      legacyStaticSummaryCount?: number;
      legacyStaticSummaryExplanation?: string;
      previousCronCheckpointCount?: number;
      previousCronCheckpointExplanation?: string;
      currentActiveInventoryExplanation: string;
    };
    importerCheckpoint?: {
      destinationSearchPaginationModel: "start_and_count";
      incrementalFeedPaginationModel: "nextCursor";
      batchSizeCount: number;
      lastStartOffset: number;
      nextStartOffset: number | null;
      providerTotalCount: number;
      incrementalUpdateCursor: string | null;
      checkpointStatus: "complete" | "bounded_batch_paused";
      note: string;
    };
    pendingOperatorNotes?: string[];
  };
  sharedHandoffLedgerSummary?: SharedHandoffLedgerSummary;
  shortlistSummary?: {
    defaultRecommendationLabel: "Estimated back 2+ hours before all aboard";
    requiredBufferMinutes: number;
    shortlist2hCountOnPage: number;
    otherFittingCountOnPage: number;
    totalFittingSailingCountOnPage: number;
    needsVerificationCountOnPage: number;
    offerSeeOtherToursThatFit: boolean;
    seeOtherToursThatFitLabel: "See other tours that fit";
    seeOtherToursThatFitViewMode: "fits_sailing";
  };
  summary: {
    totalEvaluatedOnPage: number;
    shortlist2hCountOnPage?: number;
    otherFittingCountOnPage?: number;
    fitsSailingCountOnPage: number;
    runsTooLateCountOnPage: number;
    needsVerificationCountOnPage: number;
    missingOperatorInfoCountOnPage: number;
    liveAvailabilitySupportedCountOnPage: number;
    withinOneMileReviewQueueCountOnPage?: number;
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
    viator: 716,
    operator_direct: 1,
    bokun_pending: 0,
    authorizedSourceTotal: 717,
    reconciledWithAuthorizedSource: true,
  },
  miami: {
    viator: 1174,
    operator_direct: 0,
    bokun_pending: 0,
    authorizedSourceTotal: 1174,
    reconciledWithAuthorizedSource: true,
  },
  tampa: {
    viator: 175,
    operator_direct: 0,
    bokun_pending: 0,
    authorizedSourceTotal: 175,
    reconciledWithAuthorizedSource: true,
  },
  seattle: {
    viator: 504,
    operator_direct: 0,
    bokun_pending: 0,
    authorizedSourceTotal: 504,
    reconciledWithAuthorizedSource: true,
  },
  cozumel: {
    viator: 632,
    operator_direct: 0,
    bokun_pending: 0,
    authorizedSourceTotal: 632,
    reconciledWithAuthorizedSource: true,
  },
  roatan: {
    viator: 487,
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
    viator: 355,
    operator_direct: 0,
    bokun_pending: 0,
    authorizedSourceTotal: 355,
    reconciledWithAuthorizedSource: true,
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
  const raw = String(hhmm || "").trim();
  if (!raw) return null;
  const m12 = raw.match(/^(\d{1,2}):(\d{2})\s*([ap])\.?m\.?$/i);
  if (m12) {
    let h = Number(m12[1]);
    const min = Number(m12[2]);
    const meridiem = m12[3].toUpperCase();
    if (h < 1 || h > 12 || min < 0 || min > 59) return null;
    if (meridiem === "A" && h === 12) h = 0;
    if (meridiem === "P" && h < 12) h += 12;
    return h * 60 + min;
  }
  const m = raw.match(/^(\d{1,2}):(\d{2})$/);
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

const PORT_BERTH_COORDINATES: Record<string, { lat: number; lng: number }> = {
  reykjavik: { lat: 64.1558, lng: -21.8697 }, // Skarfabakki Berths 312/313
  kahului: { lat: 20.8961, lng: -156.4728 }, // Kahului Harbor Cruise Terminal Pier 1/2
  juneau: { lat: 58.2994, lng: -134.4067 }, // Juneau Cruise Ship Docks
  skagway: { lat: 59.4506, lng: -135.3219 }, // Skagway Cruise Docks
  ketchikan: { lat: 55.3422, lng: -131.6461 }, // Ketchikan Downtown Berths 1–4
  seward: { lat: 60.1211, lng: -149.4339 }, // Seward Cruise Ship Terminal
  "new-orleans": { lat: 29.9389, lng: -90.0619 }, // Erato/Julia Cruise Terminals (Port NOLA)
  miami: { lat: 25.7781, lng: -80.1704 }, // PortMiami Dodge Island
  tampa: { lat: 27.9438, lng: -82.4452 }, // Port Tampa Bay Channelside
  seattle: { lat: 47.6122, lng: -122.3508 }, // Pier 66 / Pier 91
  cozumel: { lat: 20.4767, lng: -86.9736 }, // Puerta Maya / International Pier
  roatan: { lat: 16.3176, lng: -86.5378 }, // Port of Roatán / Mahogany Bay
  nassau: { lat: 25.0805, lng: -77.3408 }, // Nassau Cruise Port (Prince George Wharf)
  "st-thomas": { lat: 18.3315, lng: -64.9219 }, // WICO Havensight / Crown Bay
  "grand-cayman": { lat: 19.2952, lng: -81.3831 }, // Royal Watler Tender Terminal
};

export function resolvePortBerthCoordinates(profile: CruisePortExcursionProfile): {
  lat: number;
  lng: number;
} {
  if (
    typeof profile.berthLat === "number" &&
    Number.isFinite(profile.berthLat) &&
    typeof profile.berthLng === "number" &&
    Number.isFinite(profile.berthLng)
  ) {
    return { lat: profile.berthLat, lng: profile.berthLng };
  }
  const byPort = PORT_BERTH_COORDINATES[profile.portSlug];
  if (byPort) return byPort;
  const byDest = PORT_BERTH_COORDINATES[profile.destinationSlug];
  if (byDest) return byDest;
  return { lat: 0, lng: 0 };
}

export function computeHaversineDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusMiles = 3958.7613;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  return Number((earthRadiusMiles * c).toFixed(3));
}

export function evaluateEvidenceReviewPriority(params: {
  rec: DurableTourRecord;
  profile: CruisePortExcursionProfile;
  missingFields: string[];
}): PortDayEvidenceReviewPriority {
  const { rec, profile, missingFields } = params;
  const berthCoordinates = resolvePortBerthCoordinates(profile);

  let meetingCoords: { lat: number; lng: number } | null = null;
  if (
    typeof rec.meetingPointLat === "number" &&
    Number.isFinite(rec.meetingPointLat) &&
    typeof rec.meetingPointLng === "number" &&
    Number.isFinite(rec.meetingPointLng)
  ) {
    meetingCoords = { lat: rec.meetingPointLat, lng: rec.meetingPointLng };
  } else if (Array.isArray(rec.pickupLocations)) {
    const firstWithCoords = rec.pickupLocations.find(
      (loc) =>
        typeof loc?.lat === "number" &&
        Number.isFinite(loc.lat) &&
        typeof loc?.lng === "number" &&
        Number.isFinite(loc.lng)
    );
    if (firstWithCoords && firstWithCoords.lat !== null && firstWithCoords.lng !== null) {
      meetingCoords = { lat: firstWithCoords.lat, lng: firstWithCoords.lng };
    }
  }

  const distanceFromBerthMiles = meetingCoords
    ? computeHaversineDistanceMiles(
        berthCoordinates.lat,
        berthCoordinates.lng,
        meetingCoords.lat,
        meetingCoords.lng
      )
    : null;

  const withinOneMileOfBerth =
    distanceFromBerthMiles !== null && distanceFromBerthMiles <= 1.0;

  const hasPierOrPickupSignal =
    rec.pickupFulfillmentType === "pier_pickup" ||
    rec.pickupType === "CRUISE_PIER_PICKUP" ||
    Boolean(rec.hasHotelPickup) ||
    /cruise|pier|port|harbor|harbour|dock|terminal|skarfabakki|midbakki|miðbakki/i.test(
      `${rec.pickupSummary || ""} ${rec.meetingPointName || ""} ${rec.meetingPointAddress || ""}`
    );

  let priorityTier: PortDayEvidenceReviewPriority["priorityTier"];
  let priorityRank: 1 | 2 | 3 | 4;
  if (withinOneMileOfBerth) {
    priorityTier = "priority_1_within_one_mile";
    priorityRank = 1;
  } else if (hasPierOrPickupSignal) {
    priorityTier = "priority_2_pier_or_pickup_signal";
    priorityRank = 2;
  } else if (distanceFromBerthMiles !== null) {
    priorityTier = "priority_3_beyond_one_mile";
    priorityRank = 3;
  } else {
    priorityTier = "priority_4_missing_coordinates";
    priorityRank = 4;
  }

  const notes: string[] = [];
  if (distanceFromBerthMiles !== null) {
    notes.push(
      withinOneMileOfBerth
        ? `Within 1-mile rule (${distanceFromBerthMiles} mi from ${profile.defaultPierName})`
        : `${distanceFromBerthMiles} mi from ${profile.defaultPierName} (> 1.0 mi)`
    );
  } else {
    notes.push("Missing meeting_point_lat/meeting_point_lng coordinates in catalog row");
  }
  if (missingFields.length > 0) {
    notes.push(
      `Requires verification of ${missingFields.join(", ")} (ship berth, option meeting point, option check-in, two-way route, and all-aboard buffer)`
    );
  } else {
    notes.push("All 5 sailing-fit evidence pillars verified");
  }

  return {
    withinOneMileOfBerth,
    distanceFromBerthMiles,
    berthCoordinates,
    meetingPointCoordinates: meetingCoords,
    priorityTier,
    priorityRank,
    spatialMethod: "haversine_sql_and_js_no_postgis",
    automatedEvidenceNotes: notes,
  };
}

export const SCHEDULED_CRUISE_PORT_CALLS: ScheduledCruisePortCall[] = [
  // Independence of the Seas — 7-Night Eastern Caribbean & Perfect Day (INDY-2027-01-24 / ID07MIA-1982128855)
  {
    sailingId: "INDY-2027-01-24",
    sailingAliases: ["ID07MIA-1982128855", "independence-of-the-seas-20270124"],
    shipName: "Independence of the Seas",
    shipSlug: "independence-of-the-seas",
    portSlug: "miami",
    sailingDate: "2027-01-24",
    arrivalTime: "07:00",
    allAboardTime: "15:00",
    departureTime: "16:00",
  },
  {
    sailingId: "INDY-2027-01-24",
    sailingAliases: ["ID07MIA-1982128855", "independence-of-the-seas-20270124"],
    shipName: "Independence of the Seas",
    shipSlug: "independence-of-the-seas",
    portSlug: "nassau",
    sailingDate: "2027-01-25",
    arrivalTime: "07:00",
    allAboardTime: "15:15",
    departureTime: "16:00",
  },
  {
    sailingId: "INDY-2027-01-24",
    sailingAliases: ["ID07MIA-1982128855", "independence-of-the-seas-20270124"],
    shipName: "Independence of the Seas",
    shipSlug: "independence-of-the-seas",
    portSlug: "st-thomas",
    sailingDate: "2027-01-28",
    arrivalTime: "08:00",
    allAboardTime: "17:15",
    departureTime: "18:00",
  },
  // Symphony of the Seas — 7-Night Western Caribbean (WESTERN-2027-01-24 / WC07MIA-20270124)
  {
    sailingId: "WESTERN-2027-01-24",
    sailingAliases: ["WC07MIA-20270124", "symphony-of-the-seas-20270124"],
    shipName: "Symphony of the Seas",
    shipSlug: "symphony-of-the-seas",
    portSlug: "miami",
    sailingDate: "2027-01-24",
    arrivalTime: "07:00",
    allAboardTime: "15:30",
    departureTime: "16:30",
  },
  {
    sailingId: "WESTERN-2027-01-24",
    sailingAliases: ["WC07MIA-20270124", "symphony-of-the-seas-20270124"],
    shipName: "Symphony of the Seas",
    shipSlug: "symphony-of-the-seas",
    portSlug: "cozumel",
    sailingDate: "2027-01-26",
    arrivalTime: "07:00",
    allAboardTime: "16:15",
    departureTime: "17:00",
  },
  {
    sailingId: "WESTERN-2027-01-24",
    sailingAliases: ["WC07MIA-20270124", "symphony-of-the-seas-20270124"],
    shipName: "Symphony of the Seas",
    shipSlug: "symphony-of-the-seas",
    portSlug: "roatan",
    sailingDate: "2027-01-27",
    arrivalTime: "08:00",
    allAboardTime: "16:15",
    departureTime: "17:00",
  },
  {
    sailingId: "WESTERN-2027-01-24",
    sailingAliases: ["WC07MIA-20270124", "symphony-of-the-seas-20270124"],
    shipName: "Symphony of the Seas",
    shipSlug: "symphony-of-the-seas",
    portSlug: "grand-cayman",
    sailingDate: "2027-01-28",
    arrivalTime: "07:30",
    allAboardTime: "15:00",
    departureTime: "16:00",
  },
  // Carnival Liberty — New Orleans 7-Night Western Caribbean
  {
    sailingId: "carnival-carnival-liberty-20260719",
    sailingAliases: ["carnival-liberty-20260719", "CCL-LIBERTY-2026-07-19"],
    shipName: "Carnival Liberty",
    shipSlug: "carnival-liberty",
    portSlug: "new-orleans",
    sailingDate: "2026-07-19",
    arrivalTime: "07:00",
    allAboardTime: "14:30",
    departureTime: "15:30",
  },
  {
    sailingId: "carnival-carnival-liberty-20260719",
    sailingAliases: ["carnival-liberty-20260719", "CCL-LIBERTY-2026-07-19"],
    shipName: "Carnival Liberty",
    shipSlug: "carnival-liberty",
    portSlug: "cozumel",
    sailingDate: "2026-07-23",
    arrivalTime: "08:00",
    allAboardTime: "15:30",
    departureTime: "16:00",
  },
  {
    sailingId: "carnival-liberty-20270516",
    sailingAliases: ["carnival-carnival-liberty-20270516", "CCL-LIBERTY-2027-05-16"],
    shipName: "Carnival Liberty",
    shipSlug: "carnival-liberty",
    portSlug: "new-orleans",
    sailingDate: "2027-05-16",
    arrivalTime: "07:00",
    allAboardTime: "14:30",
    departureTime: "15:30",
  },
  // Carnival Breeze — New Orleans 5-Night Western Caribbean
  {
    sailingId: "carnival-breeze-20260725",
    sailingAliases: ["carnival-carnival-breeze-20260725"],
    shipName: "Carnival Breeze",
    shipSlug: "carnival-breeze",
    portSlug: "new-orleans",
    sailingDate: "2026-07-25",
    arrivalTime: "08:00",
    allAboardTime: "15:00",
    departureTime: "16:00",
  },
  // Carnival Paradise — Tampa 5-Night Western Caribbean
  {
    sailingId: "carnival-paradise-20260806",
    sailingAliases: ["carnival-carnival-paradise-20260806"],
    shipName: "Carnival Paradise",
    shipSlug: "carnival-paradise",
    portSlug: "tampa",
    sailingDate: "2026-08-06",
    arrivalTime: "08:00",
    allAboardTime: "15:00",
    departureTime: "16:00",
  },
  // Celebrity Edge — Seattle 7-Night Dawes Glacier
  {
    sailingId: "widgety-celebeg07a396-240726",
    sailingAliases: ["celebrity-edge-20260724", "celebrity-celebrity-edge-20260724"],
    shipName: "Celebrity Edge",
    shipSlug: "celebrity-edge",
    portSlug: "seattle",
    sailingDate: "2026-07-24",
    arrivalTime: "07:00",
    allAboardTime: "15:00",
    departureTime: "16:00",
  },
  {
    sailingId: "widgety-celebeg07a396-240726",
    sailingAliases: ["celebrity-edge-20260724", "celebrity-celebrity-edge-20260724"],
    shipName: "Celebrity Edge",
    shipSlug: "celebrity-edge",
    portSlug: "ketchikan",
    sailingDate: "2026-07-26",
    arrivalTime: "07:00",
    allAboardTime: "15:15",
    departureTime: "16:00",
  },
  {
    sailingId: "widgety-celebeg07a396-240726",
    sailingAliases: ["celebrity-edge-20260724", "celebrity-celebrity-edge-20260724"],
    shipName: "Celebrity Edge",
    shipSlug: "celebrity-edge",
    portSlug: "juneau",
    sailingDate: "2026-07-27",
    arrivalTime: "13:30",
    allAboardTime: "21:30",
    departureTime: "22:00",
  },
  {
    sailingId: "widgety-celebeg07a396-240726",
    sailingAliases: ["celebrity-edge-20260724", "celebrity-celebrity-edge-20260724"],
    shipName: "Celebrity Edge",
    shipSlug: "celebrity-edge",
    portSlug: "skagway",
    sailingDate: "2026-07-28",
    arrivalTime: "07:00",
    allAboardTime: "17:15",
    departureTime: "18:00",
  },
  // Norwegian Encore — Seattle 7-Night Alaska
  {
    sailingId: "ncl-norwegian-encore-20260510",
    sailingAliases: ["norwegian-encore-20260510"],
    shipName: "Norwegian Encore",
    shipSlug: "norwegian-encore",
    portSlug: "seattle",
    sailingDate: "2026-05-10",
    arrivalTime: "06:00",
    allAboardTime: "15:00",
    departureTime: "16:00",
  },
  {
    sailingId: "ncl-norwegian-encore-20260510",
    sailingAliases: ["norwegian-encore-20260510"],
    shipName: "Norwegian Encore",
    shipSlug: "norwegian-encore",
    portSlug: "juneau",
    sailingDate: "2026-05-12",
    arrivalTime: "14:30",
    allAboardTime: "22:30",
    departureTime: "23:00",
  },
  {
    sailingId: "ncl-norwegian-encore-20260510",
    sailingAliases: ["norwegian-encore-20260510"],
    shipName: "Norwegian Encore",
    shipSlug: "norwegian-encore",
    portSlug: "skagway",
    sailingDate: "2026-05-13",
    arrivalTime: "07:00",
    allAboardTime: "19:30",
    departureTime: "20:00",
  },
  {
    sailingId: "ncl-norwegian-encore-20260510",
    sailingAliases: ["norwegian-encore-20260510"],
    shipName: "Norwegian Encore",
    shipSlug: "norwegian-encore",
    portSlug: "ketchikan",
    sailingDate: "2026-05-15",
    arrivalTime: "07:00",
    allAboardTime: "12:45",
    departureTime: "13:15",
  },
  // Discovery Princess — Seattle 7-Night Inside Passage
  {
    sailingId: "princess-discovery-princess-20260510",
    sailingAliases: ["discovery-princess-20260510"],
    shipName: "Discovery Princess",
    shipSlug: "discovery-princess",
    portSlug: "seattle",
    sailingDate: "2026-05-10",
    arrivalTime: "07:00",
    allAboardTime: "14:00",
    departureTime: "15:00",
  },
  {
    sailingId: "princess-discovery-princess-20260510",
    sailingAliases: ["discovery-princess-20260510"],
    shipName: "Discovery Princess",
    shipSlug: "discovery-princess",
    portSlug: "ketchikan",
    sailingDate: "2026-05-12",
    arrivalTime: "06:30",
    allAboardTime: "14:30",
    departureTime: "15:00",
  },
  {
    sailingId: "princess-discovery-princess-20260510",
    sailingAliases: ["discovery-princess-20260510"],
    shipName: "Discovery Princess",
    shipSlug: "discovery-princess",
    portSlug: "juneau",
    sailingDate: "2026-05-13",
    arrivalTime: "12:30",
    allAboardTime: "21:30",
    departureTime: "22:00",
  },
  {
    sailingId: "princess-discovery-princess-20260510",
    sailingAliases: ["discovery-princess-20260510"],
    shipName: "Discovery Princess",
    shipSlug: "discovery-princess",
    portSlug: "skagway",
    sailingDate: "2026-05-14",
    arrivalTime: "06:00",
    allAboardTime: "16:30",
    departureTime: "17:00",
  },
  // Icon of the Seas — Miami 7-Night Western Caribbean
  {
    sailingId: "rccl-icon-of-the-seas-20260509",
    sailingAliases: ["icon-of-the-seas-20260509", "royal-caribbean-icon-of-the-seas-20260509"],
    shipName: "Icon of the Seas",
    shipSlug: "icon-of-the-seas",
    portSlug: "miami",
    sailingDate: "2026-05-09",
    arrivalTime: "06:00",
    allAboardTime: "15:30",
    departureTime: "16:30",
  },
  {
    sailingId: "rccl-icon-of-the-seas-20260509",
    sailingAliases: ["icon-of-the-seas-20260509", "royal-caribbean-icon-of-the-seas-20260509"],
    shipName: "Icon of the Seas",
    shipSlug: "icon-of-the-seas",
    portSlug: "cozumel",
    sailingDate: "2026-05-11",
    arrivalTime: "07:00",
    allAboardTime: "16:30",
    departureTime: "17:00",
  },
  {
    sailingId: "rccl-icon-of-the-seas-20260509",
    sailingAliases: ["icon-of-the-seas-20260509", "royal-caribbean-icon-of-the-seas-20260509"],
    shipName: "Icon of the Seas",
    shipSlug: "icon-of-the-seas",
    portSlug: "roatan",
    sailingDate: "2026-05-12",
    arrivalTime: "08:00",
    allAboardTime: "16:30",
    departureTime: "17:00",
  },
];

function normalizeShipSlug(input: string | undefined | null): string {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function resolveScheduledPortCall(params: {
  portSlug: string;
  sailingDate?: string | null;
  shipSlug?: string | null;
  sailingId?: string | null;
  shipArrivalTime?: string | null;
  shipAllAboardTime?: string | null;
  shipDepartureTime?: string | null;
  profile: CruisePortExcursionProfile;
}): {
  matchedPortCall: ScheduledCruisePortCall | null;
  shipArrivalTime: string;
  shipArrivalTimeLabel: string;
  arrivalTimeSource: PortDayWindowTimeSource;
  shipAllAboardTime: string;
  shipAllAboardTimeLabel: string;
  allAboardTimeSource: PortDayWindowTimeSource;
  shipDepartureTime: string | null;
  allAboardToShipDepartureMinutes: number | null;
  departureTimeSource: PortDayDepartureTimeSource;
  sailingDate: string;
  shipSlug: string | null;
  shipName: string | null;
  sailingId: string | null;
} {
  const { profile } = params;
  const rawSailingId = params.sailingId ? String(params.sailingId).trim() : null;
  const rawShipSlug = params.shipSlug ? normalizeShipSlug(params.shipSlug) : null;
  const rawDate = params.sailingDate ? String(params.sailingDate).trim() : null;
  const explicitArrivalMin = parseHhMm(params.shipArrivalTime);
  const explicitAllAboardMin = parseHhMm(params.shipAllAboardTime);
  const explicitDepartureMin = parseHhMm(params.shipDepartureTime);
  const hasExplicitDepartureParam =
    typeof params.shipDepartureTime === "string" && params.shipDepartureTime.trim().length > 0;

  let candidates = SCHEDULED_CRUISE_PORT_CALLS.filter(
    (c) => c.portSlug === profile.portSlug
  );

  if (rawSailingId) {
    const idLower = rawSailingId.toLowerCase();
    candidates = candidates.filter(
      (c) =>
        c.sailingId.toLowerCase() === idLower ||
        Boolean(c.sailingAliases?.some((a) => a.toLowerCase() === idLower))
    );
  }
  if (rawShipSlug) {
    candidates = candidates.filter(
      (c) =>
        c.shipSlug === rawShipSlug ||
        normalizeShipSlug(c.shipName) === rawShipSlug
    );
  }
  if (rawDate) {
    candidates = candidates.filter((c) => c.sailingDate === rawDate);
  }

  let matchedPortCall: ScheduledCruisePortCall | null = null;
  let isAmbiguousSchedule = false;

  if (rawSailingId || rawShipSlug || rawDate) {
    if (candidates.length === 1) {
      const candidate = candidates[0];
      // If only date was provided (no sailingId/shipSlug) and caller passed custom arrival/all-aboard that conflict with the candidate, do not assume that ship's schedule
      const arrivalConflict =
        !rawSailingId &&
        !rawShipSlug &&
        explicitArrivalMin !== null &&
        parseHhMm(candidate.arrivalTime) !== explicitArrivalMin;
      const allAboardConflict =
        !rawSailingId &&
        !rawShipSlug &&
        explicitAllAboardMin !== null &&
        parseHhMm(candidate.allAboardTime) !== explicitAllAboardMin;
      if (!arrivalConflict && !allAboardConflict) {
        matchedPortCall = candidate;
      }
    } else if (candidates.length > 1) {
      const distinctDepartures = new Set(candidates.map((c) => c.departureTime));
      const distinctAllAboards = new Set(candidates.map((c) => c.allAboardTime));
      if (distinctDepartures.size === 1 && distinctAllAboards.size === 1) {
        matchedPortCall = candidates[0];
      } else {
        isAmbiguousSchedule = true;
      }
    }
  }

  const arrivalTimeSource: PortDayWindowTimeSource =
    explicitArrivalMin !== null
      ? "request_param"
      : matchedPortCall?.arrivalTime
        ? "scheduled_port_call"
        : "port_estimate";
  const allAboardTimeSource: PortDayWindowTimeSource =
    explicitAllAboardMin !== null
      ? "request_param"
      : matchedPortCall?.allAboardTime
        ? "scheduled_port_call"
        : "port_estimate";

  const resolvedArrivalTime =
    explicitArrivalMin !== null
      ? formatHhMm(explicitArrivalMin)
      : matchedPortCall?.arrivalTime || profile.defaultShipArrivalTime;
  const resolvedAllAboardTime =
    explicitAllAboardMin !== null
      ? formatHhMm(explicitAllAboardMin)
      : matchedPortCall?.allAboardTime || profile.defaultShipAllAboardTime;
  const shipArrivalTimeLabel =
    arrivalTimeSource === "port_estimate"
      ? `${resolvedArrivalTime} (port estimate)`
      : resolvedArrivalTime;
  const shipAllAboardTimeLabel =
    allAboardTimeSource === "port_estimate"
      ? `${resolvedAllAboardTime} (port estimate)`
      : resolvedAllAboardTime;
  const resolvedSailingDate =
    rawDate || matchedPortCall?.sailingDate || profile.defaultSailingDate || "2027-07-15";

  const arrivalMin = parseHhMm(resolvedArrivalTime);
  const allAboardMin = parseHhMm(resolvedAllAboardTime);

  let shipDepartureTime: string | null = null;
  let allAboardToShipDepartureMinutes: number | null = null;
  let departureTimeSource: PortDayDepartureTimeSource = "missing";

  if (hasExplicitDepartureParam) {
    if (
      explicitDepartureMin !== null &&
      allAboardMin !== null &&
      arrivalMin !== null &&
      allAboardMin > arrivalMin &&
      explicitDepartureMin > allAboardMin &&
      explicitDepartureMin - allAboardMin <= 240
    ) {
      shipDepartureTime = formatHhMm(explicitDepartureMin);
      allAboardToShipDepartureMinutes = explicitDepartureMin - allAboardMin;
      departureTimeSource =
        matchedPortCall && matchedPortCall.departureTime === shipDepartureTime
          ? "scheduled_port_call"
          : "request_param";
    } else {
      shipDepartureTime = null;
      allAboardToShipDepartureMinutes = null;
      departureTimeSource = "invalid";
    }
  } else if (isAmbiguousSchedule) {
    shipDepartureTime = null;
    allAboardToShipDepartureMinutes = null;
    departureTimeSource = "ambiguous";
  } else if (matchedPortCall) {
    const scheduledDepMin = parseHhMm(matchedPortCall.departureTime);
    if (
      scheduledDepMin !== null &&
      allAboardMin !== null &&
      arrivalMin !== null &&
      allAboardMin > arrivalMin &&
      scheduledDepMin > allAboardMin &&
      scheduledDepMin - allAboardMin <= 240
    ) {
      shipDepartureTime = formatHhMm(scheduledDepMin);
      allAboardToShipDepartureMinutes = scheduledDepMin - allAboardMin;
      departureTimeSource = "scheduled_port_call";
    } else {
      shipDepartureTime = null;
      allAboardToShipDepartureMinutes = null;
      departureTimeSource = "invalid";
    }
  } else {
    shipDepartureTime = null;
    allAboardToShipDepartureMinutes = null;
    departureTimeSource = "missing";
  }

  return {
    matchedPortCall,
    shipArrivalTime: resolvedArrivalTime,
    shipArrivalTimeLabel,
    arrivalTimeSource,
    shipAllAboardTime: resolvedAllAboardTime,
    shipAllAboardTimeLabel,
    allAboardTimeSource,
    shipDepartureTime,
    allAboardToShipDepartureMinutes,
    departureTimeSource,
    sailingDate: resolvedSailingDate,
    shipSlug: matchedPortCall?.shipSlug || rawShipSlug || null,
    shipName: matchedPortCall?.shipName || null,
    sailingId: matchedPortCall?.sailingId || rawSailingId || null,
  };
}

export function evaluateTourPortDayTimeFit(params: {
  rec: DurableTourRecord;
  profile: CruisePortExcursionProfile;
  shipArrivalTime?: string;
  arrivalTimeSource?: PortDayWindowTimeSource;
  shipAllAboardTime?: string;
  allAboardTimeSource?: PortDayWindowTimeSource;
  shipDepartureTime?: string | null;
  departureTimeSource?: PortDayDepartureTimeSource;
  optionCode?: string | null;
  dockOrTender?: PortDayDockOrTender | string | null;
  tenderTravelMinutes?: number | null;
  tenderCutoffMinutes?: number | null;
}): PortDayTimeFitEvaluation {
  const { rec, profile } = params;
  const arrivalTime = params.shipArrivalTime || profile.defaultShipArrivalTime;
  const allAboardTime = params.shipAllAboardTime || profile.defaultShipAllAboardTime;
  const arrivalTimeSource: PortDayWindowTimeSource =
    params.arrivalTimeSource || (params.shipArrivalTime ? "request_param" : "port_estimate");
  const allAboardTimeSource: PortDayWindowTimeSource =
    params.allAboardTimeSource ||
    (params.shipAllAboardTime ? "request_param" : "port_estimate");
  const shipArrivalTimeLabel =
    arrivalTimeSource === "port_estimate"
      ? `${arrivalTime} (port estimate)`
      : arrivalTime;
  const shipAllAboardTimeLabel =
    allAboardTimeSource === "port_estimate"
      ? `${allAboardTime} (port estimate)`
      : allAboardTime;
  const isAllAboardPortEstimate = allAboardTimeSource === "port_estimate";
  const arrivalMin = parseHhMm(arrivalTime) ?? 480;
  const allAboardMin = parseHhMm(allAboardTime) ?? 1050;
  const earliestDisembarkMin = arrivalMin + 25;

  const rawDockOrTender = String(params.dockOrTender ?? profile.dockOrTender ?? "dock")
    .trim()
    .toLowerCase();
  const dockOrTender: PortDayDockOrTender =
    rawDockOrTender === "tender"
      ? "tender"
      : rawDockOrTender === "unknown" || rawDockOrTender === "missing"
        ? "unknown"
        : "dock";

  const tenderTravelMinutes: number | null =
    dockOrTender === "tender"
      ? params.tenderTravelMinutes !== undefined
        ? typeof params.tenderTravelMinutes === "number" &&
          Number.isFinite(params.tenderTravelMinutes) &&
          params.tenderTravelMinutes >= 0
          ? Math.round(params.tenderTravelMinutes)
          : null
        : typeof profile.defaultTenderTravelMinutes === "number" &&
            Number.isFinite(profile.defaultTenderTravelMinutes) &&
            profile.defaultTenderTravelMinutes >= 0
          ? Math.round(profile.defaultTenderTravelMinutes)
          : null
      : 0;

  const tenderCutoffMinutes: number | null =
    dockOrTender === "tender"
      ? params.tenderCutoffMinutes !== undefined
        ? typeof params.tenderCutoffMinutes === "number" &&
          Number.isFinite(params.tenderCutoffMinutes) &&
          params.tenderCutoffMinutes >= 0
          ? Math.round(params.tenderCutoffMinutes)
          : null
        : typeof profile.defaultTenderCutoffMinutes === "number" &&
            Number.isFinite(profile.defaultTenderCutoffMinutes) &&
            profile.defaultTenderCutoffMinutes >= 0
          ? Math.round(profile.defaultTenderCutoffMinutes)
          : null
      : 0;

  const lastTenderCutoffTime =
    dockOrTender === "tender" && tenderCutoffMinutes !== null
      ? formatHhMm(allAboardMin - tenderCutoffMinutes)
      : null;

  const rawDepartureMin = parseHhMm(params.shipDepartureTime);
  const hasValidShipDeparture =
    rawDepartureMin !== null &&
    allAboardMin > arrivalMin &&
    rawDepartureMin > allAboardMin &&
    rawDepartureMin - allAboardMin <= 240 &&
    params.departureTimeSource !== "ambiguous" &&
    params.departureTimeSource !== "invalid" &&
    params.departureTimeSource !== "missing";

  const validShipDepartureTime = hasValidShipDeparture ? formatHhMm(rawDepartureMin!) : null;
  const allAboardToShipDepartureMinutes = hasValidShipDeparture
    ? rawDepartureMin! - allAboardMin
    : null;
  const equivalentShipDepartureBufferMinutes =
    allAboardToShipDepartureMinutes !== null
      ? profile.requiredReturnBufferMinutes + allAboardToShipDepartureMinutes
      : null;

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
  if (dockOrTender === "unknown") {
    missingFields.push("tender");
  } else if (dockOrTender === "tender") {
    if (tenderTravelMinutes === null) {
      missingFields.push("tenderTravel");
    }
    if (tenderCutoffMinutes === null) {
      missingFields.push("tenderCutoff");
    }
  }

  const hasVerifiedTenderIfRequired =
    dockOrTender === "dock" ||
    (dockOrTender === "tender" &&
      tenderTravelMinutes !== null &&
      tenderCutoffMinutes !== null);

  const hasVerifiedReturnBuffer =
    hasVerifiedDeparture &&
    hasVerifiedCheckIn &&
    hasVerifiedMeetingPoint &&
    hasVerifiedTransfer &&
    Boolean(durationMinutes) &&
    hasVerifiedTenderIfRequired;

  if (!hasVerifiedReturnBuffer) {
    missingFields.push("returnBuffer");
  }

  const fullReturnTripMinutes =
    meetingToPierMinutes !== null && hasVerifiedTenderIfRequired
      ? meetingToPierMinutes +
        (dockOrTender === "tender"
          ? (tenderTravelMinutes ?? 0) + (tenderCutoffMinutes ?? 0)
          : 0)
      : null;

  const evidenceReviewPriority = evaluateEvidenceReviewPriority({
    rec,
    profile,
    missingFields,
  });

  if (
    missingFields.length > 0 ||
    !durationMinutes ||
    checkInCutoffMinutes === null ||
    pierToMeetingMinutes === null ||
    meetingToPierMinutes === null ||
    fullReturnTripMinutes === null
  ) {
    const effectiveMissingFields = isAllAboardPortEstimate
      ? [...missingFields, "allAboard"]
      : missingFields;
    const meetingContext = meetingPointName
      ? `Listed meeting point: ${meetingPointName}.`
      : "No verified operator meeting point on record.";
    const candidateDep = departures[0] || null;
    const candidateDepMin = candidateDep ? parseHhMm(candidateDep) : null;
    const partialReturnAtPier =
      candidateDepMin !== null && durationMinutes !== null && meetingToPierMinutes !== null
        ? formatHhMm(candidateDepMin + durationMinutes + meetingToPierMinutes)
        : null;
    const twoHourShortlist: PortDayTwoHourShortlistEvaluation = {
      qualifies: false,
      status: "needs_verification",
      statusLabel: "Needs verification",
      requiredBufferMinutes: TWO_HOUR_SHORTLIST_REQUIRED_BUFFER_MINUTES,
      evaluatedAfterDccFitChecks: true,
      exactOptionCode: selectedOptionCode,
      exactDepartureTime: candidateDep,
      confirmedAllAboardTime: isAllAboardPortEstimate ? null : allAboardTime,
      isConfirmedAllAboard: !isAllAboardPortEstimate,
      dockOrTender,
      meetingToPierMinutes,
      tenderTravelMinutes: dockOrTender === "tender" ? tenderTravelMinutes : 0,
      tenderCutoffMinutes: dockOrTender === "tender" ? tenderCutoffMinutes : 0,
      lastTenderCutoffTime,
      fullReturnTripMinutes,
      returnAtPierTime: partialReturnAtPier,
      returnEstimateTime: null,
      deadlineTime: shipAllAboardTimeLabel,
      effectiveDeadlineTime: lastTenderCutoffTime || allAboardTime,
      bufferBeforeAllAboardMinutes: null,
      missingFields: effectiveMissingFields,
      offerSeeOtherToursThatFit: true,
      seeOtherToursThatFitLabel: "See other tours that fit",
      summaryText: `Needs verification: missing ${effectiveMissingFields.join(
        ", "
      )}. Confirm all-aboard deadline and full return trip before relying on the 2+ hour buffer.`,
    };
    return {
      status: "needs_verification",
      statusLabel: "Needs verification",
      fitsSailing: false,
      selectedOptionCode,
      selectedOptionTitle,
      shipArrivalTime: arrivalTime,
      shipArrivalTimeLabel,
      arrivalTimeSource,
      shipAllAboardTime: allAboardTime,
      shipAllAboardTimeLabel,
      allAboardTimeSource,
      shipDepartureTime: validShipDepartureTime,
      departureTimeSource: params.departureTimeSource,
      allAboardToShipDepartureMinutes,
      earliestDisembarkationTime: formatHhMm(earliestDisembarkMin),
      selectedDepartureTime: candidateDep,
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
      dockOrTender,
      tenderTravelMinutes: dockOrTender === "tender" ? tenderTravelMinutes : 0,
      tenderCutoffMinutes: dockOrTender === "tender" ? tenderCutoffMinutes : 0,
      lastTenderCutoffTime,
      fullReturnTripMinutes,
      returnAtPierTime: partialReturnAtPier,
      returnEstimateTime: null,
      durationMinutes,
      tourEndTime: null,
      estimatedBackAtPierTime: null,
      requiredReturnBufferMinutes: profile.requiredReturnBufferMinutes,
      bufferBeforeAllAboardMinutes: null,
      bufferBeforeShipDepartureMinutes: null,
      returnBufferReconciliation: {
        requiredAllAboardBufferMinutes: profile.requiredReturnBufferMinutes,
        allAboardTimeSource,
        shipAllAboardTimeLabel,
        shipDepartureTime: validShipDepartureTime,
        allAboardToShipDepartureMinutes,
        equivalentShipDepartureBufferMinutes,
        bufferBeforeAllAboardMinutes: null,
        bufferBeforeShipDepartureMinutes: null,
        reconciliationNote: isAllAboardPortEstimate
          ? `All Aboard time (${allAboardTime}) is a port estimate because no traveler all-aboard deadline or matching sailing schedule was provided. Tour fit requires returning to the pier at least ${profile.requiredReturnBufferMinutes}m before All Aboard and remains Needs verification until the all-aboard deadline and tour logistics are confirmed.`
          : validShipDepartureTime !== null &&
              allAboardToShipDepartureMinutes !== null &&
              equivalentShipDepartureBufferMinutes !== null
            ? `Tour fit requires returning to the pier at least ${profile.requiredReturnBufferMinutes}m before All Aboard (${allAboardTime}), or ${equivalentShipDepartureBufferMinutes}m before scheduled ship departure (${validShipDepartureTime}, ${allAboardToShipDepartureMinutes}m after All Aboard).`
            : `Tour fit requires returning to the pier at least ${profile.requiredReturnBufferMinutes}m before All Aboard (${allAboardTime}).`,
      },
      hasVerifiedReturnBuffer: false,
      missingFields: effectiveMissingFields,
      reasonSummary: `Needs verification: missing verified ${effectiveMissingFields.join(
        ", "
      )}${
        isAllAboardPortEstimate ? ` (All Aboard ${allAboardTime} is a port estimate)` : ""
      }. ${meetingContext} Confirm exact product/option departure, check-in, pier transfers, and return buffer before booking for your sailing.`,
      evidenceReviewPriority,
      twoHourShortlist,
    };
  }

  const fittingDepartures: string[] = [];
  const tooLateDepartures: string[] = [];

  for (const dep of departures) {
    const depMin = parseHhMm(dep);
    if (depMin === null) continue;
    const leavePierMin = depMin - checkInCutoffMinutes - pierToMeetingMinutes;
    const returnCompleteMin = depMin + durationMinutes + fullReturnTripMinutes;
    const bufferMin = allAboardMin - returnCompleteMin;

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
  const returnAtPierMin = tourEndMin + meetingToPierMinutes;
  const backAtPierMin = tourEndMin + fullReturnTripMinutes;
  const returnAtPierTime = formatHhMm(returnAtPierMin);
  const returnEstimateTime = formatHhMm(backAtPierMin);
  const bufferBeforeAllAboard = allAboardMin - backAtPierMin;
  const bufferBeforeShipDeparture =
    hasValidShipDeparture && allAboardToShipDepartureMinutes !== null
      ? bufferBeforeAllAboard + allAboardToShipDepartureMinutes
      : null;

  if (isAllAboardPortEstimate) {
    const twoHourShortlist: PortDayTwoHourShortlistEvaluation = {
      qualifies: false,
      status: "needs_verification",
      statusLabel: "Needs verification",
      requiredBufferMinutes: TWO_HOUR_SHORTLIST_REQUIRED_BUFFER_MINUTES,
      evaluatedAfterDccFitChecks: true,
      exactOptionCode: selectedOptionCode,
      exactDepartureTime: selectedDep,
      confirmedAllAboardTime: null,
      isConfirmedAllAboard: false,
      dockOrTender,
      meetingToPierMinutes,
      tenderTravelMinutes: dockOrTender === "tender" ? tenderTravelMinutes : 0,
      tenderCutoffMinutes: dockOrTender === "tender" ? tenderCutoffMinutes : 0,
      lastTenderCutoffTime,
      fullReturnTripMinutes,
      returnAtPierTime,
      returnEstimateTime,
      deadlineTime: shipAllAboardTimeLabel,
      effectiveDeadlineTime: lastTenderCutoffTime || allAboardTime,
      bufferBeforeAllAboardMinutes: bufferBeforeAllAboard,
      missingFields: ["allAboard"],
      offerSeeOtherToursThatFit: true,
      seeOtherToursThatFitLabel: "See other tours that fit",
      summaryText: `Needs verification: All Aboard (${allAboardTime}) is a port estimate. Return estimate ${returnEstimateTime} (${bufferBeforeAllAboard}m before ${allAboardTime} port estimate). Confirm your ship's all-aboard deadline to verify the 2+ hour buffer.`,
    };
    return {
      status: "needs_verification",
      statusLabel: "Needs verification",
      fitsSailing: false,
      selectedOptionCode,
      selectedOptionTitle,
      shipArrivalTime: arrivalTime,
      shipArrivalTimeLabel,
      arrivalTimeSource,
      shipAllAboardTime: allAboardTime,
      shipAllAboardTimeLabel,
      allAboardTimeSource,
      shipDepartureTime: validShipDepartureTime,
      departureTimeSource: params.departureTimeSource,
      allAboardToShipDepartureMinutes,
      earliestDisembarkationTime: formatHhMm(earliestDisembarkMin),
      selectedDepartureTime: selectedDep,
      availableDepartureTimes: departures,
      fittingDepartureTimes: [],
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
      dockOrTender,
      tenderTravelMinutes: dockOrTender === "tender" ? tenderTravelMinutes : 0,
      tenderCutoffMinutes: dockOrTender === "tender" ? tenderCutoffMinutes : 0,
      lastTenderCutoffTime,
      fullReturnTripMinutes,
      returnAtPierTime,
      returnEstimateTime,
      durationMinutes,
      tourEndTime: formatHhMm(tourEndMin),
      estimatedBackAtPierTime: returnEstimateTime,
      requiredReturnBufferMinutes: profile.requiredReturnBufferMinutes,
      bufferBeforeAllAboardMinutes: bufferBeforeAllAboard,
      bufferBeforeShipDepartureMinutes: bufferBeforeShipDeparture,
      returnBufferReconciliation: {
        requiredAllAboardBufferMinutes: profile.requiredReturnBufferMinutes,
        allAboardTimeSource,
        shipAllAboardTimeLabel,
        shipDepartureTime: validShipDepartureTime,
        allAboardToShipDepartureMinutes,
        equivalentShipDepartureBufferMinutes,
        bufferBeforeAllAboardMinutes: bufferBeforeAllAboard,
        bufferBeforeShipDepartureMinutes: bufferBeforeShipDeparture,
        reconciliationNote: `All Aboard time (${allAboardTime}) is a port estimate because no traveler all-aboard deadline or matching sailing schedule was provided. This tour returns to the pier at ${returnEstimateTime} (${bufferBeforeAllAboard}m before the ${allAboardTime} port estimate; port requires ${
          profile.requiredReturnBufferMinutes
        }m before All Aboard). Sailing fit is Needs verification until the traveler supplies the all-aboard deadline or the sailing schedule provides it.`,
      },
      hasVerifiedReturnBuffer: true,
      missingFields: ["allAboard"],
      reasonSummary: `Needs verification: All Aboard time (${allAboardTime}) is a port estimate. Departs ${selectedDep} (option ${
        selectedOptionCode || "default"
      }, check in by ${formatHhMm(
        checkInMin
      )} at ${meetingPointName}), ${roundTripTransferMinutes}m round-trip transfer, returns to pier at ${returnEstimateTime} (${bufferBeforeAllAboard}m before ${allAboardTime} port estimate; requires +${
        profile.requiredReturnBufferMinutes
      }m before confirmed all-aboard). Supply your all-aboard deadline or select a sailing schedule to confirm sailing fit.`,
      evidenceReviewPriority,
      twoHourShortlist,
    };
  }

  const fits = fittingDepartures.includes(selectedDep);
  const qualifiesFor2hShortlist =
    fits && bufferBeforeAllAboard >= TWO_HOUR_SHORTLIST_REQUIRED_BUFFER_MINUTES;
  const shortlistStatus: PortDayTwoHourShortlistStatus = qualifiesFor2hShortlist
    ? "estimated_back_2h_plus"
    : fits
      ? "other_tour_that_fits"
      : "runs_too_late";
  const shortlistStatusLabel: PortDayTwoHourShortlistEvaluation["statusLabel"] =
    qualifiesFor2hShortlist
      ? "Estimated back 2+ hours before all aboard"
      : fits
        ? "See other tours that fit"
        : "Runs too late";
  const tenderSummaryClause =
    dockOrTender === "tender"
      ? ` (includes ${meetingToPierMinutes}m transfer to tender pier at ${returnAtPierTime} + ${tenderTravelMinutes}m tender + ${tenderCutoffMinutes}m tender cutoff; last tender ${lastTenderCutoffTime})`
      : "";
  const twoHourShortlist: PortDayTwoHourShortlistEvaluation = {
    qualifies: qualifiesFor2hShortlist,
    status: shortlistStatus,
    statusLabel: shortlistStatusLabel,
    requiredBufferMinutes: TWO_HOUR_SHORTLIST_REQUIRED_BUFFER_MINUTES,
    evaluatedAfterDccFitChecks: true,
    exactOptionCode: selectedOptionCode,
    exactDepartureTime: selectedDep,
    confirmedAllAboardTime: allAboardTime,
    isConfirmedAllAboard: true,
    dockOrTender,
    meetingToPierMinutes,
    tenderTravelMinutes: dockOrTender === "tender" ? tenderTravelMinutes : 0,
    tenderCutoffMinutes: dockOrTender === "tender" ? tenderCutoffMinutes : 0,
    lastTenderCutoffTime,
    fullReturnTripMinutes,
    returnAtPierTime,
    returnEstimateTime,
    deadlineTime: allAboardTime,
    effectiveDeadlineTime: lastTenderCutoffTime || allAboardTime,
    bufferBeforeAllAboardMinutes: bufferBeforeAllAboard,
    missingFields: [],
    offerSeeOtherToursThatFit: true,
    seeOtherToursThatFitLabel: "See other tours that fit",
    summaryText: qualifiesFor2hShortlist
      ? `Estimated back 2+ hours before all aboard: Return estimate ${returnEstimateTime}${tenderSummaryClause} · All-aboard deadline ${allAboardTime} · Buffer +${bufferBeforeAllAboard}m (requires +120m for 2-hour shortlist).`
      : fits
        ? `Fits sailing (+${bufferBeforeAllAboard}m buffer vs +${profile.requiredReturnBufferMinutes}m required), below 2-hour shortlist (+120m): Return estimate ${returnEstimateTime}${tenderSummaryClause} · All-aboard deadline ${allAboardTime} · Buffer +${bufferBeforeAllAboard}m. Available under See other tours that fit.`
        : `Runs too late: Return estimate ${returnEstimateTime}${tenderSummaryClause} · All-aboard deadline ${allAboardTime} · Buffer ${bufferBeforeAllAboard >= 0 ? `+${bufferBeforeAllAboard}m` : `${bufferBeforeAllAboard}m`} (requires +${profile.requiredReturnBufferMinutes}m).`,
  };

  return {
    status: fits ? "fits" : "runs_too_late",
    statusLabel: fits ? "Fits my sailing" : "Runs too late",
    fitsSailing: fits,
    selectedOptionCode,
    selectedOptionTitle,
    shipArrivalTime: arrivalTime,
    shipArrivalTimeLabel,
    arrivalTimeSource,
    shipAllAboardTime: allAboardTime,
    shipAllAboardTimeLabel,
    allAboardTimeSource,
    shipDepartureTime: validShipDepartureTime,
    departureTimeSource: params.departureTimeSource,
    allAboardToShipDepartureMinutes,
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
    dockOrTender,
    tenderTravelMinutes: dockOrTender === "tender" ? tenderTravelMinutes : 0,
    tenderCutoffMinutes: dockOrTender === "tender" ? tenderCutoffMinutes : 0,
    lastTenderCutoffTime,
    fullReturnTripMinutes,
    returnAtPierTime,
    returnEstimateTime,
    durationMinutes,
    tourEndTime: formatHhMm(tourEndMin),
    estimatedBackAtPierTime: returnEstimateTime,
    requiredReturnBufferMinutes: profile.requiredReturnBufferMinutes,
    bufferBeforeAllAboardMinutes: bufferBeforeAllAboard,
    bufferBeforeShipDepartureMinutes: bufferBeforeShipDeparture,
    returnBufferReconciliation: {
      requiredAllAboardBufferMinutes: profile.requiredReturnBufferMinutes,
      allAboardTimeSource,
      shipAllAboardTimeLabel,
      shipDepartureTime: validShipDepartureTime,
      allAboardToShipDepartureMinutes,
      equivalentShipDepartureBufferMinutes,
      bufferBeforeAllAboardMinutes: bufferBeforeAllAboard,
      bufferBeforeShipDepartureMinutes: bufferBeforeShipDeparture,
      reconciliationNote:
        validShipDepartureTime !== null &&
        allAboardToShipDepartureMinutes !== null &&
        bufferBeforeShipDeparture !== null
          ? `Tour fit requires returning to the pier at least ${profile.requiredReturnBufferMinutes}m before All Aboard (${allAboardTime}). With scheduled ship departure at ${validShipDepartureTime} (${allAboardToShipDepartureMinutes}m after All Aboard), this tour returns at ${returnEstimateTime} with ${bufferBeforeAllAboard}m before All Aboard and ${bufferBeforeShipDeparture}m before ship departure.`
          : `Tour fit requires returning to the pier at least ${profile.requiredReturnBufferMinutes}m before All Aboard (${allAboardTime}). This tour returns at ${returnEstimateTime} with ${bufferBeforeAllAboard}m before All Aboard.`,
    },
    hasVerifiedReturnBuffer: true,
    missingFields: [],
    reasonSummary: fits
      ? validShipDepartureTime !== null && bufferBeforeShipDeparture !== null
        ? `Departs ${selectedDep} (option ${selectedOptionCode || "default"}, check in by ${formatHhMm(
            checkInMin
          )} at ${meetingPointName}), ${roundTripTransferMinutes}m round-trip transfer${tenderSummaryClause}, returns at ${returnEstimateTime} with +${bufferBeforeAllAboard}m before ${allAboardTime} all-aboard and +${bufferBeforeShipDeparture}m before ${validShipDepartureTime} ship departure (requires +${
            profile.requiredReturnBufferMinutes
          }m before all-aboard).`
        : `Departs ${selectedDep} (option ${selectedOptionCode || "default"}, check in by ${formatHhMm(
            checkInMin
          )} at ${meetingPointName}), ${roundTripTransferMinutes}m round-trip transfer${tenderSummaryClause}, returns at ${returnEstimateTime} with +${bufferBeforeAllAboard}m before ${allAboardTime} all-aboard (requires +${
            profile.requiredReturnBufferMinutes
          }m before all-aboard).`
      : validShipDepartureTime !== null && bufferBeforeShipDeparture !== null
        ? `Departure ${selectedDep} returns at ${returnEstimateTime}${tenderSummaryClause} (${bufferBeforeAllAboard}m before ${allAboardTime} all-aboard and ${bufferBeforeShipDeparture}m before ${validShipDepartureTime} ship departure; requires +${
            profile.requiredReturnBufferMinutes
          }m before all-aboard).`
        : `Departure ${selectedDep} returns at ${returnEstimateTime}${tenderSummaryClause} (${bufferBeforeAllAboard}m before ${allAboardTime} all-aboard; requires +${
            profile.requiredReturnBufferMinutes
          }m before all-aboard).`,
    evidenceReviewPriority,
    twoHourShortlist,
  };
}

export function buildExactExcursionHandoffLinks(params: {
  rec: DurableTourRecord;
  profile: CruisePortExcursionProfile;
  optionCode: string | null;
  sailingDate: string;
  shipArrivalTime: string;
  shipAllAboardTime: string;
  partySize?: number;
  ship?: string | null;
  cruiseSailDate?: string | null;
  originatingSite?: string | null;
  surface?: string | null;
}): PortDayExcursionHandoffLinks {
  const { rec, profile, optionCode, sailingDate, shipArrivalTime, shipAllAboardTime } = params;
  const code = rec.providerProductCode || rec.tourId;
  const isJuneau466119P3 = code.toUpperCase() === "466119P3";

  const rawOrigin = String(params.originatingSite || "").toLowerCase();
  const rawSurface = String(params.surface || "").toLowerCase();
  const isCruisePromenade =
    rawOrigin.includes("cruisepromenade") ||
    rawSurface.includes("cruisepromenade") ||
    rawSurface.startsWith("cp_");
  const resolvedOriginatingSite = isCruisePromenade
    ? "cruisepromenade.com"
    : "destinationcommandcenter.com";
  const resolvedSurface =
    params.surface?.trim() ||
    (isCruisePromenade ? "cruisepromenade_port_day" : "dcc_port_day_catalog");
  const tagPrefix = isCruisePromenade ? "cp_port_day" : "dcc_port_day";

  const handoffTag = `${tagPrefix}_${profile.portSlug}_${code}${
    optionCode ? `_${optionCode}` : ""
  }`;

  const rawUrl =
    rec.bookingUrl ||
    `https://www.viator.com/searchResults/all?text=${encodeURIComponent(
      `${profile.portName} ${rec.title}`
    )}`;
  const attributedUrl =
    rec.primaryProvider === "viator"
      ? appendViatorAttribution(rawUrl, {
          campaign: handoffTag,
          pid: "P00306962",
          mcid: "42383",
        })
      : rawUrl;

  const dccTrackedHref = `/go/out?u=${encodeURIComponent(
    attributedUrl
  )}&originatingSite=${encodeURIComponent(
    resolvedOriginatingSite
  )}&surface=${encodeURIComponent(resolvedSurface)}&port=${encodeURIComponent(
    profile.portSlug
  )}&product=${encodeURIComponent(code)}${
    optionCode ? `&option=${encodeURIComponent(optionCode)}` : ""
  }&date=${encodeURIComponent(sailingDate)}&trackingTag=${encodeURIComponent(
    handoffTag
  )}`;

  const cpHandoffParams = new URLSearchParams({
    port: profile.portSlug,
    port_date: sailingDate,
    party_size: String(Math.max(1, params.partySize || 2)),
  });
  if (params.ship?.trim()) {
    cpHandoffParams.set("ship", params.ship.trim());
  }
  if (params.cruiseSailDate?.trim()) {
    cpHandoffParams.set("sailing_date", params.cruiseSailDate.trim());
  } else if (params.ship?.trim() && sailingDate) {
    cpHandoffParams.set("sailing_date", sailingDate);
  }
  if (code) {
    cpHandoffParams.set("tour_code", code);
  }
  const cruisePromenadeTrackedHref = `/go/dcc-to-cruise-promenade?${cpHandoffParams.toString()}`;

  return {
    exactProductUrl: attributedUrl,
    dccTrackedHref,
    cruisePromenadeTrackedHref,
    provider: rec.primaryProvider === "operator_direct" ? "operator_direct" : "viator",
    productCode: rec.providerProductCode || null,
    optionCode,
    handoffTrackingTag: handoffTag,
    originatingSite: resolvedOriginatingSite,
    approvedAffiliateAccount:
      rec.primaryProvider === "operator_direct" ? "operator_direct" : "P00306962",
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
  retailOnly?: boolean;
  originatingSite?: string | null;
  surface?: string | null;
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
    originatingSite: params.originatingSite,
    surface: params.surface,
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
        const retailPrice = exactItem?.totalPrice?.price?.recommendedRetailPrice;
        const rawTotalRetail =
          retailPrice ??
          (params.retailOnly ? null : exactItem?.totalPrice?.price?.partnerTotalPrice ?? null);
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
          ...(typeof retailPrice === "number" && Number.isFinite(retailPrice) && retailPrice >= 0
            ? { providerRetailTotal: retailPrice }
            : {}),
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
  shipDepartureTime?: string | null;
  sailingDate?: string;
  shipSlug?: string | null;
  sailingId?: string | null;
  partySize?: number;
  ship?: string;
  cruiseSailDate?: string;
  dockOrTender?: PortDayDockOrTender | string | null;
  tenderTravelMinutes?: number | null;
  tenderCutoffMinutes?: number | null;
  limit?: number;
  offset?: number;
  sortBy?: "recommended" | "rating_desc" | "price_asc" | "duration_asc";
  search?: string;
  originatingSite?: string | null;
  surface?: string | null;
}): Promise<PortDayExcursionCatalogResponse | null> {
  const profile = resolveCruisePortExcursionProfile(params.portSlug);
  if (!profile) return null;

  const viewMode: PortDayExcursionViewMode = params.viewMode || "browse_all";
  const category: PortDayExcursionCategoryFilter = params.category || "all";
  const portCallResolution = resolveScheduledPortCall({
    portSlug: profile.portSlug,
    sailingDate: params.sailingDate || null,
    shipSlug: params.shipSlug || params.ship || null,
    sailingId: params.sailingId || null,
    shipArrivalTime: params.shipArrivalTime || null,
    shipAllAboardTime: params.shipAllAboardTime || null,
    shipDepartureTime: params.shipDepartureTime ?? null,
    profile,
  });

  const shipArrivalTime = portCallResolution.shipArrivalTime;
  const shipAllAboardTime = portCallResolution.shipAllAboardTime;
  const shipDepartureTime = portCallResolution.shipDepartureTime;
  const allAboardToShipDepartureMinutes =
    portCallResolution.allAboardToShipDepartureMinutes;
  const departureTimeSource = portCallResolution.departureTimeSource;
  const sailingDate = portCallResolution.sailingDate;
  const partySize = Math.max(1, params.partySize || 2);
  const limit = Math.max(1, Math.min(100, params.limit || 12));
  const offset = Math.max(0, params.offset || 0);
  const sortBy: DurableCatalogSortBy = params.sortBy || "recommended";

  const isShortlist2hMode = viewMode === "shortlist_2h";
  const isFitsSailingMode = viewMode === "fits_sailing" || isShortlist2hMode;

  const [sqlRes, liveProviderCounts, sharedHandoffLedgerSummary] = await Promise.all([
    queryDurableTourCatalog({
      destinationSlug: profile.destinationSlug,
      category: category === "all" ? undefined : category,
      searchQuery: params.search,
      requireVerifiedCruiseLogistics: isFitsSailingMode,
      verifiedTimingOnly: isFitsSailingMode ? true : undefined,
      sortBy,
      limit: isFitsSailingMode ? 500 : limit,
      offset: isFitsSailingMode ? 0 : offset,
    }),
    getActiveDestinationProviderCounts(profile.destinationSlug),
    getSharedHandoffLedgerSummary({
      originatingSite: params.originatingSite || null,
      portSlug: profile.portSlug,
    }),
  ]);

  const evaluatedCards: PortDayExcursionCard[] = sqlRes.records.map((rec) => {
    const timeFit = evaluateTourPortDayTimeFit({
      rec,
      profile,
      shipArrivalTime,
      arrivalTimeSource: portCallResolution.arrivalTimeSource,
      shipAllAboardTime,
      allAboardTimeSource: portCallResolution.allAboardTimeSource,
      shipDepartureTime,
      departureTimeSource,
      dockOrTender: params.dockOrTender,
      tenderTravelMinutes: params.tenderTravelMinutes,
      tenderCutoffMinutes: params.tenderCutoffMinutes,
    });

    const chosenOptionCode = timeFit.selectedOptionCode;

    const handoff = buildExactExcursionHandoffLinks({
      rec,
      profile,
      optionCode: chosenOptionCode,
      sailingDate,
      partySize,
      ship: params.ship,
      cruiseSailDate: params.cruiseSailDate,
      shipArrivalTime,
      shipAllAboardTime,
      originatingSite: params.originatingSite,
      surface: params.surface,
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
        `${rec.title} — shore excursion in ${profile.portName} evaluated against ${shipArrivalTime}–${portCallResolution.shipAllAboardTimeLabel} port window.`,
      provider:
        rec.primaryProvider === "operator_direct" || rec.primaryProvider === "fareharbor"
          ? "operator_direct"
          : "viator",
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

  const allFittingCards = evaluatedCards.filter(
    (c) => c.timeFit.status === "fits" && c.timeFit.fitsSailing
  );
  const allShortlist2hCards = allFittingCards.filter(
    (c) => c.timeFit.twoHourShortlist?.qualifies === true
  );
  const otherFittingCards = allFittingCards.filter(
    (c) => c.timeFit.twoHourShortlist?.qualifies !== true
  );

  const filteredSourceCards = isShortlist2hMode
    ? allShortlist2hCards
    : isFitsSailingMode
      ? allFittingCards
      : evaluatedCards;

  const visibleTours = isFitsSailingMode
    ? filteredSourceCards.slice(offset, offset + limit)
    : evaluatedCards;

  const effectiveTotalMatched = isFitsSailingMode
    ? filteredSourceCards.length
    : sqlRes.totalMatched;
  const effectiveHasMore = isFitsSailingMode
    ? offset + visibleTours.length < filteredSourceCards.length
    : sqlRes.hasMore;
  const effectiveNextOffset = isFitsSailingMode
    ? effectiveHasMore
      ? offset + visibleTours.length
      : null
    : sqlRes.nextOffset;

  const fallbackCounts = AUTHORITATIVE_PORT_PROVIDER_COUNTS[profile.portSlug] || {
    viator: sqlRes.totalMatched,
    operator_direct: evaluatedCards.filter((c) => c.provider === "operator_direct").length,
    bokun_pending: 0,
    authorizedSourceTotal: sqlRes.totalMatched,
    reconciledWithAuthorizedSource: true,
  };

  const activeViatorCount = liveProviderCounts
    ? liveProviderCounts.viator
    : fallbackCounts.viator;
  const activeOperatorDirectCount = liveProviderCounts
    ? liveProviderCounts.operator_direct
    : fallbackCounts.operator_direct;
  const totalImportedForPort = activeViatorCount + activeOperatorDirectCount;
  const authorizedSourceTotal = liveProviderCounts
    ? liveProviderCounts.authorizedSourceTotal
    : fallbackCounts.authorizedSourceTotal;
  const reconciledWithAuthorizedSource = liveProviderCounts
    ? liveProviderCounts.reconciledWithAuthorizedSource
    : fallbackCounts.reconciledWithAuthorizedSource;

  const coveragePercent =
    authorizedSourceTotal > 0
      ? Math.min(
          100,
          Math.round((totalImportedForPort / authorizedSourceTotal) * 1000) / 10
        )
      : 100;

  const summarySourceCards = isFitsSailingMode ? visibleTours : evaluatedCards;
  const needsVerificationCount = summarySourceCards.filter(
    (c) =>
      c.timeFit.status === "needs_verification" ||
      c.timeFit.status === "missing_operator_info"
  ).length;
  const allNeedsVerificationCount = evaluatedCards.filter(
    (c) =>
      c.timeFit.status === "needs_verification" ||
      c.timeFit.status === "missing_operator_info"
  ).length;

  const reconciliationBreakdown =
    profile.portSlug === "new-orleans"
      ? {
          activeSqlTotal: totalImportedForPort,
          activeViatorInSql: activeViatorCount,
          activeOperatorDirectInSql: activeOperatorDirectCount,
          legacyStaticSummaryCount: 111,
          legacyStaticSummaryExplanation:
            "Legacy static summary (111) counted the Nov 5 initial seed of 100 Viator products (startOffset 1..100) plus 11 Welcome to New Orleans (WNO) FareHarbor/direct entries (of which 1 is active in dcc_tour_catalog: dcc:tour:fh:jeanlafitteswamptour:763318, 3 are quarantined legacy fixtures excluded by QUARANTINED_TOUR_IDS, and 7 are WNO FareHarbor checkout-referral links in app/new-orleans/tours/pageConfig.ts).",
          previousCronCheckpointCount: 351,
          previousCronCheckpointExplanation:
            "At the 2026-11-08T08:00:41Z resumable catalog-refresh cron checkpoint (nextStartOffset: 351), active SQL inventory in dcc_tour_catalog reached 351 matches (350 active Viator products + 1 active FareHarbor product).",
          currentActiveInventoryExplanation: `Live SQL inventory in dcc_tour_catalog has ${totalImportedForPort} active products (${activeViatorCount} active Viator products + ${activeOperatorDirectCount} active FareHarbor/direct product out of ${authorizedSourceTotal} authorized source products; coverage ${coveragePercent}%).`,
        }
      : {
          activeSqlTotal: totalImportedForPort,
          activeViatorInSql: activeViatorCount,
          activeOperatorDirectInSql: activeOperatorDirectCount,
          currentActiveInventoryExplanation: `Live SQL inventory in dcc_tour_catalog has ${totalImportedForPort} active products (${activeViatorCount} Viator + ${activeOperatorDirectCount} operator_direct out of ${authorizedSourceTotal} authorized source products; coverage ${coveragePercent}%).`,
        };

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    port: profile,
    sailingWindow: {
      shipArrivalTime,
      shipArrivalTimeLabel: portCallResolution.shipArrivalTimeLabel,
      arrivalTimeSource: portCallResolution.arrivalTimeSource,
      shipAllAboardTime,
      shipAllAboardTimeLabel: portCallResolution.shipAllAboardTimeLabel,
      allAboardTimeSource: portCallResolution.allAboardTimeSource,
      shipDepartureTime,
      allAboardToShipDepartureMinutes,
      departureTimeSource,
      sailingDate,
      partySize,
      shipSlug: portCallResolution.shipSlug,
      shipName: portCallResolution.shipName,
      sailingId: portCallResolution.sailingId,
    },
    viewMode,
    category,
    pagination: {
      limit,
      offset,
      page: Math.floor(offset / limit) + 1,
      totalMatchedInSql: effectiveTotalMatched,
      ...(isFitsSailingMode
        ? {
            totalFittingSailing: allFittingCards.length,
            verifiedTimingCandidatesInSql: sqlRes.totalMatched,
          }
        : {}),
      rowsLoadedIntoApp: visibleTours.length,
      fullCatalogLoadedIntoApp: sqlRes.fullCatalogLoadedIntoApp,
      executedInSql: sqlRes.executedInSql,
      sqlQueryMs: sqlRes.sqlQueryMs ?? 0,
      hasMore: effectiveHasMore,
      nextOffset: effectiveNextOffset,
      storageSource: sqlRes.storageSource,
    },
    providerCounts: {
      viator: activeViatorCount,
      operator_direct: activeOperatorDirectCount,
      bokun_pending: fallbackCounts.bokun_pending,
      total: totalImportedForPort,
      reconciledWithAuthorizedSource,
      authorizedSourceTotal,
      coveragePercent,
      coverageStatus: reconciledWithAuthorizedSource
        ? "complete"
        : "sampled_provider_catalog",
      source: liveProviderCounts ? liveProviderCounts.source : "static_fallback",
      nextStartOffset: liveProviderCounts?.nextStartOffset ?? null,
      checkpointUpdatedAt: liveProviderCounts?.checkpointUpdatedAt ?? null,
      reconciliationBreakdown,
      importerCheckpoint: {
        destinationSearchPaginationModel: "start_and_count",
        incrementalFeedPaginationModel: "nextCursor",
        batchSizeCount: 100,
        lastStartOffset: Math.max(1, activeViatorCount - 99),
        nextStartOffset: reconciledWithAuthorizedSource
          ? null
          : (liveProviderCounts?.nextStartOffset ?? activeViatorCount + 1),
        providerTotalCount: authorizedSourceTotal,
        incrementalUpdateCursor: null,
        checkpointStatus: reconciledWithAuthorizedSource
          ? "complete"
          : "bounded_batch_paused",
        note: reconciledWithAuthorizedSource
          ? `Full destination search catalog imported via bounded start+count batches (${activeViatorCount}/${authorizedSourceTotal} Viator products).`
          : `Bounded 100-item batch checkpoint saved (nextStartOffset=${liveProviderCounts?.nextStartOffset ?? activeViatorCount + 1} of ${authorizedSourceTotal}); partial count reflects bounded batch checkpointing rather than an importer timeout.`,
      },
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
    sharedHandoffLedgerSummary,
    shortlistSummary: {
      defaultRecommendationLabel: "Estimated back 2+ hours before all aboard",
      requiredBufferMinutes: TWO_HOUR_SHORTLIST_REQUIRED_BUFFER_MINUTES,
      shortlist2hCountOnPage: allShortlist2hCards.length,
      otherFittingCountOnPage: otherFittingCards.length,
      totalFittingSailingCountOnPage: allFittingCards.length,
      needsVerificationCountOnPage: allNeedsVerificationCount,
      offerSeeOtherToursThatFit: true,
      seeOtherToursThatFitLabel: "See other tours that fit",
      seeOtherToursThatFitViewMode: "fits_sailing",
    },
    summary: {
      totalEvaluatedOnPage: summarySourceCards.length,
      shortlist2hCountOnPage: allShortlist2hCards.length,
      otherFittingCountOnPage: otherFittingCards.length,
      fitsSailingCountOnPage: summarySourceCards.filter((c) => c.timeFit.status === "fits")
        .length,
      runsTooLateCountOnPage: summarySourceCards.filter(
        (c) => c.timeFit.status === "runs_too_late"
      ).length,
      needsVerificationCountOnPage: needsVerificationCount,
      missingOperatorInfoCountOnPage: needsVerificationCount,
      liveAvailabilitySupportedCountOnPage: summarySourceCards.filter(
        (c) => c.seatAvailability.supportsLiveCheck
      ).length,
      withinOneMileReviewQueueCountOnPage: summarySourceCards.filter(
        (c) => c.timeFit.evidenceReviewPriority?.withinOneMileOfBerth
      ).length,
    },
    tours: visibleTours,
  };
}

export async function buildAutomatedPortEvidenceReviewQueue(params: {
  portSlug: string;
  limit?: number;
}): Promise<{
  portSlug: string;
  portName: string;
  berthCoordinates: { lat: number; lng: number };
  spatialMethod: "haversine_sql_and_js_no_postgis";
  totalCandidatesEvaluated: number;
  withinOneMileCount: number;
  queue: Array<{
    tourId: string;
    productCode: string | null;
    title: string;
    priorityTier: PortDayEvidenceReviewPriority["priorityTier"];
    priorityRank: 1 | 2 | 3 | 4;
    withinOneMileOfBerth: boolean;
    distanceFromBerthMiles: number | null;
    missingFields: string[];
    fitsSailing: boolean;
    status: PortDayTimeFitStatus;
  }>;
} | null> {
  const profile = resolveCruisePortExcursionProfile(params.portSlug);
  if (!profile) return null;
  const berthCoordinates = resolvePortBerthCoordinates(profile);
  const res = await queryPortDayExcursionCatalog({
    portSlug: profile.portSlug,
    viewMode: "browse_all",
    limit: params.limit || 100,
    offset: 0,
  });
  if (!res) return null;

  const queue = res.tours
    .map((card) => {
      const prio = card.timeFit.evidenceReviewPriority!;
      return {
        tourId: card.tourId,
        productCode: card.productCode,
        title: card.title,
        priorityTier: prio.priorityTier,
        priorityRank: prio.priorityRank,
        withinOneMileOfBerth: prio.withinOneMileOfBerth,
        distanceFromBerthMiles: prio.distanceFromBerthMiles,
        missingFields: card.timeFit.missingFields,
        fitsSailing: card.timeFit.fitsSailing,
        status: card.timeFit.status,
      };
    })
    .sort((a, b) => {
      if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank;
      const distA = a.distanceFromBerthMiles ?? Number.POSITIVE_INFINITY;
      const distB = b.distanceFromBerthMiles ?? Number.POSITIVE_INFINITY;
      return distA - distB;
    });

  return {
    portSlug: profile.portSlug,
    portName: profile.portName,
    berthCoordinates,
    spatialMethod: "haversine_sql_and_js_no_postgis",
    totalCandidatesEvaluated: queue.length,
    withinOneMileCount: queue.filter((q) => q.withinOneMileOfBerth).length,
    queue,
  };
}

export interface PreparePortDayTourCheckoutParams {
  portSlug?: string | null;
  productCode?: string | null;
  optionCode?: string | null;
  date?: string | null;
  departureTime?: string | null;
  partySize?: number | null;
  travelerApprovedCheckout?: boolean | null;
  idempotencyKey?: string | null;
  sailingId?: string | null;
  shipSlug?: string | null;
  ship?: string | null;
  shipArrivalTime?: string | null;
  shipAllAboardTime?: string | null;
  shipDepartureTime?: string | null;
  callerClientId?: string | null;
  originatingSite?: string | null;
  surface?: string | null;
  isQaTraffic?: boolean | null;
  simulateTimeout?: boolean | null;
}

export interface PreparePortDayTourCheckoutResult {
  ok: boolean;
  checkoutPrepared: boolean;
  errorCode?:
    | "TRAVELER_APPROVAL_REQUIRED"
    | "IDEMPOTENCY_KEY_REQUIRED"
    | "UNSUPPORTED_CHECKOUT_PRODUCT"
    | "INVALID_CHECKOUT_SELECTION"
    | "SAILING_FIT_NOT_VERIFIED"
    | "AVAILABILITY_NOT_CONFIRMED"
    | "IDEMPOTENCY_CONFLICT"
    | "DURABLE_HANDOFF_UNAVAILABLE";
  message: string;
  handoffId: string | null;
  clickId: string | null;
  outboundAffiliateUrl: string | null;
  duplicateSubmission: boolean;
  idempotencyKey: string | null;
  durableRecordCount: number;
  authenticatedCallerClientId: string;
  serverResolvedProvider: {
    provider: "viator";
    providerAccount: string;
    mcid: string;
    canonicalProductUrl: string;
    campaignParam: string | null;
  } | null;
  validatedSelection: {
    portSlug: string;
    productCode: string;
    optionCode: string;
    optionTitle: string;
    date: string;
    departureTime: string;
    partySize: number;
    pickupLocation: string;
  } | null;
  pricing: {
    priceBasis: "per_person" | "per_group" | "unknown";
    currency: string | null;
    unitPriceUsd: number | null;
    totalPriceUsd: number | null;
    timeChecked: string | null;
  } | null;
  sailingWindow: PortDayExcursionCatalogResponse["sailingWindow"] | null;
  timeFit: PortDayTimeFitEvaluation | null;
  seatAvailability: PortDaySeatAvailabilityEvaluation | null;
  viatorCheckoutFieldCarryover: {
    carriedInAffiliateUrlQuery: string[];
    preboundByViatorWebLanding: string[];
    requiresTravelerConfirmationInViatorWidget: string[];
  } | null;
}

export async function preparePortDayTourCheckout(
  params: PreparePortDayTourCheckoutParams
): Promise<PreparePortDayTourCheckoutResult> {
  const callerClientId = params.callerClientId?.trim() || "";
  const originatingSite = params.originatingSite || "destinationcommandcenter.com";
  const surface = params.surface || "dcc_mcp_prepare_tour_checkout";
  const idempotencyKey = params.idempotencyKey?.trim() || null;

  const reject = (
    errorCode: NonNullable<PreparePortDayTourCheckoutResult["errorCode"]>,
    message: string,
    details?: Pick<Partial<PreparePortDayTourCheckoutResult>, "sailingWindow" | "timeFit" | "seatAvailability">,
  ): PreparePortDayTourCheckoutResult => ({
    ok: false,
    checkoutPrepared: false,
    errorCode,
    message,
    handoffId: null,
    clickId: null,
    outboundAffiliateUrl: null,
    duplicateSubmission: false,
    idempotencyKey,
    durableRecordCount: 0,
    authenticatedCallerClientId: callerClientId,
    serverResolvedProvider: null,
    validatedSelection: null,
    pricing: null,
    sailingWindow: null,
    timeFit: null,
    seatAvailability: null,
    viatorCheckoutFieldCarryover: null,
    ...details,
  });

  if (params.travelerApprovedCheckout !== true) {
    return reject("TRAVELER_APPROVAL_REQUIRED", "Traveler approval is required before preparing checkout.");
  }
  if (!idempotencyKey || idempotencyKey.length > 128) {
    return reject("IDEMPOTENCY_KEY_REQUIRED", "Provide an idempotency key of at most 128 characters.");
  }

  const port = params.portSlug?.trim().toLowerCase();
  const productCode = params.productCode?.trim().toUpperCase();
  const optionCode = params.optionCode?.trim().toUpperCase();
  const date = params.date?.trim() || "";
  const dateAtUtcMidnight = new Date(`${date}T00:00:00Z`);
  const departureMinutes = parseHhMm(params.departureTime);
  const departureTime = departureMinutes === null ? null : formatHhMm(departureMinutes);
  const partySize = params.partySize;
  if (port !== "new-orleans" || productCode !== "15200P6") {
    return reject("UNSUPPORTED_CHECKOUT_PRODUCT", "Checkout is available for New Orleans 15200P6 / TG10.");
  }
  if (
    optionCode !== "TG10" || departureTime !== "08:00" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(dateAtUtcMidnight.getTime()) ||
    dateAtUtcMidnight.toISOString().slice(0, 10) !== date ||
    typeof partySize !== "number" || !Number.isInteger(partySize) || partySize < 1 || partySize > 15
  ) {
    return reject("INVALID_CHECKOUT_SELECTION", "Provide TG10, a valid port date, the 08:00 departure, and 1 to 15 adult travelers.");
  }

  const profile = resolveCruisePortExcursionProfile(port)!;
  const rec = await getDurableTourByIdOrAlias(productCode);
  if (!rec?.active || rec.primaryProvider !== "viator" || rec.providerProductCode !== productCode || !rec.commissionAuthorized) {
    return reject("UNSUPPORTED_CHECKOUT_PRODUCT", "The authorized Viator product is unavailable in the catalog.");
  }

  const window = resolveScheduledPortCall({
    portSlug: port,
    sailingDate: date,
    shipSlug: params.shipSlug || params.ship,
    sailingId: params.sailingId,
    shipArrivalTime: params.shipArrivalTime,
    shipAllAboardTime: params.shipAllAboardTime,
    shipDepartureTime: params.shipDepartureTime,
    profile,
  });
  const sailingWindow: PortDayExcursionCatalogResponse["sailingWindow"] = {
    shipArrivalTime: window.shipArrivalTime,
    shipArrivalTimeLabel: window.shipArrivalTimeLabel,
    arrivalTimeSource: window.arrivalTimeSource,
    shipAllAboardTime: window.shipAllAboardTime,
    shipAllAboardTimeLabel: window.shipAllAboardTimeLabel,
    allAboardTimeSource: window.allAboardTimeSource,
    shipDepartureTime: window.shipDepartureTime,
    allAboardToShipDepartureMinutes: window.allAboardToShipDepartureMinutes,
    departureTimeSource: window.departureTimeSource,
    sailingDate: date,
    partySize,
    shipSlug: window.shipSlug,
    shipName: window.shipName,
    sailingId: window.sailingId,
  };

  const timeFit = evaluateTourPortDayTimeFit({ rec, profile, ...sailingWindow, optionCode });
  const hasMatchedSailing = Boolean(window.matchedPortCall && (params.sailingId || params.shipSlug || params.ship));
  const hasSuppliedTimes = parseHhMm(params.shipArrivalTime) !== null && parseHhMm(params.shipAllAboardTime) !== null;
  if (
    (!hasMatchedSailing && !hasSuppliedTimes) ||
    timeFit.status !== "fits" || timeFit.selectedOptionCode !== optionCode ||
    timeFit.selectedDepartureTime !== departureTime
  ) {
    return reject("SAILING_FIT_NOT_VERIFIED", "This departure requires a verified sailing window and time fit.", { sailingWindow, timeFit });
  }
  if (evaluateDeparturePastStatus({ date, departureTime, timeZone: rec.timeZone }).isPast) {
    return reject("INVALID_CHECKOUT_SELECTION", "Choose a future departure.");
  }

  const isQaTraffic = isCommercialQaTraffic({ isQaTraffic: params.isQaTraffic, idempotencyKey, callerClientId });
  const key = { originatingSite, callerClientId, idempotencyKey };
  const requestHash = createHash("sha256").update(JSON.stringify({
    port, productCode, optionCode, date, departureTime, partySize, isQaTraffic,
    sailingId: sailingWindow.sailingId,
    shipArrivalTime: sailingWindow.shipArrivalTime,
    shipAllAboardTime: sailingWindow.shipAllAboardTime,
    shipDepartureTime: sailingWindow.shipDepartureTime,
  })).digest("hex");

  type Snapshot = Pick<PreparePortDayTourCheckoutResult, "validatedSelection" | "pricing" | "sailingWindow" | "timeFit" | "seatAvailability">;
  async function replayOrReturn(handoff: CommercialHandoffRecord): Promise<PreparePortDayTourCheckoutResult> {
    const saved = handoff.metadata.portDayCheckoutSelection as { requestHash: string; snapshot: Snapshot } | undefined;
    if (saved?.requestHash !== requestHash) {
      return reject("IDEMPOTENCY_CONFLICT", "Use a new idempotency key for a changed selection.");
    }
    await recordMachineFunnelEvent({
      stage: "checkout_handoff",
      ...key,
      portSlug: port,
      productCode,
      optionCode,
      intendedDate: date,
      departureTime,
      partySize,
      handoffId: handoff.handoffId,
      clickId: handoff.clickId,
      isQaTraffic,
      metadata: saved.snapshot.pricing,
    });

    const affiliateUrl = new URL(handoff.outboundAffiliateUrl);
    return {
      ...saved.snapshot,
      ok: true,
      checkoutPrepared: true,
      message: "The selected departure fits and Viator confirmed availability at the time shown. Select the saved date, option, departure and travelers on Viator.",
      handoffId: handoff.handoffId,
      clickId: handoff.clickId,
      outboundAffiliateUrl: handoff.outboundAffiliateUrl,
      duplicateSubmission: handoff.duplicateSubmission === true,
      idempotencyKey,
      durableRecordCount: 1,
      authenticatedCallerClientId: callerClientId,
      serverResolvedProvider: {
        provider: "viator",
        providerAccount: handoff.providerAccount,
        mcid: affiliateUrl.searchParams.get("mcid") || "",
        canonicalProductUrl: handoff.destinationUrl,
        campaignParam: handoff.attributionParameterValue,
      },
      viatorCheckoutFieldCarryover: {
        carriedInAffiliateUrlQuery: ["pid", "mcid", "medium", "campaign", "click_id", "startDate", "numTravelers"],
        preboundByViatorWebLanding: ["Exact Viator product 15200P6"],
        requiresTravelerConfirmationInViatorWidget: ["date", "optionCode", "departureTime", "partySize", "pickup point"],
      },
    };
  }

  try {
    const existing = await getDurableCommercialHandoff(key);
    if (existing) return await replayOrReturn({ ...existing, duplicateSubmission: true });

    const seatAvailability = await verifyLiveExcursionAvailability({
      portSlug: port, tourId: rec.tourId, productCode, optionCode, date, partySize, departureTime,
      simulateTimeout: params.simulateTimeout === true,
      retailOnly: true,
      originatingSite, surface,
    });
    await recordMachineFunnelEvent({
      stage: "availability_check", ...key, portSlug: port, productCode, optionCode,
      intendedDate: date, departureTime, partySize, isQaTraffic,
      simulateTimeout: params.simulateTimeout,
      metadata: { surface, availabilityStatus: seatAvailability.status, checkoutRecheck: true },
    });

    if (
      seatAvailability.status !== "live_verified" || seatAvailability.available !== true ||
      seatAvailability.providerStatus !== "live_confirmed" || seatAvailability.checkedDate !== date ||
      seatAvailability.selectedOptionCode !== optionCode || seatAvailability.selectedDepartureTime !== departureTime ||
      seatAvailability.checkedPartySize !== partySize
    ) {
      return reject("AVAILABILITY_NOT_CONFIRMED", "Viator did not confirm availability for this exact selection.", {
        sailingWindow, timeFit, seatAvailability,
      });
    }

    const affiliate = getViatorPublicConfig();
    const canonicalProductUrl = "https://www.viator.com/tours/New-Orleans/New-Orleans-Swamp-Tour-Boat-Adventure-With-Pickup/d675-15200P6";
    const destinationUrl = new URL(canonicalProductUrl);
    destinationUrl.searchParams.set("mcid", affiliate.mcid);
    const retailTotal = seatAvailability.providerRetailTotal ?? null;
    const pricing: PreparePortDayTourCheckoutResult["pricing"] = {
      priceBasis: retailTotal === null ? "unknown" : "per_person",
      currency: seatAvailability.currency,
      unitPriceUsd: retailTotal === null ? null : Number((retailTotal / partySize).toFixed(2)),
      totalPriceUsd: retailTotal,
      timeChecked: seatAvailability.liveCheckedAt,
    };
    const snapshot: Snapshot = {
      validatedSelection: {
        portSlug: port, productCode, optionCode, date, departureTime, partySize,
        optionTitle: timeFit.selectedOptionTitle || optionCode,
        pickupLocation: timeFit.meetingPointName || "",
      },
      pricing, sailingWindow, timeFit, seatAvailability,
    };
    const handoff = await createCommercialHandoff({
      ...key,
      requireDurableRecord: true,
      targetSite: "viator.com",
      provider: "viator",
      providerAccount: affiliate.pid,
      viatorProductCode: productCode,
      productCode,
      productTitle: rec.title,
      productDestinationUrl: destinationUrl.toString(),
      campaign: "dcc_nola_tour",
      intendedDate: date,
      intendedOption: optionCode,
      intendedDepartureTime: departureTime,
      partySize,
      partyDetails: { adults: partySize, totalGuests: partySize, portDate: date },
      shipArrivalTime: sailingWindow.shipArrivalTime,
      shipDepartureTime: sailingWindow.shipDepartureTime,
      quotedPriceAmount: pricing.totalPriceUsd,
      quotedPriceCurrency: pricing.currency,
      metadata: {
        portSlug: port,
        surface,
        isQaTraffic,
        originatingPage: "/ports/new-orleans",
        portDayCheckoutSelection: { requestHash, snapshot },
      },
    });
    return await replayOrReturn(handoff);
  } catch (error) {
    if (error instanceof CommercialHandoffStorageError) {
      return reject("DURABLE_HANDOFF_UNAVAILABLE", error.message);
    }
    throw error;
  }

}

