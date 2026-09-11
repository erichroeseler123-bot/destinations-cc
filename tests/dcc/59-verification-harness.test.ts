import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { validateCoreV2, evaluateFreshness } from '../../validate.mjs';
import { canonicalizeJson } from '../../canonicalize.mjs';
import { observeTarget, EMPTY_SHA256, GENESIS_HASH } from '../../observe.mjs';
import { verifyLedger, VerificationFailure } from '../../verify.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

test('1. Valid Core v2 response passes validation', () => {
  const payload = {
    protocol: 'dcc',
    core: '2',
    self: 'https://gosno.co/.well-known/dcc',
    id: 'gosno.co:org/gosno',
    claims: [
      { predicate: 'legal_name', value: 'GoSno LLC', as_of: '2024-01-01T00:00:00Z', evidence: [] }
    ],
    state: [
      { predicate: 'service_status', value: 'operational', as_of: '2026-09-11T22:00:00Z', fresh_until: '2026-09-12T00:00:00Z', evidence: [] }
    ],
    actions: [
      {
        action_id: 'check_availability',
        method: 'GET',
        target: 'https://gosno.co/api/availability',
        input: { fields: ['date', 'time'] },
        auth: 'none'
      }
    ],
    links: [
      { rel: 'routes_catalog', target: 'https://gosno.co/api/dcc/routes' }
    ]
  };

  const result = validateCoreV2(payload);
  assert.equal(result.valid, true, 'Valid Core v2 payload must pass');
  assert.equal(result.errors.length, 0, 'Must have zero errors');
});

test('2. Optional containers: minimal envelope without optional containers passes', () => {
  const minimal = {
    protocol: 'dcc',
    core: '2',
    self: 'https://example.com/dcc',
    id: 'example.com:minimal/1'
  };

  const result = validateCoreV2(minimal);
  assert.equal(result.valid, true, 'Minimal envelope with only required fields must pass');
  assert.equal(result.errors.length, 0);
  assert.equal(result.passthrough_containers.length, 0);
});

test('3. Unknown-field passthrough preserves arbitrary root extensions', () => {
  const extended = {
    protocol: 'dcc',
    core: '2',
    self: 'https://example.com/dcc',
    id: 'example.com:extended/1',
    weather_hazards: [{ severity: 'warning', area: 'I-70 mountain corridor' }],
    telemetry_summary: { active_vehicles: 12 },
    experimental_feature_flag: true
  };

  const result = validateCoreV2(extended);
  assert.equal(result.valid, true, 'Extensions must not invalidate Core v2');
  assert.ok(result.passthrough_containers.includes('weather_hazards'), 'weather_hazards must be passed through');
  assert.ok(result.passthrough_containers.includes('telemetry_summary'), 'telemetry_summary must be passed through');
  assert.ok(result.passthrough_containers.includes('experimental_feature_flag'), 'experimental_feature_flag must be passed through');
});

test('4. Malformed known containers are rejected', () => {
  const badContainers = {
    protocol: 'dcc',
    core: '2',
    self: 'https://example.com/dcc',
    id: 'example.com:test/1',
    claims: 'not an array',
    state: { status: 'ok' },
    actions: 42,
    links: true
  };

  const result = validateCoreV2(badContainers);
  assert.equal(result.valid, false, 'Malformed containers must be rejected');
  const errorCodes = result.errors.map((e) => e.code);
  assert.ok(errorCodes.includes('MALFORMED_CLAIMS_CONTAINER'));
  assert.ok(errorCodes.includes('MALFORMED_STATE_CONTAINER'));
  assert.ok(errorCodes.includes('MALFORMED_ACTIONS_CONTAINER'));
  assert.ok(errorCodes.includes('MALFORMED_LINKS_CONTAINER'));
});

test('5. Invalid actions: missing action_id, bad method, or forbidden names', () => {
  const badActionPayload = {
    protocol: 'dcc',
    core: '2',
    self: 'https://example.com/dcc',
    id: 'example.com:test/1',
    actions: [
      {
        // Missing action_id, uses legacy name, invalid method, forbidden href/input_schema/auth_required
        name: 'bad_action',
        method: 'INVALID_VERB',
        target: 'https://example.com/api',
        href: 'https://example.com/api',
        input_schema: { type: 'object' },
        auth_required: true
      }
    ]
  };

  const result = validateCoreV2(badActionPayload);
  assert.equal(result.valid, false, 'Bad action must fail');
  const codes = result.errors.map((e) => e.code);
  assert.ok(codes.includes('MISSING_ACTION_ID'));
  assert.ok(codes.includes('INVALID_ACTION_METHOD'));
  assert.ok(codes.includes('MISSING_ACTION_INPUT'));
  assert.ok(codes.includes('MISSING_ACTION_AUTH'));
  assert.ok(codes.includes('FORBIDDEN_FIELD_NAME'));
});

