import type { Metadata } from "next";
import Link from "next/link";
import PageActionBar from "@/app/components/dcc/PageActionBar";
import {
  CRUISE_SHORE_EXCURSION_DECISIONS,
  CRUISE_SHORE_EXCURSION_FAQ,
  CRUISE_SHORE_EXCURSION_REGIONS,
  CRUISE_SHORE_EXCURSION_VIDEOS,
} from "@/src/data/cruise-shore-excursions-guide";
import { buildMapsSearchUrl, type PageAction } from "@/src/lib/page-actions";

const PAGE_URL = "https://destinationcommandcenter.com/cruises/shore-excursions";

export const metadata: Metadata = {
  title: "Cruise Shore Excursions Guide | Best Regions, Booking Strategy, and Reality Checks",
  description:
    "Practical cruise shore excursion guidance covering Alaska, Caribbean, Mediterranean, independent vs ship-booked decisions, and recent traveler reality checks.",
  alternates: { canonical: "/cruises/shore-excursions" },
  openGraph: {
    title: "Cruise Shore Excursions Guide",
    description:
      "High-signal shore excursion picks, booking tradeoffs, and recent traveler evidence for cruise planning.",
    url: PAGE_URL,
    type: "website",
  },
};

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebPage", "Guide"],
        "@id": PAGE_URL,
        url: PAGE_URL,
        name: "Cruise Shore Excursions Guide",
        description:
          "Practical cruise shore excursion guidance across Alaska, Caribbean, Europe, and long-haul ports, with booking strategy and recent traveler reality checks.",
        dateModified: "2026-03-12",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Cruises", item: "https://destinationcommandcenter.com/cruises" },
          { "@type": "ListItem", position: 2, name: "Shore Excursions Guide", item: PAGE_URL },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: CRUISE_SHORE_EXCURSION_FAQ.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function CruiseShoreExcursionsPage() {
  const actions: PageAction[] = [
    { href: "/cruises", label: "Back to Cruise Explorer", kind: "internal" },
    { href: "/ports", label: "Open Ports Directory", kind: "internal" },
    { href: buildMapsSearchUrl("cruise port shore excursions"), label: "Open port excursion search in Maps", kind: "external" },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_24%),linear-gradient(180deg,_#111318_0%,_#090a0d_100%)] text-white">
      <JsonLd />
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-16">
        <header className="space-y-5">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">DCC Cruise Excursions Guide</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Cruise Shore Excursions Guide</h1>
          <p className="max-w-4xl text-lg text-zinc-200">
            Shore excursions work best when you plan around transfer friction, crowd pressure, weather, and actual usable port time. Use this guide to separate high-value picks from overrated bus days.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <PageActionBar title="Useful excursion actions" actions={actions} />

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Best for</p>
            <p className="mt-2 text-lg font-semibold">Cruisers comparing regions, operators, and day types</p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">What changes most</p>
            <p className="mt-2 text-lg font-semibold">Crowds, transfer time, operator quality, and weather risk</p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Planning rule</p>
            <p className="mt-2 text-lg font-semibold">Do not treat every port day like a generic tours marketplace</p>
          </article>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-2xl font-bold">Region-by-region high-signal picks</h2>
          <div className="mt-5 space-y-5">
            {CRUISE_SHORE_EXCURSION_REGIONS.map((region) => (
              <article key={region.title} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <h3 className="text-xl font-bold text-zinc-100">{region.title}</h3>
                <p className="mt-3 max-w-3xl text-sm text-zinc-300">{region.summary}</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {region.picks.map((pick) => (
                    <div key={pick.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <h4 className="text-lg font-semibold text-zinc-100">{pick.title}</h4>
                      <p className="mt-2 text-sm text-zinc-300">{pick.body}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-2xl font-bold">How to decide between ship-booked and independent</h2>
            <div className="mt-4 space-y-3">
              {CRUISE_SHORE_EXCURSION_DECISIONS.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-lg font-semibold text-zinc-100">{item.title}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{item.body}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-2xl font-bold">Common excursion failure modes</h2>
            <ul className="mt-4 space-y-3 text-zinc-300">
              <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">Too much coach time relative to actual destination time.</li>
              <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">Crowd compression at the most famous stops and photo points.</li>
              <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">Weak operator quality hidden behind a familiar headline attraction.</li>
              <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">Weather or tendering friction that shrinks the useful shore window.</li>
            </ul>
          </article>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-300">Reality Check Videos</p>
          <h2 className="mt-2 text-2xl font-bold">Recent traveler footage worth using as evidence</h2>
          <p className="mt-3 max-w-3xl text-sm text-zinc-400">
            These are illustrative references from recent traveler footage, not official cruise-line guidance. Conditions vary by ship, line, port, operator, and weather.
          </p>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {CRUISE_SHORE_EXCURSION_VIDEOS.map((video) => (
              <a
                key={video.href}
                href={video.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="rounded-2xl border border-white/10 bg-black/20 p-5 hover:bg-white/10"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{video.source}</p>
                <h3 className="mt-2 text-lg font-semibold text-zinc-100">{video.title}</h3>
                <p className="mt-3 text-sm text-zinc-300">{video.whyItMatters}</p>
                <p className="mt-4 text-sm font-semibold text-emerald-200">Open video evidence →</p>
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-2xl font-bold">Common shore excursion questions</h2>
          <div className="mt-4 space-y-3">
            {CRUISE_SHORE_EXCURSION_FAQ.map((item) => (
              <details key={item.question} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <summary className="cursor-pointer list-none font-semibold text-zinc-100">{item.question}</summary>
                <p className="mt-3 text-sm text-zinc-300">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/ports/juneau" className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Alaska example: Juneau</h2>
            <p className="mt-2 text-zinc-300">
              Compare whale watching, glacier access, and wildlife timing against the real transfer and weather constraints.
            </p>
          </Link>
          <Link href="/ports/cozumel-mexico" className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Caribbean example: Cozumel</h2>
            <p className="mt-2 text-zinc-300">
              Use a reef-and-beach-heavy port to compare simple water days against bus-heavy inland alternatives.
            </p>
          </Link>
          <Link href="/ports/santorini" className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Mediterranean example: Santorini</h2>
            <p className="mt-2 text-zinc-300">
              Good reference when crowd timing and cable-car pressure change the value of the shore day.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
