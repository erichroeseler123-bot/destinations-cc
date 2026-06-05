import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";
import {
  governanceDriftEvents,
  governanceFindingsHistory,
  governanceReconciliationPackets,
} from "@/lib/db/schema";

export type GovernanceRecordStatus = "open" | "acknowledged" | "resolved" | "proposed" | "approved" | "applied" | "rejected";
export type GovernanceRecordSeverity = "info" | "watch" | "blocked" | "critical";

export type GovernanceDriftEvent = {
  id: string;
  createdAt: string;
  sourceSurface: string;
  affectedSurface: string;
  corridorId: string;
  eventType: string;
  severity: GovernanceRecordSeverity;
  status: GovernanceRecordStatus;
  findingId: string | null;
  summary: string;
  evidenceJson: Record<string, unknown>;
  expectedRole: string | null;
  observedRole: string | null;
  continuityState: string | null;
  machineInterpretationRisk: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
};

export type NewGovernanceDriftEvent = Omit<GovernanceDriftEvent, "id" | "createdAt" | "resolvedAt" | "resolvedBy"> & {
  id?: string;
  createdAt?: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
};

export type GovernanceReconciliationPacket = {
  id: string;
  createdAt: string;
  packetType: string;
  status: GovernanceRecordStatus;
  proposedChangesJson: Record<string, unknown>;
  affectedRoutesJson: unknown[];
  affectedSurfacesJson: unknown[];
  reason: string;
  approvalRequired: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  appliedAt: string | null;
  resultJson: Record<string, unknown> | null;
};

export type GovernanceDriftVelocity = {
  current24h: number;
  previous24h: number;
  direction: "up" | "down" | "flat";
  delta: number;
};

export type GovernanceDriftReport = {
  generatedAt: string;
  events: GovernanceDriftEvent[];
  velocity: GovernanceDriftVelocity;
  highRiskCount: number;
  openCount: number;
};

export type NewGovernanceReconciliationPacket = Omit<
  GovernanceReconciliationPacket,
  "id" | "createdAt" | "approvedAt" | "approvedBy" | "appliedAt" | "resultJson"
> & {
  id?: string;
  createdAt?: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
  appliedAt?: string | null;
  resultJson?: Record<string, unknown> | null;
};

export type GovernanceRecordsStore = {
  appendDriftEvent(event: GovernanceDriftEvent): Promise<GovernanceDriftEvent | null>;
  listRecentDriftEvents(limit?: number): Promise<GovernanceDriftEvent[] | null>;
  createReconciliationPacket(packet: GovernanceReconciliationPacket): Promise<GovernanceReconciliationPacket | null>;
  listRecentReconciliationPackets(limit?: number): Promise<GovernanceReconciliationPacket[] | null>;
  markPacketApproved(id: string, approvedBy: string, approvedAt: string): Promise<GovernanceReconciliationPacket | null>;
  markPacketApplied(id: string, resultJson: Record<string, unknown>, appliedAt: string): Promise<GovernanceReconciliationPacket | null>;
};

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeSeverity(value: string): GovernanceRecordSeverity {
  if (value === "info" || value === "blocked" || value === "critical") return value;
  return "watch";
}

function normalizeStatus(value: string): GovernanceRecordStatus {
  if (
    value === "acknowledged" ||
    value === "resolved" ||
    value === "proposed" ||
    value === "approved" ||
    value === "applied" ||
    value === "rejected"
  ) {
    return value;
  }
  return "open";
}

function riskWeight(value: string): number {
  const normalized = value.trim().toLowerCase();
  if (normalized === "critical" || normalized === "high") return 3;
  if (normalized === "medium" || normalized === "watch") return 2;
  if (normalized === "low" || normalized === "info") return 1;
  return 0;
}

function severityWeight(value: GovernanceRecordSeverity): number {
  if (value === "critical") return 4;
  if (value === "blocked") return 3;
  if (value === "watch") return 2;
  return 1;
}

