import type { NetworkFooterConfig, NetworkThemeConfig } from "./types";
import { NetworkLink } from "./NetworkLink";

export function NetworkFooter({ config, theme }: { config?: NetworkFooterConfig; theme: NetworkThemeConfig }) {
  if (!config) return null;

  return (
    <footer className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="rounded-lg border border-[var(--network-border)] bg-[var(--network-surface-soft)] p-5 md:p-6">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--destination-accent-2)]">
          {config.eyebrow}
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h2 className="text-2xl font-black text-[var(--network-text)]">{theme.brandName}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--network-muted)]">{config.body}</p>
          </div>
          <nav className="flex flex-wrap gap-3" aria-label={`${theme.brandName} links`}>
            {config.links.map((link) => (
              <NetworkLink
                key={link.href}
                cta={link}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--network-border)] bg-white/[0.045] px-4 text-xs font-black uppercase tracking-[0.14em] text-[var(--network-text)] transition hover:bg-white/[0.08]"
              />
            ))}
          </nav>
        </div>
        {theme.id === "wno" ? (
          <p className="mt-5 border-t border-[var(--network-border)] pt-4 font-[var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-[var(--network-muted)]">
            Part of the Destination Command Center network. Local tourism storefront, governed visual system.
          </p>
        ) : null}
      </div>
    </footer>
  );
}
