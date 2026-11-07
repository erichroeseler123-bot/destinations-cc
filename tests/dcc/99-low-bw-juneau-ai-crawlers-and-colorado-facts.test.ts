import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  evaluateLowBandwidthJuneauReplan,
  LOW_BANDWIDTH_JUNEAU_COMPRESSED_TARGET_BYTES,
  buildJuneauFlightDeckReplanHandoffUrl,
} from "@/lib/dcc/lowBandwidthJuneauReplan";
import { GET as getJuneauFlightDeckHandoff } from "@/app/go/dcc-to-juneau-flight-deck/route";
import { buildRobotsTxt } from "@/app/robots.txt/handler";
import { buildDccAiCrawlerAndCitationAuditReport } from "@/lib/dcc/aiCrawlerAndCitationAudit";
import { resolveLlmsTxtByRegionOrNodeSlug } from "@/lib/dcc/llmsManifest";
import { GET as getRootLlmsTxt } from "@/app/llms.txt/route";
import {
  CDOT_I70_VERIFIED_FACTS,
  COLORADO_TRANSFER_FACT_COMPARISON,
} from "@/lib/dcc/coloradoFactComparison";
import { getPublishedDecisionGuide } from "@/src/data/published-decision-guides";

describe("Priority 1: Low-Bandwidth Juneau Replanning View & Handoff", () => {
  it("enforces a 50 KB compressed first-load target and evaluates updated arrival / all-aboard times", () => {
    assert.equal(LOW_BANDWIDTH_JUNEAU_COMPRESSED_TARGET_BYTES, 50 * 1024);

    // Tight port call (e.g. delayed arrival at 14:30, all-aboard at 19:30 on AJ Dock — 300 min total, 90-min AJ buffer + 20m transfer + 20m checkin = 130m overhead -> 180m Mendenhall needs 310m or on CT dock 60m buffer + 10m walk + 20m checkin = 90m overhead + 180m = 270m fits!)
    const tightPlan = evaluateLowBandwidthJuneauReplan({
      ship: "Discovery Princess",
      date: "2026-07-15",
      arrivalTime: "14:00",
      allAboardTime: "18:45",
      berth: "CT",
      partySize: 4,
      flightCanceled: true,
      cancelRef: "TEMSCO-WX-102",
      dccContextId: "dcc_ctx_test_lowbw",
    });

    assert.equal(tightPlan.input.ship, "Discovery Princess");
    assert.equal(tightPlan.input.arrivalTime, "14:00");
    assert.equal(tightPlan.input.allAboardTime, "18:45");
    assert.equal(tightPlan.input.berth, "CT");
    assert.equal(tightPlan.input.partySize, 4);
    assert.equal(tightPlan.input.flightCanceled, true);
    assert.equal(tightPlan.compressedTargetBytes, 51200);
    assert.ok(
      tightPlan.offlinePolicyNote.includes(
        "Updated availability and booking require an active connection",
      ),
    );

    // With 4h 45m (285 min) on CT dock: Mendenhall shuttle (180m + 90m overhead = 270m) fits; Whale Watch (210m + 90m = 300m) does not fit
    const mendenhall = tightPlan.options.find(
      (o) => o.optionId === "mendenhall-glacier-shuttle",
    );
    const whale = tightPlan.options.find(
      (o) => o.optionId === "whale-watching-auke-bay",
    );
    assert.ok(mendenhall);
    assert.ok(whale);
    assert.equal(mendenhall.timing.status, "FITS_CRUISE_WINDOW");
    assert.equal(mendenhall.fitsNow, true);
    assert.equal(whale.timing.status, "OUTSIDE_CRUISE_WINDOW");
    assert.equal(whale.fitsNow, false);

    // Full port call (12:30 to 20:30 on CT dock) fits both Whale Watching and Helicopter
    const fullPlan = evaluateLowBandwidthJuneauReplan({
      ship: "Norwegian Bliss",
      date: "2026-07-15",
      arrivalTime: "12:30",
      allAboardTime: "20:30",
      berth: "CT",
      partySize: 4,
      flightCanceled: false,
    });
    const fullWhale = fullPlan.options.find(
      (o) => o.optionId === "whale-watching-auke-bay",
    );
    assert.ok(fullWhale);
    assert.equal(fullWhale.timing.status, "FITS_CRUISE_WINDOW");
    assert.equal(fullWhale.fitsNow, true);
  });

  it("preserves updated trip details through /go/dcc-to-juneau-flight-deck to Juneau Flight Deck", async () => {
    const handoffPath = buildJuneauFlightDeckReplanHandoffUrl({
      input: {
        ship: "Norwegian Bliss",
        date: "2026-07-15",
        arrivalTime: "13:00",
        allAboardTime: "20:00",
        berth: "AJ",
        partySize: 4,
        flightCanceled: true,
        cancelRef: "COASTAL-WX-9",
        dccContextId: "dcc_ctx_replan_99",
      },
      interest: "whale-watching",
      optionId: "whale-watching-auke-bay",
      timeWindowParam: "13:00-20:00 (7.0h)",
    });

    const req = new NextRequest(
      `https://destinationcommandcenter.com${handoffPath}`,
    );
    const res = await getJuneauFlightDeckHandoff(req);
    assert.equal(res.status, 302);
    const location = res.headers.get("location");
    assert.ok(location);
    const targetUrl = new URL(location);
    assert.equal(targetUrl.hostname, "juneauflightdeck.com");
    assert.equal(targetUrl.pathname, "/juneau-whale-watching-tours");
    assert.equal(targetUrl.searchParams.get("ship"), "Norwegian Bliss");
    assert.equal(targetUrl.searchParams.get("date"), "2026-07-15");
    assert.equal(targetUrl.searchParams.get("party_size"), "4");
    assert.equal(targetUrl.searchParams.get("berth"), "AJ");
    assert.equal(targetUrl.searchParams.get("claa_arrival"), "13:00");
    assert.equal(targetUrl.searchParams.get("all_aboard"), "20:00");
    assert.equal(targetUrl.searchParams.get("flight_canceled"), "1");
    assert.equal(targetUrl.searchParams.get("cancel_ref"), "COASTAL-WX-9");
    assert.equal(targetUrl.searchParams.get("ctx"), "dcc_ctx_replan_99");
    assert.equal(targetUrl.searchParams.get("low_bw"), "1");
  });
});

