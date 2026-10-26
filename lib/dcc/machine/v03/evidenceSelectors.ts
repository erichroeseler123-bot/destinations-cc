import { rfc8785Canonicalize, sha256HexFull } from "./rfc8785AndJws";

/**
 * DCC Machine Layer v0.3 — W3C & Structured Evidence Selectors + Public/Private Boundary
 *
 * Supports:
 * - W3C TextQuoteSelector (`exact`, `prefix`, `suffix`)
 * - W3C TextPositionSelector (`start`, `end` code-unit offsets)
 * - W3C FragmentSelector (`value`, `conformsTo`)
 * - RFC 6901 JSON Pointer (`pointer`)
 * - RFC 9535 JSONPath (`path`)
 * - W3C Media Fragments (`mediaDimension`, `value`)
 * - Full 64-hex SHA-256 `evidenceHash` and `snapshotSha256`
 * - Extractor identity/version, extraction time, and bounded surrounding context
 * - Public citation projection sanitizer that strips private raw capture URIs and full raw bodies
 */

export interface W3CTextQuoteSelector {
  type: "TextQuoteSelector";
  exact: string;
  prefix?: string;
  suffix?: string;
}

export interface W3CTextPositionSelector {
  type: "TextPositionSelector";
  start: number;
  end: number;
}

export interface W3CFragmentSelector {
  type: "FragmentSelector";
  value: string;
  conformsTo:
    | "http://tools.ietf.org/rfc/rfc5147"
    | "https://html.spec.whatwg.org/"
    | "http://www.w3.org/TR/media-frags/";
}

export interface JsonPointerSelector {
  type: "JsonPointerSelector";
  pointer: string;
  resolvedValue: unknown;
}

export interface JsonPathSelector {
  type: "JsonPathSelector";
  path: string;
  resolvedValues: unknown[];
}

export interface MediaFragmentSelector {
  type: "MediaFragmentSelector";
  mediaDimension: "temporal" | "spatial" | "track";
  value: string;
}

export type V03EvidenceSelector =
  | W3CTextQuoteSelector
  | W3CTextPositionSelector
  | W3CFragmentSelector
  | JsonPointerSelector
  | JsonPathSelector
  | MediaFragmentSelector;

export interface V03ExtractorIdentity {
  extractorId: string;
  extractorVersion: string;
  method: "deterministic_dom_selector" | "deterministic_json_pointer" | "deterministic_regex_span";
}

export interface V03EvidenceReference {
  evidenceRefId: string;
  sourceDccId: string;
  sourceTitle: string;
  sourceOrganization: string;
  canonicalSourceUrl: string;
  snapshotId: string;
  snapshotSha256: string;
  privateObjectKey: string;
  derivedTextSnapshotId?: string | null;
  derivedTextSnapshotSha256?: string | null;
  privateDerivedTextObjectKey?: string | null;
  httpStatus?: number;
  responseHeaders?: Record<string, string>;
  provenanceClass?: "network_capture_verified" | "synthetic_fixture" | "withdrawn_unsupported";
  isSynthetic?: boolean;
  lifecycleState?: "active" | "withdrawn";
  withdrawn?: boolean;
  withdrawnAt?: string | null;
  withdrawalReason?: string | null;
  withdrawalEventId?: string | null;
  selectors: V03EvidenceSelector[];
  surroundingContext: {
    before: string;
    exactMatch: string;
    after: string;
  };
  extractor: V03ExtractorIdentity;
  extractedAt: string;
  retrievedAt: string;
  sourcePublishedAt: string | null;
  sourceObservedAt: string | null;
  licenseOrReusePolicy: string;
  evidenceHash: string;
}

export interface V03PublicCitationProjection {
  evidenceRefId: string;
  sourceDccId: string;
  sourceTitle: string;
  sourceOrganization: string;
  canonicalSourceUrl: string;
  snapshotId: string;
  snapshotSha256: string;
  derivedTextSnapshotId?: string | null;
  derivedTextSnapshotSha256?: string | null;
  httpStatus?: number;
  responseHeaders?: Record<string, string>;
  provenanceClass: "network_capture_verified" | "synthetic_fixture" | "withdrawn_unsupported";
  isSynthetic: boolean;
  lifecycleState: "active" | "withdrawn";
  withdrawn: boolean;
  withdrawnAt: string | null;
  withdrawalReason: string | null;
  withdrawalEventId: string | null;
  selectors: V03EvidenceSelector[];
  surroundingContext: {
    before: string;
    exactMatch: string;
    after: string;
  };
  extractor: V03ExtractorIdentity;
  extractedAt: string;
  retrievedAt: string;
  sourcePublishedAt: string | null;
  sourceObservedAt: string | null;
  licenseOrReusePolicy: string;
  evidenceHash: string;
  rawCaptureExposedPublicly: false;
  accessBoundaryNotice: string;
}

/**
 * Evaluates a W3C TextQuoteSelector + TextPositionSelector against a raw text document.
 */
