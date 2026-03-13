import { z } from "zod";

export const DccNodeTypeSchema = z.enum([
  "city",
  "venue",
  "attraction",
  "event",
  "artist",
  "scene",
  "operator",
]);

export const DccNodeStatusSchema = z.enum(["active", "beta", "paused", "archived"]);
export const DccProvenanceSchema = z.enum(["upstream", "manual", "derived", "enriched"]);

export const DccNodeGeoSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  country: z.string().min(2),
  region: z.string().min(2),
  locality: z.string().min(2),
});

export const DccMonetizedTargetSchema = z.object({
  site: z.string().min(2),
  path: z.string().startsWith("/"),
  operator_id: z.string().min(2),
  booking_mode: z.enum(["internal", "affiliate", "external"]),
  checkout_url: z.string().url(),
});

export const DccNodeSchema = z.object({
  node_id: z.string().regex(/^dcc:node:[a-z0-9-]+$/),
  node_type: DccNodeTypeSchema,
  name: z.string().min(2),
  slug: z.string().min(2),
  geo: DccNodeGeoSchema,
  tags: z.array(z.string().min(2)).min(1),
  status: DccNodeStatusSchema,
  authority_url: z.string().url(),
  monetized_targets: z.array(DccMonetizedTargetSchema),
  related_nodes: z.array(z.string().regex(/^dcc:node:[a-z0-9-]+$/)),
  source: z.string().min(2),
  confidence: z.number().min(0).max(1),
  provenance: DccProvenanceSchema,
  owner_pipeline: z.string().min(2),
  updatedAt: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }).optional(),
});

export const DccEdgeTypeSchema = z.enum([
  "nearby",
  "feeds",
  "routes_to",
  "operates_in",
  "co_intent",
  "fallback_to",
]);

export const DccEdgeSchema = z.object({
  edge_id: z.string().regex(/^dcc:edge:[a-z0-9-]+$/),
  from_node: z.string().regex(/^dcc:node:[a-z0-9-]+$/),
  to_node: z.string().regex(/^dcc:node:[a-z0-9-]+$/),
  edge_type: DccEdgeTypeSchema,
  weight: z.number().min(0).max(1),
  fresh_until: z.string().datetime({ offset: true }),
  signals: z.array(z.string().min(2)).default([]),
  rationale: z.string().min(8),
  source: z.string().min(2),
  confidence: z.number().min(0).max(1),
  provenance: DccProvenanceSchema,
  owner_pipeline: z.string().min(2),
  updatedAt: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }).optional(),
});

export const DccNodeRegistrySchema = z.object({
  version: z.literal("dcc-network-v1"),
  generatedAt: z.string().datetime({ offset: true }),
  generated_at: z.string().datetime({ offset: true }).optional(),
  nodes: z.array(DccNodeSchema).min(1),
});

export const DccEdgeRegistrySchema = z.object({
  version: z.literal("dcc-network-v1"),
  generatedAt: z.string().datetime({ offset: true }),
  generated_at: z.string().datetime({ offset: true }).optional(),
  edges: z.array(DccEdgeSchema).min(1),
});

export const DccPipelineOwnershipEntrySchema = z.object({
  pipeline_id: z.string().min(2),
  owns_node_types: z.array(DccNodeTypeSchema),
  owns_edge_types: z.array(DccEdgeTypeSchema),
  sources: z.array(z.string().min(2)).min(1),
});

export const DccPipelineOwnershipRegistrySchema = z.object({
  version: z.literal("dcc-network-v1"),
  updatedAt: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }).optional(),
  pipelines: z.array(DccPipelineOwnershipEntrySchema).min(1),
});

export const DccFieldClassSchema = z.enum(["identity_fields", "structural_fields", "enrichment_fields"]);

export const DccFieldOwnershipNodeTypeRuleSchema = z.object({
  identity_fields: z.array(z.string().min(2)),
  structural_fields: z.array(z.string().min(2)),
  enrichment_fields: z.array(z.string().min(2)),
});

