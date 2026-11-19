import {
  LFSE_CANONICAL_LINKS,
  VERIFIED_OPERATORS,
  VERIFIED_TARIFF_DATE_LONG,
  type OperatorKey,
} from "./verifiedOperatorPricing";

export const UNCRUISE_GUIDE_PATH = "/guides/uncruise-juneau-helicopter-tours" as const;
export const UNCRUISE_GUIDE_CANONICAL_URL =
  `https://juneauflightdeck.com${UNCRUISE_GUIDE_PATH}` as const;

export const UNCRUISE_PRIMARY_RETRIEVAL_DATE_ISO = "2026-11-19" as const;
export const UNCRUISE_PRIMARY_RETRIEVAL_DATE_LONG = "November 19, 2026" as const;

/**
 * Release flags:
 * - Primary public sources (UnCruise Terms & Prepare-for-Your-Cruise pages, TEMSCO, NorthStar, and Coastal)
 *   were reviewed on 2026-11-18 and 2026-11-19 and approved for Production release with explicit channel callouts.
 * - Unresolved channel-specific items (qualifying hotel lists, exact hotel pickup offsets, and Viator 6251SHOREXICEWALK
 *   pickup/cancellation specifics) remain unattested and visibly marked "Confirm before booking".
 */
export const UNCRUISE_GUIDE_RELEASE_APPROVED = true as const;
export const UNCRUISE_GUIDE_CHANNEL_HOLDS_FULLY_ATTESTED = false as const;

export interface HeldClaimNotice {
  holdId: string;
  scope: string;
  reason: string;
  travelerActionRequired: string;
}

export interface UncruiseOperatorChannelCardSpec {
  cardId: "temsco-direct" | "northstar-direct" | "coastal-viator-6251shorexicewalk";
  operatorKey: Extract<OperatorKey, "temsco" | "northstar" | "coastal">;
  operatorName: string;
  operatingBaseAddress: string;
  bookingSellerLabel: string;
  bookingChannelType: "direct_operator" | "viator_partner";
  commissionDisclosure: string;
  tourTitle: string;
  secondaryOptionNote?: string;
  publishedPriceSummary: string;
  priceChannelQualification: string;
  totalDurationSummary: string;
  selectedTimeMeaning: string;
  pickupVerifiedSummary: string;
  baggageAndGearSummary: string;
  participationRestrictions: string;
  customerCancellationSummary: string;
  operatorWeatherCancellationSummary: string;
  heldClaims: HeldClaimNotice[];
  imageSrc: string;
  imageAlt: string;
  photoCredit: string;
  lfseOperatorHref: string;
  officialOperatorSourceUrl: string;
  handoffConfig: {
    provider: "viator" | "direct_operator";
    providerAccount: string;
    productCode: string;
    destinationUrl: string;
    campaign: string;
    ctaLabel:
      | "Check availability with TEMSCO"
      | "Check availability with NorthStar"
      | "Check availability on Viator";
  };
}

