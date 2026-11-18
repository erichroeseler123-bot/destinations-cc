import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, "..");

let failures = 0;
let passes = 0;

function pass(msg) {
  passes += 1;
  console.log(`  [PASS] ${msg}`);
}

function fail(msg) {
  failures += 1;
  console.error(`  [FAIL] ${msg}`);
}

function assertCondition(cond, okMsg, failMsg) {
  if (cond) pass(okMsg);
  else fail(failMsg || okMsg);
}

function walkFiles(dir, exts = null) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(full, exts));
    } else if (!exts || exts.includes(path.extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

console.log("=== Juneau Flight Deck Phase 2 Verification ===");

const sourceDirs = ["app", "lib", "docs"].map((d) => path.join(APP_ROOT, d));
const sourceFiles = sourceDirs.flatMap((d) =>
  walkFiles(d, [".ts", ".tsx", ".js", ".mjs", ".css", ".md"]),
);

// 1. Stale prices audit across app/, lib/, docs/
const stalePriceRegexes = [
  { label: "$409", re: /\$409\b/ },
  { label: "$429", re: /\$429\b/ },
  { label: "$499", re: /\$499\b/ },
  { label: "$549", re: /\$549\b/ },
  { label: "$659", re: /\$659\b/ },
  { label: "$699", re: /\$699\b/ },
  { label: "$709", re: /\$709\b/ },
  { label: "$739", re: /\$739\b/ },
  { label: "$379", re: /\$379\b/ },
  { label: "$345", re: /\$345\b/ },
  { label: "40900 cents", re: /\b40900\b/ },
  { label: "54900 cents", re: /\b54900\b/ },
  { label: "69900 cents", re: /\b69900\b/ },
  { label: "$795", re: /\$795\b/ },
  { label: "$925", re: /\$925\b/ },
  { label: "$688", re: /\$688\b/ },
  { label: "$169", re: /\$169\b/ },
];

for (const { label, re } of stalePriceRegexes) {
  const hits = [];
  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, "utf8");
    if (re.test(content)) {
      hits.push(path.relative(APP_ROOT, file));
    }
  }
  assertCondition(
    hits.length === 0,
    `Zero stale price "${label}" across app/, lib/, docs/`,
    `Found stale price "${label}" in: ${hits.join(", ")}`,
  );
}

// 2. Verified prices + "November 18, 2026" single source of truth
const pricingFile = path.join(APP_ROOT, "lib", "verifiedOperatorPricing.ts");
const pricingContent = fs.readFileSync(pricingFile, "utf8");
for (const expectedPrice of [
  "449",
  "759",
  "459",
  "609",
  "918",
  "769",
  "919",
  "1,538",
  "539",
  "599",
  "789",
  "479",
  "649",
]) {
  assertCondition(
    pricingContent.includes(expectedPrice),
    `verifiedOperatorPricing.ts contains verified tariff ${expectedPrice}`,
    `verifiedOperatorPricing.ts missing tariff ${expectedPrice}`,
  );
}
assertCondition(
  pricingContent.includes("November 18, 2026") &&
    pricingContent.includes("+$250 weight surcharge at 250+ lbs clothed"),
  "verifiedOperatorPricing.ts includes November 18, 2026 date & NorthStar +$250 rule",
);

// 3. Unverified cruise-line prices replaced with sailing portal notice
const calcContent = fs.readFileSync(
  path.join(APP_ROOT, "app", "components", "TourSavingsCalculator.tsx"),
  "utf8",
);
const savingsLibContent = fs.readFileSync(
  path.join(APP_ROOT, "lib", "tourSavings.ts"),
  "utf8",
);
assertCondition(
  !savingsLibContent.includes("cruiseCents") &&
    (calcContent.includes("CRUISE_PORTAL_PRICE_NOTE") ||
      calcContent.includes("Check current cruise-line price in your sailing portal")) &&
    pricingContent.includes("Check current cruise-line price in your sailing portal"),
  "Cruise-line prices gated to 'Check current cruise-line price in your sailing portal'",
);

// 4. Truthful availability (no Live Viator API Feed Active)
const liveFeedHits = [];
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, "utf8");
  if (content.includes("Live Viator API Feed Active") || /isLive:\s*true/.test(content)) {
    liveFeedHits.push(path.relative(APP_ROOT, file));
  }
}
assertCondition(
  liveFeedHits.length === 0,
  "Zero 'Live Viator API Feed Active' or hardcoded isLive: true claims",
  `Found live-feed claim in: ${liveFeedHits.join(", ")}`,
);

// 5. Verbatim 2-hour planning standard
const VERBATIM_BUFFER =
  "Cruise Promenade and the DCC network recommend planning for tours that return at least two hours before all-aboard.";
