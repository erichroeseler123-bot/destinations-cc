"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SocialLinks } from "@/app/components/shared/SocialLinks";
import { SITE_CONFIG } from "@/src/data/site-config";

const FOOTER_LINKS = [
  { href: "/red-rocks-transportation", label: "Red Rocks Transportation" },
  { href: "/sedona/jeep-tours", label: "Sedona Jeep Tours" },
  { href: "/juneau/helicopter-tours", label: "Juneau Helicopter Tours" },
  { href: "/juneau/whale-watching-tours", label: "Juneau Whale Watching" },
  { href: "/command", label: "Command" },
];

export default function SiteFooter() {
  const pathname = usePathname();
  const brandKey = SITE_CONFIG.socialBrandKey;

  if (pathname === "/sedona/jeep-tours") return null;

  return (
    <footer className="dcc-site-footer">
      <div className="dcc-site-footer__inner">
        <div className="dcc-site-footer__panel">
          <div className="dcc-site-footer__brand">
            <Image
              src="/brand/dcc-logo-horizontal.svg"
              alt="Destination Command Center"
              className="dcc-site-footer__logo"
              width={210}
              height={44}
              sizes="210px"
              style={{ width: "210px", height: "44px" }}
            />
            <div className="dcc-site-footer__eyebrow">Destination Command Center</div>
            <div className="dcc-site-footer__title">Decision corridors compressed into a dominant visible system.</div>
            <p className="dcc-site-footer__copy">
              Transportation and activity lanes organized to remove the wrong choice before it costs the trip.
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
