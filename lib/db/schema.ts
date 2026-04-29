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

export const dccOrders = pgTable(
  "dcc_orders",
  {
    orderId: text("order_id").primaryKey(),
    route: text("route").notNull(),
    status: text("status"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    customerEmail: text("customer_email"),
    customerPhone: text("customer_phone"),
    paymentProvider: text("payment_provider"),
    paymentId: text("payment_id"),
    eventDate: date("event_date"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  },
  (table) => ({
    routeCreatedAtIdx: index("dcc_orders_route_created_at_idx").on(table.route, table.createdAt),
    statusIdx: index("dcc_orders_status_idx").on(table.status),
    customerEmailIdx: index("dcc_orders_customer_email_idx").on(table.customerEmail),
    paymentIdIdx: uniqueIndex("dcc_orders_payment_id_uidx").on(table.paymentId),
    eventDateIdx: index("dcc_orders_event_date_idx").on(table.eventDate),
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

export type DccHandoffEventRow = typeof dccHandoffEvents.$inferSelect;
export type NewDccHandoffEventRow = typeof dccHandoffEvents.$inferInsert;

export type DccHandoffSummaryRow = typeof dccHandoffSummaries.$inferSelect;
export type NewDccHandoffSummaryRow = typeof dccHandoffSummaries.$inferInsert;

export type DccReconciliationRow = typeof dccReconciliation.$inferSelect;
export type NewDccReconciliationRow = typeof dccReconciliation.$inferInsert;

export type DccOrderRow = typeof dccOrders.$inferSelect;
export type NewDccOrderRow = typeof dccOrders.$inferInsert;

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
