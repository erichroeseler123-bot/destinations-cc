export const dynamic = "force-dynamic";

export function GET() {
  const content = `# Somerset Amphitheater Shuttle

> Private group concert transportation between the Minneapolis-St. Paul Twin Cities metro and Somerset Amphitheater (Somerset, WI).

## Service Overview
- Model: 100% private prearranged group charters (no shared per-seat shuttles, no public transit).
- Coverage: Door-to-door anywhere in the Twin Cities metro (Minneapolis, St. Paul, Stillwater, Hudson WI, Woodbury, East Metro).
- Post-Concert Departure: Drivers remain parked on-site through the final encore, ensuring guaranteed immediate departure with zero midnight rideshare stranding.

## Fleet & Pricing
- Private High-Roof Passenger Van: ~$500 flat round-trip (up to 14 guests, ~$35-$45/guest when split). High stand-up ceiling, AC, cooler and gear storage.
- Private Luxury SUV: $375-$425 flat round-trip (up to 6 guests). Leather seating, private executive ride.
- Pricing Policy: Transparent flat rates with no surge pricing or post-concert exit gouging.

## Boundaries & Non-Coverage
- River Tubing: Apple River tubing shuttles are provided exclusively on-site by campgrounds and outfitters (e.g., River's Edge, Float Rite Park). We do NOT operate river tubing shuttles.
- Shared Shuttles: We do NOT operate public per-seat or scheduled fixed-line shuttles. All rides are private group reservations.

## Booking & Inquiries
- Phone / Text: (720) 369-6292
- Web Quote Flow: https://www.shuttletosomersetamphitheater.com/#quote
- Machine Contract: https://www.shuttletosomersetamphitheater.com/agent.json
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
