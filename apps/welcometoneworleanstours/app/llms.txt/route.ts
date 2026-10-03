const llmsText = `# Welcome to New Orleans Tours

> Independent New Orleans tour-planning and booking-assistance site providing curated experience pages, practical decision guides, local context, and direct participating-operator checkout handoffs.

Canonical URL: https://www.welcometoneworleanstours.com
DCC ID: dcc:site:wno-tours
DCC contract: dcc-site-contract v1.1
Agent contract: https://www.welcometoneworleanstours.com/agent.json
Portfolio graph: https://destinationcommandcenter.com/api/public/portfolio-feed
Canonical DCC truth record: https://destinationcommandcenter.com/api/public/truth-feed?id=wno-tours
Last verified: 2026-10-03

Welcome to New Orleans Tours is an independent New Orleans tour-planning and booking-assistance site. It helps visitors narrow choices with curated experience pages, practical decision guides, current local context, personal planning help, and direct handoff to participating operators for booking.

## Relationship to Destination Command Center

- parent: Destination Command Center
- parent_dcc_id: dcc:site:destination-command-center
- parent_url: https://destinationcommandcenter.com
- category: New Orleans tour planning and recommendation
- relationship: affiliated planning site
- service_area_dcc_id: dcc:destination:new-orleans
- service_area: New Orleans, Louisiana
- booking_relationship: participating operators complete checkout and control live availability, payment, final inclusions, restrictions and operator terms
- canonical_truth_record: https://destinationcommandcenter.com/api/public/truth-feed?id=wno-tours

## Machine-Readable Discovery & Core Surfaces

- [DCC Agent Manifest](https://www.welcometoneworleanstours.com/agent.json): Machine-readable agent contract and truth manifest
- [Help Me Choose](https://www.welcometoneworleanstours.com/help-me-choose): Interactive recommendation flow matching travelers by interest, timing, and group
- [Things to Do Today](https://www.welcometoneworleanstours.com/guides/things-to-do-in-new-orleans-today): Time-sensitive daytime tour guides and local availability
- [Tonight in New Orleans](https://www.welcometoneworleanstours.com/guides/tonight): Evening, ghost, and music tour decision guide
- [Compare Tours](https://www.welcometoneworleanstours.com/compare): Side-by-side tour comparison matrix for swamp, cemetery, and culinary tours
- [Plan by Need](https://www.welcometoneworleanstours.com/guides/plan-new-orleans-tours): Practical decision guides for families, mobility, and group travel
- [French Quarter Welcome Stop](https://www.welcometoneworleanstours.com/french-quarter-welcome-stop): In-person tour concierge and planning assistance
- [Sitemap](https://www.welcometoneworleanstours.com/sitemap.xml): XML sitemap for route and content discovery
- [Canonical Truth Feed](https://destinationcommandcenter.com/api/public/truth-feed?id=wno-tours): Authoritative DCC truth record
- [Regional Portfolio Feed](https://destinationcommandcenter.com/api/public/portfolio-feed): Regional destination network portfolio feed

## Current Public Capabilities

- Curated New Orleans tour and experience pages
- Personalized Help Me Choose recommendation flow
- Time-sensitive local context used when relevant
- Decision guides and comparison pages
- Direct participating-operator booking handoff
- Personal planning help by phone or text (504-484-9687)

## How Recommendations Work

The recommendation flow considers traveler timing, available time, transportation needs, group fit, pace, known restrictions, historical interest, and current local context when available. It returns a best-fit option, reasons, cautions, and a secondary option where supported inventory allows one.

## Booking Boundary

Welcome to New Orleans Tours is an independent planning and booking-assistance site. Booking, payment, live availability, final inclusions, restrictions, and operator terms are confirmed in the participating operator checkout.

## Contact and Transparency

- Phone/text: [504-484-9687](tel:+15044849687)
- Dispatch & assistance: 504-484-9687
The site may receive affiliate compensation when a traveler completes a booking through participating links. Recommendations are intended to narrow choices; compensation does not change the operator's controlling booking terms.
`;

export function GET() {
  return new Response(llmsText, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
