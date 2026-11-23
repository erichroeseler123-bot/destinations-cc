import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import {
  BLOCKED_PARASITE_CRAWLERS,
  isAutomatedCrawlerRequest,
  isBeneficialSearchOrAiBot,
  isBlockedParasiteBot,
} from "@/lib/dcc/botPolicy";
import { buildRobotsTxt } from "@/app/robots.txt/handler";
import { proxy } from "@/proxy";
import {
  GET as getLocationApi,
  requestedScope,
} from "@/app/api/location/[lat]/[lng]/route";
import {
  clearNoaaAdapterCacheForTests,
  noaaAdapter,
} from "@/lib/dcc/providers/adapters/noaa";
import { buildDccSitemapXml } from "@/app/sitemap.xml/handler";
import { buildSomersetSitemapXml } from "@/app/somerset-wi/sitemap.xml/handler";

test("1. Bot policy blocks parasite scrapers while preserving search, AI citation, and preview crawlers", () => {
  for (const parasite of [
    "Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)",
    "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
    "Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)",
    "Mozilla/5.0 (compatible; MJ12bot/v1.4.8; http://mj12bot.com/)",
    "Mozilla/5.0 (compatible; DotBot/1.2; +https://opensiteexplorer.org/dotbot)",
    "Mozilla/5.0 (compatible; BLEXBot/1.0; +http://webmeup-crawler.com/)",
    "Mozilla/5.0 (Linux; Android 7.0;) AppleWebKit/537.36 (compatible; PetalBot;+https://webmaster.petalsearch.com/site/petalbot)",
    "Mozilla/5.0 (compatible; DataForSeoBot/1.0; +https://dataforseo.com/dataforseo-bot)",
  ]) {
    assert.equal(isBlockedParasiteBot(parasite), true, `Expected blocked: ${parasite}`);
  }

  for (const beneficial of [
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)",
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15 (Applebot/0.1)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +searchbot@anthropic.com)",
  ]) {
    assert.equal(isBeneficialSearchOrAiBot(beneficial), true, `Expected beneficial: ${beneficial}`);
    assert.equal(isBlockedParasiteBot(beneficial), false, `Must NOT block: ${beneficial}`);
    assert.equal(isAutomatedCrawlerRequest(beneficial), true);
  }

  // Standard browsers and direct SDK clients are neither blocked nor classified as crawlers
  const chromeUa =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
  assert.equal(isBlockedParasiteBot(chromeUa), false);
  assert.equal(isAutomatedCrawlerRequest(chromeUa), false);
  assert.equal(isBlockedParasiteBot("DCC-Partner-SDK/1.0"), false);
  assert.equal(isAutomatedCrawlerRequest("DCC-Partner-SDK/1.0"), false);
});

test("2. robots.txt disallows parasite crawlers while keeping search and AI crawlers open", () => {
  for (const host of ["destinationcommandcenter.com", "welcometoneworleanstours.com"]) {
    const robots = buildRobotsTxt(host);
    for (const allowedBot of [
      "Googlebot",
      "Bingbot",
      "Applebot",
      "OAI-SearchBot",
      "GPTBot",
      "PerplexityBot",
      "Claude-SearchBot",
    ]) {
      assert.ok(robots.includes(`User-agent: ${allowedBot}`), `${host} missing ${allowedBot}`);
    }
    for (const blockedBot of BLOCKED_PARASITE_CRAWLERS) {
      assert.ok(
        robots.includes(`User-agent: ${blockedBot}\nDisallow: /`),
        `${host} robots.txt missing Disallow: / for ${blockedBot}`,
      );
    }
  }
});

