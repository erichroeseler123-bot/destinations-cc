import {
  buildDccSectionSitemapXml,
  isDccSitemapSection,
} from "@/lib/dcc/sitemapArchitecture";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ section: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { section } = await context.params;

  if (!isDccSitemapSection(section)) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(buildDccSectionSitemapXml(section), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
