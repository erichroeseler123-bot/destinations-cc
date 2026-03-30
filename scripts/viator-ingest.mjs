#!/usr/bin/env node

import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");

const PRODUCTS_PATH = path.join(DATA_DIR, "viator-products.catalog.json");
const SCHEDULES_PATH = path.join(DATA_DIR, "viator-availability.catalog.json");
const STATE_PATH = path.join(DATA_DIR, "viator-ingestion-state.json");

dotenv.config({
  path: path.join(ROOT, ".env.local"),
});

const API_KEY = process.env.VIATOR_API_KEY;
const API_BASE = process.env.VIATOR_API_BASE || "https://api.viator.com/partner";
const PAGE_SIZE = Math.min(Number(process.env.VIATOR_INGEST_COUNT || 500) || 500, 500);
const ACCEPT_LANGUAGE = process.env.VIATOR_LOCALE || "en-US";

if (!API_KEY) {
  console.error("VIATOR_API_KEY missing");
  process.exit(1);
}

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function headers() {
  return {
    Accept: "application/json;version=2.0",
    "Accept-Language": ACCEPT_LANGUAGE,
    "Content-Type": "application/json;charset=UTF-8",
    "exp-api-key": API_KEY,
  };
}

async function request(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "GET",
    headers: headers(),
    cache: "no-store",
  });

  if (!response.ok) {
    const message = (await response.text()).slice(0, 500);
    throw new Error(`viator_http_${response.status}:${message}`);
  }

  return response.json();
}

function buildEndpoint(basePath, cursor) {
  const params = new URLSearchParams();
  params.set("count", String(PAGE_SIZE));
  if (cursor) params.set("cursor", cursor);
  return `${basePath}?${params.toString()}`;
}

function readRows(payload, key) {
  if (payload && typeof payload === "object" && Array.isArray(payload[key])) {
    return payload[key];
  }

  if (payload && typeof payload === "object") {
    const firstArray = Object.values(payload).find((value) => Array.isArray(value));
    if (Array.isArray(firstArray)) return firstArray;
  }

  return [];
}

function extractProductCode(record) {
  if (!record || typeof record !== "object") return null;
  const productCode = record.productCode || record.product_code || record.code;
  return typeof productCode === "string" && productCode.trim().length > 0 ? productCode : null;
}

function extractPrice(record) {
  const candidates = [
    record?.pricing?.summary?.fromPrice,
    record?.pricing?.fromPrice,
    record?.price?.fromPrice,
    record?.price?.amount,
    record?.fromPrice,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
  }

  return null;
}

function extractCurrency(record) {
  const candidates = [
    record?.pricing?.summary?.currency,
    record?.pricing?.currency,
    record?.price?.currency,
    record?.currency,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length >= 3) return candidate;
  }

  return "USD";
}

function extractImageUrl(record) {
  const direct = [
    record?.images?.[0]?.variants?.[0]?.url,
    record?.images?.[0]?.source,
    record?.images?.[0]?.url,
    record?.image?.url,
    record?.thumbnailHiResURL,
  ];

  for (const candidate of direct) {
    if (typeof candidate === "string" && candidate.trim().length > 0) return candidate;
  }

  return null;
}

function extractDurationMinutes(record) {
  const candidates = [
    record?.durationInMinutes,
    record?.duration?.fixedDurationInMinutes,
    record?.duration?.durationInMinutes,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
  }

  return null;
}

function extractReviewCount(record) {
  const candidates = [
    record?.reviews?.totalReviews,
    record?.reviews?.total,
    record?.reviews?.reviewCount,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
  }

  return null;
}

function extractRating(record) {
  const candidates = [
    record?.reviews?.combinedAverageRating,
    record?.reviews?.averageRating,
    record?.reviews?.average,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
  }

  return null;
}

function extractPrimaryDestination(record) {
  const destination =
    record?.primaryDestination ||
    record?.destination ||
    record?.destinations?.find?.((row) => row && typeof row === "object");

  if (!destination || typeof destination !== "object") {
    return {
      id: null,
      name: null,
    };
  }

  const id = destination.id ?? destination.destinationId ?? null;
  const name = destination.name ?? null;

  return {
    id: typeof id === "number" ? id : null,
    name: typeof name === "string" && name.trim().length > 0 ? name : null,
  };
}

