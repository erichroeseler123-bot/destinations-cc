import type { EarthOsHappening } from "./mock-48h-inventory";
import type { Experience } from "./types";
import { appendViatorAttribution } from "@/lib/viator/links";


// Define the Viator payload shapes locally for safety
export interface ViatorProductSummary {
  productCode?: string;
  title?: string;
  description?: string;
  productUrl?: string;
  images?: Array<{
    variants?: Array<{
      url?: string;
      width?: number;
      height?: number;
    }>;
  }>;
  reviews?: {
    totalReviews?: number;
    combinedAverageRating?: number;
    averageRating?: number;
  };
  pricing?: {
    currency?: string;
    summary?: {
      fromPrice?: number;
    };
  };
  duration?: {
    fixedDurationInMinutes?: number;
    variableDurationFromMinutes?: number;
    variableDurationToMinutes?: number;
  };
}

/**
 * Maps a raw Viator Product Summary to the unified EarthOsHappening contract
 */
export function normalizeViatorProduct(
  product: ViatorProductSummary,
  placeId: string,
  fallbackCoords: { lat: number; lng: number }
): EarthOsHappening {
  const code = product.productCode || Math.random().toString(36).substr(2, 9);
  
  // Extract images
  const imagesList: string[] = [];
  if (product.images) {
    product.images.forEach((img) => {
      // Find the highest resolution variant
      const bestVariant = img.variants?.reduce((prev, curr) => 
        (curr.width || 0) > (prev.width || 0) ? curr : prev
      , img.variants[0]);
      if (bestVariant?.url) {
        imagesList.push(bestVariant.url);
      }
    });
  }

  const primaryImage = imagesList[0] || "/images/fallback-tour.png";
  const price = product.pricing?.summary?.fromPrice ?? 49;
  
  // Format duration label
  let durationLabel = "2 hours";
  if (product.duration) {
    const min = product.duration.fixedDurationInMinutes || product.duration.variableDurationFromMinutes;
    if (min) {
      const hrs = Math.floor(min / 60);
      const mins = min % 60;
      durationLabel = hrs > 0 ? `${hrs}h ${mins > 0 ? mins + "m" : ""}` : `${mins} min`;
    }
  }

  return {
    id: `viator-${code}`,
    title: product.title || "Tour Excursion",
    category: "Shore Excursion",
    type: "tour",
    startTime: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // Depart tomorrow morning
    durationLabel,
    price,
    priceLabel: `$${price} per person`,
    imageUrl: primaryImage,
    images: imagesList,
    fallbackImage: "/images/fallback-tour.png",
    actionUrl: product.productUrl || `/out/viator-${code}`,
    actionText: "Book Tour Pass",
    urgencyLabel: "Booking fast",
    distanceText: "Cruise port pickup",
    coordinates: fallbackCoords,
    whyItFits: product.description 
      ? product.description.split(".")[0] + ". Hand-picked high-rating tour option."
      : "Top rated shore excursion. Hand-selected for optimal scheduling and high availability.",
    isOwned: false
  };
}

/**
 * Appends affiliate tracking parameters and wraps Ticketmaster URL in deep link template if configured
 */
export function appendTicketmasterAttribution(url: string, placeId?: string): string {
  if (!url) return url;

  let targetUrl = url;
  try {
    const urlObj = new URL(targetUrl);
    // Standard Impact subId1 / subId2 parameters
    urlObj.searchParams.set("subId1", "dcc_command_board");
    if (placeId) {
      urlObj.searchParams.set("subId2", placeId);
    }
    // Standard TM partner parameters
    urlObj.searchParams.set("utm_source", "destinationcommandcenter");
    urlObj.searchParams.set("utm_medium", "affiliate");
    urlObj.searchParams.set("utm_campaign", "dcc-destination-lanes");
    targetUrl = urlObj.toString();
  } catch (e) {
    // Keep as is if URL parsing fails
  }

  const template = process.env.TICKETMASTER_AFFILIATE_DEEPLINK_BASE;
  if (!template) {
    return targetUrl;
  }

  try {
    if (template.includes("{url}")) {
      return template.replaceAll("{url}", encodeURIComponent(targetUrl));
    }
    const templateUrl = new URL(template);
    templateUrl.searchParams.set("url", targetUrl);
    templateUrl.searchParams.set("subId1", "dcc_command_board");
    if (placeId) {
      templateUrl.searchParams.set("subId2", placeId);
    }
    return templateUrl.toString();
  } catch (e) {
    return targetUrl;
  }
}

/**
 * Maps a raw Ticketmaster Event to the unified EarthOsHappening contract
 */
