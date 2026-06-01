import Link from "next/link";
import type { Metadata } from "next";
import { SITE_IDENTITY } from "@/src/data/site-identity";
import JsonLd from "@/app/components/dcc/JsonLd";
import {
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
} from "@/lib/dcc/jsonld";
import { getHomepageEntrySurfaces } from "@/src/data/entry-surfaces";
import type { EntrySurface } from "@/src/data/entry-surfaces-types";
import {
  NETWORK_SATELLITES,
  buildNetworkSatelliteHref,
  type NetworkSatelliteId,
} from "@/lib/dcc/contracts/networkSatellites";

const SECTION_PANEL_CLASS =
  "rounded-[2rem] border border-white/10 bg-[#0b1017] p-6 md:p-8";

// The four layers of the stack, top (traveler-facing) to bottom (fulfillment).
const STACK_LAYERS = [
  {
    tag: "Layer 01",
    title: "Satellite sites",
    body: "Public storefronts built around one specific traveler intent. They are the front doors people actually land on.",
  },
  {
    tag: "Layer 02",
    title: "Destination Command Center",
    body: "The decision and routing layer. It classifies the situation, compresses it into one confident next move, then routes that move through a tracked handoff.",
  },
  {
    tag: "Layer 03",
    title: "Earth OS",
    body: "The place and corridor intelligence underneath. Timing windows, route pressure, and local context that make a decision correct instead of generic.",
  },
  {
    tag: "Layer 04",
    title: "Fulfillment",
    body: "Operators, GetYourGuide, Viator, Rezdy, FareHarbor, lead forms, and owned checkout. DCC owns the decision, route, and telemetry, not the final inventory.",
  },
] as const;

// Intent-based satellite links. Each one is a real accepted decision, not a directory entry.
const SATELLITE_INTENTS: Array<{
  id: NetworkSatelliteId;
  intentLabel: string;
  action: string;
  cta: string;
}> = [
  {
    id: "partyatredrocks",
    intentLabel: "Getting to and from a Red Rocks show",
    action: "open_red_rocks_transport_lane",
    cta: "homepage-network-partyatredrocks",
  },
  {
    id: "juneauflightdeck",
    intentLabel: "Booking a Juneau excursion inside a port window",
    action: "open_juneau_port_excursion_lane",
    cta: "homepage-network-juneauflightdeck",
  },
  {
    id: "welcometotheswamp",
    intentLabel: "Choosing the right New Orleans swamp tour",
    action: "open_new_orleans_swamp_lane",
    cta: "homepage-network-welcometotheswamp",
  },
  {
    id: "gosno",
    intentLabel: "Getting from Denver into the Colorado mountains",
    action: "open_colorado_mountain_transfer_lane",
    cta: "homepage-network-gosno",
  },
];

export const dynamic = "force-static";

