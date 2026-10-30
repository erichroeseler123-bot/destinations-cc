import crypto from "crypto";
import http from "http";
import {
  OctoAvailabilitySlot,
  OctoBookingResult,
  OctoConfirmBookingParams,
  OctoCreateHoldParams,
  OctoProduct,
  OctoUnitItemRequest,
} from "../types";
import { BaseOctoAdapter, OctoApiError } from "./base";
import { OctoClientConfig } from "./types";

/**
 * Rezdy Native REST API v1 Types (inspected from https://developers.rezdy.com/ & GoSno production)
 */
export interface RezdyV1RequestStatus {
  success: boolean;
  version?: string;
  error?: {
    errorCode?: string;
    errorMessage?: string;
  };
}

export interface RezdyV1PriceOption {
  id: number;
  label: string;
  price: number;
  seatsUsed: number;
  minQuantity?: number;
  maxQuantity?: number;
  priceGroupType?: "EACH" | "TOTAL";
  productCode: string;
}

export interface RezdyV1Product {
  productCode: string;
  internalCode?: string;
  name: string;
  shortDescription?: string;
  description?: string;
  productType?: string;
  bookingMode?: "INVENTORY" | "DATE_ENQUIRY" | "NO_DATE";
  currency: string;
  advertisedPrice?: number;
  priceOptions: RezdyV1PriceOption[];
  quantityRequired?: boolean;
  quantityRequiredMin?: number;
  quantityRequiredMax?: number;
  durationMinutes?: number;
  confirmMode?: string;
}

export interface RezdyV1Session {
  id: number;
  productCode: string;
  startTime?: string;
  endTime?: string;
  startTimeLocal: string;
  endTimeLocal?: string;
  allDay?: boolean;
  seats: number;
  seatsAvailable: number;
  priceOptions?: RezdyV1PriceOption[];
}

export interface RezdyV1BookingQuantity {
  optionLabel: string;
  optionPrice?: number;
  value: number;
  priceGroupType?: string;
}

export interface RezdyV1BookingItem {
  productName?: string;
  productCode: string;
  startTimeLocal: string;
  endTimeLocal?: string;
  amount: number;
  subtotal?: number;
  totalItemTax?: number;
  quantities: RezdyV1BookingQuantity[];
  sessionId?: number;
}

export interface RezdyV1Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface RezdyV1Booking {
  orderNumber: string;
  status: "PROCESSING" | "CONFIRMED" | "CANCELLED" | "ABANDONED_CART";
  resellerReference?: string;
  totalAmount: number;
  totalCurrency?: string;
  totalPaid?: number;
  totalDue?: number;
  dateCreated?: string;
  dateConfirmed?: string;
  dateUpdated?: string;
  customer: RezdyV1Customer;
  items: RezdyV1BookingItem[];
  comments?: string;
  internalNotes?: string;
}

export interface RezdyCapturedExchange {
  step: string;
  timestamp: string;
  request: {
    method: string;
    urlRedacted: string;
    headersRedacted: Record<string, string>;
    body: unknown;
  };
  response: {
    status: number;
    body: unknown;
  };
}

/**
 * Canonical GoSno <-> DCC <-> Rezdy v1 Product & Route Mapping Registry
 * Derived from GoSno's authoritative route registry and verified against live Rezdy GET /v1/products/{code}.
 */
export interface GosnoDccProductMapping {
  dccProductId: string;
  routeId: string;
  rezdyProductCode: string;
  internalCode: string;
  title: string;
  origin: string;
  destination: string;
  direction: "OUTBOUND" | "RETURN";
  vehicleClass: "suv" | "van";
  maxPassengers: number;
  optionId: string;
  unitId: string;
  canonicalQuantityLabel: string;
  priceOptionId: number;
  priceDollars: number;
  priceCents: number;
  currency: "USD";
  durationMinutes: number;
  onlineBookable: boolean;
  quoteOnly: boolean;
  meetingPoint: string;
}

