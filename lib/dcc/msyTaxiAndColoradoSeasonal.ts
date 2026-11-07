/**
 * Step 1 Quick Fixes:
 * 1A. MSY Official Airport Taxi Fare Schedule (`https://flymsy.com/taxis-2/`)
 * 1B. Colorado Seasonal Spotlight (Nov–Apr Ski/Gear/Winter Road vs. May–Oct Summer Mountain & Red Rocks)
 *     where season chooses what is featured by default, both guide sets stay easy to find year-round,
 *     and the traveler's actual trip chooses the offer (GoSno vs. Party at Red Rocks).
 */

export const MSY_OFFICIAL_TAXI_FARE_SOURCE_URL = "https://flymsy.com/taxis-2/";
export const MSY_OFFICIAL_TAXI_ORDINANCE_CITATION =
  "New Orleans City Code Sec. 162-609 & FlyMSY Official Taxi Rates (https://flymsy.com/taxis-2/)";

export interface MsyAirportTaxiFareQuote {
  passengers: number;
  zoneScope: "MSY to CBD or French Quarter (west of Elysian Fields Ave)";
  postedTaxiFareUsd: number;
  postedTaxiFormulaLabel: string;
  perPassengerEffectiveUsd: number;
  singleCabSuitabilityNote: string;
  requiresSingleCabLuggageConfirmation: boolean;
  verifiedPrivateVanQuoteUsd: number | null;
  privateVanComparisonSummary: string;
  officialSourceUrl: string;
  ordinanceCitation: string;
}

/**
 * Computes the official MSY -> CBD / French Quarter (west of Elysian Fields) taxi fare:
 * - 1 or 2 passengers: $36 total
 * - 3 or more passengers: $15 per person ($45 for 3, $60 for 4, $75 for 5 when one suitable cab can carry the group and its luggage)
 * Compares against a verified private van quote when available.
 */
export function computeMsyAirportTaxiFare(params: {
  passengers: number;
  verifiedPrivateVanQuoteUsd?: number | null;
}): MsyAirportTaxiFareQuote {
  const pax = Math.max(1, Math.round(params.passengers || 1));
  const isFlatTwoPaxRule = pax <= 2;
  const postedTaxiFareUsd = isFlatTwoPaxRule ? 36 : pax * 15;
  const perPassengerEffectiveUsd = Number((postedTaxiFareUsd / pax).toFixed(2));

  const postedTaxiFormulaLabel = isFlatTwoPaxRule
    ? `$36 total flat fare for ${pax} ${pax === 1 ? "passenger" : "passengers"} ($36 total for 1–2 passengers)`
    : `$${postedTaxiFareUsd} total for ${pax} passengers ($15 per person for 3 or more passengers)`;

  const singleCabSuitabilityNote =
    pax <= 4
      ? "Standard sedan/crossover cab typically fits 1–4 passengers with standard carry-on/checked bags."
      : pax === 5
        ? "$75 for 5 passengers applies when one suitable minivan/SUV cab at the MSY taxi dispatch line can carry the 5-person group and its luggage; if luggage requires splitting into two cabs, two separate cab fares apply."
        : `For ${pax} passengers ($${postedTaxiFareUsd} at $15/person if carried in one permitted multi-passenger van cab), dispatch capacity depends on van-cab availability and luggage volume; compare with a pre-booked private van quote.`;

  const verifiedVan =
    typeof params.verifiedPrivateVanQuoteUsd === "number" &&
    Number.isFinite(params.verifiedPrivateVanQuoteUsd) &&
    params.verifiedPrivateVanQuoteUsd > 0
      ? params.verifiedPrivateVanQuoteUsd
      : null;

  const privateVanComparisonSummary =
    verifiedVan !== null
      ? `Verified private van quote: $${verifiedVan} total vs. $${postedTaxiFareUsd} posted MSY taxi total (${
          verifiedVan >= postedTaxiFareUsd
            ? `+$${verifiedVan - postedTaxiFareUsd} for guaranteed single-vehicle luggage capacity and pre-staged pickup`
            : `$${postedTaxiFareUsd - verifiedVan} less than posted taxi total`
        }).`
      : "No verified private van quote is loaded for this date; compare the posted MSY taxi rate ($36 for 1–2 pax; $15/person for 3+ pax, or $75 for 5 when one suitable cab can carry the group and its luggage) against a confirmed private van quote when available.";

  return {
    passengers: pax,
    zoneScope: "MSY to CBD or French Quarter (west of Elysian Fields Ave)",
    postedTaxiFareUsd,
    postedTaxiFormulaLabel,
    perPassengerEffectiveUsd,
    singleCabSuitabilityNote,
    requiresSingleCabLuggageConfirmation: pax >= 5,
    verifiedPrivateVanQuoteUsd: verifiedVan,
    privateVanComparisonSummary,
    officialSourceUrl: MSY_OFFICIAL_TAXI_FARE_SOURCE_URL,
    ordinanceCitation: MSY_OFFICIAL_TAXI_ORDINANCE_CITATION,
  };
}

