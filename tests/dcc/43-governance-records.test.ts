import test from "node:test";
import assert from "node:assert/strict";
import {
  appendGovernanceDriftEvent,
  buildGovernanceDriftReport,
  describeGovernanceDriftEvent,
  createGovernanceRecordService,
  createMemoryGovernanceRecordsStore,
  type NewGovernanceDriftEvent,
} from "@/lib/dcc/earthos/governanceRecords";

const driftEvent: NewGovernanceDriftEvent = {
  id: "drift-test-1",
  createdAt: "2026-05-10T00:00:00.000Z",
  sourceSurface: "dcc-dashboard-map",
  affectedSurface: "shuttleya-argo",
  corridorId: "argo",
  eventType: "machine_understanding_drift",
  severity: "blocked",
  status: "open",
  findingId: "control-map:shuttleya:mighty-argo-continuity",
  summary: "Argo continuity reopened after crawler saw a cold hop.",
  evidenceJson: {
    route: "/mighty-argo-shuttle",
    observedStatus: 404,
  },
  expectedRole: "decision",
  observedRole: "redirect",
  continuityState: "reopened_decision_state",
  machineInterpretationRisk: "high",
};

test("governance records insert drift events", async () => {
  const service = createGovernanceRecordService(createMemoryGovernanceRecordsStore());

  const inserted = await service.appendDriftEvent(driftEvent);

  assert.ok(inserted);
  assert.equal(inserted.id, "drift-test-1");
  assert.equal(inserted.findingId, "control-map:shuttleya:mighty-argo-continuity");
  assert.equal(inserted.evidenceJson.observedStatus, 404);
});

test("governance records list recent drift events newest first", async () => {
  const service = createGovernanceRecordService(createMemoryGovernanceRecordsStore());

  await service.appendDriftEvent(driftEvent);
  await service.appendDriftEvent({
    ...driftEvent,
    id: "drift-test-2",
    createdAt: "2026-05-10T01:00:00.000Z",
    summary: "Newer drift event.",
  });

  const events = await service.listRecentDriftEvents(2);

  assert.ok(events);
  assert.equal(events.length, 2);
  assert.equal(events[0].id, "drift-test-2");
  assert.equal(events[1].id, "drift-test-1");
});

test("governance records create reconciliation packets", async () => {
  const service = createGovernanceRecordService(createMemoryGovernanceRecordsStore());

  const packet = await service.createReconciliationPacket({
    id: "packet-test-1",
    createdAt: "2026-05-10T02:00:00.000Z",
    packetType: "control_map_reconciliation",
    status: "proposed",
    proposedChangesJson: {
      events: ["drift-test-1"],
    },
    affectedRoutesJson: ["/mighty-argo-shuttle"],
    affectedSurfacesJson: ["destinationcommandcenter.com", "shuttleya.com"],
    reason: "Computed topology differs from durable governance state.",
    approvalRequired: true,
  });

  assert.ok(packet);
  assert.equal(packet.status, "proposed");
  assert.equal(packet.approvalRequired, true);
  assert.deepEqual(packet.affectedRoutesJson, ["/mighty-argo-shuttle"]);
});

test("governance records require approval before applying reconciliation packets", async () => {
  const service = createGovernanceRecordService(createMemoryGovernanceRecordsStore());

  await service.createReconciliationPacket({
    id: "packet-test-2",
    createdAt: "2026-05-10T02:00:00.000Z",
    packetType: "control_map_reconciliation",
    status: "proposed",
    proposedChangesJson: {
      events: ["drift-test-1"],
    },
    affectedRoutesJson: ["/mighty-argo-shuttle"],
    affectedSurfacesJson: ["destinationcommandcenter.com"],
    reason: "Approval gate regression test.",
    approvalRequired: true,
  });

  const prematureApply = await service.markPacketApplied("packet-test-2", {
    applied: true,
  });
  assert.equal(prematureApply, null);

  const approved = await service.markPacketApproved("packet-test-2", "earthos-operator", "2026-05-10T03:00:00.000Z");
  assert.ok(approved);
  assert.equal(approved.status, "approved");
  assert.equal(approved.approvedBy, "earthos-operator");

  const applied = await service.markPacketApplied("packet-test-2", {
    applied: true,
  }, "2026-05-10T04:00:00.000Z");
  assert.ok(applied);
  assert.equal(applied.status, "applied");
  assert.deepEqual(applied.resultJson, { applied: true });
});

test("governance records fallback without database credentials", async () => {
  const previous = {
    DCC_DATABASE_URL: process.env.DCC_DATABASE_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    POSTGRES_URL: process.env.POSTGRES_URL,
  };

  delete process.env.DCC_DATABASE_URL;
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;

  try {
    const result = await appendGovernanceDriftEvent({
      ...driftEvent,
      id: "drift-without-db",
    });

    assert.equal(result, null);
  } finally {
    if (previous.DCC_DATABASE_URL) process.env.DCC_DATABASE_URL = previous.DCC_DATABASE_URL;
    if (previous.DATABASE_URL) process.env.DATABASE_URL = previous.DATABASE_URL;
    if (previous.POSTGRES_URL) process.env.POSTGRES_URL = previous.POSTGRES_URL;
  }
});

test("governance drift report prioritizes machine interpretation risk and tracks velocity", async () => {
  const service = createGovernanceRecordService(createMemoryGovernanceRecordsStore());

  await service.appendDriftEvent({
    ...driftEvent,
    id: "drift-low-risk",
    createdAt: "2026-05-09T00:00:00.000Z",
    severity: "watch",
    machineInterpretationRisk: "low",
  });
  await service.appendDriftEvent({
    ...driftEvent,
    id: "drift-high-risk",
    createdAt: "2026-05-10T00:00:00.000Z",
    severity: "blocked",
    machineInterpretationRisk: "high",
  });

  const events = await service.listRecentDriftEvents(10);
  assert.ok(events);

  const report = buildGovernanceDriftReport(events, new Date("2026-05-10T12:00:00.000Z"));

  assert.equal(report.events[0].id, "drift-high-risk");
  assert.equal(report.velocity.current24h, 1);
  assert.equal(report.velocity.previous24h, 1);
  assert.equal(report.velocity.direction, "flat");
  assert.equal(report.highRiskCount, 1);
});

test("governance drift summaries expose expected versus observed state", () => {
  const summary = describeGovernanceDriftEvent({
    ...driftEvent,
    id: "drift-summary",
    createdAt: "2026-05-10T00:00:00.000Z",
    findingId: driftEvent.findingId || null,
    expectedRole: "decision",
    observedRole: "redirect",
    resolvedAt: null,
    resolvedBy: null,
  });

  assert.match(summary, /expected decision/);
  assert.match(summary, /observed redirect/);
  assert.match(summary, /Risk: high/);
});
