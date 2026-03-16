import type { Metadata } from "next";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";

export const metadata: Metadata = {
  title: "Red Rocks Guide | Destination Command Center",
  description: "Red Rocks venue, parking, transportation, concerts, and route planning from Denver in one authority-first guide.",
  alternates: { canonical: "/red-rocks" },
};

export default function RedRocksPage() {
  return (
    <RedRocksAuthorityPage
      eyebrow="DCC Red Rocks Hub"
      title="Red Rocks planning starts with route logic."
      intro="Destination Command Center handles the authority layer for Red Rocks: venue context, concert-night timing, parking reality, and transportation tradeoffs. When the ride decision is solved, Party At Red Rocks handles the shuttle and private-ride execution."
      sourcePath="/red-rocks"
      sections={[
        {
          title: "What Red Rocks demands from a plan",
          body: "Red Rocks is rarely a simple venue stop. Elevation, weather shifts, uphill walking, parking load, and post-show exit compression all change the quality of the night. The strongest plans solve ingress and egress first, then fit dinner, tailgating, and after-show decisions around that route certainty.",
        },
        {
          title: "The main decision stack",
          body: "Most visitors are really choosing among four layers: concert timing, parking tolerance, rideshare tolerance, and shuttle certainty. DCC should explain those tradeoffs clearly so the visitor understands when driving is workable, when parking gets punitive, and when a shuttle becomes the cleaner answer.",
          bullets: [
            "Driving works best when arrival is early and parking expectations are realistic.",
            "Rideshare is usually easier before the show than after the encore.",
            "Shared shuttles reduce post-show pickup uncertainty.",
            "Private rides fit groups that want tighter door-to-door control.",
          ],
        },
      ]}
    />
  );
}