export const GOSNO_DCC_PRODUCT_MAPPINGS: readonly GosnoDccProductMapping[] = [
  {
    dccProductId: "dcc:gosno:den-breckenridge:suv",
    routeId: "DEN-BRECKENRIDGE",
    rezdyProductCode: "P7477S",
    internalCode: "denver-to-breckenridge-private-suv",
    title: "Denver Airport to Breckenridge — Private SUV Transfer",
    origin: "DEN",
    destination: "Breckenridge",
    direction: "OUTBOUND",
    vehicleClass: "suv",
    maxPassengers: 6,
    optionId: "opt_suburban_69029050",
    unitId: "unit_suburban_69029050",
    canonicalQuantityLabel: "Suburban",
    priceOptionId: 69029050,
    priceDollars: 399,
    priceCents: 39900,
    currency: "USD",
    durationMinutes: 150,
    onlineBookable: true,
    quoteOnly: false,
    meetingPoint: "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)",
  },
  {
    dccProductId: "dcc:gosno:den-vail:suv",
    routeId: "DEN-VAIL",
    rezdyProductCode: "PXFGPP",
    internalCode: "denver-to-vail-private-suv",
    title: "Denver Airport to Vail — Private SUV Transfer",
    origin: "DEN",
    destination: "Vail",
    direction: "OUTBOUND",
    vehicleClass: "suv",
    maxPassengers: 6,
    optionId: "opt_suburban_75298226",
    unitId: "unit_suburban_75298226",
    canonicalQuantityLabel: "Suburban",
    priceOptionId: 75298226,
    priceDollars: 499,
    priceCents: 49900,
    currency: "USD",
    durationMinutes: 150,
    onlineBookable: true,
    quoteOnly: false,
    meetingPoint: "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)",
  },
  {
    dccProductId: "dcc:gosno:snowmass-den:suv",
    routeId: "SNOWMASS-DEN",
    rezdyProductCode: "PEAVH0",
    internalCode: "GOSNO_SNOWMASS_DEN_SUV",
    title: "Snowmass to Denver Airport — Private SUV Transfer",
    origin: "Snowmass",
    destination: "DEN",
    direction: "RETURN",
    vehicleClass: "suv",
    maxPassengers: 6,
    optionId: "opt_group_76622153",
    unitId: "unit_group_76622153",
    canonicalQuantityLabel: "Group from 1 to 2",
    priceOptionId: 76622153,
    priceDollars: 699,
    priceCents: 69900,
    currency: "USD",
    durationMinutes: 240,
    onlineBookable: true,
    quoteOnly: false,
    meetingPoint: "Confirmed lodging, condo, or private residence access point",
  },
  {
    dccProductId: "dcc:gosno:den-breckenridge:van",
    routeId: "DEN-BRECKENRIDGE-VAN",
    rezdyProductCode: "PKQDPG",
    internalCode: "GOSNO_DEN_BRECKENRIDGE_VAN",
    title: "Denver International Airport (DEN) to Breckenridge - Private Van Transfer",
    origin: "DEN",
    destination: "Breckenridge",
    direction: "OUTBOUND",
    vehicleClass: "van",
    maxPassengers: 10,
    optionId: "opt_van_73379226",
    unitId: "unit_van_73379226",
    canonicalQuantityLabel: "Private Van 10ppl",
    priceOptionId: 73379226,
    priceDollars: 599,
    priceCents: 59900,
    currency: "USD",
    durationMinutes: 150,
    onlineBookable: false,
    quoteOnly: true,
    meetingPoint: "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)",
  },
  {
    dccProductId: "dcc:gosno:den-beaver-creek:suv",
    routeId: "DEN-BEAVER-CREEK",
    rezdyProductCode: "P9AP71",
    internalCode: "denver-to-beaver-creek-private-suv",
    title: "Denver Airport to Beaver Creek — Private SUV Transfer",
    origin: "DEN",
    destination: "Beaver Creek",
    direction: "OUTBOUND",
    vehicleClass: "suv",
    maxPassengers: 6,
    optionId: "opt_suburban_p9ap71",
    unitId: "unit_suburban_p9ap71",
    canonicalQuantityLabel: "Suburban",
    priceOptionId: 69029051,
    priceDollars: 549,
    priceCents: 54900,
    currency: "USD",
    durationMinutes: 150,
    onlineBookable: true,
    quoteOnly: false,
    meetingPoint: "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)",
  },
  {
    dccProductId: "dcc:gosno:den-keystone:suv",
    routeId: "DEN-KEYSTONE",
    rezdyProductCode: "P9PQRN",
    internalCode: "denver-to-keystone-private-suv",
    title: "Denver Airport to Keystone — Private SUV Transfer",
    origin: "DEN",
    destination: "Keystone",
    direction: "OUTBOUND",
    vehicleClass: "suv",
    maxPassengers: 6,
    optionId: "opt_suburban_p9pqrn",
    unitId: "unit_suburban_p9pqrn",
    canonicalQuantityLabel: "Suburban",
    priceOptionId: 69029052,
    priceDollars: 349,
    priceCents: 34900,
    currency: "USD",
    durationMinutes: 150,
    onlineBookable: true,
    quoteOnly: false,
    meetingPoint: "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)",
  },
  {
    dccProductId: "dcc:gosno:den-copper:suv",
    routeId: "DEN-COPPER",
    rezdyProductCode: "PHCYQL",
    internalCode: "denver-to-copper-private-suv",
    title: "Denver Airport to Copper Mountain — Private SUV Transfer",
    origin: "DEN",
    destination: "Copper Mountain",
    direction: "OUTBOUND",
    vehicleClass: "suv",
    maxPassengers: 6,
    optionId: "opt_suburban_phcyql",
    unitId: "unit_suburban_phcyql",
    canonicalQuantityLabel: "Suburban",
    priceOptionId: 69029053,
    priceDollars: 399,
    priceCents: 39900,
    currency: "USD",
    durationMinutes: 150,
    onlineBookable: true,
    quoteOnly: false,
    meetingPoint: "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)",
  },
  {
    dccProductId: "dcc:gosno:den-winter-park:suv",
    routeId: "DEN-WINTER-PARK",
    rezdyProductCode: "P360K5",
    internalCode: "denver-to-winter-park-private-suv",
    title: "Denver Airport to Winter Park — Private SUV Transfer",
    origin: "DEN",
    destination: "Winter Park",
    direction: "OUTBOUND",
    vehicleClass: "suv",
    maxPassengers: 6,
    optionId: "opt_suburban_p360k5",
    unitId: "unit_suburban_p360k5",
    canonicalQuantityLabel: "Suburban",
    priceOptionId: 69029054,
    priceDollars: 349,
    priceCents: 34900,
    currency: "USD",
    durationMinutes: 150,
    onlineBookable: true,
    quoteOnly: false,
    meetingPoint: "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)",
  },
  {
    dccProductId: "dcc:gosno:den-steamboat:suv",
    routeId: "DEN-STEAMBOAT",
    rezdyProductCode: "PEZN8V",
    internalCode: "denver-to-steamboat-private-suv",
    title: "Denver Airport to Steamboat Springs — Private SUV Transfer",
    origin: "DEN",
    destination: "Steamboat Springs",
    direction: "OUTBOUND",
    vehicleClass: "suv",
    maxPassengers: 6,
    optionId: "opt_suburban_pezn8v",
    unitId: "unit_suburban_pezn8v",
    canonicalQuantityLabel: "Suburban",
    priceOptionId: 69029055,
    priceDollars: 599,
    priceCents: 59900,
    currency: "USD",
    durationMinutes: 180,
    onlineBookable: true,
    quoteOnly: false,
    meetingPoint: "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)",
  },
  {
    dccProductId: "dcc:gosno:den-aspen:suv",
    routeId: "DEN-ASPEN",
    rezdyProductCode: "P11TWN",
    internalCode: "denver-to-aspen-private-suv",
    title: "Denver Airport to Aspen — Private SUV Transfer",
    origin: "DEN",
    destination: "Aspen",
    direction: "OUTBOUND",
    vehicleClass: "suv",
    maxPassengers: 6,
    optionId: "opt_suburban_p11twn",
    unitId: "unit_suburban_p11twn",
    canonicalQuantityLabel: "Suburban",
    priceOptionId: 69029056,
    priceDollars: 699,
    priceCents: 69900,
    currency: "USD",
    durationMinutes: 150,
    onlineBookable: true,
    quoteOnly: false,
    meetingPoint: "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)",
  },
  {
    dccProductId: "dcc:gosno:den-snowmass:suv",
    routeId: "DEN-SNOWMASS",
    rezdyProductCode: "PP1A72",
    internalCode: "denver-to-snowmass-private-suv",
    title: "Denver Airport to Snowmass — Private SUV Transfer",
    origin: "DEN",
    destination: "Snowmass",
    direction: "OUTBOUND",
    vehicleClass: "suv",
    maxPassengers: 6,
    optionId: "opt_suburban_pp1a72",
    unitId: "unit_suburban_pp1a72",
    canonicalQuantityLabel: "Suburban",
    priceOptionId: 69029057,
    priceDollars: 699,
    priceCents: 69900,
    currency: "USD",
    durationMinutes: 240,
    onlineBookable: true,
    quoteOnly: false,
    meetingPoint: "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)",
  },
] as const;

export function resolveGosnoRezdyProductMapping(
  identifier: string | null | undefined,
): GosnoDccProductMapping | null {
  if (!identifier) return null;
  const trimmed = identifier.trim();
  const upper = trimmed.toUpperCase();
  const normalizedRoute = upper.replace(/_/g, "-");

  for (const mapping of GOSNO_DCC_PRODUCT_MAPPINGS) {
    if (
      mapping.dccProductId.toLowerCase() === trimmed.toLowerCase() ||
      mapping.rezdyProductCode.toUpperCase() === upper ||
      mapping.routeId.toUpperCase() === normalizedRoute ||
      mapping.internalCode.toLowerCase() === trimmed.toLowerCase()
    ) {
      return mapping;
    }
  }
  return null;
}

/**
 * Deterministic, compact, URL-safe Rezdy resellerReference generator (max 26 chars).
 * Mirrors GoSno's `buildRezdyResellerReference` pattern with a `DCC-` prefix.
 */
export function buildDccRezdyResellerReference(seed: string): string {
  const digest = crypto.createHash("sha256").update(seed).digest("base64url").slice(0, 22);
  return `DCC-${digest}`;
}

export function normalizeRezdyDateTimeLocal(dateOrDateTime: string, fallbackTime = "10:00:00"): string {
  const trimmed = dateOrDateTime.trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 19).replace("T", " ");
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }
  const dateMatch = trimmed.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    return `${dateMatch[1]} ${fallbackTime}`;
  }
  return trimmed;
}

function redactRezdyUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.searchParams.has("apiKey")) {
      parsed.searchParams.set("apiKey", "[REDACTED]");
    }
    if (parsed.searchParams.has("token")) {
      parsed.searchParams.set("token", "[REDACTED]");
    }
    return parsed.toString();
  } catch {
    return rawUrl.replace(/apiKey=[^&]+/g, "apiKey=[REDACTED]");
  }
}

function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const copy: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (/apikey|authorization|token/i.test(k)) {
      copy[k] = "[REDACTED]";
    } else {
      copy[k] = v;
    }
  }
  return copy;
}

