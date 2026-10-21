"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/helicopter", label: "Book Tours" },
  { href: "/temsco-vs-coastal-vs-northstar-juneau", label: "Compare Operators" },
  { href: "/helicopter-waitlist", label: "Ship Port Timing" },
  { href: "/juneau-helicopter-tour-sold-out", label: "Sold Out Alerts" },
  { href: "/juneau/what-to-do-if-helicopter-tour-canceled", label: "Weather Backups" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
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
          <span className="site-brand-tag">Alaska cruise excursion booking &amp; flight coordination.</span>
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
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
