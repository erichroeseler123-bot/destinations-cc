import { SITE_IDENTITY } from "@/src/data/site-identity";
import { getSameAs } from "@/lib/socials";
import { getNodeBySlugInClass } from "@/lib/dcc/registry";

const VENUE_GEO_BY_SLUG: Record<
  string,
  { lat: number; lng: number; capacity?: number; region?: string }
> = {
  "red-rocks-amphitheatre": { lat: 39.6654, lng: -105.2057, capacity: 9525, region: "CO" },
  "ball-arena": { lat: 39.7487, lng: -105.0077, capacity: 19520, region: "CO" },
  "empower-field-at-mile-high": { lat: 39.7439, lng: -105.0201, capacity: 76125, region: "CO" },
  "coors-field": { lat: 39.7559, lng: -104.9942, capacity: 50144, region: "CO" },
  "dicks-sporting-goods-park": { lat: 39.8056, lng: -104.8919, capacity: 18061, region: "CO" },
  "allegiant-stadium": { lat: 36.0909, lng: -115.1833, capacity: 65000, region: "NV" },
  "t-mobile-arena": { lat: 36.1029, lng: -115.1784, capacity: 17500, region: "NV" },
  "caesars-superdome": { lat: 29.9511, lng: -90.0812, capacity: 73208, region: "LA" },
  "smoothie-king-center": { lat: 29.949, lng: -90.0821, capacity: 16867, region: "LA" },
  "hard-rock-stadium": { lat: 25.958, lng: -80.2389, capacity: 64767, region: "FL" },
  "kaseya-center": { lat: 25.7814, lng: -80.187, capacity: 19600, region: "FL" },
};

export function resolveVenueGeo(
  slug: string,
): { lat: number; lng: number; capacity?: number; region?: string } | undefined {
  const direct = VENUE_GEO_BY_SLUG[slug];
  if (direct) return direct;
  try {
    const venueNode = getNodeBySlugInClass(slug, "venue");
    if (
      typeof venueNode?.geo?.lat === "number" &&
      typeof venueNode?.geo?.lon === "number"
    ) {
      return {
        lat: venueNode.geo.lat,
        lng: venueNode.geo.lon,
        region: venueNode.admin?.admin1_code || undefined,
      };
    }
  } catch {
    // ignore lookup errors; unknown venue coordinates must remain undefined
  }
  return undefined;
}

type BreadcrumbItem = {
  name: string;
  item: string;
};

type AddressInput = {
  streetAddress?: string;
  locality?: string;
  region?: string;
  postalCode?: string;
  country?: string;
};

type GeoInput = {
  lat?: number;
  lng?: number;
};

type LiveSlotSchemaInput = {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  locationName: string;
  locationUrl?: string;
  address?: AddressInput;
  price?: number | string | null;
  priceCurrency?: string;
  availability?:
    | "https://schema.org/InStock"
    | "https://schema.org/LimitedAvailability"
    | "https://schema.org/SoldOut";
  url: string;
  sellerName?: string;
  organizerName?: string;
};

function toAbsoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  return `${SITE_IDENTITY.siteUrl}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

function maybeAddress(address?: AddressInput) {
  if (
    !address?.streetAddress &&
    !address?.locality &&
    !address?.region &&
    !address?.postalCode &&
    !address?.country
  ) {
    return undefined;
  }
  return {
    "@type": "PostalAddress",
    streetAddress: address.streetAddress,
    addressLocality: address.locality,
    addressRegion: address.region,
    postalCode: address.postalCode,
    addressCountry: address.country || "US",
  };
}

function maybeGeo(geo?: GeoInput) {
  if (typeof geo?.lat !== "number" || typeof geo?.lng !== "number") return undefined;
  return {
    "@type": "GeoCoordinates",
    latitude: geo.lat,
    longitude: geo.lng,
  };
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.item),
    })),
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_IDENTITY.siteUrl}/#organization`,
    name: SITE_IDENTITY.name,
    url: SITE_IDENTITY.siteUrl,
    description: SITE_IDENTITY.canonicalDescription,
    sameAs: getSameAs("dcc"),
  };
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_IDENTITY.siteUrl}/#website`,
    name: SITE_IDENTITY.name,
    url: SITE_IDENTITY.siteUrl,
    description: SITE_IDENTITY.homepageDescription,
    sameAs: getSameAs("dcc"),
    publisher: {
      "@id": `${SITE_IDENTITY.siteUrl}/#organization`,
    },
  };
}