export const MSY_TAXI_REFERENCE_TABLE: ReadonlyArray<MsyAirportTaxiFareQuote> = [
  computeMsyAirportTaxiFare({ passengers: 1 }),
  computeMsyAirportTaxiFare({ passengers: 2 }),
  computeMsyAirportTaxiFare({ passengers: 3 }),
  computeMsyAirportTaxiFare({ passengers: 4 }),
  computeMsyAirportTaxiFare({ passengers: 5 }),
];

export type ColoradoSeasonSpotlightId =
  | "winter_nov_apr"
  | "summer_may_oct";

export type ColoradoTripIntentType =
  | "ski_transfer"
  | "summer_mountain_trip"
  | "red_rocks_event"
  | "unspecified";

export interface ColoradoGuideLinkItem {
  id: string;
  title: string;
  href: string;
  seasonGroup: ColoradoSeasonSpotlightId;
  summary: string;
  badge: string;
}

export const COLORADO_WINTER_GUIDES: ReadonlyArray<ColoradoGuideLinkItem> = [
  {
    id: "co-winter-den-vail-shuttle",
    title: "DEN to Vail & I-70 Ski Transfers & Gear Fit Guide",
    href: "/transportation/colorado/denver-to-vail-shuttle-guide",
    seasonGroup: "winter_nov_apr",
    summary:
      "6-factor comparison of GoSno private SUVs (max 6 pax) & private vans (max 10 pax, subject to 170–190 cm ski-bag fit) vs. shared shuttles and rental cars.",
    badge: "Ski Transfers & Gear Fit",
  },
  {
    id: "co-winter-den-breck-corridor",
    title: "Denver–Breckenridge I-70 Winter Road Planning & Traction Law Guide",
    href: "/routes/denver-breckenridge",
    seasonGroup: "winter_nov_apr",
    summary:
      "CDOT Code 15 Traction Law ($100 fine + $33 surcharge; $500 + $156 surcharge for lane closure), EJMT tunnel metering, and live Dual-Coordinate telemetry.",
    badge: "Winter Road Planning",
  },
  {
    id: "co-winter-transport-hub",
    title: "Colorado I-70 Mountain Transfer Decision Engine",
    href: "/transportation/colorado#denver-to-mountain-transportation",
    seasonGroup: "winter_nov_apr",
    summary:
      "Interactive decision matrix for DEN airport arrivals, ski luggage fit, and revised flight ETAs.",
    badge: "Interactive Planner",
  },
];

