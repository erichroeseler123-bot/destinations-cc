"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SiteHeaderSearch from "@/app/components/dcc/SiteHeaderSearch";
import type { EntrySurface } from "@/src/data/entry-surfaces-types";

type NavItem = {
  href: string;
  label: string;
  description: string;
};

const PRIMARY_NAV: NavItem[] = [
  { href: "/red-rocks-transportation", label: "Red Rocks", description: "Primary transportation corridor and authority node." },
  { href: "/sedona/jeep-tours", label: "Sedona", description: "Decision-first activity lane for the strongest Sedona fit." },
  { href: "/juneau/helicopter-tours", label: "Juneau Helicopter", description: "Air-tour corridor tuned for the cleanest fit decision." },
  { href: "/juneau/whale-watching-tours", label: "Juneau Whale", description: "Wildlife corridor built to remove the wrong tour choice." },
  { href: "/command", label: "Command", description: "System view of the active entry surfaces." },
];

export default function SiteHeader({ cities }: { cities: EntrySurface[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname === "/sedona/jeep-tours") return null;

  return (
    <header className="dcc-site-header">
      <div className="dcc-site-header__inner">
        <div className="dcc-site-header__brand-row">
          <Link href="/" className="dcc-site-header__brand" aria-label="Destination Command Center home">
            <Image
              src="/brand/dcc-logo-horizontal.svg"
              alt="Destination Command Center"
              className="dcc-site-header__logo"
              width={210}
              height={44}
              sizes="210px"
              style={{ width: "210px", height: "44px" }}
              priority
            />
            <span className="dcc-site-header__eyebrow">Shows, tours, attractions, and transportation</span>
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
            Decision-first corridors for travelers who need the correct move, not more browsing.
          </p>
          <Link href="/red-rocks-transportation" className="dcc-site-header__utility-link">
            Strongest corridor
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
