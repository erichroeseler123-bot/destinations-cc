import { DCC_SITE_TRUTH, type DccPortfolioTruthRecord } from "@/lib/dcc/siteTruth";
import {
  getDccRegisteredSiteManifestV1,
  isExcludedPortfolioSite,
} from "@/lib/dcc/portfolioNetworkRegistry";

export type NetworkConfig = {
  slug: string;
  dccId: string;
  name: string;
  domain: string;
  canonicalUrl: string;
  statusState: string;
  marketScopeLabel: string;
  marketScope: string;
  activeItemsLabel: string;
  activeItemsList: string;
  description: string;
  providerModel: string;
  activeItems: { name: string; desc: string; url: string }[];
  linkBackTitle: string;
  linkBackDesc: string;
  linkBackUrl: string;
  linkBackCta: string;
};

const CURATED_OVERRIDES: Record<string, Partial<NetworkConfig> & { truthId: string }> = {
  "last-frontier-shore-excursions": {
    truthId: "last-frontier-shore-excursions",
    slug: "last-frontier-shore-excursions",
    name: "Last Frontier Shore Excursions",
    domain: "lastfrontiershoreexcursions.com",
    canonicalUrl: "https://www.lastfrontiershoreexcursions.com",
    marketScopeLabel: "Market Scope",
    marketScope: "Alaska Cruise Ports",
    activeItemsLabel: "Active Ports",
    activeItemsList: "Juneau, Skagway, Ketchikan, Sitka, Icy Strait Point",
    description:
      "Last Frontier Shore Excursions is an active Alaska cruise-port excursion comparison and decision storefront in the Destination Command Center network. This record confirms the canonical domain, market scope, supported ports, public sitemap, and disclosed provider booking exits associated with the site.",
    providerModel: "Disclosed partner / affiliate booking exits (Viator & FareHarbor)",
    activeItems: [
      {
        name: "Juneau",
        desc: "Whale watching, Mendenhall Glacier, and glacier flightseeing routes",
        url: "https://www.lastfrontiershoreexcursions.com/ports/juneau",
      },
      {
        name: "Skagway",
        desc: "White Pass corridor excursions, Yukon border tours, and wilderness hikes",
        url: "https://www.lastfrontiershoreexcursions.com/ports/skagway",
      },
      {
        name: "Ketchikan",
        desc: "Misty Fjords floatplanes, rainforest routes, and totem heritage parks",
        url: "https://www.lastfrontiershoreexcursions.com/ports/ketchikan",
      },
    ],
    linkBackTitle: "Last Frontier Shore Excursions",
    linkBackDesc: "Browse shore excursions by cruise port and sailing fit for your Alaska port day.",
    linkBackUrl: "https://www.lastfrontiershoreexcursions.com/",
    linkBackCta: "Visit Last Frontier Shore Excursions",
  },
  "welcome-to-new-orleans-tours": {
    truthId: "wno-tours",
    slug: "welcome-to-new-orleans-tours",
    name: "Welcome to New Orleans Tours",
    domain: "welcometoneworleanstours.com",
    canonicalUrl: "https://www.welcometoneworleanstours.com",
    marketScopeLabel: "Market Scope",
    marketScope: "New Orleans visitor tours",
    activeItemsLabel: "Active Categories",
    activeItemsList:
      "Swamp tours, airboat tours, French Quarter walks, food/cocktail, ghost/cemetery, riverboat cruises",
    description:
      "Welcome to New Orleans Tours is an active New Orleans tour recommendation and operator-handoff storefront in the Destination Command Center network. This record confirms the canonical domain, market scope, active categories, and disclosed provider booking path associated with the site.",
    providerModel: "Disclosed partner / affiliate / direct provider exits",
    activeItems: [
      {
        name: "Swamp Tours",
        desc: "Covered pontoon cruises through Lafitte and LaPlace bayous",
        url: "https://www.welcometoneworleanstours.com/categories/swamp-tours",
      },
      {
        name: "Airboat Tours",
        desc: "Small-boat and high-speed open-air marsh runs in South Louisiana",
        url: "https://www.welcometoneworleanstours.com/categories/airboat-tours",
      },
      {
        name: "French Quarter Tours",
        desc: "Guided architectural walks, history routes, and jazz heritage walks",
        url: "https://www.welcometoneworleanstours.com/categories/french-quarter-tours",
      },
      {
        name: "Food & Cocktail Tours",
        desc: "Culinary tastings and historic cocktail walks in the Quarter",
        url: "https://www.welcometoneworleanstours.com/categories/food-and-cocktail-tours",
      },
      {
        name: "Ghost & Cemetery Tours",
        desc: "Evening history walks and cemetery architecture tours",
        url: "https://www.welcometoneworleanstours.com/categories/ghost-and-cemetery-tours",
      },
      {
        name: "Mississippi Cruises",
        desc: "Paddlewheel steamboat daytime sightseeing and jazz river cruises",
        url: "https://www.welcometoneworleanstours.com/categories/riverboat-cruises",
      },
    ],
    linkBackTitle: "Welcome to New Orleans Tours",
    linkBackDesc: "Compare verified swamp, walking, food, and riverboat tours in New Orleans.",
    linkBackUrl: "https://www.welcometoneworleanstours.com/",
    linkBackCta: "Visit Welcome to New Orleans Tours",
  },
};

