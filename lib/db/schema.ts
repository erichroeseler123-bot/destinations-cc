import {
  bigserial,
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const dccSatelliteIdEnum = pgEnum("dcc_satellite_id", [
  "partyatredrocks",
  "shuttleya",
  "gosno",
  "saveonthestrip",
  "redrocksfastpass",
  "welcometotheswamp",
  "welcome-to-alaska",
  "feastly",
]);

export const dccSatelliteEventTypeEnum = pgEnum("dcc_satellite_event_type", [
  "handoff_viewed",
  "lead_captured",
  "booking_started",
  "booking_completed",
  "booking_failed",
  "booking_cancelled",
  "status_updated",
  "traveler_returned",
  "ticket_clickout",
  "tour_clickout",
  "inventory_low",
  "inventory_unavailable",
  "response_degraded",
  "booking_failure_rate_high",
  "temporarily_paused",
  "forwarded_to_partner",
  "accepted_from_partner",
  "partner_booking_completed",
  "partner_booking_failed",
  "feastly_checkout_intent",
]);

export const dccConversionSourceEnum = pgEnum("dcc_conversion_source", [
  "square",
  "stripe",
  "fareharbor",
  "manual",
  "partner",
]);

export const dccReconciliationProviderEnum = pgEnum("dcc_reconciliation_provider", [
  "square",
  "stripe",
  "fareharbor",
  "partner",
  "manual",
]);

export const dccReconciliationMatchTypeEnum = pgEnum("dcc_reconciliation_match_type", [
  "exact_metadata",
  "reference_field",
  "order_join",
  "partner_callback",
  "manual_review",
]);

export const dccReconciliationMatchConfidenceEnum = pgEnum("dcc_reconciliation_match_confidence", [
  "high",
  "medium",
  "low",
]);

export const dccReconciliationStatusEnum = pgEnum("dcc_reconciliation_status", [
  "pending",
  "matched",
  "confirmed",
  "failed",
  "cancelled",
  "refunded",
]);

export const dccOperatorTypeEnum = pgEnum("dcc_operator_type", [
  "independent_driver",
  "carrier",
  "dispatcher",
  "broker",
  "owner_operator",
]);

export const dccVerificationStatusEnum = pgEnum("dcc_verification_status", [
  "unverified",
  "pending",
  "verified",
  "rejected",
  "suspended",
]);

export const dccServiceTypeEnum = pgEnum("dcc_service_type", [
  "freight",
  "passenger",
  "courier",
]);

export const dccEquipmentTypeEnum = pgEnum("dcc_equipment_type", [
  "cargo_van",
  "sprinter_van",
  "box_truck",
  "flatbed",
  "reefer",
  "dry_van",
  "hotshot",
  "power_only",
  "suv",
  "sedan",
  "shuttle_van",
]);

export const dccServiceClaimStatusEnum = pgEnum("dcc_service_claim_status", [
  "draft",
  "pending_verification",
  "active",
  "paused",
  "rejected",
  "archived",
]);

export const dccLanePostStatusEnum = pgEnum("dcc_lane_post_status", [
  "open",
  "filled",
  "expired",
  "cancelled",
]);

export const dccServiceModeEnum = pgEnum("dcc_service_mode", [
  "standby",
  "scheduled",
  "group_fill",
  "priority",
]);

export const dccHubTypeEnum = pgEnum("dcc_hub_type", [
  "micro_hub",
  "storefront",
  "locker_bank",
  "yard",
  "community_center",
]);

export const dccShipmentUnitTypeEnum = pgEnum("dcc_shipment_unit_type", [
  "pallet",
  "tote",
  "crate",
  "carton_group",
  "locker_load",
  "loose_cargo",
  "trailer",
]);

export const dccShipmentStatusEnum = pgEnum("dcc_shipment_status", [
  "planned",
  "in_transit",
  "arrived",
  "transferred",
  "delayed",
  "cancelled",
  "delivered",
  "exception",
]);

export const dccShipmentEventTypeEnum = pgEnum("dcc_shipment_event_type", [
  "manifested",
  "load",
  "unload",
  "transfer",
  "arrival",
  "departure",
  "delay",
  "reroute",
  "delivery_confirmation",
  "exception",
]);

export const earthosMissionEntityEnum = pgEnum("earthos_mission_entity", [
  "gosno",
  "alaska",
  "redrocks",
  "earthos",
]);

export const earthosMissionStatusEnum = pgEnum("earthos_mission_status", [
  "running",
  "waiting",
  "failed",
  "completed",
]);

export const earthosMissionRiskLevelEnum = pgEnum("earthos_mission_risk_level", [
  "Normal",
  "Watch",
  "High",
]);

export const earthosNetworkTargetEnum = pgEnum("earthos_network_target", [
  "live-ops",
]);

export const dccCorridorHealthStatusEnum = pgEnum("dcc_corridor_health_status", [
  "healthy",
  "stale",
  "degraded",
  "recovery_required",
  "blocked",
]);

export const dccExternalDependencyStatusEnum = pgEnum("dcc_external_dependency_status", [
  "pass",
  "degraded",
  "fail",
]);

export const dccCorridorCatalog = pgTable(
  "dcc_corridor_catalog",
  {
    corridorId: text("corridor_id").primaryKey(),
    corridorName: text("corridor_name").notNull(),
    family: text("family").notNull(),
    appPath: text("app_path").notNull(),
    status: text("status").notNull(),
    continuityLevel: text("continuity_level").notNull(),
    patternFamily: text("pattern_family"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    familyIdx: index("dcc_corridor_catalog_family_idx").on(table.family),
    statusIdx: index("dcc_corridor_catalog_status_idx").on(table.status),
  }),
);

export const dccCorridorEvents = pgTable(
  "dcc_corridor_events",
  {
    eventId: uuid("event_id").primaryKey().defaultRandom(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),

    corridorId: text("corridor_id")
      .notNull()
      .references(() => dccCorridorCatalog.corridorId, { onDelete: "restrict" }),
    family: text("family").notNull(),
    eventName: text("event_name").notNull(),

    handoffId: text("handoff_id"),
    sessionId: text("session_id"),
    userId: text("user_id"),

    sourcePage: text("source_page"),
    landingPath: text("landing_path"),
    targetPath: text("target_path"),

    requestedLane: text("requested_lane"),
    resolvedLane: text("resolved_lane"),
    topic: text("topic"),
    subtype: text("subtype"),
    port: text("port"),
    handoffDate: date("handoff_date"),

    defaultCardSlug: text("default_card_slug"),
    clickedProductSlug: text("clicked_product_slug"),
    routeTarget: text("route_target"),
    fitSignal: text("fit_signal"),
    urgency: text("urgency"),

    confidenceDowngraded: boolean("confidence_downgraded").notNull().default(false),
    winningRuleIds: text("winning_rule_ids").array().notNull().default(sql`'{}'::text[]`),
    winningFields: jsonb("winning_fields")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),

    pageVariant: text("page_variant"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  },
  (table) => ({
    corridorTimeIdx: index("dcc_corridor_events_corridor_time_idx").on(table.corridorId, table.occurredAt),
    eventTimeIdx: index("dcc_corridor_events_event_time_idx").on(table.eventName, table.occurredAt),
    flowIdx: index("dcc_corridor_events_flow_idx").on(table.corridorId, table.handoffId, table.sessionId),
    downgradedIdx: index("dcc_corridor_events_downgraded_idx").on(
      table.corridorId,
      table.confidenceDowngraded,
    ),
    familyIdx: index("dcc_corridor_events_family_idx").on(table.family, table.occurredAt),
  }),
);

export const dccHandoffEvents = pgTable(
  "dcc_handoff_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    eventId: text("event_id").notNull(),
    handoffId: text("handoff_id").notNull(),
    satelliteId: dccSatelliteIdEnum("satellite_id").notNull(),
    eventType: dccSatelliteEventTypeEnum("event_type").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),

    source: text("source"),
    sourcePath: text("source_path"),
    externalReference: text("external_reference"),
    status: text("status"),
    stage: text("stage"),
    message: text("message"),

    travelerEmail: text("traveler_email"),
    travelerPhone: text("traveler_phone"),
    travelerName: text("traveler_name"),
    travelerPartySize: integer("traveler_party_size"),

    attributionSourceSlug: text("attribution_source_slug"),
    attributionSourcePage: text("attribution_source_page"),
    attributionTopicSlug: text("attribution_topic_slug"),

    bookingVenueSlug: text("booking_venue_slug"),
    bookingPortSlug: text("booking_port_slug"),
    bookingCitySlug: text("booking_city_slug"),
    bookingProductSlug: text("booking_product_slug"),
    bookingEventDate: date("booking_event_date"),
    bookingQuantity: integer("booking_quantity"),
    bookingCurrency: text("booking_currency"),
    bookingAmount: numeric("booking_amount", { precision: 12, scale: 2 }),

    partnerFromSite: text("partner_from_site"),
    partnerToSite: text("partner_to_site"),
    partnerHandoffId: text("partner_handoff_id"),
    partnerReason: text("partner_reason"),

    metadata: jsonb("metadata").$type<Record<string, string | number | boolean | null>>().notNull().default({}),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  },
  (table) => ({
    eventIdUniqueIdx: uniqueIndex("dcc_handoff_events_event_id_uidx").on(table.eventId),
    handoffIdIdx: index("dcc_handoff_events_handoff_id_idx").on(table.handoffId),
    satelliteIdIdx: index("dcc_handoff_events_satellite_id_idx").on(table.satelliteId),
    eventTypeIdx: index("dcc_handoff_events_event_type_idx").on(table.eventType),
    receivedAtIdx: index("dcc_handoff_events_received_at_idx").on(table.receivedAt),
    sourcePageIdx: index("dcc_handoff_events_source_page_idx").on(table.attributionSourcePage),
    productSlugIdx: index("dcc_handoff_events_product_slug_idx").on(table.bookingProductSlug),
  }),
);

