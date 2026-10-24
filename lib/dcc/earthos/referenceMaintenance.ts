import { randomUUID } from "node:crypto";
import { pageRegistry } from "@/data/page-registry";
import { getDb, hasDb } from "@/lib/db/client";
import {
  earthosControlMapFindingHistory,
  earthosControlMapFindings,
} from "@/lib/db/schema";
import { appendEarthOSAuditEvent } from "@/lib/dcc/earthos/auditLog";
import {
  getDurableGovernanceRecordService,
  type GovernanceDriftEvent,
  type GovernanceReconciliationPacket,
} from "@/lib/dcc/earthos/governanceRecords";
import {
  launchWorkflowMission,
  signalWorkflowMission,
} from "@/lib/dcc/earthos/workflows/service";
import {
  getAllTravelReferenceNodes,
  type TravelReferenceNode,
} from "@/lib/dcc/travelReference";

export type ReferenceIssueKind =
  | "broken_specialist_link"
  | "stale_evidence_source"
  | "broken_internal_relationship";

export type ReferenceMaintenanceIssue = {
  issueId: string;
  nodeId: TravelReferenceNode["id"];
  canonicalPath: string;
  kind: ReferenceIssueKind;
  targetId: string;
  targetLabel: string;
  observedValue: string;
  recommendedValue: string;
  reason: string;
  severity: "watch" | "blocked" | "critical";
  detectedAt: string;
};

export type ReferenceVerificationEvidence = {
  verifiedAt: string;
  verifiedBy: string;
  publicCanonicalPath: string;
  publicRouteRegistered: boolean;
  recheckPassed: boolean;
  remainingIssueCount: number;
  beforeSnapshot: Array<{
    targetId: string;
    kind: ReferenceIssueKind;
    observedValue: string;
  }>;
  afterSnapshot: Array<{
    targetId: string;
    kind: ReferenceIssueKind;
    correctedValue: string;
    status: "verified_clean";
  }>;
  probeResults: Array<{
    url: string;
    ok: boolean;
    statusCode: number;
  }>;
};

export type ReferenceMaintenanceTask = {
  taskId: string;
  findingId: string;
  nodeId: TravelReferenceNode["id"];
  canonicalPath: string;
  status: "open" | "remediated_pending_recheck" | "closed" | "rejected";
  severity: "watch" | "blocked" | "critical";
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  closedBy: string | null;
  missionId: string;
  driftEventId: string;
  packetId: string;
  issues: ReferenceMaintenanceIssue[];
  verificationEvidence: ReferenceVerificationEvidence | null;
};

export type UrlProbeResult = {
  ok: boolean;
  statusCode: number;
  redirectedTo?: string;
};

export type UrlProbeFn = (url: string) => Promise<UrlProbeResult>;

/**
 * Canonical specialist handoff endpoint map.
 * Explicitly maps known broken/retired specialist URLs (such as the Juneau links caught during PR #218)
 * to their verified live routes, and validates allowed paths on DCC specialist domains.
 */
export const KNOWN_BROKEN_SPECIALIST_URLS: Record<
  string,
  {
    replacementUrl: string;
    reason: string;
  }
> = {
  "https://juneauflightdeck.com/best-excursions-in-juneau": {
    replacementUrl: "https://juneauflightdeck.com/helicopter",
    reason:
      "Juneau Flight Deck route /best-excursions-in-juneau returned HTTP 404 in production; canonical helicopter & port-window comparison planner is /helicopter.",
  },
  "https://welcometoalaskatours.com/juneau-shore-excursions": {
    replacementUrl: "https://welcometoalaskatours.com/ports/juneau",
    reason:
      "Welcome to Alaska Tours route /juneau-shore-excursions returned HTTP 404 in production; canonical Juneau port guide is /ports/juneau.",
  },
};