export const metadata: Metadata = {
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

function getIntentLabel(entry: EntrySurface) {
  switch (entry.intent) {
    case "transport":
      return "This is the correct transport lane";
    case "tours":
      return "This is the correct tour lane";
    case "activity":
      return "This is the correct activity lane";
    default:
      return "This is the correct lane";
  }
}

function getEntrySummary(entry: EntrySurface) {
  switch (entry.intent) {
    case "transport":
      return "Use this when getting there is the real problem and the wrong route will break the plan.";
    case "tours":
      return "Use this when a generic list will slow you down and the right route should be obvious first.";
    case "activity":
      return "Use this when the destination is already clear and the activity decision is what still needs to be solved.";
    default:
      return "Use this when the situation is mixed and the wrong first move will create unnecessary loops.";
  }
}

export default function HomePage() {
  const homepageEntries = getHomepageEntrySurfaces().slice(0, 7);
  const primaryEntries = homepageEntries.slice(0, 4);
  const secondaryEntries = homepageEntries.slice(4);

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [buildOrganizationJsonLd(), buildWebsiteJsonLd()],
        }}
      />

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8 md:space-y-10 md:py-12">
        <section className="rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(245,179,75,0.12),transparent_26%),linear-gradient(180deg,#0d1118_0%,#06080d_100%)] px-6 py-8 md:px-10 md:py-12">
          <div className="max-w-4xl">
            <div className="text-[11px] font-black uppercase tracking-[0.32em] text-[#f5b34b]">
              Destination Command Center
            </div>
            <h1 className="mt-4 text-[clamp(2.6rem,8vw,5.5rem)] font-black uppercase leading-[0.9] tracking-[-0.05em] text-white text-balance">
              We turn travel uncertainty into a tracked next step.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/72 md:text-lg">
              A blog explains. A directory lists. We decide. Pick your situation
              and we route you to the correct move, then hand you off to the
              right place to book it.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/network"
                className="inline-flex items-center rounded-full border border-[#f5b34b]/40 bg-[#f5b34b] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#07111d] transition hover:bg-[#f7bf6a]"
              >
                How the network works
              </Link>
              <Link
                href="/operators"
                className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:border-[#f5b34b]/40 hover:bg-white/[0.07]"
              >
                For operators
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {primaryEntries.map((entry) => (
              <Link
                key={entry.id}
                href={entry.path}
                className="group rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#f5b34b]/45 hover:bg-white/[0.06]"
              >
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f5b34b]">
                  {entry.label}
                </div>
                <div className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-white/88">
                  {getIntentLabel(entry)}
                </div>
                <p className="mt-3 max-w-sm text-sm leading-7 text-white/66">
                  {getEntrySummary(entry)}
                </p>
                <div className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-white/82 transition group-hover:text-white">
                  Find the right option
                </div>
              </Link>
            ))}
          </div>

          {secondaryEntries.length ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {secondaryEntries.map((entry) => (
                <Link
                  key={entry.id}
                  href={entry.path}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white/82 transition hover:border-[#f5b34b]/40 hover:bg-white/[0.06]"
                >
                  {entry.label}
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <section className={SECTION_PANEL_CLASS}>
          <div className="max-w-2xl">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f5b34b]">
              The stack
            </div>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em] text-white text-balance">
              One decision layer behind many front doors.
            </h2>
            <p className="mt-3 text-base leading-8 text-white/72">
              Travelers see a satellite site built for their exact situation.
              Underneath, the same decision and routing layer is doing the work.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {STACK_LAYERS.map((layer) => (
              <div
                key={layer.title}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f5b34b]">
                  {layer.tag}
                </div>
                <div className="mt-3 text-lg font-bold tracking-[-0.01em] text-white">
                  {layer.title}
                </div>
                <p className="mt-2 text-sm leading-7 text-white/68">
                  {layer.body}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/network"
            className="mt-5 inline-flex text-xs font-black uppercase tracking-[0.18em] text-[#f5b34b] transition hover:text-[#f7bf6a]"
          >
            See how a decision becomes a tracked handoff
          </Link>
        </section>

        <section className={SECTION_PANEL_CLASS}>
          <div className="max-w-2xl">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f5b34b]">
              Active corridors
            </div>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em] text-white text-balance">
              Find the front door for your decision.
            </h2>
            <p className="mt-3 text-base leading-8 text-white/72">
              Each link routes you into the satellite that owns that lane, with
              your context carried along so you do not start over.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {SATELLITE_INTENTS.map((intent) => {
              const satellite = NETWORK_SATELLITES[intent.id];
              const href = buildNetworkSatelliteHref(intent.id, {
                sourcePage: "/",
                action: intent.action,
                cta: intent.cta,
                routeTarget: "satellite",
                revenueStage: "intent",
              });
              return (
                <a
                  key={intent.id}
                  href={href}
                  rel="noopener"
                  className="group rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#f5b34b]/45 hover:bg-white/[0.06]"
                >
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">
                    {intent.intentLabel}
                  </div>
                  <div className="mt-3 text-lg font-bold tracking-[-0.01em] text-white">
                    {satellite.name}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-white/66">
                    {satellite.decisionCompressed}
                  </p>
                  <div className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-[#f5b34b] transition group-hover:text-[#f7bf6a]">
                    Enter this lane
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <Link
            href="/red-rocks-transportation"
            className="rounded-[1.4rem] border border-[#f5b34b]/25 bg-[#f5b34b] px-5 py-5 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#f7bf6a]"
          >
            Open primary corridor
          </Link>
          <Link
            href="/juneau/whale-watching-tours"
            className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-5 py-5 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:border-[#f5b34b]/40 hover:bg-white/[0.05]"
          >
            Open Juneau corridor
          </Link>
          <Link
            href="/network"
            className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-5 py-5 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:border-[#f5b34b]/40 hover:bg-white/[0.05]"
          >
            How it works
          </Link>
        </section>
      </div>
    </main>
  );
}