/**
 * Rezdy Native REST API v1 Adapter implementing DCC's `OctoProviderAdapter` interface.
 *
 * Unlike OCTO Core adapters, Rezdy uses its own native REST contract:
 * - Auth: `?apiKey=<key>` query parameter and/or `apiKey` header
 * - Catalog: `GET /v1/products` and `GET /v1/products/{productCode}`
 * - Availability: `GET /v1/availability?productCode={code}&startTimeLocal=YYYY-MM-DD HH:mm:ss&endTimeLocal=YYYY-MM-DD HH:mm:ss`
 * - Duplicate Recovery: `GET /v1/bookings?resellerReference={ref}&limit=100`
 * - Reservation Hold: `POST /v1/bookings` with `status: "PROCESSING"`, `items: [{ productCode, startTimeLocal, amount, quantities: [{ optionLabel, value: 1 }], sessionId }]`
 * - Confirmation: `PUT /v1/bookings/{orderNumber}` with `{ status: "CONFIRMED", customer }`
 * - Cancellation: `DELETE /v1/bookings/{orderNumber}`
 */
export class RezdyAdapter extends BaseOctoAdapter {
  private capturedExchanges: RezdyCapturedExchange[] = [];
  private sessionStartTimeCache = new Map<string, { startTimeLocal: string; productCode: string; priceDollars: number; optionLabel: string }>();

  constructor(config: OctoClientConfig) {
    super({
      ...config,
      platform: "rezdy",
      headers: {
        "X-Rezdy-Integration": "DCC-Rezdy-v1",
        ...(config.headers || {}),
      },
    });
  }

  public getCapturedExchanges(): RezdyCapturedExchange[] {
    return [...this.capturedExchanges];
  }

  public clearCapturedExchanges(): void {
    this.capturedExchanges = [];
  }

