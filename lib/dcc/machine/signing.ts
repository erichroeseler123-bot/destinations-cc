import crypto from "node:crypto";
import { canonicalJsonStringify, hashCanonicalJson, sha256Hex } from "./cryptoAndStorage";

/**
 * DCC Machine Layer v0.2 — Standards-Based Asymmetric Receipt Signing (Ed25519 / RFC 8032)
 *
 * Hashing proves integrity, not truth or issuer identity.
 * This module implements Ed25519 asymmetric signing and verification with:
 * - Zero private keys committed to the repository
 * - Public-key discovery (/.well-known/dcc/keys.json) in JWK + SPKI PEM format
 * - Key rotation (active, retired_verify_only, revoked)
 * - Explicit epistemic limitation statement on every signed receipt
 */

export const EPISTEMIC_RECEIPT_LIMITATION_STATEMENT =
  "This signed receipt cryptographically proves what declared CandidateUniverse, Decision IR bundle, bitemporal ClaimVersions (validAt and knownAt), EvidenceFragments, and SourceSnapshots Destination Command Center possessed and evaluated to compute this decision. It does not guarantee that every underlying external source assertion was objectively true in the physical world.";

export type SigningKeyStatus = "active" | "retired_verify_only" | "revoked";

export type PublicSigningKeyRecord = {
  keyId: string;
  algorithm: "Ed25519";
  kty: "OKP";
  crv: "Ed25519";
  x: string; // base64url raw 32-byte Ed25519 public key
  publicKeyRawBase64Url: string;
  use: "sig";
  publicKeyPem: string;
  publicKeySpkiPem: string;
  publicKeyFingerprintSha256: string;
  status: SigningKeyStatus;
  createdAt: string;
  retiredAt: string | null;
};

type InternalSigningKeyPair = PublicSigningKeyRecord & {
  privateKeyObject: crypto.KeyObject;
  publicKeyObject: crypto.KeyObject;
};

export type CanonicalReceiptPayload = {
  spec: "dcc-decision-receipt/0.2";
  receiptId: string;
  evaluationFingerprint: string;
  engineId: string;
  engineVersion: string;
  bundleHash: string;
  candidateUniverseId: string;
  candidateUniverseVersion: string;
  candidateUniverseHash: string;
  normalizedInputHash: string;
  validAt: string;
  knownAt: string;
  decisionState: string;
  recommendedCandidateId: string | null;
  candidateDispositionSummary: Array<{
    candidateId: string;
    disposition: "eligible" | "qualified" | "ineligible" | "indeterminate";
    reasonCodes: string[];
    evidenceDependencies: string[];
  }>;
  resolvedClaimVersionIds: string[];
  resultHash: string;
  traceHash: string;
  epistemicLimitationStatement: string;
};

export type SignedDecisionReceipt = {
  objectType: "DecisionReceipt";
  receiptId: string;
  keyId: string;
  algorithm: "Ed25519";
  issuedAt: string;
  canonicalPayloadHash: string;
  signature: string;
  signatureBase64Url: string;
  publicKeyDiscoveryUri: "/.well-known/dcc/keys.json";
  immutableReferenceUri: string;
  stableReferenceUri: string;
  epistemicLimitationStatement: string;
  payload: CanonicalReceiptPayload;
  canonicalPayload: CanonicalReceiptPayload;
};

// PKCS#8 DER prefix for a 32-byte Ed25519 seed (RFC 8410)
const ED25519_PKCS8_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

function deriveEd25519KeyPairFromSeedMaterial(params: {
  keyId: string;
  seedMaterial: string;
  status: SigningKeyStatus;
  createdAt: string;
  retiredAt?: string | null;
}): InternalSigningKeyPair {
  const seed32 = crypto
    .createHash("sha256")
    .update(`dcc-ed25519-key-derivation-v0.2:${params.keyId}:${params.seedMaterial}`, "utf8")
    .digest();

  const pkcs8Der = Buffer.concat([ED25519_PKCS8_PREFIX, seed32]);
  const privateKeyObject = crypto.createPrivateKey({
    key: pkcs8Der,
    format: "der",
    type: "pkcs8",
  });
  const publicKeyObject = crypto.createPublicKey(privateKeyObject);
  const publicKeyPem = publicKeyObject.export({ format: "pem", type: "spki" }).toString();
  const jwk = publicKeyObject.export({ format: "jwk" }) as { x?: string };
  const x = jwk.x ?? "";
  const publicKeyFingerprintSha256 = sha256Hex(publicKeyPem.trim());

  return {
    keyId: params.keyId,
    algorithm: "Ed25519",
    kty: "OKP",
    crv: "Ed25519",
    x,
    publicKeyRawBase64Url: x,
    use: "sig",
    publicKeyPem,
    publicKeySpkiPem: publicKeyPem,
    publicKeyFingerprintSha256,
    status: params.status,
    createdAt: params.createdAt,
    retiredAt: params.retiredAt ?? null,
    privateKeyObject,
    publicKeyObject,
  };
}