const bufferRequiredFiles = [
  "lib/verifiedOperatorPricing.ts",
  "lib/sitePositioning.ts",
  "app/page.tsx",
  "app/components/HelicopterDispatchBoard.tsx",
  "app/temsco-vs-coastal-vs-northstar-juneau/page.tsx",
  "app/juneau/what-to-do-if-helicopter-tour-canceled/page.tsx",
  "app/what-to-do-in-juneau-cruise-port/page.tsx",
  "app/book/page.tsx",
];
for (const rel of bufferRequiredFiles) {
  const txt = fs.readFileSync(path.join(APP_ROOT, rel), "utf8");
  assertCondition(
    txt.includes(VERBATIM_BUFFER) || txt.includes("VERBATIM_TWO_HOUR_BUFFER_RULE"),
    `Verbatim 2-hour planning standard referenced in ${rel}`,
    `Missing verbatim 2-hour planning standard in ${rel}`,
  );
}

// 6. Identity & JSON-LD schema checks
const layoutContent = fs.readFileSync(path.join(APP_ROOT, "app", "layout.tsx"), "utf8");
assertCondition(
  layoutContent.includes('"@type": "Organization"') &&
    layoutContent.includes("https://juneauflightdeck.com/#organization") &&
    layoutContent.includes('"@type": "WebSite"') &&
    layoutContent.includes("https://juneauflightdeck.com/#website") &&
    !layoutContent.includes("LocalBusiness") &&
    !layoutContent.includes("FAA Part 135 Helicopter Glacier Flights"),
  "app/layout.tsx emits truthful Organization + WebSite JSON-LD (no LocalBusiness / Part 135 Service)",
);

const schemaPages = [
  "app/temsco-vs-coastal-vs-northstar-juneau/page.tsx",
  "app/temsco-vs-coastal-juneau/page.tsx",
  "app/temsco-vs-northstar-juneau/page.tsx",
  "app/helicopter/page.tsx",
  "app/juneau/helicopter/page.tsx",
  "app/skagway/helicopter/page.tsx",
  "app/juneau-dogsled-helicopter-tours/page.tsx",
  "app/juneau-helicopter-tour-weight-limits-and-seating/page.tsx",
  "app/juneau-glacier-flight-weather/page.tsx",
];
for (const rel of schemaPages) {
  const txt = fs.readFileSync(path.join(APP_ROOT, rel), "utf8");
  assertCondition(
    txt.includes("buildFlightGuideJsonLd"),
    `buildFlightGuideJsonLd emitted in ${rel}`,
    `Missing buildFlightGuideJsonLd in ${rel}`,
  );
}

// 7. Zero /operators routes on JFD
assertCondition(
  !fs.existsSync(path.join(APP_ROOT, "app", "operators")),
  "Zero /operators routes exist on Juneau Flight Deck",
);

// 8. CrossPortBackup Ketchikan link & zero literal &nearr; & zero <Link href="/juneau-whale-watching-tours
const crossPortContent = fs.readFileSync(
  path.join(APP_ROOT, "app", "components", "CrossPortBackup.tsx"),
  "utf8",
);
assertCondition(
  crossPortContent.includes("Explore Ketchikan Misty Fjords Flights ↗") &&
    (crossPortContent.includes("LFSE_CANONICAL_LINKS.ketchikanMistyFjords") ||
      crossPortContent.includes(
        "https://www.lastfrontiershoreexcursions.com/ports/ketchikan/misty-fjords-tours",
      )) &&
    (crossPortContent.includes("LFSE_CANONICAL_LINKS.taquanAir") ||
      crossPortContent.includes(
        "https://www.lastfrontiershoreexcursions.com/operators/taquan-air",
      )),
  "CrossPortBackup.tsx links Ketchikan backup to LFSE /ports/ketchikan/misty-fjords-tours + Taquan Air",
);

const nearrHits = [];
const badWhaleLinkHits = [];
const badExternalNextLinkHits = [];
const visiblePidHits = [];
const dccSuitabilityHits = [];

