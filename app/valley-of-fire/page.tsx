import type { Metadata } from "next";
import AttractionPillarTemplate from "@/app/components/dcc/AttractionPillarTemplate";
import { VALLEY_OF_FIRE_PILLAR } from "@/src/data/attractions/valley-of-fire";

export const metadata: Metadata = {
  title: "Valley of Fire Tours, Routes, and Las Vegas Planning | Destination Command Center",
  description:
    "Plan Valley of Fire with route-first guidance on scenic drives, hiking, desert day trips, and booking lanes from Las Vegas.",
  alternates: { canonical: "/valley-of-fire" },
  openGraph: {
    title: "Valley of Fire Tours and Route Planning",
    description:
      "A pillar hub for Valley of Fire scenic routes, hiking, Las Vegas day-trip logic, and booking lanes.",
    url: VALLEY_OF_FIRE_PILLAR.pageUrl,
    type: "website",
  },
};

export default function ValleyOfFirePage() {
  return <AttractionPillarTemplate config={VALLEY_OF_FIRE_PILLAR} />;
}