export function buildWebPageJsonLd(input: {
  path: string;
  name: string;
  description: string;
  dateModified?: string;
  isPartOfPath?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${toAbsoluteUrl(input.path)}#webpage`,
    url: toAbsoluteUrl(input.path),
    name: input.name,
    description: input.description,
    dateModified: input.dateModified,
    isPartOf: {
      "@id": input.isPartOfPath
        ? `${toAbsoluteUrl(input.isPartOfPath)}#webpage`
        : `${SITE_IDENTITY.siteUrl}/#website`,
    },
    about: {
      "@id": `${SITE_IDENTITY.siteUrl}/#organization`,
    },
  };
}

export function buildItemListJsonLd(input: {
  itemListOrder?: string;
  items: Array<{
    name: string;
    url?: string;
    item?: Record<string, unknown>;
    description?: string;
  }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListOrder: input.itemListOrder || "https://schema.org/ItemListOrderAscending",
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      description: item.description,
      url: item.url ? toAbsoluteUrl(item.url) : undefined,
      item: item.item,
    })),
  };
}

export function buildCollectionPageJsonLd(input: {
  path: string;
  name: string;
  description: string;
  items: Array<{
    name: string;
    url?: string;
    item?: Record<string, unknown>;
    description?: string;
  }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${toAbsoluteUrl(input.path)}#collection-page`,
    name: input.name,
    url: toAbsoluteUrl(input.path),
    description: input.description,
    publisher: {
      "@id": `${SITE_IDENTITY.siteUrl}/#organization`,
    },
    mainEntity: buildItemListJsonLd({ items: input.items }),
  };
}

export function buildLiveSlotEventJsonLd(input: LiveSlotSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.name,
    description: input.description,
    startDate: input.startDate,
    endDate: input.endDate,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: input.locationName,
      url: input.locationUrl ? toAbsoluteUrl(input.locationUrl) : undefined,
      address: maybeAddress(input.address),
    },
    organizer: input.organizerName
      ? {
          "@type": "Organization",
          name: input.organizerName,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      url: toAbsoluteUrl(input.url),
      price: input.price ?? undefined,
      priceCurrency: input.priceCurrency || (input.price != null ? "USD" : undefined),
      availability: input.availability || "https://schema.org/InStock",
      seller: input.sellerName
        ? {
            "@type": "Organization",
            name: input.sellerName,
          }
        : undefined,
    },
  };
}

export function buildLiveSlotsCollectionJsonLd(input: {
  pageUrl: string;
  name: string;
  description: string;
  slots: LiveSlotSchemaInput[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    url: toAbsoluteUrl(input.pageUrl),
    description: input.description,
    publisher: {
      "@id": `${SITE_IDENTITY.siteUrl}/#organization`,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: input.slots.length,
      itemListElement: input.slots.map((slot, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: buildLiveSlotEventJsonLd(slot),
      })),
    },
  };
}

export function buildCityJsonLd(input: {
  path: string;
  name: string;
  description: string;
  address?: AddressInput;
  geo?: GeoInput;
  touristTypes?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    "@id": `${toAbsoluteUrl(input.path)}#destination`,
    name: input.name,
    url: toAbsoluteUrl(input.path),
    description: input.description,
    address: maybeAddress(input.address),
    geo: maybeGeo(input.geo),
    touristType: (input.touristTypes || []).map((audienceType) => ({
      "@type": "Audience",
      audienceType,
    })),
    isPartOf: {
      "@id": `${SITE_IDENTITY.siteUrl}/#organization`,
    },
  };
}

