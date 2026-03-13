import fs from "fs";
import path from "path";
import {
  DccConfidencePolicySchema,
  DccEdgeRegistrySchema,
  DccFieldOwnershipRegistrySchema,
  DccMergePolicySchema,
  DccNodeRegistrySchema,
  DccPipelineOwnershipRegistrySchema,
  DccPromotionPolicySchema,
  DccStalenessPolicySchema,
  DccSurfacePolicySchema,
  DccSatelliteContractSchema,
  DccSurfaceManifestSchema,
  type DccConfidencePolicy,
  type DccEdgeRegistry,
  type DccFieldOwnershipRegistry,
  type DccMergePolicy,
  type DccNodeRegistry,
  type DccPipelineOwnershipRegistry,
  type DccPromotionPolicy,
  type DccStalenessPolicy,
  type DccSatelliteContract,
  type DccSurfaceManifest,
  type DccSurfacePolicy,
} from "./schema";

function readJsonFile<T = unknown>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

export function loadNodeRegistry(fileName = "nodes.v1.json"): DccNodeRegistry {
  const filePath = path.join(process.cwd(), "data", "network", fileName);
  return DccNodeRegistrySchema.parse(readJsonFile(filePath));
}

export function loadEdgeRegistry(fileName = "edges.v1.json"): DccEdgeRegistry {
  const filePath = path.join(process.cwd(), "data", "network", fileName);
  return DccEdgeRegistrySchema.parse(readJsonFile(filePath));
}

export function loadPipelineOwnershipRegistry(
  fileName = "pipeline-ownership.v1.json"
): DccPipelineOwnershipRegistry {
  const filePath = path.join(process.cwd(), "data", "network", fileName);
  return DccPipelineOwnershipRegistrySchema.parse(readJsonFile(filePath));
}

export function loadFieldOwnershipRegistry(
  fileName = "field-ownership.v1.json"
): DccFieldOwnershipRegistry {
  const filePath = path.join(process.cwd(), "data", "network", fileName);
  return DccFieldOwnershipRegistrySchema.parse(readJsonFile(filePath));
}

export function loadConfidencePolicy(fileName = "confidence-policy.v1.json"): DccConfidencePolicy {
  const filePath = path.join(process.cwd(), "data", "network", fileName);
  return DccConfidencePolicySchema.parse(readJsonFile(filePath));
}

export function loadSurfacePolicy(fileName = "surface-policy.v1.json"): DccSurfacePolicy {
  const filePath = path.join(process.cwd(), "data", "network", fileName);
  return DccSurfacePolicySchema.parse(readJsonFile(filePath));
}

export function loadSurfaceManifest(surface: "authority" | "discovery" | "monetized"): DccSurfaceManifest {
  const filePath = path.join(process.cwd(), "data", "network", "surfaces", `${surface}.manifest.v1.json`);
  return DccSurfaceManifestSchema.parse(readJsonFile(filePath));
}

export function loadMergePolicy(fileName = "merge-policy.v1.json"): DccMergePolicy {
  const filePath = path.join(process.cwd(), "data", "network", fileName);
  return DccMergePolicySchema.parse(readJsonFile(filePath));
}

export function loadPromotionPolicy(fileName = "promotion-policy.v1.json"): DccPromotionPolicy {
  const filePath = path.join(process.cwd(), "data", "network", fileName);
  return DccPromotionPolicySchema.parse(readJsonFile(filePath));
}

export function loadStalenessPolicy(fileName = "staleness-policy.v1.json"): DccStalenessPolicy {
  const filePath = path.join(process.cwd(), "data", "network", fileName);
  return DccStalenessPolicySchema.parse(readJsonFile(filePath));
}

export type ValidationReport = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  infos: string[];
};

export type ReviewItem = {
  entity_type: "node" | "edge";
  entity_id: string;
  severity: "warning" | "error";
  reason: string;
  age_days?: number;
};

