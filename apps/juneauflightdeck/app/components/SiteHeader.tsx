"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/helicopter", label: "Glacier Flights", cta: false },
  { href: "/juneau-glacier-flight-weather", label: "Flight Weather", cta: false },
  { href: "/temsco-vs-coastal-vs-northstar-juneau", label: "Compare Operators", cta: false },
  { href: "/helicopter-waitlist", label: "Port Timing", cta: false },
  { href: "/juneau/what-to-do-if-helicopter-tour-canceled", label: "Weather Backups", cta: false },
  { href: "/#concierge-request", label: "Request a Flight", cta: true },
] as const;

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="site-header">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="site-shell site-header-inner">
        <div className="site-header-bar">
          <Link
            href="/"
            className="site-brand"
            aria-current={pathname === "/" ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            <span className="site-brand-title">Juneau Flight Deck</span>
            <span className="site-brand-tag">Independent Flight Guide &amp; Concierge</span>
          </Link>

          <button
            type="button"
            className="site-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="primary-site-nav"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span className="site-menu-toggle-icon" aria-hidden="true">
              {menuOpen ? "✕" : "☰"}
            </span>
            <span className="site-menu-toggle-label">{menuOpen ? "Close" : "Menu"}</span>
          </button>
        </div>

        <nav
          id="primary-site-nav"
          className={`site-nav${menuOpen ? " is-open" : ""}`}
          aria-label="Primary"
        >
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={item.cta ? "site-nav-cta" : undefined}
                onClick={() => setMenuOpen(false)}
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
