import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";

export const metadata: Metadata = {
  title: "Juneau Whale Watching Tours | Best Options By Port Stop",
  description:
    "Use DCC to sort the best Juneau whale watching options by cruise-port fit, boat style, and shore-day pressure before moving into execution.",
  alternates: { canonical: "/juneau/whale-watching-tours" },
};

const OPTIONS = [
  {
    title: "Most cruise travelers should start here",
    body: "Choose the cleaner wildlife-first lane when you want one strong whale decision without dragging glacier logistics into the same port block.",
  },
  {
    title: "Premium fit if the wildlife moment matters most",
    body: "Smaller-group formats are better when intimacy, viewing comfort, and a quieter boat matter more than saving the last few dollars.",
  },
  {
    title: "Budget fit when the spend ceiling is the real constraint",
    body: "Larger shared boats can still be the correct move if whale watching is the priority and premium feel is not the reason you are booking.",
  },
];

function JsonLdGraph() {
  const optionItems = [
    {
      name: "First-time Juneau whale lane",
      description: "Best fit for most cruise visitors who want one clean marine-first decision.",
      url: "https://www.lastfrontiershoreexcursions.com/juneau/whale-watching",
    },
    {
      name: "Whale watching vs. glacier tour decision lane",
      description: "Compare single-activity Auke Bay whale watching against combined Mendenhall Glacier and whale port-day blocks.",
      url: "https://www.lastfrontiershoreexcursions.com/decision/whale-watching-vs-glacier-tour",
    },
    {
      name: "Full Juneau cruise port excursion planner",
      description: "Filter Juneau excursions by cruise ship port-window duration.",
      url: "https://www.lastfrontiershoreexcursions.com/juneau/excursions-by-cruise-ship-time",
    },
  ];

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          buildWebPageJsonLd({
            path: "/juneau/whale-watching-tours",
            name: "Juneau Whale Watching Tours: Best Options by Port Stop",
            description:
              "DCC feeder page for Juneau whale-watching intent, narrowing cruise-port fit and boat style before downstream execution.",
            dateModified: "2026-10-25",
            isPartOfPath: "/juneau",
          }),
          buildBreadcrumbJsonLd([
            { name: "Juneau", item: "/juneau" },
            { name: "Juneau Whale Watching Tours", item: "/juneau/whale-watching-tours" },
          ]),
          buildCollectionPageJsonLd({
            path: "/juneau/whale-watching-tours",
            name: "Juneau whale-watching decision lanes",
            description:
              "Juneau whale-watching lanes for first-time, premium, and budget-sensitive cruise visitors.",
            items: optionItems,
          }),
        ],
      }}
    />
  );
}

export default function JuneauWhaleWatchingToursPage() {
  const primarySpecialistUrl = "https://www.lastfrontiershoreexcursions.com/juneau/whale-watching";
  const comboDecisionUrl =
    "https://www.lastfrontiershoreexcursions.com/decision/whale-watching-vs-glacier-tour";
  const portWindowUrl =
    "https://www.lastfrontiershoreexcursions.com/juneau/excursions-by-cruise-ship-time";

  return (
    <main className="min-h-screen bg-[#05070b] px-6 py-10 text-white md:py-14">
      <JsonLdGraph />
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-[2.2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(245,179,75,0.12),transparent_28%),linear-gradient(180deg,#0d1118_0%,#06080d_100%)] p-8 md:p-10">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#f5b34b]">Juneau whale command</p>
          <h1 className="mt-4 text-[clamp(2.8rem,8vw,5.8rem)] font-black uppercase leading-[0.9] tracking-[-0.05em]">
            Choose the correct
            <br />
            whale route first.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/72 md:text-lg">
            The Juneau whale decision is not whether to go. It is which format is correct for your stop, your budget, and how much room your day actually has.
          </p>
          <p className="mt-4 text-sm uppercase tracking-[0.18em] text-white/52">
            Avoid the common mistake: picking a whale tour before you know what kind of day you are trying to protect.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/juneau"
              className="rounded-full bg-[#f5b34b] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#f7bf6a]"
            >
              Open Juneau Port-Day Planner
            </Link>
            <Link
              href="/juneau/helicopter-tours"
              className="rounded-full border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/84 transition hover:bg-white/[0.06]"
            >
              Juneau helicopter corridor
            </Link>
          </div>
        </header>

        <section className="rounded-[1.9rem] border border-white/10 bg-[#0b1017] p-6 md:p-8">
          <div className="max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#f5b34b]">What this page does</div>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em] text-white">
              It removes the wrong whale options first.
            </h2>
            <p className="mt-3 text-base leading-8 text-white/72">
              Most people overcompare boats before they identify the correct whale format for the day they are trying to preserve.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {OPTIONS.map((option) => (
            <article key={option.title} className="rounded-[1.7rem] border border-white/10 bg-[#0b1017] p-6">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#f5b34b]">Decision lane</div>
              <h2 className="mt-4 text-xl font-black uppercase leading-[1.02] tracking-[-0.03em] text-white">
                {option.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/68">{option.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[1.9rem] border border-white/10 bg-[#0b1017] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] md:p-8 space-y-5">
          <div className="max-w-3xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#f5b34b]">
              Specialist &amp; Direct Execution Channels
            </div>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em] text-white">
              Compare Juneau whale watching on Last Frontier Shore Excursions or book direct
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/68">
              Once you have confirmed your ship&apos;s usable shore window (typically 3.5 to 4.5 hours door-to-door for single-activity Auke Bay whale watching, or 5.25+ hours for a whale + Mendenhall Glacier combination), use the owned specialist deep links or direct operator channels below.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={primarySpecialistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#f5b34b] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#07111d] transition hover:bg-[#f7bf6a]"
            >
              Juneau Whale Watching (Last Frontier Shore Excursions) ↗
            </a>
            <a
              href={comboDecisionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/84 transition hover:bg-white/[0.06]"
            >
              Whale Watching vs. Glacier Combo Guide ↗
            </a>
            <a
              href={portWindowUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/84 transition hover:bg-white/[0.06]"
            >
              Excursions by Cruise Ship Time ↗
            </a>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-6 text-white/70 space-y-2">
            <p>
              <strong>Ownership disclosure:</strong> <strong>Last Frontier Shore Excursions</strong> (<code>https://www.lastfrontiershoreexcursions.com</code>) is a DCC owned specialist site for Alaska shore excursions, whale watching, Mendenhall Glacier combinations, and port-day planning. Owned-site status never changes DCC&apos;s time-fit math or rankings.
            </p>
            <p>
              <strong>Direct operator &amp; regulatory references:</strong> You can also inspect direct operator schedules at{" "}
              <a
                href="https://allenmarinetours.com/juneau/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[#f5b34b]"
              >
                Allen Marine Tours (Juneau)
              </a>{" "}
              and review federal 100-yard humpback whale approach rules at{" "}
              <a
                href="https://www.fisheries.noaa.gov/alaska/marine-life-viewing-guidelines/alaska-humpback-whale-approach-regulations"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[#f5b34b]"
              >
                NOAA Fisheries Alaska
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
