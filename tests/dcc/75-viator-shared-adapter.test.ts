import test from "node:test";
import assert from "node:assert/strict";
import {
  writeVerifiedProductToCache,
  readVerifiedProductFromCache,
  isProductDisplayable,
  isAvailabilityStale,
  validatePickupClaim,
  validatePortOperation,
  validateCruiseSafetyWindow,
  type VerifiedProductRecord,
} from "../../lib/viator/verified-product-cache";
import {
  resolveViatorCodeForSite,
  resolveInternalIdForViatorCode,
  getMappingsForSite,
} from "../../lib/viator/mappings";
import {
  getVerifiedProductForSite,
  generateDccTrackedUrl,
} from "../../lib/dcc/internal/dccViatorAdapter";

const SAMPLE_SWAMP_RECORD: VerifiedProductRecord = {
  internalProductId: "covered-boat-swamp-tour",
  viatorProductCode: "3780SWAMP",
  status: "active",
  stable: {
    title: "New Orleans Swamp and Bayou Alligator Tour",
    supplier: "Gray Line New Orleans",
    destination: "New Orleans",
    destinationId: 675,
    canonicalViatorUrl:
      "https://www.viator.com/tours/New-Orleans/Swamp-and-Bayou-Sightseeing-Tour-with-Boat-Ride-from-New-Orleans/d675-3780SWAMP",
    durationMinutes: 120,
    durationText: "2 hours",
  },
  slowlyChanging: {
    images: [{ url: "https://media.viator.com/swamp.jpg", source: "supplier" }],
    description: "Cruise the bayous of southern Louisiana on a native-guided boat.",
    highlights: ["See wild alligators", "Guided bayou tour"],
    inclusions: ["Boat tour", "Local guide"],
    exclusions: ["Hotel pickup (unless option selected)", "Gratuities"],
    hasHotelPickup: false,
    cancellationPolicy: { freeCancellation: true, description: "Standard 24h" },
  },
  frequentlyChanging: {
    availabilityStatus: "available",
    startingPrice: 55.25,
    currency: "USD",
    availableOptions: [{ code: "1045AM", title: "10:45 AM Departure", times: ["10:45"] }],
    operatingDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
    lastVerifiedTimestamp: new Date().toISOString(),
    isLiveAvailability: true,
  },
  affiliate: {
    internalProductId: "covered-boat-swamp-tour",
    viatorProductCode: "3780SWAMP",
    defaultCampaign: "wts-plan-covered-boat",
    allowedSites: ["welcometotheswamp", "welcometoneworleanstours"],
    status: "active",
  },
};

const SAMPLE_JUNEAU_RECORD: VerifiedProductRecord = {
  internalProductId: "juneau-whale-small-group",
  viatorProductCode: "331813P1",
  status: "active",
  stable: {
    title: "Small-Group Juneau Whale Watching Cruise",
    supplier: "Alaska Galore Tours",
    destination: "Juneau",
    destinationId: 941,
    canonicalViatorUrl:
      "https://www.viator.com/tours/Juneau/Whale-Tours-in-Juneau-Alaska/d941-331813P1",
    durationMinutes: 210, // 3.5 hours
    durationText: "3.5 hours",
  },
  slowlyChanging: {
    images: [{ url: "https://media.viator.com/whale.jpg", source: "supplier" }],
    description: "Intimate catamaran safari in Auke Bay.",
    highlights: ["Humpback whale guaranteed", "Small group"],
    inclusions: ["Round-trip port transfer", "Naturalist guide"],
    exclusions: ["Food and beverage"],
    meetingPoint: "Mount Roberts Tramway Plaza",
    hasHotelPickup: true,
    cancellationPolicy: { freeCancellation: true },
  },
  frequentlyChanging: {
    availabilityStatus: "available",
    startingPrice: 189.0,
    currency: "USD",
    availableOptions: [{ code: "OPT1", title: "Morning Departure" }],
    operatingDays: ["DAILY"],
    lastVerifiedTimestamp: new Date().toISOString(),
    isLiveAvailability: true,
  },
  affiliate: {
    internalProductId: "juneau-whale-small-group",
    viatorProductCode: "331813P1",
    defaultCampaign: "last-frontier-juneau-whale-small-group",
    allowedSites: ["last-frontier-shore-excursions", "welcometoalaskatours", "cruisepromenade"],
    portSlug: "juneau",
    status: "active",
  },
};