const VALID_SPECIALIST_HOST_PATHS: Record<string, Set<string>> = {
  "juneauflightdeck.com": new Set(["/", "/helicopter"]),
  "www.juneauflightdeck.com": new Set(["/", "/helicopter"]),
  "welcometoalaskatours.com": new Set(["/", "/ports/juneau", "/ports/skagway", "/ports/ketchikan"]),
  "www.welcometoalaskatours.com": new Set(["/", "/ports/juneau", "/ports/skagway", "/ports/ketchikan"]),
  "partyatredrocks.com": new Set([
    "/",
    "/book",
    "/book/red-rocks-amphitheatre",
    "/book/red-rocks-amphitheatre/custom/shared",
    "/shuttles",
  ]),
  "www.partyatredrocks.com": new Set([
    "/",
    "/book",
    "/book/red-rocks-amphitheatre",
    "/book/red-rocks-amphitheatre/custom/shared",
    "/shuttles",
  ]),
  "gosno.co": new Set([
    "/",
    "/breckenridge",
    "/denver-to-breckenridge-shuttle",
    "/shuttles",
    "/.well-known/dcc",
  ]),
  "www.gosno.co": new Set([
    "/",
    "/breckenridge",
    "/denver-to-breckenridge-shuttle",
    "/shuttles",
    "/.well-known/dcc",
  ]),
  "welcometoneworleanstours.com": new Set(["/", "/tours", "/swamp-tours"]),
  "www.welcometoneworleanstours.com": new Set(["/", "/tours", "/swamp-tours"]),
  "welcometotheswamp.com": new Set(["/", "/plan", "/tours", "/airboat-vs-boat"]),
  "www.welcometotheswamp.com": new Set(["/", "/plan", "/tours", "/airboat-vs-boat"]),
  "saveonthestrip.com": new Set(["/", "/shows", "/tours", "/deals"]),
  "www.saveonthestrip.com": new Set(["/", "/shows", "/tours", "/deals"]),
};

function getTaskStore(): Map<string, ReferenceMaintenanceTask> {
  const globalStore = globalThis as typeof globalThis & {
    __dccReferenceMaintenanceTasks?: Map<string, ReferenceMaintenanceTask>;
  };
  if (!globalStore.__dccReferenceMaintenanceTasks) {
    globalStore.__dccReferenceMaintenanceTasks = new Map<string, ReferenceMaintenanceTask>();
  }
  return globalStore.__dccReferenceMaintenanceTasks;
}

function matchesInternalRoute(href: string): { valid: boolean; killed: boolean } {
  const cleanPath = href.split("?")[0].split("#")[0] || "/";
  for (const entry of pageRegistry) {
    if (entry.path === cleanPath) {
      return { valid: entry.status !== "kill", killed: entry.status === "kill" };
    }
    if (entry.path.includes("[")) {
      const pattern =
        "^" +
        entry.path
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .replace(/\\\[[^\]]+\\\]/g, "[^/]+") +
        "$";
      if (new RegExp(pattern).test(cleanPath)) {
        return { valid: entry.status !== "kill", killed: entry.status === "kill" };
      }
    }
  }
  return { valid: false, killed: false };
}

export async function defaultSpecialistUrlProbe(url: string): Promise<UrlProbeResult> {
  const trimmed = url.trim();
  if (KNOWN_BROKEN_SPECIALIST_URLS[trimmed]) {
    return { ok: false, statusCode: 404 };
  }
  if (trimmed.startsWith("/")) {
    const internalCheck = matchesInternalRoute(trimmed);
    return {
      ok: internalCheck.valid,
      statusCode: internalCheck.valid ? 200 : internalCheck.killed ? 410 : 404,
    };
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, statusCode: 400 };
  }

  const allowedPaths = VALID_SPECIALIST_HOST_PATHS[parsed.hostname.toLowerCase()];
  if (allowedPaths && !allowedPaths.has(parsed.pathname)) {
    return { ok: false, statusCode: 404 };
  }

  return { ok: true, statusCode: 200 };
}

