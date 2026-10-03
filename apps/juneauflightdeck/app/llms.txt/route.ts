const llmsText = `# Juneau Flight Deck

> Juneau helicopter tour comparison, cruise schedule coordination, and weather cancellation backup planning.

Juneau Flight Deck is an independent shore excursion coordination resource helping cruise passengers compare Juneau helicopter glacier operators (TEMSCO, Coastal Helicopters, NorthStar Trekking), review ship-safe return buffers, and plan weather backup options.

## Core Guides & Excursions
- [Helicopter Tour Comparison](https://juneauflightdeck.com/helicopter): Compare glacier landing vs scenic flight options.
- [Mendenhall Glacier Helicopter Tours](https://juneauflightdeck.com/juneau/helicopter): Glacier walkabouts and landing details.
- [Glacier Dog Sledding Tours](https://juneauflightdeck.com/juneau-dogsled-helicopter-tours): Herbert Glacier dog sledding by helicopter.
- [Whale Watching Backup Options](https://juneauflightdeck.com/juneau-whale-watching-tours): Auke Bay whale watching alternatives when flights are grounded.
- [Weather Cancellation Guide](https://juneauflightdeck.com/juneau/what-to-do-if-helicopter-tour-canceled): What to do when mountain weather cancels your flight.
- [Cruise Excursions vs Independent Booking](https://juneauflightdeck.com/juneau/cruise-excursions-vs-independent): Comparison of ship-sponsored vs independent flight bookings.
- [Skagway Helicopter Tours](https://juneauflightdeck.com/skagway/helicopter): Glacier flight options for Skagway port days.

## Support & Information
- [About Juneau Flight Deck](https://juneauflightdeck.com/about): Mission and operator independence disclosure.
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
