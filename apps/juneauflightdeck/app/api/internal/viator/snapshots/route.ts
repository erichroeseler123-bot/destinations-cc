import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const apiKey = (process.env.VIATOR_API_KEY || process.env.VIATOR_API)?.trim().replace(/^["']|["']$/g, "");

  if (!apiKey || apiKey.length < 20) {
    return NextResponse.json({ ok: false, error: "Missing or invalid API key" }, { status: 500 });
  }

  const queries = [
    { name: "Alaska (270) Helicopter", body: { filtering: { destination: "270" }, searchTerm: "helicopter", pagination: { start: 1, count: 50 }, currency: "USD" } },
    { name: "Alaska (270) TEMSCO", body: { filtering: { destination: "270" }, searchTerm: "TEMSCO", pagination: { start: 1, count: 50 }, currency: "USD" } },
    { name: "Alaska (270) Coastal", body: { filtering: { destination: "270" }, searchTerm: "Coastal Helicopters", pagination: { start: 1, count: 50 }, currency: "USD" } },
    { name: "Alaska (270) NorthStar", body: { filtering: { destination: "270" }, searchTerm: "NorthStar Trekking", pagination: { start: 1, count: 50 }, currency: "USD" } },
    { name: "Skagway (943) Helicopter", body: { filtering: { destination: "943" }, searchTerm: "helicopter", pagination: { start: 1, count: 50 }, currency: "USD" } },
  ];

  const searchResults: any[] = [];
  const foundProductMap = new Map<string, any>();

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
        const matches = products.filter((p: any) => {
          const t = (p.title || "").toLowerCase();
          return t.includes("helicopter") || t.includes("heli") || t.includes("sled") || t.includes("dog");
        });

        searchResults.push({
          query: q.name,
          totalCount: data.totalCount,
          returnedCount: products.length,
          matchesCount: matches.length,
        });

        for (const p of matches) {
          if (p.productCode && !foundProductMap.has(p.productCode)) {
            foundProductMap.set(p.productCode, {
              code: p.productCode,
              title: p.title,
            });
          }
        }
      } else {
        searchResults.push({ query: q.name, status: res.status });
      }
    } catch (err: any) {
      searchResults.push({ query: q.name, error: err.message });
    }
  }

  // Fetch full details for the matching products
  const fullDetails: any[] = [];
  for (const [code] of Array.from(foundProductMap.entries()).slice(0, 10)) {
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
      uniqueMatchesFound: foundProductMap.size,
      allMatches: Array.from(foundProductMap.values()),
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
