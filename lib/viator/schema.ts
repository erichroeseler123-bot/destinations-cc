import { z } from "zod";

export const ViatorDisplayTagSchema = z.object({
  tagId: z.number().int(),
  label: z.string().min(1),
  policy: z.enum(["frontend", "backend_only", "unsupported"]),
  kind: z.enum([
    "category",
    "feature",
    "participant",
    "occasion",
    "timeframe",
    "distinction",
    "merchandising",
    "compliance",
  ]),
  query: z.string().optional(),
});

export const ViatorActionProductSchema = z.object({
  product_code: z.string().min(1),
  title: z.string().min(1),
  short_description: z.string().nullable().optional(),
  rating: z.number().nullable(),
  review_count: z.number().int().nullable(),
  price_from: z.number().nullable(),
  currency: z.string().min(3),
  duration_minutes: z.number().int().nullable(),
  image_url: z.string().nullable(),
  supplier_name: z.string().nullable().optional(),
  itinerary_type: z.string().nullable().optional(),
  booking_confirmation_type: z.string().nullable().optional(),
  product_option_count: z.number().int().nullable().optional(),
  product_option_titles: z.array(z.string()).nullable().optional(),
  tag_ids: z.array(z.number().int()).optional(),
  display_tags: z.array(ViatorDisplayTagSchema).optional(),
  merchandising_score: z.number().int().optional(),
  url: z.string().min(1),
});

export const ViatorMediaAssetSchema = z.object({
  url: z.string().min(1),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  source: z.enum(["supplier", "traveler"]),
  provider: z.string().nullable().optional(),
});

export const ViatorReviewSchema = z.object({
  reviewId: z.string().min(1),
  provider: z.string().nullable().optional(),
  userName: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  publishedDate: z.string().nullable().optional(),
  rating: z.number().nullable().optional(),
  title: z.string().nullable().optional(),
  text: z.string().nullable().optional(),
  travelerPhotos: z.array(ViatorMediaAssetSchema).default([]),
});

export const ViatorCancellationPolicySchema = z.object({
  policyType: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  freeCancellation: z.boolean().optional(),
});

export const ViatorProductDetailSchema = ViatorActionProductSchema.extend({
  overview: z.string().nullable().optional(),
  itinerary: z.array(z.string()).default([]),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  pickup: z.array(z.string()).default([]),
  departure: z.array(z.string()).default([]),
  returnDetails: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  ticketType: z.string().nullable().optional(),
  bookingQuestionRefs: z.array(z.string()).default([]),
  cancellationPolicy: ViatorCancellationPolicySchema.nullable().optional(),
  supplierImages: z.array(ViatorMediaAssetSchema).default([]),
  travelerImages: z.array(ViatorMediaAssetSchema).default([]),
  reviews: z.array(ViatorReviewSchema).default([]),
});

export const ViatorTagCatalogItemSchema = z.object({
  tagId: z.number().int(),
  parentTagIds: z.array(z.number().int()).default([]),
  allNamesByLocale: z.record(z.string(), z.string()).default({}),
});

export const ViatorDestinationOptionSchema = z.object({
  routeSlug: z.string().min(1),
  cityName: z.string().min(1),
  state: z.string().optional(),
  country: z.string().optional(),
  destinationId: z.number().int().optional(),
  timeZone: z.string().optional(),
  defaultCurrencyCode: z.string().optional(),
  searchTerms: z.array(z.string()).default([]),
});

export const ViatorSearchControlsSchema = z.object({
  query: z.string().default(""),
  sort: z.string().default("recommended"),
  currency: z.string().default("USD"),
  minRating: z.number().nullable(),
  maxPrice: z.number().nullable(),
  maxDuration: z.number().nullable(),
  tagId: z.number().int().nullable(),
  recommendedOnly: z.boolean().default(false),
});

export type ViatorDisplayTag = z.infer<typeof ViatorDisplayTagSchema>;
export type ViatorActionProduct = z.infer<typeof ViatorActionProductSchema>;
export type ViatorProductDetail = z.infer<typeof ViatorProductDetailSchema>;
export type ViatorReview = z.infer<typeof ViatorReviewSchema>;
export type ViatorMediaAsset = z.infer<typeof ViatorMediaAssetSchema>;
export type ViatorDestinationOption = z.infer<typeof ViatorDestinationOptionSchema>;
export type ViatorSearchControls = z.infer<typeof ViatorSearchControlsSchema>;
export type ViatorTagCatalogItem = z.infer<typeof ViatorTagCatalogItemSchema>;

export function normalizeViatorActionProduct(
  value: z.input<typeof ViatorActionProductSchema>
): ViatorActionProduct {
  return ViatorActionProductSchema.parse(value);
}

export function normalizeViatorProductDetail(
  value: z.input<typeof ViatorProductDetailSchema>
): ViatorProductDetail {
  return ViatorProductDetailSchema.parse(value);
}
