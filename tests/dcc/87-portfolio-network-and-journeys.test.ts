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

    // 6a. Feastly Spread active market (Wisconsin Dells & Door County)
    assert.equal(
      FEASTLY_SPREAD_MARKETS.filter((m) => m.status === "active_market").length,
      2,
    );
    assert.equal(
      FEASTLY_SPREAD_MARKETS.filter((m) => m.status === "coverage_request_market").length,
      16,
    );

    const j6Active = await executePortfolioCrossSiteJourney({
      journeyId: "property_manager_to_feastly_spread",
      feastlyMarketSlug: "wisconsin-dells",
      partySize: 10,
    });
    assert.equal(j6Active.feastlyMarketResolution?.status, "active_market");
    assert.equal(j6Active.feastlyMarketResolution?.acceptsLivePackageOrders, true);
    assert.equal(j6Active.checkoutBoundary.controllingBookingAuthority, "request_only");
    assert.equal(j6Active.handoff.productCode, "FEASTLY_ACTIVE_WISCONSIN_DELLS");

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

  it("keeps unknown provider outcomes explicitly unknown until a verified provider outcome is reported", async () => {
    const handoff = await createCommercialHandoff({
      originatingSite: "cruisepromenade.com",
      targetSite: "getyourguide.com",
      provider: "getyourguide",
      productCode: "GYG_JUNEAU_WHALE",
      productDestinationUrl:
        "https://www.getyourguide.com/juneau-l1234/whale-t5678/",
      intendedDate: "2026-07-10",
      partySize: 2,
    });

    const loadedBefore = await getCommercialHandoffById(handoff.handoffId);
    assert.deepEqual(loadedBefore?.outcomeState, {
      status: "click_recorded_outcome_unknown",
      bookingOutcome: "unknown",
      revenueReconciliation: "unknown",
      commissionReconciliation: "unknown",
      clickIsBooking: false,
      reportingFeedAvailable: false,
      lastOutcomeId: null,
      lastUpdatedAt: null,
    });

    const outcome = await recordCommercialOutcome({
      reporterClientId: "gyg_test_reporter",
      reporterProvenance: "getyourguide_partner_adapter",
      provider: "getyourguide",
      providerBookingRef: "GYG-BOOK-9911",
      eventType: "BOOKING_CONFIRMED",
      providerEventTime: "2026-07-10T15:00:00Z",
      handoffId: handoff.handoffId,
      bookedProductCode: "GYG_JUNEAU_WHALE",
      bookedDate: "2026-07-10",
      bookedPartySize: 2,
      bookingValueAmount: 320,
      bookingValueCurrency: "USD",
      estimatedCommissionAmount: 25.6,
      estimatedCommissionCurrency: "USD",
    });

    const loadedAfter = await getCommercialHandoffById(handoff.handoffId);
    assert.deepEqual(loadedAfter?.outcomeState, {
      status: "outcome_reported",
      bookingOutcome: "confirmed",
      revenueReconciliation: "reported",
      commissionReconciliation: "estimated",
      clickIsBooking: false,
      reportingFeedAvailable: false,
      lastOutcomeId: outcome.outcomeId,
      lastUpdatedAt: outcome.dccRecordedAt,
    });
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
