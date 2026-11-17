import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import { NextRequest } from "next/server";

import { ADMIN_SESSION_COOKIE, buildAdminSessionValue } from "@/lib/adminAccess";
import {
  GET as getReconcileImport,
  POST as postReconcileImport,
} from "@/app/api/admin/commerce/reconcile-import/route";
import {
  GET as getCommerceOutcomes,
  POST as postCommerceOutcomes,
} from "@/app/api/v1/commerce/outcomes/route";
import DirectOperatorsPartnerPage from "@/app/partners/direct-operators/page";
import CommissionReconcilePanel from "@/app/admin/CommissionReconcilePanel";
import {
  AUTO_INVOICE_DISPATCH_ENABLED,
  AUTO_OUTREACH_DISPATCH_ENABLED,
  JUNEAU_TOURS_ONBOARDING_REFERENCE,
  OPERATOR_MOR_RECONCILIATION_GOVERNANCE,
  SOUTHEAST_ALASKA_OPERATOR_ONBOARDING_KITS,
  THREE_MARKET_DIRECT_OPERATOR_PITCH_KITS,
  createCommercialHandoff,
  evaluateOperatorMorSettlementLedger,
  getTransactionRouteModel,
  listCommercialOutcomes,
} from "@/lib/dcc/commerce";

test("Gate 1 & 2: Settlement framing is provider-report/API reconciliation (not automatic real-time); clicks remain $0 and no auto-invoicing/outreach exists", async () => {
  assert.equal(
    OPERATOR_MOR_RECONCILIATION_GOVERNANCE.reconciliationMechanism,
    "provider_report_or_authorized_api_reconciliation",
  );
  assert.equal(
    OPERATOR_MOR_RECONCILIATION_GOVERNANCE.automaticRealTimeOutcomeKnowledge,
    false,
  );
  assert.equal(AUTO_INVOICE_DISPATCH_ENABLED, false);
  assert.equal(AUTO_OUTREACH_DISPATCH_ENABLED, false);

  const directRoute = getTransactionRouteModel("dcc_sourced_direct_10pct");
  assert.equal(directRoute.liveAuthorizedExternalSupplierCount, 1);

  // Verify outbound click / handoff carries $0 commission and clickIsBooking === false
  const handoff = await createCommercialHandoff({
    originatingSite: "lastfrontiershoreexcursions.com",
    targetSite: "juneauwhalewatch.rezgo.com",
    provider: "direct",
    providerAccount: "dccjuneau10",
    productCode: "5857P23",
    productTitle: "Juneau Whale Watch Tour",
    productDestinationUrl:
      "https://juneauwhalewatch.rezgo.com/details/31703/juneau-whale-watch-tour/31703/2027-07-15?refid=dccjuneau10",
    intendedDate: "2027-07-15",
    partySize: 2,
    metadata: { isQaTraffic: true },
  });
  assert.equal(handoff.outcomeState.clickIsBooking, false);
  assert.equal(handoff.outcomeState.status, "click_recorded_outcome_unknown");
  assert.equal(handoff.outcomeState.bookingOutcome, "unknown");
  assert.equal(handoff.outcomeState.commissionReconciliation, "unknown");

  // Verify UI copy truthfully states provider-report/API reconciliation & no automatic real-time outcome knowledge
  const panelHtml = renderToStaticMarkup(React.createElement(CommissionReconcilePanel));
  assert.match(panelHtml, /Provider-Report \/ API Reconciliation/);
  assert.match(panelHtml, /No Automatic Real-Time Outcome Claim/);
  assert.match(panelHtml, /No Auto-Invoicing/);

  const partnerPageHtml = renderToStaticMarkup(
    React.createElement(DirectOperatorsPartnerPage),
  );
  assert.match(partnerPageHtml, /never claims automatic real-time outcome knowledge/);
  assert.match(partnerPageHtml, /no automatic invoices/);
  assert.match(partnerPageHtml, /Juneau Tours &amp; Whale Watch/);
});

