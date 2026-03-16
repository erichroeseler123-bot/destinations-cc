import type { Metadata } from "next";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";

export const metadata: Metadata = {
  title: "Red Rocks Events Guide | Destination Command Center",
  description: "Event-driven planning for Red Rocks concerts with guidance on timing, transportation, and route decisions.",
  alternates: { canonical: "/red-rocks-events" },
};

export default function RedRocksEventsPage() {
  return (
    <RedRocksAuthorityPage
      eyebrow="DCC Event Planning"
      title="Red Rocks events create transport demand as much as venue demand."
      intro="A Red Rocks event page should not stop at lineup or date awareness. The useful layer is showing how event popularity changes route timing, parking pressure, and whether a shuttle recommendation becomes the most sensible move."
      sourcePath="/red-rocks-events"
      sections={[
        {
          title: "What changes on headline nights",
          body: "High-demand dates amplify the same friction points every visitor faces: earlier ingress, faster parking compression, and slower pickup recovery after the show. That is why event-level planning should include transport guidance, not just show details.",
        },
        {
          title: "Getting to the show",
          body: "Shuttle and private rides are available through Party At Red Rocks for visitors who want to reduce parking and post-show pickup friction. DCC should frame that as a practical route recommendation, not a hard sell.",
        },
      ]}
    />
  );
}
