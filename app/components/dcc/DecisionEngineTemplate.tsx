import Link from "next/link";
import type { DecisionEnginePage } from "@/lib/dcc/decision/schema";
import HeroMedia from "@/app/components/dcc/HeroMedia";
import SectionMedia from "@/app/components/dcc/SectionMedia";
import GraphContextPanel from "@/app/components/dcc/GraphContextPanel";
import { getGraphContextForPath } from "@/lib/dcc/graph/context";
import {
  getGalleryAssets,
  getHeroAsset,
  getMediaEntryByPath,
  getSectionAssets,
} from "@/lib/dcc/media/registry";

type Props = {
  page: DecisionEnginePage;
};

function renderAction(page: DecisionEnginePage, index: number) {
  const action = page.authorityActions[index];
  if (!action) return null;
  if (action.kind === "internal") {
    return (
      <Link
        href={action.href}
        className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-zinc-100 hover:bg-white/15"
      >
        {action.label}
      </Link>
    );
  }
  return (
    <a
      href={action.href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-zinc-100 hover:bg-white/15"
    >
      {action.label}
    </a>
  );
}

function renderCta(action: DecisionEnginePage["executionCtas"][number]) {
  if (action.kind === "internal") {
    return (
      <Link
        key={`${action.href}:${action.label}`}
        href={action.href}
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black hover:bg-emerald-400"
      >
        {action.label}
      </Link>
    );
  }
  return (
    <a
      key={`${action.href}:${action.label}`}
      href={action.href}
      target="_blank"
      rel="noopener noreferrer sponsored nofollow"
      className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black hover:bg-emerald-400"
    >
      {action.label}
    </a>
  );
}

const NODE_TYPE_COPY: Record<
  DecisionEnginePage["nodeType"],
  {
    label: string;
    focus: string;
  }
> = {
  city: {
    label: "City Authority Layer",
    focus: "Use this to sequence neighborhoods, timing blocks, and city-wide tradeoffs before booking.",
  },
  port: {
    label: "Port Authority Layer",
    focus: "Use this to pick the highest-fit shore lane with conservative return timing.",
  },
  venue: {
    label: "Venue Authority Layer",
    focus: "Use this to solve ingress/egress, weather, and event-night friction before committing.",
  },
  attraction: {
    label: "Attraction Authority Layer",
    focus: "Use this to choose if this attraction is the right anchor for your available time and conditions.",
  },
  route: {
    label: "Route Authority Layer",
    focus: "Use this to reduce transfer risk and make route timing decisions explicit before execution.",
  },
};

export default function DecisionEngineTemplate({ page }: Props) {
  const variant = NODE_TYPE_COPY[page.nodeType];
  const mediaEntry = getMediaEntryByPath(page.canonicalPath);
  const heroAsset = mediaEntry ? getHeroAsset(mediaEntry) : null;
  const sectionAssets = mediaEntry ? getSectionAssets(mediaEntry) : [];
  const galleryAssets = mediaEntry ? getGalleryAssets(mediaEntry) : [];
  const graphContext = getGraphContextForPath(page.canonicalPath);
  return (
    <section className="rounded-3xl border border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 md:p-8 space-y-7 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">
          {page.hero.eyebrow}
        </p>
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{variant.label}</p>
        <h2 className="text-3xl font-black tracking-tight md:text-4xl">
          {page.title}
        </h2>
        <p className="max-w-4xl text-zinc-200">{page.hero.summary}</p>
        <p className="max-w-4xl text-sm text-zinc-400">{variant.focus}</p>
        <div className="flex flex-wrap gap-2">
          {page.hero.quickLinks.map((item) => (
            <Link
              key={`${item.href}:${item.label}`}
              href={item.href}
              className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-zinc-200 hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      {heroAsset ? <HeroMedia asset={heroAsset} /> : null}

      {sectionAssets.length ? (
        <SectionMedia title="Visual Context" assets={sectionAssets} />
      ) : null}

      <section className="space-y-3">
        <h3 className="text-xl font-bold">Quick Facts</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {page.quickFacts.map((fact) => (
            <article key={fact.label} className="rounded-xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-wider text-zinc-500">{fact.label}</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">{fact.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-bold">Why This Place Matters</h3>
        <article className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <p className="text-sm text-zinc-300">{page.whyThisPlaceMatters}</p>
        </article>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-bold">When to Go</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-xl border border-white/10 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Best months</p>
            <p className="mt-2 text-sm text-zinc-100">{page.whenToGo.bestMonths}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Best days</p>
            <p className="mt-2 text-sm text-zinc-100">{page.whenToGo.bestDays}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Best weather</p>
            <p className="mt-2 text-sm text-zinc-100">{page.whenToGo.bestWeather}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Crowd patterns</p>
            <p className="mt-2 text-sm text-zinc-100">{page.whenToGo.crowdPatterns}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Seasonal differences</p>
            <p className="mt-2 text-sm text-zinc-100">{page.whenToGo.seasonalDifferences}</p>
          </article>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-bold">How to Get There</h3>
        <article className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <ul className="space-y-2 text-sm text-zinc-300">
            {page.howToGetThere.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-bold">What to Do</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {page.whatToDo.map((item) => (
            <article key={item.title} className="rounded-xl border border-white/10 bg-black/25 p-4">
              <h4 className="text-base font-semibold text-zinc-100">{item.title}</h4>
              <p className="mt-2 text-sm text-zinc-300">{item.description}</p>
              {item.href ? (
                <Link href={item.href} className="mt-3 inline-block text-sm text-cyan-300 hover:text-cyan-200">
                  Open guide →
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-bold">Nearby Things</h3>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {page.nearbyThings.map((item) => (
            <Link
              key={`${item.href}:${item.label}`}
              href={item.href}
              className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-bold">Insider Tips</h3>
        <article className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <ul className="space-y-2 text-sm text-zinc-300">
            {page.insiderTips.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-bold">Common Mistakes</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {page.commonMistakes.map((item) => (
            <article key={item.mistake} className="rounded-xl border border-white/10 bg-black/25 p-4">
              <p className="text-sm font-semibold text-rose-200">{item.mistake}</p>
              <p className="mt-2 text-sm text-zinc-300">{item.avoid}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-bold">Local Intel</h3>
        <article className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <ul className="space-y-2 text-sm text-zinc-300">
            {page.localIntel.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-bold">Related Experiences</h3>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {page.relatedExperiences.map((item) => (
            <Link
              key={`${item.href}:${item.label}`}
              href={item.href}
              className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
            >
              {item.label}
              {item.graphLinked ? (
                <span className="ml-2 text-[10px] uppercase tracking-wider text-cyan-300">
                  Graph
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      {graphContext ? <GraphContextPanel context={graphContext} /> : null}

      <section className="space-y-3">
        <h3 className="text-xl font-bold">Freshness and Evidence</h3>
        <article className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Updated: {page.freshness.updatedAt} · Refresh target: {page.freshness.refreshIntervalDays} days
          </p>
          <div className="mt-3 grid gap-2">
            {page.freshness.evidence.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="rounded-lg border border-white/10 bg-black/25 px-3 py-3 hover:bg-white/10"
              >
                <p className="text-sm font-semibold text-zinc-100">{item.title}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-cyan-200">{item.source}</p>
                <p className="mt-1 text-sm text-zinc-300">{item.note}</p>
              </a>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <h3 className="text-xl font-bold md:col-span-2 xl:col-span-4">Next Actions (Authority First)</h3>
        {renderAction(page, 0)}
        {renderAction(page, 1)}
        {page.authorityActions.slice(2).map((item) =>
          item.kind === "internal" ? (
            <Link
              key={`${item.href}:${item.label}`}
              href={item.href}
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-zinc-100 hover:bg-white/15"
            >
              {item.label}
            </Link>
          ) : (
            <a
              key={`${item.href}:${item.label}`}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-zinc-100 hover:bg-white/15"
            >
              {item.label}
            </a>
          )
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-bold">Execution CTAs (Secondary)</h3>
        <p className="text-sm text-zinc-400">
          Booking and execution links stay secondary to authority content.
        </p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {page.executionCtas.map((item) => renderCta(item))}
        </div>
      </section>

      {galleryAssets.length ? (
        <SectionMedia title="Gallery" assets={galleryAssets} />
      ) : null}

      <section className="space-y-3">
        <h3 className="text-xl font-bold">FAQ</h3>
        <div className="grid gap-3">
          {page.faq.map((item) => (
            <article key={item.q} className="rounded-xl border border-white/10 bg-black/25 p-4">
              <h4 className="text-base font-semibold text-zinc-100">{item.q}</h4>
              <p className="mt-2 text-sm text-zinc-300">{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
