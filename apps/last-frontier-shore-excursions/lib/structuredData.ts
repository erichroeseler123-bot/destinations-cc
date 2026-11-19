export const LFSE_SITE_URL = "https://www.lastfrontiershoreexcursions.com";
export const DCC_ALASKA_DIRECTORY_API_URL =
  "https://www.destinationcommandcenter.com/api/v1/alaska/directory";

export const LFSE_PUBLISHER_ORGANIZATION = {
  "@type": "Organization",
  "@id": `${LFSE_SITE_URL}/#organization`,
  name: "Last Frontier Shore Excursions",
  url: LFSE_SITE_URL,
} as const;

export interface BreadcrumbItemInput {
  name: string;
  path: string;
}

export function buildBreadcrumbListNode(
  pagePath: string,
  items: readonly BreadcrumbItemInput[],
) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${LFSE_SITE_URL}${pagePath}#breadcrumb`,
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.path === "/" ? `${LFSE_SITE_URL}/` : `${LFSE_SITE_URL}${item.path}`,
    })),
  };
}

export function buildSoutheastAlaskaHubJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${LFSE_SITE_URL}/southeast-alaska#webpage`,
        url: `${LFSE_SITE_URL}/southeast-alaska`,
        name: "Southeast Alaska Cruise Ports, Communities & Local Operators Directory",
        description:
          "Source-backed regional guide to Southeast Alaska cruise ports, Tlingit communities, terminals, Glacier Bay scenic cruising, excursion categories, and local operators.",
        isPartOf: { "@id": `${LFSE_SITE_URL}/#website` },
        publisher: LFSE_PUBLISHER_ORGANIZATION,
        isBasedOn: DCC_ALASKA_DIRECTORY_API_URL,
        inLanguage: "en-US",
      },
      buildBreadcrumbListNode("/southeast-alaska", [
        { name: "Home", path: "/" },
        { name: "Southeast Alaska", path: "/southeast-alaska" },
      ]),
    ],
  };
}

export function buildPortsDirectoryJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${LFSE_SITE_URL}/ports#webpage`,
        url: `${LFSE_SITE_URL}/ports`,
        name: "Southeast Alaska Cruise Ports, Communities & Scenic Cruising Directory",
        description:
          "Source-backed guide to 12 verified Southeast Alaska cruise ports, communities, terminals, and Glacier Bay scenic cruising.",
        isPartOf: { "@id": `${LFSE_SITE_URL}/#website` },
        publisher: LFSE_PUBLISHER_ORGANIZATION,
        isBasedOn: DCC_ALASKA_DIRECTORY_API_URL,
        inLanguage: "en-US",
      },
      buildBreadcrumbListNode("/ports", [
        { name: "Home", path: "/" },
        { name: "Southeast Alaska", path: "/southeast-alaska" },
        { name: "Ports & Communities", path: "/ports" },
      ]),
    ],
  };
}

export function buildPortDetailJsonLd(params: {
  slug: string;
  name: string;
  hook: string;
  overview: string;
  lastModifiedAt?: string | null;
}) {
  const path = `/ports/${params.slug}`;
  const destinationId = `${LFSE_SITE_URL}${path}#destination`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${LFSE_SITE_URL}${path}#webpage`,
        url: `${LFSE_SITE_URL}${path}`,
        name: `${params.name} — Shore Excursions, Docks & Local Operators`,
        description: params.hook,
        isPartOf: { "@id": `${LFSE_SITE_URL}/#website` },
        publisher: LFSE_PUBLISHER_ORGANIZATION,
        isBasedOn: DCC_ALASKA_DIRECTORY_API_URL,
        mainEntity: { "@id": destinationId },
        ...(params.lastModifiedAt ? { dateModified: params.lastModifiedAt } : {}),
        inLanguage: "en-US",
      },
      {
        "@type": ["TouristDestination", "Place"],
        "@id": destinationId,
        name: `${params.name}, Alaska`,
        url: `${LFSE_SITE_URL}${path}`,
        description: params.overview,
        touristType: ["Cruise Travelers", "Independent Alaska Travelers"],
      },
      buildBreadcrumbListNode(path, [
        { name: "Home", path: "/" },
        { name: "Southeast Alaska", path: "/southeast-alaska" },
        { name: "Ports & Communities", path: "/ports" },
        { name: params.name, path },
      ]),
    ],
  };
}

