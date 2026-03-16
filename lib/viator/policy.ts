import { getViatorCapabilities } from "@/lib/viator/access";
import { getViatorPublicConfig } from "@/lib/viator/config";
import { getViatorFrontendTagDefinitions, type ViatorTagDefinition } from "@/lib/viator/tags";
import {
  VIATOR_DESTINATION_CACHE_TTL_HOURS,
  VIATOR_RECOMMENDATION_CACHE_TTL_HOURS,
  VIATOR_REVIEW_CACHE_TTL_HOURS,
  VIATOR_REVIEW_INDEXING,
  VIATOR_TAG_CACHE_TTL_HOURS,
  getViatorReviewContentNotice,
  getViatorTravelerPhotoNotice,
} from "@/lib/viator/reviews";

export const VIATOR_CONTENT_POLICY = {
  indexReviews: false,
  indexTravelerPhotos: false,
  keepTravelerPhotosSeparate: true,
  shouldRenderMerchandisingLabelsDirectly: false,
  shouldSuppressUnsupportedTags: true,
} as const;

export const VIATOR_CACHE_POLICY = {
  reviewsHours: VIATOR_REVIEW_CACHE_TTL_HOURS,
  tagsHours: VIATOR_TAG_CACHE_TTL_HOURS,
  destinationsHours: VIATOR_DESTINATION_CACHE_TTL_HOURS,
  recommendationsHours: VIATOR_RECOMMENDATION_CACHE_TTL_HOURS,
} as const;

export type ViatorPolicy = {
  accessTier: ReturnType<typeof getViatorPublicConfig>["accessTier"];
  capabilities: ReturnType<typeof getViatorCapabilities>;
  indexing: typeof VIATOR_REVIEW_INDEXING;
  content: typeof VIATOR_CONTENT_POLICY;
  cache: typeof VIATOR_CACHE_POLICY;
  frontendTags: ViatorTagDefinition[];
  reviewNotice: string;
  travelerPhotoNotice: string;
};

export function getViatorPolicy(): ViatorPolicy {
  const config = getViatorPublicConfig();
  return {
    accessTier: config.accessTier,
    capabilities: getViatorCapabilities(config.accessTier),
    indexing: VIATOR_REVIEW_INDEXING,
    content: VIATOR_CONTENT_POLICY,
    cache: VIATOR_CACHE_POLICY,
    frontendTags: getViatorFrontendTagDefinitions(),
    reviewNotice: getViatorReviewContentNotice(),
    travelerPhotoNotice: getViatorTravelerPhotoNotice(),
  };
}
