const llmsText = `# Juneau Flight Deck

Juneau Flight Deck is a satellite decision surface for urgent Juneau helicopter, glacier, whale-watching, weather-backup, and cruise-timing decisions.

Canonical URL: https://juneauflightdeck.com

## DCC network affiliation
- parent_network: Destination Command Center
- parent_url: https://www.destinationcommandcenter.com
- relationship: affiliated_network_site
- network_role: satellite_decision_surface
- execution_type: Juneau decision compression before operator or fallback handoff
- dcc_relationship: receives Juneau and Alaska excursion intent when users need same-day or cruise-safe narrowing
- operational_function: compresses Juneau helicopter, glacier, whale-watching, and weather-backup choices into the next correct action
- decision_layer_role: satellite decision surface
- execution_tier: decision_surface
- canonical_network_page: https://www.destinationcommandcenter.com/network
- doctrine: decision_compression, one_recommended_move, execution_continuity, marketplace_inventory_is_fallback
- continuity_contract: DCC resolves or frames the Juneau corridor; this site preserves decision context before operator or fallback execution.

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
