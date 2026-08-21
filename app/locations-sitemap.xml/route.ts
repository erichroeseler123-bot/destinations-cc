import { headers } from "next/headers";
import { logDiscoveryRequest } from "@/lib/dcc/discoveryTelemetry";
import { discoverableLocationPaths } from "@/lib/dcc/locationDiscovery";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.destinationcommandcenter.com";

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const h = await headers();
  logDiscoveryRequest({
    surface: "locations_sitemap",
    path: "/locations-sitemap.xml",
    userAgent: h.get("user-agent"),
    referer: h.get("referer"),
  });

  const urls = discoverableLocationPaths().map((path) => `${SITE_URL}${path}`);
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${xmlEscape(url)}</loc></url>`),
    "</urlset>",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
