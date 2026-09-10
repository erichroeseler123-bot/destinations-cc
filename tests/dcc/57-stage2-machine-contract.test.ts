import test from "node:test";
import assert from "node:assert/strict";
import {
  validateAgentDirectory,
  validatePricingFeed,
  validatePolicyFeed,
  validateProductFeed,
  validateLocationFeed,
  validateOperatingWindowsFeed,
  validateProvenance,
  DccAgentDirectoryV2,
  DccPriceItem,
  DccPolicyItem,
  DccScheduleItem,
  DccProductItem,
} from "../../lib/dcc/contracts/stage2MachineFeedContract";
import {
  getWnoAgentDirectory,
  getWnoProductsFeed,
  getWnoLocationsFeed,
  getWnoPricingFeed,
  getWnoPoliciesFeed,
  getWnoOperatingWindowsFeed,
} from "../../app/new-orleans/data/wnoFeedsData";

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
  dcc_id: "dcc:site:wno-tours",
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
    products: "/api/v2/feeds/products",
    locations: "/api/v2/feeds/locations",
    pricing: "/api/v2/feeds/pricing",
    policies: "/api/v2/feeds/policies",
    operating_windows: "/api/v2/feeds/operating-windows",
    truth_record: "https://www.destinationcommandcenter.com/api/public/truth-feed?id=wno-tours",
  },
  capabilities: {
    catalog_navigation: "https://www.welcometoneworleanstours.com/tours",
    booking_handoff_mode: "client_navigation",
  },
  metadata: {
    last_generated: "2026-09-09T18:00:00Z",
    ttl_seconds: 3600,
    maintainer: "DCC Operations",
  },
};

test("Stage 2 Contract: Directory Validation", async (t) => {
  await t.test("accepts a fully compliant Stage 2 directory with matching site ID", () => {
    const result = validateAgentDirectory(SAMPLE_VALID_DIRECTORY, "dcc:site:wno-tours");
    assert.equal(result.valid, true, `Expected valid, got errors: ${result.errors.join(", ")}`);
    assert.equal(result.errors.length, 0);
  });

  await t.test("rejects site ID mismatch", () => {
    const badDirectory = {
      ...SAMPLE_VALID_DIRECTORY,
      dcc_id: "dcc:site:wrong-site" as any,
    };
    const result = validateAgentDirectory(badDirectory, "dcc:site:wno-tours");
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("expected canonical site ID")));
  });

  await t.test("rejects insecure or non-web navigation links", () => {
    const badDirectory = {
      ...SAMPLE_VALID_DIRECTORY,
      capabilities: {
        ...SAMPLE_VALID_DIRECTORY.capabilities,
        catalog_navigation: "http://insecure.com/tours", // Insecure HTTP
      },
    };
    const result = validateAgentDirectory(badDirectory);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("capabilities.catalog_navigation")));
  });
});

test("Stage 2 Contract: Provenance & Date Invariants", async (t) => {
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
});

test("Stage 2 Contract: Pricing Feed Modeling", async (t) => {
  await t.test("accepts verified pricing item with positive base rate", () => {
    const validItem: DccPriceItem = {
      sku: "wno-swamp-airboat-small",
      dcc_product_id: "dcc:product:wno-swamp-airboat-small",
      currency: "USD",
      verification_status: "verified",
      pricing_structure: "per_person",
      base_rate: 89.0,
      mandatory_fees: [],
      provenance: SAMPLE_PROVENANCE,
    };
    const result = validatePricingFeed([validItem]);
    assert.equal(result.valid, true);
  });

  await t.test("accepts requires_operator_confirmation item with note and no base_rate", () => {
    const confirmationItem: DccPriceItem = {
      sku: "wno-unverified-tour",
      dcc_product_id: "dcc:product:wno-unverified-tour",
      currency: "USD",
      verification_status: "requires_operator_confirmation",
      pricing_structure: "per_person",
      mandatory_fees: [],
      confirmation_note: "Rates confirmed in live checkout",
      provenance: SAMPLE_PROVENANCE,
    };
    const result = validatePricingFeed([confirmationItem]);
    assert.equal(result.valid, true);
  });

  await t.test("rejects requires_operator_confirmation item missing confirmation note", () => {
    const badItem: DccPriceItem = {
      sku: "wno-bad-unverified",
      dcc_product_id: "dcc:product:wno-bad-unverified",
      currency: "USD",
      verification_status: "requires_operator_confirmation",
      pricing_structure: "per_person",
      mandatory_fees: [],
      provenance: SAMPLE_PROVENANCE,
    };
    const result = validatePricingFeed([badItem]);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("must include a confirmation_note")));
  });
});

