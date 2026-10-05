import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TARGET_CODES = ["10423P1", "10423P2", "25488P1", "3129P1", "5010SYDNEY"];

export async function GET(request: Request) {
  const apiKey = (process.env.VIATOR_API_KEY || process.env.VIATOR_API)?.trim().replace(/^["']|["']$/g, "");

  if (!apiKey || apiKey.length < 20) {
    return NextResponse.json(
      {
        ok: false,
        error: "VIATOR_API_KEY is not configured or is invalid in this environment.",
      },
      { status: 500 }
    );
  }

  // 1. Check direct product codes
  const productLookups: any[] = [];
  for (const code of TARGET_CODES) {
    try {
      const res = await fetch(`https://api.viator.com/partner/products/${code}`, {
        method: "GET",
        headers: {
          "exp-api-key": apiKey,
          "Accept": "application/json;version=2.0",
          "Accept-Language": "en-US",
        },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      productLookups.push({
        code,
        httpStatus: res.status,
        ok: res.ok,
        title: data?.title || null,
        supplier: data?.supplier?.name || null,
        message: data?.message || null,
        imagesCount: data?.images?.length || 0,
        data: res.ok ? data : undefined,
      });
    } catch (e: any) {
      productLookups.push({ code, httpStatus: 0, error: e.message });
    }
  }

  // 2. Search for active Juneau helicopter products via POST /products/search
  let searchResults: any = null;
  let searchHttpStatus = 0;
  try {
    const searchRes = await fetch("https://api.viator.com/partner/products/search", {
      method: "POST",
      headers: {
        "exp-api-key": apiKey,
        "Accept": "application/json;version=2.0",
        "Accept-Language": "en-US",
        "Content-Type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify({
        filtering: { destination: "941" },
        searchTerm: "helicopter",
        pagination: { start: 1, count: 10 },
        currency: "USD",
      }),
      cache: "no-store",
    });
    searchHttpStatus = searchRes.status;
    if (searchRes.ok) {
      searchResults = await searchRes.json();
    } else {
      searchResults = await searchRes.text();
    }
  } catch (err: any) {
    searchResults = { error: err.message };
  }

  // 3. For any discovered search products, fetch their full product details to get supplier photos
  const discoveredProducts: any[] = [];
  const discoveredList = Array.isArray(searchResults?.products) ? searchResults.products : [];
  for (const item of discoveredList.slice(0, 6)) {
    const pCode = item.productCode;
    if (!pCode) continue;
    try {
      const pRes = await fetch(`https://api.viator.com/partner/products/${pCode}`, {
        headers: {
          "exp-api-key": apiKey,
          "Accept": "application/json;version=2.0",
          "Accept-Language": "en-US",
        },
        cache: "no-store",
      });
      if (pRes.ok) {
        const fullProd = await pRes.json();
        discoveredProducts.push({
          productCode: pCode,
          httpStatus: pRes.status,
          title: fullProd.title,
          supplier: fullProd.supplier?.name,
          images: fullProd.images,
          productUrl: fullProd.productUrl || fullProd.webUrl,
          pricing: fullProd.pricing,
          duration: fullProd.duration,
          reviews: fullProd.reviews,
        });
      }
    } catch {}
  }

  return NextResponse.json(
    {
      ok: true,
      timestamp: new Date().toISOString(),
      productLookups,
      searchHttpStatus,
      totalSearchResults: searchResults?.totalCount ?? 0,
      discoveredCount: discoveredProducts.length,
      discoveredProducts,
    },
    {
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-store",
      },
    }
  );
}
