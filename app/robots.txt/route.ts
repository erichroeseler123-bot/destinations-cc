import { headers } from "next/headers";

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
  const sitemapUrl = isWno
    ? "https://www.welcometoneworleanstours.com/sitemap.xml"
    : ALLOWED_HOSTS.has(host)
    ? `https://${host}/sitemap.xml`
    : "https://destinationcommandcenter.com/sitemap.xml";

  const groups = [crawlerGroup("*")];

  // Search/citation and user-requested retrieval crawlers are explicit on WNO
  // so discovery policy is auditable. This does not redefine the separate
  // training/model-development crawler policy.
  if (isWno) {
    groups.push(crawlerGroup("OAI-SearchBot"));
    groups.push(crawlerGroup("PerplexityBot"));
    groups.push(crawlerGroup("Claude-SearchBot"));
    groups.push(crawlerGroup("Claude-User"));
  }

  return [...groups, `Sitemap: ${sitemapUrl}`].join("\n\n");
}

export async function GET() {
  const hostHeader = (await headers()).get("x-forwarded-host") || (await headers()).get("host") || "";
  // Normalize/remove port if present
  const host = hostHeader.split(":")[0];

  return new Response(buildRobotsTxt(host), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}