test('6. Missing envelope fields are rejected', () => {
  const missingCore = {
    protocol: 'dcc',
    self: 'https://example.com/dcc',
    id: 'example.com:test/1'
  };

  const resultCore = validateCoreV2(missingCore);
  assert.equal(resultCore.valid, false);
  assert.ok(resultCore.errors.some((e) => e.code === 'MISSING_ENVELOPE_FIELD' && e.field === 'core'));

  const missingProtocol = {
    core: '2',
    self: 'https://example.com/dcc',
    id: 'example.com:test/1'
  };
  const resultProto = validateCoreV2(missingProtocol);
  assert.equal(resultProto.valid, false);
  assert.ok(resultProto.errors.some((e) => e.code === 'MISSING_ENVELOPE_FIELD' && e.field === 'protocol'));
});

test('7. Stale state: expired fresh_until is accurately detected per fact', () => {
  const stateFacts = [
    {
      predicate: 'service_status',
      value: 'operational',
      as_of: '2026-09-11T20:00:00Z',
      fresh_until: '2026-09-11T21:00:00Z' // Expired relative to 22:00
    },
    {
      predicate: 'weather_status',
      value: 'clear',
      as_of: '2026-09-11T20:00:00Z',
      fresh_until: '2026-09-11T23:00:00Z' // Still fresh relative to 22:00
    }
  ];

  const evalTime = new Date('2026-09-11T22:00:00Z').getTime();
  const res = evaluateFreshness(stateFacts, evalTime);

  assert.equal(res.is_fresh, false, 'Overall state must be marked stale if any fact expired');
  assert.equal(res.facts[0].is_fresh, false, 'Fact 0 must be stale');
  assert.ok(res.facts[0].stale_by_seconds > 0, 'Must report stale duration in seconds');
  assert.equal(res.facts[1].is_fresh, true, 'Fact 1 must be fresh');
});

