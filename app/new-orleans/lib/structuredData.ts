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
  const imageUrl = imageObj?.verifiedRights ? `${WNO_ORIGIN}${imageObj.url}` : undefined;
  const provider = providerOrganization(resolveProviderName(slug, providerName));
  const broker = brokerOrganization();

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
        provider,
        broker,
      },
      {
        "@type": "TouristTrip",
        "@id": `${url}#trip`,
        name,
        description,
        url,
        ...(imageUrl && { image: imageUrl }),
        provider,
        broker,
        itemOffered: { "@id": `${url}#service` },
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
        hasPart: items.map((item) => ({
          "@type": "TouristTrip",
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