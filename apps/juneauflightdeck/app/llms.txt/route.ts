import { ALASKA_CRUISE_FLEET } from "@/lib/alaskaCruiseFleet";

export const dynamic = "force-static";

export function GET() {
  const shipLinks = ALASKA_CRUISE_FLEET.map(
    (ship) =>
      `- [${ship.shipName} (${ship.cruiseLine}) Helicopter Waitlist](https://juneauflightdeck.com/helicopter-waitlist/${ship.slug}): Juneau port hours (${ship.dockHours}), scheduled berth (${ship.typicalScheduledBerth}), and daily cancellation scanner.`
  ).join("\n");

  const llmsText = `# Juneau Flight Deck

> Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, availability alerts for sold-out tours, and alternatives when weather disrupts plans. Tours are operated by the named local providers.

Juneau Flight Deck is an independent shore excursion booking and coordination service and official Viator partner. We help cruise passengers visiting Juneau and Skagway navigate commercial flight and marine excursions with direct operator booking, transparent operator comparisons, and ship-safe port timing.

## What Juneau Flight Deck Provides
- **Excursion Booking & Comparison:** Compare and book all 3 licensed FAA Part 135 Juneau helicopter operators (TEMSCO Helicopters, Coastal Helicopters, NorthStar Trekking) and local Auke Bay whale watching charters directly or through our official Viator partner checkout.
- **Cruise-Port Timing Guidance:** Conservative 90 to 120-minute safety buffers scheduled around your ship’s specific berth (Franklin Dock, Steamship Wharf, Marine Park, AJ Dock) and gangway hours.
- **Sold-Out Availability Alerts:** When cruise line blocks sell out, our automated sweep engine monitors operator cancellations and returned wholesale allocations daily at 10:00 AM AKDT, sending instant direct booking links. (Openings depend on carrier capacity and cancellation timing; availability is not guaranteed on every sailing date.)
- **Weather Alternatives & Backup Protection:** Southeast Alaska glacier flights operate under FAA Visual Flight Rules (VFR). When mountain weather grounds flights, full refunds are issued directly by the booking provider and operating carrier under their published terms; our team assists by identifying available marine alternatives such as whale watching charters (subject to boat availability and booked separately).

## Core Guides & Excursions
- [Helicopter Tour Comparison](https://juneauflightdeck.com/helicopter): Compare glacier landing vs scenic flight options.
- [TEMSCO vs Coastal vs NorthStar](https://juneauflightdeck.com/temsco-vs-coastal-vs-northstar-juneau): Unbiased comparison of Juneau's 3 FAA Part 135 helicopter operators.
- [Sold Out Helicopter Tours Guide](https://juneauflightdeck.com/juneau-helicopter-tour-sold-out): How cruise blocks drop and how our Availability Watch secures holds.
- [Best Time for Glacier Dog Sledding](https://juneauflightdeck.com/best-time-for-glacier-dog-sledding-juneau): Month-by-month icefield conditions, weather cancellation risks, and camp operating windows.
- [Helicopter Weight Limits & Seating Math](https://juneauflightdeck.com/juneau-helicopter-tour-weight-limits-and-seating): FAA Part 135 regulations, 250lb surcharges, and how dispatchers release 6th seats.
- [Helicopter Availability Watch](https://juneauflightdeck.com/helicopter-waitlist): Join the waitlist for sold-out cruise dates.
- [Mendenhall Glacier Helicopter Tours](https://juneauflightdeck.com/juneau/helicopter): Glacier walkabouts and landing details.
- [Glacier Dog Sledding Tours](https://juneauflightdeck.com/juneau-dogsled-helicopter-tours): Herbert Glacier dog sledding by helicopter.
- [Whale Watching Backup Options](https://juneauflightdeck.com/juneau-whale-watching-tours): Auke Bay whale watching alternatives when flights are grounded.
- [Weather Cancellation Guide](https://juneauflightdeck.com/juneau/what-to-do-if-helicopter-tour-canceled): What to do when mountain weather cancels your flight.
- [Cruise Excursions vs Independent Booking](https://juneauflightdeck.com/juneau/cruise-excursions-vs-independent): Comparison of ship-sponsored vs independent flight bookings.
- [Skagway Helicopter Tours](https://juneauflightdeck.com/skagway/helicopter): Glacier flight options for Skagway port days.

## Alaska Cruise Fleet Port Timing & Waitlist Guides
${shipLinks}

## Support & Information
- [About Juneau Flight Deck](https://juneauflightdeck.com/about): Mission, operator relationships, and official Viator partnership.
- [FAQ](https://juneauflightdeck.com/faq): Frequently asked questions about weather, timing, and refunds.
- [Contact Dispatch](https://juneauflightdeck.com/contact): Inquiries and cruise timing questions.
- [Privacy Policy](https://juneauflightdeck.com/privacy-policy): Privacy and data handling terms.
- [Machine Contract](https://juneauflightdeck.com/agent.json): Agentic machine discovery contract.
- [Extended AI Knowledge Base](https://juneauflightdeck.com/llms-full.txt): Complete uncompressed textual knowledge base.
`;

  return new Response(llmsText, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
