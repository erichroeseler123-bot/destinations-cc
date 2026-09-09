const https = require("https");

const BASE_URL = process.env.VERIFY_URL || "https://www.welcometoneworleanstours.com";

const URLS_TO_VERIFY = [
  "/swamp-tours",
  "/ghost-tours",
  "/riverboat-cruises",
  "/plantation-tours",
  "/garden-district-tours",
  "/guides/best-new-orleans-swamp-tour",
  "/guides/best-swamp-tour-with-transportation",
  "/guides/oak-alley-vs-whitney-plantation-vs-swamp-tour",
  "/sitemap.xml",
];

function fetchUrl(urlPath) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${BASE_URL}${urlPath}`;
    https
      .get(fullUrl, { headers: { "User-Agent": "WNO-SEO-Verification-Bot/1.0" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            url: fullUrl,
            status: res.statusCode,
            body: data,
          });
        });
      })
      .on("error", reject);
  });
}

async function run() {
  console.log(`Checking production SEO endpoints on ${BASE_URL}...\n`);
  let allPass = true;

  for (const path of URLS_TO_VERIFY) {
    try {
      const res = await fetchUrl(path);
      const isXml = path.endsWith(".xml");
      const hasAnswerCard = isXml || res.body.includes("data-geo-answer-card");
      const hasDirectAnswer = isXml || res.body.includes("Direct New Orleans Answer");
      const hasSchema = res.body.includes("schema.org");

      const statusOk = res.status === 200;
      const pass = statusOk && (isXml ? res.body.includes("oak-alley-vs-whitney-plantation-vs-swamp-tour") : hasAnswerCard);

      if (!pass) allPass = false;

      console.log(`${pass ? "✅" : "❌"} [${res.status}] ${path}`);
      if (!isXml) {
        console.log(`   - data-geo-answer-card: ${hasAnswerCard ? "YES" : "NO"}`);
        console.log(`   - direct answer badge:  ${hasDirectAnswer ? "YES" : "NO"}`);
        console.log(`   - schema.org JSON-LD:   ${hasSchema ? "YES" : "NO"}`);
      } else {
        console.log(`   - includes new guide:   ${res.body.includes("oak-alley-vs-whitney-plantation-vs-swamp-tour") ? "YES" : "NO"}`);
      }
    } catch (err) {
      console.error(`❌ Error fetching ${path}:`, err.message);
      allPass = false;
    }
  }

  console.log(`\nOverall Verification Result: ${allPass ? "ALL PASS ✅" : "SOME FAILED ❌"}`);
  process.exit(allPass ? 0 : 1);
}

run();
