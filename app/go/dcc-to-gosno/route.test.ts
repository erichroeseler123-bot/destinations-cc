import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("DCC to GoSno handoff", () => {
  it("preserves known transfer context", async () => {
    const response = await GET(new Request("https://www.destinationcommandcenter.com/go/dcc-to-gosno?destination=breckenridge&airport=den&date=2026-12-20&party_size=5&vehicle_type=suv&source_page=%2Fguides%2Fdenver-to-breckenridge"));
    expect(response.status).toBe(302);
    const location = response.headers.get("location") || "";
    expect(location).toContain("https://gosno.co/handoff/dcc");
    expect(location).toContain("destination=breckenridge");
    expect(location).toContain("airport=DEN");
    expect(location).toContain("party_size=5");
    expect(location).toContain("vehicle_type=suv");
    expect(location).toContain("dcc_handoff_id=ho_");
  });
});
