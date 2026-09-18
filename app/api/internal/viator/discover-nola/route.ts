import { NextRequest, NextResponse } from "next/server";
import { getViatorServerConfig } from "@/lib/viator/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow sufficient time for multi-page fetch

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

  // 2. Read VIATOR_API_KEY
  const serverConfig = getViatorServerConfig();
  const apiKey = serverConfig.apiKey;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "VIATOR_API_KEY is not configured in environment" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const startPage = Math.max(1, parseInt(searchParams.get("startPage") || "1", 10));
  const maxPages = Math.min(6, Math.max(1, parseInt(searchParams.get("maxPages") || "3", 10)));
  const destination = searchParams.get("destination") || "675"; // Default New Orleans

  const searchResultsProducts: Array<Record<string, unknown>> = [];
  let totalDestinationCount = 0;

  // 3. Paginated Search
  for (let p = 0; p < maxPages; p++) {
    const pageIndex = startPage + p;
    const startRecord = (pageIndex - 1) * 50 + 1;

    const searchPayload = {
      filtering: { destination },
      sorting: { sort: "DEFAULT" },
      pagination: { start: startRecord, count: 50 },
      currency: "USD",
    };

    const res = await viatorFetch("/products/search", apiKey, {
      method: "POST",
      body: searchPayload,
    });

    if (!res.ok) {
      break;
    }

    const data = res.json as {
      totalCount?: number;
      products?: Array<Record<string, unknown>>;
    };

    if (data?.totalCount) {
      totalDestinationCount = data.totalCount;
    }

    const products = data?.products || [];
    if (!Array.isArray(products) || products.length === 0) {
      break;
    }

    searchResultsProducts.push(...products);

    if (startRecord + products.length > totalDestinationCount) {
      break;
    }
  }

  // 4. Deduplicate product codes
  const codeMap = new Map<string, Record<string, unknown>>();
  for (const item of searchResultsProducts) {
    const code = String(item.productCode || "").trim();
    if (code && !codeMap.has(code)) {
      codeMap.set(code, item);
    }
  }
  const uniqueCodes = Array.from(codeMap.keys());

  // 5. Bulk Hydration (up to 500 product codes per call)
  const hydratedProductsMap = new Map<string, Record<string, unknown>>();
  if (uniqueCodes.length > 0) {
    // Process in batches of 100 for safety
    for (let i = 0; i < uniqueCodes.length; i += 100) {
      const batch = uniqueCodes.slice(i, i + 100);
      const bulkRes = await viatorFetch("/products/bulk", apiKey, {
        method: "POST",
        body: { productCodes: batch },
      });

      if (bulkRes.ok && Array.isArray(bulkRes.json)) {
        for (const prod of bulkRes.json as Array<Record<string, unknown>>) {
          const c = String(prod.productCode || "").trim();
          if (c) hydratedProductsMap.set(c, prod);
        }
      }
    }
  }

  // 6. Supplier Search
  const supplierLookupMap = new Map<string, Record<string, unknown>>();
  if (uniqueCodes.length > 0) {
    for (let i = 0; i < uniqueCodes.length; i += 100) {
      const batch = uniqueCodes.slice(i, i + 100);
      const suppRes = await viatorFetch("/suppliers/search/product-codes", apiKey, {
        method: "POST",
        body: { productCodes: batch },
      });

      if (suppRes.ok) {
        const suppData = suppRes.json as { suppliers?: Array<Record<string, unknown>> };
        const suppliersList = suppData?.suppliers || [];
        for (const s of suppliersList) {
          const c = String(s.productCode || "").trim();
          if (c) supplierLookupMap.set(c, s);
        }
      }
    }
  }

  // 7. Assemble Unified Crosswalk Data
  const unifiedProducts = uniqueCodes.map((code) => {
    const searchItem = codeMap.get(code) || {};
    const hydrated = hydratedProductsMap.get(code) || {};
    const supplierInfo = supplierLookupMap.get(code) || {};

    const supplierFromHydrated = (hydrated.supplier as Record<string, unknown>)?.name;
    const supplierName =
      (supplierInfo.name as string) ||
      (supplierFromHydrated as string) ||
      "Unknown Supplier";

    const supplierRef = (supplierInfo.reference as string) || null;
    const title = (hydrated.title as string) || (searchItem.title as string) || "";
    const status = (hydrated.status as string) || "ACTIVE";
    const productUrl = (hydrated.productUrl as string) || (hydrated.webUrl as string) || null;

    const pricing = (hydrated.pricing as Record<string, unknown>)?.summary as Record<string, unknown> | undefined;
    const searchPricing = searchItem.pricing as Record<string, unknown> | undefined;
    const searchSummary = searchPricing?.summary as Record<string, unknown> | undefined;
    const fromPrice = pricing?.fromPrice ?? searchSummary?.fromPrice ?? null;

    const reviews = (hydrated.reviews || searchItem.reviews) as Record<string, unknown> | undefined;
    const rating = reviews?.combinedAverageRating ?? null;
    const reviewCount = reviews?.totalReviews ?? null;

    return {
      productCode: code,
      title,
      status,
      supplierName,
      supplierReference: supplierRef,
      supplierVerified: Boolean(supplierInfo.supplierInfoVerified),
      fromPrice,
      rating,
      reviewCount,
      productUrl,
      durationMinutes:
        (hydrated.duration as Record<string, unknown>)?.fixedDurationInMinutes ?? null,
    };
  });

  // 8. Group by Supplier
  const supplierGroups: Record<
    string,
    {
      supplierName: string;
      supplierReference: string | null;
      productCount: number;
      activeProductCount: number;
      products: typeof unifiedProducts;
    }
  > = {};

  for (const item of unifiedProducts) {
    const name = item.supplierName;
    if (!supplierGroups[name]) {
      supplierGroups[name] = {
        supplierName: name,
        supplierReference: item.supplierReference,
        productCount: 0,
        activeProductCount: 0,
        products: [],
      };
    }
    supplierGroups[name].productCount++;
    if (item.status === "ACTIVE") {
      supplierGroups[name].activeProductCount++;
    }
    supplierGroups[name].products.push(item);
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    destination,
    totalDestinationCount,
    pagesScanned: { startPage, count: maxPages },
    uniqueProductsCount: unifiedProducts.length,
    uniqueSuppliersCount: Object.keys(supplierGroups).length,
    suppliers: Object.values(supplierGroups).sort(
      (a, b) => b.activeProductCount - a.activeProductCount
    ),
    products: unifiedProducts,
  });
}
