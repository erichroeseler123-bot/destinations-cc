import assert from "node:assert/strict";
import fs from "node:fs";
import Module from "node:module";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";

const modAny = Module as unknown as {
  _extensions: Record<string, (m: { exports: unknown }) => void>;
};
modAny._extensions[".css"] = (m) => {
  m.exports = {};
};

import sitemap from "../app/sitemap";
import { INTERNAL_HELD_SEAK_LODGE_RESEARCH_QUEUE } from "../../../lib/dcc/alaska/fishingLodgesResearchQueue";
import {
  evaluateSoutheastAlaskaLodgePublicationGate,
  UNCLAIMED_LODGE_FACT_SHEET_NOTICE,
} from "../../../lib/dcc/shared/southeastAlaskaFishingLodgesContract";
import {
  findPublishedSoutheastAlaskaFishingLodgeBySlug,
  getPublicSoutheastAlaskaFishingLodgesSnapshot,
  getPublishedSoutheastAlaskaFishingLodges,
} from "../../../lib/dcc/shared/southeastAlaskaFishingLodgesData";
import { GET as getDccFishingLodgesApi } from "../../../app/api/v1/alaska/fishing-lodges/route";
import { POST as postFishingLodgeSubmission } from "../app/api/fishing-lodge-submissions/route";
import {
  SEAK_FISHING_LODGES_CANONICAL_URL,
  SEAK_FISHING_LODGES_PATH,
  SEAK_FISHING_LODGES_RELEASE_READY,
  buildFishingLodgeDetailJsonLd,
  buildFishingLodgesDirectoryJsonLd,
} from "../lib/fishingLodgesConfig";

const LFSE_ROOT = path.join(
  process.cwd(),
  "apps",
  "last-frontier-shore-excursions",
);

function readLfseFile(relPath: string): string {
  return fs.readFileSync(path.join(LFSE_ROOT, relPath), "utf8");
}

test("Reconciled inventory & fail-closed gate: 16 published properties (15 individual + 1 whole-lodge), >=3 claims across >=2 URLs, and 0 held leaks", async () => {
  const snapshot = getPublicSoutheastAlaskaFishingLodgesSnapshot();
  assert.equal(snapshot.counts.totalPublishedProperties, 16);
  assert.equal(snapshot.counts.individualRoomOrCabinProperties, 15);
  assert.equal(snapshot.counts.wholeLodgePrivateProperties, 1);
  assert.equal(snapshot.lodges.length, 16);

  const published = getPublishedSoutheastAlaskaFishingLodges();
  assert.equal(published.length, 16);

  for (const { lodge, gate } of published) {
    assert.equal(gate.publishableInPreviewDirectory, true);
    assert.ok(
      gate.evidenceCount >= 3,
      `${lodge.slug} must have >=3 claim evidence items, found ${gate.evidenceCount}`,
    );
    assert.ok(
      gate.distinctSourceUrlCount >= 2,
      `${lodge.slug} must cite >=2 distinct official URLs, found ${gate.distinctSourceUrlCount}`,
    );
  }

  // Verify homepage-only record fails the publication gate
  const sample = structuredClone(published[0]!.lodge);
  sample.claimEvidence = sample.claimEvidence.map((ev) => ({
    ...ev,
    source: { ...ev.source, url: "https://www.pybus.com/" },
  }));
  const failedGate = evaluateSoutheastAlaskaLodgePublicationGate(sample);
  assert.equal(failedGate.publishableInPreviewDirectory, false);
  assert.ok(
    failedGate.holdReasonCodes.includes("HOMEPAGE_ONLY_WITHOUT_CLAIM_EVIDENCE"),
  );

  // Verify held research queue records (13 internal records) never leak into public lookup or API
  assert.equal(INTERNAL_HELD_SEAK_LODGE_RESEARCH_QUEUE.length, 13);
  for (const heldSlug of [
    "dove-island-lodge-sitka",
    "salmon-falls-resort",
    "talon-lodge-sitka",
    "the-cedars-lodge",
    "silver-king-lodge",
    "kingfisher-lodge",
  ]) {
    assert.equal(findPublishedSoutheastAlaskaFishingLodgeBySlug(heldSlug), null);
    const heldApiRes = await getDccFishingLodgesApi(
      new NextRequest(
        `https://www.destinationcommandcenter.com/api/v1/alaska/fishing-lodges?lodge=${heldSlug}`,
      ),
    );
    assert.equal(heldApiRes.status, 404);
  }

  // Public DCC API snapshot returns 16 lodges and heldResearchRecordsExposed: false
  const apiRes = await getDccFishingLodgesApi(
    new NextRequest(
      "https://www.destinationcommandcenter.com/api/v1/alaska/fishing-lodges",
    ),
  );
  assert.equal(apiRes.status, 200);
  assert.equal(apiRes.headers.get("X-Robots-Tag"), "noindex, nofollow");
  const apiJson = (await apiRes.json()) as {
    ok: boolean;
    heldResearchRecordsExposed: boolean;
    counts: { totalPublishedProperties: number; returnedProperties: number };
    lodges: Array<{ slug: string }>;
  };
  assert.equal(apiJson.ok, true);
  assert.equal(apiJson.heldResearchRecordsExposed, false);
  assert.equal(apiJson.counts.totalPublishedProperties, 16);
  assert.equal(apiJson.counts.returnedProperties, 16);
});

