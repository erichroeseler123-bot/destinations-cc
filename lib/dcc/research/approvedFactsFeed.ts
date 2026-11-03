export type ResearchClusterId =
  | "alaska-juneau"
  | "alaska-ketchikan"
  | "new-orleans-swamp";

export type ResearchPortSlug = "juneau" | "ketchikan" | "new-orleans";

export type ResearchConstraintType =
  | "total_duration"
  | "duration"
  | "pickup_meeting"
  | "pickup_rules"
  | "transport_inclusion"
  | "age_policy"
  | "minimum_age"
  | "minimum_height"
  | "child_seat_and_fare"
  | "mobility_requirements"
  | "weight_declaration"
  | "bag_policy"
  | "cancellation_policy"
  | "price"
  | "exclusions"
  | string;

export type ResearchFactEligibilityStatus =
  | "verified"
  | "needs_confirmation"
  | "withdrawn"
  | "expired"
  | "conflicted"
  | "source_changed"
  | "source_unhealthy"
  | "invalid_record";

export type ResearchFactDisqualificationReason =
  | "unconfirmed_candidate"
  | "withdrawn_fact"
  | "review_deadline_expired"
  | "conflicted_evidence"
  | "source_hash_drift"
  | "source_unhealthy"
  | "missing_human_verifier"
  | "invalid_verified_on"
  | "invalid_review_due_on"
  | "empty_fact_value"
  | "unconfirmed_revision"
  | "unmapped_product_id"
  | "blocked_umbrella_product"
  | "cluster_product_mismatch"
  | "missing_fact_id";

export interface ExplicitResearchProductMapping {
  productId: string;
  productName: string;
  operatorId: string;
  operatorName: string;
  portSlug: ResearchPortSlug;
  clusterId: ResearchClusterId;
  bookingChannel: "direct_operator" | "port_shuttle" | "blocked_umbrella";
  fareharborShortname?: string;
  fareharborItemId?: string;
  officialSourceUrls: string[];
  dccOptionId?: string;
  cruisePromenadeExcursionId?: string;
  nonTransferableNote: string;
}

export const EXPLICIT_RESEARCH_PRODUCT_REGISTRY: Record<
  string,
  ExplicitResearchProductMapping
