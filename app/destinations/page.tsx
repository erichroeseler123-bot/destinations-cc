import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
} from "@/lib/dcc/jsonld";
import {
  listPromotedRegionalHubs,
  listRegionalHubs,
} from "@/lib/dcc/regionalHubs";

export const revalidate = 3600;

export const metadata: Metadata = {
  title:
    "Regional Destination Hubs & Topic Clusters | Destination Command Center",
  description:
    "Explore Destination Command Center's manifest-driven regional guidebooks for Colorado, Alaska, Louisiana, Nevada, and beyond—interlinking verified reference guides, transit comparison matrices, venues, ports, and coordinate telemetry.",
  alternates: { canonical: "https://destinationcommandcenter.com/destinations" },
  robots: { index: true, follow: true },
};

export default function DestinationsIndexPage() {
  const promotedHubs = listPromotedRegionalHubs();
  const allHubs = listRegionalHubs();
  const telemetryHubs = allHubs.filter((h) => h.referenceNodes.length === 0);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildCollectionPageJsonLd({
              path: "/destinations",
              name: "Destination Command Center — Regional Hub Directory",
              description:
                "Regional topic clusters grouping all manifest-registered travel reference nodes, coordinates, venues, ports, and decision guides by state.",
              items: promotedHubs.map((hub) => ({
                name: `${hub.name} (${hub.stateCode}) Destination Hub`,
                url: hub.canonicalPath,
                description: hub.heroSummary,
              })),
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "Destinations", item: "/destinations" },
            ]),
          ],
        }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 space-y-10">
        <header className="space-y-3 max-w-3xl">
          <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
            Manifest-Driven Regional Topic Clusters
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Regional Destination Hubs
          </h1>
          <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
            Every state hub below is compiled automatically from DCC&apos;s{" "}
            <code className="text-cyan-300">PUBLICATION_MANIFEST</code>,
            grouping authoritative travel reference guides, side-by-side transit
            comparison tables, venues, cruise ports, coordinate telemetry pages,
            and granular <code className="text-indigo-300">/llms.txt</code> AI
            sub-manifests.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-white">
            Flagship Promoted State Hubs ({promotedHubs.length})
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            {promotedHubs.map((hub) => (
              <article
                key={hub.slug}
                className="rounded-3xl border border-cyan-500/30 bg-zinc-900/80 p-6 flex flex-col justify-between space-y-4 shadow-lg"
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-cyan-200">
                      {hub.stateCode}
                    </span>
                    <a
                      href={hub.llmsTxtPath}
                      className="font-mono text-xs text-indigo-300 hover:underline"
                    >
                      {hub.llmsTxtPath}
                    </a>
                  </div>
                  <h3 className="text-xl font-black text-white">
                    <Link
                      href={hub.canonicalPath}
                      className="hover:text-cyan-300 transition"
                    >
                      {hub.name} Destination Hub
                    </Link>
                  </h3>
                  <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
                    {hub.heroSummary}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/10">
                  <div className="flex flex-wrap gap-2 text-[11px] text-zinc-400">
                    <span>
                      <strong className="text-white">
                        {hub.referenceNodes.length}
                      </strong>{" "}
                      Reference Nodes
                    </span>
                    <span>·</span>
                    <span>
                      <strong className="text-white">
                        {hub.coordinates.length}
                      </strong>{" "}
                      Coordinates
                    </span>
                    <span>·</span>
                    <span>
                      <strong className="text-white">{hub.venues.length}</strong>{" "}
                      Venues
                    </span>
                    <span>·</span>
                    <span>
                      <strong className="text-white">{hub.ports.length}</strong>{" "}
                      Ports
                    </span>
                  </div>
                  <Link
                    href={hub.canonicalPath}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-cyan-300 hover:underline"
                  >
                    <span>Explore {hub.name} Hub</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {telemetryHubs.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-200">
              Additional Coordinate Telemetry &amp; Venue States (
              {telemetryHubs.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {telemetryHubs.map((hub) => (
                <Link
                  key={hub.slug}
                  href={hub.canonicalPath}
                  className="rounded-2xl border border-white/10 bg-zinc-900/50 hover:border-white/25 p-4 space-y-1.5 transition block"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">
                      {hub.name}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-400">
                      {hub.stateCode}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {hub.coordinates.length} coordinates · {hub.venues.length}{" "}
                    venues · {hub.ports.length} ports
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
