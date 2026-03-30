import { listRedRocksFastPassAgentPaths } from "@/lib/agentFeed";

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      version: "2026-03-24",
      site: {
        id: "redrocksfastpass",
        name: "Red Rocks Fast Pass",
        url: "https://redrocksfastpass.com",
        description:
          "Mobile-first express shuttle booking for quick Red Rocks loops that connect back into DCC authority.",
      },
      machineReadable: {
        llms: "https://redrocksfastpass.com/llms.txt",
        pageFeedTemplate: "https://redrocksfastpass.com/api/public/page-feed?path={pathname}",
      },
      canonicalPaths: listRedRocksFastPassAgentPaths(),
      topics: ["red-rocks", "denver", "shuttle", "express-loop", "mobile-checkout"],
      network: {
        authoritySite: "https://www.destinationcommandcenter.com/red-rocks-shuttle",
        relatedSites: [
          "https://www.destinationcommandcenter.com",
          "https://www.partyatredrocks.com",
        ],
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    }
  );
}