export function buildPortCategoryJsonLd(params: {
  portSlug: string;
  portName: string;
  categorySlug: string;
  categoryShortLabel: string;
  pageName: string;
  description: string;
  lastModifiedAt?: string | null;
}) {
  const path = `/ports/${params.portSlug}/${params.categorySlug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${LFSE_SITE_URL}${path}#webpage`,
        url: `${LFSE_SITE_URL}${path}`,
        name: params.pageName,
        description: params.description,
        isPartOf: { "@id": `${LFSE_SITE_URL}/#website` },
        publisher: LFSE_PUBLISHER_ORGANIZATION,
        isBasedOn: DCC_ALASKA_DIRECTORY_API_URL,
        ...(params.lastModifiedAt ? { dateModified: params.lastModifiedAt } : {}),
        inLanguage: "en-US",
      },
      buildBreadcrumbListNode(path, [
        { name: "Home", path: "/" },
        { name: "Southeast Alaska", path: "/southeast-alaska" },
        { name: params.portName, path: `/ports/${params.portSlug}` },
        { name: params.categoryShortLabel, path },
      ]),
    ],
  };
}

export function buildOperatorsDirectoryJsonLd(
  operators: ReadonlyArray<{ slug: string; name: string }>,
) {
  const itemListId = `${LFSE_SITE_URL}/operators#itemlist`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${LFSE_SITE_URL}/operators#webpage`,
        url: `${LFSE_SITE_URL}/operators`,
        name: "Southeast Alaska Shore Excursion Operators Directory",
        description:
          "Source-backed company profiles for verified local Southeast Alaska shore excursion operators.",
        isPartOf: { "@id": `${LFSE_SITE_URL}/#website` },
        publisher: LFSE_PUBLISHER_ORGANIZATION,
        isBasedOn: DCC_ALASKA_DIRECTORY_API_URL,
        mainEntity: { "@id": itemListId },
        inLanguage: "en-US",
      },
      {
        "@type": "ItemList",
        "@id": itemListId,
        name: "Verified Southeast Alaska Local Excursion Operators",
        numberOfItems: operators.length,
        itemListElement: operators.map((op, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: op.name,
          url: `${LFSE_SITE_URL}/operators/${op.slug}`,
        })),
      },
      buildBreadcrumbListNode("/operators", [
        { name: "Home", path: "/" },
        { name: "Southeast Alaska", path: "/southeast-alaska" },
        { name: "Operators", path: "/operators" },
      ]),
    ],
  };
}

export function buildOperatorProfileJsonLd(params: {
  slug: string;
  name: string;
  tagline: string;
  companyOverview: string;
  officialWebsite?: string | null;
  officialPhone?: string | null;
  servedPlaceNames: readonly string[];
  lastModifiedAt?: string | null;
}) {
  const path = `/operators/${params.slug}`;
  const operatorNodeId = `${LFSE_SITE_URL}${path}#operator`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${LFSE_SITE_URL}${path}#webpage`,
        url: `${LFSE_SITE_URL}${path}`,
        name: `${params.name} — Southeast Alaska Operator Profile`,
        description: params.tagline,
        isPartOf: { "@id": `${LFSE_SITE_URL}/#website` },
        publisher: LFSE_PUBLISHER_ORGANIZATION,
        isBasedOn: DCC_ALASKA_DIRECTORY_API_URL,
        mainEntity: { "@id": operatorNodeId },
        ...(params.lastModifiedAt ? { dateModified: params.lastModifiedAt } : {}),
        inLanguage: "en-US",
      },
      {
        "@type": ["LocalBusiness", "Organization"],
        "@id": operatorNodeId,
        name: params.name,
        description: params.companyOverview,
        ...(params.officialWebsite
          ? {
              url: params.officialWebsite,
              sameAs: [params.officialWebsite],
            }
          : {}),
        ...(params.officialPhone ? { telephone: params.officialPhone } : {}),
        areaServed: params.servedPlaceNames.map((placeName) => ({
          "@type": "Place",
          name: `${placeName}, Alaska`,
        })),
      },
      buildBreadcrumbListNode(path, [
        { name: "Home", path: "/" },
        { name: "Southeast Alaska", path: "/southeast-alaska" },
        { name: "Operators", path: "/operators" },
        { name: params.name, path },
      ]),
    ],
  };
}

