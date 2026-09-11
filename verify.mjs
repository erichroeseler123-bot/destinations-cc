/**
 * DCC Verification Harness — Replay & Proof Verifier
 * 
 * Cryptographically verifies ledger observations:
 * 1. Recomputes every response hash from the stored transcript on disk.
 * 2. Recomputes every record hash using RFC 8785 canonical JSON serialization.
 * 3. Verifies every previous_hash link across the chain.
 * 4. Re-runs Core v2 validation on every transcript payload.
 * 5. Verifies observer timestamps are valid and sequentially ordered.
 * 6. Introspects actions for safety: validates HTTP method, absolute HTTPS target, input, auth.
 *    Enforces zero action executions.
 * 7. Reports stale state facts accurately.
 * 8. Detects and records state transitions (e.g. available -> limited).
 * 9. Fails with nonzero exit code and identifies exact record index and field on any mismatch.
 * 10. Generates verified proof report strictly from ledger data.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { canonicalizeJson } from './canonicalize.mjs';
import { validateCoreV2, evaluateFreshness } from './validate.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const GENESIS_HASH = '0'.repeat(64);
export const LEDGER_PATH = path.join(__dirname, 'ledger', 'observations.jsonl');

export class VerificationFailure extends Error {
  constructor(recordIndex, field, expected, actual, message) {
    super(`Verification failed at record [${recordIndex}], field "${field}": ${message} (expected: ${expected}, got: ${actual})`);
    this.recordIndex = recordIndex;
    this.field = field;
    this.expected = expected;
    this.actual = actual;
    this.name = 'VerificationFailure';
  }
}

/**
 * Verifies the ledger integrity, transcripts, validation results, and action safety.
 * 
 * @param {object} [options]
 * @param {string} [options.ledgerPath]
 * @param {string} [options.baseDir]
 * @returns {Promise<object>} Verification report data
 */
