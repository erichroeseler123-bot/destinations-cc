import { INDEXABLE_SURFACE_PATHS } from "@/src/data/indexable-surface";
import { PUBLISHED_DECISION_GUIDES } from "@/src/data/published-decision-guides";
import { DECISION_CATEGORIES } from "@/src/data/decision-taxonomy";
import { headers } from "next/headers";
import { SITE_IDENTITY } from "@/src/data/site-identity";
import { SOMERSET_PAGE_PATHS } from "@/lib/dcc/corridors/somersetPages";
import { ALL_PRODUCTS, SEO_PAGES } from "@/app/new-orleans/data";
import { COMMERCIAL_CATEGORY_PAGES } from "@/app/new-orleans/data/commercialCategoryPages";
import { COMPARISON_OPPORTUNITIES } from "@/app/new-orleans/data/comparisonRegistry";
import { INTENT_SEO_PAGES } from "@/app/new-orleans/data/intentSeoPages";
import { AUDIENCE_INTENT_SEO_PAGES } from "@/app/new-orleans/data/audienceIntentSeoPages";

export const dynamic = "force-dynamic";
export const WTONOT_ORIGIN = "https://www.welcometoneworleanstours.com";

export const WTONOT_SUPPORT_PATHS = [
  "/contact", "/about", "/faq", "/booking-help", "/privacy", "/terms",
  "/cancellation-policy", "/affiliate-disclosure", "/accessibility",
] as const;

const WTONOT_DECISION_GUIDES = [
  "/guides/new-orleans-swamp-tour-without-a-car", "/guides/can-kids-ride-airboats-new-orleans",
  "/guides/whitney-plantation-vs-oak-alley-history-focus", "/guides/new-orleans-tours-for-grandparents-and-kids",
  "/guides/new-orleans-tours-limited-mobility", "/guides/best-new-orleans-tours-if-you-arrive-at-noon",
  "/guides/best-new-orleans-tours-for-a-rainy-day", "/guides/best-new-orleans-tours-under-4-or-6-hours",
  "/guides/new-orleans-tours-without-an-all-day-bus-ride", "/guides/new-orleans-tours-near-french-quarter",
  "/guides/best-new-orleans-tours-with-kids-under-6", "/guides/new-orleans-tours-with-minimal-walking",
  "/guides/new-orleans-tours-under-50-dollars", "/guides/new-orleans-tours-that-fit-before-dinner",
] as const;

const WTONOT_HIGH_INTENT_PATHS = [
  "/guides",
  "/guides/plan-new-orleans-tours",
  "/guides/things-to-do-in-new-orleans-today",
  "/guides/new-orleans-tours-tonight",
  "/guides/4-hours-in-new-orleans",
  "/guides/first-time-new-orleans-tours",
  "/guides/new-orleans-tours-for-families",
  "/guides/best-swamp-tour-with-transportation",
  "/guides/new-orleans-tours-with-transportation",
  "/guides/new-orleans-plantation-and-swamp-tour",
  "/guides/things-to-do-before-a-cruise-new-orleans",
  "/guides/things-to-do-after-a-cruise-new-orleans",
] as const;

const WTONOT_LIVE_CITY_PATHS = [
  "/guides/whats-happening",
  "/guides/tonight",
  "/guides/this-weekend",
  "/guides/where-to-eat",
  "/guides/restaurant-partners",
] as const;

const WTONOT_MACHINE_DISCOVERY_PATHS = [
  "/guides/tour-catalog",
] as const;

const WTONOT_COMMERCIAL_CATEGORY_PATHS = Object.values(COMMERCIAL_CATEGORY_PAGES)
  .filter((page) => page.status === "live" && page.isIndexable && page.publicRoute !== "/combo-tours")
  .map((page) => page.publicRoute);

const WTONOT_SUPERSEDED_SEO_PATHS = new Set(["/swamp-tours/airboat-vs-covered-boat", "/swamp-tours/small-vs-large-airboat", "/swamp-tours/pickup-vs-self-drive"]);

