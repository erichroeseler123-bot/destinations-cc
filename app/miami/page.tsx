import type { Metadata } from "next";
import Link from "next/link";
import AdventureLaneSection from "@/app/components/dcc/AdventureLaneSection";
import CitySportsSection from "@/app/components/dcc/CitySportsSection";
import { getCityAdventureLane } from "@/src/data/city-adventure-lanes";
import { getTeamsByCity } from "@/src/data/sports-teams-config";

const PAGE_URL = "https://destinationcommandcenter.com/miami";
const ADVENTURE_LANE = getCityAdventureLane("miami");
const LAST_UPDATED = "2026-03-11";

const PILLARS = [
  "Biscayne and beach-day activity timing",
  "Everglades and boat-tour decision blocks",
  "Cruise and airport transfer buffers",
  "Nightlife plans that do not break the next day",
];

const ZONES = [
  {
    title: "South Beach and the beach strip",
    body: "Best for short-format water rentals, parasailing, scooter movement, and buyers who want a compact beach-first day.",
  },
  {
    title: "Downtown and Biscayne Bay",
    body: "Best for boat tours, skyline-facing activity plans, and bridge routing into premium helicopter or harbor products.",
  },
  {
    title: "Everglades and outer-day trip lane",
    body: "Best for one committed excursion block instead of trying to split the day between beaches and wetlands.",
  },
];

const FAQ = [
  {
    q: "What are the best adventure activities in Miami?",
    a: "Jet skis, parasailing, boat-led water activities, Biscayne paddling, and helicopter sightseeing are some of the clearest high-intent bookable categories.",
  },
  {
    q: "Should I book Miami water activities ahead of time?",
    a: "Yes. Miami weather and weekend demand can change availability quickly, so it is usually better to lock one key activity early and keep the rest of the day flexible.",
  },
  {
    q: "How should I split a first Miami trip?",
    a: "A strong first trip usually splits into one beach-and-water day, one excursion or boat day, and one nightlife or food-focused evening block.",
  },
];

export const metadata: Metadata = {
  title: "Miami Travel Guide 2026 | Water Activities, Everglades, and Adventure Planning",
  description:
    "Plan Miami around water sports, Biscayne activities, Everglades timing, nightlife pacing, and high-intent adventure booking lanes.",
  alternates: { canonical: "/miami" },
  openGraph: {
    title: "Miami Travel Guide | Water Activities and Adventure Planning",
    description:
      "A route-first Miami page for jet skis, parasailing, Biscayne water activity planning, and clean day-structure decisions.",
    url: PAGE_URL,
    type: "website",
  },
};

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": PAGE_URL,
        url: PAGE_URL,
        name: "Miami Travel Guide",
        description:
          "Miami planning guide for water activities, Biscayne adventure lanes, Everglades timing, and practical trip structure.",
        dateModified: LAST_UPDATED,
      },
      {
        "@type": "TouristDestination",
        name: "Miami",
        url: PAGE_URL,
        touristType: ["Beach travelers", "Adventure travelers", "Nightlife travelers"],
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Cities", item: "https://destinationcommandcenter.com/cities" },
          { "@type": "ListItem", position: 2, name: "Miami", item: PAGE_URL },
        ],
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function MiamiPage() {
  const sportsTeams = getTeamsByCity("miami");
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd />
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Miami Layer</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Miami Travel Guide</h1>
          <p className="max-w-3xl text-zinc-300">
            Miami works best when you separate beach time, water activities, and nightlife instead of treating them as one interchangeable day.
            This page focuses on the adventure categories that convert cleanly: jet skis, parasailing, paddling, helicopter views, and short-format rentals.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          {PILLARS.map((pillar) => (
            <div key={pillar} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-zinc-200">
              {pillar}
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Use Miami in clean activity zones</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {ZONES.map((zone) => (
              <article key={zone.title} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="font-semibold">{zone.title}</h3>
                <p className="mt-2 text-sm text-zinc-300">{zone.body}</p>
              </article>
            ))}
          </div>
        </section>

        {ADVENTURE_LANE ? <AdventureLaneSection config={ADVENTURE_LANE} /> : null}

        <CitySportsSection cityName="Miami" citySlug="miami" teams={sportsTeams} />

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Keep the lane split clean</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link href="/miami/tours" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <h3 className="font-semibold">Tours</h3>
              <p className="mt-2 text-sm text-zinc-300">Everglades, boat tours, and broader excursion planning.</p>
            </Link>
            <Link href="/miami/attractions" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <h3 className="font-semibold">Attractions</h3>
              <p className="mt-2 text-sm text-zinc-300">Landmarks, museums, beaches, and fixed-visit discovery.</p>
            </Link>
            <Link href="/miami/shows" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <h3 className="font-semibold">Shows</h3>
              <p className="mt-2 text-sm text-zinc-300">Live events and ticketed entertainment, separate from adventure inventory.</p>
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Beach-led discovery</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href="/miami/beaches" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <h3 className="font-semibold">Miami beaches</h3>
              <p className="mt-2 text-sm text-zinc-300">A real beach authority layer for South Beach, quieter family stretches, and beach-day planning.</p>
            </Link>
            <Link href="/miami/tours" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <h3 className="font-semibold">Miami tours</h3>
              <p className="mt-2 text-sm text-zinc-300">Use the broader tours lane when the beach plan becomes Everglades, boats, or excursion routing.</p>
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Miami FAQ</h2>
          <div className="mt-4 space-y-3">
            {FAQ.map((item) => (
              <article key={item.q} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm text-zinc-300">{item.a}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Other popular city nodes</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/orlando" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">Orlando</Link>
            <Link href="/new-orleans" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">New Orleans</Link>
            <Link href="/vegas" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">Las Vegas</Link>
            <Link href="/cruises" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">Cruises</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
