import { headers } from "next/headers";
import { logDiscoveryRequest } from "@/lib/dcc/discoveryTelemetry";

export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = new Set([
  "destinationcommandcenter.com",
  "www.destinationcommandcenter.com",
  "shuttletosomersetamphitheater.com",
  "www.shuttletosomersetamphitheater.com",
  "welcometoneworleanstours.com",
  "www.welcometoneworleanstours.com",
  "lastfrontiershoreexcursions.com",
  "www.lastfrontiershoreexcursions.com",
]);

const PUBLIC_CRAWL_RULES = [
  "Allow: /",
  "Allow: /api/location/",
  "Disallow: /admin/",
  "Disallow: /api/",
  "Disallow: /internal/",
  "Disallow: /dashboard/",
  "Disallow: /_vercel/",
  "Disallow: /wp-content/",
  "Disallow: /test/",
  "Disallow: /preview/",
];

function crawlerGroup(userAgent: string) {
  return [`User-agent: ${userAgent}`, ...PUBLIC_CRAWL_RULES].join("\n");
}

export function buildRobotsTxt(host: string) {
  const isWno = host === "welcometoneworleanstours.com" || host === "www.welcometoneworleanstours.com";
  const isDcc = host === "destinationcommandcenter.com" || host === "www.destinationcommandcenter.com";
  const sitemapUrl = isWno
    ? "https://www.welcometoneworleanstours.com/sitemap.xml"
    : ALLOWED_HOSTS.has(host)
    ? `https://${host}/sitemap.xml`
    : "https://destinationcommandcenter.com/sitemap.xml";

  const groups = [crawlerGroup("*")];

  if (isWno) {
    groups.push(crawlerGroup("OAI-SearchBot"));
    groups.push(crawlerGroup("PerplexityBot"));
    groups.push(crawlerGroup("Claude-SearchBot"));
    groups.push(crawlerGroup("Claude-User"));
  }

  const sitemaps = [`Sitemap: ${sitemapUrl}`];
  if (isDcc) {
    sitemaps.unshift("Sitemap: https://destinationcommandcenter.com/sitemap-index.xml");
  }

  return [...groups, ...sitemaps].join("\n\n");
}

export async function GET() {
  const h = await headers();
  const hostHeader = h.get("x-forwarded-host") || h.get("host") || "";
  const host = hostHeader.split(":")[0];

  logDiscoveryRequest({
    surface: "robots",
    path: "/robots.txt",
    userAgent: h.get("user-agent"),
    referer: h.get("referer"),
  });

  return new Response(buildRobotsTxt(host), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
