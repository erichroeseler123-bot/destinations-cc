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
});
