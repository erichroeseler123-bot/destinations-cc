import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { pageRegistry } from "@/data/page-registry";
import {
  earthosControlMapFindingHistory,
  earthosControlMapFindings,
} from "@/lib/db/schema";
import { appendEarthOSAuditEvent } from "@/lib/dcc/earthos/auditLog";
import { getRequiredEarthosDb } from "@/lib/dcc/earthos/ensureEarthosSchema";
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
  buildReferenceOverrideFindingId,
  getAllPublishedTravelReferenceNodes,
  getPublishedTravelReferenceNodeById,
  readPublishedReferenceNodeOverrideFromDb,
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
  oldValueAbsentFromDeployedHtml: boolean;
  correctedValuePresentInDeployedHtml: boolean;
  publishedValue: string;
  sourceReviewVerified: boolean;
};

export type ReferenceVerificationEvidence = {
  verifiedAt: string;
  verifiedBy: string;
  publicCanonicalPath: string;
  deployedPageUrl: string;
  deployedPageStatusCode: number;
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

export type DeployedPageFetchResult = {
  url: string;
  ok: boolean;
  statusCode: number;
  html: string;
};

export type DeployedPageFetchFn = (url: string) => Promise<DeployedPageFetchResult>;

/**
 * Canonical remediation guidance for known retired/broken specialist routes once an HTTP probe fails.
 * Detection itself always executes real HTTP probes via defaultSpecialistUrlProbe.
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

const SPECIALIST_HOST_DEFAULT_REPLACEMENT: Record<string, string> = {
  "juneauflightdeck.com": "https://juneauflightdeck.com/helicopter",
  "www.juneauflightdeck.com": "https://juneauflightdeck.com/helicopter",
  "welcometoalaskatours.com": "https://welcometoalaskatours.com/ports/juneau",
  "www.welcometoalaskatours.com": "https://welcometoalaskatours.com/ports/juneau",
  "partyatredrocks.com": "https://partyatredrocks.com/book/red-rocks-amphitheatre",
  "www.partyatredrocks.com": "https://partyatredrocks.com/book/red-rocks-amphitheatre",
  "gosno.co": "https://gosno.co/denver-to-breckenridge-shuttle",
  "www.gosno.co": "https://gosno.co/denver-to-breckenridge-shuttle",
  "welcometoneworleanstours.com": "https://welcometoneworleanstours.com/tours",
  "www.welcometoneworleanstours.com": "https://welcometoneworleanstours.com/tours",
  "welcometotheswamp.com": "https://welcometotheswamp.com/plan",
  "www.welcometotheswamp.com": "https://welcometotheswamp.com/plan",
  "saveonthestrip.com": "https://saveonthestrip.com/shows",
  "www.saveonthestrip.com": "https://saveonthestrip.com/shows",
};

export function resolveDeployedBaseUrl(explicitBaseUrl?: string): string {
  const raw =
    explicitBaseUrl ||
    process.env.DCC_DEPLOYED_BASE_URL ||
    process.env.DCC_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.destinationcommandcenter.com";
  return raw.trim().replace(/\/$/, "");
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

/**
 * Default specialist and internal URL probe using real HTTP requests.
 * Does NOT use simulated allowlists; performs a real network fetch.
 */
export async function defaultSpecialistUrlProbe(url: string): Promise<UrlProbeResult> {
  const trimmed = url.trim();
  let targetUrl = trimmed;

  if (trimmed.startsWith("/")) {
    const internalCheck = matchesInternalRoute(trimmed);
    if (!internalCheck.valid) {
      return {
        ok: false,
        statusCode: internalCheck.killed ? 410 : 404,
      };
    }
    targetUrl = `${resolveDeployedBaseUrl()}${trimmed}`;
  } else {
    try {
      new URL(trimmed);
    } catch {
      return { ok: false, statusCode: 400 };
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
      headers: {
        "user-agent": "DCC-EarthOS-ReferenceMonitor/1.0 (+https://www.destinationcommandcenter.com)",
        accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      },
    });

    return {
      ok: response.status >= 200 && response.status < 400,
      statusCode: response.status,
      redirectedTo: response.redirected ? response.url : undefined,
    };
  } catch {
    return {
      ok: false,
      statusCode: 503,
    };
  }
}

