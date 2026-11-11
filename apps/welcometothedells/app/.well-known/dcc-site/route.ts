import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MANIFEST = {
  schema: "dcc.site-manifest.v1",
  schemaVersion: "dcc.site-manifest.v1",
  version: "1.0.0",
  site_id: "welcometothedells",
  siteId: "welcome-to-the-dells",
  site_name: "Welcome to the Dells",
  displayName: "Welcome to the Dells",
  canonicalDomain: "welcometothedells.com",
  canonical_domains: ["welcometothedells.com", "www.welcometothedells.com"],
  consumer_role:
    "Wisconsin Dells and Lake Delton trip-planning, river-ops comparison, and group logistics guide",
  dcc_universe_ids: [
    "univ:wisconsin-dells-river-ops:0.3.0",
    "univ:vacation-rental-catering-spreads:0.3.0",
  ],
  booking_authority: {
    primary: "direct_provider",
    supported_authorities: ["direct_provider", "viator_affiliate", "inquiry_only"],
    takes_direct_payment: false,
    autonomous_booking_enabled: false,
    decision_authorization_mode: "shadow_only_no_side_effects",
    universal_multi_provider_checkout: false,
    finality_statement:
      "Welcome to the Dells compares river tours, Ducks, and hub logistics; tickets, catering bookings, and payments are finalized on the operating company or disclosed marketplace surface.",
  },
  context_support: {
    mode: "private_trip_context",
    supports_private_trip_context: true,
    supports_public_shared_plans: false,
    cookie_name: "wtd_trip_ctx",
    cookie_flags: "Secure; HttpOnly; SameSite=Lax",
    strips_token_from_url: true,
    url_pii_forbidden: true,
  },
  privacy_and_security: {
    exposes_secrets: false,
    exposes_customer_information: false,
    exposes_private_evidence: false,
    exposes_commission_terms: false,
  },
} as const;

export async function GET() {
  return NextResponse.json(MANIFEST, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      "X-DCC-Manifest-Schema": MANIFEST.schema,
      "X-DCC-Site-Id": MANIFEST.site_id,
    },
  });
}
