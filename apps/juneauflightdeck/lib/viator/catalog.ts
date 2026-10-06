import type { ViatorJuneauProduct, ViatorJuneauProductsResponse } from "./types";

/**
 * Verified operator experience catalog for Juneau glacier helicopter flights.
 * Used when direct live Viator API inventory is updating or not actively returning products.
 *
 * All photography utilizes verified, approved local Alaska assets (public domain / CC BY-SA).
 * Unsupported fields (e.g. fabricated star ratings, review counts, unverified exact rates)
 * are excluded.
 */
export const SNAPSHOT_TIMESTAMP = "2026-10-06T12:00:00.000Z";

export const VERIFIED_FALLBACK_SNAPSHOT: ViatorJuneauProduct[] = [
  {
    id: "temsco-mendenhall-glacier-walk",
    productCode: "temsco-mendenhall-glacier-walk",
    title: "Mendenhall Glacier Helicopter Tour & Guided Ice Walk",
    description:
      "Fly over Juneau's coastal rainforest and rugged granite peaks before landing directly on the ancient ice of Mendenhall Glacier for a guided glacier walk.",
    durationMinutes: 135,
    durationLabel: "2 hr 15 min",
    priceLabel: "Schedule & Rates On Request",
    priceFrom: null,
    currency: "USD",
    priceDisclaimer:
      "Rates and schedule departures verified upon booking inquiry. Part 135 FAA certified flight operations.",
    imageUrl: "/images/tours/temsco-mendenhall-glacier-walk.jpg",
    imageAlt: "Helicopter landing on Mendenhall Glacier blue ice near Juneau, Alaska",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "TEMSCO Helicopters",
    rating: null,
    reviewCount: null,
    badges: ["Signature Glacier Landing", "Part 135 Certified"],
    cancellationPolicy: "Operator Weather Guarantee · 100% refund if flight is grounded due to weather",
    bookHref:
      "https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+Helicopters&pid=P00058396&mcid=42383&medium=api",
    tourType: "glacier_landing",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
  {
    id: "temsco-glacier-dog-sledding",
    productCode: "temsco-glacier-dog-sledding",
    title: "Helicopter Glacier Dog Sledding Tour",
    description:
      "Soar over the Juneau Icefield to an authentic high-altitude glacier dog sled camp. Meet Alaskan huskies and glide across snowfields driven by veteran mushers.",
    durationMinutes: 165,
    durationLabel: "2 hr 45 min",
    priceLabel: "Schedule & Rates On Request",
    priceFrom: null,
    currency: "USD",
    priceDisclaimer:
      "Rates and schedule departures verified upon booking inquiry. Part 135 FAA certified flight operations.",
    imageUrl: "/images/tours/temsco-glacier-dog-sledding.jpg",
    imageAlt: "Alaskan husky dog sled team and musher on Juneau glacier snowfield",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "TEMSCO Helicopters",
    rating: null,
    reviewCount: null,
    badges: ["Glacier Dog Sledding", "Part 135 Certified"],
    cancellationPolicy: "Operator Weather Guarantee · 100% refund if flight is grounded due to weather",
    bookHref:
      "https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+dog+sledding&pid=P00058396&mcid=42383&medium=api",
    tourType: "dog_sledding",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
  {
    id: "coastal-icefield-landing",
    productCode: "coastal-icefield-landing",
    title: "Juneau Icefield Helicopter Flight & Glacier Landing",
    description:
      "Experience dramatic aerial panoramas of Herbert Glacier, deep crevasses, and cascading icefalls before touching down for an up-close glacier ice exploration.",
    durationMinutes: 150,
    durationLabel: "2 hr 30 min",
    priceLabel: "Schedule & Rates On Request",
    priceFrom: null,
    currency: "USD",
    priceDisclaimer:
      "Rates and schedule departures verified upon booking inquiry. Part 135 FAA certified flight operations.",
    imageUrl: "/images/tours/coastal-icefield-landing.jpg",
    imageAlt: "Aerial view of Juneau Icefield and glacier icefalls",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "Coastal Helicopters",
    rating: null,
    reviewCount: null,
    badges: ["Icefield Flight & Landing", "Part 135 Certified"],
    cancellationPolicy: "Operator Weather Guarantee · 100% refund if flight is grounded due to weather",
    bookHref:
      "https://www.viator.com/searchResults/all?text=Juneau+Coastal+Helicopters&pid=P00058396&mcid=42383&medium=api",
    tourType: "glacier_landing",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
  {
    id: "northstar-glacier-ice-trek",
    productCode: "northstar-glacier-ice-trek",
    title: "Small-Group Glacier Ice Trek & Mountaineering",
    description:
      "Equipped with crampons, harnesses, and ice axes, venture deep into pristine glacier territory to explore dramatic blue ice walls, moulins, and glacial formations.",
    durationMinutes: 240,
    durationLabel: "4 hr",
    priceLabel: "Schedule & Rates On Request",
    priceFrom: null,
    currency: "USD",
    priceDisclaimer:
      "Rates and schedule departures verified upon booking inquiry. Part 135 FAA certified flight operations.",
    imageUrl: "/images/tours/northstar-glacier-ice-trek.jpg",
    imageAlt: "Guided mountaineering exploration of deep glacier ice terrain in Juneau",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "NorthStar Trekking",
    rating: null,
    reviewCount: null,
    badges: ["Small-Group Adventure", "Part 135 Certified"],
    cancellationPolicy: "Operator Weather Guarantee · 100% refund if flight is grounded due to weather",
    bookHref:
      "https://www.viator.com/searchResults/all?text=Juneau+NorthStar+Trekking&pid=P00058396&mcid=42383&medium=api",
    tourType: "ice_trek",
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
  Coastal: [VIATOR_TOURS_BY_CODE["coastal-icefield-landing"]],
  NorthStar: [VIATOR_TOURS_BY_CODE["northstar-glacier-ice-trek"]],
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
      "Live Viator booking calendar currently unavailable through the direct API feed. Explore verified Juneau operator flight profiles below and set up availability alerts.",
    availabilityStatus: "calendar_check_required",
  },
  attribution: {
    source: "Juneau Operator Profiles & Viator Partner Network",
    notice:
      "Operator flight profiles with approved Alaska photography. Live departures, real-time rates, and calendar bookings are confirmed through Viator or direct operator inquiry.",
    poweredBy: "Official Viator Partner",
  },
  browseHref:
    "https://www.viator.com/Juneau-tourism/d941-r8418047970-s323605581?pid=P00058396&mcid=42383&medium=api",
  waitlistHref: "/helicopter-waitlist",
};
