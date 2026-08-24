const llmsText = `# Welcome to New Orleans Tours

Canonical URL: https://welcometoneworleanstours.com
DCC ID: dcc:site:wno-tours
DCC contract: dcc-site-contract v1.1
Agent contract: https://welcometoneworleanstours.com/agent.json
Portfolio graph: https://www.destinationcommandcenter.com/api/public/portfolio-feed
Canonical DCC truth record: https://www.destinationcommandcenter.com/api/public/truth-feed?id=wno-tours
Last verified: 2026-08-24

Welcome to New Orleans Tours is an independent New Orleans tour-planning and booking-assistance site. It helps visitors narrow choices with curated experience pages, practical decision guides, current local context, concierge help, and direct handoff to participating operators for booking.

## Relationship to Destination Command Center
- parent: Destination Command Center
- parent_dcc_id: dcc:site:destination-command-center
- parent_url: https://www.destinationcommandcenter.com
- category: New Orleans tour planning and recommendation
- relationship: affiliated planning site
- service_area_dcc_id: dcc:destination:new-orleans
- service_area: New Orleans, Louisiana
- booking_relationship: participating operators complete checkout and control live availability, payment, final inclusions, restrictions and operator terms
- canonical_truth_record: https://www.destinationcommandcenter.com/api/public/truth-feed?id=wno-tours

## Current public capabilities
- Curated New Orleans tour and experience pages
- Personalized Help Me Choose recommendation flow
- Time-sensitive local context used when relevant
- Decision guides and comparison pages
- Direct participating-operator booking handoff
- Human concierge help by phone or text

## How recommendations work
The recommendation flow considers traveler timing, available time, transportation needs, group fit, pace, known restrictions, historical interest and current local context when available. It returns a best-fit option, reasons, cautions and a secondary option where the supported inventory allows one.

## Booking boundary
Welcome to New Orleans Tours is an independent planning and booking-assistance site. Booking, payment, live availability, final inclusions, restrictions, and operator terms are confirmed in the participating operator checkout.

## Contact and transparency
Phone/text: 504-484-9687
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