export function extractTextEvidenceSelectors(params: {
  documentText: string;
  exactQuote: string;
  fragmentConformsTo?: W3CFragmentSelector["conformsTo"];
  fragmentValue?: string;
  contextRadiusChars?: number;
}): {
  selectors: V03EvidenceSelector[];
  surroundingContext: { before: string; exactMatch: string; after: string };
} {
  const idx = params.documentText.indexOf(params.exactQuote);
  if (idx < 0) {
    throw new Error(`Exact quote "${params.exactQuote}" not found in source document.`);
  }
  const radius = params.contextRadiusChars ?? 48;
  const start = idx;
  const end = idx + params.exactQuote.length;
  const prefix = params.documentText.slice(Math.max(0, start - radius), start);
  const suffix = params.documentText.slice(end, Math.min(params.documentText.length, end + radius));

  const selectors: V03EvidenceSelector[] = [
    {
      type: "TextQuoteSelector",
      exact: params.exactQuote,
      prefix,
      suffix,
    },
    {
      type: "TextPositionSelector",
      start,
      end,
    },
  ];

  if (params.fragmentValue) {
    selectors.push({
      type: "FragmentSelector",
      value: params.fragmentValue,
      conformsTo: params.fragmentConformsTo ?? "http://tools.ietf.org/rfc/rfc5147",
    });
  }

  return {
    selectors,
    surroundingContext: {
      before: prefix,
      exactMatch: params.exactQuote,
      after: suffix,
    },
  };
}

/**
 * Evaluates an RFC 6901 JSON Pointer (`/a/b/0`) against a structured JSON document.
 */
export function resolveJsonPointer(doc: unknown, pointer: string): unknown {
  if (pointer === "" || pointer === "/") return doc;
  if (!pointer.startsWith("/")) {
    throw new Error(`Invalid RFC 6901 JSON Pointer "${pointer}": must start with "/".`);
  }
  const tokens = pointer
    .slice(1)
    .split("/")
    .map((t) => t.replace(/~1/g, "/").replace(/~0/g, "~"));
  let current: any = doc;
  for (const token of tokens) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      const idx = Number(token);
      current = Number.isInteger(idx) ? current[idx] : undefined;
    } else if (typeof current === "object") {
      current = current[token];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Creates a content-addressed `V03EvidenceReference` with full 64-char SHA-256 `evidenceHash`.
 */
export function buildV03EvidenceReference(
  params: Omit<V03EvidenceReference, "evidenceHash">,
): V03EvidenceReference {
  const canonicalCore = rfc8785Canonicalize({
    evidenceRefId: params.evidenceRefId,
    sourceDccId: params.sourceDccId,
    canonicalSourceUrl: params.canonicalSourceUrl,
    snapshotId: params.snapshotId,
    snapshotSha256: params.snapshotSha256,
    selectors: params.selectors,
    surroundingContext: params.surroundingContext,
    extractor: params.extractor,
    extractedAt: params.extractedAt,
    retrievedAt: params.retrievedAt,
  });
  return {
    ...params,
    evidenceHash: sha256HexFull(canonicalCore),
  };
}

/**
 * Enforces the public/private evidence boundary:
 * Strips `privateObjectKey` and any raw capture bytes from public citation responses,
 * exposing only the permitted bounded selectors, excerpt, context, and cryptographic hashes.
 */
export function toPublicCitationProjection(
  ref: V03EvidenceReference,
): V03PublicCitationProjection {
  const isWithdrawn = ref.lifecycleState === "withdrawn" || ref.withdrawn === true;
  return {
    evidenceRefId: ref.evidenceRefId,
    sourceDccId: ref.sourceDccId,
    sourceTitle: ref.sourceTitle,
    sourceOrganization: ref.sourceOrganization,
    canonicalSourceUrl: ref.canonicalSourceUrl,
    snapshotId: ref.snapshotId,
    snapshotSha256: ref.snapshotSha256,
    derivedTextSnapshotId: ref.derivedTextSnapshotId ?? null,
    derivedTextSnapshotSha256: ref.derivedTextSnapshotSha256 ?? null,
    httpStatus: ref.httpStatus,
    responseHeaders: ref.responseHeaders,
    provenanceClass:
      ref.provenanceClass ??
      (isWithdrawn
        ? "withdrawn_unsupported"
        : ref.isSynthetic
          ? "synthetic_fixture"
          : "network_capture_verified"),
    isSynthetic: ref.isSynthetic ?? false,
    lifecycleState: isWithdrawn ? "withdrawn" : "active",
    withdrawn: isWithdrawn,
    withdrawnAt: ref.withdrawnAt ?? null,
    withdrawalReason: ref.withdrawalReason ?? null,
    withdrawalEventId: ref.withdrawalEventId ?? null,
    selectors: ref.selectors,
    surroundingContext: {
      before: ref.surroundingContext.before.slice(-160),
      exactMatch: ref.surroundingContext.exactMatch.slice(0, 600),
      after: ref.surroundingContext.after.slice(0, 160),
    },
    extractor: ref.extractor,
    extractedAt: ref.extractedAt,
    retrievedAt: ref.retrievedAt,
    sourcePublishedAt: ref.sourcePublishedAt,
    sourceObservedAt: ref.sourceObservedAt,
    licenseOrReusePolicy: ref.licenseOrReusePolicy,
    evidenceHash: ref.evidenceHash,
    rawCaptureExposedPublicly: false,
    accessBoundaryNotice: isWithdrawn
      ? `WITHDRAWN EVIDENCE RECORD (${ref.withdrawalEventId ?? "recorded_withdrawal"}): This citation has been withdrawn via recorded correction/withdrawal event and is NOT current verified operational evidence. Preserved solely for immutable historical audit.`
      : "Public citation projection exposes only bounded W3C/JSON selectors, short surrounding context, and SHA-256 snapshot digest. Full raw source captures are retained in private storage and never served publicly.",
  };
}
