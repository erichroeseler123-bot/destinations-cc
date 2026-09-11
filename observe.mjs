/**
 * DCC Verification Harness — Observer
 * 
 * Complies with Canonical DCC Core v2 Specification & Raw-Byte Observation Rules:
 * 1. Fetches target over HTTPS (or local fixture for test-vectors).
 * 2. Reads exact raw response bytes into Buffer.
 * 3. Calculates SHA-256 before parsing JSON.
 * 4. Stores raw bytes unchanged in transcripts/.
 * 5. Re-reads and verifies disk hash matches byte hash before proceeding.
 * 6. Parses JSON and validates against canonical Core v2.
 * 7. Evaluates per-fact freshness.
 * 8. Chains previous_hash and hashes record using RFC 8785 JCS canonicalization.
 * 9. Appends immutable record to ledger/observations.jsonl.
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
export const EMPTY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

export const LEDGER_PATH = path.join(__dirname, 'ledger', 'observations.jsonl');
export const TRANSCRIPTS_DIR = path.join(__dirname, 'transcripts');
export const TARGETS_PATH = path.join(__dirname, 'targets.json');

/**
 * Reads the latest record from the ledger to get the chain tip hash and timestamp.
 */
export function getChainTip(ledgerPath = LEDGER_PATH) {
  if (!fs.existsSync(ledgerPath)) {
    return { tipHash: GENESIS_HASH, lastTimestamp: null, count: 0 };
  }
  const content = fs.readFileSync(ledgerPath, 'utf-8').trim();
  if (!content) {
    return { tipHash: GENESIS_HASH, lastTimestamp: null, count: 0 };
  }
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  const lastLine = lines[lines.length - 1];
  const parsed = JSON.parse(lastLine);
  return {
    tipHash: parsed.record_hash,
    lastTimestamp: parsed.recorded_at,
    count: lines.length,
  };
}

/**
 * Observes a single target and appends an observation to the ledger.
 */
