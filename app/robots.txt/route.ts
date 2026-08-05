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

export function buildRobotsTxt(host: string) {
  const sitemapUrl = host === "welcometoneworleanstours.com" || host === "www.welcometoneworleanstours.com"
    ? "https://welcometoneworleanstours.com/sitemap.xml"
    : ALLOWED_HOSTS.has(host)
    ? `https://${host}/sitemap.xml`
    : "https://destinationcommandcenter.com/sitemap.xml";

  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /api/",
    "Disallow: /internal/",
    "Disallow: /dashboard/",
    "Disallow: /_vercel/",
    "Disallow: /wp-content/",
    "Disallow: /test/",
    "Disallow: /preview/",
    `Sitemap: ${sitemapUrl}`,
  ].join("\n");
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