> = {
  "coastal-helicopters-icefield-excursion-direct": {
    productId: "coastal-helicopters-icefield-excursion-direct",
    productName: "Coastal Helicopters — Herbert Glacier Icefield Excursion (Direct)",
    operatorId: "coastal-helicopters",
    operatorName: "Coastal Helicopters",
    portSlug: "juneau",
    clusterId: "alaska-juneau",
    bookingChannel: "direct_operator",
    fareharborShortname: "coastalhelicopters",
    fareharborItemId: "413056",
    officialSourceUrls: [
      "https://coastalhelicopters.com/tours/icefield-excursion/",
    ],
    dccOptionId: "jun-opt-coastal-icefield-excursion-direct",
    cruisePromenadeExcursionId: "coastal-helicopters-icefield-excursion-direct",
    nonTransferableNote:
      "Applies strictly to Coastal Helicopters direct Herbert Glacier Icefield Excursion (FareHarbor item 413056). Never apply to TEMSCO, NorthStar, Coastal Dog Sled, Coastal Private Icefield, or third-party reseller SKUs.",
  },
  "temsco-mendenhall-glacier-pilot-choice-direct": {
    productId: "temsco-mendenhall-glacier-pilot-choice-direct",
    productName: "TEMSCO Helicopters — Mendenhall Glacier & Pilot's Choice (Direct)",
    operatorId: "temsco-helicopters",
    operatorName: "TEMSCO Helicopters",
    portSlug: "juneau",
    clusterId: "alaska-juneau",
    bookingChannel: "direct_operator",
    officialSourceUrls: ["https://temscoair.com/juneau-tours/"],
    dccOptionId: "jun-opt-temsco-pilot-choice-direct",
    cruisePromenadeExcursionId: "temsco-mendenhall-glacier-pilot-choice-direct",
    nonTransferableNote:
      "Applies strictly to TEMSCO direct Juneau helicopter products; never inherit Coastal Helicopters or NorthStar approvals.",
  },
  "northstar-glacier-walkabout-direct": {
    productId: "northstar-glacier-walkabout-direct",
    productName: "NorthStar Trekking — Glacier Walkabout (Direct)",
    operatorId: "northstar-trekking",
    operatorName: "NorthStar Trekking",
    portSlug: "juneau",
    clusterId: "alaska-juneau",
    bookingChannel: "direct_operator",
    officialSourceUrls: ["https://www.glaciertrekking.com/"],
    dccOptionId: "jun-opt-northstar-walkabout-direct",
    cruisePromenadeExcursionId: "northstar-glacier-walkabout-direct",
    nonTransferableNote:
      "Applies strictly to NorthStar Trekking direct Glacier Walkabout; never inherit Coastal Helicopters or TEMSCO approvals.",
  },
  "ward-cove-complimentary-bus": {
    productId: "ward-cove-complimentary-bus",
    productName: "Ward Cove Complimentary Land Shuttle",
    operatorId: "ward-cove-dock-group",
    operatorName: "Ward Cove Dock Group",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "port_shuttle",
    officialSourceUrls: ["https://wardcoveak.com/schedules/"],
    nonTransferableNote:
      "Applies strictly to Ward Cove complimentary land shuttle; do not transfer to paid True Alaskan waterfront shuttles.",
  },
  "true-alaskan-waterfront-ward-cove-to-downtown": {
    productId: "true-alaskan-waterfront-ward-cove-to-downtown",
    productName: "True Alaskan Tours Waterfront Shuttle: Ward Cove to Downtown Ketchikan",
    operatorId: "true-alaskan-tours",
    operatorName: "True Alaskan Tours",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://truealaskantours.com/ketchikan-tours/waterfront-shuttle-ward-cove-to-downtown-ketchikan/",
    ],
    nonTransferableNote:
      "Applies strictly to direct Ward Cove to Downtown direction; do not apply to return direction or free land bus.",
  },
  "true-alaskan-waterfront-downtown-to-ward-cove": {
    productId: "true-alaskan-waterfront-downtown-to-ward-cove",
    productName:
      "True Alaskan Tours Waterfront Shuttle: Downtown Ketchikan Returning to Ward Cove",
    operatorId: "true-alaskan-tours",
    operatorName: "True Alaskan Tours",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://truealaskantours.com/ketchikan-tours/waterfront-shuttle-downtown-ketchikan-returning-to-ward-cove/",
    ],
    nonTransferableNote:
      "Applies strictly to direct Downtown Returning to Ward Cove direction; do not apply to outbound direction.",
  },
  "true-alaskan-misty-fjords-downtown-direct": {
    productId: "true-alaskan-misty-fjords-downtown-direct",
    productName: "True Alaskan Tours — Misty Fjords Wilderness Explorer (Downtown Direct)",
    operatorId: "true-alaskan-tours",
    operatorName: "True Alaskan Tours",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://truealaskantours.com/ketchikan-tours/misty-fjords-wilderness-explorer/",
    ],
    nonTransferableNote:
      "Applies strictly to Downtown departure; do not transfer to Ward Cove departure.",
  },
  "true-alaskan-misty-fjords-ward-cove-direct": {
    productId: "true-alaskan-misty-fjords-ward-cove-direct",
    productName: "True Alaskan Tours — Misty Fjords Wilderness Explorer (Ward Cove Direct)",
    operatorId: "true-alaskan-tours",
    operatorName: "True Alaskan Tours",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://truealaskantours.com/ward-cove-tours/misty-fjords-wilderness-explorer-from-ward-cove/",
    ],
    nonTransferableNote:
      "Applies strictly to Ward Cove departure; do not transfer to Downtown departure.",
  },
  "cape-fox-saxman-highlights-lumberjack-downtown-direct": {
    productId: "cape-fox-saxman-highlights-lumberjack-downtown-direct",
    productName:
      "Cape Fox Tours — Saxman Native Village, Ketchikan Highlights & Lumberjack Show (Downtown Direct)",
    operatorId: "cape-fox-tours",
    operatorName: "Cape Fox Tours",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: ["https://capefoxtours.com/"],
    nonTransferableNote:
      "Applies strictly to Cape Fox direct Downtown departure; do not inherit Viator 445368P5 terms.",
  },
  "cape-fox-saxman-highlights-lumberjack-ward-cove-direct": {
    productId: "cape-fox-saxman-highlights-lumberjack-ward-cove-direct",
    productName:
      "Cape Fox Tours — Saxman Native Village, Ketchikan Highlights & Lumberjack Show (Ward Cove Direct)",
    operatorId: "cape-fox-tours",
    operatorName: "Cape Fox Tours",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: ["https://capefoxtours.com/"],
    nonTransferableNote:
      "Applies strictly to Cape Fox direct Ward Cove departure; do not inherit Viator 445368P5 terms.",
  },
  "taquan-air-misty-fjords-direct": {
    productId: "taquan-air-misty-fjords-direct",
    productName: "Taquan Air — Misty Fjords Flightseeing (Direct)",
    operatorId: "taquan-air",
    operatorName: "Taquan Air",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    fareharborShortname: "taquanair",
    fareharborItemId: "392949",
    officialSourceUrls: [
      "https://taquanair.com/tours/misty-fjords-flightseeing/",
      "https://taquanair.com/faq/",
    ],
    nonTransferableNote:
      "Applies strictly to Taquan Air direct flightseeing; never transfer to Island Wings or Viator 6459PRTKTNMISTY.",
  },
  "island-wings-misty-fjords-direct": {
    productId: "island-wings-misty-fjords-direct",
    productName:
      "Island Wings Air Service — Misty Fjords National Monument Flightseeing (Direct)",
    operatorId: "island-wings",
    operatorName: "Island Wings Air Service",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://www.islandwings.com/mistytours.html",
      "https://www.islandwings.com/faq.html",
    ],
    nonTransferableNote:
      "Applies strictly to Island Wings Air Service; never transfer to Taquan Air.",
  },
  "cajun-encounters-original": {
    productId: "cajun-encounters-original",
    productName: "Cajun Encounters — Original Honey Island Swamp Tour",
    operatorId: "cajun-encounters",
    operatorName: "Cajun Encounters",
    portSlug: "new-orleans",
    clusterId: "new-orleans-swamp",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://www.cajunencounters.com/tours/swamp-tour-new-orleans",
    ],
    nonTransferableNote:
      "Applies strictly to Cajun Encounters Original Swamp Tour; do not transfer to VIP or private variants.",
  },
  "cajun-encounters-vip": {
    productId: "cajun-encounters-vip",
    productName: "Cajun Encounters — VIP Swamp Tour",
    operatorId: "cajun-encounters",
    operatorName: "Cajun Encounters",
    portSlug: "new-orleans",
    clusterId: "new-orleans-swamp",
    bookingChannel: "direct_operator",
    officialSourceUrls: ["https://www.cajunencounters.com/tours/vip-swamp-tour"],
    nonTransferableNote:
      "Applies strictly to Cajun Encounters VIP Swamp Tour; do not transfer to Original Swamp Tour.",
  },
  "airboat-adventures-pontoon": {
    productId: "airboat-adventures-pontoon",
    productName: "Airboat Adventures — Covered Pontoon Swamp Tour",
    operatorId: "airboat-adventures",
    operatorName: "Airboat Adventures",
    portSlug: "new-orleans",
    clusterId: "new-orleans-swamp",
    bookingChannel: "direct_operator",
    officialSourceUrls: ["https://airboatadventures.com/swamp-tours/"],
    nonTransferableNote:
      "Applies strictly to Airboat Adventures Pontoon; do not transfer to airboat variants.",
  },
  "airboat-adventures-public-large-airboat": {
    productId: "airboat-adventures-public-large-airboat",
    productName: "Airboat Adventures — Public Large Airboat",
    operatorId: "airboat-adventures",
    operatorName: "Airboat Adventures",
    portSlug: "new-orleans",
    clusterId: "new-orleans-swamp",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://airboatadventures.com/large-boat-airboat-swamp-tours/",
    ],
    nonTransferableNote:
      "Applies strictly to Public Large Airboat; do not transfer to small or premium airboats.",
  },
  "louisiana-tour-company-large-airboat": {
    productId: "louisiana-tour-company-large-airboat",
    productName: "Louisiana Tour Company — Large Airboat",
    operatorId: "louisiana-tour-company",
    operatorName: "Louisiana Tour Company",
    portSlug: "new-orleans",
    clusterId: "new-orleans-swamp",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://louisianaswamp.com/swamp-tours/airboat-swamp-tour/",
    ],
    nonTransferableNote:
      "Applies strictly to Louisiana Tour Company Large Airboat.",
  },
  "gray-line-large-airboat": {
    productId: "gray-line-large-airboat",
    productName: "Gray Line New Orleans — Large Airboat Swamp Adventure",
    operatorId: "gray-line-new-orleans",
    operatorName: "Gray Line New Orleans",
    portSlug: "new-orleans",
    clusterId: "new-orleans-swamp",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://www.graylineneworleans.com/swamp-tours/large-airboat-swamp-adventure/",
    ],
    nonTransferableNote:
      "Applies strictly to Gray Line New Orleans direct Large Airboat Swamp Adventure.",
  },
};