test("1. DCC Mapping Registry resolves site-specific internal IDs to verified Viator codes", () => {
  // WTS mappings
  assert.equal(resolveViatorCodeForSite("welcometotheswamp", "covered-boat-swamp-tour"), "3780SWAMP");
  assert.equal(resolveViatorCodeForSite("welcometotheswamp", "airboat-swamp-tour"), "3780AIRBOAT");
  assert.equal(resolveViatorCodeForSite("welcometotheswamp", "swamp-tour-with-pickup"), "6953SWAMPTRANS");

  // WNO mappings
  assert.equal(resolveViatorCodeForSite("welcometoneworleanstours", "new-orleans-airboat"), "3780AIRBOAT");

  // LFSE mappings
  assert.equal(resolveViatorCodeForSite("last-frontier-shore-excursions", "juneau-whale-small-group"), "331813P1");
  assert.equal(resolveViatorCodeForSite("last-frontier-shore-excursions", "juneau-heli-glacier-walk"), "6251SHOREXICEWALK");

  // Reverse resolution
  assert.equal(resolveInternalIdForViatorCode("welcometotheswamp", "3780SWAMP"), "covered-boat-swamp-tour");
});

test("2. Verified Product Cache stores and retrieves 4-tier structured records", () => {
  writeVerifiedProductToCache(SAMPLE_SWAMP_RECORD);
  writeVerifiedProductToCache(SAMPLE_JUNEAU_RECORD);

  const swamp = readVerifiedProductFromCache("3780SWAMP");
  assert.ok(swamp, "Expected cached swamp record");
  assert.equal(swamp.stable.supplier, "Gray Line New Orleans");
  assert.equal(swamp.frequentlyChanging.startingPrice, 55.25);
  assert.equal(swamp.slowlyChanging.hasHotelPickup, false);

  const juneau = readVerifiedProductFromCache("331813P1");
  assert.ok(juneau, "Expected cached Juneau record");
  assert.equal(juneau.stable.supplier, "Alaska Galore Tours");
  assert.equal(juneau.affiliate.portSlug, "juneau");
});

test("3. Business Rule 1: Inactive products are rejected by the display gate", () => {
  const activeProduct = { ...SAMPLE_SWAMP_RECORD, status: "active" as const };
  const inactiveProduct = { ...SAMPLE_SWAMP_RECORD, status: "inactive" as const };

  assert.equal(isProductDisplayable(activeProduct), true);
  assert.equal(isProductDisplayable(inactiveProduct), false);
});

test("4. Business Rule 2: Stale availability guard prevents out-of-date live claims", () => {
  const freshRecord = { ...SAMPLE_SWAMP_RECORD };
  assert.equal(isAvailabilityStale(freshRecord, 60000), false);

  const staleTimestamp = new Date(Date.now() - 45 * 60 * 1000).toISOString(); // 45 mins ago
  const staleRecord: VerifiedProductRecord = {
    ...SAMPLE_SWAMP_RECORD,
    frequentlyChanging: {
      ...SAMPLE_SWAMP_RECORD.frequentlyChanging,
      lastVerifiedTimestamp: staleTimestamp,
    },
  };
  assert.equal(isAvailabilityStale(staleRecord, 30 * 60 * 1000), true);
});

test("5. Business Rule 3: Hotel pickup claims are strictly validated", () => {
  assert.equal(validatePickupClaim(SAMPLE_SWAMP_RECORD, true), false, "Swamp tour without pickup must reject pickup claim");
  assert.equal(validatePickupClaim(SAMPLE_SWAMP_RECORD, false), true, "Non-pickup claim is allowed");
  assert.equal(validatePickupClaim(SAMPLE_JUNEAU_RECORD, true), true, "Juneau tour with verified pickup passes claim");
});

