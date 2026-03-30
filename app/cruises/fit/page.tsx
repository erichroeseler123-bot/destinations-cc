import type { Metadata } from "next";
import Link from "next/link";
import CinematicBackdrop from "@/app/components/dcc/CinematicBackdrop";
import CruiseFitWizard from "@/app/components/dcc/CruiseFitWizard";
import JsonLd from "@/app/components/dcc/JsonLd";
import RouteHeroMark from "@/app/components/dcc/RouteHeroMark";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/lib/dcc/jsonld";

const PAGE_URL = "https://destinationcommandcenter.com/cruises/fit";

export const metadata: Metadata = {
  title: "What Kind Of Cruise Fits You? | Cruise Fit Guide",
  description:
    "Use a fit-first cruise decision page to figure out what kind of cruise actually matches how you travel before you compare lines or pricing.",
  alternates: { canonical: "/cruises/fit" },
  openGraph: {
    title: "What Kind Of Cruise Fits You?",
    description:
      "A fit-first cruise decision surface for travelers who want to understand what kind of cruise actually matches them.",
    url: PAGE_URL,
    type: "website",
  },
};

export default function CruiseFitPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildArticleJsonLd({
              path: "/cruises/fit",
              headline: "What Kind Of Cruise Fits You?",
              description:
                "A fit-first cruise decision surface for travelers who want to understand what kind of cruise actually matches them.",
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "Cruises", item: "/cruises" },
              { name: "Cruise Fit", item: "/cruises/fit" },
            ]),
          ],
        }}
      />
      <CinematicBackdrop />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="space-y-4">
          <RouteHeroMark eyebrow="Destination Command Center" title="CRUISE FIT SATELLITE" tone="cyan" />
          <p className="text-xs uppercase tracking-wider text-zinc-500">Choose before you compare</p>
          <h1 className="text-4xl font-black tracking-tight">Most people do not pick the wrong cruise line. They pick the wrong fit.</h1>
          <p className="max-w-3xl text-zinc-300">
            Cruise marketing makes different trips look interchangeable. They are not. The useful question is not which line is best in the abstract. It is what kind of cruise actually fits how you travel, what will annoy you, and what would make the trip feel right.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/cruises"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 bg-white/6 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Back to cruise hub
            </Link>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">How to use this</div>
            <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-300">
              <p>
                First-time cruise buyers usually do not need more cruise marketing. They need a clearer sense of what would actually feel good, what would annoy them, and where the most likely mismatch will come from.
              </p>
              <p>
                This page is intentionally not a booking tool. It is a decision surface. The goal is to leave with a more specific follow-up lane, not ten open tabs and the same uncertainty.
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-6">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">Where people go wrong</div>
            <div className="mt-4 space-y-3 text-sm text-amber-50">
              <p>They compare cruise lines before they know whether they care more about scenery, ship feel, or low-friction logistics.</p>
              <p>They price-shop without understanding what crowd level, extra costs, and departure friction will do to the trip.</p>
              <p>They assume all cruises are roughly the same because the marketing language sounds similar.</p>
            </div>
          </div>
        </section>

        <CruiseFitWizard />

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Decision standard</div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
              <div className="font-semibold text-white">Good outcome</div>
              <p className="mt-2">You leave knowing what kind of cruise to compare next, and why.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
              <div className="font-semibold text-white">Bad outcome</div>
              <p className="mt-2">You open ten cruise tabs and still do not know what problem you are solving.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
              <div className="font-semibold text-white">System rule</div>
              <p className="mt-2">If execution is not real yet, stop at decision and route into the clearest next lane.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