export const dccHandoffSummaries = pgTable(
  "dcc_handoff_summaries",
  {
    handoffId: text("handoff_id").primaryKey(),
    satelliteId: dccSatelliteIdEnum("satellite_id").notNull(),

    firstEventAt: timestamp("first_event_at", { withTimezone: true }).notNull(),
    lastEventAt: timestamp("last_event_at", { withTimezone: true }).notNull(),
    latestEventType: dccSatelliteEventTypeEnum("latest_event_type").notNull(),
    latestStatus: text("latest_status"),
    latestStage: text("latest_stage"),
    latestMessage: text("latest_message"),

    eventCount: integer("event_count").notNull().default(0),
    degraded: boolean("degraded").notNull().default(false),

    travelerEmail: text("traveler_email"),
    travelerPhone: text("traveler_phone"),
    travelerName: text("traveler_name"),
    travelerPartySize: integer("traveler_party_size"),

    attributionSourceSlug: text("attribution_source_slug"),
    attributionSourcePage: text("attribution_source_page"),
    attributionTopicSlug: text("attribution_topic_slug"),

    bookingVenueSlug: text("booking_venue_slug"),
    bookingPortSlug: text("booking_port_slug"),
    bookingCitySlug: text("booking_city_slug"),
    bookingProductSlug: text("booking_product_slug"),
    bookingEventDate: date("booking_event_date"),
    bookingQuantity: integer("booking_quantity"),
    bookingCurrency: text("booking_currency"),
    bookingAmount: numeric("booking_amount", { precision: 12, scale: 2 }),

    partnerFromSite: text("partner_from_site"),
    partnerToSite: text("partner_to_site"),
    partnerHandoffId: text("partner_handoff_id"),
    partnerReason: text("partner_reason"),

    externalReferences: jsonb("external_references").$type<string[]>().notNull().default([]),
    metadata: jsonb("metadata").$type<Record<string, string | number | boolean | null>>().notNull().default({}),

    converted: boolean("converted").notNull().default(false),
    convertedAt: timestamp("converted_at", { withTimezone: true }),
    conversionSource: dccConversionSourceEnum("conversion_source"),
    conversionReference: text("conversion_reference"),
    recognizedRevenue: numeric("recognized_revenue", { precision: 12, scale: 2 }),
    recognizedCurrency: text("recognized_currency"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    lastEventAtIdx: index("dcc_handoff_summaries_last_event_at_idx").on(table.lastEventAt),
    satelliteIdIdx: index("dcc_handoff_summaries_satellite_id_idx").on(table.satelliteId),
    latestEventTypeIdx: index("dcc_handoff_summaries_latest_event_type_idx").on(table.latestEventType),
    degradedIdx: index("dcc_handoff_summaries_degraded_idx").on(table.degraded),
    convertedIdx: index("dcc_handoff_summaries_converted_idx").on(table.converted),
    sourcePageIdx: index("dcc_handoff_summaries_source_page_idx").on(table.attributionSourcePage),
  }),
);

export const dccReconciliation = pgTable(
  "dcc_reconciliation",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    handoffId: text("handoff_id")
      .notNull()
      .references(() => dccHandoffSummaries.handoffId, { onDelete: "cascade" }),

    provider: dccReconciliationProviderEnum("provider").notNull(),
    providerType: text("provider_type").notNull(),
    providerReference: text("provider_reference").notNull(),
    providerParentReference: text("provider_parent_reference"),

    matchType: dccReconciliationMatchTypeEnum("match_type").notNull(),
    matchConfidence: dccReconciliationMatchConfidenceEnum("match_confidence").notNull().default("high"),

    amount: numeric("amount", { precision: 12, scale: 2 }),
    currency: text("currency"),
    convertedAt: timestamp("converted_at", { withTimezone: true }),

    status: dccReconciliationStatusEnum("status").notNull(),
    details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),

    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    providerReferenceUniqueIdx: uniqueIndex("dcc_reconciliation_provider_reference_uidx").on(
      table.provider,
      table.providerReference,
    ),
    handoffIdIdx: index("dcc_reconciliation_handoff_id_idx").on(table.handoffId),
    providerIdx: index("dcc_reconciliation_provider_idx").on(table.provider, table.providerType),
    statusIdx: index("dcc_reconciliation_status_idx").on(table.status),
  }),
);

export const dccOperators = pgTable(
  "dcc_operators",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    operatorType: dccOperatorTypeEnum("operator_type").notNull(),

    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    bio: text("bio"),

    dotNumber: text("dot_number"),
    mcNumber: text("mc_number"),
    fmcsaStatus: text("fmcsa_status"),
    insuranceOnFile: boolean("insurance_on_file").notNull().default(false),
    lastFmcsaCheck: timestamp("last_fmcsa_check", { withTimezone: true }),
    fmcsaPayload: jsonb("fmcsa_payload").$type<Record<string, unknown>>(),

    homeBasePlaceId: text("home_base_place_id"),
    verificationStatus: dccVerificationStatusEnum("verification_status").notNull().default("unverified"),

    equipmentTypes: jsonb("equipment_types").$type<string[]>().notNull().default([]),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugUniqueIdx: uniqueIndex("dcc_operators_slug_uidx").on(table.slug),
    dotNumberUniqueIdx: uniqueIndex("dcc_operators_dot_number_uidx").on(table.dotNumber),
    mcNumberUniqueIdx: uniqueIndex("dcc_operators_mc_number_uidx").on(table.mcNumber),
    contactEmailIdx: index("dcc_operators_contact_email_idx").on(table.contactEmail),
    operatorTypeIdx: index("dcc_operators_operator_type_idx").on(table.operatorType),
    verificationStatusIdx: index("dcc_operators_verification_status_idx").on(table.verificationStatus),
    homeBasePlaceIdx: index("dcc_operators_home_base_place_idx").on(table.homeBasePlaceId),
  }),
);

export const dccServiceClaims = pgTable(
  "dcc_service_claims",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    operatorId: integer("operator_id")
      .notNull()
      .references(() => dccOperators.id, { onDelete: "cascade" }),

    originPlaceId: text("origin_place_id").notNull(),
    destinationPlaceId: text("destination_place_id").notNull(),

    serviceType: dccServiceTypeEnum("service_type").notNull(),
    equipmentType: dccEquipmentTypeEnum("equipment_type").notNull(),
    schedulePattern: text("schedule_pattern"),
    coverageRadiusMiles: integer("coverage_radius_miles"),

    status: dccServiceClaimStatusEnum("status").notNull().default("draft"),
    verificationStatus: dccVerificationStatusEnum("verification_status").notNull().default("unverified"),
    proofNotes: text("proof_notes"),

    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    operatorIdx: index("dcc_service_claims_operator_id_idx").on(table.operatorId),
    originDestinationIdx: index("dcc_service_claims_origin_destination_idx").on(
      table.originPlaceId,
      table.destinationPlaceId,
    ),
    serviceTypeIdx: index("dcc_service_claims_service_type_idx").on(table.serviceType),
    equipmentTypeIdx: index("dcc_service_claims_equipment_type_idx").on(table.equipmentType),
    statusIdx: index("dcc_service_claims_status_idx").on(table.status),
    verificationStatusIdx: index("dcc_service_claims_verification_status_idx").on(table.verificationStatus),
  }),
);