test("Entity & truthfulness corrections: Fish Baranof vs. Longliner Lodge, Boardwalk whole-lodge stay, Clover Pass vs. Cedars disambiguation, and Kingfisher airfare conflict", () => {
  // 1. Fish Baranof: boat-rental/package seller separated from Longliner Lodge & Suites physical hotel
  const fishBaranof =
    findPublishedSoutheastAlaskaFishingLodgeBySlug("fish-baranof-sitka")?.lodge;
  assert.ok(fishBaranof);
  assert.match(fishBaranof.packageSeller.sellerName, /^Fish Baranof/);
  assert.equal(
    fishBaranof.packageSeller.sellerRole,
    "boat_rental_and_package_coordinator",
  );
  assert.equal(
    fishBaranof.accommodation.propertyName,
    "Longliner Lodge & Suites",
  );
  assert.match(fishBaranof.accommodation.streetOrPostalAddress || "", /485 Katlian/i);
  assert.equal(
    fishBaranof.accommodation.relationshipToPackageSeller,
    "common_individual_owner_documented_on_official_site",
  );
  assert.equal(fishBaranof.fishingProgram.guidingMode, "self_guided_boats");
  assert.equal(
    fishBaranof.nonFishingContext.simultaneousNonAnglerActivitiesProven,
    "no",
  );

  // 2. Boardwalk Lodge: whole-lodge private property with separately arranged guides, catering & housekeeping; small parties not falsely prohibited
  const boardwalk =
    findPublishedSoutheastAlaskaFishingLodgeBySlug("boardwalk-lodge")?.lodge;
  assert.ok(boardwalk);
  assert.equal(boardwalk.stayFormat, "whole_lodge_private_property");
  assert.equal(
    boardwalk.operationArchetype,
    "whole_property_private_stay_services_separate",
  );
  assert.equal(
    boardwalk.fishingProgram.guidingMode,
    "independent_guides_arranged_separately",
  );
  assert.match(boardwalk.accommodation.groupSizeGuidanceNote, /1–12/);
  assert.doesNotMatch(
    boardwalk.accommodation.groupSizeGuidanceNote,
    /small parties prohibited|minimum 10 guests required/i,
  );
  assert.ok(
    boardwalk.partnerServices.some(
      (p) =>
        p.serviceRole === "independent_fishing_guides" &&
        p.arrangementType === "arranged_separately_by_guest_or_group",
    ),
  );
  assert.ok(
    boardwalk.partnerServices.some(
      (p) =>
        p.serviceRole === "chef_catering_or_housekeeping" &&
        p.arrangementType === "arranged_separately_by_guest_or_group",
    ),
  );

  // 3. Clover Pass Resort: shared phone/template with The Cedars Lodge never asserts common ownership
  const cloverPass =
    findPublishedSoutheastAlaskaFishingLodgeBySlug("clover-pass-resort")?.lodge;
  assert.ok(cloverPass);
  assert.match(
    cloverPass.operatingCompany.separationDisambiguationNote || "",
    /888-564-4525/,
  );
  assert.match(
    cloverPass.operatingCompany.separationDisambiguationNote || "",
    /never establish(?:es)? common corporate ownership/i,
  );

  // 4. Alaska's Kingfisher Lodge (Craig): flags official-page conflict on KTN-Klawock airfare & separates from Sitka Kingfisher
  const kingfisherCraig = findPublishedSoutheastAlaskaFishingLodgeBySlug(
    "alaska-kingfisher-lodge-craig",
  )?.lodge;
  assert.ok(kingfisherCraig);
  assert.equal(
    kingfisherCraig.accessConnections[0]?.provisionStatus,
    "conflicting_official_pages_confirm",
  );
  assert.equal(
    kingfisherCraig.accessConnections[0]?.transportOperationState,
    "conflicting_official_transfer_pages",
  );
  assert.match(
    kingfisherCraig.operatingCompany.separationDisambiguationNote || "",
    /Sitka/i,
  );

  // 5. Offering kayaks never automatically proves simultaneous guided non-angler activities
  const rockyPoint =
    findPublishedSoutheastAlaskaFishingLodgeBySlug("rocky-point-resort")?.lodge;
  assert.ok(rockyPoint);
  assert.match(
    rockyPoint.nonFishingContext.onSiteUnguidedEquipment.summary,
    /kayak/i,
  );
  assert.equal(
    rockyPoint.nonFishingContext.simultaneousNonAnglerActivitiesProven,
    "unknown",
  );
});

