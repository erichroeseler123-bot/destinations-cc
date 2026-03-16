import { getViatorCapabilities } from "@/lib/viator/access";
import { getTaxonomyCacheStatus, getReviewCacheStatus } from "@/lib/viator/cache-status";
import { getViatorPublicConfig, getViatorServerConfig } from "@/lib/viator/config";
import { getViatorClient } from "@/lib/viator/client";

export async function getViatorRuntimeCapabilityProbe(): Promise<Record<string, string>> {
  return getViatorClient().probeCapabilities();
}

export async function getViatorRuntimeSnapshot() {
  const publicConfig = getViatorPublicConfig();
  const serverConfig = getViatorServerConfig();
  const capabilities = getViatorCapabilities(publicConfig.accessTier);
  const probe = await getViatorRuntimeCapabilityProbe();

  return {
    accessTier: publicConfig.accessTier,
    locale: publicConfig.locale,
    medium: publicConfig.medium,
    sourcePolicy: serverConfig.sourcePolicy,
    apiConfigured: Boolean(serverConfig.apiKey),
    capabilities,
    probe,
    caches: {
      taxonomy: getTaxonomyCacheStatus(),
      reviews: getReviewCacheStatus(),
    },
  };
}
