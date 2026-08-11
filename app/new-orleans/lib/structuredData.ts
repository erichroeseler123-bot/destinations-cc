import { PRODUCT_IMAGES } from "../data/imageRegistry";
import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";

export const WNO_ORIGIN = "https://welcometoneworleanstours.com";
export const WNO_SITE_NAME = "Welcome to New Orleans Tours";
export const WNO_PHONE = "+15044849687";
export const WNO_ORGANIZATION_ID = `${WNO_ORIGIN}/#organization`;
export const WNO_WEBSITE_ID = `${WNO_ORIGIN}/#website`;

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
          "New Orleans tour discovery, comparison, concierge help, and booking assistance for visitors choosing local tours and experiences.",
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
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(item.path),
    })),
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
          "@id": `${WNO_ORIGIN}/tours/${item.slug}#trip`,
        })),
      },
    ],
  };
}