export const BLOCKED_UMBRELLA_PRODUCT_IDS = new Set<string>([
  "airboat-adventures-public-airboat",
]);

export interface RawResearchDeskFactRow {
  id?: string;
  fact_id?: string;
  cluster?: string;
  product_id?: string;
  constraint_type?: string;
  source_url?: string;
  source_excerpt?: string;
  source_hash?: string;
  checked_at?: string;
  value?: string | number | null;
  unit?: string | null;
  conditions?: string | null;
  status?: string | null;
  verified_on?: string | null;
  verified_by?: string | null;
  reviewer_id?: string | null;
  review_due_on?: string | null;
  revision?: number | string | null;
  approved_revision?: number | string | null;
  active?: number | boolean | null;
  consumers?: string | string[] | null;
  last_review_token?: string | null;
  healthy?: number | boolean | null;
  current_source_hash?: string | null;
  conflicted?: boolean | null;
}

export interface EvaluatedResearchFact {
  fact_id: string;
  cluster: ResearchClusterId;
  port_slug: ResearchPortSlug;
  operator_id: string;
  operator_name: string;
  product_id: string;
  product_name: string;
  booking_channel: "direct_operator" | "port_shuttle" | "blocked_umbrella";
  dcc_option_id: string | null;
  cruisepromenade_excursion_id: string | null;
  constraint_type: ResearchConstraintType;
  value: string;
  unit: string;
  conditions: string;
  source_url: string;
  source_excerpt: string;
  source_hash: string;
  current_source_hash: string | null;
  revision: number;
  verified: boolean;
  eligibility_status: ResearchFactEligibilityStatus;
  disqualification_reason: ResearchFactDisqualificationReason | null;
  verified_on: string | null;
  verified_by: string | null;
  reviewer_id: string | null;
  review_due_on: string | null;
  review_deadline_utc: string | null;
  remaining_ttl_seconds: number;
  healthy: boolean;
  active: boolean;
  consumers: string[];
  non_transferable_to_other_tours: true;
  non_transferable_note: string;
}

export const CONNECTED_COASTAL_CONSUMERS = [
  "dcc:juneau/port-day-engine",
  "dcc:api/internal/cruises/port/juneau",
  "cruisepromenade:ports/juneau",
  "cruisepromenade:api/excursions",
  "juneauflightdeck:Juneau helicopter comparison",
  "lfse:Juneau shore excursions",
] as const;

/**
 * Baseline machine-extracted candidates for Coastal Helicopters Icefield Excursion (Direct).
 * Importantly, these remain unconfirmed (`status: "needs confirmation"`, `verified: false`)
 * until an authenticated human approval record is ingested from the review desk.
 */
