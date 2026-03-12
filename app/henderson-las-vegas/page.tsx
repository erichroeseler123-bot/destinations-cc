import type { Metadata } from "next";
import AttractionPillarTemplate from "@/app/components/dcc/AttractionPillarTemplate";
import { HENDERSON_PILLAR } from "@/src/data/vegas-districts-config";

export const metadata: Metadata = {
  title: "Henderson Resorts, Lake Las Vegas, and Outdoor Planning | Destination Command Center",
  description: "Plan Henderson and Lake Las Vegas with route-first guidance on resort stays, outdoor recreation, golf, and lake-led trip planning.",
  alternates: { canonical: "/henderson-las-vegas" },
  openGraph: {
    title: "Henderson and Lake Las Vegas Planning",
    description: "A district hub for Henderson resorts, Lake Las Vegas, golf, and outdoor planning near Las Vegas.",
    url: HENDERSON_PILLAR.pageUrl,
    type: "website",
  },
};

export default function HendersonLasVegasPage() {
  return <AttractionPillarTemplate config={HENDERSON_PILLAR} />;
}