export type SurfaceExport = {
  version: string;
  surface: "authority" | "discovery" | "monetized";
  generatedAt: string;
  node_count: number;
  edge_count: number;
  nodes: DccNodeRegistry["nodes"];
  edges: DccEdgeRegistry["edges"];
};

function finalizeReport(errors: string[], warnings: string[] = [], infos: string[] = []): ValidationReport {
  return { ok: errors.length === 0, errors, warnings, infos };
}

function ageInDays(iso: string, nowMs: number): number {
  return (nowMs - new Date(iso).getTime()) / 86_400_000;
}

export function loadSurfaceExport(surface: "authority" | "discovery" | "monetized"): SurfaceExport {
  const filePath = path.join(process.cwd(), "data", "network", "exports", `${surface}.export.v1.json`);
  return readJsonFile<SurfaceExport>(filePath);
}

export function loadSatelliteContract(fileName: string): DccSatelliteContract {
  const filePath = path.join(process.cwd(), "data", "network", "contracts", fileName);
  return DccSatelliteContractSchema.parse(readJsonFile(filePath));
}

export function validateNetworkReferentialIntegrity(
  nodes: DccNodeRegistry,
  edges: DccEdgeRegistry
): ValidationReport {
  const errors: string[] = [];
  const nodeIds = new Set(nodes.nodes.map((node) => node.node_id));
  const slugs = new Set<string>();
  const coreTypeCounts: Record<string, number> = {};

  for (const node of nodes.nodes) {
    coreTypeCounts[node.node_type] = (coreTypeCounts[node.node_type] ?? 0) + 1;

    if (slugs.has(node.slug)) {
      errors.push(`Duplicate node slug detected: ${node.slug}`);
    }
    slugs.add(node.slug);

    if (node.node_type === "operator" && node.monetized_targets.length === 0) {
      errors.push(`Operator node ${node.node_id} must define at least one monetized target`);
    }
    if (node.node_type === "scene" && node.related_nodes.length < 2) {
      errors.push(`Scene node ${node.node_id} should have at least two related_nodes`);
    }

    for (const relatedId of node.related_nodes) {
      if (!nodeIds.has(relatedId)) {
        errors.push(`Node ${node.node_id} has unknown related_nodes reference: ${relatedId}`);
      }
    }
  }

  for (const edge of edges.edges) {
    if (!nodeIds.has(edge.from_node)) {
      errors.push(`Edge ${edge.edge_id} has unknown from_node: ${edge.from_node}`);
    }
    if (!nodeIds.has(edge.to_node)) {
      errors.push(`Edge ${edge.edge_id} has unknown to_node: ${edge.to_node}`);
    }
  }

  if ((coreTypeCounts.city ?? 0) === 0) {
    errors.push("Network registry must contain at least one city node");
  }
  if ((coreTypeCounts.scene ?? 0) === 0) {
    errors.push("Network registry must contain at least one scene node");
  }
  if ((coreTypeCounts.operator ?? 0) === 0) {
    errors.push("Network registry must contain at least one operator node");
  }

  return finalizeReport(errors);
}

export function validateNetworkOwnership(
  nodes: DccNodeRegistry,
  edges: DccEdgeRegistry,
  ownership: DccPipelineOwnershipRegistry
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const pipelines = new Map(ownership.pipelines.map((p) => [p.pipeline_id, p]));

  for (const node of nodes.nodes) {
    const owner = pipelines.get(node.owner_pipeline);
    if (!owner) {
      errors.push(`Node ${node.node_id} references unknown owner_pipeline: ${node.owner_pipeline}`);
      continue;
    }
    if (!owner.owns_node_types.includes(node.node_type)) {
      errors.push(
        `Node ${node.node_id} type ${node.node_type} is not owned by pipeline ${node.owner_pipeline}`
      );
    }
    if (!owner.sources.includes(node.source)) {
      warnings.push(
        `Node ${node.node_id} source ${node.source} is not listed in pipeline ${node.owner_pipeline} sources`
      );
    }
  }

  for (const edge of edges.edges) {
    const owner = pipelines.get(edge.owner_pipeline);
    if (!owner) {
      errors.push(`Edge ${edge.edge_id} references unknown owner_pipeline: ${edge.owner_pipeline}`);
      continue;
    }
    if (!owner.owns_edge_types.includes(edge.edge_type)) {
      errors.push(
        `Edge ${edge.edge_id} type ${edge.edge_type} is not owned by pipeline ${edge.owner_pipeline}`
      );
    }
    if (!owner.sources.includes(edge.source)) {
      warnings.push(
        `Edge ${edge.edge_id} source ${edge.source} is not listed in pipeline ${edge.owner_pipeline} sources`
      );
    }
  }

  return finalizeReport(errors, warnings);
}

