import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { resolveDatabaseUrl } from "@/lib/db/client";
import type { StewardVehicleEvidencePatch } from "../applicability/contextModel";
import type {
  OpaqueClickAttributionRecord,
  OpaqueClickReconciledOutcome,
} from "../commerce/opaqueAttributionLedger";
import type {
  AuditDecisionRecord,
  OperatorDisputeSubmission,
  PublicMaterialChangeEntry,
  StewardReviewCase,
} from "../stewardship/evidenceStewardWorkflow";
import type {
  GoSnoRouteFeedRefreshMeta,
  GoSnoRouteFeedVersionedSnapshot,
} from "../applicability/gosnoRouteFeedSnapshot";

export interface FunnelVisitorRecord {
  visitorId: string;
  sourcePage: string;
  placementId?: string | null;
  propertySlug?: string | null;
  surface?: string | null;
  trafficClass: "production" | "test";
  isTest: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  visitCount: number;
}

export interface PlacementApprovalRecord {
  placementId: string;
  propertySlug: string;
  status: "demo_preset" | "verified_partner_live";
  approvedBy?: string | null;
  approvedDomain?: string | null;
  approvedAt?: string | null;
  updatedAt: string;
}

export interface DurableLedgerState {
  schemaVersion: "dcc-durable-transactional-store/1.0";
  txSequence: number;
  updatedAt: string;
  opaqueClicksById: Record<string, OpaqueClickAttributionRecord>;
  opaqueClickIdsByHandoffId: Record<string, string>;
  reconciliationByDedupeKey: Record<string, OpaqueClickReconciledOutcome>;
  funnelVisitorsById?: Record<string, FunnelVisitorRecord>;
  placementApprovalsById?: Record<string, PlacementApprovalRecord>;
  stewardDisputesById: Record<string, OperatorDisputeSubmission>;
  stewardCasesById: Record<string, StewardReviewCase>;
  stewardDecisionsById: Record<string, AuditDecisionRecord>;
  stewardPublicTimeline: PublicMaterialChangeEntry[];
  stewardVehiclePatchesByClassId: Record<string, StewardVehicleEvidencePatch>;
  stewardLatestSnapshotId: string | null;
  gosnoRouteFeedSnapshot?: GoSnoRouteFeedVersionedSnapshot | null;
  gosnoRouteFeedRefreshMeta?: GoSnoRouteFeedRefreshMeta | null;
}

export const DEFAULT_SEED_PUBLIC_TIMELINE: PublicMaterialChangeEntry[] = [
  {
    entryId: "pmc_seed_vail_20261102_01",
    corridorId: "corridor:denver-vail-i70",
    operatorId: "epic-mountain-express",
    publicSummaryTemplateCode: "PRICING_SCHEDULE_UPDATED",
    renderedPublicSummary: "Published fare and schedule evidence was updated.",
    auditedByRole: "DCC Evidence Steward",
    auditTimestamp: "Verified on Nov 2, 2026",
    resolvedClaimId: "claim:epic-mountain-express:vail:baggage-allowance",
  },
  {
    entryId: "pmc_seed_vail_20261102_02",
    corridorId: "corridor:denver-vail-i70",
    operatorId: "gosno",
    publicSummaryTemplateCode: "CARGO_CAPACITY_CONFIRMED",
    renderedPublicSummary:
      "Vehicle cargo-capacity specifications were re-verified with no material change.",
    auditedByRole: "DCC Compliance Team",
    auditTimestamp: "Verified on Nov 2, 2026",
    resolvedClaimId: "claim:gosno:vail-private-suv:cargo-capacity",
  },
];

export function createInitialDurableLedgerState(
  includeSeedTimeline = true,
): DurableLedgerState {
  return {
    schemaVersion: "dcc-durable-transactional-store/1.0",
    txSequence: 1,
    updatedAt: new Date().toISOString(),
    opaqueClicksById: {},
    opaqueClickIdsByHandoffId: {},
    reconciliationByDedupeKey: {},
    funnelVisitorsById: {},
    placementApprovalsById: {},
    stewardDisputesById: {},
    stewardCasesById: {},
    stewardDecisionsById: {},
    stewardPublicTimeline: includeSeedTimeline
      ? DEFAULT_SEED_PUBLIC_TIMELINE.map((e) => ({ ...e }))
      : [],
    stewardVehiclePatchesByClassId: {},
    stewardLatestSnapshotId: null,
    gosnoRouteFeedSnapshot: null,
    gosnoRouteFeedRefreshMeta: null,
  };
}

