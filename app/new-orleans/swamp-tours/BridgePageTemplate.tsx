import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import PageIntentRouter from "@/app/components/dcc/PageIntentRouter";
import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from "@/lib/dcc/jsonld";
import { buildSwampPlanHref } from "@/lib/dcc/warmTransfer";
import { SWAMP_BRIDGE_PAGES, type SwampBridgePage } from "./bridgePageData";

function buildPlanHref(page: SwampBridgePage) {
  return buildSwampPlanHref({
    intent: "compare",
    topic: "swamp-tours",
    subtype: page.subtype,
    context: page.context,
    sourcePage: page.path,
  });
}

export function buildBridgePageMetadata(slug: keyof typeof SWAMP_BRIDGE_PAGES): Metadata {
  const page = SWAMP_BRIDGE_PAGES[slug];
  return {
    title: `${page.title} | Welcome to New Orleans Tours`,
    description: page.description,
    alternates: { canonical: page.path },
    keywords: [...page.keywords],
    openGraph: {
      title: `${page.title} | Welcome to New Orleans Tours`,
      description: page.description,
      url: `https://destinationcommandcenter.com${page.path}`,
      type: "article",
    },
  };
}

export default function BridgePageTemplate({ slug, children }: { slug: keyof typeof SWAMP_BRIDGE_PAGES, children?: React.ReactNode }) {
  const page = SWAMP_BRIDGE_PAGES[slug];
  const planHref = buildPlanHref(page);
  const wnoStorefrontHref = `https://www.welcometoneworleanstours.com/swamp-tours?src=dcc-authority-swamp-bridge-${encodeURIComponent(slug)}&from=${encodeURIComponent(page.path)}`;

  return (
    <main className="min-h-screen bg-[#050816] text-white" data-page-intent={page.pageIntent}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildWebPageJsonLd({
              path: page.path,
              name: page.title,
              description: page.description,
              dateModified: "2026-11-06",
              isPartOfPath: "/new-orleans/swamp-tours",
            }),
            buildBreadcrumbJsonLd([
              { name: "New Orleans", item: "/new-orleans" },
              { name: "Swamp Tours", item: "/new-orleans/swamp-tours" },
              { name: page.title, item: page.path },
            ]),
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: page.question,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: page.shortAnswer.join(" "),
                  },
                },
              ],
            },
          ],
        }}
      />
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-16">
        <header className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,17,24,0.97),rgba(5,8,22,0.99))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">{page.eyebrow}</p>
            <div className="rounded-full border border-cyan-300/20 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
              Intent: Understand
            </div>
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">{page.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/82">{page.heroSubhead}</p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6" data-testid="dcc-swamp-bridge-short-answer">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">The short answer · Verified DCC Evidence</div>
            <span className="text-xs text-emerald-300">Sources checked: 2026-11-06</span>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-7 text-white/80">
            {page.shortAnswer.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-black/35 p-4 text-xs leading-6 text-white/80 space-y-1.5" data-dcc-shared-evidence-bound="true">
            <p>
              <strong className="text-cyan-200">Verified Operator &amp; Transport Facts:</strong> Covered pontoon boats welcome <strong>all ages</strong> with roof shade and round-trip hotel/coach transport (e.g., <strong>Louisiana Tour Co. 15200P6 Option TG10</strong> at $60 w/ 8:00–8:30 AM FQ/Downtown hotel pickup; <strong>Cajun Encounters 6953SWAMPTRANS</strong> at $75.52; <strong>Gray Line</strong> at $65 w/ coach from 400 Toulouse St.). High-speed airboats (<strong>Airboat Adventures</strong> from $89 + $30/pp Downtown/FQ hotel shuttle; <strong>Ragin Cajun 6363P15</strong> from $69) enforce a <strong>strict minimum age of 5 years</strong>, prohibit pregnancy and neck/back injuries, and require unassisted boarding.
            </p>
            <p>
              <strong className="text-amber-200">Rural Dock &amp; NPS Closure Warning:</strong> Swamp docks sit 30–45 min outside New Orleans in Slidell, Manchac, and Jean Lafitte where <strong>return Uber/Lyft/cab service is unavailable</strong>—never book a self-drive SKU without a car. Starting <strong>Feb 2, 2026 for ~2 years</strong>, the NPS Barataria Preserve Visitor Center and most trails are closed (only Twin Canals trail/canoe launch is free with no restrooms; relocated Wetland Trace Boardwalk at 4917 City Park Dr charges $10/adult and requires a car).
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={wnoStorefrontHref}
              data-testid="dcc-bridge-to-wno-swamp"
              data-dcc-next-step="welcometoneworleanstours"
              className="inline-flex rounded-2xl border border-emerald-300/40 bg-[linear-gradient(180deg,#4ade80,#22c55e)] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#05100a]"
            >
              Compare &amp; Book on Welcome to New Orleans Tours →
            </a>
            <a href={planHref} className="inline-flex rounded-2xl border border-[#7dd3fc]/30 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-cyan-100 hover:bg-white/15">
              {page.primaryLabel}
            </a>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {page.sections.map((section) => (
            <article key={section.title} className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
              <h2 className="text-2xl font-bold">{section.title}</h2>
              <p className="mt-4 text-sm leading-7 text-white/78">{section.body}</p>
              {section.bullets?.length ? (
                <div className="mt-4 space-y-2 text-sm leading-7 text-white/74">
                  {section.bullets.map((bullet) => (
                    <p key={bullet}>{bullet}</p>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(34,211,238,0.10),rgba(15,23,42,0.72))] p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Decision block</div>
          <h2 className="mt-3 text-2xl font-bold text-white">{page.decisionBlockTitle}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-cyan-50/80">{page.decisionBlockBody}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={wnoStorefrontHref} className="rounded-2xl border border-emerald-300/40 bg-emerald-400/20 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-emerald-100 hover:bg-emerald-400/30">
              Open WNO Swamp Storefront {"->"}
            </a>
            <a href={planHref} className="rounded-2xl border border-white/12 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white hover:bg-white/15">
              Find the right swamp tour for you {"->"}
            </a>
            <Link href={page.secondaryHref} className="rounded-2xl border border-white/12 bg-black/20 px-5 py-3 text-sm text-white/88 hover:bg-white/10">
              {page.secondaryLabel}
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Keep browsing on DCC</div>
          <div className="mt-4 flex flex-wrap gap-3">
            {page.relatedLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-sm text-white/88 hover:bg-white/10">
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        {children}

        <PageIntentRouter
          intent={page.pageIntent}
          title="What should happen after this page?"
          summary="This DCC page answers the decision with verified evidence, then routes you to Welcome to New Orleans Tours (WNO) for live availability or WTS for narrowing."
          options={[
            {
              title: "Open Welcome to New Orleans Swamp Storefront",
              description: "Best next step when you are ready to compare live dates, hotel pickup options, and verified Viator checkouts on WNO.",
              href: wnoStorefrontHref,
              kind: "external",
              emphasis: "primary",
            },
            {
              title: "Move into WTS /plan",
              description: "Best next step if the visitor now understands the differences and is ready to choose the right fit.",
              href: planHref,
              kind: "external",
            },
            {
              title: "Back to swamp tours hub",
              description: "Use this if the visitor still needs the broader DCC swamp-tour overview before deciding.",
              href: "/new-orleans/swamp-tours",
              kind: "internal",
            },
            {
              title: "Browse all New Orleans tours",
              description: "Broaden out only if the visitor is not actually committed to a swamp-tour day yet.",
              href: "/new-orleans/tours",
              kind: "internal",
            },
            {
              title: "Return to New Orleans authority",
              description: "Move back to city context if the user is still deciding how the swamp fits the trip at all.",
              href: "/new-orleans",
              kind: "internal",
            },
          ]}
        />
      </div>
    </main>
  );
}
