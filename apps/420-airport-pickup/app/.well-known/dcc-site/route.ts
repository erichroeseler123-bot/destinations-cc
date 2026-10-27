import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MANIFEST = {
  schemaVersion: "dcc.site-manifest.v1",
  siteId: "420-friendly-airport-pickup",
  displayName: "420 Friendly Airport Pickup",
  canonicalDomain: "420friendlyairportpickup.com",
  canonicalDomains: [
    "420friendlyairportpickup.com",
    "www.420friendlyairportpickup.com",
  ],
  consumerRole: "denver_airport_transfer_specialist",
  dccUniverseIds: ["denver-airport-dispensary-pickup"],
  acceptedContextFields: [
    "context_id",
    "destination",
    "date",
    "travelers",
    "flightBufferMinutes",
  ],
  emittedContextFields: [
    "context_id",
    "destination",
    "date",
    "travelers",
  ],
  bookingAuthority: ["direct_provider", "inquiry_only"],
  inboundRelationships: [
    "destinationcommandcenter.com",
    "brinkberry.com",
    "partyatredrocks.com",
  ],
  outboundRelationships: [
    "partyatredrocks.com",
    "destinationcommandcenter.com",
  ],
  commercialChannels: ["direct_operator_referral"],
  contextSupport: "private_trip_context_only",
  tripContextExchange: {
    tokenPrefix: "dcc_ctx_",
    transport: "server_side_expiring_revocable_token",
    firstPartyCookieName: "ap420_trip_ctx",
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
