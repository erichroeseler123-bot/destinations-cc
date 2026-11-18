import {
  VERIFIED_OPERATORS,
  VERIFIED_TARIFF_DATE_ISO,
  type OperatorKey,
} from "./verifiedOperatorPricing";

export type BreadcrumbStep =
  | { name: string; item: string; url?: never }
  | { name: string; url: string; item?: never };

export interface BuildFlightGuideSchemaOptions {
  url?: string;
  canonicalUrl?: string;
  name?: string;
  title?: string;
  description: string;
  breadcrumbs: BreadcrumbStep[];
  comparedOperators?: OperatorKey[];
  comparedOperatorKeys?: OperatorKey[];
  itemListName?: string;
}

/**
 * Builds factual WebPage + BreadcrumbList (+ ItemList when comparing operators)
 * JSON-LD for Juneau Flight Deck guides.
 *
 * Guardrails:
 * - Juneau Flight Deck is strictly an independent publisher/guide (never a Part 135 operator).
 * - Operators are identified with their official website and LFSE canonical profile in `sameAs`.
 * - Zero unauthorized official logos, zero invented ratings/reviews/availability,
 *   and zero corporate-ownership claims.
 */
export function buildFlightGuideJsonLd(options: BuildFlightGuideSchemaOptions) {
  const pageUrl = options.canonicalUrl ?? options.url ?? "https://juneauflightdeck.com";
  const pageTitle = options.title ?? options.name ?? "Juneau Flight Deck";
  const { description, breadcrumbs, itemListName } = options;
  const operatorKeys = options.comparedOperators ?? options.comparedOperatorKeys ?? [];

  const webpageId = `${pageUrl}#webpage`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;
  const itemListId = `${pageUrl}#operators`;

  const graph: Array<Record<string, unknown>> = [
    {
      "@type": "WebPage",
      "@id": webpageId,
      url: pageUrl,
      name: pageTitle,
      description,
      dateModified: VERIFIED_TARIFF_DATE_ISO,
      isPartOf: {
        "@id": "https://juneauflightdeck.com/#website",
      },
      publisher: {
        "@type": "Organization",
        "@id": "https://juneauflightdeck.com/#organization",
        name: "Juneau Flight Deck",
        url: "https://juneauflightdeck.com",
        description:
          "Independent Juneau flightseeing education, weather-guidance, and concierge planning guide. Juneau Flight Deck is not an aircraft operator or FAA Part 135 air carrier.",
      },
      breadcrumb: {
        "@id": breadcrumbId,
      },
      ...(operatorKeys.length > 0
        ? {
            mainEntity: {
              "@id": itemListId,
            },
          }
        : {}),
    },
    {
      "@type": "BreadcrumbList",
      "@id": breadcrumbId,
      itemListElement: breadcrumbs.map((step, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: step.name,
        item: step.item ?? step.url,
      })),
    },
  ];

  if (operatorKeys.length > 0) {
    graph.push({
      "@type": "ItemList",
      "@id": itemListId,
      name:
        itemListName ||
        "Independent Comparison of Licensed Commercial Aviation Operators",
      numberOfItems: operatorKeys.length,
      itemListElement: operatorKeys.map((key, index) => {
        const op = VERIFIED_OPERATORS[key];
        return {
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Organization",
            name: op.name,
            url: op.officialWebsite,
            description: op.faaCertificateNote,
            sameAs: [op.officialWebsite, op.lfseProfileUrl],
          },
        };
      }),
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
