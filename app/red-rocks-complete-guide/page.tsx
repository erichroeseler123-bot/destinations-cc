import type { Metadata } from "next";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";
import { PARR_OPERATOR } from "@/lib/parrOperator";

export const metadata: Metadata = {
  title: "Red Rocks Complete Guide | Destination Command Center",
  description: "A complete Red Rocks guide covering the venue, concerts, parking, tailgating, and transportation.",
  alternates: { canonical: "/red-rocks-complete-guide" },
  keywords: [
    "red rocks complete guide",
    "red rocks concert guide",
    "red rocks transportation",
    "red rocks parking and shuttle",
    "first time red rocks guide",
  ],
  openGraph: {
    title: "Red Rocks Complete Guide | Destination Command Center",
    description: "Complete Red Rocks planning stack covering concerts, parking, tailgating, and transportation from Denver.",
    url: "/red-rocks-complete-guide",
    type: "article",
  },
};


export default function RedRocksCompleteGuidePage() {
  return (
    <RedRocksAuthorityPage
      eyebrow="DCC Complete Guide"
      title="The full Red Rocks planning stack in one guide."
      intro="This page is the authority-first overview for Red Rocks: venue basics, concert timing, parking decisions, tailgating expectations, and transportation options. DCC resolves the planning layer. Party at Red Rocks handles the ride once the transportation decision is made."
      sourcePath="/red-rocks-complete-guide"
      operatorAttribution={PARR_OPERATOR}
      sections={[
        {
          title: "Venue overview",
          body: "Red Rocks is an amphitheatre with unusually high scenic value and unusually visible logistics friction. Visitors remember the sandstone bowl and skyline, but the quality of the night is heavily shaped by the route in, the walk up, and the plan for getting out.",
        },
        {
          title: "Concerts and timing",
          body: "Concert nights reward early arrival and lighter post-show expectations. Once the show window gets compressed, every other part of the plan gets weaker.",
        },
        {
          title: "Parking and tailgating",
          body: "Parking is workable when done early and deliberately. Tailgating can fit the night well, but only if it does not undermine arrival discipline or create a fragile exit plan.",
        },
        {
          title: "Transportation",
          body: "Transportation to Red Rocks is available through several options. Many visitors use Party at Red Rocks for shared shuttles and private rides because it removes part of the parking and pickup burden from the night.",
        },
      ]}
    />
  );
}
