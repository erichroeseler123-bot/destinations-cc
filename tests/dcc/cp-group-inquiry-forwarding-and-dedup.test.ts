import assert from "node:assert/strict";
import test from "node:test";
import {
  clearCpGroupInquiryIdempotencyForTests,
  DELETE as cpInquiryDelete,
  PATCH as cpInquiryPatch,
  POST as cpInquiryPost,
  setCpInquiryResendFetchForTests,
} from "@/app/api/internal/cp-group-inquiries/route";
import {
  clearInMemoryOperatorTriageForTests,
  getUnifiedOperatorInbox,
  normalizeInquiryNotificationStatus,
  type RawFindingRowInput,
} from "@/lib/dcc/operatorInbox";
import { clearInMemoryTransactionalSubmissionsForTests } from "@/lib/dcc/storage/transactionalSubmissions";

const TEST_SERVICE_SECRET = "cp_bridge_test_secret_2026_11_11_secure_99";

function resetTestStores() {
  clearCpGroupInquiryIdempotencyForTests();
  clearInMemoryTransactionalSubmissionsForTests();
  clearInMemoryOperatorTriageForTests();
  setCpInquiryResendFetchForTests(null);
}

test("CP-Bridge 1: Auth rejection (503 when DCC_CP_SERVICE_SECRET unset, 401 on missing/wrong secret, zero PII leaked)", async () => {
  resetTestStores();
  const prevSecret = process.env.DCC_CP_SERVICE_SECRET;
  delete process.env.DCC_CP_SERVICE_SECRET;

  const sampleBody = {
    id: "gi_auth_probe_001",
    submittedAt: "2026-11-11T15:00:00.000Z",
    organizerName: "Private Customer Name",
    email: "private.customer@organicdomain.org",
    phone: "303-222-8899",
    ship: "Royal Princess",
    sailDate: "2027-07-12",
    ports: ["Juneau", "Skagway", "Ketchikan"],
    travelerCount: 16,
  };

  try {
    // 1. 503 when DCC_CP_SERVICE_SECRET is unset
    const unsetRes = await cpInquiryPost(
      new Request("https://www.destinationcommandcenter.com/api/internal/cp-group-inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dcc-cp-service-secret": "any_value",
        },
        body: JSON.stringify(sampleBody),
      }),
    );
    assert.equal(unsetRes.status, 503);
    assert.match(unsetRes.headers.get("cache-control") || "", /no-store/i);
    const unsetText = await unsetRes.text();
    assert.doesNotMatch(unsetText, /private\.customer@organicdomain\.org/i);
    assert.doesNotMatch(unsetText, /Private Customer Name/i);

    process.env.DCC_CP_SERVICE_SECRET = TEST_SERVICE_SECRET;

    // 2. 401 when missing secret headers
    const missingAuthRes = await cpInquiryPost(
      new Request("https://www.destinationcommandcenter.com/api/internal/cp-group-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sampleBody),
      }),
    );
    assert.equal(missingAuthRes.status, 401);
    assert.match(missingAuthRes.headers.get("cache-control") || "", /no-store/i);

    // 3. 401 when wrong x-dcc-cp-service-secret or wrong Bearer token
    for (const badHeaders of [
      { "x-dcc-cp-service-secret": "wrong_secret_123" },
      { Authorization: "Bearer wrong_bearer_456" },
    ]) {
      const wrongAuthRes = await cpInquiryPost(
        new Request("https://www.destinationcommandcenter.com/api/internal/cp-group-inquiries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...badHeaders,
          },
          body: JSON.stringify(sampleBody),
        }),
      );
      assert.equal(wrongAuthRes.status, 401);
      const wrongText = await wrongAuthRes.text();
      assert.doesNotMatch(wrongText, /private\.customer@organicdomain\.org/i);
      assert.doesNotMatch(wrongText, new RegExp(TEST_SERVICE_SECRET));
    }

    // 4. Both x-dcc-cp-service-secret and Authorization: Bearer <secret> succeed when valid
    const validBearerRes = await cpInquiryPost(
      new Request("https://www.destinationcommandcenter.com/api/internal/cp-group-inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TEST_SERVICE_SECRET}`,
        },
        body: JSON.stringify(sampleBody),
      }),
    );
    assert.equal(validBearerRes.status, 200);
    const validBody = (await validBearerRes.json()) as {
      ok: boolean;
      inquiryId: string;
      itemKey: string;
      deduplicated: boolean;
    };
    assert.equal(validBody.ok, true);
    assert.equal(validBody.inquiryId, "gi_auth_probe_001");
    assert.equal(validBody.itemKey, "cp:group-inquiry:gi_auth_probe_001");
    assert.equal(validBody.deduplicated, false);
  } finally {
    resetTestStores();
    if (prevSecret === undefined) delete process.env.DCC_CP_SERVICE_SECRET;
    else process.env.DCC_CP_SERVICE_SECRET = prevSecret;
  }
});

