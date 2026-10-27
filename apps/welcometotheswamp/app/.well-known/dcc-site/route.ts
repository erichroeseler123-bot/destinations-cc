import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MANIFEST = {
  schemaVersion: "dcc.site-manifest.v1",
  siteId: "welcome-to-the-swamp",
  displayName: "Welcome to the Swamp",
  canonicalDomain: "welcometotheswamp.com",
  canonicalDomains: ["welcometotheswamp.com", "www.welcometotheswamp.com"],
  consumerRole: "new_orleans_swamp_tour_specialist",
  dccUniverseIds: ["new-orleans-swamp-tours", "new-orleans-city-tours"],
  acceptedContextFields: [
    "context_id",
    "destination",
    "date",
    "travelers",
    "shipSlug",
    "portSlug",
    "mobilityLevel",
    "weatherSensitivity",
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
    "welcometoneworleanstours.com",
    "destinationcommandcenter.com",
  ],
  outboundRelationships: [
    "welcometoneworleanstours.com",
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
    firstPartyCookieName: "wts_trip_ctx",
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
