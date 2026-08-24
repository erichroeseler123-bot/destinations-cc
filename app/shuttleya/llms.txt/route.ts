const text = `# ShuttleYa

Canonical URL: https://shuttleya.com
DCC ID: dcc:site:shuttleya
DCC contract: dcc-site-contract v1.0

ShuttleYa is a transportation discovery and operator-routing property. It does not operate vehicles, publish a house shuttle schedule, set live operator prices, or take transportation payment.

## Transportation categories
- Airport transfers: https://shuttleya.com/airport-shuttles
- Ski and mountain transportation: https://shuttleya.com/ski-shuttles
- Concert transportation: https://shuttleya.com/concert-transportation
- Cruise-port transportation: https://shuttleya.com/cruise-port-transportation

## Current operator handoffs
- GoSno: https://gosno.co
- BigSky GoSno: https://bigsky.gosno.co
- Party at Red Rocks: https://partyatredrocks.com
- Red Rocks DD: https://redrocksdd.com
- Vibe Around Town: https://vibearoundtown.com
- Destination Command Center: https://www.destinationcommandcenter.com

## Legacy service
The former Denver to Mighty Argo scheduled ShuttleYa shuttle is retired and is not operating. ShuttleYa has no direct transportation checkout.

## Booking boundary
The actual transportation provider is the authority for service, live price, availability, vehicles, pickup instructions, payment, restrictions and cancellation terms.

## Machine entry points
- https://shuttleya.com/agent.json
- https://shuttleya.com/llms.txt
- https://shuttleya.com/sitemap.xml
- https://shuttleya.com/robots.txt
- https://www.destinationcommandcenter.com/api/public/portfolio-feed
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
