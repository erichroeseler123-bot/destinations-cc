import fs from "fs";
import path from "path";
import { getViatorCapabilities } from "@/lib/viator/access";
import { getViatorServerConfig, normalizeViatorCurrency } from "@/lib/viator/config";
import {
  ViatorDestinationCatalogSchema,
  ViatorDestinationCatalogRowSchema,
  ViatorReviewSchema,
  ViatorTagCatalogSchema,
  ViatorTagCatalogItemSchema,
  type ViatorReview,
  type ViatorDestinationCatalog,
  type ViatorDestinationCatalogRow,
  type ViatorTagCatalog,
  type ViatorTagCatalogItem,
} from "@/lib/viator/schema";

type ViatorRequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  acceptLanguage?: string;
};

type ViatorClient = {
  listDestinations(): Promise<ViatorDestinationCatalog>;
  listTags(): Promise<ViatorTagCatalog>;
  searchProducts(input: Record<string, unknown>): Promise<unknown>;
  getProductDetail(productCode: string): Promise<unknown>;
  getProductsModifiedSince(cursor?: string): Promise<unknown>;
  getAvailabilitySchedulesModifiedSince(cursor?: string): Promise<unknown>;
  getProductSchedules(productCode: string): Promise<unknown>;
  checkAvailability(input: Record<string, unknown>): Promise<unknown>;
  getProductBookingQuestions(productCode: string): Promise<unknown[]>;
  getExchangeRates(currency?: string): Promise<unknown>;
  getLocationsBulk(locationReferences: string[]): Promise<unknown>;
  createCartHold(input: Record<string, unknown>): Promise<unknown>;
  createCartBooking(input: Record<string, unknown>): Promise<unknown>;
  submitPaymentAccount(paymentDataSubmissionUrl: string, input: Record<string, unknown>): Promise<unknown>;
  getBookingStatus(input: Record<string, unknown>): Promise<unknown>;
  getCancelReasons(): Promise<unknown>;
  getCancelQuote(bookingReference: string): Promise<unknown>;
  cancelBooking(bookingReference: string, input: Record<string, unknown>): Promise<unknown>;
  checkAmendment(bookingReference: string): Promise<unknown>;
  quoteAmendment(input: Record<string, unknown>): Promise<unknown>;
  amendBooking(quoteReference: string, input?: Record<string, unknown>): Promise<unknown>;
  getBookingsModifiedSince(input?: { cursor?: string; modifiedSince?: string }): Promise<unknown>;
  acknowledgeBookingsModifiedSince(input: Record<string, unknown>): Promise<unknown>;
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

function getDestinationsEndpoint(): string {
  return "/destinations";
}

function withDefaultSearchCurrency(input: Record<string, unknown>): Record<string, unknown> {
  if (typeof input.currency === "string" && input.currency.trim().length > 0) return input;
  return {
    ...input,
    currency: normalizeViatorCurrency("USD"),
  };
}

function readDestinationsCache(): unknown {
  const cached = readJsonFile<unknown>(DESTINATIONS_CACHE_PATH);
  if (cached) return cached;
  return readJsonFile<unknown>(LEGACY_DESTINATIONS_PATH) || { destinations: [] };
}

function getProbeDestinationId(): number | null {
  const destinations = normalizeDestinationCatalogResponse(readDestinationsCache()).destinations;
  const city = destinations.find((row) => row.type === "CITY");
  return city?.destinationId || destinations[0]?.destinationId || null;
}

export function normalizeDestinationCatalogResponse(value: unknown): ViatorDestinationCatalog {
  const rawRows = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as { destinations?: unknown[] }).destinations)
      ? (value as { destinations?: unknown[] }).destinations || []
      : [];

  if (rawRows.length > 0) {
    const destinations = rawRows
      .map((row) => ViatorDestinationCatalogRowSchema.safeParse(row))
      .filter((row): row is { success: true; data: ViatorDestinationCatalogRow } => row.success)
      .map((row) => row.data);
    return ViatorDestinationCatalogSchema.parse({ destinations });
  }

  const legacyMap =
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.entries(value as Record<string, unknown>)
          .map(([slug, destinationId]) => {
            if (typeof destinationId !== "number") return null;
            const row: ViatorDestinationCatalogRow = {
              destinationId,
              parentDestinationId: null,
              name: slug
                .split("-")
                .filter(Boolean)
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(" "),
              type: "CITY",
              timeZone: null,
              defaultCurrencyCode: "USD",
              countryCode: "US",
            };
            return row;
          })
          .filter((row): row is ViatorDestinationCatalogRow => Boolean(row))
      : [];

  if (legacyMap.length > 0) {
    return ViatorDestinationCatalogSchema.parse({ destinations: legacyMap });
  }

  const destinations: ViatorDestinationCatalogRow[] = [];
  return ViatorDestinationCatalogSchema.parse({ destinations });
}

