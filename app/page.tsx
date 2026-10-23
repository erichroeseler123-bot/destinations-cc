import type { Metadata } from "next";
import { headers } from "next/headers";
import DccMachineContractExplainer from "@/app/components/dcc/DccMachineContractExplainer";
import LocationFirstHomeFast from "@/app/components/dcc/LocationFirstHomeFast";
import JuneauFlightDeckHostPage from "@/app/juneau-flight-deck/page";
import WisconsinDellsBrandPage from "@/app/wisconsin-dells-brand/page";
import { getOrganizationSchema, getWebsiteSchema } from "@/src/data/site-identity";

export const dynamic = "force-dynamic";

const JFD_HOSTS = new Set(["juneauflightdeck.com", "www.juneauflightdeck.com"]);
const DELLS_HOSTS = new Set(["welcometothedells.com", "www.welcometothedells.com"]);

async function requestHost() {
  const h = await headers();
  return (h.get("x-forwarded-host") || h.get("host") || "").split(":")[0].toLowerCase();
}

export async function generateMetadata(): Promise<Metadata> {
  const host = await requestHost();

  if (JFD_HOSTS.has(host)) {
    return {
      title: "Juneau Flight Deck | Glacier Flights for Cruise Visitors",
      description: "A focused Juneau flightseeing storefront for cruise visitors comparing helicopter glacier flights, landing-style experiences, ship timing, and weather backup planning.",
      alternates: { canonical: "https://juneauflightdeck.com/" },
      openGraph: {
        title: "Juneau Flight Deck",
        description: "Compare Juneau glacier-flight formats after deciding flying is the right use of your port day.",
        url: "https://juneauflightdeck.com/",
        type: "website",
      },
    };
  }

  if (DELLS_HOSTS.has(host)) {
    return {
      title: "Welcome to the Dells | Wisconsin Dells Trip Ideas for Groups",
      description: "A simple Wisconsin Dells starting point for families, adults trips, and groups: choose the shape of the trip first, then open the attraction or operator that fits.",
      alternates: { canonical: "https://welcometothedells.com/" },
      openGraph: {
        title: "Welcome to the Dells",
        description: "Wisconsin Dells trip ideas for families, adults trips, and groups without turning the weekend into a giant checklist.",
        url: "https://welcometothedells.com/",
        type: "website",
      },
    };
  }

  return {
    title: "Destination Command Center | Travel Reference, Trip Preparation & Live Coordinate Intelligence",
    description:
      "Trusted travel reference and decision platform supported by live, source-attributed coordinate intelligence. Explore destination guides for Juneau, Red Rocks, and the Denver–Breckenridge corridor, or query any coordinate via our web view, embeddable venue widget, and JSON API.",
    alternates: { canonical: "/" },
    openGraph: {
      title: "Destination Command Center | Travel Reference & Live Coordinate Intelligence",
      description:
        "Understand destinations, prepare for trips, compare practical transport and excursion options, and inspect live, source-attributed coordinate telemetry.",
      url: "https://destinationcommandcenter.com",
      type: "website",
    },
  };
}

export default async function HomePage() {
  const host = await requestHost();
  if (JFD_HOSTS.has(host)) return <JuneauFlightDeckHostPage />;
  if (DELLS_HOSTS.has(host)) return <WisconsinDellsBrandPage />;

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
