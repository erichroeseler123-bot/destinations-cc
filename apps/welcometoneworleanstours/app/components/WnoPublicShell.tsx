"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/swamp-tours", label: "Swamp Tours", cta: false },
  { href: "/city-tours", label: "French Quarter", cta: false },
  { href: "/food-tours", label: "Food & Music", cta: false },
  { href: "/plantation-tours", label: "History", cta: false },
  { href: "/help-me-choose", label: "Help Me Choose", cta: true },
] as const;

export function WnoPublicHeader() {
  const pathname = usePathname();

  return (
    <header className="wno-header">
      <a href="#wno-main-content" className="wno-skip">
        Skip to main content
      </a>
      <div className="wno-container wno-header-inner">
        <Link
          href="/"
          className="wno-brand"
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <span className="wno-brand-title">Welcome to New Orleans Tours</span>
          <span className="wno-brand-sub">Bayous, French Quarter, Jazz &amp; History</span>
        </Link>
        <nav className="wno-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={item.cta ? "wno-nav-cta" : undefined}
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
            <Link href="/plantation-tours">Plantations</Link>
            <Link href="/tours">All Tours</Link>
            <Link href="/help-me-choose">Concierge Help</Link>
            <Link href="/about">About</Link>
            <Link href="/privacy-policy">Privacy</Link>
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
