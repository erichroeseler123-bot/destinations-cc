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
}) {
  return (
    <article className="bg-[#151515] text-[#fdfbf7] min-h-screen">
      <header className="border-b border-[#2a2a2a] bg-[#101010] px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37]">{eyebrow}</p>
          <h1 className="max-w-4xl font-[var(--font-accent)] text-4xl font-bold leading-tight md:text-6xl">{title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#cccccc]">{intro}</p>
          <p className="mt-5 text-xs uppercase tracking-[0.16em] text-[#888]">Facts last checked {verifiedDate}</p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-14 px-6 py-12 md:py-16">
        <section className="border-l-4 border-[#d4af37] bg-[#1b1b1b] p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Short answer</p>
          <p className="mt-3 text-xl leading-relaxed text-[#fdfbf7]">{verdict}</p>
        </section>

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

        <section className="border-t border-[#333] pt-8">
          <h2 className="text-lg font-bold">How we checked this comparison</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#aaa]">We compare the operator's current published details rather than guessing from generic tour descriptions. Prices, schedules, restrictions and operating details can change, so final booking details should always be confirmed at checkout.</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {sources.map((source) => <a key={source.href} href={source.href} target="_blank" rel="noopener noreferrer" className="text-[#d4af37] underline underline-offset-4">{source.label}</a>)}
          </div>
        </section>

        <nav className="border-t border-[#2a2a2a] pt-8 text-sm">
          <Link href="/tours" className="text-[#d4af37] underline underline-offset-4">Browse all New Orleans tours</Link>
        </nav>
      </div>
    </article>
  );
}
