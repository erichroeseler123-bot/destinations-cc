import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

const SOMERSET_CANONICAL_ROUTES = [
  "/",
  "/somerset-amphitheater-shuttle",
  "/somerset-concert-transportation",
  "/somerset-amphitheater-parking-and-transportation",
];

export function buildSomersetSitemapXml(origin = "https://www.shuttletosomersetamphitheater.com") {
  const lastmod = new Date().toISOString();
  const cleanOrigin = origin.includes("shuttletosomersetamphitheater")
    ? "https://www.shuttletosomersetamphitheater.com"
    : origin;

  const isSomersetDomain = cleanOrigin.includes("shuttletosomersetamphitheater");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...SOMERSET_CANONICAL_ROUTES.map((route) => {
      const path = isSomersetDomain
        ? route
        : (route === "/" ? "/somerset-wi" : `/somerset-wi${route}`);
      const url = `${cleanOrigin}${path === "/" ? "" : path}`;
      return `  <url><loc>${xmlEscape(url)}</loc><lastmod>${xmlEscape(lastmod)}</lastmod></url>`;
    }),
    "</urlset>",
  ].join("\n");
}

export async function GET() {
  const host = (await headers()).get("host") || "";
  const origin = host ? `https://${host}` : "https://www.shuttletosomersetamphitheater.com";

  return new Response(buildSomersetSitemapXml(origin), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
