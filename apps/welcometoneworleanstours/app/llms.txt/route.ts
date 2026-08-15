const llmsText = `# Welcome to New Orleans Tours

Welcome to New Orleans Tours is a live New Orleans tour-planning and booking-assistance site. It helps visitors narrow choices with curated experience pages, practical decision guides, current local context, concierge help, and direct handoff to participating operators for booking.

Canonical URL: https://www.welcometoneworleanstours.com

## DCC network affiliation
- parent_network: Destination Command Center
- parent_url: https://www.destinationcommandcenter.com
- relationship: affiliated_network_site
- network_role: live_satellite_decision_surface
- execution_type: New Orleans tour decision compression with explicit participating-operator booking handoff
- dcc_relationship: receives and serves New Orleans visitor intent while preserving clear provider and booking boundaries
- operational_function: narrows New Orleans tour choices, explains fit and logistics, and hands qualified users to participating operator checkout
- decision_layer_role: live satellite decision surface
- execution_tier: decision_and_booking_assistance_surface
- canonical_network_page: https://www.destinationcommandcenter.com/network
- doctrine: decision_compression, clear_recommendation, execution_continuity, explicit_operator_handoff
- continuity_contract: preserve visitor context through recommendation and clearly identify the participating operator before checkout.

## Current public capabilities
- Curated New Orleans tour and experience pages
- Help Me Choose recommendation flow
- Time-sensitive local context and concierge recommendations
- Decision guides and comparison pages
- Direct FareHarbor booking handoff for participating operators
- Human concierge help by phone or text

## Booking boundary
Welcome to New Orleans Tours is an independent planning and booking-assistance site. Booking, payment, live availability, final inclusions, restrictions, and operator terms are confirmed in the participating operator checkout.

## Network constitution
DCC decides. Satellites narrow. Operators execute. Marketplace inventory is fallback.
`;

export function GET() {
  return new Response(llmsText, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