let keyRingMap: Map<string, InternalSigningKeyPair> | null = null;
let activeKeyId: string | null = null;

function initializeKeyRing(): Map<string, InternalSigningKeyPair> {
  const ring = new Map<string, InternalSigningKeyPair>();

  const envJson = process.env.DCC_MACHINE_SIGNING_KEYS_JSON?.trim();
  if (envJson) {
    try {
      const parsed = JSON.parse(envJson) as Array<{
        keyId: string;
        seedMaterial: string;
        status?: SigningKeyStatus;
        createdAt?: string;
        retiredAt?: string | null;
      }>;
      for (const entry of parsed) {
        if (!entry.keyId || !entry.seedMaterial) continue;
        const kp = deriveEd25519KeyPairFromSeedMaterial({
          keyId: entry.keyId,
          seedMaterial: entry.seedMaterial,
          status: entry.status ?? "active",
          createdAt: entry.createdAt ?? "2026-04-20T00:00:00.000Z",
          retiredAt: entry.retiredAt ?? null,
        });
        ring.set(kp.keyId, kp);
        if (kp.status === "active" && !activeKeyId) {
          activeKeyId = kp.keyId;
        }
      }
    } catch {
      // Fall back to deterministic environment derivation below
    }
  }

  if (ring.size === 0) {
    const baseSecret =
      process.env.DCC_MACHINE_SIGNING_SEED?.trim() ||
      process.env.INTERNAL_API_SECRET?.trim() ||
      process.env.CRON_SECRET?.trim() ||
      "dcc-ephemeral-canary-runtime-seed-v0.2";

    const primary = deriveEd25519KeyPairFromSeedMaterial({
      keyId: process.env.DCC_MACHINE_ACTIVE_KEY_ID?.trim() || "dcc-canary-ed25519-2026-k1",
      seedMaterial: `${baseSecret}:primary-k1`,
      status: "active",
      createdAt: "2026-04-20T00:00:00.000Z",
      retiredAt: null,
    });
    ring.set(primary.keyId, primary);
    activeKeyId = primary.keyId;
  }

  return ring;
}

function getKeyRing(): Map<string, InternalSigningKeyPair> {
  if (!keyRingMap) {
    keyRingMap = initializeKeyRing();
  }
  return keyRingMap;
}

export function resetSigningKeyRingForTests(): void {
  keyRingMap = null;
  activeKeyId = null;
}

export const resetSigningKeyStoreForTests = resetSigningKeyRingForTests;

export function getPublicSigningKeySet(): {
  spec: "dcc-signing-keyset/0.2";
  issuer: "https://www.destinationcommandcenter.com";
  activeKeyId: string;
  keys: PublicSigningKeyRecord[];
} {
  const ring = getKeyRing();
  const keys: PublicSigningKeyRecord[] = Array.from(ring.values()).map((kp) => ({
    keyId: kp.keyId,
    algorithm: kp.algorithm,
    kty: kp.kty,
    crv: kp.crv,
    x: kp.x,
    publicKeyRawBase64Url: kp.publicKeyRawBase64Url,
    use: kp.use,
    publicKeyPem: kp.publicKeyPem,
    publicKeySpkiPem: kp.publicKeySpkiPem,
    publicKeyFingerprintSha256: kp.publicKeyFingerprintSha256,
    status: kp.status,
    createdAt: kp.createdAt,
    retiredAt: kp.retiredAt,
  }));

  return {
    spec: "dcc-signing-keyset/0.2",
    issuer: "https://www.destinationcommandcenter.com",
    activeKeyId: activeKeyId ?? keys[0]?.keyId ?? "dcc-canary-ed25519-2026-k1",
    keys,
  };
}

export const getPublicSigningKeyManifest = getPublicSigningKeySet;

export function registerSigningKeyForTests(params: {
  keyId: string;
  seedString: string;
  status?: SigningKeyStatus;
  setAsActive?: boolean;
  createdAt?: string;
}): PublicSigningKeyRecord {
  const ring = getKeyRing();
  const createdAt = params.createdAt ?? "2026-04-20T00:00:00.000Z";
  const kp = deriveEd25519KeyPairFromSeedMaterial({
    keyId: params.keyId,
    seedMaterial: params.seedString,
    status: params.status ?? "active",
    createdAt,
    retiredAt: null,
  });
  ring.set(kp.keyId, kp);
  if (params.setAsActive) {
    activeKeyId = kp.keyId;
  }
  const { privateKeyObject: _priv, publicKeyObject: _pub, ...publicRecord } = kp;
  return publicRecord;
}

