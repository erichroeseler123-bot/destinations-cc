import { NextResponse } from "next/server";
import type { ViatorJuneauProduct, ViatorJuneauProductsResponse } from "@/lib/viator/types";

export const dynamic = "force-dynamic";

const DCC_ORIGIN =
  process.env.DCC_ORIGIN ||
  process.env.NEXT_PUBLIC_DCC_ORIGIN ||
  "https://www.destinationcommandcenter.com";

import { SNAPSHOT_TIMESTAMP, VERIFIED_FALLBACK_SNAPSHOT } from "@/lib/viator/catalog";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

async function fetchLiveViatorProducts(
  apiKey: string,
  date?: string | null,
  passengers?: number,
): Promise<ViatorJuneauProduct[]> {
  try {
    const res = await fetch("https://api.viator.com/partner/products/6251SHOREXICEWALK", {
      headers: {
        "exp-api-key": apiKey,
        Accept: "application/json;version=2.0",
        "Accept-Language": "en-US",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (data.status && data.status !== "ACTIVE") return [];

    const images = data.images || [];
    const cover =
      images.find((img: any) => img.imageSource === "SUPPLIER_PROVIDED" && img.isCover === true) ||
      images.find((img: any) => img.isCover === true) ||
      images.find((img: any) => img.imageSource === "SUPPLIER_PROVIDED") ||
      images[0];

    const variant =
      cover?.variants?.find((v: any) => v.width === 720 || v.height === 480) ||
      cover?.variants?.[0];
    const durationMin = data.duration?.fixedDurationInMinutes || data.durationInMinutes || 155;
    const hasWorryFreeTag = Array.isArray(data.tags) && data.tags.includes(367649);

    const baseCoastal = VERIFIED_FALLBACK_SNAPSHOT.find(
      (p) => p.id === "coastal-icefield-landing",
    )!;
    const urlObj = new URL(
      data.productUrl ||
        "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK",
    );
    urlObj.searchParams.set("pid", "P00058396");
    urlObj.searchParams.set("mcid", "42383");
    urlObj.searchParams.set("medium", "api");
    urlObj.searchParams.set("campaign", "jfd-coastal-icefield-walk");
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      urlObj.searchParams.set("startDate", date);
    }
    if (typeof passengers === "number" && passengers > 0) {
      urlObj.searchParams.set("numTravelers", String(passengers));
    }

    const liveCoastal: ViatorJuneauProduct = {
      ...baseCoastal,
      title: data.title || baseCoastal.title,
      description: data.description || baseCoastal.description,
      durationMinutes: durationMin,
      durationLabel: formatDuration(durationMin) || baseCoastal.durationLabel,
      imageUrl: variant?.url || baseCoastal.imageUrl,
      imageAlt: cover?.caption || baseCoastal.imageAlt,
      imageSource: variant?.url ? "SUPPLIER_PROVIDED" : baseCoastal.imageSource,
      supplierName: data.supplier?.name || "Coastal Helicopters",
      rating: data.reviews?.combinedAverageRating || 4.8,
      reviewCount: data.reviews?.totalReviews || 643,
      worryFreeShoreExcursion: hasWorryFreeTag,
      worryFreeTagId: hasWorryFreeTag ? 367649 : null,
      bookHref: urlObj.toString(),
      isLive: true,
      dataTimestamp: new Date().toISOString(),
    };

    return [
      liveCoastal,
      ...VERIFIED_FALLBACK_SNAPSHOT.filter((p) => p.id !== "coastal-icefield-landing"),
    ];
  } catch {
    return [];
  }
}

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
  const nowTimestamp = new Date().toISOString();

  // 1. Direct live fetch via Viator Partner API if VIATOR_API_KEY or VIATOR_API is configured
  const apiKey = (process.env.VIATOR_API_KEY || process.env.VIATOR_API)?.trim().replace(/^["']|["']$/g, "");
  if (apiKey && apiKey.length > 20) {
    try {
      const liveProducts = await fetchLiveViatorProducts(apiKey, date, passengers);
      if (liveProducts.length > 0) {
        products = liveProducts;
        isLive = true;
      }
    } catch {}
  }

  // 2. Fallback to verified operator profiles if live API fetch did not populate
  if (products.length === 0) {
    isLive = false;
    products = VERIFIED_FALLBACK_SNAPSHOT.map((p) => {
      try {
        const u = new URL(p.bookHref);
        if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
          u.searchParams.set("startDate", date);
        }
        if (passengers > 0) {
          u.searchParams.set("numTravelers", String(passengers));
        }
        return { ...p, bookHref: u.toString() };
      } catch {
        return p;
      }
    });
  }

  // Filter by tourType if requested
  if (tourType && tourType !== "all") {
    products = products.filter((p) => p.tourType === tourType);
  }

  products = products.slice(0, limit);

  const hasNoProducts = products.length === 0;

  const headline = hasNoProducts
    ? date
      ? `No helicopter flight results currently returned for ${date}. Set up an availability alert below.`
      : `Direct booking calendar feed is currently updating. Set up an availability alert below.`
    : date
    ? `Options to check for ${date} (${passengers} guest${passengers > 1 ? "s" : ""}). Confirm final price and availability in Viator.`
    : `Juneau helicopter excursions via Viator. Confirm final price and availability in Viator.`;

  const status: ViatorJuneauProductsResponse["status"] = isLive
    ? "live_verified"
    : hasNoProducts
    ? "inventory_unavailable"
    : "operator_profiles";

  const notice = isLive
    ? "Live Viator Partner API product metadata (6251SHOREXICEWALK, Worry-Free Shore Excursion Tag 367649). Confirm final price and availability in Viator."
    : hasNoProducts
    ? "No Juneau helicopter tours currently returned for this search query."
    : "Showing verified Juneau operator flight profiles and Viator booking links. Confirm final price and availability in Viator.";

  const responsePayload: ViatorJuneauProductsResponse = {
    ok: true,
    generatedAt: nowTimestamp,
    isLive,
    status,
    snapshotTimestamp: isLive ? undefined : SNAPSHOT_TIMESTAMP,
    selectedDate: date || null,
    passengerCount: passengers,
    signals: {
      headline,
      availabilityStatus: hasNoProducts ? "inventory_unavailable" : "calendar_check_required",
    },
    attribution: {
      source: isLive ? "Viator Partner API v2.0" : "Juneau Operator Profiles & Viator Partner Network",
      notice,
      poweredBy: "Official Viator Partner (pid=P00058396)",
    },
    browseHref:
      "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK?pid=P00058396&mcid=42383&medium=api&campaign=jfd-catalog-featured",
    waitlistHref: "/helicopter-waitlist",
    products,
  };

  return NextResponse.json(responsePayload, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      ...CORS_HEADERS,
    },
  });
}
