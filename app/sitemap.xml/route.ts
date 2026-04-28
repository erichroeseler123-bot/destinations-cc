import { INDEXABLE_SURFACE_PATHS } from "@/src/data/indexable-surface";
import { SITE_IDENTITY } from "@/src/data/site-identity";

export const dynamic = "force-static";

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toAbsoluteUrl(pathname: string): string {
  return `${SITE_IDENTITY.siteUrl}${pathname}`;
}

export function buildDccSitemapXml(paths: readonly string[] = INDEXABLE_SURFACE_PATHS): string {
  const lastmod = new Date().toISOString();
  const urls = [...paths].map(toAbsoluteUrl).sort();

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

export function GET() {
  const body = buildDccSitemapXml();

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
