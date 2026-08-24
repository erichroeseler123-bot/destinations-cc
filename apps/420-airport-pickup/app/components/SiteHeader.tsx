import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-shell site-header-inner">
        <Link href="/" className="site-brand">
          <span className="site-brand-title">420 Friendly Airport Pickup</span>
          <span className="site-brand-tag">Colorado airport transportation from DEN and COS.</span>
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <Link href="/">Denver</Link>
          <Link href="/colorado-springs-airport">Colorado Springs</Link>
          <Link href="/colorado">Destinations</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </header>
  );
}