  protected override getAuthHeaders(idempotencyKey?: string): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "DestinationCommandCenter-Rezdy-v1/1.0",
      ...this.customHeaders,
    };
    if (this.apiKey) {
      headers["apiKey"] = this.apiKey;
    }
    if (idempotencyKey) {
      headers["X-DCC-Idempotency-Key"] = idempotencyKey;
    }
    return headers;
  }

  private buildRezdyV1Url(path: string, queryParams?: Record<string, string | number | undefined>): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const base = this.endpoint.replace(/\/+$/, "");
    // Support both direct Rezdy v1 endpoints (.../v1) and endpoints without /v1 suffix
    const v1Base = base.endsWith("/v1") || base.includes("rezdy-admin") ? base : `${base}/v1`;

    if (v1Base.includes("rezdy-admin")) {
      const url = new URL(v1Base);
      url.searchParams.set("path", normalizedPath);
      if (this.apiKey && !url.searchParams.has("token")) {
        url.searchParams.set("token", this.apiKey);
      }
      if (queryParams) {
        for (const [k, v] of Object.entries(queryParams)) {
          if (v !== undefined) url.searchParams.set(k, String(v));
        }
      }
      return url.toString();
    }

    const url = new URL(`${v1Base}${normalizedPath}`);
    if (this.apiKey) {
      url.searchParams.set("apiKey", this.apiKey);
    }
    if (queryParams) {
      for (const [k, v] of Object.entries(queryParams)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }

  protected async rezdyRequest<T = any>(
    stepName: string,
    path: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    options?: {
      query?: Record<string, string | number | undefined>;
      body?: unknown;
      idempotencyKey?: string;
    },
  ): Promise<T> {
    const url = this.buildRezdyV1Url(path, options?.query);
    const headers = this.getAuthHeaders(options?.idempotencyKey);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      const rawText = await res.text();
      let parsed: any = null;
      try {
        parsed = rawText ? JSON.parse(rawText) : {};
      } catch {
        parsed = { rawText };
      }

      // Unwrap proxy envelope if using rezdy-admin read-only proxy
      const payload =
        parsed && typeof parsed === "object" && "ok" in parsed && "data" in parsed && parsed.data?.requestStatus
          ? parsed.data
          : parsed;
      const effectiveStatus =
        parsed && typeof parsed === "object" && typeof parsed.status === "number" && "data" in parsed
          ? parsed.status
          : res.status;

      this.capturedExchanges.push({
        step: stepName,
        timestamp: new Date().toISOString(),
        request: {
          method,
          urlRedacted: redactRezdyUrl(url),
          headersRedacted: redactHeaders(headers),
          body: options?.body ?? null,
        },
        response: {
          status: effectiveStatus,
          body: payload,
        },
      });

      const reqStatus: RezdyV1RequestStatus | undefined = payload?.requestStatus;
      if (effectiveStatus >= 400 || (reqStatus && reqStatus.success === false)) {
        const errCode = reqStatus?.error?.errorCode
          ? `REZDY_ERR_${reqStatus.error.errorCode}`
          : `HTTP_${effectiveStatus}`;
        const errMsg =
          reqStatus?.error?.errorMessage ||
          payload?.error ||
          payload?.message ||
          res.statusText ||
          "Rezdy v1 API error";
        const mappedStatus =
          reqStatus?.error?.errorCode === "4" || /invalid api key/i.test(String(errMsg))
            ? 401
            : effectiveStatus >= 400
            ? effectiveStatus
            : 400;
        throw new OctoApiError(mappedStatus, errCode, String(errMsg), payload);
      }

      return payload as T;
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new OctoApiError(504, "PROVIDER_TIMEOUT", `Rezdy v1 endpoint timed out after ${this.timeoutMs}ms`);
      }
      if (err instanceof OctoApiError) {
        throw err;
      }
      throw new OctoApiError(502, "CONNECTION_FAILED", err.message || "Failed to communicate with Rezdy v1 API");
    } finally {
      clearTimeout(timer);
    }
  }

  private translateRezdyProductToOcto(
    rezdyProd: RezdyV1Product,
    mapping?: GosnoDccProductMapping | null,
  ): OctoProduct {
    const resolvedMapping = mapping ?? resolveGosnoRezdyProductMapping(rezdyProd.productCode);
    const priceOptions = Array.isArray(rezdyProd.priceOptions) ? rezdyProd.priceOptions : [];
    const currency = rezdyProd.currency || resolvedMapping?.currency || "USD";

    const options = priceOptions.map((po, idx) => {
      const optionId =
        idx === 0 && resolvedMapping
          ? resolvedMapping.optionId
          : `opt_rezdy_${po.id || po.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
      const unitId =
        idx === 0 && resolvedMapping
          ? resolvedMapping.unitId
          : `unit_rezdy_${po.id || po.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

      return {
        id: optionId,
        default: idx === 0,
        internalName: po.label,
        reference: po.label,
        title: `${rezdyProd.name} (${po.label})`,
        description: rezdyProd.shortDescription || rezdyProd.description,
        units: [
          {
            id: unitId,
            internalName: po.label,
            reference: String(po.id || po.label),
            type: "OTHER" as const,
            pricingFrom: [
              {
                original: Number(po.price),
                retail: Number(po.price),
                currency,
                currencyPrecision: 2,
                includedTaxesAndFees: false,
              },
            ],
            restrictions: {
              minQuantity: po.minQuantity ?? rezdyProd.quantityRequiredMin ?? 1,
              maxQuantity: po.maxQuantity ?? rezdyProd.quantityRequiredMax ?? 1,
            },
          },
        ],
        requiredContactFields: ["firstName", "lastName", "emailAddress", "phoneNumber"],
      };
    });

    return {
      id: resolvedMapping?.dccProductId || rezdyProd.productCode,
      internalName: rezdyProd.internalCode || rezdyProd.productCode,
      reference: rezdyProd.productCode,
      title: rezdyProd.name,
      description: rezdyProd.description || rezdyProd.shortDescription,
      country: "US",
      location: resolvedMapping ? `${resolvedMapping.origin} -> ${resolvedMapping.destination}` : "Colorado",
      destinationSlug: resolvedMapping?.destination.toLowerCase().replace(/\s+/g, "-") || "breckenridge",
      timeZone: "America/Denver",
      defaultCurrency: currency,
      options,
      capabilities: ["octo/core", "octo/pricing"],
      durationMinutes: rezdyProd.durationMinutes ?? resolvedMapping?.durationMinutes ?? 150,
      meetingPoint: resolvedMapping?.meetingPoint,
      providerExternalIds: {
        rezdyLocation: "colorado",
        custom: {
          rezdyProductCode: rezdyProd.productCode,
          routeId: resolvedMapping?.routeId || rezdyProd.productCode,
          vehicleClass: resolvedMapping?.vehicleClass || "suv",
          maxPassengers: resolvedMapping?.maxPassengers || 6,
          canonicalQuantityLabel:
            priceOptions[0]?.label || resolvedMapping?.canonicalQuantityLabel || "Suburban",
          priceDollars: Number(priceOptions[0]?.price ?? rezdyProd.advertisedPrice ?? resolvedMapping?.priceDollars ?? 0),
          priceCents: Math.round(
            Number(priceOptions[0]?.price ?? rezdyProd.advertisedPrice ?? resolvedMapping?.priceDollars ?? 0) * 100,
          ),
          quoteOnly: resolvedMapping?.quoteOnly ? 1 : 0,
          onlineBookable: resolvedMapping ? (resolvedMapping.onlineBookable ? 1 : 0) : 1,
        },
      },
    };
  }

  override async getSupplier(): Promise<Record<string, unknown>> {
    const products = await this.getProducts();
    return {
      id: "gosno-rezdy-v1",
      name: "GoSno Mountain Transportation (Rezdy Native REST API v1)",
      endpoint: this.endpoint,
      platform: "rezdy",
      productCount: products.length,
    };
  }

  override async getProducts(): Promise<OctoProduct[]> {
    const data = await this.rezdyRequest<{
      requestStatus?: RezdyV1RequestStatus;
      products?: RezdyV1Product[];
    }>("getProducts", "/products", "GET", { query: { limit: 100 } });

    const products = Array.isArray(data.products) ? data.products : [];
    return products.map((p) => this.translateRezdyProductToOcto(p));
  }

  override async getProduct(productId: string): Promise<OctoProduct> {
    const mapping = resolveGosnoRezdyProductMapping(productId);
    const rezdyProductCode = mapping?.rezdyProductCode || productId;

    const data = await this.rezdyRequest<{
      requestStatus?: RezdyV1RequestStatus;
      product?: RezdyV1Product;
    }>(`getProduct:${rezdyProductCode}`, `/products/${encodeURIComponent(rezdyProductCode)}`, "GET");

    if (!data.product || !data.product.productCode) {
      throw new OctoApiError(404, "INVALID_PRODUCT_ID", `Rezdy product ${rezdyProductCode} not found`);
    }

    const usableOption = data.product.priceOptions?.find((po) => po.label && po.label.trim().length > 0);
    if (!usableOption) {
      throw new OctoApiError(
        422,
        "MISSING_REZDY_PRICE_OPTION_LABEL",
        `Rezdy product ${rezdyProductCode} has no usable booking price option label`,
      );
    }

    return this.translateRezdyProductToOcto(data.product, mapping);
  }

  override async getAvailabilityCalendar(
    productId: string,
    optionId: string,
    localDateStart: string,
    localDateEnd: string,
  ): Promise<OctoAvailabilitySlot[]> {
    const mapping = resolveGosnoRezdyProductMapping(productId);
    const rezdyProductCode = mapping?.rezdyProductCode || productId;
    const startTimeLocal = `${localDateStart.slice(0, 10)} 00:00:00`;
    const endTimeLocal = `${localDateEnd.slice(0, 10)} 23:59:59`;

    const data = await this.rezdyRequest<{
      requestStatus?: RezdyV1RequestStatus;
      sessions?: RezdyV1Session[];
    }>(`getAvailabilityCalendar:${rezdyProductCode}`, "/availability", "GET", {
      query: {
        productCode: rezdyProductCode,
        startTimeLocal,
        endTimeLocal,
      },
    });

    return this.translateSessionsToSlots(
      rezdyProductCode,
      optionId,
      localDateStart.slice(0, 10),
      data.sessions || [],
      mapping,
      [],
    );
  }

  override async checkAvailability(
    productId: string,
    optionId: string,
    localDate: string,
    unitItems: OctoUnitItemRequest[] = [],
  ): Promise<OctoAvailabilitySlot[]> {
    const mapping = resolveGosnoRezdyProductMapping(productId);
    const rezdyProductCode = mapping?.rezdyProductCode || productId;
    const datePart = localDate.slice(0, 10);
    const startTimeLocal = `${datePart} 00:00:00`;
    const endTimeLocal = `${datePart} 23:59:59`;

    const data = await this.rezdyRequest<{
      requestStatus?: RezdyV1RequestStatus;
      sessions?: RezdyV1Session[];
    }>(`checkAvailability:${rezdyProductCode}:${datePart}`, "/availability", "GET", {
      query: {
        productCode: rezdyProductCode,
        startTimeLocal,
        endTimeLocal,
      },
    });

    return this.translateSessionsToSlots(
      rezdyProductCode,
      optionId,
      datePart,
      data.sessions || [],
      mapping,
      unitItems,
    );
  }

  private translateSessionsToSlots(
    rezdyProductCode: string,
    optionId: string,
    datePart: string,
    sessions: RezdyV1Session[],
    mapping: GosnoDccProductMapping | null,
    unitItems: OctoUnitItemRequest[],
  ): Array<OctoAvailabilitySlot & { quoteOnly?: boolean; reason?: string; rezdyProductCode?: string }> {
    const requestedUnits = Math.max(
      1,
      unitItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
    );
    const requestedPassengers = unitItems.reduce(
      (sum, item) => sum + Number((item as any).passengers || 0),
      0,
    );

    const isQuoteOnly = Boolean(mapping?.quoteOnly || mapping?.onlineBookable === false);
    const exceedsMaxPassengers =
      mapping != null && requestedPassengers > 0 && requestedPassengers > mapping.maxPassengers;

    if (sessions.length === 0) {
      return [
        {
          id: `rezdy_nosession_${rezdyProductCode}_${datePart}`,
          localDateTimeStart: `${datePart} 10:00:00`,
          localDateTimeEnd: `${datePart} 12:30:00`,
          allDay: false,
          available: false,
          status: "SOLD_OUT",
          vacancies: 0,
          capacity: 0,
          quoteOnly: isQuoteOnly,
          reason: isQuoteOnly ? "QUOTE_ONLY_PRODUCT" : "NO_REZDY_SESSION_AVAILABLE",
          rezdyProductCode,
        },
      ];
    }

    return sessions.map((session) => {
      const seatsAvailable = Number(session.seatsAvailable ?? 0);
      const seatsTotal = Number(session.seats ?? 0);
      const po = session.priceOptions?.[0];
      const priceDollars = Number(po?.price ?? mapping?.priceDollars ?? 399);
      const optionLabel = po?.label || mapping?.canonicalQuantityLabel || "Suburban";
      const unitId = mapping?.unitId || `unit_rezdy_${po?.id || "default"}`;

      this.sessionStartTimeCache.set(String(session.id), {
        startTimeLocal: session.startTimeLocal,
        productCode: rezdyProductCode,
        priceDollars,
        optionLabel,
      });

      // Strictly preserve unavailable or quote-only status:
      // - quoteOnly products (e.g., GoSno private vans without custom quote) MUST remain available: false, quoteOnly: true
      // - passenger counts exceeding vehicle capacity MUST remain available: false
      // - sessions with seatsAvailable <= 0 or < requestedUnits MUST remain available: false, status: "SOLD_OUT"
      const slotAvailable =
        !isQuoteOnly &&
        !exceedsMaxPassengers &&
        seatsAvailable > 0 &&
        seatsAvailable >= requestedUnits;

      const reason = isQuoteOnly
        ? "QUOTE_ONLY_PRODUCT"
        : exceedsMaxPassengers
        ? "MAX_PASSENGERS_EXCEEDED"
        : seatsAvailable <= 0
        ? "ZERO_SEATS_AVAILABLE"
        : seatsAvailable < requestedUnits
        ? "INSUFFICIENT_SEATS"
        : undefined;

      return {
        id: String(session.id),
        localDateTimeStart: session.startTimeLocal,
        localDateTimeEnd: session.endTimeLocal,
        allDay: Boolean(session.allDay),
        available: slotAvailable,
        status: slotAvailable ? "AVAILABLE" : "SOLD_OUT",
        vacancies: isQuoteOnly ? 0 : Math.max(0, seatsAvailable),
        capacity: seatsTotal,
        maxUnits: mapping?.maxPassengers ?? 6,
        unitPricing: [
          {
            unitId,
            pricing: {
              original: priceDollars,
              retail: priceDollars,
              currency: mapping?.currency || "USD",
              currencyPrecision: 2,
              includedTaxesAndFees: false,
            },
          },
        ],
        pickupAvailable: true,
        quoteOnly: isQuoteOnly,
        ...(reason ? { reason } : {}),
        rezdyProductCode,
      };
    });
  }

  /**
   * Look up existing Rezdy bookings by deterministic `resellerReference` for duplicate-request protection.
   */
  public async fetchBookingsByResellerReference(resellerReference: string): Promise<RezdyV1Booking[]> {
    const data = await this.rezdyRequest<{
      requestStatus?: RezdyV1RequestStatus;
      bookings?: RezdyV1Booking[];
    }>(`fetchBookingsByResellerReference:${resellerReference}`, "/bookings", "GET", {
      query: {
        resellerReference,
        limit: 100,
      },
    });
    return Array.isArray(data.bookings) ? data.bookings : [];
  }

  private translateRezdyBookingToOcto(
    booking: RezdyV1Booking,
    fallback: {
      productId: string;
      optionId: string;
      availabilityId: string;
      expirationMinutes?: number;
    },
  ): OctoBookingResult {
    const firstItem = booking.items?.[0];
    const firstQty = firstItem?.quantities?.[0];
    const unitPrice = Number(firstItem?.amount ?? booking.totalAmount ?? 0);
    const quantity = Number(firstQty?.value ?? 1);
    const totalPrice = Number(firstItem?.amount ?? booking.totalAmount ?? unitPrice * quantity);

    const status =
      booking.status === "CONFIRMED"
        ? "CONFIRMED"
        : booking.status === "CANCELLED"
        ? "CANCELLED"
        : "ON_HOLD";

    const utcHoldExpires =
      status === "ON_HOLD"
        ? new Date(Date.now() + (fallback.expirationMinutes || 15) * 60 * 1000).toISOString()
        : null;

    return {
      uuid: booking.orderNumber,
      status,
      utcHoldExpires,
      productId: fallback.productId,
      optionId: fallback.optionId,
      availabilityId: fallback.availabilityId,
      contact: booking.customer
        ? {
            fullName: `${booking.customer.firstName || ""} ${booking.customer.lastName || ""}`.trim(),
            firstName: booking.customer.firstName,
            lastName: booking.customer.lastName,
            emailAddress: booking.customer.email,
            phoneNumber: booking.customer.phone,
          }
        : undefined,
      unitItems: [
        {
          uuid: `${booking.orderNumber}_item_1`,
          unitId: firstQty?.optionLabel || "Suburban",
          pricing: {
            original: unitPrice,
            retail: unitPrice,
            currency: booking.totalCurrency || "USD",
            currencyPrecision: 2,
            includedTaxesAndFees: false,
          },
        },
      ],
      totalPrice,
      currency: booking.totalCurrency || "USD",
      supplierReference: booking.orderNumber,
      resellerReference: booking.resellerReference,
      confirmedAt: booking.dateConfirmed,
      cancelledAt: booking.status === "CANCELLED" ? booking.dateUpdated || new Date().toISOString() : undefined,
      voucher:
        status === "CONFIRMED"
          ? {
              code: booking.orderNumber,
              redemptionInstructions:
                "Present Rezdy order number at GoSno private transfer pickup point.",
            }
          : undefined,
    };
  }

  override async createBookingHold(
    params: OctoCreateHoldParams,
    idempotencyKey?: string,
  ): Promise<OctoBookingResult> {
    const mapping = resolveGosnoRezdyProductMapping(params.productId);
    if (mapping?.quoteOnly || mapping?.onlineBookable === false) {
      throw new OctoApiError(
        400,
        "QUOTE_ONLY_PRODUCT_NOT_BOOKABLE",
        `Product ${params.productId} (${mapping.rezdyProductCode}) is quote-only and cannot be booked online without a custom quote.`,
      );
    }

    const rezdyProductCode = mapping?.rezdyProductCode || params.productId;
    const cachedSession = this.sessionStartTimeCache.get(params.availabilityId);

    // Resolve canonical optionLabel & price from mapping or catalog lookup
    let optionLabel = cachedSession?.optionLabel || mapping?.canonicalQuantityLabel;
    let priceDollars = cachedSession?.priceDollars ?? mapping?.priceDollars;

    if (!optionLabel || priceDollars == null) {
      const prod = await this.getProduct(rezdyProductCode);
      optionLabel = prod.options[0]?.reference || prod.options[0]?.internalName;
      priceDollars = prod.options[0]?.units[0]?.pricingFrom?.[0]?.retail ?? 399;
    }

    if (!optionLabel) {
      throw new OctoApiError(
        422,
        "MISSING_REZDY_PRICE_OPTION_LABEL",
        `Product ${rezdyProductCode} has no usable booking price option label`,
      );
    }

    const totalQuantity = Math.max(
      1,
      params.unitItems.reduce((sum, u) => sum + (u.quantity || 0), 0),
    );
    const totalAmountDollars = Number((priceDollars * totalQuantity).toFixed(2));

    const startTimeLocal = cachedSession?.startTimeLocal
      ? normalizeRezdyDateTimeLocal(cachedSession.startTimeLocal)
      : normalizeRezdyDateTimeLocal(params.availabilityId);

    const numericSessionId = /^\d+$/.test(params.availabilityId)
      ? Number(params.availabilityId)
      : undefined;

    const resellerReference = buildDccRezdyResellerReference(
      idempotencyKey || params.uuid || `${rezdyProductCode}:${params.availabilityId}`,
    );

    // 1. Upstream Rezdy duplicate-request protection via GET /v1/bookings?resellerReference=...
    const existingBookings = await this.fetchBookingsByResellerReference(resellerReference);
    const activeExisting = existingBookings.find((b) => b.status !== "CANCELLED");
    if (activeExisting) {
      const existingItem = activeExisting.items?.[0];
      const existingQty = existingItem?.quantities?.[0];
      if (
        existingItem?.productCode !== rezdyProductCode ||
        Number(existingItem?.amount) !== totalAmountDollars ||
        existingQty?.optionLabel !== optionLabel ||
        Number(existingQty?.value) !== totalQuantity
      ) {
        throw new OctoApiError(
          400,
          "ALTERED_IDEMPOTENCY_REQUEST",
          `Rezdy resellerReference ${resellerReference} already exists on order ${activeExisting.orderNumber} with different booking parameters.`,
        );
      }

      return this.translateRezdyBookingToOcto(activeExisting, {
        productId: params.productId,
        optionId: params.optionId,
        availabilityId: params.availabilityId,
        expirationMinutes: params.expirationMinutes,
      });
    }

    // 2. Create reservation hold in Rezdy with status: "PROCESSING"
    const createPayload = {
      resellerReference,
      status: "PROCESSING" as const,
      customer: {
        firstName: "DCC",
        lastName: "ReservationHold",
        email: "pilot-hold@destinationcommandcenter.com",
        phone: "+13035550100",
      },
      items: [
        {
          productCode: rezdyProductCode,
          startTimeLocal,
          amount: totalAmountDollars,
          quantities: [
            {
              optionLabel,
              value: totalQuantity,
            },
          ],
          ...(numericSessionId !== undefined ? { sessionId: numericSessionId } : {}),
        },
      ],
      comments:
        params.notes ||
        `DCC Direct API Pilot Hold | Route: ${mapping?.routeId || rezdyProductCode} | 10% direct commission agreement`,
    };

    const created = await this.rezdyRequest<{
      requestStatus?: RezdyV1RequestStatus;
      booking?: RezdyV1Booking;
    }>(`createBookingHold:${rezdyProductCode}`, "/bookings", "POST", {
      body: createPayload,
      idempotencyKey,
    });

    if (!created.booking || !created.booking.orderNumber) {
      throw new OctoApiError(502, "REZDY_INVALID_BOOKING_RESPONSE", "Rezdy did not return a booking orderNumber");
    }

    return this.translateRezdyBookingToOcto(created.booking, {
      productId: params.productId,
      optionId: params.optionId,
      availabilityId: params.availabilityId,
      expirationMinutes: params.expirationMinutes,
    });
  }

  override async confirmBooking(
    uuid: string,
    params: OctoConfirmBookingParams,
    idempotencyKey?: string,
  ): Promise<OctoBookingResult> {
    const fullName = (params.contact?.fullName || "").trim();
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const firstName = params.contact?.firstName || nameParts[0] || "Traveler";
    const lastName =
      params.contact?.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Guest");

    const confirmPayload = {
      status: "CONFIRMED" as const,
      ...(params.resellerReference ? { resellerReference: params.resellerReference } : {}),
      customer: {
        firstName,
        lastName,
        email: params.contact?.emailAddress || "traveler@example.com",
        phone: params.contact?.phoneNumber || "+13035550199",
      },
      comments: params.contact?.notes || "Confirmed via DCC Direct API (10% commission)",
    };

    const confirmed = await this.rezdyRequest<{
      requestStatus?: RezdyV1RequestStatus;
      booking?: RezdyV1Booking;
    }>(`confirmBooking:${uuid}`, `/bookings/${encodeURIComponent(uuid)}`, "PUT", {
      body: confirmPayload,
      idempotencyKey,
    });

    if (!confirmed.booking || !confirmed.booking.orderNumber) {
      throw new OctoApiError(502, "REZDY_CONFIRM_FAILED", `Rezdy failed to confirm order ${uuid}`);
    }

    const firstItem = confirmed.booking.items?.[0];
    return this.translateRezdyBookingToOcto(confirmed.booking, {
      productId: firstItem?.productCode || "P7477S",
      optionId: "opt_suburban_69029050",
      availabilityId: String(firstItem?.sessionId || firstItem?.startTimeLocal || "497020486"),
    });
  }

  override async getBooking(uuid: string): Promise<OctoBookingResult> {
    const fetched = await this.rezdyRequest<{
      requestStatus?: RezdyV1RequestStatus;
      booking?: RezdyV1Booking;
    }>(`getBooking:${uuid}`, `/bookings/${encodeURIComponent(uuid)}`, "GET");

    if (!fetched.booking || !fetched.booking.orderNumber) {
      throw new OctoApiError(404, "BOOKING_NOT_FOUND", `Rezdy order ${uuid} not found`);
    }

    const firstItem = fetched.booking.items?.[0];
    return this.translateRezdyBookingToOcto(fetched.booking, {
      productId: firstItem?.productCode || "P7477S",
      optionId: "opt_suburban_69029050",
      availabilityId: String(firstItem?.sessionId || firstItem?.startTimeLocal || "497020486"),
    });
  }

  override async cancelBooking(
    uuid: string,
    reason?: string,
    idempotencyKey?: string,
  ): Promise<OctoBookingResult> {
    const cancelled = await this.rezdyRequest<{
      requestStatus?: RezdyV1RequestStatus;
      booking?: RezdyV1Booking;
    }>(`cancelBooking:${uuid}`, `/bookings/${encodeURIComponent(uuid)}`, "DELETE", {
      idempotencyKey,
    });

    if (cancelled.booking) {
      const firstItem = cancelled.booking.items?.[0];
      const result = this.translateRezdyBookingToOcto(
        { ...cancelled.booking, status: "CANCELLED" },
        {
          productId: firstItem?.productCode || "P7477S",
          optionId: "opt_suburban_69029050",
          availabilityId: String(firstItem?.sessionId || firstItem?.startTimeLocal || "497020486"),
        },
      );
      result.cancellationReason = reason || "Cancelled by customer request";
      result.cancelledAt = new Date().toISOString();
      return result;
    }

    return {
      uuid,
      status: "CANCELLED",
      utcHoldExpires: null,
      productId: "P7477S",
      optionId: "opt_suburban_69029050",
      availabilityId: "497020486",
      unitItems: [],
      totalPrice: 399,
      currency: "USD",
      supplierReference: uuid,
      cancellationReason: reason || "Cancelled by customer request",
      cancelledAt: new Date().toISOString(),
    };
  }
}

