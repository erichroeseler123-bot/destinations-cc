import {
  DISCOVERABLE_LOCATIONS,
  canonicalCoordinate,
  type DiscoverableLocation,
} from "@/lib/dcc/locationDiscovery";
import { SITE_IDENTITY } from "@/src/data/site-identity";

export const DCC_CORE_PATHS = ["/", "/about", "/developers", "/directory"] as const;

export const DCC_SITEMAP_SECTIONS = [
  "core",
  "cities",
  "venues",
  "resorts",
  "ports",
  "islands",
] as const;

export type DccSitemapSection = (typeof DCC_SITEMAP_SECTIONS)[number];

const TYPE_TO_SECTION: Record<DiscoverableLocation["type"], DccSitemapSection> = {
  city: "cities",
  venue: "venues",
  resort: "resorts",
  port: "ports",
  island: "islands",
};

export function discoverablePath(location: DiscoverableLocation): string {
  return `/location/${canonicalCoordinate(location.lat)}/${canonicalCoordinate(location.lng)}`;
}

export function sitemapEligibleLocations(): DiscoverableLocation[] {
  return DISCOVERABLE_LOCATIONS.filter((location) => location.qualityScore >= 90);
}

export function sitemapPathsForSection(section: DccSitemapSection): string[] {
  if (section === "core") return [...DCC_CORE_PATHS];

  return sitemapEligibleLocations()
    .filter((location) => TYPE_TO_SECTION[location.type] === section)
    .map(discoverablePath)
    .sort((a, b) => a.localeCompare(b));
}

export function activeDccSitemapSections(): DccSitemapSection[] {
  return DCC_SITEMAP_SECTIONS.filter((section) => sitemapPathsForSection(section).length > 0);
}

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildDccSectionSitemapXml(
  section: DccSitemapSection,
  origin: string = SITE_IDENTITY.siteUrl,
): string {
  const lastmod = new Date().toISOString();
  const paths = sitemapPathsForSection(section);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map(
      (pathname) =>
        `  <url><loc>${xmlEscape(`${origin}${pathname}`)}</loc><lastmod>${xmlEscape(lastmod)}</lastmod></url>`,
    ),
    "</urlset>",
  ].join("\n");
}

export function buildDccSitemapIndexXml(origin: string = SITE_IDENTITY.siteUrl): string {
  const lastmod = new Date().toISOString();

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...activeDccSitemapSections().map(
      (section) =>
        `  <sitemap><loc>${xmlEscape(`${origin}/sitemaps/${section}.xml`)}</loc><lastmod>${xmlEscape(lastmod)}</lastmod></sitemap>`,
    ),
    "</sitemapindex>",
  ].join("\n");
}

export function isDccSitemapSection(value: string): value is DccSitemapSection {
  return (DCC_SITEMAP_SECTIONS as readonly string[]).includes(value);
}
