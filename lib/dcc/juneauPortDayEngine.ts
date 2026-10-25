import {
  loadPermittedThirdPartyReviewCacheForProduct,
  summarizeRecentReviews,
  type RecentReviewSummaryResult,
  type ThirdPartyReviewInput,
} from "@/lib/dcc/guestFeedback";
import {
  evaluateNodeClaimDependencies,
  getBaseTravelReferenceNodeById,
  type ClaimEvidenceStatus,
  type EvaluatedCitationFreshness,
  type TravelReferenceNode,
} from "@/lib/dcc/travelReference";

export type JuneauArrivalDock =
  | "downtown_walkoff"
  | "franklin_dock"
  | "aj_dock"
  | "tender_anchor"
  | "unknown_dock"
  | "independent_air_ferry";

export type JuneauGoalMode =
  | "any_single_or_combo"
  | "single_activity_focus"
  | "two_activity_combo"
  | "public_or_free_only";

export type JuneauMobilityLevel =
  | "unspecified"
  | "step_free_wheelchair"
  | "light_walking_1mi"
  | "active_walking_3mi";

export type JuneauWeatherInputState =
  | "unknown_or_forecast_only"
  | "clear_high_ceiling"
  | "low_ceiling_rain_fog"
  | "provider_telemetry_unavailable";

export type JuneauPortDayScenarioInput = {
  shipArrivalTime: string; // HH:MM in America/Juneau
  allAboardTime: string; // HH:MM in America/Juneau
  arrivalDock: JuneauArrivalDock;
  goalMode: JuneauGoalMode;
  travelMonth?: number; // 1..12, derived from travelDate when travelDate is supplied
  travelDate?: string | null; // YYYY-MM-DD in America/Juneau
  overnightPortCall?: boolean; // true only when ship remains in port past midnight into next day
  partySize?: number; // default 2
  mobilityLevel?: JuneauMobilityLevel; // default "unspecified"
  returnBufferMinutes?: number; // default 90 for cruise, 0 for independent
  weatherCondition?: JuneauWeatherInputState;
  budgetMaxPerPersonUsd?: number | null;
};

export type JuneauOptionCategory =
  | "public_free_or_municipal"
  | "direct_operator_shuttle"
  | "guided_single_activity"
  | "two_activity_combo";

export type JuneauFactBasisType =
  | "sourced_fact"
  | "operator_estimate"
  | "dcc_estimate"
  | "traveler_assumption";

export type JuneauOptionFactAuditEntry = {
  field:
    | "price"
    | "activity_duration"
    | "transfers"
    | "meeting_point"
    | "check_in_deadline"
    | "operating_season"
    | "accessibility"
    | "booking_and_cancellation";
  label: string;
  valueSummary: string;
  basisType: JuneauFactBasisType;
  citationIds: string[];
  verificationNote: string;
};

export type JuneauDurationAudit = {
  advertisedDockToDockMinutes: number;
  onSiteOrOnWaterActivityMinutes: number;
  checkInLeadMinutes: number;
  outboundTransferMinutes: number;
  interActivityTransferMinutes: number;
  returnTransferMinutes: number;
  doubleCountingStatus: "verified_not_double_counted";
  decompositionNote: string;
};

export type JuneauBookingChannelOption = {
  channelType:
    | "public_free"
    | "direct_operator"
    | "specialist_comparison"
    | "affiliate_partner";
  label: string;
  operatorOrProviderName: string;
  url: string;
  relationshipDisclosure: string;
  isCommercialPartner: boolean;
  commissionInfluenceOnRanking: 0;
};

export type JuneauOptionBookingTransparency = {
  actualOperators: string[];
  inclusions: string[];
  exclusions: string[];
  durationLabel: string;
  meetingArrangements: string;
  priceBasis: string;
  indicativePriceRangePerPersonUsd: { min: number; max: number };
  cancellationConditions: string;
  detailsVerifiedAt: string;
  detailsFreshnessNote: string;
  channels: JuneauBookingChannelOption[];
};

export type JuneauEvaluatedOptionFit =
  | "fits_comfortably"
  | "tight_buffer"
  | "does_not_fit"
  | "withdrawn_or_qualified_evidence";

export type JuneauTimezoneResolution = {
  timeZone: "America/Juneau";
  referenceDateIso: string;
  tzAbbreviation: "AKDT" | "AKST";
  utcOffsetString: "-08:00" | "-09:00";
  utcOffsetMinutes: -480 | -540;
  isDaylightSavingTime: boolean;
  isDstTransitionDate: boolean;
  dstTransitionAdjustmentMinutes: number;
  dstTransitionNote: string | null;
};

export type JuneauTimingBreakdown = {
  timezone: "America/Juneau";
  tzAbbreviation: "AKDT" | "AKST";
  utcOffsetString: "-08:00" | "-09:00";
  shipArrivalTime: string;
  allAboardTime: string;
  overnightPortCall: boolean;
  totalPortWindowMinutes: number;
  disembarkationAndDockMinutes: number;
  checkInLeadMinutes: number;
  outboundTransferMinutes: number;
  activityDurationMinutes: number;
  interActivityTransferMinutes: number;
  returnTransferMinutes: number;
  returnDockQueueMinutes: number;
  requiredReturnBufferMinutes: number;
  totalRequiredMinutes: number;
  netMarginMinutes: number;
  earliestShoreReadyTime: string;
  latestCheckInTime: string;
  estimatedBackAtDockTime: string;
  targetAllAboardBufferCutoffTime: string;
  durationAudit: JuneauDurationAudit;
  mathematicalFeasibilityDisclaimer: string;
};

export type JuneauEvaluatedDecisionOption = {
  optionId: string;
  title: string;
  shortLabel: string;
  category: JuneauOptionCategory;
  corridor: string;
  fitStatus: JuneauEvaluatedOptionFit;
  fitBadgeLabel: string;
  conciseVerdict: string;
  timing: JuneauTimingBreakdown;
  inputAudit: JuneauOptionFactAuditEntry[];
  operationalGuaranteeSeparation: {
    fitsTimeBudget: boolean;
    confirmedOperationGuaranteed: false;
    ticketAvailabilityGuaranteed: false;
    accessibilityConfirmedForTraveler: boolean;
    guaranteedShipReturn: false;
    separationStatement: string;
  };
  hardConstraintViolations: string[];
  supportedReasonsAndTradeoffs: string[];
  assumptionsUsed: string[];
  uncertainOrNeedsConfirmation: string[];
  whatInputChangeWouldAlterResult: string[];
  dependsOnCitationIds: string[];
  supportingCitations: Array<{
    citationId: string;
    sourceTitle: string;
    issuingOrganization: string;
    sourceUrl: string;
    evidenceStatus: ClaimEvidenceStatus;
    verifiedAt: string | null;
  }>;
  evidenceQualificationNote: string | null;
  recentReviewSummary: RecentReviewSummaryResult;
  bookingTransparency: JuneauOptionBookingTransparency;
  rankingAudit: {
    fitTierScore: number;
    netMarginMinutes: number;
    commercialWeight: 0;
    rankingExplanation: string;
  };
};

export type JuneauPortDayEvaluationResult = {
  evaluatedAt: string;
  timezone: "America/Juneau";
  timezoneResolution: JuneauTimezoneResolution;
  inputValidationErrors: string[];
  normalizedInput: Required<
    Omit<JuneauPortDayScenarioInput, "travelDate" | "budgetMaxPerPersonUsd">
  > & {
    travelDate: string | null;
    budgetMaxPerPersonUsd: number | null;
  };
  shareableQueryString: string;
  conciseBottomLine: string;
  weatherAndTelemetryAdvisory: {
    inputState: JuneauWeatherInputState;
    status:
      | "normal_uncertainty"
      | "low_ceiling_caution"
      | "telemetry_unavailable_limitation";
    headline: string;
    explanation: string;
    neverAllClearRule: string;
  };
  evidenceHealth: {
    hasWithdrawnOrConflictedClaims: boolean;
    recommendedCacheControl: string;
    citationFreshness: Record<string, EvaluatedCitationFreshness>;
  };
  coverageDisclosures: {
    includedOptionTypes: string[];
    coverageLimits: string[];
    commercialIndependenceStatement: string;
  };
  options: JuneauEvaluatedDecisionOption[];
};

const DOCK_CONFIG: Record<
  JuneauArrivalDock,
  {
    label: string;
    disembarkMinutes: number;
    returnQueueMinutes: number;
    basisType: JuneauFactBasisType;
    assumptionText: string;
  }
> = {
  downtown_walkoff: {
    label: "Downtown Walk-Off Berth (AS / Cruise Terminal CTF)",
    disembarkMinutes: 20,
    returnQueueMinutes: 5,
    basisType: "dcc_estimate",
    assumptionText:
      "DCC estimate based on CBJ Docks & Harbors geometry: 20 min ship gangway clearance at AS/CTF directly onto Marine Park seawalk and 5 min security re-boarding queue.",
  },
  franklin_dock: {
    label: "South Franklin Dock (FKL — 0.4 mi south of Marine Park)",
    disembarkMinutes: 25,
    returnQueueMinutes: 10,
    basisType: "dcc_estimate",
    assumptionText:
      "DCC estimate based on CBJ South Franklin dock geometry: 25 min walk-off + 0.4 mi boardwalk walk to Marine Park kiosks and 10 min return walk/security queue.",
  },
  aj_dock: {
    label: "AJ Dock (1.2 mi south via shuttle loop)",
    disembarkMinutes: 35,
    returnQueueMinutes: 20,
    basisType: "dcc_estimate",
    assumptionText:
      "DCC estimate based on CBJ AJ Dock location (1.2 mi south of Marine Park): 35 min disembarkation + dock shuttle loop to downtown and 20 min return shuttle queue.",
  },
  tender_anchor: {
    label: "Anchored in Gastineau Channel (Tendering Ashore)",
    disembarkMinutes: 50,
    returnQueueMinutes: 40,
    basisType: "dcc_estimate",
    assumptionText:
      "DCC estimate for Gastineau Channel anchorage: 50 min outbound tender ticket/boat transfer to Marine Park and 40 min return tender queue before all-aboard.",
  },
  unknown_dock: {
    label: "Unknown Berth / Not Yet Confirmed (Conservative Envelope)",
    disembarkMinutes: 50,
    returnQueueMinutes: 40,
    basisType: "dcc_estimate",
    assumptionText:
      "Berth unconfirmed: DCC does NOT assume a fast downtown walk-off when your dock is unknown. Applies conservative 50 min outbound and 40 min return tender/shuttle allowance until berth is verified.",
  },
  independent_air_ferry: {
    label: "Independent Traveler (Arriving via JNU Airport or AMHS Ferry)",
    disembarkMinutes: 0,
    returnQueueMinutes: 0,
    basisType: "traveler_assumption",
    assumptionText:
      "Independent non-cruise schedule: no ship gangway disembarkation or tender queue.",
  },
};

export type RawJuneauOptionDefinition = {
  optionId: string;
  title: string;
  shortLabel: string;
  category: JuneauOptionCategory;
  corridor: string;
  viatorProductCode: string | null;
  advertisedDockToDockMinutes: number;
  checkInLeadMinutes: number;
  outboundTransferMinutes: number;
  activityDurationMinutes: number;
  interActivityTransferMinutes: number;
  returnTransferMinutes: number;
  decompositionNote: string;
  operatingMonths: number[];
  minimumMobility: Exclude<JuneauMobilityLevel, "unspecified">;
  weatherCeilingSensitive: boolean;
  dependsOnCitationIds: string[];
  inputAudit: JuneauOptionFactAuditEntry[];
  supportedReasonsAndTradeoffs: string[];
  baseAssumptions: string[];
  baseUncertainties: string[];
  bookingTransparency: JuneauOptionBookingTransparency;
};

/**
 * Production definitions for the 7 Juneau port-day options.
 * Contains ZERO invented or sample review records. In production, review summaries
 * are loaded strictly from the verified local review cache (`data/viator-reviews/{code}.json`).
 */
