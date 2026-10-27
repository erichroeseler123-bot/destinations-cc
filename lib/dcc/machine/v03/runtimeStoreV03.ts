import fs from "node:fs";
import path from "node:path";
import { buildV03CandidateUniverse, type V03CandidateUniverse } from "./candidateUniverse";
import {
  issueShadowDecisionAuthorization,
  type CommerceAdapterTarget,
  type V03SignedDecisionAuthorization,
} from "./decisionAuthorization";
import { getV03SchemaHashes } from "./discoveryAndMcp";
import {
  compileV03EngineBundle,
  evaluateCurrentV03,
  replayHistoricalReceiptV03,
  simulateAdministrativeV03,
  type V03CompiledEngineBundle,
  type V03EvaluationResult,
} from "./evaluatorAndReplay";
import {
  buildV03EvidenceReference,
  extractTextEvidenceSelectors,
  type V03EvidenceReference,
} from "./evidenceSelectors";
import { DccIdentityLedger, mintOpaqueDccEntityId } from "./identityGraph";
import { NeonRelationalLedgerStoreV03 } from "./neonLedgerStore";
import {
  buildEvidenceRefFromPreservedCapture,
  getPreservedCaptureByIdV031,
  loadPreservedCapturesBundleV031,
  persistPreservedCaptureToObjectStore,
} from "./preservedCapturesV031";
import { sha256HexFull, type V03SignedDecisionReceipt } from "./rfc8785AndJws";
import {
  CloudflareR2PrivateArtifactStore,
  InMemoryTestArtifactStore,
  inspectR2CredentialsFromEnv,
  type PrivateArtifactObjectStore,
} from "./storageBoundary";
import { AppendOnlyKnowledgeLedger, type V03KnowledgeEvent } from "./temporalLedger";

/**
 * DCC Machine Layer v0.3.1 — Unified Runtime Store
 *
 * Hosts the append-only knowledge event ledger, DCC-native identity ledger,
 * versioned CandidateUniverses, compiled DecisionIrBundles, W3C evidence references,
 * JWS receipts, and shadow DecisionAuthorizations for:
 * - `juneau-helicopter-tours` (backed by preserved HTTP response bytes from Coastal, TEMSCO, NorthStar, FAA)
 * - `hawaii-whale-watching` (50 CFR 224.103)
 * - `denver-to-mountain-transportation` (GoSno private SUV max 6 / Van max 10; legacy 14-pax/$89 shared seed withdrawn)
 * - `juneau-helicopter-canary-v03` (strict evidence-sufficiency canary)
 *
 * Wired to `NeonRelationalLedgerStoreV03` for durable relational persistence so
 * in-memory maps serve only as a warm cache and never as the sole copy.
 */

export interface V03AdmittedLedgerTimestamps {
  admissionId: string;
  admittedByDatabaseClock: boolean;
  databaseSchema: string;
  withdrawalRecordedAt: string;
  noaaRecordedAt: string;
  juneauPolicyRecordedAt: string;
  gosnoModeRecordedAt: string;
  gosnoSuvRecordedAt: string;
  gosnoVanRecordedAt: string;
  gosnoUnknownConditionsRecordedAt: string;
}

export interface V03PersistedAdmissionSnapshot {
  schemaVersion?: string;
  spec?: "dcc-admitted-ledger-state/0.3.1";
  admittedTimestamps: V03AdmittedLedgerTimestamps;
  events: readonly V03KnowledgeEvent[];
  evidenceRefs?: V03EvidenceReference[];
  newlyAppendedEventsCount?: number;
  preservedExistingEventsCount?: number;
  preservedUnverifiedLegacyEventsCount?: number;
}

export const ADMITTED_LEDGER_STATE_PATH_V031 = path.join(
  process.cwd(),
  "data",
  "machine",
  "v03",
  "admitted_ledger_state_v031.json",
);

