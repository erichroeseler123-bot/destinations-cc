import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

process.env.DCC_ISOLATED_TEST_DB = "1";
const tempStoreDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "dcc-five-moves-test-"),
);
process.env.DCC_DURABLE_STORE_PATH = path.join(
  tempStoreDir,
  "durable-ledger.json",
);

import { POST as jfdInternalConciergeReplyPost } from "../apps/juneauflightdeck/app/api/internal/concierge-reply/route";
import { buildJfdViatorHandoffUrl } from "../apps/juneauflightdeck/lib/viator/handoff";
import { AFFILIATE_CATALOG } from "../apps/last-frontier-shore-excursions/lib/affiliate/catalog";
import { buildAffiliateUrl } from "../apps/last-frontier-shore-excursions/lib/affiliate/links";
import { getTrackedTourUrl } from "../apps/last-frontier-shore-excursions/lib/alaska-ships";
import {
  GET as reconcileImportGet,
  POST as reconcileImportPost,
} from "../app/api/admin/commerce/reconcile-import/route";
import {
  POST as adminInboxReplyPost,
  resetConciergeReplyMemoryForTests,
} from "../app/api/admin/inbox/reply/route";
import { POST as directOperatorApplyPost } from "../app/api/partners/direct-operators/apply/route";
import {
  createCommercialHandoff,
  getSharedHandoffLedgerSummary,
  HELD_COMMERCIAL_SKUS,
  listPartnerBoundaryReviewItems,
  resetCommercialMemoryStoreForTests,
  resetOpaqueAttributionLedgerForTests,
  UNHELD_VERIFIED_SKUS,
} from "../lib/dcc/commerce";
import {
  AUTO_OUTREACH_DISPATCH_ENABLED,
  FLAGSHIP_DIRECT_OPERATOR_PITCH_KITS,
  syncAuthorizedBookingToCruisePromenade,
} from "../lib/dcc/commerce/directOperatorActivationKit";
import { buildHydratedConciergePreset } from "../lib/dcc/conciergeReplyPresets";
import { deleteOperatorOnboardingApplicationById } from "../lib/dcc/operatorOnboardingStore";

const REPO_ROOT = path.resolve(__dirname, "..");

function walkFiles(dir: string, exts: Set<string>): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, exts));
    } else if (exts.has(path.extname(entry.name))) {
      results.push(full);
    }
  }
  return results;
}

test.after(() => {
  try {
    fs.rmSync(tempStoreDir, { recursive: true, force: true });
  } catch {
    // ignore cleanup error
  }
});

