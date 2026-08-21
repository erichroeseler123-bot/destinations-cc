import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Destination Command Center | Coordinate Intelligence",
  description:
    "Destination Command Center is a coordinate-intelligence system that organizes public machine-readable information by latitude and longitude.",
  alternates: { canonical: "https://destinationcommandcenter.com/about" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "About Destination Command Center | Coordinate Intelligence",
    description:
      "One coordinate in. Structured public context out. DCC organizes public machine-readable information by latitude and longitude.",
    url: "https://destinationcommandcenter.com/about",
    type: "website",
  },
};

export default function AboutDccPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-4xl space-y-8 px-6 py-16">
        <header className="rounded-[2rem] border border-white/10 bg-zinc-900 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
            Destination Command Center · coordinate intelligence
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            The public internet, organized by location.
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-zinc-300">
            Destination Command Center (DCC) is a coordinate-intelligence system. Latitude and longitude are the
            permanent identity of a place. DCC asks mapped public machine-readable sources what they currently know
            about that exact point.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-2xl font-bold">What DCC is</h2>
          <p className="mt-4 text-zinc-300">
            Give DCC a latitude and longitude and it can assemble geographically relevant public context such as
            weather, air quality, official alerts, earthquakes, natural hazards, rivers and flood context, nearby
            infrastructure, aviation weather, tides, buoy observations, marine conditions and winter conditions.
            Only applicable modules appear, and sources expose availability and freshness.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-2xl font-bold">What DCC is not</h2>
          <p className="mt-4 text-zinc-300">
            DCC is not primarily a travel booking marketplace, travel agency, shuttle operator, affiliate network,
            tour marketplace or city-guide publisher. Older travel and commercial-decision pages belonged to a
            previous DCC architecture and do not define the current product.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-2xl font-bold">One place, two representations</h2>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-black/40 p-4 text-sm text-cyan-200">
            /location/44.76648/-91.49810{"\n"}/api/location/44.76648/-91.49810
          </pre>
          <p className="mt-4 text-zinc-300">
            The human page and JSON endpoint represent the same physical point. Address, city name, ZIP code, airport,
            venue or device location are discovery methods; the coordinate pair is the canonical identity.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-2xl font-bold">For software and AI agents</h2>
          <p className="mt-4 text-zinc-300">
            DCC publishes a self-describing coordinate API and machine-discovery surfaces so software can use the same
            location object without rebuilding source selection for every geography.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <a className="rounded-xl bg-cyan-600 px-4 py-2 font-semibold" href="/developers">Developer guide</a>
            <a className="rounded-xl border border-white/10 px-4 py-2" href="/openapi.json">OpenAPI</a>
            <a className="rounded-xl border border-white/10 px-4 py-2" href="/llms.txt">llms.txt</a>
            <a className="rounded-xl border border-white/10 px-4 py-2" href="/agent.json">agent.json</a>
          </div>
        </section>
      </div>
    </main>
  );
}
