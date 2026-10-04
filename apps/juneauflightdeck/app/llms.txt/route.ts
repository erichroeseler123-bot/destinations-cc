const llmsText = `# Juneau Flight Deck

> Juneau & Skagway helicopter glacier tour booking, sold-out availability watch, and weather backup coordination. Official Viator Partner.

Juneau Flight Deck is an independent shore excursion coordination service and official Viator partner. We combine online booking through the world’s leading travel platform with local, boots-on-the-ground ground coordination for cruise passengers visiting Juneau and Skagway, Alaska.

## Core Services & Operational Capabilities
- **Direct Operator Booking:** Compare and book all 3 licensed FAA Part 135 Juneau helicopter operators (TEMSCO Helicopters, Coastal Helicopters, NorthStar Trekking) with ship-safe return timing buffers.
- **Official Viator Partnership:** All tours are booked with official Viator (Tripadvisor) checkout protection, transparent pricing, verified traveler reviews, and 100% weather cancellation refunds.
- **Availability Watch & Waitlist:** For sold-out port dates, our automated monitors scan operator inventory around the clock. When seats drop from cruise block releases or cancellations, we temporarily secure matching seats within penalty-free cancellation windows and call travelers directly with right of first refusal.
- **Beyond Raw Inventory (Dispatch Access):** Because we live here year-round and work directly with flight dispatchers, we can check custom weight-and-balance configurations—such as asking dispatch if a sixth seat can be unlocked on an AStar helicopter for a lighter family group.
- **Weather Realities & Contingencies:** Southeast Alaska glacier flights experience a 30%–40% seasonal cancellation rate due to mountain pass cloud ceilings. When flights are grounded, we immediately help travelers pivot to available Auke Bay whale watching charters so their port day is preserved.

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

## Support & Information
- [About Juneau Flight Deck](https://juneauflightdeck.com/about): Mission, operator relationships, and official Viator partnership.
- [FAQ](https://juneauflightdeck.com/faq): Frequently asked questions about weather, timing, and refunds.
- [Contact Dispatch](https://juneauflightdeck.com/contact): Inquiries and cruise timing questions.
- [Privacy Policy](https://juneauflightdeck.com/privacy-policy): Privacy and data handling terms.
- [Terms of Service](https://juneauflightdeck.com/terms): Service terms and operator booking disclosures.
- [Canonical DCC Truth Record](https://www.destinationcommandcenter.com/api/public/truth-feed?id=juneau-flight-deck): Canonical portfolio truth record and verification status.
- [Machine Contract](https://juneauflightdeck.com/agent.json): Agentic machine discovery contract.
`;

export function GET() {
  return new Response(llmsText, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
