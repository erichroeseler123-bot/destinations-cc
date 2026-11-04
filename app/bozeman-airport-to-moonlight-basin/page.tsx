import type { Metadata } from "next";
import BigSkyTransportationPage from "@/app/components/dcc/BigSkyTransportationPage";
import { getGoSnoRouteSnapshotDisplayPricing } from "@/lib/dcc/applicability";

export function generateMetadata(): Metadata {
  const bigSky = getGoSnoRouteSnapshotDisplayPricing({
    routeId: "BZN-BIG-SKY",
  });
  return {
    title: "Bozeman Airport to Moonlight Basin Transportation | DCC",
    description: `BZN to Moonlight Basin private transportation with a direct handoff to GoSno's ${bigSky.suvPriceLabel} private Suburban service.`,
    alternates: { canonical: "/bozeman-airport-to-moonlight-basin" },
  };
}

export default function Page() {
  const bigSky = getGoSnoRouteSnapshotDisplayPricing({
    routeId: "BZN-BIG-SKY",
  });
  return (
    <BigSkyTransportationPage
      eyebrow="Moonlight Basin airport transportation"
      title="Bozeman Airport to Moonlight Basin — solved"
      destination="Moonlight Basin"
      description={`Moonlight Basin is included in GoSno's Big Sky service area at the same published ${bigSky.suvOneWayLabel} private Suburban rate from BZN.`}
      driveTime="about 1 hr 15 min"
      canonicalPath="/bozeman-airport-to-moonlight-basin"
    />
  );
}

