import type { Metadata } from "next";
import Link from "next/link";
import ViatorTourGrid from "@/app/components/dcc/ViatorTourGrid";

const PAGE_URL = "https://destinationcommandcenter.com/las-vegas/helicopter-tours";

const FALLBACKS = [
  { label: "Best Las Vegas helicopter night flights", query: "best las vegas helicopter night tour" },
  { label: "Best Grand Canyon helicopter tours", query: "best grand canyon helicopter tour from las vegas" },
  { label: "Best Hoover Dam helicopter tours", query: "best hoover dam helicopter tour from las vegas" },
  { label: "Best Vegas Strip helicopter rides", query: "best vegas strip helicopter ride" },
  { label: "Best luxury aerial tours from Las Vegas", query: "best luxury helicopter tour las vegas" },
  { label: "Best celebration helicopter flights in Las Vegas", query: "best helicopter flight las vegas couples" },
];

const FAQ = [
  {
    q: "Are helicopter tours in Las Vegas worth it?",
    a: "They are usually worth it for shorter stays, premium-budget travelers, and anyone trying to fit a major scenic experience into a tight schedule without losing the full day.",
  },
  {
    q: "What is the best helicopter tour from Las Vegas?",
    a: "The strongest categories are usually Strip night flights for short-form city spectacle and Grand Canyon helicopter products for higher-ticket scenic value.",
  },
  {
    q: "Should I book helicopter tours before arriving in Las Vegas?",
    a: "Yes. Helicopter products are one of the cleaner premium upsells in Vegas, and the best departure windows can tighten faster than general bus-tour inventory.",
  },
];

export const metadata: Metadata = {
  title: "Las Vegas Helicopter Tours | Best Strip Flights and Canyon Helicopter Rides",
  description:
    "Compare Las Vegas helicopter tours, from Strip night flights to Grand Canyon scenic rides, with a cleaner commercial route than the generic city page.",
  alternates: { canonical: "/las-vegas/helicopter-tours" },
  openGraph: {
    title: "Las Vegas Helicopter Tours",
    description:
      "A commercial spoke for Las Vegas helicopter flights, scenic canyon products, and premium aerial upgrades.",
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
        name: "Las Vegas Helicopter Tours",
        description:
          "Guide to Las Vegas helicopter tours, including Strip flights and premium canyon helicopter products.",
        dateModified: "2026-03-11",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Cities", item: "https://destinationcommandcenter.com/cities" },
          { "@type": "ListItem", position: 2, name: "Las Vegas", item: "https://destinationcommandcenter.com/vegas" },
          { "@type": "ListItem", position: 3, name: "Helicopter Tours", item: PAGE_URL },
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

export default function LasVegasHelicopterToursPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Vegas Activity Hub</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Las Vegas helicopter tours</h1>
          <p className="max-w-3xl text-zinc-300">
            This page isolates one of Vegas&apos; highest-converting premium categories: helicopter inventory.
            Use it when the buyer is already in the aerial mindset and needs the cleanest route into Strip flights, canyon flights, or premium scenic upgrades.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Best for short stays</h2>
            <p className="mt-2 text-sm text-zinc-300">Helicopter products condense a lot of scenic value into a shorter time block than most full desert day trips.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Best for premium spend</h2>
            <p className="mt-2 text-sm text-zinc-300">Vegas helicopter buyers are usually trading higher price for cleaner logistics, stronger spectacle, and less road time.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Best for evening pairing</h2>
            <p className="mt-2 text-sm text-zinc-300">Strip-night helicopter products work well when the rest of the day still needs to preserve dinner or show timing.</p>
          </article>
        </section>

        <ViatorTourGrid
          placeName="Las Vegas"
          title="Bookable Las Vegas helicopter lanes"
          description="These helicopter search lanes are tuned for premium city spectacle, canyon upgrades, and aerial products that convert better on a dedicated page than on a generic city hub."
          products={[]}
          fallbacks={FALLBACKS}
          ctaLabel="Browse helicopter options"
        />

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Connect this hub back to the city graph</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link href="/vegas" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <h3 className="font-semibold">Back to Vegas hub</h3>
              <p className="mt-2 text-sm text-zinc-300">Return to the main authority page for shows, tours, nightlife, and the broader route plan.</p>
            </Link>
            <Link href="/las-vegas/best-day-trips" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <h3 className="font-semibold">Best day trips</h3>
              <p className="mt-2 text-sm text-zinc-300">Use the best-of spoke when the buyer is still deciding between helicopter and overland day-trip categories.</p>
            </Link>
            <Link href="/las-vegas/helicopter" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <h3 className="font-semibold">Broader helicopter lane</h3>
              <p className="mt-2 text-sm text-zinc-300">The generic lane still works for wider aerial intent and exploratory browsing.</p>
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
