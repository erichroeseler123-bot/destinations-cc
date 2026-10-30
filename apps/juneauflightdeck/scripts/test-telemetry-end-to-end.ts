import { recordTelemetryEvent, getTelemetrySummary, getRecentTelemetryEvents } from '../lib/telemetryStore';

console.log("=== Testing JFD Telemetry Pipeline End-to-End ===\n");

// 1. Simulate page views
console.log("1. Simulating Page Views...");
recordTelemetryEvent({
  site: "juneau-flight-deck",
  eventName: "page_viewed",
  sessionId: "test_session_user_1",
  sourcePage: "/temsco-vs-coastal-vs-northstar-juneau",
  landingPath: "/temsco-vs-coastal-vs-northstar-juneau",
});

recordTelemetryEvent({
  site: "juneau-flight-deck",
  eventName: "page_viewed",
  sessionId: "test_session_user_2",
  sourcePage: "/helicopter",
  landingPath: "/helicopter",
});

// 2. Simulate Booking Clicks across different tours & pages
console.log("2. Simulating Outbound Booking Clicks...");

// Click A: TEMSCO Glacier Walk from Comparison Page
recordTelemetryEvent({
  site: "juneau-flight-deck",
  eventName: "booking_clicked",
  sessionId: "test_session_user_1",
  sourcePage: "/temsco-vs-coastal-vs-northstar-juneau",
  landingPath: "/temsco-vs-coastal-vs-northstar-juneau",
  targetPath: "https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+Mendenhall+Glacier+Walk&pid=P00058396&mcid=42383&medium=api",
  outcome: {
    provider: "viator",
    tourSlug: "temsco-mendenhall-glacier-walk",
    tourName: "TEMSCO Mendenhall Glacier Walk",
    targetUrl: "https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+Mendenhall+Glacier+Walk&pid=P00058396&mcid=42383&medium=api",
    anchorText: "🛡️ Check TEMSCO Walk on Viator ↗",
  },
});

// Click B: Coastal Icefield Walk (6251SHOREXICEWALK) from Comparison Page
recordTelemetryEvent({
  site: "juneau-flight-deck",
  eventName: "booking_clicked",
  sessionId: "test_session_user_1",
  sourcePage: "/temsco-vs-coastal-vs-northstar-juneau",
  landingPath: "/temsco-vs-coastal-vs-northstar-juneau",
  targetPath: "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK?pid=P00058396&mcid=42383&medium=api",
  outcome: {
    provider: "viator",
    tourSlug: "coastal-icefield-walk",
    tourName: "Juneau Shore Excursion Helicopter Tour and Guided Icefield Walk",
    targetUrl: "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK?pid=P00058396&mcid=42383&medium=api",
    anchorText: "🛡️ Book Coastal Icefield Walk on Viator (6251SHOREXICEWALK) ↗",
  },
});

// Click C: NorthStar Walkabout from Comparison Page
recordTelemetryEvent({
  site: "juneau-flight-deck",
  eventName: "booking_clicked",
  sessionId: "test_session_user_2",
  sourcePage: "/temsco-vs-coastal-vs-northstar-juneau",
  landingPath: "/temsco-vs-coastal-vs-northstar-juneau",
  targetPath: "https://www.viator.com/searchResults/all?text=Juneau+NorthStar+Glacier+Walkabout&pid=P00058396&mcid=42383&medium=api",
  outcome: {
    provider: "viator",
    tourSlug: "northstar-glacier-walkabout",
    tourName: "NorthStar Glacier Walkabout",
    targetUrl: "https://www.viator.com/searchResults/all?text=Juneau+NorthStar+Glacier+Walkabout&pid=P00058396&mcid=42383&medium=api",
    anchorText: "🛡️ Check NorthStar Walkabout on Viator ↗",
  },
});

