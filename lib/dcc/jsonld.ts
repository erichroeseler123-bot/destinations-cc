import { SITE_IDENTITY } from "@/src/data/site-identity";

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
    publisher: {
      "@id": `${SITE_IDENTITY.siteUrl}/#organization`,
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
