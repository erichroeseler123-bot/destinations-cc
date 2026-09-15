import Link from "next/link";

export default function DccMachineContractExplainer() {
  return (
    <section className="border-t border-white/10 bg-[#090f16] text-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-4xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">How DCC works</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Every coordinate on Earth can have a DCC page.</h2>
          <p className="mt-5 text-base leading-8 text-white/58">
            DCC connects two foundational layers: <strong>Destination Intelligence</strong> and <strong>Authorized Tourism Commerce</strong>. Your device location, street address, airport, port, or landmark resolves to a canonical coordinate. DCC hydrates the location view from authoritative public feeds and connects directly to authorized operators using the open OCTO standard when live connections are available.
          </p>
          <p className="mt-4 text-base leading-8 text-white/58">
            The same coordinate has two views: a human page at <code className="text-cyan-200">/location/lat/lng</code> and a developer JSON endpoint at <code className="text-cyan-200">/api/location/lat/lng</code>. Standardized bookings route directly to authorized operator booking systems when live connections are available.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <strong className="text-sm text-cyan-200">1. Discover</strong>
            <p className="mt-2 text-sm leading-6 text-white/50">Device location or entered place resolves to a permanent coordinate hydrated live from authoritative public sources.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <strong className="text-sm text-emerald-300">2. Connect</strong>
            <p className="mt-2 text-sm leading-6 text-white/50">Direct connectivity to authorized operators via the open OCTO standard when live connections are available.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <strong className="text-sm text-cyan-200">3. Book</strong>
            <p className="mt-2 text-sm leading-6 text-white/50">Standardized availability holds and booking workflows with authorized operators when live connections are available.</p>
          </article>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/octo" className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-[#041216] transition hover:bg-cyan-200">OCTO Tourism Layer →</Link>
          <Link href="/demo" className="rounded-xl border border-white/12 px-5 py-3 text-sm font-black text-white/75 transition hover:bg-white/[0.05]">Endpoint Hydration Demo</Link>
          <Link href="/developers" className="rounded-xl border border-white/12 px-5 py-3 text-sm font-black text-white/75 transition hover:bg-white/[0.05]">Developer Guide</Link>
          <a href="/openapi.json" className="rounded-xl border border-white/12 px-5 py-3 text-sm font-black text-white/75 transition hover:bg-white/[0.05]">OpenAPI</a>
          <a href="/agent.json" className="rounded-xl border border-white/12 px-5 py-3 text-sm font-black text-white/75 transition hover:bg-white/[0.05]">Agent Contract</a>
        </div>
      </div>
    </section>
  );
}
