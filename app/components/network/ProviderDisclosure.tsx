import type { ProviderDisclosureConfig } from "./types";

export function ProviderDisclosure({ config }: { config?: ProviderDisclosureConfig }) {
  if (!config) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <article className="grid gap-5 rounded-lg border border-[var(--network-border)] bg-white/55 p-5 shadow-[0_12px_35px_rgba(20,55,47,0.08)] md:grid-cols-[0.85fr_1.15fr] md:p-6">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--destination-accent)]">
            Before you book
          </div>
          <h2 className="mt-3 text-2xl font-black leading-tight text-[var(--network-text)]">
            {config.label}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--network-muted)]">{config.body}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--network-border)] bg-white/65 p-4">
            <h3 className="text-sm font-black text-[var(--network-text)]">What this page helps with</h3>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--network-muted)]">
              {config.allowedClaims.map((claim) => (
                <li key={claim}>{claim}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-[var(--network-border)] bg-white/65 p-4">
            <h3 className="text-sm font-black text-[var(--network-text)]">What to confirm before booking</h3>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--network-muted)]">
              {config.notClaimed.map((claim) => (
                <li key={claim}>{claim}</li>
              ))}
            </ul>
          </div>
        </div>
      </article>
    </section>
  );
}
