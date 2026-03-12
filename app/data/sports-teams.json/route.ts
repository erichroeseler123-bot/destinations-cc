import { NextResponse } from "next/server";
import { SPORTS_TEAMS_CONFIG } from "@/src/data/sports-teams-config";

export function GET() {
  return NextResponse.json({
    updatedAt: "2026-03-12",
    teams: SPORTS_TEAMS_CONFIG.map((team) => ({
      id: team.slug,
      slug: team.slug,
      type: "sports-team",
      name: team.name,
      league: team.leagueSlug,
      city: {
        slug: team.citySlug,
        name: team.cityName,
        url: `https://destinationcommandcenter.com/${team.citySlug === "las-vegas" ? "vegas" : team.citySlug}`,
      },
      venue: {
        slug: team.venueSlug,
        name: team.venueName,
        url: `https://destinationcommandcenter.com/venues/${team.venueSlug}`,
      },
      url: `https://destinationcommandcenter.com/sports/team/${team.slug}`,
      updatedAt: team.updatedAt,
    })),
  });
}