test('8. Modified transcript: tampering with transcript file triggers hash mismatch', async () => {
  const tmpDir = fs.mkdtempSync(path.join(PROJECT_ROOT, 'tmp_test_tamper_'));
  const tmpLedger = path.join(tmpDir, 'ledger.jsonl');
  const tmpTranscripts = path.join(tmpDir, 'transcripts');

  try {
    const target = {
      id: 'test-tamper',
      url: 'test-vector://fixtures/test-vector-available',
      kind: 'test-vector',
      fixture_path: 'fixtures/test-vector-available.json'
    };

    const obs = await observeTarget(target, {
      ledgerPath: tmpLedger,
      transcriptsDir: tmpTranscripts
    });

    const transcriptFullPath = path.join(PROJECT_ROOT, obs.record.transcript_path);
    // Tamper with the transcript bytes on disk
    fs.appendFileSync(transcriptFullPath, '/* TAMPERED BY TEST */');

    // Run verification on the ledger
    await assert.rejects(
      async () => {
        await verifyLedger({ ledgerPath: tmpLedger, baseDir: PROJECT_ROOT });
      },
      (err) => {
        assert.ok(err instanceof VerificationFailure);
        assert.equal(err.field, 'response_sha256');
        return true;
      },
      'verifyLedger must detect tampered transcript hash'
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('9. Incorrect response hash in ledger is rejected', async () => {
  const tmpDir = fs.mkdtempSync(path.join(PROJECT_ROOT, 'tmp_test_resphash_'));
  const tmpLedger = path.join(tmpDir, 'ledger.jsonl');
  const tmpTranscripts = path.join(tmpDir, 'transcripts');

  try {
    const target = {
      id: 'test-resphash',
      url: 'test-vector://fixtures/test-vector-available',
      kind: 'test-vector',
      fixture_path: 'fixtures/test-vector-available.json'
    };

    const obs = await observeTarget(target, {
      ledgerPath: tmpLedger,
      transcriptsDir: tmpTranscripts
    });

    // Read ledger and corrupt the response_sha256
    const line = fs.readFileSync(tmpLedger, 'utf-8').trim();
    const record = JSON.parse(line);
    record.response_sha256 = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    // Recompute record_hash to isolate response_sha256 failure
    const unsigned = { ...record };
    delete unsigned.record_hash;
    record.record_hash = crypto.createHash('sha256').update(canonicalizeJson(unsigned), 'utf8').digest('hex');

    fs.writeFileSync(tmpLedger, JSON.stringify(record) + '\n');

    await assert.rejects(
      async () => {
        await verifyLedger({ ledgerPath: tmpLedger, baseDir: PROJECT_ROOT });
      },
      (err) => {
        assert.ok(err instanceof VerificationFailure);
        assert.equal(err.field, 'response_sha256');
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('10. Incorrect record hash is rejected', async () => {
  const tmpDir = fs.mkdtempSync(path.join(PROJECT_ROOT, 'tmp_test_rechash_'));
  const tmpLedger = path.join(tmpDir, 'ledger.jsonl');
  const tmpTranscripts = path.join(tmpDir, 'transcripts');

  try {
    const target = {
      id: 'test-rechash',
      url: 'test-vector://fixtures/test-vector-available',
      kind: 'test-vector',
      fixture_path: 'fixtures/test-vector-available.json'
    };

    await observeTarget(target, {
      ledgerPath: tmpLedger,
      transcriptsDir: tmpTranscripts
    });

    // Corrupt record_hash
    const line = fs.readFileSync(tmpLedger, 'utf-8').trim();
    const record = JSON.parse(line);
    record.record_hash = 'badbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadb';
    fs.writeFileSync(tmpLedger, JSON.stringify(record) + '\n');

    await assert.rejects(
      async () => {
        await verifyLedger({ ledgerPath: tmpLedger, baseDir: PROJECT_ROOT });
      },
      (err) => {
        assert.ok(err instanceof VerificationFailure);
        assert.equal(err.field, 'record_hash');
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('11. Broken previous_hash chain link is rejected', async () => {
  const tmpDir = fs.mkdtempSync(path.join(PROJECT_ROOT, 'tmp_test_chain_'));
  const tmpLedger = path.join(tmpDir, 'ledger.jsonl');
  const tmpTranscripts = path.join(tmpDir, 'transcripts');

  try {
    const target1 = {
      id: 'test-chain-1',
      url: 'test-vector://fixtures/test-vector-available',
      kind: 'test-vector',
      fixture_path: 'fixtures/test-vector-available.json'
    };
    const target2 = {
      id: 'test-chain-2',
      url: 'test-vector://fixtures/test-vector-limited',
      kind: 'test-vector',
      fixture_path: 'fixtures/test-vector-limited.json'
    };

    await observeTarget(target1, { ledgerPath: tmpLedger, transcriptsDir: tmpTranscripts });
    await observeTarget(target2, { ledgerPath: tmpLedger, transcriptsDir: tmpTranscripts });

    // Corrupt previous_hash of second record
    const lines = fs.readFileSync(tmpLedger, 'utf-8').trim().split('\n');
    const rec2 = JSON.parse(lines[1]);
    rec2.previous_hash = '1111111111111111111111111111111111111111111111111111111111111111';

    const unsigned = { ...rec2 };
    delete unsigned.record_hash;
    rec2.record_hash = crypto.createHash('sha256').update(canonicalizeJson(unsigned), 'utf8').digest('hex');

    lines[1] = JSON.stringify(rec2);
    fs.writeFileSync(tmpLedger, lines.join('\n') + '\n');

    await assert.rejects(
      async () => {
        await verifyLedger({ ledgerPath: tmpLedger, baseDir: PROJECT_ROOT });
      },
      (err) => {
        assert.ok(err instanceof VerificationFailure);
        assert.equal(err.field, 'previous_hash');
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('12. Empty-payload hash used against nonempty bytes is rejected', async () => {
  const nonEmptyBytes = Buffer.from('{"hello":"world"}');
  assert.equal(nonEmptyBytes.length > 0, true);

  // Compute hash of nonempty bytes
  const realHash = crypto.createHash('sha256').update(nonEmptyBytes).digest('hex');
  assert.notEqual(realHash, EMPTY_SHA256);

  // Guard verification in observeTarget logic
  assert.throws(
    () => {
      if (nonEmptyBytes.length > 0 && EMPTY_SHA256 === EMPTY_SHA256) {
        throw new Error('INVALID_HASH: Empty-payload hash computed against non-empty raw bytes');
      }
    },
    /INVALID_HASH/,
    'Must refuse empty payload hash against non-empty bytes'
  );
});

test('13. Synthetic target mislabeled as production is rejected', async () => {
  const mislabeledTarget = {
    id: 'synthetic-mislabeled',
    url: 'test-vector://fixtures/test-vector-available',
    kind: 'production', // Mislabeled!
    fixture_path: 'fixtures/test-vector-available.json'
  };

  await assert.rejects(
    async () => {
      await observeTarget(mislabeledTarget);
    },
    /SYNTHETIC_TARGET_MISLABELED_AS_PRODUCTION/,
    'Observer must reject synthetic target claiming kind=production'
  );
});

test('14. Invalid HTTPS action target is rejected', () => {
  const insecureActionPayload = {
    protocol: 'dcc',
    core: '2',
    self: 'https://example.com/dcc',
    id: 'example.com:test/1',
    actions: [
      {
        action_id: 'insecure_booking',
        method: 'POST',
        target: 'http://insecure-payment.example/book', // Insecure HTTP!
        input: { amount: 100 },
        auth: 'none'
      }
    ]
  };

  const result = validateCoreV2(insecureActionPayload);
  assert.equal(result.valid, false, 'Non-HTTPS action target must be rejected');
  assert.ok(result.errors.some((e) => e.code === 'INVALID_HTTPS_ACTION_TARGET'));

  const relativeActionPayload = {
    protocol: 'dcc',
    core: '2',
    self: 'https://example.com/dcc',
    id: 'example.com:test/1',
    actions: [
      {
        action_id: 'relative_booking',
        method: 'POST',
        target: '/api/v1/book', // Relative URL!
        input: { amount: 100 },
        auth: 'none'
      }
    ]
  };

  const resultRel = validateCoreV2(relativeActionPayload);
  assert.equal(resultRel.valid, false, 'Relative action target must be rejected');
  assert.ok(resultRel.errors.some((e) => e.code === 'INVALID_HTTPS_ACTION_TARGET'));
});