export const DccFieldOwnershipNodePermissionSchema = z.object({
  identity_fields: z.boolean(),
  structural_fields: z.boolean(),
  enrichment_fields: z.boolean(),
});

export const DccFieldOwnershipPipelineRuleSchema = z.object({
  pipeline_id: z.string().min(2),
  can_write: z.record(z.string(), DccFieldOwnershipNodePermissionSchema.partial()),
});

export const DccFieldOwnershipRegistrySchema = z.object({
  version: z.literal("dcc-network-v1"),
  updatedAt: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }).optional(),
  node_types: z.record(z.string(), DccFieldOwnershipNodeTypeRuleSchema.partial()),
  pipelines: z.array(DccFieldOwnershipPipelineRuleSchema).min(1),
});

export const DccConfidenceThresholdSchema = z.object({
  authority_surface: z.number().min(0).max(1),
  discovery_surface: z.number().min(0).max(1),
  monetized_surface: z.number().min(0).max(1),
  auto_merge: z.number().min(0).max(1),
});

export const DccConfidencePolicySchema = z.object({
  version: z.literal("dcc-network-v1"),
  updatedAt: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }).optional(),
  thresholds: DccConfidenceThresholdSchema,
});

export const DccSurfacePolicySchema = z.object({
  version: z.literal("dcc-network-v1"),
  updatedAt: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }).optional(),
  surfaces: z.object({
    authority: z.array(DccNodeTypeSchema).min(1),
    discovery: z.array(DccNodeTypeSchema).min(1),
    monetized: z.array(DccNodeTypeSchema).min(1),
  }),
});

export const DccSurfaceNameSchema = z.enum(["authority", "discovery", "monetized"]);

export const DccSurfaceNodeRuleSchema = z.object({
  min_confidence: z.number().min(0).max(1),
  required_fields: z.array(z.string().min(2)).min(1),
  required_edge_types: z.array(DccEdgeTypeSchema).default([]),
  allowed_provenance: z.array(DccProvenanceSchema).min(1),
  disallowed_statuses: z.array(DccNodeStatusSchema).default([]),
  require_monetized_target: z.boolean().default(false),
});

export const DccSurfaceManifestSchema = z.object({
  version: z.literal("dcc-network-v1"),
  surface: DccSurfaceNameSchema,
  updatedAt: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }).optional(),
  node_types: z.record(z.string(), DccSurfaceNodeRuleSchema),
});

export const DccMergeTieBreakerSchema = z.enum(["confidence", "updatedAt"]);

export const DccMergeClassPolicySchema = z.object({
  provenance_order: z.array(DccProvenanceSchema).min(1),
  pipeline_order: z.array(z.string().min(2)).min(1),
  tie_breakers: z.array(DccMergeTieBreakerSchema).min(1),
});

export const DccMergePolicySchema = z.object({
  version: z.literal("dcc-network-v1"),
  updatedAt: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }).optional(),
  field_precedence_by_class: z.object({
    identity_fields: DccMergeClassPolicySchema,
    structural_fields: DccMergeClassPolicySchema,
    enrichment_fields: DccMergeClassPolicySchema,
  }),
  node_type_overrides: z.record(z.string(), DccMergeClassPolicySchema.partial()).default({}),
});

export const DccPromotionSurfaceRuleSchema = z.object({
  min_confidence: z.number().min(0).max(1),
  allowed_provenance: z.array(DccProvenanceSchema).min(1),
  required_status: z.array(DccNodeStatusSchema).min(1),
  require_related_nodes_min: z.number().int().min(0),
  require_monetized_target: z.boolean().default(false),
});

export const DccPromotionPolicySchema = z.object({
  version: z.literal("dcc-network-v1"),
  updatedAt: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }).optional(),
  surfaces: z.object({
    authority: DccPromotionSurfaceRuleSchema,
    discovery: DccPromotionSurfaceRuleSchema,
    monetized: DccPromotionSurfaceRuleSchema,
  }),
});