function xmlEscape(value: string): string { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;"); }
function toAbsoluteUrl(pathname: string, origin: string = SITE_IDENTITY.siteUrl): string { return `${origin}${pathname}`; }

export function buildDccSitemapXml(paths: readonly string[] = INDEXABLE_SURFACE_PATHS, origin: string = SITE_IDENTITY.siteUrl, includeLastmod: boolean = true): string {
  const lastmod = includeLastmod ? new Date().toISOString() : null;
  const urls = [...paths].map((pathname) => toAbsoluteUrl(pathname, origin)).sort();
  return ['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',...urls.map((url) => lastmod ? `  <url><loc>${xmlEscape(url)}</loc><lastmod>${xmlEscape(lastmod)}</lastmod></url>` : `  <url><loc>${xmlEscape(url)}</loc></url>`),"</urlset>"].join("\n");
}

export function buildWtonotSitemapPaths() {
  const intentPaths = INTENT_SEO_PAGES.map((page) => `/guides/${page.slug}`);
  const audienceIntentPaths = AUDIENCE_INTENT_SEO_PAGES.map((page) => `/guides/${page.slug}`);
  const wtoPaths = ["/", "/tours", "/compare", "/french-quarter-welcome-stop", "/guides/french-quarter-orientation", "/guides/visitor-rewards", ...WTONOT_MACHINE_DISCOVERY_PATHS, ...WTONOT_HIGH_INTENT_PATHS, ...WTONOT_LIVE_CITY_PATHS, ...WTONOT_COMMERCIAL_CATEGORY_PATHS, ...intentPaths, ...audienceIntentPaths, ...WTONOT_DECISION_GUIDES, ...WTONOT_SUPPORT_PATHS];
  ALL_PRODUCTS.forEach((product: any) => { if (product.status === "live" && product.isIndexable) wtoPaths.push(`/tours/${product.slug}`); });
  Object.values(SEO_PAGES).forEach((page: any) => { if (page.status === "live" && page.isIndexable && !WTONOT_SUPERSEDED_SEO_PATHS.has(page.publicRoute)) wtoPaths.push(page.publicRoute); });
  COMPARISON_OPPORTUNITIES.forEach((comparison) => { if (comparison.status === "READY_TO_PUBLISH") wtoPaths.push(`/compare/${comparison.slug}`); });
  return Array.from(new Set(wtoPaths));
}

export async function GET() {
  const h = await headers();
  const hostHeader = h.get("x-forwarded-host") || h.get("host") || "";
  const host = hostHeader.split(":")[0].toLowerCase();
  const isWtonotHost = host === "welcometoneworleanstours.com" || host === "www.welcometoneworleanstours.com";
  const isSomersetHost = host === "shuttletosomersetamphitheater.com" || host === "www.shuttletosomersetamphitheater.com";
  const isLfseHost = host === "lastfrontiershoreexcursions.com" || host === "www.lastfrontiershoreexcursions.com";
  const isJfdHost = host === "juneauflightdeck.com" || host === "www.juneauflightdeck.com";
  const isDellsHost = host === "welcometothedells.com" || host === "www.welcometothedells.com";

  if (isJfdHost) return new Response(buildDccSitemapXml(["/", "/helicopter"], "https://juneauflightdeck.com", false), { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" } });
  if (isDellsHost) return new Response(buildDccSitemapXml(["/"], "https://welcometothedells.com", false), { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" } });
  if (isLfseHost) return new Response(buildDccSitemapXml(["/", "/tours", "/ports", "/ports/juneau", "/ports/skagway", "/ports/ketchikan"], "https://www.lastfrontiershoreexcursions.com"), { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" } });
  if (isWtonotHost) return new Response(buildDccSitemapXml(buildWtonotSitemapPaths(), WTONOT_ORIGIN, false), { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" } });

  const origin = isSomersetHost ? `https://${host}` : SITE_IDENTITY.siteUrl;
  const preSiteGuidePaths = ["/guides", "/ask", "/vibe-around", "/shuttleya", "/juneau-flightseeing", "/french-quarter-orientation", "/new-orleans-swamp-tours", ...DECISION_CATEGORIES.map((category) => `/guides/category/${category.slug}`), ...PUBLISHED_DECISION_GUIDES.map((guide) => `/guides/${guide.slug}`)];
  const dccPaths = [...new Set([...INDEXABLE_SURFACE_PATHS, ...SOMERSET_PAGE_PATHS, ...preSiteGuidePaths])];
  const body = isSomersetHost ? buildDccSitemapXml(SOMERSET_PAGE_PATHS, origin) : buildDccSitemapXml(dccPaths);
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" } });
}