export const COASTAL_HELICOPTERS_ICEFIELD_CANDIDATE_BASELINE: RawResearchDeskFactRow[] =
  [
    {
      id: "20a56628f0ce1e5cc2299a68",
      fact_id: "20a56628f0ce1e5cc2299a68",
      cluster: "alaska-juneau",
      product_id: "coastal-helicopters-icefield-excursion-direct",
      constraint_type: "total_duration",
      source_url: "https://coastalhelicopters.com/tours/icefield-excursion/",
      source_excerpt: "Total Duration: 2 hours, 35 minutes (155 minutes)",
      source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      current_source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      checked_at: "2026-04-20T00:13:07.887822+00:00",
      value: "155",
      unit: "minutes",
      conditions:
        "Includes round-trip downtown/cruise port shuttle transportation; approximately 55 minutes from pickup to return plus 40–45 minutes on the Herbert Glacier.",
      status: "needs confirmation",
      verified_on: null,
      verified_by: null,
      reviewer_id: null,
      review_due_on: null,
      revision: 1,
      active: 1,
      healthy: 1,
      consumers: [...CONNECTED_COASTAL_CONSUMERS],
    },
    {
      id: "e2f82ca7fc99123a001da7cb",
      fact_id: "e2f82ca7fc99123a001da7cb",
      cluster: "alaska-juneau",
      product_id: "coastal-helicopters-icefield-excursion-direct",
      constraint_type: "weight_declaration",
      source_url: "https://coastalhelicopters.com/tours/icefield-excursion/",
      source_excerpt:
        "Accurate fully clothed weights are required for all passengers; guests weighing 250 lbs or more pay a $150 weight surcharge.",
      source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      current_source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      checked_at: "2026-04-20T00:13:07.887822+00:00",
      value: "250",
      unit: "lbs_per_passenger_surcharge_threshold",
      conditions:
        "Passengers weighing 250 lbs or more fully clothed must pay a $150 weight surcharge for flight balance and safety.",
      status: "needs confirmation",
      verified_on: null,
      verified_by: null,
      reviewer_id: null,
      review_due_on: null,
      revision: 1,
      active: 1,
      healthy: 1,
      consumers: [...CONNECTED_COASTAL_CONSUMERS],
    },
    {
      id: "626fa413fa044eb02f431823",
      fact_id: "626fa413fa044eb02f431823",
      cluster: "alaska-juneau",
      product_id: "coastal-helicopters-icefield-excursion-direct",
      constraint_type: "bag_policy",
      source_url: "https://coastalhelicopters.com/tours/icefield-excursion/",
      source_excerpt:
        "No carry-on bags (purses, backpacks, camera bags, fanny packs, etc.) are allowed on the helicopter; secure storage is provided at the hangar.",
      source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      current_source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      checked_at: "2026-04-20T00:13:07.887822+00:00",
      value: "No carry-on bags permitted",
      unit: "policy",
      conditions:
        "All bags must be stored at the heliport hangar; phones and handheld cameras are permitted.",
      status: "needs confirmation",
      verified_on: null,
      verified_by: null,
      reviewer_id: null,
      review_due_on: null,
      revision: 1,
      active: 1,
      healthy: 1,
      consumers: [...CONNECTED_COASTAL_CONSUMERS],
    },
    {
      id: "ebbf9abfdff91125ff9fc3fc",
      fact_id: "ebbf9abfdff91125ff9fc3fc",
      cluster: "alaska-juneau",
      product_id: "coastal-helicopters-icefield-excursion-direct",
      constraint_type: "transport_inclusion",
      source_url: "https://coastalhelicopters.com/tours/icefield-excursion/",
      source_excerpt:
        "Round-trip transportation is provided from downtown Juneau and the cruise ship docks.",
      source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      current_source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      checked_at: "2026-04-20T00:13:07.887822+00:00",
      value: "Included",
      unit: "round_trip_shuttle",
      conditions:
        "Complimentary round-trip van transfer from downtown Juneau / cruise ship docks to the airport heliport is included in the direct tour price.",
      status: "needs confirmation",
      verified_on: null,
      verified_by: null,
      reviewer_id: null,
      review_due_on: null,
      revision: 1,
      active: 1,
      healthy: 1,
      consumers: [...CONNECTED_COASTAL_CONSUMERS],
    },
    {
      id: "5d8dc29a0870397848b7cf74",
      fact_id: "5d8dc29a0870397848b7cf74",
      cluster: "alaska-juneau",
      product_id: "coastal-helicopters-icefield-excursion-direct",
      constraint_type: "cancellation_policy",
      source_url: "https://coastalhelicopters.com/tours/icefield-excursion/",
      source_excerpt:
        "Full refund if cancelled at least 24 hours prior to departure or if cancelled by operator due to weather.",
      source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      current_source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      checked_at: "2026-04-20T00:13:07.887822+00:00",
      value: "24",
      unit: "hours_prior_full_refund",
      conditions:
        "100% refund for cancellations made 24+ hours before scheduled check-in or for weather cancellations by Coastal Helicopters.",
      status: "needs confirmation",
      verified_on: null,
      verified_by: null,
      reviewer_id: null,
      review_due_on: null,
      revision: 1,
      active: 1,
      healthy: 1,
      consumers: [...CONNECTED_COASTAL_CONSUMERS],
    },
    {
      id: "cf0a02faabfd4a5460837470",
      fact_id: "cf0a02faabfd4a5460837470",
      cluster: "alaska-juneau",
      product_id: "coastal-helicopters-icefield-excursion-direct",
      constraint_type: "child_seat_and_fare",
      source_url: "https://coastalhelicopters.com/tours/icefield-excursion/",
      source_excerpt:
        "FAA regulations require children 24 months and older to occupy their own seat at the full adult fare.",
      source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      current_source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      checked_at: "2026-04-20T00:13:07.887822+00:00",
      value: "24",
      unit: "months_and_older_full_fare_own_seat",
      conditions:
        "Per FAA regulation, children age 2 years (24 months) and older must occupy an individual seat at full fare.",
      status: "needs confirmation",
      verified_on: null,
      verified_by: null,
      reviewer_id: null,
      review_due_on: null,
      revision: 1,
      active: 1,
      healthy: 1,
      consumers: [...CONNECTED_COASTAL_CONSUMERS],
    },
  ];

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SHA256_HEX_RE = /^[a-f0-9]{64}$/i;