/**
 * Provider-Specification Rezdy Native REST API v1 Test Server
 *
 * Implements Rezdy v1's documented REST endpoints over HTTP (`http://127.0.0.1:<port>/v1`)
 * seeded with the exact product and session payloads captured from GoSno's live Rezdy account:
 * - `P7477S` (DEN -> Breckenridge Private SUV, $399, optionLabel "Suburban")
 *   - Session `497020486` (`2026-11-12 10:53:00`, `seats: 1`, `seatsAvailable: 1` -> AVAILABLE)
 *   - Session `507139971` (`2026-12-14 15:05:00`, `seats: 999`, `seatsAvailable: 0` -> SOLD_OUT / UNAVAILABLE)
 * - `PXFGPP` (DEN -> Vail Private SUV, $499, optionLabel "Suburban")
 * - `PEAVH0` (Snowmass -> DEN Private SUV, $699, optionLabel "Group from 1 to 2")
 * - `PKQDPG` (DEN -> Breckenridge Private Van, $599, optionLabel "Private Van 10ppl", quote-only on storefront)
 */
export interface RezdyV1TestServerHandle {
  baseUrl: string;
  apiKey: string;
  getOrders: () => RezdyV1Booking[];
  getServerLogs: () => Array<{ method: string; path: string; status: number; body?: unknown }>;
  close: () => Promise<void>;
}

