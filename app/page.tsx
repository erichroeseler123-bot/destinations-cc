import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { SITE_IDENTITY } from "@/src/data/site-identity";
import AskDccEntry from "@/app/components/AskDccEntry";
import JuneauFlightDeckHostPage from "@/app/juneau-flight-deck/page";
import WisconsinDellsBrandPage from "@/app/wisconsin-dells-brand/page";

export const dynamic = "force-dynamic";

const JFD_HOSTS = new Set(["juneauflightdeck.com", "www.juneauflightdeck.com"]);
const DELLS_HOSTS = new Set(["welcometothedells.com", "www.welcometothedells.com"]);

async function requestHost() {
  const h = await headers();
  return (h.get("x-forwarded-host") || h.get("host") || "").split(":")[0].toLowerCase();
}

export async function generateMetadata(): Promise<Metadata> {
  const host = await requestHost();

  if (JFD_HOSTS.has(host)) {
    return {
      title: "Juneau Flight Deck | Glacier Flights for Cruise Visitors",
      description:
        "A focused Juneau flightseeing storefront for cruise visitors comparing helicopter glacier flights, landing-style experiences, ship timing, and weather backup planning.",
      alternates: { canonical: "https://juneauflightdeck.com/" },
      openGraph: {
        title: "Juneau Flight Deck",
        description: "Compare Juneau glacier-flight formats after deciding flying is the right use of your port day.",
        url: "https://juneauflightdeck.com/",
        type: "website",
      },
    };
  }

  if (DELLS_HOSTS.has(host)) {
    return {
      title: "Welcome to the Dells | Wisconsin Dells Trip Ideas for Groups",
      description:
        "A simple Wisconsin Dells starting point for families, adults trips, and groups: choose the shape of the trip first, then open the attraction or operator that fits.",
      alternates: { canonical: "https://welcometothedells.com/" },
      openGraph: {
        title: "Welcome to the Dells",
        description: "Wisconsin Dells trip ideas for families, adults trips, and groups without turning the weekend into a giant checklist.",
        url: "https://welcometothedells.com/",
        type: "website",
      },
    };
  }

  return {
    title: SITE_IDENTITY.homepageTitle,
    description: SITE_IDENTITY.homepageDescription,
    alternates: { canonical: "/" },
    openGraph: {
      title: SITE_IDENTITY.name,
      description: SITE_IDENTITY.homepageDescription,
      url: SITE_IDENTITY.siteUrl,
      type: "website",
    },
  };
}

const DECISIONS = [
  {
    eyebrow: "Cruise ports",
    title: "What can you realistically do before the ship leaves?",
    body: "Start with port time, travel time, weather exposure, return margin, and the backup plan—not a giant list of excursions.",
    href: "/ports",
  },
  {
    eyebrow: "Tours",
    title: "Which experience actually fits your group?",
    body: "Compare duration, mobility, pickup, weather, intensity, and what you would regret missing before opening a booking surface.",
    href: "/tours",
  },
  {
    eyebrow: "Transportation",
    title: "Drive, rideshare, shuttle, or private transfer?",
    body: "The right answer changes with luggage, group size, road conditions, parking, venue exits, and how expensive failure would be.",
    href: "/transportation",
  },
];

const NETWORK = [
  {
    label: "New Orleans",
    body: "Choose tours and experiences after the decision is clear.",
    href: "https://www.welcometoneworleanstours.com",
  },
  {
    label: "Juneau Flight Deck",
    body: "Compare Juneau glacier-flight and weather-backup choices.",
    href: "https://juneauflightdeck.com",
  },
  {
    label: "GoSno",
    body: "Book Colorado private airport and resort transportation.",
    href: "https://gosno.co",
  },
  {
    label: "Cruise Promenade",
    body: "Turn cruise decisions into a shared group plan.",
    href: "https://cruisepromenade.com",
  },
];

