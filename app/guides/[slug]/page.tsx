import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PRE_SITE_GUIDES, getPreSiteGuide } from "@/src/data/pre-site-guides";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return PRE_SITE_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getPreSiteGuide(slug);
  if (!guide) return {};

  const title = `${guide.title} | Destination Command Center`;
  const url = `https://www.destinationcommandcenter.com/guides/${guide.slug}`;

  return {
    title,
    description: guide.description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: guide.description,
      url,
      type: "article",
    },
  };
}

export default async function PreSiteGuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getPreSiteGuide(slug);
  if (!guide) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    mainEntityOfPage: `https://www.destinationcommandcenter.com/guides/${guide.slug}`,
    publisher: {
      "@type": "Organization",
      name: "Destination Command Center",
      url: "https://www.destinationcommandcenter.com",
    },
  };

  return (
    <main className="min-h-screen bg-[#090d13] text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
        <nav className="mb-10 text-sm text-slate-400" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white">DCC</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:text-white">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-300">{guide.eyebrow}</span>
        </nav>

        <header className="max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">{guide.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.035em] text-white sm:text-5xl md:text-6xl">
            {guide.title}
          </h1>
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
                <li key={item} className="rounded-2xl border border-slate-800 bg-[#0d131d] px-5 py-4 text-sm leading-6 text-slate-300">
                  {item}
                </li>
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
                <span className="mr-2 font-black text-cyan-300">{index + 1}.</span>
                {question}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14 rounded-3xl border border-emerald-900/70 bg-[#0d1815] p-7 sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Ready to move from research to action?</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{guide.nextStep.label}</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">{guide.nextStep.body}</p>
          <a
            href={guide.nextStep.href}
            className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-200"
          >
            Continue to the specialist site ↗
          </a>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            DCC is the research layer. Current prices, availability, booking terms, and transaction details belong to the specialist or provider site.
          </p>
        </section>

        <div className="mt-12 border-t border-slate-800 pt-8">
          <Link href="/guides" className="text-sm font-bold text-slate-300 hover:text-white">
            ← Browse more DCC decision guides
          </Link>
        </div>
      </article>
    </main>
  );
}
