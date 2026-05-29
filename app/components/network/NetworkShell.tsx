import type { CSSProperties } from "react";
import type { NetworkThemeConfig, SectionSlot, StickyMobileCtaConfig } from "./types";
import { StickyMobileCTA } from "./StickyMobileCTA";

type NetworkShellProps = {
  theme: NetworkThemeConfig;
  stickyMobileCta?: StickyMobileCtaConfig;
  children: SectionSlot;
};

export function NetworkShell({ theme, stickyMobileCta, children }: NetworkShellProps) {
  const style = {
    "--network-bg": theme.background.base,
    "--network-surface": theme.background.surface,
    "--network-surface-soft": theme.background.surfaceSoft,
    "--network-border": theme.background.border,
    "--network-text": theme.background.text,
    "--network-muted": theme.background.muted,
    "--destination-accent": theme.accentPalette.primary,
    "--destination-accent-2": theme.accentPalette.secondary,
    "--destination-accent-soft": theme.accentPalette.soft,
    "--destination-accent-text": theme.accentPalette.textOnAccent,
  } as CSSProperties;

  return (
    <main
      style={style}
      className="min-h-screen overflow-x-hidden bg-[var(--network-bg)] pb-24 text-[var(--network-text)] md:pb-0"
      data-network-theme={theme.id}
      data-network-mode={theme.mode}
    >
      <div className="relative border-b border-[var(--network-border)] bg-[radial-gradient(circle_at_18%_8%,var(--destination-accent-soft),transparent_28%),radial-gradient(circle_at_82%_2%,rgba(242,191,103,0.14),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(0,0,0,0))]">
        {children}
      </div>
      <StickyMobileCTA config={stickyMobileCta} />
    </main>
  );
}
