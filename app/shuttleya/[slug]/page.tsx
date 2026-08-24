import type { Metadata } from "next";
import { notFound } from "next/navigation";

const DATA = {
  "airport-shuttles": {
    title: "Airport transportation",
    intro: "Start with the airport and destination, then continue to the operator that actually serves the route.",
    questions: ["Which airport are you arriving at?", "Where are you actually going?", "Private ride or another format?", "Does the operator publish this route or require a quote?"],
    operators: [
      { name: "GoSno", scope: "DEN / COS ↔ Colorado mountain resorts", href: "https://gosno.co" },
      { name: "BigSky GoSno", scope: "BZN ↔ Big Sky private transportation", href: "https://bigsky.gosno.co" },
      { name: "Destination Command Center", scope: "Broader route and destination decision support", href: "https://www.destinationcommandcenter.com" },
    ],
  },
  "ski-shuttles": {
    title: "Ski & mountain transportation",
    intro: "Compare mountain transportation by airport, destination, group size and operator coverage—not by a made-up ShuttleYa schedule.",
    questions: ["DEN, COS or BZN?", "Which mountain destination?", "How many passengers and how much luggage?", "Does the operator offer online booking or a quote for that route?"],
    operators: [
      { name: "GoSno", scope: "Colorado private mountain transportation", href: "https://gosno.co" },
      { name: "BigSky GoSno", scope: "BZN ↔ Big Sky private transportation", href: "https://bigsky.gosno.co" },
    ],
  },
  "concert-transportation": {
    title: "Concert transportation",
    intro: "Choose the transportation product that matches the event and group, then book with the company responsible for the trip.",
    questions: ["Which venue and date?", "Do you need round-trip private transportation?", "Do you need a designated-driver style service?", "Where is your pickup location?"],
    operators: [
      { name: "Party at Red Rocks", scope: "Private Red Rocks transportation", href: "https://partyatredrocks.com" },
      { name: "Red Rocks DD", scope: "Red Rocks designated-driver transportation", href: "https://redrocksdd.com" },
      { name: "Destination Command Center", scope: "Broader venue transportation decision support", href: "https://www.destinationcommandcenter.com" },
    ],
  },
  "cruise-port-transportation": {
    title: "Cruise-port transportation",
    intro: "Start with the port and the kind of local ride you need. ShuttleYa provides the discovery layer; the local operator controls the actual service.",
    questions: ["Which port are you visiting?", "Is this point-to-point transportation or a private local experience?", "What is your ship timing?", "Which local provider is responsible for the ride?"],
    operators: [
      { name: "Vibe Around Town", scope: "USVI local-driver discovery and private ride planning", href: "https://vibearoundtown.com" },
      { name: "Destination Command Center", scope: "Port and destination decision support", href: "https://www.destinationcommandcenter.com" },
    ],
  },
} as const;

type Slug = keyof typeof DATA;

export function generateStaticParams() {
  return Object.keys(DATA).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = DATA[slug as Slug];
  if (!item) return {};
  return {
    title: `${item.title} | ShuttleYa`,
    description: item.intro,
    alternates: { canonical: `https://shuttleya.com/${slug}` },
  };
}

export default async function TransportationCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = DATA[slug as Slug];
  if (!item) notFound();

  return (
    <main className="min-h-screen bg-[#091014] text-[#f7f5ef]">
      <section className="mx-auto max-w-5xl px-5 py-14 sm:px-8 md:py-20">
        <a href="/" className="text-sm font-bold text-sky-300">← ShuttleYa</a>
        <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-sky-300">Transportation discovery</p>
        <h1 className="mt-4 text-5xl font-black tracking-[-0.05em] text-white sm:text-6xl">{item.title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{item.intro}</p>

        <div className="mt-10 grid gap-5 md:grid-cols-[.9fr_1.1fr]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">Resolve these first</p>
            <ul className="mt-5 space-y-4 text-slate-200">
              {item.questions.map((question) => <li key={question}>• {question}</li>)}
            </ul>
          </section>

          <section className="rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.05] p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Continue to a real provider</p>
            <div className="mt-5 space-y-3">
              {item.operators.map((operator) => (
                <a key={operator.name} href={operator.href} className="block rounded-2xl border border-white/10 bg-black/20 p-5 hover:border-emerald-300/40">
                  <div className="font-black text-white">{operator.name}</div>
                  <div className="mt-1 text-sm leading-6 text-slate-400">{operator.scope}</div>
                  <div className="mt-3 text-sm font-bold text-emerald-200">Open provider ↗</div>
                </a>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-7 text-slate-400">
          ShuttleYa does not operate the transportation listed here and does not control live pricing, availability, vehicles, pickup instructions, payment, restrictions or cancellation terms. Confirm those details with the provider before booking.
        </div>
      </section>
    </main>
  );
}
