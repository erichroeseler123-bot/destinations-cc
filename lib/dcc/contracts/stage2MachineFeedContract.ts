/**
 * Stage 2 Machine-Readable Contract and Runtime Validator (Corrected Reality-First Spec)
 * 
 * Defines and validates the lightweight /agent.json directory and
 * read-only feeds (products, locations, pricing, policies, operating windows).
 * 
 * Invariants:
 * 1. Contains only verified facts; unsupported claims MUST be declared as "requires_operator_confirmation".
 * 2. Distinguishes meeting points from destination attractions.
 * 3. Mandates time zones on operating schedules.
 * 4. Enforces strict provenance (source, verified_by, valid date ordering last_verified <= review_by).
 * 5. Rejects insecure URLs, script injection, negative prices, and site ID mismatches.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface DccProvenance {
  source: string;
  source_type: "operator_contract" | "live_api_tariff" | "published_commercial_rate" | "storefront_catalog";
  last_verified: string; // ISO-8601 UTC
  review_by: string;    // ISO-8601 UTC
  verified_by: string;
}

export interface DccAgentDirectoryV2 {
  $schema: string;
  spec: "dcc-agent-directory";
  version: "2.0";
  dcc_id: `dcc:site:${string}`;
  name: string;
  canonical_url: string;
  service_area: {
    dcc_destination_id: `dcc:destination:${string}`;
    name: string;
    region: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  contact: {
    phone: string;
    phone_display: string;
    help_url: string;
  };
  authority_scope: string[];
  booking_boundary: {
    execution_model: "secure_handoff" | "direct_checkout" | "inquiry_only";
    primary_engine: "FareHarbor" | "Stripe" | "DirectOperator" | "None";
    payment_collected_on_site: boolean;
    operator_terms_url: string;
  };
  directory: {
    products: string;
    locations: string;
    pricing: string;
    policies: string;
    operating_windows: string;
    truth_record: string;
  };
  capabilities: {
    catalog_navigation: string;
    booking_handoff_mode: "client_navigation";
  };
  metadata: {
    last_generated: string;
    ttl_seconds: number;
    maintainer: string;
  };
}

export interface DccProductItem {
  sku: string;
  dcc_product_id: `dcc:product:${string}`;
  title: string;
  category: string;
  short_summary: string;
  operator: {
    dcc_operator_id: `dcc:operator:${string}`;
    name: string;
    company_shortname: string;
  };
  locations: {
    meeting_hub?: `dcc:poi:${string}`;
    attraction_hub?: `dcc:poi:${string}`;
    possible_destinations?: Array<`dcc:poi:${string}`>;
    destination_selection?: "single" | "determined_during_booking";
    pickup_mode: "included" | "optional_add_on" | "self_arrive_only" | "requires_operator_confirmation";
  };
  canonical_page_url: string;
}

export interface DccLocationItem {
  dcc_poi_id: `dcc:poi:${string}`;
  name: string;
  destination_id: `dcc:destination:${string}`;
  kind: "meeting_hub" | "dock_pier" | "swamp_slip" | "plantation" | "hotel_zone" | "airport";
  coordinates: {
    latitude: number;
    longitude: number;
  };
  physical_address?: {
    street: string;
    city: string;
    region: string;
    postal_code: string;
    country: string;
  };
  meeting_instructions: string;
  wikidata_id?: string;
}

export interface DccPriceItem {
  sku: string;
  dcc_product_id: `dcc:product:${string}`;
  currency: "USD";
  verification_status: "verified" | "requires_operator_confirmation";
  pricing_structure: "per_person" | "per_vehicle" | "per_group";
  price_scope?: "sightseeing_only" | "self_arrive" | "with_transportation" | "minibus_with_admission" | "general_admission" | "requires_operator_confirmation";
  fee_completeness?: "all_mandatory_fees_included" | "taxes_and_fees_confirmed_at_checkout" | "requires_operator_confirmation";
  base_rate?: number; // Only present when verification_status === "verified"
  rate_with_transportation?: number;
  mandatory_fees: Array<{
    description: string;
    amount: number;
  }>;
  confirmation_note?: string;
  provenance: DccProvenance;
}

export interface DccPolicyItem {
  sku: string;
  dcc_product_id: `dcc:product:${string}`;
  verification_status: "verified" | "requires_operator_confirmation";
  cancellation: {
    full_refund_notice_hours?: number;
    cancellation_method: "phone_or_email" | "self_service_link" | "requires_operator_confirmation";
    note?: string;
  };
  weather_guarantee: {
    is_guaranteed: boolean;
    policy_summary: string;
    compensation_type: "full_refund_or_reschedule" | "reschedule_only" | "none" | "requires_operator_confirmation";
  };
  restrictions: {
    minimum_age?: number;
    pregnancy_allowed?: boolean;
    wheelchair_accessible: "full" | "foldable_only" | "not_accessible" | "requires_operator_confirmation";
  };
  provenance: DccProvenance;
}

export interface DccScheduleItem {
  sku: string;
  dcc_product_id: `dcc:product:${string}`;
  time_zone: string; // e.g. "America/Chicago"
  verification_status: "verified" | "requires_operator_confirmation";
  season?: {
    start_date: string; // YYYY-MM-DD
    end_date: string;   // YYYY-MM-DD
    season_type: "year_round" | "summer_cruise_only" | "winter_ski_only";
  };
  daily_departures: Array<{
    departure_time_local: string; // HH:MM (24h)
    duration_minutes: number;
    description?: string;
  }>;
  known_blackout_dates: string[];
  schedule_note?: string;
  provenance: DccProvenance;
}

// ---------------------------------------------------------------------------
// Helpers & Invariant Validators
// ---------------------------------------------------------------------------

export function isValidIsoDate(str: string): boolean {
  if (typeof str !== "string") return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

export function isValidHttpUrl(str: string, allowRelative = false): boolean {
  if (typeof str !== "string" || !str.trim()) return false;
  if (allowRelative && str.startsWith("/")) return true;
  try {
    const parsed = new URL(str);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidDccId(str: string, expectedPrefix: string): boolean {
  if (typeof str !== "string") return false;
  const regex = new RegExp(`^${expectedPrefix}:[a-z0-9-]+(:[a-z0-9-]+)*$`);
  return regex.test(str);
}

export function validateProvenance(prov: unknown, fieldPrefix = "provenance"): string[] {
  const errors: string[] = [];
  if (!prov || typeof prov !== "object") {
    return [`${fieldPrefix} must be a valid object`];
  }
  const p = prov as Partial<DccProvenance>;

  if (!p.source || typeof p.source !== "string" || !p.source.trim()) {
    errors.push(`${fieldPrefix}.source is required and cannot be empty`);
  }
  if (!["operator_contract", "live_api_tariff", "published_commercial_rate", "storefront_catalog"].includes(p.source_type as string)) {
    errors.push(`${fieldPrefix}.source_type must be one of operator_contract, live_api_tariff, published_commercial_rate, storefront_catalog`);
  }
  if (!p.verified_by || typeof p.verified_by !== "string" || !p.verified_by.trim()) {
    errors.push(`${fieldPrefix}.verified_by is required`);
  }

  if (!p.last_verified || !isValidIsoDate(p.last_verified)) {
    errors.push(`${fieldPrefix}.last_verified must be a valid ISO-8601 date string`);
  }
  if (!p.review_by || !isValidIsoDate(p.review_by)) {
    errors.push(`${fieldPrefix}.review_by must be a valid ISO-8601 date string`);
  }

  if (p.last_verified && p.review_by && isValidIsoDate(p.last_verified) && isValidIsoDate(p.review_by)) {
    const last = new Date(p.last_verified).getTime();
    const review = new Date(p.review_by).getTime();
    const now = Date.now() + 86400000; // allow 24h clock skew

    if (last > review) {
      errors.push(`${fieldPrefix}: last_verified (${p.last_verified}) cannot be after review_by (${p.review_by})`);
    }
    if (last > now) {
      errors.push(`${fieldPrefix}: last_verified (${p.last_verified}) cannot be in the future`);
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Schema Validators
// ---------------------------------------------------------------------------

export function validateAgentDirectory(data: unknown, expectedSiteId = "dcc:site:wno-tours"): ValidationResult {
  const errors: string[] = [];
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Data must be a non-null object"] };
  }
  const d = data as Partial<DccAgentDirectoryV2>;

  if (d.spec !== "dcc-agent-directory") errors.push("spec must be 'dcc-agent-directory'");
  if (d.version !== "2.0") errors.push("version must be '2.0'");
  if (!d.dcc_id || d.dcc_id !== expectedSiteId) {
    errors.push(`dcc_id must match expected canonical site ID '${expectedSiteId}'`);
  }
  if (!d.name || typeof d.name !== "string") errors.push("name is required");
  if (!d.canonical_url || !isValidHttpUrl(d.canonical_url)) errors.push("canonical_url must be an https:// URL");

  // Service Area
  if (!d.service_area || typeof d.service_area !== "object") {
    errors.push("service_area object is required");
  } else {
    if (!isValidDccId(d.service_area.dcc_destination_id, "dcc:destination")) {
      errors.push("service_area.dcc_destination_id must match 'dcc:destination:*'");
    }
    const coords = d.service_area.coordinates;
    if (!coords || typeof coords.latitude !== "number" || coords.latitude < -90 || coords.latitude > 90) {
      errors.push("service_area.coordinates.latitude must be between -90 and 90");
    }
    if (!coords || typeof coords.longitude !== "number" || coords.longitude < -180 || coords.longitude > 180) {
      errors.push("service_area.coordinates.longitude must be between -180 and 180");
    }
  }

  // Booking Boundary
  if (!d.booking_boundary || typeof d.booking_boundary !== "object") {
    errors.push("booking_boundary object is required");
  } else {
    if (!["secure_handoff", "direct_checkout", "inquiry_only"].includes(d.booking_boundary.execution_model)) {
      errors.push("booking_boundary.execution_model must be secure_handoff, direct_checkout, or inquiry_only");
    }
    if (!isValidHttpUrl(d.booking_boundary.operator_terms_url, true)) {
      errors.push("booking_boundary.operator_terms_url must be a valid https:// URL or relative path");
    }
  }

  // Directory Feeds
  if (!d.directory || typeof d.directory !== "object") {
    errors.push("directory object is required");
  } else {
    for (const key of ["products", "locations", "pricing", "policies", "operating_windows", "truth_record"] as const) {
      if (!d.directory[key] || !isValidHttpUrl(d.directory[key], true)) {
        errors.push(`directory.${key} must be a valid https:// URL or relative path`);
      }
    }
  }

  // Capabilities
  if (!d.capabilities || typeof d.capabilities !== "object") {
    errors.push("capabilities object is required");
  } else {
    if (d.capabilities.booking_handoff_mode !== "client_navigation") {
      errors.push("capabilities.booking_handoff_mode must be 'client_navigation'");
    }
    if (!isValidHttpUrl(d.capabilities.catalog_navigation, true)) {
      errors.push("capabilities.catalog_navigation must be a valid https:// URL or relative path");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validatePricingFeed(items: unknown[], expectedSiteId = "dcc:site:wno-tours"): ValidationResult {
  const errors: string[] = [];
  if (!Array.isArray(items)) {
    return { valid: false, errors: ["Pricing feed must be an array of pricing items"] };
  }

  items.forEach((item, idx) => {
    const p = item as Partial<DccPriceItem>;
    const prefix = `PriceItem[${idx}] (${p.sku || "unknown"})`;

    if (!p.sku || typeof p.sku !== "string") errors.push(`${prefix}: sku is required`);
    if (!p.dcc_product_id || !isValidDccId(p.dcc_product_id, "dcc:product")) {
      errors.push(`${prefix}: dcc_product_id must match 'dcc:product:*'`);
    }
    if (p.currency !== "USD") errors.push(`${prefix}: currency must be 'USD'`);

    if (p.verification_status === "verified") {
      if (typeof p.base_rate !== "number" || isNaN(p.base_rate) || p.base_rate <= 0) {
        errors.push(`${prefix}: verified item must have a positive base_rate number`);
      }
      if (p.rate_with_transportation !== undefined) {
        if (typeof p.rate_with_transportation !== "number" || p.rate_with_transportation < (p.base_rate || 0)) {
          errors.push(`${prefix}: rate_with_transportation must be >= base_rate`);
        }
      }
    } else if (p.verification_status === "requires_operator_confirmation") {
      if (!p.confirmation_note) {
        errors.push(`${prefix}: requires_operator_confirmation items must include a confirmation_note`);
      }
    } else {
      errors.push(`${prefix}: verification_status must be 'verified' or 'requires_operator_confirmation'`);
    }

    const provErrors = validateProvenance(p.provenance, `${prefix}.provenance`);
    errors.push(...provErrors);
  });

  return { valid: errors.length === 0, errors };
}

export function validatePolicyFeed(items: unknown[]): ValidationResult {
  const errors: string[] = [];
  if (!Array.isArray(items)) {
    return { valid: false, errors: ["Policy feed must be an array of policy items"] };
  }

  items.forEach((item, idx) => {
    const pol = item as Partial<DccPolicyItem>;
    const prefix = `PolicyItem[${idx}] (${pol.sku || "unknown"})`;

    if (!pol.sku) errors.push(`${prefix}: sku is required`);
    if (!pol.dcc_product_id || !isValidDccId(pol.dcc_product_id, "dcc:product")) {
      errors.push(`${prefix}: dcc_product_id must match 'dcc:product:*'`);
    }

    if (pol.verification_status === "verified") {
      if (typeof pol.cancellation?.full_refund_notice_hours !== "number" || pol.cancellation.full_refund_notice_hours < 0) {
        errors.push(`${prefix}: verified cancellation.full_refund_notice_hours must be a non-negative number`);
      }
      if (!pol.weather_guarantee?.policy_summary) {
        errors.push(`${prefix}: verified weather_guarantee.policy_summary is required`);
      }
    } else if (pol.verification_status === "requires_operator_confirmation") {
      // Must not make unsupported affirmative guarantee claims
      if (pol.weather_guarantee?.is_guaranteed && pol.weather_guarantee.compensation_type !== "requires_operator_confirmation") {
        errors.push(`${prefix}: unverified policy must not claim affirmative weather guarantee without operator verification`);
      }
    } else {
      errors.push(`${prefix}: verification_status must be 'verified' or 'requires_operator_confirmation'`);
    }

    const provErrors = validateProvenance(pol.provenance, `${prefix}.provenance`);
    errors.push(...provErrors);
  });

  return { valid: errors.length === 0, errors };
}

export function validateProductFeed(items: unknown[]): ValidationResult {
  const errors: string[] = [];
  if (!Array.isArray(items)) {
    return { valid: false, errors: ["Product feed must be an array of product items"] };
  }

  items.forEach((item, idx) => {
    const prod = item as Partial<DccProductItem>;
    const prefix = `ProductItem[${idx}] (${prod.sku || "unknown"})`;

    if (!prod.sku) errors.push(`${prefix}: sku is required`);
    if (!prod.dcc_product_id || !isValidDccId(prod.dcc_product_id, "dcc:product")) {
      errors.push(`${prefix}: dcc_product_id must match 'dcc:product:*'`);
    }
    if (!prod.title) errors.push(`${prefix}: title is required`);
    if (!prod.operator || !isValidDccId(prod.operator.dcc_operator_id, "dcc:operator")) {
      errors.push(`${prefix}: operator.dcc_operator_id must match 'dcc:operator:*'`);
    }
    if (prod.locations?.meeting_hub && !isValidDccId(prod.locations.meeting_hub, "dcc:poi")) {
      errors.push(`${prefix}: locations.meeting_hub must match 'dcc:poi:*'`);
    }
    if (prod.locations?.attraction_hub && !isValidDccId(prod.locations.attraction_hub, "dcc:poi")) {
      errors.push(`${prefix}: locations.attraction_hub must match 'dcc:poi:*'`);
    }
    if (prod.locations?.possible_destinations) {
      if (!Array.isArray(prod.locations.possible_destinations)) {
        errors.push(`${prefix}: locations.possible_destinations must be an array`);
      } else {
        for (const dest of prod.locations.possible_destinations) {
          if (!isValidDccId(dest, "dcc:poi")) {
            errors.push(`${prefix}: locations.possible_destinations contains invalid ID '${dest}'`);
          }
        }
      }
    }
    if (!prod.canonical_page_url || !isValidHttpUrl(prod.canonical_page_url, true)) {
      errors.push(`${prefix}: canonical_page_url must be an https:// URL or relative path`);
    }
  });

  return { valid: errors.length === 0, errors };
}

export function validateOperatingWindowsFeed(items: unknown[]): ValidationResult {
  const errors: string[] = [];
  if (!Array.isArray(items)) {
    return { valid: false, errors: ["Operating windows feed must be an array of schedule items"] };
  }

  items.forEach((item, idx) => {
    const sched = item as Partial<DccScheduleItem>;
    const prefix = `ScheduleItem[${idx}] (${sched.sku || "unknown"})`;

    if (!sched.sku) errors.push(`${prefix}: sku is required`);
    if (!sched.dcc_product_id || !isValidDccId(sched.dcc_product_id, "dcc:product")) {
      errors.push(`${prefix}: dcc_product_id must match 'dcc:product:*'`);
    }
    if (!sched.time_zone || typeof sched.time_zone !== "string") {
      errors.push(`${prefix}: time_zone is required (e.g. 'America/Chicago')`);
    }

    if (sched.verification_status === "verified") {
      if (!sched.season || !sched.season.start_date || !sched.season.end_date) {
        errors.push(`${prefix}: verified item must specify season start_date and end_date`);
      }
      if (!Array.isArray(sched.daily_departures) || sched.daily_departures.length === 0) {
        errors.push(`${prefix}: verified item must list at least one departure time`);
      } else {
        for (const dep of sched.daily_departures) {
          if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(dep.departure_time_local)) {
            errors.push(`${prefix}: departure_time_local must be in 24h HH:MM format`);
          }
          if (typeof dep.duration_minutes !== "number" || dep.duration_minutes <= 0) {
            errors.push(`${prefix}: duration_minutes must be a positive number`);
          }
        }
      }
    } else if (sched.verification_status === "requires_operator_confirmation") {
      if (!sched.schedule_note) {
        errors.push(`${prefix}: requires_operator_confirmation items must provide a schedule_note`);
      }
    } else {
      errors.push(`${prefix}: verification_status must be 'verified' or 'requires_operator_confirmation'`);
    }

    if (sched.season?.start_date && sched.season?.end_date && Array.isArray(sched.known_blackout_dates)) {
      for (const bDate of sched.known_blackout_dates) {
        if (bDate < sched.season.start_date || bDate > sched.season.end_date) {
          errors.push(
            `${prefix}: blackout date (${bDate}) falls outside declared season range (${sched.season.start_date} to ${sched.season.end_date})`
          );
        }
      }
    }

    const provErrors = validateProvenance(sched.provenance, `${prefix}.provenance`);
    errors.push(...provErrors);
  });

  return { valid: errors.length === 0, errors };
}

export function validateLocationFeed(items: unknown[]): ValidationResult {
  const errors: string[] = [];
  if (!Array.isArray(items)) {
    return { valid: false, errors: ["Location feed must be an array of location items"] };
  }

  items.forEach((item, idx) => {
    const loc = item as Partial<DccLocationItem>;
    const prefix = `LocationItem[${idx}] (${loc.dcc_poi_id || "unknown"})`;

    if (!loc.dcc_poi_id || !isValidDccId(loc.dcc_poi_id, "dcc:poi")) {
      errors.push(`${prefix}: dcc_poi_id must match 'dcc:poi:*'`);
    }
    if (!loc.name) errors.push(`${prefix}: name is required`);
    if (!loc.destination_id || !isValidDccId(loc.destination_id, "dcc:destination")) {
      errors.push(`${prefix}: destination_id must match 'dcc:destination:*'`);
    }
    if (!loc.coordinates || typeof loc.coordinates.latitude !== "number" || loc.coordinates.latitude < -90 || loc.coordinates.latitude > 90) {
      errors.push(`${prefix}: latitude must be between -90 and 90`);
    }
    if (!loc.coordinates || typeof loc.coordinates.longitude !== "number" || loc.coordinates.longitude < -180 || loc.coordinates.longitude > 180) {
      errors.push(`${prefix}: longitude must be between -180 and 180`);
    }
    if (loc.wikidata_id && !/^Q[0-9]+$/.test(loc.wikidata_id)) {
      errors.push(`${prefix}: wikidata_id must be formatted like 'Q12345'`);
    }
  });

  return { valid: errors.length === 0, errors };
}
