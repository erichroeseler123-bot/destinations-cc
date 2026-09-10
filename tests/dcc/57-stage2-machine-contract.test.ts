import test from "node:test";
import assert from "node:assert/strict";
import {
  validateAgentDirectory,
  validatePricingFeed,
  validatePolicyFeed,
  validateProductFeed,
  validateLocationFeed,
  validateProvenance,
  DccAgentDirectoryV2,
  DccPriceItem,
  DccPolicyItem,
} from "../../lib/dcc/contracts/stage2MachineFeedContract";

const SAMPLE_PROVENANCE = {
  source: "Airboat Adventures 2026 Operator Agreement (Item #3491)",
  source_type: "operator_contract" as const,
  last_verified: "2026-09-01T12:00:00Z",
  review_by: "2026-12-01T00:00:00Z",
  verified_by: "contracts@destinations-cc.com",
};

const SAMPLE_VALID_DIRECTORY: DccAgentDirectoryV2 = {
  $schema: "https://www.destinationcommandcenter.com/schemas/dcc-agent-directory.v2.json",
  spec: "dcc-agent-directory",
  version: "2.0",
  dcc_id: "dcc:site:welcome-to-new-orleans-tours",
  name: "Welcome to New Orleans Tours",
  canonical_url: "https://www.welcometoneworleanstours.com",
  service_area: {
    dcc_destination_id: "dcc:destination:louisiana:new-orleans",
    name: "New Orleans",
    region: "Louisiana",
    country: "US",
    coordinates: {
      latitude: 29.9511,
      longitude: -90.0715,
    },
  },
  contact: {
    phone: "+15044849687",
    phone_display: "504-484-9687",
    help_url: "https://www.welcometoneworleanstours.com/contact",
  },
  authority_scope: ["curated_tours", "decision_guides", "operator_handoffs"],
  booking_boundary: {
    execution_model: "secure_handoff",
    primary_engine: "FareHarbor",
    payment_collected_on_site: false,
    operator_terms_url: "https://www.welcometoneworleanstours.com/terms",
  },
  directory: {
    products: "/api/v2/feeds/products.json",
    locations: "/api/v2/feeds/locations.json",
    pricing: "/api/v2/feeds/pricing.json",
    policies: "/api/v2/feeds/policies.json",
    operating_windows: "/api/v2/feeds/operating-windows.json",
    truth_record: "https://www.destinationcommandcenter.com/api/public/truth-feed?id=wno-tours",
  },
  actions: {
    quote: "/api/v2/actions/quote",
    availability: "/api/v2/actions/availability",
    booking_handoff: "/api/v2/actions/booking-handoff",
  },
  metadata: {
    last_generated: "2026-09-09T18:00:00Z",
    ttl_seconds: 3600,
    maintainer: "DCC Operations",
  },
};

test("Stage 2 Contract: Directory Validation", async (t) => {
  await t.test("accepts a fully compliant Stage 2 directory", () => {
    const result = validateAgentDirectory(SAMPLE_VALID_DIRECTORY);
    assert.equal(result.valid, true, `Expected valid, got errors: ${result.errors.join(", ")}`);
    assert.equal(result.errors.length, 0);
  });

  await t.test("rejects insecure or non-web action endpoints", () => {
    const badDirectory = {
      ...SAMPLE_VALID_DIRECTORY,
      actions: {
        booking_handoff: "http://insecure-checkout.com/handoff", // Insecure HTTP
        quote: "javascript:alert(1)",                           // XSS attempt
      },
    };
    const result = validateAgentDirectory(badDirectory);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("actions.booking_handoff")));
    assert.ok(result.errors.some((e) => e.includes("actions.quote")));
  });

  await t.test("rejects malformed DCC IDs", () => {
    const badDirectory = {
      ...SAMPLE_VALID_DIRECTORY,
      dcc_id: "invalid_id_format" as any,
    };
    const result = validateAgentDirectory(badDirectory);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("dcc:site:*")));
  });

  await t.test("rejects out-of-range coordinates", () => {
    const badDirectory = {
      ...SAMPLE_VALID_DIRECTORY,
      service_area: {
        ...SAMPLE_VALID_DIRECTORY.service_area,
        coordinates: {
          latitude: 999.0, // Invalid latitude
          longitude: -90.0715,
        },
      },
    };
    const result = validateAgentDirectory(badDirectory);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("latitude must be between -90 and 90")));
  });
});