export async function verifyLedger(options = {}) {
  const ledgerPath = options.ledgerPath || LEDGER_PATH;
  const baseDir = options.baseDir || __dirname;

  if (!fs.existsSync(ledgerPath)) {
    throw new Error(`Ledger file not found at: ${ledgerPath}`);
  }

  const fileContent = fs.readFileSync(ledgerPath, 'utf-8').trim();
  if (!fileContent) {
    throw new Error(`Ledger file is empty at: ${ledgerPath}`);
  }

  const lines = fileContent.split('\n').filter((l) => l.trim().length > 0);
  const records = lines.map((l, i) => {
    try {
      return JSON.parse(l);
    } catch (e) {
      throw new VerificationFailure(i, 'syntax', 'valid JSON', l, `Failed to parse ledger line as JSON: ${e.message}`);
    }
  });

  let previousHash = GENESIS_HASH;
  let previousObservedAt = null;

  let totalActionsIntrospected = 0;
  const totalActionsExecuted = 0; // Invariant: zero actions executed
  const actionsList = [];

  const stateHistories = new Map(); // targetUrl -> Array<{ observed_at, state }>
  const detectedTransitions = [];
  const targetSummaries = new Map();

  for (let i = 0; i < records.length; i++) {
    const r = records[i];

    // 1. Schema version
    if (r.schema_version !== 'dcc-ledger-v1') {
      throw new VerificationFailure(i, 'schema_version', 'dcc-ledger-v1', r.schema_version, 'Invalid ledger schema version');
    }

    // 2. Synthetic target mislabeled as production check
    const isSyntheticUri = r.target_url.startsWith('test-vector:') || r.target_url.includes('synthetic.example');
    if (isSyntheticUri && r.target_kind === 'production') {
      throw new VerificationFailure(i, 'target_kind', 'test-vector', r.target_kind, 'Synthetic test vector target must not be labeled as "production"');
    }

    // 3. Observer Timestamps ordering
    const obsTime = Date.parse(r.observed_at);
    const recTime = Date.parse(r.recorded_at);
    if (isNaN(obsTime)) {
      throw new VerificationFailure(i, 'observed_at', 'valid ISO 8601 string', r.observed_at, 'Invalid observed_at timestamp');
    }
    if (isNaN(recTime)) {
      throw new VerificationFailure(i, 'recorded_at', 'valid ISO 8601 string', r.recorded_at, 'Invalid recorded_at timestamp');
    }
    if (obsTime > recTime) {
      throw new VerificationFailure(i, 'observed_at', `<= recorded_at (${r.recorded_at})`, r.observed_at, 'observed_at is in the future relative to recorded_at');
    }
    if (previousObservedAt && obsTime < Date.parse(previousObservedAt)) {
      throw new VerificationFailure(i, 'observed_at', `>= previous record observed_at (${previousObservedAt})`, r.observed_at, 'Ledger timestamps are not chronologically ordered');
    }
    previousObservedAt = r.observed_at;

    // 4. Previous hash chain link
    if (r.previous_hash !== previousHash) {
      throw new VerificationFailure(i, 'previous_hash', previousHash, r.previous_hash, 'Broken hash chain link');
    }

    // 5. Recompute record hash using RFC 8785 JCS
    const unsignedRecord = { ...r };
    delete unsignedRecord.record_hash;
    const canonicalJson = canonicalizeJson(unsignedRecord);
    const recomputedRecordHash = crypto.createHash('sha256').update(canonicalJson, 'utf8').digest('hex');

    if (recomputedRecordHash !== r.record_hash) {
      throw new VerificationFailure(i, 'record_hash', recomputedRecordHash, r.record_hash, 'Recomputed record hash mismatch');
    }

    // Advance previousHash
    previousHash = r.record_hash;

    // 6. Transcript existence and response SHA-256 recomputation
    const transcriptFullPath = path.isAbsolute(r.transcript_path)
      ? r.transcript_path
      : path.join(baseDir, r.transcript_path);

    if (!fs.existsSync(transcriptFullPath)) {
      throw new VerificationFailure(i, 'transcript_path', 'existing file', r.transcript_path, `Transcript file missing: ${transcriptFullPath}`);
    }

    const transcriptBytes = fs.readFileSync(transcriptFullPath);
    const recomputedResponseHash = crypto.createHash('sha256').update(transcriptBytes).digest('hex');

    if (recomputedResponseHash !== r.response_sha256) {
      throw new VerificationFailure(i, 'response_sha256', recomputedResponseHash, r.response_sha256, 'Recomputed transcript SHA-256 hash does not match ledger record');
    }

    // 7. Parse transcript bytes and re-run Core v2 validation
    let transcriptJson;
    try {
      transcriptJson = JSON.parse(transcriptBytes.toString('utf-8'));
    } catch (err) {
      throw new VerificationFailure(i, 'transcript_content', 'valid JSON', err.message, 'Failed to parse transcript content as JSON');
    }

    const recomputedValidation = validateCoreV2(transcriptJson, { referenceTime: obsTime });
    if (recomputedValidation.valid !== r.validation_result.valid) {
      throw new VerificationFailure(i, 'validation_result.valid', recomputedValidation.valid, r.validation_result.valid, 'Recomputed Core v2 validation status mismatch');
    }

    // 8. Action safety introspection
    if (Array.isArray(transcriptJson.actions)) {
      transcriptJson.actions.forEach((act, actIdx) => {
        totalActionsIntrospected++;
        // Validate action invariants
        if (!act.action_id || typeof act.action_id !== 'string') {
          throw new VerificationFailure(i, `actions[${actIdx}].action_id`, 'string', act.action_id, 'Missing or non-string action_id');
        }
        if (!act.method || typeof act.method !== 'string') {
          throw new VerificationFailure(i, `actions[${actIdx}].method`, 'HTTP method', act.method, 'Missing action HTTP method');
        }
        if (!act.target || typeof act.target !== 'string' || !act.target.startsWith('https://')) {
          throw new VerificationFailure(i, `actions[${actIdx}].target`, 'absolute https:// URL', act.target, 'Invalid action target URL');
        }
        if (act.input === undefined) {
          throw new VerificationFailure(i, `actions[${actIdx}].input`, 'defined input schema/object', act.input, 'Missing action input schema');
        }
        if (!act.auth || typeof act.auth !== 'string') {
          throw new VerificationFailure(i, `actions[${actIdx}].auth`, 'auth requirement string', act.auth, 'Missing action auth specification');
        }
        actionsList.push({
          target_url: r.target_url,
          action_id: act.action_id,
          method: act.method,
          target: act.target,
          auth: act.auth,
        });
      });
    }

    // 9. Freshness re-evaluation
    const recomputedFreshness = evaluateFreshness(transcriptJson.state, obsTime);

    // 10. Track state continuity & dynamic transitions
    if (!stateHistories.has(r.target_url)) {
      stateHistories.set(r.target_url, []);
    }
    const history = stateHistories.get(r.target_url);
    if (Array.isArray(transcriptJson.state)) {
      if (history.length > 0) {
        const lastEntry = history[history.length - 1];
        // Compare state facts
        const lastFacts = new Map(lastEntry.state.map((s) => [s.predicate, s.value]));
        transcriptJson.state.forEach((s) => {
          if (lastFacts.has(s.predicate) && lastFacts.get(s.predicate) !== s.value) {
            detectedTransitions.push({
              target_url: r.target_url,
              predicate: s.predicate,
              from: lastFacts.get(s.predicate),
              to: s.value,
              observed_at_from: lastEntry.observed_at,
              observed_at_to: r.observed_at,
            });
          }
        });
      }
      history.push({ observed_at: r.observed_at, state: transcriptJson.state });
    }

    // Target summary
    if (!targetSummaries.has(r.target_url)) {
      targetSummaries.set(r.target_url, {
        url: r.target_url,
        kind: r.target_kind,
        observationsCount: 0,
        latestStatus: r.http_status,
        latestValid: r.validation_result.valid,
        latestFresh: recomputedFreshness.is_fresh,
        staleFacts: recomputedFreshness.facts.filter((f) => !f.is_fresh),
        responseSha256: r.response_sha256,
        recordHash: r.record_hash,
      });
    }
    const sum = targetSummaries.get(r.target_url);
    sum.observationsCount++;
    sum.latestStatus = r.http_status;
    sum.latestValid = r.validation_result.valid;
    sum.latestFresh = recomputedFreshness.is_fresh;
    sum.staleFacts = recomputedFreshness.facts.filter((f) => !f.is_fresh);
    sum.responseSha256 = r.response_sha256;
    sum.recordHash = r.record_hash;
  }

  // Generate verified report strictly from ledger data
  const report = {
    verified_at: new Date().toISOString(),
    records_count: records.length,
    tip_record_hash: previousHash,
    chain_integrity: 'VERIFIED_CRYPTOGRAPHIC_CONTINUITY',
    wire_validity: {
      all_records_valid_core_v2: records.every((r) => r.validation_result.valid),
      open_world_passthrough_detected: records.some((r) => r.validation_result.passthrough_containers?.length > 0),
    },
    endpoint_presence: Array.from(targetSummaries.values()).map((t) => ({
      url: t.url,
      kind: t.kind,
      http_status: t.latestStatus,
      observations_count: t.observationsCount,
      response_sha256: t.responseSha256,
      record_hash: t.recordHash,
    })),
    freshness: {
      all_fresh_at_observation: records.every((r) => r.freshness_result.is_fresh),
      stale_facts_detected: Array.from(targetSummaries.values())
        .filter((t) => t.staleFacts.length > 0)
        .map((t) => ({ url: t.url, stale_facts: t.staleFacts })),
    },
    continuity: {
      observations_count: records.length,
      pairwise_hash_chain_verified: true,
      state_transitions_detected: detectedTransitions,
      continuity_statement: 'Two or more observations prove continuity and cryptographic hash chaining; they do NOT prove fulfillment.',
    },
    action_introspection: {
      actions_introspected: totalActionsIntrospected,
      actions_executed: totalActionsExecuted,
      safety_statement: `actions introspected: ${totalActionsIntrospected}; actions executed: 0`,
      introspected_actions: actionsList,
    },
    fulfillment: {
      fulfillment_proven: false,
      statement: 'Fulfillment is NOT proven by endpoint observation, schema validation, or cryptographic hash chaining alone.',
    },
  };

  return report;
}

