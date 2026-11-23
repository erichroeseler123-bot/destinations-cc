import { createHash } from "node:crypto";
import type {
  CanonicalHeldHostedEvidenceRecord,
  CanonicalHostedCatalogSnapshot,
  CanonicalHostedOrganizerFactRecord,
  CanonicalHostedSailingFactRecord,
} from "./canonicalHostedCruiseContract";
import { getDccCanonicalHostedCatalogSnapshot } from "./hostedCatalogRegistry";
import {
  enqueueDccFactVerificationItem,
  listDccFactVerificationQueue,
  type DccFactVerificationQueueItem,
} from "./canonicalLocationsAndRoutePatterns";

export type HostedSourceReviewReasonCode =
  | "stale_overdue_check"
  | "source_material_changed"
  | "source_probe_blocked";

export interface SourceProbeLedgerEntry {
  entityType: "hosted_sailing" | "organizer";
  entityId: string;
  organizerSlug: string;
  sailingSlug?: string;
  sourceUrl: string;
  lastAttemptedAt: string;
  lastContentVerifiedAt: string;
  probeStatus: "http_403_waf" | "connection_closed";
  note: string;
}

/**
 * Explicit ledger of organizer/charter domains whose automated HTTP sweep on 2026-11-23
 * encountered a WAF challenge (HTTP 403) or TCP connection reset, so DCC preserves their
 * honest 2026-11-16 content-verified timestamp and routes them into manual browser review.
 */
export const DCC_SOURCE_PROBE_STATUS_LEDGER: ReadonlyArray<SourceProbeLedgerEntry> = [
  {
    entityType: "hosted_sailing",
    entityId: "hosted-sailing:pied-piper-travel:vv:brilliant-lady:2027-08-24",
    organizerSlug: "pied-piper-travel",
    sailingSlug: "brilliant-lady-2027-08-24",
    sourceUrl: "https://www.piedpipertravel.com/",
    lastAttemptedAt: "2026-11-23T11:30:17Z",
    lastContentVerifiedAt: "2026-11-16T08:30:00Z",
    probeStatus: "http_403_waf",
    note: "piedpipertravel.com returned HTTP 403 to automated fetch on 2026-11-23; queued for manual browser verification before 14-day freshness window expires.",
  },
  {
    entityType: "hosted_sailing",
    entityId: "hosted-sailing:ultimate-music-cruises:rccl:freedom-of-the-seas:2027-01-14",
    organizerSlug: "ultimate-music-cruises",
    sailingSlug: "70000tons-of-metal-freedom-of-the-seas-2027-01-14",
    sourceUrl: "https://70000tons.com/",
    lastAttemptedAt: "2026-11-23T11:30:17Z",
    lastContentVerifiedAt: "2026-11-16T14:00:00Z",
    probeStatus: "http_403_waf",
    note: "70000tons.com returned Cloudflare HTTP 403 challenge on 2026-11-23 (parent umcruises.com verified 200 OK); queued for manual browser verification ahead of Jan 14, 2027 departure.",
  },
  {
    entityType: "hosted_sailing",
    entityId: "hosted-sailing:gaysail:gaysail:lagoon-520-catamaran-phuket:2027-03-20",
    organizerSlug: "gaysail",
    sailingSlug: "lagoon-520-phuket-2027-03-20",
    sourceUrl:
      "https://gaysail.com/program/gaynudesail-exclusive/44-gaysail-exclusive-thailand-2027",
    lastAttemptedAt: "2026-11-23T11:30:17Z",
    lastContentVerifiedAt: "2026-11-16T08:30:00Z",
    probeStatus: "connection_closed",
    note: "gaysail.com closed automated TLS socket on 2026-11-23; queued for manual browser verification.",
  },
  {
    entityType: "hosted_sailing",
    entityId: "hosted-sailing:gaysail:gaysail:lagoon-520-catamaran-phuket:2027-03-27",
    organizerSlug: "gaysail",
    sailingSlug: "lagoon-520-phuket-2027-03-27",
    sourceUrl:
      "https://gaysail.com/program/gaynudesail-exclusive/45-gaynudesail-exclusive-thailand-2027",
    lastAttemptedAt: "2026-11-23T11:30:17Z",
    lastContentVerifiedAt: "2026-11-16T08:30:00Z",
    probeStatus: "connection_closed",
    note: "gaysail.com closed automated TLS socket on 2026-11-23; queued for manual browser verification.",
  },
  {
    entityType: "hosted_sailing",
    entityId: "hosted-sailing:gaysail:gaysail:lagoon-420-catamaran-dalmatia:2027-06-19",
    organizerSlug: "gaysail",
    sailingSlug: "lagoon-420-split-2027-06-19",
    sourceUrl:
      "https://gaysail.com/program/gaysail-exclusive/51-gaysail-exclusive-split-hvar-dubrovnik-2027",
    lastAttemptedAt: "2026-11-23T11:30:17Z",
    lastContentVerifiedAt: "2026-11-16T08:30:00Z",
    probeStatus: "connection_closed",
    note: "gaysail.com closed automated TLS socket on 2026-11-23; queued for manual browser verification.",
  },
];