test("3. Edge proxy blocks parasite scrapers with 403, exempts /robots.txt, and sets CDN edge cache on clean indexable pages", async () => {
  const blockedPageReq = new NextRequest("https://destinationcommandcenter.com/juneau", {
    headers: { "user-agent": "Mozilla/5.0 (compatible; Bytespider)" },
  });
  const blockedPageRes = await proxy(blockedPageReq);
  assert.equal(blockedPageRes.status, 403);
  assert.match(blockedPageRes.headers.get("cache-control") || "", /s-maxage=86400/);

  const robotsReq = new NextRequest("https://destinationcommandcenter.com/robots.txt", {
    headers: { "user-agent": "Mozilla/5.0 (compatible; SemrushBot/7~bl)" },
  });
  const robotsRes = await proxy(robotsReq);
  assert.notEqual(robotsRes.status, 403, "Polite scrapers must still be able to read /robots.txt");

  const googlebotIndexableReq = new NextRequest("https://destinationcommandcenter.com/juneau", {
    headers: { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
  });
  const googlebotRes = await proxy(googlebotIndexableReq);
  assert.equal(googlebotRes.status, 200);
  assert.equal(googlebotRes.headers.get("x-robots-tag"), "index, follow");
  assert.equal(
    googlebotRes.headers.get("vercel-cdn-cache-Control") ||
      googlebotRes.headers.get("Vercel-CDN-Cache-Control"),
    "public, s-maxage=3600, stale-while-revalidate=86400",
  );

  // Query-parameterized or non-indexable pages must NOT receive static CDN edge caching from proxy
  const queryReq = new NextRequest("https://destinationcommandcenter.com/juneau?arrive=08:00");
  const queryRes = await proxy(queryReq);
  assert.equal(queryRes.headers.get("vercel-cdn-cache-control"), null);

  const nonIndexableReq = new NextRequest("https://destinationcommandcenter.com/ask");
  const nonIndexableRes = await proxy(nonIndexableReq);
  assert.equal(nonIndexableRes.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.equal(nonIndexableRes.headers.get("vercel-cdn-cache-control"), null);
});

test("4. /api/location throttles automated crawlers to cached core scope and blocks parasite bots", async () => {
  const bytespiderApiReq = new NextRequest(
    "https://destinationcommandcenter.com/api/location/58.30190/-134.41970",
    { headers: { "user-agent": "Mozilla/5.0 (compatible; AhrefsBot/7.0)" } },
  );
  const blockedRes = await getLocationApi(bytespiderApiReq, {
    params: Promise.resolve({ lat: "58.30190", lng: "-134.41970" }),
  });
  assert.equal(blockedRes.status, 403);

  const googlebotReq = new NextRequest(
    "https://destinationcommandcenter.com/api/location/58.30190/-134.41970",
    { headers: { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" } },
  );
  assert.equal(requestedScope(googlebotReq), "core");

  const explicitFullBotReq = new NextRequest(
    "https://destinationcommandcenter.com/api/location/58.30190/-134.41970?scope=full",
    { headers: { "user-agent": "Mozilla/5.0 (compatible; OAI-SearchBot/1.0)" } },
  );
  assert.equal(requestedScope(explicitFullBotReq), "full");

  const directSdkReq = new NextRequest(
    "https://destinationcommandcenter.com/api/location/58.30190/-134.41970",
    { headers: { "user-agent": "DCC-Partner-Client/2.0" } },
  );
  assert.equal(requestedScope(directSdkReq), "full");

  const googlebotMiamiReq = new NextRequest(
    "https://destinationcommandcenter.com/api/location/25.77810/-80.17940",
    { headers: { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" } },
  );
  const firstBotRes = await getLocationApi(googlebotMiamiReq, {
    params: Promise.resolve({ lat: "25.77810", lng: "-80.17940" }),
  });
  assert.equal(firstBotRes.status, 200);
  assert.equal(firstBotRes.headers.get("x-dcc-scope"), "core");
  assert.match(
    firstBotRes.headers.get("cache-control") || "",
    /s-maxage=900, stale-while-revalidate=3600/,
  );

  // Repeat crawler hit within the 30-minute bot snapshot window performs zero upstream fetches
  const secondBotRes = await getLocationApi(googlebotMiamiReq, {
    params: Promise.resolve({ lat: "25.77810", lng: "-80.17940" }),
  });
  assert.equal(secondBotRes.status, 200);
  assert.equal(secondBotRes.headers.get("x-dcc-telemetry-cache"), "HIT");
  assert.equal(secondBotRes.headers.get("x-dcc-upstream-calls"), "0");

  // Even on reference nodes with expired/withdrawn claim dependencies (which enforce HTTP no-store),
  // repeat bot crawls still hit the bounded telemetry bundle cache with zero upstream fetches
  await getLocationApi(googlebotReq, {
    params: Promise.resolve({ lat: "58.30190", lng: "-134.41970" }),
  });
  const secondJuneauBotRes = await getLocationApi(googlebotReq, {
    params: Promise.resolve({ lat: "58.30190", lng: "-134.41970" }),
  });
  assert.equal(secondJuneauBotRes.headers.get("x-dcc-telemetry-cache"), "HIT");
  assert.equal(secondJuneauBotRes.headers.get("x-dcc-upstream-calls"), "0");
});

test("5. NOAA adapter caches grid points (24h) and hourly forecasts (15m) without redundant upstream fetches", async () => {
  clearNoaaAdapterCacheForTests();
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    calls.push(url);
    if (url.includes("api.weather.gov/points/")) {
      return new Response(
        JSON.stringify({
          properties: {
            forecastHourly: "https://api.weather.gov/gridpoints/AJK/190,152/forecast/hourly",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/geo+json" } },
      );
    }
    return new Response(
      JSON.stringify({
        properties: {
          periods: [
            {
              startTime: "2026-11-22T18:00:00-09:00",
              endTime: "2026-11-22T19:00:00-09:00",
              temperature: 38,
              temperatureUnit: "F",
              windSpeed: "10 mph",
              windDirection: "SE",
              shortForecast: "Light Rain",
            },
          ],
        },
      }),
      { status: 200, headers: { "Content-Type": "application/geo+json" } },
    );
  }) as typeof fetch;

  try {
    const first = await noaaAdapter.fetch({ lat: 58.3019, lon: -134.4197, periods: 6 });
    assert.equal(first.ok, true);
    assert.equal(first.diagnostics.cache_status, "miss");
    assert.equal(calls.length, 2);

    const second = await noaaAdapter.fetch({ lat: 58.3019, lon: -134.4197, periods: 6 });
    assert.equal(second.ok, true);
    assert.equal(second.diagnostics.cache_status, "fresh");
    assert.equal(calls.length, 2, "Second NOAA read within 15m must perform zero upstream fetches");
  } finally {
    globalThis.fetch = originalFetch;
    clearNoaaAdapterCacheForTests();
  }
});

test("6. Sitemaps emit deterministic <lastmod> dates instead of dynamic per-request timestamps", async () => {
  const xmlA = buildDccSitemapXml(["/", "/non-manifest-fallback-check"], "https://www.shuttletosomersetamphitheater.com", true);
  await new Promise((r) => setTimeout(r, 15));
  const xmlB = buildDccSitemapXml(["/", "/non-manifest-fallback-check"], "https://www.shuttletosomersetamphitheater.com", true);
  assert.equal(xmlA, xmlB, "buildDccSitemapXml must be byte-identical across calls");
  assert.doesNotMatch(xmlA, /T\d{2}:\d{2}:\d{2}\.\d{3}Z/, "Fallback lastmod must be a stable YYYY-MM-DD date");

  const somersetA = buildSomersetSitemapXml();
  await new Promise((r) => setTimeout(r, 15));
  const somersetB = buildSomersetSitemapXml();
  assert.equal(somersetA, somersetB, "Somerset sitemap XML must be deterministic");
  assert.match(somersetA, /<lastmod>2026-11-17<\/lastmod>/);
});