export const COLORADO_SUMMER_AND_RED_ROCKS_GUIDES: ReadonlyArray<ColoradoGuideLinkItem> = [
  {
    id: "co-summer-red-rocks-authority",
    title: "Red Rocks Park & Amphitheatre Event & Ride-Home Guide",
    href: "/red-rocks",
    seasonGroup: "summer_may_oct",
    summary:
      "Concert night lot rules, Upper North vs. Jurassic Lot rideshare geofence, and Party at Red Rocks private tailgate & ride or per-seat shuttles.",
    badge: "Red Rocks Events",
  },
  {
    id: "co-summer-red-rocks-shuttle-vs-uber",
    title: "Red Rocks Shuttle vs. Uber & Private Tailgate Comparison",
    href: "/red-rocks-shuttle-vs-uber",
    seasonGroup: "summer_may_oct",
    summary:
      "Why post-encore rideshare pickups route to Jurassic Lot on Hwy 93 and how pre-booked shuttles and private tailgates handle the 30-minute departure window.",
    badge: "Post-Show Egress",
  },
  {
    id: "co-summer-alpine-corridor",
    title: "Summer Mountain Trips: Denver to Breckenridge & Summit County",
    href: "/routes/denver-breckenridge",
    seasonGroup: "summer_may_oct",
    summary:
      "High-elevation acclimatization (9,600 ft), afternoon alpine lightning rules, free Summit Stage transit, and private group transfers.",
    badge: "Summer Mountain Trips",
  },
];

export interface ColoradoSeasonalSpotlightResolution {
  evaluatedMonth: number; // 1–12
  activeSeasonSpotlight: ColoradoSeasonSpotlightId;
  seasonWindowLabel: string;
  featuredHeadline: string;
  featuredSummary: string;
  featuredGuides: ReadonlyArray<ColoradoGuideLinkItem>;
  yearRoundSecondaryGuidesLabel: string;
  yearRoundSecondaryGuides: ReadonlyArray<ColoradoGuideLinkItem>;
  travelerTripResolvedIntent: "mountain_transfer_gosno" | "red_rocks_partyatredrocks";
  selectedOfferReason: string;
  selectedOffer: {
    partnerId: "gosno" | "partyatredrocks";
    partnerName: "GoSno" | "Party at Red Rocks";
    offerHeadline: string;
    offerSummary: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
  };
}

/**
 * Resolves the Colorado Seasonal Spotlight & Traveler-Specific Offer:
 * - November–April (months 11, 12, 1, 2, 3, 4): Features ski transfers, gear fit, and winter road planning.
 * - May–October (months 5, 6, 7, 8, 9, 10): Features summer mountain trips and Red Rocks events.
 * - Both sets of guides remain visible and easy to find year-round.
 * - Uses the season to choose what's featured by default, and the traveler's actual trip
 *   (`tripIntent`, `destination`, `venue`, `date`, `partySize`) to choose the offer:
 *   - GoSno for matching mountain transfers (winter ski or summer mountain transfer)
 *   - Party at Red Rocks for its private tailgate and ride (or concert shuttle)
 */
