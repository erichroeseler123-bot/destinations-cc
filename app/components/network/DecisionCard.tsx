import type { DecisionCardConfig } from "./types";
import { NetworkLink } from "./NetworkLink";

export function DecisionCard({ config }: { config?: DecisionCardConfig }) {
  if (!config) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6" id="what-to-book">
      <article className="grid gap-5 rounded-lg border border-[var(--network-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.032))] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.24)] md:grid-cols-[0.95fr_1.05fr] md:p-7">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--destination-accent)]">
            {config.eyebrow}
          </div>
          <h2 className="mt-3 text-3xl font-black uppercase leading-[0.98] tracking-normal text-[var(--network-text)] sm:text-4xl">
            {config.title}
          </h2>
          <p className="mt-4 text-sm leading-7 text-[var(--network-muted)]">{config.body}</p>
        </div>
        <div className="rounded-lg border border-[var(--network-border)] bg-black/[0.18] p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--destination-accent-2)]">
            Recommended move
          </div>
          <p className="mt-3 text-base font-bold leading-7 text-[var(--network-text)]">
            {config.recommendation}
          </p>
          {config.supportPoints?.length ? (
            <div className="mt-4 grid gap-2">
              {config.supportPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-full border border-[var(--network-border)] bg-white/[0.045] px-3 py-2 text-xs font-bold text-[var(--network-muted)]"
                >
                  {point}
                </div>
              ))}
            </div>
          ) : null}
          {config.cta ? (
            <NetworkLink
              cta={config.cta}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--destination-accent)] px-5 text-xs font-black uppercase tracking-[0.14em] text-[var(--destination-accent-text)] transition hover:bg-white"
            />
          ) : null}
        </div>
      </article>
    </section>
  );
}
