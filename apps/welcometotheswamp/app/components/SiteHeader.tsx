"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/content";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <Link href="/" className="brand-block" aria-label="Welcome to the Swamp home">
        <span className="brand-kicker">New Orleans swamp guide</span>
        <span className="brand-name">Welcome to the Swamp</span>
      </Link>
      <nav className="nav-links" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`nav-pill${active ? " is-active" : ""}`}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
