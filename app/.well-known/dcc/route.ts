import {
  buildMachineJsonResponse,
  DCC_MACHINE_JSON_SCHEMAS,
  enforceMachineLayerFeatureFlag,
  getDeploymentProvenanceV03,
  getMachineStore,
  listMachineCandidateUniverses,
  listMachineEngines,
  V03_JSON_SCHEMAS,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.destinationcommandcenter.com";

export async function GET() {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  const store = getMachineStore();
  const engines = listMachineEngines();
  const universes = listMachineCandidateUniverses();
  const provenance = getDeploymentProvenanceV03();

  return buildMachineJsonResponse(
    {
      ok: true,
      spec: "dcc-machine-layer/0.1",
      specVersion: "0.3.0",
      protocolVersion: "0.3.0",
      irSchemaVersion: "dcc-decision-ir/0.1",
      referenceEnvelopeSpec: "dcc-reference-envelope/0.1",
      featureFlag: "DCC_MACHINE_V1",
      primaryMission:
        "Machine-native append-only evidence graph, universal Decision IR compiler, deterministic evaluation runtime, RFC 8785 + JWS EdDSA signed decision receipts, declared candidate universes, shadow-mode DecisionAuthorization, and immutable reference resolver.",
      epistemicGuarantees: [
        "All claim and entity mutations are recorded as append-only knowledge events (dcc_v03_knowledge_events) with immutable hash-chain integrity; mutable projections are 100% rebuildable from the event ledger.",
        "Current evaluations use a server-established knowledgeCutoff and reject client-supplied knownAt with HTTP 400 CLIENT_SUPPLIED_KNOWN_AT_FORBIDDEN.",
        "Every claim separates assertionType, epistemicState, lifecycleState, computed freshnessState, and sourceAuthority competence domains.",
        "Every evaluation binds to one exact versioned, content-addressed CandidateUniverse (with full 64-hex SHA-256 universeHash) and classifies every candidate as eligible, qualified, ineligible, or indeterminate.",
        "Every v0.3 decision receipt is canonicalized per RFC 8785 (JCS), signed as standard JWS Compact Serialization (alg=EdDSA), identified by a full 64-hex SHA-256 receiptId (rcpt:sha256:<64-hex>), and independently verifiable via /.well-known/jwks.json.",
        "Public citation endpoints (/r/{id}) expose only permitted W3C selector projections and SHA-256 digests, never raw private evidence captures.",
        "Evaluation hot path executes zero external network calls, zero LLM calls, and zero HTML scraping.",
      ],
      endpoints: {
        discovery: `${SITE_URL}/.well-known/dcc`,
        apiCatalog: `${SITE_URL}/.well-known/api-catalog`,
        jwks: `${SITE_URL}/.well-known/jwks.json`,
        publicKeyDiscovery: `${SITE_URL}/.well-known/dcc/keys.json`,
        mcpDiscovery: `${SITE_URL}/.well-known/mcp.json`,
        mcpEndpoint: `${SITE_URL}/api/v1/mcp`,
        agentManifest: `${SITE_URL}/agent.json`,
        openApi: `${SITE_URL}/openapi.json`,
        entityById: `${SITE_URL}/api/v1/entities/{id}`,
        claimById: `${SITE_URL}/api/v1/claims/{id}`,
        sourceById: `${SITE_URL}/api/v1/sources/{id}`,
        ruleById: `${SITE_URL}/api/v1/rules/{id}`,
        engineById: `${SITE_URL}/api/v1/engines/{id}`,
        bundleByEngineAndVersion: `${SITE_URL}/api/v1/bundles/{engineId}/{version}`,
        candidateUniverseById: `${SITE_URL}/api/v1/universes/{id}`,
        receiptById: `${SITE_URL}/api/v1/receipts/{id}`,
        receiptReplay: `${SITE_URL}/api/v1/receipts/{id}/replay`,
        evaluate: `${SITE_URL}/api/v1/evaluate`,
        evaluateV03: `${SITE_URL}/api/v1/v03/evaluate`,
        evaluateBatch: `${SITE_URL}/api/v1/evaluations:batch`,
        authorizations: `${SITE_URL}/api/v1/authorizations`,
        conformanceFixtures: `${SITE_URL}/api/v1/conformance/fixtures`,
        provenance: `${SITE_URL}/api/v1/provenance`,
        receiptVerificationDocs: `${SITE_URL}/api/v1/docs/receipt-verification`,
        citationVerificationDocs: `${SITE_URL}/api/v1/docs/citation-verification`,
        changesFeed: `${SITE_URL}/api/v1/changes?since={cursor}`,
        stableReferenceResolver: `${SITE_URL}/r/{id}`,
        immutableReferenceResolver: `${SITE_URL}/r/{id}/v/{version}`,
        humanInspector: `${SITE_URL}/machine/inspector`,
      },
      contentNegotiation: {
        referenceEndpoints: ["/r/{id}", "/r/{id}/v/{version}"],
        supportedMediaTypes: [
          "application/json",
          "application/ld+json",
          "application/vnd.citationstyles.csl+json",
          "text/html",
        ],
        supportedMethods: ["GET", "HEAD"],
        immutableCacheControl: "public, max-age=31536000, immutable",
      },
      activeEngines: engines.map((e) => ({
        engineId: e.id,
        title: e.title,
        domainCategory: e.domainCategory,
        activeVersion: e.activeVersion,
        availableVersions: e.availableVersions,
        activeBundleUri: e.activeBundleUri,
        stableReferenceUri: e.stableReferenceUri,
        immutableReferenceUri: e.immutableReferenceUri,
      })),
      activeCandidateUniverses: universes.map((u) => ({
        universeId: u.universeId,
        version: u.version,
        engineId: u.engineId,
        engineVersion: u.engineVersion,
        canonicalHash: u.canonicalHash,
        includedCandidateCount: u.includedCandidateIds.length,
        coverageStatus: u.coverageStatus,
        stableReferenceUri: u.stableReferenceUri,
        immutableReferenceUri: u.immutableReferenceUri,
      })),
      graphCounts: {
        entities: store.entitiesById.size,
        sources: store.sourcesById.size,
        sourceSnapshots: store.sourceSnapshotsById.size,
        evidenceFragments: store.evidenceFragmentsById.size,
        claims: store.claimsById.size,
        claimVersions: store.claimVersionsById.size,
        rules: store.rulesById.size,
        engines: store.enginesById.size,
        compiledBundles: store.bundlesById.size,
        candidateUniverses: store.candidateUniversesById.size,
        changeEvents: store.changeEvents.length,
      },
      schemas: DCC_MACHINE_JSON_SCHEMAS,
      v03Schemas: V03_JSON_SCHEMAS,
      provenance,
    },
    {
      cacheControl: "public, max-age=60, s-maxage=60",
    },
  );
}
