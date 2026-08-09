import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PUBLISHED_DECISION_GUIDES, getPublishedDecisionGuide } from "@/src/data/published-decision-guides";
import { getDecisionCategory, relatedDecisionGuides } from "@/src/data/decision-taxonomy";

const ORIGIN = "https://www.destinationcommandcenter.com";
const VIBE_ORIGIN = "https://vibearoundtown.com";

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<SearchParams>;
};

function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function vibeContextQuery(params: SearchParams) {
  const query = new URLSearchParams();
  query.set("from", "vibe");
  for (const key of ["island", "cruiseCallId", "groupSize", "shipName", "entry", "driverSlug"] as const) {
    const value = one(params[key]);
    if (value) query.set(key, value);
  }
  return query;
}

function vibeReturnHref(params: SearchParams, guideSlug: string) {
  const query = new URLSearchParams();
  for (const key of ["island", "cruiseCallId", "groupSize", "shipName"] as const) {
    const value = one(params[key]);
    if (value) query.set(key, value);
  }

  query.set("dccAssisted", "1");
  query.set("dccEntry", one(params.entry) || "dcc-guide");
  query.set("dccGuide", guideSlug);

  const driverSlug = one(params.driverSlug);
  if (driverSlug) {
    query.set("dccDriver", driverSlug);
    return `${VIBE_ORIGIN}/drivers/${encodeURIComponent(driverSlug)}?${query.toString()}`;
  }

  return `${VIBE_ORIGIN}/search?${query.toString()}`;
}

function vibeHubHref(params: SearchParams, carryQuery: string) {
  const island = one(params.island);
  return island
    ? `/vibe-around/${encodeURIComponent(island)}?${carryQuery}`
    : `/vibe-around?${carryQuery}`;
}

export function generateStaticParams() {
  return PUBLISHED_DECISION_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getPublishedDecisionGuide(slug);
  if (!guide) return {};

  const title = `${guide.title} | Destination Command Center`;
  const url = `${ORIGIN}/guides/${guide.slug}`;

  return {
    title,
    description: guide.description,
    alternates: { canonical: url },
    openGraph: { title, description: guide.description, url, type: "article" },
  };
}

