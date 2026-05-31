"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SocialLinks } from "@/app/components/shared/SocialLinks";
import { SITE_CONFIG } from "@/src/data/site-config";
import {
  buildNetworkSatelliteHref,
  type NetworkSatelliteId,
} from "@/lib/dcc/contracts/networkSatellites";

const FOOTER_LINKS = [
  { href: "/red-rocks-transportation", label: "Red Rocks Transportation" },
  { href: "/sedona/jeep-tours", label: "Sedona Jeep Tours" },
  { href: "/juneau/helicopter-tours", label: "Juneau Helicopter Tours" },
  { href: "/juneau/whale-watching-tours", label: "Juneau Whale Watching" },
  { href: "/network", label: "How It Works" },
  { href: "/operators", label: "For Operators" },
];

// Intent-based satellite links. Each routes an accepted decision into the
// satellite that owns the corridor, with telemetry context preserved.
const FOOTER_SATELLITES: Array<{
  id: NetworkSatelliteId;
  label: string;
  action: string;
}> = [
  {
    id: "partyatredrocks",
    label: "Red Rocks rides",
    action: "open_red_rocks_transport_lane",
  },
  {
    id: "juneauflightdeck",
    label: "Juneau excursions",
    action: "open_juneau_port_excursion_lane",
  },
  {
    id: "welcometotheswamp",
    label: "New Orleans swamp tours",
    action: "open_new_orleans_swamp_lane",
  },
  {
    id: "gosno",
    label: "Colorado mountain transfers",
    action: "open_colorado_mountain_transfer_lane",
  },
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
          <nav aria-label="Network satellites" className="dcc-site-footer__nav">
            <span className="dcc-site-footer__link" aria-hidden="true" style={{ opacity: 0.55 }}>
              Network front doors
            </span>
            {FOOTER_SATELLITES.map((satellite) => (
              <a
                key={satellite.id}
                href={buildNetworkSatelliteHref(satellite.id, {
                  sourcePage: pathname || "/",
                  action: satellite.action,
                  cta: `footer-${satellite.id}`,
                  routeTarget: "satellite",
                  revenueStage: "intent",
                })}
                rel="noopener"
                className="dcc-site-footer__link"
              >
                {satellite.label}
              </a>
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
