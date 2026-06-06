"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  buildNetworkSatelliteHref,
  type NetworkSatelliteId,
} from "@/lib/dcc/contracts/networkSatellites";

type FooterLink = {
  href: string;
  label: string;
};

const ENGINE_LINKS: FooterLink[] = [
  { href: "/", label: "Core Index" },
  { href: "/network", label: "Spatial Core" },
  { href: "/command", label: "Drift Monitor" },
];

const SYSTEM_LINKS: FooterLink[] = [
  { href: "/operator/register", label: "Documentation" },
  { href: "/agent.json", label: "API Node Spec" },
  { href: "/llms.txt", label: "Security Base" },
];

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

  if (pathname === "/sedona/jeep-tours") return null;

  return (
    <footer className="dcc-site-footer">
      <div className="dcc-site-footer__inner">
        <div className="dcc-site-footer__matrix">
          <div className="dcc-site-footer__brand-block">
            <Link href="/" className="dcc-site-footer__brand" aria-label="Destination Command Center home">
              DCC<span className="dcc-site-footer__dot">.</span>
            </Link>
            <p className="dcc-site-footer__brand-desc">
              Planetary routing, network orchestration, and system governance modules.
            </p>
          </div>

          <div className="dcc-site-footer__column">
            <h5>.engine</h5>
            <ul>
              {ENGINE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="dcc-site-footer__column">
            <h5>.system</h5>
            <ul>
              {SYSTEM_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="dcc-site-footer__column">
            <h5>.connect</h5>
            <div className="dcc-site-footer__social-grid">
              {FOOTER_SATELLITES.slice(0, 2).map((satellite) => (
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
                  className="dcc-site-footer__social-tag"
                >
                  {satellite.id === "partyatredrocks" ? "TERMINAL" : "DATABASE"}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="dcc-site-footer__basement">
          <div className="dcc-site-footer__copyright">© 2026 DCC. All rights reserved.</div>
          <div className="dcc-site-footer__legal-links">
            <Link href="/privacy">Privacy Protocol</Link>
            <span className="dcc-site-footer__divider">/</span>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
