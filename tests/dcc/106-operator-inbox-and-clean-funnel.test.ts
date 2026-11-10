import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, buildAdminSessionValue } from "@/lib/adminAccess";
import { GET as adminLogoutGet } from "@/app/admin/logout/route";
import {
  buildUnifiedPortfolioFunnelReport,
  isSyntheticSeedOrderRef,
  isSyntheticSeedOrTestOutcome,
} from "@/lib/dcc/commerce/portfolioFunnelReport";
import {
  buildOperatorTriageFindingId,
  classifyOperatorInboxSubmission,
  clearInMemoryOperatorTriageForTests,
  getUnifiedOperatorInbox,
  normalizeInquiryNotificationStatus,
  saveOperatorInboxTriageOverlay,
  validateCpBaseUrlOverride,
  type RawFindingRowInput,
} from "@/lib/dcc/operatorInbox";
import type { DurableLedgerState } from "@/lib/dcc/storage/durableTransactionalStore";
import {
  GET as operatorInboxGet,
  POST as operatorInboxPost,
} from "@/app/api/admin/operator-inbox/route";

test("106a. Genuine vs. test/QA classification preserves 100% of records and tags exact reasons", async () => {
  assert.deepEqual(
    classifyOperatorInboxSubmission({
      isTest: true,
      email: "traveler@gmail.com",
      name: "Jordan Lee",
    }),
    { classification: "test", classificationReason: "explicit_is_test" },
  );

  assert.deepEqual(
    classifyOperatorInboxSubmission({
      namespace: "preview",
      email: "traveler@gmail.com",
      name: "Jordan Lee",
    }),
    { classification: "test", classificationReason: "preview_namespace" },
  );

  for (const domain of ["example.com", "command.com", "test.com"]) {
    assert.deepEqual(
      classifyOperatorInboxSubmission({
        email: `probe@${domain}`,
        name: "Probe User",
      }),
      {
        classification: "test",
        classificationReason: "synthetic_email_domain",
      },
    );
  }

  for (const marker of [
    "[PROD-VERIFICATION-TEST] Shuttle check",
    "Eleanor Vance",
    "E2E Concierge Audit Test",
    "nightly audit-test run",
    "playwright smoke check",
    "qa-somerset-probe-01",
  ]) {
    assert.deepEqual(
      classifyOperatorInboxSubmission({
        email: "ops-check@realdomain.org",
        notes: marker,
      }),
      {
        classification: "test",
        classificationReason: "qa_probe_marker",
      },
    );
  }

  assert.deepEqual(
    classifyOperatorInboxSubmission({
      email: "sarah.connor@denverfamily.org",
      name: "Sarah Connor",
      notes: "Looking for 8-person shuttle from Downtown Minneapolis to Somerset on July 18.",
    }),
    {
      classification: "genuine",
      classificationReason: "organic_customer_submission",
    },
  );
});

