import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from "@/lib/dcc/jsonld";
import { getPublicationManifestEntry } from "@/src/data/publication-manifest";

const PAGE_PATH = "/widget";
const manifestEntry = getPublicationManifestEntry(PAGE_PATH);
const isIndexable = manifestEntry?.indexingState === "index_follow";

export const metadata: Metadata = {
  title: "Embeddable Venue & Coordinate Intelligence Widget | Destination Command Center",
  description:
    "Embed source-attributed DCC venue logistics, live NWS/NOAA environmental conditions, and arrival/exit guidance on venue, hotel, and event pages.",
  alternates: {
    canonical: manifestEntry?.canonicalUrl || "https://destinationcommandcenter.com/widget",
  },
  robots: {
    index: isIndexable,
    follow: isIndexable,
  },
};

export default function VenueWidgetPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd({
        path: PAGE_PATH,
        name: "Embeddable Venue & Coordinate Intelligence Widget",
        description:
          "Embed source-attributed DCC venue logistics, live environmental conditions, and arrival/exit guidance.",
        dateModified: manifestEntry?.materialChangeDate || "2026-10-23",
      }),
      buildBreadcrumbJsonLd([
        { name: "Destination Command Center", item: "/" },
        { name: "Venue Widget", item: PAGE_PATH },
      ]),
    ],
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-4xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Platform Pillar · Venue Widgets</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            Embeddable Venue &amp; Coordinate Intelligence Widget
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-zinc-300">
            Provide visitors with source-backed arrival/exit logistics, elevation and weather context, and public vs. private transport comparisons directly on venue, lodging, or event pages.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 space-y-4 text-zinc-300">
          <h2 className="text-2xl font-bold text-white">What the DCC Venue Widget Displays</h2>
          <ul className="space-y-2 text-sm leading-6">
            <li>• <strong>Source-Attributed Conditions:</strong> Live NWS forecast, NOAA/USGS observations where applicable, and explicit epistemic boundaries (weather never implies venue operating status or lightning-hold clearance).</li>
            <li>• <strong>Arrival &amp; Post-Event Exit Geometry:</strong> Parking lot separation, rideshare pickup lot constraints, and realistic post-show egress windows.</li>
            <li>• <strong>Neutral Transport Comparison:</strong> Side-by-side comparison of public transit, self-drive parking, shared shuttles, and private group vehicles.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 space-y-4 text-zinc-300">
          <h2 className="text-2xl font-bold text-white">Supported Flagship Venues &amp; Corridors</h2>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/red-rocks" className="rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-white/10">
              Red Rocks Park &amp; Amphitheatre →
            </Link>
            <Link href="/venues/red-rocks-amphitheatre" className="rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-white/10">
              Red Rocks Venue Node →
            </Link>
            <Link href="/developers" className="rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-white/10">
              Coordinate API Documentation →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
