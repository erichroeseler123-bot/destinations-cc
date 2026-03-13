import { z } from "zod";

const IsoDateTimeSchema = z.string().datetime({ offset: true });
const SlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const ImpactLevelSchema = z.enum(["low", "medium", "medium-high", "high"]);
const TimezoneSchema = z.string().regex(/^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/);

const DatasetHeaderSchema = z.object({
  city: SlugSchema,
  version: z.number().int().positive(),
  as_of: IsoDateTimeSchema,
  ttl_seconds: z.number().int().positive(),
  stale_after: IsoDateTimeSchema,
});

export const LaunchStatusSchema = z.enum(["seed", "beta", "live"]);
export const DensityProfileSchema = z.enum(["compact", "mixed", "sprawling"]);
export const CityModeSchema = z.enum(["nightlife-heavy", "event-heavy", "convention-heavy", "tourism-heavy"]);

export const AnchorTypeSchema = z.enum([
  "residential-tower",
  "hotel-residential",
  "neighborhood-anchor",
  "district-anchor",
  "office-cluster-anchor",
]);

export const DistrictTypeSchema = z.enum([
  "downtown-core",
  "entertainment-district",
  "stadium-district",
  "arts-district",
  "waterfront",
  "nightlife-corridor",
  "convention-corridor",
  "mixed-use-core",
]);

export const VenueTypeSchema = z.enum([
  "event-venue",
  "district-hub",
  "mobility-hub",
  "major-event-campus",
]);

export const PlaceTypeSchema = z.enum([
  "restaurant",
  "bar",
  "food-hall",
  "brewery",
  "restaurant-bar",
  "rooftop-bar",
  "coffeehouse",
]);

export const EventStatusSchema = z.enum(["live_now", "starting_soon", "upcoming", "ended", "cancelled"]);

export const EventSourceKindSchema = z.enum([
  "manual-curation",
  "ticketing-feed",
  "venue-calendar",
  "partner-feed",
]);

export const SignalTypeSchema = z.enum([
  "high_impact",
  "event_awareness",
  "district_activity",
  "micro_post",
]);

export const SignalProvenanceSchema = z.enum(["derived", "source_backed", "manual_editorial"]);
export const SignalStatusSchema = z.enum(["active", "scheduled", "expired", "suppressed"]);

export const LiveCityRegistryEntrySchema = z.object({
  slug: SlugSchema,
  name: z.string().min(2),
  state: z.string().min(2),
  timezone: TimezoneSchema,
  centroid: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  default_walk_radius_m: z.number().int().positive(),
  launch_status: LaunchStatusSchema,
  density_profile: DensityProfileSchema,
  modes: z.array(CityModeSchema).min(1),
});

export const LiveCityRegistrySchema = z.object({
  version: z.number().int().positive(),
  updated_at: IsoDateTimeSchema,
  cities: z.array(LiveCityRegistryEntrySchema).min(1),
});

export const LiveCityAnchorSchema = z.object({
  slug: SlugSchema,
  name: z.string().min(2),
  anchor_type: AnchorTypeSchema,
  address: z.string().min(6),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  default_walk_radius_m: z.number().int().positive(),
  district_slugs: z.array(SlugSchema).min(1),
  nearby_venue_slugs: z.array(SlugSchema).min(1),
  nearby_place_slugs: z.array(SlugSchema).min(1),
});

export const LiveCityDistrictSchema = z.object({
  slug: SlugSchema,
  name: z.string().min(2),
  district_type: DistrictTypeSchema,
  center: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  radius_m: z.number().int().positive(),
  vibe_tags: z.array(z.string().min(2)).min(1),
  venue_slugs: z.array(SlugSchema).min(1),
  place_slugs: z.array(SlugSchema).min(1),
  impact_profile: ImpactLevelSchema,
});

export const LiveCityVenueSchema = z.object({
  slug: SlugSchema,
  name: z.string().min(2),
  venue_type: VenueTypeSchema,
  category: z.string().min(2),
  address: z.string().min(6),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  impact_potential: ImpactLevelSchema,
  district_slugs: z.array(SlugSchema).min(1),
  near_anchor_slugs: z.array(SlugSchema).min(1),
});

export const LiveCityPlaceSchema = z.object({
  slug: SlugSchema,
  name: z.string().min(2),
  place_type: PlaceTypeSchema,
  category: z.string().min(2),
  address: z.string().min(6),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  district_slugs: z.array(SlugSchema).min(1),
  tags: z.array(z.string().min(2)).min(1),
  quick_actions: z.array(z.enum(["menu", "reserve", "directions"])).min(1),
});