describe("Priority 2: AI Search Crawlers, /llms.txt, and Sourced Guides", () => {
  it("allows OpenAI, Perplexity, Anthropic, and Google crawlers on destinationcommandcenter.com robots.txt", () => {
    const robots = buildRobotsTxt("destinationcommandcenter.com");
    assert.ok(robots.includes("User-agent: OAI-SearchBot"));
    assert.ok(robots.includes("User-agent: GPTBot"));
    assert.ok(robots.includes("User-agent: ChatGPT-User"));
    assert.ok(robots.includes("User-agent: PerplexityBot"));
    assert.ok(robots.includes("User-agent: Perplexity-User"));
    assert.ok(robots.includes("User-agent: Claude-SearchBot"));
    assert.ok(robots.includes("User-agent: Googlebot"));
    assert.ok(robots.includes("Allow: /llms.txt"));
  });

  it("verifies root and regional /llms.txt manifests and records Google's /llms.txt policy", async () => {
    const rootRes = await getRootLlmsTxt();
    assert.equal(rootRes.status, 200);
    const rootText = await rootRes.text();
    assert.ok(rootText.includes("/juneau/replan"));
    assert.ok(
      rootText.includes(
        "Google states that /llms.txt has no effect on Google Search visibility",
      ),
    );

    const juneauLlms = resolveLlmsTxtByRegionOrNodeSlug("juneau");
    assert.ok(juneauLlms);
    assert.ok(juneauLlms.includes("/juneau/replan"));

    const coloradoLlms = resolveLlmsTxtByRegionOrNodeSlug("denver-breckenridge");
    assert.ok(coloradoLlms);
    assert.ok(
      coloradoLlms.includes("https://www.codot.gov/travel/ejmt/metering"),
    );
    assert.ok(coloradoLlms.includes("$100 fine plus a $33 surcharge"));

    const audit = buildDccAiCrawlerAndCitationAuditReport();
    assert.ok(
      audit.measurementPolicy.googleLlmsTxtGuidance.includes(
        "Google states that /llms.txt has no effect on Google Search visibility",
      ),
    );
    assert.equal(audit.crawlerReachability.robotsTxtAllowsAllPublicGuides, true);
    assert.ok(audit.auditedGuides.length >= 6);
    for (const guide of audit.auditedGuides) {
      assert.ok(
        guide.directAnswerSummary.length > 30,
        `${guide.guidePath} must have a direct answer`,
      );
      assert.ok(
        guide.sourcedCitations.length >= 1,
        `${guide.guidePath} must have verified sources`,
      );
    }
  });
});

