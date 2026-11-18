/**
 * Single source of truth for primary-source helicopter operator tariffs,
 * operator identity metadata, LFSE canonical links, and the verbatim 2-hour
 * return-buffer planning standard.
 *
 * Verified directly against official operator websites on November 18, 2026 (2026-11-18).
 */

export const VERIFIED_TARIFF_DATE_ISO = "2026-11-18" as const;
export const VERIFIED_TARIFF_DATE_LONG = "November 18, 2026" as const;
export const VERIFIED_TARIFF_DATE_SHORT = "Nov 18, 2026" as const;
export const VERIFIED_AS_OF_LONG = "as of November 18, 2026" as const;
export const VERIFIED_AS_OF_SHORT = "as of Nov 18, 2026" as const;

export const UNVERIFIED_CRUISE_PORTAL_PRICE_LABEL =
  "Check current cruise-line price in your sailing portal" as const;

export const UNVERIFIED_OPERATOR_PRICE_LABEL =
  "Check current operator price" as const;

export const UNVERIFIED_PARTNER_PRICE_LABEL = UNVERIFIED_OPERATOR_PRICE_LABEL;

/**
 * Mandatory verbatim network planning standard across Juneau Flight Deck.
 */
export const VERBATIM_TWO_HOUR_BUFFER_RULE =
  "Cruise Promenade and the DCC network recommend planning for tours that return at least two hours before all-aboard." as const;

export const TWO_HOUR_BUFFER_CLARIFICATION =
  "This two-hour buffer is an independent planning standard—not an operator guarantee or a cruise-line rule. Operator check-in deadlines, voluntary cancellation cutoffs, and your ship's confirmed all-aboard time remain distinct." as const;

export type OperatorKey =
  | "temsco"
  | "coastal"
  | "northstar"
  | "wings"
  | "juneau-tours"
  | "taquan";

export interface VerifiedOperatorIdentity {
  key: OperatorKey;
  name: string;
  shortName: string;
  monogram: "TH" | "CH" | "NT" | "WA" | "JT" | "TA";
  officialWebsite: string;
  lfseProfileUrl: string;
  faaCertificateNote: string;
}

export const VERIFIED_OPERATORS: Record<OperatorKey, VerifiedOperatorIdentity> = {
  temsco: {
    key: "temsco",
    name: "TEMSCO Helicopters",
    shortName: "TEMSCO",
    monogram: "TH",
    officialWebsite: "https://temscoair.com/",
    lfseProfileUrl: "https://www.lastfrontiershoreexcursions.com/operators/temsco-helicopters",
    faaCertificateNote: "FAA Part 135 commercial helicopter operator (Juneau & Skagway)",
  },
  coastal: {
    key: "coastal",
    name: "Coastal Helicopters",
    shortName: "Coastal",
    monogram: "CH",
    officialWebsite: "https://coastalhelicopters.com/",
    lfseProfileUrl: "https://www.lastfrontiershoreexcursions.com/operators/coastal-helicopters",
    faaCertificateNote: "FAA Part 135 commercial helicopter operator (Juneau)",
  },
  northstar: {
    key: "northstar",
    name: "NorthStar Trekking",
    shortName: "NorthStar",
    monogram: "NT",
    officialWebsite: "https://northstartrekking.com/",
    lfseProfileUrl: "https://www.lastfrontiershoreexcursions.com/operators/northstar-trekking",
    faaCertificateNote: "FAA Part 135 commercial helicopter & glacier trekking operator (Juneau)",
  },
  wings: {
    key: "wings",
    name: "Wings Airways",
    shortName: "Wings Airways",
    monogram: "WA",
    officialWebsite: "https://wingsairways.com/",
    lfseProfileUrl: "https://www.lastfrontiershoreexcursions.com/operators/wings-airways",
    faaCertificateNote: "FAA Part 135 commercial floatplane operator (Downtown Juneau harbor)",
  },
  "juneau-tours": {
    key: "juneau-tours",
    name: "Juneau Tours & Whale Watch",
    shortName: "Juneau Tours",
    monogram: "JT",
    officialWebsite: "https://www.juneautours.com/",
    lfseProfileUrl: "https://www.lastfrontiershoreexcursions.com/operators/juneau-tours-and-whale-watch",
    faaCertificateNote: "Auke Bay marine whale-watching & glacier shuttle operator (Juneau)",
  },
  taquan: {
    key: "taquan",
    name: "Taquan Air",
    shortName: "Taquan Air",
    monogram: "TA",
    officialWebsite: "https://taquanair.com/",
    lfseProfileUrl: "https://www.lastfrontiershoreexcursions.com/operators/taquan-air",
    faaCertificateNote: "FAA Part 135 commercial floatplane operator (Ketchikan / Misty Fjords)",
  },
};

