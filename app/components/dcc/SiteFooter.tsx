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
  { href: "/tours", label: "Find Tours & Activities" },
  { href: "/cruises/fit", label: "Help Me Choose a Cruise" },
  { href: "/ports", label: "Cruise Ports" },
  { href: "/go/dcc-to-cruise-promenade", label: "Plan a Cruise with My Group" },
  { href: "/routes/denver-breckenridge", label: "Denver–Breckenridge Ride Guide" },
  { href: "/new-orleans/tours", label: "New Orleans Tours" },
  { href: "/las-vegas/tours", label: "Las Vegas Tours" },
  { href: "/ports/juneau", label: "Juneau Port Guide" },
  { href: "/red-rocks", label: "Red Rocks Guide" },
];

const SYSTEM_LINKS: FooterLink[] = [
  { href: "/about", label: "How We Check & Sources" },
  { href: "/operators", label: "For tour operators" },
  { href: "/operators/onboarding", label: "Operator Onboarding" },
  { href: "/developers", label: "Developers & OpenAPI" },
  { href: "/openapi.json", label: "OpenAPI 3.1 Spec" },
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
                : "Source-backed travel decision engine. Practical constraints, cited evidence, and live environmental conditions."}
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
            <Link href="/operators">For tour operators</Link>
            <span className="dcc-site-footer__divider">/</span>
            <Link href="/affiliate-disclosure">Affiliate Disclosure</Link>
            <span className="dcc-site-footer__divider">/</span>
            <Link href="/privacy">Privacy</Link>
            <span className="dcc-site-footer__divider">/</span>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
