import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
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
  getReferenceMaintenanceStoreFilePath,
  getTravelReferenceNodeById,
  type PublishedReferenceNodeOverride,
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

/**
 * Explicit source review attestation required before any stale evidence citation
 * can have its lastCheckedAt timestamp updated. Refreshing a timestamp without
 * an upstream source review is rejected.
 */
export type SourceReviewAttestation = {
  citationId: string;
  reviewedSourceUrl: string;
  httpStatusCode: number;
  verifiedClaimMatchesSource: boolean;
  reviewerNotes: string;
  reviewedBy: string;
  reviewedAt: string;
  publishedOrUpdatedDate?: string | null;
};

export type ReferenceContentAssertion = {
  targetId: string;
  kind: ReferenceIssueKind;
  oldValueAbsentFromPublishedNode: boolean;
  correctedValuePresentInPublishedNode: boolean;
  publishedValue: string;
  sourceReviewVerified: boolean;
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
  contentAssertions: ReferenceContentAssertion[];
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
  sourceReviews: SourceReviewAttestation[];
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
 * Explicitly maps known broken/retired specialist URLs (such as the Juneau links caught during publication)
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

type DiskReferenceMaintenanceState = {
  tasks: Record<string, ReferenceMaintenanceTask>;
  nodeOverrides: Record<string, PublishedReferenceNodeOverride>;
};

function getGlobalMemoryState(): {
  tasks: Map<string, ReferenceMaintenanceTask>;
  nodeOverrides: Map<string, PublishedReferenceNodeOverride>;
  loadedFromPath: string | null;
} {
  const globalStore = globalThis as typeof globalThis & {
    __dccReferenceMaintenanceTasks?: Map<string, ReferenceMaintenanceTask>;
    __dccPublishedReferenceOverrides?: Map<string, PublishedReferenceNodeOverride>;
    __dccReferenceMaintenanceStorePath?: string | null;
  };

  const currentFilePath = getReferenceMaintenanceStoreFilePath();

  if (
    !globalStore.__dccReferenceMaintenanceTasks ||
    !globalStore.__dccPublishedReferenceOverrides ||
    globalStore.__dccReferenceMaintenanceStorePath !== currentFilePath
  ) {
    globalStore.__dccReferenceMaintenanceTasks = new Map<string, ReferenceMaintenanceTask>();
    globalStore.__dccPublishedReferenceOverrides = new Map<string, PublishedReferenceNodeOverride>();
    globalStore.__dccReferenceMaintenanceStorePath = currentFilePath;

    if (currentFilePath && fs.existsSync(currentFilePath)) {
      try {
        const parsed = JSON.parse(
          fs.readFileSync(currentFilePath, "utf8"),
        ) as Partial<DiskReferenceMaintenanceState>;
        if (parsed.tasks) {
          for (const [id, task] of Object.entries(parsed.tasks)) {
            globalStore.__dccReferenceMaintenanceTasks.set(id, {
              ...task,
              sourceReviews: task.sourceReviews || [],
            });
          }
        }
        if (parsed.nodeOverrides) {
          for (const [nodeId, override] of Object.entries(parsed.nodeOverrides)) {
            globalStore.__dccPublishedReferenceOverrides.set(nodeId, override);
          }
        }
      } catch {
        // ignore malformed state file
      }
    }
  }

  return {
    tasks: globalStore.__dccReferenceMaintenanceTasks,
    nodeOverrides: globalStore.__dccPublishedReferenceOverrides,
    loadedFromPath: currentFilePath,
  };
}

function flushReferenceMaintenanceStateToDisk() {
  const globalStore = globalThis as typeof globalThis & {
    __dccReferenceMaintenanceTasks?: Map<string, ReferenceMaintenanceTask>;
    __dccPublishedReferenceOverrides?: Map<string, PublishedReferenceNodeOverride>;
  };
  const filePath = getReferenceMaintenanceStoreFilePath();
  if (!filePath || !globalStore.__dccReferenceMaintenanceTasks || !globalStore.__dccPublishedReferenceOverrides) {
    return;
  }

  const serialized: DiskReferenceMaintenanceState = {
    tasks: Object.fromEntries(globalStore.__dccReferenceMaintenanceTasks.entries()),
    nodeOverrides: Object.fromEntries(globalStore.__dccPublishedReferenceOverrides.entries()),
  };

  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(serialized, null, 2), "utf8");
  } catch {
    // best-effort disk write
  }
}