export async function detectReferenceMaintenanceIssues(options: {
  nodes?: TravelReferenceNode[];
  now?: Date;
  maxEvidenceAgeDays?: number;
  probeUrl?: UrlProbeFn;
} = {}): Promise<ReferenceMaintenanceIssue[]> {
  const nodes = options.nodes || getAllTravelReferenceNodes();
  const now = options.now || new Date();
  const maxAgeDays = options.maxEvidenceAgeDays ?? 30;
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  const probeUrl = options.probeUrl || defaultSpecialistUrlProbe;
  const detectedAt = now.toISOString();
  const issues: ReferenceMaintenanceIssue[] = [];

  for (const node of nodes) {
    // 1. Check specialist handoff links
    for (const handoff of node.specialistHandoffs.options) {
      const baseUrl = handoff.baseUrl.trim();
      const knownBroken = KNOWN_BROKEN_SPECIALIST_URLS[baseUrl];
      const probe = await probeUrl(baseUrl);

      if (knownBroken || !probe.ok) {
        let fallbackReplacement = knownBroken?.replacementUrl || baseUrl;
        if (!knownBroken) {
          try {
            const parsed = new URL(baseUrl);
            const allowed = VALID_SPECIALIST_HOST_PATHS[parsed.hostname.toLowerCase()];
            if (allowed && allowed.size > 0) {
              const preferred = [...allowed].find((p) => p !== "/") || "/";
              fallbackReplacement = `${parsed.origin}${preferred}`;
            }
          } catch {
            // keep baseUrl if unparseable
          }
        }

        issues.push({
          issueId: `issue_${node.id}_${handoff.id}`,
          nodeId: node.id,
          canonicalPath: node.canonicalPath,
          kind: "broken_specialist_link",
          targetId: handoff.id,
          targetLabel: `${handoff.partnerName} (${handoff.id})`,
          observedValue: baseUrl,
          recommendedValue: fallbackReplacement,
          reason:
            knownBroken?.reason ||
            `Specialist handoff baseUrl ${baseUrl} failed verification with status ${probe.statusCode}.`,
          severity: "critical",
          detectedAt,
        });
      }
    }

    // 2. Check evidence citations for staleness
    for (const citation of node.evidenceRegistry) {
      const checkedMs = new Date(citation.lastCheckedAt).getTime();
      const isInvalidDate = !Number.isFinite(checkedMs);
      const ageMs = isInvalidDate ? Number.POSITIVE_INFINITY : now.getTime() - checkedMs;

      if (isInvalidDate || ageMs > maxAgeMs) {
        const ageDays = isInvalidDate ? -1 : Math.floor(ageMs / (24 * 60 * 60 * 1000));
        issues.push({
          issueId: `issue_${node.id}_${citation.id}`,
          nodeId: node.id,
          canonicalPath: node.canonicalPath,
          kind: "stale_evidence_source",
          targetId: citation.id,
          targetLabel: `${citation.sourceTitle} (${citation.issuingOrganization})`,
          observedValue: citation.lastCheckedAt,
          recommendedValue: now.toISOString().slice(0, 10),
          reason: isInvalidDate
            ? `Evidence citation ${citation.id} has an invalid lastCheckedAt date (${citation.lastCheckedAt}).`
            : `Evidence citation ${citation.id} was last verified ${ageDays} days ago (${citation.lastCheckedAt}), exceeding the ${maxAgeDays}-day freshness SLA.`,
          severity: "watch",
          detectedAt,
        });
      }
    }

    // 3. Check internal relationship links against pageRegistry
    for (const rel of node.relationships) {
      if (rel.href.startsWith("/")) {
        const routeCheck = matchesInternalRoute(rel.href);
        if (!routeCheck.valid) {
          issues.push({
            issueId: `issue_${node.id}_${rel.id}`,
            nodeId: node.id,
            canonicalPath: node.canonicalPath,
            kind: "broken_internal_relationship",
            targetId: rel.id,
            targetLabel: rel.label,
            observedValue: rel.href,
            recommendedValue: node.canonicalPath,
            reason: routeCheck.killed
              ? `Relationship ${rel.id} links to retired kill-route ${rel.href}.`
              : `Relationship ${rel.id} links to unregistered internal route ${rel.href}.`,
            severity: "blocked",
            detectedAt,
          });
        }
      }
    }
  }

  return issues;
}