test("Stage 2 Contract: Policy Feed Modeling", async (t) => {
  await t.test("accepts verified non-refundable policy without full_refund_notice_hours and main_deck_only accessibility", () => {
    const validPolicy: DccPolicyItem = {
      sku: "wno-evening-jazz-cruise",
      dcc_product_id: "dcc:product:wno-evening-jazz-cruise",
      verification_status: "verified",
      cancellation: {
        refund_eligibility: "non_refundable",
        cancellation_method: "phone_or_email",
        note: "All sales final per passenger contract.",
      },
      weather_guarantee: {
        is_guaranteed: false,
        policy_summary: "Cruises sail rain or shine. In severe river conditions event is held dockside.",
        compensation_type: "none",
      },
      restrictions: {
        wheelchair_accessible: "main_deck_only",
        accessibility_note: "Main deck and dining room accessible; top deck accessible by stairs only per operator FAQ.",
      },
      provenance: SAMPLE_PROVENANCE,
    };
    const result = validatePolicyFeed([validPolicy]);
    assert.equal(result.valid, true, `Errors: ${result.errors.join(", ")}`);
  });

  await t.test("rejects non-refundable policy that specifies full_refund_notice_hours", () => {
    const badNonRefundable: DccPolicyItem = {
      sku: "wno-bad-non-refundable",
      dcc_product_id: "dcc:product:wno-bad-non-refundable",
      verification_status: "verified",
      cancellation: {
        refund_eligibility: "non_refundable",
        full_refund_notice_hours: 0, // FORBIDDEN for non_refundable!
        cancellation_method: "phone_or_email",
      },
      weather_guarantee: {
        is_guaranteed: false,
        policy_summary: "Rain or shine.",
        compensation_type: "none",
      },
      restrictions: {
        wheelchair_accessible: "main_deck_only",
      },
      provenance: SAMPLE_PROVENANCE,
    };
    const result = validatePolicyFeed([badNonRefundable]);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("must not specify full_refund_notice_hours")));
  });

  await t.test("rejects full_refund_with_notice policy missing positive notice hours", () => {
    const badRefundNotice: DccPolicyItem = {
      sku: "wno-bad-refund-notice",
      dcc_product_id: "dcc:product:wno-bad-refund-notice",
      verification_status: "verified",
      cancellation: {
        refund_eligibility: "full_refund_with_notice",
        cancellation_method: "phone_or_email",
      },
      weather_guarantee: {
        is_guaranteed: false,
        policy_summary: "Rain or shine.",
        compensation_type: "none",
      },
      restrictions: {
        wheelchair_accessible: "full",
      },
      provenance: SAMPLE_PROVENANCE,
    };
    const result = validatePolicyFeed([badRefundNotice]);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("must specify positive full_refund_notice_hours")));
  });

  await t.test("rejects invalid wheelchair_accessible option", () => {
    const badAccess: DccPolicyItem = {
      sku: "wno-bad-access",
      dcc_product_id: "dcc:product:wno-bad-access",
      verification_status: "requires_operator_confirmation",
      cancellation: {
        refund_eligibility: "requires_operator_confirmation",
        cancellation_method: "requires_operator_confirmation",
      },
      weather_guarantee: {
        is_guaranteed: false,
        policy_summary: "Standard policy",
        compensation_type: "requires_operator_confirmation",
      },
      restrictions: {
        wheelchair_accessible: "partial_unknown" as any,
      },
      provenance: SAMPLE_PROVENANCE,
    };
    const result = validatePolicyFeed([badAccess]);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("restrictions.wheelchair_accessible must be one of")));
  });

  await t.test("rejects unverified policy that falsely claims affirmative weather guarantee", () => {
    const badPolicy: DccPolicyItem = {
      sku: "wno-unverified-policy",
      dcc_product_id: "dcc:product:wno-unverified-policy",
      verification_status: "requires_operator_confirmation",
      cancellation: {
        refund_eligibility: "requires_operator_confirmation",
        cancellation_method: "requires_operator_confirmation",
      },
      weather_guarantee: {
        is_guaranteed: true, // FALSE AFFIRMATIVE CLAIM ON UNVERIFIED ITEM!
        policy_summary: "Inferred guarantee",
        compensation_type: "full_refund_or_reschedule",
      },
      restrictions: {
        wheelchair_accessible: "requires_operator_confirmation",
      },
      provenance: SAMPLE_PROVENANCE,
    };
    const result = validatePolicyFeed([badPolicy]);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("must not claim affirmative weather guarantee")));
  });
});

