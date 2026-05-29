import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell site-footer-inner">
        <div className="site-footer-copy">
          <p className="eyebrow">Juneau Flight Deck</p>
          <p>
            Practical Juneau shore-day help for glacier flights, whale watching backups,
            weather pivots, and cruise return timing.
          </p>
          <p>Current prices, availability, pickup details, and final terms stay on the provider booking page.</p>
        </div>
        <nav className="site-footer-links" aria-label="Footer">
          <Link href="/about">About</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/privacy-policy">Privacy policy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