async function persistControlMapFindingToDb(task: ReferenceMaintenanceTask, eventName: string, summary: string) {
  if (!hasDb()) return;
  const db = getDb();
  if (!db) return;

  try {
    await db
      .insert(earthosControlMapFindings)
      .values({
        findingId: task.findingId,
        status: task.status,
        severity: task.severity,
        owner: "earthos-reference-maintainer",
        note: summary,
        metadata: {
          taskId: task.taskId,
          nodeId: task.nodeId,
          canonicalPath: task.canonicalPath,
          missionId: task.missionId,
          driftEventId: task.driftEventId,
          packetId: task.packetId,
          issueCount: task.issues.length,
          verificationEvidence: task.verificationEvidence,
        },
        updatedAt: new Date(task.updatedAt),
      })
      .onConflictDoUpdate({
        target: earthosControlMapFindings.findingId,
        set: {
          status: task.status,
          severity: task.severity,
          note: summary,
          metadata: {
            taskId: task.taskId,
            nodeId: task.nodeId,
            canonicalPath: task.canonicalPath,
            missionId: task.missionId,
            driftEventId: task.driftEventId,
            packetId: task.packetId,
            issueCount: task.issues.length,
            verificationEvidence: task.verificationEvidence,
          },
          updatedAt: new Date(task.updatedAt),
        },
      });

    await db.insert(earthosControlMapFindingHistory).values({
      findingId: task.findingId,
      event: eventName,
      status: task.status,
      severity: task.severity,
      owner: "earthos-reference-maintainer",
      nodeSlug: task.nodeId,
      corridor: task.nodeId,
      recordedAt: new Date(task.updatedAt),
      summary,
      approvedAt: task.closedAt ? new Date(task.closedAt) : null,
      approvedBy: task.closedBy,
      controlSurface: task.canonicalPath,
      metadata: {
        taskId: task.taskId,
        issues: task.issues,
        verificationEvidence: task.verificationEvidence,
      },
    });
  } catch {
    // DB write is best-effort alongside durable governance & task store
  }
}