export function buildAttractionJsonLd(input: {
  path: string;
  type?: "TouristAttraction" | "LandmarksOrHistoricalBuildings";
  name: string;
  description: string;
  containedInPath: string;
  containedInName: string;
  address?: AddressInput;
  geo?: GeoInput;
  touristTypes?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": input.type || "TouristAttraction",
    "@id": `${toAbsoluteUrl(input.path)}#attraction`,
    name: input.name,
    url: toAbsoluteUrl(input.path),
    description: input.description,
    address: maybeAddress(input.address),
    geo: maybeGeo(input.geo),
    containedInPlace: {
      "@id": `${toAbsoluteUrl(input.containedInPath)}#destination`,
      name: input.containedInName,
    },
    touristType: (input.touristTypes || []).map((audienceType) => ({
      "@type": "Audience",
      audienceType,
    })),
  };
}

export function buildTourJsonLd(input: {
  path: string;
  name: string;
  description: string;
  cityName?: string;
  image?: string;
  price?: number | null;
  currency?: string;
  rating?: number | null;
  reviewCount?: number | null;
  itineraryNames?: string[];
  touristTypes?: string[];
  provider?: {
    name: string;
    url?: string;
  } | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "@id": `${toAbsoluteUrl(input.path)}#tour`,
    name: input.name,
    url: toAbsoluteUrl(input.path),
    description: input.description,
    image: input.image,
    touristType: (input.touristTypes || []).map((audienceType) => ({
      "@type": "Audience",
      audienceType,
    })),
    itinerary: (input.itineraryNames || []).map((name) => ({
      "@type": "TouristAttraction",
      name,
    })),
    provider: input.provider
      ? {
          "@type": "Organization",
          name: input.provider.name,
          url: input.provider.url,
        }
      : undefined,
    offers:
      typeof input.price === "number"
        ? {
            "@type": "Offer",
            url: toAbsoluteUrl(input.path),
            price: input.price,
            priceCurrency: input.currency || "USD",
            availability: "https://schema.org/InStock",
          }
        : undefined,
    aggregateRating:
      typeof input.rating === "number" && typeof input.reviewCount === "number"
        ? {
            "@type": "AggregateRating",
            ratingValue: input.rating,
            reviewCount: input.reviewCount,
          }
        : undefined,
  };
}

export function buildEventJsonLd(input: {
  path: string;
  type?: "MusicEvent" | "SportsEvent" | "Event";
  name: string;
  description: string;
  startDate?: string | null;
  venueName: string;
  venueUrl?: string;
  address?: AddressInput;
  offerUrl?: string | null;
  organizerName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": input.type || "Event",
    "@id": `${toAbsoluteUrl(input.path)}#event`,
    name: input.name,
    url: toAbsoluteUrl(input.path),
    description: input.description,
    startDate: input.startDate || undefined,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: input.venueName,
      url: input.venueUrl ? toAbsoluteUrl(input.venueUrl) : undefined,
      address: maybeAddress(input.address),
    },
    organizer: input.organizerName
      ? {
          "@type": "Organization",
          name: input.organizerName,
        }
      : undefined,
    offers: input.offerUrl
      ? {
          "@type": "Offer",
          url: input.offerUrl,
          availability: "https://schema.org/InStock",
        }
      : undefined,
  };
}

export function buildOperatorJsonLd(input: {
  path: string;
  name: string;
  city: string;
  website?: string;
  phone?: string;
  areasServed?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${toAbsoluteUrl(input.path)}#organization`,
    name: input.name,
    url: toAbsoluteUrl(input.path),
    telephone: input.phone,
    sameAs: input.website ? [input.website] : undefined,
    areaServed: (input.areasServed || [input.city]).map((area) => ({
      "@type": "City",
      name: area,
    })),
  };
}

export function buildAboutPageJsonLd(input: {
  path: string;
  name: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${toAbsoluteUrl(input.path)}#about-page`,
    name: input.name,
    url: toAbsoluteUrl(input.path),
    description: input.description,
    isPartOf: {
      "@id": `${SITE_IDENTITY.siteUrl}/#website`,
    },
    about: {
      "@id": `${SITE_IDENTITY.siteUrl}/#organization`,
    },
  };
}

