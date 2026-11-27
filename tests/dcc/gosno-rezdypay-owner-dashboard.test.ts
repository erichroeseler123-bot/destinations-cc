import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  GOSNO_GROSS_BOOKING_ACCOUNTING_NOTE,
  buildOwnerControlCenterSnapshot,
  fetchDirectMorOwnerSummary,
} from "@/lib/dcc/ownerControlCenter";
import { getDccSiteManifestV1 } from "@/lib/dcc/portfolioNetworkRegistry";
import { resolveCanonicalAnalyticsSite } from "@/lib/dcc/analytics/contract";

const ROOT = process.cwd();

test("GoSno Owner Control Center & Admin UI contain zero stale GoSno Square checkout wording while preserving PARR isolation", async () => {
  const ownerControlCenterSrc = fs.readFileSync(
    path.join(ROOT, "lib/dcc/ownerControlCenter.ts"),
    "utf8",
  );
  const adminPageSrc = fs.readFileSync(
    path.join(ROOT, "app/admin/page.tsx"),
    "utf8",
  );

  assert.doesNotMatch(ownerControlCenterSrc, /square/i);
  assert.doesNotMatch(adminPageSrc, /square/i);

  // Verify admin page renders all RezdyPay /pay checkout failure counters, recent events, and gross-not-profit note
  assert.match(adminPageSrc, /gosno-rezdypay-failures-summary/);
  assert.match(adminPageSrc, /sessionSetupFailedCount/);
  assert.match(adminPageSrc, /paymentFailedCount/);
  assert.match(adminPageSrc, /unmatchedOrderCount/);
  assert.match(adminPageSrc, /stuckPaymentCount/);
  assert.match(adminPageSrc, /gosno-rezdypay-recent-events/);
  assert.match(adminPageSrc, /gosno-accounting-note/);
  assert.match(adminPageSrc, /Gross Booking Value Note \(Not Profit\)/);

  // Verify GoSno manifest & analytics contract reflect RezdyPay /pay checkout without breaking PARR Square configuration
  const gosnoManifest = getDccSiteManifestV1("gosno.co");
  assert.ok(gosnoManifest);
  assert.doesNotMatch(gosnoManifest.consumer_role, /square/i);
  assert.match(gosnoManifest.consumer_role, /RezdyPay \/pay checkout/i);
  assert.equal(
    gosnoManifest.commercial_channels[0]?.channel_id,
    "gosno-direct-rezdypay-checkout",
  );
  assert.equal(gosnoManifest.commercial_channels[0]?.provider, "rezdy");

  const parrManifest = getDccSiteManifestV1("partyatredrocks.com");
  assert.ok(parrManifest);
  assert.equal(parrManifest.commercial_channels[0]?.channel_id, "parr-direct-checkout");
  assert.equal(parrManifest.commercial_channels[0]?.provider, "direct_provider");

  const parrAnalytics = resolveCanonicalAnalyticsSite("partyatredrocks.com").entry;
  assert.ok(parrAnalytics);
  assert.match(parrAnalytics.redirectAndSourceNotes, /square/i);

  const gosnoAnalytics = resolveCanonicalAnalyticsSite("gosno.co").entry;
  assert.ok(gosnoAnalytics);
  assert.doesNotMatch(gosnoAnalytics.redirectAndSourceNotes, /square/i);
  assert.match(gosnoAnalytics.redirectAndSourceNotes, /RezdyPay \/pay/i);

  // Verify runtime completeMoneyLoop strings in armed cron mode have zero Square references
  const armedSnapshot = await buildOwnerControlCenterSnapshot({
    env: {
      DCC_DISABLE_NEON_COMMERCE: "1",
      DCC_INTERNAL_API_SECRET: "gosno-test-sec",
    },
    fetchImpl: async (input) => {
      const url = String(input);
      if (url.includes("gosno.co/api/internal/owner-summary")) {
        return new Response(
          JSON.stringify({
            metrics28d: {
              paidBookings: 3,
              paidGrossSalesUsd: 1497,
              provisioningExceptions: 0,
              needsReviewOrders: 0,
            },
            rezdyHealth: {
              cronSchedulesEnabled: true,
              status: "healthy",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response("Not Found", { status: 404 });
    },
  });

  const moneyLoop = armedSnapshot.dailyBusinessCockpit.bookingsNeedingAttention.completeMoneyLoop;
  assert.equal(
    moneyLoop.marcosManualOrderIsolationRule,
    "Marcos's manual order stays separate and is never counted as an automated RezdyPay → Rezdy checkout test.",
  );
  assert.doesNotMatch(moneyLoop.statusSummary, /square/i);
  assert.match(
    moneyLoop.statusSummary,
    /RezdyPay \/pay checkout → Rezdy order\/webhook & reconciliation/,
  );
  // Upstream omitted rezdyPayCheckoutFailures28d & accountingNote -> clean null fallback + default gross accounting note
  assert.equal(armedSnapshot.triageQueue.gosnoOps.rezdyPayCheckoutFailures28d, null);
  assert.equal(armedSnapshot.triageQueue.gosnoOps.accountingNote, null);
  assert.equal(moneyLoop.accountingNote, GOSNO_GROSS_BOOKING_ACCOUNTING_NOTE);
});

test("fetchDirectMorOwnerSummary & buildOwnerControlCenterSnapshot parse rezdyPayCheckoutFailures28d, scrub PII/payment tokens, surface triage alerts, and enforce gross-not-profit accounting disclosures", async () => {
  const upstreamAccountingNote =
    "Local gross booking value from completed GoSno checkouts (not verified provider settlement, payout reconciliation, or net profit; excludes payment processing fees, dispatch costs, refunds, and taxes).";

  const mockGoSnoPayload = {
    metrics28d: {
      testRecordsExcluded: { bookings28d: 2, quotes28d: 1, activeHolds: 0 },
      genuineBookingsTotal: 6,
      paidBookings: 5,
      confirmedUnpaidBookings: 1,
      openQuoteRequests: 2,
      activeVehicleHolds: 0,
      awaitingBalanceOrders: 0,
      paidGrossSalesUsd: 2745,
      confirmedUnpaidGrossUsd: 549,
      awaitingBalanceGrossUsd: 0,
      netOperatingRevenueUsd: null,
      provisioningExceptions: 0,
      needsReviewOrders: 1,
      accountingNote: upstreamAccountingNote,
      rezdyPayCheckoutFailures28d: {
        sessionSetupFailedCount: 1,
        paymentFailedCount: 2,
        unmatchedOrderCount: 150,
        stuckPaymentCount: 1,
        totalCount: 4,
        recentEvents: [
          {
            id: "fail_setup_1",
            eventTime: "2026-11-26T14:10:00.000Z",
            category: "session_setup_failed",
            eventType: "REZDY_SESSION_SETUP_FAILED",
            stage: "pay_session_init",
            stageLabel: "RezdyPay /pay Session Setup",
            safeErrorSummary:
              "Upstream session init HTTP 502 for guest@example.com payment_token=tok_live_secret_99887766",
            bookingReference: "GS-20261126-1001",
            orderReference: null,
            resellerReference: "RES-1001",
            routeSummary: "DEN -> Vail (Private SUV)",
          },
          {
            id: "fail_pay_2",
            eventTime: "2026-11-26T14:25:00.000Z",
            category: "payment_failed",
            eventType: "REZDY_PAYMENT_FAILED",
            stage: "pay_capture",
            stageLabel: "RezdyPay /pay Payment Capture",
            safeErrorSummary:
              "Issuer declined card 4111 1111 1111 4242 for +1-303-555-0144 Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9_super_long_secret_token_value",
            bookingReference: "GS-20261126-1002",
            orderReference: "ORD-8802",
            resellerReference: null,
            routeSummary: "DEN -> Breckenridge",
          },
          {
            id: "fail_unmatched_3",
            eventTime: "2026-11-26T15:00:00.000Z",
            category: "unmatched_order",
            eventType: "REZDY_UNMATCHED_ORDER",
            stage: "webhook_reconcile",
            stageLabel: "Rezdy Order/Webhook Match",
            safeErrorSummary: "Webhook order reference did not match local checkout session",
            bookingReference: null,
            orderReference: "ORD-UNMATCHED-77",
            resellerReference: "RES-UNMATCHED-77",
            routeSummary: null,
          },
          {
            id: "fail_stuck_4",
            eventTime: "2026-11-26T15:30:00.000Z",
            category: "stuck_payment",
            eventType: "RECONCILIATION_STUCK_PAYMENT",
            stage: "reconcile_lease",
            stageLabel: "Expired REZDY_IN_PROGRESS Lease",
            safeErrorSummary: "Checkout lease expired while awaiting Rezdy confirmation",
            bookingReference: "GS-20261126-1004",
            orderReference: null,
            resellerReference: null,
            routeSummary: "DEN -> Winter Park",
          },
        ],
      },
    },
    rezdyHealth: {
      cronSchedulesEnabled: true,
      status: "degraded",
      failedCount: 0,
    },
  };

  const mockFetch: typeof fetch = async (input) => {
    const url = String(input);
    if (url.includes("gosno.co/api/internal/owner-summary")) {
      return new Response(JSON.stringify(mockGoSnoPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("Not Found", { status: 404 });
  };

  // 1. Direct fetchDirectMorOwnerSummary verification + strict PII/token scrubbing
  const directGosno = await fetchDirectMorOwnerSummary({
    siteId: "gosno",
    siteName: "GoSno",
    endpoint: "https://gosno.co/api/internal/owner-summary",
    opsHref: "https://gosno.co/admin/operations-queue",
    secret: "gosno-sec",
    env: { DCC_DISABLE_NEON_COMMERCE: "1" },
    fetchImpl: mockFetch,
  });

  assert.equal(directGosno.status, "live");
  assert.equal(directGosno.accountingNote, upstreamAccountingNote);
  assert.ok(directGosno.rezdyPayCheckoutFailures28d);
  assert.equal(directGosno.rezdyPayCheckoutFailures28d.sessionSetupFailedCount, 1);
  assert.equal(directGosno.rezdyPayCheckoutFailures28d.paymentFailedCount, 2);
  assert.equal(directGosno.rezdyPayCheckoutFailures28d.unmatchedOrderCount, 150);
  assert.equal(directGosno.rezdyPayCheckoutFailures28d.stuckPaymentCount, 1);
  assert.equal(directGosno.rezdyPayCheckoutFailures28d.totalCount, 4);
  assert.equal(directGosno.rezdyPayCheckoutFailures28d.recentEvents.length, 4);

  const serializedDirect = JSON.stringify(directGosno);
  assert.doesNotMatch(serializedDirect, /guest@example\.com/);
  assert.doesNotMatch(serializedDirect, /tok_live_secret_99887766/);
  assert.doesNotMatch(serializedDirect, /4111 1111 1111 4242/);
  assert.doesNotMatch(serializedDirect, /303-555-0144/);
  assert.doesNotMatch(serializedDirect, /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/);

  // Safe operational references and event types remain intact
  assert.equal(
    directGosno.rezdyPayCheckoutFailures28d.recentEvents[0].eventType,
    "REZDY_SESSION_SETUP_FAILED",
  );
  assert.equal(
    directGosno.rezdyPayCheckoutFailures28d.recentEvents[0].bookingReference,
    "GS-20261126-1001",
  );
  assert.equal(
    directGosno.rezdyPayCheckoutFailures28d.recentEvents[1].eventType,
    "REZDY_PAYMENT_FAILED",
  );
  assert.equal(
    directGosno.rezdyPayCheckoutFailures28d.recentEvents[2].eventType,
    "REZDY_UNMATCHED_ORDER",
  );
  assert.equal(
    directGosno.rezdyPayCheckoutFailures28d.recentEvents[3].eventType,
    "RECONCILIATION_STUCK_PAYMENT",
  );

  // 2. Full snapshot surfaces RezdyPay failures in Q2 completeMoneyLoop, Q3 automationHealth, and triageQueue
  const snapshot = await buildOwnerControlCenterSnapshot({
    env: {
      DCC_DISABLE_NEON_COMMERCE: "1",
      DCC_INTERNAL_API_SECRET: "gosno-sec",
    },
    fetchImpl: mockFetch,
  });

  const q2Loop = snapshot.dailyBusinessCockpit.bookingsNeedingAttention.completeMoneyLoop;
  assert.match(q2Loop.statusSummary, /4 RezdyPay \/pay checkout failure event\(s\) in 28d/);
  assert.match(q2Loop.statusSummary, /session setup 1/);
  assert.match(q2Loop.statusSummary, /payment 2/);
  assert.match(q2Loop.statusSummary, /150 unmatched reconciliation event records/);
  assert.match(q2Loop.statusSummary, /stuck payment 1/);
  assert.equal(q2Loop.rezdyPayCheckoutFailures28d?.totalCount, 4);
  assert.equal(q2Loop.accountingNote, upstreamAccountingNote);

  const q3 = snapshot.dailyBusinessCockpit.automationHealth;
  assert.equal(q3.gosnoRezdyPayFailureCount28d, 4);
  assert.equal(q3.statusBadge, "Action Needed");
  assert.ok(q3.totalAutomationFailures >= 4);

  const rezdypayTriage = snapshot.triageQueue.items.find(
    (item) => item.id === "gosno-rezdypay-checkout-failures",
  );
  assert.ok(rezdypayTriage, "Expected dedicated gosno-rezdypay-checkout-failures triage alert");
  assert.equal(rezdypayTriage.priority, "high");
  assert.match(rezdypayTriage.countOrBadge, /4 \/pay failure\(s\)/);
  assert.match(rezdypayTriage.detail, /REZDY_SESSION_SETUP_FAILED/);

  // 3. Gross booking value stays explicitly labeled as gross (not profit) and states provider payout/refund reconciliation is unverified
  const grossRow = snapshot.connectedFunnel28d.strictSeparation10Way28d.find(
    (r) => r.key === "gross_merchant_sales",
  );
  assert.ok(grossRow, "Expected stable gross_merchant_sales row key");
  assert.equal(grossRow.headlineValue, "$2,745");
  assert.match(grossRow.gosnoBreakdown, /local gross booking value: \$2,745/i);
  assert.match(grossRow.gosnoBreakdown, /gross, not profit/i);
  assert.match(
    grossRow.gosnoBreakdown,
    /provider payout\/settlement & refund reconciliation unverified/i,
  );
  assert.match(
    grossRow.antiConflationDisclosure,
    /Gross Merchant Sales — Not Profit; Excludes Operating Costs, Driver Pay, Processor Fees & Refunds/,
  );
  assert.match(
    grossRow.antiConflationDisclosure,
    /provider payout\/settlement reconciliation and refunds are not verified here/i,
  );

  assert.equal(
    snapshot.connectedFunnel28d.strictlySeparatedRevenue.directMorGrossTrack.gosnoAccountingNote,
    upstreamAccountingNote,
  );
  assert.equal(
    snapshot.connectedFunnel28d.strictlySeparatedRevenue.directMorGrossTrack
      .netOperatingRevenueStatusLabel,
    "Unreconciled in app DB",
  );
});
