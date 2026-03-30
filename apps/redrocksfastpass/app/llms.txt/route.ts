export const dynamic = "force-static";

export function GET() {
  const body = [
    "# Red Rocks Fast Pass",
    "",
    "> Mobile-first express-loop shuttle booking for travelers who want the shortest Red Rocks visit flow.",
    "",
    "## Canonical public sections",
    "- https://redrocksfastpass.com/",
    "- https://redrocksfastpass.com/checkout",
    "",
    "## Machine-readable entry points",
    "- https://redrocksfastpass.com/agent.json",
    "- https://redrocksfastpass.com/api/public/page-feed?path=/",
    "",
    "## Network authority links",
    "- https://www.destinationcommandcenter.com/red-rocks-shuttle",
    "- https://www.partyatredrocks.com/",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
