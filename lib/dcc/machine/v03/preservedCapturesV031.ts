import fs from "node:fs";
import path from "node:path";
import {
  buildV03EvidenceReference,
  extractTextEvidenceSelectors,
  resolveJsonPointer,
  type V03EvidenceReference,
} from "./evidenceSelectors";
import { sha256HexFull } from "./rfc8785AndJws";
import {
  buildContentAddressedKey,
  type ContentAddressedWriteResult,
  type PrivateArtifactObjectStore,
} from "./storageBoundary";

export interface PreservedHttpCaptureRecordV031 {
  captureId: string;
  domain: "gosno" | "juneau";
  sourceId: string;
  sourceTitle: string;
  sourceOrganization: string;
  sourceClass:
    | "first_party_telemetry"
    | "first_party_operational_system"
    | "operator_published_terms"
    | "official_government_feed";
  uri: string;
  url: string;
  finalUrl: string;
  httpMethod: "GET";
  httpStatus: number;
  contentType: string;
  retrievedAt: string;
  responseHeaders: Record<string, string>;
  rawBodyUtf8: string;
  rawByteLength: number;
  rawSha256: string;
  derivedTextUtf8: string;
  derivedTextByteLength: number;
  derivedTextSha256: string;
  extractorVersion: string;
  sourcePublishedAt: string | null;
  lastModifiedHeader: string | null;
  etagHeader: string | null;
}

interface PreservedCaptureBundleV031 {
  capturedSuiteVersion: string;
  captures: Record<string, PreservedHttpCaptureRecordV031>;
}

const CAPTURE_METADATA_BY_ID: Record<
  string,
  { sourceTitle: string; sourceOrganization: string }
> = {
  "cap:gosno:route-feed-json": {
    sourceTitle: "GoSno Public Route & Tariff Feed (/api/public/route-feed)",
    sourceOrganization: "GoSno Private Mountain Transportation",
  },
  "cap:gosno:agent-json": {
    sourceTitle: "GoSno Machine Agent Manifest (/agent.json)",
    sourceOrganization: "GoSno Private Mountain Transportation",
  },
  "cap:gosno:llms-txt": {
    sourceTitle: "GoSno LLMs Operational Specification (/llms.txt)",
    sourceOrganization: "GoSno Private Mountain Transportation",
  },
  "cap:gosno:winter-park-html": {
    sourceTitle: "GoSno Denver / DEN to Winter Park Private Transfer Page (/winter-park)",
    sourceOrganization: "GoSno Private Mountain Transportation",
  },
  "cap:gosno:denver-to-breckenridge-html": {
    sourceTitle:
      "GoSno Denver / DEN to Breckenridge Private Transfer Page (/denver-to-breckenridge)",
    sourceOrganization: "GoSno Private Mountain Transportation",
  },
  "cap:juneau:coastal-icefield-excursion-html": {
    sourceTitle: "Coastal Helicopters — Icefield Excursion Product & Policy Page",
    sourceOrganization: "Coastal Helicopters, Inc.",
  },
  "cap:juneau:coastal-faq-html": {
    sourceTitle: "Coastal Helicopters — Passenger Weight, Safety & Mobility FAQs",
    sourceOrganization: "Coastal Helicopters, Inc.",
  },
  "cap:juneau:temsco-mendenhall-glacier-html": {
    sourceTitle:
      "TEMSCO Helicopters — Mendenhall Glacier Helicopter Tour & Passenger Policy Page",
    sourceOrganization: "TEMSCO Helicopters, Inc.",
  },
  "cap:juneau:northstar-walkabout-html": {
    sourceTitle: "NorthStar Trekking — Glacier Walkabout Product & Requirements Page",
    sourceOrganization: "NorthStar Trekking",
  },
  "cap:juneau:northstar-faqs-html": {
    sourceTitle: "NorthStar Trekking — Weight, Gear & Glacier Trekking FAQs",
    sourceOrganization: "NorthStar Trekking",
  },
  "cap:juneau:faa-weathercams-html": {
    sourceTitle: "FAA Aviation Weather Camera Program Portal",
    sourceOrganization: "Federal Aviation Administration (FAA)",
  },
};

let cachedBundle: PreservedCaptureBundleV031 | null = null;

