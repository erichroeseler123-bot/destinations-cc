import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SITE_CONFIG } from "@/app/site-config";
import "./globals.css";

export const metadata: Metadata = {
  title: "Welcome to the Swamp",
  description:
    "Decision-first guidance for choosing the right swamp tour near New Orleans before you review the shortlist.",
  alternates: { canonical: `${SITE_CONFIG.url}/` },
  openGraph: {
    title: "Welcome to the Swamp",
    description:
      "Fast decision-first guidance on choosing the right swamp tour from New Orleans before you move into the shortlist.",
    url: `${SITE_CONFIG.url}/`,
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="alternate" type="application/json" href="/agent.json" />
        <link rel="alternate" type="text/plain" href="/llms.txt" />
      </head>
      <body>
        <div className="shell shell-chrome">
          <SiteHeader />
          {children}
          <footer className="site-footer">
            <div className="footer-grid">
              <div className="footer-block">
                <p className="eyebrow">Welcome to the Swamp</p>
                <p>{SITE_CONFIG.mission}</p>
              </div>
              <div className="footer-block">
                <p className="eyebrow">Core sections</p>
                <div className="footer-links">
                  <Link href="/airboat-vs-boat">Airboat vs boat</Link>
                  <Link href="/with-kids">With kids</Link>
                  <Link href="/best-time">Best time</Link>
                  <Link href="/transportation">Transportation</Link>
                  <Link href="/types">Tour types</Link>
                  <Link href="/plan">Plan your tour</Link>
                </div>
              </div>
              <div className="footer-block">
                <p className="eyebrow">More</p>
                <div className="footer-links">
                  <Link href="/about">About</Link>
                  <Link href="/privacy">Privacy</Link>
                  <Link href="/terms">Terms</Link>
                  <a href={`${SITE_CONFIG.dccOrigin}/new-orleans`}>Explore New Orleans on DCC</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