export interface HostedSourceReviewAlert {
  alertId: string;
  verificationQueueId: string;
  entityType: "hosted_sailing" | "organizer" | "release_watch_hold";
  entityId: string;
  organizerSlug: string;
  sailingSlug: string | null;
  title: string;
  sourceUrl: string;
  checkedAt: string;
  ageDays: number;
  maxAllowedAgeDays: number;
  sailDate: string | null;
  daysUntilDeparture: number | null;
  sourceFingerprint: string;
  baselineFingerprint: string | null;
  reasons: HostedSourceReviewReasonCode[];
  summary: string;
}

export interface HostedCatalogStalenessEvaluation {
  evaluatedAt: string;
  policy: {
    defaultMaxAgeDays: number;
    imminentDepartureWindowDays: number;
    imminentMaxAgeDays: number;
    scheduleHoldMaxAgeDays: number;
  };
  counts: {
    evaluatedSailings: number;
    evaluatedOrganizers: number;
    evaluatedReleaseWatchItems: number;
    totalAlerts: number;
    overdueCheckCount: number;
    materialChangedCount: number;
    probeBlockedCount: number;
  };
  fingerprintsByEntityId: Record<string, string>;
  alerts: HostedSourceReviewAlert[];
}

export interface EvaluateHostedCatalogStalenessOptions {
  snapshot?: CanonicalHostedCatalogSnapshot;
  now?: Date | string;
  defaultMaxAgeDays?: number;
  imminentDepartureWindowDays?: number;
  imminentMaxAgeDays?: number;
  scheduleHoldMaxAgeDays?: number;
  baselineFingerprints?: Record<string, string>;
  includeProbeBlocked?: boolean;
}

function stableSha256Hex(payload: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex")
    .slice(0, 16);
}

export function computeHostedSailingSourceFingerprint(
  sailing: Pick<
    CanonicalHostedSailingFactRecord,
    | "hostedSailingId"
    | "primarySourceUrl"
    | "officialSailingPageUrl"
    | "officialReservationFormUrl"
    | "canonicalSailDate"
    | "canonicalShipSlug"
    | "cabinAvailabilityStatus"
    | "cabinAvailabilityNote"
    | "verifiedStartingPriceUsd"
    | "publishedPriceDisplay"
    | "verificationState"
    | "scheduleHoldReason"
  >,
): string {
  return `hsrc_${stableSha256Hex({
    id: sailing.hostedSailingId,
    primarySourceUrl: sailing.primarySourceUrl ?? "",
    officialSailingPageUrl: sailing.officialSailingPageUrl ?? "",
    officialReservationFormUrl: sailing.officialReservationFormUrl ?? "",
    canonicalSailDate: sailing.canonicalSailDate,
    canonicalShipSlug: sailing.canonicalShipSlug,
    cabinAvailabilityStatus: sailing.cabinAvailabilityStatus,
    cabinAvailabilityNote: sailing.cabinAvailabilityNote ?? "",
    verifiedStartingPriceUsd: sailing.verifiedStartingPriceUsd ?? null,
    publishedPriceDisplay: sailing.publishedPriceDisplay ?? "",
    verificationState: sailing.verificationState ?? "verified",
    scheduleHoldReason: sailing.scheduleHoldReason ?? null,
  })}`;
}

export function computeHostedOrganizerSourceFingerprint(
  organizer: Pick<
    CanonicalHostedOrganizerFactRecord,
    "organizerId" | "primarySourceUrl" | "officialWebsiteUrl" | "verificationState"
  >,
): string {
  return `osrc_${stableSha256Hex({
    id: organizer.organizerId,
    primarySourceUrl: organizer.primarySourceUrl ?? "",
    officialWebsiteUrl: organizer.officialWebsiteUrl ?? "",
    verificationState: organizer.verificationState ?? "verified",
  })}`;
}

