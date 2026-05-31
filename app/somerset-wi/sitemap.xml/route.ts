import { headers } from "next/headers";
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

export function buildSomersetSitemapXml(origin = "https://www.destinationcommandcenter.com") {
  const lastmod = new Date().toISOString();
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...SOMERSET_PAGE_PATHS.map((pathname) => {
      const url = `${origin}${pathname}`;
      return `  <url><loc>${xmlEscape(url)}</loc><lastmod>${xmlEscape(lastmod)}</lastmod></url>`;
    }),
    "</urlset>",
  ].join("\n");
}

export async function GET() {
  const host = (await headers()).get("host") || "";
  const origin = host ? `https://${host}` : undefined;

  return new Response(buildSomersetSitemapXml(origin), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