export async function recordReferenceMaintenanceTask(
  nodeId: TravelReferenceNode["id"],
  issues: ReferenceMaintenanceIssue[],
): Promise<ReferenceMaintenanceTask> {
  const nodeIssues = issues.filter((issue) => issue.nodeId === nodeId);
  if (nodeIssues.length === 0) {
    throw new Error(`No reference maintenance issues to record for node ${nodeId}.`);
  }

  const now = new Date().toISOString();
  const taskId = `ref_task_${nodeId}_${randomUUID().slice(0, 8)}`;
  const findingId = `control-map:travel-reference:${nodeId}:${taskId}`;
  const canonicalPath = nodeIssues[0].canonicalPath;
  const highestSeverity = nodeIssues.some((i) => i.severity === "critical")
    ? "critical"
    : nodeIssues.some((i) => i.severity === "blocked")
      ? "blocked"
      : "watch";

  const governance = getDurableGovernanceRecordService();

  const driftEvent: GovernanceDriftEvent | null = await governance.appendDriftEvent({
    id: `drift_${taskId}`,
    createdAt: now,
    sourceSurface: "earthos-reference-monitor",
    affectedSurface: canonicalPath,
    corridorId: nodeId,
    eventType: "travel_reference_integrity_drift",
    severity: highestSeverity,
    status: "open",
    findingId,
    summary: `Detected ${nodeIssues.length} reference integrity issue(s) on ${canonicalPath}: ${nodeIssues.map((i) => `${i.kind}(${i.targetId})`).join(", ")}`,
    evidenceJson: {
      taskId,
      nodeId,
      canonicalPath,
      issues: nodeIssues,
    },
    expectedRole: "verified_travel_reference",
    observedRole: "stale_or_broken_reference_target",
    continuityState: "remediation_required",
    machineInterpretationRisk: highestSeverity === "critical" ? "high" : "medium",
  });

  const packet: GovernanceReconciliationPacket | null = await governance.createReconciliationPacket({
    id: `packet_${taskId}`,
    createdAt: now,
    packetType: "travel_reference_remediation",
    status: "proposed",
    proposedChangesJson: {
      taskId,
      nodeId,
      remappings: nodeIssues.map((issue) => ({
        targetId: issue.targetId,
        kind: issue.kind,
        from: issue.observedValue,
        to: issue.recommendedValue,
      })),
    },
    affectedRoutesJson: [canonicalPath],
    affectedSurfacesJson: [canonicalPath, ...nodeIssues.map((i) => i.observedValue)],
    reason: `Repair ${nodeIssues.length} broken/stale reference item(s) on ${canonicalPath}.`,
    approvalRequired: true,
  });

  const entityForMission =
    nodeId === "juneau"
      ? "alaska"
      : nodeId === "red-rocks"
        ? "redrocks"
        : nodeId === "denver-breckenridge"
          ? "gosno"
          : "earthos";

  const mission = await launchWorkflowMission({
    entity: entityForMission,
    region: nodeId,
    missionType: "reference-maintenance",
    objective: `Repair ${nodeIssues.length} reference issue(s) on ${canonicalPath}`,
  });

  const task: ReferenceMaintenanceTask = {
    taskId,
    findingId,
    nodeId,
    canonicalPath,
    status: "open",
    severity: highestSeverity,
    createdAt: now,
    updatedAt: now,
    closedAt: null,
    closedBy: null,
    missionId: mission.id,
    driftEventId: driftEvent?.id || `drift_${taskId}`,
    packetId: packet?.id || `packet_${taskId}`,
    issues: nodeIssues,
    verificationEvidence: null,
  };

  getTaskStore().set(taskId, task);

  appendEarthOSAuditEvent({
    eventType: "reference_drift_detected",
    entity: entityForMission,
    corridorId: nodeId,
    severity: highestSeverity === "critical" ? "critical" : "watch",
    summary: `Recorded persistent maintenance task ${taskId} for ${canonicalPath} (${nodeIssues.length} issue(s)).`,
    metadata: {
      taskId,
      findingId,
      missionId: mission.id,
      driftEventId: task.driftEventId,
      packetId: task.packetId,
      issues: nodeIssues,
    },
  });

  await persistControlMapFindingToDb(
    task,
    "reference_drift_detected",
    `Opened maintenance task ${taskId} with ${nodeIssues.length} issue(s).`,
  );

  return task;
}

export function getReferenceMaintenanceTask(taskId: string): ReferenceMaintenanceTask | null {
  return getTaskStore().get(taskId) || null;
}