// Click D: Search on Viator from Comparison Page
recordTelemetryEvent({
  site: "juneau-flight-deck",
  eventName: "booking_clicked",
  sessionId: "test_session_user_3",
  sourcePage: "/temsco-vs-coastal-vs-northstar-juneau",
  landingPath: "/temsco-vs-coastal-vs-northstar-juneau",
  targetPath: "https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+Helicopters&pid=P00058396&mcid=42383&medium=api",
  outcome: {
    provider: "viator",
    tourSlug: "viator-temsco-search",
    tourName: "Viator TEMSCO Tours Search",
    targetUrl: "https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+Helicopters&pid=P00058396&mcid=42383&medium=api",
    anchorText: "Search on Viator →",
  },
});

// Click E: Viator from /helicopter hub
recordTelemetryEvent({
  site: "juneau-flight-deck",
  eventName: "booking_clicked",
  sessionId: "test_session_user_4",
  sourcePage: "/helicopter",
  landingPath: "/helicopter",
  targetPath: "https://www.viator.com/searchResults/all?text=Coastal+Helicopters+Juneau&pid=P00058396&mcid=42383&medium=api",
  outcome: {
    provider: "viator",
    tourSlug: "viator-coastal-search",
    tourName: "Viator Coastal Tours Search",
    targetUrl: "https://www.viator.com/searchResults/all?text=Coastal+Helicopters+Juneau&pid=P00058396&mcid=42383&medium=api",
    anchorText: "Search on Viator →",
  },
});

// 3. Simulate Waitlist Submissions
console.log("3. Simulating Waitlist Submissions...");
recordTelemetryEvent({
  site: "juneau-flight-deck",
  eventName: "waitlist_submitted",
  sessionId: "test_session_user_1",
  sourcePage: "/helicopter-waitlist",
  landingPath: "/helicopter-waitlist",
  outcome: {
    submissionId: "JFD-SCAN-TEST-001",
    tourType: "dog_sledding",
    partySize: 2,
    portDate: "2027-07-15",
    bookingMode: "instant_alert",
    shipName: "Discovery Princess",
    cruiseLine: "Princess Cruises",
    portCity: "juneau",
    estimatedValue: 1298,
  },
});

recordTelemetryEvent({
  site: "juneau-flight-deck",
  eventName: "waitlist_submitted",
  sessionId: "test_session_user_2",
  sourcePage: "/temsco-vs-coastal-vs-northstar-juneau",
  landingPath: "/temsco-vs-coastal-vs-northstar-juneau",
  outcome: {
    submissionId: "JFD-SCAN-TEST-002",
    tourType: "glacier_landing",
    partySize: 4,
    portDate: "2027-07-22",
    bookingMode: "concierge_dispatch",
    shipName: "Royal Princess",
    cruiseLine: "Princess Cruises",
    portCity: "juneau",
    estimatedValue: 1796,
  },
});

// 4. Validate Summary Calculations
console.log("4. Verifying Telemetry Summary Calculation...");
const summary = getTelemetrySummary();
console.log("\n--- Telemetry Summary Output ---");
console.log(JSON.stringify(summary, null, 2));

console.log("\n--- Recent Events (Top 3) ---");
const recent = getRecentTelemetryEvents(3);
console.log(JSON.stringify(recent, null, 2));

// Assertions
if (summary.bookingClicks.total !== 5) {
  throw new Error(`Expected 5 booking clicks, got ${summary.bookingClicks.total}`);
}
if (summary.waitlistSubmissions.total !== 2) {
  throw new Error(`Expected 2 waitlist submissions, got ${summary.waitlistSubmissions.total}`);
}
if (summary.pageViews.total !== 2) {
  throw new Error(`Expected 2 page views, got ${summary.pageViews.total}`);
}
if (!summary.bookingClicks.byTour["temsco-mendenhall-glacier-walk"]) {
  throw new Error("Missing temsco-mendenhall-glacier-walk in booking clicks by tour");
}
if (!summary.bookingClicks.byProvider["viator"]) {
  throw new Error("Missing viator provider breakdown");
}

console.log("\n✅ All Telemetry Pipeline Assertions Passed Successfully!");
