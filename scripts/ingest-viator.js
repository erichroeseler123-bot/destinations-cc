/**
 * scripts/ingest-viator.js
 *
 * Pull a curated list of tours from Viator Partner API and write:
 *   data/vegas.tours.json
 *
 * Works as an ES module ("type": "module" in package.json).
 *
 * ENV REQUIRED:
 *   VIATOR_API_KEY=xxxxx                 (Partner API key; sent as "exp-api-key")  (See Viator partner API usage patterns)  :contentReference[oaicite:2]{index=2}
 *
 * ENV OPTIONAL (affiliate tracking):
 *   VIATOR_PID=destinationcommandcenter  (your affiliate PID / partner id used in links)
 *   VIATOR_CAMPAIGN=dcc-las-vegas        (campaign for attribution)
 *
 * ENV OPTIONAL (search tuning):
 *   VIATOR_MARKET=US
 *   VIATOR_CURRENCY=USD
 *   VIATOR_ACCEPT_LANGUAGE=en-US
 *   VIATOR_DESTINATION_ID=684            (skip taxonomy lookup and use this id)
 *
 * CLI OPTIONAL:
 *   --destination "Las Vegas"
 *   --destinationId 684
 *   --limit 12
 *   --out data/vegas.tours.json
 *
 * NOTES:
 * - Link attribution: Viator documents adding affiliate attribution via PID/campaign parameters. :contentReference[oaicite:3]{index=3}
 * - Exact response fields can vary by API version. This script is defensive and will still write a usable file.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const API_BASE = "https://api.viator.com";
const DEFAULT_OUT = "data/vegas.tours.json";

function arg(name, fallback = null) {
  const idx = process.argv.findIndex((a) => a === `--${name}`);
  if (idx === -1) return fallback;
  const val = process.argv[idx + 1];
  if (!val || val.startsWith("--")) return fallback;
  return val;
}

function intArg(name, fallback) {
  const v = arg(name, null);
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

function safeNumber(x, fallback = null) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function pickFirst(...vals) {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
  return null;
}

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Add affiliate attribution to a URL.
 * Viator supports affiliate attribution using partner identifiers + campaign parameters. :contentReference[oaicite:4]{index=4}
 */
