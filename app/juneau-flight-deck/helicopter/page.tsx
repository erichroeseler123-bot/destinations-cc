import type { Metadata } from "next";

const DCC = "https://www.destinationcommandcenter.com";
const GO = "/go/juneau/helicopter-tours";

export const metadata: Metadata = {
  applicationName: "Juneau Flight Deck",
  title: "Compare Juneau Helicopter Glacier Flights | Juneau Flight Deck",
  description:
    "Compare Juneau helicopter flight formats after deciding flightseeing fits your cruise day: scenic icefield flights, glacier-landing emphasis, and premium combination formats.",
  alternates: { canonical: "https://juneauflightdeck.com/helicopter" },
  openGraph: {
    title: "Compare Juneau Helicopter Glacier Flights | Juneau Flight Deck",
    description: "Choose the flight format first, then continue to current provider availability and terms.",
    url: "https://juneauflightdeck.com/helicopter",
    siteName: "Juneau Flight Deck",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Compare Juneau Helicopter Glacier Flights | Juneau Flight Deck",
    description:
      "Compare scenic icefield flights, glacier-landing formats, and premium Juneau helicopter experiences around your ship day.",
  },
};

const lanes = [
  {
    name: "Scenic icefield flight",
    fit: "Aerial-view first",
    body: "Choose this when the broad Juneau Icefield perspective is the main event and a glacier landing is not essential.",
    q: "icefield explorer",
  },
  {
    name: "Glacier landing flight",
    fit: "Ice-under-your-feet first",
    body: "Choose this when physically landing on glacier terrain is part of the memory you are paying for.",
    q: "glacier landing",
  },
  {
    name: "Premium combination",
    fit: "More elements, longer footprint",
    body: "Choose this only when your ship call and budget support a longer premium format such as a combined glacier or dog-sled experience.",
    q: "dog sled helicopter",
  },
] as const;

export default function JuneauFlightComparisonPage() {
  return (
    <main className="min-h-screen bg-[#07111a] text-white">
      <section className="border-b border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,.13),transparent_35%),#07111a]">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <a href="/" className="text-sm font-bold text-slate-400 hover:text-white">← Juneau Flight Deck</a>
          <p className="mt-10 text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Flight comparison</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.045em] sm:text-6xl">Choose the format before you choose the product.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            You are past the broad “what should we do in Juneau?” question. This page keeps the decision narrow: what kind of helicopter experience actually fits your group and ship clock?
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {lanes.map((lane) => {
            const href = `${GO}?port=juneau&lane=premium-helicopter&q=${encodeURIComponent(lane.q)}&sourcePage=/helicopter&cta=${encodeURIComponent(lane.q)}`;
            return (
              <article key={lane.name} className="flex flex-col rounded-3xl border border-slate-800 bg-[#0b1621] p-6">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">{lane.fit}</p>
                <h2 className="mt-3 text-2xl font-black">{lane.name}</h2>
                <p className="mt-4 flex-1 text-sm leading-6 text-slate-400">{lane.body}</p>
                <a href={href} className="mt-7 inline-flex justify-center rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-100">
                  Continue to current options →
                </a>
              </article>
            );
          })}
        </div>

        <section className="mt-12 rounded-3xl border border-amber-900/60 bg-amber-950/10 p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Still deciding?</p>
          <h2 className="mt-3 text-2xl font-black">Do not use the booking layer to answer a research question.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Destination Command Center owns the upstream questions about value, weather risk, ship timing, landing versus scenic flight, and whether two Juneau activities fit. Solve that uncertainty there, then come back here.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`${DCC}/guides/juneau-glacier-landing-vs-scenic-flight`} className="rounded-xl border border-amber-800 px-4 py-3 text-sm font-bold text-amber-100 hover:border-amber-500">
              Landing vs scenic flight ↗
            </a>
            <a href={`${DCC}/guides/how-much-time-do-you-need-for-juneau-helicopter-tour`} className="rounded-xl border border-amber-800 px-4 py-3 text-sm font-bold text-amber-100 hover:border-amber-500">
              Check the ship clock ↗
            </a>
          </div>
        </section>

        <p className="mt-8 text-xs leading-5 text-slate-500">
          Provider pages control current price, availability, aircraft, pickup, safety requirements, weather decisions, cancellation policy, and final booking terms. Juneau Flight Deck helps narrow the format and sends the transaction to the appropriate provider path.
        </p>
      </section>
    </main>
  );
}