export const JUNEAU_OPTION_DEFINITIONS: RawJuneauOptionDefinition[] = [
  {
    optionId: "jun-opt-usfs-mendenhall-shuttle",
    title:
      "Mendenhall Glacier Recreation Area via Permitted Express Shuttle or Direct Taxi",
    shortLabel: "Mendenhall Glacier (Shuttle / Direct)",
    category: "direct_operator_shuttle",
    corridor: "Mendenhall Valley (12 mi NW)",
    viatorProductCode: "5849JNU_MEND",
    advertisedDockToDockMinutes: 185,
    checkInLeadMinutes: 15,
    outboundTransferMinutes: 25,
    activityDurationMinutes: 120,
    interActivityTransferMinutes: 0,
    returnTransferMinutes: 25,
    decompositionNote:
      "Total 185 min (3h 05m) dock-to-dock is decomposed into 15m dock kiosk boarding + 25m outbound Glacier Hwy transfer + 120m self-paced on-site USFS trail/Visitor Center time + 25m return transfer. Transfer and boarding time are excluded from the 120m on-site figure so they are never double-counted.",
    operatingMonths: [5, 6, 7, 8, 9, 10],
    minimumMobility: "step_free_wheelchair",
    weatherCeilingSensitive: false,
    dependsOnCitationIds: ["jun-usfs-mendenhall", "jun-cbj-harbors"],
    inputAudit: [
      {
        field: "price",
        label: "Admission & Transfer Cost",
        valueSummary:
          "$5 USFS Visitor Center fee (outdoor trails $0) + ~$45–$80/person round-trip commercial shuttle or metered taxi",
        basisType: "sourced_fact",
        citationIds: ["jun-usfs-mendenhall"],
        verificationNote:
          "$5 USFS Tongass Visitor Center fee is a sourced federal fee; $45–$80 round-trip shuttle/taxi range is an operator/market estimate depending on vehicle type.",
      },
      {
        field: "activity_duration",
        label: "On-Site Activity Duration",
        valueSummary:
          "120 min on-site (excludes 50m round-trip transfer and 15m kiosk boarding; 185 min total dock-to-dock)",
        basisType: "dcc_estimate",
        citationIds: ["jun-usfs-mendenhall"],
        verificationNote:
          "120 min on-site allows Photo Point (0.3 mi), Steep Creek boardwalk (0.25 mi), or Nugget Falls (2.0 mi RT) without double-counting the 50m highway transfer.",
      },
      {
        field: "transfers",
        label: "Corridor Transfer Time",
        valueSummary:
          "25 min each way (12.0 miles via Egan Drive / Glacier Highway between downtown Marine Park and Mendenhall Visitor Center lot)",
        basisType: "dcc_estimate",
        citationIds: ["jun-usfs-mendenhall", "jun-cbj-harbors"],
        verificationNote:
          "Direct drop-off at the USFS commercial lot; avoids the 1.5-mile municipal bus walk gap.",
      },
      {
        field: "meeting_point",
        label: "Meeting Point",
        valueSummary:
          "Marine Park / Goldbelt Tramway plaza tour booths or downtown taxi stand",
        basisType: "sourced_fact",
        citationIds: ["jun-cbj-harbors"],
        verificationNote:
          "CBJ Docks & Harbors designates Marine Park/Tramway lot for permitted commercial shuttle staging.",
      },
      {
        field: "check_in_deadline",
        label: "Check-In & Boarding Lead Time",
        valueSummary: "15 min prior to shuttle departure at downtown kiosk",
        basisType: "operator_estimate",
        citationIds: ["jun-cbj-harbors"],
        verificationNote:
          "Standard dock kiosk voucher exchange and motorcoach loading window.",
      },
      {
        field: "operating_season",
        label: "Operating Season",
        valueSummary:
          "May–October for permitted commercial visitor shuttles (Visitor Center open summer daily May–Sep; winter Fri–Sun)",
        basisType: "sourced_fact",
        citationIds: ["jun-usfs-mendenhall"],
        verificationNote:
          "Verified against USFS Tongass National Forest Mendenhall Visitor Center seasonal schedule.",
      },
      {
        field: "accessibility",
        label: "Mobility & Accessibility",
        valueSummary:
          "Step-free wheelchair accessible at Visitor Center (elevator) and Steep Creek Boardwalk (0.25 mi); Nugget Falls (2.0 mi) is unpaved gravel",
        basisType: "sourced_fact",
        citationIds: ["jun-usfs-mendenhall"],
        verificationNote:
          "USFS maintains ADA access to the Visitor Center viewing plaza and Steep Creek salmon viewing boardwalk.",
      },
      {
        field: "booking_and_cancellation",
        label: "Booking & Cancellation Terms",
        valueSummary:
          "USFS pass non-refundable; permitted shuttle operators typically allow 24-hour cancellation; subject to USFS commercial visitor permit caps",
        basisType: "operator_estimate",
        citationIds: ["jun-usfs-mendenhall"],
        verificationNote:
          "USFS enforces annual/daily commercial visitor service caps in Mendenhall Glacier Recreation Area.",
      },
    ],
    supportedReasonsAndTradeoffs: [
      "Direct 25-minute valley transfer drops you at the USFS Mendenhall Glacier Visitor Center lot without the 3-mile municipal bus road walk.",
      "Operates in low cloud ceilings and rain that ground helicopter icefield landings.",
      "Tradeoff: USFS commercial visitor permit caps can sell out permitted shuttle seats on 4–5 ship days, and you view the glacier from land/boardwalks rather than landing on the ice.",
    ],
    baseAssumptions: [
      "25 min each way via Egan Drive / Glacier Highway between downtown docks and Mendenhall Visitor Center (DCC corridor estimate).",
      "120 min on-site for Photo Point (0.3 mi), Steep Creek Bear Boardwalk (0.25 mi step-free), or Nugget Falls Trail (2.0 mi round-trip).",
      "15 min kiosk check-in and return shuttle boarding allowance.",
    ],
    baseUncertainties: [
      "Same-day USFS commercial shuttle seat availability depends on how many cruise ships are in port.",
      "USFS rangers may temporarily close sections of Steep Creek Trail without advance web notice when black bears are actively feeding close to the boardwalk.",
    ],
    bookingTransparency: {
      actualOperators: [
        "U.S. Forest Service (Tongass National Forest — Recreation Area Authority)",
        "Mendenhall Glacier Transport / Local USFS-Permitted Shuttle Operators",
      ],
      inclusions: [
        "Round-trip direct motorcoach transfer to Mendenhall Glacier Visitor Center drop-off zone",
        "USFS Mendenhall Visitor Center admission (when bundled with permitted commercial shuttle)",
      ],
      exclusions: [
        "Food or flavored beverages (strictly prohibited on USFS trails due to bear activity)",
      ],
      durationLabel:
        "3 hr 05 min dock-to-dock (120 min on-site + 50 min round-trip transfer + 15 min boarding; transfers not double-counted)",
      meetingArrangements:
        "Marine Park / Goldbelt Tramway plaza booths or pre-arranged taxi stand",
      priceBasis:
        "$5 USFS Visitor Center fee (sourced fact; trails free) + ~$45–$80 per person round-trip commercial shuttle or metered taxi (operator estimate)",
      indicativePriceRangePerPersonUsd: { min: 45, max: 80 },
      cancellationConditions:
        "USFS pass is non-refundable; commercial shuttle operators typically allow 24-hour cancellation",
      detailsVerifiedAt: "2026-10-23",
      detailsFreshnessNote:
        "Verified against USFS Tongass National Forest fee and access rules on 2026-10-23. Confirm live shuttle seat availability on your port date.",
      channels: [
        {
          channelType: "public_free",
          label: "USFS Mendenhall Glacier Official Visitor Information",
          operatorOrProviderName: "U.S. Forest Service (USDA)",
          url: "https://www.fs.usda.gov/recarea/tongass/recarea/?recid=78952",
          relationshipDisclosure:
            "Official public agency link. No commercial relationship.",
          isCommercialPartner: false,
          commissionInfluenceOnRanking: 0,
        },
        {
          channelType: "specialist_comparison",
          label: "Compare Juneau Port Shuttles & Combos (Welcome to Alaska Tours)",
          operatorOrProviderName: "Welcome to Alaska Tours",
          url: "https://welcometoalaskatours.com/ports/juneau",
          relationshipDisclosure:
            "DCC network specialist site. Optional handoff; no purchase required.",
          isCommercialPartner: true,
          commissionInfluenceOnRanking: 0,
        },
      ],
    },
  },
  {
    optionId: "jun-opt-auke-bay-whale-direct",
    title:
      "Auke Bay Whale Watching Excursion (Stephens Passage / Favorite Channel)",
    shortLabel: "Auke Bay Whale Watching",
    category: "guided_single_activity",
    corridor: "Auke Bay Harbor (13.5 mi NW)",
    viatorProductCode: "5849JNU_WHALE",
    advertisedDockToDockMinutes: 220,
    checkInLeadMinutes: 20,
    outboundTransferMinutes: 25,
    activityDurationMinutes: 150,
    interActivityTransferMinutes: 0,
    returnTransferMinutes: 25,
    decompositionNote:
      "Operators advertise 3.5 to 3.75 hours (210–225 min) total dock-to-dock. DCC decomposes this into 20m dock check-in + 25m outbound transfer to Statter Harbor + 150m (2.5h) on-water cruise + 25m return transfer = 220m total. The 50m round-trip transfer and 20m check-in are separated from the 150m on-water duration so they are never double-counted.",
    operatingMonths: [4, 5, 6, 7, 8, 9, 10],
    minimumMobility: "light_walking_1mi",
    weatherCeilingSensitive: false,
    dependsOnCitationIds: [
      "jun-operator-auke-bay-whale",
      "jun-cbj-harbors",
      "jun-noaa-tides",
    ],
    inputAudit: [
      {
        field: "price",
        label: "Adult Excursion Rate Range",
        valueSummary:
          "$169–$229 per adult depending on vessel class (40-pax catamaran vs. 6-pack charter)",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-auke-bay-whale"],
        verificationNote:
          "Published 2026–2027 seasonal rate range across permitted Auke Bay whale watching operators.",
      },
      {
        field: "activity_duration",
        label: "On-Water vs. Dock-to-Dock Duration",
        valueSummary:
          "150 min (2.5 hr) on water; 220 min (3 hr 40 min) dock-to-dock including 50m transfers and 20m check-in",
        basisType: "sourced_fact",
        citationIds: ["jun-operator-auke-bay-whale"],
        verificationNote:
          "Verified against published Allen Marine / Auke Bay operator itineraries: advertised 3.5–3.75 hr total duration includes bus transfers, which are separated here to prevent double-counting.",
      },
      {
        field: "transfers",
        label: "Downtown to Statter Harbor Transfer",
        valueSummary:
          "25 min each way (13.5 miles via Egan Drive between Marine Park and Auke Bay Statter Harbor)",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-auke-bay-whale", "jun-cbj-harbors"],
        verificationNote:
          "Included in operator excursion ticket; buses stage at Marine Park.",
      },
      {
        field: "meeting_point",
        label: "Dockside Meeting Point",
        valueSummary:
          "Marine Park / Goldbelt Tramway parking lot excursion booths",
        basisType: "sourced_fact",
        citationIds: ["jun-cbj-harbors", "jun-operator-auke-bay-whale"],
        verificationNote:
          "Standard downtown cruise dock meeting zone for Auke Bay shuttles.",
      },
      {
        field: "check_in_deadline",
        label: "Check-In Cutoff",
        valueSummary: "20 min before scheduled bus departure at dock kiosk",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-auke-bay-whale"],
        verificationNote:
          "Required by operators to assign bus and vessel manifests prior to departure.",
      },
      {
        field: "operating_season",
        label: "Operating Season",
        valueSummary: "April 15 – October 15 (months 4–10)",
        basisType: "sourced_fact",
        citationIds: ["jun-operator-auke-bay-whale"],
        verificationNote:
          "Matches northern Inside Passage humpback whale migration and cruise season.",
      },
      {
        field: "accessibility",
        label: "Harbor Ramp & Vessel Accessibility",
        valueSummary:
          "Requires light walking (up to 0.25–0.5 mi) and navigating Statter Harbor gangway ramps, which steepen during minus low tides (−3 to −5 ft MLLW)",
        basisType: "sourced_fact",
        citationIds: ["jun-operator-auke-bay-whale", "jun-noaa-tides"],
        verificationNote:
          "Some catamarans accommodate manual wheelchairs with advance notice; tide-driven gangway slope at Statter Harbor is tracked via NOAA Station 9452210.",
      },
      {
        field: "booking_and_cancellation",
        label: "Booking & Cancellation Policy",
        valueSummary:
          "Typically 24-hour free cancellation; 100% refund if canceled by captain for marine weather",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-auke-bay-whale"],
        verificationNote:
          "Standard operator terms; verify exact hour cutoff on your chosen operator's checkout page.",
      },
    ],
    supportedReasonsAndTradeoffs: [
      "Operates reliably under low cloud ceilings (1,000–2,000 ft) that cancel helicopter icefield tours.",
      "Includes round-trip ground transfer between downtown cruise docks and Auke Bay (Statter Harbor).",
      "Tradeoff: Does not visit Mendenhall Glacier unless booked as a longer 5 hr 15 min combination.",
    ],
    baseAssumptions: [
      "20 min dockside check-in before shuttle departure (operator requirement).",
      "25 min each way ground transfer between downtown docks and Auke Bay Statter Harbor (13.5 mi).",
      "150 min (2.5 hr) on-water marine wildlife viewing in Auke Bay / Stephens Passage (not double-counted with transfers).",
    ],
    baseUncertainties: [
      "Steep harbor ramp angles at Auke Bay during extreme minus low tides (−3 ft to −5 ft MLLW) can affect boarding for mobility-limited guests.",
      "Open-channel wind waves in Favorite Channel vary by day; confirm cabin seating if prone to motion sickness.",
    ],
    bookingTransparency: {
      actualOperators: [
        "Allen Marine Tours / Gastineau Guiding / Harv & Marv's / Permitted Auke Bay Charter Operators",
      ],
      inclusions: [
        "Round-trip shuttle transfer from downtown Juneau cruise docks to Auke Bay",
        "2 to 2.5 hours on-water whale watching with naturalist/captain",
        "Binoculars and heated indoor cabin with outdoor viewing deck",
      ],
      exclusions: [
        "Mendenhall Glacier stop (unless booked as a dedicated combo)",
        "Crew gratuities",
      ],
      durationLabel:
        "3 hr 40 min dock-to-dock (150 min on water + 50 min round-trip transfer + 20 min check-in; transfers not double-counted)",
      meetingArrangements:
        "Marine Park / Mount Roberts Tramway parking lot kiosks",
      priceBasis:
        "Published operator & partner rates typically $169–$229 per adult depending on vessel size (operator estimate)",
      indicativePriceRangePerPersonUsd: { min: 169, max: 229 },
      cancellationConditions:
        "Typically 24-hour free customer cancellation; full refund if canceled by operator for marine weather",
      detailsVerifiedAt: "2026-10-23",
      detailsFreshnessNote:
        "Verified against published 2026–2027 Auke Bay operator specifications on 2026-10-23. Confirm live vessel seats and exact departure time before booking.",
      channels: [
        {
          channelType: "direct_operator",
          label: "Allen Marine Tours — Juneau Whale Watching Specifications",
          operatorOrProviderName: "Allen Marine Tours",
          url: "https://allenmarine.com/juneau/",
          relationshipDisclosure:
            "Direct Alaska marine operator website. No affiliate commission.",
          isCommercialPartner: false,
          commissionInfluenceOnRanking: 0,
        },
        {
          channelType: "public_free",
          label: "CBJ Docks & Harbors — Statter Harbor (Auke Bay) Info",
          operatorOrProviderName: "City and Borough of Juneau",
          url: "https://juneau.org/harbors",
          relationshipDisclosure:
            "Official municipal harbor resource. No commercial relationship.",
          isCommercialPartner: false,
          commissionInfluenceOnRanking: 0,
        },
        {
          channelType: "specialist_comparison",
          label:
            "Compare Auke Bay Whale Watching Departures (Welcome to Alaska Tours)",
          operatorOrProviderName: "Welcome to Alaska Tours",
          url: "https://welcometoalaskatours.com/ports/juneau",
          relationshipDisclosure:
            "DCC network specialist site; may include direct operator and Viator affiliate links.",
          isCommercialPartner: true,
          commissionInfluenceOnRanking: 0,
        },
      ],
    },
  },
  {
    optionId: "jun-opt-heli-icefield-walkabout",
    title:
      "Helicopter Glacier Landing & Guided Icefield Walkabout (JNU Airport Base)",
    shortLabel: "Helicopter Glacier Landing",
    category: "guided_single_activity",
    corridor: "Juneau International Airport (JNU) & Juneau Icefield",
    viatorProductCode: "5849JNU_HELI",
    advertisedDockToDockMinutes: 185,
    checkInLeadMinutes: 30,
    outboundTransferMinutes: 20,
    activityDurationMinutes: 115,
    interActivityTransferMinutes: 0,
    returnTransferMinutes: 20,
    decompositionNote:
      "Operators (TEMSCO, Coastal, NorthStar) advertise 3.0 to 3.25 hours (180–195 min) dock-to-dock. DCC decomposes this into 30m mandatory pre-flight briefing/overboot fitting + 20m outbound shuttle to JNU heliport + 115m flight and glacier landing + 20m return shuttle = 185m total. Shuttle transfers (40m RT) and check-in/briefing (30m) are separated from the 115m flight/ice window so they are never double-counted.",
    operatingMonths: [5, 6, 7, 8, 9],
    minimumMobility: "light_walking_1mi",
    weatherCeilingSensitive: true,
    dependsOnCitationIds: [
      "jun-operator-heli-icefield",
      "jun-airport-official",
      "jun-noaa-aviation",
      "jun-cbj-harbors",
    ],
    inputAudit: [
      {
        field: "price",
        label: "Published Operator Base Rates",
        valueSummary:
          "$409–$549 per person ($409 TEMSCO glacier landing; $429 Coastal icefield excursion; $499–$549 NorthStar walkabout)",
        basisType: "sourced_fact",
        citationIds: ["jun-operator-heli-icefield"],
        verificationNote:
          "Verified against published 2026–2027 direct tariff pages for TEMSCO, Coastal, and NorthStar.",
      },
      {
        field: "activity_duration",
        label: "Flight/Glacier Time vs. Dock-to-Dock Duration",
        valueSummary:
          "115 min flight + glacier walk; 185 min (3 hr 05 min) dock-to-dock including 40m round-trip JNU shuttle and 30m briefing/gear fitting",
        basisType: "sourced_fact",
        citationIds: ["jun-operator-heli-icefield"],
        verificationNote:
          "Advertised 3.0–3.25 hr operator duration is dock-to-dock; DCC separates the 40m shuttle and 30m briefing from the 115m flight/ice window to prevent double-counting.",
      },
      {
        field: "transfers",
        label: "Downtown Dock to JNU Heliport Transfer",
        valueSummary:
          "20 min each way (8.5 miles via Egan Drive between downtown cruise docks and JNU Airport helicopter ramp)",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-heli-icefield", "jun-airport-official"],
        verificationNote:
          "Included in operator ticket; operator vans pick up at downtown dock kiosks.",
      },
      {
        field: "meeting_point",
        label: "Pickup & Base Location",
        valueSummary:
          "Downtown cruise dock pickup kiosk (transfers to JNU Airport North/South Heliport Ramp)",
        basisType: "sourced_fact",
        citationIds: ["jun-operator-heli-icefield", "jun-airport-official"],
        verificationNote:
          "All FAA Part 135 glacier helicopters stage from Juneau International Airport (PAJN), not from the downtown waterfront.",
      },
      {
        field: "check_in_deadline",
        label: "Mandatory Briefing & Gear Fitting Lead Time",
        valueSummary:
          "30 min pre-flight safety briefing, weight verification, and glacier overboot/crampon fitting",
        basisType: "sourced_fact",
        citationIds: ["jun-operator-heli-icefield"],
        verificationNote:
          "Required by FAA Part 135 operators prior to boarding the aircraft.",
      },
      {
        field: "operating_season",
        label: "Operating Season",
        valueSummary:
          "May 1 – September 30 (months 5–9; heliport tour bases closed October–April)",
        basisType: "sourced_fact",
        citationIds: ["jun-operator-heli-icefield"],
        verificationNote:
          "Summer glacier landing operations run May through September under USFS Tongass special-use permits.",
      },
      {
        field: "accessibility",
        label: "Mobility & Weight-Balance Restrictions",
        valueSummary:
          "Requires stepping into helicopter cabin and walking on uneven glacial ice with traction overboots; weight-balance surcharge applies above 250 lbs fully clothed",
        basisType: "sourced_fact",
        citationIds: ["jun-operator-heli-icefield"],
        verificationNote:
          "FAA Part 135 weight-and-balance manifest rules require accurate passenger weights at booking.",
      },
      {
        field: "booking_and_cancellation",
        label: "Weather Dispatch & Refund Policy",
        valueSummary:
          "100% refund if canceled by operator due to ceiling/visibility weather minimums; customer cancellation cutoff varies 24h–7d by operator",
        basisType: "sourced_fact",
        citationIds: ["jun-operator-heli-icefield", "jun-noaa-aviation"],
        verificationNote:
          "Only the licensed Part 135 operator can hold or cancel a flight based on icefield ceiling and flat-light contrast.",
      },
    ],
    supportedReasonsAndTradeoffs: [
      "Only way to physically land and walk on the upper Mendenhall, Herbert, or Norris glacier icefields away from road crowds.",
      "Moderate total duration (3 hr 05 min dock-to-dock including airport transfers and gear briefing) fits standard 6+ hour port calls comfortably.",
      "Tradeoff: Highest weather-cancellation sensitivity (FAA Part 135 cloud ceiling and flat-light minimums on the icefield) and highest per-person cost ($409–$549+).",
    ],
    baseAssumptions: [
      "30 min mandatory pre-flight safety briefing, weight check, and glacier overboot/crampon fitting (sourced operator rule).",
      "20 min each way operator shuttle between downtown cruise docks and JNU Airport helicopter ramp (8.5 mi).",
      "115 min flight + guided glacier landing window (separated from shuttle and briefing so transfers are not double-counted).",
    ],
    baseUncertainties: [
      "FAA Part 135 dispatch depends on real-time icefield ceiling, visibility, and flat-light contrast — surface weather at the cruise docks does not confirm flight operation.",
      "Operators enforce per-seat and total aircraft weight balance limits (surcharges typically apply above 250 lbs fully clothed).",
    ],
    bookingTransparency: {
      actualOperators: [
        "TEMSCO Helicopters (JNU Airport)",
        "Coastal Helicopters (JNU North Ramp)",
        "NorthStar Trekking (JNU Airport)",
      ],
      inclusions: [
        "Round-trip shuttle between downtown cruise docks and JNU Airport heliport",
        "Glacier traction overboots or crampons, rain/wind outer layer, and safety briefing",
        "Scenic flightseeing and guided walk on Mendenhall, Herbert, or Norris Glacier",
      ],
      exclusions: [
        "Weight-balance seat surcharge (required by operators above 250 lbs)",
        "Pilot/guide gratuities",
      ],
      durationLabel:
        "3 hr 05 min dock-to-dock (115 min flight/ice window + 40 min round-trip transfer + 30 min check-in/briefing; not double-counted)",
      meetingArrangements:
        "Downtown cruise dock pickup kiosk (operator shuttle to JNU Airport ramp)",
      priceBasis:
        "Published 2026–2027 direct operator base rates: $409 (TEMSCO landing), $429 (Coastal landing), $499–$549 (NorthStar walkabout/trek)",
      indicativePriceRangePerPersonUsd: { min: 409, max: 549 },
      cancellationConditions:
        "100% refund if canceled by operator due to weather; customer cancellation windows vary by operator (24h to 7 days)",
      detailsVerifiedAt: "2026-10-23",
      detailsFreshnessNote:
        "Checked against TEMSCO, Coastal, and NorthStar published profiles on 2026-10-23. Confirm exact departure slot and weight rules on checkout.",
      channels: [
        {
          channelType: "direct_operator",
          label: "TEMSCO Helicopters (Official Operator Page)",
          operatorOrProviderName: "TEMSCO Helicopters",
          url: "https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/",
          relationshipDisclosure:
            "Direct local FAA Part 135 operator website. No affiliate commission.",
          isCommercialPartner: false,
          commissionInfluenceOnRanking: 0,
        },
        {
          channelType: "direct_operator",
          label: "Coastal Helicopters (Official Operator Page)",
          operatorOrProviderName: "Coastal Helicopters",
          url: "https://coastalhelicopters.com/tours/icefield-excursion/",
          relationshipDisclosure:
            "Direct local FAA Part 135 operator website. No affiliate commission.",
          isCommercialPartner: false,
          commissionInfluenceOnRanking: 0,
        },
        {
          channelType: "direct_operator",
          label: "NorthStar Trekking (Official Operator Page)",
          operatorOrProviderName: "NorthStar Trekking",
          url: "https://northstartrekking.com/adventures/helicopter-glacier-walkabout/",
          relationshipDisclosure:
            "Direct local FAA Part 135 operator website. No affiliate commission.",
          isCommercialPartner: false,
          commissionInfluenceOnRanking: 0,
        },
        {
          channelType: "specialist_comparison",
          label: "Compare All 3 Operators & Backup Options (Juneau Flight Deck)",
          operatorOrProviderName: "Juneau Flight Deck",
          url: "https://juneauflightdeck.com/helicopter",
          relationshipDisclosure:
            "DCC network specialist site; links to direct FareHarbor operator calendars and Viator partner listings.",
          isCommercialPartner: true,
          commissionInfluenceOnRanking: 0,
        },
      ],
    },
  },
  {
    optionId: "jun-opt-combo-whale-and-mendenhall",
    title:
      "Two-Activity Combination: Mendenhall Glacier + Auke Bay Whale Watching (Direct Valley Link)",
    shortLabel: "Combo: Mendenhall + Whale Watching",
    category: "two_activity_combo",
    corridor: "Mendenhall Valley + Auke Bay Corridor (12–13.5 mi NW)",
    viatorProductCode: "5849JNU_COMBO",
    advertisedDockToDockMinutes: 315,
    checkInLeadMinutes: 20,
    outboundTransferMinutes: 25,
    activityDurationMinutes: 225, // 90m Mendenhall + 135m Whale Watching
    interActivityTransferMinutes: 15, // Direct Mendenhall -> Auke Bay transfer (4.5 mi)
    returnTransferMinutes: 30,
    decompositionNote:
      "Bundled combo operators advertise 5.0 to 5.25 hours (300–315 min) dock-to-dock. DCC decomposes this into 20m dock check-in + 25m transfer to Mendenhall + 90m at Mendenhall + 15m direct 4.5-mile valley link to Auke Bay + 135m on-water whale watch + 30m return transfer to downtown = 315m (5h 15m). All transfers (70m total) and check-in (20m) are separated from the 225m combined activity time so nothing is double-counted.",
    operatingMonths: [5, 6, 7, 8, 9],
    minimumMobility: "light_walking_1mi",
    weatherCeilingSensitive: false,
    dependsOnCitationIds: [
      "jun-operator-auke-bay-whale",
      "jun-usfs-mendenhall",
      "jun-cbj-harbors",
      "jun-noaa-tides",
    ],
    inputAudit: [
      {
        field: "price",
        label: "Bundled Combo Rate Range",
        valueSummary: "$219–$289 per adult (includes USFS admission and all 3 bus legs)",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-auke-bay-whale", "jun-usfs-mendenhall"],
        verificationNote:
          "Published 2026–2027 bundled combo range across Allen Marine / Gastineau Guiding / permitted valley combo operators.",
      },
      {
        field: "activity_duration",
        label: "Combined Activity vs. Dock-to-Dock Duration",
        valueSummary:
          "225 min activity time (90m Mendenhall + 135m on-water whale watch); 315 min (5 hr 15 min) dock-to-dock including 70m transfers and 20m check-in",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-auke-bay-whale", "jun-usfs-mendenhall"],
        verificationNote:
          "Decomposed from advertised 5.0–5.25 hr combo schedules so transfers are never double-counted; note that Mendenhall stop is capped at ~75–90 min.",
      },
      {
        field: "transfers",
        label: "Three-Leg Valley Loop Transfers",
        valueSummary:
          "25m Downtown→Mendenhall + 15m Mendenhall→Auke Bay (4.5 mi direct) + 30m Auke Bay→Downtown (70 min total transit)",
        basisType: "dcc_estimate",
        citationIds: ["jun-operator-auke-bay-whale", "jun-usfs-mendenhall"],
        verificationNote:
          "Direct 4.5-mile valley link between Mendenhall and Statter Harbor saves ~35 minutes vs. backtracking through downtown.",
      },
      {
        field: "meeting_point",
        label: "Meeting Point",
        valueSummary: "Marine Park / Goldbelt Tramway plaza tour kiosks",
        basisType: "sourced_fact",
        citationIds: ["jun-cbj-harbors"],
        verificationNote:
          "Designated downtown cruise excursion staging zone.",
      },
      {
        field: "check_in_deadline",
        label: "Check-In Lead Time",
        valueSummary: "20 min prior to combo coach departure",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-auke-bay-whale"],
        verificationNote:
          "Required for multi-leg coach and vessel manifest check-in.",
      },
      {
        field: "operating_season",
        label: "Operating Season",
        valueSummary: "May 1 – September 30 (months 5–9)",
        basisType: "sourced_fact",
        citationIds: ["jun-usfs-mendenhall", "jun-operator-auke-bay-whale"],
        verificationNote:
          "Requires both USFS summer commercial shuttle operations and Auke Bay whale vessel schedules.",
      },
      {
        field: "accessibility",
        label: "Mobility & Trail/Ramp Constraints",
        valueSummary:
          "Requires light walking (Steep Creek/Photo Point + Statter Harbor boarding ramp); 90m glacier stop is tight for the 2.0-mile Nugget Falls hike",
        basisType: "sourced_fact",
        citationIds: ["jun-usfs-mendenhall", "jun-noaa-tides"],
        verificationNote:
          "Harbor gangway slope varies with NOAA Station 9452210 tide height.",
      },
      {
        field: "booking_and_cancellation",
        label: "Booking & Cancellation Policy",
        valueSummary:
          "Typically 24-hour free cancellation; partial refund if one leg is modified by operator",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-auke-bay-whale"],
        verificationNote:
          "If booking the two activities separately instead of a bundled combo, you must pre-arrange a private valley taxi because on-demand rideshare at Mendenhall is unreliable.",
      },
    ],
    supportedReasonsAndTradeoffs: [
      "Combines Juneau's two signature surface experiences in one northwest loop, using a 15-minute direct Mendenhall-to-Auke Bay transfer instead of backtracking 50 minutes through downtown.",
      "Operates reliably in rain and low ceilings.",
      "Tradeoff: Requires 5 hr 15 min of activity/transfer time plus dock and return buffers (~7.5+ hours in port for a comfortable margin), leaving only ~90 minutes on the ground at Mendenhall Glacier (tight if you want to hike all the way to Nugget Falls and also visit Steep Creek).",
    ],
    baseAssumptions: [
      "20 min dock check-in + 25 min transfer from downtown to Mendenhall Glacier.",
      "90 min at Mendenhall Glacier Visitor Center / Photo Point / Steep Creek.",
      "15 min direct valley transfer from Mendenhall Glacier to Auke Bay Statter Harbor (4.5 miles).",
      "135 min on-water whale watching + 30 min return transfer to downtown cruise docks (transfers not double-counted).",
    ],
    baseUncertainties: [
      "If booked as two separate independent tickets rather than an integrated combo or pre-booked private taxi, finding an on-demand taxi/Uber at Mendenhall Visitor Center to reach Auke Bay on time is high-risk due to weak cell signal and USFS commercial pickup zones.",
      "Short 5–6.5 hour port calls (or ships tendering in Gastineau Channel) do not have enough slack for this two-activity loop.",
    ],
    bookingTransparency: {
      actualOperators: [
        "Allen Marine Tours / Gastineau Guiding / Dolphin Jet Boat Tours / Permitted Combo Operators",
      ],
      inclusions: [
        "All ground transfers (Downtown → Mendenhall → Auke Bay → Downtown)",
        "USFS Mendenhall Glacier Visitor Center admission",
        "2+ hour Auke Bay whale watching cruise",
      ],
      exclusions: [
        "Meals (snacks/water usually provided on whale vessel; no food allowed on Mendenhall trails)",
      ],
      durationLabel:
        "5 hr 15 min dock-to-dock (90m Mendenhall + 15m link + 135m Whale Watch + 55m transfers + 20m check-in; not double-counted)",
      meetingArrangements: "Marine Park / Mount Roberts Tramway plaza kiosks",
      priceBasis:
        "Bundled combo tours typically $219–$289 per adult (operator estimate; or book separately ONLY with pre-arranged private transfer between Mendenhall and Auke Bay)",
      indicativePriceRangePerPersonUsd: { min: 219, max: 289 },
      cancellationConditions:
        "Typically 24-hour free cancellation; partial refund if one leg is modified by operator",
      detailsVerifiedAt: "2026-10-23",
      detailsFreshnessNote:
        "Verified against 2026–2027 Juneau combo schedules on 2026-10-23.",
      channels: [
        {
          channelType: "direct_operator",
          label: "Allen Marine Tours — Juneau Whale & Mendenhall Combinations",
          operatorOrProviderName: "Allen Marine Tours",
          url: "https://allenmarine.com/juneau/",
          relationshipDisclosure:
            "Direct Alaska marine operator website. No affiliate commission.",
          isCommercialPartner: false,
          commissionInfluenceOnRanking: 0,
        },
        {
          channelType: "public_free",
          label: "USFS Mendenhall Glacier Trail Map & Rules",
          operatorOrProviderName: "U.S. Forest Service (USDA)",
          url: "https://www.fs.usda.gov/recarea/tongass/recarea/?recid=78952",
          relationshipDisclosure:
            "Official public agency resource. No commercial relationship.",
          isCommercialPartner: false,
          commissionInfluenceOnRanking: 0,
        },
        {
          channelType: "specialist_comparison",
          label:
            "Compare Juneau Whale + Mendenhall Combo Timings (Welcome to Alaska Tours)",
          operatorOrProviderName: "Welcome to Alaska Tours",
          url: "https://welcometoalaskatours.com/ports/juneau",
          relationshipDisclosure:
            "DCC network specialist site; may earn commission on partner bookings at no extra cost.",
          isCommercialPartner: true,
          commissionInfluenceOnRanking: 0,
        },
      ],
    },
  },
  {
    optionId: "jun-opt-combo-heli-and-mendenhall",
    title:
      "Two-Activity Combination: Helicopter Icefield Landing + Mendenhall Visitor Center",
    shortLabel: "Combo: Helicopter + Mendenhall Visitor Center",
    category: "two_activity_combo",
    corridor: "JNU Airport (8.5 mi NW) + Mendenhall Valley (12 mi NW)",
    viatorProductCode: null,
    advertisedDockToDockMinutes: 300,
    checkInLeadMinutes: 30,
    outboundTransferMinutes: 20,
    activityDurationMinutes: 205, // 115m heli + 90m Mendenhall Visitor Center
    interActivityTransferMinutes: 20, // JNU Airport ramp -> Mendenhall Visitor Center (4.5 mi)
    returnTransferMinutes: 25,
    decompositionNote:
      "Total 300 min (5h 00m) dock-to-dock is decomposed into 30m heliport briefing/gear fitting + 20m downtown-to-JNU shuttle + 115m helicopter flight/glacier landing + 20m direct 4.5-mile valley taxi/shuttle link from JNU to Mendenhall Visitor Center + 90m at Mendenhall + 25m return transfer to downtown docks. Return airport shuttle leg from the standalone helicopter tour (20m) is replaced by the 20m JNU→Mendenhall link + 25m Mendenhall→Downtown return so transfers are never double-counted.",
    operatingMonths: [5, 6, 7, 8, 9],
    minimumMobility: "light_walking_1mi",
    weatherCeilingSensitive: true,
    dependsOnCitationIds: [
      "jun-operator-heli-icefield",
      "jun-airport-official",
      "jun-noaa-aviation",
      "jun-usfs-mendenhall",
      "jun-cbj-harbors",
    ],
    inputAudit: [
      {
        field: "price",
        label: "Combined Helicopter + Valley Transfer & Admission Cost",
        valueSummary:
          "$440–$595 per person ($409–$549 helicopter base rate + $5 USFS fee + ~$25–$45 valley taxi/shuttle)",
        basisType: "dcc_estimate",
        citationIds: ["jun-operator-heli-icefield", "jun-usfs-mendenhall"],
        verificationNote:
          "Combines sourced helicopter base rates ($409–$549) and $5 USFS fee with a DCC estimate ($25–$45) for the 4.5-mile JNU-to-Mendenhall taxi/shuttle link.",
      },
      {
        field: "activity_duration",
        label: "Combined Activity vs. Total Duration",
        valueSummary:
          "205 min activity time (115m flight/ice + 90m Mendenhall Visitor Center); 300 min (5 hr 00 min) dock-to-dock",
        basisType: "dcc_estimate",
        citationIds: ["jun-operator-heli-icefield", "jun-usfs-mendenhall"],
        verificationNote:
          "Replaces the helicopter tour's 20m downtown return shuttle with a 20m valley link to Mendenhall + 90m visit + 25m return to docks (no double-counted transfers).",
      },
      {
        field: "transfers",
        label: "Three-Leg Valley Routing",
        valueSummary:
          "20m Downtown→JNU + 20m JNU→Mendenhall (4.5 mi) + 25m Mendenhall→Downtown (65 min total transit)",
        basisType: "dcc_estimate",
        citationIds: ["jun-airport-official", "jun-usfs-mendenhall"],
        verificationNote:
          "JNU Airport and Mendenhall Visitor Center are both in the Mendenhall Valley (4.5 miles apart).",
      },
      {
        field: "meeting_point",
        label: "Meeting Point",
        valueSummary:
          "Downtown cruise dock kiosk for Leg 1 (operator shuttle to JNU Airport heliport)",
        basisType: "sourced_fact",
        citationIds: ["jun-operator-heli-icefield", "jun-cbj-harbors"],
        verificationNote:
          "Schedule the helicopter leg first in the morning so any weather hold is known before committing to the valley loop.",
      },
      {
        field: "check_in_deadline",
        label: "Heliport Check-In & Gear Fitting",
        valueSummary: "30 min mandatory pre-flight briefing and overboot fitting",
        basisType: "sourced_fact",
        citationIds: ["jun-operator-heli-icefield"],
        verificationNote:
          "FAA Part 135 operator requirement.",
      },
      {
        field: "operating_season",
        label: "Operating Season",
        valueSummary: "May 1 – September 30 (months 5–9)",
        basisType: "sourced_fact",
        citationIds: ["jun-operator-heli-icefield", "jun-usfs-mendenhall"],
        verificationNote:
          "Limited by the May–September glacier helicopter season.",
      },
      {
        field: "accessibility",
        label: "Mobility & Weight-Balance Rules",
        valueSummary:
          "Requires light walking on glacier ice with overboots and 250 lb weight-balance rule on helicopter leg; Mendenhall Visitor Center/Steep Creek is step-free",
        basisType: "sourced_fact",
        citationIds: ["jun-operator-heli-icefield", "jun-usfs-mendenhall"],
        verificationNote:
          "Helicopter boarding and glacier walking govern the minimum mobility requirement.",
      },
      {
        field: "booking_and_cancellation",
        label: "Booking & Weather Contingency",
        valueSummary:
          "Helicopter leg 100% refundable if weather-canceled; keep Mendenhall ground leg flexible if flight slot is delayed",
        basisType: "sourced_fact",
        citationIds: ["jun-operator-heli-icefield"],
        verificationNote:
          "Drop the Mendenhall Visitor Center stop if a morning weather hold delays your flight departure by 45+ minutes.",
      },
    ],
    supportedReasonsAndTradeoffs: [
      "Pairs an upper-icefield helicopter landing with ground-level views of Nugget Falls and Steep Creek salmon/bears — both located in the Mendenhall Valley.",
      "Because JNU Airport and Mendenhall Visitor Center are only 4.5 miles apart in the valley, linking them avoids a redundant round-trip downtown.",
      "Tradeoff: Requires a 7+ hour port call and pre-arranged valley taxi/shuttle coordination between the heliport and Visitor Center; helicopter leg remains subject to FAA Part 135 ceiling minimums.",
    ],
    baseAssumptions: [
      "30 min heliport check-in & gear fitting + 20 min downtown-to-JNU shuttle.",
      "115 min helicopter flight and guided glacier walk (transfers not double-counted).",
      "20 min valley taxi/shuttle link between JNU Airport heliport and Mendenhall Visitor Center (4.5 mi).",
      "90 min at Mendenhall Visitor Center + 25 min return transfer to downtown docks.",
    ],
    baseUncertainties: [
      "Standard helicopter operator shuttles run loop routes between downtown docks and JNU Airport — confirm in advance whether the operator or a pre-booked valley taxi will drop you at Mendenhall Visitor Center after your flight.",
      "If low ceilings delay your helicopter departure slot by 45–60 minutes, drop the Mendenhall Visitor Center leg immediately to protect your 90-minute ship return buffer.",
    ],
    bookingTransparency: {
      actualOperators: [
        "TEMSCO / Coastal / NorthStar (Helicopter Leg) + USFS Mendenhall Visitor Center (Self-Guided or Combo Shuttle)",
      ],
      inclusions: [
        "Helicopter icefield landing, overboots, and dock-to-airport transfer",
        "Self-paced Mendenhall Glacier Visitor Center & trail access",
      ],
      exclusions: [
        "Point-to-point taxi between JNU heliport and Mendenhall Visitor Center (unless booked as an integrated package)",
      ],
      durationLabel:
        "5 hr 00 min dock-to-dock (115m flight + 20m valley link + 90m Mendenhall + 45m transfers + 30m check-in; not double-counted)",
      meetingArrangements:
        "Schedule helicopter flight for the earliest morning slot so any weather hold or backup decision happens early in your port window",
      priceBasis:
        "$409–$549 helicopter base rate (sourced fact) + $5 USFS admission (sourced fact) + ~$25–$45 valley taxi/shuttle transfer (DCC estimate)",
      indicativePriceRangePerPersonUsd: { min: 440, max: 595 },
      cancellationConditions:
        "Helicopter leg 100% refundable if weather-canceled by operator; keep Mendenhall ground visit flexible until flight completes",
      detailsVerifiedAt: "2026-10-23",
      detailsFreshnessNote:
        "Evaluated from verified JNU Airport and USFS Mendenhall transfer distances on 2026-10-23.",
      channels: [
        {
          channelType: "direct_operator",
          label: "TEMSCO Helicopters Direct",
          operatorOrProviderName: "TEMSCO Helicopters",
          url: "https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/",
          relationshipDisclosure:
            "Direct local operator website. No affiliate commission.",
          isCommercialPartner: false,
          commissionInfluenceOnRanking: 0,
        },
        {
          channelType: "public_free",
          label: "USFS Mendenhall Glacier Visitor Center Official Page",
          operatorOrProviderName: "U.S. Forest Service (USDA)",
          url: "https://www.fs.usda.gov/recarea/tongass/recarea/?recid=78952",
          relationshipDisclosure:
            "Official public agency resource. No commercial relationship.",
          isCommercialPartner: false,
          commissionInfluenceOnRanking: 0,
        },
        {
          channelType: "specialist_comparison",
          label:
            "Compare Helicopter Operators & Port Timing (Juneau Flight Deck)",
          operatorOrProviderName: "Juneau Flight Deck",
          url: "https://juneauflightdeck.com/helicopter",
          relationshipDisclosure:
            "DCC network specialist site; optional comparison and booking links.",
          isCommercialPartner: true,
          commissionInfluenceOnRanking: 0,
        },
      ],
    },
  },
  {
    optionId: "jun-opt-capital-transit-diy",
    title:
      "Independent Public Transit: Capital Transit Bus ($2) + 3.0-Mile Walk to Mendenhall Glacier",
    shortLabel: "Public Bus + 3-Mi Walk (DIY)",
    category: "public_free_or_municipal",
    corridor:
      "Downtown Transit Center → Mendenhall Loop Rd + 1.5-Mi Spur Walk Each Way",
    viatorProductCode: null,
    advertisedDockToDockMinutes: 260,
    checkInLeadMinutes: 15,
    outboundTransferMinutes: 70, // 35m bus + 35m 1.5-mi walk from Mendenhall Loop Rd & Glacier Spur Rd
    activityDurationMinutes: 90,
    interActivityTransferMinutes: 0,
    returnTransferMinutes: 85, // 35m 1.5-mi walk back + 15m hourly/half-hourly bus wait + 35m bus ride
    decompositionNote:
      "Total 260 min (4h 20m) is decomposed into 15m walk/wait at Downtown Transit Center + 70m outbound transit (35m bus + 35m 1.5-mile walk along Glacier Spur Rd) + 90m at Mendenhall Glacier + 85m return transit (35m 1.5-mile walk + 15m bus headway wait + 35m bus ride). The 3.0-mile road walk is included in transfer time rather than on-site trail time so it is never hidden or double-counted.",
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    minimumMobility: "active_walking_3mi",
    weatherCeilingSensitive: false,
    dependsOnCitationIds: ["jun-capital-transit", "jun-usfs-mendenhall"],
    inputAudit: [
      {
        field: "price",
        label: "Municipal Bus Fare & Trail Access",
        valueSummary:
          "$2.00 exact cash per ride ($4.00 round-trip) + $0 outdoor USFS trails ($5 optional Visitor Center building admission)",
        basisType: "sourced_fact",
        citationIds: ["jun-capital-transit", "jun-usfs-mendenhall"],
        verificationNote:
          "Verified against Capital Transit published adult cash fare ($2.00) and USFS Mendenhall fee schedule ($5 Visitor Center; outdoor trails free).",
      },
      {
        field: "activity_duration",
        label: "On-Site Glacier Time",
        valueSummary:
          "90 min at Mendenhall Recreation Area (excludes 155 min round-trip bus + 3.0-mile road walk)",
        basisType: "dcc_estimate",
        citationIds: ["jun-usfs-mendenhall"],
        verificationNote:
          "90 min on-site budget after completing the 1.5-mile walk from Mendenhall Loop Rd.",
      },
      {
        field: "transfers",
        label: "Bus Ride + 1.5-Mile Spur Walk Each Way",
        valueSummary:
          "70 min outbound (35m bus + 35m 1.5-mi walk) and 85 min return (35m walk + 15m schedule wait + 35m bus)",
        basisType: "sourced_fact",
        citationIds: ["jun-capital-transit", "jun-usfs-mendenhall"],
        verificationNote:
          "Capital Transit Route 3/4 stops at Mendenhall Loop Rd & Glacier Spur Rd, 1.5 miles from the Visitor Center.",
      },
      {
        field: "meeting_point",
        label: "Boarding Location",
        valueSummary:
          "Downtown Transit Center at 4th Street & Marine Way (~0.4 mi walk from Marine Park docks)",
        basisType: "sourced_fact",
        citationIds: ["jun-capital-transit"],
        verificationNote:
          "Municipal transit hub in downtown Juneau.",
      },
      {
        field: "check_in_deadline",
        label: "Transit Center Walk & Wait Lead Time",
        valueSummary: "15 min walk from dock to 4th & Marine Way + bus boarding",
        basisType: "dcc_estimate",
        citationIds: ["jun-capital-transit"],
        verificationNote:
          "Allows walking from Marine Park seawalk to the Downtown Transit Center before the half-hourly/hourly departure.",
      },
      {
        field: "operating_season",
        label: "Operating Season",
        valueSummary:
          "Year-round municipal bus service (Months 1–12; Sunday/holiday headways are reduced to hourly)",
        basisType: "sourced_fact",
        citationIds: ["jun-capital-transit"],
        verificationNote:
          "Capital Transit operates year-round; USFS outdoor trails remain open year-round though winter Visitor Center hours are limited.",
      },
      {
        field: "accessibility",
        label: "Walking Distance Requirement",
        valueSummary:
          "Requires active 3.0-mile round-trip walking on the paved Glacier Spur Rd pedestrian path BEFORE any trail hiking at the glacier",
        basisType: "sourced_fact",
        citationIds: ["jun-capital-transit", "jun-usfs-mendenhall"],
        verificationNote:
          "Buses are wheelchair lift-equipped, but the 1.5-mile each-way road gap makes this unsuitable for travelers seeking minimal walking.",
      },
      {
        field: "booking_and_cancellation",
        label: "Payment & Ticketing Rules",
        valueSummary:
          "Pay-as-you-board exact cash ($2.00 bill/coins; drivers do not make change); no advance booking required",
        basisType: "sourced_fact",
        citationIds: ["jun-capital-transit"],
        verificationNote:
          "Verified on Capital Transit fares page.",
      },
    ],
    supportedReasonsAndTradeoffs: [
      "Lowest possible cost ($4 round-trip exact cash bus fare; outdoor trails outside Visitor Center fee zone are $0).",
      "Does not depend on USFS commercial tour shuttle permit caps.",
      "Tradeoff: Capital Transit buses stop at Mendenhall Loop Rd & Glacier Spur Rd — 1.5 miles (30–35 min walk) each way from the Visitor Center BEFORE any trail hiking, adding ~2.5 hours of total transit/walk friction.",
    ],
    baseAssumptions: [
      "15 min walk/wait at Downtown Transit Center (4th & Marine Way).",
      "35 min municipal bus ride + 35 min (1.5-mile) flat paved path walk along Glacier Spur Rd each way.",
      "90 min at Mendenhall Glacier + 15 min schedule alignment buffer for return bus.",
    ],
    baseUncertainties: [
      "Missing a once-per-hour or twice-per-hour municipal bus connection adds 30–60 minutes immediately.",
      "Requires 3.0 miles of road-side pathway walking before adding Nugget Falls (another 2.0 miles).",
    ],
    bookingTransparency: {
      actualOperators: [
        "City and Borough of Juneau — Capital Transit (Public Municipal Bus)",
        "U.S. Forest Service — Tongass National Forest",
      ],
      inclusions: [
        "Municipal bus transit between Downtown Juneau Transit Center and Mendenhall Loop Rd stop",
        "Public paved pedestrian path access along Glacier Spur Rd to Mendenhall Recreation Area",
      ],
      exclusions: [
        "Last 1.5 miles from bus stop to Visitor Center (must walk)",
        "$5 USFS Visitor Center building admission (optional; outdoor trails are free)",
      ],
      durationLabel:
        "4 hr 20 min total (155 min bus + 3-mile walk round-trip + 90 min at glacier + 15 min wait; not double-counted)",
      meetingArrangements:
        "Downtown Transit Center at 4th Street & Marine Way (exact $2 cash fare per ride)",
      priceBasis:
        "$2.00 exact cash each way ($4.00 round-trip, sourced fact) + optional $5.00 USFS Visitor Center pass (sourced fact)",
      indicativePriceRangePerPersonUsd: { min: 4, max: 9 },
      cancellationConditions:
        "Pay-as-you-board municipal transit; no advance booking required",
      detailsVerifiedAt: "2026-10-23",
      detailsFreshnessNote:
        "Verified against Capital Transit Fares & Route 3/4 schedule on 2026-10-23.",
      channels: [
        {
          channelType: "public_free",
          label: "Capital Transit Official Fares & Routes",
          operatorOrProviderName:
            "City and Borough of Juneau — Capital Transit",
          url: "https://juneaucapitaltransit.org/fares/",
          relationshipDisclosure:
            "Official municipal transit agency. No commercial relationship.",
          isCommercialPartner: false,
          commissionInfluenceOnRanking: 0,
        },
        {
          channelType: "public_free",
          label: "USFS Mendenhall Glacier Recreation Area",
          operatorOrProviderName: "U.S. Forest Service (USDA)",
          url: "https://www.fs.usda.gov/recarea/tongass/recarea/?recid=78952",
          relationshipDisclosure:
            "Official public agency resource. No commercial relationship.",
          isCommercialPartner: false,
          commissionInfluenceOnRanking: 0,
        },
      ],
    },
  },
  {
    optionId: "jun-opt-downtown-seawalk-soboleff-tram",
    title:
      "Independent Downtown Walk-Off: Seawalk, Sealaska Heritage Walter Soboleff Center & Goldbelt Tram",
    shortLabel: "Downtown Walk-Off: Soboleff Center & Seawalk",
    category: "public_free_or_municipal",
    corridor:
      "Downtown Juneau / South Franklin / Front Street (0–0.5 mi from docks)",
    viatorProductCode: null,
    advertisedDockToDockMinutes: 140,
    checkInLeadMinutes: 0,
    outboundTransferMinutes: 10,
    activityDurationMinutes: 120,
    interActivityTransferMinutes: 0,
    returnTransferMinutes: 10,
    decompositionNote:
      "Total 140 min (2h 20m) self-paced downtown block comprises 10m walk from Marine Park to Front/Seward St + 120m self-paced cultural/seawalk/tram visit + 10m walk back to dock. No vehicle transfers or check-in lead times are double-counted.",
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    minimumMobility: "step_free_wheelchair",
    weatherCeilingSensitive: false,
    dependsOnCitationIds: ["jun-shi-heritage", "jun-cbj-harbors"],
    inputAudit: [
      {
        field: "price",
        label: "Admission & Optional Walk-Up Costs",
        valueSummary:
          "$0 (Downtown Seawalk & Overstreet Park) to $10 adult (Walter Soboleff Center); optional walk-up Goldbelt Tram ~$55–$60",
        basisType: "sourced_fact",
        citationIds: ["jun-shi-heritage", "jun-cbj-harbors"],
        verificationNote:
          "Public seawalk is free; Walter Soboleff Center walk-up admission and optional Mount Roberts tram ticket require no pre-booking.",
      },
      {
        field: "activity_duration",
        label: "Self-Paced Activity Duration",
        valueSummary:
          "120 min flexible on-site time (140 min including 10m walk each way from downtown berths)",
        basisType: "dcc_estimate",
        citationIds: ["jun-shi-heritage", "jun-cbj-harbors"],
        verificationNote:
          "Self-paced; visitors can return to downtown docks in 10 minutes at any point.",
      },
      {
        field: "transfers",
        label: "Pedestrian Access",
        valueSummary:
          "10 min level walk each way (0.2 mi from Marine Park to 105 S. Seward St; AJ Dock/Tender guests add dock shuttle/tender time)",
        basisType: "sourced_fact",
        citationIds: ["jun-cbj-harbors", "jun-shi-heritage"],
        verificationNote:
          "Located in the immediate downtown waterfront core.",
      },
      {
        field: "meeting_point",
        label: "Location",
        valueSummary:
          "Marine Park Seawalk & Walter Soboleff Center (105 S. Seward St, Downtown Juneau)",
        basisType: "sourced_fact",
        citationIds: ["jun-shi-heritage", "jun-cbj-harbors"],
        verificationNote:
          "Directly adjacent to downtown cruise ship berths.",
      },
      {
        field: "check_in_deadline",
        label: "Check-In Requirement",
        valueSummary: "0 min (walk-up entry; no timed voucher cutoff)",
        basisType: "sourced_fact",
        citationIds: ["jun-shi-heritage"],
        verificationNote:
          "No advance reservation or check-in lead time required.",
      },
      {
        field: "operating_season",
        label: "Operating Season",
        valueSummary:
          "Year-round for Downtown Seawalk and Walter Soboleff Center (Goldbelt Tram operates May–September cruise season)",
        basisType: "sourced_fact",
        citationIds: ["jun-shi-heritage", "jun-cbj-harbors"],
        verificationNote:
          "Soboleff Center and Seawalk remain open year-round; tramway is seasonal.",
      },
      {
        field: "accessibility",
        label: "Step-Free Accessibility",
        valueSummary:
          "Step-free wheelchair accessible along the paved CBJ Downtown Seawalk and inside the Walter Soboleff Center (elevator & level galleries)",
        basisType: "sourced_fact",
        citationIds: ["jun-shi-heritage", "jun-cbj-harbors"],
        verificationNote:
          "Best step-free option in Juneau with zero highway transfer risk.",
      },
      {
        field: "booking_and_cancellation",
        label: "Booking & Cancellation Terms",
        valueSummary:
          "No advance booking required; buy optional tram tickets at the base kiosk only after visually confirming Mount Roberts (1,800 ft) is clear of clouds",
        basisType: "dcc_estimate",
        citationIds: ["jun-shi-heritage"],
        verificationNote:
          "Avoids non-refundable pre-purchased tram tickets on zero-visibility fog days.",
      },
    ],
    supportedReasonsAndTradeoffs: [
      "Zero highway transfer risk: stays within 0.5 miles of the downtown cruise berths so you can return to the ship at any time.",
      "Step-free accessible along the Downtown Seawalk and inside the Sealaska Heritage Institute's Walter Soboleff Center (Lingít, Haida, and Tsimshian master art and clan house).",
      "Wait to buy Goldbelt Tram tickets at the base kiosk only after you see with your own eyes that Mount Roberts (1,800 ft) is below the cloud deck.",
    ],
    baseAssumptions: [
      "10 min walk between downtown seawalk/Marine Park and Front & Seward Street.",
      "120 min self-paced visit (Walter Soboleff Center, Overstreet Park whale statue seawalk, or walk-up Goldbelt Tram).",
      "10 min walk back to ship dock.",
    ],
    baseUncertainties: [
      "Mount Roberts (1,800 ft) can be socked in by low marine stratus clouds even when downtown streets are dry — do not pre-pay non-refundable tram tickets before checking the upper terminal visibility.",
    ],
    bookingTransparency: {
      actualOperators: [
        "Sealaska Heritage Institute (Walter Soboleff Center — Non-Profit Cultural Institution)",
        "City and Borough of Juneau Docks & Harbors (Public Seawalk)",
        "Goldbelt Tram (Optional Walk-Up Aerial Tramway)",
      ],
      inclusions: [
        "Free public access to Downtown Seawalk and Overstreet Park life-size breaching humpback whale sculpture",
        "Optional walk-up admission to Walter Soboleff Center exhibits ($10 adult)",
      ],
      exclusions: [
        "Optional walk-up Goldbelt Tram ticket (~$55–$60 adult, best purchased only if visibility is clear)",
      ],
      durationLabel:
        "2 hr 20 min self-paced (120m visit + 20m round-trip walk; return to dock in 10 minutes at any time)",
      meetingArrangements:
        "Self-guided walk from Marine Park / South Franklin Street to 105 S. Seward Street",
      priceBasis:
        "$0 (Public Seawalk, sourced fact) to $10 (Walter Soboleff Center, sourced fact) — no advance booking required",
      indicativePriceRangePerPersonUsd: { min: 0, max: 60 },
      cancellationConditions:
        "Walk-up admission; no advance commitment required",
      detailsVerifiedAt: "2026-10-23",
      detailsFreshnessNote:
        "Verified against Sealaska Heritage Institute and CBJ Seawalk information on 2026-10-23.",
      channels: [
        {
          channelType: "public_free",
          label: "Sealaska Heritage Institute — Walter Soboleff Center",
          operatorOrProviderName: "Sealaska Heritage Institute",
          url: "https://www.sealaskaheritage.org/",
          relationshipDisclosure:
            "Official Alaska Native cultural non-profit. No commercial relationship.",
          isCommercialPartner: false,
          commissionInfluenceOnRanking: 0,
        },
        {
          channelType: "public_free",
          label: "CBJ Docks & Harbors — Downtown Seawalk & Berths",
          operatorOrProviderName: "City and Borough of Juneau",
          url: "https://juneau.org/harbors",
          relationshipDisclosure:
            "Official municipal harbor resource. No commercial relationship.",
          isCommercialPartner: false,
          commissionInfluenceOnRanking: 0,
        },
      ],
    },
  },
];