function parseConsumers(raw: string | string[] | null | undefined): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim().length > 0) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      return raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function parseReviewDeadlineUtcMs(reviewDueOn: string | null | undefined): number | null {
  if (!reviewDueOn || typeof reviewDueOn !== "string") return null;
  const trimmed = reviewDueOn.trim();
  if (!ISO_DATE_RE.test(trimmed)) return null;
  const ms = Date.parse(`${trimmed}T00:00:00.000Z`);
  return Number.isFinite(ms) ? ms : null;
}

function parseVerifiedOnUtcMs(verifiedOn: string | null | undefined): number | null {
  if (!verifiedOn || typeof verifiedOn !== "string") return null;
  const trimmed = verifiedOn.trim();
  if (!ISO_DATE_RE.test(trimmed)) return null;
  const ms = Date.parse(`${trimmed}T00:00:00.000Z`);
  return Number.isFinite(ms) ? ms : null;
}

export interface EvaluateFactOptions {
  nowMs?: number;
  sourceFingerprintsByUrl?: Record<
    string,
    { content_hash: string; healthy: boolean }
  >;
}

/**
 * Evaluates a single research-desk fact row against all human-confirmation,
 * product-scope, source-fingerprint, health, conflict, withdrawal, and UTC
 * expiry requirements. Machine candidates (`status !== "Confirmed"`) are never
 * automatically approved.
 */
