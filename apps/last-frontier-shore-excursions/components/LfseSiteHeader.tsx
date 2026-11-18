"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/southeast-alaska", label: "Southeast Alaska" },
  { href: "/ports", label: "Ports" },
  { href: "/operators", label: "Operators" },
  { href: "/tours", label: "Excursions" },
  { href: "/cruise-ships", label: "Cruise Ships" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact", isCta: true },
] as const;

export function LfseSiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className="lfse-site-header" data-testid="lfse-site-header">
      <div className="shell lfse-header-inner">
        <Link className="lfse-brand" href="/" onClick={() => setMenuOpen(false)}>
          <span className="lfse-brand-title">Last Frontier Shore Excursions</span>
          <span className="lfse-brand-sub">Southeast Alaska Port &amp; Excursion Guide</span>
        </Link>

        {/* Desktop Horizontal Navigation */}
        <nav className="lfse-nav-desktop" aria-label="Primary navigation">
          {NAV_LINKS.map((item) => {
            const isActive =
              pathname === item.href || Boolean(pathname?.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={
                  "isCta" in item && item.isCta
                    ? "lfse-nav-cta"
                    : isActive
                    ? "lfse-nav-link lfse-nav-link--active"
                    : "lfse-nav-link"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Compact Mobile Menu Toggle */}
        <button
          type="button"
          className="lfse-mobile-menu-btn"
          aria-expanded={menuOpen}
          aria-controls="lfse-mobile-nav-drawer"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setMenuOpen((prev) => !prev)}
          data-testid="lfse-mobile-menu-toggle"
        >
          <span className="lfse-mobile-menu-icon" aria-hidden="true">
            {menuOpen ? "✕" : "☰"}
          </span>
          <span>{menuOpen ? "Close" : "Menu"}</span>
        </button>
      </div>

      {/* Accessible Mobile Navigation Drawer */}
      <div
        id="lfse-mobile-nav-drawer"
        className={`lfse-mobile-drawer ${menuOpen ? "lfse-mobile-drawer--open" : ""}`}
        hidden={!menuOpen}
      >
        <nav className="shell lfse-mobile-nav" aria-label="Mobile navigation">
          {NAV_LINKS.map((item) => {
            const isActive =
              pathname === item.href || Boolean(pathname?.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
                className={
                  "isCta" in item && item.isCta
                    ? "lfse-mobile-nav-cta"
                    : isActive
                    ? "lfse-mobile-nav-link lfse-mobile-nav-link--active"
                    : "lfse-mobile-nav-link"
                }
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