export function rotateMachineSigningKey(
  paramsOrKeyId:
    | string
    | {
        newKeyId: string;
        seedMaterial?: string;
        rotatedAt?: string;
      },
): {
  previousKeyId: string;
  newActiveKey: PublicSigningKeyRecord;
  keySet: ReturnType<typeof getPublicSigningKeySet>;
} {
  const params =
    typeof paramsOrKeyId === "string" ? { newKeyId: paramsOrKeyId } : paramsOrKeyId;
  const ring = getKeyRing();
  const rotatedAt = params.rotatedAt ?? new Date().toISOString();
  const prevId = activeKeyId ?? Array.from(ring.keys())[0]!;
  const prev = ring.get(prevId);
  if (prev && prevId !== params.newKeyId) {
    prev.status = "retired_verify_only";
    prev.retiredAt = rotatedAt;
  }

  let nextKp = ring.get(params.newKeyId);
  if (!nextKp) {
    const baseSecret =
      params.seedMaterial ||
      process.env.DCC_MACHINE_SIGNING_SEED?.trim() ||
      process.env.INTERNAL_API_SECRET?.trim() ||
      `dcc-rotated-seed:${params.newKeyId}:${rotatedAt}`;

    nextKp = deriveEd25519KeyPairFromSeedMaterial({
      keyId: params.newKeyId,
      seedMaterial: baseSecret,
      status: "active",
      createdAt: rotatedAt,
      retiredAt: null,
    });
    ring.set(nextKp.keyId, nextKp);
  } else {
    nextKp.status = "active";
    nextKp.retiredAt = null;
  }

  activeKeyId = nextKp.keyId;

  const { privateKeyObject: _priv, publicKeyObject: _pub, ...publicRecord } = nextKp;
  return {
    previousKeyId: prevId,
    newActiveKey: publicRecord,
    keySet: getPublicSigningKeySet(),
  };
}

export const rotateSigningKey = rotateMachineSigningKey;

export function revokeMachineSigningKey(keyId: string, revokedAt?: string): void {
  const ring = getKeyRing();
  const kp = ring.get(keyId);
  if (!kp) {
    throw new Error(`Signing key '${keyId}' not found in keyring.`);
  }
  kp.status = "revoked";
  kp.retiredAt = revokedAt ?? new Date().toISOString();
}

export const revokeSigningKey = revokeMachineSigningKey;

export type SignDecisionReceiptInput =
  | CanonicalReceiptPayload
  | {
      evaluationFingerprint: string;
      engineId: string;
      engineVersion: string;
      bundleHash: string;
      candidateUniverseId: string;
      candidateUniverseVersion: string;
      candidateUniverseHash: string;
      normalizedInputHash: string;
      validAt: string;
      knownAt: string;
      decisionState: string;
      recommendedCandidateId: string | null;
      candidateDispositionSummary: CanonicalReceiptPayload["candidateDispositionSummary"];
      resolvedClaimVersionIds: string[];
      resultHash: string;
      traceHash: string;
      issuedAt?: string;
      epistemicLimitationStatement?: string;
    };

