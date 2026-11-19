import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";

import {
  ALASKA_RV_CONTRACT_VERSION,
  ALASKA_RV_PLANNER_INTEGRATION_CONTRACT_VERSION,
  evaluateRvCorridorCompliance,
  evaluateRvFerryBookingReadiness,
  evaluateRvSiteCompatibility,
} from "@/lib/dcc/shared/alaskaRvContract";
import {
  ALASKA_RV_ACTIVITIES,
  ALASKA_RV_CAMPGROUNDS,
  ALASKA_RV_ENTRY_MODES,
  ALASKA_RV_FERRY_RULES,
  ALASKA_RV_HIGHWAY_CORRIDORS,
  ALASKA_RV_MARKET_LANDSCAPE,
  ALASKA_RV_PILOT_PLACES,
  ALASKA_RV_RECOMMENDED_9D_EXAMPLE_DAYS,
  ALASKA_RV_RENTAL_OPERATORS,
  ALASKA_RV_SERVICE_STOPS,
  ALASKA_RV_UNRESOLVED_FACTS_LEDGER,
  DCC_CP_ALASKA_RV_INTEGRATION_CONTRACT,
} from "@/lib/dcc/shared/alaskaRvKenaiPilotData";
import { getSoutheastAlaskaDirectorySnapshot } from "@/lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";
import { GET as getAlaskaRvPilot } from "@/app/api/v1/alaska/rv-pilot/route";

test("DCC Alaska RV Contract: preserves Southeast LFSE boundary and defines Southcentral/Kenai canonical entities without ship/sailing records", () => {
  const seak = getSoutheastAlaskaDirectorySnapshot();
  const seakSlugs = new Set(seak.places.map((p) => p.place.publicPortSlug).filter(Boolean));
  assert.equal(seakSlugs.has("anchorage"), false, "LFSE Southeast directory must not be stretched into Southcentral");
  assert.equal(seakSlugs.has("homer"), false);
  assert.equal(seakSlugs.has("seward"), false);

  assert.equal(DCC_CP_ALASKA_RV_INTEGRATION_CONTRACT.contractVersion, ALASKA_RV_PLANNER_INTEGRATION_CONTRACT_VERSION);
  assert.equal(DCC_CP_ALASKA_RV_INTEGRATION_CONTRACT.requiresCruiseShipOrSailingRecord, false);
  assert.equal(DCC_CP_ALASKA_RV_INTEGRATION_CONTRACT.createsSyntheticPhysicalSailingId, false);
  assert.equal(DCC_CP_ALASKA_RV_INTEGRATION_CONTRACT.defaultRollCallSyncEnabled, false);

  assert.equal(ALASKA_RV_ENTRY_MODES.length, 3);
  assert.ok(ALASKA_RV_MARKET_LANDSCAPE.length >= 6);
  assert.ok(ALASKA_RV_PILOT_PLACES.some((p) => p.placeId === "dcc:place:us-ak-anchorage-ak:0001"));
  assert.ok(ALASKA_RV_PILOT_PLACES.some((p) => p.placeId === "dcc:port:us-seward:0001"));
  assert.ok(ALASKA_RV_PILOT_PLACES.some((p) => p.placeId === "dcc:place:us-ak-homer-ak:0001"));
});