test("6. Business Rule 4: Port operation boundaries prevent cross-port tour misplacement", () => {
  assert.equal(validatePortOperation(SAMPLE_JUNEAU_RECORD, "juneau"), true);
  assert.equal(validatePortOperation(SAMPLE_JUNEAU_RECORD, "skagway"), false, "Juneau tour must not be advertised in Skagway");
  assert.equal(validatePortOperation(SAMPLE_JUNEAU_RECORD, "ketchikan"), false, "Juneau tour must not be advertised in Ketchikan");
});

test("7. Business Rule 5: Cruise safety window rejects tours exceeding passenger shore time", () => {
  // 3.5 hour tour (210 mins)
  // Cruise arrival 08:00, departure 17:00 -> 9 hours (540 mins) total, with 60 min buffer -> 480 safe shore mins
  const longPortDay = validateCruiseSafetyWindow(SAMPLE_JUNEAU_RECORD, {
    arrivalHour: 8,
    departureHour: 17,
    allAboardBufferMinutes: 60,
  });
  assert.equal(longPortDay.fits, true, "210 min tour should fit a 9-hour port day with 60m buffer");

  // Short port day: arrival 13:00, departure 17:00 -> 4 hours (240 mins) total, with 60 min buffer -> 180 safe mins
  // 210 min tour does NOT fit into 180 safe shore minutes!
  const tightPortDay = validateCruiseSafetyWindow(SAMPLE_JUNEAU_RECORD, {
    arrivalHour: 13,
    departureHour: 17,
    allAboardBufferMinutes: 60,
  });
  assert.equal(tightPortDay.fits, false, "210 min tour must be rejected when shore window is only 180 mins");
  assert.ok(tightPortDay.reason?.includes("exceeds safe shore window"));
});

test("8. Tracked outbound URL preserves canonical path and injects validated affiliate tags", () => {
  const trackedUrl = generateDccTrackedUrl({
    siteId: "welcometotheswamp",
    internalProductId: "covered-boat-swamp-tour",
    canonicalUrl: SAMPLE_SWAMP_RECORD.stable.canonicalViatorUrl,
    pageType: "plan",
    customCampaign: "wts-plan-covered-boat",
  });

  const parsed = new URL(trackedUrl);
  assert.equal(parsed.origin, "https://www.viator.com");
  assert.ok(parsed.pathname.includes("/d675-3780SWAMP"));
  assert.equal(parsed.searchParams.get("pid"), "P00306962");
  assert.equal(parsed.searchParams.get("mcid"), "42383");
  assert.equal(parsed.searchParams.get("medium"), "link");
  assert.equal(parsed.searchParams.get("campaign"), "wts-plan-covered-boat");
  assert.equal(parsed.searchParams.get("utm_source"), "destinationcommandcenter");
});

test("9. getVerifiedProductForSite orchestrates all business rules through single interface", () => {
  // Valid request for WTS
  const wtsRes = getVerifiedProductForSite({
    siteId: "welcometotheswamp",
    internalProductId: "covered-boat-swamp-tour",
  });
  assert.equal(wtsRes.success, true);
  assert.ok(wtsRes.trackedUrl?.includes("pid=P00306962"));

  // Rejected request: claiming hotel pickup for tour that doesn't have it
  const pickupViolation = getVerifiedProductForSite({
    siteId: "welcometotheswamp",
    internalProductId: "covered-boat-swamp-tour",
    requiresHotelPickup: true,
  });
  assert.equal(pickupViolation.success, false);
  assert.ok(pickupViolation.reason?.includes("Hotel pickup claim rejected"));

  // Rejected request: requesting Juneau tour in Skagway port
  const portViolation = getVerifiedProductForSite({
    siteId: "last-frontier-shore-excursions",
    internalProductId: "juneau-whale-small-group",
    targetPort: "skagway",
  });
  assert.equal(portViolation.success, false);
  assert.ok(portViolation.reason?.includes("Port boundary violation"));
});
