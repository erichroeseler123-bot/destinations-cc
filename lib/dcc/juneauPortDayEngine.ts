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
  advertisedRangeMinutes: { min: number; max: number };
  onSiteOrOnWaterActivityMinutes: number;
  checkInLeadMinutes: number;
  outboundTransferMinutes: number;
  outboundTransferRangeMinutes: { min: number; max: number };
  interActivityTransferMinutes: number;
  returnTransferMinutes: number;
  returnTransferRangeMinutes: { min: number; max: number };
  doubleCountingStatus: "verified_not_double_counted";
  decompositionLabel: "Planning estimate (transfers and activity separated)";
  decompositionNote: string;
  transferAndReturnUncertaintyNote: string;
};

export type JuneauAccessibilityDetails = {
  walkingAndTerrain: string;
  boardingAndTransfer: string;
  wheelchairAndMobilitySupport: string;
  confirmationStatus:
    | "confirmed_public_infrastructure"
    | "operator_and_departure_confirmation_required"
    | "not_step_free";
  confirmationNote: string;
};

export type JuneauOptionStatusDimensions = {
  timeFit: {
    status:
      | "fits_comfortably"
      | "tight_buffer"
      | "does_not_fit_time"
      | "invalid_port_window";
    summary: string;
  };
  operatingSchedule: {
    status:
      | "in_season_unconfirmed_departure"
      | "example_date_unconfirmed"
      | "out_of_season"
      | "missing_schedule";
    summary: string;
  };
  transferAndDock: {
    status:
      | "known_dock_estimate"
      | "unknown_dock_estimate"
      | "independent_no_ship_dock";
    summary: string;
  };
  weatherAndDispatch: {
    status:
      | "normal_dispatch_uncertainty"
      | "traveler_clear_assumption"
      | "traveler_low_ceiling_assumption"
      | "weather_feed_unavailable";
    summary: string;
  };
  evidenceConfidence: {
    status: "current" | "stale_qualified" | "withdrawn_or_conflicted";
    summary: string;
  };
  accessibility: {
    status:
      | "confirmed_or_compatible"
      | "operator_confirmation_required"
      | "walking_requirement_unconfirmed"
      | "does_not_match_mobility";
    summary: string;
  };
  preferenceMatch: {
    status:
      | "matches_preference"
      | "single_activity_alternative"
      | "excluded_by_preference";
    summary: string;
  };
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
  estimatedBackAtDockRangeText: string;
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
  plainLanguageStatuses: string[];
  statusDimensions: JuneauOptionStatusDimensions;
  accessibilityDetails: JuneauAccessibilityDetails;
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
  isExampleScenario: boolean;
  dateProvidedByTraveler: boolean;
  exampleScenarioNotice: string | null;
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
    isTravelerScenarioAssumption: boolean;
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
  advertisedRangeMinutes: { min: number; max: number };
  checkInLeadMinutes: number;
  outboundTransferMinutes: number;
  outboundTransferRangeMinutes: { min: number; max: number };
  activityDurationMinutes: number;
  interActivityTransferMinutes: number;
  returnTransferMinutes: number;
  returnTransferRangeMinutes: { min: number; max: number };
  decompositionNote: string;
  transferAndReturnUncertaintyNote: string;
  operatingMonths: number[];
  minimumMobility: Exclude<JuneauMobilityLevel, "unspecified">;
  accessibilityDetails: JuneauAccessibilityDetails;
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
    advertisedRangeMinutes: { min: 150, max: 210 },
    checkInLeadMinutes: 15,
    outboundTransferMinutes: 25,
    outboundTransferRangeMinutes: { min: 20, max: 35 },
    activityDurationMinutes: 120,
    interActivityTransferMinutes: 0,
    returnTransferMinutes: 25,
    returnTransferRangeMinutes: { min: 20, max: 35 },
    decompositionNote:
      "Planning estimate (185 min / 3h 05m total): 15m dock kiosk boarding + 25m outbound Glacier Hwy transfer (20–35m range) + 120m self-paced on-site USFS trail/Visitor Center time + 25m return transfer (20–35m range). Transfer and boarding time are separated from the 120m on-site allowance so they are not double-counted.",
    transferAndReturnUncertaintyNote:
      "Egan Drive / Glacier Highway transfer times vary between 20 and 35 minutes each way depending on multi-ship traffic, and return shuttle queues at the USFS Visitor Center lot can add 15–30 minutes at peak afternoon hours.",
    operatingMonths: [5, 6, 7, 8, 9, 10],
    minimumMobility: "step_free_wheelchair",
    accessibilityDetails: {
      walkingAndTerrain:
        "Paved plaza and elevator access at the USFS Mendenhall Visitor Center; Steep Creek boardwalk (0.25 mi loop) is level and step-free; Photo Point (0.3 mi) has mild paved grades; Nugget Falls Trail (2.0 mi round-trip) is unpaved compacted gravel with uneven sections.",
      boardingAndTransfer:
        "Standard commercial shuttle coaches require climbing 2–3 bus steps unless a wheelchair-lift bus or accessible taxi is requested in advance.",
      wheelchairAndMobilitySupport:
        "USFS Visitor Center and Steep Creek boardwalk support wheelchairs and walkers; shuttle vehicle lift availability varies by operator and departure.",
      confirmationStatus: "operator_and_departure_confirmation_required",
      confirmationNote:
        "On-site USFS Visitor Center and Steep Creek boardwalk accessibility is confirmed public infrastructure, but wheelchair-lift shuttle boarding must be confirmed directly with the shuttle or taxi operator for your departure.",
    },
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
          "120 min self-paced on-site planning baseline (excludes 40–70m round-trip transfer and 15m kiosk boarding; 150–210 min total dock-to-dock range)",
        basisType: "dcc_estimate",
        citationIds: ["jun-usfs-mendenhall"],
        verificationNote:
          "120 min on-site allows Photo Point (0.3 mi), Steep Creek boardwalk (0.25 mi), or Nugget Falls (2.0 mi RT) without double-counting the highway transfer.",
      },
      {
        field: "transfers",
        label: "Corridor Transfer Time",
        valueSummary:
          "20–35 min each way (25 min planning baseline for 12.0 miles via Egan Drive / Glacier Highway between downtown Marine Park and Mendenhall Visitor Center lot)",
        basisType: "dcc_estimate",
        citationIds: ["jun-usfs-mendenhall", "jun-cbj-harbors"],
        verificationNote:
          "Direct drop-off at the USFS commercial lot avoids the 1.5-mile municipal bus walk gap; actual road time varies with cruise traffic.",
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
          "Standard dock kiosk voucher exchange and motorcoach loading window; confirm exact departure schedule with your shuttle operator.",
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
        label: "Walking, Boarding & Terrain Profile",
        valueSummary:
          "Step-free elevator access at USFS Visitor Center and Steep Creek Boardwalk (0.25 mi); Nugget Falls (2.0 mi) is unpaved gravel; wheelchair-lift bus boarding requires advance confirmation with the shuttle operator",
        basisType: "sourced_fact",
        citationIds: ["jun-usfs-mendenhall"],
        verificationNote:
          "USFS maintains ADA access to the Visitor Center viewing plaza and Steep Creek boardwalk; vehicle lift availability must be confirmed per operator departure.",
      },
      {
        field: "booking_and_cancellation",
        label: "Booking & Cancellation Terms",
        valueSummary:
          "USFS pass non-refundable; permitted shuttle operators typically allow 24-hour cancellation; subject to USFS commercial visitor permit caps",
        basisType: "operator_estimate",
        citationIds: ["jun-usfs-mendenhall"],
        verificationNote:
          "USFS enforces annual/daily commercial visitor service caps in Mendenhall Glacier Recreation Area; confirm refund terms with your chosen shuttle provider.",
      },
    ],
    supportedReasonsAndTradeoffs: [
      "Direct 20–35 minute valley transfer drops you at the USFS Mendenhall Glacier Visitor Center lot without the 3-mile municipal bus road walk.",
      "Operates in low cloud ceilings and rain that ground helicopter icefield landings.",
      "Tradeoff: USFS commercial visitor permit caps can sell out permitted shuttle seats on 4–5 ship days, and you view the glacier from land/boardwalks rather than landing on the ice.",
    ],
    baseAssumptions: [
      "25 min each way planning baseline (20–35 min range) via Egan Drive / Glacier Highway between downtown docks and Mendenhall Visitor Center (DCC corridor estimate).",
      "120 min on-site for Photo Point (0.3 mi), Steep Creek Bear Boardwalk (0.25 mi step-free), or Nugget Falls Trail (2.0 mi round-trip).",
      "15 min kiosk check-in and return shuttle boarding allowance.",
    ],
    baseUncertainties: [
      "Same-day USFS commercial shuttle seat availability and exact departure headways depend on how many cruise ships are in port.",
      "Return shuttle queues at the Visitor Center lot and Egan Drive traffic can shift your actual return time by 15–25 minutes.",
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
        "3 hr 05 min planning estimate (150–210 min dock-to-dock range: 120 min on-site + 40–70 min round-trip transfer + 15 min boarding; transfers separated)",
      meetingArrangements:
        "Marine Park / Goldbelt Tramway plaza booths or pre-arranged taxi stand",
      priceBasis:
        "$5 USFS Visitor Center fee (sourced fact; trails free) + ~$45–$80 per person round-trip commercial shuttle or metered taxi (operator estimate)",
      indicativePriceRangePerPersonUsd: { min: 45, max: 80 },
      cancellationConditions:
        "USFS pass is non-refundable; commercial shuttle operators typically allow 24-hour cancellation (confirm exact operator terms)",
      detailsVerifiedAt: "2026-10-23",
      detailsFreshnessNote:
        "Verified against USFS Tongass National Forest fee and access rules on 2026-10-23. Confirm live shuttle seat availability and departure times on your port date.",
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
          label:
            "Compare Mendenhall Glacier Tours & Shuttles (Last Frontier Shore Excursions)",
          operatorOrProviderName: "Last Frontier Shore Excursions",
          url: "https://www.lastfrontiershoreexcursions.com/juneau/mendenhall-glacier-tours",
          relationshipDisclosure:
            "DCC owned specialist site (Last Frontier Shore Excursions); commercial relationship does not affect option ranking or fit status.",
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
    advertisedRangeMinutes: { min: 210, max: 240 },
    checkInLeadMinutes: 20,
    outboundTransferMinutes: 25,
    outboundTransferRangeMinutes: { min: 20, max: 35 },
    activityDurationMinutes: 150,
    interActivityTransferMinutes: 0,
    returnTransferMinutes: 25,
    returnTransferRangeMinutes: { min: 20, max: 35 },
    decompositionNote:
      "Planning estimate (220 min / 3h 40m baseline; 210–240 min advertised range across operators): 20m dock check-in + 25m outbound transfer to Statter Harbor (20–35m range) + 150m (2.5h) on-water cruise (135–165m range) + 25m return transfer (20–35m range). The round-trip transfer and check-in are separated from on-water time so they are not double-counted.",
    transferAndReturnUncertaintyNote:
      "Road transfer between downtown docks and Auke Bay Statter Harbor takes 20–35 minutes each way depending on Egan Drive traffic, and harbor unloading plus return coach staging can shift dock return times by 15–20 minutes.",
    operatingMonths: [4, 5, 6, 7, 8, 9, 10],
    minimumMobility: "light_walking_1mi",
    accessibilityDetails: {
      walkingAndTerrain:
        "Requires walking ~0.25–0.5 miles across flat paved parking lots and harbor piers, plus walking down/up the Statter Harbor floating dock ramp, which becomes steep during minus low tides (−3 to −5 ft MLLW).",
      boardingAndTransfer:
        "Requires boarding a motorcoach at Marine Park and stepping across a vessel threshold or gangway at Auke Bay.",
      wheelchairAndMobilitySupport:
        "Select large waterjet catamarans (e.g., specific Allen Marine vessels) can accommodate manual or collapsible wheelchairs with advance notice, whereas small 6–12 passenger boats typically cannot.",
      confirmationStatus: "operator_and_departure_confirmation_required",
      confirmationNote:
        "Vessel wheelchair access, step-free threshold plates, and low-tide ramp assistance are not confirmed across all Auke Bay operators or departures — confirm vessel accessibility directly with the operator before booking.",
    },
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
          "$169–$229 per adult planning range across Auke Bay operators (varies by 40-pax catamaran vs. 6-pack charter)",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-auke-bay-whale"],
        verificationNote:
          "Multi-operator planning range across Allen Marine, Gastineau Guiding, and permitted Auke Bay charter operators; confirm exact fare for your vessel and departure.",
      },
      {
        field: "activity_duration",
        label: "On-Water vs. Dock-to-Dock Duration",
        valueSummary:
          "135–165 min on water (150 min planning baseline based on Allen Marine Juneau Whale Watch); 210–240 min (3.5–4.0 hr) dock-to-dock including transfers and check-in",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-auke-bay-whale"],
        verificationNote:
          "Advertised 3.5–4.0 hr operator durations include ground transfers, which are separated here as a planning estimate so transfers are not double-counted; confirm exact water time on your chosen departure.",
      },
      {
        field: "transfers",
        label: "Downtown to Statter Harbor Transfer",
        valueSummary:
          "20–35 min each way (25 min planning baseline for 13.5 miles via Egan Drive between Marine Park and Auke Bay Statter Harbor)",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-auke-bay-whale", "jun-cbj-harbors"],
        verificationNote:
          "Included in operator excursion ticket; actual road transit and harbor loading vary by 10–15 minutes with traffic.",
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
        valueSummary: "15–30 min before scheduled bus departure at dock kiosk (20 min planning baseline)",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-auke-bay-whale"],
        verificationNote:
          "Required by operators to assign bus and vessel manifests prior to departure; confirm exact cutoff on your ticket.",
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
        label: "Walking, Harbor Ramp & Vessel Boarding",
        valueSummary:
          "Walking ~0.25–0.5 mi plus Statter Harbor gangway ramps that steepen during minus low tides (−3 to −5 ft MLLW); vessel wheelchair support varies by boat and requires advance operator confirmation",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-auke-bay-whale", "jun-noaa-tides"],
        verificationNote:
          "Select larger catamarans accommodate manual wheelchairs with advance notice, while smaller boats require stepping over gunwales; tide-driven ramp slope is tracked via NOAA Station 9452210.",
      },
      {
        field: "booking_and_cancellation",
        label: "Booking & Cancellation Policy",
        valueSummary:
          "Full refund if canceled by captain for marine weather; customer cancellation cutoff is typically 24–72 hours depending on operator",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-auke-bay-whale"],
        verificationNote:
          "Customer cancellation windows vary across Auke Bay operators; verify the exact hour cutoff on your chosen operator's checkout page.",
      },
    ],
    supportedReasonsAndTradeoffs: [
      "Operates reliably under low cloud ceilings (1,000–2,000 ft) that cancel helicopter icefield tours.",
      "Includes round-trip ground transfer between downtown cruise docks and Auke Bay (Statter Harbor).",
      "Tradeoff: Does not visit Mendenhall Glacier unless booked as a longer 5 hr 15 min combination.",
    ],
    baseAssumptions: [
      "20 min dockside check-in before shuttle departure (operator planning baseline; 15–30 min range).",
      "25 min each way ground transfer between downtown docks and Auke Bay Statter Harbor (20–35 min planning range across 13.5 mi).",
      "150 min (2.5 hr) on-water marine wildlife viewing baseline in Auke Bay / Stephens Passage (separated from transfers).",
    ],
    baseUncertainties: [
      "Exact departure times and seat availability must be confirmed for your ship's date.",
      "Steep harbor ramp angles at Auke Bay during extreme minus low tides (−3 ft to −5 ft MLLW) can affect boarding for mobility-limited guests, and wheelchair access depends on the specific vessel assigned.",
      "Egan Drive traffic and harbor coach loading can shift your actual dock return time by 15–20 minutes.",
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
        "3 hr 40 min planning estimate (210–240 min dock-to-dock range across operators: ~150 min on water + ~40–70 min round-trip transfer + ~20 min check-in; transfers separated)",
      meetingArrangements:
        "Marine Park / Mount Roberts Tramway parking lot kiosks",
      priceBasis:
        "Multi-operator planning range $169–$229 per adult depending on vessel size (operator estimate; confirm exact fare per departure)",
      indicativePriceRangePerPersonUsd: { min: 169, max: 229 },
      cancellationConditions:
        "Full refund if canceled by operator for marine weather; customer cancellation cutoffs typically range from 24 to 72 hours by operator",
      detailsVerifiedAt: "2026-10-23",
      detailsFreshnessNote:
        "Checked against published 2026–2027 Auke Bay operator profiles on 2026-10-23. Confirm live vessel seats, accessibility, and exact departure time before booking.",
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
            "Compare Auke Bay Whale Watching Departures (Last Frontier Shore Excursions)",
          operatorOrProviderName: "Last Frontier Shore Excursions",
          url: "https://www.lastfrontiershoreexcursions.com/juneau/whale-watching",
          relationshipDisclosure:
            "DCC owned specialist site (Last Frontier Shore Excursions); commercial relationship does not affect option ranking or fit status.",
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
    advertisedRangeMinutes: { min: 180, max: 255 },
    checkInLeadMinutes: 30,
    outboundTransferMinutes: 20,
    outboundTransferRangeMinutes: { min: 20, max: 30 },
    activityDurationMinutes: 115,
    interActivityTransferMinutes: 0,
    returnTransferMinutes: 20,
    returnTransferRangeMinutes: { min: 20, max: 30 },
    decompositionNote:
      "Planning estimate modeled on TEMSCO's Mendenhall Glacier & Guided Walk (185 min / 3h 05m baseline; multi-operator range across TEMSCO, Coastal Icefield Excursion, and NorthStar Glacier Walkabout is 180–255 min / 3.0–4.25 hr dock-to-dock): 30m pre-flight briefing/overboot fitting (30–45m operator range) + 20m outbound shuttle to JNU heliport (20–30m range) + 115m flight and glacier landing (90–150m product range) + 20m return shuttle (20–30m range). Shuttle transfers and check-in/briefing are separated from flight/ice time as a planning estimate so they are not double-counted.",
    transferAndReturnUncertaintyNote:
      "Shuttle transit between downtown docks and JNU Airport takes 20–30 minutes each way depending on Egan Drive traffic, and flight dispatch or return van staging can shift estimated dock return times by 15–30 minutes.",
    operatingMonths: [5, 6, 7, 8, 9],
    minimumMobility: "light_walking_1mi",
    accessibilityDetails: {
      walkingAndTerrain:
        "Walking 0.25–0.75 miles on uneven, wet, and sloped glacial ice wearing provided traction overboots or crampons with guide assistance.",
      boardingAndTransfer:
        "Requires stepping up ~18–24 inches into an AS350 or Bell helicopter cabin (and boarding the airport shuttle van); collapsible wheelchairs generally cannot be carried inside the helicopter cabin on standard glacier landings.",
      wheelchairAndMobilitySupport:
        "Some operators can assist guests with limited walking onto the aircraft for flightseeing or short-step ice landings with advance notice, while extended treks (e.g., NorthStar 2-hour trek) require full agility.",
      confirmationStatus: "operator_and_departure_confirmation_required",
      confirmationNote:
        "Helicopter boarding assistance, mobility accommodations, and exact weight-balance seat thresholds (250–260 lbs fully clothed) are not identical across TEMSCO, Coastal, and NorthStar and must be confirmed directly with the operator before booking.",
    },
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
        label: "Multi-Operator Base Rate Planning Range",
        valueSummary:
          "$409–$549 per person standard landing/walkabout planning range ($399–$699+ across all Juneau helicopter tours; e.g., ~$409 TEMSCO Mendenhall Glacier & Guided Walk, ~$429 Coastal Icefield Excursion, ~$499–$549 NorthStar Glacier Walkabout)",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-heli-icefield"],
        verificationNote:
          "Planning range across TEMSCO, Coastal, and NorthStar rather than a single cross-provider tariff; exact price depends on operator, ice time, and weight-balance surcharge rules — confirm on your selected operator's checkout page.",
      },
      {
        field: "activity_duration",
        label: "Flight/Glacier Time vs. Dock-to-Dock Planning Range",
        valueSummary:
          "115 min flight + glacier walk baseline (modeled on TEMSCO Mendenhall Glacier & Guided Walk; 90–150 min across products); 180–255 min (3.0–4.25 hr) dock-to-dock range across TEMSCO, Coastal, and NorthStar",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-heli-icefield"],
        verificationNote:
          "Operators advertise 3.0–4.25 hr dock-to-dock depending on product (e.g., standard landing vs. extended walkabout); DCC separates ~40–60m shuttle and ~30–45m briefing from the flight/ice window as a planning estimate so transfers are not double-counted.",
      },
      {
        field: "transfers",
        label: "Downtown Dock to JNU Heliport Transfer Estimate",
        valueSummary:
          "20–30 min each way planning range (20 min baseline for 8.5 miles via Egan Drive between downtown cruise docks and JNU Airport helicopter ramp)",
        basisType: "dcc_estimate",
        citationIds: ["jun-operator-heli-icefield", "jun-airport-official"],
        verificationNote:
          "Included in operator ticket; actual road transfer and van staging vary with Egan Drive traffic and ship berth location.",
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
        label: "Pre-Flight Briefing & Gear Fitting Lead Time",
        valueSummary:
          "30–45 min pre-flight safety briefing, weight verification, and glacier overboot/crampon fitting (30 min planning baseline)",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-heli-icefield"],
        verificationNote:
          "Required by FAA Part 135 operators prior to boarding; exact check-in cutoff (30 vs. 45 min) varies across TEMSCO, Coastal, and NorthStar and must be confirmed on your voucher.",
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
        label: "Walking, Cabin Boarding & Weight-Balance Rules",
        valueSummary:
          "Requires stepping into helicopter cabin and walking on uneven glacial ice with traction overboots; weight-balance surcharge thresholds (typically 250–260 lbs fully clothed) and boarding assistance vary by operator and require confirmation",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-heli-icefield"],
        verificationNote:
          "FAA Part 135 weight-and-balance manifest rules and mobility accommodations vary across TEMSCO, Coastal, and NorthStar; confirm directly before booking.",
      },
      {
        field: "booking_and_cancellation",
        label: "Weather Dispatch & Cancellation Policy Range",
        valueSummary:
          "Full refund if canceled by operator due to ceiling/visibility weather minimums; customer-initiated cancellation cutoff varies from 24 hours to 7+ days by operator and booking channel",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-heli-icefield", "jun-noaa-aviation"],
        verificationNote:
          "Only the licensed Part 135 operator can hold or cancel a flight based on icefield ceiling and flat-light contrast; confirm customer cancellation terms with your specific operator.",
      },
    ],
    supportedReasonsAndTradeoffs: [
      "Only way to physically land and walk on the upper Mendenhall, Herbert, or Norris glacier icefields away from road crowds.",
      "Moderate total duration (3.0–4.25 hr dock-to-dock range across TEMSCO, Coastal, and NorthStar; 3 hr 05 min baseline) fits standard 6+ hour port calls comfortably.",
      "Tradeoff: Highest weather-cancellation sensitivity (FAA Part 135 cloud ceiling and flat-light minimums on the icefield) and highest per-person cost ($409–$549+ walkabout range).",
    ],
    baseAssumptions: [
      "30 min pre-flight safety briefing, weight check, and glacier overboot/crampon fitting baseline (30–45 min operator range).",
      "20 min each way operator shuttle baseline (20–30 min planning range) between downtown cruise docks and JNU Airport helicopter ramp (8.5 mi).",
      "115 min flight + guided glacier landing planning baseline modeled on TEMSCO Mendenhall Glacier & Guided Walk (separated from shuttle and briefing so transfers are not double-counted).",
    ],
    baseUncertainties: [
      "Exact duration (3.0–4.25 hr dock-to-dock), check-in cutoff (30–45 min), fare ($399–$699+), and customer cancellation window (24h to 7+ days) vary across TEMSCO, Coastal, and NorthStar and require confirmation for your chosen product.",
      "FAA Part 135 dispatch depends on real-time icefield ceiling, visibility, and flat-light contrast — surface weather or traveler weather assumptions do not confirm flight operation.",
      "Operators enforce per-seat and total aircraft weight balance limits (surcharges typically apply above 250–260 lbs fully clothed).",
    ],
    bookingTransparency: {
      actualOperators: [
        "TEMSCO Helicopters (JNU Airport — e.g., Mendenhall Glacier & Guided Walk)",
        "Coastal Helicopters (JNU North Ramp — e.g., Icefield Excursion)",
        "NorthStar Trekking (JNU Airport — e.g., Glacier Walkabout)",
      ],
      inclusions: [
        "Round-trip shuttle between downtown cruise docks and JNU Airport heliport",
        "Glacier traction overboots or crampons, rain/wind outer layer, and safety briefing",
        "Scenic flightseeing and guided walk on Mendenhall, Herbert, or Norris Glacier",
      ],
      exclusions: [
        "Weight-balance seat surcharge (required by operators above 250–260 lbs)",
        "Pilot/guide gratuities",
      ],
      durationLabel:
        "3 hr 05 min planning baseline (180–255 min / 3.0–4.25 hr dock-to-dock range across TEMSCO, Coastal, and NorthStar; transfers and briefing separated)",
      meetingArrangements:
        "Downtown cruise dock pickup kiosk (operator shuttle to JNU Airport ramp)",
      priceBasis:
        "Multi-operator planning range: ~$409 (TEMSCO Mendenhall landing), ~$429 (Coastal Icefield Excursion), ~$499–$549 (NorthStar Walkabout); $399–$699+ across all Juneau heli products (operator estimate — confirm exact tariff)",
      indicativePriceRangePerPersonUsd: { min: 409, max: 549 },
      cancellationConditions:
        "Full refund if canceled by operator due to weather; customer cancellation cutoffs vary across TEMSCO, Coastal, and NorthStar (24 hours to 7+ days — confirm before booking)",
      detailsVerifiedAt: "2026-10-23",
      detailsFreshnessNote:
        "Planning ranges checked against TEMSCO, Coastal, and NorthStar product profiles on 2026-10-23. Confirm exact departure slot, duration, cancellation policy, and weight rules on checkout.",
      channels: [
        {
          channelType: "direct_operator",
          label: "TEMSCO Helicopters — Mendenhall Glacier & Guided Walk",
          operatorOrProviderName: "TEMSCO Helicopters",
          url: "https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/",
          relationshipDisclosure:
            "Direct local FAA Part 135 operator website. No affiliate commission.",
          isCommercialPartner: false,
          commissionInfluenceOnRanking: 0,
        },
        {
          channelType: "direct_operator",
          label: "Coastal Helicopters — Icefield Excursion",
          operatorOrProviderName: "Coastal Helicopters",
          url: "https://coastalhelicopters.com/tours/icefield-excursion/",
          relationshipDisclosure:
            "Direct local FAA Part 135 operator website. No affiliate commission.",
          isCommercialPartner: false,
          commissionInfluenceOnRanking: 0,
        },
        {
          channelType: "direct_operator",
          label: "NorthStar Trekking — Helicopter Glacier Walkabout",
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
            "DCC owned specialist site (Juneau Flight Deck); commercial relationship does not affect option ranking or fit status.",
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
    advertisedRangeMinutes: { min: 285, max: 330 },
    checkInLeadMinutes: 20,
    outboundTransferMinutes: 25,
    outboundTransferRangeMinutes: { min: 20, max: 35 },
    activityDurationMinutes: 225, // 90m Mendenhall + 135m Whale Watching
    interActivityTransferMinutes: 15, // Direct Mendenhall -> Auke Bay transfer (4.5 mi)
    returnTransferMinutes: 30,
    returnTransferRangeMinutes: { min: 25, max: 40 },
    decompositionNote:
      "Planning estimate (315 min / 5h 15m baseline; 285–330 min / 4.75–5.5 hr advertised combo range): 20m dock check-in + 25m transfer to Mendenhall (20–35m range) + 90m at Mendenhall + 15m direct 4.5-mile valley link to Auke Bay + 135m on-water whale watch + 30m return transfer to downtown (25–40m range). All transfers (70m baseline) and check-in (20m) are separated from the 225m combined activity time as a planning estimate so nothing is double-counted.",
    transferAndReturnUncertaintyNote:
      "Three-leg valley bus transfers (Downtown → Mendenhall → Auke Bay → Downtown) span ~65–90 minutes total depending on Egan Drive traffic and coach staging, so estimated return time at the dock carries a ±20 minute traffic tolerance.",
    operatingMonths: [5, 6, 7, 8, 9],
    minimumMobility: "light_walking_1mi",
    accessibilityDetails: {
      walkingAndTerrain:
        "Walking 0.25–0.75 miles at Mendenhall Glacier (paved Visitor Center plaza and step-free Steep Creek boardwalk; 90m stop is tight for the 2.0-mile unpaved Nugget Falls trail) plus Statter Harbor pier and floating dock ramp (steep at minus low tides).",
      boardingAndTransfer:
        "Requires boarding transfer coaches across three valley legs (Downtown, Mendenhall, Auke Bay) and stepping aboard a whale watching vessel.",
      wheelchairAndMobilitySupport:
        "Mendenhall Visitor Center and Steep Creek boardwalk are step-free, but multi-stop combo motorcoaches and whale vessels require advance wheelchair-lift and vessel compatibility confirmation.",
      confirmationStatus: "operator_and_departure_confirmation_required",
      confirmationNote:
        "Accessible coach lifts and step-free vessel boarding are not guaranteed across all combo departures — confirm both bus lift and boat boarding directly with the combo operator before booking.",
    },
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
        valueSummary: "$219–$289 per adult planning range (includes USFS admission and all 3 bus legs)",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-auke-bay-whale", "jun-usfs-mendenhall"],
        verificationNote:
          "Published 2026–2027 bundled combo range across Allen Marine / Gastineau Guiding / permitted valley combo operators; confirm exact fare on checkout.",
      },
      {
        field: "activity_duration",
        label: "Combined Activity vs. Dock-to-Dock Duration",
        valueSummary:
          "225 min combined activity baseline (90m Mendenhall + 135m on-water whale watch); 285–330 min (4.75–5.5 hr; 315 min baseline) dock-to-dock including transfers and check-in",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-auke-bay-whale", "jun-usfs-mendenhall"],
        verificationNote:
          "Planning decomposition separates ~70m transfers and ~20m check-in from advertised 4.75–5.5 hr combo schedules so transfers are not double-counted; note that Mendenhall ground time is typically capped at 75–90 min.",
      },
      {
        field: "transfers",
        label: "Three-Leg Valley Loop Transfers",
        valueSummary:
          "25m Downtown→Mendenhall (20–35m) + 15m Mendenhall→Auke Bay (4.5 mi direct) + 30m Auke Bay→Downtown (25–40m; ~70 min baseline transit)",
        basisType: "dcc_estimate",
        citationIds: ["jun-operator-auke-bay-whale", "jun-usfs-mendenhall"],
        verificationNote:
          "Direct 4.5-mile valley link between Mendenhall and Statter Harbor saves ~35 minutes vs. backtracking through downtown; road times remain estimates subject to traffic.",
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
        valueSummary: "20 min prior to combo coach departure (15–30 min operator range)",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-auke-bay-whale"],
        verificationNote:
          "Required for multi-leg coach and vessel manifest check-in; confirm exact departure schedule with your operator.",
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
        label: "Walking, Trail & Harbor Ramp Profile",
        valueSummary:
          "Walking 0.25–0.75 mi at Steep Creek/Photo Point plus Statter Harbor boarding ramp (steep at low tide); multi-leg bus lift and vessel accessibility require advance operator confirmation",
        basisType: "operator_estimate",
        citationIds: ["jun-usfs-mendenhall", "jun-noaa-tides"],
        verificationNote:
          "Harbor gangway slope varies with NOAA Station 9452210 tide height; coach and boat wheelchair support must be confirmed per operator.",
      },
      {
        field: "booking_and_cancellation",
        label: "Booking & Cancellation Policy",
        valueSummary:
          "Customer cancellation typically 24–72 hours depending on operator; partial refund if one leg is modified by operator",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-auke-bay-whale"],
        verificationNote:
          "If booking the two activities separately instead of a bundled combo, you must pre-arrange a private valley taxi because on-demand rideshare at Mendenhall is unreliable.",
      },
    ],
    supportedReasonsAndTradeoffs: [
      "Combines Juneau's two signature surface experiences in one northwest loop, using a 15-minute direct Mendenhall-to-Auke Bay transfer instead of backtracking 50 minutes through downtown.",
      "Operates reliably in rain and low ceilings.",
      "Tradeoff: Requires ~5 hr 15 min of activity/transfer time plus dock and return buffers (~7.5+ hours in port for a comfortable margin), leaving only ~75–90 minutes on the ground at Mendenhall Glacier (tight for the 2.0-mile Nugget Falls hike).",
    ],
    baseAssumptions: [
      "20 min dock check-in + 25 min transfer baseline (20–35 min range) from downtown to Mendenhall Glacier.",
      "90 min at Mendenhall Glacier Visitor Center / Photo Point / Steep Creek.",
      "15 min direct valley transfer from Mendenhall Glacier to Auke Bay Statter Harbor (4.5 miles).",
      "135 min on-water whale watching + 30 min return transfer baseline (25–40 min range) to downtown cruise docks (transfers separated).",
    ],
    baseUncertainties: [
      "Exact combo departure schedule and return coach timing depend on your chosen operator and multi-ship traffic.",
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
        "5 hr 15 min planning baseline (285–330 min dock-to-dock range: ~90m Mendenhall + ~15m link + ~135m Whale Watch + ~55m transfers + ~20m check-in; transfers separated)",
      meetingArrangements: "Marine Park / Mount Roberts Tramway plaza kiosks",
      priceBasis:
        "Bundled combo tours typically $219–$289 per adult (operator estimate; or book separately ONLY with pre-arranged private transfer between Mendenhall and Auke Bay)",
      indicativePriceRangePerPersonUsd: { min: 219, max: 289 },
      cancellationConditions:
        "Customer cancellation typically 24–72 hours depending on operator; partial refund if one leg is modified by operator",
      detailsVerifiedAt: "2026-10-23",
      detailsFreshnessNote:
        "Checked against 2026–2027 Juneau combo schedules on 2026-10-23. Confirm exact departure schedule and transfer inclusions before booking.",
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
            "Compare Juneau Whale + Mendenhall Combo Options (Last Frontier Shore Excursions)",
          operatorOrProviderName: "Last Frontier Shore Excursions",
          url: "https://www.lastfrontiershoreexcursions.com/decision/whale-watching-vs-glacier-tour",
          relationshipDisclosure:
            "DCC owned specialist site (Last Frontier Shore Excursions); commercial relationship does not affect option ranking or fit status.",
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
    advertisedRangeMinutes: { min: 285, max: 360 },
    checkInLeadMinutes: 30,
    outboundTransferMinutes: 20,
    outboundTransferRangeMinutes: { min: 20, max: 30 },
    activityDurationMinutes: 205, // 115m heli + 90m Mendenhall Visitor Center
    interActivityTransferMinutes: 20, // JNU Airport ramp -> Mendenhall Visitor Center (4.5 mi)
    returnTransferMinutes: 25,
    returnTransferRangeMinutes: { min: 20, max: 35 },
    decompositionNote:
      "Planning estimate (300 min / 5h 00m baseline; 285–360 min range depending on helicopter product and valley transfer wait): 30m heliport briefing/gear fitting (30–45m operator range) + 20m downtown-to-JNU shuttle (20–30m range) + 115m helicopter flight/glacier landing baseline + 20m direct 4.5-mile valley taxi/shuttle link from JNU to Mendenhall Visitor Center + 90m at Mendenhall + 25m return transfer to downtown docks (20–35m range). The standalone helicopter return shuttle leg is replaced by the valley link and Mendenhall return as a planning estimate so transfers are not double-counted.",
    transferAndReturnUncertaintyNote:
      "Requires a point-to-point 4.5-mile valley transfer between JNU Airport heliport and Mendenhall Visitor Center plus a return shuttle/taxi to downtown; taxi wait times and Egan Drive traffic can shift return timing by 15–30 minutes.",
    operatingMonths: [5, 6, 7, 8, 9],
    minimumMobility: "light_walking_1mi",
    accessibilityDetails: {
      walkingAndTerrain:
        "Helicopter leg requires walking on uneven glacial ice in traction overboots; Mendenhall Visitor Center and Steep Creek boardwalk (0.25 mi) are paved/boardwalk step-free while Nugget Falls (2.0 mi) is unpaved gravel.",
      boardingAndTransfer:
        "Requires stepping up ~18–24 inches into the helicopter cabin, boarding the operator airport shuttle, and transferring via valley taxi/shuttle to Mendenhall.",
      wheelchairAndMobilitySupport:
        "Mendenhall Visitor Center is wheelchair accessible, but the helicopter glacier landing leg is not step-free and weight-balance / boarding rules vary across TEMSCO, Coastal, and NorthStar.",
      confirmationStatus: "operator_and_departure_confirmation_required",
      confirmationNote:
        "Helicopter boarding assistance, weight-balance thresholds (250–260 lbs), and valley transfer vehicle accessibility must be confirmed directly with the operator before booking.",
    },
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
        label: "Combined Helicopter + Valley Transfer & Admission Planning Range",
        valueSummary:
          "$440–$595+ per person planning range ($409–$549 standard helicopter walkabout range across TEMSCO, Coastal, and NorthStar + $5 USFS fee + ~$25–$45 valley taxi/shuttle)",
        basisType: "dcc_estimate",
        citationIds: ["jun-operator-heli-icefield", "jun-usfs-mendenhall"],
        verificationNote:
          "Combines the multi-operator helicopter base rate range ($409–$549; $399–$699+ across all heli tours), the $5 sourced USFS Visitor Center fee, and a DCC estimate ($25–$45) for the 4.5-mile JNU-to-Mendenhall taxi/shuttle link.",
      },
      {
        field: "activity_duration",
        label: "Combined Activity vs. Total Planning Duration",
        valueSummary:
          "205 min combined activity baseline (115m flight/ice baseline + 90m Mendenhall Visitor Center); 285–360 min (5 hr 00 min baseline) dock-to-dock",
        basisType: "dcc_estimate",
        citationIds: ["jun-operator-heli-icefield", "jun-usfs-mendenhall"],
        verificationNote:
          "Planning estimate replaces the helicopter tour's 20m downtown return shuttle with a 20m valley link to Mendenhall + 90m visit + 25m return to docks (no double-counted transfers); confirm exact helicopter duration with TEMSCO, Coastal, or NorthStar.",
      },
      {
        field: "transfers",
        label: "Three-Leg Valley Routing Estimate",
        valueSummary:
          "20–30m Downtown→JNU + 15–25m JNU→Mendenhall (4.5 mi) + 20–35m Mendenhall→Downtown (~65 min baseline transit)",
        basisType: "dcc_estimate",
        citationIds: ["jun-airport-official", "jun-usfs-mendenhall"],
        verificationNote:
          "JNU Airport and Mendenhall Visitor Center are both in the Mendenhall Valley (4.5 miles apart); transfer and taxi wait times are planning estimates.",
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
        label: "Heliport Check-In & Gear Fitting Range",
        valueSummary: "30–45 min pre-flight briefing and overboot fitting (30 min planning baseline)",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-heli-icefield"],
        verificationNote:
          "Check-in lead time varies between 30 and 45 minutes across TEMSCO, Coastal, and NorthStar; confirm on your flight voucher.",
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
        label: "Walking, Cabin Boarding & Weight-Balance Profile",
        valueSummary:
          "Requires stepping into helicopter cabin and walking on glacier ice with overboots (250–260 lb weight-balance threshold varies by operator); Mendenhall Visitor Center/Steep Creek is step-free",
        basisType: "operator_estimate",
        citationIds: ["jun-operator-heli-icefield", "jun-usfs-mendenhall"],
        verificationNote:
          "Helicopter boarding and glacier walking govern the overall accessibility profile and must be confirmed with your selected helicopter operator.",
      },
      {
        field: "booking_and_cancellation",
        label: "Booking & Weather Contingency Range",
        valueSummary:
          "Helicopter leg refundable if weather-canceled by operator (customer cancellation cutoff varies 24h–7+ days by operator); keep Mendenhall ground leg flexible if flight slot is delayed",
        basisType: "operator_estimate",
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
      "30 min heliport check-in & gear fitting baseline (30–45 min operator range) + 20 min downtown-to-JNU shuttle (20–30 min range).",
      "115 min helicopter flight and guided glacier walk planning baseline (transfers separated).",
      "20 min valley taxi/shuttle link between JNU Airport heliport and Mendenhall Visitor Center (4.5 mi).",
      "90 min at Mendenhall Visitor Center + 25 min return transfer baseline (20–35 min range) to downtown docks.",
    ],
    baseUncertainties: [
      "Standard helicopter operator shuttles run loop routes between downtown docks and JNU Airport — confirm in advance whether the operator or a pre-booked valley taxi will drop you at Mendenhall Visitor Center after your flight.",
      "Helicopter duration (3.0–4.25 hr standalone), fare ($399–$699+), check-in cutoff (30–45 min), and cancellation window (24h–7+ days) vary across TEMSCO, Coastal, and NorthStar.",
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
        "5 hr 00 min planning baseline (285–360 min dock-to-dock range: ~115m flight + ~20m valley link + ~90m Mendenhall + ~45m transfers + ~30m check-in; transfers separated)",
      meetingArrangements:
        "Schedule helicopter flight for the earliest morning slot so any weather hold or backup decision happens early in your port window",
      priceBasis:
        "$409–$549 helicopter walkabout planning range across TEMSCO/Coastal/NorthStar (operator estimate) + $5 USFS admission (sourced fact) + ~$25–$45 valley taxi/shuttle transfer (DCC estimate)",
      indicativePriceRangePerPersonUsd: { min: 440, max: 595 },
      cancellationConditions:
        "Helicopter leg refundable if weather-canceled by operator (customer cancellation cutoff varies 24h–7+ days by operator); keep Mendenhall ground visit flexible until flight completes",
      detailsVerifiedAt: "2026-10-23",
      detailsFreshnessNote:
        "Evaluated from JNU Airport and USFS Mendenhall transfer distances and operator profiles on 2026-10-23. Confirm exact helicopter schedule and valley transfer before booking.",
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
            "DCC owned specialist site (Juneau Flight Deck); commercial relationship does not affect option ranking or fit status.",
          isCommercialPartner: true,
          commissionInfluenceOnRanking: 0,
        },
        {
          channelType: "specialist_comparison",
          label:
            "Compare Mendenhall Glacier Ground Tours & Shuttles (Last Frontier Shore Excursions)",
          operatorOrProviderName: "Last Frontier Shore Excursions",
          url: "https://www.lastfrontiershoreexcursions.com/juneau/mendenhall-glacier-tours",
          relationshipDisclosure:
            "DCC owned specialist site (Last Frontier Shore Excursions); commercial relationship does not affect option ranking or fit status.",
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
    advertisedRangeMinutes: { min: 245, max: 300 },
    checkInLeadMinutes: 15,
    outboundTransferMinutes: 70, // 35m bus + 35m 1.5-mi walk from Mendenhall Loop Rd & Glacier Spur Rd
    outboundTransferRangeMinutes: { min: 65, max: 90 },
    activityDurationMinutes: 90,
    interActivityTransferMinutes: 0,
    returnTransferMinutes: 85, // 35m 1.5-mi walk back + 15m hourly/half-hourly bus wait + 35m bus ride
    returnTransferRangeMinutes: { min: 75, max: 115 },
    decompositionNote:
      "Planning estimate (260 min / 4h 20m baseline; 245–300 min range depending on bus headway wait): 15m walk/wait at Downtown Transit Center + 70m outbound transit (35m bus + 35m 1.5-mile walk along Glacier Spur Rd) + 90m at Mendenhall Glacier + 85m return transit (35m 1.5-mile walk + 15–45m bus headway wait + 35m bus ride). The 3.0-mile road walk is included in transfer time rather than on-site trail time so it is not hidden or double-counted.",
    transferAndReturnUncertaintyNote:
      "Capital Transit Route 3/4 runs on 30-to-60 minute headways; missing a return bus at Mendenhall Loop Rd adds 30–60 minutes immediately.",
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    minimumMobility: "active_walking_3mi",
    accessibilityDetails: {
      walkingAndTerrain:
        "Requires 3.0 miles of compulsory round-trip walking (1.5 miles each way) on the flat paved Glacier Spur Road pedestrian pathway between the Mendenhall Loop Rd bus stop and the USFS Visitor Center, plus 0.4 miles between the cruise docks and the Downtown Transit Center, before any glacier trail walking.",
      boardingAndTransfer:
        "Capital Transit municipal buses are equipped with low-floor ramps/kneeling access and ADA wheelchair securement spaces.",
      wheelchairAndMobilitySupport:
        "While the municipal bus itself and the paved path are wheelchair accessible, the 3.0+ mile compulsory road distance makes this unsuitable for travelers who cannot walk or roll 3+ miles outdoors.",
      confirmationStatus: "not_step_free",
      confirmationNote:
        "Confirmed municipal bus ramp access and paved sidewalk geometry, but requires covering 3.0+ miles on foot or by long-range mobility device beyond the bus stop.",
    },
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
          "90 min self-paced at Mendenhall Recreation Area (excludes 140–205 min round-trip bus + 3.0-mile road walk)",
        basisType: "dcc_estimate",
        citationIds: ["jun-usfs-mendenhall"],
        verificationNote:
          "90 min on-site planning budget after completing the 1.5-mile walk from Mendenhall Loop Rd.",
      },
      {
        field: "transfers",
        label: "Bus Ride + 1.5-Mile Spur Walk Each Way",
        valueSummary:
          "70 min outbound baseline (35m bus + 35m 1.5-mi walk) and 85 min return baseline (35m walk + 15–45m schedule wait + 35m bus)",
        basisType: "dcc_estimate",
        citationIds: ["jun-capital-transit", "jun-usfs-mendenhall"],
        verificationNote:
          "Stop location (1.5 miles from Visitor Center at Mendenhall Loop Rd & Glacier Spur Rd) is a sourced fact; walking pace and bus headway wait are planning estimates.",
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
        label: "Walking Distance & Bus Ramp Profile",
        valueSummary:
          "Buses have ADA boarding ramps, but route requires 3.0 miles of round-trip walking on the paved Glacier Spur Rd pathway (plus 0.8 mi round-trip to the Downtown Transit Center) before any glacier trail walking",
        basisType: "sourced_fact",
        citationIds: ["jun-capital-transit", "jun-usfs-mendenhall"],
        verificationNote:
          "The 1.5-mile each-way gap between the municipal bus stop and the Visitor Center is the governing physical requirement.",
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
      "35 min municipal bus ride + 35 min (1.5-mile) flat paved path walk along Glacier Spur Rd each way (planning estimate).",
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
        "4 hr 20 min planning estimate (245–300 min range: ~155 min bus + 3-mile walk round-trip + ~90 min at glacier + ~15 min wait; transfers separated)",
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
    advertisedRangeMinutes: { min: 60, max: 180 },
    checkInLeadMinutes: 0,
    outboundTransferMinutes: 10,
    outboundTransferRangeMinutes: { min: 5, max: 15 },
    activityDurationMinutes: 120,
    interActivityTransferMinutes: 0,
    returnTransferMinutes: 10,
    returnTransferRangeMinutes: { min: 5, max: 15 },
    decompositionNote:
      "Planning estimate (140 min / 2h 20m self-paced baseline; 60–180 min flexible range): 10m walk from Marine Park to Front/Seward St (5–15m range) + 120m self-paced cultural/seawalk/tram visit + 10m walk back to dock (5–15m range). No vehicle transfers or check-in lead times are double-counted.",
    transferAndReturnUncertaintyNote:
      "Immediate waterfront walk-off (0.2–0.5 miles from downtown berths); ships berthed at AJ Dock or tendering in Gastineau Channel still require the dock shuttle or tender queue included in the dock allowance.",
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    minimumMobility: "step_free_wheelchair",
    accessibilityDetails: {
      walkingAndTerrain:
        "Level paved sidewalks and boardwalks along the CBJ Downtown Seawalk (0.2–0.5 miles from Marine Park) with curb cuts; smooth interior floors and elevator access inside the Walter Soboleff Center.",
      boardingAndTransfer:
        "No vehicle boarding required from downtown walk-off berths (AS/CTF/Franklin); AJ Dock and tendering ships depend on cruise-line shuttle/tender boarding.",
      wheelchairAndMobilitySupport:
        "Full step-free wheelchair and walker access along the Downtown Seawalk, inside the Walter Soboleff Center, and into the Goldbelt Tram cabins and upper viewing platform (upper mountain dirt trails have steps/roots).",
      confirmationStatus: "confirmed_public_infrastructure",
      confirmationNote:
        "Step-free public seawalk and Walter Soboleff Center elevator access are confirmed year-round infrastructure; if your ship tenders or berths at AJ Dock, confirm gangway/shuttle lift assistance with your cruise line.",
    },
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
          "120 min flexible on-site planning baseline (60–180 min self-paced range; 140 min baseline including 10m walk each way from downtown berths)",
        basisType: "dcc_estimate",
        citationIds: ["jun-shi-heritage", "jun-cbj-harbors"],
        verificationNote:
          "Self-paced; visitors can return to downtown docks in 5–15 minutes at any point.",
      },
      {
        field: "transfers",
        label: "Pedestrian Access",
        valueSummary:
          "5–15 min level walk each way (10 min baseline for 0.2 mi from Marine Park to 105 S. Seward St; AJ Dock/Tender guests add dock shuttle/tender time)",
        basisType: "dcc_estimate",
        citationIds: ["jun-cbj-harbors", "jun-shi-heritage"],
        verificationNote:
          "Located in the immediate downtown waterfront core; walk time is a planning estimate based on 0.2–0.5 mile dock distance.",
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
        label: "Walking, Surface & Step-Free Access",
        valueSummary:
          "Step-free paved access along the CBJ Downtown Seawalk and inside the Walter Soboleff Center (elevator & level galleries); no tour bus boarding required from downtown berths",
        basisType: "sourced_fact",
        citationIds: ["jun-shi-heritage", "jun-cbj-harbors"],
        verificationNote:
          "Step-free downtown corridor with zero highway transfer risk.",
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
      "10 min walk baseline (5–15 min range) between downtown seawalk/Marine Park and Front & Seward Street.",
      "120 min self-paced visit (Walter Soboleff Center, Overstreet Park whale statue seawalk, or walk-up Goldbelt Tram).",
      "10 min walk back to ship dock.",
    ],
    baseUncertainties: [
      "Exact museum gallery hours vary between summer cruise days and winter off-season schedules — confirm current opening hours with Sealaska Heritage Institute.",
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
        "2 hr 20 min self-paced planning baseline (60–180 min flexible range: ~120m visit + ~10–30m round-trip walk; return to dock in 5–15 minutes at any time)",
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
  travelDate: null,
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
  const travelDate = dateRaw && dateRaw.trim() !== "" ? dateRaw.trim() : null;

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
    input.travelDate !== undefined && input.travelDate !== null
      ? input.travelDate.trim()
      : null;
  let derivedMonthFromDate: number | null = null;

  if (resolvedTravelDate !== null && resolvedTravelDate !== "") {
    const dateCheck = validateStrictIsoDate(resolvedTravelDate);
    if (!dateCheck.valid) {
      inputValidationErrors.push(dateCheck.reason);
    } else {
      derivedMonthFromDate = dateCheck.month;
    }
  } else {
    resolvedTravelDate = null;
  }

  const dateProvidedByTraveler =
    resolvedTravelDate !== null && derivedMonthFromDate !== null;
  const isExampleScenario = !dateProvidedByTraveler;

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
  } else if (hasValidMonthInput && input.travelMonth !== 7 && derivedMonthFromDate === null) {
    resolvedTravelMonth = input.travelMonth!;
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

  const exampleScenarioNotice = isExampleScenario
    ? "Example Scenario (Peak-Summer 08:00–16:30 Baseline): Enter your actual cruise date and ship hours above to get a personalized port-day verdict."
    : null;

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
      const minTransferDelta =
        (def.outboundTransferRangeMinutes.min - def.outboundTransferMinutes) +
        (def.returnTransferRangeMinutes.min - def.returnTransferMinutes);
      const maxTransferDelta =
        (def.outboundTransferRangeMinutes.max - def.outboundTransferMinutes) +
        (def.returnTransferRangeMinutes.max - def.returnTransferMinutes);
      const estimatedBackAtDockRangeText = `${formatMinutesAsClock(estimatedBackAtDockMinutes + minTransferDelta)}–${formatMinutesAsClock(estimatedBackAtDockMinutes + maxTransferDelta)} ${timezoneResolution.tzAbbreviation}`;
      const targetAllAboardBufferCutoffMinutes =
        allAboardMinutes - requiredReturnBufferMinutes;

      const durationAudit: JuneauDurationAudit = {
        advertisedDockToDockMinutes: def.advertisedDockToDockMinutes,
        advertisedRangeMinutes: def.advertisedRangeMinutes,
        onSiteOrOnWaterActivityMinutes: def.activityDurationMinutes,
        checkInLeadMinutes: def.checkInLeadMinutes,
        outboundTransferMinutes: def.outboundTransferMinutes,
        outboundTransferRangeMinutes: def.outboundTransferRangeMinutes,
        interActivityTransferMinutes: def.interActivityTransferMinutes,
        returnTransferMinutes: def.returnTransferMinutes,
        returnTransferRangeMinutes: def.returnTransferRangeMinutes,
        doubleCountingStatus: "verified_not_double_counted",
        decompositionLabel: "Planning estimate (transfers and activity separated)",
        decompositionNote: def.decompositionNote,
        transferAndReturnUncertaintyNote: def.transferAndReturnUncertaintyNote,
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
        estimatedBackAtDockRangeText,
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

      const dateDisplayLabel = dateProvidedByTraveler
        ? resolvedTravelDate!
        : `example month ${normalizedInput.travelMonth}`;

      if (!def.operatingMonths.includes(normalizedInput.travelMonth)) {
        hardConstraintViolations.push(
          `Seasonal closure: this option operates in months [${def.operatingMonths.join(", ")}], while your selected date/month is month ${normalizedInput.travelMonth} (${dateDisplayLabel}).`,
        );
      }

      let mobilityMismatch = false;
      if (normalizedInput.mobilityLevel !== "unspecified") {
        const travelerMobilityRank = MOBILITY_RANK[normalizedInput.mobilityLevel];
        const optionRequiredRank = MOBILITY_RANK[def.minimumMobility];
        if (travelerMobilityRank < optionRequiredRank) {
          mobilityMismatch = true;
          if (normalizedInput.mobilityLevel === "step_free_wheelchair") {
            hardConstraintViolations.push(
              `Does not match your selected step-free / wheelchair accessibility preference: ${def.accessibilityDetails.walkingAndTerrain} (${def.accessibilityDetails.boardingAndTransfer}).`,
            );
          } else {
            hardConstraintViolations.push(
              `Exceeds your selected walking distance preference (up to 1 mile): ${def.accessibilityDetails.walkingAndTerrain}`,
            );
          }
        }
      }

      const excludedByPublicFreeFilter =
        normalizedInput.goalMode === "public_or_free_only" &&
        def.category !== "public_free_or_municipal" &&
        def.optionId !== "jun-opt-usfs-mendenhall-shuttle";

      if (excludedByPublicFreeFilter) {
        hardConstraintViolations.push(
          `Excluded by your 'Public / Free / Independent Only' filter (this option is a commercial ${def.category.replace(/_/g, " ")}).`,
        );
      }

      const isSingleActivityAlternativeForComboGoal =
        normalizedInput.goalMode === "two_activity_combo" &&
        def.category !== "two_activity_combo";

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

      // Keep time fit distinct from dock uncertainty, weather assumptions, and two-activity preference:
      // Unknown dock or unavailable weather feed must NOT become 'tight_buffer' when substantial time (netMarginMinutes >= 45) remains.
      let fitStatus: JuneauEvaluatedOptionFit;
      if (
        expiredOrConflictedCitations.length > 0 ||
        missingScheduleSet.has(def.optionId)
      ) {
        fitStatus = "withdrawn_or_qualified_evidence";
      } else if (hardConstraintViolations.length > 0) {
        fitStatus = "does_not_fit";
      } else if (netMarginMinutes < 45) {
        fitStatus = "tight_buffer";
      } else {
        fitStatus = "fits_comfortably";
      }

      const statusDimensions: JuneauOptionStatusDimensions = {
        timeFit:
          inputValidationErrors.length > 0
            ? {
                status: "invalid_port_window",
                summary:
                  "Port window cannot be calculated until arrival/all-aboard input errors are resolved.",
              }
            : netMarginMinutes < 0
              ? {
                  status: "does_not_fit_time",
                  summary: `Exceeds your available time budget by ${Math.abs(netMarginMinutes)} min.`,
                }
              : netMarginMinutes < 45
                ? {
                    status: "tight_buffer",
                    summary: `Fits your time budget, but return slack is tight (+${netMarginMinutes} min beyond your ${requiredReturnBufferMinutes} min buffer).`,
                  }
                : {
                    status: "fits_comfortably",
                    summary: `Fits your time budget (+${netMarginMinutes} min slack beyond your ${requiredReturnBufferMinutes} min return buffer).`,
                  },
        operatingSchedule: missingScheduleSet.has(def.optionId)
          ? {
              status: "missing_schedule",
              summary:
                "Operating schedule is missing or unconfirmed; no default departure is assumed.",
            }
          : !def.operatingMonths.includes(normalizedInput.travelMonth)
            ? {
                status: "out_of_season",
                summary: `Closed for the season in month ${normalizedInput.travelMonth}.`,
              }
            : isExampleScenario
              ? {
                  status: "example_date_unconfirmed",
                  summary:
                    "Departure schedule still needs confirmation for your actual sailing date.",
                }
              : {
                  status: "in_season_unconfirmed_departure",
                  summary: "Departure schedule still needs confirmation.",
                },
        transferAndDock:
          normalizedInput.arrivalDock === "unknown_dock"
            ? {
                status: "unknown_dock_estimate",
                summary:
                  "Dock unknown; transfer allowance is an estimate (using conservative 50m/40m tender/shuttle envelope).",
              }
            : normalizedInput.arrivalDock === "independent_air_ferry"
              ? {
                  status: "independent_no_ship_dock",
                  summary: `Transfer and return times are planning estimates (${def.outboundTransferRangeMinutes.min}–${def.outboundTransferRangeMinutes.max} min outbound).`,
                }
              : {
                  status: "known_dock_estimate",
                  summary: `Dock and corridor transfers are planning estimates (${def.outboundTransferRangeMinutes.min}–${def.outboundTransferRangeMinutes.max} min outbound; est. back at dock ${estimatedBackAtDockRangeText}).`,
                },
        weatherAndDispatch:
          normalizedInput.weatherCondition === "provider_telemetry_unavailable"
            ? {
                status: "weather_feed_unavailable",
                summary:
                  "Upstream weather feed unavailable; check official forecast and operator dispatch directly.",
              }
            : normalizedInput.weatherCondition === "low_ceiling_rain_fog"
              ? def.weatherCeilingSensitive
                ? {
                    status: "traveler_low_ceiling_assumption",
                    summary:
                      "Traveler scenario assumption: low cloud ceiling / fog (high helicopter hold/cancellation risk; only the licensed operator cancels flights).",
                  }
                : {
                    status: "normal_dispatch_uncertainty",
                    summary:
                      "Traveler scenario assumption: low cloud ceiling / rain (surface option typically operates in rain/fog).",
                  }
              : normalizedInput.weatherCondition === "clear_high_ceiling"
                ? {
                    status: "traveler_clear_assumption",
                    summary:
                      "Traveler scenario assumption: clear skies (does not confirm live weather or operator dispatch).",
                  }
                : {
                    status: "normal_dispatch_uncertainty",
                    summary: def.weatherCeilingSensitive
                      ? "FAA Part 135 flight dispatch depends on live icefield ceiling and visibility on the morning of travel."
                      : "Surface marine/valley operation; confirm day-of operator status.",
                  },
        evidenceConfidence:
          expiredOrConflictedCitations.length > 0 ||
          missingScheduleSet.has(def.optionId)
            ? {
                status: "withdrawn_or_conflicted",
                summary:
                  evidenceQualificationNote ||
                  "Supporting evidence is expired or conflicted.",
              }
            : staleCitations.length > 0
              ? {
                  status: "stale_qualified",
                  summary:
                    evidenceQualificationNote ||
                    "Supporting evidence is stale and due for re-verification.",
                }
              : {
                  status: "current",
                  summary: "Supporting source records are current.",
                },
        accessibility: mobilityMismatch
          ? {
              status: "does_not_match_mobility",
              summary: `Does not match your selected accessibility/walking preference: ${def.accessibilityDetails.walkingAndTerrain}`,
            }
          : normalizedInput.mobilityLevel === "unspecified" &&
              def.minimumMobility === "active_walking_3mi"
            ? {
                status: "walking_requirement_unconfirmed",
                summary:
                  "Requires 3.0 miles of round-trip walking on the paved Glacier Spur Rd pathway between the bus stop and Visitor Center.",
              }
            : def.accessibilityDetails.confirmationStatus ===
                "operator_and_departure_confirmation_required"
              ? {
                  status: "operator_confirmation_required",
                  summary: def.accessibilityDetails.confirmationNote,
                }
              : {
                  status: "confirmed_or_compatible",
                  summary: def.accessibilityDetails.confirmationNote,
                },
        preferenceMatch: excludedByPublicFreeFilter
          ? {
              status: "excluded_by_preference",
              summary:
                "Excluded by your 'Public / Free / Independent Only' filter.",
            }
          : isSingleActivityAlternativeForComboGoal
            ? {
                status: "single_activity_alternative",
                summary:
                  "Single-activity alternative (does not combine two activities, but remains visible because it fits your time budget).",
              }
            : {
                status: "matches_preference",
                summary: "Matches your selected activity filter.",
              },
      };

      const plainLanguageStatuses: string[] = [];
      if (statusDimensions.timeFit.status === "fits_comfortably") {
        plainLanguageStatuses.push("Fits your time budget.");
      } else if (statusDimensions.timeFit.status === "tight_buffer") {
        plainLanguageStatuses.push(
          `Fits your time budget (tight +${netMarginMinutes} min slack beyond return buffer).`,
        );
      } else if (statusDimensions.timeFit.status === "does_not_fit_time") {
        plainLanguageStatuses.push(
          `Does not fit your time budget (short by ${Math.abs(netMarginMinutes)} min).`,
        );
      } else {
        plainLanguageStatuses.push(statusDimensions.timeFit.summary);
      }

      if (statusDimensions.operatingSchedule.status === "missing_schedule") {
        plainLanguageStatuses.push(
          "Operating schedule is missing or unconfirmed.",
        );
      } else if (
        statusDimensions.operatingSchedule.status === "out_of_season"
      ) {
        plainLanguageStatuses.push(
          `Closed for the season in month ${normalizedInput.travelMonth}.`,
        );
      } else {
        plainLanguageStatuses.push("Departure schedule still needs confirmation.");
      }

      if (normalizedInput.arrivalDock === "unknown_dock") {
        plainLanguageStatuses.push(
          "Dock unknown; transfer allowance is an estimate.",
        );
      } else if (normalizedInput.arrivalDock !== "independent_air_ferry") {
        plainLanguageStatuses.push(
          `Transfer and return times are estimates (est. back at dock ${estimatedBackAtDockRangeText}).`,
        );
      }

      if (isSingleActivityAlternativeForComboGoal && netMarginMinutes >= 0) {
        plainLanguageStatuses.push(
          "Single-activity alternative (fits your time window if you skip a two-activity combo).",
        );
      }

      if (
        normalizedInput.weatherCondition === "provider_telemetry_unavailable"
      ) {
        plainLanguageStatuses.push(
          "Weather feed unavailable; check official forecast and operator dispatch directly.",
        );
      } else if (
        normalizedInput.weatherCondition === "low_ceiling_rain_fog" &&
        def.weatherCeilingSensitive
      ) {
        plainLanguageStatuses.push(
          "Scenario assumption: low cloud ceiling (high helicopter weather-hold risk; only the operator cancels flights).",
        );
      }

      if (mobilityMismatch) {
        plainLanguageStatuses.push(
          "Walking or boarding requirements exceed your selected accessibility preference.",
        );
      } else if (
        def.accessibilityDetails.confirmationStatus ===
        "operator_and_departure_confirmation_required"
      ) {
        plainLanguageStatuses.push(
          "Accessibility and boarding assistance require operator confirmation.",
        );
      } else if (def.minimumMobility === "active_walking_3mi") {
        plainLanguageStatuses.push(
          "Requires 3.0-mile round-trip walk between the bus stop and Visitor Center.",
        );
      }

      const fitBadgeLabel =
        fitStatus === "fits_comfortably"
          ? isSingleActivityAlternativeForComboGoal
            ? `Fits Time Budget — Single-Activity Alternative (+${netMarginMinutes} min slack)`
            : `Fits Time Budget (+${netMarginMinutes} min slack)`
          : fitStatus === "tight_buffer"
            ? `Tight Time Buffer (+${netMarginMinutes} min slack)`
            : fitStatus === "withdrawn_or_qualified_evidence"
              ? "Evidence Expired / Conflicted — Verify Directly"
              : "Does Not Fit Current Constraints";

      const assumptionsUsed = [
        `${dockSpec.assumptionText} [Basis: ${dockSpec.basisType.replace(/_/g, " ")}]`,
        isExampleScenario
          ? `Example Scenario Date & Timezone: Using peak-summer reference date ${effectiveDateForTz} in ${timezoneResolution.timeZone} (${timezoneResolution.tzAbbreviation} UTC${timezoneResolution.utcOffsetString}) because no trip date was entered yet.`
          : `Date & Timezone: ${effectiveDateForTz} in ${timezoneResolution.timeZone} (${timezoneResolution.tzAbbreviation} UTC${timezoneResolution.utcOffsetString}).${timezoneResolution.dstTransitionNote ? ` ${timezoneResolution.dstTransitionNote}` : ""}`,
        `Traveler assumption — return buffer before all-aboard: ${requiredReturnBufferMinutes} minutes.`,
        ...(normalizedInput.weatherCondition === "clear_high_ceiling" ||
        normalizedInput.weatherCondition === "low_ceiling_rain_fog"
          ? [
              `Traveler weather assumption (${normalizedInput.weatherCondition.replace(/_/g, " ")}): Treated strictly as a planning scenario assumption, not a live weather observation or operator cancellation notice.`,
            ]
          : []),
        ...def.baseAssumptions,
      ];

      const uncertainOrNeedsConfirmation = [...def.baseUncertainties];
      if (normalizedInput.arrivalDock === "unknown_dock") {
        uncertainOrNeedsConfirmation.unshift(
          "Dock unknown; transfer allowance is an estimate: DCC applied the conservative 50 min outbound / 40 min return tender/shuttle allowance rather than assuming a fast downtown walk-off. Confirm your ship's assigned berth on the CBJ Docks & Harbors schedule.",
        );
      }
      if (normalizedInput.mobilityLevel === "unspecified") {
        uncertainOrNeedsConfirmation.push(
          `Walking & boarding profile: ${def.accessibilityDetails.walkingAndTerrain} ${def.accessibilityDetails.confirmationNote}`,
        );
      } else if (
        def.accessibilityDetails.confirmationStatus ===
        "operator_and_departure_confirmation_required"
      ) {
        uncertainOrNeedsConfirmation.push(
          def.accessibilityDetails.confirmationNote,
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
          `Scenario assumption (low ceiling / rain / fog): FAA Part 135 helicopter operators frequently hold or cancel icefield landings under low ceilings or flat light. Have a surface backup (Auke Bay whale watching or Mendenhall shuttle) ready — traveler weather inputs do not confirm cancellation; only the licensed operator can cancel a flight.`,
        );
      } else if (def.weatherCeilingSensitive) {
        uncertainOrNeedsConfirmation.push(
          `Surface weather or scenario assumptions do not establish FAA Part 135 flight dispatch; confirm morning flight status directly with the helicopter operator.`,
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
              ? `${def.shortLabel}: Fits your time budget with a tight +${netMarginMinutes} min margin beyond your ${requiredReturnBufferMinutes} min return buffer (est. back at dock ${estimatedBackAtDockRangeText}).`
              : isSingleActivityAlternativeForComboGoal
                ? `${def.shortLabel}: Fits your time budget (+${netMarginMinutes} min slack; est. back at dock ${estimatedBackAtDockRangeText}) — shown as a single-activity alternative.`
                : `${def.shortLabel}: Fits your time budget (+${netMarginMinutes} min slack; est. back at dock ${estimatedBackAtDockRangeText}). Departure schedule still needs confirmation.`;

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
          def.accessibilityDetails.confirmationStatus ===
            "confirmed_public_infrastructure" &&
          normalizedInput.mobilityLevel !== "unspecified" &&
          MOBILITY_RANK[normalizedInput.mobilityLevel] >=
            MOBILITY_RANK[def.minimumMobility],
        guaranteedShipReturn: false as const,
        separationStatement:
          "Fitting the time budget means the activity, estimated transfers, check-in, and return buffer fit within your supplied hours. It does NOT confirm live seat availability, weather/operator dispatch, individual accessibility, or a guaranteed return to the ship.",
      };

      const resolvedBookingTransparency: JuneauOptionBookingTransparency =
        dateProvidedByTraveler && resolvedTravelDate
          ? {
              ...def.bookingTransparency,
              channels: def.bookingTransparency.channels.map((ch) =>
                ch.url === "https://juneauflightdeck.com/helicopter"
                  ? {
                      ...ch,
                      url: `https://juneauflightdeck.com/helicopter?date=${encodeURIComponent(resolvedTravelDate)}`,
                    }
                  : ch,
              ),
            }
          : def.bookingTransparency;

      return {
        optionId: def.optionId,
        title: def.title,
        shortLabel: def.shortLabel,
        category: def.category,
        corridor: def.corridor,
        fitStatus,
        fitBadgeLabel,
        conciseVerdict,
        plainLanguageStatuses,
        statusDimensions,
        accessibilityDetails: def.accessibilityDetails,
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
        bookingTransparency: resolvedBookingTransparency,
        rankingAudit: {
          fitTierScore,
          netMarginMinutes,
          commercialWeight: 0,
          rankingExplanation:
            "Ranked strictly by constraint fit tier, preference match, and time slack margin (affiliate status, ownership, and commission rates are ignored).",
        },
      };
    });

  // Sort strictly by fitTierScore DESC, preference match, weather/walking caution, and netMarginMinutes DESC (never by commercial status)
  evaluatedOptions.sort((a, b) => {
    if (b.rankingAudit.fitTierScore !== a.rankingAudit.fitTierScore) {
      return b.rankingAudit.fitTierScore - a.rankingAudit.fitTierScore;
    }
    if (normalizedInput.goalMode === "two_activity_combo") {
      const aCombo = a.category === "two_activity_combo" ? 1 : 0;
      const bCombo = b.category === "two_activity_combo" ? 1 : 0;
      if (bCombo !== aCombo) return bCombo - aCombo;
    }
    if (normalizedInput.goalMode === "single_activity_focus") {
      const aSingle = a.category !== "two_activity_combo" ? 1 : 0;
      const bSingle = b.category !== "two_activity_combo" ? 1 : 0;
      if (bSingle !== aSingle) return bSingle - aSingle;
    }
    if (normalizedInput.goalMode === "public_or_free_only") {
      const aFree = a.category === "public_free_or_municipal" ? 1 : 0;
      const bFree = b.category === "public_free_or_municipal" ? 1 : 0;
      if (bFree !== aFree) return bFree - aFree;
    }
    const aWeatherCaution =
      a.statusDimensions.weatherAndDispatch.status ===
      "traveler_low_ceiling_assumption"
        ? 1
        : 0;
    const bWeatherCaution =
      b.statusDimensions.weatherAndDispatch.status ===
      "traveler_low_ceiling_assumption"
        ? 1
        : 0;
    if (aWeatherCaution !== bWeatherCaution) {
      return aWeatherCaution - bWeatherCaution;
    }
    const aWalkCaution =
      a.statusDimensions.accessibility.status ===
      "walking_requirement_unconfirmed"
        ? 1
        : 0;
    const bWalkCaution =
      b.statusDimensions.accessibility.status ===
      "walking_requirement_unconfirmed"
        ? 1
        : 0;
    if (aWalkCaution !== bWalkCaution) {
      return aWalkCaution - bWalkCaution;
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
  const singleAlternatives = evaluatedOptions.filter(
    (o) =>
      o.category !== "two_activity_combo" &&
      (o.fitStatus === "fits_comfortably" || o.fitStatus === "tight_buffer"),
  );

  const portHoursLabel = (totalPortWindowMinutes / 60).toFixed(1);
  let conciseBottomLine: string;

  if (inputValidationErrors.length > 0) {
    conciseBottomLine = `Cannot confirm port-day fit until input errors are corrected: ${inputValidationErrors.join(" ")}`;
  } else {
    const scenarioPrefix = isExampleScenario
      ? `Example Scenario (Peak-Summer ${portHoursLabel}-hr Call, ${formatMinutesAsClock(arrivalMinutes)}–${formatMinutesAsClock(allAboardMinutes)} ${timezoneResolution.tzAbbreviation} at ${dockSpec.label} — enter your trip date above for a personalized verdict): `
      : `For your ${portHoursLabel}-hour Juneau call on ${effectiveDateForTz} (${formatMinutesAsClock(arrivalMinutes)}–${formatMinutesAsClock(allAboardMinutes)} ${timezoneResolution.tzAbbreviation}, UTC${timezoneResolution.utcOffsetString}${overnightPortCall ? ", overnight call" : ""}) at ${dockSpec.label} with a ${normalizedInput.returnBufferMinutes}-minute return buffer: `;
    conciseBottomLine = scenarioPrefix;
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
      conciseBottomLine += `Your time budget fits either a single excursion OR a linked two-activity valley combination (${comboFits.map((c) => c.shortLabel).join("; ")}). Departure schedules, seat availability, and weather dispatch still require confirmation.`;
    } else if (fittingCount > 0) {
      conciseBottomLine += `Two-activity combinations exceed your time window once transfers and the ${normalizedInput.returnBufferMinutes}-minute return buffer are subtracted, but ${singleAlternatives.length} single-activity option(s) fit your time budget (${singleAlternatives.map((o) => o.shortLabel).join(", ")}).`;
    } else {
      conciseBottomLine += `Your current port window (${totalPortWindowMinutes} min) or seasonal date (${effectiveDateForTz}) does not fit valley excursions once disembarkation and the ${normalizedInput.returnBufferMinutes}-minute return buffer are subtracted; stay within the immediate downtown walk-off zone or adjust your date/window.`;
    }
  }

  const isTravelerScenarioAssumption =
    normalizedInput.weatherCondition === "clear_high_ceiling" ||
    normalizedInput.weatherCondition === "low_ceiling_rain_fog";

  const weatherAndTelemetryAdvisory: JuneauPortDayEvaluationResult["weatherAndTelemetryAdvisory"] =
    normalizedInput.weatherCondition === "provider_telemetry_unavailable"
      ? {
          inputState: normalizedInput.weatherCondition,
          isTravelerScenarioAssumption: false,
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
            isTravelerScenarioAssumption: true,
            status: "low_ceiling_caution",
            headline:
              "Traveler Scenario Assumption: Low Cloud Ceiling / Rain / Fog",
            explanation:
              "This weather setting is a traveler scenario assumption, not a live weather observation or an operator cancellation notice. Low cloud ceilings (<1,500 ft) and flat light over the Juneau Icefield frequently ground FAA Part 135 helicopter landings while surface activities (Auke Bay whale watching and Mendenhall Glacier trails) continue operating.",
            neverAllClearRule:
              "Traveler weather assumptions and surface observations do not establish flight cancellations or operating status; only your licensed operator can hold or cancel a departure.",
          }
        : normalizedInput.weatherCondition === "clear_high_ceiling"
          ? {
              inputState: normalizedInput.weatherCondition,
              isTravelerScenarioAssumption: true,
              status: "normal_uncertainty",
              headline:
                "Traveler Scenario Assumption: Clear Skies (Not a Live Observation)",
              explanation:
                "This weather setting is a traveler scenario assumption for planning, not a live weather observation or flight dispatch confirmation.",
              neverAllClearRule:
                "Assumed clear skies never guarantee FAA Part 135 flight dispatch, USFS trail openings, or timely ship return.",
            }
          : {
              inputState: normalizedInput.weatherCondition,
              isTravelerScenarioAssumption: false,
              status: "normal_uncertainty",
              headline: "Weather Assumptions ≠ Operational Dispatch Status",
              explanation:
                "Surface conditions at the downtown cruise docks often differ from ceiling visibility over the Juneau Icefield or wind waves in Stephens Passage.",
              neverAllClearRule:
                "Favorable weather forecasts never guarantee FAA Part 135 flight dispatch, USFS trail openings, or timely ship return.",
            };

  return {
    evaluatedAt: now.toISOString(),
    isExampleScenario,
    dateProvidedByTraveler,
    exampleScenarioNotice,
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
        "Indicative price ranges and transfer times are planning estimates verified on the stated date, not real-time seat inventory.",
      ],
      commercialIndependenceStatement:
        "Recommendations and option rankings are computed strictly from your time window, dock friction, mobility constraints, and claim evidence status. Commercial or affiliate relationships never influence ranking.",
    },
    options: evaluatedOptions,
  };
}