export function evaluateResearchFactRecord(
  row: RawResearchDeskFactRow,
  options?: EvaluateFactOptions,
): EvaluatedResearchFact {
  const nowMs = options?.nowMs ?? Date.now();
  const factId = String(row.id ?? row.fact_id ?? "").trim();
  const rawProductId = String(row.product_id ?? "").trim();
  const rawCluster = String(row.cluster ?? "").trim();

  const mapping = EXPLICIT_RESEARCH_PRODUCT_REGISTRY[rawProductId];
  const fallbackCluster: ResearchClusterId =
    rawCluster === "alaska-ketchikan" || rawCluster === "new-orleans-swamp"
      ? rawCluster
      : "alaska-juneau";
  const fallbackPort: ResearchPortSlug =
    fallbackCluster === "alaska-ketchikan"
      ? "ketchikan"
      : fallbackCluster === "new-orleans-swamp"
        ? "new-orleans"
        : "juneau";

  const active =
    row.active === undefined || row.active === null
      ? true
      : row.active === 1 || row.active === true;

  const sourceUrl = String(row.source_url ?? "").trim();
  const externalSourceInfo = options?.sourceFingerprintsByUrl?.[sourceUrl];

  const rowHealthy =
    row.healthy === undefined || row.healthy === null
      ? true
      : row.healthy === 1 || row.healthy === true;
  const healthy =
    rowHealthy && (externalSourceInfo ? externalSourceInfo.healthy : true);

  const sourceHash = String(row.source_hash ?? "").trim().toLowerCase();
  const currentSourceHashRaw =
    externalSourceInfo?.content_hash ??
    (row.current_source_hash !== undefined && row.current_source_hash !== null
      ? String(row.current_source_hash).trim().toLowerCase()
      : sourceHash);
  const currentSourceHash = currentSourceHashRaw || null;

  const revision = Number(row.revision ?? 1);
  const approvedRevision =
    row.approved_revision !== undefined && row.approved_revision !== null
      ? Number(row.approved_revision)
      : null;

  const verifiedOn =
    typeof row.verified_on === "string" && row.verified_on.trim().length > 0
      ? row.verified_on.trim()
      : null;
  const verifiedBy =
    typeof row.verified_by === "string" && row.verified_by.trim().length > 0
      ? row.verified_by.trim()
      : null;
  const reviewerId =
    typeof row.reviewer_id === "string" && row.reviewer_id.trim().length > 0
      ? row.reviewer_id.trim()
      : null;
  const reviewDueOn =
    typeof row.review_due_on === "string" && row.review_due_on.trim().length > 0
      ? row.review_due_on.trim()
      : null;

  const deadlineMs = parseReviewDeadlineUtcMs(reviewDueOn);
  const remainingTtlSeconds =
    deadlineMs !== null ? Math.max(0, Math.floor((deadlineMs - nowMs) / 1000)) : 0;

  const valueStr =
    row.value === undefined || row.value === null ? "" : String(row.value).trim();
  const unitStr =
    row.unit === undefined || row.unit === null ? "" : String(row.unit).trim();
  const conditionsStr =
    row.conditions === undefined || row.conditions === null
      ? ""
      : String(row.conditions).trim();
  const statusStr =
    row.status === undefined || row.status === null ? "" : String(row.status).trim();

  const consumers = parseConsumers(row.consumers);

  const buildResult = (
    verified: boolean,
    eligibilityStatus: ResearchFactEligibilityStatus,
    disqualificationReason: ResearchFactDisqualificationReason | null,
  ): EvaluatedResearchFact => ({
    fact_id: factId,
    cluster: mapping?.clusterId ?? fallbackCluster,
    port_slug: mapping?.portSlug ?? fallbackPort,
    operator_id: mapping?.operatorId ?? "unmapped-operator",
    operator_name: mapping?.operatorName ?? "Unmapped Operator",
    product_id: rawProductId,
    product_name: mapping?.productName ?? rawProductId,
    booking_channel: mapping?.bookingChannel ?? "blocked_umbrella",
    dcc_option_id: mapping?.dccOptionId ?? null,
    cruisepromenade_excursion_id: mapping?.cruisePromenadeExcursionId ?? null,
    constraint_type: String(row.constraint_type ?? "").trim(),
    value: valueStr,
    unit: unitStr,
    conditions: conditionsStr,
    source_url: sourceUrl,
    source_excerpt: String(row.source_excerpt ?? "").trim(),
    source_hash: sourceHash,
    current_source_hash: currentSourceHash,
    revision: Number.isFinite(revision) ? revision : 0,
    verified,
    eligibility_status: eligibilityStatus,
    disqualification_reason: disqualificationReason,
    verified_on: verifiedOn,
    verified_by: verifiedBy,
    reviewer_id: reviewerId,
    review_due_on: reviewDueOn,
    review_deadline_utc:
      deadlineMs !== null ? new Date(deadlineMs).toISOString() : null,
    remaining_ttl_seconds: verified ? remainingTtlSeconds : 0,
    healthy,
    active,
    consumers:
      consumers.length > 0
        ? consumers
        : mapping?.productId === "coastal-helicopters-icefield-excursion-direct"
          ? [...CONNECTED_COASTAL_CONSUMERS]
          : [],
    non_transferable_to_other_tours: true,
    non_transferable_note:
      mapping?.nonTransferableNote ??
      "Unmapped product; never transfer research approvals across tours.",
  });

  if (!factId) {
    return buildResult(false, "invalid_record", "missing_fact_id");
  }

  if (BLOCKED_UMBRELLA_PRODUCT_IDS.has(rawProductId)) {
    return buildResult(false, "invalid_record", "blocked_umbrella_product");
  }

  if (!mapping) {
    return buildResult(false, "invalid_record", "unmapped_product_id");
  }

  if (rawCluster && rawCluster !== mapping.clusterId) {
    return buildResult(false, "invalid_record", "cluster_product_mismatch");
  }

  if (!active) {
    return buildResult(false, "withdrawn", "withdrawn_fact");
  }

  const isConflicted =
    row.conflicted === true ||
    statusStr.toLowerCase() === "conflicted" ||
    /\bconflict\b/i.test(statusStr);
  if (isConflicted) {
    return buildResult(false, "conflicted", "conflicted_evidence");
  }

  if (statusStr !== "Confirmed") {
    return buildResult(false, "needs_confirmation", "unconfirmed_candidate");
  }

  if (
    !verifiedBy ||
    /^(auto|machine|bot|system|cron|unverified|candidate)$/i.test(verifiedBy)
  ) {
    return buildResult(false, "needs_confirmation", "missing_human_verifier");
  }

  const verifiedOnMs = parseVerifiedOnUtcMs(verifiedOn);
  if (verifiedOnMs === null || verifiedOnMs > nowMs + 24 * 60 * 60 * 1000) {
    return buildResult(false, "invalid_record", "invalid_verified_on");
  }

  if (deadlineMs === null) {
    return buildResult(false, "invalid_record", "invalid_review_due_on");
  }

  if (nowMs >= deadlineMs) {
    return buildResult(false, "expired", "review_deadline_expired");
  }

  if (!valueStr) {
    return buildResult(false, "invalid_record", "empty_fact_value");
  }

  if (!healthy) {
    return buildResult(false, "source_unhealthy", "source_unhealthy");
  }

  if (
    !SHA256_HEX_RE.test(sourceHash) ||
    !currentSourceHash ||
    !SHA256_HEX_RE.test(currentSourceHash) ||
    sourceHash !== currentSourceHash
  ) {
    return buildResult(false, "source_changed", "source_hash_drift");
  }

  if (
    !Number.isInteger(revision) ||
    revision < 2 ||
    (approvedRevision !== null && approvedRevision !== revision)
  ) {
    return buildResult(false, "needs_confirmation", "unconfirmed_revision");
  }

  return buildResult(true, "verified", null);
}

export interface ApprovedFactFeedEvaluation {
  evaluated_at: string;
  total_evaluated: number;
  verified_count: number;
  verified_facts: EvaluatedResearchFact[];
  all_evaluated_facts: EvaluatedResearchFact[];
  recommended_max_age_seconds: number;
  cache_control_header: string;
}

export const DEFAULT_FEED_MAX_AGE_SECONDS = 300;

export function computeApprovedFactCacheControl(
  evaluatedFacts: EvaluatedResearchFact[],
  options?: { defaultMaxAgeSeconds?: number },
): { maxAgeSeconds: number; cacheControlHeader: string } {
  const defaultMaxAge =
    options?.defaultMaxAgeSeconds ?? DEFAULT_FEED_MAX_AGE_SECONDS;
  const verifiedFacts = evaluatedFacts.filter((f) => f.verified);
  const hasInvalidatedFact = evaluatedFacts.some(
    (f) =>
      f.eligibility_status === "expired" ||
      f.eligibility_status === "withdrawn" ||
      f.eligibility_status === "source_changed" ||
      f.eligibility_status === "source_unhealthy" ||
      f.eligibility_status === "conflicted",
  );

  if (verifiedFacts.length === 0) {
    if (hasInvalidatedFact) {
      return {
        maxAgeSeconds: 0,
        cacheControlHeader: "private, no-store, max-age=0, must-revalidate",
      };
    }
    return {
      maxAgeSeconds: 60,
      cacheControlHeader: "private, max-age=60, s-maxage=60, must-revalidate",
    };
  }

  const minRemainingTtl = verifiedFacts.reduce(
    (min, fact) => Math.min(min, fact.remaining_ttl_seconds),
    defaultMaxAge,
  );
  const cappedMaxAge = Math.max(0, Math.min(defaultMaxAge, minRemainingTtl));

  if (cappedMaxAge <= 0) {
    return {
      maxAgeSeconds: 0,
      cacheControlHeader: "private, no-store, max-age=0, must-revalidate",
    };
  }

  return {
    maxAgeSeconds: cappedMaxAge,
    cacheControlHeader: `private, max-age=${cappedMaxAge}, s-maxage=${cappedMaxAge}, must-revalidate`,
  };
}

