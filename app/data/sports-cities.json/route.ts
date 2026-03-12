import { NextResponse } from "next/server";
import { getSportsCitySlugs, getTeamsByCity } from "@/src/data/sports-teams-config";
import { getSportsVenuesByCity } from "@/src/data/sports-venues-config";

export function GET() {
  const cities = getSportsCitySlugs().map((citySlug) => {
    const teams = getTeamsByCity(citySlug);
    const venues = getSportsVenuesByCity(citySlug);
    const cityName = teams[0]?.cityName || citySlug;
    return {
      id: citySlug,
      slug: citySlug,
      type: "sports-city",
      name: cityName,
      teamCount: teams.length,
      venueCount: venues.length,
      teamSlugs: teams.map((team) => team.slug),
      venueSlugs: venues.map((venue) => venue.slug),
      url: `https://destinationcommandcenter.com/${citySlug}/sports`,
      updatedAt: "2026-03-12",
    };
  });

  return NextResponse.json({
    updatedAt: "2026-03-12",
    cities,
  });
}
