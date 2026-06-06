const llmsText = `# 420 Friendly Airport Pickup

420 Friendly Airport Pickup is an owned execution operator for direct airport transportation.

Canonical URL: https://420friendlyairportpickup.com

## DCC network affiliation
- parent_network: Destination Command Center
- parent_url: https://www.destinationcommandcenter.com
- relationship: affiliated_network_site
- network_role: owned_execution_operator
- execution_type: airport pickup / direct transportation
- dcc_relationship: receives resolved direct airport pickup intent
- operational_function: executes direct Denver airport pickup and transportation requests
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