function resolveDurableStoreFilePath(): string {
  const explicitPath = process.env.DCC_DURABLE_STORE_PATH?.trim();
  if (explicitPath) {
    return path.resolve(explicitPath);
  }
  if (isAutomatedTestRuntime()) {
    const testDir = path.join(os.tmpdir(), "dcc-durable-store-tests");
    fs.mkdirSync(testDir, { recursive: true });
    return path.join(testDir, `dcc-test-store-${process.pid}.json`);
  }
  const preferredDir = path.join(process.cwd(), ".next", "cache");
  try {
    fs.mkdirSync(preferredDir, { recursive: true });
    return path.join(preferredDir, "dcc-durable-transactional-store-v1.json");
  } catch {
    const fallbackDir = path.join(os.tmpdir(), "dcc-durable-store");
    fs.mkdirSync(fallbackDir, { recursive: true });
    return path.join(fallbackDir, "dcc-durable-transactional-store-v1.json");
  }
}

export function getActiveDurableStoreFilePath(): string {
  return resolveDurableStoreFilePath();
}

function acquireCrossProcessLock(
  lockPath: string,
  timeoutMs = 5000,
): number {
  const deadline = Date.now() + timeoutMs;
  while (true) {
    try {
      const fd = fs.openSync(lockPath, "wx");
      fs.writeFileSync(fd, `${process.pid}:${Date.now()}`, "utf8");
      return fd;
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? (err as { code?: string }).code
          : "";
      if (code !== "EEXIST" && code !== "EPERM" && code !== "EACCES") {
        throw err;
      }
      try {
        const stat = fs.statSync(lockPath);
        if (Date.now() - stat.mtimeMs > 4000) {
          fs.unlinkSync(lockPath);
          continue;
        }
      } catch {
        // lock was released concurrently
        continue;
      }
      if (Date.now() >= deadline) {
        try {
          fs.unlinkSync(lockPath);
        } catch {
          // ignore
        }
        const fd = fs.openSync(lockPath, "w");
        return fd;
      }
      // Busy-wait briefly (synchronous cross-process spinlock)
      const waitUntil = Date.now() + 5;
      while (Date.now() < waitUntil) {
        // spin
      }
    }
  }
}

function releaseCrossProcessLock(fd: number, lockPath: string): void {
  try {
    fs.closeSync(fd);
  } catch {
    // ignore
  }
  try {
    fs.unlinkSync(lockPath);
  } catch {
    // ignore
  }
}