export function evaluateApprovedFactFeed(
  rows: RawResearchDeskFactRow[],
  options?: EvaluateFactOptions & { defaultMaxAgeSeconds?: number },
): ApprovedFactFeedEvaluation {
  const nowMs = options?.nowMs ?? Date.now();
  const allEvaluated = rows.map((row) =>
    evaluateResearchFactRecord(row, {
      nowMs,
      sourceFingerprintsByUrl: options?.sourceFingerprintsByUrl,
    }),
  );
  const verifiedFacts = allEvaluated.filter((fact) => fact.verified);
  const { maxAgeSeconds, cacheControlHeader } = computeApprovedFactCacheControl(
    allEvaluated,
    { defaultMaxAgeSeconds: options?.defaultMaxAgeSeconds },
  );

  return {
    evaluated_at: new Date(nowMs).toISOString(),
    total_evaluated: allEvaluated.length,
    verified_count: verifiedFacts.length,
    verified_facts: verifiedFacts,
    all_evaluated_facts: allEvaluated,
    recommended_max_age_seconds: maxAgeSeconds,
    cache_control_header: cacheControlHeader,
  };
}

/**
 * Strict lookup ensuring one tour's approved facts NEVER apply to another tour.
 */
export function getVerifiedFactsForExactProduct(
  evaluatedFacts: EvaluatedResearchFact[],
  productId: string,
): EvaluatedResearchFact[] {
  const cleanId = productId.trim();
  if (!cleanId || !EXPLICIT_RESEARCH_PRODUCT_REGISTRY[cleanId]) {
    return [];
  }
  return evaluatedFacts.filter(
    (fact) => fact.verified && fact.product_id === cleanId,
  );
}

// Server-side synced rows pushed by authorized review-desk sync or test harnesses
let syncedReviewDeskRows: RawResearchDeskFactRow[] | null = null;
let syncedSourceFingerprints: Record<
  string,
  { content_hash: string; healthy: boolean }
> = {};
let lastSyncedAtIso: string | null = null;

export function setSyncedReviewDeskPayload(params: {
  rows: RawResearchDeskFactRow[];
  sourceFingerprintsByUrl?: Record<
    string,
    { content_hash: string; healthy: boolean }
  >;
  syncedAtIso?: string;
}) {
  syncedReviewDeskRows = [...params.rows];
  syncedSourceFingerprints = { ...(params.sourceFingerprintsByUrl ?? {}) };
  lastSyncedAtIso = params.syncedAtIso ?? new Date().toISOString();
}

export function clearSyncedReviewDeskPayloadForTesting() {
  syncedReviewDeskRows = null;
  syncedSourceFingerprints = {};
  lastSyncedAtIso = null;
}

export interface ReviewDeskPortalIngestionResult extends ApprovedFactFeedEvaluation {
  review_desk_url: string;
  live_portal_readback_status:
    | "authenticated_live"
    | "synced_server_snapshot"
    | "blocked_http_401_missing_portal_session"
    | "blocked_missing_portal_credentials"
    | "blocked_upstream_error";
  live_portal_verified: boolean;
  access_blocker: string | null;
  last_synced_at: string | null;
}

function buildReviewDeskAuthHeaders(): {
  headers: Record<string, string>;
  hasAuthCredentials: boolean;
} {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  let hasAuthCredentials = false;

  const bearer =
    process.env.DCC_PORTAL_BEARER_TOKEN?.trim() ||
    process.env.DCC_PORTAL_TOKEN?.trim();
  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
    hasAuthCredentials = true;
  }

  const cookie = process.env.DCC_PORTAL_COOKIE?.trim();
  if (cookie) {
    headers.Cookie = cookie;
    hasAuthCredentials = true;
  }

  const extraHeadersJson = process.env.DCC_PORTAL_HEADERS_JSON?.trim();
  if (extraHeadersJson) {
    try {
      const parsed = JSON.parse(extraHeadersJson);
      if (parsed && typeof parsed === "object") {
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === "string" && v.trim()) {
            headers[k] = v.trim();
            hasAuthCredentials = true;
          }
        }
      }
    } catch {
      // Ignore malformed JSON env var
    }
  }

  return { headers, hasAuthCredentials };
}

