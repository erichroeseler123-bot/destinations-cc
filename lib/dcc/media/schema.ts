import { z } from "zod";

const LocalImagePathSchema = z.string().regex(/^\/images\/[^\s]+$/i);
const RawImagePathSchema = z.string().regex(/^assets\/raw\/[^\s]+$/i);
const HttpUrlSchema = z.string().url();

export const DccMediaRoleSchema = z.enum(["hero", "section", "gallery", "social"]);
export const DccMediaPrioritySchema = z.enum(["gold", "high", "standard"]);
export const DccMediaSourceTypeSchema = z.enum([
  "original",
  "tourism",
  "cc",
  "licensed",
  "fallback",
]);
export const DccMediaApprovalStatusSchema = z.enum([
  "candidate",
  "approved",
  "fallback",
  "deprecated",
]);
export const DccMediaFocalSchema = z.enum(["center", "top", "bottom", "left", "right"]);

export const DccMediaAssetSchema = z.object({
  id: z.string().min(3),
  role: DccMediaRoleSchema,
  priority: DccMediaPrioritySchema,
  sourceType: DccMediaSourceTypeSchema,
  // Legacy field retained for backward compatibility; review-manifest drives approval governance.
  approvalStatus: DccMediaApprovalStatusSchema.optional().default("candidate"),
  src_url: HttpUrlSchema,
  source: z.string().min(2),
  author: z.string().min(2),
  attribution: z.string().min(6),
  license: z.string().min(3),
  alt: z.string().min(20),
  tags: z.array(z.string().min(2)).min(1),
  raw_path: RawImagePathSchema,
  optimized_path: LocalImagePathSchema.regex(/\.(webp|avif)$/i),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  focal: DccMediaFocalSchema.default("center"),
});

export const DccMediaManifestEntrySchema = z.object({
  id: z.string().min(3),
  canonicalPath: z.string().regex(/^\/[^\s]*$/),
  entityType: z.enum(["city", "port", "venue", "attraction", "route"]),
  priority: DccMediaPrioritySchema,
  assets: z.array(DccMediaAssetSchema).min(3),
});

export const DccMediaManifestSchema = z.object({
  version: z.number().int().positive(),
  updated_at: z.string().min(8),
  allowlisted_sources: z.array(z.string().min(4)).min(1),
  entries: z.array(DccMediaManifestEntrySchema).min(1),
});

export const DccEditorialReviewStateSchema = z.enum([
  "approved",
  "candidate",
  "rejected",
  "deprecated",
]);

export const DccEditorialScopePolicySchema = z.object({
  allowCandidate: z.boolean(),
  requireApproved: z.boolean().default(false),
  minApproved: z.number().int().nonnegative().default(0),
  blockFallback: z.boolean().default(false),
});

export const DccEditorialTierPolicySchema = z.object({
  hero: DccEditorialScopePolicySchema,
  gallery: DccEditorialScopePolicySchema,
  section: DccEditorialScopePolicySchema,
  social: DccEditorialScopePolicySchema,
});

export const DccEditorialAssetReviewSchema = z.object({
  assetId: z.string().min(3),
  scope: DccMediaRoleSchema,
  state: DccEditorialReviewStateSchema,
  reviewer: z.string().min(2),
  reviewedAt: z.string().min(8),
  notes: z.string().min(3).optional(),
});

export const DccEditorialScopeOverrideSchema = z.object({
  scope: DccMediaRoleSchema,
  policy: DccEditorialScopePolicySchema,
});

export const DccEditorialReviewEntrySchema = z.object({
  canonicalPath: z.string().regex(/^\/[^\s]*$/),
  pageTier: DccMediaPrioritySchema.optional(),
  scopeOverrides: z.array(DccEditorialScopeOverrideSchema).default([]),
  assetReviews: z.array(DccEditorialAssetReviewSchema),
});

export const DccEditorialReviewManifestSchema = z.object({
  version: z.number().int().positive(),
  updated_at: z.string().min(8),
  tierPolicies: z.object({
    gold: DccEditorialTierPolicySchema,
    high: DccEditorialTierPolicySchema,
    standard: DccEditorialTierPolicySchema,
  }),
  entries: z.array(DccEditorialReviewEntrySchema),
});

export type DccMediaAsset = z.infer<typeof DccMediaAssetSchema>;
export type DccMediaManifestEntry = z.infer<typeof DccMediaManifestEntrySchema>;
export type DccMediaManifest = z.infer<typeof DccMediaManifestSchema>;
export type DccEditorialReviewState = z.infer<typeof DccEditorialReviewStateSchema>;
export type DccEditorialScopePolicy = z.infer<typeof DccEditorialScopePolicySchema>;
export type DccEditorialTierPolicy = z.infer<typeof DccEditorialTierPolicySchema>;
export type DccEditorialAssetReview = z.infer<typeof DccEditorialAssetReviewSchema>;
export type DccEditorialReviewEntry = z.infer<typeof DccEditorialReviewEntrySchema>;
export type DccEditorialReviewManifest = z.infer<typeof DccEditorialReviewManifestSchema>;
