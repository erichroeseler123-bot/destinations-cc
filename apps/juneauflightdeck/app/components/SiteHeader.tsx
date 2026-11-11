"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/helicopter", label: "Glacier Flights", cta: false },
  { href: "/temsco-vs-coastal-vs-northstar-juneau", label: "Compare Operators", cta: false },
  { href: "/helicopter-waitlist", label: "Port Timing", cta: false },
  { href: "/juneau/what-to-do-if-helicopter-tour-canceled", label: "Weather Backups", cta: false },
  { href: "/#concierge-request", label: "Request a Flight", cta: true },
] as const;

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <div className="site-shell site-header-inner">
        <Link
          href="/"
          className="site-brand"
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <span className="site-brand-title">Juneau Flight Deck</span>
          <span className="site-brand-tag">Juneau Glacier Flights &amp; Concierge</span>
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={item.cta ? "site-nav-cta" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
