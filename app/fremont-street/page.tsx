import type { Metadata } from "next";
import AttractionPillarTemplate from "@/app/components/dcc/AttractionPillarTemplate";
import { FREMONT_STREET_PILLAR } from "@/src/data/vegas-districts-config";

export const metadata: Metadata = {
  title: "Fremont Street Hotels, Casinos, and Downtown Vegas | Destination Command Center",
  description: "Plan Fremont Street with route-first guidance on downtown hotels, casinos, nightlife, attractions, and old-Vegas trip structure.",
  alternates: { canonical: "/fremont-street" },
  openGraph: {
    title: "Fremont Street and Downtown Vegas Planning",
    description: "A district hub for Fremont Street hotels, casinos, nightlife, attractions, and downtown route planning.",
    url: FREMONT_STREET_PILLAR.pageUrl,
    type: "website",
  },
};

export default function FremontStreetPage() {
  return <AttractionPillarTemplate config={FREMONT_STREET_PILLAR} />;
}
