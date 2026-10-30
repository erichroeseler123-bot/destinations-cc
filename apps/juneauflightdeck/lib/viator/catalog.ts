import type { ViatorJuneauProduct, ViatorJuneauProductsResponse } from "./types";

/**
 * Verified operator experience catalog for Juneau glacier helicopter flights.
 * Reflects genuine operator products, published direct base pricing, operating seasons,
 * and operator-published policies for TEMSCO, Coastal, and NorthStar.
 *
 * All photography utilizes verified, approved local Alaska assets (public domain / CC BY-SA).
 */
export const SNAPSHOT_TIMESTAMP = "2026-10-23T12:00:00.000Z";

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
      "Qualifies for Viator's Worry-free Shore Excursion guarantee (Viator Terms of Use Section 20, Tag 367649) when booked on Viator with accurate ship arrival/departure details and a minimum 2-hour post-tour buffer before ship departure (up to US$1,000/person next-port transport; 14-day missed-port refund window). DCC's port-window calculation is separate and is not itself a back-to-ship guarantee.",
    title: "Juneau Shore Excursion Helicopter Tour and Guided Icefield Walk (Coastal Helicopters)",
    description:
      "Fly with Coastal Helicopters over Herbert Glacier, deep mountain passes, and cascading waterfalls before landing on the Juneau Icefield for a guided walk on ancient glacial ice.",
    durationMinutes: 155,
    durationLabel: "2 hr 35 min",
    priceLabel: "From $459 base / person",
    priceFrom: 459,
    currency: "USD",
    priceDisclaimer:
      "Published Coastal Helicopters rate from $459 base (260–299 lbs +$150 half-seat surcharge [Viator option TG1]; 300+ lbs second seat [Viator option TG2]). Confirm final price and availability in Viator.",
    operatorSourceHref: "https://coastalhelicopters.com/tours/icefield-excursion/",
    operatorSourceLabel: "Coastal Helicopters policy & tour details",
    imageUrl: "/images/tours/coastal-icefield-landing.jpg",
    imageAlt: "Aerial view of Juneau Icefield and glacier icefalls",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "Coastal Helicopters",
    rating: 4.8,
    reviewCount: 643,
    badges: [
      "Viator 6251SHOREXICEWALK",
      "Worry-Free Shore Excursion (§20)",
      "Herbert Glacier Landing",
    ],
    cancellationPolicy:
      "Free cancellation up to 24 hours before start on Viator · Weather cancellation: full refund · Viator Terms of Use Section 20 Worry-free Shore Excursion",
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
    title: "TEMSCO Mendenhall Glacier Helicopter Tour & Guided Ice Walk",
    description:
      "Fly over Juneau's coastal rainforest and rugged granite spires before landing directly on the ancient blue ice of Mendenhall Glacier for a 20-25 minute guided walk with provided traction overboots.",
    durationMinutes: 135,
    durationLabel: "2 hr 15 min",
    priceLabel: "From $449 base / person",
    priceFrom: 449,
    currency: "USD",
    priceDisclaimer:
      "Published TEMSCO Helicopters rate from $449 base (+$150 weight surcharge above 250 lbs). Confirm final price and availability in Viator.",
    operatorSourceHref: "https://temscoair.com/tours/pilots-choice-exploration/",
    operatorSourceLabel: "TEMSCO policy & tour details",
    imageUrl: null,
    imageAlt: "Helicopter landing on Mendenhall Glacier blue ice near Juneau, Alaska",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "TEMSCO Helicopters",
    rating: null,
    reviewCount: null,
    badges: ["Signature Mendenhall Landing", "Ages 2+", "Guided Glacier Walk"],
    cancellationPolicy:
      "Operator weather cancellation: full refund · Confirm customer-change terms and Worry-free Shore Excursion (§20) badge in Viator",
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
    title: "TEMSCO Dog Sledding on Mendenhall Glacier by Helicopter",
    description:
      "Fly by helicopter to a dog-sled camp on Mendenhall Glacier. Meet racing huskies and mushers and ride across the glacier snowfield during Juneau's summer operating season.",
    durationMinutes: 165,
    durationLabel: "2 hr 45 min",
    priceLabel: "From $699 base / person",
    priceFrom: 699,
    currency: "USD",
    priceDisclaimer:
      "Published TEMSCO rate from $699 base (+$150 weight surcharge above 250 lbs). Confirm final price and availability in Viator.",
    operatorSourceHref: "https://temscoair.com/juneau-helicopter-tours/dog-sled/",
    operatorSourceLabel: "TEMSCO policy & tour details",
    imageUrl: "/images/tours/temsco-glacier-dog-sledding.jpg",
    imageAlt: "Alaskan husky dog sled team and musher on a Juneau glacier snowfield",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "TEMSCO Helicopters",
    rating: null,
    reviewCount: null,
    badges: ["Mendenhall Glacier Snow Camp", "Seasonal Snow Camp", "Dog Sledding"],
    cancellationPolicy:
      "Operator weather cancellation: full refund · Confirm customer-change terms and Worry-free Shore Excursion (§20) badge in Viator",
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
    title: "Coastal Helicopter Dog Sled Tour on Herbert Glacier",
    description:
      "Fly by helicopter to an alpine dog camp on Herbert Glacier snowfields. Meet racing huskies and mushers and experience a dog sled run across high snowfields (operates mid-May to mid-August).",
    durationMinutes: 165,
    durationLabel: "2 hr 45 min",
    priceLabel: "From $709 base / person",
    priceFrom: 709,
    currency: "USD",
    priceDisclaimer:
      "Published Coastal Helicopters rate from $709 base. Confirm seasonal dates, weight rules, final price, and availability in Viator.",
    operatorSourceHref: "https://coastalhelicopters.com/tours/dog-sled-tours/",
    operatorSourceLabel: "Coastal Helicopters policy & tour details",
    imageUrl: null,
    imageAlt: "Coastal Helicopters dog sledding excursion on Herbert Glacier snowfield",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "Coastal Helicopters",
    rating: null,
    reviewCount: null,
    badges: ["Herbert Glacier Camp", "Seasonal: May–Aug", "Dog Sledding"],
    cancellationPolicy:
      "Customer: 7+ days full refund · operator weather cancellation: full refund",
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
    title: "NorthStar Helicopter Glacier Walkabout (1 Hour on Mendenhall Ice)",
    description:
      "Fly to Mendenhall Glacier and spend a full hour exploring on ice with crampons and trekking poles. Gentle-to-moderate walking suited for active travelers ages 8+.",
    durationMinutes: 195,
    durationLabel: "3 hr 15 min",
    priceLabel: "From $499 base / person",
    priceFrom: 499,
    currency: "USD",
    priceDisclaimer:
      "Published NorthStar rate from $499 base (+$150 weight surcharge above 250 lbs). Confirm final price and availability in Viator.",
    operatorSourceHref: "https://northstartrekking.com/treks/tours/helicopter-glacier-walkabout/",
    operatorSourceLabel: "NorthStar policy & tour details",
    imageUrl: null,
    imageAlt: "NorthStar Helicopter Glacier Walkabout on Mendenhall Glacier ice",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "NorthStar Trekking",
    rating: null,
    reviewCount: null,
    badges: ["Full 1 Hour on Ice", "Crampons & Poles Provided", "Ages 8+ Active Walk"],
    cancellationPolicy:
      "Customer: >24h refund minus 10% · operator cancellation: reschedule or full refund",
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
    title: "NorthStar Level 1 Helicopter Glacier Ice Trek (2 Hours on Ice)",
    description:
      "Equipped with mountaineering boots, crampons, harness, and trekking poles, hike deep into Mendenhall Glacier's sculpted blue ice walls, crevasses, and moulins (ages 12+).",
    durationMinutes: 255,
    durationLabel: "4 hr 15 min",
    priceLabel: "From $549 base / person",
    priceFrom: 549,
    currency: "USD",
    priceDisclaimer:
      "Published NorthStar rate from $549 base. Confirm final price and availability in Viator.",
    operatorSourceHref: "https://northstartrekking.com/adventures/helicopter-glacier-trek/",
    operatorSourceLabel: "NorthStar policy & tour details",
    imageUrl: "/images/tours/northstar-glacier-ice-trek.jpg",
    imageAlt: "Guided mountaineering exploration of deep glacier ice terrain in Juneau",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "NorthStar Trekking",
    rating: null,
    reviewCount: null,
    badges: ["2 Hours on Ice", "Technical Crampons", "Ages 12+ Guided Trek"],
    cancellationPolicy:
      "Customer: >24h refund minus 10% · operator cancellation: reschedule or full refund",
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
    title: "NorthStar Helicopter Glacier Dogsled Adventure on Norris Glacier",
    description:
      "Fly across the Juneau Icefield to Norris Glacier for an authentic dog sledding experience with an Iditarod musher partner camp (operates summer snow season, ages 2+).",
    durationMinutes: 195,
    durationLabel: "3 hr 15 min",
    priceLabel: "From $739 base / person",
    priceFrom: 739,
    currency: "USD",
    priceDisclaimer:
      "Published NorthStar rate from $739 base. Confirm seasonal dates, final price, and availability in Viator.",
    operatorSourceHref: "https://northstartrekking.com/adventures/juneau-glacier-dog-sled-adventure/",
    operatorSourceLabel: "NorthStar policy & tour details",
    imageUrl: null,
    imageAlt: "NorthStar Helicopter Glacier Dogsled Adventure on Norris Glacier",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "NorthStar Trekking",
    rating: null,
    reviewCount: null,
    badges: ["Norris Glacier Camp", "Seasonal Snow Camp", "Dog Sledding"],
    cancellationPolicy:
      "Customer: >24h refund minus 10% · operator cancellation: reschedule or full refund",
    bookHref:
      "https://www.viator.com/searchResults/all?text=Juneau+NorthStar+dog+sledding&pid=P00058396&mcid=42383&medium=api&campaign=jfd-northstar-dogsled-search",
    tourType: "dog_sledding",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
];

export const VIATOR_TOURS_BY_CODE: Record<string, ViatorJuneauProduct> = Object.fromEntries(
  VERIFIED_FALLBACK_SNAPSHOT.map((t) => [t.productCode, t])
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
      "DCC evaluates tour suitability; Juneau Flight Deck explains the options; Viator handles booking and applicable Section 20 Worry-free Shore Excursion protections.",
    availabilityStatus: "calendar_check_required",
  },
  attribution: {
    source: "Viator Partner API & Juneau Part 135 Operator Policies",
    notice:
      "Confirm final price and availability in Viator. Viator's Worry-free Shore Excursion guarantee (Viator Terms of Use Section 20, Tag 367649) applies to qualifying tours such as 6251SHOREXICEWALK.",
    poweredBy: "Official Viator Partner (pid=P00058396)",
  },
  browseHref:
    "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK?pid=P00058396&mcid=42383&medium=api&campaign=jfd-catalog-featured",
  waitlistHref: "/helicopter-waitlist",
};
