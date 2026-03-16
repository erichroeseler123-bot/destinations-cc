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
export type ViatorDestinationOption = z.infer<typeof ViatorDestinationOptionSchema>;
export type ViatorSearchControls = z.infer<typeof ViatorSearchControlsSchema>;

export function normalizeViatorActionProduct(
  value: z.input<typeof ViatorActionProductSchema>
): ViatorActionProduct {
  return ViatorActionProductSchema.parse(value);
}