export const LIVE_CAPTURED_GOSNO_REZDY_PRODUCTS: Record<string, RezdyV1Product> = {
  P7477S: {
    productCode: "P7477S",
    internalCode: "denver-to-breckenridge-private-suv",
    name: "Denver Airport to Breckenridge — Private SUV Transfer",
    shortDescription:
      "Private SUV transfer from Denver International (DEN) to Breckenridge with flight tracking and room for ski gear.",
    description:
      "A private SUV picks you up curbside at Denver International (DEN) and drives your group straight to Breckenridge. Flight tracking is included so we are there when you land, with room for ski bags and winter luggage. Pre-book your return to Denver at the same time. Priced per vehicle.",
    productType: "PRIVATE_TOUR",
    bookingMode: "INVENTORY",
    currency: "USD",
    advertisedPrice: 399,
    priceOptions: [
      {
        price: 399,
        label: "Suburban",
        id: 69029050,
        seatsUsed: 1,
        productCode: "P7477S",
      },
    ],
    quantityRequired: true,
    quantityRequiredMin: 1,
    quantityRequiredMax: 3,
    durationMinutes: 150,
    confirmMode: "AUTOCONFIRM",
  },
  PXFGPP: {
    productCode: "PXFGPP",
    internalCode: "denver-to-vail-private-suv",
    name: "Denver Airport to Vail — Private SUV Transfer",
    productType: "PRIVATE_TOUR",
    bookingMode: "INVENTORY",
    currency: "USD",
    advertisedPrice: 499,
    priceOptions: [
      {
        price: 499,
        label: "Suburban",
        id: 75298226,
        seatsUsed: 1,
        productCode: "PXFGPP",
      },
    ],
    quantityRequired: true,
    quantityRequiredMin: 1,
    quantityRequiredMax: 3,
    durationMinutes: 150,
    confirmMode: "AUTOCONFIRM",
  },
  PEAVH0: {
    productCode: "PEAVH0",
    internalCode: "GOSNO_SNOWMASS_DEN_SUV",
    name: "Snowmass to Denver Airport — Private SUV Transfer",
    productType: "PRIVATE_TOUR",
    bookingMode: "INVENTORY",
    currency: "USD",
    advertisedPrice: 699,
    priceOptions: [
      {
        price: 699,
        label: "Group from 1 to 2",
        id: 76622153,
        seatsUsed: 1,
        minQuantity: 1,
        maxQuantity: 2,
        priceGroupType: "EACH",
        productCode: "PEAVH0",
      },
    ],
    quantityRequired: true,
    quantityRequiredMin: 1,
    quantityRequiredMax: 2,
    durationMinutes: 240,
    confirmMode: "AUTOCONFIRM",
  },
  PKQDPG: {
    productCode: "PKQDPG",
    internalCode: "GOSNO_DEN_BRECKENRIDGE_VAN",
    name: "Denver International Airport (DEN) to Breckenridge - Private Van Transfer",
    productType: "PRIVATE_TOUR",
    bookingMode: "INVENTORY",
    currency: "USD",
    advertisedPrice: 599,
    priceOptions: [
      {
        price: 599,
        label: "Private Van 10ppl",
        id: 73379226,
        seatsUsed: 1,
        productCode: "PKQDPG",
      },
    ],
    quantityRequired: true,
    quantityRequiredMin: 1,
    quantityRequiredMax: 1,
    durationMinutes: 150,
    confirmMode: "AUTOCONFIRM",
  },
};

