import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PRODUCT_CODES = ["10423P1", "10423P2", "25488P1", "3129P1"];

export async function GET(request: Request) {
  const apiKey = (process.env.VIATOR_API_KEY || process.env.VIATOR_API)?.trim().replace(/^["']|["']$/g, "");

  if (!apiKey || apiKey.length < 20) {
    return NextResponse.json(
      {
        ok: false,
        error: "VIATOR_API_KEY is not configured or is invalid in this environment.",
        keyConfigured: Boolean(apiKey),
        keyLength: apiKey ? apiKey.length : 0,
      },
      { status: 500 }
    );
  }

  const results: Array<{
    code: string;
    httpStatus: number;
    ok: boolean;
    data: any;
  }> = [];

  for (const code of PRODUCT_CODES) {
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

      const bodyText = await res.text();
      let parsedJson: any = null;
      try {
        parsedJson = JSON.parse(bodyText);
      } catch {
        parsedJson = { raw: bodyText.slice(0, 300) };
      }

      results.push({
        code,
        httpStatus: res.status,
        ok: res.ok,
        data: parsedJson,
      });
    } catch (err: any) {
      results.push({
        code,
        httpStatus: 0,
        ok: false,
        data: { error: err.message || "Network error" },
      });
    }
  }

  const allOk = results.every((r) => r.ok);

  return NextResponse.json(
    {
      ok: allOk,
      timestamp: new Date().toISOString(),
      productsCount: results.length,
      results,
    },
    {
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
