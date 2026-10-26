import {
  buildMachineJsonResponse,
  DCC_MACHINE_JSON_SCHEMAS,
  enforceMachineLayerFeatureFlag,
  getMachineStore,
  listMachineEngines,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.destinationcommandcenter.com";

export async function GET() {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  const store = getMachineStore();
  const engines = listMachineEngines();

  return buildMachineJsonResponse(
    {
      ok: true,
      spec: "dcc-machine-layer/0.1",
      irSchemaVersion: "dcc-decision-ir/0.1",
      referenceEnvelopeSpec: "dcc-reference-envelope/0.1",
      featureFlag: "DCC_MACHINE_V1",
      primaryMission:
        "Machine-native evidence graph, universal Decision IR compiler, deterministic evaluation runtime, and immutable reference resolver.",
      epistemicGuarantees: [
        "Every machine claim carries a stable ID, immutable version ID, typed value, temporal bounds (valid_from/valid_to/observed_at/retrieved_at), source snapshot hash, and verbatim evidence fragment.",
        "Unknown inputs are represented explicitly as unknown in three-valued Kleene logic and are never coerced to false or 0.",
        "Stale, conflicted, or withdrawn claims can never silently support a positive recommendation.",
        "Historical claim versions and rule versions are immutable; superseding or withdrawing a claim creates a new version or retraction record while preserving the original version at /r/{id}/v/{version}.",
        "Evaluation hot path executes zero external network calls, zero LLM calls, and zero HTML scraping.",
      ],
      endpoints: {
        discovery: `${SITE_URL}/.well-known/dcc`,
        agentManifest: `${SITE_URL}/agent.json`,
        openApi: `${SITE_URL}/openapi.json`,
        entityById: `${SITE_URL}/api/v1/entities/{id}`,
        claimById: `${SITE_URL}/api/v1/claims/{id}`,
        sourceById: `${SITE_URL}/api/v1/sources/{id}`,
        ruleById: `${SITE_URL}/api/v1/rules/{id}`,
        engineById: `${SITE_URL}/api/v1/engines/{id}`,
        bundleByEngineAndVersion: `${SITE_URL}/api/v1/bundles/{engineId}/{version}`,
        evaluate: `${SITE_URL}/api/v1/evaluate`,
        evaluateBatch: `${SITE_URL}/api/v1/evaluations:batch`,
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
        changeEvents: store.changeEvents.length,
      },
      schemas: DCC_MACHINE_JSON_SCHEMAS,
    },
    {
      cacheControl: "public, max-age=60, s-maxage=60",
    },
  );
}
