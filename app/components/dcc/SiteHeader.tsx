"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { EntrySurface } from "@/src/data/entry-surfaces-types";

type NavItem = {
  href: string;
  label: string;
};

const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Overview" },
  { href: "/network", label: "Routing" },
  { href: "/internal/telemetry", label: "Metrics" },
  { href: "/command", label: "Governance" },
];

export default function SiteHeader(_props: { cities: EntrySurface[] }) {
  const pathname = usePathname();

  if (pathname === "/sedona/jeep-tours") return null;

  return (
    <header className="dcc-site-header">
      <div className="dcc-site-header__inner">
        <div className="dcc-site-header__brand">
          <Link href="/" className="dcc-site-header__brand-mark" aria-label="Destination Command Center home">
            DCC<span className="dcc-site-header__dot">.</span>
          </Link>
          <span className="dcc-site-header__status">SYS_OK</span>
        </div>

        <nav className="dcc-site-header__nav" aria-label="Primary">
          {PRIMARY_NAV.map((item, index) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            return (
              <span key={item.href} className="dcc-site-header__nav-slot">
                {index > 0 ? <span className="dcc-site-header__divider">/</span> : null}
                <Link href={item.href} className={`dcc-site-header__nav-item ${isActive ? "is-active" : ""}`}>
                  {item.label}
                </Link>
              </span>
            );
          })}
        </nav>

        <div className="dcc-site-header__actions">
          <Link href="/operators" className="dcc-site-header__login">
            Sign In
          </Link>
          <Link href="/command" className="dcc-site-header__button">
            Launch Console
          </Link>
        </div>
      </div>

      <style jsx global>{`
        :root {
          --dcc-tech-bg-main: #0a0e14;
          --dcc-tech-bg-surface: #101622;
          --dcc-tech-border: #1e293b;
          --dcc-tech-text: #f8fafc;
          --dcc-tech-muted: #64748b;
          --dcc-tech-cobalt: #2563eb;
          --dcc-tech-tangerine: #f97316;
          --dcc-tech-transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        body {
          background:
            radial-gradient(circle at 18% 12%, rgba(37, 99, 235, 0.22), transparent 32%),
            radial-gradient(circle at 86% 22%, rgba(249, 115, 22, 0.16), transparent 28%),
            linear-gradient(180deg, #0a0e14, #070a0f 62%, #0a0e14);
          color: var(--dcc-tech-text);
          font-family: var(--font-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .dcc-site-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          border-bottom: 1px solid var(--dcc-tech-border);
          background-color: rgba(10, 14, 20, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 0;
        }

        .dcc-site-header__inner,
        .dcc-site-shell__inner,
        .dcc-site-footer__inner {
          width: min(1200px, calc(100% - 4rem));
          margin: 0 auto;
        }

        .dcc-site-header__inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          padding: 1.2rem 2rem;
        }

        .dcc-site-header__brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: max-content;
        }

        .dcc-site-header__brand-mark {
          color: var(--dcc-tech-text);
          font-family: var(--font-sans), system-ui, sans-serif;
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1;
          text-decoration: none;
        }

        .dcc-site-header__dot {
          color: var(--dcc-tech-tangerine);
        }

        .dcc-site-header__status {
          border: 1px solid rgba(37, 99, 235, 0.2);
          border-radius: 3px;
          background-color: rgba(37, 99, 235, 0.1);
          color: var(--dcc-tech-cobalt);
          font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.65rem;
          font-weight: 500;
          line-height: 1;
          padding: 0.2rem 0.4rem;
        }

        .dcc-site-header__nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
          margin: 0;
        }

        .dcc-site-header__nav-slot {
          display: inline-flex;
          align-items: center;
          gap: 0.8rem;
        }

        .dcc-site-header__nav-item {
          color: var(--dcc-tech-muted);
          font-size: 0.9rem;
          font-weight: 500;
          text-decoration: none;
          transition: var(--dcc-tech-transition);
        }

        .dcc-site-header__nav-item:hover,
        .dcc-site-header__nav-item.is-active {
          color: var(--dcc-tech-text);
        }

        .dcc-site-header__divider {
          color: var(--dcc-tech-border);
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 0.85rem;
        }

        .dcc-site-header__actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          min-width: max-content;
        }

        .dcc-site-header__login {
          color: var(--dcc-tech-muted);
          font-size: 0.85rem;
          font-weight: 500;
          text-decoration: none;
          transition: var(--dcc-tech-transition);
        }

        .dcc-site-header__login:hover {
          color: var(--dcc-tech-text);
        }

        .dcc-site-header__button {
          border: 0;
          border-radius: 4px;
          background-color: var(--dcc-tech-cobalt);
          color: #ffffff;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: -0.2px;
          padding: 0.65rem 1.25rem;
          text-decoration: none;
          transition: var(--dcc-tech-transition);
        }

        .dcc-site-header__button:hover {
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          transform: translateY(-1px);
        }

        .dcc-site-shell {
          min-height: 100vh;
          padding-top: 2rem;
        }

        @media (max-width: 860px) {
          .dcc-site-header__inner,
          .dcc-site-shell__inner,
          .dcc-site-footer__inner {
            width: min(1200px, calc(100% - 2rem));
          }

          .dcc-site-header__inner {
            align-items: flex-start;
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
          }

          .dcc-site-header__nav {
            flex-wrap: wrap;
            justify-content: flex-start;
          }

          .dcc-site-header__actions {
            width: 100%;
            justify-content: space-between;
          }
        }

        @media (max-width: 520px) {
          .dcc-site-header__login {
            display: none;
          }

          .dcc-site-header__button {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </header>
  );
}
