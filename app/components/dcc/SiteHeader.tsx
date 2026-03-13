"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SiteHeaderSearch from "@/app/components/dcc/SiteHeaderSearch";

type HeaderCity = {
  slug: string;
  name: string;
  canonicalPath?: string;
  state?: string;
};

type NavItem = {
  href: string;
  label: string;
  description: string;
};

const PRIMARY_NAV: NavItem[] = [
  { href: "/cities", label: "Cities", description: "Browse city hubs and high-intent destination nodes." },
  { href: "/ports", label: "Ports & Hubs", description: "Cruise ports, logistics anchors, and regional authority pages." },
  { href: "/tours", label: "Tours & Activities", description: "Bookable tours, attractions, and experience lanes." },
  { href: "/authority", label: "Route Intel", description: "Routing, constraints, staging, and reality checks." },
  { href: "/alerts", label: "Trend Watch", description: "Live travel signals, graph pulse, and event monitoring." },
];

export default function SiteHeader({ cities }: { cities: HeaderCity[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="dcc-site-header">
      <div className="dcc-site-header__inner">
        <div className="dcc-site-header__brand-row">
          <Link href="/" className="dcc-site-header__brand" aria-label="Destination Command Center home">
            <span className="dcc-site-header__eyebrow">Verified route and destination intelligence</span>
            <span className="dcc-site-header__title">Destination Command Center</span>
          </Link>

          <button
            type="button"
            className="dcc-site-header__menu-button"
            aria-expanded={open}
            aria-controls="dcc-primary-nav"
            onClick={() => setOpen((value) => !value)}
          >
            Menu
          </button>
        </div>

        <div className="dcc-site-header__topline">
          <p className="dcc-site-header__tagline">
            Verified destination logistics, routing, and booking intelligence.
          </p>
          <Link href="/road-trips" className="dcc-site-header__utility-link">
            Road Trips
          </Link>
        </div>

        <div className="dcc-site-header__search-row">
          <SiteHeaderSearch cities={cities} />
        </div>

        <nav
          id="dcc-primary-nav"
          aria-label="Primary"
          className={`dcc-site-header__nav ${open ? "is-open" : ""}`}
        >
          {PRIMARY_NAV.map((item) => {
            const isActive =
              item.href !== "/" &&
              pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`dcc-site-header__nav-link ${isActive ? "is-active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <span>{item.label}</span>
                <span className="dcc-site-header__nav-note">{item.description}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
