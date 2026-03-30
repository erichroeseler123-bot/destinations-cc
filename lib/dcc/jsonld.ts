import { SITE_IDENTITY } from "@/src/data/site-identity";
import { getSameAs } from "@/lib/socials";

type BreadcrumbItem = {
  name: string;
  item: string;
};

type AddressInput = {
  locality?: string;
  region?: string;
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
  if (!address?.locality && !address?.region && !address?.country) return undefined;
  return {
    "@type": "PostalAddress",
    addressLocality: address.locality,
    addressRegion: address.region,
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