test("106b. /api/admin/operator-inbox enforces fail-closed 401 on unauthenticated GET and POST with zero PII", async () => {
  const prevAdminKey = process.env.ADMIN_ACCESS_KEY;
  process.env.ADMIN_ACCESS_KEY = "unit_test_admin_secret_99123";

  try {
    // 1. Unauthenticated GET -> 401
    const unauthGetRes = await operatorInboxGet(
      new Request("http://localhost/api/admin/operator-inbox?view=all"),
    );
    assert.equal(unauthGetRes.status, 401);
    assert.match(
      unauthGetRes.headers.get("cache-control") || "",
      /no-store/i,
    );
    const unauthGetBody = (await unauthGetRes.json()) as Record<string, unknown>;
    assert.deepEqual(unauthGetBody, { ok: false, error: "Unauthorized" });
    assert.equal("items" in unauthGetBody, false);

    // 2. Wrong header key GET -> 401
    const wrongKeyRes = await operatorInboxGet(
      new Request("http://localhost/api/admin/operator-inbox", {
        headers: { "x-dcc-admin-key": "wrong_secret_value" },
      }),
    );
    assert.equal(wrongKeyRes.status, 401);

    // 3. Unauthenticated POST -> 401
    const unauthPostRes = await operatorInboxPost(
      new Request("http://localhost/api/admin/operator-inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemKey: "dcc:somerset-quote:q1",
          triageStatus: "contacted",
        }),
      }),
    );
    assert.equal(unauthPostRes.status, 401);

    // 4. Valid x-dcc-admin-key header GET -> 200
    const headerAuthRes = await operatorInboxGet(
      new Request("http://localhost/api/admin/operator-inbox?view=genuine", {
        headers: { "x-dcc-admin-key": "unit_test_admin_secret_99123" },
      }),
    );
    assert.equal(headerAuthRes.status, 200);
    const headerAuthBody = (await headerAuthRes.json()) as {
      ok: boolean;
      channelHealth: { dccMxWarning: string };
    };
    assert.equal(headerAuthBody.ok, true);
    assert.match(
      headerAuthBody.channelHealth.dccMxWarning,
      /0 MX records/,
    );

    // 5. Valid ADMIN_SESSION_COOKIE GET -> 200
    const sessionToken = buildAdminSessionValue();
    const cookieAuthRes = await operatorInboxGet(
      new Request("http://localhost/api/admin/operator-inbox?view=all", {
        headers: {
          cookie: `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(sessionToken)}`,
        },
      }),
    );
    assert.equal(cookieAuthRes.status, 200);

    // 6. Rejects untrusted cpPreviewUrl SSRF attempt -> 400
    const badCpUrlRes = await operatorInboxGet(
      new Request(
        "http://localhost/api/admin/operator-inbox?cpPreviewUrl=https://evil.example.com",
        {
          headers: { "x-dcc-admin-key": "unit_test_admin_secret_99123" },
        },
      ),
    );
    assert.equal(badCpUrlRes.status, 400);

    // Confirm allowed CP preview URL pattern passes strict validator
    const goodPreviewCheck = validateCpBaseUrlOverride(
      "https://cruisepromenade-8x7a2b1c-erichroeseler123-bots-projects.vercel.app",
    );
    assert.equal(goodPreviewCheck.valid, true);
  } finally {
    if (prevAdminKey === undefined) {
      delete process.env.ADMIN_ACCESS_KEY;
    } else {
      process.env.ADMIN_ACCESS_KEY = prevAdminKey;
    }
  }
});