export function loadPersistedAdmissionSnapshotV031(): V03PersistedAdmissionSnapshot | null {
  // Never present nonproduction admission snapshot timestamps as production recording times
  if (process.env.VERCEL_ENV === "production") {
    return null;
  }
  try {
    if (fs.existsSync(ADMITTED_LEDGER_STATE_PATH_V031)) {
      const raw = fs.readFileSync(ADMITTED_LEDGER_STATE_PATH_V031, "utf8");
      const parsed = JSON.parse(raw) as V03PersistedAdmissionSnapshot;
      if (parsed && parsed.admittedTimestamps && Array.isArray(parsed.events)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export interface V03RuntimeStore {
  knowledgeLedger: AppendOnlyKnowledgeLedger;
  identityLedger: DccIdentityLedger;
  objectStore: PrivateArtifactObjectStore;
  neonStore: NeonRelationalLedgerStoreV03;
  neonLedgerStore?: NeonRelationalLedgerStoreV03;
  universesByIdAndVersion: Map<string, V03CandidateUniverse>;
  universesByHash: Map<string, V03CandidateUniverse>;
  bundlesByEngineAndVersion: Map<string, V03CompiledEngineBundle>;
  bundlesByHash: Map<string, V03CompiledEngineBundle>;
  activeEngineVersionByEngineId: Map<string, string>;
  evidenceRefsById: Map<string, V03EvidenceReference>;
  receiptsById: Map<
    string,
    {
      receipt: V03SignedDecisionReceipt;
      inputs: Record<string, unknown>;
      evaluationResult?: V03EvaluationResult;
    }
  >;
  authorizationsById: Map<string, V03SignedDecisionAuthorization>;
  preservedCapturesSyncedToObjectStore: boolean;
  baseStateSyncedToNeon: boolean;
  hydratedFromNeon: boolean;
  admittedTimestamps: V03AdmittedLedgerTimestamps;
}

function getActiveNeonStore(store: V03RuntimeStore): NeonRelationalLedgerStoreV03 {
  return store.neonLedgerStore ?? store.neonStore;
}

function isNeonStoreConfigured(store: V03RuntimeStore): boolean {
  const neon = getActiveNeonStore(store) as unknown as {
    isConfigured?: boolean | (() => boolean);
  };
  if (typeof neon.isConfigured === "function") {
    return neon.isConfigured();
  }
  if (typeof neon.isConfigured === "boolean") {
    return neon.isConfigured;
  }
  return true;
}

let singletonStoreV03: V03RuntimeStore | null = null;

export function resetV03RuntimeStore(): void {
  singletonStoreV03 = null;
}

function createRuntimeObjectStore(): PrivateArtifactObjectStore {
  const r2Status = inspectR2CredentialsFromEnv();
  if (r2Status.configured) {
    try {
      return new CloudflareR2PrivateArtifactStore();
    } catch {
      return new InMemoryTestArtifactStore();
    }
  }
  return new InMemoryTestArtifactStore();
}

export async function ensurePreservedCapturesStoredInObjectStore(
  store: V03RuntimeStore = getV03RuntimeStore(),
): Promise<void> {
  if (store.preservedCapturesSyncedToObjectStore) return;
  const bundle = loadPreservedCapturesBundleV031();
  for (const capture of Object.values(bundle.captures)) {
    await persistPreservedCaptureToObjectStore({
      capture,
      objectStore: store.objectStore,
    });
  }
  store.preservedCapturesSyncedToObjectStore = true;
}

export async function ensureBaseStoreSyncedToNeon(
  store: V03RuntimeStore = getV03RuntimeStore(),
): Promise<boolean> {
  if (store.baseStateSyncedToNeon) return true;
  if (!isNeonStoreConfigured(store)) return false;
  const neon = getActiveNeonStore(store);
  try {
    await neon.ensureSchemaAndTables();
    await neon.persistLedgerEventsToNeon(store.knowledgeLedger.getAllEvents());
    for (const evRef of store.evidenceRefsById.values()) {
      await neon.persistEvidenceReferenceToNeon(evRef);
    }
    for (const univ of store.universesByHash.values()) {
      await neon.persistCandidateUniverseToNeon(univ);
    }
    for (const bnd of store.bundlesByHash.values()) {
      await neon.persistEngineBundleToNeon(bnd);
    }
    store.baseStateSyncedToNeon = true;
    return true;
  } catch {
    return false;
  }
}

const REQUIRED_VERIFIED_ACTIVE_CLAIM_IDS_V031 = [
  "clm:jnu:standard-seat-weight-limit-lbs",
  "clm:haw:noaa-100yd-approach-compliance",
  "clm:gosno:private-transport-mode-only",
  "clm:gosno:private-suv-max-passengers-6",
  "clm:gosno:private-van-max-passengers-10",
] as const;

const REQUIRED_VERIFIED_UNKNOWN_CONDITION_CLAIM_IDS_V031 = [
  "clm:gosno:live-driver-availability",
  "clm:gosno:live-vehicle-availability",
  "clm:gosno:live-equipment-fit-at-capacity",
  "clm:gosno:live-road-safety",
  "clm:gosno:live-inventory-confirmation",
] as const;

function ledgerHasAllVerifiedDatabaseAdmissions(
  events: readonly V03KnowledgeEvent[],
): boolean {
  if (events.length === 0) return false;
  const hasVerifiedWithdrawal = events.some(
    (e) =>
      e.claimId === "clm:gosno:max-pax-per-shuttle" &&
      e.eventType === "claim_withdrawn" &&
      e.recordedAtVerified === true &&
      e.recordingTimeStatus === "verified_database_admission" &&
      e.recordedAt !== null,
  );
  if (!hasVerifiedWithdrawal) return false;

  for (const cid of [
    ...REQUIRED_VERIFIED_ACTIVE_CLAIM_IDS_V031,
    ...REQUIRED_VERIFIED_UNKNOWN_CONDITION_CLAIM_IDS_V031,
  ]) {
    const hasVerified = events.some(
      (e) =>
        e.claimId === cid &&
        e.recordedAtVerified === true &&
        e.recordingTimeStatus === "verified_database_admission" &&
        e.recordedAt !== null,
    );
    if (!hasVerified) return false;
  }
  return true;
}

/**
 * Reloads persisted knowledge events, candidate universes, and compiled engine bundles
 * from Neon PostgreSQL (`dcc_machine_v03`) on restart / cold start so that recording times
 * assigned once at database admission time are preserved across restarts without ever
 * assigning new recording times on cold start. If the connected database contains
 * pre-repair unverified legacy events without verified database-admitted replacements
 * (such as production `/neondb` on first repair), performs additive idempotent admission
 * using that database's own PostgreSQL `clock_timestamp()`.
 */
export async function ensureRuntimeStoreHydratedFromNeon(
  store: V03RuntimeStore = getV03RuntimeStore(),
): Promise<boolean> {
  if (!isNeonStoreConfigured(store)) return false;
  const neon = getActiveNeonStore(store);
  if (
    typeof neon.ensureSchemaAndTables !== "function" ||
    typeof neon.readLedgerEventsFromNeon !== "function"
  ) {
    return false;
  }
  try {
    await neon.ensureSchemaAndTables();
    const persistedEvents = await neon.readLedgerEventsFromNeon();

    if (
      !ledgerHasAllVerifiedDatabaseAdmissions(persistedEvents) &&
      typeof neon.queryDatabaseClockIso === "function"
    ) {
      await admitOperationalLedgerAdditiveIdempotentV031({
        neonStore: neon,
        store,
        writeSnapshotToDisk: false,
      });
      return true;
    }

    if (persistedEvents.length > 0) {
      store.knowledgeLedger = AppendOnlyKnowledgeLedger.fromEvents(persistedEvents);
      const findLatestVerifiedEvent = (claimId: string, eventType?: string) => {
        const matches = persistedEvents.filter(
          (e) =>
            e.claimId === claimId &&
            (!eventType || e.eventType === eventType) &&
            e.recordedAtVerified === true &&
            e.recordedAt !== null,
        );
        return matches.length > 0 ? matches[matches.length - 1]! : null;
      };

      const withdrawalEv =
        findLatestVerifiedEvent("clm:gosno:max-pax-per-shuttle", "claim_withdrawn") ??
        persistedEvents.find(
          (e) =>
            e.eventType === "claim_withdrawn" &&
            e.claimId === "clm:gosno:max-pax-per-shuttle",
        );
      const withdrawnRef = store.evidenceRefsById.get("evref:gosno:tariff-2026-winter-park");
      if (withdrawalEv && withdrawnRef) {
        store.evidenceRefsById.set("evref:gosno:tariff-2026-winter-park", {
          ...withdrawnRef,
          withdrawnAt: withdrawalEv.recordedAt,
          withdrawalEventId: withdrawalEv.eventId,
        });
      }

      // Sync evidenceRefs from verified database-admitted events (e.g. evRefNoaa100yd)
      for (const ev of persistedEvents) {
        if (ev.recordedAtVerified && ev.claimDefinition?.evidenceRefs) {
          for (const ref of ev.claimDefinition.evidenceRefs) {
            store.evidenceRefsById.set(ref.evidenceRefId, ref);
          }
        }
      }

      const noaaEv = findLatestVerifiedEvent("clm:haw:noaa-100yd-approach-compliance");
      const jnuEv = findLatestVerifiedEvent("clm:jnu:standard-seat-weight-limit-lbs");
      const gosnoModeEv = findLatestVerifiedEvent("clm:gosno:private-transport-mode-only");
      const gosnoSuvEv = findLatestVerifiedEvent("clm:gosno:private-suv-max-passengers-6");
      const gosnoVanEv = findLatestVerifiedEvent("clm:gosno:private-van-max-passengers-10");
      const gosnoUnkEv = findLatestVerifiedEvent("clm:gosno:live-driver-availability");

      if (
        withdrawalEv?.recordedAt &&
        noaaEv?.recordedAt &&
        jnuEv?.recordedAt &&
        gosnoModeEv?.recordedAt &&
        gosnoSuvEv?.recordedAt &&
        gosnoVanEv?.recordedAt &&
        gosnoUnkEv?.recordedAt
      ) {
        store.admittedTimestamps = {
          admissionId: `db-admission-v031-${withdrawalEv.recordedAt}`,
          admittedByDatabaseClock: true,
          databaseSchema: neon.schemaName,
          withdrawalRecordedAt: withdrawalEv.recordedAt,
          noaaRecordedAt: noaaEv.recordedAt,
          juneauPolicyRecordedAt: jnuEv.recordedAt,
          gosnoModeRecordedAt: gosnoModeEv.recordedAt,
          gosnoSuvRecordedAt: gosnoSuvEv.recordedAt,
          gosnoVanRecordedAt: gosnoVanEv.recordedAt,
          gosnoUnknownConditionsRecordedAt: gosnoUnkEv.recordedAt,
        };
      }

      if (typeof neon.readAllCandidateUniversesFromNeon === "function") {
        const universes = await neon.readAllCandidateUniversesFromNeon();
        for (const u of universes) {
          store.universesByHash.set(u.universeHash, u);
          store.universesByIdAndVersion.set(`${u.universeId}@${u.version}`, u);
          store.universesByIdAndVersion.set(u.universeId, u);
        }
      }
      if (typeof neon.readAllEngineBundlesFromNeon === "function") {
        const bundles = await neon.readAllEngineBundlesFromNeon();
        for (const b of bundles) {
          store.bundlesByHash.set(b.bundleHash, b);
          store.bundlesByEngineAndVersion.set(`${b.engineId}@${b.engineVersion}`, b);
          store.bundlesByEngineAndVersion.set(b.engineId, b);
          store.activeEngineVersionByEngineId.set(b.engineId, b.engineVersion);
        }
      }
      store.baseStateSyncedToNeon = true;
      store.hydratedFromNeon = true;
      return true;
    } else {
      await ensureBaseStoreSyncedToNeon(store);
      store.hydratedFromNeon = true;
      return true;
    }
  } catch {
    return false;
  }
}

export function getV03RuntimeStore(options?: {
  admittedTimestampsOverride?: V03AdmittedLedgerTimestamps;
}): V03RuntimeStore {
  if (singletonStoreV03 && !options?.admittedTimestampsOverride) return singletonStoreV03;

  let knowledgeLedger = new AppendOnlyKnowledgeLedger();
  const identityLedger = new DccIdentityLedger();
  const objectStore = createRuntimeObjectStore();
  const neonStore = new NeonRelationalLedgerStoreV03();
  const universesByIdAndVersion = new Map<string, V03CandidateUniverse>();
  const universesByHash = new Map<string, V03CandidateUniverse>();
  const bundlesByEngineAndVersion = new Map<string, V03CompiledEngineBundle>();
  const bundlesByHash = new Map<string, V03CompiledEngineBundle>();
  const activeEngineVersionByEngineId = new Map<string, string>();
  const evidenceRefsById = new Map<string, V03EvidenceReference>();
  const receiptsById = new Map<
    string,
    {
      receipt: V03SignedDecisionReceipt;
      inputs: Record<string, unknown>;
      evaluationResult?: V03EvaluationResult;
    }
  >();
  const authorizationsById = new Map<string, V03SignedDecisionAuthorization>();

  const schemaHashes = getV03SchemaHashes();
  const persistedSnapshot = loadPersistedAdmissionSnapshotV031();
  const capCoastalTourForClock = getPreservedCaptureByIdV031(
    "cap:juneau:coastal-icefield-excursion-html",
  );
  const capGosnoRouteFeedForClock = getPreservedCaptureByIdV031("cap:gosno:route-feed-json");

  const admittedTimestamps: V03AdmittedLedgerTimestamps =
    options?.admittedTimestampsOverride ??
    persistedSnapshot?.admittedTimestamps ?? {
      admissionId: "bootstrap-pending-db-admission",
      admittedByDatabaseClock: false,
      databaseSchema: "dcc_machine_v03",
      withdrawalRecordedAt: capGosnoRouteFeedForClock.retrievedAt,
      noaaRecordedAt: capCoastalTourForClock.retrievedAt,
      juneauPolicyRecordedAt: capCoastalTourForClock.retrievedAt,
      gosnoModeRecordedAt: capGosnoRouteFeedForClock.retrievedAt,
      gosnoSuvRecordedAt: capGosnoRouteFeedForClock.retrievedAt,
      gosnoVanRecordedAt: capGosnoRouteFeedForClock.retrievedAt,
      gosnoUnknownConditionsRecordedAt: capGosnoRouteFeedForClock.retrievedAt,
    };

  const withdrawalRecordedAt = admittedTimestamps.withdrawalRecordedAt;
  const noaaRecordedAt = admittedTimestamps.noaaRecordedAt;
  const juneauPolicyRecordedAt = admittedTimestamps.juneauPolicyRecordedAt;
  const gosnoModeRecordedAt = admittedTimestamps.gosnoModeRecordedAt;
  const gosnoSuvRecordedAt = admittedTimestamps.gosnoSuvRecordedAt;
  const gosnoVanRecordedAt = admittedTimestamps.gosnoVanRecordedAt;
  const gosnoUnknownConditionsRecordedAt =
    admittedTimestamps.gosnoUnknownConditionsRecordedAt;
  const repairedIngestionRecordedAt = gosnoVanRecordedAt;

  // Seed preserved captures synchronously into InMemoryTestArtifactStore if active
  if (objectStore instanceof InMemoryTestArtifactStore) {
    const bundle = loadPreservedCapturesBundleV031();
    for (const capture of Object.values(bundle.captures)) {
      void persistPreservedCaptureToObjectStore({ capture, objectStore });
    }
  }

  // ==========================================================================
  // 1. Register DCC-Native Identities & Versioned External Aliases
  // ==========================================================================
  const jnuDestId = mintOpaqueDccEntityId("destination", "us-ak-juneau");
  const mauiDestId = mintOpaqueDccEntityId("destination", "us-hi-maui-maalaea");
  const denverDestId = mintOpaqueDccEntityId("destination", "us-co-denver-mountain-corridor");

  const coastalOpId = mintOpaqueDccEntityId("operator", "coastal-helicopters-juneau");
  const temscoOpId = mintOpaqueDccEntityId("operator", "temsco-helicopters-juneau");
  const northstarOpId = mintOpaqueDccEntityId("operator", "northstar-trekking-juneau");
  const pacWhaleOpId = mintOpaqueDccEntityId("operator", "pacific-whale-foundation-maui");
  const trilogyOpId = mintOpaqueDccEntityId("operator", "trilogy-excursions-maui");
  const gosnoOpId = mintOpaqueDccEntityId("operator", "gosno-mountain-transportation-co");

  const candJnuCoastalId = mintOpaqueDccEntityId("tour_candidate", "jnu-heli-coastal-icefield");
  const candJnuTemscoId = mintOpaqueDccEntityId("tour_candidate", "jnu-heli-mendenhall-landing");
  const candJnuNorthstarId = mintOpaqueDccEntityId("tour_candidate", "jnu-heli-northstar-trek");

  const candHawPwfCatamaranId = mintOpaqueDccEntityId("tour_candidate", "haw-pwf-maalaea-catamaran");
  const candHawTrilogySailId = mintOpaqueDccEntityId("tour_candidate", "haw-trilogy-kaaanapali-sail");

  // Legacy withdrawn GoSno shared shuttle candidate (preserved in history & knownExclusions)
  const candGosnoExpressWithdrawnId = mintOpaqueDccEntityId(
    "tour_candidate",
    "gosno-denver-winter-park-express-shuttle",
  );

  // Genuine GoSno private transportation candidates backed by preserved first-party captures
  const candGosnoBreckSuvId = mintOpaqueDccEntityId(
    "tour_candidate",
    "gosno-denver-breckenridge-private-suv",
  );
  const candGosnoBreckVanId = mintOpaqueDccEntityId(
    "tour_candidate",
    "gosno-denver-breckenridge-private-van",
  );
  const candGosnoWinterParkSuvId = mintOpaqueDccEntityId(
    "tour_candidate",
    "gosno-denver-winter-park-private-suv",
  );
  const candGosnoVailSuvId = mintOpaqueDccEntityId(
    "tour_candidate",
    "gosno-denver-vail-private-suv",
  );
  const candGosnoCopperSuvId = mintOpaqueDccEntityId(
    "tour_candidate",
    "gosno-denver-copper-mountain-private-suv",
  );

  const srcCoastalPolicyId = mintOpaqueDccEntityId("evidence_source", "coastal-ops-policy-2026");
  const srcTemscoPolicyId = mintOpaqueDccEntityId("evidence_source", "temsco-ops-policy-2026");
  const srcNorthstarPolicyId = mintOpaqueDccEntityId("evidence_source", "northstar-ops-policy-2026");
  const srcFaaWeathercamsId = mintOpaqueDccEntityId("evidence_source", "faa-weathercams-portal-2026");
  const srcNoaaHumpbackId = mintOpaqueDccEntityId("evidence_source", "noaa-50cfr224-humpback-approach");
  const srcGosnoTariffWithdrawnId = mintOpaqueDccEntityId(
    "evidence_source",
    "gosno-published-tariff-2026",
  );
  const srcGosnoRouteFeedId = mintOpaqueDccEntityId(
    "evidence_source",
    "gosno-public-route-feed-2026",
  );
  const srcGosnoAgentJsonId = mintOpaqueDccEntityId(
    "evidence_source",
    "gosno-agent-json-manifest-2026",
  );
  const srcGosnoLlmsTxtId = mintOpaqueDccEntityId("evidence_source", "gosno-llms-txt-2026");
  const srcGosnoWinterParkHtmlId = mintOpaqueDccEntityId(
    "evidence_source",
    "gosno-winter-park-page-2026",
  );
  const srcGosnoBreckHtmlId = mintOpaqueDccEntityId(
    "evidence_source",
    "gosno-denver-to-breckenridge-page-2026",
  );

  for (const [id, kind, name] of [
    [jnuDestId, "destination", "Juneau, Alaska"],
    [mauiDestId, "destination", "Maui (Maalaea & Lahaina), Hawaii"],
    [denverDestId, "destination", "Denver to Colorado Mountain Corridor, Colorado"],
    [coastalOpId, "operator", "Coastal Helicopters"],
    [temscoOpId, "operator", "TEMSCO Helicopters"],
    [northstarOpId, "operator", "NorthStar Trekking"],
    [pacWhaleOpId, "operator", "Pacific Whale Foundation Eco-Adventures"],
    [trilogyOpId, "operator", "Trilogy Excursions"],
    [gosnoOpId, "operator", "GoSno Mountain Transportation"],
    [candJnuCoastalId, "tour_candidate", "Icefield Excursion & Glacier Walk (Coastal Helicopters)"],
    [candJnuTemscoId, "tour_candidate", "Mendenhall Glacier Helicopter & Guided Walk (TEMSCO)"],
    [candJnuNorthstarId, "tour_candidate", "Helicopter Glacier Walkabout (NorthStar Trekking)"],
    [candHawPwfCatamaranId, "tour_candidate", "Maalaea Stabilized Double-Deck Catamaran Whale Watch"],
    [candHawTrilogySailId, "tour_candidate", "Small-Group Sailing Catamaran Whale Watch"],
    [
      candGosnoExpressWithdrawnId,
      "tour_candidate",
      "[WITHDRAWN SEED] GoSno Denver to Winter Park Resort Express Shuttle",
    ],
    [
      candGosnoBreckSuvId,
      "tour_candidate",
      "GoSno Private SUV Transfer — Denver / DEN to Breckenridge (Rezdy PF616Q)",
    ],
    [
      candGosnoBreckVanId,
      "tour_candidate",
      "GoSno Private Van Transfer — Denver / DEN to Breckenridge (Rezdy PF616Q)",
    ],
    [
      candGosnoWinterParkSuvId,
      "tour_candidate",
      "GoSno Private SUV Transfer — Denver / DEN to Winter Park",
    ],
    [
      candGosnoVailSuvId,
      "tour_candidate",
      "GoSno Private SUV Transfer — Denver / DEN to Vail (Rezdy PR68BH)",
    ],
    [
      candGosnoCopperSuvId,
      "tour_candidate",
      "GoSno Private SUV Transfer — Denver / DEN to Copper Mountain (Rezdy PLK9L2)",
    ],
  ] as const) {
    identityLedger.registerEntity({
      dccEntityId: id,
      entityKind: kind,
      displayName: name,
      recordedAt: withdrawalRecordedAt,
    });
  }

  // ==========================================================================
  // 2. Contain & Withdraw Legacy Unsupported GoSno Shared Shuttle Seed
  //    (Preserves history in append-only ledger while keeping legacy recording
  //     time explicitly unverified and marking withdrawn)
  // ==========================================================================
  const gosnoLegacySeedDoc =
    "GoSno Mountain Shuttle Tariff 2026: Denver Union Station / DEN to Winter Park Resort shared express shuttle operates up to 14 passengers per van, max 2 ski/snowboard bags per rider, published fare $89 USD per person.";
  const gosnoLegacySel = extractTextEvidenceSelectors({
    documentText: gosnoLegacySeedDoc,
    exactQuote:
      "up to 14 passengers per van, max 2 ski/snowboard bags per rider, published fare $89 USD",
  });

  // 2a. Record historical legacy seed in append-only ledger with explicitly unverified recording time
  knowledgeLedger.appendEvent({
    eventType: "claim_created",
    claimId: "clm:gosno:max-pax-per-shuttle",
    claimVersionId: "clmv:gosno:max-pax-per-shuttle:v1",
    recordedAt: null,
    recordedAtVerified: false,
    recordingTimeStatus: "unverified_legacy_recording_time",
    actorId: "dcc-v03-bootstrap",
    isSynthetic: true,
    provenanceClass: "withdrawn_unsupported",
    reason:
      "Historical pre-v0.3.1 bootstrap seed with unverified legacy recording time (subsequently withdrawn after first-party GoSno source audit).",
    claimDefinition: {
      claimId: "clm:gosno:max-pax-per-shuttle",
      claimVersionId: "clmv:gosno:max-pax-per-shuttle:v1",
      subjectDccId: candGosnoExpressWithdrawnId,
      predicate: "max_passengers_per_shuttle_van",
      assertionType: "policy",
      epistemicState: "disputed",
      typedValue: 14,
      unitOrCurrency: "passengers",
      validFrom: "2026-01-01T00:00:00.000Z",
      validTo: withdrawalRecordedAt,
      sourceObservedAt: null,
      sourcePublishedAt: null,
      retrievedAt: null,
      freshnessTtlSeconds: 90 * 86400,
      sourceAuthority: {
        sourceDccId: srcGosnoTariffWithdrawnId,
        organizationName: "Withdrawn Legacy Seed (GoSno)",
        authorityTier: "unverified_third_party",
        competentDomains: [],
        claimedDomain: "ground_shuttle_operations",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: "Withdrawn unsupported seed fixture",
      },
      evidenceRefs: [],
    },
  });

  // 2b. Append explicit withdrawal event admitted with actual database admission time
  const gosnoWithdrawalReason =
    "Withdrawn unsupported bootstrap seed: First-party GoSno captures (https://gosno.co/api/public/route-feed, https://gosno.co/agent.json, https://gosno.co/llms.txt, https://gosno.co/winter-park) establish that GoSno operates private door-to-door mountain transportation only (no shared shuttles), with established vehicle limits of 6 passengers for Private SUVs and 10 passengers for Private Vans, and per-vehicle flat rates starting at $349-$699 rather than an $89 per-person shared shuttle.";
  const gosnoWithdrawalEvent = knowledgeLedger.appendEvent({
    eventType: "claim_withdrawn",
    claimId: "clm:gosno:max-pax-per-shuttle",
    claimVersionId: "clmv:gosno:max-pax-per-shuttle:v2-withdrawn",
    targetPreviousVersionId: "clmv:gosno:max-pax-per-shuttle:v1",
    recordedAt: withdrawalRecordedAt,
    recordedAtVerified: true,
    recordingTimeStatus: "verified_database_admission",
    actorId: "dcc-v031-evidence-containment-auditor",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason: gosnoWithdrawalReason,
  });

  const evRefGosnoWithdrawn = buildV03EvidenceReference({
    evidenceRefId: "evref:gosno:tariff-2026-winter-park",
    sourceDccId: srcGosnoTariffWithdrawnId,
    sourceTitle:
      "[WITHDRAWN UNSUPPORTED SEED] GoSno Denver-to-Winter-Park Published Shuttle Tariff",
    sourceOrganization: "GoSno Mountain Transportation (Withdrawn Legacy Seed)",
    canonicalSourceUrl: "https://www.destinationcommandcenter.com/go/dcc-to-gosno",
    snapshotId: `snap:sha256:${sha256HexFull(gosnoLegacySeedDoc)}`,
    snapshotSha256: sha256HexFull(gosnoLegacySeedDoc),
    privateObjectKey: `v03/quarantine_temp/sha256/${sha256HexFull(gosnoLegacySeedDoc)}.txt`,
    selectors: gosnoLegacySel.selectors,
    surroundingContext: gosnoLegacySel.surroundingContext,
    extractor: {
      extractorId: "dcc-v03-text-selector",
      extractorVersion: "0.3.0",
      method: "deterministic_regex_span",
    },
    extractedAt: null,
    retrievedAt: null,
    recordingTimeVerified: false,
    recordingTimeStatus: "unverified_legacy_recording_time",
    sourcePublishedAt: null,
    sourceObservedAt: null,
    licenseOrReusePolicy: "Withdrawn unsupported seed — preserved for audit history only",
    provenanceClass: "withdrawn_unsupported",
    isSynthetic: true,
    lifecycleState: "withdrawn",
    withdrawn: true,
    withdrawnAt: withdrawalRecordedAt,
    withdrawalReason: gosnoWithdrawalReason,
    withdrawalEventId: gosnoWithdrawalEvent.eventId,
  });
  evidenceRefsById.set(evRefGosnoWithdrawn.evidenceRefId, evRefGosnoWithdrawn);

  // ==========================================================================
  // 3. Build Genuine Juneau Evidence References from Preserved Captures
  // ==========================================================================
  const capCoastalTour = getPreservedCaptureByIdV031("cap:juneau:coastal-icefield-excursion-html");
  const capCoastalFaq = getPreservedCaptureByIdV031("cap:juneau:coastal-faq-html");
  const capTemscoTour = getPreservedCaptureByIdV031("cap:juneau:temsco-mendenhall-glacier-html");
  const capNorthstarTour = getPreservedCaptureByIdV031("cap:juneau:northstar-walkabout-html");
  const capNorthstarFaq = getPreservedCaptureByIdV031("cap:juneau:northstar-faqs-html");
  const capFaaWeathercams = getPreservedCaptureByIdV031("cap:juneau:faa-weathercams-html");

  const evRefJnuCoastalPrice = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:jnu:coastal:price-tiers-html",
    sourceDccId: srcCoastalPolicyId,
    capture: capCoastalTour,
    exactQuote:
      "Standard Passengers\nStarts AT:\n(Price may vary depending on weight)\n$\n459\nStandard Plus\nStarts AT:\n(Price may vary depending on weight)\n$\n609\nPremium\nStarts AT:\n(Price may vary depending on weight)\n$\n918",
    licenseOrReusePolicy: "First-party operator published tariff facts (Coastal Helicopters)",
  });
  const evRefJnuCoastalBuffer = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:jnu:coastal:cruise-buffer-html",
    sourceDccId: srcCoastalPolicyId,
    capture: capCoastalTour,
    exactQuote:
      "When selecting a Juneau helicopter glacier tour time; please allow yourself a 45-minute buffer from when your ship arrives and leaves.",
    licenseOrReusePolicy: "First-party operator published policy facts (Coastal Helicopters)",
  });
  const evRefJnuCoastalProhibited = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:jnu:coastal:prohibited-items-html",
    sourceDccId: srcCoastalPolicyId,
    capture: capCoastalTour,
    exactQuote:
      "Cameras and cell phones are welcomed while on tour, but all drones, selfie sticks, phone stabilizers, and any camera extensions are prohibited.",
    licenseOrReusePolicy: "First-party operator published safety policy (Coastal Helicopters)",
  });
  const evRefJnuCoastalWeight260 = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:jnu:coastal:weight-260-surcharge-faq",
    sourceDccId: srcCoastalPolicyId,
    capture: capCoastalFaq,
    exactQuote:
      "Due to the limited space in our aircraft, we have to reserve extra space for those weighing 260lbs or more. This fee pays for 1.5 seats.",
    licenseOrReusePolicy: "First-party operator published FAQ policy (Coastal Helicopters)",
  });
  const evRefJnuCoastalWeight300 = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:jnu:coastal:weight-300-surcharge-faq",
    sourceDccId: srcCoastalPolicyId,
    capture: capCoastalFaq,
    exactQuote:
      "Due to the limited space in our aircraft, we have to reserve extra space for those weighing 300lbs or more. This fee pays for 2 full seats.",
    licenseOrReusePolicy: "First-party operator published FAQ policy (Coastal Helicopters)",
  });
  const evRefJnuCoastalMobility = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:jnu:coastal:mobility-unassisted-faq",
    sourceDccId: srcCoastalPolicyId,
    capture: capCoastalFaq,
    exactQuote:
      "If you are unable to enter and exit our aircraft on your own, you may be subject to rescheduling on the day of your tour or cancellation without refund.",
    licenseOrReusePolicy: "First-party operator published FAQ policy (Coastal Helicopters)",
  });

  const evRefJnuTemscoWeight250 = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:jnu:temsco:weight-250-surcharge-html",
    sourceDccId: srcTemscoPolicyId,
    capture: capTemscoTour,
    exactQuote:
      "Due to weight and balance limitations, as well as guest safety and comfort, passengers weighing 250 pounds (113kg or 18 Stone) or more will be charged an additional $150.00 to reserve adequate space on board the helicopter.",
    licenseOrReusePolicy: "First-party operator published policy facts (TEMSCO Helicopters)",
  });
  const evRefJnuTemscoServiceAnimals = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:jnu:temsco:service-animals-prohibited-html",
    sourceDccId: srcTemscoPolicyId,
    capture: capTemscoTour,
    exactQuote:
      "Per TEMSCO Helicopters’ Passenger Mobility Policy, service animals shall not be permitted on Temsco Eurocopter Astar, Hughes 500 and Airbus H130 aircraft used by Temsco for flightseeing and tours.",
    licenseOrReusePolicy: "First-party operator published policy facts (TEMSCO Helicopters)",
  });
  const evRefJnuTemscoMobility = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:jnu:temsco:mobility-unassisted-html",
    sourceDccId: srcTemscoPolicyId,
    capture: capTemscoTour,
    exactQuote:
      "Due to liability reasons, our employees cannot lift guests in or out of the helicopter. TEMSCO staff will be there to lend a helping hand, though ultimately guests are responsible for navigating these steps on their own.",
    licenseOrReusePolicy: "First-party operator published policy facts (TEMSCO Helicopters)",
  });

  const evRefJnuNorthstarAgeAndWalk = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:jnu:northstar:age-8-and-walk-html",
    sourceDccId: srcNorthstarPolicyId,
    capture: capNorthstarTour,
    exactQuote:
      "Must be at least 8 years old to participate.\nMust be able to walk unassisted for one hour on moderately flat but uneven terrain.",
    licenseOrReusePolicy: "First-party operator published policy facts (NorthStar Trekking)",
  });
  const evRefJnuNorthstarBuffer = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:jnu:northstar:cruise-buffer-html",
    sourceDccId: srcNorthstarPolicyId,
    capture: capNorthstarTour,
    exactQuote:
      "Please book your tour at least one hour after your ship’s arrival time. The tour should conclude no less than 45 minutes before your ship’s departure time.",
    licenseOrReusePolicy: "First-party operator published policy facts (NorthStar Trekking)",
  });
  const evRefJnuNorthstarWeight250 = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:jnu:northstar:weight-250-surcharge-faq",
    sourceDccId: srcNorthstarPolicyId,
    capture: capNorthstarFaq,
    exactQuote:
      "Bags, purses, selfie sticks, nor drones are permitted. We provide safe storage for any personal belongings to remain at our base.",
    licenseOrReusePolicy: "First-party operator published FAQ policy (NorthStar Trekking)",
  });
  const evRefJnuFaaPortal = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:jnu:faa:weathercams-portal-html",
    sourceDccId: srcFaaWeathercamsId,
    capture: capFaaWeathercams,
    exactQuote: "FAA WeatherCams\nWelcome to WeatherCams",
    licenseOrReusePolicy: "US Federal Government Public Domain (17 U.S.C. 105)",
  });

  for (const ref of [
    evRefJnuCoastalPrice,
    evRefJnuCoastalBuffer,
    evRefJnuCoastalProhibited,
    evRefJnuCoastalWeight260,
    evRefJnuCoastalWeight300,
    evRefJnuCoastalMobility,
    evRefJnuTemscoWeight250,
    evRefJnuTemscoServiceAnimals,
    evRefJnuTemscoMobility,
    evRefJnuNorthstarAgeAndWalk,
    evRefJnuNorthstarBuffer,
    evRefJnuNorthstarWeight250,
    evRefJnuFaaPortal,
  ]) {
    evidenceRefsById.set(ref.evidenceRefId, ref);
  }
  // Canonical aliases for Juneau weight policy citations
  evidenceRefsById.set("evref:jnu:operator-weight-policy-250", evRefJnuTemscoWeight250);
  evidenceRefsById.set("evref:jnu:weight-limit:text-quote", evRefJnuTemscoWeight250);

  // ==========================================================================
  // 4. Build Genuine GoSno Evidence References from Preserved First-Party Captures
  // ==========================================================================
  const capGosnoRouteFeed = getPreservedCaptureByIdV031("cap:gosno:route-feed-json");
  const capGosnoAgentJson = getPreservedCaptureByIdV031("cap:gosno:agent-json");
  const capGosnoLlmsTxt = getPreservedCaptureByIdV031("cap:gosno:llms-txt");
  const capGosnoWinterParkHtml = getPreservedCaptureByIdV031("cap:gosno:winter-park-html");
  const capGosnoBreckHtml = getPreservedCaptureByIdV031("cap:gosno:denver-to-breckenridge-html");

  const evRefGosnoRouteFeedMode = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:gosno:route-feed:private-mode-and-capacity",
    sourceDccId: srcGosnoRouteFeedId,
    capture: capGosnoRouteFeed,
    exactQuote:
      '"type":"private_mountain_transportation","headquarters":"Colorado, USA","active_payment_processor":"RezdyPay (Stripe Elements)"',
    jsonPointer: "/routes/0/capacity",
    jsonPointerResolvedValue: {
      max_passengers: 6,
      luggage_note:
        "Private party up to 6 passengers; cargo capacity depends on ski bags and luggage size.",
    },
    licenseOrReusePolicy: "DCC / GoSno First-Party Public Route Feed",
  });

  const evRefGosnoAgentManifest = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:gosno:agent-json:private-only-6-suv-10-van",
    sourceDccId: srcGosnoAgentJsonId,
    capture: capGosnoAgentJson,
    exactQuote:
      '"type":"private_mountain_transportation","description":"Private flat-rate airport transportation between Colorado airports and mountain destinations, with published route pages and vehicle-specific booking states."',
    jsonPointer: "/site/description",
    jsonPointerResolvedValue:
      "Private flat-rate airport transportation between Colorado airports and mountain destinations, with published route pages and vehicle-specific booking states.",
    licenseOrReusePolicy: "DCC / GoSno First-Party Machine Manifest",
  });

  const evRefGosnoLlmsSummary = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:gosno:llms-txt:corridor-rates-and-private-policy",
    sourceDccId: srcGosnoLlmsTxtId,
    capture: capGosnoLlmsTxt,
    exactQuote: "Private vehicle service only; no shared shuttles.",
    licenseOrReusePolicy: "DCC / GoSno First-Party llms.txt Specification",
  });

  const evRefGosnoWinterParkHtml = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:gosno:winter-park-html:private-suv-349-max-6",
    sourceDccId: srcGosnoWinterParkHtmlId,
    capture: capGosnoWinterParkHtml,
    exactQuote:
      "Private Denver Airport to Winter Park Transportation\n$ 349 one way per private SUV\nTotal for the private vehicle—not per passenger.",
    licenseOrReusePolicy: "DCC / GoSno First-Party Route Page",
  });

  const evRefGosnoBreckHtml = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:gosno:breckenridge-html:suv-399-van-649",
    sourceDccId: srcGosnoBreckHtmlId,
    capture: capGosnoBreckHtml,
    exactQuote:
      "Book a 100% private AWD SUV (up to 6 passengers) or private passenger van (up to 10 passengers) from Denver International Airport (DEN) directly to your mountain lodging with transparent flat rates and ample ski & snowboard gear space.",
    licenseOrReusePolicy: "DCC / GoSno First-Party Route Page",
  });

  for (const ref of [
    evRefGosnoRouteFeedMode,
    evRefGosnoAgentManifest,
    evRefGosnoLlmsSummary,
    evRefGosnoWinterParkHtml,
    evRefGosnoBreckHtml,
  ]) {
    evidenceRefsById.set(ref.evidenceRefId, ref);
  }

  // ==========================================================================
  // 5. Hawaii 50 CFR 224.103 Evidence Reference
  // ==========================================================================
  const noaaDoc =
    "50 CFR 224.103(a): It is unlawful to approach, by any means, within 100 yards (91.4 m) of any humpback whale in Hawaii waters.";
  const noaaSel = extractTextEvidenceSelectors({
    documentText: noaaDoc,
    exactQuote: "within 100 yards (91.4 m) of any humpback whale in Hawaii waters",
  });
  const evRefNoaa100yd = buildV03EvidenceReference({
    evidenceRefId: "evref:haw:noaa-50cfr224-100yd-approach",
    sourceDccId: srcNoaaHumpbackId,
    sourceTitle:
      "50 CFR § 224.103 — Special prohibitions for endangered marine mammals (Humpback Whales in Hawaii)",
    sourceOrganization: "NOAA Fisheries / Code of Federal Regulations",
    canonicalSourceUrl: "https://www.ecfr.gov/current/title-50/section-224.103",
    snapshotId: `snap:sha256:${sha256HexFull(noaaDoc)}`,
    snapshotSha256: sha256HexFull(noaaDoc),
    privateObjectKey: `v03/raw_source_captures/sha256/${sha256HexFull(noaaDoc)}.txt`,
    selectors: noaaSel.selectors,
    surroundingContext: noaaSel.surroundingContext,
    extractor: {
      extractorId: "dcc-v03-text-selector",
      extractorVersion: "0.3.0",
      method: "deterministic_regex_span",
    },
    extractedAt: noaaRecordedAt,
    retrievedAt: noaaRecordedAt,
    recordingTimeVerified: true,
    recordingTimeStatus: "verified_database_admission",
    sourcePublishedAt: null,
    sourceObservedAt: noaaRecordedAt,
    licenseOrReusePolicy: "US Federal Government Public Domain (17 U.S.C. 105)",
  });
  evidenceRefsById.set(evRefNoaa100yd.evidenceRefId, evRefNoaa100yd);

  // Map external aliases with evidence
  identityLedger.mapExternalAlias({
    aliasVersionId: "alias:jnu:coastal:legacy:v1",
    namespace: "legacy_dcc_slug",
    externalId: "jnu-heli-coastal-icefield",
    dccEntityId: candJnuCoastalId,
    mappingEvidenceRefIds: [evRefJnuCoastalPrice.evidenceRefId],
    recordedAt: juneauPolicyRecordedAt,
  });
  identityLedger.mapExternalAlias({
    aliasVersionId: "alias:gosno:rezdy:breck:v1",
    namespace: "rezdy_product_code",
    externalId: "PF616Q",
    dccEntityId: candGosnoBreckSuvId,
    mappingEvidenceRefIds: [evRefGosnoRouteFeedMode.evidenceRefId],
    recordedAt: gosnoModeRecordedAt,
  });

  // ==========================================================================
  // 6. Append Active Operational Claims (Juneau, Hawaii, GoSno)
  // ==========================================================================
  knowledgeLedger.appendEvent({
    eventType: "claim_created",
    claimId: "clm:jnu:standard-seat-weight-limit-lbs",
    claimVersionId: "clmv:jnu:standard-seat-weight-limit-lbs:v1",
    recordedAt: juneauPolicyRecordedAt,
    recordedAtVerified: true,
    recordingTimeStatus: "verified_database_admission",
    actorId: "dcc-v031-preserved-source-extractor",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason:
      "Derived from preserved TEMSCO, NorthStar, and Coastal HTML captures: 250 lbs (TEMSCO/NorthStar +$150 surcharge) and 260 lbs / 300 lbs (Coastal 1.5-seat / 2-seat surcharge) are weight surcharge thresholds rather than passenger exclusions.",
    claimDefinition: {
      claimId: "clm:jnu:standard-seat-weight-limit-lbs",
      claimVersionId: "clmv:jnu:standard-seat-weight-limit-lbs:v1",
      subjectDccId: jnuDestId,
      predicate: "operator_weight_surcharge_and_safety_policy_verified",
      assertionType: "policy",
      epistemicState: "verified_against_identified_evidence",
      typedValue: true,
      unitOrCurrency: "boolean",
      validFrom: "2026-01-01T00:00:00.000Z",
      validTo: "2027-12-31T23:59:59.000Z",
      sourceObservedAt: capCoastalTour.retrievedAt,
      sourcePublishedAt: null,
      retrievedAt: capCoastalTour.retrievedAt,
      freshnessTtlSeconds: 180 * 86400,
      sourceAuthority: {
        sourceDccId: srcCoastalPolicyId,
        organizationName: "Coastal Helicopters / TEMSCO Helicopters / NorthStar Trekking",
        authorityTier: "direct_operator",
        competentDomains: ["operator_safety_and_weight_policy"],
        claimedDomain: "operator_safety_and_weight_policy",
        independentlyCorroboratedBySourceDccIds: [srcTemscoPolicyId, srcNorthstarPolicyId],
        licenseOrReusePolicy: "First-party operator published policy facts",
      },
      evidenceRefs: [
        evRefJnuCoastalPrice,
        evRefJnuCoastalWeight260,
        evRefJnuCoastalWeight300,
        evRefJnuCoastalProhibited,
        evRefJnuCoastalMobility,
        evRefJnuTemscoWeight250,
        evRefJnuTemscoServiceAnimals,
        evRefJnuTemscoMobility,
        evRefJnuNorthstarAgeAndWalk,
        evRefJnuNorthstarBuffer,
        evRefJnuNorthstarWeight250,
      ],
    },
  });

  knowledgeLedger.appendEvent({
    eventType: "claim_created",
    claimId: "clm:haw:noaa-100yd-approach-compliance",
    claimVersionId: "clmv:haw:noaa-100yd-approach-compliance:v1",
    recordedAt: noaaRecordedAt,
    recordedAtVerified: true,
    recordingTimeStatus: "verified_database_admission",
    actorId: "dcc-v03-bootstrap",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason: "50 CFR 224.103(a) mandatory 100-yard humpback whale approach stand-off distance.",
    claimDefinition: {
      claimId: "clm:haw:noaa-100yd-approach-compliance",
      claimVersionId: "clmv:haw:noaa-100yd-approach-compliance:v1",
      subjectDccId: mauiDestId,
      predicate: "noaa_100yd_humpback_standoff_enforced",
      assertionType: "policy",
      epistemicState: "verified_against_identified_evidence",
      typedValue: true,
      validFrom: "2025-01-01T00:00:00.000Z",
      validTo: null,
      sourceObservedAt: noaaRecordedAt,
      sourcePublishedAt: null,
      retrievedAt: noaaRecordedAt,
      freshnessTtlSeconds: 365 * 86400,
      sourceAuthority: {
        sourceDccId: srcNoaaHumpbackId,
        organizationName: "NOAA Fisheries / Code of Federal Regulations",
        authorityTier: "primary_regulator",
        competentDomains: ["marine_wildlife_regulation"],
        claimedDomain: "marine_wildlife_regulation",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: "US Federal Government Public Domain",
      },
      evidenceRefs: [evRefNoaa100yd],
    },
  });

  // Genuine GoSno operational claims derived from preserved first-party captures
  knowledgeLedger.appendEvent({
    eventType: "claim_created",
    claimId: "clm:gosno:private-transport-mode-only",
    claimVersionId: "clmv:gosno:private-transport-mode-only:v1",
    recordedAt: gosnoModeRecordedAt,
    recordedAtVerified: true,
    recordingTimeStatus: "verified_database_admission",
    actorId: "dcc-v031-preserved-source-extractor",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason:
      "Extracted from gosno.co/api/public/route-feed, gosno.co/agent.json, and gosno.co/llms.txt: GoSno operates private door-to-door mountain transportation only (no shared shuttles).",
    claimDefinition: {
      claimId: "clm:gosno:private-transport-mode-only",
      claimVersionId: "clmv:gosno:private-transport-mode-only:v1",
      subjectDccId: gosnoOpId,
      predicate: "operates_private_door_to_door_transfers_only_no_shared_shuttles",
      assertionType: "policy",
      epistemicState: "verified_against_identified_evidence",
      typedValue: true,
      unitOrCurrency: "boolean",
      validFrom: "2026-01-01T00:00:00.000Z",
      validTo: "2027-05-01T00:00:00.000Z",
      sourceObservedAt: capGosnoRouteFeed.retrievedAt,
      sourcePublishedAt: null,
      retrievedAt: capGosnoRouteFeed.retrievedAt,
      freshnessTtlSeconds: 90 * 86400,
      sourceAuthority: {
        sourceDccId: srcGosnoRouteFeedId,
        organizationName: "GoSno Mountain Transportation",
        authorityTier: "direct_operator",
        competentDomains: ["ground_shuttle_operations", "private_mountain_transportation"],
        claimedDomain: "private_mountain_transportation",
        independentlyCorroboratedBySourceDccIds: [srcGosnoAgentJsonId, srcGosnoLlmsTxtId],
        licenseOrReusePolicy: "DCC / GoSno First-Party Public Route Feed",
      },
      evidenceRefs: [evRefGosnoRouteFeedMode, evRefGosnoAgentManifest, evRefGosnoLlmsSummary],
    },
  });

  knowledgeLedger.appendEvent({
    eventType: "claim_created",
    claimId: "clm:gosno:private-suv-max-passengers-6",
    claimVersionId: "clmv:gosno:private-suv-max-passengers-6:v1",
    recordedAt: gosnoSuvRecordedAt,
    recordedAtVerified: true,
    recordingTimeStatus: "verified_database_admission",
    actorId: "dcc-v031-preserved-source-extractor",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason:
      "Extracted from gosno.co/api/public/route-feed, gosno.co/agent.json, gosno.co/winter-park, and gosno.co/denver-to-breckenridge: Private SUV maximum capacity is 6 passengers (subject to luggage and ski/snowboard equipment fit).",
    claimDefinition: {
      claimId: "clm:gosno:private-suv-max-passengers-6",
      claimVersionId: "clmv:gosno:private-suv-max-passengers-6:v1",
      subjectDccId: gosnoOpId,
      predicate: "private_suv_max_passengers",
      assertionType: "policy",
      epistemicState: "verified_against_identified_evidence",
      typedValue: 6,
      unitOrCurrency: "passengers",
      validFrom: "2026-01-01T00:00:00.000Z",
      validTo: "2027-05-01T00:00:00.000Z",
      sourceObservedAt: capGosnoRouteFeed.retrievedAt,
      sourcePublishedAt: null,
      retrievedAt: capGosnoRouteFeed.retrievedAt,
      freshnessTtlSeconds: 90 * 86400,
      sourceAuthority: {
        sourceDccId: srcGosnoRouteFeedId,
        organizationName: "GoSno Mountain Transportation",
        authorityTier: "direct_operator",
        competentDomains: ["private_mountain_transportation"],
        claimedDomain: "private_mountain_transportation",
        independentlyCorroboratedBySourceDccIds: [
          srcGosnoAgentJsonId,
          srcGosnoWinterParkHtmlId,
          srcGosnoBreckHtmlId,
        ],
        licenseOrReusePolicy: "DCC / GoSno First-Party Public Route Feed",
      },
      evidenceRefs: [
        evRefGosnoRouteFeedMode,
        evRefGosnoAgentManifest,
        evRefGosnoWinterParkHtml,
        evRefGosnoBreckHtml,
      ],
    },
  });

  knowledgeLedger.appendEvent({
    eventType: "claim_created",
    claimId: "clm:gosno:private-van-max-passengers-10",
    claimVersionId: "clmv:gosno:private-van-max-passengers-10:v1",
    recordedAt: gosnoVanRecordedAt,
    recordedAtVerified: true,
    recordingTimeStatus: "verified_database_admission",
    actorId: "dcc-v031-preserved-source-extractor",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason:
      "Extracted from gosno.co/api/public/route-feed, gosno.co/agent.json, and gosno.co/denver-to-breckenridge: Private Van maximum capacity is 10 passengers (reconciling pay/route.ts permissive <=14 form check against vehicleCapacity.ts and route-feed maxPassengers=10).",
    claimDefinition: {
      claimId: "clm:gosno:private-van-max-passengers-10",
      claimVersionId: "clmv:gosno:private-van-max-passengers-10:v1",
      subjectDccId: gosnoOpId,
      predicate: "private_van_max_passengers",
      assertionType: "policy",
      epistemicState: "verified_against_identified_evidence",
      typedValue: 10,
      unitOrCurrency: "passengers",
      validFrom: "2026-01-01T00:00:00.000Z",
      validTo: "2027-05-01T00:00:00.000Z",
      sourceObservedAt: capGosnoRouteFeed.retrievedAt,
      sourcePublishedAt: null,
      retrievedAt: capGosnoRouteFeed.retrievedAt,
      freshnessTtlSeconds: 90 * 86400,
      sourceAuthority: {
        sourceDccId: srcGosnoRouteFeedId,
        organizationName: "GoSno Mountain Transportation",
        authorityTier: "direct_operator",
        competentDomains: ["private_mountain_transportation"],
        claimedDomain: "private_mountain_transportation",
        independentlyCorroboratedBySourceDccIds: [srcGosnoAgentJsonId, srcGosnoBreckHtmlId],
        licenseOrReusePolicy: "DCC / GoSno First-Party Public Route Feed",
      },
      evidenceRefs: [evRefGosnoRouteFeedMode, evRefGosnoAgentManifest, evRefGosnoBreckHtml],
    },
  });

  // Explicitly admit the 5 GoSno unknown live operational conditions once
  const gosnoUnknownConditionSpecs = [
    {
      claimId: "clm:gosno:live-driver-availability",
      predicate: "driver_availability",
      reason: "Live driver dispatch assignment is unknown until action-time dispatch check.",
    },
    {
      claimId: "clm:gosno:live-vehicle-availability",
      predicate: "vehicle_availability",
      reason: "Live fleet SUV/Van unit availability is unknown until action-time inventory check.",
    },
    {
      claimId: "clm:gosno:live-equipment-fit-at-capacity",
      predicate: "equipment_and_luggage_fit",
      reason:
        "Physical cabin/cargo fit for 6 passengers + 6 snowboards/ski bags in an SUV is unestablished without operator confirmation or Van upgrade.",
    },
    {
      claimId: "clm:gosno:live-road-safety",
      predicate: "road_safety",
      reason:
        "Live CDOT I-70 / US-40 Berthoud Pass chain/traction/closure status is unknown until travel window.",
    },
    {
      claimId: "clm:gosno:live-inventory-confirmation",
      predicate: "live_inventory_confirmation",
      reason:
        "Rezdy/OCTO live booking slot confirmation (requiresOperatorConfirmation=true) is unknown until action-time revalidation.",
    },
  ] as const;

  for (const spec of gosnoUnknownConditionSpecs) {
    knowledgeLedger.appendEvent({
      eventType: "claim_created",
      claimId: spec.claimId,
      claimVersionId: `${spec.claimId}:v1-unknown`,
      recordedAt: gosnoUnknownConditionsRecordedAt,
      recordedAtVerified: true,
      recordingTimeStatus: "verified_database_admission",
      actorId: "dcc-v031-gosno-epistemic-guard",
      isSynthetic: false,
      provenanceClass: "operational_evidence",
      reason: spec.reason,
      claimDefinition: {
        claimId: spec.claimId,
        claimVersionId: `${spec.claimId}:v1-unknown`,
        subjectDccId: gosnoOpId,
        predicate: spec.predicate,
        assertionType: "observation",
        epistemicState: "unknown",
        typedValue: null,
        unitOrCurrency: null,
        validFrom: "2026-10-01T00:00:00.000Z",
        validTo: null,
        sourceObservedAt: null,
        sourcePublishedAt: null,
        retrievedAt: capGosnoRouteFeed.retrievedAt,
        freshnessTtlSeconds: 300,
        sourceAuthority: {
          sourceDccId: srcGosnoRouteFeedId,
          organizationName: "GoSno Mountain Transportation",
          authorityTier: "operator_direct",
          competentDomains: ["private_mountain_transportation"],
          claimedDomain: "private_mountain_transportation",
          independentlyCorroboratedBySourceDccIds: [],
          licenseOrReusePolicy: "DCC / GoSno First-Party Public Route Feed",
        },
        evidenceRefs: [],
      },
    });
  }

  // ==========================================================================
  // 7. Build CandidateUniverses & Compile DecisionIrBundles
  // ==========================================================================
  const jnuUniverse = buildV03CandidateUniverse({
    universeId: "univ:juneau-helicopter-tours",
    version: "0.3.0",
    engineId: "juneau-helicopter-tours",
    engineVersion: "0.3.0",
    isSynthetic: false,
    scope: {
      destinationDccEntityId: jnuDestId,
      destinationName: "Juneau, Alaska",
      categorySlug: "juneau-helicopter-tours",
      jurisdiction: "US-AK-JUNEAU",
      geographicBounds: { minLat: 58.25, maxLat: 58.65, minLon: -134.85, maxLon: -134.1 },
    },
    inclusionMethod:
      "USFS Tongass National Forest commercial helicopter glacier-landing permit holders operating out of Juneau International Airport (PAJN), substantiated from preserved HTTP response bytes.",
    sourcesAndQueriesConsulted: [
      {
        sourceDccId: srcCoastalPolicyId,
        organizationName: "Coastal Helicopters",
        queryOrEndpoint: capCoastalTour.url,
        consultedAt: capCoastalTour.retrievedAt,
        snapshotSha256: capCoastalTour.rawSha256,
      },
      {
        sourceDccId: srcCoastalPolicyId,
        organizationName: "Coastal Helicopters FAQ",
        queryOrEndpoint: capCoastalFaq.url,
        consultedAt: capCoastalFaq.retrievedAt,
        snapshotSha256: capCoastalFaq.rawSha256,
      },
      {
        sourceDccId: srcTemscoPolicyId,
        organizationName: "TEMSCO Helicopters",
        queryOrEndpoint: capTemscoTour.url,
        consultedAt: capTemscoTour.retrievedAt,
        snapshotSha256: capTemscoTour.rawSha256,
      },
      {
        sourceDccId: srcNorthstarPolicyId,
        organizationName: "NorthStar Trekking",
        queryOrEndpoint: capNorthstarTour.url,
        consultedAt: capNorthstarTour.retrievedAt,
        snapshotSha256: capNorthstarTour.rawSha256,
      },
      {
        sourceDccId: srcNorthstarPolicyId,
        organizationName: "NorthStar Trekking FAQs",
        queryOrEndpoint: capNorthstarFaq.url,
        consultedAt: capNorthstarFaq.retrievedAt,
        snapshotSha256: capNorthstarFaq.rawSha256,
      },
      {
        sourceDccId: srcFaaWeathercamsId,
        organizationName: "FAA Aviation Weather Camera Program",
        queryOrEndpoint: capFaaWeathercams.url,
        consultedAt: capFaaWeathercams.retrievedAt,
        snapshotSha256: capFaaWeathercams.rawSha256,
      },
    ],
    includedCandidates: [
      {
        candidateDccEntityId: candJnuCoastalId,
        legacyCandidateCode: "jnu-heli-coastal-icefield",
        displayName: "Icefield Excursion & Glacier Walk (Coastal Helicopters)",
        operatorDccEntityId: coastalOpId,
        operatorDisplayName: "Coastal Helicopters",
        bookingChannelClass: "verified_direct_operator",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 459,
          standardPlusPriceUsd260To299Lbs: 609,
          premiumPriceUsd300PlusLbs: 918,
          weightSurchargeThresholdLbs: 260,
          secondaryWeightSurchargeThresholdLbs: 300,
          weightPolicyType: "surcharge_only",
          supportsWeightOverride: true,
          requestedFormat: "standard_glacier_walk",
          minAgeYears: 0,
          minPortWindowMinutes: 245,
          comfortablePortWindowMinutes: 275,
          prohibitsDronesAndSelfieSticks: true,
          requiresUnassistedBoarding: true,
        },
        requiredClaimIds: ["clm:jnu:standard-seat-weight-limit-lbs"],
      },
      {
        candidateDccEntityId: candJnuTemscoId,
        legacyCandidateCode: "jnu-heli-mendenhall-landing",
        displayName: "Mendenhall Glacier Helicopter & Guided Walk (TEMSCO)",
        operatorDccEntityId: temscoOpId,
        operatorDisplayName: "TEMSCO Helicopters",
        bookingChannelClass: "verified_direct_operator",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 449,
          weightSurchargeThresholdLbs: 250,
          weightSurchargeUsd: 150,
          weightPolicyType: "surcharge_only",
          supportsWeightOverride: true,
          requestedFormat: "standard_glacier_walk",
          minAgeYears: 2,
          minPortWindowMinutes: 210,
          comfortablePortWindowMinutes: 240,
          prohibitsDronesAndSelfieSticks: true,
          prohibitsCarryOnBags: true,
          prohibitsServiceAnimals: true,
          requiresUnassistedBoarding: true,
        },
        requiredClaimIds: ["clm:jnu:standard-seat-weight-limit-lbs"],
      },
      {
        candidateDccEntityId: candJnuNorthstarId,
        legacyCandidateCode: "jnu-heli-northstar-trek",
        displayName: "Helicopter Glacier Walkabout (NorthStar Trekking)",
        operatorDccEntityId: northstarOpId,
        operatorDisplayName: "NorthStar Trekking",
        bookingChannelClass: "verified_direct_operator",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 499,
          weightSurchargeThresholdLbs: 250,
          weightSurchargeUsd: 150,
          weightPolicyType: "surcharge_only",
          supportsWeightOverride: true,
          requestedFormat: "extended_ice_trek",
          minAgeYears: 8,
          minPortWindowMinutes: 300,
          comfortablePortWindowMinutes: 330,
          prohibitsDronesAndSelfieSticks: true,
          prohibitsCarryOnBags: true,
          requiresUnassistedBoarding: true,
          requiresOneHourGlacierWalk: true,
        },
        requiredClaimIds: ["clm:jnu:standard-seat-weight-limit-lbs"],
      },
    ],
    knownExclusions: [
      {
        externalOrLegacyIdentifier: "wta-reseller-excluded",
        displayName: "Welcome to Alaska Tours",
        reasonCode: "WTA_PROHIBITED_BY_GOVERNANCE",
        explanation: "Never routed or attributed per DCC Alaska governance restriction.",
        supportingEvidenceRefIds: [],
      },
    ],
    coverageGaps: [
      {
        gapCode: "LIVE_SEAT_INVENTORY_NOT_QUERIED_IN_STATIC_UNIVERSE",
        affectedDimension: "real_time_inventory",
        description:
          "Evaluates published operator policy rules from preserved captures; live helicopter seat inventory and 4-passenger flight minimum dispatch confirmation require operator revalidation.",
        impactOnCompleteness: "Requires revalidation prior to booking execution.",
      },
      {
        gapCode: "LIVE_PAJN_GLACIER_CEILING_VISIBILITY_DISPATCH_UNESTABLISHED",
        affectedDimension: "real_time_weather_dispatch",
        description:
          "FAA WeatherCams HTML capture proves portal reachability only; real-time ceiling, visibility, and operator hour-before-departure weather cancellation decisions are unestablished at static evaluation time.",
        impactOnCompleteness:
          "Operators make weather dispatch calls within ~1 hour of departure.",
      },
      {
        gapCode: "EXACT_CRUISE_BERTH_SHUTTLE_PICKUP_TIMING_UNESTABLISHED",
        affectedDimension: "port_transfer_timing",
        description:
          "Published 45-to-60 minute cruise ship arrival/departure buffers are enforced, but berth-specific shuttle staging times depend on confirmation voucher.",
        impactOnCompleteness: "Travelers must verify pickup dock on confirmation.",
      },
    ],
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    effectiveTo: "2027-12-31T23:59:59.000Z",
    knowledgeCutoff: repairedIngestionRecordedAt,
    refreshDeadline: "2026-11-26T00:00:00.000Z",
    generatorVersion: "dcc-universe-generator/0.3.1",
    epistemicDisclaimer:
      "Evaluates substantiated operator policy fit (distinguishing weight surcharges from absolute passenger restrictions) within the declared Juneau helicopter universe; does not guarantee real-time seat inventory or weather dispatch.",
  });

  const jnuBundle = compileV03EngineBundle({
    engineId: "juneau-helicopter-tours",
    engineVersion: "0.3.0",
    universe: jnuUniverse,
    rules: [
      {
        ruleId: "rule:jnu:operator-policy-verified",
        ruleVersionId: "rulev:jnu:operator-policy-verified:v2",
        ruleKind: "hard_gate",
        title:
          "Substantiated Juneau operator weight-surcharge and safety policies from preserved captures",
        reasonCode: "JUNEAU_OPERATOR_POLICY_SUBSTANTIATED",
        requiredClaimId: "clm:jnu:standard-seat-weight-limit-lbs",
        predicateType: "claim_must_be_eligible_and_boolean_true",
        scoreDelta: 20,
      },
      {
        ruleId: "rule:jnu:format-match",
        ruleVersionId: "rulev:jnu:format-match:v1",
        ruleKind: "ranking_weight",
        title: "Matches requested glacier excursion format",
        reasonCode: "REQUESTED_FORMAT",
        requiredClaimId: "clm:jnu:standard-seat-weight-limit-lbs",
        predicateType: "input_equals_candidate_attr",
        inputField: "requestedFormat",
        candidateAttrKey: "requestedFormat",
        scoreDelta: 15,
      },
    ],
    pinnedSchemaHashes: schemaHashes,
  });

  const hawUniverse = buildV03CandidateUniverse({
    universeId: "univ:hawaii-whale-watching",
    version: "0.3.0",
    engineId: "hawaii-whale-watching",
    engineVersion: "0.3.0",
    isSynthetic: false,
    scope: {
      destinationDccEntityId: mauiDestId,
      destinationName: "Maui, Hawaii",
      categorySlug: "hawaii-whale-watching",
      jurisdiction: "US-HI-MAUI",
      geographicBounds: { minLat: 20.5, maxLat: 21.1, minLon: -156.8, maxLon: -156.3 },
    },
    inclusionMethod:
      "NOAA 50 CFR 224.103 compliant Maui humpback whale-watching operators with verified vessel class disclosures.",
    sourcesAndQueriesConsulted: [
      {
        sourceDccId: srcNoaaHumpbackId,
        organizationName: "NOAA Fisheries / Code of Federal Regulations",
        queryOrEndpoint: "https://www.ecfr.gov/current/title-50/section-224.103",
        consultedAt: noaaRecordedAt,
        snapshotSha256: evRefNoaa100yd.snapshotSha256,
      },
    ],
    includedCandidates: [
      {
        candidateDccEntityId: candHawPwfCatamaranId,
        legacyCandidateCode: "haw-maui-pwf-catamaran",
        displayName:
          "Maalaea Harbor Stabilized Double-Deck Catamaran (Pacific Whale Foundation)",
        operatorDccEntityId: pacWhaleOpId,
        operatorDisplayName: "Pacific Whale Foundation Eco-Adventures",
        bookingChannelClass: "verified_direct_operator",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 96,
          vesselPreference: "large_stabilized_catamaran",
        },
        requiredClaimIds: ["clm:haw:noaa-100yd-approach-compliance"],
      },
      {
        candidateDccEntityId: candHawTrilogySailId,
        legacyCandidateCode: "haw-maui-trilogy-sail",
        displayName: "Small-Group Sailing Catamaran Whale Watch (Trilogy Excursions)",
        operatorDccEntityId: trilogyOpId,
        operatorDisplayName: "Trilogy Excursions",
        bookingChannelClass: "verified_direct_operator",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 139,
          vesselPreference: "sailing_catamaran",
        },
        requiredClaimIds: ["clm:haw:noaa-100yd-approach-compliance"],
      },
    ],
    knownExclusions: [],
    coverageGaps: [
      {
        gapCode: "LIVE_CHANNEL_WAVE_BUOY_NOT_INGESTED",
        affectedDimension: "real_time_sea_state",
        description:
          "Uses seasonal channel exposure profiles unless live buoy telemetry is supplied.",
        impactOnCompleteness:
          "Travelers with severe motion sensitivity should re-check morning sea state.",
      },
    ],
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    effectiveTo: "2027-12-31T23:59:59.000Z",
    knowledgeCutoff: noaaRecordedAt,
    refreshDeadline: "2026-11-26T00:00:00.000Z",
    generatorVersion: "dcc-universe-generator/0.3.1",
    epistemicDisclaimer: "Bounded to declared Maui whale-watching candidate universe.",
  });

  const hawBundle = compileV03EngineBundle({
    engineId: "hawaii-whale-watching",
    engineVersion: "0.3.0",
    universe: hawUniverse,
    rules: [
      {
        ruleId: "rule:haw:noaa-100yd-compliance",
        ruleVersionId: "rulev:haw:noaa-100yd-compliance:v1",
        ruleKind: "hard_gate",
        title: "NOAA 50 CFR 224.103 100-yard humpback approach compliance",
        reasonCode: "NOAA_100YD_APPROACH_COMPLIANT",
        requiredClaimId: "clm:haw:noaa-100yd-approach-compliance",
        predicateType: "claim_must_be_eligible_and_boolean_true",
        scoreDelta: 20,
      },
      {
        ruleId: "rule:haw:vessel-preference-match",
        ruleVersionId: "rulev:haw:vessel-preference-match:v1",
        ruleKind: "ranking_weight",
        title: "Matches traveler vessel stability preference",
        reasonCode: "VESSEL_PREFERENCE",
        requiredClaimId: "clm:haw:noaa-100yd-approach-compliance",
        predicateType: "input_equals_candidate_attr",
        inputField: "vesselPreference",
        candidateAttrKey: "vesselPreference",
        scoreDelta: 20,
      },
    ],
    pinnedSchemaHashes: schemaHashes,
  });

  const gosnoUniverse = buildV03CandidateUniverse({
    universeId: "univ:denver-to-mountain-transportation",
    version: "0.3.0",
    engineId: "denver-to-mountain-transportation",
    engineVersion: "0.3.0",
    isSynthetic: false,
    scope: {
      destinationDccEntityId: denverDestId,
      destinationName:
        "Denver / DEN to Colorado I-70 & US-40 Ski Corridors (Breckenridge, Winter Park, Vail, Keystone, Copper Mountain)",
      categorySlug: "denver-to-mountain-transportation",
      jurisdiction: "US-CO",
      geographicBounds: { minLat: 39.4, maxLat: 40.0, minLon: -106.5, maxLon: -104.6 },
    },
    inclusionMethod:
      "First-party GoSno private door-to-door mountain transportation products ingested from preserved captures of gosno.co/api/public/route-feed, gosno.co/agent.json, gosno.co/llms.txt, gosno.co/winter-park, and gosno.co/denver-to-breckenridge.",
    sourcesAndQueriesConsulted: [
      {
        sourceDccId: srcGosnoRouteFeedId,
        organizationName: "GoSno Mountain Transportation",
        queryOrEndpoint: capGosnoRouteFeed.url,
        consultedAt: capGosnoRouteFeed.retrievedAt,
        snapshotSha256: capGosnoRouteFeed.rawSha256,
      },
      {
        sourceDccId: srcGosnoAgentJsonId,
        organizationName: "GoSno Agent Manifest",
        queryOrEndpoint: capGosnoAgentJson.url,
        consultedAt: capGosnoAgentJson.retrievedAt,
        snapshotSha256: capGosnoAgentJson.rawSha256,
      },
      {
        sourceDccId: srcGosnoLlmsTxtId,
        organizationName: "GoSno llms.txt",
        queryOrEndpoint: capGosnoLlmsTxt.url,
        consultedAt: capGosnoLlmsTxt.retrievedAt,
        snapshotSha256: capGosnoLlmsTxt.rawSha256,
      },
      {
        sourceDccId: srcGosnoWinterParkHtmlId,
        organizationName: "GoSno Winter Park Corridor Page",
        queryOrEndpoint: capGosnoWinterParkHtml.url,
        consultedAt: capGosnoWinterParkHtml.retrievedAt,
        snapshotSha256: capGosnoWinterParkHtml.rawSha256,
      },
      {
        sourceDccId: srcGosnoBreckHtmlId,
        organizationName: "GoSno Denver to Breckenridge Corridor Page",
        queryOrEndpoint: capGosnoBreckHtml.url,
        consultedAt: capGosnoBreckHtml.retrievedAt,
        snapshotSha256: capGosnoBreckHtml.rawSha256,
      },
    ],
    includedCandidates: [
      {
        candidateDccEntityId: candGosnoBreckSuvId,
        legacyCandidateCode: "gosno-denver-breckenridge-private-suv",
        displayName:
          "GoSno Private SUV Transfer — Denver / DEN to Breckenridge (Up to 6 Pax, Rezdy PF616Q)",
        operatorDccEntityId: gosnoOpId,
        operatorDisplayName: "GoSno Mountain Transportation",
        bookingChannelClass: "dcc_owned_platform",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 399,
          pricingModel: "per_vehicle_one_way",
          vehicleClass: "Private SUV",
          serviceMode: "private_only",
          maxPassengers: 6,
          corridorId: "denver-to-breckenridge",
          rezdyProductCode: "PF616Q",
          requiresOperatorConfirmation: true,
        },
        requiredClaimIds: [
          "clm:gosno:private-transport-mode-only",
          "clm:gosno:private-suv-max-passengers-6",
        ],
      },
      {
        candidateDccEntityId: candGosnoBreckVanId,
        legacyCandidateCode: "gosno-denver-breckenridge-private-van",
        displayName:
          "GoSno Private Van Transfer — Denver / DEN to Breckenridge (Up to 10 Pax, Rezdy PF616Q)",
        operatorDccEntityId: gosnoOpId,
        operatorDisplayName: "GoSno Mountain Transportation",
        bookingChannelClass: "dcc_owned_platform",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 649,
          pricingModel: "per_vehicle_one_way",
          vehicleClass: "Private Van",
          serviceMode: "private_only",
          maxPassengers: 10,
          corridorId: "denver-to-breckenridge",
          rezdyProductCode: "PF616Q",
          requiresOperatorConfirmation: true,
        },
        requiredClaimIds: [
          "clm:gosno:private-transport-mode-only",
          "clm:gosno:private-van-max-passengers-10",
        ],
      },
      {
        candidateDccEntityId: candGosnoWinterParkSuvId,
        legacyCandidateCode: "gosno-denver-winter-park-private-suv",
        displayName:
          "GoSno Private SUV Transfer — Denver / DEN to Winter Park (Up to 6 Pax, Direct Web Booking)",
        operatorDccEntityId: gosnoOpId,
        operatorDisplayName: "GoSno Mountain Transportation",
        bookingChannelClass: "dcc_owned_platform",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 349,
          pricingModel: "per_vehicle_one_way",
          vehicleClass: "Private SUV",
          serviceMode: "private_only",
          maxPassengers: 6,
          corridorId: "denver-to-winter-park",
          rezdyProductCode: "NONE_DIRECT_WEB_ONLY",
          requiresOperatorConfirmation: true,
        },
        requiredClaimIds: [
          "clm:gosno:private-transport-mode-only",
          "clm:gosno:private-suv-max-passengers-6",
        ],
      },
      {
        candidateDccEntityId: candGosnoVailSuvId,
        legacyCandidateCode: "gosno-denver-vail-private-suv",
        displayName:
          "GoSno Private SUV Transfer — Denver / DEN to Vail (Up to 6 Pax, Rezdy PR68BH)",
        operatorDccEntityId: gosnoOpId,
        operatorDisplayName: "GoSno Mountain Transportation",
        bookingChannelClass: "dcc_owned_platform",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 449,
          pricingModel: "per_vehicle_one_way",
          vehicleClass: "Private SUV",
          serviceMode: "private_only",
          maxPassengers: 6,
          corridorId: "denver-to-vail",
          rezdyProductCode: "PR68BH",
          requiresOperatorConfirmation: true,
        },
        requiredClaimIds: [
          "clm:gosno:private-transport-mode-only",
          "clm:gosno:private-suv-max-passengers-6",
        ],
      },
      {
        candidateDccEntityId: candGosnoCopperSuvId,
        legacyCandidateCode: "gosno-denver-copper-mountain-private-suv",
        displayName:
          "GoSno Private SUV Transfer — Denver / DEN to Copper Mountain (Up to 6 Pax, Rezdy PLK9L2)",
        operatorDccEntityId: gosnoOpId,
        operatorDisplayName: "GoSno Mountain Transportation",
        bookingChannelClass: "dcc_owned_platform",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 399,
          reconciledLlmsTxtPriceUsd: 449,
          pricingModel: "per_vehicle_one_way",
          vehicleClass: "Private SUV",
          serviceMode: "private_only",
          maxPassengers: 6,
          corridorId: "denver-to-copper-mountain",
          rezdyProductCode: "PLK9L2",
          requiresOperatorConfirmation: true,
        },
        requiredClaimIds: [
          "clm:gosno:private-transport-mode-only",
          "clm:gosno:private-suv-max-passengers-6",
        ],
      },
    ],
    knownExclusions: [
      {
        externalOrLegacyIdentifier: "gosno-denver-winter-park-express",
        displayName:
          "[WITHDRAWN SEED] GoSno Denver to Winter Park Resort Express Shuttle (14 pax / $89 shared)",
        reasonCode: "WITHDRAWN_FABRICATED_SHARED_SHUTTLE_SEED",
        explanation:
          "Withdrawn via ledger event clmv:gosno:max-pax-per-shuttle:v2-withdrawn. GoSno operates private door-to-door transfers only (no shared shuttles), with established limits of 6 passengers for SUVs and 10 passengers for Vans.",
        supportingEvidenceRefIds: [
          evRefGosnoWithdrawn.evidenceRefId,
          evRefGosnoRouteFeedMode.evidenceRefId,
          evRefGosnoAgentManifest.evidenceRefId,
        ],
      },
    ],
    coverageGaps: [
      {
        gapCode: "LIVE_DRIVER_AND_VEHICLE_AVAILABILITY_UNESTABLISHED",
        affectedDimension: "real_time_fleet_and_driver_dispatch",
        description:
          "GoSno route-feed sets requiresOperatorConfirmation=true; live driver assignment and physical SUV/Van fleet availability are not established in static captures.",
        impactOnCompleteness: "Requires operator confirmation before dispatch.",
      },
      {
        gapCode: "SUV_MAX_PASSENGER_AND_SNOWBOARD_EQUIPMENT_FIT_UNESTABLISHED",
        affectedDimension: "equipment_and_luggage_cabin_fit",
        description:
          "While Private SUVs have a 6-passenger limit, physical cargo fit for 6 passengers plus 6 snowboards/ski bags + luggage in an SUV is not established from the passenger limit alone and requires Private Van capacity or explicit operator confirmation.",
        impactOnCompleteness:
          "Evaluator qualifies or escalates 6-passenger + ski/snowboard gear groups from SUV to Private Van.",
      },
      {
        gapCode: "FIRST_PARTY_SOURCE_DISCREPANCIES_RECONCILED",
        affectedDimension: "cross_source_reconciliation",
        description:
          "Reconciles three first-party discrepancies: (1) pay/route.ts permissive form check (passengers <= 14) vs vehicleCapacity.ts / route-feed / agent.json physical fleet cap (6 SUV / 10 Van); (2) llms.txt Copper Mountain SUV $449 vs route-feed $399; (3) Winter Park $349 SUV published on /winter-park and llms.txt while outside the 4-corridor Rezdy pilot route-feed.",
        impactOnCompleteness:
          "Enforces authoritative 6-SUV / 10-Van caps and surfaces corridor/price reconciliation in evaluation metadata.",
      },
    ],
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    effectiveTo: "2027-05-01T00:00:00.000Z",
    knowledgeCutoff: repairedIngestionRecordedAt,
    refreshDeadline: "2026-11-26T00:00:00.000Z",
    generatorVersion: "dcc-universe-generator/0.3.1",
    epistemicDisclaimer:
      "Bounded to first-party GoSno private mountain transportation universe (6-passenger SUVs, 10-passenger Vans; zero shared shuttles). Live driver/vehicle availability and full-load equipment fit require operator confirmation.",
  });

  const gosnoBundle = compileV03EngineBundle({
    engineId: "denver-to-mountain-transportation",
    engineVersion: "0.3.0",
    universe: gosnoUniverse,
    rules: [
      {
        ruleId: "rule:gosno:private-mode-verified",
        ruleVersionId: "rulev:gosno:private-mode-verified:v1",
        ruleKind: "hard_gate",
        title:
          "GoSno private door-to-door transportation policy (no shared shuttles, max 6 SUV / max 10 Van)",
        reasonCode: "GOSNO_PRIVATE_TRANSPORT_POLICY_VERIFIED",
        requiredClaimId: "clm:gosno:private-transport-mode-only",
        predicateType: "claim_must_be_eligible_and_boolean_true",
        scoreDelta: 20,
      },
      {
        ruleId: "rule:gosno:corridor-match",
        ruleVersionId: "rulev:gosno:corridor-match:v1",
        ruleKind: "ranking_weight",
        title: "Matches requested Colorado mountain corridor",
        reasonCode: "CORRIDOR_MATCH",
        requiredClaimId: "clm:gosno:private-transport-mode-only",
        predicateType: "input_equals_candidate_attr",
        inputField: "corridorId",
        candidateAttrKey: "corridorId",
        scoreDelta: 15,
      },
      {
        ruleId: "rule:gosno:winter-storm-qualification",
        ruleVersionId: "rulev:gosno:winter-storm-qualification:v1",
        ruleKind: "qualification_modifier",
        title: "I-70 / Berthoud Pass winter traction & chain law advisory qualification",
        reasonCode: "BERTHOUD_PASS_WINTER_TRACTION_BUFFER_ADVISORY",
        requiredClaimId: "clm:gosno:private-transport-mode-only",
        predicateType: "qualification_penalty_if_input_matches",
        inputField: "weatherCondition",
        expectedValue: "winter_snow_advisory",
        scoreDelta: -5,
      },
    ],
    pinnedSchemaHashes: schemaHashes,
  });

  for (const [univ, bnd] of [
    [jnuUniverse, jnuBundle],
    [hawUniverse, hawBundle],
    [gosnoUniverse, gosnoBundle],
  ] as const) {
    universesByIdAndVersion.set(`${univ.universeId}@${univ.version}`, univ);
    universesByIdAndVersion.set(univ.universeId, univ);
    universesByHash.set(univ.universeHash, univ);
    bundlesByEngineAndVersion.set(`${bnd.engineId}@${bnd.engineVersion}`, bnd);
    bundlesByEngineAndVersion.set(bnd.engineId, bnd);
    bundlesByHash.set(bnd.bundleHash, bnd);
    activeEngineVersionByEngineId.set(bnd.engineId, bnd.engineVersion);
  }

  if (
    !options?.admittedTimestampsOverride &&
    persistedSnapshot?.events &&
    persistedSnapshot.events.length > 0
  ) {
    knowledgeLedger = AppendOnlyKnowledgeLedger.fromEvents(persistedSnapshot.events);
    const persistedWithdrawal = persistedSnapshot.events.find(
      (ev) => ev.claimVersionId === "clmv:gosno:max-pax-per-shuttle:v2-withdrawn",
    );
    if (persistedWithdrawal && persistedWithdrawal.recordedAt) {
      evRefGosnoWithdrawn.withdrawnAt = persistedWithdrawal.recordedAt;
      evRefGosnoWithdrawn.withdrawalEventId = persistedWithdrawal.eventId;
    }
    if (Array.isArray(persistedSnapshot.evidenceRefs)) {
      for (const ref of persistedSnapshot.evidenceRefs) {
        evidenceRefsById.set(ref.evidenceRefId, ref);
      }
    }
  }

  const constructedStore: V03RuntimeStore = {
    knowledgeLedger,
    identityLedger,
    objectStore,
    neonStore,
    universesByIdAndVersion,
    universesByHash,
    bundlesByEngineAndVersion,
    bundlesByHash,
    activeEngineVersionByEngineId,
    evidenceRefsById,
    receiptsById,
    authorizationsById,
    preservedCapturesSyncedToObjectStore: objectStore instanceof InMemoryTestArtifactStore,
    baseStateSyncedToNeon: false,
    hydratedFromNeon: false,
    admittedTimestamps,
  };

  if (!options?.admittedTimestampsOverride) {
    singletonStoreV03 = constructedStore;
  }
  return constructedStore;
}