export async function ingestApprovedFactsFromReviewDesk(options?: {
  portSlug?: string;
  clusterId?: string;
  productId?: string;
  nowMs?: number;
  skipLiveFetch?: boolean;
}): Promise<ReviewDeskPortalIngestionResult> {
  const nowMs = options?.nowMs ?? Date.now();
  const reviewDeskUrl = (
    process.env.DCC_RESEARCH_REVIEW_URL?.trim() ||
    "https://dcc-research-review.erichroeseler123.chatgpt.site"
  ).replace(/\/+$/, "");

  const filterRows = (rows: RawResearchDeskFactRow[]) =>
    rows.filter((row) => {
      const pid = String(row.product_id ?? "").trim();
      const mapping = EXPLICIT_RESEARCH_PRODUCT_REGISTRY[pid];
      if (options?.productId && pid !== options.productId) {
        return false;
      }
      if (options?.clusterId) {
        const cluster = mapping?.clusterId ?? String(row.cluster ?? "").trim();
        if (cluster !== options.clusterId) return false;
      }
      if (options?.portSlug) {
        const port = mapping?.portSlug;
        if (port !== options.portSlug) return false;
      }
      return true;
    });

  // 1. Check in-memory or environment synced snapshot first if present
  if (syncedReviewDeskRows !== null) {
    const filtered = filterRows(syncedReviewDeskRows);
    const evaluation = evaluateApprovedFactFeed(filtered, {
      nowMs,
      sourceFingerprintsByUrl: syncedSourceFingerprints,
    });
    return {
      ...evaluation,
      review_desk_url: reviewDeskUrl,
      live_portal_readback_status: "synced_server_snapshot",
      live_portal_verified: true,
      access_blocker: null,
      last_synced_at: lastSyncedAtIso,
    };
  }

  const envSnapshotJson = process.env.DCC_APPROVED_FACTS_SNAPSHOT_JSON?.trim();
  if (envSnapshotJson) {
    try {
      const parsed = JSON.parse(envSnapshotJson);
      const rows: RawResearchDeskFactRow[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.verified_facts)
          ? parsed.verified_facts
          : [];
      const filtered = filterRows(rows);
      const evaluation = evaluateApprovedFactFeed(filtered, { nowMs });
      return {
        ...evaluation,
        review_desk_url: reviewDeskUrl,
        live_portal_readback_status: "synced_server_snapshot",
        live_portal_verified: true,
        access_blocker: null,
        last_synced_at: parsed?.synced_at ?? null,
      };
    } catch {
      // Fall through to live portal fetch
    }
  }

  // 2. Attempt authenticated server-side fetch from private review desk
  const { headers, hasAuthCredentials } = buildReviewDeskAuthHeaders();
  let liveStatus: ReviewDeskPortalIngestionResult["live_portal_readback_status"] =
    hasAuthCredentials
      ? "blocked_upstream_error"
      : "blocked_missing_portal_credentials";
  let accessBlocker: string | null = hasAuthCredentials
    ? null
    : `Private review desk ${reviewDeskUrl}/api/verified-facts requires ChatGPT OAuth session credentials (DCC_PORTAL_COOKIE or DCC_PORTAL_BEARER_TOKEN), which are not configured in the server environment.`;

  if (!options?.skipLiveFetch) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const response = await fetch(`${reviewDeskUrl}/api/verified-facts`, {
        method: "GET",
        headers,
        cache: "no-store",
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (response.status === 200) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = (await response.json()) as {
            verified_facts?: RawResearchDeskFactRow[];
          };
          const liveRows = Array.isArray(data?.verified_facts)
            ? data.verified_facts
            : [];
          const mergedByFactId = new Map<string, RawResearchDeskFactRow>();
          for (const candidate of COASTAL_HELICOPTERS_ICEFIELD_CANDIDATE_BASELINE) {
            const id = String(candidate.fact_id ?? candidate.id ?? "");
            if (id) mergedByFactId.set(id, candidate);
          }
          for (const row of liveRows) {
            const id = String(row.fact_id ?? row.id ?? "");
            if (id) mergedByFactId.set(id, row);
          }
          const filtered = filterRows(Array.from(mergedByFactId.values()));
          const evaluation = evaluateApprovedFactFeed(filtered, { nowMs });
          return {
            ...evaluation,
            review_desk_url: reviewDeskUrl,
            live_portal_readback_status: "authenticated_live",
            live_portal_verified: true,
            access_blocker: null,
            last_synced_at: new Date(nowMs).toISOString(),
          };
        }
      } else if (response.status === 401 || response.status === 403) {
        liveStatus = "blocked_http_401_missing_portal_session";
        accessBlocker = `Private review desk ${reviewDeskUrl}/api/verified-facts returned HTTP ${response.status} (Sign in required via ChatGPT OAuth gate). Configure DCC_PORTAL_COOKIE or DCC_PORTAL_BEARER_TOKEN, or push an authenticated readback payload to /api/internal/research/approved-facts.`;
      } else {
        liveStatus = "blocked_upstream_error";
        accessBlocker = `Private review desk ${reviewDeskUrl}/api/verified-facts returned HTTP ${response.status}.`;
      }
    } catch (err) {
      if (hasAuthCredentials) {
        liveStatus = "blocked_upstream_error";
        accessBlocker = `Failed to reach private review desk ${reviewDeskUrl}/api/verified-facts: ${
          err instanceof Error ? err.message : String(err)
        }`;
      }
    }
  }

  // 3. Evaluate baseline candidates (all remain unconfirmed; no candidate is ever auto-approved)
  const fallbackRows = filterRows(COASTAL_HELICOPTERS_ICEFIELD_CANDIDATE_BASELINE);
  const evaluation = evaluateApprovedFactFeed(fallbackRows, { nowMs });

  return {
    ...evaluation,
    review_desk_url: reviewDeskUrl,
    live_portal_readback_status: liveStatus,
    live_portal_verified: false,
    access_blocker: accessBlocker,
    last_synced_at: lastSyncedAtIso,
  };
}