export const UNCRUISE_FARE_COMPARISON = {
  includedInUncruiseFare: [
    {
      item: "Embarkation & disembarkation day group transfers + baggage handling",
      detail:
        "Roundtrip group transfers and baggage handling between Juneau International Airport (JNU), UnCruise’s 76 Egan Drive hospitality area, and the vessel on official embarkation and disembarkation days (no paper transfer voucher needed—names appear on the manifest).",
      sourceLabel: "UnCruise Terms & Conditions + Prepare for Your Cruise: Alaska",
      sourceUrl: "https://uncruise.com/pages/prepare-for-your-cruise-alaska",
    },
    {
      item: "From-the-vessel wilderness excursions & gear",
      detail:
        "Guided hiking, tandem sea kayaking, paddleboarding, beachcombing, and motorized inflatable skiff explorations with crew instruction and equipment.",
      sourceLabel: "UnCruise Prepare for Your Cruise: Alaska",
      sourceUrl: "https://uncruise.com/pages/prepare-for-your-cruise-alaska",
    },
    {
      item: "Park permits, onboard meals & hosted beverages",
      detail:
        "Glacier Bay National Park / Tongass National Forest entry fees, all onboard meals, and onboard non-alcoholic and standard alcoholic beverages (excluding super-premium wines/spirits).",
      sourceLabel: "UnCruise Terms & Conditions",
      sourceUrl: "https://uncruise.com/pages/terms-conditions",
    },
  ],
  purchasedSeparately: [
    {
      item: "Juneau FAA Part 135 helicopter glacier landings, treks & dog sledding",
      detail:
        "UnCruise vessels do not carry helicopters, and UnCruise Terms & Conditions explicitly exclude “Optional pre or post cruise excursions and land tours” from the cruise fare.",
      sourceLabel: "UnCruise Terms & Conditions (Not Included in Cruise Fare)",
      sourceUrl: "https://uncruise.com/pages/terms-conditions",
    },
    {
      item: "Pre- or post-cruise Juneau hotel nights & off-turnaround taxis",
      detail:
        "Hotel nights before embarkation or after disembarkation—and local transportation on non-embarkation/disembarkation days—are separate unless booked as an UnCruise hotel/land add-on package (third-party land segments remain subject to each provider’s own fees and terms).",
      sourceLabel: "UnCruise Terms & Conditions",
      sourceUrl: "https://uncruise.com/pages/terms-conditions",
    },
    {
      item: "Airfare, travel protection & crew gratuities",
      detail:
        "Commercial flights to/from JNU, optional travel insurance, and discretionary onboard crew gratuities (UnCruise guideline: $315/week or $45/day per guest).",
      sourceLabel: "UnCruise Prepare for Your Cruise: Alaska",
      sourceUrl: "https://uncruise.com/pages/prepare-for-your-cruise-alaska",
    },
  ],
} as const;

export const UNCRUISE_JUNEAU_TURNAROUND_FACTS = {
  hospitalityAddress: "76 Egan Drive, Downtown Juneau (next to the UnCruise Adventures dock)",
  hospitalityHours: "9:00 a.m. to 4:30 p.m.",
  embarkationFlightCutoff: "Arrive at JNU no later than 4:00 p.m. (3:00 p.m. if sailing on Safari Quest)",
  embarkationLuggageCutoff:
    "Check luggage with an UnCruise representative no later than 3:00 p.m.",
  embarkationHospitalityCutoff:
    "Return to hospitality at 76 Egan Drive no later than 4:30 p.m. (3:00 p.m. if sailing on Safari Quest)",
  disembarkationFlightCutoff: "Schedule JNU return flights no earlier than 11:30 a.m.",
  finalDocsTimingNote:
    "UnCruise emails final e-documents approximately 45 days prior to departure (once paid in full and Guest Information Forms are submitted).",
  downtownProximityNote:
    "76 Egan Drive is in Downtown Juneau roughly 0.3–0.4 miles along the waterfront from the Goldbelt Tram Building (490 S. Franklin St.) and ~8.5–9 miles from Juneau International Airport (JNU) and the airport heliports.",
} as const;