function DccHomePage() {
  return (
    <main className="min-h-screen bg-[#090d13] text-slate-100">
      <section className="mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-5 py-16 sm:px-8">
        <div className="max-w-4xl">
          <p className="mb-5 text-sm font-black uppercase tracking-[0.24em] text-cyan-300">
            Destination Command Center · Travel intelligence
          </p>
          <h1 className="text-5xl font-black tracking-[-0.045em] text-white sm:text-6xl md:text-7xl">
            What are you trying to figure out?
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
            Ask the trip question in plain English. DCC traces the decision graph, explains the tradeoff, shows the research it used, and sends you to the right specialist only when the decision is ready.
          </p>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
            Ports, timing, tours, transportation, weather, group constraints, backup plans, and what to do next—without starting from another giant list.
          </p>
        </div>

        <div className="mt-10 max-w-3xl">
          <AskDccEntry />
        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-400">
          <span className="rounded-full border border-slate-700 px-3 py-2">Cruise-port timing</span>
          <span className="rounded-full border border-slate-700 px-3 py-2">Tour comparisons</span>
          <span className="rounded-full border border-slate-700 px-3 py-2">Transportation decisions</span>
          <span className="rounded-full border border-slate-700 px-3 py-2">Weather & backup plans</span>
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/ask" className="inline-flex w-fit rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-[#061017] transition hover:bg-cyan-200">
            Open Ask DCC →
          </Link>
          <Link href="/guides" className="inline-flex w-fit rounded-xl border border-cyan-800 bg-cyan-950/30 px-5 py-3 text-sm font-black text-cyan-100 transition hover:border-cyan-500 hover:bg-cyan-950/60">
            Browse the decision-guide library →
          </Link>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-[#0d131d]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">Start with the decision</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Fewer lists. Better answers.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-400">DCC is the research layer before the transaction. The answer should be useful even if you never click anything else.</p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {DECISIONS.map((item) => (
              <Link key={item.title} href={item.href} className="rounded-3xl border border-slate-800 bg-[#0a0f17] p-6 transition hover:-translate-y-1 hover:border-cyan-700">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">{item.eyebrow}</p>
                <h3 className="mt-3 text-xl font-black leading-7 text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{item.body}</p>
                <span className="mt-6 inline-block text-sm font-bold text-white">Explore the decision →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">How the network works</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Understand here. Choose there. Book where it belongs.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">Destination Command Center is deliberately not another booking marketplace. Ask DCC sits above the same governed research network: it can explain the decision, but it cannot silently invent a different commercial owner.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {NETWORK.map((item) => (
                <a key={item.label} href={item.href} className="rounded-2xl border border-slate-800 p-5 transition hover:border-slate-600">
                  <strong className="text-white">{item.label}</strong>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
                  <span className="mt-3 inline-block text-xs font-bold uppercase tracking-wider text-slate-300">Specialist next step ↗</span>
                </a>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-800 bg-[#0d131d] p-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">The DCC standard</p>
            <h2 className="mt-3 text-2xl font-black text-white">Every useful answer should tell you:</h2>
            <ol className="mt-6 space-y-5 text-sm leading-6 text-slate-300">
              <li><strong className="text-white">1. What matters.</strong> The constraints that change the decision.</li>
              <li><strong className="text-white">2. What the tradeoff is.</strong> Time, cost, weather, mobility, risk, or convenience.</li>
              <li><strong className="text-white">3. What we know.</strong> The DCC research nodes supporting the answer.</li>
              <li><strong className="text-white">4. What could change.</strong> Weather, traffic, availability, port calls, provider terms, or seasonal conditions.</li>
              <li><strong className="text-white">5. What to do next.</strong> A governed useful action—not another page of browsing.</li>
            </ol>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default async function HomePage() {
  const host = await requestHost();
  if (JFD_HOSTS.has(host)) return <JuneauFlightDeckHostPage />;
  if (DELLS_HOSTS.has(host)) return <WisconsinDellsBrandPage />;
  return <DccHomePage />;
}