test("Move 1: JFD internal concierge-reply route enforces constant-time secret, dryRunSandbox, and non-PARR sender", async () => {
  const prevSecret = process.env.DCC_INTERNAL_API_SECRET;
  const prevResend = process.env.RESEND_API_KEY;
  const prevFrom = process.env.DEPLOY_TEST_EMAIL_FROM;
  const originalFetch = globalThis.fetch;

  try {
    process.env.DCC_INTERNAL_API_SECRET = "super-secret-jfd-relay-token";
    process.env.RESEND_API_KEY = "re_test_jfd_key";
    process.env.DEPLOY_TEST_EMAIL_FROM =
      "Party at Red Rocks <bookings@partyatredrocks.com>";

    // 1. Fail-closed 401 when secret is missing or mismatched
    const unauthRes = await jfdInternalConciergeReplyPost(
      new Request("https://juneauflightdeck.com/api/internal/concierge-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dcc-internal-secret": "wrong-secret",
        },
        body: JSON.stringify({
          to: "guest@example.org",
          subject: "Test",
          text: "Hello",
        }),
      }),
    );
    assert.equal(unauthRes.status, 401);
    assert.equal(unauthRes.headers.get("cache-control"), "no-store");

    // 2. dryRunSandbox overrides recipient to delivered@resend.dev and strips partyatredrocks.com sender
    let capturedResendBody: Record<string, unknown> | null = null;
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedResendBody = JSON.parse(String(init?.body || "{}")) as Record<
        string,
        unknown
      >;
      return new Response(JSON.stringify({ id: "re_sandbox_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const okRes = await jfdInternalConciergeReplyPost(
      new Request("https://juneauflightdeck.com/api/internal/concierge-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dcc-internal-secret": "super-secret-jfd-relay-token",
        },
        body: JSON.stringify({
          to: "realguest@gmail.com",
          subject: "Your Juneau Flight Quote",
          text: "Flight details inside",
          reply_to: "erichroeseler123@gmail.com",
          dryRunSandbox: true,
        }),
      }),
    );
    assert.equal(okRes.status, 200);
    const json = (await okRes.json()) as {
      ok: boolean;
      resendId: string;
      fromUsed: string;
    };
    assert.equal(json.ok, true);
    assert.equal(json.resendId, "re_sandbox_123");
    assert.equal(
      json.fromUsed,
      "Juneau Flight Deck <press@juneauflightdeck.com>",
    );
    assert.ok(!json.fromUsed.includes("partyatredrocks.com"));
    assert.deepEqual(capturedResendBody?.to, ["delivered@resend.dev"]);
    assert.equal(capturedResendBody?.reply_to, "erichroeseler123@gmail.com");
  } finally {
    globalThis.fetch = originalFetch;
    if (prevSecret === undefined) delete process.env.DCC_INTERNAL_API_SECRET;
    else process.env.DCC_INTERNAL_API_SECRET = prevSecret;
    if (prevResend === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = prevResend;
    if (prevFrom === undefined) delete process.env.DEPLOY_TEST_EMAIL_FROM;
    else process.env.DEPLOY_TEST_EMAIL_FROM = prevFrom;
  }
});

