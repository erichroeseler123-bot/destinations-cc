import { buildDccSitemapIndexXml } from "@/lib/dcc/sitemapArchitecture";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(buildDccSitemapIndexXml(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