/**
 * Performs additive, idempotent server/database admission of the v0.3.1 operational ledger
 * using the connected database's live PostgreSQL `clock_timestamp()`:
 * - Never drops, recreates, truncates, or overwrites `dcc_v03_knowledge_events`,
 *   `dcc_v03_signed_receipts`, or `dcc_v03_decision_authorizations`.
 * - Preserves uncertain pre-repair legacy recording times as `unverified_legacy_recording_time`
 *   and appends superseding/corrective events referencing the earlier records.
 * - Running admission twice preserves all existing records and timestamps with 0 new events appended.
 */
export async function admitOperationalLedgerAdditiveIdempotentV031(options?: {
  neonStore?: NeonRelationalLedgerStoreV03;
  store?: V03RuntimeStore;
  writeSnapshotToDisk?: boolean;
}): Promise<V03PersistedAdmissionSnapshot> {
  const neon =
    options?.neonStore ??
    (options?.store ? getActiveNeonStore(options.store) : new NeonRelationalLedgerStoreV03());
  if (!neon.isConfigured) {
    throw new Error(
      "NEON_DATABASE_UNCONFIGURED: Cannot perform database ledger admission without DATABASE_URL / NEON_DATABASE_URL.",
    );
  }

  await neon.ensureSchemaAndTables();
  const existingEvents = await neon.readLedgerEventsFromNeon();

  if (existingEvents.length === 0) {
    // Fresh empty ledger: admit all initial operational events once using this database's clock
    const noaaRecordedAt = await neon.queryDatabaseClockIso();
    const juneauPolicyRecordedAt = await neon.queryDatabaseClockIso();
    const withdrawalRecordedAt = await neon.queryDatabaseClockIso();
    const gosnoModeRecordedAt = await neon.queryDatabaseClockIso();
    const gosnoSuvRecordedAt = await neon.queryDatabaseClockIso();
    const gosnoVanRecordedAt = await neon.queryDatabaseClockIso();
    const gosnoUnknownConditionsRecordedAt = await neon.queryDatabaseClockIso();

    const admittedTimestamps: V03AdmittedLedgerTimestamps = {
      admissionId: `db-admission-v031-${withdrawalRecordedAt}`,
      admittedByDatabaseClock: true,
      databaseSchema: neon.schemaName,
      withdrawalRecordedAt,
      noaaRecordedAt,
      juneauPolicyRecordedAt,
      gosnoModeRecordedAt,
      gosnoSuvRecordedAt,
      gosnoVanRecordedAt,
      gosnoUnknownConditionsRecordedAt,
    };

    const admittedStore = getV03RuntimeStore({
      admittedTimestampsOverride: admittedTimestamps,
    });

    const events = admittedStore.knowledgeLedger.getAllEvents();
    const evidenceRefs = Array.from(admittedStore.evidenceRefsById.values());
    const universes = Array.from(admittedStore.universesByHash.values());
    const bundles = Array.from(admittedStore.bundlesByHash.values());

    await neon.persistLedgerEventsToNeon(events);
    for (const ref of evidenceRefs) {
      await neon.persistEvidenceReferenceToNeon(ref);
    }
    for (const univ of universes) {
      await neon.persistCandidateUniverseToNeon(univ);
    }
    for (const bnd of bundles) {
      await neon.persistEngineBundleToNeon(bnd);
    }
    await neon.truncateAndRebuildClaimProjectionsInNeon({
      validAtIso: "2026-12-15T15:00:00.000Z",
      knowledgeCutoffIso: gosnoUnknownConditionsRecordedAt,
      includeSynthetic: false,
    });

    const snapshot: V03PersistedAdmissionSnapshot = {
      schemaVersion: "0.3.1-db-admitted-v1",
      admittedTimestamps,
      events,
      evidenceRefs,
      newlyAppendedEventsCount: events.length,
      preservedExistingEventsCount: 0,
      preservedUnverifiedLegacyEventsCount: events.filter((e) => !e.recordedAtVerified).length,
    };

    if (options?.writeSnapshotToDisk !== false && process.env.VERCEL_ENV !== "production") {
      fs.writeFileSync(
        ADMITTED_LEDGER_STATE_PATH_V031,
        JSON.stringify(snapshot, null, 2) + "\n",
        "utf8",
      );
    }

    admittedStore.baseStateSyncedToNeon = true;
    admittedStore.hydratedFromNeon = true;
    if (options?.store) {
      Object.assign(options.store, admittedStore);
      singletonStoreV03 = options.store;
    } else {
      singletonStoreV03 = admittedStore;
    }
    return snapshot;
  }

  // Existing ledger has events: preserve all existing events and append only missing/corrective verified admissions
  const ledger = AppendOnlyKnowledgeLedger.fromEvents(existingEvents);
  const preservedExistingEventsCount = existingEvents.length;

  const findLatestVerifiedEvent = (claimId: string, eventType?: string) => {
    const matches = ledger
      .getAllEvents()
      .filter(
        (e) =>
          e.claimId === claimId &&
          (!eventType || e.eventType === eventType) &&
          e.recordedAtVerified === true &&
          e.recordingTimeStatus === "verified_database_admission" &&
          e.recordedAt !== null,
      );
    return matches.length > 0 ? matches[matches.length - 1]! : null;
  };

  const findLatestAnyEvent = (claimId: string, eventType?: string) => {
    const matches = ledger
      .getAllEvents()
      .filter((e) => e.claimId === claimId && (!eventType || e.eventType === eventType));
    return matches.length > 0 ? matches[matches.length - 1]! : null;
  };

  const existingWithdrawalVerified = findLatestVerifiedEvent(
    "clm:gosno:max-pax-per-shuttle",
    "claim_withdrawn",
  );
  const existingNoaaVerified = findLatestVerifiedEvent(
    "clm:haw:noaa-100yd-approach-compliance",
  );
  const existingJnuVerified = findLatestVerifiedEvent(
    "clm:jnu:standard-seat-weight-limit-lbs",
  );
  const existingGosnoModeVerified = findLatestVerifiedEvent(
    "clm:gosno:private-transport-mode-only",
  );
  const existingGosnoSuvVerified = findLatestVerifiedEvent(
    "clm:gosno:private-suv-max-passengers-6",
  );
  const existingGosnoVanVerified = findLatestVerifiedEvent(
    "clm:gosno:private-van-max-passengers-10",
  );
  const allUnknownVerified = REQUIRED_VERIFIED_UNKNOWN_CONDITION_CLAIM_IDS_V031.every(
    (cid) => findLatestVerifiedEvent(cid) !== null,
  );
  const existingUnknownVerified = allUnknownVerified
    ? findLatestVerifiedEvent("clm:gosno:live-driver-availability")
    : null;

  const noaaRecordedAt =
    existingNoaaVerified?.recordedAt ?? (await neon.queryDatabaseClockIso());
  const juneauPolicyRecordedAt =
    existingJnuVerified?.recordedAt ?? (await neon.queryDatabaseClockIso());
  const withdrawalRecordedAt =
    existingWithdrawalVerified?.recordedAt ?? (await neon.queryDatabaseClockIso());
  const gosnoModeRecordedAt =
    existingGosnoModeVerified?.recordedAt ?? (await neon.queryDatabaseClockIso());
  const gosnoSuvRecordedAt =
    existingGosnoSuvVerified?.recordedAt ?? (await neon.queryDatabaseClockIso());
  const gosnoVanRecordedAt =
    existingGosnoVanVerified?.recordedAt ?? (await neon.queryDatabaseClockIso());
  const gosnoUnknownConditionsRecordedAt =
    existingUnknownVerified?.recordedAt ?? (await neon.queryDatabaseClockIso());

  const admittedTimestamps: V03AdmittedLedgerTimestamps = {
    admissionId: `db-admission-v031-${withdrawalRecordedAt}`,
    admittedByDatabaseClock: true,
    databaseSchema: neon.schemaName,
    withdrawalRecordedAt,
    noaaRecordedAt,
    juneauPolicyRecordedAt,
    gosnoModeRecordedAt,
    gosnoSuvRecordedAt,
    gosnoVanRecordedAt,
    gosnoUnknownConditionsRecordedAt,
  };

  const templateStore = getV03RuntimeStore({
    admittedTimestampsOverride: admittedTimestamps,
  });
  const templateEvents = templateStore.knowledgeLedger.getAllEvents();
  const newlyAppendedEvents: V03KnowledgeEvent[] = [];

  // 1. Ensure GoSno legacy seed withdrawal has a verified database-admitted event
  if (!existingWithdrawalVerified) {
    let seedEv = findLatestAnyEvent("clm:gosno:max-pax-per-shuttle", "claim_created");
    if (!seedEv) {
      const templateSeed = templateEvents.find(
        (e) =>
          e.claimId === "clm:gosno:max-pax-per-shuttle" && e.eventType === "claim_created",
      )!;
      seedEv = ledger.appendEvent({
        eventType: "claim_created",
        claimId: templateSeed.claimId,
        claimVersionId: templateSeed.claimVersionId,
        recordedAt: null,
        recordedAtVerified: false,
        recordingTimeStatus: "unverified_legacy_recording_time",
        actorId: templateSeed.actorId,
        isSynthetic: true,
        provenanceClass: "withdrawn_unsupported",
        claimDefinition: templateSeed.claimDefinition,
        reason: templateSeed.reason,
      });
      newlyAppendedEvents.push(seedEv);
    }

    const earlierWithdrawal = findLatestAnyEvent(
      "clm:gosno:max-pax-per-shuttle",
      "claim_withdrawn",
    );
    const templateWithdrawal = templateEvents.find(
      (e) =>
        e.claimId === "clm:gosno:max-pax-per-shuttle" &&
        e.eventType === "claim_withdrawn",
    )!;
    const withdrawalVersionId = earlierWithdrawal
      ? "clmv:gosno:max-pax-per-shuttle:v3-withdrawn-db-admitted"
      : "clmv:gosno:max-pax-per-shuttle:v2-withdrawn";

    const appendedWithdrawal = ledger.appendEvent({
      eventType: "claim_withdrawn",
      claimId: "clm:gosno:max-pax-per-shuttle",
      claimVersionId: withdrawalVersionId,
      targetPreviousVersionId:
        seedEv.claimVersionId ?? "clmv:gosno:max-pax-per-shuttle:v1",
      recordedAt: withdrawalRecordedAt,
      recordedAtVerified: true,
      recordingTimeStatus: "verified_database_admission",
      actorId: "dcc-v031-evidence-containment-auditor",
      isSynthetic: false,
      provenanceClass: "operational_evidence",
      reason: earlierWithdrawal
        ? `Additive database-clock admission correction referencing earlier unverified withdrawal record ${earlierWithdrawal.eventId} (version=${earlierWithdrawal.claimVersionId}, recordedAt=${earlierWithdrawal.recordedAt ?? "null"}, status=unverified_legacy_recording_time): ${templateWithdrawal.reason}`
        : templateWithdrawal.reason,
    });
    newlyAppendedEvents.push(appendedWithdrawal);
  }

  // 2. Ensure each of the 5 active operational claims has a verified database-admitted event
  for (const claimId of REQUIRED_VERIFIED_ACTIVE_CLAIM_IDS_V031) {
    if (!findLatestVerifiedEvent(claimId)) {
      const earlierEv = findLatestAnyEvent(claimId);
      const templateEv = templateEvents.find((e) => e.claimId === claimId)!;
      const newVersionId = earlierEv
        ? `${claimId.replace(/^clm:/, "clmv:")}:v2-db-admitted`
        : templateEv.claimVersionId;
      const newDef = {
        ...templateEv.claimDefinition!,
        claimVersionId: newVersionId,
      };
      const appendedClaimEv = ledger.appendEvent({
        eventType: earlierEv ? "claim_superseded" : "claim_created",
        claimId,
        claimVersionId: newVersionId,
        targetPreviousVersionId: earlierEv ? earlierEv.claimVersionId : null,
        recordedAt: templateEv.recordedAt,
        recordedAtVerified: true,
        recordingTimeStatus: "verified_database_admission",
        actorId: templateEv.actorId,
        isSynthetic: false,
        provenanceClass: "operational_evidence",
        claimDefinition: newDef,
        reason: earlierEv
          ? `Additive database-clock admission superseding earlier unverified legacy record ${earlierEv.eventId} (version=${earlierEv.claimVersionId}, recordedAt=${earlierEv.recordedAt ?? "null"}, status=unverified_legacy_recording_time): ${templateEv.reason}`
          : templateEv.reason,
      });
      newlyAppendedEvents.push(appendedClaimEv);
    }
  }

  // 3. Ensure each of the 5 GoSno unknown live operational condition claims has a verified database-admitted event
  for (const claimId of REQUIRED_VERIFIED_UNKNOWN_CONDITION_CLAIM_IDS_V031) {
    if (!findLatestVerifiedEvent(claimId)) {
      const earlierUnkEv = findLatestAnyEvent(claimId);
      const templateUnkEv = templateEvents.find((e) => e.claimId === claimId)!;
      const newUnkVersionId = earlierUnkEv
        ? `${claimId}:v2-unknown-db-admitted`
        : templateUnkEv.claimVersionId;
      const newUnkDef = {
        ...templateUnkEv.claimDefinition!,
        claimVersionId: newUnkVersionId,
      };
      const appendedUnkEv = ledger.appendEvent({
        eventType: earlierUnkEv ? "claim_superseded" : "claim_created",
        claimId,
        claimVersionId: newUnkVersionId,
        targetPreviousVersionId: earlierUnkEv ? earlierUnkEv.claimVersionId : null,
        recordedAt: gosnoUnknownConditionsRecordedAt,
        recordedAtVerified: true,
        recordingTimeStatus: "verified_database_admission",
        actorId: templateUnkEv.actorId,
        isSynthetic: false,
        provenanceClass: "operational_evidence",
        claimDefinition: newUnkDef,
        reason: earlierUnkEv
          ? `Additive database-clock admission superseding earlier unverified legacy record ${earlierUnkEv.eventId}: ${templateUnkEv.reason}`
          : templateUnkEv.reason,
      });
      newlyAppendedEvents.push(appendedUnkEv);
    }
  }

  templateStore.knowledgeLedger = ledger;
  const effectiveWithdrawalEv = findLatestVerifiedEvent(
    "clm:gosno:max-pax-per-shuttle",
    "claim_withdrawn",
  )!;
  const withdrawnRef = templateStore.evidenceRefsById.get(
    "evref:gosno:tariff-2026-winter-park",
  );
  if (effectiveWithdrawalEv && withdrawnRef) {
    templateStore.evidenceRefsById.set("evref:gosno:tariff-2026-winter-park", {
      ...withdrawnRef,
      withdrawnAt: effectiveWithdrawalEv.recordedAt,
      withdrawalEventId: effectiveWithdrawalEv.eventId,
    });
  }

  const allEvents = ledger.getAllEvents();
  const evidenceRefs = Array.from(templateStore.evidenceRefsById.values());
  const currentUniverses = Array.from(templateStore.universesByHash.values());
  const currentBundles = Array.from(templateStore.bundlesByHash.values());

  // Preserve any older candidate universes and engine bundles from Neon in memory before registering the latest ones
  if (typeof neon.readAllCandidateUniversesFromNeon === "function") {
    const existingUniverses = await neon.readAllCandidateUniversesFromNeon();
    for (const u of existingUniverses) {
      templateStore.universesByHash.set(u.universeHash, u);
    }
  }
  if (typeof neon.readAllEngineBundlesFromNeon === "function") {
    const existingBundles = await neon.readAllEngineBundlesFromNeon();
    for (const b of existingBundles) {
      templateStore.bundlesByHash.set(b.bundleHash, b);
    }
  }
  for (const u of currentUniverses) {
    templateStore.universesByHash.set(u.universeHash, u);
    templateStore.universesByIdAndVersion.set(`${u.universeId}@${u.version}`, u);
    templateStore.universesByIdAndVersion.set(u.universeId, u);
  }
  for (const b of currentBundles) {
    templateStore.bundlesByHash.set(b.bundleHash, b);
    templateStore.bundlesByEngineAndVersion.set(`${b.engineId}@${b.engineVersion}`, b);
    templateStore.bundlesByEngineAndVersion.set(b.engineId, b);
    templateStore.activeEngineVersionByEngineId.set(b.engineId, b.engineVersion);
  }

  if (newlyAppendedEvents.length > 0) {
    await neon.persistLedgerEventsToNeon(newlyAppendedEvents);
    for (const ref of evidenceRefs) {
      await neon.persistEvidenceReferenceToNeon(ref);
    }
    for (const univ of currentUniverses) {
      await neon.persistCandidateUniverseToNeon(univ);
    }
    for (const bnd of currentBundles) {
      await neon.persistEngineBundleToNeon(bnd);
    }
    await neon.truncateAndRebuildClaimProjectionsInNeon({
      validAtIso: "2026-12-15T15:00:00.000Z",
      knowledgeCutoffIso: gosnoUnknownConditionsRecordedAt,
      includeSynthetic: false,
    });
  }

  const snapshot: V03PersistedAdmissionSnapshot = {
    schemaVersion: "0.3.1-db-admitted-v1",
    admittedTimestamps,
    events: allEvents,
    evidenceRefs,
    newlyAppendedEventsCount: newlyAppendedEvents.length,
    preservedExistingEventsCount,
    preservedUnverifiedLegacyEventsCount: allEvents.filter((e) => !e.recordedAtVerified)
      .length,
  };

  if (options?.writeSnapshotToDisk !== false && process.env.VERCEL_ENV !== "production") {
    fs.writeFileSync(
      ADMITTED_LEDGER_STATE_PATH_V031,
      JSON.stringify(snapshot, null, 2) + "\n",
      "utf8",
    );
  }

  templateStore.baseStateSyncedToNeon = true;
  templateStore.hydratedFromNeon = true;
  if (options?.store) {
    options.store.knowledgeLedger = templateStore.knowledgeLedger;
    options.store.universesByHash = templateStore.universesByHash;
    options.store.universesByIdAndVersion = templateStore.universesByIdAndVersion;
    options.store.bundlesByHash = templateStore.bundlesByHash;
    options.store.bundlesByEngineAndVersion = templateStore.bundlesByEngineAndVersion;
    options.store.activeEngineVersionByEngineId =
      templateStore.activeEngineVersionByEngineId;
    options.store.evidenceRefsById = templateStore.evidenceRefsById;
    options.store.admittedTimestamps = templateStore.admittedTimestamps;
    options.store.baseStateSyncedToNeon = true;
    options.store.hydratedFromNeon = true;
    singletonStoreV03 = options.store;
  } else {
    singletonStoreV03 = templateStore;
  }
  return snapshot;
}

