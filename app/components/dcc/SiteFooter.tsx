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
  { href: "/juneau", label: "Juneau Reference" },
  { href: "/red-rocks", label: "Red Rocks Reference" },
  { href: "/routes/denver-breckenridge", label: "Denver–Breckenridge Corridor" },
  { href: "/ports", label: "Cruise Ports" },
  { href: "/venues", label: "Venues" },
  { href: "/transportation/colorado", label: "Colorado Transit" },
];

const SYSTEM_LINKS: FooterLink[] = [
  { href: "/about", label: "About & Capability Matrix" },
  { href: "/widget", label: "Venue Widget" },
  { href: "/pricing", label: "Commercial Pricing" },
  { href: "/developers", label: "Coordinate API" },
  { href: "/scope.json", label: "Scope Contract" },
  { href: "/agent.json", label: "Agent Manifest" },
  { href: "/llms.txt", label: "LLM Guidance" },
];

const FOOTER_SATELLITES: Array<{
  id: NetworkSatelliteId;
  label: string;
  action: string;
}> = [
  {
    id: "partyatredrocks",
    label: "Red Rocks private transportation",
    action: "open_red_rocks_transport_lane",
  },
  {
    id: "juneauflightdeck",
    label: "Juneau flightseeing",
    action: "open_juneau_port_excursion_lane",
  },
  {
    id: "welcometotheswamp",
    label: "New Orleans tours",
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

  const isConsoleView =
    pathname === "/command" ||
    pathname?.startsWith("/internal") ||
    pathname === "/network" ||
    pathname === "/governance";

  return (
    <footer className="dcc-site-footer">
      <div className="dcc-site-footer__inner">
        <div className="dcc-site-footer__matrix">
          <div className="dcc-site-footer__brand-block">
            <Link href="/" className="dcc-site-footer__brand" aria-label="Destination Command Center home">
              DCC<span className="dcc-site-footer__dot">.</span>
            </Link>
            <p className="dcc-site-footer__brand-desc">
              {isConsoleView
                ? "Destination intelligence, network governance, and travel-system diagnostics."
                : "Travel decisions powered by live context, destination knowledge, and specialist handoffs."}
            </p>
          </div>

          <div className="dcc-site-footer__column">
            <h5>{isConsoleView ? ".travel" : "Explore"}</h5>
            <ul>
              {ENGINE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="dcc-site-footer__column">
            <h5>{isConsoleView ? ".data" : "DCC Data"}</h5>
            <ul>
              {SYSTEM_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="dcc-site-footer__column">
            <h5>{isConsoleView ? ".network" : "Specialists"}</h5>
            <div className="dcc-site-footer__social-grid">
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
                  className="dcc-site-footer__social-tag"
                >
                  {satellite.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="dcc-site-footer__basement">
          <div className="dcc-site-footer__copyright">© 2026 DCC. All rights reserved.</div>
          <div className="dcc-site-footer__legal-links">
            <Link href="/privacy">Privacy</Link>
            <span className="dcc-site-footer__divider">/</span>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
