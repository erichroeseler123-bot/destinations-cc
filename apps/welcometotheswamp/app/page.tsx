import type { Metadata } from "next";
import JsonLd from "@/app/components/JsonLd";
import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from "@/lib/jsonld";
import NextBoatFinder from "@/app/components/NextBoatFinder";
import { SwampStorefrontPage } from "./StorefrontHomePage";
import { swampStorefrontConfig } from "./pageConfig";

export const pageIntent = "wts_storefront_home";

export const metadata: Metadata = {
  title: swampStorefrontConfig.metadata.title,
  description: swampStorefrontConfig.metadata.description,
  alternates: { canonical: "https://welcometotheswamp.com/" },
  openGraph: {
    title: swampStorefrontConfig.metadata.title,
    description: swampStorefrontConfig.metadata.description,
    url: "https://welcometotheswamp.com/",
    type: "website",
  },
};

const WNO_BASE = "https://welcometoneworleanstours.com";
const WNO_UTM = "utm_source=welcometotheswamp&utm_medium=referral&utm_campaign=swamp_to_wno";

export default function HomePage() {
  const touristTripJsonLd = {
    "@type": "TouristTrip",
    name: "Next Available Airboat Swamp Tour (New Orleans)",
    description:
      "Real-time dispatch engine monitoring live airboat departures across New Orleans swamp operators with French Quarter hotel pickup.",
    disambiguatingDescription:
      "Real-time airboat scheduling engine monitoring live seat availability across Louisiana bayou operators, distinct from standard slow-moving pontoon boats.",
    touristType: ["Adventure Tourists", "Nature Lovers", "Cruise Visitors"],
    additionalType: [
      "https://en.wikipedia.org/wiki/Airboat",
      "https://en.wikipedia.org/wiki/Swamp_tour",
    ],
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "75.00",
      highPrice: "135.00",
      offerCount: "12",
      availability: "https://schema.org/InStock",
      url: "https://welcometotheswamp.com/",
    },
    itinerary: {
      "@type": "ItemList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "French Quarter / Downtown Hotel Pickup",
          description: "Air-conditioned shuttle transport from downtown New Orleans hotels to Barataria Basin.",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "High-Speed Airboat Bayou & Marsh Run",
          description: "Glide across shallow cypress bayous and marshes at 35+ mph, getting face-to-face with alligators.",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Return Shuttle to New Orleans",
          description: "Direct shuttle return to your downtown hotel or French Quarter destination.",
        },
      ],
    },
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd({
        path: "/",
        name: swampStorefrontConfig.metadata.title,
        description: swampStorefrontConfig.metadata.description,
      }),
      buildBreadcrumbJsonLd([{ name: "Welcome to the Swamp", item: "/" }]),
      touristTripJsonLd,
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <div id="next-boat" className="bg-stone-950 px-4 pt-8 pb-4">
        <NextBoatFinder />
      </div>
      <SwampStorefrontPage page={swampStorefrontConfig} />
      <section className="border-t border-stone-800 bg-stone-950 px-6 py-10 text-stone-100">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Planning the rest of New Orleans?</p>
          <h2 className="mt-3 text-2xl font-black">Put the swamp tour into the rest of your day.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">If your real question is transportation, family fit, how much time you have, or what to do before or after a cruise, continue into the broader New Orleans tour-planning layer.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a className="rounded-xl border border-amber-300/40 px-4 py-3 text-sm font-bold" href={`${WNO_BASE}/guides/best-swamp-tour-with-transportation?${WNO_UTM}`}>Swamp tours with transportation ↗</a>
            <a className="rounded-xl border border-white/15 px-4 py-3 text-sm font-bold" href={`${WNO_BASE}/guides/new-orleans-plantation-and-swamp-tour?${WNO_UTM}`}>Plantation + swamp combinations ↗</a>
            <a className="rounded-xl border border-white/15 px-4 py-3 text-sm font-bold" href={`${WNO_BASE}/guides/plan-new-orleans-tours?${WNO_UTM}`}>Plan the rest of New Orleans ↗</a>
          </div>
        </div>
      </section>
    </>
  );
}