export function validateFieldOwnership(
  nodes: DccNodeRegistry,
  fieldOwnership: DccFieldOwnershipRegistry
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const pipelines = new Map(fieldOwnership.pipelines.map((p) => [p.pipeline_id, p]));

  for (const node of nodes.nodes) {
    const rules = fieldOwnership.node_types[node.node_type];
    if (!rules) {
      warnings.push(`No field ownership rule defined for node type ${node.node_type}`);
      continue;
    }

    const pipelineRule = pipelines.get(node.owner_pipeline);
    if (!pipelineRule) {
      warnings.push(`No field ownership pipeline rule for ${node.owner_pipeline}`);
      continue;
    }

    const canWrite = pipelineRule.can_write[node.node_type];
    if (!canWrite) {
      errors.push(`Pipeline ${node.owner_pipeline} cannot write node type ${node.node_type}`);
      continue;
    }

    if (node.provenance === "enriched" && !canWrite.enrichment_fields) {
      errors.push(
        `Node ${node.node_id} has enriched provenance but pipeline ${node.owner_pipeline} cannot write enrichment_fields`
      );
    }
    if ((node.provenance === "upstream" || node.provenance === "manual") && !canWrite.structural_fields) {
      errors.push(
        `Node ${node.node_id} has ${node.provenance} provenance but pipeline ${node.owner_pipeline} cannot write structural_fields`
      );
    }
  }

  return finalizeReport(errors, warnings);
}

export function validateConfidenceAndSurfaces(
  nodes: DccNodeRegistry,
  edges: DccEdgeRegistry,
  confidencePolicy: DccConfidencePolicy,
  surfacePolicy: DccSurfacePolicy
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const infos: string[] = [];
  const { thresholds } = confidencePolicy;
  const authorityTypes = new Set(surfacePolicy.surfaces.authority);
  const monetizedTypes = new Set(surfacePolicy.surfaces.monetized);

  for (const node of nodes.nodes) {
    if (authorityTypes.has(node.node_type) && node.confidence < thresholds.authority_surface) {
      warnings.push(`Node ${node.node_id} below authority threshold (${node.confidence})`);
    }

    if (monetizedTypes.has(node.node_type) && node.monetized_targets.length > 0) {
      if (node.confidence < thresholds.monetized_surface) {
        errors.push(`Monetized node ${node.node_id} below monetized threshold (${node.confidence})`);
      }
    }

    if (node.confidence >= thresholds.auto_merge) {
      infos.push(`Node ${node.node_id} eligible for auto-merge policy (${node.confidence})`);
    }
  }

  for (const edge of edges.edges) {
    if (edge.confidence < thresholds.discovery_surface) {
      warnings.push(`Edge ${edge.edge_id} below discovery threshold (${edge.confidence})`);
    }
    if (edge.confidence >= thresholds.auto_merge) {
      infos.push(`Edge ${edge.edge_id} eligible for auto-merge policy (${edge.confidence})`);
    }
  }

  return finalizeReport(errors, warnings, infos);
}

