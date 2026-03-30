import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import PageActionBar from "@/app/components/dcc/PageActionBar";
import {
  CRUISE_TENDERING_FAQ,
  CRUISE_TENDERING_TIPS,
  CRUISE_TENDERING_VIDEOS,
} from "@/src/data/cruise-tendering-guide";
import { buildMapsSearchUrl, type PageAction } from "@/src/lib/page-actions";
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/lib/dcc/jsonld";

const PAGE_URL = "https://destinationcommandcenter.com/cruises/tendering";

export const metadata: Metadata = {
  title: "Cruise Tendering Guide | Timing, Queues, Motion, and Return Buffer",
  description:
    "Practical cruise tendering guidance covering priority groups, ticket systems, motion, accessibility, and how much buffer to keep before the last tender back.",
  keywords: [
    "cruise tendering",
    "tender port guide",
    "cruise tender process",
    "tender port return time",
    "cruise shore tender tips",
  ],
  alternates: { canonical: "/cruises/tendering" },
  openGraph: {
    title: "Cruise Tendering Guide",
    description:
      "Tender timing, boarding friction, seasickness, and return-planning advice for cruise travelers.",
    url: PAGE_URL,
    type: "website",
  },
};

export default function CruiseTenderingPage() {
  const actions: PageAction[] = [
    { href: "/cruises", label: "Back to Cruise Explorer", kind: "internal" },
    { href: buildMapsSearchUrl("cruise tender port"), label: "Open tender-port search in Maps", kind: "external" },
    { href: "/ports", label: "Open Ports Directory", kind: "internal" },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_24%),linear-gradient(180deg,_#111318_0%,_#090a0d_100%)] text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildArticleJsonLd({
              path: "/cruises/tendering",
              headline: "Cruise Tendering Guide",
              description:
                "Practical cruise tendering guidance covering priority groups, ticket systems, motion, accessibility, and return buffer.",
              dateModified: "2026-03-12",
            }),
            buildBreadcrumbJsonLd([
              { name: "Cruises", item: "/cruises" },
              { name: "Tendering Guide", item: "/cruises/tendering" },
            ]),
            buildFaqJsonLd(CRUISE_TENDERING_FAQ),
          ],
        }}
      />
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
        <header className="space-y-5">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Cruise Logistics Guide</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Cruise Tendering Guide</h1>
          <p className="max-w-4xl text-lg text-zinc-200">
            Tender ports are a logistics problem before they are a scenic one. Use this guide for queue timing, motion management, accessibility planning, and realistic return buffer decisions.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <PageActionBar title="Useful tendering actions" actions={actions} />

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Best for</p>
            <p className="mt-2 text-lg font-semibold">Tender-heavy cruise itineraries</p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">What changes most</p>
            <p className="mt-2 text-lg font-semibold">Queue time, usable shore window, return stress</p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Planning rule</p>
            <p className="mt-2 text-lg font-semibold">Do not plan shore days as if dock time equals usable time</p>
          </article>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-2xl font-bold">How to use this tendering guide</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4 text-sm leading-7 text-zinc-300">
              <p>
                Travelers usually search for tender-port advice when they are trying to understand how much real shore time they will lose, whether independent plans are still safe, or how motion and boarding friction change the day for older travelers, kids, or anyone with accessibility concerns.
              </p>
              <p>
                This page is meant to answer that process question first, then push visitors into a real port page or excursion page once they understand how tendering changes the plan.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Best next clicks</div>
              <div className="mt-4 grid gap-3">
                <Link href="/cruises/shore-excursions" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Shore excursions guide</Link>
                <Link href="/ports" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Ports directory</Link>
                <Link href="/ports/grand-cayman" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Grand Cayman port</Link>
                <Link href="/ports/cabo-san-lucas" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Cabo San Lucas port</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-2xl font-bold">Seven practical tendering rules</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {CRUISE_TENDERING_TIPS.map((tip) => (
              <article key={tip.title} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <h3 className="text-lg font-semibold">{tip.title}</h3>
                <p className="mt-3 text-sm text-zinc-300">{tip.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-2xl font-bold">What actually slows tender days down</h2>
            <ul className="mt-4 space-y-3 text-zinc-300">
              <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">The first tender rush creates the longest lines and the most crowd compression.</li>
              <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">Weather and sea state can reduce effective shore time even when the port call still happens.</li>
              <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">Return lines get worse late in the day, especially when independent travelers all aim for the same final window.</li>
              <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">Tendering changes accessibility assumptions because steps, gaps, and motion are part of the boarding process.</li>
            </ul>
          </article>
          <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-2xl font-bold">When ship excursions make more sense</h2>
            <ul className="mt-4 space-y-3 text-zinc-300">
              <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">When early shore access changes the whole value of the day.</li>
              <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">When weather or sea state can compress the available return window.</li>
              <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">When the port is known for heavy crowding and independent timing failures.</li>
              <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">When mobility, seasickness, or transfer friction make a simpler handoff worth the extra cost.</li>
            </ul>
          </article>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-2xl font-bold">Best-fit tendering scenarios</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Independent explorer</h3>
              <p className="mt-2 text-sm text-zinc-300">Use this guide to understand whether the return-risk margin still makes independent plans worth it.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Mobility-sensitive traveler</h3>
              <p className="mt-2 text-sm text-zinc-300">Tendering matters more when steps, motion, and boarding friction change what feels realistic.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Family group</h3>
              <p className="mt-2 text-sm text-zinc-300">Queue time and return compression hit harder when the group cannot pivot quickly or wait comfortably.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Excursion-first day</h3>
              <p className="mt-2 text-sm text-zinc-300">Tendering can make ship-booked or port-near excursions more valuable than they first appear.</p>
            </article>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-300">Reality Check Videos</p>
          <h2 className="mt-2 text-2xl font-bold">Recent traveler footage that shows the actual process</h2>
          <p className="mt-3 max-w-3xl text-sm text-zinc-400">
            These links are illustrative only. Conditions vary by ship, line, weather, and port-specific procedures.
          </p>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {CRUISE_TENDERING_VIDEOS.map((video) => (
              <a
                key={video.href}
                href={video.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="rounded-2xl border border-white/10 bg-black/20 p-5 hover:bg-white/10"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{video.source}</p>
                <h3 className="mt-2 text-lg font-semibold text-zinc-100">{video.title}</h3>
                <p className="mt-3 text-sm text-zinc-300">{video.whyItMatters}</p>
                <p className="mt-4 text-sm font-semibold text-cyan-200">Open video evidence →</p>
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-2xl font-bold">Common tendering questions</h2>
          <div className="mt-4 space-y-3">
            {CRUISE_TENDERING_FAQ.map((item) => (
              <details key={item.question} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <summary className="cursor-pointer list-none font-semibold text-zinc-100">{item.question}</summary>
                <p className="mt-3 text-sm text-zinc-300">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Link href="/ports/grand-cayman" className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Tender-heavy port example: Grand Cayman</h2>
            <p className="mt-2 text-zinc-300">
              Use a real tender port page when you want DCC guidance tied to an actual shore day, not only the general process.
            </p>
          </Link>
          <Link href="/ports/cabo-san-lucas" className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Tender-heavy port example: Cabo San Lucas</h2>
            <p className="mt-2 text-zinc-300">
              Cabo is a good comparison when the tender ride changes how much useful time you really have on shore.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
