import type { Metadata } from "next";
import Link from "next/link";
import { DCC_CAPABILITY_TRUTH_MATRIX, listTravelReferenceNodes } from "@/lib/dcc/travelReference";

export const metadata: Metadata = {
  title: "About Destination Command Center | Travel Reference & Capability Truth Matrix",
  description:
    "Destination Command Center (DCC) is a travel reference and decision platform supported by live, source-attributed coordinate intelligence. Inspect our capability truth matrix, evidence attribution model, and non-conflation safety rules.",
  alternates: { canonical: "https://destinationcommandcenter.com/about" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "About Destination Command Center | Travel Reference & Capability Truth Matrix",
    description:
      "Source-attributed destination reference guides connected to live coordinate telemetry, developer APIs, and venue widgets.",
    url: "https://destinationcommandcenter.com/about",
    type: "website",
  },
};

export default function AboutDccPage() {
  const referenceNodes = listTravelReferenceNodes();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": "https://destinationcommandcenter.com/about#webpage",
        url: "https://destinationcommandcenter.com/about",
        name: "About Destination Command Center | Travel Reference & Capability Truth Matrix",
        description:
          "Destination Command Center is a travel reference and decision platform supported by live, source-attributed coordinate intelligence.",
        isPartOf: { "@id": "https://destinationcommandcenter.com/#website" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Destination Command Center", item: "https://destinationcommandcenter.com/" },
          { "@type": "ListItem", position: 2, name: "About & Capability Matrix", item: "https://destinationcommandcenter.com/about" },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-16">
        <header className="rounded-[2rem] border border-white/10 bg-zinc-900 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
            Destination Command Center · Travel Reference &amp; Coordinate Intelligence
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            Verifiable travel reference, supported by live coordinate intelligence.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-300">
            Destination Command Center (DCC) helps travelers, search engines, and AI assistants understand destinations, prepare for trips, compare practical transport and excursion options, and inspect live environmental conditions. We keep our coordinate platform (<code className="text-cyan-200">/location/lat/lng</code>), JSON API (<code className="text-cyan-200">/api/location/lat/lng</code>), and embeddable venue widgets (<code className="text-cyan-200">/widget</code>) at the core while connecting them to deep, source-attributed destination reference guides.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <h2 className="text-2xl font-bold">1. Curated Travel Reference Guides</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
              Coordinates alone cannot tell a traveler when a Canadian eTA applies (air arrival into Vancouver for visa-exempt foreign nationals) versus when a passport, WHTI document, or Temporary Resident Visa is required for land/sea cruise calls and Yukon excursions, which Red Rocks parking lot avoids a 380-foot stair climb, or when Colorado&apos;s statutory I-70 Passenger Vehicle Traction Law is enforced. Our destination references model:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              <li>• <strong>Overview, Geography, History &amp; Culture:</strong> Local context grounded in municipal, tribal, and federal park authorities.</li>
              <li>• <strong>Getting There &amp; Around:</strong> Airports, cruise berths, ferries, public transit, and transfer realities.</li>
              <li>• <strong>6-Factor Entry &amp; Regulatory Dependencies:</strong> Modeling nationality, passport/documents, residence, transit routing, trip purpose, and dates.</li>
              <li>• <strong>Timing, Seasonality, Accessibility &amp; Closures:</strong> Practical constraints and official ADA resources.</li>
              <li>• <strong>Context-Preserving Specialist Handoffs:</strong> Passing known date, party size, and port/hub context to specialist sites without inventing parameters.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <h2 className="text-2xl font-bold">2. Universal Coordinate Intelligence &amp; Safety Rules</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Every physical point on Earth resolves to a canonical 5-decimal coordinate pair with a human view (<code className="text-cyan-200">/location/lat/lng</code>) and a machine JSON contract (<code className="text-cyan-200">/api/location/lat/lng</code>). We enforce three strict epistemic rules:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              <li>• <strong>No Conflation of Weather with Operating Status:</strong> Meteorological forecasts and alerts never establish venue lightning holds, highway traction restrictions, cruise docking changes, or activity safety.</li>
              <li>• <strong>Missing Data Is Never an &ldquo;All-Clear&rdquo;:</strong> When an upstream feed is outside geographic scope or times out, DCC displays an explicit <em>Unverified / Unavailable</em> state rather than <code className="text-amber-200">0</code> warnings.</li>
              <li>• <strong>Distinguishable Authority Categories:</strong> Every consequential claim is labeled as an Official Rule, Live Observation, Model Forecast, DCC Interpretation, or Editorial Recommendation.</li>
            </ul>
          </div>
        </section>

        <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.04] p-6">
          <h2 className="text-2xl font-bold">Flagship Destination Reference Releases</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Explore our three place-adapted destination reference experiences connected bidirectionally to their coordinate nodes:
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {referenceNodes.map((node) => (
              <Link
                key={node.id}
                href={node.canonicalPath}
                className="rounded-2xl border border-white/10 bg-black/40 p-5 transition hover:border-cyan-300/40"
              >
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">{node.placeType.replace(/_/g, " ")}</span>
                <h3 className="mt-2 text-lg font-bold text-white">{node.title}</h3>
                <p className="mt-2 text-xs leading-5 text-zinc-300 line-clamp-3">{node.heroSummary}</p>
                <span className="mt-4 inline-block text-xs font-bold text-cyan-200">Open Reference Guide →</span>
              </Link>
            ))}
          </div>
        </section>

        <section id="capability-matrix" className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Honest Coverage &amp; Verification</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black">DCC Capability Truth Matrix</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              What DCC actually integrates live via API, what is provided as a verified official resource link, and what remains in pilot or onboarding status:
            </p>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/15 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  <th className="py-3 pr-4">Capability</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Geographic Scope</th>
                  <th className="py-3 px-4">What Actually Works</th>
                  <th className="py-3 pl-4">Safety Boundary / Misconception to Avoid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {DCC_CAPABILITY_TRUTH_MATRIX.map((row) => (
                  <tr key={row.capability} className="align-top">
                    <td className="py-4 pr-4 font-bold text-white">
                      {row.capability}
                      <div className="mt-1 text-[10px] font-normal text-zinc-400">
                        Sources: {row.primarySources.join(", ")}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          row.status === "live_integrated_global" || row.status === "live_integrated_us_regional"
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                            : row.status === "pilot_bounded_feed"
                              ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                              : row.status === "official_link_only"
                                ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                                : "border-purple-400/30 bg-purple-400/10 text-purple-200"
                        }`}
                      >
                        {row.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-zinc-300">{row.geographicScope}</td>
                    <td className="py-4 px-4 leading-5 text-zinc-300">{row.actualImplementation}</td>
                    <td className="py-4 pl-4 leading-5 text-amber-100/85">{row.commonMisconceptionToAvoid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-2xl font-bold">For software, venues, and AI agents</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            DCC publishes self-describing machine contracts and embeddable widgets so developers, venues, and AI assistants can consume both live coordinate intelligence and structured destination reference metadata.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <Link className="rounded-xl bg-cyan-500 px-4 py-2 font-bold text-black" href="/developers">
              Developer guide
            </Link>
            <Link className="rounded-xl border border-white/15 px-4 py-2 font-semibold" href="/widget">
              Venue Widget
            </Link>
            <Link className="rounded-xl border border-white/15 px-4 py-2 font-semibold" href="/pricing">
              Pricing
            </Link>
            <a className="rounded-xl border border-white/15 px-4 py-2 font-mono text-xs flex items-center" href="/scope.json">
              /scope.json
            </a>
            <a className="rounded-xl border border-white/15 px-4 py-2 font-mono text-xs flex items-center" href="/openapi.json">
              /openapi.json
            </a>
            <a className="rounded-xl border border-white/15 px-4 py-2 font-mono text-xs flex items-center" href="/llms.txt">
              /llms.txt
            </a>
            <a className="rounded-xl border border-white/15 px-4 py-2 font-mono text-xs flex items-center" href="/agent.json">
              /agent.json
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
