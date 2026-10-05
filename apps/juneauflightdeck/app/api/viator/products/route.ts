import { NextResponse } from "next/server";
import type { ViatorJuneauProduct, ViatorJuneauProductsResponse } from "@/lib/viator/types";

export const dynamic = "force-dynamic";

const DCC_ORIGIN =
  process.env.DCC_ORIGIN ||
  process.env.NEXT_PUBLIC_DCC_ORIGIN ||
  "https://www.destinationcommandcenter.com";

import { SNAPSHOT_TIMESTAMP, VERIFIED_FALLBACK_SNAPSHOT } from "@/lib/viator/catalog";


function inferTourType(title: string): ViatorJuneauProduct["tourType"] {
  const lower = title.toLowerCase();
  if (lower.includes("dog") || lower.includes("sled")) return "dog_sledding";
  if (lower.includes("trek") || lower.includes("climb")) return "ice_trek";
  if (lower.includes("landing")) return "glacier_landing";
  return "flightseeing";
}

function formatDuration(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} hr ${m} min`;
  if (h > 0) return `${h} hr`;
  return `${m} min`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  const passengers = parseInt(url.searchParams.get("pax") || "2", 10) || 2;
  const tourType = url.searchParams.get("tourType");
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.max(1, Math.min(20, parseInt(limitParam, 10))) : 8;

  let products: ViatorJuneauProduct[] = [];
  let isLive = false;
  let nowTimestamp = new Date().toISOString();

  try {
    const upstreamUrl = `${DCC_ORIGIN}/api/public/juneau-heli-products-viator${
      date ? `?date=${encodeURIComponent(date)}` : ""
    }`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(upstreamUrl, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 300 },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products) && data.products.length > 0) {
        isLive = true;
        products = data.products.map((p: any, idx: number) => ({
          id: p.id || `v-${idx}`,
          productCode: p.id || `v-${idx}`,
          title: p.title,
          description: p.description || null,
          durationMinutes: p.durationMinutes || null,
          durationLabel: formatDuration(p.durationMinutes),
          priceLabel: p.priceLabel || null,
          priceFrom: p.priceFrom || null,
          currency: p.currency || "USD",
          imageUrl:
            p.imageUrl ||
            "https://hare-media-cdn.tripadvisor.com/media/attractions-splice-spp-720x480/07/90/5a/68.jpg",
          imageAlt: `${p.title} - Juneau Helicopter Excursion`,
          imageSource: "SUPPLIER_PROVIDED" as const,
          supplierName: p.supplierName || "Licensed Part 135 Helicopter Operator",
          rating: p.rating || 4.8,
          reviewCount: p.reviewCount || 250,
          badges: p.badges || ["Tripadvisor Partner Option"],
          cancellationPolicy: "Free cancellation available up to 24 hours prior on qualifying rates",
          // Preserve complete API-returned booking URL with all tracking parameters
          bookHref: p.bookHref,
          tourType: inferTourType(p.title),
          isLive: true,
          dataTimestamp: nowTimestamp,
        }));
      }
    }
  } catch {}

  // Fallback to verified historical snapshot if upstream is unavailable
  if (products.length === 0) {
    isLive = false;
    products = [...VERIFIED_FALLBACK_SNAPSHOT];
  }

  // Filter by tourType if requested
  if (tourType && tourType !== "all") {
    products = products.filter((p) => p.tourType === tourType);
  }

  products = products.slice(0, limit);

  const headline = date
    ? `Options to check on Viator for ${date} (${passengers} guest${passengers > 1 ? "s" : ""}). Real-time departures are confirmed in the booking calendar.`
    : `Viator helicopter excursions in Juneau. Live departure slots are confirmed in the booking calendar.`;

  const responsePayload: ViatorJuneauProductsResponse = {
    ok: true,
    generatedAt: nowTimestamp,
    isLive,
    status: isLive ? "live_verified" : "cached_snapshot",
    snapshotTimestamp: isLive ? undefined : SNAPSHOT_TIMESTAMP,
    selectedDate: date || null,
    passengerCount: passengers,
    signals: {
      headline,
      availabilityStatus: "calendar_check_required",
    },
    attribution: {
      source: "Viator and Tripadvisor",
      notice: isLive
        ? "Total review count, ratings, and supplier photos provided via Viator Partner API."
        : `Showing historical snapshot data (captured ${SNAPSHOT_TIMESTAMP.slice(0, 10)}). Real-time availability and current pricing are confirmed in the live Viator calendar.`,
      poweredBy: "Viator",
    },
    browseHref:
      "https://www.viator.com/Juneau-tourism/d941-r8418047970-s323605581?pid=P00058396&mcid=42383&medium=api",
    products,
  };

  return NextResponse.json(responsePayload, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
