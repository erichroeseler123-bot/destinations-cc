import type { Metadata } from "next";
import AttractionPillarTemplate from "@/app/components/dcc/AttractionPillarTemplate";
import { LAKE_MEAD_PILLAR } from "@/src/data/attractions/lake-mead";

export const metadata: Metadata = {
  title: "Lake Mead Tours, Boating, and Las Vegas Planning | Destination Command Center",
  description:
    "Plan Lake Mead with route-first guidance on boating, kayaking, Hoover Dam combos, and outdoor day-trip logic from Las Vegas.",
  alternates: { canonical: "/lake-mead" },
  openGraph: {
    title: "Lake Mead Tours and Recreation Planning",
    description:
      "A pillar hub for Lake Mead boat tours, kayaking, Hoover Dam adjacency, and Las Vegas recreation planning.",
    url: LAKE_MEAD_PILLAR.pageUrl,
    type: "website",
  },
};

export default function LakeMeadPage() {
  return <AttractionPillarTemplate config={LAKE_MEAD_PILLAR} />;
}
