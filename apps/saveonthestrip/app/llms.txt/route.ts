export const dynamic = "force-static";

export function GET() {
  const body = [
    "# Save On The Strip",
    "",
    "> A Las Vegas decision guide focused on what is worth the money, what to do tonight, what to skip, and how to spend less without wasting the trip.",
    "",
    "DCC ID: dcc:site:save-on-the-strip",
    "DCC contract: dcc-site-contract v1.1",
    "Canonical DCC truth record: https://www.destinationcommandcenter.com/api/public/truth-feed?id=save-on-the-strip",
    "Last verified: 2026-08-24",
    "",
    "## Core decision pages",
    "- https://saveonthestrip.com/tonight",
    "- https://saveonthestrip.com/worth-it",
    "- https://saveonthestrip.com/under-100",
    "- https://saveonthestrip.com/near-your-hotel",
    "- https://saveonthestrip.com/four-hours-in-vegas",
    "- https://saveonthestrip.com/before-a-late-flight",
    "- https://saveonthestrip.com/what-to-skip-in-las-vegas",
    "- https://saveonthestrip.com/compare/sphere-vs-vegas-show",
    "- https://saveonthestrip.com/compare/grand-canyon-vs-hoover-dam",
    "",
    "## Commercial sections",
    "- https://saveonthestrip.com/shows",
    "- https://saveonthestrip.com/tours",
    "- https://saveonthestrip.com/deals",
    "- https://saveonthestrip.com/hotels",
    "- https://saveonthestrip.com/free-things",
    "",
    "## Authority boundary",
    "- Use current provider or booking pages as the authority for live prices, availability, inventory and final terms.",
    "- Use the DCC truth record for bounded portfolio identity and status claims.",
    "",
    "## Machine-readable entry points",
    "- https://saveonthestrip.com/agent.json",
    "- https://saveonthestrip.com/llms.txt",
    "- https://saveonthestrip.com/sitemap.xml",
    "- https://saveonthestrip.com/api/public/page-feed?path=/",
    "- https://www.destinationcommandcenter.com/api/public/truth-feed?id=save-on-the-strip",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
