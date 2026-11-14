import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_SESSION_COOKIE, buildAdminSessionValue } from "@/lib/adminAccess";
import {
  GET as outreachGet,
  POST as outreachPost,
} from "@/app/api/admin/outreach/route";
import {
  HOSTED_ORGANIZER_CORE_PITCH,
  REQUESTED_CALL_ACTION,
  getOrganizerOutreachDashboard,
  resetInMemoryOrganizerOutreachForTests,
  updateOrganizerOutreachLead,
} from "@/lib/dcc/organizerOutreachStore";

test("112a. /api/admin/outreach fails closed with 401 and noindex/no-store headers when unauthenticated", async () => {
  process.env.ADMIN_ACCESS_KEY = "test-admin-secret-outreach-112";

  const unauthGet = await outreachGet(
    new Request("https://destinationcommandcenter.com/api/admin/outreach"),
  );
  assert.equal(unauthGet.status, 401);
  assert.match(unauthGet.headers.get("cache-control") || "", /no-store/i);
  assert.match(unauthGet.headers.get("x-robots-tag") || "", /noindex/i);

  const unauthPost = await outreachPost(
    new Request("https://destinationcommandcenter.com/api/admin/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: "bond_and_beyond",
        outreachStatus: "called_spoke",
      }),
    }),
  );
  assert.equal(unauthPost.status, 401);
});

