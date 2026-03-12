import type { Metadata } from "next";
import Link from "next/link";
import AdventureLaneSection from "@/app/components/dcc/AdventureLaneSection";
import CityLiveEventsSection from "@/app/components/dcc/CityLiveEventsSection";
import CityMoneyLaneSection from "@/app/components/dcc/CityMoneyLaneSection";
import NewOrleansFestivalSection from "@/app/components/dcc/NewOrleansFestivalSection";
import { getCityAdventureLane } from "@/src/data/city-adventure-lanes";
import { NEW_ORLEANS_FESTIVALS } from "@/src/data/new-orleans-festivals";
import { getCityMoneyLane } from "@/src/data/city-money-lanes";

const PAGE_URL = "https://destinationcommandcenter.com/new-orleans";

export const metadata: Metadata = {
  title: "New Orleans Travel Guide 2026 | French Quarter, Music, Food, and Logistics",
  description:
    "Plan New Orleans with practical timing, French Quarter logistics, airport transfer flow, neighborhood food routes, and live music planning.",
  keywords: [
    "new orleans travel guide",
    "things to do in new orleans",
    "new orleans itinerary",
    "french quarter guide",
    "new orleans airport to french quarter",
    "new orleans live music",
    "new orleans neighborhood guide",
  ],
  alternates: { canonical: "/new-orleans" },
  openGraph: {
    title: "New Orleans Travel Guide | Music, Food, and Logistics",
    description:
      "Decision-first New Orleans planning: airport transfers, neighborhood routing, live music timing, and food strategy.",
    url: PAGE_URL,
    type: "website",
  },
};

const PILLARS = [
  "French Quarter timing + crowd windows",
  "MSY airport transfer + check-in blocks",
  "Music route planning by neighborhood",
  "Food strategy by daypart",
];

const NEIGHBORHOODS = [
  {
    name: "French Quarter",
    bestFor: "First-time visitors, walkable nightlife, iconic architecture",
    logistics: "Plan early starts, slower midday, and a focused evening block to avoid random zig-zags.",
  },
  {
    name: "Marigny + Frenchmen Street",
    bestFor: "Live music nights and casual bar-to-bar flow",
    logistics: "Use as a dedicated night block instead of trying to pair with distant dinner reservations.",
  },
  {
    name: "Garden District",
    bestFor: "Daytime architecture walks and quieter pacing",
    logistics: "Pair with a lunch stop and return buffer before evening plans.",
  },
  {
    name: "Warehouse District",
    bestFor: "Museums, restaurants, and easier daytime movement",
    logistics: "Works well as a bridge zone between hotel check-in and night music plans.",
  },
];

