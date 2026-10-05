import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const apiKey = (process.env.VIATOR_API_KEY || process.env.VIATOR_API)?.trim().replace(/^["']|["']$/g, "");

  if (!apiKey || apiKey.length < 20) {
    return NextResponse.json({ ok: false, error: "Missing API key" }, { status: 500 });
  }

  // Search 50 products matching 'helicopter' in Juneau
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
      pagination: { start: 1, count: 50 },
      currency: "USD",
    }),
    cache: "no-store",
  });

  const searchData = await searchRes.json().catch(() => ({}));
  const rawProducts = searchData?.products || [];

  const helicopterFiltered = rawProducts.filter((p: any) => {
    const t = (p.title || "").toLowerCase();
    const d = (p.description || "").toLowerCase();
    return t.includes("helicopter") || t.includes("heli") || t.includes("flight") || t.includes("glacier") || d.includes("helicopter");
  });

  // Fetch full details for the top matching products
  const detailedProducts: any[] = [];
  for (const item of helicopterFiltered.slice(0, 8)) {
    const code = item.productCode;
    if (!code) continue;
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
        detailedProducts.push(full);
      }
    } catch {}
  }

  return NextResponse.json(
    {
      ok: true,
      totalSearchResults: searchData?.totalCount,
      allSearchTitles: rawProducts.map((p: any) => ({ code: p.productCode, title: p.title })),
      detailedProducts,
    },
    {
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-store",
      },
    }
  );
}
