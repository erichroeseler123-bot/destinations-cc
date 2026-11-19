import {
  LFSE_PUBLISHER_ORGANIZATION,
  LFSE_SITE_URL,
  buildBreadcrumbListNode,
} from "./structuredData";
import type { SoutheastAlaskaFishingLodgeRecord } from "../../../lib/dcc/shared/southeastAlaskaFishingLodgesContract";

export const SEAK_FISHING_LODGES_PATH = "/southeast-alaska/fishing-lodges" as const;
export const SEAK_FISHING_LODGES_CANONICAL_URL =
  `${LFSE_SITE_URL}${SEAK_FISHING_LODGES_PATH}` as const;
export const DCC_ALASKA_FISHING_LODGES_API_URL =
  "https://www.destinationcommandcenter.com/api/v1/alaska/fishing-lodges" as const;

/**
 * Bounded Preview release gate:
 * Remains `false` on isolated Preview so search indexing, Production sitemap.xml,
 * and Production global chrome remain untouched until explicit owner promotion.
 */
export const SEAK_FISHING_LODGES_RELEASE_READY = false as const;

export function buildFishingLodgesDirectoryJsonLd(
  lodges: readonly Pick<SoutheastAlaskaFishingLodgeRecord, "slug" | "displayName">[],
) {
  const itemListId = `${SEAK_FISHING_LODGES_CANONICAL_URL}#itemlist`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SEAK_FISHING_LODGES_CANONICAL_URL}#webpage`,
        url: SEAK_FISHING_LODGES_CANONICAL_URL,
        name: "Southeast Alaska Fishing Lodges, Basecamps & Private Stays Directory",
        description:
          "Independent, source-backed directory of Southeast Alaska fishing lodges, DIY boat-and-lodging basecamps, and whole-lodge private stays.",
        isPartOf: { "@id": `${LFSE_SITE_URL}/#website` },
        publisher: LFSE_PUBLISHER_ORGANIZATION,
        isBasedOn: DCC_ALASKA_FISHING_LODGES_API_URL,
        mainEntity: { "@id": itemListId },
        inLanguage: "en-US",
      },
      {
        "@type": "ItemList",
        "@id": itemListId,
        name: "Southeast Alaska Fishing Lodges & Basecamps",
        numberOfItems: lodges.length,
        itemListElement: lodges.map((lodge, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: lodge.displayName,
          url: `${SEAK_FISHING_LODGES_CANONICAL_URL}/${lodge.slug}`,
        })),
      },
      buildBreadcrumbListNode(SEAK_FISHING_LODGES_PATH, [
        { name: "Home", path: "/" },
        { name: "Southeast Alaska", path: "/southeast-alaska" },
        { name: "Fishing Lodges", path: SEAK_FISHING_LODGES_PATH },
      ]),
    ],
  };
}

export function buildFishingLodgeDetailJsonLd(
  lodge: SoutheastAlaskaFishingLodgeRecord,
) {
  const path = `${SEAK_FISHING_LODGES_PATH}/${lodge.slug}`;
  const entityId = `${LFSE_SITE_URL}${path}#lodging`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${LFSE_SITE_URL}${path}#webpage`,
        url: `${LFSE_SITE_URL}${path}`,
        name: `${lodge.displayName} — Southeast Alaska Fishing Lodge Fact Sheet`,
        description: lodge.headlineSummary,
        isPartOf: { "@id": `${LFSE_SITE_URL}/#website` },
        publisher: LFSE_PUBLISHER_ORGANIZATION,
        isBasedOn: DCC_ALASKA_FISHING_LODGES_API_URL,
        mainEntity: { "@id": entityId },
        dateModified: lodge.lastModifiedAt,
        inLanguage: "en-US",
      },
      {
        "@type": "LodgingBusiness",
        "@id": entityId,
        name: lodge.accommodation.propertyName,
        description: lodge.headlineSummary,
        url: lodge.operatingCompany.officialWebsite,
        ...(lodge.operatingCompany.officialPhone
          ? { telephone: lodge.operatingCompany.officialPhone }
          : {}),
        address: {
          "@type": "PostalAddress",
          addressLocality: lodge.accommodation.actualLocationLabel,
          addressRegion: "AK",
          addressCountry: "US",
        },
      },
      buildBreadcrumbListNode(path, [
        { name: "Home", path: "/" },
        { name: "Southeast Alaska", path: "/southeast-alaska" },
        { name: "Fishing Lodges", path: SEAK_FISHING_LODGES_PATH },
        { name: lodge.displayName, path },
      ]),
    ],
  };
}
