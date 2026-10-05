import { GET as getProducts } from "../app/api/viator/products/route";
import { GET as getReviews } from "../app/api/viator/reviews/[productCode]/route";
import robotsConfig from "../app/robots";
import { buildViatorBookingUrlWithPreferences } from "../lib/viator/clientBridge";

async function runViatorBridgeTest() {
  console.log("========================================================================");
  console.log("🧪 TESTING VIATOR CLIENT BRIDGE, SNAPSHOT TRANSPARENCY & COMPLIANCE");
  console.log("========================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      if (detail) console.error(`     Detail: ${detail}`);
      failed++;
    }
  }

  // 1. Basic Fetch & Status Metadata
  {
    const req = new Request("http://localhost/api/viator/products");
    const res = await getProducts(req);
    const data = await res.json();

    assert(res.status === 200, "API returns HTTP 200");
    assert(data.ok === true, "Response payload has ok: true");
    assert(typeof data.isLive === "boolean", "Response explicitly reports boolean isLive");
    assert(
      data.status === "live_verified" || data.status === "cached_snapshot",
      `Response status honestly marked: ${data.status}`
    );
    assert(Array.isArray(data.products) && data.products.length > 0, "Returns non-empty products array");
    assert(
      data.attribution?.source.includes("Tripadvisor") && data.attribution?.poweredBy === "Viator",
      "Mandatory Viator and Tripadvisor attribution included"
    );
  }

  // 2. Fallback Accuracy & Timestamp Transparency
  {
    const req = new Request("http://localhost/api/viator/products");
    const res = await getProducts(req);
    const data = await res.json();
    const first = data.products[0];

    assert(Boolean(first.dataTimestamp), `Product has explicit dataTimestamp: ${first.dataTimestamp}`);
    assert(first.imageSource === "SUPPLIER_PROVIDED", "Image tagged strictly as SUPPLIER_PROVIDED");
    assert(
      first.imageUrl.includes("tripadvisor.com"),
      `Supplier image served from TripAdvisor/Viator CDN: ${first.imageUrl}`
    );

    if (!data.isLive) {
      assert(
        Boolean(data.snapshotTimestamp),
        `Snapshot timestamp explicitly reported when not live: ${data.snapshotTimestamp}`
      );
      assert(
        Boolean(first.priceDisclaimer?.includes("snapshot")),
        "Historical prices include disclaimer explaining they are from a snapshot"
      );
    }
  }

  // 3. Commission Tracking Preservation
  {
    const req = new Request("http://localhost/api/viator/products");
    const res = await getProducts(req);
    const data = await res.json();
    const first = data.products[0];

    assert(first.bookHref.includes("viator.com"), "Booking link points to viator.com");
    assert(
      first.bookHref.includes("pid=") || first.bookHref.includes("utm_source=") || first.bookHref.includes("mcid="),
      `Tracking parameters preserved in API bookHref: ${first.bookHref}`
    );

    const enrichedUrl = buildViatorBookingUrlWithPreferences(first.bookHref, "2027-07-15", 3);
    assert(
      enrichedUrl.includes("startDate=2027-07-15") && enrichedUrl.includes("numTravelers=3"),
      "Enriched booking URL safely appends date and passenger count"
    );
    assert(
      (enrichedUrl.includes("pid=") || enrichedUrl.includes("utm_source=")) && enrichedUrl.includes("mcid="),
      "Enriched booking URL preserves all original affiliate tracking parameters intact"
    );
  }

  // 4. Protected Reviews & Traveler Photos Endpoint (Phase 2 Compliance)
  {
    const paramsPromise = Promise.resolve({ productCode: "10423P1" });
    const req = new Request("http://localhost/api/viator/reviews/10423P1");
    const res = await getReviews(req, { params: paramsPromise });
    const data = await res.json();

    assert(res.status === 200, "Protected reviews endpoint returns HTTP 200");
    const robotsTag = res.headers.get("X-Robots-Tag") || "";
    assert(
      robotsTag.includes("noindex") && robotsTag.includes("nofollow"),
      `Protected review response includes X-Robots-Tag noindex: '${robotsTag}'`
    );
    assert(
      data.attribution.includes("Viator and Tripadvisor"),
      "Reviews include explicit Viator/Tripadvisor attribution"
    );
    assert(Array.isArray(data.reviews) && data.reviews.length > 0, "Reviews array populated on demand");
    const reviewWithPhoto = data.reviews.find((r: any) => r.travelerPhotos && r.travelerPhotos.length > 0);
    assert(
      Boolean(reviewWithPhoto),
      "Traveler photos are kept attached strictly in context with traveler reviews"
    );
  }

  // 5. Robots.txt Compliance Check
  {
    const robots = robotsConfig();
    const rules = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
    const disallow = Array.isArray(rules?.disallow) ? rules.disallow : [rules?.disallow];

    assert(
      disallow.includes("/api/viator/reviews/"),
      "robots.txt explicitly disallows /api/viator/reviews/ to protect Viator unique content"
    );
  }

  // 6. Tour Type Filtering & Date Signals
  {
    const req = new Request("http://localhost/api/viator/products?tourType=dog_sledding&pax=4&date=2027-07-14");
    const res = await getProducts(req);
    const data = await res.json();

    assert(
      data.products.every((p: any) => p.tourType === "dog_sledding"),
      "Filtering by tourType=dog_sledding returns only dog sledding tours"
    );
    assert(data.passengerCount === 4, "Echoes passenger count of 4");
    assert(data.signals?.availabilityStatus === "calendar_check_required", "Honest availability status requires calendar check");
  }

  console.log("\n========================================================================");
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================================");

  if (failed > 0) process.exit(1);
}

runViatorBridgeTest().catch((err) => {
  console.error("Test failed with exception:", err);
  process.exit(1);
});
