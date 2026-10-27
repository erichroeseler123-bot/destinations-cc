import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  DCC_EXCLUDED_PORTFOLIO_SITES,
  DCC_PORTFOLIO_NETWORK_SITES,
  FEASTLY_SPREAD_MARKETS,
  getDccSiteManifestV1,
  isExcludedPortfolioSite,
  isParticipatingPortfolioSite,
  validateUrlFreeOfPersonalData,
} from "@/lib/dcc/portfolioNetworkRegistry";
import {
  createCommercialHandoff,
  getCommercialHandoffById,
  recordCommercialOutcome,
  resetCommercialMemoryStoreForTests,
} from "@/lib/dcc/commerce";
import { executePortfolioCrossSiteJourney } from "@/lib/dcc/commerce/portfolio";
import {
  clearMemoryStore,
  issueContext,
  redeemContext,
  revokeContext,
} from "@/lib/dcc/context/service";
import { GET as getRootWellKnownManifest } from "@/app/.well-known/dcc-site/route";
import { GET as getJfdWellKnownManifest } from "@/apps/juneauflightdeck/app/.well-known/dcc-site/route";
import { GET as getLfseWellKnownManifest } from "@/apps/last-frontier-shore-excursions/app/.well-known/dcc-site/route";
import { GET as getWtnoWellKnownManifest } from "@/apps/welcometoneworleanstours/app/.well-known/dcc-site/route";
import { GET as getWtsWellKnownManifest } from "@/apps/welcometotheswamp/app/.well-known/dcc-site/route";
import { GET as getAp420WellKnownManifest } from "@/apps/420-airport-pickup/app/.well-known/dcc-site/route";
import { proxy as rootProxy } from "@/proxy";

