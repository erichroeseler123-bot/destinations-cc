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

  it("rejects 11 passengers as ineligible for a single GoSno van", async () => {
    const response = await GET(new Request("https://www.destinationcommandcenter.com/go/dcc-to-gosno?destination=vail&airport=den&date=2026-12-20&party_size=11&vehicle_type=van"));
    assert.equal(response.status, 422);
    const body = await response.json();
    assert.equal(body.ok, false);
    assert.equal(body.eligible, false);
    assert.equal(body.maxAllowedPassengers, 10);
    assert.equal(body.requestedPassengers, 11);
  });
});
