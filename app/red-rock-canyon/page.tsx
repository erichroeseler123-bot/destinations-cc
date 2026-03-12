import type { Metadata } from "next";
import AttractionPillarTemplate from "@/app/components/dcc/AttractionPillarTemplate";
import { RED_ROCK_CANYON_PILLAR } from "@/src/data/attractions/red-rock-canyon";

export const metadata: Metadata = {
  title: "Red Rock Canyon Tours, Hiking, and Las Vegas Planning | Destination Command Center",
  description:
    "Plan Red Rock Canyon with route-first guidance on scenic loops, guided hikes, half-day Vegas tours, and outdoor alternatives to longer desert products.",
  alternates: { canonical: "/red-rock-canyon" },
  openGraph: {
    title: "Red Rock Canyon Tours and Route Planning",
    description:
      "A pillar hub for Red Rock Canyon scenic routes, guided hikes, Vegas outdoor planning, and booking lanes.",
    url: RED_ROCK_CANYON_PILLAR.pageUrl,
    type: "website",
  },
};

export default function RedRockCanyonPage() {
  return <AttractionPillarTemplate config={RED_ROCK_CANYON_PILLAR} />;
}