describe("87 — DCC Portfolio Network Registry, .well-known/dcc-site Manifests, Context Exchange & 6 Complete Journeys", () => {
  beforeEach(() => {
    process.env.DCC_DISABLE_NEON_COMMERCE = "1";
    resetCommercialMemoryStoreForTests();
    clearMemoryStore();
  });

  it("registers all 12 participating portfolio sites and explicitly excludes RollCall USA and Welcome to Alaska Tours", () => {
    assert.equal(DCC_PORTFOLIO_NETWORK_SITES.length, 12);
    const expectedDomains = [
      "destinationcommandcenter.com",
      "cruisepromenade.com",
      "lastfrontiershoreexcursions.com",
      "juneauflightdeck.com",
      "welcometoneworleanstours.com",
      "welcometotheswamp.com",
      "vibearoundtown.com",
      "gosno.co",
      "feastlyspread.com",
      "brinkberry.com",
      "partyatredrocks.com",
      "420friendlyairportpickup.com",
    ];

    for (const domain of expectedDomains) {
      assert.equal(isParticipatingPortfolioSite(domain), true);
      assert.equal(isExcludedPortfolioSite(domain), false);
      const manifest = getDccSiteManifestV1(domain);
      assert.ok(manifest);
      assert.equal(manifest.schema, "dcc.site-manifest.v1");
      assert.equal(manifest.version, "1.0.0");
      assert.equal(
        manifest.booking_authority.decision_authorization_mode,
        "shadow_only_no_side_effects",
      );
      assert.equal(manifest.booking_authority.autonomous_booking_enabled, false);
      assert.equal(manifest.booking_authority.universal_multi_provider_checkout, false);
      assert.equal(manifest.privacy_and_security.exposes_secrets, false);
      assert.equal(manifest.privacy_and_security.exposes_customer_information, false);
      assert.equal(manifest.privacy_and_security.exposes_private_evidence, false);
      assert.equal(manifest.privacy_and_security.exposes_commission_terms, false);
    }

    assert.equal(DCC_EXCLUDED_PORTFOLIO_SITES.length, 2);
    for (const excluded of [
      "rollcallusa.com",
      "www.rollcallusa.com",
      "rollcall-usa",
      "welcometoalaskatours.com",
      "www.welcometoalaskatours.com",
      "welcome-to-alaska-tours",
      "wta-ui",
    ]) {
      assert.equal(isExcludedPortfolioSite(excluded), true);
      assert.equal(isParticipatingPortfolioSite(excluded), false);
      assert.equal(getDccSiteManifestV1(excluded), null);
    }
  });

  it("serves versioned /.well-known/dcc-site manifests without secrets or commission terms and returns 404 for excluded sites", async () => {
    const dccRes = await getRootWellKnownManifest(
      new Request("https://www.destinationcommandcenter.com/.well-known/dcc-site"),
    );
    assert.equal(dccRes.status, 200);
    const dccJson = await dccRes.json();
    assert.equal(dccJson.schema, "dcc.site-manifest.v1");
    assert.equal(dccJson.site_id, "destinationcommandcenter");

    const jfdJson = await (await getJfdWellKnownManifest()).json();
    assert.equal(jfdJson.siteId, "juneau-flight-deck");

    const lfseJson = await (await getLfseWellKnownManifest()).json();
    assert.equal(lfseJson.siteId, "last-frontier-shore-excursions");

    const wtnoJson = await (await getWtnoWellKnownManifest()).json();
    assert.equal(wtnoJson.siteId, "welcome-to-new-orleans-tours");

    const wtsJson = await (await getWtsWellKnownManifest()).json();
    assert.equal(wtsJson.siteId, "welcome-to-the-swamp");

    const ap420Json = await (await getAp420WellKnownManifest()).json();
    assert.equal(ap420Json.siteId, "420-friendly-airport-pickup");

    for (const excluded of ["rollcallusa.com", "welcometoalaskatours.com"]) {
      const exRes = await getRootWellKnownManifest(
        new Request(
          `https://www.destinationcommandcenter.com/.well-known/dcc-site?site=${excluded}`,
        ),
      );
      assert.equal(exRes.status, 404);
    }
  });

  it("enforces server-side expiring revocable opaque context exchange and 302 strips token + personal data from URL", async () => {
    const issued = await issueContext({
      sourceSite: "cruisepromenade.com",
      destination: "juneau",
      targetOwner: "lastfrontiershoreexcursions.com",
      schedule: {
        date: "2026-08-01",
        travelers: 4,
        shipOrVenue: "celebrity-edge",
      },
    });
    assert.equal(issued.success, true);

    const req = new NextRequest(
      `https://www.lastfrontiershoreexcursions.com/ports/juneau?ctx=${issued.contextId}&cabin=10244&weight=195&name=Jane+Doe`,
      {
        headers: {
          host: "www.lastfrontiershoreexcursions.com",
        },
      },
    );

    const res = await rootProxy(req, { waitUntil: () => {} } as any);
    assert.equal(res.status, 302);
    const location = res.headers.get("location")!;
    assert.equal(location, "https://www.lastfrontiershoreexcursions.com/ports/juneau");
    assert.equal(location.includes("ctx="), false);
    assert.equal(location.includes("cabin="), false);
    assert.equal(location.includes("weight="), false);
    assert.equal(location.includes("name="), false);

    const setCookie = res.headers.get("set-cookie") || "";
    assert.equal(setCookie.includes(`lfse_trip_ctx=${issued.contextId}`), true);
    assert.equal(setCookie.toLowerCase().includes("httponly"), true);
    assert.equal(setCookie.toLowerCase().includes("secure"), true);

    const revoked = await revokeContext(
      issued.contextId,
      "cruisepromenade.com",
      "traveler_revoked",
    );
    assert.equal(revoked.success, true);
    const redeemAfterRevoke = await redeemContext(
      issued.contextId,
      "lastfrontiershoreexcursions.com",
    );
    assert.equal(redeemAfterRevoke.success, false);
    if (!redeemAfterRevoke.success) {
      assert.equal(redeemAfterRevoke.errorCode, "CONTEXT_REVOKED");
    }
  });

  it("tests all 6 complete cross-site journeys end-to-end", async () => {
    // 1. Alaska cruise plan -> aviation qualification -> affiliate handoff
    const j1 = await executePortfolioCrossSiteJourney({
      journeyId: "alaska_cruise_to_aviation_handoff",
      date: "2026-07-20",
      partySize: 4,
      shipOrVenue: "norwegian-bliss",
    });
    assert.deepEqual(j1.sitesTraversed, [
      "cruisepromenade.com",
      "lastfrontiershoreexcursions.com",
      "juneauflightdeck.com",
    ]);
    assert.equal(j1.contextExchange.urlPrivacyCheck.valid, true);
    assert.equal(
      j1.contextExchange.cleanRedirectUrlAfterRedemption,
      "https://juneauflightdeck.com/calculator",
    );
    assert.equal(j1.assurance?.engineId, "juneau-helicopter-tours");
    assert.equal(j1.handoff.provider, "viator");
    assert.equal(j1.handoff.outboundAffiliateUrl.includes("pid=P00058396"), true);
    assert.equal(j1.handoff.outboundAffiliateUrl.includes(j1.handoff.handoffId), true);
    assert.equal(j1.handoff.outcomeState.status, "click_recorded_outcome_unknown");
    assert.equal(j1.handoff.outcomeState.bookingOutcome, "unknown");
    assert.equal(j1.handoff.outcomeState.clickIsBooking, false);

    // 2. New Orleans city tour -> swamp-tour handoff
    const j2 = await executePortfolioCrossSiteJourney({
      journeyId: "new_orleans_city_to_swamp_handoff",
      date: "2026-10-12",
      partySize: 2,
    });
    assert.deepEqual(j2.sitesTraversed, [
      "cruisepromenade.com",
      "welcometoneworleanstours.com",
      "welcometotheswamp.com",
    ]);
    assert.equal(j2.handoff.provider, "fareharbor");
    assert.equal(j2.handoff.outboundAffiliateUrl.includes("asn=aktourcenter"), true);
    assert.equal(j2.handoff.outboundAffiliateUrl.includes(j2.handoff.handoffId), true);

    // 3. Cruise Promenade -> Vibing Around Tour Co.
    const j3 = await executePortfolioCrossSiteJourney({
      journeyId: "cruise_promenade_to_vibing_around",
      date: "2026-09-05",
      partySize: 3,
    });
    assert.deepEqual(j3.sitesTraversed, [
      "cruisepromenade.com",
      "vibearoundtown.com",
    ]);
    assert.equal(j3.contextExchange.firstPartyCookieName, "vat_trip_ctx");
    assert.equal(j3.handoff.targetSite, "vibearoundtown.com");

    // 4. Brinkberry -> Party at Red Rocks
    const j4 = await executePortfolioCrossSiteJourney({
      journeyId: "brinkberry_to_party_at_red_rocks",
      date: "2026-08-22",
      partySize: 6,
    });
    assert.deepEqual(j4.sitesTraversed, ["brinkberry.com", "partyatredrocks.com"]);
    assert.equal(
      j4.checkoutBoundary.decisionAuthorizationMode,
      "shadow_only_no_side_effects",
    );
    assert.equal(j4.checkoutBoundary.controllingBookingAuthority, "inquiry_only");

    // 5. AI/concierge request -> GoSno review -> existing checkout boundary
    const j5 = await executePortfolioCrossSiteJourney({
      journeyId: "ai_partner_to_gosno_review",
      date: "2026-12-18",
      partySize: 5,
      approvedPartnerId: "synthetic-preview-test-partner",
    });
    assert.deepEqual(j5.sitesTraversed, [
      "destinationcommandcenter.com",
      "gosno.co",
    ]);
    assert.deepEqual(j5.handoff.approvedPartnerAttribution, {
      partnerId: "synthetic-preview-test-partner",
      partnerName: "Synthetic Preview Test Partner (Non-Production)",
      authScope: "referral_attribution_only",
      grantsLoginAccess: false,
      grantsReportingAccess: false,
      grantsPayoutAccess: false,
    });
    assert.equal(j5.checkoutBoundary.requiresExplicitTravelerConfirmation, true);
    assert.equal(j5.checkoutBoundary.autonomousPaymentCapture, false);

    // 6a. Feastly Spread existing booking path market (Wisconsin Dells & Door County)
    assert.equal(
      FEASTLY_SPREAD_MARKETS.filter((m) => m.status === "existing_booking_path").length,
      2,
    );
    assert.equal(
      FEASTLY_SPREAD_MARKETS.filter((m) => m.status === "coverage_request_market").length,
      16,
    );

    const j6ExistingPath = await executePortfolioCrossSiteJourney({
      journeyId: "property_manager_to_feastly_spread",
      feastlyMarketSlug: "wisconsin-dells",
      partySize: 10,
    });
    assert.equal(j6ExistingPath.feastlyMarketResolution?.status, "existing_booking_path");
    assert.equal(j6ExistingPath.feastlyMarketResolution?.hasExistingBookingPath, true);
    assert.equal(j6ExistingPath.checkoutBoundary.controllingBookingAuthority, "request_only");
    assert.equal(
      j6ExistingPath.handoff.productCode,
      "FEASTLY_EXISTING_PATH_WISCONSIN_DELLS",
    );

    // 6b. Feastly Spread coverage-request market (e.g. Gatlinburg)
    const j6Coverage = await executePortfolioCrossSiteJourney({
      journeyId: "property_manager_to_feastly_spread",
      feastlyMarketSlug: "gatlinburg",
      partySize: 12,
    });
    assert.equal(j6Coverage.feastlyMarketResolution?.status, "coverage_request_market");
    assert.equal(j6Coverage.feastlyMarketResolution?.requiresCoverageInquiryOnly, true);
    assert.equal(
      j6Coverage.checkoutBoundary.controllingBookingAuthority,
      "inquiry_only",
    );
    assert.equal(
      j6Coverage.handoff.productCode,
      "FEASTLY_COVERAGE_REQUEST_GATLINBURG",
    );
  });

  it("proves all 9 fail-closed context redemption cases and ensures no context cookie is issued on failed redemption", async () => {
    const baseNow = Date.now();

    // Case 1: Valid issued context -> redeemed, opaque cookie set
    const validIssued = await issueContext({
      sourceSite: "cruisepromenade.com",
      destination: "juneau",
      targetOwner: "lastfrontiershoreexcursions.com",
      schedule: { date: "2026-08-10", travelers: 2 },
    });
    const validProxyRes = await rootProxy(
      new NextRequest(
        `https://www.lastfrontiershoreexcursions.com/ports/juneau?ctx=${validIssued.contextId}`,
        { headers: { host: "www.lastfrontiershoreexcursions.com" } },
      ),
      { waitUntil: () => {} } as any,
    );
    assert.equal(validProxyRes.status, 302);
    assert.equal(validProxyRes.headers.get("x-dcc-ctx-redemption"), "redeemed");
    const validSetCookie = validProxyRes.headers.get("set-cookie") || "";
    assert.equal(validSetCookie.includes(`lfse_trip_ctx=${validIssued.contextId}`), true);

    // Case 2: Invented / unissued context -> 404 CONTEXT_NOT_FOUND, NO cookie issued
    const inventedToken = "dcc_ctx_ffffffffffffffffffffffffffffffff";
    const inventedRes = await redeemContext(inventedToken, "lastfrontiershoreexcursions.com");
    assert.equal(inventedRes.success, false);
    if (!inventedRes.success) {
      assert.equal(inventedRes.statusCode, 404);
      assert.equal(inventedRes.errorCode, "CONTEXT_NOT_FOUND");
    }
    const inventedProxyRes = await rootProxy(
      new NextRequest(
        `https://www.lastfrontiershoreexcursions.com/ports/juneau?ctx=${inventedToken}`,
        { headers: { host: "www.lastfrontiershoreexcursions.com" } },
      ),
      { waitUntil: () => {} } as any,
    );
    assert.equal(inventedProxyRes.status, 302);
    assert.equal(inventedProxyRes.headers.get("x-dcc-ctx-redemption"), "failed");
    assert.equal(inventedProxyRes.headers.get("x-dcc-ctx-error"), "CONTEXT_NOT_FOUND");
    assert.equal(inventedProxyRes.headers.get("set-cookie"), null);

    // Case 3: Wrong target owner -> 403 OWNER_MISMATCH, NO cookie issued
    const wrongOwnerIssued = await issueContext({
      sourceSite: "cruisepromenade.com",
      destination: "juneau",
      targetOwner: "juneauflightdeck.com",
      schedule: { date: "2026-08-11", travelers: 2 },
    });
    const wrongOwnerProxyRes = await rootProxy(
      new NextRequest(
        `https://www.welcometoneworleanstours.com/tours?ctx=${wrongOwnerIssued.contextId}`,
        { headers: { host: "www.welcometoneworleanstours.com" } },
      ),
      { waitUntil: () => {} } as any,
    );
    assert.equal(wrongOwnerProxyRes.status, 302);
    assert.equal(wrongOwnerProxyRes.headers.get("x-dcc-ctx-redemption"), "failed");
    assert.equal(wrongOwnerProxyRes.headers.get("x-dcc-ctx-error"), "OWNER_MISMATCH");
    assert.equal(wrongOwnerProxyRes.headers.get("set-cookie"), null);

    // Case 4: Disabled owner -> 403 OWNER_DISABLED, NO cookie issued
    const disabledOwnerRedeem = await redeemContext(
      wrongOwnerIssued.contextId,
      "disabled-portfolio-owner.example.com",
    );
    assert.equal(disabledOwnerRedeem.success, false);
    if (!disabledOwnerRedeem.success) {
      assert.equal(disabledOwnerRedeem.statusCode, 403);
      assert.equal(disabledOwnerRedeem.errorCode, "OWNER_DISABLED");
    }
    const runtimeDisabledProxyRes = await rootProxy(
      new NextRequest(
        `https://www.juneauflightdeck.com/calculator?ctx=${wrongOwnerIssued.contextId}&disabled_owner=juneauflightdeck`,
        { headers: { host: "www.juneauflightdeck.com" } },
      ),
      { waitUntil: () => {} } as any,
    );
    assert.equal(runtimeDisabledProxyRes.status, 302);
    assert.equal(runtimeDisabledProxyRes.headers.get("x-dcc-ctx-redemption"), "failed");
    assert.equal(runtimeDisabledProxyRes.headers.get("x-dcc-ctx-error"), "OWNER_DISABLED");
    assert.equal(runtimeDisabledProxyRes.headers.get("set-cookie"), null);

    // Case 5: Expired context -> 410 CONTEXT_EXPIRED, NO cookie issued
    const expiredIssued = await issueContext(
      {
        sourceSite: "cruisepromenade.com",
        destination: "juneau",
        targetOwner: "lastfrontiershoreexcursions.com",
        schedule: { date: "2026-08-12", travelers: 2 },
      },
      { now: baseNow - 20 * 60 * 1000 },
    );
    const expiredProxyRes = await rootProxy(
      new NextRequest(
        `https://www.lastfrontiershoreexcursions.com/ports/juneau?ctx=${expiredIssued.contextId}`,
        { headers: { host: "www.lastfrontiershoreexcursions.com" } },
      ),
      { waitUntil: () => {} } as any,
    );
    assert.equal(expiredProxyRes.status, 302);
    assert.equal(expiredProxyRes.headers.get("x-dcc-ctx-redemption"), "failed");
    assert.equal(expiredProxyRes.headers.get("x-dcc-ctx-error"), "CONTEXT_EXPIRED");
    assert.equal(expiredProxyRes.headers.get("set-cookie"), null);

    // Case 6: Revoked context -> 410 CONTEXT_REVOKED, NO cookie issued
    const revokedIssued = await issueContext({
      sourceSite: "cruisepromenade.com",
      destination: "juneau",
      targetOwner: "lastfrontiershoreexcursions.com",
      schedule: { date: "2026-08-13", travelers: 2 },
    });
    await revokeContext(revokedIssued.contextId, "cruisepromenade.com", "test_revoke");
    const revokedProxyRes = await rootProxy(
      new NextRequest(
        `https://www.lastfrontiershoreexcursions.com/ports/juneau?ctx=${revokedIssued.contextId}`,
        { headers: { host: "www.lastfrontiershoreexcursions.com" } },
      ),
      { waitUntil: () => {} } as any,
    );
    assert.equal(revokedProxyRes.status, 302);
    assert.equal(revokedProxyRes.headers.get("x-dcc-ctx-redemption"), "failed");
    assert.equal(revokedProxyRes.headers.get("x-dcc-ctx-error"), "CONTEXT_REVOKED");
    assert.equal(revokedProxyRes.headers.get("set-cookie"), null);

    // Case 7: Alias-to-canonical owner matching
    const aliasIssued = await issueContext({
      sourceSite: "cruise-promenade",
      destination: "new-orleans",
      targetOwner: "welcome-to-the-swamp",
      schedule: { date: "2026-08-14", travelers: 3 },
    });
    const aliasRedeemed = await redeemContext(aliasIssued.contextId, "www.welcometotheswamp.com");
    assert.equal(aliasRedeemed.success, true);
    if (aliasRedeemed.success) {
      assert.equal(aliasRedeemed.data.targetOwner, "welcometotheswamp");
    }

    // Case 8 & 9: Explicit Replay Policy (same_owner_idempotent_within_ttl vs strict_single_use)
    const replaySameOwner = await redeemContext(aliasIssued.contextId, "wts", {
      replayPolicy: "same_owner_idempotent_within_ttl",
    });
    assert.equal(replaySameOwner.success, true);
    if (replaySameOwner.success) {
      assert.equal(replaySameOwner.idempotencyReplay, true);
    }

    const replayStrictSingleUse = await redeemContext(aliasIssued.contextId, "wts", {
      replayPolicy: "strict_single_use",
    });
    assert.equal(replayStrictSingleUse.success, false);
    if (!replayStrictSingleUse.success) {
      assert.equal(replayStrictSingleUse.statusCode, 409);
      assert.equal(replayStrictSingleUse.errorCode, "CONTEXT_ALREADY_REDEEMED");
    }

    const replayStrictProxyRes = await rootProxy(
      new NextRequest(
        `https://www.welcometotheswamp.com/plan?ctx=${aliasIssued.contextId}&replay_policy=strict_single_use`,
        { headers: { host: "www.welcometotheswamp.com" } },
      ),
      { waitUntil: () => {} } as any,
    );
    assert.equal(replayStrictProxyRes.status, 302);
    assert.equal(replayStrictProxyRes.headers.get("x-dcc-ctx-redemption"), "failed");
    assert.equal(replayStrictProxyRes.headers.get("x-dcc-ctx-error"), "CONTEXT_ALREADY_REDEEMED");
    assert.equal(replayStrictProxyRes.headers.get("set-cookie"), null);
  });

  it("enforces commercial outcome transition rules: DCC decision receipts are rejected as provider confirmation and confirmed/cancelled/refunded/fulfilled require authenticated evidence", async () => {
    const handoff = await createCommercialHandoff({
      originatingSite: "cruisepromenade.com",
      targetSite: "getyourguide.com",
      provider: "getyourguide",
      productCode: "GYG_JUNEAU_WHALE",
      productDestinationUrl:
        "https://www.getyourguide.com/juneau-l1234/whale-t5678/",
      intendedDate: "2026-07-10",
      partySize: 2,
      idempotencyKey: "cp_handoff_dedupe_test_1",
    });

    // Duplicate handoff submission with same idempotencyKey returns existing handoffId
    const duplicateHandoff = await createCommercialHandoff({
      originatingSite: "cruisepromenade.com",
      targetSite: "getyourguide.com",
      provider: "getyourguide",
      productCode: "GYG_JUNEAU_WHALE",
      productDestinationUrl:
        "https://www.getyourguide.com/juneau-l1234/whale-t5678/",
      intendedDate: "2026-07-10",
      partySize: 2,
      idempotencyKey: "cp_handoff_dedupe_test_1",
    });
    assert.equal(duplicateHandoff.handoffId, handoff.handoffId);
    assert.equal(duplicateHandoff.duplicateSubmission, true);

    // 1. Submitting a DCC decision receipt as providerBookingRef MUST throw 422 DCC_RECEIPT_IS_NOT_PROVIDER_CONFIRMATION
    await assert.rejects(
      async () => {
        await recordCommercialOutcome({
          reporterClientId: "gyg_test_reporter",
          reporterProvenance: "getyourguide_partner_adapter",
          provider: "getyourguide",
          providerBookingRef: "rcpt:sha256:portfolio_juneau-helicopter-tours",
          eventType: "BOOKING_CONFIRMED",
          providerEventTime: "2026-07-10T15:00:00Z",
          handoffId: handoff.handoffId,
        });
      },
      (err: any) => err.code === "DCC_RECEIPT_IS_NOT_PROVIDER_CONFIRMATION" && err.statusCode === 422,
    );

    // Outcome state on the handoff remains unknown after rejected DCC receipt
    const afterRejectedReceipt = await getCommercialHandoffById(handoff.handoffId);
    assert.equal(afterRejectedReceipt?.outcomeState.bookingOutcome, "unknown");
    assert.equal(afterRejectedReceipt?.outcomeState.status, "click_recorded_outcome_unknown");

    // 2. Unauthenticated / anonymous provenance cannot transition to confirmed, cancelled, refunded, or fulfilled
    await recordCommercialOutcome({
      reporterClientId: "public_traveler_browser",
      reporterProvenance: "unverified_browser_ping",
      provider: "getyourguide",
      providerBookingRef: "UNVERIFIED-123",
      eventType: "BOOKING_CONFIRMED",
      providerEventTime: "2026-07-10T15:01:00Z",
      handoffId: handoff.handoffId,
    });
    const afterUnverified = await getCommercialHandoffById(handoff.handoffId);
    assert.equal(afterUnverified?.outcomeState.bookingOutcome, "unknown");
    assert.equal(afterUnverified?.outcomeState.status, "click_recorded_outcome_unknown");

    // 3. Authenticated provider evidence transitions to confirmed
    const confirmedOutcome = await recordCommercialOutcome({
      reporterClientId: "gyg_test_reporter",
      reporterProvenance: "getyourguide_partner_adapter",
      provider: "getyourguide",
      providerBookingRef: "GYG-BOOK-9911",
      eventType: "BOOKING_CONFIRMED",
      providerEventTime: "2026-07-10T15:05:00Z",
      handoffId: handoff.handoffId,
      bookedProductCode: "GYG_JUNEAU_WHALE",
      bookedDate: "2026-07-10",
      bookedPartySize: 2,
      bookingValueAmount: 320,
      bookingValueCurrency: "USD",
      estimatedCommissionAmount: 25.6,
      estimatedCommissionCurrency: "USD",
    });

    const loadedConfirmed = await getCommercialHandoffById(handoff.handoffId);
    assert.deepEqual(loadedConfirmed?.outcomeState, {
      status: "outcome_reported",
      bookingOutcome: "confirmed",
      revenueReconciliation: "reported",
      commissionReconciliation: "estimated",
      clickIsBooking: false,
      reportingFeedAvailable: false,
      lastOutcomeId: confirmedOutcome.outcomeId,
      lastUpdatedAt: confirmedOutcome.dccRecordedAt,
    });

    // 4. Authenticated operational evidence transitions to fulfilled
    const fulfilledOutcome = await recordCommercialOutcome({
      reporterClientId: "ops_fulfillment_verifier",
      reporterProvenance: "authorized_operational_evidence",
      provider: "getyourguide",
      providerBookingRef: "GYG-BOOK-9911",
      eventType: "BOOKING_FULFILLED",
      providerEventTime: "2026-07-11T01:00:00Z",
      handoffId: handoff.handoffId,
      bookingValueAmount: 320,
      paidCommissionAmount: 25.6,
    });
    const loadedFulfilled = await getCommercialHandoffById(handoff.handoffId);
    assert.equal(loadedFulfilled?.outcomeState.bookingOutcome, "fulfilled");
    assert.equal(loadedFulfilled?.outcomeState.commissionReconciliation, "paid");
    assert.equal(loadedFulfilled?.outcomeState.lastOutcomeId, fulfilledOutcome.outcomeId);

    // 5. Authenticated payment webhook transitions to refunded
    const refundedOutcome = await recordCommercialOutcome({
      reporterClientId: "payment_webhook_verifier",
      reporterProvenance: "authenticated_payment_webhook",
      provider: "getyourguide",
      providerBookingRef: "GYG-BOOK-9911",
      eventType: "BOOKING_REFUNDED",
      providerEventTime: "2026-07-12T01:00:00Z",
      handoffId: handoff.handoffId,
      bookingValueAmount: 0,
    });
    const loadedRefunded = await getCommercialHandoffById(handoff.handoffId);
    assert.equal(loadedRefunded?.outcomeState.bookingOutcome, "refunded");
    assert.equal(loadedRefunded?.outcomeState.lastOutcomeId, refundedOutcome.outcomeId);
  });

  it("enforces authoritative DCC minimum buffers and only permits additive preference buffers", async () => {
    // Juneau authoritative minimum buffer is 90m; client adds 30m preference -> 120m total
    const additiveIssued = await issueContext({
      sourceSite: "cruisepromenade.com",
      destination: "juneau",
      targetOwner: "juneauflightdeck.com",
      schedule: {
        date: "2026-08-20",
        arrival: "08:00",
        departure: "18:00",
        travelers: 2,
      },
      additionalPreferenceBufferMinutes: 30,
    });
    const redeemedAdditive = await redeemContext(
      additiveIssued.contextId,
      "juneauflightdeck.com",
    );
    assert.equal(redeemedAdditive.success, true);
    if (redeemedAdditive.success) {
      assert.equal(redeemedAdditive.data.safetyConstraint.bufferMinutes, 120);
      assert.equal(redeemedAdditive.data.safetyConstraint.latestSafeReturnTime, "16:00");
    }
  });

  it("rejects URLs containing personal data, weights, accessibility notes, or cabin numbers", () => {
    const clean = validateUrlFreeOfPersonalData(
      "https://juneauflightdeck.com/calculator?ctx=dcc_ctx_0123456789abcdef0123456789abcdef",
    );
    assert.equal(clean.valid, true);
    assert.deepEqual(clean.violatingParams, []);

    const dirty = validateUrlFreeOfPersonalData(
      "https://juneauflightdeck.com/calculator?ctx=dcc_ctx_0123456789abcdef0123456789abcdef&cabinNumber=8142&passengerWeight=210&accessibility=wheelchair",
    );
    assert.equal(dirty.valid, false);
    assert.equal(dirty.violatingParams.length >= 3, true);
  });
});
