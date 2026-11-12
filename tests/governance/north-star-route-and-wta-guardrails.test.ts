import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { NextRequest } from "next/server";

import {
  FROZEN_AFFILIATE_IDENTIFIERS,
  HELD_COMMERCIAL_SKUS,
  PROTECTED_PARTNER_PROPERTIES,
  TRANSACTION_ROUTE_MODELS,
  listPartnerBoundaryReviewItems,
} from "@/lib/dcc/commerce/affiliateOwnershipLedger";
import { getSereneRezgoReadinessStatus } from "@/lib/dcc/liveSlots/rezgoReadOnly";
import {
  HELD_JEAN_LAFITTE_SLUG,
  isHeldProduct,
} from "@/app/new-orleans/data/truthPolicy";
import {
  getProductPrimaryBookingHref,
  getProductViatorCanonicalInfo,
  STOREFRONT_PRODUCTS,
} from "@/app/new-orleans/tours/pageConfig";
import { GET as getDccGoOut } from "@/app/go/out/route";
import { GET as getCommerceHandoff } from "@/app/go/commerce/handoff/route";
import { GET as getDellsOut } from "../../apps/welcometothedells/app/out/wisconsin-dells/[slug]/route";
import { getTrackedTourUrl } from "../../apps/last-frontier-shore-excursions/lib/alaska-ships";

const DCC_ROOT = process.cwd();
const SCRATCH_ROOT = path.resolve(DCC_ROOT, "..");

interface RouteRecord {
  routePattern: string;
  sourceFile: string;
  kind: "public_page" | "machine_contract" | "booking_or_handoff_action" | "order_lookup";
}

interface PropertyInventoryRecord {
  propertyId: string;
  canonicalDomain: string;
  ownership: "owned" | "independent_partner";
  isOwnedByDcc?: boolean;
  consumerTrafficLinkingAllowed?: boolean;
  consolidationRedirectsForbiddenWithoutAgreement: boolean;
  repoLabel: string;
  gitRef?: string;
  gitCommit?: string;
  counts: {
    total: number;
    public_page: number;
    machine_contract: number;
    booking_or_handoff_action: number;
    order_lookup: number;
  };
  routes: RouteRecord[];
}

interface FleetRouteInventory {
  schemaVersion: string;
  authorityDocument: string;
  lockedDate: string;
  policy: {
    noPublicPageDeletionAllowed: boolean;
    destructiveRedirectsForbiddenWithoutOwnerApproval: boolean;
    wtaConsolidationRedirectsForbiddenWithoutPartnerAgreement: boolean;
  };
  fleetTotals: {
    ownedPropertyCount: number;
    isolatedPartnerPropertyCount: number;
    totalPropertiesRecorded: number;
    ownedRoutesTotal: number;
    ownedPublicPages: number;
    ownedMachineContracts: number;
    ownedBookingOrHandoffActions: number;
    ownedOrderLookupRoutes: number;
    partnerIsolatedRoutesTotal: number;
    grandTotalRecordedRoutes: number;
  };
  properties: PropertyInventoryRecord[];
}

const PROPERTY_REPO_ROOTS: Record<string, string> = {
  "destinations-cc": DCC_ROOT,
  cruisepromenade: path.join(SCRATCH_ROOT, "cp-pilot10-2026-11-11"),
  rollcallusa: path.join(SCRATCH_ROOT, "rc-cruise-2026-11-10"),
  "last-frontier-shore-excursions": DCC_ROOT,
  juneauflightdeck: DCC_ROOT,
  welcometoneworleanstours: DCC_ROOT,
  welcometotheswamp: DCC_ROOT,
  welcometothedells: DCC_ROOT,
  saveonthestrip: DCC_ROOT,
  gosno: path.join(SCRATCH_ROOT, "gosno-track12-2026-11-11"),
  partyatredrocks: path.join(SCRATCH_ROOT, "parr-track12-2026-11-11"),
};

const IN_MONOREPO_PROPERTY_IDS = new Set<string>([
  "destinations-cc",
  "last-frontier-shore-excursions",
  "juneauflightdeck",
  "welcometoneworleanstours",
  "welcometotheswamp",
  "welcometothedells",
  "saveonthestrip",
]);

