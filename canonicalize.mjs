/**
 * RFC 8785 JSON Canonicalization Scheme (JCS) Implementation
 * 
 * Complies with RFC 8785:
 * - Deterministic key sorting by UTF-16 code units
 * - Standard IEEE 754 number serialization (ECMAScript JSON)
 * - Standard string escaping
 * - No whitespace between tokens
 */

export function canonicalizeJson(value) {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        throw new TypeError('RFC 8785 JCS does not support non-finite numbers (NaN, Infinity)');
      }
      return JSON.stringify(value);
    }
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return '[' + value.map((item) => canonicalizeJson(item) ?? 'null').join(',') + ']';
  }

  // Object keys sorted by UTF-16 code units
  const keys = Object.keys(value).sort();
  const pairs = [];
  for (const k of keys) {
    if (value[k] !== undefined && typeof value[k] !== 'function' && typeof value[k] !== 'symbol') {
      pairs.push(JSON.stringify(k) + ':' + canonicalizeJson(value[k]));
    }
  }
  return '{' + pairs.join(',') + '}';
}

export default canonicalizeJson;
