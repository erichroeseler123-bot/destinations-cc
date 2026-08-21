import Link from "next/link";

export default function DccMachineContractExplainer() {
  return (
    <section className="border-t border-white/10 bg-[#090f16] text-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-4xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">How DCC works</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Every coordinate on Earth can have a DCC page.</h2>
          <p className="mt-5 text-base leading-8 text-white/58">
            DCC uses latitude and longitude as the permanent identity of a physical location. Your device location, a street address, a city, an airport, a port, a venue, or a landmark is simply a way to discover those coordinates. Once DCC has the coordinates, it builds the location view from the public machine-readable information available there.
          </p>
          <p className="mt-4 text-base leading-8 text-white/58">
            The same coordinate has two views: a human page at <code className="text-cyan-200">/location/lat/lng</code> and a developer JSON endpoint at <code className="text-cyan-200">/api/location/lat/lng</code>. That means people, programmers, search engines, and AI systems can refer to the same place using the same coordinate identity.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <strong className="text-sm text-white">1. Resolve</strong>
            <p className="mt-2 text-sm leading-6 text-white/45">Device location or entered place becomes latitude and longitude.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <strong className="text-sm text-white">2. Assemble</strong>
            <p className="mt-2 text-sm leading-6 text-white/45">DCC checks which public sources can contribute useful information at those coordinates.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <strong className="text-sm text-white">3. Publish</strong>
            <p className="mt-2 text-sm leading-6 text-white/45">The coordinate gets a stable human page and machine-readable JSON representation.</p>
          </article>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/developers" className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-[#041216] transition hover:bg-cyan-200">Developer guide →</Link>
          <a href="/openapi.json" className="rounded-xl border border-white/12 px-5 py-3 text-sm font-black text-white/75 transition hover:bg-white/[0.05]">OpenAPI</a>
          <a href="/agent.json" className="rounded-xl border border-white/12 px-5 py-3 text-sm font-black text-white/75 transition hover:bg-white/[0.05]">Agent contract</a>
        </div>
      </div>
    </section>
  );
}
