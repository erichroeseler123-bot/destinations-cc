import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GET } from "./route";

describe("DCC to GoSno handoff", () => {
  it("preserves known transfer context for 1-6 passenger SUV handoff", async () => {
    const response = await GET(new Request("https://www.destinationcommandcenter.com/go/dcc-to-gosno?destination=breckenridge&airport=den&date=2026-12-20&party_size=5&vehicle_type=suv&source_page=%2Fguides%2Fdenver-to-breckenridge"));
    assert.equal(response.status, 302);
    const location = response.headers.get("location") || "";
    assert.ok(location.includes("https://gosno.co/handoff/dcc"));
    assert.ok(location.includes("destination=breckenridge"));
    assert.ok(location.includes("airport=DEN"));
    assert.ok(location.includes("party_size=5"));
    assert.ok(location.includes("vehicle_type=suv"));
    assert.ok(location.includes("dcc_handoff_id=ho_"));
  });

  it("permits 10 passengers in a private van with gear-fit and availability note", async () => {
    const response = await GET(new Request("https://www.destinationcommandcenter.com/go/dcc-to-gosno?destination=vail&airport=den&date=2026-12-20&party_size=10&vehicle_type=suv"));
    assert.equal(response.status, 302);
    const location = response.headers.get("location") || "";
    assert.ok(location.includes("https://gosno.co/handoff/dcc"));
    assert.ok(location.includes("destination=vail"));
    assert.ok(location.includes("airport=DEN"));
    assert.ok(location.includes("party_size=10"));
    assert.ok(location.includes("vehicle_type=van"));
    assert.ok(location.includes("fit_note=subject_to_luggage_and_ski_gear_fit_and_availability"));
  });

  it("rejects 11 passengers as ineligible for a single GoSno van and provides privateGroupInquiryOption", async () => {
    const response = await GET(new Request("https://www.destinationcommandcenter.com/go/dcc-to-gosno?destination=vail&airport=den&date=2026-12-20&party_size=11&vehicle_type=van"));
    assert.equal(response.status, 422);
    const body = await response.json();
    assert.equal(body.ok, false);
    assert.equal(body.eligible, false);
    assert.equal(body.maxAllowedPassengers, 10);
    assert.equal(body.requestedPassengers, 11);
    assert.ok(body.privateGroupInquiryOption);
    assert.equal(body.privateGroupInquiryOption.nextStep, "request a quote");
    assert.equal(
      body.privateGroupInquiryOption.confirmationPolicy,
      "GoSno confirms gear fit, availability, and one group total.",
    );
  });

  it("redirects 16-passenger private group inquiry to GoSno /request-quote with a van plus a Suburban suggestion", async () => {
    const response = await GET(new Request("https://www.destinationcommandcenter.com/go/dcc-to-gosno?destination=breckenridge&airport=den&date=2026-12-20&party_size=16&standardBags=16&skiBags=12&mode=group_inquiry"));
    assert.equal(response.status, 302);
    const location = response.headers.get("location") || "";
    const parsed = new URL(location);
    assert.equal(parsed.origin + parsed.pathname, "https://gosno.co/request-quote");
    assert.equal(parsed.searchParams.get("origin"), "DEN");
    assert.equal(parsed.searchParams.get("destination"), "Breckenridge");
    assert.equal(parsed.searchParams.get("outboundDate"), "2026-12-20");
    assert.equal(parsed.searchParams.get("passengers"), "16");
    assert.equal(parsed.searchParams.get("luggage"), "16 standard bags, 12 ski bags");
    assert.equal(
      parsed.searchParams.get("vehicleSuggestion"),
      "1 Private Passenger Van + 1 Private Chevrolet Suburban",
    );
    assert.ok(parsed.searchParams.get("click_id")?.startsWith("clk_"));
  });

  it("redirects 20-passenger private group inquiry to GoSno /request-quote with two vans suggestion", async () => {
    const response = await GET(new Request("https://www.destinationcommandcenter.com/go/dcc-to-gosno?destination=vail&airport=den&date=2026-12-22&party_size=20&standardBags=20&skiBags=16&mode=group_inquiry"));
    assert.equal(response.status, 302);
    const location = response.headers.get("location") || "";
    const parsed = new URL(location);
    assert.equal(parsed.origin + parsed.pathname, "https://gosno.co/request-quote");
    assert.equal(parsed.searchParams.get("origin"), "DEN");
    assert.equal(parsed.searchParams.get("destination"), "Vail");
    assert.equal(parsed.searchParams.get("outboundDate"), "2026-12-22");
    assert.equal(parsed.searchParams.get("passengers"), "20");
    assert.equal(parsed.searchParams.get("luggage"), "20 standard bags, 16 ski bags");
    assert.equal(
      parsed.searchParams.get("vehicleSuggestion"),
      "2 Private Passenger Vans",
    );
    assert.ok(parsed.searchParams.get("click_id")?.startsWith("clk_"));
  });

  it("reconciles Winter Park ($349 SUV / $499 Van), Steamboat ($599 SUV / $899 Van), and Big Sky ($299 Suburban only, no vans)", async () => {
    // Winter Park 16 passengers -> 1 Van ($499) + 1 Suburban ($349) = $848
    const wp16 = await GET(new Request("https://www.destinationcommandcenter.com/go/dcc-to-gosno?destination=winter-park&airport=den&date=2026-12-20&party_size=16&standardBags=16&skiBags=12"));
    assert.equal(wp16.status, 422);
    const wp16Body = await wp16.json();
    assert.equal(wp16Body.privateGroupInquiryOption.destination, "Winter Park");
    assert.equal(wp16Body.privateGroupInquiryOption.referenceCombinedOneWayUsd, 848);
    assert.equal(
      wp16Body.privateGroupInquiryOption.vehicleSuggestion.summaryLabel,
      "a van plus a Suburban",
    );

    // Steamboat Springs 20 passengers -> 2 Vans ($899 each) = $1,798
    const sb20 = await GET(new Request("https://www.destinationcommandcenter.com/go/dcc-to-gosno?destination=steamboat&airport=den&date=2026-12-22&party_size=20&standardBags=20&skiBags=16"));
    assert.equal(sb20.status, 422);
    const sb20Body = await sb20.json();
    assert.equal(sb20Body.privateGroupInquiryOption.destination, "Steamboat Springs");
    assert.equal(sb20Body.privateGroupInquiryOption.referenceCombinedOneWayUsd, 1798);
    assert.equal(
      sb20Body.privateGroupInquiryOption.vehicleSuggestion.summaryLabel,
      "two vans",
    );

    // Big Sky van request -> currently unavailable (Suburban only up to 6 pax)
    const bsVan = await GET(new Request("https://www.destinationcommandcenter.com/go/dcc-to-gosno?destination=big-sky&airport=bzn&date=2026-12-20&party_size=5&vehicle_type=van"));
    assert.equal(bsVan.status, 422);
    const bsVanBody = await bsVan.json();
    assert.equal(bsVanBody.status, "currently_unavailable");
    assert.equal(bsVanBody.nextStep, "currently unavailable");
    assert.equal(bsVanBody.maxAllowedPassengers, 6);

    // Big Sky 8 passengers -> exceeds 6-passenger Suburban limit, offers 2 Suburbans ($598 reference)
    const bs8 = await GET(new Request("https://www.destinationcommandcenter.com/go/dcc-to-gosno?destination=big-sky&airport=bzn&date=2026-12-20&party_size=8&standardBags=8&skiBags=6"));
    assert.equal(bs8.status, 422);
    const bs8Body = await bs8.json();
    assert.equal(bs8Body.maxAllowedPassengers, 6);
    assert.equal(bs8Body.privateGroupInquiryOption.origin, "BZN");
    assert.equal(bs8Body.privateGroupInquiryOption.referenceCombinedOneWayUsd, 598);
    assert.equal(
      bs8Body.privateGroupInquiryOption.vehicleSuggestion.shortLabel,
      "2 Private Chevrolet Suburbans (up to 6 passengers each)",
    );
  });

  it("uses shared GoSno handoff builder to preserve Winter Park round-trip details in ledger and strip PII", async () => {
    const { getOpaqueClickAttributionById } = await import(
      "@/lib/dcc/commerce/opaqueAttributionLedger"
    );
    const response = await GET(
      new Request(
        "https://www.destinationcommandcenter.com/go/dcc-to-gosno?destination=winter-park&airport=den&direction=ROUND_TRIP&date=2026-12-20&pickupTime=10:30&returnDate=2026-12-27&returnPickupTime=08:00&party_size=4&standardBags=4&skiBags=4&vehicle_type=suv&originatingPage=%2Ftransportation%2Fcolorado&email=test%40example.com&phone=303-555-0100&isTest=1",
      ),
    );
    assert.equal(response.status, 302);
    const location = response.headers.get("location") || "";
    const parsed = new URL(location);
    assert.equal(parsed.searchParams.get("direction"), "ROUND_TRIP");
    assert.equal(parsed.searchParams.get("tripType"), "round_trip");
    assert.equal(parsed.searchParams.get("routeId"), "DEN-WINTER-PARK-ROUND-TRIP");
    assert.equal(parsed.searchParams.get("offerId"), "DEN-WINTER-PARK-ROUND-TRIP-SUV");
    assert.equal(parsed.searchParams.get("returnRouteId"), "WINTER-PARK-DEN");
    assert.equal(parsed.searchParams.get("pickupTime"), "10:30");
    assert.equal(parsed.searchParams.get("returnDate"), "2026-12-27");
    assert.equal(parsed.searchParams.get("returnPickupTime"), "08:00");
    assert.equal(parsed.searchParams.get("standardBags"), "4");
    assert.equal(parsed.searchParams.get("skiBags"), "4");
    assert.equal(parsed.searchParams.get("email"), null);
    assert.equal(parsed.searchParams.get("phone"), null);

    const clickId = parsed.searchParams.get("click_id");
    assert.ok(clickId);
    const record = getOpaqueClickAttributionById(clickId!);
    assert.ok(record);
    assert.equal(record.isTest, true);
    assert.equal(record.trafficClass, "test");
    assert.equal(record.tripDetails?.direction, "ROUND_TRIP");
    assert.equal(record.tripDetails?.destination, "Winter Park");
    assert.equal(record.tripDetails?.routeId, "DEN-WINTER-PARK-ROUND-TRIP");
    assert.equal(record.tripDetails?.returnDate, "2026-12-27");
    assert.ok(record.strippedPiiParams?.includes("email"));
    assert.ok(record.strippedPiiParams?.includes("phone"));
  });
});

