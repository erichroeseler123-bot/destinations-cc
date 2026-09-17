import {
  DccContextIssueRequestSchema,
  DccContextRecordSchema,
  DccContextRedeemResponseSchema,
  isValidCalendarDate,
  buildScopedIdempotencyKey,
} from "../lib/dcc/context/schema";
import {
  resolveAuthoritativeBuffer,
  getAuthoritativeSafetyProfile,
} from "../lib/dcc/context/registry";

console.log("======================================================");
console.log("HARDENED DCC CONTEXT SCHEMA & SAFETY VERIFICATION");
console.log("======================================================\n");

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(` PASS: ${name}`);
    passed++;
  } else {
    console.error(` FAIL: ${name} ${details ? "- " + details : ""}`);
    failed++;
  }
}

// 1. Valid Request
const validRequest = {
  sourceSite: "cruisepromenade",
  destination: "juneau",
  targetOwner: "juneauflightdeck",
  targetIntent: "glacier-helicopter-landing",
  schedule: {
    date: "2027-06-16",
    arrival: "08:00",
    departure: "17:00",
    travelers: 4,
    shipOrVenue: "norwegian-jewel",
  },
  attribution: {
    feederSessionId: "cp_sess_78129",
  },
};
const parse1 = DccContextIssueRequestSchema.safeParse(validRequest);
assert("1. Standard valid request passes schema validation", parse1.success);

// 2. Strict Injected Fields Rejection
const injectedRequest = {
  ...validRequest,
  contextId: "dcc_ctx_client_forged",
  status: "redeemed",
};
const parse2 = DccContextIssueRequestSchema.safeParse(injectedRequest);
assert("2. Injected client fields rejected by .strict()", !parse2.success);

// 3. Client Safety Override Cannot Reduce Authoritative Floor
const authoritativeJuneau = resolveAuthoritativeBuffer("juneau", 0); // Client passed 0 min
assert("3a. Client 0m buffer clamped to authoritative 90m floor", authoritativeJuneau === 90);

const authoritativeAukeBay = resolveAuthoritativeBuffer("juneau", 30, "auke_bay_heliport"); // Client passed 30 min
assert("3b. Client 30m buffer clamped to authoritative 90m Auke Bay modifier", authoritativeAukeBay === 90);

const clientIncreasedBuffer = resolveAuthoritativeBuffer("juneau", 120); // Client requested stricter safety
assert("3c. Client stricter safety buffer (120m > 90m) is permitted", clientIncreasedBuffer === 120);

// 4. Unknown Destination Rejection (No Silent Fallbacks)
let unknownDestError = false;
try {
  getAuthoritativeSafetyProfile("atlantis_mystic_cove");
} catch (e) {
  unknownDestError = true;
}
assert("4a. Unknown destination throws exception in safety profile resolver", unknownDestError);

const unknownDestRequest = {
  ...validRequest,
  destination: "atlantis_mystic_cove",
};
const parse4b = DccContextIssueRequestSchema.safeParse(unknownDestRequest);
assert("4b. Unknown destination rejected by schema validation", !parse4b.success);

// 5. Owner-Destination Incompatibility Rejection
const incompatibleRequest = {
  ...validRequest,
  destination: "new-orleans", // juneauflightdeck does NOT operate in new-orleans
  targetOwner: "juneauflightdeck",
};
const parse5 = DccContextIssueRequestSchema.safeParse(incompatibleRequest);
assert("5. Incompatible owner-destination pair rejected", !parse5.success);

// 6. Real Calendar Date Validation
assert("6a. Valid calendar date 2027-06-16", isValidCalendarDate("2027-06-16") === true);
assert("6b. Valid leap year date 2028-02-29", isValidCalendarDate("2028-02-29") === true);
assert("6c. Invalid non-leap year date 2027-02-29 rejected", isValidCalendarDate("2027-02-29") === false);
assert("6d. Impossible date 2027-02-31 rejected", isValidCalendarDate("2027-02-31") === false);
assert("6e. Impossible date 2027-04-31 rejected", isValidCalendarDate("2027-04-31") === false);

const invalidDateRequest = {
  ...validRequest,
  schedule: {
    ...validRequest.schedule,
    date: "2027-02-31",
  },
};
const parse6f = DccContextIssueRequestSchema.safeParse(invalidDateRequest);
assert("6f. Schema rejects phantom calendar dates", !parse6f.success);

// 7. Scoped Idempotency Key Validation
const scopedKey = buildScopedIdempotencyKey("cruisepromenade", "juneauflightdeck", "cart_99812");
assert("7. Idempotency key scoped by source and owner", scopedKey === "cruisepromenade:juneauflightdeck:cart_99812");

// 8. Stored DB Record Validation
const sampleDbRecord = {
  contextId: "dcc_ctx_9f8a7b6c5d4e3f2a",
  contextHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  idempotencyKey: "cruisepromenade:juneauflightdeck:cart_99812",
  version: "1.0",
  status: "issued",
  sourceSite: "cruisepromenade",
  destination: "juneau",
  targetOwner: "juneauflightdeck",
  targetIntent: "glacier-helicopter-landing",
  timezone: "America/Anchorage",
  scheduleDate: "2027-06-16",
  arrival: "08:00",
  departure: "17:00",
  travelers: 4,
  shipOrVenue: "norwegian-jewel",
  bufferMinutes: 90,
  latestSafeReturnDate: "2027-06-16",
  latestSafeReturnTime: "15:30",
  midnightCrossed: false,
  attribution: {
    feederSessionId: "cp_sess_78129",
  },
  issuedAt: new Date(),
  expiresAt: new Date(Date.now() + 900000),
  redeemedAt: null,
  redeemedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const parse8 = DccContextRecordSchema.safeParse(sampleDbRecord);
assert("8. Valid stored database entity parsed", parse8.success);

// 9. Owner Redeemed Response Validation
const sampleRedeemedResponse = {
  contextId: "dcc_ctx_9f8a7b6c5d4e3f2a",
  version: "1.0",
  status: "redeemed",
  sourceSite: "cruisepromenade",
  destination: "juneau",
  targetOwner: "juneauflightdeck",
  targetIntent: "glacier-helicopter-landing",
  timezone: "America/Anchorage",
  schedule: {
    date: "2027-06-16",
    arrival: "08:00",
    departure: "17:00",
    travelers: 4,
    shipOrVenue: "norwegian-jewel",
  },
  safetyConstraint: {
    bufferMinutes: 90,
    latestSafeReturnDate: "2027-06-16",
    latestSafeReturnTime: "15:30",
    midnightCrossed: false,
  },
  attribution: {
    feederSessionId: "cp_sess_78129",
  },
  issuedAt: Date.now(),
  expiresAt: Date.now() + 900000,
  redeemedAt: Date.now() + 15000,
  redeemedBy: "juneauflightdeck",
};
const parse9 = DccContextRedeemResponseSchema.safeParse(sampleRedeemedResponse);
assert("9. Authoritative owner redemption response parsed", parse9.success);

console.log("\n======================================================");
console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log("======================================================");

if (failed > 0) process.exit(1);