export function normalizeTagCatalogResponse(value: unknown): ViatorTagCatalog {
  const rawRows = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as { tags?: unknown[] }).tags)
      ? (value as { tags?: unknown[] }).tags || []
      : [];
  const tags = rawRows
    .map((row) => ViatorTagCatalogItemSchema.safeParse(row))
    .filter((row): row is { success: true; data: ViatorTagCatalogItem } => row.success)
    .map((row) => row.data);
  return ViatorTagCatalogSchema.parse({ tags });
}

function readTagsCache(): ViatorTagCatalog {
  const cached = readJsonFile<unknown>(TAGS_CACHE_PATH);
  return normalizeTagCatalogResponse(cached);
}

export function getViatorClient(): ViatorClient {
  return {
    async listDestinations() {
      if (!getViatorServerConfig().apiKey) return normalizeDestinationCatalogResponse(readDestinationsCache());
      return normalizeDestinationCatalogResponse(await request(getDestinationsEndpoint()));
    },

    async listTags() {
      if (!getViatorCapabilities().canUseTags) return readTagsCache();
      if (!getViatorServerConfig().apiKey) return readTagsCache();
      return normalizeTagCatalogResponse(await request("/products/tags"));
    },

    async searchProducts(input: Record<string, unknown>) {
      if (!getViatorCapabilities().canUseSearch) {
        throw new Error("viator_search_not_enabled_for_tier");
      }
      return request("/products/search", { method: "POST", body: withDefaultSearchCurrency(input) });
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

    async checkAvailability(input: Record<string, unknown>) {
      return request("/availability/check", {
        method: "POST",
        body: withDefaultSearchCurrency(input),
      });
    },

    async getProductBookingQuestions(productCode: string) {
      const payload = await request(`/products/booking-questions?productCode=${encodeURIComponent(productCode)}`);
      if (Array.isArray(payload)) return payload;
      if (payload && typeof payload === "object" && Array.isArray((payload as { bookingQuestions?: unknown[] }).bookingQuestions)) {
        return (payload as { bookingQuestions?: unknown[] }).bookingQuestions || [];
      }
      return [];
    },

    async getExchangeRates(currency?: string) {
      const suffix = currency ? `?currency=${encodeURIComponent(normalizeViatorCurrency(currency))}` : "";
      return request(`/exchange-rates${suffix}`);
    },

    async getLocationsBulk(locationReferences: string[]) {
      const uniqueReferences = Array.from(
        new Set(locationReferences.map((value) => String(value || "").trim()).filter(Boolean))
      );
      if (uniqueReferences.length === 0) return { locations: [] };
      if (uniqueReferences.length > 500) {
        throw new Error("viator_locations_bulk_limit_exceeded");
      }
      return request("/locations/bulk", {
        method: "POST",
        body: { locations: uniqueReferences },
      });
    },

    async createCartHold(input: Record<string, unknown>) {
      return request("/bookings/cart/hold", {
        method: "POST",
        body: input,
      });
    },

    async createCartBooking(input: Record<string, unknown>) {
      return request("/bookings/cart/book", {
        method: "POST",
        body: input,
      });
    },

    async submitPaymentAccount(paymentDataSubmissionUrl: string, input: Record<string, unknown>) {
      const config = getViatorServerConfig();
      if (!config.apiKey) {
        throw new Error("missing_viator_api_key");
      }

      const response = await fetch(paymentDataSubmissionUrl, {
        method: "POST",
        headers: {
          ...withVersionHeader(config.locale, config.apiKey),
          "x-trip-clientid": config.pid,
          "x-trip-requestid": `dcc-${Date.now()}`,
        },
        body: JSON.stringify(input),
        cache: "no-store",
      });

      if (!response.ok) {
        const message = (await response.text()).slice(0, 200);
        throw new Error(`viator_paymentaccounts_http_${response.status}:${message}`);
      }

      return response.json();
    },

    async getBookingStatus(input: Record<string, unknown>) {
      return request("/bookings/status", {
        method: "POST",
        body: input,
      });
    },

    async getCancelReasons() {
      return request("/bookings/cancel-reasons");
    },

    async getCancelQuote(bookingReference: string) {
      return request(`/bookings/${encodeURIComponent(bookingReference)}/cancel-quote`);
    },

    async cancelBooking(bookingReference: string, input: Record<string, unknown>) {
      return request(`/bookings/${encodeURIComponent(bookingReference)}/cancel`, {
        method: "POST",
        body: input,
      });
    },

    async checkAmendment(bookingReference: string) {
      return request(`/amendment/check/${encodeURIComponent(bookingReference)}`);
    },

    async quoteAmendment(input: Record<string, unknown>) {
      return request("/amendment/quote", {
        method: "POST",
        body: input,
      });
    },

    async amendBooking(quoteReference: string, input: Record<string, unknown> = {}) {
      return request(`/amendment/amend/${encodeURIComponent(quoteReference)}`, {
        method: "POST",
        body: input,
      });
    },

    async getBookingsModifiedSince(input: { cursor?: string; modifiedSince?: string } = {}) {
      const params = new URLSearchParams();
      if (typeof input.cursor === "string" && input.cursor.trim().length > 0) {
        params.set("cursor", input.cursor.trim());
      }
      if (typeof input.modifiedSince === "string" && input.modifiedSince.trim().length > 0) {
        params.set("modified-since", input.modifiedSince.trim());
      }
      const suffix = params.toString() ? `?${params.toString()}` : "";
      return request(`/bookings/modified-since${suffix}`);
    },

    async acknowledgeBookingsModifiedSince(input: Record<string, unknown>) {
      return request("/bookings/modified-since/acknowledge", {
        method: "POST",
        body: input,
      });
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

      const probeDestinationId = getProbeDestinationId();
      const probes: Array<[string, () => Promise<unknown>]> = [
        ["destinations", () => request(getDestinationsEndpoint())],
        ["tags", () => request("/products/tags")],
        [
          "search",
          () =>
            request("/products/search", {
              method: "POST",
              body: withDefaultSearchCurrency({
                filtering: probeDestinationId ? { destination: probeDestinationId } : undefined,
                pagination: { start: 1, count: 1 },
              }),
            }),
        ],
      ];

      if (caps.canUseModifiedSince) {
        probes.push(["modifiedSince", () => request("/products/modified-since?count=1")]);
      }

      let sampleReviewProductCode: string | null = null;
      for (const [label, probe] of probes) {
        try {
          const result = await probe();
          snapshot[label] = "ok";
          if (label === "search" && !sampleReviewProductCode) {
            const record =
              result && typeof result === "object" ? (result as Record<string, unknown>) : null;
            const rows = Array.isArray(record?.products)
              ? record.products
              : Array.isArray(record?.data)
                ? record.data
                : Array.isArray(record?.results)
                  ? record.results
                  : [];
            const first = rows.find(
              (row) =>
                row &&
                typeof row === "object" &&
                typeof (row as { productCode?: unknown }).productCode === "string"
            ) as { productCode?: string } | undefined;
            sampleReviewProductCode = first?.productCode || null;
          }
        } catch (error) {
          snapshot[label] = error instanceof Error ? error.message : "probe_failed";
        }
      }

      if (caps.canUseReviews && sampleReviewProductCode) {
        try {
          await request("/reviews/product", {
            method: "POST",
            body: { productCode: sampleReviewProductCode, count: 1 },
          });
          snapshot.reviews = "ok";
        } catch (error) {
          snapshot.reviews = error instanceof Error ? error.message : "probe_failed";
        }
      } else if (caps.canUseReviews) {
        snapshot.reviews = "unverified";
      }

      return snapshot;
    },
  };
}