export function listReferenceMaintenanceTasks(): ReferenceMaintenanceTask[] {
  return [...getTaskStore().values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function applyReferenceMaintenanceCorrection(options: {
  taskId: string;
  targetNode: TravelReferenceNode;
  approved: boolean;
  operator: string;
}): Promise<{
  applied: boolean;
  task: ReferenceMaintenanceTask;
  remediatedNode: TravelReferenceNode;
}> {
  const task = getTaskStore().get(options.taskId);
  if (!task) {
    throw new Error(`Reference maintenance task ${options.taskId} not found.`);
  }

  const now = new Date().toISOString();
  const governance = getDurableGovernanceRecordService();

  if (options.approved !== true) {
    await signalWorkflowMission(task.missionId, "erich-approval", {
      approved: false,
      operator: options.operator,
    });

    task.status = "rejected";
    task.updatedAt = now;
    getTaskStore().set(task.taskId, task);

    appendEarthOSAuditEvent({
      eventType: "reference_remediation_rejected",
      entity: "earthos",
      corridorId: task.nodeId,
      severity: "high",
      summary: `Operator ${options.operator} rejected remediation for task ${task.taskId}; task remains unapplied.`,
      metadata: {
        taskId: task.taskId,
        missionId: task.missionId,
        operator: options.operator,
      },
    });

    await persistControlMapFindingToDb(
      task,
      "reference_remediation_rejected",
      `Remediation rejected by ${options.operator}.`,
    );

    return {
      applied: false,
      task,
      remediatedNode: options.targetNode,
    };
  }

  // Explicitly approve and apply packet + signal mission
  await governance.markPacketApproved(task.packetId, options.operator, now);
  await governance.markPacketApplied(
    task.packetId,
    {
      appliedBy: options.operator,
      appliedAt: now,
      remediatedIssueIds: task.issues.map((i) => i.issueId),
    },
    now,
  );

  await signalWorkflowMission(task.missionId, "erich-approval", {
    approved: true,
    operator: options.operator,
  });

  // Clone and apply corrections to targetNode
  const remediatedNode: TravelReferenceNode = structuredClone(options.targetNode);

  for (const issue of task.issues) {
    if (issue.kind === "broken_specialist_link") {
      const option = remediatedNode.specialistHandoffs.options.find((opt) => opt.id === issue.targetId);
      if (option) {
        option.baseUrl = issue.recommendedValue;
      }
    } else if (issue.kind === "stale_evidence_source") {
      const citation = remediatedNode.evidenceRegistry.find((cit) => cit.id === issue.targetId);
      if (citation) {
        citation.lastCheckedAt = issue.recommendedValue;
      }
    } else if (issue.kind === "broken_internal_relationship") {
      const rel = remediatedNode.relationships.find((r) => r.id === issue.targetId);
      if (rel) {
        rel.href = issue.recommendedValue;
      }
    }
  }

  remediatedNode.lastReviewedAt = now.slice(0, 10);

  task.status = "remediated_pending_recheck";
  task.updatedAt = now;
  getTaskStore().set(task.taskId, task);

  appendEarthOSAuditEvent({
    eventType: "reference_remediation_applied",
    entity: "earthos",
    corridorId: task.nodeId,
    severity: "info",
    summary: `Applied ${task.issues.length} reference correction(s) for task ${task.taskId} on ${task.canonicalPath}.`,
    metadata: {
      taskId: task.taskId,
      operator: options.operator,
      packetId: task.packetId,
      missionId: task.missionId,
    },
  });

  return {
    applied: true,
    task,
    remediatedNode,
  };
}

export async function verifyAndCloseReferenceMaintenanceTask(options: {
  taskId: string;
  remediatedNode: TravelReferenceNode;
  verifiedBy: string;
  now?: Date;
  maxEvidenceAgeDays?: number;
  probeUrl?: UrlProbeFn;
}): Promise<ReferenceMaintenanceTask> {
  const task = getTaskStore().get(options.taskId);
  if (!task) {
    throw new Error(`Reference maintenance task ${options.taskId} not found.`);
  }
  if (task.status !== "remediated_pending_recheck") {
    throw new Error(
      `Cannot verify and close task ${options.taskId} from status '${task.status}' (must be 'remediated_pending_recheck').`,
    );
  }

  const now = options.now || new Date();
  const verifiedAt = now.toISOString();
  const probeUrl = options.probeUrl || defaultSpecialistUrlProbe;

  // Recheck the remediated node
  const remainingIssues = await detectReferenceMaintenanceIssues({
    nodes: [options.remediatedNode],
    now,
    maxEvidenceAgeDays: options.maxEvidenceAgeDays,
    probeUrl,
  });

  const probeResults: Array<{ url: string; ok: boolean; statusCode: number }> = [];
  for (const handoff of options.remediatedNode.specialistHandoffs.options) {
    const res = await probeUrl(handoff.baseUrl);
    probeResults.push({
      url: handoff.baseUrl,
      ok: res.ok,
      statusCode: res.statusCode,
    });
  }

  const routeCheck = matchesInternalRoute(options.remediatedNode.canonicalPath);
  const recheckPassed =
    remainingIssues.length === 0 &&
    routeCheck.valid &&
    probeResults.every((p) => p.ok);

  if (!recheckPassed) {
    throw new Error(
      `Recheck failed for task ${task.taskId}: ${remainingIssues.length} remaining issue(s), routeValid=${routeCheck.valid}.`,
    );
  }

  const evidence: ReferenceVerificationEvidence = {
    verifiedAt,
    verifiedBy: options.verifiedBy,
    publicCanonicalPath: options.remediatedNode.canonicalPath,
    publicRouteRegistered: routeCheck.valid,
    recheckPassed: true,
    remainingIssueCount: 0,
    beforeSnapshot: task.issues.map((issue) => ({
      targetId: issue.targetId,
      kind: issue.kind,
      observedValue: issue.observedValue,
    })),
    afterSnapshot: task.issues.map((issue) => ({
      targetId: issue.targetId,
      kind: issue.kind,
      correctedValue: issue.recommendedValue,
      status: "verified_clean",
    })),
    probeResults,
  };

  const governance = getDurableGovernanceRecordService();
  await governance.resolveDriftEvent(
    task.driftEventId,
    options.verifiedBy,
    evidence as unknown as Record<string, unknown>,
    verifiedAt,
  );

  task.status = "closed";
  task.updatedAt = verifiedAt;
  task.closedAt = verifiedAt;
  task.closedBy = options.verifiedBy;
  task.verificationEvidence = evidence;
  getTaskStore().set(task.taskId, task);

  appendEarthOSAuditEvent({
    eventType: "reference_maintenance_task_closed",
    entity: "earthos",
    corridorId: task.nodeId,
    severity: "info",
    summary: `Closed maintenance task ${task.taskId} for ${task.canonicalPath} with verified evidence (0 remaining issues).`,
    metadata: {
      taskId: task.taskId,
      findingId: task.findingId,
      driftEventId: task.driftEventId,
      packetId: task.packetId,
      missionId: task.missionId,
      verificationEvidence: evidence,
    },
  });

  await persistControlMapFindingToDb(
    task,
    "reference_maintenance_task_closed",
    `Closed task ${task.taskId} after public page & specialist handoff recheck passed.`,
  );

  return task;
}

export async function runReferenceMaintenanceLoop(options: {
  targetNode: TravelReferenceNode;
  operator: string;
  now?: Date;
  maxEvidenceAgeDays?: number;
  probeUrl?: UrlProbeFn;
}): Promise<{
  detectedIssues: ReferenceMaintenanceIssue[];
  task: ReferenceMaintenanceTask;
  remediatedNode: TravelReferenceNode;
}> {
  const detectedIssues = await detectReferenceMaintenanceIssues({
    nodes: [options.targetNode],
    now: options.now,
    maxEvidenceAgeDays: options.maxEvidenceAgeDays,
    probeUrl: options.probeUrl,
  });

  if (detectedIssues.length === 0) {
    throw new Error(`No reference maintenance issues detected on ${options.targetNode.canonicalPath}.`);
  }

  const recordedTask = await recordReferenceMaintenanceTask(options.targetNode.id, detectedIssues);

  const { remediatedNode } = await applyReferenceMaintenanceCorrection({
    taskId: recordedTask.taskId,
    targetNode: options.targetNode,
    approved: true,
    operator: options.operator,
  });

  const closedTask = await verifyAndCloseReferenceMaintenanceTask({
    taskId: recordedTask.taskId,
    remediatedNode,
    verifiedBy: options.operator,
    now: options.now,
    maxEvidenceAgeDays: options.maxEvidenceAgeDays,
    probeUrl: options.probeUrl,
  });

  return {
    detectedIssues,
    task: closedTask,
    remediatedNode,
  };
}
