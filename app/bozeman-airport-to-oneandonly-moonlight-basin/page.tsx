import type { Metadata } from "next";
import BigSkyTransportationPage from "@/app/components/dcc/BigSkyTransportationPage";
import { getGoSnoRouteSnapshotDisplayPricing } from "@/lib/dcc/applicability";

export function generateMetadata(): Metadata {
  const bigSky = getGoSnoRouteSnapshotDisplayPricing({
    routeId: "BZN-BIG-SKY",
  });
  return {
    title: "Bozeman Airport to One&Only Moonlight Basin Transportation | DCC",
    description: `BZN to One&Only Moonlight Basin private transportation with a direct handoff to GoSno's ${bigSky.suvPriceLabel} private Suburban service.`,
    alternates: { canonical: "/bozeman-airport-to-oneandonly-moonlight-basin" },
  };
}

export default function Page() {
  const bigSky = getGoSnoRouteSnapshotDisplayPricing({
    routeId: "BZN-BIG-SKY",
  });
  return (
    <BigSkyTransportationPage
      eyebrow="One&Only Moonlight Basin airport transportation"
      title="Bozeman Airport to One&Only Moonlight Basin — solved"
      destination="One&Only Moonlight Basin"
      description={`One&Only Moonlight Basin is included in GoSno's Big Sky service area at the same published ${bigSky.suvOneWayLabel} private Suburban rate from BZN.`}
      driveTime="about 1 hr 15 min"
      canonicalPath="/bozeman-airport-to-oneandonly-moonlight-basin"
    />
  );
}