export function resolveColoradoSeasonalSpotlight(params?: {
  dateOrMonth?: string | number | Date | null;
  tripIntent?: ColoradoTripIntentType | string | null;
  destinationOrVenue?: string | null;
  partySize?: number | null;
  skiBags?: number | null;
}): ColoradoSeasonalSpotlightResolution {
  let month = 11; // default November if none provided
  const rawDate = params?.dateOrMonth;
  if (typeof rawDate === "number" && rawDate >= 1 && rawDate <= 12) {
    month = Math.round(rawDate);
  } else if (typeof rawDate === "string" && rawDate.trim().length > 0) {
    const trimmed = rawDate.trim();
    const isoMatch = /^(\d{4})-(\d{2})/.exec(trimmed);
    if (isoMatch) {
      const m = Number(isoMatch[2]);
      if (m >= 1 && m <= 12) month = m;
    } else {
      const asNum = Number(trimmed);
      if (Number.isFinite(asNum) && asNum >= 1 && asNum <= 12) {
        month = Math.round(asNum);
      }
    }
  } else if (rawDate instanceof Date && !Number.isNaN(rawDate.getTime())) {
    month = rawDate.getUTCMonth() + 1;
  } else {
    month = new Date().getUTCMonth() + 1;
  }

  const isWinterSeason = month >= 11 || month <= 4;
  const activeSeasonSpotlight: ColoradoSeasonSpotlightId = isWinterSeason
    ? "winter_nov_apr"
    : "summer_may_oct";

  const partySize =
    typeof params?.partySize === "number" && params.partySize >= 1
      ? Math.round(params.partySize)
      : 4;
  const dateParam =
    typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim())
      ? rawDate.trim()
      : isWinterSeason
        ? "2026-12-19"
        : "2026-07-18";

  const rawIntent = (params?.tripIntent || "").toLowerCase().trim();
  const rawDest = (params?.destinationOrVenue || "").toLowerCase().trim();
  const hasSkiBags = (params?.skiBags ?? 0) > 0;

  const explicitlyRedRocks =
    rawIntent.includes("red_rocks") ||
    rawIntent.includes("red-rocks") ||
    rawIntent.includes("concert") ||
    rawIntent.includes("tailgate") ||
    rawDest.includes("red rocks") ||
    rawDest.includes("morrison");

  const explicitlyMountainTransfer =
    hasSkiBags ||
    rawIntent.includes("ski") ||
    rawIntent.includes("mountain") ||
    rawIntent.includes("transfer") ||
    rawDest.includes("vail") ||
    rawDest.includes("breck") ||
    rawDest.includes("keystone") ||
    rawDest.includes("copper") ||
    rawDest.includes("beaver creek") ||
    rawDest.includes("winter park") ||
    rawDest.includes("aspen") ||
    rawDest.includes("steamboat");

  let travelerTripResolvedIntent:
    | "mountain_transfer_gosno"
    | "red_rocks_partyatredrocks";
  let selectedOfferReason: string;

  if (explicitlyRedRocks && !explicitlyMountainTransfer) {
    travelerTripResolvedIntent = "red_rocks_partyatredrocks";
    selectedOfferReason =
      "Selected from your actual trip details (Red Rocks / concert / tailgate intent) — even during winter months, Red Rocks event trips route directly to Party at Red Rocks.";
  } else if (explicitlyMountainTransfer) {
    travelerTripResolvedIntent = "mountain_transfer_gosno";
    selectedOfferReason =
      "Selected from your actual trip details (mountain resort destination / ski or group transfer) — routes directly to GoSno private mountain transfers.";
  } else if (isWinterSeason) {
    travelerTripResolvedIntent = "mountain_transfer_gosno";
    selectedOfferReason =
      "Defaulted to GoSno mountain transfers for the November–April winter spotlight (enter a Red Rocks show or mountain destination to customize).";
  } else {
    travelerTripResolvedIntent = "red_rocks_partyatredrocks";
    selectedOfferReason =
      "Defaulted to Party at Red Rocks for the May–October summer event spotlight (select a mountain transfer destination at any time to switch to GoSno).";
  }

  const vehicleClass = partySize > 6 || (partySize >= 5 && hasSkiBags) ? "van" : "suv";
  const destLabel =
    rawDest.includes("breck") ? "Breckenridge" : "Vail";
  const gosnoPath = destLabel === "Breckenridge" ? "breckenridge" : "vail";

  const selectedOffer =
    travelerTripResolvedIntent === "mountain_transfer_gosno"
      ? {
          partnerId: "gosno" as const,
          partnerName: "GoSno" as const,
          offerHeadline: `GoSno 100% Private Mountain Transfer (DEN ↔ ${destLabel})`,
          offerSummary:
            partySize > 10
              ? `For ${partySize} passengers, a single GoSno van caps at 10 passengers — request a multi-vehicle private group quote on GoSno.`
              : `100% private door-to-door ${vehicleClass.toUpperCase()} for ${partySize} passengers (${
                  vehicleClass === "suv"
                    ? "up to 6 passengers in an AWD SUV"
                    : "up to 10 passengers in a private van, subject to luggage and ski-gear fit"
                }) with winter-rated tires and optional 20–30 min grocery stop.`,
          primaryCtaLabel:
            partySize > 10
              ? `Request GoSno ${partySize}-Pax Multi-Vehicle Quote →`
              : `Book GoSno Private ${vehicleClass.toUpperCase()} (${destLabel}) →`,
          primaryCtaHref:
            partySize > 10
              ? `https://gosno.co/request-quote?origin=DEN&destination=${encodeURIComponent(destLabel)}&date=${encodeURIComponent(dateParam)}&passengers=${partySize}&passengerCount=${partySize}&party_size=${partySize}&vehicleType=van&src=dcc-colorado-seasonal`
              : `https://gosno.co/${gosnoPath}?origin=DEN&destination=${encodeURIComponent(destLabel)}&date=${encodeURIComponent(dateParam)}&passengers=${partySize}&passengerCount=${partySize}&vehicleClass=${vehicleClass}&src=dcc-colorado-seasonal`,
          secondaryCtaLabel:
            "Visiting Red Rocks instead? Open Party at Red Rocks Private Tailgate & Ride ↗",
          secondaryCtaHref: `https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private?date=${encodeURIComponent(dateParam)}&guests=${partySize}&src=dcc-colorado-seasonal`,
        }
      : {
          partnerId: "partyatredrocks" as const,
          partnerName: "Party at Red Rocks" as const,
          offerHeadline:
            "Party at Red Rocks — Private Tailgate & Ride ($499 SUV / $599 14-Pax Sprinter) & Concert Shuttles ($65)",
          offerSummary:
            "Dedicated Red Rocks show-night execution: book a private SUV ($499) or 14-passenger Sprinter ($599) for a private Upper/Lower lot tailgate and guaranteed post-encore pickup (bypassing the Jurassic Lot rideshare walk), or a $65/person round-trip shuttle.",
          primaryCtaLabel:
            "Open Party at Red Rocks Private Tailgate & Ride →",
          primaryCtaHref: `https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private?date=${encodeURIComponent(dateParam)}&guests=${partySize}&src=dcc-colorado-seasonal`,
          secondaryCtaLabel:
            "Need an I-70 mountain transfer too? Open GoSno Private Transfers ↗",
          secondaryCtaHref: `https://gosno.co/${gosnoPath}?origin=DEN&destination=${encodeURIComponent(destLabel)}&date=${encodeURIComponent(dateParam)}&passengers=${partySize}&passengerCount=${partySize}&vehicleClass=${vehicleClass}&src=dcc-colorado-seasonal`,
        };

  return {
    evaluatedMonth: month,
    activeSeasonSpotlight,
    seasonWindowLabel: isWinterSeason
      ? "November–April Spotlight: Ski Transfers, Gear Fit & Winter Road Planning"
      : "May–October Spotlight: Summer Mountain Trips & Red Rocks Events",
    featuredHeadline: isWinterSeason
      ? "Featured for November–April: Ski Transfers, Gear Fit & I-70 Winter Road Planning"
      : "Featured for May–October: Summer Mountain Trips & Red Rocks Amphitheatre Events",
    featuredSummary: isWinterSeason
      ? "During Colorado's November–April snow and ski season, DCC spotlights DEN-to-resort ski transfers, 170–190 cm ski-bag vehicle fit, and CDOT Code 15/16 winter road planning — while keeping summer mountain and Red Rocks guides one click away below."
      : "During Colorado's May–October amphitheatre and alpine season, DCC spotlights Red Rocks concert transport, post-encore pickup rules, and summer high-country trips — while keeping winter ski transfer and I-70 traction guides easy to find year-round below.",
    featuredGuides: isWinterSeason
      ? COLORADO_WINTER_GUIDES
      : COLORADO_SUMMER_AND_RED_ROCKS_GUIDES,
    yearRoundSecondaryGuidesLabel: isWinterSeason
      ? "Year-Round Access: May–October Summer Mountain Trips & Red Rocks Event Guides"
      : "Year-Round Access: November–April Ski Transfers, Gear Fit & Winter Road Guides",
    yearRoundSecondaryGuides: isWinterSeason
      ? COLORADO_SUMMER_AND_RED_ROCKS_GUIDES
      : COLORADO_WINTER_GUIDES,
    travelerTripResolvedIntent,
    selectedOfferReason,
    selectedOffer,
  };
}