export function sortGovernanceDriftEvents(events: GovernanceDriftEvent[]): GovernanceDriftEvent[] {
  return [...events].sort((a, b) => {
    return (
      riskWeight(b.machineInterpretationRisk) - riskWeight(a.machineInterpretationRisk) ||
      severityWeight(b.severity) - severityWeight(a.severity) ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });
}

export function buildGovernanceDriftVelocity(
  events: GovernanceDriftEvent[],
  now = new Date(),
): GovernanceDriftVelocity {
  const nowMs = now.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const currentStart = nowMs - dayMs;
  const previousStart = nowMs - dayMs * 2;

  const current24h = events.filter((event) => {
    const createdAt = new Date(event.createdAt).getTime();
    return createdAt >= currentStart && createdAt <= nowMs;
  }).length;

  const previous24h = events.filter((event) => {
    const createdAt = new Date(event.createdAt).getTime();
    return createdAt >= previousStart && createdAt < currentStart;
  }).length;

  const delta = current24h - previous24h;

  return {
    current24h,
    previous24h,
    delta,
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
  };
}

export function describeGovernanceDriftEvent(event: GovernanceDriftEvent): string {
  const expected = event.expectedRole || "declared governance role";
  const observed = event.observedRole || "observed network behavior";
  const continuity = event.continuityState || "continuity state unknown";

  return `${event.affectedSurface}: expected ${expected}, observed ${observed}. Continuity: ${continuity}. Risk: ${event.machineInterpretationRisk}.`;
}

export function buildGovernanceDriftReport(
  events: GovernanceDriftEvent[],
  now = new Date(),
): GovernanceDriftReport {
  const sorted = sortGovernanceDriftEvents(events);

  return {
    generatedAt: now.toISOString(),
    events: sorted,
    velocity: buildGovernanceDriftVelocity(events, now),
    highRiskCount: events.filter((event) => riskWeight(event.machineInterpretationRisk) >= 3).length,
    openCount: events.filter((event) => event.status === "open" || event.status === "acknowledged").length,
  };
}

function normalizeDriftRow(row: typeof governanceDriftEvents.$inferSelect): GovernanceDriftEvent {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    sourceSurface: row.sourceSurface,
    affectedSurface: row.affectedSurface,
    corridorId: row.corridorId,
    eventType: row.eventType,
    severity: normalizeSeverity(row.severity),
    status: normalizeStatus(row.status),
    findingId: row.findingId,
    summary: row.summary,
    evidenceJson: row.evidenceJson,
    expectedRole: row.expectedRole,
    observedRole: row.observedRole,
    continuityState: row.continuityState,
    machineInterpretationRisk: row.machineInterpretationRisk,
    resolvedAt: toIso(row.resolvedAt),
    resolvedBy: row.resolvedBy,
  };
}

function normalizePacketRow(row: typeof governanceReconciliationPackets.$inferSelect): GovernanceReconciliationPacket {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    packetType: row.packetType,
    status: normalizeStatus(row.status),
    proposedChangesJson: row.proposedChangesJson,
    affectedRoutesJson: row.affectedRoutesJson,
    affectedSurfacesJson: row.affectedSurfacesJson,
    reason: row.reason,
    approvalRequired: row.approvalRequired,
    approvedAt: toIso(row.approvedAt),
    approvedBy: row.approvedBy,
    appliedAt: toIso(row.appliedAt),
    resultJson: row.resultJson,
  };
}

function buildDriftEvent(input: NewGovernanceDriftEvent): GovernanceDriftEvent {
  return {
    ...input,
    id: input.id || `drift-${randomUUID()}`,
    createdAt: input.createdAt || new Date().toISOString(),
    findingId: input.findingId || null,
    expectedRole: input.expectedRole || null,
    observedRole: input.observedRole || null,
    continuityState: input.continuityState || null,
    resolvedAt: input.resolvedAt || null,
    resolvedBy: input.resolvedBy || null,
  };
}

