import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell site-footer-inner">
        <div className="site-footer-copy">
          <p className="eyebrow">420 Friendly Airport Pickup</p>
          <p>Book the Denver arrival route that fits without reopening the whole transport market.</p>
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
