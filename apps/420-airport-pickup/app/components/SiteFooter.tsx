import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell site-footer-inner">
        <div className="site-footer-copy">
          <p className="eyebrow">420 Friendly Airport Pickup</p>
          <p>Private Colorado airport transportation from DEN and COS, with optional lawful 21+ retail-stop planning when practical.</p>
        </div>
        <nav className="site-footer-links" aria-label="Footer">
          <Link href="/colorado">DEN destinations</Link>
          <Link href="/colorado-springs-airport">COS destinations</Link>
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
