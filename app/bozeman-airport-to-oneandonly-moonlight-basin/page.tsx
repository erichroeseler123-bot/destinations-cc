import type { Metadata } from "next";
import BigSkyTransportationPage from "@/app/components/dcc/BigSkyTransportationPage";

export const metadata: Metadata = {
  title: "Bozeman Airport to One&Only Moonlight Basin Transportation | DCC",
  description: "BZN to One&Only Moonlight Basin private transportation with a direct handoff to GoSno's $399 private Suburban service.",
  alternates: { canonical: "/bozeman-airport-to-oneandonly-moonlight-basin" },
};

export default function Page() {
  return <BigSkyTransportationPage
    eyebrow="One&Only Moonlight Basin airport transportation"
    title="Bozeman Airport to One&Only Moonlight Basin — solved"
    destination="One&Only Moonlight Basin"
    description="One&Only Moonlight Basin is included in GoSno's Big Sky service area at the same published $399 one-way private Suburban rate from BZN."
    driveTime="about 1 hr 15 min"
    canonicalPath="/bozeman-airport-to-oneandonly-moonlight-basin"
  />;
}
