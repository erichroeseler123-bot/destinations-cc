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
  trafficSource?: string | null;
  placementId?: string | null;
  propertySlug?: string | null;
  surface?: string | null;
  planCode?: string | null;
  partnerId?: string | null;
  partnerRole?: "hotel_concierge" | "cruise_planner" | "flight_operator" | null;
  planOpenCount?: number;
  guideVisitCount?: number;
  storefrontVisitCount?: number;
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

const AUTOMATED_VERIFICATION_SCRIPT_CLICK_IDS = new Set([
  "clk_4fdca16a282d2c8f784f69d5",
  "clk_7e6a5576c953158475eac966",
  "clk_40138f7e2d251f013ae21981",
  "clk_f8d18ac5f2c291188073f718",
  "clk_23145740401ed122a99e67af",
  "clk_84b32294ed9614fe626829d3",
]);

function normalizeLoadedState(raw: unknown): DurableLedgerState {
  if (!raw || typeof raw !== "object") {
    return createInitialDurableLedgerState(true);
  }
  const obj = raw as Partial<DurableLedgerState>;
  const rawClicks =
    obj.opaqueClicksById && typeof obj.opaqueClicksById === "object"
      ? obj.opaqueClicksById
      : {};
  for (const [cid, rec] of Object.entries(rawClicks)) {
    if (
      rec &&
      (AUTOMATED_VERIFICATION_SCRIPT_CLICK_IDS.has(cid.toLowerCase()) ||
        cid.toLowerCase().startsWith("clk_qa_"))
    ) {
      rec.isTest = true;
      rec.trafficClass = "test";
    }
  }
  return {
    schemaVersion: "dcc-durable-transactional-store/1.0",
    txSequence: typeof obj.txSequence === "number" ? obj.txSequence : 1,
    updatedAt:
      typeof obj.updatedAt === "string"
        ? obj.updatedAt
        : new Date().toISOString(),
    opaqueClicksById: rawClicks,
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

export interface DurableLedgerSqlClient {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]>;
  transaction?: (queries: Array<Promise<unknown>>) => Promise<unknown[]>;
}

export interface DurableLedgerSyncTelemetry {
  metadataChecks: number;
  fullStateFetches: number;
  fullStateFetchBytes: number;
  ledgerWrites: number;
  ledgerWriteBytes: number;
  secondaryClickUpserts: number;
  secondaryCaseUpserts: number;
  coalescedInFlightReads: number;
  skippedUnchangedReads: number;
  skippedCleanForcePushes: number;
}

interface DurableLedgerPgMeta {
  storeKey: string;
  lastSyncedRemoteTxSequence: number | null;
  lastPushedLocalTxSequence: number;
  dirtyClickIds: string[];
  dirtyCaseIds: string[];
  updatedAt: string;
}

let testLedgerSqlExecutor: DurableLedgerSqlClient | null = null;

const ledgerSyncTelemetry: DurableLedgerSyncTelemetry = {
  metadataChecks: 0,
  fullStateFetches: 0,
  fullStateFetchBytes: 0,
  ledgerWrites: 0,
  ledgerWriteBytes: 0,
  secondaryClickUpserts: 0,
  secondaryCaseUpserts: 0,
  coalescedInFlightReads: 0,
  skippedUnchangedReads: 0,
  skippedCleanForcePushes: 0,
};

const inFlightReadSyncByKey = new Map<string, Promise<DurableLedgerState>>();
const inFlightPushByKey = new Map<string, Promise<DurableLedgerState>>();
const explicitPushDepthByKey = new Map<string, number>();
const pendingBgTimerByKey = new Map<string, ReturnType<typeof setImmediate>>();

export function setDurableLedgerSqlExecutorForTests(
  executor: DurableLedgerSqlClient | null,
): void {
  testLedgerSqlExecutor = executor;
  if (!executor) {
    pgSchemaEnsured = false;
  }
}

export function getDurableLedgerSyncTelemetry(): DurableLedgerSyncTelemetry {
  return { ...ledgerSyncTelemetry };
}

export function resetDurableLedgerSyncTelemetry(): void {
  ledgerSyncTelemetry.metadataChecks = 0;
  ledgerSyncTelemetry.fullStateFetches = 0;
  ledgerSyncTelemetry.fullStateFetchBytes = 0;
  ledgerSyncTelemetry.ledgerWrites = 0;
  ledgerSyncTelemetry.ledgerWriteBytes = 0;
  ledgerSyncTelemetry.secondaryClickUpserts = 0;
  ledgerSyncTelemetry.secondaryCaseUpserts = 0;
  ledgerSyncTelemetry.coalescedInFlightReads = 0;
  ledgerSyncTelemetry.skippedUnchangedReads = 0;
  ledgerSyncTelemetry.skippedCleanForcePushes = 0;
}

function resolvePgMetaFilePath(storePath: string): string {
  return `${storePath}.pgmeta.json`;
}

function readPgMetaUnlocked(
  storePath: string,
  storeKey: string,
  fallbackLocalBaseSequence = 1,
): DurableLedgerPgMeta {
  const metaPath = resolvePgMetaFilePath(storePath);
  try {
    if (!fs.existsSync(metaPath)) {
      return {
        storeKey,
        lastSyncedRemoteTxSequence: null,
        lastPushedLocalTxSequence: fallbackLocalBaseSequence,
        dirtyClickIds: [],
        dirtyCaseIds: [],
        updatedAt: new Date(0).toISOString(),
      };
    }
    const raw = JSON.parse(fs.readFileSync(metaPath, "utf8")) as Partial<DurableLedgerPgMeta>;
    if (!raw || typeof raw !== "object" || raw.storeKey !== storeKey) {
      return {
        storeKey,
        lastSyncedRemoteTxSequence: null,
        lastPushedLocalTxSequence: fallbackLocalBaseSequence,
        dirtyClickIds: [],
        dirtyCaseIds: [],
        updatedAt: new Date(0).toISOString(),
      };
    }
    return {
      storeKey,
      lastSyncedRemoteTxSequence:
        typeof raw.lastSyncedRemoteTxSequence === "number" &&
        Number.isFinite(raw.lastSyncedRemoteTxSequence)
          ? raw.lastSyncedRemoteTxSequence
          : null,
      lastPushedLocalTxSequence:
        typeof raw.lastPushedLocalTxSequence === "number" &&
        Number.isFinite(raw.lastPushedLocalTxSequence)
          ? raw.lastPushedLocalTxSequence
          : fallbackLocalBaseSequence,
      dirtyClickIds: Array.isArray(raw.dirtyClickIds)
        ? Array.from(new Set(raw.dirtyClickIds.filter((id): id is string => typeof id === "string")))
        : [],
      dirtyCaseIds: Array.isArray(raw.dirtyCaseIds)
        ? Array.from(new Set(raw.dirtyCaseIds.filter((id): id is string => typeof id === "string")))
        : [],
      updatedAt:
        typeof raw.updatedAt === "string" ? raw.updatedAt : new Date(0).toISOString(),
    };
  } catch {
    return {
      storeKey,
      lastSyncedRemoteTxSequence: null,
      lastPushedLocalTxSequence: fallbackLocalBaseSequence,
      dirtyClickIds: [],
      dirtyCaseIds: [],
      updatedAt: new Date(0).toISOString(),
    };
  }
}

function writePgMetaUnlocked(storePath: string, meta: DurableLedgerPgMeta): void {
  const metaPath = resolvePgMetaFilePath(storePath);
  const dir = path.dirname(metaPath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${metaPath}.tmp.${process.pid}.${crypto.randomBytes(6).toString("hex")}`;
  const serialized = JSON.stringify(meta, null, 2);
  const fd = fs.openSync(tmpPath, "w");
  try {
    fs.writeFileSync(fd, serialized, "utf8");
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmpPath, metaPath);
}

function collectChangedClickIds(
  before: DurableLedgerState,
  after: DurableLedgerState,
): string[] {
  const changed: string[] = [];
  for (const [clickId, afterRec] of Object.entries(after.opaqueClicksById)) {
    const beforeRec = before.opaqueClicksById[clickId];
    if (!beforeRec) {
      changed.push(clickId);
      continue;
    }
    if (
      beforeRec.clickCount !== afterRec.clickCount ||
      beforeRec.followedAt !== afterRec.followedAt ||
      beforeRec.recordStage !== afterRec.recordStage ||
      beforeRec.reconciliationState !== afterRec.reconciliationState ||
      (beforeRec.reconciledOutcomes?.length || 0) !==
        (afterRec.reconciledOutcomes?.length || 0) ||
      beforeRec.duplicateDeliveryCount !== afterRec.duplicateDeliveryCount ||
      beforeRec.isTest !== afterRec.isTest ||
      beforeRec.placementId !== afterRec.placementId ||
      beforeRec.visitorId !== afterRec.visitorId ||
      beforeRec.outboundPartnerUrl !== afterRec.outboundPartnerUrl
    ) {
      changed.push(clickId);
    }
  }
  return changed;
}

function collectChangedCaseIds(
  before: DurableLedgerState,
  after: DurableLedgerState,
): string[] {
  const changed = new Set<string>();
  for (const [caseId, afterCase] of Object.entries(after.stewardCasesById)) {
    const beforeCase = before.stewardCasesById[caseId];
    if (!beforeCase || JSON.stringify(beforeCase) !== JSON.stringify(afterCase)) {
      changed.add(caseId);
    }
  }
  for (const [decId, afterDec] of Object.entries(after.stewardDecisionsById)) {
    const beforeDec = before.stewardDecisionsById[decId];
    if (!beforeDec || JSON.stringify(beforeDec) !== JSON.stringify(afterDec)) {
      if (afterDec.caseId && after.stewardCasesById[afterDec.caseId]) {
        changed.add(afterDec.caseId);
      }
    }
  }
  for (const [dispId, afterDisp] of Object.entries(after.stewardDisputesById)) {
    const beforeDisp = before.stewardDisputesById[dispId];
    if (!beforeDisp || JSON.stringify(beforeDisp) !== JSON.stringify(afterDisp)) {
      for (const reviewCase of Object.values(after.stewardCasesById)) {
        if (reviewCase.disputeReferenceId === dispId) {
          changed.add(reviewCase.caseId);
        }
      }
    }
  }
  return Array.from(changed);
}

/**
 * Executes an atomic ACID transaction against the durable store:
 * - Acquires an exclusive cross-process lockfile
 * - Loads the latest committed state from disk
 * - Deep-clones a working draft so any thrown error rolls back 100% cleanly without partial writes
 * - Increments `txSequence`, fsyncs to a temp file, and atomically renames over the store file
 * - Schedules coalesced Neon Postgres transactional replication when DATABASE_URL is configured
 */
export function runDurableLedgerTransaction<T>(
  mutator: (state: DurableLedgerState) => T,
): T {
  const storePath = resolveDurableStoreFilePath();
  const storeKey = resolveStoreKey();
  const lockPath = `${storePath}.lock`;
  const lockFd = acquireCrossProcessLock(lockPath);
  let committedState: DurableLedgerState | null = null;
  let result: T;
  try {
    const current = readStateFromDiskUnlocked(storePath);
    const draft: DurableLedgerState = structuredClone(current);
    result = mutator(draft);
    const changedClicks = collectChangedClickIds(current, draft);
    const changedCases = collectChangedCaseIds(current, draft);
    draft.txSequence = (current.txSequence || 1) + 1;
    draft.updatedAt = new Date().toISOString();
    writeStateToDiskAtomicallyUnlocked(storePath, draft);

    const pgMeta = readPgMetaUnlocked(storePath, storeKey, current.txSequence || 1);
    pgMeta.dirtyClickIds = Array.from(
      new Set([...pgMeta.dirtyClickIds, ...changedClicks]),
    );
    pgMeta.dirtyCaseIds = Array.from(
      new Set([...pgMeta.dirtyCaseIds, ...changedCases]),
    );
    pgMeta.updatedAt = draft.updatedAt;
    writePgMetaUnlocked(storePath, pgMeta);

    committedState = draft;
  } finally {
    releaseCrossProcessLock(lockFd, lockPath);
  }

  if (committedState && shouldSyncToPostgres()) {
    if (isLegacyFullLedgerSyncEnabled()) {
      void commitStateToPostgresLegacy(committedState).catch(() => {
        // background replication best-effort on legacy mode
      });
    } else {
      scheduleCoalescedBackgroundPush(storePath, storeKey);
    }
  }

  return result;
}

export function resetDurableLedgerStateForTests(
  includeSeedTimeline = false,
): void {
  const storePath = resolveDurableStoreFilePath();
  const storeKey = resolveStoreKey();
  const syncKey = `${storePath}::${storeKey}`;
  const pendingTimer = pendingBgTimerByKey.get(syncKey);
  if (pendingTimer) {
    clearImmediate(pendingTimer);
    pendingBgTimerByKey.delete(syncKey);
  }
  const lockPath = `${storePath}.lock`;
  const lockFd = acquireCrossProcessLock(lockPath);
  try {
    const resetState = createInitialDurableLedgerState(includeSeedTimeline);
    writeStateToDiskAtomicallyUnlocked(storePath, resetState);
    const metaPath = resolvePgMetaFilePath(storePath);
    if (fs.existsSync(metaPath)) {
      try {
        fs.unlinkSync(metaPath);
      } catch {
        // ignore
      }
    }
  } finally {
    releaseCrossProcessLock(lockFd, lockPath);
  }
}

let pgSchemaEnsured = false;

function isLegacyFullLedgerSyncEnabled(): boolean {
  return process.env.DCC_LEGACY_FULL_LEDGER_SYNC === "1";
}

function resolveStoreKey(): string {
  const explicitKey = process.env.DCC_DURABLE_STORE_KEY?.trim();
  if (explicitKey) return explicitKey;
  if (process.env.VERCEL_ENV?.trim().toLowerCase() === "preview") {
    return "dcc_core_ledger_preview_v1";
  }
  return "dcc_core_ledger_v1";
}

function isAutomatedTestRuntime(): boolean {
  if (testLedgerSqlExecutor) return false;
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
  if (testLedgerSqlExecutor) return true;
  return Boolean(resolveDatabaseUrl());
}

function resolveLedgerSqlClient(): DurableLedgerSqlClient | null {
  if (testLedgerSqlExecutor) return testLedgerSqlExecutor;
  const dbUrl = resolveDatabaseUrl();
  if (!dbUrl) return null;
  return neon(dbUrl) as unknown as DurableLedgerSqlClient;
}

async function ensurePostgresLedgerSchema(
  sql: DurableLedgerSqlClient,
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

async function executeSecondaryIndexQueries(
  sql: DurableLedgerSqlClient,
  queries: Array<Promise<unknown>>,
): Promise<void> {
  if (queries.length === 0) return;
  if (typeof sql.transaction === "function") {
    await sql.transaction(queries);
  } else {
    for (const q of queries) {
      await q;
    }
  }
}

async function upsertDirtySecondaryLedgerTables(
  sql: DurableLedgerSqlClient,
  state: DurableLedgerState,
  dirtyClickIds: readonly string[],
  dirtyCaseIds: readonly string[],
): Promise<void> {
  if (dirtyClickIds.length === 0 && dirtyCaseIds.length === 0) return;
  try {
    const queries: Array<Promise<unknown>> = [];
    for (const clickId of dirtyClickIds) {
      const click = state.opaqueClicksById[clickId];
      if (!click) continue;
      const clickJson = JSON.stringify(click);
      ledgerSyncTelemetry.secondaryClickUpserts += 1;
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

    for (const caseId of dirtyCaseIds) {
      const reviewCase = state.stewardCasesById[caseId];
      if (!reviewCase) continue;
      const dispute = state.stewardDisputesById[reviewCase.disputeReferenceId] ?? null;
      const decision =
        Object.values(state.stewardDecisionsById).find(
          (d) => d.caseId === reviewCase.caseId,
        ) ?? null;
      ledgerSyncTelemetry.secondaryCaseUpserts += 1;
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

    await executeSecondaryIndexQueries(sql, queries);
  } catch {
    // Secondary index tables are non-blocking; singleton state_json is authoritative
  }
}

async function commitStateToPostgresLegacy(
  state: DurableLedgerState,
): Promise<void> {
  const sql = resolveLedgerSqlClient();
  if (!sql) return;
  await ensurePostgresLedgerSchema(sql);
  const storeKey = resolveStoreKey();
  const stateJsonStr = JSON.stringify(state);

  ledgerSyncTelemetry.ledgerWrites += 1;
  ledgerSyncTelemetry.ledgerWriteBytes += Buffer.byteLength(stateJsonStr, "utf8");

  await sql`
    INSERT INTO dcc_durable_transactional_ledger (store_key, tx_sequence, state_json, updated_at)
    VALUES (${storeKey}, ${state.txSequence}, ${stateJsonStr}::jsonb, NOW())
    ON CONFLICT (store_key) DO UPDATE
    SET
      tx_sequence = GREATEST(dcc_durable_transactional_ledger.tx_sequence + 1, EXCLUDED.tx_sequence),
      state_json = EXCLUDED.state_json,
      updated_at = NOW()
  `;

  const recentClickIds = Object.values(state.opaqueClicksById)
    .sort((a, b) => {
      const aScore = (a.reconciledOutcomes?.length || 0) * 10 + (a.clickCount || 0);
      const bScore = (b.reconciledOutcomes?.length || 0) * 10 + (b.clickCount || 0);
      if (bScore !== aScore) return bScore - aScore;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 20)
    .map((c) => c.clickId);

  await upsertDirtySecondaryLedgerTables(
    sql,
    state,
    recentClickIds,
    Object.keys(state.stewardCasesById),
  );
}

function mergeRemoteIntoLocalDraft(
  localDraft: DurableLedgerState,
  remoteState: DurableLedgerState,
  options: {
    forcePushLocal: boolean;
    dirtyCaseIds?: ReadonlySet<string>;
  },
): void {
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
      const resolvedPlacement = existing.placementId || v.placementId || null;
      const resolvedProperty = existing.propertySlug || v.propertySlug || null;
      const resolvedIsTest = Boolean(
        existing.isTest ||
          v.isTest ||
          existing.trafficClass === "test" ||
          v.trafficClass === "test" ||
          AUTOMATED_VERIFICATION_SCRIPT_CLICK_IDS.has(k.toLowerCase()) ||
          k.toLowerCase().startsWith("clk_qa_"),
      );
      const resolvedTrafficClass = resolvedIsTest ? "test" : "production";
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
          placementId: resolvedPlacement,
          propertySlug: resolvedProperty,
          clickCount: maxClicks,
          duplicateDeliveryCount: maxDupes,
          isTest: resolvedIsTest,
          trafficClass: resolvedTrafficClass,
        };
      } else {
        existing.placementId = resolvedPlacement;
        existing.propertySlug = resolvedProperty;
        existing.clickCount = maxClicks;
        existing.duplicateDeliveryCount = maxDupes;
        existing.isTest = resolvedIsTest;
        existing.trafficClass = resolvedTrafficClass;
      }
    }
  }
  localDraft.opaqueClickIdsByHandoffId = {
    ...remoteState.opaqueClickIdsByHandoffId,
    ...localDraft.opaqueClickIdsByHandoffId,
  };
  localDraft.reconciliationByDedupeKey = {
    ...remoteState.reconciliationByDedupeKey,
    ...localDraft.reconciliationByDedupeKey,
  };
  localDraft.funnelVisitorsById = localDraft.funnelVisitorsById || {};
  if (remoteState.funnelVisitorsById) {
    for (const [vid, vrec] of Object.entries(remoteState.funnelVisitorsById)) {
      const existingVis = localDraft.funnelVisitorsById[vid];
      if (!existingVis) {
        localDraft.funnelVisitorsById[vid] = vrec;
      } else {
        const hasGuideCount =
          typeof existingVis.guideVisitCount === "number" ||
          typeof vrec.guideVisitCount === "number";
        const hasStorefrontCount =
          typeof existingVis.storefrontVisitCount === "number" ||
          typeof vrec.storefrontVisitCount === "number";
        const mergedGuideVisits = hasGuideCount
          ? Math.max(existingVis.guideVisitCount || 0, vrec.guideVisitCount || 0)
          : undefined;
        const mergedStorefrontVisits = hasStorefrontCount
          ? Math.max(
              existingVis.storefrontVisitCount || 0,
              vrec.storefrontVisitCount || 0,
            )
          : undefined;
        if (!options.forcePushLocal && vrec.visitCount >= existingVis.visitCount) {
          localDraft.funnelVisitorsById[vid] = {
            ...vrec,
            ...(mergedGuideVisits !== undefined ? { guideVisitCount: mergedGuideVisits } : {}),
            ...(mergedStorefrontVisits !== undefined
              ? { storefrontVisitCount: mergedStorefrontVisits }
              : {}),
          };
        } else {
          existingVis.visitCount = Math.max(
            existingVis.visitCount || 0,
            vrec.visitCount || 0,
          );
          existingVis.planOpenCount = Math.max(
            existingVis.planOpenCount || 0,
            vrec.planOpenCount || 0,
          );
          if (mergedGuideVisits !== undefined) {
            existingVis.guideVisitCount = mergedGuideVisits;
          }
          if (mergedStorefrontVisits !== undefined) {
            existingVis.storefrontVisitCount = mergedStorefrontVisits;
          }
        }
      }
    }
  }
  localDraft.placementApprovalsById = localDraft.placementApprovalsById || {};
  if (remoteState.placementApprovalsById) {
    for (const [pid, prec] of Object.entries(remoteState.placementApprovalsById)) {
      const existingApproval = localDraft.placementApprovalsById[pid];
      if (
        !existingApproval ||
        (!options.forcePushLocal && prec.updatedAt >= existingApproval.updatedAt)
      ) {
        localDraft.placementApprovalsById[pid] = prec;
      }
    }
  }
  localDraft.stewardDisputesById = {
    ...remoteState.stewardDisputesById,
    ...localDraft.stewardDisputesById,
  };
  for (const [k, v] of Object.entries(remoteState.stewardCasesById)) {
    const existing = localDraft.stewardCasesById[k];
    const locallyDirtied = Boolean(options.forcePushLocal && options.dirtyCaseIds?.has(k));
    if (!existing) {
      localDraft.stewardCasesById[k] = v;
    } else if (!locallyDirtied && (v.status !== "quarantined" || v.resolvedAt)) {
      localDraft.stewardCasesById[k] = v;
    }
  }
  localDraft.stewardDecisionsById = {
    ...remoteState.stewardDecisionsById,
    ...localDraft.stewardDecisionsById,
  };
  localDraft.stewardVehiclePatchesByClassId = {
    ...remoteState.stewardVehiclePatchesByClassId,
    ...localDraft.stewardVehiclePatchesByClassId,
  };
  if (remoteState.stewardLatestSnapshotId && !localDraft.stewardLatestSnapshotId) {
    localDraft.stewardLatestSnapshotId = remoteState.stewardLatestSnapshotId;
  }
  if (remoteState.gosnoRouteFeedSnapshot) {
    const existingSnap = localDraft.gosnoRouteFeedSnapshot;
    if (
      !existingSnap ||
      (!options.forcePushLocal &&
        (Date.parse(remoteState.gosnoRouteFeedSnapshot.fetchedAt || "") || 0) >=
          (Date.parse(existingSnap.fetchedAt || "") || 0))
    ) {
      localDraft.gosnoRouteFeedSnapshot = remoteState.gosnoRouteFeedSnapshot;
    }
  }
  if (remoteState.gosnoRouteFeedRefreshMeta) {
    const existingMeta = localDraft.gosnoRouteFeedRefreshMeta;
    if (
      !existingMeta ||
      (!options.forcePushLocal &&
        (Date.parse(
          remoteState.gosnoRouteFeedRefreshMeta.lastRefreshAttemptAt || "",
        ) || 0) >=
          (Date.parse(existingMeta.lastRefreshAttemptAt || "") || 0))
    ) {
      localDraft.gosnoRouteFeedRefreshMeta =
        remoteState.gosnoRouteFeedRefreshMeta;
    }
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
}

async function queryRemoteLedgerMetadata(
  sql: DurableLedgerSqlClient,
  storeKey: string,
): Promise<number | null> {
  ledgerSyncTelemetry.metadataChecks += 1;
  const rows = (await sql`
    SELECT tx_sequence
    FROM dcc_durable_transactional_ledger
    WHERE store_key = ${storeKey}
    LIMIT 1
  `) as Array<{ tx_sequence: number | string }>;
  if (!rows.length || rows[0]?.tx_sequence === undefined || rows[0]?.tx_sequence === null) {
    return null;
  }
  const parsed = Number(rows[0].tx_sequence);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchRemoteFullState(
  sql: DurableLedgerSqlClient,
  storeKey: string,
): Promise<{ remoteTxSequence: number; remoteState: DurableLedgerState } | null> {
  ledgerSyncTelemetry.fullStateFetches += 1;
  const rows = (await sql`
    SELECT tx_sequence, state_json
    FROM dcc_durable_transactional_ledger
    WHERE store_key = ${storeKey}
    LIMIT 1
  `) as Array<{ tx_sequence: number | string; state_json: unknown }>;
  if (!rows.length || !rows[0]?.state_json) {
    return null;
  }
  const rawPayload =
    typeof rows[0].state_json === "string"
      ? JSON.parse(rows[0].state_json)
      : rows[0].state_json;
  ledgerSyncTelemetry.fullStateFetchBytes += Buffer.byteLength(
    typeof rows[0].state_json === "string"
      ? rows[0].state_json
      : JSON.stringify(rows[0].state_json),
    "utf8",
  );
  const remoteTxSequence = Number(rows[0].tx_sequence) || 1;
  return {
    remoteTxSequence,
    remoteState: normalizeLoadedState(rawPayload),
  };
}

function hydrateLocalDiskFromRemoteReadOnly(
  storePath: string,
  storeKey: string,
  remoteTxSequence: number,
  remoteState: DurableLedgerState,
): DurableLedgerState {
  const lockPath = `${storePath}.lock`;
  const lockFd = acquireCrossProcessLock(lockPath);
  try {
    const localCurrent = readStateFromDiskUnlocked(storePath);
    const pgMeta = readPgMetaUnlocked(storePath, storeKey, 1);
    const hasUnpushedLocal =
      localCurrent.txSequence > pgMeta.lastPushedLocalTxSequence ||
      pgMeta.dirtyClickIds.length > 0 ||
      pgMeta.dirtyCaseIds.length > 0;

    const draft = structuredClone(localCurrent);
    mergeRemoteIntoLocalDraft(draft, structuredClone(remoteState), {
      forcePushLocal: false,
    });

    if (hasUnpushedLocal) {
      draft.txSequence = Math.max(localCurrent.txSequence, remoteTxSequence) + 1;
      draft.updatedAt = new Date().toISOString();
      writeStateToDiskAtomicallyUnlocked(storePath, draft);
      pgMeta.lastSyncedRemoteTxSequence = remoteTxSequence;
      pgMeta.updatedAt = draft.updatedAt;
      writePgMetaUnlocked(storePath, pgMeta);
    } else {
      draft.txSequence = Math.max(localCurrent.txSequence, remoteTxSequence);
      draft.updatedAt = remoteState.updatedAt || localCurrent.updatedAt;
      writeStateToDiskAtomicallyUnlocked(storePath, draft);
      writePgMetaUnlocked(storePath, {
        storeKey,
        lastSyncedRemoteTxSequence: remoteTxSequence,
        lastPushedLocalTxSequence: draft.txSequence,
        dirtyClickIds: [],
        dirtyCaseIds: [],
        updatedAt: new Date().toISOString(),
      });
    }
    return draft;
  } finally {
    releaseCrossProcessLock(lockFd, lockPath);
  }
}

async function runReadOnlyMetadataGatedSync(
  storePath: string,
  storeKey: string,
): Promise<DurableLedgerState> {
  const sql = resolveLedgerSqlClient();
  if (!sql) return readDurableLedgerState();

  let remoteTxSeq: number | null;
  try {
    remoteTxSeq = await queryRemoteLedgerMetadata(sql, storeKey);
  } catch {
    return readDurableLedgerState();
  }

  if (remoteTxSeq === null) {
    // Empty remote ledger: read-only requests NEVER write to Postgres.
    return readDurableLedgerState();
  }

  // Fast path check: if local disk file exists and already absorbed this exact remote tx_sequence,
  // skip fetching the 107 MB state_json document completely.
  let localSnap: DurableLedgerState | null = null;
  let localMeta: DurableLedgerPgMeta | null = null;
  if (fs.existsSync(storePath)) {
    const lockPath = `${storePath}.lock`;
    const lockFd = acquireCrossProcessLock(lockPath);
    try {
      localMeta = readPgMetaUnlocked(storePath, storeKey, 1);
      if (localMeta.lastSyncedRemoteTxSequence === remoteTxSeq) {
        localSnap = readStateFromDiskUnlocked(storePath);
      }
    } finally {
      releaseCrossProcessLock(lockFd, lockPath);
    }
  }

  if (localSnap) {
    ledgerSyncTelemetry.skippedUnchangedReads += 1;
    return localSnap;
  }

  const fetched = await fetchRemoteFullState(sql, storeKey);
  if (!fetched) {
    return readDurableLedgerState();
  }
  return hydrateLocalDiskFromRemoteReadOnly(
    storePath,
    storeKey,
    fetched.remoteTxSequence,
    fetched.remoteState,
  );
}

function scheduleCoalescedBackgroundPush(storePath: string, storeKey: string): void {
  const syncKey = `${storePath}::${storeKey}`;
  if (pendingBgTimerByKey.has(syncKey)) return;

  const timer = setImmediate(() => {
    pendingBgTimerByKey.delete(syncKey);
    if ((explicitPushDepthByKey.get(syncKey) || 0) > 0) {
      return;
    }
    void pushDirtyLocalLedgerToPostgres(storePath, storeKey).catch(() => {
      // background replication best-effort on sync calls; explicit async routes await sync
    });
  });
  if (typeof (timer as unknown as { unref?: () => void })?.unref === "function") {
    (timer as unknown as { unref: () => void }).unref();
  }
  pendingBgTimerByKey.set(syncKey, timer);
}

async function pushDirtyLocalLedgerToPostgres(
  storePath: string,
  storeKey: string,
): Promise<DurableLedgerState> {
  const syncKey = `${storePath}::${storeKey}`;
  const existingPush = inFlightPushByKey.get(syncKey);
  if (existingPush) {
    await existingPush.catch(() => undefined);
  }

  const task = (async (): Promise<DurableLedgerState> => {
    const sql = resolveLedgerSqlClient();
    if (!sql) return readDurableLedgerState();

    let localBefore!: DurableLedgerState;
    let metaBefore!: DurableLedgerPgMeta;
    {
      const lockPath = `${storePath}.lock`;
      const lockFd = acquireCrossProcessLock(lockPath);
      try {
        localBefore = readStateFromDiskUnlocked(storePath);
        metaBefore = readPgMetaUnlocked(storePath, storeKey, 1);
      } finally {
        releaseCrossProcessLock(lockFd, lockPath);
      }
    }

    const hasDirtyLocal =
      localBefore.txSequence > metaBefore.lastPushedLocalTxSequence ||
      metaBefore.dirtyClickIds.length > 0 ||
      metaBefore.dirtyCaseIds.length > 0;

    if (!hasDirtyLocal) {
      // Nothing mutated locally since last push; verify remote metadata without writing.
      let remoteTxSeq: number | null = null;
      try {
        remoteTxSeq = await queryRemoteLedgerMetadata(sql, storeKey);
      } catch {
        return localBefore;
      }
      if (remoteTxSeq === null) {
        ledgerSyncTelemetry.skippedCleanForcePushes += 1;
        return localBefore;
      }
      if (remoteTxSeq === metaBefore.lastSyncedRemoteTxSequence) {
        ledgerSyncTelemetry.skippedCleanForcePushes += 1;
        return localBefore;
      }
      const fetched = await fetchRemoteFullState(sql, storeKey);
      if (!fetched) return localBefore;
      return hydrateLocalDiskFromRemoteReadOnly(
        storePath,
        storeKey,
        fetched.remoteTxSequence,
        fetched.remoteState,
      );
    }

    await ensurePostgresLedgerSchema(sql);
    const remoteTxSeq = await queryRemoteLedgerMetadata(sql, storeKey);

    let stateToPush = localBefore;
    let dirtyClicksToPush = [...metaBefore.dirtyClickIds];
    let dirtyCasesToPush = [...metaBefore.dirtyCaseIds];

    if (
      remoteTxSeq !== null &&
      remoteTxSeq !== metaBefore.lastSyncedRemoteTxSequence
    ) {
      // Remote Postgres advanced concurrently (or cold worker mutated before hydrating):
      // pull once and merge deterministically so zero history or concurrent writes are ever lost.
      const fetched = await fetchRemoteFullState(sql, storeKey);
      if (fetched) {
        const lockPath = `${storePath}.lock`;
        const lockFd = acquireCrossProcessLock(lockPath);
        try {
          const latestLocal = readStateFromDiskUnlocked(storePath);
          const latestMeta = readPgMetaUnlocked(storePath, storeKey, 1);
          const mergedDraft = structuredClone(latestLocal);
          mergeRemoteIntoLocalDraft(mergedDraft, structuredClone(fetched.remoteState), {
            forcePushLocal: true,
            dirtyCaseIds: new Set(latestMeta.dirtyCaseIds),
          });
          mergedDraft.txSequence =
            Math.max(latestLocal.txSequence, fetched.remoteTxSequence) + 1;
          mergedDraft.updatedAt = new Date().toISOString();
          writeStateToDiskAtomicallyUnlocked(storePath, mergedDraft);
          latestMeta.lastSyncedRemoteTxSequence = fetched.remoteTxSequence;
          latestMeta.updatedAt = mergedDraft.updatedAt;
          writePgMetaUnlocked(storePath, latestMeta);

          stateToPush = mergedDraft;
          dirtyClicksToPush = [...latestMeta.dirtyClickIds];
          dirtyCasesToPush = [...latestMeta.dirtyCaseIds];
        } finally {
          releaseCrossProcessLock(lockFd, lockPath);
        }
      }
    } else {
      // Re-read latest local state under lock in case another sync tx committed just before push
      const lockPath = `${storePath}.lock`;
      const lockFd = acquireCrossProcessLock(lockPath);
      try {
        const latestLocal = readStateFromDiskUnlocked(storePath);
        const latestMeta = readPgMetaUnlocked(storePath, storeKey, 1);
        stateToPush = latestLocal;
        dirtyClicksToPush = [...latestMeta.dirtyClickIds];
        dirtyCasesToPush = [...latestMeta.dirtyCaseIds];
      } finally {
        releaseCrossProcessLock(lockFd, lockPath);
      }
    }

    const pushedLocalTxSeq = stateToPush.txSequence;
    const stateJsonStr = JSON.stringify(stateToPush);
    ledgerSyncTelemetry.ledgerWrites += 1;
    ledgerSyncTelemetry.ledgerWriteBytes += Buffer.byteLength(stateJsonStr, "utf8");

    const upsertRows = (await sql`
      INSERT INTO dcc_durable_transactional_ledger (store_key, tx_sequence, state_json, updated_at)
      VALUES (${storeKey}, ${stateToPush.txSequence}, ${stateJsonStr}::jsonb, NOW())
      ON CONFLICT (store_key) DO UPDATE
      SET
        tx_sequence = GREATEST(dcc_durable_transactional_ledger.tx_sequence + 1, EXCLUDED.tx_sequence),
        state_json = EXCLUDED.state_json,
        updated_at = NOW()
      RETURNING tx_sequence
    `) as Array<{ tx_sequence?: number | string }>;

    const committedRemoteTxSeq =
      upsertRows.length > 0 && upsertRows[0]?.tx_sequence !== undefined
        ? Number(upsertRows[0].tx_sequence) || stateToPush.txSequence
        : Math.max((remoteTxSeq ?? 0) + 1, stateToPush.txSequence);

    await upsertDirtySecondaryLedgerTables(
      sql,
      stateToPush,
      dirtyClicksToPush,
      dirtyCasesToPush,
    );

    let finalState!: DurableLedgerState;
    {
      const pushedClickSet = new Set(dirtyClicksToPush);
      const pushedCaseSet = new Set(dirtyCasesToPush);
      const lockPath = `${storePath}.lock`;
      const lockFd = acquireCrossProcessLock(lockPath);
      try {
        const latestLocal = readStateFromDiskUnlocked(storePath);
        const latestMeta = readPgMetaUnlocked(storePath, storeKey, 1);
        if (latestLocal.txSequence === pushedLocalTxSeq) {
          if (committedRemoteTxSeq > latestLocal.txSequence) {
            latestLocal.txSequence = committedRemoteTxSeq;
            writeStateToDiskAtomicallyUnlocked(storePath, latestLocal);
          }
          writePgMetaUnlocked(storePath, {
            storeKey,
            lastSyncedRemoteTxSequence: committedRemoteTxSeq,
            lastPushedLocalTxSequence: latestLocal.txSequence,
            dirtyClickIds: latestMeta.dirtyClickIds.filter(
              (id) => !pushedClickSet.has(id),
            ),
            dirtyCaseIds: latestMeta.dirtyCaseIds.filter(
              (id) => !pushedCaseSet.has(id),
            ),
            updatedAt: new Date().toISOString(),
          });
        } else {
          latestMeta.lastSyncedRemoteTxSequence = committedRemoteTxSeq;
          latestMeta.lastPushedLocalTxSequence = pushedLocalTxSeq;
          latestMeta.updatedAt = new Date().toISOString();
          writePgMetaUnlocked(storePath, latestMeta);
        }
        finalState = latestLocal;
      } finally {
        releaseCrossProcessLock(lockFd, lockPath);
      }
    }

    return finalState;
  })();

  inFlightPushByKey.set(syncKey, task);
  try {
    return await task;
  } finally {
    if (inFlightPushByKey.get(syncKey) === task) {
      inFlightPushByKey.delete(syncKey);
    }
  }
}

async function syncDurableLedgerWithPostgresLegacy(options?: {
  forcePushLocal?: boolean;
}): Promise<DurableLedgerState> {
  const sql = resolveLedgerSqlClient();
  if (!sql) return readDurableLedgerState();
  await ensurePostgresLedgerSchema(sql);
  const storeKey = resolveStoreKey();
  const fetched = await fetchRemoteFullState(sql, storeKey);
  if (!fetched) {
    const local = readDurableLedgerState();
    await commitStateToPostgresLegacy(local);
    return local;
  }
  const merged = runDurableLedgerTransaction((localDraft) => {
    mergeRemoteIntoLocalDraft(localDraft, fetched.remoteState, {
      forcePushLocal: Boolean(options?.forcePushLocal),
    });
    return localDraft;
  });
  await commitStateToPostgresLegacy(merged);
  return merged;
}

/**
 * Hydrates local durable store from Neon Postgres (when configured) using a lightweight
 * `tx_sequence` metadata check so unchanged 107 MB `state_json` documents are never re-transferred,
 * and read-only SSR/API calls never rewrite the ledger.
 */
export async function syncDurableLedgerWithPostgres(options?: {
  forcePushLocal?: boolean;
}): Promise<DurableLedgerState> {
  if (!shouldSyncToPostgres()) {
    return readDurableLedgerState();
  }

  try {
    if (isLegacyFullLedgerSyncEnabled()) {
      return await syncDurableLedgerWithPostgresLegacy(options);
    }

    const storePath = resolveDurableStoreFilePath();
    const storeKey = resolveStoreKey();
    const syncKey = `${storePath}::${storeKey}`;

    if (options?.forcePushLocal) {
      const pendingTimer = pendingBgTimerByKey.get(syncKey);
      if (pendingTimer) {
        clearImmediate(pendingTimer);
        pendingBgTimerByKey.delete(syncKey);
      }
      explicitPushDepthByKey.set(
        syncKey,
        (explicitPushDepthByKey.get(syncKey) || 0) + 1,
      );
      try {
        return await pushDirtyLocalLedgerToPostgres(storePath, storeKey);
      } finally {
        const nextDepth = (explicitPushDepthByKey.get(syncKey) || 1) - 1;
        if (nextDepth <= 0) {
          explicitPushDepthByKey.delete(syncKey);
        } else {
          explicitPushDepthByKey.set(syncKey, nextDepth);
        }
      }
    }

    const existingRead = inFlightReadSyncByKey.get(syncKey);
    if (existingRead) {
      ledgerSyncTelemetry.coalescedInFlightReads += 1;
      return await existingRead;
    }

    const readPromise = runReadOnlyMetadataGatedSync(storePath, storeKey);
    inFlightReadSyncByKey.set(syncKey, readPromise);
    try {
      return await readPromise;
    } finally {
      if (inFlightReadSyncByKey.get(syncKey) === readPromise) {
        inFlightReadSyncByKey.delete(syncKey);
      }
    }
  } catch {
    return readDurableLedgerState();
  }
}

export {
  isServerlessRuntimeEnvironment,
  persistDurableTransactionalSubmission,
  readDurableTransactionalSubmission,
  resolveRuntimeEnvironmentTag,
  type DurableTransactionalSubmissionInput,
  type DurableTransactionalSubmissionResult,
  type TransactionalSubmissionChannel,
} from "./transactionalSubmissions";