export const LFSE_CANONICAL_LINKS = {
  juneauPort: "https://www.lastfrontiershoreexcursions.com/ports/juneau",
  juneauHelicopterTours:
    "https://www.lastfrontiershoreexcursions.com/ports/juneau/helicopter-glacier-tours",
  juneauHelicopterCategory:
    "https://www.lastfrontiershoreexcursions.com/ports/juneau/helicopter-glacier-tours",
  juneauWhaleWatching:
    "https://www.lastfrontiershoreexcursions.com/ports/juneau/whale-watching",
  juneauWhaleCategory:
    "https://www.lastfrontiershoreexcursions.com/ports/juneau/whale-watching",
  juneauWhaleFlightCanceled:
    "https://www.lastfrontiershoreexcursions.com/ports/juneau/whale-watching",
  skagwayPort: "https://www.lastfrontiershoreexcursions.com/ports/skagway",
  ketchikanMistyFjords:
    "https://www.lastfrontiershoreexcursions.com/ports/ketchikan/misty-fjords-tours",
  temsco: VERIFIED_OPERATORS.temsco.lfseProfileUrl,
  coastal: VERIFIED_OPERATORS.coastal.lfseProfileUrl,
  northstar: VERIFIED_OPERATORS.northstar.lfseProfileUrl,
  wings: VERIFIED_OPERATORS.wings.lfseProfileUrl,
  juneauWhaleWatch: VERIFIED_OPERATORS["juneau-tours"].lfseProfileUrl,
  taquanAir: VERIFIED_OPERATORS.taquan.lfseProfileUrl,
  operators: {
    temsco: VERIFIED_OPERATORS.temsco.lfseProfileUrl,
    coastal: VERIFIED_OPERATORS.coastal.lfseProfileUrl,
    northstar: VERIFIED_OPERATORS.northstar.lfseProfileUrl,
    wings: VERIFIED_OPERATORS.wings.lfseProfileUrl,
    juneauTours: VERIFIED_OPERATORS["juneau-tours"].lfseProfileUrl,
    taquan: VERIFIED_OPERATORS.taquan.lfseProfileUrl,
  },
} as const;

export interface VerifiedHelicopterTariff {
  id:
    | "temsco-juneau-mendenhall-walk"
    | "temsco-juneau-dog-sled"
    | "coastal-juneau-icefield"
    | "coastal-juneau-dog-sled"
    | "northstar-juneau-walkabout"
    | "northstar-juneau-glacier-trek"
    | "northstar-juneau-dog-sled"
    | "temsco-skagway-glacier-discovery"
    | "temsco-skagway-dog-sled";
  port: "juneau" | "skagway";
  operatorKey: "temsco" | "coastal" | "northstar";
  operatorName: string;
  tourName: string;
  category: "glacier-walk" | "glacier-trek" | "dog-sledding";
  totalDurationLabel: string;
  durationMinutes: number;
  basePriceUsd: number;
  basePriceCents: number;
  priceDisplayLong: string;
  priceDisplayCompact: string;
  ageRule: string;
  seasonalWindow: string;
  isSeasonalSnowpack: boolean;
  weightSurchargeRule: string;
  taxAndFeesNote: string;
  fullQualificationSummary: string;
  officialSourceUrl: string;
  directCancellationRule: string;
  weatherRefundRule: string;
}