test("Gates 3, 4, 5 & 6: Pending/confirmed=$0, completed=10%/5%, partial/full refunds/cancellations/disputes/chargebacks adjust or reverse, duplicate immunity, and auditable history", () => {
  const events = [
    // 1. Pending / Confirmed pre-sail -> $0 invoiceable
    {
      outcomeId: "out_audit_1001_a",
      sourceProvenance: "partner_csv_reconcile_import",
      reporterClientId: "admin:owner",
      importFormat: "csv",
      providerBookingRef: "RZG-JT-1001",
      providerAccountOrRefId: "dccjuneau10",
      productCode: "5857P23",
      serviceDate: "2027-07-15",
      rawStatusOrEventType: "confirmed",
      grossAmountUsd: 358,
      recordedAt: "2026-11-17T10:00:00Z",
    },
    // Exact duplicate of 1001 -> must NOT double-count
    {
      outcomeId: "out_audit_1001_a",
      sourceProvenance: "partner_csv_reconcile_import",
      reporterClientId: "admin:owner",
      importFormat: "csv",
      providerBookingRef: "RZG-JT-1001",
      providerAccountOrRefId: "dccjuneau10",
      productCode: "5857P23",
      serviceDate: "2027-07-15",
      rawStatusOrEventType: "confirmed",
      grossAmountUsd: 358,
      recordedAt: "2026-11-17T10:00:00Z",
    },
    // 2. Completed non-refunded direct booking -> 10% ($39.80) invoiceable (duplicate without outcomeId also tested)
    {
      providerBookingRef: "RZG-JT-1002",
      providerAccountOrRefId: "dccjuneau10",
      productCode: "5857P22",
      serviceDate: "2027-07-10",
      rawStatusOrEventType: "completed",
      grossAmountUsd: 398,
      recordedAt: "2027-07-10T22:00:00Z",
    },
    {
      providerBookingRef: "RZG-JT-1002",
      providerAccountOrRefId: "dccjuneau10",
      productCode: "5857P22",
      serviceDate: "2027-07-10",
      rawStatusOrEventType: "completed",
      grossAmountUsd: 398,
      recordedAt: "2027-07-10T22:05:00Z",
    },
    // 3. Completed Cruise Promenade planner-distributed booking -> 5% ($15.80) invoiceable
    {
      providerBookingRef: "RZG-JT-1003",
      providerAccountOrRefId: "dccjuneau10",
      productCode: "5857SHUTTLE",
      serviceDate: "2027-07-11",
      rawStatusOrEventType: "fulfilled",
      grossAmountUsd: 316,
      distributionRoute: "machine_or_planner_5pct" as const,
      recordedAt: "2027-07-11T21:00:00Z",
    },
    // 4. Completed with partial refund ($400 gross - $100 refund = $300 net -> $30.00 invoiceable)
    {
      outcomeId: "out_audit_1004_completed",
      sourceProvenance: "authorized_operational_evidence",
      reporterClientId: "admin:owner",
      importFormat: "csv",
      providerBookingRef: "RZG-JT-1004",
      providerAccountOrRefId: "dccjuneau10",
      productCode: "5857P23",
      serviceDate: "2027-07-12",
      rawStatusOrEventType: "completed",
      grossAmountUsd: 400,
      recordedAt: "2027-07-12T20:00:00Z",
    },
    {
      outcomeId: "out_audit_1004_partial_refund",
      sourceProvenance: "authorized_operational_evidence",
      reporterClientId: "admin:owner",
      importFormat: "csv",
      providerBookingRef: "RZG-JT-1004",
      providerAccountOrRefId: "dccjuneau10",
      productCode: "5857P23",
      serviceDate: "2027-07-12",
      rawStatusOrEventType: "partial_refund",
      grossAmountUsd: 400,
      refundedAmountUsd: 100,
      recordedAt: "2027-07-13T12:00:00Z",
    },
    // 5. Disputed & Cancelled bookings -> $0 commission
    {
      providerBookingRef: "RZG-JT-1005A",
      providerAccountOrRefId: "dccjuneau10",
      productCode: "5857P23",
      serviceDate: "2027-07-14",
      rawStatusOrEventType: "cancelled",
      grossAmountUsd: 358,
      recordedAt: "2027-07-14T15:00:00Z",
    },
    {
      providerBookingRef: "RZG-JT-1005B",
      providerAccountOrRefId: "dccjuneau10",
      productCode: "5857P23",
      serviceDate: "2027-07-14",
      rawStatusOrEventType: "disputed",
      grossAmountUsd: 358,
      recordedAt: "2027-07-14T16:00:00Z",
    },
    // 6. Full lifecycle correction history: confirmed -> completed -> settled ($35.80 paid) -> chargeback ($35.80 credit due!)
    {
      outcomeId: "out_1006_1_confirmed",
      sourceProvenance: "partner_csv",
      reporterClientId: "admin:owner",
      importFormat: "csv",
      providerBookingRef: "RZG-JT-1006",
      providerAccountOrRefId: "dccjuneau10",
      productCode: "5857P23",
      serviceDate: "2027-07-01",
      rawStatusOrEventType: "confirmed",
      grossAmountUsd: 358,
      recordedAt: "2027-06-15T12:00:00Z",
    },
    {
      outcomeId: "out_1006_2_completed",
      sourceProvenance: "partner_csv",
      reporterClientId: "admin:owner",
      importFormat: "csv",
      providerBookingRef: "RZG-JT-1006",
      providerAccountOrRefId: "dccjuneau10",
      productCode: "5857P23",
      serviceDate: "2027-07-01",
      rawStatusOrEventType: "completed",
      grossAmountUsd: 358,
      recordedAt: "2027-07-01T21:00:00Z",
    },
    {
      outcomeId: "out_1006_3_settled",
      sourceProvenance: "invoice_reconciliation",
      reporterClientId: "admin:owner",
      importFormat: "json",
      providerBookingRef: "RZG-JT-1006",
      providerAccountOrRefId: "dccjuneau10",
      productCode: "5857P23",
      serviceDate: "2027-07-01",
      rawStatusOrEventType: "settled",
      grossAmountUsd: 358,
      paidCommissionAmountUsd: 35.8,
      recordedAt: "2027-07-05T18:00:00Z",
    },
    {
      outcomeId: "out_1006_4_chargeback",
      sourceProvenance: "provider_chargeback_notice",
      reporterClientId: "admin:owner",
      importFormat: "csv",
      providerBookingRef: "RZG-JT-1006",
      providerAccountOrRefId: "dccjuneau10",
      productCode: "5857P23",
      serviceDate: "2027-07-01",
      rawStatusOrEventType: "chargeback",
      grossAmountUsd: 358,
      recordedAt: "2027-07-20T09:00:00Z",
    },
  ];

  const ledger = evaluateOperatorMorSettlementLedger({
    operatorId: "operator:juneau-tours-and-whale-watch",
    operatorName: "Juneau Tours & Whale Watch",
    events,
  });

  assert.equal(ledger.totalTrackedBookings, 7);
  assert.equal(ledger.bookedPendingCompletionCount, 1);
  assert.equal(ledger.completedInvoiceableCount, 2);
  assert.equal(ledger.partiallyRefundedAdjustedCount, 1);
  assert.equal(ledger.zeroFeeNonCommissionableCount, 3);
  assert.equal(ledger.postCompletionReversalCount, 2);

  assert.equal(ledger.estimatedPendingCommissionUsd, 35.8);
  assert.equal(ledger.totalEarnedInvoiceableCommissionUsd, 85.6);
  assert.equal(ledger.unpaidInvoiceableBalanceUsd, 85.6);
  assert.equal(ledger.creditOrReversalDueToOperatorUsd, 35.8);
  assert.equal(ledger.netBalanceDueToDccUsd, 49.8);

  // Verify auditable source, import time, and 4-step correction history on RZG-JT-1006
  const pos1006 = ledger.positions.find(
    (p) => p.providerBookingRef === "RZG-JT-1006",
  )!;
  assert.equal(pos1006.eventHistoryCount, 4);
  assert.equal(pos1006.nonCommissionableReason, "chargeback");
  assert.deepEqual(
    pos1006.auditHistory.map((h) => ({
      outcomeId: h.outcomeId,
      source: h.sourceProvenance,
      stage: h.mappedStage,
      importedAt: h.importedAt,
    })),
    [
      {
        outcomeId: "out_1006_1_confirmed",
        source: "partner_csv",
        stage: "pending_or_confirmed",
        importedAt: "2027-06-15T12:00:00Z",
      },
      {
        outcomeId: "out_1006_2_completed",
        source: "partner_csv",
        stage: "completed",
        importedAt: "2027-07-01T21:00:00Z",
      },
      {
        outcomeId: "out_1006_3_settled",
        source: "invoice_reconciliation",
        stage: "settled_paid",
        importedAt: "2027-07-05T18:00:00Z",
      },
      {
        outcomeId: "out_1006_4_chargeback",
        source: "provider_chargeback_notice",
        stage: "non_commissionable",
        importedAt: "2027-07-20T09:00:00Z",
      },
    ],
  );
});

