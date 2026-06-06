import { NetworkLink } from "./NetworkLink";
import type { CtaConfig } from "./types";

const navLinks: CtaConfig[] = [
  { label: "Swamp", href: "#swamp-wildlife" },
  { label: "History", href: "#history-plantation" },
  { label: "Food", href: "#food-cocktail" },
  { label: "Night", href: "#ghost-nightlife" },
  { label: "River", href: "#riverboat-cruises" },
];

export function WtonotBrandHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--network-border)] bg-[#120a18]/92 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <a href="#main-content" className="group grid gap-1 text-left no-underline">
          <span className="font-[var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d6a84f]">
            WTONOT / TOUR DESK
          </span>
          <span className="text-base font-black tracking-normal text-[#fff8e8] sm:text-lg">
            Welcome to New Orleans Tours
          </span>
        </a>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
          <nav className="flex gap-1 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0" aria-label="New Orleans tour topics">
            {navLinks.map((link) => (
              <NetworkLink
                key={link.href}
                cta={link}
                className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-white/10 bg-white/[0.035] px-3 font-[var(--font-mono)] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#eadcc2] transition hover:border-[#d6a84f]/55 hover:bg-[#d6a84f]/12 hover:text-white"
              />
            ))}
          </nav>
          <div className="flex gap-2">
            <NetworkLink
              cta={{ label: "Find My Tour", href: "#tour-finder" }}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#2457ff] px-4 text-center font-[var(--font-mono)] text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_12px_30px_rgba(36,87,255,0.28)] transition hover:bg-white hover:text-[#120a18]"
            />
            <NetworkLink
              cta={{ label: "Check Availability", href: "#bookable-tours" }}
              className="hidden min-h-10 items-center justify-center rounded-full bg-[#f28b2e] px-4 text-center font-[var(--font-mono)] text-[11px] font-bold uppercase tracking-[0.14em] text-[#160b05] shadow-[0_12px_30px_rgba(242,139,46,0.22)] transition hover:bg-white sm:inline-flex"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