const FAQ = [
  {
    q: "How many days do you need in New Orleans?",
    a: "A strong first trip is 3 days: one French Quarter day, one music-focused night, and one flexible neighborhood day with buffer time.",
  },
  {
    q: "Is New Orleans walkable for visitors?",
    a: "Core visitor zones are walkable, but your day is smoother if you group activities by neighborhood and avoid crossing the city repeatedly.",
  },
  {
    q: "What is the best area to stay in New Orleans?",
    a: "For first-time visits, many travelers choose near the French Quarter or Warehouse District to reduce transfer friction and keep evenings simple.",
  },
  {
    q: "How do I get from MSY airport to the French Quarter?",
    a: "Plan a dedicated transfer block from Louis Armstrong New Orleans International Airport (MSY) to your hotel, then start your city route after check-in.",
  },
];

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": PAGE_URL,
        url: PAGE_URL,
        name: "New Orleans Travel Guide",
        description:
          "Logistics-first New Orleans travel guide with neighborhood planning, airport transfer flow, music routing, festival pressure windows, and FAQ.",
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
        "@type": "TouristDestination",
        name: "New Orleans",
        url: PAGE_URL,
        touristType: ["Music travelers", "Food travelers", "City-break visitors"],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://destinationcommandcenter.com/" },
          { "@type": "ListItem", position: 2, name: "New Orleans", item: PAGE_URL },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function NewOrleansPage() {
  const moneyLane = getCityMoneyLane("new-orleans");
  const adventureLane = getCityAdventureLane("new-orleans");

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd />
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">DCC Destination Layer</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">New Orleans Travel Guide</h1>
          <p className="max-w-3xl text-zinc-300">
            A practical New Orleans guide for French Quarter planning, airport-to-hotel logistics,
            live music routing, and food blocks that actually fit a real day.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          {PILLARS.map((pillar) => (
            <div key={pillar} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-zinc-200">
              {pillar}
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Neighborhood Planning That Prevents Chaos</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {NEIGHBORHOODS.map((zone) => (
              <article key={zone.name} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-lg font-semibold">{zone.name}</h3>
                <p className="mt-2 text-sm text-zinc-300">
                  <span className="font-medium text-zinc-100">Best for:</span> {zone.bestFor}
                </p>
                <p className="mt-2 text-sm text-zinc-300">
                  <span className="font-medium text-zinc-100">Logistics:</span> {zone.logistics}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Sample 3-Day New Orleans Itinerary Structure</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Day 1</p>
              <p className="mt-2 font-semibold">Arrival + French Quarter</p>
              <p className="mt-2 text-sm text-zinc-300">MSY transfer, check-in, Quarter walk, and one focused dinner block.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Day 2</p>
              <p className="mt-2 font-semibold">Culture + Music Night</p>
              <p className="mt-2 text-sm text-zinc-300">Daytime museum/architecture plan, then dedicated Frenchmen Street live music flow.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Day 3</p>
              <p className="mt-2 font-semibold">Flexible Food Day</p>
              <p className="mt-2 text-sm text-zinc-300">Neighborhood food route with enough buffer to avoid rushed checkout and airport stress.</p>
            </div>
          </div>
        </section>

        {moneyLane ? <CityMoneyLaneSection config={moneyLane} tone="cyan" /> : null}

        {adventureLane ? <AdventureLaneSection config={adventureLane} /> : null}

        <CityLiveEventsSection
          citySlug="new-orleans"
          cityName="New Orleans"
          venues={[
            "Smoothie King Center",
            "Caesars Superdome",
            "Saenger Theatre",
            "Orpheum Theater",
            "House of Blues New Orleans",
            "Frenchmen Street clubs",
          ]}
          ticketQueries={[
            { label: "New Orleans concerts this weekend", query: "new orleans concerts this weekend" },
            { label: "Frenchmen Street live music", query: "frenchmen street live music" },
            { label: "New Orleans casino shows", query: "new orleans casino shows" },
            { label: "Jazz festivals and events", query: "new orleans jazz festival events" },
            { label: "Superdome events schedule", query: "caesars superdome events" },
            { label: "Saenger Theatre shows", query: "saenger theatre new orleans shows" },
          ]}
          festivals={[
            "Mardi Gras season",
            "New Orleans Jazz & Heritage Festival",
            "French Quarter Festival",
            "Essence Festival weekend",
            "Voodoo / Halloween-season event demand",
            "Holiday event calendar",
          ]}
        />

        <NewOrleansFestivalSection festivals={NEW_ORLEANS_FESTIVALS} />

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">New Orleans FAQ</h2>
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
          <h2 className="text-2xl font-bold">Linked Authority Pages</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <HubLink href="/mighty-argo-shuttle" label="Argo Shuttle" />
            <HubLink href="/vegas" label="Vegas" />
            <HubLink href="/alaska" label="Alaska" />
            <HubLink href="/cruises" label="Cruises" />
            <HubLink href="/national-parks" label="National Parks Map" />
          </div>
        </section>
      </div>
    </main>
  );
}

function HubLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-zinc-200 hover:bg-white/10"
    >
      {label} Link
    </Link>
  );
}
