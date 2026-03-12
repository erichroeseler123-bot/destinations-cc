import type { Metadata } from "next";
import Link from "next/link";
import AdventureLaneSection from "@/app/components/dcc/AdventureLaneSection";
import { getCityAdventureLane } from "@/src/data/city-adventure-lanes";

const PAGE_URL = "https://destinationcommandcenter.com/orlando";
const ADVENTURE_LANE = getCityAdventureLane("orlando");

const PILLARS = [
  "Theme-park versus outdoor-day tradeoffs",
  "Airboat and wildlife timing",
  "Premium balloon and skydiving add-ons",
  "Resort and transfer buffers that keep park days intact",
];

const DAY_SHAPES = [
  {
    title: "Park-first trip",
    body: "Keep adventure inventory as one intentional non-park morning or half-day rather than forcing it into every day.",
  },
  {
    title: "Outdoor contrast day",
    body: "Airboats, balloon rides, and lake activity lanes work best when treated as a deliberate reset from rides and queues.",
  },
  {
    title: "Family-plus-thrill split",
    body: "Orlando sells to both family buyers and high-adrenaline buyers, so the activity mix should stay clearly separated.",
  },
];

const FAQ = [
  {
    q: "What outdoor adventure activities fit Orlando best?",
    a: "Hot air balloons, airboat rides, tandem skydiving, lake-based water activities, and short-format rentals are the clearest non-park adventure categories.",
  },
  {
    q: "Should I do Orlando adventure activities on park days?",
    a: "Usually no. Orlando works better when one day is park-first and another day is dedicated to outdoor or premium adventure activity planning.",
  },
  {
    q: "Is Orlando only a theme-park city?",
    a: "No. Theme parks dominate the market, but there is still a strong secondary lane for balloon flights, airboats, skydiving, and water-based activities.",
  },
];

export const metadata: Metadata = {
  title: "Orlando Travel Guide 2026 | Airboats, Balloon Flights, and Adventure Planning",
  description:
    "Plan Orlando beyond the park core with airboats, balloon rides, skydiving, water activities, and cleaner trip-structure decisions.",
  alternates: { canonical: "/orlando" },
  openGraph: {
    title: "Orlando Travel Guide | Airboats, Balloon Flights, and Outdoor Activities",
    description:
      "A route-first Orlando page for outdoor contrast days, balloon rides, airboat decisions, and bookable adventure lanes beyond the parks.",
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
        name: "Orlando Travel Guide",
        description:
          "Orlando planning guide for airboats, balloon rides, skydiving, water activities, and better park-versus-outdoor day structure.",
      },
      {
        "@type": "TouristDestination",
        name: "Orlando",
        url: PAGE_URL,
        touristType: ["Family travelers", "Theme-park visitors", "Adventure travelers"],
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
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function OrlandoPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd />
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Orlando Layer</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Orlando Travel Guide</h1>
          <p className="max-w-3xl text-zinc-300">
            Orlando is more than park tickets. This page covers the secondary activity lane that still converts well:
            airboats, balloon flights, skydiving, lake activities, and outdoor resets that fit around the park core.
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
          <h2 className="text-2xl font-bold">Structure Orlando by day type</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {DAY_SHAPES.map((shape) => (
              <article key={shape.title} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="font-semibold">{shape.title}</h3>
                <p className="mt-2 text-sm text-zinc-300">{shape.body}</p>
              </article>
            ))}
          </div>
        </section>

        {ADVENTURE_LANE ? <AdventureLaneSection config={ADVENTURE_LANE} /> : null}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Keep Orlando lanes distinct</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link href="/orlando/tours" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <h3 className="font-semibold">Tours</h3>
              <p className="mt-2 text-sm text-zinc-300">Broader Orlando excursion planning beyond the park and rental layer.</p>
            </Link>
            <Link href="/orlando/attractions" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <h3 className="font-semibold">Attractions</h3>
              <p className="mt-2 text-sm text-zinc-300">Park-adjacent attractions and fixed-visit discovery, separate from adventure activity inventory.</p>
            </Link>
            <Link href="/orlando/shows" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <h3 className="font-semibold">Shows</h3>
              <p className="mt-2 text-sm text-zinc-300">Live entertainment and ticketed event intent, kept separate from outdoor adventure planning.</p>
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Orlando FAQ</h2>
          <div className="mt-4 space-y-3">
            {FAQ.map((item) => (
              <article key={item.q} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm text-zinc-300">{item.a}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