export const dccLanePosts = pgTable(
  "dcc_lane_posts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    serviceClaimId: integer("service_claim_id")
      .notNull()
      .references(() => dccServiceClaims.id, { onDelete: "cascade" }),

    availableFrom: timestamp("available_from", { withTimezone: true }).notNull(),
    availableTo: timestamp("available_to", { withTimezone: true }),
    capacity: integer("capacity"),
    serviceMode: dccServiceModeEnum("service_mode").notNull().default("scheduled"),
    rateVisibility: text("rate_visibility"),
    notes: text("notes"),
    status: dccLanePostStatusEnum("status").notNull().default("open"),

    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    serviceClaimIdx: index("dcc_lane_posts_service_claim_id_idx").on(table.serviceClaimId),
    serviceModeIdx: index("dcc_lane_posts_service_mode_idx").on(table.serviceMode),
    statusIdx: index("dcc_lane_posts_status_idx").on(table.status),
    availableFromIdx: index("dcc_lane_posts_available_from_idx").on(table.availableFrom),
  }),
);

export const dccHubSites = pgTable(
  "dcc_hub_sites",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    placeId: text("place_id").notNull(),
    operatorId: integer("operator_id").references(() => dccOperators.id, { onDelete: "set null" }),
    hubType: dccHubTypeEnum("hub_type").notNull(),
    name: text("name").notNull(),
    status: dccVerificationStatusEnum("status").notNull().default("unverified"),
    publicPickupAllowed: boolean("public_pickup_allowed").notNull().default(false),
    robotFriendly: boolean("robot_friendly").notNull().default(false),
    coldStorage: boolean("cold_storage").notNull().default(false),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    placeIdx: index("dcc_hub_sites_place_id_idx").on(table.placeId),
    operatorIdx: index("dcc_hub_sites_operator_id_idx").on(table.operatorId),
    hubTypeIdx: index("dcc_hub_sites_hub_type_idx").on(table.hubType),
    statusIdx: index("dcc_hub_sites_status_idx").on(table.status),
  }),
);

export const dccShipmentUnits = pgTable(
  "dcc_shipment_units",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    externalId: text("external_id").notNull(),

    shipperUserId: text("shipper_user_id"),
    operatorId: integer("operator_id").references(() => dccOperators.id, { onDelete: "set null" }),

    originPlaceId: text("origin_place_id").notNull(),
    destinationPlaceId: text("destination_place_id").notNull(),
    currentPlaceId: text("current_place_id"),

    unitType: dccShipmentUnitTypeEnum("unit_type").notNull().default("pallet"),
    quantity: integer("quantity").notNull().default(1),
    weightKg: numeric("weight_kg", { precision: 10, scale: 2 }),
    volumeM3: numeric("volume_m3", { precision: 10, scale: 3 }),
    dimensions: jsonb("dimensions").$type<{
      length?: number;
      width?: number;
      height?: number;
      unit?: "cm" | "m" | "in" | "ft";
    }>(),

    serviceMode: dccServiceModeEnum("service_mode").notNull().default("scheduled"),
    lanePostId: integer("lane_post_id").references(() => dccLanePosts.id, { onDelete: "set null" }),
    hubSiteId: integer("hub_site_id").references(() => dccHubSites.id, { onDelete: "set null" }),

    status: dccShipmentStatusEnum("status").notNull().default("planned"),
    temperatureRequired: boolean("temperature_required").notNull().default(false),

    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    externalIdUniqueIdx: uniqueIndex("dcc_shipment_units_external_id_uidx").on(table.externalId),
    originDestinationIdx: index("dcc_shipment_units_origin_destination_idx").on(
      table.originPlaceId,
      table.destinationPlaceId,
    ),
    currentPlaceIdx: index("dcc_shipment_units_current_place_idx").on(table.currentPlaceId),
    lanePostIdx: index("dcc_shipment_units_lane_post_id_idx").on(table.lanePostId),
    hubSiteIdx: index("dcc_shipment_units_hub_site_id_idx").on(table.hubSiteId),
    operatorIdx: index("dcc_shipment_units_operator_id_idx").on(table.operatorId),
    statusIdx: index("dcc_shipment_units_status_idx").on(table.status),
    serviceModeIdx: index("dcc_shipment_units_service_mode_idx").on(table.serviceMode),
  }),
);

export const dccShipmentEvents = pgTable(
  "dcc_shipment_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    shipmentUnitId: integer("shipment_unit_id")
      .notNull()
      .references(() => dccShipmentUnits.id, { onDelete: "cascade" }),

    fromPlaceId: text("from_place_id"),
    toPlaceId: text("to_place_id"),

    fromOperatorId: integer("from_operator_id").references(() => dccOperators.id, { onDelete: "set null" }),
    toOperatorId: integer("to_operator_id").references(() => dccOperators.id, { onDelete: "set null" }),

    fromLanePostId: integer("from_lane_post_id").references(() => dccLanePosts.id, { onDelete: "set null" }),
    toLanePostId: integer("to_lane_post_id").references(() => dccLanePosts.id, { onDelete: "set null" }),
    hubSiteId: integer("hub_site_id").references(() => dccHubSites.id, { onDelete: "set null" }),

    eventType: dccShipmentEventTypeEnum("event_type").notNull(),
    status: dccShipmentStatusEnum("status").notNull().default("planned"),

    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    notes: text("notes"),
    gpsLat: numeric("gps_lat", { precision: 10, scale: 7 }),
    gpsLng: numeric("gps_lng", { precision: 10, scale: 7 }),

    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    shipmentUnitIdx: index("dcc_shipment_events_shipment_unit_id_idx").on(table.shipmentUnitId),
    fromToPlaceIdx: index("dcc_shipment_events_from_to_place_idx").on(table.fromPlaceId, table.toPlaceId),
    hubSiteIdx: index("dcc_shipment_events_hub_site_id_idx").on(table.hubSiteId),
    occurredAtIdx: index("dcc_shipment_events_occurred_at_idx").on(table.occurredAt),
    eventTypeIdx: index("dcc_shipment_events_event_type_idx").on(table.eventType),
    statusIdx: index("dcc_shipment_events_status_idx").on(table.status),
  }),
);