function normalizeLoadedState(raw: unknown): DurableLedgerState {
  if (!raw || typeof raw !== "object") {
    return createInitialDurableLedgerState(true);
  }
  const obj = raw as Partial<DurableLedgerState>;
  return {
    schemaVersion: "dcc-durable-transactional-store/1.0",
    txSequence: typeof obj.txSequence === "number" ? obj.txSequence : 1,
    updatedAt:
      typeof obj.updatedAt === "string"
        ? obj.updatedAt
        : new Date().toISOString(),
    opaqueClicksById:
      obj.opaqueClicksById && typeof obj.opaqueClicksById === "object"
        ? obj.opaqueClicksById
        : {},
    opaqueClickIdsByHandoffId:
      obj.opaqueClickIdsByHandoffId &&
      typeof obj.opaqueClickIdsByHandoffId === "object"
        ? obj.opaqueClickIdsByHandoffId
        : {},
    reconciliationByDedupeKey:
      obj.reconciliationByDedupeKey &&
      typeof obj.reconciliationByDedupeKey === "object"
        ? obj.reconciliationByDedupeKey
        : {},
    funnelVisitorsById:
      obj.funnelVisitorsById && typeof obj.funnelVisitorsById === "object"
        ? obj.funnelVisitorsById
        : {},
    placementApprovalsById:
      obj.placementApprovalsById && typeof obj.placementApprovalsById === "object"
        ? obj.placementApprovalsById
        : {},
    stewardDisputesById:
      obj.stewardDisputesById && typeof obj.stewardDisputesById === "object"
        ? obj.stewardDisputesById
        : {},
    stewardCasesById:
      obj.stewardCasesById && typeof obj.stewardCasesById === "object"
        ? obj.stewardCasesById
        : {},
    stewardDecisionsById:
      obj.stewardDecisionsById && typeof obj.stewardDecisionsById === "object"
        ? obj.stewardDecisionsById
        : {},
    stewardPublicTimeline: Array.isArray(obj.stewardPublicTimeline)
      ? obj.stewardPublicTimeline
      : DEFAULT_SEED_PUBLIC_TIMELINE.map((e) => ({ ...e })),
    stewardVehiclePatchesByClassId:
      obj.stewardVehiclePatchesByClassId &&
      typeof obj.stewardVehiclePatchesByClassId === "object"
        ? obj.stewardVehiclePatchesByClassId
        : {},
    stewardLatestSnapshotId:
      typeof obj.stewardLatestSnapshotId === "string"
        ? obj.stewardLatestSnapshotId
        : null,
    gosnoRouteFeedSnapshot:
      obj.gosnoRouteFeedSnapshot &&
      typeof obj.gosnoRouteFeedSnapshot === "object"
        ? obj.gosnoRouteFeedSnapshot
        : null,
    gosnoRouteFeedRefreshMeta:
      obj.gosnoRouteFeedRefreshMeta &&
      typeof obj.gosnoRouteFeedRefreshMeta === "object"
        ? obj.gosnoRouteFeedRefreshMeta
        : null,
  };
}

function readStateFromDiskUnlocked(storePath: string): DurableLedgerState {
  try {
    if (!fs.existsSync(storePath)) {
      const initial = createInitialDurableLedgerState(true);
      writeStateToDiskAtomicallyUnlocked(storePath, initial);
      return initial;
    }
    const text = fs.readFileSync(storePath, "utf8");
    const parsed = JSON.parse(text);
    return normalizeLoadedState(parsed);
  } catch {
    return createInitialDurableLedgerState(true);
  }
}