export function loadPreservedCapturesBundleV031(): PreservedCaptureBundleV031 {
  if (cachedBundle) return cachedBundle;
  const candidatePaths = [
    path.join(process.cwd(), "data", "machine", "v03", "preserved_captures_v031.json"),
    path.resolve(__dirname, "../../../../data/machine/v03/preserved_captures_v031.json"),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      const rawParsed = JSON.parse(fs.readFileSync(p, "utf8")) as {
        capturedSuiteVersion: string;
        captures: Record<string, Record<string, any>>;
      };
      const normalizedCaptures: Record<string, PreservedHttpCaptureRecordV031> = {};
      for (const [id, rec] of Object.entries(rawParsed.captures)) {
        const meta = CAPTURE_METADATA_BY_ID[id] ?? {
          sourceTitle: String(rec.sourceTitle ?? rec.uri ?? id),
          sourceOrganization: String(rec.sourceOrganization ?? rec.sourceId ?? id),
        };
        normalizedCaptures[id] = {
          ...(rec as PreservedHttpCaptureRecordV031),
          url: String(rec.url ?? rec.uri),
          uri: String(rec.uri ?? rec.url),
          sourceTitle: String(rec.sourceTitle ?? meta.sourceTitle),
          sourceOrganization: String(rec.sourceOrganization ?? meta.sourceOrganization),
        };
      }
      cachedBundle = {
        capturedSuiteVersion: rawParsed.capturedSuiteVersion,
        captures: normalizedCaptures,
      };
      return cachedBundle;
    }
  }
  throw new Error(
    "PRESERVED_CAPTURES_MISSING: data/machine/v03/preserved_captures_v031.json not found.",
  );
}

export function getPreservedCaptureByIdV031(captureId: string): PreservedHttpCaptureRecordV031 {
  const bundle = loadPreservedCapturesBundleV031();
  const cap = bundle.captures[captureId];
  if (!cap) {
    throw new Error(`PRESERVED_CAPTURE_NOT_FOUND: No preserved capture with id "${captureId}".`);
  }
  return cap;
}

export interface PersistedCaptureArtifactsV031 {
  capture: PreservedHttpCaptureRecordV031;
  rawSha256: string;
  rawObjectKey: string;
  derivedTextSha256: string;
  derivedTextObjectKey: string | null;
  rawObjectReceipt: ContentAddressedWriteResult;
  derivedTextObjectReceipt: ContentAddressedWriteResult | null;
}

/**
 * Stores the verbatim HTTP response bytes in private storage (`raw_source_captures`),
 * verifies that the computed SHA-256 matches `capture.rawSha256`, and when derived text
 * is distinct from the raw response body (e.g. HTML -> plain text), stores the derived
 * text as a separate private object linked to the original response.
 */
export async function persistPreservedCaptureToObjectStore(params: {
  capture: PreservedHttpCaptureRecordV031;
  objectStore: PrivateArtifactObjectStore;
}): Promise<PersistedCaptureArtifactsV031> {
  const { capture, objectStore } = params;
  const computedRawSha = sha256HexFull(Buffer.from(capture.rawBodyUtf8, "utf8"));
  if (computedRawSha !== capture.rawSha256) {
    throw new Error(
      `PRESERVED_RAW_HASH_MISMATCH for ${capture.captureId}: expected ${capture.rawSha256}, got ${computedRawSha}`,
    );
  }

  const ext = capture.contentType.includes("json")
    ? "json"
    : capture.contentType.includes("html")
      ? "html"
      : "txt";

  const rawObjectReceipt = await objectStore.putContentAddressedArtifact({
    category: "raw_source_captures",
    body: capture.rawBodyUtf8,
    contentType: capture.contentType,
    extension: ext,
  });

  let derivedTextObjectReceipt: ContentAddressedWriteResult | null = null;
  if (capture.derivedTextSha256 !== capture.rawSha256) {
    const computedDerivedSha = sha256HexFull(Buffer.from(capture.derivedTextUtf8, "utf8"));
    if (computedDerivedSha !== capture.derivedTextSha256) {
      throw new Error(
        `PRESERVED_DERIVED_HASH_MISMATCH for ${capture.captureId}: expected ${capture.derivedTextSha256}, got ${computedDerivedSha}`,
      );
    }
    derivedTextObjectReceipt = await objectStore.putContentAddressedArtifact({
      category: "raw_source_captures",
      body: capture.derivedTextUtf8,
      contentType: "text/plain; charset=utf-8",
      extension: "derived.txt",
    });
  }

  return {
    capture,
    rawSha256: rawObjectReceipt.sha256Hex,
    rawObjectKey: rawObjectReceipt.objectKey,
    derivedTextSha256: derivedTextObjectReceipt
      ? derivedTextObjectReceipt.sha256Hex
      : rawObjectReceipt.sha256Hex,
    derivedTextObjectKey: derivedTextObjectReceipt
      ? derivedTextObjectReceipt.objectKey
      : null,
    rawObjectReceipt,
    derivedTextObjectReceipt,
  };
}

