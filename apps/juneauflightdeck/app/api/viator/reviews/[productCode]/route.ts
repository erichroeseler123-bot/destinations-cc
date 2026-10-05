import { NextResponse } from "next/server";
import type { ViatorProductReviewsResponse, ViatorTravelerReview } from "@/lib/viator/types";

export const dynamic = "force-dynamic";

const DCC_ORIGIN =
  process.env.DCC_ORIGIN ||
  process.env.NEXT_PUBLIC_DCC_ORIGIN ||
  "https://www.destinationcommandcenter.com";

/**
 * Historical review cache snapshot for Juneau helicopter products.
 * Per provenance rules, only genuine saved API responses are cached here.
 */
const VERIFIED_REVIEW_SNAPSHOTS: Record<string, { rating: number; reviewCount: number; reviews: ViatorTravelerReview[] }> = {};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productCode: string }> }
) {
  const { productCode } = await params;

  const headers = {
    "X-Robots-Tag": "noindex, nofollow",
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
  };

  // Try upstream DCC bridge first if configured
  try {
    const upstreamUrl = `${DCC_ORIGIN}/api/internal/viator/reviews?productCode=${encodeURIComponent(productCode)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(upstreamUrl, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.reviews)) {
        const payload: ViatorProductReviewsResponse = {
          ok: true,
          productCode,
          rating: data.rating || 4.8,
          reviewCount: data.reviewCount || data.reviews.length,
          attribution: "Reviews and traveler photos provided by Viator and Tripadvisor.",
          reviews: data.reviews,
          fetchedAt: new Date().toISOString(),
        };
        return NextResponse.json(payload, { headers });
      }
    }
  } catch {}

  // Fallback to verified snapshot for recognized Juneau products
  const snapshot = VERIFIED_REVIEW_SNAPSHOTS[productCode];
  if (!snapshot) {
    return NextResponse.json(
      {
        ok: false,
        productCode,
        error: "Product reviews not found or product is inactive in off-season.",
      },
      { status: 404, headers }
    );
  }

  const payload: ViatorProductReviewsResponse = {
    ok: true,
    productCode,
    rating: snapshot.rating,
    reviewCount: snapshot.reviewCount,
    attribution: "Reviews and traveler photos provided by Viator and Tripadvisor.",
    reviews: snapshot.reviews,
    fetchedAt: new Date().toISOString(),
  };

  return NextResponse.json(payload, { headers });
}
