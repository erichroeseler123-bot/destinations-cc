const llmsText = `# 420 Friendly Airport Pickup

420 Friendly Airport Pickup is an owned execution and transportation-discovery surface for private Colorado airport arrivals from Denver International Airport (DEN) and Colorado Springs Airport (COS).

Canonical URL: https://420friendlyairportpickup.com

## Public transportation scope
- Denver International Airport (DEN) private pickup
- Colorado Springs Airport (COS) private pickup
- Denver metro arrival transportation
- Colorado Springs-area arrival transportation by GoSno quote
- Optional lawful dispensary-stop context for adults 21+ when practical
- DEN transfer discovery for Colorado Springs, Breckenridge, Vail, Beaver Creek, Winter Park, Copper Mountain, Steamboat Springs, Aspen, and Snowmass
- COS transfer discovery for Colorado Springs, Breckenridge, Vail, Beaver Creek, Keystone, Copper Mountain, Winter Park, Aspen, Snowmass, and Steamboat Springs
- Configured COS mountain corridors hand off to existing GoSno route pages
- DEN-to-Colorado-Springs and local COS-to-Colorado-Springs requests hand off to GoSno's prefilled quote flow

## Important operating boundary
- The transportation provider does not sell cannabis.
- Passengers make any retail purchase independently from the retailer.
- Cannabis consumption is not permitted in the vehicle.
- Route, road, weather, timing, retailer availability, and applicable law can affect whether an optional stop is practical.
- The live GoSno booking or quote flow controls actual availability, vehicle options, price, and booking terms.

## Machine-readable surfaces
- agent: https://420friendlyairportpickup.com/agent.json
- sitemap: https://420friendlyairportpickup.com/sitemap.xml
- robots: https://420friendlyairportpickup.com/robots.txt
- DEN routes: https://420friendlyairportpickup.com/colorado
- COS routes: https://420friendlyairportpickup.com/colorado-springs-airport

## DCC network affiliation
- parent_network: Destination Command Center
- parent_url: https://www.destinationcommandcenter.com
- relationship: affiliated_network_site
- network_role: owned_execution_operator
- execution_type: airport pickup / private transportation
- related_operator: GoSno
- related_operator_url: https://gosno.co
- dcc_relationship: receives resolved direct airport pickup intent
- operational_function: carries DEN and COS airport pickup demand into direct transportation execution or the matching GoSno route/quote flow
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
