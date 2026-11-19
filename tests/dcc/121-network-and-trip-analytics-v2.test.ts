import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { NextRequest } from "next/server";

import {
  ANALYTICS_SITE_REGISTRY,
  resolveCanonicalAnalyticsSite,
} from "@/lib/dcc/analytics/contract";
import {
  bucketizeTravelDateHint,
  deriveAnalyticsTripKey,
  deriveReportingSubjectId,
  sanitizeAnalyticsPath,
  sanitizeAnalyticsProps,
} from "@/lib/dcc/analytics/identityAndPrivacy";
import {
  closeAndResetAnalyticsDbForTests,
  enqueueNormalizedAnalyticsBatch,
  getAnalyticsExecutor,
  getAnalyticsSqliteDb,
  readAnalyticsHealthCounters,
  setAnalyticsRuntimeControls,
  setSimulateAnalyticsStoreOutageForTests,
} from "@/lib/dcc/analytics/store";
import { flushServerlessAfterTasks } from "@/lib/dcc/analytics/serverlessLifecycle";
import { collectAnalyticsRawPayload } from "@/lib/dcc/analytics/collector";
import {
  purgeSyntheticOrExpiredAnalyticsRecords,
  runAnalyticsWorker,
} from "@/lib/dcc/analytics/worker";
import {
  buildNetworkAndTripAnalyticsReport,
  clearReportMemorySnapshotsForTests,
} from "@/lib/dcc/analytics/reporting";
import { POST as collectPost } from "@/app/api/v2/analytics/collect/route";
import { GET as adminReportGet } from "@/app/api/admin/analytics/report/route";
import { GET as goOutGet } from "@/app/go/out/route";
import { buildUnifiedPortfolioFunnelReport } from "@/lib/dcc/commerce/portfolioFunnelReport";
import type { DurableLedgerState } from "@/lib/dcc/storage/durableTransactionalStore";

const TEST_SQLITE_DIR = path.join(os.tmpdir(), "dcc-analytics-suite-121");
const TEST_SQLITE_PATH = path.join(
  TEST_SQLITE_DIR,
  `suite-121-${process.pid}-${Date.now()}.sqlite`,
);

function resetTestSqliteStore() {
  setSimulateAnalyticsStoreOutageForTests(false);
  clearReportMemorySnapshotsForTests();
  closeAndResetAnalyticsDbForTests(true);
  fs.mkdirSync(TEST_SQLITE_DIR, { recursive: true });
  process.env.DCC_ANALYTICS_SQLITE_PATH = TEST_SQLITE_PATH;
  process.env.DCC_ANALYTICS_INTERNAL_SECRET = "test-internal-secret-121";
  process.env.DCC_ANALYTICS_ENV = "production";
  delete process.env.DCC_ANALYTICS_DISABLE_COLLECTION;
  delete process.env.DCC_ANALYTICS_KILL_SWITCH;
}