function normalizeProduct(record) {
  const productCode = extractProductCode(record);
  if (!productCode) return null;

  const destination = extractPrimaryDestination(record);
  const title =
    (typeof record?.title === "string" && record.title.trim().length > 0 && record.title) ||
    (typeof record?.name === "string" && record.name.trim().length > 0 && record.name) ||
    productCode;

  return {
    product_code: productCode,
    id: productCode,
    name: title,
    title,
    description:
      (typeof record?.description === "string" && record.description) ||
      (typeof record?.shortDescription === "string" && record.shortDescription) ||
      "",
    short_description:
      (typeof record?.shortDescription === "string" && record.shortDescription) || null,
    destination: destination.name,
    destinationId: destination.id,
    destinationSlug: destination.name ? slugify(destination.name) : null,
    city: destination.name,
    citySlug: destination.name ? slugify(destination.name) : null,
    price_from: extractPrice(record),
    currency: extractCurrency(record),
    rating: extractRating(record),
    review_count: extractReviewCount(record),
    duration_minutes: extractDurationMinutes(record),
    image_url: extractImageUrl(record),
    supplier_name:
      typeof record?.supplierName === "string"
        ? record.supplierName
        : typeof record?.supplier?.name === "string"
          ? record.supplier.name
          : null,
    booking_confirmation_type:
      typeof record?.confirmationType === "string" ? record.confirmationType : null,
    product_option_count: Array.isArray(record?.productOptions) ? record.productOptions.length : null,
    product_option_titles: Array.isArray(record?.productOptions)
      ? record.productOptions
          .map((option) => (typeof option?.title === "string" ? option.title.trim() : ""))
          .filter(Boolean)
      : null,
    tags: Array.isArray(record?.tags)
      ? record.tags
          .map((tag) => tag?.tagId ?? tag?.id)
          .filter((value) => Number.isInteger(value))
      : [],
    viatorUrl:
      (typeof record?.webUrl === "string" && record.webUrl) ||
      (typeof record?.productUrl === "string" && record.productUrl) ||
      null,
    lastUpdated: new Date().toISOString(),
    raw: record,
  };
}

async function paginateDelta(basePath, itemKey, startCursor) {
  const records = [];
  let cursor = startCursor || null;
  let resumeCursor = startCursor || null;
  let pages = 0;

  while (true) {
    const endpoint = buildEndpoint(basePath, cursor);
    const payload = await request(endpoint);
    const batch = readRows(payload, itemKey);
    pages += 1;

    if (Array.isArray(batch) && batch.length > 0) {
      records.push(...batch);
    }

    if (typeof payload?.nextCursor === "string" && payload.nextCursor.length > 0) {
      resumeCursor = payload.nextCursor;
      cursor = payload.nextCursor;
      continue;
    }

    break;
  }

  return {
    records,
    resumeCursor,
    pages,
  };
}

function upsertByKey(rows, keyField) {
  const map = new Map();
  for (const row of rows) {
    const key = row?.[keyField];
    if (typeof key === "string" && key.length > 0) {
      map.set(key, row);
    }
  }
  return map;
}

async function main() {
  await ensureDataDir();

  const state = await readJson(STATE_PATH, {
    updatedAt: null,
    products: { cursor: null, pages: 0, totalRecords: 0 },
    schedules: { cursor: null, pages: 0, totalRecords: 0 },
  });

  const existingProducts = await readJson(PRODUCTS_PATH, {
    updatedAt: null,
    source: "modified-since",
    productCount: 0,
    products: [],
  });

  const existingSchedules = await readJson(SCHEDULES_PATH, {
    updatedAt: null,
    source: "modified-since",
    scheduleCount: 0,
    schedules: [],
  });

  console.log("Viator ingestion starting");
  console.log(`Products cursor: ${state?.products?.cursor || "initial_full_ingest"}`);
  console.log(`Schedules cursor: ${state?.schedules?.cursor || "initial_full_ingest"}`);

  const productsDelta = await paginateDelta(
    "/products/modified-since",
    "products",
    state?.products?.cursor || null
  );
  const schedulesDelta = await paginateDelta(
    "/availability/schedules/modified-since",
    "availabilitySchedules",
    state?.schedules?.cursor || null
  );

  const productMap = upsertByKey(existingProducts.products || [], "product_code");
  for (const rawProduct of productsDelta.records) {
    const normalized = normalizeProduct(rawProduct);
    if (!normalized) continue;
    productMap.set(normalized.product_code, normalized);
  }

  const scheduleMap = upsertByKey(existingSchedules.schedules || [], "productCode");
  for (const schedule of schedulesDelta.records) {
    const productCode = extractProductCode(schedule);
    if (!productCode) continue;
    scheduleMap.set(productCode, {
      productCode,
      lastUpdated: new Date().toISOString(),
      raw: schedule,
    });
  }

  const now = new Date().toISOString();
  const nextState = {
    updatedAt: now,
    products: {
      cursor: productsDelta.resumeCursor,
      pages: productsDelta.pages,
      totalRecords: productsDelta.records.length,
    },
    schedules: {
      cursor: schedulesDelta.resumeCursor,
      pages: schedulesDelta.pages,
      totalRecords: schedulesDelta.records.length,
    },
  };

  const nextProducts = {
    updatedAt: now,
    source: "modified-since",
    productCount: productMap.size,
    products: Array.from(productMap.values()),
  };

  const nextSchedules = {
    updatedAt: now,
    source: "modified-since",
    scheduleCount: scheduleMap.size,
    schedules: Array.from(scheduleMap.values()),
  };

  await writeJson(PRODUCTS_PATH, nextProducts);
  await writeJson(SCHEDULES_PATH, nextSchedules);
  await writeJson(STATE_PATH, nextState);

  console.log(`Products fetched this run: ${productsDelta.records.length}`);
  console.log(`Schedules fetched this run: ${schedulesDelta.records.length}`);
  console.log(`Normalized products stored: ${nextProducts.productCount}`);
  console.log(`Schedules stored: ${nextSchedules.scheduleCount}`);
  console.log(`Wrote: ${PRODUCTS_PATH}`);
  console.log(`Wrote: ${SCHEDULES_PATH}`);
  console.log(`Wrote: ${STATE_PATH}`);
}

main().catch((error) => {
  console.error("Viator ingestion failed");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
