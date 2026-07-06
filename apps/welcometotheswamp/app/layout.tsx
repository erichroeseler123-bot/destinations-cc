import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import PartnerAnalyticsScript from "@/app/components/PartnerAnalyticsScript";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SITE_CONFIG } from "@/app/site-config";
import { buildNetworkEntityGraph } from "@/lib/dcc/networkEntityJsonLd";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-439L31HV9V";

const siteJsonLd = buildNetworkEntityGraph({
  baseUrl: SITE_CONFIG.url,
  name: SITE_CONFIG.name,
  description: SITE_CONFIG.mission,
  relationshipToDcc: "parentOrganization",
  service: {
    name: "New Orleans swamp tour decision support",
    description:
      "A focused decision surface that narrows New Orleans swamp tour options before travelers move into a booking fit.",
    areaServed: [
      { "@type": "City", name: "New Orleans" },
      { "@type": "AdministrativeArea", name: "Louisiana" },
    ],
  },
});

export const metadata: Metadata = {
  title: "Welcome to the Swamp",
  description:
    "Decision-first guidance for choosing the right swamp tour near New Orleans right now without reopening the whole market.",
  alternates: { canonical: `${SITE_CONFIG.url}/` },
  openGraph: {
    title: "Welcome to the Swamp",
    description:
      "Fast decision-first guidance on choosing the right swamp tour from New Orleans right now before you move into booking.",
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
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-wta" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', { page_path: window.location.pathname });
          `}
        </Script>
        <PartnerAnalyticsScript />
        {SITE_CONFIG.swampFareHarborProducts && SITE_CONFIG.swampFareHarborProducts.length > 0 && (
          <Script
            src="https://fareharbor.com/embeds/api/v1/?autolightframe=yes"
            strategy="afterInteractive"
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
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
                  <Link href="/plan">Best tours now</Link>
                </div>
              </div>
              <div className="footer-block">
                <p className="eyebrow">What This Site Does</p>
                <p>
                  We help you choose the swamp tour style that fits your group before you open the booking page.
                </p>
              </div>
              <div className="footer-block">
                <p className="eyebrow">More</p>
                <div className="footer-links">
                  <Link href="/about">About</Link>
                  <Link href="/contact">Contact</Link>
                  <Link href="/faq">FAQ</Link>
                  <Link href="/how-it-works">How it works</Link>
                  <Link href="/editorial-policy">Editorial policy</Link>
                  <Link href="/how-we-rank-tours">How we rank tours</Link>
                  <Link href="/privacy-policy">Privacy policy</Link>
                  <Link href="/privacy">Privacy</Link>
                  <Link href="/terms">Terms</Link>
                  <Link href="/start-here">Start here</Link>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 18, color: "var(--muted)", lineHeight: 1.7 }}>
              Email <a href="mailto:hello@welcometotheswamp.com">hello@welcometotheswamp.com</a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