test("Stage 2 Contract: Operating Windows Modeling", async (t) => {
  await t.test("requires valid time zone on all schedules", () => {
    const badSchedule: DccScheduleItem = {
      sku: "wno-bad-schedule",
      dcc_product_id: "dcc:product:wno-bad-schedule",
      time_zone: "", // Missing time zone
      verification_status: "verified",
      season: {
        start_date: "2026-01-01",
        end_date: "2026-12-31",
        season_type: "year_round",
      },
      daily_departures: [{ departure_time_local: "09:45", duration_minutes: 120 }],
      known_blackout_dates: [],
      provenance: SAMPLE_PROVENANCE,
    };
    const result = validateOperatingWindowsFeed([badSchedule]);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("time_zone is required")));
  });

  await t.test("rejects invalid clock time format (e.g. 29:59)", () => {
    const badTimeSchedule: DccScheduleItem = {
      sku: "wno-bad-clock-time",
      dcc_product_id: "dcc:product:wno-bad-clock-time",
      time_zone: "America/Chicago",
      verification_status: "verified",
      season: {
        start_date: "2026-01-01",
        end_date: "2026-12-31",
        season_type: "year_round",
      },
      daily_departures: [{ departure_time_local: "29:59", duration_minutes: 120 }],
      known_blackout_dates: [],
      provenance: SAMPLE_PROVENANCE,
    };
    const result = validateOperatingWindowsFeed([badTimeSchedule]);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("departure_time_local must be in 24h HH:MM format")));
  });

  await t.test("rejects blackout date falling outside declared season range", () => {
    const outOfBoundsSchedule: DccScheduleItem = {
      sku: "wno-out-of-bounds-blackout",
      dcc_product_id: "dcc:product:wno-out-of-bounds-blackout",
      time_zone: "America/Chicago",
      verification_status: "verified",
      season: {
        start_date: "2026-01-01",
        end_date: "2026-12-31",
        season_type: "year_round",
      },
      daily_departures: [{ departure_time_local: "19:00", duration_minutes: 120 }],
      known_blackout_dates: ["2027-02-09"], // 2027 date in 2026 season
      provenance: SAMPLE_PROVENANCE,
    };
    const result = validateOperatingWindowsFeed([outOfBoundsSchedule]);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("falls outside declared season range")));
  });
});

