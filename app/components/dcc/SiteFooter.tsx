import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/cities", label: "Cities" },
  { href: "/ports", label: "Ports" },
  { href: "/tours", label: "Tours & Activities" },
  { href: "/about", label: "About" },
  { href: "/ai", label: "For AI" },
  { href: "/alerts", label: "Trend Watch" },
];

export default function SiteFooter() {
  return (
    <footer className="dcc-site-footer">
      <div className="dcc-site-footer__inner">
        <div className="dcc-site-footer__panel">
          <div className="dcc-site-footer__brand">
            <img
              src="/brand/dcc-logo-horizontal.svg"
              alt="Destination Command Center"
              className="dcc-site-footer__logo"
            />
            <div className="dcc-site-footer__eyebrow">Destination Command Center</div>
            <div className="dcc-site-footer__title">Destination guides with the same premium planning layer as the city pages.</div>
            <p className="dcc-site-footer__copy">
              Shows, tours, attractions, transportation, and trip planning organized as decision-first destination intel.
            </p>
          </div>
          <nav aria-label="Footer" className="dcc-site-footer__nav">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="dcc-site-footer__link">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