for (const file of sourceFiles) {
  const rel = path.relative(APP_ROOT, file);
  const content = fs.readFileSync(file, "utf8");
  if (content.includes("&nearr;")) nearrHits.push(rel);
  if (/<Link[\s\S]{0,120}?href=["'`]\/juneau-whale-watching-tours/.test(content)) {
    badWhaleLinkHits.push(rel);
  }
  if (/<Link[\s\S]{0,120}?href=["'`]https?:\/\//.test(content)) {
    badExternalNextLinkHits.push(rel);
  }
  if (
    content.includes("(pid=P00058396)") ||
    content.includes("<code>pid=P00058396</code>") ||
    content.includes("<code className=\"font-mono\">pid=P00058396</code>") ||
    content.includes("(<code>P00058396</code>)") ||
    content.includes("Viator Partner (P00058396)")
  ) {
    visiblePidHits.push(rel);
  }
  if (content.includes("DCC evaluates tour suitability")) {
    dccSuitabilityHits.push(rel);
  }
}

assertCondition(
  nearrHits.length === 0,
  "Zero literal '&nearr;' entities in source files",
  `Found '&nearr;' in: ${nearrHits.join(", ")}`,
);
assertCondition(
  badWhaleLinkHits.length === 0,
  "Zero <Link href='/juneau-whale-watching-tours...'> cross-origin prefetch hazards",
  `Found <Link href='/juneau-whale-watching-tours'> in: ${badWhaleLinkHits.join(", ")}`,
);
assertCondition(
  badExternalNextLinkHits.length === 0,
  "Zero Next.js <Link> tags pointing to external https:// URLs",
  `Found external <Link> in: ${badExternalNextLinkHits.join(", ")}`,
);
assertCondition(
  visiblePidHits.length === 0,
  "Zero visible pid=P00058396 labels in UI copy",
  `Found visible pid=P00058396 in: ${visiblePidHits.join(", ")}`,
);
assertCondition(
  dccSuitabilityHits.length === 0,
  "Zero 'DCC evaluates tour suitability' internal jargon in UI copy",
  `Found 'DCC evaluates tour suitability' in: ${dccSuitabilityHits.join(", ")}`,
);

// 9. Preserve commercial attribution IDs & concierge paths
const catalogTxt = fs.readFileSync(path.join(APP_ROOT, "lib", "viator", "catalog.ts"), "utf8");
const homeTxt = fs.readFileSync(path.join(APP_ROOT, "app", "page.tsx"), "utf8");
const whaleTxt = fs.readFileSync(
  path.join(APP_ROOT, "app", "juneau-whale-watching-tours", "page.tsx"),
  "utf8",
);
const gygTxt = fs.readFileSync(
  path.join(APP_ROOT, "app", "components", "PartnerAnalyticsScript.tsx"),
  "utf8",
);
const gygConfigTxt = fs.readFileSync(
  path.join(APP_ROOT, "lib", "getyourguide", "config.ts"),
  "utf8",
);
assertCondition(
  catalogTxt.includes("pid=P00058396") && catalogTxt.includes("mcid=42383"),
  "Viator pid=P00058396 & mcid=42383 preserved in catalog URLs",
);
assertCondition(
  homeTxt.includes("temsco-juneau") &&
    homeTxt.includes("northstar-juneau") &&
    homeTxt.includes("P00058396"),
  "Homepage preserves coastalViatorHref (P00058396), temsco-juneau, and northstar-juneau handoffs",
);
assertCondition(
  whaleTxt.includes("pid=P00281144") && whaleTxt.includes("mcid=42383"),
  "Whale backup page preserves pid=P00281144 & mcid=42383",
);
assertCondition(
  layoutContent.includes("<PartnerAnalyticsScript />") &&
    gygTxt.includes("widget.getyourguide.com/dist/pa.umd.production.min.js") &&
    gygTxt.includes("data-gyg-partner-id={partnerId}") &&
    gygConfigTxt.includes("NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID"),
  "PartnerAnalyticsScript + GYG partner analytics wiring preserved intact",
);

// 10. Canceled page specific checks
const canceledTxt = fs.readFileSync(
  path.join(APP_ROOT, "app", "juneau", "what-to-do-if-helicopter-tour-canceled", "page.tsx"),
  "utf8",
);
assertCondition(
  !canceledTxt.includes("April 24 Dock Rollout") &&
    !canceledTxt.includes("(?cancel_ref=...)") &&
    canceledTxt.includes('data-testid="jfd-canceled-backup-panel"') &&
    canceledTxt.includes('data-testid="jfd-canceled-pajn-metar"') &&
    canceledTxt.includes("SourcesAndFreshness"),
  "Canceled flight page removes internal rollout jargon, keeps testids, and nests PAJN METAR in SourcesAndFreshness",
);

// 11. Header, Footer & Skip-link checks
const headerTxt = fs.readFileSync(
  path.join(APP_ROOT, "app", "components", "SiteHeader.tsx"),
  "utf8",
);
const footerTxt = fs.readFileSync(
  path.join(APP_ROOT, "app", "components", "SiteFooter.tsx"),
  "utf8",
);
assertCondition(
  headerTxt.includes('"/juneau-glacier-flight-weather"') &&
    headerTxt.includes("Flight Weather") &&
    headerTxt.includes('className="skip-link"') &&
    headerTxt.includes("aria-expanded") &&
    headerTxt.includes("aria-controls"),
  "SiteHeader includes Flight Weather nav item, .skip-link, and accessible mobile menu button",
);
assertCondition(
  footerTxt.includes('href="/juneau-glacier-flight-weather"') &&
    footerTxt.includes("LFSE_CANONICAL_LINKS"),
  "SiteFooter includes Flight Weather and LFSE canonical directory links",
);

// 12. Deterministic sitemap (41 URLs, lastModified = "2026-11-18")
const sitemapTxt = fs.readFileSync(path.join(APP_ROOT, "app", "sitemap.ts"), "utf8");
const fleetTxt = fs.readFileSync(path.join(APP_ROOT, "lib", "alaskaCruiseFleet.ts"), "utf8");
const coreRoutesMatch = sitemapTxt.match(/const coreHighIntentRoutes = \[([\s\S]*?)\];/);
const coreRouteCount = coreRoutesMatch
  ? (coreRoutesMatch[1].match(/path:\s*"[^"]*"/g) || []).length
  : 0;
const shipSlugCount = (fleetTxt.match(/slug:\s*['"][^'"]+['"]/g) || []).length;
assertCondition(
  sitemapTxt.includes('"2026-11-18"') &&
    !sitemapTxt.includes("new Date()") &&
    coreRouteCount + shipSlugCount === 41,
  `Deterministic sitemap has lastModified="2026-11-18" and ${coreRouteCount + shipSlugCount} URLs (${coreRouteCount} core + ${shipSlugCount} ships)`,
  `Sitemap check failed: core=${coreRouteCount}, ships=${shipSlugCount}`,
);

// 13. 100% SOURCES.md coverage of all visual assets under public/
const publicDir = path.join(APP_ROOT, "public");
const publicAssets = walkFiles(publicDir, [".jpg", ".jpeg", ".png", ".webp", ".svg", ".ico"]);
const rootSourcesMd = fs.readFileSync(
  path.join(publicDir, "images", "SOURCES.md"),
  "utf8",
);
const authoritySourcesMd = fs.readFileSync(
  path.join(publicDir, "images", "authority", "SOURCES.md"),
  "utf8",
);
const toursSourcesMd = fs.readFileSync(
  path.join(publicDir, "images", "tours", "SOURCES.md"),
  "utf8",
);
const missingAssets = [];
for (const asset of publicAssets) {
  const relFromPublic = path.relative(publicDir, asset).replace(/\\/g, "/");
  const relFromImages = relFromPublic.startsWith("images/")
    ? relFromPublic.slice("images/".length)
    : relFromPublic;
  if (!rootSourcesMd.includes(relFromImages) && !rootSourcesMd.includes(relFromPublic)) {
    missingAssets.push(relFromPublic);
  }
}
assertCondition(
  publicAssets.length === 15 &&
    missingAssets.length === 0 &&
    authoritySourcesMd.includes("Juneau_Alaska_Harbor.jpg") &&
    toursSourcesMd.includes("Herbert_Glacier_2019_568.jpg"),
  `100% SOURCES.md provenance coverage across all ${publicAssets.length} public assets`,
  `Missing from SOURCES.md (total=${publicAssets.length}): ${missingAssets.join(", ")}`,
);

// 14. Every page.tsx renders id="main-content" (directly or via StaticPage / JuneauHomeClient)
const pageFiles = walkFiles(path.join(APP_ROOT, "app"), [".tsx"]).filter((f) =>
  f.endsWith("page.tsx"),
);
const homeClientTxt = fs.readFileSync(
  path.join(APP_ROOT, "app", "components", "JuneauHomeClient.tsx"),
  "utf8",
);
const staticPageTxt = fs.readFileSync(
  path.join(APP_ROOT, "app", "components", "StaticPage.tsx"),
  "utf8",
);
const missingMainContentPages = [];
for (const pf of pageFiles) {
  const txt = fs.readFileSync(pf, "utf8");
  const hasDirectMain = txt.includes('id="main-content"');
  const usesStaticPage =
    txt.includes("<StaticPage") && staticPageTxt.includes('id="main-content"');
  const usesHomeClient =
    txt.includes("<JuneauHomeClient") && homeClientTxt.includes('id="main-content"');
  const reexportsPage = /export\s*\{[^}]*\bdefault\b[^}]*\}\s*from\s*["']\.\.\/[^"']+["']/.test(txt);
  if (!hasDirectMain && !usesStaticPage && !usesHomeClient && !reexportsPage) {
    missingMainContentPages.push(path.relative(APP_ROOT, pf));
  }
}
assertCondition(
  missingMainContentPages.length === 0,
  `All ${pageFiles.length} page.tsx routes render id="main-content" target for .skip-link`,
  `Pages missing id="main-content": ${missingMainContentPages.join(", ")}`,
);

console.log(`\nSummary: ${passes} passed, ${failures} failed.`);
if (failures > 0) {
  process.exit(1);
}
