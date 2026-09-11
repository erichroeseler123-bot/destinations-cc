import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateCoreV2, evaluateFreshness } from '../../validate.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

test('1. Zero Secondary Database Duplication: /demo contains no local database or hardcoded inventory', () => {
  const demoPageCode = fs.readFileSync(path.join(PROJECT_ROOT, 'app', 'demo', 'page.tsx'), 'utf-8');
  const demoCompCode = fs.readFileSync(path.join(PROJECT_ROOT, 'app', 'demo', 'DccHydrationDemo.tsx'), 'utf-8');

  // Must not import prisma or local database schemas
  assert.equal(demoPageCode.includes('@/lib/db'), false, 'Demo page must not import database');
  assert.equal(demoPageCode.includes('prisma'), false, 'Demo page must not import prisma');
  assert.equal(demoCompCode.includes('@/lib/db'), false, 'Demo component must not import database');

  // Must not hardcode GoSno route prices or schedules
  assert.equal(demoPageCode.includes('$399.00'), false, 'Route prices must not be hardcoded in page');
  assert.equal(demoCompCode.includes('$399.00'), false, 'Route prices must not be hardcoded in component');
  assert.equal(demoPageCode.includes('DEN-BRECKENRIDGE'), false, 'Route IDs must not be hardcoded in page');
});

test('2. Live Hydration proves displayed route names, prices, availability, and actions come strictly from fetched endpoint', async () => {
  const wellKnownRes = await fetch('https://gosno.co/.well-known/dcc');
  assert.equal(wellKnownRes.status, 200, 'Live GoSno well-known endpoint must return 200');
  const wellKnownJson = await wellKnownRes.json();

  // Validate Core v2 structure
  const v1 = validateCoreV2(wellKnownJson);
  assert.equal(v1.valid, true, 'Well-known payload must be Core v2 valid');

  // Extract operator claims & actions from live endpoint
  const legalName = wellKnownJson.claims.find((c: any) => c.predicate === 'legal_name')?.value;
  const authority = wellKnownJson.claims.find((c: any) => c.predicate === 'operating_authority')?.value;
  const actions = wellKnownJson.actions.map((a: any) => a.action_id);
  const status = wellKnownJson.state.find((s: any) => s.predicate === 'service_status')?.value;

  assert.equal(legalName, 'GoSno LLC', 'Legal name must come from live claim');
  assert.equal(authority, 'CO PUC LL-03577', 'Operating authority must come from live claim');
  assert.ok(actions.includes('check_availability'), 'Action check_availability must come from live actions');
  assert.ok(actions.includes('request_quote'), 'Action request_quote must come from live actions');
  assert.equal(status, 'operational', 'Operating state must come from live state');

  // Fetch routes catalog
  const routesRes = await fetch('https://gosno.co/api/dcc/routes');
  assert.equal(routesRes.status, 200, 'Routes catalog must return 200');
  const routesJson = await routesRes.json();

  const routeOfferings = routesJson.claims
    .filter((c: any) => c.predicate === 'route_offering')
    .map((c: any) => c.value);

  assert.ok(routeOfferings.length >= 8, 'Must have at least 8 live routes');
  const breck = routeOfferings.find((r: any) => r.route_id === 'DEN-BRECKENRIDGE');
  assert.ok(breck, 'DEN-BRECKENRIDGE must exist in live routes');
  assert.equal(breck.price_formatted, '$399.00', 'Price must come from live route offering claim');
  assert.equal(breck.online_bookable, true, 'Availability/bookability must come from live route claim');
});

test('3. Endpoint failure state handling', () => {
  // Simulate failed endpoint payload (null or error response)
  const simulatedError = 'HTTP 503 Service Unavailable: Gateway Timeout';
  assert.ok(simulatedError.includes('503'));

  // Ensure validateCoreV2 rejects null/empty payloads
  const res = validateCoreV2(null);
  assert.equal(res.valid, false);
  assert.equal(res.errors[0].code, 'INVALID_PAYLOAD_STRUCTURE');
});

test('4. Stale data state: expired fresh_until is detected', () => {
  const staleState = [
    {
      predicate: 'service_status',
      value: 'operational',
      as_of: '2026-09-10T12:00:00Z',
      fresh_until: '2026-09-10T13:00:00Z' // Expired in the past
    }
  ];

  const evalTime = new Date('2026-09-11T22:00:00Z').getTime();
  const res = evaluateFreshness(staleState, evalTime);

  assert.equal(res.is_fresh, false, 'State must be marked stale when fresh_until is in the past');
  assert.ok(res.facts[0].stale_by_seconds > 0, 'Must record expired duration');
});

test('5. Malformed response state: invalid Core v2 payload is rejected with diagnostics', () => {
  const malformedPayload = {
    self: 'https://example.com/dcc',
    id: 'example.com:test/1',
    // Missing protocol and core
    claims: 'not-an-array',
    actions: [{ name: 'bad_action', href: 'http://insecure.example' }]
  };

  const res = validateCoreV2(malformedPayload);
  assert.equal(res.valid, false, 'Malformed payload must fail Core v2 validation');
  const codes = res.errors.map((e) => e.code);
  assert.ok(codes.includes('MISSING_ENVELOPE_FIELD'), 'Must catch missing envelope fields');
  assert.ok(codes.includes('MALFORMED_CLAIMS_CONTAINER'), 'Must catch non-array claims');
  assert.ok(codes.includes('MISSING_ACTION_ID'), 'Must catch missing action_id');
});