test("DCC Alaska RV Contract: enforces all 6 RV fact separations and keeps unknown facts unknown", () => {
  // Separation #1: Rental operator vs. actual vehicle specifications (unknown length stays null -> needs_confirmation)
  const gah = ALASKA_RV_RENTAL_OPERATORS.find((o) => o.operatorId === "operator:great-alaskan-holidays")!;
  const heldAbc = ALASKA_RV_RENTAL_OPERATORS.find((o) => o.operatorId === "operator:abc-motorhome-rentals")!;
  assert.equal(gah.publicationStatus, "published_pilot");
  assert.equal(heldAbc.publicationStatus, "held_source_unreachable");
  assert.equal(heldAbc.typicalLengthRangeFeet, null);

  // Separation #2: Rental permission for a road vs. physical open status (511.alaska.gov)
  const sewardHwy = ALASKA_RV_HIGHWAY_CORRIDORS.find((c) => c.corridorId === "corridor:seward-hwy-anc-seward")!;
  const mccarthyRd = ALASKA_RV_HIGHWAY_CORRIDORS.find((c) => c.corridorId === "corridor:mccarthy-road-contrast-example")!;
  const gonorth = ALASKA_RV_RENTAL_OPERATORS.find((o) => o.operatorId === "operator:gonorth-car-rv-rental")!;

  const gahOnMccarthy = evaluateRvCorridorCompliance({
    vehicle: { ownershipMode: "rental", rentalOperatorId: gah.operatorId },
    operator: gah,
    corridor: mccarthyRd,
  });
  assert.equal(gahOnMccarthy.rentalPermissionState, "prohibited");
  assert.equal(gahOnMccarthy.physicalRoadStatusState, "not_checked_verify_511_live");

  const ownedOnMccarthy = evaluateRvCorridorCompliance({
    vehicle: { ownershipMode: "traveler_owned", rentalOperatorId: null },
    operator: null,
    corridor: mccarthyRd,
  });
  assert.equal(ownedOnMccarthy.rentalPermissionState, "owned_vehicle_not_applicable");

  const gonorthOnMccarthy = evaluateRvCorridorCompliance({
    vehicle: { ownershipMode: "rental", rentalOperatorId: gonorth.operatorId },
    operator: gonorth,
    corridor: mccarthyRd,
  });
  assert.equal(gonorthOnMccarthy.rentalPermissionState, "caution_restricted");

  // Separation #3 & #4: Campground operation vs. site availability & park-wide amenities vs. selected site hookups/length
  const homerSpitCg = ALASKA_RV_CAMPGROUNDS.find((c) => c.campgroundId === "campground:homer-spit-campground")!;
  assert.equal(homerSpitCg.liveSiteInventoryState, "not_checked");
  assert.equal(homerSpitCg.campgroundWideAmenities.parkWideMaxRigLengthFeet, 40);

  const fhuTier = homerSpitCg.siteTiers.find((t) => t.siteTierId === "hsc-fhu-pull-through-40")!;
  const dryBeachTier = homerSpitCg.siteTiers.find((t) => t.siteTierId === "hsc-dry-beach-30")!;

  const rig34Ft = {
    lengthFeet: 34,
    combinedBumperToBumperLengthFeet: 34,
    towingConfiguration: "none" as const,
    electricalAmpService: 30 as const,
    hardSidedBearCompliant: true,
  };
  assert.equal(
    evaluateRvSiteCompatibility({ vehicle: rig34Ft, campground: homerSpitCg, siteTier: fhuTier }).state,
    "compatible",
  );
  assert.equal(
    evaluateRvSiteCompatibility({ vehicle: rig34Ft, campground: homerSpitCg, siteTier: dryBeachTier }).state,
    "incompatible",
    "34-ft rig fits Homer Spit Campground's 40-ft FHU row, but exceeds its 30-ft Dry Beach site tier!",
  );

  // Unknown vehicle length or unknown pad length stays needs_confirmation — never guessed!
  const russianRiver = ALASKA_RV_CAMPGROUNDS.find((c) => c.campgroundId === "campground:russian-river-campground")!;
  assert.equal(
    evaluateRvSiteCompatibility({
      vehicle: rig34Ft,
      campground: russianRiver,
      siteTier: russianRiver.siteTiers[0]!,
    }).state,
    "needs_confirmation",
  );
  assert.equal(
    evaluateRvSiteCompatibility({
      vehicle: { ...rig34Ft, lengthFeet: null, combinedBumperToBumperLengthFeet: null },
      campground: homerSpitCg,
      siteTier: fhuTier,
    }).state,
    "needs_confirmation",
  );

  // Separation #5: Estimated pure driving time vs. realistic RV travel day with stops
  assert.notEqual(sewardHwy.estimatedPureDrivingHoursRange, sewardHwy.realisticRvTravelDayHoursRange);
  for (const c of ALASKA_RV_HIGHWAY_CORRIDORS) {
    assert.ok(c.estimatedPureDrivingHoursRange.length > 0);
    assert.ok(c.realisticRvTravelDayHoursRange.length > 0);
    assert.notEqual(c.estimatedPureDrivingHoursRange, c.realisticRvTravelDayHoursRange);
  }

  // Separation #6: Suggested overnight location starts tentative, never confirmed
  assert.equal(ALASKA_RV_RECOMMENDED_9D_EXAMPLE_DAYS.length, 9);
  for (const day of ALASKA_RV_RECOMMENDED_9D_EXAMPLE_DAYS) {
    assert.equal(day.defaultConfirmationState, "tentative");
  }
  assert.ok(ALASKA_RV_SERVICE_STOPS.length >= 5);
  assert.ok(ALASKA_RV_ACTIVITIES.length >= 5);
  assert.ok(ALASKA_RV_UNRESOLVED_FACTS_LEDGER.length >= 5);
});