export const earthosMissions = pgTable(
  "earthos_missions",
  {
    missionId: text("mission_id").primaryKey(),
    entity: earthosMissionEntityEnum("entity").notNull(),
    region: text("region").notNull(),
    mission: text("mission").notNull(),
    status: earthosMissionStatusEnum("status").notNull(),
    currentStep: text("current_step"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    lastCheckpointAt: timestamp("last_checkpoint_at", { withTimezone: true }),
    waitingForEvent: text("waiting_for_event"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    result: jsonb("result").$type<Record<string, unknown> | null>(),
    error: jsonb("error").$type<{
      message: string;
      step?: string;
    } | null>(),
    intelligence: jsonb("intelligence").$type<{
      headline: string;
      briefing: string;
      riskLevel: "Normal" | "Watch" | "High";
      recommendedAction: string;
      dccSignals: {
        alertCount: number;
        graphHealth: number | null;
      };
    } | null>(),
    workflowSource: text("workflow_source").notNull().default("earthos"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    entityIdx: index("earthos_missions_entity_idx").on(table.entity),
    statusIdx: index("earthos_missions_status_idx").on(table.status),
    updatedAtIdx: index("earthos_missions_updated_at_idx").on(table.updatedAt),
    waitingEventIdx: index("earthos_missions_waiting_event_idx").on(table.waitingForEvent),
    entityRegionIdx: index("earthos_missions_entity_region_idx").on(table.entity, table.region),
  }),
);

export const earthosMissionSteps = pgTable(
  "earthos_mission_steps",
  {
    stepId: text("step_id").primaryKey(),
    missionId: text("mission_id")
      .notNull()
      .references(() => earthosMissions.missionId, { onDelete: "cascade" }),
    name: text("name").notNull(),
    status: earthosMissionStatusEnum("status").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    retryCount: integer("retry_count").notNull().default(0),
    output: jsonb("output").$type<Record<string, unknown> | null>(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    missionIdx: index("earthos_mission_steps_mission_id_idx").on(table.missionId),
    missionStatusIdx: index("earthos_mission_steps_mission_status_idx").on(table.missionId, table.status),
  }),
);

export const earthosPublications = pgTable(
  "earthos_publications",
  {
    missionId: text("mission_id").primaryKey(),
    slug: text("slug").notNull(),
    path: text("path").notNull(),
    entity: earthosMissionEntityEnum("entity").notNull(),
    region: text("region").notNull(),
    headline: text("headline").notNull(),
    briefing: text("briefing").notNull(),
    riskLevel: earthosMissionRiskLevelEnum("risk_level").notNull(),
    recommendedAction: text("recommended_action").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    networkTarget: earthosNetworkTargetEnum("network_target").notNull().default("live-ops"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugUniqueIdx: uniqueIndex("earthos_publications_slug_uidx").on(table.slug),
    publishedAtIdx: index("earthos_publications_published_at_idx").on(table.publishedAt),
    entityPublishedIdx: index("earthos_publications_entity_published_at_idx").on(table.entity, table.publishedAt),
    riskPublishedIdx: index("earthos_publications_risk_published_at_idx").on(table.riskLevel, table.publishedAt),
  }),
);

export const earthosDiscoveryPublications = pgTable(
  "earthos_discovery_publications",
  {
    publicationId: text("publication_id").primaryKey(),
    surfaceId: text("surface_id").notNull(),
    role: text("role").notNull(),
    domain: text("domain").notNull(),
    siteName: text("site_name").notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    version: text("version").notNull(),
    contentHash: text("content_hash").notNull(),
    agentHash: text("agent_hash").notNull(),
    llmsHash: text("llms_hash").notNull(),
    sitemapHash: text("sitemap_hash").notNull(),
    winnerCode: text("winner_code"),
    winnerConfidence: text("winner_confidence"),
    fitReason: text("fit_reason"),
    resolutionPath: text("resolution_path"),
    previousPublicationId: text("previous_publication_id"),
    previousWinnerCode: text("previous_winner_code"),
    previousWinnerConfidence: text("previous_winner_confidence"),
    changed: boolean("changed").notNull().default(false),
    changedFields: jsonb("changed_fields").$type<string[]>().notNull().default([]),
    winnerChangedAt: timestamp("winner_changed_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    surfacePublishedIdx: index("earthos_discovery_publications_surface_published_at_idx").on(
      table.surfaceId,
      table.publishedAt,
    ),
    domainPublishedIdx: index("earthos_discovery_publications_domain_published_at_idx").on(
      table.domain,
      table.publishedAt,
    ),
    changedPublishedIdx: index("earthos_discovery_publications_changed_published_at_idx").on(
      table.changed,
      table.publishedAt,
    ),
  }),
);

export const earthosControlMapFindings = pgTable(
  "earthos_control_map_findings",
  {
    findingId: text("finding_id").primaryKey(),
    status: text("status").notNull(),
    severity: text("severity").notNull(),
    owner: text("owner").notNull(),
    note: text("note"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("earthos_control_map_findings_status_idx").on(table.status),
    severityIdx: index("earthos_control_map_findings_severity_idx").on(table.severity),
    updatedAtIdx: index("earthos_control_map_findings_updated_at_idx").on(table.updatedAt),
  }),
);

export const earthosControlMapFindingHistory = pgTable(
  "earthos_control_map_finding_history",
  {
    eventSequence: bigserial("event_sequence", { mode: "number" }).primaryKey(),
    findingId: text("finding_id")
      .notNull()
      .references(() => earthosControlMapFindings.findingId, { onDelete: "cascade" }),
    event: text("event").notNull(),
    status: text("status").notNull(),
    severity: text("severity").notNull(),
    owner: text("owner").notNull(),
    nodeSlug: text("node_slug").notNull(),
    corridor: text("corridor").notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
    summary: text("summary").notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedBy: text("approved_by"),
    controlSurface: text("control_surface"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    findingRecordedIdx: index("earthos_control_map_finding_history_finding_recorded_idx").on(
      table.findingId,
      table.recordedAt,
    ),
    eventIdx: index("earthos_control_map_finding_history_event_idx").on(table.event),
    recordedAtIdx: index("earthos_control_map_finding_history_recorded_at_idx").on(table.recordedAt),
    corridorIdx: index("earthos_control_map_finding_history_corridor_idx").on(table.corridor),
  }),
);

export const governanceDriftEvents = pgTable(
  "governance_drift_events",
  {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    sourceSurface: text("source_surface").notNull(),
    affectedSurface: text("affected_surface").notNull(),
    corridorId: text("corridor_id").notNull(),
    eventType: text("event_type").notNull(),
    severity: text("severity").notNull(),
    status: text("status").notNull(),
    findingId: text("finding_id"),
    summary: text("summary").notNull(),
    evidenceJson: jsonb("evidence_json").$type<Record<string, unknown>>().notNull().default({}),
    expectedRole: text("expected_role"),
    observedRole: text("observed_role"),
    continuityState: text("continuity_state"),
    machineInterpretationRisk: text("machine_interpretation_risk").notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedBy: text("resolved_by"),
  },
  (table) => ({
    createdAtIdx: index("governance_drift_events_created_at_idx").on(table.createdAt),
    corridorIdx: index("governance_drift_events_corridor_idx").on(table.corridorId),
    statusIdx: index("governance_drift_events_status_idx").on(table.status),
    severityIdx: index("governance_drift_events_severity_idx").on(table.severity),
    findingIdx: index("governance_drift_events_finding_idx").on(table.findingId),
  }),
);

export const governanceReconciliationPackets = pgTable(
  "governance_reconciliation_packets",
  {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    packetType: text("packet_type").notNull(),
    status: text("status").notNull(),
    proposedChangesJson: jsonb("proposed_changes_json").$type<Record<string, unknown>>().notNull().default({}),
    affectedRoutesJson: jsonb("affected_routes_json").$type<unknown[]>().notNull().default([]),
    affectedSurfacesJson: jsonb("affected_surfaces_json").$type<unknown[]>().notNull().default([]),
    reason: text("reason").notNull(),
    approvalRequired: boolean("approval_required").notNull().default(true),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedBy: text("approved_by"),
    appliedAt: timestamp("applied_at", { withTimezone: true }),
    resultJson: jsonb("result_json").$type<Record<string, unknown> | null>(),
  },
  (table) => ({
    createdAtIdx: index("governance_reconciliation_packets_created_at_idx").on(table.createdAt),
    packetTypeIdx: index("governance_reconciliation_packets_type_idx").on(table.packetType),
    statusIdx: index("governance_reconciliation_packets_status_idx").on(table.status),
    approvalRequiredIdx: index("governance_reconciliation_packets_approval_required_idx").on(table.approvalRequired),
  }),
);

export const governanceFindingsHistory = pgTable(
  "governance_findings_history",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    findingId: text("finding_id").notNull(),
    driftEventId: text("drift_event_id").references(() => governanceDriftEvents.id, { onDelete: "set null" }),
    packetId: text("packet_id").references(() => governanceReconciliationPackets.id, { onDelete: "set null" }),
    eventType: text("event_type").notNull(),
    status: text("status").notNull(),
    summary: text("summary").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
    recordedBy: text("recorded_by"),
  },
  (table) => ({
    findingRecordedIdx: index("governance_findings_history_finding_recorded_idx").on(table.findingId, table.recordedAt),
    driftEventIdx: index("governance_findings_history_drift_event_idx").on(table.driftEventId),
    packetIdx: index("governance_findings_history_packet_idx").on(table.packetId),
    eventTypeIdx: index("governance_findings_history_event_type_idx").on(table.eventType),
  }),
);

