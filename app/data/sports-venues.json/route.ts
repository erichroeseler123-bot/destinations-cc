import { NextResponse } from "next/server";
import { SPORTS_VENUES_CONFIG } from "@/src/data/sports-venues-config";

export function GET() {
  return NextResponse.json({
    updatedAt: "2026-03-12",
    venues: SPORTS_VENUES_CONFIG.map((venue) => ({
      id: venue.slug,
      slug: venue.slug,
      type: "sports-venue",
      name: venue.name,
      city: {
        slug: venue.citySlug,
        name: venue.cityName,
        url: `https://destinationcommandcenter.com/${venue.citySlug === "las-vegas" ? "vegas" : venue.citySlug}`,
      },
      leagues: venue.sportsLeagues,
      primaryTeams: venue.primaryTeams,
      url: `https://destinationcommandcenter.com/venues/${venue.slug}`,
      updatedAt: venue.updatedAt,
    })),
  });
}
