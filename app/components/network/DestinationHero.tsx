import type { DestinationHeroConfig, NetworkSectionProps } from "./types";
import { NetworkLink } from "./NetworkLink";

type DestinationHeroProps = NetworkSectionProps & {
  hero: DestinationHeroConfig;
};

export function DestinationHero({ hero, theme }: DestinationHeroProps) {
  const heroImage = hero.media?.image || theme.hero.image;

  return (
    <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-8 pt-4 sm:px-6 md:pt-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(340px,1.08fr)] lg:gap-6 lg:pb-12">
      <div className="order-2 flex flex-col justify-center rounded-lg border border-[var(--network-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.58))] p-5 shadow-[0_18px_55px_rgba(20,55,47,0.16)] sm:p-7 lg:order-1 lg:min-h-[520px] lg:p-9">
        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--destination-accent)]">
          {hero.eyebrow}
        </div>
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[0.94] tracking-normal text-[var(--network-text)] sm:text-6xl lg:text-7xl">
          {hero.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-[var(--network-muted)] sm:text-lg">
          {hero.summary}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <NetworkLink
            cta={hero.primaryCta}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--destination-accent-2)] px-6 text-center text-xs font-black uppercase tracking-[0.12em] text-[var(--destination-accent-text)] shadow-[0_18px_40px_rgba(143,91,24,0.2)] transition hover:bg-white"
          />
          {hero.secondaryCta ? (
            <NetworkLink
              cta={hero.secondaryCta}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--network-border)] bg-white/70 px-6 text-center text-xs font-black uppercase tracking-[0.12em] text-[var(--network-text)] transition hover:bg-white"
            />
          ) : null}
        </div>
        {hero.trustChips?.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {hero.trustChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-[var(--network-border)] bg-white/70 px-3 py-2 text-xs font-bold text-[var(--network-muted)]"
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <aside className="relative order-1 overflow-hidden rounded-lg border border-[var(--network-border)] bg-[var(--network-surface)] p-3 shadow-[0_24px_70px_rgba(20,55,47,0.18)] sm:p-4 lg:order-2">
        <div className="relative grid h-full min-h-[420px] content-between gap-4 sm:min-h-[500px]">
          <div className="relative aspect-[16/11] overflow-hidden rounded-lg border border-[var(--network-border)] bg-black/[0.1] sm:aspect-[16/10] lg:aspect-auto lg:min-h-[360px]">
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
            <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.68))] p-4 sm:p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--destination-accent-2)]">
                {hero.media?.eyebrow || theme.brandName}
              </div>
              <h2 className="mt-2 max-w-xl text-2xl font-black leading-[0.98] tracking-normal text-white sm:text-4xl">
                {hero.media?.title || "Plan the tour around the trip."}
              </h2>
            </div>
          </div>
          <div className="px-1 pb-1 sm:px-2">
            <p className="text-sm font-semibold leading-7 text-[var(--network-muted)]">
              {hero.media?.body || "Match the tour to pickup, weather, group fit, and timing before opening inventory."}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {(hero.media?.rows || []).map((row) => (
              <div
                key={row.label}
                className="rounded-lg border border-[var(--network-border)] bg-white/70 p-3"
              >
                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--destination-accent)]">
                  {row.label}
                </div>
                <div className="mt-1 text-sm font-black leading-5 text-[var(--network-text)]">{row.value}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
