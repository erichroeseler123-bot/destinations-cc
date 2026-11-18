"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/swamp-tours", label: "Swamp Tours", cta: false },
  { href: "/city-tours", label: "French Quarter", cta: false },
  { href: "/plantation-tours", label: "History", cta: false },
  { href: "/areas", label: "Areas", cta: false },
  { href: "/operators", label: "Operators", cta: false },
  { href: "/help-me-choose", label: "Help Me Choose", cta: true },
] as const;

export function WnoPublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <header className="wno-header">
      <a href="#wno-main-content" className="wno-skip">
        Skip to main content
      </a>
      <div className="wno-container wno-header-inner">
        <Link
          href="/"
          className="wno-brand"
          aria-label="Welcome to New Orleans Tours — Home"
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <span className="wno-brand-title wno-brand-title-desktop">
            Welcome to New Orleans Tours
          </span>
          <span className="wno-brand-title wno-brand-title-mobile" aria-hidden="true">
            New Orleans Tours
          </span>
          <span className="wno-brand-sub">Bayous, French Quarter, Jazz &amp; History</span>
        </Link>

        <nav className="wno-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || Boolean(pathname?.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                data-active={active ? "true" : undefined}
                className={item.cta ? "wno-nav-cta" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="wno-mobile-menu-toggle"
          aria-expanded={mobileOpen}
          aria-controls="wno-mobile-nav-drawer"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          <span className="wno-mobile-menu-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="wno-mobile-menu-label">{mobileOpen ? "Close" : "Menu"}</span>
        </button>
      </div>

      {mobileOpen ? (
        <nav
          id="wno-mobile-nav-drawer"
          aria-label="Mobile Primary"
          className="wno-mobile-nav-drawer"
        >
          <div className="wno-container wno-mobile-nav-list">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={item.cta ? "wno-mobile-nav-cta" : "wno-mobile-nav-link"}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}

export function WnoPublicFooter() {
  return (
    <footer className="wno-footer">
      <div className="wno-container">
        <div className="wno-footer-top">
          <div style={{ maxWidth: 460 }}>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: "12.5px",
                fontWeight: 850,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#e4c17a",
              }}
            >
              Welcome to New Orleans Tours
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                lineHeight: 1.58,
                color: "rgba(250, 246, 238, 0.86)",
              }}
            >
              Curated New Orleans tours with clear pickup windows, verified local operators, and
              human concierge help at{" "}
              <a
                href="tel:+15044849687"
                style={{ color: "#e4c17a", fontWeight: 800, textDecoration: "underline" }}
              >
                504-484-9687
              </a>
              .
            </p>
          </div>

          <nav aria-label="Footer" className="wno-footer-links">
            <Link href="/swamp-tours">Swamp Tours</Link>
            <Link href="/city-tours">French Quarter</Link>
            <Link href="/riverboat-cruises">Jazz Riverboats</Link>
            <Link href="/plantation-tours">River Road History</Link>
            <Link href="/areas">Areas &amp; Basins</Link>
            <Link href="/operators">Operators</Link>
            <Link href="/tours">All Tours</Link>
            <Link href="/help-me-choose">Concierge Help</Link>
            <Link href="/about">About</Link>
            <Link href="/privacy">Privacy</Link>
          </nav>
        </div>

        <div className="wno-footer-bottom">
          <span>
            &copy; {new Date().getFullYear()} Welcome to New Orleans Tours · Official FareHarbor,
            Viator &amp; GetYourGuide partner (we may earn a commission at no extra cost to you).
          </span>
          <span>New Orleans, Louisiana</span>
        </div>
      </div>
    </footer>
  );
}
