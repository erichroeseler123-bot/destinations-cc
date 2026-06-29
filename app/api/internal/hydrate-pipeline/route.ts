import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { appendViatorAttribution } from "@/lib/viator/links";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

const HARVEST_QUEUE = [
  { slug: "rome", name: "Rome (Civitavecchia)", lat: 42.0924, lon: 11.7954, countryCode: "IT", viatorId: "511", placeId: "rome" },
  { slug: "tokyo", name: "Tokyo", lat: 35.6762, lon: 139.6503, countryCode: "JP", viatorId: "334", placeId: "tokyo" },
  { slug: "barcelona", name: "Barcelona", lat: 41.3851, lon: 2.1734, countryCode: "ES", viatorId: "562", placeId: "barcelona-spain" },
  { slug: "st-thomas", name: "St. Thomas", lat: 18.3419, lon: -64.9307, countryCode: "VI", viatorId: "965", placeId: "st-thomas" },
  { slug: "philipsburg", name: "St. Maarten (Philipsburg)", lat: 18.0257, lon: -63.0453, countryCode: "SX", viatorId: "5627", placeId: "philipsburg" },
];

interface Experience {
  id: string;
  source: "viator" | "getyourguide" | "alaska_shore_excursions" | "official_provider";
  source_product_id: string;
  title: string;
  place_id: string;
  category: string;
  duration: string;
  meeting_point: string;
  price_from: number | null;
  booking_url: string;
  image_url: string;
}

// Helper to choose highest resolution variant
function chooseBestImageUrl(product: any): string {
  if (!product.images) return "";
  const variants =
    product.images
      ?.flatMap((image: any) => image.variants ?? [])
      .sort((left: any, right: any) => (right.width ?? 0) * (right.height ?? 0) - (left.width ?? 0) * (left.height ?? 0)) ??
    [];

  return variants.find((variant: any) => variant.url)?.url ?? "";
}

function formatDuration(duration: any): string | null {
  if (!duration) return null;
  if (duration.fixedDurationInMinutes) {
    return `${duration.fixedDurationInMinutes} minutes`;
  }
  if (duration.variableDurationFromMinutes && duration.variableDurationToMinutes) {
    return `${duration.variableDurationFromMinutes}-${duration.variableDurationToMinutes} minutes`;
  }
  return null;
}

function inferCategory(product: any): string {
  const titleAndDescription = `${product.title ?? ""} ${product.description ?? ""}`.toLowerCase();
  if (/\bswamp\b|\bbayou\b|\bkayak\b/.test(titleAndDescription)) {
    return "swamp";
  }
  if (/\bfood\b|\bculinary\b|\bcreole\b|\bcocktail\b/.test(titleAndDescription)) {
    return "food";
  }
  if (/\bghost\b|\bfrench quarter\b|\bgarden district\b|\bwalking\b|\btrem[eè]\b|\bhistory\b/.test(titleAndDescription)) {
    return "walking";
  }
  if (/\briver\b|\bsteamboat\b|\bcruise\b|\bmississippi\b/.test(titleAndDescription)) {
    return "river";
  }
  if (/\btransportation\b|\bairport\b|\btransfer\b/.test(titleAndDescription)) {
    return "transportation";
  }
  return "shore-excursion";
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "product"
  );
}

function buildExperienceId(productCode: string, placeId: string): string {
  return `viator-${placeId}-${slugify(productCode)}`;
}

export async function GET(request: Request) {
  // Guard the pipeline from unauthorized external hits
  const { searchParams } = new URL(request.url);
  const authKey = searchParams.get("key");
  if (authKey !== process.env.INTERNAL_CRON_KEY) {
    return NextResponse.json({ error: "Unauthorized payload request" }, { status: 401 });
  }

  const force = searchParams.get("force") === "true";
  const results = [];
  const allNewExperiences: Experience[] = [];

  for (const target of HARVEST_QUEUE) {
    try {
      const cacheKey = `market:${target.slug}`;

      // 1. Check if the destination is already locked into the edge cache
      const exists = await redis.exists(cacheKey);
      if (exists && !force) {
        results.push({ slug: target.slug, status: "skipped", reason: "Already fully hydrated" });
        continue;
      }

      // 2. Fetch Live Viator products
      const res = await fetch("https://api.viator.com/partner/products/search", {
        method: "POST",
        headers: {
          Accept: "application/json;version=2.0",
          "Accept-Language": "en-US",
          "Content-Type": "application/json",
          "exp-api-key": process.env.VIATOR_API_KEY || "",
        },
        body: JSON.stringify({
          filtering: { destination: target.viatorId, includeAutomaticTranslations: true },
          sorting: { sort: "TRAVELER_RATING", order: "DESCENDING" },
          pagination: { start: 1, count: 10 },
          currency: "USD",
        }),
      });

      if (!res.ok) {
        results.push({ slug: target.slug, status: "failed", error: `Viator API returned status ${res.status}` });
        continue;
      }

      const data = await res.json();
      const products = data.products || [];

      // 3. Normalize into Experience records & affiliate deck
      const normalizedExperiences: Experience[] = [];
      const affiliateDeck = [];

      for (const product of products) {
        if (!product.productCode || !product.title) continue;

        const rawBookingUrl = product.productUrl || "";
        const bookingUrl = rawBookingUrl.startsWith("http") ? appendViatorAttribution(rawBookingUrl) : rawBookingUrl;
        const imageUrl = chooseBestImageUrl(product) || "/images/fallback-tour.png";

        const exp: Experience = {
          id: buildExperienceId(product.productCode, target.placeId),
          source: "viator",
          source_product_id: product.productCode,
          title: product.title,
          place_id: target.placeId,
          category: inferCategory(product),
          duration: formatDuration(product.duration) || "Duration varies",
          meeting_point: "Meeting point varies by Viator product.",
          price_from: product.pricing?.summary?.fromPrice ?? null,
          booking_url: bookingUrl,
          image_url: imageUrl,
        };

        normalizedExperiences.push(exp);
        allNewExperiences.push(exp);

        affiliateDeck.push({
          id: exp.id,
          title: exp.title,
          price: exp.price_from,
          operator: "Viator",
          deepLink: exp.booking_url,
        });
      }

      // 4. Construct the complete, unified decision dossier payload
      const hydrationPayload = {
        slug: target.slug,
        marketId: `${target.slug}-${target.countryCode.toLowerCase()}`,
        coordinates: { lat: target.lat, lon: target.lon },
        inventory: affiliateDeck,
        lastHydrated: new Date().toISOString(),
      };

      // 5. Force write the entry directly to the Upstash Redis edge instance
      await redis.set(cacheKey, JSON.stringify(hydrationPayload));

      results.push({ slug: target.slug, status: "hydrated", toursCount: normalizedExperiences.length });
    } catch (error: any) {
      results.push({ slug: target.slug, status: "failed", error: error.message });
    }
  }

  // 6. Bulk upsert experiences to the dcc:experiences array key
  if (allNewExperiences.length > 0) {
    try {
      const existingExperiences = (await redis.get<Experience[]>("dcc:experiences")) ?? [];
      const byId = new Map(existingExperiences.map((record) => [record.id, record]));

      for (const record of allNewExperiences) {
        byId.set(record.id, record);
      }

      const nextExperiences = Array.from(byId.values());
      await redis.set("dcc:experiences", nextExperiences);
    } catch (error: any) {
      return NextResponse.json({ processed: results, errorUpserting: error.message, timestamp: new Date().toISOString() });
    }
  }

  return NextResponse.json({ processed: results, timestamp: new Date().toISOString() });
}
