import { PRODUCT_IMAGES } from "../data/imageRegistry";
import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";

export const WNO_ORIGIN = "https://www.welcometoneworleanstours.com";
export const WNO_SITE_NAME = "Welcome to New Orleans Tours";
export const WNO_PHONE = "+15044849687";
export const WNO_ORGANIZATION_ID = `${WNO_ORIGIN}/#organization`;
export const WNO_WEBSITE_ID = `${WNO_ORIGIN}/#website`;
export const DCC_NOLA_DIRECTORY_API_URL =
  "https://www.destinationcommandcenter.com/api/v1/new-orleans/directory";

function independentWnoPublisher() {
  return {
    "@type": "Organization",
    "@id": WNO_ORGANIZATION_ID,
    name: WNO_SITE_NAME,
    url: WNO_ORIGIN,
  };
}

export type WnoBreadcrumbItem = {
  name: string;
  path: string;
};

function absolute(path: string) {
  return path.startsWith("http") ? path : `${WNO_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildWnoSiteGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": WNO_ORGANIZATION_ID,
        name: WNO_SITE_NAME,
        url: WNO_ORIGIN,
        telephone: WNO_PHONE,
        description:
          "Curated New Orleans experience recommendations, timely local context, concierge help, and direct booking assistance for visitors choosing what fits their group.",
        areaServed: {
          "@type": "City",
          name: "New Orleans",
        },
        knowsAbout: [
          "New Orleans tours",
          "New Orleans swamp tours",
          "New Orleans river cruises",
          "New Orleans plantation tours",
          "New Orleans city tours",
          "New Orleans visitor planning",
        ],
      },
      {
        "@type": "WebSite",
        "@id": WNO_WEBSITE_ID,
        url: WNO_ORIGIN,
        name: WNO_SITE_NAME,
        publisher: { "@id": WNO_ORGANIZATION_ID },
        inLanguage: "en-US",
      },
    ],
  };
}

export function buildWnoWebPageJsonLd({
  path,
  name,
  description,
}: {
  path: string;
  name: string;
  description: string;
}) {
  const url = absolute(path);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: { "@id": WNO_WEBSITE_ID },
    about: { "@id": WNO_ORGANIZATION_ID },
    inLanguage: "en-US",
  };
}

export function buildWnoBreadcrumbJsonLd(items: WnoBreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const entry: Record<string, any> = {
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
      };
      if (item.path && item.path.trim() !== "") {
        entry.item = absolute(item.path);
      }
      return entry;
    }),
  };
}

export function buildWnoFaqJsonLd(items: Array<{ question: string; answer: string }>) {
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

function providerOrganization(name: string) {
  return {
    "@type": "Organization",
    name,
  };
}

function brokerOrganization() {
  return {
    "@id": WNO_ORGANIZATION_ID,
  };
}

function resolveProviderName(slug: string, requestedName: string) {
  const storefrontProduct = STOREFRONT_PRODUCTS.find((product) => product.slug === slug);
  return storefrontProduct?.operatorName || (requestedName && requestedName !== "Unknown" ? requestedName : WNO_SITE_NAME);
}

function buildProductIdentifiers(slug: string) {
  const product = STOREFRONT_PRODUCTS.find((item) => item.slug === slug);
  if (!product) return [];

  const identifiers: Array<Record<string, string>> = [
    {
      "@type": "PropertyValue",
      propertyID: "WNO slug",
      value: product.slug,
    },
    {
      "@type": "PropertyValue",
      propertyID: "FareHarbor company",
      value: product.companyShortname,
    },
  ];

  if (product.itemId) {
    identifiers.push({
      "@type": "PropertyValue",
      propertyID: "FareHarbor item ID",
      value: String(product.itemId),
    });
  }

  return identifiers;
}

export function generateProductSchemaGraph({
  slug,
  name,
  description,
  providerName,
}: {
  slug: string;
  name: string;
  description: string;
  providerName: string;
}) {
  const url = `${WNO_ORIGIN}/tours/${slug}`;
  const imageObj = PRODUCT_IMAGES[slug];
  const imageUrl = imageObj?.verifiedRights ? (imageObj.url.startsWith("http") ? imageObj.url : `${WNO_ORIGIN}${imageObj.url}`) : undefined;
  const provider = providerOrganization(resolveProviderName(slug, providerName));
  const broker = brokerOrganization();
  const identifiers = buildProductIdentifiers(slug);
  const storefrontProduct = STOREFRONT_PRODUCTS.find((product) => product.slug === slug);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name,
        description,
        url,
        ...(imageUrl && { image: imageUrl }),
        ...(storefrontProduct?.category && { category: storefrontProduct.category }),
        ...(identifiers.length > 0 && { identifier: identifiers }),
        provider,
        broker,
        mainEntityOfPage: { "@id": `${url}#webpage` },
      },
      {
        "@type": "TouristTrip",
        "@id": `${url}#trip`,
        name,
        description,
        url,
        ...(imageUrl && { image: imageUrl }),
        ...(storefrontProduct?.category && { touristType: storefrontProduct.category }),
        ...(identifiers.length > 0 && { identifier: identifiers }),
        provider,
        broker,
        itemOffered: { "@id": `${url}#service` },
        mainEntityOfPage: { "@id": `${url}#webpage` },
      },
    ],
  };
}

