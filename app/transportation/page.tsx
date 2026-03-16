import type { Metadata } from "next";
import Link from "next/link";
import RideOptionsCard from "@/app/components/transportation/RideOptionsCard";
import {
  TRANSPORT_DIRECTORY,
  TRANSPORT_DIRECTORY_UPDATED_AT,
  getTransportEntriesByStatus,
  getTransportRegions,
} from "@/src/data/transport-directory";
import { SITE_IDENTITY } from "@/src/data/site-identity";

const PAGE_URL = "https://destinationcommandcenter.com/transportation";

export const metadata: Metadata = {
  title: "Transportation Directory | Destination Command Center",
  description:
    "Destination transportation guides and supported venue coverage from Destination Command Center, starting with Colorado and Red Rocks.",
  alternates: { canonical: "/transportation" },
};

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": PAGE_URL,
    url: PAGE_URL,
    name: "Transportation Directory",
    description: "Destination transportation guides and supported venue transportation coverage from Destination Command Center.",
    dateModified: TRANSPORT_DIRECTORY_UPDATED_AT,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

function statusLabel(status: string) {
  return status.replace("_", " ");
}

export default function TransportationPage() {
  const active = getTransportEntriesByStatus("active");
  const limited = getTransportEntriesByStatus("limited");
  const comingSoon = getTransportEntriesByStatus("coming_soon");
  const regions = getTransportRegions();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Transportation guides</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Supported venue and destination transportation
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">
            Find transportation guidance for supported venues and destinations, with clear coverage status for where ride options are active, limited, partner-led, or still coming soon.
          </p>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-500">
            {SITE_IDENTITY.name} helps travelers find what is happening in a place and how to get there. Where transportation support exists, DCC points travelers to the right ride options without turning this page into a generic operator directory.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-zinc-300">
            <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2">
              {TRANSPORT_DIRECTORY.length} supported entries
            </div>
            <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2">
              Colorado-first launch
            </div>
            <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2">
              Updated {TRANSPORT_DIRECTORY_UPDATED_AT}
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Active</p>
            <p className="mt-2 text-3xl font-black">{active.length}</p>
            <p className="mt-2 text-sm text-zinc-300">Coverage with live ride execution.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Limited</p>
            <p className="mt-2 text-3xl font-black">{limited.length}</p>
            <p className="mt-2 text-sm text-zinc-300">Guide or custom/group transport coverage only.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Coming soon</p>
            <p className="mt-2 text-3xl font-black">{comingSoon.length}</p>
            <p className="mt-2 text-sm text-zinc-300">Planned venue coverage without active execution yet.</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Launch region</p>
              <h2 className="mt-2 text-2xl font-bold">Colorado transportation coverage</h2>
            </div>
            <Link
              href="/transportation/colorado"
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
            >
              Open Colorado coverage
            </Link>
          </div>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            Red Rocks is the active execution node. Major Denver venues, clubs, Boulder venues, and mountain venues are
            kept in limited or coming-soon status until they have real support.
          </p>
        </section>

        <RideOptionsCard venueSlug="red-rocks-amphitheatre" sourcePage="/transportation" />

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Regions</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {regions.map((region) => (
              <Link
                key={region}
                href={region === "Colorado" ? "/transportation/colorado" : "/transportation"}
                className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
              >
                {region}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Current entries</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {TRANSPORT_DIRECTORY.map((entry) => (
              <Link
                key={entry.slug}
                href={entry.dccUrl}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {entry.city}, {entry.state}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{entry.name}</h3>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-cyan-200">
                    {statusLabel(entry.serviceStatus)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-zinc-300">{entry.notes}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
