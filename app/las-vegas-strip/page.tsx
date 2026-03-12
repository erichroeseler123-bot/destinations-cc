import type { Metadata } from "next";
import AttractionPillarTemplate from "@/app/components/dcc/AttractionPillarTemplate";
import { LAS_VEGAS_STRIP_PILLAR } from "@/src/data/attractions/las-vegas-strip";

export const metadata: Metadata = {
  title: "Las Vegas Strip Hotels, Attractions, and Nightlife | Destination Command Center",
  description:
    "Plan the Las Vegas Strip with route-first guidance on hotels, attractions, nightlife, and how the corridor fits the rest of a Vegas trip.",
  alternates: { canonical: "/las-vegas-strip" },
  openGraph: {
    title: "Las Vegas Strip Planning",
    description:
      "A pillar hub for Las Vegas Strip hotels, attractions, nightlife, and cluster-based itinerary planning.",
    url: LAS_VEGAS_STRIP_PILLAR.pageUrl,
    type: "website",
  },
};

export default function LasVegasStripPage() {
  return <AttractionPillarTemplate config={LAS_VEGAS_STRIP_PILLAR} />;
}
