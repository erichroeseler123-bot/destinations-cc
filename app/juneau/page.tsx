import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";
import { buildNetworkSatelliteHref } from "@/lib/dcc/contracts/networkSatellites";

const SOURCE_PAGE = "/juneau";

export const metadata: Metadata = {
  title: "Juneau Cruise-Port Decision | What to Book in Your Window",
  description:
    "Juneau is a clock, not a catalog. DCC sorts the cruise-port decision by your window and weather risk, then hands off to Juneau Flight Deck for booking.",
  alternates: { canonical: "/juneau" },
};

function flightDeckHref(opts: { action: string; cta: string; product?: string }): string {
  return buildNetworkSatelliteHref("juneauflightdeck", {
    sourcePage: SOURCE_PAGE,
    action: opts.action,
    cta: opts.cta,
    product: opts.product,
    routeTarget: "satellite",
    revenueStage: "intent",
  });
}

const FAQ = [
  {
    question: "What is the real Juneau cruise-port decision?",
    answer:
      "It is not which tour is best in the abstract. It is what you can safely fit inside your port window and what happens to the booking if Juneau weather cancels it.",
  },
  {
    question: "Is a glacier helicopter flight worth the risk?",
    answer:
      "It is the highest-payoff Juneau option and also the most weather-sensitive. Book it when your window has margin and you can accept a possible weather cancellation and refund.",
  },
  {
    question: "What is the lower-risk Juneau option?",
    answer:
      "Mendenhall Glacier and whale watching are far less likely to be scrubbed by weather, so they protect a short or tight port window better than a helicopter flight.",
  },
];

const LANES = [
  {
    eyebrow: "Highest payoff / highest weather risk",
    title: "Glacier & helicopter flights",
    body: "The signature Juneau memory, and the first thing weather cancels. Only the right call when your port window has real margin and you can absorb a possible scrub.",
    image: "/images/juneau/helicopter-glacier.png",
    alt: "Helicopter landed on a blue Alaskan glacier icefield near Juneau",
    href: "/juneau/helicopter-tours",
    cta: "Open the helicopter lane",
    internal: true,
  },
  {
    eyebrow: "Strong, reliable alternative",
    title: "Whale watching",
    body: "The wildlife-first lane runs in conditions that ground helicopters, which makes it the dependable choice when your day cannot absorb a cancellation.",
    image: "/images/juneau/whale-watching.png",
    alt: "Humpback whale breaching near a wildlife tour boat off Juneau",
    href: "/juneau/whale-watching-tours",
    cta: "Open the whale lane",
    internal: true,
  },
  {
    eyebrow: "Lowest-risk / most flexible",
    title: "Mendenhall Glacier",
    body: "Close to port, weather-tolerant, and easy to fit into a tight window. The safest default when you want a real glacier moment without betting the whole day on conditions.",
    image: "/images/juneau/mendenhall.png",
    alt: "Mendenhall Glacier and Nugget Falls beside a calm lake near Juneau",
    href: flightDeckHref({
      action: "open_juneau_mendenhall_lane",
      cta: "juneau-verdict-mendenhall",
      product: "mendenhall-glacier",
    }),
    cta: "Plan Mendenhall on Flight Deck",
    internal: false,
  },
];

function JsonLdGraph() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          buildWebPageJsonLd({
            path: "/juneau",
            name: "Juneau Cruise-Port Decision",
            description:
              "DCC verdict surface for the Juneau cruise-port decision, sorting options by port window and weather risk before handing off to Juneau Flight Deck.",
            dateModified: "2026-05-30",
            isPartOfPath: "/command",
          }),
          buildBreadcrumbJsonLd([
            { name: "Command", item: "/command" },
            { name: "Juneau", item: "/juneau" },
          ]),
          buildFaqJsonLd(FAQ),
        ],
      }}
    />
  );
}

export default function JuneauDecisionPage() {
  const planWindowHref = flightDeckHref({
    action: "open_juneau_port_window_planner",
    cta: "juneau-verdict-primary",
  });

  return (
    <main className="min-h-screen bg-[#05070b] px-6 py-10 text-white md:py-14">
      <JsonLdGraph />
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#0d1118]">
          <div className="relative h-64 w-full md:h-80">
            <Image
              src="/images/juneau/cruise-port.png"
              alt="Cruise ship docked at Juneau harbor with misty mountains behind"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 960px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,11,0.25)_0%,rgba(5,7,11,0.92)_100%)]" />
          </div>
          <div className="p-8 md:p-10">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#f5b34b]">Juneau command</p>
            <h1 className="mt-4 text-[clamp(2.6rem,7vw,5rem)] font-black uppercase leading-[0.9] tracking-[-0.05em]">
              Juneau is a clock,
              <br />
              not a catalog.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/72 md:text-lg">
              The Juneau decision is not which excursion is best. It is what you can safely fit inside your cruise-port window, and what happens to the booking if the weather turns.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={planWindowHref}
                rel="noopener"
                className="rounded-full bg-[#f5b34b] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#f7bf6a]"
              >
                Plan your port window on Flight Deck
              </a>
              <Link
                href="/juneau/whale-watching-tours"
                className="rounded-full border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/84 transition hover:bg-white/[0.06]"
              >
                See the reliable alternative
              </Link>
            </div>
          </div>
        </header>

        <section className="rounded-[1.9rem] border border-white/10 bg-[#0b1017] p-6 md:p-8">
          <div className="max-w-3xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#f5b34b]">The verdict</div>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em] text-white">
              Match the option to your window and your tolerance for weather risk.
            </h2>
            <p className="mt-3 text-base leading-8 text-white/72">
              Glacier helicopter flights are the high point and the first casualty of bad weather. Whale watching keeps running when helicopters are grounded. Mendenhall is the low-risk anchor that fits even a tight window. Decide in that order, then book.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {LANES.map((lane) => {
            const cardClass =
              "group flex flex-col overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#0b1017] transition hover:border-[#f5b34b]/45 hover:bg-[#0d141d]";
            const inner = (
              <>
                <div className="relative h-40 w-full">
                  <Image
                    src={lane.image}
                    alt={lane.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 320px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[#f5b34b]">{lane.eyebrow}</div>
                  <h3 className="mt-3 text-xl font-black uppercase leading-[1.02] tracking-[-0.03em] text-white">
                    {lane.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-7 text-white/68">{lane.body}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#f5b34b]">
                    {lane.cta}
                    <span aria-hidden="true" className="transition group-hover:translate-x-0.5">
                      &rarr;
                    </span>
                  </span>
                </div>
              </>
            );
            return lane.internal ? (
              <Link key={lane.title} href={lane.href} className={cardClass}>
                {inner}
              </Link>
            ) : (
              <a key={lane.title} href={lane.href} rel="noopener" className={cardClass}>
                {inner}
              </a>
            );
          })}
        </section>

        <section className="rounded-[1.9rem] border border-[#f5b34b]/25 bg-[#120f08] p-6 md:p-8">
          <div className="max-w-3xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#f5b34b]">Weather risk</div>
            <h2 className="mt-3 text-2xl font-black uppercase tracking-[-0.03em] text-white">
              Book the cancellation policy, not just the tour.
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/72">
              Juneau weather scrubs flightseeing more often than travelers expect, and the ship will not wait. Reserve the option whose cancellation terms protect your port window, then add the higher-risk flight only if your day has the margin to absorb a scrub.
            </p>
            <a
              href={planWindowHref}
              rel="noopener"
              className="mt-5 inline-flex rounded-full bg-[#f5b34b] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#f7bf6a]"
            >
              Check window-safe options on Flight Deck
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
