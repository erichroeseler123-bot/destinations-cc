import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <div className="site-shell site-header-inner">
        <Link href="/" className="site-brand">
          <span className="site-brand-title">Juneau Flight Deck</span>
          <span className="site-brand-tag">Alaska cruise excursion booking &amp; flight coordination.</span>
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <Link href="/helicopter">Book Tours</Link>
          <Link href="/temsco-vs-coastal-vs-northstar-juneau">Compare Operators</Link>
          <Link href="/helicopter-waitlist">Ship Port Timing</Link>
          <Link href="/juneau-helicopter-tour-sold-out">Sold Out Alerts</Link>
          <Link href="/juneau/what-to-do-if-helicopter-tour-canceled">Weather Backups</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </header>
  );
}
