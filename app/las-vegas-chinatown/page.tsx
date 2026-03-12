import type { Metadata } from "next";
import AttractionPillarTemplate from "@/app/components/dcc/AttractionPillarTemplate";
import { CHINATOWN_PILLAR } from "@/src/data/vegas-districts-config";

export const metadata: Metadata = {
  title: "Las Vegas Chinatown Restaurants and Nightlife | Destination Command Center",
  description: "Plan Las Vegas Chinatown with route-first guidance on restaurants, karaoke, late-night food, and off-Strip nightlife.",
  alternates: { canonical: "/las-vegas-chinatown" },
  openGraph: {
    title: "Las Vegas Chinatown Planning",
    description: "A district hub for Chinatown restaurants, nightlife, karaoke, and off-Strip dining discovery.",
    url: CHINATOWN_PILLAR.pageUrl,
    type: "website",
  },
};

export default function LasVegasChinatownPage() {
  return <AttractionPillarTemplate config={CHINATOWN_PILLAR} />;
}
