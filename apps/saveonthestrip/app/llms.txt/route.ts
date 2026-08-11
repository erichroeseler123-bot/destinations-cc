export const dynamic = "force-static";

export function GET() {
  const body = [
    "# Save On The Strip",
    "",
    "> A Las Vegas decision guide focused on what is worth the money, what to do tonight, what to skip, and how to spend less without wasting the trip.",
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
    "## Machine-readable entry points",
    "- https://saveonthestrip.com/agent.json",
    "- https://saveonthestrip.com/sitemap.xml",
    "- https://saveonthestrip.com/api/public/page-feed?path=/",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
