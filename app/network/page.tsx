import Link from "next/link";
import type { Metadata } from "next";
import JsonLd from "@/app/components/dcc/JsonLd";
import {
  buildDccOrganizationJsonLd,
  buildDccWebSiteJsonLd,
  buildNetworkServiceJsonLd,
  DCC_ORGANIZATION_ID,
  DCC_WEBSITE_ID,
} from "@/lib/dcc/networkEntityJsonLd";

const NETWORK_DOMAINS = [
  {
    domain: "partyatredrocks.com",
    href: "https://www.partyatredrocks.com",
    role: "Operator execution",
    note: "Red Rocks transportation execution for travelers who have decided to book.",
  },
  {
    domain: "shuttleya.com",
    href: "https://shuttleya.com",
    role: "Operator execution",
    note: "Shuttle and route-specific transportation execution, including Argo and Red Rocks shuttle surfaces.",
  },
  {
    domain: "welcometotheswamp.com",
    href: "https://welcometotheswamp.com",
    role: "Satellite decision surface",
    note: "New Orleans swamp-tour narrowing before a traveler moves into a booking fit.",
  },
  {
    domain: "welcometoneworleanstours.com",
    href: "https://welcometoneworleanstours.com",
    role: "Satellite decision surface",
    note: "New Orleans tour narrowing for walking, ghost, history, food, and first-time visitor choices.",
  },
  {
    domain: "juneauflightdeck.com",
    href: "https://juneauflightdeck.com",
    role: "Satellite decision surface",
    note: "Juneau excursion and flightseeing decisions for cruise and independent travelers.",
  },
  {
    domain: "welcometoalaskatours.com",
    href: "https://welcometoalaskatours.com",
    role: "Satellite decision surface",
    note: "Alaska shore-excursion planning and port decision support.",
  },
  {
    domain: "lastfrontiershoreexcursions.com",
    href: "https://lastfrontiershoreexcursions.com",
    role: "Satellite decision surface",
    note: "Alaska shore-excursion decision path for travelers comparing port-day options.",
  },
  {
    domain: "feastlyspread.com",
    href: "https://feastlyspread.com",
    role: "Experimental satellite",
    note: "Experimental group-dining and private-chef decision surface.",
  },
] as const;

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Destination Command Center Network",
  description:
    "How Destination Command Center, satellite decision sites, and operator execution sites fit together as one governed travel decision network.",
  alternates: { canonical: "/network" },
};

export default function NetworkPage() {
  const itemList = {
    "@type": "ItemList",
    "@id": "https://www.destinationcommandcenter.com/network#network-domains",
    name: "Destination Command Center network domains",
    itemListElement: NETWORK_DOMAINS.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "WebSite",
        name: item.domain,
        url: item.href,
        description: item.note,
        isPartOf: { "@id": DCC_WEBSITE_ID },
      },
    })),
  };

  const service = buildNetworkServiceJsonLd("https://www.destinationcommandcenter.com", {
    id: "https://www.destinationcommandcenter.com/network#service",
    name: "Governed travel decision and execution routing network",
    description:
      "Destination Command Center decides, satellite surfaces narrow, and operator surfaces execute travel actions where a traveler is ready to move.",
    providerId: DCC_ORGANIZATION_ID,
  });

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [buildDccOrganizationJsonLd(), buildDccWebSiteJsonLd(), service, itemList],
        }}
      />

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8 md:py-12">
        <section className="rounded-[2rem] border border-white/10 bg-[#0b1017] p-6 md:p-8">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f5b34b]">
            DCC network
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-black uppercase tracking-[-0.04em] md:text-6xl">
            Destination Command Center Network
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/72 md:text-lg">
            DCC is the governed decision layer. It decides what problem a traveler is trying to solve, routes them into a narrower satellite surface when the choice needs more local shape, and sends ready travelers to an operator surface when execution is the next step.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["DCC decides", "The main DCC site frames the travel decision, removes bad-fit options, and preserves context."],
            ["Satellites narrow", "Focused sites handle a city, tour type, or route when the traveler needs a smaller decision surface."],
            ["Operators execute", "Execution sites handle the booking, route, or operational task when the choice is ready."],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-black uppercase tracking-[0.08em]">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/68">{copy}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-[#0b1017] p-6 md:p-8">
          <h2 className="text-2xl font-black uppercase tracking-[-0.03em]">Active domains</h2>
          <div className="mt-5 grid gap-3">
            {NETWORK_DOMAINS.map((item) => (
              <a
                key={item.domain}
                href={item.href}
                className="grid gap-2 rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4 transition hover:border-[#f5b34b]/45 hover:bg-white/[0.06] md:grid-cols-[220px_180px_1fr]"
              >
                <span className="font-black text-white">{item.domain}</span>
                <span className="text-sm font-semibold text-[#f5b34b]">{item.role}</span>
                <span className="text-sm leading-6 text-white/68">{item.note}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-[#0b1017] p-6 md:p-8">
          <h2 className="text-2xl font-black uppercase tracking-[-0.03em]">Useful handoffs</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Link href="/red-rocks-transportation" className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06]">
              Red Rocks decision hub to Party at Red Rocks and Shuttleya
            </Link>
            <Link href="/mighty-argo-shuttle" className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06]">
              Argo shuttle hub to Shuttleya
            </Link>
            <Link href="/juneau/best-excursion-in-juneau-alaska" className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06]">
              Juneau and Alaska pages to WTA and Juneau Flight Deck
            </Link>
            <Link href="/new-orleans/best-swamp-tour" className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06]">
              New Orleans swamp pages to Welcome to the Swamp
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
