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

export const ViatorDestinationCatalogRowSchema = z.object({
  destinationId: z.number().int(),
  parentDestinationId: z.number().int().nullable().optional(),
  name: z.string().min(1),
  type: z.string().min(1).nullable().optional(),
  timeZone: z.string().nullable().optional(),
  defaultCurrencyCode: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
});

export const ViatorDestinationCatalogSchema = z.object({
  destinations: z.array(ViatorDestinationCatalogRowSchema).default([]),
});

export const ViatorProductDetailSchema = ViatorActionProductSchema.extend({
  overview: z.string().nullable().optional(),
  durationText: z.string().nullable().optional(),
  highlights: z.array(z.string()).default([]),
  additionalInfo: z.array(z.string()).default([]),
  importantNotes: z.array(z.string()).default([]),
  itinerary: z.array(z.string()).default([]),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  pickup: z.array(z.string()).default([]),
  departure: z.array(z.string()).default([]),
  returnDetails: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  ticketType: z.string().nullable().optional(),
  confirmationType: z.string().nullable().optional(),
  operatedBy: z.string().nullable().optional(),
  redemptionInstructions: z.array(z.string()).default([]),
  bookingQuestionRefs: z.array(z.string()).default([]),
  destinations: z.array(ViatorDestinationCatalogRowSchema).default([]),
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

export const ViatorTagCatalogSchema = z.object({
  tags: z.array(ViatorTagCatalogItemSchema).default([]),
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

export const ViatorPassengerMixItemSchema = z.object({
  ageBand: z.string().min(1),
  numberOfTravelers: z.number().int().min(0),
});

export const ViatorPrebookStateSchema = z.object({
  productCode: z.string().min(1),
  travelDate: z.string().min(1),
  currency: z.string().min(3),
  paxMix: z.array(ViatorPassengerMixItemSchema).min(1),
  bookableOptions: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      startTime: z.string().nullable(),
      price: z.number().nullable(),
    })
  ),
  bookingQuestions: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      required: z.boolean(),
      type: z.string().nullable(),
      answered: z.boolean(),
    })
  ),
  answers: z.record(z.string(), z.string()).default({}),
  availabilitySummary: z.object({
    optionCount: z.number().int().min(0),
    hasBookableItems: z.boolean(),
    firstPrice: z.number().nullable(),
  }),
  readyForHold: z.boolean(),
});

export const ViatorPreparedBookingSchema = z.object({
  preparationId: z.string().min(1),
  createdAt: z.string().min(1),
  productCode: z.string().min(1),
  travelDate: z.string().min(1),
  currency: z.string().min(3),
  paxMix: z.array(ViatorPassengerMixItemSchema).min(1),
  selectedOption: z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    startTime: z.string().nullable(),
    price: z.number().nullable(),
  }).nullable(),
  bookingQuestions: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      required: z.boolean(),
      type: z.string().nullable(),
      answered: z.boolean(),
    })
  ),
  answers: z.record(z.string(), z.string()).default({}),
  validation: z.object({
    readyForHold: z.boolean(),
    missingRequiredAnswers: z.array(z.string()).default([]),
    missingSelectedOption: z.boolean(),
  }),
});

export const ViatorHoldRequestDraftSchema = z.object({
  preparationId: z.string().min(1),
  partnerBookingRef: z.string().min(1),
  partnerCartRef: z.string().min(1),
  paymentDataSubmissionMode: z.enum(["PARTNER_FORM", "VIATOR_FORM"]),
  hostingUrl: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
});

export const ViatorPaymentSessionSchema = z.object({
  preparationId: z.string().min(1),
  paymentDataSubmissionMode: z.enum(["PARTNER_FORM", "VIATOR_FORM"]).nullable(),
  paymentDataSubmissionUrl: z.string().nullable(),
  paymentSessionToken: z.string().nullable(),
  hostingUrl: z.string().nullable(),
});

export type ViatorDisplayTag = z.infer<typeof ViatorDisplayTagSchema>;
export type ViatorActionProduct = z.infer<typeof ViatorActionProductSchema>;
export type ViatorProductDetail = z.infer<typeof ViatorProductDetailSchema>;
export type ViatorReview = z.infer<typeof ViatorReviewSchema>;
export type ViatorMediaAsset = z.infer<typeof ViatorMediaAssetSchema>;
export type ViatorDestinationOption = z.infer<typeof ViatorDestinationOptionSchema>;
export type ViatorSearchControls = z.infer<typeof ViatorSearchControlsSchema>;
export type ViatorTagCatalogItem = z.infer<typeof ViatorTagCatalogItemSchema>;
export type ViatorDestinationCatalogRow = z.infer<typeof ViatorDestinationCatalogRowSchema>;
export type ViatorDestinationCatalog = z.infer<typeof ViatorDestinationCatalogSchema>;
export type ViatorTagCatalog = z.infer<typeof ViatorTagCatalogSchema>;
export type ViatorPassengerMixItem = z.infer<typeof ViatorPassengerMixItemSchema>;
export type ViatorPrebookState = z.infer<typeof ViatorPrebookStateSchema>;
export type ViatorPreparedBooking = z.infer<typeof ViatorPreparedBookingSchema>;
export type ViatorHoldRequestDraft = z.infer<typeof ViatorHoldRequestDraftSchema>;
export type ViatorPaymentSession = z.infer<typeof ViatorPaymentSessionSchema>;

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

export function normalizeViatorPrebookState(
  value: z.input<typeof ViatorPrebookStateSchema>
): ViatorPrebookState {
  return ViatorPrebookStateSchema.parse(value);
}

export function normalizeViatorPreparedBooking(
  value: z.input<typeof ViatorPreparedBookingSchema>
): ViatorPreparedBooking {
  return ViatorPreparedBookingSchema.parse(value);
}

export function normalizeViatorHoldRequestDraft(
  value: z.input<typeof ViatorHoldRequestDraftSchema>
): ViatorHoldRequestDraft {
  return ViatorHoldRequestDraftSchema.parse(value);
}

export function normalizeViatorPaymentSession(
  value: z.input<typeof ViatorPaymentSessionSchema>
): ViatorPaymentSession {
  return ViatorPaymentSessionSchema.parse(value);
}
