import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = new Set([
  "destinationcommandcenter.com",
  "www.destinationcommandcenter.com",
  "shuttletosomersetamphitheater.com",
  "www.shuttletosomersetamphitheater.com",
  "welcometoneworleanstours.com",
  "www.welcometoneworleanstours.com",
]);

export async function GET() {
  const hostHeader = (await headers()).get("x-forwarded-host") || (await headers()).get("host") || "";
  // Normalize/remove port if present
  const host = hostHeader.split(":")[0];

  const sitemapUrl = ALLOWED_HOSTS.has(host)
    ? `https://${host}/sitemap.xml`
    : "https://destinationcommandcenter.com/sitemap.xml";

  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /api/",
    "Disallow: /_next/",
    "Disallow: /_vercel/",
    "Disallow: /wp-content/",
    `Sitemap: ${sitemapUrl}`,
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
