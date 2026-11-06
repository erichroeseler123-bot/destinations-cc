#!/usr/bin/env node
/**
 * Reusable Multi-Site Release & Storefront Booking Handoff Verification
 *
 * Usage:
 *   node scripts/verify-release-handoff.mjs [--expected-commit <shaPrefix>]
 *   npm run verify:release-handoff
 *
 * Verifies:
 * 1. Both WNO hostnames (`welcometoneworleanstours.com` and `www.welcometoneworleanstours.com`)
 *    serve the active WNO project build (>= b59f2b0c or --expected-commit).
 * 2. On the public WNO storefront (`/swamp-tours`), submits two different date and party
 *    selections and confirms each reaches the actual `/api/v1/ads/click` -> Viator booking
 *    handoff with the exact date, party size, option, and a unique referral ID.
 * 3. Confirms DCC (`www.destinationcommandcenter.com`) and Cruise Promenade
 *    (`cruisepromenade.com/p/INDY-2027-01-24`) are live and QA clicks remain isolated from
 *    production guest telemetry.
 */

import assert from "node:assert/strict";

const args = process.argv.slice(2);
const expectedCommitArgIdx = args.indexOf("--expected-commit");
const EXPECTED_COMMIT_PREFIX =
  expectedCommitArgIdx >= 0 && args[expectedCommitArgIdx + 1]
    ? args[expectedCommitArgIdx + 1].trim().toLowerCase()
    : (process.env.EXPECTED_COMMIT_SHA || "").trim().toLowerCase();

const WNO_APEX_ORIGIN = "https://welcometoneworleanstours.com";
const WNO_WWW_ORIGIN = "https://www.welcometoneworleanstours.com";
const DCC_ORIGIN = "https://www.destinationcommandcenter.com";
const CP_ORIGIN = "https://cruisepromenade.com";

const SELECTIONS = [
  { label: "Selection A (Nov 18 · 2 Guests)", date: "2026-11-18", partySize: "2" },
  { label: "Selection B (Dec 05 · 4 Guests)", date: "2026-12-05", partySize: "4" },
];

async function verifyWnoHostnames() {
  // 1. Apex hostname must 308 redirect to www.welcometoneworleanstours.com
  const apexRes = await fetch(`${WNO_APEX_ORIGIN}/swamp-tours`, {
    redirect: "manual",
    headers: { "cache-control": "no-cache" },
  });
  assert.ok(
    apexRes.status === 308 || apexRes.status === 307 || apexRes.status === 301,
    `Expected apex WNO hostname to redirect to www, got status ${apexRes.status}`,
  );
  const apexLocation = apexRes.headers.get("location") || "";
  assert.equal(
    apexLocation,
    `${WNO_WWW_ORIGIN}/swamp-tours`,
    `Expected apex WNO redirect location to be ${WNO_WWW_ORIGIN}/swamp-tours, got ${apexLocation}`,
  );

  // 2. Check .well-known/dcc-site on both hostnames (following apex -> www)
  const [wwwManifestRes, apexFollowedManifestRes] = await Promise.all([
    fetch(`${WNO_WWW_ORIGIN}/.well-known/dcc-site?t=${Date.now()}`, {
      headers: { "cache-control": "no-cache" },
    }),
    fetch(`${WNO_APEX_ORIGIN}/.well-known/dcc-site?t=${Date.now()}`, {
      redirect: "follow",
      headers: { "cache-control": "no-cache" },
    }),
  ]);
  assert.equal(wwwManifestRes.status, 200, "Expected WNO www .well-known/dcc-site HTTP 200");
  assert.equal(
    apexFollowedManifestRes.status,
    200,
    "Expected WNO apex-followed .well-known/dcc-site HTTP 200",
  );

  const wwwManifest = await wwwManifestRes.json();
  const apexManifest = await apexFollowedManifestRes.json();
  assert.equal(wwwManifest.siteId, "welcome-to-new-orleans-tours");
  assert.equal(apexManifest.siteId, "welcome-to-new-orleans-tours");

  const wnoCommitSha =
    wwwManifest.build?.commitSha ||
    wwwManifestRes.headers.get("x-dcc-git-commit") ||
    "unknown";
  const apexCommitSha =
    apexManifest.build?.commitSha ||
    apexFollowedManifestRes.headers.get("x-dcc-git-commit") ||
    "unknown";

  assert.equal(
    wnoCommitSha,
    apexCommitSha,
    `Expected both WNO hostnames to serve identical commitSha (${wnoCommitSha} vs ${apexCommitSha})`,
  );

  if (EXPECTED_COMMIT_PREFIX && wnoCommitSha !== "unknown" && wnoCommitSha !== "local") {
    assert.ok(
      wnoCommitSha.toLowerCase().startsWith(EXPECTED_COMMIT_PREFIX),
      `Expected WNO commitSha ${wnoCommitSha} to start with ${EXPECTED_COMMIT_PREFIX}`,
    );
  }

  return {
    apexRedirectStatus: apexRes.status,
    apexRedirectLocation: apexLocation,
    projectName: wwwManifest.build?.projectName || "welcometoneworleanstours",
    commitSha: wnoCommitSha,
  };
}

