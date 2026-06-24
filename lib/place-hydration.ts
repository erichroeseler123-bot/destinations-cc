import { redis } from "@/lib/redis";
import { normalizeViatorProduct, normalizeTicketmasterEvent, normalizeGetYourGuideExperience, normalizeViatorExperience, normalizeGetYourGuideApiTour } from "@/lib/adapters";
import { getApprovedExperiencesForPlace } from "@/lib/getyourguide-approved-experiences";
import { getGetYourGuideServerConfig, hasGetYourGuideApiAccess } from "@/lib/getyourguide/config";

const CACHE_TTL_SECONDS = 86400; // 24-Hour Cache Window

// Fallback coordinate mappings for key destinations
const DESTINATION_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  "new-orleans-la": { lat: 29.9511, lng: -90.0715, name: "New Orleans" },
  "red-rocks-co": { lat: 39.6654, lng: -105.2057, name: "Red Rocks" },
  "eau-claire-wi": { lat: 44.8113, lng: -91.4985, name: "Eau Claire" },
  "juneau-ak": { lat: 58.3019, lng: -134.4197, name: "Juneau" },
  "cozumel": { lat: 20.4229, lng: -86.9223, name: "Cozumel" }
};

export async function hydratePlaceData(id: string) {
  const cacheKey = `dcc:cache:place:${id}`;

  // 1. Cache-Aside Check via Upstash
  if (redis) {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      const parsedData = typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;
      return { source: "cache", data: parsedData };
    }
  }

  // 2. Resolve coordinates and metadata
  const placeConfig = DESTINATION_COORDS[id] || { lat: 29.9511, lng: -90.0715, name: id };
  const targetCoords = { lat: placeConfig.lat, lng: placeConfig.lng };

  const hasViator = Boolean(process.env.VIATOR_API_KEY);
  const hasTicketmaster = Boolean(process.env.TICKETMASTER_API_KEY);

  // 3. Parallel Provider Aggregation
  const [tours, events] = await Promise.all([
    fetchTours(id, targetCoords, hasViator),
    fetchTicketmasterEvents(id, targetCoords, hasTicketmaster)
  ]);

  // Fetch and normalize approved GetYourGuide experiences
  const gygExperiences = getApprovedExperiencesForPlace(id);
  const normalizedGyg = gygExperiences.map((exp) =>
    normalizeGetYourGuideExperience(exp, targetCoords)
  );

  // 4. Edge Assembly
  const normalizedPayload = {
    locationId: id,
    locationName: placeConfig.name,
    coordinates: targetCoords,
    lastUpdated: Date.now(),
    happenings: [...tours, ...normalizedGyg, ...events]
  };

  // 5. Commit to Upstash Cache with 24H Expiration
  if (redis) {
    await redis.set(cacheKey, normalizedPayload, { ex: CACHE_TTL_SECONDS });
  }

  return { source: "network", data: normalizedPayload };
}

const VIATOR_DESTINATION_MAP: Record<string, string> = {
  "new-orleans-la": "675",
  "juneau-ak": "941",
  "cozumel": "309",
  "cozumel-mexico": "309",
  "port-cozumel": "309",
  "nassau": "326",
  "nassau-bahamas": "326",
  "port-nassau": "326",
  "portmiami": "176",
  "portmiami-fl": "176",
  "port-miami": "176",
  "port-canaveral": "329",
  "port-canaveral-orlando-fl": "329",
  "port-everglades": "1392",
  "port-everglades-fort-lauderdale-fl": "1392",
  "key-west": "552",
  "key-west-fl": "552",
  "port-key-west": "552"
};

const GYG_DESTINATION_MAP: Record<string, string> = {
  "new-orleans-la": "375",
  "juneau-ak": "2629",
  "cozumel": "309",
  "cozumel-mexico": "309",
  "port-cozumel": "309",
  "nassau": "326",
  "nassau-bahamas": "326",
  "port-nassau": "326",
  "portmiami": "176",
  "portmiami-fl": "176",
  "port-miami": "176",
  "port-canaveral": "2198",
  "port-canaveral-orlando-fl": "2198",
  "port-everglades": "1392",
  "port-everglades-fort-lauderdale-fl": "1392",
  "key-west": "32962",
  "key-west-fl": "32962",
  "port-key-west": "32962"
};