test("WNO Pilot: 3-Offering Factual Verification", async (t) => {
  const products = getWnoProductsFeed();
  const schedules = getWnoOperatingWindowsFeed();
  const pricing = getWnoPricingFeed();
  const policies = getWnoPoliciesFeed();

  await t.test("1. Evening Jazz Cruise has distinct evening schedule, wharf location, non-refundable terms, and accessibility", () => {
    const sched = schedules.find((s) => s.sku === "wno-evening-jazz-cruise")!;
    assert.equal(sched.verification_status, "verified");
    assert.equal(sched.daily_departures.length, 1);
    assert.equal(sched.daily_departures[0].departure_time_local, "19:00");
    assert.equal(sched.daily_departures[0].duration_minutes, 120);
    assert.equal(sched.time_zone, "America/Chicago");
    assert.deepEqual(sched.known_blackout_dates, ["2026-12-25"]);

    const prod = products.find((p) => p.sku === "wno-evening-jazz-cruise")!;
    assert.equal(prod.locations.meeting_hub, "dcc:poi:nola:toulouse-street-wharf");
    assert.equal(prod.locations.pickup_mode, "self_arrive_only");

    const price = pricing.find((p) => p.sku === "wno-evening-jazz-cruise")!;
    assert.equal(price.verification_status, "verified");
    assert.equal(price.base_rate, 58.0);
    assert.equal(price.price_scope, "sightseeing_only");
    assert.equal(price.fee_completeness, "taxes_and_fees_confirmed_at_checkout");

    const pol = policies.find((p) => p.sku === "wno-evening-jazz-cruise")!;
    assert.equal(pol.verification_status, "verified");
    assert.equal(pol.cancellation.refund_eligibility, "non_refundable");
    assert.equal(pol.cancellation.full_refund_notice_hours, undefined); // Reserved strictly for full_refund_with_notice
    assert.equal(pol.restrictions.wheelchair_accessible, "main_deck_only");
    assert.ok(pol.restrictions.accessibility_note);
    assert.equal(pol.weather_guarantee.is_guaranteed, false);
    assert.equal(pol.weather_guarantee.compensation_type, "none");
  });

  await t.test("2. Covered Tour Boat has verified rates, verified launch location, 48h cancellation, and unknown schedule", () => {
    const sched = schedules.find((s) => s.sku === "wno-covered-tour-boat")!;
    // Field-level truth: schedule is unknown/requires confirmation, even though price is verified
    assert.equal(sched.verification_status, "requires_operator_confirmation");
    assert.equal(sched.daily_departures.length, 0);
    assert.ok(sched.schedule_note);

    const prod = products.find((p) => p.sku === "wno-covered-tour-boat")!;
    assert.equal(prod.locations.meeting_hub, "dcc:poi:nola:ragin-cajun-slip-luling");
    assert.equal(prod.locations.pickup_mode, "optional_add_on");

    const price = pricing.find((p) => p.sku === "wno-covered-tour-boat")!;
    assert.equal(price.verification_status, "verified");
    assert.equal(price.base_rate, 35.0);
    assert.equal(price.rate_with_transportation, 60.0);
    assert.equal(price.price_scope, "self_arrive");
    assert.equal(price.fee_completeness, "taxes_and_fees_confirmed_at_checkout");

    const pol = policies.find((p) => p.sku === "wno-covered-tour-boat")!;
    assert.equal(pol.cancellation.refund_eligibility, "full_refund_with_notice");
    assert.equal(pol.cancellation.full_refund_notice_hours, 48);
    assert.equal(pol.weather_guarantee.is_guaranteed, true);
    assert.equal(pol.weather_guarantee.compensation_type, "full_refund_or_reschedule");
    assert.equal(pol.restrictions.wheelchair_accessible, "requires_operator_confirmation");
  });

  await t.test("3. Oak Alley or Laura Plantation Tour has unconfirmed meeting point, alternative destinations, and requires confirmation for price/schedule", () => {
    const sched = schedules.find((s) => s.sku === "wno-oak-alley-or-laura-plantation-tour")!;
    assert.equal(sched.verification_status, "requires_operator_confirmation");

    const prod = products.find((p) => p.sku === "wno-oak-alley-or-laura-plantation-tour")!;
    // Departure point is unconfirmed across multiple hotel corridors; kept unknown
    assert.equal(prod.locations.meeting_hub, undefined);
    // Separate alternative destinations
    assert.deepEqual(prod.locations.possible_destinations, [
      "dcc:poi:nola:oak-alley-plantation-grounds",
      "dcc:poi:nola:laura-plantation-grounds",
    ]);
    assert.equal(prod.locations.destination_selection, "determined_during_booking");
    assert.equal(prod.locations.pickup_mode, "included");

    const price = pricing.find((p) => p.sku === "wno-oak-alley-or-laura-plantation-tour")!;
    assert.equal(price.verification_status, "requires_operator_confirmation");
    assert.equal(price.base_rate, undefined);
    assert.ok(price.confirmation_note);

    const pol = policies.find((p) => p.sku === "wno-oak-alley-or-laura-plantation-tour")!;
    assert.equal(pol.verification_status, "requires_operator_confirmation");
    assert.equal(pol.cancellation.cancellation_method, "requires_operator_confirmation");
    assert.equal(pol.weather_guarantee.compensation_type, "requires_operator_confirmation");
  });

  await t.test("4. Non-verified fields declare requires_operator_confirmation with genuine unknowns", () => {
    const unverifiedPricing = pricing.filter((p) => p.verification_status === "requires_operator_confirmation");
    // 18 catalog products + 1 plantation tour = 19 items requiring operator checkout price confirmation
    assert.equal(unverifiedPricing.length, 19);
    for (const p of unverifiedPricing) {
      assert.equal(p.base_rate, undefined, `Expected undefined base_rate for ${p.sku}`);
      assert.ok(p.confirmation_note);
    }

    const unverifiedSchedules = schedules.filter((s) => s.verification_status === "requires_operator_confirmation");
    // 18 catalog products + 1 covered boat + 1 plantation tour = 20 items requiring operator schedule confirmation
    assert.equal(unverifiedSchedules.length, 20);
    for (const s of unverifiedSchedules) {
      assert.equal(s.daily_departures.length, 0, `Expected 0 daily departures for unverified ${s.sku}`);
      assert.equal(s.known_blackout_dates.length, 0, `Expected 0 blackout dates for unverified ${s.sku}`);
      assert.equal(s.season, undefined, `Expected undefined season for unverified ${s.sku}`);
      assert.ok(s.schedule_note);
    }

    const unverifiedProducts = products.filter(
      (p) => !["wno-evening-jazz-cruise", "wno-covered-tour-boat", "wno-oak-alley-or-laura-plantation-tour"].includes(p.sku)
    );
    assert.equal(unverifiedProducts.length, 18);
    for (const p of unverifiedProducts) {
      assert.equal(p.locations.meeting_hub, undefined, `Expected undefined meeting_hub for unverified ${p.sku}`);
      assert.equal(p.locations.pickup_mode, "requires_operator_confirmation");
    }
  });
});