test("106c & 106d. Failed notification extraction, CP connector truth, and non-destructive triage overlay", async () => {
  clearInMemoryOperatorTriageForTests();
  const prevCpKey = process.env.CP_ADMIN_API_KEY;
  const prevCpSecret = process.env.DCC_CP_SERVICE_SECRET;
  const prevCpKv = process.env.CP_KV_REST_API_URL;
  delete process.env.CP_ADMIN_API_KEY;
  delete process.env.DCC_CP_SERVICE_SECRET;
  delete process.env.CP_KV_REST_API_URL;

  try {
    const originalFindings: RawFindingRowInput[] = [
      {
        finding_id:
          "control-map:transactional-submission:production:somerset-quote:somerset-quote-1001",
        status: "pending_dispatch",
        owner: "dcc:somerset-quote",
        note: "Somerset quote for Noah Kahan (10 pax)",
        metadata: {
          submissionId: "somerset-quote-1001",
          channel: "somerset-quote",
          environment: "production",
          isTest: false,
          name: "Marcus Holloway",
          email: "marcus@twincitiesgroup.org",
          phone: "612-555-0148",
          artistOrEvent: "Noah Kahan at Somerset",
          concertDate: "2027-07-19",
          pickupCity: "Minneapolis",
          groupSize: 10,
          emailSent: false,
          emailError: "Resend 403: sender domain not verified",
          intendedDestination: "hello@partyatredrocks.com",
          createdAt: "2026-11-10T18:00:00.000Z",
        },
        created_at: "2026-11-10T18:00:00.000Z",
        updated_at: "2026-11-10T18:00:00.000Z",
      },
      {
        finding_id:
          "control-map:factual-error-report:production:fer-2002",
        status: "open",
        owner: "earthos-factual-error-report",
        note: "Factual report on /red-rocks",
        metadata: {
          reportId: "fer-2002",
          pagePath: "/red-rocks",
          disputedClaim: "Lot opening window note",
          explanation: "Upper North opened 2.5h early for sold-out show.",
          contactInfo: "reader@coloradomusic.org",
          submittedAt: "2026-11-10T18:30:00.000Z",
          notificationStatus: "sent",
          intendedDestination: "ops@destinationcommandcenter.com",
        },
        created_at: "2026-11-10T18:30:00.000Z",
        updated_at: "2026-11-10T18:30:00.000Z",
      },
      {
        finding_id:
          "control-map:transactional-submission:production:welcometothedells-inquiry:WTD-INQ-QA99",
        status: "captured",
        owner: "dcc:welcometothedells-inquiry",
        note: "QA test probe",
        metadata: {
          submissionId: "WTD-INQ-QA99",
          channel: "welcometothedells-inquiry",
          environment: "production",
          isTest: false,
          name: "Eleanor Vance",
          email: "eleanor@example.com",
          message: "[PROD-VERIFICATION-TEST] Dells inquiry smoke check",
          emailSent: false,
          createdAt: "2026-11-10T19:00:00.000Z",
        },
        created_at: "2026-11-10T19:00:00.000Z",
        updated_at: "2026-11-10T19:00:00.000Z",
      },
    ];

    // Snapshot original rows to prove zero mutation
    const snapshotBefore = JSON.stringify(originalFindings);

    // 1. Without CP admin key, cpConnectorStatus truthfully reports missing_cp_admin_key
    const missingCpInbox = await getUnifiedOperatorInbox({
      view: "genuine",
      findingsOverride: originalFindings,
      argoLegacyOverride: [],
    });

    assert.equal(missingCpInbox.channelHealth.cpConnectorStatus.connected, false);
    assert.equal(
      missingCpInbox.channelHealth.cpConnectorStatus.reason,
      "missing_cp_admin_key",
    );
    assert.equal(missingCpInbox.kpis.totalStoredCount, 3);
    assert.equal(missingCpInbox.kpis.genuineTotalCount, 2);
    assert.equal(missingCpInbox.kpis.testProbesPreservedCount, 1);
    assert.equal(missingCpInbox.items.length, 2);

    const somersetItem = missingCpInbox.items.find(
      (i) => i.sourceId === "somerset-quote-1001",
    );
    assert.ok(somersetItem);
    assert.equal(somersetItem.notificationStatus, "failed");
    assert.equal(
      somersetItem.failureReason,
      "Resend 403: sender domain not verified",
    );
    assert.equal(
      somersetItem.intendedDestination,
      "hello@partyatredrocks.com",
    );

    // 2. With mocked Cruise Promenade remote feed + admin key, aggregates CP inquiries & notification failures
    const mockCpFetch: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          ok: true,
          namespace: "production",
          inquiries: [
            {
              id: "cp-inq-501",
              contactName: "claire@familyreunioncruise.org",
              name: "Claire Bennett",
              email: "claire@familyreunioncruise.org",
              groupType: "Family Reunion",
              destination: "Alaska Inside Passage",
              sailWindow: "July 2027",
              estimatedGuests: 24,
              createdAt: "2026-11-10T19:30:00.000Z",
              isGenuineLead: true,
              notification: {
                delivered: false,
                channel: "resend",
                destination: "concierge@cruisepromenade.com",
                error: "Resend API 401 unauthorized key",
              },
            },
          ],
          earlyAccessFeedbackSummary: {
            totalCount: 4,
            genuineCount: 1,
            testCount: 3,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );

    const withCpFailedView = await getUnifiedOperatorInbox({
      view: "failed_notifications",
      cpAdminKey: "cp_test_admin_key",
      findingsOverride: originalFindings,
      argoLegacyOverride: [],
      cpFetchOverride: mockCpFetch,
    });

    assert.equal(withCpFailedView.channelHealth.cpConnectorStatus.connected, true);
    assert.equal(withCpFailedView.kpis.totalStoredCount, 4);
    assert.equal(withCpFailedView.kpis.genuineTotalCount, 3);
    assert.ok(
      withCpFailedView.items.some(
        (i) =>
          i.sourceId === "cp-inq-501" &&
          i.notificationStatus === "failed" &&
          i.intendedDestination === "concierge@cruisepromenade.com" &&
          i.failureReason === "Resend API 401 unauthorized key",
      ),
    );

    // 3. Save non-destructive triage overlay on Somerset item and verify original rows are untouched
    const triageSave = await saveOperatorInboxTriageOverlay({
      itemKey: somersetItem.itemKey,
      triageStatus: "contacted",
      operatorNote: "Called Marcus directly; sent Sprinter + van flat quote.",
      updatedBy: "admin:unit-test",
      isTest: true,
    });
    assert.equal(triageSave.ok, true);
    assert.equal(
      triageSave.overlay.findingId,
      buildOperatorTriageFindingId(somersetItem.itemKey),
    );
    assert.ok(
      triageSave.overlay.findingId.startsWith("control-map:operator-triage:"),
    );
    assert.equal(JSON.stringify(originalFindings), snapshotBefore);

    const afterTriage = await getUnifiedOperatorInbox({
      view: "genuine",
      findingsOverride: originalFindings,
      argoLegacyOverride: [],
    });
    const updatedSomerset = afterTriage.items.find(
      (i) => i.sourceId === "somerset-quote-1001",
    );
    assert.ok(updatedSomerset);
    assert.equal(updatedSomerset.triageStatus, "contacted");
    assert.equal(
      updatedSomerset.operatorNote,
      "Called Marcus directly; sent Sprinter + van flat quote.",
    );
    // Needs Triage drops from 2 genuine ("new") down to 1 ("fer-2002" remains "new")
    assert.equal(afterTriage.kpis.needsTriageCount, 1);

    // Check normalizeInquiryNotificationStatus directly for delivered case
    const deliveredCheck = normalizeInquiryNotificationStatus(
      "gosno-dispatch",
      { notificationDelivered: true },
      true,
    );
    assert.equal(deliveredCheck.notificationStatus, "delivered");
    assert.equal(deliveredCheck.intendedDestination, "dispatch@gosno.co");
  } finally {
    clearInMemoryOperatorTriageForTests();
    if (prevCpKey !== undefined) process.env.CP_ADMIN_API_KEY = prevCpKey;
    if (prevCpSecret !== undefined)
      process.env.DCC_CP_SERVICE_SECRET = prevCpSecret;
    if (prevCpKv !== undefined) process.env.CP_KV_REST_API_URL = prevCpKv;
  }
});