export async function persistPreservedCaptureToPrivateStoreV031(
  objectStore: PrivateArtifactObjectStore,
  captureId: string,
): Promise<PersistedCaptureArtifactsV031> {
  const capture = getPreservedCaptureByIdV031(captureId);
  return persistPreservedCaptureToObjectStore({ capture, objectStore });
}

/**
 * Builds a `V03EvidenceReference` anchored to a preserved HTTP capture (`PreservedHttpCaptureRecordV031`).
 * Evaluates W3C `TextQuoteSelector` + `TextPositionSelector` (and optional `JsonPointerSelector`)
 * against the derived text (or raw text if JSON/plain), recording both the raw HTTP response
 * digest (`snapshotSha256`) and the derived text digest (`derivedTextSnapshotSha256`) plus
 * `extractorVersion`. Never fabricates `sourcePublishedAt` (remains `null` unless present in the source).
 */
export function buildEvidenceRefFromPreservedCapture(params: {
  evidenceRefId: string;
  sourceDccId?: string;
  sourceTitle?: string;
  sourceOrganization?: string;
  capture?: PreservedHttpCaptureRecordV031;
  persisted?: PersistedCaptureArtifactsV031;
  exactQuote: string;
  jsonPointer?: string;
  jsonPointerResolvedValue?: unknown;
  fragmentValue?: string;
  licenseOrReusePolicy?: string;
}): V03EvidenceReference {
  const capture = params.capture ?? params.persisted?.capture;
  if (!capture) {
    throw new Error(`buildEvidenceRefFromPreservedCapture requires capture or persisted`);
  }

  const ext = capture.contentType.includes("json")
    ? "json"
    : capture.contentType.includes("html")
      ? "html"
      : "txt";
  const rawKey =
    params.persisted?.rawObjectKey ??
    buildContentAddressedKey({
      category: "raw_source_captures",
      sha256Hex: capture.rawSha256,
      extension: ext,
    });
  const hasSeparateDerived = capture.derivedTextSha256 !== capture.rawSha256;
  const derivedKey = hasSeparateDerived
    ? (params.persisted?.derivedTextObjectKey ??
      buildContentAddressedKey({
        category: "raw_source_captures",
        sha256Hex: capture.derivedTextSha256,
        extension: "derived.txt",
      }))
    : null;

  const targetDocument = capture.derivedTextUtf8;
  const extracted = extractTextEvidenceSelectors({
    documentText: targetDocument,
    exactQuote: params.exactQuote,
    fragmentValue: params.fragmentValue,
  });

  const selectors = [...extracted.selectors];
  if (params.jsonPointer) {
    const resolvedValue =
      params.jsonPointerResolvedValue !== undefined
        ? params.jsonPointerResolvedValue
        : resolveJsonPointer(JSON.parse(capture.rawBodyUtf8), params.jsonPointer);
    selectors.push({
      type: "JsonPointerSelector",
      pointer: params.jsonPointer,
      resolvedValue,
    });
  }

  return buildV03EvidenceReference({
    evidenceRefId: params.evidenceRefId,
    sourceDccId: params.sourceDccId ?? capture.sourceId,
    sourceTitle: params.sourceTitle ?? capture.sourceTitle,
    sourceOrganization: params.sourceOrganization ?? capture.sourceOrganization,
    canonicalSourceUrl: capture.uri,
    snapshotId: `snap:${capture.captureId}`,
    snapshotSha256: capture.rawSha256,
    privateObjectKey: rawKey,
    derivedTextSnapshotId: hasSeparateDerived ? `snap:derived:${capture.captureId}` : null,
    derivedTextSnapshotSha256: hasSeparateDerived ? capture.derivedTextSha256 : null,
    privateDerivedTextObjectKey: derivedKey,
    httpStatus: capture.httpStatus,
    responseHeaders: capture.responseHeaders,
    provenanceClass: "network_capture_verified",
    isSynthetic: false,
    lifecycleState: "active",
    withdrawn: false,
    withdrawnAt: null,
    withdrawalReason: null,
    withdrawalEventId: null,
    selectors,
    surroundingContext: extracted.surroundingContext,
    extractor: {
      extractorId: "dcc-preserved-capture-selector",
      extractorVersion: capture.extractorVersion,
      method: params.jsonPointer ? "deterministic_json_pointer" : "deterministic_dom_selector",
    },
    extractedAt: capture.retrievedAt,
    retrievedAt: capture.retrievedAt,
    sourcePublishedAt: capture.sourcePublishedAt,
    sourceObservedAt: null,
    licenseOrReusePolicy:
      params.licenseOrReusePolicy ??
      "Bounded W3C selector excerpt only; verbatim raw HTTP response retained in private storage.",
  });
}

export const buildEvidenceRefFromPreservedCaptureV031 = buildEvidenceRefFromPreservedCapture;
