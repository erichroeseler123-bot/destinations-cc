export interface EarthOsHappening {
  id: string;
  title: string;
  category: string;
  type: "tour" | "event" | "transit" | "intel" | "private";
  startTime: string; // ISO 8601 string representing departure or start time
  durationLabel: string; // e.g. "2 hours", "30 min ride"
  price: number | null; // null represents free/included
  priceLabel: string; // e.g. "$59 per person", "Free"
  imageUrl: string;
  images?: string[]; // Array of structural image URLs passed by providers
  fallbackImage?: string; // High-performance localized backup asset
  actionUrl: string; // DCC /out/ path or checkout URL
  actionText: string; // CTA copy
  urgencyLabel: string | null; // e.g. "2 seats left", "Pulsing alert text"
  distanceText: string; // e.g. "0.3 miles away", "Hotel pickup included"
  coordinates: {
    lat: number;
    lng: number;
  };
  whyItFits: string; // Punchy rationale card explanation
  isOwned?: boolean; // Yield priority indicator
  occurrences?: {
    id: string;
    startTime: string;
    checkoutUrl: string;
  }[];
}

export const MOCK_48H_INVENTORY: EarthOsHappening[] = [
  // --- NEW ORLEANS / SWAMP ---
  {
    id: "nola-airboat-swamp",
    title: "High-Speed Swamp Airboat Tour",
    category: "Airboat Swamp",
    type: "tour",
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(), // now + 2h 15m
    durationLabel: "1 hr 45 min",
    price: 59,
    priceLabel: "$59 per person",
    imageUrl: "/images/travel-markets/new-orleans/airboat-swamp.png",
    actionUrl: "/out/welcome-to-swamp-provider-guide",
    actionText: "Book Airboat Pass",
    urgencyLabel: "3 seats left",
    distanceText: "Hotel pickup included",
    coordinates: { lat: 29.843, lng: -90.117 },
    whyItFits: "Departing soonest. Clear skies in the bayou make this the perfect window for alligator sightings."
  },
  {
    id: "nola-covered-swamp",
    title: "Cajun Pride Covered Pontoon Cruise",
    category: "Swamp Boat",
    type: "tour",
    startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // now + 4h
    durationLabel: "2 hours",
    price: 49,
    priceLabel: "$49 per person",
    imageUrl: "/images/travel-markets/new-orleans/swamp-boat.png",
    actionUrl: "/out/welcome-to-swamp-provider-guide",
    actionText: "Reserve Shaded Cabin",
    urgencyLabel: "Shaded seats open",
    distanceText: "Drive-out meeting point",
    coordinates: { lat: 30.065, lng: -90.412 },
    whyItFits: "Best for groups and families. Relax under a fully covered roof during the afternoon heat peak."
  },
  {
    id: "nola-plantation-combo",
    title: "Oak Alley & Airboat Swamp Combo",
    category: "Swamp Plantation Combo",
    type: "tour",
    startTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(), // now + 26h (tomorrow morning)
    durationLabel: "6 hours",
    price: 119,
    priceLabel: "$119 per person",
    imageUrl: "/images/travel-markets/new-orleans/swamp-plantation-combo.png",
    actionUrl: "/out/welcome-to-swamp-provider-guide",
    actionText: "Book Full Day Combo",
    urgencyLabel: "Booking cutoff tonight",
    distanceText: "Bus pickup in French Quarter",
    coordinates: { lat: 30.004, lng: -90.785 },
    whyItFits: "Combines historic Oak Alley guides with a high-speed airboat cruise. Pre-pickup is at 8:30 AM tomorrow."
  },
  {
    id: "nola-french-quarter-orientation",
    title: "French Quarter Visitor Welcome & Packet",
    category: "Orientation Guide",
    type: "intel",
    startTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // now + 30m
    durationLabel: "15 min walk-in",
    price: null,
    priceLabel: "Free",
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-orientation.png",
    actionUrl: "/out/french-quarter-owned-booking",
    actionText: "Get Welcome Packet",
    urgencyLabel: "Walk-ins open until 5 PM",
    distanceText: "0.2 miles away (Jackson Square)",
    coordinates: { lat: 29.957, lng: -90.063 },
    whyItFits: "Your local starting line. Pick up dynamic paper maps, restaurant discount coupons, and neighborhood guides."
  },

  // --- DENVER / RED ROCKS ---
  {
    id: "redrocks-roundtrip-shuttle",
    title: "Round-Trip Concert Shuttle",
    category: "Concert Logistics",
    type: "transit",
    startTime: new Date(Date.now() + 5 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // now + 5h 30m
    durationLabel: "45 min drive each way",
    price: 59,
    priceLabel: "$59 per passenger",
    imageUrl: "/images/travel-markets/red-rocks/shuttle.png",
    actionUrl: "/out/red-rocks-owned-booking",
    actionText: "Reserve Shuttle Ticket",
    urgencyLabel: "Only 4 seats remaining",
    distanceText: "Departing from Denver Downtown",
    coordinates: { lat: 39.739, lng: -104.990 },
    whyItFits: "Eliminate post-show rideshare lockouts. Bus departs downtown at 4:30 PM and returns 30 min after final encore."
  },
  {
    id: "redrocks-vip-tailgate",
    title: "VIP Concert Tailgate + Transport",
    category: "VIP Logistics",
    type: "transit",
    startTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // now + 5h
    durationLabel: "5 hours total event",
    price: 89,
    priceLabel: "$89 per passenger",
    imageUrl: "/images/travel-markets/red-rocks/vip.png",
    actionUrl: "/out/red-rocks-owned-booking",
    actionText: "Book VIP Tailgate Pass",
    urgencyLabel: "2 seats left",
    distanceText: "Tailgate area opens at 4:00 PM",
    coordinates: { lat: 39.665, lng: -105.205 },
    whyItFits: "Includes pre-concert craft beers, standard tailgating buffet in Lower South Lot, and VIP bus return."
  },
  {
    id: "redrocks-private-charter",
    title: "Private Group Concert Transit",
    category: "Group Logistics",
    type: "transit",
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // now + 24h
    durationLabel: "Custom timing",
    price: 450,
    priceLabel: "$450 private charter",
    imageUrl: "/images/travel-markets/red-rocks/private.png",
    actionUrl: "/out/red-rocks-owned-booking",
    actionText: "Request Group Coach",
    urgencyLabel: "Requires 12h confirmation",
    distanceText: "Custom hotel pickup",
    coordinates: { lat: 39.739, lng: -104.990 },
    whyItFits: "Dedicated private Mercedes Sprinter package for groups up to 14. Custom departure and cooler setup included."
  },
  {
    id: "argo-cablecar-shuttle-9am",
    title: "9AM Shuttle to the Mighty Argo Cable Car",
    category: "Private Shuttle",
    type: "private",
    startTime: (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow.toISOString();
    })(),
    durationLabel: "30 min ride",
    price: 35,
    priceLabel: "$35 round-trip",
    imageUrl: "/images/travel-markets/red-rocks/shuttle.png",
    actionUrl: "/out/red-rocks-owned-booking",
    actionText: "Reserve Shuttle Ticket",
    urgencyLabel: "Only 4 seats remaining",
    distanceText: "Departing from Denver Downtown (Union Station)",
    coordinates: { lat: 39.739, lng: -104.990 },
    whyItFits: "Direct morning connection to the Mighty Argo Cable Car. Departs Union Station at 9:00 AM."
  },

  // --- WISCONSIN (SOMERSET & EAU CLAIRE) ---
  {
    id: "wisconsin-somerset-vip",
    title: "Somerset VIP Concert Shuttle",
    category: "Concert Logistics",
    type: "transit",
    startTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // now + 8h
    durationLabel: "Private charter",
    price: 500,
    priceLabel: "$500 round-trip (6-8 group)",
    imageUrl: "/images/travel-markets/wisconsin/somerset.png",
    actionUrl: "/out/somerset-owned-booking",
    actionText: "Request Private Van",
    urgencyLabel: "Driver dispatch pending",
    distanceText: "Twin Cities pickup",
    coordinates: { lat: 45.124, lng: -92.674 },
    whyItFits: "Private group shuttle to Somerset Amphitheater. Driver waits during the concert. Tailgate setup included."
  },
  {
    id: "wisconsin-ecto-msp",
    title: "EC2MSP Airport Transfer",
    category: "Airport Transit",
    type: "transit",
    startTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // now + 12h
    durationLabel: "1 hr 30 min ride",
    price: 249,
    priceLabel: "$249 one-way / $450 RT",
    imageUrl: "/images/travel-markets/wisconsin/ecto.png",
    actionUrl: "/out/ec2msp-reservation",
    actionText: "Book MSP Transfer",
    urgencyLabel: "No credit card needed to book",
    distanceText: "Eau Claire pickup",
    coordinates: { lat: 44.811, lng: -91.498 },
    whyItFits: "Direct private airport shuttle from Eau Claire to MSP. Rates preserve balance and include cash discounts."
  },
  {
    id: "wisconsin-bluehills-firewood",
    title: "Firewood & Cabin Convenience Delivery",
    category: "Cabin Supply Drops",
    type: "intel",
    startTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // now + 3h
    durationLabel: "Delivered in 3 hours",
    price: 45,
    priceLabel: "$45 drop off",
    imageUrl: "/images/travel-markets/wisconsin/bluehills.png",
    actionUrl: "/out/blue-hills-outpost-form",
    actionText: "Order Firewood Pack",
    urgencyLabel: "Delivering until 8 PM",
    distanceText: "Blue Hills / Chetek area",
    coordinates: { lat: 45.283, lng: -91.554 },
    whyItFits: "Dry kiln-seasoned oak firewood bundles, fire starters, and ice drop-off. Perfect for cabin weekenders."
  },

  // --- JUNEAU / ALASKA ---
  {
    id: "juneau-helicopter-glacier",
    title: "Juneau Glacier Helicopter Tour",
    category: "Helicopter Shore Excursion",
    type: "tour",
    startTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(), // now + 1h 30m
    durationLabel: "2 hours total",
    price: 329,
    priceLabel: "$329 per person",
    imageUrl: "/images/travel-markets/juneau/helicopter.png",
    actionUrl: "/out/juneau-affiliate-helicopter",
    actionText: "Compare Helicopter Tours",
    urgencyLabel: "Weather advisory: Clear flight paths",
    distanceText: "Pickup from Cruise Dock",
    coordinates: { lat: 58.301, lng: -134.419 },
    whyItFits: "Highly weather-sensitive. Clear morning skies verify flight eligibility. Highly recommended to book this slot."
  },
  {
    id: "juneau-whale-watching",
    title: "Auke Bay Whale Watching Cruise",
    category: "Whale Watching Shore Excursion",
    type: "tour",
    startTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // now + 3h
    durationLabel: "3 hours",
    price: 149,
    priceLabel: "$149 per person",
    imageUrl: "/images/travel-markets/juneau/whale.png",
    actionUrl: "/out/juneau-affiliate-helicopter",
    actionText: "Compare Whale Tours",
    urgencyLabel: "Guaranteed sightings",
    distanceText: "Short walk from cruise dock",
    coordinates: { lat: 58.384, lng: -134.646 },
    whyItFits: "Optimal weather backup. Operates in rain or light clouds with high sighting rates in Auke Bay today."
  }
];