export function validateMergePolicy(
  ownership: DccPipelineOwnershipRegistry,
  mergePolicy: DccMergePolicy
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const knownPipelines = new Set(ownership.pipelines.map((p) => p.pipeline_id));
  const precedence = mergePolicy.field_precedence_by_class;

  for (const cls of Object.keys(precedence) as Array<keyof typeof precedence>) {
    for (const pipelineId of precedence[cls].pipeline_order) {
      if (!knownPipelines.has(pipelineId)) {
        errors.push(`Merge policy ${cls} references unknown pipeline: ${pipelineId}`);
      }
    }
  }

  for (const nodeType of Object.keys(mergePolicy.node_type_overrides)) {
    if (!["city", "venue", "attraction", "event", "artist", "scene", "operator"].includes(nodeType)) {
      warnings.push(`Merge policy has override for unknown node type key: ${nodeType}`);
    }
  }

  return finalizeReport(errors, warnings);
}

function passesPromotionRule(
  node: DccNodeRegistry["nodes"][number],
  rule: DccPromotionPolicy["surfaces"]["authority"]
): { ok: boolean; reason?: string } {
  if (node.confidence < rule.min_confidence) {
    return { ok: false, reason: `confidence ${node.confidence} < ${rule.min_confidence}` };
  }
  if (!rule.allowed_provenance.includes(node.provenance)) {
    return { ok: false, reason: `provenance ${node.provenance} not allowed` };
  }
  if (!rule.required_status.includes(node.status)) {
    return { ok: false, reason: `status ${node.status} not allowed` };
  }
  if (node.related_nodes.length < rule.require_related_nodes_min) {
    return { ok: false, reason: `related_nodes ${node.related_nodes.length} < ${rule.require_related_nodes_min}` };
  }
  if (rule.require_monetized_target && node.monetized_targets.length === 0) {
    return { ok: false, reason: "missing monetized_targets" };
  }
  return { ok: true };
}

export function validatePromotionPolicy(
  nodes: DccNodeRegistry,
  surfacePolicy: DccSurfacePolicy,
  promotionPolicy: DccPromotionPolicy
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const infos: string[] = [];

  const authorityTypes = new Set(surfacePolicy.surfaces.authority);
  const discoveryTypes = new Set(surfacePolicy.surfaces.discovery);
  const monetizedTypes = new Set(surfacePolicy.surfaces.monetized);

  for (const node of nodes.nodes) {
    if (authorityTypes.has(node.node_type)) {
      const verdict = passesPromotionRule(node, promotionPolicy.surfaces.authority);
      if (!verdict.ok) warnings.push(`Authority promotion blocked for ${node.node_id}: ${verdict.reason}`);
      else infos.push(`Authority promotion eligible: ${node.node_id}`);
    }

    if (discoveryTypes.has(node.node_type)) {
      const verdict = passesPromotionRule(node, promotionPolicy.surfaces.discovery);
      if (!verdict.ok) warnings.push(`Discovery promotion blocked for ${node.node_id}: ${verdict.reason}`);
      else infos.push(`Discovery promotion eligible: ${node.node_id}`);
    }

    if (monetizedTypes.has(node.node_type) && node.monetized_targets.length > 0) {
      const verdict = passesPromotionRule(node, promotionPolicy.surfaces.monetized);
      if (!verdict.ok) errors.push(`Monetized promotion blocked for ${node.node_id}: ${verdict.reason}`);
      else infos.push(`Monetized promotion eligible: ${node.node_id}`);
    }
  }

  return finalizeReport(errors, warnings, infos);
}

