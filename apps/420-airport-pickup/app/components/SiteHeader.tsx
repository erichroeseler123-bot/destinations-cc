import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-shell site-header-inner">
        <Link href="/" className="site-brand">
          <span className="site-brand-title">420 Friendly Airport Pickup</span>
          <span className="site-brand-tag">Denver arrival booking, kept simple.</span>
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <Link href="/">Book now</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </header>
  );
}