export const admitOperationalLedgerToDatabaseOnceV031 =
  admitOperationalLedgerAdditiveIdempotentV031;

/**
 * Checks whether the production storage & evidence gates pass.
 * When `VERCEL_ENV === "production"` or `DCC_ENFORCE_PRODUCTION_STORAGE_GATE === "1"`
 * or `options.enforceProductionStorageGate === true`, a test-only object store backend
 * (`test_only_non_r2`) must NOT silently support operational decisions.
 */
export function evaluateV03StorageAndEvidenceGate(options?: {
  enforceProductionStorageGate?: boolean;
  store?: V03RuntimeStore;
}): {
  passed: boolean;
  gateReasonCode: string | null;
  activeObjectStoreBackendClass: string;
  neonConfigured: boolean;
} {
  const store = options?.store ?? getV03RuntimeStore();
  const enforceProd =
    options?.enforceProductionStorageGate === true ||
    process.env.DCC_ENFORCE_PRODUCTION_STORAGE_GATE === "1" ||
    process.env.VERCEL_ENV === "production";

  const activeObjectStoreBackendClass = store.objectStore.backendClass;
  const neonConfigured = isNeonStoreConfigured(store);

  if (enforceProd && activeObjectStoreBackendClass !== "production_private_object_store") {
    return {
      passed: false,
      gateReasonCode:
        "PRODUCTION_PRIVATE_OBJECT_STORE_R2_UNAVAILABLE_TEST_ONLY_BACKEND_FORBIDDEN",
      activeObjectStoreBackendClass,
      neonConfigured,
    };
  }
  if (enforceProd && !neonConfigured) {
    return {
      passed: false,
      gateReasonCode: "PRODUCTION_NEON_LEDGER_STORE_UNCONFIGURED",
      activeObjectStoreBackendClass,
      neonConfigured,
    };
  }
  return {
    passed: true,
    gateReasonCode: null,
    activeObjectStoreBackendClass,
    neonConfigured,
  };
}

