import { z } from "zod";

const QueryTypeEnum = z.enum([
  "line",
  "ship",
  "destination",
  "port",
  "search",
  "calendar",
]);
const SortModeEnum = z.enum(["price", "duration", "departure", "popular"]);

const SourceEnum = z.enum([
  "cache",
  "local-catalog",
  "live-api",
  "fallback",
  "catalog_fallback",
  "live_api",
]);

const CacheStatusEnum = z.enum(["fresh", "stale", "miss", "bypass"]);

const CabinTypeEnum = z.enum([
  "inside",
  "oceanview",
  "balcony",
  "suite",
  "unknown",
]);

const ItineraryTypeEnum = z.enum([
  "roundtrip",
  "oneway",
  "cruise-only",
  "fly-cruise",
]);

const AvailabilityStatusEnum = z.enum([
  "good",
  "limited",
  "sold-out",
  "waitlist",
]);

const DemandLevelEnum = z.enum([
  "low",
  "medium",
  "high",
  "very-high",
]);

const EventTypeEnum = z.enum([
  "dining",
  "party",
  "show",
  "themed",
  "holiday",
]);

const BookingProviderEnum = z.enum([
  "direct-line",
  "amadeus",
  "traveltek",
  "widgety",
  "expedition-api",
  "other",
]);

const DateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid YYYY-MM-DD date");
const DateTimeOrTbdSchema = z
  .string()
  .datetime({ offset: true })
  .or(z.literal("TBD"));

function parseIsoMaybe(value: string): number | null {
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : t;
}

export const PortCallSchema = z
  .object({
    port_name: z.string().min(1),
    port_code: z.string().optional(),
    arrival: DateTimeOrTbdSchema,
    departure: DateTimeOrTbdSchema,
    duration_hours: z.number().positive().optional(),
    is_overnight: z.boolean().optional(),
    is_private_island: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.arrival === "TBD" || value.departure === "TBD") return;
    const a = parseIsoMaybe(value.arrival);
    const d = parseIsoMaybe(value.departure);
    if (a === null || d === null) return;
    if (d < a) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Port call departure must be >= arrival",
        path: ["departure"],
      });
    }
  })
  .strict();

export const CruiseBookingActionSchema = z
  .object({
    provider: BookingProviderEnum,
    booking_url: z.string().url(),
    price_snapshot: z.number().positive().optional(),
    currency: z.string().length(3),
    cabin_category: z.string().optional(),
    deep_link_params: z.record(z.string(), z.string()).optional(),
    disclaimer: z.string().optional(),
    source: SourceEnum.optional(),
    cache_status: CacheStatusEnum.optional(),
  })
  .strict();

export const CruiseSailingSchema = z
  .object({
    sailing_id: z.string().min(1),
    line: z.string().min(1),
    line_slug: z.string().optional(),
    ship: z.string().min(1),
    ship_slug: z.string().optional(),
    ship_image_url: z.string().url().optional(),

    departure_date: DateOnlySchema,
    duration_days: z.number().int().positive(),
    itinerary_type: ItineraryTypeEnum,
    embark_port: PortCallSchema,
    disembark_port: PortCallSchema,
    ports: z.array(PortCallSchema).min(1),
    sea_days: z.number().int().nonnegative(),

    starting_price: z
      .object({
        amount: z.number().positive(),
        currency: z.string().length(3),
        cabin_type: CabinTypeEnum,
      })
      .strict()
      .optional(),

    availability_status: AvailabilityStatusEnum.optional(),

    amenities: z
      .object({
        dining: z.array(z.string()),
        entertainment: z.array(z.string()),
        activities: z.array(z.string()),
        wellness: z.array(z.string()),
        other: z.array(z.string()),
      })
      .strict(),

    events: z
      .array(
        z
          .object({
            date_offset_days: z.number().int().nonnegative(),
            name: z.string().min(1),
            description: z.string().optional(),
            type: EventTypeEnum.optional(),
          })
          .strict()
      )
      .optional(),

    sailing_context: z
      .object({
        demand_level: DemandLevelEnum,
        notes: z.array(z.string()).optional(),
      })
      .strict()
      .optional(),

    source: z.string().min(1),
    external_booking_url: z.string().url().optional(),
    external_provider: BookingProviderEnum.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.sea_days > value.duration_days) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "sea_days cannot exceed duration_days",
        path: ["sea_days"],
      });
    }

    if (value.ports.length > 0) {
      const first = value.ports[0];
      const last = value.ports[value.ports.length - 1];
      if (first.port_name !== value.embark_port.port_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "First ports[] item must match embark_port",
          path: ["ports", 0, "port_name"],
        });
      }
      if (last.port_name !== value.disembark_port.port_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Last ports[] item must match disembark_port",
          path: ["ports", value.ports.length - 1, "port_name"],
        });
      }
    }

    if (value.embark_port.departure !== "TBD") {
      const embarkTs = parseIsoMaybe(value.embark_port.departure);
      if (embarkTs !== null) {
        const embarkDate = new Date(embarkTs).toISOString().slice(0, 10);
        if (embarkDate !== value.departure_date) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "departure_date must align with embark_port departure date",
            path: ["departure_date"],
          });
        }
      }
    }

    if (value.starting_price && value.availability_status === "sold-out") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sold-out sailings should not expose starting_price",
        path: ["starting_price"],
      });
    }
  })
  .strict();