export function buildPlaceJsonLd(input: {
  path: string;
  name: string;
  description: string;
  address?: AddressInput;
  geo?: GeoInput;
  containedInPath?: string;
  containedInName?: string;
  touristTypes?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    "@id": `${toAbsoluteUrl(input.path)}#place`,
    name: input.name,
    url: toAbsoluteUrl(input.path),
    description: input.description,
    address: maybeAddress(input.address),
    geo: maybeGeo(input.geo),
    containedInPlace:
      input.containedInPath && input.containedInName
        ? {
            "@id": `${toAbsoluteUrl(input.containedInPath)}#destination`,
            name: input.containedInName,
          }
        : undefined,
    touristType: (input.touristTypes || []).map((audienceType) => ({
      "@type": "Audience",
      audienceType,
    })),
  };
}

export function buildEventVenueJsonLd(input: {
  path: string;
  name: string;
  description: string;
  address?: AddressInput;
  geo?: GeoInput;
  maximumAttendeeCapacity?: number;
  containedInPath?: string;
  containedInName?: string;
  sameAs?: string[];
  touristTypes?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "EventVenue",
    "@id": `${toAbsoluteUrl(input.path)}#venue`,
    name: input.name,
    url: toAbsoluteUrl(input.path),
    description: input.description,
    address: maybeAddress(input.address),
    geo: maybeGeo(input.geo),
    maximumAttendeeCapacity: input.maximumAttendeeCapacity,
    sameAs: input.sameAs && input.sameAs.length > 0 ? input.sameAs : undefined,
    containedInPlace:
      input.containedInPath && input.containedInName
        ? {
            "@id": `${toAbsoluteUrl(input.containedInPath)}#destination`,
            name: input.containedInName,
          }
        : undefined,
    touristType: (input.touristTypes || []).map((audienceType) => ({
      "@type": "Audience",
      audienceType,
    })),
    isPartOf: {
      "@id": `${SITE_IDENTITY.siteUrl}/#website`,
    },
  };
}

export function buildAirportJsonLd(input: {
  path: string;
  name: string;
  description: string;
  address?: AddressInput;
  geo?: GeoInput;
  servedCityPath?: string;
  servedCityName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Airport",
    "@id": `${toAbsoluteUrl(input.path)}#airport`,
    name: input.name,
    url: toAbsoluteUrl(input.path),
    description: input.description,
    address: maybeAddress(input.address),
    geo: maybeGeo(input.geo),
    containedInPlace:
      input.servedCityPath && input.servedCityName
        ? {
            "@type": "City",
            "@id": toAbsoluteUrl(input.servedCityPath),
            name: input.servedCityName,
          }
        : undefined,
  };
}

export function buildTransitStationJsonLd(input: {
  path: string;
  subtype: "train-station" | "bus-station";
  name: string;
  description: string;
  address?: AddressInput;
  geo?: GeoInput;
  servedCityPath?: string;
  servedCityName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": input.subtype === "train-station" ? "TrainStation" : "BusStation",
    "@id": `${toAbsoluteUrl(input.path)}#station`,
    name: input.name,
    url: toAbsoluteUrl(input.path),
    description: input.description,
    address: maybeAddress(input.address),
    geo: maybeGeo(input.geo),
    containedInPlace:
      input.servedCityPath && input.servedCityName
        ? {
            "@type": "City",
            "@id": toAbsoluteUrl(input.servedCityPath),
            name: input.servedCityName,
          }
        : undefined,
  };
}

export function buildArticleJsonLd(input: {
  path: string;
  headline: string;
  description: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${toAbsoluteUrl(input.path)}#article`,
    headline: input.headline,
    description: input.description,
    author: {
      "@type": "Organization",
      name: SITE_IDENTITY.name,
    },
    publisher: {
      "@id": `${SITE_IDENTITY.siteUrl}/#organization`,
    },
    datePublished: input.dateModified,
    dateModified: input.dateModified,
    mainEntityOfPage: toAbsoluteUrl(input.path),
  };
}

export function buildFaqJsonLd(
  items: Array<{
    question: string;
    answer: string;
  }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