export function validateSurfaceManifest(
  nodes: DccNodeRegistry,
  edges: DccEdgeRegistry,
  manifest: DccSurfaceManifest
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const infos: string[] = [];
  const edgeTypesByFromNode = new Map<string, Set<string>>();

  for (const edge of edges.edges) {
    const set = edgeTypesByFromNode.get(edge.from_node) ?? new Set<string>();
    set.add(edge.edge_type);
    edgeTypesByFromNode.set(edge.from_node, set);
  }

  for (const node of nodes.nodes) {
    const rule = manifest.node_types[node.node_type];
    if (!rule) {
      continue;
    }

    if (node.confidence < rule.min_confidence) {
      warnings.push(
        `[${manifest.surface}] ${node.node_id} below manifest min_confidence (${node.confidence} < ${rule.min_confidence})`
      );
    }

    if (!rule.allowed_provenance.includes(node.provenance)) {
      warnings.push(
        `[${manifest.surface}] ${node.node_id} provenance ${node.provenance} not allowed by manifest`
      );
    }

    if (rule.disallowed_statuses.includes(node.status)) {
      warnings.push(`[${manifest.surface}] ${node.node_id} has disallowed status ${node.status}`);
    }

    if (rule.require_monetized_target && node.monetized_targets.length === 0) {
      errors.push(`[${manifest.surface}] ${node.node_id} missing required monetized target`);
    }

    for (const field of rule.required_fields) {
      if (!(field in node)) {
        errors.push(`[${manifest.surface}] ${node.node_id} missing required field ${field}`);
      }
    }

    if (rule.required_edge_types.length > 0) {
      const types = edgeTypesByFromNode.get(node.node_id) ?? new Set<string>();
      for (const edgeType of rule.required_edge_types) {
        if (!types.has(edgeType)) {
          warnings.push(`[${manifest.surface}] ${node.node_id} missing required edge type ${edgeType}`);
        }
      }
    }

    infos.push(`[${manifest.surface}] manifest rule evaluated for ${node.node_id}`);
  }

  return finalizeReport(errors, warnings, infos);
}