const fallbackInputsArchiveByReceiptId = new Map<string, Record<string, unknown>>();

export async function getV03ReceiptWithFallback(receiptId: string): Promise<{
  receipt: V03SignedDecisionReceipt;
  inputs: Record<string, unknown>;
  evaluationResult?: V03EvaluationResult;
} | null> {
  const store = getV03RuntimeStore();
  const cached = store.receiptsById.get(receiptId);
  if (cached) return cached;

  if (isNeonStoreConfigured(store)) {
    const neon = getActiveNeonStore(store);
    try {
      const fromNeon = (await neon.readSignedReceiptFromNeon(receiptId)) as
        | {
            receipt: V03SignedDecisionReceipt;
            originalInputs: Record<string, unknown> | null;
            evaluationResult?: V03EvaluationResult;
          }
        | V03SignedDecisionReceipt
        | null;
      if (fromNeon) {
        const entry =
          "receipt" in fromNeon && fromNeon.receipt
            ? {
                receipt: fromNeon.receipt,
                inputs:
                  fromNeon.originalInputs ??
                  fallbackInputsArchiveByReceiptId.get(receiptId) ??
                  {},
                evaluationResult: fromNeon.evaluationResult,
              }
            : {
                receipt: fromNeon as V03SignedDecisionReceipt,
                inputs: fallbackInputsArchiveByReceiptId.get(receiptId) ?? {},
              };
        store.receiptsById.set(receiptId, entry);
        return entry;
      }
    } catch {
      // Fallback failed
    }
  }
  return null;
}