export const LIVE_CAPTURED_GOSNO_REZDY_SESSIONS: Record<string, RezdyV1Session[]> = {
  P7477S: [
    {
      id: 497020486,
      productCode: "P7477S",
      startTime: "2026-11-12T17:53:00Z",
      endTime: "2026-11-12T20:23:00Z",
      startTimeLocal: "2026-11-12 10:53:00",
      endTimeLocal: "2026-11-12 13:23:00",
      allDay: false,
      seats: 1,
      seatsAvailable: 1,
      priceOptions: [
        {
          price: 399,
          label: "Suburban",
          id: 69029050,
          seatsUsed: 1,
          productCode: "P7477S",
        },
      ],
    },
    {
      id: 507139971,
      productCode: "P7477S",
      startTime: "2026-12-14T22:05:00Z",
      endTime: "2026-12-15T00:35:00Z",
      startTimeLocal: "2026-12-14 15:05:00",
      endTimeLocal: "2026-12-14 17:35:00",
      allDay: false,
      seats: 999,
      seatsAvailable: 0,
      priceOptions: [
        {
          price: 399,
          label: "Suburban",
          id: 69029050,
          seatsUsed: 1,
          productCode: "P7477S",
        },
      ],
    },
  ],
  PXFGPP: [
    {
      id: 498001122,
      productCode: "PXFGPP",
      startTime: "2026-11-12T18:00:00Z",
      endTime: "2026-11-12T20:30:00Z",
      startTimeLocal: "2026-11-12 11:00:00",
      endTimeLocal: "2026-11-12 13:30:00",
      allDay: false,
      seats: 1,
      seatsAvailable: 1,
      priceOptions: [
        {
          price: 499,
          label: "Suburban",
          id: 75298226,
          seatsUsed: 1,
          productCode: "PXFGPP",
        },
      ],
    },
  ],
  PKQDPG: [],
};

