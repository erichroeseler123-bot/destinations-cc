import React, { Suspense } from "react";
import type { Metadata } from "next";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";
import { RedRocksConcertRidePlanner } from "@/app/components/dcc/RedRocksConcertRidePlanner";
import ContextualSpecialistReturnBanner from "@/app/components/dcc/ContextualSpecialistReturnBanner";
import TravelReferenceExperience from "@/app/components/dcc/TravelReferenceExperience";
import JsonLd from "@/app/components/dcc/JsonLd";
import { buildBreadcrumbJsonLd, buildEventVenueJsonLd } from "@/lib/dcc/jsonld";
import { getPublishedTravelReferenceNodeById } from "@/lib/dcc/travelReference";
import { PARR_OPERATOR } from "@/lib/parrOperator";
import { getLocalFallbackImageSetForEntity } from "@/src/lib/media/source-local";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Red Rocks Amphitheatre & Park Travel Reference, Access & Concert Logistics | Destination Command Center",
  description:
    "Comprehensive Red Rocks Park & Amphitheatre travel reference: geology, altitude prep, parking & private ride comparison, operational lightning-hold boundaries, live NWS/Open-Meteo telemetry, and context-preserving ride handoffs.",
  alternates: { canonical: "https://destinationcommandcenter.com/red-rocks" },
  robots: { index: true, follow: true },

  keywords: [
    "red rocks guide",
    "red rocks concerts",
    "red rocks transportation",
    "red rocks parking",
    "how to plan a red rocks concert night",
  ],
  openGraph: {
    title: "Red Rocks Amphitheatre Travel Reference & Concert Logistics | Destination Command Center",
    description:
      "Source-attributed Red Rocks guide combining park rules, ingress/egress strategy, live Morrison coordinate weather, and verified ride handoffs.",
    url: "/red-rocks",
    type: "article",
  },
};

export default async function RedRocksPage() {
  const imageSet = getLocalFallbackImageSetForEntity("venue", "red-rocks-amphitheatre");
  const redRocksReference = await getPublishedTravelReferenceNodeById("red-rocks");
  return (
    <div className="bg-[#060b12] text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildEventVenueJsonLd({
              path: "/red-rocks",
              name: "Red Rocks Park & Amphitheatre",
              description:
                redRocksReference?.heroSummary ||
                "Open-air amphitheatre at 6,450 ft in Morrison, Colorado, operated by Denver Arts & Venues with concert parking and private ride logistics.",
              address: {
                streetAddress: "18300 W Alameda Pkwy",
                locality: "Morrison",
                region: "CO",
                postalCode: "80465",
                country: "US",
              },
              geo: {
                lat: redRocksReference?.primaryCoordinate.lat ?? 39.6654,
                lng: redRocksReference?.primaryCoordinate.lng ?? -105.2057,
              },
              maximumAttendeeCapacity: 9525,
              containedInName: "Colorado",
              containedInPath: "/destinations/colorado",
              sameAs: ["https://www.redrocksonline.com/"],
              touristTypes: ["Concert travelers", "Outdoor enthusiasts", "Red Rocks concert groups"],
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "Colorado", item: "/destinations/colorado" },
              { name: "Red Rocks Park & Amphitheatre", item: "/red-rocks" },
            ]),
          ],
        }}
      />
      <React.Suspense fallback={null}>
        <RedRocksConcertRidePlanner />
      </React.Suspense>
      <Suspense fallback={null}>
        <ContextualSpecialistReturnBanner specialist="parr" />
      </Suspense>
      {redRocksReference ? <TravelReferenceExperience node={redRocksReference} embedded /> : null}
      <RedRocksAuthorityPage
        eyebrow="DCC Red Rocks Hub"
        title="Red Rocks is one of the best venues in the world. Getting home is usually the part people underestimate."
        intro="Most people plan the tickets, the show, and maybe dinner. Then they discover the hardest part of the night is parking, pickup, uphill walking, and leaving with thousands of other people at once. DCC exists to solve that part before it ruins the night."
        sourcePath="/red-rocks"
        heroImageSrc={imageSet?.hero?.src || "https://www.partyatredrocks.com/hero/hero-home.jpg"}
        heroImageAlt={imageSet?.hero?.alt || "Red Rocks Amphitheatre at sunset with the venue bowl visible"}
        operatorAttribution={PARR_OPERATOR}
        sections={[
          {
            title: "The hidden Red Rocks problem",
            body: "Red Rocks does not usually fail on the concert. It fails on the last mile. Parking gets crowded, arrival timing matters more than people expect, and the ride home becomes chaotic if it was never actually planned. That is why transportation is not a side detail here. It is the part that determines whether the night feels clean or stressful.",
          },
          {
            title: "What a good Red Rocks plan actually solves",
            body: "A strong Red Rocks plan solves ingress and egress before anything else. Once the route in and the ride home are handled, dinner, tailgating, and after-show plans get much easier. Compare your three options using verified venue and operator rules:",
            bullets: [
              "Parking is $0 in official venue lots (opening 2 hours before doors), requires a sober driver, and overnight vehicles should be moved before 10:00 a.m. the next day.",
              "Rideshare is easier on the way in than the way out: the venue puts general post-show pickup at Jurassic Lot by Entrance 2, with a downhill walk and 60–90+ minute post-encore waits.",
              "Party at Red Rocks offers standalone private rides (no ticket bundle required) at $499 flat round-trip for a Private Suburban up to 6 and $699 flat round-trip for a Private Van up to 10 (includes Denver pickup, Upper North Lot tailgating setup, and on-site driver wait; excludes concert admission and gratuity), subject to availability.",
              "Keep show time and pickup time separate: use the venue's official doors and showtime, and get any pickup deadline from the operator.",
            ],
          },
          {
            title: "Where the plan goes next",
            body: "Use DCC to compare parking, rideshare, and private tailgate and ride options for your show, staying location, and group size, then continue to Party at Red Rocks with your selected show and date carried into checkout.",
          },
        ]}
      />
    </div>
  );
}
