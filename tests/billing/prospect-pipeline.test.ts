import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

test("Prospect Pipeline Research & Verification Integrity", async (t) => {
  const pipelinePath = path.join(process.cwd(), "data", "sales", "50-venue-prospect-pipeline.json");
  assert.ok(fs.existsSync(pipelinePath), "Pipeline JSON file must exist");

  const raw = fs.readFileSync(pipelinePath, "utf8");
  const data = JSON.parse(raw);

  assert.equal(data.totalProspects, 50, "Pipeline must contain exactly 50 prospects");
  assert.equal(data.verifiedProspects, 50, "All 50 prospects must be verified");
  assert.equal(data.prospects.length, 50, "Prospects array length must be 50");

  const seenIds = new Set<string>();
  const seenWebsites = new Set<string>();

  for (const prospect of data.prospects) {
    // 1. Uniqueness
    assert.ok(!seenIds.has(prospect.id), `Duplicate prospect id: ${prospect.id}`);
    seenIds.add(prospect.id);

    // 2. Verification Status
    assert.equal(prospect.verificationStatus, "verified", `Prospect ${prospect.id} must be verified`);
    assert.ok(prospect.verifiedAt, `Prospect ${prospect.id} must have verifiedAt timestamp`);

    // 3. Physical Address & Coordinates
    assert.ok(prospect.physicalAddress && prospect.physicalAddress.length > 5, `Prospect ${prospect.id} missing physical address`);
    assert.ok(prospect.coordinateSource && prospect.coordinateSource.length > 5, `Prospect ${prospect.id} missing coordinate source`);
    assert.ok(prospect.lat >= -90 && prospect.lat <= 90, `Prospect ${prospect.id} has invalid lat: ${prospect.lat}`);
    assert.ok(prospect.lng >= -180 && prospect.lng <= 180, `Prospect ${prospect.id} has invalid lng: ${prospect.lng}`);

    // 4. Contact Channels & Proof URLs
    assert.ok(prospect.website.startsWith("https://") || prospect.website.startsWith("http://"), `Invalid website URL: ${prospect.website}`);
    assert.ok(prospect.contactPageUrl.startsWith("https://") || prospect.contactPageUrl.startsWith("http://"), `Invalid contactPageUrl: ${prospect.contactPageUrl}`);
    assert.ok(prospect.contactChannel && (prospect.contactChannel.includes("@") || prospect.contactChannel.startsWith("http")), `Invalid contactChannel: ${prospect.contactChannel}`);
    assert.ok(prospect.phone && prospect.phone.length >= 10, `Missing or invalid phone for ${prospect.id}: ${prospect.phone}`);
    assert.ok(prospect.contactTitle, `Missing contactTitle for ${prospect.id}`);

    // 5. Customized Live Demo URL
    assert.ok(prospect.demoUrl.startsWith("https://destinationcommandcenter.com/embed/v1/"), `Demo URL must target /embed/v1/ for ${prospect.id}`);
    assert.ok(prospect.demoUrl.includes(prospect.lat.toFixed(5)), `Demo URL must include exact lat for ${prospect.id}`);
    assert.ok(prospect.demoUrl.includes(prospect.lng.toFixed(5)), `Demo URL must include exact lng for ${prospect.id}`);
    assert.ok(prospect.demoUrl.includes("modules="), `Demo URL must specify modules for ${prospect.id}`);

    // 6. Pitch & Operational Context
    assert.ok(prospect.keyHook && prospect.keyHook.length > 10, `Missing keyHook for ${prospect.id}`);
    assert.ok(prospect.operationalPainPoint && prospect.operationalPainPoint.length > 10, `Missing operationalPainPoint for ${prospect.id}`);
  }

  // Vertical Coverage
  const categories = new Set(data.prospects.map((p: any) => p.category));
  assert.ok(categories.has("Whitewater & Rafting"), "Must include Whitewater & Rafting");
  assert.ok(categories.has("Outdoor Amphitheater"), "Must include Outdoor Amphitheater");
  assert.ok(categories.has("Mountain Wedding Ranch"), "Must include Mountain Wedding Ranch");
  assert.ok(categories.has("Marina & Boat Rentals") || categories.has("Marine Tour Operator"), "Must include Marinas/Marine Tours");
});