export const CruisePayloadSchema = z
  .object({
    payload_id: z.string().min(1),
    query: z
      .object({
        type: QueryTypeEnum,
        value: z.string().min(1),
        date_range: z
          .object({
            start: DateOnlySchema,
            end: DateOnlySchema.optional(),
          })
          .strict()
          .optional(),
      })
      .strict(),
    cruises: z.array(CruiseSailingSchema),
    summary: z
      .object({
        total_results: z.number().int().nonnegative(),
        sort_mode: SortModeEnum,
        min_duration_days: z.number().int().nonnegative(),
        max_duration_days: z.number().int().nonnegative(),
        price_range: z
          .object({
            min: z.number().positive(),
            max: z.number().positive(),
            currency: z.string().length(3),
          })
          .strict()
          .optional(),
        popular_lines: z.array(z.string()),
      })
      .strict()
      .optional(),
    context: z
      .object({
        risk_summary: z.string().optional(),
        recent_observations: z.array(z.string()).optional(),
        last_updated: z.string().datetime({ offset: true }),
      })
      .strict(),
    action: z
      .object({
        cruise_bookings: z.array(CruiseBookingActionSchema).optional(),
      })
      .strict()
      .optional(),
    diagnostics: z
      .object({
        source: SourceEnum,
        cache_status: CacheStatusEnum,
        stale: z.boolean(),
        last_updated: z.string().datetime({ offset: true }).nullable(),
        stale_after: z.string().datetime({ offset: true }).nullable(),
        fallback_reason: z.string().nullable(),
      })
      .strict(),
  })
  .superRefine((value, ctx) => {
    if (value.summary) {
      if (value.summary.total_results !== value.cruises.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "summary.total_results must equal cruises.length",
          path: ["summary", "total_results"],
        });
      }
      if (value.cruises.length > 0) {
        const durations = value.cruises.map((c) => c.duration_days);
        const minD = Math.min(...durations);
        const maxD = Math.max(...durations);
        if (value.summary.min_duration_days !== minD) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "summary.min_duration_days does not match cruises data",
            path: ["summary", "min_duration_days"],
          });
        }
        if (value.summary.max_duration_days !== maxD) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "summary.max_duration_days does not match cruises data",
            path: ["summary", "max_duration_days"],
          });
        }
      }
    }
  })
  .strict();

export const CruiseCacheFileSchema = z
  .object({
    generated_at: z.string().datetime({ offset: true }),
    source: z.string().min(1),
    sailings: z.array(CruiseSailingSchema),
  })
  .strict();

export type CruisePayloadValidated = z.infer<typeof CruisePayloadSchema>;
export type CruiseSailingValidated = z.infer<typeof CruiseSailingSchema>;
export type PortCallValidated = z.infer<typeof PortCallSchema>;
export type CruiseBookingActionValidated = z.infer<typeof CruiseBookingActionSchema>;
