import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Sample queue of global anchor targets to scale the network
const HARVEST_QUEUE = [
  { slug: "rome", name: "Rome (Civitavecchia)", lat: 42.0924, lon: 11.7954, countryCode: "IT" },
  { slug: "tokyo", name: "Tokyo", lat: 35.6762, lon: 139.6503, countryCode: "JP" },
  { slug: "barcelona", name: "Barcelona", lat: 41.3851, lon: 2.1734, countryCode: "ES" },
  { slug: "st-thomas", name: "St. Thomas", lat: 18.3419, lon: -64.9307, countryCode: "VI" },
  { slug: "philipsburg", name: "St. Maarten (Philipsburg)", lat: 18.0257, lon: -63.0453, countryCode: "SX" },
];

export async function GET(request: Request) {
  // Guard the pipeline from unauthorized external hits
  const { searchParams } = new URL(request.url);
  const authKey = searchParams.get("key");
  if (authKey !== process.env.INTERNAL_CRON_KEY) {
    return NextResponse.json({ error: "Unauthorized payload request" }, { status: 401 });
  }

  const results = [];

  for (const target of HARVEST_QUEUE) {
    try {
      const cacheKey = `market:${target.slug}`;

      // 1. Check if the destination is already locked into the edge cache
      const exists = await redis.exists(cacheKey);
      if (exists) {
        results.push({ slug: target.slug, status: "skipped", reason: "Already fully hydrated" });
        continue;
      }

      // 2. Mock Affiliate Deck Fetch (Simulating concurrent Viator/GYG ingestion pipelines)
      // In production, swap this block with your direct partner API fetches
      const affiliateDeck = [
        { id: `v-${target.slug}-1`, title: `Top Recommended ${target.name} Highlights Tour`, price: 59, operator: "Viator", deepLink: "#" },
        { id: `g-${target.slug}-2`, title: `Premium Private ${target.name} Shore Excursion`, price: 120, operator: "GetYourGuide", deepLink: "#" },
      ];

      // 3. Construct the complete, unified decision dossier payload
      const hydrationPayload = {
        slug: target.slug,
        marketId: `${target.slug}-${target.countryCode.toLowerCase()}`,
        coordinates: { lat: target.lat, lon: target.lon },
        inventory: affiliateDeck,
        lastHydrated: new Date().toISOString(),
      };

      // 4. Force write the entry directly to the Upstash Redis edge instance
      await redis.set(cacheKey, JSON.stringify(hydrationPayload));

      results.push({ slug: target.slug, status: "hydrated" });
    } catch (error: any) {
      results.push({ slug: target.slug, status: "failed", error: error.message });
    }
  }

  return NextResponse.json({ processed: results, timestamp: new Date().toISOString() });
}
