import { INDEXABLE_SURFACE_PATHS } from "@/src/data/indexable-surface";
import { headers } from "next/headers";
import { SITE_IDENTITY } from "@/src/data/site-identity";
import { SOMERSET_PAGE_PATHS } from "@/lib/dcc/corridors/somersetPages";

export const dynamic = "force-dynamic";

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
): string {
  const lastmod = new Date().toISOString();
  const urls = [...paths].map((pathname) => toAbsoluteUrl(pathname, origin)).sort();

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
      (url) =>
        `  <url><loc>${xmlEscape(url)}</loc><lastmod>${xmlEscape(lastmod)}</lastmod></url>`,
    ),
    "</urlset>",
  ].join("\n");
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
    const origin = `https://${host}`;
    const wtoPaths = [
      "/",
      "/tours",
      "/categories/swamp-tours",
      "/categories/airboat-tours",
      "/guides/best-new-orleans-swamp-tour",
      "/guides/french-quarter-tour-timing",
    ];
    return new Response(buildDccSitemapXml(wtoPaths, origin), {
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
