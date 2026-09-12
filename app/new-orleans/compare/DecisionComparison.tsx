import Link from "next/link";

export type ComparisonColumn = {
  heading: string;
  href: string;
  cta: string;
};

export type ComparisonRow = {
  label: string;
  left: string;
  right: string;
};

export type SourceLink = {
  label: string;
  href: string;
};

type ComparisonFaq = { question: string; answer: string };

export type TopCard = {
  heading: string;
  badge?: string;
  operator: string;
  duration: string;
  transportation: string;
  historicalFocus: string;
  walkingMobility: string;
  href: string;
  ctaText: string;
};

export default function DecisionComparison({
  eyebrow,
  title,
  intro,
  verdict,
  left,
  right,
  rows,
  bestFit,
  cautions,
  sources,
  verifiedDate,
  faq = [],
  breadcrumbs,
  topCards,
  topSummaryRows,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  verdict: string;
  left: ComparisonColumn;
  right: ComparisonColumn;
  rows: ComparisonRow[];
  bestFit: { left: string[]; right: string[] };
  cautions: string[];
  sources: SourceLink[];
  verifiedDate: string;
  faq?: ComparisonFaq[];
  breadcrumbs?: { label: string; href: string }[];
  topCards?: { left: TopCard; right: TopCard };
  topSummaryRows?: ComparisonRow[];
}) {
  const faqSchema = faq.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  } : null;

  const breadcrumbSchema = breadcrumbs && breadcrumbs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: crumb.label,
      item: crumb.href.startsWith("http") ? crumb.href : `https://www.welcometoneworleanstours.com${crumb.href}`,
    })),
  } : null;

  return (
    <article className="bg-[#151515] text-[#fdfbf7] min-h-screen">
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      {breadcrumbSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />}
      <header className="border-b border-[#2a2a2a] bg-[#101010] px-6 py-12 md:py-16">
        <div className="mx-auto max-w-5xl">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[#888]">
              {breadcrumbs.map((crumb, idx) => (
                <span key={crumb.href} className="flex items-center gap-2">
                  {idx > 0 && <span aria-hidden="true">/</span>}
                  {idx === breadcrumbs.length - 1 ? (
                    <span className="text-[#d4af37] font-medium">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-[#fdfbf7] transition-colors">{crumb.label}</Link>
                  )}
                </span>
              ))}
            </nav>
          )}
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37]">{eyebrow}</p>
          <h1 className="max-w-4xl font-[var(--font-accent)] text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">{title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#cccccc]">{intro}</p>
          <p className="mt-5 text-xs uppercase tracking-[0.16em] text-[#888]">Facts last checked {verifiedDate}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="#compare-heading" className="bg-[#d4af37] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#151515]">See the comparison</Link>
            <Link href="/help-me-choose" className="border border-[#d4af37] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#d4af37]">Help Me Choose</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-14 px-6 py-12 md:py-16">
        <section className="border-l-4 border-[#d4af37] bg-[#1b1b1b] p-6 md:p-8 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Short answer</p>
          <p className="mt-3 text-xl leading-relaxed text-[#fdfbf7]">{verdict}</p>
        </section>

        {topCards && (
          <section aria-labelledby="top-booking-choices" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#333] pb-3">
              <h2 id="top-booking-choices" className="font-[var(--font-accent)] text-2xl md:text-3xl font-bold text-[#fdfbf7]">
                Key Decision Factors & Booking Choices
              </h2>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#d4af37]">At a glance</span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col justify-between border-2 border-[#d4af37] bg-[#1a1a1a] p-6 shadow-xl">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">{topCards.left.operator}</span>
                    {topCards.left.badge && (
                      <span className="rounded bg-[#d4af37]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d4af37] border border-[#d4af37]/40">
                        {topCards.left.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 font-[var(--font-accent)] text-2xl font-bold text-[#fdfbf7]">{topCards.left.heading}</h3>
                  <div className="mt-4 space-y-2.5 text-sm text-[#ccc]">
                    <p><strong className="text-white">Duration:</strong> {topCards.left.duration}</p>
                    <p><strong className="text-white">Transportation:</strong> {topCards.left.transportation}</p>
                    <p><strong className="text-white">Historical Focus:</strong> {topCards.left.historicalFocus}</p>
                    <p><strong className="text-white">Walking / Mobility:</strong> {topCards.left.walkingMobility}</p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-[#333]">
                  <Link
                    href={topCards.left.href}
                    className="block w-full text-center bg-[#d4af37] px-5 py-3.5 text-sm font-bold uppercase tracking-wider text-[#151515] transition hover:bg-[#fff8eb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
                  >
                    {topCards.left.ctaText}
                  </Link>
                </div>
              </div>

              <div className="flex flex-col justify-between border-2 border-[#d4af37] bg-[#1a1a1a] p-6 shadow-xl">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">{topCards.right.operator}</span>
                    {topCards.right.badge && (
                      <span className="rounded bg-[#d4af37]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d4af37] border border-[#d4af37]/40">
                        {topCards.right.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 font-[var(--font-accent)] text-2xl font-bold text-[#fdfbf7]">{topCards.right.heading}</h3>
                  <div className="mt-4 space-y-2.5 text-sm text-[#ccc]">
                    <p><strong className="text-white">Duration:</strong> {topCards.right.duration}</p>
                    <p><strong className="text-white">Transportation:</strong> {topCards.right.transportation}</p>
                    <p><strong className="text-white">Historical Focus:</strong> {topCards.right.historicalFocus}</p>
                    <p><strong className="text-white">Walking / Mobility:</strong> {topCards.right.walkingMobility}</p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-[#333]">
                  <Link
                    href={topCards.right.href}
                    className="block w-full text-center bg-[#d4af37] px-5 py-3.5 text-sm font-bold uppercase tracking-wider text-[#151515] transition hover:bg-[#fff8eb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
                  >
                    {topCards.right.ctaText}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {topSummaryRows && topSummaryRows.length > 0 && (
          <section aria-label="Key factor quick comparison" className="overflow-hidden border border-[#333]">
            <div className="bg-[#1f1f1f] px-4 py-3 border-b border-[#333]">
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#d4af37]">Top Comparison: Whitney vs Oak Alley</h3>
            </div>
            <div className="grid grid-cols-[minmax(120px,0.85fr)_1fr_1fr] bg-[#1b1b1b] text-sm font-bold">
              <div className="border-r border-[#333] p-4 text-[#aaa]">Decision Factor</div>
              <div className="border-r border-[#333] p-4 text-[#d4af37]">{left.heading}</div>
              <div className="p-4 text-[#d4af37]">{right.heading}</div>
            </div>
            {topSummaryRows.map((row) => (
              <div key={row.label} className="grid grid-cols-[minmax(120px,0.85fr)_1fr_1fr] border-t border-[#2a2a2a] text-sm leading-relaxed">
                <div className="border-r border-[#2a2a2a] bg-[#181818] p-4 font-bold text-[#ddd]">{row.label}</div>
                <div className="border-r border-[#2a2a2a] p-4 text-[#ccc]">{row.left}</div>
                <div className="p-4 text-[#ccc]">{row.right}</div>
              </div>
            ))}
          </section>
        )}

        <section aria-labelledby="compare-heading">
          <h2 id="compare-heading" className="mb-6 font-[var(--font-accent)] text-3xl font-bold">Side-by-side comparison</h2>
          <div className="overflow-hidden border border-[#333]">
            <div className="grid grid-cols-[minmax(120px,0.8fr)_1fr_1fr] bg-[#1b1b1b] text-sm font-bold">
              <div className="border-r border-[#333] p-4 text-[#aaa]">What matters</div>
              <div className="border-r border-[#333] p-4 text-[#d4af37]">{left.heading}</div>
              <div className="p-4 text-[#d4af37]">{right.heading}</div>
            </div>
            {rows.map((row) => (
              <div key={row.label} className="grid grid-cols-[minmax(120px,0.8fr)_1fr_1fr] border-t border-[#2a2a2a] text-sm leading-relaxed">
                <div className="border-r border-[#2a2a2a] bg-[#181818] p-4 font-bold text-[#ddd]">{row.label}</div>
                <div className="border-r border-[#2a2a2a] p-4 text-[#ccc]">{row.left}</div>
                <div className="p-4 text-[#ccc]">{row.right}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="border border-[#333] bg-[#1a1a1a] p-6">
            <h2 className="font-[var(--font-accent)] text-2xl font-bold">Choose {left.heading} if…</h2>
            <ul className="mt-5 space-y-3 text-[#ccc]">
              {bestFit.left.map((item) => <li key={item} className="flex gap-3"><span className="text-[#d4af37]">✓</span><span>{item}</span></li>)}
            </ul>
            <Link href={left.href} className="mt-7 inline-block bg-[#d4af37] px-5 py-3 text-sm font-bold uppercase tracking-wider text-[#151515] hover:bg-[#fdfbf7]">{left.cta}</Link>
          </div>
          <div className="border border-[#333] bg-[#1a1a1a] p-6">
            <h2 className="font-[var(--font-accent)] text-2xl font-bold">Choose {right.heading} if…</h2>
            <ul className="mt-5 space-y-3 text-[#ccc]">
              {bestFit.right.map((item) => <li key={item} className="flex gap-3"><span className="text-[#d4af37]">✓</span><span>{item}</span></li>)}
            </ul>
            <Link href={right.href} className="mt-7 inline-block bg-[#d4af37] px-5 py-3 text-sm font-bold uppercase tracking-wider text-[#151515] hover:bg-[#fdfbf7]">{right.cta}</Link>
          </div>
        </section>

        <section>
          <h2 className="font-[var(--font-accent)] text-3xl font-bold">What to know before booking</h2>
          <ul className="mt-5 space-y-3 text-[#ccc]">
            {cautions.map((item) => <li key={item} className="flex gap-3"><span className="text-[#d4af37]">•</span><span>{item}</span></li>)}
          </ul>
        </section>

        {faq.length > 0 && (
          <section className="border-y border-[#333] py-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Quick answers</p>
            <h2 className="mt-3 font-[var(--font-accent)] text-3xl font-bold">Questions people ask before choosing</h2>
            <div className="mt-7 grid gap-5 md:grid-cols-3">
              {faq.map((item) => (
                <article key={item.question} className="border border-[#333] bg-[#1a1a1a] p-5">
                  <h3 className="text-xl font-bold">{item.question}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#ccc]">{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="border-t border-[#333] pt-8">
          <h2 className="text-lg font-bold">How we checked this comparison</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#aaa]">We compare the operator's current published details rather than guessing from generic tour descriptions. Prices, schedules, restrictions and operating details can change, so final booking details should always be confirmed at checkout.</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {sources.map((source) => <a key={source.href} href={source.href} target="_blank" rel="noopener noreferrer" className="text-[#d4af37] underline underline-offset-4">{source.label}</a>)}
          </div>
        </section>

        <nav className="border-t border-[#2a2a2a] pt-8 text-sm flex flex-wrap gap-4">
          <Link href="/tours" className="text-[#d4af37] underline underline-offset-4">Browse all New Orleans tours</Link>
          <Link href="/guides/things-to-do-in-new-orleans-today" className="text-[#d4af37] underline underline-offset-4">Things to do today</Link>
          <Link href="/guides/tonight" className="text-[#d4af37] underline underline-offset-4">What to do tonight</Link>
          <Link href="/help-me-choose" className="text-[#d4af37] underline underline-offset-4">Help Me Choose</Link>
        </nav>
      </div>
    </article>
  );
}