test("Stage 2 Contract: Provenance & Date Order Enforcement", async (t) => {
  await t.test("accepts valid provenance with past verification and future review date", () => {
    const errors = validateProvenance(SAMPLE_PROVENANCE);
    assert.equal(errors.length, 0);
  });

  await t.test("rejects inverted verification dates (last_verified > review_by)", () => {
    const inverted = {
      ...SAMPLE_PROVENANCE,
      last_verified: "2026-12-01T00:00:00Z",
      review_by: "2026-09-01T00:00:00Z",
    };
    const errors = validateProvenance(inverted);
    assert.ok(errors.some((e) => e.includes("cannot be after review_by")));
  });

  await t.test("rejects future last_verified dates", () => {
    const future = {
      ...SAMPLE_PROVENANCE,
      last_verified: "2030-01-01T00:00:00Z",
      review_by: "2030-06-01T00:00:00Z",
    };
    const errors = validateProvenance(future);
    assert.ok(errors.some((e) => e.includes("cannot be in the future")));
  });

  await t.test("rejects missing source or verified_by", () => {
    const missing = {
      ...SAMPLE_PROVENANCE,
      source: "",
      verified_by: "",
    };
    const errors = validateProvenance(missing);
    assert.ok(errors.some((e) => e.includes("source is required")));
    assert.ok(errors.some((e) => e.includes("verified_by is required")));
  });
});

test("Stage 2 Contract: Pricing Feed Validation", async (t) => {
  await t.test("accepts valid pricing item with provenance", () => {
    const validItem: DccPriceItem = {
      sku: "wno-swamp-airboat-small",
      dcc_product_id: "dcc:product:wno-swamp-airboat-small",
      currency: "USD",
      pricing_structure: "per_person",
      base_rate: 89.0,
      rate_with_transportation: 109.0,
      mandatory_fees: [],
      provenance: SAMPLE_PROVENANCE,
    };
    const result = validatePricingFeed([validItem]);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  await t.test("rejects non-positive rates and rate_with_transportation < base_rate", () => {
    const badItem: DccPriceItem = {
      sku: "wno-bad-pricing",
      dcc_product_id: "dcc:product:wno-bad-pricing",
      currency: "USD",
      pricing_structure: "per_person",
      base_rate: -20.0, // Negative base rate
      rate_with_transportation: 10.0, // Less than base rate
      mandatory_fees: [],
      provenance: SAMPLE_PROVENANCE,
    };
    const result = validatePricingFeed([badItem]);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("base_rate must be a positive number")));
  });
});

test("Stage 2 Contract: Policy Feed Validation", async (t) => {
  await t.test("accepts enforceable cancellation and weather policy with provenance", () => {
    const validPolicy: DccPolicyItem = {
      sku: "wno-swamp-airboat-small",
      dcc_product_id: "dcc:product:wno-swamp-airboat-small",
      cancellation: {
        full_refund_notice_hours: 24,
        cancellation_method: "phone_or_email",
      },
      weather_guarantee: {
        is_guaranteed: true,
        policy_summary: "Full automatic refund if captain cancels due to squalls or lightning.",
        compensation_type: "full_refund_or_reschedule",
      },
      restrictions: {
        minimum_age: 5,
        pregnancy_allowed: false,
        wheelchair_accessible: "foldable_only",
      },
      provenance: SAMPLE_PROVENANCE,
    };
    const result = validatePolicyFeed([validPolicy]);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });
});