export async function observeTarget(target, options = {}) {
  const transcriptsDir = options.transcriptsDir || TRANSCRIPTS_DIR;
  const ledgerPath = options.ledgerPath || LEDGER_PATH;

  fs.mkdirSync(transcriptsDir, { recursive: true });
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });

  // Guard against synthetic target mislabeled as production
  const isSyntheticUri = target.url.startsWith('test-vector:') || target.url.includes('synthetic.example') || Boolean(target.fixture_path);
  if (isSyntheticUri && target.kind === 'production') {
    throw new Error(`SYNTHETIC_TARGET_MISLABELED_AS_PRODUCTION: Target "${target.id}" (${target.url}) is synthetic but declared kind="production"`);
  }

  let rawBuffer;
  let httpStatus = 200;
  let contentType = 'application/json';
  let responseHeaders = {};
  const observedAt = new Date().toISOString();

  if (target.url.startsWith('test-vector:') || target.fixture_path) {
    // Controlled synthetic test vector fixture
    const fixtureFullPath = path.isAbsolute(target.fixture_path)
      ? target.fixture_path
      : path.join(__dirname, target.fixture_path);

    if (!fs.existsSync(fixtureFullPath)) {
      throw new Error(`Fixture file not found: ${fixtureFullPath}`);
    }
    rawBuffer = fs.readFileSync(fixtureFullPath);
    httpStatus = 200;
    contentType = 'application/json; charset=utf-8';
    responseHeaders = {
      'content-type': contentType,
      date: observedAt,
      'x-dcc-fixture': path.basename(fixtureFullPath),
    };
  } else {
    // Production HTTPS target
    const fetchController = new AbortController();
    const timeout = setTimeout(() => fetchController.abort(), 10000);

    try {
      const res = await fetch(target.url, {
        signal: fetchController.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'DCC-Verification-Observer/2.0 (+https://destinationcommandcenter.com)',
        },
      });

      httpStatus = res.status;
      contentType = res.headers.get('content-type') || 'application/json';

      // Capture timing and caching headers
      for (const h of ['date', 'last-modified', 'etag', 'cache-control', 'age', 'x-served-by']) {
        const val = res.headers.get(h);
        if (val) responseHeaders[h] = val;
      }

      const arrayBuffer = await res.arrayBuffer();
      rawBuffer = Buffer.from(arrayBuffer);
    } finally {
      clearTimeout(timeout);
    }
  }

  // 1. Raw-byte SHA-256 computation before JSON parsing
  const response_sha256 = crypto.createHash('sha256').update(rawBuffer).digest('hex');

  // Guard against empty-payload hash with nonempty bytes
  if (rawBuffer.length > 0 && response_sha256 === EMPTY_SHA256) {
    throw new Error('INVALID_HASH: Empty-payload hash computed against non-empty raw bytes');
  }

  // 2. Store raw bytes unchanged in transcripts/
  const safeId = target.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestampForFile = observedAt.replace(/[:.]/g, '-');
  const transcriptFileName = `${safeId}_${timestampForFile}_${response_sha256.slice(0, 8)}.json`;
  const transcriptFullPath = path.join(transcriptsDir, transcriptFileName);
  const relativeTranscriptPath = path.relative(__dirname, transcriptFullPath).replace(/\\/g, '/');

  fs.writeFileSync(transcriptFullPath, rawBuffer);

  // 3. Immediately re-read from disk and verify disk hash matches
  const diskBytes = fs.readFileSync(transcriptFullPath);
  const diskHash = crypto.createHash('sha256').update(diskBytes).digest('hex');
  if (diskHash !== response_sha256) {
    throw new Error(`TRANSCRIPT_HASH_MISMATCH: Computed hash ${response_sha256} but disk hash is ${diskHash}`);
  }

  // 4. Parse bytes ONLY after hashing
  let parsedJson = null;
  let parseError = null;
  try {
    parsedJson = JSON.parse(rawBuffer.toString('utf-8'));
  } catch (err) {
    parseError = err.message;
  }

  // 5. Validate parsed JSON
  const validationResult = parseError
    ? { valid: false, errors: [{ code: 'JSON_PARSE_ERROR', field: 'root', message: parseError }], passthrough_containers: [] }
    : validateCoreV2(parsedJson, { referenceTime: new Date(observedAt).getTime() });

  // 6. Evaluate freshness
  const freshnessResult = (parsedJson && Array.isArray(parsedJson.state))
    ? evaluateFreshness(parsedJson.state, new Date(observedAt).getTime())
    : { is_fresh: true, as_of: null, fresh_until: null, facts: [] };

  // 7. Get chain tip
  const { tipHash, lastTimestamp } = getChainTip(ledgerPath);

  const recordedAt = new Date().toISOString();

  // Timestamp ordering check
  if (lastTimestamp && new Date(observedAt).getTime() < new Date(lastTimestamp).getTime()) {
    throw new Error(`UNORDERED_TIMESTAMPS: observed_at (${observedAt}) is earlier than previous recorded_at (${lastTimestamp})`);
  }

  // 8. Assemble observation record
  const record = {
    schema_version: 'dcc-ledger-v1',
    observer_id: 'dcc-harness-observer-v2',
    target_url: target.url,
    target_kind: target.kind,
    http_status: httpStatus,
    content_type: contentType,
    response_headers: responseHeaders,
    observed_at: observedAt,
    recorded_at: recordedAt,
    response_sha256,
    transcript_path: relativeTranscriptPath,
    validation_result: validationResult,
    freshness_result: freshnessResult,
    previous_hash: tipHash,
  };

  // 9. Compute record_hash using RFC 8785 Canonical JSON Serialization
  const canonicalRecord = canonicalizeJson(record);
  const record_hash = crypto.createHash('sha256').update(canonicalRecord, 'utf8').digest('hex');
  record.record_hash = record_hash;

  // 10. Append to ledger
  fs.appendFileSync(ledgerPath, JSON.stringify(record) + '\n', 'utf-8');

  return {
    record,
    rawBytesCount: rawBuffer.length,
    validationValid: validationResult.valid,
  };
}

/**
 * Runs observation across all registered targets in targets.json.
 */
export async function observeAll(options = {}) {
  const targetsPath = options.targetsPath || TARGETS_PATH;
  const targets = JSON.parse(fs.readFileSync(targetsPath, 'utf-8'));
  console.log(`[Observer] Loaded ${targets.length} targets from ${targetsPath}`);

  const results = [];
  for (const t of targets) {
    console.log(`[Observer] Observing ${t.id} (${t.kind}) -> ${t.url}...`);
    try {
      const res = await observeTarget(t, options);
      results.push({ id: t.id, success: true, record: res.record });
      console.log(`  ✓ Status: ${res.record.http_status} | SHA-256: ${res.record.response_sha256.slice(0, 12)}... | Valid: ${res.record.validation_result.valid}`);
    } catch (err) {
      console.error(`  ✗ Failed to observe ${t.id}: ${err.message}`);
      results.push({ id: t.id, success: false, error: err.message });
      throw err;
    }
  }

  return results;
}

// CLI Execution Support
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  observeAll()
    .then((results) => {
      console.log(`\n[Observer] Observation run completed: ${results.length} targets recorded.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(`\n[Observer] Fatal error: ${err.message}`);
      process.exit(1);
    });
}