export const UNCRUISE_OPERATOR_CHANNEL_CARDS: readonly UncruiseOperatorChannelCardSpec[] = [
  {
    cardId: "temsco-direct",
    operatorKey: "temsco",
    operatorName: VERIFIED_OPERATORS.temsco.name,
    operatingBaseAddress: "1650 Maplesden Way, Juneau, AK 99801 (adjacent to JNU Airport)",
    bookingSellerLabel: "Direct Operator Checkout — TEMSCO Helicopters, Inc.",
    bookingChannelType: "direct_operator",
    commissionDisclosure:
      "Direct operator link: Juneau Flight Deck records outbound seller clicks for demand measurement and assumes $0 affiliate commission on direct TEMSCO bookings.",
    tourTitle: "Mendenhall Glacier & Guided Walk by Helicopter",
    secondaryOptionNote:
      "Seasonal Mendenhall Glacier Dog Sledding (2h 45m, $759/person as of Nov 18, 2026) operates during the May–August snowpack window.",
    publishedPriceSummary:
      "$449 per person (ages 2+), as of November 18, 2026 · Under 24 months free as lap child · +$150 weight surcharge at 250+ lbs clothed · + CBJ sales tax & fees",
    priceChannelQualification:
      "Direct tariff verified on temscoair.com (Nov 18–19, 2026); confirm live calendar availability and final taxes on TEMSCO’s checkout page.",
    totalDurationSummary:
      "2 hours 15 minutes total (includes downtown/select-hotel shuttle transfer, safety briefing, ~30 min helicopter flight, and ~20–25 min guided Mendenhall Glacier walk; flight/ice minutes vary with weather and glacier conditions).",
    selectedTimeMeaning:
      "Confirmed tour start time is the prompt departure time from downtown; arrive at the meeting point at least 15 minutes prior to the confirmed start time.",
    pickupVerifiedSummary:
      "TEMSCO provides ground transportation to its 1650 Maplesden Way heliport from the bottom of the Goldbelt / Mount Roberts Tram (490 S. Franklin St., ~0.3 mi from UnCruise’s 76 Egan Dr check-in) and from a select few Juneau hotels.",
    baggageAndGearSummary:
      "No bags or cases of any kind are permitted on the aircraft/tour (also prohibited: iPads/tablets, tripods, selfie sticks, canes/walking sticks, drones, water bottles/liquids). Lockers are provided at TEMSCO’s base for small personal items—not full cruise luggage. Glacier overboots are provided.",
    participationRestrictions:
      "Moderate activity: ~100 ft walk at base/glacier and ~18-inch helicopter steps that guests must navigate independently (staff lend a hand but cannot lift guests). Service animals are not permitted on AStar/H130 tour aircraft per Air Carrier Access Act exit-row rules. Groups may be split across aircraft for weight/balance but reunite on the glacier.",
    customerCancellationSummary:
      "Direct voluntary cancellation: 100% refund when canceled 48+ hours prior to scheduled departure; non-refundable within 48 hours (confirm final checkout terms before payment).",
    operatorWeatherCancellationSummary:
      "100% full refund if TEMSCO cancels due to weather. TEMSCO notes weather cancellation decisions are usually made within 1 hour of departure because Juneau conditions shift rapidly.",
    heldClaims: [
      {
        holdId: "HELD-TEMSCO-HOTEL-LIST",
        scope: "Exact list of eligible Juneau pickup hotels & direct heliport self-check-in rules",
        reason:
          "TEMSCO’s public tour page states “bottom of the Goldbelt/Mount Roberts Tram and select few hotels” without publishing the qualifying hotel list or self-drive check-in timing online.",
        travelerActionRequired:
          "Confirm timing & pickup before booking: if staying at an Airport/Valley or Downtown hotel, confirm with TEMSCO Juneau (907-789-9501) whether your specific hotel qualifies for van pickup or plan to meet 15 minutes early at Goldbelt Tram (490 S. Franklin St.) with suitcases stored.",
      },
    ],
    imageSrc: "/images/tours/temsco-mendenhall-glacier-walk.jpg",
    imageAlt: "Helicopter landed on Mendenhall Glacier blue ice near Juneau, Alaska",
    photoCredit: "Photo: Robert Raines / Wikimedia Commons (CC BY-SA 2.0)",
    lfseOperatorHref: LFSE_CANONICAL_LINKS.temsco,
    officialOperatorSourceUrl:
      "https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/",
    handoffConfig: {
      provider: "direct_operator",
      providerAccount: "temsco-juneau",
      productCode: "temsco-mendenhall-glacier-walk",
      destinationUrl: "https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/",
      campaign: "jfd-uncruise-guide-temsco-direct",
      ctaLabel: "Check availability with TEMSCO",
    },
  },
  {
    cardId: "northstar-direct",
    operatorKey: "northstar",
    operatorName: VERIFIED_OPERATORS.northstar.name,
    operatingBaseAddress:
      "Airport Base (Walkabout & Trek): 1890 Renshaw Way, Juneau, AK 99801 · Douglas Base (Dogsled & Airboat): 6910 N. Douglas Hwy",
    bookingSellerLabel: "Direct Operator Checkout — NorthStar Helicopters / Trekking",
    bookingChannelType: "direct_operator",
    commissionDisclosure:
      "Direct operator link: Juneau Flight Deck records outbound seller clicks for demand measurement and assumes $0 affiliate commission on direct NorthStar bookings.",
    tourTitle: "Helicopter Glacier Trek (4h 15m) & Glacier Walkabout (3h 15m)",
    secondaryOptionNote:
      "Walkabout ($539, ages 8+, 3.25 hrs total, ~1 hr on ice) and Glacier Trek ($599, ages 12+, 4.25 hrs total, ~2 hrs on ice) both dispatch from NorthStar’s Airport Base next to JNU.",
    publishedPriceSummary:
      "$599 per person Glacier Trek (ages 12+, 4.25 hrs) · $539 per person Glacier Walkabout (ages 8+, 3.25 hrs), as of November 18, 2026 · +$250 weight surcharge at 250+ lbs clothed · + CBJ sales tax & fees",
    priceChannelQualification:
      "Direct tariffs verified on northstartrekking.com (Nov 18–19, 2026); confirm live calendar availability and final taxes on NorthStar’s checkout page.",
    totalDurationSummary:
      "4 hours 15 minutes total for Glacier Trek (~30 min flight + ~2 hrs guided glacier trekking) or 3 hours 15 minutes total for Walkabout (~1 hr on ice), including van transfers and outfitting.",
    selectedTimeMeaning:
      "Total published duration includes Juneau van pickup/drop-off and full gear outfitting at NorthStar’s Airport Base; confirm your exact pickup clock time on your NorthStar reservation confirmation.",
    pickupVerifiedSummary:
      "NorthStar’s official FAQ states it picks up and drops off in most locations in Juneau (excluding the Mendenhall Glacier Recreation Area), while cruise-ship day guests booking direct meet at the Goldbelt Tramway downtown.",
    baggageAndGearSummary:
      "Bags, purses, selfie sticks, and drones are prohibited on the helicopter; items must fit in pockets or NorthStar’s provided hip pack, with safe storage lockers at the Airport Base for small personal belongings (store cruise suitcases at your hotel or UnCruise 76 Egan Dr check-in). Mountaineering boots, crampons, rain jacket/pants, gloves, helmet, and harness are provided.",
    participationRestrictions:
      "Ages 12+ for Glacier Trek (2 hrs walking on uneven/moderately steep ice) or ages 8+ for Walkabout (1 hr). Employees assist but cannot lift guests into or out of the A-Star 350 helicopter (up to 6 passengers; groups may be split in flight and reunite on the glacier).",
    customerCancellationSummary:
      "Direct voluntary cancellation (verified northstartrekking.com/faqs/, Nov 19, 2026): canceling more than 24 hours before departure receives a refund minus a 10% cancellation fee; canceling less than 24 hours before departure is non-refundable.",
    operatorWeatherCancellationSummary:
      "If canceled by NorthStar due to weather, guests are offered rescheduling (subject to open space and schedule) or a 100% full refund.",
    heldClaims: [
      {
        holdId: "HELD-NORTHSTAR-PICKUP-CLOCK",
        scope: "Exact hotel pickup lead-time offset & cruise-turnaround luggage handling",
        reason:
          "While NorthStar confirms pickup across most Juneau locations (excluding Mendenhall Glacier Recreation Area), exact pickup minute offsets vary by hotel address and base lockers fit personal items rather than full suitcases.",
        travelerActionRequired:
          "Confirm timing & pickup address before booking: verify your exact hotel pickup time with NorthStar Airport Base (907-790-4530) and keep full cruise luggage at your hotel front desk or UnCruise’s 76 Egan Dr check-in.",
      },
    ],
    imageSrc: "/images/tours/northstar-glacier-ice-trek.jpg",
    imageAlt:
      "Guided glacier hiker with crampons and trekking poles exploring sculpted blue glacier ice in Alaska",
    photoCredit: "Photo: National Park Service, Alaska Region (Public Domain)",
    lfseOperatorHref: LFSE_CANONICAL_LINKS.northstar,
    officialOperatorSourceUrl:
      "https://northstartrekking.com/adventures/helicopter-glacier-trek/",
    handoffConfig: {
      provider: "direct_operator",
      providerAccount: "northstar-juneau",
      productCode: "northstar-glacier-ice-trek",
      destinationUrl: "https://northstartrekking.com/adventures/helicopter-glacier-trek/",
      campaign: "jfd-uncruise-guide-northstar-direct",
      ctaLabel: "Check availability with NorthStar",
    },
  },
  {
    cardId: "coastal-viator-6251shorexicewalk",
    operatorKey: "coastal",
    operatorName: VERIFIED_OPERATORS.coastal.name,
    operatingBaseAddress: "8995 Yandukin Drive, Juneau, AK 99801 (Juneau Airport area)",
    bookingSellerLabel:
      "Partner Checkout via Viator (Listing 6251SHOREXICEWALK · Operated by Coastal Helicopters)",
    bookingChannelType: "viator_partner",
    commissionDisclosure:
      "Partner affiliate link: bookings completed on Viator may earn Juneau Flight Deck a partner commission at no extra cost to you. Outbound clicks are tracked separately from confirmed bookings.",
    tourTitle: "Juneau Helicopter Tour & Guided Icefield Walk (Herbert Glacier)",
    publishedPriceSummary:
      "Coastal direct reference tariff as of November 18, 2026: $459 Standard (1–259 lbs), $609 Standard Plus (260–299 lbs), $918 Premium (300+ lbs, 2 seats) + tax/fees — check Viator 6251SHOREXICEWALK for live Viator retail pricing.",
    priceChannelQualification:
      "Operated by Coastal Helicopters; sold through Viator under Viator’s checkout pricing and booking terms.",
    totalDurationSummary:
      "~2 hours 35 minutes (155 minutes) total door-to-door footprint, including ground transfer and ~60–65 minutes combined helicopter flightseeing and Herbert Glacier landing.",
    selectedTimeMeaning:
      "Channel-specific rule held: on Coastal’s direct website, selected time is the pickup time at Goldbelt Tram (490 S. Franklin St.), but Viator’s meeting/pickup selector must be checked directly on Viator 6251SHOREXICEWALK before payment.",
    pickupVerifiedSummary:
      "Operated from Coastal’s 8995 Yandukin Dr base near JNU. Do not assume Coastal’s direct-website pickup terms or hotel collection apply identically on Viator—verify the exact pickup/meeting point offered inside Viator 6251SHOREXICEWALK.",
    baggageAndGearSummary:
      "FAA Part 135 weight-balance rules require accurate clothed passenger weights; drones, selfie sticks, phone stabilizers, camera extensions, and luggage are prohibited on tour.",
    participationRestrictions:
      "All ages, but NO lap children—every passenger regardless of age requires a paid seat. Guests must enter and exit the aircraft independently (or obtain prior Coastal Reservations confirmation). No service animals. 4-passenger minimum flight load applies.",
    customerCancellationSummary:
      "Held pending full Viator channel attestation: voluntary cancellation deadlines on Viator 6251SHOREXICEWALK differ from Coastal’s direct 7-day policy—verify the exact free-cancellation cutoff displayed on Viator’s checkout page for your date.",
    operatorWeatherCancellationSummary:
      "100% refund if the operator cancels the flight due to weather or minimum passenger load not being met. Note: temporary weather delays on the glacier can occur, and Viator’s Worry-Free Shore Excursion (§20) next-port guarantee is written for docked cruise-ship calls—do not rely on it for hotel checkouts, UnCruise embarkation cutoffs, or flights home.",
    heldClaims: [
      {
        holdId: "HELD-COASTAL-VIATOR-PICKUP",
        scope: "Viator 6251SHOREXICEWALK hotel vs. downtown pickup equivalence",
        reason:
          "Prior Viator listing observation was partial and not human-attested as equivalent to Coastal’s direct 490 S. Franklin St. rule.",
        travelerActionRequired:
          "Confirm pickup on Viator before paying: inspect the meeting/pickup selector inside Viator 6251SHOREXICEWALK to verify whether your hotel or downtown meeting point is supported for non-cruise-ship guests.",
      },
      {
        holdId: "HELD-COASTAL-VIATOR-CANCELLATION",
        scope: "Viator 6251SHOREXICEWALK voluntary customer cancellation window",
        reason:
          "Coastal’s direct FAQ enforces a 7-day full / 4–6-day 50% / <3-day 0% schedule, whereas prior Viator captures showed shorter partner cutoffs (24h vs. 3-day notes awaiting human source check). Coastal Direct cancellation promises are never applied to Viator.",
        travelerActionRequired:
          "Read the exact cancellation timestamp displayed on Viator’s checkout screen for your chosen date and option before completing payment.",
      },
      {
        holdId: "HELD-COASTAL-GLACIER-MINUTES",
        scope: "Exact minutes on Herbert Glacier ice (30–35 min vs. 35–40 min)",
        reason:
          "Coastal’s live product page states 30–35 minutes in the introduction and 35–40 minutes in Quick Details/body.",
        travelerActionRequired:
          "Plan around the full ~2 hr 35 min door-to-door footprint (~60–65 min combined air + glacier time) rather than an exact ice-minute figure.",
      },
    ],
    imageSrc: "/images/tours/coastal-icefield-landing.jpg",
    imageAlt:
      "Herbert Glacier blue icefall and Coast Mountains in the Juneau Icefield, Alaska",
    photoCredit: "Photo: Gillfoto / Wikimedia Commons (CC BY-SA 4.0)",
    lfseOperatorHref: LFSE_CANONICAL_LINKS.coastal,
    officialOperatorSourceUrl: "https://coastalhelicopters.com/tours/icefield-excursion/",
    handoffConfig: {
      provider: "viator",
      providerAccount: "P00058396",
      productCode: "6251SHOREXICEWALK",
      destinationUrl:
        "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK?pid=P00058396&mcid=42383&medium=api",
      campaign: "jfd-uncruise-guide-coastal-viator",
      ctaLabel: "Check availability on Viator",
    },
  },
] as const;

