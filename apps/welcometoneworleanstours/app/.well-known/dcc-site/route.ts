import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MANIFEST = {
  schemaVersion: "dcc.site-manifest.v1",
  siteId: "welcome-to-new-orleans-tours",
  displayName: "Welcome to New Orleans Tours",
  canonicalDomain: "welcometoneworleanstours.com",
  canonicalDomains: [
    "welcometoneworleanstours.com",
    "www.welcometoneworleanstours.com",
  ],
  consumerRole: "new_orleans_city_tour_specialist",
  dccUniverseIds: ["new-orleans-city-tours", "new-orleans-swamp-tours"],
  acceptedContextFields: [
    "context_id",
    "destination",
    "date",
    "travelers",
    "shipSlug",
    "portSlug",
    "mobilityLevel",
    "budgetTier",
  ],
  emittedContextFields: [
    "context_id",
    "destination",
    "date",
    "travelers",
    "shipSlug",
    "portSlug",
  ],
  bookingAuthority: [
    "fareharbor",
    "viator_affiliate",
    "getyourguide_affiliate",
    "direct_provider",
  ],
  inboundRelationships: [
    "cruisepromenade.com",
    "welcometotheswamp.com",
    "destinationcommandcenter.com",
  ],
  outboundRelationships: [
    "welcometotheswamp.com",
    "cruisepromenade.com",
  ],
  commercialChannels: [
    "fareharbor_affiliate",
    "viator_affiliate",
    "getyourguide_click_attribution",
    "direct_operator_referral",
  ],
  contextSupport: "private_trip_context_only",
  tripContextExchange: {
    tokenPrefix: "dcc_ctx_",
    transport: "server_side_expiring_revocable_token",
    firstPartyCookieName: "wtno_trip_ctx",
    cookieFlags: "Secure; HttpOnly; SameSite=Lax",
    urlTokenStrippedOnRedemption: true,
    personalDataForbiddenInUrl: true,
  },
  governance: {
    decisionAuthorizationMode: "shadow_only_no_side_effects",
    autonomousBookingEnabled: false,
    universalMultiProviderCart: false,
    exposesSecretsOrPrivateEvidence: false,
    exposesCommissionTerms: false,
  },
} as const;

export async function GET() {
  return NextResponse.json(MANIFEST, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      "X-DCC-Manifest-Schema": MANIFEST.schemaVersion,
      "X-DCC-Site-Id": MANIFEST.siteId,
    },
  });
}
