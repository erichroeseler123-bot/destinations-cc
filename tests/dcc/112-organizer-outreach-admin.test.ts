import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_SESSION_COOKIE, buildAdminSessionValue } from "@/lib/adminAccess";
import {
  GET as outreachGet,
  POST as outreachPost,
} from "@/app/api/admin/outreach/route";
import {
  HOSTED_ORGANIZER_CORE_PITCH,
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

test("112b. Seeded pipeline surfaces all 8 prospects, 3 phone leads (#1 Bond & Beyond), honest 0 sent count, verbatim pitch, and strict hold guardrails", async () => {
  process.env.DCC_ISOLATED_TEST_DB = "1";
  resetInMemoryOrganizerOutreachForTests();

  const snap = await getOrganizerOutreachDashboard({
    scope: "nonprod",
    corridorEventsOverride: [],
  });

  assert.equal(snap.kpis.totalLeadsCount, 8);
  assert.equal(snap.kpis.phoneLeadsCount, 3);
  assert.equal(snap.kpis.qualifiedReadyCount, 5);
  assert.equal(snap.kpis.heldOrNeedsQualificationCount, 3);
  assert.equal(snap.kpis.outreachSentLeadsCount, 0);
  assert.equal(snap.kpis.totalOutreachTouchesCount, 0);
  assert.equal(snap.corePitchVerbatim, HOSTED_ORGANIZER_CORE_PITCH);

  // #1 immediate call is Bond & Beyond with SMS invited & live qualified page
  const bond = snap.leads[0];
  assert.equal(bond.leadId, "bond_and_beyond");
  assert.equal(bond.phone, "(904) 295-1212");
  assert.equal(bond.phoneDial, "+19042951212");
  assert.equal(bond.phoneInvitesText, true);
  assert.equal(bond.qualificationStatus, "qualified_page_live");
  assert.ok(
    bond.sailingPageUrl?.includes(
      "https://cruisepromenade.com/sailings/norwegian-escape/2027-04-16?utm_source=bond_and_beyond",
    ),
  );
  assert.ok(bond.phoneOrTextScript.includes(HOSTED_ORGANIZER_CORE_PITCH));

  // #2 WSBA and #3 Dancecation have verified phones but strictly hold live sailing URLs
  const wsba = snap.leads.find((l) => l.leadId === "wsba_cruise");
  assert.ok(wsba);
  assert.equal(wsba.phone, "(412) 606-0227");
  assert.equal(wsba.qualificationStatus, "held_schedule_conflict");
  assert.equal(wsba.sailingPageUrl, null);

  const dance = snap.leads.find((l) => l.leadId === "dancecation_at_sea");
  assert.ok(dance);
  assert.equal(dance.phone, "757-870-3709");
  assert.equal(dance.qualificationStatus, "needs_sailing_qualification");
  assert.equal(dance.sailingPageUrl, null);

  const momentum = snap.leads.find((l) => l.leadId === "momentum_at_sea");
  assert.ok(momentum);
  assert.equal(momentum.qualificationStatus, "held_schedule_conflict");
  assert.equal(momentum.sailingPageUrl, null);
});

test("112c. Admin API updates call/email status, follow-up date, notes, board created, travelers joined, enforces hold URL rules, and supports custom lead lifecycle", async () => {
  process.env.DCC_ISOLATED_TEST_DB = "1";
  process.env.ADMIN_ACCESS_KEY = "test-admin-secret-outreach-112";
  resetInMemoryOrganizerOutreachForTests();

  const cookieVal = buildAdminSessionValue("test-admin-secret-outreach-112");
  const authedHeaders = {
    "Content-Type": "application/json",
    cookie: `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(cookieVal)}`,
  };

  // 1. Attempt to attach a sailing URL while WSBA is still held -> URL remains null
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

  // 2. Log a call + follow-up + board + travelers joined on Bond & Beyond
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
    dashboard: {
      kpis: {
        outreachSentLeadsCount: number;
        repliedCount: number;
        boardsCreatedCount: number;
        travelersJoinedCount: number;
      };
    };
  };
  assert.equal(logBody.lead.outreachStatus, "interested");
  assert.equal(logBody.lead.hasSentOutreach, true);
  assert.equal(logBody.lead.outreachCount, 1);
  assert.equal(logBody.lead.followUpDate, "2026-11-16");
  assert.equal(logBody.lead.boardCreated, true);
  assert.equal(logBody.lead.boardShareCode, "BOND2027ESCAPE");
  assert.equal(
    logBody.lead.boardUrl,
    "https://cruisepromenade.com/p/BOND2027ESCAPE",
  );
  assert.equal(logBody.lead.travelersJoined, 14);
  assert.match(logBody.lead.notes, /Spoke with organizer/);
  assert.equal(logBody.dashboard.kpis.outreachSentLeadsCount, 1);
  assert.equal(logBody.dashboard.kpis.repliedCount, 1);
  assert.equal(logBody.dashboard.kpis.boardsCreatedCount, 1);
  assert.equal(logBody.dashboard.kpis.travelersJoinedCount, 14);

  // 3. Create a new custom organizer lead and then delete it cleanly
  const createRes = await outreachPost(
    new Request("https://destinationcommandcenter.com/api/admin/outreach", {
      method: "POST",
      headers: authedHeaders,
      body: JSON.stringify({
        action: "create",
        leadName: "Creators at Sea 2027",
        phone: "(305) 987-6543",
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
  assert.equal(createBody.dashboard.kpis.totalLeadsCount, 9);
  assert.equal(createBody.dashboard.kpis.phoneLeadsCount, 4);

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
  assert.equal(delBody.dashboard.kpis.totalLeadsCount, 8);
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
      // Synthetic QA event must be ignored
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
