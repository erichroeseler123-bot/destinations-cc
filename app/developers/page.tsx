import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DCC Developers | Dense Coordinate Location API",
  description: "Use latitude and longitude to retrieve dense public location intelligence from Destination Command Center.",
  alternates: { canonical: "/developers" },
};

const exampleLat = "39.66540";
const exampleLng = "-105.20570";

const MODULES = [
  ["identity", "Coordinate, timezone, elevation and canonical identity"],
  ["now", "Current weather and air-quality conditions"],
  ["conditions", "12-hour weather/air outlook and three-day context"],
  ["hazards", "Official alerts, recent earthquakes and NASA natural events"],
  ["water", "Nearby NOAA river/flood gauges when applicable"],
  ["official", "Official NWS forecast/zone context when applicable"],
  ["events", "Configured nearby event feeds when available"],
  ["machineFeeds", "Additional geographically mapped public machine feeds"],
] as const;

const SOURCES = [
  "Open-Meteo weather",
  "Open-Meteo / Copernicus CAMS air quality",
  "U.S. National Weather Service forecasts + alerts",
  "U.S. Geological Survey earthquakes",
  "NASA EONET natural events",
  "NOAA National Water Prediction Service gauges",
] as const;

export default function DevelopersPage() {
  return (
    <main className="min-h-screen bg-[#070b10] text-white">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Destination Command Center · Developers</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.045em] sm:text-6xl">One coordinate in. Dense public context out.</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-white/58">
          Latitude and longitude are the canonical DCC location key. If you know a coordinate, you do not need to know which public weather, alert, earth, water, air-quality, event, or local source covers it. DCC selects the geographically applicable sources and returns one predictable location object.
        </p>

        <section className="mt-10 rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.055] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/70">Canonical contract</p>
            <span className="rounded-full border border-cyan-300/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100/65">dcc-location-v2</span>
          </div>
          <div className="mt-5 space-y-3 font-mono text-sm text-cyan-50">
            <p>Human: /location/{"{lat}"}/{"{lng}"}</p>
            <p>JSON: /api/location/{"{lat}"}/{"{lng}"}</p>
            <p>Precision: 5 decimal places</p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="rounded-[26px] border border-white/10 bg-white/[0.035] p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200/70">Human page</p>
            <code className="mt-4 block break-all rounded-xl bg-black/30 p-4 text-sm text-white/72">https://www.destinationcommandcenter.com/location/{exampleLat}/{exampleLng}</code>
            <Link href={`/location/${exampleLat}/${exampleLng}`} className="mt-5 inline-flex text-sm font-black text-cyan-200">Open example →</Link>
          </article>
          <article className="rounded-[26px] border border-white/10 bg-white/[0.035] p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200/70">Machine endpoint</p>
            <code className="mt-4 block break-all rounded-xl bg-black/30 p-4 text-sm text-white/72">https://www.destinationcommandcenter.com/api/location/{exampleLat}/{exampleLng}</code>
            <a href={`/api/location/${exampleLat}/${exampleLng}`} className="mt-5 inline-flex text-sm font-black text-cyan-200">Open JSON →</a>
          </article>
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
          <h2 className="text-2xl font-black">Ordered response modules</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/48">Read the <code className="text-cyan-100">modules</code> object first. DCC returns only what mapped sources can support for that coordinate.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {MODULES.map(([name, description]) => (
              <div key={name} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <code className="text-sm font-black text-cyan-100">{name}</code>
                <p className="mt-2 text-xs leading-5 text-white/42">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
          <h2 className="text-2xl font-black">Current core public sources</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {SOURCES.map((source) => (
              <div key={source} className="rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-white/62">{source}</div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-white/42">Each response includes per-source availability and checked timestamps. DCC uses source-specific revalidation plus a short shared response cache so repeated agent reads do not hammer public upstream services.</p>
        </section>

        <section className="mt-8 rounded-[28px] border border-cyan-400/20 bg-cyan-500/[0.04] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-white">OCTO Core API & Booking Distribution</h2>
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
              5% Fixed DCC Share
            </span>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
            DCC provides an authorized distribution layer built on the Open Connectivity for Tour Operators (OCTO) standard.
            AI agents and applications query live operator availability and execute two-phase booking holds with explicit
            <code className="text-cyan-200"> expirationMinutes</code>. Operators retain merchant-of-record status and direct fulfillment authority.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">GET /api/octo/participants</span>
              <p className="mt-1 text-xs text-white/60">Registry of authorized operators, booking systems, and tech partners.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">POST /api/octo/availability</span>
              <p className="mt-1 text-xs text-white/60">Real-time availability check against upstream operator reservation systems.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">POST /api/octo/hold</span>
              <p className="mt-1 text-xs text-white/60">Two-phase reservation hold reserving seats for a 15-minute checkout window.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">POST /api/octo/confirm</span>
              <p className="mt-1 text-xs text-white/60">Confirm held reservation, generate digital voucher, and record 5% settlement.</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
          <h2 className="text-2xl font-black">Machine discovery</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["Agent contract", "/agent.json"],
              ["Well-known agent contract", "/.well-known/agent.json"],
              ["LLM instructions", "/llms.txt"],
              ["OpenAPI schema", "/openapi.json"],
              ["OCTO Participant Registry", "/api/octo/participants"],
              ["Authorized Operators", "/operators"],
            ].map(([label, href]) => (
              <a key={href} href={href} className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:bg-white/[0.05]">
                <strong className="text-sm text-white">{label}</strong>
                <code className="mt-2 block text-xs text-white/42">{href}</code>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
          <h2 className="text-2xl font-black">How to interpret a response</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/52">
            DCC aggregates time-sensitive public-source observations. Use provider names, timestamps, freshness fields, and source links when available. A missing module means DCC does not currently have a mapped usable source for that coordinate; it does not prove that the real-world condition or service is absent. Machine coordinate reads do not require reverse geocoding; a human-readable place name is optional.
          </p>
        </section>
      </div>
    </main>
  );
}
