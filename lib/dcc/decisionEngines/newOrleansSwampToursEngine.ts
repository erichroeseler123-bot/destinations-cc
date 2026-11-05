import { z } from "zod";
import { evaluateDecisionEngine } from "@/lib/dcc/decisionEngines/evaluator";
import type {
  BookingDestination,
  CandidateOption,
  ComparisonDimension,
  DecisionEngineDefinition,
  DecisionEvaluateOptions,
  DecisionResult,
  EvidenceClaim,
  HardConstraintRule,
  PreferenceRule,
  QuestionDefinition,
  SourceRecord,
  TimingCalculationResult,
  UnknownOrStaleFact,
} from "@/lib/dcc/decisionEngines/types";

export const NolaSwampAnswerSchema = z.object({
  transportMode: z
    .enum(["need_hotel_shuttle", "have_car_self_drive", "public_transit_only"])
    .default("need_hotel_shuttle"),
  stayingLocation: z
    .enum([
      "french_quarter_or_cbd_hotel",
      "metairie_or_kenner_hotel",
      "residential_or_airbnb",
    ])
    .default("french_quarter_or_cbd_hotel"),
  youngestTravelerAgeYears: z.coerce
    .number()
    .int()
    .min(0)
    .max(100)
    .default(8),
  hasPregnancyOrNeckBackInjury: z.coerce.boolean().default(false),
  needsStepFreeOrAssistedBoarding: z.coerce.boolean().default(false),
  preferredVesselExperience: z
    .enum([
      "covered_shade_pontoon",
      "high_speed_open_airboat",
      "included_coach_from_french_quarter_dock",
      "self_guided_boardwalk_or_city_park",
    ])
    .default("covered_shade_pontoon"),
  availableHalfDayHours: z.coerce.number().min(2).max(8).default(4.5),
});

export type NolaSwampAnswerInput = z.infer<typeof NolaSwampAnswerSchema>;

export const DEFAULT_NOLA_SWAMP_INPUT: NolaSwampAnswerInput = {
  transportMode: "need_hotel_shuttle",
  stayingLocation: "french_quarter_or_cbd_hotel",
  youngestTravelerAgeYears: 8,
  hasPregnancyOrNeckBackInjury: false,
  needsStepFreeOrAssistedBoarding: false,
  preferredVesselExperience: "covered_shade_pontoon",
  availableHalfDayHours: 4.5,
};

export const NOLA_SWAMP_SOURCES: SourceRecord[] = [
  {
    sourceId: "src-cajun-encounters-official",
    sourceOrganization: "Cajun Encounters Tour Company",
    sourceTitle:
      "Honey Island Swamp Tour — Covered Flat-Bottom Boats, VIP Small-Boat Age 13+ Policy & Optional French Quarter Hotel Shuttle",
    sourceUrl: "https://www.cajunencounters.com/tours/swamp-tour-new-orleans",
    claimsSupported: [
      "clm-cajun-encounters-honey-island-specs",
      "clm-swamp-shuttle-total-door-to-door-time",
    ],
    retrievedAt: "2026-11-02T00:00:00Z",
    verifiedAt: "2026-11-02T00:00:00Z",
    expiresAt: "2027-05-02T00:00:00Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-gray-line-nola-swamp",
    sourceOrganization: "Gray Line New Orleans",
    sourceTitle:
      "New Orleans Swamp & Bayou Sightseeing Boat Tour — Included Motorcoach from 400 Toulouse St. & Published Age-Tiered Pricing",
    sourceUrl: "https://www.graylineneworleans.com/swamp-tours/swamp-bayou-tour/",
    claimsSupported: [
      "clm-gray-line-included-coach-and-pricing",
      "clm-swamp-shuttle-total-door-to-door-time",
    ],
    retrievedAt: "2026-11-02T00:00:00Z",
    verifiedAt: "2026-11-02T00:00:00Z",
    expiresAt: "2027-05-02T00:00:00Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-cajun-pride-official-faq",
    sourceOrganization: "Cajun Pride Swamp Tours",
    sourceTitle:
      "Frequently Asked Questions — Private Manchac Wildlife Refuge, All-Ages Covered Pontoon & New Orleans/Metairie/Kenner Hotel Pickup",
    sourceUrl: "https://www.cajunprideswamptours.com/questions",
    claimsSupported: ["clm-cajun-pride-manchac-specs"],
    retrievedAt: "2026-11-02T00:00:00Z",
    verifiedAt: "2026-11-02T00:00:00Z",
    expiresAt: "2027-05-02T00:00:00Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-airboat-adventures-official",
    sourceOrganization: "Airboat Adventures",
    sourceTitle:
      "FAQs & Pickup Locations — Minimum Age 5, Pregnancy/Spinal Prohibitions, Unassisted Boarding & Downtown/French Quarter Hotel-Only Shuttle ($30/person)",
    sourceUrl: "https://airboatadventures.com/faqs/",
    claimsSupported: [
      "clm-airboat-adventures-safety-and-age-rules",
      "clm-airboat-adventures-hotel-only-shuttle-rule",
    ],
    retrievedAt: "2026-11-02T00:00:00Z",
    verifiedAt: "2026-11-02T00:00:00Z",
    expiresAt: "2027-05-02T00:00:00Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-nps-barataria-preserve-2026",
    sourceOrganization:
      "National Park Service — Jean Lafitte National Historical Park and Preserve",
    sourceTitle:
      "Barataria Preserve — February 2, 2026 2-Year Trail/Visitor Center Closure, Twin Canals Free Access & Relocated Wetland Trace Boardwalk ($10 Adult / $5 Senior)",
    sourceUrl: "https://www.nps.gov/jela/planyourvisit/barataria-preserve.htm",
    claimsSupported: ["clm-nps-barataria-2026-closure-and-wetland-trace"],
    retrievedAt: "2026-11-02T00:00:00Z",
    verifiedAt: "2026-11-02T00:00:00Z",
    expiresAt: "2027-05-02T00:00:00Z",
    freshnessCategory: "regulatory_annual",
    status: "current",
  },
  {
    sourceId: "src-norta-city-park",
    sourceOrganization:
      "New Orleans Regional Transit Authority (RTA) & New Orleans City Park",
    sourceTitle:
      "Canal Street–City Park/Museum Streetcar Line ($1.25 One-Way / $3.00 Jazzy Pass) & Couturie Forest / Bayou Metairie Access",
    sourceUrl: "https://www.norta.com/",
    claimsSupported: ["clm-norta-city-park-streetcar-alternative"],
    retrievedAt: "2026-11-02T00:00:00Z",
    verifiedAt: "2026-11-02T00:00:00Z",
    expiresAt: "2027-05-02T00:00:00Z",
    freshnessCategory: "regulatory_annual",
    status: "current",
  },
];

