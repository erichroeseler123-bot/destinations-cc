import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const apiKey = (process.env.VIATOR_API_KEY || process.env.VIATOR_API)?.trim().replace(/^["']|["']$/g, "");

  if (!apiKey || apiKey.length < 20) {
    return NextResponse.json({ ok: false, error: "Missing or invalid API key" }, { status: 500 });
  }

  const queries = [
    { name: "Juneau Helicopter (no dest)", body: { searchTerm: "Juneau helicopter", pagination: { start: 1, count: 50 }, currency: "USD" } },
    { name: "Mendenhall Helicopter (no dest)", body: { searchTerm: "Mendenhall helicopter", pagination: { start: 1, count: 50 }, currency: "USD" } },
    { name: "TEMSCO (no dest)", body: { searchTerm: "TEMSCO", pagination: { start: 1, count: 50 }, currency: "USD" } },
    { name: "Coastal Helicopters (no dest)", body: { searchTerm: "Coastal Helicopters", pagination: { start: 1, count: 50 }, currency: "USD" } },
    { name: "NorthStar Trekking (no dest)", body: { searchTerm: "NorthStar Trekking", pagination: { start: 1, count: 50 }, currency: "USD" } },
    { name: "Alaska Helicopter (no dest)", body: { searchTerm: "Alaska helicopter", pagination: { start: 1, count: 50 }, currency: "USD" } },
  ];

  const searchResults: any[] = [];
  const foundProductCodes = new Set<string>();

  for (const q of queries) {
    try {
      const res = await fetch("https://api.viator.com/partner/products/search", {
        method: "POST",
        headers: {
          "exp-api-key": apiKey,
          "Accept": "application/json;version=2.0",
          "Accept-Language": "en-US",
          "Content-Type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify(q.body),
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        const products = data.products || [];
        const heliMatches = products.filter((p: any) => {
          const t = (p.title || "").toLowerCase();
          return t.includes("helicopter") || t.includes("heli") || t.includes("dog sled") || t.includes("glacier landing");
        });

        searchResults.push({
          query: q.name,
          totalCount: data.totalCount,
          returnedCount: products.length,
          heliMatches: heliMatches.map((p: any) => ({
            code: p.productCode,
            title: p.title,
            destinations: p.destinations,
          })),
        });

        for (const p of heliMatches) {
          if (p.productCode) foundProductCodes.add(p.productCode);
        }
      } else {
        searchResults.push({ query: q.name, status: res.status });
      }
    } catch (err: any) {
      searchResults.push({ query: q.name, error: err.message });
    }
  }

  // Fetch full details for every product code found
  const fullDetails: any[] = [];
  for (const code of Array.from(foundProductCodes)) {
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
        fullDetails.push(full);
      }
    } catch {}
  }

  return NextResponse.json(
    {
      ok: true,
      timestamp: new Date().toISOString(),
      searches: searchResults,
      uniqueHeliProductsFound: fullDetails.length,
      fullDetails,
    },
    {
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-store",
      },
    }
  );
}
