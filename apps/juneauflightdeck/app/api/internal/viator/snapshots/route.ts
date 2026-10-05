import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SEARCH_TERMS = [
  "TEMSCO",
  "Coastal Helicopters",
  "NorthStar Trekking",
  "glacier helicopter",
  "helicopter dog sledding",
];

export async function GET(request: Request) {
  const apiKey = (process.env.VIATOR_API_KEY || process.env.VIATOR_API)?.trim().replace(/^["']|["']$/g, "");

  if (!apiKey || apiKey.length < 20) {
    return NextResponse.json({ ok: false, error: "Missing or invalid API key" }, { status: 500 });
  }

  const foundProductsMap = new Map<string, any>();

  for (const term of SEARCH_TERMS) {
    try {
      const res = await fetch("https://api.viator.com/partner/products/search", {
        method: "POST",
        headers: {
          "exp-api-key": apiKey,
          "Accept": "application/json;version=2.0",
          "Accept-Language": "en-US",
          "Content-Type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify({
          filtering: { destination: "941" },
          searchTerm: term,
          pagination: { start: 1, count: 10 },
          currency: "USD",
        }),
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        for (const p of data?.products || []) {
          if (p.productCode && !foundProductsMap.has(p.productCode)) {
            foundProductsMap.set(p.productCode, {
              matchedTerm: term,
              searchTitle: p.title,
            });
          }
        }
      }
    } catch {}
  }

  // Fetch full details for all unique products found
  const fullDetails: any[] = [];
  for (const [code, info] of Array.from(foundProductsMap.entries()).slice(0, 15)) {
    try {
      const pRes = await fetch(`https://api.viator.com/partner/products/${code}`, {
        headers: {
          "exp-api-key": apiKey,
          "Accept": "application/json;version=2.0",
          "Accept-Language": "en-US",
        },
        cache: "no-store",
      });
      if (pRes.ok) {
        const full = await pRes.json();
        fullDetails.push({
          productCode: code,
          matchedTerm: info.matchedTerm,
          title: full.title,
          supplierName: full.supplier?.name || "N/A",
          images: full.images || [],
          pricing: full.pricing,
          duration: full.duration,
          reviews: full.reviews,
          productUrl: full.productUrl || full.webUrl,
        });
      }
    } catch {}
  }

  return NextResponse.json(
    {
      ok: true,
      timestamp: new Date().toISOString(),
      uniqueFound: foundProductsMap.size,
      products: fullDetails,
    },
    {
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-store",
      },
    }
  );
}
