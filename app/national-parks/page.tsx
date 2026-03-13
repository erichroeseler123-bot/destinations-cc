import type { Metadata } from "next";
import Link from "next/link";
import {
  NATIONAL_PARKS_AUTHORITY_CONFIG,
  listNationalParkSlugs,
} from "@/src/data/national-parks-authority-config";

const PAGE_URL = "https://destinationcommandcenter.com/national-parks";

export const metadata: Metadata = {
  title: "National Parks Layer | DCC Cross-Network Planning",
  description:
    "National Parks as a cross-network DCC layer: authority context, discovery pathways, monetized handoffs, and intelligence feedback.",
  alternates: { canonical: "/national-parks" },
  openGraph: {
    title: "National Parks Route Map",
    description:
      "Map layer for park planning and destination pairings across the DCC authority stack.",
    url: PAGE_URL,
    type: "website",
  },
};

export default function NationalParksPage() {
  const parks = listNationalParkSlugs().map((slug) => NATIONAL_PARKS_AUTHORITY_CONFIG[slug]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">DCC Map Layer</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">National Parks</h1>
          <p className="max-w-3xl text-zinc-300">
            National parks now sit inside the same DCC authority model as cities and ports: route-first summaries,
            top activities, logistics notes, and bookable guided-tour intent.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Seeded National Park Authority Pages</h2>
          <p className="mt-2 max-w-3xl text-zinc-300">
            Start with the highest-signal parks first. Each page gives a route summary, top activity intents, and
            a cleaner decision path into guided-tour discovery.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {parks.map((park) => (
              <Link
                key={park.slug}
                href={`/national-parks/${park.slug}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-5 hover:bg-white/10"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  {park.state} • {park.region}
                </p>
                <h3 className="mt-2 text-xl font-bold text-white">{park.name}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{park.heroSummary}</p>
                <p className="mt-4 text-sm font-semibold text-cyan-300">Open guide →</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Park Layer Map (v1)</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Initial marker layer. Next iteration can swap this to a full interactive map provider.
          </p>

          <div className="relative mt-4 h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-800">
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:30px_30px]" />
            {parks.map((park) => (
              <Link
                key={park.slug}
                href={`/national-parks/${park.slug}`}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: park.mapX, top: park.mapY }}
              >
                <div className="h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_0_6px_rgba(16,185,129,0.2)]" />
                <div className="mt-2 rounded-md border border-white/10 bg-black/70 px-2 py-1 text-[11px] text-zinc-100">
                  {park.name}, {park.state}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Linked Authority Pages</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <HubLink href="/mighty-argo-shuttle" label="Argo Shuttle" />
            <HubLink href="/vegas" label="Vegas" />
            <HubLink href="/alaska" label="Alaska" />
            <HubLink href="/cruises" label="Cruises" />
            <HubLink href="/new-orleans" label="New Orleans" />
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
