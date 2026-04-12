import { randomUUID } from "crypto";
import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";
import { buildWtaProductWidgetUrl } from "@/lib/wta/embed";

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
      url: "/juneau/whale-watching?topic=whale-watching&port=juneau&context=first-time",
    },
    {
      name: "Premium wildlife lane",
      description: "Smaller-group whale options when intimacy and wildlife focus matter more than lowest price.",
      url: "/juneau/whale-watching?topic=whale-watching&port=juneau&context=premium",
    },
    {
      name: "Budget whale lane",
      description: "Larger shared whale options when spend ceiling matters more than premium feel.",
      url: "/juneau/whale-watching?topic=whale-watching&port=juneau&context=budget",
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
            dateModified: "2026-04-10",
            isPartOfPath: "/command",
          }),
          buildBreadcrumbJsonLd([
            { name: "Command", item: "/command" },
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
  const featuredWidgetHref = buildWtaProductWidgetUrl({
    company: "alaska-galore-juneau-whale-watching",
    item: "585907",
    attribution: {
      handoffId: randomUUID(),
      source: "dcc",
      sourceSlug: "dcc-juneau-whale-embed",
      sourcePage: "/juneau/whale-watching-tours",
      topicSlug: "whale-watching",
      portSlug: "juneau-alaska",
      productSlug: "outback-experience-whale-watch",
      returnPath: "/juneau/whale-watching-tours",
      embedDomain: "destinationcommandcenter.com",
      embedPath: "/juneau/whale-watching-tours",
      widgetPlacement: "inline-primary",
      embedId: "juneau-whale-inline-primary",
    },
  });

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
              href="/juneau/helicopter-tours"
              className="rounded-full bg-[#f5b34b] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#f7bf6a]"
            >
              Juneau helicopter corridor
            </Link>
            <a
              href={featuredWidgetHref}
              className="rounded-full border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/84 transition hover:bg-white/[0.06]"
            >
              Open whale execution
            </a>
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

        <section className="rounded-[1.9rem] border border-white/10 bg-[#0b1017] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] md:p-8">
          <div className="max-w-3xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#f5b34b]">Contained action block</div>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em] text-white">
              One real Juneau whale option, loaded directly inside the page
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/68">
              This is the execution surface. It keeps the traveler inside the correct product instead of sending them back into a generic marketplace loop.
            </p>
          </div>
          <div className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
            <iframe
              src={featuredWidgetHref}
              title="Juneau whale watching widget"
              loading="lazy"
              className="block h-[980px] w-full bg-white"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={featuredWidgetHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/84 transition hover:bg-white/[0.06]"
            >
              Open whale widget in a new tab
            </a>
            <p className="max-w-2xl text-sm leading-7 text-white/52">
              Same attribution contract as the Juneau helicopter lane. That means whale and helicopter performance can be compared by corridor, placement, and downstream action without guessing.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
