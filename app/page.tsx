import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import NewOrleansToursPage from "@/app/new-orleans/tours/page";
import { SITE_IDENTITY } from "@/src/data/site-identity";
import JsonLd from "@/app/components/dcc/JsonLd";
import {
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
} from "@/lib/dcc/jsonld";

const SIGNAL_CHIPS = [
  "SYS_OK",
  "GYG_READY",
  "VIATOR_BLOCKED",
  "ROUTES_VERIFIED",
  "404_GUARDED",
];

const COMMAND_LANES = [
  {
    href: "/cruise-ports/cozumel",
    label: "CRUISE PORT ROUTING",
    title: "Shore-excursion decisions without the vendor fog.",
    copy:
      "Exact provider inventory. DCC detail routes. Availability checks where they belong.",
    cta: "View Cruise Ports",
  },
  {
    href: "/network",
    label: "TRANSPORT ROUTING",
    title: "The correct ride path before the checkout.",
    copy:
      "Airport, venue, mountain, and event movement sorted by real execution constraints.",
    cta: "View Network",
  },
  {
    href: "/tours",
    label: "TOUR DECISION SURFACE",
    title: "Local options compressed into usable choices.",
    copy: "Cards stay human. Provider links stay exact. Bad exits stay blocked.",
    cta: "View Tour Markets",
  },
  {
    href: "/command",
    label: "COMPLIANCE + GOVERNANCE",
    title: "The system knows when a market is not ready.",
    copy:
      "Missing inventory, fake links, broken routes, and blocked providers fail the gate.",
    cta: "View Governance",
  },
];

const STATUS_PANELS = [
  {
    label: "GETYOURGUIDE REFERENCE MARKETS",
    value: "5 live markets",
    copy:
      "Port Canaveral, PortMiami, Nassau, Port Everglades, and Cozumel now match the reference pattern.",
  },
  {
    label: "EXPANSION QUEUE",
    value: "7 candidates staged",
    copy:
      "Key West, St. Thomas, San Juan, Costa Maya, Roatan, Belize City, and Grand Cayman are queued behind the compliance gate.",
  },
];

const SECTION_PANEL_CLASS =
  "rounded-[1.4rem] border border-[#3b4b63]/45 bg-[#07111d]/84 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.32)] md:p-7";

export const dynamic = "force-dynamic";

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

function isWelcomeToNewOrleansToursHost(host: string) {
  const normalized = host.toLowerCase().split(":")[0] || "";
  return normalized === "welcometoneworleanstours.com" || normalized === "www.welcometoneworleanstours.com";
}

export default async function HomePage() {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host") ||
    "";

  if (isWelcomeToNewOrleansToursHost(host)) {
    return <NewOrleansToursPage />;
  }

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [buildOrganizationJsonLd(), buildWebsiteJsonLd()],
        }}
      />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:space-y-8 md:px-6 md:py-10">
        <section className="relative overflow-hidden rounded-[1.7rem] border border-[#28486e]/70 bg-[linear-gradient(180deg,rgba(8,18,31,0.98)_0%,rgba(4,8,14,0.98)_100%)] px-5 py-6 shadow-[0_28px_90px_rgba(0,0,0,0.42)] md:px-8 md:py-9">
          <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(55,108,168,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(55,108,168,0.18)_1px,transparent_1px)] [background-size:44px_44px]" />
          <div className="absolute right-0 top-0 h-44 w-44 bg-[#255dff]/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-28 w-44 bg-[#f27a1a]/10 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.32em] text-[#f27a1a]">
                DESTINATION COMMAND CENTER
              </div>
              <h1 className="mt-4 max-w-4xl text-[clamp(2.85rem,8vw,6.7rem)] font-black leading-[0.9] tracking-[-0.055em] text-white">
                Travel decisions, routed correctly.
              </h1>
              <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-[#c3cedc] md:text-lg">
                Choose the situation. DCC routes the next step.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/command"
                  className="rounded-full border border-[#f27a1a]/50 bg-[#f27a1a] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#07111d] shadow-[0_16px_38px_rgba(242,122,26,0.2)] transition hover:bg-[#ff9a3c]"
                >
                  Launch Console
                </Link>
                <Link
                  href="/network"
                  className="rounded-full border border-[#416bff]/45 bg-[#0a1730] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#dbe6ff] transition hover:border-[#6f8fff] hover:bg-[#11244a]"
                >
                  View Routing Map
                </Link>
              </div>
            </div>

            <aside className="rounded-[1.25rem] border border-[#3b4b63]/60 bg-[#050b13]/72 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.26em] text-[#7f92ad]">
                SIGNAL STATE
              </div>
              <div className="mt-4 grid gap-2">
                {SIGNAL_CHIPS.map((chip) => (
                  <div
                    key={chip}
                    className="flex items-center justify-between rounded-xl border border-[#203954] bg-[#071522] px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#d7e3f5]"
                  >
                    <span>{chip}</span>
                    <span className="h-2 w-2 rounded-full bg-[#f27a1a]" />
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {COMMAND_LANES.map((lane) => (
            <Link
              key={lane.label}
              href={lane.href}
              className="group relative overflow-hidden rounded-[1.35rem] border border-[#263c59] bg-[#07111d] p-5 transition hover:border-[#416bff]/80 hover:bg-[#0a1828]"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#416bff] via-[#f27a1a] to-transparent opacity-70" />
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[#f27a1a]">
                {lane.label}
              </div>
              <h2 className="mt-3 max-w-xl text-xl font-black leading-7 tracking-[-0.02em] text-white md:text-2xl">
                {lane.title}
              </h2>
              <p className="mt-3 max-w-lg text-sm font-semibold leading-7 text-[#9dafc4]">
                {lane.copy}
              </p>
              <div className="mt-5 inline-flex items-center rounded-full border border-[#314966] px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#dbe6ff] transition group-hover:border-[#f27a1a]/70 group-hover:text-white">
                {lane.cta}
              </div>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {STATUS_PANELS.map((panel) => (
            <div key={panel.label} className={SECTION_PANEL_CLASS}>
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[#f27a1a]">
                {panel.label}
              </div>
              <div className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">
                {panel.value}
              </div>
              <p className="mt-3 text-sm font-semibold leading-7 text-[#aebcd0]">
                {panel.copy}
              </p>
            </div>
          ))}
        </section>

        <section className={SECTION_PANEL_CLASS}>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[#f27a1a]">
                OPERATING RULE
              </div>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.035em] text-white">
                Markets do not graduate by assertion.
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[#aebcd0]">
                Exact product URLs. Working internal detail routes. Verified public paths.
                Blocked providers stay blocked.
              </p>
            </div>

            <div className="rounded-[1.15rem] border border-[#314966] bg-[#050b13]/72 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7f92ad]">
                ACTIVE POSTURE
              </div>
              <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-[#c8d4e4]">
                <p>DCC cards first.</p>
                <p>Provider exits exact.</p>
                <p>Bad routes fail closed.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
