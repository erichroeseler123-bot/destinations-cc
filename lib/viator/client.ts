import fs from "fs";
import path from "path";
import { getViatorCapabilities } from "@/lib/viator/access";
import { getViatorServerConfig } from "@/lib/viator/config";
import {
  ViatorReviewSchema,
  ViatorTagCatalogItemSchema,
  type ViatorReview,
  type ViatorTagCatalogItem,
} from "@/lib/viator/schema";

type ViatorRequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  acceptLanguage?: string;
};

type ViatorClient = {
  listDestinations(): Promise<unknown>;
  listTags(): Promise<ViatorTagCatalogItem[]>;
  searchProducts(input: Record<string, unknown>): Promise<unknown>;
  getProductDetail(productCode: string): Promise<unknown>;
  getProductsModifiedSince(cursor?: string): Promise<unknown>;
  getAvailabilitySchedulesModifiedSince(cursor?: string): Promise<unknown>;
  getProductSchedules(productCode: string): Promise<unknown>;
  getProductReviews(productCode: string, body?: Record<string, unknown>): Promise<ViatorReview[]>;
  probeCapabilities(): Promise<Record<string, string>>;
};

const ROOT = process.cwd();
const DESTINATIONS_CACHE_PATH = path.join(ROOT, "data", "viator-destinations.json");
const LEGACY_DESTINATIONS_PATH = path.join(ROOT, "data", "destinations.json");
const TAGS_CACHE_PATH = path.join(ROOT, "data", "viator-tags.json");

function readJsonFile<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function withVersionHeader(acceptLanguage: string, apiKey: string): HeadersInit {
  return {
    Accept: "application/json;version=2.0",
    "Accept-Language": acceptLanguage,
    "Content-Type": "application/json;charset=UTF-8",
    "exp-api-key": apiKey,
  };
}

async function request(endpoint: string, options: ViatorRequestOptions = {}): Promise<unknown> {
  const config = getViatorServerConfig();
  if (!config.apiKey) {
    throw new Error("missing_viator_api_key");
  }

  const response = await fetch(`${config.apiBase}${endpoint}`, {
    method: options.method || "GET",
    headers: withVersionHeader(options.acceptLanguage || config.locale, config.apiKey),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });

  if (!response.ok) {
    const message = (await response.text()).slice(0, 200);
    throw new Error(`viator_http_${response.status}:${message}`);
  }

  return response.json();
}

function readDestinationsCache(): unknown {
  const cached = readJsonFile<unknown>(DESTINATIONS_CACHE_PATH);
  if (cached) return cached;
  return readJsonFile<unknown>(LEGACY_DESTINATIONS_PATH) || { destinations: [] };
}

function readTagsCache(): ViatorTagCatalogItem[] {
  const cached = readJsonFile<unknown>(TAGS_CACHE_PATH);
  if (!Array.isArray(cached)) return [];
  return cached
    .map((row) => ViatorTagCatalogItemSchema.safeParse(row))
    .filter((row): row is { success: true; data: ViatorTagCatalogItem } => row.success)
    .map((row) => row.data);
}

export function getViatorClient(): ViatorClient {
  return {
    async listDestinations() {
      if (!getViatorServerConfig().apiKey) return readDestinationsCache();
      return request("/destinations");
    },

    async listTags() {
      if (!getViatorCapabilities().canUseTags) return readTagsCache();
      if (!getViatorServerConfig().apiKey) return readTagsCache();
      const data = (await request("/products/tags")) as { tags?: unknown[] } | unknown[];
      const rows = Array.isArray(data) ? data : Array.isArray((data as { tags?: unknown[] }).tags) ? (data as { tags?: unknown[] }).tags || [] : [];
      return rows
        .map((row) => ViatorTagCatalogItemSchema.safeParse(row))
        .filter((row): row is { success: true; data: ViatorTagCatalogItem } => row.success)
        .map((row) => row.data);
    },

    async searchProducts(input: Record<string, unknown>) {
      if (!getViatorCapabilities().canUseSearch) {
        throw new Error("viator_search_not_enabled_for_tier");
      }
      return request("/products/search", { method: "POST", body: input });
    },

    async getProductDetail(productCode: string) {
      return request(`/products/${encodeURIComponent(productCode)}`);
    },

    async getProductsModifiedSince(cursor?: string) {
      return request(`/products/modified-since${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`);
    },

    async getAvailabilitySchedulesModifiedSince(cursor?: string) {
      return request(
        `/availability/schedules/modified-since${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`
      );
    },

    async getProductSchedules(productCode: string) {
      return request(`/availability/schedules/${encodeURIComponent(productCode)}`);
    },

    async getProductReviews(productCode: string, body: Record<string, unknown> = {}) {
      const data = (await request("/reviews/product", {
        method: "POST",
        body: { productCode, ...body },
      })) as { reviews?: unknown[] } | unknown[];
      const rows = Array.isArray(data) ? data : Array.isArray((data as { reviews?: unknown[] }).reviews) ? (data as { reviews?: unknown[] }).reviews || [] : [];
      return rows
        .map((row) => ViatorReviewSchema.safeParse(row))
        .filter((row): row is { success: true; data: ViatorReview } => row.success)
        .map((row) => row.data);
    },

    async probeCapabilities() {
      const config = getViatorServerConfig();
      const caps = getViatorCapabilities(config.accessTier);
      const snapshot: Record<string, string> = {
        accessTier: config.accessTier,
        apiConfigured: config.apiKey ? "yes" : "no",
        destinations: "cached_only",
        tags: "cached_only",
        search: caps.canUseSearch ? "enabled_by_tier" : "disabled_by_tier",
        modifiedSince: caps.canUseModifiedSince ? "enabled_by_tier" : "disabled_by_tier",
        schedules: caps.canUseSchedules ? "enabled_by_tier" : "disabled_by_tier",
        booking: caps.canUseBooking ? "enabled_by_tier" : "disabled_by_tier",
      };

      if (!config.apiKey) return snapshot;

      const probes: Array<[string, () => Promise<unknown>]> = [
        ["destinations", () => request("/destinations")],
        ["tags", () => request("/products/tags")],
        ["search", () => request("/products/search", { method: "POST", body: { pagination: { start: 1, count: 1 } } })],
      ];

      if (caps.canUseModifiedSince) {
        probes.push(["modifiedSince", () => request("/products/modified-since?count=1")]);
      }

      for (const [label, probe] of probes) {
        try {
          await probe();
          snapshot[label] = "ok";
        } catch (error) {
          snapshot[label] = error instanceof Error ? error.message : "probe_failed";
        }
      }

      return snapshot;
    },
  };
}
