import type { Metadata } from "next";
import AttractionPillarTemplate from "@/app/components/dcc/AttractionPillarTemplate";
import { SUMMERLIN_PILLAR } from "@/src/data/vegas-districts-config";

export const metadata: Metadata = {
  title: "Summerlin Shopping, Dining, and Red Rock Access | Destination Command Center",
  description: "Plan Summerlin with route-first guidance on shopping, dining, west-side Vegas stays, and Red Rock access.",
  alternates: { canonical: "/summerlin" },
  openGraph: {
    title: "Summerlin Planning",
    description: "A district hub for Summerlin shopping, dining, west-side stays, and Red Rock crossover planning.",
    url: SUMMERLIN_PILLAR.pageUrl,
    type: "website",
  },
};

export default function SummerlinPage() {
  return <AttractionPillarTemplate config={SUMMERLIN_PILLAR} />;
}
