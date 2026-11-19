import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, "..");

let passes = 0;
let failures = 0;

function check(cond, okMsg, failMsg) {
  if (cond) {
    passes += 1;
    console.log(`  [PASS] ${okMsg}`);
  } else {
    failures += 1;
    console.error(`  [FAIL] ${failMsg || okMsg}`);
  }
}

console.log("=== Juneau Flight Deck UnCruise Guide Verification ===");

const dataPath = path.join(APP_ROOT, "lib", "uncruiseJuneauGuideData.ts");
const checklistPath = path.join(
  APP_ROOT,
  "app",
  "components",
  "UncruiseFiveStepChecklist.tsx",
);
const pagePath = path.join(
  APP_ROOT,
  "app",
  "guides",
  "uncruise-juneau-helicopter-tours",
  "page.tsx",
);
const ledgerDocPath = path.join(
  APP_ROOT,
  "docs",
  "uncruise-juneau-helicopter-evidence-ledger.md",
);
const middlewarePath = path.join(APP_ROOT, "middleware.ts");
const robotsPath = path.join(APP_ROOT, "app", "robots.ts");
const sitemapPath = path.join(APP_ROOT, "app", "sitemap.ts");

for (const p of [dataPath, checklistPath, pagePath, ledgerDocPath, middlewarePath, robotsPath]) {
  check(fs.existsSync(p), `Exists: ${path.relative(APP_ROOT, p)}`);
}

const dataTxt = fs.readFileSync(dataPath, "utf8");
const checklistTxt = fs.readFileSync(checklistPath, "utf8");
const pageTxt = fs.readFileSync(pagePath, "utf8");
const ledgerTxt = fs.readFileSync(ledgerDocPath, "utf8");
const middlewareTxt = fs.readFileSync(middlewarePath, "utf8");
const robotsTxt = fs.readFileSync(robotsPath, "utf8");
const sitemapTxt = fs.readFileSync(sitemapPath, "utf8");

// 1. Canonical yearless route & title
check(
  dataTxt.includes('"/guides/uncruise-juneau-helicopter-tours"') &&
    dataTxt.includes("https://juneauflightdeck.com${UNCRUISE_GUIDE_PATH}") &&
    pageTxt.includes('"Adding a Juneau Helicopter Tour Before or After Your UnCruise"'),
  "Yearless route /guides/uncruise-juneau-helicopter-tours and exact title configured",
);

// 2. Non-affiliation, no weather/seat/compatibility promises, human attestation gate
check(
  pageTxt.includes("not affiliated with, sponsored by, or endorsed by UnCruise Adventures") &&
    pageTxt.includes("nothing on this page guarantees flyable weather, open replacement seats, or schedule") &&
    dataTxt.includes("UNCRUISE_GUIDE_HUMAN_ATTESTATION_CLEARED = false"),
  "Non-affiliation disclosure, honest weather/seat limits, and human attestation gate retained",
);

// 3. Five-step traveler flow & strict 'Confirm timing before booking' output
for (const stepLabel of [
  "1. Where are you staying?",
  "2. Which day is free?",
  "3. Where must you report next—and where will your luggage stay?",
  "4. Where does this exact tour collect you?",
  "5. Check departures with the seller.",
]) {
  check(
    checklistTxt.includes(stepLabel),
    `5-step checklist includes exact step heading: "${stepLabel}"`,
  );
}
check(
  checklistTxt.includes('"Confirm timing before booking"') &&
    !checklistTxt.includes("#10b981") &&
    !checklistTxt.includes("#22c55e"),
  'Unknown/tight constraints output "Confirm timing before booking" with zero green compatibility badges',
);

// 4. One card = one operator + one channel, distinct campaigns, exact CTAs, zero legacy broken links
for (const campaign of [
  "jfd-uncruise-guide-temsco-direct",
  "jfd-uncruise-guide-northstar-direct",
  "jfd-uncruise-guide-coastal-viator",
]) {
  check(dataTxt.includes(`"${campaign}"`), `Distinct handoff campaign present: ${campaign}`);
}

for (const cta of [
  "Check availability with TEMSCO",
  "Check availability with NorthStar",
  "Check availability on Viator",
]) {
  check(dataTxt.includes(`"${cta}"`), `Exact CTA label present: "${cta}"`);
}

check(
  dataTxt.includes("6251SHOREXICEWALK") &&
    dataTxt.includes("P00058396") &&
    dataTxt.includes("mcid=42383") &&
    !dataTxt.includes("413056") &&
    !pageTxt.includes("413056") &&
    !dataTxt.includes("/go/juneau/helicopter-tours") &&
    !pageTxt.includes("/go/juneau/helicopter-tours"),
  "Preserves Viator 6251SHOREXICEWALK (P00058396, mcid=42383) and rejects unverified FareHarbor 413056 & broken /go/juneau/helicopter-tours",
);

// 5. All 5 individual held claims present in code and ledger doc
for (const holdId of [
  "HELD-TEMSCO-HOTEL-LIST",
  "HELD-NORTHSTAR-PICKUP-CLOCK",
  "HELD-COASTAL-VIATOR-PICKUP",
  "HELD-COASTAL-VIATOR-CANCELLATION",
  "HELD-COASTAL-GLACIER-MINUTES",
]) {
  check(
    dataTxt.includes(holdId) && ledgerTxt.includes(holdId),
    `Held claim documented in guide data + ledger doc: ${holdId}`,
  );
}

// 6. Preview indexing exclusion & QA traffic isolation
check(
  middlewareTxt.includes('"X-Robots-Tag", "noindex, nofollow, noarchive"') &&
    robotsTxt.includes('disallow: "/"') &&
    pageTxt.includes("index: isProductionIndexable") &&
    !sitemapTxt.includes("uncruise-juneau-helicopter-tours"),
  "Preview excluded from indexing via middleware X-Robots-Tag, Preview robots.ts disallow, page robots metadata, and sitemap exclusion while unattested",
);

check(
  pageTxt.includes("buildPortfolioHandoffUrl") &&
    pageTxt.includes('process.env.VERCEL_ENV !== "production"') &&
    pageTxt.includes("&qa=1"),
  "Handoff URLs use /go/commerce/handoff contract and append qa=1 on non-production builds",
);

// 7. Structured data & accessibility landmarks
check(
  pageTxt.includes('id="main-content"') &&
    pageTxt.includes("buildFlightGuideJsonLd") &&
    pageTxt.includes('"@type": "FAQPage"') &&
    pageTxt.includes("<SourcesAndFreshness>"),
  "Renders main#main-content, WebPage/BreadcrumbList/ItemList + FAQPage JSON-LD, and SourcesAndFreshness",
);

console.log(`\nSummary: ${passes} passed, ${failures} failed.`);
if (failures > 0) {
  process.exit(1);
}
