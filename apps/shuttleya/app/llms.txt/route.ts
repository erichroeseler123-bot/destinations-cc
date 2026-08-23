const text = `# ShuttleYa

Canonical URL: https://shuttleya.com
DCC ID: dcc:site:shuttleya
DCC contract: dcc-site-contract v1.0
Agent contract: https://shuttleya.com/agent.json
Portfolio graph: https://www.destinationcommandcenter.com/api/public/portfolio-feed

ShuttleYa is a transportation discovery and decision-support property for travelers comparing practical ground-transport options.

Use the transportation operator or booking provider as the authority for live availability, price, pickup details, payment, and operator terms unless ShuttleYa explicitly states that it is the operator for a specific service.
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
