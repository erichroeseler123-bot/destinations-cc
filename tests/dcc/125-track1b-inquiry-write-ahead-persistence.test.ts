import test from "node:test";
import assert from "node:assert/strict";
import {
  POST as postCpGroupInquiry,
  clearCpGroupInquiryIdempotencyForTests,
  setCpInquiryResendFetchForTests,
} from "@/app/api/internal/cp-group-inquiries/route";
import { getInMemoryTransactionalSubmissions } from "@/lib/dcc/storage/transactionalSubmissions";

test("Track 1B DCC: CP group inquiry is persisted durably BEFORE Resend dispatch and survives Resend failure", async () => {
  const prevSecret = process.env.DCC_CP_SERVICE_SECRET;
  const prevResendKey = process.env.RESEND_API_KEY;
  const prevResendFrom = process.env.RESEND_FROM_EMAIL;
  const prevDbUrl = process.env.DATABASE_URL;
  const prevIsolated = process.env.DCC_ISOLATED_TEST_DB;

  process.env.DCC_CP_SERVICE_SECRET = "test-track1b-dcc-cp-service-secret-012345";
  process.env.RESEND_API_KEY = "re_livesim_99887766554433221100aabbccdd";
  process.env.RESEND_FROM_EMAIL = "alerts@destinationcommandcenter.com";
  process.env.DATABASE_URL = "";
  process.env.DCC_ISOLATED_TEST_DB = "1";

  clearCpGroupInquiryIdempotencyForTests();

  const inquiryId = `gi_track1b_${Date.now()}`;
  let wasPersistedBeforeResendCall = false;

  setCpInquiryResendFetchForTests(async () => {
    const subsAtMomentOfEmailCall = getInMemoryTransactionalSubmissions();
    const found = subsAtMomentOfEmailCall.get(`cp-group-inquiry:${inquiryId}`);
    wasPersistedBeforeResendCall = Boolean(found);
    return new Response(JSON.stringify({ message: "Simulated Resend 503 outage" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  });

  try {
    const req = new Request("https://www.destinationcommandcenter.com/api/internal/cp-group-inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-dcc-cp-service-secret": "test-track1b-dcc-cp-service-secret-012345",
      },
      body: JSON.stringify({
        inquiryId,
        organizerName: "Alex Rivera",
        email: "alex.rivera@travelagency-client.org",
        phone: "555-0199",
        ship: "Symphony of the Seas",
        sailDate: "2027-01-31",
        ports: ["Cozumel", "Costa Maya"],
        travelerCount: 18,
        desiredActivities: ["Catamaran Reef Snorkel"],
        notes: "Group celebration inquiry",
      }),
    });

    const res = await postCpGroupInquiry(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(wasPersistedBeforeResendCall, true, "Expected inquiry persisted BEFORE Resend fetch fired");
    assert.equal(json.ok, true);
    assert.equal(json.durableStored, true);
    assert.equal(json.notificationStatus, "failed");

    const finalStored = getInMemoryTransactionalSubmissions().get(
      `cp-group-inquiry:${inquiryId}`,
    );
    assert.ok(finalStored, "Expected inquiry preserved in durable store after Resend failure");
    assert.ok(finalStored.persistedBeforeEmailAt);
    assert.equal(finalStored.notificationStatus, "failed");
  } finally {
    setCpInquiryResendFetchForTests(null);
    if (prevSecret === undefined) delete process.env.DCC_CP_SERVICE_SECRET;
    else process.env.DCC_CP_SERVICE_SECRET = prevSecret;
    if (prevResendKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = prevResendKey;
    if (prevResendFrom === undefined) delete process.env.RESEND_FROM_EMAIL;
    else process.env.RESEND_FROM_EMAIL = prevResendFrom;
    if (prevDbUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prevDbUrl;
    if (prevIsolated === undefined) delete process.env.DCC_ISOLATED_TEST_DB;
    else process.env.DCC_ISOLATED_TEST_DB = prevIsolated;
  }
});
