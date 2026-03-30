import { NextResponse } from "next/server";
import { fetchAvailabilitiesForItem, fetchItems } from "@/lib/dcc/liveSlots/fareharbor";
import { getMarketShortname } from "@/lib/dcc/liveSlots/marketRules";
import { normalizeSlot, shouldIncludeItem } from "@/lib/dcc/liveSlots/normalize";
import { buildSignals } from "@/lib/dcc/liveSlots/signals";
import type { LiveSlot, LiveSlotsResponse } from "@/lib/dcc/liveSlots/types";

export const dynamic = "force-dynamic";

function lowestRateCents(
  rates: Array<{ price?: number }> | null | undefined,
) {
  const values = (rates || [])
    .map((rate) => Number(rate.price))
    .filter((value) => Number.isFinite(value) && value > 0);
  return values.length ? Math.min(...values) : undefined;
}

export async function GET() {
  try {
    const market = "new-orleans-swamp" as const;
    const shortname = getMarketShortname(market);

    if (!shortname) {
      return NextResponse.json({ error: "Missing FareHarbor swamp shortname" }, { status: 500 });
    }

    const now = new Date();
    const end = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const startDate = now.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);

    const items = await fetchItems(shortname);
    const eligibleItems = items.filter((item) => shouldIncludeItem(market, item.title || item.name || ""));

    const nestedSlots = await Promise.all(
      eligibleItems.map(async (item) => {
        const availabilities = await fetchAvailabilitiesForItem(item.pk || "", startDate, endDate);
        return availabilities.map((availability) =>
          normalizeSlot({
            market,
            shortname,
            itemId: item.pk || "",
            itemTitle: item.title || item.name || "",
            availabilityId: availability.pk,
            startIso: availability.start_at || availability.start || "",
            capacity: availability.capacity,
            bookedCount: availability.booked_count,
            lowestRateCents: lowestRateCents(availability.customer_type_rates),
          }),
        );
      }),
    );

    const slots = nestedSlots
      .flat()
      .filter((slot): slot is LiveSlot => Boolean(slot))
      .sort((a, b) => a.startIso.localeCompare(b.startIso))
      .slice(0, 8);

    const body: LiveSlotsResponse = {
      market,
      generatedAt: new Date().toISOString(),
      queryContext: {
        date: null,
        windowHours: 48,
      },
      signals: await buildSignals(market),
      slots,
    };

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Live swamp slots unavailable";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