test("Move 1: Verified Summer 2027 JFD presets + /api/admin/inbox/reply duplicate guard & relay fallback", async () => {
  resetConciergeReplyMemoryForTests();

  const mvib = buildHydratedConciergePreset("jfd_mvib0lba_2027_05_17", {
    guestName: "Sarah Jenkins",
  });
  assert.match(mvib.textBody, /^Hi Sarah,/);
  assert.match(mvib.textBody, /Royal Princess/);
  assert.match(mvib.textBody, /\$769/);
  assert.match(mvib.textBody, /2:00 PM, 2:40 PM, 3:20 PM, and 4:00 PM/);
  assert.match(mvib.textBody, /\$899/);
  assert.match(mvib.textBody, /\$789/);
  assert.match(mvib.textBody, /\$649/);
  assert.match(mvib.textBody, /do NOT ride a (?:dog )?sled in Skagway/i);
  assert.ok(
    mvib.viatorHandoffUrl.startsWith(
      "https://www.destinationcommandcenter.com/go/commerce/handoff?",
    ),
  );
  assert.match(mvib.viatorHandoffUrl, /account=P00058396/);
  assert.match(mvib.viatorHandoffUrl, /product=6251SHOREXDOGSLED/);
  assert.match(mvib.viatorHandoffUrl, /campaign=jfd-concierge-mvib0lba/);
  assert.match(mvib.textBody, /Add to Cruise Promenade Plan/);
  assert.match(mvib.textBody, /referral commission/i);

  const mv1s = buildHydratedConciergePreset("jfd_mv1sadck_2027_06_14", {
    guestName: "David Miller",
  });
  assert.match(mv1s.textBody, /^Hi David,/);
  assert.match(mv1s.textBody, /Koningsdam/);
  assert.match(mv1s.textBody, /1:30 PM/);
  assert.match(mv1s.textBody, /do NOT book the 1:40 PM Coastal(?: Helicopters)? slot/i);
  assert.match(mv1s.textBody, /2:20 PM or later/);
  assert.match(mv1s.textBody, /\$459/);
  assert.match(mv1s.textBody, /\$757/);
  assert.match(mv1s.textBody, /\$539/);
  assert.match(mv1s.viatorHandoffUrl, /product=6251SHOREXICEWALK/);
  assert.match(mv1s.viatorHandoffUrl, /campaign=jfd-concierge-mv1sadck/);
  assert.match(mv1s.textBody, /Add to Cruise Promenade Plan/);
  assert.match(mv1s.textBody, /referral commission/i);

  // Admin reply route auth + 409 duplicate guard + forceResend
  const prevAdminToken = process.env.ADMIN_ACCESS_KEY;
  const prevInternalSecret = process.env.DCC_INTERNAL_API_SECRET;
  const prevResendKey = process.env.RESEND_API_KEY;
  const originalFetch = globalThis.fetch;

  try {
    process.env.ADMIN_ACCESS_KEY = "admin-test-bearer-999";
    process.env.DCC_INTERNAL_API_SECRET = "internal-relay-secret-999";
    process.env.RESEND_API_KEY = "re_dcc_fallback_key";

    const unauth = await adminInboxReplyPost(
      new Request("https://www.destinationcommandcenter.com/api/admin/inbox/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetId: "jfd_mv1sadck_2027_06_14" }),
      }),
    );
    assert.equal(unauth.status, 401);

    const fetchCalls: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      fetchCalls.push(url);
      if (url.includes("juneauflightdeck.com/api/internal/concierge-reply")) {
        // Simulate JFD relay unavailable -> triggers DCC local Resend fallback
        return new Response("Gateway Timeout", { status: 504 });
      }
      return new Response(JSON.stringify({ id: "re_live_quote_001" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const firstSend = await adminInboxReplyPost(
      new Request("https://www.destinationcommandcenter.com/api/admin/inbox/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer admin-test-bearer-999",
        },
        body: JSON.stringify({
          presetId: "jfd_mv1sadck_2027_06_14",
          toEmail: "koningsdam.guest@example.com",
          guestFirstName: "Elena",
        }),
      }),
    );
    assert.equal(firstSend.status, 200);
    const firstJson = (await firstSend.json()) as {
      ok: boolean;
      dispatchChannel: string;
      fromUsed: string;
    };
    assert.equal(firstJson.ok, true);
    assert.equal(firstJson.dispatchChannel, "dcc_local_resend");
    assert.ok(!firstJson.fromUsed.includes("partyatredrocks.com"));
    assert.equal(fetchCalls.length, 2);

    // Second send without forceResend returns 409 ALREADY_DELIVERED
    const duplicateSend = await adminInboxReplyPost(
      new Request("https://www.destinationcommandcenter.com/api/admin/inbox/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer admin-test-bearer-999",
        },
        body: JSON.stringify({
          presetId: "jfd_mv1sadck_2027_06_14",
          toEmail: "koningsdam.guest@example.com",
          guestFirstName: "Elena",
        }),
      }),
    );
    assert.equal(duplicateSend.status, 409);
    const dupJson = (await duplicateSend.json()) as { error: string };
    assert.equal(dupJson.error, "ALREADY_DELIVERED");

    // forceResend: true bypasses 409 guard
    const forcedSend = await adminInboxReplyPost(
      new Request("https://www.destinationcommandcenter.com/api/admin/inbox/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer admin-test-bearer-999",
        },
        body: JSON.stringify({
          presetId: "jfd_mv1sadck_2027_06_14",
          toEmail: "koningsdam.guest@example.com",
          guestFirstName: "Elena",
          forceResend: true,
        }),
      }),
    );
    assert.equal(forcedSend.status, 200);
  } finally {
    resetConciergeReplyMemoryForTests();
    globalThis.fetch = originalFetch;
    if (prevAdminToken === undefined) delete process.env.ADMIN_ACCESS_KEY;
    else process.env.ADMIN_ACCESS_KEY = prevAdminToken;
    if (prevInternalSecret === undefined) delete process.env.DCC_INTERNAL_API_SECRET;
    else process.env.DCC_INTERNAL_API_SECRET = prevInternalSecret;
    if (prevResendKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = prevResendKey;
  }
});

