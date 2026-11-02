import type { Metadata } from "next";
import DccMachineContractExplainer from "@/app/components/dcc/DccMachineContractExplainer";
import LocationFirstHomeFast from "@/app/components/dcc/LocationFirstHomeFast";
import { getOrganizationSchema, getWebsiteSchema } from "@/src/data/site-identity";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Destination Command Center | Source-Backed Travel Decision Engine",
  description:
    "Source-backed travel decision engine. Check destination knowledge, schedule constraints, cited evidence, and live environmental conditions. Compare public transport, free activities, direct operator options, and marketplace options—or use DCC without buying anything.",
  alternates: { canonical: "https://destinationcommandcenter.com/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Destination Command Center | Source-Backed Travel Decision Engine",
    description:
      "Understand destinations, check practical constraints and evidence, and compare public transport, free activities, direct operators, and marketplace options.",
    url: "https://destinationcommandcenter.com",
    type: "website",
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      getWebsiteSchema(),
      getOrganizationSchema(),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LocationFirstHomeFast />
      <DccMachineContractExplainer />
    </>
  );
}