export async function defaultDeployedPageFetcher(url: string): Promise<DeployedPageFetchResult> {
  const headers: Record<string, string> = {
    "user-agent": "DCC-EarthOS-DeployedVerifier/1.0 (+https://www.destinationcommandcenter.com)",
    accept: "text/html,application/xhtml+xml",
    "cache-control": "no-cache, no-store, must-revalidate",
    pragma: "no-cache",
  };

  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  if (bypassSecret) {
    headers["x-vercel-protection-bypass"] = bypassSecret;
  }

  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
    headers,
  });

  const html = await response.text();
  const isVercelSsoGate =
    url.includes(".vercel.app") &&
    (response.status === 401 ||
      response.status === 403 ||
      (html.includes("data-dpl-id=") && html.includes('class="') && html.includes('dash"')));

  if (isVercelSsoGate) {
    try {
      const parsed = new URL(url);
      const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
      const pathWithQuery = `${parsed.pathname}${parsed.search}`;
      const cliHtml = execSync(
        `${npxCmd} vercel curl ${pathWithQuery} --deployment ${parsed.origin}`,
        {
          encoding: "utf8",
          maxBuffer: 25 * 1024 * 1024,
          stdio: ["ignore", "pipe", "ignore"],
        },
      );
      if (cliHtml && cliHtml.length > 0 && !cliHtml.includes(' dash"')) {
        return {
          url,
          ok: true,
          statusCode: 200,
          html: cliHtml,
        };
      }
    } catch {
      // Fall through and return raw response if vercel curl is unavailable
    }
  }

  return {
    url: response.url || url,
    ok: response.status >= 200 && response.status < 400 && !isVercelSsoGate,
    statusCode: isVercelSsoGate ? 401 : response.status,
    html,
  };
}

export async function setPublishedReferenceNodeOverride(
  override: PublishedReferenceNodeOverride,
): Promise<void> {
  const db = await getRequiredEarthosDb();
  const findingId = buildReferenceOverrideFindingId(override.nodeId);
  const updatedAt = new Date(override.updatedAt || new Date().toISOString());
  const summary = `Published reference override for ${override.nodeId} applied by ${override.appliedBy || "system"}${override.appliedTaskId ? ` (task ${override.appliedTaskId})` : ""}.`;

  await db
    .insert(earthosControlMapFindings)
    .values({
      findingId,
      status: "applied",
      severity: "info",
      owner: "earthos-reference-override",
      note: summary,
      metadata: override as unknown as Record<string, unknown>,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: earthosControlMapFindings.findingId,
      set: {
        status: "applied",
        severity: "info",
        owner: "earthos-reference-override",
        note: summary,
        metadata: override as unknown as Record<string, unknown>,
        updatedAt,
      },
    });

  await db.insert(earthosControlMapFindingHistory).values({
    findingId,
    event: "reference_override_applied",
    status: "applied",
    severity: "info",
    owner: "earthos-reference-override",
    nodeSlug: override.nodeId,
    corridor: override.nodeId,
    recordedAt: updatedAt,
    summary,
    approvedAt: updatedAt,
    approvedBy: override.appliedBy,
    controlSurface: `/${override.nodeId}`,
    metadata: override as unknown as Record<string, unknown>,
  });
}

export async function getPublishedReferenceNodeOverride(
  nodeId: TravelReferenceNode["id"],
): Promise<PublishedReferenceNodeOverride | null> {
  return readPublishedReferenceNodeOverrideFromDb(nodeId);
}

export async function clearPublishedReferenceNodeOverride(
  nodeId: TravelReferenceNode["id"],
): Promise<void> {
  const db = await getRequiredEarthosDb();
  await db
    .delete(earthosControlMapFindings)
    .where(eq(earthosControlMapFindings.findingId, buildReferenceOverrideFindingId(nodeId)));
}