test("Move 2: LFSE has 0 occurrences of welcometoalaskatours, Aleutian Ballad unheld on GYG F2MMUUH, and 0 boundary leaks", () => {
  const lfseDir = path.join(REPO_ROOT, "apps", "last-frontier-shore-excursions");
  const files = walkFiles(lfseDir, new Set([".ts", ".tsx", ".md"]));
  assert.ok(files.length > 10);

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    assert.equal(
      content.includes("welcometoalaskatours"),
      false,
      `Found forbidden partner ASN welcometoalaskatours in ${path.relative(REPO_ROOT, file)}`,
    );
  }

  // Verify Aleutian Ballad remains held in LFSE catalog & ship-port pages while WTA has 0 leaks
  const ballad = AFFILIATE_CATALOG.find((e) => e.productId === "t598272");
  assert.equal(ballad, undefined, "Aleutian Ballad t598272 must remain held out of self-serve catalog");

  const shipPortBalladHref = getTrackedTourUrl(
    "Bering Sea Crab Fishermen’s Tour aboard the Aleutian Ballad",
    "Ketchikan",
    "royal-princess",
  );
  assert.equal(shipPortBalladHref, null);

  // Verify ledger state: both WNO Jean Lafitte and LFSE Aleutian Ballad remain held, and 0 partner boundary leaks
  assert.equal(HELD_COMMERCIAL_SKUS.length, 2);
  assert.deepEqual(
    HELD_COMMERCIAL_SKUS.map((s) => s.skuSlug),
    ["jeanlafitte-swamp-tour-with-hotel-pickup", "aleutian-ballad"],
  );
  assert.equal(UNHELD_VERIFIED_SKUS.length, 0);
  assert.deepEqual(listPartnerBoundaryReviewItems(), []);
});

