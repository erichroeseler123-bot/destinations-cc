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
    name: "New Orleans Swamp & Airboat Tours",
    description:
      "Find the next scheduled airboat departure matching your date, group, transportation, and booking cutoffs. Confirm open seats at checkout. Requests can be saved; automated seat-opening alerts are currently inactive.",
    disambiguatingDescription:
      "Service comparing scheduled airboat and covered swamp tour departures across Louisiana bayou operators.",
    touristType: ["Adventure Tourists", "Nature Lovers", "Cruise Visitors"],
    additionalType: [
      "https://en.wikipedia.org/wiki/Airboat",
      "https://en.wikipedia.org/wiki/Swamp_tour",
    ],
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "65.00",
      highPrice: "135.00",
      description:
        "Prices vary by operator, boat type, and transportation option. Availability and open seats are confirmed directly at checkout for your specific travel date and party size.",
      url: "https://welcometotheswamp.com/",
    },
    itinerary: {
      "@type": "ItemList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "French Quarter / Downtown Hotel Pickup or Self-Drive Dock Check-in",
          description: "Shuttle pickup from downtown New Orleans hotels or self-drive to Barataria Basin docks.",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Airboat or Covered Boat Swamp Tour",
          description: "Guided tour through Louisiana cypress bayous and marshes viewing wild alligators.",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Return Transport / Dock Departure",
          description: "Return shuttle to New Orleans or continuation of your day trip.",
        },
      ],
    },
  };

  const faqJsonLd = {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I find the next airboat departure in New Orleans?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "To find the next airboat departure, choose your travel date (today, tomorrow, or a chosen date), enter your party size and children's ages, and select whether you need French Quarter hotel pickup or plan to drive to the dock. The departure finder compares scheduled departures across local airboat operators, accounts for New Orleans time and booking cutoffs, and presents the earliest option that matches your party so you can choose your tour here and complete your reservation through the checkout shown.",
        },
      },
      {
        "@type": "Question",
        name: "Can I book a New Orleans airboat tour for today or tomorrow?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Operators in the Barataria Basin run multiple daily departures. When booking for today, you must account for booking cutoffs and shuttle transfer times. The departure finder checks whether current local time allows for pickup or dock arrival before displaying available options.",
        },
      },
      {
        "@type": "Question",
        name: "How do I know if a departure has confirmed seats?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Each result on Welcome to the Swamp displays scheduled departure timetables and booking cutoff logic. Confirm open seats directly at checkout for your chosen date and party size. Travel requests can also be saved, though automated seat-opening alerts are currently inactive.",
        },
      },
      {
        "@type": "Question",
        name: "Can I save a request if no matching airboat departures are open?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. You can save your tour request with your travel date, party size, and timing preferences. Requests are recorded for planning, but automated seat-opening alerts are currently inactive.",
        },
      },
    ],
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
      faqJsonLd,
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <div id="next-boat" className="bg-stone-950 px-4 pt-8 pb-4">
        <NextBoatFinder />
      </div>

      {/* DISCOVERY / HOW TO FIND NEXT DEPARTURE ANSWER SECTION */}
      <section className="border-t border-stone-800 bg-stone-900 px-6 py-12 text-stone-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Planning & Logistics</p>
          <h2 className="mt-2 text-2xl font-black md:text-3xl text-white">How do I find the next airboat departure?</h2>
          <p className="mt-3 text-sm leading-6 text-stone-300">
            Finding a boat that actually fits your schedule comes down to three practical questions: when you can go, who is in your group, and whether you have your own transportation.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-stone-700 bg-stone-950 p-5">
              <span className="inline-block rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-bold text-amber-300">Step 1</span>
              <h3 className="mt-3 text-base font-bold text-white">Select Date & Time</h3>
              <p className="mt-2 text-xs leading-5 text-stone-400">
                Choose today, tomorrow, or a future date. Cutoffs are evaluated in real time (America/Chicago) so you never see departures you can no longer reach.
              </p>
            </div>
            <div className="rounded-xl border border-stone-700 bg-stone-950 p-5">
              <span className="inline-block rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-bold text-amber-300">Step 2</span>
              <h3 className="mt-3 text-base font-bold text-white">Group & Children's Ages</h3>
              <p className="mt-2 text-xs leading-5 text-stone-400">
                Small airboats require children to be at least 5 years old. Specifying ages ensures you only see vessels your entire party can board.
              </p>
            </div>
            <div className="rounded-xl border border-stone-700 bg-stone-950 p-5">
              <span className="inline-block rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-bold text-amber-300">Step 3</span>
              <h3 className="mt-3 text-base font-bold text-white">Pickup vs. Self-Drive</h3>
              <p className="mt-2 text-xs leading-5 text-stone-400">
                Docks are 35–45 minutes from New Orleans. Choose hotel pickup if you don't have a car, or self-drive if you're already on the road.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-amber-400/30 bg-amber-950/20 p-5">
            <h4 className="text-sm font-bold text-amber-300">Choose your tour here and complete your reservation through the checkout shown.</h4>
            <p className="mt-1 text-xs leading-5 text-stone-300">
              Each option displays scheduled operator timetables and cutoff requirements. Confirm open seats at checkout. Requests can be saved for your party; automated seat-opening alerts are currently inactive.
            </p>
          </div>
        </div>
      </section>

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