test("112b. Seeded sprint pipeline surfaces 44 deduplicated prospects, 40 phone leads, 29 phone-qualified Ready to Call, 12 strict holds, 0 sent count, verbatim pitch, and zero hype", async () => {
  process.env.DCC_ISOLATED_TEST_DB = "1";
  resetInMemoryOrganizerOutreachForTests();

  const snap = await getOrganizerOutreachDashboard({
    scope: "nonprod",
    corridorEventsOverride: [],
  });

  assert.equal(snap.kpis.totalLeadsCount, 44);
  assert.equal(snap.kpis.phoneLeadsCount, 40);
  assert.equal(snap.kpis.phoneQualifiedReadyCount, 29);
  assert.ok(
    snap.kpis.phoneQualifiedReadyCount >= 25,
    "Must provide at least 25 verified phone-qualified prospects",
  );
  assert.equal(snap.kpis.qualifiedReadyCount, 32);
  assert.equal(snap.kpis.heldOrNeedsQualificationCount, 12);
  assert.equal(snap.kpis.outreachSentLeadsCount, 0);
  assert.equal(snap.kpis.totalOutreachTouchesCount, 0);
  assert.equal(
    snap.corePitchVerbatim,
    "We built a free shared cruise page for hosted groups. Your travelers can meet before sailing, see which excursions everyone is joining, book the exact same departure, and keep the entire schedule together—including an offline Cruise Pack. It does not interfere with your cabin sales, travel advisor, conference programming or onboard events.",
  );
  assert.equal(snap.corePitchVerbatim, HOSTED_ORGANIZER_CORE_PITCH);
  assert.equal(
    snap.requestedCallAction,
    "Open the sailing page while we are on the phone and decide whether you would be comfortable sharing it with your group.",
  );
  assert.equal(snap.requestedCallAction, REQUESTED_CALL_ACTION);

  // Deduplication invariant: all 44 leadIds and utmSources are unique
  const uniqueIds = new Set(snap.leads.map((l) => l.leadId));
  const uniqueUtm = new Set(snap.leads.map((l) => l.utmSource));
  assert.equal(uniqueIds.size, 44);
  assert.equal(uniqueUtm.size, 44);

  // #1 highest-probability first call is Bond & Beyond
  const bond = snap.leads[0];
  assert.equal(bond.leadId, "bond_and_beyond");
  assert.equal(bond.phone, "(904) 295-1212");
  assert.equal(bond.phoneDial, "+19042951212");
  assert.equal(bond.phoneInvitesText, true);
  assert.equal(bond.qualificationStatus, "qualified_page_live");
  assert.equal(bond.outreachStatus, "ready_to_call");
  assert.ok(
    bond.sailingPageUrl?.includes(
      "https://cruisepromenade.com/sailings/norwegian-escape/2027-04-16?utm_source=bond_and_beyond",
    ),
  );

  // Top 10 Call Now queue completeness
  const top10 = snap.leads
    .filter((l) => Boolean(l.phone) && l.qualificationStatus === "qualified_page_live")
    .slice(0, 10);
  assert.equal(top10.length, 10);
  for (const lead of top10) {
    assert.ok(lead.phone && lead.phoneDial, `Missing phone on ${lead.leadId}`);
    assert.ok(lead.contactName, `Missing contactName on ${lead.leadId}`);
    assert.ok(lead.organizerRole, `Missing organizerRole on ${lead.leadId}`);
    assert.ok(lead.contactTimezone, `Missing contactTimezone on ${lead.leadId}`);
    assert.ok(lead.bestCallingWindow, `Missing bestCallingWindow on ${lead.leadId}`);
    assert.ok(lead.cruiseLine, `Missing cruiseLine on ${lead.leadId}`);
    assert.ok(lead.sailingPageUrl, `Missing sailingPageUrl on ${lead.leadId}`);
    assert.ok(lead.phoneOpeningScript.length > 40, `Short opening on ${lead.leadId}`);
    assert.ok(lead.voicemailScript.length > 30, `Short voicemail on ${lead.leadId}`);
    assert.ok(lead.likelyObjection.length > 10, `Missing objection on ${lead.leadId}`);
    assert.ok(lead.objectionResponse.length > 10, `Missing response on ${lead.leadId}`);
    assert.ok(lead.emailBody.includes(HOSTED_ORGANIZER_CORE_PITCH));
  }

  // Strict hold rule + honesty check across every single prospect
  const forbiddenHype = /\b(thousands of groups|hundreds of groups|already popular|most popular cruise|testimonial)\b/i;
  for (const lead of snap.leads) {
    if (lead.qualificationStatus !== "qualified_page_live") {
      assert.equal(
        lead.sailingPageUrl,
        null,
        `Held lead ${lead.leadId} must never expose a sailingPageUrl`,
      );
    } else {
      assert.ok(
        lead.sailingPageUrl?.startsWith("https://cruisepromenade.com/sailings/"),
        `Qualified lead ${lead.leadId} must expose a verified sailingPageUrl`,
      );
    }
    assert.doesNotMatch(lead.phoneOpeningScript, forbiddenHype);
    assert.doesNotMatch(lead.voicemailScript, forbiddenHype);
    assert.doesNotMatch(lead.emailBody, forbiddenHype);
  }
});

