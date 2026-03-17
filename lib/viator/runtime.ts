import { getViatorCapabilities } from "@/lib/viator/access";
import { getTaxonomyCacheStatus, getReviewCacheStatus } from "@/lib/viator/cache-status";
import { getViatorPublicConfig, getViatorServerConfig } from "@/lib/viator/config";
import { getViatorClient } from "@/lib/viator/client";
import { getViatorDestinationCatalogSource } from "@/lib/viator/destinations";
import { getViatorTagCatalogSource } from "@/lib/viator/tags";

export async function getViatorRuntimeCapabilityProbe(): Promise<Record<string, string>> {
  return getViatorClient().probeCapabilities();
}

export async function getViatorRuntimeSnapshot(probe: Record<string, string> | null = null) {
  const publicConfig = getViatorPublicConfig();
  const serverConfig = getViatorServerConfig();
  const resolvedProbe = probe || (await getViatorRuntimeCapabilityProbe());
  const baseCapabilities = getViatorCapabilities(publicConfig.accessTier);
  const reviewsOperational = resolvedProbe.reviews === "ok";
  const capabilities = {
    ...baseCapabilities,
    canUseReviews: baseCapabilities.canUseReviews && reviewsOperational,
    canUseTravelerPhotos: baseCapabilities.canUseTravelerPhotos && reviewsOperational,
  };
  const taxonomy = getTaxonomyCacheStatus();
  const reviews = getReviewCacheStatus();
  const apiConfigured = Boolean(serverConfig.apiKey);

  return {
    accessTier: publicConfig.accessTier,
    locale: publicConfig.locale,
    medium: publicConfig.medium,
    sourcePolicy: serverConfig.sourcePolicy,
    apiConfigured,
    capabilities,
    probe: resolvedProbe,
    effectiveDataPath: {
      destinations: apiConfigured ? "live_or_cache" : getViatorDestinationCatalogSource(),
      tags: apiConfigured ? "live_or_policy_overlay" : getViatorTagCatalogSource(),
      productDetail: apiConfigured ? "live_first_with_local_fallback" : "local_only",
      reviews: reviews.fileCount > 0 ? "cached_reviews" : "no_review_cache",
    },
    caches: {
      taxonomy,
      reviews,
    },
  };
}