function formatAuthorityLabel(value: string): string {
  return value
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function deriveProviderModel(record: DccPortfolioTruthRecord): string {
  if (record.booking?.finality) {
    return record.booking.finality;
  }
  switch (record.booking?.authority) {
    case "site":
      return record.booking.takes_payment
        ? "Direct operator checkout on property"
        : "Operator reservation / quote confirmation on property";
    case "driver":
      return "Driver request-and-acceptance marketplace";
    case "operator":
      return "Routes travelers to listed operator checkout (property takes no direct payment)";
    case "provider":
      return "Disclosed third-party provider / affiliate booking exits";
    default:
      return "Public planning and context surface (no direct checkout or payment capture)";
  }
}

function resolveTruthRecordForSlug(slug: string): DccPortfolioTruthRecord | null {
  const normalized = slug.trim().toLowerCase();
  if (!normalized || isExcludedPortfolioSite(normalized)) {
    return null;
  }
  const curated = CURATED_OVERRIDES[normalized];
  if (curated) {
    return DCC_SITE_TRUTH.find((r) => r.id === curated.truthId) || null;
  }
  const direct = DCC_SITE_TRUTH.find(
    (r) =>
      r.id === normalized ||
      r.dcc_id === `dcc:site:${normalized}` ||
      r.id.replace(/-/g, "") === normalized.replace(/-/g, ""),
  );
  if (direct) return direct;

  const manifest = getDccRegisteredSiteManifestV1(normalized);
  if (manifest) {
    const manifestDomain = manifest.canonical_domains[0]?.toLowerCase().replace(/^www\./, "");
    return (
      DCC_SITE_TRUTH.find(
        (r) =>
          r.url.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ===
          manifestDomain,
      ) || null
    );
  }
  return null;
}

export function resolveNetworkRecord(slug: string): NetworkConfig | null {
  const record = resolveTruthRecordForSlug(slug);
  if (!record || record.status.state === "retired") {
    return null;
  }

  const canonicalUrl = record.url.replace(/\/+$/, "");
  const domain = canonicalUrl.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const authorityLabels = record.authority.map(formatAuthorityLabel);
  const override =
    CURATED_OVERRIDES[slug.trim().toLowerCase()] ||
    Object.values(CURATED_OVERRIDES).find((entry) => entry.truthId === record.id);

  const baseConfig: NetworkConfig = {
    slug: override?.slug || record.id,
    dccId: record.dcc_id,
    name: record.name,
    domain,
    canonicalUrl,
    statusState: record.status.state,
    marketScopeLabel: "Property Role",
    marketScope: formatAuthorityLabel(record.type),
    activeItemsLabel: "Declared Authority",
    activeItemsList: authorityLabels.join(", "),
    description: `${record.name} is a verified ${record.status.state} property in the Destination Command Center portfolio (${record.role}).${record.status.note ? ` ${record.status.note}` : ""}`,
    providerModel: deriveProviderModel(record),
    activeItems: record.authority.map((auth) => ({
      name: formatAuthorityLabel(auth),
      desc: `Verified scope boundary under ${record.dcc_id} (last verified ${record.provenance.last_verified}).`,
      url: canonicalUrl,
    })),
    linkBackTitle: record.name,
    linkBackDesc: `Open the canonical ${record.name} property directly.`,
    linkBackUrl: `${canonicalUrl}/`,
    linkBackCta: `Visit ${record.name}`,
  };

  if (!override) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    ...override,
    dccId: record.dcc_id,
    statusState: record.status.state,
  };
}