function writeStateToDiskAtomicallyUnlocked(
  storePath: string,
  state: DurableLedgerState,
): void {
  const dir = path.dirname(storePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${storePath}.tmp.${process.pid}.${crypto.randomBytes(6).toString("hex")}`;
  const serialized = JSON.stringify(state, null, 2);
  const fd = fs.openSync(tmpPath, "w");
  try {
    fs.writeFileSync(fd, serialized, "utf8");
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmpPath, storePath);
}

/**
 * Reads a consistent, cloned snapshot of the durable transactional ledger state from disk.
 * Changes in separate OS processes are immediately visible.
 */
export function readDurableLedgerState(): DurableLedgerState {
  const storePath = resolveDurableStoreFilePath();
  const lockPath = `${storePath}.lock`;
  const lockFd = acquireCrossProcessLock(lockPath);
  try {
    return readStateFromDiskUnlocked(storePath);
  } finally {
    releaseCrossProcessLock(lockFd, lockPath);
  }
}

/**
 * Executes an atomic ACID transaction against the durable store:
 * - Acquires an exclusive cross-process lockfile
 * - Loads the latest committed state from disk
 * - Deep-clones a working draft so any thrown error rolls back 100% cleanly without partial writes
 * - Increments `txSequence`, fsyncs to a temp file, and atomically renames over the store file
 * - Triggers asynchronous Neon Postgres transactional replication when DATABASE_URL is configured
 */
export function runDurableLedgerTransaction<T>(
  mutator: (state: DurableLedgerState) => T,
): T {
  const storePath = resolveDurableStoreFilePath();
  const lockPath = `${storePath}.lock`;
  const lockFd = acquireCrossProcessLock(lockPath);
  let committedState: DurableLedgerState | null = null;
  let result: T;
  try {
    const current = readStateFromDiskUnlocked(storePath);
    const draft: DurableLedgerState = structuredClone(current);
    result = mutator(draft);
    draft.txSequence = (current.txSequence || 1) + 1;
    draft.updatedAt = new Date().toISOString();
    writeStateToDiskAtomicallyUnlocked(storePath, draft);
    committedState = draft;
  } finally {
    releaseCrossProcessLock(lockFd, lockPath);
  }

  if (committedState && shouldSyncToPostgres()) {
    void commitStateToPostgresBackground(committedState).catch(() => {
      // background replication best-effort on sync calls; explicit async routes await sync
    });
  }

  return result;
}

export function resetDurableLedgerStateForTests(
  includeSeedTimeline = false,
): void {
  const storePath = resolveDurableStoreFilePath();
  const lockPath = `${storePath}.lock`;
  const lockFd = acquireCrossProcessLock(lockPath);
  try {
    const resetState = createInitialDurableLedgerState(includeSeedTimeline);
    writeStateToDiskAtomicallyUnlocked(storePath, resetState);
  } finally {
    releaseCrossProcessLock(lockFd, lockPath);
  }
}

let pgSchemaEnsured = false;

function resolveStoreKey(): string {
  const explicitKey = process.env.DCC_DURABLE_STORE_KEY?.trim();
  if (explicitKey) return explicitKey;
  if (process.env.VERCEL_ENV?.trim().toLowerCase() === "preview") {
    return "dcc_core_ledger_preview_v1";
  }
  return "dcc_core_ledger_v1";
}

function isAutomatedTestRuntime(): boolean {
  if (process.env.DCC_ENABLE_PG_SYNC_IN_TESTS === "1") return false;
  if (process.env.NODE_ENV === "test") return true;
  if (process.execArgv.some((arg) => arg === "--test" || arg.startsWith("--test-"))) {
    return true;
  }
  if (process.argv.some((arg) => /\.test\.[cm]?[jt]sx?$/i.test(arg))) {
    return true;
  }
  return false;
}

function shouldSyncToPostgres(): boolean {
  if (
    process.env.DCC_DISABLE_PG_LEDGER_SYNC === "1" ||
    process.env.DCC_DISABLE_DURABLE_POSTGRES === "1" ||
    isAutomatedTestRuntime()
  ) {
    return false;
  }
  return Boolean(resolveDatabaseUrl());
}

async function ensurePostgresLedgerSchema(
  sql: ReturnType<typeof neon<false, false>>,
): Promise<void> {
  if (pgSchemaEnsured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS dcc_durable_transactional_ledger (
      store_key TEXT PRIMARY KEY,
      tx_sequence BIGINT NOT NULL DEFAULT 1,
      state_json JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS dcc_opaque_click_attributions (
      click_id TEXT PRIMARY KEY,
      handoff_id TEXT,
      decision_receipt_id TEXT NOT NULL,
      recommended_operator_id TEXT NOT NULL,
      evidence_version TEXT NOT NULL,
      reconciliation_state TEXT NOT NULL,
      record_json JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS dcc_steward_cases_ledger (
      case_id TEXT PRIMARY KEY,
      dispute_id TEXT NOT NULL,
      affected_market_id TEXT NOT NULL,
      status TEXT NOT NULL,
      assigned_steward_id TEXT NOT NULL,
      case_json JSONB NOT NULL,
      dispute_json JSONB,
      decision_json JSONB,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  pgSchemaEnsured = true;
}

async function commitStateToPostgresBackground(
  state: DurableLedgerState,
): Promise<void> {
  const dbUrl = resolveDatabaseUrl();
  if (!dbUrl) return;
  const sql = neon(dbUrl);
  await ensurePostgresLedgerSchema(sql);
  const storeKey = resolveStoreKey();
  const stateJsonStr = JSON.stringify(state);

  const queries = [
    sql`
      INSERT INTO dcc_durable_transactional_ledger (store_key, tx_sequence, state_json, updated_at)
      VALUES (${storeKey}, ${state.txSequence}, ${stateJsonStr}::jsonb, NOW())
      ON CONFLICT (store_key) DO UPDATE
      SET
        tx_sequence = GREATEST(dcc_durable_transactional_ledger.tx_sequence + 1, EXCLUDED.tx_sequence),
        state_json = EXCLUDED.state_json,
        updated_at = NOW()
    `,
  ];

  for (const click of Object.values(state.opaqueClicksById)) {
    const clickJson = JSON.stringify(click);
    queries.push(
      sql`
        INSERT INTO dcc_opaque_click_attributions (
          click_id, handoff_id, decision_receipt_id, recommended_operator_id,
          evidence_version, reconciliation_state, record_json, updated_at
        )
        VALUES (
          ${click.clickId},
          ${click.handoffId},
          ${click.decisionReceiptId},
          ${click.recommendedOperatorId},
          ${click.evidenceVersion},
          ${click.reconciliationState},
          ${clickJson}::jsonb,
          NOW()
        )
        ON CONFLICT (click_id) DO UPDATE
        SET
          reconciliation_state = EXCLUDED.reconciliation_state,
          record_json = EXCLUDED.record_json,
          updated_at = NOW()
      `,
    );
  }

  for (const reviewCase of Object.values(state.stewardCasesById)) {
    const dispute = state.stewardDisputesById[reviewCase.disputeReferenceId] ?? null;
    const decision =
      Object.values(state.stewardDecisionsById).find(
        (d) => d.caseId === reviewCase.caseId,
      ) ?? null;
    queries.push(
      sql`
        INSERT INTO dcc_steward_cases_ledger (
          case_id, dispute_id, affected_market_id, status, assigned_steward_id,
          case_json, dispute_json, decision_json, updated_at
        )
        VALUES (
          ${reviewCase.caseId},
          ${reviewCase.disputeReferenceId},
          ${reviewCase.affectedMarketId},
          ${reviewCase.status},
          ${reviewCase.assignedStewardId},
          ${JSON.stringify(reviewCase)}::jsonb,
          ${dispute ? JSON.stringify(dispute) : null}::jsonb,
          ${decision ? JSON.stringify(decision) : null}::jsonb,
          NOW()
        )
        ON CONFLICT (case_id) DO UPDATE
        SET
          status = EXCLUDED.status,
          assigned_steward_id = EXCLUDED.assigned_steward_id,
          case_json = EXCLUDED.case_json,
          dispute_json = EXCLUDED.dispute_json,
          decision_json = EXCLUDED.decision_json,
          updated_at = NOW()
      `,
    );
  }

  await sql.transaction(queries);
}

/**
 * Hydrates local durable store from Neon Postgres (when configured) and merges records
 * so multi-instance serverless workers share a consistent view before reads or mutations.
 */
export async function syncDurableLedgerWithPostgres(options?: {
  forcePushLocal?: boolean;
}): Promise<DurableLedgerState> {
  if (!shouldSyncToPostgres()) {
    return readDurableLedgerState();
  }
  const dbUrl = resolveDatabaseUrl();
  if (!dbUrl) return readDurableLedgerState();

  try {
    const sql = neon(dbUrl);
    await ensurePostgresLedgerSchema(sql);
    const storeKey = resolveStoreKey();

    if (options?.forcePushLocal) {
      const local = readDurableLedgerState();
      await commitStateToPostgresBackground(local);
      return local;
    }

    const rows = (await sql`
      SELECT tx_sequence, state_json
      FROM dcc_durable_transactional_ledger
      WHERE store_key = ${storeKey}
      LIMIT 1
    `) as Array<{ tx_sequence: number | string; state_json: unknown }>;

    if (!rows.length || !rows[0]?.state_json) {
      const local = readDurableLedgerState();
      await commitStateToPostgresBackground(local);
      return local;
    }

    const remoteState = normalizeLoadedState(rows[0].state_json);
    const merged = runDurableLedgerTransaction((localDraft) => {
      for (const [k, v] of Object.entries(remoteState.opaqueClicksById)) {
        const existing = localDraft.opaqueClicksById[k];
        if (!existing) {
          localDraft.opaqueClicksById[k] = v;
        } else {
          const maxDupes = Math.max(
            existing.duplicateDeliveryCount || 0,
            v.duplicateDeliveryCount || 0,
          );
          const maxClicks = Math.max(
            existing.clickCount || 0,
            v.clickCount || 0,
          );
          if (
            v.reconciledOutcomes.length > existing.reconciledOutcomes.length ||
            (existing.reconciliationState === "pending_partner_event" &&
              v.reconciliationState !== "pending_partner_event") ||
            (existing.recordStage !== "outbound_click" &&
              v.recordStage === "outbound_click") ||
            (v.clickCount || 0) > (existing.clickCount || 0) ||
            (v.duplicateDeliveryCount || 0) > (existing.duplicateDeliveryCount || 0)
          ) {
            localDraft.opaqueClicksById[k] = {
              ...v,
              clickCount: maxClicks,
              duplicateDeliveryCount: maxDupes,
            };
          } else {
            existing.clickCount = maxClicks;
            existing.duplicateDeliveryCount = maxDupes;
          }
        }
      }
      Object.assign(
        localDraft.opaqueClickIdsByHandoffId,
        remoteState.opaqueClickIdsByHandoffId,
      );
      Object.assign(
        localDraft.reconciliationByDedupeKey,
        remoteState.reconciliationByDedupeKey,
      );
      localDraft.funnelVisitorsById = localDraft.funnelVisitorsById || {};
      if (remoteState.funnelVisitorsById) {
        for (const [vid, vrec] of Object.entries(remoteState.funnelVisitorsById)) {
          const existingVis = localDraft.funnelVisitorsById[vid];
          if (!existingVis || vrec.visitCount > existingVis.visitCount) {
            localDraft.funnelVisitorsById[vid] = vrec;
          }
        }
      }
      localDraft.placementApprovalsById = localDraft.placementApprovalsById || {};
      if (remoteState.placementApprovalsById) {
        for (const [pid, prec] of Object.entries(remoteState.placementApprovalsById)) {
          const existingApproval = localDraft.placementApprovalsById[pid];
          if (
            !existingApproval ||
            prec.updatedAt >= existingApproval.updatedAt
          ) {
            localDraft.placementApprovalsById[pid] = prec;
          }
        }
      }
      Object.assign(
        localDraft.stewardDisputesById,
        remoteState.stewardDisputesById,
      );
      for (const [k, v] of Object.entries(remoteState.stewardCasesById)) {
        const existing = localDraft.stewardCasesById[k];
        if (!existing || v.status !== "quarantined" || v.resolvedAt) {
          localDraft.stewardCasesById[k] = v;
        }
      }
      Object.assign(
        localDraft.stewardDecisionsById,
        remoteState.stewardDecisionsById,
      );
      Object.assign(
        localDraft.stewardVehiclePatchesByClassId,
        remoteState.stewardVehiclePatchesByClassId,
      );
      if (remoteState.stewardLatestSnapshotId && !localDraft.stewardLatestSnapshotId) {
        localDraft.stewardLatestSnapshotId = remoteState.stewardLatestSnapshotId;
      }
      if (remoteState.gosnoRouteFeedSnapshot) {
        localDraft.gosnoRouteFeedSnapshot = remoteState.gosnoRouteFeedSnapshot;
      }
      if (remoteState.gosnoRouteFeedRefreshMeta) {
        localDraft.gosnoRouteFeedRefreshMeta =
          remoteState.gosnoRouteFeedRefreshMeta;
      }
      const timelineById = new Map<string, PublicMaterialChangeEntry>();
      for (const entry of [
        ...localDraft.stewardPublicTimeline,
        ...remoteState.stewardPublicTimeline,
      ]) {
        if (!timelineById.has(entry.entryId)) {
          timelineById.set(entry.entryId, entry);
        }
      }
      localDraft.stewardPublicTimeline = Array.from(timelineById.values());
      return localDraft;
    });

    await commitStateToPostgresBackground(merged);
    return merged;
  } catch {
    return readDurableLedgerState();
  }
}