function parseStrictClockMinutes(value: string): number | null {
  if (typeof value !== "string") return null;
  const m = value.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function validateStrictIsoDate(
  raw: string,
): { valid: true; year: number; month: number; day: number } | { valid: false; reason: string } {
  const m = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) {
    return {
      valid: false,
      reason: `Invalid travelDate format '${raw}' (expected YYYY-MM-DD).`,
    };
  }
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return {
      valid: false,
      reason: `Impossible calendar date '${raw}'.`,
    };
  }
  const probe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() + 1 !== month ||
    probe.getUTCDate() !== day
  ) {
    return {
      valid: false,
      reason: `Non-existent calendar date '${raw}'.`,
    };
  }
  return { valid: true, year, month, day };
}

function getJuneauOffsetMinutesAtUtcInstant(utcDate: Date): -480 | -540 {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Juneau",
    timeZoneName: "shortOffset",
  }).formatToParts(utcDate);
  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value || "GMT-8";
  if (tzPart.includes("-9")) return -540;
  return -480;
}

/**
 * Resolves the exact America/Juneau timezone rules (AKDT UTC-8 vs AKST UTC-9 and DST transitions)
 * for a given date and local arrival/all-aboard window using the IANA timezone database.
 */
export function resolveJuneauTimezoneForDate(
  dateIso: string,
  arrivalClockMinutes?: number,
  allAboardClockMinutes?: number,
): JuneauTimezoneResolution {
  const parsed = validateStrictIsoDate(dateIso);
  const year = parsed.valid ? parsed.year : 2026;
  const month = parsed.valid ? parsed.month : 7;
  const day = parsed.valid ? parsed.day : 15;

  // Probe morning (00:30 local -> ~09:30 UTC) and late evening (22:30 local -> ~06:30+1d UTC)
  const startProbeUtc = new Date(Date.UTC(year, month - 1, day, 9, 30, 0));
  const middayProbeUtc = new Date(Date.UTC(year, month - 1, day, 20, 0, 0));
  const endProbeUtc = new Date(Date.UTC(year, month - 1, day + 1, 6, 30, 0));

  const startOffset = getJuneauOffsetMinutesAtUtcInstant(startProbeUtc);
  const middayOffset = getJuneauOffsetMinutesAtUtcInstant(middayProbeUtc);
  const endOffset = getJuneauOffsetMinutesAtUtcInstant(endProbeUtc);

  const isDstTransitionDate = startOffset !== endOffset;
  const isDaylightSavingTime = middayOffset === -480;
  const tzAbbreviation = isDaylightSavingTime ? "AKDT" : "AKST";
  const utcOffsetString = isDaylightSavingTime ? "-08:00" : "-09:00";

  let dstTransitionAdjustmentMinutes = 0;
  let dstTransitionNote: string | null = null;

  if (isDstTransitionDate) {
    // Spring forward: 02:00 local jumps to 03:00 local (-540 -> -480)
    // Fall back: 01:00-01:59 repeats (-480 -> -540)
    const transitionMinuteOfDay = 120; // 02:00 local
    const spansTransition =
      typeof arrivalClockMinutes === "number" &&
      typeof allAboardClockMinutes === "number"
        ? arrivalClockMinutes <= transitionMinuteOfDay &&
          allAboardClockMinutes > transitionMinuteOfDay
        : true;
    if (startOffset === -540 && endOffset === -480) {
      if (spansTransition) {
        dstTransitionAdjustmentMinutes = -60;
      }
      dstTransitionNote = `Spring-forward DST transition on ${dateIso}: America/Juneau shifts from AKST (UTC-9) to AKDT (UTC-8) at 02:00 local time.${spansTransition ? " Elapsed port window is reduced by 60 minutes across the transition." : ""}`;
    } else if (startOffset === -480 && endOffset === -540) {
      if (spansTransition) {
        dstTransitionAdjustmentMinutes = 60;
      }
      dstTransitionNote = `Fall-back DST transition on ${dateIso}: America/Juneau shifts from AKDT (UTC-8) to AKST (UTC-9) at 02:00 local time.${spansTransition ? " Elapsed port window gains 60 minutes across the transition." : ""}`;
    }
  }

  return {
    timeZone: "America/Juneau",
    referenceDateIso: dateIso,
    tzAbbreviation,
    utcOffsetString,
    utcOffsetMinutes: middayOffset,
    isDaylightSavingTime,
    isDstTransitionDate,
    dstTransitionAdjustmentMinutes,
    dstTransitionNote,
  };
}

