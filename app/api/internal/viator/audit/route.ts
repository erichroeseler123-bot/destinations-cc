import { NextRequest, NextResponse } from "next/server";
import { getViatorServerConfig } from "@/lib/viator/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuditResult = {
  endpoint: string;
  method: string;
  status: number;
  statusText: string;
  ok: boolean;
  dataSummary?: Record<string, unknown>;
  error?: unknown;
};

async function viatorFetch(
  endpoint: string,
  apiKey: string,
  options: { method?: string; body?: unknown } = {}
): Promise<{ status: number; statusText: string; ok: boolean; json: unknown }> {
  const url = `https://api.viator.com/partner${endpoint}`;
  try {
    const res = await fetch(url, {
      method: options.method || "GET",
      headers: {
        Accept: "application/json;version=2.0",
        "Accept-Language": "en-US",
        "Content-Type": "application/json;charset=UTF-8",
        "exp-api-key": apiKey,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });

    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    return {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      json,
    };
  } catch (err) {
    return {
      status: 0,
      statusText: err instanceof Error ? err.message : "Network Error",
      ok: false,
      json: null,
    };
  }
}

export async function GET(request: NextRequest) {
  // 1. Verify internal secret
  const internalSecret = process.env.INTERNAL_API_SECRET?.trim();
  const headerSecret = request.headers.get("x-internal-secret")?.trim() || "";
  const authHeader = request.headers.get("authorization")?.trim() || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!internalSecret || (headerSecret !== internalSecret && bearerToken !== internalSecret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // 2. Read VIATOR_API_KEY without exposing it
  const serverConfig = getViatorServerConfig();
  const apiKey = serverConfig.apiKey;

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        keyMetadata: { present: false, length: 0 },
        error: "VIATOR_API_KEY is not configured in environment",
      },
      { status: 503 }
    );
  }

  const keyMetadata = {
    present: true,
    length: apiKey.length,
  };

  const productCodes = ["3780AIRBOAT", "3780SWAMP", "6953SWAMPTRANS"];
  const travelDate = "2026-10-15";
  const results: AuditResult[] = [];

  // A. /destinations
  {
    const res = await viatorFetch("/destinations", apiKey);
    const data = res.json as { destinations?: unknown[] } | unknown[];
    const destList: unknown[] = Array.isArray(data)
      ? data
      : Array.isArray((data as { destinations?: unknown[] })?.destinations)
      ? ((data as { destinations?: unknown[] }).destinations ?? [])
      : [];

    results.push({
      endpoint: "/destinations",
      method: "GET",
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      dataSummary: res.ok
        ? {
            totalDestinations: destList.length,
            sampleDestination: destList[0] || null,
          }
        : undefined,
      error: !res.ok ? res.json : undefined,
    });
  }

  // B. Product Details: /products/{code}
  for (const code of productCodes) {
    const res = await viatorFetch(`/products/${code}`, apiKey);
    const data = (res.json || {}) as Record<string, unknown>;

    results.push({
      endpoint: `/products/${code}`,
      method: "GET",
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      dataSummary: res.ok
        ? {
            productCode: data.productCode,
            title: data.title,
            productUrl: data.productUrl || null,
            webUrl: data.webUrl || null,
            status: data.status,
            bookingConfirmationType:
              (data.bookingConfirmationSettings as Record<string, unknown>)?.confirmationType || null,
            duration: (data.duration as Record<string, unknown>)?.fixedDurationInMinutes || null,
            pricing: data.pricing || null,
            hasImages: Array.isArray(data.images) && data.images.length > 0,
            imageCount: Array.isArray(data.images) ? data.images.length : 0,
            hasReviews: Boolean(data.reviews),
            reviewSummary: data.reviews || null,
            cancellationPolicyType:
              (data.cancellationPolicy as Record<string, unknown>)?.type || null,
            supplier: (data.supplier as Record<string, unknown>)?.name || null,
          }
        : undefined,
      error: !res.ok ? res.json : undefined,
    });
  }

  // C. Availability Schedules: /availability/schedules/{product-code}
  for (const code of productCodes) {
    const res = await viatorFetch(`/availability/schedules/${code}`, apiKey);
    const data = (res.json || {}) as Record<string, unknown>;

    results.push({
      endpoint: `/availability/schedules/${code}`,
      method: "GET",
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      dataSummary: res.ok
        ? {
            productCode: data.productCode,
            currency: data.currency,
            bookableItemsCount: Array.isArray(data.bookableItems) ? data.bookableItems.length : 0,
            sampleBookableItem: Array.isArray(data.bookableItems) ? data.bookableItems[0] : null,
            unavailableDatesCount: Array.isArray(data.unavailableDates) ? data.unavailableDates.length : 0,
          }
        : undefined,
      error: !res.ok ? res.json : undefined,
    });
  }

  // D. Real-Time Availability Check: /availability/check
  for (const code of productCodes) {
    const res = await viatorFetch("/availability/check", apiKey, {
      method: "POST",
      body: {
        productCode: code,
        travelDate,
        currency: "USD",
        paxMix: [{ ageBand: "ADULT", numberOfTravelers: 2 }],
      },
    });
    const data = (res.json || {}) as Record<string, unknown>;
    const bookableItems = Array.isArray(data.bookableItems) ? data.bookableItems : [];

    results.push({
      endpoint: `/availability/check?productCode=${code}`,
      method: "POST",
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      dataSummary: res.ok
        ? {
            productCode: data.productCode,
            currency: data.currency,
            travelDate: data.travelDate,
            bookableItemsCount: bookableItems.length,
            availableOptions: bookableItems.map((item) => {
              const rec = item as Record<string, unknown>;
              const totalPrice = rec.totalPrice as Record<string, unknown> | undefined;
              const priceObj = totalPrice?.price as Record<string, unknown> | undefined;
              return {
                productOptionCode: rec.productOptionCode,
                startTime: rec.startTime,
                available: rec.available,
                remainingCapacity: (rec.capacity as Record<string, unknown>)?.remainingCapacity ?? null,
                recommendedRetailPrice: priceObj?.recommendedRetailPrice ?? null,
                partnerNetPrice: priceObj?.partnerNetPrice ?? null,
                commission: priceObj?.commission ?? null,
              };
            }),
          }
        : undefined,
      error: !res.ok ? res.json : undefined,
    });
  }

  // E. Product Reviews: /reviews/product
  for (const code of productCodes) {
    const res = await viatorFetch("/reviews/product", apiKey, {
      method: "POST",
      body: {
        productCode: code,
        provider: "ALL",
        count: 5,
        start: 1,
      },
    });
    const data = (res.json || {}) as Record<string, unknown>;
    const reviews = Array.isArray(data.reviews) ? data.reviews : [];

    results.push({
      endpoint: `/reviews/product?productCode=${code}`,
      method: "POST",
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      dataSummary: res.ok
        ? {
            productCode: code,
            totalReviews: data.totalReviewsSummary || data.reviewCount || reviews.length,
            reviewsCountReturned: reviews.length,
            sampleReview: reviews[0] || null,
          }
        : undefined,
      error: !res.ok ? res.json : undefined,
    });
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    keyMetadata,
    results,
  });
}
