import { z } from "zod";
import { NETWORK_NODE_BY_ID } from "@/lib/network/nodes";
import {
  EVENT_CATEGORIES,
  EVENT_COMMERCIAL_PATH_TYPES,
  EVENT_GEOCODE_CONFIDENCE,
  EVENT_GEOCODE_SOURCES,
  EVENT_SOURCE_PROVIDERS,
  EVENT_STATUSES,
  EVENT_TICKET_STATUSES,
} from "./types";

const NetworkNodeIdSchema = z.enum(Object.keys(NETWORK_NODE_BY_ID) as [keyof typeof NETWORK_NODE_BY_ID, ...(keyof typeof NETWORK_NODE_BY_ID)[]]);

export const EventSourceProviderSchema = z.enum(EVENT_SOURCE_PROVIDERS);
export const EventCategorySchema = z.enum(EVENT_CATEGORIES);
export const EventStatusSchema = z.enum(EVENT_STATUSES);
export const EventTicketStatusSchema = z.enum(EVENT_TICKET_STATUSES);
export const EventGeocodeSourceSchema = z.enum(EVENT_GEOCODE_SOURCES);
export const EventGeocodeConfidenceSchema = z.enum(EVENT_GEOCODE_CONFIDENCE);
export const EventCommercialPathTypeSchema = z.enum(EVENT_COMMERCIAL_PATH_TYPES);

const UrlSchema = z.string().url();
const IsoDateTimeSchema = z.string().datetime({ offset: true });
const NonEmptyStringSchema = z.string().trim().min(1);

export const EventSourceConfigSchema = z.object({
  id: NonEmptyStringSchema,
  provider: EventSourceProviderSchema,
  displayName: NonEmptyStringSchema,
  enabled: z.boolean(),
  ingestionMode: z.enum(["disabled", "manual", "api"]),
  baseUrl: UrlSchema.optional(),
  docsUrl: UrlSchema.optional(),
  notes: z.string().optional(),
});

export const EventVenueSchema = z.object({
  venueId: NonEmptyStringSchema,
  venueName: NonEmptyStringSchema,
  address1: NonEmptyStringSchema,
  address2: z.string().optional(),
  city: NonEmptyStringSchema,
  state: NonEmptyStringSchema,
  postalCode: z.string().optional(),
  country: NonEmptyStringSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  neighborhood: z.string().optional(),
  market: NonEmptyStringSchema,
  region: NonEmptyStringSchema,
  geocodeSource: EventGeocodeSourceSchema,
  geocodeConfidence: EventGeocodeConfidenceSchema,
});

export const EventCommercialPathSchema = z.object({
  type: EventCommercialPathTypeSchema,
  href: NonEmptyStringSchema,
  cta: NonEmptyStringSchema,
});

export const EventDisplayModelSchema = z.object({
  cardTitle: NonEmptyStringSchema,
  cardSubtitle: z.string().optional(),
  shortSummary: NonEmptyStringSchema,
  badge: z.string().optional(),
  imageUrl: UrlSchema.optional(),
  altText: z.string().optional(),
  primaryCta: NonEmptyStringSchema,
  primaryHref: NonEmptyStringSchema,
  secondaryCta: z.string().optional(),
  secondaryHref: z.string().optional(),
  sourceLabel: NonEmptyStringSchema,
  sourceUrl: UrlSchema,
});

export const NormalizedEventSchema = z
  .object({
    eventId: NonEmptyStringSchema,
    sourceProvider: EventSourceProviderSchema,
    sourceEventId: NonEmptyStringSchema,
    sourceUrl: UrlSchema,
    ticketUrl: UrlSchema.optional(),
    title: NonEmptyStringSchema,
    subtitle: z.string().optional(),
    description: z.string().optional(),
    category: EventCategorySchema,
    performers: z.array(NonEmptyStringSchema).default([]),
    startsAt: IsoDateTimeSchema,
    doorsAt: IsoDateTimeSchema.optional(),
    endsAt: IsoDateTimeSchema.optional(),
    timezone: NonEmptyStringSchema,
    ticketStatus: EventTicketStatusSchema.optional(),
    minPrice: z.number().nonnegative().optional(),
    maxPrice: z.number().nonnegative().optional(),
    currency: z.string().length(3).optional(),
    status: EventStatusSchema,
    venue: EventVenueSchema,
    nodeId: NetworkNodeIdSchema,
    commercialPath: EventCommercialPathSchema,
    demandScore: z.number().min(0).max(100),
    next48Eligible: z.boolean(),
    pressEligible: z.boolean(),
    display: EventDisplayModelSchema,
    updatedAt: IsoDateTimeSchema,
  })
  .superRefine((event, ctx) => {
    if ((event.minPrice !== undefined || event.maxPrice !== undefined) && !event.currency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currency"],
        message: "currency is required when prices are present.",
      });
    }

    if (event.minPrice !== undefined && event.maxPrice !== undefined && event.minPrice > event.maxPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minPrice"],
        message: "minPrice cannot be greater than maxPrice.",
      });
    }

    if (event.display.sourceUrl !== event.sourceUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["display", "sourceUrl"],
        message: "display.sourceUrl must match event.sourceUrl.",
      });
    }
  });

export const EventManifestMetadataSchema = z.object({
  version: NonEmptyStringSchema,
  generatedAt: IsoDateTimeSchema.nullable(),
  description: z.string().optional(),
});

export const Next48ManifestSchema = z.object({
  metadata: EventManifestMetadataSchema,
  items: z.array(NormalizedEventSchema),
});

export const PressQueueItemSchema = z.object({
  eventId: NonEmptyStringSchema,
  nodeId: NetworkNodeIdSchema,
  sourceUrl: UrlSchema,
  commercialPath: EventCommercialPathSchema,
  topic: NonEmptyStringSchema,
  draftStatus: z.enum(["queued", "draft", "review", "approved", "rejected"]),
  queuedAt: IsoDateTimeSchema.optional(),
});

export const PressQueueManifestSchema = z.object({
  metadata: EventManifestMetadataSchema,
  items: z.array(PressQueueItemSchema),
});

export const EventOpportunitySchema = z.object({
  opportunityId: NonEmptyStringSchema,
  eventId: NonEmptyStringSchema,
  nodeId: NetworkNodeIdSchema,
  sourceUrl: UrlSchema,
  commercialPath: EventCommercialPathSchema,
  opportunityType: z.enum(["shuttle", "tour", "guide", "deal", "parking", "hotel", "food", "fallback"]),
  demandScore: z.number().min(0).max(100),
  status: z.enum(["open", "watch", "closed"]),
});

export const EventOpportunitiesManifestSchema = z.object({
  metadata: EventManifestMetadataSchema,
  items: z.array(EventOpportunitySchema),
});

export const EventSourcesManifestSchema = z.array(EventSourceConfigSchema);
export const EventVenuesManifestSchema = z.array(EventVenueSchema);
export const NormalizedEventsManifestSchema = z.array(NormalizedEventSchema);

export type ParsedNormalizedEvent = z.infer<typeof NormalizedEventSchema>;