export function generateCategorySchemaGraph({
  urlPath,
  name,
  description,
  items,
}: {
  urlPath: string;
  name: string;
  description: string;
  items: Array<{ slug: string; name: string; description: string; providerName: string }>;
}) {
  const url = absolute(urlPath);
  const itemList = items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "TouristTrip",
      "@id": `${WNO_ORIGIN}/tours/${item.slug}#trip`,
      name: item.name,
      description: item.description,
      url: `${WNO_ORIGIN}/tours/${item.slug}`,
      provider: providerOrganization(resolveProviderName(item.slug, item.providerName)),
      broker: brokerOrganization(),
    },
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#webpage`,
        url,
        name,
        description,
        isPartOf: { "@id": WNO_WEBSITE_ID },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: itemList,
        },
        hasPart: items.map((item) => ({
          "@type": "TouristTrip",
          "@id": `${WNO_ORIGIN}/tours/${item.slug}#trip`,
          name: item.name,
          description: item.description,
          url: `${WNO_ORIGIN}/tours/${item.slug}`,
          provider: providerOrganization(resolveProviderName(item.slug, item.providerName)),
          broker: brokerOrganization(),
        })),
      },
    ],
  };
}

export function buildWnoAreasHubJsonLd({
  places,
}: {
  places: Array<{ slug: string; name: string; description: string }>;
}) {
  const url = `${WNO_ORIGIN}/areas`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#collection`,
        url,
        name: "New Orleans Neighborhoods, Swamp Basins, River Road Museums & Terminals",
        description:
          "Source-backed guide to 16 Greater New Orleans departure areas, wetland basins, River Road historic sites, and Port NOLA / MSY gateways.",
        isPartOf: { "@id": WNO_WEBSITE_ID },
        publisher: independentWnoPublisher(),
        isBasedOn: DCC_NOLA_DIRECTORY_API_URL,
        inLanguage: "en-US",
        mainEntity: {
          "@type": "ItemList",
          itemListElement: places.map((place, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: place.name,
            url: `${WNO_ORIGIN}/areas/${place.slug}`,
          })),
        },
      },
      buildWnoBreadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Areas & Basins", path: "/areas" },
      ]),
    ],
  };
}