test("DCC Alaska RV Contract: ferry passenger ticket never establishes reserved RV vehicle deck space", () => {
  assert.equal(ALASKA_RV_FERRY_RULES.length, 1);

  const passengerOnly = evaluateRvFerryBookingReadiness({
    passengerTicketConfirmed: true,
    vehicleDeckSpaceConfirmed: false,
    actualRigCombinedLengthFeet: 25,
    actualRigHeightFeet: 11.5,
    actualRigWidthFeet: 8.3,
    bookedVehicleLengthFeet: null,
    bookedVehicleHeightFeet: null,
    bookedVehicleWidthFeet: null,
    departureTerminalLabel: "Whittier",
    arrivalTerminalLabel: "Cordova",
    checkInCutoffMinutesPrior: 180,
  });
  assert.equal(passengerOnly.status, "blocked_passenger_only_no_vehicle_space");

  const undersizedBooking = evaluateRvFerryBookingReadiness({
    passengerTicketConfirmed: true,
    vehicleDeckSpaceConfirmed: true,
    actualRigCombinedLengthFeet: 31,
    actualRigHeightFeet: 11.5,
    actualRigWidthFeet: 8.5,
    bookedVehicleLengthFeet: 25,
    bookedVehicleHeightFeet: 12,
    bookedVehicleWidthFeet: 8.5,
    departureTerminalLabel: "Whittier",
    arrivalTerminalLabel: "Kodiak",
    checkInCutoffMinutesPrior: 180,
  });
  assert.equal(undersizedBooking.status, "dimension_mismatch_risk");

  const validVehicleBooking = evaluateRvFerryBookingReadiness({
    passengerTicketConfirmed: true,
    vehicleDeckSpaceConfirmed: true,
    actualRigCombinedLengthFeet: 25,
    actualRigHeightFeet: 11.5,
    actualRigWidthFeet: 8.6,
    bookedVehicleLengthFeet: 26,
    bookedVehicleHeightFeet: 12,
    bookedVehicleWidthFeet: 8.6,
    departureTerminalLabel: "Homer",
    arrivalTerminalLabel: "Kodiak",
    checkInCutoffMinutesPrior: 180,
  });
  assert.equal(validVehicleBooking.status, "verified_vehicle_ready");
  assert.ok(validVehicleBooking.warnings.some((w) => w.includes("8 ft 6 in")));
});

test("DCC /api/v1/alaska/rv-pilot route: serves versioned snapshot, filters held operators by default, and returns ETag + noindex", async () => {
  const res = await getAlaskaRvPilot(new NextRequest("https://destinationcommandcenter.com/api/v1/alaska/rv-pilot"));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("X-DCC-Alaska-RV-Schema"), ALASKA_RV_CONTRACT_VERSION);
  assert.equal(res.headers.get("X-Robots-Tag"), "noindex, nofollow");
  const etag = res.headers.get("ETag");
  assert.ok(etag && etag.startsWith('"sha256-'));

  const json = (await res.json()) as {
    ok: boolean;
    rentalOperators: Array<{ operatorId: string; publicationStatus: string }>;
  };
  assert.equal(json.ok, true);
  assert.equal(
    json.rentalOperators.some((o) => o.operatorId === "operator:abc-motorhome-rentals"),
    false,
    "Held unreachable operator must be excluded when includeHeld is omitted",
  );

  const resWithHeld = await getAlaskaRvPilot(
    new NextRequest("https://destinationcommandcenter.com/api/v1/alaska/rv-pilot?includeHeld=1"),
  );
  const jsonWithHeld = (await resWithHeld.json()) as {
    rentalOperators: Array<{ operatorId: string }>;
  };
  assert.equal(
    jsonWithHeld.rentalOperators.some((o) => o.operatorId === "operator:abc-motorhome-rentals"),
    true,
  );

  const resNotModified = await getAlaskaRvPilot(
    new NextRequest("https://destinationcommandcenter.com/api/v1/alaska/rv-pilot", {
      headers: { "if-none-match": etag! },
    }),
  );
  assert.equal(resNotModified.status, 304);
});