export default async function PreSiteGuidePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const queryParams = searchParams ? await searchParams : {};
  const guide = getPublishedDecisionGuide(slug);
  if (!guide) notFound();

  const category = getDecisionCategory(guide.category);
  if (!category) notFound();

  const cameFromVibe = one(queryParams.from) === "vibe";
  const returnToVibe = vibeReturnHref(queryParams, guide.slug);
  const carryQuery = vibeContextQuery(queryParams).toString();
  const url = `${ORIGIN}/guides/${guide.slug}`;
  const categoryUrl = `${ORIGIN}/guides/category/${category.slug}`;
  const relatedGuides = relatedDecisionGuides(guide.slug, 4);
  const driverSlug = one(queryParams.driverSlug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: guide.title,
        description: guide.description,
        mainEntityOfPage: { "@id": url },
        publisher: { "@id": `${ORIGIN}/#organization` },
        isPartOf: { "@id": `${ORIGIN}/#website` },
        about: guide.matters.map((name) => ({ "@type": "Thing", name })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Destination Command Center", item: `${ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: "Decision Guides", item: `${ORIGIN}/guides` },
          { "@type": "ListItem", position: 3, name: category.label, item: categoryUrl },
          { "@type": "ListItem", position: 4, name: guide.title, item: url },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#090d13] text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
        <nav className="mb-10 text-sm text-slate-400" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white">DCC</Link><span className="mx-2">/</span>
          <Link href="/guides" className="hover:text-white">Guides</Link><span className="mx-2">/</span>
          <Link href={`/guides/category/${category.slug}`} className="hover:text-white">{category.label}</Link><span className="mx-2">/</span>
          <span className="text-slate-300">{guide.eyebrow}</span>
        </nav>

        {cameFromVibe && (
          <section className="mb-10 rounded-3xl border border-emerald-900/70 bg-[#0d1815] p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Vibe Around research bridge</p>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-white">You came here to answer one question, not restart the trip.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  {driverSlug
                    ? "Your driver profile and cruise context are being carried through these research pages. When you have the answer, return to the same person."
                    : "Your Vibe context is being carried through these research pages. When you have the answer, return to the matching driver search."}
                </p>
              </div>
              <a href={returnToVibe} className="shrink-0 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-200">
                {driverSlug ? "Back to the same driver ↗" : "Back to Vibe drivers ↗"}
              </a>
            </div>
          </section>
        )}

        <header className="max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">{guide.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.035em] text-white sm:text-5xl md:text-6xl">{guide.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{guide.description}</p>
        </header>

        <section className="mt-12 rounded-3xl border border-cyan-900/70 bg-[#0c1520] p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">DCC answer</p>
          <p className="mt-3 text-xl font-semibold leading-9 text-white">{guide.answer}</p>
        </section>

        <section className="mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">What changes the decision</p>
            <h2 className="mt-3 text-2xl font-black text-white">Check these before choosing.</h2>
            <ul className="mt-6 space-y-3">
              {guide.matters.map((item) => (
                <li key={item} className="rounded-2xl border border-slate-800 bg-[#0d131d] px-5 py-4 text-sm leading-6 text-slate-300">{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">The tradeoffs</p>
            <h2 className="mt-3 text-2xl font-black text-white">There usually is not one right answer.</h2>
            <div className="mt-6 space-y-4">
              {guide.tradeoffs.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-800 bg-[#0d131d] p-5">
                  <strong className="text-white">{item.label}</strong>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-slate-800 bg-[#0d131d] p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Ask yourself</p>
          <h2 className="mt-3 text-2xl font-black text-white">Four questions before you spend money.</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-2">
            {guide.questions.map((question, index) => (
              <li key={question} className="rounded-2xl border border-slate-800 bg-[#090d13] p-5 text-sm leading-6 text-slate-300">
                <span className="mr-2 font-black text-cyan-300">{index + 1}.</span>{question}
              </li>
            ))}
          </ol>
        </section>

        {relatedGuides.length > 0 && (
          <section className="mt-14 border-t border-slate-800 pt-10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Stay in the research graph</p>
            <h2 className="mt-3 text-2xl font-black text-white">Related decisions that can change this answer.</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {relatedGuides.map((related) => (
                <Link
                  key={related.slug}
                  href={cameFromVibe ? `/guides/${related.slug}?${carryQuery}` : `/guides/${related.slug}`}
                  className="rounded-2xl border border-slate-800 bg-[#0d131d] p-5 transition hover:border-cyan-700"
                >
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{related.eyebrow}</span>
                  <h3 className="mt-2 text-base font-black leading-6 text-white">{related.title}</h3>
                  <span className="mt-4 inline-block text-sm font-bold text-cyan-200">Read decision guide →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {cameFromVibe ? (
          <section className="mt-14 rounded-3xl border border-emerald-900/70 bg-[#0d1815] p-7 sm:p-9">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Decision made?</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              {driverSlug ? "Return to the person you were considering." : "Go back to the people who can make the day happen."}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">DCC handled the research. Vibe Around handles the local-driver choice and reservation request.</p>
            <a href={returnToVibe} className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-200">
              {driverSlug ? "I’m ready — back to this driver ↗" : "I’m ready — show me local drivers ↗"}
            </a>
            <div className="mt-5">
              <Link href={vibeHubHref(queryParams, carryQuery)} className="text-sm font-bold text-emerald-200 hover:text-white">Back to the Vibe decision center</Link>
            </div>
          </section>
        ) : (
          <section className="mt-14 rounded-3xl border border-emerald-900/70 bg-[#0d1815] p-7 sm:p-9">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Ready to move from research to action?</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{guide.nextStep.label}</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">{guide.nextStep.body}</p>
            <a href={guide.nextStep.href} rel="noopener" className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-200">Continue to the specialist site ↗</a>
            <p className="mt-4 text-xs leading-5 text-slate-500">DCC is the research layer. Current prices, availability, booking terms, and transaction details belong to the specialist or provider site.</p>
          </section>
        )}

        <div className="mt-12 flex flex-wrap gap-4 border-t border-slate-800 pt-8">
          <Link href={`/guides/category/${category.slug}`} className="text-sm font-bold text-slate-300 hover:text-white">← Back to {category.label}</Link>
          <Link href="/guides" className="text-sm font-bold text-slate-500 hover:text-white">All decision guides</Link>
        </div>
      </article>
    </main>
  );
}