describe("Priority 3: Colorado Fact-Based Comparison & Verified CDOT Rules", () => {
  it("uses verified CDOT EJMT metering and $100 + $33 surcharge passenger guidance without legacy claims", () => {
    assert.equal(
      CDOT_I70_VERIFIED_FACTS.ejmtMetering.officialUrl,
      "https://www.codot.gov/travel/ejmt/metering",
    );
    assert.ok(
      CDOT_I70_VERIFIED_FACTS.ejmtMetering.ruleSummary.includes(
        "stops traffic entering the affected tunnel",
      ),
    );
    assert.equal(
      CDOT_I70_VERIFIED_FACTS.passengerTractionLawPenalties.noncomplianceFineUsd,
      100,
    );
    assert.equal(
      CDOT_I70_VERIFIED_FACTS.passengerTractionLawPenalties
        .noncomplianceSurchargeUsd,
      33,
    );
    assert.equal(
      CDOT_I70_VERIFIED_FACTS.passengerTractionLawPenalties.noncomplianceTotalUsd,
      133,
    );
    assert.equal(
      CDOT_I70_VERIFIED_FACTS.passengerTractionLawPenalties.laneClosureFineUsd,
      500,
    );
    assert.equal(
      CDOT_I70_VERIFIED_FACTS.passengerTractionLawPenalties
        .laneClosureSurchargeUsd,
      156,
    );
    assert.equal(
      CDOT_I70_VERIFIED_FACTS.passengerTractionLawPenalties.laneClosureTotalUsd,
      656,
    );

    const serialized = JSON.stringify({
      CDOT_I70_VERIFIED_FACTS,
      COLORADO_TRANSFER_FACT_COMPARISON,
      vailGuide: getPublishedDecisionGuide(
        "denver-airport-to-vail-rental-car-vs-private-transfer",
      ),
    });
    assert.equal(serialized.includes("+55 minutes"), false);
    assert.equal(serialized.includes("$1,000"), false);
  });

  it("compares all 5 DEN-to-Mountain options on the 6 traveler dimensions and uses identical shared I-70 road conditions", () => {
    assert.equal(COLORADO_TRANSFER_FACT_COMPARISON.length, 5);
    const baselineSharedRoad =
      COLORADO_TRANSFER_FACT_COMPARISON[0].sharedRoadConditions;
    assert.ok(
      baselineSharedRoad.includes("stops traffic entering the affected tunnel"),
    );

    for (const opt of COLORADO_TRANSFER_FACT_COMPARISON) {
      assert.ok(opt.pickupWait.length > 10);
      assert.ok(opt.rentalCollection.length > 5);
      assert.ok(opt.parking.length > 10);
      assert.ok(opt.vehicleAndGearFit.length > 10);
      assert.ok(opt.confirmedPricing.length > 10);
      assert.ok(opt.availability.length > 10);
      assert.equal(
        opt.sharedRoadConditions,
        baselineSharedRoad,
        `Option ${opt.optionId} on the same I-70 road must use the exact same verified road conditions`,
      );
    }
  });
});
