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
    name: "New Orleans swamp tour planning",
    description:
      "A boutique New Orleans swamp-tour storefront for comparing airboats, covered boats, pickup, and weather-aware plans.",
    areaServed: [
      { "@type": "City", name: "New Orleans" },
      { "@type": "AdministrativeArea", name: "Louisiana" },
    ],
  },
});

export const metadata: Metadata = {
  title: "Welcome to the Swamp",
  description:
    "The swamp trip worth leaving the Quarter for: airboat, covered boat, hotel pickup, and the easy bayou move.",
  alternates: { canonical: `${SITE_CONFIG.url}/` },
  openGraph: {
    title: "Welcome to the Swamp",
    description:
      "A boutique New Orleans swamp-tour storefront for airboats, covered boats, hotel pickup, and the easy bayou move.",
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
                <p>
                  New Orleans swamp tours made easier: pick the ride style, pickup plan, and booking lane that fits the day.
                </p>
              </div>
              <div className="footer-block">
                <p className="eyebrow">Plan the trip</p>
                <div className="footer-links">
                  <Link href="/airboat-vs-boat">Airboat vs boat</Link>
                  <Link href="/with-kids">With kids</Link>
                  <Link href="/transportation">Transportation</Link>
                  <Link href="/types">Covered boat</Link>
                  <Link href="/plan">Book / compare</Link>
                </div>
              </div>
              <div className="footer-block">
                <p className="eyebrow">Booking note</p>
                <p>
                  Final price, live availability, pickup details, cancellation policy, reviews, and provider terms continue on booking pages.
                </p>
              </div>
              <div className="footer-block">
                <p className="eyebrow">Support</p>
                <div className="footer-links">
                  <Link href="/about">About</Link>
                  <Link href="/contact">Contact</Link>
                  <Link href="/privacy">Privacy</Link>
                  <Link href="/terms">Terms</Link>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 18, color: "var(--muted)", lineHeight: 1.7 }}>
              Email <a href="mailto:hello@welcometotheswamp.com">hello@welcometotheswamp.com</a>
            </div>
            <div className="network-governance-line">
              Part of the Destination Command Center network. WTS keeps the swamp decision local; DCC governs the route context.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
