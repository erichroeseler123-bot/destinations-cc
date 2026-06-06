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
  { href: "/operators", label: "Documentation" },
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

      <style jsx global>{`
        .dcc-site-footer {
          border-top: 1px solid var(--dcc-tech-border, #1e293b);
          background-color: var(--dcc-tech-bg-surface, #101622);
          margin-top: auto;
          padding: 0;
        }

        .dcc-site-footer__inner {
          padding: 4rem 2rem 2rem;
        }

        .dcc-site-footer__matrix {
          display: grid;
          grid-template-columns: 2fr repeat(3, 1fr);
          gap: 3rem;
          border-bottom: 1px solid var(--dcc-tech-border, #1e293b);
          padding-bottom: 3rem;
        }

        .dcc-site-footer__brand,
        .dcc-site-footer__brand:hover {
          color: var(--dcc-tech-text, #f8fafc);
          display: inline-flex;
          align-items: center;
          gap: 0;
          font-family: var(--font-sans), system-ui, sans-serif;
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1;
          text-decoration: none;
        }

        .dcc-site-footer__dot {
          color: var(--dcc-tech-tangerine, #f97316);
        }

        .dcc-site-footer__brand-desc {
          color: var(--dcc-tech-muted, #64748b);
          font-size: 0.85rem;
          line-height: 1.5;
          margin: 0.75rem 0 0;
          max-width: 260px;
        }

        .dcc-site-footer__column h5 {
          color: var(--dcc-tech-tangerine, #f97316);
          font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.8rem;
          font-weight: 400;
          margin: 0 0 1.2rem;
        }

        .dcc-site-footer__column ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .dcc-site-footer__column li {
          margin-bottom: 0.7rem;
        }

        .dcc-site-footer__column a {
          color: var(--dcc-tech-muted, #64748b);
          font-size: 0.85rem;
          text-decoration: none;
          transition: var(--dcc-tech-transition, all 0.2s ease);
        }

        .dcc-site-footer__column a:hover {
          color: var(--dcc-tech-text, #f8fafc);
        }

        .dcc-site-footer__social-grid {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .dcc-site-footer__social-tag {
          border: 1px solid var(--dcc-tech-border, #1e293b);
          border-radius: 4px;
          background-color: var(--dcc-tech-bg-main, #0a0e14);
          color: var(--dcc-tech-muted, #64748b);
          font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
          padding: 0.4rem 0.75rem;
          text-align: center;
          text-decoration: none;
          transition: var(--dcc-tech-transition, all 0.2s ease);
        }

        .dcc-site-footer__social-tag:hover {
          border-color: var(--dcc-tech-muted, #64748b);
          color: var(--dcc-tech-text, #f8fafc);
        }

        .dcc-site-footer__basement {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: var(--dcc-tech-muted, #64748b);
          font-size: 0.8rem;
          padding-top: 2rem;
        }

        .dcc-site-footer__legal-links {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }

        .dcc-site-footer__legal-links a {
          color: inherit;
          text-decoration: none;
          transition: var(--dcc-tech-transition, all 0.2s ease);
        }

        .dcc-site-footer__legal-links a:hover {
          color: var(--dcc-tech-text, #f8fafc);
        }

        .dcc-site-footer__divider {
          color: var(--dcc-tech-border, #1e293b);
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 0.85rem;
        }

        @media (max-width: 860px) {
          .dcc-site-footer__inner {
            padding: 3rem 1rem 2rem;
          }

          .dcc-site-footer__matrix {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .dcc-site-footer__basement {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}
