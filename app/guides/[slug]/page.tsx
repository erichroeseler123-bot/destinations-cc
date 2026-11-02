import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PUBLISHED_DECISION_GUIDES, getPublishedDecisionGuide } from "@/src/data/published-decision-guides";
import { getDecisionCategory, relatedDecisionGuides } from "@/src/data/decision-taxonomy";
import { getPublicationManifestEntry } from "@/src/data/publication-manifest";
import { resolvePortfolioSiteContractByUrl } from "@/src/data/portfolio-site-contracts";
import { GuideVibeNextStep, GuideVibeTopBanner } from "./GuideVibeClient";

const ORIGIN = "https://destinationcommandcenter.com";

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return PUBLISHED_DECISION_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getPublishedDecisionGuide(slug);
  if (!guide) return {};

  const route = `/guides/${guide.slug}`;
  const manifestEntry = getPublicationManifestEntry(route);
  const title = `${guide.title} | Destination Command Center`;
  const url = manifestEntry?.canonicalUrl || `${ORIGIN}${route}`;
  const isIndexable = manifestEntry?.indexingState === "index_follow";

  return {
    title,
    description: guide.description,
    alternates: { canonical: url },
    robots: { index: isIndexable, follow: isIndexable },
    openGraph: { title, description: guide.description, url, type: "article" },
  };
}

