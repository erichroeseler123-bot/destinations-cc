import type { Metadata } from "next";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";

export const metadata: Metadata = {
  title: "Red Rocks Concert Guide | Destination Command Center",
  description: "Concert-night planning for Red Rocks including arrival windows, weather, route friction, and transportation recommendations.",
  alternates: { canonical: "/red-rocks-concert-guide" },
};

export default function RedRocksConcertGuidePage() {
  return (
    <RedRocksAuthorityPage
      eyebrow="DCC Concert Guide"
      title="Red Rocks concert nights reward earlier decisions."
      intro="Concert-night success at Red Rocks comes from timing discipline. The venue experience is strong when arrival windows, weather prep, and ride-home assumptions are solved before the day gets crowded."
      sourcePath="/red-rocks-concert-guide"
      sections={[
        {
          title: "Arrival timing",
          body: "For major shows, arriving 60 to 90 minutes before showtime usually produces a cleaner entry, better parking outcomes, and less stress on the uphill approach. Visitors who compress arrival often lose that time back in traffic, parking friction, and entry queues.",
        },
        {
          title: "Weather and recovery",
          body: "Warm Denver afternoons can create false confidence. Red Rocks nights cool off quickly, wind changes the feel of the bowl, and the walk back out after the encore is more punishing when the rider is cold, late, or dealing with an uncertain pickup plan.",
        },
      ]}
    />
  );
}