export function computeHeldEvidenceSourceFingerprint(
  hold: Pick<
    CanonicalHeldHostedEvidenceRecord,
    | "holdId"
    | "checkedSourceUrl"
    | "reasonCode"
    | "candidateTitle"
    | "candidateDatesOrVessel"
    | "holdReason"
  >,
): string {
  return `rwsrc_${stableSha256Hex({
    id: hold.holdId,
    checkedSourceUrl: hold.checkedSourceUrl,
    reasonCode: hold.reasonCode,
    candidateTitle: hold.candidateTitle,
    candidateDatesOrVessel: hold.candidateDatesOrVessel,
    holdReason: hold.holdReason,
  })}`;
}

function diffDays(laterMs: number, earlierIso: string): number {
  const parsed = Date.parse(earlierIso);
  if (!Number.isFinite(parsed)) return Number.POSITIVE_INFINITY;
  return Math.round(((laterMs - parsed) / 86_400_000) * 100) / 100;
}

function daysUntilIsoDate(nowMs: number, sailDateIso: string | null): number | null {
  if (!sailDateIso) return null;
  const parsed = Date.parse(`${sailDateIso}T00:00:00Z`);
  if (!Number.isFinite(parsed)) return null;
  return Math.ceil((parsed - nowMs) / 86_400_000);
}

