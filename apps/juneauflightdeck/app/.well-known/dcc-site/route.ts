import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MANIFEST = {
  schemaVersion: "dcc.site-manifest.v1",
  siteId: "juneau-flight-deck",
  displayName: "Juneau Flight Deck",
  canonicalDomain: "juneauflightdeck.com",
  canonicalDomains: ["juneauflightdeck.com", "www.juneauflightdeck.com"],
  consumerRole: "aviation_qualification_specialist",
  dccUniverseIds: ["juneau-helicopter-tours", "alaska-shore-excursions"],
  acceptedContextFields: [
    "context_id",
    "destination",
    "date",
    "travelers",
    "shipSlug",
    "portCallWindow",
    "flightBufferMinutes",
    "weatherSensitivity",
  ],
  emittedContextFields: [
    "context_id",
    "destination",
    "date",
    "travelers",
    "shipSlug",
    "flightBufferMinutes",
    "weatherSensitivity",
  ],
  bookingAuthority: [
    "viator_affiliate",
    "fareharbor",
    "getyourguide_affiliate",
    "direct_provider",
  ],
  inboundRelationships: [
    "cruisepromenade.com",
    "lastfrontiershoreexcursions.com",
    "destinationcommandcenter.com",
  ],
  outboundRelationships: [
    "lastfrontiershoreexcursions.com",
    "cruisepromenade.com",
  ],
  commercialChannels: [
    "viator_affiliate",
    "fareharbor_affiliate",
    "getyourguide_click_attribution",
    "direct_operator_referral",
  ],
  contextSupport: "private_trip_context_only",
  tripContextExchange: {
    tokenPrefix: "dcc_ctx_",
    transport: "server_side_expiring_revocable_token",
    firstPartyCookieName: "jfd_checkout_session",
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