export default async function PreSiteGuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getPublishedDecisionGuide(slug);
  if (!guide) notFound();

  const category = getDecisionCategory(guide.category);
  if (!category) notFound();

  const route = `/guides/${guide.slug}`;
  const manifestEntry = getPublicationManifestEntry(route);
  const url = manifestEntry?.canonicalUrl || `${ORIGIN}${route}`;
  const categoryUrl = `${ORIGIN}/guides/category/${category.slug}`;
  const relatedGuides = relatedDecisionGuides(guide.slug, 4);


  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: guide.title,
        description: guide.description,
        dateModified: guide.verifiedAt || manifestEntry?.materialChangeDate,
        mainEntityOfPage: { "@id": url },
        publisher: { "@id": `${ORIGIN}/#organization` },
        isPartOf: { "@id": `${ORIGIN}/#website` },
        about: guide.matters.map((name) => ({ "@type": "Thing", name })),
        ...(guide.citations && guide.citations.length > 0
          ? {
              citation: guide.citations.map((cite) => ({
                "@type": "CreativeWork",
                name: cite.label,
                url: cite.url,
                publisher: {
                  "@type": "Organization",
                  name: cite.organization,
                },
              })),
            }
          : {}),
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

        <Suspense fallback={null}>
          <GuideVibeTopBanner />
        </Suspense>


        <header className="max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">{guide.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.035em] text-white sm:text-5xl md:text-6xl">{guide.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{guide.description}</p>
        </header>

        <section className="mt-12 rounded-3xl border border-cyan-900/70 bg-[#0c1520] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">DCC answer</p>
            {guide.verifiedAt && (
              <span className="rounded-full border border-emerald-800/70 bg-emerald-950/40 px-3 py-1 text-xs font-bold text-emerald-300">
                Sources last checked: {guide.verifiedAt}
              </span>
            )}
          </div>
          <p className="mt-3 text-xl font-semibold leading-9 text-white">{guide.answer}</p>
        </section>

        {guide.assumptionsAndUnknowns && guide.assumptionsAndUnknowns.length > 0 && (
          <section className="mt-10 rounded-3xl border border-amber-900/60 bg-[#14110b] p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Explicit unknowns &amp; planning assumptions</p>
            <h2 className="mt-2 text-2xl font-black text-white">What remains unknown until you confirm it.</h2>
            <p className="mt-2 text-sm text-slate-400">
              DCC does not invent certainty for missing schedule, child-age, cargo-volume, weather-dispatch, or live inventory details.
            </p>
            <ul className="mt-5 space-y-3">
              {guide.assumptionsAndUnknowns.map((item) => (
                <li key={item} className="rounded-2xl border border-amber-900/40 bg-black/30 px-5 py-4 text-sm leading-6 text-slate-200">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {guide.optionComparison && guide.optionComparison.length > 0 && (
          <section className="mt-12 rounded-3xl border border-slate-800 bg-[#0d131d] p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Fair option comparison</p>
            <h2 className="mt-2 text-2xl font-black text-white">Direct operator, marketplace, public/free, and no-purchase alternatives.</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {guide.optionComparison.map((opt) => (
                <div key={opt.name} className="rounded-2xl border border-slate-800 bg-[#090d13] p-5">
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-300">{opt.optionType.replace(/_/g, " ")}</span>
                  <h3 className="mt-2 text-base font-black text-white">{opt.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300"><strong className="text-white">Why it fits:</strong> {opt.fitSummary}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400"><strong className="text-slate-200">When unsuitable:</strong> {opt.whenUnsuitable}</p>
                  {opt.url && (
                    <a href={opt.url} rel="noopener noreferrer" className="mt-4 inline-block text-sm font-bold text-cyan-300 hover:underline">
                      {opt.urlLabel || "Inspect source or option"} ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

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

        {guide.citations && guide.citations.length > 0 && (
          <section className="mt-14 rounded-3xl border border-slate-800 bg-[#0d131d] p-6 sm:p-8" id="sources-and-verification">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Sources &amp; verification</p>
                <h2 className="mt-2 text-2xl font-black text-white">Evidence records backing this guide.</h2>
              </div>
              {guide.verifiedAt && (
                <span className="text-xs font-bold text-slate-400">Checked: {guide.verifiedAt}</span>
              )}
            </div>
            <div className="mt-6 space-y-3">
              {guide.citations.map((cite) => (
                <div key={cite.id} className="rounded-2xl border border-slate-800 bg-[#090d13] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-sm text-white">{cite.label}</strong>
                    <span className="text-xs text-slate-400">{cite.organization} · Checked {cite.checkedAt}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{cite.claimSupported}</p>
                  <a href={cite.url} rel="noopener noreferrer" className="mt-3 inline-block text-xs font-bold text-cyan-300 hover:underline">
                    {cite.url} ↗
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {relatedGuides.length > 0 && (
          <section className="mt-14 border-t border-slate-800 pt-10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Stay in the research graph</p>
            <h2 className="mt-3 text-2xl font-black text-white">Related decisions that can change this answer.</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {relatedGuides.map((related) => (
                <Link
                  key={related.slug}
                  href={`/guides/${related.slug}`}
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

        {(() => {
          const targetContract = resolvePortfolioSiteContractByUrl(guide.nextStep.href);
          const defaultNextStep = (
            <section className="mt-14 rounded-3xl border border-emerald-900/70 bg-[#0d1815] p-7 sm:p-9">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Ready to move from research to action?</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{guide.nextStep.label}</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">{guide.nextStep.body}</p>
              <a href={guide.nextStep.href} rel="noopener" className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-200">Continue to the specialist site ↗</a>
              <div className="mt-4 space-y-1 text-xs leading-5 text-slate-400" data-dcc-compliance-disclosure="true">
                {targetContract && targetContract.id !== "dcc" ? (
                  <p>
                    <strong className="text-slate-200">Ownership &amp; Commercial Disclosure:</strong>{" "}
                    <strong>{targetContract.name}</strong> (<code>{targetContract.canonicalUrl}</code>) is a connected property in the DCC portfolio ({targetContract.networkRole.replace(/_/g, " ")}). DCC may earn a referral fee or commission on completed bookings, but commercial or owned-site relationships never alter DCC&rsquo;s constraint math, suitability rules, or inclusion of public/no-purchase alternatives.
                  </p>
                ) : (
                  <p>
                    <strong className="text-slate-200">Commercial Disclosure:</strong> DCC is the research layer. Current prices, availability, booking terms, and transaction details belong to the specialist or provider site. Commercial relationships never alter DCC&rsquo;s suitability rules.
                  </p>
                )}
                <p className="text-slate-500">
                  Review our <Link href="/affiliate-disclosure" className="underline hover:text-slate-300">Affiliate &amp; Portfolio Disclosure</Link>, <Link href="/privacy" className="underline hover:text-slate-300">Privacy Policy</Link>, and <Link href="/terms" className="underline hover:text-slate-300">Terms of Use</Link>.
                </p>
              </div>
            </section>
          );
          return (
            <Suspense fallback={defaultNextStep}>
              <GuideVibeNextStep>{defaultNextStep}</GuideVibeNextStep>
            </Suspense>
          );
        })()}


        <div className="mt-12 flex flex-wrap gap-4 border-t border-slate-800 pt-8">
          <Link href={`/guides/category/${category.slug}`} className="text-sm font-bold text-slate-300 hover:text-white">← Back to {category.label}</Link>
          <Link href="/guides" className="text-sm font-bold text-slate-500 hover:text-white">All decision guides</Link>
        </div>
      </article>
    </main>
  );
}
