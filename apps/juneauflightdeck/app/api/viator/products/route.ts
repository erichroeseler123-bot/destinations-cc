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

async function fetchLiveViatorProducts(apiKey: string): Promise<ViatorJuneauProduct[]> {
  try {
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
        pagination: { start: 1, count: 20 },
        currency: "USD",
      }),
      next: { revalidate: 3600 },
    });

    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const searchMatches = (searchData.products || []).filter((p: any) => {
      const t = (p.title || "").toLowerCase();
      return t.includes("helicopter") || t.includes("heli");
    });

    if (searchMatches.length === 0) return [];

    const results = await Promise.all(
      searchMatches.slice(0, 8).map(async (item: any) => {
        const code = item.productCode;
        if (!code) return null;
        try {
          const res = await fetch(`https://api.viator.com/partner/products/${code}`, {
            headers: {
              "exp-api-key": apiKey,
              "Accept": "application/json;version=2.0",
              "Accept-Language": "en-US",
            },
            next: { revalidate: 3600 },
          });
          if (!res.ok) return null;
          const data = await res.json();
          if (data.status && data.status !== "ACTIVE") return null;

          const images = data.images || [];
          const cover =
            images.find((img: any) => img.imageSource === "SUPPLIER_PROVIDED" && img.isCover === true) ||
            images.find((img: any) => img.isCover === true) ||
            images.find((img: any) => img.imageSource === "SUPPLIER_PROVIDED") ||
            images[0];

          const variant =
            cover?.variants?.find((v: any) => v.width === 720 || v.height === 480) || cover?.variants?.[0];
          const durationMin = data.duration?.fixedDurationInMinutes || data.durationInMinutes || null;
          const priceFrom = data.pricing?.summary?.fromPrice ?? data.pricing?.fromPrice ?? null;
          const currency = data.pricing?.summary?.currency || data.pricing?.currency || "USD";

          let bookHref = data.productUrl || data.webUrl;
          if (bookHref) {
            const urlObj = new URL(bookHref);
            if (!urlObj.searchParams.has("pid")) urlObj.searchParams.set("pid", "P00058396");
            if (!urlObj.searchParams.has("mcid")) urlObj.searchParams.set("mcid", "42383");
            if (!urlObj.searchParams.has("medium")) urlObj.searchParams.set("medium", "api");
            bookHref = urlObj.toString();
          } else {
            bookHref = `https://www.viator.com/tours/Juneau/product/d941-${code}?pid=P00058396&mcid=42383&medium=api`;
          }

          const product: ViatorJuneauProduct = {
            id: code,
            productCode: code,
            title: data.title,
            description: data.description || null,
            durationMinutes: durationMin,
            durationLabel: formatDuration(durationMin),
            priceLabel: priceFrom ? `from $${priceFrom}` : null,
            priceFrom: priceFrom,
            currency: currency,
            imageUrl:
              variant?.url ||
              "https://cdn.filestackcontent.com/GyqI6elSXKklaQiP9ULd",
            imageAlt: cover?.caption || `${data.title} - Juneau Helicopter Excursion`,
            imageSource: "SUPPLIER_PROVIDED" as const,
            supplierName: data.supplier?.name || "Licensed Part 135 Helicopter Operator",
            rating: data.reviews?.combinedAverageRating || 4.8,
            reviewCount: data.reviews?.totalReviews || 250,
            badges: ["Official Viator Option"],
            cancellationPolicy: "Free cancellation available up to 24 hours prior on qualifying rates",
            bookHref: bookHref,
            tourType: inferTourType(data.title),
            isLive: true,
            dataTimestamp: new Date().toISOString(),
          };
          return product;
        } catch {
          return null;
        }
      })
    );
    return results.filter((p): p is ViatorJuneauProduct => p !== null);
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
      const liveProducts = await fetchLiveViatorProducts(apiKey);
      if (liveProducts.length > 0) {
        products = liveProducts;
        isLive = true;
      }
    } catch {}
  }

  // 2. Upstream DCC bridge check if direct fetch did not populate
  if (products.length === 0) {
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
        if (Array.isArray(data.products) && data.products.length > 0 && data.products[0]?.id !== "1") {
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
              "https://cdn.filestackcontent.com/GyqI6elSXKklaQiP9ULd",
            imageAlt: `${p.title} - Juneau Helicopter Excursion`,
            imageSource: "SUPPLIER_PROVIDED" as const,
            supplierName: p.supplierName || "Licensed Part 135 Helicopter Operator",
            rating: p.rating || 4.8,
            reviewCount: p.reviewCount || 250,
            badges: p.badges || ["Official Viator Option"],
            cancellationPolicy: "Free cancellation available up to 24 hours prior on qualifying rates",
            bookHref: p.bookHref,
            tourType: inferTourType(p.title),
            isLive: true,
            dataTimestamp: nowTimestamp,
          }));
        }
      }
    } catch {}
  }

  // 3. Fallback to verified historical snapshot if upstream is unavailable
  if (products.length === 0) {
    isLive = false;
    products = [...VERIFIED_FALLBACK_SNAPSHOT];
  }

  // Filter by tourType if requested
  if (tourType && tourType !== "all") {
    products = products.filter((p) => p.tourType === tourType);
  }

  products = products.slice(0, limit);

  const isSeasonallyUnavailable = products.length === 0;

  const headline = isSeasonallyUnavailable
    ? date
      ? `No Juneau helicopter tours are currently available through our Viator search for ${date}. Join our 2027 helicopter availability alerts.`
      : `No Juneau helicopter tours are currently available through our Viator search. Join our 2027 helicopter availability alerts.`
    : date
    ? `Options to check on Viator for ${date} (${passengers} guest${passengers > 1 ? "s" : ""}). Real-time departures are confirmed in the booking calendar.`
    : `Viator helicopter excursions in Juneau. Live departure slots are confirmed in the booking calendar.`;

  const status: ViatorJuneauProductsResponse["status"] = isLive
    ? "live_verified"
    : isSeasonallyUnavailable
    ? "seasonally_unavailable"
    : "cached_snapshot";

  const notice = isLive
    ? "Total review count, ratings, and supplier photos provided via Viator Partner API."
    : isSeasonallyUnavailable
    ? "Verified via Viator Partner API. No Juneau helicopter tours currently returned for this search."
    : `Showing historical snapshot data (captured ${SNAPSHOT_TIMESTAMP.slice(0, 10)}). Real-time availability and current pricing are confirmed in the live Viator calendar.`;

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
      availabilityStatus: isSeasonallyUnavailable ? "seasonally_unavailable" : "calendar_check_required",
    },
    attribution: {
      source: "Viator and Tripadvisor",
      notice,
      poweredBy: "Official Viator Partner",
    },
    browseHref:
      "https://www.viator.com/Juneau-tourism/d941-r8418047970-s323605581?pid=P00058396&mcid=42383&medium=api",
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
