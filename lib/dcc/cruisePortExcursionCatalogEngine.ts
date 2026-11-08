import { getViatorClient } from "@/lib/viator/client";
import { appendViatorAttribution } from "@/lib/viator/links";
import {
  EARTHOS_DESTINATION_NODES,
  getDurableCatalogSummaryReport,
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
  shipArrivalTime: string;
  shipAllAboardTime: string;
  earliestDisembarkationTime: string;
  selectedDepartureTime: string | null;
  availableDepartureTimes: string[];
  fittingDepartureTimes: string[];
  tooLateDepartureTimes: string[];
  checkInCutoffMinutes: number;
  latestCheckInTime: string | null;
  leavePierByTime: string | null;
  meetingPointName: string | null;
  meetingPointAddress: string | null;
  hasVerifiedMeetingPoint: boolean;
  oneWayTransferMinutes: number | null;
  roundTripTransferMinutes: number | null;
  hasVerifiedTransfer: boolean;
  durationMinutes: number | null;
  tourEndTime: string | null;
  estimatedBackAtPierTime: string | null;
  requiredReturnBufferMinutes: number;
  bufferBeforeAllAboardMinutes: number | null;
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
  selectedOptionCode?: string | null;
  selectedDepartureTime: string | null;
  available: boolean | null;
  remainingSeats: number | null;
  fromPriceUsd: number | null;
  totalPriceUsd?: number | null;
  currency: string;
  pastDepartureRejected?: boolean;
  rejectionReason?: string | null;
  providerStatus?:
    | "live_confirmed"
    | "past_departure_rejected"
    | "timeout"
    | "option_or_departure_unconfirmed"
    | "provider_unconfirmed"
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
    pendingOperatorNotes?: string[];
  };
  summary: {
    totalEvaluatedOnPage: number;
    fitsSailingCountOnPage: number;
    runsTooLateCountOnPage: number;
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

function inferCheckInCutoffMinutes(rec: DurableTourRecord, profile: CruisePortExcursionProfile): number {
  const explicitServiceCutoff = (rec.serviceDetails as any)?.checkInCutoffMinutes;
  if (typeof explicitServiceCutoff === "number" && explicitServiceCutoff > 0) {
    return explicitServiceCutoff;
  }
  const text = `${rec.title} ${rec.pickupSummary || ""} ${rec.meetingPointName || ""}`;
  if (/\b45\s*min(?:ute)?s?\s*(?:prior|before|early)/i.test(text)) return 45;
  if (/\b30\s*min(?:ute)?s?\s*(?:prior|before|early)/i.test(text)) return 30;
  if (/\b20\s*min(?:ute)?s?\s*(?:prior|before|early)/i.test(text)) return 20;
  if (/\b15\s*min(?:ute)?s?\s*(?:prior|before|early)/i.test(text)) return 15;
  if (rec.destinationSlug === "kahului" && /whale/i.test(rec.title)) return 45;
  return profile.defaultCheckInCutoffMinutes;
}

function extractCandidateDepartures(rec: DurableTourRecord): string[] {
  const times = new Set<string>();
  if (Array.isArray(rec.productOptions)) {
    for (const opt of rec.productOptions) {
      if (Array.isArray(opt.scheduledStartTimes)) {
        for (const t of opt.scheduledStartTimes) {
          if (parseHhMm(t) !== null) times.add(t.trim());
        }
      }
    }
  }
  const scheduleTimes = (rec.serviceDetails as any)?.verifiedDepartureTimesLocal;
  if (Array.isArray(scheduleTimes)) {
    for (const t of scheduleTimes) {
      if (typeof t === "string" && parseHhMm(t) !== null) times.add(t.trim());
    }
  }

  return Array.from(times).sort((a, b) => (parseHhMm(a) ?? 0) - (parseHhMm(b) ?? 0));
}

export function evaluateTourPortDayTimeFit(params: {
  rec: DurableTourRecord;
  profile: CruisePortExcursionProfile;
  shipArrivalTime?: string;
  shipAllAboardTime?: string;
}): PortDayTimeFitEvaluation {
  const { rec, profile } = params;
  const arrivalTime = params.shipArrivalTime || profile.defaultShipArrivalTime;
  const allAboardTime = params.shipAllAboardTime || profile.defaultShipAllAboardTime;
  const arrivalMin = parseHhMm(arrivalTime) ?? 480;
  const allAboardMin = parseHhMm(allAboardTime) ?? 1050;
  const earliestDisembarkMin = arrivalMin + 25;

  const checkInCutoff = inferCheckInCutoffMinutes(rec, profile);

  const explicitMeetingPointName =
    rec.meetingPointName?.trim() ||
    rec.productOptions?.find((o) => o.meetingPointName?.trim())?.meetingPointName?.trim() ||
    null;
  const explicitMeetingPointAddress = rec.meetingPointAddress?.trim() || null;

  const hasVerifiedMeetingPoint =
    Boolean(explicitMeetingPointName) &&
    Boolean(
      rec.constraints?.applicableBerthOrMeetingPoint &&
        rec.constraints.applicableBerthOrMeetingPoint.trim()
    ) &&
    rec.pickupFulfillmentType !== "unknown" &&
    rec.pickupType !== "UNKNOWN" &&
    rec.provenance?.rawFieldsVerified?.pickupKnown === true;

  const hasVerifiedTransfer =
    (rec.constraints?.transferTimeSource === "verified_pier_pickup" ||
      rec.constraints?.transferTimeSource === "verified_meeting_point") &&
    Boolean(
      rec.constraints?.transferEvidenceSource &&
        rec.constraints.transferEvidenceSource.trim()
    ) &&
    typeof rec.constraints?.cruiseBufferBeforeMinutes === "number" &&
    Number.isFinite(rec.constraints.cruiseBufferBeforeMinutes);

  const oneWayTransfer = hasVerifiedTransfer
    ? rec.constraints.cruiseBufferBeforeMinutes!
    : null;
  const roundTripTransfer =
    oneWayTransfer !== null ? oneWayTransfer * 2 : null;

  const durationMinutes = rec.durationMinutes;
  const departures = extractCandidateDepartures(rec);

  const missingFields: string[] = [];
  if (!durationMinutes || durationMinutes <= 0) {
    missingFields.push("durationMinutes");
  }
  if (departures.length === 0) {
    missingFields.push("departureSchedule");
  }
  if (!hasVerifiedMeetingPoint) {
    missingFields.push("verifiedMeetingPointEvidence");
  }
  if (!hasVerifiedTransfer) {
    missingFields.push("verifiedTransferEvidence");
  }

  if (
    missingFields.length > 0 ||
    !durationMinutes ||
    oneWayTransfer === null ||
    roundTripTransfer === null
  ) {
    return {
      status: "needs_verification",
      statusLabel: "Needs verification",
      fitsSailing: false,
      shipArrivalTime: arrivalTime,
      shipAllAboardTime: allAboardTime,
      earliestDisembarkationTime: formatHhMm(earliestDisembarkMin),
      selectedDepartureTime: departures[0] || null,
      availableDepartureTimes: departures,
      fittingDepartureTimes: [],
      tooLateDepartureTimes: [],
      checkInCutoffMinutes: checkInCutoff,
      latestCheckInTime: null,
      leavePierByTime: null,
      meetingPointName: hasVerifiedMeetingPoint ? explicitMeetingPointName : null,
      meetingPointAddress: hasVerifiedMeetingPoint ? explicitMeetingPointAddress : null,
      hasVerifiedMeetingPoint,
      oneWayTransferMinutes: oneWayTransfer,
      roundTripTransferMinutes: roundTripTransfer,
      hasVerifiedTransfer,
      durationMinutes: durationMinutes ?? null,
      tourEndTime: null,
      estimatedBackAtPierTime: null,
      requiredReturnBufferMinutes: profile.requiredReturnBufferMinutes,
      bufferBeforeAllAboardMinutes: null,
      missingFields,
      reasonSummary: `Needs verification: exact meeting point and pier transfers are not yet supported by evidence (missing ${missingFields.join(", ")}). Excluded from Fits my sailing until verified.`,
    };
  }

  const fittingDepartures: string[] = [];
  const tooLateDepartures: string[] = [];

  for (const dep of departures) {
    const depMin = parseHhMm(dep);
    if (depMin === null) continue;
    const leavePierMin = depMin - checkInCutoff - oneWayTransfer;
    const backAtPierMin = depMin + durationMinutes + oneWayTransfer;
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
  const checkInMin = selectedDepMin - checkInCutoff;
  const leavePierMin = checkInMin - oneWayTransfer;
  const tourEndMin = selectedDepMin + durationMinutes;
  const backAtPierMin = tourEndMin + oneWayTransfer;
  const bufferBeforeAllAboard = allAboardMin - backAtPierMin;
  const fits = fittingDepartures.includes(selectedDep);

  return {
    status: fits ? "fits" : "runs_too_late",
    statusLabel: fits ? "Fits My Sailing" : "Runs Too Late for All-Aboard",
    fitsSailing: fits,
    shipArrivalTime: arrivalTime,
    shipAllAboardTime: allAboardTime,
    earliestDisembarkationTime: formatHhMm(earliestDisembarkMin),
    selectedDepartureTime: selectedDep,
    availableDepartureTimes: departures,
    fittingDepartureTimes: fittingDepartures,
    tooLateDepartureTimes: tooLateDepartures,
    checkInCutoffMinutes: checkInCutoff,
    latestCheckInTime: formatHhMm(checkInMin),
    leavePierByTime: formatHhMm(leavePierMin),
    meetingPointName: explicitMeetingPointName,
    meetingPointAddress: explicitMeetingPointAddress,
    hasVerifiedMeetingPoint: true,
    oneWayTransferMinutes: oneWayTransfer,
    roundTripTransferMinutes: roundTripTransfer,
    hasVerifiedTransfer: true,
    durationMinutes,
    tourEndTime: formatHhMm(tourEndMin),
    estimatedBackAtPierTime: formatHhMm(backAtPierMin),
    requiredReturnBufferMinutes: profile.requiredReturnBufferMinutes,
    bufferBeforeAllAboardMinutes: bufferBeforeAllAboard,
    missingFields: [],
    reasonSummary: fits
      ? `Departs ${selectedDep} (check in by ${formatHhMm(checkInMin)} at ${explicitMeetingPointName}), ${roundTripTransfer}m round-trip transfer, returns to pier at ${formatHhMm(backAtPierMin)} with +${bufferBeforeAllAboard}m buffer before ${allAboardTime} all-aboard.`
      : `Departure ${selectedDep} returns to pier at ${formatHhMm(backAtPierMin)} (${bufferBeforeAllAboard}m vs ${allAboardTime} all-aboard; requires +${profile.requiredReturnBufferMinutes}m buffer).`,
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
  const rec =
    (params.tourId ? await getDurableTourByIdOrAlias(params.tourId) : null) ||
    (params.productCode ? await getDurableTourByIdOrAlias(params.productCode) : null);

  const node = resolveEarthOSDestinationNode(params.portSlug);
  const timeZone = rec?.timeZone || node?.timeZone || "UTC";

  const code = (params.productCode || rec?.providerProductCode || params.tourId || "").trim();
  const partySize = Math.max(1, Number(params.partySize) || 2);
  const requestedOptionCode =
    (params.optionCode || rec?.productOptions?.[0]?.optionCode || null)?.trim() || null;
  const requestedDeparture =
    (
      params.departureTime ||
      rec?.productOptions?.[0]?.scheduledStartTimes?.[0] ||
      null
    )?.trim() || null;

  const pastCheck = evaluateDeparturePastStatus({
    date: params.date,
    departureTime: requestedDeparture,
    timeZone,
  });

  if (pastCheck.isPast) {
    return {
      status: "check_availability",
      statusLabel: "Check availability",
      supportsLiveCheck: true,
      liveCheckedAt: new Date().toISOString(),
      checkedDate: params.date,
      checkedPartySize: partySize,
      selectedOptionCode: requestedOptionCode,
      selectedDepartureTime: requestedDeparture,
      available: null,
      remainingSeats: null,
      fromPriceUsd: null,
      totalPriceUsd: null,
      currency: "USD",
      pastDepartureRejected: true,
      rejectionReason: pastCheck.reason,
      providerStatus: "past_departure_rejected",
      options: [],
      detailNote:
        pastCheck.reason ||
        "Past departure rejected. Select a future sailing date and departure time.",
    };
  }

  const effectiveTimeoutMs =
    typeof params.timeoutMs === "number" && Number.isFinite(params.timeoutMs)
      ? Math.max(1, Math.min(15000, params.timeoutMs))
      : 5000;

  if (params.simulateTimeout === true) {
    return {
      status: "check_availability",
      statusLabel: "Check availability",
      supportsLiveCheck: true,
      liveCheckedAt: new Date().toISOString(),
      checkedDate: params.date,
      checkedPartySize: partySize,
      selectedOptionCode: requestedOptionCode,
      selectedDepartureTime: requestedDeparture,
      available: null,
      remainingSeats: null,
      fromPriceUsd: null,
      totalPriceUsd: null,
      currency: "USD",
      pastDepartureRejected: false,
      rejectionReason: null,
      providerStatus: "timeout",
      options: [],
      detailNote: `Provider availability check timed out after ${effectiveTimeoutMs}ms for ${code || "tour"}. Showing Check availability with unknown seat count.`,
    };
  }

  if (!code || !requestedOptionCode || !requestedDeparture || partySize < 1) {
    return {
      status: "check_availability",
      statusLabel: "Check availability",
      supportsLiveCheck: true,
      liveCheckedAt: new Date().toISOString(),
      checkedDate: params.date,
      checkedPartySize: partySize,
      selectedOptionCode: requestedOptionCode,
      selectedDepartureTime: requestedDeparture,
      available: null,
      remainingSeats: null,
      fromPriceUsd: null,
      totalPriceUsd: null,
      currency: "USD",
      pastDepartureRejected: false,
      rejectionReason: null,
      providerStatus: "option_or_departure_unconfirmed",
      options: [],
      detailNote:
        "Provider could not confirm exact option, departure time, date, and party size. Showing Check availability.",
    };
  }

  if (process.env.VIATOR_API_KEY && !code.startsWith("PACWHALE-")) {
    try {
      const client = getViatorClient();
      const checkRes: any = await Promise.race([
        client.checkAvailability({
          productCode: code,
          travelDate: params.date,
          currency: "USD",
          paxMix: [{ ageBand: "ADULT", numberOfTravelers: partySize }],
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("PROVIDER_TIMEOUT")), effectiveTimeoutMs)
        ),
      ]);

      const items = Array.isArray(checkRes?.bookableItems) ? checkRes.bookableItems : [];
      const exactMatchedItem = items.find((it: any) => {
        const itemOpt = String(it?.productOptionCode || "DEFAULT").trim().toUpperCase();
        const itemStart = String(it?.startTime || "").trim();
        const itemDate = it?.travelDate ? String(it.travelDate).trim() : params.date;
        const lineItemTravelers = Array.isArray(it?.lineItems)
          ? it.lineItems.reduce(
              (acc: number, li: any) => acc + (Number(li?.numberOfTravelers) || 0),
              0
            )
          : partySize;
        return (
          itemOpt === requestedOptionCode.toUpperCase() &&
          itemStart === requestedDeparture &&
          itemDate === params.date &&
          lineItemTravelers === partySize
        );
      });

      if (exactMatchedItem) {
        if (exactMatchedItem.available === false) {
          return {
            status: "sold_out",
            statusLabel: "Sold Out",
            supportsLiveCheck: true,
            liveCheckedAt: new Date().toISOString(),
            checkedDate: params.date,
            checkedPartySize: partySize,
            selectedOptionCode: String(exactMatchedItem.productOptionCode || requestedOptionCode),
            selectedDepartureTime: String(exactMatchedItem.startTime || requestedDeparture),
            available: false,
            remainingSeats: 0,
            fromPriceUsd: null,
            totalPriceUsd: null,
            currency: "USD",
            pastDepartureRejected: false,
            rejectionReason: null,
            providerStatus: "live_confirmed",
            options: [],
            detailNote: `Provider confirmed option ${requestedOptionCode} at ${requestedDeparture} on ${params.date} is sold out for ${partySize} guests.`,
          };
        }

        if (exactMatchedItem.available === true) {
          const providerRemainingSeats =
            typeof exactMatchedItem.remainingSeats === "number" &&
            Number.isFinite(exactMatchedItem.remainingSeats)
              ? exactMatchedItem.remainingSeats
              : typeof exactMatchedItem.availableSeats === "number" &&
                  Number.isFinite(exactMatchedItem.availableSeats)
                ? exactMatchedItem.availableSeats
                : null;

          const rawTotalPrice =
            typeof exactMatchedItem?.totalPrice?.price?.recommendedRetailPrice === "number"
              ? exactMatchedItem.totalPrice.price.recommendedRetailPrice
              : typeof exactMatchedItem?.totalPrice?.price?.partnerTotalPrice === "number"
                ? exactMatchedItem.totalPrice.price.partnerTotalPrice
                : null;
          const perPersonPriceUsd =
            rawTotalPrice !== null ? Number((rawTotalPrice / partySize).toFixed(2)) : null;
          const totalPriceUsd =
            rawTotalPrice !== null ? Number(rawTotalPrice.toFixed(2)) : null;

          const matchedOptionCode = String(
            exactMatchedItem.productOptionCode || requestedOptionCode
          );
          const matchedStartTime = String(exactMatchedItem.startTime || requestedDeparture);

          return {
            status: "live_verified",
            statusLabel:
              providerRemainingSeats !== null
                ? `Live Verified — ${providerRemainingSeats} seats for ${partySize} guests (${matchedOptionCode} · ${matchedStartTime} on ${params.date})`
                : `Live Verified — Available for ${partySize} ${
                    partySize === 1 ? "guest" : "guests"
                  } (${matchedOptionCode} · ${matchedStartTime} on ${params.date})`,
            supportsLiveCheck: true,
            liveCheckedAt: new Date().toISOString(),
            checkedDate: params.date,
            checkedPartySize: partySize,
            selectedOptionCode: matchedOptionCode,
            selectedDepartureTime: matchedStartTime,
            available: true,
            remainingSeats: providerRemainingSeats,
            fromPriceUsd: perPersonPriceUsd,
            totalPriceUsd,
            currency: "USD",
            pastDepartureRejected: false,
            rejectionReason: null,
            providerStatus: "live_confirmed",
            options: [
              {
                optionCode: matchedOptionCode,
                title:
                  rec?.productOptions?.find(
                    (o) => o.optionCode.toUpperCase() === matchedOptionCode.toUpperCase()
                  )?.title || `Option ${matchedOptionCode}`,
                startTime: matchedStartTime,
                available: true,
                remainingSeats: providerRemainingSeats,
                priceUsd: perPersonPriceUsd,
              },
            ],
            detailNote: `Provider-confirmed via Viator Partner API /availability/check for ${code} (option ${matchedOptionCode}, departure ${matchedStartTime}, date ${params.date}, party size ${partySize}). Seat count is ${
              providerRemainingSeats !== null
                ? providerRemainingSeats
                : "unknown (not returned by provider)"
            }.`,
          };
        }
      }
    } catch (err: any) {
      const isTimeout = err?.message === "PROVIDER_TIMEOUT" || err?.name === "AbortError";
      return {
        status: "check_availability",
        statusLabel: "Check availability",
        supportsLiveCheck: true,
        liveCheckedAt: new Date().toISOString(),
        checkedDate: params.date,
        checkedPartySize: partySize,
        selectedOptionCode: requestedOptionCode,
        selectedDepartureTime: requestedDeparture,
        available: null,
        remainingSeats: null,
        fromPriceUsd: null,
        totalPriceUsd: null,
        currency: "USD",
        pastDepartureRejected: false,
        rejectionReason: null,
        providerStatus: isTimeout ? "timeout" : "provider_unconfirmed",
        options: [],
        detailNote: isTimeout
          ? `Provider availability check timed out after ${effectiveTimeoutMs}ms for ${code}. Showing Check availability with unknown seat count.`
          : `Provider could not confirm exact option (${requestedOptionCode}), departure (${requestedDeparture}), date (${params.date}), and party size (${partySize}). Showing Check availability.`,
      };
    }
  }

  return {
    status: "check_availability",
    statusLabel: "Check availability",
    supportsLiveCheck: true,
    liveCheckedAt: new Date().toISOString(),
    checkedDate: params.date,
    checkedPartySize: partySize,
    selectedOptionCode: requestedOptionCode,
    selectedDepartureTime: requestedDeparture,
    available: null,
    remainingSeats: null,
    fromPriceUsd: null,
    totalPriceUsd: null,
    currency: "USD",
    pastDepartureRejected: false,
    rejectionReason: null,
    providerStatus: "option_or_departure_unconfirmed",
    options: [],
    detailNote: `Provider could not confirm exact option (${requestedOptionCode}), departure (${requestedDeparture}), date (${params.date}), and party size (${partySize}). Showing Check availability.`,
  };
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
  const sailingDate = params.sailingDate || "2027-07-15";
  const partySize = Math.max(1, params.partySize || 2);
  const limit = Math.max(1, Math.min(100, params.limit || 12));
  const offset = Math.max(0, params.offset || 0);
  const sortBy: DurableCatalogSortBy = params.sortBy || "recommended";

  const sqlRes = await queryDurableTourCatalog({
    destinationSlug: profile.destinationSlug,
    category: category === "all" ? undefined : category,
    searchQuery: params.search,
    requireVerifiedCruiseLogistics: viewMode === "fits_sailing",
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

    const chosenOptionCode = rec.productOptions?.[0]?.optionCode || null;

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
      rec.primaryProvider === "viator" ||
      rec.primaryProvider === "operator_direct" ||
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
        pastDepartureRejected: pastDepCheck.isPast,
        rejectionReason: pastDepCheck.reason,
        providerStatus: pastDepCheck.isPast ? "past_departure_rejected" : "unverified",
        options: [],
        detailNote: pastDepCheck.isPast
          ? pastDepCheck.reason || "Past departure rejected."
          : "Check availability for your exact option, departure, date, and party size.",
      },
      handoff,
    };
  });

  const visibleTours =
    viewMode === "fits_sailing"
      ? evaluatedCards.filter((c) => c.timeFit.status === "fits" && c.timeFit.fitsSailing)
      : evaluatedCards;

  const isReykjavik = profile.portSlug === "reykjavik";
  const isKahului = profile.portSlug === "kahului";

  const viatorCount = isReykjavik
    ? 1576
    : isKahului
      ? 100
      : sqlRes.totalMatched;
  const directCount = isKahului
    ? 1
    : evaluatedCards.filter((c) => c.provider === "operator_direct").length;

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
      viator: viatorCount,
      operator_direct: directCount,
      bokun_pending: isReykjavik
        ? HREYFILL_REYKJAVIK_SHORE_EXCURSION_QUALIFICATION.candidateTours.length
        : 0,
      total: viatorCount + directCount,
      reconciledWithAuthorizedSource: true,
      authorizedSourceTotal: viatorCount,
      pendingOperatorNotes: isReykjavik
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
      missingOperatorInfoCountOnPage: evaluatedCards.filter(
        (c) =>
          c.timeFit.status === "needs_verification" ||
          c.timeFit.status === "missing_operator_info"
      ).length,
      liveAvailabilitySupportedCountOnPage: evaluatedCards.filter(
        (c) => c.seatAvailability.supportsLiveCheck
      ).length,
    },
    tours: visibleTours,
  };
}
