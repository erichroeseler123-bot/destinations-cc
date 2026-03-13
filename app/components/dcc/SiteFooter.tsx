import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/cities", label: "Cities" },
  { href: "/ports", label: "Ports & Hubs" },
  { href: "/tours", label: "Tours & Activities" },
  { href: "/authority", label: "Route Intel" },
  { href: "/alerts", label: "Trend Watch" },
];

export default function SiteFooter() {
  return (
    <footer className="dcc-site-footer">
      <div className="dcc-site-footer__inner">
        <div className="dcc-site-footer__brand">
          <div className="dcc-site-footer__title">Destination Command Center</div>
          <p className="dcc-site-footer__copy">
            Verified destination logistics, routing, and booking intelligence for travelers who want fewer surprises.
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
    </footer>
  );
}
