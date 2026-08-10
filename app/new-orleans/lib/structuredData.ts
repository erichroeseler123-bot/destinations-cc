export const WNO_ORIGIN = "https://welcometoneworleanstours.com";
export const WNO_SITE_NAME = "Welcome to New Orleans Tours";
export const WNO_PHONE = "+15044849687";

export type WnoBreadcrumbItem = {
  name: string;
  path: string;
};

function absolute(path: string) {
  return path.startsWith("http") ? path : `${WNO_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildWnoSiteGraph() {
  const organizationId = `${WNO_ORIGIN}/#organization`;
  const websiteId = `${WNO_ORIGIN}/#website`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
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
        "@id": websiteId,
        url: WNO_ORIGIN,
        name: WNO_SITE_NAME,
        publisher: { "@id": organizationId },
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
