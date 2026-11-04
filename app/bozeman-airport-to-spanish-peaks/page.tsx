import type { Metadata } from "next";
import BigSkyTransportationPage from "@/app/components/dcc/BigSkyTransportationPage";
import { getGoSnoRouteSnapshotDisplayPricing } from "@/lib/dcc/applicability";

export function generateMetadata(): Metadata {
  const bigSky = getGoSnoRouteSnapshotDisplayPricing({
    routeId: "BZN-BIG-SKY",
  });
  return {
    title: "Bozeman Airport to Spanish Peaks Transportation | DCC",
    description: `BZN to Spanish Peaks private transportation with a direct handoff to GoSno's ${bigSky.suvPriceLabel} private Suburban service.`,
    alternates: { canonical: "/bozeman-airport-to-spanish-peaks" },
  };
}

export default function Page() {
  const bigSky = getGoSnoRouteSnapshotDisplayPricing({
    routeId: "BZN-BIG-SKY",
  });
  return (
    <BigSkyTransportationPage
      eyebrow="Spanish Peaks airport transportation"
      title="Bozeman Airport to Spanish Peaks — solved"
      destination="Spanish Peaks"
      description={`Spanish Peaks is part of the same Big Sky service area, with GoSno's published ${bigSky.suvOneWayLabel} private Suburban rate from BZN.`}
      driveTime="about 1 hr 5–10 min"
      canonicalPath="/bozeman-airport-to-spanish-peaks"
    />
  );
}

