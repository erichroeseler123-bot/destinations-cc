import type { DestinationHeroConfig, NetworkSectionProps } from "./types";
import { NetworkLink } from "./NetworkLink";

type DestinationHeroProps = NetworkSectionProps & {
  hero: DestinationHeroConfig;
};

export function DestinationHero({ hero, theme }: DestinationHeroProps) {
  const heroImage = hero.media?.image || theme.hero.image;

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-8 pt-6 sm:px-6 md:pt-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] lg:gap-8 lg:pb-12">
      <div className="flex min-h-[480px] flex-col justify-center rounded-lg border border-[var(--network-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.075),rgba(255,255,255,0.03))] p-5 shadow-[0_26px_90px_rgba(0,0,0,0.34)] sm:min-h-[520px] sm:p-7 lg:p-9">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--destination-accent-2)]">
          {hero.eyebrow}
        </div>
        <h1 className="mt-4 max-w-4xl text-4xl font-black uppercase leading-[0.92] tracking-normal text-[var(--network-text)] sm:text-6xl lg:text-7xl">
          {hero.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-[var(--network-muted)] sm:text-lg">
          {hero.summary}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <NetworkLink
            cta={hero.primaryCta}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--destination-accent-2)] px-5 text-center text-xs font-black uppercase tracking-[0.14em] text-[var(--destination-accent-text)] shadow-[0_18px_50px_rgba(242,191,103,0.18)] transition hover:bg-white"
          />
          {hero.secondaryCta ? (
            <NetworkLink
              cta={hero.secondaryCta}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--network-border)] bg-white/[0.055] px-5 text-center text-xs font-black uppercase tracking-[0.14em] text-[var(--network-text)] transition hover:bg-white/[0.1]"
            />
          ) : null}
        </div>
        {hero.trustChips?.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {hero.trustChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-[var(--network-border)] bg-[var(--network-surface-soft)] px-3 py-2 text-xs font-bold text-[var(--network-muted)]"
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <aside className="relative overflow-hidden rounded-lg border border-[var(--network-border)] bg-[radial-gradient(circle_at_top_right,var(--destination-accent-soft),transparent_32%),linear-gradient(180deg,rgba(0,0,0,0.16),rgba(0,0,0,0.42)),var(--network-surface)] p-5 shadow-[0_26px_90px_rgba(0,0,0,0.32)] sm:p-6 lg:p-7">
        <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(90deg,rgba(17,197,138,0.2),rgba(242,191,103,0.15),transparent)]" />
        <div className="relative grid h-full min-h-[360px] content-between gap-6">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--destination-accent)]">
              {hero.media?.eyebrow || theme.brandName}
            </div>
            <h2 className="mt-3 text-3xl font-black leading-[0.98] tracking-normal text-[var(--network-text)] sm:text-4xl">
              {hero.media?.title || "Plan the tour around the trip."}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--network-muted)]">
              {hero.media?.body || "Match the tour to pickup, weather, group fit, and timing before opening inventory."}
            </p>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-[var(--network-border)] bg-black/[0.18]">
            {heroImage ? (
              <img
                src={heroImage.src}
                alt={heroImage.alt}
                className="h-full w-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="relative flex h-full flex-col justify-between bg-[radial-gradient(circle_at_18%_20%,rgba(17,197,138,0.34),transparent_32%),radial-gradient(circle_at_80%_28%,rgba(242,191,103,0.26),transparent_28%),linear-gradient(135deg,rgba(4,47,46,0.9),rgba(7,19,24,0.94))] p-4">
                <div className="h-10 w-24 rounded-full border border-white/20 bg-white/10" />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--destination-accent-2)]">
                    Media-ready
                  </div>
                  <div className="mt-2 max-w-[14rem] text-lg font-black leading-tight text-[var(--network-text)]">
                    Add real New Orleans tour imagery here.
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="grid gap-3">
            {(hero.media?.rows || []).map((row) => (
              <div
                key={row.label}
                className="rounded-lg border border-[var(--network-border)] bg-black/[0.16] p-4"
              >
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--destination-accent-2)]">
                  {row.label}
                </div>
                <div className="mt-1 text-sm font-bold text-[var(--network-text)]">{row.value}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