describe("121 — DCC Network Traffic & Trip-Lifecycle Analytics v2", () => {
  before(() => {
    resetTestSqliteStore();
  });

  after(() => {
    setSimulateAnalyticsStoreOutageForTests(false);
    clearReportMemorySnapshotsForTests();
    closeAndResetAnalyticsDbForTests(true);
    delete process.env.DCC_ANALYTICS_ENV;
  });

  test("121a. Canonical site registry, alias resolution, and site-scoped pseudonymous identity isolation", () => {
    assert.ok(ANALYTICS_SITE_REGISTRY.length >= 17);

    // Priority end-to-end properties + operating MoR + isolated sites
    assert.equal(resolveCanonicalAnalyticsSite("cruisepromenade.com").siteId, "cruisepromenade");
    assert.equal(resolveCanonicalAnalyticsSite("cruise-promenade").siteId, "cruisepromenade");
    assert.equal(
      resolveCanonicalAnalyticsSite("cruisepromenade-git-feat-test.vercel.app").siteId,
      "cruisepromenade",
    );
    assert.equal(
      resolveCanonicalAnalyticsSite("www.lastfrontiershoreexcursions.com").siteId,
      "lastfrontiershoreexcursions",
    );
    assert.equal(
      resolveCanonicalAnalyticsSite("lastfrontier-alaska").siteId,
      "lastfrontiershoreexcursions",
    );
    assert.equal(resolveCanonicalAnalyticsSite("juneau-flight-deck").siteId, "juneauflightdeck");
    assert.equal(resolveCanonicalAnalyticsSite("wno-commerce").siteId, "welcometoneworleanstours");
    assert.equal(resolveCanonicalAnalyticsSite("gosno.co").siteId, "gosno");
    assert.equal(resolveCanonicalAnalyticsSite("partyatredrocks").siteId, "partyatredrocks");

    // Excluded properties remain explicitly registered and isolated from active-12 portfolio
    const rc = resolveCanonicalAnalyticsSite("rollcallusa.com");
    assert.equal(rc.siteId, "rollcallusa");
    assert.equal(rc.entry?.inActive12Portfolio, false);
    assert.equal(rc.entry?.instrumentationTier, "excluded_community");

    const wta = resolveCanonicalAnalyticsSite("welcometoalaskatours.com");
    assert.equal(wta.siteId, "welcometoalaskatours");
    assert.equal(wta.entry?.inActive12Portfolio, false);

    // Site-scoped pseudonymous subject ID: same browser seed across 2 sites produces distinct reportingSubjectIds
    const jfdSub = deriveReportingSubjectId({
      siteId: "juneauflightdeck",
      browserSeed: "bseed_traveler_same_device_001",
    });
    const cpSub = deriveReportingSubjectId({
      siteId: "cruisepromenade",
      browserSeed: "bseed_traveler_same_device_001",
    });
    const cpSubRepeat = deriveReportingSubjectId({
      siteId: "cruisepromenade",
      browserSeed: "bseed_traveler_same_device_001",
    });

    assert.ok(jfdSub.reportingSubjectId?.startsWith("rsub_v1_"));
    assert.ok(cpSub.reportingSubjectId?.startsWith("rsub_v1_"));
    assert.notEqual(jfdSub.reportingSubjectId, cpSub.reportingSubjectId);
    assert.equal(cpSub.reportingSubjectId, cpSubRepeat.reportingSubjectId);

    // Irreversible analyticsTripKey normalizes hex shareCode casing and never grants trip access
    const atkUpper = deriveAnalyticsTripKey({ rawTripIdentifier: "68A1B2C3D4E5F60718293A4B" });
    const atkLower = deriveAnalyticsTripKey({ rawTripIdentifier: "68a1b2c3d4e5f60718293a4b" });
    assert.ok(atkUpper?.startsWith("atk_v1_"));
    assert.equal(atkUpper, atkLower);
    assert.ok(!atkUpper!.includes("68a1b2c3"));
  });

  test("121b. Complete JFD -> LFSE -> CP cross-site journey, 10-stage trip lifecycle, 4-dimension provenance, household headcount, duplicate merge, aged return, and outcome auth gate", async () => {
    resetTestSqliteStore();

    const baseTimeMs = Date.parse("2026-11-15T14:00:00.000Z");
    const isoPlusMin = (mins: number) => new Date(baseTimeMs + mins * 60_000).toISOString();

    const prodBrowserHeaders = (host: string, extra?: Record<string, string>) =>
      new Headers({
        host,
        origin: `https://${host}`,
        "accept-language": "en-US,en;q=0.9",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        ...(extra || {}),
      });

    // 1. JFD UnCruise helicopter guide discovery + cross-site handoff click to LFSE
    const jfdCollect = await collectAnalyticsRawPayload({
      rawBodyText: JSON.stringify({
        deliveryId: "dlv_jfd_1",
        events: [
          {
            logicalEventId: "evt_jfd_pv_1",
            eventType: "page_viewed",
            occurredAt: isoPlusMin(0),
            site: "juneauflightdeck",
            environment: "production",
            browserSeed: "bseed_org_01",
            sessionId: "sess_jfd_01",
            path: "/juneau-helicopter-tours/uncruise",
            landingPath: "/juneau-helicopter-tours/uncruise",
            utmSource: "google",
            utmMedium: "organic",
            contentFamily: "uncruise",
          },
          {
            logicalEventId: "evt_jfd_xclick_lfse",
            eventType: "cross_site_handoff_clicked",
            occurredAt: isoPlusMin(2),
            site: "juneauflightdeck",
            environment: "production",
            browserSeed: "bseed_org_01",
            sessionId: "sess_jfd_01",
            path: "/juneau-helicopter-tours/uncruise",
            targetSite: "lastfrontiershoreexcursions",
            handoffId: "hndf_jfd_lfse_01",
          },
        ],
      }),
      headers: prodBrowserHeaders("juneauflightdeck.com"),
    });
    assert.equal(jfdCollect.queuedCount, 2);

    // 2. LFSE Weekend in Juneau + Fishing Lodges arrival, guide engagement, printable view, and handoff to CP
    const lfseCollect = await collectAnalyticsRawPayload({
      rawBodyText: JSON.stringify({
        deliveryId: "dlv_lfse_1",
        events: [
          {
            logicalEventId: "evt_lfse_pv_1",
            eventType: "page_viewed",
            occurredAt: isoPlusMin(3),
            site: "lastfrontiershoreexcursions",
            environment: "production",
            browserSeed: "bseed_lfse_01",
            sessionId: "sess_lfse_01",
            path: "/guides/weekend-in-juneau",
            referrer: "https://juneauflightdeck.com/juneau-helicopter-tours/uncruise",
            contentFamily: "weekend_in_juneau",
          },
          {
            logicalEventId: "evt_lfse_arr_1",
            eventType: "cross_site_handoff_arrived",
            occurredAt: isoPlusMin(3),
            site: "lastfrontiershoreexcursions",
            environment: "production",
            browserSeed: "bseed_lfse_01",
            sessionId: "sess_lfse_01",
            path: "/guides/weekend-in-juneau",
            referrer: "https://juneauflightdeck.com/juneau-helicopter-tours/uncruise",
            handoffId: "hndf_jfd_lfse_01",
          },
          {
            logicalEventId: "evt_lfse_pv_2",
            eventType: "page_viewed",
            occurredAt: isoPlusMin(6),
            site: "lastfrontiershoreexcursions",
            environment: "production",
            browserSeed: "bseed_lfse_01",
            sessionId: "sess_lfse_01",
            path: "/southeast-alaska/fishing-lodges",
            navigationType: "spa_route_change",
            contentFamily: "fishing_lodges",
          },
          {
            logicalEventId: "evt_lfse_guide_1",
            eventType: "guide_engaged",
            occurredAt: isoPlusMin(7),
            site: "lastfrontiershoreexcursions",
            environment: "production",
            browserSeed: "bseed_lfse_01",
            sessionId: "sess_lfse_01",
            path: "/southeast-alaska/fishing-lodges",
            contentFamily: "fishing_lodges",
          },
          {
            logicalEventId: "evt_lfse_print_1",
            eventType: "printable_view_opened",
            occurredAt: isoPlusMin(8),
            site: "lastfrontiershoreexcursions",
            environment: "production",
            browserSeed: "bseed_lfse_01",
            sessionId: "sess_lfse_01",
            path: "/southeast-alaska/fishing-lodges",
            contentFamily: "fishing_lodges",
          },
          {
            logicalEventId: "evt_lfse_xclick_cp",
            eventType: "cross_site_handoff_clicked",
            occurredAt: isoPlusMin(9),
            site: "lastfrontiershoreexcursions",
            environment: "production",
            browserSeed: "bseed_lfse_01",
            sessionId: "sess_lfse_01",
            path: "/guides/weekend-in-juneau",
            targetSite: "cruisepromenade",
            handoffId: "hndf_lfse_cp_01",
            contextTokenPresent: true,
          },
        ],
      }),
      headers: prodBrowserHeaders("www.lastfrontiershoreexcursions.com"),
    });
    assert.equal(lfseCollect.queuedCount, 6);

    // 3. Cruise Promenade arrival, planning entry, local draft, template/no-op saves, and persisted trip unification
    const rawPrivateShareCode = "68a1b2c3d4e5f60718293a4b";
    const cpClientCollect = await collectAnalyticsRawPayload({
      rawBodyText: JSON.stringify({
        deliveryId: "dlv_cp_client_1",
        events: [
          {
            logicalEventId: "evt_cp_pv_1",
            eventType: "page_viewed",
            occurredAt: isoPlusMin(10),
            site: "cruisepromenade",
            environment: "production",
            browserSeed: "bseed_cp_org_01",
            sessionId: "sess_cp_org_01",
            path: "/planner",
            referrer: "https://www.lastfrontiershoreexcursions.com/guides/weekend-in-juneau",
            contextTokenPresent: true,
          },
          {
            logicalEventId: "evt_cp_arr_1",
            eventType: "cross_site_handoff_arrived",
            occurredAt: isoPlusMin(10),
            site: "cruisepromenade",
            environment: "production",
            browserSeed: "bseed_cp_org_01",
            sessionId: "sess_cp_org_01",
            path: "/planner",
            referrer: "https://www.lastfrontiershoreexcursions.com/guides/weekend-in-juneau",
            handoffId: "hndf_lfse_cp_01",
            contextTokenPresent: true,
          },
          {
            logicalEventId: "evt_cp_entry_1",
            eventType: "planning_entry_selected",
            occurredAt: isoPlusMin(11),
            site: "cruisepromenade",
            environment: "production",
            browserSeed: "bseed_cp_org_01",
            sessionId: "sess_cp_org_01",
            path: "/planner",
            draftKey: "drk_alaska_trip_01",
            journeyKind: "cruise_sailing",
            physicalSailingId: "norwegian-bliss:2027-07-10",
            travelDateHint: "2027-07-10",
          },
          {
            logicalEventId: "evt_cp_draft_1",
            eventType: "trip_draft_started",
            occurredAt: isoPlusMin(12),
            site: "cruisepromenade",
            environment: "production",
            browserSeed: "bseed_cp_org_01",
            sessionId: "sess_cp_org_01",
            path: "/planner",
            draftKey: "drk_alaska_trip_01",
            journeyKind: "cruise_sailing",
            physicalSailingId: "norwegian-bliss:2027-07-10",
            isTemplateOrHydration: true,
          },
          // Template hydration & no-op saves MUST NOT count as Stage 4 customization!
          {
            logicalEventId: "evt_cp_cust_hydration_ignored",
            eventType: "trip_customized",
            occurredAt: isoPlusMin(13),
            site: "cruisepromenade",
            environment: "production",
            browserSeed: "bseed_cp_org_01",
            sessionId: "sess_cp_org_01",
            path: "/planner",
            draftKey: "drk_alaska_trip_01",
            isTemplateOrHydration: true,
          },
          {
            logicalEventId: "evt_cp_cust_noop_ignored",
            eventType: "trip_customized",
            occurredAt: isoPlusMin(14),
            site: "cruisepromenade",
            environment: "production",
            browserSeed: "bseed_cp_org_01",
            sessionId: "sess_cp_org_01",
            path: "/planner",
            draftKey: "drk_alaska_trip_01",
            isNoOpSave: true,
          },
        ],
      }),
      headers: prodBrowserHeaders("cruisepromenade.com"),
    });
    assert.equal(cpClientCollect.queuedCount, 6);

    // Server-side CP persistence linking draftKey -> tripIdentifier (shareCode), invitation shared, before customization
    const cpServerHeaders = prodBrowserHeaders("cruisepromenade.com", {
      "x-dcc-internal-secret": "test-internal-secret-121",
    });

    await collectAnalyticsRawPayload({
      rawBodyText: JSON.stringify({
        deliveryId: "dlv_cp_srv_persist",
        events: [
          {
            logicalEventId: "evt_cp_persisted_1",
            eventType: "trip_persisted",
            occurredAt: isoPlusMin(15),
            site: "cruisepromenade",
            environment: "production",
            browserSeed: "bseed_cp_org_01",
            sessionId: "sess_cp_org_01",
            path: "/planner",
            draftKey: "drk_alaska_trip_01",
            tripIdentifier: rawPrivateShareCode,
            journeyKind: "cruise_sailing",
            physicalSailingId: "norwegian-bliss:2027-07-10",
            partyHeadcountTotal: 4,
          },
          {
            logicalEventId: "evt_cp_invite_shared_1",
            eventType: "invitation_shared",
            occurredAt: isoPlusMin(16),
            site: "cruisepromenade",
            environment: "production",
            tripIdentifier: rawPrivateShareCode,
            subMilestone: "share_link_published",
          },
        ],
      }),
      headers: cpServerHeaders,
    });

    // Run worker mid-journey to verify Stage 4 === 0 (template/no-op ignored) and Stage 6 === 1 while Stage 7 === 0!
    await runAnalyticsWorker({ nowMs: baseTimeMs + 20 * 60_000 });
    const midReport = await buildNetworkAndTripAnalyticsReport({
      environment: "production",
      windowPreset: "28d",
      endIso: isoPlusMin(25),
      bypassCache: true,
    });
    assert.ok(midReport.tripLifecycle);
    assert.equal(midReport.tripLifecycle.totalDistinctTripUnitsInWindow, 1); // Draft + Persisted unified into 1 trip!
    assert.equal(midReport.tripLifecycle.draftToPersistedLinkedCount, 1);
    assert.equal(midReport.tripLifecycle.milestones.stage2_draftStarted, 1);
    assert.equal(midReport.tripLifecycle.milestones.stage3_tripPersisted, 1);
    assert.equal(midReport.tripLifecycle.milestones.stage4_firstMeaningfulCustomization, 0);
    assert.equal(midReport.tripLifecycle.milestones.stage6_invitationShared, 1);
    assert.equal(midReport.tripLifecycle.milestones.stage7_distinctCompanionsCount, 0);

    // 4. Meaningful customization + 4-dimension confirmation staged -> reviewed_edited -> applied + companion participation + duplicate merge + aged return + seller handoff
    await collectAnalyticsRawPayload({
      rawBodyText: JSON.stringify({
        deliveryId: "dlv_cp_srv_lifecycle_2",
        events: [
          {
            logicalEventId: "evt_cp_real_cust_1",
            eventType: "trip_customized",
            occurredAt: isoPlusMin(30),
            site: "cruisepromenade",
            environment: "production",
            tripIdentifier: rawPrivateShareCode,
            isNoOpSave: false,
            subMilestone: "activities_updated",
          },
          {
            logicalEventId: "evt_cp_conf_staged_1",
            eventType: "confirmation_staged",
            occurredAt: isoPlusMin(35),
            site: "cruisepromenade",
            environment: "production",
            tripIdentifier: rawPrivateShareCode,
            productCode: "6251SHOREXICEWALK",
            confirmationProvenance: {
              extraction: {
                channel: "inbound_email",
                category: "shore_excursion",
                lifecycleIntent: "new",
                extractedFieldsMask: ["title", "operator", "date", "time", "quantity"],
                attachmentSafety: "none",
              },
              travelerReview: {
                state: "unreviewed_staged",
                editedFields: [],
                seatAssignmentMode: "none",
              },
              providerVerification: {
                state: "unverified_document",
                verifiedAtIso: null,
                freshnessAgeSeconds: null,
              },
              dccInference: {
                portSlug: "juneau",
                dayMatchMethod: "exact_date_and_port",
                catalogConfidence: "exact_sku",
                windowFit: "fits_2h_buffer",
              },
            },
          },
          {
            logicalEventId: "evt_cp_conf_edited_1",
            eventType: "confirmation_reviewed_edited",
            occurredAt: isoPlusMin(38),
            site: "cruisepromenade",
            environment: "production",
            tripIdentifier: rawPrivateShareCode,
            confirmationProvenance: {
              extraction: {
                channel: "inbound_email",
                category: "shore_excursion",
                lifecycleIntent: "new",
                extractedFieldsMask: ["title", "operator", "date", "time", "quantity"],
                attachmentSafety: "none",
              },
              travelerReview: {
                state: "reviewed_edited",
                editedFields: ["time", "meeting_point"],
                seatAssignmentMode: "named_slots",
              },
              providerVerification: {
                state: "unverified_document",
                verifiedAtIso: null,
                freshnessAgeSeconds: null,
              },
              dccInference: {
                portSlug: "juneau",
                dayMatchMethod: "exact_date_and_port",
                catalogConfidence: "exact_sku",
                windowFit: "fits_2h_buffer",
              },
            },
          },
          {
            logicalEventId: "evt_cp_conf_applied_1",
            eventType: "confirmation_applied",
            occurredAt: isoPlusMin(40),
            site: "cruisepromenade",
            environment: "production",
            tripIdentifier: rawPrivateShareCode,
            confirmationProvenance: {
              extraction: {
                channel: "inbound_email",
                category: "shore_excursion",
                lifecycleIntent: "new",
                extractedFieldsMask: ["title", "operator", "date", "time", "quantity"],
                attachmentSafety: "none",
              },
              travelerReview: {
                state: "reviewed_edited",
                editedFields: ["time", "meeting_point"],
                seatAssignmentMode: "named_slots",
              },
              providerVerification: {
                state: "unverified_document",
                verifiedAtIso: null,
                freshnessAgeSeconds: null,
              },
              dccInference: {
                portSlug: "juneau",
                dayMatchMethod: "exact_date_and_port",
                catalogConfidence: "exact_sku",
                windowFit: "fits_2h_buffer",
              },
            },
          },
          // Companion claims slot in household party of 4 -> partyHeadcountTotal stays 4!
          {
            logicalEventId: "evt_cp_comp_1",
            eventType: "companion_participated",
            occurredAt: isoPlusMin(60),
            site: "cruisepromenade",
            environment: "production",
            tripIdentifier: rawPrivateShareCode,
            participantRole: "companion_claimed_slot",
            participantKey: "mbr_spouse_slot_2",
            partyHeadcountTotal: 4,
            subMilestone: "claimed_household_slot",
          },
          // Companion accidentally opens duplicate slot, then organizer merges it
          {
            logicalEventId: "evt_cp_comp_dup",
            eventType: "companion_participated",
            occurredAt: isoPlusMin(62),
            site: "cruisepromenade",
            environment: "production",
            tripIdentifier: rawPrivateShareCode,
            participantRole: "companion_self_joined",
            participantKey: "mbr_spouse_dup_temp",
            partyHeadcountTotal: 5,
            subMilestone: "self_joined_board",
          },
          {
            logicalEventId: "evt_cp_comp_merge",
            eventType: "participant_merged",
            occurredAt: isoPlusMin(65),
            site: "cruisepromenade",
            environment: "production",
            tripIdentifier: rawPrivateShareCode,
            participantRole: "organizer",
            participantKey: "mbr_spouse_slot_2",
            mergedFromParticipantKey: "mbr_spouse_dup_temp",
            partyHeadcountTotal: 4,
          },
          // Organizer returns 48 hours (2,880 mins) later in a new session -> qualifies for laterSession AND D1+ aged return!
          {
            logicalEventId: "evt_cp_return_d2",
            eventType: "trip_returned_later",
            occurredAt: isoPlusMin(2880),
            site: "cruisepromenade",
            environment: "production",
            browserSeed: "bseed_cp_org_01",
            sessionId: "sess_cp_org_day2_new",
            tripIdentifier: rawPrivateShareCode,
          },
          // Seller handoff initiated (Stage 9)
          {
            logicalEventId: "evt_cp_handoff_1",
            eventType: "seller_handoff_initiated",
            occurredAt: isoPlusMin(2890),
            site: "cruisepromenade",
            environment: "production",
            browserSeed: "bseed_cp_org_01",
            sessionId: "sess_cp_org_day2_new",
            tripIdentifier: rawPrivateShareCode,
            handoffId: "hndf_viator_juneau_01",
            clickId: "clk_viator_juneau_01",
            provider: "viator",
            productCode: "6251SHOREXICEWALK",
          },
        ],
      }),
      headers: cpServerHeaders,
    });

    // 5. Attempt unauthenticated client `booking_outcome_confirmed` -> MUST fail with 403!
    const spoofedClientReq = new NextRequest("https://destinationcommandcenter.com/api/v2/analytics/collect", {
      method: "POST",
      headers: prodBrowserHeaders("cruisepromenade.com", { "content-type": "application/json" }),
      body: JSON.stringify({
        events: [
          {
            logicalEventId: "evt_spoofed_outcome_999",
            eventType: "booking_outcome_confirmed",
            site: "cruisepromenade",
            environment: "production",
            tripIdentifier: rawPrivateShareCode,
            outcomeType: "confirmed_paid",
            grossAmountUsd: 1200,
          },
        ],
      }),
    });
    const spoofRes = await collectPost(spoofedClientReq);
    assert.equal(spoofRes.status, 403);

    await runAnalyticsWorker({ nowMs: baseTimeMs + 3000 * 60_000 });
    const beforeOutcomeReport = await buildNetworkAndTripAnalyticsReport({
      environment: "production",
      windowPreset: "28d",
      endIso: isoPlusMin(3000),
      bypassCache: true,
    });
    assert.ok(beforeOutcomeReport.tripLifecycle);
    // Confirmation import applied === 1, seller handoff === 1, but confirmed outcome MUST still be 0!
    assert.equal(beforeOutcomeReport.tripLifecycle.milestones.stage5_confirmationApplied, 1);
    assert.equal(beforeOutcomeReport.tripLifecycle.milestones.stage9_sellerHandoffInitiated, 1);
    assert.equal(beforeOutcomeReport.tripLifecycle.milestones.stage10_confirmedOutcome, 0);

    // 6. Now emit genuine server-authenticated booking_outcome_confirmed (affiliate commission settled + GoSno direct MoR paid)
    await collectAnalyticsRawPayload({
      rawBodyText: JSON.stringify({
        events: [
          {
            logicalEventId: "evt_cp_verified_outcome_1",
            eventType: "booking_outcome_confirmed",
            occurredAt: isoPlusMin(2950),
            site: "cruisepromenade",
            environment: "production",
            tripIdentifier: rawPrivateShareCode,
            handoffId: "hndf_viator_juneau_01",
            provider: "viator",
            outcomeType: "commission_settled",
            commissionAmountUsd: 68.4,
            confirmationProvenance: {
              providerVerification: {
                state: "verified_marketplace_webhook",
                verifiedAtIso: isoPlusMin(2950),
                freshnessAgeSeconds: 0,
              },
            },
          },
          {
            logicalEventId: "evt_gosno_mor_paid_1",
            eventType: "booking_outcome_confirmed",
            occurredAt: isoPlusMin(2960),
            site: "gosno",
            environment: "production",
            outcomeType: "confirmed_paid",
            grossAmountUsd: 449,
          },
        ],
      }),
      headers: cpServerHeaders,
    });

    await runAnalyticsWorker({ nowMs: baseTimeMs + 3010 * 60_000 });
    const fullReport = await buildNetworkAndTripAnalyticsReport({
      environment: "production",
      windowPreset: "28d",
      endIso: isoPlusMin(3010),
      bypassCache: true,
    });

    // Verify Traffic Totals across JFD + LFSE + CP
    assert.equal(fullReport.dataStatus, "live_verified");
    assert.ok(fullReport.trafficSummary);
    assert.equal(fullReport.trafficSummary.observedBrowsers, 3);
    assert.equal(fullReport.trafficSummary.pageviews, 4); // 1 JFD + 2 LFSE + 1 CP
    assert.equal(fullReport.trafficSummary.crossSiteHandoffClicks, 2);
    assert.equal(fullReport.trafficSummary.crossSiteHandoffArrivals, 2);
    assert.equal(fullReport.trafficSummary.verifiedDccCtxArrivals, 1);
    assert.equal(fullReport.trafficSummary.sellerHandoffsTotal, 1);

    // Verify Trip Lifecycle Milestones, Household Headcount, Duplicate Merge & Aged Return
    const tl = fullReport.tripLifecycle!;
    assert.equal(tl.totalDistinctTripUnitsInWindow, 1);
    assert.equal(tl.draftToPersistedLinkedCount, 1);
    assert.equal(tl.milestones.stage1_planningEntrySelected, 1);
    assert.equal(tl.milestones.stage2_draftStarted, 1);
    assert.equal(tl.milestones.stage3_tripPersisted, 1);
    assert.equal(tl.milestones.stage4_firstMeaningfulCustomization, 1);
    assert.equal(tl.milestones.stage5_confirmationStaged, 1);
    assert.equal(tl.milestones.stage5_confirmationReviewed, 1);
    assert.equal(tl.milestones.stage5_confirmationApplied, 1);
    assert.equal(tl.milestones.stage6_invitationShared, 1);
    // Duplicate companion slot merged cleanly -> distinct companions === 1, duplicate merges === 1!
    assert.equal(tl.milestones.stage7_distinctCompanionsCount, 1);
    assert.equal(tl.milestones.stage7_duplicateMergesReconciled, 1);
    assert.equal(tl.milestones.stage8_returnedLaterSession, 1);
    assert.equal(tl.milestones.stage9_sellerHandoffInitiated, 1);
    assert.equal(tl.milestones.stage10_confirmedOutcome, 1);

    // Verify party headcount remained 4 in trip state
    const db = getAnalyticsSqliteDb();
    const tripRow = db.prepare("SELECT latest_party_headcount FROM dcc_analytics_trip_state LIMIT 1").get();
    assert.equal(Number(tripRow?.latest_party_headcount), 4);

    // Verify aged cohort denominators: trip is ~50h old -> eligible for D1+ (100%), NOT yet aged 7d -> D7+ is "insufficient_aged_cohort"!
    assert.equal(tl.agedRetentionCohorts.d1Plus.eligiblePersistedTrips, 1);
    assert.equal(tl.agedRetentionCohorts.d1Plus.returnedTrips, 1);
    assert.equal(tl.agedRetentionCohorts.d1Plus.retentionRate, 100);
    assert.equal(tl.agedRetentionCohorts.d7Plus.eligiblePersistedTrips, 0);
    assert.equal(tl.agedRetentionCohorts.d7Plus.retentionRate, "insufficient_aged_cohort");

    // Verify 4-dimension confirmation provenance breakdown
    assert.equal(tl.confirmationProvenanceBreakdown.byExtractionChannel.inbound_email, 1);
    assert.equal(tl.confirmationProvenanceBreakdown.byReviewState.reviewed_edited, 1);
    assert.equal(tl.confirmationProvenanceBreakdown.byProviderVerification.unverified_document, 1);
    assert.equal(tl.confirmationProvenanceBreakdown.byDccDayMatchMethod.exact_date_and_port, 1);

    // Verify strict financial separation: Direct MoR Gross Sales ($449) vs Affiliate Commissions ($68.40) never merged!
    assert.ok(fullReport.financialOutcomesSeparation);
    assert.equal(fullReport.financialOutcomesSeparation.directMorPaidGrossSalesUsd, 449);
    assert.equal(fullReport.financialOutcomesSeparation.verifiedAffiliateCommissionsUsd, 68.4);
  });

  test("121c. Retry idempotency vs genuine repeated actions, cold-start closed-window determinism, and late-arriving event rollup healing", async () => {
    resetTestSqliteStore();

    const browserHeaders = new Headers({
      host: "www.lastfrontiershoreexcursions.com",
      origin: "https://www.lastfrontiershoreexcursions.com",
      "accept-language": "en-US,en;q=0.9",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0",
    });

    const singleRetryPayload = JSON.stringify({
      deliveryId: "dlv_retry_test",
      events: [
        {
          logicalEventId: "evt_idem_fixed_001",
          eventType: "page_viewed",
          occurredAt: "2026-11-18T10:15:00.000Z",
          site: "lastfrontiershoreexcursions",
          environment: "production",
          browserSeed: "bseed_idem_1",
          sessionId: "sess_idem_1",
          path: "/ports/juneau",
        },
      ],
    });

    // Deliver exact same logicalEventId 3 times (simulating client timeout + 2 retries)
    const r1 = await collectAnalyticsRawPayload({ rawBodyText: singleRetryPayload, headers: browserHeaders });
    const r2 = await collectAnalyticsRawPayload({ rawBodyText: singleRetryPayload, headers: browserHeaders });
    const r3 = await collectAnalyticsRawPayload({ rawBodyText: singleRetryPayload, headers: browserHeaders });
    assert.equal(r1.queuedCount, 1);
    assert.equal(r2.queuedCount, 0);
    assert.equal(r2.deduplicatedCount, 1);
    assert.equal(r3.deduplicatedCount, 1);

    // Deliver a genuine second pageview with a distinct logicalEventId
    await collectAnalyticsRawPayload({
      rawBodyText: JSON.stringify({
        events: [
          {
            logicalEventId: "evt_genuine_second_002",
            eventType: "page_viewed",
            occurredAt: "2026-11-18T10:18:00.000Z",
            site: "lastfrontiershoreexcursions",
            environment: "production",
            browserSeed: "bseed_idem_1",
            sessionId: "sess_idem_1",
            path: "/ports/skagway",
          },
        ],
      }),
      headers: browserHeaders,
    });

    await runAnalyticsWorker({ nowMs: Date.parse("2026-11-18T12:00:00.000Z") });

    const warmReport = await buildNetworkAndTripAnalyticsReport({
      environment: "production",
      windowPreset: "24h",
      endIso: "2026-11-18T12:00:00.000Z",
      asOfWatermarkIso: "2026-11-18T12:00:00.000Z",
      bypassCache: true,
    });
    assert.equal(warmReport.trafficSummary?.observedBrowsers, 1);
    assert.equal(warmReport.trafficSummary?.pageviews, 2); // 1 from 3x retried + 1 genuine repeat = 2!

    // Cold-start determinism: close SQLite handle + clear in-memory caches, reopen fresh instance on same watermark
    closeAndResetAnalyticsDbForTests(false);
    clearReportMemorySnapshotsForTests();

    const coldReport = await buildNetworkAndTripAnalyticsReport({
      environment: "production",
      windowPreset: "24h",
      endIso: "2026-11-18T12:00:00.000Z",
      asOfWatermarkIso: "2026-11-18T12:00:00.000Z",
      bypassCache: true,
    });
    assert.deepEqual(coldReport.trafficSummary, warmReport.trafficSummary);
    assert.deepEqual(coldReport.sites, warmReport.sites);

    // Late-arriving event rollup healing: watermark is at 12:00Z, now an offline tab flushes an event from 08:30Z
    await collectAnalyticsRawPayload({
      rawBodyText: JSON.stringify({
        events: [
          {
            logicalEventId: "evt_late_arrival_0830",
            eventType: "page_viewed",
            occurredAt: "2026-11-18T08:30:00.000Z",
            site: "lastfrontiershoreexcursions",
            environment: "production",
            browserSeed: "bseed_late_2",
            sessionId: "sess_late_2",
            path: "/ports/sitka",
          },
        ],
      }),
      headers: browserHeaders,
    });

    const lateRun = await runAnalyticsWorker({ nowMs: Date.parse("2026-11-18T12:05:00.000Z") });
    assert.equal(lateRun.lateEventsReconciledCount, 1);

    const healedReport = await buildNetworkAndTripAnalyticsReport({
      environment: "production",
      windowPreset: "24h",
      endIso: "2026-11-18T12:05:00.000Z",
      bypassCache: true,
    });
    assert.equal(healedReport.trafficSummary?.observedBrowsers, 2);
    assert.equal(healedReport.trafficSummary?.pageviews, 3);
  });

  test("121d. Bot, prefetch, outbound crawler GET, QA, and Preview .vercel.app spoofing isolation + legacy 24,036 click-only fix", async () => {
    resetTestSqliteStore();

    // 1. Known bot (Googlebot)
    await collectAnalyticsRawPayload({
      rawBodyText: JSON.stringify({
        events: [
          {
            logicalEventId: "evt_bot_1",
            eventType: "page_viewed",
            occurredAt: "2026-11-19T01:00:00.000Z",
            site: "juneauflightdeck",
            environment: "production",
            browserSeed: "bseed_googlebot",
            sessionId: "sess_bot",
            path: "/",
          },
        ],
      }),
      headers: new Headers({
        host: "juneauflightdeck.com",
        "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      }),
    });

    // 2. Next.js router prefetch
    await collectAnalyticsRawPayload({
      rawBodyText: JSON.stringify({
        events: [
          {
            logicalEventId: "evt_prefetch_1",
            eventType: "page_viewed",
            occurredAt: "2026-11-19T01:01:00.000Z",
            site: "cruisepromenade",
            environment: "production",
            browserSeed: "bseed_prefetch",
            sessionId: "sess_prefetch",
            path: "/ports/juneau",
          },
        ],
      }),
      headers: new Headers({
        host: "cruisepromenade.com",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0",
        "next-router-prefetch": "1",
      }),
    });

    // 3. Preview .vercel.app host attempting to spoof environment: "production"
    await collectAnalyticsRawPayload({
      rawBodyText: JSON.stringify({
        events: [
          {
            logicalEventId: "evt_preview_spoof_1",
            eventType: "page_viewed",
            occurredAt: "2026-11-19T01:02:00.000Z",
            site: "cruisepromenade",
            environment: "production",
            browserSeed: "bseed_preview_dev",
            sessionId: "sess_preview_dev",
            path: "/planner",
          },
        ],
      }),
      headers: new Headers({
        host: "cruisepromenade-git-feat-preview.vercel.app",
        origin: "https://cruisepromenade-git-feat-preview.vercel.app",
        "accept-language": "en-US,en;q=0.9",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/131.0.0.0",
      }),
    });

    // 4. QA query param (`?qa=1`) on Production host
    await collectAnalyticsRawPayload({
      rawBodyText: JSON.stringify({
        events: [
          {
            logicalEventId: "evt_qa_param_1",
            eventType: "page_viewed",
            occurredAt: "2026-11-19T01:03:00.000Z",
            site: "lastfrontiershoreexcursions",
            environment: "production",
            browserSeed: "bseed_qa_tester",
            sessionId: "sess_qa_tester",
            path: "/southeast-alaska/fishing-lodges?qa=1",
          },
        ],
      }),
      headers: new Headers({
        host: "www.lastfrontiershoreexcursions.com",
        "accept-language": "en-US,en;q=0.9",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0",
      }),
    });

    // 5. Outbound /go/out GET crawled without _dcc_aid cookie -> preserves 302 Viator attribution & 0 human visitors!
    const goRes = await goOutGet(
      new Request(
        "https://destinationcommandcenter.com/go/out?u=https%3A%2F%2Fwww.viator.com%2Ftours%2FJuneau%2FWhale%2Fd941-6251SHOREXICEWALK&port=juneau&product=6251SHOREXICEWALK",
        {
          headers: {
            "x-forwarded-host": "destinationcommandcenter.com",
            "user-agent": "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
          },
        },
      ),
    );
    await flushServerlessAfterTasks();
    assert.equal(goRes.status, 302);
    const redirectLoc = goRes.headers.get("location") || "";
    assert.match(redirectLoc, /viator\.com/);
    assert.match(redirectLoc, /pid=/);
    assert.match(redirectLoc, /mcid=/);

    await runAnalyticsWorker({ nowMs: Date.parse("2026-11-19T23:55:00.000Z") });

    const prodReport = await buildNetworkAndTripAnalyticsReport({
      environment: "production",
      windowPreset: "24h",
      endIso: "2026-11-19T23:59:59.000Z",
      bypassCache: true,
    });
    // Zero human visitors or pageviews in Production from bot, prefetch, QA, or Preview-spoofed events!
    assert.equal(prodReport.trafficSummary?.observedBrowsers, 0);
    assert.equal(prodReport.trafficSummary?.pageviews, 0);
    assert.ok((prodReport.trafficHygieneAndExclusions?.knownBotEvents || 0) >= 2);
    assert.equal(prodReport.trafficHygieneAndExclusions?.suspectedAutomationAndPrefetchEvents, 1);
    assert.equal(prodReport.trafficHygieneAndExclusions?.qaOrSyntheticEvents, 1);

    // Preview report accurately captures the Preview-origin event!
    const previewReport = await buildNetworkAndTripAnalyticsReport({
      environment: "preview",
      windowPreset: "24h",
      endIso: "2026-11-19T23:59:59.000Z",
      bypassCache: true,
    });
    assert.equal(previewReport.trafficSummary?.observedBrowsers, 1);
    assert.equal(previewReport.trafficSummary?.pageviews, 1);

    // Also verify legacy portfolioFunnelReport no longer inflates uniqueVisitors with click-only / recommendation / bot rows
    const mockLedger: DurableLedgerState = {
      schemaVersion: "dcc-durable-transactional-store/1.0",
      txSequence: 1,
      updatedAt: "2026-11-19T01:00:00.000Z",
      funnelVisitorsById: {
        vis_real_1: {
          visitorId: "vis_real_1",
          surface: "destinationcommandcenter.com",
          sourcePage: "/juneau",
          firstSeenAt: "2026-11-18T12:00:00.000Z",
          lastSeenAt: "2026-11-18T12:05:00.000Z",
          visitCount: 2,
          trafficClass: "production",
          isTest: false,
        } as unknown as DurableLedgerState["funnelVisitorsById"][string],
      },
      opaqueClicksById: {
        clk_unclicked_rec: {
          clickId: "clk_unclicked_rec",
          handoffId: "hf_rec_1",
          recordStage: "recommendation",
          originatingSite: "destinationcommandcenter.com",
          provider: "viator",
          productCode: "6251SHOREXICEWALK",
          createdAt: "2026-11-18T12:01:00.000Z",
          trafficClass: "production",
          isTest: false,
        } as unknown as DurableLedgerState["opaqueClicksById"][string],
        clk_bot_crawler: {
          clickId: "clk_bot_crawler",
          handoffId: "hf_bot_1",
          recordStage: "handoff",
          userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1)",
          originatingSite: "destinationcommandcenter.com",
          provider: "viator",
          productCode: "6251SHOREXICEWALK",
          createdAt: "2026-11-18T12:02:00.000Z",
          trafficClass: "production",
          isTest: false,
        } as unknown as DurableLedgerState["opaqueClicksById"][string],
        clk_orphan_no_visitor: {
          clickId: "clk_orphan_no_visitor",
          handoffId: "hf_orphan_1",
          recordStage: "handoff",
          visitorId: null,
          originatingSite: "destinationcommandcenter.com",
          provider: "viator",
          productCode: "6251SHOREXICEWALK",
          createdAt: "2026-11-18T12:03:00.000Z",
          followedAt: "2026-11-18T12:03:01.000Z",
          trafficClass: "production",
          isTest: false,
        } as unknown as DurableLedgerState["opaqueClicksById"][string],
      },
      opaqueClickIdsByHandoffId: {},
      reconciliationByDedupeKey: {},
      placementApprovalsById: {},
      stewardReviewCasesById: {},
      stewardVehiclePatchesById: {},
      stewardPublicTimeline: [],
    };
    const reconciledLegacy = await buildUnifiedPortfolioFunnelReport({
      windowPreset: "7d",
      nowIso: "2026-11-19T02:00:00.000Z",
      ledgerStateOverride: mockLedger,
    });
    assert.equal(reconciledLegacy.totals.outboundClicks.checkoutReferrals, 1); // rec + bot excluded!
    assert.equal(reconciledLegacy.totals.clickOnlyHandoffSessionsCount, 1);
    // Click-only row without visitorId is separated into clickOnlyHandoffSessionsCount, NOT added to uniqueVisitors!
    assert.ok(!reconciledLegacy.reconciliation.visitorsAndPageviews.portfolioUniqueVisitors.toString().includes("clk_vis"));
  });

  test("121e. Zero-leak privacy redaction audit and authenticated trip_deleted tombstone purge", async () => {
    resetTestSqliteStore();

    const secretShareCode = "99f8e7d6c5b4a39281706f5e";
    const sanitizedPath1 = sanitizeAnalyticsPath(
      `/p/${secretShareCode}?share=${secretShareCode}&ctx=dcc_ctx_SECRET999#token=ORG_SECRET_TOKEN`,
    );
    const sanitizedPath2 = sanitizeAnalyticsPath(
      `/organizer/${secretShareCode}/settings#claim=CLAIM_SECRET_123`,
    );
    const hostedPublicPath = sanitizeAnalyticsPath("/organizer/hosted/alaska-pride-2027");

    assert.equal(sanitizedPath1, "/p/[redacted]");
    assert.equal(sanitizedPath2, "/organizer/[redacted]/settings");
    assert.equal(hostedPublicPath, "/organizer/hosted/alaska-pride-2027");

    const safeProps = sanitizeAnalyticsProps({
      shareCode: secretShareCode,
      organizerToken: "org_tok_SECRET123",
      email: "traveler.secret@example.com",
      cabinNumber: "Cabin 9104",
      weightLb: 195,
      travelDate: "2027-08-19",
      freeText: "Contact alice.smith@example.com or (907) 555-0144 for Cabin 9104 Conf #VTR-774411",
      surface: "juneau_guide",
    });
    assert.equal(safeProps.surface, "juneau_guide");
    assert.equal(Object.keys(safeProps).includes("shareCode"), false);
    assert.equal(Object.keys(safeProps).includes("organizerToken"), false);
    assert.equal(Object.keys(safeProps).includes("email"), false);
    assert.equal(Object.keys(safeProps).includes("cabinNumber"), false);
    assert.equal(Object.keys(safeProps).includes("weightLb"), false);
    assert.equal(Object.keys(safeProps).includes("travelDate"), false);

    assert.equal(
      bucketizeTravelDateHint("2027-08-19", "2026-11-19T00:00:00.000Z"),
      "181_365d",
    );

    const srvHeaders = new Headers({
      host: "cruisepromenade-preview.vercel.app",
      "user-agent": "Mozilla/5.0 Chrome/131.0.0.0",
      "x-dcc-internal-secret": "test-internal-secret-121",
    });

    await collectAnalyticsRawPayload({
      rawBodyText: JSON.stringify({
        events: [
          {
            logicalEventId: "evt_priv_persist_1",
            eventType: "trip_persisted",
            occurredAt: "2026-11-19T03:00:00.000Z",
            site: "cruisepromenade",
            path: `/p/${secretShareCode}?share=${secretShareCode}#token=SECRET_ORG_TOK`,
            tripIdentifier: secretShareCode,
            travelDateHint: "2027-08-19",
            props: {
              shareCode: secretShareCode,
              email: "bob@example.com",
              note: "Reservation #ABC-998877 Cabin 4012",
              surface: "planner_save",
            },
          },
        ],
      }),
      headers: srvHeaders,
    });

    await runAnalyticsWorker({ nowMs: Date.parse("2026-11-19T03:05:00.000Z") });

    const db = getAnalyticsSqliteDb();
    const queueDump = JSON.stringify(db.prepare("SELECT * FROM dcc_analytics_ingest_queue").all());
    const eventsDump = JSON.stringify(db.prepare("SELECT * FROM dcc_analytics_events").all());
    const tripDump = JSON.stringify(db.prepare("SELECT * FROM dcc_analytics_trip_state").all());

    for (const forbidden of [
      secretShareCode,
      "SECRET_ORG_TOK",
      "bob@example.com",
      "ABC-998877",
      "4012",
      "2027-08-19",
    ]) {
      assert.equal(queueDump.includes(forbidden), false, `Queue leaked ${forbidden}`);
      assert.equal(eventsDump.includes(forbidden), false, `Events leaked ${forbidden}`);
      assert.equal(tripDump.includes(forbidden), false, `Trip state leaked ${forbidden}`);
    }

    // Verify trip_deleted tombstones and purges per-trip state
    assert.equal(
      Number(db.prepare("SELECT COUNT(*) AS cnt FROM dcc_analytics_trip_state").get()?.cnt),
      1,
    );
    await collectAnalyticsRawPayload({
      rawBodyText: JSON.stringify({
        events: [
          {
            logicalEventId: "evt_priv_delete_1",
            eventType: "trip_deleted",
            occurredAt: "2026-11-19T03:10:00.000Z",
            site: "cruisepromenade",
            tripIdentifier: secretShareCode,
          },
        ],
      }),
      headers: srvHeaders,
    });
    await runAnalyticsWorker({ nowMs: Date.parse("2026-11-19T03:12:00.000Z") });
    assert.equal(
      Number(db.prepare("SELECT COUNT(*) AS cnt FROM dcc_analytics_trip_state").get()?.cnt),
      0,
    );
    assert.equal(
      Number(
        db
          .prepare(
            "SELECT COUNT(*) AS cnt FROM dcc_analytics_tombstones WHERE target_type = 'trip'",
          )
          .get()?.cnt,
      ),
      1,
    );
  });

  test("121f. Backpressure priority shedding, dead-letter isolation, kill switch, outage fallback (never 0s), admin auth gate, and synthetic QA purge", async () => {
    resetTestSqliteStore();
    const db = getAnalyticsSqliteDb();

    // 1. Backpressure: ceiling=2 sheds 3rd ordinary traffic event, but admits high-value trip_lifecycle event (1.2x = ceil/floor -> let's use maxQueueDepth=5 so 1.2x=6!)
    const makeTrafficRec = (id: string) => ({
      logicalEventId: id,
      deliveryId: "dlv_bp",
      schemaVersion: "dcc.analytics.v2",
      eventType: "page_viewed" as const,
      layer: "traffic" as const,
      environment: "preview" as const,
      siteId: "cruisepromenade" as const,
      rawSiteInput: "cruisepromenade",
      trafficClass: "observed_browser" as const,
      classificationReason: "valid_browser",
      occurredAt: "2026-11-19T04:00:00.000Z",
      receivedAt: "2026-11-19T04:00:00.000Z",
      reportingSubjectId: "rsub_v1_abcdef0123456789abcdef0123456789",
      keyVersion: 1,
      sessionKey: "asess_v1_abcdef0123456789abcdef01",
      navigationType: "initial_load",
      canonicalPath: "/ports/juneau",
      landingPath: "/ports/juneau",
      referrerDomain: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      contentFamily: "cruise_sailing" as const,
      handoffId: null,
      clickId: null,
      continuityTier: "none" as const,
      targetSiteId: null,
      provider: null,
      productCode: null,
      physicalSailingId: null,
      hostedDepartureId: null,
      journeyKind: null,
      draftKeyHash: null,
      analyticsTripKey: null,
      participantRole: null,
      participantKey: null,
      mergedFromParticipantKey: null,
      partyHeadcountTotal: null,
      subMilestone: null,
      isTemplateOrHydration: false,
      isNoOpSave: false,
      leadTimeBucket: null,
      confirmationProvenance: null,
      outcomeType: null,
      grossAmountUsd: null,
      commissionAmountUsd: null,
      props: {},
    });

    const bpBatch = await enqueueNormalizedAnalyticsBatch({
      maxQueueDepth: 5,
      records: [
        makeTrafficRec("bp_1"),
        makeTrafficRec("bp_2"),
        makeTrafficRec("bp_3"),
        makeTrafficRec("bp_4"),
        makeTrafficRec("bp_5"),
        makeTrafficRec("bp_6_dropped_traffic"),
        {
          ...makeTrafficRec("bp_7_preserved_trip_lifecycle"),
          eventType: "trip_persisted",
          layer: "trip_lifecycle",
          analyticsTripKey: "atk_v1_0123456789abcdef0123456789abcdef",
        },
      ],
    });
    assert.equal(bpBatch.queuedCount, 6); // 5 traffic + 1 prioritized trip_lifecycle!
    assert.equal(bpBatch.droppedBackpressureCount, 1); // ordinary traffic shed cleanly!

    // 2. Inject a corrupt poison-pill queue row and verify 3 retries -> dead_letter without blocking valid rows
    db.prepare(
      `INSERT INTO dcc_analytics_ingest_queue (
         logical_event_id, environment, site_id, event_type, traffic_class,
         occurred_at, received_at, status, attempts, payload_json
       ) VALUES ('poison_pill_row', 'preview', 'cruisepromenade', 'page_viewed', 'observed_browser',
                 '2026-11-19T04:01:00.000Z', '2026-11-19T04:01:00.000Z', 'queued', 0, '{corrupt_json')`,
    ).run();

    await runAnalyticsWorker({ nowMs: Date.parse("2026-11-19T04:05:00.000Z") });
    await runAnalyticsWorker({ nowMs: Date.parse("2026-11-19T04:06:00.000Z") });
    await runAnalyticsWorker({ nowMs: Date.parse("2026-11-19T04:07:00.000Z") });

    const poisonRow = db
      .prepare("SELECT status, attempts FROM dcc_analytics_ingest_queue WHERE logical_event_id = 'poison_pill_row'")
      .get();
    assert.equal(poisonRow?.status, "dead_letter");
    assert.equal(Number(poisonRow?.attempts), 3);

    const exec = await getAnalyticsExecutor();
    const counters = await readAnalyticsHealthCounters(exec);
    assert.equal(counters.deadLetterTotal, 1);
    assert.equal(counters.processedTotal, 6); // All 6 valid events processed cleanly!

    // 3. Kill switch returns 202 immediately without writing to store
    process.env.DCC_ANALYTICS_KILL_SWITCH = "1";
    const ksRes = await collectAnalyticsRawPayload({
      rawBodyText: JSON.stringify({
        events: [
          {
            logicalEventId: "evt_ks_1",
            eventType: "page_viewed",
            site: "cruisepromenade",
          },
        ],
      }),
      headers: new Headers({ "user-agent": "Mozilla/5.0 Chrome/131.0.0.0" }),
    });
    assert.equal(ksRes.status, 202);
    assert.equal(ksRes.queuedCount, 0);
    delete process.env.DCC_ANALYTICS_KILL_SWITCH;

    // 4. Prime last-good snapshot, then simulate store outage -> returns stale_last_good_snapshot, and when cleared returns honest "unavailable" (never 0s!)
    const goodPreview = await buildNetworkAndTripAnalyticsReport({
      environment: "preview",
      windowPreset: "24h",
      endIso: "2026-11-19T04:10:00.000Z",
    });
    assert.equal(goodPreview.dataStatus, "live_verified");
    assert.equal(goodPreview.trafficSummary?.pageviews, 5);

    setSimulateAnalyticsStoreOutageForTests(true);
    const fallbackPreview = await buildNetworkAndTripAnalyticsReport({
      environment: "preview",
      windowPreset: "24h",
      endIso: "2026-11-19T04:10:00.000Z",
    });
    assert.equal(fallbackPreview.dataStatus, "stale_last_good_snapshot");
    assert.equal(fallbackPreview.trafficSummary?.pageviews, 5);

    clearReportMemorySnapshotsForTests();
    const unavailPreview = await buildNetworkAndTripAnalyticsReport({
      environment: "preview",
      windowPreset: "24h",
      endIso: "2026-11-19T04:10:00.000Z",
    });
    assert.equal(unavailPreview.dataStatus, "unavailable");
    assert.equal(unavailPreview.ok, false);
    assert.equal(unavailPreview.trafficSummary, null);
    assert.equal(unavailPreview.tripLifecycle, null);
    setSimulateAnalyticsStoreOutageForTests(false);

    // 5. Admin report API enforces fail-closed 401 on unauthenticated requests and 200 with internal secret
    const unauthAdminRes = await adminReportGet(
      new NextRequest("https://destinationcommandcenter.com/api/admin/analytics/report?env=preview"),
    );
    assert.equal(unauthAdminRes.status, 401);

    const authAdminRes = await adminReportGet(
      new NextRequest("https://destinationcommandcenter.com/api/admin/analytics/report?env=preview&window=24h", {
        headers: { "x-dcc-internal-secret": "test-internal-secret-121" },
      }),
    );
    assert.equal(authAdminRes.status, 200);

    // 6. Synthetic QA labeling & purge leaves genuine records untouched
    await collectAnalyticsRawPayload({
      rawBodyText: JSON.stringify({
        events: [
          {
            logicalEventId: "evt_synth_purge_me",
            eventType: "page_viewed",
            occurredAt: "2026-11-19T04:12:00.000Z",
            site: "cruisepromenade",
            isSyntheticSample: true,
          },
        ],
      }),
      headers: new Headers({
        host: "cruisepromenade-preview.vercel.app",
        "user-agent": "Mozilla/5.0 Chrome/131.0.0.0",
      }),
    });
    await runAnalyticsWorker({ nowMs: Date.parse("2026-11-19T04:15:00.000Z") });

    const purged = await purgeSyntheticOrExpiredAnalyticsRecords({
      environment: "preview",
      onlyQaOrSynthetic: true,
    });
    assert.equal(purged.deletedEventsCount, 1);
    const remainingGenuine = db
      .prepare("SELECT COUNT(*) AS cnt FROM dcc_analytics_events WHERE environment = 'preview' AND traffic_class = 'observed_browser'")
      .get();
    assert.equal(Number(remainingGenuine?.cnt), 6);

    // 7. Per-site runtime disable halts only the targeted site while allowing other sites
    const disabledControls = await setAnalyticsRuntimeControls({
      disabledSites: ["gosno"],
      actor: "suite-121",
    });
    assert.deepEqual(disabledControls.disabledSites, ["gosno"]);

    const gosnoBlocked = await collectAnalyticsRawPayload({
      rawBodyText: JSON.stringify({
        events: [
          {
            logicalEventId: "evt_gosno_blocked_runtime_1",
            eventType: "page_viewed",
            occurredAt: "2026-11-19T04:16:00.000Z",
            site: "gosno.co",
            path: "/ski-shuttle",
          },
        ],
      }),
      headers: new Headers({
        host: "gosno-preview.vercel.app",
        "user-agent": "Mozilla/5.0 Chrome/131.0.0.0",
      }),
    });
    assert.equal(gosnoBlocked.accepted, false);
    assert.equal(gosnoBlocked.reason, "site_disabled_runtime");
    assert.equal(gosnoBlocked.queuedCount, 0);

    const parrAllowed = await collectAnalyticsRawPayload({
      rawBodyText: JSON.stringify({
        events: [
          {
            logicalEventId: "evt_parr_allowed_runtime_1",
            eventType: "page_viewed",
            occurredAt: "2026-11-19T04:16:05.000Z",
            site: "partyatredrocks",
            path: "/book-shuttle",
          },
        ],
      }),
      headers: new Headers({
        host: "partyatredrocks-preview.vercel.app",
        "user-agent": "Mozilla/5.0 Chrome/131.0.0.0",
      }),
    });
    assert.equal(parrAllowed.accepted, true);
    assert.equal(parrAllowed.queuedCount, 1);

    await setAnalyticsRuntimeControls({
      disabledSites: [],
      actor: "suite-121-restore",
    });
  });
});