export const VERIFIED_OPERATOR_TARIFFS: readonly VerifiedHelicopterTariff[] = [
  {
    id: "temsco-juneau-mendenhall-walk",
    port: "juneau",
    operatorKey: "temsco",
    operatorName: "TEMSCO Helicopters",
    tourName: "Mendenhall Glacier & Guided Walk",
    category: "glacier-walk",
    totalDurationLabel: "2h 15m total door-to-door",
    durationMinutes: 135,
    basePriceUsd: 449,
    basePriceCents: 44900,
    priceDisplayLong: "$449 per person (ages 2+), as of November 18, 2026",
    priceDisplayCompact: "$449 / person (as of Nov 18, 2026)",
    ageRule: "Ages 2+ (infants under 2 on lap per FAA rules)",
    seasonalWindow: "May – September",
    isSeasonalSnowpack: false,
    weightSurchargeRule: "+$150 weight surcharge at 250+ lbs clothed",
    taxAndFeesNote: "+ CBJ sales tax & fees",
    fullQualificationSummary:
      "$449 per person (ages 2+), as of November 18, 2026 · +$150 weight surcharge at 250+ lbs clothed · + CBJ sales tax & fees",
    officialSourceUrl: "https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/",
    directCancellationRule: "100% refund 48h+ prior to scheduled departure; non-refundable within 48h.",
    weatherRefundRule: "100% refund if canceled by operator for weather.",
  },
  {
    id: "temsco-juneau-dog-sled",
    port: "juneau",
    operatorKey: "temsco",
    operatorName: "TEMSCO Helicopters",
    tourName: "Mendenhall Glacier Dog Sledding",
    category: "dog-sledding",
    totalDurationLabel: "2h 45m total",
    durationMinutes: 165,
    basePriceUsd: 759,
    basePriceCents: 75900,
    priceDisplayLong: "$759 per person (ages 2+), as of November 18, 2026",
    priceDisplayCompact: "$759 / person (as of Nov 18, 2026)",
    ageRule: "Ages 2+",
    seasonalWindow: "May–August seasonal snowpack window",
    isSeasonalSnowpack: true,
    weightSurchargeRule: "+$150 weight surcharge at 250+ lbs clothed",
    taxAndFeesNote: "+ CBJ sales tax & fees",
    fullQualificationSummary:
      "$759 per person (ages 2+), as of November 18, 2026 · Seasonal snowpack window (typically May–August) · +$150 weight surcharge at 250+ lbs clothed · + CBJ sales tax & fees",
    officialSourceUrl: "https://temscoair.com/juneau-helicopter-tours/dog-sled/",
    directCancellationRule: "100% refund 48h+ prior to scheduled departure; non-refundable within 48h.",
    weatherRefundRule: "100% refund if canceled by operator for weather.",
  },
  {
    id: "coastal-juneau-icefield",
    port: "juneau",
    operatorKey: "coastal",
    operatorName: "Coastal Helicopters",
    tourName: "Icefield Excursion / Herbert Glacier Landing",
    category: "glacier-walk",
    totalDurationLabel: "~2h 35m total",
    durationMinutes: 155,
    basePriceUsd: 459,
    basePriceCents: 45900,
    priceDisplayLong:
      "$459 Standard (1–259 lbs), $609 Standard Plus (260–299 lbs, +$150), $918 Premium (300+ lbs, 2 seats), as of November 18, 2026",
    priceDisplayCompact:
      "$459 Standard (1–259 lbs) · $609 (260–299 lbs) · $918 (300+ lbs), as of Nov 18, 2026",
    ageRule: "All ages (tiered clothed weight pricing)",
    seasonalWindow: "May – September",
    isSeasonalSnowpack: false,
    weightSurchargeRule:
      "Tiered clothed weight pricing: $459 Standard (1–259 lbs), $609 Standard Plus (260–299 lbs, +$150), $918 Premium (300+ lbs, 2 seats)",
    taxAndFeesNote: "+ CBJ sales tax & fees",
    fullQualificationSummary:
      "$459 Standard (1–259 lbs), $609 Standard Plus (260–299 lbs, +$150), $918 Premium (300+ lbs, 2 seats), as of November 18, 2026 · + CBJ sales tax & fees",
    officialSourceUrl: "https://coastalhelicopters.com/tours/icefield-excursion/",
    directCancellationRule:
      "7+ days full refund direct (up to 24h free cancellation on Viator 6251SHOREXICEWALK).",
    weatherRefundRule: "100% refund if canceled by operator for weather.",
  },
  {
    id: "coastal-juneau-dog-sled",
    port: "juneau",
    operatorKey: "coastal",
    operatorName: "Coastal Helicopters",
    tourName: "Dog Sled Tour on Herbert Glacier",
    category: "dog-sledding",
    totalDurationLabel: "3h 15m total",
    durationMinutes: 195,
    basePriceUsd: 769,
    basePriceCents: 76900,
    priceDisplayLong:
      "$769 Standard (1–259 lbs), $919 Standard Plus (260–299 lbs), $1,538 Premium (300+ lbs), as of November 18, 2026",
    priceDisplayCompact:
      "$769 Standard (1–259 lbs) · $919 (260–299 lbs) · $1,538 (300+ lbs), as of Nov 18, 2026",
    ageRule: "All ages (tiered clothed weight pricing)",
    seasonalWindow: "May–August seasonal snowpack window",
    isSeasonalSnowpack: true,
    weightSurchargeRule:
      "Tiered clothed weight pricing: $769 Standard (1–259 lbs), $919 Standard Plus (260–299 lbs), $1,538 Premium (300+ lbs)",
    taxAndFeesNote: "+ CBJ sales tax & fees",
    fullQualificationSummary:
      "$769 Standard (1–259 lbs), $919 Standard Plus (260–299 lbs), $1,538 Premium (300+ lbs), as of November 18, 2026 · Seasonal snowpack window (May–August) · + CBJ sales tax & fees",
    officialSourceUrl: "https://coastalhelicopters.com/tours/dog-sled-tours/",
    directCancellationRule: "7+ days full refund direct.",
    weatherRefundRule: "100% refund if canceled by operator for weather.",
  },
  {
    id: "northstar-juneau-walkabout",
    port: "juneau",
    operatorKey: "northstar",
    operatorName: "NorthStar Trekking",
    tourName: "Helicopter Glacier Walkabout",
    category: "glacier-walk",
    totalDurationLabel: "3h 15m total (~1h guided ice walk)",
    durationMinutes: 195,
    basePriceUsd: 539,
    basePriceCents: 53900,
    priceDisplayLong: "$539 per person (ages 8+), as of November 18, 2026",
    priceDisplayCompact: "$539 / person (as of Nov 18, 2026)",
    ageRule: "Ages 8+",
    seasonalWindow: "May – September",
    isSeasonalSnowpack: false,
    weightSurchargeRule: "+$250 weight surcharge at 250+ lbs clothed",
    taxAndFeesNote: "+ CBJ sales tax & fees",
    fullQualificationSummary:
      "$539 per person (ages 8+), as of November 18, 2026 · +$250 weight surcharge at 250+ lbs clothed · + CBJ sales tax & fees",
    officialSourceUrl: "https://northstartrekking.com/adventures/helicopter-glacier-walkabout/",
    directCancellationRule:
      ">24h refund minus 10% administrative fee (<24h non-refundable).",
    weatherRefundRule: "Operator weather cancel: reschedule or full refund.",
  },
  {
    id: "northstar-juneau-glacier-trek",
    port: "juneau",
    operatorKey: "northstar",
    operatorName: "NorthStar Trekking",
    tourName: "Helicopter Glacier Trek",
    category: "glacier-trek",
    totalDurationLabel: "4h 15m total (~2h technical trek)",
    durationMinutes: 255,
    basePriceUsd: 599,
    basePriceCents: 59900,
    priceDisplayLong: "$599 per person (ages 12+), as of November 18, 2026",
    priceDisplayCompact: "$599 / person (as of Nov 18, 2026)",
    ageRule: "Ages 12+",
    seasonalWindow: "May – September",
    isSeasonalSnowpack: false,
    weightSurchargeRule: "+$250 weight surcharge at 250+ lbs clothed",
    taxAndFeesNote: "+ CBJ sales tax & fees",
    fullQualificationSummary:
      "$599 per person (ages 12+), as of November 18, 2026 · +$250 weight surcharge at 250+ lbs clothed · + CBJ sales tax & fees",
    officialSourceUrl: "https://northstartrekking.com/adventures/helicopter-glacier-trek/",
    directCancellationRule:
      ">24h refund minus 10% administrative fee (<24h non-refundable).",
    weatherRefundRule: "Operator weather cancel: reschedule or full refund.",
  },
  {
    id: "northstar-juneau-dog-sled",
    port: "juneau",
    operatorKey: "northstar",
    operatorName: "NorthStar Trekking",
    tourName: "Helicopter & Dog Sled Glacier Trek",
    category: "dog-sledding",
    totalDurationLabel: "3h 15m total",
    durationMinutes: 195,
    basePriceUsd: 789,
    basePriceCents: 78900,
    priceDisplayLong: "$789 per person, as of November 18, 2026",
    priceDisplayCompact: "$789 / person (as of Nov 18, 2026)",
    ageRule: "Ages 2+",
    seasonalWindow: "May–August seasonal snowpack window",
    isSeasonalSnowpack: true,
    weightSurchargeRule: "+$250 weight surcharge at 250+ lbs clothed",
    taxAndFeesNote: "+ CBJ sales tax & fees",
    fullQualificationSummary:
      "$789 per person, as of November 18, 2026 · Seasonal snowpack window (May–August) · +$250 weight surcharge at 250+ lbs clothed · + CBJ sales tax & fees",
    officialSourceUrl:
      "https://northstartrekking.com/adventures/juneau-glacier-dog-sled-adventure/",
    directCancellationRule:
      ">24h refund minus 10% administrative fee (<24h non-refundable).",
    weatherRefundRule: "Operator weather cancel: reschedule or full refund.",
  },
  {
    id: "temsco-skagway-glacier-discovery",
    port: "skagway",
    operatorKey: "temsco",
    operatorName: "TEMSCO Helicopters (Skagway)",
    tourName: "Glacier Discovery by Helicopter",
    category: "glacier-walk",
    totalDurationLabel: "2h total",
    durationMinutes: 120,
    basePriceUsd: 479,
    basePriceCents: 47900,
    priceDisplayLong: "$479 per person (ages 2+), as of November 18, 2026",
    priceDisplayCompact: "$479 / person (as of Nov 18, 2026)",
    ageRule: "Ages 2+",
    seasonalWindow: "May – September",
    isSeasonalSnowpack: false,
    weightSurchargeRule: "+$150 weight surcharge at 250+ lbs clothed",
    taxAndFeesNote: "+ Skagway tax & fees",
    fullQualificationSummary:
      "$479 per person (ages 2+), as of November 18, 2026 · +$150 weight surcharge at 250+ lbs clothed · + Skagway tax & fees",
    officialSourceUrl: "https://temscoair.com/skagway-helicopter-tours/glacier-tours/",
    directCancellationRule: "100% refund 48h+ prior to scheduled departure; non-refundable within 48h.",
    weatherRefundRule: "100% refund if canceled by operator for weather.",
  },
  {
    id: "temsco-skagway-dog-sled",
    port: "skagway",
    operatorKey: "temsco",
    operatorName: "TEMSCO Helicopters (Skagway)",
    tourName: "Glacier Dog Sledding",
    category: "dog-sledding",
    totalDurationLabel: "2h total",
    durationMinutes: 120,
    basePriceUsd: 649,
    basePriceCents: 64900,
    priceDisplayLong: "$649 per person (ages 2+), as of November 18, 2026",
    priceDisplayCompact: "$649 / person (as of Nov 18, 2026)",
    ageRule: "Ages 2+",
    seasonalWindow: "May–August seasonal snowpack window",
    isSeasonalSnowpack: true,
    weightSurchargeRule: "+$150 weight surcharge at 250+ lbs clothed",
    taxAndFeesNote: "+$3 Skagway fee & tax",
    fullQualificationSummary:
      "$649 per person (ages 2+), as of November 18, 2026 · Seasonal snowpack window (May–August) · +$150 weight surcharge at 250+ lbs clothed · +$3 Skagway fee & tax",
    officialSourceUrl: "https://temscoair.com/skagway-helicopter-tours/dog-sledding/",
    directCancellationRule: "100% refund 48h+ prior to scheduled departure; non-refundable within 48h.",
    weatherRefundRule: "100% refund if canceled by operator for weather.",
  },
] as const;

export const VERIFIED_TARIFFS_BY_ID: Record<
  VerifiedHelicopterTariff["id"],
  VerifiedHelicopterTariff
> = Object.fromEntries(VERIFIED_OPERATOR_TARIFFS.map((t) => [t.id, t])) as Record<
  VerifiedHelicopterTariff["id"],
  VerifiedHelicopterTariff
>;