export interface ClaimSourceLedgerEntry {
  claimId: string;
  subject: string;
  channelScope: string;
  claimSummary: string;
  primarySourceUrl: string;
  retrievedDate: string;
  verificationState: "automated_primary_source_checked" | "held_pending_channel_attestation";
  humanAttestationNote: string;
}

export const UNCRUISE_CLAIM_SOURCE_LEDGER: readonly ClaimSourceLedgerEntry[] = [
  {
    claimId: "UC-FARE-01",
    subject: "UnCruise Adventures",
    channelScope: "UnCruise Cruise Fare (Terms & Conditions)",
    claimSummary:
      "Fare includes embark/disembark day group airport/hospitality/vessel transfers & baggage handling, from-the-vessel guided activities/gear (kayaks, paddleboards, skiffs, hikes), park entry fees, meals, and standard beverages; excludes optional pre/post-cruise excursions and land tours.",
    primarySourceUrl: "https://uncruise.com/pages/terms-conditions",
    retrievedDate: UNCRUISE_PRIMARY_RETRIEVAL_DATE_ISO,
    verificationState: "automated_primary_source_checked",
    humanAttestationNote: "Reviewed against published UnCruise Terms & Conditions on 2026-11-19.",
  },
  {
    claimId: "UC-JNU-02",
    subject: "UnCruise Adventures",
    channelScope: "UnCruise Juneau Check-In, Luggage & Flight Cutoffs",
    claimSummary:
      "Juneau check-in, embarkation, and disembarkation at 76 Egan Drive (hours 9:00 a.m.–4:30 p.m.); embarkation JNU flight arrival by 4:00 p.m. (3:00 p.m. Safari Quest); luggage checked in by 3:00 p.m.; back in hospitality by 4:30 p.m. (3:00 p.m. Safari Quest); disembarkation JNU return flights no earlier than 11:30 a.m.",
    primarySourceUrl: "https://uncruise.com/pages/prepare-for-your-cruise-alaska",
    retrievedDate: UNCRUISE_PRIMARY_RETRIEVAL_DATE_ISO,
    verificationState: "automated_primary_source_checked",
    humanAttestationNote:
      "Reviewed against Prepare for Your Cruise: Alaska on 2026-11-19; travelers must also check final UnCruise e-documents (~45 days pre-sailing) for vessel-specific updates.",
  },
  {
    claimId: "TEMSCO-DIR-01",
    subject: "TEMSCO Helicopters",
    channelScope: "TEMSCO Direct (temscoair.com)",
    claimSummary:
      "Mendenhall Glacier & Guided Walk: 2h 15m total, $449/person (ages 2+, under 2 free lap child, +$150 at 250+ lbs clothed as of Nov 18, 2026); arrive 15 min before confirmed downtown departure time; pickup at Goldbelt Tram and select few hotels; no bags/cases on tour (base lockers for small items); 48h+ direct cancel / 100% weather refund (decisions typically within 1 hr of flight).",
    primarySourceUrl: "https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/",
    retrievedDate: UNCRUISE_PRIMARY_RETRIEVAL_DATE_ISO,
    verificationState: "automated_primary_source_checked",
    humanAttestationNote:
      "Specific hotel list held (HELD-TEMSCO-HOTEL-LIST); confirm qualifying hotel or 490 S. Franklin pickup with TEMSCO.",
  },
  {
    claimId: "NORTHSTAR-DIR-01",
    subject: "NorthStar Trekking",
    channelScope: "NorthStar Direct (northstartrekking.com)",
    claimSummary:
      "Glacier Trek (4.25 hrs, ages 12+, $599) & Walkabout (3.25 hrs, ages 8+, $539) as of Nov 18, 2026 (+$250 at 250+ lbs clothed); van pickup/drop-off in most Juneau locations excluding Mendenhall Glacier Recreation Area (cruise-ship direct guests at Goldbelt Tramway); no bags/purses on aircraft (base lockers + hip pack); >24h cancel minus 10% fee (<24h non-refundable); weather cancel reschedule or full refund.",
    primarySourceUrl: "https://northstartrekking.com/faqs/",
    retrievedDate: UNCRUISE_PRIMARY_RETRIEVAL_DATE_ISO,
    verificationState: "automated_primary_source_checked",
    humanAttestationNote:
      "Exact hotel pickup minute offset held (HELD-NORTHSTAR-PICKUP-CLOCK); confirm on reservation.",
  },
  {
    claimId: "COASTAL-VIA-01",
    subject: "Coastal Helicopters via Viator (6251SHOREXICEWALK)",
    channelScope: "Viator Partner Channel (separated from Coastal Direct)",
    claimSummary:
      "Operated by Coastal Helicopters (~2h 35m total footprint, no lap children, clothed weight-balance tiers, 100% operator weather refund). Viator-specific hotel/meeting-point options, Viator voluntary cancellation window, and exact 30–35 vs. 35–40 min ice duration are held individually rather than borrowing Coastal Direct’s 490 S. Franklin / 7-day rules.",
    primarySourceUrl: "https://coastalhelicopters.com/tours/icefield-excursion/",
    retrievedDate: UNCRUISE_PRIMARY_RETRIEVAL_DATE_ISO,
    verificationState: "held_pending_channel_attestation",
    humanAttestationNote:
      "Holds HELD-COASTAL-VIATOR-PICKUP, HELD-COASTAL-VIATOR-CANCELLATION, and HELD-COASTAL-GLACIER-MINUTES retained from Oct 21, 2026 audit.",
  },
] as const;

