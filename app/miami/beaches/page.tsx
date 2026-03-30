import type { Metadata } from "next";
import Link from "next/link";
import AuthorityMediaStrip from "@/app/components/dcc/AuthorityMediaStrip";
import ViatorTourGrid from "@/app/components/dcc/ViatorTourGrid";
import { getCityBeachesConfig } from "@/src/data/city-beaches-config";
import { getFeaturedTourProducts } from "@/src/data/featured-tour-products";

const PAGE_URL = "https://destinationcommandcenter.com/miami/beaches";
const CONFIG = getCityBeachesConfig("miami");

export const metadata: Metadata = {
  title: "Miami Beaches | South Beach, Family Beaches, and Beach-Day Planning",
  description:
    "Use DCC to plan Miami beaches across South Beach, calmer family stretches, scenic sands, and beach-adjacent water activity routing.",
  keywords: [
    "miami beaches",
    "best beaches in miami",
    "south beach miami",
    "family beaches in miami",
    "things to do near miami beaches",
  ],
  alternates: { canonical: "/miami/beaches" },
  openGraph: {
    title: "Miami Beaches",
    description:
      "A DCC Miami category hub for South Beach, quieter family beaches, scenic shoreline planning, and beach-adjacent activity routing.",
    url: PAGE_URL,
    type: "website",
  },
};

function JsonLd() {
  if (!CONFIG) return null;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebPage", "CollectionPage"],
        "@id": PAGE_URL,
        url: PAGE_URL,
        name: "Miami beaches",
        description: CONFIG.heroSummary,
        dateModified: "2026-03-12",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Cities", item: "https://destinationcommandcenter.com/cities" },
          { "@type": "ListItem", position: 2, name: "Miami", item: "https://destinationcommandcenter.com/miami" },
          { "@type": "ListItem", position: 3, name: "Beaches", item: PAGE_URL },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: CONFIG.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function MiamiBeachesPage() {
  if (!CONFIG) return null;
  const featuredProducts = getFeaturedTourProducts("miami", "beaches");

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Miami Category Hub</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Miami beaches</h1>
          <p className="max-w-3xl text-zinc-300">{CONFIG.heroSummary}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <AuthorityMediaStrip hero={CONFIG.heroImage} gallery={CONFIG.gallery} />

        <section className="grid gap-3 md:grid-cols-3">
          {CONFIG.highlights.map((item) => (
            <article key={item} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
              {item}
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">How to use this Miami beach guide</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4 text-sm leading-7 text-zinc-300">
              <p>
                Miami beach searches are usually hiding a second question: do you want iconic South Beach energy, a calmer family-friendly stretch, easier water access, or a shoreline that pairs better with the rest of the day? That is why this page works better as a comparison page than a simple list of beaches.
              </p>
              <p>
                The strongest organic path from here is into one named beach, one water-activity lane, or the broader Miami tours page if the beach day is turning into a boat or Everglades plan.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Best next clicks</div>
              <div className="mt-4 grid gap-3">
                <Link href="/miami" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Miami city guide</Link>
                <Link href="/miami/tours" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Miami tours</Link>
                <Link href="/kid-friendly/miami" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Kid-friendly Miami</Link>
                <Link href="/pet-friendly/miami" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Pet-friendly Miami</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-3xl font-black tracking-tight">Core beach nodes</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {CONFIG.beaches.map((beach) => (
              <article key={beach.slug} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-zinc-400">
                  {beach.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 px-2 py-1">
                      {tag.replace("-", " ")}
                    </span>
                  ))}
                </div>
                <h3 className="mt-3 text-xl font-bold">{beach.title}</h3>
                <p className="mt-3 text-sm text-zinc-300">{beach.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <ViatorTourGrid
          placeName="Miami"
          title="Featured beach-adjacent tours and water activities"
          description="This is the first curated beach-activity layer. Use specific product links later; use these themed fallback cards now so the page supports real bookable intent without pretending unverified product IDs are curated."
          products={[]}
          fallbacks={featuredProducts.map((product) => ({
            label: product.title,
            query: product.query,
          }))}
          ctaLabel="Browse with DCC via Viator"
        />

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Related Miami routing</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CONFIG.relatedLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Best-fit beach plans</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">First Miami trip</h3>
              <p className="mt-2 text-sm text-zinc-300">Use one iconic South Beach block, then balance it with a calmer or more scenic shoreline if you have more time.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Family beach day</h3>
              <p className="mt-2 text-sm text-zinc-300">Bias toward easier parking, lower chaos, and beaches that work with shorter attention spans and mixed-age groups.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Activity-first</h3>
              <p className="mt-2 text-sm text-zinc-300">Choose beaches that pair cleanly with rentals, parasailing, or boat departures instead of treating every shoreline as interchangeable.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Short stay</h3>
              <p className="mt-2 text-sm text-zinc-300">Keep it simple: one main beach block and one non-beach lane, rather than trying to bounce across too many shoreline zones.</p>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">FAQ</h2>
          <div className="mt-4 space-y-3">
            {CONFIG.faq.map((item) => (
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