export const LiveCityEventSourceSchema = z.object({
  kind: EventSourceKindSchema,
  external_id: z.string().min(3),
});

export const LiveCityEventSchema = z.object({
  id: z.string().min(3),
  slug: SlugSchema,
  title: z.string().min(2),
  venue_slug: SlugSchema,
  category: z.string().min(2),
  start_time: IsoDateTimeSchema,
  end_time: IsoDateTimeSchema,
  status: EventStatusSchema,
  impact_level: ImpactLevelSchema,
  attendance_band: z.enum(["small", "moderate", "large"]),
  source: LiveCityEventSourceSchema,
  description: z.string().min(10),
});

export const LiveCitySignalSourceRefSchema = z.object({
  kind: z.enum(["venue-partner", "ticketing-feed", "manual-curation", "venue-calendar", "partner-feed"]),
  external_id: z.string().min(3),
});

export const LiveCitySignalSchema = z.object({
  id: z.string().min(3),
  signal_type: SignalTypeSchema,
  provenance: SignalProvenanceSchema,
  title: z.string().min(2),
  description: z.string().min(10),
  impact_level: ImpactLevelSchema,
  rank_weight: z.number().min(0).max(1),
  status: SignalStatusSchema,
  starts_at: IsoDateTimeSchema,
  expires_at: IsoDateTimeSchema,
  linked_event_id: z.string().min(3).optional(),
  linked_venue_slug: SlugSchema.optional(),
  linked_place_slug: SlugSchema.optional(),
  affected_district_slugs: z.array(SlugSchema).optional(),
  near_anchor_slugs: z.array(SlugSchema).min(1),
  pro_tip: z.string().min(8).optional(),
  source_ref: LiveCitySignalSourceRefSchema.optional(),
});

export const LiveCityAnchorsFileSchema = DatasetHeaderSchema.extend({
  schema: z.object({
    entity: z.literal("anchor"),
    description: z.string().min(10),
  }),
  anchors: z.array(LiveCityAnchorSchema).min(1),
});

export const LiveCityDistrictsFileSchema = DatasetHeaderSchema.extend({
  schema: z.object({
    entity: z.literal("district"),
    description: z.string().min(10),
  }),
  districts: z.array(LiveCityDistrictSchema).min(1),
});

export const LiveCityVenuesFileSchema = DatasetHeaderSchema.extend({
  schema: z.object({
    entity: z.literal("venue"),
    description: z.string().min(10),
    venue_types: z.record(VenueTypeSchema, z.string().min(10)),
  }),
  venues: z.array(LiveCityVenueSchema).min(1),
});

export const LiveCityPlacesFileSchema = DatasetHeaderSchema.extend({
  schema: z.object({
    entity: z.literal("place"),
    description: z.string().min(10),
  }),
  places: z.array(LiveCityPlaceSchema).min(1),
});

export const LiveCityEventsFileSchema = DatasetHeaderSchema.extend({
  schema: z.object({
    entity: z.literal("event"),
    description: z.string().min(10),
  }),
  events: z.array(LiveCityEventSchema).min(1),
});

export const LiveCitySignalsFileSchema = DatasetHeaderSchema.extend({
  schema: z.object({
    entity: z.literal("signal"),
    description: z.string().min(10),
    provenance_types: z.array(SignalProvenanceSchema).min(1),
  }),
  signals: z.array(LiveCitySignalSchema).min(1),
});

export type LiveCityRegistry = z.infer<typeof LiveCityRegistrySchema>;
export type LiveCityRegistryEntry = z.infer<typeof LiveCityRegistryEntrySchema>;
export type LiveCityAnchor = z.infer<typeof LiveCityAnchorSchema>;
export type LiveCityDistrict = z.infer<typeof LiveCityDistrictSchema>;
export type LiveCityVenue = z.infer<typeof LiveCityVenueSchema>;
export type LiveCityPlace = z.infer<typeof LiveCityPlaceSchema>;
export type LiveCityEvent = z.infer<typeof LiveCityEventSchema>;
export type LiveCitySignal = z.infer<typeof LiveCitySignalSchema>;
export type LiveCityAnchorsFile = z.infer<typeof LiveCityAnchorsFileSchema>;
export type LiveCityDistrictsFile = z.infer<typeof LiveCityDistrictsFileSchema>;
export type LiveCityVenuesFile = z.infer<typeof LiveCityVenuesFileSchema>;
export type LiveCityPlacesFile = z.infer<typeof LiveCityPlacesFileSchema>;
export type LiveCityEventsFile = z.infer<typeof LiveCityEventsFileSchema>;
export type LiveCitySignalsFile = z.infer<typeof LiveCitySignalsFileSchema>;
