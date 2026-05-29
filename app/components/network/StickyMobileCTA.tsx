import type { StickyMobileCtaConfig } from "./types";
import { NetworkLink } from "./NetworkLink";

export function StickyMobileCTA({ config }: { config?: StickyMobileCtaConfig }) {
  if (!config?.enabled) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--network-border)] bg-[rgba(4,16,13,0.94)] px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur md:hidden">
      <NetworkLink
        cta={config}
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--destination-accent-2)] px-5 text-center text-xs font-black uppercase tracking-[0.14em] text-[var(--destination-accent-text)] shadow-[0_16px_40px_rgba(0,0,0,0.28)]"
      />
      {config.disclosureLabel ? (
        <p className="mt-2 text-center text-[11px] font-semibold text-[var(--network-muted)]">
          {config.disclosureLabel}
        </p>
      ) : null}
    </div>
  );
}
