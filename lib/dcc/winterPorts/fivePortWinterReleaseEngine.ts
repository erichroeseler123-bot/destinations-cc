/**
 * Five-Port Winter Release Decision Engine & Actual-Trip Checker
 *
 * Uses St. Thomas (`st-thomas`) as the exact architectural and decision model for:
 * 1. `st-thomas` — St. Thomas, USVI (WICO vs. Crown Bay + St. John day-trip ferry leg evaluation)
 * 2. `nassau` — Nassau, Bahamas (Prince George Wharf / NCP Berths 1–6 exit walk vs. Paradise Island)
 * 3. `cozumel` — Cozumel, Mexico (Punta Langosta vs. International Pier SSA vs. Puerta Maya + Mainland Ferry)
 * 4. `roatan` — Roatán, Honduras (Port of Roatán Coxen Hole vs. Mahogany Bay Cruise Center)
 * 5. `grand-cayman` — George Town, Grand Cayman (Royal Watler Tender vs. Spotts Bay Weather Tender)
 *
 * Every winter port includes:
 * - A public answer comparing docks, tender queues, and transfer bottlenecks
 * - A deterministic actual-trip checker using the traveler's sailing date, ship arrival/all-aboard,
 *   berth/tender dock, party size, and return buffer
 * - At least one free or self-guided option ($0 walk / public beach)
 * - Exact catalog product matching (duration, pickup, price, and checkout URL)
 * - Explicit `unknown` markers for unconfirmed operator/port facts
 * - Zero commercial ranking weight (`commercialWeightApplied: 0`)
 */

import {
  evaluateStThomasPortDayScenario,
  type StThomasArrivalDock,
  type StThomasPortDayEvaluationResult,
} from "../stThomasPortDayEngine";

export type WinterReleasePortSlug =
  | "st-thomas"
  | "nassau"
  | "cozumel"
  | "roatan"
  | "grand-cayman";

export const FIVE_WINTER_RELEASE_PORT_SLUGS: readonly WinterReleasePortSlug[] = [
  "st-thomas",
  "nassau",
  "cozumel",
  "roatan",
  "grand-cayman",
] as const;

export type WinterPortFitStatus =
  | "fits_comfortably"
  | "tight_buffer"
  | "qualified_needs_confirmation"
  | "does_not_fit";

export type WinterPortPickupMode =
  | "self_drive"
  | "pier_pickup"
  | "hotel_pickup"
  | "public_walk_or_safari_taxi"
  | "public_ferry_and_safari_taxi";

export interface WinterPortUnknownFact {
  factId: string;
  status: "unknown";
  category:
    | "missing_traveler_input"
    | "unverified_schedule_or_tariff"
    | "operator_confirmation_required"
    | "source_change_pending_human_review";
  summary: string;
  impactOnDecision: string;
  sourceUrl: string | null;
  checkedOn: string;
}

export interface WinterPortEvaluatedOption {
  optionId: string;
  productCode: string | null;
  tourId: string | null;
  title: string;
  shortLabel: string;
  isFreeOrSelfGuided: boolean;
  isDayTripChoice: boolean;
  dayTripDestination: string | null;
  pickupMode: WinterPortPickupMode;
  pickupSummary: string;
  exactMeetingPointOrPickup: string;
  exactDepartureNote: string;
  activityDurationMinutes: number;
  listingPriceUsd: number;
  estimatedCostPerAdultUsd: number;
  estimatedCostTotalPartyUsd: number;
  checkoutUrl: string | null;
  fitStatus: WinterPortFitStatus;
  fitBadgeLabel: string;
  conciseVerdict: string;
  dockComparisonNote: string;
  timing: {
    timeZone: string;
    utcOffsetString: string;
    shipArrivalTime: string;
    allAboardTime: string;
    totalPortWindowMinutes: number;
    disembarkationAndPierWalkMinutes: number;
    checkInLeadMinutes: number;
    outboundTransferMinutes: number;
    activityDurationMinutes: number;
    returnTransferMinutes: number;
    requiredReturnBufferMinutes: number;
    totalRequiredMinutes: number;
    netMarginMinutes: number;
    earliestShoreReadyTime: string;
    estimatedBackAtPierTime: string;
    targetAllAboardCutoffTime: string;
  };
  unknownFactsForOption: WinterPortUnknownFact[];
  commercialWeightApplied: 0;
}

export interface WinterPortScenarioInput {
  portSlug: WinterReleasePortSlug;
  travelDate?: string | null;
  shipArrivalTime?: string;
  allAboardTime?: string;
  arrivalDock?: string;
  adults?: number;
  childAges?: number[];
  returnBufferMinutes?: number;
}

export interface WinterPortEvaluationResult {
  portSlug: WinterReleasePortSlug;
  portName: string;
  mainDestination: string;
  timeZone: string;
  utcOffsetString: string;
  evaluatedInput: {
    travelDate: string;
    shipArrivalTime: string;
    allAboardTime: string;
    arrivalDock: string;
    adults: number;
    childAges: number[];
    returnBufferMinutes: number;
  };
  publicAnswer: {
    question: string;
    directAnswer: string;
    freeAndSelfGuidedSummary: string;
    dockOptions: Array<{
      dockCode: string;
      officialName: string;
      pierOrTenderNotes: string;
    }>;
  };
  conciseVerdict: string;
  bookingCriticalGapsPrioritized: Array<{
    gapType: "pier_or_tender_timing" | "pickup_verification" | "exact_departure";
    summary: string;
    status: "verified" | "needs_confirmation" | "unknown";
  }>;
  recommendedOptions: WinterPortEvaluatedOption[];
  eliminatedOptions: WinterPortEvaluatedOption[];
  allOptions: WinterPortEvaluatedOption[];
  unknownFacts: WinterPortUnknownFact[];
  stThomasDetail?: StThomasPortDayEvaluationResult;
  commercialNeutrality: {
    commercialWeightAppliedToRanking: 0;
    includesFreeOrSelfGuidedOption: true;
    humanFactApprovalRequired: true;
  };
}