export function buildTourDetailJsonLd(params: {
  operatorSlug: string;
  operatorName: string;
  operatorOfficialWebsite?: string | null;
  tourSlug: string;
  tourTitle: string;
  summary: string;
  portSlug: string;
  portName: string;
  lastModifiedAt?: string | null;
}) {
  const path = `/tours/${params.operatorSlug}/${params.tourSlug}`;
  const tripId = `${LFSE_SITE_URL}${path}#trip`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${LFSE_SITE_URL}${path}#webpage`,
        url: `${LFSE_SITE_URL}${path}`,
        name: `${params.tourTitle} — ${params.operatorName}`,
        description: params.summary,
        isPartOf: { "@id": `${LFSE_SITE_URL}/#website` },
        publisher: LFSE_PUBLISHER_ORGANIZATION,
        isBasedOn: DCC_ALASKA_DIRECTORY_API_URL,
        mainEntity: { "@id": tripId },
        ...(params.lastModifiedAt ? { dateModified: params.lastModifiedAt } : {}),
        inLanguage: "en-US",
      },
      {
        "@type": "TouristTrip",
        "@id": tripId,
        name: params.tourTitle,
        description: params.summary,
        touristType: ["Cruise Travelers", "Independent Alaska Travelers"],
        provider: {
          "@type": "Organization",
          name: params.operatorName,
          ...(params.operatorOfficialWebsite ? { url: params.operatorOfficialWebsite } : {}),
        },
      },
      buildBreadcrumbListNode(path, [
        { name: "Home", path: "/" },
        { name: params.portName, path: `/ports/${params.portSlug}` },
        { name: params.operatorName, path: `/operators/${params.operatorSlug}` },
        { name: params.tourTitle, path },
      ]),
    ],
  };
}

export function buildWeekendInJuneauGuideJsonLd(params: {
  title: string;
  description: string;
  lastModifiedAt: string;
}) {
  const path = "/guides/weekend-in-juneau";
  const destinationId = `${LFSE_SITE_URL}${path}#destination`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${LFSE_SITE_URL}${path}#webpage`,
        url: `${LFSE_SITE_URL}${path}`,
        name: params.title,
        description: params.description,
        isPartOf: { "@id": `${LFSE_SITE_URL}/#website` },
        publisher: LFSE_PUBLISHER_ORGANIZATION,
        isBasedOn: DCC_ALASKA_DIRECTORY_API_URL,
        mainEntity: { "@id": destinationId },
        dateModified: params.lastModifiedAt,
        inLanguage: "en-US",
      },
      {
        "@type": ["TouristDestination", "Place"],
        "@id": destinationId,
        name: "Juneau, Alaska",
        url: `${LFSE_SITE_URL}/ports/juneau`,
        description:
          "Alaska's roadless capital city along Gastineau Channel, combining Mendenhall Glacier, Juneau Icefield aviation, Auke Bay humpback whale waters, rainforest trails, museums, and walkable downtown dining.",
        touristType: ["Independent Fly-In Travelers", "Multi-Day Alaska Stay Travelers"],
      },
      buildBreadcrumbListNode(path, [
        { name: "Home", path: "/" },
        { name: "Juneau", path: "/ports/juneau" },
        { name: "Weekend in Juneau Guide", path },
      ]),
    ],
  };
}