function buildPacket(input: NewGovernanceReconciliationPacket): GovernanceReconciliationPacket {
  return {
    ...input,
    id: input.id || `packet-${randomUUID()}`,
    createdAt: input.createdAt || new Date().toISOString(),
    approvedAt: input.approvedAt || null,
    approvedBy: input.approvedBy || null,
    appliedAt: input.appliedAt || null,
    resultJson: input.resultJson || null,
  };
}

function createDbGovernanceRecordsStore(): GovernanceRecordsStore | null {
  if (!hasDb()) return null;
  const db = getDb();
  if (!db) return null;

  return {
    async appendDriftEvent(event) {
      try {
        await db.insert(governanceDriftEvents).values({
          id: event.id,
          createdAt: new Date(event.createdAt),
          sourceSurface: event.sourceSurface,
          affectedSurface: event.affectedSurface,
          corridorId: event.corridorId,
          eventType: event.eventType,
          severity: event.severity,
          status: event.status,
          findingId: event.findingId,
          summary: event.summary,
          evidenceJson: event.evidenceJson,
          expectedRole: event.expectedRole,
          observedRole: event.observedRole,
          continuityState: event.continuityState,
          machineInterpretationRisk: event.machineInterpretationRisk,
          resolvedAt: event.resolvedAt ? new Date(event.resolvedAt) : null,
          resolvedBy: event.resolvedBy,
        });

        if (event.findingId) {
          await db.insert(governanceFindingsHistory).values({
            findingId: event.findingId,
            driftEventId: event.id,
            eventType: event.eventType,
            status: event.status,
            summary: event.summary,
            metadata: {
              sourceSurface: event.sourceSurface,
              affectedSurface: event.affectedSurface,
              corridorId: event.corridorId,
              machineInterpretationRisk: event.machineInterpretationRisk,
            },
            recordedAt: new Date(event.createdAt),
          });
        }

        return event;
      } catch {
        return null;
      }
    },

    async listRecentDriftEvents(limit = 25) {
      try {
        const rows = await db
          .select()
          .from(governanceDriftEvents)
          .orderBy(desc(governanceDriftEvents.createdAt))
          .limit(limit);

        return rows.map(normalizeDriftRow);
      } catch {
        return null;
      }
    },

    async createReconciliationPacket(packet) {
      try {
        await db.insert(governanceReconciliationPackets).values({
          id: packet.id,
          createdAt: new Date(packet.createdAt),
          packetType: packet.packetType,
          status: packet.status,
          proposedChangesJson: packet.proposedChangesJson,
          affectedRoutesJson: packet.affectedRoutesJson,
          affectedSurfacesJson: packet.affectedSurfacesJson,
          reason: packet.reason,
          approvalRequired: packet.approvalRequired,
          approvedAt: packet.approvedAt ? new Date(packet.approvedAt) : null,
          approvedBy: packet.approvedBy,
          appliedAt: packet.appliedAt ? new Date(packet.appliedAt) : null,
          resultJson: packet.resultJson,
        });
        return packet;
      } catch {
        return null;
      }
    },

    async listRecentReconciliationPackets(limit = 25) {
      try {
        const rows = await db
          .select()
          .from(governanceReconciliationPackets)
          .orderBy(desc(governanceReconciliationPackets.createdAt))
          .limit(limit);

        return rows.map(normalizePacketRow);
      } catch {
        return null;
      }
    },

    async markPacketApproved(id, approvedBy, approvedAt) {
      try {
        const [row] = await db
          .update(governanceReconciliationPackets)
          .set({
            status: "approved",
            approvedAt: new Date(approvedAt),
            approvedBy,
          })
          .where(eq(governanceReconciliationPackets.id, id))
          .returning();

        return row ? normalizePacketRow(row) : null;
      } catch {
        return null;
      }
    },

    async markPacketApplied(id, resultJson, appliedAt) {
      try {
        const [existing] = await db
          .select()
          .from(governanceReconciliationPackets)
          .where(eq(governanceReconciliationPackets.id, id))
          .limit(1);

        if (!existing || (existing.approvalRequired && !existing.approvedAt)) return null;

        const [row] = await db
          .update(governanceReconciliationPackets)
          .set({
            status: "applied",
            appliedAt: new Date(appliedAt),
            resultJson,
          })
          .where(eq(governanceReconciliationPackets.id, id))
          .returning();

        return row ? normalizePacketRow(row) : null;
      } catch {
        return null;
      }
    },
  };
}

