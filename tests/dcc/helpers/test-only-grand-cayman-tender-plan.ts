import type { ShareableWinterSailingDefinition } from "../../../lib/dcc/winterExcursionPlanner";

/**
 * TEST-ONLY FIXTURE. This is not a real sailing and is never registered as a plan code.
 *
 * No registered winter sailing plan calls at Grand Cayman (WESTERN-2027-01-24 is Symphony of the
 * Seas from Galveston: Roatán, Costa Maya, Cozumel). The tender-port rules (45-minute tender
 * clearance, last-tender gating of checkout) still need coverage, so tests evaluate this fixture
 * through evaluateWinterSailingPlan({ planDefinition }).
 *
 * The Grand Cayman call window mirrors the planner's grand-cayman port spec defaults
 * (07:30–16:00, all-aboard 15:00, last tender 14:45); the saved tour is the spec's featured
 * catalog product 10309P3 / TG1.
 */
export const TEST_ONLY_GRAND_CAYMAN_TENDER_PLAN: ShareableWinterSailingDefinition = {
  planCode: "TEST-FIXTURE-GRAND-CAYMAN-TENDER",
  sailingId: "test-fixture-grand-cayman-tender",
  cruiseLine: "Test Fixture Line",
  shipName: "Test Fixture Ship",
  shipSlug: "test-fixture-ship",
  itineraryTitle: "Test fixture: one Grand Cayman tender call",
  sailDate: "2027-01-24",
  returnDate: "2027-01-31",
  durationNights: 7,
  embarkationPort: "Test fixture port",
  officialCruiseLineItineraryUrl: "https://example.test/fixture-itinerary",
  cruisePromenadeShareUrl: "https://example.test/p/TEST-FIXTURE-GRAND-CAYMAN-TENDER",
  dccShareUrl: "https://example.test/cruises/winter-excursion-planner?plan=TEST-FIXTURE-GRAND-CAYMAN-TENDER",
  defaultAdults: 2,
  defaultChildAges: [],
  placementId: "fp-cp-winter-excursion-planner",
  itineraryDays: [
    {
      dayNumber: 5,
      date: "2027-01-28",
      stopType: "port",
      portSlug: "grand-cayman",
      portLabel: "George Town, Grand Cayman (test fixture)",
      dockOrTender: "tender",
      arrivalTime: "07:30",
      departureTime: "16:00",
      allAboardTime: "15:00",
      lastTenderTime: "14:45",
      savedTourId: "dcc:tour:viator:10309P3",
      savedOptionCode: "TG1",
      notes: "Test fixture tender call.",
    },
  ],
  savedExcursionsByPort: {
    "grand-cayman": {
      tourId: "dcc:tour:viator:10309P3",
      providerProductCode: "10309P3",
      optionCode: "TG1",
      date: "2027-01-28",
      arrivalTime: "07:30",
      departureTime: "16:00",
      allAboardTime: "15:00",
      lastTenderTime: "14:45",
    },
  },
};