function parseHmToMinutes(hm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((hm || "").trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function formatMinutesToHm(totalMin: number): string {
  const normalized = ((Math.round(totalMin) % 1440) + 1440) % 1440;
  const hh = Math.floor(normalized / 60);
  const mm = normalized % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

interface NonStThomasPortSpec {
  portSlug: Exclude<WinterReleasePortSlug, "st-thomas">;
  portName: string;
  mainDestination: string;
  timeZone: string;
  utcOffsetString: string;
  defaultTravelDate: string;
  defaultArrivalTime: string;
  defaultAllAboardTime: string;
  defaultDock: string;
  defaultReturnBufferMinutes: number;
  question: string;
  directAnswer: string;
  freeAndSelfGuidedSummary: string;
  dockOptions: Array<{
    dockKey: string;
    dockCode: string;
    officialName: string;
    disembarkAndWalkMinutes: number;
    pierOrTenderNotes: string;
  }>;
  bookingCriticalGapsPrioritized: Array<{
    gapType: "pier_or_tender_timing" | "pickup_verification" | "exact_departure";
    summary: string;
    status: "verified" | "needs_confirmation" | "unknown";
  }>;
  unknownFacts: WinterPortUnknownFact[];
  options: Array<{
    optionId: string;
    productCode: string | null;
    tourId: string | null;
    title: string;
    shortLabel: string;
    isFreeOrSelfGuided: boolean;
    isDayTripChoice: boolean;
    dayTripDestination: string | null;
    pickupMode: WinterPortPickupMode;
    pickupSummary: string;
    exactMeetingPointOrPickup: string;
    exactDepartureNote: string;
    activityDurationMinutes: number;
    checkInLeadMinutes: number;
    transferEachWayByDock: Record<string, number>;
    minimumReturnBufferMinutes: number;
    listingPriceUsd: number;
    estimatedTaxiRoundTripUsd: number;
    checkoutUrl: string | null;
    dockComparisonByDock: Record<string, string>;
    qualifyNeedsConfirmation: boolean;
    qualificationReason?: string;
    forceEliminateReason?: string;
  }>;
}

const NON_ST_THOMAS_WINTER_PORT_SPECS: Record<
  Exclude<WinterReleasePortSlug, "st-thomas">,
  NonStThomasPortSpec
> = {
  nassau: {
    portSlug: "nassau",
    portName: "Nassau, Bahamas",
    mainDestination: "nassau",
    timeZone: "America/Nassau",
    utcOffsetString: "-05:00",
    defaultTravelDate: "2027-01-25",
    defaultArrivalTime: "08:00",
    defaultAllAboardTime: "16:30",
    defaultDock: "prince_george_wharf_ncp",
    defaultReturnBufferMinutes: 60,
    question:
      "Which Nassau excursions fit my sailing from Prince George Wharf (Nassau Cruise Port), and how much pier-walk or Paradise Island transfer buffer do I need?",
    directAnswer:
      "All cruise ships in Nassau berth at Nassau Cruise Port (Prince George Wharf, Berths 1–6), where walking from the furthest outer mega-ship pier (Berths 5–6) through the NCP Arrivals Terminal to the Woodes Rogers Walk / Bay Street dispatch gate takes 15–20 minutes before you board any tour vehicle. Walkable downtown tours (such as the $0 Queen's Staircase & Fort Fincastle self-guided loop or the 3-hour 6558RUM Rum & Food Walking Tour) avoid bridge traffic completely, whereas Paradise Island / Montague marina boat tours (52556P13 Swimming Pigs Snorkeling) require 25–30 minutes each way across the Sidney Poitier Bridge or water taxi.",
    freeAndSelfGuidedSummary:
      "Two $0 self-guided Nassau options work directly from the Nassau Cruise Port exit gate without booking a tour: (1) the $0 Historic Downtown Nassau, Parliament Square, Queen's Staircase (66 Steps) & Fort Fincastle Exterior walking loop (~15 min walk from NCP), and (2) $0-admission Junkanoo Beach (~15–20 min waterfront walk west along Woodes Rogers Walk / West Bay Street).",
    dockOptions: [
      {
        dockKey: "prince_george_wharf_ncp",
        dockCode: "NCP-B1-B4",
        officialName: "Nassau Cruise Port — Prince George Wharf (Inner Berths 1–4)",
        disembarkAndWalkMinutes: 20,
        pierOrTenderNotes:
          "12–15 min walk along pier apron through NCP Arrivals Terminal security to Bay Street / Woodes Rogers Walk dispatch zone.",
      },
      {
        dockKey: "prince_george_wharf_outer",
        dockCode: "NCP-B5-B6",
        officialName: "Nassau Cruise Port — Outer Mega-Ship Pier (Berths 5–6)",
        disembarkAndWalkMinutes: 25,
        pierOrTenderNotes:
          "18–25 min walk from the outer oasis pier through the NCP retail village to the outside tour pickup gate (courtesy tram availability marked unknown).",
      },
    ],
    bookingCriticalGapsPrioritized: [
      {
        gapType: "pier_or_tender_timing",
        summary:
          "Nassau Cruise Port (Prince George Wharf Berths 1–6) requires a 15–25 minute walk from ship gangway through the NCP Arrivals Terminal before reaching independent tour pickups outside the gate.",
        status: "verified",
      },
      {
        gapType: "pickup_verification",
        summary:
          "70706P11 (Guided ATV Tour, $100) includes port/hotel pickup; 352169P2 (Score Half Day Bus Tour, $79.99) uses pier_pickup outside NCP gate; 6558RUM ($98) and 52556P13 ($133) require meeting at the designated downtown or marina check-in point.",
        status: "verified",
      },
      {
        gapType: "exact_departure",
        summary:
          "Exact morning departure wave (e.g., 09:00 vs. 10:30 AM) and Paradise Island bridge return traffic between 2:30 PM and 4:30 PM must fit the ship's 2-hour return buffer.",
        status: "needs_confirmation",
      },
    ],
    unknownFacts: [
      {
        factId: "nas-unknown-ncp-six-ship-gate-exit-queue",
        status: "unknown",
        category: "unverified_schedule_or_tariff",
        summary:
          "Exact Nassau Cruise Port (NCP) courtesy tram wait time from outer Berths 5–6 on 5–6 ship peak winter days is unknown.",
        impactOnDecision:
          "Planner budgets 20–25 minutes on foot from gangway to outside Bay Street pickup gate so guests do not miss morning tour check-in.",
        sourceUrl: "https://www.nassaucruiseport.com/",
        checkedOn: "2026-11-06",
      },
      {
        factId: "nas-unknown-paradise-island-water-taxi-return-headway",
        status: "unknown",
        category: "unverified_schedule_or_tariff",
        summary:
          "Nassau <-> Paradise Island water-taxi boats depart on fill-up rather than a guaranteed fixed timetable.",
        impactOnDecision:
          "Travelers returning from Paradise Island or Montague afternoon boat tours should use regulated road taxis across the Sidney Poitier Bridge with a 2-hour return buffer.",
        sourceUrl: "https://www.nassaucruiseport.com/",
        checkedOn: "2026-11-06",
      },
    ],
    options: [
      {
        optionId: "nas-opt-queens-staircase-junkanoo-self-guided",
        productCode: null,
        tourId: null,
        title:
          "Free / Self-Guided Historic Nassau, Queen's Staircase (66 Steps) & Junkanoo Beach Walk",
        shortLabel: "Self-Guided Queen's Staircase & Junkanoo Beach ($0 Walk)",
        isFreeOrSelfGuided: true,
        isDayTripChoice: false,
        dayTripDestination: null,
        pickupMode: "public_walk_or_safari_taxi",
        pickupSummary: "Direct walk from Nassau Cruise Port Arrivals Terminal exit",
        exactMeetingPointOrPickup:
          "Nassau Cruise Port Exit Gate -> Parliament Square -> Queen's Staircase (Elizabeth Ave) -> Junkanoo Beach (West Bay St)",
        exactDepartureNote:
          "Self-paced departure any time after ship clearance (allow 2.5 hours total walking & beach loop).",
        activityDurationMinutes: 150,
        checkInLeadMinutes: 0,
        transferEachWayByDock: {
          prince_george_wharf_ncp: 15,
          prince_george_wharf_outer: 20,
        },
        minimumReturnBufferMinutes: 45,
        listingPriceUsd: 0,
        estimatedTaxiRoundTripUsd: 0,
        checkoutUrl: null,
        dockComparisonByDock: {
          prince_george_wharf_ncp:
            "15-minute walk from NCP Inner Berths 1–4 exit to Queen's Staircase or Junkanoo Beach.",
          prince_george_wharf_outer:
            "Allow 20–25 minutes from Outer Berths 5–6 to clear the NCP terminal village into downtown.",
        },
        qualifyNeedsConfirmation: false,
      },
      {
        optionId: "nas-opt-bowcar-atv-lunch-pickup-70706p11",
        productCode: "70706P11",
        tourId: "dcc:tour:viator:70706P11",
        title:
          "Nassau Bahamas Guided ATV Tour Included Lunch, Port/Hotel Pickup (70706P11)",
        shortLabel: "Guided ATV Tour w/ Lunch & Port Pickup (70706P11 • 4h • $100)",
        isFreeOrSelfGuided: false,
        isDayTripChoice: false,
        dayTripDestination: null,
        pickupMode: "hotel_pickup",
        pickupSummary:
          "Port/Hotel pickup included outside Nassau Cruise Port Arrivals Terminal gate",
        exactMeetingPointOrPickup:
          "Designated tour pickup zone outside Nassau Cruise Port (Prince George Wharf) Arrivals Terminal gate (15 min before departure)",
        exactDepartureNote:
          "240-minute (4h) guided island ATV circuit including lunch and round-trip port transfer.",
        activityDurationMinutes: 240,
        checkInLeadMinutes: 15,
        transferEachWayByDock: {
          prince_george_wharf_ncp: 10,
          prince_george_wharf_outer: 15,
        },
        minimumReturnBufferMinutes: 60,
        listingPriceUsd: 100,
        estimatedTaxiRoundTripUsd: 0,
        checkoutUrl:
          "https://www.viator.com/tours/New-Providence-Island/Nassau-Guided-ATV-Buggy-City-And-Beach-Tour-by-Bowcar-Bahamas/d420-70706P11?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-nassau-70706p11&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
        dockComparisonByDock: {
          prince_george_wharf_ncp:
            "Includes port pickup outside NCP terminal; 240m duration + 20m pier walk + 15m check-in + 20m R/T gate staging + 60m buffer = 355m (5h 55m).",
          prince_george_wharf_outer:
            "From Outer Berths 5–6, budget 25 minutes to walk the pier to the NCP exit gate before pickup.",
        },
        qualifyNeedsConfirmation: false,
      },
      {
        optionId: "nas-opt-score-half-day-bus-tour-352169p2",
        productCode: "352169P2",
        tourId: "dcc:tour:viator:352169P2",
        title: "Nassau Bahamas Score Half Day Bus Tour-Learn About City (352169P2)",
        shortLabel: "Score Half-Day City Bus Tour (352169P2 • 3h • $79.99)",
        isFreeOrSelfGuided: false,
        isDayTripChoice: false,
        dayTripDestination: null,
        pickupMode: "pier_pickup",
        pickupSummary:
          "Pier pickup outside Nassau Cruise Port Arrivals Terminal gate",
        exactMeetingPointOrPickup:
          "Nassau Cruise Port (Prince George Wharf) Tour Dispatch Gate, Downtown Nassau",
        exactDepartureNote:
          "180-minute (3h) air-conditioned city & cultural bus tour departing from NCP port gate.",
        activityDurationMinutes: 180,
        checkInLeadMinutes: 15,
        transferEachWayByDock: {
          prince_george_wharf_ncp: 10,
          prince_george_wharf_outer: 15,
        },
        minimumReturnBufferMinutes: 60,
        listingPriceUsd: 79.99,
        estimatedTaxiRoundTripUsd: 0,
        checkoutUrl:
          "https://www.viator.com/tours/New-Providence-Island/Score-Half-Day-Bus-Tour/d420-352169P2?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-nassau-352169p2&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
        dockComparisonByDock: {
          prince_george_wharf_ncp:
            "Easy 3-hour cultural bus loop (295m total required window including 60m ship buffer).",
          prince_george_wharf_outer:
            "Requires 310m total window from Outer Berths 5–6.",
        },
        qualifyNeedsConfirmation: false,
      },
      {
        optionId: "nas-opt-rum-and-food-walking-tour-6558rum",
        productCode: "6558RUM",
        tourId: "dcc:tour:viator:6558RUM",
        title: "Nassau Rum Tastings and Caribbean Food Walking Tour (6558RUM)",
        shortLabel: "Rum Tastings & Food Walking Tour (6558RUM • 3h • $98)",
        isFreeOrSelfGuided: false,
        isDayTripChoice: false,
        dayTripDestination: null,
        pickupMode: "self_drive",
        pickupSummary:
          "Pickup NOT included (walk 10–15 min from Nassau Cruise Port exit into Downtown Nassau meeting point)",
        exactMeetingPointOrPickup:
          "Downtown Nassau Historic Core (10–15 min walk from Prince George Wharf exit gate)",
        exactDepartureNote:
          "180-minute (3h) guided downtown culinary & rum walking tour; zero road or bridge traffic risk.",
        activityDurationMinutes: 180,
        checkInLeadMinutes: 15,
        transferEachWayByDock: {
          prince_george_wharf_ncp: 12,
          prince_george_wharf_outer: 18,
        },
        minimumReturnBufferMinutes: 60,
        listingPriceUsd: 98,
        estimatedTaxiRoundTripUsd: 0,
        checkoutUrl:
          "https://www.viator.com/tours/New-Providence-Island/Island-Time-Rum-and-Food-Walking-Tour/d420-6558RUM?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-nassau-6558rum&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
        dockComparisonByDock: {
          prince_george_wharf_ncp:
            "Walkable downtown meeting point 12 minutes from NCP exit gate (299m total required window).",
          prince_george_wharf_outer:
            "Allow 18 minutes walk from Outer Berths 5–6 to downtown meeting point.",
        },
        qualifyNeedsConfirmation: false,
      },
      {
        optionId: "nas-opt-swimming-pigs-snorkeling-lunch-52556p13",
        productCode: "52556P13",
        tourId: "dcc:tour:viator:52556P13",
        title: "The Swimming Pigs Snorkeling and Full Lunch Tour (52556P13)",
        shortLabel:
          "Swimming Pigs Snorkeling & Lunch (52556P13 • 4h • $133 • Needs confirmation)",
        isFreeOrSelfGuided: false,
        isDayTripChoice: true,
        dayTripDestination: "rose-island-and-athol-cays",
        pickupMode: "self_drive",
        pickupSummary:
          "Pickup NOT included (meet at Nassau / Paradise Island / Montague marina dock — ~25 min taxi each way)",
        exactMeetingPointOrPickup:
          "Designated Nassau / Montague / Paradise Island Marina Check-In Dock (confirm exact slip on booking voucher)",
        exactDepartureNote:
          "240-minute (4h) speedboat excursion; confirm morning departure wave and marina slip location before checkout.",
        activityDurationMinutes: 240,
        checkInLeadMinutes: 20,
        transferEachWayByDock: {
          prince_george_wharf_ncp: 25,
          prince_george_wharf_outer: 30,
        },
        minimumReturnBufferMinutes: 75,
        listingPriceUsd: 133,
        estimatedTaxiRoundTripUsd: 24,
        checkoutUrl:
          "https://www.viator.com/tours/New-Providence-Island/Half-Day-Ultimate-13-Seater-Cruiser-Experience/d420-52556P13?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-nassau-52556p13&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
        dockComparisonByDock: {
          prince_george_wharf_ncp:
            "Fits 7+ hour Nassau calls (405m required including 25m taxi each way and 75m marine return buffer), marked Needs confirmation until exact marina departure slip and afternoon bridge return window are verified.",
          prince_george_wharf_outer:
            "Requires 420m (7h 00m) total window from Outer Berths 5–6.",
        },
        qualifyNeedsConfirmation: true,
        qualificationReason:
          "Exact departure marina slip (Paradise Island Ferry Terminal vs. Montague Ramp) and afternoon Sidney Poitier Bridge return taxi buffer require voucher confirmation.",
      },
    ],
  },
  cozumel: {
    portSlug: "cozumel",
    portName: "Cozumel, Mexico",
    mainDestination: "cozumel",
    timeZone: "America/Cancun",
    utcOffsetString: "-05:00",
    defaultTravelDate: "2027-01-26",
    defaultArrivalTime: "08:00",
    defaultAllAboardTime: "17:00",
    defaultDock: "puerta_maya",
    defaultReturnBufferMinutes: 60,
    question:
      "Which Cozumel excursions fit my ship's pier (Punta Langosta vs. International Pier SSA vs. Puerta Maya), and why are mainland Chichén Itzá ferries eliminated on standard calls?",
    directAnswer:
      "Cozumel has three separate cruise piers spread across 4.5 miles of coastline: Punta Langosta docks directly in downtown San Miguel (step-off walkable to the Malecón and Fiscal Ferry Pier), while International Pier (SSA México) and Puerta Maya sit 3.5 to 4.5 miles south near Chankanaab, Marina Fonatur, and the southern beach clubs (Paradise Beach / Palancar). Stay on Cozumel Island for 4-hour Palancar/El Cielo reef snorkeling (103974P5), 3.5-hour Jade Caverns ATV (5553274P1), or Paradise Beach Club (122218P1); independent 12-hour mainland Chichén Itzá tours (5885P231) require round-trip Ultramar ferries to Playa del Carmen plus 5+ hours of highway bus transit and do not fit an 8–9 hour port call.",
    freeAndSelfGuidedSummary:
      "Free / self-guided Cozumel path: $0 San Miguel Waterfront Malecón, Plaza Benito Juárez & Monumento al Mestizaje Walking Loop (0 min walk from Punta Langosta; ~10–12 min regulated sindicato taxi from International Pier SSA or Puerta Maya).",
    dockOptions: [
      {
        dockKey: "punta_langosta",
        dockCode: "CZM-PL",
        officialName: "Punta Langosta Cruise Pier (Downtown San Miguel)",
        disembarkAndWalkMinutes: 15,
        pierOrTenderNotes:
          "Direct downtown San Miguel berth; 5-minute walk to Plaza Benito Juárez and San Miguel Fiscal Ferry Pier, 18–22 min taxi south to Paradise Beach / Palancar marinas.",
      },
      {
        dockKey: "international_ssa",
        dockCode: "CZM-SSA",
        officialName: "International Cruise Terminal (SSA México — 3.5 mi South)",
        disembarkAndWalkMinutes: 20,
        pierOrTenderNotes:
          "Located 3.5 miles south of downtown adjacent to Marina Fonatur (5–10 min to southern snorkel boats, 10–12 min to Paradise Beach).",
      },
      {
        dockKey: "puerta_maya",
        dockCode: "CZM-PM",
        officialName: "Puerta Maya Cruise Terminal (Carnival Corp — 4.5 mi South)",
        disembarkAndWalkMinutes: 20,
        pierOrTenderNotes:
          "Located 4.5 miles south of San Miguel; fastest 8–10 min taxi access to Marina Fonatur, Chankanaab, and Paradise Beach Club.",
      },
    ],
    bookingCriticalGapsPrioritized: [
      {
        gapType: "pier_or_tender_timing",
        summary:
          "Cozumel's 3 cruise piers (Punta Langosta downtown vs. SSA International and Puerta Maya 3.5–4.5 miles south) shift southern marina and downtown transfer times by 15–20 minutes each way.",
        status: "verified",
      },
      {
        gapType: "pickup_verification",
        summary:
          "103974P5 ($65) and 5553274P1 ($79) specify pier pickup/marina meeting by terminal; 122218P1 ($81 Paradise Beach Pass) is self_drive via regulated taxi.",
        status: "verified",
      },
      {
        gapType: "exact_departure",
        summary:
          "Cozumel observes America/Cancun (EST UTC-05:00 year-round, no DST); 12-hour mainland Chichén Itzá tours (5885P231) are disqualified on <12h calls due to Ultramar ferry return cutoffs.",
        status: "verified",
      },
    ],
    unknownFacts: [
      {
        factId: "czm-unknown-ship-time-vs-cancun-est-offset",
        status: "unknown",
        category: "unverified_schedule_or_tariff",
        summary:
          "After U.S. Daylight Saving Time begins in March, Cozumel (America/Cancun EST UTC-05:00) is 1 hour behind EDT homeport ship clocks (in January winter sailings, EST ship time and Cozumel local time match).",
        impactOnDecision:
          "Always verify whether your ship stays on homeport time or adjusts to Cozumel local time before booking morning departures.",
        sourceUrl: "https://www.apimqroo.com.mx/",
        checkedOn: "2026-11-06",
      },
    ],
    options: [
      {
        optionId: "czm-opt-san-miguel-malecon-self-guided",
        productCode: null,
        tourId: null,
        title:
          "Free / Self-Guided San Miguel Waterfront Malecón & Benito Juárez Plaza Walk",
        shortLabel: "Self-Guided San Miguel Malecón Walk ($0 Route)",
        isFreeOrSelfGuided: true,
        isDayTripChoice: false,
        dayTripDestination: null,
        pickupMode: "public_walk_or_safari_taxi",
        pickupSummary:
          "Step-off walk from Punta Langosta or 10-min regulated taxi from SSA / Puerta Maya",
        exactMeetingPointOrPickup:
          "Plaza Benito Juárez & San Miguel Malecón Waterfront, Cozumel",
        exactDepartureNote: "Flexible self-guided 2-hour historic waterfront loop.",
        activityDurationMinutes: 120,
        checkInLeadMinutes: 0,
        transferEachWayByDock: {
          punta_langosta: 5,
          international_ssa: 12,
          puerta_maya: 15,
        },
        minimumReturnBufferMinutes: 45,
        listingPriceUsd: 0,
        estimatedTaxiRoundTripUsd: 0,
        checkoutUrl: null,
        dockComparisonByDock: {
          punta_langosta:
            "Direct 5-minute walk off the Punta Langosta pier apron into Plaza Benito Juárez.",
          international_ssa:
            "12-minute regulated taxi each way from International Pier (SSA) into downtown San Miguel.",
          puerta_maya:
            "15-minute regulated taxi each way from Puerta Maya into downtown San Miguel.",
        },
        qualifyNeedsConfirmation: false,
      },
      {
        optionId: "czm-opt-palancar-columbia-el-cielo-snorkel-103974p5",
        productCode: "103974P5",
        tourId: "dcc:tour:viator:103974P5",
        title:
          "Cozumel Reefs Snorkeling: Palancar, Columbia and El Cielo Reefs (103974P5)",
        shortLabel: "Palancar, Columbia & El Cielo Snorkel (103974P5 • 4h • $65)",
        isFreeOrSelfGuided: false,
        isDayTripChoice: false,
        dayTripDestination: null,
        pickupMode: "pier_pickup",
        pickupSummary:
          "Pier/marina meeting near southern cruise piers (Marina Fonatur / Caleta)",
        exactMeetingPointOrPickup:
          "Marina Fonatur / Designated Cruise Pier Meeting Point, Cozumel (15 min before departure)",
        exactDepartureNote:
          "240-minute (4h) boat snorkel to Palancar Reef, Columbia Reef, and El Cielo sandbar.",
        activityDurationMinutes: 240,
        checkInLeadMinutes: 15,
        transferEachWayByDock: {
          punta_langosta: 18,
          international_ssa: 8,
          puerta_maya: 8,
        },
        minimumReturnBufferMinutes: 60,
        listingPriceUsd: 65,
        estimatedTaxiRoundTripUsd: 16,
        checkoutUrl:
          "https://www.viator.com/tours/Cozumel/El-Cielo-Palancar-snorkeling-experience/d632-103974P5?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-cozumel-103974p5&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
        dockComparisonByDock: {
          punta_langosta:
            "Allow 18 minutes by taxi south from Punta Langosta to Marina Fonatur (371m required window).",
          international_ssa:
            "Only 8 minutes from International Pier SSA to Marina Fonatur (351m required window).",
          puerta_maya:
            "Only 8 minutes from Puerta Maya to Marina Fonatur (351m required window).",
        },
        qualifyNeedsConfirmation: false,
      },
      {
        optionId: "czm-opt-jade-caverns-atv-5553274p1",
        productCode: "5553274P1",
        tourId: "dcc:tour:viator:5553274P1",
        title: "All Inclusive ATV Tour to Jade Caverns in Cozumel (5553274P1)",
        shortLabel: "Jade Caverns All-Inclusive ATV Tour (5553274P1 • 3h 30m • $79)",
        isFreeOrSelfGuided: false,
        isDayTripChoice: false,
        dayTripDestination: null,
        pickupMode: "pier_pickup",
        pickupSummary:
          "Pier pickup outside Punta Langosta, International Pier (SSA), or Puerta Maya terminal gate",
        exactMeetingPointOrPickup:
          "Assigned Cozumel Cruise Terminal Gate (Punta Langosta, SSA International, or Puerta Maya)",
        exactDepartureNote:
          "210-minute (3h 30m) guided jungle ATV ride and cenote swim to Jade Caverns.",
        activityDurationMinutes: 210,
        checkInLeadMinutes: 15,
        transferEachWayByDock: {
          punta_langosta: 15,
          international_ssa: 15,
          puerta_maya: 15,
        },
        minimumReturnBufferMinutes: 60,
        listingPriceUsd: 79,
        estimatedTaxiRoundTripUsd: 0,
        checkoutUrl:
          "https://www.viator.com/tours/Cozumel/Guided-ATV-Riding-and-Cenote-Swimming-w-Tequila-Tasting-and-Lunch/d632-5553274P1?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-cozumel-5553274p1&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
        dockComparisonByDock: {
          punta_langosta:
            "Pier-gate pickup included from Punta Langosta (330m total required window).",
          international_ssa:
            "Pier-gate pickup included outside SSA International Terminal (335m total required window).",
          puerta_maya:
            "Pier-gate pickup included outside Puerta Maya Terminal (335m total required window).",
        },
        qualifyNeedsConfirmation: false,
      },
      {
        optionId: "czm-opt-paradise-beach-all-inclusive-122218p1",
        productCode: "122218P1",
        tourId: "dcc:tour:viator:122218P1",
        title: "Cozumel Paradise Beach Club All-Inclusive Day Pass (122218P1)",
        shortLabel: "Paradise Beach Club All-Inclusive Pass (122218P1 • 5h Stay • $81)",
        isFreeOrSelfGuided: false,
        isDayTripChoice: false,
        dayTripDestination: null,
        pickupMode: "self_drive",
        pickupSummary:
          "Pickup NOT included (self_drive / 10–12 min regulated taxi from Puerta Maya/SSA or 20 min from Punta Langosta)",
        exactMeetingPointOrPickup:
          "Paradise Beach Club, Carretera Costera Sur Km 14.5, Cozumel",
        exactDepartureNote:
          "Flexible daytime club pass (modeled as a 300-minute / 5-hour beach stay within an 8-hour open club window).",
        activityDurationMinutes: 300,
        checkInLeadMinutes: 10,
        transferEachWayByDock: {
          punta_langosta: 20,
          international_ssa: 12,
          puerta_maya: 10,
        },
        minimumReturnBufferMinutes: 60,
        listingPriceUsd: 81,
        estimatedTaxiRoundTripUsd: 18,
        checkoutUrl:
          "https://www.viator.com/tours/Cozumel/Paradise-Beach-Cozumel-All-Inclusive-Day-Pass/d632-122218P1?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-cozumel-122218p1&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
        dockComparisonByDock: {
          punta_langosta:
            "20-minute regulated taxi each way south from Punta Langosta.",
          international_ssa:
            "12-minute regulated taxi each way south from International Pier SSA.",
          puerta_maya:
            "Closest beach club fit from Puerta Maya (~10 minutes each way by taxi).",
        },
        qualifyNeedsConfirmation: false,
      },
      {
        optionId: "czm-opt-chichen-itza-mainland-eliminated-5885p231",
        productCode: "5885P231",
        tourId: "dcc:tour:viator:5885P231",
        title:
          "Chichen Itza, Cenote and Valladolid All-Inclusive Tour (5885P231 — Mainland Bus + Ferry)",
        shortLabel: "Chichén Itzá Mainland Tour (5885P231 • 12h • $59 • Disqualified)",
        isFreeOrSelfGuided: false,
        isDayTripChoice: true,
        dayTripDestination: "playa-del-carmen-chichen-itza-mainland",
        pickupMode: "self_drive",
        pickupSummary:
          "Requires Ultramar ferry to Playa del Carmen + 12-hour mainland bus circuit",
        exactMeetingPointOrPickup:
          "Playa del Carmen Mainland Ferry Terminal (requires 45-min Ultramar ferry from San Miguel Fiscal Pier)",
        exactDepartureNote:
          "720-minute (12h) mainland tour + 120m round-trip ferry crossing/boarding.",
        activityDurationMinutes: 720,
        checkInLeadMinutes: 30,
        transferEachWayByDock: {
          punta_langosta: 50,
          international_ssa: 60,
          puerta_maya: 60,
        },
        minimumReturnBufferMinutes: 90,
        listingPriceUsd: 59,
        estimatedTaxiRoundTripUsd: 56,
        checkoutUrl:
          "https://www.viator.com/tours/Cozumel/Chichen-Itza-Classic-Tour/d632-5885P231?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-cozumel-5885p231&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
        dockComparisonByDock: {
          punta_langosta:
            "Disqualified on standard 8–9h Cozumel calls: 720m mainland tour + Ultramar ferry legs require 955+ minutes.",
          international_ssa:
            "Disqualified on standard 8–9h Cozumel calls: requires 980+ minutes including ferry + taxi back to SSA.",
          puerta_maya:
            "Disqualified on standard 8–9h Cozumel calls: requires 980+ minutes including ferry + taxi back to Puerta Maya.",
        },
        qualifyNeedsConfirmation: false,
      },
    ],
  },
  roatan: {
    portSlug: "roatan",
    portName: "Roatán, Honduras",
    mainDestination: "roatan",
    timeZone: "America/Tegucigalpa",
    utcOffsetString: "-06:00",
    defaultTravelDate: "2027-01-27",
    defaultArrivalTime: "08:00",
    defaultAllAboardTime: "16:30",
    defaultDock: "coxen_hole_port_of_roatan",
    defaultReturnBufferMinutes: 60,
    question:
      "Which Roatán excursions fit my sailing from Port of Roatán (Coxen Hole) versus Mahogany Bay Cruise Center, and where do independent operators pick up?",
    directAnswer:
      "Roatán has two distinct cruise terminals 5 miles apart on a single two-lane island road: Port of Roatán (Town Center at Coxen Hole) puts independent excursion vans right outside Gate #1/#3 (20–25 min from West Bay Beach), whereas Mahogany Bay Cruise Center (Dixon Cove, used by Carnival Corp lines) requires a 400-meter uphill walk past the taxi corral to the main road security gate to meet independent operators (+15 min walk and +15 min extra drive time to West Bay). However, Mahogany Bay guests have exclusive access to the $0 Mahogany Beach footpath/chairlift right inside the port complex.",
    freeAndSelfGuidedSummary:
      "Free / self-guided Roatán option: (1) For ships berthed at Mahogany Bay Cruise Center, walk the shaded 10-minute footpath ($0 admission, optional paid Magical Flying Beach Chair) to Mahogany Beach; (2) From Coxen Hole (Port of Roatán), take a regulated taxi to West End Village for a self-guided Half Moon Bay waterfront walk.",
    dockOptions: [
      {
        dockKey: "coxen_hole_port_of_roatan",
        dockCode: "RTB-CH",
        officialName: "Port of Roatán — Town Center at Coxen Hole",
        disembarkAndWalkMinutes: 15,
        pierOrTenderNotes:
          "Direct walk to Gate #1 / Gate #3 independent excursion staging area; closer to West End (15–20m) and West Bay Beach (20–25m).",
      },
      {
        dockKey: "mahogany_bay_dixon_cove",
        dockCode: "RTB-MB",
        officialName: "Mahogany Bay Cruise Center (Dixon Cove — Carnival Corp)",
        disembarkAndWalkMinutes: 30,
        pierOrTenderNotes:
          "Independent non-ship tours must be met outside the main highway security gate (~400m uphill walk from terminal village; budget 30m disembark + gate walk).",
      },
    ],
    bookingCriticalGapsPrioritized: [
      {
        gapType: "pier_or_tender_timing",
        summary:
          "Mahogany Bay Cruise Center requires a 400-meter uphill walk outside the primary security gate to board independent tour vehicles (30m disembark + gate walk vs. 15m at Coxen Hole).",
        status: "verified",
      },
      {
        gapType: "pickup_verification",
        summary:
          "184749P2 ($58), 207776P19 ($55), and 192350P17 ($62.54) include pier pickup at both Coxen Hole and outside the Mahogany Bay security gate.",
        status: "verified",
      },
      {
        gapType: "exact_departure",
        summary:
          "Roatán observes Central Standard Time (America/Tegucigalpa UTC-06:00 year-round) and single-lane Carretera Principal return traffic between West Bay and Mahogany Bay requires a strict 2-hour return buffer.",
        status: "verified",
      },
    ],
    unknownFacts: [
      {
        factId: "rtb-unknown-carretera-principal-afternoon-chokepoint",
        status: "unknown",
        category: "unverified_schedule_or_tariff",
        summary:
          "Single-lane construction or rain delays through Coxen Hole between West Bay and Mahogany Bay can add 20–30 minutes during the 1:30 PM–3:30 PM return wave.",
        impactOnDecision:
          "Guests berthed at Mahogany Bay visiting West Bay should depart West Bay at least 90 minutes before all-aboard.",
        sourceUrl: "https://www.portofroatan.com/",
        checkedOn: "2026-11-06",
      },
    ],
    options: [
      {
        optionId: "rtb-opt-mahogany-beach-or-west-end-self-guided",
        productCode: null,
        tourId: null,
        title:
          "Free / Self-Guided Mahogany Beach Footpath (Mahogany Bay) or West End Half Moon Bay Walk",
        shortLabel: "Self-Guided Mahogany Beach / West End Walk ($0 Entry)",
        isFreeOrSelfGuided: true,
        isDayTripChoice: false,
        dayTripDestination: null,
        pickupMode: "public_walk_or_safari_taxi",
        pickupSummary:
          "$0 shaded 10-min footpath at Mahogany Bay or regulated taxi from Coxen Hole to West End",
        exactMeetingPointOrPickup:
          "Mahogany Beach Nature Footpath (Mahogany Bay) or Half Moon Bay Waterfront (West End)",
        exactDepartureNote: "Flexible self-guided 2.5-hour beach and coastal walk.",
        activityDurationMinutes: 150,
        checkInLeadMinutes: 0,
        transferEachWayByDock: {
          coxen_hole_port_of_roatan: 18,
          mahogany_bay_dixon_cove: 10,
        },
        minimumReturnBufferMinutes: 45,
        listingPriceUsd: 0,
        estimatedTaxiRoundTripUsd: 0,
        checkoutUrl: null,
        dockComparisonByDock: {
          coxen_hole_port_of_roatan:
            "From Coxen Hole, ride a regulated taxi 15–18 minutes to West End Half Moon Bay ($0 beach access;Mahogany Beach itself is restricted to Mahogany Bay ships).",
          mahogany_bay_dixon_cove:
            "From Mahogany Bay, walk the $0 10-minute nature path directly to Mahogany Beach with zero road traffic risk.",
        },
        qualifyNeedsConfirmation: false,
      },
      {
        optionId: "rtb-opt-monkeys-sloths-chocolate-rum-184749p2",
        productCode: "184749P2",
        tourId: "dcc:tour:viator:184749P2",
        title:
          "Monkeys & Sloths, Chocolate & Rum Factory plus Island Tour (184749P2)",
        shortLabel: "Monkeys, Sloths, Chocolate & Rum Tour (184749P2 • 4h • $58)",
        isFreeOrSelfGuided: false,
        isDayTripChoice: false,
        dayTripDestination: null,
        pickupMode: "pier_pickup",
        pickupSummary:
          "Pier pickup at Coxen Hole Gate #1/#3 or outside Mahogany Bay highway gate",
        exactMeetingPointOrPickup:
          "Port of Roatán (Coxen Hole Gate #1/#3) or Mahogany Bay Outside Independent Tour Gate (within 60m after ship arrival)",
        exactDepartureNote:
          "240-minute (4h) guided island sightseeing, sanctuary, chocolate & rum factory tour.",
        activityDurationMinutes: 240,
        checkInLeadMinutes: 15,
        transferEachWayByDock: {
          coxen_hole_port_of_roatan: 10,
          mahogany_bay_dixon_cove: 15,
        },
        minimumReturnBufferMinutes: 60,
        listingPriceUsd: 58,
        estimatedTaxiRoundTripUsd: 0,
        checkoutUrl:
          "https://www.viator.com/tours/Roatan/Shore-Excursion-Hugs-for-Sloths-and-Monkeys-Plus-Roatan-Sightseeing/d4132-184749P2?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-roatan-184749p2&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
        dockComparisonByDock: {
          coxen_hole_port_of_roatan:
            "Direct pickup outside Coxen Hole Gate #1/#3 (350m total required window).",
          mahogany_bay_dixon_cove:
            "Allow 30 minutes to walk over the Mahogany Bay hill to the outside pickup gate (375m total required window).",
        },
        qualifyNeedsConfirmation: false,
      },
      {
        optionId: "rtb-opt-sanctuary-and-beach-break-207776p19",
        productCode: "207776P19",
        tourId: "dcc:tour:viator:207776P19",
        title:
          "Roatan Monkey and Sloth Sanctuary & Beach Break Shore Excursion (207776P19)",
        shortLabel: "Sloth Sanctuary & Beach Break (207776P19 • 4h • $55)",
        isFreeOrSelfGuided: false,
        isDayTripChoice: false,
        dayTripDestination: null,
        pickupMode: "pier_pickup",
        pickupSummary:
          "Pier pickup at Coxen Hole or outside Mahogany Bay security gate",
        exactMeetingPointOrPickup:
          "Port of Roatán (Coxen Hole) or Mahogany Bay Independent Excursion Gate",
        exactDepartureNote:
          "240-minute (4h) combined sloth/monkey sanctuary and beach break shore excursion.",
        activityDurationMinutes: 240,
        checkInLeadMinutes: 15,
        transferEachWayByDock: {
          coxen_hole_port_of_roatan: 12,
          mahogany_bay_dixon_cove: 18,
        },
        minimumReturnBufferMinutes: 60,
        listingPriceUsd: 55,
        estimatedTaxiRoundTripUsd: 0,
        checkoutUrl:
          "https://www.viator.com/tours/Roatan/Animal-Sanctuary-Culture-Tour-and-Beach-Day/d4132-207776P19?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-roatan-207776p19&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
        dockComparisonByDock: {
          coxen_hole_port_of_roatan:
            "Fits comfortably from Coxen Hole (354m required window).",
          mahogany_bay_dixon_cove:
            "Fits 6.5+ hour Mahogany Bay calls (381m required window including hill exit walk).",
        },
        qualifyNeedsConfirmation: false,
      },
      {
        optionId: "rtb-opt-west-bay-beach-break-192350p17",
        productCode: "192350P17",
        tourId: "dcc:tour:viator:192350P17",
        title:
          "Roatan West Bay Beach Break With Optional Sloth & Monkey Sanctuary (192350P17)",
        shortLabel: "West Bay Beach Break & Sloth Option (192350P17 • 5h • $62.54)",
        isFreeOrSelfGuided: false,
        isDayTripChoice: false,
        dayTripDestination: null,
        pickupMode: "pier_pickup",
        pickupSummary:
          "Round-trip cruise port transfer included from Coxen Hole or Mahogany Bay gate",
        exactMeetingPointOrPickup:
          "Port of Roatán (Coxen Hole) or Mahogany Bay Outside Gate",
        exactDepartureNote:
          "300-minute (5h) West Bay Beach day break with round-trip port transfer.",
        activityDurationMinutes: 300,
        checkInLeadMinutes: 15,
        transferEachWayByDock: {
          coxen_hole_port_of_roatan: 20,
          mahogany_bay_dixon_cove: 30,
        },
        minimumReturnBufferMinutes: 60,
        listingPriceUsd: 62.54,
        estimatedTaxiRoundTripUsd: 0,
        checkoutUrl:
          "https://www.viator.com/tours/Roatan/Beach-Escape-Plus-Sloth-Sanctuary/d4132-192350P17?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-roatan-192350p17&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
        dockComparisonByDock: {
          coxen_hole_port_of_roatan:
            "20-minute transfer each way between Coxen Hole and West Bay Beach (430m required window).",
          mahogany_bay_dixon_cove:
            "30-minute transfer each way between Mahogany Bay and West Bay Beach through Coxen Hole traffic (465m required window).",
        },
        qualifyNeedsConfirmation: false,
      },
    ],
  },
  "grand-cayman": {
    portSlug: "grand-cayman",
    portName: "George Town, Grand Cayman",
    mainDestination: "grand-cayman",
    timeZone: "America/Cayman",
    utcOffsetString: "-05:00",
    defaultTravelDate: "2027-01-29",
    defaultArrivalTime: "08:00",
    defaultAllAboardTime: "16:00",
    defaultDock: "george_town_royal_watler_tender",
    defaultReturnBufferMinutes: 75,
    question:
      "Which Grand Cayman Stingray City or Seven Mile Beach excursions fit a tender port call at George Town (Royal Watler) versus Spotts Bay?",
    directAnswer:
      "Grand Cayman is a 100% tender port (no cruise ships dock alongside): you must budget 35–45 minutes after anchor drop to take a ship tender ashore to Royal Watler / North / South Terminals in George Town, and return to the tender pier at least 75 minutes before all-aboard (last tender typically departs 45–60 minutes before ship departure). 3.5-hour Stingray City Sandbar, Coral Gardens & Starfish Point tours (5540814P1 at $56 and 477029P1 at $55) pick up directly at the Royal Watler terminal gate and transfer 15–20 minutes to North Sound marinas. When winter Nor'wester swells divert ships to Spotts Bay Landing (20–25 min east of George Town), add 45 minutes of round-trip road transfer and confirm North Sound marine conditions.",
    freeAndSelfGuidedSummary:
      "Free / low-cost self-guided Grand Cayman path: Step off the Royal Watler tender pier into Historic George Town ($0 waterfront walk past Fort George ruins, Heroes Square, and Elmslie Memorial Church) or board the regulated West Bay public minibus (Route WB1/WB2 adjacent to the library, $2.50 USD each way) to free-entry Governor's Beach / Seven Mile Beach public access.",
    dockOptions: [
      {
        dockKey: "george_town_royal_watler_tender",
        dockCode: "GCM-RWT",
        officialName:
          "George Town Harbour — Royal Watler, North & South Tender Terminals",
        disembarkAndWalkMinutes: 40,
        pierOrTenderNotes:
          "100% tender anchorage; allow 40 minutes for morning tender ticket group + boat ride ashore and a mandatory 75-minute return tender queue buffer.",
      },
      {
        dockKey: "spotts_bay_weather_tender",
        dockCode: "GCM-SPT",
        officialName:
          "Spotts Bay Alternative Weather Tender Landing (Nor'wester Swell Diversion)",
        disembarkAndWalkMinutes: 45,
        pierOrTenderNotes:
          "Used when winter northwest swells close George Town Harbour; adds 20–25 minutes of road transfer each way to George Town / Seven Mile Beach / North Sound.",
      },
    ],
    bookingCriticalGapsPrioritized: [
      {
        gapType: "pier_or_tender_timing",
        summary:
          "Grand Cayman is 100% tender-only: requires 40m outbound tender disembarkation and a mandatory 75m return buffer before all-aboard for the afternoon tender line at Royal Watler.",
        status: "verified",
      },
      {
        gapType: "pickup_verification",
        summary:
          "5540814P1 ($56) and 477029P1 ($55) include pier pickup at the Royal Watler terminal dispatch; 10309P3 ($69) includes West Bay Rd / George Town pickup.",
        status: "verified",
      },
      {
        gapType: "exact_departure",
        summary:
          "Winter Nor'wester swells can divert ships to Spotts Bay or trigger Port Authority closure of the Stingray City North Sound sandbar; spot-weather status is marked unknown until morning of call.",
        status: "unknown",
      },
    ],
    unknownFacts: [
      {
        factId: "gcm-unknown-norwester-spotts-diversion-and-sandbar-swell",
        status: "unknown",
        category: "unverified_schedule_or_tariff",
        summary:
          "Day-of Port Authority of the Cayman Islands (PACI) decision to tender at Royal Watler vs. Spotts Bay during winter Nor'wester swells is unknown until morning harbour inspection.",
        impactOnDecision:
          "If your ship diverts to Spotts Bay, add 20–25 minutes each way for road transfer and verify with your operator whether North Sound Stingray City departures are operating.",
        sourceUrl: "https://www.caymanport.com/ship-schedules/",
        checkedOn: "2026-11-06",
      },
    ],
    options: [
      {
        optionId: "gcm-opt-george-town-seven-mile-beach-self-guided",
        productCode: null,
        tourId: null,
        title:
          "Free / Self-Guided George Town Harbourfront Walk & Public Seven Mile Beach Access",
        shortLabel: "Self-Guided George Town & Seven Mile Beach ($0–$5)",
        isFreeOrSelfGuided: true,
        isDayTripChoice: false,
        dayTripDestination: null,
        pickupMode: "public_walk_or_safari_taxi",
        pickupSummary:
          "Step-off walk at Royal Watler Tender Terminal or $2.50 USD public minibus to Governor's Beach",
        exactMeetingPointOrPickup:
          "Royal Watler Tender Terminal -> Fort George Ruins -> Public Minibus Depot (Edward St) -> Seven Mile Beach",
        exactDepartureNote:
          "Flexible self-guided 2.5-hour harbourfront and Seven Mile Beach visit.",
        activityDurationMinutes: 150,
        checkInLeadMinutes: 0,
        transferEachWayByDock: {
          george_town_royal_watler_tender: 12,
          spotts_bay_weather_tender: 28,
        },
        minimumReturnBufferMinutes: 75,
        listingPriceUsd: 0,
        estimatedTaxiRoundTripUsd: 5,
        checkoutUrl: null,
        dockComparisonByDock: {
          george_town_royal_watler_tender:
            "Step directly off the Royal Watler tender apron into downtown George Town; Seven Mile Beach is a 10–12 min public minibus ($2.50 USD) or shared taxi ride north.",
          spotts_bay_weather_tender:
            "From Spotts Bay, allow 25–28 minutes each way by shared taxi to reach George Town and Seven Mile Beach.",
        },
        qualifyNeedsConfirmation: false,
      },
      {
        optionId: "gcm-opt-stingray-sandbar-snorkeling-starfish-5540814p1",
        productCode: "5540814P1",
        tourId: "dcc:tour:viator:5540814P1",
        title:
          "Grand Cayman Stingray Sandbar, Snorkeling and Starfish Point Tour (5540814P1)",
        shortLabel:
          "Stingray Sandbar, Reef & Starfish Point (5540814P1 • 3h 30m • $56)",
        isFreeOrSelfGuided: false,
        isDayTripChoice: false,
        dayTripDestination: null,
        pickupMode: "pier_pickup",
        pickupSummary:
          "Pier pickup at Royal Watler Cruise Terminal dispatch zone included",
        exactMeetingPointOrPickup:
          "Royal Watler Cruise Terminal Excursion Dispatch Tent, George Town, Grand Cayman",
        exactDepartureNote:
          "210-minute (3h 30m) 3-stop North Sound boat tour (Stingray City Sandbar, Coral Reef snorkel, and Starfish Point) with round-trip port transfer.",
        activityDurationMinutes: 210,
        checkInLeadMinutes: 15,
        transferEachWayByDock: {
          george_town_royal_watler_tender: 15,
          spotts_bay_weather_tender: 30,
        },
        minimumReturnBufferMinutes: 75,
        listingPriceUsd: 56,
        estimatedTaxiRoundTripUsd: 0,
        checkoutUrl:
          "https://www.viator.com/tours/Grand-Cayman/3-Stop-Stingray-City-Adventure-Grand-Cayman/d50485-5540814P1?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-grand-cayman-5540814p1&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
        dockComparisonByDock: {
          george_town_royal_watler_tender:
            "Meets directly at Royal Watler tender terminal (370m total required window including 40m morning tender and 75m return tender buffer).",
          spotts_bay_weather_tender:
            "If diverted to Spotts Bay, allow 405m total window and confirm pickup re-routing with operator.",
        },
        qualifyNeedsConfirmation: false,
      },
      {
        optionId: "gcm-opt-stingray-coral-gardens-starfish-477029p1",
        productCode: "477029P1",
        tourId: "dcc:tour:viator:477029P1",
        title:
          "Stingray City Sandbar, Coral Gardens and Starfish Point from Grand Cayman (477029P1)",
        shortLabel:
          "Stingray City, Coral Gardens & Starfish Point (477029P1 • 3h 30m • $55)",
        isFreeOrSelfGuided: false,
        isDayTripChoice: false,
        dayTripDestination: null,
        pickupMode: "pier_pickup",
        pickupSummary:
          "Pier pickup at George Town tender terminal included",
        exactMeetingPointOrPickup:
          "George Town Cruise Tender Terminal (Royal Watler / North Terminal), Grand Cayman",
        exactDepartureNote:
          "210-minute (3h 30m) 3-stop North Sound excursion with round-trip shuttle from the tender pier.",
        activityDurationMinutes: 210,
        checkInLeadMinutes: 15,
        transferEachWayByDock: {
          george_town_royal_watler_tender: 15,
          spotts_bay_weather_tender: 30,
        },
        minimumReturnBufferMinutes: 75,
        listingPriceUsd: 55,
        estimatedTaxiRoundTripUsd: 0,
        checkoutUrl:
          "https://www.viator.com/tours/Grand-Cayman/3-Stop-Stingray-City-Tour/d50485-477029P1?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-grand-cayman-477029p1&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
        dockComparisonByDock: {
          george_town_royal_watler_tender:
            "Fits 6.5+ hour George Town tender calls (370m required window including 75m return tender queue buffer).",
          spotts_bay_weather_tender:
            "Requires 405m total window if ship tenders at Spotts Bay.",
        },
        qualifyNeedsConfirmation: false,
      },
      {
        optionId: "gcm-opt-stingray-city-starfish-experience-10309p3",
        productCode: "10309P3",
        tourId: "dcc:tour:viator:10309P3",
        title: "Grand Cayman Stingray City and Starfish Experience (10309P3)",
        shortLabel:
          "Stingray City & Starfish Experience (10309P3 • 3h 30m • $69)",
        isFreeOrSelfGuided: false,
        isDayTripChoice: false,
        dayTripDestination: null,
        pickupMode: "hotel_pickup",
        pickupSummary:
          "George Town port / Seven Mile Beach pickup included",
        exactMeetingPointOrPickup:
          "Royal Watler Terminal Gate / Seven Mile Beach Pickup Zone, Grand Cayman",
        exactDepartureNote:
          "210-minute (3h 30m) Stingray City and two snorkeling stops with transport.",
        activityDurationMinutes: 210,
        checkInLeadMinutes: 15,
        transferEachWayByDock: {
          george_town_royal_watler_tender: 15,
          spotts_bay_weather_tender: 30,
        },
        minimumReturnBufferMinutes: 75,
        listingPriceUsd: 69,
        estimatedTaxiRoundTripUsd: 0,
        checkoutUrl:
          "https://www.viator.com/tours/Grand-Cayman/Stingray-City-With-Two-Snorkeling-Stops-Grand-Cayman/d50485-10309P3?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-grand-cayman-10309p3&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
        dockComparisonByDock: {
          george_town_royal_watler_tender:
            "Fits 6.5+ hour George Town calls (370m required window).",
          spotts_bay_weather_tender:
            "Requires 405m total window if diverted to Spotts Bay.",
        },
        qualifyNeedsConfirmation: false,
      },
    ],
  },
};

/**
 * Evaluates any of the 5 winter release ports (`st-thomas`, `nassau`, `cozumel`,
 * `roatan`, `grand-cayman`) using St. Thomas as the unified model.
 */
export function evaluateWinterPortDayScenario(
  rawInput: WinterPortScenarioInput,
): WinterPortEvaluationResult {
  if (rawInput.portSlug === "st-thomas") {
    const sttDock: StThomasArrivalDock =
      rawInput.arrivalDock === "crown_bay" ||
      rawInput.arrivalDock === "charlotte_amalie_tender" ||
      rawInput.arrivalDock === "unknown_dock" ||
      rawInput.arrivalDock === "havensight_wico"
        ? rawInput.arrivalDock
        : "havensight_wico";

    const sttRes = evaluateStThomasPortDayScenario({
      travelDate: rawInput.travelDate ?? "2027-01-28",
      shipArrivalTime: rawInput.shipArrivalTime ?? "08:00",
      allAboardTime: rawInput.allAboardTime ?? "16:30",
      arrivalDock: sttDock,
      adults: rawInput.adults ?? 2,
      childAges: rawInput.childAges ?? [],
      returnBufferMinutes: rawInput.returnBufferMinutes ?? 60,
    });

    const mapOpt = (
      o: StThomasPortDayEvaluationResult["allOptions"][number],
    ): WinterPortEvaluatedOption => ({
      optionId: o.optionId,
      productCode: o.productCode,
      tourId: o.tourId,
      title: o.title,
      shortLabel: o.shortLabel,
      isFreeOrSelfGuided: o.isFreeOrSelfGuided,
      isDayTripChoice: o.isDayTripChoice,
      dayTripDestination: o.dayTripDestination,
      pickupMode: o.pickupMode,
      pickupSummary: o.pickupSummary,
      exactMeetingPointOrPickup: o.exactMeetingPointOrPickup,
      exactDepartureNote:
        o.optionId === "stt-opt-st-john-trunk-bay-red-hook-ferry" && o.ferryLegs
          ? `Outbound Red Hook -> Cruz Bay: ${o.ferryLegs.outboundLeg.selectedDepartureTime ?? "N/A"}; Target Cruz Bay -> Red Hook return: ${o.ferryLegs.returnLeg.selectedReturnDepartureTime ?? "N/A"} (${o.ferryLegs.statusLabel})`
          : `Earliest shore ready ${o.timing.earliestShoreReadyTime} AST; activity duration ${o.timing.activityDurationMinutes} min`,
      activityDurationMinutes: o.timing.activityDurationMinutes,
      listingPriceUsd: o.listingPriceUsd,
      estimatedCostPerAdultUsd: o.estimatedCostPerAdultUsd,
      estimatedCostTotalPartyUsd: o.estimatedCostTotalPartyUsd,
      checkoutUrl: o.checkoutUrl,
      fitStatus: o.fitStatus,
      fitBadgeLabel: o.fitBadgeLabel,
      conciseVerdict: o.conciseVerdict,
      dockComparisonNote: o.dockComparisonNote,
      timing: {
        timeZone: o.timing.timeZone,
        utcOffsetString: o.timing.utcOffsetString,
        shipArrivalTime: o.timing.shipArrivalTime,
        allAboardTime: o.timing.allAboardTime,
        totalPortWindowMinutes: o.timing.totalPortWindowMinutes,
        disembarkationAndPierWalkMinutes: o.timing.disembarkationMinutes,
        checkInLeadMinutes: o.timing.checkInLeadMinutes,
        outboundTransferMinutes: o.timing.outboundTransferMinutes,
        activityDurationMinutes: o.timing.activityDurationMinutes,
        returnTransferMinutes: o.timing.returnTransferMinutes,
        requiredReturnBufferMinutes: o.timing.requiredReturnBufferMinutes,
        totalRequiredMinutes: o.timing.totalRequiredMinutes,
        netMarginMinutes: o.timing.netMarginMinutes,
        earliestShoreReadyTime: o.timing.earliestShoreReadyTime,
        estimatedBackAtPierTime: o.timing.estimatedBackAtPierTime,
        targetAllAboardCutoffTime: o.timing.targetAllAboardCutoffTime,
      },
      unknownFactsForOption: o.unknownFactsForOption,
      commercialWeightApplied: 0,
    });

    return {
      portSlug: "st-thomas",
      portName: "St. Thomas, U.S. Virgin Islands",
      mainDestination: "st-thomas",
      timeZone: "America/St_Thomas",
      utcOffsetString: "-04:00",
      evaluatedInput: {
        travelDate: sttRes.evaluatedInput.travelDate ?? "2026-12-10",
        shipArrivalTime: sttRes.evaluatedInput.shipArrivalTime,
        allAboardTime: sttRes.evaluatedInput.allAboardTime,
        arrivalDock: sttRes.evaluatedInput.arrivalDock,
        adults: sttRes.evaluatedInput.adults,
        childAges: sttRes.evaluatedInput.childAges,
        returnBufferMinutes: sttRes.evaluatedInput.returnBufferMinutes,
      },
      publicAnswer: {
        question: sttRes.publicAnswer.question,
        directAnswer: sttRes.publicAnswer.directAnswer,
        freeAndSelfGuidedSummary: sttRes.publicAnswer.freeAndSelfGuidedSummary,
        dockOptions: [
          {
            dockCode: "WICO",
            officialName: "West Indian Company Dock (Havensight)",
            pierOrTenderNotes:
              "20–25 min east to Mangrove Lagoon (6526 Estate Nadir) and Red Hook Ferry; walkable 1.5 mi to downtown Charlotte Amalie.",
          },
          {
            dockCode: "AMSS / AMNS",
            officialName:
              "Austin 'Babe' Monsanto Marine Terminal (Crown Bay Cruise Dock)",
            pierOrTenderNotes:
              "5–8 min taxi to free-entry Lindbergh Bay (Emerald Beach); 35–45 min cross-island taxi to Red Hook or Mangrove Lagoon.",
          },
          {
            dockCode: "IANCH / OANCH",
            officialName: "Charlotte Amalie Harbor Inner / Outer Anchorage (Tender)",
            pierOrTenderNotes:
              "35 min tender queue/transit directly onto the historic downtown Charlotte Amalie waterfront.",
          },
        ],
      },
      conciseVerdict: sttRes.conciseVerdict,
      bookingCriticalGapsPrioritized: [
        {
          gapType: "pier_or_tender_timing",
          summary:
            "Havensight (WICO) vs. Crown Bay (AMSS/AMNS) changes East End transfer times to Mangrove Lagoon (6526 Estate Nadir) and Red Hook Ferry by 15–20 minutes each way.",
          status: "verified",
        },
        {
          gapType: "pickup_verification",
          summary:
            "5199KSML (150m, $89) and 5199P27 (180m, $99) are strictly separate self_drive listings meeting at 6526 Estate Nadir (no port pickup); 5199PRTSTTKSML (210m, $79) includes round-trip transport.",
          status: "verified",
        },
        {
          gapType: "exact_departure",
          summary:
            "St. John is offered as a day-trip choice when both Red Hook <-> Cruz Bay ferry legs fit; temporary VIPA notice ended October 31, so post-Oct 31 return legs show 'Needs confirmation' until VIPA publishes the replacement winter return schedule.",
          status: "needs_confirmation",
        },
      ],
      recommendedOptions: sttRes.recommendedOptions.map(mapOpt),
      eliminatedOptions: sttRes.eliminatedOptions.map(mapOpt),
      allOptions: sttRes.allOptions.map(mapOpt),
      unknownFacts: sttRes.unknownFacts,
      stThomasDetail: sttRes,
      commercialNeutrality: sttRes.commercialNeutrality,
    };
  }

  const spec = NON_ST_THOMAS_WINTER_PORT_SPECS[rawInput.portSlug];
  const travelDate =
    rawInput.travelDate && rawInput.travelDate.trim() !== ""
      ? rawInput.travelDate.trim()
      : spec.defaultTravelDate;
  const shipArrivalTime = rawInput.shipArrivalTime || spec.defaultArrivalTime;
  const allAboardTime = rawInput.allAboardTime || spec.defaultAllAboardTime;
  const validDockKeys = spec.dockOptions.map((d) => d.dockKey);
  const arrivalDock =
    rawInput.arrivalDock && validDockKeys.includes(rawInput.arrivalDock)
      ? rawInput.arrivalDock
      : spec.defaultDock;
  const adults = Math.max(1, Number(rawInput.adults ?? 2));
  const childAges = Array.isArray(rawInput.childAges) ? rawInput.childAges : [];
  const returnBufferMinutes = Math.max(
    30,
    Number(rawInput.returnBufferMinutes ?? spec.defaultReturnBufferMinutes),
  );

  const arrivalMin = parseHmToMinutes(shipArrivalTime) ?? 8 * 60;
  const allAboardMin = parseHmToMinutes(allAboardTime) ?? 16 * 60 + 30;
  const totalPortWindowMinutes = Math.max(0, allAboardMin - arrivalMin);

  const dockObj =
    spec.dockOptions.find((d) => d.dockKey === arrivalDock) ??
    spec.dockOptions[0]!;
  const disembarkAndWalkMinutes = dockObj.disembarkAndWalkMinutes;

  const allOptions: WinterPortEvaluatedOption[] = spec.options.map((o) => {
    const outboundTransferMinutes =
      o.transferEachWayByDock[arrivalDock] ??
      Object.values(o.transferEachWayByDock)[0] ??
      20;
    const returnTransferMinutes = outboundTransferMinutes;
    const requiredReturnBufferMinutes = Math.max(
      returnBufferMinutes,
      o.minimumReturnBufferMinutes,
    );
    const totalRequiredMinutes =
      disembarkAndWalkMinutes +
      o.checkInLeadMinutes +
      outboundTransferMinutes +
      o.activityDurationMinutes +
      returnTransferMinutes +
      requiredReturnBufferMinutes;
    const netMarginMinutes = totalPortWindowMinutes - totalRequiredMinutes;

    const shoreReadyMin = arrivalMin + disembarkAndWalkMinutes;
    const estimatedBackAtPierMin =
      shoreReadyMin +
      o.checkInLeadMinutes +
      outboundTransferMinutes +
      o.activityDurationMinutes +
      returnTransferMinutes;
    const cutoffMin = allAboardMin - requiredReturnBufferMinutes;

    const totalGuests = adults + childAges.length;
    const perAdultUsd = Number(
      (o.listingPriceUsd + o.estimatedTaxiRoundTripUsd).toFixed(2),
    );
    const totalPartyUsd = Number((perAdultUsd * totalGuests).toFixed(2));

    let fitStatus: WinterPortFitStatus;
    let fitBadgeLabel: string;
    let conciseVerdict: string;

    if (netMarginMinutes < 0) {
      fitStatus = "does_not_fit";
      fitBadgeLabel = "Does Not Fit Ship Window";
      conciseVerdict = `Requires ${totalRequiredMinutes} min (${(totalRequiredMinutes / 60).toFixed(1)} hrs) including ${disembarkAndWalkMinutes}m pier/tender exit, ${outboundTransferMinutes}m each-way transfer, and ${requiredReturnBufferMinutes}m return buffer — exceeds your ${totalPortWindowMinutes}m port window by ${Math.abs(netMarginMinutes)} min.`;
    } else if (o.qualifyNeedsConfirmation) {
      fitStatus = "qualified_needs_confirmation";
      fitBadgeLabel = "Needs confirmation";
      conciseVerdict = `${o.qualificationReason ?? "Requires departure/return confirmation."} Net margin: +${netMarginMinutes} min.`;
    } else if (netMarginMinutes < 40) {
      fitStatus = "tight_buffer";
      fitBadgeLabel = "Tight Buffer (< 40 min Slack)";
      conciseVerdict = `Fits with +${netMarginMinutes} min slack beyond your ${requiredReturnBufferMinutes}m return buffer; clear the pier by ${formatMinutesToHm(shoreReadyMin)}.`;
    } else {
      fitStatus = "fits_comfortably";
      fitBadgeLabel = "Fits Comfortably";
      conciseVerdict = `Fits comfortably from ${dockObj.officialName} with +${netMarginMinutes} min slack beyond your ${requiredReturnBufferMinutes}m all-aboard buffer (estimated back at pier by ${formatMinutesToHm(estimatedBackAtPierMin)}).`;
    }

    return {
      optionId: o.optionId,
      productCode: o.productCode,
      tourId: o.tourId,
      title: o.title,
      shortLabel: o.shortLabel,
      isFreeOrSelfGuided: o.isFreeOrSelfGuided,
      isDayTripChoice: o.isDayTripChoice,
      dayTripDestination: o.dayTripDestination,
      pickupMode: o.pickupMode,
      pickupSummary: o.pickupSummary,
      exactMeetingPointOrPickup: o.exactMeetingPointOrPickup,
      exactDepartureNote: o.exactDepartureNote,
      activityDurationMinutes: o.activityDurationMinutes,
      listingPriceUsd: o.listingPriceUsd,
      estimatedCostPerAdultUsd: perAdultUsd,
      estimatedCostTotalPartyUsd: totalPartyUsd,
      checkoutUrl: o.checkoutUrl,
      fitStatus,
      fitBadgeLabel,
      conciseVerdict,
      dockComparisonNote:
        o.dockComparisonByDock[arrivalDock] ??
        Object.values(o.dockComparisonByDock)[0] ??
        "",
      timing: {
        timeZone: spec.timeZone,
        utcOffsetString: spec.utcOffsetString,
        shipArrivalTime,
        allAboardTime,
        totalPortWindowMinutes,
        disembarkationAndPierWalkMinutes: disembarkAndWalkMinutes,
        checkInLeadMinutes: o.checkInLeadMinutes,
        outboundTransferMinutes,
        activityDurationMinutes: o.activityDurationMinutes,
        returnTransferMinutes,
        requiredReturnBufferMinutes,
        totalRequiredMinutes,
        netMarginMinutes,
        earliestShoreReadyTime: formatMinutesToHm(shoreReadyMin),
        estimatedBackAtPierTime: formatMinutesToHm(estimatedBackAtPierMin),
        targetAllAboardCutoffTime: formatMinutesToHm(cutoffMin),
      },
      unknownFactsForOption: spec.unknownFacts,
      commercialWeightApplied: 0,
    };
  });

  const fitOrder: Record<WinterPortFitStatus, number> = {
    fits_comfortably: 1,
    qualified_needs_confirmation: 2,
    tight_buffer: 3,
    does_not_fit: 4,
  };

  const recommendedOptions = allOptions
    .filter((o) => o.fitStatus !== "does_not_fit")
    .sort((a, b) => {
      const diff = fitOrder[a.fitStatus] - fitOrder[b.fitStatus];
      if (diff !== 0) return diff;
      return b.timing.netMarginMinutes - a.timing.netMarginMinutes;
    });

  const eliminatedOptions = allOptions.filter(
    (o) => o.fitStatus === "does_not_fit",
  );
  const topOption = recommendedOptions[0] ?? null;

  return {
    portSlug: spec.portSlug,
    portName: spec.portName,
    mainDestination: spec.mainDestination,
    timeZone: spec.timeZone,
    utcOffsetString: spec.utcOffsetString,
    evaluatedInput: {
      travelDate,
      shipArrivalTime,
      allAboardTime,
      arrivalDock,
      adults,
      childAges,
      returnBufferMinutes,
    },
    publicAnswer: {
      question: spec.question,
      directAnswer: spec.directAnswer,
      freeAndSelfGuidedSummary: spec.freeAndSelfGuidedSummary,
      dockOptions: spec.dockOptions.map((d) => ({
        dockCode: d.dockCode,
        officialName: d.officialName,
        pierOrTenderNotes: d.pierOrTenderNotes,
      })),
    },
    conciseVerdict: topOption
      ? `For your ${(totalPortWindowMinutes / 60).toFixed(1)}-hour ${spec.portName} call (${shipArrivalTime}–${allAboardTime}) at ${dockObj.officialName}, ${recommendedOptions.length} of ${allOptions.length} options fit your ship window. Top fit: ${topOption.shortLabel} (${topOption.fitBadgeLabel}, +${topOption.timing.netMarginMinutes}m slack).`
      : `No excursion fits your ${(totalPortWindowMinutes / 60).toFixed(1)}-hour ${spec.portName} window without violating the ${returnBufferMinutes}m return buffer.`,
    bookingCriticalGapsPrioritized: spec.bookingCriticalGapsPrioritized,
    recommendedOptions,
    eliminatedOptions,
    allOptions,
    unknownFacts: spec.unknownFacts,
    commercialNeutrality: {
      commercialWeightAppliedToRanking: 0,
      includesFreeOrSelfGuidedOption: true,
      humanFactApprovalRequired: true,
    },
  };
}

/**
 * Evaluates all five winter ports for the five-port winter release.
 */
export function evaluateAllFiveWinterPorts(
  overridesByPort?: Partial<Record<WinterReleasePortSlug, Partial<WinterPortScenarioInput>>>,
): Record<WinterReleasePortSlug, WinterPortEvaluationResult> {
  return {
    "st-thomas": evaluateWinterPortDayScenario({
      portSlug: "st-thomas",
      ...(overridesByPort?.["st-thomas"] ?? {}),
    }),
    nassau: evaluateWinterPortDayScenario({
      portSlug: "nassau",
      ...(overridesByPort?.nassau ?? {}),
    }),
    cozumel: evaluateWinterPortDayScenario({
      portSlug: "cozumel",
      ...(overridesByPort?.cozumel ?? {}),
    }),
    roatan: evaluateWinterPortDayScenario({
      portSlug: "roatan",
      ...(overridesByPort?.roatan ?? {}),
    }),
    "grand-cayman": evaluateWinterPortDayScenario({
      portSlug: "grand-cayman",
      ...(overridesByPort?.["grand-cayman"] ?? {}),
    }),
  };
}