test("CP-Bridge 2 & 3: Full CP inquiry field preservation + strict idempotency (duplicate POST sends 1 email and stores 1 row)", async () => {
  resetTestStores();
  const prevSecret = process.env.DCC_CP_SERVICE_SECRET;
  const prevResend = process.env.RESEND_API_KEY;
  const prevOwnerTo = process.env.CP_OWNER_ALERT_TO_EMAIL;
  process.env.DCC_CP_SERVICE_SECRET = TEST_SERVICE_SECRET;
  process.env.RESEND_API_KEY = "re_test_live_simulated_key_1234567890";
  process.env.CP_OWNER_ALERT_TO_EMAIL = "owner-alerts@cruisepromenade.com";

  const sentEmails: Array<{ to: string[]; subject: string; text: string }> = [];
  setCpInquiryResendFetchForTests(async (_url, init) => {
    const parsed = JSON.parse(String(init?.body || "{}")) as {
      to: string[];
      subject: string;
      text: string;
    };
    sentEmails.push(parsed);
    return new Response(JSON.stringify({ id: "re_msg_cp_9001" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

  const payload = {
    id: "gi_20261111_alaska_8842",
    submittedAt: "2026-11-11T18:22:33.000Z",
    organizerName: "Hannah Abbott",
    email: "hannah.abbott@pacificnorthwestfamily.org",
    phone: "+1 (206) 441-8892",
    ship: "Holland America Koningsdam",
    sailDate: "2027-06-19",
    ports: ["Juneau", "Skagway", "Glacier Bay", "Ketchikan"],
    travelerCount: "18",
    desiredActivities: ["Private Helicopter Dog Sledding", "Whale Watch Charter"],
    mobilityNeeds: "1 collapsible walker for dock transfer",
    sourcePage: "/sailings/koningsdam-2027-06-19",
    paymentStructure: "split_per_cabin",
    privateTransport: true,
    negotiatedRates: true,
    isTest: false,
    cpNotificationStatus: "durable_storage_only",
  };

  try {
    // First POST
    const firstRes = await cpInquiryPost(
      new Request("https://www.destinationcommandcenter.com/api/internal/cp-group-inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dcc-cp-service-secret": TEST_SERVICE_SECRET,
        },
        body: JSON.stringify(payload),
      }),
    );
    assert.equal(firstRes.status, 200);
    const firstJson = (await firstRes.json()) as {
      ok: boolean;
      inquiryId: string;
      itemKey: string;
      deduplicated: boolean;
      durableStored: boolean;
      notificationStatus: string;
    };
    assert.equal(firstJson.ok, true);
    assert.equal(firstJson.deduplicated, false);
    assert.equal(firstJson.durableStored, true);
    assert.equal(firstJson.notificationStatus, "delivered");
    assert.equal(sentEmails.length, 1);
    // Customer PII email is NEVER in `to:` — only configured owner recipient!
    assert.deepEqual(sentEmails[0].to, ["owner-alerts@cruisepromenade.com"]);

    // Duplicate POST with identical inquiry id -> deduplicated: true, NO second email, NO duplicate row
    const secondRes = await cpInquiryPost(
      new Request("https://www.destinationcommandcenter.com/api/internal/cp-group-inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dcc-cp-service-secret": TEST_SERVICE_SECRET,
        },
        body: JSON.stringify(payload),
      }),
    );
    assert.equal(secondRes.status, 200);
    const secondJson = (await secondRes.json()) as {
      ok: boolean;
      inquiryId: string;
      itemKey: string;
      deduplicated: boolean;
      notificationStatus: string;
    };
    assert.equal(secondJson.ok, true);
    assert.equal(secondJson.deduplicated, true);
    assert.equal(secondJson.notificationStatus, "delivered");
    assert.equal(sentEmails.length, 1);

    // Verify Unified Operator Inbox (`view=genuine`) surfaces 1 row with 100% of CP fields preserved
    const inbox = await getUnifiedOperatorInbox({
      view: "genuine",
      argoLegacyOverride: [],
      cpFetchOverride: async () =>
        new Response(JSON.stringify({ ok: true, inquiries: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    });

    const cpItems = inbox.items.filter(
      (i) => i.sourceId === "gi_20261111_alaska_8842",
    );
    assert.equal(cpItems.length, 1);
    const item = cpItems[0];
    assert.equal(item.itemKey, "cp:group-inquiry:gi_20261111_alaska_8842");
    assert.equal(item.sourceSystem, "cruisepromenade");
    assert.equal(item.sourceSite, "cruisepromenade");
    assert.equal(item.submittedAt, "2026-11-11T18:22:33.000Z");
    assert.equal(item.contact.name, "Hannah Abbott");
    assert.equal(item.customerName, "Hannah Abbott");
    assert.equal(item.contact.email, "hannah.abbott@pacificnorthwestfamily.org");
    assert.equal(item.customerEmail, "hannah.abbott@pacificnorthwestfamily.org");
    assert.equal(item.contact.phone, "+1 (206) 441-8892");
    assert.equal(item.customerPhone, "+1 (206) 441-8892");
    assert.equal(item.partySize, 18);
    assert.equal(item.tripDetails.partySize, 18);
    assert.equal(item.requestedDate, "2027-06-19");
    assert.equal(item.tripDetails.datesOrMonth, "2027-06-19");
    assert.equal(item.tripDetails.pageOrSourceUrl, "/sailings/koningsdam-2027-06-19");
    assert.equal(
      item.sailing,
      "Holland America Koningsdam (2027-06-19)",
    );
    assert.equal(
      item.detailFields?.port,
      "Juneau, Skagway, Glacier Bay, Ketchikan",
    );
    assert.equal(item.detailFields?.groupSize, 18);
    assert.equal(
      item.detailFields?.activity,
      "Private Helicopter Dog Sledding, Whale Watch Charter",
    );
    assert.equal(
      item.detailFields?.mobilityNeeds,
      "1 collapsible walker for dock transfer",
    );
    assert.equal(
      item.detailFields?.sourcePage,
      "/sailings/koningsdam-2027-06-19",
    );
    assert.match(item.tripDetails.messageOrNotes || "", /Juneau, Skagway/);
    assert.match(
      item.tripDetails.messageOrNotes || "",
      /Private Helicopter Dog Sledding/,
    );
    assert.equal(item.notificationStatus, "delivered");
  } finally {
    resetTestStores();
    if (prevSecret === undefined) delete process.env.DCC_CP_SERVICE_SECRET;
    else process.env.DCC_CP_SERVICE_SECRET = prevSecret;
    if (prevResend === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = prevResend;
    if (prevOwnerTo === undefined) delete process.env.CP_OWNER_ALERT_TO_EMAIL;
    else process.env.CP_OWNER_ALERT_TO_EMAIL = prevOwnerTo;
  }
});

test("CP-Bridge 4: Cross-path deduplication in getUnifiedOperatorInbox when same gi_... arrives via BOTH push finding AND pull feed", async () => {
  resetTestStores();
  const prevCpSecret = process.env.DCC_CP_SERVICE_SECRET;
  process.env.DCC_CP_SERVICE_SECRET = TEST_SERVICE_SECRET;

  try {
    const sharedId = "gi_crosspath_dedup_7711";
    const pushFindingRow: RawFindingRowInput = {
      finding_id: `control-map:transactional-submission:production:cp-group-inquiry:${sharedId}`,
      status: "captured",
      severity: "watch",
      owner: "dcc:cp-group-inquiry",
      note: "CP Group Inquiry gi_crosspath_dedup_7711",
      metadata: {
        id: sharedId,
        inquiryId: sharedId,
        submissionId: sharedId,
        channel: "cp-group-inquiry",
        environment: "production",
        submittedAt: "2026-11-11T20:15:00.000Z",
        organizerName: "Devon Brooks",
        email: "devon.brooks@alaskacruisegroup.org",
        phone: "503-442-1920",
        ship: "Norwegian Bliss",
        sailDate: "2027-08-07",
        ports: ["Juneau", "Ketchikan"],
        travelerCount: 14,
        desiredActivities: ["Mendenhall Glacier Canoe"],
        sourcePage: "/group-cruises",
        isTest: false,
        notificationStatus: "durable_storage_only",
      },
      created_at: "2026-11-11T20:15:00.000Z",
      updated_at: "2026-11-11T20:15:00.000Z",
    };

    let capturedPullHeaders: Headers | null = null;
    const mockPullFetch: typeof fetch = async (_input, init) => {
      capturedPullHeaders = new Headers(init?.headers);
      return new Response(
        JSON.stringify({
          ok: true,
          namespace: "production",
          inquiries: [
            // Exact same gi_... inquiry returned by CP pull API (plus an internal duplicate in list)
            {
              id: sharedId,
              createdAt: "2026-11-11T20:15:00.000Z",
              organizerName: "Devon Brooks",
              email: "devon.brooks@alaskacruisegroup.org",
              phone: "503-442-1920",
              ship: "Norwegian Bliss",
              sailDate: "2027-08-07",
              ports: ["Juneau", "Ketchikan"],
              travelerCount: 14,
              desiredActivities: ["Mendenhall Glacier Canoe"],
              sourcePage: "/group-cruises",
              notification: {
                delivered: true,
                channel: "resend",
                destination: "concierge@cruisepromenade.com",
              },
            },
            {
              id: sharedId,
              createdAt: "2026-11-11T20:15:00.000Z",
              organizerName: "Devon Brooks",
              email: "devon.brooks@alaskacruisegroup.org",
              ship: "Norwegian Bliss",
              sailDate: "2027-08-07",
              travelerCount: 14,
            },
            // Distinct pull-only inquiry
            {
              id: "gi_pull_only_9922",
              createdAt: "2026-11-11T21:00:00.000Z",
              organizerName: "Nora Patel",
              email: "nora.patel@seattlegroup.org",
              ship: "Celebrity Edge",
              sailDate: "2027-07-23",
              ports: "Juneau, Skagway",
              travelerCount: 12,
              desiredActivities: "Whale Watching",
              sourcePage: "/groups/alaska",
              notificationStatus: "kv_audit",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    const inbox = await getUnifiedOperatorInbox({
      view: "genuine",
      findingsOverride: [pushFindingRow],
      argoLegacyOverride: [],
      cpFetchOverride: mockPullFetch,
    });

    // Pull request authenticated using DCC_CP_SERVICE_SECRET with both Bearer and x-dcc-cp-service-secret
    assert.ok(capturedPullHeaders);
    assert.equal(
      (capturedPullHeaders as Headers).get("authorization"),
      `Bearer ${TEST_SERVICE_SECRET}`,
    );
    assert.equal(
      (capturedPullHeaders as Headers).get("x-dcc-cp-service-secret"),
      TEST_SERVICE_SECRET,
    );

    // Strictly 1 entry for sharedId + 1 entry for pull-only = 2 total genuine items
    assert.equal(inbox.items.length, 2);
    const matchingShared = inbox.items.filter((i) => i.sourceId === sharedId);
    assert.equal(matchingShared.length, 1);
    assert.equal(matchingShared[0].itemKey, `cp:group-inquiry:${sharedId}`);
    // Merged truthful delivered status from CP audit when push row was durable_storage_only
    assert.equal(matchingShared[0].notificationStatus, "delivered");

    // Legacy `kv_audit` cleanly normalized to `durable_storage_only`
    const pullOnly = inbox.items.find((i) => i.sourceId === "gi_pull_only_9922");
    assert.ok(pullOnly);
    assert.equal(pullOnly.notificationStatus, "durable_storage_only");
  } finally {
    resetTestStores();
    if (prevCpSecret === undefined) delete process.env.DCC_CP_SERVICE_SECRET;
    else process.env.DCC_CP_SERVICE_SECRET = prevCpSecret;
  }
});

test("CP-Bridge 5: Truthful notificationStatus distinctions (delivered, failed, not_configured, durable_storage_only)", async () => {
  resetTestStores();
  const prevSecret = process.env.DCC_CP_SERVICE_SECRET;
  const prevResend = process.env.RESEND_API_KEY;
  const prevDccResend = process.env.DCC_RESEND_API_KEY;
  const prevOwnerTo = process.env.CP_OWNER_ALERT_TO_EMAIL;
  const prevApprovalTo = process.env.EARTHOS_APPROVAL_TO;

  process.env.DCC_CP_SERVICE_SECRET = TEST_SERVICE_SECRET;
  delete process.env.RESEND_API_KEY;
  delete process.env.DCC_RESEND_API_KEY;
  delete process.env.CP_OWNER_ALERT_TO_EMAIL;
  delete process.env.EARTHOS_APPROVAL_TO;

  try {
    // Case A: durable_storage_only when persisted durably without Resend configured
    const durableRes = await cpInquiryPost(
      new Request("https://www.destinationcommandcenter.com/api/internal/cp-group-inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dcc-cp-service-secret": TEST_SERVICE_SECRET,
        },
        body: JSON.stringify({
          id: "gi_status_durable_01",
          organizerName: "Clara Oswald",
          email: "clara@travelgroup.org",
          ship: "Discovery Princess",
          sailDate: "2027-05-22",
          travelerCount: 10,
        }),
      }),
    );
    const durableJson = (await durableRes.json()) as { notificationStatus: string };
    assert.equal(durableJson.notificationStatus, "durable_storage_only");

    // Case B: not_configured when upstream explicitly reports not_configured and DCC has no email config
    const notCfgRes = await cpInquiryPost(
      new Request("https://www.destinationcommandcenter.com/api/internal/cp-group-inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dcc-cp-service-secret": TEST_SERVICE_SECRET,
        },
        body: JSON.stringify({
          id: "gi_status_notcfg_02",
          organizerName: "Arthur Dent",
          email: "arthur@galaxygroup.org",
          ship: "Discovery Princess",
          sailDate: "2027-05-29",
          travelerCount: 8,
          cpNotificationStatus: "not_configured",
        }),
      }),
    );
    const notCfgJson = (await notCfgRes.json()) as { notificationStatus: string };
    assert.equal(notCfgJson.notificationStatus, "not_configured");

    // Case C: failed when DCC Resend is configured and attempted for non-test inquiry, and Resend returns HTTP 500
    process.env.RESEND_API_KEY = "re_test_live_simulated_key_9988776655";
    process.env.CP_OWNER_ALERT_TO_EMAIL = "owner-alerts@cruisepromenade.com";
    setCpInquiryResendFetchForTests(async () =>
      new Response("upstream provider error", { status: 500 }),
    );

    const failedRes = await cpInquiryPost(
      new Request("https://www.destinationcommandcenter.com/api/internal/cp-group-inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dcc-cp-service-secret": TEST_SERVICE_SECRET,
        },
        body: JSON.stringify({
          id: "gi_status_failed_03",
          organizerName: " Martha Jones ",
          email: "martha@medgroup.org",
          ship: "Eurodam",
          sailDate: "2027-06-05",
          travelerCount: 12,
        }),
      }),
    );
    const failedJson = (await failedRes.json()) as { notificationStatus: string };
    assert.equal(failedJson.notificationStatus, "failed");

    // Case D: delivered when CP already delivered upstream (DCC does NOT send a duplicate email)
    let dccEmailCalled = false;
    setCpInquiryResendFetchForTests(async () => {
      dccEmailCalled = true;
      return new Response(JSON.stringify({ id: "unexpected" }), { status: 200 });
    });

    const cpDeliveredRes = await cpInquiryPost(
      new Request("https://www.destinationcommandcenter.com/api/internal/cp-group-inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dcc-cp-service-secret": TEST_SERVICE_SECRET,
        },
        body: JSON.stringify({
          id: "gi_status_delivered_04",
          organizerName: "Rory Williams",
          email: "rory@romangroup.org",
          ship: "Eurodam",
          sailDate: "2027-06-12",
          travelerCount: 14,
          cpNotificationStatus: "delivered",
        }),
      }),
    );
    const cpDeliveredJson = (await cpDeliveredRes.json()) as {
      notificationStatus: string;
    };
    assert.equal(cpDeliveredJson.notificationStatus, "delivered");
    assert.equal(dccEmailCalled, false);

    // Direct helper verification for legacy kv_audit mapping
    const kvMapped = normalizeInquiryNotificationStatus(
      "cp-group-inquiry",
      { notificationStatus: "kv_audit" },
      false,
    );
    assert.equal(kvMapped.notificationStatus, "durable_storage_only");
  } finally {
    resetTestStores();
    if (prevSecret === undefined) delete process.env.DCC_CP_SERVICE_SECRET;
    else process.env.DCC_CP_SERVICE_SECRET = prevSecret;
    if (prevResend === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = prevResend;
    if (prevDccResend === undefined) delete process.env.DCC_RESEND_API_KEY;
    else process.env.DCC_RESEND_API_KEY = prevDccResend;
    if (prevOwnerTo === undefined) delete process.env.CP_OWNER_ALERT_TO_EMAIL;
    else process.env.CP_OWNER_ALERT_TO_EMAIL = prevOwnerTo;
    if (prevApprovalTo === undefined) delete process.env.EARTHOS_APPROVAL_TO;
    else process.env.EARTHOS_APPROVAL_TO = prevApprovalTo;
  }
});

test("CP-Bridge 6: Synthetic [QA-SYNTHETIC] / gi_qa_* classification & cleanup via PATCH/DELETE refuses organic customer rows (403)", async () => {
  resetTestStores();
  const prevSecret = process.env.DCC_CP_SERVICE_SECRET;
  process.env.DCC_CP_SERVICE_SECRET = TEST_SERVICE_SECRET;

  try {
    // 1. Ingest a real organic customer inquiry
    await cpInquiryPost(
      new Request("https://www.destinationcommandcenter.com/api/internal/cp-group-inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dcc-cp-service-secret": TEST_SERVICE_SECRET,
        },
        body: JSON.stringify({
          id: "gi_organic_customer_5501",
          organizerName: "Evelyn Carnahan",
          email: "evelyn@cairoexpeditions.org",
          ship: "Majestic Princess",
          sailDate: "2027-07-10",
          travelerCount: 20,
        }),
      }),
    );

    // Attempt PATCH or DELETE against organic customer row -> strictly 403 Forbidden!
    const forbiddenPatch = await cpInquiryPatch(
      new Request("https://www.destinationcommandcenter.com/api/internal/cp-group-inquiries", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-dcc-cp-service-secret": TEST_SERVICE_SECRET,
        },
        body: JSON.stringify({
          id: "gi_organic_customer_5501",
          isTest: true,
          status: "archived",
        }),
      }),
    );
    assert.equal(forbiddenPatch.status, 403);

    const forbiddenDelete = await cpInquiryDelete(
      new Request(
        "https://www.destinationcommandcenter.com/api/internal/cp-group-inquiries?id=gi_organic_customer_5501",
        {
          method: "DELETE",
          headers: { "x-dcc-cp-service-secret": TEST_SERVICE_SECRET },
        },
      ),
    );
    assert.equal(forbiddenDelete.status, 403);

    // 2. Ingest a synthetic QA probe (`[QA-SYNTHETIC]` / `gi_qa_*`) and reclassify/archive via PATCH
    await cpInquiryPost(
      new Request("https://www.destinationcommandcenter.com/api/internal/cp-group-inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dcc-cp-service-secret": TEST_SERVICE_SECRET,
        },
        body: JSON.stringify({
          id: "gi_qa_verify_bridge_01",
          organizerName: "[QA-SYNTHETIC] Bridge Probe",
          email: "qa-probe@example.com",
          ship: "Royal Princess",
          sailDate: "2027-08-01",
          travelerCount: 8,
        }),
      }),
    );

    const allowedPatch = await cpInquiryPatch(
      new Request("https://www.destinationcommandcenter.com/api/internal/cp-group-inquiries", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-dcc-cp-service-secret": TEST_SERVICE_SECRET,
        },
        body: JSON.stringify({
          id: "gi_qa_verify_bridge_01",
          isTest: true,
          status: "archived",
          operatorNote: "Post-deploy QA probe verified and archived",
        }),
      }),
    );
    assert.equal(allowedPatch.status, 200);

    // Organic inquiry remains untouched in view=genuine; synthetic QA probe is in view=test with archived status
    const genuineInbox = await getUnifiedOperatorInbox({
      view: "genuine",
      argoLegacyOverride: [],
      cpFetchOverride: async () =>
        new Response(JSON.stringify({ ok: true, inquiries: [] }), { status: 200 }),
    });
    assert.equal(genuineInbox.items.length, 1);
    assert.equal(genuineInbox.items[0].sourceId, "gi_organic_customer_5501");

    const testInbox = await getUnifiedOperatorInbox({
      view: "test",
      argoLegacyOverride: [],
      cpFetchOverride: async () =>
        new Response(JSON.stringify({ ok: true, inquiries: [] }), { status: 200 }),
    });
    const archivedProbe = testInbox.items.find(
      (i) => i.sourceId === "gi_qa_verify_bridge_01",
    );
    assert.ok(archivedProbe);
    assert.equal(archivedProbe.triageStatus, "archived");

    // Also verify DELETE cleanup works on synthetic QA probe
    const allowedDelete = await cpInquiryDelete(
      new Request(
        "https://www.destinationcommandcenter.com/api/internal/cp-group-inquiries?id=gi_qa_verify_bridge_01",
        {
          method: "DELETE",
          headers: { "x-dcc-cp-service-secret": TEST_SERVICE_SECRET },
        },
      ),
    );
    assert.equal(allowedDelete.status, 200);
  } finally {
    resetTestStores();
    if (prevSecret === undefined) delete process.env.DCC_CP_SERVICE_SECRET;
    else process.env.DCC_CP_SERVICE_SECRET = prevSecret;
  }
});
