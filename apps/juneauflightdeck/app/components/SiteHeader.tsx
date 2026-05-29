import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-shell site-header-inner">
        <Link href="/" className="site-brand">
          <span className="site-brand-title">Juneau Flight Deck</span>
          <span className="site-brand-tag">Glacier flights, whale backups, cruise-safe timing.</span>
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <Link href="/helicopter">Helicopter</Link>
          <Link href="/juneau-whale-watching-tours">Whales</Link>
          <Link href="/skagway/helicopter">Skagway</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </header>
  );
}
