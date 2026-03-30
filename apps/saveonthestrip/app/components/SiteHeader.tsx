"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const showLogo = pathname !== "/";

  return (
    <header className={`nav${showLogo ? "" : " nav-home"}`}>
      {showLogo ? (
        <Link href="/" className="brand-mark" aria-label="Save On The Strip home">
          <Image
            src="/SOTS_LOGO_MARK.svg"
            alt="$ave on the Strip"
            width={320}
            height={110}
            className="brand-logo"
            priority
          />
        </Link>
      ) : (
        <div className="brand-spacer" aria-hidden="true" />
      )}
      <nav className="nav-links">
        <Link href="/shows" className="pill">
          Shows
        </Link>
        <Link href="/tours" className="pill">
          Tours
        </Link>
        <Link href="/deals" className="pill">
          Deals
        </Link>
        <Link href="/timeshares" className="pill">
          Timeshares
        </Link>
      </nav>
    </header>
  );
}