test("SSR rendering: Directory client, Whole-Lodge filter, 4-lodge printable comparison matrix, detail fact sheet, ecosystem cross-links, and SOURCES.md visual provenance", async () => {
  const snapshot = getPublicSoutheastAlaskaFishingLodgesSnapshot();
  const masterSources = readLfseFile("public/images/SOURCES.md");

  for (const lodge of snapshot.lodges) {
    assert.equal(lodge.visualRepresentation.isActualPropertyPhoto, false);
    assert.equal(
      lodge.visualRepresentation.visualDisclosureBadge,
      "Regional scenery; see the lodge’s website for property photos.",
    );
    const relImg = lodge.visualRepresentation.imagePath.replace(
      /^\/images\//,
      "",
    );
    assert.ok(
      masterSources.includes(relImg),
      `Lodge ${lodge.slug} image ${relImg} must exist in public/images/SOURCES.md`,
    );
  }

  // SSR render of directory with 4 lodges selected in comparison
  const { LfseFishingLodgesDirectoryClient } = await import(
    "../components/LfseFishingLodgesDirectoryClient"
  );
  const compareHtml = renderToStaticMarkup(
    <LfseFishingLodgesDirectoryClient
      lodges={snapshot.lodges}
      initialCompareSlugs={[
        "favorite-bay-lodge",
        "bear-track-inn",
        "fish-baranof-sitka",
        "boardwalk-lodge",
      ]}
    />,
  );
  assert.match(
    compareHtml,
    /Showing <strong>16<\/strong> of <strong>16<\/strong> properties/,
  );
  assert.match(compareHtml, /Whole-Lodge Private Stays \(1\)/);
  assert.match(compareHtml, /Side-by-Side Comparison \(4 of 4 Lodges\)/);
  assert.match(compareHtml, /Print \/ Save PDF/);
  assert.match(compareHtml, /Longliner Lodge &amp; Suites/);
  assert.match(compareHtml, /Whole-Lodge Private Stay/);
  assert.match(compareHtml, /Free listing/);
  assert.doesNotMatch(
    compareHtml,
    /\$0|forever|quarantin|governance|Entity Separation|Estimated Complete Trip Total:\s*\$/i,
  );

  // Verify traveler-first comparison row order:
  // Price & Stay Length -> What's Included & Rooms -> Fishing Arrangements -> Non-Angler -> Getting There -> Additional Costs
  const rowOrder = [
    "Price &amp; Stay Length",
    "What&#x27;s Included &amp; Rooms",
    "Fishing Arrangements",
    "Non-Angler &amp; Companion Options",
    "Getting There &amp; Baggage",
    "Additional Costs &amp; Who You Book With",
  ];
  let prevIdx = -1;
  for (const label of rowOrder) {
    const idx = compareHtml.indexOf(label);
    assert.ok(idx > prevIdx, `Comparison row "${label}" must appear in order`);
    prevIdx = idx;
  }

  // SSR render of full directory page and detail pages
  const { default: DirectoryPage } = await import(
    "../app/southeast-alaska/fishing-lodges/page"
  );
  const directoryPageHtml = renderToStaticMarkup(
    await DirectoryPage({
      searchParams: Promise.resolve({
        compare: "favorite-bay-lodge,fish-baranof-sitka",
      }),
    }),
  );
  assert.match(directoryPageHtml, /href="\/guides\/weekend-in-juneau"/);
  assert.match(
    directoryPageHtml,
    /https:\/\/juneauflightdeck\.com\/guides\/uncruise-juneau-helicopter-tours/,
  );
  assert.match(
    directoryPageHtml,
    /https:\/\/cruisepromenade\.com\/guides\/cruise-alaska-without-a-cruise-ship/,
  );
  // Competitor analysis stays in research docs — never on public traveler page
  assert.doesNotMatch(
    directoryPageHtml,
    /Fishlodges|Alaska Fishing Match|Alaska Field Guide|\$0 forever|quarantin|governance/i,
  );
  assert.match(
    directoryPageHtml,
    /<details[^>]*class="lfse-sources-details"/,
  );

  const { default: DetailPage } = await import(
    "../app/southeast-alaska/fishing-lodges/[lodgeSlug]/page"
  );
  const detailHtml = renderToStaticMarkup(
    await DetailPage({
      params: Promise.resolve({ lodgeSlug: "fish-baranof-sitka" }),
    }),
  );
  assert.match(detailHtml, /Longliner Lodge &amp; Suites/);
  assert.match(detailHtml, /485 Katlian/);
  assert.match(detailHtml, /4:00 p\.m\./);
  assert.match(detailHtml, /see the lodge&#x27;s website for property photos/);
  assert.match(detailHtml, /Details to confirm before paying a deposit/);
  assert.match(detailHtml, /Official sources &amp; check dates/);
  assert.doesNotMatch(
    detailHtml,
    /\$0|forever|quarantin|Fact Sheet Governance|Entity Separation/i,
  );
  assert.match(
    detailHtml,
    new RegExp(
      UNCLAIMED_LODGE_FACT_SHEET_NOTICE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    ),
  );

  // Verify material booking uncertainty renders inline beside transfer/costs on Alaska's Kingfisher Lodge
  const kingfisherDetailHtml = renderToStaticMarkup(
    await DetailPage({
      params: Promise.resolve({ lodgeSlug: "alaska-kingfisher-lodge-craig" }),
    }),
  );
  assert.match(
    kingfisherDetailHtml,
    /Official pages differ on whether this transfer is included/,
  );

  // Ensure neither page uses Next <Link> for external origins
  for (const relFile of [
    "app/southeast-alaska/fishing-lodges/page.tsx",
    "app/southeast-alaska/fishing-lodges/[lodgeSlug]/page.tsx",
    "components/LfseFishingLodgesDirectoryClient.tsx",
  ]) {
    const src = readLfseFile(relFile);
    assert.doesNotMatch(
      src,
      /<Link[^>]+href=["']https?:\/\//i,
      `${relFile} must never use Next <Link> for external URLs`,
    );
  }

  // Preview indexing & JSON-LD checks
  assert.equal(SEAK_FISHING_LODGES_PATH, "/southeast-alaska/fishing-lodges");
  assert.equal(
    SEAK_FISHING_LODGES_CANONICAL_URL,
    "https://www.lastfrontiershoreexcursions.com/southeast-alaska/fishing-lodges",
  );
  assert.equal(SEAK_FISHING_LODGES_RELEASE_READY, false);
  assert.equal(sitemap().length, 158);

  const dirJsonLd = JSON.stringify(
    buildFishingLodgesDirectoryJsonLd(snapshot.lodges),
  );
  const detailJsonLd = JSON.stringify(
    buildFishingLodgeDetailJsonLd(snapshot.lodges[0]!),
  );
  for (const raw of [dirJsonLd, detailJsonLd]) {
    assert.doesNotMatch(
      raw,
      /"logo"|"aggregateRating"|"review"|"offers"|"priceRange"|"parentOrganization"/i,
    );
  }
});

test("Durable submission E2E: synthetic factual_correction and lodge_profile_claim suppress real emails and separate identity from quarantined fact review", async () => {
  // 1. Synthetic Factual Correction
  const corrReq = new Request(
    "http://localhost:3000/api/fishing-lodge-submissions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
      },
      body: JSON.stringify({
        submissionType: "factual_correction",
        lodgeSlug: "alaska-kingfisher-lodge-craig",
        contactName: "[TEST] Synthetic Traveler QA",
        email: "qa-traveler@example.com",
        targetClaimScope: "access_and_baggage",
        evidenceUrl: "https://alaskaskingfisherlodge.com/rates/",
        details:
          "[TEST] Official 2027 Rates page notes KTN-Klawock Island Air Express airfare is excluded.",
        isTest: true,
      }),
    },
  );
  const corrRes = await postFishingLodgeSubmission(corrReq);
  assert.equal(corrRes.status, 201);
  const corrJson = (await corrRes.json()) as Record<string, unknown>;
  assert.equal(corrJson.ok, true);
  assert.equal(corrJson.isTest, true);
  assert.equal(corrJson.emailSent, false);
  assert.equal(corrJson.emailSuppressedForTest, true);
  assert.equal(
    corrJson.identityVerificationState,
    "not_applicable_correction_only",
  );
  assert.equal(
    corrJson.submittedFactsVerificationState,
    "quarantined_pending_steward_evidence_review",
  );
  assert.equal(corrJson.autoPublishesSubmittedFacts, false);

  // 2. Synthetic Free Lodge Identity Claim ($0) with matching official domain
  const claimReq = new Request(
    "http://localhost:3000/api/fishing-lodge-submissions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
      },
      body: JSON.stringify({
        submissionType: "lodge_profile_claim",
        lodgeSlug: "fish-baranof-sitka",
        contactName: "[TEST] Synthetic Lodge Representative",
        roleTitle: "Operations Coordinator",
        email: "qa-test@fishbaranof.com",
        phone: "(907) 738-3606",
        details:
          "[TEST] Synthetic Preview identity claim check — verify facts stay quarantined.",
        isTest: true,
      }),
    },
  );
  const claimRes = await postFishingLodgeSubmission(claimReq);
  assert.equal(claimRes.status, 201);
  const claimJson = (await claimRes.json()) as Record<string, unknown>;
  assert.equal(claimJson.ok, true);
  assert.equal(claimJson.isTest, true);
  assert.equal(claimJson.emailSent, false);
  assert.equal(claimJson.emailSuppressedForTest, true);
  assert.equal(
    claimJson.identityVerificationState,
    "pending_owner_confirmation",
  );
  assert.equal(
    claimJson.identityVerificationMethod,
    "official_company_domain_email",
  );
  assert.equal(
    claimJson.submittedFactsVerificationState,
    "quarantined_pending_steward_evidence_review",
  );
  assert.equal(claimJson.autoPublishesSubmittedFacts, false);

  // 3. Rejects secret API keys in public submissions
  const secretReq = new Request(
    "http://localhost:3000/api/fishing-lodge-submissions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", host: "localhost:3000" },
      body: JSON.stringify({
        submissionType: "factual_correction",
        lodgeSlug: "pybus-point-lodge",
        contactName: "[TEST] Bad Input",
        email: "qa@example.com",
        details: "Here is my secret token sk_live_1234567890abcdef",
        isTest: true,
      }),
    },
  );
  const secretRes = await postFishingLodgeSubmission(secretReq);
  assert.equal(secretRes.status, 400);
});
