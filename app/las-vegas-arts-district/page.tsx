import type { Metadata } from "next";
import AttractionPillarTemplate from "@/app/components/dcc/AttractionPillarTemplate";
import { ARTS_DISTRICT_PILLAR } from "@/src/data/vegas-districts-config";

export const metadata: Metadata = {
  title: "Las Vegas Arts District Bars, Restaurants, and Galleries | Destination Command Center",
  description: "Plan the Las Vegas Arts District with local-night guidance for bars, restaurants, breweries, galleries, and downtown-adjacent routing.",
  alternates: { canonical: "/las-vegas-arts-district" },
  openGraph: {
    title: "Las Vegas Arts District Planning",
    description: "A district hub for bars, restaurants, breweries, galleries, and local-night planning in the Arts District.",
    url: ARTS_DISTRICT_PILLAR.pageUrl,
    type: "website",
  },
};

export default function LasVegasArtsDistrictPage() {
  return <AttractionPillarTemplate config={ARTS_DISTRICT_PILLAR} />;
}
