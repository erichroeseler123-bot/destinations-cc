import type { Metadata } from "next";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";

export const metadata: Metadata = {
  title: "Red Rocks Events Guide | Destination Command Center",
  description: "Red Rocks event planning with transportation, timing, and exit strategy for busy show nights.",
  alternates: { canonical: "/red-rocks-events" },
  keywords: [
    "red rocks events",
    "red rocks concerts",
    "red rocks concert transportation",
    "red rocks show planning",
    "how to get to red rocks concerts",
  ],
  openGraph: {
    title: "Red Rocks Events Guide | Destination Command Center",
    description: "On big Red Rocks nights, transport becomes part of the event plan, not an afterthought.",
    url: "/red-rocks-events",
    type: "article",
  },
};

export default function RedRocksEventsPage() {
  return (
    <RedRocksAuthorityPage
      eyebrow="DCC Event Planning"
      title="The bigger the Red Rocks show, the more transport becomes the real planning problem."
      intro="A headline Red Rocks night does not just change ticket demand. It changes parking pressure, pickup friction, and how hard it is to leave cleanly after the encore. That is why event planning here should include transportation from the start."
      sourcePath="/red-rocks-events"
      primaryCtaHref="/red-rocks-transportation"
      primaryCtaLabel="See The Transport Answer"
      secondaryCtaHref="/red-rocks-shuttle-vs-uber"
      secondaryCtaLabel="Shuttle Vs Uber"
      sections={[
        {
          title: "What changes on headline nights",
          body: "The same venue friction exists every night, but popular shows amplify it. Parking compresses earlier, rideshare gets weaker after the show, and the exit gets slower once the crowd peaks. Visitors who plan only the ticket and not the route usually feel that too late.",
        },
        {
          title: "What to solve before the show",
          body: "Before the gates matter, solve how you are arriving and how you are leaving. If you already know your group does not want to deal with parking chaos or a messy pickup after the show, transportation should be locked before the event day.",
          bullets: [
            "Sold-out nights make the ride home harder, not easier.",
            "Parking is still work even when the ticket is already solved.",
            "Shared and private rides are the cleaner path when the group wants certainty.",
          ],
        },
      ]}
    />
  );
}