export function buildWnoAreaDetailJsonLd({
  slug,
  name,
  description,
  image,
  latitude,
  longitude,
}: {
  slug: string;
  name: string;
  description: string;
  image?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const url = `${WNO_ORIGIN}/areas/${slug}`;
  const imageUrl = image
    ? image.startsWith("http")
      ? image
      : `${WNO_ORIGIN}${image}`
    : undefined;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TouristDestination", "Place"],
        "@id": `${url}#place`,
        name,
        description,
        url,
        ...(imageUrl ? { image: imageUrl } : {}),
        ...(typeof latitude === "number" && typeof longitude === "number"
          ? {
              geo: {
                "@type": "GeoCoordinates",
                latitude,
                longitude,
              },
            }
          : {}),
        isBasedOn: DCC_NOLA_DIRECTORY_API_URL,
        subjectOf: {
          "@type": "WebPage",
          "@id": `${url}#webpage`,
          url,
          name: `${name} Tours & Departure Logistics | ${WNO_SITE_NAME}`,
          description,
          isPartOf: { "@id": WNO_WEBSITE_ID },
          publisher: independentWnoPublisher(),
          isBasedOn: DCC_NOLA_DIRECTORY_API_URL,
          inLanguage: "en-US",
        },
      },
      buildWnoBreadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Areas & Basins", path: "/areas" },
        { name, path: `/areas/${slug}` },
      ]),
    ],
  };
}

export function buildWnoAreaCategoryJsonLd({
  areaSlug,
  areaName,
  categorySlug,
  categoryName,
  title,
  description,
  items,
}: {
  areaSlug: string;
  areaName: string;
  categorySlug: string;
  categoryName: string;
  title: string;
  description: string;
  items: Array<{ name: string; path: string }>;
}) {
  const url = `${WNO_ORIGIN}/areas/${areaSlug}/${categorySlug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#collection`,
        url,
        name: title,
        description,
        isPartOf: { "@id": WNO_WEBSITE_ID },
        publisher: independentWnoPublisher(),
        isBasedOn: DCC_NOLA_DIRECTORY_API_URL,
        inLanguage: "en-US",
        mainEntity: {
          "@type": "ItemList",
          itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            url: absolute(item.path),
          })),
        },
      },
      buildWnoBreadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Areas & Basins", path: "/areas" },
        { name: areaName, path: `/areas/${areaSlug}` },
        { name: categoryName, path: `/areas/${areaSlug}/${categorySlug}` },
      ]),
    ],
  };
}

export function buildWnoOperatorsCollectionJsonLd({
  operatorCount,
}: {
  operatorCount: number;
}) {
  const url = `${WNO_ORIGIN}/operators`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#collection`,
        url,
        name: "New Orleans Tour Operators | Swamp, Riverboat, Ghost, Food & City Tours",
        description: `Independent source-backed directory of ${operatorCount} verified New Orleans tour operators with dock addresses, pickup policies, and booking links.`,
        isPartOf: { "@id": WNO_WEBSITE_ID },
        publisher: independentWnoPublisher(),
        isBasedOn: DCC_NOLA_DIRECTORY_API_URL,
        inLanguage: "en-US",
      },
      buildWnoBreadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Tour Operators", path: "/operators" },
      ]),
    ],
  };
}

export function buildWnoOperatorProfileJsonLd({
  slug,
  name,
  description,
  officialWebsite,
  officialPhone,
  dateModified,
}: {
  slug: string;
  name: string;
  description: string;
  officialWebsite?: string | null;
  officialPhone?: string | null;
  dateModified?: string | null;
}) {
  const profileUrl = `${WNO_ORIGIN}/operators/${slug}`;
  const businessEntity: Record<string, unknown> = {
    "@type": "LocalBusiness",
    "@id": `${profileUrl}#operator`,
    name,
    description,
    ...(officialWebsite
      ? {
          url: officialWebsite,
          sameAs: [officialWebsite],
        }
      : {}),
    ...(officialPhone ? { telephone: officialPhone } : {}),
    areaServed: {
      "@type": "Place",
      name: "Greater New Orleans, Louisiana",
    },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${profileUrl}#profilepage`,
        url: profileUrl,
        name: `${name} — New Orleans Tours, Docks & Pickup | ${WNO_SITE_NAME}`,
        description,
        ...(dateModified ? { dateModified } : {}),
        isPartOf: { "@id": WNO_WEBSITE_ID },
        publisher: independentWnoPublisher(),
        isBasedOn: DCC_NOLA_DIRECTORY_API_URL,
        mainEntity: businessEntity,
        about: { "@id": `${profileUrl}#operator` },
        inLanguage: "en-US",
      },
      buildWnoBreadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Tour Operators", path: "/operators" },
        { name, path: `/operators/${slug}` },
      ]),
    ],
  };
}