export const dccCorridorHealthSignals = pgTable(
  "dcc_corridor_health_signals",
  {
    corridorId: text("corridor_id").primaryKey(),
    status: dccCorridorHealthStatusEnum("status").notNull(),
    lastSuccessfulSyncAt: timestamp("last_successful_sync_at", { withTimezone: true }),
    lastAttemptedSyncAt: timestamp("last_attempted_sync_at", { withTimezone: true }).notNull(),
    freshUntil: timestamp("fresh_until", { withTimezone: true }),
    activeEventCount: integer("active_event_count").notNull().default(0),
    sourceCount: integer("source_count").notNull().default(0),
    primarySource: text("primary_source"),
    lastError: text("last_error"),
    recoveryMissionId: text("recovery_mission_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("dcc_corridor_health_signals_status_idx").on(table.status),
    freshUntilIdx: index("dcc_corridor_health_signals_fresh_until_idx").on(table.freshUntil),
    updatedAtIdx: index("dcc_corridor_health_signals_updated_at_idx").on(table.updatedAt),
  }),
);

export const dccExternalDependencyHealth = pgTable(
  "dcc_external_dependency_health",
  {
    providerId: text("provider_id").primaryKey(),
    status: dccExternalDependencyStatusEnum("status").notNull(),
    latencyMs: integer("latency_ms"),
    checkedAt: timestamp("checked_at", { withTimezone: true }).notNull(),
    expectedShape: text("expected_shape").notNull(),
    observedShape: jsonb("observed_shape").$type<Record<string, unknown>>().notNull().default({}),
    moneyMaker: boolean("money_maker").notNull().default(false),
    lastError: text("last_error"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("dcc_external_dependency_health_status_idx").on(table.status),
    moneyMakerIdx: index("dcc_external_dependency_health_money_maker_idx").on(table.moneyMaker),
    checkedAtIdx: index("dcc_external_dependency_health_checked_at_idx").on(table.checkedAt),
  }),
);

export type DccHandoffEventRow = typeof dccHandoffEvents.$inferSelect;
export type NewDccHandoffEventRow = typeof dccHandoffEvents.$inferInsert;

export type DccHandoffSummaryRow = typeof dccHandoffSummaries.$inferSelect;
export type NewDccHandoffSummaryRow = typeof dccHandoffSummaries.$inferInsert;

export type DccReconciliationRow = typeof dccReconciliation.$inferSelect;
export type NewDccReconciliationRow = typeof dccReconciliation.$inferInsert;

export type DccCorridorCatalogRow = typeof dccCorridorCatalog.$inferSelect;
export type NewDccCorridorCatalogRow = typeof dccCorridorCatalog.$inferInsert;

export type DccCorridorEventRow = typeof dccCorridorEvents.$inferSelect;
export type NewDccCorridorEventRow = typeof dccCorridorEvents.$inferInsert;

export type DccOperatorRow = typeof dccOperators.$inferSelect;
export type NewDccOperatorRow = typeof dccOperators.$inferInsert;

export type DccServiceClaimRow = typeof dccServiceClaims.$inferSelect;
export type NewDccServiceClaimRow = typeof dccServiceClaims.$inferInsert;

export type DccLanePostRow = typeof dccLanePosts.$inferSelect;
export type NewDccLanePostRow = typeof dccLanePosts.$inferInsert;

export type DccHubSiteRow = typeof dccHubSites.$inferSelect;
export type NewDccHubSiteRow = typeof dccHubSites.$inferInsert;

export type DccShipmentUnitRow = typeof dccShipmentUnits.$inferSelect;
export type NewDccShipmentUnitRow = typeof dccShipmentUnits.$inferInsert;

export type DccShipmentEventRow = typeof dccShipmentEvents.$inferSelect;
export type NewDccShipmentEventRow = typeof dccShipmentEvents.$inferInsert;

export type EarthosMissionRow = typeof earthosMissions.$inferSelect;
export type NewEarthosMissionRow = typeof earthosMissions.$inferInsert;

export type EarthosMissionStepRow = typeof earthosMissionSteps.$inferSelect;
export type NewEarthosMissionStepRow = typeof earthosMissionSteps.$inferInsert;

export type EarthosPublicationRow = typeof earthosPublications.$inferSelect;
export type NewEarthosPublicationRow = typeof earthosPublications.$inferInsert;

export type EarthosDiscoveryPublicationRow = typeof earthosDiscoveryPublications.$inferSelect;
export type NewEarthosDiscoveryPublicationRow = typeof earthosDiscoveryPublications.$inferInsert;

export type EarthosControlMapFindingRow = typeof earthosControlMapFindings.$inferSelect;
export type NewEarthosControlMapFindingRow = typeof earthosControlMapFindings.$inferInsert;

export type EarthosControlMapFindingHistoryRow = typeof earthosControlMapFindingHistory.$inferSelect;
export type NewEarthosControlMapFindingHistoryRow = typeof earthosControlMapFindingHistory.$inferInsert;

export type GovernanceDriftEventRow = typeof governanceDriftEvents.$inferSelect;
export type NewGovernanceDriftEventRow = typeof governanceDriftEvents.$inferInsert;

export type GovernanceReconciliationPacketRow = typeof governanceReconciliationPackets.$inferSelect;
export type NewGovernanceReconciliationPacketRow = typeof governanceReconciliationPackets.$inferInsert;

export type GovernanceFindingsHistoryRow = typeof governanceFindingsHistory.$inferSelect;
export type NewGovernanceFindingsHistoryRow = typeof governanceFindingsHistory.$inferInsert;

export type DccCorridorHealthSignalRow = typeof dccCorridorHealthSignals.$inferSelect;
export type NewDccCorridorHealthSignalRow = typeof dccCorridorHealthSignals.$inferInsert;

export type DccExternalDependencyHealthRow = typeof dccExternalDependencyHealth.$inferSelect;
export type NewDccExternalDependencyHealthRow = typeof dccExternalDependencyHealth.$inferInsert;

// ==========================================
// OCTO PROTOCOL & BOOKING DISTRIBUTION LAYER
// ==========================================

export const octoParticipants = pgTable(
  "octo_participants",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    role: text("role").notNull(), // supplier, reseller, booking_system, channel_manager, technology_partner
    website: text("website").notNull(),
    contactEmail: text("contact_email").notNull(),
    contactName: text("contact_name"),
    destinations: jsonb("destinations").$type<string[]>().notNull().default([]),
    endpoint: text("endpoint"),
    certificationEvidence: text("certification_evidence"),
    consentStatus: text("consent_status").notNull().default("not_requested"),
    credentialStatus: text("credential_status").notNull().default("none"),
    productsAvailableCount: integer("products_available_count").notNull().default(0),
    bookingPaymentModel: text("booking_payment_model").notNull().default("supplier_hosted"),
    outreachStatus: text("outreach_status").notNull().default("identified"),
    agreedCommissionPercent: numeric("agreed_commission_percent", { precision: 5, scale: 2 }), // Nullable pending commercial contract
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    roleIdx: index("octo_participants_role_idx").on(table.role),
    outreachStatusIdx: index("octo_participants_outreach_status_idx").on(table.outreachStatus),
  })
);