export function normalizeTicketmasterEvent(
  event: any,
  placeId: string,
  fallbackCoords: { lat: number; lng: number }
): EarthOsHappening {
  const id = event.id || Math.random().toString(36).substr(2, 9);
  
  // Extract images
  const imagesList: string[] = [];
  if (event.images) {
    event.images.forEach((img: any) => {
      if (img.url) imagesList.push(img.url);
    });
  }

  let primaryImage = "/images/fallback-event.png";
  if (event.images && event.images.length > 0) {
    // Find the 16_9 ratio image first
    const img169 = event.images.find((img: any) => img.ratio === "16_9");
    if (img169?.url) {
      primaryImage = img169.url;
    } else {
      const sortedByWidth = [...event.images].sort((a: any, b: any) => (b.width || 0) - (a.width || 0));
      primaryImage = sortedByWidth[0]?.url || event.images[0]?.url || "/images/fallback-event.png";
    }
  }

  const venue = event._embedded?.venues?.[0];
  
  const venueLat = venue?.location?.latitude ? parseFloat(venue.location.latitude) : null;
  const venueLng = venue?.location?.longitude ? parseFloat(venue.location.longitude) : null;
  const coordinates = (venueLat && venueLng) ? { lat: venueLat, lng: venueLng } : fallbackCoords;

  const minPrice = event.priceRanges?.[0]?.min;
  const maxPrice = event.priceRanges?.[0]?.max;
  const price = minPrice !== undefined ? Math.round(minPrice) : 35;
  const priceLabel = minPrice !== undefined 
    ? `$${Math.round(minPrice)}${maxPrice ? " - $" + Math.round(maxPrice) : ""}`
    : "Check tickets";

  let startTimeStr = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(); // Today + 8h fallback
  if (event.dates?.start?.dateTime) {
    startTimeStr = new Date(event.dates.start.dateTime).toISOString();
  } else if (event.dates?.start?.localDate) {
    const timePart = event.dates.start.localTime || "19:00:00";
    startTimeStr = new Date(`${event.dates.start.localDate}T${timePart}`).toISOString();
  }

  let durationLabel = "Doors Open TBA";
  if (event.dates?.start?.localTime) {
    try {
      const [hour, minute] = event.dates.start.localTime.split(":");
      const h = parseInt(hour, 10);
      const ampm = h >= 12 ? "PM" : "AM";
      const displayHour = h % 12 || 12;
      durationLabel = `Doors Open: ${displayHour}:${minute} ${ampm}`;
    } catch {
      durationLabel = "Doors Open: " + event.dates.start.localTime;
    }
  }

  return {
    id: `tm-${id}`,
    title: event.name || "Live Performance",
    category: event.classifications?.[0]?.segment?.name || "Live Show",
    type: "event",
    startTime: startTimeStr,
    durationLabel,
    price,
    priceLabel,
    imageUrl: primaryImage,
    images: imagesList,
    fallbackImage: "/images/fallback-event.png",
    actionUrl: event.url ? appendTicketmasterAttribution(event.url, placeId) : `/out/tm-${id}`,
    actionText: "Buy Official Tickets",
    urgencyLabel: "Ticket links active",
    distanceText: venue?.name || "Local Arena",
    coordinates,
    whyItFits: `Performing live at ${venue?.name || "local venue"}. Reserve travel logistics shuttle directly underneath.`,
    isOwned: false
  };
}

/**
 * Appends affiliate tracking parameters to GetYourGuide booking URLs
 */
