import { INDEXABLE_SURFACE_PATHS } from "@/src/data/indexable-surface";
import { headers } from "next/headers";
import { SITE_IDENTITY } from "@/src/data/site-identity";
import { SOMERSET_PAGE_PATHS } from "@/lib/dcc/corridors/somersetPages";
import { ALL_PRODUCTS, SEO_PAGES } from "@/app/new-orleans/data";
import { COMPARISON_OPPORTUNITIES } from "@/app/new-orleans/data/comparisonRegistry";

export const dynamic = "force-dynamic";

export const WTONOT_ORIGIN = "https://welcometoneworleanstours.com";

export const WTONOT_SUPPORT_PATHS = [
  "/contact",
  "/about",
  "/faq",
  "/booking-help",
  "/privacy",
  "/terms",
  "/cancellation-policy",
  "/affiliate-disclosure",
  "/accessibility",
] as const;

const WTONOT_SUPERSEDED_SEO_PATHS = new Set([
  "/swamp-tours/airboat-vs-covered-boat",
  "/swamp-tours/small-vs-large-airboat",
  "/swamp-tours/pickup-vs-self-drive",
]);

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toAbsoluteUrl(pathname: string, origin: string = SITE_IDENTITY.siteUrl): string {
  return `${origin}${pathname}`;
}

export function buildDccSitemapXml(
  paths: readonly string[] = INDEXABLE_SURFACE_PATHS,
  origin: string = SITE_IDENTITY.siteUrl,
  includeLastmod: boolean = true,
): string {
  const lastmod = includeLastmod ? new Date().toISOString() : null;
  const urls = [...paths].map((pathname) => toAbsoluteUrl(pathname, origin)).sort();

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) =>
      lastmod
        ? `  <url><loc>${xmlEscape(url)}</loc><lastmod>${xmlEscape(lastmod)}</lastmod></url>`
        : `  <url><loc>${xmlEscape(url)}</loc></url>`,
    ),
    "</urlset>",
  ].join("\n");
}

export function buildWtonotSitemapPaths() {
  const wtoPaths = [
    "/",
    "/tours",
    "/compare",
    "/french-quarter-welcome-stop",
    ...WTONOT_SUPPORT_PATHS,
  ];

  ALL_PRODUCTS.forEach((product: any) => {
    if (product.status === "live" && product.isIndexable) {
      wtoPaths.push(`/tours/${product.slug}`);
    }
  });

  Object.values(SEO_PAGES).forEach((page: any) => {
    if (
      page.status === "live" &&
      page.isIndexable &&
      !WTONOT_SUPERSEDED_SEO_PATHS.has(page.publicRoute)
    ) {
      wtoPaths.push(page.publicRoute);
    }
  });

  COMPARISON_OPPORTUNITIES.forEach((comparison) => {
    if (comparison.status === "READY_TO_PUBLISH") {
      wtoPaths.push(`/compare/${comparison.slug}`);
    }
  });

  const legacyPaths = [
    "/guides/best-new-orleans-swamp-tour",
    "/guides/french-quarter-tour-timing",
  ];
  legacyPaths.forEach((legacyPath) => {
    if (!wtoPaths.includes(legacyPath)) wtoPaths.push(legacyPath);
  });

  return Array.from(new Set(wtoPaths));
}

export async function GET() {
  const hostHeader = (await headers()).get("x-forwarded-host") || (await headers()).get("host") || "";
  const host = hostHeader.split(":")[0];
  const isWtonotHost = host === "welcometoneworleanstours.com" || host === "www.welcometoneworleanstours.com";
  const isSomersetHost = host === "shuttletosomersetamphitheater.com" || host === "www.shuttletosomersetamphitheater.com";
  const isLfseHost = host === "lastfrontiershoreexcursions.com" || host === "www.lastfrontiershoreexcursions.com";

  if (isLfseHost) {
    const origin = `https://www.lastfrontiershoreexcursions.com`;
    const lfsePaths = [
      "/",
      "/tours",
      "/ports",
      "/ports/juneau",
      "/ports/skagway",
      "/ports/ketchikan",
    ];
    return new Response(buildDccSitemapXml(lfsePaths, origin), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  }

  if (isWtonotHost) {
    return new Response(buildDccSitemapXml(buildWtonotSitemapPaths(), WTONOT_ORIGIN, false), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  }

  const origin = isSomersetHost ? `https://${host}` : SITE_IDENTITY.siteUrl;
  const dccPaths = [...new Set([...INDEXABLE_SURFACE_PATHS, ...SOMERSET_PAGE_PATHS])];
  const body = isSomersetHost
    ? buildDccSitemapXml(SOMERSET_PAGE_PATHS, origin)
    : buildDccSitemapXml(dccPaths);

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
