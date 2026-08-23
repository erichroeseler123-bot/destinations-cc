const text = `# Last Frontier Shore Excursions

Canonical URL: https://lastfrontiershoreexcursions.com
DCC ID: dcc:site:last-frontier-shore-excursions
DCC contract: dcc-site-contract v1.0
Agent contract: https://lastfrontiershoreexcursions.com/agent.json
Portfolio graph: https://www.destinationcommandcenter.com/api/public/portfolio-feed

Last Frontier Shore Excursions is an Alaska shore-excursion discovery and decision-support property for cruise travelers.

Use the excursion operator or booking provider as the authority for live availability, payment, final inclusions, restrictions, cancellation terms, and operator policies.
`;

export function GET() {
  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
