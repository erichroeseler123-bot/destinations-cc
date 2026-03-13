import manifestJson from "@/data/media/manifest.json";
import reviewManifestJson from "@/data/media/review-manifest.json";
import {
  DccEditorialReviewManifestSchema,
  type DccEditorialReviewEntry,
  type DccEditorialReviewState,
  type DccEditorialScopePolicy,
  DccMediaManifestSchema,
  type DccMediaAsset,
  type DccMediaManifestEntry,
} from "@/lib/dcc/media/schema";

const manifest = DccMediaManifestSchema.parse(manifestJson);
const reviewManifest = DccEditorialReviewManifestSchema.parse(reviewManifestJson);

const byPath = new Map<string, DccMediaManifestEntry>(
  manifest.entries.map((entry) => [entry.canonicalPath, entry])
);
const reviewByPath = new Map<string, DccEditorialReviewEntry>(
  reviewManifest.entries.map((entry) => [entry.canonicalPath, entry])
);

export function getMediaManifest() {
  return manifest;
}

export function getMediaReviewManifest() {
  return reviewManifest;
}

export function getMediaEntryByPath(canonicalPath: string): DccMediaManifestEntry | null {
  return byPath.get(canonicalPath) || null;
}

export function getMediaReviewEntry(canonicalPath: string): DccEditorialReviewEntry | null {
  return reviewByPath.get(canonicalPath) || null;
}

function getTierForEntry(entry: DccMediaManifestEntry): "gold" | "high" | "standard" {
  const reviewEntry = getMediaReviewEntry(entry.canonicalPath);
  return reviewEntry?.pageTier || entry.priority;
}

function getReviewStateForAsset(
  entry: DccMediaManifestEntry,
  asset: DccMediaAsset
): DccEditorialReviewState {
  const reviewEntry = getMediaReviewEntry(entry.canonicalPath);
  const state = reviewEntry?.assetReviews.find((item) => item.assetId === asset.id)?.state;
  return state || "candidate";
}

function getPolicyForScope(
  entry: DccMediaManifestEntry,
  scope: DccMediaAsset["role"]
): DccEditorialScopePolicy {
  const tier = getTierForEntry(entry);
  const tierPolicy = reviewManifest.tierPolicies[tier];
  const reviewEntry = getMediaReviewEntry(entry.canonicalPath);
  const override = reviewEntry?.scopeOverrides.find((item) => item.scope === scope)?.policy;
  return override || tierPolicy[scope];
}

function isAssetRenderable(entry: DccMediaManifestEntry, asset: DccMediaAsset): boolean {
  const state = getReviewStateForAsset(entry, asset);
  const policy = getPolicyForScope(entry, asset.role);
  if (state === "approved") return true;
  if (state === "candidate") return policy.allowCandidate;
  return false;
}

function filterRenderable(entry: DccMediaManifestEntry, role: DccMediaAsset["role"]): DccMediaAsset[] {
  return entry.assets.filter((asset) => asset.role === role && isAssetRenderable(entry, asset));
}

export function getHeroAsset(entry: DccMediaManifestEntry): DccMediaAsset | null {
  return filterRenderable(entry, "hero")[0] || null;
}

export function getSectionAssets(entry: DccMediaManifestEntry): DccMediaAsset[] {
  return filterRenderable(entry, "section");
}

export function getGalleryAssets(entry: DccMediaManifestEntry): DccMediaAsset[] {
  return filterRenderable(entry, "gallery");
}
