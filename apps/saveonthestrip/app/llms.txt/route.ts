export const dynamic = "force-static";

export function GET() {
  const body = [
    "# Save On The Strip",
    "",
    "> Vegas-first trip planning across shows, tours, deals, free things, hotel updates, and practical Strip planning.",
    "",
    "## Canonical public sections",
    "- https://saveonthestrip.com/",
    "- https://saveonthestrip.com/shows",
    "- https://saveonthestrip.com/tours",
    "- https://saveonthestrip.com/deals",
    "- https://saveonthestrip.com/hotels",
    "- https://saveonthestrip.com/free-things",
    "- https://saveonthestrip.com/timeshares",
    "",
    "## Machine-readable entry points",
    "- https://saveonthestrip.com/agent.json",
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