function formatMinutesAsClock(totalMinutes: number): string {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const MOBILITY_RANK: Record<Exclude<JuneauMobilityLevel, "unspecified">, number> = {
  step_free_wheelchair: 1,
  light_walking_1mi: 2,
  active_walking_3mi: 3,
};

export const DEFAULT_JUNEAU_SCENARIO_INPUT: JuneauPortDayScenarioInput = {
  shipArrivalTime: "08:00",
  allAboardTime: "16:30",
  arrivalDock: "downtown_walkoff",
  goalMode: "any_single_or_combo",
  travelMonth: 7,
  travelDate: "2026-07-15",
  overnightPortCall: false,
  partySize: 2,
  mobilityLevel: "unspecified",
  returnBufferMinutes: 90,
  weatherCondition: "unknown_or_forecast_only",
  budgetMaxPerPersonUsd: null,
};

function normalizeDockInput(raw?: string): JuneauArrivalDock {
  if (!raw) return "downtown_walkoff";
  if (
    raw === "downtown_walkoff" ||
    raw === "franklin_dock" ||
    raw === "aj_dock" ||
    raw === "tender_anchor" ||
    raw === "unknown_dock" ||
    raw === "independent_air_ferry"
  ) {
    return raw;
  }
  if (raw === "unknown" || raw === "unconfirmed") {
    return "unknown_dock";
  }
  if (raw === "ct_as_dock_downtown" || raw === "downtown_berth") {
    return "downtown_walkoff";
  }
  return "unknown_dock";
}

function normalizeGoalInput(raw?: string): JuneauGoalMode {
  if (!raw) return "any_single_or_combo";
  if (
    raw === "any_single_or_combo" ||
    raw === "single_activity_focus" ||
    raw === "two_activity_combo" ||
    raw === "public_or_free_only"
  ) {
    return raw;
  }
  if (raw === "any") return "any_single_or_combo";
  if (raw === "single_activity") return "single_activity_focus";
  if (raw === "two_activities") return "two_activity_combo";
  return "any_single_or_combo";
}

export function serializeJuneauScenarioToQuery(
  input: JuneauPortDayScenarioInput,
): string {
  const params = new URLSearchParams();
  if (input.shipArrivalTime) params.set("arrive", input.shipArrivalTime);
  if (input.allAboardTime) params.set("allAboard", input.allAboardTime);
  if (input.arrivalDock) params.set("dock", normalizeDockInput(input.arrivalDock));
  if (input.goalMode) params.set("goal", normalizeGoalInput(input.goalMode));
  if (input.travelDate) params.set("date", input.travelDate);
  if (input.travelMonth !== undefined) params.set("month", String(input.travelMonth));
  if (input.overnightPortCall) params.set("overnight", "1");
  if (input.partySize !== undefined) params.set("partySize", String(input.partySize));
  if (input.mobilityLevel && input.mobilityLevel !== "unspecified") {
    params.set("mobility", input.mobilityLevel);
  }
  if (input.returnBufferMinutes !== undefined) {
    params.set("buffer", String(input.returnBufferMinutes));
  }
  if (
    input.weatherCondition &&
    input.weatherCondition !== "unknown_or_forecast_only"
  ) {
    params.set("weather", input.weatherCondition);
  }
  if (
    typeof input.budgetMaxPerPersonUsd === "number" &&
    Number.isFinite(input.budgetMaxPerPersonUsd)
  ) {
    params.set("budget", String(input.budgetMaxPerPersonUsd));
  }
  return params.toString();
}

export const buildJuneauScenarioQueryString = serializeJuneauScenarioToQuery;

export function parseJuneauScenarioFromQuery(
  raw: URLSearchParams | Record<string, string | string[] | undefined>,
): JuneauPortDayScenarioInput {
  const getVal = (key: string): string | undefined => {
    if (raw instanceof URLSearchParams) {
      return raw.get(key) || undefined;
    }
    const v = raw[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const dockRaw = getVal("dock") || getVal("port_dock");
  const arrivalDock: JuneauArrivalDock = dockRaw
    ? normalizeDockInput(dockRaw)
    : "downtown_walkoff";

  const goalRaw = getVal("goal");
  const goalMode: JuneauGoalMode = normalizeGoalInput(goalRaw);

  const mobilityRaw = getVal("mobility");
  const validMobilities: JuneauMobilityLevel[] = [
    "unspecified",
    "step_free_wheelchair",
    "light_walking_1mi",
    "active_walking_3mi",
  ];
  const mobilityLevel: JuneauMobilityLevel = validMobilities.includes(
    mobilityRaw as JuneauMobilityLevel,
  )
    ? (mobilityRaw as JuneauMobilityLevel)
    : "unspecified";

  const weatherRaw = getVal("weather");
  const validWeathers: JuneauWeatherInputState[] = [
    "unknown_or_forecast_only",
    "clear_high_ceiling",
    "low_ceiling_rain_fog",
    "provider_telemetry_unavailable",
  ];
  const weatherCondition: JuneauWeatherInputState = validWeathers.includes(
    weatherRaw as JuneauWeatherInputState,
  )
    ? (weatherRaw as JuneauWeatherInputState)
    : "unknown_or_forecast_only";

  const dateRaw = getVal("date");
  const travelDate = dateRaw ? dateRaw.trim() : undefined;

  const monthNum = Number(getVal("month"));
  let travelMonth =
    Number.isInteger(monthNum) && monthNum >= 1 && monthNum <= 12
      ? monthNum
      : 7;
  if (travelDate) {
    const parsedDate = validateStrictIsoDate(travelDate);
    if (parsedDate.valid && !getVal("month")) {
      travelMonth = parsedDate.month;
    }
  }

  const overnightRaw = getVal("overnight");
  const overnightPortCall =
    overnightRaw === "1" || overnightRaw === "true" || overnightRaw === "yes";

  const partyNum = Number(getVal("partySize") || getVal("travelers"));
  const partySize =
    Number.isInteger(partyNum) && partyNum >= 1 && partyNum <= 20 ? partyNum : 2;

  const bufferNum = Number(getVal("buffer"));
  const returnBufferMinutes =
    Number.isInteger(bufferNum) && bufferNum >= 0 && bufferNum <= 240
      ? bufferNum
      : arrivalDock === "independent_air_ferry"
        ? 0
        : 90;

  const budgetRaw = getVal("budget");
  const budgetNum =
    budgetRaw !== undefined && budgetRaw !== "" ? Number(budgetRaw) : NaN;
  const budgetMaxPerPersonUsd =
    Number.isFinite(budgetNum) && budgetNum >= 0 ? budgetNum : null;

  return {
    shipArrivalTime: getVal("arrive") || "08:00",
    allAboardTime: getVal("allAboard") || "16:30",
    arrivalDock,
    goalMode,
    travelMonth,
    travelDate,
    overnightPortCall,
    partySize,
    mobilityLevel,
    returnBufferMinutes,
    weatherCondition,
    budgetMaxPerPersonUsd,
  };
}

export const parseJuneauScenarioFromSearchParams = parseJuneauScenarioFromQuery;

export type JuneauScenarioEvaluationOptions = {
  node?: TravelReferenceNode;
  now?: Date;
  /**
   * Optional test-only override for review records or missing schedules.
   * Production callers never pass invented reviews here; production reads
   * exclusively from `loadPermittedThirdPartyReviewCacheForProduct`.
   */
  reviewOverridesByOptionId?: Record<
    string,
    {
      checkStatus: "checked_ok" | "unavailable";
      reviews: ThirdPartyReviewInput[];
      lastRetrievedAt?: string | null;
    }
  >;
  missingScheduleOptionIds?: string[];
  optionDefinitionsOverride?: RawJuneauOptionDefinition[];
};

/**
 * Evaluates a Juneau port-day scenario against current claim evidence, date-aware
 * America/Juneau timezone rules, non-double-counted transfer/activity durations,
 * mobility constraints, weather non-conflation rules, and real cached 180-day reviews.
 *
 * Commercial relationships (affiliate links, network satellites, commission rates)
 * have zero weight (commercialWeight = 0) in option evaluation or sorting.
 */
export function evaluateJuneauPortDayScenario(
  input: Partial<JuneauPortDayScenarioInput> = {},
  options: JuneauScenarioEvaluationOptions = {},
): JuneauPortDayEvaluationResult {
  const now = options.now || new Date("2026-10-25T12:00:00.000Z");
  const node = options.node || getBaseTravelReferenceNodeById("juneau");
  const dependencyReport = evaluateNodeClaimDependencies(node, now);
  const inputValidationErrors: string[] = [];

  const rawDock = input.arrivalDock;
  const arrivalDock: JuneauArrivalDock = rawDock
    ? normalizeDockInput(rawDock)
    : "downtown_walkoff";
  const defaultBuffer = arrivalDock === "independent_air_ferry" ? 0 : 90;

  let resolvedTravelDate: string | null =
    input.travelDate !== undefined ? input.travelDate : "2026-07-15";
  let derivedMonthFromDate: number | null = null;

  if (resolvedTravelDate !== null && resolvedTravelDate.trim() !== "") {
    const dateCheck = validateStrictIsoDate(resolvedTravelDate);
    if (!dateCheck.valid) {
      inputValidationErrors.push(dateCheck.reason);
    } else {
      derivedMonthFromDate = dateCheck.month;
    }
  } else {
    resolvedTravelDate = null;
  }

  const hasValidMonthInput =
    typeof input.travelMonth === "number" &&
    Number.isInteger(input.travelMonth) &&
    input.travelMonth >= 1 &&
    input.travelMonth <= 12;

  let resolvedTravelMonth: number;
  if (
    derivedMonthFromDate !== null &&
    derivedMonthFromDate !== 7 &&
    (!hasValidMonthInput || input.travelMonth === 7)
  ) {
    resolvedTravelMonth = derivedMonthFromDate;
  } else if (hasValidMonthInput && input.travelMonth !== 7 && derivedMonthFromDate === 7) {
    resolvedTravelMonth = input.travelMonth!;
    resolvedTravelDate = `2026-${String(resolvedTravelMonth).padStart(2, "0")}-15`;
  } else if (derivedMonthFromDate !== null) {
    resolvedTravelMonth = derivedMonthFromDate;
  } else if (hasValidMonthInput) {
    resolvedTravelMonth = input.travelMonth!;
  } else {
    resolvedTravelMonth = 7;
  }

  const rawArrivalStr =
    input.shipArrivalTime !== undefined ? input.shipArrivalTime : "08:00";
  const rawAllAboardStr =
    input.allAboardTime !== undefined ? input.allAboardTime : "16:30";
  const overnightPortCall = Boolean(input.overnightPortCall);

  const parsedArrivalMinutes = parseStrictClockMinutes(rawArrivalStr);
  const parsedAllAboardMinutes = parseStrictClockMinutes(rawAllAboardStr);

  if (parsedArrivalMinutes === null) {
    inputValidationErrors.push(
      `Invalid ship arrival time '${rawArrivalStr}' (expected 24-hour HH:MM in America/Juneau).`,
    );
  }
  if (parsedAllAboardMinutes === null) {
    inputValidationErrors.push(
      `Invalid all-aboard time '${rawAllAboardStr}' (expected 24-hour HH:MM in America/Juneau).`,
    );
  }

  const arrivalMinutes = parsedArrivalMinutes ?? 8 * 60;
  const rawAllAboardMinutes = parsedAllAboardMinutes ?? 16 * 60 + 30;

  let allAboardMinutes = rawAllAboardMinutes;
  if (
    parsedArrivalMinutes !== null &&
    parsedAllAboardMinutes !== null &&
    rawAllAboardMinutes <= arrivalMinutes
  ) {
    if (overnightPortCall) {
      allAboardMinutes = rawAllAboardMinutes + 1440;
    } else {
      inputValidationErrors.push(
        `All-aboard time (${rawAllAboardStr}) is earlier than or equal to ship arrival time (${rawArrivalStr}) without overnightPortCall enabled. Enable Overnight Port Call if your ship stays past midnight.`,
      );
    }
  } else if (overnightPortCall && rawAllAboardMinutes > arrivalMinutes) {
    allAboardMinutes = rawAllAboardMinutes + 1440;
  }

  const effectiveDateForTz =
    resolvedTravelDate && validateStrictIsoDate(resolvedTravelDate).valid
      ? resolvedTravelDate
      : `2026-${String(resolvedTravelMonth).padStart(2, "0")}-15`;

  const timezoneResolution = resolveJuneauTimezoneForDate(
    effectiveDateForTz,
    arrivalMinutes,
    allAboardMinutes,
  );

  const normalizedInput = {
    shipArrivalTime: rawArrivalStr,
    allAboardTime: rawAllAboardStr,
    arrivalDock,
    goalMode: normalizeGoalInput(input.goalMode),
    travelMonth: resolvedTravelMonth,
    travelDate: resolvedTravelDate,
    overnightPortCall,
    partySize:
      typeof input.partySize === "number" && input.partySize >= 1
        ? input.partySize
        : 2,
    mobilityLevel: input.mobilityLevel || "unspecified",
    returnBufferMinutes:
      typeof input.returnBufferMinutes === "number" &&
      input.returnBufferMinutes >= 0
        ? input.returnBufferMinutes
        : defaultBuffer,
    weatherCondition: input.weatherCondition || "unknown_or_forecast_only",
    budgetMaxPerPersonUsd:
      typeof input.budgetMaxPerPersonUsd === "number" &&
      Number.isFinite(input.budgetMaxPerPersonUsd)
        ? input.budgetMaxPerPersonUsd
        : null,
  };

  const rawPortDiff =
    inputValidationErrors.length > 0 ? 0 : Math.max(0, allAboardMinutes - arrivalMinutes);
  const totalPortWindowMinutes = Math.max(
    0,
    rawPortDiff + timezoneResolution.dstTransitionAdjustmentMinutes,
  );

  const dockSpec = DOCK_CONFIG[normalizedInput.arrivalDock];
  const citationMap = new Map(node.evidenceRegistry.map((c) => [c.id, c]));
  const missingScheduleSet = new Set(options.missingScheduleOptionIds || []);
  const definitionsToEvaluate =
    options.optionDefinitionsOverride || JUNEAU_OPTION_DEFINITIONS;

  const evaluatedOptions: JuneauEvaluatedDecisionOption[] =
    definitionsToEvaluate.map((def) => {
      const disembarkationAndDockMinutes = dockSpec.disembarkMinutes;
      const returnDockQueueMinutes = dockSpec.returnQueueMinutes;
      const requiredReturnBufferMinutes = normalizedInput.returnBufferMinutes;

      const totalRequiredMinutes =
        disembarkationAndDockMinutes +
        def.checkInLeadMinutes +
        def.outboundTransferMinutes +
        def.activityDurationMinutes +
        def.interActivityTransferMinutes +
        def.returnTransferMinutes +
        returnDockQueueMinutes +
        requiredReturnBufferMinutes;

      const netMarginMinutes = totalPortWindowMinutes - totalRequiredMinutes;

      const earliestShoreReadyMinutes =
        arrivalMinutes + disembarkationAndDockMinutes;
      const latestCheckInMinutes =
        allAboardMinutes -
        requiredReturnBufferMinutes -
        returnDockQueueMinutes -
        def.returnTransferMinutes -
        def.interActivityTransferMinutes -
        def.activityDurationMinutes -
        def.outboundTransferMinutes;
      const estimatedBackAtDockMinutes =
        earliestShoreReadyMinutes +
        def.checkInLeadMinutes +
        def.outboundTransferMinutes +
        def.activityDurationMinutes +
        def.interActivityTransferMinutes +
        def.returnTransferMinutes +
        returnDockQueueMinutes;
      const targetAllAboardBufferCutoffMinutes =
        allAboardMinutes - requiredReturnBufferMinutes;

      const durationAudit: JuneauDurationAudit = {
        advertisedDockToDockMinutes: def.advertisedDockToDockMinutes,
        onSiteOrOnWaterActivityMinutes: def.activityDurationMinutes,
        checkInLeadMinutes: def.checkInLeadMinutes,
        outboundTransferMinutes: def.outboundTransferMinutes,
        interActivityTransferMinutes: def.interActivityTransferMinutes,
        returnTransferMinutes: def.returnTransferMinutes,
        doubleCountingStatus: "verified_not_double_counted",
        decompositionNote: def.decompositionNote,
      };

      const timing: JuneauTimingBreakdown = {
        timezone: "America/Juneau",
        tzAbbreviation: timezoneResolution.tzAbbreviation,
        utcOffsetString: timezoneResolution.utcOffsetString,
        shipArrivalTime:
          parsedArrivalMinutes !== null
            ? formatMinutesAsClock(arrivalMinutes)
            : rawArrivalStr,
        allAboardTime:
          parsedAllAboardMinutes !== null
            ? formatMinutesAsClock(allAboardMinutes)
            : rawAllAboardStr,
        overnightPortCall,
        totalPortWindowMinutes,
        disembarkationAndDockMinutes,
        checkInLeadMinutes: def.checkInLeadMinutes,
        outboundTransferMinutes: def.outboundTransferMinutes,
        activityDurationMinutes: def.activityDurationMinutes,
        interActivityTransferMinutes: def.interActivityTransferMinutes,
        returnTransferMinutes: def.returnTransferMinutes,
        returnDockQueueMinutes,
        requiredReturnBufferMinutes,
        totalRequiredMinutes,
        netMarginMinutes,
        earliestShoreReadyTime: formatMinutesAsClock(earliestShoreReadyMinutes),
        latestCheckInTime: formatMinutesAsClock(latestCheckInMinutes),
        estimatedBackAtDockTime: formatMinutesAsClock(
          estimatedBackAtDockMinutes,
        ),
        targetAllAboardBufferCutoffTime: formatMinutesAsClock(
          targetAllAboardBufferCutoffMinutes,
        ),
        durationAudit,
        mathematicalFeasibilityDisclaimer:
          "Fitting the time budget shows mathematical schedule feasibility only — a mathematically feasible itinerary is not a guarantee of operation or timely return, nor does it confirm live ticket availability or personal accessibility suitability.",
      };

      const hardConstraintViolations: string[] = [];
      for (const err of inputValidationErrors) {
        hardConstraintViolations.push(`Invalid scenario input: ${err}`);
      }

      if (missingScheduleSet.has(def.optionId)) {
        hardConstraintViolations.push(
          `Operating schedule missing or unconfirmed for ${def.shortLabel}: DCC does not supply plausible default departure times when schedule evidence is missing.`,
        );
      }

      if (inputValidationErrors.length === 0 && netMarginMinutes < 0) {
        hardConstraintViolations.push(
          `Exceeds your supplied port window by ${Math.abs(netMarginMinutes)} minutes (${totalRequiredMinutes} min required vs. ${totalPortWindowMinutes} min available including ${requiredReturnBufferMinutes} min return buffer).`,
        );
      }

      if (!def.operatingMonths.includes(normalizedInput.travelMonth)) {
        hardConstraintViolations.push(
          `Seasonal closure: this option operates in months [${def.operatingMonths.join(", ")}], while your selected date/month is month ${normalizedInput.travelMonth} (${effectiveDateForTz}).`,
        );
      }

      if (normalizedInput.mobilityLevel !== "unspecified") {
        const travelerMobilityRank = MOBILITY_RANK[normalizedInput.mobilityLevel];
        const optionRequiredRank = MOBILITY_RANK[def.minimumMobility];
        if (travelerMobilityRank < optionRequiredRank) {
          hardConstraintViolations.push(
            `Does not meet supplied mobility constraint (${normalizedInput.mobilityLevel}): requires at least '${def.minimumMobility}'.`,
          );
        }
      }

      if (
        normalizedInput.goalMode === "public_or_free_only" &&
        def.category !== "public_free_or_municipal" &&
        def.optionId !== "jun-opt-usfs-mendenhall-shuttle"
      ) {
        hardConstraintViolations.push(
          `Excluded by your 'Public / Free / Independent Only' filter (this option is a commercial ${def.category.replace(/_/g, " ")}).`,
        );
      }

      if (
        normalizedInput.goalMode === "two_activity_combo" &&
        def.category !== "two_activity_combo"
      ) {
        hardConstraintViolations.push(
          `Single-activity option (your current filter requests two-activity combinations; shown below for comparison).`,
        );
      }

      if (
        normalizedInput.budgetMaxPerPersonUsd !== null &&
        def.bookingTransparency.indicativePriceRangePerPersonUsd.min >
          normalizedInput.budgetMaxPerPersonUsd
      ) {
        hardConstraintViolations.push(
          `Indicative minimum rate ($${def.bookingTransparency.indicativePriceRangePerPersonUsd.min}/person) exceeds your supplied budget ceiling ($${normalizedInput.budgetMaxPerPersonUsd}/person).`,
        );
      }

      // Check supporting evidence status
      const supportingCitations = def.dependsOnCitationIds.map((cid) => {
        const cit = citationMap.get(cid);
        const evalFresh = dependencyReport.citationFreshness[cid];
        return {
          citationId: cid,
          sourceTitle: cit?.sourceTitle || cid,
          issuingOrganization: cit?.issuingOrganization || "Official Source",
          sourceUrl: cit?.sourceUrl || "#sources-and-verification",
          evidenceStatus: evalFresh
            ? evalFresh.evidenceStatus
            : ("unverified" as const),
          verifiedAt: evalFresh ? evalFresh.verifiedAt : null,
        };
      });

      const expiredOrConflictedCitations = supportingCitations.filter(
        (c) =>
          c.evidenceStatus === "expired" ||
          c.evidenceStatus === "conflicted" ||
          c.evidenceStatus === "unavailable",
      );
      const staleCitations = supportingCitations.filter(
        (c) => c.evidenceStatus === "stale" || c.evidenceStatus === "unverified",
      );

      let evidenceQualificationNote: string | null = null;
      if (expiredOrConflictedCitations.length > 0) {
        evidenceQualificationNote = `Recommendation withdrawn/qualified: supporting citation(s) [${expiredOrConflictedCitations.map((c) => `${c.citationId}: ${c.evidenceStatus}`).join(", ")}] are expired, conflicted, or unavailable. Confirm directly with the responsible authority before acting.`;
      } else if (missingScheduleSet.has(def.optionId)) {
        evidenceQualificationNote = `Recommendation withdrawn/qualified: operating schedule evidence for ${def.shortLabel} is missing or unconfirmed. DCC does not supply plausible default schedules.`;
      } else if (staleCitations.length > 0) {
        evidenceQualificationNote = `Evidence qualification: supporting citation(s) [${staleCitations.map((c) => c.citationId).join(", ")}] are stale and due for re-verification.`;
      }

      let fitStatus: JuneauEvaluatedOptionFit;
      if (
        expiredOrConflictedCitations.length > 0 ||
        missingScheduleSet.has(def.optionId)
      ) {
        fitStatus = "withdrawn_or_qualified_evidence";
      } else if (hardConstraintViolations.length > 0) {
        fitStatus = "does_not_fit";
      } else if (
        netMarginMinutes < 45 ||
        normalizedInput.arrivalDock === "unknown_dock" ||
        (normalizedInput.mobilityLevel === "unspecified" &&
          def.minimumMobility === "active_walking_3mi") ||
        (def.weatherCeilingSensitive &&
          (normalizedInput.weatherCondition === "low_ceiling_rain_fog" ||
            normalizedInput.weatherCondition ===
              "provider_telemetry_unavailable"))
      ) {
        fitStatus = "tight_buffer";
      } else {
        fitStatus = "fits_comfortably";
      }

      const fitBadgeLabel =
        fitStatus === "fits_comfortably"
          ? `Fits Time Budget (+${netMarginMinutes} min slack)`
          : fitStatus === "tight_buffer"
            ? `Conditional / Tight (+${netMarginMinutes} min slack)`
            : fitStatus === "withdrawn_or_qualified_evidence"
              ? "Evidence Expired / Conflicted — Verify Directly"
              : "Does Not Fit Current Constraints";

      const assumptionsUsed = [
        `${dockSpec.assumptionText} [Basis: ${dockSpec.basisType.replace(/_/g, " ")}]`,
        `Date & Timezone: ${effectiveDateForTz} in ${timezoneResolution.timeZone} (${timezoneResolution.tzAbbreviation} UTC${timezoneResolution.utcOffsetString}).${timezoneResolution.dstTransitionNote ? ` ${timezoneResolution.dstTransitionNote}` : ""}`,
        `Traveler assumption — return buffer before all-aboard: ${requiredReturnBufferMinutes} minutes.`,
        ...def.baseAssumptions,
      ];

      const uncertainOrNeedsConfirmation = [...def.baseUncertainties];
      if (normalizedInput.arrivalDock === "unknown_dock") {
        uncertainOrNeedsConfirmation.unshift(
          "Cruise berth is unconfirmed: DCC applied the conservative 50 min outbound / 40 min return tender/shuttle allowance rather than assuming a fast downtown walk-off. Confirm your ship's assigned berth on the CBJ Docks & Harbors schedule.",
        );
      }
      if (normalizedInput.mobilityLevel === "unspecified") {
        uncertainOrNeedsConfirmation.push(
          `Mobility preference was not specified: DCC did not assume step-free or long-distance walking ability. This option requires '${def.minimumMobility.replace(/_/g, " ")}'.`,
        );
      }
      if (normalizedInput.weatherCondition === "provider_telemetry_unavailable") {
        uncertainOrNeedsConfirmation.push(
          `Verification limitation: Live NOAA/FAA weather telemetry is currently unavailable. Missing provider data is NEVER treated as zero hazards or an all-clear; check official FAA PAJN METAR and NWS Juneau advisories directly.`,
        );
      } else if (
        def.weatherCeilingSensitive &&
        normalizedInput.weatherCondition === "low_ceiling_rain_fog"
      ) {
        uncertainOrNeedsConfirmation.push(
          `Low ceiling / rain / fog selected: FAA Part 135 helicopter operators frequently hold or cancel icefield landings under low ceilings or flat light. Have a surface backup (Auke Bay whale watching or Mendenhall shuttle) ready, but only the licensed operator can cancel a flight.`,
        );
      } else if (def.weatherCeilingSensitive) {
        uncertainOrNeedsConfirmation.push(
          `Surface weather or forecasts do not establish FAA Part 135 flight dispatch; confirm morning flight status directly with the helicopter operator.`,
        );
      }
      if (evidenceQualificationNote) {
        uncertainOrNeedsConfirmation.unshift(evidenceQualificationNote);
      }

      const whatInputChangeWouldAlterResult: string[] = [];
      if (netMarginMinutes < 0 && inputValidationErrors.length === 0) {
        const deficit = Math.abs(netMarginMinutes);
        whatInputChangeWouldAlterResult.push(
          `Extending your port window by at least +${deficit} minutes (e.g., all-aboard at ${formatMinutesAsClock(allAboardMinutes + deficit)} instead of ${timing.allAboardTime}) would bring this option to a 0-minute margin (+${deficit + 45} min for a comfortable 45-min cushion).`,
        );
        if (
          (normalizedInput.arrivalDock === "tender_anchor" ||
            normalizedInput.arrivalDock === "unknown_dock") &&
          deficit <= 65
        ) {
          whatInputChangeWouldAlterResult.push(
            `Confirming a downtown walk-off berth (AS/CTF) instead of tendering / unknown berth saves 65 minutes of queue time and flips this option to feasible.`,
          );
        } else if (normalizedInput.arrivalDock === "aj_dock" && deficit <= 30) {
          whatInputChangeWouldAlterResult.push(
            `Berthing at AS/CTF instead of AJ Dock saves 30 minutes of shuttle friction and makes this window feasible.`,
          );
        }
        if (def.category === "two_activity_combo") {
          whatInputChangeWouldAlterResult.push(
            `Switching from a two-activity combination to a single corridor activity (Mendenhall Shuttle or Auke Bay Whale Watching alone) saves 95–130 minutes and fits your current window.`,
          );
        }
      } else if (netMarginMinutes < 45 && inputValidationErrors.length === 0) {
        whatInputChangeWouldAlterResult.push(
          `If your ship's arrival is delayed by more than ${netMarginMinutes} minutes or if you switch to tendering (+65 min round-trip queue), this option will breach your ${requiredReturnBufferMinutes}-minute all-aboard buffer.`,
        );
      } else if (inputValidationErrors.length === 0) {
        whatInputChangeWouldAlterResult.push(
          `Even with up to ${netMarginMinutes} minutes of transfer delay, this option clears your ${requiredReturnBufferMinutes}-minute return buffer; however, reducing your port window below ${formatMinutesAsClock(arrivalMinutes + totalRequiredMinutes)} would cause it to fail.`,
        );
      }

      if (!def.operatingMonths.includes(normalizedInput.travelMonth)) {
        whatInputChangeWouldAlterResult.push(
          `Changing your trip date to May–September (months 5–9) enables summer glacier, whale, and combo operations.`,
        );
      }

      // Connect real review cache (or test-only override when running unit tests)
      const overrideReview = options.reviewOverridesByOptionId?.[def.optionId];
      const realCacheLookup = overrideReview
        ? {
            checkStatus: overrideReview.checkStatus,
            reviews: overrideReview.reviews,
            lastRetrievedAt: overrideReview.lastRetrievedAt ?? null,
          }
        : loadPermittedThirdPartyReviewCacheForProduct({
            targetOptionId: def.optionId,
            viatorProductCode: def.viatorProductCode,
          });

      const recentReviewSummary = summarizeRecentReviews({
        productCode: def.optionId,
        reviews: realCacheLookup.reviews,
        referenceDate: now,
        lastRetrievedAt: realCacheLookup.lastRetrievedAt,
        windowDays: 180,
        sourcesQueried: def.viatorProductCode
          ? [`Viator Review Cache (${def.viatorProductCode})`]
          : [],
        checkStatus: realCacheLookup.checkStatus,
        samplingNote:
          "Filtered strictly by review publication date within the rolling 180-day window. Undated reviews and sync-only timestamps are excluded.",
      });

      const conciseVerdict =
        fitStatus === "withdrawn_or_qualified_evidence"
          ? `${def.shortLabel}: Qualified/withdrawn pending source re-verification (${evidenceQualificationNote}).`
          : fitStatus === "does_not_fit"
            ? `${def.shortLabel}: Does not fit current constraints (${hardConstraintViolations[0]}).`
            : fitStatus === "tight_buffer"
              ? `${def.shortLabel}: Fits the time budget with +${netMarginMinutes} min slack beyond your ${requiredReturnBufferMinutes} min buffer, but requires confirming conditional factors (berth, ceiling, or tight transfer slack).`
              : `${def.shortLabel}: Fits the time budget comfortably with +${netMarginMinutes} min slack beyond your ${requiredReturnBufferMinutes} min return buffer (estimated back at dock by ${timing.estimatedBackAtDockTime} ${timezoneResolution.tzAbbreviation}).`;

      const fitTierScore =
        fitStatus === "fits_comfortably"
          ? 300
          : fitStatus === "tight_buffer"
            ? 200
            : fitStatus === "withdrawn_or_qualified_evidence"
              ? 100
              : 0;

      const operationalGuaranteeSeparation = {
        fitsTimeBudget:
          fitStatus === "fits_comfortably" || fitStatus === "tight_buffer",
        confirmedOperationGuaranteed: false as const,
        ticketAvailabilityGuaranteed: false as const,
        accessibilityConfirmedForTraveler:
          normalizedInput.mobilityLevel !== "unspecified" &&
          MOBILITY_RANK[normalizedInput.mobilityLevel] >=
            MOBILITY_RANK[def.minimumMobility],
        guaranteedShipReturn: false as const,
        separationStatement:
          "Fitting the time budget means the activity, transfers, check-in, and return buffer fit within your supplied hours. It does NOT confirm live seat availability, weather/operator dispatch, individual accessibility, or a guaranteed return to the ship.",
      };

      return {
        optionId: def.optionId,
        title: def.title,
        shortLabel: def.shortLabel,
        category: def.category,
        corridor: def.corridor,
        fitStatus,
        fitBadgeLabel,
        conciseVerdict,
        timing,
        inputAudit: def.inputAudit,
        operationalGuaranteeSeparation,
        hardConstraintViolations,
        supportedReasonsAndTradeoffs: def.supportedReasonsAndTradeoffs,
        assumptionsUsed,
        uncertainOrNeedsConfirmation,
        whatInputChangeWouldAlterResult,
        dependsOnCitationIds: def.dependsOnCitationIds,
        supportingCitations,
        evidenceQualificationNote,
        recentReviewSummary,
        bookingTransparency: def.bookingTransparency,
        rankingAudit: {
          fitTierScore,
          netMarginMinutes,
          commercialWeight: 0,
          rankingExplanation:
            "Ranked strictly by constraint fit tier and time slack margin (affiliate status, ownership, and commission rates are ignored).",
        },
      };
    });

  // Sort strictly by fitTierScore DESC, goal alignment, and netMarginMinutes DESC (never by commercial status)
  evaluatedOptions.sort((a, b) => {
    if (b.rankingAudit.fitTierScore !== a.rankingAudit.fitTierScore) {
      return b.rankingAudit.fitTierScore - a.rankingAudit.fitTierScore;
    }
    if (normalizedInput.goalMode === "two_activity_combo") {
      const aCombo = a.category === "two_activity_combo" ? 1 : 0;
      const bCombo = b.category === "two_activity_combo" ? 1 : 0;
      if (bCombo !== aCombo) return bCombo - aCombo;
    }
    if (normalizedInput.goalMode === "public_or_free_only") {
      const aFree = a.category === "public_free_or_municipal" ? 1 : 0;
      const bFree = b.category === "public_free_or_municipal" ? 1 : 0;
      if (bFree !== aFree) return bFree - aFree;
    }
    return b.rankingAudit.netMarginMinutes - a.rankingAudit.netMarginMinutes;
  });

  const fittingCount = evaluatedOptions.filter(
    (o) => o.fitStatus === "fits_comfortably" || o.fitStatus === "tight_buffer",
  ).length;
  const comboFits = evaluatedOptions.filter(
    (o) =>
      o.category === "two_activity_combo" &&
      (o.fitStatus === "fits_comfortably" || o.fitStatus === "tight_buffer"),
  );

  const portHoursLabel = (totalPortWindowMinutes / 60).toFixed(1);
  let conciseBottomLine: string;

  if (inputValidationErrors.length > 0) {
    conciseBottomLine = `Cannot confirm port-day fit until input errors are corrected: ${inputValidationErrors.join(" ")}`;
  } else {
    conciseBottomLine = `For a ${portHoursLabel}-hour Juneau call on ${effectiveDateForTz} (${formatMinutesAsClock(arrivalMinutes)}–${formatMinutesAsClock(allAboardMinutes)} ${timezoneResolution.tzAbbreviation}, UTC${timezoneResolution.utcOffsetString}${overnightPortCall ? ", overnight call" : ""}) at ${dockSpec.label} with a ${normalizedInput.returnBufferMinutes}-minute return buffer: `;
    if (dependencyReport.hasWithdrawnOrConflictedClaims) {
      const affectedLabels = evaluatedOptions
        .filter((o) => o.fitStatus === "withdrawn_or_qualified_evidence")
        .map((o) => o.shortLabel);
      const unaffectedFitting = evaluatedOptions
        .filter(
          (o) =>
            o.fitStatus === "fits_comfortably" || o.fitStatus === "tight_buffer",
        )
        .map((o) => o.shortLabel);
      conciseBottomLine += `Supporting evidence for [${affectedLabels.join(", ")}] is currently expired, conflicted, or unavailable and is qualified below, while ${unaffectedFitting.length} unaffected option(s) (${unaffectedFitting.join(", ")}) remain supported.`;
    } else if (comboFits.length > 0) {
      conciseBottomLine += `You have enough port time for either a single primary excursion OR a linked two-activity combination (${comboFits.map((c) => c.shortLabel).join("; ")}) provided both activities connect directly in the Mendenhall/Auke Bay valley without backtracking downtown. Fitting the time budget does not guarantee ticket availability or weather dispatch.`;
    } else if (fittingCount > 0) {
      conciseBottomLine += `Two-activity combinations exceed your safe time window once dock transfers and the ${normalizedInput.returnBufferMinutes}-minute all-aboard buffer are applied. Choose ONE primary activity (${evaluatedOptions.filter((o) => o.fitStatus === "fits_comfortably" || o.fitStatus === "tight_buffer").map((o) => o.shortLabel).join(", ")}).`;
    } else {
      conciseBottomLine += `Your current port window (${totalPortWindowMinutes} min) or seasonal date (${effectiveDateForTz}) does not fit valley excursions once disembarkation and the ${normalizedInput.returnBufferMinutes}-minute return buffer are subtracted; stay within the immediate downtown walk-off zone or adjust your date/window.`;
    }
  }

  const weatherAndTelemetryAdvisory: JuneauPortDayEvaluationResult["weatherAndTelemetryAdvisory"] =
    normalizedInput.weatherCondition === "provider_telemetry_unavailable"
      ? {
          inputState: normalizedInput.weatherCondition,
          status: "telemetry_unavailable_limitation",
          headline:
            "Verification Limitation: Upstream Weather/Sensor Feed Unavailable",
          explanation:
            "One or more live environmental feeds (NOAA CO-OPS 9452210, FAA PAJN METAR, or NWS Juneau) failed or timed out. A failed fetch establishes a verification limitation — it is NEVER converted into zero hazards, confirmed flight availability, or an all-clear.",
          neverAllClearRule:
            "Do not treat missing telemetry as safe operating conditions. Check FAA PAJN METAR and your operator's dispatch desk directly.",
        }
      : normalizedInput.weatherCondition === "low_ceiling_rain_fog"
        ? {
            inputState: normalizedInput.weatherCondition,
            status: "low_ceiling_caution",
            headline: "Low Ceiling / Rain / Fog Scenario Active",
            explanation:
              "Low cloud ceilings (<1,500 ft) and flat light over the Juneau Icefield frequently ground FAA Part 135 helicopter landings while surface activities (Auke Bay whale watching and Mendenhall Glacier trails) continue operating normally.",
            neverAllClearRule:
              "Weather observations do not establish flight cancellations or operating status; only your licensed operator can hold or cancel a departure.",
          }
        : {
            inputState: normalizedInput.weatherCondition,
            status: "normal_uncertainty",
            headline: "Weather Observations ≠ Operational Dispatch Status",
            explanation:
              "Surface conditions at the downtown cruise docks often differ from ceiling visibility over the Juneau Icefield or wind waves in Stephens Passage.",
            neverAllClearRule:
              "Favorable weather observations never guarantee FAA Part 135 flight dispatch, USFS trail openings, or timely ship return.",
          };

  return {
    evaluatedAt: now.toISOString(),
    timezone: "America/Juneau",
    timezoneResolution,
    inputValidationErrors,
    normalizedInput,
    shareableQueryString: serializeJuneauScenarioToQuery(normalizedInput),
    conciseBottomLine,
    weatherAndTelemetryAdvisory,
    evidenceHealth: {
      hasWithdrawnOrConflictedClaims:
        dependencyReport.hasWithdrawnOrConflictedClaims,
      recommendedCacheControl: dependencyReport.recommendedCacheControl,
      citationFreshness: dependencyReport.citationFreshness,
    },
    coverageDisclosures: {
      includedOptionTypes: [
        "Public & free municipal/federal options (USFS trails, Downtown Seawalk, Capital Transit bus)",
        "Non-profit cultural institutions (Sealaska Heritage Walter Soboleff Center)",
        "Direct local operators (TEMSCO, Coastal, NorthStar, Allen Marine, permitted Mendenhall shuttles)",
        "Two-activity corridor combinations (Whale + Mendenhall, Helicopter + Mendenhall)",
        "Optional specialist & affiliate comparison links",
      ],
      coverageLimits: [
        "Does not cover every private charter boat, floatplane operator, or cruise-line proprietary excursion desk.",
        "Indicative price ranges and transfer times are planning baselines verified on the stated date, not real-time seat inventory.",
      ],
      commercialIndependenceStatement:
        "Recommendations and option rankings are computed strictly from your time window, dock friction, mobility constraints, and claim evidence status. Commercial or affiliate relationships never influence ranking.",
    },
    options: evaluatedOptions,
  };
}
