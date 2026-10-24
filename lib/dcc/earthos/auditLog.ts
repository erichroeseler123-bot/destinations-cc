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

function getMemoryAuditBuffer(): StoredEarthOSAuditEvent[] {
  const globalStore = globalThis as typeof globalThis & {
    __earthosAuditEvents?: StoredEarthOSAuditEvent[];
  };
  if (!globalStore.__earthosAuditEvents) {
    globalStore.__earthosAuditEvents = [];
  }
  return globalStore.__earthosAuditEvents;
}

export function appendEarthOSAuditEvent(event: EarthOSAuditEvent): StoredEarthOSAuditEvent {
  const entry: StoredEarthOSAuditEvent = {
    version: "earthos-audit.v1",
    recordedAt: new Date().toISOString(),
    ...event,
    metadata: event.metadata || {},
  };

  const buffer = getMemoryAuditBuffer();
  buffer.unshift(entry);

  try {
    mkdirSync(path.dirname(auditLogPath), { recursive: true });
    appendFileSync(auditLogPath, `${JSON.stringify(entry)}\n`);
  } catch {
    // Read-only filesystem fallback: entry remains durable in memory buffer
  }

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

export function listEarthOSAuditEvents(
  options: { recoveryMissionId?: string; corridorId?: string; eventType?: string; limit?: number } = {},
): StoredEarthOSAuditEvent[] {
  const diskEvents: StoredEarthOSAuditEvent[] = [];
  try {
    if (existsSync(auditLogPath)) {
      const parsed = readFileSync(auditLogPath, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          try {
            return normalizeAuditEntry(JSON.parse(line));
          } catch {
            return null;
          }
        })
        .filter((entry): entry is StoredEarthOSAuditEvent => Boolean(entry));
      diskEvents.push(...parsed);
    }
  } catch {
    // Ignore filesystem read errors and rely on memory buffer
  }

  const combined = [...getMemoryAuditBuffer(), ...diskEvents];
  const deduped = new Map<string, StoredEarthOSAuditEvent>();
  for (const item of combined) {
    const key = `${item.recordedAt}:${item.eventType}:${item.summary}`;
    if (!deduped.has(key)) {
      deduped.set(key, item);
    }
  }

  const events = [...deduped.values()]
    .filter((entry) => {
      if (options.recoveryMissionId && entry.metadata.recoveryMissionId !== options.recoveryMissionId) {
        return false;
      }
      if (options.corridorId && entry.corridorId !== options.corridorId) {
        return false;
      }
      if (options.eventType && entry.eventType !== options.eventType) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));

  return events.slice(0, options.limit || 20);
}
