const llmsText = `# Lake Tahoe

Lake Tahoe is a governed action surface for Tahoe activity decisions. It is less mature than the main custom-domain operator surfaces and should not be treated as broad owned booking execution.

Canonical URL: https://laketahoe.vercel.app

## DCC network affiliation
- parent_network: Destination Command Center
- parent_url: https://www.destinationcommandcenter.com
- relationship: affiliated_network_site
- network_role: governed_action_surface
- execution_type: Tahoe activity action surface with fallback inventory boundaries
- dcc_relationship: receives Tahoe activity intent when a narrowed activity action is appropriate
- operational_function: keeps Tahoe activity choice narrow and preserves fallback boundaries
- decision_layer_role: action surface
- execution_tier: fallback_or_partner_action
- canonical_network_page: https://www.destinationcommandcenter.com/network
- doctrine: decision_compression, one_recommended_move, execution_continuity, marketplace_inventory_is_fallback
- continuity_contract: DCC resolves the Tahoe activity decision; this site must not reopen broad marketplace browsing unless fallback inventory is explicit.

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
