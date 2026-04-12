import { z } from "zod";

export const CanonicalPlaceKindSchema = z.enum([
  "city",
  "venue",
  "airport",
  "port",
  "district",
  "pickup_hub",
  "corridor",
]);

export const CanonicalPlaceSchema = z.object({
  id: z.string().min(2),
  slug: z.string().min(2),
  name: z.string().min(2),
  kind: CanonicalPlaceKindSchema,
  parentPlaceId: z.string().min(2).optional(),
  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  address: z
    .object({
      line1: z.string().min(2).optional(),
      city: z.string().min(2).optional(),
      region: z.string().min(2).optional(),
      postalCode: z.string().min(2).optional(),
      country: z.string().min(2).optional(),
    })
    .optional(),
  timezone: z.string().min(2).optional(),
  tags: z.array(z.string().min(2)).optional(),
});

export const CanonicalEventCategorySchema = z.enum([
  "concert",
  "tour_departure",
  "cruise_sailing",
  "seasonal_window",
  "special_event",
]);

export const CanonicalEventSchema = z.object({
  id: z.string().min(2),
  slug: z.string().min(2),
  name: z.string().min(2),
  category: CanonicalEventCategorySchema,
  placeId: z.string().min(2),
  startAt: z.string().datetime({ offset: true }).optional(),
  endAt: z.string().datetime({ offset: true }).optional(),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  performerIds: z.array(z.string().min(2)).optional(),
  tags: z.array(z.string().min(2)).optional(),
});

export const CanonicalOperatorKindSchema = z.enum([
  "internal_brand",
  "partner",
  "affiliate",
]);

export const CanonicalOperatorStatusSchema = z.enum(["active", "paused", "degraded"]);

export const CanonicalOperatorSchema = z.object({
  id: z.string().min(2),
  slug: z.string().min(2),
  name: z.string().min(2),
  kind: CanonicalOperatorKindSchema,
  domains: z.array(z.string().min(2)).min(1),
  fulfillmentTypes: z.array(z.string().min(2)).min(1),
  serviceAreaPlaceIds: z.array(z.string().min(2)).optional(),
  bookingSystems: z.array(z.enum(["stripe", "square", "fareharbor", "custom"])).optional(),
  support: z
    .object({
      email: z.string().email().optional(),
      phone: z.string().min(4).optional(),
    })
    .optional(),
  status: CanonicalOperatorStatusSchema.optional(),
});

export const CanonicalProductKindSchema = z.enum([
  "shared_shuttle",
  "private_transfer",
  "tour",
  "lodging",
  "ticketed_experience",
]);

export const CanonicalBookingModeSchema = z.enum(["internal", "handoff", "external_partner"]);

export const CanonicalProductSchema = z.object({
  id: z.string().min(2),
  slug: z.string().min(2),
  name: z.string().min(2),
  kind: CanonicalProductKindSchema,
  operatorId: z.string().min(2),
  originPlaceId: z.string().min(2).optional(),
  destinationPlaceId: z.string().min(2).optional(),
  venuePlaceId: z.string().min(2).optional(),
  eventIds: z.array(z.string().min(2)).default([]),
  pricing: z
    .object({
      currency: z.string().length(3),
      fromAmount: z.number().nonnegative().optional(),
      pricingModel: z.enum(["per_person", "per_vehicle", "per_group", "dynamic"]).optional(),
    })
    .optional(),
  capacity: z
    .object({
      min: z.number().int().positive().optional(),
      max: z.number().int().positive().optional(),
    })
    .optional(),
  bookingMode: CanonicalBookingModeSchema,
  bookUrl: z.string().url().optional(),
  tags: z.array(z.string().min(2)).optional(),
});

export const CanonicalIntentRouteDestinationTypeSchema = z.enum([
  "dcc_page",
  "satellite_page",
  "operator_page",
  "external_checkout",
]);

export const CanonicalIntentRouteRefTypeSchema = z.enum(["place", "event", "product", "url"]);
export const CanonicalIntentRouteRoleSchema = z.enum([
  "primary",
  "fallback",
  "partner_overflow",
]);

export const CanonicalIntentRouteSchema = z.object({
  id: z.string().min(2),
  slug: z.string().min(2),
  intent: z.string().min(2),
  sourceSurface: z.enum(["dcc", "satellite"]),
  sourcePageType: z.string().min(2),
  destinationType: CanonicalIntentRouteDestinationTypeSchema,
  destinationRef: z.object({
    type: CanonicalIntentRouteRefTypeSchema,
    idOrUrl: z.string().min(2),
  }),
  handoffPolicy: z.enum(["inform_only", "decision_support", "act"]),
  routeRole: CanonicalIntentRouteRoleSchema.default("primary"),
  requiredContext: z.array(z.string().min(2)).optional(),
});

export const CanonicalLiveSignalSubjectTypeSchema = z.enum([
  "product",
  "operator",
  "event",
  "route",
]);

export const CanonicalLiveSignalTypeSchema = z.enum([
  "availability_open",
  "availability_limited",
  "sold_out",
  "price_changed",
  "pickup_changed",
  "inventory_low",
  "response_degraded",
  "temporarily_paused",
  "booking_failure_rate_high",
]);

export const CanonicalLiveSignalStatusSchema = z.enum(["ok", "warning", "critical"]);

export const CanonicalLiveSignalSchema = z.object({
  id: z.string().min(2),
  subjectType: CanonicalLiveSignalSubjectTypeSchema,
  subjectId: z.string().min(2),
  signalType: CanonicalLiveSignalTypeSchema,
  status: CanonicalLiveSignalStatusSchema,
  effectiveAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  source: z.string().min(2),
});

export const CanonicalLiveSignalArraySchema = z.array(CanonicalLiveSignalSchema);

export const CanonicalHandoffSchema = z.object({
  id: z.string().min(2),
  sourceSite: z.string().min(2),
  sourcePath: z.string().min(1),
  destinationSite: z.string().min(2),
  destinationPath: z.string().min(1).optional(),
  operatorId: z.string().min(2).optional(),
  productId: z.string().min(2).optional(),
  eventId: z.string().min(2).optional(),
  placeId: z.string().min(2).optional(),
  intentRouteId: z.string().min(2).optional(),
  travelerContext: z
    .object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      qty: z.number().int().positive().optional(),
      partyType: z.string().min(2).optional(),
    })
    .optional(),
  createdAt: z.string().datetime({ offset: true }),
});

export const EdgeSignalMapSchema = z.record(
  z.string().regex(/^live_signals:[a-zA-Z0-9:_-]+$/),
  CanonicalLiveSignalArraySchema
);

export type CanonicalPlace = z.infer<typeof CanonicalPlaceSchema>;
export type CanonicalEvent = z.infer<typeof CanonicalEventSchema>;
export type CanonicalOperator = z.infer<typeof CanonicalOperatorSchema>;
export type CanonicalProduct = z.infer<typeof CanonicalProductSchema>;
export type CanonicalIntentRoute = z.infer<typeof CanonicalIntentRouteSchema>;
export type CanonicalLiveSignal = z.infer<typeof CanonicalLiveSignalSchema>;
export type CanonicalHandoff = z.infer<typeof CanonicalHandoffSchema>;
export type EdgeSignalMap = z.infer<typeof EdgeSignalMapSchema>;
