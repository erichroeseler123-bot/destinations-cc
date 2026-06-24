import { notFound } from "next/navigation";
import { MOCK_48H_INVENTORY } from "@/lib/mock-48h-inventory";
import { hydratePlaceData } from "@/lib/place-hydration";
import { redis } from "@/lib/redis";
import CheckoutClient from "./CheckoutClient";

export const runtime = "edge";

interface CheckoutPageProps {
  params: Promise<{
    itemId: string;
  }>;
  searchParams: Promise<{
    place?: string;
  }>;
}

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const { itemId } = await params;
  const { place: placeId } = await searchParams;

  // 1. Try to find in mock inventory first
  let happening = MOCK_48H_INVENTORY.find((item) => item.id === itemId);

  // 2. If not found and placeId is provided, look up from hydrated cache
  if (!happening && placeId) {
    try {
      const payload = await hydratePlaceData(placeId);
      const cachedHappenings = payload.data?.happenings || [];
      const found = cachedHappenings.find((item: any) => item.id === itemId);
      if (found) {
        happening = {
          id: found.id,
          title: found.title,
          category: found.category || found.type || "Activity",
          type: found.type || "tour",
          startTime: found.startTime || new Date().toISOString(),
          durationLabel: found.durationLabel || "2 hours",
          price: found.price || 0,
          priceLabel: found.priceLabel || `$${found.price}`,
          imageUrl: found.imageUrl || "/images/fallback-tour.png",
          actionUrl: found.actionUrl || "#",
          actionText: found.actionText || "Book Now",
          urgencyLabel: found.urgencyLabel || "Seats open",
          distanceText: found.distanceText || "Local location",
          coordinates: found.coordinates || { lat: 0, lng: 0 },
          whyItFits: found.whyItFits || ""
        };
      }
    } catch (err) {
      console.error("Failed to look up happening from cache:", err);
    }
  }

  if (!happening) {
    notFound();
  }

  // Override checkout actionUrl if partner claimed node
  if (placeId && redis) {
    try {
      const config = await redis.get(`dcc:partner:place:${placeId}`);
      if (config) {
        const partner = typeof config === "string" ? JSON.parse(config) : config;
        if (partner && partner.squareCheckoutUrl) {
          happening.actionUrl = partner.squareCheckoutUrl;
        }
      }
    } catch (err) {
      console.error("Failed to query partner config for checkout override:", err);
    }
  }

  return <CheckoutClient happening={happening} placeId={placeId || "new-orleans-la"} />;
}