export const octoSupplierConnections = pgTable(
  "octo_supplier_connections",
  {
    id: text("id").primaryKey(),
    operatorSlug: text("operator_slug").notNull(),
    operatorName: text("operator_name").notNull(),
    endpoint: text("endpoint").notNull(),
    encryptedApiKey: text("encrypted_api_key"),
    encryptedBearerToken: text("encrypted_bearer_token"),
    capabilities: jsonb("capabilities").$type<string[]>().notNull().default(["octo/core"]),
    isSandbox: boolean("is_sandbox").notNull().default(false),
    connectionStatus: text("connection_status").notNull().default("discovery_only"), // discovery_only, authorization_pending, authorized, sandbox_verified, production_verified, bookable, suspended
    reservationPlatform: text("reservation_platform").notNull().default("direct_octo"), // ventrata, bokun, rezdy, fareharbor, peek, tourcms, zaui, direct_octo
    octoBaseUrl: text("octo_base_url"),
    apiCredentialRef: text("api_credential_ref"),
    authorizedProductIds: jsonb("authorized_product_ids").$type<string[]>().notNull().default([]),
    onboardingStage: text("onboarding_stage").notNull().default("discovered"), // discovered, consented, credentials_configured, connection_verified, catalog_synced, availability_verified, booking_tested, bookable
    operatorLegalName: text("operator_legal_name"),
    businessAddress: text("business_address"),
    signatoryName: text("signatory_name"),
    signatoryEmail: text("signatory_email"),
    consentAgreementVersion: text("consent_agreement_version").notNull().default("1.0"),
    consentTermsText: text("consent_terms_text"),
    consentedAt: timestamp("consented_at", { withTimezone: true }),
    sandboxVerifiedAt: timestamp("sandbox_verified_at", { withTimezone: true }),
    productionVerifiedAt: timestamp("production_verified_at", { withTimezone: true }),
    paymentModel: text("payment_model").notNull().default("supplier_hosted"),
    settlementTerms: text("settlement_terms"),
    commissionPercent: numeric("commission_percent", { precision: 5, scale: 2 }), // Nullable pending signed agreement
    cancellationRules: jsonb("cancellation_rules").$type<Record<string, unknown>>(),
    healthStatus: text("health_status").notNull().default("untested"), // healthy, degraded, error, untested
    lastHealthCheckAt: timestamp("last_health_check_at", { withTimezone: true }),
    lastHealthCheckStatus: text("last_health_check_status"),
    provenance: text("provenance"),
    lastVerificationTime: timestamp("last_verification_time", { withTimezone: true }),
    catalogSyncStatus: text("catalog_sync_status"),
    catalogSyncedAt: timestamp("catalog_synced_at", { withTimezone: true }),
    availabilityTestStatus: text("availability_test_status"),
    availabilityTestedAt: timestamp("availability_tested_at", { withTimezone: true }),
    bookingTestStatus: text("booking_test_status"),
    bookingTestedAt: timestamp("booking_tested_at", { withTimezone: true }),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    lastErrorMessage: text("last_error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    operatorSlugIdx: index("octo_supplier_connections_operator_slug_idx").on(table.operatorSlug),
    connectionStatusIdx: index("octo_supplier_connections_connection_status_idx").on(table.connectionStatus),
    healthStatusIdx: index("octo_supplier_connections_health_status_idx").on(table.healthStatus),
    onboardingStageIdx: index("octo_supplier_connections_onboarding_stage_idx").on(table.onboardingStage),
  })
);

export const octoNormalizedProducts = pgTable(
  "octo_normalized_products",
  {
    id: text("id").primaryKey(), // e.g. dcc:octo:prod:...
    supplierConnectionId: text("supplier_connection_id")
      .notNull()
      .references(() => octoSupplierConnections.id, { onDelete: "cascade" }),
    supplierProductReference: text("supplier_product_reference").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    destinationSlug: text("destination_slug").notNull(),
    destinationName: text("destination_name"),
    country: text("country"),
    locationName: text("location_name"),
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    defaultCurrency: text("default_currency").notNull().default("USD"),
    durationMinutes: integer("duration_minutes"),
    meetingPoint: text("meeting_point"),
    cancellationPolicy: text("cancellation_policy"),
    capabilities: jsonb("capabilities").$type<string[]>().notNull().default(["octo/core"]),
    options: jsonb("options").$type<unknown[]>().notNull().default([]),
    pricingFrom: numeric("pricing_from", { precision: 10, scale: 2 }),
    imageUrl: text("image_url"),
    sourceFreshness: timestamp("source_freshness", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    destinationSlugIdx: index("octo_normalized_products_destination_slug_idx").on(table.destinationSlug),
    supplierConnIdx: index("octo_normalized_products_supplier_conn_idx").on(table.supplierConnectionId),
  })
);

export const octoBookings = pgTable(
  "octo_bookings",
  {
    id: text("id").primaryKey(), // dcc:bk:...
    bookingUuid: text("booking_uuid").notNull(), // Matching OCTO booking UUID
    idempotencyKey: text("idempotency_key"),
    idempotencyHash: text("idempotency_hash"), // SHA256 of request payload for altered-key rejection
    supplierConnectionId: text("supplier_connection_id").notNull(),
    resellerId: text("reseller_id"),
    productId: text("product_id").notNull(),
    optionId: text("option_id").notNull(),
    availabilityId: text("availability_id").notNull(),
    status: text("status").notNull().default("ON_HOLD"), // ON_HOLD, CONFIRMED, CANCELLED, EXPIRED
    expirationMinutes: integer("expiration_minutes").notNull().default(15),
    utcHoldExpires: timestamp("utc_hold_expires", { withTimezone: true }),
    totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    unitItems: jsonb("unit_items").$type<unknown[]>().notNull().default([]),
    contact: jsonb("contact").$type<Record<string, unknown>>(),
    supplierReference: text("supplier_reference"),
    resellerReference: text("reseller_reference"),
    checkoutUrl: text("checkout_url"),
    voucher: jsonb("voucher").$type<Record<string, unknown>>(),
    cancellationReason: text("cancellation_reason"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    bookingUuidUniqueIdx: uniqueIndex("octo_bookings_booking_uuid_uidx").on(table.bookingUuid),
    idempotencyKeyIdx: index("octo_bookings_idempotency_key_idx").on(table.idempotencyKey),
    statusIdx: index("octo_bookings_status_idx").on(table.status),
    productIdIdx: index("octo_bookings_product_id_idx").on(table.productId),
    supplierConnIdx: index("octo_bookings_supplier_conn_idx").on(table.supplierConnectionId),
  })
);

export const octoSettlementLedger = pgTable(
  "octo_settlement_ledger",
  {
    id: text("id").primaryKey(), // dcc:ledg:...
    bookingId: text("booking_id")
      .notNull()
      .references(() => octoBookings.id, { onDelete: "cascade" }),
    dccReference: text("dcc_reference").notNull(),
    supplierReference: text("supplier_reference"),
    operatorSlug: text("operator_slug").notNull(),
    operatorName: text("operator_name").notNull(),
    currency: text("currency").notNull().default("USD"),
    grossAmount: numeric("gross_amount", { precision: 12, scale: 2 }).notNull(),
    dccSharePercent: numeric("dcc_share_percent", { precision: 5, scale: 2 }).default("0.00"),
    dccShareAmount: numeric("dcc_share_amount", { precision: 12, scale: 2 }).notNull(),
    operatorShareAmount: numeric("operator_share_amount", { precision: 12, scale: 2 }).notNull(),
    paymentStatus: text("payment_status").notNull().default("unpaid"), // unpaid, authorized, captured, refunded, failed
    settlementStatus: text("settlement_status").notNull().default("pending"), // pending, settled, disputed, refunded
    cancellationStatus: text("cancellation_status").notNull().default("none"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    bookingIdIdx: index("octo_settlement_ledger_booking_id_idx").on(table.bookingId),
    operatorSlugIdx: index("octo_settlement_ledger_operator_slug_idx").on(table.operatorSlug),
    settlementStatusIdx: index("octo_settlement_ledger_settlement_status_idx").on(table.settlementStatus),
  })
);

export const octoAuditLogs = pgTable(
  "octo_audit_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    status: text("status").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    errorMessage: text("error_message"),
  },
  (table) => ({
    entityIdx: index("octo_audit_logs_entity_idx").on(table.entityType, table.entityId),
    occurredAtIdx: index("octo_audit_logs_occurred_at_idx").on(table.occurredAt),
  })
);

export type OctoParticipantRow = typeof octoParticipants.$inferSelect;
export type NewOctoParticipantRow = typeof octoParticipants.$inferInsert;

export type OctoSupplierConnectionRow = typeof octoSupplierConnections.$inferSelect;
export type NewOctoSupplierConnectionRow = typeof octoSupplierConnections.$inferInsert;

export type OctoNormalizedProductRow = typeof octoNormalizedProducts.$inferSelect;
export type NewOctoNormalizedProductRow = typeof octoNormalizedProducts.$inferInsert;

export type OctoBookingRow = typeof octoBookings.$inferSelect;
export type NewOctoBookingRow = typeof octoBookings.$inferInsert;

export type OctoSettlementLedgerRow = typeof octoSettlementLedger.$inferSelect;
export type NewOctoSettlementLedgerRow = typeof octoSettlementLedger.$inferInsert;

export type OctoAuditLogRow = typeof octoAuditLogs.$inferSelect;
export type NewOctoAuditLogRow = typeof octoAuditLogs.$inferInsert;

