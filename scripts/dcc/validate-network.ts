import {
  loadConfidencePolicy,
  loadEdgeRegistry,
  loadFieldOwnershipRegistry,
  loadMergePolicy,
  loadNodeRegistry,
  loadPipelineOwnershipRegistry,
  loadPromotionPolicy,
  loadStalenessPolicy,
  loadSurfaceManifest,
  loadSurfacePolicy,
  validateConfidenceAndSurfaces,
  validateFieldOwnership,
  validateMergePolicy,
  validateNetworkOwnership,
  validateNetworkReferentialIntegrity,
  validatePromotionPolicy,
  validateSurfaceManifest,
  evaluateStaleness,
} from "@/lib/dcc/network/registry";

function main() {
  const nodes = loadNodeRegistry();
  const edges = loadEdgeRegistry();
  const ownership = loadPipelineOwnershipRegistry();
  const fieldOwnership = loadFieldOwnershipRegistry();
  const confidencePolicy = loadConfidencePolicy();
  const surfacePolicy = loadSurfacePolicy();
  const mergePolicy = loadMergePolicy();
  const promotionPolicy = loadPromotionPolicy();
  const stalenessPolicy = loadStalenessPolicy();
  const authorityManifest = loadSurfaceManifest("authority");
  const discoveryManifest = loadSurfaceManifest("discovery");
  const monetizedManifest = loadSurfaceManifest("monetized");
  const integrity = validateNetworkReferentialIntegrity(nodes, edges);
  const ownershipCheck = validateNetworkOwnership(nodes, edges, ownership);
  const fieldOwnershipCheck = validateFieldOwnership(nodes, fieldOwnership);
  const confidenceCheck = validateConfidenceAndSurfaces(nodes, edges, confidencePolicy, surfacePolicy);
  const mergeCheck = validateMergePolicy(ownership, mergePolicy);
  const promotionCheck = validatePromotionPolicy(nodes, surfacePolicy, promotionPolicy);
  const authorityManifestCheck = validateSurfaceManifest(nodes, edges, authorityManifest);
  const discoveryManifestCheck = validateSurfaceManifest(nodes, edges, discoveryManifest);
  const monetizedManifestCheck = validateSurfaceManifest(nodes, edges, monetizedManifest);
  const stalenessCheck = evaluateStaleness(nodes, edges, stalenessPolicy);
  const errors = [
    ...integrity.errors,
    ...ownershipCheck.errors,
    ...fieldOwnershipCheck.errors,
    ...confidenceCheck.errors,
    ...mergeCheck.errors,
    ...promotionCheck.errors,
    ...authorityManifestCheck.errors,
    ...discoveryManifestCheck.errors,
    ...monetizedManifestCheck.errors,
    ...stalenessCheck.report.errors,
  ];
  const warnings = [
    ...integrity.warnings,
    ...ownershipCheck.warnings,
    ...fieldOwnershipCheck.warnings,
    ...confidenceCheck.warnings,
    ...mergeCheck.warnings,
    ...promotionCheck.warnings,
    ...authorityManifestCheck.warnings,
    ...discoveryManifestCheck.warnings,
    ...monetizedManifestCheck.warnings,
    ...stalenessCheck.report.warnings,
  ];
  const infos = [
    ...integrity.infos,
    ...ownershipCheck.infos,
    ...fieldOwnershipCheck.infos,
    ...confidenceCheck.infos,
    ...mergeCheck.infos,
    ...promotionCheck.infos,
    ...authorityManifestCheck.infos,
    ...discoveryManifestCheck.infos,
    ...monetizedManifestCheck.infos,
    ...stalenessCheck.report.infos,
  ];
  const ok = errors.length === 0;

  const summary = {
    version: nodes.version,
    node_count: nodes.nodes.length,
    edge_count: edges.edges.length,
    integrity_ok: integrity.ok,
    ownership_ok: ownershipCheck.ok,
    field_ownership_ok: fieldOwnershipCheck.ok,
    confidence_policy_ok: confidenceCheck.ok,
    merge_policy_ok: mergeCheck.ok,
    promotion_policy_ok: promotionCheck.ok,
    authority_manifest_ok: authorityManifestCheck.ok,
    discovery_manifest_ok: discoveryManifestCheck.ok,
    monetized_manifest_ok: monetizedManifestCheck.ok,
    staleness_policy_ok: stalenessCheck.report.ok,
    review_queue_count: stalenessCheck.reviewItems.length,
    warnings_count: warnings.length,
    infos_count: infos.length,
    errors,
    warnings,
    infos,
  };

  if (!ok) {
    console.error(JSON.stringify(summary, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(summary, null, 2));
}

main();
