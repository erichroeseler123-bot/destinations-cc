import type { Metadata } from "next";
import Link from "next/link";
import { PRE_SITE_GUIDES_JUNEAU } from "@/src/data/pre-site-guides-juneau";

const ORIGIN = "https://www.destinationcommandcenter.com";

export const metadata: Metadata = {
  title: "Juneau Flightseeing Decision Center | Destination Command Center",
  description:
    "Research Juneau helicopter and glacier-flight decisions before opening the specialist booking layer: value, timing, landing vs scenic flight, weather, backups, and two-activity port days.",
  alternates: { canonical: `${ORIGIN}/juneau-flightseeing` },
};

export default function JuneauFlightseeingDecisionCenter() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${ORIGIN}/juneau-flightseeing#collection`,
        name: "Juneau Flightseeing Decision Center",
        description: "Decision-first research for cruise visitors considering Juneau helicopter and glacier-flight experiences.",
        url: `${ORIGIN}/juneau-flightseeing`,
        isPartOf: { "@id": `${ORIGIN}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Destination Command Center", item: `${ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: "Alaska", item: `${ORIGIN}/guides/category/alaska` },
          { "@type": "ListItem", position: 3, name: "Juneau Flightseeing", item: `${ORIGIN}/juneau-flightseeing` },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#090d13] text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <nav className="text-sm text-slate-400" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white">DCC</Link><span className="mx-2">/</span>
          <Link href="/guides/category/alaska" className="hover:text-white">Alaska</Link><span className="mx-2">/</span>
          <span className="text-slate-300">Juneau Flightseeing</span>
        </nav>

        <header className="mt-10 max-w-5xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Juneau · before the booking layer</p>
          <h1 className="mt-4 text-5xl font-black tracking-[-0.045em] sm:text-6xl">Should you fly? What kind? What can go wrong?</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            This is the research layer in front of Juneau Flight Deck. Resolve the expensive questions here—ship timing, weather exposure, landing versus scenic flight, group fit, and backup strategy—then move to the specialist site only when the decision points toward flying.
          </p>
        </header>

        <section className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PRE_SITE_GUIDES_JUNEAU.map((guide) => (
            <Link key={guide.slug} href={`/guides/${guide.slug}`} className="rounded-3xl border border-slate-800 bg-[#0d131d] p-6 transition hover:-translate-y-1 hover:border-cyan-700">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">{guide.eyebrow}</p>
              <h2 className="mt-3 text-xl font-black leading-7 text-white">{guide.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{guide.description}</p>
              <span className="mt-5 inline-block text-sm font-bold text-cyan-200">Work through this decision →</span>
            </Link>
          ))}
        </section>

        <section className="mt-14 grid gap-5 md:grid-cols-2">
          <Link href="/guides/juneau-helicopter-tour-weather-backup-plan" className="rounded-3xl border border-amber-900/60 bg-amber-950/10 p-6 hover:border-amber-600">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">Existing DCC node</p>
            <h2 className="mt-3 text-2xl font-black">What is the backup if flight weather cancels?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">Build the Plan B before the ship arrives rather than trying to salvage the day from the pier.</p>
          </Link>
          <Link href="/guides/juneau-whale-watching-or-glacier-flight" className="rounded-3xl border border-amber-900/60 bg-amber-950/10 p-6 hover:border-amber-600">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">Existing DCC node</p>
            <h2 className="mt-3 text-2xl font-black">Whale watching or glacier flight?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">Compare the two signature experiences before committing the port day.</p>
          </Link>
        </section>

        <section className="mt-14 rounded-3xl border border-emerald-900/70 bg-[#0d1815] p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Decision made?</p>
          <h2 className="mt-3 text-3xl font-black">If the answer is “yes, we want to fly,” leave DCC.</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            Juneau Flight Deck owns the next layer: choose the flight format and continue to current provider options. DCC does not need to impersonate the transaction site.
          </p>
          <a href="https://juneauflightdeck.com/helicopter" className="mt-7 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-black text-slate-950 hover:bg-slate-200">
            Continue to Juneau Flight Deck ↗
          </a>
        </section>
      </section>
    </main>
  );
}
