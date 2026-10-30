import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const apiKey = (process.env.VIATOR_API_KEY || process.env.VIATOR_API)?.trim().replace(/^["']|["']$/g, "");

  if (!apiKey || apiKey.length < 20) {
    return NextResponse.json({ ok: false, error: "Missing or invalid API key" }, { status: 500 });
  }

  const url = new URL(request.url);
  const codesParam = url.searchParams.get("codes");

  if (codesParam) {
    const codes = codesParam.split(",").map((c) => c.trim()).filter(Boolean);
    const results = await Promise.all(
      codes.map(async (code) => {
        try {
          const res = await fetch(`https://api.viator.com/partner/products/${code}`, {
            headers: {
              "exp-api-key": apiKey,
              "Accept": "application/json;version=2.0",
              "Accept-Language": "en-US",
            },
            cache: "no-store",
          });
          const text = await res.text();
          let json = null;
          try {
            json = JSON.parse(text);
          } catch {}
          return {
            code,
            statusCode: res.status,
            ok: res.ok,
            data: json || text,
          };
        } catch (err: any) {
          return {
            code,
            statusCode: 500,
            ok: false,
            error: err.message,
          };
        }
      })
    );

    return NextResponse.json(
      {
        ok: true,
        timestamp: new Date().toISOString(),
        productResults: results,
      },
      {
        headers: {
          "X-Robots-Tag": "noindex, nofollow",
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const searchTermParam = url.searchParams.get("search")?.trim();
  const destIdParam = url.searchParams.get("destId")?.trim() || "941";
  const startParam = Math.max(1, Number(url.searchParams.get("start")) || 1);
  const countParam = Math.min(50, Math.max(1, Number(url.searchParams.get("count")) || 50));

  const queries = searchTermParam
    ? [
        {
          name: `Freetext "${searchTermParam}" (dest ${destIdParam}, start ${startParam})`,
          endpoint: "https://api.viator.com/partner/search/freetext",
          body: {
            searchTerm: searchTermParam,
            productFiltering: { destination: destIdParam },
            searchTypes: [
              {
                searchType: "PRODUCTS",
                pagination: { start: startParam, count: countParam },
              },
            ],
            currency: "USD",
          },
        },
      ]
    : [
        {
          name: "Juneau (941) Helicopter Freetext",
          endpoint: "https://api.viator.com/partner/search/freetext",
          body: {
            searchTerm: "helicopter",
            productFiltering: { destination: "941" },
            searchTypes: [{ searchType: "PRODUCTS", pagination: { start: 1, count: 50 } }],
            currency: "USD",
          },
        },
        {
          name: "Juneau (941) Coastal Helicopters Freetext",
          endpoint: "https://api.viator.com/partner/search/freetext",
          body: {
            searchTerm: "Coastal Helicopters",
            productFiltering: { destination: "941" },
            searchTypes: [{ searchType: "PRODUCTS", pagination: { start: 1, count: 50 } }],
            currency: "USD",
          },
        },
        {
          name: "Juneau (941) TEMSCO Freetext",
          endpoint: "https://api.viator.com/partner/search/freetext",
          body: {
            searchTerm: "TEMSCO",
            productFiltering: { destination: "941" },
            searchTypes: [{ searchType: "PRODUCTS", pagination: { start: 1, count: 50 } }],
            currency: "USD",
          },
        },
        {
          name: "Juneau (941) NorthStar Trekking Freetext",
          endpoint: "https://api.viator.com/partner/search/freetext",
          body: {
            searchTerm: "NorthStar Trekking",
            productFiltering: { destination: "941" },
            searchTypes: [{ searchType: "PRODUCTS", pagination: { start: 1, count: 50 } }],
            currency: "USD",
          },
        },
      ];

  const searchResults: any[] = [];
  const foundProductMap = new Map<string, any>();

  for (const q of queries) {
    try {
      const res = await fetch(q.endpoint, {
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
        const productsBlock = data.products || {};
        const products = Array.isArray(productsBlock)
          ? productsBlock
          : Array.isArray(productsBlock.results)
            ? productsBlock.results
            : [];
        const totalCount =
          typeof productsBlock.totalCount === "number"
            ? productsBlock.totalCount
            : typeof data.totalCount === "number"
              ? data.totalCount
              : products.length;

        searchResults.push({
          query: q.name,
          endpoint: q.endpoint,
          totalCount,
          returnedCount: products.length,
        });

        for (const p of products) {
          if (p.productCode && !foundProductMap.has(p.productCode)) {
            foundProductMap.set(p.productCode, {
              code: p.productCode,
              title: p.title,
            });
          }
        }
      } else {
        searchResults.push({ query: q.name, endpoint: q.endpoint, status: res.status });
      }
    } catch (err: any) {
      searchResults.push({ query: q.name, endpoint: q.endpoint, error: err.message });
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