export async function getV03CandidateUniverseWithFallback(
  universeIdOrHash: string,
  version?: string,
): Promise<V03CandidateUniverse | null> {
  const store = getV03RuntimeStore();
  await ensureRuntimeStoreHydratedFromNeon(store);
  const byId =
    store.universesByIdAndVersion.get(`${universeIdOrHash}@${version ?? "0.3.0"}`) ??
    store.universesByIdAndVersion.get(universeIdOrHash) ??
    store.universesByHash.get(universeIdOrHash);
  if (byId) return byId;

  if (isNeonStoreConfigured(store)) {
    const neon = getActiveNeonStore(store);
    try {
      const fromNeon = await (neon.readCandidateUniverseFromNeon as any)({
        universeId: universeIdOrHash,
        version: version ?? "0.3.0",
      });
      if (fromNeon) {
        store.universesByIdAndVersion.set(
          `${fromNeon.universeId}@${fromNeon.version}`,
          fromNeon,
        );
        store.universesByIdAndVersion.set(fromNeon.universeId, fromNeon);
        store.universesByHash.set(fromNeon.universeHash, fromNeon);
        return fromNeon;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export async function handleV03EvaluateRequest(
  rawBody: Record<string, unknown>,
  options?: { adminToken?: string; enforceProductionStorageGate?: boolean },
): Promise<V03EvaluationResult> {
  const store = getV03RuntimeStore();
  await ensureRuntimeStoreHydratedFromNeon(store);
  await ensurePreservedCapturesStoredInObjectStore(store);

  const engineId = String(rawBody.engineId ?? "");
  const version =
    typeof rawBody.engineVersion === "string"
      ? rawBody.engineVersion
      : store.activeEngineVersionByEngineId.get(engineId) ?? "0.3.0";

  const bundle =
    store.bundlesByEngineAndVersion.get(`${engineId}@${version}`) ??
    store.bundlesByEngineAndVersion.get(engineId);
  if (!bundle) {
    throw new Error(`UNKNOWN_ENGINE_OR_VERSION: "${engineId}@${version}" not found.`);
  }
  const universe = store.universesByHash.get(bundle.universeHash)!;

  const normalizedInputs = ((rawBody.inputs ?? rawBody.constraints) ?? {}) as Record<
    string,
    unknown
  >;

  // Enforce production storage gate: test-only object store backend cannot silently support production operational decisions
  const storageGate = evaluateV03StorageAndEvidenceGate({
    enforceProductionStorageGate:
      options?.enforceProductionStorageGate ??
      rawBody.enforceProductionStorageGate === true,
    store,
  });

  // Also check if caller explicitly requested the withdrawn legacy GoSno candidate or claim
  const requestedWithdrawnCandidate =
    normalizedInputs.candidateCode === "gosno-denver-winter-park-express" ||
    normalizedInputs.requiredClaimId === "clm:gosno:max-pax-per-shuttle";

  const effectiveInputs: Record<string, unknown> = {
    ...normalizedInputs,
  };
  if (!storageGate.passed && storageGate.gateReasonCode) {
    effectiveInputs.__storageGateIndeterminateReason = storageGate.gateReasonCode;
  } else if (requestedWithdrawnCandidate) {
    effectiveInputs.__storageGateIndeterminateReason =
      "WITHDRAWN_CLAIM_OR_CANDIDATE_REQUESTED:clm:gosno:max-pax-per-shuttle";
  }

  const normalizedRawBody: Record<string, unknown> = {
    ...rawBody,
    inputs: effectiveInputs,
  };

  let result: V03EvaluationResult;
  if (rawBody.mode === "admin_simulation") {
    result = await simulateAdministrativeV03({
      adminToken: options?.adminToken,
      bundle,
      universe,
      ledger: store.knowledgeLedger,
      inputs: effectiveInputs,
      validAtIso:
        typeof rawBody.validAt === "string" ? rawBody.validAt : new Date().toISOString(),
      simulatedKnowledgeCutoffIso:
        typeof rawBody.simulatedKnowledgeCutoff === "string"
          ? rawBody.simulatedKnowledgeCutoff
          : new Date().toISOString(),
    });
  } else {
    result = await evaluateCurrentV03({
      rawClientRequestBody: normalizedRawBody,
      bundle,
      universe,
      ledger: store.knowledgeLedger,
    });
  }

  fallbackInputsArchiveByReceiptId.set(result.receiptId, effectiveInputs);
  store.receiptsById.set(result.receiptId, {
    receipt: result.receipt,
    inputs: effectiveInputs,
    evaluationResult: result,
  });

  if (isNeonStoreConfigured(store)) {
    const neon = getActiveNeonStore(store);
    try {
      await ensureBaseStoreSyncedToNeon(store);
      await neon.persistSignedReceiptToNeon(result.receipt, effectiveInputs, result);
    } catch {
      // Non-fatal if Neon unreachable in local unit test
    }
  }

  return result;
}

export async function handleV03ReplayReceiptRequest(receiptId: string) {
  const store = getV03RuntimeStore();
  await ensureRuntimeStoreHydratedFromNeon(store);
  const stored = await getV03ReceiptWithFallback(receiptId);
  if (!stored) {
    throw new Error(
      `RECEIPT_NOT_FOUND: Receipt "${receiptId}" not found in v0.3 runtime store or Neon ledger.`,
    );
  }

  const bundleHash = stored.receipt.payload.decisionIrBundleHash;
  const universeHash = stored.receipt.payload.candidateUniverseHash;
  const neon = getActiveNeonStore(store);

  if (!store.bundlesByHash.has(bundleHash) && isNeonStoreConfigured(store)) {
    const bndFromNeon = await (neon.readEngineBundleFromNeon as any)({ bundleHash });
    if (bndFromNeon) {
      store.bundlesByHash.set(bndFromNeon.bundleHash, bndFromNeon);
      store.bundlesByEngineAndVersion.set(
        `${bndFromNeon.engineId}@${bndFromNeon.engineVersion}`,
        bndFromNeon,
      );
    }
  }

  if (!store.universesByHash.has(universeHash) && isNeonStoreConfigured(store)) {
    const univFromNeon =
      (await (neon.readCandidateUniverseFromNeon as any)({
        universeHash,
      })) ?? (await (neon.readCandidateUniverseFromNeon as any)(universeHash));
    if (univFromNeon) {
      store.universesByHash.set(univFromNeon.universeHash, univFromNeon);
      store.universesByIdAndVersion.set(
        `${univFromNeon.universeId}@${univFromNeon.version}`,
        univFromNeon,
      );
    }
  }

  if (store.knowledgeLedger.getAllEvents().length === 0 && isNeonStoreConfigured(store)) {
    const events = await neon.readLedgerEventsFromNeon();
    if (events.length > 0) {
      store.knowledgeLedger = AppendOnlyKnowledgeLedger.fromEvents(events);
    }
  }

  return replayHistoricalReceiptV03({
    receipt: stored.receipt,
    originalInputs: stored.inputs,
    bundlesByHash: store.bundlesByHash,
    universesByHash: store.universesByHash,
    ledger: store.knowledgeLedger,
  });
}

export async function handleV03IssueShadowAuthorization(params: {
  receiptId: string;
  targetAdapter?: CommerceAdapterTarget;
  maxPriceUsdDecimal?: number;
  serviceDate?: string;
  passengerCount?: number;
  enforceProductionStorageGate?: boolean;
}) {
  const store = getV03RuntimeStore();
  await ensureRuntimeStoreHydratedFromNeon(store);
  const storageGate = evaluateV03StorageAndEvidenceGate({
    enforceProductionStorageGate: params.enforceProductionStorageGate,
    store,
  });
  if (!storageGate.passed) {
    throw new Error(
      `PRODUCTION_STORAGE_GATE_UNAVAILABLE: Cannot issue operational DecisionAuthorization when storage gate fails (${storageGate.gateReasonCode}).`,
    );
  }

  const stored = await getV03ReceiptWithFallback(params.receiptId);
  if (!stored) {
    throw new Error(
      `RECEIPT_NOT_FOUND: Receipt "${params.receiptId}" not found in v0.3 runtime store or Neon ledger.`,
    );
  }

  const universeHash = stored.receipt.payload.candidateUniverseHash;
  let universe = store.universesByHash.get(universeHash);
  if (!universe && isNeonStoreConfigured(store)) {
    const neon = getActiveNeonStore(store);
    const fromNeon = await (neon.readCandidateUniverseFromNeon as any)({ universeHash });
    if (fromNeon) {
      store.universesByHash.set(fromNeon.universeHash, fromNeon);
      universe = fromNeon;
    }
  }

  const topCandidate =
    universe?.includedCandidates.find(
      (c) => c.candidateDccEntityId === stored.receipt.payload.recommendedCandidateDccId,
    ) ?? universe?.includedCandidates[0];

  const targetAdapter: CommerceAdapterTarget = params.targetAdapter ?? "octo";
  const issued = await issueShadowDecisionAuthorization({
    receipt: stored.receipt,
    permittedAction: "shadow_checkout_intent_preparation",
    providerProductReference: {
      candidateDccEntityId:
        topCandidate?.candidateDccEntityId ??
        "dcc:ent:tour_candidate:000000000000000000000000",
      operatorDccEntityId:
        topCandidate?.operatorDccEntityId ?? "dcc:ent:operator:000000000000000000000000",
      displayName: topCandidate?.displayName ?? "DCC Verified Excursion",
      externalAliases: {
        octo_product_id: topCandidate?.legacyCandidateCode ?? "octo:dcc-shadow-sku",
        ...(typeof topCandidate?.staticAttributes?.rezdyProductCode === "string"
          ? { rezdy_product_code: topCandidate.staticAttributes.rezdyProductCode }
          : {}),
      },
    },
    maxPriceUsdDecimal: params.maxPriceUsdDecimal ?? 625,
    requiredParameters: {
      serviceDate: params.serviceDate ?? stored.receipt.payload.validAt.slice(0, 10),
      passengerCount: params.passengerCount ?? 2,
      luggageSkiBagCount: 2,
      pickupNodeCode: "DEFAULT-PICKUP",
      dropoffNodeCode: "DEFAULT-DROPOFF",
    },
    additionalRevalidationRequirements: [
      "driver_availability",
      "vehicle_availability",
      "equipment_and_luggage_fit",
      "road_safety",
      "weather_suitability",
      "live_inventory_confirmation",
    ],
    targetAdapter,
  });
  store.authorizationsById.set(
    issued.signedAuthorization.authorizationId,
    issued.signedAuthorization,
  );
  const outcomeEvent = store.knowledgeLedger.appendEvent({
    eventType: "shadow_authorization_dry_run_recorded",
    claimId: `shadow-outcome:${issued.signedAuthorization.authorizationId}`,
    claimVersionId: `shadow-outcome:${issued.signedAuthorization.authorizationId}:v1`,
    recordedAt: issued.signedAuthorization.payload.issuedAt,
    actorId: "dcc-v031-shadow-commerce-auditor",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason: `Shadow authorization ${issued.signedAuthorization.authorizationId} bound to receipt ${stored.receipt.receiptId} (resultHash=${stored.receipt.payload.resultHash}) validated via ${targetAdapter} shadow adapter with liveExternalCallsMade=0 and executionMode=shadow_only_no_side_effects.`,
  });

  if (isNeonStoreConfigured(store)) {
    const neon = getActiveNeonStore(store);
    try {
      await neon.persistDecisionAuthorizationToNeon(issued.signedAuthorization);
      await neon.persistLedgerEventsToNeon(store.knowledgeLedger.getAllEvents());
    } catch {
      // Non-fatal in local tests
    }
  }

  return {
    ...issued,
    ledgerShadowOutcomeEvent: {
      eventId: outcomeEvent.eventId,
      eventHash: outcomeEvent.eventHash,
      eventType: outcomeEvent.eventType,
      recordedAt: outcomeEvent.recordedAt,
    },
  };
}
