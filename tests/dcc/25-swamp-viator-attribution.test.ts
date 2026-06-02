import test from "node:test";
import assert from "node:assert/strict";
import { buildAttributedSwampProductHref } from "@/app/api/public/swamp-products-viator/route";

test("New Orleans swamp product Viator hrefs receive attribution and preserve existing params", () => {
  const previous = {
    pid: process.env.NEXT_PUBLIC_VIATOR_PID,
    mcid: process.env.NEXT_PUBLIC_VIATOR_MCID,
    campaign: process.env.NEXT_PUBLIC_VIATOR_CAMPAIGN,
    utmSource: process.env.NEXT_PUBLIC_VIATOR_UTM_SOURCE,
    utmMedium: process.env.NEXT_PUBLIC_VIATOR_UTM_MEDIUM,
    utmCampaign: process.env.NEXT_PUBLIC_VIATOR_UTM_CAMPAIGN,
  };

  process.env.NEXT_PUBLIC_VIATOR_PID = "TEST_PID";
  process.env.NEXT_PUBLIC_VIATOR_MCID = "TEST_MCID";
  process.env.NEXT_PUBLIC_VIATOR_CAMPAIGN = "default-campaign";
  process.env.NEXT_PUBLIC_VIATOR_UTM_SOURCE = "dcc-test";
  process.env.NEXT_PUBLIC_VIATOR_UTM_MEDIUM = "affiliate-test";
  process.env.NEXT_PUBLIC_VIATOR_UTM_CAMPAIGN = "dcc-test-campaign";

  try {
    const rawHref =
      "https://www.viator.com/tours/New-Orleans/Swamp-Airboat-Tour/d675-12345P1?existing=keep";
    const attributedHref = buildAttributedSwampProductHref({
      productUrl: rawHref,
      productCode: "12345P1",
      currency: "USD",
    });
    const parsed = new URL(attributedHref);

    assert.notEqual(attributedHref, rawHref);
    assert.equal(parsed.hostname, "www.viator.com");
    assert.equal(parsed.searchParams.get("existing"), "keep");
    assert.equal(parsed.searchParams.get("pid"), "TEST_PID");
    assert.equal(parsed.searchParams.get("mcid"), "TEST_MCID");
    assert.equal(parsed.searchParams.get("medium"), "api");
    assert.equal(parsed.searchParams.get("campaign"), "new-orleans-swamp-tours-12345p1");
    assert.equal(parsed.searchParams.get("utm_source"), "dcc-test");
    assert.equal(parsed.searchParams.get("utm_medium"), "affiliate-test");
    assert.equal(parsed.searchParams.get("utm_campaign"), "dcc-test-campaign");
    assert.equal(parsed.searchParams.get("locale"), "en-US");
    assert.equal(parsed.searchParams.get("currencyCode"), "USD");
  } finally {
    restoreEnv("NEXT_PUBLIC_VIATOR_PID", previous.pid);
    restoreEnv("NEXT_PUBLIC_VIATOR_MCID", previous.mcid);
    restoreEnv("NEXT_PUBLIC_VIATOR_CAMPAIGN", previous.campaign);
    restoreEnv("NEXT_PUBLIC_VIATOR_UTM_SOURCE", previous.utmSource);
    restoreEnv("NEXT_PUBLIC_VIATOR_UTM_MEDIUM", previous.utmMedium);
    restoreEnv("NEXT_PUBLIC_VIATOR_UTM_CAMPAIGN", previous.utmCampaign);
  }
});

function restoreEnv(key: string, value: string | undefined) {
  if (typeof value === "string") {
    process.env[key] = value;
    return;
  }
  delete process.env[key];
}
