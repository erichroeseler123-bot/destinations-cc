import type { Metadata } from "next";
import AttractionPillarTemplate from "@/app/components/dcc/AttractionPillarTemplate";
import { HELICOPTER_TOURS_PILLAR } from "@/src/data/attractions/helicopter-tours";

export const metadata: Metadata = {
  title: "Helicopter Tours | Las Vegas, Grand Canyon, and Hoover Dam Flights",
  description:
    "Compare helicopter tours across Las Vegas, Grand Canyon, and Hoover Dam with a cleaner premium-booking path than generic city pages.",
  alternates: { canonical: "/helicopter-tours" },
  openGraph: {
    title: "Helicopter Tours",
    description:
      "A category hub for Las Vegas Strip flights, Grand Canyon helicopter tours, Hoover Dam aerial routes, and premium scenic products.",
    url: HELICOPTER_TOURS_PILLAR.pageUrl,
    type: "website",
  },
};

export default function HelicopterToursPage() {
  return <AttractionPillarTemplate config={HELICOPTER_TOURS_PILLAR} />;
}
