import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MANIFEST = {
  schema: "dcc.site-manifest.v1",
  schemaVersion: "dcc.site-manifest.v1",
  version: "1.0.0",
  site_id: "saveonthestrip",
  siteId: "save-on-the-strip",
  site_name: "Save On The Strip",
  displayName: "Save On The Strip",
  canonicalDomain: "saveonthestrip.com",
  canonical_domains: ["saveonthestrip.com", "www.saveonthestrip.com"],
  consumer_role:
    "Las Vegas Strip value routing, show & tour deal comparison, and canyon day-trip guide",
  dcc_universe_ids: ["univ:las-vegas-strip-value-routing:0.3.0"],
  booking_authority: {
    primary: "viator_affiliate",
    supported_authorities: [
      "viator_affiliate",
      "getyourguide_affiliate",
      "fareharbor",
      "direct_provider",
      "inquiry_only",
    ],
    takes_direct_payment: false,
    autonomous_booking_enabled: false,
    decision_authorization_mode: "shadow_only_no_side_effects",
    universal_multi_provider_checkout: false,
    finality_statement:
      "Save On The Strip compares Las Vegas show, attraction, and canyon tour options; tickets and reservations finalize on the operating venue, carrier, or disclosed ticketing marketplace.",
  },
  context_support: {
    mode: "private_trip_context",
    supports_private_trip_context: true,
    supports_public_shared_plans: false,
    cookie_name: "sots_trip_ctx",
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
