import type { CategoryGridConfig } from "./types";
import { NetworkLink } from "./NetworkLink";

export function CategoryGrid({ config }: { config?: CategoryGridConfig }) {
  if (!config?.items.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--destination-accent-2)]">
            {config.eyebrow}
          </div>
          <h2 className="mt-3 text-3xl font-black leading-[0.98] tracking-normal text-[var(--network-text)] sm:text-4xl">
            {config.title}
          </h2>
        </div>
        {config.body ? (
          <p className="max-w-xl text-sm leading-7 text-[var(--network-muted)]">{config.body}</p>
        ) : null}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {config.items.map((item) => (
          <article
            key={item.id}
            id={item.id}
            className="flex min-h-[230px] flex-col rounded-lg border border-[var(--network-border)] bg-[var(--network-surface)] p-5 shadow-[0_14px_35px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:border-[var(--destination-accent)] hover:bg-white/[0.09]"
          >
            <h3 className="text-xl font-black leading-tight text-[var(--network-text)]">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--network-muted)]">{item.body}</p>
            <NetworkLink
              cta={item.cta}
              className="mt-auto inline-flex min-h-11 items-center text-sm font-black text-[var(--destination-accent)] hover:text-[var(--network-text)]"
            />
          </article>
        ))}
      </div>
    </section>
  );
}