test("106e. Clean Funnel Telemetry excludes synthetic GOSNO-WP-OUT-1001 ($349), GOSNO-WP-RT-1002 ($998), and TEST-* seeds without deleting ledger rows", async () => {
  assert.equal(isSyntheticSeedOrderRef("GOSNO-WP-OUT-1001"), true);
  assert.equal(isSyntheticSeedOrderRef("GOSNO-WP-RT-1002"), true);
  assert.equal(isSyntheticSeedOrderRef("TEST-GOSNO-W"), true);
  assert.equal(isSyntheticSeedOrderRef("GOSNO-REAL-2026-8841"), false);
  assert.equal(
    isSyntheticSeedOrTestOutcome({
      providerBookingRef: "GOSNO-WP-OUT-1001",
      isTest: false,
      trafficClass: "production",
    }),
    true,
  );

  const syntheticSeedState: DurableLedgerState = {
    schemaVersion: "dcc-durable-transactional-store/1.0",
    txSequence: 5,
    updatedAt: "2026-11-10T12:00:00.000Z",
    opaqueClicksById: {
      clk_prod_seed_1: {
        clickId: "clk_prod_seed_1",
        handoffId: "hf_seed_1",
        originatingSite: "destinationcommandcenter.com",
        originatingPage: "/transportation/colorado/denver-to-winter-park",
        recommendedOperatorId: "op:gosno",
        provider: "direct",
        productCode: "winter-park-suv",
        trafficClass: "production",
        isTest: false,
        createdAt: "2026-11-06T15:00:00.000Z",
        followedAt: "2026-11-06T15:00:05.000Z",
        reconciledOutcomes: [
          {
            dedupeKey: "direct:GOSNO-WP-OUT-1001:BOOKING_CONFIRMED",
            clickId: "clk_prod_seed_1",
            provider: "direct",
            providerBookingRef: "GOSNO-WP-OUT-1001",
            eventType: "BOOKING_CONFIRMED",
            grossRevenueUsd: 349,
            reconciledAt: "2026-11-06T15:10:00.000Z",
            trafficClass: "production",
            isTest: false,
          },
          {
            dedupeKey: "direct:GOSNO-WP-RT-1002:BOOKING_CONFIRMED",
            clickId: "clk_prod_seed_1",
            provider: "direct",
            providerBookingRef: "GOSNO-WP-RT-1002",
            eventType: "BOOKING_CONFIRMED",
            grossRevenueUsd: 998,
            reconciledAt: "2026-11-06T15:12:00.000Z",
            trafficClass: "production",
            isTest: false,
          },
        ],
      } as unknown as DurableLedgerState["opaqueClicksById"][string],
    },
    opaqueClickIdsByHandoffId: {
      hf_seed_1: "clk_prod_seed_1",
    },
    reconciliationByDedupeKey: {
      "direct:GOSNO-WP-OUT-1001:BOOKING_CONFIRMED": {
        dedupeKey: "direct:GOSNO-WP-OUT-1001:BOOKING_CONFIRMED",
        clickId: "clk_prod_seed_1",
        provider: "direct",
        providerBookingRef: "GOSNO-WP-OUT-1001",
        eventType: "BOOKING_CONFIRMED",
        grossRevenueUsd: 349,
        reconciledAt: "2026-11-06T15:10:00.000Z",
        trafficClass: "production",
        isTest: false,
      },
      "direct:GOSNO-WP-RT-1002:BOOKING_CONFIRMED": {
        dedupeKey: "direct:GOSNO-WP-RT-1002:BOOKING_CONFIRMED",
        clickId: "clk_prod_seed_1",
        provider: "direct",
        providerBookingRef: "GOSNO-WP-RT-1002",
        eventType: "BOOKING_CONFIRMED",
        grossRevenueUsd: 998,
        reconciledAt: "2026-11-06T15:12:00.000Z",
        trafficClass: "production",
        isTest: false,
      },
      "direct:TEST-GOSNO-W:BOOKING_CONFIRMED": {
        dedupeKey: "direct:TEST-GOSNO-W:BOOKING_CONFIRMED",
        clickId: "clk_prod_seed_1",
        provider: "direct",
        providerBookingRef: "TEST-GOSNO-W",
        eventType: "BOOKING_CONFIRMED",
        grossRevenueUsd: 349,
        reconciledAt: "2026-11-06T15:15:00.000Z",
        trafficClass: "test",
        isTest: true,
      },
    },
    funnelVisitorsById: {},
    placementApprovalsById: {},
    stewardReviewCasesById: {},
    stewardVehiclePatchesById: {},
    stewardPublicTimeline: [],
  };

  const reportOnlySeeds = await buildUnifiedPortfolioFunnelReport({
    windowPreset: "28d",
    nowIso: "2026-11-10T20:00:00.000Z",
    ledgerStateOverride: syntheticSeedState,
  });

  // Production revenue & confirmed bookings must be $0 / 0 when only synthetic seeds exist
  assert.equal(reportOnlySeeds.totals.ownedGrossSalesUsd, 0);
  assert.equal(reportOnlySeeds.totals.confirmedBookingsCount, 0);
  assert.equal(
    reportOnlySeeds.reconciliation.settlementsAndAffiliateOutcomes
      .ownedGrossSalesUsd,
    0,
  );
  assert.match(
    reportOnlySeeds.reconciliation.settlementsAndAffiliateOutcomes.explanation,
    /Excluded 3 synthetic test seed fixtures.*GOSNO-WP-OUT-1001 \$349.*GOSNO-WP-RT-1002 \$998/,
  );

  // Underlying ledger records remain 100% preserved
  assert.equal(
    Object.keys(syntheticSeedState.reconciliationByDedupeKey).length,
    3,
  );

  // Verify a genuine production booking IS still counted accurately alongside excluded seeds
  const stateWithRealBooking: DurableLedgerState = {
    ...syntheticSeedState,
    reconciliationByDedupeKey: {
      ...syntheticSeedState.reconciliationByDedupeKey,
      "direct:GOSNO-REAL-2026-8841:BOOKING_CONFIRMED": {
        dedupeKey: "direct:GOSNO-REAL-2026-8841:BOOKING_CONFIRMED",
        clickId: "clk_prod_seed_1",
        provider: "direct",
        providerBookingRef: "GOSNO-REAL-2026-8841",
        eventType: "BOOKING_CONFIRMED",
        grossRevenueUsd: 449,
        reconciledAt: "2026-11-09T16:00:00.000Z",
        trafficClass: "production",
        isTest: false,
      },
    },
  };

  const reportWithReal = await buildUnifiedPortfolioFunnelReport({
    windowPreset: "28d",
    nowIso: "2026-11-10T20:00:00.000Z",
    ledgerStateOverride: stateWithRealBooking,
  });
  assert.equal(reportWithReal.totals.ownedGrossSalesUsd, 449);
  assert.equal(reportWithReal.totals.confirmedBookingsCount, 1);
});

test("106f. /admin/logout ignores Next.js RSC/link prefetch requests so unlocking /admin/inbox never self-invalidates session", async () => {
  const prefetchRes = await adminLogoutGet(
    new NextRequest("https://destinationcommandcenter.com/admin/logout?_rsc=abc12", {
      headers: { "next-router-prefetch": "1" },
    }),
  );
  assert.equal(prefetchRes.status, 204);
  assert.equal(prefetchRes.headers.get("set-cookie"), null);

  const realLogoutRes = await adminLogoutGet(
    new NextRequest("https://destinationcommandcenter.com/admin/logout"),
  );
  assert.equal(realLogoutRes.status, 307);
  assert.match(
    realLogoutRes.headers.get("set-cookie") || "",
    new RegExp(`${ADMIN_SESSION_COOKIE}=;.*Max-Age=0`),
  );
});
