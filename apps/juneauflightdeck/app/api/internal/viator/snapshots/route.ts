import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const apiKey = (process.env.VIATOR_API_KEY || process.env.VIATOR_API)?.trim().replace(/^["']|["']$/g, "");

  if (!apiKey || apiKey.length < 20) {
    return NextResponse.json({ ok: false, error: "Missing or invalid API key" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const requestedCodes = searchParams.get("codes") || searchParams.get("code");
  const codes = requestedCodes
    ? requestedCodes.split(",").map((c) => c.trim()).filter(Boolean)
    : ["10423P1", "10423P2", "25488P1", "3129P1", "6251SHOREXICEWALK", "5010SYDNEY"];

  const results: any[] = [];
  for (const code of codes) {
    try {
      const res = await fetch(`https://api.viator.com/partner/products/${code}`, {
        headers: {
          "exp-api-key": apiKey,
          "Accept": "application/json;version=2.0",
          "Accept-Language": "en-US",
        },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      results.push({
        code,
        httpStatus: res.status,
        ok: res.ok,
        title: data?.title || null,
        supplierName: data?.supplier?.name || null,
        message: data?.message || null,
        imagesCount: data?.images?.length || 0,
        images: data?.images || [],
        pricing: data?.pricing,
        duration: data?.duration,
        reviews: data?.reviews,
        productUrl: data?.productUrl || data?.webUrl,
      });
    } catch (e: any) {
      results.push({ code, httpStatus: 0, ok: false, error: e.message });
    }
  }

  return NextResponse.json(
    {
      ok: results.some((r) => r.ok),
      timestamp: new Date().toISOString(),
      results,
    },
    {
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-store",
      },
    }
  );
}