export function createMemoryGovernanceRecordsStore(): GovernanceRecordsStore {
  const driftEvents: GovernanceDriftEvent[] = [];
  const packets: GovernanceReconciliationPacket[] = [];

  return {
    async appendDriftEvent(event) {
      driftEvents.push(event);
      return event;
    },
    async listRecentDriftEvents(limit = 25) {
      return [...driftEvents]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    },
    async createReconciliationPacket(packet) {
      packets.push(packet);
      return packet;
    },
    async listRecentReconciliationPackets(limit = 25) {
      return [...packets]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    },
    async markPacketApproved(id, approvedBy, approvedAt) {
      const packet = packets.find((candidate) => candidate.id === id);
      if (!packet) return null;
      packet.status = "approved";
      packet.approvedAt = approvedAt;
      packet.approvedBy = approvedBy;
      return packet;
    },
    async markPacketApplied(id, resultJson, appliedAt) {
      const packet = packets.find((candidate) => candidate.id === id);
      if (!packet || (packet.approvalRequired && !packet.approvedAt)) return null;
      packet.status = "applied";
      packet.appliedAt = appliedAt;
      packet.resultJson = resultJson;
      return packet;
    },
  };
}

export function createGovernanceRecordService(store: GovernanceRecordsStore | null) {
  return {
    async appendDriftEvent(input: NewGovernanceDriftEvent) {
      if (!store) return null;
      return store.appendDriftEvent(buildDriftEvent(input));
    },
    async listRecentDriftEvents(limit = 25) {
      if (!store) return null;
      return store.listRecentDriftEvents(limit);
    },
    async getDriftReport(limit = 100, now = new Date()) {
      if (!store) return null;
      const events = await store.listRecentDriftEvents(limit);
      if (!events) return null;
      return buildGovernanceDriftReport(events, now);
    },
    async createReconciliationPacket(input: NewGovernanceReconciliationPacket) {
      if (!store) return null;
      return store.createReconciliationPacket(buildPacket(input));
    },
    async listRecentReconciliationPackets(limit = 25) {
      if (!store) return null;
      return store.listRecentReconciliationPackets(limit);
    },
    async markPacketApproved(id: string, approvedBy: string, approvedAt = new Date().toISOString()) {
      if (!store) return null;
      return store.markPacketApproved(id, approvedBy, approvedAt);
    },
    async markPacketApplied(id: string, resultJson: Record<string, unknown>, appliedAt = new Date().toISOString()) {
      if (!store) return null;
      return store.markPacketApplied(id, resultJson, appliedAt);
    },
  };
}

function defaultService() {
  return createGovernanceRecordService(createDbGovernanceRecordsStore());
}

export async function appendGovernanceDriftEvent(input: NewGovernanceDriftEvent) {
  return defaultService().appendDriftEvent(input);
}

export async function listRecentGovernanceDriftEvents(limit = 25) {
  return defaultService().listRecentDriftEvents(limit);
}

export async function getGovernanceDriftReport(limit = 100, now = new Date()) {
  return defaultService().getDriftReport(limit, now);
}

export async function createGovernanceReconciliationPacket(input: NewGovernanceReconciliationPacket) {
  return defaultService().createReconciliationPacket(input);
}

export async function listRecentGovernanceReconciliationPackets(limit = 25) {
  return defaultService().listRecentReconciliationPackets(limit);
}

export async function markGovernancePacketApproved(id: string, approvedBy: string, approvedAt = new Date().toISOString()) {
  return defaultService().markPacketApproved(id, approvedBy, approvedAt);
}

export async function markGovernancePacketApplied(
  id: string,
  resultJson: Record<string, unknown>,
  appliedAt = new Date().toISOString(),
) {
  return defaultService().markPacketApplied(id, resultJson, appliedAt);
}
