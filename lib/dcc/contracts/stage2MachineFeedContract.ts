/**
 * Stage 2 Machine-Readable Contract and Runtime Validator
 * 
 * Defines and validates the lightweight /agent.json directory and
 * read-only feeds (products, locations, pricing, policies, operating windows)
 * with strict provenance, date-ordering, and security invariants.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface DccProvenance {
  source: string;
  source_type: "operator_contract" | "live_api_tariff" | "published_commercial_rate";
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
  actions: {
    quote?: string;
    availability?: string;
    booking_handoff?: string;
    share?: string;
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
    primary_hub: `dcc:poi:${string}`;
    pickup_available: boolean;
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
  pricing_structure: "per_person" | "per_vehicle" | "per_group";
  base_rate: number;
  rate_with_transportation?: number;
  mandatory_fees: Array<{
    description: string;
    amount: number;
  }>;
  provenance: DccProvenance;
}

export interface DccPolicyItem {
  sku: string;
  dcc_product_id: `dcc:product:${string}`;
  cancellation: {
    full_refund_notice_hours: number;
    cancellation_method: "phone_or_email" | "self_service_link";
  };
  weather_guarantee: {
    is_guaranteed: boolean;
    policy_summary: string;
    compensation_type: "full_refund_or_reschedule" | "reschedule_only" | "none";
  };
  restrictions: {
    minimum_age?: number;
    pregnancy_allowed: boolean;
    wheelchair_accessible: "full" | "foldable_only" | "not_accessible";
  };
  provenance: DccProvenance;
}

export interface DccScheduleItem {
  sku: string;
  dcc_product_id: `dcc:product:${string}`;
  season: {
    start_date: string; // YYYY-MM-DD
    end_date: string;   // YYYY-MM-DD
    season_type: "year_round" | "summer_cruise_only" | "winter_ski_only";
  };
  daily_departures: Array<{
    departure_time_local: string; // HH:MM (24h)
    duration_minutes: number;
  }>;
  known_blackout_dates: string[];
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
  if (!["operator_contract", "live_api_tariff", "published_commercial_rate"].includes(p.source_type as string)) {
    errors.push(`${fieldPrefix}.source_type must be one of operator_contract, live_api_tariff, published_commercial_rate`);
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

export function validateAgentDirectory(data: unknown): ValidationResult {
  const errors: string[] = [];
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Data must be a non-null object"] };
  }
  const d = data as Partial<DccAgentDirectoryV2>;

  if (d.spec !== "dcc-agent-directory") errors.push("spec must be 'dcc-agent-directory'");
  if (d.version !== "2.0") errors.push("version must be '2.0'");
  if (!d.dcc_id || !isValidDccId(d.dcc_id, "dcc:site")) errors.push("dcc_id must match 'dcc:site:*'");
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

  // Actions
  if (d.actions) {
    for (const [actionName, actionUrl] of Object.entries(d.actions)) {
      if (actionUrl && !isValidHttpUrl(actionUrl, true)) {
        errors.push(`actions.${actionName} must be a valid https:// URL or relative path`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validatePricingFeed(items: unknown[]): ValidationResult {
  const errors: string[] = [];
  if (!Array.isArray(items)) {
    return { valid: false, errors: ["Pricing feed must be an array of pricing items"] };
  }

  items.forEach((item, idx) => {
    const p = item as Partial<DccPriceItem>;
    const prefix = `Item[${idx}] (${p.sku || "unknown"})`;

    if (!p.sku || typeof p.sku !== "string") errors.push(`${prefix}: sku is required`);
    if (!p.dcc_product_id || !isValidDccId(p.dcc_product_id, "dcc:product")) {
      errors.push(`${prefix}: dcc_product_id must match 'dcc:product:*'`);
    }
    if (p.currency !== "USD") errors.push(`${prefix}: currency must be 'USD'`);
    if (typeof p.base_rate !== "number" || isNaN(p.base_rate) || p.base_rate <= 0) {
      errors.push(`${prefix}: base_rate must be a positive number`);
    }
    if (p.rate_with_transportation !== undefined) {
      if (typeof p.rate_with_transportation !== "number" || p.rate_with_transportation < (p.base_rate || 0)) {
        errors.push(`${prefix}: rate_with_transportation must be >= base_rate`);
      }
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
    const prefix = `Policy[${idx}] (${pol.sku || "unknown"})`;

    if (!pol.sku) errors.push(`${prefix}: sku is required`);
    if (!pol.dcc_product_id || !isValidDccId(pol.dcc_product_id, "dcc:product")) {
      errors.push(`${prefix}: dcc_product_id must match 'dcc:product:*'`);
    }

    if (!pol.cancellation || typeof pol.cancellation.full_refund_notice_hours !== "number" || pol.cancellation.full_refund_notice_hours < 0) {
      errors.push(`${prefix}: cancellation.full_refund_notice_hours must be a non-negative number`);
    }
    if (!pol.weather_guarantee || typeof pol.weather_guarantee.policy_summary !== "string" || !pol.weather_guarantee.policy_summary.trim()) {
      errors.push(`${prefix}: weather_guarantee.policy_summary is required`);
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
    const prefix = `Product[${idx}] (${prod.sku || "unknown"})`;

    if (!prod.sku) errors.push(`${prefix}: sku is required`);
    if (!prod.dcc_product_id || !isValidDccId(prod.dcc_product_id, "dcc:product")) {
      errors.push(`${prefix}: dcc_product_id must match 'dcc:product:*'`);
    }
    if (!prod.title) errors.push(`${prefix}: title is required`);
    if (!prod.operator || !isValidDccId(prod.operator.dcc_operator_id, "dcc:operator")) {
      errors.push(`${prefix}: operator.dcc_operator_id must match 'dcc:operator:*'`);
    }
    if (!prod.canonical_page_url || !isValidHttpUrl(prod.canonical_page_url, true)) {
      errors.push(`${prefix}: canonical_page_url must be an https:// URL or relative path`);
    }
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
    const prefix = `Location[${idx}] (${loc.dcc_poi_id || "unknown"})`;

    if (!loc.dcc_poi_id || !isValidDccId(loc.dcc_poi_id, "dcc:poi")) {
      errors.push(`${prefix}: dcc_poi_id must match 'dcc:poi:*'`);
    }
    if (!loc.name) errors.push(`${prefix}: name is required`);
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
