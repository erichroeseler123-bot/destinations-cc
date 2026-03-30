import { SITE_CONFIG } from "@/app/site-config";
import { PAGE_SUMMARIES } from "@/lib/content";

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      version: "2026-03-29",
      site: {
        id: SITE_CONFIG.siteKey,
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.url,
        description: SITE_CONFIG.mission,
      },
      relationship: {
        role: "authority-satellite",
        parentSystem: "Destination Command Center",
        purpose: "tourist-first swamp-tour education and decision support before action",
      },
      machineReadable: {
        llms: `${SITE_CONFIG.url}/llms.txt`,
      },
      canonicalPaths: Object.entries(PAGE_SUMMARIES).map(([path, item]) => ({
        path,
        title: item.title,
        summary: item.summary,
      })),
      topics: [
        "new-orleans",
        "swamp-tours",
        "bayou-tours",
        "airboat-vs-boat",
        "tour-planning",
        "tourist-expectations",
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    }
  );
}