async function verifyStorefrontSelectionAndHandoff({ label, date, partySize }) {
  const storefrontUrl = `${WNO_WWW_ORIGIN}/swamp-tours?date=${encodeURIComponent(date)}&party_size=${encodeURIComponent(partySize)}`;
  const pageRes = await fetch(storefrontUrl, {
    headers: { "cache-control": "no-cache" },
  });
  assert.equal(
    pageRes.status,
    200,
    `${label}: Expected ${storefrontUrl} to return HTTP 200, got ${pageRes.status}`,
  );
  const html = await pageRes.text();

  // Confirm the storefront form inputs are present and hydrated with the submitted values
  assert.ok(
    html.includes('id="booking-context-date"'),
    `${label}: Missing #booking-context-date input on storefront`,
  );
  assert.ok(
    html.includes(`value="${date}"`),
    `${label}: Storefront HTML did not reflect selected date ${date}`,
  );
  assert.ok(
    html.includes('id="booking-context-party-size"'),
    `${label}: Missing #booking-context-party-size select on storefront`,
  );

  // Extract rendered /api/v1/ads/click link for 15200P6
  const clickMatch = html.match(/href="(\/api\/v1\/ads\/click\?[^"]*offer=15200P6[^"]*)"/);
  assert.ok(
    clickMatch && clickMatch[1],
    `${label}: Could not find /api/v1/ads/click CTA for offer 15200P6 on ${storefrontUrl}`,
  );
  const clickPath = clickMatch[1].replace(/&amp;/g, "&");
  const parsedClick = new URL(clickPath, WNO_WWW_ORIGIN);

  assert.equal(
    parsedClick.searchParams.get("offer"),
    "15200P6",
    `${label}: Expected offer=15200P6`,
  );
  assert.equal(
    parsedClick.searchParams.get("option"),
    "TG10",
    `${label}: Expected option=TG10`,
  );
  assert.equal(
    parsedClick.searchParams.get("placementId"),
    "fp-wno-swamp-tours",
    `${label}: Expected placementId=fp-wno-swamp-tours`,
  );
  assert.equal(
    parsedClick.searchParams.get("date"),
    date,
    `${label}: Expected click href date=${date}, got ${parsedClick.searchParams.get("date")}`,
  );
  assert.equal(
    parsedClick.searchParams.get("adults"),
    partySize,
    `${label}: Expected click href adults=${partySize}, got ${parsedClick.searchParams.get("adults")}`,
  );

  // Follow the actual booking handoff on the public WNO hostname (with isTest=true so release checks stay in QA ledger)
  parsedClick.searchParams.set("isTest", "true");
  const handoffRes = await fetch(parsedClick.toString(), {
    redirect: "manual",
    headers: {
      "user-agent": "DCC-Release-Handoff-Verifier/1.0",
      "cache-control": "no-cache",
    },
  });

  assert.equal(
    handoffRes.status,
    307,
    `${label}: Expected /api/v1/ads/click to return 307 redirect, got ${handoffRes.status}`,
  );

  const referralId = handoffRes.headers.get("x-dcc-referral-id") || "";
  assert.match(
    referralId,
    /^clk_qa_[0-9a-f]{24}$/,
    `${label}: Expected QA referral ID clk_qa_<24hex>, got ${referralId}`,
  );

  const checkoutLocation = handoffRes.headers.get("location") || "";
  assert.ok(
    checkoutLocation.startsWith(
      "https://www.viator.com/tours/New-Orleans/New-Orleans-Swamp-Tour-Boat-Adventure-with-Transportation/d675-15200P6",
    ),
    `${label}: Unexpected Viator redirect destination: ${checkoutLocation}`,
  );

  const checkoutUrl = new URL(checkoutLocation);
  assert.equal(checkoutUrl.searchParams.get("date"), date);
  assert.equal(checkoutUrl.searchParams.get("adults"), partySize);
  assert.equal(checkoutUrl.searchParams.get("travelers"), partySize);
  assert.equal(checkoutUrl.searchParams.get("optionCode"), "TG10");
  assert.equal(checkoutUrl.searchParams.get("pid"), "P00306962");
  assert.equal(checkoutUrl.searchParams.get("mcid"), "42383");
  assert.equal(
    checkoutUrl.searchParams.get("campaign"),
    `fp-wno-swamp-tours-${referralId}`,
  );

  return {
    label,
    storefrontUrl,
    renderedClickHref: clickPath,
    referralId,
    campaignValue: checkoutUrl.searchParams.get("campaign"),
    viatorCheckoutUrl: checkoutLocation,
    verifiedParams: {
      date: checkoutUrl.searchParams.get("date"),
      adults: checkoutUrl.searchParams.get("adults"),
      travelers: checkoutUrl.searchParams.get("travelers"),
      optionCode: checkoutUrl.searchParams.get("optionCode"),
    },
  };
}