async function fetchGetYourGuideFallback(placeId: string, coords: { lat: number; lng: number }): Promise<any[]> {
  try {
    const destinationId = GYG_DESTINATION_MAP[placeId] || "unknown";
    if (destinationId === "unknown") return [];

    const config = getGetYourGuideServerConfig();
    if (!config.accessToken) return [];

    // Enforce 3-second timeout for Next.js edge runtime stability
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const apiBase = config.apiBase || "https://api.getyourguide.com";
    const apiVersion = config.apiVersion || "1";
    
    // Construct search URL
    const url = new URL(`${apiBase}/${apiVersion}/tours`);
    url.searchParams.set("location_ids", destinationId);
    url.searchParams.set("limit", "5");
    url.searchParams.set("cnt_language", config.localeCode || "en-US");
    url.searchParams.set("currency", config.currency || "USD");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-ACCESS-TOKEN": config.accessToken
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const payload = await res.json();
    const tours = payload.data?.tours || [];
    return tours.map((tour: any) => normalizeGetYourGuideApiTour(tour, placeId, coords));
  } catch (e) {
    console.error("GetYourGuide fallback search failed or timed out:", e);
    return [];
  }
}

async function fetchTours(placeId: string, coords: { lat: number; lng: number }, hasKey: boolean) {
  let viatorProducts: any[] = [];

  if (hasKey) {
    try {
      const destinationId = VIATOR_DESTINATION_MAP[placeId] || "unknown";
      if (destinationId !== "unknown") {
        // Enforce 3-second timeout for Next.js edge runtime stability
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch("https://api.viator.com/partner/products/search", {
          method: "POST",
          headers: {
            Accept: "application/json;version=2.0",
            "Accept-Language": "en-US",
            "Content-Type": "application/json",
            "exp-api-key": process.env.VIATOR_API_KEY || ""
          },
          body: JSON.stringify({
            filtering: { destination: destinationId, includeAutomaticTranslations: true },
            sorting: { sort: "TRAVELER_RATING", order: "DESCENDING" },
            pagination: { start: 1, count: 5 },
            currency: "USD"
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          viatorProducts = data.products || [];
        }
      }
    } catch (e) {
      console.warn("Viator search failed or timed out, cascading to GetYourGuide fallback:", e);
    }
  }

  // Stage 2 (The Net): If Viator array length is 0 (or failed), cascade to GetYourGuide fallback
  if (viatorProducts.length === 0) {
    const hasGygAccess = hasGetYourGuideApiAccess();
    if (hasGygAccess) {
      const gygTours = await fetchGetYourGuideFallback(placeId, coords);
      if (gygTours && gygTours.length > 0) {
        return gygTours;
      }
    }
    // Fallback to mocks if both Viator and GYG are unavailable or return empty
    return getMockTours(placeId, coords);
  }

  return viatorProducts.map((prod: any) => 
    normalizeViatorExperience(prod, placeId, coords)
  );
}

async function fetchTicketmasterEvents(placeId: string, coords: { lat: number; lng: number }, hasKey: boolean) {
  if (!hasKey) {
    return getMockEvents(placeId, coords);
  }

  try {
    const radiusMiles = "30";
    // Filter out events that have already started
    const nowIso = new Date().toISOString().split('.')[0] + "Z";

    // Strict 3-second timeout for Next.js edge runtime stability
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    url.searchParams.set("apikey", process.env.TICKETMASTER_API_KEY || "");
    url.searchParams.set("latlong", `${coords.lat},${coords.lng}`);
    url.searchParams.set("radius", radiusMiles);
    url.searchParams.set("unit", "miles");
    url.searchParams.set("size", "5");
    url.searchParams.set("sort", "date,asc");
    url.searchParams.set("startDateTime", nowIso);

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) return getMockEvents(placeId, coords);
    const data = await res.json();
    const events = data._embedded?.events || [];
    return events.map((event: any) => 
      normalizeTicketmasterEvent(event, placeId, coords)
    );
  } catch (error) {
    console.error("Ticketmaster fetch failed or timed out. Falling back to mock events:", error);
    return getMockEvents(placeId, coords);
  }
}

function getMockTours(placeId: string, coords: { lat: number; lng: number }) {
  if (placeId === "new-orleans-la") {
    return [
      {
        id: "viator-nola-airboat-mock",
        title: "High-Speed Swamp Airboat Tour",
        category: "Airboat Swamp",
        type: "tour",
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        durationLabel: "1h 45m",
        price: 59,
        priceLabel: "$59 per person",
        imageUrl: "/images/travel-markets/new-orleans/airboat-swamp.png",
        images: ["/images/travel-markets/new-orleans/airboat-swamp.png"],
        actionUrl: "/out/welcome-to-swamp-provider-guide",
        actionText: "Book Airboat Pass",
        urgencyLabel: "3 seats left",
        distanceText: "Hotel pickup included",
        coordinates: coords,
        whyItFits: "Departing soonest. Clear skies in the bayou make this the perfect window for alligator sightings.",
        isOwned: false
      },
      {
        id: "viator-nola-covered-mock",
        title: "Cajun Pride Shaded Pontoon Cruise",
        category: "Swamp Boat",
        type: "tour",
        startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        durationLabel: "2 hours",
        price: 49,
        priceLabel: "$49 per person",
        imageUrl: "/images/travel-markets/new-orleans/swamp-boat.png",
        images: ["/images/travel-markets/new-orleans/swamp-boat.png"],
        actionUrl: "/out/welcome-to-swamp-provider-guide",
        actionText: "Reserve Shaded Cabin",
        urgencyLabel: "Seats open",
        distanceText: "Drive-out meeting point",
        coordinates: coords,
        whyItFits: "Best for families. Relax under a fully covered roof during the afternoon heat peak.",
        isOwned: false
      }
    ];
  }

  if (placeId === "juneau-ak") {
    return [
      {
        id: "viator-juneau-helicopter-mock",
        title: "Juneau Glacier Helicopter Flight",
        category: "Helicopter Shore Excursion",
        type: "tour",
        startTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
        durationLabel: "2 hours total",
        price: 329,
        priceLabel: "$329 per person",
        imageUrl: "/images/travel-markets/juneau/helicopter.png",
        images: ["/images/travel-markets/juneau/helicopter.png"],
        actionUrl: "/out/juneau-affiliate-helicopter",
        actionText: "Compare Helicopter Tours",
        urgencyLabel: "Weather advisory: Clear flight paths",
        distanceText: "Cruise port pickup",
        coordinates: coords,
        whyItFits: "Highly weather-sensitive. Clear morning skies verify flight eligibility.",
        isOwned: false
      }
    ];
  }

  if (placeId === "cozumel") {
    return [
      {
        id: "viator-cozumel-snorkel-mock",
        title: "Cozumel Palancar Reef Snorkeling Tour",
        category: "Catamaran Snorkeling",
        type: "tour",
        startTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        durationLabel: "3.5 hours",
        price: 65,
        priceLabel: "$65 per person",
        imageUrl: "/images/fallback-tour.png",
        images: ["/images/fallback-tour.png"],
        actionUrl: "/out/cozumel-snork-booking",
        actionText: "Book Snorkel Excursion",
        urgencyLabel: "Guaranteed ocean sightings",
        distanceText: "Walk from cruise dock",
        coordinates: coords,
        whyItFits: "Palancar Reef is currently experiencing high visibility under clear waters. Perfect booking window.",
        isOwned: false
      }
    ];
  }

  return [];
}

function getMockEvents(placeId: string, coords: { lat: number; lng: number }) {
  if (placeId === "new-orleans-la") {
    return [
      {
        id: "tm-nola-jazz-mock",
        title: "Jazz and Heritage Band Showcase",
        category: "Music Concert",
        type: "event",
        startTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        durationLabel: "Live Concert",
        price: 40,
        priceLabel: "$40 - $75 tickets",
        imageUrl: "/images/fallback-event.png",
        images: ["/images/fallback-event.png"],
        actionUrl: "/out/tm-nola-jazz-mock",
        actionText: "Buy Official Tickets",
        urgencyLabel: "Limited tickets remain",
        distanceText: "Preservation Hall (French Quarter)",
        coordinates: coords,
        whyItFits: "Live show occurring soon in the heart of the Quarter. Secure logistics parking or guides early.",
        isOwned: false
      }
    ];
  }

  if (placeId === "red-rocks-co") {
    return [
      {
        id: "tm-redrocks-concert-mock",
        title: "Red Rocks Summer Symphony Showcase",
        category: "Rock Concert",
        type: "event",
        startTime: new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString(),
        durationLabel: "Live Concert",
        price: 65,
        priceLabel: "$65 - $150 tickets",
        imageUrl: "/images/fallback-event.png",
        images: ["/images/fallback-event.png"],
        actionUrl: "/out/red-rocks-owned-booking",
        actionText: "Buy Official Tickets",
        urgencyLabel: "Encore show tonight",
        distanceText: "Red Rocks Amphitheatre",
        coordinates: coords,
        whyItFits: "Live concert in the foothills. Secure Union Station departure shuttle tickets directly below.",
        isOwned: false
      }
    ];
  }

  return [];
}

export interface WebcamConfig {
  id: string;
  mediaUrl: string;
  mediaType: "video" | "image";
  user: {
    name: string;
    avatar: string;
    handle: string;
    provider: "google" | "twitter" | "apple";
    isTelemetry?: boolean;
  };
  timestamp: string;
  relativeTime: string;
  caption: string;
}

const WEBCAM_REGISTRY: Record<string, WebcamConfig> = {
  "red-rocks-co": {
    id: "webcam-red-rocks",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    mediaType: "video",
    user: {
      name: "DOT Telemetry Gate 2",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=metro_cam",
      handle: "metro_cam",
      provider: "google",
      isTelemetry: true
    },
    timestamp: new Date().toISOString(),
    relativeTime: "LIVE DOT STREAM",
    caption: "LIVE METRO CAM 402: Lower South Lot shuttle loading and egress queue paths."
  },
  "new-orleans-la": {
    id: "webcam-nola",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    mediaType: "video",
    user: {
      name: "Port Authority Loop 4",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=port_monitor",
      handle: "port_monitor",
      provider: "google",
      isTelemetry: true
    },
    timestamp: new Date().toISOString(),
    relativeTime: "LIVE PORT FEED",
    caption: "LIVE PORT MONITOR: Mississippi River gangway and ferry terminal boarding areas."
  },
  "eau-claire-wi": {
    id: "webcam-wisconsin",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    mediaType: "video",
    user: {
      name: "Wisconsin Metro Radar 12",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=dot_telemetry",
      handle: "dot_telemetry",
      provider: "google",
      isTelemetry: true
    },
    timestamp: new Date().toISOString(),
    relativeTime: "LIVE METRO CAM",
    caption: "LIVE METRO CAM: Somerset dispatch airport and cabin highway bypass routes."
  },
  "juneau-ak": {
    id: "webcam-juneau",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    mediaType: "video",
    user: {
      name: "Waterfront Dock Eye 3",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=dock_eye",
      handle: "dock_eye",
      provider: "google",
      isTelemetry: true
    },
    timestamp: new Date().toISOString(),
    relativeTime: "LIVE DOCK FEED",
    caption: "LIVE WATERFRONT CAM 3: Pedestrian cruise boarding gates and marine ceiling flight paths."
  },
  "port-canaveral-orlando-fl": {
    id: "webcam-orlando",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    mediaType: "video",
    user: {
      name: "Bonnet Creek Ingress Gate",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=resort_cam",
      handle: "resort_cam",
      provider: "google",
      isTelemetry: true
    },
    timestamp: new Date().toISOString(),
    relativeTime: "LIVE RESORT FEED",
    caption: "LIVE RESORT FEED: Bonnet Creek main gate security checkpoint and pool entrance."
  }
};

export function getWebcamFallback(placeId: string): WebcamConfig | null {
  return WEBCAM_REGISTRY[placeId] || null;
}