test("112c. Admin API supports all Section 6 call outcomes, follow-up dates, notes, board created, first traveler joined, hold URL guardrails, and custom lead lifecycle", async () => {
  process.env.DCC_ISOLATED_TEST_DB = "1";
  process.env.ADMIN_ACCESS_KEY = "test-admin-secret-outreach-112";
  resetInMemoryOrganizerOutreachForTests();

  const cookieVal = buildAdminSessionValue("test-admin-secret-outreach-112");
  const authedHeaders = {
    "Content-Type": "application/json",
    cookie: `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(cookieVal)}`,
  };

  // 1. Attempt to attach a sailing URL while WSBA is held -> URL remains null
  const wsbaHoldRes = await outreachPost(
    new Request("https://destinationcommandcenter.com/api/admin/outreach", {
      method: "POST",
      headers: authedHeaders,
      body: JSON.stringify({
        leadId: "wsba_cruise",
        sailingPageUrl:
          "https://cruisepromenade.com/sailings/brilliant-lady/2027-02-04",
      }),
    }),
  );
  assert.equal(wsbaHoldRes.status, 200);
  const wsbaHoldBody = (await wsbaHoldRes.json()) as {
    lead: { sailingPageUrl: string | null };
  };
  assert.equal(wsbaHoldBody.lead.sailingPageUrl, null);

  // 2. Verify new sprint outcome statuses: call_attempted -> follow_up_requested -> first_traveler_joined -> wrong_contact -> not_a_fit
  for (const status of [
    "call_attempted",
    "called_left_vm",
    "called_spoke",
    "follow_up_requested",
    "board_live",
    "first_traveler_joined",
    "wrong_contact",
    "not_a_fit",
  ] as const) {
    const res = await outreachPost(
      new Request("https://destinationcommandcenter.com/api/admin/outreach", {
        method: "POST",
        headers: authedHeaders,
        body: JSON.stringify({
          leadId: "hr_conference_cruise",
          logTouchChannel: "call",
          outreachStatus: status,
        }),
      }),
    );
    assert.equal(res.status, 200, `Status ${status} should succeed`);
    const body = (await res.json()) as {
      lead: {
        outreachStatus: string;
        boardCreated: boolean;
        travelersJoined: number;
      };
    };
    assert.equal(body.lead.outreachStatus, status);
    if (status === "first_traveler_joined") {
      assert.equal(body.lead.boardCreated, true);
      assert.ok(body.lead.travelersJoined >= 1);
    }
  }

  // 3. Log a call + follow-up + board + travelers joined on Bond & Beyond
  const logRes = await outreachPost(
    new Request("https://destinationcommandcenter.com/api/admin/outreach", {
      method: "POST",
      headers: authedHeaders,
      body: JSON.stringify({
        leadId: "bond_and_beyond",
        logTouchChannel: "call",
        outreachStatus: "interested",
        followUpDate: "2026-11-16",
        notes: "Spoke with organizer; reviewing April 16 Norwegian Escape board.",
        boardShareCode: "BOND2027ESCAPE",
        boardCreated: true,
        travelersJoined: 14,
      }),
    }),
  );
  assert.equal(logRes.status, 200);
  const logBody = (await logRes.json()) as {
    lead: {
      outreachStatus: string;
      hasSentOutreach: boolean;
      outreachCount: number;
      followUpDate: string | null;
      boardCreated: boolean;
      boardShareCode: string | null;
      boardUrl: string | null;
      travelersJoined: number;
      notes: string;
    };
  };
  assert.equal(logBody.lead.outreachStatus, "interested");
  assert.equal(logBody.lead.hasSentOutreach, true);
  assert.equal(logBody.lead.outreachCount, 1);
  assert.equal(logBody.lead.followUpDate, "2026-11-16");
  assert.equal(logBody.lead.boardCreated, true);
  assert.equal(
    logBody.lead.boardUrl,
    "https://cruisepromenade.com/p/BOND2027ESCAPE",
  );
  assert.equal(logBody.lead.travelersJoined, 14);

  // 4. Create a custom organizer lead and delete it cleanly
  const createRes = await outreachPost(
    new Request("https://destinationcommandcenter.com/api/admin/outreach", {
      method: "POST",
      headers: authedHeaders,
      body: JSON.stringify({
        action: "create",
        leadName: "Creators at Sea 2027",
        organizerRole: "Founder",
        phone: "(305) 987-6543",
        cruiseLine: "Royal Caribbean International",
        hostedCruiseAndSailing: "Wonder of the Seas · May 2027 (Qualify exact date)",
        qualificationStatus: "needs_sailing_qualification",
        notes: "Inbound podcast organizer lead.",
      }),
    }),
  );
  assert.equal(createRes.status, 201);
  const createBody = (await createRes.json()) as {
    lead: { leadId: string; phoneDial: string | null };
    dashboard: { kpis: { totalLeadsCount: number; phoneLeadsCount: number } };
  };
  assert.equal(createBody.lead.leadId, "creators_at_sea_2027");
  assert.equal(createBody.lead.phoneDial, "+13059876543");
  assert.equal(createBody.dashboard.kpis.totalLeadsCount, 45);
  assert.equal(createBody.dashboard.kpis.phoneLeadsCount, 41);

  const delRes = await outreachPost(
    new Request("https://destinationcommandcenter.com/api/admin/outreach", {
      method: "POST",
      headers: authedHeaders,
      body: JSON.stringify({
        action: "delete_or_reset",
        leadId: "creators_at_sea_2027",
      }),
    }),
  );
  assert.equal(delRes.status, 200);
  const delBody = (await delRes.json()) as {
    dashboard: { kpis: { totalLeadsCount: number } };
  };
  assert.equal(delBody.dashboard.kpis.totalLeadsCount, 44);
});

