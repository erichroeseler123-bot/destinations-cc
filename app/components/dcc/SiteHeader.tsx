"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Overview" },
  { href: "/network", label: "Routing" },
  { href: "/internal/telemetry", label: "Metrics" },
  { href: "/command", label: "Governance" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  if (pathname === "/sedona/jeep-tours") return null;

  return (
    <header className="dcc-site-header">
      <div className="dcc-site-header__inner">
        <div className="dcc-site-header__brand">
          <Link href="/" className="dcc-site-header__brand-mark" aria-label="Destination Command Center home">
            DCC<span className="dcc-site-header__dot">.</span>
          </Link>
          <span className="dcc-site-header__status">SYS_OK</span>
        </div>

        <nav className="dcc-site-header__nav" aria-label="Primary">
          {PRIMARY_NAV.map((item, index) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            return (
              <span key={item.href} className="dcc-site-header__nav-slot">
                {index > 0 ? <span className="dcc-site-header__divider">/</span> : null}
                <Link href={item.href} className={`dcc-site-header__nav-item ${isActive ? "is-active" : ""}`}>
                  {item.label}
                </Link>
              </span>
            );
          })}
        </nav>

        <div className="dcc-site-header__actions">
          <Link href="/operator/register" className="dcc-site-header__login">
            Sign In
          </Link>
          <Link href="/command" className="dcc-site-header__button">
            Launch Console
          </Link>
        </div>
      </div>
    </header>
  );
}
