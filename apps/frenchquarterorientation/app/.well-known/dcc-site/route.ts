import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MANIFEST = {
  schema: "dcc.site-manifest.v1",
  schemaVersion: "dcc.site-manifest.v1",
  version: "1.0.0",
  site_id: "frenchquarterorientation",
  siteId: "french-quarter-orientation",
  site_name: "French Quarter Orientation",
  displayName: "French Quarter Orientation",
  canonicalDomain: "frenchquarterorientation.com",
  canonical_domains: [
    "frenchquarterorientation.com",
    "www.frenchquarterorientation.com",
  ],
  consumer_role:
    "First-hour New Orleans French Quarter spatial orientation and neighborhood routing resource",
  dcc_universe_ids: ["univ:new-orleans-city-tours:0.3.0"],
  booking_authority: {
    primary: "inquiry_only",
    supported_authorities: ["inquiry_only", "fareharbor", "direct_provider"],
    takes_direct_payment: false,
    autonomous_booking_enabled: false,
    decision_authorization_mode: "shadow_only_no_side_effects",
    universal_multi_provider_checkout: false,
    finality_statement:
      "French Quarter Orientation is a non-transactional 30-minute spatial orientation resource; tour comparisons route to Welcome to New Orleans Tours and bookings finalize with the operating provider.",
  },
  context_support: {
    mode: "public_shared_plans",
    supports_private_trip_context: false,
    supports_public_shared_plans: true,
    cookie_name: "fqo_trip_ctx",
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
