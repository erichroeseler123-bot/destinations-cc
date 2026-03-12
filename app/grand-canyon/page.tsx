import type { Metadata } from "next";
import AttractionPillarTemplate from "@/app/components/dcc/AttractionPillarTemplate";
import { GRAND_CANYON_PILLAR } from "@/src/data/attractions/grand-canyon";
import { withLiveFeaturedProducts } from "@/src/lib/vegas-pillar-products";

export const metadata: Metadata = {
  title: "Grand Canyon Tours, Rims, and Las Vegas Planning | Destination Command Center",
  description:
    "Plan Grand Canyon with route-first guidance on West Rim vs South Rim, Las Vegas day trips, helicopter upgrades, and Skywalk booking paths.",
  alternates: { canonical: "/grand-canyon" },
  openGraph: {
    title: "Grand Canyon Tours and Route Planning",
    description:
      "A pillar hub for Grand Canyon route choice, Las Vegas day trips, helicopter upgrades, and booking lanes.",
    url: GRAND_CANYON_PILLAR.pageUrl,
    type: "website",
  },
};

export default async function GrandCanyonPage() {
  const config = await withLiveFeaturedProducts(GRAND_CANYON_PILLAR);
  return <AttractionPillarTemplate config={config} />;
}