export function setPublishedReferenceNodeOverride(override: PublishedReferenceNodeOverride): void {
  const state = getGlobalMemoryState();
  state.nodeOverrides.set(override.nodeId, override);
  flushReferenceMaintenanceStateToDisk();
}

export function clearReferenceMaintenanceStore(): void {
  const state = getGlobalMemoryState();
  state.tasks.clear();
  state.nodeOverrides.clear();
  const filePath = getReferenceMaintenanceStoreFilePath();
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // ignore
    }
  }
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
          sourceReviews: task.sourceReviews,
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
            sourceReviews: task.sourceReviews,
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
        sourceReviews: task.sourceReviews,
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
    sourceReviews: [],
    verificationEvidence: null,
  };

  const state = getGlobalMemoryState();
  state.tasks.set(taskId, task);
  flushReferenceMaintenanceStateToDisk();

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
  return getGlobalMemoryState().tasks.get(taskId) || null;
}

export function listReferenceMaintenanceTasks(): ReferenceMaintenanceTask[] {
  return [...getGlobalMemoryState().tasks.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

function validateSourceReviewAttestation(
  review: SourceReviewAttestation | undefined,
  expectedCitationSourceUrl: string,
): { valid: boolean; reason?: string } {
  if (!review) {
    return {
      valid: false,
      reason: "Missing SourceReviewAttestation; refreshing a timestamp without source review is prohibited.",
    };
  }
  if (!review.verifiedClaimMatchesSource) {
    return {
      valid: false,
      reason: `Source review for ${review.citationId} did not confirm that the claim matches the upstream source.`,
    };
  }
  if (review.httpStatusCode < 200 || review.httpStatusCode >= 400) {
    return {
      valid: false,
      reason: `Source review for ${review.citationId} recorded unhealthy HTTP status ${review.httpStatusCode}.`,
    };
  }
  if (review.reviewedSourceUrl.trim() !== expectedCitationSourceUrl.trim()) {
    return {
      valid: false,
      reason: `Source review URL (${review.reviewedSourceUrl}) does not match citation sourceUrl (${expectedCitationSourceUrl}).`,
    };
  }
  if (!review.reviewerNotes || review.reviewerNotes.trim().length < 10) {
    return {
      valid: false,
      reason: `Source review for ${review.citationId} requires substantive reviewerNotes (>= 10 chars).`,
    };
  }
  if (!review.reviewedBy || !review.reviewedBy.trim()) {
    return {
      valid: false,
      reason: `Source review for ${review.citationId} requires a non-empty reviewedBy identifier.`,
    };
  }
  const reviewedMs = new Date(review.reviewedAt).getTime();
  if (!Number.isFinite(reviewedMs)) {
    return {
      valid: false,
      reason: `Source review for ${review.citationId} has an invalid reviewedAt timestamp (${review.reviewedAt}).`,
    };
  }
  return { valid: true };
}

export async function applyReferenceMaintenanceCorrection(options: {
  taskId: string;
  targetNode?: TravelReferenceNode;
  approved: boolean;
  operator: string;
  sourceReviews?: SourceReviewAttestation[];
}): Promise<{
  applied: boolean;
  task: ReferenceMaintenanceTask;
  remediatedNode: TravelReferenceNode;
  unreviewedStaleCitationIds: string[];
}> {
  const state = getGlobalMemoryState();
  const task = state.tasks.get(options.taskId);
  if (!task) {
    throw new Error(`Reference maintenance task ${options.taskId} not found.`);
  }

  const baseTargetNode = options.targetNode || getTravelReferenceNodeById(task.nodeId);
  const now = new Date().toISOString();
  const governance = getDurableGovernanceRecordService();

  if (options.approved !== true) {
    await signalWorkflowMission(task.missionId, "erich-approval", {
      approved: false,
      operator: options.operator,
    });

    task.status = "rejected";
    task.updatedAt = now;
    state.tasks.set(task.taskId, task);
    flushReferenceMaintenanceStateToDisk();

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
      remediatedNode: baseTargetNode,
      unreviewedStaleCitationIds: [],
    };
  }

  // Clone and apply corrections to targetNode
  const remediatedNode: TravelReferenceNode = structuredClone(baseTargetNode);
  const existingOverride = state.nodeOverrides.get(task.nodeId);
  const nextOverride: PublishedReferenceNodeOverride = {
    nodeId: task.nodeId,
    updatedAt: now,
    appliedTaskId: task.taskId,
    appliedBy: options.operator,
    specialistHandoffBaseUrls: { ...(existingOverride?.specialistHandoffBaseUrls || {}) },
    evidenceReviews: { ...(existingOverride?.evidenceReviews || {}) },
    relationshipHrefs: { ...(existingOverride?.relationshipHrefs || {}) },
  };

  const acceptedSourceReviews: SourceReviewAttestation[] = [...(task.sourceReviews || [])];
  const unreviewedStaleCitationIds: string[] = [];

  for (const issue of task.issues) {
    if (issue.kind === "broken_specialist_link") {
      const option = remediatedNode.specialistHandoffs.options.find((opt) => opt.id === issue.targetId);
      if (option) {
        option.baseUrl = issue.recommendedValue;
        nextOverride.specialistHandoffBaseUrls![issue.targetId] = issue.recommendedValue;
      }
    } else if (issue.kind === "stale_evidence_source") {
      const citation = remediatedNode.evidenceRegistry.find((cit) => cit.id === issue.targetId);
      if (citation) {
        const suppliedReview = options.sourceReviews?.find((r) => r.citationId === issue.targetId);
        const validation = validateSourceReviewAttestation(suppliedReview, citation.sourceUrl);
        if (!validation.valid || !suppliedReview) {
          // Do NOT bump lastCheckedAt without a verified source review attestation!
          unreviewedStaleCitationIds.push(issue.targetId);
        } else {
          const checkedDate = suppliedReview.reviewedAt.slice(0, 10);
          citation.lastCheckedAt = checkedDate;
          citation.verificationNote = suppliedReview.reviewerNotes;
          if (suppliedReview.publishedOrUpdatedDate !== undefined) {
            citation.publishedOrUpdatedDate = suppliedReview.publishedOrUpdatedDate;
          }
          nextOverride.evidenceReviews![issue.targetId] = {
            lastCheckedAt: checkedDate,
            publishedOrUpdatedDate: suppliedReview.publishedOrUpdatedDate,
            verificationNote: suppliedReview.reviewerNotes,
            reviewedBy: suppliedReview.reviewedBy,
            reviewedSourceUrl: suppliedReview.reviewedSourceUrl,
          };
          const existingIdx = acceptedSourceReviews.findIndex((r) => r.citationId === issue.targetId);
          if (existingIdx >= 0) {
            acceptedSourceReviews[existingIdx] = suppliedReview;
          } else {
            acceptedSourceReviews.push(suppliedReview);
          }
        }
      }
    } else if (issue.kind === "broken_internal_relationship") {
      const rel = remediatedNode.relationships.find((r) => r.id === issue.targetId);
      if (rel) {
        rel.href = issue.recommendedValue;
        nextOverride.relationshipHrefs![issue.targetId] = issue.recommendedValue;
      }
    }
  }

  if (unreviewedStaleCitationIds.length === 0) {
    remediatedNode.lastReviewedAt = now.slice(0, 10);
    nextOverride.lastReviewedAt = now.slice(0, 10);
  }

  // Explicitly approve and apply packet + signal mission
  await governance.markPacketApproved(task.packetId, options.operator, now);
  await governance.markPacketApplied(
    task.packetId,
    {
      appliedBy: options.operator,
      appliedAt: now,
      remediatedIssueIds: task.issues
        .filter((i) => !unreviewedStaleCitationIds.includes(i.targetId))
        .map((i) => i.issueId),
      unreviewedStaleCitationIds,
      sourceReviews: acceptedSourceReviews,
    },
    now,
  );

  await signalWorkflowMission(task.missionId, "erich-approval", {
    approved: true,
    operator: options.operator,
  });

  task.sourceReviews = acceptedSourceReviews;
  task.status = "remediated_pending_recheck";
  task.updatedAt = now;
  state.tasks.set(task.taskId, task);
  state.nodeOverrides.set(task.nodeId, nextOverride);
  flushReferenceMaintenanceStateToDisk();

  appendEarthOSAuditEvent({
    eventType: "reference_remediation_applied",
    entity: "earthos",
    corridorId: task.nodeId,
    severity: unreviewedStaleCitationIds.length > 0 ? "watch" : "info",
    summary: `Applied reference correction(s) for task ${task.taskId} on ${task.canonicalPath} (unreviewedStaleCitations=${unreviewedStaleCitationIds.length}).`,
    metadata: {
      taskId: task.taskId,
      operator: options.operator,
      packetId: task.packetId,
      missionId: task.missionId,
      unreviewedStaleCitationIds,
      sourceReviews: acceptedSourceReviews,
    },
  });

  return {
    applied: true,
    task,
    remediatedNode,
    unreviewedStaleCitationIds,
  };
}

export async function verifyAndCloseReferenceMaintenanceTask(options: {
  taskId: string;
  remediatedNode?: TravelReferenceNode;
  verifiedBy: string;
  now?: Date;
  maxEvidenceAgeDays?: number;
  probeUrl?: UrlProbeFn;
}): Promise<ReferenceMaintenanceTask> {
  const state = getGlobalMemoryState();
  const task = state.tasks.get(options.taskId);
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

  // Always inspect the live published destination node resolved by getTravelReferenceNodeById(task.nodeId)
  // unless an explicit candidate node was provided for comparison, in which case we verify both.
  const publishedNode = getTravelReferenceNodeById(task.nodeId);
  const nodeUnderTest = options.remediatedNode || publishedNode;

  const contentAssertions: ReferenceContentAssertion[] = [];
  const contentFailures: string[] = [];

  for (const issue of task.issues) {
    if (issue.kind === "broken_specialist_link") {
      const publishedOption = publishedNode.specialistHandoffs.options.find(
        (opt) => opt.id === issue.targetId,
      );
      const candidateOption = nodeUnderTest.specialistHandoffs.options.find(
        (opt) => opt.id === issue.targetId,
      );
      const actualUrl = (candidateOption?.baseUrl || "").trim();
      const publishedUrl = (publishedOption?.baseUrl || "").trim();
      const oldUrlStillInNode = nodeUnderTest.specialistHandoffs.options.some(
        (opt) => opt.baseUrl.trim() === issue.observedValue.trim(),
      );
      const correctedPresent =
        actualUrl === issue.recommendedValue.trim() &&
        publishedUrl === issue.recommendedValue.trim() &&
        ! KNOWN_BROKEN_SPECIALIST_URLS[actualUrl];

      contentAssertions.push({
        targetId: issue.targetId,
        kind: issue.kind,
        oldValueAbsentFromPublishedNode: !oldUrlStillInNode && actualUrl !== issue.observedValue.trim(),
        correctedValuePresentInPublishedNode: correctedPresent,
        publishedValue: publishedUrl,
        sourceReviewVerified: true,
      });

      if (oldUrlStillInNode || !correctedPresent) {
        contentFailures.push(
          `Broken specialist link ${issue.targetId} was not replaced in published destination content (observed='${publishedUrl}', expected='${issue.recommendedValue}').`,
        );
      }
    } else if (issue.kind === "stale_evidence_source") {
      const publishedCitation = publishedNode.evidenceRegistry.find((c) => c.id === issue.targetId);
      const candidateCitation = nodeUnderTest.evidenceRegistry.find((c) => c.id === issue.targetId);
      const attestation = (task.sourceReviews || []).find((r) => r.citationId === issue.targetId);
      const attestationCheck = validateSourceReviewAttestation(
        attestation,
        publishedCitation?.sourceUrl || candidateCitation?.sourceUrl || "",
      );

      const publishedCheckedAt = publishedCitation?.lastCheckedAt || "";
      const candidateCheckedAt = candidateCitation?.lastCheckedAt || "";
      const oldDateReplaced =
        publishedCheckedAt !== issue.observedValue && candidateCheckedAt !== issue.observedValue;
      const noteMatches =
        Boolean(attestation) &&
        publishedCitation?.verificationNote === attestation?.reviewerNotes &&
        candidateCitation?.verificationNote === attestation?.reviewerNotes;

      contentAssertions.push({
        targetId: issue.targetId,
        kind: issue.kind,
        oldValueAbsentFromPublishedNode: oldDateReplaced,
        correctedValuePresentInPublishedNode: oldDateReplaced && noteMatches,
        publishedValue: publishedCheckedAt,
        sourceReviewVerified: attestationCheck.valid,
      });

      if (!attestationCheck.valid) {
        contentFailures.push(
          `Stale evidence source ${issue.targetId} cannot be closed without source review: ${attestationCheck.reason}`,
        );
      } else if (!oldDateReplaced || !noteMatches) {
        contentFailures.push(
          `Stale evidence source ${issue.targetId} review did not reach published destination content.`,
        );
      }
    } else if (issue.kind === "broken_internal_relationship") {
      const publishedRel = publishedNode.relationships.find((r) => r.id === issue.targetId);
      const candidateRel = nodeUnderTest.relationships.find((r) => r.id === issue.targetId);
      const publishedHref = (publishedRel?.href || "").trim();
      const candidateHref = (candidateRel?.href || "").trim();
      const routeValid = matchesInternalRoute(publishedHref).valid;
      const correctedPresent =
        publishedHref === issue.recommendedValue.trim() &&
        candidateHref === issue.recommendedValue.trim() &&
        routeValid;

      contentAssertions.push({
        targetId: issue.targetId,
        kind: issue.kind,
        oldValueAbsentFromPublishedNode: publishedHref !== issue.observedValue.trim(),
        correctedValuePresentInPublishedNode: correctedPresent,
        publishedValue: publishedHref,
        sourceReviewVerified: true,
      });

      if (!correctedPresent) {
        contentFailures.push(
          `Broken internal relationship ${issue.targetId} was not repaired in published destination content (observed='${publishedHref}', expected='${issue.recommendedValue}').`,
        );
      }
    }
  }

  if (contentFailures.length > 0) {
    throw new Error(
      `Content verification failed for task ${task.taskId}: ${contentFailures.join(" | ")}`,
    );
  }

  // Recheck the remediated node for any remaining or newly introduced issues
  const remainingIssues = await detectReferenceMaintenanceIssues({
    nodes: [nodeUnderTest],
    now,
    maxEvidenceAgeDays: options.maxEvidenceAgeDays,
    probeUrl,
  });

  const probeResults: Array<{ url: string; ok: boolean; statusCode: number }> = [];
  for (const handoff of nodeUnderTest.specialistHandoffs.options) {
    const res = await probeUrl(handoff.baseUrl);
    probeResults.push({
      url: handoff.baseUrl,
      ok: res.ok,
      statusCode: res.statusCode,
    });
  }

  const routeCheck = matchesInternalRoute(nodeUnderTest.canonicalPath);
  const recheckPassed =
    remainingIssues.length === 0 &&
    routeCheck.valid &&
    probeResults.every((p) => p.ok) &&
    contentAssertions.every(
      (a) =>
        a.oldValueAbsentFromPublishedNode &&
        a.correctedValuePresentInPublishedNode &&
        a.sourceReviewVerified,
    );

  if (!recheckPassed) {
    throw new Error(
      `Recheck failed for task ${task.taskId}: ${remainingIssues.length} remaining issue(s), routeValid=${routeCheck.valid}.`,
    );
  }

  const evidence: ReferenceVerificationEvidence = {
    verifiedAt,
    verifiedBy: options.verifiedBy,
    publicCanonicalPath: nodeUnderTest.canonicalPath,
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
    contentAssertions,
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
  state.tasks.set(task.taskId, task);
  flushReferenceMaintenanceStateToDisk();

  appendEarthOSAuditEvent({
    eventType: "reference_maintenance_task_closed",
    entity: "earthos",
    corridorId: task.nodeId,
    severity: "info",
    summary: `Closed maintenance task ${task.taskId} for ${task.canonicalPath} with verified content assertions and 0 remaining issues.`,
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
    `Closed task ${task.taskId} after published destination content & specialist handoff recheck passed.`,
  );

  return task;
}

export async function runReferenceMaintenanceLoop(options: {
  targetNode: TravelReferenceNode;
  operator: string;
  sourceReviews?: SourceReviewAttestation[];
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
    sourceReviews: options.sourceReviews,
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
