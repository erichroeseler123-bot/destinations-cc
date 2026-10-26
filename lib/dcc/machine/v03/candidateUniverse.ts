import { rfc8785Canonicalize, sha256HexFull } from "./rfc8785AndJws";

/**
 * DCC Machine Layer v0.3 — Strengthened Candidate Universes
 *
 * Implements Requirement 8:
 * Each CandidateUniverse discloses:
 * - `scope`
 * - `inclusionMethod`
 * - `sourcesAndQueriesConsulted`
 * - `includedCandidates` (bound to DCC-native opaque entity IDs)
 * - `knownExclusions`
 * - `coverageGaps`
 * - `effectiveFrom` / `effectiveTo`
 * - `knowledgeCutoff` (server-established)
 * - `refreshDeadline`
 * - `generatorVersion`
 * - `universeHash` (full 64-hex SHA-256 of RFC 8785 canonical representation)
 *
 * Every candidate in the universe receives exactly one disposition during evaluation:
 * - `eligible`
 * - `qualified`
 * - `ineligible`
 * - `indeterminate`
 */

export type V03CandidateDispositionState =
  | "eligible"
  | "qualified"
  | "ineligible"
  | "indeterminate";

export interface V03UniverseCandidateEntry {
  candidateDccEntityId: string;
  legacyCandidateCode: string;
  displayName: string;
  operatorDccEntityId: string;
  operatorDisplayName: string;
  bookingChannelClass: "dcc_owned_platform" | "verified_direct_operator" | "approved_affiliate";
  wtaAttributionPresent: false;
  staticAttributes: Record<string, string | number | boolean>;
  requiredClaimIds: string[];
}

export interface V03UniverseExclusionEntry {
  externalOrLegacyIdentifier: string;
  displayName: string;
  reasonCode: string;
  explanation: string;
  supportingEvidenceRefIds: string[];
}

export interface V03UniverseCoverageGap {
  gapCode: string;
  affectedDimension: string;
  description: string;
  impactOnCompleteness: string;
}

export interface V03SourceQueryRecord {
  sourceDccId: string;
  organizationName: string;
  queryOrEndpoint: string;
  consultedAt: string;
  snapshotSha256: string;
}

export interface V03CandidateUniverse {
  objectType: "CandidateUniverse";
  spec: "dcc-candidate-universe/0.3";
  universeId: string;
  version: string;
  engineId: string;
  engineVersion: string;
  isSynthetic: boolean;
  scope: {
    destinationDccEntityId: string;
    destinationName: string;
    categorySlug: string;
    jurisdiction: string;
    geographicBounds: {
      minLat: number;
      maxLat: number;
      minLon: number;
      maxLon: number;
    };
  };
  inclusionMethod: string;
  sourcesAndQueriesConsulted: V03SourceQueryRecord[];
  includedCandidates: V03UniverseCandidateEntry[];
  knownExclusions: V03UniverseExclusionEntry[];
  coverageGaps: V03UniverseCoverageGap[];
  effectiveFrom: string;
  effectiveTo: string | null;
  knowledgeCutoff: string;
  refreshDeadline: string;
  generatorVersion: string;
  epistemicDisclaimer: string;
  universeHash: string;
}

export function buildV03CandidateUniverse(
  params: Omit<V03CandidateUniverse, "objectType" | "spec" | "universeHash">,
): V03CandidateUniverse {
  const coreWithoutHash = {
    objectType: "CandidateUniverse" as const,
    spec: "dcc-candidate-universe/0.3" as const,
    ...params,
  };
  const universeHash = sha256HexFull(rfc8785Canonicalize(coreWithoutHash));
  return {
    ...coreWithoutHash,
    universeHash,
  };
}
