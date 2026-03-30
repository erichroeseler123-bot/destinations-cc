import { listInventory } from "@/lib/inventoryStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const slots = await listInventory();
  const available = slots.filter((slot) => !slot.soldOut);

  return Response.json(
    {
      site: "redrocksfastpass",
      status: "ok",
      refreshedAt: new Date().toISOString(),
      recentBookingCount: 0,
      activeVenues: [
        {
          slug: "red-rocks-amphitheatre",
          label: "Red Rocks Amphitheatre",
          productCount: available.length,
          products: available.slice(0, 6).map((slot) => ({
            productCode: slot.id,
            name: `${slot.dateLabel} ${slot.departLabel} express loop`,
            fromPrice: 25,
            seatsLeft: slot.seatsLeft,
          })),
        },
      ],
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
