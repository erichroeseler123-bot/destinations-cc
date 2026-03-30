import { SITE_CONFIG } from "@/app/site-config";
import type { SwampProduct } from "@/lib/swampProducts";

function toAbsoluteUrl(pathOrUrl: string) {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  return `${SITE_CONFIG.url}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

export function buildWebPageJsonLd(input: {
  path: string;
  name: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${toAbsoluteUrl(input.path)}#webpage`,
    url: toAbsoluteUrl(input.path),
    name: input.name,
    description: input.description,
    isPartOf: {
      "@id": `${SITE_CONFIG.url}/#website`,
    },
    about: {
      "@type": "Thing",
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; item: string }>) {
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

export function buildItemListJsonLd(input: {
  items: Array<{
    name: string;
    url?: string;
    description?: string;
    item?: Record<string, unknown>;
  }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListOrder: "https://schema.org/ItemListOrderAscending",
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
    description?: string;
    item?: Record<string, unknown>;
  }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${toAbsoluteUrl(input.path)}#collection-page`,
    name: input.name,
    url: toAbsoluteUrl(input.path),
    description: input.description,
    mainEntity: buildItemListJsonLd({ items: input.items }),
  };
}

function parsePrice(value: string | null): number | null {
  if (!value) return null;
  const match = value.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

export function buildTourJsonLd(input: {
  path: string;
  product: SwampProduct;
}) {
  const price = parsePrice(input.product.priceLabel || null);
  return {
    "@type": "TouristTrip",
    "@id": `${toAbsoluteUrl(input.path)}#tour-${input.product.id}`,
    name: input.product.title,
    url: input.product.bookHref,
    description: input.product.description || undefined,
    image: input.product.imageUrl || undefined,
    provider: input.product.supplierName
      ? {
          "@type": "Organization",
          name: input.product.supplierName,
        }
      : undefined,
    offers: price !== null
      ? {
          "@type": "Offer",
          url: input.product.bookHref,
          price,
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        }
      : {
          "@type": "Offer",
          url: input.product.bookHref,
          availability: "https://schema.org/InStock",
        },
    aggregateRating:
      typeof input.product.rating === "number" && typeof input.product.reviewCount === "number"
        ? {
            "@type": "AggregateRating",
            ratingValue: input.product.rating,
            reviewCount: input.product.reviewCount,
          }
        : undefined,
  };
}