export const NOLA_SWAMP_CLAIMS: EvidenceClaim[] = [
  {
    claimId: "clm-cajun-encounters-honey-island-specs",
    classification: "operator_published_fact",
    statement:
      "Cajun Encounters operates covered, flat-bottom pontoon boats (up to 22 guests) in Honey Island Swamp (55345 US-90, Slidell, LA) open to all ages from $39.99/person self-drive (~$65–$79/person with optional French Quarter/downtown hotel shuttle, Viator SKU 6953SWAMPTRANS), while its 10–12 guest VIP Small-Boat Tour (from $99.99/person) requires age 13+ unless booked as a private boat.",
    fieldsSupported: [
      "candidateOptions.nola-swamp-cajun-encounters-covered",
      "questions.youngestTravelerAgeYears",
    ],
    sourceIds: ["src-cajun-encounters-official"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against Cajun Encounters official tour specifications and pre-site-guides-swamp.ts.",
  },
  {
    claimId: "clm-gray-line-included-coach-and-pricing",
    classification: "operator_published_fact",
    statement:
      "Gray Line New Orleans includes round-trip motorcoach transportation from the Lighthouse Ticket Office at the Steamboat NATCHEZ dock (400 Toulouse St.) to Jean Lafitte for a 3 hr 45 min (225 min) total excursion on a covered flat-bottom swamp boat open to all ages, priced at $65 adults (13+), $58.50 seniors (65+), $32 children (6–12), and $0 free for infants (2–5).",
    fieldsSupported: [
      "candidateOptions.nola-swamp-gray-line-pontoon-coach",
      "questions.transportMode",
    ],
    sourceIds: ["src-gray-line-nola-swamp"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against Gray Line New Orleans published tariff and departure instructions.",
  },
  {
    claimId: "clm-cajun-pride-manchac-specs",
    classification: "operator_published_fact",
    statement:
      "Cajun Pride Swamp Tours operates covered pontoon boats on a private wildlife refuge in Manchac (110 Frenier Rd, LaPlace, LA, ~35 minutes from the French Quarter) open to all ages, with optional shuttle pickup from New Orleans, Metairie, and Kenner area hotels (Viator SKU 141126P2).",
    fieldsSupported: [
      "candidateOptions.nola-swamp-cajun-pride-manchac",
      "questions.stayingLocation",
    ],
    sourceIds: ["src-cajun-pride-official-faq"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against Cajun Pride official FAQ and hotel pickup zone policy.",
  },
  {
    claimId: "clm-airboat-adventures-safety-and-age-rules",
    classification: "operator_published_fact",
    statement:
      "Airboat Adventures (5145 Fleming Park Rd, Lafitte, LA) enforces a strict minimum age of 5 years (48 inches height), strictly prohibits pregnant women and anyone with neck or back injuries, requires unassisted boarding onto open airboats without roof shade, provides hearing protection, and prices self-drive tours from $89/person (10-pax small or 16–30 pax large airboat) to $119/person (6-pax small airboat).",
    fieldsSupported: [
      "candidateOptions.nola-swamp-airboat-adventures",
      "questions.youngestTravelerAgeYears",
      "questions.hasPregnancyOrNeckBackInjury",
      "questions.needsStepFreeOrAssistedBoarding",
    ],
    sourceIds: ["src-airboat-adventures-official"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against Airboat Adventures official FAQ safety and pricing disclosures.",
  },
  {
    claimId: "clm-airboat-adventures-hotel-only-shuttle-rule",
    classification: "operator_published_fact",
    statement:
      "Airboat Adventures charges $30/person extra for round-trip shuttle pickup ($119–$149/person total) starting 1 hour 15 minutes before tour time from Downtown/French Quarter hotels only (no residential addresses or Airbnbs), and warns against taking a cab/rideshare to Lafitte because return cabs from the swamp are unavailable.",
    fieldsSupported: [
      "candidateOptions.nola-swamp-airboat-adventures",
      "questions.stayingLocation",
      "questions.transportMode",
    ],
    sourceIds: ["src-airboat-adventures-official"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against Airboat Adventures Pickup Locations and FAQ.",
  },
  {
    claimId: "clm-swamp-shuttle-total-door-to-door-time",
    classification: "operator_published_fact",
    statement:
      "Although on-water swamp boat time is 90–120 minutes, round-trip hotel shuttle routing and check-in require 3.75 hours (225 min on Gray Line) to 4–5 hours (240–300 min on Slidell/Lafitte hotel shuttles) door-to-door.",
    fieldsSupported: ["questions.availableHalfDayHours"],
    sourceIds: ["src-cajun-encounters-official", "src-gray-line-nola-swamp"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against operator pickup lead-time and return transit schedules.",
  },
  {
    claimId: "clm-nps-barataria-2026-closure-and-wetland-trace",
    classification: "official_rule",
    statement:
      "Starting February 2, 2026 for approximately 2 years, the NPS Barataria Preserve Visitor Center and most trails are closed for reconstruction; only the Twin Canals parking lot, trail, and canoe launch remain open for $0 free day-use access (with no restroom facilities), while visitor services and the open Wetland Trace Boardwalk are relocated 6 miles away to the Louisiana Wetlands Education Center (4917 City Park Drive, Jean Lafitte; admission $10 adults, $5 seniors/ages 13–17/LA residents/military, children under 12 free), and both require a personal or rental car.",
    fieldsSupported: [
      "candidateOptions.nola-swamp-nps-barataria-and-wetland-trace",
    ],
    sourceIds: ["src-nps-barataria-preserve-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against NPS Jean Lafitte Barataria Preserve 2026 closure alert and pre-site-guides-swamp.ts.",
  },
  {
    claimId: "clm-norta-city-park-streetcar-alternative",
    classification: "official_rule",
    statement:
      "Travelers without a car seeking a low-cost public transit bayou/wetland alternative can ride the RTA Canal Street–City Park/Museum streetcar ($1.25 one-way fare or $3.00 24-hour Jazzy Pass, ~25–30 minutes each way) to New Orleans City Park's Couturie Forest and Bayou Metairie trails ($0 entry, all ages).",
    fieldsSupported: ["candidateOptions.nola-swamp-rta-city-park-streetcar"],
    sourceIds: ["src-norta-city-park"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against RTA transit fares and New Orleans City Park access rules.",
  },
];

export const NOLA_SWAMP_QUESTIONS: QuestionDefinition[] = [
  {
    questionId: "transportMode",
    label: "How are you getting between New Orleans and the swamp?",
    helpText:
      "Honey Island (Slidell), Jean Lafitte, and Manchac docks are 35–45 minutes outside New Orleans with no public transit and unreliable return rideshare from rural docks.",
    inputType: "select",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Selects between hotel shuttle/motorcoach options, self-drive dock check-in (and NPS Barataria / Wetland Trace access), or the in-city $1.25 RTA streetcar option.",
    drivenByClaimIds: [
      "clm-gray-line-included-coach-and-pricing",
      "clm-airboat-adventures-hotel-only-shuttle-rule",
      "clm-nps-barataria-2026-closure-and-wetland-trace",
      "clm-norta-city-park-streetcar-alternative",
    ],
    defaultValue: DEFAULT_NOLA_SWAMP_INPUT.transportMode,
    options: [
      {
        value: "need_hotel_shuttle",
        label: "Need hotel shuttle or French Quarter motorcoach pickup",
        description:
          "No rental car; requires operator shuttle or Gray Line motorcoach from 400 Toulouse St.",
      },
      {
        value: "have_car_self_drive",
        label: "Have a personal or rental car (self-drive)",
        description:
          "Can drive 35–45 min to Slidell, Jean Lafitte, Manchac, or NPS Twin Canals / Wetland Trace",
      },
      {
        value: "public_transit_only",
        label: "Public transit only ($1.25 RTA streetcar / no commercial shuttle)",
        description:
          "Staying inside New Orleans transit network (Canal Street–City Park streetcar)",
      },
    ],
  },
  {
    questionId: "stayingLocation",
    label: "Where are you staying or meeting pickup?",
    helpText:
      "Operator shuttles do not pick up at residential addresses or Airbnbs; Cajun Pride also serves Metairie/Kenner hotels.",
    inputType: "select",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Warns Airbnb/residential guests that they must walk or rideshare to an approved downtown hotel pickup point or 400 Toulouse St., and routes Metairie/Kenner hotel guests to Cajun Pride.",
    drivenByClaimIds: [
      "clm-cajun-pride-manchac-specs",
      "clm-airboat-adventures-hotel-only-shuttle-rule",
    ],
    defaultValue: DEFAULT_NOLA_SWAMP_INPUT.stayingLocation,
    options: [
      {
        value: "french_quarter_or_cbd_hotel",
        label: "French Quarter / CBD hotel (or walking to 400 Toulouse St.)",
      },
      {
        value: "metairie_or_kenner_hotel",
        label: "Metairie or Kenner area hotel",
      },
      {
        value: "residential_or_airbnb",
        label: "Residential address or Airbnb (must meet at downtown hotel/dock)",
      },
    ],
  },
  {
    questionId: "youngestTravelerAgeYears",
    label: "Age of the youngest traveler in your group (years)",
    helpText:
      "Airboat Adventures enforces a strict minimum age of 5 years; covered pontoon tours (Cajun Encounters, Gray Line, Cajun Pride) welcome all ages.",
    inputType: "number",
    min: 0,
    max: 100,
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Eliminates Airboat Adventures when the youngest child is under age 5 and highlights Gray Line's $0 free infant tier (ages 2–5) and $32 child tier (ages 6–12).",
    drivenByClaimIds: [
      "clm-airboat-adventures-safety-and-age-rules",
      "clm-cajun-encounters-honey-island-specs",
      "clm-gray-line-included-coach-and-pricing",
    ],
    defaultValue: DEFAULT_NOLA_SWAMP_INPUT.youngestTravelerAgeYears,
  },
  {
    questionId: "hasPregnancyOrNeckBackInjury",
    label: "Is anyone in your party pregnant or dealing with neck/back injuries?",
    helpText:
      "Airboat Adventures strictly prohibits pregnant travelers and anyone with neck or back injuries due to high-speed marsh turns and hull jarring.",
    inputType: "boolean",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Eliminates high-speed airboats when true and routes to flat-bottom covered pontoon boats or boardwalk trails.",
    drivenByClaimIds: ["clm-airboat-adventures-safety-and-age-rules"],
    defaultValue: DEFAULT_NOLA_SWAMP_INPUT.hasPregnancyOrNeckBackInjury,
  },
  {
    questionId: "needsStepFreeOrAssistedBoarding",
    label: "Does anyone require assisted or step-free boarding?",
    helpText:
      "Airboats require unassisted stepping over high gunwales; covered flat-bottom pontoon docks and the relocated Wetland Trace Boardwalk support gentler boarding.",
    inputType: "boolean",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Eliminates Airboat Adventures when assisted or step-free boarding is required.",
    drivenByClaimIds: ["clm-airboat-adventures-safety-and-age-rules"],
    defaultValue: DEFAULT_NOLA_SWAMP_INPUT.needsStepFreeOrAssistedBoarding,
  },
  {
    questionId: "preferredVesselExperience",
    label: "Which swamp vessel or experience style do you prefer?",
    helpText:
      "Choose between shaded covered pontoons, high-speed open airboats, bundled French Quarter motorcoach packages, or self-guided boardwalk/park trails.",
    inputType: "select",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Ranks the matching vessel or self-guided format highest among viable candidates.",
    drivenByClaimIds: [
      "clm-cajun-encounters-honey-island-specs",
      "clm-gray-line-included-coach-and-pricing",
      "clm-airboat-adventures-safety-and-age-rules",
    ],
    defaultValue: DEFAULT_NOLA_SWAMP_INPUT.preferredVesselExperience,
    options: [
      {
        value: "covered_shade_pontoon",
        label: "Covered, shaded flat-bottom pontoon (quiet narration, all ages)",
      },
      {
        value: "included_coach_from_french_quarter_dock",
        label: "Covered pontoon with motorcoach included from French Quarter (400 Toulouse St.)",
      },
      {
        value: "high_speed_open_airboat",
        label: "High-speed open marsh airboat (ages 5+, ear protection, no shade)",
      },
      {
        value: "self_guided_boardwalk_or_city_park",
        label: "Self-guided boardwalk / park trail (no commercial boat tour)",
      },
    ],
  },
  {
    questionId: "availableHalfDayHours",
    label: "Total available door-to-door window (hours)",
    helpText:
      "Self-drive boat tours take ~3 hours with driving; hotel-shuttle swamp tours take 3.75 hours (Gray Line) to 4–5 hours door-to-door.",
    inputType: "number",
    min: 2,
    max: 8,
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Flags or eliminates shuttle-based swamp excursions when your half-day window is shorter than the required door-to-door block.",
    drivenByClaimIds: ["clm-swamp-shuttle-total-door-to-door-time"],
    defaultValue: DEFAULT_NOLA_SWAMP_INPUT.availableHalfDayHours,
  },
];

export const NOLA_SWAMP_COMPARISON_DIMENSIONS: ComparisonDimension[] = [
  {
    dimensionId: "wetlandBasinAndDock",
    label: "Wetland Basin & Dock",
    description: "Exact swamp corridor and dock/departure address.",
  },
  {
    dimensionId: "vesselAndShade",
    label: "Vessel & Shade",
    description: "Boat or trail architecture, roof canopy, and noise profile.",
  },
  {
    dimensionId: "ageAndMedicalRules",
    label: "Age & Medical Rules",
    description: "Verified minimum age, pregnancy/spinal, and boarding rules.",
  },
  {
    dimensionId: "shuttleAndTransit",
    label: "Transport & Shuttle",
    description: "Whether shuttle is included, extra ($30), optional, or self-drive/RTA.",
  },
  {
    dimensionId: "publishedPricing",
    label: "Verified Pricing",
    description: "Published operator or public agency tariff.",
    unitOrFormat: "USD",
  },
];

export const NOLA_SWAMP_CANDIDATE_OPTIONS: CandidateOption[] = [
  {
    optionId: "nola-swamp-cajun-encounters-covered",
    title: "Cajun Encounters Covered Honey Island Swamp Tour",
    shortLabel: "Cajun Encounters (Honey Island Covered Pontoon)",
    optionKind: "guided_commercial",
    actualOperators: ["Cajun Encounters Tour Company"],
    islandsOrRegions: ["Slidell / Honey Island Swamp"],
    departureAreas: ["55345 US-90, Slidell, LA (~45 min from French Quarter)"],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2027-05-02",
    vesselOrVehicleType:
      "Covered flat-bottom pontoon boat (up to 22 guests; separate 10–12 guest VIP small-boat requires age 13+)",
    groupCapacityRange: {
      min: 1,
      max: 22,
      label: "Up to 22 guests on covered pontoon (all ages); 10–12 on VIP boat (age 13+)",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "Flat-bottom covered canopy pontoon navigating narrow river-swamp channels in the 70,000-acre Honey Island Swamp with quiet voice narration.",
    durationMinutes: {
      activity: 120,
      checkInLead: 15,
      typicalTransferEachWay: 50,
      totalDockOrHotelRange: { min: 215, max: 300 },
      label:
        "~2 hr (120m) on water; 4–5 hr (240–300m) total door-to-door with optional French Quarter hotel shuttle",
    },
    minimumAgeYears: 0,
    minimumAgeNote:
      "Standard 22-passenger covered pontoon is open to all ages; 10–12 passenger VIP Small-Boat Tour (from $99.99/person) requires age 13+ unless booked as a private boat.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Flat-bottom covered pontoon dock boarding in Slidell; advance notice required for wheelchair accommodation on shuttle buses.",
      confirmationStatus: "operator_confirmation_required",
      note: "Confirm wheelchair lift availability on hotel shuttle coach when booking with transportation.",
    },
    transportationAvailability: {
      hotelPickupAvailable: true,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "Free on-site parking at 55345 US-90, Slidell, LA for self-drive guests; optional hotel shuttle available from French Quarter/downtown hotels (Viator SKU 6953SWAMPTRANS).",
    },
    cancellationTerms:
      "Operator reschedule or refund if severe lightning/storms cancel departures; light rain runs under the boat roof canopy.",
    whaleSightingOrReRidePolicy:
      "Year-round Honey Island river-swamp wildlife viewing (alligators peak in warm months ~70°F+; turtles, wading birds, boar, and raccoons active year-round).",
    indicativePriceUsd: {
      min: 39.99,
      max: 79,
      basisLabel:
        "From $39.99/person self-drive (~$65–$79/person with French Quarter/downtown hotel shuttle; VIP small-boat age 13+ from $99.99/person)",
    },
    comparisonValues: {
      wetlandBasinAndDock: "Honey Island Swamp (55345 US-90, Slidell, LA)",
      vesselAndShade: "22-pax covered flat-bottom pontoon with full roof canopy",
      ageAndMedicalRules:
        "All ages on standard 22-pax covered boat (VIP 10–12 pax boat requires age 13+)",
      shuttleAndTransit:
        "Self-drive free parking or optional French Quarter/downtown hotel shuttle",
      publishedPricing:
        "From $39.99/person self-drive (~$65–$79/person with hotel shuttle)",
    },
    tradeoffs: {
      strengths: [
        "Lowest published self-drive starting rate ($39.99/person) with full roof shade and all-ages access on the 22-passenger boat",
        "Navigates the protected Honey Island river-swamp interior with optional French Quarter hotel shuttle pickup (SKU 6953SWAMPTRANS)",
      ],
      limitations: [
        "Slidell dock is ~45 minutes northeast of the French Quarter (budget 4–5 hours total with hotel shuttle pickup)",
        "10–12 guest VIP Small-Boat option ($99.99+) restricts children under 13 unless booked private",
      ],
    },
    claimIds: [
      "clm-cajun-encounters-honey-island-specs",
      "clm-swamp-shuttle-total-door-to-door-time",
    ],
    sourceIds: ["src-cajun-encounters-official"],
    bookingDestinations: [
      {
        destinationId: "dest-cajun-encounters-direct",
        optionId: "nola-swamp-cajun-encounters-covered",
        sellerType: "direct_operator",
        sellerName: "Cajun Encounters Tour Company",
        actualOperatorName: "Cajun Encounters Tour Company",
        label: "Book Direct with Cajun Encounters (Slidell Self-Drive or Hotel Shuttle)",
        url: "https://www.cajunencounters.com/tours/swamp-tour-new-orleans",
        supportedContextParams: [],
        relationshipDisclosure:
          "Direct operator booking link. Destination Command Center receives no commission on direct bookings and applies zero commercial weight to rankings.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "nola-swamp-gray-line-pontoon-coach",
    title: "Gray Line New Orleans Jean Lafitte Swamp & Bayou Tour (Motorcoach Included)",
    shortLabel: "Gray Line (Jean Lafitte Pontoon + Coach Included)",
    optionKind: "guided_commercial",
    actualOperators: ["Gray Line New Orleans"],
    islandsOrRegions: ["Jean Lafitte / Barataria Bayou"],
    departureAreas: [
      "Lighthouse Ticket Office at Steamboat NATCHEZ Dock (400 Toulouse St., French Quarter)",
    ],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2027-05-02",
    vesselOrVehicleType:
      "Covered flat-bottom swamp boat + included round-trip French Quarter motorcoach",
    groupCapacityRange: {
      min: 1,
      max: 40,
      label: "Covered flat-bottom swamp boat with bundled motorcoach from 400 Toulouse St.",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "Covered, flat-bottom bayou boat in Jean Lafitte with open sides and full overhead roof canopy.",
    durationMinutes: {
      activity: 100,
      checkInLead: 15,
      typicalTransferEachWay: 45,
      totalDockOrHotelRange: { min: 225, max: 225 },
      label:
        "3 hr 45 min (225m) total from 400 Toulouse St. (90–105m on water + 45m coach each way + 15m check-in)",
    },
    minimumAgeYears: 0,
    minimumAgeNote:
      "Open to all ages: Adults (13+) $65, Seniors (65+) $58.50, Children (6–12) $32, Infants (2–5) $0 free.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Central French Quarter check-in at 400 Toulouse St. with motorcoach transfer to covered flat-bottom swamp boat.",
      confirmationStatus: "operator_confirmation_required",
      note: "Contact Gray Line New Orleans in advance if wheelchair lift coach seating is required.",
    },
    transportationAvailability: {
      hotelPickupAvailable: true,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "Round-trip motorcoach transportation is included in the base ticket from 400 Toulouse St. (Toulouse St. & Decatur St.) in the French Quarter.",
    },
    cancellationTerms:
      "Subject to Gray Line New Orleans published cancellation and weather rescheduling policies.",
    whaleSightingOrReRidePolicy:
      "Guided Jean Lafitte bayou and cypress wetland excursion with local captain narration.",
    indicativePriceUsd: {
      min: 32,
      max: 65,
      basisLabel:
        "$65 adults (13+), $58.50 seniors (65+), $32 children (6–12), $0 free infants (2–5) — motorcoach included",
    },
    comparisonValues: {
      wetlandBasinAndDock:
        "Jean Lafitte via 400 Toulouse St. (Steamboat NATCHEZ Lighthouse Ticket Office)",
      vesselAndShade: "Covered flat-bottom bayou boat with full roof shade",
      ageAndMedicalRules:
        "All ages welcome ($0 infants 2–5, $32 children 6–12, $58.50 seniors 65+, $65 adults)",
      shuttleAndTransit:
        "Round-trip motorcoach included from 400 Toulouse St. in the French Quarter",
      publishedPricing:
        "$65 adult / $58.50 senior / $32 child (6–12) / $0 infant (2–5) with coach included",
    },
    tradeoffs: {
      strengths: [
        "Round-trip motorcoach from the French Quarter (400 Toulouse St.) is included in the base $65 adult rate",
        "Published family/senior tiers ($58.50 seniors 65+, $32 children 6–12, $0 infants 2–5) and predictable 3 hr 45 min (225m) total schedule",
      ],
      limitations: [
        "Requires checking in at 400 Toulouse St. in the French Quarter rather than Suburban/Metairie hotel-door pickup",
        "Larger covered tour boat rather than a high-speed airboat",
      ],
    },
    claimIds: [
      "clm-gray-line-included-coach-and-pricing",
      "clm-swamp-shuttle-total-door-to-door-time",
    ],
    sourceIds: ["src-gray-line-nola-swamp"],
    bookingDestinations: [
      {
        destinationId: "dest-gray-line-nola-direct",
        optionId: "nola-swamp-gray-line-pontoon-coach",
        sellerType: "direct_operator",
        sellerName: "Gray Line New Orleans",
        actualOperatorName: "Gray Line New Orleans",
        label: "Book Direct with Gray Line New Orleans (400 Toulouse St. Departure)",
        url: "https://www.graylineneworleans.com/swamp-tours/swamp-bayou-tour/",
        supportedContextParams: [],
        relationshipDisclosure:
          "Direct operator link. Zero commercial weight is applied to candidate ranking.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "nola-swamp-cajun-pride-manchac",
    title: "Cajun Pride Private Manchac Wildlife Refuge Covered Swamp Tour",
    shortLabel: "Cajun Pride (Manchac Private Wildlife Refuge)",
    optionKind: "guided_commercial",
    actualOperators: ["Cajun Pride Swamp Tours"],
    islandsOrRegions: ["Manchac Swamp / LaPlace"],
    departureAreas: [
      "110 Frenier Rd, LaPlace, LA (27 miles / ~35 min west of French Quarter via I-10)",
    ],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2026-10-08",
    vesselOrVehicleType:
      "Covered flat-bottom pontoon boat on private Manchac wildlife refuge",
    groupCapacityRange: {
      min: 1,
      max: 30,
      label: "Covered pontoon on private wildlife refuge (all ages)",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "Covered, shaded flat-bottom pontoon boat operating on a private wildlife refuge in the Manchac cypress swamp.",
    durationMinutes: {
      activity: 95,
      checkInLead: 15,
      typicalTransferEachWay: 35,
      totalDockOrHotelRange: { min: 180, max: 240 },
      label:
        "~1.5–1.75 hr on water; ~3 hr self-drive or ~4 hr with New Orleans / Metairie / Kenner hotel shuttle",
    },
    minimumAgeYears: 0,
    minimumAgeNote: "Open to all ages on covered flat-bottom pontoon boats.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Covered pontoon dock at 110 Frenier Rd, LaPlace, LA with flat-bottom vessel stability.",
      confirmationStatus: "operator_confirmation_required",
      note: "Contact Cajun Pride in advance if wheelchair transport is needed on the hotel shuttle.",
    },
    transportationAvailability: {
      hotelPickupAvailable: true,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "Free self-drive parking at 110 Frenier Rd, LaPlace, LA (~35 min from French Quarter); optional shuttle pickup serves New Orleans, Metairie, and Kenner area hotels (Viator SKU 141126P2).",
    },
    cancellationTerms:
      "Subject to Cajun Pride weather safety and cancellation policies.",
    whaleSightingOrReRidePolicy:
      "Operates on a private wildlife refuge in Manchac isolating tour boats from public wake traffic.",
    indicativePriceUsd: {
      min: 40,
      max: 79,
      basisLabel:
        "Published self-drive and New Orleans/Metairie/Kenner hotel-shuttle covered pontoon tiers",
    },
    comparisonValues: {
      wetlandBasinAndDock:
        "Manchac Private Wildlife Refuge (110 Frenier Rd, LaPlace, LA — 27 mi / ~35m via I-10)",
      vesselAndShade: "Covered flat-bottom pontoon with full roof canopy",
      ageAndMedicalRules: "All ages welcome",
      shuttleAndTransit:
        "Self-drive or optional hotel shuttle from New Orleans, Metairie, and Kenner hotels",
      publishedPricing:
        "Covered pontoon self-drive and hotel-shuttle tiers (SKU 141126P2)",
    },
    tradeoffs: {
      strengths: [
        "Only major swamp operator offering hotel shuttle pickup across New Orleans, Metairie, and Kenner area hotels",
        "Closest highway drive (~35 min via I-10 to 110 Frenier Rd, LaPlace) and private Manchac wildlife refuge waters",
      ],
      limitations: [
        "Manchac cypress bayou setting rather than high-speed open-marsh airboat channel",
        "Hotel shuttle still requires ~4 hours door-to-door",
      ],
    },
    claimIds: [
      "clm-cajun-pride-manchac-specs",
      "clm-swamp-shuttle-total-door-to-door-time",
    ],
    sourceIds: ["src-cajun-pride-official-faq"],
    bookingDestinations: [
      {
        destinationId: "dest-cajun-pride-direct",
        optionId: "nola-swamp-cajun-pride-manchac",
        sellerType: "direct_operator",
        sellerName: "Cajun Pride Swamp Tours",
        actualOperatorName: "Cajun Pride Swamp Tours",
        label: "View Cajun Pride Official Manchac Tour & Hotel Pickup FAQ",
        url: "https://www.cajunprideswamptours.com/questions",
        supportedContextParams: [],
        relationshipDisclosure:
          "Direct operator link. Zero commercial weight is applied to candidate ranking.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "nola-swamp-airboat-adventures",
    title: "Airboat Adventures High-Speed Marsh Airboat (Small 6–10 Pax or Large 16–30 Pax)",
    shortLabel: "Airboat Adventures (Jean Lafitte Open Airboat)",
    optionKind: "guided_commercial",
    actualOperators: ["Airboat Adventures"],
    islandsOrRegions: ["Jean Lafitte"],
    departureAreas: [
      "5145 Fleming Park Rd, Lafitte, LA (~45 min south of French Quarter)",
    ],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2026-10-08",
    vesselOrVehicleType:
      "High-speed open marsh airboat (Small 6–10 pax or Large 16–30 pax; no roof shade; hearing protection provided)",
    groupCapacityRange: {
      min: 6,
      max: 30,
      label: "Small airboat (6–10 pax) or Large airboat (16–30 pax)",
    },
    rideComfortLevel: "high_motion_raft_or_aircraft",
    viewingSpaceDescription:
      "Open-top stadium seating propelled by an aircraft-style fan across shallow marsh flats and bayou channels without overhead canopy.",
    durationMinutes: {
      activity: 105,
      checkInLead: 30,
      typicalTransferEachWay: 50,
      totalDockOrHotelRange: { min: 235, max: 270 },
      label:
        "1 hr 45 min (105m) on water; ~4–4.5 hr total with Downtown/French Quarter hotel shuttle (pickup starts 1 hr 15 min before tour)",
    },
    minimumAgeYears: 5,
    minimumAgeNote:
      "Strict minimum age 5 years (48 inches height). Pregnant women and guests with neck or back injuries are strictly prohibited.",
    prohibitsPregnantOrSpinalConditions: true,
    accessibilityProfile: {
      stepFreeWheelchairSupported: false,
      limitedMobilitySupported: false,
      walkingAndBoardingRequirement:
        "Requires unassisted stepping onto open airboats; pregnant women and guests with neck or back problems are not permitted.",
      confirmationStatus: "not_accessible",
      note: "Airboat Adventures requires unassisted boarding and strictly prohibits pregnancy and neck/back conditions.",
    },
    transportationAvailability: {
      hotelPickupAvailable: true,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "Free parking at 5145 Fleming Park Rd, Lafitte, LA (check in 30m prior). Optional round-trip shuttle is $30/person extra from Downtown/French Quarter hotels only (no residential addresses or Airbnbs; return cabs from Lafitte are unavailable).",
    },
    cancellationTerms:
      "Open airboats have no overhead roof canopy; subject to operator weather postponement policies.",
    whaleSightingOrReRidePolicy:
      "Skims shallow Jean Lafitte marsh flats inaccessible to deep-draft boats.",
    indicativePriceUsd: {
      min: 89,
      max: 149,
      basisLabel:
        "From $89/person (10-pax small or 16–30 pax large airboat) to $119/person (6-pax small airboat) self-drive; +$30/person ($119–$149 total) with Downtown/FQ hotel shuttle",
    },
    comparisonValues: {
      wetlandBasinAndDock: "Jean Lafitte Marsh (5145 Fleming Park Rd, Lafitte, LA)",
      vesselAndShade:
        "Open high-speed airboat (6–10 pax small or 16–30 pax large; no shade; ear protection)",
      ageAndMedicalRules:
        "Minimum age 5+; prohibits pregnancy & neck/back injuries; unassisted boarding required",
      shuttleAndTransit:
        "Self-drive or +$30/person shuttle from Downtown/French Quarter hotels only (no Airbnbs)",
      publishedPricing:
        "$89–$119/person self-drive (+$30/person = $119–$149/person with hotel shuttle)",
    },
    tradeoffs: {
      strengths: [
        "Delivers high-speed shallow-marsh skimming in 6–10 passenger small airboats or 16–30 passenger large airboats",
        "1 hour 45 minutes (105m) of on-water marsh exploration with ear protection provided",
      ],
      limitations: [
        "Strictly eliminates children under age 5, pregnant travelers, anyone with neck/back injuries, and guests needing assisted boarding",
        "Shuttle costs $30/person extra ($119–$149 total) and serves Downtown/French Quarter hotels only (no Airbnbs or residential addresses; no return cabs in Lafitte)",
      ],
    },
    claimIds: [
      "clm-airboat-adventures-safety-and-age-rules",
      "clm-airboat-adventures-hotel-only-shuttle-rule",
    ],
    sourceIds: ["src-airboat-adventures-official"],
    bookingDestinations: [
      {
        destinationId: "dest-airboat-adventures-direct",
        optionId: "nola-swamp-airboat-adventures",
        sellerType: "direct_operator",
        sellerName: "Airboat Adventures",
        actualOperatorName: "Airboat Adventures",
        label: "View Airboat Adventures Official FAQs, Age/Safety Rules & Pickup Hotels",
        url: "https://airboatadventures.com/faqs/",
        supportedContextParams: [],
        relationshipDisclosure:
          "Direct operator link. Zero commercial weight is applied to candidate ranking.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "nola-swamp-nps-barataria-and-wetland-trace",
    title:
      "Self-Drive Public Alternative: NPS Barataria Twin Canals ($0 Free) & Relocated Wetland Trace Boardwalk ($10 Adult / $5 Senior)",
    shortLabel: "NPS Twin Canals ($0) / Wetland Trace Boardwalk ($10)",
    optionKind: "public_or_diy",
    actualOperators: [
      "National Park Service (Jean Lafitte NHP&P)",
      "Louisiana Wetlands Education Center (Town of Jean Lafitte)",
    ],
    islandsOrRegions: ["Marrero / Jean Lafitte"],
    departureAreas: [
      "Twin Canals Trailhead (Barataria Preserve) & Louisiana Wetlands Education Center (4917 City Park Drive, Jean Lafitte)",
    ],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2026-10-08",
    vesselOrVehicleType:
      "Self-guided wetland trail / boardwalk (personal or rental car required)",
    groupCapacityRange: {
      min: 1,
      max: 20,
      label: "Self-guided public access (personal or rental car required)",
    },
    rideComfortLevel: "shore_stationary",
    viewingSpaceDescription:
      "Important 2026 Construction Alert: Starting February 2, 2026 for ~2 years, the NPS Barataria Preserve Visitor Center and most trails are closed for reconstruction. Only the Twin Canals parking lot, trail, and canoe launch remain open for $0 free day-use access (no restrooms), while visitor services and the open Wetland Trace Boardwalk are relocated 6 miles south to the Louisiana Wetlands Education Center (4917 City Park Drive, Jean Lafitte).",
    durationMinutes: {
      activity: 90,
      checkInLead: 0,
      typicalTransferEachWay: 35,
      totalDockOrHotelRange: { min: 150, max: 180 },
      label:
        "~2.5–3.0 hr (150–180m) total with self-drive car (~30–40m drive each way + 60–90m trail walk)",
    },
    minimumAgeYears: 0,
    minimumAgeNote:
      "Open to all ages; at Louisiana Wetlands Education Center (4917 City Park Drive), children under 12 are free with a parent.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Relocated Wetland Trace Boardwalk at 4917 City Park Drive provides level boardwalk access and restrooms; NPS Twin Canals has no restroom facilities during the 2026–2028 reconstruction.",
      confirmationStatus: "confirmed_accessible",
      note: "Use 4917 City Park Drive (Wetland Trace Boardwalk) if restrooms and visitor center facilities are required during the Feb 2026 – 2028 NPS Barataria closure.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "Requires a personal or rental car; no public transit or reliable return rideshare serves Barataria Preserve or Jean Lafitte.",
    },
    cancellationTerms:
      "Self-paced day-use access; no advance ticket reservation required.",
    whaleSightingOrReRidePolicy:
      "Self-guided wetland boardwalk wildlife viewing without boat engine noise.",
    indicativePriceUsd: {
      min: 0,
      max: 10,
      basisLabel:
        "$0 free at NPS Twin Canals (no restrooms during Feb 2026–2028 closure); $10 adults / $5 seniors, ages 13–17, LA residents & military / $0 under 12 at relocated Wetland Trace Boardwalk (4917 City Park Drive)",
    },
    comparisonValues: {
      wetlandBasinAndDock:
        "NPS Twin Canals (Marrero) & Relocated Wetland Trace Boardwalk (4917 City Park Drive, Jean Lafitte)",
      vesselAndShade:
        "Self-guided walking trail / cypress boardwalk (no boat tour)",
      ageAndMedicalRules: "All ages welcome ($0 children under 12 at Wetland Trace)",
      shuttleAndTransit:
        "Self-drive personal/rental car required (no public transit or reliable return rideshare)",
      publishedPricing:
        "$0 free (Twin Canals only) or $10 adult / $5 senior & youth 13–17 (Wetland Trace Boardwalk)",
    },
    tradeoffs: {
      strengths: [
        "Zero-to-low admission ($0 at NPS Twin Canals; $10 adult / $5 senior at relocated Wetland Trace Boardwalk) with no boat motion or age restrictions",
        "Explicitly accounts for the February 2, 2026 2-year NPS Barataria Preserve reconstruction closure so self-drivers are not surprised by closed trails",
      ],
      limitations: [
        "Strictly requires a personal or rental car (eliminated when you need a shuttle or public transit)",
        "Most NPS Barataria Preserve trails and the main Visitor Center are closed starting Feb 2, 2026 for ~2 years (no restrooms at Twin Canals)",
      ],
    },
    claimIds: ["clm-nps-barataria-2026-closure-and-wetland-trace"],
    sourceIds: ["src-nps-barataria-preserve-2026"],
    bookingDestinations: [
      {
        destinationId: "dest-nps-barataria-official",
        optionId: "nola-swamp-nps-barataria-and-wetland-trace",
        sellerType: "public_or_diy",
        sellerName: "National Park Service — Jean Lafitte NHP&P",
        actualOperatorName: "National Park Service",
        label: "Check NPS Barataria Preserve 2026 Closure & Relocated Wetland Trace Details",
        url: "https://www.nps.gov/jela/planyourvisit/barataria-preserve.htm",
        supportedContextParams: [],
        relationshipDisclosure:
          "Official National Park Service alert page. Destination Command Center has no commercial relationship with public land agencies.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "nola-swamp-rta-city-park-streetcar",
    title:
      "In-City Public Transit Alternative: New Orleans City Park, Couturie Forest & Bayou Metairie via RTA Streetcar",
    shortLabel: "City Park & Couturie Forest ($1.25 RTA Streetcar)",
    optionKind: "public_or_diy",
    actualOperators: [
      "New Orleans Regional Transit Authority (RTA)",
      "New Orleans City Park",
    ],
    islandsOrRegions: ["Mid-City New Orleans / City Park"],
    departureAreas: [
      "Canal Street–City Park/Museum RTA Streetcar Line (French Quarter / CBD boarding)",
    ],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2026-10-08",
    vesselOrVehicleType:
      "RTA Canal Street–City Park/Museum streetcar + self-guided lagoon/forest trails",
    groupCapacityRange: {
      min: 1,
      max: 30,
      label: "Public RTA streetcar and free park trails (all ages)",
    },
    rideComfortLevel: "shore_stationary",
    viewingSpaceDescription:
      "Self-guided walking loops through Couturie Forest, Scout Island, and Bayou Metairie lagoons inside New Orleans City Park, reachable directly by historic streetcar.",
    durationMinutes: {
      activity: 90,
      checkInLead: 5,
      typicalTransferEachWay: 28,
      totalDockOrHotelRange: { min: 120, max: 180 },
      label:
        "~2.0–2.5 hr (120–150m) total (~25–30m RTA streetcar each way + self-paced lagoon/forest walk)",
    },
    minimumAgeYears: 0,
    minimumAgeNote: "Open to all ages.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Paved City Park lagoon paths around Bayou Metairie and ADA-accessible RTA Canal Street streetcars.",
      confirmationStatus: "confirmed_accessible",
      note: "Paved lagoon paths around Bayou Metairie and the Sculpture Garden are step-free; Couturie Forest includes unpaved woodland paths.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "Reachable without a car for $1.25 one-way RTA streetcar fare ($3.00 24-hour Jazzy Pass) on the Canal Street–City Park/Museum line.",
    },
    cancellationTerms: "Public transit and park trails; no booking required.",
    whaleSightingOrReRidePolicy:
      "Urban bayou lagoons, ancient live oaks, wading birds, and turtles (not a deep-swamp boat tour).",
    indicativePriceUsd: {
      min: 1.25,
      max: 3,
      basisLabel:
        "$1.25 one-way RTA streetcar fare ($3.00 24-hr Jazzy Pass); $0 Couturie Forest & Bayou Metairie entry",
    },
    comparisonValues: {
      wetlandBasinAndDock:
        "New Orleans City Park — Couturie Forest & Bayou Metairie",
      vesselAndShade:
        "RTA Streetcar + shaded live-oak lagoon & woodland walking trails",
      ageAndMedicalRules: "All ages welcome",
      shuttleAndTransit:
        "$1.25 one-way RTA Canal Street–City Park/Museum streetcar ($3.00 24-hr Jazzy Pass)",
      publishedPricing: "$1.25 one-way streetcar ($3.00 24-hr pass); $0 trail entry",
    },
    tradeoffs: {
      strengths: [
        "Only option reachable on public transit without a car or commercial shuttle ($1.25 one-way RTA streetcar / $3.00 24-hr pass)",
        "Fits tight 2–3 hour windows when a 4–5 hour Slidell/Lafitte swamp shuttle will not fit",
      ],
      limitations: [
        "Urban park bayou and forest walk rather than a boat tour in Honey Island or Jean Lafitte",
        "Does not provide commercial swamp boat narration or guaranteed wild alligator encounters",
      ],
    },
    claimIds: ["clm-norta-city-park-streetcar-alternative"],
    sourceIds: ["src-norta-city-park"],
    bookingDestinations: [
      {
        destinationId: "dest-norta-official",
        optionId: "nola-swamp-rta-city-park-streetcar",
        sellerType: "public_or_diy",
        sellerName: "New Orleans Regional Transit Authority (RTA)",
        actualOperatorName: "New Orleans Regional Transit Authority (RTA)",
        label: "View RTA Canal Street–City Park Streetcar Schedule & $1.25 / $3.00 Fares",
        url: "https://www.norta.com/",
        supportedContextParams: [],
        relationshipDisclosure:
          "Public transit agency link. Destination Command Center has no commercial relationship with RTA.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
];

export function computeNolaSwampTiming(
  option: CandidateOption,
  input: NolaSwampAnswerInput,
): TimingCalculationResult {
  const availableWindowMinutes = Math.round(input.availableHalfDayHours * 60);
  const transferEachWay =
    input.transportMode === "have_car_self_drive" &&
    option.optionKind === "guided_commercial"
      ? 40
      : option.durationMinutes.typicalTransferEachWay;
  const transferMinutesRoundTrip = transferEachWay * 2;
  const checkInLeadMinutes = option.durationMinutes.checkInLead;
  const activityMinutes = option.durationMinutes.activity;
  const returnBufferMinutes = 15;
  const requiredTotalMinutes =
    checkInLeadMinutes +
    transferMinutesRoundTrip +
    activityMinutes +
    returnBufferMinutes;
  const netSlackMinutes = availableWindowMinutes - requiredTotalMinutes;

  return {
    availableWindowMinutes,
    requiredTotalMinutes,
    checkInLeadMinutes,
    transferMinutesRoundTrip,
    activityMinutes,
    returnBufferMinutes,
    netSlackMinutes,
    summary: `Requires ~${requiredTotalMinutes} min total (${checkInLeadMinutes}m check-in + ${transferMinutesRoundTrip}m round-trip transit + ${activityMinutes}m activity + ${returnBufferMinutes}m buffer) vs. ${availableWindowMinutes}m available (${netSlackMinutes >= 0 ? `+${netSlackMinutes}m slack` : `${netSlackMinutes}m deficit`}).`,
  };
}

export const NOLA_SWAMP_HARD_CONSTRAINTS: HardConstraintRule<NolaSwampAnswerInput>[] =
  [
    {
      ruleId: "hc-nola-minimum-age",
      label: "Operator Minimum Age Policy",
      description:
        "Eliminates Airboat Adventures when the youngest traveler is under age 5.",
      sourceIds: ["src-airboat-adventures-official"],
      evaluate: (option, input) => {
        if (
          option.minimumAgeYears !== null &&
          input.youngestTravelerAgeYears < option.minimumAgeYears
        ) {
          return {
            passed: false,
            eliminationReason: `${option.shortLabel} enforces a strict minimum age of ${option.minimumAgeYears} years (youngest traveler entered: ${input.youngestTravelerAgeYears}).`,
            whatInputChangeWouldAlterResult: `All travelers must be age ${option.minimumAgeYears}+ (covered pontoon tours welcome all ages).`,
          };
        }
        return { passed: true };
      },
    },
    {
      ruleId: "hc-nola-pregnancy-and-spinal-safety",
      label: "Pregnancy & Neck/Back Injury Prohibition",
      description:
        "Eliminates high-speed open airboats when any traveler is pregnant or has neck/back injuries.",
      sourceIds: ["src-airboat-adventures-official"],
      evaluate: (option, input) => {
        if (
          input.hasPregnancyOrNeckBackInjury &&
          option.prohibitsPregnantOrSpinalConditions
        ) {
          return {
            passed: false,
            eliminationReason: `${option.shortLabel} strictly prohibits pregnant women and guests with neck or back injuries due to high-speed marsh turns and hull jarring.`,
            whatInputChangeWouldAlterResult:
              "Choose a flat-bottom covered pontoon tour (Cajun Encounters, Gray Line, or Cajun Pride) or a walking trail.",
          };
        }
        return { passed: true };
      },
    },
    {
      ruleId: "hc-nola-assisted-boarding",
      label: "Unassisted Airboat Boarding Requirement",
      description:
        "Eliminates Airboat Adventures when step-free or assisted boarding is required.",
      sourceIds: ["src-airboat-adventures-official"],
      evaluate: (option, input) => {
        if (
          input.needsStepFreeOrAssistedBoarding &&
          !option.accessibilityProfile.limitedMobilitySupported
        ) {
          return {
            passed: false,
            eliminationReason: `${option.shortLabel} requires unassisted stepping onto open airboats and does not support step-free/assisted boarding.`,
            whatInputChangeWouldAlterResult:
              "Select a covered flat-bottom pontoon operator or the relocated Wetland Trace Boardwalk.",
          };
        }
        return { passed: true };
      },
    },
    {
      ruleId: "hc-nola-transport-feasibility",
      label: "Car vs. Hotel Shuttle vs. Public Transit Feasibility",
      description:
        "Eliminates car-only NPS Barataria / Wetland Trace when the traveler has no car, and eliminates rural docks when the traveler restricts to public transit only.",
      sourceIds: [
        "src-nps-barataria-preserve-2026",
        "src-airboat-adventures-official",
        "src-cajun-pride-official-faq",
      ],
      evaluate: (option, input) => {
        if (
          option.optionId === "nola-swamp-nps-barataria-and-wetland-trace" &&
          input.transportMode !== "have_car_self_drive"
        ) {
          return {
            passed: false,
            eliminationReason:
              "NPS Barataria Preserve (Twin Canals) and the relocated Wetland Trace Boardwalk (4917 City Park Drive, Jean Lafitte) have no public transit or reliable return rideshare—a personal or rental car is required.",
            whatInputChangeWouldAlterResult:
              "Switch transport mode to 'Have a personal or rental car (self-drive)' or choose a tour with hotel/French Quarter shuttle pickup.",
          };
        }

        if (
          input.transportMode === "public_transit_only" &&
          option.optionId !== "nola-swamp-rta-city-park-streetcar"
        ) {
          return {
            passed: false,
            eliminationReason: `${option.shortLabel} departs 35–45 minutes outside New Orleans and cannot be reached via RTA public transit without purchasing a commercial swamp shuttle or driving a car.`,
            whatInputChangeWouldAlterResult:
              "Switch transport mode to 'Need hotel shuttle or French Quarter motorcoach pickup' or 'Have a personal or rental car'.",
          };
        }

        if (
          input.transportMode === "need_hotel_shuttle" &&
          input.stayingLocation === "metairie_or_kenner_hotel" &&
          option.optionId === "nola-swamp-airboat-adventures"
        ) {
          return {
            passed: false,
            eliminationReason:
              "Airboat Adventures' $30/person shuttle serves Downtown and French Quarter hotels only (it does not pick up in Metairie or Kenner, and warns against taking a cab to Lafitte because return cabs are unavailable).",
            whatInputChangeWouldAlterResult:
              "Meet at an approved Downtown/French Quarter hotel pickup point, drive a rental car, or select Cajun Pride (which offers Metairie/Kenner hotel pickup).",
          };
        }

        if (
          input.transportMode === "need_hotel_shuttle" &&
          input.stayingLocation === "residential_or_airbnb" &&
          option.optionKind === "guided_commercial"
        ) {
          return {
            passed: true,
            decisionChangingWarning:
              "Operator shuttles do not pick up at residential addresses or Airbnbs—you must walk or take a short rideshare to an approved Downtown/French Quarter hotel pickup stop (or 400 Toulouse St. for Gray Line).",
          };
        }

        return { passed: true };
      },
    },
    {
      ruleId: "hc-nola-window-duration",
      label: "Half-Day Door-to-Door Window Fit",
      description:
        "Eliminates excursions whose required door-to-door time exceeds the traveler's available half-day window.",
      sourceIds: [
        "src-cajun-encounters-official",
        "src-gray-line-nola-swamp",
      ],
      evaluate: (option, _input, context) => {
        const timing = context.computeTimingForOption(option);
        if (
          timing.netSlackMinutes !== null &&
          timing.netSlackMinutes < 0
        ) {
          return {
            passed: false,
            eliminationReason: `${option.shortLabel} requires ~${(timing.requiredTotalMinutes / 60).toFixed(1)} hours (${timing.requiredTotalMinutes} min) door-to-door, exceeding your ${(timing.availableWindowMinutes! / 60).toFixed(1)}-hour window.`,
            whatInputChangeWouldAlterResult: `Expand your available window to at least ${(timing.requiredTotalMinutes / 60).toFixed(1)} hours or self-drive to reduce shuttle routing time.`,
          };
        }
        return { passed: true };
      },
    },
  ];

export const NOLA_SWAMP_PREFERENCE_RULES: PreferenceRule<NolaSwampAnswerInput>[] =
  [
    {
      ruleId: "pref-nola-vessel-style-match",
      label: "Vessel & Experience Architecture Fit",
      maxPoints: 45,
      evaluate: (option, input) => {
        if (
          input.preferredVesselExperience ===
            "included_coach_from_french_quarter_dock" &&
          option.optionId === "nola-swamp-gray-line-pontoon-coach"
        ) {
          return {
            points: 45,
            reason:
              "Directly matches your preference for a covered swamp boat with round-trip motorcoach included from 400 Toulouse St. in the French Quarter.",
          };
        }
        if (
          input.preferredVesselExperience === "high_speed_open_airboat" &&
          option.optionId === "nola-swamp-airboat-adventures"
        ) {
          return {
            points: 45,
            reason:
              "Directly matches your preference for a high-speed open marsh airboat (6–10 pax small or 16–30 pax large).",
          };
        }
        if (
          input.preferredVesselExperience === "covered_shade_pontoon" &&
          (option.optionId === "nola-swamp-cajun-encounters-covered" ||
            option.optionId === "nola-swamp-cajun-pride-manchac" ||
            option.optionId === "nola-swamp-gray-line-pontoon-coach")
        ) {
          return {
            points: 40,
            reason:
              "Provides a shaded, flat-bottom covered pontoon boat with quiet captain narration.",
          };
        }
        if (
          input.preferredVesselExperience ===
            "self_guided_boardwalk_or_city_park" &&
          option.optionKind === "public_or_diy"
        ) {
          return {
            points: 45,
            reason:
              "Matches your preference for a self-guided boardwalk or park trail without a commercial boat tour.",
          };
        }
        return { points: 12, reason: null };
      },
    },
    {
      ruleId: "pref-nola-location-and-shuttle-logistics",
      label: "Hotel Pickup Zone & Self-Drive Fit",
      maxPoints: 35,
      evaluate: (option, input) => {
        if (
          input.stayingLocation === "metairie_or_kenner_hotel" &&
          option.optionId === "nola-swamp-cajun-pride-manchac"
        ) {
          return {
            points: 35,
            reason:
              "Cajun Pride explicitly provides hotel shuttle pickup across Metairie and Kenner hotels as well as New Orleans.",
          };
        }
        if (
          input.transportMode === "need_hotel_shuttle" &&
          option.optionId === "nola-swamp-gray-line-pontoon-coach"
        ) {
          return {
            points: 32,
            reason:
              "Includes round-trip motorcoach transportation in the base $65 adult fare from 400 Toulouse St.",
          };
        }
        if (
          input.transportMode === "have_car_self_drive" &&
          option.optionId === "nola-swamp-cajun-encounters-covered"
        ) {
          return {
            points: 32,
            reason:
              "Self-drivers unlock Cajun Encounters' $39.99/person Slidell dock rate with free parking in Honey Island Swamp.",
          };
        }
        if (
          input.transportMode === "public_transit_only" &&
          option.optionId === "nola-swamp-rta-city-park-streetcar"
        ) {
          return {
            points: 35,
            reason:
              "Reachable directly on the $1.25 RTA Canal Street–City Park/Museum streetcar without a car or tour bus.",
          };
        }
        return { points: 18, reason: null };
      },
    },
    {
      ruleId: "pref-nola-family-age-pricing-value",
      label: "Family & Child Age Pricing Value",
      maxPoints: 20,
      evaluate: (option, input) => {
        if (
          input.youngestTravelerAgeYears <= 12 &&
          option.optionId === "nola-swamp-gray-line-pontoon-coach"
        ) {
          return {
            points: 20,
            reason:
              "Gray Line offers published child pricing ($32 ages 6–12) and $0 free admission for infants ages 2–5 with motorcoach included.",
          };
        }
        if (
          option.minimumAgeYears === 0 &&
          input.youngestTravelerAgeYears < 5
        ) {
          return {
            points: 18,
            reason:
              "Welcomes children under age 5 (who are prohibited on high-speed airboats).",
          };
        }
        return { points: 10, reason: null };
      },
    },
  ];

export const NOLA_SWAMP_DECISION_ENGINE: DecisionEngineDefinition<NolaSwampAnswerInput> =
  {
    engineId: "new-orleans-swamp-tours",
    version: "2026.04.08-v1",
    slug: "new-orleans/swamp-tours",
    canonicalPath: "/new-orleans/swamp-tours",
    canonicalUrl: "https://destinationcommandcenter.com/new-orleans/swamp-tours",
    title:
      "New Orleans Swamp Tours Decision Engine — Covered Pontoons vs. Airboats, Shuttle Zones & 2026 Barataria Closure",
    destinationName: "New Orleans, Louisiana",
    categoryName: "Swamp & Bayou Tours",
    heroQuestion:
      "Which New Orleans swamp tour—or self-guided wetland alternative—actually fits your group's ages, hotel shuttle needs, and vessel preference?",
    summaryDescription:
      "Constraint-first evaluator comparing Cajun Encounters (Honey Island covered pontoon from $39.99 self-drive), Gray Line New Orleans (Jean Lafitte covered boat with motorcoach included from 400 Toulouse St. at $65 adult / $58.50 senior / $32 child / $0 infant 2–5), Cajun Pride (Manchac private wildlife refuge with NOLA/Metairie/Kenner hotel pickup), Airboat Adventures (open airboat $89–$119 + $30 hotel-only shuttle, strict age 5+ and pregnancy/spinal restrictions), plus the Feb 2, 2026 NPS Barataria Twin Canals / relocated Wetland Trace Boardwalk ($10) and $1.25 RTA City Park streetcar alternatives.",
    referenceGuide: {
      importantDecisionFactors: [
        {
          title:
            "Covered Pontoon (All Ages, Shade) vs. Open Airboat (Age 5+, No Shade, No Pregnancy/Spinal Conditions)",
          detail:
            "Covered flat-bottom pontoons (Cajun Encounters, Gray Line, Cajun Pride) welcome all ages under a roof canopy. Airboat Adventures enforces a strict minimum age of 5 years (48 inches), strictly prohibits pregnant women and anyone with neck or back injuries, and requires unassisted boarding.",
          sourceIds: [
            "src-cajun-encounters-official",
            "src-gray-line-nola-swamp",
            "src-airboat-adventures-official",
          ],
        },
        {
          title:
            "Hotel Shuttle Rules: Included (Gray Line) vs. +$30 Add-On (Airboat Adventures) vs. No Airbnbs",
          detail:
            "No swamp dock is inside New Orleans proper. Gray Line bundles round-trip motorcoach transport from 400 Toulouse St. into its $65 adult ticket. Airboat Adventures charges $30/person extra from Downtown/French Quarter hotels only (no Airbnbs or residential addresses; no return cabs in Lafitte). Cajun Pride also serves Metairie and Kenner hotels.",
          sourceIds: [
            "src-gray-line-nola-swamp",
            "src-airboat-adventures-official",
            "src-cajun-pride-official-faq",
          ],
        },
        {
          title:
            "2026–2028 NPS Barataria Preserve Closure & Relocated Wetland Trace Boardwalk",
          detail:
            "Starting February 2, 2026 for ~2 years, the NPS Barataria Preserve Visitor Center and most trails are closed for reconstruction. Only the Twin Canals parking lot, trail, and canoe launch remain open for $0 free day-use access (with no restrooms). Visitor services and the open Wetland Trace Boardwalk are relocated 6 miles to the Louisiana Wetlands Education Center (4917 City Park Drive, Jean Lafitte; $10 adults, $5 seniors/youth 13–17, under 12 free). Both require a car.",
          sourceIds: ["src-nps-barataria-preserve-2026"],
        },
      ],
      experienceAndVesselTypes: [
        {
          typeName: "Covered Flat-Bottom Swamp Pontoon (22–40 Guests)",
          capacityAndStability:
            "High stability, flat-bottom hull with full roof canopy (Cajun Encounters, Gray Line, Cajun Pride).",
          bestFor:
            "Families with children under 5, seniors, shade seekers, and guests avoiding high-speed hull jarring.",
          limitations:
            "Slower cruising speed; Cajun Encounters' separate 10–12 guest VIP small boat ($99.99+) requires age 13+.",
          sourceIds: [
            "src-cajun-encounters-official",
            "src-gray-line-nola-swamp",
            "src-cajun-pride-official-faq",
          ],
        },
        {
          typeName: "High-Speed Open Marsh Airboat (Small 6–10 Pax or Large 16–30 Pax)",
          capacityAndStability:
            "Aircraft-propeller marsh skimming with stadium seating and hearing protection (Airboat Adventures).",
          bestFor:
            "Thrill-oriented adults and kids age 5+ wanting shallow-marsh speed and small-group (6–10 pax) agility.",
          limitations:
            "Strict minimum age 5+; prohibits pregnancy and neck/back injuries; no roof shade; requires unassisted boarding.",
          sourceIds: ["src-airboat-adventures-official"],
        },
      ],
      departureLocations: [
        {
          islandOrRegion: "Slidell (Honey Island Swamp)",
          harborOrArea: "55345 US-90, Slidell, LA (Cajun Encounters)",
          logisticsNote:
            "~45 min northeast of French Quarter via I-10; budget 4–5 hours total with hotel shuttle pickup.",
          sourceIds: ["src-cajun-encounters-official"],
        },
        {
          islandOrRegion: "Jean Lafitte / Barataria",
          harborOrArea:
            "400 Toulouse St. Coach Departure (Gray Line) & 5145 Fleming Park Rd, Lafitte (Airboat Adventures)",
          logisticsNote:
            "~45 min south of downtown; no return cabs or rideshares from Lafitte docks.",
          sourceIds: [
            "src-gray-line-nola-swamp",
            "src-airboat-adventures-official",
          ],
        },
        {
          islandOrRegion: "Manchac / LaPlace",
          harborOrArea: "110 Frenier Rd, LaPlace, LA (Cajun Pride)",
          logisticsNote:
            "27 miles (~35 min) west via I-10; shuttle serves New Orleans, Metairie, and Kenner hotels.",
          sourceIds: ["src-cajun-pride-official-faq"],
        },
      ],
      commonTradeoffs: [
        {
          tradeoff: "Self-Drive Savings ($39.99) vs. Bundled French Quarter Motorcoach ($65)",
          explanation:
            "Driving your own car unlocks Cajun Encounters' $39.99/person Slidell rate, whereas Gray Line includes round-trip French Quarter motorcoach transport from 400 Toulouse St. in its $65 adult ($32 child 6–12, $0 infant 2–5) fare.",
        },
        {
          tradeoff: "Small Airboat Speed ($89–$119 + $30 Shuttle) vs. Covered Canopy Comfort",
          explanation:
            "Airboat Adventures skims shallow marsh flats at high speed but excludes children under 5, pregnant guests, and anyone with neck/back issues, and has no roof shade.",
        },
      ],
      operationalDependencies: [
        {
          dependency: "Hotel-Only Shuttle Pickup Rules (No Airbnbs)",
          impact:
            "Travelers staying at residential addresses or Airbnbs must walk or rideshare to an approved Downtown/French Quarter hotel pickup stop or 400 Toulouse St.",
          sourceIds: ["src-airboat-adventures-official", "src-gray-line-nola-swamp"],
        },
        {
          dependency: "NPS Barataria Preserve Reconstruction (Feb 2, 2026 – ~2028)",
          impact:
            "Main Barataria Visitor Center and most trails are closed; only Twin Canals ($0, no restrooms) is open on-site while the Wetland Trace Boardwalk is relocated 6 miles to 4917 City Park Drive ($10 adults / $5 seniors).",
          sourceIds: ["src-nps-barataria-preserve-2026"],
        },
      ],
      methodologySteps: [
        "Apply hard safety and age constraints (Airboat Adventures minimum age 5+, pregnancy/neck/back prohibitions, and unassisted boarding requirement).",
        "Enforce transportation reality (eliminate car-only NPS Twin Canals / Wetland Trace when no car is available, and flag hotel-only shuttle rules for Airbnb/residential guests).",
        "Compute full door-to-door window math including 35–50 minute each-way transfers and check-in buffers.",
        "Rank viable options by vessel experience match and family pricing tiers with zero commercial bias (commissionInfluenceOnRanking: 0).",
      ],
    },
    questions: NOLA_SWAMP_QUESTIONS,
    answerSchema: NolaSwampAnswerSchema,
    defaultExampleInput: DEFAULT_NOLA_SWAMP_INPUT,
    comparisonDimensions: NOLA_SWAMP_COMPARISON_DIMENSIONS,
    candidateOptions: NOLA_SWAMP_CANDIDATE_OPTIONS,
    hardConstraintRules: NOLA_SWAMP_HARD_CONSTRAINTS,
    preferenceRules: NOLA_SWAMP_PREFERENCE_RULES,
    evidenceClaims: NOLA_SWAMP_CLAIMS,
    sourceRecords: NOLA_SWAMP_SOURCES,
    computeTimingForOption: computeNolaSwampTiming,
    isExampleScenarioDetector: (rawInput) => {
      const isExample =
        rawInput === undefined ||
        rawInput === null ||
        (typeof rawInput === "object" &&
          Object.keys(rawInput as Record<string, unknown>).length === 0);
      const missingInputFacts: UnknownOrStaleFact[] = isExample
        ? [
            {
              factId: "unk-nola-swamp-example-input",
              optionId: null,
              category: "missing_traveler_input",
              summary:
                "Showing representative baseline scenario (French Quarter hotel shuttle needed, youngest traveler age 8, covered pontoon preference, 4.5-hour half-day window).",
              impactOnDecision:
                "Enter your youngest child's age, pregnancy/neck/back considerations, and whether you have a rental car to personalize eliminations.",
              sourceIds: [
                "src-cajun-encounters-official",
                "src-gray-line-nola-swamp",
                "src-airboat-adventures-official",
              ],
            },
          ]
        : [];
      return {
        isExample,
        banner: isExample
          ? "Example Scenario: French Quarter traveler needing shuttle transport with an 8-year-old child and a 4.5-hour window. Adjust inputs below to test age under 5, pregnancy/neck/back rules, or self-drive options."
          : null,
        missingInputFacts,
      };
    },
    customizeBookingDestinations: (
      option: CandidateOption,
    ): BookingDestination[] => option.bookingDestinations,
    evaluate: (
      rawInput: unknown,
      options?: DecisionEvaluateOptions,
    ): DecisionResult<NolaSwampAnswerInput> =>
      evaluateDecisionEngine(NOLA_SWAMP_DECISION_ENGINE, rawInput, options),
  };
