/**
 * DCC Core v2 Constitutional Validator
 * 
 * Enforces canonical DCC Core v2 protocol specification.
 * Open-world: Preserves unknown root fields, containers, and extensions.
 * Never enforces closed-world restrictions at the Core level.
 */

import fs from 'node:fs';
import path from 'node:path';

export const KNOWN_CORE_CONTAINERS = new Set(['claims', 'state', 'actions', 'links']);
export const REQUIRED_ENVELOPE = ['protocol', 'core', 'self', 'id'];
export const VALID_HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

/**
 * Validates a payload against canonical DCC Core v2 specifications.
 * 
 * @param {unknown} payload - The parsed JSON payload to validate
 * @param {object} [options]
 * @param {number|Date} [options.referenceTime] - Reference timestamp for freshness checks (default: Date.now())
 * @returns {{ valid: boolean, errors: Array<{ code: string, field: string, message: string }>, passthrough_containers: string[] }}
 */
export function validateCoreV2(payload, options = {}) {
  const errors = [];
  const passthrough_containers = [];

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      valid: false,
      errors: [{
        code: 'INVALID_PAYLOAD_STRUCTURE',
        field: 'root',
        message: 'Payload must be a non-null JSON object',
      }],
      passthrough_containers: [],
    };
  }

  // 1. Required Envelope Fields
  for (const field of REQUIRED_ENVELOPE) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      errors.push({
        code: 'MISSING_ENVELOPE_FIELD',
        field,
        message: `Missing required envelope field: "${field}"`,
      });
    }
  }

  // Protocol must be 'dcc'
  if (payload.protocol !== undefined && payload.protocol !== 'dcc') {
    errors.push({
      code: 'INVALID_PROTOCOL',
      field: 'protocol',
      message: `Protocol must be "dcc", got "${payload.protocol}"`,
    });
  }

  // Core version must be '2'
  if (payload.core !== undefined && String(payload.core) !== '2') {
    errors.push({
      code: 'INVALID_CORE_VERSION',
      field: 'core',
      message: `Core version must be "2", got "${payload.core}"`,
    });
  }

  // Self must be absolute URL
  if (typeof payload.self === 'string') {
    try {
      const u = new URL(payload.self);
      if (!u.protocol.startsWith('http')) {
        errors.push({
          code: 'INVALID_SELF_URL',
          field: 'self',
          message: `self URL must use http or https scheme, got "${u.protocol}"`,
        });
      }
    } catch {
      errors.push({
        code: 'INVALID_SELF_URL',
        field: 'self',
        message: `self address "${payload.self}" is not a valid absolute URL`,
      });
    }
  } else if (payload.self !== undefined) {
    errors.push({
      code: 'INVALID_SELF_TYPE',
      field: 'self',
      message: `self must be a string URL`,
    });
  }

  // Id must be namespaced identifier or URI
  if (typeof payload.id === 'string') {
    if (!payload.id.includes(':') && !payload.id.startsWith('http')) {
      errors.push({
        code: 'MALFORMED_IDENTITY',
        field: 'id',
        message: `Identity "${payload.id}" lacks a namespace separator (":") or URI scheme`,
      });
    }
  } else if (payload.id !== undefined) {
    errors.push({
      code: 'INVALID_ID_TYPE',
      field: 'id',
      message: `id must be a string identifier`,
    });
  }

  // 2. Optional Containers
  // Claims
  if (payload.claims !== undefined) {
    if (!Array.isArray(payload.claims)) {
      errors.push({
        code: 'MALFORMED_CLAIMS_CONTAINER',
        field: 'claims',
        message: '"claims" must be an array',
      });
    } else {
      payload.claims.forEach((claim, idx) => {
        if (!claim || typeof claim !== 'object' || Array.isArray(claim)) {
          errors.push({
            code: 'MALFORMED_CLAIM_ITEM',
            field: `claims[${idx}]`,
            message: `Claim at index ${idx} must be an object`,
          });
          return;
        }
        if (typeof claim.predicate !== 'string' || !claim.predicate) {
          errors.push({
            code: 'MISSING_CLAIM_PREDICATE',
            field: `claims[${idx}].predicate`,
            message: `Claim at index ${idx} missing string "predicate"`,
          });
        }
        if (claim.value === undefined) {
          errors.push({
            code: 'MISSING_CLAIM_VALUE',
            field: `claims[${idx}].value`,
            message: `Claim at index ${idx} missing "value"`,
          });
        }
        // Disallow forbidden legacy names
        if ('name' in claim && !('predicate' in claim)) {
          errors.push({
            code: 'FORBIDDEN_FIELD_NAME',
            field: `claims[${idx}].name`,
            message: `Use canonical "predicate" instead of legacy "name"`,
          });
        }
      });
    }
  }

  // State
  if (payload.state !== undefined) {
    if (!Array.isArray(payload.state)) {
      errors.push({
        code: 'MALFORMED_STATE_CONTAINER',
        field: 'state',
        message: '"state" must be an array',
      });
    } else {
      payload.state.forEach((item, idx) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          errors.push({
            code: 'MALFORMED_STATE_ITEM',
            field: `state[${idx}]`,
            message: `State fact at index ${idx} must be an object`,
          });
          return;
        }
        if (typeof item.predicate !== 'string' || !item.predicate) {
          errors.push({
            code: 'MISSING_STATE_PREDICATE',
            field: `state[${idx}].predicate`,
            message: `State fact at index ${idx} missing string "predicate"`,
          });
        }
        if (item.value === undefined) {
          errors.push({
            code: 'MISSING_STATE_VALUE',
            field: `state[${idx}].value`,
            message: `State fact at index ${idx} missing "value"`,
          });
        }
        if (item.as_of !== undefined && isNaN(Date.parse(item.as_of))) {
          errors.push({
            code: 'INVALID_TIMESTAMP',
            field: `state[${idx}].as_of`,
            message: `Invalid ISO 8601 timestamp in "as_of": "${item.as_of}"`,
          });
        }
        if (item.fresh_until !== undefined && isNaN(Date.parse(item.fresh_until))) {
          errors.push({
            code: 'INVALID_TIMESTAMP',
            field: `state[${idx}].fresh_until`,
            message: `Invalid ISO 8601 timestamp in "fresh_until": "${item.fresh_until}"`,
          });
        }
        if (item.evidence !== undefined && !Array.isArray(item.evidence)) {
          errors.push({
            code: 'MALFORMED_EVIDENCE',
            field: `state[${idx}].evidence`,
            message: `"evidence" in state fact ${idx} must be an array`,
          });
        }
      });
    }
  }

  // Actions
  if (payload.actions !== undefined) {
    if (!Array.isArray(payload.actions)) {
      errors.push({
        code: 'MALFORMED_ACTIONS_CONTAINER',
        field: 'actions',
        message: '"actions" must be an array',
      });
    } else {
      payload.actions.forEach((act, idx) => {
        if (!act || typeof act !== 'object' || Array.isArray(act)) {
          errors.push({
            code: 'MALFORMED_ACTION_ITEM',
            field: `actions[${idx}]`,
            message: `Action at index ${idx} must be an object`,
          });
          return;
        }

        // Canonical names required
        if (typeof act.action_id !== 'string' || !act.action_id) {
          errors.push({
            code: 'MISSING_ACTION_ID',
            field: `actions[${idx}].action_id`,
            message: `Action at index ${idx} missing string "action_id"`,
          });
        }

        if (typeof act.method !== 'string' || !VALID_HTTP_METHODS.has(act.method.toUpperCase())) {
          errors.push({
            code: 'INVALID_ACTION_METHOD',
            field: `actions[${idx}].method`,
            message: `Action at index ${idx} has invalid or missing HTTP method: "${act.method}"`,
          });
        }

        // Target must be absolute HTTPS target
        if (typeof act.target !== 'string' || !act.target.startsWith('https://')) {
          errors.push({
            code: 'INVALID_HTTPS_ACTION_TARGET',
            field: `actions[${idx}].target`,
            message: `Action at index ${idx} target must be an absolute HTTPS URL, got "${act.target}"`,
          });
        }

        // Structured input or schema-addressable input
        if (act.input === undefined) {
          errors.push({
            code: 'MISSING_ACTION_INPUT',
            field: `actions[${idx}].input`,
            message: `Action at index ${idx} missing "input" declaration`,
          });
        }

        // Declared authentication requirements
        if (typeof act.auth !== 'string' || !act.auth) {
          errors.push({
            code: 'MISSING_ACTION_AUTH',
            field: `actions[${idx}].auth`,
            message: `Action at index ${idx} missing string "auth" declaration`,
          });
        }

        // Forbidden non-canonical names in actions
        if ('href' in act) {
          errors.push({
            code: 'FORBIDDEN_FIELD_NAME',
            field: `actions[${idx}].href`,
            message: `Forbidden field "href" in action. Use canonical "target".`,
          });
        }
        if ('input_schema' in act) {
          errors.push({
            code: 'FORBIDDEN_FIELD_NAME',
            field: `actions[${idx}].input_schema`,
            message: `Forbidden field "input_schema" in action. Use canonical "input".`,
          });
        }
        if ('auth_required' in act) {
          errors.push({
            code: 'FORBIDDEN_FIELD_NAME',
            field: `actions[${idx}].auth_required`,
            message: `Forbidden field "auth_required" in action. Use canonical "auth".`,
          });
        }
        if ('type' in act && !('action_id' in act)) {
          errors.push({
            code: 'FORBIDDEN_FIELD_NAME',
            field: `actions[${idx}].type`,
            message: `Forbidden field "type" used as action identifier. Use canonical "action_id".`,
          });
        }
      });
    }
  }

  // Links
  if (payload.links !== undefined) {
    if (!Array.isArray(payload.links)) {
      errors.push({
        code: 'MALFORMED_LINKS_CONTAINER',
        field: 'links',
        message: '"links" must be an array',
      });
    } else {
      payload.links.forEach((link, idx) => {
        if (!link || typeof link !== 'object' || Array.isArray(link)) {
          errors.push({
            code: 'MALFORMED_LINK_ITEM',
            field: `links[${idx}]`,
            message: `Link at index ${idx} must be an object`,
          });
          return;
        }
        if (typeof link.rel !== 'string' || !link.rel) {
          errors.push({
            code: 'MISSING_LINK_REL',
            field: `links[${idx}].rel`,
            message: `Link at index ${idx} missing string "rel"`,
          });
        }
        if (typeof link.target !== 'string' || !link.target) {
          errors.push({
            code: 'MISSING_LINK_TARGET',
            field: `links[${idx}].target`,
            message: `Link at index ${idx} missing string "target"`,
          });
        }
        if ('href' in link) {
          errors.push({
            code: 'FORBIDDEN_FIELD_NAME',
            field: `links[${idx}].href`,
            message: `Forbidden field "href" in link. Use canonical "target".`,
          });
        }
      });
    }
  }

  // 3. Open-World Passthrough Extension Containers
  for (const key of Object.keys(payload)) {
    if (!REQUIRED_ENVELOPE.includes(key) && !KNOWN_CORE_CONTAINERS.has(key)) {
      passthrough_containers.push(key);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    passthrough_containers,
  };
}

