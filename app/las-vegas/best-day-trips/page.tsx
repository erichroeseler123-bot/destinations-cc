import type { Metadata } from "next";
import Link from "next/link";
import ViatorTourGrid from "@/app/components/dcc/ViatorTourGrid";

const PAGE_URL = "https://destinationcommandcenter.com/las-vegas/best-day-trips";

const FALLBACKS = [
  { label: "Best Grand Canyon tours from Las Vegas", query: "best grand canyon tour from las vegas" },
  { label: "Best Hoover Dam day trips", query: "best hoover dam tour from las vegas" },
  { label: "Best Antelope Canyon day trips", query: "best antelope canyon tour from las vegas" },
  { label: "Best Red Rock Canyon day trips", query: "best red rock canyon tour from las vegas" },
  { label: "Best Valley of Fire tours", query: "best valley of fire tour from las vegas" },
  { label: "Best Las Vegas desert combo tours", query: "best desert day trip from las vegas" },
];

const FAQ = [
  {
    q: "What are the best day trips from Las Vegas?",
    a: "The strongest day-trip lanes are usually Grand Canyon, Hoover Dam, Antelope Canyon, Red Rock Canyon, and Valley of Fire, depending on how much transit time you can tolerate.",
  },
  {
    q: "Which Las Vegas day trip is easiest?",
    a: "Hoover Dam is usually the easiest first day trip because it is closer to the city and easier to fit around an evening show or dinner plan.",
  },
  {
    q: "Should I do a helicopter or bus day trip from Las Vegas?",
    a: "Helicopter products usually work best for shorter stays and higher budgets, while bus and coach trips fit travelers who want to maximize value and cover more ground in one day.",
  },
];

export const metadata: Metadata = {
  title: "Best Day Trips from Las Vegas | Grand Canyon, Hoover Dam, and Desert Tours",
  description:
    "Compare the best day trips from Las Vegas, including Grand Canyon, Hoover Dam, Antelope Canyon, and desert routes that fit real Vegas schedules.",
  alternates: { canonical: "/las-vegas/best-day-trips" },
  openGraph: {
    title: "Best Day Trips from Las Vegas",
    description:
      "A conversion-first guide to Las Vegas day trips: Grand Canyon, Hoover Dam, Antelope Canyon, and desert routes.",
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
        name: "Best Day Trips from Las Vegas",
        description:
          "Guide to the best Las Vegas day trips, with practical fit guidance for canyon, dam, and desert products.",
        dateModified: "2026-03-11",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Cities", item: "https://destinationcommandcenter.com/cities" },
          { "@type": "ListItem", position: 2, name: "Las Vegas", item: "https://destinationcommandcenter.com/vegas" },
          { "@type": "ListItem", position: 3, name: "Best Day Trips", item: PAGE_URL },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function LasVegasBestDayTripsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Vegas Spoke</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Best day trips from Las Vegas</h1>
          <p className="max-w-3xl text-zinc-300">
            This page is for the highest-intent Las Vegas question after shows: which day trip is actually worth giving a full Vegas day to.
            Use it to compare the cleanest desert and canyon routes without mixing them into nightlife or resort planning.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Best for first-timers</h2>
            <p className="mt-2 text-sm text-zinc-300">Hoover Dam and Grand Canyon remain the simplest first decision because buyers already understand the value proposition.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Best for premium spend</h2>
            <p className="mt-2 text-sm text-zinc-300">Helicopter and premium combo routes win when time matters more than maximizing hours on the road.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Best for one-day efficiency</h2>
            <p className="mt-2 text-sm text-zinc-300">The strongest Vegas day trips are the ones that protect your evening instead of exhausting the whole itinerary.</p>
          </article>
        </section>

        <ViatorTourGrid
          placeName="Las Vegas"
          title="Bookable Las Vegas day-trip lanes"
          description="These links are optimized for the highest-intent Las Vegas day-trip categories: canyon routes, dam routes, and desert blocks that tourists actually book."
          products={[]}
          fallbacks={FALLBACKS}
          ctaLabel="Browse with DCC via Viator"
        />

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Keep this spoke tied to the city hub</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link href="/vegas" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <h3 className="font-semibold">Back to Vegas hub</h3>
              <p className="mt-2 text-sm text-zinc-300">Return to the main city authority page for shows, nightlife, and broader route planning.</p>
            </Link>
            <Link href="/las-vegas/helicopter-tours" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <h3 className="font-semibold">Helicopter spoke</h3>
              <p className="mt-2 text-sm text-zinc-300">Use the dedicated helicopter page when the buyer already knows they want aerial inventory.</p>
            </Link>
            <Link href="/las-vegas/day-trips" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <h3 className="font-semibold">Day-trips lane</h3>
              <p className="mt-2 text-sm text-zinc-300">Use the broader lane page for more exploratory intent and less commercial filtering.</p>
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Day-trip pillar routes</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/grand-canyon" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <h3 className="font-semibold">Grand Canyon</h3>
              <p className="mt-2 text-sm text-zinc-300">Use the standalone canyon pillar for rim choice, Skywalk, and helicopter route decisions.</p>
            </Link>
            <Link href="/hoover-dam" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <h3 className="font-semibold">Hoover Dam</h3>
              <p className="mt-2 text-sm text-zinc-300">Use the dam pillar for express tours, engineering context, and Lake Mead combos.</p>
            </Link>
            <Link href="/red-rock-canyon" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <h3 className="font-semibold">Red Rock Canyon</h3>
              <p className="mt-2 text-sm text-zinc-300">Use the close-in outdoor pillar for half-day scenic loops, hikes, and easier desert routing.</p>
            </Link>
            <Link href="/valley-of-fire" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <h3 className="font-semibold">Valley of Fire</h3>
              <p className="mt-2 text-sm text-zinc-300">Use the stronger desert-landscape pillar for scenic routes, hiking, and full daytime blocks.</p>
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">FAQ</h2>
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
