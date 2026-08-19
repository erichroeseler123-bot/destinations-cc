import type { Metadata } from "next";
import BigSkyTransportationPage from "@/app/components/dcc/BigSkyTransportationPage";

export const metadata: Metadata = {
  title: "Bozeman Airport to Montage Big Sky Transportation | DCC",
  description: "BZN to Montage Big Sky private transportation with a direct handoff to GoSno's $299 private Suburban service.",
  alternates: { canonical: "/bozeman-airport-to-montage-big-sky" },
};

export default function Page() {
  return <BigSkyTransportationPage
    eyebrow="Montage Big Sky airport transportation"
    title="Bozeman Airport to Montage Big Sky — solved"
    destination="Montage Big Sky"
    description="Montage Big Sky is included in GoSno's Big Sky service area at the same published $299 one-way private Suburban rate from BZN."
    driveTime="about 1 hr 5–10 min"
    canonicalPath="/bozeman-airport-to-montage-big-sky"
  />;
}