test("Move 4: Universal /go/commerce/handoff card routing + 100% idempotent CSV/JSON commission reconciliation + CP sync", async () => {
  resetCommercialMemoryStoreForTests();
  resetOpaqueAttributionLedgerForTests();

  // 1. JFD handoff wrapper routes Viator URLs via /go/commerce/handoff while leaving direct operator URLs untouched
  const wrappedJfdViator = buildJfdViatorHandoffUrl(
    "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK?pid=P00058396&mcid=42383&medium=api&campaign=jfd-card",
    {
      date: "2027-06-14",
      partySize: 2,
      cruiseShip: "Koningsdam",
    },
  );
  assert.ok(
    wrappedJfdViator.startsWith(
      "https://www.destinationcommandcenter.com/go/commerce/handoff?",
    ),
  );
  assert.match(wrappedJfdViator, /site=juneauflightdeck\.com/);
  assert.match(wrappedJfdViator, /account=P00058396/);
  assert.match(wrappedJfdViator, /product=6251SHOREXICEWALK/);

  const operatorPolicyDirect = buildJfdViatorHandoffUrl(
    "https://coastalhelicopters.com/tours/icefield-excursion/",
  );
  assert.equal(
    operatorPolicyDirect,
    "https://coastalhelicopters.com/tours/icefield-excursion/",
  );

  // 2. LFSE Juneau aviation specialist link stays direct to juneauflightdeck.com
  const jfdSpecialistHref = getTrackedTourUrl(
    "Mendenhall Glacier Dog Sledding & Helicopter Flight",
    "Juneau",
    "koningsdam",
  );
  assert.ok(jfdSpecialistHref);
  assert.ok(jfdSpecialistHref.startsWith("https://juneauflightdeck.com/"));

  // 3. Create a real DCC handoff to verify matched reconciliation + CP sync trigger
  const handoff = await createCommercialHandoff({
    originatingSite: "juneauflightdeck.com",
    provider: "viator",
    providerAccount: "P00058396",
    productCode: "6251SHOREXICEWALK",
    productDestinationUrl:
      "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK",
    intendedDate: "2027-06-14",
    partySize: 2,
    callerClientId: "jfd-web-storefront",
  });

  const prevAdminToken = process.env.ADMIN_ACCESS_KEY;
  const prevCpSecret = process.env.DCC_CP_SERVICE_SECRET;
  const originalFetch = globalThis.fetch;

  try {
    process.env.ADMIN_ACCESS_KEY = "admin-reconcile-token-777";
    process.env.DCC_CP_SERVICE_SECRET = "cp-sync-secret-777";

    // Unauthenticated POST must fail-closed with 401
    const unauthImport = await reconcileImportPost(
      new Request(
        "https://www.destinationcommandcenter.com/api/admin/commerce/reconcile-import",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ format: "csv", payload: "booking_ref\n123" }),
        },
      ),
    );
    assert.equal(unauthImport.status, 401);

    const syncedCpRequests: Array<{
      url: string;
      auth: string | null;
      body: Record<string, unknown>;
    }> = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      syncedCpRequests.push({
        url: String(input),
        auth: headers.get("authorization"),
        body: JSON.parse(String(init?.body || "{}")) as Record<string, unknown>,
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    // GET readiness check
    const readyRes = await reconcileImportGet(
      new Request(
        "https://www.destinationcommandcenter.com/api/admin/commerce/reconcile-import",
        {
          headers: { Authorization: "Bearer admin-reconcile-token-777" },
        },
      ),
    );
    assert.equal(readyRes.status, 200);
    const readyJson = (await readyRes.json()) as {
      ok: boolean;
      readiness: {
        fareharborWebhookEndpointUrl: string;
        cruisePromenadeSyncReady: boolean;
      };
    };
    assert.equal(readyJson.ok, true);
    assert.equal(readyJson.readiness.cruisePromenadeSyncReady, true);
    assert.equal(
      readyJson.readiness.fareharborWebhookEndpointUrl,
      "https://www.destinationcommandcenter.com/api/v1/commerce/webhooks/fareharbor",
    );

    const csvPayload = [
      "order_id,provider,sub_id,product_code,amount,payout,status,booked_date,party_size,share_code",
      `VIA-882910,viator,${handoff.handoffId},6251SHOREXICEWALK,"$918.00","$73.44",settled,2027-06-14,2,PLAN2027AK`,
      `GYG-441029,getyourguide,,t598272,896.00,71.68,settled,2027-07-08,4,`,
    ].join("\n");

    const importRes1 = await reconcileImportPost(
      new Request(
        "https://www.destinationcommandcenter.com/api/admin/commerce/reconcile-import",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer admin-reconcile-token-777",
          },
          body: JSON.stringify({ format: "csv", payload: csvPayload }),
        },
      ),
    );
    assert.equal(importRes1.status, 200);
    const json1 = (await importRes1.json()) as {
      ok: boolean;
      importedCount: number;
      duplicateCount: number;
      matchedHandoffCount: number;
      unmatchedCount: number;
      importedCommissionUsd: number;
      cpSyncTriggeredCount: number;
    };
    assert.equal(json1.ok, true);
    assert.equal(json1.importedCount, 2);
    assert.equal(json1.duplicateCount, 0);
    assert.equal(json1.matchedHandoffCount, 1);
    assert.equal(json1.unmatchedCount, 1);
    assert.equal(json1.importedCommissionUsd, 145.12);
    assert.equal(json1.cpSyncTriggeredCount, 1);

    // Wait a tick for non-blocking CP sync promise to resolve
    await new Promise((r) => setTimeout(r, 25));
    assert.equal(syncedCpRequests.length, 1);
    assert.equal(
      syncedCpRequests[0]?.url,
      "https://cruisepromenade.com/api/planners/PLAN2027AK/sync-booking-status",
    );
    assert.equal(syncedCpRequests[0]?.auth, "Bearer cp-sync-secret-777");
    assert.equal(syncedCpRequests[0]?.body.bookingRef, "VIA-882910");

    const summaryAfterFirst = await getSharedHandoffLedgerSummary();
    assert.equal(summaryAfterFirst.earnedCommissions.confirmedEarnedUsd, 145.12);
    assert.equal(summaryAfterFirst.payouts.settledPaidUsd, 145.12);

    // Re-importing the exact same rows via JSON format MUST be 100% idempotent (0 double-counted commissions!)
    const importRes2 = await reconcileImportPost(
      new Request(
        "https://www.destinationcommandcenter.com/api/admin/commerce/reconcile-import",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer admin-reconcile-token-777",
          },
          body: JSON.stringify({
            format: "json",
            payload: [
              {
                booking_ref: "VIA-882910",
                provider: "viator",
                handoff_id: handoff.handoffId,
                gross_usd: 918,
                commission_usd: 73.44,
                status: "settled",
              },
              {
                booking_ref: "GYG-441029",
                provider: "getyourguide",
                gross_usd: 896,
                commission_usd: 71.68,
                status: "settled",
              },
            ],
          }),
        },
      ),
    );
    assert.equal(importRes2.status, 200);
    const json2 = (await importRes2.json()) as {
      importedCount: number;
      duplicateCount: number;
      importedCommissionUsd: number;
    };
    assert.equal(json2.importedCount, 0);
    assert.equal(json2.duplicateCount, 2);
    assert.equal(json2.importedCommissionUsd, 0);

    const summaryAfterSecond = await getSharedHandoffLedgerSummary();
    assert.equal(summaryAfterSecond.earnedCommissions.confirmedEarnedUsd, 145.12);
    assert.equal(summaryAfterSecond.payouts.settledPaidUsd, 145.12);
  } finally {
    globalThis.fetch = originalFetch;
    if (prevAdminToken === undefined) delete process.env.ADMIN_ACCESS_KEY;
    else process.env.ADMIN_ACCESS_KEY = prevAdminToken;
    if (prevCpSecret === undefined) delete process.env.DCC_CP_SERVICE_SECRET;
    else process.env.DCC_CP_SERVICE_SECRET = prevCpSecret;
  }
});