export const DccSatelliteContractSurfaceRuleSchema = z.object({
  surface: DccSurfaceNameSchema,
  min_confidence: z.number().min(0).max(1),
  allowed_node_types: z.array(DccNodeTypeSchema).min(1),
  required_fields: z.array(z.string().min(2)).min(1),
  required_edge_types: z.array(DccEdgeTypeSchema).default([]),
  allowed_provenance: z.array(DccProvenanceSchema).min(1),
  excluded_statuses: z.array(DccNodeStatusSchema).default([]),
});

export const DccSatelliteContractSchema = z.object({
  version: z.literal("dcc-network-v1"),
  updatedAt: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }).optional(),
  satellite_id: z.string().min(2),
  allowed_surfaces: z.array(DccSurfaceNameSchema).min(1),
  surfaces: z.array(DccSatelliteContractSurfaceRuleSchema).min(1),
  local_overrides: z
    .object({
      max_nodes: z.number().int().min(1).optional(),
      max_edges: z.number().int().min(1).optional(),
      notes: z.string().min(2).optional(),
    })
    .optional(),
});

export const DccStalenessWindowSchema = z.object({
  warn_after_days: z.number().int().min(1),
  block_monetized_after_days: z.number().int().min(1),
});

export const DccStalenessReviewRuleSchema = z.object({
  provenance: DccProvenanceSchema,
  status: DccNodeStatusSchema,
  severity: z.enum(["warning", "error"]),
  reason: z.string().min(4),
});

export const DccStalenessPolicySchema = z.object({
  version: z.literal("dcc-network-v1"),
  updatedAt: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }).optional(),
  node_type_windows: z.record(z.string(), DccStalenessWindowSchema),
  edge_type_windows: z.record(z.string(), DccStalenessWindowSchema),
  review_rules: z.object({
    low_confidence_review_below: z.number().min(0).max(1),
    provenance_status_pairs: z.array(DccStalenessReviewRuleSchema).default([]),
  }),
});

export type DccNodeType = z.infer<typeof DccNodeTypeSchema>;
export type DccNodeStatus = z.infer<typeof DccNodeStatusSchema>;
export type DccProvenance = z.infer<typeof DccProvenanceSchema>;
export type DccNodeGeo = z.infer<typeof DccNodeGeoSchema>;
export type DccMonetizedTarget = z.infer<typeof DccMonetizedTargetSchema>;
export type DccNode = z.infer<typeof DccNodeSchema>;
export type DccEdgeType = z.infer<typeof DccEdgeTypeSchema>;
export type DccEdge = z.infer<typeof DccEdgeSchema>;
export type DccNodeRegistry = z.infer<typeof DccNodeRegistrySchema>;
export type DccEdgeRegistry = z.infer<typeof DccEdgeRegistrySchema>;
export type DccPipelineOwnershipEntry = z.infer<typeof DccPipelineOwnershipEntrySchema>;
export type DccPipelineOwnershipRegistry = z.infer<typeof DccPipelineOwnershipRegistrySchema>;
export type DccFieldOwnershipRegistry = z.infer<typeof DccFieldOwnershipRegistrySchema>;
export type DccConfidencePolicy = z.infer<typeof DccConfidencePolicySchema>;
export type DccSurfacePolicy = z.infer<typeof DccSurfacePolicySchema>;
export type DccSurfaceName = z.infer<typeof DccSurfaceNameSchema>;
export type DccSurfaceManifest = z.infer<typeof DccSurfaceManifestSchema>;
export type DccMergePolicy = z.infer<typeof DccMergePolicySchema>;
export type DccPromotionPolicy = z.infer<typeof DccPromotionPolicySchema>;
export type DccSatelliteContract = z.infer<typeof DccSatelliteContractSchema>;
export type DccStalenessPolicy = z.infer<typeof DccStalenessPolicySchema>;