test("112d. Live Cruise Promenade corridor telemetry enriches Board Created and Travelers Joined while excluding synthetic test traffic", async () => {
  process.env.DCC_ISOLATED_TEST_DB = "1";
  resetInMemoryOrganizerOutreachForTests();

  const snap = await getOrganizerOutreachDashboard({
    scope: "nonprod",
    corridorEventsOverride: [
      {
        sessionId: "sess_real_org_1",
        sourcePage:
          "/sailings/celebrity-beyond/2027-01-17?utm_source=cmmc_at_sea&utm_medium=hosted_organizer",
        occurredAt: "2026-11-14T14:00:00.000Z",
        metadata: {
          site: "cruise-promenade",
          original_event_name: "sailing_page_viewed",
          context: { utmSource: "cmmc_at_sea" },
        },
      },
      {
        sessionId: "sess_real_org_1",
        sourcePage: "/p/CMMC2027BOARD",
        occurredAt: "2026-11-14T14:03:00.000Z",
        metadata: {
          site: "cruise-promenade",
          original_event_name: "board_created",
          context: { shareCode: "CMMC2027BOARD" },
        },
      },
      {
        sessionId: "sess_real_org_1",
        sourcePage: "/p/CMMC2027BOARD",
        occurredAt: "2026-11-14T14:15:00.000Z",
        metadata: {
          site: "cruise-promenade",
          original_event_name: "first_guest_joined",
          context: { shareCode: "CMMC2027BOARD" },
        },
      },
      {
        sessionId: "smoke_session_99",
        sourcePage: "/sailings/norwegian-escape/2027-04-16?utm_source=bond_and_beyond",
        occurredAt: "2026-11-14T14:20:00.000Z",
        metadata: {
          site: "cruise-promenade",
          original_event_name: "board_created",
          context: { shareCode: "TEST-BOARD-99", utmSource: "bond_and_beyond" },
        },
      },
    ],
  });

  const cmmc = snap.leads.find((l) => l.leadId === "cmmc_at_sea")!;
  assert.equal(cmmc.telemetry.sailingViewsCount, 1);
  assert.equal(cmmc.telemetry.boardsCreatedCount, 1);
  assert.equal(cmmc.boardCreated, true);
  assert.equal(cmmc.boardShareCode, "CMMC2027BOARD");
  assert.equal(cmmc.travelersJoined, 1);

  const bond = snap.leads.find((l) => l.leadId === "bond_and_beyond")!;
  assert.equal(bond.boardCreated, false);
  assert.equal(bond.telemetry.boardsCreatedCount, 0);
});

test("112e. Serverless runtime fails closed if Postgres is unavailable (never fakes durability in memory)", async () => {
  const prevVercel = process.env.VERCEL;
  const prevIsolated = process.env.DCC_ISOLATED_TEST_DB;
  process.env.VERCEL = "1";
  process.env.DCC_ISOLATED_TEST_DB = "1";

  try {
    const res = await updateOrganizerOutreachLead({
      leadId: "bond_and_beyond",
      outreachStatus: "called_spoke",
      scope: "nonprod",
    });
    assert.equal(res.ok, false);
    assert.equal(res.backend, "none");
    assert.match(res.error || "", /Postgres/i);
  } finally {
    if (prevVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prevVercel;
    if (prevIsolated === undefined) delete process.env.DCC_ISOLATED_TEST_DB;
    else process.env.DCC_ISOLATED_TEST_DB = prevIsolated;
  }
});
