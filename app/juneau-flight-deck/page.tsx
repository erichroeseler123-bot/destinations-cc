import type { Metadata } from "next";

const DCC = "https://www.destinationcommandcenter.com";

export const metadata: Metadata = {
  applicationName: "Juneau Flight Deck",
  title: "Juneau Flight Deck | Glacier Flights for Cruise Visitors",
  description:
    "A focused Juneau flightseeing storefront for cruise visitors comparing helicopter glacier flights, landing-style experiences, ship timing, and weather backup planning.",
  alternates: { canonical: "https://juneauflightdeck.com/" },
  openGraph: {
    title: "Juneau Flight Deck",
    description: "Compare Juneau glacier-flight formats after you have decided flying is the right use of your port day.",
    url: "https://juneauflightdeck.com/",
    siteName: "Juneau Flight Deck",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Juneau Flight Deck | Glacier Flights for Cruise Visitors",
    description:
      "Compare Juneau glacier-flight formats, ship timing, and weather-backup planning before choosing a provider.",
  },
};

const researchLinks = [
  ["Is a helicopter glacier tour worth it?", `${DCC}/guides/is-a-juneau-helicopter-glacier-tour-worth-it`],
  ["Glacier landing or scenic flight?", `${DCC}/guides/juneau-glacier-landing-vs-scenic-flight`],
  ["How much time should I leave?", `${DCC}/guides/how-much-time-do-you-need-for-juneau-helicopter-tour`],
  ["What if the weather cancels?", `${DCC}/guides/juneau-helicopter-tour-weather-backup-plan`],
] as const;

export default function JuneauFlightDeckHostPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://juneauflightdeck.com/#organization",
        name: "Juneau Flight Deck",
        url: "https://juneauflightdeck.com/",
      },
      {
        "@type": "WebSite",
        "@id": "https://juneauflightdeck.com/#website",
        name: "Juneau Flight Deck",
        url: "https://juneauflightdeck.com/",
        publisher: { "@id": "https://juneauflightdeck.com/#organization" },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#07111a] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(103,232,249,.16),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(96,165,250,.14),transparent_30%),linear-gradient(180deg,#081722,#07111a)]" />
        <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Juneau Flight Deck · Alaska</p>
          <h1 className="mt-5 max-w-5xl text-5xl font-black tracking-[-0.05em] sm:text-6xl md:text-7xl">
            You decided to fly. Now choose the right flight.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
            Juneau Flight Deck is the specialist layer for cruise visitors who are already leaning toward flightseeing. Compare the shape of the experience, protect the ship clock, and keep a weather backup ready.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="/helicopter" className="rounded-xl bg-white px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-100">
              Compare Juneau flight formats →
            </a>
            <a href={`${DCC}/guides/is-a-juneau-helicopter-glacier-tour-worth-it`} className="rounded-xl border border-cyan-800 bg-cyan-950/25 px-6 py-3 text-sm font-black text-cyan-100 transition hover:border-cyan-500">
              Not sure yet? Research first ↗
            </a>
          </div>
          <p className="mt-5 text-xs leading-5 text-slate-500">
            Juneau Flight Deck is an independent comparison and planning surface. Operator availability, aircraft, pricing, pickup, weather policy, and booking terms remain with the provider.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["01", "Scenic flight", "Best when the aerial icefield perspective is the main reason you want to fly."],
            ["02", "Glacier landing", "Best when physically stepping onto glacier terrain is part of the memory you want."],
            ["03", "Premium combination", "Best when your ship call, budget, and appetite for a longer excursion all support more than one element."],
          ].map(([number, title, body]) => (
            <article key={title} className="rounded-3xl border border-slate-800 bg-[#0b1621] p-6">
              <span className="text-xs font-black text-cyan-300">{number}</span>
              <h2 className="mt-3 text-2xl font-black">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-800 bg-[#0a141e]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Before you compare products</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">Four questions belong upstream at Destination Command Center.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {researchLinks.map(([label, href]) => (
              <a key={label} href={href} className="rounded-2xl border border-slate-800 bg-[#07111a] p-5 transition hover:border-cyan-700">
                <strong>{label}</strong>
                <span className="mt-3 block text-sm font-bold text-cyan-200">Open DCC decision guide ↗</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">The handoff</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight">DCC answers “should we?” Juneau Flight Deck answers “which flight?”</h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
          That boundary is intentional. Research and tradeoffs live upstream. Once the decision points toward flying, this site stays focused on the flightseeing choice instead of making you repeat the whole Juneau research process.
        </p>
        <a href="/helicopter" className="mt-7 inline-flex rounded-xl bg-cyan-300 px-6 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200">
          Go to flight comparison →
        </a>
      </section>
    </main>
  );
}
