// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import { Montserrat, Playfair_Display } from 'next/font/google';
import './globals.css'; // your global styles
import SiteHeader from "@/app/components/dcc/SiteHeader";
import SiteBreadcrumbs from "@/app/components/dcc/SiteBreadcrumbs";
import SiteFooter from "@/app/components/dcc/SiteFooter";
import WhatsLiveFloatingButton from "@/app/components/dcc/next48/WhatsLiveFloatingButton";
import PartnerAnalyticsScript from "@/lib/getyourguide/PartnerAnalyticsScript";
import { getHeaderSearchEntries } from "@/src/data/header-search-registry";
import { SITE_IDENTITY } from "@/src/data/site-identity";

const headingFont = Montserrat({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-heading',
});

const accentFont = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-accent',
});

const GA_MEASUREMENT_ID = "G-S6JEJVWVDT";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_IDENTITY.siteUrl),
  applicationName: SITE_IDENTITY.name,
  title: SITE_IDENTITY.homepageTitle,
  description: SITE_IDENTITY.canonicalDescription,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    siteName: SITE_IDENTITY.name,
    type: "website",
    locale: "en_US",
    url: SITE_IDENTITY.siteUrl,
    title: SITE_IDENTITY.homepageTitle,
    description: SITE_IDENTITY.homepageDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_IDENTITY.homepageTitle,
    description: SITE_IDENTITY.homepageDescription,
  },
  category: "travel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const navCities = getHeaderSearchEntries();

  return (
    <html lang="en">
      <head>
        <link rel="alternate" type="application/json" href="/agent.json" />
        <link rel="alternate" type="text/plain" href="/llms.txt" />
        <link rel="preconnect" href="https://sentry.avs.io" crossOrigin="" />
        <link rel="preconnect" href="https://widget.getyourguide.com" crossOrigin="" />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script src={`/ga-init.js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
        <PartnerAnalyticsScript />
      </head>
      <body className={`${headingFont.variable} ${accentFont.variable}`}>
        <a href="#main-content" className="dcc-skip-link">
          Skip to main content
        </a>
        <SiteHeader cities={navCities} />
        <div id="main-content" className="dcc-site-shell">
          <div className="dcc-site-shell__inner">
            <SiteBreadcrumbs />
            {children}
          </div>
        </div>
        <WhatsLiveFloatingButton />
        <SiteFooter />
      </body>
    </html>
  );
}