export async function clearReferenceMaintenanceStore(
  nodeId?: TravelReferenceNode["id"],
): Promise<void> {
  const db = await getRequiredEarthosDb();
  if (nodeId) {
    await db
      .delete(earthosControlMapFindings)
      .where(eq(earthosControlMapFindings.findingId, buildReferenceOverrideFindingId(nodeId)));
    return;
  }
  await db
    .delete(earthosControlMapFindings)
    .where(eq(earthosControlMapFindings.owner, "earthos-reference-override"));
}

export async function detectReferenceMaintenanceIssues(options: {
  nodes?: TravelReferenceNode[];
  now?: Date;
  maxEvidenceAgeDays?: number;
  probeUrl?: UrlProbeFn;
} = {}): Promise<ReferenceMaintenanceIssue[]> {
  const nodes = options.nodes || (await getAllPublishedTravelReferenceNodes());
  const now = options.now || new Date();
  const maxAgeDays = options.maxEvidenceAgeDays ?? 30;
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  const probeUrl = options.probeUrl || defaultSpecialistUrlProbe;
  const detectedAt = now.toISOString();
  const issues: ReferenceMaintenanceIssue[] = [];

  for (const node of nodes) {
    // 1. Check specialist handoff links via HTTP probe
    for (const handoff of node.specialistHandoffs.options) {
      const baseUrl = handoff.baseUrl.trim();
      const probe = await probeUrl(baseUrl);

      if (!probe.ok) {
        const knownBroken = KNOWN_BROKEN_SPECIALIST_URLS[baseUrl];
        let fallbackReplacement = knownBroken?.replacementUrl || baseUrl;
        if (!knownBroken) {
          try {
            const parsed = new URL(baseUrl);
            const hostReplacement = SPECIALIST_HOST_DEFAULT_REPLACEMENT[parsed.hostname.toLowerCase()];
            if (hostReplacement) {
              fallbackReplacement = hostReplacement;
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
            `Specialist handoff baseUrl ${baseUrl} failed HTTP verification with status ${probe.statusCode}.`,
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

async function persistTaskFindingToDb(
  task: ReferenceMaintenanceTask,
  eventName: string,
  summary: string,
): Promise<void> {
  const db = await getRequiredEarthosDb();
  const taskPayload = task as unknown as Record<string, unknown>;

  await db
    .insert(earthosControlMapFindings)
    .values({
      findingId: task.findingId,
      status: task.status,
      severity: task.severity,
      owner: "earthos-reference-maintainer",
      note: summary,
      metadata: taskPayload,
      updatedAt: new Date(task.updatedAt),
    })
    .onConflictDoUpdate({
      target: earthosControlMapFindings.findingId,
      set: {
        status: task.status,
        severity: task.severity,
        owner: "earthos-reference-maintainer",
        note: summary,
        metadata: taskPayload,
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
}

function parseTaskFromFindingRow(
  row: typeof earthosControlMapFindings.$inferSelect,
): ReferenceMaintenanceTask | null {
  const meta = row.metadata as Partial<ReferenceMaintenanceTask> | null;
  if (!meta || typeof meta.taskId !== "string" || !Array.isArray(meta.issues)) {
    return null;
  }
  return {
    taskId: meta.taskId,
    findingId: row.findingId,
    nodeId: meta.nodeId as TravelReferenceNode["id"],
    canonicalPath: meta.canonicalPath || `/${meta.nodeId}`,
    status: (row.status as ReferenceMaintenanceTask["status"]) || meta.status || "open",
    severity: (row.severity as ReferenceMaintenanceTask["severity"]) || meta.severity || "watch",
    createdAt: meta.createdAt || row.createdAt.toISOString(),
    updatedAt: meta.updatedAt || row.updatedAt.toISOString(),
    closedAt: meta.closedAt ?? null,
    closedBy: meta.closedBy ?? null,
    missionId: meta.missionId || "",
    driftEventId: meta.driftEventId || "",
    packetId: meta.packetId || "",
    issues: meta.issues,
    sourceReviews: Array.isArray(meta.sourceReviews) ? meta.sourceReviews : [],
    verificationEvidence: meta.verificationEvidence ?? null,
  };
}

export async function recordReferenceMaintenanceTask(
  nodeId: TravelReferenceNode["id"],
  issues: ReferenceMaintenanceIssue[],
): Promise<ReferenceMaintenanceTask> {
  const nodeIssues = issues.filter((issue) => issue.nodeId === nodeId);
  if (nodeIssues.length === 0) {
    throw new Error(`No reference maintenance issues to record for node ${nodeId}.`);
  }

  // Ensure DB is available before creating any task records
  await getRequiredEarthosDb();

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

  if (!driftEvent) {
    throw new Error(`Failed to persist governance drift event for task ${taskId}.`);
  }

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

  if (!packet) {
    throw new Error(`Failed to persist governance reconciliation packet for task ${taskId}.`);
  }

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
    driftEventId: driftEvent.id,
    packetId: packet.id,
    issues: nodeIssues,
    sourceReviews: [],
    verificationEvidence: null,
  };

  await persistTaskFindingToDb(
    task,
    "reference_drift_detected",
    `Opened maintenance task ${taskId} with ${nodeIssues.length} issue(s).`,
  );

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

  return task;
}

export async function getReferenceMaintenanceTask(
  taskId: string,
): Promise<ReferenceMaintenanceTask | null> {
  const db = await getRequiredEarthosDb();
  const rows = await db
    .select()
    .from(earthosControlMapFindings)
    .where(
      and(
        eq(earthosControlMapFindings.owner, "earthos-reference-maintainer"),
        sql`${earthosControlMapFindings.metadata}->>'taskId' = ${taskId}`,
      ),
    )
    .limit(1);

  if (!rows[0]) return null;
  return parseTaskFromFindingRow(rows[0]);
}

export async function listReferenceMaintenanceTasks(options: {
  nodeId?: TravelReferenceNode["id"];
  status?: ReferenceMaintenanceTask["status"];
  limit?: number;
} = {}): Promise<ReferenceMaintenanceTask[]> {
  const db = await getRequiredEarthosDb();
  const rows = await db
    .select()
    .from(earthosControlMapFindings)
    .where(eq(earthosControlMapFindings.owner, "earthos-reference-maintainer"))
    .orderBy(desc(earthosControlMapFindings.updatedAt))
    .limit(options.limit || 100);

  const tasks = rows
    .map(parseTaskFromFindingRow)
    .filter((t): t is ReferenceMaintenanceTask => t !== null);

  return tasks.filter((task) => {
    if (options.nodeId && task.nodeId !== options.nodeId) return false;
    if (options.status && task.status !== options.status) return false;
    return true;
  });
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
  const task = await getReferenceMaintenanceTask(options.taskId);
  if (!task) {
    throw new Error(`Reference maintenance task ${options.taskId} not found in durable backend.`);
  }

  const baseTargetNode =
    options.targetNode || (await getPublishedTravelReferenceNodeById(task.nodeId));
  const now = new Date().toISOString();
  const governance = getDurableGovernanceRecordService();

  if (options.approved !== true) {
    await signalWorkflowMission(task.missionId, "erich-approval", {
      approved: false,
      operator: options.operator,
    });

    task.status = "rejected";
    task.updatedAt = now;

    await persistTaskFindingToDb(
      task,
      "reference_remediation_rejected",
      `Remediation rejected by ${options.operator}.`,
    );

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

    return {
      applied: false,
      task,
      remediatedNode: baseTargetNode,
      unreviewedStaleCitationIds: [],
    };
  }

  // Clone and apply corrections to targetNode
  const remediatedNode: TravelReferenceNode = structuredClone(baseTargetNode);
  const existingOverride = await readPublishedReferenceNodeOverrideFromDb(task.nodeId);
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

  // Persist approved override in the durable Postgres backend before marking task remediated
  await setPublishedReferenceNodeOverride(nextOverride);

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

  await persistTaskFindingToDb(
    task,
    "reference_remediation_applied",
    `Applied approved remediation for task ${task.taskId} by ${options.operator}.`,
  );

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
  deployedBaseUrl?: string;
  fetchDeployedPage?: DeployedPageFetchFn;
}): Promise<ReferenceMaintenanceTask> {
  const task = await getReferenceMaintenanceTask(options.taskId);
  if (!task) {
    throw new Error(`Reference maintenance task ${options.taskId} not found in durable backend.`);
  }
  if (task.status !== "remediated_pending_recheck") {
    throw new Error(
      `Cannot verify and close task ${options.taskId} from status '${task.status}' (must be 'remediated_pending_recheck').`,
    );
  }

  const now = options.now || new Date();
  const verifiedAt = now.toISOString();
  const probeUrl = options.probeUrl || defaultSpecialistUrlProbe;
  const fetchDeployedPage = options.fetchDeployedPage || defaultDeployedPageFetcher;

  // 1. Read the published destination node from durable DB
  const publishedNode = await getPublishedTravelReferenceNodeById(task.nodeId);
  const nodeUnderTest = options.remediatedNode || publishedNode;

  // 2. Fetch the deployed destination page over HTTP and inspect its rendered HTML
  const deployedBase = resolveDeployedBaseUrl(options.deployedBaseUrl);
  const deployedPageUrl = `${deployedBase}${task.canonicalPath}`;
  const deployedPage = await fetchDeployedPage(deployedPageUrl);

  if (!deployedPage.ok || deployedPage.statusCode !== 200) {
    throw new Error(
      `Deployed destination page fetch failed for ${deployedPageUrl} with HTTP status ${deployedPage.statusCode}.`,
    );
  }

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
      const correctedPresentInNode =
        actualUrl === issue.recommendedValue.trim() &&
        publishedUrl === issue.recommendedValue.trim() &&
        !KNOWN_BROKEN_SPECIALIST_URLS[actualUrl];

      const oldAbsentFromHtml = !deployedPage.html.includes(issue.observedValue.trim());
      const correctedPresentInHtml = deployedPage.html.includes(issue.recommendedValue.trim());

      contentAssertions.push({
        targetId: issue.targetId,
        kind: issue.kind,
        oldValueAbsentFromPublishedNode: !oldUrlStillInNode && actualUrl !== issue.observedValue.trim(),
        correctedValuePresentInPublishedNode: correctedPresentInNode,
        oldValueAbsentFromDeployedHtml: oldAbsentFromHtml,
        correctedValuePresentInDeployedHtml: correctedPresentInHtml,
        publishedValue: publishedUrl,
        sourceReviewVerified: true,
      });

      if (oldUrlStillInNode || !correctedPresentInNode) {
        contentFailures.push(
          `Broken specialist link ${issue.targetId} was not replaced in published destination model (observed='${publishedUrl}', expected='${issue.recommendedValue}').`,
        );
      } else if (!oldAbsentFromHtml || !correctedPresentInHtml) {
        contentFailures.push(
          `Deployed destination page ${deployedPageUrl} does not contain corrected specialist link '${issue.recommendedValue}' or still contains broken link '${issue.observedValue}'.`,
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

      const staleAttrSnippet = `data-citation-id="${issue.targetId}" data-last-checked="${issue.observedValue}"`;
      const freshAttrSnippet = `data-citation-id="${issue.targetId}" data-last-checked="${publishedCheckedAt}"`;
      const oldAbsentFromHtml = !deployedPage.html.includes(staleAttrSnippet);
      const correctedPresentInHtml =
        attestation !== undefined &&
        deployedPage.html.includes(freshAttrSnippet) &&
        deployedPage.html.includes(attestation.reviewerNotes);

      contentAssertions.push({
        targetId: issue.targetId,
        kind: issue.kind,
        oldValueAbsentFromPublishedNode: oldDateReplaced,
        correctedValuePresentInPublishedNode: oldDateReplaced && noteMatches,
        oldValueAbsentFromDeployedHtml: oldAbsentFromHtml,
        correctedValuePresentInDeployedHtml: correctedPresentInHtml,
        publishedValue: publishedCheckedAt,
        sourceReviewVerified: attestationCheck.valid,
      });

      if (!attestationCheck.valid) {
        contentFailures.push(
          `Stale evidence source ${issue.targetId} cannot be closed without source review: ${attestationCheck.reason}`,
        );
      } else if (!oldDateReplaced || !noteMatches) {
        contentFailures.push(
          `Stale evidence source ${issue.targetId} review did not reach published destination model.`,
        );
      } else if (!oldAbsentFromHtml || !correctedPresentInHtml) {
        contentFailures.push(
          `Deployed destination page ${deployedPageUrl} does not render updated evidence citation ${issue.targetId} (${freshAttrSnippet}) and source review note.`,
        );
      }
    } else if (issue.kind === "broken_internal_relationship") {
      const publishedRel = publishedNode.relationships.find((r) => r.id === issue.targetId);
      const candidateRel = nodeUnderTest.relationships.find((r) => r.id === issue.targetId);
      const publishedHref = (publishedRel?.href || "").trim();
      const candidateHref = (candidateRel?.href || "").trim();
      const routeValid = matchesInternalRoute(publishedHref).valid;
      const correctedPresentInNode =
        publishedHref === issue.recommendedValue.trim() &&
        candidateHref === issue.recommendedValue.trim() &&
        routeValid;

      const oldAbsentFromHtml = !deployedPage.html.includes(`href="${issue.observedValue.trim()}"`);
      const correctedPresentInHtml = deployedPage.html.includes(issue.recommendedValue.trim());

      contentAssertions.push({
        targetId: issue.targetId,
        kind: issue.kind,
        oldValueAbsentFromPublishedNode: publishedHref !== issue.observedValue.trim(),
        correctedValuePresentInPublishedNode: correctedPresentInNode,
        oldValueAbsentFromDeployedHtml: oldAbsentFromHtml,
        correctedValuePresentInDeployedHtml: correctedPresentInHtml,
        publishedValue: publishedHref,
        sourceReviewVerified: true,
      });

      if (!correctedPresentInNode || !oldAbsentFromHtml || !correctedPresentInHtml) {
        contentFailures.push(
          `Broken internal relationship ${issue.targetId} was not repaired in deployed destination page ${deployedPageUrl} (observed='${publishedHref}', expected='${issue.recommendedValue}').`,
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
    deployedPage.ok &&
    deployedPage.statusCode === 200 &&
    probeResults.every((p) => p.ok) &&
    contentAssertions.every(
      (a) =>
        a.oldValueAbsentFromPublishedNode &&
        a.correctedValuePresentInPublishedNode &&
        a.oldValueAbsentFromDeployedHtml &&
        a.correctedValuePresentInDeployedHtml &&
        a.sourceReviewVerified,
    );

  if (!recheckPassed) {
    throw new Error(
      `Recheck failed for task ${task.taskId}: ${remainingIssues.length} remaining issue(s), routeValid=${routeCheck.valid}, deployedStatus=${deployedPage.statusCode}.`,
    );
  }

  const evidence: ReferenceVerificationEvidence = {
    verifiedAt,
    verifiedBy: options.verifiedBy,
    publicCanonicalPath: nodeUnderTest.canonicalPath,
    deployedPageUrl,
    deployedPageStatusCode: deployedPage.statusCode,
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

  await persistTaskFindingToDb(
    task,
    "reference_maintenance_task_closed",
    `Closed task ${task.taskId} after deployed destination page (${deployedPageUrl}) and specialist handoff recheck passed.`,
  );

  appendEarthOSAuditEvent({
    eventType: "reference_maintenance_task_closed",
    entity: "earthos",
    corridorId: task.nodeId,
    severity: "info",
    summary: `Closed maintenance task ${task.taskId} for ${task.canonicalPath} after verifying deployed HTML at ${deployedPageUrl}.`,
    metadata: {
      taskId: task.taskId,
      findingId: task.findingId,
      driftEventId: task.driftEventId,
      packetId: task.packetId,
      missionId: task.missionId,
      verificationEvidence: evidence,
    },
  });

  return task;
}

export async function runReferenceMaintenanceLoop(options: {
  targetNode: TravelReferenceNode;
  operator: string;
  sourceReviews?: SourceReviewAttestation[];
  now?: Date;
  maxEvidenceAgeDays?: number;
  probeUrl?: UrlProbeFn;
  deployedBaseUrl?: string;
  fetchDeployedPage?: DeployedPageFetchFn;
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
    deployedBaseUrl: options.deployedBaseUrl,
    fetchDeployedPage: options.fetchDeployedPage,
  });

  return {
    detectedIssues,
    task: closedTask,
    remediatedNode,
  };
}

/**
 * Scheduled detection entrypoint invoked by Vercel Cron (/api/internal/earthos/reference-maintenance)
 * or authenticated operator sweeps. Evaluates all published TravelReferenceNodes using real HTTP probes
 * and records durable maintenance tasks in Neon Postgres for any node with detected issues.
 */
export async function runScheduledReferenceMaintenanceDetection(options: {
  now?: Date;
  maxEvidenceAgeDays?: number;
  probeUrl?: UrlProbeFn;
  nodes?: TravelReferenceNode[];
} = {}): Promise<{
  checkedAt: string;
  scannedNodeIds: Array<TravelReferenceNode["id"]>;
  detectedIssueCount: number;
  issues: ReferenceMaintenanceIssue[];
  recordedTasks: ReferenceMaintenanceTask[];
  existingOpenTasks: ReferenceMaintenanceTask[];
}> {
  const now = options.now || new Date();
  const checkedAt = now.toISOString();
  const nodes = options.nodes || (await getAllPublishedTravelReferenceNodes());
  const issues = await detectReferenceMaintenanceIssues({
    nodes,
    now,
    maxEvidenceAgeDays: options.maxEvidenceAgeDays,
    probeUrl: options.probeUrl,
  });

  const openTasks = await listReferenceMaintenanceTasks({ status: "open" });
  const recordedTasks: ReferenceMaintenanceTask[] = [];
  const existingOpenTasks: ReferenceMaintenanceTask[] = [];

  const issuesByNode = new Map<TravelReferenceNode["id"], ReferenceMaintenanceIssue[]>();
  for (const issue of issues) {
    const list = issuesByNode.get(issue.nodeId) || [];
    list.push(issue);
    issuesByNode.set(issue.nodeId, list);
  }

  for (const [nodeId, nodeIssues] of issuesByNode.entries()) {
    const issueSignature = nodeIssues
      .map((i) => `${i.issueId}:${i.observedValue}`)
      .sort()
      .join("|");

    const matchingOpen = openTasks.find((t) => {
      if (t.nodeId !== nodeId) return false;
      const openSig = t.issues
        .map((i) => `${i.issueId}:${i.observedValue}`)
        .sort()
        .join("|");
      return openSig === issueSignature;
    });

    if (matchingOpen) {
      existingOpenTasks.push(matchingOpen);
    } else {
      const created = await recordReferenceMaintenanceTask(nodeId, nodeIssues);
      recordedTasks.push(created);
    }
  }

  appendEarthOSAuditEvent({
    eventType: "reference_drift_detected",
    entity: "earthos",
    corridorId: "travel-reference-network",
    severity: issues.some((i) => i.severity === "critical")
      ? "critical"
      : issues.length > 0
        ? "watch"
        : "info",
    summary: `Scheduled reference maintenance scan checked ${nodes.length} node(s): ${issues.length} issue(s) found, ${recordedTasks.length} new task(s) persisted, ${existingOpenTasks.length} existing open task(s).`,
    metadata: {
      checkedAt,
      scannedNodeIds: nodes.map((n) => n.id),
      detectedIssueCount: issues.length,
      recordedTaskIds: recordedTasks.map((t) => t.taskId),
      existingOpenTaskIds: existingOpenTasks.map((t) => t.taskId),
    },
  });

  return {
    checkedAt,
    scannedNodeIds: nodes.map((n) => n.id),
    detectedIssueCount: issues.length,
    issues,
    recordedTasks,
    existingOpenTasks,
  };
}