/**
 * Evaluates freshness of state facts independently.
 * Checks per-fact fresh_until timestamps against reference timestamp.
 * 
 * @param {Array<object>} stateArray - The state container array
 * @param {number|Date} [referenceTime] - Reference timestamp (default: Date.now())
 * @returns {{ is_fresh: boolean, as_of: string|null, fresh_until: string|null, facts: Array<object> }}
 */
export function evaluateFreshness(stateArray, referenceTime = Date.now()) {
  const refMs = typeof referenceTime === 'number' ? referenceTime : new Date(referenceTime).getTime();

  if (!Array.isArray(stateArray) || stateArray.length === 0) {
    return {
      is_fresh: true,
      as_of: null,
      fresh_until: null,
      facts: [],
    };
  }

  let latestAsOf = null;
  let earliestFreshUntil = null;
  let allFresh = true;

  const facts = stateArray.map((fact) => {
    let factIsFresh = true;
    let staleByMs = 0;

    if (fact.as_of) {
      if (!latestAsOf || new Date(fact.as_of).getTime() > new Date(latestAsOf).getTime()) {
        latestAsOf = fact.as_of;
      }
    }

    if (fact.fresh_until) {
      const freshMs = new Date(fact.fresh_until).getTime();
      if (!earliestFreshUntil || freshMs < new Date(earliestFreshUntil).getTime()) {
        earliestFreshUntil = fact.fresh_until;
      }
      if (freshMs < refMs) {
        factIsFresh = false;
        allFresh = false;
        staleByMs = refMs - freshMs;
      }
    }

    return {
      predicate: fact.predicate,
      value: fact.value,
      as_of: fact.as_of,
      fresh_until: fact.fresh_until,
      is_fresh: factIsFresh,
      stale_by_seconds: staleByMs > 0 ? Math.round(staleByMs / 1000) : 0,
    };
  });

  return {
    is_fresh: allFresh,
    as_of: latestAsOf,
    fresh_until: earliestFreshUntil,
    facts,
  };
}

/**
 * Separate Tourism Profile Validator (Tourism Profile v1).
 * Never enforced as Core law.
 */
export function validateTourismProfile(payload) {
  const coreResult = validateCoreV2(payload);
  if (!coreResult.valid) return coreResult;

  const tourismErrors = [];
  const claims = Array.isArray(payload.claims) ? payload.claims : [];
  const claimPredicates = new Set(claims.map((c) => c.predicate));

  if (!claimPredicates.has('legal_name')) {
    tourismErrors.push({
      code: 'PROFILE_MISSING_LEGAL_NAME',
      field: 'claims.legal_name',
      message: 'Tourism profile requires "legal_name" claim',
    });
  }

  return {
    valid: tourismErrors.length === 0,
    errors: tourismErrors,
    core_valid: true,
  };
}

// CLI Execution Support
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node validate.mjs <payload.json>');
    process.exit(2);
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(raw);
    const result = validateCoreV2(json);
    const freshness = evaluateFreshness(json.state);
    console.log(JSON.stringify({ validation: result, freshness }, null, 2));
    process.exit(result.valid ? 0 : 1);
  } catch (err) {
    console.error(`Validation failed with exception: ${err.message}`);
    process.exit(1);
  }
}