export const dccTravelerProfiles = pgTable(
  "dcc_traveler_profiles",
  {
    id: text("id").primaryKey(), // dcc:trav:...
    email: text("email").notNull(),
    fullName: text("full_name"),
    phoneNumber: text("phone_number"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailUniqueIdx: uniqueIndex("dcc_traveler_profiles_email_uidx").on(table.email),
    createdAtIdx: index("dcc_traveler_profiles_created_at_idx").on(table.createdAt),
  })
);

export const dccAuthTokens = pgTable(
  "dcc_auth_tokens",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull(),
    otpCode: text("otp_code").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("dcc_auth_tokens_email_idx").on(table.email),
    expiresAtIdx: index("dcc_auth_tokens_expires_at_idx").on(table.expiresAt),
  })
);

export const dccOrderPayments = pgTable(
  "dcc_order_payments",
  {
    id: text("id").primaryKey(), // dcc:pay:...
    orderId: text("order_id").notNull(),
    travelerId: text("traveler_id"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    provider: text("provider").notNull(), // stripe, square, octo_reseller
    status: text("status").notNull(), // captured, authorized, partially_refunded, refunded, chargeback
    paymentMethod: text("payment_method"),
    receiptUrl: text("receipt_url"),
    customerEmail: text("customer_email"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orderIdIdx: index("dcc_order_payments_order_id_idx").on(table.orderId),
    travelerIdIdx: index("dcc_order_payments_traveler_id_idx").on(table.travelerId),
    statusIdx: index("dcc_order_payments_status_idx").on(table.status),
  })
);

export const dccOrders = pgTable(
  "dcc_orders",
  {
    id: text("id").primaryKey(), // dcc:ord:...
    travelerId: text("traveler_id"),
    resellerId: text("reseller_id"),
    status: text("status").notNull().default("PENDING_HOLD"),
    currency: text("currency").notNull().default("USD"),
    totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
    paymentId: text("payment_id"),
    paymentStatus: text("payment_status").notNull().default("unpaid"),
    idempotencyKey: text("idempotency_key"),
    idempotencyHash: text("idempotency_hash"),
    utcHoldExpires: timestamp("utc_hold_expires", { withTimezone: true }),
    customerFullName: text("customer_full_name"),
    customerEmail: text("customer_email"),
    customerPhone: text("customer_phone"),
    customerCountry: text("customer_country"),
    customerNotes: text("customer_notes"),
    sagaId: text("saga_id"),
    sagaStatus: text("saga_status").notNull().default("NOT_STARTED"),
    lastErrorCode: text("last_error_code"),
    lastErrorMessage: text("last_error_message"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    travelerIdIdx: index("dcc_orders_traveler_id_idx").on(table.travelerId),
    statusIdx: index("dcc_orders_status_idx").on(table.status),
    idempotencyKeyIdx: index("dcc_orders_idempotency_key_idx").on(table.idempotencyKey),
    sagaIdIdx: index("dcc_orders_saga_id_idx").on(table.sagaId),
    createdAtIdx: index("dcc_orders_created_at_idx").on(table.createdAt),
  })
);

export const dccOrderItems = pgTable(
  "dcc_order_items",
  {
    id: text("id").primaryKey(), // dcc:item:...
    orderId: text("order_id").notNull(),
    bookingId: text("booking_id"),
    bookingUuid: text("booking_uuid"),
    productId: text("product_id").notNull(),
    optionId: text("option_id").notNull(),
    availabilityId: text("availability_id").notNull(),
    supplierConnectionId: text("supplier_connection_id"),
    operatorSlug: text("operator_slug").notNull(),
    operatorName: text("operator_name").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    unitItems: jsonb("unit_items").$type<unknown[]>().notNull().default([]),
    status: text("status").notNull().default("ON_HOLD"), // ON_HOLD, CONFIRMED, COMPLETED, CANCELLED
    eventDate: date("event_date"),
    eventTime: text("event_time"),
    serviceCompleted: boolean("service_completed").notNull().default(false),
    serviceCompletedAt: timestamp("service_completed_at", { withTimezone: true }),
    voucher: jsonb("voucher").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orderIdIdx: index("dcc_order_items_order_id_idx").on(table.orderId),
    bookingIdIdx: index("dcc_order_items_booking_id_idx").on(table.bookingId),
    operatorSlugIdx: index("dcc_order_items_operator_slug_idx").on(table.operatorSlug),
    statusIdx: index("dcc_order_items_status_idx").on(table.status),
  })
);

export const dccOperatorPayables = pgTable(
  "dcc_operator_payables",
  {
    id: text("id").primaryKey(), // dcc:paybl:...
    orderId: text("order_id").notNull(),
    orderItemId: text("order_item_id").notNull(),
    bookingId: text("booking_id").notNull(),
    operatorSlug: text("operator_slug").notNull(),
    operatorName: text("operator_name").notNull(),
    currency: text("currency").notNull().default("USD"),
    grossAmount: numeric("gross_amount", { precision: 12, scale: 2 }).notNull(),
    dccCommissionPercent: numeric("dcc_commission_percent", { precision: 5, scale: 2 }),
    dccCommissionAmount: numeric("dcc_commission_amount", { precision: 12, scale: 2 }).notNull(),
    operatorPayableAmount: numeric("operator_payable_amount", { precision: 12, scale: 2 }).notNull(),
    reserveAmount: numeric("reserve_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
    settlementStatus: text("settlement_status").notNull().default("pending"), // pending, ready_for_payout, paid, reversed, held
    serviceDate: date("service_date"),
    serviceCompletedAt: timestamp("service_completed_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    cancellationStatus: text("cancellation_status").notNull().default("none"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orderIdIdx: index("dcc_operator_payables_order_id_idx").on(table.orderId),
    operatorSlugIdx: index("dcc_operator_payables_operator_slug_idx").on(table.operatorSlug),
    settlementStatusIdx: index("dcc_operator_payables_settlement_status_idx").on(table.settlementStatus),
    serviceDateIdx: index("dcc_operator_payables_service_date_idx").on(table.serviceDate),
  })
);

export const dccDisputesAndRefunds = pgTable(
  "dcc_disputes_and_refunds",
  {
    id: text("id").primaryKey(), // dcc:ref:... or dcc:dis:...
    type: text("type").notNull(), // refund, chargeback, reserve_recovery
    orderId: text("order_id").notNull(),
    orderItemId: text("order_item_id"),
    bookingId: text("booking_id"),
    paymentId: text("payment_id").notNull(),
    operatorSlug: text("operator_slug").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    status: text("status").notNull().default("succeeded"), // pending, succeeded, reversed
    reason: text("reason"),
    settlementImpact: text("settlement_impact").notNull(), // reduced_pending, deducted_future_payout, operator_reserve
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orderIdIdx: index("dcc_disputes_and_refunds_order_id_idx").on(table.orderId),
    operatorSlugIdx: index("dcc_disputes_and_refunds_operator_slug_idx").on(table.operatorSlug),
    typeIdx: index("dcc_disputes_and_refunds_type_idx").on(table.type),
  })
);

export const dccSupplierBookings = pgTable(
  "dcc_supplier_bookings",
  {
    id: text("id").primaryKey(), // dcc:sbk:...
    orderId: text("order_id").notNull(),
    orderItemId: text("order_item_id").notNull(),
    supplierConnectionId: text("supplier_connection_id").notNull(),
    operatorSlug: text("operator_slug").notNull(),
    operatorName: text("operator_name").notNull(),
    productId: text("product_id").notNull(),
    optionId: text("option_id").notNull(),
    availabilityId: text("availability_id").notNull(),
    providerBookingId: text("provider_booking_id"),
    providerBookingUuid: text("provider_booking_uuid"),
    status: text("status").notNull().default("PENDING_HOLD"),
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    unitItems: jsonb("unit_items").$type<unknown[]>().notNull().default([]),
    idempotencyKey: text("idempotency_key"),
    idempotencyHash: text("idempotency_hash"),
    externalRequestId: text("external_request_id"),
    attemptCount: integer("attempt_count").notNull().default(0),
    lastErrorCode: text("last_error_code"),
    lastErrorMessage: text("last_error_message"),
    voucherCode: text("voucher_code"),
    voucherUrl: text("voucher_url"),
    voucherInstructions: text("voucher_instructions"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orderIdIdx: index("dcc_supplier_bookings_order_id_idx").on(table.orderId),
    orderItemIdIdx: index("dcc_supplier_bookings_order_item_id_idx").on(table.orderItemId),
    supplierConnIdx: index("dcc_supplier_bookings_supplier_conn_idx").on(table.supplierConnectionId),
    statusIdx: index("dcc_supplier_bookings_status_idx").on(table.status),
    idempotencyKeyIdx: index("dcc_supplier_bookings_idempotency_key_idx").on(table.idempotencyKey),
  })
);