test("Move 5: Direct operator pitch kits, zero-PII CP sync helper, and /api/partners/direct-operators/apply pending_review + is_test guardrails", async () => {
  assert.equal(AUTO_OUTREACH_DISPATCH_ENABLED, false);
  assert.equal(FLAGSHIP_DIRECT_OPERATOR_PITCH_KITS.length, 4);

  const names = FLAGSHIP_DIRECT_OPERATOR_PITCH_KITS.map((k) => k.operatorName);
  assert.deepEqual(names, [
    "Coastal Helicopters",
    "NorthStar Helicopters",
    "Ragin' Cajun Airboat Tours",
    "Cajun Encounters Tour Company",
  ]);
  for (const kit of FLAGSHIP_DIRECT_OPERATOR_PITCH_KITS) {
    assert.equal(kit.proposedDirectRatePercent, 10);
    assert.equal(kit.proposedMachineRatePercent, 5);
    assert.equal(kit.setupFeeUsd, 0);
    assert.equal(kit.cancellationAndWeatherFeePercent, 0);
    assert.equal(kit.autoSendForbidden, true);
    assert.ok(kit.emailBody.includes("/partners/direct-operators"));
  }

  // Verify fail-safe CP sync helper when offline or unconfigured
  const unconfiguredSync = await syncAuthorizedBookingToCruisePromenade({
    shareCode: "SHARE123",
    bookingRef: "DIR-1001",
    provider: "direct",
    serviceSecret: "",
  });
  assert.equal(unconfiguredSync.ok, false);
  assert.equal(unconfiguredSync.skippedReason, "missing_dcc_cp_service_secret");

  const offlineSync = await syncAuthorizedBookingToCruisePromenade({
    shareCode: "SHARE123",
    bookingRef: "DIR-1001",
    provider: "direct",
    serviceSecret: "sec_123",
    fetchImpl: async () => {
      throw new Error("Simulated connection refused");
    },
  });
  assert.equal(offlineSync.ok, false);
  assert.equal(offlineSync.synced, false);
  assert.ok(offlineSync.zeroPiiPayload);
  assert.equal("email" in offlineSync.zeroPiiPayload, false);
  assert.equal("name" in offlineSync.zeroPiiPayload, false);

  // Verify partner onboarding application intake
  const createdAppIds: string[] = [];
  const localSubmissionsPath = path.join(
    REPO_ROOT,
    ".cache",
    "dcc-transactional-submissions.json",
  );
  const hadLocalSubmissionsBefore = fs.existsSync(localSubmissionsPath);
  const prevSubmissionsRaw = hadLocalSubmissionsBefore
    ? fs.readFileSync(localSubmissionsPath, "utf8")
    : null;

  const localOnboardingPath = path.join(
    REPO_ROOT,
    "data",
    "memory",
    "operator-onboarding-applications.json",
  );
  const hadLocalOnboardingBefore = fs.existsSync(localOnboardingPath);
  const prevOnboardingRaw = hadLocalOnboardingBefore
    ? fs.readFileSync(localOnboardingPath, "utf8")
    : null;

  try {
    // 1. Reject secret-like fields
    const secretRejected = await directOperatorApplyPost(
      new Request(
        "https://www.destinationcommandcenter.com/api/partners/direct-operators/apply",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operatorName: "Test Heli",
            destinationPort: "Juneau, AK",
            bookingSystem: "FareHarbor",
            contactName: "Jane",
            contactEmail: "jane@example.com",
            apiKey: "sk_live_forbidden",
          }),
        },
      ),
    );
    assert.equal(secretRejected.status, 400);

    // 2. Test probe detection ([TEST] / @example.com) + strict pending_review (NEVER live_authorized!)
    const testApplyRes = await directOperatorApplyPost(
      new Request(
        "https://www.destinationcommandcenter.com/api/partners/direct-operators/apply",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operatorName: "[TEST] Glacier Wings Aviation",
            destinationPort: "Juneau, AK",
            bookingSystem: "FareHarbor",
            contactName: "Test Coordinator",
            contactEmail: "ops@example.com",
            notes: "Testing self-serve direct operator intake.",
          }),
        },
      ),
    );
    assert.equal(testApplyRes.status, 201);
    const applyJson = (await testApplyRes.json()) as {
      ok: boolean;
      status: string;
      reviewQueueState: string;
      liveAuthorized: boolean;
      salesAuthorized: boolean;
      isTest: boolean;
      inboxPersisted: boolean;
      applicationId: string;
      proposedRates: { dccSourcedDirectPercent: number; machineDistributedPercent: number };
    };
    if (applyJson.applicationId) createdAppIds.push(applyJson.applicationId);

    assert.equal(applyJson.ok, true);
    assert.equal(applyJson.status, "pending_review");
    assert.equal(applyJson.reviewQueueState, "pending_review");
    assert.equal(applyJson.liveAuthorized, false);
    assert.equal(applyJson.salesAuthorized, false);
    assert.equal(applyJson.isTest, true);
    assert.equal(applyJson.inboxPersisted, true);
    assert.equal(applyJson.proposedRates.dccSourcedDirectPercent, 10);
    assert.equal(applyJson.proposedRates.machineDistributedPercent, 5);
  } finally {
    for (const appId of createdAppIds) {
      await deleteOperatorOnboardingApplicationById(appId).catch(() => undefined);
    }
    if (!hadLocalSubmissionsBefore) {
      try {
        if (fs.existsSync(localSubmissionsPath)) {
          fs.unlinkSync(localSubmissionsPath);
        }
      } catch {
        // ignore
      }
    } else if (prevSubmissionsRaw !== null) {
      fs.writeFileSync(localSubmissionsPath, prevSubmissionsRaw, "utf8");
    }
    if (!hadLocalOnboardingBefore) {
      try {
        if (fs.existsSync(localOnboardingPath)) {
          fs.unlinkSync(localOnboardingPath);
        }
      } catch {
        // ignore
      }
    } else if (prevOnboardingRaw !== null) {
      fs.writeFileSync(localOnboardingPath, prevOnboardingRaw, "utf8");
    }
  }
});
