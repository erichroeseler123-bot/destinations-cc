import Link from "next/link";
import { getGovernedPublishableDecisionFacts } from "../data/experienceGraphGovernance";

type Props = {
  slugs: string[];
  categoryLabel?: string;
};

export default function ExperienceDecisionBlock({ slugs, categoryLabel }: Props) {
  const records = slugs
    .map((slug) => getGovernedPublishableDecisionFacts(slug))
    .filter((record): record is NonNullable<typeof record> => Boolean(record));

  if (!records.length) return null;

  const primary = records[0];
  const secondary = records.find((record) => record.slug !== primary.slug) || null;
  const firstBest = primary.bestFor[0] || null;
  const firstAvoid = primary.avoidIf[0] || null;

  return (
    <section className="mt-10 border-y border-[#3b2e1e] bg-[linear-gradient(180deg,#15120f,#100e0c)] px-5 py-6 md:px-7" aria-label={`${categoryLabel || "Experience"} decision guide`}>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-2 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c9a86a]">Quick decision guide</p>
          <h2 className="font-serif text-2xl text-[#f3dfb3] md:text-3xl">Choose by fit, not by a giant catalog</h2>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {firstBest && (
            <div className="border border-white/10 bg-white/[0.025] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c9a86a]">Choose this if</p>
              <p className="mt-2 text-sm leading-6 text-[#e8dfd0]">{firstBest}.</p>
            </div>
          )}

          {firstAvoid && (
            <div className="border border-white/10 bg-white/[0.025] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c9a86a]">Think twice if</p>
              <p className="mt-2 text-sm leading-6 text-[#e8dfd0]">{firstAvoid}.</p>
            </div>
          )}

          {primary.tradeOff && (
            <div className="border border-white/10 bg-white/[0.025] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c9a86a]">The trade-off</p>
              <p className="mt-2 text-sm leading-6 text-[#e8dfd0]">{primary.tradeOff}</p>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs font-bold uppercase tracking-[0.09em]">
          <Link href={`/tours/${primary.slug}`} className="text-[#d8bb77] hover:text-white">
            See {primary.experienceType} →
          </Link>
          {secondary && (
            <Link href={`/tours/${secondary.slug}`} className="text-[#aaa193] hover:text-white">
              Compare another fit →
            </Link>
          )}
          <Link href="/help-me-choose" className="text-[#d8bb77] hover:text-white">
            Use Help Me Choose →
          </Link>
        </div>
      </div>
    </section>
  );
}
