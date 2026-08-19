import type { Metadata } from "next";
import BigSkyTransportationPage from "@/app/components/dcc/BigSkyTransportationPage";

export const metadata: Metadata = {
  title: "Bozeman Airport to Yellowstone Club Transportation | DCC",
  description: "BZN to Yellowstone Club private transportation: DCC route guidance with a direct handoff to GoSno's $399 private Suburban service.",
  alternates: { canonical: "/bozeman-airport-to-yellowstone-club" },
};

export default function Page() {
  return <BigSkyTransportationPage
    eyebrow="Yellowstone Club airport transportation"
    title="Bozeman Airport to Yellowstone Club — solved"
    destination="Yellowstone Club"
    description="Yellowstone Club sits in the same Big Sky service area, so GoSno uses the same published $399 one-way private Suburban rate from BZN."
    driveTime="about 1 hr 10–20 min"
    canonicalPath="/bozeman-airport-to-yellowstone-club"
  />;
}