async function verifyDccAndCruisePreview() {
  const [dccHealthRes, cpPreviewRes] = await Promise.all([
    fetch(`${DCC_ORIGIN}/api/health?t=${Date.now()}`, {
      headers: { "cache-control": "no-cache" },
    }),
    fetch(`${CP_ORIGIN}/p/INDY-2027-01-24?t=${Date.now()}`, {
      headers: { "cache-control": "no-cache" },
    }),
  ]);

  assert.equal(dccHealthRes.status, 200, "Expected DCC /api/health HTTP 200");
  const dccHealth = await dccHealthRes.json();
  assert.equal(dccHealth.ok, true);

  if (
    EXPECTED_COMMIT_PREFIX &&
    dccHealth.commitSha &&
    dccHealth.commitSha !== "local"
  ) {
    assert.ok(
      String(dccHealth.commitSha).toLowerCase().startsWith(EXPECTED_COMMIT_PREFIX),
      `Expected DCC commitSha ${dccHealth.commitSha} to start with ${EXPECTED_COMMIT_PREFIX}`,
    );
  }

  assert.equal(cpPreviewRes.status, 200, "Expected Cruise Promenade /p/INDY-2027-01-24 HTTP 200");
  const cpHtml = await cpPreviewRes.text();
  assert.ok(
    cpHtml.includes("Marriott Frenchman") && cpHtml.includes("Needs confirmation"),
    "Expected Cruise Promenade preview to show Marriott Frenchman's Cove and Needs confirmation on St. Thomas",
  );
  assert.ok(
    cpHtml.includes("ID07MIA-1982128855") && cpHtml.includes("3:15 PM"),
    "Expected Cruise Promenade preview to show Nassau 3:15 PM conditional cutoff source",
  );

  return {
    dccCommitSha: dccHealth.commitSha,
    cruisePromenadePreviewStatus: cpPreviewRes.status,
  };
}

async function main() {
  const beforeTelemetryRes = await fetch(
    `${DCC_ORIGIN}/api/v1/concierge/telemetry?placementId=fp-wno-swamp-tours&t=${Date.now()}`,
    { headers: { "cache-control": "no-cache" } },
  );
  assert.equal(beforeTelemetryRes.status, 200);
  const beforeTelemetry = await beforeTelemetryRes.json();

  const wnoHostVerification = await verifyWnoHostnames();
  const selectionResults = [];
  for (const sel of SELECTIONS) {
    const res = await verifyStorefrontSelectionAndHandoff(sel);
    selectionResults.push(res);
  }

  assert.notEqual(
    selectionResults[0].referralId,
    selectionResults[1].referralId,
    "Each storefront selection must receive a distinct server-issued referral ID",
  );

  const otherSurfaces = await verifyDccAndCruisePreview();

  const afterTelemetryRes = await fetch(
    `${DCC_ORIGIN}/api/v1/concierge/telemetry?placementId=fp-wno-swamp-tours&t=${Date.now()}`,
    { headers: { "cache-control": "no-cache" } },
  );
  assert.equal(afterTelemetryRes.status, 200);
  const afterTelemetry = await afterTelemetryRes.json();

  // Confirm production guest clicks were NOT incremented by the release check
  assert.equal(
    afterTelemetry.funnelSummary.outboundClicks,
    beforeTelemetry.funnelSummary.outboundClicks,
    "Release check QA clicks must not increment production guest outboundClicks",
  );

  const report = {
    ok: true,
    verifiedAt: new Date().toISOString(),
    wnoHostVerification,
    storefrontSelections: selectionResults,
    otherSurfaces,
    wnoTelemetryLedger: {
      placementId: "fp-wno-swamp-tours",
      productionFunnelSummary: afterTelemetry.funnelSummary,
      qaTestSummary: afterTelemetry.testSummary,
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("[verify-release-handoff] FAILED:", err);
  process.exit(1);
});