const BASELINE_MIN_ROUTE_COUNTS: Record<string, number> = {
  "destinations-cc": 421,
  cruisepromenade: 42,
  rollcallusa: 40,
  "last-frontier-shore-excursions": 16,
  juneauflightdeck: 37,
  welcometoneworleanstours: 49,
  welcometotheswamp: 29,
  welcometothedells: 24,
  saveonthestrip: 34,
  gosno: 84,
  partyatredrocks: 212,
  welcometoalaskatours: 63,
};

function walkConsumerSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name === ".git"
    ) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkConsumerSourceFiles(full));
    } else if (/\.(tsx?|jsx?|mjs|js)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

describe("North Star Governance, Route-Preservation, Commercial Guardrails, & WTA Partner-Isolation Suite", () => {
  it("1. verifies NORTH_STAR_VISION.md exists and locks all 10 Permanent Operating Requirements plus Sections 1–11 (11A–11D)", () => {
    const visionPath = path.join(DCC_ROOT, "NORTH_STAR_VISION.md");
    assert.equal(fs.existsSync(visionPath), true, "NORTH_STAR_VISION.md must exist at repo root");
    const vision = fs.readFileSync(visionPath, "utf8");

    assert.match(vision, /## Permanent Operating Requirements/);
    for (let req = 1; req <= 10; req += 1) {
      assert.match(
        vision,
        new RegExp(`^${req}\\.\\s+`, "m"),
        `Missing Permanent Operating Requirement #${req}`,
      );
    }
    assert.match(vision, /No existing public pages may be deleted\./);

    const expectedSectionHeadings = [
      "## 1. Destination Command Center Is the Intelligence Layer",
      "## 2. Cruise Promenade Is the Private Group Headquarters",
      "## 3. RollCallUSA Is the Optional Sailing-Wide Social Layer",
      "## 4. Specialist Sites Are Focused Storefronts",
      "## 5. GoSno Remains a Continuously Bookable Transportation Business",
      "## 6. Party at Red Rocks Remains Continuously Bookable",
      "## 7. No-Deletion and URL-Preservation Policy",
      "## 8. One Operator Connection Powers Multiple Authorized Surfaces",
      "## 9. Group Interest Becomes a Commercial Opportunity",
      "## 10. Authorized Humans and Machines Can Book Safely",
      "## 11. Active Owner Governance Decisions & Schedule Coverage Mandate",
      "### 11A. Schedule Coverage Engine",
      "### 11B. RollCallUSA Controlled Moderated Pilot Rules",
      "### 11C. Held Commercial SKUs & Direct-Operator Priority Queue",
      "### 11D. WTA Partner Containment & Organic Customer Data Boundary",
    ];
    for (const heading of expectedSectionHeadings) {
      assert.equal(
        vision.includes(heading),
        true,
        `Missing North Star section heading: '${heading}'`,
      );
    }

    // Explicit Section 11A Schedule Coverage Engine truthfulness & guardrails
    assert.match(vision, /11 complete, source-backed/);
    assert.match(vision, /14,300/);
    assert.match(vision, /500 complete, qualified 2027 sailing pages/);
    assert.match(vision, /`noindex`/);
  });

  it("2. enforces No-Deletion & Route Preservation across all 11 owned properties + isolated WTA partner baseline (CI-portable, 0 missing routes)", () => {
    const invPath = path.join(DCC_ROOT, "data/governance/public-route-inventory.v1.json");
    assert.equal(
      fs.existsSync(invPath),
      true,
      "data/governance/public-route-inventory.v1.json must exist",
    );
    const inv = JSON.parse(fs.readFileSync(invPath, "utf8")) as FleetRouteInventory;

    assert.equal(inv.schemaVersion, "public-route-inventory.v1");
    assert.equal(inv.policy.noPublicPageDeletionAllowed, true);
    assert.equal(inv.policy.destructiveRedirectsForbiddenWithoutOwnerApproval, true);
    assert.equal(inv.policy.wtaConsolidationRedirectsForbiddenWithoutPartnerAgreement, true);
    assert.equal(inv.fleetTotals.ownedPropertyCount, 11);
    assert.equal(inv.fleetTotals.isolatedPartnerPropertyCount, 1);
    assert.equal(inv.fleetTotals.totalPropertiesRecorded, 12);
    assert.equal(inv.properties.length, 12);

    const expectedOwnedIds = Object.keys(PROPERTY_REPO_ROOTS);
    const ownedProps = inv.properties.filter((p) => p.ownership === "owned");
    assert.deepEqual(
      ownedProps.map((p) => p.propertyId),
      expectedOwnedIds,
    );

    const missingInMonorepoFiles: string[] = [];
    const missingSiblingFiles: string[] = [];
    let verifiedInMonorepoCount = 0;

    for (const prop of ownedProps) {
      const repoRoot = PROPERTY_REPO_ROOTS[prop.propertyId];
      assert.ok(repoRoot, `Unknown repo root for ${prop.propertyId}`);
      const baselineMin = BASELINE_MIN_ROUTE_COUNTS[prop.propertyId];
      assert.ok(baselineMin && baselineMin > 0, `Missing baseline route floor for ${prop.propertyId}`);
      assert.ok(prop.routes.length > 0, `Property ${prop.propertyId} must record >0 routes`);
      assert.ok(
        prop.routes.length >= baselineMin,
        `Property ${prop.propertyId} route count ${prop.routes.length} fell below baseline ${baselineMin}`,
      );
      assert.equal(prop.counts.total, prop.routes.length);
      assert.equal(
        prop.counts.total,
        prop.counts.public_page +
          prop.counts.machine_contract +
          prop.counts.booking_or_handoff_action +
          prop.counts.order_lookup,
      );

      if (IN_MONOREPO_PROPERTY_IDS.has(prop.propertyId)) {
        // All 7 in-monorepo properties are verified on disk unconditionally in every CI/local environment
        assert.equal(
          fs.existsSync(repoRoot),
          true,
          `In-monorepo root must exist for ${prop.propertyId}: ${repoRoot}`,
        );
        verifiedInMonorepoCount += 1;
        for (const route of prop.routes) {
          const absFile = path.join(repoRoot, route.sourceFile);
          if (!fs.existsSync(absFile)) {
            missingInMonorepoFiles.push(`${prop.propertyId}:${route.routePattern} (${absFile})`);
          }
        }
      } else if (fs.existsSync(repoRoot)) {
        // Sibling repositories (`cp`, `rc`, `gosno`, `parr`) verify 0 baselined routes deleted whenever present on disk (additive routes allowed)
        for (const route of prop.routes) {
          const absFile = path.join(repoRoot, route.sourceFile);
          if (!fs.existsSync(absFile)) {
            missingSiblingFiles.push(`${prop.propertyId}:${route.routePattern} (${absFile})`);
          }
        }
      }
    }

    assert.equal(verifiedInMonorepoCount, 7, "All 7 in-monorepo properties must be verified unconditionally");
    assert.deepEqual(
      missingInMonorepoFiles,
      [],
      `Detected deleted/missing in-monorepo baselined route files: ${missingInMonorepoFiles.join(", ")}`,
    );
    assert.deepEqual(
      missingSiblingFiles,
      [],
      `Detected deleted/missing sibling repo baselined route files: ${missingSiblingFiles.join(", ")}`,
    );

    // Unconditionally verify isolated partner metadata & route count baseline for WTA
    const wtaProp = inv.properties.find((p) => p.propertyId === "welcometoalaskatours");
    assert.ok(wtaProp, "welcometoalaskatours partner inventory entry must exist");
    assert.equal(wtaProp.ownership, "independent_partner");
    assert.equal(wtaProp.isOwnedByDcc, false);
    assert.equal(wtaProp.consumerTrafficLinkingAllowed, false);
    assert.equal(wtaProp.consolidationRedirectsForbiddenWithoutAgreement, true);
    assert.ok(wtaProp.routes.length >= BASELINE_MIN_ROUTE_COUNTS.welcometoalaskatours);
    assert.equal(wtaProp.counts.total, wtaProp.routes.length);
    assert.equal(
      wtaProp.counts.total,
      wtaProp.counts.public_page +
        wtaProp.counts.machine_contract +
        wtaProp.counts.booking_or_handoff_action +
        wtaProp.counts.order_lookup,
    );

    // Whenever sibling WTA git clone exists on disk, verify 0 baselined routes missing on origin/main (additive routes allowed)
    const wtaGitRoot = path.join(SCRATCH_ROOT, "wta-rc-2026-11-10");
    if (fs.existsSync(wtaGitRoot)) {
      const wtaGitFiles = new Set(
        execSync("git ls-tree -r origin/main --name-only", {
          cwd: wtaGitRoot,
          encoding: "utf8",
        })
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean),
      );
      const missingWtaFiles = wtaProp.routes
        .filter((r) => !wtaGitFiles.has(r.sourceFile))
        .map((r) => r.sourceFile);
      assert.deepEqual(missingWtaFiles, []);
    }
  });

  it("3. blocks unapproved domain retirements and destructive redirects across DCC and all 6 specialist sub-apps", () => {
    const configPaths = [
      "next.config.mjs",
      "vercel.json",
      "src/data/edge-routing-rules.mjs",
      "src/data/runtime-redirects.mjs",
      "apps/last-frontier-shore-excursions/next.config.ts",
      "apps/last-frontier-shore-excursions/vercel.json",
      "apps/juneauflightdeck/next.config.mjs",
      "apps/juneauflightdeck/vercel.json",
      "apps/welcometoneworleanstours/next.config.mjs",
      "apps/welcometoneworleanstours/vercel.json",
      "apps/welcometotheswamp/next.config.mjs",
      "apps/welcometotheswamp/vercel.json",
      "apps/welcometothedells/next.config.mjs",
      "apps/welcometothedells/vercel.json",
      "apps/saveonthestrip/next.config.ts",
      "apps/saveonthestrip/vercel.json",
    ];

    // Explicit legacy wrapper/handoff exceptions documented in repo baseline
    const documentedLegacyRedirectExceptions = new Set([
      "destinations-cc:/book/red-rocks",
      "destinations-cc:/book/red-rocks-amphitheatre",
      "destinations-cc:/book/red-rocks-amphitheatre/private",
      "destinations-cc:/best-transportation-options-denver-to-red-rocks",
      "destinations-cc:/denver-concert-shuttle",
      "destinations-cc:/checkout",
      "juneauflightdeck:/whale-deck",
      "juneauflightdeck:/juneau-whale-watching-tours",
      "welcometoneworleanstours:/guides/french-quarter-orientation",
    ]);

    for (const relConfig of configPaths) {
      const absConfig = path.join(DCC_ROOT, relConfig);
      assert.equal(fs.existsSync(absConfig), true, `Missing config file: ${relConfig}`);
      const raw = fs.readFileSync(absConfig, "utf8");

      // Zero automatic redirects or rewrites referencing welcometoalaskatours.com
      assert.doesNotMatch(
        raw,
        /welcometoalaskatours\.com/i,
        `Config ${relConfig} must never reference or redirect welcometoalaskatours.com`,
      );

      // Zero wholesale root domain retirement (`source: "/"` or `source: "/:path*"` without host canonicalization `has: [...]` to the same domain)
      if (relConfig.endsWith("vercel.json")) {
        const parsed = JSON.parse(raw) as {
          redirects?: Array<{
            source: string;
            destination: string;
            has?: Array<{ type: string; value?: string }>;
          }>;
        };
        for (const r of parsed.redirects ?? []) {
          if (r.source === "/" || r.source === "/:path*") {
            assert.ok(
              Array.isArray(r.has) && r.has.some((h) => h.type === "host"),
              `Unconditional domain-retiring redirect in ${relConfig}: ${JSON.stringify(r)}`,
            );
          }
        }
      }
    }

    // Check sub-app static redirect sources against active public_page routes
    const inv = JSON.parse(
      fs.readFileSync(path.join(DCC_ROOT, "data/governance/public-route-inventory.v1.json"), "utf8"),
    ) as FleetRouteInventory;

    const subAppConfigs: Array<{ propertyId: string; configRel: string }> = [
      {
        propertyId: "last-frontier-shore-excursions",
        configRel: "apps/last-frontier-shore-excursions/next.config.ts",
      },
      {
        propertyId: "juneauflightdeck",
        configRel: "apps/juneauflightdeck/next.config.mjs",
      },
      {
        propertyId: "welcometoneworleanstours",
        configRel: "apps/welcometoneworleanstours/next.config.mjs",
      },
      {
        propertyId: "welcometotheswamp",
        configRel: "apps/welcometotheswamp/next.config.mjs",
      },
      {
        propertyId: "welcometothedells",
        configRel: "apps/welcometothedells/next.config.mjs",
      },
      {
        propertyId: "saveonthestrip",
        configRel: "apps/saveonthestrip/next.config.ts",
      },
    ];

    for (const { propertyId, configRel } of subAppConfigs) {
      const prop = inv.properties.find((p) => p.propertyId === propertyId);
      assert.ok(prop);
      const activePages = new Set(
        prop.routes.filter((r) => r.kind === "public_page").map((r) => r.routePattern),
      );
      const cfgSrc = fs.readFileSync(path.join(DCC_ROOT, configRel), "utf8");
      const redirectsSection = cfgSrc.split("async rewrites")[0] || cfgSrc;
      const sourceMatches = [...redirectsSection.matchAll(/source:\s*["']([^"']+)["']/g)];
      for (const m of sourceMatches) {
        const srcPattern = m[1];
        if (srcPattern === "/:path*") continue;
        if (activePages.has(srcPattern)) {
          assert.equal(
            documentedLegacyRedirectExceptions.has(`${propertyId}:${srcPattern}`),
            true,
            `Unapproved destructive redirect overshadowing active public page ${propertyId}:${srcPattern} in ${configRel}`,
          );
        }
      }
    }
  });

  it("4. preserves all 8 FROZEN_AFFILIATE_IDENTIFIERS, HELD_COMMERCIAL_SKUS, /go & /out handoffs, and exact tour checkout links on WNO, LFSE, and JFD", async () => {
    // 8 frozen affiliate IDs
    assert.equal(FROZEN_AFFILIATE_IDENTIFIERS.length, 8);
    assert.deepEqual(
      FROZEN_AFFILIATE_IDENTIFIERS.map((r) => r.id),
      [
        "P00058396",
        "P00306962",
        "P00281144",
        "aktourcenter",
        "welcometoneworleanstours",
        "wtonot-tours",
        "welcometoalaskatours",
        "F2MMUUH",
      ],
    );
    for (const record of FROZEN_AFFILIATE_IDENTIFIERS) {
      assert.equal(record.immutableInCode, true);
    }

    // Held commercial SKUs
    assert.equal(HELD_COMMERCIAL_SKUS.length, 2);
    const heldWno = HELD_COMMERCIAL_SKUS.find(
      (s) => s.skuSlug === "jeanlafitte-swamp-tour-with-hotel-pickup",
    );
    assert.ok(heldWno);
    assert.equal(heldWno.surfaceCode, "WNO");
    assert.equal(heldWno.status, "held");
    assert.equal(isHeldProduct(HELD_JEAN_LAFITTE_SLUG), true);
    const jeanProduct = STOREFRONT_PRODUCTS.find((p) => p.slug === HELD_JEAN_LAFITTE_SLUG);
    assert.ok(jeanProduct);
    assert.equal(getProductPrimaryBookingHref(jeanProduct), "");

    const heldLfse = HELD_COMMERCIAL_SKUS.find((s) => s.skuSlug === "aleutian-ballad");
    assert.ok(heldLfse);
    assert.equal(heldLfse.surfaceCode, "LFSE");
    assert.equal(heldLfse.status, "held");
    assert.match(heldLfse.holdReason, /t598272/);
    assert.equal(
      getTrackedTourUrl(
        "Bering Sea Crab Fishermen’s Tour aboard the Aleutian Ballad",
        "Ketchikan",
        "norwegian-jewel",
      ),
      null,
    );
    assert.doesNotMatch(
      fs.readFileSync(
        path.join(DCC_ROOT, "apps/last-frontier-shore-excursions/app/page.tsx"),
        "utf8",
      ),
      /t598272/i,
    );

    // Exact tour checkout links on WNO, LFSE, and JFD
    const wnoHome = fs.readFileSync(
      path.join(DCC_ROOT, "apps/welcometoneworleanstours/app/page.tsx"),
      "utf8",
    );
    assert.match(wnoHome, /d675-8013P1/);
    assert.match(wnoHome, /t20064/);
    for (const prod of STOREFRONT_PRODUCTS) {
      if (isHeldProduct(prod.slug) || !prod.viatorProductCode) continue;
      const viatorInfo = getProductViatorCanonicalInfo(prod);
      assert.ok(
        viatorInfo.destinationUrl.startsWith("https://www.viator.com/tours/New-Orleans/"),
        `Expected exact WNO Viator product URL for ${prod.slug}`,
      );
    }

    const lfseLinksSrc = fs.readFileSync(
      path.join(DCC_ROOT, "apps/last-frontier-shore-excursions/lib/affiliate/links.ts"),
      "utf8",
    );
    assert.match(lfseLinksSrc, /P00281144/);
    assert.match(lfseLinksSrc, /F2MMUUH/);

    const jfdHome = fs.readFileSync(
      path.join(DCC_ROOT, "apps/juneauflightdeck/app/page.tsx"),
      "utf8",
    );
    assert.match(jfdHome, /P00058396/);

    // Verify `/go/commerce/handoff`, `/go/out`, and `/out/wisconsin-dells/[slug]` remain operational
    const handoffRes = await getCommerceHandoff(
      new NextRequest(
        "https://www.destinationcommandcenter.com/go/commerce/handoff?site=welcometoneworleanstours.com&provider=viator&account=P00058396&product=8013P1&sourcePage=%2Ftours%2Fcity-tour-three-hour&url=https%3A%2F%2Fwww.viator.com%2Ftours%2FNew-Orleans%2FThree-Hour-City-Tour-of-New-Orleans%2Fd675-8013P1&qa=1&mode=json",
      ),
    );
    assert.equal(handoffRes.status, 200);
    const handoffJson = await handoffRes.json();
    assert.match(handoffJson.redirectTarget, /d675-8013P1/);

    const goOutRes = await getDccGoOut(
      new NextRequest(
        "https://www.destinationcommandcenter.com/go/out?url=https%3A%2F%2Fjuneauflightdeck.com%2Fjuneau-dogsled-helicopter-tours&mode=json",
      ),
    );
    assert.equal(goOutRes.status, 200);

    const dellsOutRes = await getDellsOut(
      new NextRequest("https://welcometothedells.com/out/wisconsin-dells/jet-boat-adventures"),
      { params: Promise.resolve({ slug: "jet-boat-adventures" }) },
    );
    assert.ok(
      dellsOutRes.status === 302 || dellsOutRes.status === 307,
      `Expected redirect status from Dells /out route, got ${dellsOutRes.status}`,
    );
  });

  it("5. enforces WTA Partner-Isolation safeguards (0 boundary leaks, 0 consumer WTA links/embeds/redirects, 5-gate Serene Rezgo lock)", async () => {
    // 1. Protected Partner Property ledger checks
    const wtaPartner = PROTECTED_PARTNER_PROPERTIES.find(
      (p) => p.canonicalDomain === "welcometoalaskatours.com",
    );
    assert.ok(wtaPartner, "welcometoalaskatours.com must be registered in PROTECTED_PARTNER_PROPERTIES");
    assert.equal(wtaPartner.ownership, "friend_independent_partner");
    assert.equal(wtaPartner.isOwnedByDcc, false);
    assert.equal(wtaPartner.consumerTrafficLinkingAllowed, false);
    assert.ok(wtaPartner.prohibitedWithoutPartnerApproval.includes("promote_301_redirect"));
    assert.ok(
      wtaPartner.prohibitedWithoutPartnerApproval.includes("consolidate_affiliate_ids_or_payouts"),
    );

    // 2. Zero partner boundary leaks
    assert.equal(listPartnerBoundaryReviewItems().length, 0);

    // 3. DCC `/go/out` explicitly rejects outbound redirects to welcometoalaskatours.com
    const blockedWtaOut = await getDccGoOut(
      new NextRequest(
        "https://www.destinationcommandcenter.com/go/out?url=https%3A%2F%2Fwelcometoalaskatours.com%2Fports%2Fjuneau&mode=json",
      ),
    );
    assert.equal(blockedWtaOut.status, 403);

    // 4. Scan consumer-facing source files in `app/`, `components/`, and `apps/` for WTA links or ASN embeds
    const consumerRoots = [
      path.join(DCC_ROOT, "app"),
      path.join(DCC_ROOT, "components"),
      path.join(DCC_ROOT, "apps"),
    ];
    const violations: string[] = [];
    const anchorHrefWtaRe = /<a\b[^>]*href\s*=\s*["'`][^"'`]*welcometoalaskatours\.com[^"'`]*["'`]/i;
    const wtaAsnEmbedRe = /asn\s*=\s*welcometoalaskatours\b/i;

    for (const dir of consumerRoots) {
      for (const file of walkConsumerSourceFiles(dir)) {
        const rel = path.relative(DCC_ROOT, file).split(path.sep).join("/");
        // Skip admin/internal/API governance endpoints when checking consumer UI surfaces, though anchor/ASN checks still apply everywhere except explicit governance API
        if (rel === "app/api/v1/commerce/affiliates/wta/route.ts") continue;
        const src = fs.readFileSync(file, "utf8");
        if (anchorHrefWtaRe.test(src)) {
          violations.push(`Customer-facing WTA anchor link in ${rel}`);
        }
        if (wtaAsnEmbedRe.test(src)) {
          violations.push(`WTA FareHarbor ASN embed on owned storefront in ${rel}`);
        }
        if (/welcometoalaskatours\.com/i.test(src) && !rel.startsWith("app/admin") && !rel.startsWith("app/internal")) {
          violations.push(`Unexpected consumer reference to welcometoalaskatours.com in ${rel}`);
        }
      }
    }
    assert.deepEqual(violations, []);

    // 5. Confirm 5-gate Serene Rezgo isolation remains locked when credentials are empty
    const sereneEmptyReadiness = getSereneRezgoReadinessStatus({
      REZGO_CID: "",
      REZGO_API_KEY: "",
    });
    assert.equal(sereneEmptyReadiness.liveBookingAllowed, false);
    assert.equal(sereneEmptyReadiness.isolatedSecondaryProperty, true);
    assert.equal(sereneEmptyReadiness.influencesPrimaryDccRanking, false);
    assert.equal(sereneEmptyReadiness.stage, "awaiting_credentials");
  });

  it("6. enforces Owner Decisions 7, 8, & 9 (Held SKUs inquiry-only, WTD homepage equipment ad removed with 24 routes intact, Serene #1 read-only gate & 0 live external suppliers)", () => {
    // Item 7: Both held SKUs remain strictly held & inquiry-only
    const heldLfse = HELD_COMMERCIAL_SKUS.find((s) => s.skuSlug === "aleutian-ballad");
    assert.ok(heldLfse);
    assert.equal(heldLfse.surfaceCode, "LFSE");
    assert.equal(heldLfse.status, "held");
    assert.equal(
      getTrackedTourUrl(
        "Bering Sea Crab Fishermen’s Tour aboard the Aleutian Ballad",
        "Ketchikan",
        "norwegian-jewel",
      ),
      null,
    );
    const lfseHomeSrc = fs.readFileSync(
      path.join(DCC_ROOT, "apps/last-frontier-shore-excursions/app/page.tsx"),
      "utf8",
    );
    assert.match(lfseHomeSrc, /statusBadge:\s*"Commercially Held"/);
    assert.match(lfseHomeSrc, /ctaHref:\s*"\/contact"/);
    assert.doesNotMatch(lfseHomeSrc, /t598272/i);

    const heldWno = HELD_COMMERCIAL_SKUS.find(
      (s) => s.skuSlug === "jeanlafitte-swamp-tour-with-hotel-pickup",
    );
    assert.ok(heldWno);
    assert.equal(heldWno.surfaceCode, "WNO");
    assert.equal(heldWno.status, "held");
    assert.equal(isHeldProduct(HELD_JEAN_LAFITTE_SLUG), true);
    const jeanProduct = STOREFRONT_PRODUCTS.find((p) => p.slug === HELD_JEAN_LAFITTE_SLUG);
    assert.ok(jeanProduct);
    assert.equal(getProductPrimaryBookingHref(jeanProduct), "");
    const wnoHeldPageSrc = fs.readFileSync(
      path.join(DCC_ROOT, "apps/welcometoneworleanstours/app/tours/HeldProductPage.tsx"),
      "utf8",
    );
    assert.match(
      wnoHeldPageSrc,
      /intentionally not showing a self-service booking button/i,
    );

    // Item 8: Welcome to the Dells homepage removes ONLY the off-theme equipment ad while preserving DellsHomeClient & all 24 WTD routes
    const wtdHomeSrc = fs.readFileSync(
      path.join(DCC_ROOT, "apps/welcometothedells/app/page.tsx"),
      "utf8",
    );
    assert.doesNotMatch(wtdHomeSrc, /people-n-equipment/i);
    assert.doesNotMatch(wtdHomeSrc, /Own equipment near the Dells\?/i);
    assert.match(wtdHomeSrc, /DellsHomeClient/);

    const inv = JSON.parse(
      fs.readFileSync(path.join(DCC_ROOT, "data/governance/public-route-inventory.v1.json"), "utf8"),
    ) as FleetRouteInventory;
    const wtdProp = inv.properties.find((p) => p.propertyId === "welcometothedells");
    assert.ok(wtdProp, "welcometothedells inventory entry must exist");
    assert.equal(wtdProp.routes.length, 24, "All 24 Welcome to the Dells routes must remain recorded");
    for (const route of wtdProp.routes) {
      assert.equal(
        fs.existsSync(path.join(DCC_ROOT, route.sourceFile)),
        true,
        `Missing WTD route file: ${route.sourceFile}`,
      );
    }

    const dccProp = inv.properties.find((p) => p.propertyId === "destinations-cc");
    assert.ok(dccProp, "destinations-cc inventory entry must exist");
    assert.ok(dccProp.routes.length >= 421, "All 421 DCC routes must remain recorded");

    // Item 9: Serene (#1 Juneau Tours & Whale Watch) read-only lock, NOLA #2, Colorado #3, and 0 live authorized external suppliers
    const sereneStatus = getSereneRezgoReadinessStatus({});
    assert.equal(sereneStatus.operatorId, "juneau-tours-whale-watch");
    assert.equal(sereneStatus.isolatedSecondaryProperty, true);
    assert.equal(sereneStatus.influencesPrimaryDccRanking, false);
    assert.equal(sereneStatus.liveBookingAllowed, false);
    assert.equal(sereneStatus.stage, "awaiting_credentials");

    // Even if toggle is set without credentials & upstream verification gates, liveBookingAllowed stays false
    const sereneBypassAttempt = getSereneRezgoReadinessStatus({
      REZGO_SERENE_LIVE_BOOKING_ENABLED: "true",
    });
    assert.equal(sereneBypassAttempt.liveBookingAllowed, false);

    const direct10Route = TRANSACTION_ROUTE_MODELS.find(
      (r) => r.id === "dcc_sourced_direct_10pct",
    );
    const machine5Route = TRANSACTION_ROUTE_MODELS.find(
      (r) => r.id === "machine_distributed_5pct",
    );
    assert.ok(direct10Route);
    assert.ok(machine5Route);
    assert.equal(direct10Route.liveAuthorizedExternalSupplierCount, 0);
    assert.equal(machine5Route.liveAuthorizedExternalSupplierCount, 0);

    // Verify 3-market direct-operator priority order (Juneau #1 -> New Orleans #2 -> Colorado #3) in Owner Control Center
    const controlCenterSrc = fs.readFileSync(
      path.join(DCC_ROOT, "lib/dcc/ownerControlCenter.ts"),
      "utf8",
    );
    const juneauIdx = controlCenterSrc.indexOf('marketId: "juneau"');
    const nolaIdx = controlCenterSrc.indexOf('marketId: "new-orleans"');
    const coloradoIdx = controlCenterSrc.indexOf('marketId: "colorado"');
    assert.ok(juneauIdx > 0 && nolaIdx > juneauIdx && coloradoIdx > nolaIdx);
  });
});
