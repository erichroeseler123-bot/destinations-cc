import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MANIFEST = {
  schemaVersion: "dcc.site-manifest.v1",
  siteId: "last-frontier-shore-excursions",
  displayName: "Last Frontier Shore Excursions",
  canonicalDomain: "lastfrontiershoreexcursions.com",
  canonicalDomains: [
    "lastfrontiershoreexcursions.com",
    "www.lastfrontiershoreexcursions.com",
  ],
  consumerRole: "alaska_shore_excursion_specialist",
  dccUniverseIds: ["alaska-shore-excursions", "juneau-helicopter-tours"],
  acceptedContextFields: [
    "context_id",
    "destination",
    "date",
    "travelers",
    "shipSlug",
    "portSlug",
    "portCallWindow",
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
    "portCallWindow",
  ],
  bookingAuthority: [
    "fareharbor",
    "viator_affiliate",
    "getyourguide_affiliate",
    "direct_provider",
  ],
  inboundRelationships: [
    "cruisepromenade.com",
    "juneauflightdeck.com",
    "destinationcommandcenter.com",
  ],
  outboundRelationships: [
    "juneauflightdeck.com",
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
    firstPartyCookieName: "lfse_trip_ctx",
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
