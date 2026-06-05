const llmsText = `# Welcome to New Orleans Tours

Welcome to New Orleans Tours is a future broader New Orleans tour authority and satellite decision surface. It should not be treated as a central live execution surface until route and provider boundaries are explicit.

Canonical URL: https://welcometoneworleanstours.com

## DCC network affiliation
- parent_network: Destination Command Center
- parent_url: https://www.destinationcommandcenter.com
- relationship: affiliated_network_site
- network_role: future_satellite_decision_surface
- execution_type: New Orleans tour decision compression before explicit fallback or partner handoff
- dcc_relationship: may receive broader New Orleans tour intent after governed route and provider boundaries are explicit
- operational_function: narrows New Orleans tour choices without becoming generic marketplace browsing
- decision_layer_role: future satellite decision surface
- execution_tier: decision_surface
- canonical_network_page: https://www.destinationcommandcenter.com/network
- doctrine: decision_compression, one_recommended_move, execution_continuity, marketplace_inventory_is_fallback
- continuity_contract: DCC must preserve decision context before this site forwards to explicit partner or fallback inventory.

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
