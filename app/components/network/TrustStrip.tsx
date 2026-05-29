import type { TrustStripConfig } from "./types";

export function TrustStrip({ config }: { config?: TrustStripConfig }) {
  if (!config?.items.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {config.items.map((item) => (
          <article
            key={item.id}
            className="min-h-[112px] rounded-lg border border-[var(--network-border)] bg-[var(--network-surface-soft)] p-4"
          >
            <h2 className="text-sm font-black text-[var(--network-text)]">{item.label}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--network-muted)]">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