export function evaluateDccHostedCatalogStaleness(
  options: EvaluateHostedCatalogStalenessOptions = {},
): HostedCatalogStalenessEvaluation {
  const snapshot =
    options.snapshot ?? getDccCanonicalHostedCatalogSnapshot({ includeHeld: true });
  const nowDate =
    options.now instanceof Date
      ? options.now
      : typeof options.now === "string"
        ? new Date(options.now)
        : new Date();
  const nowMs = nowDate.getTime();
  const defaultMaxAgeDays = options.defaultMaxAgeDays ?? 14;
  const imminentDepartureWindowDays = options.imminentDepartureWindowDays ?? 60;
  const imminentMaxAgeDays = options.imminentMaxAgeDays ?? 7;
  const scheduleHoldMaxAgeDays = options.scheduleHoldMaxAgeDays ?? 7;
  const includeProbeBlocked = options.includeProbeBlocked ?? true;
  const baselineFingerprints = options.baselineFingerprints ?? {};

  const probeByEntityId = new Map<string, SourceProbeLedgerEntry>();
  for (const entry of DCC_SOURCE_PROBE_STATUS_LEDGER) {
    probeByEntityId.set(entry.entityId, entry);
  }

  const fingerprintsByEntityId: Record<string, string> = {};
  const alerts: HostedSourceReviewAlert[] = [];

  for (const sailing of snapshot.hostedSailings) {
    if (sailing.lifecycleStatus !== "upcoming") continue;
    const fp = computeHostedSailingSourceFingerprint(sailing);
    fingerprintsByEntityId[sailing.hostedSailingId] = fp;

    const checkedAt =
      sailing.organizerSourceCheckedAt || snapshot.generatedAt;
    const ageDays = diffDays(nowMs, checkedAt);
    const daysUntil = daysUntilIsoDate(nowMs, sailing.canonicalSailDate);
    const isImminent =
      daysUntil !== null &&
      daysUntil >= 0 &&
      daysUntil <= imminentDepartureWindowDays;
    const isHold =
      sailing.verificationState === "schedule_hold" ||
      Boolean(sailing.scheduleHoldReason);
    const maxAllowedAgeDays = isHold
      ? scheduleHoldMaxAgeDays
      : isImminent
        ? imminentMaxAgeDays
        : defaultMaxAgeDays;

    const reasons: HostedSourceReviewReasonCode[] = [];
    if (ageDays > maxAllowedAgeDays) {
      reasons.push("stale_overdue_check");
    }
    const baselineFp = baselineFingerprints[sailing.hostedSailingId] ?? null;
    if (baselineFp && baselineFp !== fp) {
      reasons.push("source_material_changed");
    }
    const probeEntry = probeByEntityId.get(sailing.hostedSailingId);
    if (includeProbeBlocked && probeEntry) {
      reasons.push("source_probe_blocked");
    }

    if (reasons.length > 0) {
      const summaryParts: string[] = [];
      if (reasons.includes("source_material_changed")) {
        summaryParts.push(
          `Material source fingerprint changed (${baselineFp} -> ${fp}); re-verify organizer pricing/availability/schedule.`,
        );
      }
      if (reasons.includes("stale_overdue_check")) {
        summaryParts.push(
          `Source check is ${ageDays.toFixed(1)}d old (max ${maxAllowedAgeDays}d${isImminent ? ` within ${imminentDepartureWindowDays}d of departure` : isHold ? " for schedule_hold" : ""}).`,
        );
      }
      if (reasons.includes("source_probe_blocked") && probeEntry) {
        summaryParts.push(probeEntry.note);
      }

      const safeId = sailing.hostedSailingId.replace(/[^a-zA-Z0-9_-]/g, "_");
      alerts.push({
        alertId: `stale_alert_${safeId}`,
        verificationQueueId: `vf_stale_src_${safeId}`,
        entityType: "hosted_sailing",
        entityId: sailing.hostedSailingId,
        organizerSlug: sailing.organizerSlug,
        sailingSlug: sailing.sailingSlug,
        title: sailing.sailingTitle,
        sourceUrl: sailing.primarySourceUrl || sailing.officialSailingPageUrl,
        checkedAt,
        ageDays,
        maxAllowedAgeDays,
        sailDate: sailing.canonicalSailDate,
        daysUntilDeparture: daysUntil,
        sourceFingerprint: fp,
        baselineFingerprint: baselineFp,
        reasons,
        summary: summaryParts.join(" "),
      });
    }
  }

  for (const org of snapshot.organizers) {
    const fp = computeHostedOrganizerSourceFingerprint(org);
    fingerprintsByEntityId[org.organizerId] = fp;
    const checkedAt = org.verifiedSourceCheckedAt || snapshot.generatedAt;
    const ageDays = diffDays(nowMs, checkedAt);
    const isHold = org.verificationState === "schedule_hold";
    const maxAllowedAgeDays = isHold ? scheduleHoldMaxAgeDays : defaultMaxAgeDays;

    const reasons: HostedSourceReviewReasonCode[] = [];
    if (ageDays > maxAllowedAgeDays) {
      reasons.push("stale_overdue_check");
    }
    const baselineFp = baselineFingerprints[org.organizerId] ?? null;
    if (baselineFp && baselineFp !== fp) {
      reasons.push("source_material_changed");
    }

    if (reasons.length > 0) {
      const safeId = org.organizerId.replace(/[^a-zA-Z0-9_-]/g, "_");
      alerts.push({
        alertId: `stale_alert_${safeId}`,
        verificationQueueId: `vf_stale_src_${safeId}`,
        entityType: "organizer",
        entityId: org.organizerId,
        organizerSlug: org.organizerSlug,
        sailingSlug: null,
        title: org.organizerName,
        sourceUrl: org.primarySourceUrl || org.officialWebsiteUrl,
        checkedAt,
        ageDays,
        maxAllowedAgeDays,
        sailDate: null,
        daysUntilDeparture: null,
        sourceFingerprint: fp,
        baselineFingerprint: baselineFp,
        reasons,
        summary: reasons.includes("source_material_changed")
          ? `Organizer source fingerprint changed (${baselineFp} -> ${fp}); return to review queue.`
          : `Organizer source check is ${ageDays.toFixed(1)}d old (max ${maxAllowedAgeDays}d).`,
      });
    }
  }

  const releaseWatchItems = snapshot.heldInsufficientEvidenceItems ?? [];
  for (const hold of releaseWatchItems) {
    const fp = computeHeldEvidenceSourceFingerprint(hold);
    fingerprintsByEntityId[hold.holdId] = fp;
    const ageDays = diffDays(nowMs, hold.checkedAt);
    const maxAllowedAgeDays = defaultMaxAgeDays;

    const reasons: HostedSourceReviewReasonCode[] = [];
    if (ageDays > maxAllowedAgeDays) {
      reasons.push("stale_overdue_check");
    }
    const baselineFp = baselineFingerprints[hold.holdId] ?? null;
    if (baselineFp && baselineFp !== fp) {
      reasons.push("source_material_changed");
    }

    if (reasons.length > 0) {
      const safeId = hold.holdId.replace(/[^a-zA-Z0-9_-]/g, "_");
      alerts.push({
        alertId: `stale_alert_${safeId}`,
        verificationQueueId: `vf_stale_src_${safeId}`,
        entityType: "release_watch_hold",
        entityId: hold.holdId,
        organizerSlug: hold.organizerSlug,
        sailingSlug: null,
        title: hold.candidateTitle,
        sourceUrl: hold.checkedSourceUrl,
        checkedAt: hold.checkedAt,
        ageDays,
        maxAllowedAgeDays,
        sailDate: null,
        daysUntilDeparture: null,
        sourceFingerprint: fp,
        baselineFingerprint: baselineFp,
        reasons,
        summary: reasons.includes("source_material_changed")
          ? `Release-watch candidate changed (${baselineFp} -> ${fp}); review for promotion or hold update.`
          : `Release-watch check is ${ageDays.toFixed(1)}d old (max ${maxAllowedAgeDays}d).`,
      });
    }
  }

  return {
    evaluatedAt: nowDate.toISOString(),
    policy: {
      defaultMaxAgeDays,
      imminentDepartureWindowDays,
      imminentMaxAgeDays,
      scheduleHoldMaxAgeDays,
    },
    counts: {
      evaluatedSailings: snapshot.hostedSailings.length,
      evaluatedOrganizers: snapshot.organizers.length,
      evaluatedReleaseWatchItems: releaseWatchItems.length,
      totalAlerts: alerts.length,
      overdueCheckCount: alerts.filter((a) =>
        a.reasons.includes("stale_overdue_check"),
      ).length,
      materialChangedCount: alerts.filter((a) =>
        a.reasons.includes("source_material_changed"),
      ).length,
      probeBlockedCount: alerts.filter((a) =>
        a.reasons.includes("source_probe_blocked"),
      ).length,
    },
    fingerprintsByEntityId,
    alerts,
  };
}

