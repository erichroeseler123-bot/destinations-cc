import type { ViatorJuneauProduct, ViatorJuneauProductsResponse } from "./types";

/**
 * Verified operator experience catalog for Juneau glacier helicopter flights.
 * Reflects genuine operator products, published direct base pricing, operating seasons,
 * and certified Part 135 flight operations for TEMSCO, Coastal, and NorthStar.
 *
 * All photography utilizes verified, approved local Alaska assets (public domain / CC BY-SA).
 */
export const SNAPSHOT_TIMESTAMP = "2026-10-07T12:00:00.000Z";

export const VERIFIED_FALLBACK_SNAPSHOT: ViatorJuneauProduct[] = [
  {
    id: "temsco-mendenhall-glacier-walk",
    productCode: "temsco-mendenhall-glacier-walk",
    title: "TEMSCO Mendenhall Glacier Helicopter Tour & Guided Ice Walk",
    description:
      "Fly over Juneau's coastal rainforest and rugged granite spires before landing directly on the ancient blue ice of Mendenhall Glacier for a 20-25 minute guided walk with provided traction overboots.",
    durationMinutes: 135,
    durationLabel: "2 hr 15 min",
    priceLabel: "From $409 base / person",
    priceFrom: 409,
    currency: "USD",
    priceDisclaimer:
      "Direct operator rate from $409 base (~$442 at checkout with local tax & booking fee). Part 135 FAA certified.",
    imageUrl: "/images/tours/temsco-mendenhall-glacier-walk.jpg",
    imageAlt: "Helicopter landing on Mendenhall Glacier blue ice near Juneau, Alaska",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "TEMSCO Helicopters",
    rating: null,
    reviewCount: null,
    badges: ["Signature Mendenhall Landing", "Part 135 Certified", "All Ages (2+)"],
    cancellationPolicy: "48h customer cutoff · 100% refund if grounded for weather or ship delays",
    bookHref:
      "https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+Helicopters&pid=P00058396&mcid=42383&medium=api",
    directOperatorHref:
      "https://fareharbor.com/embeds/book/temscoair-juneau/items/214803/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes",
    directOperatorName: "TEMSCO Direct (FareHarbor)",
    tourType: "glacier_landing",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
  {
    id: "temsco-glacier-dog-sledding",
    productCode: "temsco-glacier-dog-sledding",
    title: "TEMSCO Helicopter Glacier Dog Sledding on Herbert Glacier",
    description:
      "Fly over the Juneau Icefield to an authentic high-altitude dog sled camp on Herbert Glacier snowfields. Meet racing huskies and mushers and ride across alpine snow (operates mid-May through late August).",
    durationMinutes: 165,
    durationLabel: "2 hr 45 min",
    priceLabel: "From $659 base / person",
    priceFrom: 659,
    currency: "USD",
    priceDisclaimer:
      "Direct operator rate from $659 base (~$712 at checkout with local tax & booking fee). Seasonal: May–Aug.",
    imageUrl: "/images/tours/temsco-glacier-dog-sledding.jpg",
    imageAlt: "Alaskan husky dog sled team and musher on Juneau glacier snowfield",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "TEMSCO Helicopters",
    rating: null,
    reviewCount: null,
    badges: ["Herbert Glacier Snow Camp", "Part 135 Certified", "Iditarod Mushers"],
    cancellationPolicy: "48h customer cutoff · 100% refund if grounded for weather or ship delays",
    bookHref:
      "https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+dog+sledding&pid=P00058396&mcid=42383&medium=api",
    directOperatorHref:
      "https://fareharbor.com/embeds/book/temscoair-juneau/items/214810/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes",
    directOperatorName: "TEMSCO Direct (FareHarbor)",
    tourType: "dog_sledding",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
  {
    id: "coastal-icefield-landing",
    productCode: "coastal-icefield-landing",
    title: "Coastal Icefield Helicopter Tour & Herbert Glacier Landing",
    description:
      "Experience scenic aerial panoramas of Herbert Glacier, deep mountain passes, and waterfalls before touching down for 25-30 minutes of guided exploration on the ice.",
    durationMinutes: 135,
    durationLabel: "2 hr 15 min",
    priceLabel: "From $429 base / person",
    priceFrom: 429,
    currency: "USD",
    priceDisclaimer:
      "Direct operator published rate from $429 base (~$463 at checkout with local tax & fee). Part 135 FAA certified.",
    imageUrl: "/images/tours/coastal-icefield-landing.jpg",
    imageAlt: "Aerial view of Juneau Icefield and glacier icefalls",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "Coastal Helicopters",
    rating: null,
    reviewCount: null,
    badges: ["Herbert Glacier Landing", "Part 135 Certified", "Scenic Flightseeing"],
    cancellationPolicy: "7-day customer cutoff · 100% refund if grounded for weather or ship delays",
    bookHref:
      "https://www.viator.com/searchResults/all?text=Juneau+Coastal+Helicopters&pid=P00058396&mcid=42383&medium=api",
    directOperatorHref:
      "https://fareharbor.com/embeds/book/coastalhelicopters/items/413056/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes",
    directOperatorName: "Coastal Direct (FareHarbor)",
    tourType: "glacier_landing",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
  {
    id: "coastal-glacier-dog-sledding",
    productCode: "coastal-glacier-dog-sledding",
    title: "Coastal Helicopter Dog Sled Tour on Herbert Glacier",
    description:
      "Fly by helicopter to an alpine dog camp on Herbert Glacier snowfields. Meet racing huskies and mushers and experience a dog sled run across high snowfields (operates mid-May to mid-August).",
    durationMinutes: 165,
    durationLabel: "2 hr 45 min",
    priceLabel: "From $709 base / person",
    priceFrom: 709,
    currency: "USD",
    priceDisclaimer:
      "Direct operator published rate from $709 base (~$766 at checkout with local tax & fee). Seasonal: mid-May to mid-August.",
    imageUrl: "/images/tours/temsco-glacier-dog-sledding.jpg",
    imageAlt: "Coastal Helicopters dog sledding excursion on Herbert Glacier snowfield",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "Coastal Helicopters",
    rating: null,
    reviewCount: null,
    badges: ["Herbert Glacier Camp", "Part 135 Certified", "Seasonal: May–Aug"],
    cancellationPolicy: "7-day customer cutoff · 100% refund if grounded for weather or ship delays",
    bookHref:
      "https://www.viator.com/searchResults/all?text=Juneau+Coastal+dog+sledding&pid=P00058396&mcid=42383&medium=api",
    directOperatorHref:
      "https://coastalhelicopters.com/tours/dog-sled-tours/",
    directOperatorName: "Coastal Direct",
    tourType: "dog_sledding",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
  {
    id: "northstar-glacier-walkabout",
    productCode: "northstar-glacier-walkabout",
    title: "NorthStar Helicopter Glacier Walkabout (1 Hour on Mendenhall Ice)",
    description:
      "Fly to Mendenhall Glacier and spend a full hour exploring on ice with crampons and trekking poles. Gentle-to-moderate walking suited for active travelers ages 8+.",
    durationMinutes: 195,
    durationLabel: "3 hr 15 min",
    priceLabel: "From $499 base / person",
    priceFrom: 499,
    currency: "USD",
    priceDisclaimer:
      "Direct operator published rate from $499 base (~$539 at checkout with local tax & fee). FareHarbor item 116029.",
    imageUrl: "/images/tours/northstar-glacier-ice-trek.jpg",
    imageAlt: "NorthStar Helicopter Glacier Walkabout on Mendenhall Glacier ice",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "NorthStar Trekking",
    rating: null,
    reviewCount: null,
    badges: ["Full 1 Hour on Ice", "Part 135 Certified", "Crampons & Poles Provided"],
    cancellationPolicy: "48h customer cutoff · 100% refund if grounded for weather or ship delays",
    bookHref:
      "https://www.viator.com/searchResults/all?text=Juneau+NorthStar+Glacier+Walkabout&pid=P00058396&mcid=42383&medium=api",
    directOperatorHref:
      "https://fareharbor.com/embeds/book/northstartrekking/items/116029/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes",
    directOperatorName: "NorthStar Direct (FareHarbor)",
    tourType: "glacier_landing",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
  {
    id: "northstar-glacier-ice-trek",
    productCode: "northstar-glacier-ice-trek",
    title: "NorthStar Level 1 Helicopter Glacier Ice Trek (2 Hours on Ice)",
    description:
      "Equipped with mountaineering boots, crampons, harness, and trekking poles, hike deep into Mendenhall Glacier's sculpted blue ice walls, crevasses, and moulins (ages 12+).",
    durationMinutes: 255,
    durationLabel: "4 hr 15 min",
    priceLabel: "From $549 base / person",
    priceFrom: 549,
    currency: "USD",
    priceDisclaimer:
      "Direct operator published rate from $549 base (~$593 at checkout with local tax & fee). FareHarbor item 116035.",
    imageUrl: "/images/tours/northstar-glacier-ice-trek.jpg",
    imageAlt: "Guided mountaineering exploration of deep glacier ice terrain in Juneau",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "NorthStar Trekking",
    rating: null,
    reviewCount: null,
    badges: ["2 Hours on Ice", "Part 135 Certified", "Technical Crampons"],
    cancellationPolicy: "48h customer cutoff · 100% refund if grounded for weather or ship delays",
    bookHref:
      "https://www.viator.com/searchResults/all?text=Juneau+NorthStar+Trekking&pid=P00058396&mcid=42383&medium=api",
    directOperatorHref:
      "https://fareharbor.com/embeds/book/northstartrekking/items/116035/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes",
    directOperatorName: "NorthStar Direct (FareHarbor)",
    tourType: "ice_trek",
    isLive: false,
    dataTimestamp: SNAPSHOT_TIMESTAMP,
  },
  {
    id: "northstar-glacier-dogsled-adventure",
    productCode: "northstar-glacier-dogsled-adventure",
    title: "NorthStar Helicopter Glacier Dogsled Adventure on Norris Glacier",
    description:
      "Fly across the Juneau Icefield to Norris Glacier for an authentic dog sledding experience with an Iditarod musher partner camp (operates summer snow season, ages 2+).",
    durationMinutes: 195,
    durationLabel: "3 hr 15 min",
    priceLabel: "From $739 base / person",
    priceFrom: 739,
    currency: "USD",
    priceDisclaimer:
      "Direct operator published rate from $739 base (~$798 at checkout with local tax & fee). FareHarbor item 115991.",
    imageUrl: "/images/tours/temsco-glacier-dog-sledding.jpg",
    imageAlt: "NorthStar Helicopter Glacier Dogsled Adventure on Norris Glacier",
    imageSource: "LOCAL_AUTHORITY",
    supplierName: "NorthStar Trekking",
    rating: null,
    reviewCount: null,
    badges: ["Norris Glacier Camp", "Part 135 Certified", "Ages 2+ Welcome"],
    cancellationPolicy: "48h customer cutoff · 100% refund if grounded for weather or ship delays",
    bookHref:
      "https://www.viator.com/searchResults/all?text=Juneau+NorthStar+dog+sledding&pid=P00058396&mcid=42383&medium=api",
    directOperatorHref:
      "https://fareharbor.com/embeds/book/northstartrekking/items/115991/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes",
    directOperatorName: "NorthStar Direct (FareHarbor)",
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
