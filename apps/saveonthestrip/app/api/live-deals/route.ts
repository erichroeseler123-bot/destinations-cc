import { NextResponse } from "next/server";
import { getVegasTours } from "@/lib/fareharbor";
import { getVegasShows } from "@/lib/ticketmaster";

export const revalidate = 300;

export async function GET() {
  const [tourFeed, shows] = await Promise.all([
    getVegasTours().catch(() => ({ tours: [], companies: [], configured: false })),
    getVegasShows().catch(() => []),
  ]);

  const featuredShows = shows.slice(0, 5).map((show) => ({
    id: show.id,
    name: show.name,
    venueName: show.venueName,
    localDate: show.localDate,
    imageUrl: show.imageUrl,
    url: show.url,
  }));

  const featuredTours = tourFeed.tours.slice(0, 6).map((tour) => ({
    id: tour.id,
    name: tour.name,
    area: tour.area,
    areaLabel: tour.areaLabel,
    fromPrice: tour.fromPrice,
    imageUrl: tour.imageUrl,
    productUrl: tour.productUrl,
  }));

  return NextResponse.json(
    {
      site: "saveonthestrip",
      status: "ok",
      refreshedAt: new Date().toISOString(),
      configured: {
        fareHarbor: tourFeed.configured,
        ticketmaster: shows.length > 0,
      },
      featuredDeals: [
        {
          slug: "shows",
          label: "Vegas shows",
          href: "/shows",
          note: "Sphere nights, comedy, and current show picks.",
        },
        {
          slug: "tours",
          label: "Vegas tours",
          href: "/tours",
          note: "Grand Canyon, Hoover Dam, and one-big-outing planning.",
        },
        {
          slug: "deals",
          label: "Vegas deals",
          href: "/deals",
          note: "Free ticket pickup, discounts, and value-first shortcuts.",
        },
      ],
      shows: featuredShows,
      tours: featuredTours,
    },
    {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