export function evaluateStaleness(
  nodes: DccNodeRegistry,
  edges: DccEdgeRegistry,
  stalenessPolicy: DccStalenessPolicy
): { report: ValidationReport; reviewItems: ReviewItem[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const infos: string[] = [];
  const reviewItems: ReviewItem[] = [];
  const nowMs = Date.now();

  for (const node of nodes.nodes) {
    const updatedAt = node.updatedAt ?? node.updated_at;
    const window = stalenessPolicy.node_type_windows[node.node_type];
    if (!updatedAt || !window) continue;
    const days = ageInDays(updatedAt, nowMs);

    if (days > window.warn_after_days) {
      const msg = `Node ${node.node_id} stale (${days.toFixed(1)}d > ${window.warn_after_days}d)`;
      warnings.push(msg);
      reviewItems.push({ entity_type: "node", entity_id: node.node_id, severity: "warning", reason: "stale_node", age_days: days });
    }

    if (node.monetized_targets.length > 0 && days > window.block_monetized_after_days) {
      const msg = `Node ${node.node_id} monetized-block stale (${days.toFixed(1)}d > ${window.block_monetized_after_days}d)`;
      errors.push(msg);
      reviewItems.push({ entity_type: "node", entity_id: node.node_id, severity: "error", reason: "stale_monetized_node", age_days: days });
    }

    if (node.confidence < stalenessPolicy.review_rules.low_confidence_review_below) {
      const msg = `Node ${node.node_id} low confidence review (${node.confidence})`;
      warnings.push(msg);
      reviewItems.push({ entity_type: "node", entity_id: node.node_id, severity: "warning", reason: "low_confidence_node" });
    }

    for (const rule of stalenessPolicy.review_rules.provenance_status_pairs) {
      if (node.provenance === rule.provenance && node.status === rule.status) {
        const msg = `Node ${node.node_id} review rule hit (${rule.reason})`;
        if (rule.severity === "error") errors.push(msg);
        else warnings.push(msg);
        reviewItems.push({ entity_type: "node", entity_id: node.node_id, severity: rule.severity, reason: rule.reason });
      }
    }
  }

  for (const edge of edges.edges) {
    const updatedAt = edge.updatedAt ?? edge.updated_at;
    const window = stalenessPolicy.edge_type_windows[edge.edge_type];
    if (!updatedAt || !window) continue;
    const days = ageInDays(updatedAt, nowMs);

    if (days > window.warn_after_days) {
      const msg = `Edge ${edge.edge_id} stale (${days.toFixed(1)}d > ${window.warn_after_days}d)`;
      warnings.push(msg);
      reviewItems.push({ entity_type: "edge", entity_id: edge.edge_id, severity: "warning", reason: "stale_edge", age_days: days });
    }

    if (days > window.block_monetized_after_days) {
      const msg = `Edge ${edge.edge_id} monetized-block stale (${days.toFixed(1)}d > ${window.block_monetized_after_days}d)`;
      warnings.push(msg);
      reviewItems.push({ entity_type: "edge", entity_id: edge.edge_id, severity: "warning", reason: "stale_monetized_edge", age_days: days });
    }
  }

  infos.push(`Staleness review items: ${reviewItems.length}`);
  return { report: finalizeReport(errors, warnings, infos), reviewItems };
}

export function validateSatelliteContractAgainstSurfaceExport(
  contract: DccSatelliteContract,
  surfaceExport: SurfaceExport
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const infos: string[] = [];

  if (!contract.allowed_surfaces.includes(surfaceExport.surface)) {
    errors.push(
      `Contract ${contract.satellite_id} does not allow surface ${surfaceExport.surface}`
    );
    return finalizeReport(errors, warnings, infos);
  }

  const rule = contract.surfaces.find((entry) => entry.surface === surfaceExport.surface);
  if (!rule) {
    errors.push(`Contract ${contract.satellite_id} has no rule for surface ${surfaceExport.surface}`);
    return finalizeReport(errors, warnings, infos);
  }

  const edgeTypesByFromNode = new Map<string, Set<string>>();
  for (const edge of surfaceExport.edges) {
    const set = edgeTypesByFromNode.get(edge.from_node) ?? new Set<string>();
    set.add(edge.edge_type);
    edgeTypesByFromNode.set(edge.from_node, set);
  }

  for (const node of surfaceExport.nodes) {
    if (!rule.allowed_node_types.includes(node.node_type)) {
      errors.push(
        `Contract ${contract.satellite_id} disallows node type ${node.node_type} (${node.node_id})`
      );
      continue;
    }
    if (node.confidence < rule.min_confidence) {
      warnings.push(
        `Contract ${contract.satellite_id} node ${node.node_id} below min_confidence ${rule.min_confidence}`
      );
    }
    if (!rule.allowed_provenance.includes(node.provenance)) {
      errors.push(
        `Contract ${contract.satellite_id} node ${node.node_id} has disallowed provenance ${node.provenance}`
      );
    }
    if (rule.excluded_statuses.includes(node.status)) {
      errors.push(
        `Contract ${contract.satellite_id} node ${node.node_id} has excluded status ${node.status}`
      );
    }
    for (const requiredField of rule.required_fields) {
      if (!(requiredField in node)) {
        errors.push(
          `Contract ${contract.satellite_id} node ${node.node_id} missing required field ${requiredField}`
        );
      }
    }
    if (rule.required_edge_types.length > 0) {
      const types = edgeTypesByFromNode.get(node.node_id) ?? new Set<string>();
      for (const requiredEdgeType of rule.required_edge_types) {
        if (!types.has(requiredEdgeType)) {
          warnings.push(
            `Contract ${contract.satellite_id} node ${node.node_id} missing edge type ${requiredEdgeType}`
          );
        }
      }
    }
    infos.push(`Contract ${contract.satellite_id} accepted node ${node.node_id}`);
  }

  if (contract.local_overrides?.max_nodes && surfaceExport.nodes.length > contract.local_overrides.max_nodes) {
    warnings.push(
      `Contract ${contract.satellite_id} max_nodes exceeded (${surfaceExport.nodes.length} > ${contract.local_overrides.max_nodes})`
    );
  }
  if (contract.local_overrides?.max_edges && surfaceExport.edges.length > contract.local_overrides.max_edges) {
    warnings.push(
      `Contract ${contract.satellite_id} max_edges exceeded (${surfaceExport.edges.length} > ${contract.local_overrides.max_edges})`
    );
  }

  return finalizeReport(errors, warnings, infos);
}
