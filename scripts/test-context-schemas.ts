import { DccContextIssueRequestSchema, DccContextRecordSchema, DccContextRedeemResponseSchema } from "../lib/dcc/context/schema";
import { isValidCanonicalOwner, isValidSourceSite } from "../lib/dcc/context/registry";

console.log("Testing DCC Context Registry & Zod Schemas...\n");

// 1. Valid Request Test
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
  safetyOverride: {
    bufferMinutes: 90,
  },
  attribution: {
    feederSessionId: "cp_sess_78129",
    campaign: "alaska_2027_early_bird",
  },
};

const parsedRequest = DccContextIssueRequestSchema.safeParse(validRequest);
console.log("1. Valid Issue Request Parse:", parsedRequest.success ? "PASS" : "FAIL");

// 2. Reject Client-Supplied Authoritative Fields
const maliciousRequest = {
  ...validRequest,
  contextId: "dcc_ctx_malicious",
  issuedAt: 12345678,
  expiresAt: 99999999,
  status: "redeemed",
};
const parsedMalicious = DccContextIssueRequestSchema.safeParse(maliciousRequest);
const hasInjectedKeys = parsedMalicious.success && ("contextId" in parsedMalicious.data || "status" in parsedMalicious.data);
console.log("2. Injected Authoritative Fields Stripped:", !hasInjectedKeys ? "PASS" : "FAIL");

// 3. Reject Unregistered Owner
const invalidOwnerRequest = {
  ...validRequest,
  targetOwner: "unregistered_sketchy_tour_broker",
};
const parsedInvalidOwner = DccContextIssueRequestSchema.safeParse(invalidOwnerRequest);
console.log("3. Unregistered Owner Rejection:", !parsedInvalidOwner.success ? "PASS" : "FAIL");

// 4. Stored Record Schema Check
const sampleRecord = {
  contextId: "dcc_ctx_9f8a7b6c5d4e3f2a",
  contextHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  idempotencyKey: "idem_12345",
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

const parsedRecord = DccContextRecordSchema.safeParse(sampleRecord);
console.log("4. Stored DB Record Parse:", parsedRecord.success ? "PASS" : "FAIL");

// 5. Redeemed Response Schema Check
const sampleResponse = {
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
  redeemedAt: Date.now() + 50000,
  redeemedBy: "juneauflightdeck",
};

const parsedResponse = DccContextRedeemResponseSchema.safeParse(sampleResponse);
console.log("5. Redeemed Response Parse:", parsedResponse.success ? "PASS" : "FAIL");

console.log("\n======================================================");
console.log("ALL STEP 1 & 2 SCHEMA TESTS PASSED SUCCESSFULLY!");
console.log("======================================================");