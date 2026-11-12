import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { buildOwnerControlCenterSnapshot } from "@/lib/dcc/ownerControlCenter";
import {
  buildCruisePromenadeConversionFunnelSummary,
  CRUISE_PROMENADE_FUNNEL_EVENTS,
} from "@/lib/dcc/telemetry/cruisePromenadeFunnel";
import { POST as postNetworkTelemetry } from "@/app/api/network/telemetry/route";

test("Cruise Promenade 8-stage conversion funnel aggregates genuine events, excludes synthetic QA runs, and surfaces uninvited board starts in Owner Control Center", async () => {
  const now = "2026-11-12T03:00:00.000Z";
  const startIso = "2026-10-15T03:00:00.000Z";
  const endIso = "2026-11-12T03:10:00.000Z";

  const mockEvents = [
    // Organizer 1: full journey through guest RSVP + inquiry open & submit
    {
      corridorId: "portfolio-network",
      eventName: "page_viewed",
      sessionId: "cp_org_1",
      occurredAt: new Date("2026-11-12T01:00:00.000Z"),
      metadata: {
        site: "cruise-promenade",
        original_event_name: "sailing_page_viewed",
        context: { shipSlug: "symphony-of-the-seas", sailDate: "2027-01-03", isIndexable: true },
      },
    },
    {
      corridorId: "portfolio-network",
      eventName: "cta_clicked_primary",
      sessionId: "cp_org_1",
      occurredAt: new Date("2026-11-12T01:01:00.000Z"),
      metadata: {
        site: "cruise-promenade",
        original_event_name: "start_board_selected",
        context: { surface: "sailing_detail", ship: "Symphony of the Seas", sailDate: "2027-01-03" },
      },
    },
    {
      corridorId: "portfolio-network",
      eventName: "plan_rendered",
      sessionId: "cp_org_1",
      occurredAt: new Date("2026-11-12T01:02:00.000Z"),
      metadata: {
        site: "cruise-promenade",
        original_event_name: "board_created",
        context: {
          surface: "matched_schedule_confirmation",
          ship: "Symphony of the Seas",
          sailDate: "2027-01-03",
          shareCode: "FAM-7721",
        },
      },
    },
    {
      corridorId: "portfolio-network",
      eventName: "cta_clicked_primary",
      sessionId: "cp_org_1",
      occurredAt: new Date("2026-11-12T01:03:00.000Z"),
      metadata: {
        site: "cruise-promenade",
        original_event_name: "invite_link_copied_or_shared",
        context: { surface: "share_panel", method: "copy", shareCode: "FAM-7721" },
      },
    },
    {
      corridorId: "portfolio-network",
      eventName: "plan_modified",
      sessionId: "cp_guest_1",
      occurredAt: new Date("2026-11-12T01:10:00.000Z"),
      metadata: {
        site: "cruise-promenade",
        original_event_name: "first_guest_joined",
        context: { shareCode: "FAM-7721", method: "self_join", partySize: 4 },
      },
    },
    {
      corridorId: "portfolio-network",
      eventName: "plan_modified",
      sessionId: "cp_guest_1",
      occurredAt: new Date("2026-11-12T01:12:00.000Z"),
      metadata: {
        site: "cruise-promenade",
        original_event_name: "first_activity_response",
        context: { shareCode: "FAM-7721", activityId: "act-1", status: "joining" },
      },
    },
    {
      corridorId: "portfolio-network",
      eventName: "cta_clicked_primary",
      sessionId: "cp_org_1",
      occurredAt: new Date("2026-11-12T01:15:00.000Z"),
      metadata: {
        site: "cruise-promenade",
        original_event_name: "charter_inquiry_opened",
        context: { surface: "planner_charter_card", portSlug: "juneau", guests: 8 },
      },
    },
    {
      corridorId: "portfolio-network",
      eventName: "lead_captured",
      sessionId: "cp_org_1",
      occurredAt: new Date("2026-11-12T01:17:00.000Z"),
      metadata: {
        site: "cruise-promenade",
        original_event_name: "charter_inquiry_submitted",
        context: { inquiryId: "inq_101", ship: "Symphony of the Seas", sailDate: "2027-01-03", travelerCount: 8 },
      },
    },
    // Organizer 2: starts a board (`board_created`) on Eurodam 2027-05-22 and FAILS to invite anyone!
    {
      corridorId: "portfolio-network",
      eventName: "page_viewed",
      sessionId: "cp_org_2",
      occurredAt: new Date("2026-11-12T02:00:00.000Z"),
      metadata: {
        site: "cruise-promenade",
        original_event_name: "sailing_page_viewed",
        context: { shipSlug: "eurodam", sailDate: "2027-05-22", isIndexable: true },
      },
    },
    {
      corridorId: "portfolio-network",
      eventName: "plan_rendered",
      sessionId: "cp_org_2",
      occurredAt: new Date("2026-11-12T02:04:00.000Z"),
      metadata: {
        site: "cruise-promenade",
        original_event_name: "board_created",
        context: {
          surface: "matched_schedule_confirmation",
          ship: "Eurodam",
          sailDate: "2027-05-22",
          shareCode: "REUN-8840",
        },
      },
    },
    // Synthetic Playwright probe: must be excluded from genuine funnel counts
    {
      corridorId: "portfolio-network",
      eventName: "plan_rendered",
      sessionId: "pw_e2e_session",
      occurredAt: new Date(now),
      metadata: {
        site: "cruise-promenade",
        original_event_name: "board_created",
        context: {
          surface: "playwright",
          ship: "Norwegian Jewel",
          sailDate: "2026-10-15",
          shareCode: "E2E-9999",
        },
      },
    },
  ];

  const summary = buildCruisePromenadeConversionFunnelSummary({
    events: mockEvents as any,
    startIso,
    endIso,
    windowLabel: "Last 28 Days",
  });

  assert.equal(summary.stages.length, 8);
  assert.deepEqual(
    summary.stages.map((s) => s.eventName),
    [...CRUISE_PROMENADE_FUNNEL_EVENTS],
  );
  assert.equal(summary.excludedSyntheticEvents28d, 1);
  assert.equal(summary.stages[0].uniqueSessionsCount, 2); // sailing_page_viewed
  assert.equal(summary.stages[1].uniqueSessionsCount, 1); // start_board_selected
  assert.equal(summary.stages[2].uniqueSessionsCount, 2); // board_created
  assert.equal(summary.stages[3].uniqueSessionsCount, 1); // invite_link_copied_or_shared
  assert.equal(summary.stages[4].uniqueSessionsCount, 1); // first_guest_joined
  assert.equal(summary.stages[5].uniqueSessionsCount, 1); // first_activity_response
  assert.equal(summary.stages[6].uniqueSessionsCount, 1); // charter_inquiry_opened
  assert.equal(summary.stages[7].uniqueSessionsCount, 1); // charter_inquiry_submitted

  // Exact Item #6 interview watchpoint: Organizer 2 started REUN-8840 and never shared/invited
  assert.equal(summary.startedWithoutInvitingCount, 1);
  assert.equal(summary.recentUninvitedStarts.length, 1);
  assert.equal(summary.recentUninvitedStarts[0].shareCode, "REUN-8840");
  assert.equal(summary.recentUninvitedStarts[0].ship, "Eurodam");

  // Confirm Owner Control Center snapshot surfaces `conversionFunnel28d` under `dailyBusinessCockpit.operatorAndOrganizerFollowUps.cruisePromenadeLaunch`
  const snapshot = await buildOwnerControlCenterSnapshot({
    env: {
      ...process.env,
      DCC_DISABLE_NEON_COMMERCE: "1",
    },
    corridorEventsOverride: mockEvents as any,
  });

  const cpFunnelInOwner =
    snapshot.dailyBusinessCockpit.operatorAndOrganizerFollowUps.cruisePromenadeLaunch
      .conversionFunnel28d;
  assert.ok(cpFunnelInOwner);
  assert.equal(cpFunnelInOwner.stages.length, 8);
  assert.equal(cpFunnelInOwner.startedWithoutInvitingCount, 1);
  assert.equal(cpFunnelInOwner.recentUninvitedStarts[0].shareCode, "REUN-8840");

  // Confirm `/api/network/telemetry` accepts all 8 Cruise Promenade funnel events cleanly
  for (const eventName of CRUISE_PROMENADE_FUNNEL_EVENTS) {
    const req = new NextRequest("https://www.destinationcommandcenter.com/api/network/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        site: "cruise-promenade",
        eventName,
        sessionId: "smoke_verify_telemetry_accept",
        sourcePage: "/sailings/symphony-of-the-seas/2027-01-03",
        context: { isTest: true },
      }),
    });
    const res = await postNetworkTelemetry(req);
    assert.equal(res.status, 200);
  }
});