export const UNCRUISE_GUIDE_FAQS = [
  {
    question: "Does UnCruise include helicopter glacier tours in Juneau?",
    answer:
      "No. UnCruise’s Alaska cruise fare covers from-the-vessel guided activities and equipment (kayaking, paddleboarding, inflatable skiff explorations, guided hikes), park entry fees, meals, standard bar beverages, and embarkation/disembarkation day group airport-to-vessel transfers, while explicitly excluding optional pre- or post-cruise excursions and land tours such as commercial FAA Part 135 helicopter flights.",
  },
  {
    question: "Is it simpler to book a Juneau helicopter tour on a separate land day or on UnCruise embarkation day?",
    answer:
      "A dedicated pre- or post-cruise land day in Juneau avoids competing with UnCruise’s 3:00 p.m. luggage check-in and 4:30 p.m. hospitality cutoff at 76 Egan Drive (3:00 p.m. on Safari Quest) or your 11:30 a.m.+ disembarkation flight cutoff at JNU. While an extra land day does not guarantee flyable weather or open replacement seats, it removes same-day vessel and airline cutoff pressure.",
  },
  {
    question: "Can I bring my cruise suitcases on a Juneau helicopter tour?",
    answer:
      "No. TEMSCO, NorthStar, and Coastal all prohibit suitcases and bags on the aircraft for FAA Part 135 weight, balance, and cabin-safety reasons (base lockers hold small personal items only). Store full luggage with your Juneau hotel bell desk, or—if flying on embarkation day—confirm check-in of your bags with UnCruise at 76 Egan Drive between 9:00 a.m. and 3:00 p.m.",
  },
  {
    question: "Why do booking terms differ between Viator and direct operator websites?",
    answer:
      "Each booking channel governs its own voluntary cancellation deadline, checkout price, and pickup selector. For example, Coastal Helicopters’ direct website specifies 7-day voluntary cancellation and pickup at 490 S. Franklin St., whereas Viator listing 6251SHOREXICEWALK is governed by the pickup and cancellation terms displayed on Viator at checkout. Always verify the exact channel you book through.",
  },
] as const;

export function getUncruiseGuideFreshnessLabel(): string {
  return `Operator direct tariffs verified ${VERIFIED_TARIFF_DATE_LONG}; UnCruise & operator public policies reviewed ${UNCRUISE_PRIMARY_RETRIEVAL_DATE_LONG}. Channel-specific hotel pickup and Viator checkout terms remain marked “Confirm before booking.”`;
}
