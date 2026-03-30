import type { Metadata } from "next";
import Link from "next/link";
import BookableToursSection from "@/app/components/dcc/BookableToursSection";
import NextStepEngine from "@/app/components/dcc/NextStepEngine";
import { getPortRecommendationActions } from "@/lib/dcc/handoffAnalytics";

export const dynamic = "force-static";
const PAGE_URL = "https://destinationcommandcenter.com/alaska";

export const metadata: Metadata = {
  title: "Alaska Cruise & Shore Excursion Guide 2026 | Ports, Tours, and Logistics",
  description:
    "Plan Alaska cruise routes with clear port intelligence, shore excursion priorities, transfer planning, and weather-aware logistics.",
  keywords: [
    "alaska cruise ports",
    "alaska shore excursions",
    "juneau excursions",
    "ketchikan tours",
    "skagway shore excursion",
    "alaska cruise planning",
  ],
  alternates: { canonical: "/alaska" },
  openGraph: {
    title: "Alaska Cruise and Shore Excursion Guide",
    description:
      "Authority-first Alaska planning with monetization lanes for high-intent shore excursions and cruise-port routing.",
    url: PAGE_URL,
    type: "website",
  },
};

export default function AlaskaPage() {
  const juneauActions = getPortRecommendationActions("juneau-alaska");
  const topPorts = [
    { slug: "juneau", label: "Juneau" },
    { slug: "ketchikan", label: "Ketchikan" },
    { slug: "skagway", label: "Skagway" },
    { slug: "sitka", label: "Sitka" },
    { slug: "icy-strait-point", label: "Icy Strait Point" },
    { slug: "whittier", label: "Whittier" },
  ];

  const excursionIntents = [
    "whale watching alaska shore excursion",
    "mendenhall glacier tour juneau",
    "white pass railroad skagway excursion",
    "ketchikan wildlife and totem tours",
    "alaska helicopter glacier landing tour",
    "alaska dog sledding shore excursion",
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-10">
        <header className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">Alaska Cruise and Shore Excursion Guide</h1>
          <p className="text-zinc-300 text-lg">
            Cruise ports, glaciers, wildlife, and excursion logistics that decide what is actually possible in port-day windows.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Tile href="/cruises" title="Cruise Layer" desc="Ships, ports, health, route options" />
          <Tile href="/vegas" title="Vegas Layer" desc="Companion destination authority page" />
          <Tile href="/national-parks" title="National Parks Map" desc="Park layer and trip pairings" />
          <Tile href="/new-orleans" title="New Orleans Layer" desc="City authority page for timing and flow" />
        </section>

        <BookableToursSection
          cityName="Alaska"
          title="Book Shore Excursions & Activities"
          description="Use DCC to find the right Alaska shore excursion fast, then continue to secure booking with Viator. This module is built to make the page feel immediately bookable, not just informational."
          primaryLabel="Browse Alaska Excursions"
          primaryHref="/tours?q=alaska%20shore%20excursions"
          secondaryLabel="View Cruise Inventory"
          secondaryHref="/cruises"
          intents={excursionIntents.map((intent) => ({
            label: intent,
            href: `/tours?q=${encodeURIComponent(intent)}`,
          }))}
          eyebrow="Book with DCC via Viator"
        />

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-2xl font-bold">Cruise-Port Hybrid Entry Points</h2>
          <p className="text-zinc-300">
            Use these high-volume ports as authority nodes that bridge schedules, excursions, transfers, and local conditions.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topPorts.map((port) => (
              <Link
                key={port.slug}
                href={`/cruises/port/${port.slug}`}
                className="rounded-xl border border-white/10 bg-black/20 p-4 text-zinc-200 hover:bg-white/10"
              >
                {port.label} Cruise Port
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-2xl font-bold">High-intent Alaska decision pages</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Link
              href="/juneau-whale-watching-from-port"
              className="rounded-xl border border-white/10 bg-black/20 p-4 text-zinc-200 hover:bg-white/10"
            >
              Juneau whale watching from cruise port
            </Link>
            <Link
              href="/cruises/port/juneau-alaska"
              className="rounded-xl border border-white/10 bg-black/20 p-4 text-zinc-200 hover:bg-white/10"
            >
              Juneau cruise port authority page
            </Link>
          </div>
        </section>

        <NextStepEngine
          title="Alaska Next Step Engine"
          eyebrow="Bottleneck-aware routing"
          description="DCC should hold cruise travelers in authority-mode when a shore-excursion lane is strained, then release them into execution when the port lane is healthy."
          actions={juneauActions}
        />

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
          <h2 className="text-2xl font-bold">Operational Next Build</h2>
          <p className="text-zinc-400">
            Continue wiring canonical Alaska port nodes and city nodes into shared DCC event, tour, and transport pipelines.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link className="rounded-2xl px-6 py-4 bg-cyan-600 hover:bg-cyan-500 transition font-semibold"
                  href="/ports">
              Browse Ports →
            </Link>
            <Link
              className="rounded-2xl px-6 py-4 border border-white/10 bg-white/5 hover:bg-white/10 transition"
              href="/mighty-argo-shuttle"
            >
              Argo Shuttle Layer →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Tile({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="rounded-3xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition">
      <div className="text-lg font-bold">{title}</div>
      <div className="mt-2 text-sm text-zinc-400">{desc}</div>
      <div className="mt-4 text-sm text-cyan-300">Open →</div>
    </Link>
  );
}
