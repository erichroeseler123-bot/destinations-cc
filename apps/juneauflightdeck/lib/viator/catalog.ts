import type { ViatorJuneauProduct, ViatorJuneauProductsResponse } from "./types";

/**
 * Verified operator experience catalog for Juneau glacier helicopter flights.
 * Primary-source direct operator tariffs verified November 18, 2026 (2026-11-18)
 * against official TEMSCO, Coastal Helicopters, and NorthStar Trekking tour pages.
 *
 * All photography utilizes verified, approved local Alaska assets (public domain / CC BY-SA).
 */
export const SNAPSHOT_TIMESTAMP = "2026-11-18T12:00:00.000Z";

export const VERIFIED_FALLBACK_SNAPSHOT: ViatorJuneauProduct[] = [
  {
    id: "coastal-icefield-landing",
    productCode: "coastal-icefield-landing",
    viatorProductCode: "6251SHOREXICEWALK",
    isExactViatorProduct: true,
    worryFreeShoreExcursion: true,
    worryFreeTagId: 367649,
    worryFreeTermsUrl: "https://www.viator.com/support/termsAndConditions",
    worryFreeSummary:
      "Qualifies for Viator's Worry-free Shore Excursion guarantee (Viator Terms of Use Section 20, Tag 367649) when booked on Viator with accurate ship arrival/departure details and a minimum 2-hour post-tour buffer before ship departure (up to US$1,000/person next-port transport; 14-day missed-port refund window).",
    title: "Juneau Shore Excursion Helicopter Tour and Guided Icefield Walk (Coastal Helicopters)",
    description:
      "Fly with Coastal Helicopters over Herbert Glacier, deep mountain passes, and cascading waterfalls before landing on the Juneau Icefield for a guided walk on ancient glacial ice.",
    durationMinutes: 155,
    durationLabel: "~2 hr 35 min",
    priceLabel: "$459 Standard (1–259 lbs), as of Nov 18, 2026",
    priceFrom: 459,
    currency: "USD",
    priceDisclaimer:
      "Verified Coastal Helicopters base tariff as of November 18, 2026: $459 Standard (1–259 lbs), $609 Standard Plus (260–299 lbs, +$150), $918 Premium (300+ lbs, 2 seats), + CBJ sales tax & fees. Confirm final checkout price and calendar availability in Viator.",
    operatorSourceHref: "https://coastalhelicopters.com/tours/icefield-excursion/",
    operatorSourceLabel: "Coastal Helicopters Icefield Excursion",
    imageUrl: "/images/tours/coastal-icefield-landing.jpg",
    imageAlt: "Herbert Glacier blue icefall and Coast Mountains in the Juneau Icefield, Alaska",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "Coastal Helicopters",
    rating: null,
    reviewCount: null,
    badges: [
      "Viator 6251SHOREXICEWALK",
      "Worry-Free Shore Excursion (§20)",
      "Herbert Glacier Landing",
    ],
    cancellationPolicy:
      "7+ days full refund direct (up to 24h free cancellation on Viator 6251SHOREXICEWALK) · 100% operator weather-cancellation refund",
    bookHref:
      "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK?pid=P00058396&mcid=42383&medium=api&campaign=jfd-coastal-icefield-walk",
    tourType: "glacier_landing",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
  {
    id: "temsco-mendenhall-glacier-walk",
    productCode: "temsco-mendenhall-glacier-walk",
    viatorProductCode: null,
    isExactViatorProduct: false,
    worryFreeShoreExcursion: false,
    worryFreeTagId: null,
    worryFreeTermsUrl: "https://www.viator.com/support/termsAndConditions",
    worryFreeSummary:
      "Links to Viator Juneau search results; Viator's Worry-free Shore Excursion guarantee (Viator Terms of Use Section 20) applies only if you select a tour on Viator expressly marked 'Worry-free Shore Excursion'.",
    title: "TEMSCO Mendenhall Glacier & Guided Walk",
    description:
      "Fly over Juneau's coastal rainforest and rugged granite spires before landing directly on the ancient blue ice of Mendenhall Glacier for a 20–25 minute guided walk with provided traction overboots.",
    durationMinutes: 135,
    durationLabel: "2 hr 15 min",
    priceLabel: "$449 / person (ages 2+), as of Nov 18, 2026",
    priceFrom: 449,
    currency: "USD",
    priceDisclaimer:
      "Verified TEMSCO Helicopters direct base tariff: $449 per person (ages 2+), as of November 18, 2026 (+$150 weight surcharge at 250+ lbs clothed; + CBJ sales tax & fees). Confirm partner pricing and calendar availability in Viator.",
    operatorSourceHref: "https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/",
    operatorSourceLabel: "TEMSCO Mendenhall Glacier Tour",
    imageUrl: "/images/tours/temsco-mendenhall-glacier-walk.jpg",
    imageAlt: "TEMSCO helicopter landed on Mendenhall Glacier snow and blue ice near Juneau, Alaska",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "TEMSCO Helicopters",
    rating: null,
    reviewCount: null,
    badges: ["Signature Mendenhall Landing", "Ages 2+", "Guided Glacier Walk"],
    cancellationPolicy:
      "Direct cancel: 100% refund 48h+ prior · 100% refund if canceled by operator for weather · Confirm partner terms in Viator",
    bookHref:
      "https://www.viator.com/searchResults/all?text=Juneau+Mendenhall+Glacier+helicopter+tour&pid=P00058396&mcid=42383&medium=api&campaign=jfd-temsco-mendenhall-search",
    tourType: "glacier_landing",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
  {
    id: "temsco-glacier-dog-sledding",
    productCode: "temsco-glacier-dog-sledding",
    viatorProductCode: null,
    isExactViatorProduct: false,
    worryFreeShoreExcursion: false,
    worryFreeTagId: null,
    worryFreeTermsUrl: "https://www.viator.com/support/termsAndConditions",
    worryFreeSummary:
      "Links to Viator Juneau search results; Viator's Worry-free Shore Excursion guarantee (Viator Terms of Use Section 20) applies only if you select a tour on Viator expressly marked 'Worry-free Shore Excursion'.",
    title: "TEMSCO Mendenhall Glacier Dog Sledding by Helicopter",
    description:
      "Fly by helicopter to an upper snowfield dog-sled camp. Meet racing huskies and mushers and ride across glacier snowpack during Juneau's seasonal May–August window.",
    durationMinutes: 165,
    durationLabel: "2 hr 45 min",
    priceLabel: "$759 / person (ages 2+), as of Nov 18, 2026",
    priceFrom: 759,
    currency: "USD",
    priceDisclaimer:
      "Verified TEMSCO Helicopters direct base tariff: $759 per person (ages 2+), as of November 18, 2026 (May–August seasonal snowpack window; +$150 weight surcharge at 250+ lbs clothed; + CBJ sales tax & fees). Confirm partner pricing and calendar availability in Viator.",
    operatorSourceHref: "https://temscoair.com/juneau-helicopter-tours/dog-sled/",
    operatorSourceLabel: "TEMSCO Glacier Dog Sledding",
    imageUrl: "/images/tours/temsco-glacier-dog-sledding.jpg",
    imageAlt: "Alaskan husky sled dog team harnessed on an Alaska mountain snowfield at alpenglow",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "TEMSCO Helicopters",
    rating: null,
    reviewCount: null,
    badges: ["May–August Seasonal", "Ages 2+", "Glacier Dog Sledding"],
    cancellationPolicy:
      "Direct cancel: 100% refund 48h+ prior · 100% refund if canceled by operator for weather · Confirm partner terms in Viator",
    bookHref:
      "https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+dog+sledding&pid=P00058396&mcid=42383&medium=api&campaign=jfd-temsco-dogsled-search",
    tourType: "dog_sledding",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
  {
    id: "coastal-glacier-dog-sledding",
    productCode: "coastal-glacier-dog-sledding",
    viatorProductCode: null,
    isExactViatorProduct: false,
    worryFreeShoreExcursion: false,
    worryFreeTagId: null,
    worryFreeTermsUrl: "https://www.viator.com/support/termsAndConditions",
    worryFreeSummary:
      "Links to Viator Juneau search results; Viator's Worry-free Shore Excursion guarantee (Viator Terms of Use Section 20) applies only if you select a tour on Viator expressly marked 'Worry-free Shore Excursion'.",
    title: "Coastal Helicopters Dog Sled Tour on Herbert Glacier",
    description:
      "Fly by helicopter to an alpine dog camp on Herbert Glacier snowfields. Meet racing huskies and mushers and ride across high snowfields during the seasonal May–August snowpack window.",
    durationMinutes: 195,
    durationLabel: "3 hr 15 min",
    priceLabel: "$769 Standard (1–259 lbs), as of Nov 18, 2026",
    priceFrom: 769,
    currency: "USD",
    priceDisclaimer:
      "Verified Coastal Helicopters direct base tariff as of November 18, 2026: $769 Standard (1–259 lbs), $919 Standard Plus (260–299 lbs), $1,538 Premium (300+ lbs), May–August seasonal snowpack window, + CBJ sales tax & fees. Confirm partner pricing and calendar availability in Viator.",
    operatorSourceHref: "https://coastalhelicopters.com/tours/dog-sled-tours/",
    operatorSourceLabel: "Coastal Dog Sled Tours",
    imageUrl: "/images/tours/temsco-glacier-dog-sledding.jpg",
    imageAlt: "Alaskan husky sled dog team harnessed on an Alaska mountain snowfield",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "Coastal Helicopters",
    rating: null,
    reviewCount: null,
    badges: ["Herbert Glacier Camp", "Seasonal: May–Aug", "Dog Sledding"],
    cancellationPolicy:
      "Direct cancel: 7+ days full refund · 100% refund if canceled by operator for weather",
    bookHref:
      "https://www.viator.com/searchResults/all?text=Juneau+Coastal+dog+sledding&pid=P00058396&mcid=42383&medium=api&campaign=jfd-coastal-dogsled-search",
    tourType: "dog_sledding",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
  {
    id: "northstar-glacier-walkabout",
    productCode: "northstar-glacier-walkabout",
    viatorProductCode: null,
    isExactViatorProduct: false,
    worryFreeShoreExcursion: false,
    worryFreeTagId: null,
    worryFreeTermsUrl: "https://www.viator.com/support/termsAndConditions",
    worryFreeSummary:
      "Links to Viator Juneau search results; Viator's Worry-free Shore Excursion guarantee (Viator Terms of Use Section 20) applies only if you select a tour on Viator expressly marked 'Worry-free Shore Excursion'.",
    title: "NorthStar Helicopter Glacier Walkabout (~1 Hour Guided Ice Walk)",
    description:
      "Fly to Mendenhall Glacier and spend roughly one hour exploring on ice with crampons and trekking poles. Moderate walking suited for active travelers ages 8+.",
    durationMinutes: 195,
    durationLabel: "3 hr 15 min",
    priceLabel: "$539 / person (ages 8+), as of Nov 18, 2026",
    priceFrom: 539,
    currency: "USD",
    priceDisclaimer:
      "Verified NorthStar Trekking direct base tariff: $539 per person (ages 8+), as of November 18, 2026 (+$250 weight surcharge at 250+ lbs clothed; + CBJ sales tax & fees). Confirm partner pricing and calendar availability in Viator.",
    operatorSourceHref: "https://northstartrekking.com/adventures/helicopter-glacier-walkabout/",
    operatorSourceLabel: "NorthStar Glacier Walkabout",
    imageUrl: "/images/portfolio/glacier-walkabout.webp",
    imageAlt: "Guided glacier hiker with crampons and trekking poles exploring sculpted blue glacier ice",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "NorthStar Trekking",
    rating: null,
    reviewCount: null,
    badges: ["~1 Hour on Ice", "Crampons & Poles Provided", "Ages 8+"],
    cancellationPolicy:
      "Direct cancel: >24h refund minus 10% admin fee (<24h non-refundable) · Operator weather cancel: reschedule or full refund",
    bookHref:
      "https://www.viator.com/searchResults/all?text=Juneau+NorthStar+Glacier+Walkabout+helicopter&pid=P00058396&mcid=42383&medium=api&campaign=jfd-northstar-walkabout-search",
    tourType: "glacier_landing",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
  {
    id: "northstar-glacier-ice-trek",
    productCode: "northstar-glacier-ice-trek",
    viatorProductCode: null,
    isExactViatorProduct: false,
    worryFreeShoreExcursion: false,
    worryFreeTagId: null,
    worryFreeTermsUrl: "https://www.viator.com/support/termsAndConditions",
    worryFreeSummary:
      "Links to Viator Juneau search results; Viator's Worry-free Shore Excursion guarantee (Viator Terms of Use Section 20) applies only if you select a tour on Viator expressly marked 'Worry-free Shore Excursion'.",
    title: "NorthStar Helicopter Glacier Trek (~2 Hours Technical Trek)",
    description:
      "Equipped with mountaineering boots, steel crampons, harness, and trekking poles, hike deep into Mendenhall Glacier's sculpted blue ice walls, crevasses, and moulins (ages 12+).",
    durationMinutes: 255,
    durationLabel: "4 hr 15 min",
    priceLabel: "$599 / person (ages 12+), as of Nov 18, 2026",
    priceFrom: 599,
    currency: "USD",
    priceDisclaimer:
      "Verified NorthStar Trekking direct base tariff: $599 per person (ages 12+), as of November 18, 2026 (+$250 weight surcharge at 250+ lbs clothed; + CBJ sales tax & fees). Confirm partner pricing and calendar availability in Viator.",
    operatorSourceHref: "https://northstartrekking.com/adventures/helicopter-glacier-trek/",
    operatorSourceLabel: "NorthStar Helicopter Glacier Trek",
    imageUrl: "/images/tours/northstar-glacier-ice-trek.jpg",
    imageAlt: "Guided glacier hiker with crampons and trekking poles on sculpted blue glacier ice in Alaska",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "NorthStar Trekking",
    rating: null,
    reviewCount: null,
    badges: ["~2 Hours on Ice", "Technical Crampons", "Ages 12+ Guided Trek"],
    cancellationPolicy:
      "Direct cancel: >24h refund minus 10% admin fee (<24h non-refundable) · Operator weather cancel: reschedule or full refund",
    bookHref:
      "https://www.viator.com/searchResults/all?text=Juneau+NorthStar+Trekking+helicopter&pid=P00058396&mcid=42383&medium=api&campaign=jfd-northstar-icetrek-search",
    tourType: "ice_trek",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
  {
    id: "northstar-glacier-dogsled-adventure",
    productCode: "northstar-glacier-dogsled-adventure",
    viatorProductCode: null,
    isExactViatorProduct: false,
    worryFreeShoreExcursion: false,
    worryFreeTagId: null,
    worryFreeTermsUrl: "https://www.viator.com/support/termsAndConditions",
    worryFreeSummary:
      "Links to Viator Juneau search results; Viator's Worry-free Shore Excursion guarantee (Viator Terms of Use Section 20) applies only if you select a tour on Viator expressly marked 'Worry-free Shore Excursion'.",
    title: "NorthStar Helicopter & Dog Sled Glacier Trek",
    description:
      "Fly across the Juneau Icefield from NorthStar's Douglas Island base to Norris Glacier for a seasonal snowfield dog-sledding experience (May–August seasonal snowpack window).",
    durationMinutes: 195,
    durationLabel: "3 hr 15 min",
    priceLabel: "$789 / person, as of Nov 18, 2026",
    priceFrom: 789,
    currency: "USD",
    priceDisclaimer:
      "Verified NorthStar Trekking direct base tariff: $789 per person, as of November 18, 2026 (May–August seasonal snowpack window; +$250 weight surcharge at 250+ lbs clothed; + CBJ sales tax & fees). Confirm partner pricing and calendar availability in Viator.",
    operatorSourceHref: "https://northstartrekking.com/adventures/juneau-glacier-dog-sled-adventure/",
    operatorSourceLabel: "NorthStar Dog Sled Glacier Adventure",
    imageUrl: "/images/portfolio/mendenhall-glacier-overview.webp",
    imageAlt: "Mendenhall Glacier face, icebergs, and Coast Mountains in Juneau, Alaska",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "NorthStar Trekking",
    rating: null,
    reviewCount: null,
    badges: ["Norris Glacier Camp", "May–August Seasonal", "Dog Sledding"],
    cancellationPolicy:
      "Direct cancel: >24h refund minus 10% admin fee (<24h non-refundable) · Operator weather cancel: reschedule or full refund",
    bookHref:
      "https://www.viator.com/searchResults/all?text=Juneau+NorthStar+dog+sledding&pid=P00058396&mcid=42383&medium=api&campaign=jfd-northstar-dogsled-search",
    tourType: "dog_sledding",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
];

export const VIATOR_TOURS_BY_CODE: Record<string, ViatorJuneauProduct> = Object.fromEntries(
  VERIFIED_FALLBACK_SNAPSHOT.map((t) => [t.productCode, t]),
);

export const VIATOR_TOURS_BY_OPERATOR: Record<string, ViatorJuneauProduct[]> = {
  TEMSCO: [
    VIATOR_TOURS_BY_CODE["temsco-mendenhall-glacier-walk"],
    VIATOR_TOURS_BY_CODE["temsco-glacier-dog-sledding"],
  ],
  Coastal: [
    VIATOR_TOURS_BY_CODE["coastal-icefield-landing"],
    VIATOR_TOURS_BY_CODE["coastal-glacier-dog-sledding"],
  ],
  NorthStar: [
    VIATOR_TOURS_BY_CODE["northstar-glacier-walkabout"],
    VIATOR_TOURS_BY_CODE["northstar-glacier-ice-trek"],
    VIATOR_TOURS_BY_CODE["northstar-glacier-dogsled-adventure"],
  ],
};

export const DEFAULT_FALLBACK_RESPONSE: ViatorJuneauProductsResponse = {
  ok: true,
  generatedAt: SNAPSHOT_TIMESTAMP,
  products: VERIFIED_FALLBACK_SNAPSHOT,
  isLive: false,
  status: "operator_profiles",
  snapshotTimestamp: SNAPSHOT_TIMESTAMP,
  selectedDate: null,
  passengerCount: 2,
  signals: {
    headline:
      "Compare verified Juneau operator flight profiles (as of November 18, 2026) and check live calendar dates on Viator or the operator's booking page.",
    availabilityStatus: "calendar_check_required",
  },
  attribution: {
    source: "Verified Operator Tariffs (as of Nov 18, 2026) & Viator Partner Network",
    notice:
      "Confirm final checkout total, weight-tier selection, and calendar availability in Viator. Viator's Worry-free Shore Excursion guarantee (Viator Terms of Use Section 20, Tag 367649) applies to qualifying tours such as 6251SHOREXICEWALK.",
    poweredBy: "Official Viator Partner",
  },
  browseHref:
    "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK?pid=P00058396&mcid=42383&medium=api&campaign=jfd-catalog-featured",
  waitlistHref: "/helicopter-waitlist",
};
