import Link from "next/link";

export default function DccMachineContractExplainer() {
  return (
    <section className="border-t border-white/10 bg-[#090f16] text-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-4xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">How DCC works · Honest coverage boundaries</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Curated destination reference, supported by universal coordinate telemetry.
          </h2>
          <p className="mt-5 text-base leading-8 text-white/65">
            DCC connects <strong>Source-Attributed Travel Reference Guides</strong> with <strong>Live Coordinate Intelligence</strong>. Any coordinate on Earth can be queried for live environmental signals where public upstream feeds exist, while DCC&apos;s curated destination guides (such as <Link href="/juneau" className="text-cyan-300 underline">Juneau</Link>, <Link href="/red-rocks" className="text-cyan-300 underline">Red Rocks</Link>, and the <Link href="/routes/denver-breckenridge" className="text-cyan-300 underline">Denver–Breckenridge Corridor</Link>) provide verified geography, transport logistics, 6-factor entry dependency models, and operational safety boundaries.
          </p>
          <p className="mt-4 text-base leading-8 text-white/60">
            Every physical point has two representations: a human view at <code className="text-cyan-200">/location/lat/lng</code> and a machine JSON contract at <code className="text-cyan-200">/api/location/lat/lng</code> (<code className="text-cyan-200">dcc-location-v2</code>). DCC never claims worldwide encyclopedic destination coverage merely because any coordinate can resolve a weather feed, and missing upstream data is never presented as an &ldquo;all-clear.&rdquo;
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <strong className="text-sm text-cyan-200">1. Understand &amp; Prepare (Reference)</strong>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Curated destination, port, venue, and corridor references with 6-factor entry dependency models, transport rules, and explicit source attribution ledgers.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <strong className="text-sm text-emerald-300">2. Verify Live Signals (Coordinate API)</strong>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Live public observations &amp; forecasts (Open-Meteo, NWS, USGS, NASA EONET, NOAA NWPS/CO-OPS/NDBC, FAA AWC) with explicit non-conflation safety boundaries.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <strong className="text-sm text-cyan-200">3. Act on a Decision (Optional Handoffs)</strong>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Public transit and free alternatives alongside verified marketplace links, specialist sites, and authorized operator endpoints (such as GoSno&apos;s <code className="text-cyan-200">/.well-known/dcc</code> and Rezdy API pilot).
            </p>
          </article>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/about#capability-matrix" className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-[#041216] transition hover:bg-cyan-200">
            Capability &amp; Evidence Matrix →
          </Link>
          <Link href="/developers" className="rounded-xl border border-white/12 px-5 py-3 text-sm font-black text-white/75 transition hover:bg-white/[0.05]">
            Developer Guide
          </Link>
          <a href="/scope.json" className="rounded-xl border border-white/12 px-5 py-3 text-sm font-black text-white/75 transition hover:bg-white/[0.05]">
            Scope Contract (/scope.json)
          </a>
          <a href="/openapi.json" className="rounded-xl border border-white/12 px-5 py-3 text-sm font-black text-white/75 transition hover:bg-white/[0.05]">
            OpenAPI
          </a>
          <a href="/agent.json" className="rounded-xl border border-white/12 px-5 py-3 text-sm font-black text-white/75 transition hover:bg-white/[0.05]">
            Agent Contract (/agent.json)
          </a>
          <a href="/llms.txt" className="rounded-xl border border-white/12 px-5 py-3 text-sm font-black text-white/75 transition hover:bg-white/[0.05]">
            llms.txt
          </a>
          <Link href="/operators" className="rounded-xl border border-white/12 px-5 py-3 text-sm font-black text-white/75 transition hover:bg-white/[0.05]">
            For tour operators
          </Link>
        </div>
      </div>
    </section>
  );
}