export function appendGetYourGuideAttribution(url: string): string {
  if (!url) return url;
  const partnerId = process.env.NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID || "F2MMUUH";
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set("partner_id", partnerId);
    urlObj.searchParams.set("utm_medium", "affiliate");
    urlObj.searchParams.set("utm_campaign", "dcc_command_board");
    return urlObj.toString();
  } catch (e) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}partner_id=${partnerId}&utm_medium=affiliate&utm_campaign=dcc_command_board`;
  }
}

/**
 * Maps a raw GetYourGuide Experience to the unified EarthOsHappening contract
 */
export function normalizeGetYourGuideExperience(
  exp: Experience,
  fallbackCoords: { lat: number; lng: number }
): EarthOsHappening {
  const bookingUrl = appendGetYourGuideAttribution(exp.booking_url);
  const price = exp.price_from ?? 49;
  const image = exp.image_url || "/images/fallback-tour.png";

  return {
    id: exp.id,
    title: exp.title,
    category: exp.category || "Shore Excursion",
    type: "tour",
    startTime: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // Tomorrow morning
    durationLabel: exp.duration || "Duration varies",
    price,
    priceLabel: `$${price} per person`,
    imageUrl: image,
    images: exp.image_url ? [exp.image_url] : [],
    fallbackImage: "/images/fallback-tour.png",
    actionUrl: bookingUrl,
    actionText: "Book Tour Pass",
    urgencyLabel: "Best Seller",
    distanceText: exp.meeting_point || "Cruise port pickup",
    coordinates: fallbackCoords,
    whyItFits: `${exp.title}. Curated GetYourGuide approved experience for immediate dispatch.`,
    isOwned: false
  };
}

/**
 * Maps a raw GetYourGuide API Tour response object to the unified EarthOsHappening contract
 */
export function normalizeGetYourGuideApiTour(
  tour: any,
  placeId: string,
  fallbackCoords: { lat: number; lng: number }
): EarthOsHappening {
  const id = tour.tour_id || Math.random().toString(36).substr(2, 9);
  
  // Format image URL
  const rawImage = tour.pictures?.[0]?.url || tour.pictures?.[0]?.ssl_url || "";
  let primaryImage = "/images/fallback-tour.png";
  if (rawImage) {
    primaryImage = rawImage.replace(/\[format_id\]/g, "88").replace(/\{format_id\}/g, "88");
  }

  const imagesList: string[] = [];
  if (tour.pictures && Array.isArray(tour.pictures)) {
    tour.pictures.forEach((pic: any) => {
      const pUrl = pic.url || pic.ssl_url;
      if (pUrl) {
        imagesList.push(pUrl.replace(/\[format_id\]/g, "88").replace(/\{format_id\}/g, "88"));
      }
    });
  }

  // Parse price safely
  let price = 49;
  if (tour.price) {
    if (typeof tour.price === "number") {
      price = tour.price;
    } else if (tour.price.values && typeof tour.price.values.amount === "number") {
      price = tour.price.values.amount;
    } else if (tour.price.value && typeof tour.price.value.amount === "number") {
      price = tour.price.value.amount;
    } else if (typeof tour.price.amount === "number") {
      price = tour.price.amount;
    }
  }

  // Parse duration label
  let durationLabel = "Duration varies";
  if (tour.durations && Array.isArray(tour.durations) && tour.durations.length > 0) {
    const dObj = tour.durations[0];
    if (dObj && dObj.duration && dObj.unit) {
      durationLabel = `${dObj.duration} ${dObj.unit}${dObj.duration > 1 ? "s" : ""}`;
    }
  } else if (tour.duration) {
    durationLabel = String(tour.duration);
  }

  const bookingUrl = tour.url ? appendGetYourGuideAttribution(tour.url) : `/out/getyourguide-${id}`;

  return {
    id: `getyourguide-${id}`,
    title: tour.title || "GetYourGuide Excursion",
    category: tour.category || "Shore Excursion",
    type: "tour",
    startTime: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // Tomorrow morning
    durationLabel,
    price,
    priceLabel: `$${price} per person`,
    imageUrl: primaryImage,
    images: imagesList.length > 0 ? imagesList : [primaryImage],
    fallbackImage: "/images/fallback-tour.png",
    actionUrl: bookingUrl,
    actionText: "Book Tour Pass",
    urgencyLabel: tour.bestseller ? "Best Seller" : "Booking fast",
    distanceText: tour.meeting_point || "Cruise port pickup",
    coordinates: fallbackCoords,
    whyItFits: tour.abstract 
      ? tour.abstract.split(".")[0] + ". Hand-picked high-rating fallback excursion."
      : "Top rated shore excursion. Hand-selected for optimal scheduling and high availability.",
    isOwned: false
  };
}

/**
 * Maps a raw Viator Product Summary to the unified EarthOsHappening contract
 * and appends affiliate tracking parameters to the booking URL
 */
export function normalizeViatorExperience(
  product: ViatorProductSummary,
  placeId: string,
  fallbackCoords: { lat: number; lng: number }
): EarthOsHappening {
  const normalized = normalizeViatorProduct(product, placeId, fallbackCoords);
  
  if (normalized.actionUrl && normalized.actionUrl.startsWith("http")) {
    normalized.actionUrl = appendViatorAttribution(normalized.actionUrl);
  }

  return normalized;
}

/**
 * Ranks, sorts, and slices Viator products based on Yield Optimization Score:
 * S = (C * R^2) / (D + 1)
 */
export function optimizeViatorProducts(
  products: any[],
  portCoords: { lat: number; lng: number },
  limit: number = 3
): any[] {
  const scored = products.map((product) => {
    // 1. Commission (C) = 10% of price
    const price = product.pricing?.summary?.fromPrice ?? 49;
    const commission = price * 0.10;

    // 2. Review score (R) - average rating
    const rating = product.reviews?.combinedAverageRating || product.reviews?.averageRating || 4.0;

    // 3. Distance (D) in miles
    let distance = 2.0; // fallback
    const startPoint = product.startPoints?.[0] || product.meetingPoint;
    if (startPoint?.location?.latitude && startPoint?.location?.longitude) {
      const lat1 = portCoords.lat;
      const lon1 = portCoords.lng;
      const lat2 = parseFloat(startPoint.location.latitude);
      const lon2 = parseFloat(startPoint.location.longitude);
      
      const R_earth = 3958.8; // Radius of Earth in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distance = R_earth * c;
    } else {
      // Deterministic fallback based on code hash
      const code = product.productCode || "";
      let hash = 0;
      for (let i = 0; i < code.length; i++) {
        hash = code.charCodeAt(i) + ((hash << 5) - hash);
      }
      distance = 0.5 + Math.abs(hash % 120) / 10;
    }

    const score = (commission * rating * rating) / (distance + 1);
    return { product, score };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => item.product);
}



