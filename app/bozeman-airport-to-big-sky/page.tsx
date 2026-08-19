import type { Metadata } from "next";
import BigSkyTransportationPage from "@/app/components/dcc/BigSkyTransportationPage";

export const metadata: Metadata = {
  title: "Bozeman Airport to Big Sky Transportation | DCC",
  description: "Compare the BZN to Big Sky transportation decision, then continue to GoSno for the $299 private Suburban route.",
  alternates: { canonical: "/bozeman-airport-to-big-sky" },
};

export default function Page() {
  return <BigSkyTransportationPage
    eyebrow="Bozeman airport transportation"
    title="Bozeman Airport to Big Sky — solved"
    destination="Big Sky Resort"
    description="For travelers landing at Bozeman Yellowstone International Airport and heading to Big Sky, the clean GoSno option is one private Suburban for the group at a published $299 one-way rate."
    driveTime="about 1 hour"
    canonicalPath="/bozeman-airport-to-big-sky"
  />;
}