function withAttribution(url, { pid, campaign } = {}) {
  if (!url) return url;

  // If you don't provide PID, keep the URL as-is.
  if (!pid) return url;

  try {
    const u = new URL(url);
    // Common affiliate patterns:
    // - pid (partner id)
    // - mcid / campaign / utm-ish variants
    // Your Viator partner documentation explains attribution expectations. :contentReference[oaicite:5]{index=5}
    if (!u.searchParams.get("pid")) u.searchParams.set("pid", pid);
    if (campaign && !u.searchParams.get("campaign")) u.searchParams.set("campaign", campaign);
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Partner API request wrapper.
 * Viator partner flows use an API key sent as "exp-api-key". :contentReference[oaicite:6]{index=6}
 */
async function viatorFetchJson(endpointPath, { method = "GET", body = null, apiKey }) {
  const url = endpointPath.startsWith("http")
    ? endpointPath
    : `${API_BASE}${endpointPath}`;

  const headers = {
    "Accept": "application/json",
    "Content-Type": "application/json; charset=utf-8",
    "exp-api-key": apiKey,
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = `Viator API ${method} ${endpointPath} failed: ${res.status} ${res.statusText}\n` +
      `Response: ${text?.slice(0, 800)}`;
    throw new Error(msg);
  }

  return json;
}

/**
 * Optional taxonomy lookup:
 * If you don't know destinationId, try to find it by name.
 * (The exact taxonomy endpoints differ by partner API version; this is best-effort.)
 */
async function findDestinationIdByName({ apiKey, destinationName, market = "US", acceptLanguage = "en-US" }) {
  // Best-effort taxonomy call; if it fails, user can set VIATOR_DESTINATION_ID.
  // Some partner implementations use: /partner/v1/taxonomy/destinations
  const candidates = [
    `/partner/v1/taxonomy/destinations?parentId=0&count=200&market=${encodeURIComponent(market)}&acceptLanguage=${encodeURIComponent(acceptLanguage)}`,
    `/partner/v1/taxonomy/destinations?count=200&market=${encodeURIComponent(market)}&acceptLanguage=${encodeURIComponent(acceptLanguage)}`,
  ];

  const nameNeedle = destinationName.trim().toLowerCase();

  for (const ep of candidates) {
    try {
      const data = await viatorFetchJson(ep, { apiKey });
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const hit = list.find((d) => String(d?.destinationName || d?.name || "").toLowerCase() === nameNeedle)
        || list.find((d) => String(d?.destinationName || d?.name || "").toLowerCase().includes(nameNeedle));

      const id = pickFirst(hit?.destinationId, hit?.id);
      if (id) return Number(id);
    } catch {
      // try next candidate
    }
  }

  return null;
}

/**
 * Search products for a destinationId.
 * Many partner examples use POST /partner/products/search. :contentReference[oaicite:7]{index=7}
 */
async function searchProducts({
  apiKey,
  destinationId,
  limit = 12,
  currency = "USD",
  acceptLanguage = "en-US",
}) {
  const body = {
    // typical partner payload pattern:
    destinations: [destinationId],
    currency,
    topX: limit,
    sortOrder: "RELEVANCE",
    // keep it simple and durable
  };

  // Viator partner examples show this path pattern. :contentReference[oaicite:8]{index=8}
  const data = await viatorFetchJson(`/partner/products/search`, {
    method: "POST",
    body,
    apiKey,
  });

  // Common shapes:
  // - { data: { products: [...] } }
  // - { data: [...] }
  const products =
    (Array.isArray(data?.data?.products) && data.data.products) ||
    (Array.isArray(data?.data) && data.data) ||
    (Array.isArray(data?.products) && data.products) ||
    [];

  return products;
}

function normalizeProductToTour(p, { nodeSlug, pid, campaign }) {
  const productCode = pickFirst(p?.productCode, p?.code, p?.id);
  const title = pickFirst(p?.title, p?.name, p?.productTitle) || "Viator Experience";

  const rating = safeNumber(pickFirst(p?.rating, p?.reviews?.combinedAverageRating, p?.reviewSummary?.rating), null);
  const reviews = safeNumber(pickFirst(p?.reviews?.totalReviews, p?.reviewCount, p?.reviewSummary?.reviewCount), null);

  const priceFrom =
    safeNumber(
      pickFirst(
        p?.pricing?.summary?.fromPrice,
        p?.pricing?.fromPrice,
        p?.price?.from,
        p?.priceFrom,
        p?.fromPrice
      ),
      null
    );

  const duration =
    pickFirst(
      p?.itinerary?.duration,
      p?.duration,
      p?.productDuration,
      p?.durationFrom,
      null
    );

  // Try to find a usable URL
  const rawUrl =
    pickFirst(
      p?.webURL,
      p?.productUrl,
      p?.url,
      p?.bookingUrl,
      null
    );

  const image =
    pickFirst(
      p?.images?.[0]?.variants?.[0]?.url,
      p?.images?.[0]?.url,
      p?.primaryImageUrl,
      p?.thumbnailUrl,
      null
    );

  // Tags: try to map from API tags/categories; fallback to empty
  const tagsRaw =
    (Array.isArray(p?.tags) && p.tags) ||
    (Array.isArray(p?.productTags) && p.productTags) ||
    (Array.isArray(p?.categories) && p.categories.map((c) => c?.name || c).filter(Boolean)) ||
    [];

  const tags = tagsRaw
    .map((t) => slugify(t))
    .filter(Boolean)
    .slice(0, 10);

  const booking_url = withAttribution(rawUrl, { pid, campaign });

  return {
    id: slugify(productCode || title),
    product_code: productCode || null,
    name: title,
    provider: "Viator",
    duration: duration ? String(duration) : null,
    price_from: priceFrom,
    rating,
    reviews,
    tags,
    image_url: image,
    booking_url,
    dcc: {
      node: nodeSlug,
      category: "tours",
      ingested_at: nowIso(),
      version: "1.0",
      source: "viator_partner_api",
    },
  };
}

async function main() {
  const apiKey = process.env.VIATOR_API_KEY;
  if (!apiKey) {
    console.error("❌ Missing VIATOR_API_KEY in environment.");
    process.exit(1);
  }

  const pid = process.env.VIATOR_PID || null;
  const campaign = process.env.VIATOR_CAMPAIGN || "dcc-las-vegas";

  const market = process.env.VIATOR_MARKET || "US";
  const currency = process.env.VIATOR_CURRENCY || "USD";
  const acceptLanguage = process.env.VIATOR_ACCEPT_LANGUAGE || "en-US";

  const outPath = arg("out", DEFAULT_OUT);
  const limit = intArg("limit", 12);

  const nodeSlug = arg("node", "las-vegas");
  const destinationName = arg("destination", "Las Vegas");

  let destinationId = intArg("destinationId", null) ?? safeNumber(process.env.VIATOR_DESTINATION_ID, null);

  if (!destinationId) {
    console.log(`🔎 No destinationId provided. Trying taxonomy lookup for "${destinationName}"...`);
    destinationId = await findDestinationIdByName({
      apiKey,
      destinationName,
      market,
      acceptLanguage,
    });
  }

  if (!destinationId) {
    console.error(
      "❌ Could not determine destinationId.\n" +
      "Fix: set VIATOR_DESTINATION_ID in .env.local (recommended) or pass --destinationId <id>.\n"
    );
    process.exit(1);
  }

  console.log(`🔄 Ingesting Viator products for destinationId=${destinationId} (limit=${limit})...`);

  const products = await searchProducts({
    apiKey,
    destinationId,
    limit,
    currency,
    acceptLanguage,
  });

  const tours = products.map((p) => normalizeProductToTour(p, { nodeSlug, pid, campaign }));

  ensureDir(outPath);
  fs.writeFileSync(outPath, JSON.stringify(tours, null, 2), "utf8");

  console.log(`✅ Wrote ${tours.length} tours → ${outPath}`);
  if (pid) console.log(`🔗 Affiliate attribution enabled (pid=${pid}, campaign=${campaign}).`);
  else console.log(`ℹ️ Affiliate attribution NOT added (set VIATOR_PID to enable).`);
}

main().catch((err) => {
  console.error("❌ Ingest failed:", err?.message || err);
  process.exit(1);
});

