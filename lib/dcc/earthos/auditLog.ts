import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

export type EarthOSAuditSeverity = "info" | "watch" | "high" | "critical";

export type EarthOSAuditEvent = {
  eventType: string;
  entity: "redrocks" | "gosno" | "alaska" | "earthos";
  corridorId?: string;
  severity: EarthOSAuditSeverity;
  summary: string;
  metadata?: Record<string, unknown>;
};

export type StoredEarthOSAuditEvent = EarthOSAuditEvent & {
  version: "earthos-audit.v1";
  recordedAt: string;
  metadata: Record<string, unknown>;
};

const auditLogPath = path.join(process.cwd(), "data/dcc/earthos/audit-log.jsonl");

export function appendEarthOSAuditEvent(event: EarthOSAuditEvent) {
  const entry = {
    version: "earthos-audit.v1",
    recordedAt: new Date().toISOString(),
    ...event,
    metadata: event.metadata || {},
  };

  mkdirSync(path.dirname(auditLogPath), { recursive: true });
  appendFileSync(auditLogPath, `${JSON.stringify(entry)}\n`);

  return entry;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeAuditEntry(value: unknown): StoredEarthOSAuditEvent | null {
  if (!isRecord(value)) return null;
  if (value.version !== "earthos-audit.v1") return null;
  if (typeof value.recordedAt !== "string") return null;
  if (typeof value.eventType !== "string") return null;
  if (typeof value.summary !== "string") return null;

  return {
    version: "earthos-audit.v1",
    recordedAt: value.recordedAt,
    eventType: value.eventType,
    entity: String(value.entity || "earthos") as EarthOSAuditEvent["entity"],
    corridorId: typeof value.corridorId === "string" ? value.corridorId : undefined,
    severity: String(value.severity || "info") as EarthOSAuditSeverity,
    summary: value.summary,
    metadata: isRecord(value.metadata) ? value.metadata : {},
  };
}

export function listEarthOSAuditEvents(options: { recoveryMissionId?: string; limit?: number } = {}) {
  if (!existsSync(auditLogPath)) return [];

  const events = readFileSync(auditLogPath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return normalizeAuditEntry(JSON.parse(line));
      } catch {
        return null;
      }
    })
    .filter((entry): entry is StoredEarthOSAuditEvent => Boolean(entry))
    .filter((entry) => {
      if (!options.recoveryMissionId) return true;
      return entry.metadata.recoveryMissionId === options.recoveryMissionId;
    })
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));

  return events.slice(0, options.limit || 20);
}