export function listMock48hInventory(): EarthOsHappening[] {
  return MOCK_48H_INVENTORY;
}

export interface ChildOccurrence {
  id: string;
  startTime: string; // ISO String
  price: number;
  isOwned: boolean;  // true for GoSno, PARR, Somerset, ECTO
  checkoutUrl: string;
}

const CUTOFF_MS = 30 * 60 * 1000;      // 30-minute hard booking cutoff
const YIELD_WINDOW_MS = 60 * 60 * 1000; // 60-minute window for yield override

export function determineDefaultSelection(occurrences: ChildOccurrence[]): ChildOccurrence | null {
  const now = Date.now();

  // Step 1: Binary filter for logistical validity
  const validOccurrences = occurrences
    .filter(occ => new Date(occ.startTime).getTime() - now > CUTOFF_MS)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  if (validOccurrences.length === 0) return null;

  // Step 2: Establish chronological baseline
  const earliestSlot = validOccurrences[0];
  const earliestTime = new Date(earliestSlot.startTime).getTime();

  // Step 3: Scan the 60-minute convenient window for an owned high-yield asset override
  const highYieldOverride = validOccurrences.find(occ => {
    const occTime = new Date(occ.startTime).getTime();
    return (occTime - earliestTime <= YIELD_WINDOW_MS) && occ.isOwned;
  });

  // Step 4: Return optimal target
  return highYieldOverride || earliestSlot;
}

