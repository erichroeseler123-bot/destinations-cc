import type { Metadata } from "next";
import Link from "next/link";

const ORIGIN = "https://www.destinationcommandcenter.com";
const VIBE_ORIGIN = "https://vibearoundtown.com";

type SearchParams = Record<string, string | string[] | undefined>;

type BridgeGuide = {
  slug: string;
  label: string;
  title: string;
  body: string;
};

const BRIDGE_GUIDES: BridgeGuide[] = [
  {
    slug: "independent-cruise-port-driver-vs-bus-tour",
    label: "Choose the format",
    title: "Private local driver or bus tour?",
    body: "Decide whether flexibility and one local person fit your group better than a fixed group excursion.",
  },
  {
    slug: "what-can-you-do-in-an-8-hour-cruise-port-day",
    label: "Protect the ship clock",
    title: "What actually fits in your port day?",
    body: "Work backward from all-aboard time before deciding how ambitious the day should be.",
  },
  {
    slug: "can-you-do-two-excursions-in-one-cruise-port-day",
    label: "Avoid overpacking",
    title: "Can two activities really fit?",
    body: "Check transfers, delays, and return margin before turning a port day into a chain of timed commitments.",
  },
  {
    slug: "when-is-it-better-not-to-book-a-cruise-excursion",
    label: "Keep it flexible",
    title: "When should you skip a formal excursion?",
    body: "Some groups are better served by a flexible local day than another scheduled product.",
  },
  {
    slug: "should-a-cruise-group-split-up-for-different-excursions",
    label: "Coordinate the group",
    title: "Should your cruise group split up?",
    body: "Let people choose different experiences while protecting the shared times that actually matter.",
  },
];

export const metadata: Metadata = {
  title: "Vibe Around Cruise Port Decision Center | Destination Command Center",
  description:
    "A pre-booking research bridge for Vibe Around travelers who want to understand the port day before choosing a local driver.",
  alternates: { canonical: `${ORIGIN}/vibe-around` },
};

function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function buildContextQuery(params: SearchParams) {
  const query = new URLSearchParams();
  query.set("from", "vibe");

  for (const key of ["island", "cruiseCallId", "groupSize", "shipName"] as const) {
    const value = one(params[key]);
    if (value) query.set(key, value);
  }

  return query;
}

function buildVibeReturnHref(params: SearchParams) {
  const query = new URLSearchParams();
  for (const key of ["island", "cruiseCallId", "groupSize", "shipName"] as const) {
    const value = one(params[key]);
    if (value) query.set(key, value);
  }

  const suffix = query.toString();
  return suffix ? `${VIBE_ORIGIN}/search?${suffix}` : `${VIBE_ORIGIN}/`;
}

export default async function VibeAroundDecisionHub({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const contextQuery = buildContextQuery(params);
  const vibeReturnHref = buildVibeReturnHref(params);
  const island = one(params.island);
  const groupSize = one(params.groupSize);
  const shipName = one(params.shipName);

  const contextBits = [shipName, island, groupSize ? `${groupSize} guests` : undefined].filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${ORIGIN}/vibe-around#collection`,
        name: "Vibe Around cruise port decision center",
        description: "Research questions to answer before choosing a local cruise-port driver.",
        url: `${ORIGIN}/vibe-around`,
        isPartOf: { "@id": `${ORIGIN}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Destination Command Center", item: `${ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: "Vibe Around Decision Center", item: `${ORIGIN}/vibe-around` },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#090d13] text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <nav className="mb-10 text-sm text-slate-400" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white">DCC</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-300">Vibe Around Decision Center</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <header>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Research before you pick the person</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">
              Figure out the port day. Then go back and pick your local driver.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              Vibe Around is intentionally flexible. You do not need a rigid itinerary before reserving a driver. This page is for the questions worth settling first: how much fits, how fixed the day should be, whether your group should split up, and what kind of experience you actually want.
            </p>
          </header>

          <aside className="rounded-3xl border border-emerald-900/70 bg-[#0d1815] p-6 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Your Vibe handoff</p>
            <h2 className="mt-3 text-2xl font-black text-white">Research here. Act there.</h2>
            {contextBits.length > 0 && (
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Context carried from Vibe: <strong className="text-white">{contextBits.join(" · ")}</strong>
              </p>
            )}
            <p className="mt-4 text-sm leading-6 text-slate-400">
              When the decision is clear, this return path takes you back to Vibe Around instead of restarting the trip search.
            </p>
            <a
              href={vibeReturnHref}
              className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-200"
            >
              I’m ready — show me local drivers ↗
            </a>
          </aside>
        </div>

        <section className="mt-14">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Choose the uncertainty</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">What do you need to figure out before choosing a driver?</h2>
          <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {BRIDGE_GUIDES.map((guide) => {
              const href = `/guides/${guide.slug}?${contextQuery.toString()}`;
              return (
                <Link
                  key={guide.slug}
                  href={href}
                  className="rounded-3xl border border-slate-800 bg-[#0d131d] p-6 transition hover:-translate-y-1 hover:border-cyan-800"
                >
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">{guide.label}</p>
                  <h3 className="mt-3 text-xl font-black leading-7 text-white">{guide.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{guide.body}</p>
                  <span className="mt-5 inline-block text-sm font-bold text-cyan-200">Work through this decision →</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-slate-800 bg-[#0d131d] p-7 sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">The intentional loop</p>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            {["Vibe identifies the cruise visit", "DCC resolves the uncertainty", "DCC returns the traveler with context", "Vibe shows the people who can do the day"].map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-800 bg-[#090d13] p-5">
                <span className="text-xs font-black text-cyan-300">0{index + 1}</span>
                <p className="mt-3 text-sm font-bold leading-6 text-white">{step}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