test("Gates 7, 8 & 9: Reconciliation routes require owner/API authentication, block duplicate CSV imports, and scrub all customer PII", async () => {
  const prevAdminKey = process.env.ADMIN_ACCESS_KEY;
  process.env.ADMIN_ACCESS_KEY = "isolated-dcc-settlement-secret";

  try {
    // 1. Unauthenticated GET & POST on /api/admin/commerce/reconcile-import MUST return 401
    const unauthGet = await getReconcileImport(
      new NextRequest(
        "https://www.destinationcommandcenter.com/api/admin/commerce/reconcile-import",
      ),
    );
    assert.equal(unauthGet.status, 401);

    const unauthPost = await postReconcileImport(
      new NextRequest(
        "https://www.destinationcommandcenter.com/api/admin/commerce/reconcile-import",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ format: "csv", payload: "booking_ref\nABC-1" }),
        },
      ),
    );
    assert.equal(unauthPost.status, 401);

    // 2. Unauthenticated enumeration / write on /api/v1/commerce/outcomes MUST return 401/400
    const unauthOutcomesGet = await getCommerceOutcomes(
      new NextRequest("https://www.destinationcommandcenter.com/api/v1/commerce/outcomes"),
    );
    assert.equal(unauthOutcomesGet.status, 401);

    const unauthOutcomesPost = await postCommerceOutcomes(
      new NextRequest("https://www.destinationcommandcenter.com/api/v1/commerce/outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "direct", providerBookingRef: "RZG-1" }),
      }),
    );
    assert.ok(unauthOutcomesPost.status === 401 || unauthOutcomesPost.status === 403 || unauthOutcomesPost.status === 400);

    // 3. Authenticated owner CSV import WITH synthetic customer PII columns -> PII stripped, duplicate second import skipped!
    const adminCookie = `${ADMIN_SESSION_COOKIE}=${buildAdminSessionValue("isolated-dcc-settlement-secret")}`;
    const csvWithPii = [
      "trans_num,provider,refid,product_code,gross_usd,commission_usd,status,booked_date,party_size,customer_name,customer_email,phone,traveler_id",
      "RZG-ISO-2027-801,rezgo,dccjuneau10,5857P23,358.00,35.80,confirmed,2027-07-15,2,Jane Example,jane.example@test.invalid,+1-907-555-0199,jane.example@test.invalid",
      "RZG-ISO-2027-802,rezgo,dccjuneau10,5857P22,398.00,39.80,completed,2027-07-16,2,John Sample,john.sample@test.invalid,+1-907-555-0188,ctx_opaque_02",
      "RZG-ISO-2027-803,rezgo,dccjuneau10,5857SHUTTLE,158.00,15.80,refunded,2027-07-17,2,Pat Guest,pat.guest@test.invalid,+1-907-555-0177,",
    ].join("\n");

    const importReq1 = new NextRequest(
      "https://www.destinationcommandcenter.com/api/admin/commerce/reconcile-import",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({
          format: "csv",
          defaultProvider: "direct",
          payload: csvWithPii,
        }),
      },
    );
    const res1 = await postReconcileImport(importReq1);
    assert.equal(res1.status, 200);
    const text1 = await res1.text();
    const json1 = JSON.parse(text1) as {
      ok: boolean;
      importedCount: number;
      duplicateCount: number;
      importedCommissionUsd: number;
      reconciliationGovernance: typeof OPERATOR_MOR_RECONCILIATION_GOVERNANCE;
      operatorMorSettlementSummary: {
        totalEarnedInvoiceableCommissionUsd: number;
        positions: Array<{
          providerBookingRef: string;
          lifecycleStage: string;
          invoiceableCommissionUsd: number;
          auditHistory: Array<{ sourceProvenance: string; importFormat: string | null }>;
        }>;
      };
    };

    assert.equal(json1.ok, true);
    assert.equal(json1.importedCount, 3);
    assert.equal(json1.duplicateCount, 0);
    assert.equal(json1.importedCommissionUsd, 0);
    assert.equal(
      json1.reconciliationGovernance.reconciliationMechanism,
      "provider_report_or_authorized_api_reconciliation",
    );
    assert.equal(
      json1.reconciliationGovernance.automaticRealTimeOutcomeKnowledge,
      false,
    );

    // Zero customer PII in response JSON or stored outcomes
    assert.doesNotMatch(
      text1,
      /Jane Example|John Sample|Pat Guest|test\.invalid|555-0199|555-0188|555-0177/i,
    );
    const storedOutcomes = await listCommercialOutcomes({
      provider: "direct",
      limit: 50,
    });
    assert.doesNotMatch(
      JSON.stringify(storedOutcomes),
      /Jane Example|John Sample|Pat Guest|test\.invalid|555-0199|555-0188|555-0177/i,
    );

    const earnedAfterFirstImport =
      json1.operatorMorSettlementSummary.totalEarnedInvoiceableCommissionUsd;
    const pos802 = json1.operatorMorSettlementSummary.positions.find(
      (p) => p.providerBookingRef === "RZG-ISO-2027-802",
    );
    assert.equal(pos802?.lifecycleStage, "completed_invoiceable");
    assert.equal(pos802?.invoiceableCommissionUsd, 39.8);
    assert.equal(pos802?.auditHistory[0]?.importFormat, "csv");

    // 4. Re-importing the exact same CSV batch -> all 3 rows skipped as duplicates, zero duplicate charges!
    const importReq2 = new NextRequest(
      "https://www.destinationcommandcenter.com/api/admin/commerce/reconcile-import",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({
          format: "csv",
          defaultProvider: "direct",
          payload: csvWithPii,
        }),
      },
    );
    const res2 = await postReconcileImport(importReq2);
    assert.equal(res2.status, 200);
    const json2 = (await res2.json()) as {
      importedCount: number;
      duplicateCount: number;
      operatorMorSettlementSummary: {
        totalEarnedInvoiceableCommissionUsd: number;
      };
    };
    assert.equal(json2.importedCount, 0);
    assert.equal(json2.duplicateCount, 3);
    assert.equal(
      json2.operatorMorSettlementSummary.totalEarnedInvoiceableCommissionUsd,
      earnedAfterFirstImport,
    );
  } finally {
    if (prevAdminKey === undefined) {
      delete process.env.ADMIN_ACCESS_KEY;
    } else {
      process.env.ADMIN_ACCESS_KEY = prevAdminKey;
    }
  }
});

test("Copy-only Juneau Tours onboarding reference & Southeast Alaska templates remain strictly manual-copy (AUTO_OUTREACH_DISPATCH_ENABLED=false)", () => {
  assert.equal(AUTO_OUTREACH_DISPATCH_ENABLED, false);
  assert.equal(THREE_MARKET_DIRECT_OPERATOR_PITCH_KITS.length, 5);
  assert.equal(
    JUNEAU_TOURS_ONBOARDING_REFERENCE.canonicalProfileUrl,
    "https://www.lastfrontiershoreexcursions.com/operators/juneau-tours-and-whale-watch",
  );
  assert.ok(SOUTHEAST_ALASKA_OPERATOR_ONBOARDING_KITS.length >= 4);
  for (const kit of SOUTHEAST_ALASKA_OPERATOR_ONBOARDING_KITS) {
    assert.equal(kit.autoSendForbidden, true);
    assert.match(
      kit.emailBody,
      /lastfrontiershoreexcursions\.com\/operators\/juneau-tours-and-whale-watch/,
    );
  }
});
