import type { Metadata } from "next";
import RegionalHubTemplate from "@/app/components/dcc/RegionalHubTemplate";
import TravelReferenceExperience from "@/app/components/dcc/TravelReferenceExperience";
import { getRegionalHubByStateSlug } from "@/lib/dcc/regionalHubs";
import { getTravelReferenceNodeById } from "@/lib/dcc/travelReference";

export const revalidate = 3600;

export const metadata: Metadata = {
  title:
    "Colorado Regional Travel Reference, Corridors & Coordinate Nodes | Destination Command Center",
  description:
    "Colorado regional travel reference connecting Denver, Red Rocks Amphitheatre, the I-70 Denver–Breckenridge mountain corridor, Idaho Springs, and live Front Range/Summit County coordinate intelligence.",
  alternates: { canonical: "https://destinationcommandcenter.com/regions/colorado" },
  robots: { index: true, follow: true },
};

export default function ColoradoRegion() {
  const hub = getRegionalHubByStateSlug("colorado");
  const corridorRef = getTravelReferenceNodeById("denver-breckenridge");

  return (
    <div className="bg-zinc-950 text-white">
      {hub ? <RegionalHubTemplate hub={hub} routePrefix="/regions" /> : null}
      {corridorRef ? <TravelReferenceExperience node={corridorRef} embedded /> : null}
    </div>
  );
}