/**
 * Enqueues any overdue, material-changed, or probe-blocked hosted records into
 * DCC's canonical Fact Verification Queue (`needs_review`), and resolves previously
 * enqueued `vf_stale_src_*` items whose sources have since been re-verified.
 */
export function syncStaleOrChangedHostedRecordsToVerificationQueue(
  options: EvaluateHostedCatalogStalenessOptions & {
    isSyntheticTest?: boolean;
  } = {},
): {
  evaluation: HostedCatalogStalenessEvaluation;
  enqueuedItems: DccFactVerificationQueueItem[];
  resolvedVerificationIds: string[];
} {
  const evaluation = evaluateDccHostedCatalogStaleness(options);
  const activeVerificationIds = new Set(
    evaluation.alerts.map((a) => a.verificationQueueId),
  );
  const enqueuedItems: DccFactVerificationQueueItem[] = [];

  for (const alert of evaluation.alerts) {
    const queueEntityType: DccFactVerificationQueueItem["entityType"] =
      alert.entityType === "organizer" ? "organizer" : "hosted_sailing";
    const item = enqueueDccFactVerificationItem({
      verificationId: alert.verificationQueueId,
      entityType: queueEntityType,
      entityId: alert.entityId,
      fieldPath: alert.reasons.includes("source_material_changed")
        ? "sourceFingerprint"
        : "organizerSourceCheckedAt",
      currentVerifiedValue: {
        checkedAt: alert.checkedAt,
        sourceFingerprint: alert.baselineFingerprint ?? alert.sourceFingerprint,
      },
      proposedOrConflictingValue: {
        reasons: alert.reasons,
        ageDays: alert.ageDays,
        maxAllowedAgeDays: alert.maxAllowedAgeDays,
        currentFingerprint: alert.sourceFingerprint,
      },
      submittedByRole: "dcc_source_audit",
      submittedByActor: "dcc:stale-source-monitor",
      sourceUrl: alert.sourceUrl,
      conflictSummary: alert.summary,
      state: "needs_review",
      createdAt: evaluation.evaluatedAt,
      isSyntheticTest: Boolean(options.isSyntheticTest),
    });
    enqueuedItems.push(item);
  }

  const existingQueue = listDccFactVerificationQueue({
    includeSyntheticTest: Boolean(options.isSyntheticTest),
  });
  const resolvedVerificationIds: string[] = [];
  for (const existing of existingQueue) {
    if (
      existing.verificationId.startsWith("vf_stale_src_") &&
      Boolean(existing.isSyntheticTest) === Boolean(options.isSyntheticTest) &&
      existing.state === "needs_review" &&
      !activeVerificationIds.has(existing.verificationId)
    ) {
      enqueueDccFactVerificationItem({
        verificationId: existing.verificationId,
        entityType: existing.entityType,
        entityId: existing.entityId,
        fieldPath: existing.fieldPath,
        currentVerifiedValue: existing.currentVerifiedValue,
        proposedOrConflictingValue: existing.proposedOrConflictingValue,
        submittedByRole: existing.submittedByRole,
        submittedByActor: existing.submittedByActor,
        sourceUrl: existing.sourceUrl,
        conflictSummary: `${existing.conflictSummary} [Auto-cleared after fresh source verification at ${evaluation.evaluatedAt}]`,
        state: "approved_into_canonical",
        createdAt: existing.createdAt,
        isSyntheticTest: existing.isSyntheticTest,
      });
      resolvedVerificationIds.push(existing.verificationId);
    }
  }

  return {
    evaluation,
    enqueuedItems,
    resolvedVerificationIds,
  };
}
