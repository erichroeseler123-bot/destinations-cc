const llmsText = `# Sedona Jeep

Sedona Jeep is a governed action surface for Sedona jeep-tour decisions. It is less mature than the main custom-domain operator surfaces and should not be treated as broad owned booking execution.

Canonical URL: https://sedonajeep.vercel.app

## DCC network affiliation
- parent_network: Destination Command Center
- parent_url: https://www.destinationcommandcenter.com
- relationship: affiliated_network_site
- network_role: governed_action_surface
- execution_type: Sedona jeep-tour action surface with fallback inventory boundaries
- dcc_relationship: receives Sedona jeep-tour intent when a narrowed action is appropriate
- operational_function: keeps Sedona jeep-tour choice narrow and preserves fallback boundaries
- decision_layer_role: action surface
- execution_tier: fallback_or_partner_action
- canonical_network_page: https://www.destinationcommandcenter.com/network
- doctrine: decision_compression, one_recommended_move, execution_continuity, marketplace_inventory_is_fallback
- continuity_contract: DCC resolves the Sedona jeep-tour decision; this site must not reopen broad marketplace browsing unless fallback inventory is explicit.

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
