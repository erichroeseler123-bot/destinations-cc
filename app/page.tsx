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

const CURATED_HIGHLIGHTS = [
  {
    href: "/red-rocks-transportation",
    label: "Red Rocks transport dominance",
  },
  {
    href: "/juneau/whale-watching-tours",
    label: "Juneau wildlife decisions",
  },
  {
    href: "/sedona/jeep-tours",
    label: "Sedona fit decisions",
  },
];

const SECTION_PANEL_CLASS =
  "rounded-[2rem] border border-white/10 bg-[#0b1017] p-6 md:p-8";

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
            <h1 className="mt-4 text-[clamp(3rem,10vw,7rem)] font-black uppercase leading-[0.88] tracking-[-0.06em] text-white">
              Travel decisions,
              <br />
              handled correctly.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/72 md:text-lg">
              Pick your situation. We route you to the correct answer.
            </p>
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
              What this is
            </div>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em] text-white">
              Most travel sites give you options.
            </h2>
            <p className="mt-3 text-base leading-8 text-white/72">
              We remove the wrong ones before they waste your time.
            </p>
          </div>
        </section>

        <section className={SECTION_PANEL_CLASS}>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f5b34b]">
                Proof strip
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {CURATED_HIGHLIGHTS.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] px-4 py-5 text-sm font-semibold leading-7 text-white/84 transition hover:border-[#f5b34b]/40 hover:bg-white/[0.05]"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f5b34b]">
                Control surface
              </div>
              <div className="mt-4 space-y-4 text-sm leading-7 text-white/68">
                <p>Choose the correct option.</p>
                <p>Get there correctly the first time.</p>
                <p>Avoid the common mistake before it costs you the day.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <Link
            href="/command"
            className="rounded-[1.4rem] border border-[#f5b34b]/25 bg-[#f5b34b] px-5 py-5 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#f7bf6a]"
          >
            Open command view
          </Link>
          <Link
            href="/red-rocks-transportation"
            className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-5 py-5 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:border-[#f5b34b]/40 hover:bg-white/[0.05]"
          >
            Open primary corridor
          </Link>
          <Link
            href="/juneau/whale-watching-tours"
            className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-5 py-5 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:border-[#f5b34b]/40 hover:bg-white/[0.05]"
          >
            Open Juneau corridor
          </Link>
        </section>
      </div>
    </main>
  );
}
