const llmsText = `# 420 Friendly Airport Pickup

420 Friendly Airport Pickup is an owned execution and transportation-discovery surface for private Denver airport arrivals and Colorado mountain transfers.

Canonical URL: https://420friendlyairportpickup.com

## Public transportation scope
- Denver International Airport (DEN) private pickup
- Denver metro arrival transportation
- Optional lawful dispensary-stop context for adults 21+ when practical
- Colorado mountain transfer discovery for Breckenridge, Vail, Beaver Creek, Winter Park, Copper Mountain, Steamboat Springs, Aspen, and Snowmass
- Mountain-route handoff to GoSno for current availability, vehicle options, final pricing, and booking terms

## Important operating boundary
- The transportation provider does not sell cannabis.
- Passengers make any retail purchase independently from the retailer.
- Cannabis consumption is not permitted in the vehicle.
- Route, road, weather, timing, retailer availability, and applicable law can affect whether an optional stop is practical.

## Machine-readable surfaces
- agent: https://420friendlyairportpickup.com/agent.json
- sitemap: https://420friendlyairportpickup.com/sitemap.xml
- robots: https://420friendlyairportpickup.com/robots.txt
- Colorado routes: https://420friendlyairportpickup.com/colorado

## DCC network affiliation
- parent_network: Destination Command Center
- parent_url: https://www.destinationcommandcenter.com
- relationship: affiliated_network_site
- network_role: owned_execution_operator
- execution_type: airport pickup / private transportation
- related_operator: GoSno
- related_operator_url: https://gosno.co
- dcc_relationship: receives resolved direct airport pickup intent
- operational_function: executes Denver airport pickup requests and routes mountain-transfer demand into the matching GoSno service
- decision_layer_role: execution surface
- execution_tier: owned_execution
- canonical_network_page: https://www.destinationcommandcenter.com/network
- doctrine: decision_compression, one_recommended_move, execution_continuity, marketplace_inventory_is_fallback
- continuity_contract: DCC resolves airport pickup intent; this site carries pickup context into direct transportation execution.

## Network constitution
DCC decides. Satellites narrow. Operators execute. Marketplaces are fallback inventory.
`;

export function GET() {
  return new Response(llmsText, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