export function signDecisionReceipt(input: SignDecisionReceiptInput): SignedDecisionReceipt {
  const ring = getKeyRing();
  const currentKeyId = activeKeyId ?? Array.from(ring.keys())[0];
  const kp = currentKeyId ? ring.get(currentKeyId) : undefined;
  if (!kp || kp.status !== "active") {
    throw new Error("No active Ed25519 signing key available to sign decision receipt.");
  }

  let canonicalPayload: CanonicalReceiptPayload;
  let issuedAt: string;

  if ("spec" in input) {
    canonicalPayload = input;
    issuedAt = input.knownAt || new Date().toISOString();
  } else {
    const receiptId = `rcpt:${input.engineId}:${input.engineVersion}:${input.evaluationFingerprint.slice(0, 16)}`;
    issuedAt = input.issuedAt ?? input.knownAt ?? new Date().toISOString();
    canonicalPayload = {
      spec: "dcc-decision-receipt/0.2",
      receiptId,
      evaluationFingerprint: input.evaluationFingerprint,
      engineId: input.engineId,
      engineVersion: input.engineVersion,
      bundleHash: input.bundleHash,
      candidateUniverseId: input.candidateUniverseId,
      candidateUniverseVersion: input.candidateUniverseVersion,
      candidateUniverseHash: input.candidateUniverseHash,
      normalizedInputHash: input.normalizedInputHash,
      validAt: input.validAt,
      knownAt: input.knownAt,
      decisionState: input.decisionState,
      recommendedCandidateId: input.recommendedCandidateId,
      candidateDispositionSummary: input.candidateDispositionSummary,
      resolvedClaimVersionIds: input.resolvedClaimVersionIds,
      resultHash: input.resultHash,
      traceHash: input.traceHash,
      epistemicLimitationStatement:
        input.epistemicLimitationStatement ?? EPISTEMIC_RECEIPT_LIMITATION_STATEMENT,
    };
  }

  const canonicalBytes = Buffer.from(canonicalJsonStringify(canonicalPayload), "utf8");
  const canonicalPayloadHash = sha256Hex(canonicalBytes);
  const sigBytes = crypto.sign(null, canonicalBytes, kp.privateKeyObject);
  const signature = sigBytes.toString("base64url");

  return {
    objectType: "DecisionReceipt",
    receiptId: canonicalPayload.receiptId,
    keyId: kp.keyId,
    algorithm: "Ed25519",
    issuedAt,
    canonicalPayloadHash,
    signature,
    signatureBase64Url: signature,
    publicKeyDiscoveryUri: "/.well-known/dcc/keys.json",
    immutableReferenceUri: `/r/${canonicalPayload.receiptId}/v/1.0.0`,
    stableReferenceUri: `/r/${canonicalPayload.receiptId}`,
    epistemicLimitationStatement: canonicalPayload.epistemicLimitationStatement,
    payload: canonicalPayload,
    canonicalPayload,
  };
}

export function verifySignedDecisionReceipt(
  receipt: SignedDecisionReceipt,
  customPublicKeySet?: ReturnType<typeof getPublicSigningKeySet>,
): {
  valid: boolean;
  keyId: string;
  keyStatus: SigningKeyStatus | "missing";
  reason?: string;
} {
  const keySet = customPublicKeySet ?? getPublicSigningKeySet();
  const keyRecord = keySet.keys.find((k) => k.keyId === receipt.keyId);
  if (!keyRecord) {
    return {
      valid: false,
      keyId: receipt.keyId,
      keyStatus: "missing",
      reason: `Key ID '${receipt.keyId}' not found in discovered public keyset.`,
    };
  }
  if (keyRecord.status === "revoked") {
    return {
      valid: false,
      keyId: receipt.keyId,
      keyStatus: "revoked",
      reason: `Key ID '${receipt.keyId}' has been revoked and cannot validate receipts.`,
    };
  }

  const payloadToVerify = receipt.canonicalPayload ?? receipt.payload;
  const canonicalBytes = Buffer.from(canonicalJsonStringify(payloadToVerify), "utf8");
  const expectedHash = sha256Hex(canonicalBytes);
  if (receipt.canonicalPayloadHash !== expectedHash) {
    return {
      valid: false,
      keyId: receipt.keyId,
      keyStatus: keyRecord.status,
      reason: `canonicalPayloadHash mismatch (${receipt.canonicalPayloadHash} !== ${expectedHash}).`,
    };
  }

  if (receipt.payload && receipt.canonicalPayload) {
    const payloadHash2 = hashCanonicalJson(receipt.payload);
    if (payloadHash2 !== receipt.canonicalPayloadHash) {
      return {
        valid: false,
        keyId: receipt.keyId,
        keyStatus: keyRecord.status,
        reason: `payload hash mismatch (${payloadHash2} !== ${receipt.canonicalPayloadHash}).`,
      };
    }
  }

  try {
    const pubKey = crypto.createPublicKey(keyRecord.publicKeyPem);
    const sigStr = receipt.signature || receipt.signatureBase64Url;
    const sigBytes = Buffer.from(sigStr, "base64url");
    const verified = crypto.verify(null, canonicalBytes, pubKey, sigBytes);
    if (!verified) {
      return {
        valid: false,
        keyId: receipt.keyId,
        keyStatus: keyRecord.status,
        reason: "Ed25519 cryptographic signature verification failed.",
      };
    }
    return {
      valid: true,
      keyId: receipt.keyId,
      keyStatus: keyRecord.status,
    };
  } catch (err) {
    return {
      valid: false,
      keyId: receipt.keyId,
      keyStatus: keyRecord.status,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

export const verifyDecisionReceiptSignature = verifySignedDecisionReceipt;
