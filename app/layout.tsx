// app/layout.tsx
import type { Metadata } from "next";
import { headers } from "next/headers";
import { permanentRedirect } from "next/navigation";
import Script from "next/script";
import { JetBrains_Mono, Montserrat, Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import SiteHeader from "@/app/components/dcc/SiteHeader";
import SiteBreadcrumbs from "@/app/components/dcc/SiteBreadcrumbs";
import SiteFooter from "@/app/components/dcc/SiteFooter";
import WhatsLiveFloatingButton from "@/app/components/dcc/next48/WhatsLiveFloatingButton";
import PartnerAnalyticsScript from "@/lib/getyourguide/PartnerAnalyticsScript";
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

const sansFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  display: 'swap',
  variable: '--font-sans',
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
});

const GA_MEASUREMENT_ID = "G-S6JEJVWVDT";

const JFD_HOSTS = new Set(["juneauflightdeck.com", "www.juneauflightdeck.com"]);
const DELLS_HOSTS = new Set(["welcometothedells.com", "www.welcometothedells.com"]);
const JFD_PUBLIC_PATHS = new Set(["/", "/helicopter", "/juneau/helicopter"]);
const DELLS_PUBLIC_PATHS = new Set(["/"]);

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const host = (
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host") ||
    ""
  ).split(":")[0].toLowerCase();
  const brandShell = requestHeaders.get("x-dcc-brand-shell") || "";
  const isWtonotShell = brandShell === "wtonot";
  const isLfseShell = brandShell === "lfse";
  const pathname = requestHeaders.get("x-pathname") || "";
  const isHomepage = pathname === "/";
  const isJfdHost = JFD_HOSTS.has(host);
  const isDellsHost = DELLS_HOSTS.has(host);
  const isSpecialistHost = isJfdHost || isDellsHost;

  // The Juneau and Dells custom domains currently resolve through this monolith.
  // Do not let stale DCC routes leak onto specialist domains. Known legacy Juneau
  // URLs are handled explicitly; everything else collapses to the specialist root.
  if (isJfdHost && pathname && !JFD_PUBLIC_PATHS.has(pathname)) {
    permanentRedirect("/");
  }
  if (isDellsHost && pathname && !DELLS_PUBLIC_PATHS.has(pathname)) {
    permanentRedirect("/");
  }

  return (
    <html lang="en">
      <head>
        {!isSpecialistHost ? <link rel="alternate" type="application/json" href="/agent.json" /> : null}
        {!isSpecialistHost ? <link rel="alternate" type="text/plain" href="/llms.txt" /> : null}
        <link rel="preconnect" href="https://sentry.avs.io" crossOrigin="" />
        <link rel="preconnect" href="https://widget.getyourguide.com" crossOrigin="" />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script src={`/ga-init.js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
        <PartnerAnalyticsScript />
      </head>
      <body className={`${headingFont.variable} ${accentFont.variable} ${sansFont.variable} ${monoFont.variable} ${isWtonotShell ? "bg-[#151515] text-[#fdfbf7]" : ""}`}>
        {isWtonotShell || isLfseShell || isHomepage || isSpecialistHost ? (
          <>
            <a href="#main-content" className="dcc-skip-link">
              Skip to main content
            </a>
            <div id="main-content">{children}</div>
          </>
        ) : (
          <>
            <a href="#main-content" className="dcc-skip-link">
              Skip to main content
            </a>
            <SiteHeader />
            <div id="main-content" className="dcc-site-shell">
              <div className="dcc-site-shell__inner">
                <SiteBreadcrumbs />
                {children}
              </div>
            </div>
            <WhatsLiveFloatingButton />
            <SiteFooter />
          </>
        )}
      </body>
    </html>
  );
}
