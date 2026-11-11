import type { Metadata } from "next";
import LocationFirstHomeFast from "@/app/components/dcc/LocationFirstHomeFast";
import { CONNECTED_CRUISE_PORT_COUNT } from "@/lib/dcc/cruisePortDirectory";
import { getOrganizationSchema, getWebsiteSchema } from "@/src/data/site-identity";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Destination Command Center | What Fits Your Trip?",
  description:
    "Compare tours, choose a cruise, find a ride, and check local conditions before you book. Source-backed travel guidance with no account needed.",
  alternates: { canonical: "https://destinationcommandcenter.com/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Destination Command Center | What Fits Your Trip?",
    description:
      "Compare tours, choose a cruise, find a ride, and check local conditions before you book.",
    url: "https://destinationcommandcenter.com",
    type: "website",
  },
};

export default function HomePage() {
  const cruisePortCount = CONNECTED_CRUISE_PORT_COUNT;
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
      <LocationFirstHomeFast cruisePortCount={cruisePortCount} />
    </>
  );
}
