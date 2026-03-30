import Link from "next/link";
import { SocialLinks } from "@/app/components/shared/SocialLinks";
import { SITE_CONFIG } from "@/src/data/site-config";

const FOOTER_LINKS = [
  { href: "/cities", label: "Cities" },
  { href: "/ports", label: "Ports" },
  { href: "/tours", label: "Tours & Activities" },
  { href: "/crawl-paths", label: "Crawl Paths" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/ai", label: "For AI" },
  { href: "/alerts", label: "Trend Watch" },
];

export default function SiteFooter() {
  const brandKey = SITE_CONFIG.socialBrandKey;

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
            <SocialLinks brandKey={brandKey} mode="footer" showLabels className="mt-4" />
          </div>
          <nav aria-label="Footer" className="dcc-site-footer__nav">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="dcc-site-footer__link">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="dcc-site-footer__bottom">
            <span>Denver, Colorado</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