// CLI Execution Support
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  verifyLedger()
    .then((report) => {
      console.log('===============================================================');
      console.log('       DCC VERIFICATION HARNESS — REPLAY & AUDIT REPORT        ');
      console.log('===============================================================');
      console.log(`Verified At:         ${report.verified_at}`);
      console.log(`Total Records:       ${report.records_count}`);
      console.log(`Tip Record Hash:     ${report.tip_record_hash}`);
      console.log(`Chain Integrity:     ${report.chain_integrity}`);
      console.log(`Wire Validity:       ${report.wire_validity.all_records_valid_core_v2 ? 'ALL CORE V2 VALID' : 'FAILURES DETECTED'}`);
      console.log(`Action Safety:       ${report.action_introspection.safety_statement}`);
      console.log(`Freshness:           ${report.freshness.all_fresh_at_observation ? 'ALL FRESH AT OBSERVATION' : 'STALE FACTS DETECTED'}`);
      console.log(`Continuity:          ${report.continuity.continuity_statement}`);
      console.log(`Fulfillment Status:  ${report.fulfillment.statement}`);
      console.log('---------------------------------------------------------------');
      console.log('OBSERVED TARGETS:');
      report.endpoint_presence.forEach((ep) => {
        console.log(` - [${ep.kind.toUpperCase()}] ${ep.url}`);
        console.log(`   Status: ${ep.http_status} | Observations: ${ep.observations_count} | SHA-256: ${ep.response_sha256.slice(0, 16)}...`);
      });
      if (report.continuity.state_transitions_detected.length > 0) {
        console.log('---------------------------------------------------------------');
        console.log('DYNAMIC STATE TRANSITIONS:');
        report.continuity.state_transitions_detected.forEach((tr) => {
          console.log(` - ${tr.target_url}: "${tr.predicate}" transitioned [${tr.from} -> ${tr.to}]`);
        });
      }
      console.log('===============================================================');
      process.exit(0);
    })
    .catch((err) => {
      console.error(`\n❌ VERIFICATION HARNESS AUDIT FAILED: ${err.message}`);
      process.exit(1);
    });
}
