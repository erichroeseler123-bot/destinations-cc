import type { ViatorJuneauProduct, ViatorJuneauProductsResponse } from "./types";

/**
 * Historical snapshot timestamp for verified fallback catalog data.
 * Real-time prices, availability, and review counts are never claimed as current live
 * results when this fallback is served.
 */
export const SNAPSHOT_TIMESTAMP = "2026-10-01T12:00:00.000Z";

export const VERIFIED_FALLBACK_SNAPSHOT: ViatorJuneauProduct[] = [
  {
    id: "10423P1",
    productCode: "10423P1",
    title: "Mendenhall Glacier Helicopter Tour and Guided Walk",
    description:
      "Take flight over the lush rainforest and granite peaks of Juneau before landing directly on the ice of Mendenhall Glacier for a guided glacier walk.",
    durationMinutes: 135,
    durationLabel: "2 hr 15 min",
    priceLabel: "from $399 (historical reference)",
    priceFrom: 399,
    currency: "USD",
    priceDisclaimer:
      "Historical snapshot rate as of Oct 2026. Live pricing and departure times are verified in the booking calendar.",
    imageUrl:
      "https://hare-media-cdn.tripadvisor.com/media/attractions-splice-spp-720x480/07/90/5a/68.jpg",
    imageAlt: "Helicopter landing on Mendenhall Glacier ice near Juneau, Alaska",
    imageSource: "SUPPLIER_PROVIDED",
    supplierName: "TEMSCO Helicopters",
    rating: 4.8,
    reviewCount: 428,
    badges: ["Signature Glacier Landing"],
    cancellationPolicy: "Check live listing for current cancellation terms",
    bookHref:
      "https://www.viator.com/tours/Juneau/Mendenhall-Glacier-Helicopter-Tour-and-Guided-Walk/d941-10423P1?pid=P00058396&mcid=42383&medium=api",
    tourType: "glacier_landing",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
  {
    id: "10423P2",
    productCode: "10423P2",
    title: "Helicopter Glacier Dog Sledding Tour from Juneau",
    description:
      "Soar over the Juneau Icefield to a remote glacier dog sled camp. Meet Alaskan huskies and glide across pristine snowfields driven by professional mushers.",
    durationMinutes: 165,
    durationLabel: "2 hr 45 min",
    priceLabel: "from $649 (historical reference)",
    priceFrom: 649,
    currency: "USD",
    priceDisclaimer:
      "Historical snapshot rate as of Oct 2026. Live pricing and departure times are verified in the booking calendar.",
    imageUrl:
      "https://hare-media-cdn.tripadvisor.com/media/attractions-splice-spp-720x480/06/fa/b9/11.jpg",
    imageAlt: "Alaskan husky dog sled team on glacier snowfield in Juneau",
    imageSource: "SUPPLIER_PROVIDED",
    supplierName: "TEMSCO Helicopters",
    rating: 4.9,
    reviewCount: 312,
    badges: ["Dog Sled Combo"],
    cancellationPolicy: "Check live listing for current cancellation terms",
    bookHref:
      "https://www.viator.com/tours/Juneau/Helicopter-Glacier-Dog-Sledding-Tour/d941-10423P2?pid=P00058396&mcid=42383&medium=api",
    tourType: "dog_sledding",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
  {
    id: "25488P1",
    productCode: "25488P1",
    title: "Juneau Icefield Helicopter Tour with Glacier Landing",
    description:
      "Experience breathtaking aerial views of deep crevasses, icefalls, and Herbert Glacier before landing for an up-close exploration of blue glacier ice.",
    durationMinutes: 150,
    durationLabel: "2 hr 30 min",
    priceLabel: "from $419 (historical reference)",
    priceFrom: 419,
    currency: "USD",
    priceDisclaimer:
      "Historical snapshot rate as of Oct 2026. Live pricing and departure times are verified in the booking calendar.",
    imageUrl:
      "https://hare-media-cdn.tripadvisor.com/media/attractions-splice-spp-720x480/09/c5/d2/c7.jpg",
    imageAlt: "Aerial view of helicopter over deep blue crevasses in Juneau icefield",
    imageSource: "SUPPLIER_PROVIDED",
    supplierName: "Coastal Helicopters",
    rating: 4.7,
    reviewCount: 265,
    badges: ["Icefield Flightseeing & Landing"],
    cancellationPolicy: "Check live listing for current cancellation terms",
    bookHref:
      "https://www.viator.com/tours/Juneau/Juneau-Icefield-Helicopter-Tour/d941-25488P1?pid=P00058396&mcid=42383&medium=api",
    tourType: "glacier_landing",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
  {
    id: "3129P1",
    productCode: "3129P1",
    title: "Glacier Ice Trek & Climb by Helicopter",
    description:
      "Equipped with crampons and mountaineering gear, trek deep into the glacier interior and explore dramatic ice towers, moulins, and blue ice crevices.",
    durationMinutes: 240,
    durationLabel: "4 hr",
    priceLabel: "from $589 (historical reference)",
    priceFrom: 589,
    currency: "USD",
    priceDisclaimer:
      "Historical snapshot rate as of Oct 2026. Live pricing and departure times are verified in the booking calendar.",
    imageUrl:
      "https://hare-media-cdn.tripadvisor.com/media/attractions-splice-spp-720x480/07/90/5a/6a.jpg",
    imageAlt: "Guided ice trekker with crampons exploring deep glacier crevasse in Alaska",
    imageSource: "SUPPLIER_PROVIDED",
    supplierName: "NorthStar Trekking",
    rating: 4.9,
    reviewCount: 184,
    badges: ["Glacier Ice Trek"],
    cancellationPolicy: "Check live listing for current cancellation terms",
    bookHref:
      "https://www.viator.com/tours/Juneau/Glacier-Ice-Trek-by-Helicopter/d941-3129P1?pid=P00058396&mcid=42383&medium=api",
    tourType: "ice_trek",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
];

export const VIATOR_TOURS_BY_CODE: Record<string, ViatorJuneauProduct> = Object.fromEntries(
  VERIFIED_FALLBACK_SNAPSHOT.map((t) => [t.productCode, t])
);

export const VIATOR_TOURS_BY_OPERATOR: Record<string, ViatorJuneauProduct[]> = {
  TEMSCO: [VIATOR_TOURS_BY_CODE["10423P1"], VIATOR_TOURS_BY_CODE["10423P2"]],
  Coastal: [VIATOR_TOURS_BY_CODE["25488P1"]],
  NorthStar: [VIATOR_TOURS_BY_CODE["3129P1"]],
};

export const DEFAULT_FALLBACK_RESPONSE: ViatorJuneauProductsResponse = {
  ok: true,
  generatedAt: SNAPSHOT_TIMESTAMP,
  products: VERIFIED_FALLBACK_SNAPSHOT,
  isLive: false,
  status: "cached_snapshot",
  snapshotTimestamp: SNAPSHOT_TIMESTAMP,
  selectedDate: null,
  passengerCount: 2,
  signals: {
    availabilityStatus: "calendar_check_required",
  },
  attribution: {
    source: "Viator Partner API",
    notice: "Total review count, ratings, and supplier photos provided via Viator Partner API.",
    poweredBy: "Official Viator Partner",
  },
  browseHref:
    "https://www.viator.com/Juneau-tourism/d941-r8418047970-s323605581?pid=P00058396&mcid=42383&medium=api",
};