export async function startRezdyV1TestServer(options?: {
  apiKey?: string;
}): Promise<RezdyV1TestServerHandle> {
  const expectedApiKey = options?.apiKey || "rezdy_test_key_dcc_gosno_pilot_32chars_01";
  const sessionsByProduct = new Map<string, RezdyV1Session[]>(
    Object.entries(LIVE_CAPTURED_GOSNO_REZDY_SESSIONS).map(([code, list]) => [
      code,
      list.map((s) => ({ ...s })),
    ]),
  );
  const bookingsByOrderNumber = new Map<string, RezdyV1Booking>();
  const serverLogs: Array<{ method: string; path: string; status: number; body?: unknown }> = [];
  let orderCounter = 1000;

  const sendJson = (res: http.ServerResponse, status: number, payload: unknown) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(payload));
  };

  const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url || "/", "http://127.0.0.1");
    const method = req.method || "GET";
    const suppliedKey = reqUrl.searchParams.get("apiKey") || req.headers["apikey"];

    let rawBody = "";
    req.on("data", (chunk) => {
      rawBody += chunk;
    });
    req.on("end", () => {
      let parsedBody: any = undefined;
      if (rawBody) {
        try {
          parsedBody = JSON.parse(rawBody);
        } catch {
          parsedBody = rawBody;
        }
      }

      if (suppliedKey !== expectedApiKey) {
        serverLogs.push({ method, path: reqUrl.pathname, status: 401, body: parsedBody });
        return sendJson(res, 401, {
          requestStatus: {
            success: false,
            error: { errorCode: "4", errorMessage: "Invalid API Key" },
          },
        });
      }

      // GET /v1/products
      if (method === "GET" && reqUrl.pathname === "/v1/products") {
        serverLogs.push({ method, path: reqUrl.pathname, status: 200 });
        return sendJson(res, 200, {
          requestStatus: { success: true, version: "v1" },
          products: Object.values(LIVE_CAPTURED_GOSNO_REZDY_PRODUCTS),
        });
      }

      // GET /v1/products/{productCode}
      const prodMatch = reqUrl.pathname.match(/^\/v1\/products\/([^/]+)$/);
      if (method === "GET" && prodMatch) {
        const code = decodeURIComponent(prodMatch[1]);
        const prod = LIVE_CAPTURED_GOSNO_REZDY_PRODUCTS[code];
        if (!prod) {
          serverLogs.push({ method, path: reqUrl.pathname, status: 404 });
          return sendJson(res, 404, {
            requestStatus: {
              success: false,
              error: { errorCode: "404", errorMessage: `Product ${code} not found` },
            },
          });
        }
        serverLogs.push({ method, path: reqUrl.pathname, status: 200 });
        return sendJson(res, 200, {
          requestStatus: { success: true, version: "v1" },
          product: prod,
        });
      }

      // GET /v1/availability
      if (method === "GET" && reqUrl.pathname === "/v1/availability") {
        const code = reqUrl.searchParams.get("productCode") || "";
        const startTimeLocal = reqUrl.searchParams.get("startTimeLocal") || "";
        const endTimeLocal = reqUrl.searchParams.get("endTimeLocal") || "";
        const allSessions = sessionsByProduct.get(code) || [];
        const filtered = allSessions.filter((s) => {
          if (startTimeLocal && s.startTimeLocal < startTimeLocal) return false;
          if (endTimeLocal && s.startTimeLocal > endTimeLocal) return false;
          return true;
        });
        serverLogs.push({ method, path: `${reqUrl.pathname}?productCode=${code}`, status: 200 });
        return sendJson(res, 200, {
          requestStatus: { success: true, version: "v1" },
          sessions: filtered,
        });
      }

      // GET /v1/bookings?resellerReference=...
      if (method === "GET" && reqUrl.pathname === "/v1/bookings") {
        const resellerRef = reqUrl.searchParams.get("resellerReference");
        const all = Array.from(bookingsByOrderNumber.values());
        const matched = resellerRef
          ? all.filter((b) => b.resellerReference === resellerRef)
          : all;
        serverLogs.push({
          method,
          path: `${reqUrl.pathname}${resellerRef ? `?resellerReference=${resellerRef}` : ""}`,
          status: 200,
        });
        return sendJson(res, 200, {
          requestStatus: { success: true, version: "v1" },
          bookings: matched,
        });
      }

      // POST /v1/bookings (Create Hold / Processing Booking)
      if (method === "POST" && reqUrl.pathname === "/v1/bookings") {
        const item = parsedBody?.items?.[0];
        const prod = item?.productCode ? LIVE_CAPTURED_GOSNO_REZDY_PRODUCTS[item.productCode] : null;
        if (!prod) {
          serverLogs.push({ method, path: reqUrl.pathname, status: 400, body: parsedBody });
          return sendJson(res, 400, {
            requestStatus: {
              success: false,
              error: { errorCode: "INVALID_PRODUCT", errorMessage: "Unknown Rezdy productCode" },
            },
          });
        }

        const qty = item?.quantities?.[0];
        const validOption = prod.priceOptions.find((po) => po.label === qty?.optionLabel);
        if (!validOption) {
          serverLogs.push({ method, path: reqUrl.pathname, status: 400, body: parsedBody });
          return sendJson(res, 400, {
            requestStatus: {
              success: false,
              error: {
                errorCode: "INVALID_OPTION_LABEL",
                errorMessage: `Invalid quantity optionLabel '${qty?.optionLabel}' for ${prod.productCode}`,
              },
            },
          });
        }

        // Verify session availability if sessionId is provided
        const prodSessions = sessionsByProduct.get(prod.productCode) || [];
        const targetSession =
          item.sessionId != null
            ? prodSessions.find((s) => s.id === Number(item.sessionId))
            : prodSessions.find((s) => s.startTimeLocal === item.startTimeLocal);

        if (!targetSession || targetSession.seatsAvailable < Number(qty?.value || 1)) {
          serverLogs.push({ method, path: reqUrl.pathname, status: 400, body: parsedBody });
          return sendJson(res, 400, {
            requestStatus: {
              success: false,
              error: {
                errorCode: "SESSION_SOLD_OUT",
                errorMessage: "Requested Rezdy session has 0 seatsAvailable",
              },
            },
          });
        }

        // Decrement session seat inventory on hold
        targetSession.seatsAvailable -= Number(qty?.value || 1);

        orderCounter += 1;
        const orderNumber = `RZTEST${orderCounter}`;
        const nowIso = new Date().toISOString();
        const amount = Number(item.amount ?? validOption.price);

        const booking: RezdyV1Booking = {
          orderNumber,
          status: parsedBody.status || "PROCESSING",
          resellerReference: parsedBody.resellerReference || "",
          totalAmount: amount,
          totalCurrency: prod.currency,
          totalPaid: 0,
          totalDue: amount,
          dateCreated: nowIso,
          dateUpdated: nowIso,
          customer: parsedBody.customer || {
            firstName: "DCC",
            lastName: "Hold",
            email: "pilot-hold@destinationcommandcenter.com",
          },
          items: [
            {
              productName: prod.name,
              productCode: prod.productCode,
              startTimeLocal: item.startTimeLocal,
              amount,
              subtotal: amount,
              totalItemTax: 0,
              quantities: [
                {
                  optionLabel: validOption.label,
                  optionPrice: validOption.price,
                  value: Number(qty?.value || 1),
                  priceGroupType: "EACH",
                },
              ],
              sessionId: targetSession.id,
            },
          ],
          comments: parsedBody.comments,
        };

        bookingsByOrderNumber.set(orderNumber, booking);
        serverLogs.push({ method, path: reqUrl.pathname, status: 200, body: parsedBody });
        return sendJson(res, 200, {
          requestStatus: { success: true, version: "v1" },
          booking,
        });
      }

      // GET / PUT / DELETE /v1/bookings/{orderNumber}
      const orderMatch = reqUrl.pathname.match(/^\/v1\/bookings\/([^/]+)$/);
      if (orderMatch) {
        const orderNumber = decodeURIComponent(orderMatch[1]);
        const existing = bookingsByOrderNumber.get(orderNumber);
        if (!existing) {
          serverLogs.push({ method, path: reqUrl.pathname, status: 404 });
          return sendJson(res, 404, {
            requestStatus: {
              success: false,
              error: { errorCode: "404", errorMessage: `Order ${orderNumber} not found` },
            },
          });
        }

        if (method === "GET") {
          serverLogs.push({ method, path: reqUrl.pathname, status: 200 });
          return sendJson(res, 200, {
            requestStatus: { success: true, version: "v1" },
            booking: existing,
          });
        }

        if (method === "PUT") {
          const nowIso = new Date().toISOString();
          if (parsedBody?.status) {
            existing.status = parsedBody.status;
            if (parsedBody.status === "CONFIRMED") {
              existing.dateConfirmed = nowIso;
              existing.totalPaid = existing.totalAmount;
              existing.totalDue = 0;
            }
          }
          if (parsedBody?.customer) {
            existing.customer = { ...existing.customer, ...parsedBody.customer };
          }
          if (parsedBody?.resellerReference) {
            existing.resellerReference = parsedBody.resellerReference;
          }
          if (parsedBody?.comments) {
            existing.comments = parsedBody.comments;
          }
          existing.dateUpdated = nowIso;
          serverLogs.push({ method, path: reqUrl.pathname, status: 200, body: parsedBody });
          return sendJson(res, 200, {
            requestStatus: { success: true, version: "v1" },
            booking: existing,
          });
        }

        if (method === "DELETE") {
          const nowIso = new Date().toISOString();
          if (existing.status !== "CANCELLED") {
            existing.status = "CANCELLED";
            existing.dateUpdated = nowIso;
            // Release held seat back to session
            const firstItem = existing.items?.[0];
            if (firstItem?.sessionId) {
              const prodSessions = sessionsByProduct.get(firstItem.productCode) || [];
              const session = prodSessions.find((s) => s.id === firstItem.sessionId);
              if (session) {
                session.seatsAvailable += Number(firstItem.quantities?.[0]?.value || 1);
              }
            }
          }
          serverLogs.push({ method, path: reqUrl.pathname, status: 200 });
          return sendJson(res, 200, {
            requestStatus: { success: true, version: "v1" },
            booking: existing,
          });
        }
      }

      serverLogs.push({ method, path: reqUrl.pathname, status: 404 });
      return sendJson(res, 404, {
        requestStatus: {
          success: false,
          error: { errorCode: "404", errorMessage: `Unsupported path ${reqUrl.pathname}` },
        },
      });
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;

  return {
    baseUrl: `http://127.0.0.1:${port}/v1`,
    apiKey: expectedApiKey,
    getOrders: () => Array.from(bookingsByOrderNumber.values()),
    getServerLogs: () => [...serverLogs],
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