export const dccSagaSteps = pgTable(
  "dcc_saga_steps",
  {
    id: text("id").primaryKey(), // dcc:saga:step:...
    sagaId: text("saga_id").notNull(),
    orderId: text("order_id").notNull(),
    stepName: text("step_name").notNull(),
    stepIndex: integer("step_index").notNull(),
    status: text("status").notNull().default("PENDING"),
    idempotencyKey: text("idempotency_key").notNull(),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxRetries: integer("max_retries").notNull().default(3),
    retryPolicy: jsonb("retry_policy").$type<Record<string, unknown>>().notNull().default({}),
    nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
    externalReferenceId: text("external_reference_id"),
    inputPayload: jsonb("input_payload").$type<Record<string, unknown>>().notNull().default({}),
    outputPayload: jsonb("output_payload").$type<Record<string, unknown>>().default({}),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    compensationStatus: text("compensation_status").notNull().default("NOT_APPLICABLE"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sagaIdIdx: index("dcc_saga_steps_saga_id_idx").on(table.sagaId),
    orderIdIdx: index("dcc_saga_steps_order_id_idx").on(table.orderId),
    stepNameIdx: index("dcc_saga_steps_step_name_idx").on(table.stepName),
    statusIdx: index("dcc_saga_steps_status_idx").on(table.status),
    idempotencyKeyIdx: index("dcc_saga_steps_idempotency_key_idx").on(table.idempotencyKey),
  })
);

export const dccSagaAuditEvents = pgTable(
  "dcc_saga_audit_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    sagaId: text("saga_id").notNull(),
    orderId: text("order_id").notNull(),
    stepId: text("step_id"),
    eventType: text("event_type").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    idempotencyKey: text("idempotency_key"),
    attemptNumber: integer("attempt_number").notNull().default(1),
    status: text("status").notNull(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    sanitizedDetails: jsonb("sanitized_details").$type<Record<string, unknown>>().notNull().default({}),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sagaIdIdx: index("dcc_saga_audit_events_saga_id_idx").on(table.sagaId),
    orderIdIdx: index("dcc_saga_audit_events_order_id_idx").on(table.orderId),
    eventTypeIdx: index("dcc_saga_audit_events_event_type_idx").on(table.eventType),
    occurredAtIdx: index("dcc_saga_audit_events_occurred_at_idx").on(table.occurredAt),
  })
);

export type DccTravelerProfileRow = typeof dccTravelerProfiles.$inferSelect;
export type NewDccTravelerProfileRow = typeof dccTravelerProfiles.$inferInsert;

export type DccAuthTokenRow = typeof dccAuthTokens.$inferSelect;
export type NewDccAuthTokenRow = typeof dccAuthTokens.$inferInsert;

export type DccOrderRow = typeof dccOrders.$inferSelect;
export type NewDccOrderRow = typeof dccOrders.$inferInsert;

export type DccOrderPaymentRow = typeof dccOrderPayments.$inferSelect;
export type NewDccOrderPaymentRow = typeof dccOrderPayments.$inferInsert;

export type DccOrderItemRow = typeof dccOrderItems.$inferSelect;
export type NewDccOrderItemRow = typeof dccOrderItems.$inferInsert;

export type DccSupplierBookingRow = typeof dccSupplierBookings.$inferSelect;
export type NewDccSupplierBookingRow = typeof dccSupplierBookings.$inferInsert;

export type DccOperatorPayableRow = typeof dccOperatorPayables.$inferSelect;
export type NewDccOperatorPayableRow = typeof dccOperatorPayables.$inferInsert;

export type DccDisputeOrRefundRow = typeof dccDisputesAndRefunds.$inferSelect;
export type NewDccDisputeOrRefundRow = typeof dccDisputesAndRefunds.$inferInsert;

export type DccSagaStepRow = typeof dccSagaSteps.$inferSelect;
export type NewDccSagaStepRow = typeof dccSagaSteps.$inferInsert;

export type DccSagaAuditEventRow = typeof dccSagaAuditEvents.$inferSelect;
export type NewDccSagaAuditEventRow = typeof dccSagaAuditEvents.$inferInsert;

export const dccSquareWebhookEvents = pgTable(
  "dcc_square_webhook_events",
  {
    id: text("id").primaryKey(), // sq_evt_...
    squareEventId: text("square_event_id").notNull(),
    eventType: text("event_type").notNull(),
    paymentId: text("payment_id"),
    orderId: text("order_id"),
    processingStatus: text("processing_status").notNull().default("processing"), // processing, succeeded, duplicate, ignored, failed
    errorMetadata: jsonb("error_metadata").$type<Record<string, unknown>>(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    squareEventIdUniqueIdx: uniqueIndex("dcc_square_webhook_events_event_id_uidx").on(table.squareEventId),
    eventTypeIdx: index("dcc_square_webhook_events_event_type_idx").on(table.eventType),
    paymentIdIdx: index("dcc_square_webhook_events_payment_id_idx").on(table.paymentId),
    orderIdIdx: index("dcc_square_webhook_events_order_id_idx").on(table.orderId),
    processingStatusIdx: index("dcc_square_webhook_events_status_idx").on(table.processingStatus),
  })
);

export type DccSquareWebhookEventRow = typeof dccSquareWebhookEvents.$inferSelect;
export type NewDccSquareWebhookEventRow = typeof dccSquareWebhookEvents.$inferInsert;

export const dccContextStatusEnum = pgEnum("dcc_context_status", [
  "issued",
  "redeemed",
  "expired",
  "revoked",
]);

export const dccContexts = pgTable(
  "dcc_contexts",
  {
    contextId: text("context_id").primaryKey(), // "dcc_ctx_..."
    contextHash: text("context_hash").notNull(), // sha256(contextId) for secure index & lookup
    idempotencyKey: text("idempotency_key"),
    version: text("version").notNull().default("1.0"),
    status: dccContextStatusEnum("status").notNull().default("issued"),
    sourceSite: text("source_site").notNull(),
    destination: text("destination").notNull(),
    targetOwner: text("target_owner").notNull(),
    targetIntent: text("target_intent"),
    timezone: text("timezone").notNull(),

    // Schedule
    scheduleDate: text("schedule_date").notNull(), // YYYY-MM-DD
    arrival: text("arrival"), // HH:mm
    departure: text("departure"), // HH:mm
    travelers: integer("travelers").notNull().default(1),
    shipOrVenue: text("ship_or_venue"),

    // Safety Constraints & Calculated Return Windows
    bufferMinutes: integer("buffer_minutes").notNull().default(0),
    latestSafeReturnDate: text("latest_safe_return_date"),
    latestSafeReturnTime: text("latest_safe_return_time"),
    midnightCrossed: boolean("midnight_crossed").notNull().default(false),

    // Minimal Non-Sensitive Attribution Metadata
    attribution: jsonb("attribution").$type<{
      feederSessionId?: string;
      campaign?: string;
      referrerDomain?: string;
    }>(),

    // Lifecycle Timestamps
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
    redeemedBy: text("redeemed_by"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    contextHashIdx: uniqueIndex("dcc_contexts_hash_uidx").on(table.contextHash),
    idempotencyKeyIdx: uniqueIndex("dcc_contexts_idempotency_uidx").on(table.idempotencyKey),
    statusIdx: index("dcc_contexts_status_idx").on(table.status),
    expiresAtIdx: index("dcc_contexts_expires_at_idx").on(table.expiresAt),
    targetOwnerIdx: index("dcc_contexts_target_owner_idx").on(table.targetOwner),
  })
);

export type DccContextRow = typeof dccContexts.$inferSelect;
export type NewDccContextRow = typeof dccContexts.$inferInsert;
