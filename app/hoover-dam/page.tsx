import type { Metadata } from "next";
import AttractionPillarTemplate from "@/app/components/dcc/AttractionPillarTemplate";
import { HOOVER_DAM_PILLAR } from "@/src/data/attractions/hoover-dam";
import { withLiveFeaturedProducts } from "@/src/lib/vegas-pillar-products";

export const metadata: Metadata = {
  title: "Hoover Dam Tours, History, and Las Vegas Planning | Destination Command Center",
  description:
    "Plan Hoover Dam with route-first guidance on express tours, history, engineering context, Lake Mead, and Las Vegas combo-tour decisions.",
  alternates: { canonical: "/hoover-dam" },
  openGraph: {
    title: "Hoover Dam Tours and Visitor Planning",
    description:
      "A pillar hub for Hoover Dam history, visitor planning, Vegas day-trip routing, and booking lanes.",
    url: HOOVER_DAM_PILLAR.pageUrl,
    type: "website",
  },
};

export default async function HooverDamPage() {
  const config = await withLiveFeaturedProducts(HOOVER_DAM_PILLAR);
  return <AttractionPillarTemplate config={config} />;
}
